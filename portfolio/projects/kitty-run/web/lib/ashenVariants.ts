// ?ashen=a|b|c art-direction review scaffold: three independent Ashen
// directions, selectable per page load behind a URL param (the owner reviews
// them live in-game and picks one; the winner then ships as its own pass and
// this scaffold comes out). A candidate is a palette override + scene knob
// deltas ONLY — no shape code this round, per the owner's ruling.
//
// The param is read once at module scope (same discipline as the renderer
// config in RunCanvas). When present, souls mode is implied and the
// candidate's full palette REPLACES the souls baseline before THEMES is
// built — so every palette-keyed record in the scene (bursts, pickups,
// shadows, echo retints, materials) picks the variant up automatically.
// The pastel kitty theme is never touched.

import type { CharacterId, ThemePalette } from "./theme.ts";
import {
  BACKDROPS,
  castleTexture,
  duskCloudTexture,
  hazeTexture,
  type BackdropSpec,
} from "./textures.ts";

export type AshenVariantId = "a" | "b" | "c";

// Accept a/b/c and 1/2/3 alike, so the review URLs stay forgiving.
export const ASHEN_VARIANT: AshenVariantId | null = (() => {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search)
    .get("ashen")
    ?.trim()
    .toLowerCase();
  if (raw === "a" || raw === "b" || raw === "c") return raw;
  if (raw === "1") return "a";
  if (raw === "2") return "b";
  if (raw === "3") return "c";
  return null;
})();

// Candidate A — "Anor Londo Pale": pale cold cathedral daylight, gold
// rationed to two points (the ember window cluster + the peach cloud rims).
const ASHEN_A: ThemePalette = {
  kittyWhite: "#efeadd", // bone, lifted
  outlineInk: "#14120f",
  bowRed: "#7f858c", // steel mid, cool
  bowDeep: "#474d55", // steel occlusion
  suitPink: "#7c6a5d", // tunic/leather, cooled
  suitDeep: "#4a3f37",
  noseYellow: "#efb45a", // ember eyes, pale gold
  cheek: "#b8a999",
  eyeInk: "#1b1613",

  skyTop: "#46566e",
  skyMid: "#8698ad",
  skyBottom: "#c8b9b0", // pale muted horizon
  sunCore: "#f4f8fc", // crosses bloom
  sunHalo: "#d3dde8",
  sunHaloSoft: "#9aa8ba",
  cloud: "#566476",
  cloudLit: "#e8b98a", // rose-peach rim (top-of-frame warmth)
  hillFar: "#77869a",
  hillNear: "#555f6d",
  castleFar: "#b6bcc4", // bone-mist, high value
  castleMid: "#6b7889",
  castleNear: "#333b49",
  windowEmber: "#ffd98c", // rides the knee
  ash: "#d0cabf",

  groundTop: "#6f6c66",
  groundBody: "#3d3b38",
  groundDot: "#7f6f60", // lit stone
  pathEdge: "#4f4b46",

  obstaclePlum: "#3c332e",
  obstacleDeep: "#171210",
  obstacleDot: "#d8ba92",

  heart: "#ecf3ff", // crosses bloom
  heartGlow: "#bcd6f4",
  star: "#f2b641",
  starGlow: "#d0731d",
  heal: "#ef6f26",
  healBurst: "#ffc48c",

  ink: "#14100d",
  paper: "#e9e2d4",
};

// Candidate B — "Majula Mournful Sun": low amber horizon over a deep cold
// mass; the widest warm/cold gap of the three, the knight backlit.
const ASHEN_B: ThemePalette = {
  kittyWhite: "#e6ddca", // bone, faintly warm
  outlineInk: "#16110d",
  bowRed: "#6f6a63", // steel, warm-grey
  bowDeep: "#3c3833",
  suitPink: "#90492f", // leather, warmer
  suitDeep: "#4d2418",
  noseYellow: "#ff8a2e", // ember eyes, hot
  cheek: "#c08a6f",
  eyeInk: "#1d1512",

  skyTop: "#33405a", // deep cold overhead
  skyMid: "#7d7f92",
  skyBottom: "#c98a5f", // burning horizon
  sunCore: "#fbeecb", // warm white, crosses bloom
  sunHalo: "#f0c78d",
  sunHaloSoft: "#b98a63",
  cloud: "#4a5266",
  cloudLit: "#f0a05a", // strong ember rim
  hillFar: "#6e7688",
  hillNear: "#474f5f",
  castleFar: "#9fa4ab", // bone-mist kept cool for depth
  castleMid: "#575e6b",
  castleNear: "#262a33",
  windowEmber: "#ffcf7a", // rides the knee
  ash: "#c7bcac",

  groundTop: "#6a635a",
  groundBody: "#37332e",
  groundDot: "#856a54", // warm lit stone
  pathEdge: "#48423b",

  obstaclePlum: "#3a2f28",
  obstacleDeep: "#150f0c",
  obstacleDot: "#e0b784",

  heart: "#e9f0ff", // cold heart, crosses bloom
  heartGlow: "#b6d0f0",
  star: "#f4a92f",
  starGlow: "#cf6417",
  heal: "#ee6a1f",
  healBurst: "#ffbb7c",

  ink: "#150f0b",
  paper: "#e7dece",
};

