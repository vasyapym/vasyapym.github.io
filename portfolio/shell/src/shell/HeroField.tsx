import { useEffect, useRef } from "react";

/* ---- pure noise helpers (module scope) ---------------------------------- */

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function hashi(x: number, y: number, z: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1013904223)) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177) | 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

function vnoise(x: number, y: number, z: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const ux = fade(x - ix), uy = fade(y - iy), uz = fade(z - iz);
  const c000 = hashi(ix, iy, iz),     c100 = hashi(ix + 1, iy, iz);
  const c010 = hashi(ix, iy + 1, iz), c110 = hashi(ix + 1, iy + 1, iz);
  const c001 = hashi(ix, iy, iz + 1),     c101 = hashi(ix + 1, iy, iz + 1);
  const c011 = hashi(ix, iy + 1, iz + 1), c111 = hashi(ix + 1, iy + 1, iz + 1);
  const x00 = lerp(c000, c100, ux), x10 = lerp(c010, c110, ux);
  const x01 = lerp(c001, c101, ux), x11 = lerp(c011, c111, ux);
  return lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz);
}

const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* Quality ladder: coarser grid + sparser seeds + shorter filings as we drop. */
const QUALITY = [
  { cell: 40, spacing: 24, steps: 11 },
  { cell: 48, spacing: 30, steps: 9 },
  { cell: 58, spacing: 38, steps: 8 },
  { cell: 72, spacing: 50, steps: 7 },
] as const;

const UPDATE_MS = 1000 / 30;
const BUCKETS = 6;
const ALPHA_CEILING = 0.5; // legibility ceiling (incumbent used 0.55)
const VORTEX_K = 1.4;
const TILT_K = 0.4;

/* Ochre ramp: accent (#d39b61) -> bright (#e8b57c) by speed bucket. */
const bucketStyle = (b: number): string => {
  const t = b / BUCKETS;
  const r = Math.round(lerp(211, 232, t));
  const g = Math.round(lerp(155, 181, t));
  const bl = Math.round(lerp(97, 124, t));
  const a = (b / BUCKETS) * ALPHA_CEILING;
  return `rgba(${r},${g},${bl},${a.toFixed(3)})`;
};

