const WASM_URL = new URL("./physics_core.wasm", import.meta.url);

export type CoreStats = {
  standing: number;
  doomed: number;
  debris: number;
  debrisAwake: number;
  peakStress: number;
  worldVersion: number;
};

type Exports = {
  memory: WebAssembly.Memory;
  core_init: (seed: number, debrisCapacity: number, stressCapacity: number, blastRadius: number) => number;
  core_dispose: (world: number) => void;
  core_restore: (world: number) => void;
  core_step: (world: number, dtSim: number, dtReal: number) => void;
  core_pick: (world: number, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number) => number;
  core_preview_victims: (world: number, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number) => number;
  core_blast: (world: number, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, radiusScale: number) => number;
  core_set_params: (world: number, gravity: number, blastRadius: number, stressCapacity: number, restitution: number, friction: number) => void;
  core_dims_w: (world: number) => number;
  core_dims_h: (world: number) => number;
  core_dims_d: (world: number) => number;
  core_total: (world: number) => number;
  core_standing: (world: number) => number;
  core_debris_capacity: (world: number) => number;
  core_world_version: (world: number) => number;
  core_ptr_filled: (world: number) => number;
  core_ptr_kind: (world: number) => number;
  core_ptr_color: (world: number) => number;
  core_ptr_doomed: (world: number) => number;
  core_ptr_stress_shown: (world: number) => number;
  core_ptr_instance_of_voxel: (world: number) => number;
  core_ptr_voxel_of_instance: (world: number) => number;
  core_ptr_debris_pos: (world: number) => number;
  core_ptr_debris_quat: (world: number) => number;
  core_ptr_debris_scale: (world: number) => number;
  core_ptr_debris_rgb: (world: number) => number;
  core_ptr_debris_awake: (world: number) => number;
  core_ptr_stats: (world: number) => number;
  core_ptr_bounds: (world: number) => number;
};

export type CoreViews = {
  filled: Uint8Array;
  kind: Uint8Array;
  color: Uint32Array;
  doomed: Uint8Array;
  stressShown: Float32Array;
  instanceOfVoxel: Int32Array;
  voxelOfInstance: Uint32Array;
  debrisPos: Float32Array;
  debrisQuat: Float32Array;
  debrisScale: Float32Array;
  debrisRgb: Uint32Array;
  debrisAwake: Uint8Array;
};

export type PhysicsCore = {
  readonly exports: Exports;
  readonly world: number;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly total: number;
  readonly debrisCapacity: number;
  readonly views: CoreViews;
  readonly stats: CoreStats;
  refreshViews: () => void;
  step: (dtSim: number, dtReal: number) => void;
  restore: () => void;
  pick: (origin: readonly [number, number, number], direction: readonly [number, number, number]) => number;
  preview: (origin: readonly [number, number, number], direction: readonly [number, number, number]) => number;
  blast: (origin: readonly [number, number, number], direction: readonly [number, number, number], radiusScale: number) => number;
  dispose: () => void;
};

function pointer(exports: Exports, world: number, offset: number, length: number, Type: Float32ArrayConstructor): Float32Array;
function pointer(exports: Exports, world: number, offset: number, length: number, Type: Uint8ArrayConstructor): Uint8Array;
function pointer(exports: Exports, world: number, offset: number, length: number, Type: Uint32ArrayConstructor): Uint32Array;
function pointer(exports: Exports, world: number, offset: number, length: number, Type: Int32ArrayConstructor): Int32Array;
function pointer(exports: Exports, world: number, offset: number, length: number, Type: Float32ArrayConstructor | Uint8ArrayConstructor | Uint32ArrayConstructor | Int32ArrayConstructor): Float32Array | Uint8Array | Uint32Array | Int32Array {
  return new Type(exports.memory.buffer, offset, length);
}