// Candidate C — "Ash Lake Hollow": near-monochrome slate, no sky warmth,
// one ember window cluster as the whole payload; the knight rides the mist.
const ASHEN_C: ThemePalette = {
  kittyWhite: "#ddd6c8", // bone, dimmed (vast dark)
  outlineInk: "#100d0b",
  bowRed: "#5f6166", // steel, near-neutral cool
  bowDeep: "#34363a",
  suitPink: "#5c554d", // leather drained to grey-brown
  suitDeep: "#37312b",
  noseYellow: "#e8913c", // ember eyes — the one warm accent on the rig
  cheek: "#9a938a",
  eyeInk: "#151210",

  skyTop: "#2c333f", // deep cold overhead
  skyMid: "#5a616e",
  skyBottom: "#828791", // pale cold horizon, barely lit
  sunCore: "#e8ecef", // cold white, crosses bloom
  sunHalo: "#aab2bd",
  sunHaloSoft: "#767e8a",
  cloud: "#40454f",
  cloudLit: "#8a8f98", // cold rim — no warmth in the sky at all
  hillFar: "#646b76",
  hillNear: "#454b55",
  castleFar: "#9ba0a7", // bone-mist, cool
  castleMid: "#565c66",
  castleNear: "#242830",
  windowEmber: "#ffb861", // the SINGLE warm point — the whole payload
  ash: "#c4bfb6",

  groundTop: "#5c5b58",
  groundBody: "#323230",
  groundDot: "#6a6763", // cold-lit stone (no warm dot here)
  pathEdge: "#434240",

  obstaclePlum: "#33302c",
  obstacleDeep: "#141210",
  obstacleDot: "#b9b3a8", // cold stone lid, not warm

  heart: "#eef3ff", // crosses bloom — cold, but so is everything
  heartGlow: "#c2d6f2",
  star: "#e9b64a", // pickups keep their identity (readability floor)
  starGlow: "#c66a1c",
  heal: "#ec6a20",
  healBurst: "#ffbb7e",

  ink: "#120f0c",
  paper: "#ded8ca",
};

export const ASHEN_VARIANT_PALETTES: Record<AshenVariantId, ThemePalette> = {
  a: ASHEN_A,
  b: ASHEN_B,
  c: ASHEN_C,
};

// The baseline ash-mote envelope (AshFall's own record, lifted here so the
// candidates only have to name their deltas and the default stays in one place).
export type AshTiers = Record<
  "far" | "near",
  {
    count: number;
    opacity: number;
    size: [number, number];
    fall: [number, number];
    sway: [number, number];
    freq: [number, number];
    z: [number, number];
    scroll: number;
  }
>;

export const DEFAULT_ASH_TIERS: AshTiers = {
  far: {
    count: 42,
    opacity: 0.26,
    size: [0.06, 0.11],
    fall: [0.3, 0.7],
    sway: [0.2, 0.55],
    freq: [0.25, 0.75],
    z: [-3.4, -2.6],
    scroll: 0.24,
  },
  near: {
    count: 18,
    opacity: 0.5,
    size: [0.13, 0.24],
    fall: [0.42, 0.82],
    sway: [0.25, 0.6],
    freq: [0.25, 0.75],
    z: [-1.6, -0.8],
    scroll: 0.36,
  },
};

