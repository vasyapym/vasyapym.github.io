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

## Round R002
- Goal: integrate the owner-chosen R001 variant (4 · snap) as the Spine card
  mark
- Preserved preferences: F002; owner choice "salvage this - 4 · snap"
  (2026-09-22)
- Changes: ProjectArtwork.tsx — SpineCenterMark replaced with the snap mark
  (relay geometry verbatim, JSX-cased, retinted steel #465059 / bone #b6ac95 /
  rust #c56b52; no halo element — matches the chosen tile rendering, so
  .presentation-spine .gem-halo simply no longer matches); the mis-headed
  comment block restored to describe QuicknotesCenterMark; no other files
- Before: artifacts/baseline/card-spine.png
- After: artifacts/R002/card-spine-snap.png (+ grid-after-snap.png)
- Visual inspection: performed — card screenshot 1440x900@2x on the dev
  server; one bold drag gesture, unmistakable next to the Quicknotes slate
  row; bracket-left still slightly empty (untouched — owner picked the
  geometry as shown)
- Code verification: shell typecheck (tsc --noEmit) clean
- Open question: owner review on Pages — LIKED/REJECTED verdict needed

## Round R003
- Goal: customize the snap mark into the house spot-ink language, like the
  other main-page card marks (owner: "add more customization")
- Preserved preferences: F002; owner choice of the snap gesture (R001, R002)
- Changes: ProjectArtwork.tsx SpineCenterMark only — added sparse printed bed
  (gem-spine-sparse @ 0.09), hover halo (gem-spine-halo + gem-halo class +
  haloVar 0.12, restoring the .presentation-spine .gem-halo pulse), a
  committed element seated in the bracket (dense rust halftone gem-spine-dense,
  edge #7e3b2c), two muted alignment ticks keying the seat; gesture geometry
  untouched
- Before: artifacts/R002/card-spine-snap.png
- After: artifacts/R003/card-spine-snap-customized.png (+ grid-after-customized.png)
- Visual inspection: performed — card screenshot 1440x900@2x on the dev
  server; committed-vs-in-flight reads at card scale; halo dot-glow matches
  the raft treatment
- Code verification: tsc --noEmit — only pre-existing errors in
  practice-map/web/curriculum.ts (another agent's uncommitted work in the
  shared tree, left unstaged); no errors in shell/src
- Open question: owner review on Pages — LIKED/REJECTED verdict needed

## Round R004
- Goal: restore the snap concept — the bracket holds an EMPTY exact seat — and
  size the mark ~17% down (owner feedback on R003: the seated second square
  broke the "space for the square" idea)
- Preserved preferences: F002; snap gesture (R001); house spot-ink
  customization (R003: bed, halo)
- Changes: SpineCenterMark — seated bordered element removed; the seat is now
  corner marks (two muted L-brackets) + faint reserved dense patch
  (gem-spine-dense @ 0.4, no border); styles.css — .center-spine max-width
  216px (= ~17% under the 260px default, same lever as .center-matrix)
- Before: artifacts/R003/card-spine-snap-customized.png
- After: artifacts/R004/card-spine-snap-seat.png (+ grid-after-seat.png)
- Visual inspection: performed — card screenshot 1440x900@2x on the dev
  server; seat reads as a reserved zone, not an element; mark proportion sits
  better in the card
- Code verification: tsc --noEmit — only the known foreign practice-map
  curriculum.ts errors (other agent, unstaged); no errors in shell/src
- Open question: owner review on Pages — LIKED/REJECTED verdict needed

## Round R005
- Goal: remove the faint reserve patch from the seat (owner: "тень резерва"
  gone) and shrink the mark ~15% more
- Preserved preferences: F002; snap gesture; empty exact-seat concept (R004);
  bed + halo
- Changes: SpineCenterMark — gem-spine-dense reserve rect deleted (pattern def
  removed with it), seat is corner marks only; styles.css — .center-spine
  max-width 216px -> 184px (-14.8%)
- Before: artifacts/R004/card-spine-snap-seat.png
- After: artifacts/R005/card-spine-snap-min.png (+ grid-after-min.png)
- Visual inspection: performed — card screenshot 1440x900@2x on the dev
  server; seat reads as pure empty spot, composition holds at the smaller size
- Code verification: tsc --noEmit — no shell/src errors (known foreign
  practice-map errors resolved upstream)
- Open question: owner review on Pages — LIKED/REJECTED verdict needed

## Feedback F003
- Round: R005
- Verdict: LIKED
- Scope: Spine card mark "Snap" as shipped in R005 — corner bracket + empty
  corner-marked exact seat + flying bone square under the rust cursor, sparse
  bed + hover halo, 184px — main-menu project card, all viewports
- Decision: adopt as the final Spine card mark; card-mark-distinct task closed
- User source: "good" (2026-09-22, replying to the R005 presentation)
- Artifact: artifacts/R005/card-spine-snap-min.png
- Supersedes: none (completes F002's replacement of "The Seventh"; F001's
  "keep unchanged" was already superseded by F002 within this task's scope)
