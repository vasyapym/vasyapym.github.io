import { useEffect, useRef } from "react";
import type { ProjectModule } from "../../../contracts/project-module";

/* ------------------------------------------------------------------ *
 * Shared render language — "one subject on warm air". Each card obeys
 * six laws: a single focal mass at (0.52,0.44); ≤3 alpha tiers; one
 * slow continuous motion + ≤1 periodic event; a LOCAL Bayer-4×4 dither
 * halo tied to the subject (the hero's ordered-dither signature, never
 * full-bleed); a caption-safe bottom-left zone. Muted per-card accents
 * derived toward the hero ramp; discrete Canvas2D marks, no blur.
 * ------------------------------------------------------------------ */

/* Flagship (v9): every plate now carries a live PERTURBATION layer the
 * pointer stirs — the hero's "liquid physics, printed rendering" doctrine
 * democratised into six distinct micro-systems. Doctrine we inherit from
 * HeroFluid: the system is COMPLETE without a pointer (rest = pure(t)); the
 * pointer is a bonus layer. We keep that split deliberately so the
 * reduced-motion static frame is exactly the rest frame — every pointer
 * effect lives in state that is zero at rest. */

const INK_RGB = "238, 234, 224";

type Paint = {
  ink: (a: number) => string;
  acc: (a: number) => string;
};

/* A ripple = one tap, remembered so touch (which has no hover) still gets a
 * physical response. `born` is in engine-clock seconds, the same clock the
 * draw receives as `t`, so age math is trivial. */
interface Ripple {
  x: number;
  y: number;
  born: number;
}

/* The one interaction bus each plate fills from pointer/focus events and the
 * frame loop reads. All numbers are in CSS px (matching the draw coordinate
 * space). `energy` is a decaying excitation scalar — "how hard was this plate
 * just stirred", 0..1. */
interface Interaction {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  active: boolean;
  down: boolean;
  focus: boolean;
  energy: number;
  ripples: Ripple[];
}

/* draw gains `dt` (seconds since the last painted frame, for physics
 * integration), `it` (the interaction bus) and `q` (quality 1|0 from the
 * degradation ladder — 0 = draw fewer/cheaper marks). */
type DrawFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  dt: number,
  p: Paint,
  it: Interaction,
  q: number,
) => void;

const ease = (x: number): number => {
  const c = x < 0 ? 0 : x > 1 ? 1 : x;
  return c * c * (3 - 2 * c);
};

const frand = (i: number): number => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const hexToRgb = (hex: string): string => {
  const raw = hex.replace("#", "");
  const n =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

/* ---- shared focal shading: local ordered (Bayer 4x4) dither halo ---- */

const BAYER4 = [
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
];

const ditherHalo = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  strength: number,
  color: (a: number) => string,
  cell = 2.8,
): void => {
  if (radius <= 0 || strength <= 0) return;
  const r2 = radius * radius;
  const gx0 = Math.floor((cx - radius) / cell);
  const gx1 = Math.ceil((cx + radius) / cell);
  const gy0 = Math.floor((cy - radius) / cell);
  const gy1 = Math.ceil((cy + radius) / cell);
  const sq = cell * 0.72;
  for (let gy = gy0; gy <= gy1; gy++) {
    for (let gx = gx0; gx <= gx1; gx++) {
      const px = gx * cell + cell * 0.5;
      const py = gy * cell + cell * 0.5;
      const dx = px - cx;
      const dy = (py - cy) / 0.82;
      const dd = dx * dx + dy * dy;
      if (dd > r2) continue;
      const intensity = (1 - Math.sqrt(dd) / radius) * strength;
      const bi = (((gy % 4) + 4) % 4) * 4 + (((gx % 4) + 4) % 4);
      const th = (BAYER4[bi] + 0.5) / 16;
      if (intensity <= th) continue;
      const a = 0.08 + 0.3 * (intensity - th);
      ctx.fillStyle = color(a);
      ctx.fillRect(px - sq / 2, py - sq / 2, sq, sq);
    }
  }
};

/* Dither cell tied to the quality ladder: coarser cells = far fewer marks
 * when the frame budget is tight (mirrors the hero's "cheaper render" step). */
const haloCell = (q: number): number => (q < 1 ? 4 : 2.8);

/* How strongly the pointer influences a point, 0 (far/absent) .. 1 (on it). */
const influence = (
  it: Interaction,
  x: number,
  y: number,
  r: number,
): number => {
  if (!it.active) return 0;
  const d = Math.hypot(it.x - x, it.y - y);
  return d >= r ? 0 : 1 - d / r;
};

