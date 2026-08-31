import { useEffect, useRef } from "react";
import type { ProjectModule } from "../../../contracts/project-module";

/* ------------------------------------------------------------------ *
 * Shared render language: sparse, opaque, discrete marks on a deep-ink
 * field. One identity hue per card. Hand-rolled Canvas2D, no WebGL,
 * no blur. Each card runs its own cheap, self-driven system.
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

/* ------------------------------- 01 raft-cluster ------------------- */

const RAFT_NODES: ReadonlyArray<readonly [number, number]> = [
  [0.2, 0.32],
  [0.5, 0.2],
  [0.8, 0.33],
  [0.68, 0.75],
  [0.3, 0.74],
];

const drawRaft: DrawFn = (ctx, w, h, t, p) => {
  const n = RAFT_NODES.length;
  const pts = RAFT_NODES.map(([nx, ny]) => [nx * w, ny * h] as const);
  const term = 6.4;
  const leader = (Math.floor(t / term) % n + n) % n;
  const tp = (t % term) / term;
  const electing = tp < 0.14;
  const settle = electing ? tp / 0.14 : 1;

  ctx.lineWidth = 1;
  ctx.strokeStyle = p.ink(0.12);
  for (let i = 0; i < n; i++) {
    if (i === leader) continue;
    ctx.beginPath();
    ctx.moveTo(pts[leader][0], pts[leader][1]);
    ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }

  if (!electing) {
    for (let i = 0; i < n; i++) {
      if (i === leader) continue;
      const f = (t / 1.5 + frand(i + 1)) % 1;
      const x = pts[leader][0] + (pts[i][0] - pts[leader][0]) * f;
      const y = pts[leader][1] + (pts[i][1] - pts[leader][1]) * f;
      ctx.fillStyle = p.acc(0.85 * (1 - f) + 0.15);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < n; i++) {
    if (i === leader) continue;
    const [x, y] = pts[i];
    const blink = electing
      ? 0.4 + 0.4 * (Math.sin(t * 22 + i) * 0.5 + 0.5)
      : 0.55;
    ctx.strokeStyle = p.ink(0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = p.ink(blink);
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const [lx, ly] = pts[leader];
  const crown = 6;
  ctx.fillStyle = p.acc(0.5 * settle);
  for (let k = 0; k < crown; k++) {
    const a = (k / crown) * Math.PI * 2 + t * 0.3;
    ctx.beginPath();
    ctx.arc(lx + Math.cos(a) * 11, ly + Math.sin(a) * 11, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = p.acc(0.9);
  ctx.beginPath();
  ctx.arc(lx, ly, 4.5 * (0.7 + 0.3 * settle), 0, Math.PI * 2);
  ctx.fill();
};

/* ------------------------------- 02 kitty-run --------------------- */

const drawKitty: DrawFn = (ctx, w, h, t, p) => {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const rx = Math.min(w * 0.3, 140);
  const ry = Math.min(h * 0.28, 60);
  const path = (s: number) =>
    [
      cx + Math.cos(s * Math.PI * 2) * rx,
      cy + Math.sin(s * Math.PI * 2) * ry,
    ] as const;

  ctx.fillStyle = p.ink(0.12);
  const track = 60;
  for (let k = 0; k < track; k++) {
    const [x, y] = path(k / track);
    ctx.beginPath();
    ctx.arc(x, y, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  const bt = Math.max(0, Math.sin(t * 0.55) - 0.6) / 0.4;
  const sRun = (t * 0.16) % 1;

  const sGhost = (t * 0.16 + 0.5) % 1;
  const gTrail = 10;
  for (let k = 0; k < gTrail; k++) {
    const [x, y] = path(sGhost - k * 0.012);
    ctx.fillStyle = p.ink(0.22 * (1 - k / gTrail));
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, 2 - k * 0.12), 0, Math.PI * 2);
    ctx.fill();
  }

  const trail = 16 + Math.round(bt * 10);
  for (let k = trail - 1; k >= 0; k--) {
    const [x, y] = path(sRun - k * 0.01);
    const a = 1 - k / trail;
    ctx.fillStyle = p.acc(a * 0.9);
    ctx.beginPath();
    ctx.arc(x, y, 2.4 * a + 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  const [hx, hy] = path(sRun);
  ctx.fillStyle = p.acc(1);
  ctx.beginPath();
  ctx.arc(hx, hy, 3.2, 0, Math.PI * 2);
  ctx.fill();

  if (bt > 0.15) {
    ctx.strokeStyle = p.acc(0.4 * bt);
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const [x, y] = path(sRun + 0.03 + k * 0.02);
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
  }
};

/* ------------------------------- 03 evening-forest ---------------- */

const FOREST_BANDS = [
  { y: 0.36, amp: 5, freq: 0.9, sp: 0.25, dusk: true },
  { y: 0.5, amp: 4, freq: 1.2, sp: -0.18, dusk: false },
  { y: 0.63, amp: 3.4, freq: 1.6, sp: 0.15, dusk: false },
  { y: 0.76, amp: 2.6, freq: 2.0, sp: -0.12, dusk: false },
] as const;

const drawForest: DrawFn = (ctx, w, h, t, p) => {
  const step = 13;
  for (let bi = 0; bi < FOREST_BANDS.length; bi++) {
    const b = FOREST_BANDS[bi];
    const baseY = b.y * h;
    for (let x = step * 0.5; x < w; x += step) {
      const k = (x / w) * Math.PI * 2 * b.freq;
      const yy =
        baseY +
        Math.sin(k + t * b.sp) * b.amp * (0.7 + 0.3 * Math.sin(t * 0.4 + bi));
      if (b.dusk) {
        ctx.fillStyle = p.acc(0.7);
        ctx.beginPath();
        ctx.arc(x, yy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.ink(0.32 - bi * 0.05);
        ctx.beginPath();
        ctx.arc(x, yy, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const bb = FOREST_BANDS[FOREST_BANDS.length - 1];
  const wx = ((t * 0.045) % 1) * w;
  const wy =
    bb.y * h + Math.sin((wx / w) * Math.PI * 2 * bb.freq + t * bb.sp) * bb.amp - 5;
  ctx.fillStyle = p.acc(0.95);
  ctx.beginPath();
  ctx.arc(wx, wy, 2.6, 0, Math.PI * 2);
  ctx.fill();
};

/* ------------------------------- 04 explosion --------------------- */

const SHARDS = 80;

const drawExplosion: DrawFn = (ctx, w, h, t, p) => {
  const cx = w * 0.5;
  const cy = h * 0.46;
  const R = Math.min(w, h) * 0.26;
  const T = 7.5;
  const tp = (t % T) / T;

  let e: number;
  if (tp < 0.3) e = 0;
  else if (tp < 0.62) e = ease((tp - 0.3) / 0.32);
  else if (tp < 0.8) e = 1;
  else e = 1 - ease((tp - 0.8) / 0.2);

  if (e < 0.5) {
    ctx.strokeStyle = p.ink(0.16 * (1 - e * 2));
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.04, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < SHARDS; i++) {
    const a = frand(i) * Math.PI * 2;
    const rr = Math.sqrt(frand(i + 100)) * R;
    const bx = cx + Math.cos(a) * rr;
    const by = cy + Math.sin(a) * rr * 0.92;
    const va = a + (frand(i + 7) - 0.5) * 0.6;
    const spd = (0.6 + frand(i + 30) * 1.4) * R;
    const gx = bx + Math.cos(va) * spd * e;
    const gy = by + Math.sin(va) * spd * e + 46 * e * e;
    const sz = (1.6 + frand(i + 50) * 2.2) * (1 - 0.25 * e);
    const accent = frand(i + 12) > 0.72;
    const alpha = accent ? 0.9 : 0.4 + frand(i + 5) * 0.2;
    ctx.fillStyle = accent ? p.acc(alpha) : p.ink(alpha * (1 - 0.35 * e));
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(a + t * 0.2 + e * 3);
    ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
    ctx.restore();
  }
};

/* ------------------------------- 05 planck-to-now ----------------- */

const drawPlanck: DrawFn = (ctx, w, h, t, p) => {
  const mx = 22;
  const baseY = h * 0.6;
  const x0 = mx;
  const x1 = w - mx;
  const span = Math.max(1, x1 - x0);
  const N = 44;

  ctx.strokeStyle = p.ink(0.16);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, baseY);
  ctx.lineTo(x1, baseY);
  ctx.stroke();

  const scrub = (t * 0.08) % 1;
  const sx = x0 + scrub * span;

  for (let i = 0; i <= N; i++) {
    const f = i / N;
    const x = x0 + f * span;
    const major = i % 5 === 0;
    const grow = 0.35 + 0.65 * f;
    const behind = scrub - f;
    const lit = behind >= 0 && behind < 0.16 ? 1 - behind / 0.16 : 0;
    const ht = (major ? 16 : 8) * grow * (1 + 0.25 * lit);
    ctx.strokeStyle = lit > 0 ? p.acc(0.4 + 0.5 * lit) : p.ink(major ? 0.42 : 0.24);
    ctx.lineWidth = major ? 1.2 : 1;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, baseY - ht);
    ctx.stroke();
  }

  ctx.fillStyle = p.ink(0.5);
  ctx.beginPath();
  ctx.arc(x0, baseY, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = p.acc(0.85);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx, baseY - 26);
  ctx.lineTo(sx, baseY + 8);
  ctx.stroke();
  ctx.fillStyle = p.acc(1);
  ctx.beginPath();
  ctx.arc(sx, baseY, 3, 0, Math.PI * 2);
  ctx.fill();
};

/* ------------------------------- 06 practice-map ------------------ */

const WAY: ReadonlyArray<readonly [number, number]> = [
  [0.12, 0.7],
  [0.28, 0.44],
  [0.44, 0.58],
  [0.58, 0.3],
  [0.74, 0.5],
  [0.88, 0.32],
];

const drawMap: DrawFn = (ctx, w, h, t, p) => {
  const pts = WAY.map(([x, y]) => [x * w, y * h] as const);

  ctx.strokeStyle = p.ink(0.1);
  ctx.lineWidth = 1;
  for (let c = 0; c < 2; c++) {
    const yy = h * (0.4 + c * 0.26);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = yy + Math.sin(x * 0.02 + c * 1.7 + t * 0.05) * 6;
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
  const prog = ease(Math.min(1, tp / 0.7));
  const target = prog * total;

  ctx.strokeStyle = p.acc(0.85);
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

  let dcum = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) dcum += segLen[i - 1];
    const [x, y] = pts[i];
    if (dcum <= target + 0.5) {
      ctx.fillStyle = p.acc(0.9);
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = p.ink(0.34);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.fillStyle = p.acc(1);
  ctx.beginPath();
  ctx.arc(headX, headY, 3, 0, Math.PI * 2);
  ctx.fill();
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
    accent: "#4ea3ff",
    caption: "leader-election · halftone · canvas2d",
    staticT: 2.0,
    draw: drawRaft,
  },
  "kitty-run": {
    accent: "#e08aa0",
    caption: "ghost-run · halftone-trail · canvas2d",
    staticT: 3.0,
    draw: drawKitty,
  },
  "evening-forest": {
    accent: "#ffb45e",
    caption: "dusk-canopy · contour-drift · canvas2d",
    staticT: 1.0,
    draw: drawForest,
  },
  explosion: {
    accent: "#ff8a3c",
    caption: "detonation-seam · shards · canvas2d",
    staticT: 3.45,
    draw: drawExplosion,
  },
  "planck-to-now": {
    accent: "#ffd39a",
    caption: "log-time · quantized-ticks · canvas2d",
    staticT: 6.0,
    draw: drawPlanck,
  },
  "practice-map": {
    accent: "#cf9d63",
    caption: "route · hairline-terrain · canvas2d",
    staticT: 3.8,
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
