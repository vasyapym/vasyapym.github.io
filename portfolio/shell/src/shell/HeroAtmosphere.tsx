import { useEffect, useRef } from "react";

// The hero backdrop is a slow atmosphere. A seeded value-noise heightfield is
// domain-warped — its sample coordinates are themselves pushed around by two
// other noise fields — so the layers marble into each other like mud or ink
// in water. The fog is computed at one pixel per 4 css px and the browser
// upscales it with bilinear smoothing: soft by construction, bit-identical on
// every platform, no WebGL and no platform-dependent shaders (the old WebGL
// hero rendered as smoke on iOS and mud on Windows — this is the same feel
// without the variance). The pointer is a gentle heat source: the haze
// thickens and swells under the cursor, then settles. There are no readouts,
// markers, or rings — the field is weather, not an instrument panel.
// prefers-reduced-motion collapses everything to a single static render.

const SEED = 20260827;
const RES_DIV = 4;
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
const FOG_MAX_ALPHA = 0.45;
const UPDATE_MS = 1000 / 30;
const FRAME_BUDGET_MS = 26;

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

export default function HeroAtmosphere() {
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
      let raf = 0;
      let running = false;
      let inView = true;
      let disposed = false;

      let cssW = 0;
      let cssH = 0;
      let fw = 0;
      let fh = 0;
      let image: ImageData | null = null;
      let octaves = BASE_OCTAVES;
      let frameEma = 0;
      let draws = 0;

      let lastT = -1;
      let lastDrawT = 0;

      const swirl = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, active: false };

      const resize = () => {
        const rect = host.getBoundingClientRect();
        cssW = Math.max(1, Math.round(rect.width));
        cssH = Math.max(1, Math.round(rect.height));
        fw = Math.max(1, Math.ceil(cssW / RES_DIV));
        fh = Math.max(1, Math.ceil(cssH / RES_DIV));
        canvas.width = fw;
        canvas.height = fh;
        image = ctx.createImageData(fw, fh);
      };

      const drawFog = (t: number) => {
        if (!image) {
          return;
        }
        const data = image.data;
        const driftX = t * DRIFT_X;
        const driftY = t * DRIFT_Y;
        const tide = Math.sin((t * Math.PI * 2) / TIDE_PERIOD) * TIDE_AMP;
        const warpT = t * 0.026;
        const sigma2 = 2 * SWIRL_SIGMA * SWIRL_SIGMA;
        const swirlReach = 9 * sigma2;
        let o = 0;
        for (let j = 0; j < fh; j += 1) {
          const y = j * RES_DIV;
          for (let i = 0; i < fw; i += 1) {
            const x = i * RES_DIV;
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
            const warm = smoothstep((v - 0.3) / 0.5);
            data[o] = 110 + 101 * warm;
            data[o + 1] = 180 - 25 * warm;
            data[o + 2] = 190 - 93 * warm;
            data[o + 3] = rise * FOG_MAX_ALPHA * 255;
            o += 4;
          }
        }
        ctx.putImageData(image, 0, 0);
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
          drawFog(t);
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
          drawFog(0);
        } else if (!running) {
          syncRunning();
        }
      });
      resizeObserver.observe(host);

      resize();
      if (reduce) {
        drawFog(0);
      } else {
        host.addEventListener("pointermove", onPointerMove, { passive: true });
        host.addEventListener("pointerleave", onPointerLeave, { passive: true });
        syncRunning();
      }

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

  return <canvas ref={canvasRef} className="signal-index-hero-canvas" aria-hidden="true" />;
}
