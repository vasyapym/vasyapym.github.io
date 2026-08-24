---
name: design-iteration
description: Run a visual feedback round against an existing implementation and its design handoff; maintain an append-only decision graph.
---

## What it does

`design-iteration` runs a visual feedback round against an existing implementation and its design handoff. It extracts the user's liked and rejected qualities, compares alternatives, implements one coherent pass, reviews fixed evidence, and appends the result to an iteration ledger.

Its defining constraint is an **append-only decision graph**. When a direction is replaced, the skill keeps a small node with its useful qualities and rejection reason, then adds an edge to the successor. The next session therefore learns from both approval and failure instead of recreating an old design by luck.

## When to reach for it

You invoke this by typing `/design-iteration` — the agent won't reach for it on its own. Use it when a portfolio, product surface, or other visual implementation already exists and you are giving a new review round.

| Situation | Reach for |
| --- | --- |
| An existing visual direction needs another feedback pass | `/design-iteration` |
| The design direction is open before implementation | [design-planning](https://aihero.dev/skills-design-planning) |
| The chosen direction needs an implementation sequence | [planning](https://aihero.dev/skills-planning) |
| The question needs a runnable visual comparison | [prototype](https://aihero.dev/skills-prototype) |

## The iteration loop

The skill loads the handoff graph, atomizes feedback into surface, typography, structure, interaction, and content constraints, and protects outgoing decisions before changing them. It compares two independent candidates unless the user has already chosen one, then makes one coherent pass and checks the same routes, viewports, content lengths, focus states, touch fallback, and reduced-motion mode named by the handoff.

The output is not just a screenshot. It is a new ledger entry containing **Liked**, **Rejected**, **Changed**, **Quality gate**, **Next review**, and verification results. That record becomes the input to the next pass.

## Project graph

Keeping the project graph (`.project-history/graph.jsonl`; see `docs/agents/project-graph.md` in the skills repo) in step with the markdown ledger is unconditional, never optional: if no graph exists yet, run `project-graph init` before the round starts instead of skipping the record. Start every session with `project-graph head --actor design-iteration`: acknowledge any handoff addressed here before working, and orient from the current tip. When a pass completes, append an `iteration` node whose artifacts point at the new ledger entry and the relevant commits, chained with `--continues-from` — this append is part of the pass, not an optional extra. A replaced direction becomes a `decision` node plus a `supersedes` edge carrying the rejection reason — this is the machine-readable spine of the same append-only decision graph the handoff keeps in prose. When the next round needs implementation or perf work beyond one visual pass, offer it explicitly: `project-graph handoff --to code-iteration --from-node <node>`, so `code-iteration` can acknowledge and continue from your evidence instead of rediscovering it.

## Common questions

**Does it keep old design decisions?**

Yes. A removed direction is compressed into a graph node with its name, carried-forward qualities, and rejection reason. The full handoff can stay short because the graph preserves the decision rather than repeating the entire visual description.

**Does it always implement immediately?**

No. If the user has not chosen a direction, it stops after presenting independent candidates. It implements only a direction that is already approved or explicitly selected in the invocation.

**How is this different from `design-planning`?**

`design-planning` is the choice gate before implementation. `design-iteration` is the recurring loop around an existing visual surface: it reads prior evidence, protects history, implements one pass, and records the review result.

**Can it guarantee a design I like?**

No tool can guarantee taste. It can make the process reproducible: liked traits become constraints, rejected traits become guardrails, alternatives are compared deliberately, and the same visual evidence is reviewed each time. That removes avoidable luck from the loop.

## It's working if

- The skill can state what the user liked before suggesting a new direction.
- Rejected directions remain discoverable as compact graph nodes.
- Each pass changes one coherent visual concern rather than restarting the whole identity.
- The review uses fixed routes and viewports instead of a single convenient screenshot.
- The next session can continue without asking the user to repeat settled preferences.

## Where it fits

`design-iteration` is a **reach-for-it-anytime visual maintenance loop**. It can follow a prototype or an approved direction and can hand its recorded decision to [design-planning](https://aihero.dev/skills-design-planning) or [planning](https://aihero.dev/skills-planning) when a larger new choice or execution plan is needed. Its closest neighbour is [brainstorm](https://aihero.dev/skills-brainstorm), which proposes fresh ideas around a diff without maintaining design memory. [ask-matt](https://aihero.dev/skills-ask-matt) routes over the whole set.