export default function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const host = canvas.parentElement; // the hero <section> (incumbent pattern)
    if (!host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* ---- mutable state --------------------------------------------------- */
    let cssW = 0, cssH = 0, dpr = 1;
    let cell = 40, spacing = 24, steps = 11;
    let cols = 0, rows = 0, nCols = 0;
    let P = new Float32Array(0);
    let DX = new Float32Array(0);
    let DY = new Float32Array(0);
    let S = new Float32Array(0);
    let seeds: { x: number; y: number; leg: number }[] = [];

    let timeSec = 0;
    let rafId = 0;
    let lastDraw = 0;
    let ema = 16, frames = 0, quality = 1;
    let visible = true, pageVisible = true;

    // interaction (eased)
    let targetPx = 0, targetPy = 0, easedPx = 0, easedPy = 0;
    let pointerStrength = 0, lastMove = -1e9;
    let tiltX = 0, tiltY = 0, tiltXe = 0, tiltYe = 0;

    const bucketStyles = Array.from({ length: BUCKETS + 1 }, (_, b) => bucketStyle(b));

    /* ---- legibility field (quiet zones over the text) -------------------- */
    const legibility = (x: number, y: number): number => {
      let w = 1;
      // header band (top 64px) — copy top starts >= 84px
      w *= 0.3 + 0.7 * smoothstep(0, 92, y);
      if (cssW > 700) {
        // desktop: headline + CTA live left ~0..0.58, vertically centred
        const inX = 1 - smoothstep(0.44, 0.64, x / cssW);
        const inY = smoothstep(0.14, 0.26, y / cssH) * (1 - smoothstep(0.74, 0.86, y / cssH));
        w *= 1 - 0.62 * inX * inY;
      } else {
        // mobile: copy up top, catalogue fills the rest — keep upper band quiet
        w *= 1 - 0.5 * (1 - smoothstep(0, 0.62, y / cssH));
      }
      return w;
    };

    /* ---- sizing / allocation -------------------------------------------- */
    const measure = () => {
      const rect = host.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      easedPx = targetPx = cssW / 2;
      easedPy = targetPy = cssH / 2;
    };

    const applyQuality = () => {
      const q = QUALITY[quality];
      cell = q.cell; spacing = q.spacing; steps = q.steps;
      cols = Math.max(1, Math.ceil(cssW / cell));
      rows = Math.max(1, Math.ceil(cssH / cell));
      nCols = cols + 1;
      const nodes = (cols + 1) * (rows + 1);
      P = new Float32Array(nodes);
      DX = new Float32Array(nodes);
      DY = new Float32Array(nodes);
      S = new Float32Array(nodes);
      seeds = [];
      for (let y = spacing * 0.5; y < cssH; y += spacing) {
        for (let x = spacing * 0.5; x < cssW; x += spacing) {
          const jx = (hashi(Math.round(x), Math.round(y), 11) - 0.5) * spacing * 0.5;
          const jy = (hashi(Math.round(x), Math.round(y), 23) - 0.5) * spacing * 0.5;
          const px = x + jx, py = y + jy;
          const leg = legibility(px, py);
          if (leg <= 0.05) continue; // skip fully-quiet zones (text) -> perf + clean type
          seeds.push({ x: px, y: py, leg });
        }
      }
    };

    /* ---- field ----------------------------------------------------------- */
    const potential = (x: number, y: number, t: number): number => {
      const z = t * 0.09;
      let f = 1 / 300, a = 1, sum = 0, norm = 0;
      for (let o = 0; o < 2; o++) {
        sum += a * vnoise(x * f + t * 0.010, y * f - t * 0.008, z + o * 3.7);
        norm += a; f *= 2.3; a *= 0.5;
      }
      return sum / norm;
    };

    const computeField = (t: number) => {
      for (let gy = 0; gy <= rows; gy++) {
        for (let gx = 0; gx <= cols; gx++) {
          P[gy * nCols + gx] = potential(gx * cell, gy * cell, t);
        }
      }
      let maxM = 1e-6;
      for (let gy = 0; gy <= rows; gy++) {
        for (let gx = 0; gx <= cols; gx++) {
          const i = gy * nCols + gx;
          const l = P[gy * nCols + Math.max(0, gx - 1)];
          const r = P[gy * nCols + Math.min(cols, gx + 1)];
          const u = P[Math.max(0, gy - 1) * nCols + gx];
          const d = P[Math.min(rows, gy + 1) * nCols + gx];
          // curl of scalar potential -> divergence-free flow: (∂P/∂y, -∂P/∂x)
          const fx = d - u;
          const fy = -(r - l);
          const m = Math.hypot(fx, fy);
          if (m > maxM) maxM = m;
          if (m > 1e-6) { DX[i] = fx / m; DY[i] = fy / m; } else { DX[i] = 0; DY[i] = 0; }
          S[i] = m;
        }
      }
      const inv = 1 / (maxM * 0.7);
      for (let i = 0; i < S.length; i++) S[i] = Math.min(1, S[i] * inv);
    };

    const bilerp = (arr: Float32Array, ix: number, iy: number, fx: number, fy: number): number => {
      const i00 = iy * nCols + ix, i10 = i00 + 1, i01 = i00 + nCols, i11 = i01 + 1;
      return lerp(lerp(arr[i00], arr[i10], fx), lerp(arr[i01], arr[i11], fx), fy);
    };

    const flow = (x: number, y: number): { dx: number; dy: number; s: number } => {
      let gx = x / cell, gy = y / cell;
      if (gx < 0) gx = 0; else if (gx > cols) gx = cols;
      if (gy < 0) gy = 0; else if (gy > rows) gy = rows;
      const ix = gx >= cols ? cols - 1 : Math.floor(gx);
      const iy = gy >= rows ? rows - 1 : Math.floor(gy);
      const fx = gx - ix, fy = gy - iy;
      return {
        dx: bilerp(DX, ix, iy, fx, fy),
        dy: bilerp(DY, ix, iy, fx, fy),
        s: bilerp(S, ix, iy, fx, fy),
      };
    };

    const vortexR = () => Math.min(cssW, cssH) * 0.3;

    const steer = (x: number, y: number, dx: number, dy: number): [number, number] => {
      if (pointerStrength > 0.01) {
        const R = vortexR();
        const rx = x - easedPx, ry = y - easedPy;
        const r = Math.hypot(rx, ry);
        if (r < R) {
          const nr = r || 1;
          const inf = (1 - r / R) * pointerStrength * VORTEX_K;
          dx += (-ry / nr) * inf;
          dy += (rx / nr) * inf;
        }
      }
      dx += tiltXe * TILT_K;
      dy += tiltYe * TILT_K;
      return [dx, dy];
    };

    /* ---- render ---------------------------------------------------------- */
    const render = (t: number) => {
      computeField(t);
      ctx.clearRect(0, 0, cssW, cssH); // full clear = crisp, no ghosting/fog
      const paths: Path2D[] = Array.from({ length: BUCKETS + 1 }, () => new Path2D());
      const half = Math.floor(steps / 2);
      const stepLen = spacing * 0.5;

      for (let si = 0; si < seeds.length; si++) {
        const seed = seeds[si];
        const seedFlow = flow(seed.x, seed.y);
        const alpha = seed.leg * (0.3 + 0.7 * seedFlow.s);
        if (alpha < 0.05) continue;
        const b = Math.min(BUCKETS, Math.max(1, Math.round(alpha * BUCKETS)));
        const path = paths[b];

        // centred filing: trace backward then forward through the field
        const px: number[] = [], py: number[] = [];
        let x = seed.x, y = seed.y;
        for (let i = 0; i < half; i++) {
          const f = flow(x, y);
          let [dx, dy] = steer(x, y, f.dx, f.dy);
          const m = Math.hypot(dx, dy) || 1;
          x -= (dx / m) * stepLen; y -= (dy / m) * stepLen;
          px.unshift(x); py.unshift(y);
        }
        px.push(seed.x); py.push(seed.y);
        x = seed.x; y = seed.y;
        for (let i = 0; i < half; i++) {
          const f = flow(x, y);
          let [dx, dy] = steer(x, y, f.dx, f.dy);
          const m = Math.hypot(dx, dy) || 1;
          x += (dx / m) * stepLen; y += (dy / m) * stepLen;
          px.push(x); py.push(y);
        }

        path.moveTo(px[0], py[0]);
        for (let i = 1; i < px.length; i++) path.lineTo(px[i], py[i]);
      }

      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let b = 1; b <= BUCKETS; b++) {
        ctx.strokeStyle = bucketStyles[b];
        ctx.stroke(paths[b]);
      }
    };

    /* ---- loop + degradation --------------------------------------------- */
    const loop = (now: number) => {
      rafId = window.requestAnimationFrame(loop);
      if (now - lastDraw < UPDATE_MS) return;
      const dt = Math.min((now - lastDraw) / 1000, 0.05);
      lastDraw = now;
      timeSec += dt;

      const k = 1 - Math.exp(-6 * dt);
      easedPx += (targetPx - easedPx) * k;
      easedPy += (targetPy - easedPy) * k;
      const moving = now - lastMove < 160 ? 1 : 0;
      pointerStrength += (moving - pointerStrength) * k;
      tiltXe += (tiltX - tiltXe) * k;
      tiltYe += (tiltY - tiltYe) * k;

      const t0 = performance.now();
      render(timeSec);
      ema += (performance.now() - t0 - ema) * 0.12;
      frames++;
      if (frames > 60 && ema > 26 && quality < QUALITY.length - 1) {
        quality++; applyQuality(); frames = 0; ema = 16;
      } else if (frames > 120 && ema < 12 && quality > 0) {
        quality--; applyQuality(); frames = 0; ema = 16;
      }
    };

    const start = () => { if (!rafId) { lastDraw = performance.now(); rafId = window.requestAnimationFrame(loop); } };
    const stop = () => { if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; } };
    const updateRunning = () => { if (visible && pageVisible) start(); else stop(); };

    /* ---- interaction ----------------------------------------------------- */
    const onPointer = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      targetPx = e.clientX - rect.left;
      targetPy = e.clientY - rect.top;
      lastMove = performance.now();
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tiltX = Math.max(-1, Math.min(1, e.gamma / 45));
      tiltY = Math.max(-1, Math.min(1, (e.beta - 40) / 45));
    };
    const onVisibility = () => { pageVisible = !document.hidden; updateRunning(); };

    /* ---- setup / teardown ----------------------------------------------- */
    let teardown = () => {};
    const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

    const setupStatic = () => {
      measure(); applyQuality(); render(0);
      const ro = new ResizeObserver(() => { measure(); applyQuality(); render(0); });
      ro.observe(host);
      teardown = () => ro.disconnect();
    };

    const setupLive = () => {
      measure(); applyQuality();

      const io = new IntersectionObserver(
        (entries) => { visible = entries.some((en) => en.isIntersecting); updateRunning(); },
        { threshold: 0 },
      );
      io.observe(host);

      const ro = new ResizeObserver(() => { measure(); applyQuality(); });
      ro.observe(host);

      host.addEventListener("pointermove", onPointer, { passive: true });
      host.addEventListener("pointerdown", onPointer, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);

      // deviceorientation ONLY where permissionless (Android). Never prompt.
      const DOE = window.DeviceOrientationEvent as
        | (typeof DeviceOrientationEvent & { requestPermission?: unknown })
        | undefined;
      const permissionless = typeof DOE !== "undefined" && typeof DOE.requestPermission !== "function";
      if (permissionless) window.addEventListener("deviceorientation", onTilt, { passive: true });

      start();

      teardown = () => {
        stop();
        io.disconnect();
        ro.disconnect();
        host.removeEventListener("pointermove", onPointer);
        host.removeEventListener("pointerdown", onPointer);
        document.removeEventListener("visibilitychange", onVisibility);
        if (permissionless) window.removeEventListener("deviceorientation", onTilt);
      };
    };

    const init = () => { if (reduceMQ.matches) setupStatic(); else setupLive(); };
    const onReduceChange = () => { teardown(); init(); };
    reduceMQ.addEventListener("change", onReduceChange);
    init();

    return () => {
      reduceMQ.removeEventListener("change", onReduceChange);
      teardown();
    };
  }, []);

  return <canvas ref={ref} className="signal-index-hero-glyphs" aria-hidden="true" />;
}
