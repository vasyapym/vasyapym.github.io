# Quicknotes — card mark redesign — design-iteration ledger

Task: owner-ordered redesign of the main-menu Quicknotes card illustration
(2026-09-23). Taste bar: senior developer leaning minimalist (F005 of the
main-page-presentation ledger — restraint over spectacle). The mark must stay
organically consistent with the house spot-ink language of the other seven
card marks while being refined and creative, not generic. Delivery: 10
original SVG concepts drafted by the chat model (relay), integrated and tuned
here by the orchestrator.

Mark history: the current mark (four slates seated on a desk line, fifth
airborne dashed) is undocumented in this project's ledgers — predates this
task. House language reference: ProjectArtwork.tsx CENTER_MARKS (8 marks,
shared register). Sister task: spine card-mark-distinct ledger (2026-09-22,
snap mark) — the Spine mark was redesigned specifically to stop reading as a
Quicknotes sibling; the new Quicknotes mark must not drift back toward Spine's
bracket-snap grammar either.

Card context: artwork stage 168px tall (≥900px widths), mark max-width 218px
(80% stage fill), marks scale as one ×0.84 family; ≤900px: stage 150px, base
max-width 260px→(mobile grid). Panel ground #0b1317. Hover: svg scale 1.06
via CSS + optional .gem-halo opacity brighten (the current mark has NO halo —
the only mark without one).

## Baseline B001 (2026-09-23)
- Artifacts: `artifacts/baseline/card-quicknotes.png`,
  `card-spine.png`, `card-explosion.png`, `cards-all.png` (all eight cards,
  1440x900@2x, dev server)
- Observation (actual render): the Quicknotes mark is a horizontal row of four
  28px rounded slates on a ground bar, a dashed fifth airborne above-right, a
  9px dot under it, on a halftone dot bed. Palette: #26333b/#465059/#7b93b3
  strokes/#7aa2f7 accent — it skips the house bone #b6ac95 and paper #eeeae0,
  has no gem-halo (only mark without the hover pulse), no white glints, no
  layered narrative. Compared side-by-side (cards-all.png): Cat Runner commits
  to a face, Explosion to a burst, Raft to an election cascade, Evening Forest
  to a landscape, the archive to an occupancy wall, Spine to a snap gesture,
  Planck to cosmic arcs — Quicknotes commits to "row of squares" and reads as
  the most generic of the eight. The slates are also the same 28px square
  grammar as Spine's dragged square (mild sibling risk again).
- Baseline probe: `portfolio/probes/quicknotes-mark-baseline.mjs` (scratch,
  never staged). NOTE for this sandbox: Chromium cannot reach loopback
  (localhost/127.0.0.1 hangs) — serve the dev server with `--host` and open
  the LAN IP (`ipconfig getifaddr en0`); external URLs are unaffected.

## Feedback F001
- Round: baseline
- Verdict: REJECTED (current mark, for this task)
- Scope: Quicknotes card illustration (main-menu project card), all viewports
- Decision: replace with an original mark — senior-dev minimalist aesthetic,
  no generic patterns, refined/creative/organically consistent with the house
  language
- User source: "Let's redesign the QuickNotes project card illustration in the
  main menu. Aim for a senior-dev minimalist aesthetic—avoiding generic
  patterns in favor of a refined, creative, yet organically consistent look.
  Have the chat model generate 10 original SVG code concepts, which you will
  then tune." (2026-09-23, task brief)
- Artifact: `artifacts/baseline/card-quicknotes.png`
- Supersedes: none

## Round R001
- Goal: replace the slate-row mark (F001) — concept round, 5 candidates for
  owner choice, showcased online (owner asked for a link, no refinement until
  the pick)
- Provenance: relay S5 round 2 (minimize-iteration2, relaxed protocol; the
  5-count task-facts shape carried over from the S2 spine win, after round 1's
  10-count telegraphic ask drew weak — owner verdict, reply not returned)
- Preserved preferences: F001 (replace, senior-dev minimalist, organically
  consistent); house register (retint-only rule from the spine R001 precedent)
- Changes: none shipped — choice round. Candidate page renders the relay's
  5 SVGs with geometry verbatim; retint-only (neutrals ramp + blue accent on
  the protagonist; taken hues swapped out); full-bleed canvas rects stripped
  (panel provides the ground). No refinement before the pick.
- Candidates: 1 double-bracket knot · 2 split pane hash · 3 command chevron ·
  4 branching tick · 5 local anchor, cloud echo
- Before: artifacts/baseline/card-quicknotes.png
- After: artifacts/R001/card-mark-variants.html (+ variants-preview.png);
  live: https://vasyapym.github.io/quicknotes-mark/
- Visual inspection: performed — full-page headless-Chromium screenshot
  1240px@2x inspected; all five hold one bold gesture, read at the 150px
  card-scale strip; no banned grammar
- Code verification: NOT RUN (no product code changed)
- Open question: which variant to integrate (1–5)?

