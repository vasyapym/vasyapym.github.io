// A tiny module-level bridge between the fox's frame loop and the DOM UI.
// The renderer publishes one plain snapshot per frame; React components
// poll it on their own slow cadence (a few Hz), so fox updates never
// trigger renders in the scene tree.
export type FoxPublicSnapshot = {
  state: "wander" | "alert" | "curious" | "flee";
  // Planar distance from the walker, metres.
  dist: number;
};

export const foxStore: { snapshot: FoxPublicSnapshot | null } = {
  snapshot: null,
};
