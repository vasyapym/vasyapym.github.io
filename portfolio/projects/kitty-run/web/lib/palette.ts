// One pastel palette for the whole run, authored as sRGB hex strings so the
// pure modules stay free of three.js. The scene wraps these in THREE.Color.

export const PALETTE = {
  // --- character (Momo): one warm coral/rose/berry accent family ---
  furCream: "#fdf7f2",
  outlineInk: "#3a2f3a",
  eyeInk: "#3a2f3a", // same ink as outline: not split
  scarfCoral: "#ff8fa3",
  scarfDeep: "#ef6d86",
  suitRose: "#f4a7bd",
  noseBerry: "#e56a86",
  cheek: "#ffc4d3",

  // --- scene keys: frozen, byte-identical ---
  skyTop: "#9fd9f6",
  skyBottom: "#ffeff5",
  cloud: "#ffffff",
  hillFar: "#c9e6f5",
  hillNear: "#a8d8ef",
  groundTop: "#ffd9e6",
  groundBody: "#f7b9cd",
  groundDot: "#fff3f8",
  pathEdge: "#f09dbb",

  obstaclePlum: "#8a6fa8",
  obstacleDeep: "#63507f",
  obstacleDot: "#cbb9de",

  heart: "#ff5f7e",
  heartGlow: "#ffb3c4",
  star: "#ffd44d",
  starGlow: "#fff3b0",
  heal: "#e8455f",

  ink: "#4a3b52",
  paper: "#fff8fb",
} as const;

export type PaletteKey = keyof typeof PALETTE;
