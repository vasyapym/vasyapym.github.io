// realm-creatures.ts — "The Deep", module 3 of 3: the seven bioluminescent organisms.
// architecture: four layers in one file. (1) pure primitive utils — hex parse, clamp,
// smoothstep, deterministic prng, world->screen transform, cull test. (2) an abstract
// Creature base owning the common law: first-placement, excitement/glow integration,
// lantern lean, anchor restraint, reduced-motion gate, greeting-clock plumbing, and the
// alloc-free emit helpers (every emit routes through here so the transform lives once).
// (3) seven concrete creatures, each preallocating its state and writing only what makes
// it unmistakably its project. (4) the Emitter (contract-verbatim) and createCreatures
// factory. all motion is procedural from time/dt; update/emit allocate nothing.

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
  readonly world: { readonly w: number; readonly h: number };
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

  // anchor (world px), motion centre (anchor + lantern lean), and per-creature state
  protected ax = 0; protected ay = 0;
  protected cx = 0; protected cy = 0;
  protected fx: number; protected fy: number;
  protected seed: number;
  protected leanSign = 1;      // +1 curious (drift toward), -1 shy (keep distance)
  protected breath = 0.5;      // slow breathing pulse 0..1
  private placed = false;
  private prevGreet = 0;

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number,
    radius: number, seed: number) {
    this.id = id; this.hue = hue; this.radius = radius;
    this.fx = fx; this.fy = fy; this.seed = seed;
  }

  greet(): void { /* one-shot primed; the scene drives the clock via context.greeting */ }

  update(c: CreatureContext): void {
    // first update: the scene does not pre-place us
    if (!this.placed) {
      this.ax = this.fx * c.world.w; this.ay = this.fy * c.world.h;
      this.x = this.ax; this.y = this.ay; this.placed = true;
    }
    // excitement: rises fast with lantern proximity x intensity (+calling), decays slowly
    const dx = c.lantern.x - this.x, dy = c.lantern.y - this.y;
    const dist = Math.hypot(dx, dy) || 1e-4;
    const prox = smooth(1 - dist / this.radius);
    let target = prox * c.lantern.intensity;
    // calling boost scales with proximity: only creatures actually near the lantern answer,
    // distant ones no longer light up in unison (prox is 0 outside the radius)
    if (c.calling) target = Math.max(target, (0.35 + 0.5 * prox) * smooth(prox));
    target = clamp(target + c.lure * 0.15, 0, 1);
    const rate = target > this.glow ? 6 : 1.2;               // fast attack, slow release
    this.glow = clamp(this.glow + (target - this.glow) * Math.min(1, rate * c.dt), 0, 1);
    // lantern lean: gentle curiosity, not a jump. The calling term is damped (0.35 -> 0.18)
    // and ramps in with the creature's own glow attack (~0.4s to full) rather than instantly.
    const callRamp = c.calling ? clamp(this.glow / 0.6, 0, 1) : 0;
    const lean = c.reduced ? 0
      : clamp(c.lure * 0.5 + 0.18 * callRamp + this.glow * 0.25, 0, 1)
        * this.radius * 0.5 * this.leanSign;
    this.cx = this.ax + (dx / dist) * lean; this.cy = this.ay + (dy / dist) * lean;
    this.breath = 0.5 + 0.5 * Math.sin(c.time * 1.6 + this.seed);
    // greeting edge: snapshot on the frame the clock leaves idle
    if (this.prevGreet === 0 && c.greeting > 0) this.greetStart(c);
    this.prevGreet = c.greeting;
    // subclass motion
    this.updateMotion(c);
    // anchor restraint: never wander more than ~radius from anchor (geography stays intact)
    const rx = this.x - this.ax, ry = this.y - this.ay, rd = Math.hypot(rx, ry);
    if (rd > this.radius) { const s = this.radius / rd; this.x = this.ax + rx * s; this.y = this.ay + ry * s; }
  }

  emit(c: CreatureContext, cam: CameraView, out: Emitter): void {
    if (this.culled(cam)) return;      // off-screen: cost nothing but cheap update math
    this.emitBody(c, cam, out);
  }

  // reduced greeting collapses to a brief brightness pulse for every creature
  protected redPulse(c: CreatureContext): number {
    return c.greeting > 0 ? Math.max(0, Math.sin(c.greeting * 3.2)) : 0;
  }

  // cull if anchor is >200 screen px outside the viewport plus footprint
  private culled(cam: CameraView): boolean {
    const hw = cam.vw * 0.5, hh = cam.vh * 0.5;
    const sx = (this.ax - cam.camX - hw) * cam.zoom + hw;
    const sy = (this.ay - cam.camY - hh) * cam.zoom + hh;
    const fp = this.radius * cam.zoom + 200;
    return sx < -fp || sx > cam.vw + fp || sy < -fp || sy > cam.vh + fp;
  }

  // world->screen point; size is a screen radius scaled by zoom; colour x alpha (additive)
  protected dot(cam: CameraView, out: Emitter, wx: number, wy: number, size: number,
    white: number, a: number): void {
    const h = this.hue;
    const r = h[0] + (1 - h[0]) * white, g = h[1] + (1 - h[1]) * white, b = h[2] + (1 - h[2]) * white;
    const hw = cam.vw * 0.5, hh = cam.vh * 0.5;
    const sx = (wx - cam.camX - hw) * cam.zoom + hw, sy = (wy - cam.camY - hh) * cam.zoom + hh;
    out.point(sx, sy, size * cam.zoom, r * a, g * a, b * a);
  }
  protected seg(cam: CameraView, out: Emitter, x1: number, y1: number, x2: number, y2: number,
    width: number, white: number, a: number): void {
    const h = this.hue;
    const r = h[0] + (1 - h[0]) * white, g = h[1] + (1 - h[1]) * white, b = h[2] + (1 - h[2]) * white;
    const hw = cam.vw * 0.5, hh = cam.vh * 0.5;
    const sx1 = (x1 - cam.camX - hw) * cam.zoom + hw, sy1 = (y1 - cam.camY - hh) * cam.zoom + hh;
    const sx2 = (x2 - cam.camX - hw) * cam.zoom + hw, sy2 = (y2 - cam.camY - hh) * cam.zoom + hh;
    out.line(sx1, sy1, sx2, sy2, width * cam.zoom, r * a, g * a, b * a);
  }

  protected greetStart(_c: CreatureContext): void { /* optional snapshot hook */ }
  protected abstract updateMotion(c: CreatureContext): void;
  protected abstract emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void;
}

