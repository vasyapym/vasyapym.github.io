// realm-scene — framework-free canvas engine for the opt-in "realm" layer.
//
// concept: a single-screen bonfire glade. one warm fire at the centre, seven
// gothic gates ringed around it (one identity hue each). a hollow-knight the
// player drives with a move-vector. there is NO camera transform: the canvas
// IS the world, so door screen-rects are stable proportional boxes the react
// layer overlays real <button>s onto.
//
// aesthetic law: atmosphere is density-of-dithered-marks, never blur/gradient.
// the cold "light" is a coarse low-res bayer field blitted with smoothing off;
// embers and the flame are hard quantised squares. everything is drawn in the
// ink palette so it folds into the shipped "ink catalogue" look.
//
// performance: one rAF loop (owned by start/stop), dpr capped at 2, door rects
// recomputed only on resize, and the active-door change is the ONLY thing
// pushed outward (via callback) — no per-frame dom reads or writes.

export interface RealmDoor {
  readonly id: string;
  readonly hue: string; // css hex — one identity hue per door
}

export interface DoorRect {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface RealmSceneOptions {
  readonly doors: readonly RealmDoor[];
  readonly reducedMotion: boolean;
  readonly onActiveDoorChange: (id: string | null) => void;
  readonly onLayout: (rects: readonly DoorRect[]) => void;
}

export interface RealmScene {
  start(): void;
  stop(): void;
  resize(): void;
  setMoveVector(x: number, y: number): void;
  setReducedMotion(value: boolean): void;
  getActiveDoorId(): string | null;
  destroy(): void;
}

// normalised stage layout, indexed by catalogue order (01..07). depth is faked
// by tier: back tier smaller/higher, front tier larger/lower.
const LAYOUT: readonly { nx: number; ny: number; s: number }[] = [
  { nx: 0.30, ny: 0.40, s: 0.74 },
  { nx: 0.50, ny: 0.385, s: 0.70 },
  { nx: 0.70, ny: 0.40, s: 0.74 },
  { nx: 0.145, ny: 0.55, s: 0.92 },
  { nx: 0.855, ny: 0.55, s: 0.92 },
  { nx: 0.29, ny: 0.70, s: 1.08 },
  { nx: 0.71, ny: 0.70, s: 1.08 },
];

// bayer 4x4 as 0..1 thresholds — the shared quantiser for every dithered mark.
const BAYER: readonly (readonly number[])[] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

function hexToRgb(hex: string): [number, number, number] {
  const s = hex.replace("#", "");
  const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface Door {
  id: string;
  r: number;
  g: number;
  b: number;
  nx: number;
  ny: number;
  s: number;
  x: number;
  y: number;
  w: number;
  h: number;
  glow: number;
}

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

export function createRealmScene(canvas: HTMLCanvasElement, options: RealmSceneOptions): RealmScene {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("realm-scene: 2d context unavailable");
  const c2d = ctx;

  // palette pulled to locals so the hot loop never reads css.
  const PAPER: readonly [number, number, number] = [238, 234, 224];
  const EMBER: readonly [number, number, number] = [232, 181, 124]; // --ink-accent-bright

  let reducedMotion = options.reducedMotion;
  let destroyed = false;
  let running = false;
  let rafId = 0;
  let last = 0;
  let time = 0;

  // world coordinates ARE css pixels — single-screen, so there is no camera.
  let cssW = 1;
  let cssH = 1;
  let dpr = 1;

  const doors: Door[] = options.doors.slice(0, LAYOUT.length).map((d, i) => {
    const [r, g, b] = hexToRgb(d.hue);
    return { id: d.id, r, g, b, nx: LAYOUT[i].nx, ny: LAYOUT[i].ny, s: LAYOUT[i].s, x: 0, y: 0, w: 0, h: 0, glow: 0 };
  });

  // the knight — velocity integrated so motion feels physical, not linear.
  const knight = { x: 0, y: 0, vx: 0, vy: 0, facing: 1, bob: 0, moving: 0 };
  let spawned = false;
  let inX = 0;
  let inY = 0;

  const embers: Ember[] = [];
  let activeId: string | null = null;

  // fire anchor (slightly below centre) — the one warm point in the dark hall.
  const FIRE = { nx: 0.5, ny: 0.66 };
  const fireX = (): number => FIRE.nx * cssW;
  const fireY = (): number => FIRE.ny * cssH;

  // offscreen low-res buffer — the dithered light/atmosphere is computed here at
  // cell resolution then blitted crisp, so "fog" is density-of-marks, never blur.
  const low = document.createElement("canvas");
  const lowCtx = low.getContext("2d");
  let lowW = 1;
  let lowH = 1;
  let cell = 4;
  let lowImage: ImageData | null = null;

  function layout(): void {
    const base = Math.min(cssW, cssH);
    for (const d of doors) {
      const w = base * 0.13 * d.s;
      const h = w * 1.7;
      d.w = w;
      d.h = h;
      d.x = d.nx * cssW - w / 2;
      d.y = d.ny * cssH - h / 2;
    }
    if (!spawned) {
      knight.x = fireX();
      knight.y = fireY() + base * 0.09;
      spawned = true;
    }
    // publish door rects — the ONLY layout push to react (once per resize).
    options.onLayout(doors.map((d) => ({ id: d.id, x: d.x, y: d.y, w: d.w, h: d.h })));
  }

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, Math.round(rect.width));
    cssH = Math.max(1, Math.round(rect.height));
    dpr = Math.min(2, window.devicePixelRatio || 1); // cap backing store at 2x
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2d.imageSmoothingEnabled = false; // dither must stay crisp on upscale
    cell = Math.max(3, Math.round(cssW / 240));
    lowW = Math.max(1, Math.ceil(cssW / cell));
    lowH = Math.max(1, Math.ceil(cssH / cell));
    low.width = lowW;
    low.height = lowH;
    lowImage = lowCtx ? lowCtx.createImageData(lowW, lowH) : null;
    layout();
  }

