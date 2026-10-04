## What it does

`/orchestrate` turns the coding agent into the orchestrator of a relay. The agent keeps the repo, the tools, and the final say; a separate chat model — one with no tools, no repo access, and no memory of your task — acts as a specialist for reasoning, design, and code. The agent writes one self-contained brief, you paste it into the specialist chat, you paste the reply back, and the agent salvage-integrates it: it reads the reply against the actual repo and requirements, keeps what survives, corrects or rejects the rest, validates, and only then writes the next brief. The loop runs until the work is done; a small task may need a single round.

You can invoke it by typing `/orchestrate`, and it is model-invoked — the agent starts the loop on its own when you name the specialist, when you hand back a specialist reply to integrate, or when a task is too large or design-heavy to cross into a chat model in one pass.

## When to reach for it

Reach for it when the work genuinely benefits from a second, stronger reasoning pass and will not fit in a single crossing:

- A design decision with real alternatives, where you want a non-agentic model to think hard without being able to touch files.
- A task that only fits in sequential deliverables, each depending on the last — the agent carries the validated result of one round into the next brief.
- Any moment you have a specialist's answer in your clipboard and want it integrated rather than pasted wholesale.

If the whole task fits one prompt and one reply, it is not an orchestration problem; [minimize-iteration](https://aihero.dev/skills-minimize-iteration) is the cheaper tool.

## Why one self-contained brief at a time

The specialist starts every message from zero. It cannot open a file, ask the repo a question, or remember what you discussed earlier, and it has a finite [context window](https://www.aihero.dev/ai-coding-dictionary/context-window) and a timeout. Everything it needs has to be in the brief, and nothing else should be, because unrelated material costs context the task could have used. That is why the agent inspects the repo first and sends briefs sized to the limits rather than dumping the conversation across.

Salvage-integration is the other half. A reply from a model that has never seen the repo will contain good reasoning wrapped around guesses — wrong paths, stale interfaces, conventions it could not know. Pasting it in wholesale imports the guesses. Reading it against the repo, keeping the useful parts and validating the result is what makes the specialist's output safe to land, and it also makes the next brief accurate, because it is written from the repo as it now is rather than from what the specialist assumed.

The three skills around cross-chat work differ by what crosses and how often:

| Skill | What crosses | How often |
| --- | --- | --- |
| `/orchestrate` | One curated brief at a time, each built from the current repo state | Repeated rounds until the task is complete |
| `/minimize-iteration` | The shortest prompt that still delegates the task | Once |
| `/handoff` | A compacted record of a whole conversation | Once, to resume elsewhere |

## Common questions

**Why not just paste the whole conversation into the specialist chat?** Because the specialist has no repo and a limited context; a transcript is mostly material it cannot use and will push the actual question out. A brief gives it the exact excerpts, constraints, and acceptance criteria it needs and nothing more.

**Why doesn't the agent just apply the specialist's answer?** Because the answer was written blind. It may reference files that do not exist or interfaces that have changed. Salvage-integration keeps the reasoning and discards the guesses, and the validated result is what the next brief is built from.

**Is one round enough?** Often, yes. The loop is defined by the shape of each crossing, not by how many there are; a small task finishes after a single brief and reply.

## It's working if

- Every brief you paste stands on its own — the specialist never has to ask for a file, a decision, or a piece of history it was not given.
- You receive exactly one brief, and the agent waits for the pasted reply before producing the next.
- The reply never lands in the repo verbatim; what lands has been checked against actual files and validated, and the agent says what it kept and what it rejected.
- Each new brief reflects the repo as it is after integration, not as the specialist imagined it.
- The agent names any blocker or validation it could not perform instead of letting it pass silently.

## Where it fits

`/orchestrate` sits next to [minimize-iteration](https://aihero.dev/skills-minimize-iteration), which handles the single compressed crossing because the chat service routes by token count and a one-shot prompt should pay only for what the target cannot infer; orchestrate takes over when one crossing cannot carry the work. It also neighbours [handoff](https://aihero.dev/skills-handoff), which compacts an entire conversation into a portable document because the goal there is to resume the same work elsewhere, not to delegate a piece of it to a specialist that keeps nothing. For the router over the whole set, see [ask-matt](https://aihero.dev/skills-ask-matt).
