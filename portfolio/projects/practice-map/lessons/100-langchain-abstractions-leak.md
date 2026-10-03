<!-- lesson-meta: {"practicePrompt":"Build a minimal tool-calling agent by hand: define a tool with the @tool decorator, bind it to a chat model, then write your own loop that executes each tool_calls entry, appends the result as a ToolMessage with the matching id, and calls the model again until it replies with no tool calls. Then run the same flow with a checkpointer and a thread_id in the config and verify a second invoke resumes the first one's state.","checkPrompt":"Be able, without notes, to name the load-bearing abstractions (role-tagged messages, the chat-model interface, the tool-call schema, documents and retrievers, the runnable protocol, the LangGraph state graph) and for each say what it normalizes and where it leaks."} -->
<!-- lesson-theory: {"problem":"The framework has been rewritten in place several times, so tutorials and docs mix four eras of the same API — prompt-parsing agents, AgentExecutor, old memory classes, the LangGraph stack — all still indexed by search engines. Newcomers cannot tell the stable center from churning surface.","model":"A three-layer map (langchain-core plus partner packages below, LangGraph in the middle, the slimmed langchain agent API on top, LangSmith aside) crossed with a verdict axis: load-bearing versus incidental — abstractions that normalize mechanics survive, those that normalize judgment leak.","mechanics":"Messages are the provider-neutral unit of conversation state; chat models normalize tool_calls and structured output, and streaming rides mergeable chunks. Every component is a Runnable sharing a config whose callbacks carry tracing. LangGraph adds state with reducers, nodes and edges; checkpointers snapshot state per superstep into threads, enabling memory, fault tolerance, time travel, and interrupts. An agent is a tool-calling loop over that state.","pitfalls":["A message list built for one provider is not valid for another once multimodal or reasoning content is involved.","Structured output and tool calling do not end prompt engineering — tool descriptions are prompts in disguise, and providers drop schema constraints.","Silent streaming or tracing failures usually mean broken config propagation fragmenting the run tree into disconnected roots.","LCEL pipe syntax is incidental — it hides coercions, blocks streaming at RunnableLambda, and cannot express loops; LangGraph exists for that.","ConversationBufferMemory and AgentExecutor in tutorials are historical artifacts; conversation state is a message list you persist and curate."],"whenNot":"For a single-shot call to one provider, a provider SDK plus a tracing tool serves just as well — the payoffs are provider swapping, tracing, and durable multi-step workflows."} -->

# LangChain, from the Ground Up: Concepts, Vocabulary, and Where the Abstractions Leak

LangChain is an open-source framework, available in Python and JavaScript/TypeScript, for building software around large language models. A *large language model* (LLM) is a neural network that takes a sequence of text, or increasingly text mixed with images and audio, and produces a continuation. LangChain began in late 2022 as a small library of reusable "chains," meaning fixed sequences of model calls and glue code. It has since been rewritten in place several times, and the history matters for reading it. Much of the confusion newcomers feel comes from tutorials, Stack Overflow answers, and even official docs written against different eras of the same project, all still indexed by search engines. One caution applies throughout this explainer. I describe the framework as of roughly the LangChain 1.0 and LangGraph 1.0 releases in autumn 2025. I am confident about the architecture's broad shape and its evolution, but less confident about exact function signatures and very recent renamings. Where that uncertainty matters, I say so.

The problem LangChain originally set out to solve was heterogeneity and boilerplate. Every model provider (OpenAI, Anthropic, Google, Mistral, local runtimes like Ollama) exposes a slightly different HTTP API, with different names for the same ideas, different message formats, and different ways of requesting structured output or tool use. Meanwhile, almost every LLM application repeats the same glue work. It fills a prompt with variables, calls a model, parses the reply, perhaps fetches documents to stuff into the prompt, perhaps loops while the model asks to call functions. LangChain's bet was that a common vocabulary and a common set of interfaces would let you swap providers and compose these steps without rewriting everything. The bet partly paid off and partly did not. Understanding which parts paid off is the main thing a senior engineer should take away.

