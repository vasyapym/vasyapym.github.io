/**
 * realm-scene.ts — "The Deep": world model, camera, lantern physics, input,
 * phase machine, Canvas2D overlay, degraded renderer and the single rAF loop.
 *
 * architecture
 *   shell (react)  →  createRealmScene(glCanvas, overlay, opts)  →  RealmScene api
 *                                  │
 *                    ┌─────────────┼──────────────────┐
 *              realm-fluid      realm-creatures     overlay 2d ctx
 *           (webgl, or null)   (update / emit)    (names, hint, degraded)
 *
 * coordinate contract shared with realm-creatures:
 *   world px: origin top-left of a (vw × 2vh) column; camX is always 0.
 *   screen px = (world − cam − half viewport) × zoom + half viewport
 *   i.e. sx = (wx − camX − vw/2) * zoom + vw/2,  sy = (wy − camY − vh/2) * zoom + vh/2
 *
 * phases: idle → entering → active → (leaving | diving) → done
 * every timing here is wall-clock based; there is no dye readback.
 */

import { createFluid } from "./realm-fluid";
import {
  createCreatures,
  Emitter,
  type CameraView,
  type CreatureContext,
  type RealmCreature,
} from "./realm-creatures";

// ─── public contracts ────────────────────────────────────────────────────────

export interface RealmSceneOptions {
  readonly doors: readonly { readonly id: string; readonly hue: string }[];
  readonly names?: readonly string[];
  readonly reducedMotion: boolean;
  readonly smallScreen: boolean;
  readonly onPhaseDone: (phase: "entering" | "leaving") => void;
  readonly onDiveCommit: (id: string) => void;
  readonly onNearest: (id: string | null) => void;
}

export interface RealmScene {
  startEnter(chipX: number, chipY: number): void;
  startLeave(chipX: number, chipY: number): void;
  startDive(id: string): void;
  startGreeting(id: string): void;
  setPointer(x: number, y: number, active: boolean): void;
  setThrust(x: number, y: number): void;
  setCalling(calling: boolean): void;
  /** snapshot screen pick geometry for the next select gesture. */
  markPickAnchor(touch?: boolean): void;
  /** current or anchored screen geometry; nearestId() remains untouched. */
  pickAt(px: number, py: number, touch: boolean): string | null;
  /** displayed lantern radius in screen css px (shell-side touch lift). */
  lightRadius(): number;
  breatheLight(dir: number): void;
  warpTo(index: number): void;
  nearestId(): string | null;
  audioSnapshot(): {
    speed: number;
    nearest: number;
    voices: readonly { readonly id: string; readonly pan: number; readonly gain: number }[];
  };
  frameMeanMs(): number;
  qualityLevel(): number;
  destroy(): void;
}

// ─── constants ───────────────────────────────────────────────────────────────

type Phase = "idle" | "entering" | "active" | "leaving" | "diving" | "done";

const ANCHORS: readonly { readonly fx: number; readonly fy: number }[] = [
  { fx: 0.25, fy: 0.26 },
  { fx: 0.68, fy: 0.3 },
  { fx: 0.46, fy: 0.48 },
  { fx: 0.8, fy: 0.55 },
  { fx: 0.2, fy: 0.68 },
  { fx: 0.52, fy: 0.78 },
  { fx: 0.76, fy: 0.9 },
];

const INK: readonly [number, number, number] = [11 / 255, 19 / 255, 23 / 255];
const WARM: readonly [number, number, number] = [232 / 255, 181 / 255, 124 / 255];
const ABYSS_CSS = "#04080b";
const INK_CSS = "#0b1317";
const PAPER_CSS = "rgba(236, 229, 214, 0.55)";
const FONT = "11px 'IBM Plex Mono', ui-monospace, monospace";

const ENTER_MS = 1.05;
const ENTER_REDUCED = 0.45;
const LEAVE_MS = 0.9;
const LEAVE_REDUCED = 0.45;
const DIVE_MS = 1.0;
const DIVE_REDUCED = 0.4;
const DEGRADED_DISC = 0.8;
const DEGRADED_DIVE_DISC = 0.9;

const SPLASH_GAP = 0.09;
const SPLASH_COUNT = 8;
const IDLE_BEFORE_LURE = 8;
const LURE_RAMP = 3;
const HINT_INPUT_NEEDED = 2;
const POINT_CAP = 3072;
const LINE_CAP = 1536;
const MAX_DT = 0.05;
const WAKE_ON = 120;
const WAKE_OFF = 70;

const TRAIL_CAP = 64;
const TRAIL_KEEP = 0.55;
const TRAIL_SAMPLE_DT = 1 / 60;
// short chords overlap with normalized support to hide per-quad joins.
const TRAIL_SPACING = 5;
const TRAIL_LINE_CAP = 256;

const WAKE_SPACING = 14;
const WAKE_SPLAT_CAP = 16;
const MOTION_GAP = 0.12;

const PICK_ANCHOR_MS = 450;
const PICK_CUE_CSS = "rgb(232, 181, 124)";

// ─── small helpers ───────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function smooth(t: number): number {
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * (3 - 2 * c);
}

function parseHex(hex: string): [number, number, number] {
  let h = hex.trim();
  if (h.charAt(0) === "#") h = h.slice(1);
  if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
  const n = Number.parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0.8, 0.8, 0.8];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function cssOf(rgb: readonly [number, number, number], a: number): string {
  return `rgba(${Math.round(rgb[0] * 255)},${Math.round(rgb[1] * 255)},${Math.round(rgb[2] * 255)},${a})`;
}

// leave vortex: pulse — rises to full pull at 35%, decays to zero at the end,
// so the drain settles instead of being cut at maximum force.
function leaveVortexStrength(
  normalizedProgress: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0;

  const t = Math.min(Math.max(normalizedProgress, 0), 1);
  const peakAt = 0.35;

  if (t <= peakAt) {
    return 30 + 80 * smooth(t / peakAt);
  }

  return 110 * (1 - smooth((t - peakAt) / (1 - peakAt)));
}

