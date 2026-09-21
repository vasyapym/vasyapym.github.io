import { useSyncExternalStore } from "react";
import type { FreeHiddenExamples, FreeReadingSettings, FreeReadingText } from "./types";

const PREFIX = "practice-map:free:v2:";

export const freeSettingsKey = (topicId: string) => `${PREFIX}${topicId}`;
export const freeSectionKey = (topicId: string, sectionIndex: number) =>
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

// A module-level wrapper keeps the reference stable across renders, so
// useSyncExternalStore doesn't unsubscribe/resubscribe on every render.
const stableSubscribe = (cb: () => void) => subscribe(cb);

export function isHiddenExamplesRecord(x: unknown): x is FreeHiddenExamples {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 1 &&
    Array.isArray(o.hidden) &&
    o.hidden.every((n) => typeof n === "number")
  );
}

export function isSettingsRecord(x: unknown): x is FreeReadingSettings {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 2 &&
    typeof o.enabled === "boolean" &&
    typeof o.updatedAt === "number"
  );
}

export function isTextRecord(x: unknown): x is FreeReadingText {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 2 &&
    typeof o.contentHash === "string" &&
    typeof o.text === "string" &&
    (o.completed === undefined || typeof o.completed === "boolean") &&
    typeof o.updatedAt === "number"
  );
}

function useStoredRecord<T>(key: string, isValid: (x: unknown) => x is T) {
  const value = useSyncExternalStore(
    stableSubscribe,
    () => readRecord(key, isValid),
    () => null, // server snapshot — renders as absent until hydrated
  );
  const hydrated = useSyncExternalStore(stableSubscribe, () => true, () => false);
  return { value, hydrated };
}

export function useFreeText(sectionKey: string) {
  return useStoredRecord(sectionKey, isTextRecord);
}

export function useFreeSettings(topicId: string) {
  return useStoredRecord(freeSettingsKey(topicId), isSettingsRecord);
}

export function writeFreeSettings(topicId: string, enabled: boolean) {
  writeRecord(freeSettingsKey(topicId), {
    v: 2,
    enabled,
    updatedAt: Date.now(),
  });
}

export function writeFreeText(
  sectionKey: string,
  record: FreeReadingText,
) {
  writeRecord(sectionKey, record);
}

export function removeFreeText(sectionKey: string) {
  removeRecord(sectionKey);
}

export function useHiddenExamples(sectionKey: string) {
  return useStoredRecord(`${sectionKey}:examples`, isHiddenExamplesRecord);
}

export function writeHiddenExamples(
  sectionKey: string,
  hidden: readonly number[],
) {
  writeRecord(`${sectionKey}:examples`, { v: 1, hidden });
}

export function removeHiddenExamples(sectionKey: string) {
  removeRecord(`${sectionKey}:examples`);
}
