---
name: design-planning
description: Compare design alternatives and settle the direction before implementation.
argument-hint: "A non-trivial design question or change"
disable-model-invocation: true
---

# Design planning

Use this skill when the shape of a non-trivial change matters: visual work, interaction design, architecture, or any change where the first plausible answer may not be the best one. This is a decision gate, not an implementation command. Do not edit production code while the direction is still open.

## Recovered workflow principles

These principles were moved out of `CLAUDE.md` in commit `cb6a358` but were not made invokable. They are canonical here and in `/planning`:

1. **Iterate — do not one-shot.** Build quality through deliberate passes. Each pass refines the last instead of discarding the trajectory and starting over.
2. **Simplify before patching.** Before fixing a local symptom, look for the smaller surrounding shape that lets the fix fit naturally and removes duplication or special cases.
3. **Think in the open, twice, before executing.** Make independent alternatives visible, compare them against explicit criteria, and wait for the user's choice before implementation.
4. **Keep delivery explicit.** Planning and implementation must not silently commit, push, open pull requests, or change external systems. Delivery is a separate phase governed by the user's current instruction and repository policy.

The historical fourth line in `CLAUDE.md` required automatic token-based Git delivery. It is intentionally not restored as automatic behavior: irreversible delivery must remain an explicit user-approved step.

## Deterministic protocol

1. **Orient.** Read the request, current implementation, active design handoff or domain context, relevant ADRs, and recent history. Inspect the working-tree status and record changes that predate this session; never plan against an imagined clean checkout.
2. **State the target.** Write one sentence describing the user-visible outcome, then list the constraints that must survive the change. Separate facts found in the repository from decisions that still belong to the user.
3. **Generate two candidates independently.** For each candidate, describe the idea, the modules and seams it affects, the expected behavior, the test/visual evidence it needs, the effort, and the main tradeoff. Keep the candidates genuinely different; do not polish one answer twice.
4. **Compare with a fixed rubric.** Score each candidate against user fit, clarity, simplicity, locality, accessibility, reversibility, and verification cost. Explain the score with evidence rather than taste alone. If the question cannot be settled on paper, name the smallest throwaway prototype that would settle it.
5. **Recommend one direction.** Make the recommendation explicit and say what is deliberately rejected or deferred. For visual work, update the design handoff only after the user approves the direction; append what the user liked, what changed, and the new quality gate instead of rewriting history.
6. **Stop.** Ask the user to approve or choose. Do not edit production files, create implementation tickets, or begin the build in the same pass.

## Independent pass rule

For a high-impact visual or architectural choice, run the planning exercise twice from the same baseline: each pass must be independent, must not read the other pass's proposal, and must produce its own candidate and execution outline. Compare the two only after both are complete. Do not fake independence by writing both versions as one stream or by polishing the first answer into a second one. For a small or low-risk change, two genuinely different candidates in one pass are enough.

## Prototype rule

Do not build two complete production implementations merely to reduce uncertainty. Use two written candidates for most decisions; use two small, toggleable prototypes only when seeing or touching the behavior is the shortest path to a reliable decision. Keep the production route frozen until the comparison has a recorded verdict.

## Handoff format

Every approved design pass leaves a compact durable record:

- **Liked:** the specific visual or behavioral qualities the user approved;
- **Changed:** what this pass will alter and what it preserves;
- **Rejected/deferred:** attractive ideas that are not part of the direction;
- **Quality gate:** the observable condition that decides whether the next pass is better;
- **Next review:** the fixed routes, states, or viewports to inspect.

For a portfolio or other visual product, append this record to its design handoff's iteration ledger. For a domain or architecture decision, use the repository's context or ADR workflow instead.
