# Task brief: fix per-part destruction — floating/intact ghost parts — in "Explosion"

You are a senior engineer writing code for a repository you cannot see. This brief is
self-contained: everything you need is here. Work from it alone — do **not** ask
questions. The diagnosis and the fix design are **already locked** by a verifying pass
against the real code (§3, §4). Do not re-plan, re-design, or brainstorm — deliver the
code exactly as specified. If you believe a locked decision is wrong, implement it as
specified anyway and note your concern in **≤ 3 lines at the very end** of the part.

## 0. Delivery protocol — read this first

The deliverable is produced across **exactly two responses**, each kept under roughly
450 lines of output:

- **Response 1 — Part 1 (§5): the complete updated Rust file `solvers.rs`.**
  End with the marker line: `PART 1 OF 2 COMPLETE — reply "continue" for Part 2 (web render sync).`
- **Response 2 — Part 2 (§6): targeted edits to the TypeScript file `detonate.ts`.**
  End with the marker line: `ALL PARTS COMPLETE — hand back to the integrating agent.`

Rules for both responses:

- Code must be **complete and final as written** — no placeholders, no `TODO`, no
  "…rest unchanged", no pseudo-code. The integrating agent pastes your output into the
  repo verbatim, rebuilds, and runs the tests.
- If you hit a length limit, stop cleanly at a file/block boundary and end with
  `TRUNCATED: <what is still owed>` instead of emitting a partial block.
- If, when starting Part 2, Part 1 is no longer in your context, say so in one line
  instead of guessing — the integrating agent will re-paste it.
- The integrating agent owns building the wasm, running tests, and wiring. Do not
  include build instructions or test-harness code in your output.

## 1. Project & architecture context

"Explosion" is one of six interactive pieces in a personal portfolio website
(React 19 + Vite 7 + TypeScript **strict** + three.js 0.185). It is a real-time
structural demolition lab: the visitor clicks a voxel monument district, a blast carves
voxels out, a solver collapses anything left without a load path, and rigid-body debris
tumbles to the ground. Route: `localhost:5173/projects/explosion`.

Two layers, frozen boundary:

1. **Rust → WebAssembly core** (`physics/src/*.rs`, `std`-only cdylib, no wasm-bindgen,
   raw `#[no_mangle] extern "C"` exports). The core is the **simulation authority**: it
   owns the voxel grid (64×42×26 = 69,888 cells, `CELL = 0.26` world units), the
   support/load/stress solvers, the doom scheduler, and a pooled rigid-body debris
   system. The renderer reads its state through raw pointers into linear memory
   (`core_ptr_filled`, `core_ptr_doomed`, …) plus a 24-byte `StatsBlock`:
   `standing:u32, doomed:u32, debris:u32, debris_awake:u32, peak_stress:f32,
   world_version:u32` (little-endian). **The ABI is frozen** — no export, signature,
   struct-layout, or buffer-size changes.
