# Passes — kitty-run DMCA redesign (card mark, select portrait, in-game cat)

Task: redesign the pastel cat identity across three surfaces (landing-card
mark, character-select portrait, in-game playable cat) to reduce
Hello Kitty / Sanrio IP risk while preserving the current form, silhouette,
and charm. The ashen knight is out of scope (already distinct).

Delegation: chat model (no repo access) produces drop-in code; this agent
integrates, verifies, and records. Owner protocol applies: full design/code
autonomy for the chat model, with a shown deep-reasoning chain
(restate → 5+ directions → prune → develop → stress-test → rank → commit).

## Baseline (2026-09-13)

- `npm --prefix portfolio run typecheck` — PASS (clean).
- `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts` — PASS (all checks).
- Surfaces in scope:
  - `portfolio/shell/src/shell/ProjectArtwork.tsx` — `KittyCenterMark` (card mark, viewBox 260×160).
  - `portfolio/projects/kitty-run/web/CharacterPortraits.tsx` — `KittyPortrait` (select poster, viewBox 100×100).
  - `portfolio/projects/kitty-run/web/kitty/Kitty.tsx` — pastel branch of the playable rig (+ `lib/palette.ts` keys shared with the souls theme).
- Stale handoff h3 (ashen skyline) acknowledged but unclosed — belongs to the
  ashen direction, not this task; left alone per STATE.md.

## Pass C001 — VERIFIED (code scope) / visual NOT RUN

- Objective and scope: replace the two flat SVG cat surfaces (landing-card
  mark, character-select portrait) with the "Pop Kitty" differentiators —
  star hairclip replaces the ear bow, small w-mouth added (Sanrio's cat has
  none), white catchlight specks in the eyes, red accent nose — while keeping
  the existing silhouette geometry (wide head, buried ear bases, card
  composition, poster bust) untouched.
- Acceptance criteria: tsc clean; kitty-run node checks pass; ids
  gem-cat-dense/sparse/halo/head-clip preserved; exactly one `.gem-halo`
  ellipse with `style={haloVar(0.12)}`; no imports/props added; portrait
  keeps the OUTLINE_PASTEL stroke convention and hardcoded colours.
- Changes:
  - `portfolio/shell/src/shell/ProjectArtwork.tsx` — `KittyCenterMark`
    rewritten: cream head `#fff6ee` with pink shadow step `#f1b9c5`, dense
    dot pattern recoloured to the accent `#e94f64`, star clip polygon on the
    right ear (bow removed), w-mouth path, catchlights, accent nose.
  - `portfolio/projects/kitty-run/web/CharacterPortraits.tsx` —
    `KittyPortrait`: bow paths replaced by a star clip polygon
    (`stroke="none"`), yellow nose → `#e94f64`, catchlight specks, small
    w-mouth at strokeWidth 2.
- Delegation note: chat-model reply arrived as a props/imports component
  with gradient-mask shading and non-reserved ids; salvaged the character
  design (features, palette, star geometry) and re-laid it onto the repo's
  existing geometry and contracts. The reply's radial-gradient fade mask was
  dropped (violates the flat halftone family); stepped tone fill kept.
- Baseline: tsc clean, node checks pass (see baseline section above).
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS (exit 0, no output).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Command: landing-card screenshot via puppeteer-core
    Result: NOT RUN — no Chrome/Chromium/Edge binary exists on this machine
    (mdfind/ls found none); shot script exited "no chrome" and was removed.
- Final diff review: diff inspected — only the two functions changed; no
  debug scaffolding, no secrets, no unrelated edits.
- Design constraints: not applicable (no design-iteration ledger for this
  task yet; visual acceptance belongs to a design-iteration round).
- Remaining risks/blockers: visual check of both surfaces pending (owner or
  a machine with a browser); star-clip placement on the card ear apex is
  hand-computed and unviewed; the card's dense-dot hue moved #ff8fbf →
  #e94f64 (deeper rose-red) — hover/wash CSS keys off `--project-accent`,
  not the pattern fill, so no CSS coupling expected.
- Next action: part 2 — brief the in-game rig (Kitty.tsx pastel branch) from
  the Pop Kitty design language; visual round after that.

