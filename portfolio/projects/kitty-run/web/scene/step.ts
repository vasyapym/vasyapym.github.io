// The simulation step: one call advances the whole run. Pure TypeScript —
// pools, tuning and the ground function in, mutated world out. Rendering
// and sound only read what this leaves behind.

import { groundY } from "../lib/ground.ts";
import { biomeAt, directorDifficulty } from "../lib/director.ts";
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

// Near-miss reaction margin: an armed hazard that slips past within this
// clearance (world units) with no hit fires one cosmetic nearMiss event.
// Purely visual — it never touches spawn, physics, hearts or score, so the
// echo (which runs the same detection and drains its own events) stays
// honest and the track cannot diverge.
const NEAR_MISS_MARGIN = 0.35;

// Signed clearance between a circle and an axis-aligned square centred on
// (bx, by) with half-extent `half` (>0 = gap, 0 = touching, <0 = overlap).
// The mirror of circleHitsBox: same geometry, distance instead of a boolean.
function rectGap(
  cx: number,
  cy: number,
  r: number,
  bx: number,
  by: number,
  half: number,
): number {
  const dx = Math.max(Math.abs(cx - bx) - half, 0);
  const dy = Math.max(Math.abs(cy - by) - half, 0);
  return Math.hypot(dx, dy) - r;
}

// Signed clearance between two circles (>0 = gap). The mirror of
// circleHitsCircle, for the hover gate.
function circleGap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): number {
  return Math.hypot(ax - bx, ay - by) - (ar + br);
}

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
  // The director owns the mix pointer: the run-start skill snapshot decides
  // how quickly the pattern weights reach their hardest (see director.ts).
  const difficulty = directorDifficulty(world.directorSkill, world.distance);
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
      // Pool factories run once, so every acquire must (re)arm the
      // near-miss flag — a recycled slot keeps whatever the last hazard
      // left behind.
      slot.data.nearMissArmed = true;
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
      world.events.push({ type: "land" });
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
  k.nearMissT = Math.max(0, k.nearMissT - dt);
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

  // --- near-miss reaction (cosmetic only) --------------------------------------

  // On the first frame an armed hazard crosses the cat's plane (vx <= 0),
  // measure the geometric clearance between the cat circle and the hazard
  // using exactly the hit geometry above (same centre terms, same half
  // extents). If nothing hit it this run and the gap is a sliver, fire ONE
  // cosmetic nearMiss and start the rig's startle pop. Disarm on the
  // crossing regardless, so it fires at most once. A dash pass-through or
  // active invulnerability nullifies the "near" read: she sailed through
  // untouchable, so it is not a skin-of-the-teeth moment.
  for (const slot of world.obstacles.slots) {
    if (!slot.active) continue;
    const o = slot.data;
    if (!o.nearMissArmed) continue;

    const vx = o.x - world.distance;
    if (vx > 0) continue; // has not reached the cat's plane yet

    o.nearMissArmed = false; // crossing consumed — fire at most once

    if (k.invulnT > 0 || k.dashT > 0) continue;

    const gap =
      o.kind === "hover"
        ? circleGap(kx, ky, kr, vx, o.y, HOVER_RADIUS)
        : rectGap(kx, ky, kr, vx, o.y, obstacleHalf(o.kind));

    // gap <= 0 would mean an actual overlap — the collision block above
    // already handled (or dash/invuln excused) that; only a genuine sliver
    // counts as a near-miss.
    if (gap > 0 && gap <= NEAR_MISS_MARGIN) {
      k.nearMissT = 0.4;
      world.events.push({ type: "nearMiss" });
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

  // Cosmetic district pointer: pure fn of distance, so the HUD chip and every
  // biome tint stay in lockstep with the echo (which sees the same distance).
  const biome = biomeAt(world.distance);
  world.biomeIndex = biome.index;
  world.biomeMix = biome.mix;

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
