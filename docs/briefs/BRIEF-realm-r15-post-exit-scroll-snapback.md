# BRIEF — realm: post-exit scroll snaps back (threshold path only)

Fresh context per relay. **Full autonomy on the fix** — decide, state it, no questions. **Reply: condensed reasoning first (≤14 lines), then terse deliverable.**

## Reasoning protocol (before the deliverable)

1. Root cause — the snap-back mechanism + why the chip path escapes it; if several candidates, rank them.
2. ≥3 fix directions, each with its failure mode.
3. Committed choice + why it beats the others.
4. Edge sweep: exit during fade (wheel must keep working mid-fade); fast enter→exit (<1.05s flood); Strict-Mode replay; watchdog path; deep-dive SPA unmount; r12 App-owned return; Windows-Edge scrollbar-gutter shift (unlock intentionally happens beneath the opaque veil); iOS fixed-body quirks; r10 gates below stay green or are re-authored on purpose.
5. Self-critique — two most likely real-device failures of your diff + how it covers them.

## Owner bug (verbatim)

> "when you enter the deep mode via 'the same work, beneath the surface' and exit it and scroll you go back to the same place when you were before scrolling. but when you click 'enter the deep' button which is at the bottom right (which appears when you scroll down) it doesn't have that. you can scroll freely."

Every device/browser. Post-exit scroll attempts revert to the exit-time position ("scrolls, then snaps back"; owner: "seems like fixed position when you exit"). Plain enter→exit, no project dive. Chip path (fixed bottom-right, visible once past the threshold section) is unaffected.

## Facts (you cannot see the repo)

- Both entry controls open the SAME `<RealmMode>`; only the entry coordinates differ. No per-path code fork.
- Mount: capture `window.scrollY` → lock `body{position:fixed; top:-scrollY; width:100%; overflow:hidden}`. Exit staged: doLeave/Esc → `leaveGate.begin()` → **restore first, beneath the still-opaque veil** → ~0.9s fade (wheel deliberately NOT cancelled mid-fade) → canvas retirement → React unmount → cleanup calls the restore again (fallback).
- React 19 DEV Strict Mode: the mount effect's cleanup fires once mid-life and re-runs — restore runs twice with separate latches; setup #2 re-locks.
- Headless-Chromium evidence: mid-realm ~1.3s after entry the document scroll offset collapsed y→0 with NO programmatic call (browser clamps the scroller while the body is out of flow; the fixed body's negative `top` keeps the visual). Exit restore re-set the captured y. Post-exit wheel scrolled free headless — the snap-back did NOT reproduce headless: it lives in a real-device race/timing.
- r10 probe gates pinning the current law: scroll exact at unlock beneath the opaque veil; wheel not cancelled during the exit fade; no unlocked stage in exit staging; landing scroll restored (post-exit ≈ entry y); chip is back; threshold-focus gates.

## Verbatim code (RealmMode.tsx)

```tsx
let landingScrollRestored = false; // latch is per effect-instance

// sole body/scroll restoration implementation; normal exit calls it between
// rendering stages, effect cleanup calls it as the fallback for every teardown
const restoreLandingScroll = (): void => {
  if (landingScrollRestored) return;
  landingScrollRestored = true;

  document.body.style.position = prev.position;
  document.body.style.top = prev.top;
  document.body.style.width = prev.width;
  document.body.style.overflow = prev.overflow;
  window.scrollTo({ top: scrollY, behavior: "instant" });
};

// same mount effect, right before the lock:
const scrollY = window.scrollY;
const prev = {
  position: document.body.style.position,
  top: document.body.style.top,
  width: document.body.style.width,
  overflow: document.body.style.overflow,
};
document.body.style.position = "fixed";
document.body.style.top = `-${scrollY}px`;
document.body.style.width = "100%";
document.body.style.overflow = "hidden";
```

`begin()` calls `restoreLandingScroll()` as its first action, then starts the fade; the mount-effect cleanup calls `restoreLandingScroll()` again at unmount.

## Constraints

- r10 law stays: unlock ONCE beneath the opaque veil; wheel/touch works from fade frame one; no unlocked→relocked stage; no visual jump.
- Chip path must not regress; threshold path must match it. Keep the staged exit architecture.
- Scope: `RealmMode.tsx` (`LandingPage.tsx` only if the fix needs it); no new files/deps.

## Deliverable (terse)

1. `ROOT CAUSE:` one line.
2. `COMMITTED:` one line.
3. `BLOCKS:` verbatim current → verbatim replacement (TSX, minimal, drop-in — I paste directly).
4. `GATES:` which r10 gate bodies change (if any) + one new gate to pin the fix (name + one-line body sketch).
5. `DEVICE CHECK:` one line.
