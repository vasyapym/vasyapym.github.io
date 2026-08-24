// Hand-rolled assertion script, following the forest.check precedent.
// Run: node --experimental-strip-types tests/kitty-run.check.ts
// Covers the pure leaf modules only (they must not import three or react).

import { createRng } from "../web/lib/rng.ts";
import { GROUND_MAX, GROUND_MIN, groundY } from "../web/lib/ground.ts";
import { activeCount, createPool, type PoolSlot } from "../web/lib/pools.ts";
import {
  comboMultiplier,
  distanceScore,
  fullHealthBonus,
  healsHeart,
  pickupScore,
} from "../web/lib/score.ts";
import {
  BOX_HALF,
  HOVER_LIFT,
  HOVER_RADIUS,
  TALL_HALF,
  buildChunk,
  chunkSeed,
  firstHazardX,
  isHazard,
  minHazardGap,
  nextChunkOrigin,
} from "../web/lib/spawn.ts";
import { TUNING, jumpLength, jumpPeak, speedFor } from "../web/lib/tuning.ts";

let failures = 0;

function check(name: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
    console.error(`FAIL ${name}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

// --- rng -------------------------------------------------------------------

const a = createRng("kitty-run/check/v1");
const b = createRng("kitty-run/check/v1");
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
check("different seeds diverge", c() !== d());

const e = createRng("range-check");
let inRange = true;
for (let i = 0; i < 10_000; i += 1) {
  const value = e();
  if (!(value >= 0 && value < 1)) inRange = false;
}
check("values stay within [0, 1)", inRange);

// --- ground ----------------------------------------------------------------

let continuous = true;
const EPSILON = 0.001;
outer: for (let x = -400; x <= 400; x += 5) {
  const h0 = groundY(x);
  const hx = groundY(x + EPSILON);
  if (Math.abs(hx - h0) > 0.05 || Number.isNaN(h0)) {
    continuous = false;
    break outer;
  }
}
check("ground height is continuous", continuous);

let bounded = true;
for (let x = -600; x <= 600; x += 3) {
  const h = groundY(x);
  if (h < GROUND_MIN || h > GROUND_MAX) bounded = false;
}
check("ground stays inside its amplitude band", bounded);

// --- tuning relationships ----------------------------------------------------

// Tall top sits at 3 * TALL_HALF above the ground (centre 2 * TALL_HALF
// plus its own half). Collision is a circle: at the apex the circle's
// bottom is peak + centerLift - radius. A well-timed single jump clears
// the tall on a tight skilled line; the double jump clears it generously.
check(
  "well-timed single jump clears the tall obstacle",
  jumpPeak(TUNING.jumpV) + TUNING.kittyCenterLift - TUNING.kittyRadius >
    3 * TALL_HALF + 0.1,
);
check(
  "double jump clears the tall obstacle with room",
  jumpPeak(TUNING.jumpV) + jumpPeak(TUNING.doubleJumpV) +
    TUNING.kittyCenterLift - TUNING.kittyRadius >
    3 * TALL_HALF + 1.0,
);
check(
  "hover gate leaves running headroom",
  HOVER_LIFT - HOVER_RADIUS > TUNING.kittyCenterLift + TUNING.kittyRadius + 0.15,
);

let speedBanded = true;
for (let dist = 0; dist <= 5000; dist += 25) {
  const s = speedFor(dist);
  if (s < TUNING.speedStart - 1e-9 || s > TUNING.speedMax + 1e-9) speedBanded = false;
}
check("speed stays between start and max", speedBanded);
check("speed starts gentle", Math.abs(speedFor(0) - TUNING.speedStart) < 1e-6);

// --- spawn fairness ----------------------------------------------------------

let itemsInsideChunks = true;
let hazardsReachable = true;
let pacingEven = true;
let lengthsBounded = true;
let sawHazard = false;
let sawHeart = false;
let sawStar = false;
let sawHeal = false;

// Inside a multi-hazard pattern the window between two hazards must be
// landable: never tighter than a whisker over one box, never so wide the
// pair reads as two separate patterns.
const MIN_PAIR_GAP = 4.2;
const MAX_PAIR_GAP = 10.2;
const MAX_CHUNK_LENGTH = 24;

let origin = 0;
let prevHazardEnd = Number.NEGATIVE_INFINITY;
for (let i = 0; i < 240; i += 1) {
  const distance = origin;
  const difficulty = Math.min(1, distance / 800);
  const speed = speedFor(distance);
  const chunk = buildChunk(chunkSeed("kitty-run/check/v1", i), origin, difficulty, speed);

  if (chunk.length > MAX_CHUNK_LENGTH || chunk.length < 5) lengthsBounded = false;

  const hazardXs = chunk.items
    .filter((item) => isHazard(item.kind))
    .map((item) => item.x)
    .sort((a, b) => a - b);
  for (let j = 1; j < hazardXs.length; j += 1) {
    const gap = hazardXs[j] - hazardXs[j - 1];
    if (gap < MIN_PAIR_GAP || gap > MAX_PAIR_GAP) pacingEven = false;
  }

  for (const item of chunk.items) {
    if (item.x < origin - 1e-9 || item.x > origin + chunk.length + 1e-9) {
      itemsInsideChunks = false;
    }
    if (item.kind === "heart") sawHeart = true;
    if (item.kind === "star") sawStar = true;
    if (item.kind === "heal") sawHeal = true;
    if (isHazard(item.kind)) {
      sawHazard = true;
      if (item.y < 0.2) hazardsReachable = false;
    }
  }

  const firstHazard = firstHazardX(chunk);
  if (Number.isFinite(firstHazard) && Number.isFinite(prevHazardEnd)) {
    const gap = firstHazard - prevHazardEnd;
    if (gap + 1e-6 < minHazardGap(speed)) hazardsReachable = false;
  }
  if (Number.isFinite(chunk.hazardEnd)) prevHazardEnd = chunk.hazardEnd;

  origin += nextChunkOrigin(chunk, origin, speed);
}
check("every spawn item stays inside its chunk", itemsInsideChunks);
check("hazard groups leave a recoverable gap", hazardsReachable);
check("pattern-internal hazard spacing stays landable and paired", pacingEven);
check("chunk lengths stay bounded", lengthsBounded);
check("the mix contains every kind", sawHazard && sawHeart && sawStar && sawHeal);

const chunkOne = buildChunk(chunkSeed("kitty-run/check/v1", 7), 100, 0.5, 9);
const chunkTwo = buildChunk(chunkSeed("kitty-run/check/v1", 7), 100, 0.5, 9);
check("chunk generation is deterministic", JSON.stringify(chunkOne) === JSON.stringify(chunkTwo));

// Pair spacing must stretch with speed so the reaction window in seconds
// stays put across the whole ramp. Find any seed that builds a pair.
function pairGap(chunk: ReturnType<typeof buildChunk>): number {
  const xs = chunk.items.filter((i) => isHazard(i.kind)).map((i) => i.x).sort((a, b) => a - b);
  return xs.length > 1 ? xs[xs.length - 1] - xs[0] : 0;
}
let pairStretches = false;
let pairFound = false;
for (let i = 0; i < 40 && !pairFound; i += 1) {
  const slowPair = buildChunk(chunkSeed("kitty-run/check/v1", i), 0, 0.9, TUNING.speedStart);
  if (pairGap(slowPair) <= 0) continue;
  pairFound = true;
  const fastPair = buildChunk(chunkSeed("kitty-run/check/v1", i), 0, 0.9, TUNING.speedMax);
  pairStretches = pairGap(fastPair) > pairGap(slowPair) + jumpLength(TUNING.speedStart) * 0.2;
}
check("pair spacing stretches with run speed", pairFound && pairStretches);

const earlyChunk = buildChunk(chunkSeed("kitty-run/check/v1", 3), 0, 0, TUNING.speedStart);
check("heal is gated behind early difficulty", !earlyChunk.items.some((i) => i.kind === "heal"));

// --- score -------------------------------------------------------------------

check("multiplier starts at x1", comboMultiplier(0) === 1);
check("multiplier steps every fourth pickup", comboMultiplier(4) === 2);
check("multiplier caps at x8", comboMultiplier(400) === 8);
check("negative combo is clamped", comboMultiplier(-5) === 1);
check("heart is worth 10 at x1", pickupScore("heart", 0) === 10);
check("star is worth 25 at x1", pickupScore("star", 0) === 25);
check("combo multiplies pickups", pickupScore("heart", 4) === 20);
check("distance score floors", distanceScore(10.9) === 10 && distanceScore(-4) === 0);

// Hearts mend: hearts and big hearts heal, stars never do; at full health
// they convert to bonus points instead of landing silently.
check("hearts and big hearts mend", healsHeart("heart") && healsHeart("heal"));
check("stars never mend", !healsHeart("star"));
check("full-health heart converts to bonus", fullHealthBonus("heart") === 20);
check("full-health big heart converts to a bigger bonus", fullHealthBonus("heal") === 50);
check("stars carry no full-health bonus", fullHealthBonus("star") === 0);

// --- pools -------------------------------------------------------------------

type Particle = { x: number; y: number };
const pool = createPool<Particle>(4, () => ({ x: 0, y: 0 }));

let exhausted = false;
const acquired: PoolSlot<Particle>[] = [];
for (let i = 0; i < 5; i += 1) {
  const slot = pool.acquire();
  if (slot === null) exhausted = true;
  else acquired.push(slot);
}
check("pool exhausts at its size", exhausted && acquired.length === 4);
check("active count tracks acquisitions", activeCount(pool) === 4);

pool.release(acquired[1]);
const recycled = pool.acquire();
check("released slot is recycled first", recycled === acquired[1]);
check("released slot starts inactive on next cycle", pool.acquire() !== recycled);

pool.releaseAll();
check("releaseAll empties the pool", activeCount(pool) === 0);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll kitty-run checks passed.");