## Packaging and the load-bearing core

Before the concepts, a word on packaging, because the package split encodes the framework's own judgment about what is load-bearing. Through 2024, LangChain divided into several distributions. `langchain-core` holds the base abstractions and the composition machinery. *Partner packages* such as `langchain-openai` or `langchain-anthropic` implement those abstractions for one provider. `langchain-community` is a large, loosely maintained bag of third-party integrations. `langchain` itself held higher-level application logic. With the 1.0 release, the `langchain` package was deliberately slimmed down around a new agent API, and the older high-level classes were moved into a package called `langchain-classic`. I am fairly but not entirely certain of that name and of exactly which classes moved. The practical rule survives any such detail. Code that imports from `langchain_core` and from partner packages is touching the stable center. Code that imports long-tail classes from `langchain` or `langchain_community` is touching surface that has churned and will likely churn again.

## Chat models and messages

The first load-bearing concept is the *chat model*. LangChain distinguishes two model interfaces. The older *LLM* interface takes a string and returns a string, mirroring the original completion-style APIs. The *chat model* interface takes a list of messages and returns a message. Nearly all modern providers are chat-shaped, so the LLM interface is effectively legacy, and you should think "chat model" whenever the docs say "model." A chat model in LangChain is any subclass of `BaseChatModel`, for instance `ChatOpenAI` or `ChatAnthropic`. There is also a helper, `init_chat_model`, that constructs one from a provider-and-model string so that switching vendors becomes a configuration change.

The *message* is arguably the single most important data structure in the framework. A message is a typed record with a role and content. A `SystemMessage` carries the developer's standing instructions to the model. A `HumanMessage` carries user input. An `AIMessage` carries the model's reply. A `ToolMessage` carries the result of a function the model asked to have executed. *Content* was originally just a string. It has grown into a list of typed *content blocks*: text, images, audio, provider-specific "reasoning" traces, citations, and so on. An `AIMessage` also carries several normalized side channels:

- `tool_calls`: the model's requests to invoke functions.
- `usage_metadata`: token counts.
- `response_metadata`: whatever provider-specific extras did not fit the standard shape, such as stop reasons or log probabilities.

The problem messages solve is real and permanent. Conversation state needs a provider-neutral representation, and the message list is the lingua franca between every other component.

Messages also leak, and the leak is instructive. Providers disagree on things the abstraction cannot paper over. Some allow multiple system messages and some allow only one at the start. Some require strict alternation of user and assistant turns. They encode images and documents differently. They expose "thinking" or reasoning content in incompatible shapes, sometimes with cryptographic signatures that must be passed back verbatim. LangChain's 1.0 release introduced a standardized content-block view that normalizes these across providers. I would treat the exact shape of that standard view as still settling. The deeper point is that a message list built for one provider is not guaranteed to be valid for another, especially once multimodal or reasoning content is involved. Provider-swapping works cleanly for plain text and degrades as you use more of each provider's distinctive features.

## Streaming and chunks

A closely related concept is the *chunk*. When you stream a response token by token, LangChain yields `AIMessageChunk` objects. Chunks are designed to be additive: adding two chunks with the `+` operator merges their content, and in particular reassembles partially streamed tool-call arguments. This is a small, elegant piece of design, and it is load-bearing. Streaming is how LLM applications feel responsive, and making partial messages a first-class, mergeable type is what lets streaming propagate through larger compositions. The leak is that partial tool-call arguments are fragments of JSON that are not valid until complete. Any code that wants to act on a tool call mid-stream must tolerate unparseable intermediate states.

## Prompt templates

