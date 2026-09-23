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
