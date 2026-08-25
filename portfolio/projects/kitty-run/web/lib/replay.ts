// Best-run replay storage. A replay is the run's seed plus a timed input
// list — exactly what the deterministic simulation needs to reproduce the
// whole run, which is how the ghost kitty can race you along the same
// track. Lives in localStorage beside the best score; the sanitizer
// guards against corrupt, stale or hand-edited entries.

export type RunInputKind = "jump" | "release" | "dash";

export type RunInput = {
  // Seconds since the run started. world.time is zeroed on start, so
  // these are directly comparable across runs.
  t: number;
  kind: RunInputKind;
};

export type StoredReplay = {
  seed: string;
  score: number;
  distance: number;
  inputs: RunInput[];
};

export const REPLAY_KEY = "kitty-run.replay.v1";

// A three-minute run at frantic tapping stays under a few hundred
// entries; the cap only exists so a hostile payload cannot bloat storage.
const MAX_INPUTS = 6000;

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function isNonNeg(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function sanitizeReplay(raw: unknown): StoredReplay | null {
  try {
    if (typeof raw !== "object" || raw === null) return null;
    const r = raw as Record<string, unknown>;
    if (typeof r.seed !== "string" || r.seed.length === 0 || r.seed.length > 120) {
      return null;
    }
    if (!isNonNeg(r.score) || !isNonNeg(r.distance)) return null;
    if (!Array.isArray(r.inputs) || r.inputs.length === 0 || r.inputs.length > MAX_INPUTS) {
      return null;
    }
    const inputs: RunInput[] = [];
    let lastT = -1;
    for (const item of r.inputs) {
      if (typeof item !== "object" || item === null) return null;
      const e = item as Record<string, unknown>;
      if (e.kind !== "jump" && e.kind !== "release" && e.kind !== "dash") return null;
      if (!isNonNeg(e.t) || e.t < lastT) return null;
      lastT = e.t;
      inputs.push({ t: e.t, kind: e.kind });
    }
    return {
      seed: r.seed,
      score: Math.floor(r.score),
      distance: Math.floor(r.distance),
      inputs,
    };
  } catch {
    return null;
  }
}

export function loadReplay(storage: StorageLike | null): StoredReplay | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(REPLAY_KEY);
    if (raw === null) return null;
    return sanitizeReplay(JSON.parse(raw));
  } catch {
    return null;
  }
}

// Only a strictly better run replaces the stored ghost, so a tie never
// rewrites history.
export function saveReplayIfBest(
  storage: StorageLike,
  candidate: StoredReplay,
): boolean {
  const clean = sanitizeReplay(candidate);
  if (clean === null) return false;
  const current = loadReplay(storage);
  if (current !== null && current.score >= clean.score) return false;
  try {
    storage.setItem(REPLAY_KEY, JSON.stringify(clean));
    return true;
  } catch {
    // Private mode or full quota: the ghost simply goes unrecorded.
    return false;
  }
}
