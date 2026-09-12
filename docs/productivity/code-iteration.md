## What it does

`code-iteration` implements and refines code through small, evidence-backed passes: define, inspect, change, verify, review, record. Every pass runs actual checks and records the exact commands, exit statuses, and output as evidence.

Its defining constraint is a **scope-honest verdict vocabulary**: a pass is VERIFIED only for its declared scope, on the final relevant file state, with all required checks passing — and verification is never a claim that the software is bug-free, visually approved, or production-ready.

## When to reach for it

You invoke this by typing `/code-iteration` — the agent won't reach for it on its own. Use it for features, bug fixes, refactors, test repairs, and any implementation work that requires executed checks.

| Situation | Reach for |
| --- | --- |
| Implementation work needs executed, evidenced verification | `/code-iteration` |
| A design question needs a runnable answer | [prototype](https://aihero.dev/skills-prototype) |
| A change needs a visual feedback round | [design-iteration](https://aihero.dev/skills-design-iteration) |
| An approved direction needs a deterministic plan first | [planning](https://aihero.dev/skills-planning) |

## The pass

Each pass is bounded: acceptance criteria stated up front, a baseline captured before editing (for a bug, a regression test that fails for the expected reason first), the smallest coherent change, executed verification with recorded evidence, then a final diff inspection. Any edit after a verification run invalidates the affected results — the checks are rerun, not the claim repeated. Failed and blocked passes stay in the record; history is never rewritten into an uninterrupted success story.

The verdict words do the heavy lifting: **VERIFIED** (every gate for the scope passed), **FAILED** (a gate ran and failed), **BLOCKED** (a gate could not run — observed failures reported alongside), **NOT RUN** (individual unexecuted checks), **NOT APPLICABLE** (only with a concrete reason).

## Verification honesty

The rules exist to kill the manufacture of green: pre-existing failures stay visible, required gates are never dropped because they fail, tests are never disabled or assertions weakened to pass, and exit zero with no relevant tests discovered proves nothing. When execution tools are unavailable, the deliverable is proposed code plus exact suggested commands labeled NOT RUN — never a claim that files were changed or checks executed.

## Common questions

**Does VERIFIED mean the bug is gone for good?**

No. It means the declared checks passed on the declared scope at a specific file state. It claims nothing about visual approval, production readiness, or behaviour outside the scope.

**A required check fails and time is short — can it be dropped?**

Not silently. The failure stays visible, and any agreed scope reduction must be explicit in the pass record and the final report.

**Where does visual acceptance live?**

In [design-iteration](https://aihero.dev/skills-design-iteration). A passing build never establishes visual approval; the two skills exchange typed handoff edges where a project graph exists.

## It's working if

- Every pass reports commands, exit statuses, and evidence paths for checks that actually ran.
- Fixed bugs come with a regression test that failed for the expected reason first.
- Post-verification edits invalidate and rerun the affected checks.
- Failed and blocked passes remain readable instead of rewritten into a success story.
- Task completion is claimed only when acceptance criteria and final checks pass.

## Where it fits

`code-iteration` is a **reach-for-it-anytime implementation loop** for anything that must be verified, not merely written. Its closest neighbour is [design-iteration](https://aihero.dev/skills-design-iteration), the visual half of the same pass discipline, and [planning](https://aihero.dev/skills-planning), which sequences an approved direction before passes begin. [ask-matt](https://aihero.dev/skills-ask-matt) routes over the whole set.
