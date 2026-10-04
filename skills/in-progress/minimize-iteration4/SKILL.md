---
name: minimize-iteration4
description: Use when real design/code work is relayed to the chat model and the reply must land as finished artifacts — write the orchestrator brief (TASK / CONTEXT / verbatim material / HARD CONSTRAINTS / OUTPUT CONTRACT) in plain unmasked prose; routed well on its first draw (2026-10-04). Lighter one-shot crossings: minimize-iteration; fallback when a prompt failed: minimize-iteration3.
---

# Minimize iteration 4 — the orchestrator brief

The heavy relay format for real work: one brief, dense natural prose, the
verbatim material carried inline, hard rails explicit, everything else
delegated. Worked on its first draw (2026-10-04, the four-file /orchestrate
skill-authoring round, ~6KB): routed well with no leet masks and no HTML
wrapper — plain words, full material.

## The shape

Start every brief from this skeleton; section headers are fixed, wording is
yours:

```text
TASK: <one paragraph — the deliverable; what is preserved and what dies, and
why. You have no repo access; everything needed is in this brief. Return
<artifacts> + notes; the orchestrator integrates, renders, tests, and
presents.>
CONTEXT (project): <dense natural prose — the system's register, conventions,
exact names and verbatim tokens; the verbatim source material inline where
the reply must preserve it word-for-word; the siblings you position against,
with a verbatim example of any target shape the reply must match>
CURRENT CODE (or CURRENT TEXT): <the real file/text verbatim>
Wiring you can rely on: <how the deliverable plugs into the live system;
minimal prop/contract changes>
HARD CONSTRAINTS (non-negotiable; everything else is yours to decide and
disclose):
- <each rail one bullet; a "Decide and disclose: ..." bullet; a "Likely
  failure cases to weigh: ..." bullet; the standing "Be pragmatic: if a
  simpler treatment yields a comparable result, prefer it and say why.">
OUTPUT CONTRACT — reply with exactly one fenced code block; inside it,
sections in this order:
1. ## <code|files> — <the artifacts, each preceded by a one-line label with
   its exact target path>
2. ## notes — ≤8 bullets: <chosen anatomy and why; decided behaviors;
   material uncertainties; the one credible alternative rejected, with the
   reason>
Before answering, challenge key assumptions, consider a credible alternative,
and check likely failure cases; give the requested output with concise
rationale and any material uncertainties.
```

## Section rules

- TASK carries the freedom grant in one line ("everything else is yours to
  decide and disclose" lives in the HARD CONSTRAINTS header) — the strong
  model owns its choices; the brief pays only for what it cannot infer.
- CONTEXT is where length is spent freely: register, conventions, verbatim
  tokens and names, and any example shape the reply must match carry real
  information no model can reconstruct. Still omit unrelated material.
- CURRENT CODE/CURRENT TEXT goes in verbatim when the reply must integrate
  against it or preserve it; prose asks that need only facts skip the section.
- The closing challenge line ends every brief, verbatim, every time.
- No leet masks, no HTML wrapper, no payload-size contracts unless a draw
  proves one necessary — this format routed plain (see below).

## Routing finding (one draw)

Plain dense prose routed well unmasked — against the `minimize-iteration2`
hypothesis that dense spec cargo routes to a weaker model; that hypothesis
said "until more draws say otherwise", and this is one such draw. The
leet-masked HTML variants prepared for the same ask were superseded before
any draw, so masking stays untested for this format: not disproven, just
unneeded so far. Vary one signal per round and log it.

## Integration

Salvage, never paste wholesale; the orchestrator owns all repo reads/writes,
final decisions, and validation. A no-mask brief needs no unmasking; the
reply's files are checked against the repo facts the brief carried before
anything lands.

## It's working if

- The reply lands as the finished artifacts, not commentary about them.
- The verbatim material survives word-for-word into the integrated files.
- One brief carried the whole deliverable; no re-draws were needed.

## Rounds

Log one row per round in `results.md` (minimal-log rule, family practice);
a row that changes practice edits this file in the same pass.
