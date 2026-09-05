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
};

// Dusk, not midnight: a steel-blue mid-tone sky the whole way up (dark iron
// hazards still read against it) warming to ash-rose at the horizon. Ember
// carries everything living; ash, bone and cold soul-light carry the dead.
// Value rungs stay distinct — sky mid ≈ 0.24, ground ≈ 0.13, crates ≈ 0.05,
// bone cat ≈ 0.79 — so silhouettes never share a value. Only the moon and
// the soul glow sit above the bloom threshold, on purpose.
const SOULS_PALETTE: ThemePalette = {
  kittyWhite: "#ece5d8",
  outlineInk: "#1c1816",
  bowRed: "#7c7a78",
  bowDeep: "#4f4c4a",
  suitPink: "#925039",
  suitDeep: "#5a3024",
  noseYellow: "#e8803c",
  cheek: "#c9a08c",
  eyeInk: "#241d1a",

  skyTop: "#55647e",
  skyMid: "#7b8797",
  skyBottom: "#a89484",
  sunCore: "#eef2f8",
  sunHalo: "#ccd6e2",
  sunHaloSoft: "#a3afbf",
  cloud: "#aab1b9",
  hillFar: "#66748a",
  hillNear: "#4a5566",

  groundTop: "#6b655d",
  groundBody: "#3e3a36",
  groundDot: "#e89a5e",
  pathEdge: "#55504a",

  obstaclePlum: "#4a3b36",
  obstacleDeep: "#1e1917",
  obstacleDot: "#d9b98e",

  heart: "#dcecff",
  heartGlow: "#9ec4ee",
  star: "#f5b642",
  starGlow: "#d9781f",
  heal: "#ea6a24",
  healBurst: "#ffb37a",

  ink: "#1a1614",
  paper: "#e8e2d6",
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
};

// CSS-facing accents for the souls theme. The HUD/overlay styles consume
// these as literals (CSS cannot import TS); they are recorded here so the
// whole design system stays in one place. `death` is for the large YOU DIED
// kicker only — ≈3.7:1 on the card surface, too low for small text.
export const SOULS_UI = {
  ember: "#e8863c",
  emberDeep: "#b8601f",
  soul: "#dcecff",
  soulGlow: "#7fa8d8",
  death: "#d23b2f",
  card: "#1b1917",
  cardLine: "#3d3733",
  inkMuted: "#9b928a",
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