// -- layer 3: the seven creatures -------------------------------------------------------

// 1. raft-cluster — five nodes orbiting; one leader (bright + tick-halo), one laggard
//    (dim, trailing); heartbeat commit pulse travels the ring; fast sweep scatters +
//    re-elects. budget: ~18 points, 5 lines.
class RaftCreature extends Creature {
  private readonly N = 5;
  private ang = new Float32Array(this.N);
  private base = new Float32Array(this.N);
  private nx = new Float32Array(this.N);
  private ny = new Float32Array(this.N);
  private gsx = new Float32Array(this.N);
  private gsy = new Float32Array(this.N);
  private leader = 0; private laggard = 4;
  private hb = 0; private commit = 0; private scatter = 0;
  private reelect = false; private prevLx = 0; private prevLy = 0;

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    for (let i = 0; i < this.N; i++) { this.base[i] = (i / this.N) * TAU; this.ang[i] = this.base[i]; }
    this.hb = rnd(s) * 2.2;
  }

  protected greetStart(_c: CreatureContext): void {
    for (let i = 0; i < this.N; i++) { this.gsx[i] = this.nx[i]; this.gsy[i] = this.ny[i]; }
  }

  protected updateMotion(c: CreatureContext): void {
    const rr = this.radius * 0.42;
    if (c.reduced) {                                   // hold the ring, breathing only
      for (let i = 0; i < this.N; i++) {
        this.nx[i] = this.ax + Math.cos(this.base[i]) * rr;
        this.ny[i] = this.ay + Math.sin(this.base[i]) * rr;
      }
      this.x = this.ax; this.y = this.ay; return;
    }
    // lantern speed: a fast sweep through the school scatters it
    const lspd = Math.hypot(c.lantern.x - this.prevLx, c.lantern.y - this.prevLy) / Math.max(c.dt, 1e-3);
    this.prevLx = c.lantern.x; this.prevLy = c.lantern.y;
    if (lspd > 900 && Math.hypot(c.lantern.x - this.cx, c.lantern.y - this.cy) < this.radius) this.scatter = 1;
    this.scatter = Math.max(0, this.scatter - c.dt * 0.6);
    if (this.scatter > 0.5) this.reelect = true;
    if (this.reelect && this.scatter < 0.25) {         // re-elect a fresh leader (never the laggard)
      this.leader = (this.leader + 1) % this.N;
      if (this.leader === this.laggard) this.leader = (this.leader + 1) % this.N;
      this.reelect = false;
    }
    this.hb += c.dt; if (this.hb >= 2.2) { this.hb -= 2.2; this.commit = 1e-4; }
    if (this.commit > 0) { this.commit += c.dt * 1.6; if (this.commit > this.N) this.commit = 0; }

    const g = c.greeting;
    for (let i = 0; i < this.N; i++) {
      this.ang[i] += c.dt * 0.5 * (i === this.laggard ? 0.6 : 1);
      const j = this.scatter * (rnd((this.seed + i) | 0) - 0.5) * this.radius * 1.3;
      let ox = this.cx + Math.cos(this.ang[i]) * (rr + Math.abs(j));
      let oy = this.cy + Math.sin(this.ang[i]) * (rr + Math.abs(j));
      if (g > 0) {                                     // greeting: sweep into a committed row
        const fm = smooth(g / 1.2);
        const row = this.cx + (i - 2) * (this.radius * 0.34);
        ox = this.gsx[i] + (row - this.gsx[i]) * fm;
        oy = this.gsy[i] + (this.cy - this.gsy[i]) * fm;
      }
      this.nx[i] = ox; this.ny[i] = oy;
    }
    this.x = this.cx; this.y = this.cy;
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const g = c.greeting;
    // faint arcs between consecutive nodes (5 lines), brightened where the commit pulse rides
    for (let i = 0; i < this.N; i++) {
      const k = (i + 1) % this.N;
      const near = this.commit > 0 ? clamp(1 - Math.abs(this.commit - (i + 0.5)), 0, 1) : 0;
      this.seg(cam, out, this.nx[i], this.ny[i], this.nx[k], this.ny[k], 1.2, 0.2 + near * 0.6,
        (0.18 + near * 0.5) * (0.5 + this.glow * 0.5));
    }
    for (let i = 0; i < this.N; i++) {
      const isLead = i === this.leader, isLag = i === this.laggard;
      // greeting: pulse sweeps the row, first four (the majority) commit bright, laggard stays dim
      const gp = g > 0 ? clamp(1 - Math.abs(g - 1.5 - i * 0.35), 0, 1) : 0;
      let br = (isLead ? 0.9 : 0.55) * (isLag ? 0.5 : 1);
      br += clamp(1 - Math.abs((this.commit || -9) - i), 0, 1) * 0.5;
      if (g > 0) br = isLag ? 0.35 : Math.max(br, 0.55 + gp * 0.5);
      br = clamp(br + this.glow * 0.3 + this.redPulse(c) * 0.4, 0, 1);
      this.dot(cam, out, this.nx[i], this.ny[i], isLead ? 5 : 3.5, br * 0.7, 0.85 * br);
      this.dot(cam, out, this.nx[i], this.ny[i], isLead ? 9 : 6, 0.05, 0.28 * br);
      if (isLead) for (let t = 0; t < 6; t++) {        // leader tick-halo
        const a = (t / 6) * TAU + c.time * 0.8;
        this.dot(cam, out, this.nx[i] + Math.cos(a) * 12, this.ny[i] + Math.sin(a) * 12, 1.4, 0.5, 0.5);
      }
    }
  }
}

