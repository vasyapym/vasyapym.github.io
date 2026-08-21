---
name: design-iteration
description: Recreate a preferred visual direction through evidence-led design iterations and an append-only decision graph.
argument-hint: "A visual feedback round or a design handoff to continue"
disable-model-invocation: true
---

# Design iteration

Use this skill when a visual implementation already exists and the user is giving feedback on what to keep, remove, or try next. It turns taste into durable evidence instead of letting each session rediscover a style by luck.

## Contract

One run has one target and produces four inspectable outputs:

1. a baseline read from the current design handoff, its compact decision graph, the latest ledger entry, and the current implementation;
2. two genuinely different candidate directions, or one explicitly approved direction supplied by the user;
3. one coherent implementation pass followed by a fixed visual/accessibility review;
4. an append-only handoff entry and graph edge describing what was liked, rejected, changed, and verified.

If the direction is still open, stop after the candidates and ask the user to choose. Do not quietly implement the agent's favorite.

## The no-luck algorithm

1. **Load the trajectory.** Read the active handoff, persistent decisions, decision graph, latest iteration entry, relevant ADRs, and recent code history. Treat the handoff as the design memory and the code as evidence of the current implementation, not as the only source of intent.
2. **Atomize feedback.** Convert the user's words into small constraints under five headings: surface/material, typography, structure, interaction, and content. Separate **Liked**, **Rejected**, and **Unknown**. Never turn an unknown preference into a confident rule.
3. **Protect history.** Before changing a direction, give the outgoing direction a compact graph node containing its name, the qualities worth carrying, and the reason it was rejected. Add a superseding edge. Do not delete the old prose until its decision-rich content has been compressed into that node.
4. **Generate alternatives independently.** Build two candidates from the same baseline and constraints. Candidate B must not read Candidate A's proposal. Each candidate states the visual grammar, type/surface/structure choices, motion policy, affected modules, tradeoffs, and fixed review evidence. For a high-impact choice, repeat the planning exercise from a clean context before comparing.
5. **Choose with a rubric.** Compare user fit, solidity/specificity, legibility, restraint, locality, accessibility, reversibility, and verification cost. Recommend one, but leave the choice to the user unless the user already approved the direction in the invocation.
6. **Implement one pass.** Change one coherent visual concern. Prefer existing project and artwork contracts. Do not add a library, motion, metadata, or abstraction unless the handoff's constraints and the actual variation justify it.
7. **Review the same evidence every time.** Use the routes, viewport widths, content lengths, keyboard states, touch fallback, and reduced-motion mode named in the handoff. Check the visual result against the quality gate, not against a vague feeling produced by the latest screenshot.
8. **Record before continuing.** Append a compact ledger entry with **Liked**, **Rejected**, **Changed**, **Quality gate**, **Next review**, and verification results. If the pass removes a trait, update the graph with a short reason. Never rewrite an earlier entry to make the history look cleaner.

## Compact graph format

Use a small Mermaid graph or equivalent text graph. A node needs only:

- a stable direction name;
- one line of carried-forward qualities;
- one line of rejection or supersession reason.

Edges describe the decision: `supersedes`, `too generic`, `unreadable`, `too dense`, or another evidence-backed reason. The graph is the compression layer; detailed visual prose belongs only in the active direction and the latest ledger entry.

## Guardrails

- Never infer a permanent preference from one unreviewed screenshot.
- Never erase a rejected direction without preserving its minimal node and reason.
- Never use the current CSS as the design source of truth when the handoff disagrees; reconcile the mismatch explicitly.
- Never let animation, novelty, or a new font compensate for a weak composition.
- Never make the user repeat a decision already represented in the graph.
- Never commit, push, open a pull request, or change external systems as part of planning or design review; delivery is a separate explicit step.

## Done when

The chosen pass is visually reviewed, the fixed checks are green, the user-liked qualities are named as reusable constraints, rejected traits are guarded against, and a fresh agent can continue from the handoff without reconstructing the whole conversation.
