# Hello Kitty Run

A pastel endless runner for the portfolio shell. Kitty runs on her own; you
jump (twice for a double), dash through danger, and chain heart pickups into
a combo multiplier. Three hearts, then the run is over.

## How it fits the shell

Standard `projects/*/project.ts` contract (`ProjectModule` descriptor +
lazily loaded React page), so the landing page discovers it automatically;
the route is `/projects/kitty-run`. Everything lives inside this directory.
The only shell-side addition is the `.presentation-kitty-run` landing-card
block in `shell/src/styles.css`.

## Controls

- Space / ↑ / W / tap — jump, press again mid-air for a double jump,
  release early for a shorter arc
- Shift / ↓ / S / swipe down — dash (brief invulnerability, cooldown)
- P or Esc — pause; R — restart from the pause or game-over screen
- `?autostart` skips the menu, `?debug` shows a small state readout

## Implementation notes

- **Zero image assets** — the sky, clouds, hills, crate dots and the
  particle sprite are canvas-generated textures; Kitty herself is
  procedural vector art: `THREE.ShapeGeometry` parts (head, ears, bow,
  dress, whiskers) with an ink copy grown behind each fill as an outline.
- **Pure simulation** — `web/scene/step.ts` advances the whole run and only
  touches plain data from `web/scene/world.ts`; rendering components read
  the world in their own `useFrame`. React never re-renders for gameplay;
  HUD numbers are written straight to DOM nodes.
- **Deterministic spawning** — chunks come from `web/lib/spawn.ts` with a
  per-run seed; the fairness invariant (a recoverable gap after every hazard
  group, given the current speed) is pinned by the node checks.
- **Shared ground truth** — the ribbon meshes, the physics and the obstacle
  placement all sample the same `groundY(x)` from `web/lib/ground.ts`.
- **Feel** — squash-and-stretch springs, coyote time, variable jump height,
  hit-stop, trauma-based screen shake, dash FOV kick, combo-pitched pickup
  chimes (WebAudio synthesis, no audio files). `prefers-reduced-motion`
  disables shake, hit-stop and most particles.
- **Performance** — instanced meshes for obstacles, pickups and glows, one
  draw call for all particles, no per-frame allocations in the hot path.

## Verify

```sh
npm --prefix portfolio run typecheck
npm --prefix portfolio run build
node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts
```
