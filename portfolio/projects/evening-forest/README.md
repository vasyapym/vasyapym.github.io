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
  input state once per frame, so camera mutation stays in one place.
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
```