// mutable twins of the readonly contract objects so we can reuse one instance per frame
interface MutableCamera {
  camX: number; camY: number; zoom: number; vw: number; vh: number;
}
interface MutableLantern { x: number; y: number; r: number; intensity: number }
interface MutableContext {
  time: number; dt: number;
  lantern: MutableLantern;
  world: { w: number; h: number };
  calling: boolean; lure: number; reduced: boolean; greeting: number;
}
interface Voice { id: string; pan: number; gain: number }

// ─── scene ───────────────────────────────────────────────────────────────────

export function createRealmScene(
  glCanvas: HTMLCanvasElement,
  overlay: HTMLCanvasElement,
  opts: RealmSceneOptions,
): RealmScene {
  const reduced = opts.reducedMotion;
  const small = opts.smallScreen;
  const doors = opts.doors;
  const count = Math.min(doors.length, ANCHORS.length);

  // ── static per-door data (built once) ──
  const hues: [number, number, number][] = [];
  const hueCss: string[] = [];
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = doors[i];
    const rgb = parseHex(d.hue);
    hues.push(rgb);
    hueCss.push(cssOf(rgb, 1));
    const n = opts.names !== undefined && i < opts.names.length ? opts.names[i] : d.id;
    names.push(n.toLowerCase());
  }

  // ── viewport / world ──
  let vw = 1;
  let vh = 1;
  let dpr = 1;
  let diag = 1;
  let interactR = 1;
  let lanternBaseR = 1;

  const world = { w: 1, h: 2 };
  const cam: MutableCamera = { camX: 0, camY: 0, zoom: 1, vw: 1, vh: 1 };
  let camYState = 0;       // spring state without sway
  let camVy = 0;           // px/s, fed to fluid.globalDrift
  let sway = 0;

  // ── lantern ──
  const lan: MutableLantern = { x: 0, y: 0, r: 1, intensity: 0 };
  let lvx = 0;
  let lvy = 0;
  let lanSx = 0;
  let lanSy = 0;
  let prevSx = 0;
  let prevSy = 0;
  let speed = 0;
  let breath = 0.75;
  let ignite = 0;          // 0..1 ramp during entering, 1 in active

  // ── input ──
  let ptrX = 0;
  let ptrY = 0;
  let ptrActive = false;
  let thrustX = 0;
  let thrustY = 0;
  let calling = false;
  let wakeOn = false;
  let idleT = 0;
  let lure = 0;
  let inputAccum = 0;

  // ── phosphor trail + motion continuity ──
  let breathTarget = 0.75;

  const trailX = new Float32Array(TRAIL_CAP);
  const trailY = new Float32Array(TRAIL_CAP);
  const trailT = new Float32Array(TRAIL_CAP);
  const trailG = new Float32Array(TRAIL_CAP);
  let trailHead = 0;
  let trailFill = 0;
  let trailClock = 0;
  let trailLastSample = 0;
  let trailGain = 0;

  let motionPrimed = false;
  let lastTickWall = -1;

  // ── pick anchors (sized by count: creatures always hold exactly count entries) ──
  const pickAnchorX = new Float32Array(count);
  const pickAnchorY = new Float32Array(count);
  let pickAnchorValid = false;
  let pickAnchorTime = 0;
  let pickAnchorZoom = 1;
  let pickTouch: boolean | null = null;

  // ── phase ──
  let phase: Phase = "idle";
  let phaseT = 0;
  // phase choreography runs on WALL time, not accumulated dt: the shell's css
  // (iris, leave fade) is wall-clock, and a dt cap under load would desync the
  // engine's commit from the css it must line up with.
  let phaseStart = 0;
  let activeT = 0;
  let chipX = 0;
  let chipY = 0;
  let splashIdx = 0;
  let coverDone = false;
  let diveIdx = -1;
  let diveFromZoom = 1;
  let greetIdx = -1;
  let greetT = 0;
  let fired = false;

  // ── creatures / emission ──
  const emitter = new Emitter(POINT_CAP, LINE_CAP);
  let creatures: RealmCreature[] = [];
  const ctx: MutableContext = {
    time: 0, dt: 0,
    lantern: lan,
    world,
    calling: false, lure: 0, reduced, greeting: 0,
  };
  let nearestIdx = -1;
  let nearestDist = Infinity;
  let lastNearestId: string | null = null;
  const voices: Voice[] = [];
  for (let i = 0; i < count; i++) voices.push({ id: doors[i].id, pan: 0, gain: 0 });
  const snapshot = { speed: 0, nearest: 0, voices: voices as readonly Voice[] };

  // ── renderers ──
  const fluid = createFluid(glCanvas, { reducedMotion: reduced, smallScreen: small });
  const degraded = fluid === null;
  const ctx2d = overlay.getContext("2d");

  // ── loop ──
  let raf = 0;
  let running = false;
  let lastNow = 0;
  let destroyed = false;

  // ─── geometry ─────────────────────────────────────────────────────────────

  function sx(wx: number): number {
    return (wx - cam.camX - vw * 0.5) * cam.zoom + vw * 0.5;
  }
  function sy(wy: number): number {
    return (wy - cam.camY - vh * 0.5) * cam.zoom + vh * 0.5;
  }

  function clearTrail(): void {
    trailHead = 0;
    trailFill = 0;
    trailClock = 0;
    trailLastSample = 0;
    trailGain = 0;
  }

  function invalidateSceneContinuity(): void {
    clearTrail();
    motionPrimed = false;
    wakeOn = false;
    pickAnchorValid = false;
    pickAnchorTime = 0;
    pickAnchorZoom = 1;
  }

  function recordTrail(elapsed: number): void {
    trailClock += elapsed;

    const s = clamp((speed - 40) / 760, 0, 1);
    const target = s * s * (3 - 2 * s);
    trailGain += (target - trailGain) * (1 - Math.exp(-12 * elapsed));

    while (trailFill > 0) {
      const oldest = (trailHead - trailFill + TRAIL_CAP) % TRAIL_CAP;
      if (trailClock - trailT[oldest] <= TRAIL_KEEP) break;
      trailFill--;
    }

    // the live head covers the remainder between stored samples.
    if (
      trailFill > 0 &&
      trailClock - trailLastSample < TRAIL_SAMPLE_DT - 1e-5
    ) return;

    trailX[trailHead] = lan.x;
    trailY[trailHead] = lan.y;
    trailT[trailHead] = trailClock;
    trailG[trailHead] = trailGain;
    trailHead = (trailHead + 1) % TRAIL_CAP;
    trailFill = Math.min(TRAIL_CAP, trailFill + 1);
    trailLastSample = trailClock;
  }

  function emitTrail(): void {
    if (
      phase !== "active" ||
      reduced ||
      trailFill === 0 ||
      lan.intensity <= 0.01
    ) return;

    const limit = Math.min(
      TRAIL_LINE_CAP,
      Math.max(0, LINE_CAP - emitter.lineCount)
    );
    const zoom = cam.zoom;
    if (limit === 0 || zoom <= 0) return;

    let work = 0;

    // newest first: overload trims the faint tail, never the live head.
    for (let k = trailFill - 1; k >= 0 && work < limit; k--) {
      const i = (trailHead - trailFill + k + TRAIL_CAP) % TRAIL_CAP;
      const bx = trailX[i];
      const by = trailY[i];
      const bt = trailT[i];
      const bg = trailG[i];

      let ax: number;
      let ay: number;
      let at: number;
      let ag: number;
      if (k === trailFill - 1) {
        ax = lan.x;
        ay = lan.y;
        at = trailClock;
        ag = trailGain;
      } else {
        const newer = (i + 1) % TRAIL_CAP;
        ax = (bx + trailX[newer]) * 0.5;
        ay = (by + trailY[newer]) * 0.5;
        at = (bt + trailT[newer]) * 0.5;
        ag = (bg + trailG[newer]) * 0.5;
      }

      let cx: number;
      let cy: number;
      let ct: number;
      let cg: number;
      if (k === 0) {
        cx = bx;
        cy = by;
        ct = bt;
        cg = bg;
      } else {
        const older = (i - 1 + TRAIL_CAP) % TRAIL_CAP;
        cx = (bx + trailX[older]) * 0.5;
        cy = (by + trailY[older]) * 0.5;
        ct = (bt + trailT[older]) * 0.5;
        cg = (bg + trailG[older]) * 0.5;
      }

      // |q'(u)| <= 2 * max(|b-a|, |c-b|), including curved spans.
      const bound = 2 * zoom * Math.max(
        Math.hypot(bx - ax, by - ay),
        Math.hypot(cx - bx, cy - by)
      );
      if (bound < 0.01) continue;

      const subdivisions = Math.max(1, Math.ceil(bound / TRAIL_SPACING));
      let x0 = sx(ax);
      let y0 = sy(ay);

      for (let j = 1; j <= subdivisions && work < limit; j++) {
        const u = j / subdivisions;
        const v = 1 - u;
        const x1 = sx(v * v * ax + 2 * v * u * bx + u * u * cx);
        const y1 = sy(v * v * ay + 2 * v * u * by + u * u * cy);

        const m = (j - 0.5) / subdivisions;
        const n = 1 - m;
        const time = n * n * at + 2 * n * m * bt + m * m * ct;
        const gain = n * n * ag + 2 * n * m * bg + m * m * cg;
        const age = clamp(1 - (trailClock - time) / TRAIL_KEEP, 0, 1);
        const budgetFade = Math.min(1, (limit - work) / 16);
        const a = 0.18 * lan.intensity * gain * age * age * budgetFade;
        const width = Math.max(
          0.5,
          0.55 * lan.r * zoom * (0.12 + 0.88 * age)
        );

        // count attempted subdivisions too, bounding work at extreme zoom.
        work++;
        const dx = x1 - x0;
        const dy = y1 - y0;
        if (a > 1e-5 && dx * dx + dy * dy > 1e-4) {
          const length = Math.hypot(dx, dy);
          const support = Math.max(
            length,
            3 * TRAIL_SPACING,
            2 * width
          );
          const pad = 0.5 * (support / length - 1);
          const energy = a * length / support;

          // overlap radial kernels without adding energy per subdivision.
          emitter.line(
            x0 - dx * pad, y0 - dy * pad,
            x1 + dx * pad, y1 + dy * pad, width,
            WARM[0] * energy, WARM[1] * energy, WARM[2] * energy
          );
        }
        x0 = x1;
        y0 = y1;
      }
    }
  }

  function buildCreatures(): void {
    creatures = createCreatures(doors.slice(0, count), ANCHORS.slice(0, count), interactR);
    greetIdx = -1;
    greetT = 0;
  }

  function resize(): void {
    // the only place layout is read
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const d = Math.min(2, window.devicePixelRatio || 1);
    const worldChanged = w !== vw || Math.abs(h - vh) > vh * 0.2;
    vw = w;
    vh = h;
    dpr = d;
    diag = Math.hypot(vw, vh);
    world.w = vw;
    world.h = vh * 2;
    cam.vw = vw;
    cam.vh = vh;
    interactR = Math.min(vw, vh) * 0.28;
    lanternBaseR = Math.min(vw, vh) * 0.055;

    overlay.width = Math.round(vw * dpr);
    overlay.height = Math.round(vh * dpr);
    if (ctx2d !== null) {
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.font = FONT;
      ctx2d.textBaseline = "middle";
    }
    if (fluid !== null) fluid.resize(vw, vh, dpr);

    if (worldChanged || creatures.length === 0) {
      // creature radius is readonly by contract, so a real geometry change rebuilds them
      buildCreatures();
    }
    lan.x = clamp(lan.x, 0, world.w);
    lan.y = clamp(lan.y, 0, world.h);
    camYState = clamp(camYState, 0, world.h - vh);
    invalidateSceneContinuity();
  }

  // ─── loop control ─────────────────────────────────────────────────────────

  function frame(now: number): void {
    if (!running) return;
    raf = window.requestAnimationFrame(frame);
    let dt = (now - lastNow) / 1000;
    lastNow = now;
    if (!(dt > 0)) dt = 1 / 60;
    if (dt > MAX_DT) dt = MAX_DT;
    tick(dt);
  }

  function start(): void {
    if (running || destroyed) return;
    running = true;
    lastNow = performance.now();
    raf = window.requestAnimationFrame(frame);
  }

  function stop(): void {
    if (!running) return;
    running = false;
    window.cancelAnimationFrame(raf);
    raf = 0;
  }

  function onVisibility(): void {
    if (document.visibilityState === "hidden") {
      stop();
    } else if (phase !== "idle" && phase !== "done") {
      start();
    }
  }

  // ─── per-frame simulation ─────────────────────────────────────────────────

  function updateInput(dt: number): void {
    const hasInput = ptrActive || calling || thrustX !== 0 || thrustY !== 0;
    if (hasInput) {
      idleT = 0;
      inputAccum += dt;
    } else {
      idleT += dt;
    }
    const lureTarget = phase === "active" ? clamp((idleT - IDLE_BEFORE_LURE) / LURE_RAMP, 0, 1) : 0;
    // ramp down quickly when input returns, up over LURE_RAMP seconds when idle
    lure = lureTarget > lure ? lureTarget : Math.max(lureTarget, lure - dt * 3);
  }

  function updateLantern(dt: number): void {
    const controllable = phase === "active";
    if (controllable) {
      breath += (breathTarget - breath) * (1 - Math.exp(-12 * dt));
    }

    if (controllable && !reduced) {
      const tx = (ptrX - vw * 0.5) / cam.zoom + cam.camX + vw * 0.5;
      const ty = (ptrY - vh * 0.5) / cam.zoom + cam.camY + vh * 0.5;
    const k = small ? 121 : 132.25;
    const c = small ? 22 : 23; // unit mass: c = 2 * sqrt(k).
    const maxSpeed = small ? 900 : 1200;
    const steps = Math.max(1, Math.ceil(dt * 120));
      const h = dt / steps;

      // critical damping; substeps keep long frames calm.
      for (let i = 0; i < steps; i++) {
        let ax = thrustX * 1100;
        let ay = thrustY * 1100;
        if (ptrActive) {
          ax += (tx - lan.x) * k - lvx * c;
          ay += (ty - lan.y) * k - lvy * c;
        } else {
          const drag = Math.exp(-1.7 * h);
          lvx *= drag;
          lvy *= drag;
        }

        lvx += ax * h;
        lvy += ay * h;
        const v = Math.hypot(lvx, lvy);
        if (v > maxSpeed) {
          lvx *= maxSpeed / v;
          lvy *= maxSpeed / v;
        }
        lan.x += lvx * h;
        lan.y += lvy * h;
      }
    } else if (controllable) {
      // reduced motion: direct, softened follow — no overshoot
      if (ptrActive) {
        const ty = (ptrY - vh * 0.5) + cam.camY + vh * 0.5;
        const f = 1 - Math.exp(-10 * dt);
        lan.x += (ptrX - lan.x) * f;
        lan.y += (ty - lan.y) * f;
      }
      lan.x += thrustX * 700 * dt;
      lan.y += thrustY * 700 * dt;
      lvx = 0;
      lvy = 0;
    }

    // soft walls
    if (lan.x < 0) { lan.x = 0; lvx = Math.abs(lvx) * 0.4; }
    if (lan.x > world.w) { lan.x = world.w; lvx = -Math.abs(lvx) * 0.4; }
    if (lan.y < 0) { lan.y = 0; lvy = Math.abs(lvy) * 0.4; }
    if (lan.y > world.h) { lan.y = world.h; lvy = -Math.abs(lvy) * 0.4; }
    speed = Math.hypot(lvx, lvy);
    lan.r = lanternBaseR * breath;
    lan.intensity = breath * ignite;
  }

  function updateCamera(dt: number): void {
    const range = Math.max(0, world.h - vh);
    let target = camYState;
    let rate = 8;
    if (phase === "diving" && diveIdx >= 0 && !reduced) {
      // camera accelerates toward the chosen creature
      target = creatures[diveIdx].y - vh * 0.5;
      rate = 8 + 16 * clamp(phaseT / DIVE_MS, 0, 1);
    } else {
    const calmTouch = small && phase === "active" && !reduced;
    const half = small ? (calmTouch ? vh * 0.12 : 0) : vh * 0.18;
    if (calmTouch) rate = 6;
    const centre = camYState + vh * 0.5;
      if (lan.y < centre - half) target = lan.y + half - vh * 0.5;
      else if (lan.y > centre + half) target = lan.y - half - vh * 0.5;
    }
    target = clamp(target, 0, range);
    const before = camYState;
    if (phase === "idle") {
      camYState = target;
    } else {
      camYState += (target - camYState) * (1 - Math.exp(-rate * dt));
    }
    camVy = dt > 0 ? (camYState - before) / dt : 0;

    if (!reduced) {
      sway += dt;
      cam.camY = camYState + Math.sin(sway * Math.PI * 2 * 0.1) * 4;
    } else {
      cam.camY = camYState;
    }
    cam.camX = 0;

    if (phase === "diving" && !reduced) {
      const t = clamp(phaseT / DIVE_MS, 0, 1);
      cam.zoom = diveFromZoom + (1.22 - diveFromZoom) * t * t;
    } else if (phase !== "diving") {
      cam.zoom = 1;
    }
  }

  const PROXIMITY_EXIT_FACTOR = 1.25;
  const proximityLatched = new Set<number>();

  function startGreeting(id: (typeof creatures)[number]["id"]): void {
    if (destroyed || phase !== "active") return;
    const idx = findIdx(id);
    if (idx < 0) return;
    proximityLatched.add(idx);
    greetIdx = idx;
    greetT = 0;
    creatures[idx].greet();
  }

  function updateCreatures(dt: number): void {
    ctx.time = activeT;
    ctx.dt = dt;
    ctx.calling = calling && phase === "active";
    ctx.lure = lure;
    if (greetIdx >= 0) greetT += dt;
    nearestIdx = -1;
    nearestDist = Infinity;
    for (let i = 0; i < creatures.length; i++) {
      const c = creatures[i];
      ctx.greeting = i === greetIdx ? greetT : 0;
      c.update(ctx as CreatureContext);
      const d = Math.hypot(c.x - lan.x, c.y - lan.y);
      if (
        phase === "active" &&
        d >= interactR * PROXIMITY_EXIT_FACTOR
      ) {
        proximityLatched.delete(i);
      }
      if (d < interactR && d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    if (greetIdx >= 0 && greetT > 6) greetIdx = -1; // greeting is one-shot; forget it after a while

    if (
      !destroyed &&
      phase === "active" &&
      nearestIdx >= 0 &&
      !proximityLatched.has(nearestIdx)
    ) {
      // Consume this approach even if busy, reduced, or being lured.
      // There is no queue: departure beyond the outer band re-arms it.
      proximityLatched.add(nearestIdx);
      if (greetIdx < 0 && lure === 0 && !ctx.reduced) {
        startGreeting(creatures[nearestIdx].id);
      }
    }
    const id = phase === "active" && nearestIdx >= 0 ? creatures[nearestIdx].id : null;
    if (id !== lastNearestId) {
      lastNearestId = id;
      opts.onNearest(id);
    }
  }

  function emitAll(): void {
    emitter.pointCount = 0;
    emitter.lineCount = 0;
    const view = cam as CameraView;
    for (let i = 0; i < creatures.length; i++) {
      creatures[i].emit(ctx as CreatureContext, view, emitter);
    }

    emitTrail();

    // lantern core: two warm points so the light has a body inside the fluid
    if (lan.intensity > 0.01) {
      const s = lan.r * 0.9;
      emitter.point(lanSx, lanSy, s * 2.2, WARM[0] * 0.45 * lan.intensity, WARM[1] * 0.45 * lan.intensity, WARM[2] * 0.45 * lan.intensity);
      emitter.point(lanSx, lanSy, s * 0.7, 1 * lan.intensity, 0.93 * lan.intensity, 0.8 * lan.intensity);
    }
  }

  function finishPhase(next: Phase): void {
    phase = next;
    phaseStart = performance.now();
    phaseT = 0;
    fired = false;
  }

  function runPhase(): void {
    if (phase === "active") return;

    if (phase === "entering") {
      const dur = reduced ? ENTER_REDUCED : ENTER_MS;
      const rampStart = dur - 0.3;
      ignite = clamp((phaseT - rampStart) / 0.3, 0, 1);
      if (fluid !== null) {
        const gap = reduced ? 0.12 : SPLASH_GAP;
        const total = reduced ? 3 : SPLASH_COUNT;
        while (splashIdx < total && splashIdx * gap <= phaseT) {
          const f = total > 1 ? splashIdx / (total - 1) : 1;
          const r = vw * (0.06 + 0.49 * f);
          const dye = 1.0 + 0.6 * f;
          fluid.splash(chipX, chipY, r, 500, dye, INK);
          splashIdx++;
        }
        const coverAt = reduced ? 0.3 : SPLASH_GAP * SPLASH_COUNT;
        if (!coverDone && phaseT >= coverAt) {
          coverDone = true;
          fluid.splash(chipX, chipY, diag, 500, 2.4, INK);
        }
      }
      if (phaseT >= dur && !fired) {
        fired = true;
        if (fluid !== null) fluid.setMode("abyss");
        ignite = 1;
        activeT = 0;
        finishPhase("active");
        opts.onPhaseDone("entering");
      }
      return;
    }

    if (phase === "leaving") {
      const dur = reduced ? LEAVE_REDUCED : LEAVE_MS;
      if (fluid !== null && !reduced) {
        const t = clamp(phaseT / LEAVE_MS, 0, 1);
        fluid.vortex(chipX, chipY, vw * 0.7, leaveVortexStrength(t, reduced), INK);
      }
      if (phaseT >= dur && !fired) {
        fired = true;
        finishPhase("done");
        opts.onPhaseDone("leaving");
        stop();
      }
      return;
    }

    if (phase === "diving") {
      const dur = reduced ? DIVE_REDUCED : DIVE_MS;
      const c = diveIdx >= 0 ? creatures[diveIdx] : null;
      if (fluid !== null && !reduced && c !== null) {
        const t = clamp(phaseT / DIVE_MS, 0, 1);
        // softer late ramp: the current keeps pulling but stops reading as a blast
        fluid.vortex(sx(c.x), sy(c.y), Math.min(vw, vh) * 0.5, 40 + 120 * t, hues[diveIdx]);
      }
      if (phaseT >= dur && !fired) {
        fired = true;
        const id = c !== null ? c.id : "";
        finishPhase("done");
        opts.onDiveCommit(id);
        stop();
      }
    }
  }

  function tick(dt: number): void {
    const wall = performance.now() / 1000;
    const elapsed = lastTickWall < 0 ? 0 : wall - lastTickWall;
    lastTickWall = wall;

    let continuous =
      motionPrimed &&
      phase === "active" &&
      !reduced &&
      elapsed > 0 &&
      elapsed <= MOTION_GAP;

    prevSx = lanSx;
    prevSy = lanSy;

    updateInput(dt);
    updateLantern(dt);
    updateCamera(dt);
    updateCreatures(dt);
    if (phase === "active") {
      activeT += dt;
    } else {
      phaseT = (performance.now() - phaseStart) / 1000;
    }
    runPhase();

    lanSx = sx(lan.x);
    lanSy = sy(lan.y);

    const motionAllowed = phase === "active" && !reduced;
    if (!motionAllowed) continuous = false;

    // a teleport is not a stroke; also bounds fluid draw calls.
    if (
      continuous &&
      Math.hypot(lanSx - prevSx, lanSy - prevSy) >
        WAKE_SPACING * WAKE_SPLAT_CAP
    ) {
      invalidateSceneContinuity();
      continuous = false;
    }

    if (!continuous) {
      clearTrail();
      wakeOn = false;
      prevSx = lanSx;
      prevSy = lanSy;
    }
    motionPrimed = motionAllowed;

    if (phase !== "active" || elapsed > MOTION_GAP) {
      pickAnchorValid = false;
    }
    if (motionAllowed) recordTrail(continuous ? elapsed : 0);

    emitAll();

    if (fluid !== null) {
      fluid.globalDrift(0, -camVy);
      fluid.setLantern(lanSx, lanSy, lan.intensity);

      if (continuous && dt > 1e-4) {
        const dx = lanSx - prevSx;
        const dy = lanSy - prevSy;
        const distance = Math.hypot(dx, dy);
        const wvx = dx / dt;
        const wvy = dy / dt;
        const wsp = Math.hypot(wvx, wvy);
        wakeOn = wsp > (wakeOn ? WAKE_OFF : WAKE_ON);

        if (wakeOn && distance > 0) {
          const count = Math.max(1, Math.ceil(distance / WAKE_SPACING));
          const weight = 60 * dt / count;
          for (let i = 1; i <= count; i++) {
            const f = i / count;
            fluid.stroke(
              prevSx + dx * f,
              prevSy + dy * f,
              wvx,
              wvy,
              weight
            );
          }
        }
      } else {
        wakeOn = false;
      }

      fluid.step(dt);
      fluid.render(emitter);
      drawOverlay(dt, false);
    } else {
      wakeOn = false;
      drawOverlay(dt, true);
    }
  }

  // ─── overlay (Canvas2D) ───────────────────────────────────────────────────

  let hintAlpha = 0;

  function drawOverlay(dt: number, full: boolean): void {
    const g = ctx2d;
    if (g === null) return;
    if (full) {
      drawDegraded(g);
    } else {
      g.clearRect(0, 0, vw, vh);
    }
    if (phase === "active" || phase === "diving") {
      drawNames(g);
      drawHint(g, dt);
    }
    if (phase === "active") drawPickCue(g);
    if (full) drawDegradedDisc(g);
  }

  function pickRadius(touch: boolean, zoom: number): number {
    return Math.max(
      touch ? 24 : 18,
      interactR * (touch ? 0.65 : 0.45) * zoom
    );
  }

  function markPickAnchor(touch?: boolean): void {
    pickAnchorValid = false;
    pickTouch = touch ?? small;
    if (phase !== "active") return;

    for (let i = 0; i < creatures.length; i++) {
      pickAnchorX[i] = sx(creatures[i].x);
      pickAnchorY[i] = sy(creatures[i].y);
    }
    pickAnchorZoom = cam.zoom;
    pickAnchorTime = performance.now();
    pickAnchorValid = true;
  }

  function pickAt(px: number, py: number, touch: boolean): string | null {
    pickTouch = touch;
    const age = performance.now() - pickAnchorTime;
    const anchored =
      pickAnchorValid &&
      age >= 0 &&
      age <= PICK_ANCHOR_MS;
    pickAnchorValid = false;

    if (
      phase !== "active" ||
      !Number.isFinite(px) ||
      !Number.isFinite(py)
    ) return null;

    const r = pickRadius(touch, cam.zoom);
    const ar = pickRadius(touch, pickAnchorZoom);
    const r2 = r * r;
    const ar2 = ar * ar;
    let best = -1;
    let bestD2 = Infinity;

    for (let i = 0; i < creatures.length; i++) {
      const c = creatures[i];
      const dx = sx(c.x) - px;
      const dy = sy(c.y) - py;
      const currentD2 = dx * dx + dy * dy;
      let d2 = currentD2 <= r2 ? currentD2 : Infinity;

      if (anchored) {
        const ax = pickAnchorX[i] - px;
        const ay = pickAnchorY[i] - py;
        const anchorD2 = ax * ax + ay * ay;
        if (anchorD2 <= ar2 && anchorD2 < d2) d2 = anchorD2;
      }

      if (d2 < bestD2) {
        bestD2 = d2;
        best = i;
      }
    }
    return best < 0 ? null : creatures[best].id;
  }

  function drawNames(g: CanvasRenderingContext2D): void {
    for (let i = 0; i < creatures.length; i++) {
      const c = creatures[i];
      const near = i === nearestIdx && nearestDist < interactR * 1.6;
      if (c.glow <= 0.25 && !near) continue;
      const x = sx(c.x);
      const y = sy(c.y) + c.radius * 0.55 * cam.zoom + 14;
      if (x < -200 || x > vw + 200 || y < -40 || y > vh + 40) continue;
      // only the nearest creature's label may be fully opaque; others cap at 0.7
      const a = near ? 1 : Math.min(0.7, clamp((c.glow - 0.25) / 0.35, 0, 1));
      g.globalAlpha = a;
      g.textAlign = "left";
      const tx = x + 8;
      // ONE crisp draw; ink drop-shadow via the canvas shadow API (never reads as doubled text)
      g.shadowColor = INK_CSS;
      g.shadowOffsetX = 1;
      g.shadowOffsetY = 1;
      g.shadowBlur = 0;
      g.fillStyle = hueCss[i];
      g.fillText(names[i], tx, y);
      g.shadowColor = "transparent";
      g.shadowOffsetX = 0;
      g.shadowOffsetY = 0;
      g.beginPath();
      g.arc(x, y, 1.5, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  function drawPickCue(g: CanvasRenderingContext2D): void {
    if (phase !== "active" || lan.intensity <= 0.01) return;

    const r = pickRadius(pickTouch ?? small, cam.zoom);
    let best = -1;
    let bestD2 = r * r;

    for (let i = 0; i < creatures.length; i++) {
      const dx = sx(creatures[i].x) - lanSx;
      const dy = sy(creatures[i].y) - lanSy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= bestD2) {
        bestD2 = d2;
        best = i;
      }
    }
    if (best < 0) return;

    const c = creatures[best];
    const x = sx(c.x);
    const y = sy(c.y);
    const cueR = Math.max(8, Math.min(r * 0.7, c.radius * cam.zoom * 0.8));
    if (
      x < -cueR || x > vw + cueR ||
      y < -cueR || y > vh + cueR
    ) return;

    // two quiet brackets; no pulse and no pointer-space halo.
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = 0.3 * lan.intensity;
    g.strokeStyle = PICK_CUE_CSS;
    g.lineWidth = 1;
    g.lineCap = "round";
    g.shadowColor = "transparent";

    g.beginPath();
    g.arc(x, y, cueR, -0.7, 0.7);
    g.stroke();
    g.beginPath();
    g.arc(x, y, cueR, Math.PI - 0.7, Math.PI + 0.7);
    g.stroke();

    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    g.lineCap = "butt";
  }

  function drawHint(g: CanvasRenderingContext2D, dt: number): void {
    const want = inputAccum < HINT_INPUT_NEEDED && phase === "active" && activeT > 0.4 ? 1 : 0;
    const rate = want > hintAlpha ? 1.6 : 1.0;
    hintAlpha += (want - hintAlpha) * (1 - Math.exp(-rate * dt));
    if (hintAlpha < 0.01) return;
    g.globalAlpha = hintAlpha;
    g.textAlign = "center";
    g.fillStyle = PAPER_CSS;
    g.fillText("drag the light — find the seven", vw * 0.5, vh - 28);
    g.globalAlpha = 1;
  }

  // ─── degraded renderer (no webgl) ─────────────────────────────────────────

  function drawDegraded(g: CanvasRenderingContext2D): void {
    g.globalAlpha = 1;
    g.fillStyle = ABYSS_CSS;
    g.fillRect(0, 0, vw, vh);
    if (phase !== "active" && phase !== "diving") return;

    // creatures via the same emissive arrays
    g.globalCompositeOperation = "lighter";
    const pts = emitter.points;
    for (let i = 0; i < emitter.pointCount; i++) {
      const o = i * 6;
      const x = pts[o];
      const y = pts[o + 1];
      const s = pts[o + 2];
      if (s <= 0 || x < -s || x > vw + s || y < -s || y > vh + s) continue;
      const grad = g.createRadialGradient(x, y, 0, x, y, s);
      grad.addColorStop(0, `rgba(${Math.round(pts[o + 3] * 255)},${Math.round(pts[o + 4] * 255)},${Math.round(pts[o + 5] * 255)},0.9)`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, s, 0, Math.PI * 2);
      g.fill();
    }
    const ln = emitter.lines;
    g.lineCap = "round";
    for (let i = 0; i < emitter.lineCount; i++) {
      const o = i * 8;
      g.strokeStyle = `rgba(${Math.round(ln[o + 5] * 255)},${Math.round(ln[o + 6] * 255)},${Math.round(ln[o + 7] * 255)},0.7)`;
      g.lineWidth = Math.max(0.5, ln[o + 4]);
      g.beginPath();
      g.moveTo(ln[o], ln[o + 1]);
      g.lineTo(ln[o + 2], ln[o + 3]);
      g.stroke();
    }

    // lantern glow: layered warm radial arcs
    if (lan.intensity > 0.01) {
      const R = lan.r * cam.zoom;
      const I = lan.intensity;
      const outer = g.createRadialGradient(lanSx, lanSy, 0, lanSx, lanSy, R * 6);
      outer.addColorStop(0, cssOf(WARM, 0.35 * I));
      outer.addColorStop(0.4, cssOf(WARM, 0.12 * I));
      outer.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = outer;
      g.beginPath();
      g.arc(lanSx, lanSy, R * 6, 0, Math.PI * 2);
      g.fill();
      const mid = g.createRadialGradient(lanSx, lanSy, 0, lanSx, lanSy, R * 2.2);
      mid.addColorStop(0, cssOf(WARM, 0.8 * I));
      mid.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = mid;
      g.beginPath();
      g.arc(lanSx, lanSy, R * 2.2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = `rgba(255,244,214,${0.95 * I})`;
      g.beginPath();
      g.arc(lanSx, lanSy, R * 0.5, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = "source-over";
  }

  function drawDegradedDisc(g: CanvasRenderingContext2D): void {
    let t = -1;
    let x = chipX;
    let y = chipY;
    let color = "#000000";
    if (phase === "entering") {
      const dur = reduced ? ENTER_REDUCED : DEGRADED_DISC;
      t = clamp(phaseT / dur, 0, 1);
    } else if (phase === "leaving") {
      const dur = reduced ? LEAVE_REDUCED : DEGRADED_DISC;
      t = clamp(phaseT / dur, 0, 1);
    } else if (phase === "diving") {
      const dur = reduced ? DIVE_REDUCED : DEGRADED_DIVE_DISC;
      t = clamp(phaseT / dur, 0, 1);
      if (diveIdx >= 0) {
        const c = creatures[diveIdx];
        x = sx(c.x);
        y = sy(c.y);
        color = hueCss[diveIdx];
      }
    }
    if (t < 0) return;
    // entering: the disc already covers the screen and shrinks back to the chip,
    // uncovering the realm; leaving/diving: it grows from the source to cover it.
    const e = t * t * (3 - 2 * t);
    const r = phase === "entering" ? (1 - e) * (diag + 8) : e * (diag + 8);
    if (r <= 0) return;
    if (phase === "entering") {
      // ring: everything outside the shrinking disc is uncovered
      g.fillStyle = color;
      g.beginPath();
      g.rect(0, 0, vw, vh);
      g.arc(x, y, Math.max(0, diag + 8 - r), 0, Math.PI * 2, true);
      g.fill("evenodd");
      return;
    }
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  // ─── public api ───────────────────────────────────────────────────────────

  function findIdx(id: string): number {
    for (let i = 0; i < creatures.length; i++) if (creatures[i].id === id) return i;
    return -1;
  }

  function resetForEnter(): void {
    lan.x = vw * 0.5;
    lan.y = vh * 0.1;
    lvx = 0;
    lvy = 0;
    speed = 0;
    ignite = 0;
    breath = 0.75;
    breathTarget = 0.75;
    camYState = 0;
    cam.camY = 0;
    cam.zoom = 1;
    camVy = 0;
    idleT = 0;
    lure = 0;
    splashIdx = 0;
    coverDone = false;

    invalidateSceneContinuity();
    lastTickWall = -1;
    pickTouch = null;

    hintAlpha = 0;
    activeT = 0;
    lastNearestId = null;
    lanSx = sx(lan.x);
    lanSy = sy(lan.y);
    prevSx = lanSx;
    prevSy = lanSy;
  }

  const scene: RealmScene = {
    startEnter(cx, cy) {
      if (destroyed || (phase !== "idle" && phase !== "done")) return;
      chipX = cx;
      chipY = cy;
      resize();
      resetForEnter();
      if (fluid !== null) fluid.setMode("ink");
      finishPhase("entering");
      start();
    },

    startLeave(cx, cy) {
      if (destroyed || phase !== "active") return;
      chipX = cx;
      chipY = cy;
      ptrActive = false;
      calling = false;
      invalidateSceneContinuity();
      if (lastNearestId !== null) {
        lastNearestId = null;
        opts.onNearest(null);
      }
      finishPhase("leaving");
      start();
    },

    startDive(id) {
      if (destroyed || phase !== "active") return;
      const idx = findIdx(id);
      if (idx < 0) return;
      diveIdx = idx;
      diveFromZoom = cam.zoom;
      ptrActive = false;
      calling = false;
      invalidateSceneContinuity();
      finishPhase("diving");
      start();
    },

    startGreeting(id) {
      // delegate to the shared entry point so selection and proximity
      // arbitration (the latch set) stay single-sourced
      startGreeting(id);
    },

    setPointer(x, y, active) {
      ptrX = x;
      ptrY = y;
      ptrActive = active;
    },

    setThrust(x, y) {
      thrustX = clamp(x, -1, 1);
      thrustY = clamp(y, -1, 1);
    },

    setCalling(c) {
      calling = c;
      if (c) idleT = 0;
    },

    markPickAnchor(touch) {
      markPickAnchor(touch);
    },

    pickAt(px, py, touch) {
      return pickAt(px, py, touch);
    },

    lightRadius() {
      return lan.r * cam.zoom;
    },

    breatheLight(dir) {
      if (phase !== "active" || !Number.isFinite(dir) || dir === 0) return;
      const d = dir < 0 ? -1 : 1;
      breathTarget = clamp(breathTarget + d * 0.08, 0.35, 1.0);
      idleT = 0;
    },

    warpTo(index) {
      if (phase !== "active") return;
      const i = Math.trunc(index);
      if (i < 0 || i >= creatures.length) return;
      const c = creatures[i];
      lan.x = clamp(c.x, 0, world.w);
      lan.y = clamp(c.y - interactR * 0.6, 0, world.h);
      lvx = 0;
      lvy = 0;
      camYState = clamp(lan.y - vh * 0.5, 0, Math.max(0, world.h - vh));
      cam.camY = camYState;
      camVy = 0;
      lanSx = sx(lan.x);
      lanSy = sy(lan.y);
      prevSx = lanSx;
      prevSy = lanSy;
      invalidateSceneContinuity();
      idleT = 0;
    },

    nearestId() {
      return lastNearestId;
    },

    audioSnapshot() {
      snapshot.speed = clamp(speed / 1200, 0, 1);
      snapshot.nearest = nearestIdx >= 0 ? clamp(1 - nearestDist / interactR, 0, 1) : 0;
      for (let i = 0; i < voices.length; i++) {
        const v = voices[i];
        const c = i < creatures.length ? creatures[i] : null;
        if (c === null) {
          v.pan = 0;
          v.gain = 0;
          continue;
        }
        const d = Math.hypot(c.x - lan.x, c.y - lan.y);
        const prox = clamp(1 - d / (interactR * 3), 0, 1);
        v.pan = clamp((sx(c.x) / vw) * 2 - 1, -1, 1);
        v.gain = clamp(prox * prox * (0.35 + 0.65 * c.glow) * ignite, 0, 1);
      }
      return snapshot;
    },

    frameMeanMs() {
      return fluid !== null ? fluid.frameMeanMs() : 0;
    },

    qualityLevel() {
      // −1 sentinel: the fluid engine is unavailable, the overlay canvas is the
      // whole render — the shell must not css-fade it during exit (the scene
      // draws its own disc transition instead).
      return fluid !== null ? fluid.qualityLevel() : -1;
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      phase = "done";
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (fluid !== null) fluid.dispose();
      if (ctx2d !== null) ctx2d.clearRect(0, 0, vw, vh);
    },
  };

  // ─── boot ─────────────────────────────────────────────────────────────────

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);
  resize();
  resetForEnter();

  return scene;
}
