# BRIEF — realm r9, deliverable D1: the iOS exit flash (cards black → reappear)

Relay brief for the chat model. You have **full design and code autonomy** inside the
pinned contract below — no approval gates, no clarifying questions. Commit to one
design and one set of code blocks. The only thing we require is that your reasoning is
shown in full before the deliverable, at the depth specified in §3.

---

## 1. Situation

The landing page (`portfolio/shell`) has "the deep" — an opt-in immersive realm.
Exiting it (the `← surface` button or Escape) runs a 600ms whole-layer opacity fade,
then unmounts the realm and restores the landing. **Owner report, iOS Safari,
iPhone 11 (414×896 @2x, Dynamic Type possible, safe-area insets top 48 / bottom 34):**

> "When navigating out of a realm, the project cards briefly turn black (or disappear
> entirely) before reappearing. Find what is causing this flash during the transition
> and eliminate it so the cards remain visually stable when exiting a realm."

### What the exit currently does, verbatim timeline (measured + code-read)

1. `doLeave()` → phase `leaving` → the scene's leave script (0.9s ink vortex) runs;
   the layer gets `.realm--surfacing` → **the whole layer fades opacity 1→0 over
   600ms** (`.realm-exit-layer` transition; the r6 law: this envelope owns the exit
   reveal). The landing beneath is already fully rendered and inert.
2. When BOTH the scene script and the CSS transition complete, an exit timer waits
   150ms, then calls `onExit()` → `handleRealmExit()` → `setRealmOpen(false)`.
3. React unmounts RealmMode. Its effect cleanup runs synchronously in the commit:

```tsx
    return () => {
      alive = false;
      stopDirectInput();
      cleanupLeaveGate();
      cleanupGestures();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      // restore scroll + body style; instant — the global smooth scroll-behavior
      // must not animate the visitor back to where they were.
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      document.body.style.overflow = prev.overflow;
      window.scrollTo({ top: scrollY, behavior: "instant" });
      scene.destroy();
      audio.dispose();
      sceneRef.current = null;
      audioRef.current = null;
    };
```

4. In the same commit React removes the layer's DOM — two full-viewport canvases
   (a WebGL canvas that has been painting an opaque abyss at `devicePixelRatio ×
   414×896 ≈ 1.7MP`, plus a 2D overlay) and all chrome — while the body unfixes and
   the page re-composites.
5. `scene.destroy()` → `fluid.dispose()` deletes every GL resource (programs,
   buffers, all render targets) but deliberately does NOT call `WEBGL_lose_context`
   (the canvas element is dropped with the layer; a lost context is permanent for the
   element and Strict Mode remounts must stay usable). The last painted frame stays
   in the canvas backing store until the element leaves the DOM.

