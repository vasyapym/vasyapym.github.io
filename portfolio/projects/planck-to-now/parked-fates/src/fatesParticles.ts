import * as THREE from "three";
import { FateIntegrator, type FateMode, type Substep } from "./fates.ts";

// Fate-of-the-universe particle engine. Physical position of a bound
// particle is a·x_halo + d, with d a bounded physical offset integrated by
// kick-drift-kick under the cosmological tide; free particles store a
// comoving position and take the exact Hubble stretch at render time, so
// the substep pass never touches them. State lives in two RGBA32F MRT
// targets (ping-pong); the CPU never reads them back.

export type V3 = [number, number, number];

/* ── seeded PRNG ─────────────────────────────────────────────────────── */

export interface Rng {
  next(): number;
  gauss(): number;
  unit(): V3;
}

export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = (): number => {
    const u = 1 - next();
    const v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const unit = (): V3 => {
    const z = 2 * next() - 1;
    const phi = 2 * Math.PI * next();
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    return [r * Math.cos(phi), r * Math.sin(phi), z];
  };
  return { next, gauss, unit };
}

/* ── state packing (pos.w): sign encodes bound, magnitude the halo id ── */

export interface ParticleState {
  haloId: number;
  bound: boolean;
  dead: boolean;
}

export function packState(haloId: number, bound: boolean): number {
  if (haloId < 0 || haloId >= 16777215 || !Number.isInteger(haloId)) {
    throw new RangeError(`haloId out of packable range: ${haloId}`);
  }
  return bound ? haloId + 1 : -(haloId + 1);
}

export const PACK_DEAD = 0;

export function unpackState(w: number): ParticleState {
  if (w === 0) return { haloId: -1, bound: false, dead: true };
  const id = Math.round(Math.abs(w)) - 1;
  return { haloId: id, bound: w > 0, dead: false };
}

/* ── halo seeding & membership ───────────────────────────────────────── */

export interface Halo {
  x: number;
  y: number;
  z: number;
  weight: number;
  members: number;
  gm: number;
}

export interface SeedHaloParams {
  count: number;
  box: number;
  paretoIndex?: number;
  maxWeightRatio?: number;
}

export function seedHalos(p: SeedHaloParams, rng: Rng): Halo[] {
  const alpha = p.paretoIndex ?? 1.1;
  const halos: Halo[] = [];
  for (let i = 0; i < p.count; i++) {
    const u = Math.max(rng.next(), 1e-9);
    halos.push({
      x: (rng.next() - 0.5) * p.box,
      y: (rng.next() - 0.5) * p.box,
      z: (rng.next() - 0.5) * p.box,
      weight: Math.pow(u, -1 / alpha),
      members: 0,
      gm: 0,
    });
  }
  // Cap weights relative to the median so one halo cannot eat the field.
  const sorted = halos.map((h) => h.weight).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 1;
  const cap = median * (p.maxWeightRatio ?? 60);
  for (const h of halos) h.weight = Math.min(h.weight, cap);
  return halos;
}

// Largest-remainder apportionment: membership totals exactly match the
// bound-particle count, deterministically.
export function assignHalos(
  particleCount: number,
  halos: Halo[],
  freeFraction: number,
): Int32Array {
  if (freeFraction < 0 || freeFraction > 1) {
    throw new RangeError("freeFraction ∈ [0,1]");
  }
  const out = new Int32Array(particleCount).fill(-1);
  const nBound =
    halos.length === 0 ? 0 : Math.round(particleCount * (1 - freeFraction));
  const wsum = halos.reduce((s, h) => s + h.weight, 0);

  const quotas = halos.map((h) => (nBound * h.weight) / wsum);
  const floors = quotas.map((q) => Math.floor(q));
  let assigned = floors.reduce((s, f) => s + f, 0);
  const order = quotas
    .map((q, i) => ({ i, r: q - Math.floor(q) }))
    .sort((a, b) => b.r - a.r || a.i - b.i);
  for (let k = 0; assigned < nBound && k < order.length; k++) {
    const idx = order[k];
    floors[idx.i] += 1;
    assigned++;
  }

  let cursor = 0;
  halos.forEach((h, i) => {
    const n = floors[i];
    h.members = n;
    out.fill(i, cursor, cursor + n);
    cursor += n;
  });
  return out;
}

