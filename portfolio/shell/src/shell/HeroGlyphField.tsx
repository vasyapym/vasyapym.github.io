import { useEffect, useRef } from "react";

// The hero backdrop is a live glyph field: a tiny software rasterizer that
// samples the same seeded value-noise heightfield the retired fog used
// (domain-warped fBm + slow drift + long tide + a Gaussian pointer heat
// source) but renders it as the site's own monospace notation instead of
// pixels. Field height per grid cell selects a character from a density ramp
// and a colour tier (cool teal in the troughs -> warm amber at the crests);
// cells below a quiet-zone floor are skipped so the field reads sparse and
// instrument-like. The hot path avoids fillText entirely: every ramp glyph is
// pre-rasterised once, per colour tier, into a DPR-aware offscreen atlas, and
// each visible cell is a single drawImage blit with a globalAlpha write — cheap
// enough to hold ~30fps field updates on mid-range mobile while staying crisp
// at DPR 2-3. No WebGL, no blur (crisp glyphs are the whole point), platform
// -identical output. prefers-reduced-motion collapses to one static frame.

const SEED = 20260827;
const BASE_OCTAVES = 3;
const WARP_OCTAVES = 2;
const FREQ = 1 / 260;
const WARP_FREQ = 1 / 340;
const WARP_AMP = 95;
const DRIFT_X = 4.5;
const DRIFT_Y = 2.0;
const TIDE_PERIOD = 26;
const TIDE_AMP = 0.05;
const SWIRL_SIGMA = 150;
const SWIRL_AMP = 0.5;

const CELL_DESKTOP = 13;
const CELL_MOBILE = 11;
const MOBILE_MAX = 700;
const RAMP = "·:;+=*#%@";
const COLOR_TIERS = 6;
const FONT_RATIO = 1.0;
const QUIET_THRESHOLD = 0.2;
const ALPHA_CEIL = 0.55;
const COPY_DIM = 0.35;
const COPY_DIM_FRAC = 0.52;
const DPR_CAP = 3;
const UPDATE_MS = 1000 / 30;
const FRAME_BUDGET_MS = 26;

const COOL: [number, number, number] = [110, 180, 190];
const WARM: [number, number, number] = [211, 155, 97];

function hash2(ix: number, iy: number, seed: number): number {
  let h = (Math.imul(ix, 0x27d4eb2d) ^ Math.imul(iy, 0x165667b1) ^ Math.imul(seed, 0x9e3779b9)) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x0 + 1, y0, seed);
  const n01 = hash2(x0, y0 + 1, seed);
  const n11 = hash2(x0 + 1, y0 + 1, seed);
  return n00 + (n10 - n00) * sx + (n01 - n00) * sy + (n00 - n10 - n01 + n11) * sx * sy;
}

function fbm(x: number, y: number, octaves: number, seedBase: number): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o += 1) {
    sum += amp * valueNoise(x * freq + o * 17.31, y * freq - o * 9.7, seedBase + o * 101);
    norm += amp;
    amp *= 0.55;
    freq *= 2.03;
  }
  return (sum / norm) * 2 - 1;
}

function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

