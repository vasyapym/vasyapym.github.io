# Evening Forest

A cozy first-person walking simulator for the portfolio shell. No missions,
no combat, no fail state — a fantasy woodland at dusk rendered through an
8-bit post-processing pass.

## How it fits the shell

The module follows the standard `projects/*/project.ts` contract
(`ProjectModule` descriptor + lazily loaded React page), so the landing page
discovers it automatically and the route is `/projects/evening-forest`.
Everything lives inside this directory; no shell routing changes.

## Implementation notes

- **Rendering** — `@react-three/fiber` + `three`. The canvas renders at ~0.36
  device pixels and CSS upscales it with `image-rendering: pixelated`, which
  is the pixelation effect and the main performance win at once.
- **8-bit pass** — a single custom `postprocessing` effect (`web/scene/RetroEffects.tsx`)
  does dusk grading (including a toe lift so shadow side keeps texture
  through quantisation), ordered dithering (4×4 Bayer) and palette
  quantisation; plus library `Bloom` and `Vignette` around it.
- **Daylight engine** — `web/lib/daylight.ts` expands one number (time of
  day, 0..1) into every lighting decision: five keyframes from golden hour
  through night to sunrise, smoothly interpolated. The pure module is
  tick-asserted headlessly; `web/scene/DaylightDriver.tsx` samples it once
  per frame and drives the sky uniforms, both lights, fog, clear colour and
  shared effect gains (stars, fireflies, shafts). Light intensities live in
  classic units in the keyframes and are multiplied by π exactly once, in
  the driver — three r155+ physical light units otherwise render the whole
  forest ~3× darker than authored. Visitors drag the dusk dial in the rest
  menu (or tap `[` / `]` while playing); the right end of the arc is a
  bright sunrise, so "too dark" is always one slide away from fixed.
- **Touch play** — phones get the same forest: a dynamic-origin joystick on
  the left half of the stage (`web/ui/TouchControls.tsx`) and drag-to-look on
  the right, tracked per `pointerId` so both thumbs work at once. The maths
  lives in pure `web/lib/touch-input.ts`; the walking rig drains the shared
  input state once per frame, so camera mutation stays in one place. The
  canvas lives in an absolutely positioned host (`evening-forest-canvas-host`)
  because a `height:100%` renderer wrapper inside a flex-sized stage can
  collapse to the canvas's intrinsic 150px; and drei's `PointerLockControls`
  stays unmounted on touch devices — it installs a document-wide
  click-to-lock handler that would fight the touch flow.
- **Quality tiers** — coarse-pointer devices render fewer pixels and
  fireflies (`QUALITY_TIERS` in `ForestCanvas.tsx`) while keeping every
  feature; the dither hides the difference.
- **Foliage** — trees and grass are `InstancedMesh` draws (a handful of draw
  calls total); wind sway is injected into the vertex shader via
  `onBeforeCompile` and driven by one shared clock uniform. Trunks are solid:
  the walking rig collides against the same seeded scatter via
  `web/lib/tree-field.ts` (pure, headless-asserted) — circle pushout with
  slide, looked up through a spatial hash.
- **Fireflies** — GPU-only drift in a points shader seeded deterministically.
  Inside ~12 m they lean toward the walker via a shared player-position
  uniform, so strolling through the hollow stirs sparks around you; stray
  further than ~46 m and the whole swarm quietly re-seeds around you.
- **The fox** — a fully procedural animal (`web/scene/fox/`): the brain
  (`brain.ts`) is dependency-free TypeScript — a wander → alert → curious →
  flee state machine with a relocation "director" so the fox always lives in
  the walker's story — and is tick-asserted in `tests/forest.check.ts`. It
  opens ~11 m ahead of the spawn vista (inside alert radius), so the first
  thing a visitor sees is the fox freezing to stare back; the director
  recasts it 28–40 m ahead whenever it falls 90 m behind. The body
  (`Fox.tsx`) is primitives only: diagonal-pair trot gait scaled by speed,
  feet planted on the heightfield, slope-following pitch, banking,
  tail sway, and head/ear body language. A low emissive lift keeps it warm
  against the backlit dusk. The frame loop publishes a plain snapshot into
  `fox/store.ts`; DOM UI polls it — `web/ui/FoxWhisper.tsx` fires a one-shot
  "something stirs…" hint on the first close pass of a visit, and
  `web/ui/FoxMind.tsx` is a live readout of the state machine (toggle with
  `M`, or the Fox-mind button on touch).
- **Terrain** — one 520 u displaced plane whose heights come from
  `web/lib/heightfield.ts`; the walking rig samples the same function so feet
  stay on the ground. The walkable radius is ~230 m, ending in a rim of
  hills the fog eats. Grass is a single instanced meadow that re-plants
  itself in whole-tile steps around the walker, so the ground is grassy
  everywhere without thousands of extra instances.
- **Score** — the background music is a procedural, Dark Souls-flavoured
  tranquil ambient loop (`web/lib/music.ts`): a breathing D-aeolian drone
  (with D3/D4 partials so phone speakers hear it), slow open-fifth pad
  swells (two blooms per cycle), a sparse bell-like melody with soft
  neighbour-note echoes, a rare distant chime, and a quiet filtered
  night-air noise bed, all glued by a bus compressor and bathed in a
  runtime-built convolution reverb, scheduled on a seamless 38.4 s cycle
  with a single lookahead timer. No audio files. The shared
  AudioContext, master mute/dim ramps and the footstep synth (a lowpass
  thump plus bandpassed leaf crunch fired by each head-bob cycle) live in
  `web/lib/ambience.ts`. The context starts inside the click/tap gesture
  that enters the forest; a Sound button on touch pauses it all, and
  leaving the project closes the context outright (asserted by the smoke
  test).
- **Determinism** — all placement uses seeded PRNGs from `web/lib/rng.ts`.

## Verify

```sh
npm --prefix portfolio run typecheck
npm --prefix portfolio run build
node --experimental-strip-types portfolio/projects/evening-forest/tests/forest.check.ts
npm --prefix portfolio run test:smoke
```

`tests/visual-probe.mjs` (`npm --prefix portfolio run test:probe`) is a
screenshot harness: it boots the dev server, enters the forest, drags the
camera down to the ground and sweeps time to night and sunrise, saving
frames to `/tmp/ef-probe` for eyeballing light changes. Two more one-off
harnesses live beside it: `tests/mobile-line-probe.mjs` (iPhone-class
Chrome at 360/390/414 px, screenshots plus a DOM sweep for stray light
elements — the "unwanted white line" check) and `tests/music-probe.mjs`
(enters the forest and asserts the procedural score builds its graph and
schedules without errors).

The browser smoke boots the dev server on a scratch port, drives the page in
a headless iPhone-class Chrome (tap to enter, joystick walk, drag look,
Rest, re-enter) and fails on any console error or stuck overlay. It uses
system Chrome via `puppeteer-core`; set `CHROME_PATH` if Chrome lives
somewhere unusual, and it skips cleanly when no browser exists.

## Test on a real phone

```sh
npm --prefix portfolio run dev:host
```

Then open `http://<your-mac-ip>:5173/projects/evening-forest` on the phone
(same Wi-Fi). Plain `npm run dev` binds to loopback only — the phone cannot
reach it, which looks exactly like "the page doesn't open". If it still
refuses to connect, macOS may be blocking inbound Node connections
(System Settings → Network → Firewall).
