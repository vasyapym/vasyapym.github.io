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
  | { type: "land" }
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

  // True when the run that just ended beat the stored best — the game-over
  // card wears a little badge.
  newBest: boolean;

  spawnOrigin: number;
  chunkIndex: number;

  // Input flags, set by the page's listeners, consumed by the step.
  jumpQueued: boolean;
  jumpHeld: boolean;
  dashQueued: boolean;

  // Timed input log for the current run — the raw material of the
  // best-run echo replay. Zeroed on start, appended by the actions.
  inputLog: RunInput[];

  kitty: KittyMotion & {
    y: number;
    jumpsUsed: number;
    coyote: number;
    dashCd: number;
    blinkNext: number;
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

    newBest: false,

    spawnOrigin: 14,
    chunkIndex: 0,

    jumpQueued: false,
    jumpHeld: false,
    dashQueued: false,
    inputLog: [],

    kitty: {
      y: 0,
      vy: 0,
      grounded: true,
      jumpsUsed: 0,
      coyote: 0,
      dashT: 0,
      dashCd: 0,
      invulnT: 0,
      runPhase: 0,
      squash: 0,
      blinkShut: 0,
      blinkNext: 2.5,
      happyT: 0,
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