// 2. kitty-run — SHY. fast low loops with jitter + hops, pink streak trail; dash-dodges
//    sideways when the lantern nears, never letting the light touch it. budget: ~17 points, ~13 lines.
class KittyCreature extends Creature {
  private readonly T = 14;
  private tx = new Float32Array(this.T);
  private ty = new Float32Array(this.T);
  private head = 0; private rec = 0;
  private loop = 0; private hopT = 1.5; private hop = 0;
  private dvx = 0; private dvy = 0;
  private trailInit = false;

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s); this.leanSign = -1; this.loop = rnd(s) * TAU;
  }

  protected updateMotion(c: CreatureContext): void {
    if (!this.trailInit) {
      // seed the ring at the live anchor, not at the raw fx/fy fraction — a
      // fraction is ~1 world px, which reads as a stray hairline to the corner
      // until the ring cycles.
      this.trailInit = true;
      for (let i = 0; i < this.T; i++) { this.tx[i] = this.ax; this.ty[i] = this.ay; }
    }
    if (c.reduced) { this.x = this.ax; this.y = this.ay; return; }   // hold near anchor
    const g = c.greeting;
    this.loop += c.dt * (g > 0 && g < 3 ? 9 : 3.2);                  // greeting: fast sprint lap
    const rx = this.radius * 0.5, ry = this.radius * 0.22;
    let px = this.cx + Math.cos(this.loop) * rx + Math.sin(c.time * 23 + this.seed) * 4;
    let py = this.cy + Math.sin(this.loop * 2) * ry + Math.cos(c.time * 19 + this.seed) * 3;
    // hops (two quick ones during greeting)
    this.hopT -= c.dt;
    const gHop = g > 3 && (Math.abs(g - 3.5) < 0.12 || Math.abs(g - 4.4) < 0.12);
    if (this.hopT <= 0 || gHop) { this.hopT = 1.4 + rnd((this.seed + this.head) | 0) * 1.8; this.hop = 1; }
    this.hop = Math.max(0, this.hop - c.dt * 3);
    py -= Math.sin(this.hop * Math.PI) * this.radius * 0.28;
    // dash-dodge: keep the light off it
    const ld = Math.hypot(c.lantern.x - px, c.lantern.y - py);
    if (ld < this.radius * 0.4 && Math.hypot(this.dvx, this.dvy) < 2) {
      const ax = px - c.lantern.x, ay = py - c.lantern.y, m = Math.hypot(ax, ay) || 1;
      this.dvx = (-ay / m) * 26 * (rnd(this.seed | 0) > 0.5 ? 1 : -1) + (ax / m) * 14;
      this.dvy = (ax / m) * 26 * (rnd((this.seed + 1) | 0) > 0.5 ? 1 : -1) + (ay / m) * 14;
    }
    px += this.dvx; py += this.dvy; this.dvx *= 0.86; this.dvy *= 0.86;
    this.x = px; this.y = py;
    this.rec += c.dt; if (this.rec > 0.03) { this.rec = 0; this.tx[this.head] = px; this.ty[this.head] = py; this.head = (this.head + 1) % this.T; }
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    if (c.reduced) { this.dot(cam, out, this.ax, this.ay, 3.5, 0.4 + this.redPulse(c) * 0.4, 0.8); return; }
    for (let i = 0; i < this.T - 1; i++) {              // pink streak trail, fading by age
      const a = (this.head - 1 - i + this.T * 2) % this.T, b = (a - 1 + this.T) % this.T;
      const f = 1 - i / this.T;
      this.seg(cam, out, this.tx[a], this.ty[a], this.tx[b], this.ty[b], 2 * f, 0.15, 0.5 * f * f);
    }
    const br = clamp(0.6 + this.glow * 0.4, 0, 1);
    this.dot(cam, out, this.x, this.y, 4, 0.55, br);     // cat-presence core
    this.dot(cam, out, this.x, this.y, 7, 0.1, 0.3 * br);
  }
}

