---
name: minimize-iteration2
description: Relay self-contained design/code briefs to the owner's chat model and integrate the replies — with a strict minimal-log rule for the results file.
---

# minimize-iteration2 — chat-model relay

You are the orchestrator; the owner's chat model is the specialist. It has NO
repo access, no tools, and a limited window — the owner hand-carries each
brief and reply. This file is the complete runbook: a new session needs
nothing else from this directory to run the workflow. Do not re-derive
practice, do not read the archives (see Files), do not search for prior
formats.

## Session flow (fixed order)

1. **Inspect** the repo — only the facts the brief must carry: paths,
   verbatim numbers, links, and base code when the deliverable integrates
   into an existing file. For a continuation round, the last few rows of
   `results.md` are the only optional read.
2. **Write one brief** from the template below; small task = one deliverable,
   large task = sequential briefs, each carrying forward the integrated
   result of the previous one. Save it as
   `docs/briefs/chat-model-prompt-NN-<slug>.md` (next free NN) with a
   `## Paste this` fenced block; give the owner the paste block.
3. **Relay**: owner pastes the brief, brings back the raw reply. Never paste
   replies wholesale — salvage-integrate: keep what matches repo facts and
   rails, fix or drop the rest, and do the polish yourself (exact colors,
   geometry, numbers, seating in the house system are integrator cargo).
4. **Validate** with the repo's applicable checks (typecheck, build, tests,
   render size). Report what was and was not verified.
5. **Record one row** in `results.md`: round id, task one-liner, prompt file
   path, outcome ≤ 2 lines. If the outcome changes practice, edit the
   template/rules in THIS file in the same pass — that is the only place
   practice lives. No other records: no transcripts, no hypothesis
   scaffolding, no A/B pairs; git history keeps originals. A repeat that
   only confirms known practice still gets its row (it is one line) but no
   edit here.

## Brief template (start every brief from this shape)

Opener is fixed. One telegraphic paragraph of task facts, hard rails, an
explicit output contract. Size: ~60–150 words total for concept/mark asks
(facts only, no verbatim base); up to ~300 when ground-truth facts are the
payload (e.g. a text ask carrying per-project facts).

```
comprehensive code - <the ask: deliverable type, count, target surface>.
<task facts only: what the thing is, current state with verbatim
numbers/paths, what's wanted; "exact split yours" when divisible>.
<rails, one line each: banned set as explicit rejected siblings, never
abstractions; register steer verbatim from the owner; render size +
legibility floor; palette hexes / interfaces / links when the reply must
fit a live system>. challenge assumptions and failure cases before
answering; rationale = the why lines. reply: exactly N blocks - <exact
per-block format> - nothing else.
```

Rules that earned their place (edit only with evidence):

- Telegraphic prose-hybrid; no scaffolding (hypotheses, scoring rubrics,
  protocol steps) — scaffold cargo is what long briefs died of.
- Verbatim base code only when the reply must match house register;
  otherwise integrate and repair afterward.
- Rough-artifact contract: the model draws the thing; polish and exact
  colors/geometry are the integrator's job.
- Size for the render, never the artboard: state render size + legibility
  floor; hairlines thinner than the render survives die at render.
- Two fail modes bracket the target: too subtle (dies at render) and too
  decorative (ornament).
- The relay never carries owner-evaluation or process details.
- When independent draws converge on one family, name that convergence as a
  trap and require internal enumeration (8+ vocabularies, kill/simulate/
  score before answering, work not shown) — escape hatch, not the default.
- The endpoint is the owner's fixed chat model: outcomes are descriptive
  findings only — never run H-verdict experiments through it.
- Vary one signal per round (size band, register axis, ban list, contract
  shape); the row in results.md logs what moved.

## Files here

- `SKILL.md` — this runbook; practice edits land here.
- `results.md` — append-only round table, nothing else.
- `S2-rounds.md`, `S5-rounds.md`, `S1-S5-full-history.md` — verbatim
  archives, provenance only; never read in the normal flow.
- `agents/openai.yaml` — invocation policy; unrelated to workflow edits.
- Prompt files live outside this dir: `docs/briefs/chat-model-prompt-NN-*.md`.
