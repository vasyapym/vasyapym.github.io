---
name: planning
description: Turn an approved direction into a deterministic implementation and verification plan.
argument-hint: "An approved design, decision, or feature"
disable-model-invocation: true
---

# Planning

Use this skill after a direction has been chosen and before implementation begins. It produces an executable plan with a fixed order, explicit seams, and repeatable checks. It does not write production code and does not make Git or external-system changes.

## Deterministic protocol

1. **Confirm the decision.** Read the approved design, active handoff, domain context, ADRs, and current diff. Restate the chosen outcome and the reasons it won over the alternatives. If the direction is not actually approved, stop and send the work back to `/design-planning`.
2. **Freeze scope.** Define the user-visible behavior, preserved behavior, out-of-scope work, and the smallest useful vertical slice. Name assumptions that must be verified rather than silently treating them as facts.
3. **Choose the highest seam.** Map the modules involved and the interface through which behavior can be tested. Prefer an existing seam; introduce a new one only when it concentrates complexity and gives callers more leverage. Keep implementation details out of the plan's public contract.
4. **Sequence the work.** Order the smallest reversible steps. Each step states what becomes demonstrably true, which files or modules it touches, what blocks it, and how it can be reviewed independently. Put simplifying prefactors before the behavior they make easy.
5. **Define the verification matrix.** List the exact typecheck, build, test, accessibility, and visual checks. For UI work, pin routes, representative content, viewport widths, interaction states, and reduced-motion behavior. For code, name the seam-level behavior and regression case. A check is complete only when it has a clear pass/fail observation.
6. **Define the iteration loop.** After each coherent pass: inspect the diff, run the smallest relevant check, compare the result with the quality gate from the design handoff, and append the outcome to the iteration ledger. Do not accumulate unrelated polish until the current pass is understood.
7. **Stop for approval.** Present the plan, dependencies, risk, and verification matrix. Wait for approval before implementation. For work that spans sessions, hand the approved plan to `/to-tickets`; for a small change, hand it to the implementation step directly.

## The repeatable loop

Every implementation pass follows the same shape:

```text
orient → make one coherent change → verify → compare with the quality gate → record → choose the next pass
```

The loop is not a demand for endless refinement. Stop when the agreed quality gate passes, the checks are green, and the next improvement would be a new decision rather than a correction to the current one.

## Design-ledger rule

When the work has a design handoff, the ledger is part of the plan, not optional commentary. Each reviewed pass adds an entry with **Liked**, **Changed**, **Rejected/deferred**, **Quality gate**, and **Next review**. This makes later sessions converge from evidence instead of rediscovering taste or relying on luck.

## Delivery boundary

This skill never commits, pushes, opens a pull request, or merges. Those actions belong to an explicit later instruction. A reproducible plan must remain safe to inspect, pause, resume, or hand to another agent without changing the repository merely by planning it.
