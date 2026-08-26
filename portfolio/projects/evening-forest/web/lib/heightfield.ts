// The single source of truth for ground elevation. The terrain mesh samples
// this to displace vertices, and the walking rig samples it again every frame
// so the camera always stands on the same ground the trees stand on.

export const TERRAIN_SIZE = 520;
export const PLAY_RADIUS = 230;
export const EYE_HEIGHT = 1.65;
// Where the walker spawns (camera, player-position uniform and the fox's
// opening geometry all read this one point).
export const WALKER_START = { x: 0, z: 10 };

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const n00 = hash2(ix, iz);
  const n10 = hash2(ix + 1, iz);
  const n01 = hash2(ix, iz + 1);
  const n11 = hash2(ix + 1, iz + 1);
  return (
    n00 * (1 - sx) * (1 - sz) +
    n10 * sx * (1 - sz) +
    n01 * (1 - sx) * sz +
    n11 * sx * sz
  );
}

// Public so the terrain painter can reuse the same field for colour patches.
export function groundNoise(x: number, z: number): number {
  return valueNoise(x, z);
}

export function terrainHeight(x: number, z: number): number {
  let h = (valueNoise(x / 34, z / 34) - 0.5) * 4.6;
  h += (valueNoise(x / 11 + 7.3, z / 11 + 2.1) - 0.5) * 1.1;
  // Rising rim near the world edge: a soft wall of hills that the fog eats,
  // so the playable boundary never reads as a cliff or a texture seam. The
  // walkable radius ends at 230, and the climb starts before it, so reaching
  // the edge feels like cresting a ridge rather than hitting glass.
  h += smoothstep(196, 258, Math.hypot(x, z)) * 8;
  // Gentle flattening underfoot at the spawn clearing.
  const centre = 1 - smoothstep(4, 18, Math.hypot(x, z));
  h *= 1 - centre * 0.6;
  return h;
}
