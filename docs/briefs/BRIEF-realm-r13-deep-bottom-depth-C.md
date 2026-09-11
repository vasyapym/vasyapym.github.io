# BRIEF — realm r13, part 3 of 3: exact code

Fresh context per relay. Your committed direction and CHANGE SPEC are in §0 (your own part-2 output). §1 has the verbatim current code for every region you marked NEEDS. Output replacement blocks + gates + device list. No new reasoning; do not re-litigate.

## 0. Your part-2 conclusion

**COMMITTED: deepfloor-frame** — D1: `world.anchorH = vh*2` (frozen anchor span, `ANCHOR_SPAN_K=2`), `world.deep = round(vh*0.5)` (`DEEP_K=0.5`), `world.h = anchorH + deep`; anchors resolve `fy·world.anchorH`; camera range/walls/clamps track `world.h`. D2: `frameSelection(id)` retargets camY (exponential −3.2, bypasses follow while active, reduced/degraded = instant, KEEP on close, yields to `startDive`); desktop side-flip via `pickSide(id)` → `data-side="left|right"` on the stationary sheet wrapper + `data-panel-side` on the realm root; dev-only `getDepthSnapshot()/getFrameSnapshot()` under `window.__r13`.

**Your CHANGE SPEC (verbatim):**

```
realm.tsx            | consts                | + ANCHOR_SPAN_K=2, DEEP_K=0.5, FRAME_K=3.2, FRAME_EPS=0.5, CHROME={hudD:64,capD:64,hudM:56,sheetTopM:0.52,padM:8}, SHEET_MAX=480
realm.tsx            | resize()              | world.anchorH=vh*2; world.deep=Math.round(vh*0.5); world.h=anchorH+deep; worldChanged=(w!==world.w||anchorH!==world.anchorH); camY=clamp(camY,0,world.h-vh); lan.y=clamp(lan.y,0,world.h); if(frame.active) frame.target=computeFrameTarget(frame.doorId)
realm.tsx            | rAF camera step       | if(frame.active){camY+=(frame.target-camY)*(1-Math.exp(-3.2*dt)); if(|d|<0.5){camY=frame.target;frame.settled=true}} else <existing follow>; camY=clamp(camY,0,world.h-vh)
realm.tsx            | lantern soft walls    | lan.y=clamp(lan.y,0,world.h)  (replace vh*2 literal)
realm.tsx            | frameSelection(id)    | NEW: band = desktop?[64,vh-64]:[56,0.52*vh-8]; bandCy=(t+b)/2; ay=fy*world.anchorH; frame.target=clamp(ay-((bandCy-vh/2)/zoom+vh/2),0,world.h-vh); if(reduced||degraded){camY=frame.target;settled=true}; frame.active=true
realm.tsx            | pickSide(id)          | NEW: sheetW=Math.min(480,0.92*vw); ax=fx*vw; r=Math.min(vw,vh)*0.28; left=(ax-r)-sheetW; right=(vw-sheetW)-(ax+r); side=(vw>520&&left>right&&left>0)?'left':'right'
realm.tsx            | openProjectPanel(id)  | after setLanternHold(true)+startGreeting(id): side=pickSide(id); wrapperRef.dataset.side=side; rootRef.dataset.panelSide=side; frameSelection(id)
realm.tsx            | closeProjectPanel()   | frame.active=false only (camY retained, no return sweep); clear data-side/data-panel-side on transitionend
realm.tsx            | startDive()           | frame.active=false before zoom ramp
realm.tsx            | warpTo(id)            | target=clamp(fy*world.anchorH - vh/2, 0, world.h - vh)   // d7@1440: 1170
realm.tsx            | resetForEnter()       | camY=0; frame.active=false; lan.y=clamp(lan.y,0,world.h); any world.h*k seed -> world.anchorH*k
realm.tsx            | dev snapshots         | + getDepthSnapshot(), getFrameSnapshot() (prealloc objects, fields per 4f); prod null; window.__r13 in dev only
realm-creatures.ts   | Creature.update       | ay = fy*world.anchorH (was fy*world.h); ax unchanged
realm-creatures.ts   | shiftState()          | dy = fy*(anchorH_new - anchorH_old); dx = fx*(w_new - w_old)
realm-creatures.ts   | greeting/lure/pick    | anchor resolve fy*world.h -> fy*world.anchorH (greeting centre, lure target, markPickAnchor)
realm.css            | .sheet                | + .sheet[data-side="left"]{left:0;right:auto;border-left:none;border-right:1px solid var(--seam);box-shadow:2px 0 32px #000a}
realm.css            | .legend               | + [data-panel-side="left"] .legend{transform:translateX(calc(min(30rem,92%) + 1rem))}
realm.css            | @media (max-width:520px) | + .sheet[data-side]{left:0;right:0;top:52%;height:48%} ; [data-panel-side] .legend{transform:none}
```

