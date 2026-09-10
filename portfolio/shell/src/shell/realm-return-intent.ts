const REALM_RETURN_KEY = "portfolio.realm.return.v1";
const REALM_RETURN_VALUE = "deep";

let volatileIntent: boolean | undefined;

export function readRealmReturnIntent(): boolean {
  if (volatileIntent !== undefined) {
    return volatileIntent;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(REALM_RETURN_KEY) === REALM_RETURN_VALUE;
  } catch {
    return false;
  }
}

export function rememberRealmReturnIntent(): void {
  volatileIntent = true;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(REALM_RETURN_KEY, REALM_RETURN_VALUE);
  } catch {
    // Preserve SPA returns in memory when session storage is unavailable.
  }
}

export function clearRealmReturnIntent(): void {
  volatileIntent = false;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(REALM_RETURN_KEY);
  } catch {
    // Preserve surface intent in memory when session storage is unavailable.
  }
}
