## What it does

`design-planning` turns a non-trivial design question into an explicit choice before production code changes. It reads the current work, makes two genuinely different candidates, compares them against a fixed rubric, and stops at a recommendation for the human to approve.

Its defining constraint is **two visible alternatives before execution**. It is not a prettier way to ask an agent to guess once, and it does not turn every uncertainty into two large production implementations.

## When to reach for it

You invoke this by typing `/design-planning` — the agent won't reach for it on its own. Use it when the visual language, interaction model, module shape, or another early decision could materially change the result.

| Situation | Reach for |
| --- | --- |
| The direction is still open | `/design-planning` |
| The direction is chosen and needs an executable sequence | [planning](https://aihero.dev/skills-planning) |
| The idea itself is still vague | [grill-with-docs](https://aihero.dev/skills-grill-with-docs) |
| The question can only be answered by seeing or touching behavior | [prototype](https://aihero.dev/skills-prototype) |

## The decision gate

The skill establishes a baseline from the repository and handoff, separates facts from decisions, and writes two candidates with evidence, tradeoffs, seams, and verification costs. For a high-impact choice, it runs that exercise twice independently from the same baseline before comparing the results; for a smaller choice, two different candidates in one pass are enough. It recommends one and records what is rejected or deferred. The production route stays frozen until the user approves.

For visual work, the durable output belongs in the design handoff's iteration ledger: what the user liked, what changed, the new quality gate, and the next fixed review. That ledger is how successive passes converge instead of repeatedly restarting from taste.

## Common questions

**Does it edit files?**

Not production files. It stops after the comparison and waits for the user's choice. Once a direction is approved, its decision can be recorded in the appropriate handoff, context, or ADR before `/planning` turns it into execution steps.

**Do I always need two prototypes?**

No. Two written candidates are the default. For a high-impact choice, the planning pass itself is repeated independently so the first answer does not become an anchor. Use two small prototypes only when the decision is about behavior or visual response that prose cannot settle; do not build two complete production paths just to manufacture certainty.

**What happened to the old workflow principles?**

They were removed from `CLAUDE.md` in commit `cb6a358` with the intention of moving them into skills. The principles are now split between this skill and [planning](https://aihero.dev/skills-planning). The old automatic token-based Git-delivery rule is deliberately not restored; delivery remains explicit.

## It's working if

- The baseline and constraints are visible before a direction is chosen.
- The candidates are meaningfully different rather than one answer with cosmetic variations.
- The recommendation cites a rubric and evidence from the current work.
- Production files remain unchanged until approval.
- The chosen direction leaves a durable handoff entry instead of relying on memory.

## Project graph

When the user's choice lands, the direction becomes a `decision` node (with a `supersedes` edge when it replaces an earlier one) in the area's project graph (`docs/agents/project-graph.md`).

## Where it fits

`design-planning` is the **choice step** between shaping an idea and planning its build. The usual route is [grill-with-docs](https://aihero.dev/skills-grill-with-docs) → `/design-planning` → [planning](https://aihero.dev/skills-planning) → implementation. It is closest to [brainstorm](https://aihero.dev/skills-brainstorm), which is a read-only source of fresh ideas around an existing diff rather than a decision gate, and [prototype](https://aihero.dev/skills-prototype), which supplies evidence when prose is not enough. [ask-matt](https://aihero.dev/skills-ask-matt) routes over the whole set.
