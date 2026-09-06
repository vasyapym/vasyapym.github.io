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

// Vertical gradient with a soft sun (or moon) baked into the top right, voiced
// by whichever theme's palette is passed in. `opts` (all optional, all default
// to today's exact behaviour so the pastel call stays pixel-identical) let a
// theme dim the disc into a dying, ash-veiled sun: `sunScale` shrinks the core
// (base radius 34) and the glow's inner radius, `sunGlow` scales the halo's
// outer radius and its alpha (flatter = greyer), `sunDrop` nudges the disc down
// toward the horizon.
export function skyTexture(
  p: ThemePalette,
  opts: { sunScale?: number; sunGlow?: number; sunDrop?: number } = {},
): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, p.skyTop);
  gradient.addColorStop(0.62, p.skyMid);
  gradient.addColorStop(1, p.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const sunScale = opts.sunScale ?? 1;
  const glowScale = opts.sunGlow ?? 1;
  const sunX = 396;
  const sunY = 172 + (opts.sunDrop ?? 0);
  const halo = hexRgb(p.sunHalo);
  const haloSoft = hexRgb(p.sunHaloSoft);
  const core = hexRgb(p.sunCore);
  const glow = ctx.createRadialGradient(
    sunX, sunY, 8 * sunScale,
    sunX, sunY, 150 * glowScale,
  );
  glow.addColorStop(0, `rgba(${halo.r}, ${halo.g}, ${halo.b}, ${0.95 * glowScale})`);
  glow.addColorStop(0.25, `rgba(${haloSoft.r}, ${haloSoft.g}, ${haloSoft.b}, ${0.5 * glowScale})`);
  glow.addColorStop(1, `rgba(${haloSoft.r}, ${haloSoft.g}, ${haloSoft.b}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = `rgba(${core.r}, ${core.g}, ${core.b}, 0.98)`;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34 * sunScale, 0, Math.PI * 2);
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

// A denser contact shadow: the soft dot's alpha-1 core is a few pixels —
// squashed into a ground ellipse it reads as nothing. This one holds a
// near-solid core out to half the radius so the shadow has actual weight,
// then falls away quickly. Souls only; the pastel read stays untouched.
export function contactShadowTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128, 128);
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.85)");
  gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.3)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return toTexture(canvas);
}

// Polka-dot face for crates and balloons — hazards read as candy (or, in
// the dark theme, as iron), not as debris. `opts.lid` (when present) bakes a
// warm translucent band across the top of the face, as if the low sun is
// catching the lid edge — living light on a dead object.
export function crateTexture(
  p: ThemePalette,
  opts?: { lid?: string; worn?: boolean },
): THREE.CanvasTexture {
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

  // Worn iron (souls only). ALL new rng draws live HERE — strictly after the
  // dot loop, and ONLY when opts.worn is set — so the pastel call reproduces
  // today's exact stream (16 dot radii) and byte-identical pixels.
  if (opts?.worn) {
    const faceLo = 30;
    const faceHi = 226;
    // Rust pools: 3 hard flat blotches, one value from the face toward ink
    // (obstacleDeep), rgba so they darken the plum without a gradient.
    for (let i = 0; i < 3; i += 1) {
      const cx = faceLo + rng() * (faceHi - faceLo);
      const cy = faceLo + rng() * (faceHi - faceLo);
      const r = 20 + rng() * 26;
      ctx.fillStyle = rgba(p.obstacleDeep, 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Scuff streaks: 2 bright thin scratches (obstacleDot) — worn metal
    // catching light. Flat strokes, low alpha.
    ctx.strokeStyle = rgba(p.obstacleDot, 0.34);
    ctx.lineWidth = 3;
    for (let i = 0; i < 2; i += 1) {
      const x0 = faceLo + rng() * (faceHi - faceLo);
      const y0 = faceLo + rng() * (faceHi - faceLo);
      const len = 40 + rng() * 60;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + len, y0 - len * 0.4);
      ctx.stroke();
    }
  }

  // Lid light. Worn iron: a THIN BRIGHT EDGE LINE at the very top of the face
  // (rim-lit metal edge) + a faint FLAT wash below. Pastel: the original soft
  // warm gradient band, untouched. Consumes no rng in either path.
  if (opts?.lid) {
    const faceLeft = 18;
    const faceWidth = 238 - faceLeft;
    if (opts.worn) {
      ctx.fillStyle = rgba(opts.lid, 0.9);
      ctx.fillRect(faceLeft, faceLeft, faceWidth, 6);
      ctx.fillStyle = rgba(opts.lid, 0.1);
      ctx.fillRect(faceLeft, faceLeft + 6, faceWidth, 26);
    } else {
      const fadeEnd = Math.round(256 * 0.26);
      const grad = ctx.createLinearGradient(0, faceLeft, 0, fadeEnd);
      grad.addColorStop(0, rgba(opts.lid, 0.32));
      grad.addColorStop(1, rgba(opts.lid, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(faceLeft, faceLeft, faceWidth, fadeEnd - faceLeft);
    }
  }
  return toTexture(canvas);
}

function rgba(hex: string, a: number): string {
  const c = hexRgb(hex);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

// Tileable weathered-stone joints for the souls ground: a flat fill plus
// darker mortar lines (horizontal courses + running-bond vertical joints).
// OPAQUE on purpose — a transparent map on the band would reveal the body
// plane behind it, not the band colour — so the souls ground material carries
// white and lets the baked palette show; the pastel ground passes no map and
// stays byte-identical. No rng: the joints sit on a clean 128px period so the
// tile wraps seamlessly under repeat + scroll.
export function stoneJointTexture(
  fill: string,
  joint: string,
  courses: number,
): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = joint;
  const courseH = 256 / courses;
  // Horizontal mortar courses (including the top/bottom lip lines).
  for (let r = 0; r <= courses; r += 1) {
    const y = Math.min(Math.round(r * courseH), 253);
    ctx.fillRect(0, y, 256, 3);
  }
  // Vertical joints, running bond (alternate rows shift 64px). x = 0 and 128
  // give a joint exactly at the 256 wrap, so the tile is seamless.
  for (let r = 0; r < courses; r += 1) {
    const y = Math.round(r * courseH);
    const off = (r % 2) * 64;
    for (const jx of [off, off + 128]) {
      ctx.fillRect(jx, y, 3, Math.ceil(courseH));
    }
  }
  const tex = toTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
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

type Prim =
  | { t: "box"; x: number; y: number; w: number; h: number }
  | { t: "roof"; x: number; y: number; w: number; h: number }
  | { t: "pinnacle"; x: number; y: number; w: number; h: number }
  | { t: "merlon"; x: number; y: number; w: number }
  | { t: "buttress"; x: number; w: number; h: number };
type Slit = { x: number; y: number; w: number; h: number; arched: boolean };
type CastleWindow = { x: number; y: number; w: number; h: number; arched: boolean };
type CastleLayer = "far" | "mid" | "near";

// Tileable gothic skyline. Composition is anchored per `layer` (2–4 deliberate
// groups, not scatter): far = one cathedral-mass + curtain wall + secondary
// keeps; mid = heavy bastion runs; near = a low broken rampart, one lit keep
// (the ember cluster) and one colossal broken column. All rng is consumed in
// the build phase before any drawing, so the three wrap copies are identical.
// `rim` (when present) bakes a hard warm sliver on sun-facing edges and
// consumes no rng; souls never passes it. `density` is accepted for call-site
// compatibility but no longer drives the anchored layout.
export function castleTexture(
  color: string,
  seed: string,
  opts: {
    windows?: string;
    density?: number;
    baseline?: number;
    rim?: string;
    layer?: CastleLayer;
  } = {},
): THREE.CanvasTexture {
  const rng = createRng(seed);
  const width = 1024;
  const height = 256;
  const layer: CastleLayer = opts.layer ?? "mid";
  const baseline = height - Math.round(height * (opts.baseline ?? 0.2));
  const reach = baseline - 18;
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.clearRect(0, 0, width, height);

  const clampTop = (y: number) => Math.max(8, y);

  // ---- Build phase: consumes ALL rng, emits drawable primitives only. ------
  const prims: Prim[] = [];
  const slits: Slit[] = [];
  const windows: CastleWindow[] = [];

  const addWall = (wx: number, ww: number, topRaw: number, buttress = true) => {
    const topY = clampTop(topRaw);
    prims.push({ t: "box", x: wx, y: topY, w: ww, h: baseline - topY });
    prims.push({ t: "merlon", x: wx, y: topY, w: ww });
    if (buttress) {
      const step = 46 + rng() * 22;
      for (let px = wx + 12; px < wx + ww - 12; px += step) {
        prims.push({
          t: "buttress",
          x: px,
          w: 8 + rng() * 4,
          h: (baseline - topY) * (0.45 + rng() * 0.2),
        });
      }
    }
  };

  // A large tiered keep: full body -> narrower crenellated upper tier ->
  // steep pitched roof, 2 pinnacles at the tier corners, arched slits in the
  // body. Returns its body region so the caller can seat an ember cluster.
  const addKeep = (bx: number, bw: number, bodyTopRaw: number) => {
    const bodyTopY = clampTop(bodyTopRaw);
    const bottom = baseline;
    prims.push({ t: "box", x: bx, y: bodyTopY, w: bw, h: bottom - bodyTopY });

    const uw = Math.round(bw * (0.54 + rng() * 0.12));
    const ux = Math.round(bx + (bw - uw) / 2);
    const upperTopY = clampTop(
      bodyTopY - Math.round((bottom - bodyTopY) * (0.3 + rng() * 0.16)),
    );
    prims.push({ t: "box", x: ux, y: upperTopY, w: uw, h: bodyTopY - upperTopY });

    const ledgeL = ux - bx;
    const ledgeR = bx + bw - (ux + uw);
    if (ledgeL > 5) prims.push({ t: "merlon", x: bx, y: bodyTopY, w: ledgeL });
    if (ledgeR > 5) prims.push({ t: "merlon", x: ux + uw, y: bodyTopY, w: ledgeR });

    let roofH = Math.round(uw * (0.95 + rng() * 0.25));
    if (upperTopY - roofH < 8) roofH = Math.max(6, upperTopY - 8);
    prims.push({ t: "roof", x: ux, y: upperTopY, w: uw, h: roofH });

    let ph = 10 + rng() * 8;
    if (upperTopY - ph < 8) ph = Math.max(6, upperTopY - 8);
    prims.push({ t: "pinnacle", x: ux - 4, y: upperTopY + 3, w: 4, h: ph });
    prims.push({ t: "pinnacle", x: ux + uw, y: upperTopY + 3, w: 4, h: ph });

    const rows = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < rows; i += 1) {
      const sw = 3 + Math.floor(rng() * 3);
      const sh = 6 + Math.floor(rng() * 4);
      const sx = Math.round(bx + bw * (0.28 + rng() * 0.44) - sw / 2);
      const sy = Math.round(bodyTopY + 12 + i * (sh + 7));
      if (sy + sh < bottom - 6)
        slits.push({ x: sx, y: sy, w: sw, h: sh, arched: true });
    }
    return { bx, bw, bodyTopY, bottom };
  };

  const addArcade = (ax: number, aw: number, topRaw: number, arches: number) => {
    const topY = clampTop(topRaw);
    prims.push({ t: "box", x: ax, y: topY, w: aw, h: baseline - topY });
    prims.push({ t: "merlon", x: ax, y: topY, w: aw });
    const pitch = aw / arches;
    const arcW = pitch * 0.58;
    const yb = baseline - 4;
    const yt = topY + 6;
    for (let i = 0; i < arches; i += 1) {
      const cx = ax + pitch * i + (pitch - arcW) / 2;
      slits.push({
        x: Math.round(cx),
        y: Math.round(yt),
        w: Math.round(arcW),
        h: Math.round(yb - yt),
        arched: true,
      });
    }
  };

  const addColumn = (cx: number, cw: number, topRaw: number) => {
    const topY = clampTop(topRaw);
    prims.push({ t: "box", x: cx, y: topY, w: cw, h: baseline - topY });
    // stepped, damaged flat crown (v2's column was fine — keep it)
    prims.push({ t: "box", x: cx - 3, y: topY, w: cw + 6, h: 8 });
    prims.push({
      t: "box",
      x: Math.round(cx + cw * 0.18),
      y: topY - 10,
      w: Math.round(cw * 0.5),
      h: 12,
    });
    prims.push({
      t: "box",
      x: Math.round(cx + cw * 0.12),
      y: topY - 4,
      w: Math.round(cw * 0.34),
      h: 8,
    });
    slits.push({
      x: Math.round(cx + cw / 2 - 2),
      y: Math.round(topY + 22),
      w: 4,
      h: 11,
      arched: true,
    });
  };

  if (layer === "far") {
    // One great cathedral-mass anchored left.
    const cx = 40 + rng() * 50;
    const cw = 160 + rng() * 80;
    const naveTop = clampTop(baseline - reach * (0.46 + rng() * 0.08));
    prims.push({ t: "box", x: cx, y: naveTop, w: cw, h: baseline - naveTop });
    prims.push({ t: "roof", x: cx, y: naveTop, w: cw, h: Math.round(cw * 0.15) });
    for (let i = 0; i < 3; i += 1) {
      slits.push({
        x: Math.round(cx + cw * (0.15 + 0.3 * i)),
        y: Math.round(naveTop + 14),
        w: 4,
        h: 10,
        arched: true,
      });
    }
    // Dominant tower rising from the nave, tiers + tall roof, top in upper reach.
    const twW = Math.max(72, Math.round(cw * 0.34));
    const twX = Math.round(cx + cw * 0.48);
    addKeep(twX, twW, baseline - reach * (0.6 + rng() * 0.06));
    // Connecting curtain wall.
    const wX = cx + cw + 8;
    const wW = 150 + rng() * 60;
    addWall(wX, wW, baseline - reach * (0.32 + rng() * 0.08));
    // 1–2 secondary tiered keeps.
    addKeep(wX + wW + 12, 82 + rng() * 24, baseline - reach * (0.52 + rng() * 0.1));
    addKeep(
      wX + wW + 120 + rng() * 40,
      76 + rng() * 22,
      baseline - reach * (0.46 + rng() * 0.1),
    );
  } else if (layer === "mid") {
    // 2–3 heavy bastion groups, generous sky gaps, slightly lower than far.
    const anchors = [0.06, 0.4, 0.72];
    for (let g = 0; g < anchors.length; g += 1) {
      const gx = Math.round(width * anchors[g] + rng() * 40);
      const runW = 120 + rng() * 80;
      addWall(gx, runW, baseline - reach * (0.26 + rng() * 0.08));
      addKeep(gx + 10 + rng() * 20, 82 + rng() * 40, baseline - reach * (0.66 + rng() * 0.16));
      if (rng() < 0.6)
        addKeep(gx + runW * 0.55, 74 + rng() * 28, baseline - reach * (0.56 + rng() * 0.12));
    }
    // One gothic arcade run for variety (pointed arches).
    addArcade(width * 0.55 + rng() * 20, 120 + rng() * 50, baseline - reach * 0.22, 4 + Math.floor(rng() * 3));
  } else {
    // NEAR: low broken crenellated rampart across the whole tile (dark & quiet
    // behind the lane), one lit keep (ember), one colossal broken column.
    const rampTop = baseline - reach * (0.28 + rng() * 0.06);
    const gapStart = Math.round(width * (0.55 + rng() * 0.1));
    const gapW = 40 + rng() * 30;
    addWall(0, gapStart, rampTop);
    addWall(gapStart + gapW, width - (gapStart + gapW), rampTop);

    const keepX = Math.round(width * (0.12 + rng() * 0.06));
    const keepW = 90 + rng() * 30;
    const keep = addKeep(keepX, keepW, baseline - reach * (0.7 + rng() * 0.1));

    const colX = Math.round(width * (0.7 + rng() * 0.05));
    const colW = 34 + rng() * 12;
    addColumn(colX, colW, baseline - reach * (0.9 + rng() * 0.06));

    // ONE ember window cluster on the lit keep (4–7, arched, spread ≤ 60).
    if (opts.windows) {
      const n = 4 + Math.floor(rng() * 4);
      const spread = Math.min(60, keep.bw - 14);
      const cx0 = keep.bx + (keep.bw - spread) / 2;
      const rowY = keep.bodyTopY + 16;
      for (let i = 0; i < n; i += 1) {
        const ww = 3 + Math.floor(rng() * 3);
        const wh = 5 + Math.floor(rng() * 5);
        const wx = cx0 + (spread / n) * i + rng() * 3;
        const wy = rowY + (i % 2) * (wh + 4) + rng() * 4;
        if (wy + wh < baseline - 8)
          windows.push({
            x: Math.round(wx),
            y: Math.round(wy),
            w: ww,
            h: wh,
            arched: true,
          });
      }
    }
  }

  // ---- Draw phase: no rng, pure functions of the built primitives. ---------
  const drawSolids = (
    c: CanvasRenderingContext2D,
    offset: number,
    fill: string,
  ) => {
    c.fillStyle = fill;
    c.fillRect(offset, baseline, width, height - baseline);
    for (const p of prims) {
      switch (p.t) {
        case "box":
          c.fillRect(p.x + offset, p.y, p.w, p.h + 1);
          break;
        case "roof": {
          const rx = p.x + offset;
          c.beginPath();
          c.moveTo(rx, p.y);
          c.lineTo(rx + p.w / 2, p.y - p.h);
          c.lineTo(rx + p.w, p.y);
          c.closePath();
          c.fill();
          break;
        }
        case "pinnacle": {
          const px = p.x + offset;
          const stub = p.h * 0.4;
          c.fillRect(px, p.y - stub, p.w, stub + 1);
          c.beginPath();
          c.moveTo(px, p.y - stub);
          c.lineTo(px + p.w / 2, p.y - p.h);
          c.lineTo(px + p.w, p.y - stub);
          c.closePath();
          c.fill();
          break;
        }
        case "merlon": {
          if (p.w < 4) break;
          const mx = p.x + offset;
          const m = Math.max(3, Math.floor(p.w / 7));
          for (let qx = mx; qx <= mx + p.w - m; qx += m * 2) {
            c.fillRect(qx, p.y - m, m, m + 1);
          }
          break;
        }
        case "buttress": {
          const bx = p.x + offset;
          c.beginPath();
          c.moveTo(bx, baseline + 1);
          c.lineTo(bx + p.w, baseline - p.h);
          c.lineTo(bx + p.w, baseline + 1);
          c.closePath();
          c.fill();
          break;
        }
      }
    }
  };

  // Arched/rectangular dark slits, cut AFTER all solids so overlaps can't
  // refill them. destination-out ignores fill colour (alpha carves).
  const drawSlits = (c: CanvasRenderingContext2D, offset: number) => {
    c.globalCompositeOperation = "destination-out";
    for (const s of slits) {
      const sx = s.x + offset;
      if (s.arched) {
        const yb = s.y + s.h;
        const yt = s.y;
        const ys = yb - (yb - yt) * 0.4;
        c.beginPath();
        c.moveTo(sx, yb);
        c.lineTo(sx, ys);
        c.quadraticCurveTo(sx + s.w * 0.1, yt, sx + s.w / 2, yt);
        c.quadraticCurveTo(sx + s.w * 0.9, yt, sx + s.w, ys);
        c.lineTo(sx + s.w, yb);
        c.closePath();
        c.fill();
      } else {
        c.fillRect(sx, s.y, s.w, s.h);
      }
    }
    c.globalCompositeOperation = "source-over";
  };

  const drawWindows = (
    c: CanvasRenderingContext2D,
    offset: number,
    win: string,
  ) => {
    c.fillStyle = win;
    c.shadowColor = win;
    c.shadowBlur = 4;
    for (const w of windows) {
      const wx = w.x + offset;
      if (w.arched) {
        c.beginPath();
        c.moveTo(wx, w.y + w.h);
        c.lineTo(wx, w.y + 1);
        c.lineTo(wx + w.w / 2, w.y - 1);
        c.lineTo(wx + w.w, w.y + 1);
        c.lineTo(wx + w.w, w.y + w.h);
        c.closePath();
        c.fill();
      } else {
        c.fillRect(wx, w.y, w.w, w.h);
      }
    }
    c.shadowBlur = 0;
  };

  // Skyline in the base colour, then the dark slits cut through it.
  for (const offset of [0, -width, width]) drawSolids(ctx, offset, color);
  for (const offset of [0, -width, width]) drawSlits(ctx, offset);

  // Rim pass (opt-in; souls never passes it, kept working). Rebuild the whole
  // silhouette in the warm key on a scratch canvas, carve its interior by
  // stamping itself shifted (-3,+2) to leave a right/top sliver, then stamp
  // onto the skyline with source-atop so it only lands on opaque masonry.
  if (opts.rim) {
    const rim = makeCanvas(width, height);
    for (const offset of [0, -width, width]) drawSolids(rim.ctx, offset, opts.rim);
    for (const offset of [0, -width, width]) drawSlits(rim.ctx, offset);
    rim.ctx.globalCompositeOperation = "destination-out";
    rim.ctx.drawImage(rim.canvas, -3, 2);
    rim.ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.7;
    ctx.globalCompositeOperation = "source-atop";
    ctx.drawImage(rim.canvas, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // Windows last, so their ember glow stays on top of everything.
  if (opts.windows) {
    for (const offset of [0, -width, width]) drawWindows(ctx, offset, opts.windows);
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
    // Per-theme sprite count (default 8 = today). The shared seeded array is
    // sliced, never reseeded, so pastel stays byte-identical.
    count?: number;
  } | null;
  // Optional per-theme sun knobs threaded into skyTexture. Absent = today.
  sky?: { sunScale?: number; sunGlow?: number; sunDrop?: number };
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
        // Plane spans y −1.5…10.5. ONE cathedral-mass + curtain wall + keeps.
        // NO rim: the far city is a value in mist, not a sun-lit edge.
        build: (p) =>
          castleTexture(p.castleFar, "kitty-run/castle/far", {
            layer: "far",
            baseline: 0.18,
          }),
        z: -11,
        y: 4.5,
        height: 12,
        speed: 0.12,
        opacity: 0.9,
      },
      {
        // Plane spans y −2…7. Heavy bastion runs, generous sky gaps.
        build: (p) =>
          castleTexture(p.castleMid, "kitty-run/castle/mid", {
            layer: "mid",
            baseline: 0.24,
          }),
        z: -9,
        y: 2.5,
        height: 9,
        speed: 0.22,
      },
      {
        // Plane spans y −2…5. Low broken rampart (dark & quiet behind the
        // lane) + one lit keep (the SINGLE ember cluster) + one broken column.
        build: (p) =>
          castleTexture(p.castleNear, "kitty-run/castle/near", {
            layer: "near",
            windows: p.windowEmber,
            baseline: 0.3,
          }),
        z: -7,
        y: 1.5,
        height: 7,
        speed: 0.42,
      },
    ],
    haze: [
      // Two thin cold banks (far/mid and mid/near); the front veil is dropped.
      {
        build: (p) => hazeTexture(p.skyMid, 0.7),
        z: -10,
        y: 0.6,
        height: 5,
        opacity: 0.4,
      },
      {
        build: (p) => hazeTexture(p.skyMid, 0.7),
        z: -8,
        y: 0.9,
        height: 4.4,
        opacity: 0.34,
      },
    ],
    cloud: { build: duskCloudTexture, scale: 2.1, opacity: 0.7, count: 5 },
    sky: { sunScale: 0.5, sunGlow: 0.45, sunDrop: 40 },
  },
};
