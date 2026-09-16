# Passes — menu-return-scroll (shell)

## Pass C001 — VERIFIED
- Objective and scope: navigating back to the main menu from a project
  (the frame's "← Vasily Argounov" button) restores the catalogue scroll
  offset the visitor left, mirroring the r16 realm-return intent contract;
  every other path (direct project boot, realm exits, no-intent backs)
  keeps the previous top-of-page behaviour.
- Acceptance criteria:
  - Opening a project captures the landing's offset (sessionStorage-backed
    intent, volatile fallback).
  - The back button restores it before first paint, clamped to the
    document, and consumes the intent (single-shot).
  - Realm chains are untouched: the chained dive must not capture a plain
    intent, and the restored-realm landing must not double-drive scroll.
- Changes:
  - `shell/src/shell/project-return-intent.ts` — new intent module
    (volatile + sessionStorage, same shape as realm-return-intent).
  - `shell/src/App.tsx` — `openProject` captures `window.scrollY` before
    the top-reset (guarded against active realm chains); `goHome` scrolls
    to top BEFORE the pushState in all cases (pins the fresh history
    entry) and lets the landing's mount effect restore when an intent
    exists.
  - `shell/src/shell/LandingPage.tsx` — mount `useLayoutEffect` consumes
    the intent (clamp + instant scroll, skipped for `externalRealmOpen`).
  - `shell/tests/menu-return-scroll-probe.mjs` — new acceptance probe.
- Baseline: pre-fix probe run (shell changes stashed) — "back restores the
  catalogue offset" FAILED (back landed at scrollY=0, expected ≈1907);
  "no-intent back lands at top" passed.
- Verification:
  - Command: `npm run typecheck` (portfolio) — PASS, exit 0.
  - Command: `CHROME_PATH=… node portfolio/shell/tests/menu-return-scroll-probe.mjs`
    — PASS post-fix: opened at top, back restores the catalogue offset,
    no-intent back lands at top.
  - Same probe on the pre-fix tree (git stash push of App/LandingPage) —
    FAIL as designed (drift 1907px), then stash pop restored the fix.
- Final diff review: shell diffs contain only this change; goHome keeps a
  pre-push top-reset so browser-native back/forward never inherit the
  project page's scroll.
- Design constraints: no design-ledger entries govern the plain back
  flow; the r15/r11 focus-rescue logic is untouched (only realm exits set
  `realmRestoreFocusRef`).
- Remaining risks/blockers: browser back/forward buttons rely on the
  native `history.scrollRestoration` for their own entries — out of
  scope for the button flow tested here.
- Next action: task complete pending delivery commit.

## Pass C002 — VERIFIED
- Objective and scope: the project-card entrance choreography (gem-reveal
  keyframe + stagger) does not play on a landing mounted from a project
  return — the catalogue shows settled, including rows below the viewport;
  every other mount (fresh load, hash links, realm exits) keeps the reveal.
- Acceptance criteria:
  - On a return mount every `[data-project-reveal]` card carries
    `is-revealed` immediately, and the entrance keyframe never runs.
  - A fresh landing still plays `gem-reveal` on in-view cards (control).
- Changes:
  - `shell/src/shell/LandingPage.tsx` — `returnVisitRef` seeded during
    render (pre-consumption of the intent); the `revealedProjects`
    initializer pre-reveals every card at delay 0 on a return mount; the
    reveal effect adds `signal-index-reveal-instant` and skips the
    sweep/IO machinery; section reveals still live on every mount.
  - `shell/src/styles.css` — new instant rule inside the
    no-preference motion gate: `.signal-index-reveal-ready.signal-index-
    reveal-instant .signal-index-card.is-revealed { animation: none }` —
    mutes only the entrance keyframe, leaves the hover lift untouched.
  - `shell/tests/menu-return-scroll-probe.mjs` — two new assertions
    (settled cards + no keyframe) and a fresh-load control scenario.
- Baseline: probe run on the pre-fix tree (LandingPage + styles stashed):
  "return mount: every card settled" FAILED (4 cards un-revealed, no
  instant class) — the entrance choreography was live on return.
- Verification:
  - Command: `npx tsc --noEmit` (shell) — PASS, exit 0.
  - Command: `CHROME_PATH=… node portfolio/shell/tests/menu-return-scroll-probe.mjs`
    — PASS post-fix: 6/6 checks (restored offset, settled mount, no
    keyframe, no-intent top, fresh-load keyframe control).
- Final diff review: no debug scaffolding; the instant class only mutes
  the card keyframe; hero-exit, section hairlines and the artwork breathe
  are untouched.
- Design constraints: not applicable (no ledger entries govern the reveal).
- Remaining risks/blockers: none identified; below-viewport rows revealed
  without animation on a return visit is the declared behaviour.
- Next action: task complete pending delivery commit.
