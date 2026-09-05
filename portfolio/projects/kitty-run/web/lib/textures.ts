// Canvas-generated textures, so the project ships zero image assets. Every
// texture that scrolls is drawn to tile seamlessly along x.

import * as THREE from "three";
import { createRng } from "../lib/rng.ts";
import type { CharacterId, ThemePalette } from "../lib/theme.ts";

function hexRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function makeCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Vertical gradient with a soft sun (or moon) baked into the top right,
// voiced by whichever theme's palette is passed in.
export function skyTexture(p: ThemePalette): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, p.skyTop);
  gradient.addColorStop(0.62, p.skyMid);
  gradient.addColorStop(1, p.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const sunX = 396;
  const sunY = 172;
  const halo = hexRgb(p.sunHalo);
  const haloSoft = hexRgb(p.sunHaloSoft);
  const core = hexRgb(p.sunCore);
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 150);
  glow.addColorStop(0, `rgba(${halo.r}, ${halo.g}, ${halo.b}, 0.95)`);
  glow.addColorStop(0.25, `rgba(${haloSoft.r}, ${haloSoft.g}, ${haloSoft.b}, 0.5)`);
  glow.addColorStop(1, `rgba(${haloSoft.r}, ${haloSoft.g}, ${haloSoft.b}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = `rgba(${core.r}, ${core.g}, ${core.b}, 0.98)`;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
  ctx.fill();

  return toTexture(canvas);
}

// A puffy cloud: a handful of overlapping circles with a soft edge.
// Fill AND soft edge are driven by the theme's cloud colour (a tone kept
// under the bloom threshold) so clouds stay lit and pleasant without ever
// blooming or reading as the sun. Byte values are parsed straight from the
// hex — we want the sRGB canvas value, not a colour-managed conversion.
export function cloudTexture(seed: string, p: ThemePalette): THREE.CanvasTexture {
  const rng = createRng(seed);
  const { canvas, ctx } = makeCanvas(512, 256);
  const puffs = 5 + Math.floor(rng() * 3);
  const hex = p.cloud.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.93)`;
  ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
  ctx.shadowBlur = 14;
  for (let i = 0; i < puffs; i += 1) {
    const t = puffs === 1 ? 0.5 : i / (puffs - 1);
    const x = 120 + t * 270 + (rng() - 0.5) * 40;
    const y = 150 - Math.sin(t * Math.PI) * 52 - rng() * 18;
    const r2 = 34 + Math.sin(t * Math.PI) * 40 + rng() * 12;
    ctx.beginPath();
    ctx.arc(x, y, r2, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(canvas);
}

// Tileable hill silhouette: humps are drawn three times (x, x±width) so the
// seam wraps cleanly. Transparent above the curve, solid colour below.
export function hillTexture(
  color: string,
  humps: number,
  seed: string,
): THREE.CanvasTexture {
  const rng = createRng(seed);
  const width = 1024;
  const height = 256;
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;

  // Hump shapes are drawn three times (x, x±width) with IDENTICAL params —
  // the rng is sampled once up front, so the wrap copies match seamlessly.
  const humpWidth = width / humps;
  const shapes: { controlY: number; endY: number }[] = [];
  for (let i = 0; i < humps; i += 1) {
    const rise = 40 + rng() * 50;
    shapes.push({
      controlY: height - 60 - rise * 2,
      endY: height - 55 - rng() * 20,
    });
  }

  const drawHumps = (offset: number) => {
    ctx.beginPath();
    ctx.moveTo(offset, height);
    ctx.lineTo(offset, height - 60);
    let x = offset;
    for (const shape of shapes) {
      ctx.quadraticCurveTo(
        x + humpWidth / 2,
        shape.controlY,
        x + humpWidth,
        shape.endY,
      );
      x += humpWidth;
    }
    ctx.lineTo(offset + width, height);
    ctx.closePath();
    ctx.fill();
  };

  drawHumps(0);
  drawHumps(-width);
  drawHumps(width);

  const texture = toTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

// Soft radial dot for particles and glows.
export function softDotTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128, 128);
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.55)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return toTexture(canvas);
}

