// realm-creatures.ts — "The Deep", module 3 of 3: the bioluminescent organisms.
// architecture: primitive utils, the common creature law, seven species, emitter/factory.
// regularized anchor-relative lean removes coincidence feedback; bounded local clocks,
// eased scatter and time-based dodges survive throttled frames without catch-up jumps.
// persistent hue-led cores and restrained breathing auras improve idle recognition.
// dense effects budget their overlap instead of stacking into white knots.
// update/emit allocate nothing; the renderer and public contracts remain unchanged.

const TAU = Math.PI * 2;

// -- layer 1: utilities (primitives in, primitives out, zero allocation) ----------------

function clamp(v: number, a: number, b: number): number { return v < a ? a : v > b ? b : v; }
function smooth(t: number): number { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

// mulberry-flavoured hash: deterministic pseudo-random keyed by an integer seed
function rnd(s: number): number {
  let t = (s + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// parse #rrggbb (or #rgb) into a 0..1 triple for the readonly hue field (construction only)
function parseHex(hex: string): readonly [number, number, number] {
  let h = hex.trim();
  if (h.charCodeAt(0) === 35) h = h.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16) | 0;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// -- contract types (verbatim) ----------------------------------------------------------

export interface CameraView { readonly camX: number; readonly camY: number; readonly zoom: number;
  readonly vw: number; readonly vh: number }
export interface CreatureContext {
  readonly time: number; readonly dt: number;      // time = seconds since active phase began
  readonly lantern: { readonly x: number; readonly y: number; readonly r: number; readonly intensity: number }; // world px
  readonly world: { readonly w: number; readonly anchorH: number; readonly deep: number; readonly h: number };
  readonly calling: boolean; readonly lure: number;  // lure = 0..1 idle-call ramp
  readonly reduced: boolean; readonly greeting: number;  // 0 = idle; else seconds since greet() started
}
export interface RealmCreature {
  readonly id: string;
  readonly hue: readonly [number, number, number];  // 0..1, parsed from the door hex
  x: number; y: number;                             // live anchor, world px
  readonly radius: number;                          // interact radius, world px (scene sets it)
  glow: number;                                     // 0..1 excitement — scene reads it for approach/audio
  update(c: CreatureContext): void;
  emit(c: CreatureContext, cam: CameraView, out: Emitter): void;
  greet(): void;
}

// -- layer 2: base creature (the common law) --------------------------------------------

abstract class Creature implements RealmCreature {
  readonly id: string;
  readonly hue: readonly [number, number, number];
  readonly radius: number;
  x = 0; y = 0; glow = 0;

  protected ax = 0; protected ay = 0;
  protected cx = 0; protected cy = 0;
  protected fx: number; protected fy: number;
  protected seed: number;
  protected leanSign = 1;
  // material prominence multiplier (owner 2026-09-21: creatures blend into
  // the star field, worst on mobile DPR) — species that need presence set it.
  protected prom = 1;
  protected breath = 0.5;
  protected step = 0;
  protected motionTime = 0;
  protected greetTime = 0;
  protected discontinuity = false;

  private placed = false;
  private prevGreet = 0;
  private prevSceneTime = 0;
  private breathTime = 0;
  private readonly inkScale: number;

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number,
    radius: number, seed: number) {
    this.id = id; this.hue = hue; this.radius = radius;
    this.fx = fx; this.fy = fy; this.seed = seed;
    this.inkScale = clamp(radius / 180, 0.68, 1.25);
  }

  greet(): void { /* one-shot primed; the scene drives the clock via context.greeting */ }

  update(c: CreatureContext): void {
    // discard hidden-tab catch-up; never let a scene clock reset reposition a body.
    this.step = Number.isFinite(c.dt) ? clamp(c.dt, 0, 0.05) : 0;
    this.discontinuity = !this.placed || !Number.isFinite(c.dt)
      || c.dt <= 0 || c.dt > 0.1 || c.time < this.prevSceneTime;
    this.prevSceneTime = c.time;

    const nax = this.fx * c.world.w, nay = this.fy * c.world.anchorH;
    if (!this.placed) {
      this.ax = nax; this.ay = nay;
      this.cx = nax; this.cy = nay; this.x = nax; this.y = nay;
      this.placed = true;
      this.placeStart(c);
    } else if (nax !== this.ax || nay !== this.ay) {
      // resize changes geography, not local motion; translate world-space caches too.
      const sx = nax - this.ax, sy = nay - this.ay;
      this.ax = nax; this.ay = nay;
      this.cx += sx; this.cy += sy; this.x += sx; this.y += sy;
      this.shiftState(sx, sy);
      this.discontinuity = true;
    }

    const r = Math.max(this.radius, 1e-4);
    const dist = Math.hypot(c.lantern.x - this.x, c.lantern.y - this.y);
    const prox = smooth(1 - dist / r);
    let target = prox * c.lantern.intensity;
    if (c.calling) target = Math.max(target, (0.35 + 0.5 * prox) * smooth(prox));
    target = clamp(target + c.lure * 0.15, 0, 1);
    const rate = target > this.glow ? 6 : 1.2;
    this.glow = clamp(this.glow + (target - this.glow)
      * (1 - Math.exp(-rate * this.step)), 0, 1);

    // anchor-relative direction has no moving-body feedback. the finite core gives
    // a smooth vector field through coincidence, rather than a noisy unit vector.
    const dx = c.lantern.x - this.ax, dy = c.lantern.y - this.ay;
    const core = Math.max(12, r * 0.22);
    const den = Math.hypot(dx, dy, core);
    const callRamp = c.calling ? clamp(this.glow / 0.6, 0, 1) : 0;
    const lean = clamp(c.lure * 0.5 + callRamp * 0.18 + this.glow * 0.32, 0, 1)
      * r * 0.24 * this.leanSign;
    const k = 1 - Math.exp(-3.8 * this.step);
    if (c.reduced) {
      this.cx = this.ax; this.cy = this.ay;
    } else {
      this.cx += (this.ax + dx / den * lean - this.cx) * k;
      this.cy += (this.ay + dy / den * lean - this.cy) * k;
      this.motionTime += this.step;
    }
    this.breathTime += this.step;
    this.breath = 0.5 + 0.5 * Math.sin(this.breathTime * 1.6 + this.seed);

    // consume only elapsed greeting time actually presented to this simulation.
    // snapshots are valid even when greeting begins on the first update.
    const rawGreet = Number.isFinite(c.greeting) ? Math.max(0, c.greeting) : 0;
    if (rawGreet > 0) {
      if (this.prevGreet === 0 || rawGreet < this.prevGreet) {
        this.greetTime = Math.max(1e-4, Math.min(rawGreet, this.step));
        this.greetStart(c);
      } else {
        this.greetTime += Math.min(this.step, Math.max(0, rawGreet - this.prevGreet));
      }
    } else this.greetTime = 0;
    this.prevGreet = rawGreet;

    this.updateMotion(c);
    // every species reports its bounded centre; kitty places and records through
    // placeLive() so its body, trail, label and interaction position agree.
  }

  emit(c: CreatureContext, cam: CameraView, out: Emitter): void {
    if (this.culled(cam)) return;
    const pulse = this.redPulse(c);
    // a local locator, not a region-sized fog bank; deliberately almost pure door hue.
    this.dot(cam, out, this.x, this.y,
      clamp(this.radius * 0.16, 16, 32) * (0.94 + this.breath * 0.1),
      0.015, clamp((0.10 + this.breath * 0.035 + this.glow * 0.055 + pulse * 0.04) * this.prom, 0, 1));
    this.emitBody(c, cam, out);
  }

  protected redPulse(_c: CreatureContext): number {
    // one pulse, not a repeating half-wave during a long greeting.
    return this.greetTime > 0 && this.greetTime < Math.PI / 3.2
      ? Math.sin(this.greetTime * 3.2) : 0;
  }

  protected placeLive(wx: number, wy: number): void {
    const dx = wx - this.ax, dy = wy - this.ay, d = Math.hypot(dx, dy);
    const r = Math.max(0, this.radius), knee = r * 0.8, span = r * 0.2;
    if (d > knee && d > 0) {
      // continuous value and slope at the knee; asymptotically inside the leash.
      const extra = d - knee;
      const bounded = span > 0 ? knee + span * extra / (span + extra) : 0;
      this.x = this.ax + dx * bounded / d;
      this.y = this.ay + dy * bounded / d;
    } else {
      this.x = wx; this.y = wy;
    }
  }

  private culled(cam: CameraView): boolean {
    const hw = cam.vw * 0.5, hh = cam.vh * 0.5;
    const sx = (this.ax - cam.camX - hw) * cam.zoom + hw;
    const sy = (this.ay - cam.camY - hh) * cam.zoom + hh;
    // forest's last greeting ring is the largest transient footprint.
    const fp = this.radius * cam.zoom * 2.1 + 200;
    return sx < -fp || sx > cam.vw + fp || sy < -fp || sy > cam.vh + fp;
  }

  // world->screen point; size is a world radius, adjusted for small-screen legibility.
  protected dot(cam: CameraView, out: Emitter, wx: number, wy: number, size: number,
    white: number, a: number): void {
    const h = this.hue, w = clamp(white, 0, 0.38);
    const r = h[0] + (1 - h[0]) * w, g = h[1] + (1 - h[1]) * w, b = h[2] + (1 - h[2]) * w;
    const hw = cam.vw * 0.5, hh = cam.vh * 0.5;
    const sx = (wx - cam.camX - hw) * cam.zoom + hw, sy = (wy - cam.camY - hh) * cam.zoom + hh;
    out.point(sx, sy, size * this.inkScale * cam.zoom, r * a, g * a, b * a);
  }

  protected seg(cam: CameraView, out: Emitter, x1: number, y1: number, x2: number, y2: number,
    width: number, white: number, a: number): void {
    const h = this.hue, w = clamp(white, 0, 0.38);
    const r = h[0] + (1 - h[0]) * w, g = h[1] + (1 - h[1]) * w, b = h[2] + (1 - h[2]) * w;
    const hw = cam.vw * 0.5, hh = cam.vh * 0.5;
    const sx1 = (x1 - cam.camX - hw) * cam.zoom + hw, sy1 = (y1 - cam.camY - hh) * cam.zoom + hh;
    const sx2 = (x2 - cam.camX - hw) * cam.zoom + hw, sy2 = (y2 - cam.camY - hh) * cam.zoom + hh;
    // width is the full line width, not the half-width.
    out.line(sx1, sy1, sx2, sy2, width * this.inkScale * cam.zoom, r * a, g * a, b * a);
  }

  protected placeStart(_c: CreatureContext): void { /* optional first-placement hook */ }
  protected shiftState(_dx: number, _dy: number): void { /* optional world-cache translation */ }
  protected greetStart(_c: CreatureContext): void { /* optional snapshot hook */ }
  protected abstract updateMotion(c: CreatureContext): void;
  protected abstract emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void;
}

// -- layer 3: the creatures -------------------------------------------------------------

// 1. raft-cluster — five orbiting nodes, elected leader, laggard and commit pulse.
//    greeting — "term n+1": the visit kills the leader; followers race seeded
//    countdowns, three vote beads elect a candidate (quorum whiteout on the 2nd),
//    a one-frame 72° term jump promotes it permanently, three replication rounds
//    brighten the committed cluster, one 60ms flash hands back to idle. visuals
//    derive statelessly from greetTime; idle paths stay byte-equivalent.
//    budget: 18 points, 5 lines idle (greet transient ≤28 points, 10 lines).
class RaftCreature extends Creature {
  private readonly N = 5;
  private ang = new Float32Array(this.N);
  private base = new Float32Array(this.N);
  private nx = new Float32Array(this.N);
  private ny = new Float32Array(this.N);
  private gsx = new Float32Array(this.N);
  private gsy = new Float32Array(this.N);
  private leader = 0; private laggard = 4;
  private hb = 0; private commit = 0;
  private scatter = 0; private scatterDrive = 0;
  private reelect = false;
  private prevLx = 0; private prevLy = 0;
  private lanternSample = false;
  private cd = new Float32Array(5);    // per-node seeded election countdowns (s)
  private cand = 0;                    // elected candidate (chosen once in greetStart)
  private flareT = 0.3;                // candidate flare time = min countdown (s)
  private swapDone = false;            // 1.3s permanent leader promotion applied
  private repl = 0;                    // log-replication round 0..3 (brightness notch)

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    for (let i = 0; i < this.N; i++) {
      this.base[i] = (i / this.N) * TAU; this.ang[i] = this.base[i];
    }
    this.hb = rnd(s) * 2.2;
  }

  protected placeStart(_c: CreatureContext): void {
    for (let i = 0; i < this.N; i++) {
      this.nx[i] = this.ax + Math.cos(this.base[i]) * this.radius * 0.42;
      this.ny[i] = this.ay + Math.sin(this.base[i]) * this.radius * 0.42;
      this.gsx[i] = this.nx[i]; this.gsy[i] = this.ny[i];
    }
  }

  protected shiftState(dx: number, dy: number): void {
    for (let i = 0; i < this.N; i++) {
      this.nx[i] += dx; this.ny[i] += dy;
      this.gsx[i] += dx; this.gsy[i] += dy;
    }
  }

  protected greetStart(_c: CreatureContext): void {
    this.swapDone = false;
    this.repl = 0;
    let best = 1e9, cand = this.leader;
    for (let i = 0; i < this.N; i++) {
      this.gsx[i] = this.nx[i]; this.gsy[i] = this.ny[i];
      if (i === this.leader) { this.cd[i] = 1e9; continue; }
      // seeded countdown 0.18..0.48s; laggard handicapped so it never wins
      let t = 0.18 + rnd((this.seed + i * 7 + 3) | 0) * 0.30;
      if (i === this.laggard) t += 0.6;
      this.cd[i] = t;
      if (t < best) { best = t; cand = i; }
    }
    this.cand = cand;
    this.flareT = best;
  }

  protected updateMotion(c: CreatureContext): void {
    const rr = this.radius * 0.42;
    const validSpeed = this.lanternSample && !this.discontinuity && !c.reduced;
    const lspd = validSpeed
      ? Math.hypot(c.lantern.x - this.prevLx, c.lantern.y - this.prevLy) / c.dt : 0;
    this.prevLx = c.lantern.x; this.prevLy = c.lantern.y;
    this.lanternSample = !c.reduced;

    if (c.reduced) {
      this.scatter = 0; this.scatterDrive = 0; this.reelect = false; this.commit = 0;
      for (let i = 0; i < this.N; i++) {
        this.ang[i] = this.base[i];
        this.nx[i] = this.ax + Math.cos(this.base[i]) * rr;
        this.ny[i] = this.ay + Math.sin(this.base[i]) * rr;
      }
      this.x = this.ax; this.y = this.ay;
      return;
    }

    const g = this.greetTime;

    if (g === 0) {
      // ---- idle path: byte-equivalent to the original ----
      if (lspd > 900
        && Math.hypot(c.lantern.x - this.cx, c.lantern.y - this.cy) < this.radius) {
        this.scatterDrive = 1;
        this.reelect = true;
      }
      this.scatterDrive = Math.max(0, this.scatterDrive - this.step * 0.6);
      this.scatter += (this.scatterDrive - this.scatter) * (1 - Math.exp(-5 * this.step));
      if (this.reelect && this.scatterDrive < 0.25 && this.scatter < 0.3) {
        this.leader = (this.leader + 1) % this.N;
        if (this.leader === this.laggard) this.leader = (this.leader + 1) % this.N;
        this.reelect = false;
      }
      this.hb += this.step;
      if (this.hb >= 2.2) { this.hb -= 2.2; this.commit = 1e-4; }
      if (this.commit > 0) {
        this.commit += this.step * 1.6;
        if (this.commit > this.N) this.commit = 0;
      }
      const settle = 1 - Math.exp(-9 * this.step);
      for (let i = 0; i < this.N; i++) {
        this.ang[i] += this.step * 0.5 * (i === this.laggard ? 0.6 : 1);
        const spread = this.scatter * (0.10 + rnd((this.seed + i) | 0) * 0.16) * this.radius;
        const ox = this.cx + Math.cos(this.ang[i]) * (rr + spread);
        const oy = this.cy + Math.sin(this.ang[i]) * (rr + spread);
        this.nx[i] += (ox - this.nx[i]) * settle;
        this.ny[i] += (oy - this.ny[i]) * settle;
      }
      this.x = this.cx; this.y = this.cy;
      return;
    }

    // ---- greet: 3.6s Raft election choreography (stateless in greetTime) ----
    // idle election triggers stay parked; heartbeat/commit frozen during greet
    this.scatterDrive = Math.max(0, this.scatterDrive - this.step * 0.6);
    this.scatter += (0 - this.scatter) * (1 - Math.exp(-5 * this.step));
    this.reelect = false;

    // followers race their seeded countdowns
    for (let i = 0; i < this.N; i++)
      if (this.cd[i] > 0) this.cd[i] = Math.max(0, this.cd[i] - this.step);

    // one-frame promotion at 1.3s: angle jump + PERMANENT leader swap
    if (!this.swapDone && g >= 1.3) {
      for (let i = 0; i < this.N; i++) this.ang[i] += TAU / 5;
      this.leader = this.cand;
      this.swapDone = true;
    }

    // log-replication round 0..3 (drives stepwise brightness notch)
    this.repl = g < 1.75 ? 0
      : g >= 2.9 ? 3
      : clamp(Math.floor((g - 1.75) / 0.32) + 1, 0, 3);

    // positions: hold cluster ring, keep orbiting so idle resumes on-phase
    const settle = 1 - Math.exp(-9 * this.step);
    for (let i = 0; i < this.N; i++) {
      this.ang[i] += this.step * 0.5 * (i === this.laggard ? 0.6 : 1);
      const ox = this.cx + Math.cos(this.ang[i]) * rr;
      const oy = this.cy + Math.sin(this.ang[i]) * rr;
      this.nx[i] += (ox - this.nx[i]) * settle;
      this.ny[i] += (oy - this.ny[i]) * settle;
    }
    this.x = this.cx; this.y = this.cy;
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    if (c.reduced) {
      // ---- held RESULT diagram: leader + 2 quorum rings + 3 static vote chords ----
      const L = this.leader;
      let k = 0;
      for (let i = 0; i < this.N && k < 3; i++) {
        if (i === L || i === this.laggard) continue;
        this.seg(cam, out, this.nx[i], this.ny[i], this.nx[L], this.ny[L], 1.6, 0.18, 0.46);
        k++;
      }
      this.dot(cam, out, this.nx[L], this.ny[L], clamp(this.radius * 0.10, 12, 22), 0.30, 0.22);
      this.dot(cam, out, this.nx[L], this.ny[L], clamp(this.radius * 0.16, 18, 34), 0.30, 0.15);
      this.dot(cam, out, this.nx[L], this.ny[L], 7.5, 0.3, 0.82);
      return;
    }

    const g = this.greetTime;

    if (g === 0) {
      // ---- idle emit: byte-equivalent to the original ----
      this.dot(cam, out, this.x, this.y, 4.8, 0.12,
        0.34 + this.breath * 0.08 + this.glow * 0.16);
      for (let i = 0; i < this.N; i++) {
        const k = (i + 1) % this.N;
        const near = this.commit > 0 ? clamp(1 - Math.abs(this.commit - (i + 0.5)), 0, 1) : 0;
        this.seg(cam, out, this.nx[i], this.ny[i], this.nx[k], this.ny[k],
          1.9, 0.08 + near * 0.22, 0.25 + near * 0.32 + this.glow * 0.12);
      }
      for (let i = 0; i < this.N; i++) {
        const isLead = i === this.leader, isLag = i === this.laggard;
        let br = isLead ? 0.86 : isLag ? 0.43 : 0.68;
        br += clamp(1 - Math.abs((this.commit || -9) - i), 0, 1) * 0.25;
        br = clamp(br + this.glow * 0.18 + this.redPulse(c) * 0.2, 0, 1);
        this.dot(cam, out, this.nx[i], this.ny[i], isLead ? 7.5 : 5.6,
          isLead ? 0.3 : 0.15, 0.82 * br);
        this.dot(cam, out, this.nx[i], this.ny[i], isLead ? 14 : 10, 0.015, 0.19 * br);
        if (isLead) for (let t = 0; t < 6; t++) {
          const a = (t / 6) * TAU + this.motionTime * 0.8;
          const halo = clamp(this.radius * 0.085, 12, 19);
          this.dot(cam, out, this.nx[i] + Math.cos(a) * halo,
            this.ny[i] + Math.sin(a) * halo, 2.1, 0.22, 0.55);
        }
      }
      return;
    }

    // ---- greet emit: everything derived statelessly from g ----
    const ft = this.flareT;
    const swapped = this.swapDone;
    const slack = clamp(1 - g / 0.35, 0, 1);                        // spokes slack at t=0
    const notch = this.repl / 3;                                    // replication brighten
    const flash = (g >= 2.9 && g < 2.96) ? 1 : 0;                   // 60ms commit flash
    const white = (!swapped && g >= ft + 0.26 && g < ft + 0.294) ? 1 : 0; // 2-frame quorum

    // centre
    this.dot(cam, out, this.x, this.y, 4.8, 0.12,
      0.34 + this.breath * 0.08 + this.glow * 0.16);

    // spokes: slack early, +1 notch per replication round
    for (let i = 0; i < this.N; i++) {
      const k = (i + 1) % this.N;
      this.seg(cam, out, this.nx[i], this.ny[i], this.nx[k], this.ny[k],
        1.9, 0.08 + notch * 0.18, 0.25 - slack * 0.18 + notch * 0.22 + this.glow * 0.12);
    }

    // vote beads in flight + settled chords (voting window, pre-swap)
    if (g >= ft && !swapped) {
      let k = 0;
      for (let i = 0; i < this.N && k < 3; i++) {
        if (i === this.cand || i === this.leader) continue;         // 3 voters
        const arr = k === 2 ? ft + 0.45 : ft + 0.13 * (k + 1);      // 3rd lands late
        const dep = arr - 0.13;                                     // ~130ms flight
        if (g >= arr) {
          this.seg(cam, out, this.nx[i], this.ny[i],
            this.nx[this.cand], this.ny[this.cand], 1.6, 0.16, 0.42);
        } else if (g >= dep) {
          const p = smooth((g - dep) / 0.13);
          this.dot(cam, out,
            this.nx[i] + (this.nx[this.cand] - this.nx[i]) * p,
            this.ny[i] + (this.ny[this.cand] - this.ny[i]) * p, 2.6, 0.24, 0.72);
        }
        k++;
      }
    }

    // hard concentric quorum rings on candidate (one per arrival), fade toward swap
    if (!swapped) {
      let rc = 0;
      if (g >= ft + 0.13) rc = 1;
      if (g >= ft + 0.26) rc = 2;
      if (g >= ft + 0.45) rc = 3;
      const rf = clamp((1.3 - g) / 0.35, 0, 1);
      for (let r = 0; r < rc; r++) {
        const rad = clamp(this.radius * 0.06, 8, 15) * (r + 1.5);
        this.dot(cam, out, this.nx[this.cand], this.ny[this.cand], rad, 0.30, 0.20 * rf);
      }
    }

    // log-replication beads: out-and-back, all followers return same frame on round 3
    if (g >= 1.75 && g < 2.9) {
      const base = g - 1.75;
      const rt = base - Math.floor(base / 0.32) * 0.32;
      const round = clamp(Math.floor(base / 0.32), 0, 2);
      const p = clamp(rt / 0.30, 0, 1);
      const tri = p < 0.5 ? p * 2 : (1 - p) * 2;                    // leader→follower→leader
      const L = this.leader;
      if (round < 2) {
        const fi = (L + 1 + round) % this.N;
        this.dot(cam, out,
          this.nx[L] + (this.nx[fi] - this.nx[L]) * tri,
          this.ny[L] + (this.ny[fi] - this.ny[L]) * tri, 2.6, 0.22, 0.7);
      } else {
        let bk = 0;
        for (let i = 0; i < this.N && bk < 4; i++) {
          if (i === L) continue;
          this.dot(cam, out,
            this.nx[L] + (this.nx[i] - this.nx[L]) * tri,
            this.ny[L] + (this.ny[i] - this.ny[L]) * tri, 2.6, 0.22, 0.7);
          bk++;
        }
      }
    }

    // nodes
    for (let i = 0; i < this.N; i++) {
      const isLead = i === this.leader, isCand = i === this.cand, isLag = i === this.laggard;
      let br: number;
      if (!swapped) {
        if (isLead) br = 0.12;                                      // old leader goes dark
        else if (isCand && g >= ft) br = 0.95;                      // candidate flares
        else br = (isLag ? 0.35 : 0.5) + (1 - clamp(this.cd[i] / 0.5, 0, 1)) * 0.22; // charge
      } else {
        br = isLead ? 0.86 : isLag ? 0.43 : 0.6 + notch * 0.2;      // committed cluster
      }
      br = clamp(br + this.glow * 0.18 + this.redPulse(c) * 0.2 + flash * 0.3, 0, 1);
      const lead = isLead && swapped;
      this.dot(cam, out, this.nx[i], this.ny[i], lead ? 7.5 : 5.6, lead ? 0.3 : 0.15, 0.82 * br);
      this.dot(cam, out, this.nx[i], this.ny[i], lead ? 14 : 10, 0.015, 0.19 * br);
    }

    // whole-cluster whiteout (2nd vote = quorum) / synchronized commit flash
    if (white || flash) {
      this.dot(cam, out, this.cx, this.cy, this.radius * 0.95, 0.38, white ? 0.85 : 0.75);
    }

    // committed-leader halo (after permanent promotion)
    if (swapped) {
      const L = this.leader;
      for (let t = 0; t < 6; t++) {
        const a = (t / 6) * TAU + this.motionTime * 0.8;
        const halo = clamp(this.radius * 0.085, 12, 19);
        this.dot(cam, out, this.nx[L] + Math.cos(a) * halo,
          this.ny[L] + Math.sin(a) * halo, 2.1, 0.22, 0.55);
      }
    }
  }
}

// 2. kitty-run — shy low loops, small hops, pink streak and pointed ears.
//    dodge is a critically damped offset with a cooldown and exit hysteresis.
//    budget: 3 points, 15 lines.
class KittyCreature extends Creature {
  private readonly T = 14;
  private tx = new Float32Array(this.T);
  private ty = new Float32Array(this.T);
  private head = 0; private rec = 0;
  private loop = 0; private loopSpeed = 3.2;
  private hopT = 1.5; private hop = 0; private prevHopG = 0;
  private dodgeX = 0; private dodgeY = 0;
  private dvx = 0; private dvy = 0;
  private dodgeWait = 0; private dodgeArmed = true;
  private trailInit = false;

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    this.leanSign = -1; this.loop = rnd(s) * TAU;
  }

  protected shiftState(dx: number, dy: number): void {
    if (!this.trailInit) return;
    for (let i = 0; i < this.T; i++) { this.tx[i] += dx; this.ty[i] += dy; }
  }

  protected updateMotion(c: CreatureContext): void {
    if (c.reduced) {
      this.x = this.ax; this.y = this.ay;
      this.dodgeX = 0; this.dodgeY = 0; this.dvx = 0; this.dvy = 0;
      this.dodgeWait = 0; this.dodgeArmed = true;
      this.hop = 0; this.hopT = 1.5; this.prevHopG = this.greetTime;
      this.loopSpeed = 3.2;
      this.trailInit = false;
      return;
    }

    const g = this.greetTime, dt = this.step;
    const speed = g > 0 && g < 3 ? 7.2 : 3.2;
    this.loopSpeed += (speed - this.loopSpeed) * (1 - Math.exp(-6 * dt));
    this.loop += dt * this.loopSpeed;
    let px = this.cx + Math.cos(this.loop) * this.radius * 0.40
      + Math.sin(this.motionTime * 3.1 + this.seed) * this.radius * 0.008;
    let py = this.cy + Math.sin(this.loop * 2) * this.radius * 0.16
      + Math.cos(this.motionTime * 2.7 + this.seed) * this.radius * 0.006;

    this.hopT -= dt;
    const gHop = g > 0 && ((this.prevHopG < 3.5 && g >= 3.5)
      || (this.prevHopG < 4.4 && g >= 4.4));
    this.prevHopG = g;
    if ((g === 0 && this.hopT <= 0) || gHop) {
      this.hopT = 1.4 + rnd((this.seed + this.head) | 0) * 1.8;
      this.hop = 1;
    }
    this.hop = Math.max(0, this.hop - dt * 3);
    py -= Math.sin(this.hop * Math.PI) * this.radius * 0.12;

    this.dodgeWait = Math.max(0, this.dodgeWait - dt);
    const lx = this.x - c.lantern.x, ly = this.y - c.lantern.y;
    const ld = Math.hypot(lx, ly);
    if (ld > this.radius * 0.58) this.dodgeArmed = true;
    if (g === 0 && this.dodgeArmed && this.dodgeWait === 0
      && ld < this.radius * 0.36 && dt > 0) {
      const ux = ld > 1e-3 ? lx / ld : Math.cos(this.loop);
      const uy = ld > 1e-3 ? ly / ld : Math.sin(this.loop);
      const side = rnd(this.seed | 0) > 0.5 ? 1 : -1;
      const speedKick = this.radius * 1.35;
      this.dvx += (-uy * side * 0.82 + ux * 0.57) * speedKick;
      this.dvy += (ux * side * 0.82 + uy * 0.57) * speedKick;
      this.dodgeWait = 1.1;
      this.dodgeArmed = false;
    }

    // exact critically damped return to zero: k=49, c=14; velocities are px/s.
    const decay = Math.exp(-7 * dt);
    const bx = this.dvx + 7 * this.dodgeX, by = this.dvy + 7 * this.dodgeY;
    this.dodgeX = (this.dodgeX + bx * dt) * decay;
    this.dodgeY = (this.dodgeY + by * dt) * decay;
    this.dvx = (this.dvx - 7 * bx * dt) * decay;
    this.dvy = (this.dvy - 7 * by * dt) * decay;
    px += this.dodgeX; py += this.dodgeY;
    this.placeLive(px, py);

    if (!this.trailInit) {
      this.trailInit = true; this.rec = 0;
      for (let i = 0; i < this.T; i++) { this.tx[i] = this.x; this.ty[i] = this.y; }
    }
    this.rec += dt;
    // bounded loop: at most two writes with the common 0.05s step cap.
    while (this.rec >= 0.03) {
      this.rec -= 0.03;
      this.tx[this.head] = this.x; this.ty[this.head] = this.y;
      this.head = (this.head + 1) % this.T;
    }
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    if (!c.reduced && this.trailInit) {
      for (let i = 0; i < this.T - 1; i++) {
        const a = (this.head - 1 - i + this.T * 2) % this.T, b = (a - 1 + this.T) % this.T;
        const f = 1 - i / this.T;
        this.seg(cam, out, this.tx[a], this.ty[a], this.tx[b], this.ty[b],
          3.4 * f, 0.06, (0.62 + this.glow * 0.12) * f * f);
      }
    }
    const br = clamp(0.72 + this.glow * 0.2 + this.redPulse(c) * 0.18, 0, 1);
    this.dot(cam, out, this.x, this.y, 7, 0.28, br * 0.85);
    this.dot(cam, out, this.x, this.y, 12, 0.015, br * 0.2);
    const ear = clamp(this.radius * 0.04, 4, 8);
    this.seg(cam, out, this.x - ear, this.y, this.x - ear * 0.65,
      this.y - ear * 1.35, 2.3, 0.14, br * 0.66);
    this.seg(cam, out, this.x + ear, this.y, this.x + ear * 0.65,
      this.y - ear * 1.35, 2.3, 0.14, br * 0.66);
  }
}