// GM ∝ membership, normalised so the most massive halo cores at omegaMax.
export function haloGM(halos: Halo[], omegaMax: number, eps: number): void {
  const nMax = halos.reduce((m, h) => Math.max(m, h.members), 0);
  const gmMax = omegaMax * omegaMax * eps * eps * eps;
  for (const h of halos) h.gm = nMax > 0 ? (gmMax * h.members) / nMax : 0;
}

/* ── pure physics helpers (mirrored exactly by the substep shader) ───── */

// d̈ = A·d − GM·d/(|d|²+ε²)^{3/2}
export function tidalAccel(d: V3, A: number, gm: number, eps: number): V3 {
  const r2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2] + eps * eps;
  const k = A - gm / (r2 * Math.sqrt(r2));
  return [k * d[0], k * d[1], k * d[2]];
}

// Kick-drift-kick with the tide held at its substep-begin/end values —
// symplectic for a position-only force, no secular energy drift.
export function verletStep(
  d: V3,
  v: V3,
  dt: number,
  A0: number,
  A1: number,
  gm: number,
  eps: number,
): { d: V3; v: V3 } {
  let acc = tidalAccel(d, A0, gm, eps);
  const vh: V3 = [
    v[0] + 0.5 * dt * acc[0],
    v[1] + 0.5 * dt * acc[1],
    v[2] + 0.5 * dt * acc[2],
  ];
  const d1: V3 = [d[0] + dt * vh[0], d[1] + dt * vh[1], d[2] + dt * vh[2]];
  acc = tidalAccel(d1, A1, gm, eps);
  const v1: V3 = [
    vh[0] + 0.5 * dt * acc[0],
    vh[1] + 0.5 * dt * acc[1],
    vh[2] + 0.5 * dt * acc[2],
  ];
  return { d: d1, v: v1 };
}

export interface UnbindResult {
  free: boolean;
  /** comoving position after absorbing the halo offset, when freed */
  x?: V3;
}

// Unbind: tide beats Plummer gravity beyond 3 scale radii while expanding.
// The halo offset is absorbed into a comoving position so the freed
// particle's state stays self-contained (x_halo no longer participates).
export function unbind(
  d: V3,
  xHalo: V3,
  a: number,
  A: number,
  gm: number,
  eps: number,
): UnbindResult {
  const r2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
  if (!(r2 > 9 * eps * eps) || !(A > 0)) return { free: false };
  const s = r2 + eps * eps;
  if (!(A * s * Math.sqrt(s) > gm)) return { free: false };
  return {
    free: true,
    x: [xHalo[0] + d[0] / a, xHalo[1] + d[1] / a, xHalo[2] + d[2] / a],
  };
}

/* ── CPU seeding of the initial GPU state ────────────────────────────── */

export interface TexLayout {
  width: number;
  height: number;
  texels: number;
}

export function layoutFor(count: number, width = 512): TexLayout {
  const height = Math.max(1, Math.ceil(count / width));
  return { width, height, texels: width * height };
}

export interface SeedParticlesParams {
  particleCount: number;
  halos: Halo[];
  assignment: Int32Array;
  eps: number;
  box: number;
}

export interface SeededState {
  layout: TexLayout;
  pos: Float32Array;
  vel: Float32Array;
}

// Plummer radius sample, truncated so initial |d| stays inside the unbind
// radius (no spurious release at t=0).
export function samplePlummerRadius(u: number, eps: number, rMax: number): number {
  const uu = Math.min(Math.max(u, 1e-6), 1 - 1e-6);
  return Math.min(eps / Math.sqrt(Math.pow(uu, -2 / 3) - 1), rMax);
}

