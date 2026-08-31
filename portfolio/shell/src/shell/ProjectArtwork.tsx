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

const INK_RGB = "238, 234, 224";

type Paint = {
  ink: (a: number) => string;
  acc: (a: number) => string;
};

type DrawFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  p: Paint,
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

/* ------------------------------- 01 raft-cluster ------------------- */

const RAFT_FOLLOWERS: ReadonlyArray<readonly [number, number]> = [
  [-0.95, -0.5],
  [0.9, -0.62],
  [1.0, 0.48],
  [-0.7, 0.66],
];

const drawRaft: DrawFn = (ctx, w, h, t, p) => {
  const ax = w * 0.52;
  const ay = h * 0.44;
  const r = Math.min(w, h) * 0.34;
  const term = 6.5;
  const tp = (t % term) / term;
  const electing = tp < 0.18;
  const beat = electing ? Math.sin((tp / 0.18) * Math.PI) : 0;

  ditherHalo(ctx, ax, ay, r * 0.8, 0.55 + 0.3 * beat, p.acc, 3);

  ctx.lineWidth = 1;
  for (let i = 0; i < RAFT_FOLLOWERS.length; i++) {
    const fx = ax + RAFT_FOLLOWERS[i][0] * r;
    const fy = ay + RAFT_FOLLOWERS[i][1] * r * 0.8;
    ctx.strokeStyle = p.ink(0.1 + 0.1 * beat);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(fx, fy);
    ctx.stroke();
  }

  if (electing) {
    const f = ease(tp / 0.18);
    for (let i = 0; i < RAFT_FOLLOWERS.length; i++) {
      const fx = ax + RAFT_FOLLOWERS[i][0] * r;
      const fy = ay + RAFT_FOLLOWERS[i][1] * r * 0.8;
      const px = ax + (fx - ax) * f;
      const py = ay + (fy - ay) * f;
      ctx.fillStyle = p.acc(0.5 * (1 - f) + 0.2);
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < RAFT_FOLLOWERS.length; i++) {
    const fx = ax + RAFT_FOLLOWERS[i][0] * r;
    const fy = ay + RAFT_FOLLOWERS[i][1] * r * 0.8;
    ctx.strokeStyle = p.ink(0.34);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(fx, fy, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = p.ink(0.42 + 0.22 * beat);
    ctx.beginPath();
    ctx.arc(fx, fy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  const crown = 7;
  ctx.fillStyle = p.acc(0.4 + 0.3 * beat);
  for (let k = 0; k < crown; k++) {
    const a = (k / crown) * Math.PI * 2 + t * 0.5;
    ctx.beginPath();
    ctx.arc(ax + Math.cos(a) * 12, ay + Math.sin(a) * 12 * 0.85, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = p.acc(0.92);
  ctx.beginPath();
  ctx.arc(ax, ay, 5 + 1.6 * beat, 0, Math.PI * 2);
  ctx.fill();
};

/* ------------------------------- 02 kitty-run --------------------- */

const drawKitty: DrawFn = (ctx, w, h, t, p) => {
  const cx = w * 0.52;
  const cy = h * 0.44;
  const rx = Math.min(w * 0.3, 150);
  const ry = Math.min(h * 0.26, 42);
  const path = (s: number) =>
    [
      cx + Math.cos(s * Math.PI * 2) * rx,
      cy + Math.sin(s * Math.PI * 2) * ry,
    ] as const;

  ctx.fillStyle = p.ink(0.12);
  const track = 54;
  for (let k = 0; k < track; k++) {
    const [x, y] = path(k / track);
    ctx.beginPath();
    ctx.arc(x, y, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  const dp = (t % 7) / 7;
  const dash = dp < 0.14 ? Math.sin((dp / 0.14) * Math.PI) : 0;
  const sRun = (t * 0.15) % 1;

  const sGhost = (t * 0.15 + 0.5) % 1;
  for (let k = 0; k < 9; k++) {
    const [x, y] = path(sGhost - k * 0.012);
    ctx.fillStyle = p.ink(0.3 * (1 - k / 9));
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, 1.8 - k * 0.14), 0, Math.PI * 2);
    ctx.fill();
  }

  const trail = 12 + Math.round(dash * 12);
  for (let k = trail - 1; k >= 0; k--) {
    const [x, y] = path(sRun - k * 0.01);
    const a = 1 - k / trail;
    ctx.fillStyle = p.acc(a * 0.85);
    ctx.beginPath();
    ctx.arc(x, y, 2.2 * a + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const [hx, hy] = path(sRun);
  if (dash > 0.05) {
    ditherHalo(ctx, hx, hy, 12 + 8 * dash, 0.5 * dash, p.acc);
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
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
  }
};

/* ------------------------------- 03 evening-forest ---------------- */

const FOREST_BANDS: ReadonlyArray<
  readonly [number, number, number, number, number]
> = [
  // y, amp, freq, speed, alpha
  [0.22, 3.2, 1.4, 0.13, 0.1],
  [0.32, 2.8, 1.1, -0.1, 0.13],
  [0.62, 2.6, 1.6, 0.12, 0.2],
  [0.72, 2.2, 2.0, -0.09, 0.14],
] as const;

const drawForest: DrawFn = (ctx, w, h, t, p) => {
  const sunX = w * 0.52;
  const sunY = h * 0.48;

  ditherHalo(ctx, sunX, sunY, Math.min(w, h) * 0.28, 0.6, p.acc, 3);

  const step = 12;
  for (let bi = 0; bi < FOREST_BANDS.length; bi++) {
    const [by, amp, freq, sp, alpha] = FOREST_BANDS[bi];
    const baseY = by * h;
    for (let x = step * 0.5; x < w; x += step) {
      const yy = baseY + Math.sin((x / w) * Math.PI * 2 * freq + t * sp) * amp;
      ctx.fillStyle = p.ink(alpha);
      ctx.beginPath();
      ctx.arc(x, yy, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const wp = (t / 8) % 1;
  const gb = FOREST_BANDS[2];
  const wx = wp * w;
  const near = Math.max(0, 1 - Math.abs(wx - sunX) / (w * 0.12));

  ctx.fillStyle = p.acc(0.9);
  ctx.beginPath();
  ctx.arc(sunX, sunY, 4.2 + 1.4 * near, 0, Math.PI * 2);
  ctx.fill();

  for (let k = 4; k >= 0; k--) {
    const px = (wp - k * 0.01) * w;
    const py = gb[0] * h + Math.sin((px / w) * Math.PI * 2 * gb[2] + t * gb[3]) * gb[1];
    ctx.fillStyle = p.ink(0.5 * (1 - k / 5) + 0.12);
    ctx.beginPath();
    ctx.arc(px, py, 1.8 - k * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
};

/* ------------------------------- 04 explosion --------------------- */

const SHARDS = 40;

const drawExplosion: DrawFn = (ctx, w, h, t, p) => {
  const cx = w * 0.52;
  const cy = h * 0.44;
  const R = Math.min(w, h) * 0.32;
  const T = 7.5;
  const tp = (t % T) / T;

  let charge: number;
  let e: number;
  let fade: number;
  if (tp < 0.4) {
    charge = ease(tp / 0.4);
    e = 0;
    fade = 0;
  } else if (tp < 0.62) {
    charge = 1 - (tp - 0.4) / 0.22;
    e = ease((tp - 0.4) / 0.22);
    fade = 0;
  } else {
    charge = 0;
    e = 1;
    fade = ease((tp - 0.62) / 0.38);
  }

  ctx.fillStyle = p.ink(0.1);
  const ring = 24;
  for (let k = 0; k < ring; k++) {
    const a = (k / ring) * Math.PI * 2 + t * 0.12;
    const rxp = cx + Math.cos(a) * R * 1.15;
    const ryp = cy + Math.sin(a) * R * 1.15 * 0.85;
    ctx.beginPath();
    ctx.arc(rxp, ryp, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ditherHalo(ctx, cx, cy, R * (0.35 + 0.45 * charge + 0.25 * e), 0.5 + 0.35 * charge, p.acc, 3);

  for (let i = 0; i < SHARDS; i++) {
    const a = frand(i) * Math.PI * 2;
    const rr = Math.sqrt(frand(i + 100)) * R * 0.5;
    const bx = cx + Math.cos(a) * rr;
    const by = cy + Math.sin(a) * rr * 0.9;
    const spd = (0.4 + frand(i + 30) * 0.7) * R;
    const gx = bx + Math.cos(a) * spd * e;
    const gy = by + Math.sin(a) * spd * e * 0.7 + 16 * e * e;
    const sz = (1.4 + frand(i + 50) * 1.8) * (1 - 0.2 * e);
    const isAcc = frand(i + 12) > 0.78;
    const base = isAcc ? 0.5 : 0.32 + frand(i + 5) * 0.18;
    const al = base * (1 - fade);
    ctx.fillStyle = isAcc ? p.acc(al) : p.ink(al);
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(a + t * 0.15 + e * 2.5);
    ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
    ctx.restore();
  }

  const flash = e * (1 - e) * 4;
  const coreR = (4 + 3 * charge + 4 * flash) * (1 - 0.4 * fade);
  ctx.fillStyle = p.acc(0.92);
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(2, coreR), 0, Math.PI * 2);
  ctx.fill();
};

/* ------------------------------- 05 planck-to-now ----------------- */

const drawPlanck: DrawFn = (ctx, w, h, t, p) => {
  const mx = 24;
  const baseY = h * 0.5;
  const x0 = mx;
  const x1 = w - mx;
  const span = Math.max(1, x1 - x0);
  const N = 40;

  ctx.strokeStyle = p.ink(0.14);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, baseY);
  ctx.lineTo(x1, baseY);
  ctx.stroke();

  const scrub = (t * 0.125) % 1;
  const sx = x0 + scrub * span;

  for (let i = 0; i <= N; i++) {
    const f = i / N;
    const x = x0 + f * span;
    const major = i % 5 === 0;
    const behind = scrub - f;
    const lit = behind >= 0 && behind < 0.12 ? 1 - behind / 0.12 : 0;
    const ht = (major ? 12 : 5) * (1 + 0.4 * lit);
    if (major) {
      ctx.strokeStyle = lit > 0 ? p.acc(0.4 + 0.4 * lit) : p.ink(0.42);
      ctx.lineWidth = 1.2;
    } else {
      ctx.strokeStyle = p.ink(0.14);
      ctx.lineWidth = 1;
    }
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, baseY - ht);
    ctx.stroke();
  }

  ditherHalo(ctx, sx - 8, baseY - 6, 16, 0.5, p.acc);

  ctx.strokeStyle = p.acc(0.9);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(sx, baseY - 22);
  ctx.lineTo(sx, baseY + 7);
  ctx.stroke();
  ctx.fillStyle = p.acc(1);
  ctx.beginPath();
  ctx.arc(sx, baseY, 3, 0, Math.PI * 2);
  ctx.fill();
};

/* ------------------------------- 06 practice-map ------------------ */

const WAY: ReadonlyArray<readonly [number, number]> = [
  [0.16, 0.66],
  [0.3, 0.5],
  [0.42, 0.6],
  [0.52, 0.44],
  [0.64, 0.52],
  [0.76, 0.4],
];

const drawMap: DrawFn = (ctx, w, h, t, p) => {
  const pts = WAY.map(([x, y]) => [x * w, y * h] as const);

  // T3: two faint contour lines
  ctx.strokeStyle = p.ink(0.1);
  ctx.lineWidth = 1;
  for (let c = 0; c < 2; c++) {
    const yy = h * (0.34 + c * 0.34);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = yy + Math.sin(x * 0.02 + c * 1.7 + t * 0.05) * (5 + c);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const segLen: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segLen.push(d);
    total += d;
  }

  const T = 9;
  const tp = (t % T) / T;
  // draw (0..0.7) -> settle pulse (0.7..0.85) -> hold/reset (0.85..1)
  const drawing = Math.min(1, tp / 0.7);
  const prog = ease(drawing);
  const settle =
    tp >= 0.7 && tp < 0.85 ? Math.sin(((tp - 0.7) / 0.15) * Math.PI) : 0;
  const target = prog * total;

  const dest = pts[pts.length - 1];

  // T2: waypoints (faint until reached)
  let dcum = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    if (i > 0) dcum += segLen[i - 1];
    const [x, y] = pts[i];
    const reached = dcum <= target + 0.5;
    ctx.strokeStyle = p.ink(reached ? 0.4 : 0.24);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.stroke();
    if (reached) {
      ctx.fillStyle = p.ink(0.42);
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // route polyline
  ctx.strokeStyle = p.acc(0.55);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  let acc = 0;
  let headX = pts[0][0];
  let headY = pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const seg = segLen[i - 1];
    if (acc + seg <= target) {
      ctx.lineTo(pts[i][0], pts[i][1]);
      acc += seg;
      headX = pts[i][0];
      headY = pts[i][1];
    } else {
      const f = seg > 0 ? (target - acc) / seg : 0;
      headX = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f;
      headY = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;
      ctx.lineTo(headX, headY);
      break;
    }
  }
  ctx.stroke();

  // focal: destination node (settles when reached) + route head
  const arrived = target >= total - 0.5;
  ditherHalo(ctx, dest[0], dest[1], 12 + 6 * settle, 0.4 + 0.4 * settle, p.acc);
  ctx.strokeStyle = p.acc(0.7);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(dest[0], dest[1], 5 + 2 * settle, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = p.acc(arrived ? 1 : 0.85);
  ctx.beginPath();
  ctx.arc(dest[0], dest[1], 2.8, 0, Math.PI * 2);
  ctx.fill();

  if (!arrived) {
    ctx.fillStyle = p.acc(1);
    ctx.beginPath();
    ctx.arc(headX, headY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
};

/* ------------------------------- config --------------------------- */

interface CardArt {
  accent: string;
  caption: string;
  staticT: number;
  draw: DrawFn;
}

const CARD_ART: Readonly<Record<string, CardArt>> = {
  "raft-cluster": {
    accent: "#6f93ad",
    caption: "leader-election · dither-halo · canvas2d",
    staticT: 0.6,
    draw: drawRaft,
  },
  "kitty-run": {
    accent: "#5fe6c0",
    caption: "wisp-run · moonlit-trail · canvas2d",
    staticT: 0.5,
    draw: drawKitty,
  },
  "evening-forest": {
    accent: "#d99e63",
    caption: "dusk-sun · canopy-drift · canvas2d",
    staticT: 4.1,
    draw: drawForest,
  },
  explosion: {
    accent: "#d18a54",
    caption: "core-detonation · shard-burst · canvas2d",
    staticT: 2.4,
    draw: drawExplosion,
  },
  "planck-to-now": {
    accent: "#d8b98e",
    caption: "log-time · scrub-wake · canvas2d",
    staticT: 4.0,
    draw: drawPlanck,
  },
  "practice-map": {
    accent: "#b58e63",
    caption: "route · settle-pulse · canvas2d",
    staticT: 3.7,
    draw: drawMap,
  },
};

const FALLBACK: CardArt = CARD_ART["practice-map"];

/* ------------------------------- canvas engine -------------------- */

interface ArtCanvasProps {
  cardId: string;
  accent: string;
  draw: DrawFn;
  staticT: number;
}

function ArtCanvas({ cardId, accent, draw, staticT }: ArtCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const accRgb = hexToRgb(accent);
    const paint: Paint = {
      ink: (a) => `rgba(${INK_RGB}, ${a})`,
      acc: (a) => `rgba(${accRgb}, ${a})`,
    };

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

    const paintFrame = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      draw(ctx, cssW, cssH, t, paint);
    };

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches;
    let visible = false;
    let running = false;
    let rafId = 0;
    let start = 0;
    let last = 0;
    const frameInterval = 1000 / 26;

    const frame = (now: number) => {
      if (!running) return;
      if (start === 0) start = now;
      rafId = requestAnimationFrame(frame);
      if (now - last < frameInterval) return;
      last = now;
      paintFrame((now - start) / 1000);
    };

    const sync = () => {
      const run = visible && !document.hidden && !reduced;
      if (run && !running) {
        running = true;
        last = 0;
        rafId = requestAnimationFrame(frame);
      } else if (!run && running) {
        running = false;
        cancelAnimationFrame(rafId);
      }
      if (!run && reduced) paintFrame(staticT);
    };

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
        if (!running && reduced) paintFrame(staticT);
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
      window.clearTimeout(resizeTimer);
    };
  }, [accent, draw, staticT]);

  return <canvas ref={ref} className={`art-${cardId}-canvas`} aria-hidden="true" />;
}

/* ------------------------------- component ------------------------ */

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
        draw={art.draw}
        staticT={art.staticT}
      />
      <span className="art-caption">{art.caption}</span>
    </div>
  );
}