On the input side sits the *prompt template*, an object that turns a dictionary of variables into model input. A `PromptTemplate` produces a string. A `ChatPromptTemplate` produces a list of messages from a sequence of role-tagged templates. A `MessagesPlaceholder` is a slot within a chat template into which an entire list of messages, typically the conversation history, is spliced at runtime. Prompt templates solve a modest problem: separating the fixed wording of a prompt from its variable parts, and validating that all variables are supplied. They are useful but not deep. Many experienced users write prompts as ordinary f-strings or functions that build message lists, and lose very little. The leak is that templating syntax (curly braces) collides with literal braces in prompts that contain JSON or code examples. This produces a perennial class of confusing errors fixed by doubling the braces. I would classify prompt templates as convenient but incidental.

## Output parsers and structured output

At the other end of a model call, you often want something more useful than prose. The framework's first answer was the *output parser*, an object that takes model text and converts it into a Python value. Examples include `StrOutputParser`, which simply extracts the text, `JsonOutputParser`, and `PydanticOutputParser`, which validates against a *Pydantic* model. Pydantic is a widely used Python library for declaring typed data schemas. Parsers solved the problem of models that could only emit text. They leaked badly, because models frequently produced almost-valid JSON, wrapped it in commentary, or ignored the format instructions the parser had injected into the prompt. Hence a family of "retry" and "fixing" parsers that called the model again to repair its own output.

The modern answer is *structured output* via the `with_structured_output` method on a chat model. You pass a schema (a Pydantic class, a typed dictionary, or a JSON Schema) and get back a new runnable that returns instances of that schema. Under the hood, LangChain chooses among the provider's native mechanisms: tool calling, a JSON mode, or a strict JSON-schema mode, selectable via a `method` argument. This is load-bearing, because getting typed data out of a model is one of the most common needs, and native provider support is far more reliable than prompt-and-parse. It still leaks along predictable lines:

- Providers support different subsets of JSON Schema.
- Some silently drop constraints such as numeric ranges or regex patterns.
- "Strict" modes reject certain schema shapes outright.
- Failures surface differently depending on method.

The `include_raw` option, which returns the raw message alongside the parsed value or parse error, exists precisely because you will need to debug those failures. Output parsers remain in the codebase and are still the right tool for streaming partial JSON, but for most structured-output needs they are now incidental.

## Tools and tool calling

The next foundational concept is the *tool*. A tool is a function the model can request to have called, described to the model by a name, a natural-language description, and a JSON Schema for its arguments. LangChain represents tools as instances of `BaseTool`. Most commonly, you create one with the `@tool` decorator, which infers the schema from the function's type hints and the description from its docstring. *Tool calling*, sometimes called function calling, is the provider capability in which the model, instead of or in addition to replying in prose, emits a structured request naming a tool and supplying arguments.

You attach tools to a model with `bind_tools`. The resulting `AIMessage` carries a `tool_calls` list. Each entry contains a name, an arguments dictionary, and an identifier. You execute the function yourself and send the result back as a `ToolMessage` bearing the matching identifier. Normalizing tool calls across providers into that one `tool_calls` shape, which happened during 2024, was one of the most valuable things LangChain ever did. It is the foundation of everything agentic that follows.

The leaks are worth naming precisely:

- The model, not your code, decides whether and how to call a tool, and it can hallucinate arguments that pass the schema but are semantically wrong.
- Tool descriptions are prompts in disguise. Their wording strongly affects behavior and does not transfer perfectly between providers.
- Parallel tool calls, forced tool choice, and limits on the number of tools vary by provider.
- Schema inference from Python type hints occasionally produces schemas a given provider rejects.

You have not escaped prompt engineering by using tools; you have moved it into docstrings.

## The Runnable protocol and LCEL

