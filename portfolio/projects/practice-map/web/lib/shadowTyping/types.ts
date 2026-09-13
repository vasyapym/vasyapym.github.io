export type UnitGranularity = "word" | "sentence";

export interface Unit {
  id: number;
  text: string; // typeable content
  chars: string[]; // Array.from(text) — code points, not UTF-16 units
  trailing: string; // whitespace after the unit; rendered, never typed
}

export type CharState = "correct" | "incorrect" | "pending";

export type ShadowTypingProgress = {
  readonly v: 1;
  readonly consumed: number;
  readonly contentHash: string;
  readonly updatedAt: number;
};

export type ShadowTypingSettings = {
  readonly v: 1;
  readonly enabled: boolean;
  readonly granularity: UnitGranularity;
  readonly updatedAt: number;
};

export interface ShadowTypingOptions {
  /** Storage-key suffix for this unit stream (per lesson section in our wiring). */
  topicId: string;
  text: string;
  enabled: boolean;
  granularity: UnitGranularity;
  caseSensitive?: boolean;
  allowSkip?: boolean;
}
