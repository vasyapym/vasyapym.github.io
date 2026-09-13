# Passes — lesson scroll progress (chat-model relay, integrated)

## Pass C001 — VERIFIED (typecheck scope)
- Objective and scope: save each lesson's scroll position per topic id in localStorage (versioned record, own `practice-map:scroll:v1:` namespace, same memory-fallback pattern as free reading) and restore it on reopen — after close or full reload — before first paint, with no visible jump.
- Acceptance criteria: persist per topic; reopen lands at saved position without top-then-flight or post-paint jolt; no record → top; non-scrollable (max ≤ 4) lessons neither save nor restore; out-of-range clamps to max; corrupt/absent degrade silently to top; restored position reflected in progress bar AND deep-lesson active section chip; scroll-to-top removes the record; no regressions to progress bar/scrollspy/keyboard nav/body lock/free reading/goToSection.
- Changes:
  - Added `web/lib/scrollProgress/storage.ts` — `{ v: 1, scrollTop }` record, type guard (`Number.isFinite`, `>= 0`), safe get/set/remove with in-memory fallback (quota/private mode).
  - `web/PracticeMapPage.tsx` LessonOverlay: `saveTimerRef`/`pendingScrollTopRef`; `scheduleScrollSave` (300 ms debounce, skips max ≤ 4); `flushScrollSave` (pending < 1 → removeRecord — mirrors free-reading pristine cleanup); `handleScroll` = `updateProgress` + save scheduling, wired to `onScroll`; restore `useLayoutEffect` (pre-paint: sets `scrollTop` clamped to max, progress bar inline, and for deep lessons recomputes the active section via the same probe-point formula against a direct `[data-section-index]` query — IntersectionObserver hasn't populated `sectionTargetsRef` yet — setting both `sectionIndexRef.current` and `setSectionIndex` before paint); flush effect with `visibilitychange → hidden` + `beforeunload` listeners and full cleanup.
- Baseline: typecheck PASS before edits; browser check self-skips in this environment (no Chrome/Chromium — same environmental limitation recorded in free-reading-salvage C001/C002).
- Verification:
  - Command: `npm run typecheck` (portfolio root → shell)
    Result: PASS, exit 0.
  - Command: `node projects/practice-map/tests/practice-map.check.mjs`
    Result: NOT RUN — environment has no Chrome/Chromium; check exits gracefully with "no Chrome/Chromium found — skipping" (exit 0).
- Chat-model deliberation (brief §4 was the grading axis): full Reasoning delivered — ≥2 alternatives each for store (absolute px chosen over ratio/section+offset), save cadence (debounce+flush points over per-event writes), restore timing (useLayoutEffect over post-paint instant/smooth scroll); 12 failure modes enumerated incl. clamp-then-resave, StrictMode double-mount, programmatic-scroll echo after restore, scrollspy pre-observer state, multi-tab last-writer-wins; 5 invariants stated; self-review table vs all 9 ACs.
- Final diff review: performed — 87 insertions/1 change in PracticeMapPage.tsx + new storage module; new hooks sit before the `if (!lesson && !deep)` early return (stable hook order); no debug scaffolding, no secrets, unrelated files untouched.
- Design constraints: owner's "same approach as before" honored (versioned record + memory fallback mirroring `freeReading/storage.ts`); namespace isolation from `practice-map:free:v2:`.
- Remaining risks/blockers:
  - Browser verification (restore round-trip, chip sync, no-jump assertion) NOT RUN — needs a Chrome-capable environment; the check suite is the ready-made vehicle.
  - Minor: absolute-px records drift if the viewport width changes between sessions (clamped; accepted, argued in the model's Reasoning).
- Next action: real-browser verification round when Chrome tooling is available; otherwise task-level close with typecheck as the executed gate.
