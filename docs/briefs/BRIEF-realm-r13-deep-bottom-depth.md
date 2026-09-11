# BRIEF — realm r13, deliverable: deeper scene floor + the selected creature's animation clears the chrome

Relay brief for the chat model. You have **full design and code autonomy** — no
approval gates, no clarifying questions, no per-decision sign-offs. Choose the
mechanism yourself. The only thing we require is that your reasoning is shown in
full, at the depth specified in §4, **before** the deliverable. Superficial
output will be rejected. If a fact you need is missing, derive the safest
assumption, state it in one line, and proceed.

---

## 1. Situation

### Owner report (verbatim)

> "2. In 'the deep' mode, projects near the bottom are clickable, but the
> project creature animation that should play after clicking is not visible.
> This appears to be caused by two things:
> The project description overlaps the area where the animation would display.
> There is not enough scrollable space below for the light/cursor to reach far
> enough down to properly view those bottom projects.
> Please add more vertical space at the bottom of the scene so the cursor can
> travel further down."

### The scene's geometry (mechanism-verified, `realm-scene.ts`)

"The deep" is a world-column the camera pans vertically through:

- Coordinate contract (shared with `realm-creatures.ts`, verbatim from the file
  header): "world px: origin top-left of a (vw × 2vh) column; camX is always 0.
  screen px = (world − cam − half viewport) × zoom + half viewport".
- The world is **exactly two viewport heights**: `world.h = vh * 2` (set in
  `resize()`).
- The camera range is therefore `[0, world.h − vh]` = `[0, vh]` — **the camera
  can never scroll deeper than one viewport**; there is no world below 2vh.
- The seven creature anchors (catalogue order, fractions of the world column):

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

At maximum camera scroll (`camY = vh`) the bottom creature (door 7,
practice-map, fy 0.9 → world y 1.8vh) sits at **80% of the viewport height**,
and door 6 (planck-to-now, fy 0.78 → 1.56vh) at 56%. The camera cannot push
them any higher on screen — the range is exhausted.

- Creature anchor law (`realm-creatures.ts`, `Creature.update`, verbatim):

```ts
    const nax = this.fx * c.world.w, nay = this.fy * c.world.h;
```

Anchors are **fractions of `world.h`** — if `world.h` grows, every anchor moves
DOWN proportionally unless the mapping is decoupled. A resize rebuilds the
creatures when the height change is real (`resize()`: `worldChanged = w !== vw
|| Math.abs(h - vh) > vh * 0.2`), and each species translates its cached state
on anchor moves. Creatures wander within a leash of ≤ ~0.8 × `radius` around
the anchor (`placeLive` knee).

- Lantern soft walls + camera clamp (verbatim, `updateLantern` /
  `resize`):

```ts
    // A hold must also bypass positional correction at the soft walls.
    if (!lanternHeld) {
      if (lan.x < 0) { lan.x = 0; lvx = Math.abs(lvx) * 0.4; }
      if (lan.x > world.w) { lan.x = world.w; lvx = -Math.abs(lvx) * 0.4; }
      if (lan.y < 0) { lan.y = 0; lvy = Math.abs(lvy) * 0.4; }
      if (lan.y > world.h) { lan.y = world.h; lvy = -Math.abs(lvy) * 0.4; }
    }
```

```ts
    lan.x = clamp(lan.x, 0, world.w);
    lan.y = clamp(lan.y, 0, world.h);
    camYState = clamp(camYState, 0, world.h - vh);
```

- Camera follow (`updateCamera`, verbatim core):

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
```

The lantern chases the pointer's world position:
`ty = (ptrY − vh*0.5) / zoom + camY + vh*0.5` (desktop spring, k=132.25,
critically damped; reduced motion: softened direct follow; touch input lifts
the target by `1.6 × lightRadius` via the shell's `lifted()`).

### The selection flow and the chrome that covers it (mechanism-verified)

Selecting a creature (canvas tap, legend button, keyboard `e`/Enter-on-legend)
runs `RealmMode.openProjectPanel(id)` (verbatim):

```tsx
  const openProjectPanel = useCallback((id: string) => {
    if (phaseRef.current !== "active") return;
    sceneRef.current?.setLanternHold(true);
    setOpenId(id);
    sceneRef.current?.startGreeting(id);
    audioRef.current?.greeting(id);
  }, []);
