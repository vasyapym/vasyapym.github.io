# Hello Kitty Run

A pastel endless runner for the portfolio shell. Kitty runs on her own; you
jump (twice for a double), dash through danger, and keep a three-heart meter
alive. Hearts and big cross-hearts mend her; crates break her. Chain pickups
into a combo multiplier for score — every hazard in the run can be cleared
with a well-timed jump.

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
- Shift / ↓ / S / swipe down — dash (brief invulnerability, cooldown).
  A dash inside the first ~120 ms of a fresh jump **cancels the jump**:
  kitty snaps back down and ducks instead. On touch this is what makes
  ducking reliable — the tap-to-jump fires on finger-down before the
  gesture is known, so the swipe-down always wins the argument
- P, Esc, or the on-screen pause button — pause; R — restart from the pause
  or game-over screen
- "or watch it play itself" on the ready card hands the run to the
  autopilot; the chip on the right edge takes control back at any moment
- `?autostart` skips the menu, `?autopilot` starts straight into the
  bot-driven exhibition, `?debug` shows a small state readout,
  `?plain` skips the post-processing chain on weak GPUs

## Mechanics

- **Hearts mend** — any heart pickup restores one heart of the meter when
  damaged; the big cross-heart always does. At full health both convert to
  bonus points (+20 / +50), so a pickup never lands silently. Hearts are
  deliberately rare: one slim arc at a time, and the big cross-heart only
  shows up once the run is properly underway — losing a heart stings.
- **The ramp bites early** — full speed arrives well inside the first
  minute, rests shorten, hazard patterns weigh more, and the difficulty
  span tops out at 650 m; every hazard in the run can still be cleared
  with a well-timed jump.
- **Score breathes** — distance ticks one point per metre, so the counter
  moves even between pickups, and every 500 m throws a milestone
  celebration: a rising chime, confetti and a big banner.
- **Combo** — consecutive pickups raise the score multiplier (every fourth,
  capped ×8); taking a hit resets it.
- **Race your best-run echo** — a finished run is stored as its seed plus
  the timed input list; the next runs reuse that seed, so a soft, faded
  afterimage of Kitty replays your finest hour on the very same track.
  The handicap is a distance, not a delay: she waits until you open a
  four-and-a-half-metre lead, then gives chase, and because both
  simulations run at the same speed the gap holds steady from launch to
  finish. A stage-span clamp pins her drawing inside the visible band, so
  even a big late-run lead never pushes her off a phone screen — and when
  that clamp seats her next to the player she eases back only to half
  strength, so the race stays readable everywhere. The restyle maps her
  into one dusty-rose family with no aura and no pulse: a watercolour
  memory of a run, not a haunting. The HUD chip reads out the
  live gap (+/- metres, or "out" once she has fallen). Beat her score and
  she is replaced. The sanitizer rejects corrupt or stale storage entries.
- **Autopilot: watch it play itself** — the ready card offers a second
  button that hands the run to the lookahead pilot from `web/lib/pilot.ts`
  (the exact bot the headless sim test drives, imported from the same
  module). It reads only plain world state each frame — nearest grounded
  crate, half a jump length of lookahead — and sets the same input flags a
  player would. A bot run is an exhibition: it writes no best score and no
  echo replay, so its perfect run can never replace your own; the over
  card says so. `?autopilot` deep-links straight into the demo.
- **Everything is jumpable** — there are no unjumpable obstacles. The
  checks sweep hundreds of generated chunks and pin every hazard top under
  the double-jump arc, worst-case uphill included; the tall crate stays
  clearable even by a single well-timed jump.
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
  eleven world units of run-ahead on portrait phones (Kitty reads as a
  figure in the landscape, not a close-up); the DOM floaters project with
  the same function, so pop-ups track pickups on any screen, and the
  best-run echo clamps into the same span, so she is never drawn off
  stage.
- **Depth discipline** — the camera near plane sits at 2 and the Kitty's
  part layers are separated generously, because thin z offsets z-fight on
  16-bit mobile depth buffers and read as a see-through character. The
  best-run echo renders translucent with depth writes on, so its draw
  order is pinned explicitly (meshes sorted far-to-near once at mount) —
  otherwise the sort could seat the dress behind the head fill and let
  the torso shine through.
- **One bot, two stages** — `web/lib/pilot.ts` is pure TypeScript with no
  three.js or React imports, so `tests/kitty-run.sim.ts` drives it headless
  for its fairness sweep while the browser autopilot runs the same module
  live. The demo cannot drift from the verification: they are one file.
- **Contact shadow** — a soft canvas-texture ellipse rides `groundY()`
  under the Kitty, tightening and fading as she climbs, so she lands *on*
  the rolling ground at the pulled-back framing instead of floating over
  it.
- **First impression** — the ready overlay is a light pastel wash, and its
  paper card parks in the run-ahead space, so visitors see Kitty idling in
  her world the moment the page loads; pause and game-over keep the dark,
  focus-pulling treatment.
- **Pure simulation** — `web/scene/step.ts` advances the whole run and only
  touches plain data from `web/scene/world.ts`; rendering components read
  the world in their own `useFrame`. React never re-renders for gameplay;
  HUD numbers are written straight to DOM nodes.
- **Headless full-run sim** — `tests/kitty-run.sim.ts` drives the real step
  function with a lookahead bot for 150 simulated seconds and asserts what
  only shows up over time: no NaN drift, no unknown hazard kinds,
  milestones fire once each, and a seeded run replays identically. It also
  pins the fresh-jump dash-cancel (queued, airborne, aged and determinism
  cases).
- **Deterministic spawning** — chunks come from `web/lib/spawn.ts` with a
  per-run seed; the fairness invariants (recoverable gaps, landable pair
  spacing, bounded chunk lengths, worst-case uphill jump clearance, and no
  unjumpable hazard in the mix) are pinned by the node checks.
- **Shared ground truth** — the ribbon meshes, the physics and the obstacle
  placement all sample the same `groundY(x)` from `web/lib/ground.ts`.
- **Feel** — squash-and-stretch springs, coyote time, variable jump height,
  hit-stop, trauma-based screen shake, dash FOV kick, combo-pitched pickup
  chimes (WebAudio synthesis, no audio files). `prefers-reduced-motion`
  disables shake, hit-stop and most particles.
- **Touch feel** — the stage swallows scroll/zoom gestures
  (`touch-action: none`), never selects text or flashes taps mid-swipe;
  Android gets light haptic accents on hits, heals and milestones; leaving
  the tab pauses the run and revives the suspended AudioContext on return.
  Swipes are recognised twice as early as they used to be (short drag or
  quick flick), and the dash's fresh-jump cancel means a swipe-down can
  always rescind the tap-jump it accidentally triggered — ducking on a
  phone is a single decisive gesture, never a fight with the input.
- **Performance** — instanced meshes for obstacles, pickups, crosses and
  glows, one draw call for all particles, no per-frame allocations in the
  hot path.

## Verify

```sh
npm --prefix portfolio run typecheck
npm --prefix portfolio run build
node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts
node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.sim.ts
node portfolio/projects/kitty-run/tests/kitty-run.shots.mjs   # visual probe, needs Chrome/Edge
```
