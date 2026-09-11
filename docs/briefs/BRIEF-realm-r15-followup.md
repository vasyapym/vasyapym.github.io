# BRIEF — r15 follow-up: exact drop-in blocks (scroll-freedom fix)

Fresh context. Root cause confirmed against the real code: the plain `.focus()` calls ALREADY use `{ preventScroll: true }` — the snap is your **fallback branch**: when the activator isn't fully in the viewport, the effect runs `scrollIntoView` ~1.1s after exit press (fade 0.9s + settle + 2 rAFs) — AFTER the veil clears, so it yanks the user back mid-scroll. Chip path: fixed → always usable → never trips it. Matches the owner symptom exactly.

**Refined law (decided; refine the implementation freely):** the r11 invisible-tab rescue (scrollIntoView) must fire ONLY when the user hasn't scrolled since the exit restore; once they've moved the viewport, focus must never scroll — `{ preventScroll: true }` only.

## Verbatim code (LandingPage.tsx)

Entry handler (add a pre-lock scroll snapshot here):

```tsx
  const handleRealmEnter = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const control = event.currentTarget;
    const rect = control.getBoundingClientRect();
    realmActivatorRef.current = control;
    realmRestoreFocusRef.current = false;
    // Read before React hides/inerts either entry control.
    setRealmEntry({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setRealmOpen(true);
  }, []);
```

The focus-restore effect (the fallback scrollIntoView is the snap):

```tsx
  useEffect(() => {
    if (realmOpen || !realmRestoreFocusRef.current) return;

    let secondFrame = 0;
    // Wait for RealmMode's cleanup, scroll restoration, and the strip's
    // geometry update before deciding which control can accept focus.
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (!realmRestoreFocusRef.current) return;
        realmRestoreFocusRef.current = false;

        const activated = realmActivatorRef.current;
        const rect = activated?.getBoundingClientRect();
        const usable = activated?.isConnected &&
          !activated.disabled &&
          !activated.closest('[inert], [aria-hidden="true"]') &&
          getComputedStyle(activated).visibility === "visible" &&
          rect && rect.width > 0 && rect.height > 0 &&
          rect.top >= 0 && rect.bottom <= window.innerHeight &&
          rect.left >= 0 && rect.right <= window.innerWidth;

        if (usable && activated) {
          activated.focus({ preventScroll: true });
          return;
        }

        // A resize or changed scroll position may have hidden the strip.
        // The in-flow entry is the stable fallback, never an invisible tab.
        const fallback = realmSectionEnterRef.current;
        if (fallback) {
          fallback.scrollIntoView({ block: "center", behavior: "instant" });
          fallback.focus({ preventScroll: true });
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== 0) window.cancelAnimationFrame(secondFrame);
    };
  }, [realmOpen]);
```

(`realmActivatorRef`, `realmRestoreFocusRef`, `realmSectionEnterRef` already exist as refs. Other `.focus()` sites are on fixed realm chrome — out of scope.)

## Deliverable (terse)

1. `COMMITTED:` one line.
2. `BLOCKS:` verbatim current → verbatim replacement (TSX, minimal, drop-in). Include the ref declaration + the entry-handler snapshot + the effect. Honor the decided law: user-scrolled ⇒ never scrollIntoView; untouched viewport ⇒ keep the r11 rescue.
3. `GATES:` body for the new "threshold exit scroll freedom" gate (wheel during fade → final scrollY stays at the user-scrolled offset; also assert NO scrollIntoView when the user scrolled and the activator left the viewport).
4. `DEVICE CHECK:` one line.
