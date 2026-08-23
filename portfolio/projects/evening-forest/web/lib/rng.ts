// Deterministic pseudo-random generator (mulberry32) so the forest layout
// is identical on every visit and assertable from a plain node script.

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string): () => number {
  return mulberry32(xmur3(seed)());
}

export type ScatterCell = {
  x: number;
  z: number;
  r: number;
  rand: () => number;
};

// Jittered-grid scatter: deterministic candidates spread evenly enough to
// feel planted by nature, filtered by the consumer (clearings, density…).
export function scatterCells(options: {
  seed: string;
  halfExtent: number;
  minRadius: number;
  step: number;
  jitter: number;
}): ScatterCell[] {
  const { seed, halfExtent, minRadius, step, jitter } = options;
  const rand = createRng(seed);
  const cells: ScatterCell[] = [];
  for (let gz = -halfExtent; gz <= halfExtent; gz += step) {
    for (let gx = -halfExtent; gx <= halfExtent; gx += step) {
      const x = gx + (rand() * 2 - 1) * jitter;
      const z = gz + (rand() * 2 - 1) * jitter;
      const r = Math.hypot(x, z);
      if (r < minRadius || r > halfExtent) continue;
      cells.push({ x, z, r, rand });
    }
  }
  return cells;
}