**Real repo names (map your generic names to these when writing code):**
- `realm.tsx` = `realm-scene.ts` (world/camera/lantern/warp/reset/snapshots live here) + `RealmMode.tsx` (panel open/close + DOM attributes). Split your rows accordingly.
- `.sheet` = `.realm-panel` (the stationary wrapper is `<div ref={panelRef} className="realm-panel" role="document">`); `.legend` = `.realm-legend`; caption = `.realm-caption`; realm root = `.realm-layer`. Real variables: `--ink-line`, `--panel-radius` (no `--seam` token exists — use `var(--ink-line)`).
- React idiom: set `data-side` / `data-panel-side` as **JSX props** (`data-side={side ?? undefined}`), not imperative `dataset` writes; on close you may simply stop rendering the attribute (React removes it) — or keep your transitionend clearing if the fade needs it.
- Scene API additions (`frameSelection`, `pickSide` can live inside the scene; RealmMode calls `sceneRef.current?.frameSelection(id)` from `openProjectPanel`) must be added to the `RealmScene` interface + the returned `scene` object.
- `gates/r13.spec` = the probe: output your gates in the reply's `NEW PROBE GATES:` section (tests/realm-probe.mjs, `check(name, ok, detail)` + `until(page, fn, ms)` polling).

## 1. Verbatim current code (the NEEDS regions)

### realm-scene.ts — world/cam state + consts anchor table

```ts
const ANCHORS: readonly { readonly fx: number; readonly fy: number }[] = [
  { fx: 0.25, fy: 0.26 },
  { fx: 0.68, fy: 0.3 },
  { fx: 0.46, fy: 0.48 },
  { fx: 0.8, fy: 0.55 },
  { fx: 0.2, fy: 0.68 },
  { fx: 0.52, fy: 0.78 },
  { fx: 0.76, fy: 0.9 },
];
```

```ts
  const world = { w: 1, h: 2 };
  const cam: MutableCamera = { camX: 0, camY: 0, zoom: 1, vw: 1, vh: 1 };
  let camYState = 0;       // spring state without sway
  let camVy = 0;           // px/s, fed to fluid.globalDrift
  let sway = 0;
```

### realm-scene.ts — resize() (full)

```ts
  function resize(): void {
    // the only place layout is read
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const d = Math.min(2, window.devicePixelRatio || 1);
    const worldChanged = w !== vw || Math.abs(h - vh) > vh * 0.2;
    vw = w;
    vh = h;
    dpr = d;
    diag = Math.hypot(vw, vh);
    world.w = vw;
    world.h = vh * 2;
    cam.vw = vw;
    cam.vh = vh;
    interactR = Math.min(vw, vh) * 0.28;
    lanternBaseR = Math.min(vw, vh) * 0.055;

    overlay.width = Math.round(vw * dpr);
    overlay.height = Math.round(vh * dpr);
    if (ctx2d !== null) {
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.font = FONT;
      ctx2d.textBaseline = "middle";
    }
    if (fluid !== null) fluid.resize(vw, vh, dpr);

    if (worldChanged || creatures.length === 0) {
      // creature radius is readonly by contract, so a real geometry change rebuilds them
      buildCreatures();
    }
    lan.x = clamp(lan.x, 0, world.w);
    lan.y = clamp(lan.y, 0, world.h);
    camYState = clamp(camYState, 0, world.h - vh);
    invalidateSceneContinuity();
  }
```

