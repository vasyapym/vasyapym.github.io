## What it does

`/orchestrate` turns the coding agent into the orchestrator of a relay: the agent keeps the repo, the tools, and the final say; a non-agentic specialist in a separate chat supplies the reasoning, design, and code. The agent writes one self-contained brief, you paste it out and paste the reply back, and the agent salvage-integrates it against the actual repo — keeping what survives, correcting or rejecting the rest, validating before the next brief. The defining constraint: everything the specialist needs must cross inside that brief, because the specialist has no tools, no repo access, and no memory between briefs.

Two workflows are bundled inside the same skill. `bytecheck` is byte-exact self-verification — a snapshot before the work, a policy-checked verdict after, a tree hash anyone can recompute — plus byte-exact placement of received code from files instead of retyping it. `review` is the end-of-round bug-finding pass: a fresh reviewer sees the change and the task, ranks what would break, and the agent disposes of each finding before any gate runs.

## When to reach for it

Type `/orchestrate`, or the agent starts the loop itself when you name the specialist, hand back a specialist reply to integrate, or when a task is too large or design-heavy to cross into a specialist chat in one pass. Asking for the byte-check or the review by name runs that part alone.

- Design decisions with real alternatives, where a stronger non-agentic model should think hard without being able to touch files.
- Work that only fits in sequential deliverables, each built from the validated result of the last.
- Any moment you hold a specialist's answer and want it integrated against the repo rather than pasted wholesale.
- Rounds where "trust me, I only edited X" is not enough — the bundled bytecheck proves the scope, and the bundled review hunts what the change would break before any gate runs.

If the whole task fits one prompt and one reply, [minimize-iteration](https://aihero.dev/skills-minimize-iteration) is the cheaper tool.

## Prerequisites

- At least one specialist chat you can paste into. Who plays which capacity — a creative model for architecture, an iterative one for review and debugging — lives in a user-owned declarations file the skill reads at session open; the folder for briefs is chosen the same way.
- The vendored `bytecheck.py` beside the skill files works as installed; the optional opencode capture plugin (`opencode-capture.ts`) makes pastes land on disk automatically, but a hand-saved file works identically.

## The brief is the interface

The specialist starts every message from zero, with a large input budget, a small output budget, and a timeout. So the brief is minimal where it speaks — the task in a sentence or two, the why rather than the what, facts separated from assumptions and open questions — and thorough where it quotes: whole files, real history, the code around the change. An output contract with a size cap and an end sentinel makes a cut-off reply detectable, and long results are split into stages so each reply fits its capacity.

The agent never reads that material wholesale itself: [subagents](https://www.aihero.dev/ai-coding-dictionary/subagent) investigate and implement from paths, so the orchestrator's own [context window](https://www.aihero.dev/ai-coding-dictionary/context-window) stays small while the briefs stay generous.

## Salvage-integration

A reply written blind contains good reasoning wrapped around guesses. The agent checks every part against the repo, keeps what holds, corrects or rejects the rest, and validates the result before composing the next brief — which is written from the repo as it now is, not as the reply imagined it. Received code is placed from files, never retyped from chat; the byte-exact proof is part of the round, not an extra.

## Close the round

A round ends in order: a review pass (a fresh reviewer hunts what the change would break, before any gate), byte-exact verification of the recorded policy, the gates themselves with an expected wait, and a report of what was integrated, rejected, and left unvalidated. Review findings get dispositions — fixed, declined, deferred, unconfirmed — and disagreements reach you unresolved.

## Common questions

**Does bytecheck run without orchestrate?** Ask for it by name and the skill runs that part alone — byte-exact verification of any tree, or a standalone review pass. On a machine where the bytecheck skill is installed by itself, that copy works independently.

**What happens when a reply is cut off?** The end sentinel exposes it; nothing is continued with "go on". The next brief carries what arrived, and the trim order means a cut reply loses commentary first and the artifact last.

**Why is bytecheck bundled inside?** Because the relay's weakest link is trust in what the agent says it changed. A vendored verifier turns the agent's report into evidence a hook, CI, or a second agent can recompute with one call.

## It's working if

- Every brief you paste stands alone — the specialist never asks for a file, a decision, or a piece of history it was not given.
- The reply never lands in the repo verbatim; what lands has been checked against real files, and the agent says what it kept and what it rejected.
- Received code reaches disk through a hash-proven copy, not a retyping.
- A round closes with a review pass and a quoted verdict line plus tree hash before anything is committed.
- The agent names what it could not validate instead of letting it pass silently.

## Where it fits

`/orchestrate` neighbours [minimize-iteration](https://aihero.dev/skills-minimize-iteration), the single compressed crossing for work small enough to delegate in one prompt; orchestrate takes over when one crossing cannot carry it. [handoff](https://aihero.dev/skills-handoff) compacts a whole conversation to resume it elsewhere rather than delegate a piece of it to a specialist that keeps nothing. For the router over the whole set, see [ask-matt](https://aihero.dev/skills-ask-matt).
