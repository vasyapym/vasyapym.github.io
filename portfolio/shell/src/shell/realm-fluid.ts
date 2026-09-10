// realm-fluid.ts — gpu fluid engine for "the deep"
//
// architecture
//   - stable fluids on half-float rgba render targets: velocity (~1/4 canvas res) is
//     advected, curl/vorticity-confined and projected (jacobi pressure); dye (~1/2 res)
//     is then advected through it. positions are css px (y down), velocities css px/s.
//   - two display modes: "ink" writes premultiplied catalogue ink where dye density is
//     alpha (transparent canvas for the flood/drain); "abyss" writes an opaque luminous
//     sea plus marine snow, caller-supplied emissive quads and a quarter-res bloom.
//   - a self-managed quality ladder watches rolling frame cost and sheds passes.
//   - the caller owns the frame loop; nothing in here schedules work or reads the dom.

export interface FluidCamera { vx: number; vy: number }
export interface FluidEmissives {
  points: Float32Array;
  lines: Float32Array;
  pointCount: number; lineCount: number;
}
export interface FluidHandle {
  readonly ok: true;
  resize(cssW: number, cssH: number, dpr: number): void;
  splash(x: number, y: number, radius: number, spread: number, dye: number,
         color: readonly [number, number, number]): void;
  stroke(x: number, y: number, dx: number, dy: number, weight?: number): void;
  vortex(x: number, y: number, radius: number, strength: number,
         color: readonly [number, number, number]): void;
  globalDrift(vx: number, vy: number): void;
  setLantern(x: number, y: number, intensity: number): void;
  setMode(mode: "ink" | "abyss"): void;
  setReducedMotion(reduced: boolean): void;
  step(dt: number): void;
  render(emissives: FluidEmissives): void;
  frameMeanMs(): number;
  qualityLevel(): number;
  dispose(): void;
}

type GL = WebGLRenderingContext | WebGL2RenderingContext;
type Rgb = readonly [number, number, number];

interface Caps {
  readonly gl: GL;
  readonly gl2: WebGL2RenderingContext | null;
  readonly internalFormat: number;
  readonly texType: number;
}

interface Target {
  readonly fbo: WebGLFramebuffer;
  readonly tex: WebGLTexture;
  readonly w: number;
  readonly h: number;
}

interface Pair { read: Target; write: Target }

const INK: Rgb = [0x0b / 255, 0x13 / 255, 0x17 / 255];
const BASE: Rgb = [0x04 / 255, 0x08 / 255, 0x0b / 255];
const WARM: Rgb = [0xe8 / 255, 0xb5 / 255, 0x7c / 255];
// ink-mode dye carries ALPHA only: the flood's look is FS_INK's uInk uniform,
// and a coloured dye would accumulate across the splash script into a bright
// cyan stain the moment abyss mode renders base + dye.rgb.
const BLACK: Rgb = [0, 0, 0];
const SNOW_COUNT = 15000;
const HISTORY = 60;
const EMIT_FLOATS = 7;
const LADDER_MAX = 4;

// ---------------------------------------------------------------- shaders (glsl es 1.00, runs on both apis)

