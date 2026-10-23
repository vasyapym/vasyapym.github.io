## What it does

bytecheck verifies what actually changed on disk, byte for byte, against what was allowed to change. The agent snapshots the tree before it edits, works, then verifies after: every path outside the policy is a violation, every edit the task required but never produced is a miss, and the content rules catch the residue agents leave behind — placeholders, conflict markers, invisible characters, line-ending flips. It prints a verdict, `PASS` or `FAIL` plus a tree hash, and that verdict, not the agent's summary, is what you trust.

The skill also ships paste capture: an opencode plugin that lands every message you type or paste into the chat on disk as a byte-exact file, so material that arrives through conversation — a specialist's reply, a pasted file — exists as evidence before the agent touches it.

The baseline manifest is written before any edit exists, so nothing the agent does afterwards — to the work, the report, or the diff — can change what verification compares against. The filesystem is the evidence; the agent's report is only a claim about it.

## When to reach for it

Type `/bytecheck`, or the agent reaches for it automatically when it is about to edit files for a user who wants evidence rather than a report.

Reach for it when the question is "did the work stay inside the lines": delegated tasks you want to verify rather than read, edits that must not touch lockfiles, CI or tests, claimed changes you want to confirm actually happened. It pairs with [code-review](https://aihero.dev/skills-code-review) — code-review asks whether the change is *good*; bytecheck asks whether it was *allowed* and *complete*.

## Snapshot, verify, quote

The loop is three beats. Snapshot writes a manifest of every file — hashes, symlink targets, exec bits — before anything is touched. Verify re-walks the tree, classifies every change, applies the policy, runs the content rules on only what the agent introduced, and prints one line per change plus the verdict. Quote: the completion message ends with the verdict line and the tree hash, which anyone can recheck with a one-line hash command — a hook, CI or a second agent re-runs the same check without reading anything the agent wrote.

The protocol itself lives in the skill; this is the shape, not the runbook.

## Paste capture, harvest from files

A reply that exists only in chat context cannot be verified: an agent asked to reproduce it produces a paraphrase, placeholders included. The capture plugin removes that step entirely — the paste is a file in the project's `.bytecheck/inbox/` the moment it enters the chat, with a hash sidecar recorded at write time. The harvest protocol then treats the file as the source of truth: hash it, read from it, place it, prove the placement byte-identical with `same`. Received code is never re-typed from the transcript; if no capture file exists, the agent says so instead of silently reconstructing.

## Common questions

**Doesn't `git diff` already do this?**
git shows what changed relative to HEAD — it needs a repository, and it cannot see an untracked file appear or an ignored file mutate, which is exactly where agents operate. It also answers "what changed", not "was this allowed". bytecheck works outside repositories entirely and turns the comparison into a verdict with an exit code.

**Can't the agent fake a PASS?**
It can try, and the design assumes it will. That is why the manifest is written before the work and never edited after, the policy comes from the orchestrator or a committed file the agent may not widen, and the verdict is recheckable by anyone with one command. The threat model is the unreliable-but-not-malicious agent; a determined adversary holding the verifier's own privileges is out of scope.

**Do pasted specialist replies get captured?**
Yes — anything typed or pasted by a human enters the chat as a user message, and that is what the capture plugin writes down. The filters only remove machine-generated traffic that also travels as user-role: opencode's own synthetic messages and subagent prompts. Assistant messages stay out on purpose — the inbox is a trusted box of human bytes, and model-generated text carries no fidelity risk when re-read.

## It's working if

- The completion message ends with a verdict line and tree hash — `PASS 2 changes, 0 violations  a1b2c3d4e5f6 -> 0f9e8d7c6b5a` — and re-running the hash command reproduces the second hash.
- An out-of-scope edit surfaces as a `VIOLATION` line, not a silent pass.
- A claimed-but-missing edit surfaces as `expected change missing`.
- Violations appear in the agent's message verbatim, never summarised into "minor issues".
- A pasted reply is already on disk in `.bytecheck/inbox/` with a `.sha256` sidecar before the agent does anything, and `hash --expect` confirms it intact.

## Where it fits

A reach-for-it-anytime standalone — off every flow; you reach for it whenever an agent's edits need verifying rather than trusting. Its neighbour is [code-review](https://aihero.dev/skills-code-review), which reviews the diff against the repo's standards and the originating spec after the fact; bytecheck verifies the tree against a policy while the work happens. The full map is at [ask-matt](https://aihero.dev/skills-ask-matt).
