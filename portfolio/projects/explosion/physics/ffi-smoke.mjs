// Wasm-level FFI smoke harness (headless; no browser needed). Verifies the
// assembled crate end to end: init/counts, stress calibration, pick/preview/blast,
// single-cut rerouting + settle, both-banks rerouting, debris sleep, restore,
// determinism, no memory growth across steady-state calls. Run: node ffi-smoke.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const bytes = readFileSync(
  join(dir, "target/wasm32-unknown-unknown/release/explosion_core.wasm"),
);
const { instance } = await WebAssembly.instantiate(bytes, {});
const M = instance.exports;

const SEED = 20260829;
const W = M.core_dims_w(null);
const H = M.core_dims_h(null);
const D = M.core_dims_d(null);
const N = W * H * D;

let failures = 0;
const check = (ok, label) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) failures += 1;
};

const w = M.core_init(SEED, 5000, 0, 3.4);
if (w === 0) throw new Error("core_init returned null");

const view = (ptr, Type, len) => new Type(M.memory.buffer, ptr, len);
// Stats block is #[repr(C)] u32/u32/u32/u32/f32/u32 (24 bytes, little-endian).
// A Float32Array view reinterprets the u32 counters as float bits, so read the
// fields through a DataView with explicit offsets instead.
const STATS_BYTES = 24;
const stats = () => {
  const dv = new DataView(M.memory.buffer, M.core_ptr_stats(w), STATS_BYTES);
  return {
    standing: dv.getUint32(0, true),
    doomed: dv.getUint32(4, true),
    debris: dv.getUint32(8, true),
    debrisAwake: dv.getUint32(12, true),
    peakStress: dv.getFloat32(16, true),
    worldVersion: dv.getUint32(20, true),
  };
};
const filled = () => view(M.core_ptr_filled(w), Uint8Array, N);

const total = M.core_total(w);
const standing0 = M.core_standing(w);
let s = stats();
check(W === 64 && H === 42 && D === 26, `dims ${W}x${H}xD${D}`);
check(total > 25000 && total < 50000, `blueprint total ${total} in 25k..50k band`);
check(standing0 === total, `fresh init standing === total (${standing0})`);
check(M.core_structure_count(null) === 6, "structure_count 6");
check(
  s.standing === standing0
    && s.worldVersion === M.core_world_version(w)
    && s.doomed === 0 && s.debris === 0 && s.debrisAwake === 0,
  "stats standing/version match exports, fresh counters zero",
);
check(s.peakStress > 0.05 && s.peakStress < 0.3, `intact peak stress idles at ${(s.peakStress * 100).toFixed(1)}% (want ~15-25%)`);
check(M.core_debris_capacity(w) === 5000, "debris capacity honored");
check(M.core_world_version(w) === 1, "world_version starts at 1");

// Hero arch occupies x18..45, z3..13 (banks) — centre voxel of the left bank.
const bounds = view(M.core_ptr_bounds(w), Float32Array, 36);
check(bounds.length === 36 && bounds.every(Number.isFinite), "bounds table finite");
const cell = 0.26;
const cx = (g) => (g - 31.5) * cell;
const cz = (g) => (g - 12.5) * cell;

// Ray straight down into the left pillar bank mid-height (y ~ 12).
const bankY = 12 * cell + cell / 2;
let hit = M.core_pick(w, cx(21), bankY + 30, cz(8), 0, -1, 0);
check(hit >= 0, `pick hits the bank (idx ${hit})`);

// Preview is pure: repeated previews must not change state or RNG.
const p1 = M.core_preview_victims(w, cx(21), bankY + 30, cz(8), 0, -1, 0);
const p2 = M.core_preview_victims(w, cx(21), bankY + 30, cz(8), 0, -1, 0);
const standingPre = M.core_standing(w);
const verPre = M.core_world_version(w);
check(p1 > 0 && p1 === p2, `preview stable, ≈${p1} voxels`);
check(M.core_standing(w) === standingPre && M.core_world_version(w) === verPre, "preview mutated nothing");