### realm-scene.ts — updateCamera() (full)

```ts
  function updateCamera(dt: number): void {
    const range = Math.max(0, world.h - vh);
    let target = camYState;
    let rate = 8;
    if (phase === "diving" && diveIdx >= 0 && !reduced) {
      // camera accelerates toward the chosen creature
      target = creatures[diveIdx].y - vh * 0.5;
      rate = 8 + 16 * clamp(phaseT / DIVE_MS, 0, 1);
    } else {
    const calmTouch = small && phase === "active" && !reduced;
    const half = small ? (calmTouch ? vh * 0.12 : 0) : vh * 0.18;
    if (calmTouch) rate = 6;
    const centre = camYState + vh * 0.5;
      if (lan.y < centre - half) target = lan.y + half - vh * 0.5;
      else if (lan.y > centre + half) target = lan.y - half - vh * 0.5;
    }
    target = clamp(target, 0, range);
    const before = camYState;
    if (phase === "idle") {
      camYState = target;
    } else {
      camYState += (target - camYState) * (1 - Math.exp(-rate * dt));
    }
    camVy = dt > 0 ? (camYState - before) / dt : 0;

    if (!reduced) {
      sway += dt;
      cam.camY = camYState + Math.sin(sway * Math.PI * 2 * 0.1) * 4;
    } else {
      cam.camY = camYState;
    }
    cam.camX = 0;

    if (phase === "diving" && !reduced) {
      const t = clamp(phaseT / DIVE_MS, 0, 1);
      cam.zoom = diveFromZoom + (1.22 - diveFromZoom) * t * t;
    } else if (phase !== "diving") {
      cam.zoom = 1;
    }
  }
```

### realm-scene.ts — lantern soft walls (tail of updateLantern)

```ts
    // A hold must also bypass positional correction at the soft walls.
    if (!lanternHeld) {
      if (lan.x < 0) { lan.x = 0; lvx = Math.abs(lvx) * 0.4; }
      if (lan.x > world.w) { lan.x = world.w; lvx = -Math.abs(lvx) * 0.4; }
      if (lan.y < 0) { lan.y = 0; lvy = Math.abs(lvy) * 0.4; }
      if (lan.y > world.h) { lan.y = world.h; lvy = -Math.abs(lvy) * 0.4; }
    }
    speed = Math.hypot(lvx, lvy);
    lan.r = lanternBaseR * breath;
    lan.intensity = breath * ignite;
```

### realm-scene.ts — warpTo / startDive / resetForEnter (full)

```ts
    warpTo(index) {
      if (phase !== "active") return;
      const i = Math.trunc(index);
      if (i < 0 || i >= creatures.length) return;
      const c = creatures[i];
      lan.x = clamp(c.x, 0, world.w);
      lan.y = clamp(c.y - interactR * 0.6, 0, world.h);
      lvx = 0;
      lvy = 0;
      camYState = clamp(lan.y - vh * 0.5, 0, Math.max(0, world.h - vh));
      cam.camY = camYState;
      camVy = 0;
      lanSx = sx(lan.x);
      lanSy = sy(lan.y);
      prevSx = lanSx;
      prevSy = lanSy;
      invalidateSceneContinuity();
      idleT = 0;
    },
```

```ts
    startDive(id) {
      if (destroyed || phase !== "active") return;
      const idx = findIdx(id);
      if (idx < 0) return;
      applyLanternHold(false);
      diveIdx = idx;
      diveFromZoom = cam.zoom;
      ptrActive = false;
      calling = false;
      invalidateSceneContinuity();
      finishPhase("diving");
      start();
    },
```

```ts
  function resetForEnter(): void {
    lan.x = vw * 0.5;
    lan.y = vh * 0.1;
    lvx = 0;
    lvy = 0;
    speed = 0;
    ignite = 0;
    breath = 0.75;
    breathTarget = 0.75;
    camYState = 0;
    cam.camY = 0;
    cam.zoom = 1;
    camVy = 0;
    idleT = 0;
    lure = 0;
    splashIdx = 0;
    coverDone = false;

    invalidateSceneContinuity();
    lastTickWall = -1;
    pickTouch = null;

    hintAlpha = 0;
    activeT = 0;
    lastNearestId = null;
    lanSx = sx(lan.x);
    lanSy = sy(lan.y);
    prevSx = lanSx;
    prevSy = lanSy;
  }
```

