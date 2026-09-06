# HANDOFF — Ashen qualitative round (next session)

Written at the close of the round that delivered the material + grounding pass
in-game. Read top to bottom: state, the style bible (compressed), the round
record, what is deferred, then protocol.

## Where things stand (all pushed to origin/main)

- **The owner's verdict on the previous three picks (depth haze, liturgical
  HUD type, warm rims): ACCEPTED as baseline.** The new pass builds on them.
- **This round (material + grounding), three picks in-game, one commit each:**
  1. **ec5e4c7 — ash quality.** The 60-mote batch split into two flat
     opacity classes: near (18 motes, opacity 0.5, size 0.13–0.24, z −1.6…−0.8,
     scroll 0.36) and far (42, 0.26, 0.06–0.11, z −3.4…−2.6, scroll 0.24).
     Sway re-eased through a smoothstep pendulum (velocity ≈ 0 at the drift
     extremes — "held-breath drift, not uniform snow"), freq slowed to
     0.25–0.75. Same envelope, same colour, no new particles. Seed bumped to
     `kitty-run/ash/v2` (layout re-rolled deterministically).
  2. **f333dbc — knight material pass.** Worn-steel / worn-cloth shading
     INSIDE existing silhouettes (character law respected — rig untouched):
     brow-occlusion pool on the visor plate under the dome seam
     (`SOULS_MATERIAL.steelShadow` #26292d, z 0.305), one bone-white
     specular chip on the dome's sun curve (kittyWhite, 0.18×0.05, rot −0.7,
     z 0.36), dirty fuller line down the greatsword (#a9b0ba, z 0.06), cape
     fold wedge along the trailing hem tip (`capeFoldShape()`, suitDeep,
     z 0.0 inside capeFrontRef), belt occlusion band on the tunic (suitDeep,
     visorSlit geometry at scale 0.62, z 0.15). All hard-edged, no gradients;
     z-gaps ≥ 0.02 per the codebase convention.
  3. **5ab3f05 — contact shadow regraded (was a live bug).** The souls
     knight's ground shadow was the pastel-pink leftover #b96a8a (Shadow.tsx
     never took a theme input). Fixed with a per-theme SHADOW record: souls
     = warm-dark stone #241f1a on a NEW dense `contactShadowTexture()`
     (textures.ts), ellipse 1.2×0.36, lift 0.01, opacity 0.62→0.30; pastel
     keeps the exact shipped read (#b96a8a, soft dot, 0.72×0.23, 0.36→0.14).
     RunCanvas passes `character` to Shadow now.
- **The shadow root-cause finding (do not re-derive):** the shadow always
  rendered but was nearly invisible — softDotTexture's alpha-1 core is ~4px
  of a 62px radial gradient, squashed into a 0.2-unit ellipse the visible
  dark core is a few pixels (pixel-probed at −6.5% vs the expected −35%).
  The dense contact texture (solid core out to half-radius) is what makes it
  read. Verified by pixel probe (center #4f443b at the 1.0-opacity test) and
  by eye in close-up crops.
- Gates green at every step: `portfolio/shell` typecheck, kitty-run
  `tests/kitty-run.check.ts` + `tests/kitty-run.sim.ts`.
- **Verification = owner's eyes on /projects/kitty-run (souls).** The
  dome chip is the one element flagged borderline: at 3× crop zoom it reads
  slightly "stuck-on"; at game scale it is a 2px accent. Owner to judge.

## The style bible (delivered by the delegated slate, compressed)

Mood pillars: **beautiful exhaustion** (every light is the last of
something) · **cold vastness, warm intimacy** (small precious warms) ·
**weight and patience** (steel tarnished, cloth tired — the knight is
furniture of the landscape) · **held breath** (stillness with slow drift).

Material language (flat-vector translation): worn cloth = 3 flat value
steps, no gradients; tarnished steel = occlusion pool + mid plane + one
clipped bone-white chip; cracked stone = value-stepped facets terminating
into existing shadows; ash = flat opacity classes, never blur.

References the slate anchored: Firelink Shrine (warm/cold ratio), Majula
(low mournful sun), Anor Londo (rim discipline), Ash Lake (vast quiet),
Undead Burg (matte value layering).

## Deferred by the owner (do NOT implement without a new go)

The owner picked all six slate moves but then ordered A/B/C first, D/F/E
**later**. The three waiting picks, with the slate's own risk notes:

- **D — rim discipline.** Thin all sun-rims (city + knight) to a consistent
  2px hairline. Risk: could undo the accepted 0.7-alpha rim temper from the
  light pass (d4394c6). Knobs: rim stamp alpha 0.7 + 3px/2px offsets in
  `castleTexture`, fringe offsets 0.08/0.07+0.05 in Kitty.tsx.
- **F — Echo cold-core.** Two-stage fade: cold soul-core holds, warm rim
  arrives last. Heaviest build — Echo fades as ONE pre-composited quad
  (Echo.tsx:225); the rim must split into a second quad. Cap to a single
  lerp channel to protect 60fps (slate's own note).
- **E — vignette warm-bias.** Cool-corner vignette keeping the sun side
  warmer. Needs custom post/overlay work (postprocessing's Vignette has no
  tint); slate flagged over-tint muddying the near-city deep slate. Note:
  Effects.tsx:19-22 comment says "dark theme leans deeper" but BOTH themes
  sit at 0.26 — a discrepancy to resolve inside this pick.

## Tuning knobs for the owner's eyes-on

- Ash: tier counts/opacities/sizes in `AshFall.tsx` TIERS record.
- Knight material: `SOULS_MATERIAL` values + overlay positions in
  `Kitty.tsx` (each overlay is one mesh; comment above each).
- Shadow: `SHADOW` record in `Shadow.tsx`; texture stops in
  `contactShadowTexture()` (textures.ts).
- Rollback: `git revert 5ab3f05` / `f333dbc` / `ec5e4c7` (per pick).

## Protocol

- `git pull --ff-only origin main` first (use `/usr/bin/git` for network
  ops — the local build can't). Other agents share the tree — stage only
  your own paths; untracked BRIEF/HANDOFF-kitty-run-* files at root belong
  to another agent.
- One commit per pick; commit-msg hook auto-records graph nodes.
- Checks: `cd portfolio/shell && npm run typecheck`; kitty-run gates in
  `tests/` (check/sim).
- Screenshot probe pattern: boot Vite on a scratch port (see
  `tests/kitty-run.shots.mjs`), deep-link `?souls&autostart`; puppeteer-core
  with the Playwright chromium at
  `~/Library/Caches/ms-playwright/chromium-1134/.../Chromium` (no system
  Chrome); use `domcontentloaded` + fixed waits (networkidle0 hangs on the
  HMR websocket).
- Record the verdict/pass as a graph node before wrapping up; update this
  handoff when the round completes.