/* Expanding hairline rings for taps — the only hover-free feedback touch
 * users get, so every system draws them. */
const drawRipples = (
  ctx: CanvasRenderingContext2D,
  t: number,
  p: Paint,
  it: Interaction,
  maxR: number,
): void => {
  for (const r of it.ripples) {
    const age = t - r.born;
    if (age < 0 || age > 1.2) continue;
    const k = age / 1.2;
    const rad = ease(k) * maxR;
    ctx.strokeStyle = p.acc((1 - k) * 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
    ctx.stroke();
  }
};

/* Half-life decay helper: multiply a value so it halves every `hl` seconds. */
const halfLife = (hl: number, dt: number): number => Math.pow(0.5, dt / hl);

/* ================================================================= *
 * Six systems. Each is a create()-factory returning a STATEFUL DrawFn
 * instance, so persistent physics state (springs, pools, smoothers) is
 * born fresh per mount inside the effect — StrictMode-safe by design.
 * ================================================================= */

/* 01 raft-cluster — leader + 4 spring-mass followers on a quorum ring.
 * Pointer shoves followers off the ring; they spring back. Stirring raises
 * the heartbeat rate; a 6s election fires a crown of sparks. */
const createRaft = (): DrawFn => {
  const N = 4;
  const ox = new Float64Array(N);
  const oy = new Float64Array(N);
  const vx = new Float64Array(N);
  const vy = new Float64Array(N);
  let beat = 0; // extra heartbeat phase from stirring (0 at rest)
  return (ctx, w, h, t, dt, p, it, q) => {
    const cx = w * 0.52;
    const cy = h * 0.44;
    const R = Math.min(w * 0.3, h * 0.55, 132);
    const ry = R * 0.6;

    const period = 6;
    const phase = (t % period) / period;

    // Heartbeat: a pure(t) pulse so the reduced-motion frame is EXACT.
    // Stirring only adds an extra phase (`beat`) that is zero at rest, so
    // energy "speeds the heart up" without ever breaking pure(t).
    const baseRate = 0.5;
    beat += 1.6 * it.energy * baseRate * dt;
    const hb = (t * baseRate + beat) * Math.PI * 2;
    const pulse = 0.5 + 0.5 * Math.sin(hb);

    // ---- follower spring-mass step (offsets from their fixed ring seats) --
    for (let i = 0; i < N; i++) {
      const ang = -Math.PI / 2 + (i / N) * Math.PI * 2;
      const bx = cx + Math.cos(ang) * R;
      const by = cy + Math.sin(ang) * ry;
      const nx = bx + ox[i];
      const ny = by + oy[i];

      // Hooke restoring force back to the seat + velocity damping.
      let ax = -90 * ox[i] - 9 * vx[i];
      let ay = -90 * oy[i] - 9 * vy[i];

      // The pointer shoves the node radially away — the quorum is "stirred".
      const inf = influence(it, nx, ny, 96);
      if (inf > 0) {
        const dx = nx - it.x;
        const dy = ny - it.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = inf * (900 + 700 * it.energy);
        ax += (dx / d) * f;
        ay += (dy / d) * f;
      }

      vx[i] += ax * dt;
      vy[i] += ay * dt;
      ox[i] += vx[i] * dt;
      oy[i] += vy[i] * dt;

      // Clamp the displacement so a violent stir can't fling a node off-plate.
      const om = Math.hypot(ox[i], oy[i]);
      if (om > 46) {
        ox[i] = (ox[i] / om) * 46;
        oy[i] = (oy[i] / om) * 46;
      }
    }

    // ---- links + travelling heartbeats (drawn UNDER the nodes) ----
    for (let i = 0; i < N; i++) {
      const ang = -Math.PI / 2 + (i / N) * Math.PI * 2;
      const nx = cx + Math.cos(ang) * R + ox[i];
      const ny = cy + Math.sin(ang) * ry + oy[i];
      ctx.strokeStyle = p.ink(0.1);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      const hbp = (t * 0.6 + beat * 0.5 + i * 0.25) % 1;
      const px = cx + (nx - cx) * hbp;
      const py = cy + (ny - cy) * hbp;
      ctx.fillStyle = p.acc(0.5 * (1 - hbp) + 0.2);
      ctx.beginPath();
      ctx.arc(px, py, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- followers ----
    for (let i = 0; i < N; i++) {
      const ang = -Math.PI / 2 + (i / N) * Math.PI * 2;
      const nx = cx + Math.cos(ang) * R + ox[i];
      const ny = cy + Math.sin(ang) * ry + oy[i];
      ctx.fillStyle = p.ink(0.5);
      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- leader core + its dither halo (breathes with the heartbeat) ----
    ditherHalo(ctx, cx, cy, 26 + 10 * pulse, 0.5 + 0.4 * pulse, p.acc, haloCell(q));
    ctx.fillStyle = p.acc(0.85);
    ctx.beginPath();
    ctx.arc(cx, cy, 6 + 2 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // ---- 6s election: a crown of sparks fans out from the leader ----
    if (phase < 0.14) {
      const e = Math.sin((phase / 0.14) * Math.PI);
      const spokes = 12;
      for (let i = 0; i < spokes; i++) {
        const a = (i / spokes) * Math.PI * 2;
        const rr = 10 + e * 30;
        const sx = cx + Math.cos(a) * rr;
        const sy = cy + Math.sin(a) * rr * 0.7;
        ctx.fillStyle = p.acc(e * 0.7);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawRipples(ctx, t, p, it, 60);
  };
};

/* 02 kitty-run — a wisp orbits an ellipse with a ghost echo and a periodic
 * dash. The pointer springs the HEAD toward the cursor and, via a decaying
 * `boost`, speeds the orbit and reinforces the dash. Rest is pure(t); the
 * spring offset and boost are both zero at rest. */
const createKitty = (): DrawFn => {
  let bx = 0; // head spring offset toward the pointer
  let by = 0;
  let vbx = 0;
  let vby = 0;
  let boost = 0; // dash/orbit excitation from proximity + speed
  let boostPhase = 0; // extra orbit phase from boost (0 at rest)
  return (ctx, w, h, t, dt, p, it, q) => {
    const cx = w * 0.52;
    const cy = h * 0.44;
    const rx = Math.min(w * 0.3, 150);
    const ry = Math.min(h * 0.26, 42);
    const path = (s: number) =>
      [
        cx + Math.cos(s * Math.PI * 2) * rx,
        cy + Math.sin(s * Math.PI * 2) * ry,
      ] as const;

    // faint full track
    ctx.fillStyle = p.ink(0.12);
    const track = 54;
    for (let k = 0; k < track; k++) {
      const [x, y] = path(k / track);
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // orbit position = pure(t) base + a boost-only extra phase (0 at rest)
    boost *= halfLife(0.6, dt);
    const sRun = (t * 0.15 + boostPhase) % 1;
    const sGhost = (t * 0.15 + boostPhase + 0.5) % 1;

    // ghost echo
    for (let k = 0; k < 9; k++) {
      const [x, y] = path(sGhost - k * 0.012);
      ctx.fillStyle = p.ink(0.3 * (1 - k / 9));
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, 1.8 - k * 0.14), 0, Math.PI * 2);
      ctx.fill();
    }

    // head base on the ellipse, then a spring pull toward the pointer
    const [hxBase, hyBase] = path(sRun);
    const near = influence(it, hxBase + bx, hyBase + by, 120);
    const tx = (it.x - hxBase) * 0.4 * near;
    const ty = (it.y - hyBase) * 0.4 * near;
    vbx += (60 * (tx - bx) - 8 * vbx) * dt;
    vby += (60 * (ty - by) - 8 * vby) * dt;
    bx += vbx * dt;
    by += vby * dt;

    // boost from nearness + raw pointer speed; feeds orbit phase + dash
    const stir = Math.min(1, near * 0.7 + Math.min(1, it.speed / 1600) * 0.6);
    boost = Math.max(boost, stir);
    boostPhase += boost * 0.22 * dt;

    const hx = hxBase + bx;
    const hy = hyBase + by;

    // periodic dash, reinforced by boost
    const dp = (t % 7) / 7;
    const dashBase = dp < 0.14 ? Math.sin((dp / 0.14) * Math.PI) : 0;
    const dash = Math.min(1, dashBase + boost * 0.8);

    // running trail (bends with the head toward the pointer)
    const trail = 12 + Math.round(dash * 12);
    for (let k = trail - 1; k >= 0; k--) {
      const [x, y] = path(sRun - k * 0.01);
      const a = 1 - k / trail;
      ctx.fillStyle = p.acc(a * 0.85);
      ctx.beginPath();
      ctx.arc(x + bx * a, y + by * a, 2.2 * a + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (dash > 0.05) {
      ditherHalo(ctx, hx, hy, 12 + 10 * dash, 0.5 * dash, p.acc, haloCell(q));
    }
    ctx.fillStyle = p.acc(1);
    ctx.beginPath();
    ctx.arc(hx, hy, 3.2, 0, Math.PI * 2);
    ctx.fill();

    if (dash > 0.1) {
      ctx.strokeStyle = p.acc(0.45 * dash);
      ctx.lineWidth = 1;
      for (let k = 1; k <= 3; k++) {
        const [x, y] = path(sRun + 0.02 + k * 0.018);
        ctx.beginPath();
        ctx.moveTo(x + bx, y + by - 4);
        ctx.lineTo(x + bx, y + by + 4);
        ctx.stroke();
      }
    }

    drawRipples(ctx, t, p, it, 54);
  };
};

/* 03 evening-forest — dusk sun with a dither halo, 4 sine canopy bands, a
 * walker. Pointer horizontal motion integrates into a global WIND (relaxes
 * to 0); `energy` raises a LOCAL gust bump near the pointer's x. Both are
 * zero at rest so the static frame is the pure canopy. */
const createForest = (): DrawFn => {
  let wind = 0; // global horizontal wind, relaxes to 0
  let gust = 0; // local energy bump amplitude
  let gustX = 0; // where the local gust sits
  let windPhase = 0; // walker-hurry accumulator (0 at rest)
  return (ctx, w, h, t, dt, p, it, q) => {
    const sunX = w * 0.52;
    const sunY = h * 0.44;

    // wind: pointer horizontal velocity feeds it; a 0.9s half-life relaxes it
    if (it.active) wind += it.vx * dt * 0.5;
    wind *= halfLife(0.9, dt);
    if (wind > 160) wind = 160;
    if (wind < -160) wind = -160;

    // local gust: energy makes a bump near the pointer's x (0.7s relax)
    gust *= halfLife(0.7, dt);
    if (it.active) {
      gust = Math.max(gust, it.energy);
      gustX = it.x;
    }

    windPhase += wind * 0.0009 * dt;

    // canopy bands (the fixed per-frame cost; stride widens under load)
    const step = q < 1 ? 10 : 6;
    const bands = 4;
    for (let b = 0; b < bands; b++) {
      const baseY = h * (0.55 + b * 0.12);
      const amp = 6 + b * 3;
      const freq = 0.018 + b * 0.004;
      const speed = 0.25 + b * 0.08;
      ctx.fillStyle = p.acc(0.22 + (0.12 * (bands - b)) / bands);
      for (let x = 0; x <= w; x += step) {
        const dxg = x - gustX;
        const localGust = gust * 26 * Math.exp(-(dxg * dxg) / (2 * 60 * 60));
        const bow = wind * 0.06 * Math.sin((x / w) * Math.PI);
        const y =
          baseY + Math.sin(x * freq + t * speed + b) * amp + bow - localGust;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // dusk sun above the canopy
    ditherHalo(ctx, sunX, sunY, 30, 0.7, p.acc, haloCell(q));
    ctx.fillStyle = p.acc(0.9);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 8, 0, Math.PI * 2);
    ctx.fill();

    // a small walker crossing a band, hurried by the wind
    const wp = (t * 0.06 + windPhase) % 1;
    const wx = ((wp % 1) + 1) % 1 * w;
    const wy = h * 0.55 + Math.sin(wx * 0.018 + t * 0.25) * 6 - 4;
    ctx.fillStyle = p.ink(0.55);
    ctx.fillRect(wx - 1, wy - 4, 2, 4);

    drawRipples(ctx, t, p, it, 50);
  };
};

/* A single perturbation spark for the explosion pool. */
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

/* 04 explosion — a pure(t) charge->detonate->fade cycle (deterministic
 * shards from frand, so the static frame is exact). The pointer adds a
 * persistent spark POOL: hovering streams sparks toward the core; a press
 * fires a 24-shard burst + core flash. Pool is empty at rest. */
const createExplosion = (): DrawFn => {
  const pool: Spark[] = [];
  let flash = 0;
  let wasDown = false;
  return (ctx, w, h, t, dt, p, it, q) => {
    const cx = w * 0.52;
    const cy = h * 0.44;

    // REST: a pure(t) 5s cycle
    const cycle = t % 5;
    const charge = cycle < 3 ? cycle / 3 : 0;
    const boom = cycle >= 3 ? (cycle - 3) / 2 : 0;

    // ring of ticks
    const ticks = 24;
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2;
      ctx.fillStyle = p.ink(0.12);
      ctx.fillRect(cx + Math.cos(a) * 40 - 1, cy + Math.sin(a) * 40 - 1, 2, 2);
    }

    // charge glow
    if (charge > 0) {
      ditherHalo(ctx, cx, cy, 10 + 16 * charge, 0.3 + 0.5 * charge, p.acc, haloCell(q));
    }

    // deterministic shards during the boom (pure(t), gravity sag)
    if (boom > 0) {
      const e = boom;
      for (let i = 0; i < 40; i++) {
        const a = frand(i) * Math.PI * 2;
        const sp = 30 + frand(i + 7) * 70;
        const dx = Math.cos(a) * sp * e;
        const dy = Math.sin(a) * sp * e + 90 * e * e * 0.5;
        ctx.fillStyle = p.acc((1 - e) * 0.9);
        ctx.fillRect(cx + dx - 1, cy + dy - 1, 2, 2);
      }
    }

    // POINTER hover: stream sparks toward the core (added to the pool)
    if (it.active && !it.down && pool.length < 200) {
      const dx = cx - it.x;
      const dy = cy - it.y;
      const d = Math.hypot(dx, dy) || 1;
      pool.push({ x: it.x, y: it.y, vx: (dx / d) * 60, vy: (dy / d) * 60, life: 0, max: 1.2 });
    }

    // manual detonation on the press EDGE: 24-shard burst + core flash
    if (it.down && !wasDown) {
      flash = 1;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const sp = 80 + frand(i) * 60;
        pool.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 1 });
        if (pool.length > 200) pool.shift();
      }
    }
    wasDown = it.down;
    flash *= halfLife(0.25, dt);

    // core flash (cycle detonation + manual overlay share one core)
    const coreFlash = Math.max(boom > 0 ? 1 - boom : 0, flash);
    ctx.fillStyle = p.acc(0.5 + 0.5 * coreFlash);
    ctx.beginPath();
    ctx.arc(cx, cy, 4 + 4 * coreFlash, 0, Math.PI * 2);
    ctx.fill();

    // integrate + draw the pool (gravity 90)
    for (let i = pool.length - 1; i >= 0; i--) {
      const s = pool[i];
      s.life += dt;
      s.vy += 90 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life >= s.max) {
        pool.splice(i, 1);
        continue;
      }
      ctx.fillStyle = p.acc((1 - s.life / s.max) * 0.9);
      ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
    }

    drawRipples(ctx, t, p, it, 52);
  };
};

/* 05 planck-to-now — a log-time axis whose cursor auto-sweeps with a lit wake
 * over the ticks it has passed. The pointer DRAG-SCRUBS: `blend` cross-fades
 * from the autonomous sweep to a pointer-driven, smoothed position; releasing
 * relaxes back to auto. At rest blend=0, so the frame is the pure sweep. */
const createPlanck = (): DrawFn => {
  let blend = 0; // 0 = autonomous sweep, 1 = fully pointer-scrubbed
  let held = 0; // smoothed scrub position in [0,1]
  return (ctx, w, h, t, dt, p, it, q) => {
    const x0 = w * 0.14;
    const x1 = w * 0.9;
    const axisY = h * 0.5;
    const span = x1 - x0;

    // 22 ticks along the axis
    const ticks = 22;

    // autonomous sweep position, then blend toward the scrubbed position
    const auto = (t * 0.09) % 1;
    if (it.active && it.down) {
      blend += (1 - blend) * Math.min(1, dt * 4);
      const target = Math.max(0, Math.min(1, (it.x - x0) / span));
      // dt===0 (reduced-motion static frame) snaps the smoother so the
      // static frame is exact rather than mid-interpolation.
      held += dt === 0 ? target - held : (target - held) * Math.min(1, dt * 12);
    } else {
      blend += (0 - blend) * Math.min(1, dt * 1.5);
    }
    const pos = auto + (held - auto) * blend;

    // axis rule
    ctx.strokeStyle = p.ink(0.18);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, axisY);
    ctx.lineTo(x1, axisY);
    ctx.stroke();

    // ticks — lit if the cursor has passed them (the "wake")
    for (let i = 0; i < ticks; i++) {
      const f = i / (ticks - 1);
      const tx = x0 + f * span;
      const passed = f <= pos;
      const hgt = 4 + (i % 4 === 0 ? 6 : 0);
      ctx.fillStyle = passed ? p.acc(0.8) : p.ink(0.2);
      ctx.fillRect(tx - 0.5, axisY - hgt, 1, hgt);

      // lit wake glow on freshly passed ticks near the cursor
      const near = Math.max(0, 1 - Math.abs(f - pos) * 5);
      if (near > 0) {
        ditherHalo(ctx, tx, axisY, 5 + 8 * near, 0.4 * near, p.acc, haloCell(q));
      }
    }

    // scrub cursor
    const cx = x0 + pos * span;
    ditherHalo(ctx, cx, axisY, 12 + 6 * blend, 0.5 + 0.3 * blend, p.acc, haloCell(q));
    ctx.fillStyle = p.acc(1);
    ctx.fillRect(cx - 1, axisY - 16, 2, 32);

    // scrub-mode hint: a faint bracket under the cursor while dragging
    if (blend > 0.05) {
      ctx.strokeStyle = p.acc(0.4 * blend);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 8, axisY + 20);
      ctx.lineTo(cx + 8, axisY + 20);
      ctx.stroke();
    }

    drawRipples(ctx, t, p, it, 46);
  };
};

/* One waypoint node on the practice map. */
interface Waypoint {
  x: number; // base position (fraction of w)
  y: number; // base position (fraction of h)
  ox: number; // live bend offset toward the pointer
  oy: number;
}

/* 06 practice-map — 6 deterministic waypoints; a route polyline self-draws
 * over 7s then a settle pulse fires at the destination. The pointer is a
 * gentle ATTRACTOR: nearby waypoints bend toward it (spring back at rest);
 * a tap drops a ripple anywhere. Offsets are zero at rest. */
const createMap = (): DrawFn => {
  // deterministic layout (frand keeps the static frame reproducible)
  const wps: Waypoint[] = Array.from({ length: 6 }, (_, i) => ({
    x: 0.16 + frand(i * 3 + 1) * 0.68,
    y: 0.28 + frand(i * 3 + 2) * 0.42,
    ox: 0,
    oy: 0,
  }));
  return (ctx, w, h, t, dt, p, it, q) => {
    // route draw progress over a 7s loop
    const phase = (t % 7) / 7;
    const drawn = ease(Math.min(1, phase / 0.8)); // finishes drawing by 80%
    const settle = phase > 0.8 ? Math.sin(((phase - 0.8) / 0.2) * Math.PI) : 0;

    // live positions: ease each waypoint's bend offset toward the pointer
    const pts = wps.map((wp) => {
      const bx = wp.x * w;
      const by = wp.y * h;
      const inf = influence(it, bx + wp.ox, by + wp.oy, 110);
      const tx = (it.x - bx) * 0.35 * inf;
      const ty = (it.y - by) * 0.35 * inf;
      // damped approach to target, spring back to 0 at rest
      wp.ox += (tx - wp.ox) * Math.min(1, dt * 6);
      wp.oy += (ty - wp.oy) * Math.min(1, dt * 6);
      return [bx + wp.ox, by + wp.oy] as const;
    });

    // route polyline, revealed progressively (segment by segment)
    const segs = pts.length - 1;
    ctx.strokeStyle = p.acc(0.7);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    const total = drawn * segs;
    for (let i = 0; i < segs; i++) {
      const segFrac = Math.max(0, Math.min(1, total - i));
      if (segFrac <= 0) break;
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      ctx.lineTo(ax + (bx - ax) * segFrac, ay + (by - ay) * segFrac);
    }
    ctx.stroke();

    // faint full-route ghost so the shape reads before it finishes drawing
    ctx.strokeStyle = p.ink(0.1);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();

    // waypoint nodes
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      const isDest = i === pts.length - 1;
      ctx.fillStyle = isDest ? p.acc(0.9) : p.ink(0.5);
      ctx.beginPath();
      ctx.arc(x, y, isDest ? 4 : 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // settle pulse at the destination
    const [dx, dy] = pts[pts.length - 1];
    if (settle > 0) {
      ditherHalo(ctx, dx, dy, 8 + 18 * settle, 0.6 * settle, p.acc, haloCell(q));
      ctx.strokeStyle = p.acc(0.5 * (1 - settle));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(dx, dy, 6 + 20 * settle, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawRipples(ctx, t, p, it, 48);
  };
};

/* ================================================================= *
 * Config — accents/captions stay 1:1 with the card CSS (--card-accent).
 * `create` replaces the old static `draw`: each card mounts its own
 * stateful instance.
 * ================================================================= */

interface CardArt {
  accent: string;
  caption: string;
  staticT: number;
  create: () => DrawFn;
}

const CARD_ART: Readonly<Record<string, CardArt>> = {
  "raft-cluster": {
    accent: "#6f93ad",
    caption: "leader-election · stir-quorum · canvas2d",
    staticT: 0.6,
    create: createRaft,
  },
  "kitty-run": {
    accent: "#5fe6c0",
    caption: "wisp-run · pointer-spring · canvas2d",
    staticT: 0.5,
    create: createKitty,
  },
  "evening-forest": {
    accent: "#d99e63",
    caption: "dusk-sun · pointer-wind · canvas2d",
    staticT: 4.1,
    create: createForest,
  },
  explosion: {
    accent: "#d18a54",
    caption: "core-detonation · tap-to-fire · canvas2d",
    staticT: 2.4,
    create: createExplosion,
  },
  "planck-to-now": {
    accent: "#d8b98e",
    caption: "log-time · drag-to-scrub · canvas2d",
    staticT: 4.0,
    create: createPlanck,
  },
  "practice-map": {
    accent: "#b58e63",
    caption: "route · pointer-attract · canvas2d",
    staticT: 3.7,
    create: createMap,
  },
};

const FALLBACK: CardArt = CARD_ART["practice-map"];

/* ================================================================= *
 * The canvas engine — same lifecycle bar as the shipped ArtCanvas
 * (IO-gated, visibility-paused, DPR-capped, debounced ResizeObserver
 * realloc, reduced-motion static frame, StrictMode-safe teardown), now
 * carrying: a per-plate Interaction bus filled from pointer/focus
 * events, dt passed to draw for physics integration, and an EMA-driven
 * quality ladder (cheaper marks first, then lower fps).
 * ================================================================= */

interface ArtCanvasProps {
  cardId: string;
  accent: string;
  create: () => DrawFn;
  staticT: number;
}

function ArtCanvas({ cardId, accent, create, staticT }: ArtCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The stateful draw instance — born here so all physics state is
    // effect-local (mounts twice under StrictMode without leaking).
    const draw = create();

    const accRgb = hexToRgb(accent);
    const paint: Paint = {
      ink: (a) => `rgba(${INK_RGB}, ${a})`,
      acc: (a) => `rgba(${accRgb}, ${a})`,
    };

    // ---- the interaction bus (all CSS px, matching the draw space) ----
    const it: Interaction = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      speed: 0,
      active: false,
      down: false,
      focus: false,
      energy: 0,
      ripples: [],
    };
    let lastMoveT = 0; // engine-clock time of the last pointermove (for dt)

    let cssW = 1;
    let cssH = 1;
    let dpr = 1;

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      cssW = Math.max(1, Math.round(rect.width));
      cssH = Math.max(1, Math.round(rect.height));
      dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    };

    // ---- quality ladder (mirrors the hero: cheaper marks, then stride) ----
    let quality = 1; // 1 = full, 0 = coarser dither + wider forest stride
    let fps = 26;
    let costEma = 0; // exponential moving average of paint cost in ms

    const paintFrame = (t: number, dt: number) => {
      // advance interaction physics by dt (decays energy/velocity/ripples)
      if (!it.active && dt > 0) {
        const k = halfLife(0.28, dt);
        it.vx *= k;
        it.vy *= k;
      }
      if (dt > 0) it.energy *= halfLife(0.28, dt);
      if (it.focus) it.energy = Math.max(it.energy, 0.22);
      it.speed = Math.hypot(it.vx, it.vy);
      // prune expired ripples (cap already enforced on push)
      if (it.ripples.length) {
        it.ripples = it.ripples.filter((r) => t - r.born <= 1.2);
      }

      const t0 = performance.now();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      draw(ctx, cssW, cssH, t, dt, paint, it, quality);
      const cost = performance.now() - t0;

      // EMA + hysteresis: expensive -> cheaper marks, then drop fps; cheap
      // again -> restore. Wide dead-band so it never oscillates hard.
      costEma = costEma === 0 ? cost : costEma * 0.9 + cost * 0.1;
      if (costEma > 8) {
        quality = 0;
        fps = 18;
      } else if (costEma > 5) {
        quality = 0;
        fps = 26;
      } else if (costEma < 3) {
        quality = 1;
        fps = 26;
      }
    };

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches;
    let visible = false;
    let running = false;
    let rafId = 0;
    let start = 0;
    let last = 0;
    let lastPaint = 0; // engine-clock seconds of the previous painted frame

    const frame = (now: number) => {
      if (!running) return;
      if (start === 0) start = now;
      rafId = requestAnimationFrame(frame);
      const frameInterval = 1000 / fps;
      if (now - last < frameInterval) return;
      last = now;
      const t = (now - start) / 1000;
      const dt = lastPaint === 0 ? 1 / fps : Math.min(0.05, t - lastPaint);
      lastPaint = t;
      paintFrame(t, dt);
    };

    const sync = () => {
      const run = visible && !document.hidden && !reduced;
      if (run && !running) {
        running = true;
        last = 0;
        lastPaint = 0;
        rafId = requestAnimationFrame(frame);
      } else if (!run && running) {
        running = false;
        cancelAnimationFrame(rafId);
      }
      // reduced-motion: one static frame with dt=0 (snaps smoothers), so it
      // reproduces the rest frame exactly (all pointer state is zero here).
      if (!run && reduced) paintFrame(staticT, 0);
    };

    // ---- pointer wiring (fills the bus; tolerant of the hidden panel) ----
    const localPoint = (e: PointerEvent): [number, number] => {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    };

    const engineNow = (): number =>
      start === 0 ? 0 : (performance.now() - start) / 1000;

    const onEnter = (e: PointerEvent) => {
      it.active = true;
      const [px, py] = localPoint(e);
      it.x = px;
      it.y = py;
      lastMoveT = engineNow();
    };

    const onMove = (e: PointerEvent) => {
      const [nx, ny] = localPoint(e);
      const now = engineNow();
      const dt = Math.max(0.001, now - lastMoveT);
      lastMoveT = now;
      it.vx = (nx - it.x) / dt;
      it.vy = (ny - it.y) / dt;
      it.x = nx;
      it.y = ny;
      it.active = true;
      it.speed = Math.hypot(it.vx, it.vy);
      it.energy = Math.min(1, it.energy + Math.min(0.35, it.speed / 4000));
    };

    const addRipple = (x: number, y: number) => {
      it.ripples.push({ x, y, born: engineNow() });
      if (it.ripples.length > 5) it.ripples.shift();
    };

    const onDown = (e: PointerEvent) => {
      it.down = true;
      const [px, py] = localPoint(e);
      it.x = px;
      it.y = py;
      it.active = true;
      it.energy = Math.min(1, it.energy + 0.5);
      addRipple(it.x, it.y);
    };

    const onUp = () => {
      it.down = false;
    };

    const onLeave = () => {
      it.active = false;
      it.down = false;
      it.vx = 0;
      it.vy = 0;
    };

    // Focus lives on the parent <a>: a gentle energy floor is applied in
    // paintFrame while it.focus is true (non-disruptive; no pointer bend).
    const anchor = canvas.closest("a");
    const onFocus = () => {
      it.focus = true;
    };
    const onBlur = () => {
      it.focus = false;
    };

    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    if (anchor) {
      anchor.addEventListener("focus", onFocus);
      anchor.addEventListener("blur", onBlur);
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);

    const onVis = () => sync();
    document.addEventListener("visibilitychange", onVis);

    const onReduce = () => {
      reduced = media.matches;
      sync();
    };
    media.addEventListener("change", onReduce);

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        measure();
        if (!running && reduced) paintFrame(staticT, 0);
      }, 120);
    });
    ro.observe(canvas);

    measure();
    sync();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      media.removeEventListener("change", onReduce);
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      if (anchor) {
        anchor.removeEventListener("focus", onFocus);
        anchor.removeEventListener("blur", onBlur);
      }
      window.clearTimeout(resizeTimer);
    };
  }, [accent, create, staticT]);

  return <canvas ref={ref} className={`art-${cardId}-canvas`} aria-hidden="true" />;
}

export default function ProjectArtwork({ project }: { project: ProjectModule }) {
  const art = CARD_ART[project.id] ?? FALLBACK;
  return (
    <div
      className={`project-artwork ${project.presentation.className}`}
      aria-hidden="true"
    >
      <ArtCanvas
        cardId={project.id}
        accent={art.accent}
        create={art.create}
        staticT={art.staticT}
      />
      <span className="art-caption">{art.caption}</span>
    </div>
  );
}
