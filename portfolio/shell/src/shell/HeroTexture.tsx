import { useEffect, useRef } from "react";

/**
 * Hero texture — a sparse, self-driven "breathing dot-field" on a Canvas2D
 * layer BEHIND the giant Unbounded headline. Art direction, not a generative
 * demo: quiet by default, visibly alive with zero input on every device.
 * Pointer is a bonus only (dots near the cursor warm to ochre).
 *
 * Quality contract (matches the deleted HeroField): ~30fps cadence with a
 * frame-budget degradation path (dot stride), paused offscreen (IO) and when
 * document.hidden, ONE static frame under prefers-reduced-motion, DPR backing
 * store capped at 3, crisp (no blur / no fog), full StrictMode-safe cleanup.
 */
export default function HeroTexture() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      return;
    }

    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    const INK = "238, 234, 224"; // --ink-text
    const ACCENT = "232, 181, 124"; // --ink-accent-bright

    let width = 0;
    let height = 0;
    let dpr = 1;

    type Dot = {
      x: number;
      y: number;
      phase: number;
      speed: number;
      base: number;
      live: boolean;
    };
    let dots: Dot[] = [];

    let raf = 0;
    let running = false;
    let lastPaint = 0;
    let stride = 1;
    let slowStreak = 0;
    const FRAME_MS = 1000 / 30;

    const pointer = { x: -1, y: -1, active: false };

    const rand = (seed: number) => {
      const t = Math.sin(seed * 127.1) * 43758.5453;
      return t - Math.floor(t);
    };

    const buildDots = () => {
      dots = [];
      const gap = Math.max(46, Math.min(74, Math.round(width / 20)));
      const jitter = gap * 0.3;
      let i = 0;
      for (let gy = gap * 0.5; gy < height + gap; gy += gap) {
        for (let gx = gap * 0.5; gx < width + gap; gx += gap) {
          const rx = rand(i + 0.11);
          const ry = rand(i + 0.29);
          const rp = rand(i + 0.53);
          const rs = rand(i + 0.71);
          dots.push({
            x: gx + (rx - 0.5) * jitter * 2,
            y: gy + (ry - 0.5) * jitter * 2,
            phase: rp * Math.PI * 2,
            speed: 0.28 + rs * 0.42,
            base: 0.04 + rp * 0.05,
            live: rand(i + 0.97) > 0.93,
          });
          i += 1;
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildDots();
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = time * 0.001;
      const driftX = Math.sin(t * 0.06) * 8;
      const driftY = Math.cos(t * 0.05) * 6;
      const usePointer = finePointer && pointer.active;
      const reach = 150;
      for (let k = 0; k < dots.length; k += stride) {
        const d = dots[k];
        if (!d) {
          continue;
        }
        const breathe = 0.5 + 0.5 * Math.sin(t * d.speed + d.phase);
        const px = d.x + driftX;
        const py = d.y + driftY;
        let alpha: number;
        let radius: number;
        let color: string;
        if (d.live) {
          color = ACCENT;
          alpha = (0.055 + d.base) * (0.35 + 0.65 * breathe);
          radius = 1.1 + breathe * 0.6;
        } else {
          color = INK;
          alpha = d.base * (0.4 + 0.6 * breathe);
          radius = 0.9 + breathe * 0.5;
        }
        if (usePointer) {
          const dx = px - pointer.x;
          const dy = py - pointer.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < reach * reach) {
            const warm = 1 - Math.sqrt(dist2) / reach;
            alpha += warm * 0.16;
            radius += warm * 0.7;
            color = ACCENT;
          }
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (time: number) => {
      if (!running) {
        return;
      }
      raf = window.requestAnimationFrame(loop);
      if (time - lastPaint < FRAME_MS) {
        return;
      }
      lastPaint = time;
      const t0 = performance.now();
      draw(time);
      const cost = performance.now() - t0;
      if (cost > 9) {
        slowStreak += 1;
        if (slowStreak > 18 && stride < 3) {
          stride += 1;
          slowStreak = 0;
        }
      } else if (slowStreak > 0) {
        slowStreak -= 1;
      }
    };

    const start = () => {
      if (running || reduceQuery.matches || document.hidden) {
        return;
      }
      running = true;
      lastPaint = 0;
      raf = window.requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const paintStatic = () => {
      resize();
      draw(0);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible && !reduceQuery.matches && !document.hidden) {
          start();
        } else {
          stop();
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduceQuery.matches || !running) {
        draw(0);
      }
    });
    ro.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else if (!reduceQuery.matches) {
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    if (finePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }

    const onReduceChange = () => {
      if (reduceQuery.matches) {
        stop();
        paintStatic();
      } else {
        start();
      }
    };
    reduceQuery.addEventListener("change", onReduceChange);

    resize();
    if (reduceQuery.matches) {
      draw(0);
    } else {
      start();
    }

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduceQuery.removeEventListener("change", onReduceChange);
      if (finePointer) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerleave", onPointerLeave);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="signal-index-hero-texture" aria-hidden="true" />;
}
