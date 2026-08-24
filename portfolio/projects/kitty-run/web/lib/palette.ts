// One pastel palette for the whole run, authored as sRGB hex strings so the
// pure modules stay free of three.js. The scene wraps these in THREE.Color.

export const PALETTE = {
  kittyWhite: "#ffffff",
  outlineInk: "#3a3142",
  bowRed: "#e94f64",
  bowDeep: "#d13a50",
  suitPink: "#f6a9c0",
  suitDeep: "#e88bab",
  noseYellow: "#ffd44d",
  cheek: "#ffc9d8",
  eyeInk: "#3a3142",

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
  heal: "#ff8fb3",

  ink: "#4a3b52",
  paper: "#fff8fb",
} as const;

export type PaletteKey = keyof typeof PALETTE;
