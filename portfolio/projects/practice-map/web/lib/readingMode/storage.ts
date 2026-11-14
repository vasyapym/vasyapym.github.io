import { useRef, useState, useSyncExternalStore } from "react";

/** How the lesson is presented — the "read as code" pill's two readings. */
export type ReadingPresentation = "prose" | "code";

/** The reading state: the presentation flag plus the free-reading flag. */
export type ReadingState = {
  presentation: ReadingPresentation;
  free: boolean;
};

const PREFIX = "practice-map:reading:v2:";
// Superseded sources, read once for migration then removed: the v1
// single-mode record and the older free-reading settings record. The
// per-section free text and hidden-example records share the legacy free
// prefix and stay untouched.
const V1_PREFIX = "practice-map:reading:v1:";
const LEGACY_FREE_PREFIX = "practice-map:free:v2:";

export const readingModeKey = (topicId: string) => `${PREFIX}${topicId}`;
const v1ModeKey = (topicId: string) => `${V1_PREFIX}${topicId}`;
const legacyFreeSettingsKey = (topicId: string) => `${LEGACY_FREE_PREFIX}${topicId}`;

export type ReadingStateRecord = {
  readonly v: 2;
  readonly presentation: ReadingPresentation;
  readonly free: boolean;
  readonly updatedAt: number;
};

export function isReadingStateRecord(x: unknown): x is ReadingStateRecord {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 2 &&
    (o.presentation === "prose" || o.presentation === "code") &&
    typeof o.free === "boolean" &&
    typeof o.updatedAt === "number"
  );
}