// Polka-dot face for crates and balloons — hazards read as candy (or, in
// the dark theme, as iron), not as debris.
export function crateTexture(p: ThemePalette): THREE.CanvasTexture {
  const rng = createRng("kitty-run/crate/v1");
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = p.obstaclePlum;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = p.obstacleDeep;
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, 238, 238);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = 44 + col * 56 + (row % 2 === 0 ? 0 : 28);
      const y = 44 + row * 56;
      ctx.fillStyle = p.obstacleDot;
      ctx.beginPath();
      ctx.arc(x, y, 9 + rng() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return toTexture(canvas);
}

function rgba(hex: string, a: number): string {
  const c = hexRgb(hex);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

// Long streaky dusk cloud: dark slate bands whose undersides catch a warm
// sunset from below. Strokes are elongated ellipses so nothing reads puffy.
export function duskCloudTexture(seed: string, p: ThemePalette): THREE.CanvasTexture {
  const rng = createRng(seed);
  const { canvas, ctx } = makeCanvas(512, 256);
  const bands = 2 + Math.floor(rng() * 3);

  for (let b = 0; b < bands; b += 1) {
    const t = bands === 1 ? 0.5 : b / (bands - 1);
    const cy = 70 + t * 110 + (rng() - 0.5) * 30;
    const cx = 256 + (rng() - 0.5) * 60;
    const half = 130 + rng() * 90;
    const thick = 9 + rng() * 12;

    // Body: layered translucent strokes, shorter towards the band ends.
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 16;
    ctx.shadowColor = rgba(p.cloud, 0.85);
    ctx.fillStyle = rgba(p.cloud, 0.55);
    const strokes = 6 + Math.floor(rng() * 4);
    for (let s = 0; s < strokes; s += 1) {
      const u = (rng() - 0.5) * 2;
      const ex = cx + u * half * 0.55;
      const ew = half * (0.3 + rng() * 0.3) * (1 - Math.abs(u) * 0.5);
      const ey = cy + (rng() - 0.5) * thick;
      const eh = thick * (0.5 + rng() * 0.6);
      ctx.beginPath();
      ctx.ellipse(ex, ey, ew, eh, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lit underside: source-atop keeps the warmth inside the cloud body.
    ctx.globalCompositeOperation = "source-atop";
    ctx.shadowBlur = 10;
    ctx.shadowColor = rgba(p.cloudLit, 0.7);
    ctx.fillStyle = rgba(p.cloudLit, 0.5);
    const litStrokes = 3 + Math.floor(rng() * 3);
    for (let s = 0; s < litStrokes; s += 1) {
      const u = (rng() - 0.5) * 2;
      const ex = cx + u * half * 0.5;
      const ew = half * (0.25 + rng() * 0.3) * (1 - Math.abs(u) * 0.5);
      const ey = cy + thick * 0.55 + rng() * 3;
      ctx.beginPath();
      ctx.ellipse(ex, ey, ew, thick * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.shadowBlur = 0;
  return toTexture(canvas);
}

// A bank of cool valley mist: one horizontally uniform band whose density
// rises to a peak low in the frame and fades to nothing at both edges, so
// it can sit between two city layers without ever showing a hard line.
// Peak is the fraction from the top where the mist is thickest.
export function hazeTexture(colour: string, peak: number): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 256);
  const c = hexRgb(colour);
  const p = Math.min(0.95, Math.max(0.05, peak));
  const at = (a: number) => `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, at(0));
  gradient.addColorStop(p * 0.55, at(0.5));
  gradient.addColorStop(p, at(1));
  gradient.addColorStop(1, at(0));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 256);
  return toTexture(canvas);
}

type CastleRidge = { x: number; w: number; top: number };
type CastleShape =
  | { kind: "spire"; x: number; w: number; top: number; needle: number }
  | { kind: "tower"; x: number; w: number; top: number; cap: number }
  | {
      kind: "cathedral";
      x: number;
      w: number;
      top: number;
      towerTop: number;
      needle: number;
    }
  | { kind: "arcade"; x: number; w: number; top: number; arches: number }
  | { kind: "houses"; x: number; ridges: CastleRidge[] };
type CastleZone = { x: number; w: number; top: number; bottom: number };
type CastleWindow = { x: number; y: number; w: number; h: number; arched: boolean };

// Tileable gothic skyline. `density` (0 airy … 1 packed) sets how much the
// buildings overlap; `baseline` is the fraction of the canvas that stays
// solid at the bottom. All rng is consumed before drawing so the three
// wrap copies are identical.
export function castleTexture(
  color: string,
  seed: string,
  opts: { windows?: string; density?: number; baseline?: number } = {},
): THREE.CanvasTexture {
  const rng = createRng(seed);
  const width = 1024;
  const height = 256;
  const density = opts.density ?? 0.8;
  const baseline = height - Math.round(height * (opts.baseline ?? 0.2));
  const reach = baseline - 18;
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.clearRect(0, 0, width, height);

  const shapes: CastleShape[] = [];
  const zones: CastleZone[] = [];
  let x = rng() * 40;
  while (x < width) {
    const roll = rng();
    let advance: number;
    if (roll < 0.28) {
      const w = 8 + rng() * 10;
      const top = baseline - reach * (0.3 + rng() * 0.45);
      const needle = Math.min(reach * (0.18 + rng() * 0.25), top - 6);
      shapes.push({ kind: "spire", x, w, top, needle });
      zones.push({ x, w, top, bottom: baseline });
      advance = w;
    } else if (roll < 0.58) {
      const w = 16 + rng() * 26;
      const top = baseline - reach * (0.18 + Math.pow(rng(), 1.4) * 0.65);
      const cap = rng() < 0.45 ? w * (0.9 + rng() * 0.6) : 0;
      shapes.push({ kind: "tower", x, w, top, cap });
      zones.push({ x, w, top, bottom: baseline });
      advance = w;
    } else if (roll < 0.58 + 0.2 * density) {
      const w = 60 + rng() * 60;
      const top = baseline - reach * (0.25 + rng() * 0.3);
      const towerTop = Math.max(10, top - w * (0.15 + rng() * 0.2));
      const needle = Math.min(w * (0.5 + rng() * 0.5), towerTop - 8);
      shapes.push({ kind: "cathedral", x, w, top, towerTop, needle });
      const tw = w * 0.18;
      zones.push({ x, w, top, bottom: baseline });
      zones.push({ x, w: tw, top: towerTop, bottom: baseline });
      zones.push({ x: x + w - tw, w: tw, top: towerTop, bottom: baseline });
      advance = w;
    } else if (roll < 0.58 + 0.2 * density + 0.12) {
      const w = 70 + rng() * 70;
      const top = baseline - (18 + rng() * 18);
      const arches = 3 + Math.floor(rng() * 4);
      shapes.push({ kind: "arcade", x, w, top, arches });
      advance = w;
    } else {
      const ridges: CastleRidge[] = [];
      const n = 2 + Math.floor(rng() * 4);
      let hx = x;
      for (let i = 0; i < n; i += 1) {
        const rw = 12 + rng() * 14;
        ridges.push({ x: hx, w: rw, top: baseline - (10 + rng() * 22) });
        hx += rw + rng() * 4;
      }
      shapes.push({ kind: "houses", x, ridges });
      advance = hx - x;
    }
    x += advance * (0.55 + (1 - density) * 1.3 + rng() * 0.6);
  }

  const windows: CastleWindow[] = [];
  if (opts.windows && zones.length > 0) {
    const count = 12 + Math.floor(rng() * 14);
    const limit = height * 0.85;
    let tries = 0;
    while (windows.length < count && tries < count * 6) {
      tries += 1;
      const z = zones[Math.floor(rng() * zones.length)];
      const zb = Math.min(z.bottom, limit);
      const w = 2 + Math.floor(rng() * 2);
      const h = 3 + Math.floor(rng() * 3);
      if (z.w < w + 4 || zb - z.top < h + 8) continue;
      // Squared rng pulls windows towards the tower tops.
      const wx = z.x + 2 + rng() * (z.w - w - 4);
      const wy = z.top + 4 + Math.pow(rng(), 2.2) * (zb - z.top - h - 6);
      windows.push({ x: Math.round(wx), y: Math.round(wy), w, h, arched: rng() < 0.5 });
    }
  }

  const needle = (nx: number, ny: number, w: number, h: number) => {
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.quadraticCurveTo(nx + w * 0.12, ny - h * 0.45, nx + w / 2, ny - h);
    ctx.quadraticCurveTo(nx + w * 0.88, ny - h * 0.45, nx + w, ny);
    ctx.closePath();
    ctx.fill();
  };
  const cone = (cx: number, cy: number, w: number, h: number) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + w / 2, cy - h);
    ctx.lineTo(cx + w, cy);
    ctx.closePath();
    ctx.fill();
  };
  const merlons = (mx: number, top: number, w: number) => {
    const m = Math.max(3, Math.floor(w / 7));
    for (let px = mx; px <= mx + w - m; px += m * 2) {
      ctx.fillRect(px, top - m, m, m + 1);
    }
  };

  // Pass 1: solid ground mass and arcades (arch openings are cut with
  // destination-out, so they must land before any spire can overlap them).
  const drawBase = (offset: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(offset, baseline, width, height - baseline);
    for (const s of shapes) {
      if (s.kind !== "arcade") continue;
      const x0 = s.x + offset;
      ctx.fillRect(x0, s.top, s.w, baseline - s.top + 1);
      merlons(x0, s.top, s.w);
      ctx.globalCompositeOperation = "destination-out";
      const pitch = s.w / s.arches;
      const aw = pitch * 0.6;
      const yb = baseline - 4;
      const yt = s.top + 5;
      const ys = yb - (yb - yt) * 0.45;
      for (let i = 0; i < s.arches; i += 1) {
        const ax = x0 + pitch * i + (pitch - aw) / 2;
        ctx.beginPath();
        ctx.moveTo(ax, yb);
        ctx.lineTo(ax, ys);
        ctx.quadraticCurveTo(ax + aw * 0.1, yt, ax + aw / 2, yt);
        ctx.quadraticCurveTo(ax + aw * 0.9, yt, ax + aw, ys);
        ctx.lineTo(ax + aw, yb);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }
  };

  // Pass 2: the skyline proper.
  const drawShapes = (offset: number) => {
    ctx.fillStyle = color;
    for (const s of shapes) {
      switch (s.kind) {
        case "spire": {
          const x0 = s.x + offset;
          ctx.fillRect(x0, s.top, s.w, baseline - s.top + 1);
          needle(x0, s.top, s.w, s.needle);
          cone(x0 - 1.5, s.top, 3, 6);
          cone(x0 + s.w - 1.5, s.top, 3, 6);
          break;
        }
        case "tower": {
          const x0 = s.x + offset;
          ctx.fillRect(x0, s.top, s.w, baseline - s.top + 1);
          merlons(x0, s.top, s.w);
          if (s.cap > 0) cone(x0 - 1, s.top, s.w + 2, s.cap);
          break;
        }
        case "cathedral": {
          const x0 = s.x + offset;
          const bodyH = baseline - s.top;
          const ridgeY = s.top - s.w * 0.3;
          ctx.fillRect(x0, s.top, s.w, bodyH + 1);
          cone(x0, s.top, s.w, s.w * 0.3);
          ctx.fillRect(x0 + s.w / 2 - 3, ridgeY + 2, 6, 8);
          needle(x0 + s.w / 2 - 3, ridgeY + 2, 6, s.needle);
          const tw = s.w * 0.18;
          for (const tx of [x0, x0 + s.w - tw]) {
            ctx.fillRect(tx, s.towerTop, tw, baseline - s.towerTop + 1);
            merlons(tx, s.towerTop, tw);
            needle(tx + tw * 0.2, s.towerTop, tw * 0.6, tw * 1.6);
          }
          for (let i = 0; i < 2; i += 1) {
            const sign = i === 0 ? -1 : 1;
            const bx = i === 0 ? x0 : x0 + s.w;
            ctx.beginPath();
            ctx.moveTo(bx + sign * s.w * 0.12, baseline + 1);
            ctx.lineTo(bx, baseline - bodyH * 0.55);
            ctx.lineTo(bx, baseline + 1);
            ctx.closePath();
            ctx.fill();
          }
          break;
        }
        case "houses": {
          for (const r of s.ridges) {
            const rx = r.x + offset;
            ctx.fillRect(rx, r.top, r.w, baseline - r.top + 1);
            cone(rx - 1, r.top, r.w + 2, r.w * 0.45);
          }
          break;
        }
        case "arcade":
          break;
      }
    }
  };

  const drawWindows = (offset: number, win: string) => {
    ctx.fillStyle = win;
    ctx.shadowColor = win;
    ctx.shadowBlur = 4;
    for (const w of windows) {
      const wx = w.x + offset;
      if (w.arched) {
        ctx.beginPath();
        ctx.moveTo(wx, w.y + w.h);
        ctx.lineTo(wx, w.y + 1);
        ctx.lineTo(wx + w.w / 2, w.y - 1);
        ctx.lineTo(wx + w.w, w.y + 1);
        ctx.lineTo(wx + w.w, w.y + w.h);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(wx, w.y, w.w, w.h);
      }
    }
    ctx.shadowBlur = 0;
  };

  for (const offset of [0, -width, width]) drawBase(offset);
  for (const offset of [0, -width, width]) drawShapes(offset);
  if (opts.windows) {
    for (const offset of [0, -width, width]) drawWindows(offset, opts.windows);
  }

  const texture = toTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export type BackdropLayer = {
  build: (p: ThemePalette) => THREE.CanvasTexture;
  z: number;
  y: number;
  height: number;
  speed: number;
  opacity?: number;
};
// A static veil of atmosphere between two layers. Horizontally uniform, so
// it never scrolls and never shows a seam; z sorts it into the layer stack
// (transparent pass paints back to front within one render order).
export type BackdropHaze = {
  build: (p: ThemePalette) => THREE.CanvasTexture;
  z: number;
  y: number;
  height: number;
  opacity: number;
};
export type BackdropSpec = {
  layers: BackdropLayer[];
  haze?: BackdropHaze[];
  cloud: {
    build: (seed: string, p: ThemePalette) => THREE.CanvasTexture;
    scale: number;
    opacity?: number;
  } | null;
};

// Per-character backdrop lookup; scene code never branches on theme.
export const BACKDROPS: Record<CharacterId, BackdropSpec> = {
  kitty: {
    layers: [
      {
        build: (p) => hillTexture(p.hillFar, 5, "kitty-run/hills/far"),
        z: -9,
        y: 3.2,
        height: 9,
        speed: 0.22,
        opacity: 0.85,
      },
      {
        build: (p) => hillTexture(p.hillNear, 4, "kitty-run/hills/near"),
        z: -7,
        y: 2.4,
        height: 9,
        speed: 0.42,
      },
    ],
    cloud: { build: cloudTexture, scale: 1 },
  },
  souls: {
    layers: [
      {
        // Plane spans y −1.5…10.5; spire tops land around y 9–10.
        build: (p) =>
          castleTexture(p.castleFar, "kitty-run/castle/far", {
            density: 0.95,
            baseline: 0.22,
          }),
        z: -11,
        y: 4.5,
        height: 12,
        speed: 0.12,
        opacity: 0.9,
      },
      {
        // Plane spans y −2…7; tops around y 6–6.5.
        build: (p) =>
          castleTexture(p.castleMid, "kitty-run/castle/mid", {
            density: 0.7,
            baseline: 0.28,
          }),
        z: -9,
        y: 2.5,
        height: 9,
        speed: 0.22,
      },
      {
        // Plane spans y −2…5; sparse thin towers, solid mass only below ~y 0.1.
        build: (p) =>
          castleTexture(p.castleNear, "kitty-run/castle/near", {
            windows: p.windowEmber,
            density: 0.35,
            baseline: 0.3,
          }),
        z: -7,
        y: 1.5,
        height: 7,
        speed: 0.42,
      },
    ],
    haze: [
      {
        // Sinks the far city's base into mist (far z -11, mid z -9): densest
        // at the mass line ~y 0, thinning upward across the spire zone.
        build: (p) => hazeTexture(p.skyMid, 0.62),
        z: -10,
        y: 0.6,
        height: 5,
        opacity: 0.42,
      },
      {
        // Second bank the near towers rise out of (mid z -9, near z -7).
        build: (p) => hazeTexture(p.skyMid, 0.68),
        z: -8,
        y: 0.9,
        height: 4.4,
        opacity: 0.36,
      },
    ],
    cloud: { build: duskCloudTexture, scale: 1.5, opacity: 0.9 },
  },
};
