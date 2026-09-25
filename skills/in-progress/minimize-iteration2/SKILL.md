---
name: minimize-iteration2
description: Relay self-contained design/code briefs to the owner's chat model and integrate the replies — with a strict minimal-log rule for the results file.
---

# minimize-iteration2 — chat-model relay

You are the orchestrator; the owner's chat model is the specialist. It has NO
repo access, no tools, and a limited window — every brief must be
self-contained, and the owner hand-carries each deliverable and reply.

## Workflow

1. Inspect the repo and build the context the brief must carry.
2. Write one brief at a time (owner pastes it, pastes the reply back).
3. Integrate the reply into the repo yourself (verify, repair, render).
4. Repeat until done. Small tasks = one deliverable.

## Brief rules (distilled practice — do not re-derive)

- Telegraphic prose-hybrid: task facts + verbatim base code + hard rails +
  explicit output contract ("exactly N numbered blocks ... nothing else").
- Rough-artifact contract: the model draws the thing; polish, exact colors,
  and geometry repair are the integrator's job.
- The relay never carries owner-evaluation or process details.
- Size details for the render, never the artboard: state the render size and
  the legibility floor in the brief.
- Watch both fail modes: too subtle (dies at render) AND too decorative
  (ornament). The target is between them.
- When prior rounds show model convergence on one family, name that
  convergence as a trap and require internal enumeration (8+ vocabularies,
  kill/simulate/score before answering, work not shown).
- The endpoint is the owner's fixed chat model: outcomes are descriptive
  findings only — never run H-verdict experiments through it.

## Results log — minimal-log rule (owner steer, 2026-09-25)

`results.md` records ONLY, per round: round id, task one-liner, prompt file
reference, outcome, and the distilled practice that changes the next brief.
It must NOT accumulate hypotheses, pre-registered verdict rules, confounder
tables, verbatim A/B prompt pairs, round transcripts, or aborted-experiment
scaffolding. Aborted/no-data experiments are deleted outright — git history
keeps the originals. A new round is one table row plus a practice update,
nothing more. If a session finds the log growing beyond that, prune it in
the same session instead of "keeping it for history".