Having described the components, we reach the abstraction that ties them together: the *Runnable*. A Runnable is any object that implements a standard execution protocol. That protocol includes `invoke` (process one input), `batch` (process many inputs, with bounded concurrency), and `stream` (yield incremental output), plus asynchronous versions of each (`ainvoke`, `abatch`, `astream`). Chat models, prompt templates, output parsers, retrievers, and tools are all Runnables. So is anything you compose from them. The problem this solves is uniformity. Once everything shares one interface, generic capabilities can be written once and applied everywhere. These capabilities include batching, streaming, retries (`with_retry`), fallbacks to alternative components (`with_fallbacks`), argument pre-binding (`bind`), and attaching configuration (`with_config`). I consider the Runnable protocol load-bearing. Even code that never touches higher-level LangChain features benefits from every model and retriever answering to the same verbs.

On top of Runnables sits the *LangChain Expression Language*, or *LCEL*. LCEL is a composition syntax built on operator overloading. The pipe operator `|` connects Runnables into a `RunnableSequence`, so that `prompt | model | parser` feeds each stage's output into the next. A plain dictionary of Runnables is coerced into a `RunnableParallel` that runs its branches on the same input and returns a dictionary of results. Several helper types fill in the gaps:

- `RunnableLambda` wraps an ordinary function.
- `RunnablePassthrough` forwards its input unchanged, and its `assign` variant adds computed keys to a dictionary flowing through.
- `RunnableBranch` chooses a path conditionally.

LCEL's selling point was that a composed pipeline automatically inherits the full protocol. A sequence streams if its parts stream, batches in parallel, and can be served or traced without extra code.

LCEL is where the framework's reputation for "magic" largely comes from, and its leaks are significant. Pipelines are type-checked only at runtime, and a mismatch between what one stage emits and what the next expects produces errors far from their cause. Implicit coercions, where dictionaries become parallel runnables and functions become lambdas, make code compact but hide behavior. Streaming is only as good as the weakest link. A `RunnableLambda` wrapping an ordinary function consumes its entire input before producing output, silently turning a streaming pipeline into a blocking one unless you write it as a generator that transforms a stream. Most seriously, LCEL expresses directed acyclic data flow well and expresses loops, conditionals over accumulated state, and long-running processes poorly. Those are exactly what agents need. The LangChain team's own response was to build LangGraph for anything non-trivial and to de-emphasize LCEL in newer docs.

My verdict is that the Runnable protocol is load-bearing and the pipe syntax is incidental. You can and should be able to read LCEL, but writing ordinary Python that calls `invoke` on components is a perfectly respectable style.

## Configuration, callbacks, and tracing

Every Runnable method accepts an optional *config*, a `RunnableConfig` dictionary carrying cross-cutting execution context. Its fields include:

- `callbacks`: observers notified of execution events.
- `tags` and `metadata`: labels for tracing and filtering.
- `run_name`: a display name for a step.
- `max_concurrency`: a limit for batch operations.
- `recursion_limit`: a cap on nested or looping execution.
- `configurable`: an open-ended dictionary for runtime parameters, such as a conversation's thread identifier or a user's ID.

The config solves the problem of threading context through deeply nested calls without every function signature mentioning it. It is load-bearing because tracing, persistence, and runtime configuration all ride on it.

The mechanism beneath the config is *callbacks*. A callback handler is an object with methods such as `on_chat_model_start`, `on_llm_new_token`, `on_tool_end`, and `on_chain_error`, invoked as execution proceeds through nested Runnables. Each execution is a *run*, with a unique ID and a parent ID, so the callbacks reconstruct a tree of what happened. Logging, token streaming to user interfaces, cost accounting, and above all *tracing* (recording the full tree of inputs, outputs, and timings for later inspection) are built on this. The `astream_events` method is a higher-level consumer of the same machinery. It yields a flat stream of typed events from every nested step, which is how you can, for example, stream tokens from a model buried three layers deep inside a pipeline.

