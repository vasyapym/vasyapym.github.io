# BRIEF — realm r8, deliverable D2: deep round (direct dive + iOS close X)

Relay brief for the chat model. You have **full design and code autonomy** inside the
pinned contract below — no approval gates, no clarifying questions. Commit to one
design and one set of code blocks. The only thing we require is that your reasoning is
shown in full before the deliverable, at the depth specified in §3 — for each of the
two problems separately.

---

## 1. Situation

The landing page (`portfolio/shell`) has "the deep" — an opt-in immersive realm
(`RealmMode.tsx`) over an ink-toned catalogue. Seven creatures swim in a GPU-fluid
abyss; each maps to a project. Interaction contract today:

- a quick click/tap on a creature's body opens that creature's **panel** (a
  persistent right sheet on desktop, a bottom sheet ≤520px) showing eyebrow, title,
  description, tech chips, links and a **"dive in →"** button;
- the dive button calls `confirmDive(id)`: cancels any in-flight gesture, phase →
  `diving`, the scene runs a hue iris that grows to full cover, then the SPA hands
  off to the project page (`onDiveCommit` → `onOpenProject(id)`), and the realm
  unmounts;
- keyboard: the layer takes focus on entry; `esc` chain (panel → layer → surface);
  wasd/arrows thrust; `1..7` warp; `e`/`enter`/`space` on the **bare layer** opens
  the nearest creature's panel (a focused button/link keeps its native Enter/Space);
  `m` mute. An `aria-live` region announces the nearest creature as
  `"<title> — press enter to open"`;
- a legend of 7 door buttons (bottom-left; a swipeable strip ≤520px) opens any
  creature's panel from the keyboard.

### Item A — a faster, more direct way in (owner report)

> "In deep mode, allow double-click or Enter key to open a project directly in
> desktop. Currently the user must first select a project, then move the cursor to
> the 'dive in' button and click it — the button can end up positioned away from the
> selection, adding unnecessary friction. The goal is a faster, more direct way in."

Interpretation: "open a project directly" = the full dive (iris + SPA handoff to the
project page), skipping the panel step. The panel path stays for those who want the
description first. Scope is **desktop** (fine pointers); touch behaviour stays
exactly as shipped (tap = select → panel).

Mechanical context you must design against:

- The gesture machinery (§5A) is a deliberate-gesture state machine on plain locals:
  pointer-down reserves a creature (`downPick`) via `scene.pickAt`, movement beyond a
  small allowance promotes the press to travel+calling, and a quick release
  (`!moved && !holding && < SELECT_MS`) with a pick opens the panel. Empty-space
  quick releases (`downPick === null && quick`) re-open the last reserved pick.
- The panel entrance is asynchronous: the wrapper is always mounted with pinned
  geometry; `is-open` (which turns `pointer-events: auto` on) is added after two
  animation frames, and the opacity transition runs 280ms. So the **second click of a
  fast double-click can straddle the moment the panel becomes pointer-immune** — a
  click landing on the panel element is `overChrome` and dies. A double-click whose
  creature sits inside the panel's area must not be swallowed by the just-opened
  sheet; a double-click elsewhere must not be blocked by it either.
- Native `dblclick` fires only for mouse double-clicks on most platforms; touch
  double-tap behaviour is platform-inconsistent. Whatever mechanism you choose must
  hold on both counts and stay deterministic.

### Item B — iOS Safari: the close "X" that will not hide (owner report)

> "On Safari iOS in deep mode: the close 'X' button remains visible on project
> descriptions when it should be hidden. This appears to be a platform-specific bug —
> verify and fix."

Mechanism context: the panel wrapper (`.realm-panel`) is **always mounted** with
pinned final geometry (the r5 anti-flash law); when no project is open it is hidden
via `opacity: 0; visibility: hidden; pointer-events: none` and an entrance effect
toggles `is-open` after two animation frames (the 280ms opacity transition then
plays; only then is the close button focused). The close button is rendered
**outside** the content conditional — it exists even when the panel is closed and
relies entirely on the wrapper's closed state for its invisibility.

Platform context: the panel is `overflow-y: auto` with `overscroll-behavior:
contain`. iOS WebKit promotes overflow-scrolled boxes into composited scrolling
layers, and positioned children inside such layers have a documented history of
painting despite an ancestor's `visibility: hidden`/`opacity: 0`. The harness here
has no WebKit driver, so iOS rendering cannot be verified from this machine — the
owner re-checks on a real device. Your fix must therefore be **structural**: the
button must not exist as a paintable box at all while the panel is closed, on any
platform, rather than depending on ancestor visibility being honoured.