export default function HeroGlyphField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    const host = canvas.parentElement as HTMLElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return undefined;
    }

    let disposeScene: (() => void) | null = null;
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const initScene = () => {
      const reduce = reduceQuery.matches;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

      let raf = 0;
      let running = false;
      let inView = true;
      let disposed = false;

      let cssW = 0;
      let cssH = 0;
      let cellPx = CELL_DESKTOP;
      let cols = 0;
      let rows = 0;
      let octaves = BASE_OCTAVES;
      let frameEma = 0;
      let draws = 0;

      let lastT = -1;
      let lastDrawT = 0;

      const atlas = document.createElement("canvas");
      let atlasTile = 1;

      const swirl = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, active: false };

      const buildAtlas = () => {
        const ax = atlas.getContext("2d");
        if (!ax) {
          return;
        }
        atlasTile = Math.max(1, Math.round(cellPx * dpr));
        atlas.width = RAMP.length * atlasTile;
        atlas.height = COLOR_TIERS * atlasTile;
        ax.clearRect(0, 0, atlas.width, atlas.height);
        ax.textAlign = "center";
        ax.textBaseline = "middle";
        ax.font = `${Math.round(cellPx * FONT_RATIO * dpr)}px "IBM Plex Mono", ui-monospace, monospace`;
        for (let tier = 0; tier < COLOR_TIERS; tier += 1) {
          const f = tier / (COLOR_TIERS - 1);
          const r = Math.round(COOL[0] + (WARM[0] - COOL[0]) * f);
          const g = Math.round(COOL[1] + (WARM[1] - COOL[1]) * f);
          const b = Math.round(COOL[2] + (WARM[2] - COOL[2]) * f);
          ax.fillStyle = `rgb(${r}, ${g}, ${b})`;
          for (let gi = 0; gi < RAMP.length; gi += 1) {
            ax.fillText(RAMP[gi], gi * atlasTile + atlasTile / 2, tier * atlasTile + atlasTile / 2);
          }
        }
      };

      const resize = () => {
        const rect = host.getBoundingClientRect();
        cssW = Math.max(1, Math.round(rect.width));
        cssH = Math.max(1, Math.round(rect.height));
        cellPx = cssW <= MOBILE_MAX ? CELL_MOBILE : CELL_DESKTOP;
        cols = Math.ceil(cssW / cellPx);
        rows = Math.ceil(cssH / cellPx);
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
        buildAtlas();
      };

      const draw = (t: number) => {
        ctx.clearRect(0, 0, cssW, cssH);
        const driftX = t * DRIFT_X;
        const driftY = t * DRIFT_Y;
        const tide = Math.sin((t * Math.PI * 2) / TIDE_PERIOD) * TIDE_AMP;
        const warpT = t * 0.026;
        const sigma2 = 2 * SWIRL_SIGMA * SWIRL_SIGMA;
        const swirlReach = 9 * sigma2;
        const dimEdge = cssW * COPY_DIM_FRAC;
        for (let j = 0; j < rows; j += 1) {
          const y = (j + 0.5) * cellPx;
          for (let i = 0; i < cols; i += 1) {
            const x = (i + 0.5) * cellPx;
            const warpX = fbm(x * WARP_FREQ + warpT, y * WARP_FREQ - warpT * 0.63, WARP_OCTAVES, SEED + 911);
            const warpY = fbm(x * WARP_FREQ - warpT * 0.81, y * WARP_FREQ + warpT * 0.47, WARP_OCTAVES, SEED + 577);
            let v = fbm(
              (x + driftX + warpX * WARP_AMP) * FREQ,
              (y + driftY + warpY * WARP_AMP) * FREQ,
              octaves,
              SEED,
            );
            v += tide;
            if (swirl.active) {
              const dx = x - swirl.x;
              const dy = y - swirl.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < swirlReach) {
                v += SWIRL_AMP * Math.exp(-d2 / sigma2);
              }
            }
            const rise = smoothstep((v + 0.35) / 1.15);
            if (rise < QUIET_THRESHOLD) {
              continue;
            }
            let alpha = rise * ALPHA_CEIL;
            if (x < dimEdge) {
              alpha *= COPY_DIM + (1 - COPY_DIM) * smoothstep(x / dimEdge);
            }
            const g = (rise - QUIET_THRESHOLD) / (1 - QUIET_THRESHOLD);
            const gi = Math.min(RAMP.length - 1, Math.floor(g * RAMP.length));
            const warm = smoothstep((v - 0.3) / 0.5);
            const tier = Math.min(COLOR_TIERS - 1, Math.floor(warm * COLOR_TIERS));
            ctx.globalAlpha = alpha;
            ctx.drawImage(
              atlas,
              gi * atlasTile,
              tier * atlasTile,
              atlasTile,
              atlasTile,
              i * cellPx,
              j * cellPx,
              cellPx,
              cellPx,
            );
          }
        }
        ctx.globalAlpha = 1;
      };

      const tick = (nowMs: number) => {
        raf = requestAnimationFrame(tick);
        const t = nowMs / 1000;
        const dt = lastT < 0 ? 0.016 : Math.min(0.05, t - lastT);
        lastT = t;
        if (swirl.active) {
          const k = 1 - Math.exp(-dt * 6);
          swirl.x += (swirl.tx - swirl.x) * k;
          swirl.y += (swirl.ty - swirl.y) * k;
        }
        if (lastDrawT === 0 || nowMs - lastDrawT >= UPDATE_MS) {
          const cost = lastDrawT === 0 ? 16 : nowMs - lastDrawT;
          lastDrawT = nowMs;
          draw(t);
          frameEma = frameEma === 0 ? cost : frameEma * 0.94 + cost * 0.06;
          draws += 1;
          if (draws > 60 && frameEma > FRAME_BUDGET_MS && octaves > 2) {
            octaves = 2;
          }
        }
      };

      const start = () => {
        if (running || disposed) {
          return;
        }
        running = true;
        lastT = -1;
        raf = requestAnimationFrame(tick);
      };
      const stop = () => {
        if (!running) {
          return;
        }
        running = false;
        cancelAnimationFrame(raf);
      };

      const syncRunning = () => {
        if (reduce || !inView || document.hidden) {
          stop();
          if (!reduce) {
            return;
          }
        }
        if (!reduce && inView && !document.hidden) {
          start();
        }
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        swirl.tx = event.clientX - rect.left;
        swirl.ty = event.clientY - rect.top;
        if (!swirl.active) {
          swirl.active = true;
          swirl.x = swirl.tx;
          swirl.y = swirl.ty;
        }
      };
      const onPointerLeave = () => {
        swirl.active = false;
      };

      const observer = new IntersectionObserver(
        (entries) => {
          inView = entries.some((entry) => entry.isIntersecting);
          syncRunning();
        },
        { threshold: 0 },
      );
      observer.observe(host);

      const onVisibility = () => syncRunning();
      document.addEventListener("visibilitychange", onVisibility);

      const resizeObserver = new ResizeObserver(() => {
        resize();
        if (reduce) {
          draw(0);
        } else if (!running) {
          syncRunning();
        }
      });
      resizeObserver.observe(host);

      resize();
      if (reduce) {
        draw(0);
      } else {
        host.addEventListener("pointermove", onPointerMove, { passive: true });
        host.addEventListener("pointerleave", onPointerLeave, { passive: true });
        syncRunning();
      }

      // Webfont may arrive after mount: rebuild the atlas with real Plex Mono
      // glyphs once available, then repaint (static frame under reduce).
      document.fonts.ready.then(() => {
        if (disposed) {
          return;
        }
        buildAtlas();
        if (reduce || !running) {
          draw(reduce ? 0 : lastT < 0 ? 0 : lastT);
        }
      });

      return () => {
        disposed = true;
        stop();
        observer.disconnect();
        resizeObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        host.removeEventListener("pointermove", onPointerMove);
        host.removeEventListener("pointerleave", onPointerLeave);
      };
    };

    disposeScene = initScene();
    const onReduceChange = () => {
      if (disposeScene) {
        disposeScene();
      }
      disposeScene = initScene();
    };
    reduceQuery.addEventListener("change", onReduceChange);

    return () => {
      reduceQuery.removeEventListener("change", onReduceChange);
      if (disposeScene) {
        disposeScene();
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="signal-index-hero-glyphs" aria-hidden="true" />;
}