  function renderField(): void {
    if (!lowCtx || !lowImage) return;
    const data = lowImage.data;
    const R = Math.min(cssW, cssH) * 0.62; // light reach
    const fx = fireX();
    const fy = fireY();
    // global flame flicker — quantised feel comes from the bayer test, not this.
    const flick = reducedMotion ? 1 : 0.82 + 0.18 * (Math.sin(time * 7.3) * 0.5 + Math.sin(time * 3.1) * 0.5);
    let p = 0;
    for (let ly = 0; ly < lowH; ly++) {
      const wy = ly * cell;
      for (let lx = 0; lx < lowW; lx++, p += 4) {
        const wx = lx * cell;
        const dx = wx - fx;
        const dy = wy - fy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let warm = 1 - dist / R;
        warm = warm < 0 ? 0 : warm * warm * flick;
        if (wy > fy) warm += 0.05 * Math.max(0, 1 - dist / (R * 1.4)); // ground reads warmer
        const th = BAYER[ly & 3][lx & 3];
        let r = 11;
        let g = 19;
        let b = 23; // ink bg baseline
        if (warm > th) {
          // three quantised brightness steps for the surviving warm mark.
          const step = warm > th + 0.5 ? 1 : warm > th + 0.22 ? 0.66 : 0.36;
          const t = Math.min(1, dist / (R * 0.5)); // ember near fire → paper further out
          const cr = EMBER[0] + (PAPER[0] - EMBER[0]) * t;
          const cg = EMBER[1] + (PAPER[1] - EMBER[1]) * t;
          const cb = EMBER[2] + (PAPER[2] - EMBER[2]) * t;
          r = 11 + (cr - 11) * step;
          g = 19 + (cg - 19) * step;
          b = 23 + (cb - 23) * step;
        }
        data[p] = r;
        data[p + 1] = g;
        data[p + 2] = b;
        data[p + 3] = 255;
      }
    }
    lowCtx.putImageData(lowImage, 0, 0);
    c2d.drawImage(low, 0, 0, lowW, lowH, 0, 0, cssW, cssH); // crisp blocky upscale
  }

  function spawnEmber(): void {
    embers.push({
      x: fireX() + (Math.random() - 0.5) * cssW * 0.03,
      y: fireY(),
      vx: (Math.random() - 0.5) * 12,
      vy: -30 - Math.random() * 50,
      life: 0,
      max: 1.4 + Math.random() * 1.6,
    });
  }

  function updateEmbers(dt: number): void {
    if (reducedMotion) {
      embers.length = 0; // no ember drift under reduced-motion
      return;
    }
    if (embers.length < 44 && Math.random() < dt * 26) spawnEmber();
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.life += dt;
      if (e.life >= e.max) {
        embers.splice(i, 1);
        continue;
      }
      e.vy += dt * 8;
      e.vx += (Math.random() - 0.5) * dt * 20;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
  }