2. **TypeScript web layer** (`web/detonate.ts` + `web/physics-core.ts`). `detonate.ts`
   renders two `THREE.InstancedMesh`es: `structure` (one instance per standing voxel,
   driven by the core's packed `instance_of_voxel` / `voxel_of_instance` lists) and
   `debrisMesh` (one instance per debris body). It also owns camera, FX
   (shockwaves/sparks/flash/shake), WebAudio, and the rAF loop.

`world_version` is a monotonically increasing counter the core bumps **every time the
standing voxel set changes** (blast carving, restore, and — crucially — every
`break_ready` pass that converts doomed voxels into debris). The web layer already
reads it into `core.stats.worldVersion` every frame but currently **ignores it**.

## 2. Project history & locked decisions you must preserve

- **Locked signature features** (stronger, never removed): x-ray stress map on `x`
  (display heat `stress_shown` chases solved `stress_target` over ~1 s, real-time — not
  dilated); bullet time on Shift (~0.22×); collapse cam (doomed ≥ 50 → ~0.3× for
  ~2.6 s); aim preview chip `≈ N voxels`; honest miss (sky shot changes nothing);
  integrity fixpoint (the ruin settles with no second click); one-click restore
  (full blueprint, debris cleared); charge placement by marching the ray into the
  struck material.
- **Progressive-crack aesthetic**: condemned voxels do not break instantly — each gets
  a randomized `doom_timer` (`0.04–0.22 s` + height bias `× 0.18 s`) and renders red
  (`0xff4d1a`) until it converts to debris. Keep this. The fix must change *when parts
  are condemned*, not eliminate the stagger.
- **Stress calibration**: two entry points, both calibrated, do not touch either.
  Browser loads with `core_init(seed, capacity, 280, 3.4)` (stress capacity 280); the
  headless smoke harness inits with capacity `0` → the World default `390`. Calibrated
  behavior: cutting one pillar bank reroutes load through the survivor and peak stress
  climbs to ≥ 60% but must **not** structurally doom anything in the "both banks cut
  via bridges" scenario (a test asserts zero doomed voxels there).
- **Never-grow guarantee**: steady-state stepping must not grow linear memory; solver
  scratch (`support_queue`, `bfs_queue`) is fixed-capacity, allocated once.
- **Determinism contract**: fixed seed + identical export-call sequence ⇒ identical
  buffers, bit-for-bit (a test re-inits and compares `filled` + `stress_target`).
  Drawing different amounts from the RNG than before is fine — determinism is judged
  against the same build, not across builds.

## 3. The bug and the verified diagnosis

**Owner's report.** When building components are destroyed, two incorrect behaviors:
(1) *Floating fragments* — some broken parts remain suspended in mid-air instead of
falling. (2) *Visual persistence* — some parts register as destroyed but keep appearing
visually intact. Suspected cause: destruction evaluated at group/structure level;
individual parts do not detach/fall/despawn until connected parts in the group break.
Expected: each part reacts to its own destruction immediately; physics applies to any
fragment without a valid support connection regardless of neighbors; visual state must
always match the logical state of each individual part.

**Verified diagnosis — two independent defects.** The core's *stats* are correct; the
browser test suite asserts HUD numbers sourced from those stats, which is why nothing
caught this. The headless smoke harness cannot see the DOM at all.

- **Defect A — the web layer never syncs the structure mesh during a collapse** (this
  produces *both* reported symptoms). In `detonate.ts`, `rebuild()` rewrites the
  `structure` InstancedMesh from core state, but it is only called on: blast click,
  restore, initial load, and the build-animation timeout. The rAF `frame()` loop calls
  `core.step()` every frame — during which the core's doom timers expire,
  `break_ready` converts doomed voxels into falling debris, clears them from the grid,
  and bumps `world_version` — but the loop **never rebuilds the mesh**. So every voxel
  removed by the doom cascade keeps rendering as a static box at its old mid-air
  position with its last painted color: red boxes (condemned at click time, when the
  click's `rebuild` painted them) = "floating fragments"; original-colored boxes
  (condemned in *later* re-solve waves, never repainted) = "visually intact". The real
  debris bodies do fall — the hovering ghosts are stale instances. Ghosts only vanish
  when the *next* click triggers another rebuild, which is also why destruction *looks*
  group-quantized to the owner.
- **Defect B — the core treats already-condemned voxels as live load-bearing members**
  (the literal group-level chaining). In `solvers.rs`, `support_pass` flood-fills
  support from the ground through **all** filled voxels including `doomed == 1` ones,
  and `load_pass` routes load through them the same way. A *disconnected* (unsupported)
  cluster is condemned all at once — that part is fine. But a **stress-overloaded**
  voxel is condemned while still connected, and everything connected to ground *only
  through it* stays formally supported until it physically breaks (~0.04–0.4 s), then
  the next level condemns, and so on: destruction unrolls level-by-level with visible
  pauses, each part hanging until the member it hangs from has broken. Note the
  asymmetry that makes this real: a drainage path to ground is always fully condemned
  (a condemned child's parent is at least as loaded), but *side branches* hanging off a
  condemned member are not — those are the suspended fragments.

## 4. The two fixes (design locked)

**Fix A (web, `detonate.ts`) — per-frame render sync via `world_version`.**
Track the last rendered `world_version`; in the frame loop, after `core.step`, rebuild
the structure mesh whenever the core's version moved. One code path owns the sync; the
build animation is gated out of it. Details in §6.

**Fix B (core, `solvers.rs`) — a condemned member stops bearing load, and the solver
runs to a fixpoint.** `support_pass` and `load_pass` must skip voxels with
`doomed == 1` (not seed them, not propagate through them), and `solve()` must iterate
support → load → failure until no *new* voxels are condemned, so the whole transitive
set of "anything hanging off a condemned member" is condemned **in one solve call** —
each with its own randomized timer, preserving the staggered visible break. Two facts
make this safe and converging: (1) unsupported voxels were *already* unreachable by
both flood fills (a path through an unsupported voxel cannot reach ground), so
skipping `doomed` only changes the treatment of *stress-doomed* (still-connected)
voxels and their dependents; (2) as the doomed set grows, loads can only *drop* (doomed
voxels leave the network taking their weight), so no oscillation is possible — and
doom is sticky, so nothing un-condemns. Typical convergence: one marking iteration +
one confirming iteration; the cap `H + 2` is a belt-and-braces bound.

## 5. Part 1 — Response 1: complete updated `physics/src/solvers.rs`

**Task.** Output the **complete updated file** `solvers.rs` in a single ```rust code
block, ready to overwrite the existing file verbatim. It must compile standalone
against the facts below. Changes are confined to `solve`, `support_pass`,
`load_pass`, and `failure_pass` (which gains a `bool` return: whether any *new* voxel
was condemned this pass). Everything else stays byte-identical in meaning; keep the
file's existing compact style and comment voice (comments state constraints, not
narration). Add a brief comment where the fixpoint loop lives explaining *why* it
converges (doom only grows; loads only drop) and *why* skipping doomed voxels is
correct (their weight is leaving; anything supported only through them has no valid
support). Keep comments tight — the existing file shows the expected density.

**Current file to transform** (this is the exact current content of `solvers.rs`):

```rust
//! Support, distance/load/stress, display lag, and progressive failure.

use crate::coords::{self, D, H, N, W};
use crate::world::World;

#[inline(always)]
fn each_neighbor(i: usize, mut f: impl FnMut(usize)) {
    let x = i % W;
    let z = (i / W) % D;
    let y = i / (W * D);

    if x > 0 {
        f(i - 1);
    }
    if x + 1 < W {
        f(i + 1);
    }
    if z > 0 {
        f(i - W);
    }
    if z + 1 < D {
        f(i + W);
    }
    if y > 0 {
        f(i - W * D);
    }
    if y + 1 < H {
        f(i + W * D);
    }
}

pub fn solve(w: &mut World, _allow_breaks: bool) {
    support_pass(w);
    load_pass(w);
    failure_pass(w);
}

fn support_pass(w: &mut World) {
    w.support.fill(0);

    let mut head = 0usize;
    let mut tail = 0usize;

    // Every filled ground-row voxel is an explicit structural support seed.
    for z in 0..D {
        for x in 0..W {
            let i = coords::vidx(x, 0, z);

            if w.filled[i] != 0 {
                w.support[i] = 1;
                w.support_queue[tail] = i as u32;
                tail += 1;
            }
        }
    }

    while head < tail {
        let i = w.support_queue[head] as usize;
        head += 1;

        each_neighbor(i, |j| {
            if w.filled[j] != 0 && w.support[j] == 0 {
                w.support[j] = 1;
                w.support_queue[tail] = j as u32;
                tail += 1;
            }
        });
    }
}

fn load_pass(w: &mut World) {
    w.distance.fill(u16::MAX);
    w.load.fill(0.0);

    let mut head = 0usize;
    let mut tail = 0usize;

    // Distance 0 is the grounded row. Every voxel carries a unit self-load.
    for z in 0..D {
        for x in 0..W {
            let i = coords::vidx(x, 0, z);

            if w.filled[i] != 0 {
                w.distance[i] = 0;
                w.load[i] = 1.0;
                w.bfs_queue[tail] = i as u32;
                tail += 1;
            }
        }
    }

    // BFS creates nondecreasing distance order, which can be consumed backwards.
    while head < tail {
        let i = w.bfs_queue[head] as usize;
        head += 1;

        let next_distance = w.distance[i].saturating_add(1);

        each_neighbor(i, |j| {
            if w.filled[j] != 0 && w.distance[j] == u16::MAX {
                w.distance[j] = next_distance;
                w.load[j] = 1.0;
                w.bfs_queue[tail] = j as u32;
                tail += 1;
            }
        });
    }

    // Each voxel routes its ENTIRE accumulated load to the single most-loaded
    // neighbour exactly one graph step closer to the ground; ties go to the
    // lowest index (each_neighbor visits in ascending index order, so the
    // strict comparison keeps the first). Real load paths concentrate into a
    // few gravity columns instead of diluting evenly over wide cones, which is
    // what makes a severed bank visibly overload its survivor. The reverse
    // BFS order guarantees all inflow has already arrived when a voxel sends,
    // so the pass is a deterministic DAG accumulation over a drainage tree.
    for pos in (0..tail).rev() {
        let i = w.bfs_queue[pos] as usize;
        let d = w.distance[i];

        if d == 0 {
            continue;
        }

        let mut parent = usize::MAX;
        let mut parent_load = 0.0f32;

        each_neighbor(i, |j| {
            if w.filled[j] != 0
                && w.distance[j] != u16::MAX
                && w.distance[j] + 1 == d
                && w.load[j] > parent_load
            {
                parent = j;
                parent_load = w.load[j];
            }
        });

        if parent != usize::MAX {
            w.load[parent] += w.load[i];
        }
    }

    for i in 0..N {
        w.stress_target[i] = if w.filled[i] != 0 {
            w.load[i] / w.stress_capacity
        } else {
            0.0
        };
    }
}

fn failure_pass(w: &mut World) {
    let h = H as f32;

    for i in 0..N {
        if w.filled[i] == 0 {
            w.doomed[i] = 0;
            w.doom_timer[i] = 0.0;
            continue;
        }

        // Unsupported voxels fail structurally; overloaded supported voxels fail
        // from the stress criterion. Both enter the same visible crack scheduler.
        let condemned = w.support[i] == 0 || w.stress_target[i] >= 1.0;

        if condemned && w.doomed[i] == 0 {
            let (_, y, _) = coords::coords_of(i);

            w.doomed[i] = 1;
            w.doom_timer[i] =
                w.rng.range(0.04, 0.22) + (y as f32 / h) * 0.18;
        }
    }
}

pub fn break_ready(w: &mut World) -> u32 {
    let mut broken = 0u32;

    for i in 0..N {
        if w.filled[i] == 0
            || w.doomed[i] == 0
            || w.doom_timer[i] > 0.0
        {
            continue;
        }

        let (x, y, z) = coords::coords_of(i);
        let (px, py, pz) = w.voxel_center(i);
        let kind = w.kind[i];
        let color = w.color[i];

        // Structural failure gets only a settling nudge, not a blast impulse.
        crate::debris::spawn_settling(
            w,
            px,
            py,
            pz,
            kind,
            color,
            0.10 + (y as f32 / H as f32) * 0.14,
            (x as f32, z as f32),
        );

        w.filled[i] = 0;
        w.doomed[i] = 0;
        w.doom_timer[i] = 0.0;
        w.stress_target[i] = 0.0;
        w.stress_shown[i] = 0.0;
        w.kind[i] = 0;
        w.color[i] = 0;

        broken += 1;
    }

    broken
}

pub fn chase_display(w: &mut World, dt_real: f32) {
    if !dt_real.is_finite() || dt_real <= 0.0 {
        return;
    }

    // dt_real is intentionally not time-dilated: rerouting remains visible during
    // bullet time and collapse cam.
    let step = 4.2 * dt_real.min(0.1);

    for i in 0..N {
        let shown = w.stress_shown[i];
        let target = w.stress_target[i];

        w.stress_shown[i] = if shown < target {
            (shown + step).min(target)
        } else {
            (shown - step).max(target)
        };
    }
}

pub fn solve_and_refresh(w: &mut World) {
    solve(w, false);
    w.refresh_stats();
}
```

**Facts you may rely on (no need to re-derive or re-import anything else).**

- `World` public fields relevant here (types exact): `filled: Vec<u8>`, `kind: Vec<u8>`,
  `color: Vec<u32>`, `doomed: Vec<u8>`, `stress_target: Vec<f32>`,
  `stress_shown: Vec<f32>`, `doom_timer: Vec<f32>`, `support: Vec<u8>`,
  `distance: Vec<u16>`, `load: Vec<f32>`, `support_queue: Vec<u32>`,
  `bfs_queue: Vec<u32>` (each length `N`), `stress_capacity: f32`, `rng: Rng`.
- `coords::vidx(x, y, z) -> usize` (y-major frozen formula), `coords::coords_of(i) ->
  (x, y, z)`, consts `W = 64, H = 42, D = 26, N = W*H*D`.
- `w.rng.range(lo, hi) -> f32` — deterministic RNG on `&mut World`.
- `w.voxel_center(i) -> (f32, f32, f32)` — exists, used by `break_ready`.
- `doom` semantics: `doomed[i] ∈ {0, 1}`, sticky until the voxel breaks
  (`break_ready`) or `restore()` clears it; `advance_substep` decrements
  `doom_timer` and calls `break_ready` for expired voxels, which converts them to
  debris, clears them, bumps `world_version`, and re-solves.
- `solve` call sites: `World::init` and `World::restore` (fresh state, `doomed` all
  zero), after every blast carve, after every `break_ready` pass, and **once per
  frame** from `core_step` (via `solve_and_refresh`). All callers go through
  `World::solve_and_schedule` / `solvers::solve_and_refresh`; the `_allow_breaks`
  parameter is and stays unused.
- `H` is already imported at the top of the file (see the `use` line) — usable for the
  fixpoint cap.

**Design requirements for the new file (all locked, §4).**

1. `solve` loops `{support_pass; load_pass; if !failure_pass { break} }` capped at
   `H + 2` iterations.
2. `support_pass`: ground-row seeds and BFS propagation both require
   `filled != 0 && doomed == 0`.
3. `load_pass`: ground-row seeds and BFS propagation both require
   `filled != 0 && doomed == 0`. Doomed voxels therefore keep `distance == u16::MAX`
   and `load == 0.0`, and their `stress_target` becomes `0.0` via the existing final
   loop (they are leaving; the heat map must not show them as load-bearing). The
   parent-routing loop is unchanged (its queue only ever holds reachable voxels).
4. `failure_pass` returns `bool`: `true` iff at least one voxel **newly** condemned
   this pass (the `doomed[i] = 1` assignment happened). The `filled == 0` cleanup
   branch stays. The timer formula is unchanged.
5. Nothing else in the file changes: `break_ready`, `chase_display`,
   `solve_and_refresh`, `each_neighbor` keep their exact current semantics.
6. No new allocation, no new fields, no signature changes visible outside this file
   (`solve` and `solve_and_refresh` keep their public signatures;
   `failure_pass` is private and may change its signature).

## 6. Part 2 — Response 2: targeted edits to `web/detonate.ts`

**Task.** Deliver exactly **three edits** to `detonate.ts`, in the response format
below. Do not output the whole file — the integrating agent applies the edits
mechanically using the anchors. Match the file's existing dense one-line style and
2-space indentation; TypeScript strict, no new imports, no new helpers beyond what is
specified, no renames.

### Response format for Part 2

For each edit, output exactly:

```
### Edit N — <one-line description>
REMOVE:
<exact current code lines, verbatim from below>
REPLACE WITH:
<the new code lines>
```

### Current code excerpts (verbatim anchors from `detonate.ts`)

The module-level mutable state inside `mountSpecimen` (lines ~153–164):

```ts
  let core: PhysicsCore | null = null;
  let disposed = false;
  let animation = 0;
  let last = performance.now();
  let xray = false;
  let slowMoHeld = false;
  let collapseUntil = 0;
  let building = false;
  let buildStarted = 0;
  let shake = 0;
  let flashIntensity = 0;
```

The frame loop (lines ~272–285):

```ts
  const frame = (now: number) => {
    if (disposed) return;
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    if (core) {
      const dilation = slowMoHeld || now < collapseUntil;
      core.step(dilation ? dt * (slowMoHeld ? 0.22 : 0.3) : dt, dt);
      stats.voxels = core.stats.standing; stats.debris = core.stats.debris; stats.peakStress = core.stats.peakStress;
      if (core.stats.doomed >= COLLAPSE_CAM_THRESHOLD && now >= collapseUntil) { collapseUntil = now + COLLAPSE_CAM_DURATION; stats.slowmo = true; stats.engagements += 1; }
      else if (now >= collapseUntil) stats.slowmo = false;
    }
    updateVisuals(dt, now);
    renderer.render(scene, camera);
    animation = requestAnimationFrame(frame);
  };
```

The restore handler (line ~246, one physical line in the file):

```ts
    restore: () => { if (!core) return; core.restore(); core.refreshViews(); stats.voxels = core.stats.standing; stats.debris = 0; building = !reduced; buildStarted = performance.now(); rebuild(!reduced); repaint(); sfx.resume(); sfx.rebuild(); },
```

Context you need but must **not** modify: `rebuild(animated)` rewrites every structure
instance's matrix (`scale 0.001` when `animated`, else `1`) and color from the core
views (colors include the red `doomed` tint), then sets `structure.count`;
`repaint()` only refreshes colors; `detonateAt` calls `rebuild(false)` right after a
blast (a redundant extra rebuild on the next frame is acceptable — do not touch
`detonateAt`); the load callback also calls `rebuild(false)` once (do not touch it);
`building` is `true` for `BUILD_DURATION` (1.15 s) after restore while the build
animation plays; `core.stats.worldVersion` is a `number` refreshed every `core.step`.

### The three locked edits

1. **State**: add one declaration to the state block —
   `let structureVersion = -1;` (last rendered core `world_version`; the structure
   mesh follows it), placed after `let flashIntensity = 0;`, with a one-line comment
   in the file's voice explaining that the core removes doomed voxels asynchronously
   (doom timers) and bumps `world_version`, so the mesh must chase it every frame.
2. **Frame loop**: inside `if (core) { … }`, after the collapse-cam `if/else` chain
   and before the closing brace, add:
   `if (!building && core.stats.worldVersion !== structureVersion) { structureVersion = core.stats.worldVersion; rebuild(false); }`
   — with a short comment: the mesh must follow `world_version` (doom-timer breaks
   otherwise leave ghost boxes hovering) and the build animation owns the mesh while
   `building`.
3. **Restore**: inside the restore one-liner, immediately after `rebuild(!reduced);`
   insert `structureVersion = core.stats.worldVersion;` (restore bumps the version;
   syncing here keeps the frame-loop sync from double-firing after the build
   animation ends). Keep everything else in that line byte-identical.

**Locked behavioral requirements**: the sync fires at most once per rendered frame;
it must not run while `building`; after a doom cascade the mesh must show each broken
voxel gone the same frame the core removes it (the falling debris mesh replaces it
visually); a blast click keeps its immediate `rebuild(false)`; x-ray repaint and
restore behavior are unchanged.

## 7. Hard constraints (both parts)

- **Frozen ABI**: no changes to exports, `World` field layout/order, `StatsBlock`, or
  buffer sizes. No new wasm exports.
- **Frozen aesthetics**: doom timers (0.04–0.22 s + height bias), red doomed tint,
  collapse-cam threshold, stress rerouting glow — all unchanged.
- **Frozen calibration**: `core_init` call arguments (280 / 3.4) and the World default
  stress capacity 390 stay exactly as they are.
- Style: match each file's own idiom (compact vertical Rust in `solvers.rs`; dense
  one-liners in `detonate.ts`). Comments explain constraints, never narrate.
- No new dependencies, files, or modules. No renaming. No formatting churn outside
  the specified regions.

## 8. Self-check before finishing each part

Part 1 — confirm in your head (no need to print the work):

1. With `doomed` all zero, the new `solve` produces buffers identical to the old one
   (support, distance, load, stress_target, doomed, timers). This is what keeps the
   calibrated smoke scenarios stable.
2. The fixpoint loop terminates (doom is monotone; loads only drop as doomed voxels
   leave the network; cap `H + 2`); steady state exits after one confirming iteration.
3. Queue bounds hold: each pass resets its own `head/tail` and marks, so a pass
   enqueues at most `N` entries.
4. No allocation, no panics on any input the existing callers can produce; the
   empty-world edge (`filled` all zero) is unaffected.
5. These existing smoke assertions must keep passing: fresh init `standing === total`;
   preview mutates nothing; sky blast changes nothing but bumps version; cascade
   removes more; debris spawns and all debris eventually sleeps; peak stress after a
   single bank cut ≥ 0.6; no memory growth in steady state; restore returns to
   blueprint total and bumps version; same seed reproduces `filled` + `stress_target`
   bit-for-bit; **both-banks-cut produces zero doomed voxels** and removes ≥ 250;
   null-handle hygiene.

Part 2 — confirm:

1. The three edits apply cleanly against the verbatim anchors above (exact string
   matches, correct indentation).
2. First frame after load: `structureVersion` is `-1`, so the sync performs one
   rebuild — harmless and intended.
3. TypeScript strict passes: `core.stats.worldVersion` is a plain `number`; no
   implicit any; the `building` guard is a plain boolean.
4. Nothing else in `detonate.ts` is touched — in particular `detonateAt`, the load
   callback, `rebuild`, `repaint`, and `updateVisuals` keep their current code.
