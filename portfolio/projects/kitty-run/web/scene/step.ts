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