// 3. explosion — a breathing knot, returning embers and radial greeting detonation.
//    distributed reduced slots and overlap attenuation prevent a white particle pile.
//    budget: 74 points, 24 lines.
class ExplosionCreature extends Creature {
  private readonly N = 72;
  private ox = new Float32Array(this.N); private oy = new Float32Array(this.N);
  private vx = new Float32Array(this.N); private vy = new Float32Array(this.N);
  private ba = new Float32Array(this.N); private br = new Float32Array(this.N);
  private popT = 1;
  private compression = 1;

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    for (let i = 0; i < this.N; i++) {
      this.ba[i] = rnd((s + i) | 0) * TAU;
      this.br[i] = Math.sqrt(rnd((s + i + 99) | 0));
      this.ox[i] = Math.cos(this.ba[i]) * this.br[i] * r * 0.3;
      this.oy[i] = Math.sin(this.ba[i]) * this.br[i] * r * 0.3;
    }
  }

  protected greetStart(c: CreatureContext): void {
    if (c.reduced) return;
    for (let i = 0; i < this.N; i++) {
      const sp = this.radius * (0.65 + rnd((this.seed + i + 7) | 0) * 0.65);
      this.vx[i] = Math.cos(this.ba[i]) * sp;
      this.vy[i] = Math.sin(this.ba[i]) * sp;
    }
  }

  protected updateMotion(c: CreatureContext): void {
    this.x = this.cx; this.y = this.cy;
    const dt = this.step;
    if (c.reduced) {
      this.compression = 1;
      for (let i = 0; i < this.N; i++) {
        this.ox[i] = Math.cos(this.ba[i]) * this.br[i] * this.radius * 0.3;
        this.oy[i] = Math.sin(this.ba[i]) * this.br[i] * this.radius * 0.3;
        this.vx[i] = 0; this.vy[i] = 0;
      }
      return;
    }
    this.compression += ((c.calling ? 0.72 : 1) - this.compression)
      * (1 - Math.exp(-4 * dt));
    const kk = this.radius * 0.3 * this.compression;
    this.popT -= dt;
    if (this.popT <= 0 && this.greetTime === 0) {
      this.popT = 0.8 + rnd((this.seed + (this.motionTime | 0)) | 0) * 1.4;
      for (let p = 0; p < 3; p++) {
        const i = (rnd((this.seed + p + (this.motionTime * 60 | 0)) | 0) * this.N) | 0;
        this.vx[i] += Math.cos(this.ba[i]) * this.radius * 0.28;
        this.vy[i] += Math.sin(this.ba[i]) * this.radius * 0.28;
      }
    }

    // exact damped spring for a fixed target over this step: k=9, c=3.
    const w = Math.sqrt(6.75), decay = Math.exp(-1.5 * dt);
    const co = Math.cos(w * dt), si = Math.sin(w * dt) / w;
    for (let i = 0; i < this.N; i++) {
      const jig = 1 + Math.sin(this.motionTime * 3 + i) * 0.045;
      const tx = Math.cos(this.ba[i]) * this.br[i] * kk * jig;
      const ty = Math.sin(this.ba[i]) * this.br[i] * kk * jig;
      const ex = this.ox[i] - tx, ey = this.oy[i] - ty;
      const vx = this.vx[i], vy = this.vy[i];
      this.ox[i] = tx + decay * (ex * co + (vx + 1.5 * ex) * si);
      this.oy[i] = ty + decay * (ey * co + (vy + 1.5 * ey) * si);
      this.vx[i] = decay * (vx * co - (1.5 * vx + 9 * ex) * si);
      this.vy[i] = decay * (vy * co - (1.5 * vy + 9 * ey) * si);
    }
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const glow = clamp(this.glow + (c.calling ? 0.2 : 0) + this.redPulse(c) * 0.35, 0, 1);
    this.dot(cam, out, this.x, this.y, 8.5 + this.breath, 0.22, 0.54 + glow * 0.2);
    const density = clamp(Math.pow(this.radius / 175, 2), 0.16, 1);
    const energy = density * this.compression * this.compression;
    let trails = 24;
    for (let i = 0; i < this.N; i++) {
      const px = this.cx + this.ox[i], py = this.cy + this.oy[i];
      const sp = Math.hypot(this.vx[i], this.vy[i]);
      this.dot(cam, out, px, py, i % 9 === 0 ? 4.8 : 3.3,
        0.12 + glow * 0.12, (0.5 + glow * 0.16) * energy);
      if (!c.reduced && sp > this.radius * 0.4 && trails > 0) {
        trails--;
        this.seg(cam, out, px, py, px - this.vx[i] * 0.055,
          py - this.vy[i] * 0.055, 2.1, 0.24, 0.55);
      }
    }
  }
}

