import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: null,
    blocks: [
      {"kind":"p","text":"Render and Neon are a strong combination for portfolio projects because they let you spend less time managing servers and more time solving difficult software problems."},
      {"kind":"p","text":"Think of **Render as the execution layer**: it runs your frontend, APIs, background workers, and scheduled jobs. Think of **Neon as the durable memory of the system**: it provides PostgreSQL, where your application stores information that must survive crashes and deployments."},
      {"kind":"p","text":"The strongest projects are not necessarily the ones with the most technologies. They are the ones where you can explain:"},
      {"kind":"callout","variant":"key","text":"“Here is what must always be true. Here is what can fail. Here is how the system behaves when it does. Here is the evidence.”"},
      {"kind":"p","text":"That is the difference between a project that looks advanced and one that demonstrates senior engineering."},
      {"kind":"p","text":"Below are six projects that work well with this stack. Each explores a different kind of correctness: reliable execution, financial consistency, collaborative convergence, information security, time-dependent data, and infrastructure reconciliation."},
    ],
  },
  {
    heading: "First, understand the basic architecture",
    blocks: [
      {"kind":"p","text":"For most of these projects, begin with one codebase deployed as two Render services: an API and a background worker. The API handles interactive requests; the worker performs slower or retryable work. Both connect to Neon."},
      {"kind":"p","text":"A frontend can be a Render static site, or a web service if it needs server-side rendering. Render cron jobs can handle periodic maintenance, such as cleaning up expired resources."},
      {"kind":"p","text":"Keep application instances mostly stateless. A process can restart, so important work cannot exist only in its memory. Store durable state in Neon. For large uploaded files, consider separate object storage rather than treating either the application filesystem or PostgreSQL as an unlimited file bucket."},
      {"kind":"p","text":"The central architectural lesson is this:"},
      {"kind":"p","text":"**A PostgreSQL transaction can make database changes all-or-nothing. It cannot automatically make those changes and an ordinary outgoing HTTP request all-or-nothing.**"},
      {"kind":"p","text":"Much of serious backend engineering happens at that boundary."},
    ],
  },
  {
    heading: "1. A durable workflow automation platform",
    blocks: [
      {"kind":"p","text":"Build a small, deliberately scoped alternative to Zapier or a workflow orchestrator."},
      {"kind":"p","text":"A user defines a process such as: receive a webhook, validate its payload, call an external API, wait for approval, and send a notification. Your platform tracks execution and recovers when services fail."},
      {"kind":"p","text":"On Render, the API receives triggers and serves the dashboard. Background workers execute steps. Neon stores workflow definitions, definition versions, executions, step attempts, timers, and audit history."},
    ],
  },
  {
    heading: "What makes this advanced",
    blocks: [
      {"kind":"p","text":"A workflow should be a **durable state machine**: its current position and permitted transitions are recorded in the database, not remembered by a running function."},
      {"kind":"p","text":"Workers can claim jobs using PostgreSQL locking patterns such as `FOR UPDATE SKIP LOCKED`. Claim work in a short transaction, commit, and perform the slow operation afterward. An expiring lease allows another worker to recover abandoned jobs. Conditional updates prevent an obsolete worker from overwriting a newer attempt’s state."},
      {"kind":"p","text":"Introduce **idempotency**, meaning repeated delivery of the same request does not create repeated logical effects. Introduce a **transactional outbox**, meaning an application update and its intent to publish an event are committed together."},
      {"kind":"p","text":"The important nuance is that an outbox does not magically provide exactly-once delivery. Workers can still send a message twice. Your own database can deduplicate local effects, but external effects require cooperation from the receiving API, or a reconciliation strategy."},
      {"kind":"p","text":"Also pin each execution to a workflow version. Editing a workflow should not silently change the meaning of an execution already in progress."},
    ],
  },
  {
    heading: "The portfolio demonstration",
    blocks: [
      {"kind":"p","text":"Terminate a worker immediately after an external request succeeds but before completion is recorded. Restart it and show what happens."},
      {"kind":"p","text":"Use an idempotent test receiver to demonstrate safe retries, then explain the limitation when a receiver offers no idempotency support."},
      {"kind":"p","text":"This is much more compelling than a beautiful workflow editor. It demonstrates that you understand the awkward space between “the request succeeded” and “the system knows it succeeded.”"},
      {"kind":"p","text":"**Best fit:** backend engineering, integrations, distributed systems, platform engineering."},
    ],
  },
  {
    heading: "2. A financial ledger and wallet simulator",
    blocks: [
      {"kind":"p","text":"Build a fake-money wallet system with transfers, holds, refunds, transaction history, and reconciliation. Keep it a simulation rather than handling real customer funds."},
      {"kind":"p","text":"The essential challenge is not displaying a balance. It is keeping the accounting correct under concurrency, retries, and partial failure."},
      {"kind":"p","text":"Render hosts the API and reconciliation workers. Neon stores accounts, journal transactions, postings, idempotency records, and audit data."},
    ],
  },
  {
    heading: "What makes this advanced",
    blocks: [
      {"kind":"p","text":"Use **double-entry accounting**: each financial movement creates balanced postings. For each currency, debits and credits must balance. All postings belonging to a transaction must commit together."},
      {"kind":"p","text":"Use integer minor units or an explicitly defined decimal representation, not floating-point arithmetic for monetary amounts."},
      {"kind":"p","text":"Treat journal entries as immutable. Corrections are new reversing or adjusting entries, not edits that erase history."},
      {"kind":"p","text":"Then address concurrency. If two transfers attempt to spend the same available funds, both must not independently approve themselves using an outdated balance. You can solve this with carefully ordered account locks, or serializable transactions with retry handling. The interesting portfolio material is your explanation of the choice."},
      {"kind":"p","text":"A cached balance can accelerate reads, but spending limits must be enforced against authoritative, transactionally protected state—not an eventually updated dashboard projection."},
      {"kind":"p","text":"This naturally introduces **CQRS**: separating the authoritative write model from read-optimized representations. You do not need separate microservices to use the idea."},
    ],
  },
  {
    heading: "The portfolio demonstration",
    blocks: [
      {"kind":"p","text":"Send concurrent transfers and replay identical requests. Show that one idempotency key produces one logical transfer, spending rules remain satisfied, and the journal stays balanced."},
      {"kind":"p","text":"Then rebuild a balance projection from the journal and compare the result with the existing projection."},
      {"kind":"p","text":"Property-based testing is especially useful here: generate many transaction sequences and check the invariants after each sequence."},
      {"kind":"p","text":"**Best fit:** backend engineering, fintech, transactional systems, data integrity."},
    ],
  },
  {
    heading: "3. A local-first collaborative incident workspace",
    blocks: [
      {"kind":"p","text":"Build a shared workspace for incident response: an editable incident document, timeline, checklist, and live participant presence."},
      {"kind":"p","text":"Several people should be able to edit the same document. Someone should also be able to temporarily lose connectivity, continue editing, and reconnect."},
      {"kind":"p","text":"Render hosts the application and WebSocket connections. Neon stores durable document updates, snapshots, incident metadata, and permissions."},
    ],
  },
  {
    heading: "What makes this advanced",
    blocks: [
      {"kind":"p","text":"Use a library such as **Yjs**, which implements CRDTs: data structures designed so independently produced edits can merge and converge when updates are eventually exchanged."},
      {"kind":"p","text":"A useful architectural distinction is that not every piece of state belongs in a CRDT."},
      {"kind":"p","text":"Collaborative text benefits from mergeable edits. Permissions, ownership changes, and sensitive workflow actions usually benefit from explicit, transactionally checked commands. “These updates can merge” does not mean “these updates are authorized.”"},
      {"kind":"p","text":"Separate durable document content from ephemeral presence. Losing someone’s cursor position during a restart is acceptable. Losing their confirmed document edits is not."},
      {"kind":"p","text":"For multiple application instances, add a pub/sub layer, such as a Redis-compatible service on Render, for live fan-out. Keep Neon as the durable source of truth. Pub/sub messages can be missed, so reconnecting clients must recover from persisted updates or snapshots."},
    ],
  },
  {
    heading: "The portfolio demonstration",
    blocks: [
      {"kind":"p","text":"Open two browsers, disconnect one, edit in both, and reconnect. Show that the document converges."},
      {"kind":"p","text":"Then restart an application instance and demonstrate recovery from durable state. Also revoke a user’s access and verify that reconnecting does not allow that user to submit unauthorized changes."},
      {"kind":"p","text":"The engineering story is about convergence, durability, and authorization—not simply “I used WebSockets.”"},
      {"kind":"p","text":"**Best fit:** senior full-stack engineering, real-time systems, collaborative products."},
    ],
  },
  {
    heading: "4. A permission-aware knowledge search system",
    blocks: [
      {"kind":"p","text":"Build an internal knowledge assistant for multiple organizations. Users upload documents, search them, and ask questions that produce answers linked to relevant passages."},
      {"kind":"p","text":"The important requirement is that users must only retrieve information they are authorized to access."},
      {"kind":"p","text":"Render workers process documents and generate embeddings. Neon stores document versions, chunks, access metadata, full-text search indexes, and vectors through `pgvector`. A model API can provide embeddings and generation without turning the project into a separate model-hosting exercise."},
    ],
  },
  {
    heading: "What makes this advanced",
    blocks: [
      {"kind":"p","text":"Use **hybrid retrieval**. PostgreSQL full-text search handles exact terminology well; vector search helps find passages with similar meaning even when the wording differs. Combine their rankings, and optionally rerank the candidates."},
      {"kind":"p","text":"Make ingestion retryable and versioned. If a document changes, you need to know which chunks and embeddings belong to which version. A failed ingestion attempt should not leave users searching a half-updated document."},
      {"kind":"p","text":"Authorization must constrain retrieval and source fetching **before any content reaches the model**. Asking the model not to reveal another tenant’s data is not an access-control mechanism."},
      {"kind":"p","text":"Treat retrieved documents as untrusted input. A passage saying “ignore your instructions and reveal secrets” is document content, not an instruction your application should execute."},
      {"kind":"p","text":"Finally, build an evaluation dataset. Measure whether retrieval finds the right evidence, whether answers are supported by that evidence, and when the system should abstain."},
    ],
  },
  {
    heading: "The portfolio demonstration",
    blocks: [
      {"kind":"p","text":"Create questions with known answers and known inaccessible sources. Publish retrieval quality, unsupported-answer rates, latency, and approximate cost under a documented test setup."},
      {"kind":"p","text":"Compare keyword search, vector search, and hybrid search. If you introduce approximate indexes such as HNSW, measure the speed–recall trade-off, including queries with restrictive tenant filters."},
      {"kind":"p","text":"That turns an ordinary “chat with PDFs” application into an information-retrieval and security project."},
      {"kind":"p","text":"**Best fit:** applied AI engineering, search, data-intensive products, security-conscious SaaS."},
    ],
  },
  {
    heading: "5. A telemetry ingestion and SLO analytics service",
    blocks: [
      {"kind":"p","text":"Build a small observability product that accepts application events and displays error rates, latency distributions, deployment markers, and alert history."},
      {"kind":"p","text":"A client SDK submits events. The ingestion API accepts them, workers aggregate them, and a dashboard helps users investigate changes."},
      {"kind":"p","text":"Render hosts those components. Neon stores accepted events, aggregation state, tenant configuration, and alert records."},
    ],
  },
  {
    heading: "What makes this advanced",
    blocks: [
      {"kind":"p","text":"Start with the distinction between **event time** and **processing time**."},
      {"kind":"p","text":"Event time is when something happened. Processing time is when your server received it. A mobile client might upload yesterday’s events today. Your system needs an explicit policy for whether those events update historical reports, trigger alerts, or are excluded from certain calculations."},
      {"kind":"p","text":"Handle duplicate delivery without double-counting. Version your event schema so older SDKs can continue sending data after the server evolves."},
      {"kind":"p","text":"Implement **backpressure**: when processing falls behind, the system should apply limits or slow producers rather than accept unlimited work until it collapses."},
      {"kind":"p","text":"PostgreSQL gives you plenty to investigate: bulk inserts, execution plans, B-tree and BRIN indexes, partitioning, retention, and incremental aggregates. Introduce each optimization in response to measurements, not because it looks sophisticated."},
      {"kind":"p","text":"A subtle analytics lesson: averaging several p95 latency values does not produce the overall p95. Use an appropriate underlying representation, such as mergeable histograms, or calculate from the relevant raw observations."},
    ],
  },
  {
    heading: "The portfolio demonstration",
    blocks: [
      {"kind":"p","text":"Generate a reproducible workload containing duplicates, late events, malformed events, and bursts. Restart the aggregation worker during processing."},
      {"kind":"p","text":"Show which guarantees hold, how far aggregation lags behind ingestion, and where throughput stops scaling."},
      {"kind":"p","text":"Do not claim to have built Datadog. A carefully measured small system with explicit limits is a stronger engineering artifact than an exaggerated scale claim."},
      {"kind":"p","text":"**Best fit:** data engineering, backend performance, observability, infrastructure products."},
    ],
  },
  {
    heading: "6. A pull-request preview environment control plane",
    blocks: [
      {"kind":"p","text":"This is the project most specifically suited to Render and Neon."},
      {"kind":"p","text":"Build a developer tool that creates an isolated application environment for each pull request. It provisions a Neon database branch, runs migrations and seed operations, deploys the application on Render, reports the preview URL, and removes the resources when they are no longer needed."},
      {"kind":"p","text":"Use a separate control-plane database to track environment state and provider resource identifiers."},
    ],
  },
  {
    heading: "What makes this advanced",
    blocks: [
      {"kind":"p","text":"There is no single transaction covering GitHub, Render, and Neon. Branch creation can succeed while deployment fails. A provider request can time out after the provider has actually created the resource."},
      {"kind":"p","text":"The right mental model is **reconciliation**: repeatedly compare desired state with actual state, then perform safe actions to close the gap."},
      {"kind":"p","text":"This is the same broad idea behind infrastructure controllers. Your tool should eventually converge toward “preview ready” or “preview removed,” even after crashes and duplicate webhook deliveries."},
      {"kind":"p","text":"Add retryable provisioning stages, cleanup of abandoned resources, expiry policies, budget limits, and an audit trail."},
      {"kind":"p","text":"Database branching also creates an important security question. An isolated branch is not automatically sanitized. Branch from safe development data rather than copying sensitive production data into arbitrary previews. Keep provisioning credentials away from untrusted pull-request code."},
    ],
  },
  {
    heading: "The portfolio demonstration",
    blocks: [
      {"kind":"p","text":"Deliberately fail provisioning halfway through. Restart the controller and show that it discovers existing resources, resumes safely, and does not create endless duplicates."},
      {"kind":"p","text":"Then close the pull request during provisioning and show that cleanup eventually wins."},
      {"kind":"p","text":"You can also demonstrate backward-compatible schema migrations: add new structures, transition the application, and remove old structures only after old code no longer depends on them."},
      {"kind":"p","text":"**Best fit:** platform engineering, developer experience, DevOps, infrastructure automation."},
    ],
  },
  {
    heading: "The foundation that makes any of these look senior",
  },
  {
    heading: "Make tenancy a real security boundary",
    blocks: [
      {"kind":"p","text":"For multi-tenant projects, use PostgreSQL row-level security where appropriate, alongside application authorization."},
      {"kind":"p","text":"Explain it simply: even if an application query accidentally omits an organization filter, the database should still restrict which rows the application role can access."},
      {"kind":"p","text":"Use a non-owner runtime role without `BYPASSRLS`. Derive tenant context from verified membership, not merely a tenant identifier supplied by the client."},
      {"kind":"p","text":"With transaction pooling, make tenant context transaction-scoped. Do not set a session variable once and assume every later query will use the same database connection."},
    ],
  },
  {
    heading: "Make failures observable",
    blocks: [
      {"kind":"p","text":"Instrument requests and background jobs with OpenTelemetry. Connect a user-visible operation to its database work, queued job, retries, and external calls."},
      {"kind":"p","text":"Useful measurements include queue age, processing lag, retry rates, dead-letter counts, connection saturation, and latency percentiles. Redact secrets and sensitive payloads."},
      {"kind":"p","text":"A dashboard should help answer “Why is this workflow stuck?” rather than merely display colorful CPU charts."},
    ],
  },
  {
    heading: "Test the awkward boundaries",
    blocks: [
      {"kind":"p","text":"Unit tests are necessary, but they rarely establish distributed correctness."},
      {"kind":"p","text":"Add integration tests against real PostgreSQL, concurrency tests, and targeted failure injection. Stop a process after a database commit but before a response. Deliver the same webhook several times. Run an older application version against a newly expanded schema."},
      {"kind":"p","text":"Tools such as Testcontainers, k6, and property-based testing libraries can help, but the test scenarios matter more than the brand names."},
    ],
  },
  {
    heading: "Publish evidence, not just architecture diagrams",
    blocks: [
      {"kind":"p","text":"Your repository should explain the system’s invariants, failure model, security boundaries, and known limitations."},
      {"kind":"p","text":"Include a few short architecture decision records: why you chose PostgreSQL-backed jobs, why a read model may lag, why a particular operation requires stronger consistency."},
      {"kind":"p","text":"For performance claims, publish the dataset size, workload, service configuration, and measurement method. Distinguish targets from measured results."},
      {"kind":"p","text":"A five-minute demo of recovery from a real failure often says more than twenty screenshots of a happy path."},
    ],
  },
  {
    heading: "A sensible technology stack",
    blocks: [
      {"kind":"p","text":"A strong default would be **TypeScript, React, Fastify, PostgreSQL, and Drizzle**, with SQL migrations for database features that deserve explicit control. Package services with Docker, automate checks through GitHub Actions, and add OpenTelemetry plus a load-testing tool."},
      {"kind":"p","text":"If you are stronger in Go or Python, use those instead. Seniority is demonstrated by your decisions, not by selecting the fashionable language."},
      {"kind":"p","text":"Start with a modular monolith and a separate worker process. Add a broker, specialized search engine, or workflow service only when you can explain the limitation it solves."},
    ],
  },
  {
    heading: "What I would build first",
    blocks: [
      {"kind":"p","text":"For the strongest general senior-backend portfolio, I would choose the **durable workflow platform**."},
      {"kind":"p","text":"Begin with one webhook trigger, two predefined step types, and an execution-history screen. Then introduce persistence, retries, idempotency, lease recovery, tenancy, observability, and failure tests. Build the fancy visual editor last."},
      {"kind":"p","text":"For a platform-engineering portfolio, choose the **preview environment control plane**. It makes unusually good use of Neon branching and Render deployments while exposing meaningful distributed-systems problems."},
      {"kind":"p","text":"For an AI role, choose the **permission-aware knowledge system**, but make evaluation and access isolation its headline features—not the chat interface."},
      {"kind":"p","text":"One finished, rigorously tested flagship project is worth more than six impressive-looking skeletons."},
    ],
  },
  {
    heading: "Practical hosting considerations",
    blocks: [
      {"kind":"p","text":"Check current Render and Neon plan limits before committing to always-on workers, previews, extensions, or a large number of database branches. Do not assume a free tier provides production-like availability or latency."},
      {"kind":"p","text":"Choose geographically close regions where possible. Account for cold starts where services can sleep. Remember that frequent worker polling can keep database compute active and affect cost. Use pooled connections for ordinary application traffic, and direct connections where migration tooling or session-dependent operations require them."},
      {"kind":"p","text":"The goal is not to disguise a pet project as a massive production platform. It is to demonstrate that you understand how a small system becomes dependable—and exactly where its guarantees end."},
    ],
  },
];;
