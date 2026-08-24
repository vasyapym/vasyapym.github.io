---
name: code-iteration
description: Iterate on non-trivial code changes through a brainstorm, design plan, execution plan, simplification pass, and verification.
---

# Code iteration

## 1. Iterate - don't one-shot

Quality is built up over passes, not produced whole on the first attempt. Treat every deliverable as improvable and work with that assumption baked in: aim for a solid version, then sharpen it, rather than staking everything on a single perfect output. Iteration is refinement, not reinvention - each pass should build on the last, not discard it and start from zero. When you resume or modify work, orient yourself first: read the git history, the handoff files, and prior notes so you are extending the existing trajectory instead of restarting it.

## 2. Simplify before you patch

When the task allows it, before fixing a local issue, look for a way to make the surrounding structure simpler and more consistent, so the fix settles naturally into what is already there. Prefer a change that fits the existing shape over one that bolts on a hack, duplicates logic, or carves out a special case. A fix that leaves the whole cleaner than it found it is worth more than one that only closes the immediate gap.

## 3. Think in the open before you execute

For any non-trivial task, produce a long, thorough piece of writing in three parts: first a brainstorm, then a design plan, then a plan of execution. Write each part in flowing prose, not bulleted fragments.

The brainstorm expands the possibility space. Consider the current implementation, its surrounding architecture, the user's actual outcome, simpler alternatives, failure modes, and what evidence would distinguish the options. Do not settle on the first plausible route merely because it is available.

The design plan chooses a coherent direction from that exploration. State the target behavior, constraints, affected seams, data and control flow, compatibility concerns, and the tradeoffs behind the choice. Keep rejected alternatives visible when they explain why the chosen direction is better.

The execution plan turns the chosen direction into a sequence of small, verifiable changes. Name the files or modules, the order of work, the tests or checks for each step, and the quality gate that decides whether another pass is needed. Keep production edits frozen until the plan is coherent enough to execute.

This process is most useful in a fresh context: once a path is chosen, the alternatives usually stop being considered. Accept that there is real variance in what any single attempt produces - the same prompt can yield very different results from one run to the next. Do not trust a single pass to have found the best route. Run the brainstorm, design-plan, and execution-plan cycle before implementing non-trivial work; for a small change, use proportionate judgment and keep the reasoning brief.

## 4. Keep delivery explicit

After changing files, verify the pass and report what changed, what was checked, and what remains uncertain. Commit, push, open a pull request, or change an external system only when the user explicitly requests that delivery step. Never obtain, store, or reuse credentials through this skill, and never publish changes automatically after an individual file edit.

## Project graph

Recording in the project graph (`.project-history/graph.jsonl`; see `docs/agents/project-graph.md` in the skills repo) is unconditional, never optional: if no graph exists yet, run `project-graph init` first instead of skipping the record. Orient from it before reading anything else: `project-graph head --actor code-iteration` shows your current tip and any handoff waiting here. Acknowledge an offered handoff before starting work, and continue from its source node's artifacts rather than re-deriving context. After each coherent pass, append an `iteration` node with a `git-commit` artifact and the checks and quality-gate outcome in `--meta`, chained to the previous tip with `--continues-from` — this append is part of the pass, not an optional extra. When a pass surfaces a visual concern that wants its own feedback round rather more code changes, hand it back explicitly: `project-graph handoff --to design-iteration --from-node <node>`, so `design-iteration` picks up from your evidence instead of a fresh screenshot.

## Working loop

Orient from the existing trajectory, brainstorm alternatives, choose and explain the design, plan the execution, make one coherent pass, run the relevant checks, compare the result with the quality gate, and record what the next pass should improve. Each pass should leave the code easier to understand or the behavior more reliable than before it began.
