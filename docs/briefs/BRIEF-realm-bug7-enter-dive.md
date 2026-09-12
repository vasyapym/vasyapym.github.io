# BRIEF-realm-bug7-enter-dive — Bug 7: Enter after selecting a project in realm mode opens nothing (macOS Safari)

You have **full autonomy** over the design and code choices in this task. Do not ask for approval and do not hedge with "if you prefer" options — decide, commit to a design, and deliver it in ONE response. What is required from you is depth: work through the reasoning protocol below and SHOW the deliberation, then deliver exact code edits.

---

## 1. The product and its interaction model (you cannot see the repo — this is all the context)

React 19 + TypeScript + Vite portfolio shell. The landing page offers an opt-in immersive layer — "the deep" (realm mode): a full-screen WebGL scene with 7 creatures, one per portfolio project. File of interest: `portfolio/shell/src/shell/RealmMode.tsx` (a single-file React component, ~1550 lines, heavily commented with `r<N>` round-laws — the comments are load-bearing documentation of past decisions; PRESERVE them).

Interaction contract (announced via `aria-live` to assistive tech):

```
"on the scene, press enter to dive in; press e or space for details; double-click a creature to dive in"
```

- Selecting a creature (single quick mouse click on it, key `e`/space with the scene layer focused, or a legend button "door — <title>") opens a project **panel** ("card"): close X button, eyebrow/title/description/tech chips, optional links, and a primary CTA `<button class="realm-panel-dive">dive in →</button>` that commits the dive.
- **Dive** = scene dive animation → `onDiveCommit(id)` → SPA route swap to `/projects/<id>/` (the realm unmounts).
- Escape closes an open panel (focus returns to the scene layer), or exits the realm when no panel is open.
- The scene layer (`.realm-layer`, `role="dialog"`, `aria-modal="true"`, `tabIndex={-1}`) is programmatically focused once the scene is active. A keydown handler on `window` (bound while the realm is mounted) owns the world-driving keys; a React `onKeyDown` on the layer element owns Escape and the Tab focus trap.
- The panel wrapper is **always mounted** with pinned geometry (a previous Safari flash-bug fix); an entrance `useLayoutEffect` toggles `is-open`/`inert`/`aria-hidden` and — once the opacity transition has finished (opacity ≥ 0.999, polled every 50 ms) — **auto-focuses the panel's close button** (`panelCloseRef.current.focus()`).

## 2. Confirmed diagnosis (verified by the integrating agent; trust it — do not re-derive it, but DO check your design against it)

Bug report: enter realm mode → click a project (mouse/trackpad) → press Enter → expected the project opens; actual: nothing happens. Some projects "work", others don't.

Reproduced headlessly (Playwright WebKit ≈ Safari engine, and Chromium) with an instrumented timeline. Engine laws confirmed:

- **Enter activates a focused `<button>`** in WebKit and Blink (native `click` fires).
- A **mouse click does NOT focus a `<button>`** in WebKit (activeElement stays where it was).
- A mouse click DOES focus a `tabIndex={-1}` div in WebKit.

App behavior timeline (both engines identical):

