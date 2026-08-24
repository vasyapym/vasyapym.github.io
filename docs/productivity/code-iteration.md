## What it does

`code-iteration` turns a non-trivial code change into successive, evidence-backed passes. It makes the agent orient from the existing trajectory, simplify the surrounding shape before patching, and write a brainstorm, design plan, and execution plan before changing production files.

Its defining constraint is **open planning before execution**: the first plausible solution is treated as a candidate, not a verdict, and each pass leaves a clear quality gate for the next one.

## When to reach for it

You invoke this by typing `/code-iteration` when a code change is substantial enough that the first implementation should not be trusted as the final shape. For a small, obvious fix, use the normal implementation flow instead; for a visual-only feedback round, use [design-iteration](https://aihero.dev/skills-design-iteration).

| Situation | Reach for |
| --- | --- |
| A non-trivial code change needs alternatives and a deliberate implementation pass | `/code-iteration` |
| The surrounding structure may be simpler before the local fix lands | `/code-iteration` |
| A visual implementation needs a feedback round and decision history | [design-iteration](https://aihero.dev/skills-design-iteration) |
| A direction is chosen and only the implementation sequence is needed | [planning](https://aihero.dev/skills-planning) |

## The three-part plan

The skill keeps the reasoning visible in three parts. The brainstorm expands the possibility space and identifies evidence. The design plan selects a coherent direction and records its constraints and tradeoffs. The execution plan names small changes, verification, and the quality gate. That structure prevents a fresh context from silently collapsing to the first familiar answer.

## The pass

After planning, the skill makes one coherent change, runs the relevant checks, and compares the result with the quality gate. It extends the existing trajectory by reading history, handoffs, and prior notes instead of treating the current file as the whole context. Delivery remains explicit: the skill does not automatically commit, push, open a pull request, or handle credentials.

## Project graph

Recording in the project graph (`.project-history/graph.jsonl`) is unconditional, never optional: if no graph exists yet, run `project-graph init` first instead of skipping the record. Orient from it before reading anything else: `project-graph head --actor code-iteration` shows your current tip and any handoff waiting here. Acknowledge an offered handoff before starting work, and continue from its source node's artifacts rather than re-deriving context. After each coherent pass, append an `iteration` node with a `git-commit` artifact and the checks and quality-gate outcome in `--meta`, chained to the previous tip with `--continues-from` — this append is part of the pass, not an optional extra. When a pass surfaces a visual concern that wants its own feedback round rather than more code changes, hand it back explicitly with `project-graph handoff --to design-iteration`, so `design-iteration` picks up from your evidence instead of a fresh screenshot.

## Common questions

**Does it require a long plan for every change?**

No. The three-part prose cycle is for non-trivial work. A small, low-risk fix should use proportionate reasoning rather than ceremony.

**Does it always rewrite the surrounding code?**

No. Simplification is a question to ask before patching, not permission for an unrelated refactor. The change still stays within the user's scope and the repository's ownership boundaries.

**Does it push or open a pull request after editing?**

No. Verification and delivery are separate. Commit, push, or pull-request work happens only after the user explicitly requests it and the relevant diff has been reviewed.

## It's working if

- The agent starts by identifying the current trajectory rather than treating the task as greenfield.
- The brainstorm, design plan, and execution plan are visibly different and written before non-trivial edits.
- The chosen fix simplifies or fits the surrounding shape instead of adding a special case.
- Each implementation pass has a concrete verification result and a quality gate.
- No external delivery occurs without an explicit user request.

## Where it fits

`code-iteration` is a **reach-for-it-anytime code workflow** for changes that need more thought than a one-shot implementation. It is closest to [planning](https://aihero.dev/skills-planning), which focuses on the execution sequence after a direction is approved, and [brainstorm](https://aihero.dev/skills-brainstorm), which is read-only and deliberately stops before implementation. [ask-matt](https://aihero.dev/skills-ask-matt) routes over the whole set.
