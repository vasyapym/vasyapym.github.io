// The run-shaping brain. Pure by contract: no three/React/DOM, colours
// as sRGB hex strings — it runs under node for the sim/check suites and feeds
// both the deterministic track (directorDifficulty) and the cosmetic districts
// (biomeAt / biomePalette). Everything here is a pure function of numbers, so
// player and echo, reading the same (seed, skill, distance), always agree.

// Starting skill for a fresh player (no stored replay yet). ~0.35 keeps the
// opening gentler than the old flat distance/650 ramp; the ratchet earns the
// rest over successive bests.
export const DEFAULT_SKILL = 0.35;

// The difficulty ramp is a distance span that SHRINKS with skill: a novice
// (skill 0) meets the hardest mix later than the old ramp; a veteran (skill 1)
// meets it sooner and thus harder for the same distance. Fairness invariants
// still live entirely in spawn.ts weights — this only moves the mix pointer.
const SPAN_EASY = 900; // skill 0: gentler than today's 650
const SPAN_HARD = 480; // skill 1: noticeably meaner

// District seams in metres. District I ~35 s (Rooftops), later ones longer.
// FINAL_SPAN is a nominal length for The Undernight so biomeMix can still
// reach 1 in the last district (cosmetic only).
const SEAMS = [0, 420, 900, 1450] as const;
const FINAL_SPAN = 700;

export const DISTRICT_NAMES = [
  "rooftops",
  "lantern market",
  "frostglass gardens",
  "the undernight",
] as const;

// Human-facing district names for the HUD chip. Index-aligned with
// BIOME_PALETTES / DISTRICT_NAMES — the HUD indexes this by world.biomeIndex.
export const DISTRICT_LABELS = [
  "Rooftops",
  "Lantern Market",
  "Frostglass Gardens",
  "The Undernight",
] as const;

export type BiomeColors = {
  skyTop: string;
  skyMid: string; // the baked #2a1746 gradient mid-stop
  skyBottom: string;
  cloud: string;
  hillFar: string;
  hillNear: string;
  groundTop: string;
  groundBody: string;
  groundDot: string;
  pathEdge: string;
  obstaclePlum: string;
  obstacleDeep: string;
  obstacleDot: string;
  moon: string;
};

