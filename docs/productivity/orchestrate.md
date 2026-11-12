## What it does

`/orchestrate` turns the coding agent into the orchestrator of a relay: the agent keeps the repo, the tools, and the final say; a non-agentic specialist in a separate chat supplies the reasoning, design, and code. The agent writes one self-contained brief, you carry it out and bring the reply back, and the agent salvage-integrates it against the actual repo. It keeps what survives, corrects or rejects the rest, and validates before the next brief. Everything the specialist needs must cross inside that brief, because the specialist has no tools, no repo access, and no memory between briefs.

Three parts are bundled inside the same skill:

- `bytecheck` is byte-exact self-verification: a snapshot before the work, a policy-checked verdict after, and a tree hash anyone can recompute.
- `review` is the end-of-round bug-finding pass: a fresh reviewer sees the change and the task, ranks what would break, and the agent disposes of each finding before any gate runs.
- `executor` is a mode for settled work: a declared-shape rewrite against a frozen corpus, checked by a scripted verifier. The specialist executes the transformation rather than redesigning it, and any declared specialist may fill the role.

## When to reach for it

Type `/orchestrate`, or the agent starts the loop itself when you name the specialist, hand back a specialist reply to integrate, or when a task is too large or design-heavy to cross into a specialist chat in one pass. Asking for the byte-check, the review, or the executor mode by name runs that part alone.

- Design decisions with real alternatives, where a stronger non-agentic model should think hard without being able to touch files.
- Work that only fits in sequential deliverables, each built from the validated result of the last.
- A transformation that is already settled, such as a mechanical rewrite across a fixed set of files, where the specialist should follow a declared shape and a script decides whether each batch passes.
- Any moment you hold a specialist's answer and want it integrated against the repo rather than pasted wholesale.
- Rounds where "trust me, I only edited X" is not enough. The bundled bytecheck proves the scope, and the bundled review hunts what the change would break before any gate runs.

If the whole task fits one prompt and one reply, [minimize-iteration](https://aihero.dev/skills-minimize-iteration) is the cheaper tool.

## Prerequisites

- At least one specialist chat you can paste into. Who plays which role lives in a user-owned declarations file the skill reads at session open, along with the folder for briefs.
- Role labels are free text. A declaration reads `role: <label>; specialist: <name>; mode: <brief mode>`, one specialist can fill several roles, and `creative:` and `iterative:` remain valid shorthand.
- Something you say during a session overrides the standing defaults for that session only. It becomes a new default only if you adopt it.
- Setting `cleanup-after-yourself: yes` is recommended. The agent then removes processed briefs and scratch, but keeps replies and evidence that a retained report still cites.
- `bytecheck.py` and `extract-reply.py` ship beside the skill and work as installed. The optional opencode capture plugin (`opencode-capture.ts`) is a further way to get replies onto disk, and a hand-saved file works too.

## The brief is the interface

The specialist starts every message from zero, with a large input budget, a small output budget, and a timeout. So the brief is minimal where it speaks (the task in a sentence or two, the why rather than the what, facts separated from assumptions and open questions) and thorough where it quotes: whole files, real history, the code around the change. An output contract with a size cap and an end sentinel makes a cut-off reply detectable, and long results are split into stages so each reply fits its capacity.

The agent never reads that material wholesale itself: [subagents](https://www.aihero.dev/ai-coding-dictionary/subagent) investigate and implement from paths, so the orchestrator's own [context window](https://www.aihero.dev/ai-coding-dictionary/context-window) stays small while the briefs stay generous.

## Acquire once, from a stored source

A reply is acquired once, from a stored source, and everything after works from that file. The agent tries these in order and stops at the first usable one:

|Rung|Source|Note|
|---|---|---|
|1|The capture plugin's inbox|Used when the plugin saved that message; the digest is checked.|
|2|The session database, via `extract-reply.py`|Finds the pasted reply by an identifying phrase and the reply's expected markers. Ambiguity returns a candidate report, never a guess.|
|3|A file you save|Raw reply, one per file. This costs you one save step.|
|4|Chat transcription|Degraded last resort. It counts as the agent's own edit, is marked unverified, and is never filed as a received reply.|

A path you hand over explicitly skips the ladder. A capture proves the stored text, not the specialist's original bytes, because a rendered copy may already have lost markup. Copy the raw text or copy-as-Markdown when the chat offers it.

This harvest step, covering placement, a receipt (source, length, hash), and bounded repair, runs with byte-checking on or off. With it off, the record is just the receipt and no snapshot is taken.

If a reply lost template markers in transit, the agent may restore only the declared template shapes, in a separate copy and never by re-flowing text. It records that as its own edit and leaves the raw file untouched.

## Salvage-integration

A reply written blind contains good reasoning wrapped around guesses. The agent checks every part against the repo, keeps what holds, corrects or rejects the rest, and validates the result before composing the next brief. That brief is written from the repo as it now is, not as the reply imagined it. Received code is placed mechanically from the acquired file, never retyped from chat.

Disk is authoritative: after any external write, the agent re-reads the file and never saves an old editor buffer over it. In Executor mode, acceptance follows the frozen contract and the scripted verifier, not an improvised rewrite of either.

## Close the round

A round ends in order:

1. A review pass: a fresh reviewer hunts what the change would break, before any gate.
2. Byte-exact verification of the recorded policy, if you asked for it. Verification reads the files on disk, not an editor's buffers.
3. The gates themselves, with an expected wait.
4. A report of what was integrated, rejected, and left unvalidated.

Review findings get dispositions (fixed, declined, deferred, unconfirmed), and disagreements reach you unresolved.

## Common questions

**Why did a specialist's reply arrive as one line, and does it matter?** Replies pasted back sometimes arrive with every line break collapsed while the inline markers stay intact, and extraction preserves what was stored. Prose tolerates the collapse. Code and other exact artifacts never travel by paste: they are acquired from the plugin inbox, the session database, or a file you saved, and placed from there, so the collapse stops mattering.

**Does bytecheck run without orchestrate?** Ask for it by name and the skill runs that part alone: byte-exact verification of any tree, or a standalone review pass. On a machine where the bytecheck skill is installed by itself, that copy works independently.

**What happens when a reply is cut off?** The end sentinel exposes it; nothing is continued with "go on". The next brief carries what arrived, and the trim order means a cut reply loses commentary first and the artifact last.

**Why is bytecheck bundled inside?** Because the relay's weakest link is trust in what the agent says it changed. A vendored verifier turns the agent's report into evidence a hook, CI, or a second agent can recompute with one call.

## It's working if

- Every brief you paste stands alone: the specialist never asks for a file, a decision, or a piece of history it was not given.
- The reply never lands in the repo verbatim; what lands has been checked against real files, and the agent says what it kept and what it rejected.
- Replies are fetched from a capture, the session database, or a file you saved, rather than retyped. If the agent did work from chat text, it says so and marks the result unverified.
- Code reaches disk by copy from the saved reply, not retyping, and with byte-checking on the copy is hash-proven.
- A round closes with a review pass and, when byte-checking is on, a quoted verdict line plus tree hash before anything is committed.
- The agent names what it could not validate instead of letting it pass silently.

## Where it fits

`/orchestrate` neighbours [minimize-iteration](https://aihero.dev/skills-minimize-iteration), the single compressed crossing for work small enough to delegate in one prompt; orchestrate takes over when one crossing cannot carry it. [handoff](https://aihero.dev/skills-handoff) compacts a whole conversation to resume it elsewhere rather than delegate a piece of it to a specialist that keeps nothing. For the router over the whole set, see [ask-matt](https://aihero.dev/skills-ask-matt).
