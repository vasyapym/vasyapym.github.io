# HANDOFF — Ashen live refinement (next session)

Written at the close of the grilling session that rejected the gallery-still
refinement round and moved the work in-game. Read top to bottom: state, the
grill verdict, the character facts (the law), then the round record.

## Where things stand (all pushed to origin/main)

- **b452f37** — the audio bugfix is committed and pushed: `.kitty-run-mute`
  reserves its widest label (`min-width: calc(9ch + 0.5em)`, `box-sizing:
  content-box`, `text-align: center` — the global `* { box-sizing: border-box }`
  in `portfolio/shell/src/styles.css:37` would otherwise wrap the 9-char label),
  and `styles.css` html rule gains `scrollbar-gutter: stable`. Owner accepted
  without eyes-on ("suppose it fixed"); if the shift persists, the fallback
  scope is `height: 100dvh; overflow-y: auto` on the page container.
  **Owner reported the shift persists (Sep 6). Instrumented re-verification
  (Sep 6, `tests/kitty-run.audiobug.mjs`): NOT reproducible — both themes
  (pastel + souls, headless and headed), desktop + mobile, dev server AND the
  live deployed site: zero geometry deltas in any click window, zero browser
  events (scroll/resize) in screenshot-free windows, no canvas jump spikes
  (interval pixel-diff), header strips byte-identical. The live bundle
  (`KittyRunPage-Ch624xUk.css`) verified to carry both b452f37 rules. The only
  visible click consequence is the button's own hover ember recolour
  (colour-only, no movement). Open question back to the owner: does it still
  shift after a hard reload (Cmd+Shift+R), on dev or live, and if yes —
  which browser, macOS scrollbar setting, zoom level?
  **RESOLVED (Sep 6, owner answered: Safari macOS + iOS, ashen only). The
  bug was never layout — it was the WebGL drawing buffer. Chromium probes
  could never see it; a Playwright WebKit (Safari 18.2 engine) probe
  reproduced it immediately: every header click that re-rendered the page
  (mute/mix — NOT a bare focus click on the title) disturbed the canvas
  backing for one frame — click-frame canvas delta 4.0-5.4 vs baseline 0.16
  — and the distance-driven world (ground edge, city silhouettes) read as
  having jumped. Sim was innocent (distance frozen across the spike frame;
  dt already clamped). Fix a46eb0f: (1) the canvas subtree is React.memo'd
  on stable props and never re-renders for header state — `muted` reaches
  GameLoop through a ref (`mutedRef`, the characterRef pattern); (2) the
  R3F renderer config (`gl`/`dpr`/`camera`/`onCreated`) is hoisted to
  module scope so re-renders can never re-apply it; (3) the sim step
  ceiling tightened 0.05→0.025s so a hitched frame can never carry more
  than ~1.5 normal steps. Post-fix WebKit probe: all click deltas 0.23-0.25
  (baseline noise); Chromium gates clean; ?preserve is a dev handle that
  lets a probe diff the buffer per rAF. WebKit gate committed as
  tests/kitty-run.webkit-shift.mjs (skips when playwright/webkit absent).
- **The ashen refinement section is REMOVED** from the gallery: the two
  "improved take" stills (Vigil of the Pale Cat / Ember-Crowned Ascendant) and
  the earlier three micro-delta stills were all rejected. The section wiring is
  gone from `ArtDirections.tsx`; `ashenRefinements.tsx` deleted; `AshenCard` is
  non-exported again. `portfolio/shell` typechecks green. The rejected stills
  live only in this handoff's git history (deleted file) — their WORLD values
  are the starting palette for the live pass (below).
- Gallery state on /art-directions = origin/main: ashen nine-directions round
  + kitty portrait round + the card-artwork rounds. Nothing of mine remains.

## This round (implemented, awaiting the owner's eyes)

All three picks are in-game, one commit each, gates green at every step
(typecheck + check 50/50 + sim). Verification = owner's eyes on
/projects/kitty-run (dev server :5173 was already running).

1. **e858b66 — depth.** `castleFar` #8a929f→#a7aeb8 (bone-mist),
   `castleNear` #323b49→#2a3140 (deep slate); ladder ≈0.68→0.41→0.19. Two
   static cool haze banks (`hazeTexture` in textures.ts, colour = souls
   `skyMid` #78889f) between the city layers at z −10 (opacity 0.42) and z −8
   (0.36), rendered through the transparent pass's back-to-front z sort.
   `hillFar`/`hillNear` turned out to be dead keys in souls (pastel backdrop
   only) — untouched. Fog was rejected on purpose: it would wash the sky plane
   and the knight.
2. **fd977b5 — type.** Ritual prompts (rise/rest/begin/go on/rekindle) in calm
   Georgia serif, bone #e6dfd1, 0.3em tracking, 1.6s fade (action +0.3s);
   YOU DIED's exhale settles at 0.3em; the one ember accent is the 2px #e8863c
   rule under the kicker (not under YOU DIED — its red is the statement).
   Kicker moved ember→bone per the "one ember accent" reading; reduced-motion
   kills the fades (block appended last for source order).
3. **d4394c6 — light.** Delegated in two chat-model briefs, integrated here.
   Castle silhouettes (far/mid only; near stays matte for its ember windows)
   gain a hard warm rim: full silhouette repainted on a scratch canvas in
   `cloudLit` #e8a878, self-erased shifted (−3, +2) leaving right 3px / top
   2px slivers, stamped `source-atop` at **0.7 alpha** (integrator temper —
   full strength read as sticker edges). Crate lids: warm band (alpha 0.32→0,
   top 26%) via `crateTexture(p, { lid })`, wired through a per-theme
   `CRATE_LID` record in Obstacles. Knight's right contour: two opaque
   back-plate fringes (`cloudLit`, no transparency) — tunic plate reusing
   `geo.dress` offset +0.08 at z −0.15, dome plate `helmDomeShape(0.05)`
   offset +0.07 at head-local z **0.08** (the brief's 0.15 was coplanar with
   the ear fills — integrator z-fix; 0.04 gap under the ear inks). Ghost rim
   joins Echo's FADED map as #c9a284 (unmapped, the fringe would glow on the
   faded ghost). Ground lit edge regraded `groundDot` #d98a4e→#7a6a5d (lit
   stone, not a full-width ember line).
   Rollback: `git revert d4394c6` (or per-file, e.g. Kitty.tsx alone for the
   knight fringe).

