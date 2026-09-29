import { useEffect, useRef } from "react";

/**
 * HeroFluid — a hand-rolled incompressible fluid simulation (semi-Lagrangian
 * advection + Jacobi pressure projection) whose dye field is rendered NOT as a
 * smooth gradient but through an ordered (Bayer) dither into crisp, discrete
 * halftone marks. Liquid physics, printed rendering. Canvas2D only, no WebGL,
 * no blur. Self-driven by periodic emitters; pointer stirs it as a bonus layer.
 *
 * Presentation: the sim draws into an OFFSCREEN canvas (never in the DOM) and
 * publishes changed frames as PNG object URLs into an <img>. A live canvas
 * layer tints the page on some GPU-composited paths (Yandex-macOS, device-
 * proven); an <img> does not.
 *
 * Lifecycle: ~30fps fixed sim cadence, ≤20fps publish cadence with change
 * detection, graceful degradation (iterations first, then render stride),
 * IntersectionObserver + visibility pause, reduced-motion single warm static
 * frame, ResizeObserver realloc, and StrictMode-safe teardown (all state is
 * effect-local, outstanding object URLs revoked).
 */
export default function HeroFluid() {
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const imgEl = imgRef.current;
    if (!imgEl) return;
    const canvas = document.createElement("canvas");
    // alpha: true on purpose — the PNG stays transparent and CSS (var(--ink-bg))
    // paints the flat ink behind it, so no canvas-vs-CSS colour-space mismatch.
    const ctx2d = canvas.getContext("2d", { alpha: true, colorSpace: "srgb" });
    if (!ctx2d) return;
    // Definite-type aliases: the hoisted function declarations below capture
    // these, and TS strict cannot carry the null-narrowing into them.
    const img: HTMLImageElement = imgEl;
    const ctx: CanvasRenderingContext2D = ctx2d;

    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    // ---- constants ----------------------------------------------------------
    const LEVELS = 6;
    const TARGET_CELL = 13; // approx css px per grid cell
    const MAX_GW = 152;
    const MAX_GH = 96;
    const DT = 1 / 32;
    const STEP_MS = 1000 / 30;
    const PUB_MS = 50; // publish cap: 20 frames/s
    const PUB_MAX_W = 720; // publish width cap in css px; never upscaled
    const BUOY = 14;
    const AMB = 4.5;
    // warm off-white -> ochre ramp, opaque (tone is by bucket, never by alpha)
    const RAMP = ["#26333b", "#465059", "#7d7669", "#b6ac95", "#d49a5f", "#ecba7f"];

    // Bayer 8x8, normalized to [0,1)
    const BAYER = new Float32Array(64);
    {
      const base = [
        0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
        12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
        3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
        15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
      ];
      for (let k = 0; k < 64; k++) BAYER[k] = (base[k] + 0.5) / 64;
    }

    // ---- mutable state (all effect-local) -----------------------------------
    let GW = 0;
    let GH = 0;
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let vx0 = new Float32Array(0);
    let vy0 = new Float32Array(0);
    let dens = new Float32Array(0);
    let dens0 = new Float32Array(0);
    let pr = new Float32Array(0);
    let dv = new Float32Array(0);
    let levelBuf = new Int8Array(0);

    let outW = 0;
    let outH = 0;
    let simTime = 0;

    let emitters: { x: number; y: number; next: number }[] = [];

    let iters = 16;
    let stride = 1;
    let slow = 0;
    let fastRun = 0;

    let raf = 0;
    let last = 0;
    let onScreen = true;
    let hidden = document.hidden;
    let reduce = reduceMq.matches;
    let running = false;

    let ptrActive = false;
    let ptrFresh = false;
    let pgx = 0;
    let pgy = 0;
    let ppgx = 0;
    let ppgy = 0;

    let roTimer = 0;

    // publish state
    let pubLevels = new Int8Array(0); // levels as last published
    let pubStride = 0;
    let lastPub = 0;
    let encoding = false;
    let forceNext = false;
    let gen = 0; // bumped on realloc so in-flight blobs of the old size are dropped
    let disposed = false;
    let shownUrl = ""; // loaded and on screen
    let pendingUrls: string[] = []; // assigned to img.src, load not yet confirmed

    // ---- grid ---------------------------------------------------------------
    function allocGrid(cssW: number, cssH: number): void {
      GW = Math.max(24, Math.min(MAX_GW, Math.round(cssW / TARGET_CELL)));
      GH = Math.max(20, Math.min(MAX_GH, Math.round(cssH / TARGET_CELL)));
      const n = GW * GH;
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      vx0 = new Float32Array(n);
      vy0 = new Float32Array(n);
      dens = new Float32Array(n);
      dens0 = new Float32Array(n);
      pr = new Float32Array(n);
      dv = new Float32Array(n);
      levelBuf = new Int8Array(n);
      pubLevels = new Int8Array(n);
      pubStride = 0;
      emitters = [
        { x: GW * 0.27, y: GH * 0.74, next: 0.6 },
        { x: GW * 0.52, y: GH * 0.84, next: 1.9 },
        { x: GW * 0.75, y: GH * 0.68, next: 3.2 },
      ];
    }

    function inject(cx: number, cy: number, amount: number, radius: number, fvx: number, fvy: number): void {
      const r = Math.ceil(radius);
      const bx = Math.round(cx);
      const by = Math.round(cy);
      const r2 = radius * radius;
      for (let y = -r; y <= r; y++) {
        const gy = by + y;
        if (gy < 1 || gy >= GH - 1) continue;
        for (let x = -r; x <= r; x++) {
          const gx = bx + x;
          if (gx < 1 || gx >= GW - 1) continue;
          const d2 = x * x + y * y;
          if (d2 > r2) continue;
          const fall = 1 - Math.sqrt(d2) / radius;
          const i = gx + gy * GW;
          dens[i] += amount * fall;
          vx[i] += fvx * fall * DT;
          vy[i] += fvy * fall * DT;
        }
      }
    }

    function addForces(): void {
      simTime += DT;
      for (let y = 1; y < GH - 1; y++) {
        for (let x = 1; x < GW - 1; x++) {
          const i = x + y * GW;
          vy[i] -= dens[i] * BUOY * DT;
          vx[i] += Math.sin(y * 0.22 + simTime * 0.6) * AMB * DT;
          vy[i] += Math.cos(x * 0.19 - simTime * 0.5) * AMB * DT * 0.55;
        }
      }
      for (const e of emitters) {
        inject(e.x, e.y, 0.16, 2.2, 0, -7);
        e.next -= DT;
        if (e.next <= 0) {
          e.next = 2.4 + Math.random() * 3.4;
          const dx = (Math.random() - 0.5) * GW * 0.32;
          inject(e.x + dx, e.y, 0.9, 3.2, (Math.random() - 0.5) * 30, -44 - Math.random() * 30);
        }
      }
      if (ptrFresh) {
        const dvx = (pgx - ppgx) * 26;
        const dvy = (pgy - ppgy) * 26;
        inject(pgx, pgy, 0.7, 3.0, dvx, dvy);
        ptrFresh = false;
      }
    }

    function advect(dst: Float32Array, src: Float32Array, uvx: Float32Array, uvy: Float32Array): void {
      for (let y = 1; y < GH - 1; y++) {
        for (let x = 1; x < GW - 1; x++) {
          const i = x + y * GW;
          let fx = x - DT * uvx[i];
          let fy = y - DT * uvy[i];
          if (fx < 0.5) fx = 0.5; else if (fx > GW - 1.5) fx = GW - 1.5;
          if (fy < 0.5) fy = 0.5; else if (fy > GH - 1.5) fy = GH - 1.5;
          const x0 = fx | 0;
          const y0 = fy | 0;
          const sx = fx - x0;
          const sy = fy - y0;
          const i00 = x0 + y0 * GW;
          dst[i] =
            (1 - sx) * ((1 - sy) * src[i00] + sy * src[i00 + GW]) +
            sx * ((1 - sy) * src[i00 + 1] + sy * src[i00 + 1 + GW]);
        }
      }
    }

    function project(it: number): void {
      for (let y = 1; y < GH - 1; y++) {
        for (let x = 1; x < GW - 1; x++) {
          const i = x + y * GW;
          dv[i] = -0.5 * (vx[i + 1] - vx[i - 1] + vy[i + GW] - vy[i - GW]);
          pr[i] = 0;
        }
      }
      for (let k = 0; k < it; k++) {
        for (let y = 1; y < GH - 1; y++) {
          for (let x = 1; x < GW - 1; x++) {
            const i = x + y * GW;
            pr[i] = (dv[i] + pr[i - 1] + pr[i + 1] + pr[i - GW] + pr[i + GW]) * 0.25;
          }
        }
      }
      for (let y = 1; y < GH - 1; y++) {
        for (let x = 1; x < GW - 1; x++) {
          const i = x + y * GW;
          vx[i] -= 0.5 * (pr[i + 1] - pr[i - 1]);
          vy[i] -= 0.5 * (pr[i + GW] - pr[i - GW]);
        }
      }
    }

    function simulate(it: number): void {
      addForces();
      project(it);
      vx0.set(vx);
      vy0.set(vy);
      advect(vx, vx0, vx0, vy0);
      advect(vy, vy0, vx0, vy0);
      project(it);
      dens0.set(dens);
      advect(dens, dens0, vx, vy);
      const n = GW * GH;
      for (let i = 0; i < n; i++) {
        dens[i] *= 0.985;
        if (dens[i] > 1.6) dens[i] = 1.6;
        vx[i] *= 0.994;
        vy[i] *= 0.994;
      }
    }

    function computeLevels(): void {
      const mx = Math.max(2, Math.round(GW * 0.12));
      const my = Math.max(2, Math.round(GH * 0.14));
      for (let y = 0; y < GH; y++) {
        let fyv = 1;
        if (y < my) fyv = y / my;
        else if (y > GH - 1 - my) fyv = (GH - 1 - y) / my;
        if (fyv < 0) fyv = 0;
        for (let x = 0; x < GW; x++) {
          let fxv = 1;
          if (x < mx) fxv = x / mx;
          else if (x > GW - 1 - mx) fxv = (GW - 1 - x) / mx;
          if (fxv < 0) fxv = 0;
          const i = x + y * GW;
          let d = (dens[i] * fxv * fyv) / 1.15;
          if (d < 0) d = 0; else if (d > 1) d = 1;
          d = d * d * (3 - 2 * d);
          const t = BAYER[(x & 7) + ((y & 7) << 3)];
          let lv = (d * LEVELS + t) | 0;
          if (lv > LEVELS) lv = LEVELS;
          levelBuf[i] = lv;
        }
      }
    }

    function render(st: number): void {
      // Transparent clear, never a painted fill — see the alpha note above.
      ctx.clearRect(0, 0, outW, outH);
      const uw = outW / GW;
      const uh = outH / GH;
      const cw = uw * st;
      const ch = uh * st;
      for (let y = 0; y < GH; y += st) {
        for (let x = 0; x < GW; x += st) {
          let lv = levelBuf[x + y * GW];
          if (st === 2) {
            if (x + 1 < GW) { const v = levelBuf[x + 1 + y * GW]; if (v > lv) lv = v; }
            if (y + 1 < GH) { const v = levelBuf[x + (y + 1) * GW]; if (v > lv) lv = v; }
            if (x + 1 < GW && y + 1 < GH) { const v = levelBuf[x + 1 + (y + 1) * GW]; if (v > lv) lv = v; }
          }
          if (lv < 1) continue;
          ctx.fillStyle = RAMP[lv - 1];
          const frac = 0.42 + 0.58 * (lv / LEVELS);
          const mw = cw * frac;
          const mh = ch * frac;
          const px = Math.round(x * uw + (cw - mw) * 0.5);
          const py = Math.round(y * uh + (ch - mh) * 0.5);
          const w = Math.max(1, Math.round(mw));
          const h = Math.max(1, Math.round(mh));
          ctx.fillRect(px, py, w, h);
        }
      }
    }

    // ---- publish ------------------------------------------------------------
    function fieldChanged(): boolean {
      if (stride !== pubStride) return true;
      const n = GW * GH;
      for (let i = 0; i < n; i++) if (levelBuf[i] !== pubLevels[i]) return true;
      return false;
    }

    function show(url: string): void {
      // Never revoke a URL the browser may still be loading — that aborts the
      // fetch and fires error, which would cascade into the successor. Failed
      // and superseded URLs are revoked only after a later confirmed load.
      pendingUrls.push(url);
      img.src = url;
    }

    function onLoad(): void {
      const latest = pendingUrls[pendingUrls.length - 1];
      if (!latest) return;
      if (shownUrl) URL.revokeObjectURL(shownUrl);
      for (const u of pendingUrls) if (u !== latest) URL.revokeObjectURL(u);
      pendingUrls = [];
      shownUrl = latest;
    }

    function onError(): void {
      // The failed URL stays in pendingUrls — revoked when the next frame
      // loads (or at teardown). Revoking here could kill the successor.
      forceNext = true;
    }

    function revokePending(): void {
      for (const u of pendingUrls) URL.revokeObjectURL(u);
      pendingUrls = [];
    }

    function publish(force: boolean): void {
      if (force) forceNext = true;
      if (encoding) return; // the in-flight callback drains forceNext
      const now = performance.now();
      if (!forceNext && now - lastPub < PUB_MS) return;
      if (!forceNext && !fieldChanged()) return;
      forceNext = false;
      lastPub = now;
      render(stride);
      pubLevels.set(levelBuf);
      pubStride = stride;
      encoding = true;
      const g = gen;
      canvas.toBlob((blob) => {
        encoding = false;
        if (disposed) return;
        if (blob && g === gen) show(URL.createObjectURL(blob));
        else forceNext = true;
        if (forceNext) publish(false);
      }, "image/png");
    }

    function warmUp(): void {
      vx.fill(0); vy.fill(0); vx0.fill(0); vy0.fill(0);
      dens.fill(0); dens0.fill(0); pr.fill(0); dv.fill(0);
      simTime = 0;
      for (const e of emitters) e.next = Math.random() * 2;
      for (let s = 0; s < 68; s++) simulate(14);
      computeLevels();
    }

    function resize(): void {
      const rect = img.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));
      // Publish at css resolution, capped in width; the img upscales pixelated.
      const scale = Math.min(1, PUB_MAX_W / cssW);
      outW = Math.max(1, Math.round(cssW * scale));
      outH = Math.max(1, Math.round(cssH * scale));
      canvas.width = outW;
      canvas.height = outH;
      gen++;
      allocGrid(cssW, cssH);
      warmUp();
      publish(true);
    }

    function sync(): void {
      running = onScreen && !hidden && !reduce;
    }

    function frame(now: number): void {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      if (!last) { last = now; return; }
      const elapsed = now - last;
      if (elapsed < STEP_MS) return;
      last = now - (elapsed % STEP_MS);
      const t0 = performance.now();
      simulate(iters);
      computeLevels();
      publish(false);
      const cost = performance.now() - t0;
      if (cost > 26) {
        slow++; fastRun = 0;
        if (slow > 6) { slow = 0; if (iters > 6) iters -= 2; else if (stride < 2) stride = 2; }
      } else if (cost < 13) {
        fastRun++; slow = 0;
        if (fastRun > 90) { fastRun = 0; if (stride > 1) stride = 1; else if (iters < 16) iters += 2; }
      }
    }

    function onPointer(e: PointerEvent): void {
      const rect = img.getBoundingClientRect();
      const rx = e.clientX - rect.left;
      const ry = e.clientY - rect.top;
      if (rx < 0 || ry < 0 || rx > rect.width || ry > rect.height) { ptrActive = false; return; }
      ppgx = pgx; ppgy = pgy;
      pgx = (rx / rect.width) * GW;
      pgy = (ry / rect.height) * GH;
      if (!ptrActive) { ppgx = pgx; ppgy = pgy; }
      ptrActive = true;
      ptrFresh = true;
    }

    function onVis(): void {
      hidden = document.hidden;
      if (!hidden) last = 0;
      sync();
    }

    function onReduce(e: MediaQueryListEvent): void {
      reduce = e.matches;
      if (reduce) { warmUp(); publish(true); }
      sync();
    }

    // ---- observers / listeners ----------------------------------------------
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) onScreen = en.isIntersecting;
      sync();
    }, { threshold: 0 });
    io.observe(img);

    const ro = new ResizeObserver(() => {
      window.clearTimeout(roTimer);
      roTimer = window.setTimeout(() => { resize(); }, 150);
    });
    ro.observe(img);

    img.addEventListener("load", onLoad);
    img.addEventListener("error", onError);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    reduceMq.addEventListener("change", onReduce);

    // ---- start --------------------------------------------------------------
    resize();
    sync();
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.clearTimeout(roTimer);
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      reduceMq.removeEventListener("change", onReduce);
      if (shownUrl) URL.revokeObjectURL(shownUrl);
      revokePending();
      shownUrl = "";
    };
  }, []);

  return (
    <img
      ref={imgRef}
      className="signal-index-hero-fluid-canvas"
      aria-hidden="true"
      alt=""
      style={{ imageRendering: "pixelated" }}
    />
  );
}