Shipped history you must not regress (r5/r6): the persistent pinned-geometry wrapper
(killed the iOS panel flash; the "preopened blank card" desktop bug); the r6
closed-state CSS (`is-open` removed → immediate hide, `inert` + `aria-hidden`
re-applied); the symmetric 16×16 inline SVG glyph (dead-center measured); the esc
chain; the entrance focus flow (`focusWhenFinished` focuses the close button only
after the opacity transition truly completes).

## 2. Design laws (the household style — violations reject the work)

- `--ink-*` tokens only: `--ink-bg #0b1317`, `--ink-text #eeeae0`,
  `--ink-muted rgba(238,234,224,.68)`, `--ink-faint rgba(238,234,224,.48)`,
  `--ink-line rgba(238,234,224,.26)`, `--ink-line-soft rgba(238,234,224,.13)`,
  `--ink-accent #d39b61`, `--ink-accent-bright #e8b57c`, `--ink-accent-deep #b97f45`,
  `--panel-radius: 20px`. Chrome is lowercase `--mono`; hairlines 1px; ochre is the
  only interactive signal.
- The realm is a wiring harness: **no per-frame React state**; scene/audio live in
  one empty-deps strict-safe effect whose callbacks read latest values through
  refs; the esc chain, legend keyboard access and full cleanup are non-negotiable.
- Reduced motion = settled/inert. No new loops, no glow, no blur.
- Touch stays touch: the tap=select law and the mobile bottom sheet are settled.

## 3. Reasoning protocol (mandatory, shown in your reply — per problem)

Work in this exact order and show each phase in full, once for Item A, once for
Item B. Depth here is the deliverable's quality bar — superficial output will be
rejected.

1. **Restate** the problem in your own words, including the mechanical constraints
   (the gesture state machine, the panel's async pointer-events boundary, the
   WebKit compositing path) and why the current contract creates the reported
   friction/bug.
2. **Generate wide:** at least **5 materially distinct directions** each. Distinct
   means different mechanisms, not one idea with five tweaks (e.g. for Item A:
   native `dblclick` listener vs. consecutive-quick-release tracking in the gesture
   machinery vs. hold-to-dive vs. nearest-creature dive affordance vs. keyboard
   mapping variants vs. something better). Sketch each in 2–4 sentences
   (mechanism + what the visitor experiences).
3. **Prune in the open:** kill directions against explicit criteria — the design
   laws (§2), the phase machine (nothing dives outside `active`), the touch law,
   discoverability (a visitor must be able to find the shortcut without a manual),
   a11y (the aria-live wording and focus rules), and regression risk against the
   shipped r5/r6 laws. Say why each one dies. Keep the strongest 1–2.
4. **Develop to depth:** for the survivor(s), state **every concrete value** —
   timing windows, event names, guard conditions, exact TSX/CSS — with a one-line
   why for each number. No placeholders, no "adjust to taste".
5. **Stress-test:** walk the survivor through every scenario: fast double-click
   straddling the panel's `is-open` boundary; double-click on a creature under the
   open panel's footprint; single click after a dive-window miss; Enter with a
   focused legend button vs. the bare layer; Escape mid-gesture; leaving/diving
   phases; touch double-tap; reduced motion; rapid click-click-move; the panel
   open→close→reopen cycle (Item B: close X present/absent, entrance focus target,
   inert/aria-hidden states, the mobile bottom sheet, the leaving state).
6. **Rank and commit:** one paragraph, then the final deliverable. You decide — do
   not end with options, do not ask for approval.

## 4. Pinned contract (non-negotiable)

- **Item A lives in `RealmMode.tsx`'s input plumbing** (§5A/§5B) plus the `aria-live`
  wording. The dive must go through the existing `confirmDive(id)` path so the
  gesture cancellation, iris and SPA handoff stay single-sourced. Single-click /
  tap select behaviour must be byte-for-byte unchanged in outcome (the same panel,
  the same timing constants). Touch must not gain a dive gesture. The phase guard
  (`active` only) must hold for every new path.
- **Item B lives in the panel JSX (§5C) and may add one closed-state CSS rule** in
  the panel block (§5D). The persistent-wrapper law stays: the wrapper is always
  mounted with pinned geometry; only the close button's mounting/visibility may
  change. The entrance focus flow must still find the button; `inert`/`aria-hidden`
  semantics stay correct in both states.
