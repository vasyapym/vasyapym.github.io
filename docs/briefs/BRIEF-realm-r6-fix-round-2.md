# BRIEF — realm r6, deliverable 2 of 2: lantern follow feel + the straight-drag trace

Same relay as deliverable 1: you have no repo access; the orchestrator owns
and integrates the code. Everything needed is in this document. Work
autonomously — you pick techniques and constants inside the stated design
laws; no approval gates. Show the reasoning, then the patch.

## How to work (mandatory)

1. **Restate** each bug from the evidence; derive root causes from the code
   below with line-level reasoning (mechanism, not vibes).
2. **Enumerate** 2–3 candidate approaches per bug with mechanism / expected
   effect / risks / coupling effects on the rest of the motion system. Pick
   winners and say why.
3. **Self-critique**: walk your own patch through every item in "Must keep
   working", including the couplings listed below (speed-keyed systems!).
   Re-derive any damping math you change (critical damping ⇒ c ≈ 2√k for the
   unit-mass spring used here; check your numbers).
4. **Deliver** FIND/REPLACE patches (format at the end) + residual risks for
   the orchestrator to verify.

## Background you cannot infer

"the deep": an opt-in immersive mode over a portfolio landing page. A WebGL
stable-fluid abyss; the light (lantern) is the cursor; seven creature "doors"
swim in the water; you drag the light toward a door and tap to open it. Two
renderers: GL fluid (velocity sim at 1/4 canvas res, dye at 1/2 res, curl
confinement uCurlK = 25, semi-Lagrangian advection) + a vector "phosphor
trail" (2D lines via an emissive-quad pipeline, additive blending) + a dye
"wake" (fluid splats along the motion). There is also a degraded canvas2d
renderer (no GL) and a reduced-motion mode (both must keep working).

Input model: pointer moves steer the lantern target; on touch the target is
the finger lifted by ~1.6× the light radius (see `lifted()`); the lantern
chases the target through a critically damped spring (substepped at 120Hz);
the camera (vertical only) follows the lantern with an exponential rate and a
dead zone; fast lantern motion leaves (a) the phosphor trail and (b) the dye
wake in the water.

Owner reports, verbatim intent:

- **(2) Speed/sensitivity.** "The light/cursor effect moves too fast on
  mobile, making it feel erratic and uncontrollable. On desktop too, but less
  apparent because the display is bigger." Reduce sensitivity/speed so it
  feels smooth and intentional on touch devices.
- **(3) Trail appearance.** "When the user moves the light/cursor in a
  straight or near-straight direction (the most common natural movement), the
  trail looks buggy — it renders as harsh, random-looking straight lines
  rather than a smooth trace."

Headless-Chrome evidence (1440×900, mouse drags; probe rig):

- Straight horizontal drag ~1250px/s: the wake band behind the light is a
  jagged sawtooth — regular triangular teeth alternating above/below the
  path, plus torn edges. Reads as "harsh random lines".
- Straight vertical drag ~1375px/s: the wake plume sheds a large S-curl that
  dominates the frame; with the horizontal case this reads as chaotic
  tearing, not a trace.
- The phosphor trail's thin line is present but partially buried under the
  dye wake's noise.

Mechanism hypotheses you should verify against the code (do not accept them
blindly): the wake injects a strong directional jet (`dx * 0.16 * weight`,
radius 42) at ≤14px spacing into a low-res velocity field; the global curl
confinement (uCurlK 25) amplifies the resulting shear layer; at 1/4-res
velocity the jet reads as alternating vortices → the sawtooth. On top, the
phosphor trail is drawn as many short additive quads (≤12px chords, width
~0.55×lantern radius) whose radial falloff makes adjacent quads overlap and
add → beading on long straight runs. Mobile feel: the spring is *snappier* on
small screens (k 196 vs 144) AND the camera dead zone is zero on small
screens (`half = small ? 0 : vh*0.18`), so every finger jiggle pans the whole
world 1:1 → "erratic".

## Current code (verbatim — the patch anchors)

`realm-scene.ts` constants:

```ts
const MAX_DT = 0.05;
const WAKE_ON = 120;
const WAKE_OFF = 70;

const TRAIL_CAP = 64;
const TRAIL_KEEP = 0.55;
const TRAIL_SAMPLE_DT = 1 / 60;
const TRAIL_SPACING = 12;
const TRAIL_LINE_CAP = 256;

const WAKE_SPACING = 14;
const WAKE_SPLAT_CAP = 16;
const MOTION_GAP = 0.12;
```

`updateLantern` (per-frame, dt seconds; `small` = touch/small screen; `ptrX/ptrY`
are screen css px of the pointer; the two `tx/ty` lines convert screen→world):

