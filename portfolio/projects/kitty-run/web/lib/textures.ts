// Canvas-generated textures, so the project ships zero image assets. Every
// texture that scrolls is drawn to tile seamlessly along x.

import * as THREE from "three";
import { createRng } from "../lib/rng.ts";
import { PALETTE } from "../lib/palette.ts";

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

// Vertical dusk-to-night gradient. The moon is NO LONGER baked here — it
// rides its own aspect-correct plane (moonTexture) so it stays round on
// portrait. Colours are parameters so Parallax can bake one variant per
// district; the defaults reproduce district I's sky byte-identically (the
// palette plus the #2a1746 mid-stop).
export function skyTexture(
  top: string = PALETTE.skyTop,
  mid: string = "#2a1746",
  bottom: string = PALETTE.skyBottom,
): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.62, mid);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  return toTexture(canvas);
}

// The moon, on its own small square canvas so its plane can be aspect-correct
// (a round disc at any viewport). Authored near-white with a mint glow; the
// per-district tint is a MULTIPLY on the plane's material.color (district I =
// #ffffff identity), so this texture never regenerates per frame.
export function moonTexture(): THREE.CanvasTexture {
  const size = 128;
  const { canvas, ctx } = makeCanvas(size, size);
  const cx = size / 2;
  const cy = size / 2;
  const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 60);
  glow.addColorStop(0, "rgba(214, 255, 240, 0.95)");
  glow.addColorStop(0.25, "rgba(95, 230, 192, 0.28)");
  glow.addColorStop(1, "rgba(95, 230, 192, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "rgba(214, 255, 240, 0.95)";
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();
  return toTexture(canvas);
}

// A puffy night cloud: a handful of overlapping circles with a soft edge,
// tinted into the dusk violet so it never reads as a white glow.
export function cloudTexture(seed: string): THREE.CanvasTexture {
  const rng = createRng(seed);
  const { canvas, ctx } = makeCanvas(512, 256);
  const puffs = 5 + Math.floor(rng() * 3);
  ctx.fillStyle = PALETTE.cloud;
  ctx.shadowColor = PALETTE.cloud;
  ctx.shadowBlur = 26;
  for (let i = 0; i < puffs; i += 1) {
    const t = puffs === 1 ? 0.5 : i / (puffs - 1);
    const x = 120 + t * 270 + (rng() - 0.5) * 40;
    const y = 150 - Math.sin(t * Math.PI) * 52 - rng() * 18;
    const r = 34 + Math.sin(t * Math.PI) * 40 + rng() * 12;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
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

// Plum polka-dot face for crates and balloons — hazards read as candy, not
// as debris.
export function crateTexture(): THREE.CanvasTexture {
  const rng = createRng("kitty-run/crate/v1");
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = PALETTE.obstaclePlum;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = PALETTE.obstacleDeep;
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, 238, 238);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = 44 + col * 56 + (row % 2 === 0 ? 0 : 28);
      const y = 44 + row * 56;
      ctx.fillStyle = PALETTE.obstacleDot;
      ctx.beginPath();
      ctx.arc(x, y, 9 + rng() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return toTexture(canvas);
}
