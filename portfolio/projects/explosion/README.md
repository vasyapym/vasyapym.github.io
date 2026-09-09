# Explosion — three modes, one room

A triple experiment under one name. The visitor picks a mode on first visit; the
choice is remembered (`localStorage`, key `explosion-mode`), can be deep-linked
(`?mode=lantern` / `?mode=ink` / `?mode=fault`), and can be switched at runtime —
the **switch mode** button overlays the simulation viewport's bottom-right
corner, and the **m** hotkey cycles directly. Switching disposes the active mode
and mounts the other one without a page reload.

## Mode 1 — Ember Lantern (classic, unchanged)

A paper-lantern moon of 600 tetrahedral shards. One click detonates it; the shards
tumble, fall to a ground disc, an auto "flashpoint" shockwave bloom marks peak
dispersion, and one click eases everything back to the pristine sphere.

Techniques:

- **GPGPU shard physics** — shard state lives in two ping-pong RGBA32F texture
  pairs (32×32); fragment shaders integrate gravity, drag, floor bounce and
  curl-noise turbulence; the render vertex shader fetches state straight from the
  textures via `texelFetch`. Zero per-frame CPU per-shard work.
- **Single-source-of-truth law** — one owned state drives the visual and the
  logical reading; destruction is same-frame; a mid-air ghost is unrepresentable.
- **CPU fallback** — when float render targets are unavailable, an identical
  InstancedMesh path with the same constants takes over (`sim cpu` in the HUD).

Files: `web/detonate.ts` (entry), `web/ember-gpu.ts` + `web/ember-gpu-shaders.ts`
(GPGPU backend), `web/audio.ts` (procedural WebAudio).

## Mode 2 — Ink Shockwave

A pool of living ember-ink in the dark. Moving the pointer stirs currents
(velocity + dye injected along the pointer path); a click is a detonation: a
radial impulse pops the ink, a traveling annulus ring carries the shock for
~0.55 s, hot dye splashes at the blast center. ~0.9 s after mount an
auto-detonation fires at the pool center as the signature opening moment.

Techniques:

- **Navier–Stokes in fragment shaders** — a hand-rolled stable-fluids solver on
  ping-pong RGBA16F targets: semi-Lagrangian advection, divergence, ~24 Jacobi
  pressure iterations, gradient subtraction, vorticity confinement. Continuous
  Eulerian field — the anti-thesis of the lantern's discrete shards.
- **Resolution-independent velocity** — velocity is stored in uv units per
  second, so constants do not change with grid size; grids are sized once from
  the initial aspect and a later resize only stretches the display.
- **No readback** — stats are CPU-known scalars; the display pass samples the
  exact dye texture the solver wrote that frame, so a stale-pixel desync is
  unrepresentable.
- **Additive splats** — pointer stirs and blasts are event-time additive draws
  into the same field everyone reads (`CustomBlending`, ONE/ONE).
- **Software tier** — on SwiftShader/llvmpipe-class renderers the sim grid drops
  to 96, dye to 320, Jacobi to 16.

Files: `web/ink.ts` (entry), `web/ink-shaders.ts` (all GLSL).

## Mode 3 — Cinder Fault

A ceramic seal with grain: a seeded Voronoi microstructure of mineral plates and
weak boundaries. A click is a strike — a compact impulse drives a view-depth
wave through the solid, overstrained bonds fail irreversibly along the plates,
and the released work returns as cooling ember light. The seal remembers every
strike until a restore reseals it.

Techniques:

- **GPU elastodynamics** — anti-plane (scalar) elastic waves on ping-pong
  RGBA16F textures: explicit finite differences with shared bond stiffness, so
  internal forces stay equal-and-opposite; fixed substeps with a bounded
  accumulator (excess wall time is dropped, never caught up).
- **Cohesive bond damage** — strain past a hardness-dependent threshold
  weakens bonds monotonically and permanently; fracture paths follow the
  microstructure instead of the blast direction.
- **No-readback interaction** — displacement is along view depth, so the disc's
  orthographic footprint never changes and hit testing stays analytic; the CPU
  owns only scalars (phase, counters, FPS EMA).
- **Software tier** — 64² state fields, ≤320 px drawing buffer, 2 substeps;
  hardware runs 128², ≤720 px, 4 substeps. Verified ≥5 fps on SwiftShader
  (9–47 fps observed in CI runs).

Files: `web/fault.ts` (entry), `web/fault-shaders.ts` (all GLSL).

## Mode plumbing

- `web/modes.ts` — the registry: one `ModeDef` per mode (`title`, `tagline`,
  copy, techniques, `mount()`), a shared `ModeHandle` contract
  (`detonateAt / restore / setMuted / setSlowMo / dispose / stats`), and the
  `localStorage` / `?mode=` helpers. Classic is wrapped, never modified.
- `web/ExplosionLunaPage.tsx` — mode-agnostic page: first-visit selector (three
  cards), runtime switch without reload, hotkey **m**, stats polling on the
  400 ms cadence, HUD rendered from each mode's own formatter.
- The ink and fault modules are lazy-loaded (`import("./ink")`,
  `import("./fault")`) on first selection, so their shaders and code stay out
  of the initial page bundle.

## Browser support and fallbacks

- Needs WebGL2. The lantern additionally needs `EXT_color_buffer_float` for the
  GPGPU path, else it runs the CPU path; the ink and fault modes need float (or
  half-float) color buffers and report their tier in the HUD (`grid 96` /
  `grid 64` = software tier).
- Without any WebGL the page shows the locked fallback message instead of the
  stage.
- `prefers-reduced-motion`: the lantern paints a static pristine sphere and gates
  detonation; the ink paints the deterministic pristine pour and gates stirring,
  detonation and the intro blast; the fault paints the pristine seal and gates
  strikes. Restore still works in all three.
- Verified in the headless suite on SwiftShader software GL (desktop 1440, tablet
  1024, mobile 390): the ink tier keeps the solver usable and the fault tier
  keeps the wave lattice usable in software rendering.

## Running

```bash
npm run dev            # from the repo root (workspace shell)
node portfolio/projects/explosion/tests/explosion.check.mjs
# subset: VIEWPORTS=desktop-1440,mobile-390 node .../explosion.check.mjs
```

The suite covers all three modes: first-visit selector, runtime switch without
reload, `localStorage` persistence, the `?mode=` deep link, and each mode's
interaction loop (lantern blooms/aloft, ink blasts/splats/grid, fault
strikes/settle/miss-invariant).
