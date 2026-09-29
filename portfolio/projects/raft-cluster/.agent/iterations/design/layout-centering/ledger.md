# Ledger — raft-cluster layout centring (readout + legend)

Task: owner request (2026-09-29 session): the header readout row and the canvas
legend should sit centred relative to the cluster simulation — on mobile and
desktop — and on mobile the "5 nodes" / "Reset cluster" header controls should
drop to roughly the size of the neighbouring "cluster" label. Continues the
finished-quality page (commit 6db0f2d + c3eef14); predecessor ledgers in this
task family: `../finished-quality/` (F004/F005, thread closed), and copy
register `../trim-thesis-copy/` (F001/F002) stays standing.

Prior art: finished-quality R001 header put the readout left with controls
right (flex space-between); the legend tracked left-aligned under its rule.

## Round R001
- Goal: readout + legend centred on the canvas centreline at every width; on
  mobile, header controls sized down to the "cluster" label.
- Preserved preferences: finished-quality F004 (readout stays at the removed
  title's level — vertical placement kept; horizontal alignment superseded by
  F001 below); trim-thesis-copy F001/F002 (no wordy copy) — untouched.
- Changes: web/raft.css only (RaftPage.tsx untouched):
  - .raft-head flex space-between → grid mirroring .raft-grid's 2fr/1fr
    template (in-source comment says to keep the two templates in sync):
    readout in cell 1, controls in cell 2 justified end so desktop controls
    keep their old right-corner position;
  - .raft-readout and .raft-legend gain justify-content: center (all widths);
  - ≤900px: header collapses to one column — readout row, then a centred
    controls row, matching the single-column canvas below;
  - ≤560px: header select + Reset button shrink to var(--raft-fs-meta)
    (12px) text, 22px min-height, 8px side padding (they were 32px tall,
    14px text, 12px padding); select chevron right offset retuned 13→10px.
- Before: artifacts/baseline/ (rest-desktop-1440, rest-mobile-390)
- After: artifacts/R001/ (rest-desktop-1440, rest-desktop-980, rest-mobile-390)
- Visual inspection: PERFORMED — read all three after-shots. Measured
  centreline of canvas/readout/legend is identical per width: 512px @1440,
  331px @980, 195px @390. Legend wraps into centred lines @980 and @390.
  Mobile controls optically match the 12px label (select 75×22px, reset
  89×22px vs label line 18px). Desktop controls unchanged at the right edge.
  No overflow at 390/980/1440.
- Code verification: `npm run typecheck` (portfolio/shell) PASS. CSS-only
  change; no TS/logic touched.
- Open question: LIKED / REJECTED on the round. Standing disclosure: at ≤560px
  the select's 12px text can trigger iOS Safari zoom-on-focus (the coarse-
  pointer 16px rule was deliberately kept for the side panel's propose input);
  say the word on a real device and the select alone goes back to 16px.

## Feedback F001
- Round: R001
- Verdict: REJECTED
- Scope: header readout alignment (all viewports) + canvas legend item
  alignment (all viewports) — the centring-on-the-cluster treatment.
- Decision: the readout goes back left / controls-right (flex space-between),
  the legend items back left-aligned; the header grid mirror and the ≤900px
  centered stacking are dropped. No centring of either row anywhere.
- User source: "revert the last changes. keep only making buttons small
  (but keep only for mobile)"
