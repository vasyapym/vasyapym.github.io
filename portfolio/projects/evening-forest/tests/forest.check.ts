// Hand-rolled assertion script, following the planck-to-now precedent.
// Run: node --experimental-strip-types tests/forest.check.ts
// Covers the pure leaf modules only (they must not import three or react).

import { createRng } from "../web/lib/rng.ts";
import {
  PLAY_RADIUS,
  smoothstep,
  terrainHeight,
} from "../web/lib/heightfield.ts";

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

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll forest checks passed.");