Callbacks leak through propagation. For a nested call to be traced as a child of its parent, the config must flow into it. In synchronous code and in asynchronous code on Python 3.11 and later, LangChain propagates config automatically using context variables, a Python mechanism for implicitly scoped state. On older Python versions in asynchronous code, and in any custom code that spawns threads or tasks without care, you must pass config explicitly. If you do not, traces fragment into disconnected roots and streaming events silently vanish. This is the most common "why doesn't my streaming work" failure, and it is a direct consequence of implicit context.

## LangSmith

Tracing leads naturally to *LangSmith*, the company's commercial (and partly free) observability and evaluation platform. It is not part of the open-source library, but LangChain emits traces to it with nothing more than an environment variable. It lets you inspect run trees, build datasets of examples, and run *evaluations*, meaning systematic scoring of outputs against references or by model-based judges.

Two things are worth stating plainly. First, the integration is genuinely good, and for many teams tracing alone justifies adopting LangChain's abstractions. Second, there is a commercial gravity here. The framework's design increasingly assumes LangSmith is present, and the boundaries between open-source library and paid platform have shifted more than once. The deployment product formerly called LangGraph Platform is one example. I believe it was folded under the LangSmith brand in late 2025, but treat that naming as uncertain. Tracing is also available via OpenTelemetry-compatible routes and third-party tools, so LangSmith is convenient rather than mandatory.

## Retrieval: documents, embeddings, vector stores, retrievers

Now to retrieval, the domain where LangChain first became popular. *Retrieval-augmented generation*, or *RAG*, is the pattern of fetching relevant text from an external corpus and inserting it into the prompt so the model can answer from information it was not trained on. LangChain's retrieval vocabulary forms a pipeline, and each term names a stage.

A `Document` is the unit of content: a `page_content` string plus a `metadata` dictionary recording source, page number, and anything else useful for filtering or citation. A *document loader* reads some source and produces Documents. Sources include PDFs, web pages, Notion exports, databases, and hundreds of others. A *text splitter* breaks long Documents into smaller *chunks*, because models have limited context and because retrieval works better on focused passages. The workhorse is `RecursiveCharacterTextSplitter`, which tries to split on paragraph breaks, then sentences, then words, until chunks fit a target size with some overlap.

An *embedding model*, represented by the `Embeddings` interface with methods `embed_documents` and `embed_query`, maps text to a vector of numbers such that semantically similar texts land near each other. A *vector store* is a database that stores chunks alongside their embeddings and supports *similarity search*, meaning finding the stored vectors nearest to a query vector. Examples include FAISS, Chroma, pgvector, Pinecone, Elasticsearch, and dozens more. Finally, a *retriever* is any Runnable that takes a query string and returns a list of Documents. A vector store becomes one via `as_retriever`, but a retriever could equally wrap a keyword search engine, a SQL query, or a web search API.

The load-bearing idea here is the retriever as an interface. It cleanly separates "find relevant context" from "use that context." That separation is genuinely useful, and it is why the more sophisticated retrieval strategies compose. Several such strategies exist:

- Multi-query retrieval has a model generate several rephrasings of the question and merges their results.
- Parent-document retrieval indexes small chunks for precise matching but returns the larger passages they came from.
- Self-query retrieval has a model translate a natural-language question into a structured metadata filter.
- Contextual compression post-filters or trims retrieved documents.
- Ensemble retrieval combines, for example, keyword and vector search results.

These are useful as reference implementations of known techniques. They are also incidental API surface that you will often end up rewriting for your own needs.

Retrieval leaks in several places, and they matter more than the abstractions. The vector-store interface is a lowest common denominator, and three gaps show through:

1. **Metadata filtering.** Filter syntax differs per backend, so filter code is not portable.
2. **Score semantics.** Some stores return distances where smaller is better, others similarities where larger is better, with different scales.
3. **Native features.** Hybrid search and reranking live outside the common interface.