### R001 addendum (2026-09-23, same session)
- Owner supplied a second relay draw (same 5-count shape) while reviewing:
  candidates 6–10 appended to the choice page, same rules — geometry verbatim,
  retint-only, bg rects stripped. 6 double gate · 7 hash headline ·
  8 quick strike · 9 backlink knot · 10 sync ring
- After: artifacts/R001/variants-preview.png (10 tiles) re-shot; live page
  updated.

### R001 addendum 2 (2026-09-23, same session)
- Third relay draw appended as candidates 11–15, same rules: 11 linkwell ·
  12 boltmark · 13 palette knot · 14 orbit home · 15 fastquote (this draw
  arrived with no bg rects — contract learned).
- Cross-draw skeleton overlap now visible on the page: brackets ×3 (1, 6,
  11), hash ×3 (2, 7, 12), sync-orbit ×3 (5, 10, 14). Disclosed as-is —
  owner picks from the full 15.
- After: artifacts/R001/variants-preview.png (15 tiles) re-shot; live page
  updated.

## Feedback F002
- Round: R001 (all four draws, 20 candidates)
- Verdict: REJECTED
- Scope: the whole bold-glyph register of the batch (fat 12–22px strokes,
  single-shape marks: brackets, hashes, bolts, loops, chevrons) plus the
  prompt framing that produced it ("one bold gesture", "concept directions")
- Decision: the owner wants the opposite register — refined, detailed,
  illustration-like marks (layered masses, texture, small narrative detail),
  not bold poster glyphs; delegate freely instead of over-constraining
- User source: "these are not it. i want it more refined/detailed. not bold.
  don't write in the prompt 'concept directions'. they can do anything, why
  not delegate." (2026-09-23)
- Artifact: artifacts/R001/variants-preview.png (20 tiles)
- Supersedes: none (narrows F001 — replacement still stands; register
  direction corrected)

### R001 addendum 3 (2026-09-23, same session)
- Fourth draw appended as candidates 16–20: 16 link knot · 17 struck hash ·
  18 constellation · 19 command loop · 20 render prism (single-red draw,
  paper bg rects stripped as before).
- Fix disclosed: tile 16's first render put the accent on the tiny tie bar
  while the tint text claimed chain → accent — corrected (chain → blue,
  brackets → slate, tie → paper) before shipping.
- Verdict F002 (register rejected) arrived while the owner reviewed; the
  page stays up for reference. After: artifacts/R001/variants-preview.png
  (20 tiles).

### R001 addendum 4 (2026-09-23, same session)
- Fifth draw (from the OLD bold brief, returned after the F002 register
  rejection) appended as candidates 21–25: 21 link clasp · 22 backlink
  constellation · 23 prompt lens · 24 ember nib · 25 hash eye. Same rules:
  geometry verbatim, retint-only, bg rects stripped, <title> tags dropped
  for aria-labels. Owner judges; the refined/detailed round-5 brief is with
  the relay in parallel.
- After: artifacts/R001/variants-preview.png (25 tiles).

## Feedback F003
- Round: R001 (choice page, 25 candidates)
- Verdict: LIKED (with direction)
- Scope: candidate 24 · ember nib, as the base for the refined mark;
  consistency references — "Waste of tokens" card mark first, Spine second
  (for size and register); note: the draws come from a randomized relay with
  no chat history (independent draws)
- Decision: refine candidate 24 to house consistency — size calibrated
  against the archive-wall and spine marks
- User source: "i actually like this one - '24 · ember nib'. but it should be
  refined and made consistent. out of the all the illustrations i like 'Waste
  of tokens' ones'. Spine - second. consider them for size and whatnot"
  (2026-09-23)
- Artifact: artifacts/R001/variants-preview.png (tile 24)
- Supersedes: none

## Round R002
- Goal: integrate owner pick (candidate 24 · ember nib, F003) — refined to
  house consistency; size calibrated against the matrix wall mark (primary
  ref) and spine (second)
- Preserved preferences: F001 (replace), F002 (refined/detailed register),
  F003 (base + consistency references)
- Changes: ProjectArtwork.tsx — QuicknotesCenterMark replaced with the
  refined ember nib: candidate-24 base geometry (paper nib mass, blue flame,
  panel-knockout slit + breather) + house devices added: sparse printed bed
  (dots, 0.09), gem-halo (blue dots, 0.12, CSS hover pulse), stepped bone
  cap behind the nib mass, stacked flame fills (blue + lighter inner cap),
  dashed sync wisp + paper ghost dot (future), two white square glints.
  styles.css ≥900 block — .center-quicknotes max-width 232 (the nib's ink
  footprint is narrow, ~30% of box width vs plate marks' ~70%; the bump
  lands its visual weight between matrix 186 and base 218).
- Before: artifacts/baseline/card-quicknotes.png (old slate row)
- After: artifacts/R002/card-quicknotes-after.png (+ card-matrix-ref.png,
  card-spine-ref.png)
