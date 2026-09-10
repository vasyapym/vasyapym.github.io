# BRIEF — realm r10, deliverable: the select-freeze lantern + the dead-interaction window on exit

Relay brief for the chat model. You have **full design and code autonomy** inside the
pinned contract below — no approval gates, no clarifying questions. Commit to one
design per item and one set of code blocks. The only thing we require is that your
reasoning is shown in full before the deliverable, at the depth specified in §3 —
for each of the two items separately.

---

## 1. Situation

The landing page (`portfolio/shell`) has "the deep" — an opt-in immersive realm
(`RealmMode.tsx` shell + `realm-scene.ts` engine + `realm-creatures.ts`). Seven
creatures swim in a GPU-fluid abyss; each maps to a project. A quick click/tap on a
creature opens its **panel** (persistent right sheet on desktop, bottom sheet ≤520px).
The lantern IS the cursor: a critically damped spring-mass follower
(`lan.x/y`, velocities `lvx/lvy`, spring k=132.25 c=23, drag exp(-1.7·h) when the
pointer is idle, maxSpeed 900/1200) that the visitor drags through the abyss.
Exiting ("← surface" or Escape) runs a 600ms whole-layer opacity fade
(`.realm--surfacing`), then a staged teardown (r9 D1, already in the tree), then the
React unmount.

### Item A — the lantern keeps drifting after a project is clicked (owner report)

> "In deeper/realm mode, when a user clicks on a project, the light/cursor continues
> moving in the direction it was traveling at the moment of the click. It should stop
> moving when a project is clicked. Lock its position at the point of click so it
> remains stationary while the user is interacting with the selected project."

Verified mechanism: at the click (`endPointer` → `openProjectPanel`) nothing stops the
lantern. Its momentum (`lvx/lvy`) continues under the no-pointer drag branch, and while
`ptrActive` stays true the spring keeps integrating toward the last pointer position.
The creature also swims on. The visitor sees the light coast in its travel direction
for hundreds of ms after selecting. **Freeze means: the instant the panel opens, the
lantern parks exactly where it is (no teleport to the pointer) and stays parked until
the panel closes.**

### Item B — the ~0.6s dead-interaction window on exit + the Windows Edge lateral shift (owner report)

> "When transitioning out of 'the deeper'/'realm' mode back to the main page, there is
> roughly a 0.6-second window during which scrolling on the main page is blocked. Fix
> this so that scrolling is either available immediately upon exiting, or the
> transition itself is smooth enough that the blocked input isn't perceptible."

> "On Windows Microsoft Edge, when exiting 'the deep' mode, the page shifts slightly
> to the left before settling. This should not happen — the page position should
> remain stable during the exit transition."

**Both symptoms share one root cause.** The exit timeline today (r9 staged state,
verbatim):

1. `doLeave()` → `leaveGate.begin()` → `.realm--surfacing` → the layer fades 1→0 over
   600ms. The body is still locked (`position: fixed; top: -scrollY; width: 100%;
   overflow: hidden`), and the window-level wheel handler still `preventDefault()`s
   every wheel event (`scene.breatheLight`).
2. On transitionend (opacity 0): stage 1 hides the canvases (`display:none important`)
   + `scene.destroy()`.
3. One nested-rAF beat → **stage 2: `restoreLandingScroll()`** — the body unfixes and
   the scrollbar returns. This is the ONLY moment the page becomes scrollable —
   ~600ms fade + ~64ms beat after the click. The wheel handler keeps preventDefaulting
   until unmount regardless.
4. Another beat → stage 3 → `sendExitIfReady()` → `onExit()` → `setRealmOpen(false)` →
   unmount (the 150ms settlement floor runs in parallel, so the exit lands
   ~750–815ms after the click).

The Edge lateral shift is the **scrollbar-gutter reflow**: while the body is locked,
the document scroller has no classic scrollbar (Windows Edge scrollbars take layout
space), so the ICB is ~17px wider and centered content sits ~8px right. When
`restoreLandingScroll()` unfixes the body, the scrollbar returns, the ICB shrinks and
centered content shifts **left** by ~8px — and in the r9 staging this happens after the
fade, with the veil already at opacity 0, so it is the first thing the visitor sees.
On enter the reverse shift happens under the incoming flood and was never reported.

**The choreography fix serves both**: move the body/scroll restoration to the very
start of `begin()`, while the veil is still fully opaque — the reflow lands in the
fade's first frame (invisible), and the page accepts wheel/touch input from frame one
(the wheel handler must stop preventDefaulting once the exit begins, and the fading
layer must stop eating clicks). The staged canvas retirement keeps its r9 law
(canvases retire only at computed opacity 0; no `WEBGL_lose_context`).

