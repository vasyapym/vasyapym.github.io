// House kill-switch picker (quicknotes precedent): the landing root scrollbar
// treatment is chosen by ?bar=light|none|dark and persisted in localStorage so
// it survives reloads. The real iOS device can A/B all three in one round; the
// winner becomes the hard default in a follow-up pass.
//
//   light — color-scheme:light on the landing root -> native DARK indicator
//           (the pick: what "make it black" means for the native root overlay)
//   none  — no scheme override, no custom layer (matches Raft Cluster)
//   dark  — today's shipped P4 look (dark scheme + webkit thumb); safe degrade
export type ScrollBarTreatment = "light" | "none" | "dark";

const STORAGE_KEY = "shell:bar";
const QUERY_KEY = "bar";
const DEFAULT_TREATMENT: ScrollBarTreatment = "light";
const TREATMENTS: readonly ScrollBarTreatment[] = ["light", "none", "dark"];

function isTreatment(value: string | null): value is ScrollBarTreatment {
  return value !== null && (TREATMENTS as readonly string[]).includes(value);
}

// Resolution order: a valid ?bar= param wins and is persisted; otherwise the
// last persisted choice; otherwise the default. Storage/URL access is guarded
// so private-mode or SSR contexts fall back cleanly to the default.
export function resolveScrollBarTreatment(): ScrollBarTreatment {
  if (typeof window === "undefined") {
    return DEFAULT_TREATMENT;
  }

  let treatment: ScrollBarTreatment = DEFAULT_TREATMENT;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isTreatment(stored)) {
      treatment = stored;
    }
  } catch {
    /* storage unavailable: keep default */
  }

  try {
    const param = new URLSearchParams(window.location.search).get(QUERY_KEY);
    if (isTreatment(param)) {
      treatment = param;
      try {
        window.localStorage.setItem(STORAGE_KEY, param);
      } catch {
        /* storage write blocked: still honour the param this session */
      }
    }
  } catch {
    /* URL parse unavailable: keep resolved-so-far */
  }

  return treatment;
}
