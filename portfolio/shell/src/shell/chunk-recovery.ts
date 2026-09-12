// chunk-recovery.ts — self-healing for lazy-chunk load failures.
// A failed dynamic import poisons the module map for the document's lifetime
// (a same-URL retry can never recover), and WebKit reports the failure as the
// bare "Importing a module script failed" that the project crash page shows.
// The one reliable recovery is a full reload: fresh index.html picks up the
// current deploy's hashes and resets the module map. Vite routes every
// preload-assisted dynamic import failure through `vite:preloadError`, so one
// global listener covers all lazy boundaries (project pages, directions,
// prototype comparisons, and the nested ink/fault imports inside explosion).
// The reload fires at most once per tab session: while a deploy is genuinely
// broken, repeating it would loop; the crash page keeps the manual route.

const RECOVERY_FLAG = "chunk-recovery";

export function installChunkRecovery(): void {
  if (typeof window === "undefined") return;

  let spent = false;
  window.addEventListener("vite:preloadError", (event) => {
    if (spent) return;
    spent = true;

    try {
      if (sessionStorage.getItem(RECOVERY_FLAG) === "1") return;
      sessionStorage.setItem(RECOVERY_FLAG, "1");
    } catch {
      // private-mode storage denials still get the in-memory one-shot.
    }

    event.preventDefault();
    window.location.reload();
  });
}
