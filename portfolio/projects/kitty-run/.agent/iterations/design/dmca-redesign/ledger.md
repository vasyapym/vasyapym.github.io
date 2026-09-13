# Design ledger — kitty-run character redesign (DMCA-safe)

Task slug: `dmca-redesign`. Ledger started after the code-iteration phase
(passes C001–C013, see `.agent/iterations/code/dmca-redesign/passes.md`)
handed visual acceptance to the owner. The owner then steered design into
this ledger: one change at a time, explicit feedback per round.

## Baseline (2026-09-14)

- Landing card mark (`KittyCenterMark`): owner LIKED — "i love main page
  illustration". Paper shell, sun-gold level eye lines, leather scarf,
  halftone jaw shading on the dark plate.
- Character-select portrait (`KittyPortrait`): owner REJECTED as-is —
  "looks girly and like a medical worker"; also flagged (earlier, C013
  round): "naked", "beard", "one whisker per side", "eyes stereotyping
  asians", "want it white". Partial fixes shipped (927d4c0) but the
  verdict stands: rework with taste.
- In-game rig: owner REJECTED as stale — "left unchanged, need the same
  tone as the main-page character". Eyes: "I like the eyes —
  Asian-inspired but not stereotypical" (i.e. the gold level-gaze lines
  read well on the card; keep that spirit without the stereotype read).
- Active direction: "wanderer" (SPEC-9K4 salvage) — paper/ink/sun/leather
  palette, calm adult attitude. Owner-approved core.

## Rejected-trait dictionary (from the code-phase verdicts, still active)

girly pastel · pixel grid · damage/scruffy · open mouth · forehead
stripes · slit-bar eyes as THE face · dead flat fills · accessory pile ·
"medical worker" whites+collar read · Asian-stereotype eye lines ·
beard/stubble read · one-whisker-per-side read · naked/torso-less read.