// 4. spine — seven rounded vertebrae: column -> L -> grid -> row -> column.
//    budget: 15 points, 6 lines.
class SpineCreature extends Creature {
  private readonly S = 7;
  private lay = new Float32Array(5 * this.S * 2);
  private cxs = new Float32Array(this.S); private cys = new Float32Array(this.S);

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    const st = r * 0.22;
    for (let i = 0; i < this.S; i++) {
      this.set(0, i, 0, (i - 3) * st);
      this.set(1, i, i < 4 ? 0 : (i - 3) * st, i < 4 ? (i - 3) * st : st);
      this.set(2, i, ((i % 3) - 1) * st, (((i / 3) | 0) - 1) * st);
      this.set(3, i, (i - 3) * st, 0);
      this.set(4, i, 0, (i - 3) * st);
      this.cxs[i] = 0; this.cys[i] = (i - 3) * st;
    }
  }

  private set(l: number, i: number, x: number, y: number): void {
    const o = (l * this.S + i) * 2; this.lay[o] = x; this.lay[o + 1] = y;
  }

  protected updateMotion(c: CreatureContext): void {
    this.x = this.cx; this.y = this.cy;
    const g = this.greetTime;
    const li = g > 0 && !c.reduced ? clamp((g / 1.2) | 0, 0, 4) : 0;
    const k = 1 - Math.exp(-this.step * (g > 0 ? 10 : 5));
    for (let i = 0; i < this.S; i++) {
      const o = (li * this.S + i) * 2;
      let tx = this.lay[o];
      const ty = this.lay[o + 1];
      if (li === 0 && !c.reduced) {
        tx += Math.sin(this.motionTime * 0.9 + i * 0.5)
          * this.radius * 0.06 * (i + 1) / this.S;
      }
      if (c.reduced) {
        this.cxs[i] = tx; this.cys[i] = ty;
      } else {
        this.cxs[i] += (tx - this.cxs[i]) * k;
        this.cys[i] += (ty - this.cys[i]) * k;
      }
    }
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const br = clamp(0.72 + this.glow * 0.22 + this.redPulse(c) * 0.2, 0, 1);
    for (let i = 0; i < this.S - 1; i++) {
      this.seg(cam, out, this.cx + this.cxs[i], this.cy + this.cys[i],
        this.cx + this.cxs[i + 1], this.cy + this.cys[i + 1], 4.2, 0.08, 0.55 * br);
    }
    for (let i = 0; i < this.S; i++) {
      this.dot(cam, out, this.cx + this.cxs[i], this.cy + this.cys[i],
        i === 3 ? 8 : 6.5, 0.24, 0.78 * br);
      this.dot(cam, out, this.cx + this.cxs[i], this.cy + this.cys[i],
        11, 0.015, 0.18 * br);
    }
  }
}