export function seedParticles(p: SeedParticlesParams, rng: Rng): SeededState {
  const layout = layoutFor(p.particleCount);
  const pos = new Float32Array(layout.texels * 4); // zeros ⇒ dead padding texels
  const vel = new Float32Array(layout.texels * 4);
  const nMax = p.halos.reduce((m, h) => Math.max(m, h.members), 0) || 1;

  for (let i = 0; i < p.particleCount; i++) {
    const hid = p.assignment[i] ?? -1;
    const o = i * 4;
    if (hid < 0) {
      // Free from birth: comoving position, rendered as a·x.
      pos[o] = (rng.next() - 0.5) * p.box;
      pos[o + 1] = (rng.next() - 0.5) * p.box;
      pos[o + 2] = (rng.next() - 0.5) * p.box;
      pos[o + 3] = packState(0, false);
      vel[o + 3] = 0;
      continue;
    }
    const h = p.halos[hid];
    if (!h) throw new Error(`assignment references missing halo ${hid}`);
    const r = samplePlummerRadius(rng.next(), p.eps, 2.5 * p.eps);
    const n = rng.unit();
    const d: V3 = [r * n[0], r * n[1], r * n[2]];
    // Circular speed in the Plummer potential, random plane, virial-ish scale.
    const s2 = r * r + p.eps * p.eps;
    const vc = Math.sqrt((h.gm * r * r) / (s2 * Math.sqrt(s2)));
    const t = rng.unit();
    const dot = t[0] * n[0] + t[1] * n[1] + t[2] * n[2];
    let tx = t[0] - dot * n[0],
      ty = t[1] - dot * n[1],
      tz = t[2] - dot * n[2];
    const tl = Math.hypot(tx, ty, tz) || 1;
    tx /= tl;
    ty /= tl;
    tz /= tl;
    const vf = 0.7 + 0.3 * rng.next();
    pos[o] = d[0];
    pos[o + 1] = d[1];
    pos[o + 2] = d[2];
    pos[o + 3] = packState(hid, true);
    vel[o] = vf * vc * tx;
    vel[o + 1] = vf * vc * ty;
    vel[o + 2] = vf * vc * tz;
    vel[o + 3] = h.members / nMax;
  }
  return { layout, pos, vel };
}

export function haloTextureData(halos: Halo[]): {
  layout: TexLayout;
  data: Float32Array;
} {
  const layout = layoutFor(halos.length, 64);
  const data = new Float32Array(layout.texels * 4);
  halos.forEach((h, i) => {
    data[i * 4] = h.x;
    data[i * 4 + 1] = h.y;
    data[i * 4 + 2] = h.z;
    data[i * 4 + 3] = h.gm;
  });
  return { layout, data };
}

/* ── shaders ─────────────────────────────────────────────────────────── */

const FULLSCREEN_VS = /* glsl */ `
precision highp float;
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// One texel = one particle. Dead (w=0) and free (w<0) texels early-out —
// free particles stretch exactly at render time, never here.
export const SUBSTEP_FS = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uPos;
uniform sampler2D uVel;
uniform sampler2D uHalo;
uniform ivec2 uHaloSize;
uniform float uDt;
uniform float uA0;
uniform float uA1;
uniform float uScale;
uniform float uEps2;
uniform float uUnbindR2;

layout(location = 0) out vec4 oPos;
layout(location = 1) out vec4 oVel;

vec4 haloFetch(int id) {
  return texelFetch(uHalo, ivec2(id % uHaloSize.x, id / uHaloSize.x), 0);
}

vec3 accel(vec3 d, float gm, float A) {
  float s = dot(d, d) + uEps2;
  return A * d - gm * d * inversesqrt(s * s * s);
}

void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 p = texelFetch(uPos, ij, 0);
  vec4 v = texelFetch(uVel, ij, 0);

  if (p.w <= 0.0) { oPos = p; oVel = v; return; }

  int id = int(p.w + 0.5) - 1;
  float gm = haloFetch(id).w;
  vec3 d = p.xyz;
  vec3 u = v.xyz;

  u += 0.5 * uDt * accel(d, gm, uA0);
  d += uDt * u;
  u += 0.5 * uDt * accel(d, gm, uA1);

  float r2 = dot(d, d);
  if (r2 > uUnbindR2 && uA1 > 0.0) {
    float s = r2 + uEps2;
    if (uA1 * s * sqrt(s) > gm) {
      vec3 x = haloFetch(id).xyz + d / uScale;
      oPos = vec4(x, -p.w);
      oVel = vec4(0.0, 0.0, 0.0, v.w);
      return;
    }
  }

  oPos = vec4(d, p.w);
  oVel = vec4(u, v.w);
}
`;

