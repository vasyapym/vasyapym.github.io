// Player-facing world mutations: start, pause, restart, jump, dash. The
// page's input listeners call these; the simulation step consumes what
// they set. Every action also appends to the run's input log — that log
// plus the run seed is what the echo replay needs to reproduce a run.

import type { RunInputKind } from "../lib/replay.ts";
import { TUNING } from "../lib/tuning.ts";
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

export function requestDash(world: WorldState): void {
  if (world.status !== "running") return;
  world.dashQueued = true;
  record(world, "dash");
}