const listeners = new Set<() => void>();
const memoryFallback = new Map<string, string>();
// getSnapshot must return a referentially stable value for unchanged data.
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function getRaw(key: string): string | null {
  if (memoryFallback.has(key)) return memoryFallback.get(key) as string;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function setRaw(key: string, raw: string) {
  try {
    window.localStorage.setItem(key, raw);
    memoryFallback.delete(key);
  } catch {
    memoryFallback.set(key, raw); // quota / private mode
  }
}
function removeRaw(key: string) {
  memoryFallback.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function writeRecord(key: string, value: unknown) {
  setRaw(key, JSON.stringify(value));
  emit();
}

function emit() {
  for (const l of listeners) l();
}
function onStorage(e: StorageEvent) {
  if (e.key === null || e.key.startsWith(PREFIX) || e.key === CODE_SIZE_KEY) emit(); // other tabs
}
function subscribe(cb: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

// A module-level wrapper keeps the reference stable across renders, so
// useSyncExternalStore doesn't unsubscribe/resubscribe on every render.
const stableSubscribe = (cb: () => void) => subscribe(cb);

type V1ModeRecord = {
  readonly v: 1;
  readonly mode: "prose" | "free" | "code";
  readonly updatedAt: number;
};

function isV1ModeRecord(x: unknown): x is V1ModeRecord {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 1 &&
    (o.mode === "prose" || o.mode === "free" || o.mode === "code") &&
    typeof o.updatedAt === "number"
  );
}

function readV1Mode(topicId: string): V1ModeRecord | null {
  const raw = getRaw(v1ModeKey(topicId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isV1ModeRecord(parsed)) return parsed;
  } catch {
    /* corrupt → absent */
  }
  return null;
}

type LegacyFreeSettings = { v: 2; enabled: boolean; updatedAt: number };

function readLegacyFreeSettings(topicId: string): LegacyFreeSettings | null {
  const raw = getRaw(legacyFreeSettingsKey(topicId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as Record<string, unknown>).v === 2 &&
      typeof (parsed as Record<string, unknown>).enabled === "boolean" &&
      typeof (parsed as Record<string, unknown>).updatedAt === "number"
    ) {
      return parsed as LegacyFreeSettings;
    }
  } catch {
    /* corrupt → absent */
  }
  return null;
}

function readStateRecord(topicId: string): ReadingStateRecord | null {
  const key = readingModeKey(topicId);
  const raw = getRaw(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return (cached.value as ReadingStateRecord | null) ?? null;

  let value: ReadingStateRecord | null = null;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isReadingStateRecord(parsed)) value = parsed;
    } catch {
      /* corrupt → absent; the superseded records below can still supply one */
    }
  }
  // Migration on read: a lesson with no v2 record maps the newest superseded
  // source onto a fresh one — the v1 single-mode record strictly supersedes
  // the free-reading settings record. No emit here — this runs inside a
  // getSnapshot, and the migrated value is exactly what every same-tab
  // subscriber reads through the cache below.
  if (!value) {
    const v1 = readV1Mode(topicId);
    const legacyFree = v1 ? null : readLegacyFreeSettings(topicId);
    const migrated: ReadingStateRecord | null = v1
      ? {
          v: 2,
          presentation: v1.mode === "code" ? "code" : "prose",
          free: v1.mode === "free",
          updatedAt: v1.updatedAt,
        }
      : legacyFree
        ? {
            v: 2,
            presentation: "prose",
            free: legacyFree.enabled,
            updatedAt: legacyFree.updatedAt,
          }
        : null;
    if (migrated) {
      // Invariant: a migration promotes legacy state; it never overwrites a
      // newer v2 choice. Another tab may complete its own migration and take
      // a user write between this tab's read of the legacy records and now —
      // so re-read the key directly through localStorage right before the
      // write (getRaw would serve this tab's memory fallback and mask that
      // write) and adopt a valid newer v2 record instead. Adopting skips the
      // superseded-record removals deliberately: the other tab's migration
      // owns them. The residual race window is the gap between this re-read
      // and setRaw — two adjacent statements in one synchronous block; a
      // per-topic lock (Web Locks API) is async and cannot wrap the
      // synchronous getSnapshot, so that deeper refactor stays out of scope.
      let foreignRaw: string | null = null;
      try {
        foreignRaw = window.localStorage.getItem(key);
      } catch {
        /* blocked storage → nothing to adopt */
      }
      if (foreignRaw) {
        try {
          const parsed: unknown = JSON.parse(foreignRaw);
          if (isReadingStateRecord(parsed)) {
            snapshotCache.set(key, { raw: foreignRaw, value: parsed });
            return parsed;
          }
        } catch {
          /* corrupt foreign raw → fall through and write the migration */
        }
      }
      const migratedRaw = JSON.stringify(migrated);
      setRaw(key, migratedRaw);
      // Durability rule: the superseded records stay the durable copy until
      // the replacement is proven durable — read the key back through
      // localStorage directly (getRaw would serve the memory fallback the
      // write just populated). On quota the migrated value serves this
      // session from memory while the superseded records survive for the
      // next one.
      let durable: string | null = null;
      try {
        durable = window.localStorage.getItem(key);
      } catch {
        /* blocked storage → not durable */
      }
      if (durable === migratedRaw) {
        removeRaw(v1ModeKey(topicId));
        removeRaw(legacyFreeSettingsKey(topicId)); // a fossil when v1 was the source
      }
      snapshotCache.set(key, { raw: getRaw(key), value: migrated });
      return migrated;
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

// Side-effect-free peek for hosts that must react to a store change before
// React is notified (the anchor-parity subscribe wrapper): serves the
// durable record or the memory fallback and guards it — no migration, no
// cache writes, no emit.
export function peekReadingState(topicId: string): ReadingState | null {
  const raw = getRaw(readingModeKey(topicId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isReadingStateRecord(parsed)
      ? { presentation: parsed.presentation, free: parsed.free }
      : null;
  } catch {
    return null;
  }
}

export function useReadingMode(
  topicId: string,
  beforeNotify?: () => void,
): ReadingState & { hydrated: boolean } {
  // beforeNotify runs before React is told about a store change — the host
  // captures pre-change geometry there (anchor parity for external,
  // other-tab switches). The ref keeps the wrapper's identity stable so the
  // subscription is never torn down by a changing closure.
  const beforeRef = useRef(beforeNotify);
  beforeRef.current = beforeNotify;
  const [wrappedSubscribe] = useState<(cb: () => void) => () => void>(
    () => (cb: () => void) =>
      stableSubscribe(() => {
        beforeRef.current?.();
        cb();
      }),
  );
  const record = useSyncExternalStore(
    wrappedSubscribe,
    () => readStateRecord(topicId),
    () => null, // server snapshot — renders as absent until hydrated
  );
  const hydrated = useSyncExternalStore(stableSubscribe, () => true, () => false);
  return {
    presentation: record?.presentation ?? "prose",
    free: record?.free ?? false,
    hydrated,
  };
}

export function writeReadingMode(topicId: string, state: ReadingState) {
  writeRecord(readingModeKey(topicId), {
    v: 2,
    presentation: state.presentation,
    free: state.free,
    updatedAt: Date.now(),
  });
}

/** The read-as-code text voice the reader picked (styleguide §8.1). */
export type CodeTextSize = "github" | "14" | "15" | "16";

// Global (not per lesson): one voice choice for the whole reader. The same
// machinery — listeners, snapshot cache, memory fallback — serves it.
const CODE_SIZE_KEY = "practice-map:code-size:v1";

/** Cycle order: github (13.6, GitHub-exact) → 14 → 15 → 16 → github. */
export const CODE_TEXT_SIZES: readonly CodeTextSize[] = ["github", "14", "15", "16"];

export type CodeTextSizeRecord = {
  readonly v: 1;
  readonly size: CodeTextSize;
  readonly updatedAt: number;
};

export function isCodeTextSizeRecord(x: unknown): x is CodeTextSizeRecord {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 1 &&
    (o.size === "github" || o.size === "14" || o.size === "15" || o.size === "16") &&
    typeof o.updatedAt === "number"
  );
}

function readCodeSizeRecord(): CodeTextSizeRecord | null {
  const raw = getRaw(CODE_SIZE_KEY);
  const cached = snapshotCache.get(CODE_SIZE_KEY);
  if (cached && cached.raw === raw) return (cached.value as CodeTextSizeRecord | null) ?? null;

  let value: CodeTextSizeRecord | null = null;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isCodeTextSizeRecord(parsed)) value = parsed;
    } catch {
      /* corrupt → absent */
    }
  }
  snapshotCache.set(CODE_SIZE_KEY, { raw, value });
  return value;
}

// Side-effect-free peek for hosts that must react to a store change before
// React is notified (the anchor-parity subscribe wrapper): serves the
// durable record or the memory fallback and guards it — no cache writes,
// no emit. Same shape as peekReadingState.
export function peekCodeTextSize(): CodeTextSize | null {
  const raw = getRaw(CODE_SIZE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isCodeTextSizeRecord(parsed) ? parsed.size : null;
  } catch {
    return null;
  }
}

export function useCodeTextSize(): { size: CodeTextSize; hydrated: boolean } {  const record = useSyncExternalStore(
    stableSubscribe,
    () => readCodeSizeRecord(),
    () => null, // server snapshot — renders as absent until hydrated
  );
  const hydrated = useSyncExternalStore(stableSubscribe, () => true, () => false);
  return { size: record?.size ?? "github", hydrated };
}

export function writeCodeTextSize(size: CodeTextSize) {
  writeRecord(CODE_SIZE_KEY, { v: 1, size, updatedAt: Date.now() });
}

export function nextCodeTextSize(current: CodeTextSize): CodeTextSize {
  const at = CODE_TEXT_SIZES.indexOf(current);
  return CODE_TEXT_SIZES[(at + 1) % CODE_TEXT_SIZES.length] ?? "github";
}
