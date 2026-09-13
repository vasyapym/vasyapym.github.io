export type FreeReadingSettings = {
  readonly v: 2;
  readonly enabled: boolean;
  readonly updatedAt: number;
};

/** A section's edited text as the reader left it (original is hashed, not stored). */
export type FreeReadingText = {
  readonly v: 2;
  readonly contentHash: string;
  readonly text: string;
  /** Latch: once every original word was deleted, typed notes can't regress it. */
  readonly completed?: boolean;
  readonly updatedAt: number;
};

export interface FreeReadingOptions {
  /** Storage key for this stream (per lesson section in our wiring). */
  sectionKey: string;
  /** Pristine section prose the stream starts from. */
  original: string;
  enabled: boolean;
  debounceMs?: number;
}
