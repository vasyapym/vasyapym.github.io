# Spine — card mark distinctness — design-iteration ledger

Task: owner re-assessment of the main-menu Spine card illustration (2026-09-22).

Owner scores: Design 6/10; Consistency 8/10; Creativity 3/10; Relevance 7/10.
Main issue: the mark reads too similar to the Quicknotes card illustration —
the two cards sit back-to-back as the first two projects in the list. Owner
wants a fresher, distinctive approach that stands out immediately. Delivery:
delegated to the chat model (minimize-iteration relay), integrated here by
salvage.

Mark history: spine graph n6 → n9 → n10 ("The Seventh" vertebrae column,
commit `1373911`). The prior card verdict (F001, ui-overhaul ledger, LIKED
"keep unchanged") is explicitly superseded for this task — see F002; its text
stays unchanged there. This ledger is new; numbering starts at B/R001.

## Baseline B001 (2026-09-22)
- Artifacts: `artifacts/baseline/cards-spine-quicknotes.png` (the two cards
  side by side), `artifacts/baseline/card-spine.png`, `artifacts/baseline/card-quicknotes.png`
- Observation: confirmed on the actual render — Quicknotes (card 01) is a
  horizontal row of rounded slates, one dashed, on a halftone dot bed over a
  ground bar; Spine (card 02) is the same grammar rotated 90°: a column of
  rounded bars, one dashed slot, small rust chip, same halftone dot bed + halo.
  Side by side they read as siblings. The strongest family marks (Cat Runner's
  cat, Explosion's burst, Planck's arcs) each commit to one bold gesture;
  Spine's column of small bars commits to none and reads most generic of the
  eight.

## Feedback F002
- Round: baseline
- Verdict: REJECTED (current mark, for this task)
- Scope: Spine card illustration ("The Seventh"), main-menu project card, all viewports
- Decision: replace with a fresh, distinctive approach; must not read as a
  sibling of the Quicknotes card
- User source: scores Design 6/10, Consistency 8/10, Creativity 3/10,
  Relevance 7/10; "main issue is that it looks too similar to the Quicknotes
  project card illustration — both appear back-to-back and are the first two
  projects in the list"; "fresher approach that feels distinctive and stands
  out immediately" (2026-09-22)
- Artifact: `artifacts/baseline/cards-spine-quicknotes.png`
- Supersedes: F001 (ui-overhaul ledger, 2026-09-17) — within this task's
  scope only

## Round R001
- Goal: replace "The Seventh" with a distinctive mark that does not read as a
  Quicknotes sibling (F002) — concept round, five candidates for owner choice
- Provenance: relay round S2-R1, arm A (minimize-iteration2, task-facts-only
  telegraphic brief, contract = 5 fenced rough-SVG blocks); scored 5/5 usable,
  0 weak-route markers, 0 banned violations; experiment closed early by owner
- Preserved preferences: F002; house register consistency (owner strength:
  consistency 8/10)
- Changes: none shipped — geometry verbatim from the relay, retinted to the
  house register for the choice (deep-ink field, steel #465059, bone #b6ac95,
  rust #c56b52 accent on the protagonist element; exact colors provisional)
- Before: artifacts/baseline/cards-spine-quicknotes.png
- After: artifacts/R001/card-mark-variants.html (+ variants-preview.png);
  candidates: 1 backbone, 2 flex-wrap, 3 hash, 4 snap, 5 grow
- Visual inspection: performed — full-page headless-Chromium screenshot
  1240x900@2x; all five hold one bold gesture and stay legible at card scale;
  observations: grow's pull line reads muddiest (muted gray), snap's bracket
  slightly empty at left, flex-wrap leans "return-key"; no banned grammar
- Code verification: NOT RUN (no product code changed)
- Open question: which variant to integrate (1-5)?