```

- `setLanternHold(true)` **parks the lantern** (r10 law: exact positional hold,
  zero velocity, bypasses spring/drag/thrust/soft-walls until release).
- `startGreeting(id)` starts the creature's **greeting animation** — it renders
  around the creature's anchor: raft forms a row, kitty speeds up its loop with
  two hops, explosion detonates radially, spine morphs its layouts, forest
  exhales three expanding rings (radius up to ~1.75 × `radius` ≈ 440 px at
  900vh transient), planck runs singularity→inflation→collapse, map threads
  star pulses. The scene drives the greeting clock (`ctx.greeting`, one-shot,
  forgotten after 6 s).

The panel (the "project description") is opaque near-black chrome that
**permanently covers a fixed region of the screen** while open:

- Desktop (`realm.css`): `top: 0; right: 0; bottom: 0; left: calc(100% −
  min(30rem, 92%));` width `min(30rem, 92%)`, **full height**, background
  `#04080b` (the abyss), `z-index: 70`.
- Mobile (≤520px): bottom sheet — `top: 52%; right: 0; bottom: 0; left: 0;`
  `height: 48%` (of the visible viewport, tracked via `--realm-visible-*`),
  opaque, full width.

Other permanent chrome: hud (top-right buttons), legend (bottom-left door
buttons; a scrollable strip on mobile), caption (bottom-right, desktop only).

**The failure, mechanism-verified:**

- Desktop 1440×900: door 7's anchor screen x = 0.76·vw = 1094 px; the sheet's
  left edge = 1440 − 480 = 960 px. The anchor — and its entire greeting
  footprint — sits **behind the opaque right sheet** on any viewport narrower
  than ~2000 px. On a 1024 px-wide window the sheet starts at ~53% and covers
  BOTH door 6 and door 7.
- Mobile 390×844: the sheet covers y from 52% down. The bottom creatures sit at
  ≥80% viewport height at max scroll (the camera range is exhausted at
  `camY = vh`) — they are **permanently inside the sheet's band while selected
  and cannot be scrolled above it**, because there is no world below 2vh for
  the camera to scroll into.
- So the owner's two causes are exactly right: the description covers the
  animation's region, and the world lacks the depth that would let the
  light/cursor (and the camera) reach further down and lift the bottom
  creatures into the clear.

### Context you need from r12 (just landed)

The deep can now be entered **over the project page** (the deep-return flow):
`App.tsx` mounts a RealmMode above an inert wrapper while a project route is
still rendered, and swaps to the landing under the opaque cover. **Your
changes must not care which tree mounts the realm** — RealmMode/realm-scene
behave identically in both. Do not touch the r12 routing mechanism.

### Verbatim current code (the regions your design will touch)

`realm-scene.ts` — viewport/world/resize (verbatim):

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

`realm-scene.ts` — dive + warp (verbatim):

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

`realm-scene.ts` — camera sway + zoom tail of `updateCamera` (verbatim):

```ts
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
```

`realm-creatures.ts` — the anchor re-mapping on resize (verbatim):

```ts
    } else if (nax !== this.ax || nay !== this.ay) {
      // resize changes geography, not local motion; translate world-space caches too.
      const sx = nax - this.ax, sy = nay - this.ay;
      this.ax = nax; this.ay = nay;
      this.cx += sx; this.cy += sy; this.x += sx; this.y += sy;
      this.shiftState(sx, sy);
      this.discontinuity = true;
    }
```

`RealmMode.tsx` — panel close (verbatim):

```tsx
  const closePanel = useCallback(() => {
    resetDirectInputRef.current?.();
    sceneRef.current?.setLanternHold(false);
    panelStopRef.current?.(); // cancels entrance frames + delayed focus, hides now
    setOpenId(null);
    layerRef.current?.focus({ preventScroll: true }); // esc-chain step one returns focus to the layer
  }, []);
```

### Probe facts