// 5. evening-forest — warm rising motes around a persistent seed; greeting exhales
//    three rings while the underlying haze remains continuous.
//    budget: 86 points, 0 lines.
class ForestCreature extends Creature {
  private readonly M = 42;
  private mx = new Float32Array(this.M); private my = new Float32Array(this.M);
  private ml = new Float32Array(this.M); private ms = new Float32Array(this.M);
  private puff = 3;

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    for (let i = 0; i < this.M; i++) {
      this.respawn(i, rnd((s + i) | 0));
      const age = rnd((s + i + 211) | 0);
      this.my[i] = (0.65 - age * 1.3) * this.radius;
      this.ml[i] = age * 7;
    }
  }

  private respawn(i: number, r0: number): void {
    this.mx[i] = (r0 - 0.5) * this.radius * 0.9;
    this.my[i] = this.radius * 0.65;
    this.ml[i] = 0;
    this.ms[i] = 9 + rnd((this.seed + i * 7) | 0) * 7;
  }

  protected updateMotion(c: CreatureContext): void {
    this.x = this.cx; this.y = this.cy;
    if (c.reduced) return;
    this.puff -= this.step;
    const rise = 1 + (this.puff < 0.5 ? 1.2 : 0);
    if (this.puff <= 0) this.puff += 5;
    for (let i = 0; i < this.M; i++) {
      this.my[i] -= this.radius * (0.13 + this.ms[i] * 0.002) * rise * this.step;
      this.mx[i] += Math.sin(this.motionTime * 0.5 + i) * this.radius * 0.018 * this.step;
      this.ml[i] += this.step;
      if (this.ml[i] >= 8 || this.my[i] < -this.radius * 0.75) {
        this.respawn(i, rnd((this.seed + i + (this.motionTime * 10 | 0)) | 0));
      }
    }
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const g = c.reduced ? 0 : this.greetTime;
    const ringMix = g > 0 ? smooth(g / 0.6) * (1 - smooth((g - 2.8) / 1.9)) : 0;
    const pulse = this.redPulse(c);
    this.dot(cam, out, this.x, this.y, 7 + this.breath * 1.2, 0.12,
      0.5 + this.glow * 0.18 + pulse * 0.18);
    const density = clamp(this.radius / 150, 0.45, 1);
    for (let i = 0; i < this.M; i++) {
      const life = smooth(this.ml[i] / 0.8)
        * smooth((8 - this.ml[i]) / 1.4)
        * smooth((this.my[i] / Math.max(this.radius, 1e-4) + 0.75) / 0.2);
      this.dot(cam, out, this.cx + this.mx[i], this.cy + this.my[i],
        this.ms[i] * 0.78, 0.035,
        (0.25 + this.glow * 0.1 + pulse * 0.08) * life * density
          * (0.85 + this.breath * 0.15) * (1 - ringMix * 0.45));
    }
    if (g > 0) {
      for (let i = 0; i < this.M; i++) {
        const ring = i % 3, ph = g - ring * 0.6;
        if (ph <= 0 || ph >= 3.5) continue;
        const rad = ph * this.radius * 0.5, a = (i / this.M) * TAU;
        const fade = smooth(ph / 0.4) * (1 - smooth(ph / 3.5));
        this.dot(cam, out, this.cx + Math.cos(a) * rad, this.cy + Math.sin(a) * rad,
          this.ms[i] * 0.7, 0.08, 0.5 * fade * density);
      }
    }
  }
}

