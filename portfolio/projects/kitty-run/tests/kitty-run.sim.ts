// Headless full-run simulation: drives the real step function with a
// lookahead bot for minutes of simulated gameplay and asserts the invariants
// that only show up over time — no NaN drift, no unknown hazard kinds,
// milestones fire exactly once each, distance scoring keeps pace.
// Run: node --experimental-strip-types tests/kitty-run.sim.ts

import { requestJump, startRun } from "../web/scene/actions.ts";
import { createWorld, type WorldState } from "../web/scene/world.ts";
import { stepWorld } from "../web/scene/step.ts";
import { jumpLength } from "../web/lib/tuning.ts";
import { groundY } from "../web/lib/ground.ts";

const DT = 1 / 60;
const MAX_SIM_SECONDS = 150;

type SimResult = {
  world: WorldState;
  seconds: number;
  gameOver: boolean;
  milestoneMeters: number[];
  kindsSeen: Set<string>;
};

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

// Take off so the jump's apex lands on the crate: half a jump length
// before it, with a little slack for reaction granularity.
function simulate(runSeed: string): SimResult {
  const world = createWorld(0, runSeed);
  startRun(world);

  let time = 0;
  let jumpedThisArc = false;
  const kindsSeen = new Set<string>();
  const milestoneMeters: number[] = [];
  let gameOver = false;

  while (time < MAX_SIM_SECONDS && world.status !== "over") {
    const crate = nearestCrate(world);
    const gap = crate ? crate.gap : Number.POSITIVE_INFINITY;
    const halfJump = jumpLength(world.speed) * 0.5;

    if (world.kitty.grounded) {
      // Take off on the frame the crate enters apex range. The negative
      // slack covers landings that touch down already inside the window.
      if (!jumpedThisArc && gap <= halfJump && gap > -0.5) {
        requestJump(world);
        jumpedThisArc = true;
      } else {
        jumpedThisArc = false;
      }
    } else if (world.kitty.jumpsUsed < 2 && world.kitty.jumpsUsed > 0) {
      // Falling short of a crate still meaningfully ahead AND still low
      // enough that the descent could clip it — being high or already
      // above the crate is safe, no extension needed.
      const fallingShort =
        world.kitty.vy < 0.5 &&
        gap > 0.8 &&
        gap < 1.7 &&
        world.kitty.y < crate!.top + 0.4;
      const lateTakeoff = !jumpedThisArc && world.kitty.vy < 1 && gap <= halfJump;
      if (fallingShort || lateTakeoff) {
        requestJump(world);
      }
    }
    // No releaseJump here: the bot always takes full-height arcs, the
    // safest policy against the tall crate.

    stepWorld(world, DT);
    time += DT;

    for (const slot of world.obstacles.slots) {
      if (slot.active) kindsSeen.add(slot.data.kind);
    }
    for (const event of world.events) {
      if (event.type === "milestone") milestoneMeters.push(event.meters);
      if (event.type === "gameover") gameOver = true;
    }
    world.events.length = 0;
  }

  return { world, seconds: time, gameOver, milestoneMeters, kindsSeen };
}

let failures = 0;

function check(name: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
    console.error(`FAIL ${name}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

const run = simulate("kitty-run/sim/v1");
const w = run.world;

check("simulation reaches real play depth", w.distance > 100 || run.gameOver);
check("run ends only through the normal game-over path", run.gameOver || w.status === "running");
check("no NaN in distance", Number.isFinite(w.distance));
check("no NaN in score", Number.isFinite(w.score));
check("no NaN in kitty height", Number.isFinite(w.kitty.y));

let kindsKnown = true;
for (const kind of run.kindsSeen) {
  if (kind !== "box" && kind !== "tall" && kind !== "hover") kindsKnown = false;
}
check("only known, jumpable hazard kinds ever spawn", kindsKnown);

let milestonesOnceEach = run.milestoneMeters.length > 0;
for (let i = 1; i < run.milestoneMeters.length; i += 1) {
  if (run.milestoneMeters[i] <= run.milestoneMeters[i - 1]) milestonesOnceEach = false;
}
check(
  "milestones fire once each, in order",
  milestonesOnceEach &&
    run.milestoneMeters.length === Math.floor(w.distance / 500),
);
check("distance scoring keeps pace with travel", w.score >= Math.floor(w.distance));
check("hearts never exceed the meter", w.hearts >= 0 && w.hearts <= 3);

// A second run from the same seed replays identically — determinism holds
// across the whole simulation, not just single chunks.
const replay = simulate("kitty-run/sim/v1");
check(
  "the whole run replays identically from its seed",
  replay.world.distance === w.distance && replay.world.score === w.score,
);

if (failures > 0) {
  console.error(`\n${failures} sim check(s) failed`);
  process.exit(1);
}
console.log("\nAll kitty-run sim checks passed.");