### realm-scene.ts — markPickAnchor + pick geometry (full; note it stores SCREEN coords via sx/sy of the creatures' live x/y)

```ts
  function markPickAnchor(touch?: boolean): void {
    pickAnchorValid = false;
    pickTouch = touch ?? small;
    if (phase !== "active") return;

    for (let i = 0; i < creatures.length; i++) {
      pickAnchorX[i] = sx(creatures[i].x);
      pickAnchorY[i] = sy(creatures[i].y);
    }
    pickAnchorZoom = cam.zoom;
    pickAnchorTime = performance.now();
    pickAnchorValid = true;
  }
```

### realm-scene.ts — dev snapshot style to mirror + scene API additions

```ts
    getLanternSnapshot() {
      if (!import.meta.env.DEV) return null;
      return {
        x: lan.x,
        y: lan.y,
        vx: lvx,
        vy: lvy,
        speed,
        held: lanternHeld,
        pointerActive: ptrActive,
      };
    },
```

The `RealmScene` interface + returned `scene` object expose methods in this style; add yours to both. Relevant interface fragment:

```ts
export interface RealmScene {
  startEnter(chipX: number, chipY: number): void;
  startLeave(chipX: number, chipY: number): void;
  startDive(id: string): void;
  startGreeting(id: string): void;
  setPointer(x: number, y: number, active: boolean): void;
  setThrust(x: number, y: number): void;
  setLanternHold(hold: boolean): void;
  getLanternSnapshot(): Readonly<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    speed: number;
    held: boolean;
    pointerActive: boolean;
  }> | null;
```

### RealmMode.tsx — selection open/close + dive (full callbacks)

```tsx
  const openProjectPanel = useCallback((id: string) => {
    if (phaseRef.current !== "active") return;
    sceneRef.current?.setLanternHold(true);
    setOpenId(id);
    sceneRef.current?.startGreeting(id);
    audioRef.current?.greeting(id);
  }, []);
```

```tsx
  const closePanel = useCallback(() => {
    resetDirectInputRef.current?.();
    sceneRef.current?.setLanternHold(false);
    panelStopRef.current?.(); // cancels entrance frames + delayed focus, hides now
    setOpenId(null);
    layerRef.current?.focus({ preventScroll: true }); // esc-chain step one returns focus to the layer
  }, []);
```

```tsx
  const confirmDive = useCallback((id: string) => {
    if (phaseRef.current !== "active") return;
    resetDirectInputRef.current?.();
    cancelRealmGestureRef.current?.(); // an in-flight hold must not survive the dive
    phaseRef.current = "diving";
    setDivingId(id);
    setPhase("diving");
    sceneRef.current?.startDive(id);
    audioRef.current?.dive();
  }, []);
```

### RealmMode.tsx — the realm root + stationary sheet wrapper JSX (where data-side / data-panel-side go)

```tsx
    <div
      ref={layerRef}
      className={
        "realm-layer realm-exit-layer" +
        (degraded ? " realm-layer--degraded" : "") +
        (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
          ? " realm-reduced" : "")
      }
      role="dialog"
```

```tsx
      {/* persistent panel: wrapper always mounted with pinned geometry;
          content is conditional; inert/aria-hidden/is-open are owned by the
          entrance layout effect, never by React state on this wrapper. */}
      <div ref={panelRef} className="realm-panel" role="document">
```

### RealmMode.tsx — dev exposure pattern (where __r13 would go)

```tsx
    sceneRef.current = scene;
    if (import.meta.env.DEV) {
      (window as Window & { __realmScene?: typeof scene }).__realmScene = scene;
    }
    setDegraded(scene.qualityLevel() === -1);
```

### realm-creatures.ts — Creature.update anchor placement (full block)