// Fate draw path: log-radial projection + per-fate grading. Never forms
// proper positions: comoving offsets from the camera are rescaled by their
// max component (float32-safe at a=10²⁶), and the proper distance lives in
// log space (lna + ln m + ln|u|) until the mapping compresses it.
const RENDER_VS = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uPos;
uniform sampler2D uHalo;
uniform ivec2 uTexSize;
uniform ivec2 uHaloSize;
uniform float uLnA;
uniform float uRho0;
uniform float uH;
uniform float uPointSize;
uniform float uViewportH;
uniform int uFate;
uniform float uDecay;
uniform float uRipA;
uniform vec3 uVacTint;
uniform float uVacMix;

out vec3 vCol;
out float vAlpha;

const vec3 AMBER = vec3(1.00, 0.72, 0.35);
const vec3 CREAM = vec3(1.00, 0.93, 0.80);
const vec3 EMBER = vec3(0.85, 0.28, 0.08);
const float LN10 = 2.302585093;

float hash11(float n) { return fract(sin(n) * 43758.5453123); }
vec3 hash31(float n) {
  return vec3(hash11(n), hash11(n + 17.1), hash11(n + 61.7)) * 2.0 - 1.0;
}

// Crude Planckian ramp on log10(T): dark ember → amber-white.
vec3 blackbody(float T) {
  float l = log(max(T, 1.0)) / LN10;
  vec3 c = mix(EMBER, AMBER, smoothstep(2.9, 3.25, l));
  return mix(c, vec3(1.0), smoothstep(3.25, 3.6, l));
}