// 3. explosion — a dense breathing knot (~72 particles); jiggles, pops embers that fall
//    back; calling compresses+brightens; greeting detonates then re-accretes. budget: ~74 points, ~24 lines.
class ExplosionCreature extends Creature {
  private readonly N = 72;
  private ox = new Float32Array(this.N); private oy = new Float32Array(this.N);
  private vx = new Float32Array(this.N); private vy = new Float32Array(this.N);
  private ba = new Float32Array(this.N); private br = new Float32Array(this.N);
  private popT = 1;

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    for (let i = 0; i < this.N; i++) { this.ba[i] = rnd((s + i) | 0) * TAU; this.br[i] = Math.sqrt(rnd((s + i + 99) | 0)); }
  }

  protected greetStart(c: CreatureContext): void {
    if (c.reduced) return;                              // reduced greeting = pulse only
    for (let i = 0; i < this.N; i++) {                  // detonation: radial impulse + spark
      const sp = 180 + rnd((this.seed + i + 7) | 0) * 220;
      this.vx[i] = Math.cos(this.ba[i]) * sp; this.vy[i] = Math.sin(this.ba[i]) * sp;
    }
  }

  protected updateMotion(c: CreatureContext): void {
    this.x = this.cx; this.y = this.cy;
    if (c.reduced) { for (let i = 0; i < this.N; i++) { this.ox[i] = 0; this.oy[i] = 0; } return; }
    const comp = c.calling ? 0.6 : 1;                   // calling charges/compresses the knot
    const kk = this.radius * 0.3 * comp;
    this.popT -= c.dt;
    if (this.popT <= 0) {                               // occasionally pop 2-3 embers
      this.popT = 0.8 + rnd((this.seed + (c.time | 0)) | 0) * 1.4;
      for (let p = 0; p < 3; p++) {
        const i = (rnd((this.seed + p + (c.time * 60 | 0)) | 0) * this.N) | 0;
        this.vx[i] += Math.cos(this.ba[i]) * 90; this.vy[i] += Math.sin(this.ba[i]) * 90;
      }
    }
    for (let i = 0; i < this.N; i++) {                  // spring each ember to its knot slot
      const jig = 1 + Math.sin(c.time * 3 + i) * 0.06;
      const tx = Math.cos(this.ba[i]) * this.br[i] * kk * jig;
      const ty = Math.sin(this.ba[i]) * this.br[i] * kk * jig;
      this.vx[i] += ((tx - this.ox[i]) * 9 - this.vx[i] * 3) * c.dt;
      this.vy[i] += ((ty - this.oy[i]) * 9 - this.vy[i] * 3) * c.dt;
      this.ox[i] += this.vx[i] * c.dt; this.oy[i] += this.vy[i] * c.dt;
    }
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const glow = clamp(this.glow + (c.calling ? 0.3 : 0) + this.redPulse(c) * 0.5, 0, 1);
    this.dot(cam, out, this.x, this.y, 10, 0.15, 0.35 * (0.5 + glow * 0.5));   // core bloom
    let trails = 24;
    for (let i = 0; i < this.N; i++) {
      const px = this.cx + this.ox[i], py = this.cy + this.oy[i];
      const sp = Math.hypot(this.vx[i], this.vy[i]);
      this.dot(cam, out, px, py, 2.2, 0.4 + glow * 0.4, 0.85);
      if (sp > 120 && trails-- > 0) {                   // spark trails on fast embers
        this.seg(cam, out, px, py, px - this.vx[i] * 0.03, py - this.vy[i] * 0.03, 1.4, 0.5, 0.5);
      }
    }
  }
}

