// The theme layer: two characters share one game. Every theme is a full
// colour palette plus the UI voice for the cards and HUD; the simulation
// never reads any of it. Selection is presentation, tied to the character
// chip on the ready card — a cosmetic variant, never a difficulty change.

import { PALETTE } from "./palette.ts";

export type CharacterId = "kitty" | "souls";

// Every theme palette carries exactly the pastel palette's keys, so scene
// code can switch themes by lookup alone — no conditionals anywhere.
export type ThemePalette = { [K in keyof typeof PALETTE]: string };

export type ThemeText = {
  // Character chips on the ready card.
  name: string;
  blurb: string;
  // HUD.
  best: string;
  // Ready card.
  readyKicker: string;
  readyAction: string;
  watchTitle: string;
  watchHint: string;
  // Pause card.
  pausedKicker: string;
  pausedHint: string;
  pausedAction: string;
  // Game-over card.
  overKicker: string;
  overBadge: string;
  overAction: string;
  // HUD labels.
  dashLabel: string;
  pilotLabel: string;
  // The mid-run character-swap chip beside the pause button.
  swapLabel: string;
  // The small header above the character-select cards.
  pickLabel: string;
};

export type Theme = {
  id: CharacterId;
  palette: ThemePalette;
  text: ThemeText;
};

const KITTY_TEXT: ThemeText = {
  name: "cat",
  blurb: "the pastel runner",
  best: "best",
  readyKicker: "ready",
  readyAction: "start",
  watchTitle: "or watch it play itself",
  watchHint: "autopilot · the lookahead bot that verifies every track",
  pausedKicker: "paused",
  pausedHint: "p or esc resumes · r restarts",
  pausedAction: "resume",
  overKicker: "run over",
  overBadge: "new best!",
  overAction: "again",
  dashLabel: "dash",
  pilotLabel: "autopilot · take control",
  swapLabel: "change character",
  pickLabel: "choose your runner",
};

// Dark Souls v3 — the owner's pick from the three live art-direction
// candidates: candidate C, "Ash Lake Hollow". The near-monochrome read:
// colour drained to slate, scale carried by value and veils of particulate.
// Two families only — cold (slate → ash → bone → soul-light) is the dead
// world; the warm budget collapses to ONE ember window cluster
// (windowEmber) plus the knight's ember eyes, the single warm pixels on
// screen. Value does the storytelling: deep cold overhead, a pale barely-lit
// horizon, three thin cold haze banks flattening the city into veiled grey
// layers, a dark cold-stone ground, and a dimmed bone knight modelled by
// VALUE against the mist — no rim light anywhere. Only sunCore and heart
// cross the bloom line; windowEmber rides the knee on purpose. The depth
// ladder still recedes — bone-mist far (≈ 0.62), slate mid (≈ 0.35), deep
// near (≈ 0.15) — but colder than the v2 vista it replaces. Pickups keep
// their saturated families on purpose: the readability floor, and the only
// colour besides the window.
const SOULS_PALETTE: ThemePalette = {
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
  // Cold-lit stone: no warm sun-dot here — the edge is mineral, not lit.
  groundDot: "#6a6763",
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

const SOULS_TEXT: ThemeText = {
  name: "ashen",
  blurb: "the hollow runner",
  best: "best",
  readyKicker: "rise",
  readyAction: "begin",
  watchTitle: "or watch the hollow walk",
  watchHint: "autopilot · a hollow that has died on every track",
  pausedKicker: "rest",
  pausedHint: "p or esc to rise · r restarts",
  pausedAction: "go on",
  overKicker: "YOU DIED",
  overBadge: "new record",
  overAction: "rekindle",
  dashLabel: "roll",
  pilotLabel: "phantom · take control",
  swapLabel: "change character",
  pickLabel: "choose your vessel",
};

// CSS-facing accents for the souls theme. The HUD/overlay styles consume
// these as literals (CSS cannot import TS); they are recorded here so the
// whole design system stays in one place. The v2 accents lean cold-slate
// (card #171a1f, cardLine #3a4250) to sit inside the new dead-stone world;
// ember stays the single warm voice. `death` is for the large YOU DIED
// kicker only — ≈3.3:1 on the card surface, too low for small text.
export const SOULS_UI = {
  ember: "#e8863c",
  emberDeep: "#b85f22",
  soul: "#dbe9fb",
  soulGlow: "#8fb4dc",
  death: "#cc372c",
  card: "#171a1f",
  cardLine: "#3a4250",
  inkMuted: "#9aa3ae",
} as const;

export const THEMES: Record<CharacterId, Theme> = {
  kitty: { id: "kitty", palette: PALETTE, text: KITTY_TEXT },
  souls: { id: "souls", palette: SOULS_PALETTE, text: SOULS_TEXT },
};

export const CHARACTER_IDS: readonly CharacterId[] = ["kitty", "souls"];

export function themeFor(character: CharacterId): Theme {
  return THEMES[character];
}

export function paletteFor(character: CharacterId): ThemePalette {
  return THEMES[character].palette;
}

const CHARACTER_KEY = "kitty-run/character/v1";

function isCharacterId(value: unknown): value is CharacterId {
  return value === "kitty" || value === "souls";
}

export function readStoredCharacter(storage: Storage): CharacterId {
  try {
    const raw = storage.getItem(CHARACTER_KEY);
    if (isCharacterId(raw)) return raw;
  } catch {
    // Private mode or unavailable storage: the pastel default stands.
  }
  return "kitty";
}

export function storeCharacter(storage: Storage, character: CharacterId): void {
  try {
    storage.setItem(CHARACTER_KEY, character);
  } catch {
    // Full storage or private mode: the choice holds for this visit only.
  }
}

// ?souls deep-links straight into the dark theme; persistence handles
// switching back interactively, so there is no ?kitty counterpart.
export function characterFromParams(
  params: URLSearchParams,
): CharacterId | null {
  if (params.has("souls")) return "souls";
  return null;
}
