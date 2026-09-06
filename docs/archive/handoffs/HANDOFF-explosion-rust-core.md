# Task brief: rebuild the "Explosion" simulation core in Rust → WebAssembly

You are a senior engineer writing code for a repository you cannot see. This brief is
self-contained: everything you need is here. Work from it alone — do **not** ask
questions. Make reasonable decisions on anything unspecified, and document those
decisions. Your responses will be pasted verbatim to an integrating agent that will
build, wire, and test your code in the real repo, so the code must be **complete and
compilable as written** — no placeholders, no `TODO`, no "…rest unchanged", no
truncated files.

## 0. Delivery protocol — read this first

A previous planning pass on this exact task was approved; its decisions are already
baked into this brief (§4). **Do not produce a separate plan, brainstorm, or
analysis response — start delivering Part 1 in your first response.** The deliberation
is done; go straight to code.

Full responses have timed out before, so the deliverable is produced across
**exactly three responses**, each kept under roughly 600 lines of output:

- **Response 1 — Part 1, foundation & blueprint** (§7.1): the design lock-in (dims,
  bounds, the complete frozen memory map) plus the crate manifest, coordinate/rng
  foundations, and the district generator.
- **Response 2 — Part 2, world & structural solvers & blast** (§7.2): the world
  container with init/restore, the support/load/failure solvers, and the blast.
- **Response 3 — Part 3, debris & FFI & docs** (§7.3): rigid-body debris, the final
  complete `lib.rs`, and `ABI.md` with the integration notes.

After each part, end with the exact marker line given in §7 — the user replies
"continue" to trigger the next part.

Rules for all three responses:

- The crate compiles as a whole only once Part 3 lands — that is expected. Every
  individual file must instead be complete and strictly consistent with the frozen
  memory map from Part 1 §0; later parts add logic only, never change a signature,
  a buffer, or a struct field.
- If you hit a length limit, stop cleanly at a file boundary and end with
  `TRUNCATED: <files still owed>` instead of emitting a partial file.
- If, when starting a later part, your earlier parts are no longer in your context,
  say so in one line instead of guessing — the integrating agent will re-paste them.

## 1. Context

### The project

"Explosion" is one of six interactive pieces in a personal portfolio website
(React 19 + Vite 7 + TypeScript strict + three.js 0.185). It is a **real-time
structural demolition lab** rendered with WebGL: the visitor clicks a monument, a
blast carves voxels out of it, a solver collapses anything left without a load path,
and debris tumbles to the ground. It runs in the browser at `localhost:5173/projects/explosion`.

The current implementation is a single TypeScript module (~1500 lines) that owns
*everything*: a voxel world (25×34×7 grid, ~2300 voxels, one arch monument with two
pillar banks plus a couple of small pylons), a flood-fill support solver, a
load-propagation stress solver, pooled instanced-mesh debris with fake
gravity/bounce, sparks/shockwaves/camera shake, WebAudio, and all rendering.

### Why it is being rewritten (the owner's verdict)

The owner judged the current build not strong enough for a portfolio centerpiece:

- the **physics is not convincing** (debris is position+velocity only, no rotation or
  real resting contacts; the "stress solver" is a heuristic; nothing ever fails on
  its own);
- the **explosion is not impressive**;
- the scene is **one small monument** — there is no sense of scale or a living
  district.

The decision (already settled, do not revisit): the **simulation core moves to Rust
compiled to WebAssembly** — a well-acknowledged systems language running in the
browser is exactly the portfolio statement the owner wants, and this workload
(structural solvers + thousands of rigid bodies at 60 fps) is its ideal showcase.
Rendering **and all TypeScript glue** stay with the integrating agent: you deliver
Rust plus one markdown contract; the agent writes the wasm loader/wrapper and the
renderer wiring.

### Prior decisions you must preserve (project history)

Earlier iterations established signature features that visitors and automated checks
now expect. Keep them working — stronger, not removed:

- **X-ray stress map** (toggle with `x`): load-bearing voxels burn hot, relaxed ones
  stay cool; after every shot the heat visibly *reroutes* over ~1 s (a display-value
  lag chasing the solved value).
- **Bullet time**: holding Shift dilates simulation time to ~0.22×.
- **Collapse cam**: when a condemned cascade is large (currently ≥ 50 voxels), time
  auto-dilates to ~0.3× for ~2.6 s — the "signature moment" when a span comes down.
- **Aim preview**: hovering shows a ghost ring + a chip saying `≈ N voxels` — the
  solver's verdict before firing. Over open sky the chip clears.
