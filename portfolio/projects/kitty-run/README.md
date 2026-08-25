# Hello Kitty Run

A pastel endless runner for the portfolio shell. Kitty runs on her own; you
jump (twice for a double), dash through danger, and keep a three-heart meter
alive. Hearts and big cross-hearts mend her; crates break her. Chain pickups
into a combo multiplier for score — and when a towering spike wall rises up,
the only way through is a well-timed dash.

Hello Kitty © 1976 Sanrio Co., Ltd. This is an unofficial fan-made tribute,
not affiliated with or endorsed by Sanrio.

## How it fits the shell

Standard `projects/*/project.ts` contract (`ProjectModule` descriptor +
lazily loaded React page), so the landing page discovers it automatically;
the route is `/projects/kitty-run`. Shell-side additions: the
`.presentation-kitty-run` landing-card block and the `kitty` center mark
(inline SVG of Kitty in `shell/src/shell/ProjectArtwork.tsx`) in
`shell/src/styles.css`.

## Controls

- Space / ↑ / W / tap — jump, press again mid-air for a double jump,
  release early for a shorter arc
- Shift / ↓ / S / swipe down — dash (brief invulnerability, cooldown)
- P, Esc, or the on-screen pause button — pause; R — restart from the pause
  or game-over screen
- `?autostart` skips the menu, `?debug` shows a small state readout,
  `?plain` skips the post-processing chain on weak GPUs

## Mechanics

- **Hearts mend** — any heart pickup restores one heart of the meter when
  damaged; the big cross-heart always does. At full health both convert to
  bonus points (+20 / +50), so a pickup never lands silently.
- **Combo** — consecutive pickups raise the score multiplier (every fourth,
  capped ×8); taking a hit resets it.
- **Spike walls** — the one deliberately unjumpable hazard (no jump arc in
  the game reaches its top, and the checks pin that). Dash through it for a
  +25 reward; the first wall of a run raises a teaching banner, and every
  wall leaves extra runway so the dash is back by the next pattern.
- **Fair pacing** — hazard pairs space themselves by jump length at the
  current speed, so the reaction window feels the same at 7 u/s and 14;
  every hazard group leaves a recoverable gap after it.
- **Terrain-safe jumps** — the rolling ground's steepest slope is tuned
  against the jump arc: even taking off on the worst uphill stretch at top
  speed, the tall crate stays clearable. The inequality lives in the node
  checks (`WORST_SLOPE` × half a jump length vs. apex clearance).

## Implementation notes

- **Zero image assets** — the sky, clouds, hills, crate dots and the
  particle sprite are canvas-generated textures; Kitty herself is
  procedural vector art: `THREE.ShapeGeometry` parts (head, ears, bow,
  dress, whiskers) with an ink copy grown behind each fill as an outline.
- **Responsive framing** — `web/lib/framing.ts` derives camera distance,
  field of view and the look target from the viewport aspect, guaranteeing
  a minimum world width on portrait phones; the DOM floaters project with
  the same function, so pop-ups track pickups on any screen.
- **Depth discipline** — the camera near plane sits at 2 and the Kitty's
  part layers are separated generously, because thin z offsets z-fight on
  16-bit mobile depth buffers and read as a see-through character.
- **Pure simulation** — `web/scene/step.ts` advances the whole run and only
  touches plain data from `web/scene/world.ts`; rendering components read
  the world in their own `useFrame`. React never re-renders for gameplay;
  HUD numbers are written straight to DOM nodes.
- **Deterministic spawning** — chunks come from `web/lib/spawn.ts` with a
  per-run seed; the fairness invariants (recoverable gaps, landable pair
  spacing, bounded chunk lengths, worst-case uphill jump clearance, spike
  walls unjumpable yet always dash-ready) are pinned by the node checks.
- **Shared ground truth** — the ribbon meshes, the physics and the obstacle
  placement all sample the same `groundY(x)` from `web/lib/ground.ts`.
- **Feel** — squash-and-stretch springs, coyote time, variable jump height,
  hit-stop, trauma-based screen shake, dash FOV kick, combo-pitched pickup
  chimes (WebAudio synthesis, no audio files). `prefers-reduced-motion`
  disables shake, hit-stop and most particles.
- **Performance** — instanced meshes for obstacles, pickups, crosses and
  glows, one draw call for all particles, no per-frame allocations in the
  hot path.

## Verify

```sh
npm --prefix portfolio run typecheck
npm --prefix portfolio run build
node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts
```