### Shipped laws you must not regress

- r6: the 600ms `.realm--surfacing` envelope owns the exit reveal — its timing/bezier
  and duration are settled; the landing must not animate underneath it.
- r8: the landing's tone variables (`--hero-exit`, the floor) are frozen during the
  session and recomputed once after unlock — the effects are guarded on `realmOpen`;
  do not weaken the guards (scroll events during the session, including the ones your
  early unlock fires, must stay inert to them).
- r9 D1: the canvas retirement (display:none + `scene.destroy()`) begins only at
  computed layer opacity 0; the GL context is never force-lost; a watchdog backstop
  guarantees the exit can never strand the page.
- r9 D2: the panel's stationary-wrapper + inner scroll body law, the r8 direct-dive
  and panel machinery, the touch tap=select law — all settled; do not restructure.
- Scroll restoration stays exact and instant (`behavior: "instant"`, the smooth
  `scroll-behavior` must never animate the visitor back).
- Reduced motion keeps its own shorter exit (240ms linear envelope) — and it gets the
  same early unlock.

## 2. Design laws (the household style — violations reject the work)

- No new loops, no glow, no blur, no decoration; this round is input choreography.
- `--ink-*` tokens, lowercase mono chrome, 1px hairlines.
- Reduced motion = settled/inert.
- React hygiene: no per-frame React state; the scene/audio live in one empty-deps
  strict-safe effect; every listener/timer/frame owned by an effect is released in its
  cleanup; effects stay strict-safe (Strict Mode double-invoke must be safe).

## 3. Reasoning protocol (mandatory, shown in your reply — per item)

Work in this exact order and show each phase in full, once for Item A, once for
Item B. Depth here is the deliverable's quality bar — superficial output will be
rejected.

1. **Restate** the failure in your own words: for Item A the lantern's momentum +
   spring follow surviving the select; for Item B the two lock owners (the staged
   body unlock at stage 2 + the unconditionally-preventDefaulting wheel handler) and
   the scrollbar-gutter reflow being the first visible frame after the veil.
2. **Generate wide:** at least **5 materially distinct directions** each. For
   Item A e.g.: a scene-level hold flag that suspends integration and zeroes momentum;
   momentum-only zeroing; freezing the whole sim; teleporting the lantern to the click
   point; CSS/canvas pausing; something better. For Item B e.g.: restore + wheel
   release at `begin()` under the opaque veil; shortening the envelope; a
   `scrollbar-gutter: stable` approach; a padding-compensation approach; releasing the
   shell `inert` early; something better. Sketch each in 2–4 sentences (mechanism +
   what the visitor experiences).
3. **Prune in the open:** kill directions against explicit criteria — the shipped laws
   (§1), Strict Mode remount safety, double-exit safety (Escape during the fade, the
   surface button while a panel is open, the dive path), the idle/lure system, the
   r9 flash staging, regression risk (a NEW visible artifact). Say why each dies.
   Keep the strongest 1–2.
4. **Develop to depth:** for the survivor(s), state **every concrete value** — flag
   names, branch order inside `updateLantern`, exactly where the hold is set/released
   (including the exit/dive paths), the ordering inside `begin()` (what runs before the
   fade class), the wheel guard condition, the CSS rule — with a one-line why for
   each. No placeholders, no "adjust to taste".
5. **Stress-test:** walk the survivor through: select by canvas tap, by legend button
   click, by focused-legend keyboard Enter; mouse wandering over the scene while a
   panel is open (the light must stay parked); close → the light stays parked until
   the pointer moves; open → dive (the hold must not survive into the dive); open →
   Escape twice (close then leave); leave while parked; wheel + touch during the exit
   fade; exit from the chip entry (page end) and the threshold entry (mid-page);
   reduced motion; Strict Mode double-invoke; double-leave; backgrounding mid-exit.
   Name what could break and why it doesn't.
6. **Rank and commit:** one paragraph, then the final deliverable. You decide — do
   not end with options, do not ask for approval.

## 4. Pinned contract (non-negotiable)

- The freeze is **scene state driven by the shell's panel lifecycle**: the shell calls
  a new `scene.setLanternHold(hold: boolean)` — `true` when a panel opens, `false`
  when it closes. The scene itself clears the hold on `startLeave` and `startDive`.
  While held, the lantern must not integrate any motion (no momentum, no spring
  follow, no thrust); `updateInput`'s idle/lure accounting stays untouched. Pointer
  coordinates may keep being recorded so the release springs naturally from the parked
  point on the next pointer move.
