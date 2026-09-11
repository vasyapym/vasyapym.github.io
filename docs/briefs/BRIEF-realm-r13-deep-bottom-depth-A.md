# BRIEF — realm r13, part 1 of 3: diagnose, generate wide, prune

Relay brief for the chat model. You have **full design and code autonomy** — no
approval gates, no clarifying questions, no per-decision sign-offs. This is
**part 1 of a 3-part relay**: this part produces **reasoning only — no code**.
Part 2 (develop to depth + stress-test + commit) and part 3 (exact code +
probe gates) follow from the orchestrator. Superficial output will be rejected.
If a fact you need is missing, derive the safest assumption, state it in one
line, and proceed.

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

"The deep" is a world-column the camera pans vertically through.

- Coordinate contract (shared with `realm-creatures.ts`, verbatim): "world px:
  origin top-left of a (vw × 2vh) column; camX is always 0. screen px = (world
  − cam − half viewport) × zoom + half viewport".
- The world is **exactly two viewport heights**: `world.h = vh * 2` (set in
  `resize()`). The camera range is `[0, world.h − vh]` = `[0, vh]` — **the
  camera can never scroll deeper than one viewport**; there is no world below
  2vh. `resize()` also clamps `lan.y` to `world.h` and `camYState` to
  `world.h − vh`, and rebuilds the creatures when the height change is real
  (`worldChanged = w !== vw || Math.abs(h - vh) > vh * 0.2`).
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
practice-map, fy 0.9 → world y 1.8vh) sits at **80% of the viewport height**;
door 6 (planck-to-now, fy 0.78) at 56%. The camera cannot push them higher —
the range is exhausted. Doors 1–5 are unproblematic (fy ≤ 0.68).

- Creature anchor law (`realm-creatures.ts`, `Creature.update`, verbatim):

```ts
    const nax = this.fx * c.world.w, nay = this.fy * c.world.h;
```

Anchors are **fractions of `world.h`** — if `world.h` grows, every anchor
moves DOWN proportionally unless the mapping is decoupled. On a real geometry
change each species translates its cached state to follow the anchor
(`shiftState`). Creatures wander within a leash of ≤ ~0.8 × `radius` around
their anchor (`placeLive` knee; `radius = interactR = min(vw, vh) * 0.28`).

- Lantern soft walls (verbatim, `updateLantern`):

```ts
    // A hold must also bypass positional correction at the soft walls.
    if (!lanternHeld) {
      if (lan.x < 0) { lan.x = 0; lvx = Math.abs(lvx) * 0.4; }
      if (lan.x > world.w) { lan.x = world.w; lvx = -Math.abs(lvx) * 0.4; }
      if (lan.y < 0) { lan.y = 0; lvy = Math.abs(lvy) * 0.4; }
      if (lan.y > world.h) { lan.y = world.h; lvy = -Math.abs(lvy) * 0.4; }
    }
```