## Pass C002 — VERIFIED (code scope) / visual NOT RUN

- Objective and scope: apply the Pop Kitty language to the in-game rig's
  pastel branch (star clip replaces bow, red accent nose, "w" mouth, white
  catchlights, warm cream base coat) without touching the souls branch,
  silhouette geometry, or rig.ts.
- Acceptance criteria: tsc clean; node checks pass; palette keys unchanged
  (only `kittyWhite` value changed); `bowRef`/`eyeLRef`/`eyeRRef` refs and
  pose contract intact; new z values with stated clearance; souls branch
  byte-identical.
- Changes:
  - `web/kitty/Kitty.tsx` — added `starShape()` (5-point, outer 0.2 /
    inner 0.09) and `mouthWShape()` (two shallow arcs, hw 0.18, dip 0.11,
    thickness 0.05); geo entries `star`, `mouth`, `catchlight`; face block:
    catchlights parented INSIDE eye meshes (blink squash propagates), nose
    `noseYellow` → `bowRed`, mouth at [0, -0.32, 0.255] (0.035 above head
    fill 0.22, no xy overlap with nose z 0.27); bow group replaced by a
    single star `Part` (outline 1.2) keeping `ref={bowRef}` and its
    position, so bowRot/bowScale animation carries over.
  - `web/lib/palette.ts` — `kittyWhite` `#ffffff` → `#fff6ee` (warm cream,
    matches card art; knight palette unaffected — it overrides every key).
- Delegation note: chat-model reply (normal model, full brief) arrived
  contract-clean; integrated verbatim with formatting adapted to the file's
  prettier style. Rationale from the reply: star stays in the bow group
  (ear-nesting would couple it to ear-flap and lose dash/happy pulse);
  catchlights enlarged to r 0.035 for the ~55px head; mouth thicker than
  whisker gauge on purpose.
- Baseline: tsc clean, node checks pass (C001).
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS (exit 0).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Visual (in-game render): NOT RUN — no browser binary on this machine
    (C001 finding); rig z-ladder reasoned through but unviewed.
- Final diff review: `git diff --stat` shows only the four task files
  (+ unrelated explosion graph line from another agent, untouched). Souls
  branch untouched; `bowLoop`/`bowKnot` geo entries now unused but retained
  to keep the diff minimal (harmless; candidate for a cleanup pass).
- Design constraints: not applicable.
- Remaining risks/blockers: visual acceptance of all three surfaces pending
  (owner device check or design-iteration round); star sits at the old bow
  anchor floating beside the ear rather than ON it — unviewed, may want a
  nudge in the visual round.
- Next action: task code-complete; deliver (commit+push), record graph
  node, hand visual round to the owner / design-iteration.

## Pass C003 — VERIFIED (code scope) / visual NOT RUN

- Objective and scope: owner steered from Pop Kitty ("fine but is not it")
  to variant #2 Pixel Kitty. Re-skin all three surfaces: card mark → 12×10
  pixel grid with CRT scanlines and a bell; portrait → stepped pixel head,
  square eyes, pixel bell; rig → bell, pixel mouth, square catchlights,
  purple/lavender palette.
- Acceptance criteria: tsc clean; node checks pass; ids and halo hook
  preserved; palette keys unchanged (values only); souls theme untouched;
  ghost echo retint keeps working.
