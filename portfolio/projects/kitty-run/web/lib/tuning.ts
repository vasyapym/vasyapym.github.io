// Every gameplay number in one place. The scene reads these; the node
// checks pin the relationships that keep the run fair (jump arcs clear the
// obstacles, hover gates leave headroom, speed stays inside its band).

export const TUNING = {
  speedStart: 7,
  speedMax: 14,
  // Reaches the top pace noticeably sooner: the gentle opening is a
  // courtesy, not the whole game.
  speedRamp: 420,

  gravity: 38,
  // Sized so the tall crate is clearable even taking off on the steepest
  // uphill stretch at top speed (see the checks + WORST_SLOPE).
  jumpV: 14.2,
  doubleJumpV: 11.5,
  jumpCutFactor: 0.45,
  coyoteTime: 0.09,
  maxJumps: 2,

  dashDuration: 0.22,
  dashCooldown: 1.4,
  dashBoost: 6,

  // Bullet time: every dash dips the whole simulation's clock to this
  // fraction of real time, then eases back at bulletRecovery per sim
  // second. Deep enough to read instantly, shallow enough to never feel
  // like a pause; both the player and the echo sim dilate identically,
  // so the race stays in lockstep.
  bulletTimeScale: 0.35,
  bulletRecovery: 5.5,

  // A dash requested this soon after leaving the ground cancels the fresh
  // jump outright — kitty snaps back down and ducks instead. This is what
  // makes touch ducking reliable: the tap-to-jump fires on finger-down
  // before the gesture is known, so a swipe-down must be able to take the
  // accidental jump back. Long enough to cover human swipe latency
  // (~50-90 ms), short enough to never eat a deliberate jump.
  jumpCancelWindow: 0.12,

  invulnTime: 1.3,
  hitStopTime: 0.06,
  knockbackV: 6,

  maxHearts: 3,
  kittyRadius: 0.75,
  kittyCenterLift: 0.95,

  // Every this many metres the run throws a little celebration.
  milestoneStep: 500,

  // The best-run echo waits until the player opens this much of a lead,
  // then gives chase. A distance, not a delay: once launched, both sims
  // run the same track at the same speed, so the gap freezes here instead
  // of stretching with speed until it left phone screens entirely. Four
  // and a half metres keeps the race readable — she runs in view, never
  // crowding the player's sprite.
  echoGapMetres: 4.5,
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