- The lantern chases the pointer's world position:
  `ty = (ptrY − vh*0.5) / zoom + camY + vh*0.5` (desktop spring k=132.25,
  critically damped; reduced motion: softened direct follow; touch input lifts
  the target by `1.6 × lightRadius` via the shell's `lifted()`).
- Camera follow (`updateCamera`, verbatim core — desktop and mobile differ):

```ts
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

The dive phase reuses the same camera (`startDive` targets the creature from
the CURRENT `camYState`, zoom 1→1.22). Camera sway: `±4px` vertical sine,
suppressed under reduced motion. `camX` is locked at 0 by the documented
contract.

### Selection flow and the chrome that covers it (mechanism-verified)

Selecting a creature (canvas tap, legend button, keyboard) runs
`RealmMode.openProjectPanel(id)` (verbatim):

```tsx
  const openProjectPanel = useCallback((id: string) => {
    if (phaseRef.current !== "active") return;
    sceneRef.current?.setLanternHold(true);
    setOpenId(id);
    sceneRef.current?.startGreeting(id);
    audioRef.current?.greeting(id);
  }, []);
```

- `setLanternHold(true)` **parks the lantern** (r10 law: exact positional hold
  in world coordinates, zero velocity, bypasses spring/drag/thrust/soft-walls
  until release; panel close releases it preserving coordinates).
- `startGreeting(id)` starts the creature's **greeting animation** — it
  renders around the creature's anchor: raft forms a row, kitty speeds its
  loop with hops, explosion detonates radially, spine morphs layouts, forest
  exhales three expanding rings (transient radius up to ~1.75 × `radius` ≈
  440 px at 900vh), planck runs its cycle, map threads star pulses. One-shot;
  the scene forgets it after 6 s.

The panel (the "project description") is opaque near-black chrome covering a
**fixed screen region** while open (`realm.css`):

- Desktop: `top: 0; right: 0; bottom: 0; left: calc(100% − min(30rem, 92%));`
  width `min(30rem, 92%)`, **full height**, background `#04080b` (the abyss),
  `z-index: 70`.
- Mobile (≤520px): bottom sheet — `top: 52%; height: 48%` of the visible
  viewport, opaque, full width.

Other permanent chrome: hud (top-right), legend (bottom-left door buttons;
a scrollable strip on mobile), caption (bottom-right, desktop only).

**The failure, mechanism-verified:**

- Desktop 1440×900: door 7's anchor screen x = 0.76·vw = 1094 px; the sheet's
  left edge = 1440 − 480 = 960 px. The anchor and its whole greeting footprint
  sit **behind the opaque right sheet** on any viewport narrower than ~2000 px.
  On a 1024 px window the sheet covers door 7 and grazes door 6 (x = 533 vs
  sheet edge 544).
- Mobile 390×844: the sheet covers y from 52% down. The bottom creatures sit
  at ≥80% viewport height at max scroll — **permanently inside the sheet's
  band while selected**, and the camera range is exhausted, so nothing can
  scroll them above it.
- The owner's two causes are exactly right: the description covers the
  animation's region, and the world lacks the depth that would let the
  light/cursor (and the camera) reach further down and lift the bottom
  creatures into the clear.

### Context you need from r12 (just landed)

The deep can now be entered **over the project page** (deep-return): App mounts
a RealmMode above an inert wrapper while a project route is still rendered and
swaps to the landing under the opaque cover. **Your changes must not care
which tree mounts the realm.** Do not touch the r12 routing mechanism.

### Probe facts

`tests/realm-probe.mjs` (105 gates, headless Chromium) can: drive the mouse
(move/down/up with steps), touchscreen, keyboard (digits `1`–`7` → `warpTo`,
`w/a/s/d`/arrows → thrust, `e`/Enter/Escape), read
`window.__realmScene.getLanternSnapshot()` (dev-only, prod null), read any DOM
rect (`getBoundingClientRect`) of `.realm-panel` / `.realm-legend` /
`.realm-hud` / `.realm-caption`, take screenshots, and poll with
`until(page, fn, ms)`. It selects creatures deterministically via legend
buttons (`.realm-legend-btn[i]`) without dragging the light. Anchor mapping
probe fact: "creature 0 anchor: (0.25·vw, 0.26·2vh) at zoom 1, cam 0" — at
1440×900 with camY = vh, creature 6 sits at screen y = 0.8·vh. If your design
needs creature/camera positions in gates, you may add a **dev-only snapshot
getter** in the same style as `getLanternSnapshot()` (null in production; no
per-frame React state).

## 2. Goal

**Primary:** after selecting **any** of the seven creatures — from any entry
path (canvas tap, legend button, keyboard) — the creature and its
greeting/selection animation must be **visible**: not covered by the panel,
legend, hud, or caption, on **desktop 1440×900** and **mobile 390×844** (the
2560×1440 regression width stays fine).

**The owner's explicit ask (mandatory):** add more vertical space at the
bottom of the scene so the cursor/light can travel further down — the world
must become deeper than today's 2vh, the camera must scroll into that depth,
and the bottom creatures must be liftable high enough that the mobile sheet
(top edge 52%) and the desktop legend/caption band stop covering them.

**Fixing the overlap** (the panel covering the selected creature's animation)
is yours to design: a camera adjustment on selection, a panel-side change, a
viewport-aware selection law, or something better — as long as the invariant
holds for all seven creatures on both viewport classes.

## 3. Invariants (these are your pruning criteria — violations reject the work)

- **Geography law:** the seven creatures keep their current relative layout.
  Added depth goes **below** the existing anchor space; do not re-space or
  re-anchor the creatures as a side effect of growing the world. If your
  design must move an anchor, justify it explicitly against the owner's ask.
- The r10 lantern hold stays exact: selecting parks the lantern at its
  pre-selection point in **world** coordinates; any camera adjustment moves
  the view, never the parked lantern (no teleport; held coordinates exact
  across frames; release preserves them).
- Do not regress: the dive camera (accelerate toward the creature, zoom
  1→1.22), the pick anchor system (`markPickAnchor`/`pickAt`, 450 ms window),
  the touch `lifted()` offset, keyboard `warpTo` (1–7) and thrust, the
  proximity-greeting arbitration (latch set, 25% exit hysteresis,
  drop-on-busy), the lure/idle system, wake/trail continuity
  (`invalidateSceneContinuity` on teleports), overlay name/pick-cue culling,
  the reduced-motion paths (direct follow, settled), the degraded (no-WebGL)
  renderer, the r9 panel/sheet laws (stationary wrapper frame, keyed inner
  scroll body, dive button reachable above the safe-area pad, bg #04080b),
  the r10 exit/unlock choreography, and the r12 project-backed return.
- Lantern soft walls, camera clamp, and `resetForEnter` stay consistent with
  the new depth (nothing below the world floor, no camera overshoot, no stale
  clamp after resize).
- One rAF loop; update/emit allocate nothing; no per-frame React state;
  listeners/timers released in cleanup; Strict-safe.
- No new sounds; no new DOM chrome; no blur/glow/loops; `--ink-*` tokens,
  lowercase mono, 1px hairlines if any DOM is touched at all.
- The panel's own geometry (r9) stays as shipped unless your design moves it —
  justify against the mobile sheet law and the probe's sheet gates.

## 4. Reasoning protocol — part 1 (steps 1–3)

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

## 5. Deliverable for THIS part

Your reasoning through steps 1–3, ending with a line
`TOP DIRECTIONS:` — the 1–2 strongest directions, each with: a name, the
mechanism (2–4 sentences), and why it beats the pruned alternatives. **No
code, no concrete design values yet** — part 2 develops the survivor(s) to
full depth, part 3 writes the code.
