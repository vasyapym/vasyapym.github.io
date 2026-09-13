// One pastel palette for the whole run, authored as sRGB hex strings so the
// pure modules stay free of three.js. The scene wraps these in THREE.Color.

export const PALETTE = {
  kittyWhite: "#efe5ce",
  outlineInk: "#1f2e2d",
  bowRed: "#d4ad67",
  bowDeep: "#b08a45",
  suitPink: "#806650",
  suitDeep: "#5c4838",
  noseYellow: "#1f2e2d",
  cheek: "#d8c9ac",
  eyeInk: "#d4ad67",

  skyTop: "#9fd9f6",
  skyMid: "#d8ecf8",
  skyBottom: "#ffeff5",
  sunCore: "#fffdf6",
  sunHalo: "#fffcf0",
  sunHaloSoft: "#fff4e0",
  cloud: "#c4d9eb",
  cloudLit: "#eaf6ff",
  hillFar: "#c9e6f5",
  hillNear: "#a8d8ef",
  castleFar: "#d3e9f7",
  castleMid: "#bcdff2",
  castleNear: "#a8d8ef",
  windowEmber: "#ffd9a0",
  ash: "#ffffff",
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
  starGlow: "#f0b429",
  heal: "#e8455f",
  healBurst: "#ff8fb3",

  ink: "#4a3b52",
  paper: "#fff8fb",
} as const;

export type PaletteKey = keyof typeof PALETTE;
