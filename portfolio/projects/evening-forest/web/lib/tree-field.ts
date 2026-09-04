// web/lib/tree-field.ts
//
// Pure, headless description of the evening-forest treeline: where every trunk
// stands (`collectSpots`) and how the walking rig should collide with them
// (`collectTreeColliders` / `createTreeField`).
//
// This module imports neither `three` nor `react`, so it can be asserted
// directly under `node --experimental-strip-types` next to the rest of web/lib/.
//
// The scatter used to live inside web/scene/Trees.tsx; it moved here VERBATIM so
// the renderer and the collision system read from ONE source of truth for tree
// placement. Change a number here and both visuals and collision follow.

// Explicit .ts extensions on the relative imports: this is the one lib module
// the headless check loads directly, and node --experimental-strip-types (unlike
// the bundler) refuses extensionless relative specifiers.
import { scatterCells } from "./rng.ts";
import { smoothstep } from "./heightfield.ts";

// Covers the full walkable circle (radius 230) plus margin, so the treeline
// never ends inside the fog.
export const HALF_EXTENT = 235;
export const MIN_RADIUS = 11;

// Tiny local linear-interpolation helper — copied rather than imported to keep
// this leaf module self-contained and dependency-free.
function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export type TreeSpot = {
  x: number;
  z: number;
  rotationY: number;
  scale: number;
  amber: boolean;
};

export function collectSpots(): { pines: TreeSpot[]; broadleaf: TreeSpot[] } {
  const pines: TreeSpot[] = [];
  const broadleaf: TreeSpot[] = [];
  const cells = scatterCells({
    seed: "evening-forest/trees/v1",
    halfExtent: HALF_EXTENT,
    minRadius: MIN_RADIUS,
    step: 6.4,
    jitter: 2.7,
  });
  for (const cell of cells) {
    const roll = cell.rand();
    // Open spawn clearing, dense woodland belt, then thinning toward the
    // foggy rim so the far edge dissolves instead of stopping.
    const density =
      cell.r < 20
        ? 0.45
        : cell.r < 120
          ? 0.62
          : mix(0.62, 0.22, smoothstep(120, HALF_EXTENT, cell.r));
    if (roll > density) continue;
    const spot: TreeSpot = {
      x: cell.x,
      z: cell.z,
      rotationY: cell.rand() * Math.PI * 2,
      scale: 0.8 + cell.rand() * 0.55,
      amber: cell.rand() < 0.18,
    };
    if (roll < density * 0.58) {
      pines.push(spot);
    } else {
      broadleaf.push(spot);
    }
  }
  return { pines, broadleaf };
}

// A single trunk expressed as a horizontal circle: centre (x, z) + radius r.
export type TreeCollider = { x: number; z: number; r: number };

// Trunk collision radius = base + scale * (effective render scale). The two
// constants are named + exported so trunk "thickness" stays trivial to tune
// without hunting through arithmetic. `effectiveScale` mirrors the matrix the
// renderer actually applies (broadleaf amber variants are enlarged by 1.08).
export const COLLIDER_RADIUS_BASE = 0.18;
export const COLLIDER_RADIUS_SCALE = 0.22;

export function colliderRadius(effectiveScale: number): number {
  return COLLIDER_RADIUS_BASE + COLLIDER_RADIUS_SCALE * effectiveScale;
}

// One collider per spot, matching the rendered trunk footprint exactly.
export function collectTreeColliders(): TreeCollider[] {
  const { pines, broadleaf } = collectSpots();
  const colliders: TreeCollider[] = [];
  // Pines render at spot.scale directly.
  for (const spot of pines) {
    colliders.push({ x: spot.x, z: spot.z, r: colliderRadius(spot.scale) });
  }
  // Broadleaf trunk + crown share one matrix whose scale bumps amber variants.
  for (const spot of broadleaf) {
    const effectiveScale = spot.scale * (spot.amber ? 1.08 : 1);
    colliders.push({ x: spot.x, z: spot.z, r: colliderRadius(effectiveScale) });
  }
  return colliders;
}

// Uniform spatial-hash cell size. 8 world units comfortably exceeds the largest
// collision radius (~0.5), so the 3×3 cell neighbourhood around any point is
// guaranteed to contain every collider within CELL_SIZE units of it — far more
// than the sub-metre pushout the rig performs each frame.
export const CELL_SIZE = 8;

// Integer cell index for a world coordinate. Math.floor keeps negatives
// monotonic and distinct from positives (e.g. -0.1 -> -1, -8 -> -1, -8.1 -> -2),
// so the cell key never folds opposite sides of the origin together.
function cellCoord(v: number): number {
  return Math.floor(v / CELL_SIZE);
}

function cellKey(cx: number, cz: number): string {
  return cx + "," + cz;
}

export type TreeField = {
  colliders: TreeCollider[];
  near(x: number, z: number): TreeCollider[];
};

// Builds the collider set + spatial hash exactly once. `near()` returns every
// collider bucketed into the 3×3 cell block centred on (x, z).
export function createTreeField(): TreeField {
  const colliders = collectTreeColliders();
  const grid = new Map<string, TreeCollider[]>();
  for (const c of colliders) {
    const key = cellKey(cellCoord(c.x), cellCoord(c.z));
    const bucket = grid.get(key);
    if (bucket) bucket.push(c);
    else grid.set(key, [c]);
  }
  function near(x: number, z: number): TreeCollider[] {
    const cx = cellCoord(x);
    const cz = cellCoord(z);
    const out: TreeCollider[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const bucket = grid.get(cellKey(cx + dx, cz + dz));
        if (bucket) {
          for (const c of bucket) out.push(c);
        }
      }
    }
    return out;
  }
  return { colliders, near };
}
