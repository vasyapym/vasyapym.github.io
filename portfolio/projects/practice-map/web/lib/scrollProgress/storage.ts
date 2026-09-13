const PREFIX = "practice-map:scroll:v1:";

export const scrollProgressKey = (topicId: string) => `${PREFIX}${topicId}`;

const memoryFallback = new Map<string, string>();

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
    memoryFallback.set(key, raw);
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

interface ScrollProgressRecord {
  v: 1;
  scrollTop: number;
}

function isScrollProgressRecord(x: unknown): x is ScrollProgressRecord {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    r.v === 1 &&
    typeof r.scrollTop === "number" &&
    Number.isFinite(r.scrollTop) &&
    r.scrollTop >= 0
  );
}

export function readScrollProgress(topicId: string): ScrollProgressRecord | null {
  const raw = getRaw(scrollProgressKey(topicId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isScrollProgressRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeScrollProgress(topicId: string, scrollTop: number) {
  const record: ScrollProgressRecord = { v: 1, scrollTop };
  setRaw(scrollProgressKey(topicId), JSON.stringify(record));
}

export function removeScrollProgress(topicId: string) {
  removeRaw(scrollProgressKey(topicId));
}