// 4. spine — a rigid column of ~7 rounded segments swaying; greeting reflows through
//    column -> L -> grid -> row -> column. budget: ~14 points, 6 lines.
class SpineCreature extends Creature {
  private readonly S = 7;
  private lay = new Float32Array(5 * this.S * 2);       // 5 layouts x 7 segments x (x,y)
  private cxs = new Float32Array(this.S); private cys = new Float32Array(this.S);

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    const st = r * 0.22;
    for (let i = 0; i < this.S; i++) {
      this.set(0, i, 0, (i - 3) * st);                                    // column
      this.set(1, i, i < 4 ? 0 : (i - 3) * st, i < 4 ? (i - 3) * st : st); // L-shape
      this.set(2, i, ((i % 3) - 1) * st, (((i / 3) | 0) - 1) * st);        // grid
      this.set(3, i, (i - 3) * st, 0);                                    // row
      this.set(4, i, 0, (i - 3) * st);                                    // column
      this.cxs[i] = 0; this.cys[i] = (i - 3) * st;
    }
  }
  private set(l: number, i: number, x: number, y: number): void { const o = (l * this.S + i) * 2; this.lay[o] = x; this.lay[o + 1] = y; }

  protected updateMotion(c: CreatureContext): void {
    this.x = this.cx; this.y = this.cy;
    const g = c.greeting;
    const li = g > 0 && !c.reduced ? clamp((g / 1.2) | 0, 0, 4) : 0;       // greeting picks a layout
    for (let i = 0; i < this.S; i++) {
      const o = (li * this.S + i) * 2;
      let tx = this.lay[o], ty = this.lay[o + 1];
      if (li === 0 && !c.reduced) tx += Math.sin(c.time * 0.9 + i * 0.5) * this.radius * 0.06 * (i + 1) / this.S;
      const k = Math.min(1, c.dt * (g > 0 ? 12 : 5));                      // fast move-then-settle
      this.cxs[i] += (tx - this.cxs[i]) * k; this.cys[i] += (ty - this.cys[i]) * k;
    }
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const br = clamp(0.5 + this.glow * 0.4 + this.redPulse(c) * 0.4, 0, 1);
    for (let i = 0; i < this.S - 1; i++)
      this.seg(cam, out, this.cx + this.cxs[i], this.cy + this.cys[i],
        this.cx + this.cxs[i + 1], this.cy + this.cys[i + 1], 3, 0.2, 0.4 * br);
    for (let i = 0; i < this.S; i++) {
      this.dot(cam, out, this.cx + this.cxs[i], this.cy + this.cys[i], 4, 0.4, 0.85 * br);
      this.dot(cam, out, this.cx + this.cxs[i], this.cy + this.cys[i], 7, 0.05, 0.25 * br);
    }
  }
}

