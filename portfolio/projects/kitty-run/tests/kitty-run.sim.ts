// Headless full-run simulation: drives the real step function with the
// lookahead pilot (the very bot the in-game autopilot demo uses) for
// minutes of simulated gameplay and asserts the invariants that only show
// up over time — no NaN drift, no unknown hazard kinds, milestones fire
// exactly once each, distance scoring keeps pace.
// Run: node --experimental-strip-types tests/kitty-run.sim.ts

import { startRun } from "../web/scene/actions.ts";
import { createWorld, type WorldState } from "../web/scene/world.ts";
import { stepWorld } from "../web/scene/step.ts";
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

if (failures > 0) {
  console.error(`\n${failures} sim check(s) failed`);
  process.exit(1);
}
console.log("\nAll kitty-run sim checks passed.");
