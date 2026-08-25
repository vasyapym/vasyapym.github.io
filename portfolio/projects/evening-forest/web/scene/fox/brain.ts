// The fox's mind. Deliberately pure TypeScript over plain {x, z} vectors —
// no three.js, no react, injectable RNG — so tests can tick it headlessly
// and the renderer only applies the resulting pose each frame.
//
// The story it tells: a shy fox that trots its own errands, notices the
// walker, freezes, sometimes creeps closer out of curiosity if the walker
// stands still, and bolts the moment anything moves wrong.

export type FoxState = "wander" | "alert" | "curious" | "flee";

export type FoxVec = { x: number; z: number };

export type FoxTickInput = {
  dt: number;
  playerPos: FoxVec;
  // Walker's planar speed in u/s — stillness is what sparks curiosity.
  playerSpeed: number;
};

export type FoxSnapshot = {
  state: FoxState;
  pos: FoxVec;
  // Radians; the fox's velocity direction is (cos h, sin h) in xz.
  heading: number;
  speed: number;
};

const TROT_SPEED = 1.7;
const RUN_SPEED = 6.4;
const CREEP_SPEED = 0.85;

// Kept local (rather than imported from the heightfield) so this module
// stays dependency-free for headless tests; forest.check.ts asserts it
// stays consistent with the world's PLAY_RADIUS.
export const FOX_WORLD_LIMIT = 216;

const TURN_RATE = 3.2;
const FLEE_TURN_RATE = 6.0;
// How fast speed approaches its target (per-second exponential rates).
const ACCEL_WANDER = 4.5;
const ACCEL_FLEE = 8;

const ALERT_RADIUS = 13;
// Hysteresis: the walker must retreat this far before the fox relaxes.
const ALERT_RELEASE_RADIUS = 19;
const FLEE_RADIUS = 6.5;
// Even a curious fox panics if the walker itself closes inside this.
const CURIOUS_PANIC_DIST = 2.4;
const ESCAPE_RADIUS = 30;
const RELOCATE_RADIUS = 160;
// Curiosity never closes all the way — this is the fox's comfort bubble.
const CURIOSITY_MIN_DIST = 4.5;

const PAUSE_MIN = 1.2;
const PAUSE_MAX = 3.8;
const ARRIVE_RADIUS = 1.6;
// Stillness (seconds) that turns alertness into curiosity.
const STILL_PLAYER_TIME = 2.2;
const CURIOUS_MAX_TIME = 7;
const FLEE_MIN_TIME = 2.2;
const FLEE_MAX_TIME = 10;
const ALERT_MAX_TIME = 14;

function wrapAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function dist(a: FoxVec, b: FoxVec): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export class FoxBrain {
  state: FoxState = "wander";
  pos: FoxVec;
  heading: number;
  speed = 0;

  private target: FoxVec;
  private pause = 0;
  private stateTime = 0;
  private playerStillFor = 0;
  private curiousUsed = false;
  private rng: () => number;
  private wobbleSeed: number;

  constructor(spawn: FoxVec, rng: () => number) {
    this.pos = { ...spawn };
    this.target = { ...spawn };
    this.heading = rng() * Math.PI * 2;
    this.rng = rng;
    this.wobbleSeed = rng() * 100;
    this.pickTarget();
  }

  // The director's escape hatch: when the walker has left the fox's story
  // far behind, quietly recast it a stride ahead of them.
  relocate(playerPos: FoxVec, forward: FoxVec): void {
    const forwardLen = Math.hypot(forward.x, forward.z) || 1;
    const fx = forward.x / forwardLen;
    const fz = forward.z / forwardLen;
    const lead = 46 + this.rng() * 16;
    const side = (this.rng() - 0.5) * 34;
    const limit = FOX_WORLD_LIMIT - 11;
    let x = playerPos.x + fx * lead - fz * side;
    let z = playerPos.z + fz * lead + fx * side;
    const r = Math.hypot(x, z);
    if (r > limit) {
      x = (x / r) * limit;
      z = (z / r) * limit;
    }
    this.pos = { x, z };
    this.state = "wander";
    this.stateTime = 0;
    this.speed = 0;
    this.pause = 0.6;
    this.curiousUsed = false;
    this.playerStillFor = 0;
    this.target = { x, z };
    this.pickTarget();
  }

  tick({ dt, playerPos, playerSpeed }: FoxTickInput): FoxSnapshot {
    this.stateTime += dt;
    const playerDist = dist(this.pos, playerPos);

    // --- senses ---------------------------------------------------------
    if (playerSpeed < 0.3) {
      this.playerStillFor += dt;
    } else {
      this.playerStillFor = 0;
    }

    // --- transitions ------------------------------------------------------
    // Curiosity is exempt from the proximity panic: the whole point of the
    // state is walking closer on purpose. Its own, much tighter bubble
    // (CURIOUS_PANIC_DIST) and the walker's sudden moves are what scare it.
    if (this.state === "curious") {
      if (playerSpeed > 0.6 || playerDist < CURIOUS_PANIC_DIST) {
        // A sudden move reads as danger. Gone.
        this.enter("flee");
      } else if (this.stateTime > CURIOUS_MAX_TIME) {
        this.enter("alert");
      }
    } else if (this.state !== "flee" && playerDist < FLEE_RADIUS) {
      this.enter("flee");
    } else if (this.state === "wander" && playerDist < ALERT_RADIUS) {
      this.enter("alert");
    } else if (this.state === "alert") {
      if (
        this.playerStillFor > STILL_PLAYER_TIME &&
        !this.curiousUsed &&
        playerDist > CURIOSITY_MIN_DIST + 0.5
      ) {
        this.enter("curious");
        this.curiousUsed = true;
      } else if (
        playerDist > ALERT_RELEASE_RADIUS ||
        this.stateTime > ALERT_MAX_TIME
      ) {
        this.enter("wander");
      }
    } else if (this.state === "flee") {
      const settled =
        this.stateTime > FLEE_MIN_TIME && playerDist > ESCAPE_RADIUS;
      if (settled || this.stateTime > FLEE_MAX_TIME) {
        this.enter("wander");
        this.curiousUsed = false;
      }
    }

    // --- desired heading + speed per state --------------------------------
    let desiredHeading = this.heading;
    let desiredSpeed = 0;
    let turnRate = TURN_RATE;
    let accel = ACCEL_WANDER;

    if (this.state === "wander") {
      if (this.pause > 0) {
        this.pause -= dt;
        // Sniff-about idle: small heading drift while standing still.
        desiredHeading = this.heading + Math.sin(this.stateTime * 0.8) * 0.4;
      } else {
        desiredHeading = Math.atan2(
          this.target.z - this.pos.z,
          this.target.x - this.pos.x,
        );
        desiredSpeed = TROT_SPEED;
        if (dist(this.pos, this.target) < ARRIVE_RADIUS) {
          this.pause = PAUSE_MIN + this.rng() * (PAUSE_MAX - PAUSE_MIN);
          this.pickTarget();
        }
      }
    } else if (this.state === "alert") {
      desiredHeading = Math.atan2(
        playerPos.z - this.pos.z,
        playerPos.x - this.pos.x,
      );
    } else if (this.state === "curious") {
      desiredHeading = Math.atan2(
        playerPos.z - this.pos.z,
        playerPos.x - this.pos.x,
      );
      if (playerDist > CURIOSITY_MIN_DIST) {
        desiredSpeed = CREEP_SPEED;
      }
    } else {
      // Flee: straight away from the walker with a lively zig-zag wobble,
      // so the escape reads as panic rather than a beeline.
      const away = Math.atan2(
        this.pos.z - playerPos.z,
        this.pos.x - playerPos.x,
      );
      const wobble =
        Math.sin(this.stateTime * 2.4 + this.wobbleSeed) * 0.45;
      desiredHeading = away + wobble;
      desiredSpeed = RUN_SPEED;
      turnRate = FLEE_TURN_RATE;
      accel = ACCEL_FLEE;
    }

    // --- integrate --------------------------------------------------------
    const turn = wrapAngle(desiredHeading - this.heading);
    const maxTurn = turnRate * dt;
    this.heading = wrapAngle(
      this.heading + Math.max(-maxTurn, Math.min(maxTurn, turn)),
    );
    this.speed += (desiredSpeed - this.speed) * (1 - Math.exp(-accel * dt));
    this.pos.x += Math.cos(this.heading) * this.speed * dt;
    this.pos.z += Math.sin(this.heading) * this.speed * dt;

    // Soft world boundary, mirroring how the walker is eased back in.
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > FOX_WORLD_LIMIT) {
      this.pos.x = (this.pos.x / r) * FOX_WORLD_LIMIT;
      this.pos.z = (this.pos.z / r) * FOX_WORLD_LIMIT;
      if (this.state === "wander" && this.pause <= 0) this.pickTarget();
    }

    return {
      state: this.state,
      pos: { x: this.pos.x, z: this.pos.z },
      heading: this.heading,
      speed: this.speed,
    };
  }

  private enter(state: FoxState): void {
    this.state = state;
    this.stateTime = 0;
  }

  private pickTarget(): void {
    // New errand: a point 8–40m from home, biased inward so errands stay
    // inside the world even when the fox lives near the rim.
    const home = this.pos;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const angle = this.rng() * Math.PI * 2;
      const radius = 8 + this.rng() * 32;
      const x = home.x + Math.cos(angle) * radius;
      const z = home.z + Math.sin(angle) * radius;
      if (Math.hypot(x, z) <= FOX_WORLD_LIMIT - 14) {
        this.target = { x, z };
        return;
      }
    }
    this.target = { x: home.x * 0.8, z: home.z * 0.8 };
  }
}
