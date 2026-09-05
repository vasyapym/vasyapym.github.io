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
  // The small header above the character-select cards.
  pickLabel: string;
};

export type Theme = {
  id: CharacterId;
  palette: ThemePalette;
  text: ThemeText;
};

const KITTY_TEXT: ThemeText = {
  name: "kitty",
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
  pickLabel: "choose your runner",
};

// Dark Souls v2, re-authored against the owner's reference vista: a tiny
// knight, a vast dead gothic city, a dying sun. Two families only — cold
// (slate → ash → bone → soul-light) is the dead world; warm (ash-rose →
// peach → ember) is every living light. Value does the storytelling:
// deep slate overhead, a lit horizon, castle layers fading upward into
// mist (≈ 0.28 → 0.14 → 0.04), a dark stone ground, and a bone knight as
// the brightest solid thing on screen. Only sunCore and heart cross the
// bloom line; windowEmber rides the knee on purpose (smoldering windows).
const SOULS_PALETTE: ThemePalette = {
  kittyWhite: "#e8e1d2",
  outlineInk: "#17130f",
  bowRed: "#6a6d72",
  bowDeep: "#3d4045",
  suitPink: "#8a4a33",
  suitDeep: "#522a1e",
  noseYellow: "#e07a34",
  cheek: "#bd917a",
  eyeInk: "#1e1815",

  skyTop: "#3d4a5f",
  skyMid: "#78889f",
  skyBottom: "#b48f85",
  sunCore: "#eaf0f6",
  sunHalo: "#c8d2dd",
  sunHaloSoft: "#8e9caf",
  cloud: "#4f5c70",
  cloudLit: "#e8a878",
  hillFar: "#6f7c8d",
  hillNear: "#4d586a",
  castleFar: "#8a929f",
  castleMid: "#5d6a7c",
  castleNear: "#323b49",
  windowEmber: "#ffe09a",
  ash: "#c9c1b6",

  groundTop: "#67645f",
  groundBody: "#3a3835",
  groundDot: "#d98a4e",
  pathEdge: "#4c4844",

  obstaclePlum: "#3a302c",
  obstacleDeep: "#16110f",
  obstacleDot: "#d4b48c",

  heart: "#e6f1ff",
  heartGlow: "#b7d3f2",
  star: "#f2b03e",
  starGlow: "#cf6d1c",
  heal: "#ec6a22",
  healBurst: "#ffbf85",

  ink: "#15110e",
  paper: "#e6dfd1",
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