const VS_QUAD = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FS_HEAD = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
`;

const FS_COPY = `
uniform sampler2D uTex;
void main() { gl_FragColor = texture2D(uTex, vUv); }`;

// semi-lagrangian advection; uForce folds the camera drift bias in so no extra pass is needed
const FS_ADVECT = `
uniform sampler2D uVel;
uniform sampler2D uSrc;
uniform vec2 uPxToUv;
uniform float uDt;
uniform float uDecay;
uniform vec2 uForce;
void main() {
  vec2 v = texture2D(uVel, vUv).xy;
  vec2 c = vUv - uDt * v * uPxToUv;
  gl_FragColor = texture2D(uSrc, c) * uDecay + vec4(uForce, 0.0, 0.0);
}`;

const FS_CURL = `
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float L = texture2D(uVel, vUv - vec2(uTexel.x, 0.0)).y;
  float R = texture2D(uVel, vUv + vec2(uTexel.x, 0.0)).y;
  float B = texture2D(uVel, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture2D(uVel, vUv + vec2(0.0, uTexel.y)).x;
  gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const FS_VORT = `
uniform sampler2D uVel;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uCurlK;
uniform float uDt;
void main() {
  float L = texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uCurlK * C;
  force.y *= -1.0;
  vec2 v = texture2D(uVel, vUv).xy + force * uDt;
  gl_FragColor = vec4(v, 0.0, 1.0);
}`;

const FS_DIV = `
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float L = texture2D(uVel, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uVel, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture2D(uVel, vUv - vec2(0.0, uTexel.y)).y;
  float T = texture2D(uVel, vUv + vec2(0.0, uTexel.y)).y;
  gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const FS_PRES = `
uniform sampler2D uPre;
uniform sampler2D uDiv;
uniform vec2 uTexel;
void main() {
  float L = texture2D(uPre, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uPre, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture2D(uPre, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture2D(uPre, vUv + vec2(0.0, uTexel.y)).x;
  float d = texture2D(uDiv, vUv).x;
  gl_FragColor = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
}`;

const FS_GRAD = `
uniform sampler2D uPre;
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float L = texture2D(uPre, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uPre, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture2D(uPre, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture2D(uPre, vUv + vec2(0.0, uTexel.y)).x;
  vec2 v = texture2D(uVel, vUv).xy - vec2(R - L, T - B);
  gl_FragColor = vec4(v, 0.0, 1.0);
}`;

// one velocity splat covers splash (radial), stroke (directional) and vortex (tangential + sink)
const FS_SPLAT_VEL = `
uniform sampler2D uVel;
uniform vec2 uToPx;
uniform vec2 uCenter;
uniform float uRadius;
uniform vec2 uDir;
uniform float uRadial;
uniform float uTang;
void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uToPx;
  vec2 p = px - uCenter;
  float d2 = dot(p, p);
  float f = exp(-d2 / (uRadius * uRadius));
  vec2 n = p / (sqrt(d2) + 0.5);
  vec2 add = uDir + n * uRadial + vec2(-n.y, n.x) * uTang;
  gl_FragColor = vec4(texture2D(uVel, vUv).xy + add * f, 0.0, 1.0);
}`;

const FS_SPLAT_DYE = `
uniform sampler2D uDye;
uniform vec2 uToPx;
uniform vec2 uCenter;
uniform float uRadius;
uniform vec3 uColor;
uniform float uAmount;
const float DYE_KNEE = 2.6;
const float DYE_CEIL = 4.0;
void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uToPx;
  vec2 p = px - uCenter;
  float f = exp(-dot(p, p) / (uRadius * uRadius)) * uAmount;
  vec4 c = texture2D(uDye, vUv) + vec4(uColor * f, f);
  // soft accumulation ceiling. identity below DYE_KNEE, asymptotic to DYE_CEIL
  // above it, applied as ONE uniform scale so hue (and the ink-mode black-dye
  // rule: rgb stays 0, alpha is density) survives untouched.
  float m = max(max(c.r, c.g), max(c.b, c.a));
  float over = max(m - DYE_KNEE, 0.0);
  float lim = DYE_KNEE + (DYE_CEIL - DYE_KNEE) * (over / (over + (DYE_CEIL - DYE_KNEE)));
  gl_FragColor = c * (m > DYE_KNEE ? lim / m : 1.0);
}`;

// ink mode: premultiplied, density is alpha, colour is forced to the catalogue ink
const FS_INK = `
uniform sampler2D uDye;
uniform vec3 uInk;
uniform float uGain;
void main() {
  float a = clamp(texture2D(uDye, vUv).a * uGain, 0.0, 1.0);
  a = a * a * (3.0 - 2.0 * a);
  gl_FragColor = vec4(uInk * a, a);
}`;

const FS_ABYSS = `
uniform sampler2D uDye;
uniform vec3 uBase;
uniform float uGain;
const float TM_KNEE = 0.55;
const float TM_CEIL = 0.82;
void main() {
  vec4 d = texture2D(uDye, vUv);
  vec3 c = d.rgb * uGain;
  // hue-preserving soft shoulder: exactly linear up to TM_KNEE (normal dye and
  // creature colour read unchanged), then asymptotic to TM_CEIL so no amount of
  // accumulation can reach 1.0. scaling by the max channel keeps saturation, so
  // a hot core desaturates toward its own hue, never toward white.
  float m = max(max(c.r, c.g), c.b);
  float over = max(m - TM_KNEE, 0.0);
  float lim = TM_KNEE + (TM_CEIL - TM_KNEE) * (over / (over + (TM_CEIL - TM_KNEE)));
  c *= m > TM_KNEE ? lim / m : 1.0;
  gl_FragColor = vec4(uBase + c, 1.0);
}`;

const VS_SNOW = `
attribute vec4 aFlake;
uniform vec2 uScreen;
uniform float uTime;
uniform vec2 uCam;
uniform float uDpr;
uniform vec2 uLantern;
uniform float uLanternI;
varying float vBright;
varying vec2 vUv;
void main() {
  float depth = aFlake.z;
  float seed = aFlake.w;
  float par = mix(0.1, 0.8, depth);
  vec2 sway = vec2(sin(uTime * 0.21 + seed * 6.2831) * 0.006 * par, uTime * 0.0035 * par);
  vec2 uv = fract(aFlake.xy + sway - uCam * par / uScreen);
  vec2 px = uv * uScreen;
  vec2 dl = px - uLantern;
  float lant = uLanternI * exp(-dot(dl, dl) / 90000.0);
  vBright = mix(0.05, 0.2, depth) * (0.35 + 3.0 * lant);
  vUv = vec2(uv.x, 1.0 - uv.y);
  gl_PointSize = (1.0 + 2.0 * depth) * uDpr;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
}`;

const FS_SNOW = `
uniform sampler2D uDye;
varying float vBright;
// vUv comes from the shared FS_HEAD — redeclaring it here is a link error on
// strict ANGLE translators and would silently kill the whole gpu path.
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float a = 1.0 - r2;
  a *= a;
  vec4 d = texture2D(uDye, vUv);
  float glow = dot(d.rgb, vec3(0.3333));
  float b = vBright * a * (1.0 + 4.0 * glow);
  gl_FragColor = vec4(vec3(0.72, 0.84, 1.0) * b, b);
}`;

// emissives arrive as points/lines; both become soft quads so glow size is not bound by point-size limits
const VS_EMIT = `
attribute vec2 aPos;
attribute vec2 aLocal;
attribute vec3 aCol;
uniform vec2 uScreen;
varying vec2 vLocal;
varying vec3 vCol;
void main() {
  vLocal = aLocal;
  vCol = aCol;
  vec2 uv = aPos / uScreen;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
}`;

const FS_EMIT = `
varying vec2 vLocal;
varying vec3 vCol;
void main() {
  float f = clamp(1.0 - dot(vLocal, vLocal), 0.0, 1.0);
  f *= f;
  gl_FragColor = vec4(vCol * f, f * 0.6);
}`;

const FS_PREFILTER = `
uniform sampler2D uTex;
uniform float uThreshold;
void main() {
  vec3 c = texture2D(uTex, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  float k = max(l - uThreshold, 0.0) / max(l, 0.0001);
  gl_FragColor = vec4(c * k, 1.0);
}`;

const FS_BLUR = `
uniform sampler2D uTex;
uniform vec2 uDir;
void main() {
  vec3 c = texture2D(uTex, vUv).rgb * 0.227027;
  c += (texture2D(uTex, vUv + uDir).rgb + texture2D(uTex, vUv - uDir).rgb) * 0.1945946;
  c += (texture2D(uTex, vUv + uDir * 2.0).rgb + texture2D(uTex, vUv - uDir * 2.0).rgb) * 0.1216216;
  c += (texture2D(uTex, vUv + uDir * 3.0).rgb + texture2D(uTex, vUv - uDir * 3.0).rgb) * 0.054054;
  c += (texture2D(uTex, vUv + uDir * 4.0).rgb + texture2D(uTex, vUv - uDir * 4.0).rgb) * 0.016216;
  gl_FragColor = vec4(c, 1.0);
}`;

const FS_FINAL = `
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomI;
void main() {
  vec3 c = texture2D(uScene, vUv).rgb + texture2D(uBloom, vUv).rgb * uBloomI;
  gl_FragColor = vec4(c, 1.0);
}`;

// ---------------------------------------------------------------- small helpers

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

class Program {
  readonly prog: WebGLProgram;
  private readonly locs = new Map<string, WebGLUniformLocation>();

  private constructor(gl: GL, prog: WebGLProgram) {
    this.prog = prog;
    const n = Number(gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS));
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(prog, i);
      if (!info) continue;
      const loc = gl.getUniformLocation(prog, info.name);
      if (loc) this.locs.set(info.name, loc);
    }
  }

  // returns null for unknown names; gl.uniform* treats null as a no-op, so no assertion needed
  u(name: string): WebGLUniformLocation | null {
    return this.locs.get(name) ?? null;
  }

  static create(gl: GL, vsSrc: string, fsSrc: string, attribs: readonly string[]): Program | null {
    const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (prog) gl.deleteProgram(prog);
      return null;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    for (let i = 0; i < attribs.length; i++) gl.bindAttribLocation(prog, i, attribs[i]);
    gl.linkProgram(prog);
    // shaders can be flagged for deletion once linked; the program keeps them alive
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      return null;
    }
    return new Program(gl, prog);
  }
}

function compile(gl: GL, kind: number, src: string): WebGLShader | null {
  const sh = gl.createShader(kind);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function targetWorks(gl: GL, internal: number, type: number): boolean {
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!tex || !fbo) return false;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, gl.RGBA, type, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE &&
    gl.getError() === gl.NO_ERROR;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(tex);
  return ok;
}

// webgl2 first; a canvas bound to webgl2 cannot fall back to webgl1, so we only try webgl1 when webgl2 is absent
function acquire(canvas: HTMLCanvasElement): Caps | null {
  const attrs: WebGLContextAttributes = {
    alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false,
    preserveDrawingBuffer: false, powerPreference: "high-performance",
  };
  const gl2 = canvas.getContext("webgl2", attrs);
  if (gl2) {
    const cbf = gl2.getExtension("EXT_color_buffer_float") ?? gl2.getExtension("EXT_color_buffer_half_float");
    if (cbf && targetWorks(gl2, gl2.RGBA16F, gl2.HALF_FLOAT)) {
      return { gl: gl2, gl2, internalFormat: gl2.RGBA16F, texType: gl2.HALF_FLOAT };
    }
    return null;
  }
  let gl1: WebGLRenderingContext | null = canvas.getContext("webgl", attrs);
  if (!gl1) {
    const raw = canvas.getContext("experimental-webgl", attrs);
    gl1 = raw instanceof WebGLRenderingContext ? raw : null;
  }
  if (!gl1) return null;
  const half = gl1.getExtension("OES_texture_half_float");
  const linear = gl1.getExtension("OES_texture_half_float_linear");
  if (!half || !linear) return null;
  if (!targetWorks(gl1, gl1.RGBA, half.HALF_FLOAT_OES)) return null;
  return { gl: gl1, gl2: null, internalFormat: gl1.RGBA, texType: half.HALF_FLOAT_OES };
}

interface Progs {
  readonly copy: Program; readonly advect: Program; readonly curl: Program; readonly vort: Program;
  readonly div: Program; readonly pres: Program; readonly grad: Program;
  readonly splatVel: Program; readonly splatDye: Program;
  readonly ink: Program; readonly abyss: Program; readonly snow: Program; readonly emit: Program;
  readonly prefilter: Program; readonly blur: Program; readonly final: Program;
}

function buildPrograms(gl: GL): Progs | null {
  const made: Program[] = [];
  const quad = (fs: string): Program | null => {
    const p = Program.create(gl, VS_QUAD, FS_HEAD + fs, ["aPos"]);
    if (p) made.push(p);
    return p;
  };
  const copy = quad(FS_COPY), advect = quad(FS_ADVECT), curl = quad(FS_CURL), vort = quad(FS_VORT);
  const div = quad(FS_DIV), pres = quad(FS_PRES), grad = quad(FS_GRAD);
  const splatVel = quad(FS_SPLAT_VEL), splatDye = quad(FS_SPLAT_DYE);
  const ink = quad(FS_INK), abyss = quad(FS_ABYSS);
  const prefilter = quad(FS_PREFILTER), blur = quad(FS_BLUR), final = quad(FS_FINAL);
  const snow = Program.create(gl, VS_SNOW, FS_HEAD + FS_SNOW, ["aFlake"]);
  if (snow) made.push(snow);
  const emit = Program.create(gl, VS_EMIT, FS_HEAD + FS_EMIT, ["aPos", "aLocal", "aCol"]);
  if (emit) made.push(emit);
  if (copy && advect && curl && vort && div && pres && grad && splatVel && splatDye &&
      ink && abyss && prefilter && blur && final && snow && emit) {
    return { copy, advect, curl, vort, div, pres, grad, splatVel, splatDye, ink, abyss, snow, emit, prefilter, blur, final };
  }
  for (const p of made) gl.deleteProgram(p.prog);
  return null;
}

// ---------------------------------------------------------------- the engine

class Fluid implements FluidHandle {
  readonly ok = true as const;

  private readonly canvas: HTMLCanvasElement;
  private readonly gl: GL;
  private readonly gl2: WebGL2RenderingContext | null;
  private readonly fmt: number;
  private readonly type: number;
  private readonly maxTex: number;
  private readonly p: Progs;
  private dead = false;

  private readonly quad: WebGLBuffer;
  private readonly snowBuf: WebGLBuffer;
  private readonly emitBuf: WebGLBuffer;
  private emitData: Float32Array;
  private emitCap: number;

  private vel: Pair;
  private dye: Pair;
  private pres: Pair;
  private div: Target;
  private curl: Target;
  private scene: Target | null = null;
  private bloomA: Target | null = null;
  private bloomB: Target | null = null;

  private cssW: number;
  private cssH: number;
  private dpr = 1;
  private bw: number;
  private bh: number;

  private mode: "ink" | "abyss" = "abyss";
  private reduced: boolean;
  private rung = 0;
  private iters = 16;
  private snowDraw = SNOW_COUNT;
  private skipTick = false;
  private heldDt = 0;

  private driftX = 0;
  private driftY = 0;
  private camX = 0;
  private camY = 0;
  private time = 0;
  private lanX = -1e5;
  private lanY = -1e5;
  private lanI = 0;

  private readonly hist = new Float64Array(HISTORY);
  private histIdx = 0;
  private histN = 0;
  private histSum = 0;
  private frames = 0;
  private stepAt = -1;
  private lastDrop: number;

  private readonly onLost: () => void;

  constructor(canvas: HTMLCanvasElement, caps: Caps, progs: Progs,
              opts: { readonly reducedMotion: boolean; readonly smallScreen: boolean }) {
    this.canvas = canvas;
    this.gl = caps.gl;
    this.gl2 = caps.gl2;
    this.fmt = caps.internalFormat;
    this.type = caps.texType;
    this.p = progs;
    this.reduced = opts.reducedMotion;
    this.lastDrop = nowMs();
    const gl = this.gl;
    this.maxTex = Math.max(1024, Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 4096);

    // canvas attributes are not layout reads; the caller's first resize() sets the real size
    this.bw = Math.max(1, canvas.width);
    this.bh = Math.max(1, canvas.height);
    this.cssW = this.bw;
    this.cssH = this.bh;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.SCISSOR_TEST);

    this.quad = this.makeBuffer(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.snowBuf = this.makeBuffer(makeFlakes(), gl.STATIC_DRAW);
    this.emitCap = 256;
    this.emitData = new Float32Array(this.emitCap * 6 * EMIT_FLOATS);
    this.emitBuf = this.makeBuffer(this.emitData, gl.STREAM_DRAW);

    const vw = this.fitW(0.25, 512), vh = this.fitH(0.25, 512);
    const dw = this.fitW(0.5, 1024), dh = this.fitH(0.5, 1024);
    this.vel = { read: this.makeTarget(vw, vh), write: this.makeTarget(vw, vh) };
    this.pres = { read: this.makeTarget(vw, vh), write: this.makeTarget(vw, vh) };
    this.div = this.makeTarget(vw, vh);
    this.curl = this.makeTarget(vw, vh);
    this.dye = { read: this.makeTarget(dw, dh), write: this.makeTarget(dw, dh) };

    this.onLost = () => { this.dead = true; };
    canvas.addEventListener("webglcontextlost", this.onLost);

    if (opts.smallScreen) this.rung = 1;
    this.rebuildPost();
  }

  // ------------------------------------------------------------ public contract

  resize(cssW: number, cssH: number, dpr: number): void {
    if (this.dead) return;
    this.cssW = Math.max(1, cssW);
    this.cssH = Math.max(1, cssH);
    this.dpr = Math.max(0.5, dpr);
    this.bw = Math.max(1, Math.round(this.cssW * this.dpr));
    this.bh = Math.max(1, Math.round(this.cssH * this.dpr));
    if (this.canvas.width !== this.bw) this.canvas.width = this.bw;
    if (this.canvas.height !== this.bh) this.canvas.height = this.bh;
    this.rebuildSim();
    this.rebuildPost();
  }

  splash(x: number, y: number, radius: number, spread: number, dye: number, color: Rgb): void {
    if (this.dead) return;
    const r = Math.max(2, radius);
    this.splatVel(x, y, r, 0, 0, spread, 0);
    if (dye > 0) this.splatDye(x, y, r, color, dye);
  }

  stroke(x: number, y: number, dx: number, dy: number, weight = 1): void {
    if (this.dead || !Number.isFinite(weight) || weight <= 0) return;
    // dx/dy now arrive in css px/s (caller divides the screen delta by dt), so the
    // wake is frame-rate coherent instead of scaling with frame time.
    const speed = Math.sqrt(dx * dx + dy * dy);
    if (speed < 1) return;
    // the water inherits a fraction of the lantern's momentum: it is dragged along
    // and left behind by advection rather than punched forward. subdivisions share
    // one time-weighted deposit: weight scales the deposit, not the velocity used
    // for the speed ramp.
    this.splatVel(x, y, 42, dx * 0.16 * weight, dy * 0.16 * weight, 0, 0);
    // smooth speed ramp (fades in ~90 px/s, saturates ~800 px/s) instead of tracking
    // instantaneous speed, which is what made the trail pulse and break into dots.
    const s = Math.min(1, Math.max(0, (speed - 90) / 710));
    const amount = 0.05 + 0.15 * (s * s * (3 - 2 * s));
    this.splatDye(x, y, 30, WARM, amount * weight);
  }
vortex(x: number, y: number, radius: number, strength: number,
          color: Rgb): void {
    if (this.dead) return;
    const r = Math.max(4, radius);
    // per-frame call is kept (the continuity is the current); only the dye rate
    // drops, so the drain reads as water pulling into a point, not as a flash.
    this.splatVel(x, y, r, 0, 0, -strength * 0.6, strength);
    this.splatDye(x, y, r * 0.8, color, 0.12);
  }

  globalDrift(vx: number, vy: number): void {
    this.driftX = vx;
    this.driftY = vy;
  }

  setLantern(x: number, y: number, intensity: number): void {
    this.lanX = x;
    this.lanY = y;
    this.lanI = Math.max(0, Math.min(1, intensity));
  }

  setMode(mode: "ink" | "abyss"): void {
    this.mode = mode;
  }

  setReducedMotion(reduced: boolean): void {
    this.reduced = reduced;
  }

  step(dt: number): void {
    if (this.dead) return;
    this.stepAt = nowMs();
    let d = dt > 0.05 ? 0.05 : dt < 0 ? 0 : dt;
    if (this.rung >= LADDER_MAX) {
      // last rung: simulate every other frame with the held time, display simply holds
      this.heldDt += d;
      this.skipTick = !this.skipTick;
      if (this.skipTick) return;
      d = Math.min(this.heldDt, 0.1);
      this.heldDt = 0;
    }
    if (!this.reduced) {
      this.time += d;
      this.camX += this.driftX * d;
      this.camY += this.driftY * d;
      // keep the parallax offset inside float precision; the wrap is rare enough to be invisible in practice
      if (Math.abs(this.camX) > 2e5) this.camX = 0;
      if (Math.abs(this.camY) > 2e5) this.camY = 0;
    }
    this.simulate(d);
  }

  render(emissives: FluidEmissives): void {
    if (this.dead) return;
    const gl = this.gl;
    if (this.mode === "ink") {
      this.renderInk(emissives);
    } else {
      this.renderAbyss(emissives);
    }
    gl.disable(gl.BLEND);

    const t1 = nowMs();
    const cost = this.stepAt >= 0 ? t1 - this.stepAt : 0;
    this.stepAt = -1;
    this.histSum += cost - this.hist[this.histIdx];
    this.hist[this.histIdx] = cost;
    this.histIdx = (this.histIdx + 1) % HISTORY;
    if (this.histN < HISTORY) this.histN++;
    this.frames++;
    if (this.frames > 90 && this.rung < LADDER_MAX && this.frameMeanMs() > 14 && t1 - this.lastDrop > 1000) {
      this.lastDrop = t1;
      this.applyRung(this.rung + 1);
    }
  }

  frameMeanMs(): number {
    return this.histN === 0 ? 0 : this.histSum / this.histN;
  }

  qualityLevel(): number {
    return this.rung;
  }

  dispose(): void {
    if (this.dead) {
      this.canvas.removeEventListener("webglcontextlost", this.onLost);
      return;
    }
    this.dead = true;
    const gl = this.gl;
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.deletePair(this.vel);
    this.deletePair(this.dye);
    this.deletePair(this.pres);
    this.deleteTarget(this.div);
    this.deleteTarget(this.curl);
    if (this.scene) this.deleteTarget(this.scene);
    if (this.bloomA) this.deleteTarget(this.bloomA);
    if (this.bloomB) this.deleteTarget(this.bloomB);
    this.scene = this.bloomA = this.bloomB = null;
    gl.deleteBuffer(this.quad);
    gl.deleteBuffer(this.snowBuf);
    gl.deleteBuffer(this.emitBuf);
    const ps = this.p;
    const all = [ps.copy, ps.advect, ps.curl, ps.vort, ps.div, ps.pres, ps.grad, ps.splatVel, ps.splatDye,
      ps.ink, ps.abyss, ps.snow, ps.emit, ps.prefilter, ps.blur, ps.final];
    for (const p of all) gl.deleteProgram(p.prog);
    // do NOT call WEBGL_lose_context here: the context binding is permanent for
    // this canvas element, and react strict-mode remounts (or any reuse) would
    // then only ever see a dead context. the element is dropped with the layer;
    // the browser reclaims the context when it is collected.
  }

  // ------------------------------------------------------------ simulation

  private simulate(dt: number): void {
    const gl = this.gl;
    const p = this.p;
    gl.disable(gl.BLEND);
    const pxToUvX = 1 / this.cssW;
    const pxToUvY = -1 / this.cssH;
    const frames60 = dt * 60;
    const velDecay = Math.pow(this.reduced ? 0.94 : 0.99, frames60);
    const dyeDecay = Math.pow(this.reduced ? 0.9995 : 0.985, frames60);
    const forceX = this.reduced ? 0 : this.driftX * 0.12 * dt;
    const forceY = this.reduced ? 0 : this.driftY * 0.12 * dt;
    const texX = 1 / this.vel.read.w;
    const texY = 1 / this.vel.read.h;

    // advect velocity through itself, folding in the camera-induced bias
    gl.useProgram(p.advect.prog);
    this.tex(0, this.vel.read.tex);
    gl.uniform1i(p.advect.u("uVel"), 0);
    gl.uniform1i(p.advect.u("uSrc"), 0);
    gl.uniform2f(p.advect.u("uPxToUv"), pxToUvX, pxToUvY);
    gl.uniform1f(p.advect.u("uDt"), dt);
    gl.uniform1f(p.advect.u("uDecay"), velDecay);
    gl.uniform2f(p.advect.u("uForce"), forceX, forceY);
    this.quadDraw(this.vel.write);
    this.swap(this.vel);

    gl.useProgram(p.curl.prog);
    this.tex(0, this.vel.read.tex);
    gl.uniform1i(p.curl.u("uVel"), 0);
    gl.uniform2f(p.curl.u("uTexel"), texX, texY);
    this.quadDraw(this.curl);

    gl.useProgram(p.vort.prog);
    this.tex(0, this.vel.read.tex);
    this.tex(1, this.curl.tex);
    gl.uniform1i(p.vort.u("uVel"), 0);
    gl.uniform1i(p.vort.u("uCurl"), 1);
    gl.uniform2f(p.vort.u("uTexel"), texX, texY);
    gl.uniform1f(p.vort.u("uCurlK"), this.reduced ? 0 : 25);
    gl.uniform1f(p.vort.u("uDt"), dt);
    this.quadDraw(this.vel.write);
    this.swap(this.vel);

    gl.useProgram(p.div.prog);
    this.tex(0, this.vel.read.tex);
    gl.uniform1i(p.div.u("uVel"), 0);
    gl.uniform2f(p.div.u("uTexel"), texX, texY);
    this.quadDraw(this.div);

    // previous pressure is kept as a warm start; it converges faster than clearing each frame
    gl.useProgram(p.pres.prog);
    gl.uniform1i(p.pres.u("uPre"), 0);
    gl.uniform1i(p.pres.u("uDiv"), 1);
    gl.uniform2f(p.pres.u("uTexel"), texX, texY);
    this.tex(1, this.div.tex);
    for (let i = 0; i < this.iters; i++) {
      this.tex(0, this.pres.read.tex);
      this.quadDraw(this.pres.write);
      this.swap(this.pres);
    }

    gl.useProgram(p.grad.prog);
    this.tex(0, this.pres.read.tex);
    this.tex(1, this.vel.read.tex);
    gl.uniform1i(p.grad.u("uPre"), 0);
    gl.uniform1i(p.grad.u("uVel"), 1);
    gl.uniform2f(p.grad.u("uTexel"), texX, texY);
    this.quadDraw(this.vel.write);
    this.swap(this.vel);

    gl.useProgram(p.advect.prog);
    this.tex(0, this.vel.read.tex);
    this.tex(1, this.dye.read.tex);
    gl.uniform1i(p.advect.u("uVel"), 0);
    gl.uniform1i(p.advect.u("uSrc"), 1);
    gl.uniform2f(p.advect.u("uPxToUv"), pxToUvX, pxToUvY);
    gl.uniform1f(p.advect.u("uDt"), dt);
    gl.uniform1f(p.advect.u("uDecay"), dyeDecay);
    gl.uniform2f(p.advect.u("uForce"), 0, 0);
    this.quadDraw(this.dye.write);
    this.swap(this.dye);
  }

  private splatVel(x: number, y: number, radius: number, dirX: number, dirY: number,
                   radial: number, tang: number): void {
    const gl = this.gl;
    const p = this.p.splatVel;
    gl.useProgram(p.prog);
    gl.disable(gl.BLEND);
    this.tex(0, this.vel.read.tex);
    gl.uniform1i(p.u("uVel"), 0);
    gl.uniform2f(p.u("uToPx"), this.cssW, this.cssH);
    gl.uniform2f(p.u("uCenter"), x, y);
    gl.uniform1f(p.u("uRadius"), radius);
    gl.uniform2f(p.u("uDir"), dirX, dirY);
    gl.uniform1f(p.u("uRadial"), radial);
    gl.uniform1f(p.u("uTang"), tang);
    this.quadDraw(this.vel.write);
    this.swap(this.vel);
  }

  private splatDye(x: number, y: number, radius: number, color: Rgb, amount: number): void {
    const gl = this.gl;
    const p = this.p.splatDye;
    const c = this.mode === "ink" ? BLACK : color;
    gl.useProgram(p.prog);
    gl.disable(gl.BLEND);
    this.tex(0, this.dye.read.tex);
    gl.uniform1i(p.u("uDye"), 0);
    gl.uniform2f(p.u("uToPx"), this.cssW, this.cssH);
    gl.uniform2f(p.u("uCenter"), x, y);
    gl.uniform1f(p.u("uRadius"), radius);
    gl.uniform3f(p.u("uColor"), c[0], c[1], c[2]);
    gl.uniform1f(p.u("uAmount"), amount);
    this.quadDraw(this.dye.write);
    this.swap(this.dye);
  }

  // ------------------------------------------------------------ rendering

  private renderInk(emissives: FluidEmissives): void {
    const gl = this.gl;
    const p = this.p.ink;
    this.bind(null);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(p.prog);
    this.tex(0, this.dye.read.tex);
    gl.uniform1i(p.u("uDye"), 0);
    gl.uniform3f(p.u("uInk"), INK[0], INK[1], INK[2]);
    gl.uniform1f(p.u("uGain"), 1.2);
    this.quadDraw(null);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    this.drawEmissives(emissives);
  }

  private renderAbyss(emissives: FluidEmissives): void {
    const gl = this.gl;
    const p = this.p;
    const scene = this.scene, bloomA = this.bloomA, bloomB = this.bloomB;
    const bloomOn = this.rung < 1 && scene !== null && bloomA !== null && bloomB !== null;
    const target = bloomOn ? scene : null;

    gl.disable(gl.BLEND);
    gl.useProgram(p.abyss.prog);
    this.tex(0, this.dye.read.tex);
    gl.uniform1i(p.abyss.u("uDye"), 0);
    gl.uniform3f(p.abyss.u("uBase"), BASE[0], BASE[1], BASE[2]);
    gl.uniform1f(p.abyss.u("uGain"), 1.0);
    this.quadDraw(target);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    this.drawSnow();
    this.drawEmissives(emissives);

    if (!bloomOn || !scene || !bloomA || !bloomB) return;
    gl.disable(gl.BLEND);
    gl.useProgram(p.prefilter.prog);
    this.tex(0, scene.tex);
    gl.uniform1i(p.prefilter.u("uTex"), 0);
    gl.uniform1f(p.prefilter.u("uThreshold"), 0.6);
    this.quadDraw(bloomA);

    gl.useProgram(p.blur.prog);
    gl.uniform1i(p.blur.u("uTex"), 0);
    this.tex(0, bloomA.tex);
    gl.uniform2f(p.blur.u("uDir"), 1.5 / bloomA.w, 0);
    this.quadDraw(bloomB);
    this.tex(0, bloomB.tex);
    gl.uniform2f(p.blur.u("uDir"), 0, 1.5 / bloomB.h);
    this.quadDraw(bloomA);

    gl.useProgram(p.final.prog);
    this.tex(0, scene.tex);
    this.tex(1, bloomA.tex);
    gl.uniform1i(p.final.u("uScene"), 0);
    gl.uniform1i(p.final.u("uBloom"), 1);
    gl.uniform1f(p.final.u("uBloomI"), 0.9);
    this.quadDraw(null);
  }

  private drawSnow(): void {
    const gl = this.gl;
    const p = this.p.snow;
    gl.useProgram(p.prog);
    this.tex(0, this.dye.read.tex);
    gl.uniform1i(p.u("uDye"), 0);
    gl.uniform2f(p.u("uScreen"), this.cssW, this.cssH);
    gl.uniform1f(p.u("uTime"), this.time);
    gl.uniform2f(p.u("uCam"), this.camX, this.camY);
    gl.uniform1f(p.u("uDpr"), this.dpr);
    gl.uniform2f(p.u("uLantern"), this.lanX, this.lanY);
    gl.uniform1f(p.u("uLanternI"), this.lanI);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.snowBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
    gl.drawArrays(gl.POINTS, 0, this.snowDraw);
  }

  private drawEmissives(e: FluidEmissives): void {
    const prims = e.pointCount + e.lineCount;
    if (prims <= 0) return;
    this.ensureEmit(prims);
    const pts = e.points, lns = e.lines;
    let o = 0;
    for (let i = 0; i < e.pointCount; i++) {
      const k = i * 6;
      const x = pts[k], y = pts[k + 1], s = Math.max(0.5, pts[k + 2]);
      const r = pts[k + 3], g = pts[k + 4], b = pts[k + 5];
      o = this.put(o, x - s, y - s, -1, -1, r, g, b);
      o = this.put(o, x + s, y - s, 1, -1, r, g, b);
      o = this.put(o, x - s, y + s, -1, 1, r, g, b);
      o = this.put(o, x - s, y + s, -1, 1, r, g, b);
      o = this.put(o, x + s, y - s, 1, -1, r, g, b);
      o = this.put(o, x + s, y + s, 1, 1, r, g, b);
    }
    for (let i = 0; i < e.lineCount; i++) {
      const k = i * 8;
      const x1 = lns[k], y1 = lns[k + 1], x2 = lns[k + 2], y2 = lns[k + 3];
      const hw = Math.max(0.25, lns[k + 4]) * 0.5;
      const r = lns[k + 5], g = lns[k + 6], b = lns[k + 7];
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1e-3) continue;
      const nx = -dy / len * hw, ny = dx / len * hw;
      o = this.put(o, x1 + nx, y1 + ny, 0, 1, r, g, b);
      o = this.put(o, x1 - nx, y1 - ny, 0, -1, r, g, b);
      o = this.put(o, x2 + nx, y2 + ny, 0, 1, r, g, b);
      o = this.put(o, x2 + nx, y2 + ny, 0, 1, r, g, b);
      o = this.put(o, x1 - nx, y1 - ny, 0, -1, r, g, b);
      o = this.put(o, x2 - nx, y2 - ny, 0, -1, r, g, b);
    }
    if (o === 0) return;
    const gl = this.gl;
    const p = this.p.emit;
    gl.useProgram(p.prog);
    gl.uniform2f(p.u("uScreen"), this.cssW, this.cssH);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.emitBuf);
    // webgl2 can upload just the used prefix; webgl1 re-uploads the whole (small) preallocated array
    if (this.gl2) this.gl2.bufferSubData(gl.ARRAY_BUFFER, 0, this.emitData, 0, o);
    else gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.emitData);
    const stride = EMIT_FLOATS * 4;
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 16);
    gl.drawArrays(gl.TRIANGLES, 0, o / EMIT_FLOATS);
    gl.disableVertexAttribArray(1);
    gl.disableVertexAttribArray(2);
  }

  private put(o: number, x: number, y: number, lx: number, ly: number, r: number, g: number, b: number): number {
    const d = this.emitData;
    d[o] = x; d[o + 1] = y; d[o + 2] = lx; d[o + 3] = ly; d[o + 4] = r; d[o + 5] = g; d[o + 6] = b;
    return o + EMIT_FLOATS;
  }

  // grows only when a frame carries more primitives than ever before, so the hot path stays allocation-free
  private ensureEmit(prims: number): void {
    if (prims <= this.emitCap) return;
    let cap = this.emitCap;
    while (cap < prims) cap *= 2;
    this.emitCap = cap;
    this.emitData = new Float32Array(cap * 6 * EMIT_FLOATS);
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.emitBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.emitData.byteLength, gl.STREAM_DRAW);
  }

  // ------------------------------------------------------------ quality ladder

  private applyRung(r: number): void {
    const prev = this.rung;
    this.rung = r;
    if (r >= 1 && prev < 1) this.rebuildPost();
    if (r >= 2 && prev < 2) {
      this.iters = 8;
      this.rebuildSim();
    }
    if (r >= 3) this.snowDraw = SNOW_COUNT >> 1;
  }

  private fitW(scale: number, cap: number): number {
    const w = this.bw * scale, h = this.bh * scale;
    const k = Math.max(w, h) > cap ? cap / Math.max(w, h) : 1;
    return Math.max(16, Math.round(w * k));
  }

  private fitH(scale: number, cap: number): number {
    const w = this.bw * scale, h = this.bh * scale;
    const k = Math.max(w, h) > cap ? cap / Math.max(w, h) : 1;
    return Math.max(16, Math.round(h * k));
  }

  private rebuildSim(): void {
    const s = this.rung >= 2 ? 0.125 : 0.25;
    const vw = this.fitW(s, 512), vh = this.fitH(s, 512);
    const dw = this.fitW(s * 2, 1024), dh = this.fitH(s * 2, 1024);
    this.resizePair(this.vel, vw, vh);
    this.resizePair(this.pres, vw, vh);
    this.resizePair(this.dye, dw, dh);
    if (this.div.w !== vw || this.div.h !== vh) {
      this.deleteTarget(this.div);
      this.deleteTarget(this.curl);
      this.div = this.makeTarget(vw, vh);
      this.curl = this.makeTarget(vw, vh);
    }
  }

  private rebuildPost(): void {
    if (this.scene) this.deleteTarget(this.scene);
    if (this.bloomA) this.deleteTarget(this.bloomA);
    if (this.bloomB) this.deleteTarget(this.bloomB);
    this.scene = this.bloomA = this.bloomB = null;
    if (this.rung >= 1) return;
    const k = Math.max(this.bw, this.bh) > this.maxTex ? this.maxTex / Math.max(this.bw, this.bh) : 1;
    const sw = Math.max(1, Math.round(this.bw * k)), sh = Math.max(1, Math.round(this.bh * k));
    const bwq = Math.max(1, Math.round(sw / 4)), bhq = Math.max(1, Math.round(sh / 4));
    this.scene = this.makeTarget(sw, sh);
    this.bloomA = this.makeTarget(bwq, bhq);
    this.bloomB = this.makeTarget(bwq, bhq);
  }

  // ------------------------------------------------------------ gl resources

  private makeBuffer(data: Float32Array, usage: number): WebGLBuffer {
    const gl = this.gl;
    const buf = gl.createBuffer();
    if (!buf) throw new Error("buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    return buf;
  }

  private makeTarget(w: number, h: number): Target {
    const gl = this.gl;
    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    if (!tex || !fbo) throw new Error("target");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.fmt, w, h, 0, gl.RGBA, this.type, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { fbo, tex, w, h };
  }

  private deleteTarget(t: Target): void {
    this.gl.deleteFramebuffer(t.fbo);
    this.gl.deleteTexture(t.tex);
  }

  private deletePair(p: Pair): void {
    this.deleteTarget(p.read);
    this.deleteTarget(p.write);
  }

  // carries the current field across a resolution change so a resize mid-flood does not blank the ink
  private resizePair(p: Pair, w: number, h: number): void {
    if (p.read.w === w && p.read.h === h) return;
    const gl = this.gl;
    const next = this.makeTarget(w, h);
    gl.useProgram(this.p.copy.prog);
    gl.disable(gl.BLEND);
    this.tex(0, p.read.tex);
    gl.uniform1i(this.p.copy.u("uTex"), 0);
    this.quadDraw(next);
    this.deleteTarget(p.read);
    this.deleteTarget(p.write);
    p.read = next;
    p.write = this.makeTarget(w, h);
  }

  private swap(p: Pair): void {
    const t = p.read;
    p.read = p.write;
    p.write = t;
  }

  private tex(unit: number, t: WebGLTexture): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
  }

  private bind(t: Target | null): void {
    const gl = this.gl;
    if (t) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.viewport(0, 0, t.w, t.h);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.bw, this.bh);
    }
  }

  private quadDraw(t: Target | null): void {
    const gl = this.gl;
    this.bind(t);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

// deterministic flake layout: xy in 0..1, depth squared so most flakes read as far and faint, plus a sway seed
function makeFlakes(): Float32Array {
  const out = new Float32Array(SNOW_COUNT * 4);
  let s = 0x2545f491;
  const rnd = (): number => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0; i < SNOW_COUNT; i++) {
    const k = i * 4;
    out[k] = rnd();
    out[k + 1] = rnd();
    const d = rnd();
    out[k + 2] = d * d;
    out[k + 3] = rnd();
  }
  return out;
}

export function createFluid(canvas: HTMLCanvasElement,
  opts: { readonly reducedMotion: boolean; readonly smallScreen: boolean }): FluidHandle | null {
  try {
    const caps = acquire(canvas);
    if (!caps) return null;
    const progs = buildPrograms(caps.gl);
    if (!progs) return null;
    return new Fluid(canvas, caps, progs, opts);
  } catch {
    // resource creation can fail on exhausted or blacklisted gpus; the caller falls back to the static page
    return null;
  }
}
