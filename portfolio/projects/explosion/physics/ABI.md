# Explosion core ABI

The Rust module is the simulation authority. It compiles as a `std`-only
`wasm32-unknown-unknown` `cdylib`; TypeScript loads it with WebAssembly's native
API. All renderer-facing buffers are allocated during `core_init`.

## Exports

```ts
const w = M.core_init(seed, debrisCapacity, stressCapacity, blastRadius);
const filled = new Uint8Array(M.buffer, M.core_ptr_filled(w), N);
// per frame:
M.core_step(w, dtSim, dtReal);
// dispose when done:
M.core_dispose(w);
```

The engine may re-allocate WASM memory **between** exports — never inside
them — so re-resolve `M.buffer` after any import and reuse cached offsets.
No export allocates.

### Simulation

| export | notes |
| --- | --- |
| `core_init(seed: u32, debris_capacity: u32, stress_capacity: f32, blast_radius: f32) -> ptr` | Boxed `World`, never null on success |
| `core_dispose(w)` | safe on null |
| `core_restore(w)` | resets to the untouched blueprint; bumps `world_version` |
| `core_step(w, dt_sim, dt_real)` | fixed 120 Hz substeps; display chase uses `dt_real` |
| `core_pick(w, ox, oy, oz, dx, dy, dz) -> i32` | DDA raycast; `-1` = miss, else voxel index |
| `core_preview_victims(w, ox, oy, oz, dx, dy, dz) -> u32` | dry-run victim count, 0 = miss; pure — does not advance RNG |
| `core_blast(w, ox, oy, oz, dx, dy, dz, radius_scale) -> u32` | mutates; bumps `world_version`; returns victims removed |
| `core_set_params(w, gravity, blast_radius, stress_capacity, restitution, friction)` | clamped; gravity ≤ 0, capacity ∈ [0.05, 1000] |

### Counts

`core_dims_w/_h/_d`, `core_total`, `core_standing`, `core_debris_capacity`,
`core_structure_count`, `core_world_version` — all return 0 on a null or
invalid handle.

### Buffer offsets (u32 byte offsets into linear memory)

| export | view | length |
| --- | --- | --- |
| `core_ptr_filled` | `Uint8Array` | `N = W*H*D` |
| `core_ptr_kind` | `Uint8Array` | `N` |
| `core_ptr_color` | `Uint32Array` | `N` |
| `core_ptr_doomed` | `Uint8Array` | `N` |
| `core_ptr_stress_target` | `Float32Array` | `N` |
| `core_ptr_stress_shown` | `Float32Array` | `N` |
| `core_ptr_instance_of_voxel` | `Int32Array` | `N` |
| `core_ptr_voxel_of_instance` | `Uint32Array` | `core_total` |
| `core_ptr_debris_pos` | `Float32Array` | `3 * capacity` |
| `core_ptr_debris_quat` | `Float32Array` | `4 * capacity` |
| `core_ptr_debris_scale` | `Float32Array` | `3 * capacity` |
| `core_ptr_debris_rgb` | `Uint32Array` | `capacity` |
| `core_ptr_debris_awake` | `Uint8Array` | `capacity` |
| `core_ptr_stats` | fixed `StatsBlock` bytes | 6 words / 24 B |
| `core_ptr_bounds` | `Float32Array` | `6 * structure_count` |

`StatsBlock` layout (little-endian): `standing:u32, doomed:u32, debris:u32, debris_awake:u32, peak_stress:f32, world_version:u32`.
`bounds` stride: `[min_x, min_y, min_z, max_x, max_y, max_z]` per structure, blueprint order.

## Coordinates

`vidx(x,y,z) = (y*D + z)*W + x`; the packed instance list is y-major.
`CELL = 0.26`, `x = (gx - 31.5) * CELL`, `y = (gy + 0.5) * CELL`, and
`z = (gz - 12.5) * CELL`. World Y grows upward from the ground plane `y=0`.## Determinism contract

Fixed seed plus an identical export-call sequence produces identical buffers.
Preview does not advance the simulation RNG; its crater edge uses a pure
seed/voxel hash. Restore regenerates the same blueprint and resets simulation
state while bumping `world_version`.