In headless Blink the DOM state through the whole exit is provably stable (cards
`opacity: 1; visibility: visible` at every sample; verified by burst capture). The
flash is therefore a **WebKit compositor artifact of the teardown transaction**, not
a DOM/CSS state bug: in one compositor transaction iOS Safari must (a) destroy a
full-screen GL-backed layer, (b) unfix the body and restore scroll, (c) re-join the
previously `inert`+`aria-hidden` shell subtree to the live layer tree, and (d) rebuild
the layer tree around it. The cards are exactly the layer family that goes black in
WebKit on such rebuilds: each card's artwork is a `translate3d(...)`-promoted
`.project-artwork-object` containing SVGs that carry **infinite CSS animations**
(`gem-breathe` on every card's mark, `gem-halo-pulse` on three of them) — promoted,
animation-driven layers whose tile contents WebKit re-rasterizes lazily after a layer
tree rebuild, showing black until the next animation tick fills them.

### Shipped laws you must not regress

- r6: **the 600ms `.realm--surfacing` envelope owns the exit reveal** — the landing
  must not animate underneath it; the envelope's timing/bezier is settled.
- r8: the landing's tone variables (`--hero-exit`, the floor) are frozen during the
  session and recomputed once after unlock — do not reintroduce any snap.
- Scroll restoration must stay exact and instant (the smooth `scroll-behavior` must
  never animate the visitor back).
- The GL context must never be force-lost (`WEBGL_lose_context` is banned —
  Strict Mode remounts reuse elements).
- Reduced motion keeps its own shorter exit (240ms linear envelope).
- The r8 direct-dive and panel machinery are settled; do not restructure them.

### Verification limits (important)

This machine has no WebKit driver — the flash cannot be reproduced here (headless
Blink shows nothing). The owner re-checks on a real iPhone. Your fix must therefore be
**structurally staged**: no single compositor transaction may combine the GL layer
destruction, the body unfix and the shell's return to the live tree; and the promoted
artwork layers must be given a reason/beat to re-composite after the teardown. Say
plainly in your stress-test what remains device-verified-only.

## 2. Design laws (the household style — violations reject the work)

- No new loops, no glow, no blur, no decoration. The realm's visual language is
  settled; this round is teardown choreography only — the visitor must see nothing
  new, only the absence of the flash.
- `--ink-*` tokens, lowercase mono chrome, 1px hairlines.
- Reduced motion = settled/inert.
- React hygiene: no per-frame React state; effects stay strict-safe; cleanup stays
  total (every listener/timer/frame owned by the effect must be released).

## 3. Reasoning protocol (mandatory, shown in your reply)

Work in this exact order and show each phase in full. Depth here is the deliverable's
quality bar — superficial output will be rejected.

1. **Restate** the failure in your own words: the exact single-transaction teardown,
   why WebKit black-flashes the promoted artwork layers during it, and why Blink
   cannot reproduce it.
2. **Generate wide:** at least **5 materially distinct directions** for eliminating
   the flash. Distinct means different mechanisms, not one idea with five tweaks
   (e.g.: staging the teardown across frames/rAFs; detaching the canvases before
   disposal; blanking/shrinking the GL backing store before unmount; repainting the
   landing after the teardown; restructure of what is destroyed when — scene vs DOM
   vs body unlock ordering; a landing-side compositing defense for the artwork
   layers; something better). Sketch each in 2–4 sentences (mechanism + what the
   visitor experiences on an iPhone).
3. **Prune in the open:** kill directions against explicit criteria — the shipped
   laws (§1), the r6 envelope ownership, Strict Mode remount safety (the cleanup
   runs twice in dev), double-exit safety (leave pressed twice, Escape during
   leave, dive while leaving), the timing budget (the exit must not feel slower),
   and the risk that a staged teardown introduces a NEW visible artifact. Say why
   each one dies. Keep the strongest 1–2.
4. **Develop to depth:** for the survivor(s), state **every concrete value** —
   frame counts, rAF/timer ordering, which code owns each stage, exact TSX — with
   a one-line why for each number. No placeholders, no "adjust to taste".
5. **Stress-test:** walk the survivor through: exit from chip entry (page end) and
   threshold entry (mid-page); exit while the panel is open; double-exit / Escape
   during leave; enter→exit→enter rapidly; Strict Mode double-invoke of the
   cleanup; reduced motion; iOS URL-bar resize mid-exit; the dive path untouched;
   backgrounding mid-exit. Name what could break and why it doesn't.
6. **Rank and commit:** one paragraph, then the final deliverable. You decide — do
   not end with options, do not ask for approval.

## 4. Pinned contract (non-negotiable)

- The **600ms envelope stays the only exit reveal**; the visitor must not perceive
  any new motion. The fix is choreography of the teardown, not a new animation.
- **Scroll restoration stays exact, instant and owned where it is now** (or argue a
  new owner explicitly — then the old path must be removed, not duplicated).
- The body lock/unlock and the landing's `inert`/`aria-hidden` toggling keep their
  semantics (the shell must be inert for the whole session).
- The realm layer must reach `opacity: 0` **before** any teardown stage begins;
  nothing may flash while the layer is still visible.
- `scene.destroy()` + `fluid.dispose()` keep their no-`loseContext` law.
- The unmount must still be guaranteed (a watchdog/timeout backstop if you add
  staging — the exit can never strand the page with a locked body or an invisible
  overlay).
- The orchestrator extends `tests/realm-probe.mjs` with gates from your
  deliverable — list them explicitly under `NEW PROBE GATES:` (they must be
  headless-verifiable; device-only claims go in a separate owner checklist).

## 5. Current code (verbatim — the only context you get)

### 5A. The exit gate (RealmMode.tsx, inside the one empty-deps effect)

```tsx
    // Normal exit:
    //   max(scene completion, layer transition completion) + 150 ms.
    // Watchdog:
    //   explicitly hide at 1,500 ms, then exit after 150 ms.
    const EXIT_SETTLE_MS = 150;
    const EXIT_WATCHDOG_MS = 1500;

    let leaveStarted = false;
    let leaveSceneDone = false;
    let leaveVisualDone = false;
    let exitSent = false;

    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
    let leaveLayer: HTMLDivElement | null = null;

    const clearWatchdog = (): void => {
      if (watchdogTimer !== null) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
    };

    const maybeFinishLeave = (): void => {
      if (
        !alive || !leaveStarted || !leaveSceneDone || !leaveVisualDone ||
        exitSent || exitTimer !== null
      ) return;

      clearWatchdog();
      exitTimer = setTimeout(() => {
        exitTimer = null;
        if (!alive || exitSent) return;
        exitSent = true;
        onExitRef.current();
      }, EXIT_SETTLE_MS);
    };

    const onLeaveTransitionEnd = (event: TransitionEvent): void => {
      if (
        !alive || !leaveStarted ||
        event.target !== leaveLayer ||
        event.propertyName !== "opacity"
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
          if (!alive || exitSent) return;

          // Recovery for a cancelled/missing transition event, changed motion
          // preference, disabled transitions, or a scene that stopped ticking.
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

    leaveGateRef.current = leaveGate;

    const cleanupLeaveGate = (): void => {
      clearWatchdog();

      if (exitTimer !== null) {
        clearTimeout(exitTimer);
        exitTimer = null;
      }

      if (leaveLayer) {
        leaveLayer.removeEventListener(
          "transitionend",
          onLeaveTransitionEnd,
        );
        // Also leave a clean DOM node after Strict Mode effect cleanup.
        leaveLayer.classList.remove("realm--surfacing");
        leaveLayer.style.removeProperty("transition");
        leaveLayer.style.removeProperty("opacity");
        leaveLayer.style.removeProperty("visibility");
      }

      if (leaveGateRef.current === leaveGate) {
        leaveGateRef.current = null;
      }
    };
```

The scene side: `scene.startLeave(entry.x, entry.y)` runs a 0.9s wall-clock vortex
script; when done the scene calls `opts.onPhaseDone("leaving")` → the shell calls
`leaveGate.sceneDone()`. The scene's rAF loop stops after the leave script
(`stop()`).

### 5B. The scene destroy + fluid dispose (realm-scene.ts / realm-fluid.ts)

```ts
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      phase = "done";
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (fluid !== null) fluid.dispose();
      if (ctx2d !== null) ctx2d.clearRect(0, 0, vw, vh);
    },
```

```ts
  dispose(): void {
    if (this.dead) {
      this.canvas.removeEventListener("webglcontextlost", this.onLost);
      return;
    }
    this.dead = true;
    const gl = this.gl;
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.deletePair(this.vel);
    this.deletePair(this.dye);
    this.deletePair(this.pres);
    this.deleteTarget(this.div);
    this.deleteTarget(this.curl);
    if (this.scene) this.deleteTarget(this.scene);
    if (this.bloomA) this.deleteTarget(this.bloomA);
    if (this.bloomB) this.deleteTarget(this.bloomB);
    this.scene = this.bloomA = this.bloomB = null;
    gl.deleteBuffer(this.quad);
    gl.deleteBuffer(this.snowBuf);
    gl.deleteBuffer(this.emitBuf);
    const ps = this.p;
    const all = [ps.copy, ps.advect, ps.curl, ps.vort, ps.div, ps.pres, ps.grad,
      ps.splatVel, ps.splatDye, ps.ink, ps.abyss, ps.snow, ps.emit, ps.prefilter,
      ps.blur, ps.final];
    for (const p of all) gl.deleteProgram(p.prog);
    // do NOT call WEBGL_lose_context here: the context binding is permanent for
    // this canvas element, and react strict-mode remounts (or any reuse) would
    // then only ever see a dead context. the element is dropped with the layer;
    // the browser reclaims the context when it is collected.
  }
```

### 5C. The landing side (LandingPage.tsx)

```tsx
  const handleRealmExit = useCallback(() => {
    realmRestoreFocusRef.current = true;
    setRealmOpen(false);
  }, []);
```

The shell wraps everything: `<div className="signal-index-shell"
aria-hidden={realmOpen || undefined} inert={realmOpen || undefined}>` — the cards
live inside it. LandingPage also owns the body attribute
(`:root[data-signal-index] { background-color: #0b1317 }`) for its whole lifetime.

### 5D. The exit CSS (realm.css)

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

### 5E. The card layer family on the landing (styles.css)

```css
.signal-index-card { /* border-radius panel, background #0b1317, 1px border */ }

.project-artwork-object {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transform-style: preserve-3d;
  transform:
    perspective(600px)
    rotateX(var(--art-rotate-x, 0deg))
    rotateY(var(--art-rotate-y, 0deg))
    translate3d(var(--art-shift-x, 0px), var(--art-shift-y, 0px), 0);
  transition: transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1);}

@media (prefers-reduced-motion: no-preference) {
  .project-artwork-center svg { animation: gem-breathe 4s ease-in-out infinite; }
  /* + per-card animation-delay 0s..2.8s */
  .presentation-raft-cluster .gem-halo,
  .presentation-planck-to-now .gem-halo,
  .presentation-spine .gem-halo {
    animation: gem-halo-pulse 4s ease-in-out infinite;}
}
```

## 6. Deliverable

One reply containing, in this order:

1. The full shown reasoning chain (§3), ending with
   `COMMITTED: <one-line name of the direction>`.
2. The exact code changes as **complete replacement blocks** — for each touched
   region, quote the verbatim current lines (from §5) and give the verbatim
   replacement. No "…" elisions inside code. New timers/refs/flags must be declared
   in the replacement blocks, and every cleanup path must be shown.
3. A short list titled `NEW PROBE GATES:` naming the headless-verifiable gates the
   orchestrator should add (one line each, as probe `check()` names), plus a short
   `OWNER DEVICE CHECK:` list of what only a real iPhone can confirm.

Integration (not your job, for context): the orchestrator splices the edits, runs the
type check, production build, the 50-gate probe with your new gates, and burst-captures
the exit at desktop + iPhone viewports for the owner; the owner re-checks the flash on
a real device.