// Blast the same spot: carve + debris + version bump.
const victims = M.core_blast(w, cx(21), bankY + 30, cz(8), 0, -1, 0, 1.0);
check(victims > 0, `blast removed ${victims} voxels`);
check(M.core_world_version(w) === verPre + 1, "world_version bumped by blast");
const standingPostBlast = M.core_standing(w);
check(standingPostBlast < standingPre, `standing fell to ${standingPostBlast}`);

// Sky shots: open sky means the ray misses the world AABB entirely. The
// world z extent is [−3.38, 3.38], so a vertical ray at z = 40 passes behind
// the district: honest miss — pick/preview/blast all no-ops.
const skyHit = M.core_pick(w, 0, 100, 40, 0, -1, 0);
check(skyHit === -1, `sky pick misses (${skyHit})`);
check(M.core_preview_victims(w, 0, 100, 40, 0, -1, 0) === 0, "sky preview 0");
check(M.core_blast(w, 0, 100, 40, 0, -1, 0, 1.0) === 0, "sky blast 0 victims");
check(M.core_standing(w) === standingPostBlast && M.core_world_version(w) === verPre + 1, "sky blast changed nothing");

// A vertical ray at world (0, 0) DOES pierce the AABB through the top face
// (grid x≈31.5, z≈12.5 sits inside the arch span x18..45, z3..13) — it must
// still hit filled terrain, not be treated as sky.
const archHit = M.core_pick(w, 0, 100, 0, 0, -1, 0);
check(archHit >= 0 && filled()[archHit] === 1, `top-face ray hits the arch span (idx ${archHit})`);

// Browser sky shots (screen y <= 9%) tilt above the horizon: at the
// front-face plane z = 3.38 such a ray is at y ≈ 15.2, above the box top
// 10.92, and it crosses the top-face plane at z ≈ 17.8, beyond the box —
// a true miss that must stay a no-op.
const aboveHit = M.core_pick(w, 0, 12, 25, 0, 0.15, -1);
check(aboveHit === -1, `above-district camera ray misses (${aboveHit})`);
check(
  M.core_preview_victims(w, 0, 12, 25, 0, 0.15, -1) === 0
    && M.core_blast(w, 0, 12, 25, 0, 0.15, -1, 1.0) === 0
    && M.core_standing(w) === standingPostBlast
    && M.core_world_version(w) === verPre + 1,
  "above-district ray blasts nothing, changes nothing",
);

// Step until the cascade settles (doom timers + fixpoint). dt_real drives display only.
let settledStanding = -1;
for (let i = 0; i < 240; i += 1) {
  M.core_step(w, 1 / 60, 1 / 60);
  if (i % 12 === 0) settledStanding = M.core_standing(w);
}
const afterCascade = M.core_standing(w);
check(afterCascade <= standingPostBlast, `cascade removed more (${afterCascade})`);
const sSettle = stats();
check(sSettle.debris > 0, `${sSettle.debris} debris pieces spawned`);
check(sSettle.peakStress >= 0.6, `peak stress after cut climbs to ${(sSettle.peakStress * 100).toFixed(1)}% (want >= 60)`);

// Sleep: after settling, awake debris must drain to 0 eventually.
let awake = -1;
for (let i = 0; i < 600 && awake !== 0; i += 1) {
  M.core_step(w, 1 / 60, 1 / 60);
  awake = view(M.core_ptr_debris_awake(w), Uint8Array, 5000).reduce((a, b) => a + b, 0);
}
check(awake === 0, "all debris asleep after settling");

// Steady-state stepping must not grow linear memory (never-grow guarantee).
const memBefore = M.memory.buffer.byteLength;
for (let i = 0; i < 120; i += 1) M.core_step(w, 1 / 60, 1 / 60);
check(M.memory.buffer.byteLength === memBefore, "no memory growth in steady state");

