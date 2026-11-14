import { useRef, useState, useSyncExternalStore } from "react";

export type ReadingMode = "prose" | "free" | "code";

const PREFIX = "practice-map:reading:v1:";
// The superseded free-reading settings record (an on/off toggle). Read once
// for migration, then removed — the per-section free text and hidden-example
// records share the legacy prefix and stay untouched.
const LEGACY_PREFIX = "practice-map:free:v2:";

export const readingModeKey = (topicId: string) => `${PREFIX}${topicId}`;
const legacySettingsKey = (topicId: string) => `${LEGACY_PREFIX}${topicId}`;

export type ReadingModeRecord = {
  readonly v: 1;
  readonly mode: ReadingMode;
  readonly updatedAt: number;
};

export function isReadingModeRecord(x: unknown): x is ReadingModeRecord {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 1 &&
    (o.mode === "prose" || o.mode === "free" || o.mode === "code") &&
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
  if (e.key === null || e.key.startsWith(PREFIX)) emit(); // other tabs
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

type LegacySettings = { v: 2; enabled: boolean; updatedAt: number };

function readLegacySettings(topicId: string): LegacySettings | null {
  const raw = getRaw(legacySettingsKey(topicId));
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
      return parsed as LegacySettings;
    }
  } catch {
    /* corrupt → absent */
  }
  return null;
}

function readModeRecord(topicId: string): ReadingModeRecord | null {
  const key = readingModeKey(topicId);
  const raw = getRaw(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return (cached.value as ReadingModeRecord | null) ?? null;

  let value: ReadingModeRecord | null = null;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isReadingModeRecord(parsed)) value = parsed;
    } catch {
      /* corrupt → absent; the legacy record below can still supply a mode */
    }
  }
  // Migration on read: a lesson with no v1 record but a legacy free-reading
  // settings one maps enabled → free/prose, writes the v1 record and drops
  // the settings record (only that one). No emit here — this runs inside a
  // getSnapshot, and the migrated value is exactly what every same-tab
  // subscriber reads through the cache below.
  if (!value) {
    const legacy = readLegacySettings(topicId);
    if (legacy) {
      value = {
        v: 1,
        mode: legacy.enabled ? "free" : "prose",
        updatedAt: legacy.updatedAt,
      };
      const migrated = JSON.stringify(value);
      setRaw(key, migrated);
      // Durability rule: the legacy settings record stays the durable copy
      // until the replacement is proven durable — read the key back through
      // localStorage directly (getRaw would serve the memory fallback the
      // write just populated). On quota the v1 value serves this session
      // from memory while the legacy record survives for the next one.
      let durable: string | null = null;
      try {
        durable = window.localStorage.getItem(key);
      } catch {
        /* blocked storage → not durable */
      }
      if (durable === migrated) removeRaw(legacySettingsKey(topicId));
      snapshotCache.set(key, { raw: getRaw(key), value });
      return value;
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

// Side-effect-free peek for hosts that must react to a store change before
// React is notified (the anchor-parity subscribe wrapper): serves the
// durable record or the memory fallback and guards it — no migration, no
// cache writes, no emit.
export function peekReadingMode(topicId: string): ReadingMode | null {
  const raw = getRaw(readingModeKey(topicId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isReadingModeRecord(parsed) ? parsed.mode : null;
  } catch {
    return null;
  }
}

export function useReadingMode(
  topicId: string,
  beforeNotify?: () => void,
): { mode: ReadingMode; hydrated: boolean } {
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
    () => readModeRecord(topicId),
    () => null, // server snapshot — renders as absent until hydrated
  );
  const hydrated = useSyncExternalStore(stableSubscribe, () => true, () => false);
  return { mode: record?.mode ?? "prose", hydrated };
}

export function writeReadingMode(topicId: string, mode: ReadingMode) {
  writeRecord(readingModeKey(topicId), {
    v: 1,
    mode,
    updatedAt: Date.now(),
  });
}