// District I is authored from PALETTE (+ the two literals the scene bakes) so
// it is BYTE-IDENTICAL to the current look at distance 0. II–IV are designed:
// II warms (mulberry-rose / gold runway / ember dots), III cools (indigo-slate /
// ice-cyan glow / pale clouds / brighter moon), IV darkens (near-black aubergine /
// ink hills / spectral-mint glow at its brightest / sparse cloud). The `moon`
// field is a MULTIPLY tint over moonTexture (authored near-white), so district I
// (#ffffff) is identity and byte-identical to the current baked moon.
export const BIOME_PALETTES: readonly BiomeColors[] = [
  // I — Rooftops (EXACT PALETTE + the two baked literals: skyMid #2a1746,
  // moon identity #ffffff). Byte-identical at distance 0 by construction.
  {
    skyTop: "#160e2b",
    skyMid: "#2a1746",
    skyBottom: "#43285a",
    cloud: "#4a3568",
    hillFar: "#2a1b42",
    hillNear: "#382250",
    groundTop: "#2e1d44",
    groundBody: "#211531",
    groundDot: "#57c2a0",
    pathEdge: "#5fffcf",
    obstaclePlum: "#5a3a7a",
    obstacleDeep: "#2e1c44",
    obstacleDot: "#c6a3ee",
    moon: "#ffffff",
  },
  // II — Lantern Market (warm): mulberry-rose horizon, gold runway, ember dots.
  {
    skyTop: "#1e1030",
    skyMid: "#3a1c3e",
    skyBottom: "#6e3352",
    cloud: "#5e3a52",
    hillFar: "#3a1f3a",
    hillNear: "#4a2a44",
    groundTop: "#3e2438",
    groundBody: "#2a172a",
    groundDot: "#e0a850",
    pathEdge: "#ffcf7a",
    obstaclePlum: "#7a4a5a",
    obstacleDeep: "#3a1e2c",
    obstacleDot: "#ffb060",
    moon: "#ffe6c8",
  },
  // III — Frostglass Gardens (cool): indigo-slate, ice-cyan glow, pale cloud,
  // brightest moon.
  {
    skyTop: "#0e1430",
    skyMid: "#1c2a52",
    skyBottom: "#2e4a72",
    cloud: "#8aa8c8",
    hillFar: "#1e2c48",
    hillNear: "#2a3a58",
    groundTop: "#243452",
    groundBody: "#182238",
    groundDot: "#7ad8e0",
    pathEdge: "#a8f0ff",
    obstaclePlum: "#4a5a82",
    obstacleDeep: "#1e2c44",
    obstacleDot: "#bfe8ff",
    moon: "#eafffb",
  },
  // IV — The Undernight (dark): near-black aubergine, ink hills, spectral-mint
  // glow at its brightest, sparse cloud.
  {
    skyTop: "#080410",
    skyMid: "#140a1e",
    skyBottom: "#241432",
    cloud: "#2a1e38",
    hillFar: "#0e0818",
    hillNear: "#160e24",
    groundTop: "#1a1028",
    groundBody: "#0e0818",
    groundDot: "#5fffcf",
    pathEdge: "#7fffe0",
    obstaclePlum: "#3a2a52",
    obstacleDeep: "#160e28",
    obstacleDot: "#8affd8",
    moon: "#a8ffe0",
  },
] as const;

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// sRGB-hex channel lerp, pure string→string. Kept here (not in three) so the
// pure suites can assert the district table without a renderer. The scene does
// NOT call this per frame — it precomputes THREE.Color arrays and lerps those
// (see the render path in Parallax/Ground/Obstacles); this is the source of
// truth + test anchor.
function lerpHex(a: string, b: string, t: number): string {
  const ai = parseInt(a.slice(1), 16);
  const bi = parseInt(b.slice(1), 16);
  const ar = (ai >> 16) & 255;
  const ag = (ai >> 8) & 255;
  const ab = ai & 255;
  const br = (bi >> 16) & 255;
  const bg = (bi >> 8) & 255;
  const bb = bi & 255;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

// The difficulty ramp: a distance span that shrinks with skill. Monotone
// non-decreasing in distance for any fixed skill, output in [0, 1]. Skill 0 →
// span 900 (gentler than the old flat 650); skill 1 → span 480 (meaner). The
// fairness invariants (recoverable gaps, pair spacing) still live in spawn.ts.
export function directorDifficulty(skill: number, distance: number): number {
  const s = clamp01(skill);
  const span = lerp(SPAN_EASY, SPAN_HARD, s);
  return clamp01(Math.max(0, distance) / span);
}

// Which district we're in and how far through it (0 at the seam, →1 at the next
// seam). Pure and monotone: index never decreases with distance, mix rises 0→1
// within each band. Cosmetic only — read from world.distance so echo agrees.
export function biomeAt(distance: number): { index: number; mix: number } {
  const d = Math.max(0, distance);
  if (d < SEAMS[1]) return { index: 0, mix: clamp01((d - SEAMS[0]) / (SEAMS[1] - SEAMS[0])) };
  if (d < SEAMS[2]) return { index: 1, mix: clamp01((d - SEAMS[1]) / (SEAMS[2] - SEAMS[1])) };
  if (d < SEAMS[3]) return { index: 2, mix: clamp01((d - SEAMS[2]) / (SEAMS[3] - SEAMS[2])) };
  return { index: 3, mix: clamp01((d - SEAMS[3]) / FINAL_SPAN) };
}

// The full lerped colour set at a distance. District I anchors to the palette
// exactly; the last district holds (index+1 clamps to itself, so mix is inert
// there).
export function biomePalette(distance: number): BiomeColors {
  const { index, mix } = biomeAt(distance);
  const a = BIOME_PALETTES[index];
  const b = BIOME_PALETTES[Math.min(index + 1, BIOME_PALETTES.length - 1)];
  return {
    skyTop: lerpHex(a.skyTop, b.skyTop, mix),
    skyMid: lerpHex(a.skyMid, b.skyMid, mix),
    skyBottom: lerpHex(a.skyBottom, b.skyBottom, mix),
    cloud: lerpHex(a.cloud, b.cloud, mix),
    hillFar: lerpHex(a.hillFar, b.hillFar, mix),
    hillNear: lerpHex(a.hillNear, b.hillNear, mix),
    groundTop: lerpHex(a.groundTop, b.groundTop, mix),
    groundBody: lerpHex(a.groundBody, b.groundBody, mix),
    groundDot: lerpHex(a.groundDot, b.groundDot, mix),
    pathEdge: lerpHex(a.pathEdge, b.pathEdge, mix),
    obstaclePlum: lerpHex(a.obstaclePlum, b.obstaclePlum, mix),
    obstacleDeep: lerpHex(a.obstacleDeep, b.obstacleDeep, mix),
    obstacleDot: lerpHex(a.obstacleDot, b.obstacleDot, mix),
    moon: lerpHex(a.moon, b.moon, mix),
  };
}

// The ratchet. Pure function of the FINISHED run's outcome only (distance,
// score, hearts) — nothing about the current frame or clock. It drifts skill
// toward a target earned by the run, capped at ±0.1 so difficulty never jumps:
// deep, healthy, high-scoring runs pull up; weak runs give gentle relief down.
// Clamped [0, 1]. Determinism is preserved because only the STORED skill is
// ever read back, and it is a plain number of past results.
export function nextSkill(
  skill: number,
  stats: { distance: number; score: number; hearts: number },
): number {
  const reach = clamp01(stats.distance / 1600); // ~deep into The Undernight
  const scoreReach = clamp01(stats.score / 4000);
  const heartsReach = clamp01(stats.hearts / 3);
  const target = 0.12 + 0.55 * reach + 0.18 * scoreReach + 0.15 * heartsReach;
  const delta = Math.max(-0.1, Math.min(0.1, target - clamp01(skill)));
  return clamp01(clamp01(skill) + delta);
}
