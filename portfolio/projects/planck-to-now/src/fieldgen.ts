export type Dir = [number, number, number];

export function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function randomUnit(out: Dir): void {
  out[0] = gauss();
  out[1] = gauss();
  out[2] = gauss();
  const len = Math.hypot(out[0], out[1], out[2]) || 1;
  out[0] /= len;
  out[1] /= len;
  out[2] /= len;
}

interface Center { x: number; y: number; z: number; }

const CENTERS = 44;
const CLUSTER_R = 38;

function makeCenters(): Center[] {
  const centers: Center[] = [];
  const dir: Dir = [0, 0, 0];
  for (let i = 0; i < CENTERS; i++) {
    randomUnit(dir);
    const r = CLUSTER_R * Math.cbrt(Math.random());
    centers.push({ x: dir[0] * r, y: dir[1] * r, z: dir[2] * r });
  }
  return centers;
}

function makeEdges(centers: Center[]): Array<[number, number]> {
  const seen = new Set<string>();
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < CENTERS; i++) {
    const near = centers
      .map((c, j) => ({
        j,
        d: Math.hypot(c.x - centers[i].x, c.y - centers[i].y, c.z - centers[i].z),
      }))
      .filter((e) => e.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const { j } of near) {
      const key = `${Math.min(i, j)}:${Math.max(i, j)}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([Math.min(i, j), Math.max(i, j)]);
      }
    }
  }
  return edges;
}

export interface CosmicField {
  positions: Float32Array;
  struct: Float32Array;
  seeds: Float32Array;
}

export const SPHERE_R = 40;

export function buildCosmicField(count: number): CosmicField {
  const centers = makeCenters();
  const edges = makeEdges(centers);
  const positions = new Float32Array(count * 3);
  const struct = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const dir: Dir = [0, 0, 0];

  for (let p = 0; p < count; p++) {
    randomUnit(dir);
    const r = SPHERE_R * Math.cbrt(Math.random());
    positions[p * 3] = dir[0] * r;
    positions[p * 3 + 1] = dir[1] * r;
    positions[p * 3 + 2] = dir[2] * r;

    if (Math.random() < 0.42) {
      const c = centers[(Math.random() * CENTERS) | 0];
      randomUnit(dir);
      const sr = Math.abs(gauss()) * 3.3 + 0.12;
      struct[p * 3] = c.x + dir[0] * sr;
      struct[p * 3 + 1] = c.y + dir[1] * sr;
      struct[p * 3 + 2] = c.z + dir[2] * sr;
    } else {
      const [ai, bi] = edges[(Math.random() * edges.length) | 0];
      const A = centers[ai];
      const B = centers[bi];
      const s = Math.random();
      const sigma = 1.5;
      struct[p * 3] = A.x + (B.x - A.x) * s + gauss() * sigma;
      struct[p * 3 + 1] = A.y + (B.y - A.y) * s + gauss() * sigma;
      struct[p * 3 + 2] = A.z + (B.z - A.z) * s + gauss() * sigma;
    }

    seeds[p * 4] = Math.random();
    seeds[p * 4 + 1] = Math.random();
    seeds[p * 4 + 2] = Math.random();
    seeds[p * 4 + 3] = Math.random();

    const coreR = Math.hypot(struct[p * 3], struct[p * 3 + 1], struct[p * 3 + 2]);
    if (coreR < 2.0 && Math.random() < 0.22) {
      seeds[p * 4 + 1] = 1.0;
    }
  }

  return { positions, struct, seeds };
}