- The scroll unlock moves to `leaveGate.begin()`, **before** the `.realm--surfacing`
  class is applied, as the first rendering-relevant action of the exit. It stays the
  sole implementation (idempotent, `behavior: "instant"`), and the effect cleanup
  keeps its fallback call. The former stage 2 ("unlocked") disappears — the staging
  becomes: retire canvases + destroy scene → one beat → release eligibility.
- The window wheel handler must not `preventDefault` once the exit has begun (the
  phase check is the mechanism; keep the listener and its cleanup exactly as they
  are otherwise).
- The fading layer stops accepting pointer interaction while leaving (CSS keyed on
  the existing `data-realm-leaving` attribute — the layer's existing rules and the
  panel's leaving rules stay intact).
- The shell's `inert`/`aria-hidden` ownership does NOT change (no new React state for
  the release; the shell stays inert until `setRealmOpen(false)`).
- The 150ms settlement floor, the watchdog (1,500ms) and the r9 canvas-retirement
  staging keep their semantics; the exit can never strand the page.
- The orchestrator extends `tests/realm-probe.mjs` with gates from your deliverable —
  list them explicitly under `NEW PROBE GATES:` (headless-verifiable only). The probe
  needs a **dev-only scene hook**: in RealmMode's main effect, after
  `sceneRef.current = scene;`, set `(window as …).__realmScene = scene` when
  `import.meta.env.DEV`, and clear it in the cleanup — include this in your code.
- A real `page.mouse.wheel()` dispatch during the exit fade must scroll the landing
  (the body is unlocked and the wheel handler is passive-by-then) — the orchestrator
  will gate on this.

## 5. Current code (verbatim — the only context you get)

### 5A. The scene's input state (realm-scene.ts)

```ts
  // ── input ──
  let ptrX = 0;
  let ptrY = 0;
  let ptrActive = false;
  let thrustX = 0;
  let thrustY = 0;
  let calling = false;
  let wakeOn = false;
  let idleT = 0;
  let lure = 0;
  let inputAccum = 0;
```

### 5B. The lantern simulation (realm-scene.ts)

```ts
  function updateLantern(dt: number): void {
    const controllable = phase === "active";
    if (controllable) {
      breath += (breathTarget - breath) * (1 - Math.exp(-12 * dt));
    }

    if (controllable && !reduced) {
      const tx = (ptrX - vw * 0.5) / cam.zoom + cam.camX + vw * 0.5;
      const ty = (ptrY - vh * 0.5) / cam.zoom + cam.camY + vh * 0.5;
    const k = small ? 121 : 132.25;
    const c = small ? 22 : 23; // unit mass: c = 2 * sqrt(k).
    const maxSpeed = small ? 900 : 1200;
    const steps = Math.max(1, Math.ceil(dt * 120));
      const h = dt / steps;

      // critical damping; substeps keep long frames calm.
      for (let i = 0; i < steps; i++) {
        let ax = thrustX * 1100;
        let ay = thrustY * 1100;
        if (ptrActive) {
          ax += (tx - lan.x) * k - lvx * c;
          ay += (ty - lan.y) * k - lvy * c;
        } else {
          const drag = Math.exp(-1.7 * h);
          lvx *= drag;
          lvy *= drag;
        }

        lvx += ax * h;
        lvy += ay * h;
        const v = Math.hypot(lvx, lvy);
        if (v > maxSpeed) {
          lvx *= maxSpeed / v;
          lvy *= maxSpeed / v;
        }
        lan.x += lvx * h;
        lan.y += lvy * h;
      }
    } else if (controllable) {
      // reduced motion: direct, softened follow — no overshoot
      if (ptrActive) {
        const ty = (ptrY - vh * 0.5) + cam.camY + vh * 0.5;
        const f = 1 - Math.exp(-10 * dt);
        lan.x += (ptrX - lan.x) * f;
        lan.y += (ty - lan.y) * f;
      }
      lan.x += thrustX * 700 * dt;
      lan.y += thrustY * 700 * dt;
      lvx = 0;
      lvy = 0;
    }

    // soft walls
    if (lan.x < 0) { lan.x = 0; lvx = Math.abs(lvx) * 0.4; }
    if (lan.x > world.w) { lan.x = world.w; lvx = -Math.abs(lvx) * 0.4; }
    if (lan.y < 0) { lan.y = 0; lvy = Math.abs(lvy) * 0.4; }
    if (lan.y > world.h) { lan.y = world.h; lvy = -Math.abs(lvy) * 0.4; }
    speed = Math.hypot(lvx, lvy);
    lan.r = lanternBaseR * breath;
    lan.intensity = breath * ignite;
  }
```

