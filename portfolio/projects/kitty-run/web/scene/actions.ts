// Player-facing world mutations: start, pause, restart, jump, dash. The
// page's input listeners call these; the simulation step consumes what
// they set.

import { TUNING } from "../lib/tuning.ts";
import { resetWorld, type WorldState } from "./world.ts";

export function startRun(world: WorldState): void {
  if (world.status !== "ready") return;
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
}

// Early release cuts the jump arc — variable jump height for free.
export function releaseJump(world: WorldState): void {
  world.jumpHeld = false;
  if (world.kitty.vy > 4) {
    world.kitty.vy *= TUNING.jumpCutFactor;
  }
}

export function requestDash(world: WorldState): void {
  if (world.status !== "running") return;
  world.dashQueued = true;
}
