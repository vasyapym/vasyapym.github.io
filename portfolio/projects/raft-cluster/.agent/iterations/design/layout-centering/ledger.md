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