- The esc chain, the legend keyboard access, the `m` mute, the warp keys and the
  body-lock cleanup are untouched.
- The orchestrator extends `tests/realm-probe.mjs` with new gates from your
  deliverable — list them explicitly in your stress-test so they can be written.

## 5. Current code (verbatim — the only context you get)

### 5A. The dive path and panel openers (RealmMode.tsx)

```tsx
  // open a creature's panel from anywhere (pointer, key, or legend) — a11y core
  const openProjectPanel = useCallback((id: string) => {
    if (phaseRef.current !== "active") return;
    setOpenId(id);
    sceneRef.current?.startGreeting(id);
    audioRef.current?.greeting(id);
  }, []);
  // latest-value ref so the empty-deps input effect can select without re-binding
  const openPanelRef = useRef(openProjectPanel);
  openPanelRef.current = openProjectPanel;

  const closePanel = useCallback(() => {
    panelStopRef.current?.(); // cancels entrance frames + delayed focus, hides now
    setOpenId(null);
    layerRef.current?.focus({ preventScroll: true }); // esc-chain step one returns focus to the layer
  }, []);

  const confirmDive = useCallback((id: string) => {
    if (phaseRef.current !== "active") return;
    cancelRealmGestureRef.current?.(); // an in-flight hold must not survive the dive
    setPhase("diving");
    sceneRef.current?.startDive(id);
    audioRef.current?.dive();
  }, []);
```

The scene is created with (inside the one empty-deps effect; `onOpenRef`,
`phaseRef`, `projectOf` are latest-value refs/callbacks):

```tsx
      onDiveCommit: (id) => {
        if (!alive) return;
        onOpenRef.current(id);       // SPA handoff; the realm unmounts naturally
      },
      onNearest: (id) => {
        if (!alive || !ariaRef.current) return;
        // throttle: announce only when the nearest actually changes
        const msg = id ? `${projectOf(id)?.title ?? id} — press enter to open` : "";
        if (msg !== lastAria.current) {
          lastAria.current = msg;
          ariaRef.current.textContent = msg;
        }
      },
```

### 5B. The gesture machinery (RealmMode.tsx, inside the one empty-deps effect)