```ts
function updateLantern(dt: number): void {
  const controllable = phase === "active";
  if (controllable) {
    breath += (breathTarget - breath) * (1 - Math.exp(-12 * dt));
  }

  if (controllable && !reduced) {
    const tx = (ptrX - vw * 0.5) / cam.zoom + cam.camX + vw * 0.5;
    const ty = (ptrY - vh * 0.5) / cam.zoom + cam.camY + vh * 0.5;
    const k = small ? 196 : 144;
    const c = small ? 28 : 24;
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
      if (v > 1500) {
        lvx *= 1500 / v;
        lvy *= 1500 / v;
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

`updateCamera` (vertical camera; `camYState` spring toward target; sway ±4px;
zoom 1 in active):

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
    const half = small ? 0 : vh * 0.18; // dead zone = 0.36 × viewport
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

`tick` wake/trail section (after lantern+camera+creatures update; `elapsed` =
wall-clock since the previous tick, `continuous` = motion continuity within
MOTION_GAP 0.12s; `lanSx/lanSy` = lantern screen pos, `prevSx/prevSy` =
previous frame's):

```ts
    const motionAllowed = phase === "active" && !reduced;
    if (!motionAllowed) continuous = false;

    // a teleport is not a stroke; also bounds fluid draw calls.
    if (
      continuous &&
      Math.hypot(lanSx - prevSx, lanSy - prevSy) >
        WAKE_SPACING * WAKE_SPLAT_CAP
    ) {
      invalidateSceneContinuity();
      continuous = false;
    }

    if (!continuous) {
      clearTrail();
      wakeOn = false;
      prevSx = lanSx;
      prevSy = lanSy;
    }
    motionPrimed = motionAllowed;

    if (phase !== "active" || elapsed > MOTION_GAP) {
      pickAnchorValid = false;
    }
    if (motionAllowed) recordTrail(continuous ? elapsed : 0);

    emitAll();

    if (fluid !== null) {
      fluid.globalDrift(0, -camVy);
      fluid.setLantern(lanSx, lanSy, lan.intensity);

      if (continuous && dt > 1e-4) {
        const dx = lanSx - prevSx;
        const dy = lanSy - prevSy;
        const distance = Math.hypot(dx, dy);
        const wvx = dx / dt;
        const wvy = dy / dt;
        const wsp = Math.hypot(wvx, wvy);
        wakeOn = wsp > (wakeOn ? WAKE_OFF : WAKE_ON);

        if (wakeOn && distance > 0) {
          const count = Math.max(1, Math.ceil(distance / WAKE_SPACING));
          const weight = 60 * dt / count;
          for (let i = 1; i <= count; i++) {
            const f = i / count;
            fluid.stroke(
              prevSx + dx * f,
              prevSy + dy * f,
              wvx,
              wvy,
              weight
            );
          }
        }
      } else {
        wakeOn = false;
      }

      fluid.step(dt);
      fluid.render(emitter);
      drawOverlay(dt, false);
    } else {
      wakeOn = false;
      drawOverlay(dt, true);
    }
```

`recordTrail` (world-space ring buffer; `speed` is lantern world px/s; called
every frame while motionAllowed):

```ts
  function recordTrail(elapsed: number): void {
    trailClock += elapsed;

    const s = clamp((speed - 40) / 760, 0, 1);
    const target = s * s * (3 - 2 * s);
    trailGain += (target - trailGain) * (1 - Math.exp(-12 * elapsed));

    while (trailFill > 0) {
      const oldest = (trailHead - trailFill + TRAIL_CAP) % TRAIL_CAP;
      if (trailClock - trailT[oldest] <= TRAIL_KEEP) break;
      trailFill--;
    }

    // the live head covers the remainder between stored samples.
    if (
      trailFill > 0 &&
      trailClock - trailLastSample < TRAIL_SAMPLE_DT - 1e-5
    ) return;

    trailX[trailHead] = lan.x;
    trailY[trailHead] = lan.y;
    trailT[trailHead] = trailClock;
    trailG[trailHead] = trailGain;
    trailHead = (trailHead + 1) % TRAIL_CAP;
    trailFill = Math.min(TRAIL_CAP, trailFill + 1);
    trailLastSample = trailClock;
  }
