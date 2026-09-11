// realm-creatures.ts — "The Deep", module 3 of 3: the seven bioluminescent organisms.
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
      0.015, 0.10 + this.breath * 0.035 + this.glow * 0.055 + pulse * 0.04);
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

// -- layer 3: the seven creatures -------------------------------------------------------

// 1. raft-cluster — five orbiting nodes, elected leader, laggard and commit pulse.
//    sweep scatter and the greeting row both settle without placement steps.
//    budget: 18 points, 5 lines, including the common aura.
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
    for (let i = 0; i < this.N; i++) {
      this.gsx[i] = this.nx[i]; this.gsy[i] = this.ny[i];
    }
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

    if (this.greetTime === 0 && lspd > 900
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

    const g = this.greetTime, settle = 1 - Math.exp(-9 * this.step);
    for (let i = 0; i < this.N; i++) {
      this.ang[i] += this.step * 0.5 * (i === this.laggard ? 0.6 : 1);
      const spread = this.scatter * (0.10 + rnd((this.seed + i) | 0) * 0.16) * this.radius;
      let ox = this.cx + Math.cos(this.ang[i]) * (rr + spread);
      let oy = this.cy + Math.sin(this.ang[i]) * (rr + spread);
      if (g > 0) {
        const fm = smooth(g / 1.2);
        const row = this.cx + (i - 2) * this.radius * 0.30;
        ox = this.gsx[i] + (row - this.gsx[i]) * fm;
        oy = this.gsy[i] + (this.cy - this.gsy[i]) * fm;
      }
      this.nx[i] += (ox - this.nx[i]) * settle;
      this.ny[i] += (oy - this.ny[i]) * settle;
    }
    this.x = this.cx; this.y = this.cy;
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const g = c.reduced ? 0 : this.greetTime;
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
      const gp = g > 0 ? clamp(1 - Math.abs(g - 1.5 - i * 0.35), 0, 1) : 0;
      let br = isLead ? 0.86 : isLag ? 0.43 : 0.68;
      br += clamp(1 - Math.abs((this.commit || -9) - i), 0, 1) * 0.25;
      if (g > 0) br = isLag ? 0.43 : Math.max(br, 0.7 + gp * 0.25);
      br = clamp(br + this.glow * 0.18 + this.redPulse(c) * 0.2, 0, 1);
      this.dot(cam, out, this.nx[i], this.ny[i], isLead ? 7.5 : 5.6,
        isLead ? 0.3 : 0.15, 0.82 * br);
      this.dot(cam, out, this.nx[i], this.ny[i], isLead ? 14 : 10, 0.015, 0.19 * br);
      if (isLead) for (let t = 0; t < 6; t++) {
        const a = (t / 6) * TAU + (c.reduced ? 0 : this.motionTime * 0.8);
        const halo = clamp(this.radius * 0.085, 12, 19);
        this.dot(cam, out, this.nx[i] + Math.cos(a) * halo,
          this.ny[i] + Math.sin(a) * halo, 2.1, 0.22, 0.55);
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

// 7. practice-map — persistent constellation, changing routes and travelling pulses.
//    greeting threads all stars; emit is read-only, even when culled or drawn twice.
//    budget: 22 points, 16 lines.
class MapCreature extends Creature {
  private readonly S = 9;
  private stx = new Float32Array(this.S); private sty = new Float32Array(this.S);
  private readonly R = 3;
  private ra = new Int32Array(this.R); private rb = new Int32Array(this.R);
  private rp = new Float32Array(this.R);
  private rf = new Float32Array(this.R);
  private rl = new Float32Array(this.R);
  private spawn = 0;
  private starPulse = new Float32Array(this.S);

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    for (let i = 0; i < this.S; i++) {
      const a = rnd((s + i) | 0) * TAU;
      const d = (0.25 + rnd((s + i + 40) | 0) * 0.7) * r * 0.6;
      this.stx[i] = Math.cos(a) * d; this.sty[i] = Math.sin(a) * d;
    }
    for (let k = 0; k < this.R; k++) {
      this.ra[k] = k; this.rb[k] = (k + 3) % this.S;
      this.rp[k] = 1; this.rf[k] = 0;
    }
  }

  protected updateMotion(c: CreatureContext): void {
    this.x = this.cx; this.y = this.cy;
    if (c.reduced) {
      for (let i = 0; i < this.S; i++) this.starPulse[i] = 0;
      return;
    }
    for (let i = 0; i < this.S; i++) {
      this.starPulse[i] = Math.max(0, this.starPulse[i] - this.step * 2);
    }
    if (this.greetTime > 0) {
      const reached = clamp((this.greetTime / 0.55) | 0, 0, this.S - 1);
      for (let i = 0; i <= reached; i++) this.starPulse[i] = 1;
      return;
    }

    this.spawn -= this.step;
    if (this.spawn <= 0) {
      this.spawn += 1.3;
      let worst = 0;
      for (let k = 1; k < this.R; k++) {
        if (this.rf[k] > this.rf[worst]) worst = k;
      }
      const seed = (this.seed + (this.motionTime * 30 | 0)) | 0;
      this.ra[worst] = (rnd(seed) * this.S) | 0;
      this.rb[worst] = (this.ra[worst] + 1
        + ((rnd(seed + 1) * (this.S - 1)) | 0)) % this.S;
      this.rp[worst] = 0; this.rf[worst] = 0; this.rl[worst] = 0;
    }
    for (let k = 0; k < this.R; k++) {
      if (this.rp[k] < 1) {
        this.rp[k] = Math.min(1, this.rp[k] + this.step * 0.8);
        this.rl[k] = 1;
        if (this.rp[k] >= 1) this.starPulse[this.rb[k]] = 1;
      } else this.rl[k] = Math.max(0, this.rl[k] - this.step * 0.4);
      this.rf[k] = Math.min(1, this.rf[k] + this.step * 0.25);
    }
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const g = c.reduced ? 0 : this.greetTime;
    // static skeleton keeps the constellation readable when every live route is stale.
    for (let i = 0; i < this.S - 1; i++) {
      this.seg(cam, out, this.cx + this.stx[i], this.cy + this.sty[i],
        this.cx + this.stx[i + 1], this.cy + this.sty[i + 1],
        1.5, 0.035, 0.18 + this.glow * 0.06);
    }
    if (g > 0) {
      const progress = clamp(g / 0.55, 0, this.S - 1);
      for (let i = 0; i < this.S - 1; i++) {
        const f = clamp(progress - i, 0, 1);
        if (f <= 0) break;
        this.seg(cam, out, this.cx + this.stx[i], this.cy + this.sty[i],
          this.cx + this.stx[i] + (this.stx[i + 1] - this.stx[i]) * f,
          this.cy + this.sty[i] + (this.sty[i + 1] - this.sty[i]) * f,
          2.4, 0.22, 0.58);
      }
    } else {
      for (let k = 0; k < this.R; k++) {
        const ax = this.cx + this.stx[this.ra[k]], ay = this.cy + this.sty[this.ra[k]];
        const bx = this.cx + this.stx[this.rb[k]], by = this.cy + this.sty[this.rb[k]];
        const base = 0.18 * (1 - this.rf[k]) + this.rl[k] * 0.35;
        this.seg(cam, out, ax, ay, bx, by, 2.1, 0.07, base);
        if (!c.reduced && this.rp[k] < 1) {
          const px = ax + (bx - ax) * this.rp[k], py = ay + (by - ay) * this.rp[k];
          this.dot(cam, out, px, py, 4, 0.3, 0.72);
        }
      }
    }
    const pulse = this.redPulse(c);
    for (let i = 0; i < this.S; i++) {
      const pl = this.starPulse[i];
      const br = clamp(0.72 + pl * 0.18 + this.glow * 0.18 + pulse * 0.2, 0, 1);
      this.dot(cam, out, this.cx + this.stx[i], this.cy + this.sty[i],
        4.8 + pl * 1.8, 0.22 + pl * 0.12, 0.8 * br);
      this.dot(cam, out, this.cx + this.stx[i], this.cy + this.sty[i],
        8.5 + pl, 0.015, 0.12 + pl * 0.08);
    }
  }
}

// -- layer 4: Emitter (contract-verbatim) + factory -------------------------------------

export class Emitter {
  readonly points: Float32Array; readonly lines: Float32Array;
  pointCount: number; lineCount: number;             // reset to 0 by the scene each frame; SHARED across all 7
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
const ORDER = ['raft-cluster', 'kitty-run', 'explosion', 'spine', 'evening-forest', 'planck-to-now', 'practice-map'];

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
    default: return new MapCreature(id, hue, fx, fy, r, seed);
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