```tsx
    const isTouch = (ev: PointerEvent) => ev.pointerType === "touch";
    const CHROME_SEL = ".realm-hud, .realm-legend, .realm-panel";

    const overChrome = (ev: PointerEvent) => {
      const target = ev.target;
      return target instanceof Element && target.closest(CHROME_SEL) !== null;
    };

    const lifted = (ev: PointerEvent) =>
      isTouch(ev)
        ? ev.clientY -
          Math.min(64, Math.max(24, 1.6 * (sceneRef.current?.lightRadius() ?? 48)))
        : ev.clientY;

    // deliberate-gesture state (plain locals — no React state, no rAF)
    const SELECT_MOVE = 8;      // px of total movement allowed for a select
    const SELECT_MS = 350;      // max press duration for a select
    const TARGET_TOUCH_MOVE = 18; // creature-origin press: forgiving wobble allowance
    const TARGET_MOUSE_MOVE = 10;
    let downId = -1;            // active primary pointer id, -1 = none
    let downX = 0, downY = 0, downT = 0;
    let downTouch = false;
    let moved = false;          // exceeded the allowance during this press
    let holding = false;        // press promoted to travel+call
    let downPick: string | null = null; // creature reserved at pointer-down
    let holdTimer: number | undefined;
    let lastX = 0;
    let lastY = 0;

    const clearHold = () => {
      if (holdTimer !== undefined) {
        window.clearTimeout(holdTimer);
        holdTimer = undefined;
      }
    };

    const cancelGesture = () => {
      clearHold();
      downId = -1;
      downPick = null;
      moved = false;
      holding = false;
      scene.setCalling(false);
      scene.setPointer(lastX, lastY, false);
    };

    const promoteToHold = () => {
      if (holding || downId < 0 || phaseRef.current !== "active") return;
      holding = true;
      scene.setCalling(true);
    };

    const observeMovement = (x: number, y: number) => {
      if (downId < 0 || moved) return;

      const allowance = downPick
        ? downTouch
          ? TARGET_TOUCH_MOVE
          : TARGET_MOUSE_MOVE
        : SELECT_MOVE;

      if (Math.hypot(x - downX, y - downY) > allowance) {
        moved = true; // sticky: moving back does not turn a drag into a tap
        downPick = null;
        clearHold();
        promoteToHold();
      }
    };

    const onPointerDown = (ev: PointerEvent) => {
      if (
        !ev.isPrimary ||
        downId !== -1 ||
        overChrome(ev) ||
        (ev.pointerType === "mouse" && ev.button !== 0)
      ) {
        return;
      }

      tryResume();
      if (phaseRef.current !== "active") return;

      clearHold();

      downId = ev.pointerId;
      downX = ev.clientX;
      downY = ev.clientY;
      downT = ev.timeStamp;
      downTouch = isTouch(ev);
      moved = false;
      holding = false;

      // Consume the snapshot once, now. Release uses this ID, never another pick.
      scene.markPickAnchor(downTouch);
      downPick = scene.pickAt(downX, downY, downTouch);

      lastX = ev.clientX;
      lastY = lifted(ev);
      scene.setCalling(false);
      scene.setPointer(lastX, lastY, true);

      // A target-origin press is reserved until release or an intentional drag.
      // Empty-space holds retain the original calling deadline.
      if (!downPick) {
        holdTimer = window.setTimeout(() => {
          holdTimer = undefined;
          promoteToHold();
        }, SELECT_MS);
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!ev.isPrimary) return;

      // Do not let another pointer type steer an existing primary gesture.
      if (downId !== -1 && downId !== ev.pointerId) return;

      lastX = ev.clientX;
      lastY = lifted(ev);

      if (phaseRef.current !== "active" || overChrome(ev)) {
        cancelGesture();
        return;
      }

      if (downId === ev.pointerId) {
        // Preserve excursions reported in coalesced samples where supported.
        const samples = ev.getCoalescedEvents?.() ?? [];
        for (const sample of samples) {
          observeMovement(sample.clientX, sample.clientY);
        }
        observeMovement(ev.clientX, ev.clientY);
      }

      scene.setPointer(lastX, lastY, true);
    };

    const endPointer = (ev: PointerEvent) => {
      if (!ev.isPrimary || downId !== ev.pointerId) return;

      lastX = ev.clientX;
      lastY = lifted(ev);

      const validRelease =
        ev.type === "pointerup" &&
        phaseRef.current === "active" &&
        !overChrome(ev);

      // Some devices deliver a final displacement only with pointerup.
      if (validRelease) observeMovement(ev.clientX, ev.clientY);

      const quick = !moved && !holding && ev.timeStamp - downT < SELECT_MS;

      const id =
        validRelease && !moved && !holding && (downPick !== null || quick)
          ? downPick
          : null;

      const releaseTouch = downTouch;

      clearHold();
      downId = -1;
      downPick = null;
      moved = false;
      holding = false;
      scene.setCalling(false);

      scene.setPointer(
        lastX,
        lastY,
        !releaseTouch && validRelease,
      );

      if (id) openPanelRef.current(id);
    };

    const onPointerLeave = (ev: PointerEvent) => {
      if (ev.pointerId === downId) cancelGesture();
    };

    const onVisibilityChange = () => {
      if (document.hidden) cancelGesture();
    };

    cancelRealmGestureRef.current = cancelGesture;

    // No pointer capture: chrome retains native targeting/click/focus.
    // Window end listeners still finish releases outside the layer's event subtree.
    layer.addEventListener("pointerdown", onPointerDown);
    layer.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);
    window.addEventListener("blur", cancelGesture);
    document.addEventListener("visibilitychange", onVisibilityChange);
```

The keyboard half of the same effect (directly below; `DIR`, `tryResume`,
`toggleMute` exist in scope):

```tsx
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return; // never hijack shortcuts
      const k = ev.key.toLowerCase();

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
        if (id) openProjectPanel(id);
        return;
      }
      if (k === "m") {
        ev.preventDefault();
        toggleMute();
        return;
      }
    };

    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      if (k in DIR) { ev.preventDefault(); scene.setThrust(0, 0); } // release thrust
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
```

### 5C. The panel JSX (RealmMode.tsx return block, chrome elided around it)

```tsx
      {/* persistent panel: wrapper always mounted with pinned geometry;
          content is conditional; inert/aria-hidden/is-open are owned by the
          entrance layout effect, never by React state on this wrapper. */}
      <div ref={panelRef} className="realm-panel" role="document">
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
        {opened ? (
          <>
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
          </>
        ) : null}
      </div>
```

