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
- **Foliage** — trees and grass are `InstancedMesh` draws (a handful of draw
  calls total); wind sway is injected into the vertex shader via
  `onBeforeCompile` and driven by one shared clock uniform.
- **Fireflies** — GPU-only drift in a points shader seeded deterministically.
- **Terrain** — one displaced plane whose heights come from
  `web/lib/heightfield.ts`; the walking rig samples the same function so feet
  stay on the ground.
- **Ambience** — wind, crickets and an owl are synthesised with WebAudio
  (`web/lib/ambience.ts`); no audio files. The context starts inside the
  click gesture that enters the forest.
- **Determinism** — all placement uses seeded PRNGs from `web/lib/rng.ts`.

## Verify

```sh
npm --prefix portfolio run typecheck
npm --prefix portfolio run build
node --experimental-strip-types portfolio/projects/evening-forest/tests/forest.check.ts
```