// 5. evening-forest — a slow warm haze of large faint amber motes drifting upward; exhales
//    a puff every ~5s; greeting is one big exhale of three slow concentric rings. budget: ~42 points, 0 lines.
class ForestCreature extends Creature {
  private readonly M = 42;
  private mx = new Float32Array(this.M); private my = new Float32Array(this.M);
  private ml = new Float32Array(this.M); private ms = new Float32Array(this.M);
  private puff = 3;

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    for (let i = 0; i < this.M; i++) this.respawn(i, rnd((s + i) | 0));
  }
  private respawn(i: number, r0: number): void {
    this.mx[i] = (r0 - 0.5) * this.radius * 1.2;
    this.my[i] = this.radius * 0.7 + r0 * this.radius * 0.4;
    this.ml[i] = 4 + rnd((this.seed + i * 3) | 0) * 4;
    this.ms[i] = 6 + rnd((this.seed + i * 7) | 0) * 8;
  }

  protected updateMotion(c: CreatureContext): void {
    this.x = this.cx; this.y = this.cy;
    if (c.reduced || c.greeting > 0) return;             // reduced hovers; greeting drawn in emit
    this.puff -= c.dt;
    const rise = 1 + (this.puff < 0.5 ? 2 : 0);          // periodic dispersing exhale
    if (this.puff <= 0) this.puff = 5;
    for (let i = 0; i < this.M; i++) {
      this.my[i] -= (8 + this.ms[i] * 0.4) * rise * c.dt;
      this.mx[i] += Math.sin(c.time * 0.5 + i) * 4 * c.dt;
      this.ml[i] -= c.dt;
      if (this.ml[i] <= 0 || this.my[i] < -this.radius) this.respawn(i, rnd((this.seed + i + (c.time * 10 | 0)) | 0));
    }
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const g = c.greeting;
    if (g > 0 && !c.reduced) {                           // greeting: three slow concentric rings
      for (let i = 0; i < this.M; i++) {
        const ring = i % 3, ph = g - ring * 0.6;
        if (ph < 0) continue;
        const rad = ph * this.radius * 0.5, a = (i / this.M) * TAU;
        const fade = clamp(1 - ph / 3.5, 0, 1);
        this.dot(cam, out, this.cx + Math.cos(a) * rad, this.cy + Math.sin(a) * rad,
          this.ms[i] * 0.5, 0.2, 0.5 * fade);
      }
      return;
    }
    if (c.reduced) {                                     // reduced: hold the haze, breathe
      for (let i = 0; i < this.M; i++)
        this.dot(cam, out, this.cx + this.mx[i], this.cy + this.my[i],
          this.ms[i] * 0.5, 0.12, 0.3 * (0.6 + this.breath * 0.4));
      return;
    }
    for (let i = 0; i < this.M; i++) {                   // large faint amber motes, fading with life
      const life = clamp(this.ml[i] / 4, 0, 1);
      this.dot(cam, out, this.cx + this.mx[i], this.cy + this.my[i],
        this.ms[i] * 0.5, 0.15 + this.glow * 0.2, 0.32 * life * (0.7 + this.breath * 0.3));
    }
  }
}

