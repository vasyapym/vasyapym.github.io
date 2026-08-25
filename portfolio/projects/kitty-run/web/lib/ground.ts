// The one ground truth for ground height: a gentle sum of sines. The mesh,
// the walking physics and the obstacle placement all sample this function,
// so feet, wheels and crates always agree.
//
// The amplitudes are tuned against the jump arc: WORST_SLOPE times half a
// max-speed jump length must stay well inside the tall-obstacle clearance,
// otherwise an uphill takeoff makes the crate literally unjumpable. The
// node checks pin that inequality.

export const GROUND_BASE = 1.6;

const ROLL_A = 0.42;
const ROLL_F = 0.085;
const SWELL_A = 0.62;
const SWELL_F = 0.026;

function roll(x: number): number {
  return Math.sin(x * ROLL_F) * ROLL_A + Math.sin(x * SWELL_F + 1.7) * SWELL_A;
}

export function groundY(x: number): number {
  return GROUND_BASE + roll(x);
}

// Steepest possible climb of the terrain, in height units per distance
// unit. Pure geometry of the two waves above.
export const WORST_SLOPE = ROLL_A * ROLL_F + SWELL_A * SWELL_F;

export const GROUND_MIN = GROUND_BASE - (ROLL_A + SWELL_A);
export const GROUND_MAX = GROUND_BASE + (ROLL_A + SWELL_A);
