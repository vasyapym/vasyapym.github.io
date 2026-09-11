# BRIEF — realm dive: system cursor stays hidden after the SPA handoff

Fresh context per relay — everything you need is here. **You have full autonomy over every design and code decision in this task** (fix mechanism, placement, shape) — make decisions and state them as decisions; do not ask for approval or ask questions; mark genuinely uncertain choices as assumptions. **Reply: condensed reasoning FIRST, then terse deliverable.**

## Reasoning protocol (do this before writing the deliverable)

Work through a full deliberation, then show it condensed (≤14 lines total):

1. **Success criterion** — one line: what does "fixed" mean for the owner moving the mouse after a dive.
2. **Alternatives** — ≥3 fix mechanisms (invent your own beyond: a one-frame body cursor repaint in the unmount cleanup; re-dispatching a synthetic mousemove/pointermove after unmount; an always-cursor'd shim element kept above the page during the handoff). For each: the tradeoff and its most likely failure mode.
3. **Choice** — which mechanism you commit to and the concrete reason it beats the others.
4. **Edge sweep** — all unmount paths (dive handoff, staged surface exit to landing, external-return exit, Strict-Mode double mount/replay); pointer stationary vs moving; touch devices (no system cursor — fix must be a no-op); the new realm remounting later must still hide the cursor inside the layer; reduced-motion path.
5. **Self-critique** — the two most likely ways your change breaks or fails to fix on a real Mac, and how your final diff covers them.

## Owner bug (verbatim)

> Desktop: Cursor disappears after clicking a project and only reappears on mouse move on the area of project description. Fix so cursor stays visible immediately after click. — meant for the deeper/realm mode only.

So: inside the realm (the immersive deep mode), clicking a project (creature → panel → "dive in", or double-click, or Enter) hands off to the project page — and the macOS system cursor stays INVISIBLE on the project page until the mouse happens to move over an area with its own cursor style. It must be visible the moment the project page appears, without any mouse move.

## Root-cause analysis (verified in the repo — verify the reasoning, you still own the fix call)

- The realm hides the system cursor BY DESIGN: `.realm-layer` and the two canvases `.realm-gl` / `.realm-overlay` carry `cursor: none` (the on-canvas lantern replaces the pointer). These are the ONLY `cursor: none` rules in the whole codebase.
- Dive commit path: the scene calls `onDiveCommit(id)` → `onOpenRef.current(id)` → the app swaps its route to the project page → `RealmMode` unmounts → React removes `.realm-layer` (a fixed, full-viewport element) in the same commit — while the pointer is usually STATIONARY (the user just clicked; no mousemove follows).
- Known Chromium/macOS behavior: when the element under a stationary pointer that had set `cursor: none` is removed from the DOM, the compositor keeps serving the cached hidden cursor until some later mousemove triggers a cursor re-evaluation. The owner sees the cursor return only when the mouse drifts onto an area whose cursor style differs (the project description area) — matching the report exactly.

## Facts you need

- SPA handoff: the realm layer unmounts under a stationary pointer in the SAME commit that mounts the project page; there is no guaranteed mousemove after.
- The layer is `position: fixed; inset: 0; z-index: 60` and carries `cursor: none`; its canvases repeat it.
- Unmount cleanup already does staged restoration (body scroll lock restore, gesture listeners, scene destroy) — your fix joins that cleanup, covering every teardown path uniformly (dive handoff, staged leave, external-return exit, Strict-Mode replay). A single mechanism at the unmount point is preferred over path-specific hacks.
- Touch devices have no system cursor; desktop-only symptom, but the fix must be harmless there.
- When the realm re-opens later it must still hide the cursor inside the layer — the layer's own CSS is untouched by any body-level fix.

## Verbatim current code

`realm.css` (do not change):

```css
.realm-layer {
  /* ... */
  cursor: none; /* the on-canvas lantern replaces the pointer */
  /* ... */
}
.realm-gl,
.realm-overlay {
  /* ... */
  cursor: none;
}
```

`RealmMode.tsx` — dive commit (context only):

```tsx
      onDiveCommit: (id) => {
        if (!alive) return;
        onOpenRef.current(id);       // SPA handoff; the realm unmounts naturally
      },
```

`RealmMode.tsx` — the main effect's unmount cleanup (your insertion point; insert where you judge right inside this cleanup, state where):

```tsx
    return () => {
      alive = false;
      stopDirectInput();
      cleanupLeaveGate();
      cleanupGestures();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      sideClearRef.current?.(); // r13: release any pending side-clear teardown

      // Already completed during a normal staged surface exit.
      // Still required for Strict Mode replay and other unmount paths.
      restoreLandingScroll();

      if (import.meta.env.DEV) {
        const realmWindow = window as Window & { __realmScene?: typeof scene; __r13?: unknown };
        if (realmWindow.__realmScene === scene) {
          delete realmWindow.__realmScene;
        }
        delete realmWindow.__r13;
      }
      scene.setLanternHold(false);

      try {
        // Idempotent: normally destroyed during invisible retirement.
        scene.destroy();
      } finally {
        try {
          audio.dispose();
        } finally {
          sceneRef.current = null;
          audioRef.current = null;
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

## Constraints

- Scope: `RealmMode.tsx` only (a small helper may live at module scope in the same file; no new files/deps). `realm.css` stays untouched unless you argue a strong reason.
- Minimal diff; must not alter any realm-open behavior, staged-exit choreography, scroll restoration, or timings.
- The fix must survive Strict-Mode double mount (cleanup runs on the replay mount too — make it idempotent and harmless).
- Comment style: this file documents its laws in dense lowercase comments — one short comment explaining WHY is welcome, in that voice.
- TypeScript strict; no `any` leaks.

## Deliverable (terse, after the reasoning)

1. `COMMITTED:` one line — the mechanism and the exact spot.
2. `BLOCKS:` each change as **verbatim current → verbatim replacement** (exact insertion anchored to the quoted cleanup lines; I paste them directly — be exact).
3. `GATES:` only if an existing probe gate must change (the realm probe drives enter/panel/dive/leave and asserts cleanup invariants; likely none).
4. `DEVICE CHECK:` one line for the owner (e.g. "dive into Explosion from the realm: cursor visible immediately on the project page, no mouse move needed").
