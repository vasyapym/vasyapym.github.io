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

## Feedback F003
- Round: R002 (verdict on the presented round)
- Verdict: LIKED
- Scope: outfit-swap direction itself (bow removal, outfit-only course)
- Decision: "heading in the right direction" — the outfit-only DMCA
  course is approved.
- User source: "This is heading in the right direction." (2026-09-14)
- Artifact: R002 after-shots.
- Supersedes: none.

## Feedback F004
- Round: R002 (verdict on the presented round)
- Verdict: REJECTED
- Scope: star ear-clip accessory, all three surfaces (card mark,
  portrait, rig)
- Decision: the star reads as too small a filling for the bow's spot —
  "without the bow, the cat looks bald". The accessory must carry the
  bow's visual mass.
- User source: "One concern: without the bow, the cat looks bald."
- Artifact: R002 after-shots.
- Supersedes: none (the star was never a liked preference).

## Round R003
- Goal: replace the rejected star with a bandana that keeps the design's
  silhouette, sits off to one side (the star's spot), and dangles like
  the bow did — owner directive, verbatim plan:
  (1) bandana positioned off to one side where the star is;
  (2) the bandana should dangle like the bow did.
- Preserved preferences: F002 (keep the design, outfit-only), F003
  (direction liked).
- Changes: all three surfaces get a small side-tied bandana at the
  right ear base — a cloth band across the ear base, a knot at the
  outer (upper-right) end, and two pointed cloth tails hanging from
  the knot (back tail darker/longer, front tail lighter/shorter).
  Accent per surface unchanged (pink #ff8fbf+#a33a72 card mark; red
  #e94f64+#d13a50 portrait and rig). Rig: starClip/starCore geometries
  removed; bandanaBand/bandanaTail/bandanaKnot added to the same
  bowRef group, so the existing bowRot/bowScale pose jiggle animates
  the whole bandana (tails dangle exactly like the bow did; no rig.ts
  change). Star shape helper removed.
- Before: R002 after-shots (baseline for this round).
- After: R003 after-shots (same viewports, same states).
- Visual inspection: NOT YET PERFORMED — to be filled after render.
- Code verification: NOT YET RUN.
- Open question: does the bandana carry the bow's mass so the cat no
  longer reads bald, and do the tails dangle readably at card-mark size?
- Visual inspection: performed — Chromium 1134 against a static
  production build; card-mark close-up, portrait close-up, menu rig
  close-up, mid-run rig. The band + knot + tails read as a side-tied
  bandana on the right ear on all three surfaces; the ear no longer
  reads bald; face, dress, whiskers, palette, composition untouched.
  Card-mark tails are thin (~3-4 units) — the dangle is subtle at mark
  size; flagged as the round's main tradeoff.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shell build PASS
  (18.6s). Same rendering route as R002 (scratch probe on built dist;
  kitty-run.shots.mjs dev-server flow still hangs on this machine).
- Open question: LIKED/REJECTED on the bandana; and should the card
  mark's tails get more dangle mass if the verdict is mixed?

## Feedback F005
- Round: R003 (verdict on the presented round)
- Verdict: REJECTED
- Scope: bandana geometry/coverage, all three surfaces
- Decision: the R003 bandana reads as a thin band/headband, not a
  bandana. Wanted: cloth covering roughly a quarter of the head, mass
  positioned toward one side (the knot side).
- User source: "I was aiming for the bandana to cover roughly a quarter
  of its head, positioned more toward one side. Right now it reads as a
  thin band/headband rather than a bandana."
- Artifact: R003 after-shots.
- Supersedes: none (coverage spec refines the F004 accessory directive).

## Round R004
- Goal: turn the thin band into a true kerchief — a cloth wedge that
  covers ~a quarter of the head, biased to the right side, knot at the
  head's right edge, tails still dangling from the knot on the bow's
  jiggle pose.
- Preserved preferences: F002 (keep the design, outfit-only), F003
  (direction liked), F004 (accessory must carry mass, not bald).
- Changes: rig — the thin band shape replaced by bandanaClothShape(): a
  kerchief wedge whose upper edge hugs the head's crown contour (inset
  ~0.025, so both ear tips keep poking out above it and the shared ink
  outline stays clean) and whose lower edge sags diagonally from a
  point on the crown left-of-centre down to the knot at the head's
  upper-right edge. Knot moved to (0.94, 0.18) on the head's edge;
  tails re-anchored under it (back tail longer onto the cheek, front
  tail shorter angled past the head's edge). Cloth/knot/tails stay in
  the bowRef group (jiggle unchanged). Portrait: thin band path replaced
  by the same kerchief wedge (crown-hugging upper edge, sagging diagonal
  lower edge, knot on the contour at the right, two tails). Card mark:
  same wedge in pink/deep.
- Before: R003 after-shots.
- After: R004 after-shots.
- Visual inspection: NOT YET PERFORMED.
- Code verification: NOT YET RUN.
- Open question: does the wedge read as a bandana covering ~quarter of
  the head (not a headband), with the ear tips still reading?
- Visual inspection: performed — Chromium 1134 against a static
  production build; card-mark close-up, portrait close-up, menu rig
  close-up, mid-run rig. The wedge reads as a tied kerchief covering
  roughly a quarter of the head, mass biased right; both ear tips poke
  above its crown-hugging edge; knot sits on the head's right edge with
  two tails (back onto the cheek, front past the edge). No headband
  read. Face, dress, whiskers, palette, composition untouched.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shell build PASS
  (19.1s). Same render route as R002/R003 (scratch probe on built dist).
- Open question: LIKED/REJECTED on the kerchief wedge; is the coverage
  and one-sided massing now right?

## Feedback F006
- Round: R004 (verdict on the presented round)
- Verdict: REJECTED
- Scope: kerchief wedge shape/coverage, all three surfaces
- Decision: (a) the wedge reads as emo bangs, not a bandana; (b) the top
  of the head is still visible where it should be covered; (c) wanted:
  more of the original bow's floating feel, and a cooler/more stylish
  bandana element.
- User source: "Right now it reads more like emo bangs than a bandana…
  The top of the character's head is also visible when [it should be
  covered]. I want more of an initial bow feel—like it's floating—and
  the bandana element should look cooler/more stylish."
- Artifact: R004 after-shots.
- Supersedes: none (coverage spec of F005 refined: cover the crown
  fully; add floating/stylish treatment).

## Round R005
- Goal: kerchief that fully covers the crown (its upper edge becomes the
  head's top silhouette, tenting slightly above the contour), reads as
  tied cloth (scalloped hem) rather than hair, with a floating stylish
  tie at the right edge (knot + curved fluttering tails).
- Preserved preferences: F002 (keep the design, outfit-only), F003
  (direction liked), F004 (accessory carries mass), F005 (quarter-head
  coverage, one-side bias — bias now lives in the deeper right drape,
  knot and tails).
- Changes: rig — bandanaClothShape redrawn as a crown-tenting cap: upper
  edge rides ~0.04-0.06 ABOVE the head contour over the whole crown (no
  white sliver; the cloth's ink merges with the head's outline), edge
  crosses both ears' base zones so the tips still poke above; hem is a
  three-scallop kerchief edge sagging deeper toward the right. Knot
  (r 0.10) sits on the head's upper-right edge. Tails redrawn as curved
  fluttering ribbons: back tail long onto the cheek, front tail flicked
  out past the head's edge. Portrait and card mark: same tenting cap
  with scalloped hem, knot on the contour, two tails. bowRef jiggle
  unchanged; no rig.ts/palette changes; souls branch untouched.
- Before: R004 after-shots.
- After: R005 after-shots.
- Visual inspection: NOT YET PERFORMED.
- Code verification: NOT YET RUN.
- Open question: does the tenting scalloped cap read as a stylish tied
  bandana (not bangs), with the crown fully covered and the floating
  feel present?

## Feedback F007
- Round: R005 (self-review before presenting; NOT a user verdict)
- Verdict: REJECTED (by agent inspection, superseded before user review)
- Scope: kerchief cap coverage span, all three surfaces
- Decision: the full-crown tent reads as a beanie/hat — a smooth dome —
  not a tied kerchief; the scallops do not read at any size. R005 is
  reworked in-place into R006 before presentation; no user verdict was
  recorded on R005.
- User source: none (agent's own round-quality gate; ledger records it
  to keep the round chain honest).
- Artifact: R005 after-shots (kept for history).
- Supersedes: none.

## Round R006
- Goal: kerchief read without the beanie read — cloth covers the
  crown's top-right quadrant only (from the crown's peak to the head's
  right edge), riding ON the contour (no white sliver anywhere along
  its span), with a rounded front fold (kills the bangs taper), two
  pronounced hem scallops, and a floating tie: knot half off the head's
  edge plus two curved tails (back onto the cheek, front flicked past
  the edge).
- Preserved preferences: F002/F003/F004/F005 (outfit-only; mass; ~
  quarter coverage; one-side bias; crown covered along the cloth's
  span; bow's floating energy; stylish).
- Changes: rig — bandanaClothShape redrawn: upper edge from the crown's
  peak arcing right along/above the contour, puffing over the right
  flank; hem = two scallops + rounded lobe back to the peak; group
  anchor moved to (0.45, 0.40). Knot/tails re-anchored (knot (0.96,
  0.16), back tail tip (0.74, -0.34), front tail tip (1.12, -0.06)).
  Portrait and card mark: same right-quadrant kerchief with rounded
  lobe, two hem scallops, floating knot + tails. Jiggle unchanged; no
  rig.ts/palette changes; souls branch untouched.
- Before: R004 after-shots (last presented round).
- After: R006 after-shots.
- Visual inspection: NOT YET PERFORMED.
- Code verification: NOT YET RUN.
- Open question: does the right-quadrant kerchief read as a stylish tied
  bandana (crown covered along its span, no beanie, no bangs, floating
  tie)?
- Visual inspection: performed — Chromium 1134 against a static
  production build; card-mark close-up, portrait close-up, menu rig
  close-up, mid-run rig. The kerchief covers the crown's top-right
  quadrant riding the contour (no white sliver along its span), rounded
  front fold at the crown, knot half off the head's right edge with two
  curved tails (back onto the cheek, front flicked past the edge); no
  beanie dome, no bangs taper. Face, dress, whiskers, palette,
  composition untouched; souls branch untouched.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shell build PASS
  (21.2s). Same render route (scratch probe on built dist).
- Open question: LIKED/REJECTED on the quadrant kerchief with the
  floating tie; residual "swoosh" flavour at portrait scale is the
  round's declared tradeoff.

## Feedback F008
- Round: R006 (verdict on the presented round)
- Verdict: REJECTED
- Scope: whole kerchief/bandana approach, all three surfaces
- Decision: the kerchief is rejected outright. New direction: a cap,
  in a senior-developer minimalist design language (few clean shapes,
  no frills — the repo's established minimalism bar).
- User source: "i don't like it. let's do cap. i want senior developer
  minimalist design" (2026-09-14).
- Artifact: R006 after-shots.
- Supersedes: the kerchief line of development (F005/F006 specs) — the
  accessory is now a cap.

## Round R007
- Goal: a minimal two-tone cap that reads instantly as a cap (not a
  beanie, not hair): a half-ellipse dome nestled between the ears
  (covering the crown's top), a thin darker brim floating past the
  head's right edge, and one button dot on the dome's peak. Senior-
  minimal: three shapes, flat fills, ink outlines, nothing else.
- Preserved preferences: F002 (keep the design, outfit-only), F003
  (direction liked), F004 (accessory carries mass — the dome covers the
  crown's top), F006 (no white sliver; floating feel lives in the
  brim's overhang), F008 (cap, senior-minimal).
- Changes: rig — bandana shapes/geometries replaced by capDomeShape()
  (half-ellipse dome, center (0, 0.72) head-local, rx 0.44, ry 0.30),
  capBrimShape() (curved band from the dome's right base to a tip at
  (1.06, 0.50) — ~0.26 past the head's edge), and a button dot (r
  0.055) on the dome's peak; group anchor (0.15, 0.82). useFrame damps
  the jiggle for the cap: bowRot × 0.45, bowScale → 1 + (scale−1) ×
  0.4 (a cap is stiffer than a bow). Portrait and card mark: same
  three-shape cap in each surface's accent (red/deep on the portrait,
  pink/deep on the card mark). No rig.ts/palette changes; souls branch
  untouched.
- Before: R006 after-shots.
- After: R007 after-shots.
- Visual inspection: NOT YET PERFORMED.
- Code verification: NOT YET RUN.
- Open question: does the minimal two-tone cap read as a cap (dome +
  brim + button) with the crown covered and both ear tips flanking it?
- Visual inspection: performed — Chromium 1134 against a static
  production build; card-mark close-up, portrait close-up, menu rig
  close-up, mid-run rig. The three-shape cap (dome + floating brim +
  button) reads as a cap on all three surfaces; the dome covers the
  crown's top between the ear tips; the brim overhangs the head's right
  edge; senior-minimal read (no frills). Face, dress, whiskers,
  palette, composition untouched; souls branch untouched; the damped
  jiggle keeps the cap stiffer than the bow was.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shell build PASS
  (31.6s). Same render route (scratch probe on built dist).
- Open question: LIKED/REJECTED on the minimal cap; brim length/tilt and
  dome size are the declared tuning knobs if the verdict is mixed.

## Feedback F009
- Round: R007 (verdict on the presented round)
- Verdict: REJECTED
- Scope: the cap, all three surfaces
- Decision: the cap reads as a mess. The accessory redesign starts
  anew in a new session.
- User source: "it looks like a mess. we will start in new session
  anew" (2026-09-14).
- Artifact: R007 after-shots.
- Supersedes: none (the cap was never liked; the bow's original state
  remains in git history as does every round).

## Session close (2026-09-14, second)
- Owner verdict: the cap rejected ("it looks like a mess"); the
  accessory redesign restarts in a new session. No revert requested
  this time — the shipped state keeps the cap (outfit-only, DMCA-
  distanced from the bow) live on the site; the original bow state and
  every intermediate round remain reachable in git history
  (6fa0736 star clip, 211c01b thin band, 0ce62cf wedge, 4b84558 kerchief
  quadrant, 79bad0f cap).
- Standing constraints for the next session: owner loves the current
  design (F002); changes are outfit/accessory-only; the accessory must
  carry mass (F004), cover the crown without white slivers (F006),
  keep the floating energy of the original bow (F006), and read
  senior-developer minimalist (F008). Rejected so far: star ear-clip
  (bald), thin band (headband), kerchief wedge (emo bangs), full-crown
  tent (beanie), quadrant kerchief (swoosh/bang residue), cap (mess).
- No pending handoffs; design-iteration owns the next round.

## Round R008
- Goal: replace the rejected cap with headphones (owner pick from a four-
  option menu: headphones / forehead goggles / beret / neck kerchief) —
  a minimal two-cup headset that reads instantly, carries mass, and
  distances the mark from the Sanrio trade dress.
- Preserved preferences: F002 (keep the design, outfit-only), F003
  (direction liked), F004 (accessory carries mass), F006 (crown covered
  along the accessory's span; floating energy — reinterpreted: the head
  band's arc peeks over the crown, ears draw over it), F008 (senior-
  developer minimalist).
- Changes: three surfaces get the same three-shape headset. (1) Two
  round cups clamped OVER the ear bases (ear tips still poke above-
  outboard of them), accent colour per surface (red #e94f64 rig/portrait,
  pink #ff8fbf card mark; deep variants #d13a50 / #a33a72 for the band).
  (2) A thin band arc rising just over the crown between the cups,
  underside tucked behind the head, painted BEHIND the ears so the ear
  tips draw over it (rig: static group z 0.08 head-local vs ear ink
  0.12; portrait/card: path painted before the ears+head). Rig: cap
  shapes replaced by headBandShape(pad) + headPhoneCup
  (ellipseShape(0.26, 0.27)) at the ear anchors (±0.58, 0.55); the
  band's ends dive into the cups' tops. Jiggle nearly damped (bowRot
  ×0.15, scale ×0.25 — a headset is rigid). No rig.ts/palette changes;
  souls helm branch untouched. In-round self-review gate (agent's own
  inspection, no user verdict): first pass had flank cups at (±0.87,
  0.44) — REJECTED: cups read as low pom-poms crowding the whiskers and
  the band's ends vanished behind the head before reaching the cups
  (kept as R008-portrait-interim-flank-cups.png); reworked in-place to
  the cups-on-ear-bases layout before presentation.
- Before: R007 after-shots (the cap).
- After: R008 after-shots (same viewports, same states).
- Visual inspection: performed — Chromium 1134 against a static
  production build; card-mark close-up, portrait close-up, menu rig
  close-up, mid-run head close-up + full frame. The headset reads as
  headphones on all three surfaces: cups clamp the ear bases, tips poke
  above, the band bridges the crown between them. Whiskers clear the
  cups on every surface; face, dress, palette, composition untouched;
  souls branch untouched.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shell build PASS
  (~25s). Same render route as previous rounds (scratch probe on built
  dist; kitty-run.shots.mjs dev-server flow still hangs on this machine).
- Open question: LIKED/REJECTED on the headphones; cup size and band
  height are the declared tuning knobs if the verdict is mixed.

## Session open (2026-09-14, third)
- Owner resumed the accessory redesign per F009's plan; asked what can
  replace the cap. Agent offered a four-option menu (headphones /
  forehead goggles / beret / neck kerchief); owner picked HEADPHONES —
  recorded here as the round's directive. Standing constraints from the
  previous session close remain active (F002/F003/F004/F006/F008).

## Feedback F010
- Round: R008 (verdict on the presented round)
- Verdict: REJECTED
- Scope: the headphones/headset read, all three surfaces
- Decision: the two-cups-over-the-ears headset does not read as a
  headset. The accessory redesign restarts in the next session.
- User source: "it doesnt look like headset. i will do that in next
  session" (2026-09-14).
- Artifact: R008 after-shots.
- Supersedes: none (the headphones were never liked; every state stays
  in git history).

## Session close (2026-09-14, third)
- Owner verdict: headphones rejected — they do not read as a headset;
  the work continues in the next session. No revert requested: the
  shipped state keeps the headphone accessory live on the site (outfit-
  only, DMCA-distanced from the bow); every earlier round stays
  reachable in git history (6fa0736 star clip, 211c01b thin band,
  0ce62cf wedge, 4b84558 kerchief quadrant, 79bad0f cap, a354dc2
  headphones).
- Agent note for the next session (not a user preference): the cups-on-
  ear-bases layout turned the cups into round earmuff/pom-pom blobs and
  left the band too shy to sell the headset; the next attempt should
  first settle WHAT silhouette reads "headset" at card-mark scale
  (possibly cups at the head's flanks with a clearly visible over-crown
  band, or a different accessory class entirely) before pixel tuning.
  (F008). Rejected so far: star ear-clip (bald), thin band (headband),
  kerchief wedge (emo bangs), full-crown tent (beanie), quadrant
  kerchief (swoosh), cap (mess), headphones (not a headset read).
- No pending handoffs; design-iteration owns the next round.

## Session open (2026-09-14, fourth)
- Owner resumed: "continue changing cat runner character. what can we
  replace the headset with? i want something bold and creative while
  keeping senior developer quality minimalism." Agent offered a four-
  option menu grounded in the failure history (gold ear hoop / streaming
  scarf / forehead goggles / mini backpack); owner picked FOREHEAD
  GOGGLES — recorded here as the round's directive. Standing constraints
  remain active (F002/F003/F004/F006/F008).

## Round R009
- Goal: replace the rejected headphones with forehead goggles (owner
  pick): two glass lenses pushed up on the forehead above the eyes, the
  strap running through their backs — a bold eyewear silhouette that
  avoids the failed cups-on-ear-bases layout entirely. Senior-minimal:
  per lens a glass disc under an ink-rimmed accent frame plus one white
  glint, one deep strap behind both lenses.
- Preserved preferences: F002 (keep the design, outfit-only), F003
  (direction liked), F004 (accessory carries mass — the lens pair +
  full-width strap carry comparable mass to the bow), F006 (floating
  energy — the bowRef jiggle stays, nearly damped for a rigid eyewear),
  F008 (senior-developer minimalist).
- Changes: three surfaces get the same goggles. Rig: headBandShape/
  headBandInk/headPhoneCup geometries and the static band group removed;
  goggleStrapShape() (band arcing over the brow, ends angling down to
  x ±0.84, stopping inside the head silhouette), annulusShape() helper,
  goggleGlass (r 0.185, palette.cloud), goggleInk (annulus 0.275/0.185),
  goggleFrame (annulus 0.24/0.185, palette.bowRed), goggleGlint
  (0.07 rect, palette.kittyWhite) added; lenses at (±0.40, 0.46)
  head-local in bowRef at group z 0.30 (clears eyes 0.27 / whiskers
  0.27); strap painted first (behind lenses), visible in the bridge
  gap and at the outer stubs. Jiggle unchanged (bowRot ×0.15, scale
  ×0.25). Portrait: band path + cup ellipses replaced by a strap path
  (deep #d13a50) + per lens ink ring r 9.4 (w 2.4) / glass r 8
  (#c4d9eb) / red frame r 8 (w 2.2, #e94f64) / white glint 2.6² at
  cx 38/62, cy 31. Card mark: band path + cups + single glint replaced
  by strap path (#a33a72) + per lens ink ring r 10 (w 2, #0b1317) /
  glass r 9 (#c4d9eb) / pink frame r 9 (w 2.4, #ff8fbf) / white glint
  2.6² at cx 120/152, cy 60.5. No rig.ts/palette changes; souls helm
  branch untouched (the removed static band was invisible behind the
  helm dome).
- Before: R008 after-shots (the headphones).
- After: R009-card-mark-after.png, R009-portrait-after.png,
  R009-menu-rig-after.png, R009-running-rig-after.png,
  R009-running-head-zoom.png, R009-running-head-zoom2.png.
- Visual inspection: performed — Chromium 1134 against a static
  production build; card-mark close-up, portrait close-up, menu rig
  full frame, mid-run full frame + two head crops (mid-jump and
  grounded). The goggles read as pushed-up aviator goggles on all
  three surfaces: glass + glints sell the lens material, the strap
  shows in the bridge gap and wraps toward the head edges, both ear
  tips poke above it, eyes/whiskers/cheeks untouched, no z-order or
  overflow artifacts observed. Face, dress, palette, composition
  unchanged; souls branch untouched.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shell build PASS
  (14.3s). Same render route as previous rounds (scratch probe on
  built dist).
- Open question: LIKED/REJECTED on the forehead goggles; lens size,
  lens height, and strap thickness are the declared tuning knobs if
  the verdict is mixed.

## Feedback F011
- Round: R009 (verdict on the presented round)
- Verdict: REJECTED
- Scope: the forehead goggles, all three surfaces
- Decision: the goggles' craft is acknowledged ("the implementation is
  good") but the accessory is rejected — the head reads too bold /
  missing something without the bow. NEW INSIGHT recorded: the bow's
  role is visual anchoring at the ear/upper-head zone; it softens the
  head's read. An accessory on the face plane (below the ear line)
  leaves that zone empty, so the whole design feels off regardless of
  the accessory's own quality. The bow remains the owner's benchmark;
  the next attempts must anchor mass at the bow's ground (the
  ear/upper-head zone).
- User source: "The implementation is good, but I don't like it. The
  bow is still the best option. It visually hooks to the bow, and the
  bow keeps the cat's head from looking too bold—without the bow, the
  head looks bold, which it shouldn't. Right now, it either feels like
  something is missing or looks visually awkward." (2026-09-14)
- Artifact: R009 after-shots.
- Supersedes: none (goggles never liked). Refines F004: mass must sit
  AT the bow's anchor zone (ear/upper head), not merely somewhere on
  the character.

## Session open (2026-09-14, fifth)
- Owner asked what else can be tried after F011. Agent reframed the
  search per F011's insight (anchor mass at the ear) and offered a
  four-option menu (asymmetric ribbon bow / paper rosette / feather
  plume / pinwheel); owner picked the ASYMMETRIC RIBBON BOW — the
  bow's anchor and energy kept, its geometry redrawn away from the
  symmetric Sanrio pair.

## Round R010
- Goal: keep the bow's anchor and mass but redraw its geometry so it
  no longer reads as the symmetric two-loop Sanrio trade dress: ONE
  big loop standing up-left from the knot + two pointed cloth tails
  (long streaming down-right hugging the head's edge, short flicking
  down-left) — a tied ribbon, asymmetric by construction.
- Preserved preferences: F002 (keep the design, outfit-only), F003
  (direction liked), F004 as refined by F011 (mass at the bow's
  anchor zone — the ribbon sits at the original anchor (0.52, 0.66)
  with comparable spread), F006 (the FULL jiggle restored — cloth
  energy), F008 (senior-minimal: four shapes), F011 (anchor at the
  ear/upper-head zone).
- Changes: all three surfaces first restored to the e21dc33 baseline
  (the owner-loved state) and then only the bow redrawn. Rig:
  goggle shapes/geometries removed; ribbonTailLong()/ribbonTailShort()
  pointed-taper shapes added; bowLoop resized to ellipseShape(0.37,
  0.26) at group (−0.24, 0.12) rotation −0.75 (standing up-left);
  knot kept ellipseShape(0.15, 0.15); paint order short tail (bowDeep,
  z 0.002) → long tail (bowRed, 0.006) → loop (bowRed, 0.01) → knot
  (bowDeep, 0.016), each ink-outlined as before; the full bowRot/
  bowScale jiggle restored in useFrame. Portrait: the two loop paths
  replaced by short tail (#d13a50) + long tail (#e94f64) + one loop
  ellipse (rx 13.9 ry 7.8, rotate −43°) + the original knot ellipse.
  Card mark: the two bow ellipses replaced by short tail (#a33a72) +
  long tail (#ff8fbf) + one loop ellipse (rx 9.5 ry 5.5, rotate
  −43°) + knot circle r 3.4; the original head glint restored at
  (122, 58). In-round self-review gate (agent's own inspection, no
  user verdict): first pass had a flat-leaning loop (−0.55) that read
  slightly beanie-ish across the crown and a hooked tail tip; reworked
  in-place to the steeper standing loop (−0.75) and pointed tails
  (no hook-back) before presentation; the card mark's first ribbon
  was half the original bow's mass and was enlarged to match.
- Before: R009 after-shots (the goggles); the mass baseline is the
  original card bow (e21dc33).
- After: R010-card-mark-after.png, R010-portrait-after.png,
  R010-menu-rig-after.png, R010-running-rig-after.png,
  R010-running-head-zoom.png, R010-running-head-zoom2.png.
- Visual inspection: performed — Chromium 1134 against a static
  production build; card-mark close-up, portrait close-up, menu rig
  full frame, two mid-run head crops (grounded + mid-jump). The
  ribbon reads as a bow tied at the right ear on all three surfaces:
  the loop stands up-left with the original's mass, the knot sits at
  its base, both tails flick clear of the face, both ear tips read,
  eyes/whiskers/cheeks untouched; the asymmetry (one loop + two
  tails vs the symmetric pair) is clearly distinct from the Sanrio
  trade dress. The jiggle animates the ribbon in both crops.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shell build PASS
  (24.0s). Same render route as previous rounds (scratch probe on
  built dist).
- Open question: LIKED/REJECTED on the asymmetric ribbon; loop size,
  lean, and tail length are the declared tuning knobs if the verdict
  is mixed.

## Feedback F012
- Round: R010 (verdict on the presented round)
- Verdict: REJECTED
- Scope: the asymmetric ribbon bow, all three surfaces
- Decision: the ribbon "doesn't look like anything" — it fails the
  read entirely (the weakest verdict of the series). The owner ends
  the accessory work for now and will resume it later.
- User source: "this doesnt look like anything.. let's finish. i will
  do that later" (2026-09-14).
- Artifact: R010 after-shots.
- Supersedes: none (the ribbon was never liked).

## Session close (2026-09-14, fourth)
- Owner verdict: the asymmetric ribbon rejected ("this doesnt look
  like anything") — the accessory redesign is PAUSED by the owner
  ("let's finish. i will do that later"), to resume in a later
  session. No revert requested: the shipped state keeps the ribbon
  live on the site (outfit-only, DMCA-distanced from the bow); the
  original bow state and every round stay reachable in git history
  (6fa0736 star clip, 211c01b thin band, 0ce62cf wedge, 4b84558
  kerchief quadrant, 79bad0f cap, a354dc2 headphones, 04fe36d
  goggles, 7e913e1 ribbon).
- Standing constraints for the resume: owner loves the design (F002);
  changes are outfit/accessory-only; the accessory must anchor mass
  at the bow's ground — the ear/upper-head zone (F004 as refined by
  F011); keep the bow's floating energy (F006); read senior-developer
  minimalist (F008). The bow remains the owner's benchmark: an
  evolution OF the bow (same anchor, same softness) is the proven
  direction; every departure from the bow's silhouette has failed the
  read so far. Rejected so far: star ear-clip (bald), thin band
  (headband), kerchief wedge (emo bangs), full-crown tent (beanie),
  quadrant kerchief (swoosh), cap (mess), headphones (not a headset
  read), goggles (bold head), asymmetric ribbon (looks like nothing).
- No pending handoffs; design-iteration owns the next round when the
  owner resumes.