export async function loadPhysicsCore(seed: number, debrisCapacity: number): Promise<PhysicsCore> {
  const response = await fetch(WASM_URL);
  const bytes = await response.arrayBuffer();
  const instance = await WebAssembly.instantiate(bytes, {}) as WebAssembly.WebAssemblyInstantiatedSource;
  const exports = instance.instance.exports as unknown as Exports;
  const world = exports.core_init(seed >>> 0, debrisCapacity >>> 0, 280, 3.4);
  const width = exports.core_dims_w(world);
  const height = exports.core_dims_h(world);
  const depth = exports.core_dims_d(world);
  const total = exports.core_total(world);
  const capacity = exports.core_debris_capacity(world);
  const n = width * height * depth;
  let views: CoreViews;
  let buffer = exports.memory.buffer;

  const refreshViews = () => {
    if (buffer === exports.memory.buffer && views) return;
    buffer = exports.memory.buffer;
    views = {
      filled: pointer(exports, world, exports.core_ptr_filled(world), n, Uint8Array),
      kind: pointer(exports, world, exports.core_ptr_kind(world), n, Uint8Array),
      color: pointer(exports, world, exports.core_ptr_color(world), n, Uint32Array),
      doomed: pointer(exports, world, exports.core_ptr_doomed(world), n, Uint8Array),
      stressShown: pointer(exports, world, exports.core_ptr_stress_shown(world), n, Float32Array),
      instanceOfVoxel: pointer(exports, world, exports.core_ptr_instance_of_voxel(world), n, Int32Array),
      voxelOfInstance: pointer(exports, world, exports.core_ptr_voxel_of_instance(world), total, Uint32Array),
      debrisPos: pointer(exports, world, exports.core_ptr_debris_pos(world), capacity * 3, Float32Array),
      debrisQuat: pointer(exports, world, exports.core_ptr_debris_quat(world), capacity * 4, Float32Array),
      debrisScale: pointer(exports, world, exports.core_ptr_debris_scale(world), capacity * 3, Float32Array),
      debrisRgb: pointer(exports, world, exports.core_ptr_debris_rgb(world), capacity, Uint32Array),
      debrisAwake: pointer(exports, world, exports.core_ptr_debris_awake(world), capacity, Uint8Array),
    };
  };

  const stats: CoreStats = { standing: total, doomed: 0, debris: 0, debrisAwake: 0, peakStress: 0, worldVersion: 1 };
  const readStats = () => {
    refreshViews();
    const offset = exports.core_ptr_stats(world);
    const values = new DataView(exports.memory.buffer, offset, 24);
    stats.standing = values.getUint32(0, true);
    stats.doomed = values.getUint32(4, true);
    stats.debris = values.getUint32(8, true);
    stats.debrisAwake = values.getUint32(12, true);
    stats.peakStress = values.getFloat32(16, true);
    stats.worldVersion = values.getUint32(20, true);
  };

  refreshViews();
  readStats();
  let disposed = false;
  const guard = () => !disposed && world !== 0;
  const callRay = (fn: Exports["core_pick"], origin: readonly [number, number, number], direction: readonly [number, number, number]) => fn(world, origin[0], origin[1], origin[2], direction[0], direction[1], direction[2]);

  return {
    exports,
    world,
    width,
    height,
    depth,
    total,
    debrisCapacity: capacity,
    get views() { refreshViews(); return views; },
    stats,
    refreshViews: () => { refreshViews(); readStats(); },
    step: (dtSim, dtReal) => { if (guard()) { exports.core_step(world, dtSim, dtReal); readStats(); } },
    restore: () => { if (guard()) { exports.core_restore(world); readStats(); } },
    pick: (origin, direction) => guard() ? callRay(exports.core_pick, origin, direction) : -1,
    preview: (origin, direction) => guard() ? callRay(exports.core_preview_victims, origin, direction) : 0,
    blast: (origin, direction, radiusScale) => guard() ? exports.core_blast(world, origin[0], origin[1], origin[2], direction[0], direction[1], direction[2], radiusScale) : 0,
    dispose: () => { if (!disposed) { disposed = true; exports.core_dispose(world); } },
  };
}
