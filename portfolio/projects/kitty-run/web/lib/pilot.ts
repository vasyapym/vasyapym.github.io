// The autopilot pilot: a small lookahead bot that plays the run by reading
// only the plain world state — the same policy the headless sim test uses
// to sweep hundreds of chunks and pin the fairness invariants. Surfacing it
// in the browser turns that verification into a demo: press one button and
// watch the engine's own test pilot play the live game.
//
// The bot steers by setting the same input flags the player's listeners
// set, but it never touches world.inputLog — an autopilot run is a
// exhibition, not a candidate for your best-run echo.

import { groundY } from "./ground.ts";
import { jumpLength } from "./tuning.ts";
import type { WorldState } from "../scene/world.ts";

// Per-run memory for the takeoff guard: one full-height arc per crate.
type PilotMemory = {
  jumpedThisArc: boolean;
};

const memories = new WeakMap<WorldState, PilotMemory>();

// Nearest grounded hazard (crate) ahead. Hover balloons are deliberately
// ignored: they hang high enough to run under, and jumping into them is
// the classic rookie mistake.
function nearestCrate(world: WorldState): { gap: number; top: number } | null {
  let nearest = Number.POSITIVE_INFINITY;
  let top = 0;
  for (const slot of world.obstacles.slots) {
    if (!slot.active || slot.data.kind === "hover") continue;
    const vx = slot.data.x - world.distance;
    if (vx > -1.2 && vx < nearest) {
      nearest = vx;
      top = slot.data.y + 0.55 - groundY(slot.data.x);
    }
  }
  return Number.isFinite(nearest) ? { gap: nearest, top } : null;
}

export function resetPilot(world: WorldState): void {
  memories.set(world, { jumpedThisArc: false });
}

// One steering decision per call — the game loop runs this every frame
// right before stepping the world.
export function pilotSteer(world: WorldState): void {
  const memory =
    memories.get(world) ?? memories.set(world, { jumpedThisArc: false }).get(world)!;
  const crate = nearestCrate(world);
  if (!crate) return;
  const gap = crate.gap;
  const halfJump = jumpLength(world.speed) * 0.5;

  // Take off so the jump's apex lands on the crate: half a jump length
  // before it, with a little slack for frame granularity.
  if (world.kitty.grounded) {
    if (!memory.jumpedThisArc && gap <= halfJump && gap > -0.5) {
      world.jumpQueued = true;
      world.jumpHeld = true;
      memory.jumpedThisArc = true;
    } else {
      memory.jumpedThisArc = false;
    }
    return;
  }

  // Airborne rescue: falling short of a crate still meaningfully ahead AND
  // still low enough that the descent could clip it — being high or already
  // above the crate is safe, no extension needed.
  if (world.kitty.jumpsUsed > 0 && world.kitty.jumpsUsed < 2) {
    const fallingShort =
      world.kitty.vy < 0.5 && gap > 0.8 && gap < 1.7 && world.kitty.y < crate.top + 0.4;
    const lateTakeoff = !memory.jumpedThisArc && world.kitty.vy < 1 && gap <= halfJump;
    if (fallingShort || lateTakeoff) {
      world.jumpQueued = true;
      world.jumpHeld = true;
    }
  }
  // No release here: the bot always takes full-height arcs, the safest
  // policy against the tall crate.
}
