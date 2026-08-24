// Hand-rolled assertion script, following the planck-to-now precedent.
// Run: node --experimental-strip-types tests/forest.check.ts
// Covers the pure leaf modules only (they must not import three or react).

import { createRng } from "../web/lib/rng.ts";
import {
  PLAY_RADIUS,
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
outer: for (let x = -90; x <= 90; x += 3) {
  for (let z = -90; z <= 90; z += 3) {
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
for (let x = -110; x <= 110; x += 7) {
  for (let z = -110; z <= 110; z += 7) {
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
  Math.abs(centre) < 1 && terrainHeight(95, 95) > 4,
);

check("play radius leaves room inside the mesh", PLAY_RADIUS === 80);

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

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll forest checks passed.");