// 6. planck-to-now — singularity, inflation, rotating log-spiral, collapse.
//    particle energy falls with occupied area so collapse leaves a core, not mush.
//    budget: 102 points, 0 lines.
class PlanckCreature extends Creature {
  private readonly N = 100;
  private sr = new Float32Array(this.N);
  private sa = new Float32Array(this.N);
  private cycle = 0;

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    for (let i = 0; i < this.N; i++) {
      const t = i / this.N;
      this.sa[i] = t * TAU * 3.2;
      this.sr[i] = Math.pow(t, 0.7);
    }
  }

  protected updateMotion(c: CreatureContext): void {
    this.x = this.cx; this.y = this.cy;
    if (c.reduced) return;
    if (this.greetTime > 0) {
      this.cycle = clamp(this.greetTime / 2, 0, 1);
      return;
    }
    this.cycle += this.step / 40;
    if (this.cycle >= 1) this.cycle -= 1;
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const p = c.reduced ? 0.5 : this.cycle;
    let scale: number, rot: number, disp: number, core: number;
    if (p < 0.1) {
      scale = smooth(p / 0.1) * 0.15; rot = 0; disp = 0; core = 1;
    } else if (p < 0.35) {
      const q = smooth((p - 0.1) / 0.25);
      scale = 0.15 + q * 0.85; rot = 0; disp = 0; core = 1 - q;
    } else if (p < 0.8) {
      const q = (p - 0.35) / 0.45;
      scale = 1; rot = q * TAU * 0.6; disp = q * 0.3; core = 0.1;
    } else {
      const q = smooth((p - 0.8) / 0.2);
      scale = 1 - q; rot = TAU * 0.6; disp = 0.3 * (1 - q); core = q;
    }
    const R = this.radius * 0.7;
    const br = clamp(0.7 + this.glow * 0.22 + this.redPulse(c) * 0.22, 0, 1);
    this.dot(cam, out, this.cx, this.cy, 6 + core * 5, 0.16 + core * 0.16,
      (0.55 + core * 0.2) * br);

    const reveal = smooth((p - 0.08) / 0.07);
    const area = Math.min(1, Math.pow(scale / 0.35, 2));
    const density = clamp(Math.pow(R / 90, 2), 0.12, 1);
    const energy = reveal * area * density;
    if (energy < 0.001) return;
    for (let i = 0; i < this.N; i++) {
      const rad = this.sr[i] * scale * R + disp * R * rnd((this.seed + i) | 0);
      const a = this.sa[i] + rot;
      const fade = clamp(1 - disp, 0.15, 1);
      this.dot(cam, out, this.cx + Math.cos(a) * rad, this.cy + Math.sin(a) * rad,
        i % 10 === 0 ? 4.8 : 3.1, 0.08 + this.glow * 0.1,
        0.66 * fade * br * energy);
    }
  }
}

// 7. quicknotes — a lantern-shy link-medusa: nine "notes" (hub + squashed ring)
//    strung on 12 filaments; a capture spark and a few link beads walk the web
//    tip-to-tip, a tether of hairlines breathes upward from the hub, two orphan
//    dots wait to be adopted — one hard-snaps in every ~9s, re-soldering a
//    chord. greeting "palette summon": the tether fires, the web goes dark in
//    ONE frame, notes teleport one by one onto a meridian arc, a caret-comb
//    reads them down throwing hairlines at the lantern, all collapse in 4 hard
//    steps onto one seeded match note that detonates a 9-spoke starburst, then
//    every note flies home along its own spoke while filaments relight
//    centre-out. All choreography derives from greetTime; the final pose IS the
//    idle pose (no crossfade).
//    budget (worst case): idle ~21 pts / ~21 lines · greet ~30 pts / ~38 lines.
class NoteWebCreature extends Creature {
  private static readonly N = 9;
  private static readonly E = 12;
  private static readonly G = 3.2;

  // ── idle web ──
  private readonly nA: Float32Array; private readonly nR: Float32Array;
  private readonly wF: Float32Array; private readonly wP: Float32Array; private readonly wR: Float32Array;
  private readonly hx: Float32Array; private readonly hy: Float32Array;   // live idle home (r-fractions)
  private readonly lx: Float32Array; private readonly ly: Float32Array;   // current local pose (r-fractions)
  private readonly wx: Float32Array; private readonly wy: Float32Array;   // world px scratch
  private readonly eA: Int32Array;   private readonly eB: Int32Array;
  private readonly flare: Float32Array;
  private spE = 0; private spT = 0; private spD = 1; private hops = 0; private readonly spS: number;
  private readonly bN: number; private readonly bE: Int32Array; private readonly bT: Float32Array;
  private readonly bD: Int32Array; private readonly bS: Float32Array;
  private tUp = -1; private tDown = -1; private tAckAt = -1; private tNext: number; private tCount = 0; private flashFr = 0;
  private readonly oX: Float32Array; private readonly oY: Float32Array;
  private oNext: number; private oSnaps = 0; private oSnapFr = 0;
  private oFx = 0; private oFy = 0; private oTx = 0; private oTy = 0;

