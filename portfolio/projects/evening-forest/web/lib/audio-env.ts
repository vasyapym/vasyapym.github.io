// The scene→audio bridge: a plain mutable object the render loop writes
// once per frame and the audio voices read lazily. Deliberately free of
// three.js and React so the pure leaf modules (music, nature) can import
// it and stay headless-testable.

export type FoxAudioState = "wander" | "alert" | "curious" | "flee";

export const audioEnv = {
  // Time of day, 0..1 — golden hour → night (0.55) → sunrise. Mirrors
  // lib/clock.ts's timeOfDay uniform; the rig copies it here each frame.
  timeOfDay: 0,
  // Walker speed in m/s, smoothed by the rig (0..~3.4).
  moveSpeed: 0,
  // Planar distance to the fox in metres, or null when no fox is live.
  foxDist: null as number | null,
  foxState: null as FoxAudioState | null,
};