Document loaders vary wildly in quality, and PDF and HTML extraction in particular are full of silent garbage. Most importantly, the hard problems of RAG are not addressed by the abstraction at all: how to chunk, what metadata to keep, how to evaluate retrieval quality. A newcomer can assemble a RAG pipeline in twenty lines and be badly misled about its quality. LangChain also provides an *indexing API* with a *record manager* that tracks which documents have been written to a vector store, so re-ingestion skips unchanged content and deletes stale chunks. It is one of the less-known but more practically valuable pieces for production ingestion.

## Memory and conversation history

Conversation *memory*, meaning how an application remembers prior turns, is the clearest case study in churn. The original framework had a family of memory classes, such as `ConversationBufferMemory`, which kept all messages, and `ConversationSummaryMemory`, which kept a running model-written summary. These were attached to legacy chain objects and mutated as a side effect. They were hard to reason about, hard to persist, and unsafe under concurrency.

The next approach was `RunnableWithMessageHistory`, a wrapper that loaded and saved a message list from a pluggable store keyed by a session identifier passed through the config. The current recommendation is to let LangGraph's persistence layer, described below, own conversation state entirely. Message-management utilities such as `trim_messages`, which cuts history to fit a token budget, act on that state.

The underlying problem is permanent. Models are stateless, context windows are finite, and something must decide what history to send. Every iteration of the API has been an attempt to locate that decision correctly. If you meet the old memory classes in a tutorial, treat them as historical. The load-bearing concept is simply that conversation state is a list of messages that you persist and curate.

## Legacy chains

Here is the right place to mention *chains* in the original sense. The `Chain` base class and its many subclasses, such as `LLMChain`, `RetrievalQA`, `ConversationalRetrievalChain`, and `SequentialChain`, were the framework's first composition model. Each declared named input and output keys and bundled a specific prompt with specific logic. They solved the problem of getting a working application fast. They leaked by hiding their prompts, which made customization a matter of subclassing or monkey-patching. They also leaked by tangling memory, callbacks, and composition into one inheritance hierarchy. All of this was deprecated in favor of LCEL and then LangGraph, and it lives on in the classic package for compatibility.

The word "chain" survives informally to mean any composed pipeline. The classes are incidental at best and a trap at worst. A related security footnote: in 2023, several "experimental" chains that executed model-generated Python or math expressions received remote-code-execution vulnerability reports. This is part of why such code was quarantined into a separate `langchain-experimental` package. Similar care applies to LangChain's own serialization format. The framework can save and reload objects via a JSON representation, and deserializing untrusted payloads should be treated as dangerous, as with any such mechanism.

## Agents

We now reach agents, the area of greatest ambition and greatest churn. An *agent*, in LangChain's usage, is a system in which a model decides at runtime which actions to take, typically by calling tools in a loop, rather than following a fixed sequence written by the developer. The canonical loop is simple:

1. Call the model with the conversation and available tools.
2. If the reply contains tool calls, execute them, append the results as tool messages, and call the model again.
3. Stop when the model replies without tool calls.

This pattern descends from *ReAct* ("reasoning and acting"), a 2022 research prompting technique in which the model alternates written "Thought," "Action," and "Observation" steps.

LangChain's agent APIs have gone through at least four generations:

1. **Prompt-parsing agents (2022–2023).** These agents parsed ReAct-style text with regular expressions, constructed via `initialize_agent` with string-named "agent types," and run by an `AgentExecutor` class that owned the loop.
2. **Tool-calling agents (2024).** Constructors such as `create_tool_calling_agent` still used `AgentExecutor` but relied on native tool calling instead of text parsing.
3. **`create_react_agent` (mid-2024 onward).** This prebuilt agent in LangGraph expressed the loop as a graph and inherited LangGraph's persistence and streaming.
4. **`create_agent` (LangChain 1.0).** This constructor in the slimmed `langchain` package is built on LangGraph and extended through *middleware*.

Middleware is a set of hooks that run before or after model calls, wrap model and tool calls, and can modify state or short-circuit execution. It is used for things like summarizing long histories, requiring human approval before certain tools, or dynamically choosing models or tools. I am confident in that overall trajectory and in the existence and purpose of middleware. I am less confident in the exact hook names and how the older LangGraph prebuilt has been positioned relative to the new constructor, so check current docs before relying on specifics.

