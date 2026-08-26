// Player-facing world mutations: start, pause, restart, jump, dash. The
// page's input listeners call these; the simulation step consumes what
// they set. Every action also appends to the run's input log — that log
// plus the run seed is what the echo replay needs to reproduce a run.

import type { RunInputKind } from "../lib/replay.ts";
import { TUNING } from "../lib/tuning.ts";
import { groundY } from "../lib/ground.ts";
import { resetWorld, type WorldState } from "./world.ts";

function record(world: WorldState, kind: RunInputKind): void {
  world.inputLog.push({ t: world.time, kind });
}

export function startRun(world: WorldState): void {
  if (world.status !== "ready") return;
  // Zero the clock and the odometer: the ready screen drifts the world
  // forward for atmosphere, and a run must always begin at metre zero —
  // the echo replay and the chunk stream both depend on that alignment
  // (a lingering menu would otherwise gift the player an unclosable lead).
  world.time = 0;
  world.distance = 0;
  world.scoredDistance = 0;
  world.inputLog.length = 0;
  world.status = "running";
}

export function restartRun(world: WorldState): void {
  resetWorld(world);
  world.status = "running";
}

export function togglePause(world: WorldState): void {
  if (world.status === "running") world.status = "paused";
  else if (world.status === "paused") world.status = "running";
}

export function requestJump(world: WorldState): void {
  if (world.status !== "running") return;
  world.jumpQueued = true;
  world.jumpHeld = true;
  record(world, "jump");
}

// Early release cuts the jump arc — variable jump height for free.
export function releaseJump(world: WorldState): void {
  world.jumpHeld = false;
  if (world.kitty.vy > 4) {
    world.kitty.vy *= TUNING.jumpCutFactor;
  }
  if (world.status === "running") record(world, "release");
}

// Dashing takes the fresh-jump back: on touch, the tap-to-jump fires on
// finger-down before the gesture is known, so a swipe-down must be able to
// rescind the accidental hop and duck instead. Within
// TUNING.jumpCancelWindow of leaving the ground, a dash request un-queues
// a still-pending jump or snaps an airborne kitty straight back down —
// then ducks. Desktop gains the same move for free: down right after space.
export function requestDash(world: WorldState): void {
  if (world.status !== "running") return;
  const k = world.kitty;
  if (world.jumpQueued) {
    // The jump never left the ground — simply take it off the books.
    world.jumpQueued = false;
    world.jumpHeld = false;
  } else if (
    !k.grounded &&
    k.jumpsUsed === 1 &&
    k.vy > 0 &&
    k.jumpAgeT <= TUNING.jumpCancelWindow
  ) {
    // The jump just launched this arc: fold it back into the ground. Only
    // a single fresh jump cancels — a mid-air double jump is a committed
    // move and keeps its dash as a plain air dash.
    k.y = groundY(world.distance);
    k.vy = 0;
    k.grounded = true;
    k.jumpsUsed = 0;
    k.coyote = TUNING.coyoteTime;
  }
  world.dashQueued = true;
  record(world, "dash");
}