void main() {
  int id = gl_VertexID;
  vec4 p = texelFetch(uPos, ivec2(id % uTexSize.x, id / uTexSize.x), 0);
  if (p.w == 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vCol = vec3(0.0);
    vAlpha = 0.0;
    return;
  }

  bool bound = p.w > 0.0;
  vec3 d = p.xyz;
  vec3 rc = bound
    ? (texelFetch(uHalo, ivec2((int(abs(p.w) + 0.5) - 1) % uHaloSize.x,
                               (int(abs(p.w) + 0.5) - 1) / uHaloSize.x), 0).xyz - uCamC)
      + d * exp(-uLnA)
    : p.xyz - uCamC;

  // Big-rip fragmentation: bound offsets inflate and jitter as the tide wins.
  if (uFate == 2 && bound) {
    float frag = smoothstep(0.30, 0.70, uRipA);
    vec3 jit = hash31(float(id)) * frag;
    rc += (d * (8.0 * frag) + jit * length(d)) * exp(-uLnA);
  }

  float m = max(max(abs(rc.x), abs(rc.y)), abs(rc.z));
  m = max(m, 1e-30);
  vec3 u = rc / m;
  float lu = length(u);
  vec3 dir = u / lu;
  float lnRho = uLnA + log(m) + log(lu);

  float t = lnRho - log(uRho0);
  float s = uRho0 * (t <= 0.0 ? exp(t) : 1.0 + t);

  float DH = exp(min(lnRho + log(uH), 20.0));

  vec4 mv = uView * vec4(uCamC + dir * s, 1.0);
  gl_Position = uProj * mv;

  vec3 col = bound ? AMBER : CREAM;
  float bright = bound ? 1.0 : 0.6;
  float size = uPointSize;

  if (uFate == 1) {
    // Heat death: horizon fade, redshifted size, ember cooling.
    float x = max(1.0 - DH, 0.0);
    bright *= x * x * x * x * uDecay;
    size *= 1.0 / (1.0 + DH);
    col = mix(col, EMBER, 0.5 * (1.0 - uDecay));
  } else if (uFate == 2) {
    // Big rip: fragmentation brightening, whiteout at the end.
    float frag = smoothstep(0.30, 0.70, uRipA);
    float white = smoothstep(0.70, 1.00, uRipA);
    bright *= 1.0 + 2.0 * frag + 6.0 * white;
    col = mix(col, vec3(1.0), white);
    size *= 1.0 + 2.0 * white;
  } else if (uFate == 3) {
    // Big crunch: blackbody heating, whiteout below a = 1e-3.
    float T = 2.7 * exp(-uLnA);
    float glow = smoothstep(2.9, 3.6, log(max(T, 1.0)) / LN10);
    float white = smoothstep(-6.5, -7.0, uLnA);
    col = mix(col, blackbody(T), glow);
    col = mix(col, vec3(1.0), white);
    bright *= 1.0 + 4.0 * glow + 8.0 * white;
  } else if (uFate == 4) {
    // Vacuum decay placeholder: interior tint only (wall = later brief).
    col = mix(col, uVacTint, uVacMix);
  }

  float persp = uProj[1][1] * uViewportH * 0.5 / max(-mv.z, 1e-3);
  gl_PointSize = clamp(size * persp * 0.02, 1.0, 48.0);

  vCol = col;
  vAlpha = clamp(bright, 0.0, 12.0);
}
`;

const RENDER_FS = /* glsl */ `
precision highp float;
in vec3 vCol;
in float vAlpha;
layout(location = 0) out vec4 fragColor;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float fall = exp(-4.0 * r2) * (1.0 - r2);
  fragColor = vec4(vCol * vAlpha * fall, 1.0);
}
`;

// TS mirrors of the draw-path math for node tests (float32-exact parity
// with the GLSL above).
export function logRadial(rho: number, lna: number, rho0 = 50): number {
  const f = Math.fround;
  const lnRho = f(f(lna) + f(Math.log(f(rho))));
  const t = f(lnRho - f(Math.log(f(rho0))));
  return f(f(rho0) * (t <= 0 ? f(Math.exp(t)) : f(1 + t)));
}

export function stableDir(rc: [number, number, number], lna: number): {
  dir: [number, number, number];
  lnRho: number;
} {
  const f = Math.fround;
  const m = Math.max(Math.abs(rc[0]), Math.abs(rc[1]), Math.abs(rc[2]), 1e-30);
  const u = rc.map((v) => f(v / m)) as [number, number, number];
  const lu = f(Math.hypot(u[0], u[1], u[2]));
  return {
    dir: u.map((v) => f(v / lu)) as [number, number, number],
    lnRho: f(f(lna) + f(Math.log(m)) + f(Math.log(lu))),
  };
}

export function horizonBrightness(D: number, H: number, decay = 1): number {
  const f = Math.fround;
  const x = Math.max(f(1 - f(D * H)), 0);
  return f(f(f(x * x) * f(x * x)) * f(decay));
}

/* ── engine ──────────────────────────────────────────────────────────── */

export interface FateEngineParams {
  particleCount?: number;
  haloCount?: number;
  freeFraction?: number;
  eps?: number;
  omegaMax?: number;
  box?: number;
  seed?: number;
  omegaDtTarget?: number;
  maxPassesPerFrame?: number;
  pointSize?: number;
}

interface PingPong {
  rt: THREE.WebGLRenderTarget;
  pos: THREE.Texture;
  vel: THREE.Texture;
}

export class FateParticles {
  readonly points: THREE.Points;
  readonly particleCount: number;
  readonly eps: number;
  readonly omegaMax: number;

  private readonly renderer: THREE.WebGLRenderer;
  private integrator: FateIntegrator;
  private integratorMode: FateMode;
  private readonly halos: Halo[];
  private readonly layout: TexLayout;
  private readonly omegaDtTarget: number;
  private readonly maxPasses: number;
  private readonly simScene = new THREE.Scene();
  private readonly simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly simMaterial: THREE.RawShaderMaterial;
  private readonly renderMaterial: THREE.RawShaderMaterial;
  private readonly haloTex: THREE.DataTexture;
  private readonly initPos: THREE.DataTexture;
  private readonly initVel: THREE.DataTexture;
  private readonly targets: [PingPong, PingPong];
  private read: { pos: THREE.Texture; vel: THREE.Texture };
  private writeIndex = 0;

  constructor(renderer: THREE.WebGLRenderer, mode: FateMode, p: FateEngineParams = {}) {
    if (!renderer.capabilities.isWebGL2) {
      throw new Error("FateParticles requires WebGL2");
    }
    this.renderer = renderer;
    this.integratorMode = mode;
    this.particleCount = p.particleCount ?? 220_000;
    this.eps = p.eps ?? 0.004;
    this.omegaMax = p.omegaMax ?? 440;
    this.omegaDtTarget = p.omegaDtTarget ?? 0.15;
    this.maxPasses = p.maxPassesPerFrame ?? 32;
    const box = p.box ?? 1;
    const rng = mulberry32(p.seed ?? 1337);
    this.integrator = new FateIntegrator(mode);

    this.halos = seedHalos({ count: p.haloCount ?? 1500, box }, rng);
    const assignment = assignHalos(this.particleCount, this.halos, p.freeFraction ?? 0.35);
    haloGM(this.halos, this.omegaMax, this.eps);
    const seeded = seedParticles(
      { particleCount: this.particleCount, halos: this.halos, assignment, eps: this.eps, box },
      rng,
    );
    this.layout = seeded.layout;

    const mkData = (data: Float32Array, w: number, h: number): THREE.DataTexture => {
      const t = new THREE.DataTexture(data as unknown as ArrayBuffer, w, h, THREE.RGBAFormat, THREE.FloatType);
      t.minFilter = THREE.NearestFilter;
      t.magFilter = THREE.NearestFilter;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.generateMipmaps = false;
      t.needsUpdate = true;
      return t;
    };
    this.initPos = mkData(seeded.pos, this.layout.width, this.layout.height);
    this.initVel = mkData(seeded.vel, this.layout.width, this.layout.height);
    const ht = haloTextureData(this.halos);
    this.haloTex = mkData(ht.data, ht.layout.width, ht.layout.height);

    const mkTarget = (): PingPong => {
      const rt = new THREE.WebGLRenderTarget(this.layout.width, this.layout.height, {
        count: 2,
        type: THREE.FloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false,
      });
      const pos = rt.textures[0];
      const vel = rt.textures[1];
      if (!pos || !vel) throw new Error("MRT target did not expose two textures");
      return { rt, pos, vel };
    };
    this.targets = [mkTarget(), mkTarget()];
    // First substep reads the seed textures directly — no copy pass.
    this.read = { pos: this.initPos, vel: this.initVel };

    this.simMaterial = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VS,
      fragmentShader: SUBSTEP_FS,
      uniforms: {
        uPos: { value: this.initPos },
        uVel: { value: this.initVel },
        uHalo: { value: this.haloTex },
        uHaloSize: { value: new THREE.Vector2(ht.layout.width, ht.layout.height) },
        uDt: { value: 0 },
        uA0: { value: 0 },
        uA1: { value: 0 },
        uScale: { value: 1 },
        uEps2: { value: this.eps * this.eps },
        uUnbindR2: { value: 9 * this.eps * this.eps },
      },
      depthTest: false,
      depthWrite: false,
    });
    const tri = new THREE.BufferGeometry();
    tri.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 3, -1, -1, 3]), 2));
    this.simScene.add(new THREE.Mesh(tri, this.simMaterial));

    // gl_VertexID indexes the state textures; no per-particle attribute
    // needed beyond the position dummy three requires for the draw count.
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.particleCount * 3), 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    this.renderMaterial = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: RENDER_VS,
      fragmentShader: RENDER_FS,
      uniforms: {
        uPos: { value: this.initPos },
        uHalo: { value: this.haloTex },
        uTexSize: { value: new THREE.Vector2(this.layout.width, this.layout.height) },
        uHaloSize: { value: new THREE.Vector2(ht.layout.width, ht.layout.height) },
        uProj: { value: new THREE.Matrix4() },
        uView: { value: new THREE.Matrix4() },
        uCamC: { value: new THREE.Vector3() },
        uLnA: { value: 0 },
        uRho0: { value: 50 },
        uH: { value: 1e-4 },
        uPointSize: { value: p.pointSize ?? 6 },
        uViewportH: { value: 1 },
        uFate: { value: 0 },
        uDecay: { value: 1 },
        uRipA: { value: 0 },
        uVacTint: { value: new THREE.Color(0.55, 0.95, 0.75) },
        uVacMix: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.renderMaterial);
    this.points.frustumCulled = false;
  }

  get a(): number {
    return Math.exp(this.integrator.u);
  }

  get tau(): number {
    return this.integrator.tau;
  }

  step(requestDeltaTau: number): { actualDeltaTau: number; terminal: boolean } {
    if (requestDeltaTau <= 0) {
      return { actualDeltaTau: 0, terminal: false };
    }
    // The halo-core stiffness (dt ≤ target/ω_max) is enforced here: the B1
    // warped clock does not know about it, so the engine drives the
    // integrator with requests at or below the floor and runs one GPU pass
    // per returned substep. Near a singularity B1's own warp slows the
    // substeps further, inside the same pass budget.
    const dtFloor = this.omegaDtTarget / this.omegaMax;
    let budget = Math.max(1, Math.min(this.maxPasses, Math.ceil(requestDeltaTau / dtFloor)));
    let total = 0;
    let terminal = false;

    const gl = this.renderer;
    const prevTarget = gl.getRenderTarget();
    const prevAutoClear = gl.autoClear;
    gl.autoClear = false;

    while (budget > 0 && !terminal) {
      const r = this.integrator.advance(dtFloor);
      for (const sub of r.substeps) {
        if (budget <= 0) break;
        budget--;
        this.runSubstep(sub);
        total += sub.dt;
      }
      if (r.terminal) terminal = true;
      if (r.substeps.length === 0) break;
    }

    gl.setRenderTarget(prevTarget);
    gl.autoClear = prevAutoClear;
    this.syncRenderUniforms();
    return { actualDeltaTau: total, terminal };
  }

  private runSubstep(sub: Substep): void {
    const u = this.simMaterial.uniforms;
    (u.uDt as THREE.IUniform<number>).value = sub.dt;
    (u.uA0 as THREE.IUniform<number>).value = sub.A0;
    (u.uA1 as THREE.IUniform<number>).value = sub.A1;
    (u.uScale as THREE.IUniform<number>).value = sub.a1;
    (u.uPos as THREE.IUniform<THREE.Texture>).value = this.read.pos;
    (u.uVel as THREE.IUniform<THREE.Texture>).value = this.read.vel;

    const w = this.targets[this.writeIndex];
    this.renderer.setRenderTarget(w.rt);
    this.renderer.render(this.simScene, this.simCamera);
    this.read = { pos: w.pos, vel: w.vel };
    this.writeIndex ^= 1;
  }

  // Halo field and seeded state are mode-independent; switching a fate
  // rewinds the integrator and rewinds rendering to the seed textures.
  resetTo(mode: FateMode): void {
    this.integrator = new FateIntegrator(mode);
    this.integratorMode = mode;
    this.read = { pos: this.initPos, vel: this.initVel };
    this.writeIndex = 0;
    this.syncRenderUniforms();
  }

  // Deterministic seek for the fate scrub: advance from the current state
  // one halo-core-stable substep at a time, running a GPU pass per substep.
  // The pass budget bounds the cost; near a terminal the warped clock's own
  // slowdown may leave the last sliver uncovered — the HUD reports the τ
  // actually reached.
  seek(targetTau: number, passBudget = 24000): void {
    const gl = this.renderer;
    const prevTarget = gl.getRenderTarget();
    const prevAutoClear = gl.autoClear;
    gl.autoClear = false;

    let budget = passBudget;
    const dtFloor = this.omegaDtTarget / this.omegaMax;
    while (this.integrator.tau < targetTau && budget > 0) {
      const r = this.integrator.advance(dtFloor);
      for (const sub of r.substeps) {
        if (budget <= 0) break;
        budget--;
        this.runSubstep(sub);
      }
      if (r.terminal || r.substeps.length === 0) break;
    }

    gl.setRenderTarget(prevTarget);
    gl.autoClear = prevAutoClear;
    this.syncRenderUniforms();
  }

  // Per-frame draw uniform sync: camera matrices + fate grading derived
  // from the integrator state. The camera lives in proper units around the
  // box scale; the shader works in comoving offsets, so uCamC is the
  // camera position divided by a.
  syncCamera(camera: THREE.PerspectiveCamera, viewportHeightPx: number): void {
    const ru = this.renderMaterial.uniforms;
    const a = this.a;
    (ru.uProj as THREE.IUniform<THREE.Matrix4>).value.copy(camera.projectionMatrix);
    (ru.uView as THREE.IUniform<THREE.Matrix4>).value.copy(camera.matrixWorldInverse);
    (ru.uCamC as THREE.IUniform<THREE.Vector3>).value.copy(camera.position).divideScalar(a);
    (ru.uLnA as THREE.IUniform<number>).value = Math.log(a);
    (ru.uViewportH as THREE.IUniform<number>).value = viewportHeightPx;
    const mode = this.integratorMode;
    (ru.uFate as THREE.IUniform<number>).value =
      mode === "heatDeath" ? 1 :
      mode === "bigRip" ? 2 :
      mode === "bigCrunchClosed" || mode === "bigCrunchLambda" ? 3 :
      mode === "vacuumDecay" ? 4 : 0;
    // Heat-death stellar decay: exponential on the fate clock, normalized
    // so the fade completes over ~5 Hubble times past the present.
    (ru.uDecay as THREE.IUniform<number>).value =
      mode === "heatDeath" ? Math.exp(-Math.max(0, this.integrator.tau - this.integrator.params.tauPresent) / 5) : 1;
    // Big-rip progress: normalized against the analytic terminal time.
    (ru.uRipA as THREE.IUniform<number>).value =
      mode === "bigRip"
        ? THREE.MathUtils.clamp(
            (this.integrator.tau - this.integrator.params.tauPresent) /
              (2 / (3 * Math.abs(1 + this.integrator.params.w) * Math.sqrt(this.integrator.params.Ode))),
            0,
            1,
          )
        : 0;
    // Vacuum decay tint ramps in from the start (placeholder until the
    // bubble-wall brief): interior regions will be overdrawn by the wall pass.
    (ru.uVacMix as THREE.IUniform<number>).value = mode === "vacuumDecay" ? 0.35 : 0;
    // Proper Hubble rate in 1/length: H/H0 with lengths in Hubble lengths
    // keeps D·H dimensionless (v/c for Hubble-flow receding).
    (ru.uH as THREE.IUniform<number>).value = this.integrator.getH();
  }

  private syncRenderUniforms(): void {
    const ru = this.renderMaterial.uniforms;
    (ru.uPos as THREE.IUniform<THREE.Texture>).value = this.read.pos;
  }

  dispose(): void {
    for (const t of this.targets) t.rt.dispose();
    this.initPos.dispose();
    this.initVel.dispose();
    this.haloTex.dispose();
    this.simMaterial.dispose();
    this.renderMaterial.dispose();
    this.points.geometry.dispose();
  }
}

export function createFatesParticles(
  renderer: THREE.WebGLRenderer,
  requestedCount: number,
  mode: FateMode,
): FateParticles {
  return new FateParticles(renderer, mode, { particleCount: requestedCount });
}