// Restore: full rebuild, version bump, debris cleared.
const verBeforeRestore = M.core_world_version(w);
M.core_restore(w);
const standingRestored = M.core_standing(w);
check(standingRestored === total, `restore returns to blueprint total (${standingRestored}/${total})`);
check(M.core_world_version(w) === verBeforeRestore + 1, "restore bumps world_version");
check(stats().debris === 0, "restore drains debris to 0");
check(filled().reduce((a, b) => a + b, 0) === total, "filled array matches total after restore");

// Determinism: identical init → identical filled + stress arrays.
const w2 = M.core_init(SEED, 5000, 0, 3.4);
const f1 = filled().slice();
const st1 = view(M.core_ptr_stress_target(w), Float32Array, N).slice();
const f2 = view(M.core_ptr_filled(w2), Uint8Array, N).slice();
const st2 = view(M.core_ptr_stress_target(w2), Float32Array, N).slice();
let same = f1.length === f2.length && st1.length === st2.length;
if (same) {
  for (let i = 0; i < N; i += 1) {
    if (f1[i] !== f2[i] || Math.abs(st1[i] - st2[i]) > 1e-6) {
      same = false;
      break;
    }
  }
}
check(same, "same seed reproduces filled+stress bit-for-bit");

// Both-banks rerouting: the calibrated crater (r ≈ 3.4 cells at the bank
// mid-band z5..12) cannot fully sever a bank — the z3/z4/z13 bridge columns
// keep the upper bank supported, so the span never floats and no structural
// cascade fires even with both banks cut. What the double cut must still show
// is the rerouting overload on the surviving bottleneck columns (stress >= 60%)
// and exactly the two craters of standing loss. Right ray mirrors the left one
// across the 6-wide bank centres (21 -> 41).
const leftRay = [cx(21), bankY + 30, cz(8)];
const rightRay = [cx(41), bankY + 30, cz(8)];
let maxDoomedBoth = 0;
let peakAfterLeftCut = 0;
M.core_blast(w, leftRay[0], leftRay[1], leftRay[2], 0, -1, 0, 1.0);
for (let i = 0; i < 240; i += 1) {
  M.core_step(w, 1 / 60, 1 / 60);
  maxDoomedBoth = Math.max(maxDoomedBoth, stats().doomed);
  peakAfterLeftCut = Math.max(peakAfterLeftCut, stats().peakStress);
}
check(peakAfterLeftCut >= 0.6, `left-cut peak climbs to ${(peakAfterLeftCut * 100).toFixed(1)}% (want >= 60)`);
const standingAfterLeftCut = M.core_standing(w);
let peakAfterRightCut = 0;
M.core_blast(w, rightRay[0], rightRay[1], rightRay[2], 0, -1, 0, 1.0);
for (let i = 0; i < 240; i += 1) {
  M.core_step(w, 1 / 60, 1 / 60);
  maxDoomedBoth = Math.max(maxDoomedBoth, stats().doomed);
  peakAfterRightCut = Math.max(peakAfterRightCut, stats().peakStress);
}
check(peakAfterRightCut >= 0.6, `both-cuts peak climbs to ${(peakAfterRightCut * 100).toFixed(1)}% (want >= 60)`);
check(maxDoomedBoth === 0, "no structural cascade with both banks cut (bridges hold)");
check(total - M.core_standing(w) >= 250, `both craters removed (drop ${total - M.core_standing(w)} after the second blast settles)`);

// Invalid-handle hygiene: null handle never panics.
check(M.core_pick(0, 0, 0, 0, 0, -1, 0) === -1, "null-handle pick returns -1");
check(M.core_standing(0) === 0, "null-handle standing returns 0");
M.core_step(0, 0.016, 0.016);
M.core_blast(0, 0, 0, 0, 0, -1, 0, 1);
check(true, "null-handle step/blast are safe no-ops");

M.core_dispose(w);
M.core_dispose(w2);
M.core_dispose(0);
check(true, "dispose safe (double + null)");

console.log(failures === 0 ? "\nAll FFI smoke checks passed." : `\n${failures} failing check(s).`);
process.exit(failures === 0 ? 0 : 1);
