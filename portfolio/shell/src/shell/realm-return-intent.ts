const INTENT_KEY = "portfolio.realm.return.v1";

interface RealmReturnData {
  type: "deep";
  scrollY?: number;
}

let volatileIntent: RealmReturnData | null = null;

function resolveIntent(): RealmReturnData | null {
  if (volatileIntent) return volatileIntent;

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    // Backward compat: the pre-r16 format stored the bare string "deep".
    if (raw === "deep") return { type: "deep" };
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && (parsed as RealmReturnData).type === "deep"
      ? (parsed as RealmReturnData)
      : null;
  } catch {
    return null;
  }
}

export function rememberRealmReturnIntent(scrollY?: number): void {
  const data: RealmReturnData = {
    type: "deep",
    ...(scrollY != null ? { scrollY } : {}),
  };
  volatileIntent = data;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(INTENT_KEY, JSON.stringify(data));
  } catch {
    // Preserve SPA returns in memory when session storage is unavailable.
  }
}

export function readRealmReturnIntent(): boolean {
  return resolveIntent()?.type === "deep";
}

export function readRealmReturnScrollY(): number | undefined {
  return resolveIntent()?.scrollY;
}

export function clearRealmReturnIntent(): void {
  volatileIntent = null;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(INTENT_KEY);
  } catch {
    // Preserve surface intent in memory when session storage is unavailable.
  }
}