The load-bearing concept across all four generations is the tool-calling loop itself, along with the observation that the loop is state plus control flow. Everything else has been API surface. Agents leak more than any other abstraction, because the loop hides exactly the decisions that determine whether an agent works:

- When to stop.
- How to handle tool errors, whether by feeding them back to the model or aborting.
- How to keep context from growing without bound.
- How to prevent repetitive loops.
- How to let a human intervene.
- How to recover after a crash halfway through a twenty-step task.

The old `AgentExecutor` offered knobs for some of these, but its loop was a closed box. The move to LangGraph was fundamentally a move to open that box.

## LangGraph: state, nodes, edges, reducers

*LangGraph* is a separate library from the same team. It is the most important thing to understand for advanced LangChain use, and it can be used entirely without the rest of LangChain. It models an application as a *state machine*: a graph whose execution moves through a shared state object. You define a *state schema*, usually a typed dictionary or Pydantic model listing the fields your application tracks. You add *nodes*, which are functions that receive the current state and return a partial update. You connect them with *edges*. A normal edge always goes from one node to the next. A *conditional edge* runs a routing function on the state to decide where to go. Two special markers, `START` and `END`, denote entry and exit. You build this with a `StateGraph`, then *compile* it into a runnable object, which, notably, implements the Runnable protocol.

A key subtlety is the *reducer*. When a node returns an update for a field, the default is to overwrite that field. You can annotate a field with a reducer function that specifies how updates combine with the existing value instead. The canonical example is `add_messages`, which appends new messages to a list while replacing any message that has the same ID. Reducers solve the problem of multiple nodes, possibly running in parallel, contributing to the same field without clobbering each other. They are load-bearing.

They also leak in two ways. First, it is easy to forget a reducer and have parallel branches race, which is an error LangGraph detects and raises. Second, deleting or rewriting history requires knowing the reducer's special conventions, such as returning special removal markers instead of simply a shorter list.

Under the hood, LangGraph's execution model is inspired by *Pregel*, a Google system for large-scale graph computation. Execution proceeds in *supersteps*. In each superstep, all nodes triggered by the previous step run, potentially in parallel, and their updates are applied together through reducers before the next superstep begins. Most users never need this detail. Senior engineers should know it, because it explains several behaviors:

- Parallel branches synchronize before continuing.
- State updates are not visible to sibling nodes within a superstep.
- A *recursion limit* in the config bounds the number of supersteps, to stop runaway loops.

The `Send` primitive lets a routing function dispatch a dynamic number of parallel node invocations, each with its own input, which is LangGraph's answer to map-reduce. *Subgraphs*, meaning compiled graphs used as nodes within larger graphs, let you modularize, at the cost of having to manage how parent and child state schemas map onto each other.

## LangGraph persistence, interrupts, and streaming

The feature that most justifies LangGraph is *persistence*. When you compile a graph with a *checkpointer*, LangGraph saves a snapshot of the state, called a *checkpoint*, after every superstep. Checkpointers come in in-memory, SQLite, and Postgres implementations, among others. Checkpoints are grouped into *threads*, identified by a `thread_id` you pass in the config's `configurable` field. A thread is essentially one conversation or one long-running task. This single mechanism delivers several capabilities that were awkward or impossible before:

- **Conversation memory.** Invoke the same thread again and the prior state is there.
- **Fault tolerance.** Resume from the last checkpoint after a crash.
- **Time travel.** Inspect the state history, fork from an earlier checkpoint, or edit state and re-run.
- **Human-in-the-loop.** Pause for people mid-run.

