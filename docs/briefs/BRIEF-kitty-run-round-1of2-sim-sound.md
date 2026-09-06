# BRIEF part 1 of 2 — kitty-run: star-distance milestones, land/roll debounce, pickup voice redesign

Paste this whole file into the chat model. It is ONE of two sequential parts;
part 2 (in-game character switching + Ashen art-direction candidates) is sent
separately afterwards — do NOT design those here. This part is fully
self-contained: the chat model has no repo access, and everything it needs is
inside. The integrator applies the response and runs the gates.

---

## §0 What you are and what you get

You are the design/implementation brain for one round of work on "Cat Runner"
(`portfolio/projects/kitty-run`), a React + three.js endless runner with two
cosmetic characters: the pastel **kitty** and the **ashen knight** (Dark Souls
re-theme). This part covers three simulation/audio deliverables:

- **Deliverable 2** — pickup voice redesign (both registers, star vs heart).
- **Deliverable 3** — effective distance (star bonus metres + live HUD meter
  + milestones on the total).
- **Deliverable 4** — land/roll debounce (the downhill repeated-thump bug).

Produce ALL three in ONE response, in the exact output format of §6.
Mechanical wiring, CSS, test adaptation and verification are handled by the
integrator — do not output them unless a deliverable requires it.

## §1 Architecture laws (must not break)

- **Pure simulation.** `web/scene/step.ts` advances a plain `WorldState`
  (`web/scene/world.ts`). Rendering components read the world in their own
  `useFrame` hooks. React never re-renders for gameplay; HUD numbers are
  written straight to DOM nodes via refs. No per-frame allocations in the
  hot path.
- **Deterministic echo replay.** A finished run is stored as seed + timed
  inputs and replayed through the same `stepWorld` on the same seed. Any new
  world field must be initialized in `createWorld` (zero default) and mutate
  deterministically; the echo sim steps identically and its events are
  drained unread.
- **SFX register rule.** `web/lib/audio.ts` has two complete VoiceSets
  ("kitty" pastel, "souls" knight); `setMode()` swaps the table. The kitty
  set is marked FROZEN by an old convention — the owner has now explicitly
  ordered its pickup voice redesigned; note that exception in a comment.
- **Zero audio files.** All Web Audio synthesis; one cached 1 s white-noise
  buffer is reused by every noise voice; no per-call buffer allocation.
- **Tests the integrator runs after applying you** (keep them green
  conceptually; do not output them): `npm --prefix portfolio run typecheck`;
  `npm --prefix portfolio run build`; `node --experimental-strip-types
  portfolio/projects/kitty-run/tests/kitty-run.check.ts`;
  `node --experimental-strip-types
  portfolio/projects/kitty-run/tests/kitty-run.sim.ts`.

## §2 Owner decisions — LOCKED, do not re-litigate

1. **Stars grant bonus metres: +5 m each** (flat, `TUNING.starBonusMeters`).
   A live HUD readout shows the total effective distance (running + bonus).
   Milestones (the "N m!" banner) fire on effective distance. The game-over
   card "m run" and the replay's stored distance use effective distance too.
   Speed ramp, difficulty, spawning, score-per-metre and the echo launch gate
   stay keyed on the RUNNING distance — gameplay is otherwise untouched.
2. **Pickup sound redesigned for BOTH registers**, with distinct voicing for
   star vs heart (heal keeps its own `heal()` voice). Crisper and more
   satisfying; keep the combo-pitched ladder concept.

## §3 Diagnoses already done — trust these, do not re-derive

- **Roll sound repeating downhill (souls "roll").** The `dash` event fires
  exactly once per input (`step.ts` consumes `dashQueued` / `dashBufferT`
  once). The repeats are **`land` events**: the ground slope drops at up to
  WORST_SLOPE ≈ 0.052 height-units per forward unit; at top speed + dash
  boost (~20 u/s) the ground falls ~0.017/frame while gravity gives the
  grounded kitty only ~0.010/frame of fall in the first frame — she goes
  micro-airborne for 1–2 frames and re-lands, and `step.ts` fires `land` on
  EVERY `!grounded → grounded` transition. During a 0.32 s dash that is ~4–8
  armored thumps (souls land voice: sine drop + inharmonic ring + scuff)
  layered over the roll rumble — reads as "the roll sound played 4–8 times".
- **Milestone "bug".** The banner is correct for running distance; the
  confusion is that the HUD shows only the score (1 pt per metre + pickup
  points), which the player reads as metres — the score runs ahead because
  stars are 25 points. Hence the effective-distance feature above.
- **Pickup sound.** One voice per register shared by heart/star/heal,
  combo-indexed pentatonic ladder (kitty: sine from C5 523 Hz; souls: sine
  from A4 440 Hz, softer attack). No per-kind voicing exists; `event.pickup`
  (kind) is available at the call site.

## §4 Code excerpts

### FILE: portfolio/projects/kitty-run/web/lib/ground.ts (FULL)
```ts
// The one ground truth for ground height: a gentle sum of sines. The mesh,
// the walking physics and the obstacle placement all sample this function,
// so feet, wheels and crates always agree.
//
// The amplitudes are tuned against the jump arc: WORST_SLOPE times half a
// max-speed jump length must stay well inside the tall-obstacle clearance,
// otherwise an uphill takeoff makes the crate literally unjumpable. The
// node checks pin that inequality.

export const GROUND_BASE = 1.6;

const ROLL_A = 0.42;
const ROLL_F = 0.085;
const SWELL_A = 0.62;
const SWELL_F = 0.026;

function roll(x: number): number {
  return Math.sin(x * ROLL_F) * ROLL_A + Math.sin(x * SWELL_F + 1.7) * SWELL_A;
}

export function groundY(x: number): number {
  return GROUND_BASE + roll(x);
}

// Steepest possible climb of the terrain, in height units per distance
// unit. Pure geometry of the two waves above.
export const WORST_SLOPE = ROLL_A * ROLL_F + SWELL_A * SWELL_F;

export const GROUND_MIN = GROUND_BASE - (ROLL_A + SWELL_A);
export const GROUND_MAX = GROUND_BASE + (ROLL_A + SWELL_A);
```

