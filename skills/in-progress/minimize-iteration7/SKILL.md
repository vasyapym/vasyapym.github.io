---
name: minimize-iteration7
description: Use for question-form relays whose payload must be large verbatim material — whole working files or whole design documents — and for new-build design asks where a decided-facts section (session decisions shipped as facts that win where the source document differs) replaces the working draft; founding draws 2026-10-12 (clean: PHP orphans delete page rework with an ~800-line draft verbatim; partial: second-brain v1 design into a NestJS app). Small question-form reworks: minimize-iteration3; heavy sectioned contracts: minimize-iteration4; ASCII-constrained minimal edits: minimize-iteration6.
---

# Minimize iteration 7 — decided-facts relay (large verbatim payloads)

Descendant of `minimize-iteration3`: the same question-form opening, scaled to
payloads too large for its small-draft habit — whole files and whole source
documents ride verbatim ("larger code blocks", the owner's founding
instruction), and on new-build design asks a **verified-facts** section
replaces the working draft: session decisions shipped as facts, with explicit
precedence over the source material.

## The shape

```text
what will be the finished <artifact> below for the <materials> inside it?

--- verified facts (decided; they win where the sources differ) ---
<session decisions and owner-verified observations as flat fact bullets —
past tense, with the reason each dropped or changed item is dropped or changed>
--- existing code (the artifact must fit) ---
<working sibling code, near-whole, verbatim — the shape and style contract
by example>
--- <source document> (verbatim; <which parts> are the contract) ---
<the full source document, never excerpted or summarized>
```

Rework variant (founding round A1): when a working artifact exists, it takes
the first section whole — `--- working draft (working current state to
refine, keep its behavior) ---` with the full file verbatim — and the
owner-facts section follows it. That is `minimize-iteration3`'s draft
contract at full-file scale.

## What each section carries

- The question names the artifact whose quality is wanted ("finished better
  version of the page", "finished design of the X module"), never the method:
  no deliverable spec, no acceptance criteria, no decisions menu — the code
  and the facts carry the contract (A1 routed clean with zero instructions).
- Verified facts are decisions and owner-checked observations phrased as
  ground truth ("the waker is dropped: the service never sleeps"), with a
  precedence note so a contradicting source document does not re-litigate
  decided points. This is the new-build replacement for the working draft.
- Existing working code ships near-whole: it is the fit and style contract
  ("the artifact must fit"), the design-scale sibling of `minimize-iteration3`'s
  ugly draft.
- The source document ships whole and verbatim: owner-verbatim wording is
  part of the contract (Q5 lesson — salvage can re-take structure, but
  re-worded owner text is lost), and at this scale the shape contract is
  carried by example instead of description.

## Why it routes (hypothesis, two draws)

The `minimize-iteration3` mechanics still carry it: the question reads as
"improve this given material" — implementation mode, not generation mode —
and the block is pure payload with no instruction scaffolding to weigh. Two
levers on top: decided facts read as observations of the world rather than
asks, and the precedence note turns a contradicting source document into
context instead of a counter-brief.

## Scope guard (founding round A2, partial draw)

One brief returns one artifact. A2 asked for a whole-module design (auth +
schema + search + reader + indexer + workflow) in one draw and landed
partial: routed, owner judged it "somewhat worked", and the reply never
returned for salvage, so the repair scope is unknown. Split multi-part builds
into sequential briefs — design first, then code phases — and carry each
round's settled results into the next brief's verified-facts section. Do not
trust the design-ask variant on one partial draw; A1's clean draw backs the
rework variant only.

## Integration

Salvage, not compliance; the orchestrator owns all repo reads/writes and
validation. When the reply polishes away owner-verbatim wording, take its
structure and re-apply the original text by hand (family practice from
`minimize-iteration3`). Decided points that come back re-litigated are
repaired by hand, not re-drawn.

## It's working if

- The reply lands as a near-final artifact or design, not commentary.
- Decided points survive: dropped components are not designed back in.
- Owner-verbatim material survives, or its structure is salvaged and the
  original text re-applied at integration.
- One brief carried the deliverable; salvage repairs conventions, not
  substance.

## Rounds

Log one row per round in `results.md` (minimal-log rule, family practice);
a row that changes practice edits this file in the same pass. A row is
self-contained — task and outcome in words, no prompt paths: the brief is
not an artifact, the chat transcript is its only record.