Human-in-the-loop works via *interrupts*. A node can call an `interrupt` function, which halts execution, saves state, and surfaces a value to the caller, typically a proposed action awaiting approval. The caller later resumes the thread by invoking the graph with a `Command` object carrying the human's response. That response becomes the return value of `interrupt` inside the node.

This is the most significant leak in LangGraph, and it is subtle. On resumption, the interrupted node re-executes from its beginning, not from the line where it paused. Any side effects before the `interrupt` call happen again unless they are idempotent, meaning safe to repeat. Durable execution in general carries this burden: code between checkpoints must tolerate replay. LangGraph offers a *functional API*, with `@entrypoint` and `@task` decorators, as an alternative to explicit graphs, in which completed tasks' results are cached across replays. Still, the developer must understand where the replay boundaries lie. For long-term memory that should outlive any single thread, such as user preferences, LangGraph provides a separate *store* abstraction: a namespaced key-value store, optionally with semantic search, accessible from nodes. Its API has been younger and less stable than checkpointing.

LangGraph's streaming deserves one paragraph because it differs from plain LangChain's. A compiled graph's `stream` method takes a *stream mode*:

- `values`: the full state after each step.
- `updates`: only each node's partial update.
- `messages`: tokens from model calls inside nodes, with metadata about which node produced them.
- `custom`: arbitrary data emitted from within nodes via a writer.
- `debug`: verbose internal events.

Multiple modes can be combined. This is more principled than callback-based event streaming because it is tied to the graph's structure. The token-level `messages` mode, however, still depends on the callback and config propagation described earlier. The same failure modes apply when custom code breaks the context chain.

## How the pieces fit, and what to keep

How do these pieces relate in the current architecture? The cleanest mental model has three layers. At the bottom, `langchain-core` and the partner packages give you provider-neutral models, messages, tools, retrievers, and the Runnable protocol with config and callbacks. In the middle, LangGraph gives you stateful, persistent, interruptible control flow, in which nodes typically call those core components. On top, the slimmed `langchain` package gives you opinionated, prebuilt agents built on LangGraph and customized via middleware. Off to the side, LangSmith observes and evaluates all three. The higher-level packages, community integrations, retrieval strategies, and classic chains are optional accessories, and their quality varies.

So which concepts are load-bearing, in the sense that understanding them pays off regardless of which API generation you meet?

- The message as the unit of conversation state.
- The chat model interface with normalized tool calls and structured output.
- The tool as a schema-described function whose description is itself a prompt.
- The Runnable protocol and the config that flows through it.
- Callbacks as the basis for tracing and streaming.
- The retriever as the boundary between finding and using context.
- The agent as a tool-calling loop over state.
- In LangGraph, state with reducers, nodes and edges, checkpoints and threads, and interrupts with replay semantics.

Which are incidental, in the sense that they are particular spellings that have changed and may change again? The pipe syntax, the legacy chain classes, the old memory classes, `AgentExecutor` and string-typed agent constructors, most specific retriever variants, prompt-template syntax details, and the exact names of prebuilt agent constructors and middleware hooks.

## The pattern behind the leaks

A closing observation ties the leaks together. LangChain's abstractions are strongest where they normalize mechanics: the shape of a message, the protocol for invoking and streaming, the plumbing of tracing, the persistence of state. They are weakest where they try to normalize judgment: what to put in a prompt, how to chunk a document, when an agent should stop, which context to keep. The framework's own evolution has tracked this lesson. Early LangChain hid judgment inside prebuilt chains and agents. Later LangChain exposed control flow in LangGraph and reintroduced convenience through middleware hooks that let you inject judgment at defined points rather than replace a monolith.

A newcomer who learns the load-bearing concepts can read any era's code and see through it. A senior engineer evaluating the framework should ask whether the mechanical normalization, tracing integration, and durable-execution machinery are worth the dependency surface and the churn. For agentic, long-running, or human-supervised workflows, LangGraph's persistence model is the strongest argument. For simple single-call applications, a provider SDK and a tracing tool may serve just as well.