const ASHEN_BACKDROPS: Record<AshenVariantId, BackdropSpec> = {
  // A — pale cathedral daylight: lighter mist, lighter air, near layer matte
  // so its ember windows hold the only saturated warmth.
  a: {
    layers: [
      {
        build: (p) =>
          castleTexture(p.castleFar, "kitty-run/castle/far", {
            density: 0.95,
            baseline: 0.2,
            rim: p.cloudLit,
          }),
        z: -11,
        y: 4.5,
        height: 12,
        speed: 0.12,
        opacity: 0.9,
      },
      {
        build: (p) =>
          castleTexture(p.castleMid, "kitty-run/castle/mid", {
            density: 0.68,
            baseline: 0.26,
            rim: p.cloudLit,
          }),
        z: -9,
        y: 2.5,
        height: 9,
        speed: 0.22,
      },
      {
        build: (p) =>
          castleTexture(p.castleNear, "kitty-run/castle/near", {
            windows: p.windowEmber,
            density: 0.32,
            baseline: 0.34,
          }),
        z: -7,
        y: 1.5,
        height: 7,
        speed: 0.42,
      },
    ],
    haze: [
      {
        build: (p) => hazeTexture(p.skyMid, 0.66),
        z: -10,
        y: 0.6,
        height: 5,
        opacity: 0.34,
      },
      {
        build: (p) => hazeTexture(p.skyMid, 0.72),
        z: -8,
        y: 0.9,
        height: 4.4,
        opacity: 0.28,
      },
    ],
    cloud: { build: duskCloudTexture, scale: 1.5, opacity: 0.8 },
  },
  // B — burning horizon: the lower mist bank glows with the low sun
  // (skyBottom-tinted) and cools with height; ash motes catch the light.
  b: {
    layers: [
      {
        build: (p) =>
          castleTexture(p.castleFar, "kitty-run/castle/far", {
            density: 0.95,
            baseline: 0.24,
            rim: p.cloudLit,
          }),
        z: -11,
        y: 4.5,
        height: 12,
        speed: 0.12,
        opacity: 0.9,
      },
      {
        build: (p) =>
          castleTexture(p.castleMid, "kitty-run/castle/mid", {
            density: 0.7,
            baseline: 0.28,
            rim: p.cloudLit,
          }),
        z: -9,
        y: 2.5,
        height: 9,
        speed: 0.22,
      },
      {
        build: (p) =>
          castleTexture(p.castleNear, "kitty-run/castle/near", {
            windows: p.windowEmber,
            density: 0.35,
            baseline: 0.32,
          }),
        z: -7,
        y: 1.5,
        height: 7,
        speed: 0.42,
      },
    ],
    haze: [
      {
        // Warm at the base: mist glows near the burning horizon.
        build: (p) => hazeTexture(p.skyBottom, 0.5),
        z: -10,
        y: 0.6,
        height: 5,
        opacity: 0.44,
      },
      {
        build: (p) => hazeTexture(p.skyMid, 0.68),
        z: -8,
        y: 0.9,
        height: 4.4,
        opacity: 0.34,
      },
    ],
    cloud: { build: duskCloudTexture, scale: 1.6, opacity: 0.9 },
  },
  // C — cold veils: three thin banks flatten depth into layers of grey; no
  // rim light anywhere (the far city is a value, not an edge).
  c: {
    layers: [
      {
        build: (p) =>
          castleTexture(p.castleFar, "kitty-run/castle/far", {
            density: 0.9,
            baseline: 0.18,
          }),
        z: -11,
        y: 4.5,
        height: 12,
        speed: 0.12,
        opacity: 0.9,
      },
      {
        build: (p) =>
          castleTexture(p.castleMid, "kitty-run/castle/mid", {
            density: 0.66,
            baseline: 0.24,
          }),
        z: -9,
        y: 2.5,
        height: 9,
        speed: 0.22,
      },
      {
        build: (p) =>
          castleTexture(p.castleNear, "kitty-run/castle/near", {
            windows: p.windowEmber,
            density: 0.3,
            baseline: 0.3,
          }),
        z: -7,
        y: 1.5,
        height: 7,
        speed: 0.42,
      },
    ],
    haze: [
      {
        build: (p) => hazeTexture(p.skyMid, 0.7),
        z: -10,
        y: 0.6,
        height: 5,
        opacity: 0.4,
      },
      {
        build: (p) => hazeTexture(p.skyMid, 0.7),
        z: -8,
        y: 0.9,
        height: 4.4,
        opacity: 0.34,
      },
      {
        build: (p) => hazeTexture(p.skyMid, 0.7),
        z: -6.5,
        y: 1.4,
        height: 4,
        opacity: 0.28,
      },
    ],
    cloud: { build: duskCloudTexture, scale: 1.7, opacity: 0.7 },
  },
};

// The vignette darkness per candidate (the recorded 0.26/0.26 discrepancy is
// resolved per candidate; the kitty value stays 0.26 — see Effects.tsx).
const ASHEN_VIGNETTE: Record<AshenVariantId, number> = {
  a: 0.24,
  b: 0.3,
  c: 0.34,
};

export function backdropFor(character: CharacterId): BackdropSpec {
  return character === "souls" && ASHEN_VARIANT
    ? ASHEN_BACKDROPS[ASHEN_VARIANT]
    : BACKDROPS[character];
}

export function ashTiersFor(): AshTiers {
  const base = DEFAULT_ASH_TIERS;
  if (!ASHEN_VARIANT) return base;
  if (ASHEN_VARIANT === "a") {
    return {
      far: { ...base.far, count: 34, opacity: 0.2 },
      near: { ...base.near, count: 14, opacity: 0.4 },
    };
  }
  if (ASHEN_VARIANT === "b") {
    return {
      far: { ...base.far, count: 42, opacity: 0.26 },
      near: { ...base.near, count: 20, opacity: 0.52 },
    };
  }
  return {
    far: { ...base.far, count: 48, opacity: 0.3 },
    near: { ...base.near, count: 24, opacity: 0.56 },
  };
}

export function soulsVignette(): number {
  return ASHEN_VARIANT ? ASHEN_VIGNETTE[ASHEN_VARIANT] : 0.26;
}