- Artifact: artifacts/R001/*
- Supersedes: the centring aspect of this task's owner request; unfinds none
  of the liked finished-quality layout (F004/F005).

## Feedback F002
- Round: R001
- Verdict: LIKED
- Scope: ≤560px header controls — select ("5 nodes") and Reset cluster button,
  rest state, mobile viewport only.
- Decision: header controls stay shrunk to the "cluster" label's visual size
  (12px text, 22px min-height, 8px side padding). The coarse-pointer 16px rule
  is kept for the propose input; the select at 12px may zoom on iOS focus —
  accepted unless the owner says otherwise on a real device.
- User source: "keep only making buttons small (but keep only for mobile)"
- Artifact: artifacts/R001/rest-mobile-390.png (state kept into R002)
- Supersedes: none.

## Round R002
- Goal: revert R001's centring everywhere; keep only the ≤560px header-control
  shrink.
- Preserved preferences: F002 (mobile small header controls);
  finished-quality F004/F005 (left readout / right-controls header, left
  legend restored to the liked R002-of-finished-quality state).
- Changes: web/raft.css only —
  - .raft-head back to R002-of-finished-quality flex space-between (grid
    mirror deleted, comment restored);
  - .raft-head-controls flex-end removed; .raft-readout and .raft-legend
    justify-content: center removed;
  - ≤900px block back to grid-columns + feed max-height only (no header
    overrides);
  - ≤560px shrink block kept verbatim. `git diff a55e07b~1 -- raft.css`
    shows the shrink block as the ONLY remaining delta vs the pre-round
    state.
- Before: artifacts/R001/ (all three shots)
- After: artifacts/R002/ (rest-desktop-1440, rest-desktop-980, rest-mobile-390)
- Visual inspection: PERFORMED — read the 1440 and 390 after-shots: readout
  left / controls right, legend items left under the rule (measured readout
  cx 339 @1440 = pre-round baseline position), desktop controls 32px/14px
  restored; mobile keeps the small controls (select 75×22, reset 89×22,
  12px) with everything back left. Legend-box cx equals canvas cx (the box
  spans the stage) but items sit left, as in the liked baseline.
- Code verification: `npm run typecheck` (portfolio/shell) PASS, exit 0.
  CSS-only change.
- Open question: none from F001/F002 (the owner split the verdicts himself);
  awaiting the routine liked/rejected confirmation of THIS round's render.

## Feedback F003
- Round: R002
- Verdict: REJECTED
- Scope: ≤560px header controls size — the value, not the treatment.
- Decision: the 22px/12px compact size is too small; the mobile header
  controls grow ~20% (26px min-height, 14px text, token values). The mobile-
  only scope, left alignment, and small-vs-desktop treatment of F002 stay.
- User source: "make button in mobile bigger. currently it looks too small.
  make it by around 20%"
- Artifact: artifacts/R002/rest-mobile-390.png (state being revised)
- Supersedes: F002's size values (12px/22px) within that record's mobile-
  control-size scope; F002's mobile-only treatment itself stays liked.

## Round R003
- Goal: mobile header controls ~20% bigger than the F002 compact size.
- Preserved preferences: F002 (mobile-only, small-vs-desktop, left layout);
  F001 (no centring anywhere); finished-quality F004/F005.
- Changes: web/raft.css ≤560px block only — select + Reset button font
  var(--raft-fs-meta) 12px → var(--raft-fs-ui) 14px, min-height 22px → 26px
  (+~20% on both axes), side padding unchanged 8px; field comment reworded
  ("close to the label's visual size"). No other selector touched.
- Before: artifacts/R002/rest-mobile-390.png
- After: artifacts/R003/ (rest-desktop-1440, rest-desktop-980, rest-mobile-390)
- Visual inspection: PERFORMED — read R003 mobile 390 and desktop 1440.
  Mobile: select 85×26px, reset 102×26px, 14px text (vs 75×22/89×22/12px in
  R002 ≈ +18% height, +17% text) — still visibly compact vs the desktop
  32px/14px pill and the 12px label. Desktop 1440: measured select 95×32,
  reset 110×32 (unchanged from R002); visually identical to the R002 render.
- Code verification: `npm run typecheck` (portfolio/shell) PASS, exit 0.
  CSS-only change. (One transient headless-goto timeout during the first
  shot attempt; rerun succeeded — all three R003 PNGs written by the probe.)
- Open question: LIKED / REJECTED on the round.

## Feedback F004
- Round: R003
- Verdict: LIKED
- Scope: R003 as a whole — ≤560px header controls at 26px/14px; layout
  otherwise as the liked R002-of-finished-quality baseline.
- Decision: the round stands with no changes; the layout-centering thread is
  CLOSED. Active task complete: mobile-only small header controls at 26px
  min-height / var(--raft-fs-ui) 14px text, everything else per the liked
  baseline (R002 state). Standing constraints: F001 (no centring of readout
  or legend anywhere), F002/F003 (mobile-only, compact treatment),
  trim-thesis-copy F001/F002 (wordy copy register), iOS zoom-on-focus
  disclosure for the ≤16px select stands unless raised on a real device.
- User source: "liked"
- Artifact: artifacts/R003/rest-mobile-390.png
- Supersedes: none.
