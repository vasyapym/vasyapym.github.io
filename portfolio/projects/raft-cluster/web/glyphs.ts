// web/glyphs.ts — small canvas primitives shared by the Raft page renderer (revision 1).
// Pure drawing helpers: no layout knowledge, no sim knowledge.

/** The ink hue shared by every shell line token, parametrised by alpha. */
export function ink(alpha: number): string {
  return `rgba(238, 234, 224, ${alpha})`;
}

/** Clamp to [0, 1]. */
export function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Quadratic ease-out for the ≤400 ms emphasis marks. */
export function easeOut(t: number): number {
  const u = clamp01(t);
  return 1 - (1 - u) * (1 - u);
}

/** Clamp `v` into [lo, hi]. */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Fill a circle. */
export function fillCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  style: string,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Stroke a circle. */
export function strokeCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  width: number,
  style: string,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = style;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * A comet: a round-capped stroke from `trailLen` behind the head point to the
 * head point, travelling along `angle`; optional filled head (replication).
 */
export function drawComet(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  angle: number,
  trailLen: number,
  width: number,
  style: string,
  alpha: number,
  withHead: boolean,
): void {
  const tx = hx - Math.cos(angle) * trailLen;
  const ty = hy - Math.sin(angle) * trailLen;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = style;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  if (withHead) {
    ctx.fillStyle = style;
    ctx.beginPath();
    ctx.arc(hx, hy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** An open chevron pointing along `angle` (a granted reply flowing home). */
export function drawChevron(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  arm: number,
  style: string,
  alpha: number,
): void {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const px = -dy;
  const py = dx;
  const ax = x + dx * 2;
  const ay = y + dy * 2;
  const bx = x - dx * 3;
  const by = y - dy * 3;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = style;
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx + px * arm * 0.8, by + py * arm * 0.8);
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx - px * arm * 0.8, by - py * arm * 0.8);
  ctx.stroke();
  ctx.restore();
}

/** A small ×-cross marking where a message died; oriented to the link. */
export function drawCross(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  arm: number,
  width: number,
  style: string,
  alpha: number,
  angle: number,
): void {
  const c = Math.cos(angle) * arm;
  const s = Math.sin(angle) * arm;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = style;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - c, y - s);
  ctx.lineTo(x + c, y + s);
  ctx.moveTo(x + c, y - s);
  ctx.lineTo(x - c, y + s);
  ctx.stroke();
  ctx.restore();
}

/** A circular arc starting at −90° (top) sweeping `frac` of a full turn. */
export function drawArcFraction(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  frac: number,
  style: string,
  width: number,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = style;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** A 1px dashed hairline (dash 2/3) — the "empty, ready" log baseline. */
export function drawDashedBaseline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  style: string,
): void {
  ctx.save();
  ctx.strokeStyle = style;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}