### 5C. The scene api fragment (realm-scene.ts, the setCalling anchor)

```ts
    setCalling(c) {
      calling = c;
      if (c) idleT = 0;
    },
```

### 5D. The scene's phase transitions (realm-scene.ts)

```ts
    startLeave(cx, cy) {
      if (destroyed || phase !== "active") return;
      chipX = cx;
      chipY = cy;
      ptrActive = false;
      calling = false;
      invalidateSceneContinuity();
      if (lastNearestId !== null) {
        lastNearestId = null;
        opts.onNearest(null);
      }
      finishPhase("leaving");
      start();
    },

    startDive(id) {
      if (destroyed || phase !== "active") return;
      const idx = findIdx(id);
      if (idx < 0) return;
      diveIdx = idx;
      diveFromZoom = cam.zoom;
      ptrActive = false;
      calling = false;
      invalidateSceneContinuity();
      finishPhase("diving");
      start();
    },
```

### 5E. The scene api interface (realm-scene.ts, fragment)

```ts
  setPointer(x: number, y: number, active: boolean): void;
  setThrust(x: number, y: number): void;
  setCalling(calling: boolean): void;
```

### 5F. The shell's selection + close handlers (RealmMode.tsx)

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
    resetDirectInputRef.current?.();
    panelStopRef.current?.(); // cancels entrance frames + delayed focus, hides now
    setOpenId(null);
    layerRef.current?.focus({ preventScroll: true }); // esc-chain step one returns focus to the layer
  }, []);
```

### 5G. The exit constants (RealmMode.tsx, inside the one empty-deps effect)

```tsx
    // Normal exit:
    //   keep the existing 150 ms settlement floor, and use that time to
    //   retire canvas layers, unlock the body, then release the shell.
    // Watchdog:
    //   explicitly hide at 1,500 ms, then use the same staged handoff.
    const EXIT_SETTLE_MS = 150;
    const EXIT_WATCHDOG_MS = 1500;
    const EXIT_BEAT_FALLBACK_MS = 64;
```

### 5H. The exit gate (RealmMode.tsx, same effect)

```tsx
    const maybeFinishLeave = (): void => {
      if (
        !alive || !leaveStarted || !leaveSceneDone || !leaveVisualDone ||
        teardownStarted || exitSent
      ) return;

      // Do not accept a stale or synthetic transition completion while
      // the layer still has a visible opacity.
      if (
        leaveLayer &&
        Number.parseFloat(getComputedStyle(leaveLayer).opacity) !== 0
      ) return;

      teardownStarted = true;
      clearWatchdog();

      // Settlement runs in parallel with staging, not after it.
      exitTimer = setTimeout(() => {
        exitTimer = null;
        if (!alive) return;
        settleDone = true;
        sendExitIfReady();
      }, EXIT_SETTLE_MS);

      // Stage 1: retire render layers while body lock and shell inertness
      // are unchanged. Keep React ownership of all DOM nodes.
      if (leaveLayer) {
        leaveLayer.querySelectorAll("canvas").forEach((node) => {
          hiddenCanvases.push({
            node,
            display: node.style.getPropertyValue("display"),
            priority: node.style.getPropertyPriority("display"),
          });

          node.style.setProperty("display", "none", "important");
        });
      }

      // Idempotent scene destruction stops resize/render work and disposes
      // GL resources. It must continue to avoid WEBGL_lose_context.
      // Continue the handoff even if a driver-facing disposal call throws.
      try {
        scene.destroy();
      } catch (error) {
        console.error("realm scene retirement failed", error);
      }

      if (leaveLayer) {
        leaveLayer.dataset.realmExitStage = "retired";
      }

      cancelExitBeat = afterExitBeat(() => {
        cancelExitBeat = null;
        if (!alive || exitSent) return;

        // Stage 2: restore the original page position, once and instantly.
        // The shell is still inert because realmOpen remains true.
        restoreLandingScroll();

        if (leaveLayer) {
          leaveLayer.dataset.realmExitStage = "unlocked";
        }

        cancelExitBeat = afterExitBeat(() => {
          cancelExitBeat = null;
          if (!alive || exitSent) return;

          // Stage 3 is now eligible. Parent release still waits for the
          // original settlement floor.
          stagesDone = true;
          sendExitIfReady();
        });
      });
    };

    const onLeaveTransitionEnd = (event: TransitionEvent): void => {
      if (
        !alive || !leaveStarted ||
        event.target !== leaveLayer ||
        event.propertyName !== "opacity"
      ) return;

      if (
        leaveLayer &&
        Number.parseFloat(getComputedStyle(leaveLayer).opacity) !== 0
      ) return;

      leaveVisualDone = true;
      maybeFinishLeave();
    };

    const leaveGate = {
      begin(): void {
        if (!alive || leaveStarted) return;
        leaveStarted = true;

        // Self-contained audio exit; does not depend on the active mixer effect.
        audio.surface();

        leaveLayer = layerRef.current;
        if (leaveLayer) {
          leaveLayer.addEventListener("transitionend", onLeaveTransitionEnd);
          leaveLayer.classList.add("realm--surfacing");
        } else {
          // No DOM layer exists to animate.
          leaveVisualDone = true;
        }

        watchdogTimer = setTimeout(() => {
          watchdogTimer = null;
          if (!alive || exitSent || teardownStarted) return;

          // Establish an invisible layer before entering any teardown stage.
          if (leaveLayer) {
            leaveLayer.style.transition = "none";
            leaveLayer.style.opacity = "0";
            leaveLayer.style.visibility = "hidden";
          }

          leaveVisualDone = true;
          leaveSceneDone = true;
          maybeFinishLeave();
        }, EXIT_WATCHDOG_MS);
      },

      sceneDone(): void {
        if (!alive || !leaveStarted) return;
        leaveSceneDone = true;
        maybeFinishLeave();
      },
    };