- Visual inspection: performed on the real page (probe, 1440x900@2x), two
  iterations — base cap read undersized next to the matrix plate; 232 cap
  shot inspected: mark clear at card scale, headroom ~13px top/bottom (in
  family), bed+halo seated, wisp and glints survive card scale, knockout
  slit clean, flame is the only accent (protagonist).
- Code verification: tsc --noEmit green (tsx + css-only).
- Open question: owner judges the refined nib live (deploy follows the
  push); halo pulse and the ≤900px band not visually verified this round
  (desktop shots only).

## Feedback F004
- Round: R002
- Verdict: REJECTED
- Scope: the shipped refined ember nib (quicknotes card mark, all viewports)
- Decision: too prominent — replaced as the pick; new base is candidate
  23 · prompt lens (from the same 25-tile page), refined to the same house
  treatment
- User source: "it looks too prominent. let's do this instead - '23 · prompt
  lens'" (2026-09-23)
- Artifact: artifacts/R002/card-quicknotes-after.png
- Supersedes: F003's pick (candidate 24) — F003's consistency references
  (matrix first, spine second) stay in force

## Round R003
- Goal: F004 — replace the too-prominent nib with candidate 23 · prompt
  lens, refined with the same house treatment
- Preserved preferences: F001, F002, F003's consistency references (matrix
  first, spine second); F004 (new base, less prominence)
- Changes: ProjectArtwork.tsx — QuicknotesCenterMark replaced with the
  refined prompt lens: candidate-23 geometry (ring r44 + handle, chevron +
  underscore) with house devices: sparse printed bed (0.09), gem-halo
  (blue dots 0.12, centered on the lens — its dots show through the open
  glass, a kept accident reading as frosted glass), stepped bone edge
  behind the paper ring, blue accent on the prompt glyphs (protagonist),
  two white square glints (rim + glass). styles.css — the nib's 232px
  quicknotes cap reverted (lens uses the family base 218; its ink footprint
  is naturally wider).
- Before: artifacts/R002/card-quicknotes-after.png (the nib)
- After: artifacts/R003/card-quicknotes-lens.png
- Visual inspection: performed on the real page (probe, 1440x900@2x) —
  lens + handle read clear at card scale; blue prompt glyphs carry the
  accent; stepped bone edge visible upper-left; halo dots visible through
  the glass interior (kept deliberately); no towering vertical mass (the
  nib's prominence issue is structurally gone — horizontal composition).
- Code verification: tsc --noEmit green.
- Open question: owner judges the lens live (deploy follows the push);
  halo pulse and ≤900px band still not screenshot-verified (desktop only).

## Round R004
- Goal: F005 — lens ~25% smaller, ring re-coloured to the Spine-square tone
- Preserved preferences: F003 (consistency refs), F004 (no prominence),
  R003's device set (bed, halo, blue prompt glyphs, glints)
- Changes: styles.css ≥900 — .center-quicknotes max-width 164px (218 ×
  0.75). ProjectArtwork.tsx — lens ring + handle #eeeae0 → #b6ac95 (the
  spine-square colour, single-weight stroke like the square itself); the
  bone step behind the ring dropped (redundant behind a bone ring).
  Related one-line change from the same owner message (outside the mark):
  hero note "visual experiments" → "scripted messes" — owner wrote
  "scipted"; shipped the corrected spelling "scripted", flag if the literal
  was wanted (LandingPage.tsx:857).
- Before: artifacts/R003/card-quicknotes-lens.png
- After: artifacts/R004/card-quicknotes-lens-small.png
- Visual inspection: performed on the real page (probe, 1440x900@2x) —
  lens quieter, ink spans ~100px of the stage; bone ring + handle match
  the Spine square tone; blue glyphs remain the accent; halo dots still
  read through the glass.
- Code verification: tsc --noEmit green.
- Open question: owner judges live; halo pulse + ≤900px band still not
  screenshot-verified.

## Round R005
- Goal: owner steer on R004 — lens ~7% bigger, ring ~10% whiter
- Preserved preferences: F003/F004/F005 chain; R004's device set and colour
  family
- Changes: styles.css ≥900 — .center-quicknotes max-width 164 → 176
  (164 × 1.07). ProjectArtwork.tsx — ring + handle #b6ac95 → #bcb29c
  (bone mixed 10% toward paper #eeeae0, stays in the house warm ramp).
- Before: artifacts/R004/card-quicknotes-lens-small.png
- After: artifacts/R005/card-quicknotes-lens-r5.png
- Visual inspection: performed on the real page (probe, 1440x900@2x) —
  mark slightly larger, ring reads a touch lighter; glyphs + glass dots
  unchanged; composition balanced.
- Code verification: tsc --noEmit green.
- Open question: owner judges live; halo pulse + ≤900px band not
  screenshot-verified.