// 6. planck-to-now — a point inflating to a nebula on a ~40s cycle: dense dot -> fast
//    inflation into a log-spiral of 100 motes -> slow rotation + dissipation -> collapse.
//    greeting: fast-forward one full cycle in 2s. budget: ~101 points, 0 lines.
class PlanckCreature extends Creature {
  private readonly N = 100;
  private sr = new Float32Array(this.N);               // spiral radius factor 0..1
  private sa = new Float32Array(this.N);               // spiral base angle
  private cycle = 0;                                   // 0..1 phase of the 40s cycle

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    for (let i = 0; i < this.N; i++) {                 // log-spiral: angle grows, radius follows e^(k*angle)
      const t = i / this.N, ang = t * TAU * 3.2;
      this.sa[i] = ang; this.sr[i] = Math.pow(t, 0.7);
    }
  }

  protected updateMotion(c: CreatureContext): void {
    this.x = this.cx; this.y = this.cy;
    if (c.reduced) return;                              // reduced: freeze phase, breathe in emit
    if (c.greeting > 0) { this.cycle = clamp(c.greeting / 2, 0, 1); return; }  // fast-forward one cycle in 2s
    this.cycle += c.dt / 40; if (this.cycle >= 1) this.cycle -= 1;
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    // phase map: [0,0.1] dense dot; [0.1,0.35] fast inflation; [0.35,0.8] rotate+dissipate; [0.8,1] collapse
    const p = c.reduced ? 0.5 : this.cycle;
    let scale: number, rot: number, disp: number, core: number;
    if (p < 0.1) { scale = smooth(p / 0.1) * 0.15; rot = 0; disp = 0; core = 1; }
    else if (p < 0.35) { scale = 0.15 + smooth((p - 0.1) / 0.25) * 0.85; rot = 0; disp = 0; core = 1 - smooth((p - 0.1) / 0.25); }
    else if (p < 0.8) { const q = (p - 0.35) / 0.45; scale = 1; rot = q * TAU * 0.6; disp = q * 0.3; core = 0.1; }
    else { const q = smooth((p - 0.8) / 0.2); scale = 1 - q; rot = TAU * 0.6; disp = 0.3 * (1 - q); core = q; }
    const R = this.radius * 0.7;
    const br = clamp(0.4 + this.glow * 0.4 + this.redPulse(c) * 0.4, 0, 1);
    this.dot(cam, out, this.cx, this.cy, 3 + core * 8, core, (0.3 + core * 0.6) * br);  // core / singularity
    if (p < 0.1) return;                                // dense dot: only the core shows
    for (let i = 0; i < this.N; i++) {
      const rad = this.sr[i] * scale * R + disp * R * rnd((this.seed + i) | 0);
      const a = this.sa[i] + rot;
      const fade = clamp(1 - disp, 0.15, 1);
      this.dot(cam, out, this.cx + Math.cos(a) * rad, this.cy + Math.sin(a) * rad,
        2, 0.2 + this.glow * 0.2, 0.6 * fade * br);
    }
  }
}

// 7. practice-map — a constellation: ~9 fixed bright stars + faint blue route polylines;
//    2-3 routes live, a bright pulse travels each, travelled segment stays briefly lit, stale
//    routes fade. greeting: one route through ALL stars in sequence. budget: ~18 points, ~12 lines.
class MapCreature extends Creature {
  private readonly S = 9;
  private stx = new Float32Array(this.S); private sty = new Float32Array(this.S);
  private readonly R = 3;                              // live routes
  private ra = new Int32Array(this.R); private rb = new Int32Array(this.R);
  private rp = new Float32Array(this.R);              // pulse position 0..1
  private rf = new Float32Array(this.R);              // stale fade 0..1
  private rl = new Float32Array(this.R);              // "lit" afterglow 0..1
  private spawn = 0;
  private starPulse = new Float32Array(this.S);