Tuning knobs if the owner wants adjustments: haze opacity (0.42/0.36 in
textures.ts BACKDROPS souls haze), rim stamp alpha (0.7 in castleTexture),
fringe offsets (0.08 tunic / 0.07+0.05 pad dome in Kitty.tsx), ground edge
(#7a6a5d in theme.ts).

## The grill verdict (owner, previous session)

1. Remove the refinement section; **implement the refinements in the live game**,
   not on art-directions.
2. Character: **frozen — never redesign it again.** (Owner: "why do you keep
   changing the current Ashen character? i didn't ask you to". The delegated
   takes' big-eared whiskered cat was a different character and "ugly".)
3. Medium: straight to the live game; verification is the owner's eyes on
   `/projects/kitty-run` (dev server :5173).
4. Scope: **all three picks** — depth ladder, warm rims, liturgical HUD type.
5. The owner has NOT judged the world deltas yet (only the cat was called
   ugly) — implement visibly but keep the ashen identity; make each pick easy
   to roll back (separate commits, one per pick, is safest).
6. The audio bugfix is accepted and committed (b452f37).

## The character law (fact-checked this session — do not re-derive)

The live ashen knight is the SAME cat rig re-skinned (`kitty/Kitty.tsx`,
`isSouls` branches at :235+; palette mapping in `web/lib/theme.ts:73-118`):

- Wide flat head (ellipse 2.0 × 1.68), small ears with flaps, bone chin below
  the visor. In souls mode the pastel face is REPLACED: no bow, no whiskers,
  no cheeks, no mouth — a great helm covers the face (dome #6a6d72, crest
  #3d4045, visor plate #3d4045, slit, two ember eyes #e07a34).
- Steel pauldrons over arm pivots, belt + buckle, two-layer tattered rust cape
  (#8a4a33 front / #522a1e back), bone limbs (#e8e1d2), rust tunic.
- Weapon: a GREATSWORD over the right shoulder (blade #eaf0f6, ~2.9 units,
  up-left behind the head). The gallery stills' SPEAR does not exist in-game.
- Scale: ~19% of canvas height on desktop, ~20% in from the left edge —
  "part of the landscape" by design (`web/lib/framing.ts:5-7`).
- Any future 2D representation must be THIS character at THIS scale.

## Original objective (for reference — delivered this round)

Starting values imported from the rejected stills (tune live, keep ashen):

1. **Depth — mist value ladder.** Regrade the city layers via SOULS_PALETTE:
   `castleFar` toward bone-mist (≈#a7aeb8), `castleNear` deeper (≈#2a3140);
   check `hillFar`/`hillNear` fit the ladder. Add visible cool haze between
   layers (≈#78889f, opacity 0.35–0.45 — R3F fog or translucent planes; explore
   `web/scene/` first to see how the city layers render before choosing).
2. **Light — ember-rose rims.** Warm directional light from the sun side (the
   sun sits at ~71% across the frame, right) or rim/fresnel accents on
   sun-facing edges: tower tops, crate lids, ground lit edge (≈#7a6a5d), the
   knight's right contour (#e8a878/#b48f85 family). A rim, not a glow.
3. **Type — liturgical HUD.** kitty-run.css: wide tracking (~0.3em), calm
   weight, slow fade-in on the ritual prompts from SOULS_TEXT (rise / begin /
   go on / rekindle / YOU DIED). Copy text is frozen — typography only. One
   ember accent allowed (thin #e8863c rule under the kicker).

Constraints (frozen): menu layout, souls pickup economy, star pickups, the
character (above). Palette law: cold = dead world, warm = living light; only
sun core + soul wisps cross the bloom line.

## Protocol

- `git pull --ff-only origin main` first; other agents share the tree — stage
  only your own paths (`git commit <paths>`); the commit-msg/post-commit hooks
  auto-record graph nodes.
- One commit per pick so the owner can bisect by eye; push with
  `/usr/bin/git` (local git build can't do network ops).
- Checks: `cd portfolio/shell && npm run typecheck`; kitty-run's own gates in
  `portfolio/projects/kitty-run/tests/` (check/sim pattern, see graph n15).
- Delegated chat-model briefs only if the scene-light work proves nontrivial;
  palette + CSS are direct edits.
- Record the verdict/pass as a graph node before wrapping up; update this
  handoff or replace it if the round completes.
