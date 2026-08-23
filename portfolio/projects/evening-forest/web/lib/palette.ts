import * as THREE from "three";

// One dusk palette shared by every surface, shader and light. THREE.Color
// converts hex to linear working space automatically, so authored values can
// stay in familiar sRGB terms.
export const PALETTE = {
  zenith: "#181028",
  upper: "#33205c",
  band: "#7c4470",
  horizon: "#e0824a",
  fog: "#6d4457",

  hemiSky: "#6b4fa0",
  hemiGround: "#241a14",
  directional: "#ffa257",

  terrainLow: "#24371f",
  terrainMid: "#31502e",
  terrainDry: "#5a5330",
  dirt: "#3e3022",

  trunk: "#46331f",
  pine: "#1d3a27",
  leaf: "#3a5c33",
  leafAmber: "#9c5a26",

  grassLow: "#26401f",
  grassTip: "#7a6a2e",

  firefly: "#ffdf8e",
  shaft: "#ffc27d",
} as const;

export type PaletteKey = keyof typeof PALETTE;

export const COLORS = Object.fromEntries(
  Object.entries(PALETTE).map(([key, hex]) => [key, new THREE.Color(hex)]),
) as Record<PaletteKey, THREE.Color>;

// Low sun toward -Z: the spawn point faces straight into the sunset.
export const SUN_DIRECTION = new THREE.Vector3(-0.42, 0.18, -0.86).normalize();
export const FOG_DENSITY = 0.03;
