// Headless full-run simulation: drives the real step function with the
// lookahead pilot (the very bot the in-game autopilot demo uses) for
// minutes of simulated gameplay and asserts the invariants that only show
// up over time — no NaN drift, no unknown hazard kinds, milestones fire
// exactly once each, distance scoring keeps pace.
// Run: node --experimental-strip-types tests/kitty-run.sim.ts

import { requestDash, requestJump, startRun } from "../web/scene/actions.ts";
import { createWorld, type WorldState } from "../web/scene/world.ts";
import { stepWorld } from "../web/scene/step.ts";
import { groundY } from "../web/lib/ground.ts";
import { TUNING } from "../web/lib/tuning.ts";
import { pilotSteer, resetPilot } from "../web/lib/pilot.ts";

const DT = 1 / 60;
const MAX_SIM_SECONDS = 150;

type SimResult = {
  world: WorldState;
  seconds: number;
  gameOver: boolean;
  milestoneMeters: number[];
  kindsSeen: Set<string>;
};

function simulate(runSeed: string): SimResult {
  const world = createWorld(0, runSeed);
  startRun(world);
  resetPilot(world);

  let time = 0;
  const kindsSeen = new Set<string>();
  const milestoneMeters: number[] = [];
  let gameOver = false;

  while (time < MAX_SIM_SECONDS && world.status !== "over") {
    // The shared steering policy — identical code to the browser demo.
    pilotSteer(world);

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

// --- fresh-jump dash-cancel (touch ducking) -----------------------------------
//
// On touch, tap-to-jump fires on finger-down before the gesture is known;
// a swipe-down arriving within the cancel window must rescind the hop and
// duck instead. These checks pin the mechanic the mobile game depends on.

function flatRun(): WorldState {
  const world = createWorld(0, "kitty-run/cancel/v1");
  startRun(world);
  // The ready screen's drift normally seats kitty on the terrain before a
  // run begins; a headless start skips it, so seat her explicitly — the
  // first step would otherwise be eaten by the below-ground landing snap.
  world.kitty.y = groundY(world.distance);
  return world;
}

// 1. A queued-but-unstepped jump is taken off the books by a dash.
{
  const world = flatRun();
  requestJump(world);
  requestDash(world);
  stepWorld(world, DT);
  check(
    "dash cancels a still-queued jump",
    !world.jumpQueued &&
      world.kitty.dashT > 0 &&
      Math.abs(world.kitty.y - groundY(world.distance)) < 0.06,
  );
}

// 2. A jump already in the air inside the cancel window snaps back down
//    and ducks: grounded again, jump state reset, dash engaged.
{
  const world = flatRun();
  requestJump(world);
  stepWorld(world, DT); // jump consumed, kitty airborne and rising
  const airborne = !world.kitty.grounded && world.kitty.vy > 0;
  requestDash(world);
  stepWorld(world, DT); // dash consumed, cancel applied
  check(
    "a fresh airborne jump folds back into a duck",
    airborne &&
      world.kitty.dashT > 0 &&
      world.kitty.jumpsUsed === 0 &&
      Math.abs(world.kitty.y - groundY(world.distance)) < 0.06,
  );
}

// 3. Outside the window the same inputs behave as before: no cancel, the
//    arc keeps its height and the dash rides along as an air dash.
{
  const world = flatRun();
  requestJump(world);
  stepWorld(world, DT);
  // Let the arc age past the cancel window while staying airborne.
  for (let i = 0; i < Math.ceil(TUNING.jumpCancelWindow / DT) + 12; i += 1) {
    stepWorld(world, DT);
  }
  const aged = !world.kitty.grounded;
  const heightAtDash = world.kitty.y - groundY(world.distance);
  requestDash(world);
  stepWorld(world, DT);
  check(
    "an aged jump is never cancelled",
    aged && world.kitty.dashT > 0 && world.kitty.jumpsUsed === 1 &&
      world.kitty.y - groundY(world.distance) > heightAtDash * 0.5,
  );
}

// 4. The cancel is deterministic: two identical runs reproduce it exactly.
{
  const runA = flatRun();
  const runB = flatRun();
  requestJump(runA);
  requestJump(runB);
  stepWorld(runA, DT);
  stepWorld(runB, DT);
  requestDash(runA);
  requestDash(runB);
  stepWorld(runA, DT);
  stepWorld(runB, DT);
  check(
    "the jump cancel replays identically",
    runA.distance === runB.distance &&
      runA.kitty.y === runB.kitty.y &&
      runA.inputLog.length === runB.inputLog.length,
  );
}

if (failures > 0) {
  console.error(`\n${failures} sim check(s) failed`);
  process.exit(1);
}
console.log("\nAll kitty-run sim checks passed.");
