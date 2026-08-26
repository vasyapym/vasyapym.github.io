// Hand-rolled assertion script, following the planck-to-now precedent.
// Run: node --experimental-strip-types tests/forest.check.ts
// Covers the pure leaf modules only (they must not import three or react).

import { createRng } from "../web/lib/rng.ts";
import {
  PLAY_RADIUS,
  WALKER_START,
  smoothstep,
  terrainHeight,
} from "../web/lib/heightfield.ts";
import {
  JOYSTICK_DEADZONE,
  JOYSTICK_RADIUS,
  PITCH_LIMIT,
  clampPitch,
  joystickKnobOffset,
  joystickVector,
  lookDelta,
} from "../web/lib/touch-input.ts";
import { FoxBrain, ALERT_RADIUS, FOX_SPAWN, FOX_WORLD_LIMIT } from "../web/scene/fox/brain.ts";
import {
  phaseName,
  sampleDaylight,
} from "../web/lib/daylight.ts";

let failures = 0;

function check(name: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
    console.error(`FAIL ${name}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

// --- rng -----------------------------------------------------------------

const a = createRng("evening-forest/trees/v1");
const b = createRng("evening-forest/trees/v1");
let deterministic = true;
for (let i = 0; i < 1000; i += 1) {
  if (a() !== b()) {
    deterministic = false;
    break;
  }
}
check("same seed produces identical sequences", deterministic);

const c = createRng("seed-a");
const d = createRng("seed-b");
let diverges = true;
if (c() === d()) diverges = false;
check("different seeds diverge", diverges);

const e = createRng("range-check");
let inRange = true;
for (let i = 0; i < 10_000; i += 1) {
  const value = e();
  if (!(value >= 0 && value < 1)) {
    inRange = false;
    break;
  }
}
check("values stay within [0, 1)", inRange);

// --- heightfield ----------------------------------------------------------

let continuous = true;
const EPSILON = 0.001;
outer: for (let x = -240; x <= 240; x += 6) {
  for (let z = -240; z <= 240; z += 6) {
    const h0 = terrainHeight(x, z);
    const hx = terrainHeight(x + EPSILON, z);
    const hz = terrainHeight(x, z + EPSILON);
    if (
      Math.abs(hx - h0) > 0.05 ||
      Math.abs(hz - h0) > 0.05 ||
      Number.isNaN(h0)
    ) {
      continuous = false;
      break outer;
    }
  }
}
check("terrain height is continuous across the meadow", continuous);

let bounded = true;
for (let x = -250; x <= 250; x += 10) {
  for (let z = -250; z <= 250; z += 10) {
    const h = terrainHeight(x, z);
    if (h < -6 || h > 12) {
      bounded = false;
    }
  }
}
check("terrain stays within a sane amplitude band", bounded);

const centre = terrainHeight(0, 0);
check(
  "spawn clearing is gentler than the rim",
  Math.abs(centre) < 1 && terrainHeight(240, 0) > 4,
);

check("play radius leaves room inside the mesh", PLAY_RADIUS === 230);

// --- smoothstep ------------------------------------------------------------

check(
  "smoothstep clamps outside its edges",
  smoothstep(0, 1, -5) === 0 && smoothstep(0, 1, 7) === 1,
);

// --- touch input -----------------------------------------------------------

const centreVector = joystickVector(0, 0);
check(
  "joystick at rest reads zero",
  centreVector.x === 0 && centreVector.z === 0,
);

const deadzoneProbe = joystickVector(
  JOYSTICK_DEADZONE * JOYSTICK_RADIUS * 0.9,
  0,
);
check(
  "light thumb presses stay in the deadzone",
  deadzoneProbe.x === 0 && deadzoneProbe.z === 0,
);

let fullDeflection = true;
for (let i = 0; i < 720; i += 1) {
  const angle = (i / 720) * Math.PI * 2;
  const far = JOYSTICK_RADIUS * 4;
  const v = joystickVector(Math.cos(angle) * far, Math.sin(angle) * far);
  if (Math.abs(v.x) > 1 || Math.abs(v.z) > 1 || Math.hypot(v.x, v.z) > 1.0001) {
    fullDeflection = false;
    break;
  }
}
check("far drags clamp to a unit vector", fullDeflection);

const up = joystickVector(0, -JOYSTICK_RADIUS);
const down = joystickVector(0, JOYSTICK_RADIUS);
const left = joystickVector(-JOYSTICK_RADIUS, 0);
const right = joystickVector(JOYSTICK_RADIUS, 0);
check(
  "drag up walks forward and right strafes right",
  up.z > 0.99 &&
    down.z < -0.99 &&
    left.x < -0.99 &&
    right.x > 0.99 &&
    up.x === 0 &&
    right.z === 0,
);

const mid = joystickVector(JOYSTICK_RADIUS * 0.55, 0);
check(
  "mid drag passes the deadzone with partial deflection",
  mid.x > 0.2 && mid.x < 1,
);

const knobFar = joystickKnobOffset(JOYSTICK_RADIUS * 3, 0);
check(
  "knob visuals clamp to the base circle",
  knobFar.x === JOYSTICK_RADIUS && knobFar.y === 0,
);

const lookRight = lookDelta(100, 0);
const lookUp = lookDelta(0, -100);
check(
  "dragging right looks right and dragging up looks up",
  lookRight.yaw < 0 && lookUp.pitch > 0,
);

check(
  "pitch clamps to sane bounds",
  clampPitch(99) === PITCH_LIMIT && clampPitch(-99) === -PITCH_LIMIT,
);

// --- fox brain --------------------------------------------------------------

const STEP = 1 / 30;

function tickFor(
  brain: FoxBrain,
  seconds: number,
  playerPos: { x: number; z: number },
  playerSpeed = 0,
) {
  let snapshot = brain.tick({ dt: STEP, playerPos, playerSpeed });
  for (let t = STEP; t < seconds; t += STEP) {
    snapshot = brain.tick({ dt: STEP, playerPos, playerSpeed });
  }
  return snapshot;
}

check(
  "fox world limit stays well inside the walkable radius",
  FOX_WORLD_LIMIT <= PLAY_RADIUS - 10,
);

// First-contact guarantee: the fox opens within the alert radius and
// straight ahead of the spawn vista (the camera faces -Z at entry), so its
// very first tick is a freeze-and-stare aimed at the visitor.
const spawnDist = Math.hypot(
  FOX_SPAWN.x - WALKER_START.x,
  FOX_SPAWN.z - WALKER_START.z,
);
check(
  "the fox opens inside alert radius of the walker's start",
  spawnDist < ALERT_RADIUS,
);
check(
  "the fox opens ahead of the spawn vista, not behind it",
  FOX_SPAWN.z < WALKER_START.z - ALERT_RADIUS * 0.4,
);

// Opening encounter rehearsal: standing still at the start, the fox should
// freeze (alert) rather than trot away.
const openBrain = new FoxBrain(FOX_SPAWN, createRng("fox/check/first-contact"));
const openSnap = tickFor(openBrain, 0.6, WALKER_START, 0);
check(
  "the opening beat is a frozen stare, not a wander-off",
  openSnap.state === "alert" && openSnap.speed < 0.3,
);

// A distant walker is none of the fox's business: it trots errands forever.
const farBrain = new FoxBrain({ x: 6, z: -24 }, createRng("fox/check/far"));
let farMoved = false;
let farWanderOnly = true;
for (let t = 0; t < 20; t += STEP) {
  const s = farBrain.tick({ dt: STEP, playerPos: { x: 200, z: 200 }, playerSpeed: 0 });
  if (s.speed > 0.5) farMoved = true;
  if (s.state !== "wander") farWanderOnly = false;
}
check(
  "a distant walker never bothers the fox",
  farMoved && farWanderOnly,
);

// Nearing the fox freezes it mid-stride: it stops and stares.
const alertBrain = new FoxBrain({ x: 0, z: -20 }, createRng("fox/check/alert"));
const alertSnap = tickFor(alertBrain, 0.6, { x: 0, z: -10 }, 3);
check(
  "the fox freezes and stares when the walker nears",
  alertSnap.state === "alert" && alertSnap.speed < 0.3,
);

// Crowding it triggers a real bolt: high speed, and it exits the panic far
// from the walker rather than circling back immediately.
const fleeBrain = new FoxBrain({ x: 0, z: -20 }, createRng("fox/check/flee"));
const crowd = { x: 0, z: -16 };
let sawFlee = false;
let topSpeed = 0;
let exitDist = 0;
let prevFlee = false;
for (let t = 0; t < 6; t += STEP) {
  const s = fleeBrain.tick({ dt: STEP, playerPos: crowd, playerSpeed: 0 });
  if (s.state === "flee") {
    sawFlee = true;
    topSpeed = Math.max(topSpeed, s.speed);
  }
  if (prevFlee && s.state === "wander") {
    exitDist = Math.hypot(s.pos.x - crowd.x, s.pos.z - crowd.z);
  }
  prevFlee = s.state === "flee";
}
check("pressed too close, the fox bolts", sawFlee && topSpeed > 4);
check("the bolt carries it a safe distance away", exitDist > 28);

// Stillness is an invitation: the fox creeps closer but keeps a bubble.
const curBrain = new FoxBrain({ x: 0, z: -20 }, createRng("fox/check/curious"));
const still = { x: 3, z: -13.4 }; // ~7.5m away
let enteredCurious = false;
let closest = Infinity;
let startled = false;
let curiousAt = -1;
for (let t = 0; t < 14; t += STEP) {
  const moving = curiousAt >= 0 && t > curiousAt + 2;
  const s = curBrain.tick({ dt: STEP, playerPos: still, playerSpeed: moving ? 3 : 0 });
  const d = Math.hypot(s.pos.x - still.x, s.pos.z - still.z);
  if (s.state === "curious") {
    if (curiousAt < 0) curiousAt = t;
    enteredCurious = true;
    closest = Math.min(closest, d);
  }
  if (curiousAt >= 0 && s.state === "flee") startled = true;
}
check("a still walker invites a curious approach", enteredCurious);
check("curiosity keeps a comfort bubble", closest > 3.5);
check("a sudden move startles the curious fox", startled);

// Turning is rate-limited: even a panicked pivot never snaps instantly.
const turnBrain = new FoxBrain({ x: 0, z: -20 }, createRng("fox/check/turn"));
const turnPlayer = { x: 0, z: -16 };
let maxJump = 0;
let prevHeading = turnBrain.heading;
let sawFleeTurn = false;
for (let i = 0; i < 240; i += 1) {
  const s = turnBrain.tick({ dt: 1 / 60, playerPos: turnPlayer, playerSpeed: 0 });
  if (s.state === "flee") {
    sawFleeTurn = true;
    const delta = Math.atan2(
      Math.sin(s.heading - prevHeading),
      Math.cos(s.heading - prevHeading),
    );
    maxJump = Math.max(maxJump, Math.abs(delta));
  }
  prevHeading = s.heading;
}
check(
  "the fox turns like a body, not a sprite",
  !sawFleeTurn || maxJump < 0.12,
);

// The director recasts a forgotten fox a stride ahead of the walker.
const recastBrain = new FoxBrain({ x: 0, z: -20 }, createRng("fox/check/recast"));
const walker = { x: 100, z: 20 };
recastBrain.relocate(walker, { x: 1, z: 0 });
const recastSnap = tickFor(recastBrain, 0.1, walker, 0);
const recastDist = Math.hypot(
  recastSnap.pos.x - walker.x,
  recastSnap.pos.z - walker.z,
);
check(
  "relocation keeps the fox in the walker's story",
  recastDist > 25 &&
    recastDist < 90 &&
    recastSnap.state === "wander" &&
    Math.hypot(recastSnap.pos.x, recastSnap.pos.z) <= FOX_WORLD_LIMIT,
);

// Ten simulated minutes of a walker circling the whole meadow: whatever the
// states do, the fox never escapes the world.
const soakBrain = new FoxBrain({ x: 4, z: -18 }, createRng("fox/check/soak"));
let contained = true;
for (let t = 0; t < 600; t += STEP) {
  const px = Math.cos(t * 0.13) * 120;
  const pz = Math.sin(t * 0.17) * 120;
  const s = soakBrain.tick({
    dt: STEP,
    playerPos: { x: px, z: pz },
    playerSpeed: t % 20 < 10 ? 3.2 : 0,
  });
  if (Math.hypot(s.pos.x, s.pos.z) > FOX_WORLD_LIMIT + 0.001) {
    contained = false;
    break;
  }
}
check("ten simulated minutes never leave the world", contained);

// --- daylight ----------------------------------------------------------------

// Sweep the whole arc: every sample must be fully finite and the effect
// gains must stay in [0, 1] — they multiply alpha channels.
let daylightSane = true;
for (let i = 0; i <= 100; i += 1) {
  const s = sampleDaylight(i / 100);
  const colors = [
    s.horizon,
    s.band,
    s.upper,
    s.zenith,
    s.fog,
    s.hemiSky,
    s.hemiGround,
    s.sunColor,
  ];
  const numbers = [
    s.fogDensity,
    s.hemiIntensity,
    s.sunIntensity,
    ...s.sunDir,
  ];
  for (const c of colors) {
    if (c.some((v) => !Number.isFinite(v) || v < 0 || v > 1)) daylightSane = false;
  }
  for (const v of numbers) {
    if (!Number.isFinite(v)) daylightSane = false;
  }
  for (const g of [s.starGain, s.fireflyGain, s.shaftGain]) {
    if (!(g >= 0 && g <= 1)) daylightSane = false;
  }
  if (s.fogDensity <= 0) daylightSane = false;
}
check("daylight samples stay finite and in range across the arc", daylightSane);

check(
  "the dial clamps outside its ends",
  sampleDaylight(-3).sunIntensity === sampleDaylight(0).sunIntensity &&
    sampleDaylight(7).sunIntensity === sampleDaylight(1).sunIntensity,
);

// The two bright anchors really are brighter than the night dip — this is
// the visitor's "too dark? slide toward an end" guarantee.
check(
  "night is dimmer than golden hour and sunrise",
  sampleDaylight(0.55).hemiIntensity < sampleDaylight(0).hemiIntensity &&
    sampleDaylight(0.55).hemiIntensity < sampleDaylight(1).hemiIntensity &&
    sampleDaylight(0.55).sunIntensity < sampleDaylight(1).sunIntensity,
);

// Stars own the night, fireflies dim at sunrise, shafts need a low sun.
const noonish = sampleDaylight(0);
const midnight = sampleDaylight(0.55);
check(
  "stars peak at night while shafts vanish",
  midnight.starGain > noonish.starGain &&
    midnight.shaftGain < noonish.shaftGain,
);

// Interpolation continuity: neighbouring steps never jump wildly (the
// smoothstep between keys keeps relighting cinematic rather than snappy).
let continuousLight = true;
let prev = sampleDaylight(0).fogDensity;
for (let t = 0.004; t <= 1; t += 0.004) {
  const d = sampleDaylight(t).fogDensity;
  if (Math.abs(d - prev) > 0.002) continuousLight = false;
  prev = d;
}
check("the daylight arc changes smoothly", continuousLight);

check(
  "phase names track the arc",
  phaseName(0) === "Golden hour" &&
    phaseName(0.3) === "Dusk" &&
    phaseName(0.55) === "Night" &&
    phaseName(0.8) === "Pre-dawn" &&
    phaseName(1) === "Sunrise",
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll forest checks passed.");
