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
  does dusk grading, ordered dithering (4×4 Bayer) and palette quantisation;
  plus library `Bloom` and `Vignette` around it.
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
  `onBeforeCompile` and driven by one shared clock uniform.
- **Fireflies** — GPU-only drift in a points shader seeded deterministically.
  Inside ~12 m they lean toward the walker via a shared player-position
  uniform, so strolling through the hollow stirs sparks around you.
- **Terrain** — one displaced plane whose heights come from
  `web/lib/heightfield.ts`; the walking rig samples the same function so feet
  stay on the ground.
- **Ambience** — wind, crickets and an owl are synthesised with WebAudio
  (`web/lib/ambience.ts`); no audio files. Footsteps are cut from the same
  synth — a lowpass thump plus bandpassed leaf crunch fired by each head-bob
  cycle. The context starts inside the click/tap gesture that enters the
  forest; a Sound button on touch pauses it all.
- **Determinism** — all placement uses seeded PRNGs from `web/lib/rng.ts`.

## Verify

```sh
npm --prefix portfolio run typecheck
npm --prefix portfolio run build
node --experimental-strip-types portfolio/projects/evening-forest/tests/forest.check.ts
npm --prefix portfolio run test:smoke
```

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
