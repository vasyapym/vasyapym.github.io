// Pure math for the touch scheme: a dynamic-origin joystick for walking and
// drag-to-look for the camera. No DOM, no three — leaf module, so the
// assertion script can import it directly.

// Max knob travel in CSS pixels; also the visual radius of the stick base.
export const JOYSTICK_RADIUS = 56;
// Fraction of the radius treated as "thumb resting" so a light touch
// doesn't creep the camera forward.
export const JOYSTICK_DEADZONE = 0.18;
// Radians of turn per CSS pixel of drag — tuned so a full-width swipe
// turns roughly a half circle.
export const LOOK_SENSITIVITY = 0.0042;
// How far the player may look up or down (~77 degrees), in radians.
export const PITCH_LIMIT = 1.35;

// x: strafe (+right), z: walk (+forward) — same convention as the keyboard.
export type JoystickVector = { x: number; z: number };

export type LookDelta = { yaw: number; pitch: number };

// Shared mutable store written by the touch overlay and drained once per
// frame by the walking rig, so all camera mutation stays in one place.
export type TouchInputState = {
  moveX: number;
  moveZ: number;
  yaw: number;
  pitch: number;
};

export function createTouchInputState(): TouchInputState {
  return { moveX: 0, moveZ: 0, yaw: 0, pitch: 0 };
}

export function resetTouchInputState(state: TouchInputState): void {
  state.moveX = 0;
  state.moveZ = 0;
  state.yaw = 0;
  state.pitch = 0;
}

// dx/dy are CSS pixels from where the thumb landed. Up on screen walks
// forward; output magnitude is normalised into [0, 1] after the deadzone,
// and clamped when the thumb leaves the base circle.
export function joystickVector(dx: number, dy: number): JoystickVector {
  const length = Math.hypot(dx, dy);
  const dead = JOYSTICK_DEADZONE * JOYSTICK_RADIUS;
  if (length <= dead) return { x: 0, z: 0 };
  const travel = Math.min(length, JOYSTICK_RADIUS);
  const t = (travel - dead) / (JOYSTICK_RADIUS - dead);
  return { x: (dx / length) * t, z: (-dy / length) * t };
}

// Knob offset for the visuals: the raw drag clamped to the base circle.
export function joystickKnobOffset(dx: number, dy: number): {
  x: number;
  y: number;
} {
  const length = Math.hypot(dx, dy);
  if (length <= JOYSTICK_RADIUS) return { x: dx, y: dy };
  return {
    x: (dx / length) * JOYSTICK_RADIUS,
    y: (dy / length) * JOYSTICK_RADIUS,
  };
}

// Dragging right/up should look right/up, hence the negation.
export function lookDelta(dxPx: number, dyPx: number): LookDelta {
  return {
    yaw: -dxPx * LOOK_SENSITIVITY,
    pitch: -dyPx * LOOK_SENSITIVITY,
  };
}

export function clampPitch(pitch: number): number {
  return Math.min(Math.max(pitch, -PITCH_LIMIT), PITCH_LIMIT);
}
