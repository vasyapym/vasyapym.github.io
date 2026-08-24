// Shared camera framing math. One function decides how much of the world
// fits on screen, and both the three.js rig and the DOM floaters read it,
// so score pop-ups always land on the pickups they came from.

const BASE_FOV = 38;
export const BASE_CAM_Z = 11.5;
const BASE_LOOK_Y = 2.6;

// A portrait phone must still see this many world units across the play
// plane, or obstacles arrive before there is time to react to them.
const MIN_VIEW_WIDTH = 9;

// Kitty sits this fraction of the stage width in from the left edge, so
// the run-ahead side of the screen stays the big side on any aspect.
const LEAD_FRACTION = 0.2;
const LEAD_MAX = 2.4;
const LEAD_MIN = 1.2;

// Tall frames see more world vertically; aiming a little higher keeps the
// extra space in the sky instead of an empty pink floor.
const LOOK_Y_TALL_RATE = 0.05;
const LOOK_Y_MAX = 3.2;

export type Frame = {
  fov: number;
  camZ: number;
  lookX: number;
  lookY: number;
  viewHeight: number;
};

function leadFor(width: number): number {
  return Math.min(LEAD_MAX, Math.max(LEAD_MIN, width * LEAD_FRACTION));
}

function lookYFor(viewHeight: number): number {
  const base = 2 * BASE_CAM_Z * Math.tan((BASE_FOV * Math.PI) / 360);
  return Math.min(
    LOOK_Y_MAX,
    BASE_LOOK_Y + Math.max(0, viewHeight - base) * LOOK_Y_TALL_RATE,
  );
}

export function frameFor(aspect: number): Frame {
  const baseHeight = 2 * BASE_CAM_Z * Math.tan((BASE_FOV * Math.PI) / 360);
  const naturalWidth = baseHeight * aspect;

  if (naturalWidth >= MIN_VIEW_WIDTH) {
    return {
      fov: BASE_FOV,
      camZ: BASE_CAM_Z,
      lookX: leadFor(naturalWidth),
      lookY: BASE_LOOK_Y,
      viewHeight: baseHeight,
    };
  }

  // Zoom out until the guaranteed width fits, splitting the change between
  // camera distance (half, square-rooted) and field of view (the rest) so
  // neither the perspective nor the parallax goes extreme.
  const targetHeight = MIN_VIEW_WIDTH / aspect;
  const camZ = BASE_CAM_Z * Math.sqrt(targetHeight / baseHeight);
  const fov = 2 * Math.atan(targetHeight / (2 * camZ)) * (180 / Math.PI);
  return {
    fov,
    camZ,
    lookX: leadFor(MIN_VIEW_WIDTH),
    lookY: lookYFor(targetHeight),
    viewHeight: targetHeight,
  };
}
