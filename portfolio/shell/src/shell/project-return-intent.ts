// Return-intent for the plain project flow: when the landing opens a
// project, the landing's scroll offset is remembered so that the "← Vasily
// Argounov" back button can restore the visitor to the very catalogue row
// they left — the same contract the realm mode already honors via its own
// intent (r16). One slot per session, consumed on the return trip.

const INTENT_KEY = "portfolio.project.return.v1";

interface ProjectReturnData {
  type: "landing";
  scrollY?: number;
  path?: string; // the route the visitor came from ("/" = the catalogue)
  // The landing's own offset, carried through an about detour ("/about" path
  // only): when the roundtrip later exits the about page, the landing still
  // rescues the catalogue offset this tab left it at.
  landingScrollY?: number;
}

let volatileIntent: ProjectReturnData | null = null;

function resolveIntent(): ProjectReturnData | null {
  if (volatileIntent) return volatileIntent;

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && (parsed as ProjectReturnData).type === "landing"
      ? (parsed as ProjectReturnData)
      : null;
  } catch {
    return null;
  }
}

export function rememberProjectReturnIntent(
  scrollY?: number,
  path: string = "/",
  landingScrollY?: number,
): void {
  const data: ProjectReturnData = {
    type: "landing",
    ...(scrollY != null ? { scrollY } : {}),
    ...(path !== "/" ? { path } : {}),
    ...(landingScrollY != null ? { landingScrollY } : {}),
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

export function readProjectReturnScrollY(): number | undefined {
  return resolveIntent()?.scrollY;
}

export function readProjectReturnPath(): string {
  return resolveIntent()?.path ?? "/";
}

// The landing offset carried through an about detour; null when absent.
export function readProjectReturnLandingScrollY(): number | null {
  const landingScrollY = resolveIntent()?.landingScrollY;
  return typeof landingScrollY === "number" ? landingScrollY : null;
}

export function clearProjectReturnIntent(): void {
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
