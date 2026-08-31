// One candy-goth palette for the whole run, authored as sRGB hex strings so
// the pure modules stay free of three.js. The scene wraps these in THREE.Color.
// (Key names unchanged from the Momo build; only values change. Character keys
// are repurposed in-place — no renames — so Echo's hex map is a value swap.)

export const PALETTE = {
  // --- character (Nix): pale lavender + ONE spectral-mint accent + ink ---
  furCream: "#ece6f7",   // pale-lavender fur
  outlineInk: "#241a2e", // deep-plum ink outline (+ mouth cavity)
  eyeInk: "#241a2e",     // same ink as outline: not split
  scarfCoral: "#3a2b54", // wisp-hood main (hood + forked tails)
  scarfDeep: "#5fe6c0",  // MINT accent: inner ears, chest-star clasp, wisp tail
  suitRose: "#6e4f95",   // grape romper
  noseBerry: "#d98cae",  // warm berry-pink heart-nose  (was #4a3560)
  cheek: "#f2b8d0",      // soft pink blush              (was #bdeeda)

  // --- sky: dusk aubergine warming to a plum horizon glow ---
  skyTop: "#160e2b",
  skyBottom: "#43285a",
  cloud: "#4a3568",      // dusky-violet night cloud

  // --- hills: flat plum silhouettes receding into the sky ---
  hillFar: "#2a1b42",
  hillNear: "#382250",

  // --- ground: ink-plum runway with a luminous mint edge ---
  groundTop: "#2e1d44",
  groundBody: "#211531",
  groundDot: "#57c2a0",  // dim mint deco sparkle
  pathEdge: "#5fffcf",   // bright mint runway glow

  // --- obstacles: spooky candy — grape over ink with eerie glow dots ---
  obstaclePlum: "#5a3a7a",
  obstacleDeep: "#2e1c44",
  obstacleDot: "#c6a3ee",

  // --- pickups: luminous & saturated, read as friendly over the grape hazards ---
  heart: "#ff5f8f",
  heartGlow: "#ffb3d0",
  star: "#ffd84d",
  starGlow: "#fff2ac",
  heal: "#ff6a9c",

  // --- DOM ink/paper: light-on-dark (mint-white text on deep-plum panel, AA) ---
  ink: "#eafff5",
  paper: "#1e1330",
} as const;

export type PaletteKey = keyof typeof PALETTE;
