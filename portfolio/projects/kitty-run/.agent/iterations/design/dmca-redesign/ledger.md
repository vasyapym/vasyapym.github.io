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

## Round D001
- Goal: fix the portrait's "girly + medical worker" read while keeping the
  owner-loved card language (paper/sun/leather, level gold gaze).
- Preserved preferences: none formalized yet (baseline above).
- Changes: (1) shirt buttons/placket → a leather YOKE across the chest +
  center strap with a sun buckle — travel gear silhouette, not a nurse's
  collar; (2) eyes: gold level strokes KEPT but softened with a curved
  ink lower lid — "asian-inspired but not stereotypical" per the owner's
  card-eye approval; (3) mouth line stays removed (beard); (4) whiskers:
  two thin pairs/side, high (no one-whisker or stubble read); (5) base
  stays white #ffffff (owner asked for white).
- Before: 927d4c0 portrait (buttons + collar band + oval eyes).
- After: working tree 625cfe5.
- Visual inspection: NOT VISUALLY VERIFIED — no browser binary on this
  machine; reasoned from geometry only.
- Code verification: `npm --prefix portfolio run typecheck` PASS (0
  errors); `node --experimental-strip-types .../kitty-run.check.ts` PASS.
- Open question: does the leather yoke kill the "medical worker" read,
  and do the lower-lid eyes read warm rather than stereotyped?

## Feedback F001
- Round: D001 (baseline, pre-round)
- Verdict: REJECTED
- Scope: character-select portrait, whole figure
- Decision: previous portrait read "girly and like a medical worker";
  also naked/beard/one-whisker/asian-stereotype/white-coat asks from the
  same message — all addressed in D001, awaiting verdicts.
- User source: "character choosing illustration no. it is naked... i
  want it to be white. eyes different. currently it looks like
  stereotypizing asians... the beard is still there" + "looks girly and
  like a medical worker".
- Artifact: 927d4c0 portrait.
- Supersedes: none.
