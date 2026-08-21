## What it does

`planning` turns an approved direction into a deterministic implementation and verification plan. It freezes scope, chooses the highest useful seam, sequences small reversible steps, and defines exact checks so the next pass can be repeated by another agent without guessing.

Its defining constraint is a **verification matrix**: every planned step has a demonstrable outcome, and UI work names its routes, representative content, viewport widths, interaction states, and reduced-motion behavior instead of saying only "check the UI".

## When to reach for it

You invoke this by typing `/planning` — the agent won't reach for it on its own. Use it after a design or architecture direction has been explicitly chosen and before implementation begins.

| Situation | Reach for |
| --- | --- |
| Alternatives still need comparing | [design-planning](https://aihero.dev/skills-design-planning) |
| The chosen direction needs steps and checks | `/planning` |
| The plan spans multiple sessions | [to-tickets](https://aihero.dev/skills-to-tickets) after `/planning` |
| The plan is approved and small enough to build | [implement](https://aihero.dev/skills-implement) |

## The repeatable loop

The plan uses one loop for every pass:

```text
orient → make one coherent change → verify → compare with the quality gate → record → choose the next pass
```

Prefactors come before the behavior they simplify. Each pass is reviewed against the active handoff rather than expanding into unrelated polish. When the quality gate passes and the checks are green, the loop ends; iteration is refinement, not endless motion.

## Design handoffs

For visual work, the iteration ledger is part of the plan. Each pass adds **Liked**, **Changed**, **Rejected/deferred**, **Quality gate**, and **Next review**. This turns a user's visual feedback into durable constraints and lets a fresh session continue from evidence instead of rediscovering the same preferences.

## Common questions

**Will it implement the work?**

No. It produces the plan and stops for approval. A small approved plan can go to [implement](https://aihero.dev/skills-implement); a larger one can go through [to-tickets](https://aihero.dev/skills-to-tickets).

**What makes the plan deterministic?**

The order is fixed, the seam is named, scope is frozen, and every validation item has a pass/fail observation. For UI work, the same routes and viewport widths can be reviewed again. For code, the same seam-level behavior and regression case can be run again.

**Does planning change Git?**

No. It does not commit, push, open a pull request, or merge. Delivery is an explicit later instruction, so planning can be paused, reviewed, or handed to another agent safely.

## It's working if

- The chosen direction and its rejected alternatives are named.
- Every step says what becomes true and how it is verified.
- The highest practical seam and its test surface are explicit.
- The plan contains a fixed review matrix rather than a vague QA promise.
- A fresh agent can resume at the next step without asking what "done" means.

## Where it fits

`planning` is the **execution-plan step** after a direction has been selected and before a build starts. The usual route is [grill-with-docs](https://aihero.dev/skills-grill-with-docs) → [design-planning](https://aihero.dev/skills-design-planning) → `/planning` → [implement](https://aihero.dev/skills-implement). Its closest neighbour is [to-tickets](https://aihero.dev/skills-to-tickets), which publishes an approved multi-session plan as tracer-bullet tickets; [ask-matt](https://aihero.dev/skills-ask-matt) routes over the whole set.
