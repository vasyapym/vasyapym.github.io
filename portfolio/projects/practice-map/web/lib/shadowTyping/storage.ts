import { useCallback, useSyncExternalStore } from "react";
import type { ShadowTypingProgress, ShadowTypingSettings } from "./types";

const PREFIX = "practice-map:shadow:v1:";

export const shadowSettingsKey = (topicId: string) => `${PREFIX}${topicId}`;
export const shadowSectionKey = (topicId: string, sectionIndex: number) =>
  `${PREFIX}${topicId}#s${sectionIndex}`;

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

function readRecord<T>(key: string, isValid: (x: unknown) => x is T): T | null {
  const raw = getRaw(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return (cached.value as T | null) ?? null;

  let value: T | null = null;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isValid(parsed)) value = parsed;
    } catch {
      /* corrupt → treat as absent */
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

function writeRecord(key: string, value: unknown) {
  setRaw(key, JSON.stringify(value));
  emit();
}
function removeRecord(key: string) {
  removeRaw(key);
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

export function isProgressRecord(x: unknown): x is ShadowTypingProgress {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 1 &&
    typeof o.consumed === "number" &&
    Number.isFinite(o.consumed) &&
    typeof o.contentHash === "string" &&
    typeof o.updatedAt === "number"
  );
}

export function isSettingsRecord(x: unknown): x is ShadowTypingSettings {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 1 &&
    typeof o.enabled === "boolean" &&
    (o.granularity === "word" || o.granularity === "sentence") &&
    typeof o.updatedAt === "number"
  );
}

function useStoredRecord<T>(key: string, isValid: (x: unknown) => x is T) {
  const value = useSyncExternalStore(
    (cb) => subscribe(cb),
    () => readRecord(key, isValid),
    () => null, // server snapshot — renders as absent until hydrated
  );
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return { value, hydrated };
}

export function useShadowProgress(sectionKey: string) {
  return useStoredRecord(sectionKey, isProgressRecord);
}

export function useShadowSettings(topicId: string) {
  return useStoredRecord(shadowSettingsKey(topicId), isSettingsRecord);
}

export function writeShadowSettings(
  topicId: string,
  enabled: boolean,
  granularity: ShadowTypingSettings["granularity"],
) {
  writeRecord(shadowSettingsKey(topicId), {
    v: 1,
    enabled,
    granularity,
    updatedAt: Date.now(),
  });
}

export function writeShadowProgress(
  sectionKey: string,
  progress: ShadowTypingProgress,
) {
  writeRecord(sectionKey, progress);
}