  // ── greet ──
  private readonly sx: Float32Array; private readonly sy: Float32Array;     // greetStart snapshot
  private readonly arcX: Float32Array; private readonly arcY: Float32Array;
  private readonly eKey: Float32Array; private readonly eRank: Int32Array;
  private readonly streak: Int32Array; private readonly lanFr: Int32Array; private readonly persist: Int32Array;
  private readonly tele: Int32Array; private readonly pass: Int32Array;
  private greets = 0; private match = 1; private held = false; private flashed = false; private ackFired = false;
  private burstAt = -1; private combY = -.5;

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, seed: number) {
    super(id, hue, fx, fy, r, seed);
    this.leanSign = 1;
    this.prom = 1.2;   // owner 2026-09-21: ×1.2 material (alpha+width), lines bolder
    const N = NoteWebCreature.N, E = NoteWebCreature.E, s = seed | 0;

    this.nA = new Float32Array(N); this.nR = new Float32Array(N);
    this.wF = new Float32Array(N); this.wP = new Float32Array(N); this.wR = new Float32Array(N);
    this.hx = new Float32Array(N); this.hy = new Float32Array(N);
    this.lx = new Float32Array(N); this.ly = new Float32Array(N);
    this.wx = new Float32Array(N); this.wy = new Float32Array(N);
    this.eA = new Int32Array(E);   this.eB = new Int32Array(E);
    this.flare = new Float32Array(N);
    this.bE = new Int32Array(6); this.bT = new Float32Array(6); this.bD = new Int32Array(6); this.bS = new Float32Array(6);
    this.oX = new Float32Array(2); this.oY = new Float32Array(2);
    this.sx = new Float32Array(N); this.sy = new Float32Array(N);
    this.arcX = new Float32Array(N); this.arcY = new Float32Array(N);
    this.eKey = new Float32Array(E); this.eRank = new Int32Array(E);
    this.streak = new Int32Array(N); this.lanFr = new Int32Array(N); this.persist = new Int32Array(3);
    this.tele = new Int32Array(N); this.pass = new Int32Array(N);

    // hub (i=0) breathes with the same seed law as the ring
    for (let i = 0; i < N; i++) {
      this.wF[i] = .5 + rnd((s + i * 43 + 7) | 0) * .7;
      this.wP[i] = rnd((s + i * 71 + 3) | 0) * TAU;
      this.wR[i] = .03 + rnd((s + i * 97 + 11) | 0) * .035;
    }
    for (let i = 1; i < N; i++) {
      this.nA[i] = ((i - 1) / 8) * TAU + rnd((s + i * 17) | 0) * .9;
      this.nR[i] = .38 + rnd((s + i * 31 + 5) | 0) * .42;
    }
    // spanning tree + 4 seeded chords
    for (let i = 1; i < N; i++) {
      this.eA[i - 1] = i === 1 ? 0 : ((rnd((s + i * 53) | 0) * i) | 0);
      this.eB[i - 1] = i;
    }
    for (let k = 0; k < 4; k++) this.rewire(8 + k, s + 1000 + k * 91);

    // spark
    this.spS = .8 + rnd((s + 9) | 0) * .5;
    this.spE = (rnd((s + 12) | 0) * E) | 0;
    // beads 4..6
    this.bN = 4 + ((rnd((s + 77) | 0) * 3) | 0);
    for (let j = 0; j < 6; j++) {
      this.bE[j] = (rnd((s + j * 19 + 2) | 0) * E) | 0;
      this.bT[j] = rnd((s + j * 19 + 4) | 0);
      this.bD[j] = rnd((s + j * 19 + 6) | 0) < .5 ? -1 : 1;
      this.bS[j] = .5 + rnd((s + j * 19 + 8) | 0) * .5;
    }
    // tether + orphans
    this.tNext = 3 + rnd((s + 5) | 0) * 6;
    this.oNext = 5 + rnd((s + 6) | 0) * 8;
    for (let j = 0; j < 2; j++) this.placeOrphan(j, s + j * 23 + 40);
    // initial pose = idle home
    this.homes(0);
    for (let i = 0; i < N; i++) { this.lx[i] = this.hx[i]; this.ly[i] = this.hy[i]; }
  }

  // ── helpers (no allocation) ──
  private q(v: number): number { v = clamp(v, 0, 1); return ((v * 5 + .5) | 0) / 5; }   // 5 brightness rungs

  // material prominence: the prom multiplier rides every primitive
  protected override dot(cam: CameraView, out: Emitter, wx: number, wy: number, size: number,
    white: number, a: number): void {
    super.dot(cam, out, wx, wy, size * this.prom, white, Math.min(1, a * this.prom));
  }
  protected override seg(cam: CameraView, out: Emitter, x1: number, y1: number, x2: number, y2: number,
    width: number, white: number, a: number): void {
    super.seg(cam, out, x1, y1, x2, y2, width * this.prom, white, Math.min(1, a * this.prom));
  }

  private homes(T: number): void {
    const N = NoteWebCreature.N;
    this.hx[0] = Math.cos(T * this.wF[0] + this.wP[0]) * this.wR[0];
    this.hy[0] = Math.sin(T * this.wF[0] * .83 + this.wP[0] * 1.7) * this.wR[0];
    for (let i = 1; i < N; i++) {
      const a = this.nA[i], rad = this.nR[i], ph = T * this.wF[i] + this.wP[i];
      this.hx[i] = Math.cos(a) * rad + Math.cos(ph) * this.wR[i];
      this.hy[i] = Math.sin(a) * rad * .82 + Math.sin(ph * .83 + this.wP[i] * 1.7) * this.wR[i];
    }
  }

  // swap one chord for a fresh seeded pair; duplicate-checked, tree untouched
  private rewire(e: number, k: number): void {
    const N = NoteWebCreature.N, E = NoteWebCreature.E;
    for (let t = 0; t < 12; t++) {
      const a = (rnd((k + t * 7) | 0) * N) | 0, b = (rnd((k + t * 7 + 3) | 0) * N) | 0;
      if (a === b) continue;
      let dup = false;
      for (let j = 0; j < E; j++) {
        if (j === e) continue;
        if ((this.eA[j] === a && this.eB[j] === b) || (this.eA[j] === b && this.eB[j] === a)) { dup = true; break; }
      }
      if (!dup) { this.eA[e] = a; this.eB[e] = b; return; }
    }
  }

  private adj(node: number, k: number): number {
    const E = NoteWebCreature.E;
    let c = 0;
    for (let e = 0; e < E; e++) if (this.eA[e] === node || this.eB[e] === node) c++;
    if (c === 0) return (rnd(k | 0) * E) | 0;
    let pick = (rnd(k | 0) * c) | 0;
    for (let e = 0; e < E; e++) if (this.eA[e] === node || this.eB[e] === node) { if (pick === 0) return e; pick--; }
    return 0;
  }

  private placeOrphan(j: number, k: number): void {
    const a = rnd(k | 0) * TAU, rad = 1 + rnd((k + 1) | 0) * .2;
    this.oX[j] = Math.cos(a) * rad; this.oY[j] = Math.sin(a) * rad * .85;
  }

  private snapOrphan(): void {
    const N = NoteWebCreature.N, s = this.seed | 0, j = this.oSnaps & 1;
    let best = 0, bd = 1e9;
    for (let i = 0; i < N; i++) {
      const dx = this.lx[i] - this.oX[j], dy = this.ly[i] - this.oY[j], d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    this.oFx = this.oX[j]; this.oFy = this.oY[j]; this.oTx = this.lx[best]; this.oTy = this.ly[best];
    this.oSnapFr = 2;
    if (this.flare[best] < .8) this.flare[best] = .8;
    this.rewire(8 + (this.oSnaps & 3), s + 500 + this.oSnaps * 37);   // swap one chord, count constant
    this.oSnaps++;
    this.placeOrphan(j, s + 40 + this.oSnaps * 23 + j * 5);
  }

  // ── hooks ──
  protected greetStart(_c: CreatureContext): void {
    const N = NoteWebCreature.N, s = this.seed | 0, T = this.motionTime;
    this.greets++;
    this.match = 1 + ((rnd((s + 313 + this.greets * 17) | 0) * 8) | 0);
    let n = 0;
    for (let t = 0; n < 3 && t < 40; t++) {
      const p = (rnd((s + 900 + this.greets * 31 + t * 13) | 0) * N) | 0;
      let dup = false;
      for (let j = 0; j < n; j++) if (this.persist[j] === p) dup = true;
      if (!dup) this.persist[n++] = p;
    }
    // snapshot poses as local offsets; arc slots
    for (let i = 0; i < N; i++) {
      this.sx[i] = this.lx[i]; this.sy[i] = this.ly[i];
      const p = i / (N - 1);
      this.arcY[i] = -.5 + p;
      this.arcX[i] = .15 + Math.sin(p * Math.PI) * .12;
    }
    // relight order: centre-out by filament midpoint distance from hub home
    for (let e = 0; e < NoteWebCreature.E; e++) {
      const a = this.eA[e], b = this.eB[e];
      const mx = (this.hx[a] + this.hx[b]) * .5 - this.hx[0], my = (this.hy[a] + this.hy[b]) * .5 - this.hy[0];
      this.eKey[e] = mx * mx + my * my;
    }
    for (let e = 0; e < NoteWebCreature.E; e++) {
      let rk = 0;
      for (let f = 0; f < NoteWebCreature.E; f++)
        if (this.eKey[f] < this.eKey[e] || (this.eKey[f] === this.eKey[e] && f < e)) rk++;
      this.eRank[e] = rk;
    }
    this.streak.fill(0); this.lanFr.fill(0); this.tele.fill(0); this.pass.fill(0);
    this.burstAt = -1; this.flashed = false; this.ackFired = false; this.held = false;
    this.tUp = -1; this.tDown = -1; this.tAckAt = -1; this.flashFr = 0;
    this.tNext = T + NoteWebCreature.G + 3 + rnd((s + 60 + this.greets) | 0) * 3;
    this.oNext = T + NoteWebCreature.G + 5 + rnd((s + 61 + this.greets) | 0) * 6;
  }

  protected updateMotion(c: CreatureContext): void {
    const N = NoteWebCreature.N, G = NoteWebCreature.G, s = this.seed | 0;
    const dt = this.step, T = this.motionTime, g = this.greetTime;
    const inG = g > 0 && g < G;
    this.x = this.cx; this.y = this.cy;
    this.homes(T);

    // frame counters + idle flare decay
    const dk = Math.exp(-2.6 * dt);
    for (let i = 0; i < N; i++) {
      this.flare[i] *= dk;
      if (this.streak[i] > 0) this.streak[i]--;
      if (this.lanFr[i] > 0) this.lanFr[i]--;
    }
    if (this.flashFr > 0) this.flashFr--;
    if (this.oSnapFr > 0) this.oSnapFr--;

    if (c.reduced) {                        // reduced law: static held form
      this.held = inG;
      for (let i = 0; i < N; i++) {
        if (inG) { this.lx[i] = this.arcX[i]; this.ly[i] = this.arcY[i]; }
        else { this.lx[i] = this.hx[i]; this.ly[i] = this.hy[i]; }
      }
      if (inG) {
        this.flare[this.match] = 1;
        for (let j = 0; j < 3; j++) this.lanFr[this.persist[j]] = 99;
      }
      this.tUp = -1; this.tDown = -1;
      return;
    }

    if (!inG) {
      this.held = false;
      for (let i = 0; i < N; i++) { this.lx[i] = this.hx[i]; this.ly[i] = this.hy[i]; }
      // capture spark walks edges
      this.spT += dt * this.spS * (1 + this.glow * .8);
      if (this.spT >= 1) {
        const arr = this.spD > 0 ? this.eB[this.spE] : this.eA[this.spE];
        this.flare[arr] = 1;
        this.hops++;
        this.spE = this.adj(arr, s + this.hops * 29);
        this.spD = this.eA[this.spE] === arr ? 1 : -1;
        this.spT -= 1;
      }
      // link beads
      for (let j = 0; j < this.bN; j++) {
        this.bT[j] += dt * this.bS[j];
        if (this.bT[j] >= 1) {
          const e = this.bE[j], arr = this.bD[j] > 0 ? this.eB[e] : this.eA[e];
          if (this.flare[arr] < .6) this.flare[arr] = .6;
          const ne = (e + 1 + ((rnd((s + j * 13 + e * 5 + 2) | 0) * (NoteWebCreature.E - 2)) | 0)) % NoteWebCreature.E;
          this.bE[j] = ne;
          this.bD[j] = this.eA[ne] === arr ? 1 : (this.eB[ne] === arr ? -1 : (rnd((s + j * 13 + e * 5 + 9) | 0) < .5 ? -1 : 1));
          this.bT[j] -= 1;
        }
      }
      // tether: bead up every ~6s, ack down +1.4s
      if (this.tUp < 0 && T >= this.tNext) {
        this.tUp = 0; this.tAckAt = T + 1.4; this.tCount++;
        this.tNext = T + 5 + rnd((s + this.tCount * 47) | 0) * 2;
      }
      if (this.tUp >= 0) { this.tUp += dt / .7; if (this.tUp >= 1) this.tUp = -1; }
      if (this.tAckAt > 0 && T >= this.tAckAt) { this.tDown = 0; this.tAckAt = -1; }
      if (this.tDown >= 0) { this.tDown += dt / .7; if (this.tDown >= 1) this.tDown = -1; }
      // orphan adoption ~9s cycle
      if (T >= this.oNext) {
        this.snapOrphan();
        this.oNext = T + 7.5 + rnd((s + 80 + this.oSnaps * 41) | 0) * 3;
      }
      return;
    }

    // ── greeting ──
    const m = this.match;
    this.held = false;
    // 0-.12 tether bead fires up, flash at far end
    if (g < .12) { this.tUp = g / .12; }
    else if (!this.flashed) { this.flashed = true; this.flashFr = 2; this.tUp = -1; }
    // node poses: teleport one by one, collapse onto the match, fly home
    for (let i = 0; i < N; i++) {
      const t0 = .30 + i * .05;
      if (g < t0) { this.lx[i] = this.sx[i]; this.ly[i] = this.sy[i]; }
      else if (g < 1.6) {
        if (this.tele[i] === 0) { this.tele[i] = 1; this.streak[i] = 2; }
        this.lx[i] = this.arcX[i]; this.ly[i] = this.arcY[i];
      } else if (g < 2.1) {
        const st = clamp((((g - 1.6) / .125) | 0) + 1, 1, 4) / 4;
        this.lx[i] = this.arcX[i] + (this.arcX[m] - this.arcX[i]) * st;
        this.ly[i] = this.arcY[i] + (this.arcY[m] - this.arcY[i]) * st;
      } else {
        const u = smooth(clamp((g - (2.1 + i * .022)) / .5, 0, 1));
        this.lx[i] = this.arcX[this.match] + (this.hx[i] - this.arcX[this.match]) * u;
        this.ly[i] = this.arcY[this.match] + (this.hy[i] - this.arcY[this.match]) * u;
      }
    }
    // .85-1.6 caret-comb walks down the arc
    if (g >= .85 && g < 1.6) {
      this.combY = -.5 + (g - .85) / .75;
      for (let i = 0; i < N; i++) {
        if (this.pass[i] !== 0 || this.arcY[i] > this.combY) continue;
        this.pass[i] = 1; this.flare[i] = 1;
        let keep = false;
        for (let j = 0; j < 3; j++) if (this.persist[j] === i) keep = true;
        this.lanFr[i] = keep ? 9999 : 2;
      }
    }
    if (g >= 1.6) for (let i = 0; i < N; i++) if (this.lanFr[i] > 2) this.lanFr[i] = 0;   // persist ends at jump
    // match detonates at the last hard step
    if (g >= 1.975 && this.burstAt < 0) { this.burstAt = 1.975; this.flare[m] = 1; }
    // 2.86-3.2 tether ack drops, one orphan snaps in
    if (g >= 2.86) {
      this.tDown = (g - 2.86) / .34;
      if (!this.ackFired) { this.ackFired = true; this.snapOrphan(); }
    }
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const N = NoteWebCreature.N, E = NoteWebCreature.E, G = NoteWebCreature.G;
    const r = this.radius, cx = this.cx, cy = this.cy, g = this.greetTime, T = this.motionTime, gl = this.glow;
    const inG = g > 0 && g < G, held = this.held, m = this.match;
    const pulse = this.redPulse(c);
    const wx = this.wx, wy = this.wy;
    for (let i = 0; i < N; i++) { wx[i] = cx + this.lx[i] * r; wy[i] = cy + this.ly[i] * r; }

    // filaments (house width/ink; relight centre-out; dark in one frame)
    for (let e = 0; e < E; e++) {
      let vis = true;
      if (inG) { if (held) vis = false; else if (g >= .12) vis = g >= 2.1 + (this.eRank[e] / (E - 1)) * .7; }
      if (!vis) continue;
      const sh = .5 + .5 * Math.sin(T * 1.4 + e * 1.9 + this.seed);
      let al = .09 + sh * .07 + gl * .08;
      if (!inG && e === this.spE) al += .10;
      const a = this.eA[e], b = this.eB[e];
      this.seg(cam, out, wx[a], wy[a], wx[b], wy[b], 1.3, .06, clamp(al, 0, 1));
    }

    // spark + halo, beads (live web only)
    if (!inG) {
      const a = this.eA[this.spE], b = this.eB[this.spE], u = this.spD > 0 ? this.spT : 1 - this.spT;
      const px = wx[a] + (wx[b] - wx[a]) * u, py = wy[a] + (wy[b] - wy[a]) * u;
      this.dot(cam, out, px, py, 8, .04, .13 + gl * .08);
      this.dot(cam, out, px, py, 3.4, .34, clamp(.7 + gl * .2 + pulse * .2, 0, 1));
      for (let j = 0; j < this.bN; j++) {
        const e = this.bE[j], ba = this.eA[e], bb = this.eB[e], bu = this.bD[j] > 0 ? this.bT[j] : 1 - this.bT[j];
        this.dot(cam, out, wx[ba] + (wx[bb] - wx[ba]) * bu, wy[ba] + (wy[bb] - wy[ba]) * bu, 1.6, .2, .45 + gl * .15);
      }
    }

    // tether: 9 rising hairlines from hub, traveling crest, far end fades
    const tx = wx[0], ty = wy[0], seg9 = (.95 * r) / 9;
    const crest = held ? -1 : ((((T * 1.4) % 1) * 9) | 0);
    for (let k = 0; k < 9; k++) {
      const y0 = ty - k * seg9, y1 = y0 - seg9 * .78, fade = 1 - (k / 9) * .75, cr = k === crest;
      this.seg(cam, out, tx, y0, tx, y1, cr ? .8 : .4, cr ? .2 : .06,
        clamp((.07 + gl * .05) * fade + (cr ? .12 : 0), 0, 1));
    }
    if (this.tUp >= 0) this.dot(cam, out, tx, ty - this.tUp * .95 * r, 2.2, .3, .8);
    if (this.tDown >= 0) this.dot(cam, out, tx, ty - (1 - clamp(this.tDown, 0, 1)) * .95 * r, 2.2, .3, .8);
    if (this.flashFr > 0) this.dot(cam, out, tx, ty - .95 * r, 4, .38, 1);

    // notes — arrival flares ride the same dot; hub carries the extra mass
    for (let i = 0; i < N; i++) {
      let fl = this.flare[i];
      if (inG && i === 0 && g >= .12 && fl < .6) fl = .6;                 // glowing hub
      const br = .38 + gl * .22 + fl * .5 + pulse * .2;
      const sz = 2.5 + fl * 2.2 + (i === 0 ? .6 : 0);
      this.dot(cam, out, wx[i], wy[i], sz, clamp(.10 + fl * .18, 0, .38), inG ? this.q(clamp(br, 0, 1)) : clamp(br, 0, 1));
    }

    // orphan drifters + the hard-snap afterimage
    for (let j = 0; j < 2; j++)
      this.dot(cam, out, cx + this.oX[j] * r, cy + this.oY[j] * r, 1.6, .05, .3 + gl * .1);
    if (this.oSnapFr > 0) {
      const fx = cx + this.oFx * r, fy = cy + this.oFy * r, txx = cx + this.oTx * r, tyy = cy + this.oTy * r;
      this.seg(cam, out, fx, fy, txx, tyy, .6, .3, .7);
      this.dot(cam, out, txx, tyy, 3, .38, 1);
    }

    if (!inG) return;

    // teleport streaks (2 frames at the departure point)
    for (let i = 0; i < N; i++) if (this.streak[i] > 0)
      this.seg(cam, out, cx + this.sx[i] * r, cy + this.sy[i] * r, wx[i], wy[i], .8, .3, .6);
    // caret-comb
    if (!held && g >= .85 && g < 1.6) {
      const p = clamp(this.combY + .5, 0, 1), ax = cx + (.15 + Math.sin(p * Math.PI) * .12) * r, ay = cy + this.combY * r;
      this.seg(cam, out, ax - .06 * r, ay, ax + .06 * r, ay, 1.3, .38, 1);
    }
    // hairlines thrown to the lantern (3 seeded persist until the jump)
    const L = c.lantern, li = clamp(L.intensity, 0, 1);
    for (let i = 0; i < N; i++) if (this.lanFr[i] > 0)
      this.seg(cam, out, wx[i], wy[i], L.x, L.y, .5, .25, this.q(this.lanFr[i] > 2 ? .35 + li * .3 : .8));
    // 9-spoke starburst at the detonation point, ~.3s, rung-decayed
    if (!held && this.burstAt >= 0) {
      const age = g - this.burstAt;
      if (age >= 0 && age < .3) {
        const k5 = this.q(1 - age / .3), len = (.1 + .3 * (1 - k5)) * r;
        const bx = cx + this.arcX[m] * r, by = cy + this.arcY[m] * r;
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * TAU + rnd((this.seed + k * 7 + 3) | 0) * .3;
          this.seg(cam, out, bx, by, bx + Math.cos(a) * len, by + Math.sin(a) * len, 1.0, .35, k5);
        }
      }
    }
  }
}
// 8. waste-of-tokens (practice-map) — a token pyre: stray token-motes sink
//    into a glowing maw and burn; every burn pushes a fresh ember onto a
//    slowly turning spiral archive, bright lessons cooling into dim history
//    at the tail — a perpetually wasteful, perpetually learning organism.
//    greeting: the maw swells, a burn front reignites the spiral core-to-
//    tail while it flares wide, spent sparks vent upward, then the archive
//    cools back to its patient turn.
//    budget: 30 points, 21 lines (+6 plume points in greet).
class TokenPyreCreature extends Creature {
  private readonly M = 22;             // embers on the spiral
  private readonly K = 3;              // sinking token-motes
  private heat = new Float32Array(22);
  private brad = new Float32Array(22); // spiral radii, fractions of radius
  private bang = new Float32Array(22); // spiral angles
  private rot = 0;
  private ex = 1;                      // spiral expansion (greet swell)
  private coreFlare = 0;
  private mt = new Float32Array(3);    // mote progress 0..1
  private mx0 = new Float32Array(3);   // mote entry offset
  private msp = new Float32Array(3);   // mote speed
  private mph = new Float32Array(3);   // sway phase
  private burns = 0;                   // deterministic respawn counter

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    this.leanSign = -1;
    this.prom = 1.2;   // owner 2026-09-21: ×1.2 material (alpha+width), lines bolder
    this.rot = rnd(s) * TAU;
    for (let i = 0; i < this.M; i++) {
      const f = i / (this.M - 1);
      this.bang[i] = f * TAU * 1.65;                          // ~1.65 turns
      this.brad[i] = 0.12 + 0.62 * Math.pow(f, 0.8);
      this.heat[i] = clamp(0.9 - f * 1.1 + rnd((s + i * 13) | 0) * 0.15, 0.12, 1);
    }
    for (let k = 0; k < this.K; k++) {
      this.mt[k] = rnd((s + 77 + k * 29) | 0);
      this.mx0[k] = (rnd((s + 151 + k * 41) | 0) - 0.5) * 1.3;
      this.msp[k] = 0.14 + rnd((s + 233 + k * 59) | 0) * 0.09;
      this.mph[k] = rnd((s + 307 + k * 71) | 0) * TAU;
    }
  }

  protected greetStart(_c: CreatureContext): void {
    this.coreFlare = 1; // maw swell; burn front + plume are stateless off greetTime
  }

  protected updateMotion(c: CreatureContext): void {
    this.x = this.cx; this.y = this.cy;
    const dt = this.step;

    if (c.reduced) {
      this.ex = 1; this.coreFlare = 0.35;
      for (let i = 0; i < this.M; i++) this.heat[i] = clamp(1 - (i / (this.M - 1)) * 0.85, 0.15, 1);
      for (let k = 0; k < this.K; k++) this.mt[k] = 0.12 + k * 0.22;
      return;
    }

    this.coreFlare *= Math.exp(-3.2 * dt);
    const g = this.greetTime, G = 3.8;
    const inG = g > 0 && g < G;

    this.rot += dt * (0.13 + this.glow * 0.08 + (inG ? 0.22 : 0));

    // the archive cools slowly toward its dim floor
    const kc = 1 - Math.exp(-0.06 * dt);
    for (let i = 0; i < this.M; i++) this.heat[i] += (0.14 - this.heat[i]) * kc;

    // token-motes sink into the maw; each arrival burns and pushes the archive
    const dive = inG ? 5.5 : 1;
    for (let k = 0; k < this.K; k++) {
      this.mt[k] += dt * this.msp[k] * dive * (1 + this.glow * 0.5);
      if (this.mt[k] >= 1) {
        this.mt[k] = 0;
        this.coreFlare = 1;
        for (let i = this.M - 1; i > 0; i--) this.heat[i] = this.heat[i - 1] * 0.96;
        this.heat[0] = 1;
        this.burns = (this.burns + 1) | 0;
        this.mx0[k] = (rnd((this.seed + this.burns * 97 + k * 13) | 0) - 0.5) * 1.3;
        this.mph[k] = rnd((this.seed + this.burns * 173 + k * 31) | 0) * TAU;
        this.msp[k] = 0.14 + rnd((this.seed + this.burns * 211 + k * 47) | 0) * 0.09;
      }
    }

    if (inG) {
      // swell wide, hold, then relax; both ends meet ex = 1 so no snap
      const swell = smooth((g - 0.35) / 0.75) * (g > 2.7 ? 1 - smooth((g - 2.7) / 1.1) : 1);
      this.ex = 1 + 0.30 * swell;
    } else {
      this.ex += (1 - this.ex) * (1 - Math.exp(-5 * dt));
    }
  }

  // material prominence: the prom multiplier rides every primitive
  protected override dot(cam: CameraView, out: Emitter, wx: number, wy: number, size: number,
    white: number, a: number): void {
    super.dot(cam, out, wx, wy, size * this.prom, white, Math.min(1, a * this.prom));
  }
  protected override seg(cam: CameraView, out: Emitter, x1: number, y1: number, x2: number, y2: number,
    width: number, white: number, a: number): void {
    super.seg(cam, out, x1, y1, x2, y2, width * this.prom, white, Math.min(1, a * this.prom));
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const r = this.radius, gl = this.glow, pulse = this.redPulse(c);
    const g = this.greetTime, G = 3.8;
    const inG = g > 0 && g < G && !c.reduced;
    const breath = c.reduced ? 0.5 : this.breath;
    const cool = inG && g > 2.7 ? smooth((g - 2.7) / 1.1) : 0;
    const wavePos = (g - 0.3) * 13;   // burn-front ember index during greet

    // spiral archive: thread + embers, core-out
    let lx = 0, ly = 0;
    for (let i = 0; i < this.M; i++) {
      const a = this.bang[i] + this.rot;
      const rr = this.brad[i] * this.ex * r;
      const wx = this.cx + Math.cos(a) * rr;
      const wy = this.cy + Math.sin(a) * rr * 0.86;
      let h = this.heat[i];
      if (inG) {
        const head = clamp(1 - Math.abs(i - wavePos) * 0.45, 0, 1);
        const lit = i < wavePos ? 0.85 : 0;
        const target = Math.max(h, clamp(lit + head * 0.6, 0, 1));
        h = target + (h - target) * cool;            // cool phase hands back
      }
      const flick = c.reduced ? 0 : Math.sin(this.motionTime * 2.6 + i * 2.1 + this.seed) * 0.05 * h;
      if (i > 0)
        this.seg(cam, out, lx, ly, wx, wy, 1.2, 0.05, clamp(0.07 + h * 0.10 + gl * 0.05, 0, 1));
      this.dot(cam, out, wx, wy, 2.0 + h * 2.8, 0.06 + h * 0.20,
        clamp(0.16 + h * 0.62 + flick + pulse * 0.15, 0, 1));
      lx = wx; ly = wy;
    }

    // the maw: breathing core + soft corona
    const cf = this.coreFlare;
    const csz = (4.6 + breath * 2.2 + cf * 5.5) * this.ex;
    this.dot(cam, out, this.cx, this.cy, csz, 0.20 + cf * 0.16,
      clamp(0.45 + gl * 0.2 + cf * 0.4 + pulse * 0.2, 0, 1));
    this.dot(cam, out, this.cx, this.cy, csz * 2.3, 0.03, clamp(0.09 + cf * 0.18 + gl * 0.06, 0, 1));

    // token-motes sinking from above; they brighten as the maw takes them
    for (let k = 0; k < this.K; k++) {
      const tt = this.mt[k];
      const e = smooth(tt);
      const wx = this.cx + (this.mx0[k] * (1 - e) + Math.sin(tt * 9 + this.mph[k]) * 0.06 * (1 - tt)) * r;
      const wy = this.cy - 1.05 * (1 - e * e) * r;
      const near = clamp((tt - 0.75) * 4, 0, 1);
      this.dot(cam, out, wx, wy, 2.2 + near * 1.4, 0.10 + near * 0.14,
        clamp(0.35 + near * 0.4 + gl * 0.15, 0, 1));
      if (near > 0.05) this.dot(cam, out, wx, wy, 6, 0.02, 0.10 * near);
    }

    // greet plume: spent tokens venting from the maw
    if (inG && g > 1.0) {
      const pfade = g > 2.8 ? 1 - smooth((g - 2.8) / 1.0) : 1;
      for (let k = 0; k < 6; k++) {
        const rise = ((g - 1.0) * 0.6 + k * 0.16) % 1;
        const fade = (1 - rise) * pfade;
        if (fade <= 0.03) continue;
        const sx = this.cx + Math.sin(rise * 7 + k * 2.1 + this.seed) * 0.10 * r;
        const sy = this.cy - (0.15 + rise * 0.95) * r;
        this.dot(cam, out, sx, sy, 2.0 + (1 - rise) * 1.6, 0.20, 0.4 * fade);
      }
    }
  }
}