### FILE: portfolio/projects/kitty-run/web/lib/tuning.ts (excerpt — TUNING + speedFor)
```ts
export const TUNING = {
  speedStart: 7,
  speedMax: 14,
  // Reaches the top pace noticeably sooner: the gentle opening is a
  // courtesy, not the whole game.
  speedRamp: 420,

  gravity: 38,
  // Sized so the tall crate is clearable even taking off on the steepest
  // uphill stretch at top speed (see the checks + WORST_SLOPE).
  jumpV: 14.2,
  doubleJumpV: 11.5,
  jumpCutFactor: 0.45,
  coyoteTime: 0.09,
  maxJumps: 2,

  // Generous on purpose: 0.32 s of invulnerability covers a full hazard
  // crossing at top speed, so a dash a beat early or late still lands.
  dashDuration: 0.32,
  // Short enough that a burned dash comes back inside a breath.
  dashCooldown: 1.2,
  dashBoost: 6,

  // Input buffer: a dash pressed while cooling down is remembered this
  // long and fires the instant the cooldown ends.
  dashBuffer: 0.28,

  // Bullet time: every dash dips the whole simulation's clock to this
  // fraction of real time, then eases back at bulletRecovery per sim
  // second.
  bulletTimeScale: 0.35,
  bulletRecovery: 5.5,

  // A dash requested this soon after leaving the ground cancels the fresh
  // jump outright — kitty snaps back down and ducks instead.
  jumpCancelWindow: 0.12,

  invulnTime: 1.3,
  hitStopTime: 0.06,
  knockbackV: 6,

  maxHearts: 3,
  kittyRadius: 0.75,
  kittyCenterLift: 0.95,

  // Every this many metres the run throws a little celebration.
  milestoneStep: 500,

  // The best-run echo waits until the player opens this much of a lead,
  // then gives chase. A distance, not a delay.
  echoGapMetres: 4.5,
} as const;

export type Tuning = typeof TUNING;

export function speedFor(distance: number): number {
  const t = Math.exp(-Math.max(0, distance) / TUNING.speedRamp);
  return TUNING.speedMax - (TUNING.speedMax - TUNING.speedStart) * t;
}

export function jumpPeak(v: number): number {
  return (v * v) / (2 * TUNING.gravity);
}

// Horizontal ground covered by one full single jump at the given speed.
// Pattern spacing scales with this so gaps feel the same at 7 u/s and 14.
export function jumpLength(speed: number): number {
  return speed * ((2 * TUNING.jumpV) / TUNING.gravity);
}
```

### FILE: portfolio/projects/kitty-run/web/scene/world.ts (FULL)
```ts
// The mutable world state. One plain object owned by the game loop and read
// by every visual component through useFrame — React never re-renders for
// gameplay. Pools keep the whole run allocation-free.

import { createPool, type Pool } from "../lib/pools.ts";
import type { RunInput } from "../lib/replay.ts";
import { TUNING } from "../lib/tuning.ts";

export type GameStatus = "ready" | "running" | "paused" | "over";

export type ObstacleKind = "box" | "tall" | "hover";
export type Obstacle = {
  kind: ObstacleKind;
  x: number;
  y: number;
};

export type PickupKind = "heart" | "star" | "heal";
export type Pickup = {
  kind: PickupKind;
  x: number;
  y: number;
  phase: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  drag: number;
  gravity: number;
};

export type FloaterKind = "score" | "heal" | "hurt" | "bonus";
export type Floater = {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  amount: number;
  kind: FloaterKind;
};

export type GameEvent =
  | { type: "jump" }
  | { type: "doubleJump" }
  // Landing carries the fall speed as impact 0..1 (0 soft touch, 1 full
  // jump fall) so the landing sound can carry the landing's weight.
  | { type: "land"; impact: number }
  | { type: "dash" }
  | { type: "hit" }
  | { type: "gameover" }
  // The run crossed a milestone distance — celebrate it.
  | { type: "milestone"; meters: number }
  | {
      type: "pickup";
      pickup: PickupKind;
      score: number;
      combo: number;
      healed: boolean;
      bonus: number;
    };

// The motion fields the Kitty rig consumes to compute a pose.
export type KittyMotion = {
  runPhase: number;
  grounded: boolean;
  vy: number;
  squash: number;
  blinkShut: number;
  dashT: number;
  happyT: number;
  invulnT: number;
};

export type WorldState = {
  status: GameStatus;
  runSeed: string;
  time: number;
  distance: number;
  speed: number;

  hearts: number;
  heartPulseT: number;
  score: number;
  // The whole-metre mark already converted into score points, so the
  // counter ticks once per metre without double counting.
  scoredDistance: number;
  combo: number;
  comboTimer: number;
  best: number;

  // Distance of the next milestone celebration.
  nextMilestone: number;

  shake: number;
  hitStop: number;
  hitFlash: number;

  // The simulation's own clock rate, 1 = real time. A dash dips this to
  // TUNING.bulletTimeScale; step.ts eases it back. The game loop scales
  // every sim delta by it — player, echo, particles and the camera all
  // scale from one delta, so the whole world breathes in slow motion
  // together.
  timeScale: number;

  // True when the run that just ended beat the stored best — the game-over
  // card wears a little badge.
  newBest: boolean;

  spawnOrigin: number;
  chunkIndex: number;

  // Input flags, set by the page's listeners, consumed by the step.
  jumpQueued: boolean;
  jumpHeld: boolean;
  dashQueued: boolean;

  // Autopilot demo: when true the lookahead pilot steers instead of the
  // visitor (see lib/pilot.ts). The loop refuses to write best scores or
  // replays for a bot-driven run, so a perfect exhibition never replaces
  // the player's own echo.
  autopilot: boolean;

  // Timed input log for the current run — the raw material of the
  // best-run echo replay. Zeroed on start, appended by the actions.
  inputLog: RunInput[];

  kitty: KittyMotion & {
    y: number;
    jumpsUsed: number;
    coyote: number;
    dashCd: number;
    // Seconds left on the dash input buffer: a press during the cooldown
    // arms this, and the step fires the dash the moment the cooldown ends.
    dashBufferT: number;
    blinkNext: number;
    // Seconds since the grounded jump left the ground — the dash's
    // fresh-jump cancel reads this against TUNING.jumpCancelWindow.
    jumpAgeT: number;
  };

  obstacles: Pool<Obstacle>;
  pickups: Pool<Pickup>;
  particles: Pool<Particle>;
  floaters: Pool<Floater>;
  events: GameEvent[];
};

function freshSeed(): string {
  return `kitty-run/run/${Date.now().toString(36)}/${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function createWorld(best = 0, runSeed = freshSeed()): WorldState {
  return {
    status: "ready",
    runSeed,
    time: 0,
    distance: 0,
    speed: TUNING.speedStart,

    hearts: TUNING.maxHearts,
    heartPulseT: 0,
    score: 0,
    scoredDistance: 0,
    combo: 0,
    comboTimer: 0,
    best,

    nextMilestone: TUNING.milestoneStep,

    shake: 0,
    hitStop: 0,
    hitFlash: 0,
    timeScale: 1,

    newBest: false,

    spawnOrigin: 14,
    chunkIndex: 0,

    jumpQueued: false,
    jumpHeld: false,
    dashQueued: false,
    autopilot: false,
    inputLog: [],

    kitty: {
      y: 0,
      vy: 0,
      grounded: true,
      jumpsUsed: 0,
      coyote: 0,
      dashT: 0,
      dashCd: 0,
      dashBufferT: 0,
      invulnT: 0,
      runPhase: 0,
      squash: 0,
      blinkShut: 0,
      blinkNext: 2.5,
      happyT: 0,
      jumpAgeT: 0,
    },

    obstacles: createPool<Obstacle>(24, () => ({
      kind: "box" as ObstacleKind,
      x: 0,
      y: 0,
    })),
    pickups: createPool(48, () => ({
      kind: "heart" as PickupKind,
      x: 0,
      y: 0,
      phase: 0,
    })),
    particles: createPool(256, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 1,
      r: 1,
      g: 1,
      b: 1,
      drag: 0,
      gravity: 0,
    })),
    floaters: createPool(12, () => ({
      x: 0,
      y: 0,
      life: 0,
      maxLife: 1,
      amount: 0,
      kind: "score" as FloaterKind,
    })),
    events: [],
  };
}

