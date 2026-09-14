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

## Session close (2026-09-14)

- Owner verdict: park the whole redesign direction; restore the original
  Hello-Kitty-era character (commit `ac2f6e0` state) — "let's revert to
  hello kitty version for now. we will do it in a new session."
- Restored: card mark, portrait, rig, palette from `7b951df^` (= the
  pre-C001 state). Commit `e21dc33`. Checks green.
- The DMCA risk therefore RETURNS to the live site until the next session
  resolves it — owner accepted this trade-off knowingly.
- All nine redesign attempts remain in history for salvage:
  Pop Kitty (7b951df) was the closest; dry-ink v1 (30ebe55) its
  minimalist evolution; the rest rejected outright.

## Feedback F002
- Round: R002 (baseline, pre-round)
- Verdict: LIKED
- Scope: whole current character — card mark, portrait, in-game rig
- Decision: keep the current (restored Hello-Kitty-era) design; every
  change must be limited to the cat's outfit/accessory. Motivation:
  reduce DMCA/IP exposure of the GitHub Pages site; owner states the
  risk is low but wants the distance anyway.
- User source: "I really love the current design, so I don't want to
  change it. But let's make changes - only on cat's outfit." (session
  opening message, 2026-09-14)
- Artifact: R002 before-shots (card-mark/portrait/menu-rig before).
- Supersedes: F001 scope (portrait-only rework) — the parked full-redesign
  direction stays parked; new session narrows scope to outfit-only.

## Round R002
- Goal: strip the most recognisable Sanrio trade-dress element — the ear
  bow — from all three art surfaces while leaving the loved design
  otherwise untouched (owner directive F002: outfit-only).
- Preserved preferences: F002 (keep the design; change outfit only);
  baseline LIKED card-mark composition; face/proportions/palette per
  "don't want to change it".
- Changes: the ear bow replaced by a flat ink-outlined star ear-clip at
  the same spot, same accent colour per surface (pink #ff8fbf + deep
  #a33a72 on the card mark; red #e94f64 + deep #d13a50 on the portrait
  and the rig). Star ties to the game's own star-pickup language.
  Rig: starShape(0.21, 0.088) + starCore geometry replace bowLoop/bowKnot
  (removed); bowRef jiggle pose (bowRot/bowScale) kept unchanged; dress,
  face, palette keys untouched. Card mark: bow ellipses → star polygon +
  deep hub dot. Portrait: three bow paths → star polygon + deep dot.
- Before: R002-*-before.png (baseline shots, static build 155f666).
- After: R002-*-after.png (same viewports, same states, static build of
  the working tree; screenshots at deviceScaleFactor 2-3).
- Visual inspection: performed — Chromium 1134 (playwright cache) against
  a production build served statically; card mark close-up, portrait
  close-up, menu rig close-up, mid-run rig. Star legible at all three
  scales; face, dress, whiskers, composition unchanged; no z-order or
  overflow artifacts observed.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shell build PASS.
  NOTE: kitty-run.shots.mjs itself was NOT used (its dev-server +
  networkidle0 flow hung on this machine); a probe-equivalent scratch
  script rendered the same routes from the built dist instead.
- Open question: does the star ear-clip keep the character lovable while
  reading as clearly-not-Sanrio, or should the round try a different
  accessory / also rethink the dress?