`tests/realm-probe.mjs` (105 gates, headless Chromium via `CHROME_PATH`) can:
drive the mouse (move/down/up with steps), touchscreen (touchStart/touchEnd),
keyboard (digits `1`–`7` → `warpTo`, `w/a/s/d`/arrows → thrust, `e`/Enter/
Escape), read `window.__realmScene.getLanternSnapshot()` (dev-only, prod null),
read any DOM rect (`getBoundingClientRect`) including `.realm-panel`,
`.realm-legend`, `.realm-hud`, `.realm-caption`, take screenshots, and poll
with `until(page, fn, ms)`. It selects creatures deterministically via legend
buttons (`.realm-legend-btn[i]`) without needing to drag the light to them.
The existing probe comments document the anchor mapping: "creature 0 anchor:
(0.25·vw, 0.26·2vh) at zoom 1, cam 0" — i.e. creature 6 at 1440×900 with
camY = vh sits at screen y = 0.8·vh.

If your design needs creature/camera positions in gates, add a **dev-only
snapshot getter** in the same style as `getLanternSnapshot()` (returns null in
production builds; no per-frame React state).

## 2. Goal

**Primary:** after selecting **any** of the seven creatures — from any entry
path (canvas tap, legend button, keyboard) — the creature and its
greeting/selection animation must be **visible**: not covered by the panel,
legend, hud, or caption, on **desktop 1440×900** and **mobile 390×844**
(+ the 2560×1440 regression width stays fine).

**The owner's explicit ask (mandatory):** add more vertical space at the
bottom of the scene so the cursor/light can travel further down — the world
must become deeper than today's 2vh, the camera must be able to scroll into
that depth, and the bottom creatures must be liftable high enough on screen
that the mobile bottom sheet (top edge at 52%) and the desktop legend/caption
band stop covering them. State the extra depth as a concrete value with the
arithmetic that justifies it (e.g. at 390×844, at max scroll the fy-0.9 anchor
must sit at ≤ ~42% viewport height with the greeting band clear of the sheet).

