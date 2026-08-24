// The one ground truth for ground height: a gentle sum of sines. The mesh,
// the walking physics and the obstacle placement all sample this function,
// so feet, wheels and crates always agree.

export const GROUND_BASE = 1.6;

export function groundY(x: number): number {
  return (
    GROUND_BASE +
    Math.sin(x * 0.11) * 0.55 +
    Math.sin(x * 0.031 + 1.7) * 0.9
  );
}

export const GROUND_MIN = GROUND_BASE - 1.45;
export const GROUND_MAX = GROUND_BASE + 1.45;
