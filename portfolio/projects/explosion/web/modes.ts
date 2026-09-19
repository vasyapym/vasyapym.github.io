// modes.ts — the three Explosion modes behind one runtime contract.
// Classic ("ember lantern", detonate.ts) is wrapped, never modified; the ink mode
// is lazy-loaded on first selection so its shaders/code leave the initial bundle.
// The page stays mode-agnostic: it mounts a ModeDef, polls handle.stats, and
// renders mode.formatHud verbatim. First visit shows the selector; the last
// choice persists in localStorage and ?mode= deep-links straight into a mode.
import { hasWebGL, mountSpecimen, type SpecimenHandle, type SpecimenStats } from "./detonate";
import type { InkHandle, InkStats } from "./ink";
import type { FaultHandle, FaultStats } from "./fault";

export type ModeId = "lantern" | "ink" | "fault";

// SpecimenStats/InkStats are structurally compatible supersets of this shape.
export type ModeStats = {
  fps: number;
  engagements: number;
} & Record<string, string | number | boolean>;

export type ModeHandle = {
  detonateAt(clientX: number, clientY: number): boolean;
  restore(): void;
  setMuted(muted: boolean): void;
  setSlowMo(slow: boolean): void;
  dispose(): void;
  readonly stats: ModeStats;
};

export type Mounted = {
  handle: ModeHandle;
  formatHud: (stats: ModeStats) => string;
};

export type ModeDef = {
  id: ModeId;
  title: string;
  tagline: string;
  accentLine: string;
  lede: string;
  hint: string;
  stageLabel: string;
  fallback: string;
  techniques: ReadonlyArray<string>;
  mount(element: HTMLElement): Promise<Mounted | null>;
};

// Verbatim lantern HUD (moved from the page unchanged — the headless suite parses it).
function formatLanternHud(stats: SpecimenStats): string {
  return [
    `fps ${Math.round(stats.fps)}`,
    `phase ${stats.phase}`,
    `aloft ${stats.aloft}/${stats.shards}`,
    `sim ${stats.sim}`,
    `blooms ${stats.engagements}`,
  ].join(" · ");
}

const lantern: ModeDef = {
  id: "lantern",
  title: "ember lantern",
  tagline: "a paper moon of 600 gpu shards — one click unmakes it",
  accentLine: "a lantern, unmade",
  lede: "a paper moon of six hundred shards. one click unmakes it; one click restores it.",
  hint: "click to detonate · enter/space from center · restore reassembles",
  stageLabel: "detonate the paper-lantern moon; press enter or space to blast from center",
  fallback: "webgl is unavailable — this piece needs a webgl context to render the lantern.",
  techniques: ["gpgpu", "single mesh", "no timers", "flashpoint", "soft-gl safe"],
  mount: (element: HTMLElement): Promise<Mounted | null> => {
    const handle: SpecimenHandle | null = mountSpecimen(element);
    if (handle == null) return Promise.resolve(null);
    return Promise.resolve({
      handle,
      formatHud: (stats) => formatLanternHud(stats as SpecimenStats),
    });
  },
};

const ink: ModeDef = {
  id: "ink",
  title: "ink shockwave",
  tagline: "stir it, then detonate it",
  accentLine: "ink, disturbed",
  lede: "stir it with the pointer; click to detonate a shockwave through it.",
  hint: "move to stir · click to detonate · restore re-pours",
  stageLabel: "stir the ink with the pointer; click to detonate; press enter or space to detonate from center",
  fallback: "this mode needs webgl2 float render targets, and the browser declined — the ink stays still.",
  techniques: ["navier–stokes", "uv units", "no readback", "shock ring", "half-float fields"],
  mount: async (element: HTMLElement): Promise<Mounted | null> => {
    const mod = await import("./ink");
    const handle: InkHandle | null = mod.mountInk(element);
    if (handle == null) return null;
    return {
      handle,
      formatHud: (stats) => mod.formatInkHud(stats as InkStats),
    };
  },
};

const fault: ModeDef = {
  id: "fault",
  title: "cinder fault",
  tagline: "a solid surface that remembers the blast",
  accentLine: "stress becomes light",
  lede: "strike a ceramic seal and watch the shock write its faults in fire.",
  hint: "click to detonate · restore reseals",
  stageLabel: "interactive ceramic seal fracture experiment",
  fallback: "this experiment needs floating-point graphics support.",
  techniques: ["gpu elastodynamics", "cohesive bond damage", "conservative edge forces", "mineral-guided fracture", "relief shading"],
  mount: async (element: HTMLElement): Promise<Mounted | null> => {
    const mod = await import("./fault");
    const handle: FaultHandle | null = mod.mountFault(element);
    if (handle == null) return null;
    return {
      handle,
      formatHud: (stats) => mod.formatFaultHud(stats as FaultStats),
    };
  },
};

export const MODES: ReadonlyArray<ModeDef> = [lantern, ink, fault];

export function getMode(id: ModeId): ModeDef {
  const def = MODES.find((m) => m.id === id);
  return def ?? lantern;
}

export function otherMode(id: ModeId): ModeId {
  return id === "lantern" ? "ink" : id === "ink" ? "fault" : "lantern";
}

const LS_KEY = "explosion-mode";

function isModeId(value: string): value is ModeId {
  return value === "lantern" || value === "ink" || value === "fault";
}

export function readPreferredMode(): ModeId | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw != null && isModeId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writePreferredMode(id: ModeId): void {
  try {
    window.localStorage.setItem(LS_KEY, id);
  } catch {
    // Private-mode storage denials must never break a mode switch.
  }
}

export function readModeParam(): ModeId | null {
  try {
    const value = new URLSearchParams(window.location.search).get("mode");
    return value != null && isModeId(value) ? value : null;
  } catch {
    return null;
  }
}

export { hasWebGL };