// -- layer 4: Emitter (contract-verbatim) + factory -------------------------------------
export class Emitter {
  readonly points: Float32Array; readonly lines: Float32Array;
  pointCount: number; lineCount: number;             // reset to 0 by the scene each frame; SHARED across all creatures
  private readonly pCap: number; private readonly lCap: number;

  constructor(pointCap: number, lineCap: number) {
    this.points = new Float32Array(pointCap * 6);      // stride 6: x,y,size,r,g,b
    this.lines = new Float32Array(lineCap * 8);        // stride 8: x1,y1,x2,y2,width,r,g,b
    this.pointCount = 0; this.lineCount = 0;
    this.pCap = pointCap; this.lCap = lineCap;
  }

  point(x: number, y: number, size: number, r: number, g: number, b: number): void {
    if (this.pointCount >= this.pCap) return;          // silently drops past cap
    const o = this.pointCount * 6;
    this.points[o] = x; this.points[o + 1] = y; this.points[o + 2] = size;
    this.points[o + 3] = r; this.points[o + 4] = g; this.points[o + 5] = b;
    this.pointCount++;
  }

  line(x1: number, y1: number, x2: number, y2: number, width: number, r: number, g: number, b: number): void {
    if (this.lineCount >= this.lCap) return;           // silently drops past cap
    const o = this.lineCount * 8;
    this.lines[o] = x1; this.lines[o + 1] = y1; this.lines[o + 2] = x2; this.lines[o + 3] = y2;
    this.lines[o + 4] = width; this.lines[o + 5] = r; this.lines[o + 6] = g; this.lines[o + 7] = b;
    this.lineCount++;
  }
}

