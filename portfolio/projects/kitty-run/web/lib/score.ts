// Scoring and combo rules, kept pure so the node checks can pin the math.

export type PickupKind = "heart" | "star" | "heal";

export const PICKUP_BASE: Record<PickupKind, number> = {
  heart: 10,
  star: 25,
  heal: 5,
};

// A pickup refreshes this window; letting it lapse resets the chain.
export const COMBO_WINDOW = 2.5;

// Every fourth consecutive pickup raises the multiplier, capped at x8.
export function comboMultiplier(combo: number): number {
  return 1 + Math.min(7, Math.floor(Math.max(0, combo) / 4));
}

export function pickupScore(kind: PickupKind, combo: number): number {
  return PICKUP_BASE[kind] * comboMultiplier(combo);
}

// Distance alone ticks one point per unit, so the counter always breathes.
export function distanceScore(distance: number): number {
  return Math.max(0, Math.floor(distance));
}

export function bestScoreKey(): string {
  return "kitty-run.best.v1";
}

export function readBestScore(storage: {
  getItem(key: string): string | null;
}): number {
  const raw = storage.getItem(bestScoreKey());
  if (raw === null) return 0;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function writeBestScore(
  storage: {
    setItem(key: string, value: string): void;
  },
  score: number,
): void {
  try {
    storage.setItem(bestScoreKey(), String(Math.max(0, Math.floor(score))));
  } catch {
    // Private mode or full quota: the run simply goes unrecorded.
  }
}
