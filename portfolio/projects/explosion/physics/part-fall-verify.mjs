// Regression harness for per-part destruction (the ghost-voxel fix). Headless
// wasm-level proxy for the render sync: while the doom cascade runs (the exact
// window where the renderer rebuilds on world_version changes), the packed
// instance list the mesh is rebuilt from must stay consistent with the logical
// filled state on EVERY step — no ghost instances for broken voxels, no
// dangling slots — and the ruin must hold still after settling (no stragglers).
// Run: node part-fall-verify.mjs
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
const filled = () => new Uint8Array(M.memory.buffer, M.core_ptr_filled(w), N);
const inst = () => new Int32Array(M.memory.buffer, M.core_ptr_instance_of_voxel(w), N);
const vox = () => new Uint32Array(M.memory.buffer, M.core_ptr_voxel_of_instance(w), M.core_total(w));
const standing = () => M.core_standing(w);

// The packed instance list must mirror `filled` exactly at every observation.
function instanceListMatchesLogicalState(label) {
  const f = filled();
  const io = inst();
  const vo = vox();
  const st = standing();

  let filledCount = 0;
  for (let i = 0; i < N; i += 1) filledCount += f[i];

  let ok = filledCount === st;
  let badInstance = -1;
  let badSlot = -1;

  for (let i = 0; i < N && ok; i += 1) {
    if (f[i] !== 0 && io[i] < 0) { ok = false; badInstance = i; }
    if (f[i] === 0 && io[i] >= 0) { ok = false; badInstance = i; }
  }
  for (let k = 0; k < st && ok; k += 1) {
    const v = vo[k];
    if (v >= N || f[v] === 0 || io[v] !== k) { ok = false; badSlot = k; }
  }

  check(ok, `${label}: instance list mirrors filled (standing ${st}${ok ? "" : `, voxel ${badInstance} slot ${badSlot}`})`);
}

instanceListMatchesLogicalState("fresh init");

// Blast the arch span, then watch EVERY step of the doom window. Calibrated
// geometry: this cut does not cascade (bridge columns hold — same as the
// smoke harness asserts), so it exercises per-step consistency, not doom.
M.core_blast(w, 0, 100, 0, 0, -1, 0, 1.0);
const postBlast = standing();

for (let i = 0; i < 240; i += 1) {
  M.core_step(w, 1 / 60, 1 / 60);
  instanceListMatchesLogicalState(`arch-cut step ${i}`);
}

check(standing() === postBlast, `arch top cut (calibrated: bridges hold) removed only direct victims (${standing()} held)`);

// Integrity fixpoint: after the dust settles nothing may fall later — the
// owner's "no stragglers" rule, now enforced by per-part condemnation.
const settled = standing();
for (let i = 0; i < 300; i += 1) M.core_step(w, 1 / 60, 1 / 60);
check(standing() === settled, `ruin holds with no stragglers (${settled} for 300 more steps)`);

// Doom-cascade variant — the browser suite's choreography: two taps through
// the left bank, five through the right (its ray first punches the hall wall).
// Only full severance condemns the unsupported top sections; every doom-timer
// break bumps world_version, and each step must keep the packed instance list
// the (now-synced) renderer rebuilds from perfectly consistent.
M.core_restore(w);
let doomBumps = 0;
const sever = (ox, oy, times) => {
  for (let t = 0; t < times; t += 1) {
    M.core_blast(w, ox, oy, 30, 0, 0, -1, 1.0);
    const vAfterBlast = M.core_world_version(w);
    for (let i = 0; i < 160; i += 1) {
      M.core_step(w, 1 / 60, 1 / 60);
      const v = M.core_world_version(w);
      if (v !== vAfterBlast) doomBumps += 1;
      instanceListMatchesLogicalState(`sever (${ox},${oy}) tap ${t} step ${i}`);
    }
  }
};
sever(-2.34, 4.9, 2);
sever(2.55, 3.0, 5);
check(doomBumps > 0, `severing produced ${doomBumps} doom-break version bumps (each now triggers a mesh rebuild)`);
const afterSever = standing();
check(afterSever < 26411 - 400, `severing restructured the district (${26411} -> ${afterSever})`);
for (let i = 0; i < 300; i += 1) M.core_step(w, 1 / 60, 1 / 60);
check(standing() === afterSever, `severed ruin holds with no stragglers (${afterSever} for 300 more steps)`);

M.core_dispose(w);

console.log(failures === 0 ? "\nAll per-part destruction checks passed." : `\n${failures} failing check(s).`);
process.exit(failures === 0 ? 0 : 1);