- **Honest miss**: a shot into open sky registers as a shot (audio thud + faint
  pressure ring) but must change nothing. No fake explosions.
- **Integrity fixpoint**: after any destruction, the solver re-runs until stable —
  nothing may hang in the air waiting for a second click; the ruin must settle.
- **Restore**: one click rebuilds the full scene with a rising per-voxel animation
  (bottom-up, ~1.15 s) and clears all debris.
- **Charge placement**: a blast is placed by marching the ray into the struck
  material and sitting the charge at the middle of the filled run it meets — solid
  pillars get cut clean through their depth, thin shells catch the burst inside.
  Keep this behavior (it is what makes "one direct hit takes a visible bite").

## 2. Architecture seam (settled — build exactly this split)

**Your Rust core owns simulation truth:**
voxel world + district blueprint, DDA ray picking, blast carving, support/stress
solvers, progressive failure scheduling, rigid-body debris, display-stress lag, stats.

**TypeScript keeps (the integrating agent writes ALL of it):** three.js
scene/instanced rendering, camera, lights, sparks/shockwave rings/dust particles,
WebAudio, input, HUD DOM, color-painting policy (x-ray gradient, ember shimmer, doom
tint), rebuild animation, collapse-cam/bullet-time policies, the wasm loader and
typed-array wrapper. Your only deliverables are the Rust crate and `ABI.md`.

## 3. Hard technical requirements

1. **Toolchain**: Rust stable (1.97), target `wasm32-unknown-unknown`, plain
   `cargo build --release --target wasm32-unknown-unknown`. The `.wasm` artifact is
   built and committed by the integrating agent; you never run anything.
2. **Zero external crates.** `std` only (`crate-type = ["cdylib"]`). No
   wasm-bindgen/wasm-pack. All exports are `#[no_mangle] pub extern "C" fn` taking /
   returning only `u32`, `i32`, `f32`, and raw pointers.
3. **No `std::time`** (panics on this target). The core is stepped explicitly.
4. **Determinism**: internal RNG — splitmix64 seeding step feeding a xorshift64*
   stream (approved decision), implemented by you, threaded explicitly through
   blueprint generation and simulation. Same seed + same call sequence ⇒ identical
   states. No global entropy.
5. **Fixed timestep**: `step` takes `dt_sim` (already time-dilated by the caller) and
   `dt_real`; internally advances fixed 1/120 s substeps with an accumulator, clamping
   incoming `dt_sim` to 0.05 s. Display-stress lag chases using `dt_real` (so x-ray
   rerouting stays visible during bullet time), physics uses `dt_sim`.
6. **Memory contract**: allocate **all** buffers during `init`; after `init` returns,
   the module must never grow linear memory (the TypeScript side caches typed-array
   views). Scratch space is preallocated; the steady-state `step` performs **no
   allocation** — flood-fill/BFS use preallocated stacks/queues sized to the voxel
   count, debris spawns recycle pool slots and never push.
7. **SoA read-back**: per-frame data crosses as flat typed arrays behind pointer
   getters — never per-voxel exported function calls in hot loops.
8. **Safety**: exported functions validate indices and return 0 / no-op on invalid
   input; no panics across the FFI (`panic = "abort"` in the release profile).
9. **Profile**: `[profile.release]` with `opt-level = "s"`, `lto = true`,
   `codegen-units = 1`, `panic = "abort"`, `strip = true`.
10. **Performance budget**: `step` over ~25k–50k standing voxels + up to 5000 active
    debris must stay ≲ 3 ms on a mid laptop. Keep solver passes tight, reusable
    scratch buffers, branch-lean hot loops.

## 4. Simulation feature spec (the "wow" list — approved decisions included)

### 4.1 A district, not one monument