// known id order maps to the hue table + a concrete class; unknown ids fall back by position
const ORDER = ['raft-cluster', 'kitty-run', 'explosion', 'spine', 'evening-forest', 'planck-to-now', 'quicknotes', 'practice-map'];

function build(id: string, idx: number, hue: readonly [number, number, number],
  fx: number, fy: number, r: number, seed: number): Creature {
  const kind = ORDER.indexOf(id) >= 0 ? ORDER.indexOf(id) : idx % ORDER.length;
  switch (kind) {
    case 0: return new RaftCreature(id, hue, fx, fy, r, seed);
    case 1: return new KittyCreature(id, hue, fx, fy, r, seed);
    case 2: return new ExplosionCreature(id, hue, fx, fy, r, seed);
    case 3: return new SpineCreature(id, hue, fx, fy, r, seed);
    case 4: return new ForestCreature(id, hue, fx, fy, r, seed);
    case 5: return new PlanckCreature(id, hue, fx, fy, r, seed);
    case 6: return new NoteWebCreature(id, hue, fx, fy, r, seed);
    default: return new TokenPyreCreature(id, hue, fx, fy, r, seed);
  }
}

export function createCreatures(doors: readonly { readonly id: string; readonly hue: string }[],
  anchors: readonly { readonly fx: number; readonly fy: number }[],
  radius: number): RealmCreature[] {
  const out: RealmCreature[] = [];
  for (let i = 0; i < doors.length; i++) {
    const a = anchors[i] || { fx: 0.5, fy: 0.5 };      // graceful fallback if anchors run short
    out.push(build(doors[i].id, i, parseHex(doors[i].hue), a.fx, a.fy, radius, (i * 1013904223 + 12345) | 0));
  }
  return out;
}