**Fixing the overlap** (the panel covering the selected creature's animation)
is yours to design: a camera adjustment on selection, a panel-side change, a
viewport-aware selection law, or something better — as long as the invariant
holds for all seven creatures on both viewport classes.

## 3. Invariants (violations reject the work)

- **Geography law:** the seven creatures keep their current relative layout.
  Added depth goes **below** the existing anchor space; do not re-space or
  re-anchor the creatures as a side effect of growing the world. If your
  design must move an anchor, justify it explicitly against the owner's ask.
- The r10 lantern hold stays exact: selecting parks the lantern at its
  pre-selection point in **world** coordinates; any camera adjustment you add
  moves the view, never the parked lantern (no teleport, held coordinates
  exact across frames, release preserves them).
- Do not regress: the dive camera (accelerate toward the creature, zoom
  1→1.22), the pick anchor system (`markPickAnchor` / `pickAt`, the 450 ms
  anchor window), the touch `lifted()` offset, keyboard `warpTo` (1–7) and
  thrust, the proximity-greeting arbitration (latch set, 25% exit hysteresis,
  drop-on-busy), the lure/idle system, wake/trail continuity
  (`invalidateSceneContinuity` on teleports), the overlay name/pick-cue
  culling, the reduced-motion paths (direct follow, settled), the degraded
  (no-WebGL) renderer, the r9 panel/sheet laws (stationary wrapper frame,
  keyed inner scroll body, dive button reachable above the safe-area pad,
  panel bg #04080b), the r10 exit/unlock choreography, and the r12
  project-backed return.
- The lantern soft walls, the camera clamp, and `resetForEnter` must stay
  consistent with the new depth (nothing below the world floor, no camera
  overshoot past the new range, no stale clamp after a resize).
- One rAF loop; update/emit allocate nothing; no per-frame React state; every
  listener/timer released in its cleanup; Strict-safe.
- No new sounds (greeting stays silent — audio is selection-owned); no new DOM
  chrome; no blur/glow/loops; `--ink-*` tokens, lowercase mono, 1px hairlines
  if any DOM is touched at all.
- The panel's own geometry (r9) stays as shipped unless your design moves it —
  if it does, justify against the mobile sheet law and the probe's sheet gates.

## 4. Reasoning protocol (mandatory, shown in your reply)

1. **Restate** the failure in your own words: the world column is exactly 2vh
   so the camera tops out with the bottom creatures at ≥80% screen height,
   inside the covered band on mobile and behind the right sheet on desktop;
   the greeting animation therefore plays where it cannot be seen.
2. **Generate wide:** at least **5 materially distinct directions**. Sketch
   territory (mechanism + what the visitor experiences, 2–4 sentences each):
   decouple the anchor mapping from the world depth (anchors keep mapping to
   the current 2vh; extend `world.h` below them for camera range + lantern
   walls); re-space the ANCHORS themselves; a selection camera nudge (camY,
   and/or a **bounded** camX — note `camX` is locked at 0 by the documented
   contract today, so enabling it means updating the contract and auditing
   every consumer: sx/sy, pick anchors, culling, trail, fluid lantern, wake
   splats, degraded disc); nudging the LANTERN instead of the camera; moving
   or resizing the panel per selection; making the sheet translucent over the
   scene; something better.
3. **Prune in the open:** kill directions against explicit criteria — §3
   invariants (geography law, hold exactness, sheet law), the overlap being
   horizontal on desktop (a camY-only nudge cannot clear a right-side sheet —
   say what DOES), the transient greeting footprints (forest rings ~1.75 ×
   radius), reduced motion (no drama, settled), the degraded renderer, blast
   radius on the dive/leave phases that reuse the camera, and the probe's
   verifiability. Say why each dies. Keep the strongest 1–2.
4. **Develop to depth:** for the survivor(s) state **every concrete value** —
   the extra depth constant and its arithmetic for BOTH viewport classes
   (mobile 390×844: sheet top at 52%; desktop 1440×900: legend/caption band ≈
   bottom 4rem + the sheet's left edge at vw − min(30rem, 92%)); exactly where
   the anchor mapping is decoupled (which file, which lines, the new mapping
   formula); the camera-range/lantern-wall clamp updates (which lines); the
   selection nudge: trigger (which callback), the target formula (in world
   coordinates, in terms of the creature anchor, the covered region, and the
   viewport — not prose), the easing/rate, what happens on panel close
   (return vs keep — say which and why), how it composes with the r10 hold
   (lantern world coords untouched), the reduced-motion behavior (instant or
   settled — pick), the degraded path, and any dev-only snapshot getter you
   add for the gates (name + shape). No placeholders, no "adjust to taste".
5. **Stress-test:** walk the survivor through: select each of the seven on
   desktop 1440×900 → creature + greeting clear of sheet/legend/hud/caption;
   select doors 6 and 7 on mobile 390×844 → both clear of the sheet after the
   nudge settles; deep-scroll first, then select the bottom creature (nudge
   from an already-deep camY must clamp correctly); hold + nudge → the parked
   lantern's world coordinates exact across frames (no teleport);
   close-panel → name the camera outcome and prove no visible snap; dive from
   a nudged camera (startDive targets the creature from the current camYState);
   warpTo 7 → select → nudge clamps; reduced-motion select (settled, no
   spring); degraded renderer select; a resize (crossing the vh*0.2 rebuild
   rule) mid-session with the anchors stable relative to the fixed base;
   the r12 return-then-select flow (restored realm over the project page,
   then select door 7 — same behavior); pick anchors across the nudge
   (markPickAnchor before release, camera moves after). Name what could
   break and why it doesn't.
6. **Rank and commit:** one paragraph, then the deliverable. You decide — do
   not end with options, do not ask for approval.

## 5. Deliverable

One reply containing, in this order:

1. The full shown reasoning chain (§4), ending with
   `COMMITTED: <one-line name of the direction>`.
2. The exact code changes as **complete replacement blocks** — for each touched
   region, quote the verbatim current lines (from §1's quoted code, or anchor
   with the nearest quoted region + a one-line description) and give the
   verbatim replacement. No `…` elisions inside code. Every affected consumer
   of the changed values must be shown (clamps, camera, walls, anchors,
   contracts/comments).
3. A short list titled `NEW PROBE GATES:` naming the headless-verifiable gates
   the orchestrator should add to `tests/realm-probe.mjs` (one line each, as
   probe `check()` names + body), plus any existing gate whose body must
   change (name it + the replacement).
4. A short `OWNER DEVICE CHECK:` list of what only a real device can confirm.

## 6. Integration (not your job, for context)

The orchestrator splices the edits, runs `tsc --noEmit`, the production build,
and the probe (105 + your gates) three times, commits and pushes; the owner
re-checks the deep's bottom reach + greeting visibility on real devices
(iPhone reachability feel, iPad/desktop cursor depth, reduced motion).