```

For orientation, `restoreLandingScroll()` (declared above both, idempotent via
`landingScrollRestored`) restores `prev.position/top/width/overflow` and calls
`window.scrollTo({ top: scrollY, behavior: "instant" })`; the effect cleanup calls it
as the fallback. Do not duplicate it.

### 5I. The wheel handler (RealmMode.tsx, same effect)

```tsx
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      scene.breatheLight(ev.deltaY > 0 ? -1 : 1);
    };
```

It is bound as `window.addEventListener("wheel", onWheel, { passive: false })` and
removed in the cleanup (unchanged bindings).

### 5J. The exit CSS (realm.css)

```css
/* ── surface exit: one opacity envelope for the whole dialog layer ──
   Canvas, chrome and scrim fade together. Suppress the canvas-only
   fade during surfacing; dive retains its own iris choreography. */
.realm-exit-layer {
  opacity: 1;
  transition: opacity 600ms cubic-bezier(0.22, 1, 0.36, 1);
}
.realm-exit-layer.realm--surfacing {
  opacity: 0;
}
.realm-exit-layer.realm--surfacing .realm-gl--fade {
  opacity: 1;
  transition: none;
}
.realm-exit-layer.realm-reduced,
.realm-reduced .realm-exit-layer {
  transition: opacity 240ms linear;
}
@media (prefers-reduced-motion: reduce) {
  .realm-exit-layer {
    transition: opacity 240ms linear;
  }
}
```

The layer also carries `data-realm-leaving` (React state: `"true"` only while
leaving) and the panel already has its own leaving rules
(`.realm-layer[data-realm-leaving="true"] .realm-panel { …; pointer-events: none; … }`).

## 6. Deliverable

One reply containing, in this order:

1. The full shown reasoning chain for Item A (§3), ending with
   `COMMITTED A: <one-line name of the direction>`.
2. The exact code changes for Item A as **complete replacement blocks** — for each
   touched region, quote the verbatim current lines (from §5) and give the verbatim
   replacement. No "…" elisions inside code. New flags must be declared in the
   replacement blocks, and every affected path (open, close, leave, dive, Strict Mode
   cleanup) must be shown.
3. The full shown reasoning chain for Item B, ending with
   `COMMITTED B: <one-line name of the direction>`.
4. The exact code changes for Item B as complete replacement blocks (same rules).
5. A short list titled `NEW PROBE GATES:` naming the headless-verifiable gates the
   orchestrator should add (one line each, as probe `check()` names), plus a short
   `OWNER DEVICE CHECK:` list of what only a real device can confirm (iPhone touch
   scroll on exit, Windows Edge lateral stability).

Integration (not your job, for context): the orchestrator splices the edits, runs the
type check, production build, and the 56-gate probe with your new gates; the owner
re-checks the freeze feel, the immediate scroll on exit and the Edge stability on
real devices.