```ts
  update(c: CreatureContext): void {
    // discard hidden-tab catch-up; never let a scene clock reset reposition a body.
    this.step = Number.isFinite(c.dt) ? clamp(c.dt, 0, 0.05) : 0;
    this.discontinuity = !this.placed || !Number.isFinite(c.dt)
      || c.dt <= 0 || c.dt > 0.1 || c.time < this.prevSceneTime;
    this.prevSceneTime = c.time;

    const nax = this.fx * c.world.w, nay = this.fy * c.world.h;
    if (!this.placed) {
      this.ax = nax; this.ay = nay;
      this.cx = nax; this.cy = nay; this.x = nax; this.y = nay;
      this.placed = true;
      this.placeStart(c);
    } else if (nax !== this.ax || nay !== this.ay) {
      // resize changes geography, not local motion; translate world-space caches too.
      const sx = nax - this.ax, sy = nay - this.ay;
      this.ax = nax; this.ay = nay;
      this.cx += sx; this.cy += sy; this.x += sx; this.y += sy;
      this.shiftState(sx, sy);
      this.discontinuity = true;
    }
```

Note: greeting/lure/pick logic all read `this.ax`/`this.ay` — the one resolve line above covers them; `markPickAnchor` (scene) reads the creatures' live `x/y` and maps through `sx/sy` — no fy resolve there.

### realm-creatures.ts — shiftState signature + one species override example

```ts
  protected shiftState(_dx: number, _dy: number): void { /* optional world-cache translation */ }
```

```ts
  protected shiftState(dx: number, dy: number): void {
    for (let i = 0; i < this.N; i++) {
      this.nx[i] += dx; this.ny[i] += dy;
      this.gsx[i] += dx; this.gsy[i] += dy;
    }
  }
```

### realm.css — .realm-panel (desktop, full block through its closed/leaving guards)

```css
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

  padding: 4rem 1.3rem calc(1.4rem + env(safe-area-inset-bottom, 0px));
  background: #04080b;
  border: 0;
  border-left: 1px solid var(--ink-line);

  overflow: hidden;
  cursor: auto;

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
```

### realm.css — .realm-legend (full)

```css
.realm-legend {
  position: absolute;
  bottom: calc(0.9rem + env(safe-area-inset-bottom));
  left: calc(1rem + env(safe-area-inset-left));
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  max-width: 40vw;
}
```

### realm.css — the mobile @media block (full)

```css
@media (max-width: 520px) {
  .realm-layer {
    top: var(--realm-visible-top, 0px);
    bottom: auto;
    height: 100vh;
    height: 100dvh;
    height: var(--realm-visible-height, 100dvh);
  }

  .realm-layer .realm-panel {
    top: 52%;
    right: 0;
    bottom: 0;
    left: 0;

    box-sizing: border-box;
    width: 100%;
    height: 48%;
    min-height: 0;
    max-height: 48%;

    padding: 4rem 1.3rem calc(1.4rem + env(safe-area-inset-bottom, 0px));
    border: 0;
    border-top: 1px solid var(--ink-line);
  }

  .realm-legend {
    right: calc(1rem + env(safe-area-inset-right));
    max-width: none;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-right: 2rem; /* last door scrolls clear */
    scrollbar-width: none;
  }
  .realm-legend::-webkit-scrollbar { display: none; }
  .realm-legend-btn { flex: 0 0 auto; }

  .realm-caption { display: none; } /* avoids colliding with the strip */
}
```

## 2. Deliverable

1. Replacement blocks — for each §0 spec line: verbatim current lines → verbatim replacement. No `…` inside code; every consumer of a changed value shown. New functions/constants in full.
2. `NEW PROBE GATES:` — one line each (`check()` name + body), headless-verifiable: legend selection (`.realm-legend-btn[i]`), mouse/touch, keyboard (`1`–`7`, `w/a/s/d`, Escape), DOM rects (`.realm-panel`/`.realm-legend`/`.realm-hud`/`.realm-caption`), `window.__realmScene.getLanternSnapshot()` + your `window.__r13` getters, `until(page, fn, ms)`. Name any existing gate whose body must change.
3. `OWNER DEVICE CHECK:` — one line per item.