Generate the blueprint procedurally in Rust (deterministic given seed, **column-first
from each structure's ground row so every voxel has a load path at generation time**):

- **Hero monument near center**: an arch/portal structure with **two load-bearing
  pillar banks and a span** (55–70% of grid height), echoing the current build. The
  span must be supported *only* by the two banks, so severing both leaves it
  condemned by the flood-fill, and a lone surviving pillar must concentrate > 80%
  peak stress — this topology is the aiming anchor for automated tests.
- **At least 4 more distinct structures**, structurally independent (each rooted in
  its own ground footprint, so a blast on one never condemns another through a shared
  ground row): e.g. a slender tower, a multi-pier bridge or long wall, a stepped
  ziggurat or domed hall, a chimney/obelisk. Varied heights and footprints, no
  floating geometry.
- A shared plinth/groundworks band (basalt), plus **~3.5% teal accent voxels**
  scattered across all structures (existing aesthetic).
- Grid dims: your choice in **W 56–72, H 36–48, D 16–28 cells** (cell size fixed at
  0.26 world units). Target roughly **25k–50k standing voxels** — lock the final dims
  in Part 1 and do not change them later.
- Document every structure's world-space bounding box (Part 1 §0) — the integrating
  agent aims tests and the camera with it.

### 4.2 Structural solvers, every frame

- **Support**: 6-connectivity flood-fill from the ground row. **Condemnation is
  instantaneous and total per solve** (nothing may float between frames); the doom
  timers only stagger when already-condemned voxels visibly break (~0.04–0.22 s +
  (y/H)·0.18, seeded RNG). Re-run as a fixpoint after any change, including after
  scheduled breaks.
- **Load/stress**: BFS distance-to-ground field, then a single pass over voxels in
  decreasing distance order — each splits its accumulated load evenly among
  neighbours exactly one step closer to the ground; stress = load / capacity.
  Calibrate the default capacity so the **intact hero idles at ~15–25% peak stress
  while a lone surviving pillar after a cut exceeds 80%**.
- **Progressive failure**: sustained stress ≥ 1.0 cracks a voxel (doomed flag) and
  breaks it after a short jittered delay — overloads must chain-react.
- **Display stress**: per-voxel shown value chases the solved value (rate ≈ 4.2/s,
  driven by `dt_real`) — that lag is the visible rerouting. Solving every frame is
  fine at this scale in Rust.

### 4.3 Real rigid-body debris

- Each spawned piece: position, velocity, **orientation quaternion, angular
  velocity**, half-size, color (inherited from its voxel), awake/asleep.
- **Blast impulse**: falloff with distance from the charge + upward bias + seeded
  random tumble; pieces condemned by the solver (no blast nearby) get only a small
  settling nudge — a demolition must look different from a structural collapse.
- **Ground plane contact** at y = 0 (restitution ≈ 0.36, tangential friction ≈ 0.68,
  angular damping); quaternion integration is a small-angle update + renormalization
  per substep; clamp velocities and guard against NaN so a pathological impulse can
  never propagate bad state across the FFI.
- **Sleep** when |vy| < 0.55 and horizontal speed < 0.4; slept pieces persist as
  rubble until recycled (pool full ⇒ oldest-first) or restore. This replaces the
  current fade-out-and-vanish — the ruin must read as a ruin.
- Debris–debris collisions are **out of scope** (document the trade-off).
- Capacity is an init parameter (default 5000; the caller passes ~2200 on mobile).

### 4.4 Blast

- `blast(ray)` runs the DDA pick itself; on miss it returns 0 and mutates nothing.
  On hit: march the filled run to place the charge (keep §1 behavior), carve a
  sphere (radius in cells, default 3.4, caller may scale per shot ~0.92–1.0),
  deterministic edge jitter so craters look eroded rather than machined, count
  victims, spawn debris with impulses, bump the world version, re-solve. A single
  blast may straddle two structures — carving and solving operate on the global grid,
  so this must fall out naturally.
- `preview(ray)` — pure dry-run returning the victim count for the aim chip.

## 5. Public contract that must keep working (integration)

The TypeScript page exposes this handle (unchanged signature; the integrating agent
re-implements it on top of your core):

```ts
export type SpecimenStats = {
  voxels: number;      // standing
  total: number;       // blueprint total
  debris: number;      // active pool size
  fps: number;
  slowmo: boolean;
  peakStress: number;  // 0..1
  engagements: number; // collapse-cam count (TS policy)
};
export type SpecimenHandle = {
  detonateAt: (x: number, y: number) => boolean; // client px → ray → core.blast
  restore: () => void;
  setMuted: (muted: boolean) => void;
  setSlowMo: (on: boolean) => void;
  setXray: (on: boolean) => void;
  readonly stats: SpecimenStats;
  dispose: () => void;
};
```

A headless Puppeteer suite drives the page and asserts on DOM hooks — these must
remain reachable (names are fixed):

- `#explosion-stage canvas` — WebGL canvas inside the stage;
- first `.explosion-stage-copy span` — `lx-01 · NNN shots` (shots counter regex `(\d+)\s+shots`);
- `.explosion-stage-copy strong` — integer `% standing` (100 on load and after restore);
- `.explosion-telemetry` — `N voxels · M debris · peak X% stress · Y fps`;
- `.explosion-target-chip` — `≈ N voxels` over structure, hidden over sky;
- `.explosion-hint` — contains "dilat…" while the collapse cam is engaged; also
  `#explosion-stage[data-engagements]` must increment on a big cascade;
- `.explosion-control-restore`, `.explosion-control-xray[aria-pressed]`,
  `.explosion-control-sound[aria-pressed]`.

Behavioral assertions the suite makes (your core must make these possible): starts
100% ⇒ shots reduce it; cutting one hero pillar reroutes load (peak stress climbs to
≥ 60%); severing both pillar banks cascades the span and engages the collapse cam;
the ruin settles with no stragglers; restore returns to 100% and debris drains to 0
even when restore lands mid-cascade; a sky shot registers but changes nothing; a
single direct hit takes a visible bite; zero console errors. The suite runs Chrome
with **software WebGL (SwiftShader)** — the TS-side per-frame cost must stay lean;
your core gives it cheap state to read.

**Consequences for the core API** (make sure these are all possible):
- `standing` and `total` counts (`standing` includes doomed-but-not-yet-broken
  voxels; they leave the count only when they actually break);
- the TypeScript side can iterate standing voxels via a maintained packed list
  (instance ⇄ voxel index maps, kept **y-major so the bottom-up rebuild animation can
  walk instances by height**; rebuild the packed list whenever the world version
  bumps);
- per-voxel flags readable as arrays: `filled`, `kind`, `doomed`, `stress_shown`, `color`;
- a `world_version` counter bumped only on structural change (lets the TS side
  repaint instance colors only when dirty);
- a debris pool SoA (pos, quat, scale, rgb, awake) + `debris_count`;
- `pick` returning miss (−1) so TS can play the honest-miss path;
- a `core_dispose()` that reconstructs and drops the World (unmount hygiene).

## 6. Reference values from the current build (starting points, not gospel)

| Parameter | Value |
|---|---|
| Cell size | 0.26 world units; ground plane y=0; world pos: `x=(gx-(W-1)/2)*CELL`, `y=(gy+0.5)*CELL`, `z=(gz-(D-1)/2)*CELL` |
| Grid (old) | 25×34×7 → new dims per §4.1 |
| Blast radius | 3.4 cells (per-shot roll 0.92–1.0×) |
| Gravity | −13 world units/s² (keep for continuity) |
| Debris bounce / sleep | vy×−0.36, tangential ×0.68 on bounce; sleep when \|vy\|<0.55 and horizontal <0.4 |
| Doom delay | 0.04–0.22 s + (y/H)·0.18 |
| Stress display lag | 4.2/s chase rate |
| Collapse-cam threshold | ≥ 50 condemned (TS policy; core just exposes the count) |
| Palette (hex) | basalt 0x5a5446 · bone 0xe9e0d0 · ochre 0xff9d4d · lintel 0xd8cdb6 · ember 0xffc77b · teal accent 0x5bb6bd; per-voxel brightness jitter ×0.9–1.08 |
| Camera (TS, for scale sense) | fov 40, pos (0, 4.7, 20.5), target (0, 3.85, 0) — the integrating agent will pull it back for the district |
| Stage size | ~500–720 px tall, full column width |

## 7. What each response contains

### 7.1 Response 1 — Part 1, foundation & blueprint

1. **§0 Design lock-in** ≤ 50 lines — this section is the single source of truth all
   later parts must obey, so make it precise:
   - final grid dims (W×H×D, locked from now on) and the target standing-voxel count;
   - the **complete frozen memory map**: every buffer the FFI will expose (`filled`,
     `kind`, `color`, `doomed`, `stress_target`, `stress_shown`,
     `instance_of_voxel`, `voxel_of_instance`, the debris SoA fields, the stats
     block, structure bounds) with element type, length in elements, per-element
     layout, and the getter name that will export it;
   - the **frozen dynamic-export signatures** — `core_step`, `core_pick`,
     `core_preview_victims`, `core_blast`, `core_set_params` — with exact C
     signatures and units;
   - the frozen stats-block layout: fixed `#[repr(C)]` — `standing: u32,
     doomed: u32, debris: u32, debris_awake: u32, peak_stress: f32,
     world_version: u32` (shots / engagements / fps / slow-mo stay client-side — do
     not model them);
   - the structure-bounds table (world-space AABB per structure);
   - the module map (which file owns what).
2. `portfolio/projects/explosion/physics/Cargo.toml` — cdylib, `opt-level = "s"`,
   `lto = true`, `codegen-units = 1`, `panic = "abort"`, `strip = true`.
3. `src/coords.rs` — index formula `voxelIndex(x,y,z) = (y*D + z)*W + x`, grid/world
   transforms, dims.
4. `src/rng.rs` — splitmix64 seeding + xorshift64* stream.
5. `src/blueprint.rs` — the district generator per §4.1, writing into the world
   arrays, deterministic from seed, filling the structure-bounds table.

End with the exact line: `END OF PART 1 — reply "continue" for Part 2.`

### 7.2 Response 2 — Part 2, world & structural solvers & blast

1. **§0** ≤ 10 lines: drift notes only (ideally "none").
2. `src/world.rs` — the **complete** `World` struct exactly as the Part 1 memory map
   requires: every field the finished design needs (per-voxel arrays, solver/BFS
   scratch preallocated to the voxel count, doom timers, debris SoA pool with
   recycle cursor, tuning params, accumulator, world-version counter) — Part 3 adds
   logic only, never fields. Plus `init(seed, debris_capacity, stress_capacity,
   blast_radius)` (generate blueprint, initial counts) and `restore()` (in-place
   blueprint regen, clear debris pool + cursor, reset doom/stress state, bump
   world_version).
3. `src/solvers.rs` — support flood-fill, BFS distance + load/stress pass, display
   chase, failure scheduler, fixpoint re-solve (§4.2).
4. `src/blast.rs` — DDA pick, run-march charge placement, carve + victims +
   impulses + preview dry-run (§4.4).

End with the exact line: `END OF PART 2 — reply "continue" for Part 3.`

### 7.3 Response 3 — Part 3, debris & FFI & docs

1. **§0** ≤ 10 lines: drift notes only (ideally "none"), final calibration numbers
   for the stress-capacity default.
2. `src/debris.rs` — rigid-body integration, ground contact, sleep, oldest-first
   recycling, NaN/velocity clamps (§4.3).
3. `src/lib.rs` — the **final, complete** FFI: leaked World handle, `core_init`,
   `core_dispose`, `core_restore`, meta getters (dims, total, standing), every buffer
   pointer getter from the Part 1 memory map, `core_world_version`, structure-bounds
   export, and real implementations of the five dynamic exports with the exact frozen
   signatures. `core_step(dt_sim, dt_real)` clamps dt, runs the 1/120 s accumulator
   substeps (doom timers advance inside substeps), re-solves after any structural
   change, fills the stats block, bumps `world_version` only on structural change.
4. `ABI.md` — the complete contract, in this order: every export (signature, units,
   return semantics, state effects); the full memory map (restated cleanly from
   Part 1 §0 — element type, length, per-element layout, getter name per buffer);
   coordinate system + index formula; lifecycle rules (call order, pointer
   stability, the never-grow guarantee, the view-rebuild rule on `memory.buffer`
   identity change); determinism guarantee; the structure-bounds table; the
   **integration checklist** for the integrating agent (what to call per frame and
   on pointer move / click / restore / x-ray / slow-mo / dispose); a tuning-knobs
   table; and the edge cases handled: restore mid-cascade, pool recycling under
   fire, NaN/velocity clamps, dt spikes, blasts at grid borders, one blast
   straddling two structures.

End with the exact line: `END OF PART 3 — deliverable complete.`

### Style (all responses)

Code and comments in English. Comments explain constraints and intent (why), not
narration. Idiomatic, dense, well-factored Rust; no dead code. Expected ballpark:
~1000–1500 lines of Rust total. Density beats verbosity, but **completeness beats
everything** — never emit a partial file.

## 8. Definition of done

- The assembled crate compiles: `cargo build --release --target
  wasm32-unknown-unknown` with **zero errors** (target zero warnings), std only —
  verify line by line mentally against the Part 1 §0 map; the integrating agent
  compiles it verbatim and smoke-tests `init → total/standing counts → restore →
  same counts` through your exports.
- Every export is documented in `ABI.md`; the memory map is final; no capability in
  §5 is impossible through your API; no placeholders, no TODOs, no truncated logic,
  deterministic simulation, no post-init memory growth.
- Parts 2 and 3 changed nothing frozen in Part 1 §0 (dims, buffers, signatures,
  stats layout) — any unavoidable discrepancy must be flagged in that part's §0.
