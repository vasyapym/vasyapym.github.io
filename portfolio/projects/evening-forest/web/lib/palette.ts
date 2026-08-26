import * as THREE from "three";

// One dusk palette shared by every surface, shader and light. THREE.Color
// converts hex to linear working space automatically, so authored values can
// stay in familiar sRGB terms.
// Values are lifted ~20-30% above pure dusk realism: at 0.36 dpr with
// 6-level quantisation, physically-plausible darks collapse into mud, so
// every surface is authored one stop brighter than it "should" be.
export const PALETTE = {
  zenith: "#2a1c4e",
  upper: "#45307a",
  band: "#96567e",
  horizon: "#e0824a",
  fog: "#825364",

  hemiSky: "#7d5fb5",
  hemiGround: "#33261d",
  directional: "#ffa257",

  terrainLow: "#3d5c33",
  terrainMid: "#4f7f46",
  terrainDry: "#857a42",
  dirt: "#63503a",

  trunk: "#5f4630",
  pine: "#2c5538",
  leaf: "#527f45",
  leafAmber: "#c97e3a",

  grassLow: "#3d6631",
  grassTip: "#a8933a",

  firefly: "#ffdf8e",
  shaft: "#ffc27d",

  fox: "#c25e2a",
  foxCream: "#e8d5b0",
  foxDark: "#5f2f14",
} as const;

export type PaletteKey = keyof typeof PALETTE;

export const COLORS = Object.fromEntries(
  Object.entries(PALETTE).map(([key, hex]) => [key, new THREE.Color(hex)]),
) as Record<PaletteKey, THREE.Color>;

// Low sun toward -Z: the spawn point faces straight into the sunset.
export const SUN_DIRECTION = new THREE.Vector3(-0.42, 0.18, -0.86).normalize();
// Tuned so the treeline reads to roughly 140m before the murk wins; the
// world's far edge dissolves instead of stopping.
export const FOG_DENSITY = 0.0125;