  function drawEmbers(): void {
    for (const e of embers) {
      const k = 1 - e.life / e.max;
      // quantise into 3 steps — hard ochre squares, never a glow.
      const q = k > 0.66 ? 1 : k > 0.33 ? 0.6 : 0.3;
      c2d.fillStyle = `rgba(${EMBER[0]},${EMBER[1]},${EMBER[2]},${q})`;
      const s = k > 0.6 ? 2 : 1;
      c2d.fillRect(Math.round(e.x), Math.round(e.y), s, s);
    }
  }

  function drawFire(): void {
    const fx = fireX();
    const fy = fireY();
    const base = Math.min(cssW, cssH) * 0.02;
    const flick = reducedMotion ? 1 : 0.8 + 0.2 * Math.sin(time * 9);
    // a small stack of quantised warm marks — the composed shot's centre.
    for (let i = 0; i < 5; i++) {
      const h = base * (1.6 - i * 0.25) * flick;
      const w = base * (1.1 - i * 0.14);
      c2d.fillStyle = `rgba(${EMBER[0]},${EMBER[1]},${EMBER[2]},${0.85 - i * 0.12})`;
      c2d.fillRect(Math.round(fx - w / 2), Math.round(fy - h), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    }
    // dark log base.
    c2d.fillStyle = "rgba(11,19,23,0.9)";
    c2d.fillRect(Math.round(fx - base), Math.round(fy - base * 0.2), Math.round(base * 2), Math.round(base * 0.5));
  }

  function drawGate(d: Door): void {
    const x = Math.round(d.x);
    const y = Math.round(d.y);
    const w = Math.round(d.w);
    const h = Math.round(d.h);
    const jamb = Math.max(3, Math.round(w * 0.16));
    // stone jambs + lintel as flat dark ink rects lifted a touch from the bg.
    c2d.fillStyle = "rgba(238,234,224,0.10)";
    c2d.fillRect(x, y, jamb, h);
    c2d.fillRect(x + w - jamb, y, jamb, h);
    c2d.fillRect(x, y, w, jamb);
    // hairline outline.
    c2d.strokeStyle = "rgba(238,234,224,0.22)";
    c2d.lineWidth = 1;
    c2d.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    // identity-hue light band inside the arch — mark density rises with proximity.
    const inX0 = x + jamb;
    const inY0 = y + jamb;
    const inW = w - jamb * 2;
    const inH = h - jamb;
    const cols = Math.max(1, Math.floor(inW / 3));
    const rows = Math.max(1, Math.floor(inH / 3));
    const intensity = 0.16 + d.glow * 0.7;
    c2d.fillStyle = `rgba(${d.r},${d.g},${d.b},${0.5 + d.glow * 0.4})`;
    for (let ry = 0; ry < rows; ry++) {
      const grad = 0.2 + (ry / rows) * 0.9; // brighter toward the threshold floor
      for (let cx = 0; cx < cols; cx++) {
        if (grad * intensity > BAYER[ry & 3][cx & 3]) c2d.fillRect(inX0 + cx * 3, inY0 + ry * 3, 2, 2);
      }
    }
  }

  function drawKnight(): void {
    const s = Math.min(cssW, cssH) * 0.012; // sprite unit
    const x = Math.round(knight.x);
    const bob = knight.moving > 0.1 && !reducedMotion ? Math.round(Math.sin(knight.bob) * s * 0.4) : 0;
    const y = Math.round(knight.y) + bob;
    const lean = Math.round(knight.facing * knight.moving * s * 0.3);
    const bw = Math.max(2, Math.round(s * 1.6));
    const bh = Math.max(3, Math.round(s * 2.4));
    // dithered contact shadow so he sits on the ground, not floating.
    c2d.fillStyle = "rgba(11,19,23,0.55)";
    const sw = Math.round(s * 2);
    for (let i = 0; i < sw; i += 2) c2d.fillRect(x - sw / 2 + i, Math.round(knight.y) + Math.round(s * 2.1), 1, 1);
    // body / cloak + hood as stacked ink rects.
    c2d.fillStyle = "rgba(20,26,30,0.98)";
    c2d.fillRect(x - bw / 2 + lean, y - bh, bw, bh);
    c2d.fillRect(x - Math.round(s * 0.7) + lean, y - bh - Math.round(s * 0.9), Math.round(s * 1.4), Math.round(s * 1.1));
    // tattered cloak hem — offsets a pixel with the bob so it reads as cloth.
    const hem = knight.moving > 0.1 && !reducedMotion ? Math.round(Math.sin(knight.bob) * s * 0.5) : 0;
    c2d.fillRect(x - bw / 2 + lean, y - Math.round(s * 0.4), Math.round(bw * 0.4), Math.round(s * 0.8) + hem);
    c2d.fillRect(x + Math.round(s * 0.1) + lean, y - Math.round(s * 0.4), Math.round(bw * 0.4), Math.round(s * 0.8) - hem);
    // ochre firelight rim on the fire-facing side — a lonely warm edge in the dark.
    const faceFire = fireX() >= knight.x ? 1 : -1;
    c2d.fillStyle = `rgba(${EMBER[0]},${EMBER[1]},${EMBER[2]},0.7)`;
    c2d.fillRect(x + faceFire * Math.round(bw * 0.42) + lean, y - bh, 1, bh);
    c2d.fillRect(x + faceFire * Math.round(s * 0.5) + lean, y - bh - Math.round(s * 0.9), 1, Math.round(s));
  }

  function nearestDoor(): Door | null {
    const range = Math.min(cssW, cssH) * 0.16;
    let best: Door | null = null;
    let bestD = range;
    for (const d of doors) {
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h * 0.72;
      const dist = Math.hypot(cx - knight.x, cy - knight.y);
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    return best;
  }

  function update(dt: number): void {
    time += dt;
    // velocity-integrated movement — accelerate toward input, apply friction.
    const speed = Math.min(cssW, cssH) * 3.4;
    const accel = speed * 6;
    knight.vx += (inX * speed - knight.vx) * Math.min(1, accel * dt * 0.0016);
    knight.vy += (inY * speed - knight.vy) * Math.min(1, accel * dt * 0.0016);
    knight.vx *= 0.86;
    knight.vy *= 0.86;
    knight.x += knight.vx * dt;
    knight.y += knight.vy * dt;
    const mag = Math.hypot(inX, inY);
    knight.moving += (mag - knight.moving) * Math.min(1, dt * 10);
    if (mag > 0.05) {
      knight.bob += dt * 12;
      if (Math.abs(inX) > 0.05) knight.facing = inX > 0 ? 1 : -1;
    }
    // clamp to the glade so the knight can never leave the composed shot.
    const m = Math.min(cssW, cssH) * 0.06;
    knight.x = Math.max(m, Math.min(cssW - m, knight.x));
    knight.y = Math.max(cssH * 0.34, Math.min(cssH - m, knight.y));

    // door proximity — the ONLY state pushed outward, and only on change.
    const near = nearestDoor();
    const nid = near ? near.id : null;
    for (const d of doors) {
      const target = d.id === nid ? 1 : 0;
      d.glow += (target - d.glow) * Math.min(1, dt * 9);
    }
    if (nid !== activeId) {
      activeId = nid;
      options.onActiveDoorChange(nid);
    }

    updateEmbers(dt);
  }

  function render(): void {
    c2d.clearRect(0, 0, cssW, cssH);
    renderField();
    // horizon hairline — separates cold hall from warm ground.
    c2d.strokeStyle = "rgba(238,234,224,0.10)";
    c2d.lineWidth = 1;
    c2d.beginPath();
    c2d.moveTo(0, Math.round(cssH * 0.5) + 0.5);
    c2d.lineTo(cssW, Math.round(cssH * 0.5) + 0.5);
    c2d.stroke();
    for (const d of doors) drawGate(d);
    drawFire();
    drawEmbers();
    drawKnight();
  }

  function frame(now: number): void {
    if (!running) return;
    const dt = last === 0 ? 0.016 : Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    rafId = window.requestAnimationFrame(frame);
  }

  function onVisibility(): void {
    if (document.hidden) {
      if (running) {
        running = false;
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = 0;
        last = 0;
      }
    } else if (!destroyed && !running) {
      start();
    }
  }

  document.addEventListener("visibilitychange", onVisibility);

  function start(): void {
    if (destroyed || running) return;
    running = true;
    last = 0;
    rafId = window.requestAnimationFrame(frame);
  }

  function stop(): void {
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    last = 0;
  }

  resize();

  return {
    start,
    stop,
    resize,
    setMoveVector(x: number, y: number): void {
      const m = Math.hypot(x, y);
      if (m > 1) {
        inX = x / m;
        inY = y / m;
      } else {
        inX = x;
        inY = y;
      }
    },
    setReducedMotion(value: boolean): void {
      reducedMotion = value;
    },
    getActiveDoorId(): string | null {
      return activeId;
    },
    destroy(): void {
      destroyed = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