1. Click a project (legend button or creature) → panel opens → **~300 ms later the entrance effect auto-focuses the panel's CLOSE button**.
2. Enter pressed **after** that: the window keydown handler deliberately returns early for focused buttons ("controls entirely native"), so Enter natively activates the **close button → the panel CLOSES**. No dive, no route change. (On engines/situations where the native click doesn't fire, it is a pure no-op.) Either way: the project never opens.
3. Enter pressed **before** the close-focus lands (the first ~300 ms window): focus is still on the scene layer → the bare-layer Enter path dives `openIdRef.current ?? scene.nearestId()` → **project opens**.
4. After the panel has closed again, a second Enter dives only if the lantern happens to sit within `interactR` of a creature — observed to fail when the lantern parked away from the selected creature.

**Root cause:** the "press enter to dive in" contract is enforced only for `ev.target === layer` (bare layer). Once the panel opens and its entrance effect moves focus to the close button (~300 ms after every selection), Enter no longer dives — it closes the panel instead. The reported per-project asymmetry is timing/proximity variance (fast Enter before the focus lands works; slow Enter doesn't; the post-close recover path depends on where the lantern parked), not project identity.

## 3. The fix contract (every item must hold after your change)

1. **Deterministic dive:** with a project panel open, pressing Enter opens THAT project — regardless of whether the entrance auto-focus has landed yet, regardless of press timing, regardless of lantern position.
2. **No reliance on engine-native Enter→click activation.** Your mechanism must work in engines that fire `click` on Enter for focused buttons AND in engines that don't (belt-and-braces: if you also use native activation, add an explicit handler path and suppress the default so it can't double-fire).
3. **Escape still closes an open panel** and returns focus to the layer (existing law + existing probe gate).
4. **The close button stays fully operable** — mouse click closes (existing probe gate "r8 d2: open panel's close button stays native (click closes)"), and it stays reachable in the Tab order.
5. **Existing keyboard laws keep passing:** bare-layer Enter dives the nearest/open project; focused legend button + Enter opens its own panel; `e`/space still opens details; arrow keys / digit warps / mute unaffected; `Tab` trap behavior inside the panel unchanged in structure.
6. **A11y coherence:** whatever receives auto-focus on panel open must make sense for keyboard and screen-reader users (the panel is `role="document"`; think about what gets announced first and what the primary action is). If you change the auto-focus target, say so and justify it.
7. **Minimal diff.** Touch only `RealmMode.tsx` (and, if and only if your design requires it, nothing else). No new dependencies, no refactors, no drive-by cleanup. Do not remove or weaken existing comments; follow the file's comment style (`r<N>` law annotations) for anything you add. Do not change the persistent-panel entrance mechanics (is-open after two rAFs, opacity gate, rAF/timer teardown) beyond what your design requires.

## 4. Reasoning protocol (SHOW this in your answer, compactly but completely)

1. **Restate** the failure mechanism in your own words in ≤5 sentences, citing the evidence above.
2. **Enumerate the interaction matrix** your change touches: {Enter, Space, Escape, Tab, mouse} × {focus on layer / close button / dive button / link / legend button} × {panel open / closed} × {desktop / mobile}. For every cell that your change alters, state the new behavior.
3. **Design candidates:** enumerate at least 3 candidate mechanisms (e.g. redirect auto-focus; window-handler interception; some combination). For each: how it satisfies/violates each of the 7 contract items.
4. **Verdict:** pick one and justify why it beats the others.
5. **Self-check:** walk your chosen design against the evidence legs (slow Enter, fast Enter, post-close recover, Space, Escape, mobile bottom sheet) and confirm each behaves correctly.
6. **Diff review:** list every behavior change for inputs NOT named in the bug report (the "risk / side effects" section).

## 5. Output format (exact — the integrating agent will apply this mechanically)

```
## Reasoning
<the protocol steps 1–4, shown>

## Design
<the chosen mechanism, 3–6 sentences>

## Edits
<for each edit: the file, an "OLD" block quoted EXACTLY from the code below, and the "NEW" replacement block; old blocks must be unique substrings of the given code so they can be matched mechanically>

## Risks
<side effects; "none identified" only if you looked>
```

## 6. The code you may change (exact current source excerpts)

All edits must live inside these regions (or in the same file adjacent to them). Line numbers are from the current working tree.

### 6a. openProjectPanel / closePanel / confirmDive (lines 162–250)

```tsx
  // open a creature's panel from anywhere (pointer, key, or legend) — a11y core
  const openProjectPanel = useCallback((id: string) => {
    if (phaseRef.current !== "active") return;
    sceneRef.current?.setLanternHold(true);
    setOpenId(id);
    sceneRef.current?.startGreeting(id);
    audioRef.current?.greeting(id);
    // r13: recompose the view + pick the sheet side before the first paint
    sideClearRef.current?.();
    sideClearRef.current = null;
    setSide(sceneRef.current?.pickSide(id) ?? "right");
    sceneRef.current?.frameSelection(id);
  }, []);
  // latest-value ref so the empty-deps input effect can select without re-binding
  const openPanelRef = useRef(openProjectPanel);
  openPanelRef.current = openProjectPanel;

  const closePanel = useCallback(() => {
    resetDirectInputRef.current?.();
    sceneRef.current?.setLanternHold(false);
    sceneRef.current?.frameSelection(null); // camY stays where the frame left it
    panelStopRef.current?.(); // cancels entrance frames + delayed focus, hides now
    setOpenId(null);
    // clear the side attribute when the fade finishes (fallback timer covers a
    // missing transitionend); the wrapper itself is stationary — r9 law. The
    // whole teardown is cancellable so a rapid re-open cannot inherit it.
    const el = panelRef.current;
    if (el) {
      const cleanup = () => {
        window.clearTimeout(tid);
        el.removeEventListener("transitionend", onEnd);
        if (sideClearRef.current === cancel) sideClearRef.current = null;
        setSide(null);
      };
      const cancel = () => {
        window.clearTimeout(tid);
        el.removeEventListener("transitionend", onEnd);
        if (sideClearRef.current === cancel) sideClearRef.current = null;
      };
      const onEnd = (e: TransitionEvent) => {
        if (e.propertyName === "opacity" && !el.classList.contains("is-open")) {
          cleanup();
        }
      };
      const tid = setTimeout(cleanup, 300);
      el.addEventListener("transitionend", onEnd);
      sideClearRef.current = cancel;
    } else {
      setSide(null);
    }
    layerRef.current?.focus({ preventScroll: true }); // esc-chain step one returns focus to the layer
  }, []);
```

(confirmDive follows at lines 237–250; it sets phase "diving", clears the side, starts the scene dive + audio. You can read its shape from the keydown handler below — it is invoked as `confirmDiveRef.current(id)`.)

### 6b. The window keydown handler (lines 1045–1103)

```tsx
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return; // never hijack shortcuts
      const k = ev.key.toLowerCase();

      // Keyboard interaction ends any pending mouse double-click opportunity.
      resetDirectInput();

      // Exact bare-layer targeting leaves buttons, links, and other focused
      // controls entirely native, including legend Enter/Space activation.
      if (
        k === "enter" &&
        ev.target === layer &&
        desktopFine.matches
      ) {
        ev.preventDefault();
        if (ev.repeat || phaseRef.current !== "active") return;

        tryResume();
        const id = openIdRef.current ?? scene.nearestId();
        if (id) confirmDiveRef.current(id);
        return;
      }

      // escape is owned by the layer's onKeyDown (esc-chain with focus order);
      // don't drive the world while a panel is focused, except escape
      if (openIdRef.current) return;

      if (k in DIR) {
        ev.preventDefault();
        tryResume();
        const [x, y] = DIR[k];
        scene.setThrust(x, y);
        return;
      }
      if (k >= "1" && k <= "7") {
        ev.preventDefault();
        tryResume();
        const idx = Number(k) - 1;
        scene.warpTo(idx);
        scene.setPointer(0, 0, false); // stop the mouse yanking the camera back
        return;
      }
      if (k === "e" || k === "enter" || k === " " || ev.key === " ") {
        // a focused button/link owns its own Enter/Space — the native click on a
        // legend button must open THAT project, never the nearest creature.
        const t = ev.target;
        if (t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement) return;
        ev.preventDefault();
        tryResume();
        const id = scene.nearestId();
        if (id) openPanelRef.current(id);
        return;
      }
      if (k === "m") {
        ev.preventDefault();
        toggleMute();
        return;
      }
    };
```

### 6c. Panel entrance effect — the delayed focus (lines 1257–1288)

```tsx
    const focusWhenFinished = () => {
      clearFocusTimer();

      if (
        stopped ||
        focused ||
        document.hidden ||
        !panel.isConnected ||
        !panel.classList.contains("is-open")
      ) {
        return;
      }

      // a delayed/backgrounded transition must not cause premature focus.
      const opacity = Number.parseFloat(window.getComputedStyle(panel).opacity);
      if (!Number.isFinite(opacity) || opacity < 0.999) {
        focusTimer = window.setTimeout(focusWhenFinished, 50);
        return;
      }

      const closeButton = panelCloseRef.current;
      if (!closeButton?.isConnected) return;

      focused = true;
      closeButton.focus({ preventScroll: true });
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === panel && event.propertyName === "opacity") {
        focusWhenFinished();
      }
    };
```

### 6d. Panel entrance effect — the is-open commit (lines 1318–1356)

```tsx
    if (panelRequested) {
      cancelRealmGestureRef.current?.();

      panel.addEventListener("transitionend", onTransitionEnd);
      document.addEventListener("visibilitychange", onVisibilityChange);

      firstFrame = window.requestAnimationFrame(() => {
        firstFrame = undefined;
        if (stopped) return;

        secondFrame = window.requestAnimationFrame(() => {
          secondFrame = undefined;
          if (stopped || phaseRef.current !== "active") return;

          panel.removeAttribute("inert");
          panel.removeAttribute("aria-hidden");
          panel.classList.add("is-open");

          // reading computed timing also resolves the newly applied transition.
          const duration = opacityTransitionMs(panel);

          if (duration === 0) {
            focusWhenFinished();
          } else {
            // transitionend is primary; this covers missing/cancelled events.
            focusTimer = window.setTimeout(focusWhenFinished, duration + 80);
          }
        });
      });
    }

    return () => {
      stop();
      if (panelStopRef.current === stop) panelStopRef.current = null;
    };
  }, [panelRequested, requestedPanelId]);
```

### 6e. Layer-level React onKeyDown — Escape + Tab trap (lines 1371–1384; the Tab trap follows and must keep working unchanged)

```tsx
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation(); // the window keydown must not double-fire

          if (phaseRef.current === "diving" || phase === "leaving") return;

          if (openId) {
            closePanel();
          } else {
            doLeave(); // surface
          }
          return;
        }

        if (event.key !== "Tab" || phase === "leaving") return;
```

(The Tab trap then collects all focusable controls inside the layer via
`querySelectorAll('a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]')`
and wraps focus between first and last. Any focus-target change must remain coherent with this list.)

### 6f. Panel JSX (lines 1487–1546)

```tsx
      {/* persistent panel: wrapper always mounted with pinned geometry;
          content is conditional; inert/aria-hidden/is-open are owned by the
          entrance layout effect, never by React state on this wrapper. */}
      <div ref={panelRef} className="realm-panel" role="document" data-side={side ?? undefined}>
        {opened && phase !== "leaving" ? (
          <button
            ref={panelCloseRef}
            type="button"
            className="realm-panel-close"
            aria-label="close"
            onClick={closePanel}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="butt"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M4 4L12 12M12 4L4 12" />
            </svg>
          </button>
        ) : null}
        {opened ? (
          <div key={opened.id} className="realm-panel-body">
            <p className="realm-panel-eyebrow">{opened.eyebrow}</p>
            <h2 className="realm-panel-title">{opened.title}</h2>
            <p className="realm-panel-desc">{opened.description}</p>
            <ul className="realm-panel-tech">
              {opened.technologies.map((t) => (
                <li key={t} className="realm-panel-chip">{t}</li>
              ))}
            </ul>
            {opened.links && opened.links.length > 0 ? (
              <div className="realm-panel-links">
                {opened.links.map((l) =>
                  l.external ? (
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="realm-panel-link">
                      {l.label}
                    </a>
                  ) : (
                    <a key={l.href} href={l.href} className="realm-panel-link">{l.label}</a>
                  ),
                )}
              </div>
            ) : null}
            <button
              type="button"
              className="realm-panel-dive"
              onClick={() => confirmDive(opened.id)}
            >
              dive in →
            </button>
          </div>
        ) : null}
      </div>
```

### 6g. Refs declared nearby (lines 103–112) — extend consistently if you add a ref

```tsx
  const panelCloseRef = useRef<HTMLButtonElement | null>(null);
  ...
  const panelStopRef = useRef<(() => void) | null>(null);
```

---

## 6. What the integrating agent owns (NOT you)

History search, reproduction, the regression gate (a new probe gate asserting: select a project with a real mouse click → wait for the entrance auto-focus → press Enter → the SPA route to that project follows), verification runs, and recording. Do not attempt to write tests yourself; deliver only the fix design + edits. If your design implies an additional probe assertion worth making, DESCRIBE it in one or two sentences under `## Risks` — do not write test code.