The entrance effect (summarized contract; `panelRequested` is
`requestedPanelId !== null && phase !== "leaving"`; `requestedPanelId` is the
opened project's id or null; deps `[panelRequested, requestedPanelId]`):

- on every commit of those deps the wrapper is reset to closed
  (`classList.remove("is-open")`, `inert`, `aria-hidden` set) **before paint**;
- if a panel is requested: the gesture is cancelled, `transitionend` +
  `visibilitychange` listeners attach, two rAFs later (guarded by
  `phaseRef.current === "active"`) `is-open` is added and `inert`/`aria-hidden`
  removed; `focusWhenFinished` (poll-based, transitionend + fallback timer) then
  focuses `panelCloseRef.current` only when the panel is fully opaque;
- `stop()` (also the cleanup) removes the listeners, cancels frames/timers,
  removes `is-open`, re-applies `inert`/`aria-hidden`. The close button's focus
  must therefore find the button mounted — mounting it with the content in the
  same render satisfies that (the reset happens before paint, the class is added
  two rAFs later).

### 5D. The panel CSS (realm.css, verbatim)

```css
/* ── panel (persistent right sheet; content opens via .is-open) ──
   Geometry is final before content insertion. Only the class-added
   entrance transitions; the persistent wrapper never animates or moves. */
.realm-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: calc(100% - min(30rem, 92%));
  z-index: 70;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(30rem, 92%);
  height: 100%;
  min-height: 0;
  max-height: 100%;

  padding: 1.4rem 1.3rem calc(1.4rem + env(safe-area-inset-bottom, 0px));
  background: #04080b;
  border: 0;
  border-left: 1px solid var(--ink-line);

  overflow-y: auto;
  overscroll-behavior: contain;
  cursor: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--ink-line) transparent;

  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: none;
  animation: none;
  transition: none;
}
.realm-panel.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: opacity 0.28s ease;
}
.realm-reduced .realm-panel.is-open {
  transition: opacity 0.24s linear;
}
/* Defense independent of entrance callbacks. */
.realm-layer[data-realm-leaving="true"] .realm-panel {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: none;
  animation: none;
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .realm-panel.is-open {
    transition: opacity 0.24s linear;
  }
}
.realm-panel::-webkit-scrollbar { width: 7px; }
.realm-panel::-webkit-scrollbar-thumb { background: var(--ink-line); }
.realm-panel::-webkit-scrollbar-track { background: transparent; }

.realm-panel-close > svg {
  display: block;
  width: 16px;
  height: 16px;
  pointer-events: none;
}
```

(≤520px the panel becomes a pinned bottom sheet: `top: 52%; height: 48%; border-top`
instead of `border-left`; nothing else changes — the visibility contract is shared.)

```css
.realm-panel-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  font-family: var(--mono);
  font-size: 1rem;
  color: var(--ink-muted);
  background: transparent;
  border: 1px solid var(--ink-line);
  border-radius: var(--panel-radius);
  cursor: pointer;
  transition: border-color 0.15s linear, color 0.15s linear;
}
.realm-panel-close:hover,
.realm-panel-close:focus-visible {
  outline: none;
  border-color: var(--ink-accent);
  color: var(--ink-text);
}
```

## 6. Deliverable

One reply containing, in this order:

1. The full shown reasoning chain for Item A (§3), ending with
   `COMMITTED A: <one-line name of the direction>`.
2. The exact `RealmMode.tsx` changes for Item A as **complete replacement code
   blocks** — for each touched region, quote the verbatim current lines (from §5)
   and give the verbatim replacement. No "…" elisions inside code. New state
   (locals or refs) must be declared in the replacement blocks.
3. The full shown reasoning chain for Item B, ending with
   `COMMITTED B: <one-line name of the direction>`.
4. The exact JSX replacement for the close button region (§5C) — verbatim current
   vs. verbatim replacement — plus (if argued) one fenced ```css block to splice
   into the panel block: state after which existing rule it goes.
5. A short list titled `NEW PROBE GATES:` naming the behavioural gates the
   orchestrator should add for both items (one line each, as probe `check()`
   names).

Integration (not your job, for context): the orchestrator splices the edits into
RealmMode.tsx / realm.css, runs the type check, production build, the probe suite
with your new gates, and screenshots desktop/mobile panels for the owner; the owner
re-checks the iOS close button on a real device.