```

`emitTrail` (each stored sample becomes the control point `b` of a quadratic
whose `a`/`c` are midpoints to neighbours — quadratic-through-midpoints; the
live head connects the newest sample to the current lantern; each span is
subdivided so each chord is ≤ ~TRAIL_SPACING screen px; chords are emitted as
`emitter.line(x0,y0,x1,y1,width,r,g,b)` — additive soft quads):

```ts
  function emitTrail(): void {
    if (
      phase !== "active" ||
      reduced ||
      trailFill === 0 ||
      lan.intensity <= 0.01
    ) return;

    const limit = Math.min(
      TRAIL_LINE_CAP,
      Math.max(0, LINE_CAP - emitter.lineCount)
    );
    const zoom = cam.zoom;
    if (limit === 0 || zoom <= 0) return;

    let work = 0;

    // newest first: overload trims the faint tail, never the live head.
    for (let k = trailFill - 1; k >= 0 && work < limit; k--) {
      const i = (trailHead - trailFill + k + TRAIL_CAP) % TRAIL_CAP;
      const bx = trailX[i];
      const by = trailY[i];
      const bt = trailT[i];
      const bg = trailG[i];

      let ax: number;
      let ay: number;
      let at: number;
      let ag: number;
      if (k === trailFill - 1) {
        ax = lan.x;
        ay = lan.y;
        at = trailClock;
        ag = trailGain;
      } else {
        const newer = (i + 1) % TRAIL_CAP;
        ax = (bx + trailX[newer]) * 0.5;
        ay = (by + trailY[newer]) * 0.5;
        at = (bt + trailT[newer]) * 0.5;
        ag = (bg + trailG[newer]) * 0.5;
      }

      let cx: number;
      let cy: number;
      let ct: number;
      let cg: number;
      if (k === 0) {
        cx = bx;
        cy = by;
        ct = bt;
        cg = bg;
      } else {
        const older = (i - 1 + TRAIL_CAP) % TRAIL_CAP;
        cx = (bx + trailX[older]) * 0.5;
        cy = (by + trailY[older]) * 0.5;
        ct = (bt + trailT[older]) * 0.5;
        cg = (bg + trailG[older]) * 0.5;
      }

      // |q'(u)| <= 2 * max(|b-a|, |c-b|), including curved spans.
      const bound = 2 * zoom * Math.max(
        Math.hypot(bx - ax, by - ay),
        Math.hypot(cx - bx, cy - by)
      );
      if (bound < 0.01) continue;

      const subdivisions = Math.max(1, Math.ceil(bound / TRAIL_SPACING));
      let x0 = sx(ax);
      let y0 = sy(ay);

      for (let j = 1; j <= subdivisions && work < limit; j++) {
        const u = j / subdivisions;
        const v = 1 - u;
        const x1 = sx(v * v * ax + 2 * v * u * bx + u * u * cx);
        const y1 = sy(v * v * ay + 2 * v * u * by + u * u * cy);

        const m = (j - 0.5) / subdivisions;
        const n = 1 - m;
        const time = n * n * at + 2 * n * m * bt + m * m * ct;
        const gain = n * n * ag + 2 * n * m * bg + m * m * cg;
        const age = clamp(1 - (trailClock - time) / TRAIL_KEEP, 0, 1);
        const budgetFade = Math.min(1, (limit - work) / 16);
        const a = 0.18 * lan.intensity * gain * age * age * budgetFade;
        const width = Math.max(
          0.5,
          0.55 * lan.r * zoom * (0.12 + 0.88 * age)
        );

        // count attempted subdivisions too, bounding work at extreme zoom.
        work++;
        const dx = x1 - x0;
        const dy = y1 - y0;
        if (a > 1e-5 && dx * dx + dy * dy > 1e-4) {
          emitter.line(
            x0, y0, x1, y1, width,
            WARM[0] * a, WARM[1] * a, WARM[2] * a
          );
        }
        x0 = x1;
        y0 = y1;
      }
    }
  }
```

`RealmMode.tsx` touch lift (screen pointer target sits above the finger):

```ts
    const lifted = (ev: PointerEvent) =>
      isTouch(ev)
        ? ev.clientY -
          Math.min(64, Math.max(24, 1.6 * (sceneRef.current?.lightRadius() ?? 48)))
        : ev.clientY;
```

`realm-fluid.ts` wake constants + `stroke`:

```ts
const WARM: Rgb = [0xe8 / 255, 0xb5 / 255, 0x7c / 255];
// wake-only tint; keep the core and phosphor palette unchanged
const WAKE_DYE: Rgb = [
  WARM[0] * 1.06,
  WARM[1] * 0.90,
  WARM[2] * 0.68,
];
```

```ts
  stroke(x: number, y: number, dx: number, dy: number, weight = 1): void {
    if (this.dead || !Number.isFinite(weight) || weight <= 0) return;
    // dx/dy now arrive in css px/s (caller divides the screen delta by dt), so the
    // wake is frame-rate coherent instead of scaling with frame time.
    const speed = Math.sqrt(dx * dx + dy * dy);
    if (speed < 1) return;
    // the water inherits a fraction of the lantern's momentum: it is dragged along
    // and left behind by advection rather than punched forward. subdivisions share
    // one time-weighted deposit: weight scales the deposit, not the velocity used
    // for the speed ramp.
    this.splatVel(x, y, 42, dx * 0.16 * weight, dy * 0.16 * weight, 0, 0);
    // smooth speed ramp (fades in ~90 px/s, saturates ~800 px/s) instead of tracking
    // instantaneous speed, which is what made the trail pulse and break into dots.
    const s = Math.min(1, Math.max(0, (speed - 90) / 710));
    const amount = 0.05 + 0.15 * (s * s * (3 - 2 * s));
    this.splatDye(x, y, 30, WAKE_DYE, amount * weight);
  }
