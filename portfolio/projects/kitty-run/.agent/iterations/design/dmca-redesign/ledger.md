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

## Session open (2026-09-14, sixth)
- Owner resumed with a new approach: instead of one focused round, render a
  menu of 10 customization variants for the character — each distinct enough
  to avoid DMCA/IP concerns while staying consistent with the core design —
  and choose one. Standing constraints from the previous closes remain
  active (F002 outfit-only; F004 as refined by F011 — mass at the ear/
  upper-head anchor; F006 floating energy; F008 senior-minimal). The bow
  remains the benchmark; the menu honours the failure history (no star
  ear-clip repeat, no bandana/kerchief family, no cap, no headphones, no
  goggles, no more freeform ribbon geometry).

## Round R011
- Goal: give the owner a visual menu of 10 DMCA-distinct accessory
  candidates (owner request: "give me 10 customization variants... I'll
  choose one"), all anchored at the bow's ground (the right-ear zone),
  so the pick is made on rendered evidence rather than names.
- Preserved preferences: F002 (keep the design, outfit-only), F003
  (direction liked), F004 as refined by F011 (mass at the ear/upper-head
  anchor), F006 (floating energy), F008 (senior-minimal).
- Changes: NO app code changed — menu round. A scratch sheet renders the
  shipped KittyCenterMark SVG ten times (head/ears/whiskers/speed dashes/
  ground byte-identical to the live card), replacing only the ribbon
  block with one candidate accessory per variant, in the card surface's
  pink/deep accents. Candidates: 01 pennant flag on a mast · 02 balloon
  on a string · 03 five-petal flower · 04 four-point sparkle star (the
  game's pickup language, enlarged) · 05 clover sprig · 06 heart clip ·
  07 pinwheel · 08 feather plume (two quills) · 09 paper plane with a
  dotted trail · 10 crescent-moon pin with a sparkle. In-round self-review
  gates (agent inspection, no user verdicts): first pass reworked the
  too-small flag (enlarged + two-tone), an ambiguous cloth tuft (replaced
  by the balloon), a face-dangling tag charm (replaced by the pinwheel —
  F011: mass must stay out of the face plane), an abstract origami crane
  (replaced by the paper plane), and a heart that floated above the
  crown (re-seated with its tip on the ear base like the bow's knot).
- Before: R010 after-shots (the live ribbon).
- After: R011/sheet.png (10-variant grid) + R011/close-01..10.png
  (per-variant crops at dsf 2).
- Visual inspection: performed — full grid plus per-variant crops; all
  ten read as their intended object at card-mark scale; the four weak
  first-pass reads were caught and reworked in-place before this record.
- Code verification: NOT RUN (no app code touched; menu round).
- Open question: which variant does the owner pick? The pick is
  implemented across all three surfaces (card mark, portrait, in-game
  rig) as R012; per-surface accent colours follow each surface's
  convention (pink/deep card mark, red/deep portrait and rig).

## Feedback F013
- Round: R011 (verdict on the presented menu)
- Verdict: LIKED
- Scope: V5 clover sprig, all three surfaces (to be implemented)
- Decision: the owner picked V5 (clover sprig) from the ten-variant menu
  for full implementation as the character's accessory.
- User source: "i choose v5." (2026-09-14)
- Artifact: R011/sheet.png (V5 cell) + R011/close-05.png.
- Supersedes: none (the ribbon R010 was never liked; V5 replaces it).

## Feedback F014
- Round: R011 (issue seen on the presented sheet, independent of the pick)
- Verdict: REJECTED
- Scope: the card mark's two-tone head shading (paper head + darker
  clipped jaw ellipse), card-mark surface
- Decision: the head reads as a doubled face — a white skull sitting on
  a tan chin/muzzle. The jaw shading must go so the head reads as one
  face. Explicit user feedback; supersedes the outfit-only scope for
  this one shading element.
- User source: "currently their faces look doubled. like with a chin.
  you should fix that" (2026-09-14)
- Artifact: R011 close-ups (the two-tone head visible in every crop).
- Supersedes: none (new element scope; F002's outfit-only rule narrows
  to everything except this shading fix).

## Feedback F015
- Round: R012 (aborted mid-implementation, before presentation)
- Verdict: REJECTED
- Scope: the in-session V5 implementation course itself
- Decision: stop the in-session work — V5 is "good but not good enough".
  New directive: delegate the outfit design to a stronger model via the
  minimize-iteration chat flow, then create the result on all three
  surfaces (main menu card mark, character selection portrait, in-game
  rig). The working-tree card-mark edits (clover + jaw-ellipse removal)
  were reverted; the live state stays the R010 ribbon. The V5 pick
  (F013) is downgraded to "benchmark to beat", not adopted as-is.
- User source: "stop. lets not do that. it is good but not good enough"
  + "lets do this - /minimize-iteration. delegate to a smartest model to
  come with an outfit and create for main menu, character selection and
  in-game" (2026-09-14)
- Artifact: none (no render presented).
- Supersedes: F013's implement-V5 decision (the pick remains the quality
  benchmark; F014's chin observation stays recorded, unresolved).

## Session note (2026-09-14, seventh)
- The minimized prompt (−30% tier, per the owner's chosen compression)
  went to the randomized-routing chat model; the reply came back as a
  ten-piece outfit menu (toggle collar, bib, button, beanie, cowl ring,
  suspenders, pocket, bucket hat, earmuff band, lone mitten) — flat SVG
  snippets, no bow, each with a one-line IP rationale. Recorded here as
  the round's input.

## Round R012
- Goal: show the owner rendered screenshots of the delegated model's
  ten outfit pieces BEFORE any implementation (owner directive), raw
  and composited on the real character.
- Preserved preferences: F002 (keep the design, outfit-only), F008
  (senior-minimal), F015 (delegate, then create on all three surfaces).
- Changes: NO app code changed — preview round. A scratch sheet renders
  each piece twice: the model's SVG verbatim on a dark tile, and the
  same paths composited onto the real KittyPortrait (ribbon stripped —
  the outfit replaces the accessory; pieces keep the model's hexes;
  per-piece translate/scale places them on the portrait's anatomy:
  head y18-68, ears y11-35, body y64-100). Placement fixes during
  in-round self-review (agent inspection, no user verdicts): toggle
  band off the chin, button and pocket down onto the chest, cowl ring
  rescaled twice (final: cat-in-a-donut scale, the model's "head pops
  out" composition fights our all-head anatomy — flagged), mitten cord
  re-anchored at the right ear (preview-only alignment, the snippet's
  cord starts off-canvas).
- Before: R011 close-ups (ribbon menu state).
- After: R012/sheet.png (10×2 grid: raw + on-the-cat) plus
  R012/fix-05-cowl.png and R012/fix-07-pocket.png detail crops.
- Visual inspection: performed — full grid twice plus dsf-3 crops of
  the two reworked pieces; nine of ten read cleanly; the cowl ring's
  composition is the declared weak one on our anatomy.
- Code verification: NOT RUN (no app code touched).
- Open question: which piece does the owner pick for the full
  three-surface implementation (R013)? Two integration facts to weigh:
  (a) pieces are flat fills — implementation adds ink outlines per
  character law; (b) body pieces (collar/bib/button/suspenders/pocket/
  mitten/cowl) barely exist on the head-only card mark, while head-wear
  (beanie, bucket hat, earmuffs) carries all three surfaces. The
  earmuff band is also the closest to the rejected R008 headphones.

## Session note (2026-09-14, eighth)
- The three-surface spec prompt (S1 card mark / S2 portrait / S3 rig
  convention with ink copies) went to the routing chat model; the reply
  came back as 10 outfit designs, each with three surface-ready
  renderings (S1 complete card SVG with the model's own cat, S2
  full-body portrait SVG, S3 head-local d-string paths + the ink-copy
  convention). Designs: 1 crescent capelet, 2 berry beret pinafore,
  3 cloud cowl, 4 star tabard, 5 heart-pocket smock, 6 tulip raincoat,
  7 sun cape, 8 acorn beanie pullover, 9 shell collar vest, 10 comet
  scarf tunic. Owner directive: render screenshots first, choose or
  approve, NO polish — salvage after the choice.

## Round R013
- Goal: show the owner the delegated model's 10 three-surface outfit
  designs rendered verbatim, for a choose-or-approve verdict before any
  salvage implementation.
- Preserved preferences: F002 (keep the design, outfit-only), F008
  (senior-minimal), F015 (delegate → create on three surfaces).
- Changes: NO app code changed — preview round. A scratch sheet renders
  each design three-up: the model's S1 SVG verbatim, its S2 SVG
  verbatim, and its S3 paths built per the model's own convention
  (head rx1 ry0.84 + ear triangles, piece parented at (0.52,0.66),
  ink copy fill+stroke #4a2d3b w0.055 first, listed fill second, y
  flipped for SVG).
- Before: R012 sheet (first outfit menu, single-surface preview).
- After: R013/sheet.png (10×3 grid).
- Visual inspection: performed, NO POLISHING per owner directive. Facts
  flagged for the choice: the S1/S2 tiles draw the model's own cat
  (rounder proportions, mouths, curled tail) — at implementation the
  outfit lands on OUR artwork, not this cat; S3 pieces are all small
  (~0.4 unit spread vs the bow's ~0.74) — mass will likely need
  enlarging during salvage (F004); 2/8 hats and 3/6 cowls overlap the
  ears; every S3 piece hangs at the ear anchor with the jiggle.
- Code verification: NOT RUN (no app code touched).
- Open question: choose or approve one design (1-10) — or reject all;
  the pick is then salvaged onto the three real surfaces (R014).

## Session note (2026-09-14, ninth)
- Owner supplied a corrected second batch from the routing model: 10
  outfit designs with shared build notes (single head block, one accent
  pair per surface, dark-accent nose, no whiskers/mouth/bow), explicit
  S3 mapping (head-local -> S1 x=136+40X y=76+35.71Y, -> S2
  x=50+27X y=43+29.76Y, pivot (0.52,0.66)), and rig defaults (spring
  jiggle +-14 deg, stiffness 0.22, damping 0.30, clamp +-0.06). Designs:
  1 knit muffler, 2 chullo beanie, 3 bandana neckerchief, 4 hoodie,
  5 headphones, 6 snapback cap, 7 sailor collar, 8 bell collar, 9 beret,
  10 cape. Owner directive stands: screenshots first, choose or approve,
  no polish — salvage after the choice. R013's batch is superseded by
  this one (the owner re-rolled rather than picked).

## Round R014
- Goal: show the owner the corrected 10-design batch rendered verbatim
  on all three surfaces, for a choose-or-approve verdict before salvage.
- Preserved preferences: F002 (keep the design, outfit-only), F008
  (senior-minimal), F015 (delegate -> create on three surfaces).
- Changes: NO app code changed — preview round. A scratch sheet renders
  each design three-up: S1 SVG verbatim, S2 SVG verbatim, and S3 built
  per the model's contract (static head-local parts -> ears -> head ->
  pivot@(0.52,0.66) dangle, ink copies w0.06 #2a2230 behind every fill,
  scale 34px/unit, y-down per their mapping).
- Before: R013 sheet (first three-surface batch).
- After: R014/sheet.png (10x3 grid).
- Visual inspection: performed, NO POLISHING. Facts flagged for the
  choice: batch is far more coherent than R013 (identical head block,
  no mouths, dark-accent nose, no whiskers — trade-dress items from
  round 1 removed); S3 dangles all hang from the ear pivot with the
  jiggle; 2/9 hats and 3/4/6 hoods cover the ears; 5 headphones is the
  R008-rejected family again (band + cups now clearly read though);
  S3 preview tiles show the outfit on the model's neutral head — at
  salvage the piece ports onto our artwork with our palette/ink rules.
- Code verification: NOT RUN (no app code touched).
- Open question: choose or approve one design (1-10) — or reject all;
  the pick is then salvaged onto the three real surfaces (R015) using
  the model's rig defaults as the starting jiggle.

## Session note (2026-09-14, tenth)
- Owner supplied batch 3 from the routing model: 10 persona outfits
  (chef, astronaut, scuba, wizard, ninja, racer, pirate, medic,
  gardener, winter) with a shared unit-space HEAD_D (ears included),
  ink #43222f, and a deliberate anti-trade-dress move: mouths PRESENT
  everywhere ("bow + mouthless white cat = Sanrio zone"). S3 blocks are
  HEAD_D + one outfit path each (much bigger mass than batch 2's
  dangles). Owner directives: render these, DON'T remove the previous
  batch (R014 — owner is leaning 05 headset), screenshots first,
  choose/approve, no polish.

## Round R015
- Goal: show batch 3 rendered verbatim on all three surfaces next to
  the still-standing batch 2 (R014), for a choose-or-approve verdict.
- Preserved preferences: F002 (keep the design, outfit-only), F008
  (senior-minimal), F015 (delegate -> create on three surfaces).
- Changes: NO app code changed — preview round. Scratch sheet renders
  each persona three-up: S1 verbatim, S2 verbatim, S3 = HEAD_D (ink
  behind w0.16 #43222f + white fill, ears included) + the outfit path
  inked + filled from the S2 palette, head centre (50,60) scale 24.
- Before: R014 sheet (batch 2, kept live per owner).
- After: R015/sheet.png (10x3 grid).
- Visual inspection: performed, NO POLISHING. Facts flagged: batch 3
  is persona-themed (occupation costume), a bigger move than single
  accessories; S3-02 astronaut bubble fills opaque and hides the face
  (S1/S2 use a translucent glass — at salvage the bubble needs opacity,
  not a fill); mouths present in the model's art — ours stays mouthless
  (baseline face untouched; only the outfit ports); 05 racer/06 pirate
  helmets cover the ears entirely; R014-05 headset stays in play per
  the owner's lean.
- Code verification: NOT RUN (no app code touched).
- Open question: choose or approve a design from EITHER batch (R014
  1-10 or R015 1-10, incl. R014-05 headset), or reject all; the pick
  is salvaged onto the three real surfaces (R016).

## Session note (2026-09-14, eleventh)
- Owner supplied batch 4 from the routing model: 10 designs (berry
  beret, sailor ribbon, rain hood, star witch, blossom crown, pastry
  chef, space cadet, winged garden smock, winter earmuffs, pocket
  royal) — S1/S2 complete SVGs (single white/pink family, mouths
  present) + S3 pivot d-string PAIRS (piece + detail) per the stated
  convention (ink #3c2834, w0.035 local units, round joins). Standing
  directives: render first, choose/approve, no polish; earlier batches
  stay live.

## Round R016
- Goal: show batch 4 rendered verbatim on all three surfaces beside the
  still-standing batches 2-3 (R014/R015), for a choose-or-approve
  verdict.
- Preserved preferences: F002 (keep the design, outfit-only), F008
  (senior-minimal), F015 (delegate -> create on three surfaces).
- Changes: NO app code changed — preview round. Scratch sheet renders
  each design three-up: S1 verbatim, S2 verbatim, S3 = head ellipse
  (rx1 ry0.84) + ears + pivot@(0.52,0.66) pair, ink copies #3c2834
  w0.035 local units behind fills, scale 34px/unit (piece #e94f64,
  detail #d13a50 per their S2 accents).
- Before: R015 sheet (batch 3, kept live).
- After: R016/sheet.png (10x3 grid).
- Visual inspection: performed, NO POLISHING. Facts flagged: 02 sailor
  ribbon's S3 piece is literally a BOW at the pivot — the exact Sanrio
  trade-dress silhouette this whole course exists to leave; 06 pastry
  chef's kerchief knot also reads bow-adjacent; every S3 piece is
  small (~0.3-0.6 unit vs the bow's ~0.74 spread — F004 mass will need
  enlarging at salvage); mouths present in the model's art, ours stays
  mouthless; 07 space cadet and 09 winter earmuffs are the R008-
  rejected headphone family again (though batch 4's renditions read
  clearly as cans).
- Code verification: NOT RUN (no app code touched).
- Open question: choose or approve a design from ANY batch (R014-05
  headset still on the table, R015 personas, R016 1-10), or reject
  all; the pick is salvaged onto the three real surfaces (R017).

## Session note (2026-09-14, twelfth)
- Owner: "rain hood looks interesting, maybe i will choose it" (R016-03
  is now the leading candidate) — and supplied batch 5 from the routing
  model: shared BASE1/BASE2 declared once + 10 tiny outfit shape lists
  (beanie, crown, scarf, round glasses, hoodie, sailor collar, flower
  crown, headphones, rain hat, overalls + star pin). Rect whiskers +
  yellow oval nose + pointed ears as their trade-dress dodge; palettes
  are ours. Standing directives: render, don't remove previous batches,
  no polish.

## Round R017
- Goal: show batch 5 rendered verbatim on all three surfaces beside the
  still-standing batches 2-4, for a choose-or-approve verdict.
- Preserved preferences: F002 (keep the design, outfit-only), F008
  (senior-minimal), F015 (delegate -> create on three surfaces).
- Changes: NO app code changed — preview round. Scratch sheet renders
  each outfit three-up: S1 = BASE1 + shapes, S2 = BASE2 + shapes (both
  verbatim per the shared bases), S3 = head+ears + pivot@(0.52,0.66)
  pieces with ink copies (w0.08 local units, #222) behind fills, scale
  30px/unit (evenodd respected for the hoodie ring).
- Before: R016 sheet (batch 4, kept live; rain hood = owner's lean).
- After: R017/sheet.png (10x3 grid).
- Visual inspection: performed, NO POLISHING. Facts flagged: batch 5's
  S1/S2 renderings are the cleanest so far (shared bases, rect
  whiskers, yellow nose kept — deliberately off-Sanrio); BUT batch 5's
  S3 layer parented ALL head-wear at the ear pivot, so the beanie,
  hoodie ring, flower crown, rain hat and star pin render as small
  hooks/blobs at the ear instead of on the head — at salvage the
  mapping must split (head-wear -> head-local, body-wear -> body,
  only true dangles at the pivot); 05 hoodie ring reads as a thick
  donut around the head even in S1; 04 glasses need the fill-opacity
  trick (used here) or they hide the eyes.
- Code verification: NOT RUN (no app code touched).
- Open question: choose or approve a design from ANY batch (R016-03
  rain hood is the owner's stated lean; R017-09 rain hat is its
  sibling), or reject all; the pick is salvaged onto the three real
  surfaces (R018).

## Feedback F017
- Round: R017 (verdict across the preview series)
- Verdict: LIKED
- Scope: the hoodie design (batch 5 #05), all three surfaces
- Decision: the owner picked the hoodie for salvage implementation. The
  pick resolves to the batch-5 hoodie (the most recently presented one:
  hood ring + chest pull toggle), not batch 3's arch variant.
- User source: "let's do hoodie. salvage pleaase" (2026-09-14)
- Artifact: R017/sheet.png (05 cell) + R016 sheet (owner's earlier rain
  hood lean was set aside for the hoodie).
- Supersedes: none (the rain hood lean was never a formal pick).

## Round R018
- Goal: salvage the owner-picked hoodie (F017, batch-5 #05) onto the
  three real surfaces: card mark, character-select portrait, in-game
  rig — hood ring around the head + pull toggle, per-surface palette.
- Preserved preferences: F002 (keep the design, outfit-only — the
  hoodie replaces ONLY the ribbon; face/dress/palette keys untouched),
  F004 (mass — the ring wraps the whole head), F006 (floating energy —
  the toggle keeps a damped cloth jiggle), F008 (senior-minimal: ring +
  toggle, two shapes), F011 (mass at the head zone — the ring IS the
  head zone).
- Changes: card mark — the ribbon block replaced by the batch-5 S1
  geometry verbatim (head dims match ours exactly): evenodd hood ring
  (#ff8fbf, outer 88..184/22..104, inner 96..176/36..98) + pull toggle
  circle (136,102 r4 #a33a72); ears tuck under the ring's flanks. 
  Portrait — hood ring (evenodd, #e94f64, outer 4..96/2..74, inner
  14..86/12..66 scaled up to our bigger head) + hoodie body
  (rect 22..78/64..104 r10) + toggle pocket (#d13a50), all drawn LAST
  (after whiskers); a first pass drew the hoodie at the ribbon's old
  slot (before the face) and the whiskers rendered OVER the hood —
  caught in-round, re-ordered, re-rendered. Rig — ribbonTailLong/
  Short/bowLoop/bowKnot geometries removed; hoodOuterShape() +
  hoodInnerShape() (hole) build the ring around the head (head-local:
  outer x +-1.16, crown 1.22, chin -0.84; inner x +-0.95, crown 1.02,
  chin -0.67 — band ~0.2, hole clears the eye line), painted z 0.30
  ink / 0.33 fill above the face; the pull toggle
  (roundedRect 0.18x0.13) hangs on bowRef re-anchored from the ear
  (0.52,0.66) to the chest (0,-0.55), jiggle damped (bowRot x0.45,
  scale x0.4 — cloth toggle, not ribbon loops). Souls helm branch
  untouched; palette keys unchanged (bowRed hood, bowDeep toggle).
- Before: R010/R011-era ribbon state (card-mark.png from the R018
  pre-pass shows the ribbon baseline; git history holds every state).
- After: R018/card-mark.png, R018/portrait.png, R018/menu.png,
  R018/running.png, R018/running-head.png (static build, chromium 1134,
  dsf 2-3; same scratch-probe route as every round).
- Visual inspection: performed — card mark close-up (ring + ear tips
  poking through the crown band, toggle at the chin), portrait
  close-up pre- and post-z-order-fix (post: hood wraps over the face
  edges, whiskers tuck under the band, ears' base halves visible
  through the opening — declared tradeoff), menu rig + mid-run frame
  (hood reads as a wrapped ring, ear tips poke at the crown, toggle
  visible at the chin, no z-order or overflow artifacts).
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shell build PASS
  (23.2s).
- Open question: LIKED/REJECTED on the salvaged hoodie; the declared
  tuning knobs are the ring's band thickness, the toggle size and the
  portrait's visible ear-base read.

## Session note (2026-09-14, thirteenth)
- Owner verdict on R018: "this looks nothing like my intention" — the
  face-wrapping hood ring read as a helmet on our head-dominant
  anatomy. Agent diagnosed the preview-scale trap (the pick was made on
  a 190px tile of the model's own cat) and offered three paths: (A)
  hoodie with the hood DOWN (head untouched, outfit on the body,
  collar behind the neck, ears showing), (B) the never-tried original
  bow + tails (minimal distance from the loved benchmark), (C) pause.
- Owner direction: A — "let's do hoodie with ears showing" — delegated
  to the normal chat model (deepening tier: autonomy on design/code
  choices, deeper reasoning before output). R018's face-ring state
  stays live until the next round lands.

## Feedback F018
- Round: R019 (brief stage, pre-render)
- Verdict: REJECTED (refinement of the direction, not of the hood-up idea)
- Scope: the hoodie's hood placement
- Decision: the owner's actual intent is the hood worn ON the head
  (up), but WITHOUT blocking the ears and the whiskers — R018's ring
  failed because it wrapped the whole face (down to the chin) and
  buried the ears, not because the hood was up. The hood-down
  "collar behind the neck" plan (previous brief) is superseded: the
  design is a crown dome with pass-through notches for the ears and a
  lower edge that stays clear of the eye line and the whiskers.
- User source: "i want hoodie to be worn on head but without it
  blocking years and cat's whiskers" (2026-09-14)
- Artifact: R018 renders.
- Supersedes: the hood-down clause of the previous session note (the
  delegation + autonomy + depth directives stay in force).

## Round R019
- Goal: re-salvage the hoodie per F018 — hood worn ON the head as a
  crown dome (no face wrap), the animated ear tips poking through edge
  dips, eye line + whiskers fully clear; three real surfaces.
- Preserved preferences: F002 (outfit-only, face untouched — NO mouth),
  F004 (mass at the upper-head zone — the dome IS the crown), F006
  (floating energy — toggle keeps the damped cloth jiggle), F008
  (senior-minimal: dome + lining + toggle, three flat shapes), F017
  (owner picked the hoodie), F018 (hood ON head, ears + whiskers clear).
- Changes: card mark — the R018 face ring replaced by a hood dome path
  M100 60 Q93 56 94 50 Q112 38 136 39 Q160 38 178 50 Q179 56 172 60
  Q136 68 100 60 Z (#ff8fbf) + lining sliver M100 60 Q136 68 172 60
  Q136 72.5 100 60 Z (#a33a72) + two toggles (102,63)/(170,63) at the
  dome hem; ear tip polygons RE-LAID to poke above the dome dips
  ("98,47 94,38 105,44" + mirror); glint moved (122,58) -> (128,47)
  onto the dome. Portrait — hoodie group drawn LAST (over whiskers):
  dome + lining mirroring the card's dome, body hoodie + kangaroo
  pocket + toggle rect 47.4,70 (below the head, chest zone); ear tips
  re-drawn (w3) over the dome so they poke through. Rig — R018's
  hoodOuter/hoodInner ring geometries replaced by hoodDomeShape
  (head-local: peak 1.20, edge dips 0.78 at x +-0.60 so the animated
  ear tips poke through, sides end (+-0.92, 0.32) above the eye line)
  + hoodLiningShape sliver; bodyHoodieShape + hoodPocketShape
  (body-local) added after the dress behind the arms (ink 0.125 /
  fill 0.14, pocket 0.165 — under the arm ink 0.13 / fill 0.16);
  souls knight branch untouched. In-round fix: the pull toggle was
  salvaged at head-local (0,-0.55) which lands on the CHIN and read
  as a mouth dot (F002 hazard) — moved to the body frame
  (0, 0.45, 0.175), between the chin ink (~0.62) and the pocket top
  (0.3), fill 0.175 over the pocket 0.165. Model's static S3 ear
  re-lay skipped (misaligned with the animated ears); toggle body
  frame used (the earlier "would hide under head fill" worry was
  wrong — the head's ink bottom at body ~0.62 never reaches y 0.45).
- Before: R018 renders (face ring / helmet read).
- After: R019/card-mark.png, R019/portrait.png, R019/menu.png,
  R019/running.png, R019/running-head.png (static build, chromium
  1134, same scratch-probe route as every round).
- Visual inspection: performed — card-mark close-up and portrait
  close-up (dome with ear tips poking through, whiskers clear, toggle
  present) were already inspected in the salvage pass; menu rig +
  two mid-run frames inspected after the chin-toggle fix: face clean
  (eyes + nose + whiskers, no chin dot), toggle reads on the red
  chest strip between chin and pocket, ear tips visible at the dome's
  top corners, lining sliver along the hem, no z-order artifacts.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shell build PASS
  (~33s).
- Open question: LIKED/REJECTED on the crown dome; declared tuning
  knobs: dip width (~0.4 per ear), dome peak height, toggle size,
  portrait ear-base read.

## Feedback F019
- Round: R020 (brief stage, pre-render)
- Verdict: REJECTED (the R019 crown-dome hoodie, all three surfaces)
- Scope: the pastel cat's hoodie, in-game rig + character-select card +
  main-menu backdrop
- Decision: three-part verdict on R019: (1) in-game the hood dome reads
  as a CROWN and the red body garment makes the cat look like a priest
  in a red robe — overall low effort; (2) on the select card the hood
  reads as a HAT and the garment blocks the head/chin — it must
  clearly read as a hoodie, not a garment; (3) the main-menu backdrop
  cat does not need the hoodie at all. The owner lifts F018's hood-up
  constraint: "no strict rules or requirements" — the brief grants the
  model autonomy over design and code choices and asks for deeper,
  more thorough reasoning before output; the quality bar is the Ashen
  knight (layered, considered — never low-effort). Screenshots drive
  the evaluation; deliver whatever is most visually appealing.
- User source: "In-game: the hoodie's shape makes it look like a
  crown... looks like a priest in a red garment... low effort. /
  Character selection menu: the hoodie looks like a hat, and the
  garment blocks the head/chin. It should clearly read as a hoodie.
  / Main menu: the character doesn't need to have a hoodie here. /
  no strict rules... reference the Ashen character" (2026-09-15)
- Artifact: R019 renders.
- Supersedes: F018 (the hood-must-be-worn-up constraint only; the
  ears-and-whiskers-clear and no-face-change intents stay in force).

## Round R020
- Goal: answer F019 on all three surfaces — the hoodie must READ as a
  hoodie (never a hat/crown/robe), the garment must never block the
  head/chin, the main-menu backdrop shows the bare cat; quality bar the
  Ashen knight. Direction: hood DOWN (F018's hood-up constraint
  superseded by the owner's "no strict rules").
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass
  at the upper zone — the roll IS the crown zone, but as cloth at the
  NECK, not on the crown), F006 (floating energy — the cords keep the
  damped cloth jiggle), F008 (senior-minimal flat fills), F017 (owner
  picked the hoodie), F018 (ears + whiskers stay clear — now honored
  by a bare head), F019 (this round's mandate).
- Changes: rig — the R019 crown dome + lining deleted; head group now
  bare (isSouls ? helm : null). New hood-down kit: hoodBackShape +
  hoodFrontShape (two uneven cloth rolls bunched behind the neck, body
  frame, z 0.16/0.20 ink / 0.18/0.22 fill — under the head's ink 0.19,
  so the head occludes the middle and the lobes peek beside the cheeks
  and under the chin) + 3 ribbon crease strokes (z 0.24, ink — placed
  outside the head's silhouette so they never touch the face) +
  chestPocketShape (kangaroo pocket, bowDeep, ink 0.16/fill 0.18) +
  2 angled pocket-slot strokes (0.20) + hemBandShape (bowDeep band
  along the flat hem, ink 0.16/fill 0.18 at y 0.125) + collarLining
  (suitPink sliver along the front roll's top edge, 0.25) + draw cords
  (kittyWhite ribbonShape fills with explicit widened ink copies,
  cordL/RInk; group anchors at (+-0.12, 0.52, z 0.24)) + suitDeep
  aglets. All pieces live in ONE outfitRef group gated in useFrame:
  visible = world.status !== "ready" (bare cat on the ready/menu
  backdrop — the whole React tree renders once; visibility writes are
  the only per-frame mechanism). Sleeves INSIDE the arm pivots
  (sleeveL/RRef, own visibility gates): bowRed ellipse (0.175 ink /
  0.195 fill) + bowDeep cuff band (0.215) inside the sleeve's bottom
  edge, white paw tips peek below. The old bowRef/hoodTab toggle
  machinery deleted; the cords inherit its damped pose.bowRot jiggle,
  phase-split (+-0.06) so they never move as one. Echo retint: all new
  pieces are palette-keyed — FADED.kitty needed zero additions.
  Card portrait (KittyPortrait) redrawn to the same anatomy: arms ->
  sleeves+cuffs, torso hoodie with the neckline scoop bottoming at
  y ~74 (chin at 68 stays clear), hood rolls + front collar + lining
  behind the head, pocket + slots + hem band + cords + aglets, head
  drawn LAST so the garment never blocks the head/chin. The old
  pinafore/shirt overlay dropped (fully covered by the hoodie).
- Before: R019 renders (crown dome / hat read / garment over the chin).
- After: R020/running.png, R020/menu.png, R020/running-close.png,
  R020/running-close2.png, R020/menu-cat-close.png, R020/card-close.png,
  R020/mobile-menu.png (chromium 1134, dsf 3 close-ups, same
  shots-probe route).
- Visual inspection: performed — in-game close-ups: head fully bare
  (ears + whiskers + face clear, no hat read), the neck roll reads as
  bunched cloth hugging the head's underside, cords + aglets visible on
  the chest (they lean toward a tiny-face read at game scale — declared
  knob), sleeves/cuffs subtle at the shoulders; menu backdrop close-up:
  the cat greets BARE in the pink dress (no hoodie) as directed; card
  close-up (desktop + mobile): chin clear, collar reads below the chin,
  garment reads as a hoodie, not a hat.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shots probe PASS
  (no pageerrors/console errors).
- Open question: LIKED/REJECTED on the hood-down hoodie. Declared knobs:
  (1) the cords' little-face read on the chest — thinner/shorter cords
  or smaller aglets; (2) chest busy-ness (creases/slots thinning); (3)
  the roll mass's peak heights. The character-select card SVG can follow
  the same knobs independently.

## Feedback F020
- Round: R021 (brief stage, pre-render)
- Verdict: MIXED — LIKED on the R020 direction, REJECTED on four specifics
- Scope: (1) the main-menu (portfolio landing) Cat Runner tile artwork;
  (2) the character-select card portrait; (3) the ready-screen backdrop
  preview; (4) the in-game rig's limbs and hoodie richness
- Decision: the owner LOVES the direction of the latest changes and calls
  the select card "overall great", but: (a) the landing tile illustration
  now includes a HAT (the R019 hood dome survived on
  ProjectArtwork.tsx's KittyCenterMark while R020 resynced the other
  surfaces) — remove it; (b) the card's hood reads DISTORTED — like a
  T-shirt tied on as a scarf; (c) the ready-screen backdrop preview still
  shows the OLD bare cat — update it to the hoodie version (this
  reverses F019's "menu cat needs no hoodie": the owner now explicitly
  wants the preview dressed); (d) in-game the cat's HANDS are invisible
  and must show, the LEGS barely peek and must show more, and the hoodie
  should carry DANGLING elements like the Ashen knight's — not prominent,
  just visual richness. Standing directives stay in force: the model has
  autonomy over design and code choices ("no strict rules or
  requirements"), must reason deeply and thoroughly before output, takes
  screenshots and delivers what is most visually appealing, avoids
  low-effort drawing — the quality bar is the Ashen character.
- User source: "I love the direction of the latest changes... Main menu:
  the illustration looks like it includes a hat — remove it. / Character
  selection: overall great, but the hood is a bit distorted — appears as
  though the cat is wearing a T-shirt as a scarf; the background preview
  still shows the old version of the cat (without the hoodie) — update
  that. / The cat's hands are not visible and should be; legs barely
  visible, should be more so; dangling elements on the hoodie like the
  Ashen character — not overly prominent, enough for visual richness. /
  No strict rules; take screenshots, evaluate what is most visually
  appealing; avoid low-effort drawing; reference the Ashen character."
  (2026-09-15)
- Artifact: R020 renders + the live deployed site (R020, deploy 34938993).
- Supersedes: F019 part 3 only (the bare-menu backdrop decision); every
  other F019/F018 clause stays in force.

## Round R021
- Goal: answer F020 on all four surfaces — the landing tile loses its
  hat, the select card's hood must stop reading as a T-shirt-scarf, the
  ready backdrop preview shows the dressed cat, and the in-game rig gets
  visible hands, readable legs and a quiet dangling hood element (the
  Ashen bar). Routing-tier gambles (per the owner's "lets gamble") fed
  the card and the rig; both replies integrated by salvage.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass at
  the upper zone as cloth, never headwear), F006 (floating energy —
  damped cloth jiggle), F008 (senior-minimal flat fills), F017 (owner
  picked the hoodie), F018 (ears + whiskers stay clear), F019's
  ears/whiskers clauses, F020 (this round's mandate).
- Changes: LANDING TILE — ProjectArtwork.tsx KittyCenterMark: the R019
  hood dome (dome + lining + toggles + re-laid ear tips) deleted — the
  mark's bare ears are revealed again; the tiny glint moved back onto
  the paper head at (122,58). CARD — KittyPortrait reworked from the
  routing reply (salvaged garment stack, repaired): hood shell bunched
  at shoulder level (its top edge hides behind the head, lobes merge
  into the shoulders, bottom edge extended to y 88 so no background gap
  shows), pink lining reading INSIDE the bunched shell, white chest fur
  through a NARROW scoop neckline (dips to y 85, never spans the head's
  width — the scarf read came from the old full-width collar + lobes at
  cheek height), kangaroo pocket + hand slots, white ink-outlined cords
  with rounded aglets (rig-matching), R020's eye-level whiskers kept,
  the reply's inner ears + low whiskers dropped (identity laws), head
  drawn last. RIG — arms rebuilt as ONE continuous silhouette
  (armPawShape: shoulder cap -> tapered forearm -> round paw; pivot
  unchanged (+-0.62, 0.92); ink grown about the bbox centre via a new
  grownInk helper because pivot-authored shapes drift under Part's
  uniform origin-scale), red shoulder sleeve back to a soft ellipse
  (0.165x0.185 — the R020 blob read; the first pass's angular raglan
  poked past the torso's shoulder curve and read as little wings) with
  a bowDeep cuff band at its bottom edge and the white forearm + paw
  (0.33 body units) reading through the whole swing; legs rebuilt as
  legPawShape stubs (stub tucked behind torso + hem band, paw ellipse
  reaching to body ~-0.10 — past the old ~1px peek; z fill 0.07 / ink
  0.04, behind the dress ink 0.09) riding the existing step bounce;
  hoodDrapeShape — a soft two-lobed flap of the hood's loose back
  fabric hanging from a neck pivot (0, 0.98), z -0.06/-0.09 ink, bowDeep,
  emerging past the torso's lower-left silhouette (a sharp single tip
  read as a spike in the first render and was rounded into lobes),
  swaying with cape-style terms at smaller amplitudes (sway 0.055, lift
  0.06, dash 0.28); outfit gating DELETED (outfitRef/sleeve refs +
  showOutfit writes) — the hoodie shows in every world status. Souls
  branch untouched (geo.arm/geo.foot kept for it; sleeves/cuff/drape/
  legs are pastel-only). ECHO retint: all new pieces palette-keyed —
  FADED needed zero additions.
- Before: R020 renders (scarf-read card, bare blurred menu cat, ~1px
  legs, no hands, landing tile wearing the dome).
- After: R021/landing-tile.png, R021/card-close.png, R021/menu.png,
  R021/menu-cat-close.png, R021/running.png, R021/running-close.png,
  R021/dash.png, R021/desktop-running.png, R021/mobile-menu.png
  (chromium 1134, dsf 3 close-ups, same probes route).
- Visual inspection: performed — landing tile: the beret is gone, bare
  ears + glint read clean; card close-up (desktop + mobile): no scarf
  wrap, open collar + chest fur + cords read as a hoodie worn
  hood-down, head/chin clear; menu: the blurred backdrop cat is DRESSED
  (red hoodie reads through the wash); rig close-ups: white paws +
  forearm read under both cuffs through the swing, stubby legs + paws
  show below the hem band and overlap the white ground stripe
  (planted), drape = a quiet dark-red scalloped flap at the torso's
  lower-left, dash still clears it out; no face/ear/whisker collisions.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shots probe PASS
  (one flaky bullet-vignette bloom assertion on an early run, clean on
  the re-run — pre-existing timing flake, not this round's code).
- Open question: LIKED/REJECTED per surface. Declared knobs: (1) the
  drape's size/position (bigger/lower or gone); (2) paw size (rx 0.118)
  and cuff width; (3) how far the legs hang (currently paw bottoms at
  body ~-0.10, slightly past the old contact line); (4) the card's
  hood-shell width (spans the body's full x-range).

## Feedback F021
- Round: R022 (brief stage, pre-render)
- Verdict: MIXED — LIKED on the R021 direction, REJECTED on three specifics
- Scope: (1) the character-select card's cat proportions and hood; (2)
  the in-game rig's arm motion and sleeve/paw join
- Decision: the owner likes the direction overall, but (a) the card's
  cat reads TOO FIT — "like a slim teenager cat" — the torso needs a
  chubbier, rounder read; (b) the card's hood is MISPLACED and FAR TOO
  WIDE — its span equals the shoulder width, which a bunched hood
  should never reach (it belongs at the neck, narrower than the
  shoulders); (c) in-game the hands move too much and look unnatural —
  calm the swing; (d) the hoodie's sleeve and the cat's hand read as
  completely separate pieces — the join must read as one sleeve over
  one arm.
- User source: "Character selection menu: the cat appears to be too
  fit, like a slim teenager cat. It shouldn't look this fit. Its hood
  also appears misplaced and is far too wide — its length is equal to
  the cat's shoulder width, which isn't appropriate for a hood. /
  In-game: the cat's hands seem to move too much and look unnatural;
  the hoodie's hands and the cat's hands look awkward, as if they are
  completely separate." (2026-09-15)
- Artifact: R021 renders.
- Supersedes: none (refines R021's card hood/silhouette and rig arm
  treatment; everything else stays).

## Round R022
- Goal: answer F021 on its two surfaces — the select card's cat must
  stop reading fit/slim-teenager and its hood must shrink to a
  neck-width bunched shell, while the rig's arms calm down and the
  sleeve/paw join reads as one garment over one arm.
- Preserved preferences: F002 (face untouched — NO mouth), F004
  (mass as cloth, never headwear), F006 (floating energy), F008
  (senior-minimal flat fills), F017 (hoodie), F018/F019 (ears +
  whiskers clear), F020/F021 (this round's mandate), hood DOWN,
  palette keys, RESTRICTED z-ladder, head drawn LAST in the card.
- Changes: CARD — KittyPortrait: hood shell rebuilt to NECK width
  (new path spanning x 28–72 of the 100-box, well inside the
  shoulder span; its top edge still hides behind the head), the
  jaw-under lining layer moved AFTER the chest fur so the chin sits
  clean on the shell with no background gap; the body rebuilt as a
  BARREL (fuller flanks, x 10–90, rounded waist at y 74) for the
  chubby read; pocket, cords, face and whiskers kept verbatim; head
  still last. RIG — Kitty.tsx: sleeveShape rebalanced into a balloon
  taper that wraps the arm down to a roundedRect cuff (0.19x0.05,
  r 0.022) at [0, -0.245, 0.215] (sleeve ink via grownInk), so
  sleeve -> cuff -> paw reads as one continuous garment; the arm
  swing amplitude scaled x0.55 in useFrame for the pastel variant
  (souls variant untouched).
- Before: R021 renders (card: slim torso + shoulder-wide hood; rig:
  lively swing, sleeve and paw reading as separate pieces).
- After: R022/menu.png, R022/menu-cat-close.png, R022/card-close.png,
  R022/running.png, R022/running-alt.png, R022/running-close.png,
  R022/dash.png (chromium 1134, dsf 3 close-ups, same probes route).
- Visual inspection: performed — card close-up: barrel body reads
  chubby, hood is a narrow neck shell well inside the shoulders
  (no shoulder-width span), chin clear on the shell, hood DOWN, no
  mouth; rig full frames (run-frame-2/4): the close-up "wedge" suspicion
  does NOT survive game scale — paws read as small round white nubs
  under the cuffs, swing is visibly calmer, legs planted below the
  hem; dressed blurred menu cat kept; dash ghost-trail intact; no
  face/ear/whisker collisions.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; shots probe re-run
  clean (13:40 local, fresh closeups in /var/folders scratch).
- Open question: LIKED/REJECTED per F021 point (a)–(d). Declared
  knobs: (1) the card hood shell's exact width; (2) paw rx / cuff
  rounding if the nub read needs softening at close-up; (3) the
  drape's visibility (still occluded in several swing phases —
  bigger/lower or gone); (4) how far the legs hang.

## Feedback F022
- Round: R022 (verdict)
- Verdict: LIKED
- Scope: the F021 points (a)–(d) — the card's proportions + hood and
  the rig's arm swing + sleeve/paw join
- Decision: the owner liked the round as presented — the chubby
  barrel card with the neck-width hood and the calmer one-piece
  sleeve/cuff/paw rig are accepted. The declared knobs (hood width,
  paw rx / cuff rounding, drape visibility, leg hang) stay available
  but nothing is pending.
- User source: "liked" (2026-09-15)
- Artifact: R022 renders.
- Supersedes: none.

## Feedback F023
- Round: R023 (brief stage, pre-render)
- Verdict: REJECTED
- Scope: the in-game rig's arm motion and the sleeve/paw join (pastel cat, running state)
- Decision: the R022 arm treatment is still not enough — the cat's hands
  still move too much and read unnatural, and the hoodie's sleeve/hand and
  the cat's hand still read as totally separate pieces. The join must be
  made un-mistakeable and the swing calmed further. Card and legs are not
  part of this complaint.
- User source: "in-game - cat's hand is moving too much, it seems like, and
  also they look unnatural - please fix. and also its hoodie hands and cat's
  hand look akward. as if they are totally separatte - fix." (2026-09-15)
- Artifact: R022 renders.
- Supersedes: refines F021(c)/(d) further; does not reverse F022's verdict
  on the card (barrel body, neck-width hood stay accepted).

## Round R023
- Goal: answer F023 on the in-game rig — the sleeve/hand join must read as
  ONE garment over ONE arm (un-mistakeable), and the arm swing must calm
  down further and read natural.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass as
  cloth, never headwear), F006 (floating energy), F008 (senior-minimal
  flat fills), F017 (hoodie), F018/F019 (ears + whiskers clear), F022
  (card barrel + neck-width hood accepted — untouched this round), hood
  DOWN, palette keys, RESTRICTED z-ladder, drape + cords untouched.
- Changes: RIG ONLY (Kitty.tsx) — (1) sleeveShape re-authored to cover the
  WHOLE arm: shoulder cap -> tapered shaft -> rounded hem at ~-0.31 (an
  oversized hoodie sleeve with the hand tucked inside); (2) armPawShape
  shortened: the stem (to -0.30) hides fully under the sleeve fill, only
  the paw tip (rx 0.092, narrower than the cuff) peeks ~0.10 below the
  hem — white can no longer read as a separate limb under the cuff;
  (3) cuff band moved down to [0, -0.27] to cap the hem; (4) pastel arm
  swing amplitude split: grounded 0.35x (paw tip sweeps +-0.07 body
  units, was +-0.16), airborne 0.6x forward reach (shorter arm keeps the
  reach natural); souls branch untouched (stock swing, its own ellipse).
- Before: R022 renders (white forearm + paw visibly separate below the
  cuff; livelier swing).
- After: R023/menu.png, R023/menu-cat-close.png, R023/card-close.png,
  R023/running-f1..f4.png, R023/running-f2-close.png,
  R023/running-f3-close.png, R023/dash.png, R023/dash-close.png,
  R023/desktop-running.png, R023/mobile-running.png (chromium 1134, dsf 3
  close-ups + full game-scale frames, same probes route).
- Visual inspection: performed — run frames f1/f2/f4: arms read as short
  red sleeves with a cuff and at most a small white paw tip peeking below
  the hem; the two-piece sleeve/forearm read from R022 is gone; swing is
  visibly calmer (arm tips travel a few px, in step with the bob);
  f3 (backward-swing phase): the trailing sleeve pokes past the body
  silhouette as a bare rounded red end with NO white — reads as the hand
  fully tucked inside the sleeve, not as a detached piece; dash: tilt
  intact, sleeves ride the swing, no new collisions with the pocket,
  cords or hem; menu backdrop cat stays dressed and calm; card close-up
  unchanged (card is a separate canvas render — untouched by design).
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  PASS (CHROME_PATH=chromium-1134, all six shots, no problems).
- Open question: LIKED/REJECTED on the two F023 points (swing calm +
  one-piece join). Declared knobs: (1) the white paw peek's size/rounding
  (currently a small sliver; can grow a rounder tip or disappear
  entirely); (2) the grounded swing amplitude (0.35x — can go calmer or
  livelier); (3) the sleeve hem's length (arm overall length).

## Feedback F024
- Round: R024 (brief stage, pre-render)
- Verdict: MIXED — REJECTED on the R023 paw peek, plus two new asks
- Scope: (1) the in-game rig's paw visibility; (2) the in-game whisker
  length; (3) the character-select card's neck length
- Decision: (a) the R023 paw peek went too far — the hands are now
  HIDDEN; they must be visible again, but WITHOUT the old dangling
  forearm read (the R022 complaint stands); (b) the in-game whiskers
  should be ~20% longer; (c) the card's cat neck should grow ~10%.
- User source: "The in-game hands are hidden again. Please make them
  visible, but not dangling as they were before. Also, make the in-game
  cat's whiskers about 20% longer. In the character selection menu,
  increase the cat's neck by approximately 10%." (2026-09-15)
- Artifact: R023 renders.
- Supersedes: refines F023's join fix (one-piece read stays; the peek
  size was over-corrected).

## Feedback F025
- Round: R024 (addendum, pre-render)
- Verdict: ADDITION to F024
- Scope: the character-select card's head size
- Decision: the card's head (and proportionally the face) grows ~10%,
  on top of the F024 neck increase. The in-game hands/whiskers asks stand
  as recorded in F024.
- User source: "neck + around 10% (as i wrote); and also head
  (proportionally face) + around 10%" (2026-09-15)
- Artifact: R024 in-progress renders.
- Supersedes: none (extends F024(c)).

## Round R024
- Goal: answer F024/F025 — hands visible but not dangling; whiskers ~20%
  longer in-game; card neck ~+10%; card head ~+10% with the crown staying
  level with the ashen card's head-top band.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass as
  cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, drape + cords + legs untouched, souls untouched.
- Changes: RIG — (1) pastel arm pivot lowered y 0.92 -> 0.80 (souls keeps
  0.92): the collar drape (hoodFront z 0.22, sags to body y ~0.50) paints
  OVER the arm fill (z 0.16) — at the old pivot the R023 cuff + peek sat
  behind it, hiding the hands entirely; the lower pivot puts the sleeve
  hem, cuff and paw peek BELOW the collar line; (2) sleeveShape hem
  flattened (taper to ±0.115 at -0.30, dip to -0.312 — the R023 deep dip
  made the peek read as two white fangs flanking the dip); (3) cuff band
  moved to [0, -0.285] so it caps the sleeve's end; (4) armPawShape paw
  chunkier (rx 0.105, ry 0.1, bottom -0.46 — peek ~0.15, clearly visible,
  far short of the R022 dangling forearm); (5) whiskers PlaneGeometry
  0.36 -> 0.432 (+20%). CARD — KittyPortrait: head x-scaled 1.1 about the
  centre (75 -> 82.5 wide; height unchanged so the crown stays at its
  level — the ashen card's head-top band is bone top 20 / dome apex 24 /
  ear tips 10, the pastel crown 16 sits between them), ears + eyes + nose
  follow (x positions scaled, feature sizes scaled), chin keeps the F024
  raised line (neck +10%), whiskers unchanged.
- Before: R023 renders (hidden hands), R022 card.
- After: R024/menu.png, R024/card-close.png, R024/card-souls.png,
  R024/running-f2.png, R024/running-f3.png, R024/running-f2-close.png,
  R024/running-f3-close.png, R024/dash.png, R024/dash-close.png,
  R024/desktop-running.png (chromium 1134, dsf 3 close-ups + game-scale
  frames, same probes route).
- Visual inspection: performed — run frames f2/f3 + dash: both paws read
  as clean round white nubs under the cuffs at every checked swing phase
  (the R023 fang/wedge read is gone; nothing dangles); swing stays calm;
  whiskers extend visibly past the head on both sides, no eye collision;
  dash tilt intact. Cards side by side: pastel head wider, crown level
  with the knight's ear tips, neck sliver reads under the chin. NOTE:
  run-frame-1 captured a headless-GPU channel-split glitch twice in a
  row (transient Chromium compositing artifact, geometry clean in the
  same run's other frames) — treated as a capture flake, not a code
  signal.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  PASS (all six shots, no problems).
- Open question: LIKED/REJECTED per F024(a)-(c) + F025. Declared knobs:
  (1) the paw peek's size/roundness; (2) the grounded swing amplitude
  (0.35x); (3) the card head's width factor (1.1) and the crown's level;
  (4) the in-game whisker length (0.432).

## Feedback F026
- Round: R025 (brief stage, pre-render)
- Verdict: MIXED — REJECTED on the card face spread, LIKED on the rig
  hand visibility, CLARIFIED the whisker scope, REJECTED the current
  swing character
- Scope: (1) the card's face placement/form; (2) the in-game whisker
  length; (3) the in-game arm motion
- Decision: (a) the R024 face spread ("морда разъехалась
  пропорционально") is rejected — instead the face/chin level moves a
  bit down, keeping the face's form unscaled; (b) the whisker increase
  was meant for the IN-GAME rig only, not the character-select card
  (card whiskers stay as-is); (c) the hands being visible is good, but
  the motion is awkward — the arms must move like the original Hello
  Kitty before the IP-anxiety redesign (stock rig amplitude, no
  multipliers).
- User source: "морда разъехалась пропорционально - i dont like this.
  instead, make the face/chin level a bit down (instead of squeezing
  face form). also i meant incease whiskers within game, not in
  character selection menu. it is good that hands are moving now. but
  it is awkawrd. make them move like it was in hello kitty before IP
  anxiety changes of mine" (2026-09-15)
- Artifact: R024 renders.
- Supersedes: refines F025 (the card head stays +10% wide; the face
  does not scale with it) and F024(a) (the visible-not-dangling read
  stays; the calm swing character is replaced by the original one).

## Round R025
- Goal: answer F026 — the card face goes back to its original form and
  sits a bit lower; card whiskers untouched (the whisker increase was
  in-game only); the rig arms swing with the original Hello-Kitty-era
  amplitude (stock values, no multipliers).
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass as
  cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, drape + cords + legs untouched, souls untouched,
  F025 card head stays 82.5 wide.
- Changes: RIG — arm swing restored to stock: `const armSwing =
  pose.armSwing;` (grounded ±0.5, airborne −0.55 — the original
  pre-redesign values at eb8519c; the R023 0.35x grounded / 0.6x air
  multipliers removed; the pocket-dip occlusion at the deepest inward
  swing is pre-existing original behaviour). CARD — KittyPortrait face
  reverted to its original form, lowered +2 units: eyes cx 34/66
  cy 49 (rx 2.2, ry 3.4), nose cx 50 cy 50.5 (rx 2.6, ry 1.9), whiskers
  translated +2 with the face (rows 45/49/53, tips 40.5/49/57.5,
  lengths unchanged); head keeps the F025 82.5 width and the F024
  raised chin line.
- Before: R024 renders (face scaled with the head, calm 0.35x swing).
- After: R025/menu.png, R025/card-close.png, R025/card-souls.png,
  R025/card-face-zoom.png, R025/running-f1.png,
  R025/running-f1-close.png, R025/running-f4.png,
  R025/running-f4-close.png, R025/dash.png, R025/dash-close.png
  (chromium 1134, dsf 3 close-ups + game-scale frames, same probes
  route).
- Visual inspection: performed — run frames f1/f4 + dash: the swing is
  lively again (arms travel visibly front/back like the original);
  both paws read as clean round white nubs under the cuffs at every
  clean checked phase, nothing dangles, no fang read; whiskers extend
  past the head without eye collision; dash tilt intact. Cards: the
  face sits lower in the head in its original unscaled form (the R024
  proportional spread is gone), card whiskers keep their length.
  NOTE: f2/f3 flaked again this run (channel-split + out-of-crop),
  the same transient headless-GPU pattern as R024 — not a code signal.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  PASS (all six shots, no problems).
- Open question: LIKED/REJECTED per F026(a)-(c). Declared knobs: (1) the
  card face's lowered level (+2); (2) the stock swing amplitude
  (grounded ±0.5 / air −0.55); (3) the in-game whisker length (0.432).

## Feedback F027
- Round: R026 (brief stage, pre-render)
- Verdict: MIXED — REJECTED the stock swing's motion character (hands
  still awkward, "here and there"), REJECTED the card head's width,
  REJECTED the face's vertical placement
- Scope: (1) the in-game arm motion; (2) the card face/head proportions
- Decision: (a) the rig arms still read as awkwardly waving "here and
  there" even at the stock amplitude — calm the motion character
  without returning to the rejected R023 dead-calm 0.35x; (b) the card
  face/head narrows ~10% in width; (c) the face grows ~10% taller,
  done by positioning the head lower (the extra height extends
  downward: the crown keeps its level, the chin drops).
- User source: "hands still look awkwardly moving here and there. in
  character choice menu make face's width around -10%. face's height
  around +10 by positioning the head lower" (2026-09-15)
- Artifact: R025 renders.
- Supersedes: F025's +10% head-width preference (the head now narrows
  back ~10%) and refines F026(c) (the stock amplitude itself still
  reads awkward at the lowered pivot).

## Round R026
- Goal: answer F027 — calm the rig's arm motion without going back to
  the R023 dead-calm; card head narrows ~10% and grows ~10% taller
  through a lower head placement.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass as
  cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, drape + cords + legs untouched, souls untouched
  (the souls swing keeps the stock values), F024 paw peek read,
  F026 card whiskers' length.
- Changes: RIG — new module const KITTY_SWING_DAMP = 0.7: the pastel arm
  multiplies the pose swing by 0.7 (grounded ±0.35 rad, airborne
  −0.385, paw sweep ±0.154 body units — out of the pocket-dip range);
  souls keeps `pose.armSwing` untouched. CARD — KittyPortrait head
  narrowed back to 74.25 wide (x-scaled 0.9 about the centre, undoing
  the F025 +10%) and grown to 55 tall with the crown keeping its level
  (y 16) while the chin drops 66 -> 71 (the head's mass sits lower, a
  taller face); ears follow the narrower crown (bases ride the reshaped
  outline, tip height unchanged); the face (eyes cy 52.3, nose 53.95)
  and whisker rows ride +3.3 down with the head, all forms and lengths
  unscaled — the whiskers' x-ends stay put, so against the narrower
  head they read longer.
- Before: R025 renders (stock swing, wide 82.5 head).
- After: R026/menu.png, R026/card-close.png, R026/card-souls.png,
  R026/card-face-zoom.png, R026/running-f1.png,
  R026/running-f1-close.png, R026/dash.png, R026/dash-close.png
  (chromium 1134, dsf 3 close-ups + game-scale frames, same probes
  route).
- Visual inspection: performed — run f1 + dash: the swing reads calmer,
  arms stay close to the barrel, both paws read as clean round white
  nubs, nothing flails to the sides or dips into the pocket; dash tilt
  intact; whiskers clear the eyes. Card: the head reads as a taller
  narrower oval sitting lower into the collar (classic-kitty
  proportion), crown still level, face in the lower half unchanged in
  form. NOTE: run-frame-4 flaked this run (empty-crop capture flake,
  same transient headless-GPU pattern as before) — not a code signal.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  PASS (all six shots, no problems).
- Open question: LIKED/REJECTED per F027(a)-(c). Declared knobs: (1) the
  swing damp factor (0.7 — up toward stock or down toward 0.35);
  (2) the card head's width factor (0.9) and height (+10%); (3) the
  head's drop amount (chin at 71); (4) the card whiskers' now-longer
  relative read (lengths untouched, heads-up only).

## Feedback F028
- Round: R027 (brief stage, pre-render)
- Verdict: REJECTED the remaining swing travel — the paw's travel
  distance must shrink another ~30%
- Scope: the in-game arm motion amplitude only
- Decision: the paw's travel distance shrinks ~30% from the R026 0.7x —
  KITTY_SWING_DAMP 0.7 -> 0.5 (grounded ±0.25 rad, airborne −0.275,
  paw sweep ±0.11 body units). No card changes this round.
- User source: "make the hands move even less, around 30% less (i mean
  distance of its move)" (2026-09-15)
- Artifact: R026 renders.
- Supersedes: none (tightens F027(a) further; the R023 dead-calm 0.35x
  reference stays rejected — 0.5x keeps the swing visible).

## Round R027
- Goal: answer F028 — the paw's travel distance shrinks ~30% from the
  R026 0.7x factor.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass as
  cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, drape + cords + legs untouched, souls untouched
  (stock swing), F024 paw peek read, F026/F027 card untouched.
- Changes: RIG — KITTY_SWING_DAMP 0.7 -> 0.5 (≈0.7·0.7, a ~28.6% travel
  cut ≈ the asked ~30%): grounded ±0.5·0.5 = ±0.25 rad, airborne
  −0.55·0.5 = −0.275, paw sweep ±0.22·0.5 = ±0.11 body units. Comment
  blocks updated to carry both steps (F027 then F028).
- Before: R026 renders (0.7x swing).
- After: R027/menu.png, R027/running-f1.png, R027/running-f1-close.png,
  R027/dash.png, R027/dash-close.png (chromium 1134, dsf 3 close-ups +
  game-scale frames, same probes route). The card SVG is untouched this
  round, so no card artifacts are re-captured (R026 set stays current).
- Visual inspection: performed — run f1 + dash: the paws now travel a
  short, tight arc beside the barrel, reading as a gentle stubby wiggle
  rather than a wave; nothing flails, no pocket dip; dash tilt intact;
  the f1 blink pose renders clean. NOTE: run-frame-3 flaked this run
  (empty-crop capture flake, the same transient headless-GPU pattern) —
  not a code signal.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  PASS (all six shots, no problems).
- Open question: LIKED/REJECTED per F028. Declared knobs: (1) the swing
  damp factor (0.5 — the next smaller step would be ~0.35, the rejected
  dead-calm, so a further cut needs an explicit owner call).

## Feedback F029
- Round: R028 (brief stage, pre-render)
- Verdict: REJECTED the remaining travel — the paw's move distance
  shrinks another ~15%
- Scope: the in-game arm motion amplitude only
- Decision: the paw's travel distance shrinks ~15% from the R027 0.5x —
  KITTY_SWING_DAMP 0.5 -> 0.425 (0.5·0.85): grounded ±0.21 rad,
  airborne −0.234, paw sweep ±0.094 body units. No card changes.
- User source: "make it 15% even less movement" (2026-09-15)
- Artifact: R027 renders.
- Supersedes: none (tightens F028 further; 0.425x stays above the
  rejected R023 dead-calm 0.35x reference).

## Round R028
- Goal: answer F029 — the paw's travel shrinks ~15% from the R027
  0.5x factor.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass as
  cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, drape + cords + legs untouched, souls untouched
  (stock swing), F024 paw peek read, F026–F028 card untouched.
- Changes: RIG — KITTY_SWING_DAMP 0.5 -> 0.425 (0.5·0.85, the asked
  ~15% travel cut): grounded ±0.5·0.425 = ±0.21 rad, airborne
  −0.55·0.425 = −0.234, paw sweep ±0.22·0.425 = ±0.094 body units.
  Comment blocks updated to carry the full stepwise history (F027
  0.7x, F028 0.5x, F029 0.425x).
- Before: R027 renders (0.5x swing).
- After: R028/menu.png, R028/running-f2.png, R028/running-f2-close.png,
  R028/running-f4.png, R028/running-f4-close.png, R028/dash.png,
  R028/dash-close.png (chromium 1134, dsf 3 close-ups + game-scale
  frames, same probes route). The card SVG is untouched this round, so
  no card artifacts are re-captured (R026 set stays current).
- Visual inspection: performed — run f2/f4 + dash (all three clean
  this run): the paws trace a short tight arc right beside the barrel,
  reading as a subtle stubby wiggle; nothing flails, no pocket dip;
  dash tilt intact.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  first run flagged "[desktop] bullet vignette never bloomed (opacity
  0.037)" — the autopilot's bullet-time dwell flaked (the vignette is
  post-processing, unreachable from the arm-swing factor); a clean
  re-run passed all six shots with no problems.
- Open question: LIKED/REJECTED per F029. Declared knob: the swing damp
  factor (0.425 — approaching the rejected dead-calm 0.35, so a further
  cut needs an explicit owner call).

## Feedback F030
- Round: R029 (brief stage, pre-render)
- Verdict: REJECTED the lateral swing's motion character itself — even
  at 0.425x the paws still read as awkward waving "here and there";
  the owner asked for a recommendation and chose the proposed fix
- Scope: the in-game arm motion's axis and character (not amplitude)
- Decision: (a) the diagnosis stands — four amplitude cuts (F023 0.35x,
  stock, F027 0.7x, F028 0.5x, F029 0.425x) never removed the
  awkwardness because the SIDE-TO-SIDE z-swing itself is the waving
  read; (b) the pastel arms swap the lateral swing for a VERTICAL
  counter-phase bob: the whole arm unit (sleeve + cuff + paw) rides
  sin(runPhase) ±0.04 body units, the left rising while the right
  dips, stride-synced; airborne both arms hold a slight +0.03 lift
  (arms rise with the jump); dash keeps the bob; (c) the souls variant
  keeps the untouched stock z-swing.
- User source: "it still feels like awkward movement. what do u
  recommend?" — chose the recommended "Вертикальный боб" option
  (2026-09-15)
- Artifact: R028 renders.
- Supersedes: F026(c)/F027(a)/F028/F029's lateral-swing line — the
  swing-amplitude knob is retired for the pastel arms; the arms now
  have a KITTY_ARM_BOB amplitude knob (0.04) instead.

## Round R029
- Goal: answer F030 — swap the pastel arms' lateral z-swing for a
  vertical counter-phase bob (the recommended motion character).
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass as
  cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, drape + cords + legs untouched, souls untouched
  (stock z-swing), F024 paw peek read, F026–F028 card untouched.
- Changes: RIG — the pastel arm block in useFrame: `rotation.z` no
  longer alternates; each whole arm group (sleeve + cuff + paw, one
  piece) translates vertically: grounded y = ±KITTY_ARM_BOB
  (0.04)·sin(runPhase), counter-phase (left up while the right dips),
  stride-synced; airborne both arms hold a +0.03 lift (bob frozen, the
  arms rise with the jump); rotation.z is driven back to 0 every frame
  on the pastel branch. The module const KITTY_SWING_DAMP (0.425) is
  replaced by KITTY_ARM_BOB (0.04); both comment blocks carry the full
  stepwise history and the F030 axis-switch rationale. Souls keeps the
  stock pose.armSwing z-rotation untouched.
- Before: R028 renders (0.425x lateral swing).
- After: R029/menu.png, R029/running-f1.png, R029/running-f1-close.png,
  R029/running-f3.png, R029/running-f3-close.png, R029/running-f4.png,
  R029/running-f4-close.png, R029/dash.png, R029/dash-close.png
  (chromium 1134, dsf 3 close-ups + game-scale frames, same probes
  route). The card SVG is untouched this round, so no card artifacts
  are re-captured (R026 set stays current).
- Visual inspection: performed — run f1/f3/f4 + dash (all clean this
  run): no lateral splay at all, the paw nubs sit right beside the
  barrel; the counter-phase bob reads as a subtle vertical offset
  between frames (one paw a touch higher than the other); the sleeve +
  cuff + paw move as one piece (the F023 "totally separate" read is
  structurally impossible now); no shoulder gap at the ±0.04 travel;
  dash tilt intact, arms tucked.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  PASS (all six shots, no problems).
- Open question: LIKED/REJECTED per F030. Declared knobs: (1) the bob
  amplitude (0.04 — the vertical travel of each paw); (2) the airborne
  lift (+0.03); (3) the counter-phase pairing (left up / right down —
  could flip to in-phase if the read disagrees).

## Feedback F031
- Round: R030 (brief stage, pre-render)
- Verdict: REJECTED the R029 vertical bob outright — the owner wants
  the previous lateral z-swing character back, with its travel cut
  another ~20%
- Scope: the in-game arm motion's axis (back to lateral) and travel
- Decision: (a) the vertical bob is rejected — the lateral swing
  character returns; (b) the R028 0.425x travel shrinks 20%:
  KITTY_SWING_DAMP = 0.425·0.8 = 0.34 (grounded ±0.17 rad, airborne
  −0.187, paw sweep ±0.075 body units) — the smallest visible lateral
  swing so far.
- User source: "nope. don't like. rather than that decrease movement
  distance of previous one 20%" (2026-09-15)
- Artifact: R029 renders.
- Supersedes: F030 (the bob experiment is closed as rejected; the
  KITTY_SWING_DAMP amplitude knob returns at 0.34).

## Round R030
- Goal: answer F031 — restore the lateral z-swing character and cut its
  travel ~20% from the R028 0.425x.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass as
  cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, drape + cords + legs untouched, souls untouched
  (stock swing), F024 paw peek read, F026–F028 card untouched.
- Changes: RIG — the R029 bob block is reverted to the lateral
  z-swing: `const armSwing = isSouls ? pose.armSwing :
  pose.armSwing * KITTY_SWING_DAMP;` with KITTY_SWING_DAMP = 0.34
  (0.425·0.8, the asked ~20% travel cut): grounded ±0.5·0.34 = ±0.17
  rad, airborne −0.55·0.34 = −0.187, paw sweep ±0.22·0.34 = ±0.075
  body units. The module const comment carries the full F023–F031
  stepwise history including the rejected bob detour; position.y is
  no longer written by useFrame (the pivot stays at its R024 seat
  0.8 from JSX). Souls keeps the stock pose.armSwing untouched.
- Before: R029 renders (vertical bob, rejected).
- After: R030/menu.png, R030/running-f1.png, R030/running-f1-close.png,
  R030/running-f4.png, R030/running-f4-close.png, R030/dash.png,
  R030/dash-close.png (chromium 1134, dsf 3 close-ups + game-scale
  frames, same probes route). The card SVG is untouched this round, so
  no card artifacts are re-captured (R026 set stays current).
- Visual inspection: performed — run f1/f4 + dash (f2/f3 flaked this
  run, the usual transient capture pattern): the paws trace a very
  short lateral arc right beside the barrel — the 0.34x swing reads as
  a faint stubby wiggle, nothing flails, no pocket dip; dash tilt
  intact; the f1 blink pose renders clean.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  first run flagged "[desktop] bullet vignette never bloomed (opacity
  0.05)" — the known autopilot bullet-time dwell flake (unreachable
  from the arm-swing factor); a clean re-run passed all six shots.
- Open question: LIKED/REJECTED per F031. Declared knob: the swing damp
  factor (0.34 — now BELOW the R023 dead-calm 0.35 reference, by the
  owner's explicit 20%-cut call).

## Feedback F032
- Round: R031 (brief stage, pre-render)
- Verdict: MIXED — the R030 swing stands unjudged this round (no rig
  comment); REJECTED the card head's forehead/jaw balance
- Scope: the character-select card's head shape only
- Decision: (a) the forehead seems big — shrink it ~10% (the crown
  drops 16 -> 19.6, landing right at the ashen card's bone-top band);
  (b) keep the relevant proportions the same (the width keeps the F027
  74.25, the total head height stays ~54); (c) the jaw/chin area grows
  ~15% — the chin should go lower than it is (71 -> 73.8), growing the
  area BELOW the unchanged face features.
- User source: "cat's forehead in character choosing menu seems big.
  make it a bit smaller, around 10%. keep relevant propotions the same.
  make its jaw/chin area bigger, around 15% (i.e. it should go lower
  than it is" (2026-09-15)
- Artifact: R026 card renders (the current head shape).
- Supersedes: refines F026(a)/F027(b)-(c) — same width, but the vertical
  mass redistributes: less forehead, more jaw.

## Round R031
- Goal: answer F032 — card head: forehead −10%, jaw/chin +15% lower,
  other proportions held.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass as
  cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, drape + cords + legs untouched, souls untouched
  (stock swing), F024 paw peek read, F026 card whiskers' length, the
  R030 rig (0.34x lateral swing) untouched this round.
- Changes: CARD — KittyPortrait head path reshaped: the crown drops
  16 -> 19.6 (the forehead −10%: the whole top arc shifts down 3.6),
  the chin drops 71 -> 73.8 (the jaw/chin +15%, the area below the face
  grows); the top/bottom curve controls ride the same shifts (29.2 ->
  32.8, 62.2 -> 65); the widest points stay at y 46.8 and the width
  stays 74.25 — relevant proportions preserved. Ears keep their tips
  (12/9) and x-positions; their bases ride the lowered crown (26.45 ->
  30.05, 18.75 -> 22.35). Face features (eyes cy 52.3, nose 53.95) and
  whisker rows stay put — the jaw grows below them. RIG untouched.
- Before: R026 card renders (crown 16, chin 71).
- After: R031/menu.png, R031/card-close.png, R031/card-souls.png,
  R031/card-face-zoom.png (chromium 1134, dsf 3, same probes route).
  No run-frame artifacts this round — the rig is untouched (the R030
  set stays current).
- Visual inspection: performed — the crown reads lower and flatter
  (the forehead no longer dominates the head), the ears poke higher
  above it and stay clear of the face, the eyes/nose keep their place
  with the jaw growing below, the chin dips into the collar with the
  chest-fur sliver reading under it; the crown sits right at the
  ashen card's bone-top band.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  PASS (all six shots, no problems).
- Open question: LIKED/REJECTED per F032(a)-(c) + the R030 rig verdict
  still pending from F031. Declared knobs: (1) the crown drop amount
  (3.6 — the forehead's −10%); (2) the chin drop amount (2.8 — the
  jaw's +15%); (3) the ear prominence (a consequence of the lowered
  crown — tips could rise with the crown if the read disagrees).

## Feedback F033
- Round: R031 (presented renders)
- Verdict: LIKED
- Scope: the character-select card's head reshape (crown 19.6, chin
  73.8, width 74.25 held).
- Decision: the R031 card face stands as-is; no further card knobs. The
  rig verdict moved to F034.
- User source: "liked." (2026-09-15)

## Feedback F034
- Round: R031 rig re-review (the owner rewatched the R030 swing)
- Verdict: REJECTED the PHASING — the mirrored signs read as a
  synchronized in-out paddle: both paws splay out, then both cross in
  together. The amplitude (0.34x) is NOT the complaint.
- Scope: the pastel rig's arm-swing phasing only.
- Decision: switch the two pastel arms to ALTERNATE like a real run
  gait — one paw out while the other tucks slightly in, swapping each
  stride. The souls variant keeps its untouched stock mirror.
- User source: the paws move "in and out"; chose "Попеременный мах"
  (alternating swing) from the offered knobs (2026-09-15).
- Resolves: F031's pending R030 verdict — the lateral character and the
  0.34 travel both stand; only the phase flips.

## Round R032
- Goal: answer F034 — keep the 0.34x lateral swing, fix the phasing to
  an alternating gait.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass
  as cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, drape + cords + legs untouched, F024 paw peek
  read, F026 card whiskers' length, F031 amplitude (0.34x — grounded
  ±0.17 rad, airborne −0.187, paw sweep ±0.075 body units), souls
  untouched (stock swing), the R031 card untouched this round.
- Changes: RIG — the pastel arm sign flip: both pastel arms now take
  rotation.z = -armSwing (previously mirrored -/+, which produced the
  synchronized in-out), so the paws alternate — one out while the other
  tucks in, swapping each stride; the souls branch keeps its own
  untouched mirror inside the isSouls gate; the module-const comment
  now carries the F023–F034 history. CARD untouched.
- Before: the R030 running set (mirrored in-out phasing).
- After: R032/menu.png, R032/running-f1/f3/f4.png + R032/cat-f1/f3/f4.png
  close crops, R032/dash.png + R032/cat-dash.png (chromium 1134, dsf 3,
  same probes route). The f2 frame hit a known capture glitch (RGB
  channel split) and was discarded — not a code signal; the card set
  stays at R031 (the card is untouched).
- Visual inspection: performed — f1 reads left-paw-out/right-paw-tucked,
  f3 the swap (right-out/left-tucked), f4 the neutral passing moment
  with both paws near the body; no shoulder gaps, no pocket dips, the
  silhouette stays clean; dash clean.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  FLAKY — the [desktop] bullet-vignette bloom assert flagged 4
  consecutive runs this session (opacity 0.015/0.04/0.021/0.003,
  threshold 0.05): the values are nonzero and vary run-to-run → the
  dash fires, but the fixed 120 ms wall-clock sample lands in the early
  (time-dilated) ramp. Unrelated subsystem — the vignette tracks
  world.timeScale, untouched this round; the only working-tree game
  change is the arm sign flip in Kitty.tsx. Prior sessions' clean
  re-runs passed. Not treated as a code signal.
- Open question: LIKED/REJECTED per F034. Declared knobs: (1) which arm
  leads first (a sign flip swaps the gait's starting side); (2) the
  amplitude stays 0.34x — could step back up (0.425x) if the
  alternation wants more travel; (3) the souls mirror stays stock.

## Feedback F035
- Round: R032 (presented renders)
- Verdict: LIKED
- Scope: the pastel rig's alternating arm-swing phasing at the 0.34x
  amplitude; the R031 card stays liked from F033.
- Decision: the R032 gait stands as presented — one paw out while the
  other tucks in, swapping each stride; knobs stay available (lead-arm
  flip, amplitude step-up, souls mirror), nothing pending. Both design
  tracks are now liked: the card (F033) and the rig (this entry).
- User source: "liked" (2026-09-15)

## Feedback F036
- Round: R033 (brief stage, pre-render) — after the DMCA-risk review
  that judged the yellow oval nose the strongest remaining Hello Kitty
  marker (the face itself stays untouched per F002)
- Verdict: DIRECTION — the owner steers the nose from yellow to brown
- Scope: the nose FILL only — the pastel card (KittyPortrait) and the
  pastel rig's nose mesh; shape, size, position untouched.
  Deliberately untouched: the star collectible (star #ffd44d — a
  different object, stays yellow), the souls variant (its noseYellow
  key already carries the ember orange #e8913c — a different variant),
  the eyes, whiskers, hoodie red (offered knobs not taken this round).
- Decision: the pastel nose fill #ffd44d -> #a5714b (a warm mid-brown
  that reads clearly brown on the white face and holds against the
  pink card backdrop and the red hoodie).
- User source: "change nose to brownish" (2026-09-15)

## Round R033
- Goal: answer F036 — the pastel nose goes from yellow to brownish.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass
  as cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, F024 paw peek read, F026 card whiskers' length,
  F031/F034 swing (0.34x, alternating), the R031 card head, the souls
  variant untouched.
- Changes: the nose FILL only — the card's ellipse (line: fill
  #ffd44d -> #a5714b) and the rig's nose mesh via the pastel palette
  (noseYellow value #ffd44d -> #a5714b; the key name predates this and
  already lies on the souls side, where it carries the ember orange —
  a rename is refactor debt, out of this round's scope). The star
  collectible (#ffd44d) and the souls embers keep their yellows; the
  card's "ochre nose" comment now says brown and cites F036.
- Before: R031/R032 renders (yellow oval nose).
- After: R033/card-cat.png, R033/card-face-zoom.png, R033/menu.png,
  R033/running-f1.png, R033/cat-f1.png (chromium 1134, dsf 3, same
  probes route).
- Visual inspection: performed — the card nose reads as a small warm
  brown oval, clean against the white face and the pink backdrop; the
  rig nose reads brown in the run frame with the yellow gone; the
  alternating gait is intact; no other face element moved.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  FLAKY — the [desktop] bullet-vignette bloom assert flagged twice this
  round (opacity 0.039 / 0.022, threshold 0.05), continuing the R032
  session pattern (6 fails in a row): the dash fires (nonzero values
  that vary per run) but the fixed 120 ms wall-clock sample lands in
  the early time-dilated ramp. Unrelated subsystem — the only working-
  tree game changes are the two nose fills. Not treated as a code
  signal; documented for the eventual test-timing fix.
- Open question: LIKED/REJECTED per F036. Declared knobs: (1) the brown
  depth (#a5714b — could go lighter/pinker or darker/espresso); (2) the
  DMCA levers not taken: a non-red hoodie, whisker reshape, a mouth
  (F002 conflict); (3) the palette key rename (noseYellow -> a truthful
  name) as refactor debt.

## Feedback F037
- Round: R034 (brief stage, pre-render)
- Verdict: DIRECTION — the rig's round ears go card-consistent
  (not-round), with an explicit softness addendum
- Scope: the pastel rig's ear SILHOUETTE only (earShape construction).
  Deliberately untouched: the card (its pointed ears are the target
  read), the ear base width, position, z-ladder, the ±0.35 outward
  tilt + pose.earL/R wiggle, the souls helm fit (apex stays ~at the
  old height), the outline ink.
- Decision: rebuild earShape as the card's construction — near-straight
  edges with a small rounded tip cap — but deliberately SOFT (the cap
  ~29% of the base width, apex ~0.565 vs the old 0.54 dome), because
  the owner addendum asks not-too-pointy in-game. The owner genuinely
  loved the round in-game ears; consistency with the card's pointed
  read won, and the soft cap keeps some of the roundness they liked.
- User source: "i love the in-game round ears but change it to not
  round to make it consistent" + "maybe don't make it too pointy in
  the in-game character" (2026-09-15)

## Round R034
- Goal: answer F037 — the rig's ears go from round domes to
  card-consistent soft-pointed triangles.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass
  as cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, F024 paw peek read, F026 card whiskers' length,
  F031/F034 swing (0.34x, alternating), the R031 card head, the R033
  nose fill, the souls variant untouched (helm fit reasoned: apex
  0.565 vs old 0.54, ink tip +0.03 — inside the noted 0.02–0.04 layer
  gaps).
- Changes: RIG — earShape rebuilt on the card's construction: two
  near-straight line edges (base ±0.28 -> tip endpoints ±0.08 at
  y 0.5) with a small rounded quadratic tip cap (control 0, 0.565) —
  deliberately SOFT per the owner addendum (cap ~29% of the base
  width, apex ~at the old dome height). Base width, position, z,
  the ±0.35 outward tilt, the pose.earL/R wiggle and the outline ink
  untouched. CARD untouched (its ears are the target read).
- Before: R032/R033 rig renders (round dome ears).
- After: R034/menu.png, R034/running-f1.png, R034/cat-f1.png,
  R034/ear-zoom.png, R034/dash.png, R034/cat-dash.png (chromium 1134,
  dsf 3, same probes route; the ear-zoom is a 3x NEAREST crop of the
  frame-1 top strip).
- Visual inspection: performed — the ears read as soft-pointed
  triangles leaning outward (the straight edges make the rig's ±0.35
  tilt more visible than the dome did), the tips carry the soft cap
  (not needles), the silhouette is slimmer at mid-height (57% of the
  base width vs the dome's ~118%) and matches the card's read; the
  ears join the head cleanly with no ink seam; the brown nose and the
  alternating gait ride unchanged.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  FLAKY — the [desktop] bullet-vignette bloom assert flagged once this
  round (opacity 0.025, threshold 0.05), continuing the R032/R033
  session pattern (7 fails in a row): environmental timing, unrelated
  subsystem, not a code signal.
- Open question: LIKED/REJECTED per F037. Declared knobs: (1) the tip
  softness (the cap could shrink for sharper or grow for rounder);
  (2) the outward tilt (±0.35 — the lean reads stronger on straight
  edges; could ease to ±0.25 for a more upright card-like ear); (3)
  the souls helm fit is reasoned, not rendered — a souls-mode capture
  would confirm it.

## Feedback F038
- Round: R035 (brief stage, pre-render)
- Verdict: DIRECTION — the nose goes orange, with a slight
  transparency
- Scope: the pastel nose FILL + OPACITY on both surfaces — the card's
  ellipse and the rig's nose mesh (material transparent + opacity).
  Shape, size, position untouched. Deliberately untouched: the star
  collectible and the souls embers (both keep their yellows/oranges —
  the souls ember orange #e8913c is coincidentally the same family),
  the eyes, whiskers, ears, hoodie.
- Decision: fill #a5714b -> #f28c3b (a warm mid-orange), opacity 0.8
  ("a bit transparent" — the white head shows through softly; on the
  card via fill-opacity, in the rig via material transparent+opacity).
  The nose reads softer over the white face than the flat brown did.
- User source: "change nose to orange but make it a bit transparent"
  (2026-09-15)

## Round R035
- Goal: answer F038 — the pastel nose goes orange with a slight
  transparency.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass
  as cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, F024 paw peek read, F026 card whiskers' length,
  F031/F034 swing (0.34x, alternating), the R031 card head, the R034
  soft-pointed ears, the souls variant untouched.
- Changes: the nose fill + opacity on both surfaces — the card's
  ellipse (fill #a5714b -> #f28c3b + fillOpacity 0.8, the comment now
  carries the F036->F038 color history) and the rig's nose mesh
  (material transparent + opacity 0.8; the comment cites F038). Shape,
  size, position untouched. The star collectible and the souls embers
  keep their colors (separate palette keys/objects).
- Before: R033/R034 renders (flat brown nose).
- After: R035/card-cat.png, R035/card-face-zoom.png, R035/menu.png,
  R035/dash.png, R035/cat-dash.png (chromium 1134, dsf 3, same probes
  route). The f1 close crop hit the known RGB-split capture glitch and
  the f3 crop caught the cat outside the box — both known capture
  flakes, discarded; the card set and the dash set carry the evidence.
- Visual inspection: performed — the card nose reads as a soft
  apricot-orange (the 0.8 opacity lets the white through, lighter than
  the flat brown ever was), the rig nose reads the same in the clean
  dash frame; the soft-pointed ears, the brown-era silhouette, the
  alternating gait and the whisker fan ride unchanged; no seams or
  z-order artifacts from the new transparency.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  PASS — a fully clean run this round (all six shots, no problems),
  which also breaks the R032–R034 vignette-flake streak and confirms
  its environmental-timing nature.
- Open question: LIKED/REJECTED per F038 (and the still-unverdicted
  R033 brown / R034 ears — the nose verdict applies to the current
  orange state). Declared knobs: (1) the orange depth (#f28c3b —
  could go ember-deep #e8913c or lighter peach); (2) the transparency
  amount (0.8 — lower for ghostlier, higher for flatter); (3) the
  R034 ear knobs (tip softness, outward tilt) stay open.

## Feedback F039
- Round: R036 (brief stage, pre-render)
- Verdict: REJECTED the R034/R035 ear read — the ears look "ugly… like
  a bat right now" — and the direction is set: the tips must point
  OUTWARD (not inward), the overall read "more like a cat"
- Scope: the rig's ear TILT only (the base rotation signs). The
  pointed silhouette (F037 soft cap), the base width, the head
  junction, the wiggle amplitudes, the card (its ears already lean
  outward — the target read), the nose, the gait — untouched.
- Decision: flip the base tilt signs — earL -0.35 -> +0.35, earR
  +0.35 -> -0.35 (the R034 note called ±0.35 an "outward tilt", but
  the rotation math leans the tips INWARD: clockwise on the left ear
  carries the tip toward the head center — the bat read; the flipped
  sign splays the tips outward like the card's). The amount stays 0.35
  (one knob per round: direction first; the ease-to-±0.28 knob stays
  declared for the verdict).
- User source: "the ear looks ugly. it looks like a bat right now.
  make them point not inwards but outwards. make them look more like
  a cat" (2026-09-15)

## Round R036
- Goal: answer F039 — the rig's ear tips lean OUTWARD, the read goes
  cat-like.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass
  as cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, F024 paw peek read, F026 card whiskers' length,
  F031/F034 swing (0.34x, alternating), the R031 card head, the R035
  orange semi-transparent nose, the F037 soft-pointed silhouette, the
  souls variant untouched.
- Changes: RIG — the ear tilt signs flipped at the useFrame site:
  earL -0.35 -> +0.35, earR +0.35 -> -0.35 (the R034 note had called
  ±0.35 an "outward tilt", but the rotation math carried the tips
  INWARD — the owner read the converged pair as bat ears). The amount
  stays 0.35 (one knob per round); the wiggle terms ride unchanged.
  The earShape comment now records the F039 flip. CARD untouched (its
  ears already lean outward — the target read).
- Before: R034/R035 rig renders (tips converged inward — the bat
  read).
- After: R036/menu.png, R036/running-f4.png, R036/cat-f4.png,
  R036/ear-zoom.png, R036/dash.png, R036/cat-dash.png (chromium 1134,
  dsf 3, same probes route). The f1 crop caught the cat outside the
  box (known empty-crop flake) — the f4 and dash frames carry the
  evidence.
- Visual inspection: performed — both ears now splay outward (the
  left tip points up-left, the right up-right) with the soft caps
  keeping them from needles; the pair reads as alert cat ears, the
  bat convergence is gone; the head junction stays clean, the wiggle
  phases hold the outward lean; the orange nose and the gait ride
  unchanged.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  FLAKY — the [desktop] bullet-vignette bloom assert flagged once
  (opacity 0.035, threshold 0.05), the session's environmental-timing
  pattern (R035's clean pass already proved the flake's nature); not a
  code signal.
- Open question: LIKED/REJECTED per F039. Declared knobs: (1) the
  splay amount (0.35 — could ease toward ±0.25 for a more upright
  card-like ear or grow for a wilder cat); (2) the tip softness (the
  F037 cap — sharper or rounder); (3) the apex height (0.565 — taller
  reads alert, shorter reads stubbier).

## Feedback F040
- Round: R037 (brief stage, pre-render)
- Verdict: REJECTED the current nose read — "nose looks brown" (the
  #f28c3b-at-0.8 apricot over the white head muddies toward brown at
  game scale)
- Scope: the pastel nose COLOR/OPACITY on both surfaces. The
  transparency stays (the F038 owner request) but softer: opacity
  0.8 -> 0.85 and the fill deepens to #f57a1f so the effective color
  reads unmistakably orange.
- User source: "nose looks brown" (2026-09-15)

## Feedback F041
- Round: R037 (brief stage, pre-render)
- Verdict: DIRECTION — the rig ears go "a bit more on a round side":
  bigger in width, smaller in height
- Scope: the rig's earShape only (base width, apex height, edge
  curvature, tip-cap size). The outward tilt (F039), the wiggle, the
  base position, the card (its pointed ears stay — F033 liked the
  card), the souls helm fit (apex drops 0.565 -> ~0.46, safely under
  the old dome's 0.54) — untouched.
- Decision: earShape re-blends the F037 pointed construction back
  toward the pre-F037 dome: base ±0.28 -> ±0.34 (width 0.56 -> 0.68),
  apex 0.565 -> 0.46, edges regain a slight quadratic bulge, the tip
  cap widens (~29% -> ~41% of the base width) — pointed-outward but
  noticeably rounder, wider, shorter.
- User source: "maybe make ears a bit more on a round side. bigger on
  width and smaller in height" (2026-09-15)

## Round R037
- Goal: answer F040 + F041 — the nose reads orange (not brown), the
  rig ears go rounder, wider, shorter.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass
  as cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, F024 paw peek read, F026 card whiskers' length,
  F031/F034 swing (0.34x, alternating), the R031 card head, the F039
  outward tilt, the souls variant untouched.
- Changes: NOSE — the fill deepens #f28c3b -> #f57a1f and the opacity
  rises 0.8 -> 0.85 on both surfaces (the card ellipse + the rig
  material; the rig comment cites F040; transparency stays per F038).
  EARS (RIG ONLY) — earShape re-blended toward the pre-F037 dome:
  base ±0.28 -> ±0.34 (width 0.56 -> 0.68), apex 0.565 -> 0.46, the
  edges regain a slight quadratic bulge, the tip cap widens (~29% ->
  ~41% of the base width); the outward tilt (F039) and the wiggle
  ride unchanged; the earShape comment now carries the
  F037/F039/F041 history. CARD untouched (its pointed ears stay —
  F033 liked the card; the rig earns its own rounder character).
- Before: R036 rig renders (tall narrow pointed ears; the apricot
  nose).
- After: R037/card-cat.png, R037/card-face-zoom.png, R037/menu.png,
  R037/running-f1.png, R037/dash.png, R037/cat-f1.png,
  R037/cat-dash.png (chromium 1134, dsf 3, same probes route).
- Visual inspection: performed — the nose reads unmistakably orange
  on both surfaces (the apricot-to-brown muddiness is gone); the ears
  are wider and shorter with soft blunt tips and a slight edge bulge —
  a rounded-outward cat read, no bat convergence; the f1 frame caught
  the rig mid-blink (eyes as thin lines — the rig's life) with the
  ears and nose reading cleanly; the dash pose holds the round-side
  ears and the orange nose.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  PASS — a fully clean run (all six shots, no problems), the second
  clean pass this session.
- Open question: LIKED/REJECTED per F040 + F041. Declared knobs: (1)
  the ear roundness dial (the current shape sits between the F037
  point and the pre-F037 dome — could slide either way); (2) the
  apex/width amounts (0.46 / 0.68); (3) the nose saturation (#f57a1f)
  and opacity (0.85); (4) the card's ears could follow the rig's
  rounder read if the divergence bothers (F033's liked state would
  move).

## Feedback F042
- Round: R038 (brief stage, pre-render)
- Verdict: DIRECTION — the nose goes 30% more transparent
- Scope: the pastel nose OPACITY on both surfaces (the fill #f57a1f
  stays). "30% more transparent" read as opacity × 0.7: 0.85 -> 0.6 —
  the see-through softening is the intent; the alternative readings
  (0.55 subtractive / 0.8 transparency×1.3) stay declared knobs.
- User source: "make nose 30% more transparent" (2026-09-15)

## Feedback F043
- Round: R038 (brief stage, pre-render)
- Verdict: REJECTED the R037 ear read — "ears look like headphone or
  something. and it is round. i maybe want roundish. but not round"
  (the wide low cups read as headphones; the owner steers BETWEEN the
  R037 round-wide and the F037 point: roundish, not round)
- Scope: the rig's earShape only (base width back 0.68 -> 0.60, apex
  up 0.46 -> 0.50, the tip cap back ~41% -> ~33% of the base width,
  the edges keep only a hint of curve). The outward tilt (F039), the
  wiggle, the base position, the card (its pointed ears stay), the
  souls helm fit (apex 0.50 — still under the pre-F037 dome's 0.54) —
  untouched.
- User source: "the ears shouldn't resemble headphones… they are
  round; I might prefer them roundish rather than round. They
  shouldn't be round" (2026-09-15)

## Feedback F044
- Round: R038 (brief stage, pre-render)
- Verdict: DIRECTION — the pastel paws move farther outside the
  torso; the pressed-to-center arms make the hoodie "look like it is
  wearing a t-shirt"
- Scope: the PASTEL arm mount x only (±0.62 -> ±0.70, a per-branch
  split so the souls knight's shared mount stays at ±0.62 — souls
  untouched). The swing amplitudes (F031/F034 0.34x alternating),
  the pivot y, the arm silhouette, the sleeve, the pocket interaction
  (a passing paw dips behind the pocket's edge) — watched in the
  render, not pre-tuned.
- User source: "the cat's hands should be positioned farther outward
  from its torso. Currently, because the hands sit closer to the
  center than to the outside, it looks as though the cat is wearing a
  T-shirt" (2026-09-15)

## Round R038
- Goal: answer F042 + F043 + F044 — a more transparent nose, roundish-
  not-round ears, paws farther outside the torso.
- Preserved preferences: F002 (face untouched — NO mouth), F004 (mass
  as cloth), F006 (floating energy), F008 (senior-minimal flat fills),
  F017 (hoodie), F018/F019 (ears + whiskers clear), F022 (card barrel +
  neck-width hood), F023's one-piece read, hood DOWN, palette keys,
  RESTRICTED z-ladder, F024 paw peek read, F026 card whiskers' length,
  F031/F034 swing (0.34x, alternating), the R031 card head, the F039
  outward tilt, the F040 nose saturation, the souls variant untouched
  (its shared arm mount stays at ±0.62).
- Changes: NOSE — opacity 0.85 -> 0.6 on both surfaces (the card
  fillOpacity + the rig material; "30% more transparent" read as
  opacity × 0.7; the rig comment carries the F038->F042 history).
  EARS (RIG ONLY) — earShape lands between the F037 point and the
  F041 cup: base ±0.34 -> ±0.30 (width 0.68 -> 0.60), apex 0.46 ->
  0.50, the tip cap ~41% -> ~33% of the base width, only a hint of
  edge curve; the earShape comment now carries the full
  F037/F039/F041/F043 history. ARMS (PASTEL ONLY) — the mount x
  splits per branch: ±0.62 -> ±0.70 (the souls knight keeps ±0.62);
  the swing, pivot y, silhouette untouched.
- Before: R037 renders (0.85-apricot nose; the headphone-cup ears;
  the paws pressed toward the torso center).
- After: R038/card-cat.png, R038/card-face-zoom.png, R038/menu.png,
  R038/running-f4.png, R038/dash.png, R038/cat-f4.png,
  R038/cat-dash.png (chromium 1134, dsf 3, same probes route). The f1
  crop caught the cat outside the box (known empty-crop flake) — the
  f4 and dash frames carry the evidence.
- Visual inspection: performed — the nose reads as a soft peach
  (clearly more transparent) on both surfaces; the ears are
  roundish-not-round (narrower, slightly taller, soft blunt tips, no
  headphone cups); the paws sit at the hoodie's outer edges — the
  loose-hoodie read replaces the pressed T-shirt read; no floating
  shoulder lumps from the mount move; the swing keeps the alternating
  gait.
- Code verification: `npm --prefix portfolio run typecheck` PASS;
  kitty-run.check.ts PASS; kitty-run.sim.ts PASS; kitty-run.shots.mjs
  PASS — a fully clean run (all six shots, no problems), the third
  clean pass this session.
- Open question: LIKED/REJECTED per F042/F043/F044. Declared knobs:
  (1) the transparency reading (0.6 multiplicative vs 0.55
  subtractive vs 0.8 transparency×1.3); (2) the ear dial (base 0.60 /
  apex 0.50 / cap 33% — could slide toward the point or the cup);
  (3) the paw offset (±0.70 — could push to ±0.75 or pull back to
  ±0.66); (4) the card's paws/ears stay at the liked states.