export function resetWorld(world: WorldState): void {
  const best = world.best;
  const fresh = createWorld(best);
  Object.assign(world, fresh);
}
```

### FILE: portfolio/projects/kitty-run/web/scene/step.ts (FULL)
```ts
// The simulation step: one call advances the whole run. Pure TypeScript —
// pools, tuning and the ground function in, mutated world out. Rendering
// and sound only read what this leaves behind.

import { groundY } from "../lib/ground.ts";
import {
  BOX_HALF,
  HOVER_RADIUS,
  PICKUP_RADIUS,
  TALL_HALF,
  buildChunk,
  chunkSeed,
  isHazard,
  nextChunkOrigin,
} from "../lib/spawn.ts";
import { COMBO_WINDOW, fullHealthBonus, healsHeart, pickupScore } from "../lib/score.ts";
import { TUNING, speedFor } from "../lib/tuning.ts";
import type { Obstacle, PickupKind, WorldState } from "./world.ts";

export { startRun, restartRun, togglePause } from "./actions.ts";

const SPAWN_AHEAD = 46;
const DESPAWN_BEHIND = 18;
// Metres until the pattern mix reaches its hardest weights. Short enough
// that a decent run meets real resistance inside its first minute.
const DIFFICULTY_SPAN = 650;

// Attract mode: while the start screen is up the world drifts forward so
// the scene is already alive before the first click.
function idleAdvance(world: WorldState, dt: number): void {
  world.time += dt;
  world.distance += dt * 3.4;
  world.speed = 3.4;
  world.kitty.runPhase += dt * 10;
  world.kitty.grounded = true;
  world.kitty.y = groundY(world.distance);
  world.kitty.blinkNext -= dt;
  if (world.kitty.blinkNext <= 0) {
    world.kitty.blinkShut = 0.11;
    world.kitty.blinkNext = 2.2 + Math.random() * 2.6;
  }
  world.kitty.blinkShut = Math.max(0, world.kitty.blinkShut - dt);
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function circleHitsBox(
  cx: number,
  cy: number,
  r: number,
  bx: number,
  by: number,
  half: number,
): boolean {
  return circleHitsRect(cx, cy, r, bx, by, half, half);
}

function circleHitsRect(
  cx: number,
  cy: number,
  r: number,
  bx: number,
  by: number,
  halfW: number,
  halfH: number,
): boolean {
  const nearestX = clamp(cx, bx - halfW, bx + halfW);
  const nearestY = clamp(cy, by - halfH, by + halfH);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

function circleHitsCircle(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy < rr * rr;
}

function obstacleHalf(kind: Obstacle["kind"]): number {
  return kind === "box" ? BOX_HALF : TALL_HALF;
}

function fireDash(world: WorldState): void {
  const k = world.kitty;
  k.dashT = TUNING.dashDuration;
  k.dashCd = TUNING.dashCooldown + TUNING.dashDuration;
  world.shake = Math.min(1, world.shake + 0.16);
  // Bullet time: the clock dips from the NEXT step on — this step
  // finishes at full speed, so the dash's own launch stays snappy.
  world.timeScale = TUNING.bulletTimeScale;
  world.events.push({ type: "dash" });
}

function spawnChunk(world: WorldState): void {
  const difficulty = Math.min(1, world.distance / DIFFICULTY_SPAN);
  const chunk = buildChunk(
    chunkSeed(world.runSeed, world.chunkIndex),
    world.spawnOrigin,
    difficulty,
    world.speed,
  );
  for (const item of chunk.items) {
    if (isHazard(item.kind)) {
      const slot = world.obstacles.acquire();
      if (!slot) continue;
      slot.data.kind = item.kind as Obstacle["kind"];
      slot.data.x = item.x;
      slot.data.y = item.y;
    } else {
      const slot = world.pickups.acquire();
      if (!slot) continue;
      slot.data.kind = item.kind as PickupKind;
      slot.data.x = item.x;
      slot.data.y = item.y;
      slot.data.phase = item.x * 1.7;
    }
  }
  world.chunkIndex += 1;
  world.spawnOrigin += nextChunkOrigin(chunk, world.spawnOrigin, world.speed);
}

export function stepWorld(world: WorldState, rawDt: number): void {
  if (world.status === "ready") {
    idleAdvance(world, rawDt);
    return;
  }
  if (world.status !== "running") return;

  // Hit-stop freezes the whole simulation for a few frames — the hit lands,
  // everything else holds its breath.
  if (world.hitStop > 0) {
    world.hitStop -= rawDt;
    return;
  }

  const dt = Math.min(rawDt, 0.05);
  const k = world.kitty;
  world.time += dt;

  // --- forward motion -------------------------------------------------------

  world.speed = speedFor(world.distance);
  const boost = k.dashT > 0 ? TUNING.dashBoost : 0;
  const travel = (world.speed + boost) * dt;
  world.distance += travel;
  k.runPhase += dt * (6 + world.speed * 0.9);

  // Distance alone ticks one point per metre, so the counter always
  // breathes even between pickups.
  const wholeMeters = Math.floor(world.distance);
  if (wholeMeters > world.scoredDistance) {
    world.score += wholeMeters - world.scoredDistance;
    world.scoredDistance = wholeMeters;
  }

  // Milestones: crossing a step raises the celebration exactly once.
  if (world.distance >= world.nextMilestone) {
    const meters = world.nextMilestone;
    world.nextMilestone += TUNING.milestoneStep;
    world.events.push({ type: "milestone", meters });
  }

  // --- input ----------------------------------------------------------------

  if (world.jumpQueued) {
    world.jumpQueued = false;
    if (k.grounded || k.coyote > 0) {
      k.vy = TUNING.jumpV;
      k.grounded = false;
      k.coyote = 0;
      k.jumpsUsed = 1;
      // Birth certificate of this arc: the dash's fresh-jump cancel only
      // rescues jumps younger than TUNING.jumpCancelWindow.
      k.jumpAgeT = 0;
      k.squash = Math.min(k.squash, 0) - 0.28;
      world.events.push({ type: "jump" });
    } else if (k.jumpsUsed < TUNING.maxJumps) {
      k.vy = TUNING.doubleJumpV;
      k.jumpsUsed = TUNING.maxJumps;
      k.squash = Math.min(k.squash, 0) - 0.22;
      world.events.push({ type: "doubleJump" });
    }
  }

  if (world.dashQueued) {
    world.dashQueued = false;
    if (k.dashCd <= 0) {
      fireDash(world);
    } else {
      // Pressed while cooling down: hold the press briefly and fire it
      // the moment the dash comes back (see TUNING.dashBuffer).
      k.dashBufferT = TUNING.dashBuffer;
    }
  } else if (k.dashBufferT > 0 && k.dashCd <= 0) {
    // The buffered press releases the instant the cooldown ends.
    k.dashBufferT = 0;
    fireDash(world);
  }

  // --- vertical physics -----------------------------------------------------

  const gy = groundY(world.distance);
  k.vy -= TUNING.gravity * dt;
  k.y += k.vy * dt;
  if (k.y <= gy) {
    if (!k.grounded) {
      k.squash = Math.min(0.6, k.squash + 0.34 + clamp(-k.vy * 0.012, 0, 0.2));
      // Normalised fall speed at touchdown: a full jump fall reads as 1.
      const impact = Math.min(1, Math.max(0, -k.vy / TUNING.jumpV));
      world.events.push({ type: "land", impact });
    }
    k.y = gy;
    k.vy = 0;
    k.grounded = true;
    k.jumpsUsed = 0;
    k.coyote = TUNING.coyoteTime;
  } else {
    k.grounded = false;
    k.coyote = Math.max(0, k.coyote - dt);
  }

  // Landing spring and cosmetic timers.
  k.squash -= k.squash * Math.min(1, 9 * dt);
  k.dashT = Math.max(0, k.dashT - dt);
  k.dashCd = Math.max(0, k.dashCd - dt);
  k.dashBufferT = Math.max(0, k.dashBufferT - dt);
  k.invulnT = Math.max(0, k.invulnT - dt);
  k.happyT = Math.max(0, k.happyT - dt);
  k.jumpAgeT = Math.min(10, k.jumpAgeT + dt);
  k.blinkNext -= dt;
  if (k.blinkNext <= 0) {
    k.blinkShut = 0.11;
    k.blinkNext = 2.2 + Math.random() * 2.6;
  }
  k.blinkShut = Math.max(0, k.blinkShut - dt);

  // --- combo ------------------------------------------------------------------

  if (world.combo > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }

  // --- spawning and despawning -------------------------------------------------

  while (world.spawnOrigin < world.distance + SPAWN_AHEAD) {
    spawnChunk(world);
  }
  for (const slot of world.obstacles.slots) {
    if (slot.active && slot.data.x - world.distance < -DESPAWN_BEHIND) {
      slot.active = false;
    }
  }
  for (const slot of world.pickups.slots) {
    if (slot.active && slot.data.x - world.distance < -DESPAWN_BEHIND) {
      slot.active = false;
    }
  }

  // --- collisions ---------------------------------------------------------------

  const kx = 0;
  const ky = k.y + TUNING.kittyCenterLift;
  const kr = TUNING.kittyRadius;

  if (k.invulnT <= 0 && k.dashT <= 0) {
    for (const slot of world.obstacles.slots) {
      if (!slot.active) continue;
      const o = slot.data;
      const vx = o.x - world.distance;
      if (vx < -2.6 || vx > 2.6) continue;
      const hit =
        o.kind === "hover"
          ? circleHitsCircle(kx, ky, kr, vx, o.y, HOVER_RADIUS)
          : circleHitsBox(kx, ky, kr, vx, o.y, obstacleHalf(o.kind));
      if (!hit) continue;

      world.hearts -= 1;
      k.invulnT = TUNING.invulnTime;
      k.vy = Math.max(k.vy, TUNING.knockbackV);
      k.grounded = false;
      world.combo = 0;
      world.comboTimer = 0;
      world.shake = Math.min(1.2, world.shake + 0.75);
      world.hitStop = TUNING.hitStopTime;
      world.hitFlash = 1;
      world.events.push({ type: "hit" });
      if (world.hearts <= 0) {
        world.hearts = 0;
        world.newBest = world.score > world.best;
        world.best = Math.max(world.best, world.score);
        world.status = "over";
        world.events.push({ type: "gameover" });
      }
      break;
    }
  }

  for (const slot of world.pickups.slots) {
    if (!slot.active) continue;
    const p = slot.data;
    const vx = p.x - world.distance;
    if (vx < -1.6 || vx > 1.6) continue;
    const vy = p.y + Math.sin(world.time * 2.4 + p.phase) * 0.09;
    if (!circleHitsCircle(kx, ky, kr, vx, vy, PICKUP_RADIUS + 0.25)) continue;

    const gained = pickupScore(p.kind, world.combo);
    world.score += gained;
    world.combo += 1;
    world.comboTimer = COMBO_WINDOW;
    k.happyT = 0.5;

    // Hearts mend first; with the meter full they convert to bonus points
    // so the pickup never lands silently.
    const mends = healsHeart(p.kind) && world.hearts < TUNING.maxHearts;
    let bonus = 0;
    if (mends) {
      world.hearts = Math.min(TUNING.maxHearts, world.hearts + 1);
      world.heartPulseT = 0.4;
    } else if (healsHeart(p.kind)) {
      bonus = fullHealthBonus(p.kind);
      world.score += bonus;
    }

    world.events.push({
      type: "pickup",
      pickup: p.kind,
      score: gained,
      combo: world.combo,
      healed: mends,
      bonus,
    });
    slot.active = false;
  }

  // --- decay ----------------------------------------------------------------------

  // Bullet-time recovery: exponential ease back to full speed in sim
  // time, so the slow-mo tail stretches in real time exactly as much as
  // the world itself is slowed — the classic "time wells back up" feel.
  world.timeScale += (1 - world.timeScale) * Math.min(1, TUNING.bulletRecovery * dt);
  world.shake = Math.max(0, world.shake - dt * 2.1);
  world.hitFlash = Math.max(0, world.hitFlash - dt * 2.6);
  world.heartPulseT = Math.max(0, world.heartPulseT - dt);
  for (const slot of world.floaters.slots) {
    if (!slot.active) continue;
    const f = slot.data;
    f.life -= dt;
    f.y += dt * 1.1;
    if (f.life <= 0) slot.active = false;
  }
}
```

### FILE: portfolio/projects/kitty-run/web/scene/GameLoop.tsx (FULL)
```tsx
// One useFrame to rule the run: step the world, then react to its events —
// sound, particle bursts, score floaters, HUD writes. React state only
// hears about status changes, which happen once per screen.

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { COMBO_WINDOW, writeBestScore } from "../lib/score.ts";
import { saveReplayIfBest, type RunInput } from "../lib/replay.ts";
import { TUNING } from "../lib/tuning.ts";
import { buzz } from "../lib/haptics.ts";
import type { Sfx } from "../lib/audio.ts";
import type { Soundtrack } from "../lib/music.ts";
import { clampInto, stageSpan } from "../lib/framing.ts";
import {
  hexRgb,
  dashTrail,
  dustPuff,
  sparkBurst,
  speedLine,
  type Rgb,
} from "./bursts.ts";
import { releaseJump, requestDash, requestJump } from "./actions.ts";
import { pilotSteer } from "../lib/pilot.ts";
import { THEMES, type CharacterId } from "../lib/theme.ts";
import { stepWorld } from "./step.ts";
import type { GameStatus, WorldState } from "./world.ts";

export type HudRefs = {
  score: React.RefObject<HTMLSpanElement | null>;
  hearts: React.RefObject<HTMLDivElement | null>;
  combo: React.RefObject<HTMLSpanElement | null>;
  comboBar: React.RefObject<HTMLDivElement | null>;
  milestone: React.RefObject<HTMLDivElement | null>;
  // The touch dash pad: the loop paints its cooldown ring every frame.
  dash?: React.RefObject<HTMLButtonElement | null>;
  // Bullet-time vignette: opacity follows the clock's dip.
  bullet?: React.RefObject<HTMLDivElement | null>;
  debug?: React.RefObject<HTMLSpanElement | null>;
};

const DASH_TAIL_TIME = 0.12;

// One particle-burst colour set per theme, built once at module scope from
// the theme palettes — a character switch just picks a different record.
type BurstColors = {
  heart: Rgb;
  star: Rgb;
  heal: Rgb;
  hit: Rgb;
};

function burstColors(character: CharacterId): BurstColors {
  const p = THEMES[character].palette;
  return {
    heart: hexRgb(p.heart),
    star: hexRgb(p.star),
    heal: hexRgb(p.healBurst),
    hit: hexRgb(p.star),
  };
}

const BURST_RGB: Record<CharacterId, BurstColors> = {
  kitty: burstColors("kitty"),
  souls: burstColors("souls"),
};

function emitFloater(
  world: WorldState,
  x: number,
  y: number,
  kind: "score" | "heal" | "hurt" | "bonus",
  amount: number,
): void {
  const slot = world.floaters.acquire();
  if (!slot) return;
  slot.data.x = x;
  slot.data.y = y + 0.55;
  slot.data.life = 0.9;
  slot.data.maxLife = 0.9;
  slot.data.amount = amount;
  slot.data.kind = kind;
}

function handleEvents(
  world: WorldState,
  sfx: Sfx | null,
  track: Soundtrack | null,
  reducedMotion: boolean,
  hud: HudRefs,
  colors: BurstColors,
): void {
  for (const event of world.events) {
    const k = world.kitty;
    switch (event.type) {
      case "jump":
        sfx?.jump();
        dustPuff(world, 0, k.y, reducedMotion ? 3 : 6);
        break;
      case "doubleJump":
        sfx?.doubleJump();
        sparkBurst(world, 0, k.y + 0.4, reducedMotion ? 4 : 8, colors.heart, 2.2);
        break;
      case "land":
        sfx?.land(event.impact);
        dustPuff(world, 0, k.y, reducedMotion ? 2 : 5);
        break;
      case "dash":
        sfx?.dash();
        break;
      case "milestone": {
        sfx?.milestone();
        // A celebration deserves a cleared stage: the bed ducks while the
        // fanfare rings, exactly as it flinches on a hit.
        track?.duck();
        if (!reducedMotion) buzz([14, 42, 14]);
        sparkBurst(world, 0, k.y + 1.3, reducedMotion ? 6 : 16, colors.heart, 4);
        sparkBurst(world, 0, k.y + 1.1, reducedMotion ? 4 : 10, colors.star, 2.8);
        if (hud.milestone.current) {
          const node = hud.milestone.current;
          node.textContent = `${event.meters} m!`;
          const travel = (dy: number): Keyframe[] => [
            { opacity: 0, transform: `translate(-50%, ${dy}px) scale(0.7)` },
            { opacity: 1, transform: "translate(-50%, 0) scale(1)", offset: 0.18 },
            { opacity: 1, transform: "translate(-50%, 0) scale(1)", offset: 0.72 },
            { opacity: 0, transform: `translate(-50%, ${-dy}px) scale(1)` },
          ];
          // Reduced motion gets a plain cross-fade: no drift, no scale.
          const frames: Keyframe[] = reducedMotion
            ? [
                { opacity: 0 },
                { opacity: 1, offset: 0.2 },
                { opacity: 1, offset: 0.7 },
                { opacity: 0 },
              ]
            : travel(10);
          node.animate(frames, {
            duration: reducedMotion ? 900 : 1700,
            easing: "ease",
          });
        }
        break;
      }
      case "hit":
        sfx?.hit();
        track?.duck();
        if (!reducedMotion) buzz(70);
        sparkBurst(world, 0, k.y + 0.8, reducedMotion ? 6 : 14, colors.hit, 4.2);
        emitFloater(world, 0, k.y + 0.8, "hurt", 1);
        break;
      case "pickup": {
        const color: Rgb =
          event.pickup === "star"
            ? colors.star
            : event.pickup === "heal"
              ? colors.heal
              : colors.heart;
        sfx?.pickup(event.combo);
        if (event.healed) {
          sfx?.heal();
          if (!reducedMotion) buzz(16);
        }
        sparkBurst(world, 0, k.y + 0.9, reducedMotion ? 5 : 10, color, 3);
        if (event.healed) {
          emitFloater(world, 0, k.y + 0.9, "heal", 1);
        } else if (event.bonus > 0) {
          emitFloater(world, 0, k.y + 0.9, "bonus", event.bonus);
        } else {
          emitFloater(world, 0, k.y + 0.9, "score", event.score);
        }
        break;
      }
      case "gameover":
        sfx?.gameover();
        if (!reducedMotion) buzz([90, 50, 150]);
        // An autopilot exhibition never touches the visitor's records:
        // no best score, no echo replay — the bot's perfect run would
        // otherwise chase every human run forever.
        if (!world.autopilot) {
          writeBestScore(window.localStorage, world.best);
          // The finished run becomes (or fails to become) the echo future
          // runs will chase — seed plus timed inputs is the whole recipe.
          saveReplayIfBest(window.localStorage, {
            seed: world.runSeed,
            score: world.score,
            distance: world.distance,
            inputs: world.inputLog,
          });
        }
        break;
    }
  }
  world.events.length = 0;
}

function writeHud(world: WorldState, hud: HudRefs): void {
  if (hud.score.current) {
    hud.score.current.textContent = String(world.score);
  }
  if (hud.hearts.current) {
    const children = hud.hearts.current.children;
    for (let i = 0; i < children.length; i += 1) {
      children[i].classList.toggle("is-empty", i >= world.hearts);
      children[i].classList.toggle(
        "is-hurt",
        world.hearts === i + 1 && world.kitty.invulnT > 0.9,
      );
      children[i].classList.toggle(
        "is-gain",
        world.heartPulseT > 0 && i + 1 === world.hearts,
      );
    }
  }
  if (hud.combo.current) {
    const multiplier =
      world.combo >= 4 ? 1 + Math.min(7, Math.floor(world.combo / 4)) : 0;
    hud.combo.current.textContent = multiplier > 0 ? `×${multiplier}` : "";
    hud.combo.current.classList.toggle("is-live", multiplier > 0);
  }
  if (hud.comboBar.current) {
    const fraction = world.combo > 0 ? Math.max(0, world.comboTimer / COMBO_WINDOW) : 0;
    hud.comboBar.current.style.transform = `scaleX(${fraction})`;
  }
  if (hud.dash?.current) {
    // --cd reads 1 (just dashed) → 0 (ready); the ring's filled arc is
    // drawn as 1 - cd, so it sweeps closed as the dash comes back.
    const button = hud.dash.current;
    const cd = Math.min(
      1,
      Math.max(0, world.kitty.dashCd / (TUNING.dashCooldown + TUNING.dashDuration)),
    );
    button.style.setProperty("--cd", cd.toFixed(3));
    button.classList.toggle("is-cooling", cd > 0);
  }
  if (hud.bullet?.current) {
    const depth = Math.max(0, Math.min(1, (1 - world.timeScale) * 1.15));
    hud.bullet.current.style.opacity = depth.toFixed(3);
  }
  if (hud.debug?.current) {
    hud.debug.current.textContent = `${world.status} · ${world.distance.toFixed(0)}m · obs ${world.obstacles.slots.filter((s) => s.active).length}`;
  }
}

export function GameLoop({
  world,
  echo,
  echoInputs,
  sfxRef,
  trackRef,
  mutedRef,
  hud,
  reducedMotion,
  character,
  onStatus,
}: {
  world: WorldState;
  // The simulated best-run world and its recorded inputs. Both come from
  // storage; either may be absent (first visit, private mode, corrupt
  // data) — the run then simply has no echo.
  echo?: WorldState | null;
  echoInputs?: RunInput[];
  sfxRef: React.RefObject<Sfx | null>;
  // The adaptive soundtrack, when its AudioContext exists (first gesture
  // onward). The loop conducts it once per frame.
  trackRef?: React.RefObject<Soundtrack | null>;
  // Live mute flag via ref: the value is read frame-by-frame, so flipping
  // it never re-renders the canvas subtree.
  mutedRef: { current: boolean };
  hud: HudRefs;
  reducedMotion: boolean;
  character: CharacterId;
  onStatus: (status: GameStatus) => void;
}) {
  const prevStatus = useRef<GameStatus>(world.status);
  const dustTimer = useRef(0);
  const trotTimer = useRef(0);
  const feedCursor = useRef(0);
  const prevEchoStatus = useRef<GameStatus>("running");
  // The launch gate: the echo stays in the wings until the player opens
  // the tuned lead, then chases for the rest of the run. A plain flag —
  // reset when the next race's echo object arrives.
  const echoLaunched = useRef(false);

  useEffect(() => {
    onStatus(world.status);
  }, [onStatus, world]);

  // A new echo object means a new race: rewind the feeder.
  useEffect(() => {
    feedCursor.current = 0;
    prevEchoStatus.current = "running";
    echoLaunched.current = false;
  }, [echo]);

  useFrame((state, delta) => {
    // Autopilot: the lookahead pilot reads the world and sets the same
    // input flags a player would, one decision per frame, right before
    // the step consumes them.
    if (world.autopilot && world.status === "running" && world.hitStop <= 0) {
      pilotSteer(world);
    }

    // One clock for the whole frame: the sim's own timeScale (dipped by
    // a dash, eased back in step.ts) scales every delta below — player,
    // echo, particles, dust. The world breathes in slow motion together.
    // The step ceiling is ~1.5 normal frames: a hitched frame (WebKit
    // hitches ~100-150ms on header clicks — re-render + audio scheduling)
    // used to spend the whole 0.05s ceiling at once, and the distance-
    // driven world visibly lurched for one frame. At 0.025 a stall reads
    // as a held breath, not a jerk; sustained stalls slow-mo the sim,
    // which beats teleporting the skyline.
    const sdt = Math.min(delta * world.timeScale, 0.025);

    stepWorld(world, sdt);

    // The echo lives in its own deterministic simulation — same seed as
    // this track, same physics, its recorded inputs. Stepping both with
    // one dt keeps them in lockstep through pauses and hit-stop; the
    // distance gate is the handicap start (see TUNING.echoGapMetres).
    if (
      echo &&
      echoInputs &&
      world.status === "running" &&
      world.hitStop <= 0
    ) {
      if (echoLaunched.current || world.distance >= TUNING.echoGapMetres) {
        echoLaunched.current = true;
        const gdt = Math.min(sdt, 0.05);
        while (
          feedCursor.current < echoInputs.length &&
          echoInputs[feedCursor.current].t <= echo.time + gdt
        ) {
          const inp = echoInputs[feedCursor.current++];
          if (inp.kind === "jump") requestJump(echo);
          else if (inp.kind === "release") releaseJump(echo);
          else requestDash(echo);
        }
        // The echo steps with the same scaled delta: its own timeScale
        // dips when its replayed dash fires, so both sims stay in exact
        // lockstep through every slow-motion stretch.
        stepWorld(echo, sdt);
        // Nobody consumes the echo's cosmetic events; drain or they pile up.
        echo.events.length = 0;
        if (prevEchoStatus.current === "running" && echo.status !== "running") {
          const span = stageSpan(
            state.size.width / Math.max(1, state.size.height),
          );
          const gx = clampInto(
            echo.distance - world.distance,
            span,
            0.5,
          );
          dustPuff(world, gx, echo.kitty.y, reducedMotion ? 3 : 7);
        }
        prevEchoStatus.current = echo.status;
      }
    }

    // Dash trail runs every frame while dashing, not as a one-off event.
    if (world.kitty.dashT > 0 && !reducedMotion) {
      dashTrail(world, 0, world.kitty.y + 0.75);
      if (world.kitty.dashT > DASH_TAIL_TIME) dashTrail(world, 0, world.kitty.y + 0.4);
    }

    // Bullet-time streaks: while the clock is dipped, pale lines tear
    // backward past the cat. Emission is per real frame, so the slow
    // world fills with fast light — the contrast is the effect.
    if (!reducedMotion && world.status === "running" && world.timeScale < 0.85) {
      speedLine(world, world.kitty.y + 0.2 + Math.random() * 1.9);
      speedLine(world, world.kitty.y + 0.2 + Math.random() * 1.9);
    }

    // A soft trot of dust while grounded keeps the run feeling weighted.
    dustTimer.current -= sdt;
    if (
      !reducedMotion &&
      world.status === "running" &&
      world.kitty.grounded &&
      dustTimer.current <= 0
    ) {
      dustTimer.current = 0.14;
      dustPuff(world, 0, world.kitty.y, 1);
    }

    // Footstep taps ride their own cadence (audio is not reduced away with
    // the motion), quickening with speed, alternating stereo paws.
    trotTimer.current -= sdt;
    if (world.status === "running" && world.kitty.grounded && trotTimer.current <= 0) {
      const speedNorm = Math.min(
        1,
        Math.max(0, (world.speed - TUNING.speedStart) / (TUNING.speedMax - TUNING.speedStart)),
      );
      trotTimer.current = 0.15 - 0.06 * speedNorm;
      if (!mutedRef.current) sfxRef.current?.trot(speedNorm);
    }

    handleEvents(
      world,
      mutedRef.current ? null : sfxRef.current,
      mutedRef.current ? null : trackRef?.current ?? null,
      reducedMotion,
      hud,
      BURST_RGB[character],
    );
    // The soundtrack conducts itself from the live world every frame —
    // tempo from speed, layers from intensity, silence from state.
    trackRef?.current?.update(world, mutedRef.current);
    writeHud(world, hud);

    if (prevStatus.current !== world.status) {
      prevStatus.current = world.status;
      onStatus(world.status);
    }
  });

  return null;
}
```

### FILE: portfolio/projects/kitty-run/web/KittyRunPage.tsx (relevant excerpts only)
The page owns React state; HUD numbers are refs written by GameLoop. Excerpt 1
— refs and the hud record:
```tsx
  const sfxRef = useRef<Sfx | null>(null);
  // The adaptive soundtrack rides the same AudioContext as the sfx; it
  // is created lazily inside the first user gesture, beside the sfx.
  const trackRef = useRef<Soundtrack | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLSpanElement | null>(null);
  const heartsRef = useRef<HTMLDivElement | null>(null);
  const comboRef = useRef<HTMLSpanElement | null>(null);
  const comboBarRef = useRef<HTMLDivElement | null>(null);
  const milestoneRef = useRef<HTMLDivElement | null>(null);
  const dashRef = useRef<HTMLButtonElement | null>(null);
  const bulletRef = useRef<HTMLDivElement | null>(null);
  const debugRef = useRef<HTMLSpanElement | null>(null);

  const hud: HudRefs = useMemo(
    () => ({
      score: scoreRef,
      hearts: heartsRef,
      combo: comboRef,
      comboBar: comboBarRef,
      milestone: milestoneRef,
      dash: dashRef,
      bullet: bulletRef,
      debug: debugRef,
    }),
    [],
  );
```
Excerpt 2 — the HUD markup (inside the stage fragment, after a
`.kitty-run-bullet` div and around the dash/pilot buttons):
```tsx
      <div className="kitty-run-hud">
        <div className="kitty-run-hearts" ref={heartsRef} aria-hidden="true">
          <span className="kitty-run-heart" />
          <span className="kitty-run-heart" />
          <span className="kitty-run-heart" />
        </div>
        <div className="kitty-run-right">
          <div className="kitty-run-score-box">
            <span className="kitty-run-score" ref={scoreRef}>
              0
            </span>
            <span className="kitty-run-best">
              {theme.text.best} {best}
            </span>
          </div>
          {status === "running" && (
            <button
              type="button"
              className="kitty-run-pause"
              aria-label="Pause the run"
              onPointerDown={(event) => event.stopPropagation()}
              onMouseEnter={uiHover}
              onClick={() => {
                uiClick();
                togglePause(world);
              }}
            />
          )}
        </div>
        <div className="kitty-run-combo">
          <span ref={comboRef} />
          <div className="kitty-run-combo-track">
            <div className="kitty-run-combo-bar" ref={comboBarRef} />
          </div>
        </div>
        <div className="kitty-run-milestone" ref={milestoneRef} aria-hidden="true" />
        <span
          className={`kitty-run-debug${debugOn ? " is-visible" : ""}`}
          ref={debugRef}
        />
      </div>
```
(the dash pad button and the autopilot pilot chip render between the
milestone div and the debug span; not shown — they don't change here.)

Excerpt 3 — the game-over card (the "m run" stat and the race comparison):
```tsx
      {status === "over" && (
        <div className="kitty-run-overlay">
          <button
            type="button"
            className="kitty-run-card kitty-run-card--over"
            onMouseEnter={uiHover}
            onClick={handleRestart}
          >
            <span className="kitty-run-card-kicker">{theme.text.overKicker}</span>
            {world.newBest && world.score > 0 && (
              <span className="kitty-run-card-badge">{theme.text.overBadge}</span>
            )}
            <span className="kitty-run-card-title">
              {world.score.toLocaleString()} points
            </span>
            <span className="kitty-run-card-stat">
              {Math.floor(world.distance).toLocaleString()} m run
            </span>
            {autoRan && (
              <span className="kitty-run-card-echo">
                flown by the engine's test pilot — your records untouched
              </span>
            )}
            {raceTarget && (
              <span className="kitty-run-card-echo">
                {world.distance >= raceTarget.distance
                  ? `${Math.max(1, Math.round(world.distance - raceTarget.distance))} m past your best mark`
                  : `${Math.max(1, Math.round(raceTarget.distance - world.distance))} m short of your best mark`}
              </span>
            )}
            <span className="kitty-run-card-hint">
              {theme.text.best} {best} · {coarse ? "tap to run again" : "space or r runs again"}
            </span>
            <span className="kitty-run-card-action">{theme.text.overAction}</span>
          </button>
        </div>
      )}
```

### FILE: portfolio/projects/kitty-run/web/lib/audio.ts (excerpts — enough to write voices)
Class shape: `class Sfx { private ctx; private master; private sfxBus; private
musicBus; private noiseBuffer; private readonly SFX_MODES: Record<SfxMode,
VoiceSet> = { kitty: this.buildKittyVoices(), souls: this.buildSoulsVoices() };
private mode: SfxMode = "kitty"; private voiceSet = this.SFX_MODES.kitty;
setMode(mode) { this.mode = mode; this.voiceSet = this.SFX_MODES[mode]; } }`
— public methods are one-line delegates: `pickup(combo)` →
`this.voiceSet.pickup(combo)`, etc. Both register builders return complete
`VoiceSet` literals closing over `this`.

```ts
export type SfxMode = "kitty" | "souls";

type VoiceSet = {
  jump(): void;
  doubleJump(): void;
  dash(): void;
  land(impact: number): void;
  pickup(combo: number): void;
  heal(): void;
  milestone(): void;
  hit(): void;
  gameover(): void;
  runStart(): void;
  uiClick(): void;
  uiHover(): void;
  trot(speedNorm: number): void;
};

// Kitty pickup ladder: major pentatonic from C5. The combo index walks these
// semitone offsets, wrapping up an octave each lap so long combos keep climbing.
const PENTATONIC = [0, 2, 4, 7, 9];
const PICKUP_BASE_HZ = 523.25;

// Souls pickup ladder: minor pentatonic from A4 — same climbing idea, lower
// and darker. Souls absorbed, not coins collected.
const SOULS_PENTATONIC = [0, 3, 5, 7, 10];
const SOULS_PICKUP_BASE_HZ = 440;

type ToneOptions = {
  type: OscillatorType;
  from: number;
  to?: number;        // exponential frequency sweep to this Hz
  at?: number;        // seconds from now
  duration: number;
  volume: number;
  attack?: number;    // default 0.004
  detune?: number;    // cents; adds a second detuned oscillator for warmth
  pan?: number;       // -1..1
  filter?: { type: BiquadFilterType; freq: number; q?: number };
};

type NoiseOptions = {
  duration: number;
  volume: number;
  filterType: BiquadFilterType;
  from: number;
  to?: number;
  q?: number;
  at?: number;
  pan?: number;
};

type RingOptions = {
  partials: number[]; // absolute Hz; inharmonic stacks read as struck metal
  duration: number;
  volume: number;
  at?: number;
  pan?: number;
};
```
Helpers: `tone(options)` — one oscillator (optionally a detuned twin) with
snappy attack + exponential tail, optional filter/pan, into sfxBus.
`noiseBurst(options)` — swept filtered white noise from ONE cached 1 s
buffer, random read offset (no per-call allocation). `ring(options)` —
stack of sine partials, each 0.62^i quieter and 18% shorter per index
(souls struck-metal helper).

Current voices being replaced:
```ts
// KITTY pickup — body + delayed fifth + fast octave bell partial:
pickup: (combo: number) => {
  const step =
    PENTATONIC[combo % PENTATONIC.length] +
    Math.floor(combo / PENTATONIC.length) * 12;
  const hz = PICKUP_BASE_HZ * Math.pow(2, Math.min(24, step) / 12);
  this.tone({ type: "sine", from: hz, duration: 0.16, volume: 0.16 });
  this.tone({ type: "sine", from: hz * 1.5, at: 0.04, duration: 0.14, volume: 0.09 });
  this.tone({ type: "sine", from: hz * 2, duration: 0.09, volume: 0.06 });
},
// KITTY heal (unchanged, for register context):
heal: () => {
  this.tone({
    type: "triangle",
    from: 392,
    to: 523,
    duration: 0.18,
    volume: 0.14,
    attack: 0.004,
  });
  this.tone({
    type: "triangle",
    from: 523,
    to: 659,
    at: 0.09,
    duration: 0.2,
    volume: 0.14,
    attack: 0.004,
  });
},

// SOULS dash — "heavy roll" (KEPT; shown only for the roll-bug context):
dash: () => {
  this.noiseBurst({
    duration: 0.4,
    volume: 0.16,
    filterType: "lowpass",
    from: 700,
    to: 110,
    pan: -0.15,
  });
  this.tone({ type: "sine", from: 90, to: 48, duration: 0.32, volume: 0.09 });
  [0.06, 0.15, 0.25].forEach((at, i) => {
    this.noiseBurst({
      duration: 0.04,
      volume: 0.045,
      filterType: "bandpass",
      from: 820 - 140 * i,
      q: 2,
      at,
      pan: i % 2 === 0 ? -0.2 : 0.2,
    });
  });
},
// SOULS land — the armored thump being debounced (context only):
land: (impact: number) => {
  const i = Math.min(1, Math.max(0, impact));
  this.tone({
    type: "sine",
    from: 120 + 40 * i,
    to: 55,
    duration: 0.09 + 0.07 * i,
    volume: 0.07 + 0.09 * i,
  });
  this.ring({
    partials: [720, 1130, 1580],
    duration: 0.05 + 0.08 * i,
    volume: 0.012 + 0.03 * i,
    at: 0.005,
  });
  this.noiseBurst({
    duration: 0.07,
    volume: 0.04 + 0.05 * i,
    filterType: "lowpass",
    from: 420,
    to: 160,
  });
},

// SOULS pickup — glassy sine, soft attack, breathy rising tail:
pickup: (combo: number) => {
  const step =
    SOULS_PENTATONIC[combo % SOULS_PENTATONIC.length] +
    Math.floor(combo / SOULS_PENTATONIC.length) * 12;
  const hz = SOULS_PICKUP_BASE_HZ * Math.pow(2, Math.min(24, step) / 12);
  this.tone({ type: "sine", from: hz, duration: 0.26, volume: 0.1, attack: 0.02 });
  this.tone({ type: "sine", from: hz * 1.5, at: 0.06, duration: 0.22, volume: 0.05, attack: 0.02 });
  this.noiseBurst({
    duration: 0.3,
    volume: 0.02,
    filterType: "bandpass",
    from: hz * 2,
    to: hz * 4,
    q: 3,
    at: 0.02,
  });
},
// SOULS heal (unchanged, "estus" — context only):
heal: () => {
  this.tone({
    type: "triangle",
    from: 180,
    to: 320,
    duration: 0.25,
    volume: 0.09,
    attack: 0.06,
    filter: { type: "lowpass", freq: 700 },
  });
  this.noiseBurst({ duration: 0.22, volume: 0.02, filterType: "lowpass", from: 600, to: 250, at: 0.02 });
  this.tone({ type: "sine", from: 1760, at: 0.1, duration: 0.07, volume: 0.035 });
},
```
The event call site (GameLoop): `sfx?.pickup(event.combo);` — it will become
`sfx?.pickup(event.pickup, event.combo);` (integrator applies).

### FILE: portfolio/projects/kitty-run/tests/kitty-run.sim.ts (excerpt — the milestone pin)
```ts
let milestonesOnceEach = run.milestoneMeters.length > 0;
for (let i = 1; i < run.milestoneMeters.length; i += 1) {
  if (run.milestoneMeters[i] <= run.milestoneMeters[i - 1]) milestonesOnceEach = false;
}

check(
  "milestones fire once each, in order",
  milestonesOnceEach &&
    run.milestoneMeters.length === Math.floor(w.distance / 500),
);
```
The harness also asserts seeded runs replay identically (determinism), no NaN
drift, and no unknown hazard kinds. `check.ts` has NO milestone/land pins.
The sim harness steps the real `stepWorld` with the lookahead bot.

## §5 Deliverables — produce ALL three, in order

### Deliverable 2 — Pickup voice redesign (code only + short rationale)
- Change `VoiceSet.pickup` to `pickup(kind: PickupKind, combo: number)` in
  both registers. The GameLoop call becomes `sfx?.pickup(event.pickup, event.combo)`.
- Redesign BOTH registers so the pickup is crisper and more satisfying:
  Celeste-style transient+body+tail discipline (a tiny tick/click transient,
  a bright tuned body, a short decaying tail/partial). Keep the combo ladder
  (pentatonic climb per register base). Differentiate:
  - **star** — brighter, faster-decaying, a little sparkle partial;
  - **heart** — warmer, slightly softer, rounder body;
  - **heal** pickup kind keeps calling the unchanged `heal()` voice
    (GameLoop already does; `pickup("heal", …)` may stay minimal).
- Loudness stays in family (body volume ≈ 0.14–0.2, no clipping; the mix
  fans through sfxBus 0.9 × master 0.42).
- Add a comment in audio.ts marking the kitty-register pickup override as an
  owner-ordered exception to the FROZEN note.

### Deliverable 3 — Effective distance (code only)
- Add `bonusDistance: number` to `WorldState` (init 0 in `createWorld`).
  In the pickup block of `step.ts`: on a star pickup,
  `world.bonusDistance += TUNING.starBonusMeters` (add `starBonusMeters: 5`
  to TUNING with a one-line comment).
- Export a helper `effectiveDistance(world)` (put it in `world.ts` next to
  `resetWorld`, or in `score.ts` if purer — your call, justify briefly):
  `world.distance + world.bonusDistance`.
- Milestones in `step.ts` fire on `effectiveDistance(world)`; the pushed
  `meters` is the effective value crossed.
- HUD: extend `HudRefs` with `meters: React.RefObject<HTMLSpanElement | null>`;
  `writeHud` writes `Math.floor(effectiveDistance(world)).toLocaleString()`
  (and may skip the write when the string is unchanged — your call). The
  page adds the element beside the score box (suggested class
  `kitty-run-meters`; the integrator writes the CSS). Also update the
  `?debug` readout to show the effective metre count.
- Over card: "m run" uses effective distance; the race-target comparison
  ("N m past/short of your best mark") compares effective distances; the
  stored replay's `distance` field becomes effective distance at save time.
  Keep the echo launch gate on RUNNING distance (spawnOrigin starts at 14,
  so no stars can exist before the 4.5 m gate).
- Determinism: the echo sim accumulates `bonusDistance` identically (its
  events are drained); milestone math stays a pure function of world state.

### Deliverable 4 — Land/roll debounce (code only + short rationale)
- In `step.ts`: stop treating every ground re-contact as a landing.
  Requirements:
  - While `dashT > 0`, never fire the `land` event (a roll in progress
    shouldn't thump per ground contact).
  - Add a minimum-airborne-time gate before a `land` event (track
    `airborneT` seconds accumulating while `!grounded`, reset on landing;
    fire `land` only when `airborneT ≥ TUNING.landMinAir` — propose the
    constant, ~0.08–0.12 s, justify). This kills micro-bounce re-lands on
    any slope while keeping real jumps' landings.
  - Keep the landing squash spring behaviour otherwise unchanged.
- Determinism must hold (seeded replay identical).

## §6 Output format (STRICT)

1. Start with `## Design rationale` — per deliverable, 2–5 sentences each.
2. Then per deliverable: `## Deliverable N — <title>`, containing one or more
   code fences, each preceded by a line `FILE: <repo-relative path>` and
   `MODE: full|patch`. For `patch` blocks, show exact old/new code pairs
   anchored on real excerpt lines from §4 (context lines included) so the
   integrator can apply them mechanically. Never invent code the excerpts
   don't cover; if a spec detail is genuinely underdetermined, make the call
   and note it in one line under the rationale.
3. No diffs of files you were not given; no placeholder pseudocode.