```

Rendering facts for the trail quads (do not change the pipeline unless you
argue a cheap, safe improvement): lines become two triangles each; fragment
falloff is `f = clamp(1 - dot(vLocal, vLocal), 0, 1); f *= f;` where vLocal is
the quad's ±1 local coords — a radial-ish falloff per chord; blend is
`ONE, ONE` additive. Emitter caps: 3072 points / 1536 lines total; trail caps
at 256 lines; the quality ladder sheds passes when mean frame cost > 14ms.

## Design laws (non-negotiable)

1. The lantern is the cursor; the light must still follow the user — do NOT
   introduce lag so large the light feels detached, and do not add input
   latency beyond a soft chase.
2. No overshoot oscillation: the spring stays at-or-near critical damping
   (re-derive c from your chosen k). Speed cap stays finite (today 1500px/s).
3. The wake dye stays the wake-only warm tint (WAKE_DYE); core/phosphor
   palette untouched. The phosphor trail remains the crisp trace.
4. Reduced-motion mode: unchanged behavior (direct softened follow, no
   trail/wake). Degraded (no-GL) renderer: unaffected.
5. No new per-frame allocations; no new fullscreen GPU passes; keep the
   quality-ladder budget. Prefer constant/param retunes and small local
   state over new systems.
6. Public APIs (RealmScene interface, RealmMode wiring, probe-asserted
   behaviors) do not change.
7. Mobile-first for bug 2: `(pointer: coarse)` / small-screen path should
   feel calm and intentional; desktop should get a modest calming too (owner:
   "desktop too, but less apparent").

## Reasoning targets (make explicit in your writeup)

- The spring constants feed `speed`, which keys THREE downstream systems:
  `trailGain` ramp `(speed−40)/760`, wake hysteresis `WAKE_ON/WAKE_OFF`
  (120/70 px/s), and the audio speed snapshot `speed/1200`. If you retune the
  spring, state whether/why you rescale each and give the numbers.
- Touch targets sit 24–64px above the finger (`lifted()`); if you change
  follow stiffness on touch, check the pick/tap flow still lines up (pick
  radius is independent of speed — 24px min touch radius + anchor — so speed
  changes don't break taps, but say so explicitly).
- The camera dead zone: today desktop has half = 0.18·vh (36% of viewport),
  mobile zero. Propose a small-screen value (and rate, today 8) that keeps
  vertical swimming reachable — the world is 2×vh tall and doors sit at
  fy .26…0.9 — while stopping micro-jiggle panning. If you instead add
  velocity smoothing for touch, argue why it beats the dead zone.
- For the sawtooth: identify which contributors you are attacking (jet
  velocity inject 0.16×, splat radius/spacing, dye amount, global uCurlK) and
  the expected residual look after your change (describe it in words so the
  orchestrator can compare shots before/after).
- Consider whether the phosphor trail should carry more of the trace on fast
  straight drags (e.g., slightly higher width/alpha) while the dye wake
  calms — or the reverse — and justify with the "harsh lines" complaint in
  mind.

## Must keep working (self-check before you deliver)

- Keyboard thrust (WASD/arrows) still moves the light (same thrust pipeline).
- Wheel breathing (light radius) unaffected; `lifted()` interplay sane.
- Tap=select: down-time pick anchor unaffected by follow changes.
- Enter/leave/dive phase choreography untouched; trail clears on phase gaps
  (`clearTrail` on discontinuity) — keep those guards.
- 60fps budget on integrated GPUs: no added per-frame allocations or passes;
  trail work still bounded by TRAIL_LINE_CAP/LINE_CAP.
- prefers-reduced-motion and degraded paths unchanged.

## Output format (strict)

For each change:

```
FILE <path>
FIND
<exact current text, minimal unique snippet>
REPLACE
<replacement text>
WHY <one or two sentences>
```

If you introduce new constants, put them next to the existing block shown
above with a one-line comment in the file's lowercase style. Before the
patches, include the compact deliberation writeup per bug (root cause,
candidates + tradeoffs, pick + why, coupling decisions, residual risks).
Do not return whole files; keep the response focused; the orchestrator
applies the patch mechanically and then runs: `tsc --noEmit`, `vite build`,
`tests/realm-probe.mjs` (39 behavioural gates), and before/after screenshots
of straight/vertical/diagonal drags on desktop and 390×844 touch emulation.