  constructor(id: string, hue: readonly [number, number, number], fx: number, fy: number, r: number, s: number) {
    super(id, hue, fx, fy, r, s);
    for (let i = 0; i < this.S; i++) {                 // deterministic loose scatter around anchor
      const a = rnd((s + i) | 0) * TAU, d = (0.25 + rnd((s + i + 40) | 0) * 0.7) * r * 0.6;
      this.stx[i] = Math.cos(a) * d; this.sty[i] = Math.sin(a) * d;
    }
    for (let k = 0; k < this.R; k++) { this.ra[k] = k; this.rb[k] = (k + 3) % this.S; this.rp[k] = 1; this.rf[k] = 0; }
  }

  protected updateMotion(c: CreatureContext): void {
    this.x = this.cx; this.y = this.cy;
    for (let i = 0; i < this.S; i++) this.starPulse[i] = Math.max(0, this.starPulse[i] - c.dt * 2);
    if (c.reduced || c.greeting > 0) return;           // reduced holds; greeting drawn in emit
    this.spawn -= c.dt;
    if (this.spawn <= 0) {                             // retire the stalest route, draw a fresh one
      this.spawn = 1.3;
      let worst = 0; for (let k = 1; k < this.R; k++) if (this.rf[k] > this.rf[worst]) worst = k;
      const seed = (this.seed + (c.time * 30 | 0)) | 0;
      this.ra[worst] = (rnd(seed) * this.S) | 0;
      this.rb[worst] = (this.ra[worst] + 1 + ((rnd(seed + 1) * (this.S - 1)) | 0)) % this.S;
      this.rp[worst] = 0; this.rf[worst] = 0; this.rl[worst] = 0;
    }
    for (let k = 0; k < this.R; k++) {
      if (this.rp[k] < 1) {                            // pulse travels the route
        this.rp[k] = Math.min(1, this.rp[k] + c.dt * 0.8);
        this.rl[k] = 1;
        if (this.rp[k] >= 1) this.starPulse[this.rb[k]] = 1;
      } else this.rl[k] = Math.max(0, this.rl[k] - c.dt * 0.4);   // lit segment fades
      this.rf[k] = Math.min(1, this.rf[k] + c.dt * 0.25);
    }
  }

  protected emitBody(c: CreatureContext, cam: CameraView, out: Emitter): void {
    const g = c.greeting;
    if (g > 0 && !c.reduced) {                          // greeting: one route threads ALL stars in order
      const seg = clamp(g / 0.55, 0, this.S - 1);       // which segment the line has reached
      for (let i = 0; i < this.S - 1; i++) {
        const f = clamp(seg - i, 0, 1);
        if (f <= 0) break;
        this.seg(cam, out, this.cx + this.stx[i], this.cy + this.sty[i],
          this.cx + this.stx[i] + (this.stx[i + 1] - this.stx[i]) * f,
          this.cy + this.sty[i] + (this.sty[i + 1] - this.sty[i]) * f, 1.6, 0.4, 0.7);
        if (f >= 1) this.starPulse[i + 1] = 1;
      }
    } else {
      for (let k = 0; k < this.R; k++) {                // faint blue routes + travelling pulse
        const ax = this.cx + this.stx[this.ra[k]], ay = this.cy + this.sty[this.ra[k]];
        const bx = this.cx + this.stx[this.rb[k]], by = this.cy + this.sty[this.rb[k]];
        const base = 0.12 * (1 - this.rf[k]) + this.rl[k] * 0.4;
        this.seg(cam, out, ax, ay, bx, by, 1.4, 0.1, base);
        if (this.rp[k] < 1) {                           // bright pulse riding the segment
          const px = ax + (bx - ax) * this.rp[k], py = ay + (by - ay) * this.rp[k];
          this.dot(cam, out, px, py, 2.4, 0.6, 0.8);
        }
      }
    }
    const rp = this.redPulse(c);
    for (let i = 0; i < this.S; i++) {                  // the fixed bright stars
      const pl = this.starPulse[i];
      const br = clamp(0.55 + pl * 0.45 + this.glow * 0.3 + rp * 0.4, 0, 1);
      this.dot(cam, out, this.cx + this.stx[i], this.cy + this.sty[i], 2.6 + pl * 2, 0.5 + pl * 0.4, 0.9 * br);
      if (pl > 0.1) this.dot(cam, out, this.cx + this.stx[i], this.cy + this.sty[i], 6, 0.1, 0.3 * pl);
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
