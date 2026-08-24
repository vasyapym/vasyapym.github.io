// Every gameplay number in one place. The scene reads these; the node
// checks pin the relationships that keep the run fair (jump arcs clear the
// obstacles, hover gates leave headroom, speed stays inside its band).

export const TUNING = {
  speedStart: 7,
  speedMax: 14,
  speedRamp: 520,

  gravity: 38,
  jumpV: 13.5,
  doubleJumpV: 11.5,
  jumpCutFactor: 0.45,
  coyoteTime: 0.09,
  maxJumps: 2,

  dashDuration: 0.22,
  dashCooldown: 1.4,
  dashBoost: 6,

  invulnTime: 1.3,
  hitStopTime: 0.06,
  knockbackV: 6,

  maxHearts: 3,
  kittyRadius: 0.75,
  kittyCenterLift: 0.95,
} as const;

export type Tuning = typeof TUNING;

export function speedFor(distance: number): number {
  const t = Math.exp(-Math.max(0, distance) / TUNING.speedRamp);
  return TUNING.speedMax - (TUNING.speedMax - TUNING.speedStart) * t;
}

export function jumpPeak(v: number): number {
  return (v * v) / (2 * TUNING.gravity);
}

// Horizontal ground covered by one full single jump at the given speed.
// Pattern spacing scales with this so gaps feel the same at 7 u/s and 14.
export function jumpLength(speed: number): number {
  return speed * ((2 * TUNING.jumpV) / TUNING.gravity);
}