- Changes:
  - `ProjectArtwork.tsx` — `KittyCenterMark` fully pixel: 6px-cell rect
    grid (ink/fill/accent/shadow layers), blocky ghost echo, CRT scanlines
    clipped to the head box, bell pendant below the chin, gold accent.
    `gem-cat-head-clip` is now a rect (was ellipse).
  - `CharacterPortraits.tsx` — `KittyPortrait`: stepped H/V-segment head,
    rect ears with inner accents, pixel bell on the right ear, square eyes
    + square catchlights, gold square nose, two-bar pixel mouth; lavender
    shirt + purple pinafore.
  - `lib/palette.ts` — pastel values → pixel palette (kittyWhite #f7e8ff,
    ink #2a1b3d, accent #ffd23f + deep #d4a020, cloth #9a6fbf + deep
    #7b50a0, cheek #d4b8e8). Knight theme overrides every key, unaffected.
  - `web/kitty/Kitty.tsx` — `starShape`/`mouthWShape` replaced by
    `bellShape` (rounded-rect body 0.7×0.5 + clapper nub, enlarged per the
    reply's own risk callout) and `mouthPixelShape` (two 0.8-wide bars,
    0.4 gap — mitigated size); catchlight geometry → 0.35 square, moved to
    the eye's upper-right; nose back to `noseYellow` (== accent now); bell
    hangs in the `bowRef` group (inherits bob+pulse).
  - `web/scene/Echo.tsx` — ghost retint map fixed for palette collisions:
    noseYellow == bowRed and eyeInk == outlineInk now share hexes, so the
    duplicate computed keys were dropped (bowRed/outlineInk lines cover
    all four roles). tsc caught this (TS1117 ×2) — repair pass included.
- Delegation note: normal chat model, brief `BRIEF-kitty-dmca-pixel.md`
  (full self-contained); reply arrived complete despite the timeout — both
  SVGs integrated verbatim (formatting adapted), rig delta applied
  mechanically per its spec with the mitigated sizes it recommended.
- Baseline: tsc clean, node checks pass (C002 state).
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS after repairs (failed 3× mid-pass: leftover `star` geo
    entry referencing deleted `starShape`; then Echo duplicate keys from
    the palette collisions — each fixed, rerun clean).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Visual: NOT RUN — no browser binary on this machine.
- Final diff review: only the five task files + brief; other agents'
  graph lines excluded from the commit.
- Design constraints: not applicable.
- Remaining risks/blockers: visual acceptance pending (owner look); the
  card's scanline clip rect is static while the breathe bob is CSS-level —
  per the reply's integrator note, verify the clip tracks the subject
  (subject is NOT in an animated group — the breathe moves the whole svg,
  so the clip moves with it; low risk); unused `bowLoop`/`bowKnot` geo
  entries still retained.
- Next action: owner visual round on all three surfaces; rollback to Pop
  Kitty or Hello-Kitty-era states is trivial via git (7b951df / pre-C001).

## Pass C004 — VERIFIED (rollback)

- Objective and scope: owner verdict on Pixel Kitty — **"this is too
  ugly"**. Direction rejected; roll all three surfaces back to the Pop
  Kitty state (commit `7b951df`) via git revert of the pixel commit.
- Changes: revert commit `26f896b` (reverts `dcd8c0f` — card mark,
  portrait, rig, palette, Echo fix all restored to Pop Kitty). The C003
  pass record and the pixel brief stay in history deliberately: the
  iteration ledger is append-only and the rejected direction's evidence
  must survive.
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS (exit 0).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Working-tree spot checks: `star hairclip`/`starShape` present,
    `kittyWhite: "#fff6ee"`, `pop-ink` card comment present — Pop Kitty
    state confirmed on all three surfaces.
- Delivery: pushed `26f896b` to origin/main. Other agents' graph lines
  (explosion/planck/raft-cluster) were stashed during the revert and
  restored after — not committed by this task.
- Remaining risks/blockers: none for the rollback. Design task remains
  open: owner has now rejected Pixel (too ugly) and parked Pop ("fine
  but is not it"); remaining unexplored variants from the five-way round:
  Void Kitty #1, Wire Kitty #4, Fold Kitty #5.
- Next action: owner picks the next direction (another variant, a new
  round, or accept Pop Kitty as the resting state).

## Pass C005 — VERIFIED (code scope) / visual NOT RUN

- Objective and scope: second pixel attempt from a stronger relay model —
  an ASCII-authored 12×10 sprite rig (chunky ink outline, lavender fill,
  bell collar replacing the bow, single-cell eyes/mouth, no whiskers).
  Apply to the card mark and the portrait only; the in-game rig stays
  Pop Kitty pending owner approval of this direction.
- Acceptance criteria: tsc clean; node checks pass; ids + halo hook
  preserved; no props/imports; aria-hidden kept; family composition
  (backdrop, halo, dashes, ground, trail, ghost echo) retained.
- Changes:
  - `ProjectArtwork.tsx` — module-scope `PIXEL_CAT_GRID`/`PIXEL_CAT_SWATCH`
    + `rasterizePixelCat()`; `KittyCenterMark` renders the sprite at cell
    11 (ox 64, oy 25) with crispEdges on the cells group only; gold dense
    dots (trail/echo/halo), purple sparse field; blocky 3-rect ghost echo;
    white pixel catchlights in the eyes; bell highlight + clapper; crown
    glint. Halo stays a dot-pattern ellipse with `style={haloVar(0.12)}`
    (the reply's radialGradient dropped — outside the flat family).
  - `CharacterPortraits.tsx` — same grid at cell 8 (ox 2, oy 10); svg
    stroke attrs kept but overridden to `stroke="none"` on the pixel group
    (stroking every cell would outline each pixel); catchlights + bell
    details as small rects.
- Delegation note: reply arrived as a props/exports component with local
  haloVar redefinition, svg title/aria-label, and a hex-grid rig delta
  (contradicts pixel identity — discarded). Salvaged: the ASCII rig, the
  bell collar, the palette, crispEdges discipline.
- Baseline: Pop Kitty state (post-revert C004), checks green.
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS (exit 0).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Visual: NOT RUN — no browser binary on this machine.
- Final diff review: only the two surface files; rig and palette untouched.
- Design constraints: not applicable.
- Remaining risks/blockers: owner visual verdict pending — this is the
  direction test; if approved, a follow-up pass re-skins the in-game rig
  (bell on bowRef, pixel mouth, square catchlights — the C003 rig work is
  recoverable from git dcd8c0f as reference). Known surface mismatch:
  card/portrait are pixel, the playable cat is still Pop Kitty until then.
- Next action: owner look at the landing card + select portrait.

## Pass C006 — VERIFIED (code scope) / visual NOT RUN

- Objective and scope: owner verdicts — pixel v2 "bad too"; direction is
  now "improve on Pop Kitty": less girly, kill the cutesy eyes,
  senior-developer minimalism. Relay model (Claude Opus) delivered a
  "dry-ink" evolution: slit eyes (flat 4.4w bars), bar nose, squared jaw
  with angled ear tips, brass star clip, whiskers cut to two per side,
  blush/lashes deleted, two-density halftone shading.
- Acceptance criteria: tsc clean; node checks pass; ids + halo hook
  preserved; no props; aria-hidden kept; silhouette familiarity retained
  (big head, star clip, w-mouth survive).
- Changes:
  - `ProjectArtwork.tsx` — `KittyCenterMark` rewritten to the dry-ink
    language: single-path head (squared jaw, angled ears), two-density
    dot shading clipped inside the head (dense jaw + right-cheek shadow
    instead of even wash), slit eyes, bar nose, w-mouth kept, 2+2
    whiskers, brass `#b9994f` star on the left ear. Halo restored to the
    dot-pattern ellipse with `style={haloVar(0.12)}` (reply used a
    radialGradient + scaled rx/ry by haloVar — both contract violations
    repaired; the halo hook must stay a CSS-var breathe, not geometry).
  - `CharacterPortraits.tsx` — `KittyPortrait` same language in pure
    outline-poster form (head path, slit eyes, bar nose, w-mouth, dry
    whiskers, star filled brass, stroke none on fill).
- Delegation note: minimal brief v2 (752 chars) to the randomized-routing
  tier; reply came contract-dirty (props, role="img", gradient halo,
  haloVar-as-multiplier) but design-strong — salvaged the character,
  repaired the contracts.
- Baseline: Pop Kitty (post-C004 revert), checks green.
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS (exit 0).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Visual: NOT RUN — no browser binary on this machine.
- Final diff review: two surface files only; rig + palette untouched —
  in-game cat still wears the Pop Kitty star until the direction is
  approved.
- Design constraints: not applicable.
- Remaining risks/blockers: owner visual verdict on the dry-ink read;
  if approved, next pass re-skins the rig (slit eyes, bar nose, brass
  star, squared proportions) from the reply's hex set (shell #efe6d7,
  dot #cbbda9, brass #b9994f).
- Next action: owner look at card + portrait.

## Pass C008 — VERIFIED (rollback)

- Objective and scope: owner verdict on the dry-ink tom — **"ugly, looks
  like a homeless alcoholic cat"**. Direction rejected; revert both the
  feature commit (`5327966`) and its pass record (`c5b8dc7`).
- Changes: revert commits `a8bd945` + `12689ef`. Working tree back to the
  dry-ink v1 state (C006: slit eyes, bar nose, squared jaw, brass star).
  Graph conflict from a parallel stash resolved by keeping the full
  append-only chain (n96–n100) — rejected directions stay in history.
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS (exit 0).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Spot checks: slit/brass/dry-ink v1 markers present in ProjectArtwork;
    `kittyWhite: "#fff6ee"` unchanged.
- Delivery: pushed `0e2294f` to origin/main.
- Lessons for the next round: "character" via damage/asymmetry (nicked
  ear, scar, squint) reads as scruffy, not charming — the owner wants
  personality without dishevelment. Slit eyes + squared jaw (C006) were
  the accepted core. Next attempts should add character through
  *confidence* (posture, gaze direction, one crisp signature detail) not
  through wear/damage.
- Next action: owner steers — new round on top of dry-ink v1, or accept
  it as the resting state.

## Pass C010 — VERIFIED (code scope) / visual NOT RUN

- Objective and scope: owner verdict on tiger-bright — "childish, don't
  like open mouth; tiger bright was metaphorical". New target: "badass
  like ashen but of a lighter world" (calm-confident wanderer, not
  grimdark, not cute). Delegated to the normal chat model with the full
  7-verdict history; reply chose "Highland Squint + Ronin": silver-blue
  mist coat, narrow amber almond squint eyes (the whole attitude), amber
  trailing scarf (the one accessory). Applied to all three surfaces.
- Acceptance criteria: tsc clean; node checks pass; ids + halo hook
  preserved; card family (dark plate, dashes, ground, trail, echo)
  retained; portrait stroke convention kept; palette keys unchanged.
- Changes:
  - `ProjectArtwork.tsx` — `KittyCenterMark` rewritten: silver-blue
    dot-filled subject (dense pattern as the fill itself), amber slit
    eyes, angular amber nose, scarf trail + knot, angled-back ears,
    running legs, amber halo, sparse silver backdrop. Note: the card's
    subject is now pattern-filled (not solid) — a deliberate read change
    from the reply, kept.
  - `CharacterPortraits.tsx` — `KittyPortrait`: silver-blue head/body,
    amber almond eyes, rose angular nose, minimal mouth dash, scarf knot
    + wind trail, inner ears.
  - `web/kitty/Kitty.tsx` — `squintEyeShape()` (narrow horizontal almond,
    flat amber, no pupil, no catchlight — the brief's "avoid at 55px"
    honoured); `scarfShape()` pennant trailing to -x with ink outline;
    `scarfRef` + wind model in useFrame (same sway/lift/dash family as
    the souls cape, softer); scarf hung at [-0.3, 0.86] z -0.06 behind
    the dress; stripes/mouth/catchlights removed from the pastel face.
  - `web/lib/palette.ts` — full pastel re-skin per the reply's table:
    kittyWhite #c0cdda, outlineInk #2c3240, bowRed #c89850 (amber),
    bowDeep #a07830, suitPink #8b9e94 (sage), suitDeep #60766c,
    noseYellow #c49898 (dusty rose), cheek #b8a8a8, eyeInk #c89850.
- Delegation note: reply arrived contract-clean for both SVGs (kept the
  dark plate, ids, halo hook, aria-hidden, no props/imports/text/
  gradients). Integrated near-verbatim; the rig delta was applied
  mechanically per its spec (almond eye geometry + amber eyeInk), with
  the scarf promoted from spec-note to a rigged, wind-animated part
  (the reply asked for "one geometry note" — a static scarf would have
  read as a decal).
- Baseline: dry-ink v1 (post-C009 revert), checks green.
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS after one repair (leftover `geo.stripe` entry referencing
    the deleted `stripeShape` — removed, rerun clean).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Visual: NOT RUN — no browser binary on this machine.
- Final diff review: four task files + brief; other agents' work excluded.
- Design constraints: not applicable.
- Remaining risks/blockers: owner visual verdict. Known surface tension:
  the card subject is dot-pattern-filled while the portrait/rig are solid
  fills — deliberate (halftone family) but worth an owner look; the rig
  scarf is new geometry (unviewed) — its pivot [-0.3, 0.86] and z -0.06
  were reasoned, not seen.
- Next action: owner look at card + portrait + in-game run.

## Pass C011 — VERIFIED (rollback)

- Objective and scope: owner verdict on highland squint — **"dead cat
  game, visuals look very low effort"**. Direction rejected; owner also
  withdrew design trust from that relay model. Rolled ALL surfaces back
  to the full Pop Kitty state (`7b951df` files restored verbatim: card
  mark, portrait, rig, palette) — the last state the owner called
  "fine".
- Changes: reverts `f6db012`/`a8bd945`(highland) + file restore from
  `7b951df` (cleared tiger-bright remnants the partial reverts had left
  in the rig: stripes, singing mouth, ember palette).
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS (0 errors).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Spot checks: `pop-ink cat` card comment, `star clip`, `bowRed
    #e94f64` all present.
- Delivery: pushed `f70adf2`.
- Verdict history now (for the next brief): HK-clone ✗(DMCA) → Pop Kitty
  ◐"fine but not it" → Pixel ✗"too ugly" → Pixel v2 ✗"bad too" → dry-ink
  v1 ◐"good but not quite, lacks character" → tom ✗"homeless alcoholic"
  → tiger-bright ✗"childish" → highland squint ✗"dead cat, low effort".
  The accepted core so far: Pop Kitty's soft warm geometry + dry-ink's
  minimal confidence. Eight directions tried; the owner is now steering
  to the randomized-routing tier with an obfuscated task framing.
- Next action: randomized-model round (owner-led prompt design).

## Pass C012 — VERIFIED (code scope) / visual NOT RUN

- Objective and scope: randomized-tier round via the spec-framing prompt
  (SPEC-9K4). Reply came from GPT-6-Astra: a full skeleton-rig wanderer
  (joints, limbs, cloak, lowered blade, pack, bedroll) on a light paper
  card with serif/mono typography. Owner framing: "must be the best".
- Salvage decisions: the reply's STANDING figure with a sword breaks the
  runner read and its paper card breaks the dark-plate family; its
  <text> marginalia, linearGradient sky, props/exports, and local
  haloVar are hard-forbidden. Salvaged the PAYLOAD: palette (paper
  #efe5ce, ink #1f2e2d, mist/rock #80958c, pine #435c53, sun #d4ad67,
  leather #806650) and the adult attitude (narrow level eyes, neutral
  mouth, functional leather accessory, no cuteness devices).
- Changes:
  - `ProjectArtwork.tsx` — `KittyCenterMark`: paper-shell head on the
    loved silhouette, dense-jaw halftone, sun-gold level eye lines,
    angular ink nose + neutral mouth line, thick even ink whiskers,
    leather travel scarf trailing left with a sun-gold pin. Family kept:
    dark plate, sparse mist backdrop, sun-gold halo hook, dashes, ground,
    trail, head-only echo.
  - `CharacterPortraits.tsx` — `KittyPortrait`: same language in the
    outline-poster bust — paper shirt, leather scarf band + gold pin,
    gold eye lines, angular nose, neutral mouth, 2 thick whiskers/side.
- Rig: NOT changed this pass — awaiting owner verdict on the direction
  (the reply's rig hexes recorded: base #efe5ce, ink #1f2e2d, accent
  #d4ad67, cloth #806650, nose #1f2e2d, eye #d4ad67).
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS (0 errors).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Visual: NOT RUN — no browser binary on this machine.
- Final diff review: two surface files only.
- Remaining risks/blockers: owner visual verdict; the level-gaze +
  leather-scarf combo is untested against the "childish"/"scruffy" traps
  (it sits deliberately between dry-ink v1 and highland squint).
- Next action: owner look at card + portrait; rig follows the verdict.
