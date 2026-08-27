import { useEffect, useRef } from "react";

const VERT = `#version 300 es
out vec2 v_uv;
void main() {
  vec2 pos = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = pos;
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}`;

const NOISE_GLSL = `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = rot * p * 2.03;
    amplitude *= 0.58;
  }
  return value;
}

// Two-octave variant for domain-warp inputs only: warp coordinates tolerate
// less detail than the final band field, cutting most of the wash pass ALU.
// Amplitudes are renormalized (1.34) so warp ranges match fbm().
float fbmWarp(vec2 p) {
  vec2 q = mat2(0.8, 0.6, -0.6, 0.8) * p * 2.03;
  return (0.5 * noise(p) + 0.29 * noise(q)) * 1.34;
}

// One dissipation profile shared by every layer (aurora wash, direct
// particles, trail composite) so the light never terminates at a boundary.
float edgeFade(vec2 uv) {
  return smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.86, uv.x)
       * smoothstep(0.0, 0.18, uv.y) * smoothstep(1.0, 0.82, uv.y);
}
`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_energy;

${NOISE_GLSL}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 aspect = vec2(u_res.x / u_res.y, 1.0);
  vec2 p = uv * aspect;
  float t = u_time * 0.05;

  vec2 anchor = u_pointer * aspect;
  vec2 rel = p - anchor;
  float d = length(rel);
  float swirlAngle = 0.85 * u_energy * exp(-d * d * 3.2);
  float cs = cos(swirlAngle);
  float sn = sin(swirlAngle);
  vec2 swirled = anchor + vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs);

  vec2 q = vec2(fbmWarp(swirled * 1.35 + t * 0.6), fbmWarp(swirled * 1.35 - vec2(0.23, 0.41) * t));
  vec2 r = vec2(fbmWarp(swirled * 1.7 + q * 1.15 + vec2(1.7, 9.2)),
                fbmWarp(swirled * 1.7 + q * 1.15 + vec2(8.3, 2.8)));
  float f = fbm(swirled * 1.5 + r);

  float band = smoothstep(0.34, 0.84, f);
  float vein = pow(clamp(1.0 - abs(f - 0.52) * 2.8, 0.0, 1.0), 2.0);
  float halo = exp(-d * d * 5.5) * u_energy;

  vec3 teal = vec3(88.0, 178.0, 188.0) / 255.0;
  vec3 amber = vec3(216.0, 148.0, 76.0) / 255.0;
  vec3 bright = vec3(244.0, 192.0, 128.0) / 255.0;

  vec3 col = mix(teal, amber, clamp(vein * 1.05, 0.0, 1.0));
  col = mix(col, bright, clamp(halo * 0.7, 0.0, 1.0));

  float bounded = edgeFade(uv);
  float intensity = band * 0.33 + vein * 0.42 + halo * 0.34;
  float alpha = clamp(intensity, 0.0, 1.0) * bounded * 0.8;
  float grain = (hash(gl_FragCoord.xy) - 0.5) * (1.6 / 255.0);
  float a = max(alpha + grain, 0.0);

  fragColor = vec4((col + grain) * a, a);
}`;

const SIM_FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D u_state;
uniform float u_time;
uniform float u_dt;
uniform vec2 u_aspect;
uniform vec2 u_pointer;
uniform float u_energy;

${NOISE_GLSL}

vec2 curl(vec2 p) {
  float e = 0.045;
  float a = fbm(p + vec2(0.0, e));
  float b = fbm(p - vec2(0.0, e));
  float c = fbm(p + vec2(e, 0.0));
  float d = fbm(p - vec2(e, 0.0));
  return vec2(a - b, d - c) / (2.0 * e);
}

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  vec4 state = texelFetch(u_state, texel, 0);
  vec2 pos = state.xy;
  vec2 vel = state.zw;

  vec2 flow = curl(pos * 1.55 + vec2(u_time * 0.045, -u_time * 0.03));
  vec2 acc = flow * 1.25;

  vec2 toPointer = u_pointer - pos;
  float pull = exp(-dot(toPointer, toPointer) * 8.0) * max(0.0, u_energy - 0.55) * 3.0;
  acc += toPointer * pull;
  acc += vec2(-toPointer.y, toPointer.x) * pull * 0.85;

  vel += acc * u_dt;
  vel *= exp(-u_dt * 1.3);
  pos += vel * u_dt;

  float seed = hash(vec2(float(texel.x), float(texel.y)) + vec2(u_time * 13.7, u_time * 7.3));
  if (seed < u_dt * 0.15) {
    pos = vec2(fract(seed * 9137.7), fract(seed * 7713.3)) * u_aspect;
    vel = vec2(0.0);
  }

  pos = mod(pos, u_aspect);
  outColor = vec4(pos, vel);
}`;

const DRAW_VERT = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_aspect;
uniform float u_pixelScale;
uniform float u_energy;
uniform float u_dt;
uniform float u_stretchCap;
uniform float u_edgeFadeAmt;
out vec3 v_color;
out float v_alpha;
out float v_edge;
out float v_fade;

void main() {
  int corner = gl_VertexID % 6;
  int idx = gl_VertexID / 6;
  ivec2 size = textureSize(u_state, 0);
  ivec2 texel = ivec2(idx % size.x, idx / size.x);
  vec4 cur = texelFetch(u_state, texel, 0);
  vec2 b = cur.xy;
  float speed = length(cur.zw);

  float tint = fract(float(idx) * 0.6180339 + 0.1);
  vec3 cool = vec3(0.60, 0.87, 0.91);
  vec3 warm = vec3(0.96, 0.75, 0.48);
  float stretch = smoothstep(0.0, 0.9, speed);
  v_color = mix(cool, warm, smoothstep(0.62, 0.96, tint)) * (0.5 + u_energy * 0.25 + stretch * 0.5);
  float flowGate = smoothstep(0.08, 0.4, speed);
  v_alpha = flowGate * (0.25 + stretch * 0.35) * clamp(u_dt * 60.0, 0.0, 2.0);

  float t = (corner == 1 || corner == 3 || corner == 4) ? 1.0 : 0.0;
  float s = (corner == 2 || corner == 4 || corner == 5) ? 1.0 : -1.0;

  vec2 dir = clamp(cur.zw * 0.1, vec2(-u_stretchCap), vec2(u_stretchCap));
  vec2 safeDir = dir + vec2(1e-4, 0.0);
  vec2 n = vec2(-safeDir.y, safeDir.x) / max(length(safeDir), 1e-5);
  float halfW = min(u_pixelScale * (0.55 + stretch * 0.75), 2.0);
  vec2 pos = mix(b - dir, b, t) + n * halfW * s;
  v_edge = s;

  vec2 suv = vec2(pos.x / u_aspect.x, pos.y);
  v_fade = mix(1.0, edgeFade(suv), clamp(u_edgeFadeAmt, 0.0, 1.0));

  vec2 clip = vec2(suv.x, suv.y) * 2.0 - 1.0;
  gl_Position = vec4(clip, 0.0, 1.0);
}`;

const DRAW_FRAG = `#version 300 es
precision highp float;
in vec3 v_color;
in float v_alpha;
in float v_edge;
in float v_fade;
out vec4 fragColor;

void main() {
  float soft = 1.0 - v_edge * v_edge * 0.8;
  float a = v_alpha * soft * v_fade;
  fragColor = vec4(v_color * a, a);
}`;

const FADE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_trail;
uniform float u_decay;
uniform float u_sub;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = max(texture(u_trail, v_uv) * u_decay - u_sub, vec4(0.0));
}`;

const COPY_FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
in vec2 v_uv;
out vec4 fragColor;
void main() {
  fragColor = texture(u_tex, v_uv);
}`;

const COMPOSITE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_trail;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 t = texture(u_trail, v_uv);
  vec3 mapped = vec3(1.0) - exp(-t.rgb * 1.6);
  float a = 1.0 - exp(-t.a * 1.6);
  a *= edgeFade(v_uv);
  fragColor = vec4(mapped * a, a);
}`;

type Gl = WebGL2RenderingContext;

type Uniforms = Record<string, WebGLUniformLocation | null>;

type ParticleSystem = {
  simProgram: WebGLProgram;
  drawProgram: WebGLProgram;
  simUniforms: Uniforms;
  drawUniforms: Uniforms;
  textures: [WebGLTexture, WebGLTexture];
  fbos: [WebGLFramebuffer, WebGLFramebuffer];
  size: number;
  count: number;
  front: 0 | 1;
};

type TrailSystem = {
  fadeProgram: WebGLProgram;
  compositeProgram: WebGLProgram;
  fadeUniforms: Uniforms;
  compositeUniforms: Uniforms;
  textures: [WebGLTexture, WebGLTexture];
  fbos: [WebGLFramebuffer, WebGLFramebuffer];
  width: number;
  height: number;
  front: 0 | 1;
};

function supportsFloatBlend(gl: Gl): boolean {
  const extension = gl.getExtension("EXT_float_blend");
  if (extension) {
    return true;
  }

  // WebKit can expose renderable RGBA16F targets without supporting additive
  // blending into them. Prefer the direct particle path in that case rather
  // than leaving Safari with moving white fragments.
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) {
    if (texture) gl.deleteTexture(texture);
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    return false;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, 1, 1, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.deleteFramebuffer(framebuffer);
  gl.deleteTexture(texture);
  return false;
}

const DPR_CAP = 2.0;
const TRAIL_SCALE = 0.75;
const TRAIL_DECAY_RATE = 3.0;

// Adaptive resolution: start sharp, step down when the frame budget slips,
// climb back when frames stay within vsync jitter. Rung values multiply the
// capped device ratio.
const QUALITY_LADDER = [1, 0.85, 0.72, 0.6];
const MOBILE_START_SCALE = 0.85;
const FRAME_BUDGET_DOWN_MS = 21;
// A frame is "long" once it overshoots the display refresh cadence by this
// margin: rare long frames mean headroom, many mean the GPU is saturated.
const LONG_FRAME_FLOOR_MS = 23;
const LONG_FRAME_FACTOR = 1.55;
const CLIMB_LONG_SHARE = 0.03;
const REFRESH_TRACKER_MS = 16.7;

export function qualityStep(
  scale: number,
  saturated: boolean,
  climbing: boolean,
  ceiling = 1,
): number {
  const rungs = QUALITY_LADDER.filter((rung) => rung <= ceiling + 1e-6);
  if (!rungs.length) {
    return scale;
  }
  let idx = rungs.length - 1;
  for (let i = 0; i < rungs.length; i++) {
    if (rungs[i] <= scale + 1e-6) {
      idx = i;
      break;
    }
  }
  if (saturated && idx < rungs.length - 1) {
    return rungs[idx + 1];
  }
  if (climbing && !saturated && idx > 0) {
    return rungs[idx - 1];
  }
  return scale;
}

function compile(gl: Gl, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: Gl, vertexSource: string, fragmentSource: string): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) {
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function collectUniforms(gl: Gl, program: WebGLProgram, names: string[]): Uniforms {
  const uniforms: Uniforms = {};
  for (const name of names) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return uniforms;
}

function particleGridSize(aspect: number, area: number): number {
  const span = Math.sqrt(Math.max(area, 1));
  if (span < 420) {
    return 20;
  }
  if (span < 640 || aspect < 0.8) {
    return 26;
  }
  return 32;
}

function createParticleSystem(gl: Gl, aspect: number, area: number): ParticleSystem | null {
  const floatRender =
    gl.getExtension("EXT_color_buffer_half_float") || gl.getExtension("EXT_color_buffer_float");
  if (!floatRender) {
    return null;
  }
  const simProgram = link(gl, VERT, SIM_FRAG);
  const drawProgram = link(gl, DRAW_VERT, DRAW_FRAG);
  if (!simProgram || !drawProgram) {
    return null;
  }
  const size = particleGridSize(aspect, area);
  const initial = new Float32Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    initial[i * 4 + 0] = Math.random() * Math.max(aspect, 1);
    initial[i * 4 + 1] = Math.random();
    initial[i * 4 + 2] = 0;
    initial[i * 4 + 3] = 0;
  }
  const textures: [WebGLTexture, WebGLTexture] = [gl.createTexture(), gl.createTexture()] as [
    WebGLTexture,
    WebGLTexture,
  ];
  const fbos: [WebGLFramebuffer, WebGLFramebuffer] = [gl.createFramebuffer(), gl.createFramebuffer()] as [
    WebGLFramebuffer,
    WebGLFramebuffer,
  ];
  let complete = true;
  for (let i = 0; i < 2; i++) {
    gl.bindTexture(gl.TEXTURE_2D, textures[i]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, size, size, 0, gl.RGBA, gl.FLOAT, initial);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[i], 0);
    complete = complete && gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  if (complete) {
    return {
      simProgram,
      drawProgram,
      simUniforms: collectUniforms(gl, simProgram, [
        "u_state",
        "u_time",
        "u_dt",
        "u_aspect",
        "u_pointer",
        "u_energy",
      ]),
      drawUniforms: collectUniforms(gl, drawProgram, [
        "u_state",
        "u_aspect",
        "u_pixelScale",
        "u_energy",
        "u_dt",
        "u_edgeFadeAmt",
      ]),
      textures,
      fbos,
      size,
      count: size * size,
      front: 0,
    };
  }
  for (const texture of textures) {
    gl.deleteTexture(texture);
  }
  for (const fbo of fbos) {
    gl.deleteFramebuffer(fbo);
  }
  gl.deleteProgram(simProgram);
  gl.deleteProgram(drawProgram);
  return null;
}

function destroyParticleSystem(gl: Gl, particles: ParticleSystem) {
  for (const texture of particles.textures) {
    gl.deleteTexture(texture);
  }
  for (const fbo of particles.fbos) {
    gl.deleteFramebuffer(fbo);
  }
  gl.deleteProgram(particles.simProgram);
  gl.deleteProgram(particles.drawProgram);
}

function createTrailSystem(gl: Gl, width: number, height: number): TrailSystem | null {
  if (!supportsFloatBlend(gl)) {
    return null;
  }
  const fadeProgram = link(gl, VERT, FADE_FRAG);
  const compositeProgram = link(gl, VERT, COMPOSITE_FRAG);
  if (!fadeProgram || !compositeProgram) {
    if (fadeProgram) gl.deleteProgram(fadeProgram);
    if (compositeProgram) gl.deleteProgram(compositeProgram);
    return null;
  }
  const textures: [WebGLTexture, WebGLTexture] = [gl.createTexture(), gl.createTexture()] as [
    WebGLTexture,
    WebGLTexture,
  ];
  const fbos: [WebGLFramebuffer, WebGLFramebuffer] = [gl.createFramebuffer(), gl.createFramebuffer()] as [
    WebGLFramebuffer,
    WebGLFramebuffer,
  ];
  let complete = true;
  for (let i = 0; i < 2; i++) {
    gl.bindTexture(gl.TEXTURE_2D, textures[i]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[i], 0);
    complete = complete && gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  if (complete) {
    return {
      fadeProgram,
      compositeProgram,
      fadeUniforms: collectUniforms(gl, fadeProgram, ["u_trail", "u_decay"]),
      compositeUniforms: collectUniforms(gl, compositeProgram, ["u_trail"]),
      textures,
      fbos,
      width,
      height,
      front: 0,
    };
  }
  for (const texture of textures) {
    gl.deleteTexture(texture);
  }
  for (const fbo of fbos) {
    gl.deleteFramebuffer(fbo);
  }
  gl.deleteProgram(fadeProgram);
  gl.deleteProgram(compositeProgram);
  return null;
}

function destroyTrailSystem(gl: Gl, trails: TrailSystem) {
  for (const texture of trails.textures) {
    gl.deleteTexture(texture);
  }
  for (const fbo of trails.fbos) {
    gl.deleteFramebuffer(fbo);
  }
  gl.deleteProgram(trails.fadeProgram);
  gl.deleteProgram(trails.compositeProgram);
}

export type HeroFieldInfo = {
  particles: number;
};

export default function HeroField({ onReady }: { onReady?: (info: HeroFieldInfo) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) {
      return;
    }

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    }) as Gl | null;
    if (!gl) {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const vao = gl.createVertexArray();
    let washProgram: WebGLProgram | null = null;
    let washUniforms: Uniforms = {};
    let particles: ParticleSystem | null = null;
    let trails: TrailSystem | null = null;
    let particleCount = 0;
    let raf = 0;
    let running = false;
    let inView = true;
    let startTime = performance.now() + Math.random() * 40;
    const pointer = { x: 0.68, y: 0.58, tx: 0.68, ty: 0.58 };
    const energy = { value: 0.55, target: 0.55 };
    let lastMoveAt = 0;
    let lastFrameAt = 0;
    let live = false;
    let aspect = 1;
    let area = 1;
    let driftT = Math.random() * 120;
    let resScale = finePointerQuery.matches ? 1 : MOBILE_START_SCALE;
    let refreshMs = REFRESH_TRACKER_MS;
    let frameEmaMs = 0;
    let frameCount = 0;
    let longFrames = 0;
    let lastQualityAt = 0;
    

    const markLive = () => {
      if (!live) {
        live = true;
        canvas.classList.add("signal-index-field-live");
        onReadyRef.current?.({ particles: particleCount });
      }
    };

    const drawWash = (timeSeconds: number) => {
      if (!washProgram) {
        return;
      }
      gl.useProgram(washProgram);
      gl.uniform2f(washUniforms.u_res, canvas.width, canvas.height);
      gl.uniform1f(washUniforms.u_time, timeSeconds);
      gl.uniform2f(washUniforms.u_pointer, pointer.x, pointer.y);
      gl.uniform1f(washUniforms.u_energy, energy.value);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const stepParticles = (timeSeconds: number, dt: number) => {
      if (!particles) {
        return;
      }
      const back = (1 - particles.front) as 0 | 1;
      gl.disable(gl.BLEND);
      gl.useProgram(particles.simProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, particles.fbos[back]);
      gl.viewport(0, 0, particles.size, particles.size);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, particles.textures[particles.front]);
      gl.uniform1i(particles.simUniforms.u_state, 0);
      gl.uniform1f(particles.simUniforms.u_time, timeSeconds);
      gl.uniform1f(particles.simUniforms.u_dt, dt);
      gl.uniform2f(particles.simUniforms.u_aspect, aspect, 1);
      gl.uniform2f(particles.simUniforms.u_pointer, pointer.x * aspect, pointer.y);
      gl.uniform1f(particles.simUniforms.u_energy, energy.value);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.enable(gl.BLEND);
      particles.front = back;
    };

    const drawParticles = (dt: number) => {
      if (!particles) {
        return;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(particles.drawProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, particles.textures[particles.front]);
      gl.uniform1i(particles.drawUniforms.u_state, 0);
      gl.uniform2f(particles.drawUniforms.u_aspect, aspect, 1);
      gl.uniform1f(particles.drawUniforms.u_pixelScale, 1 / canvas.width);
      gl.uniform1f(particles.drawUniforms.u_energy, energy.value);
      gl.uniform1f(particles.drawUniforms.u_dt, dt);
      gl.uniform1f(particles.drawUniforms.u_edgeFadeAmt, 1);
      gl.drawArrays(gl.TRIANGLES, 0, particles.count * 6);
    };

    const updateTrail = (timeSeconds: number, dt: number) => {
      if (!particles || !trails) {
        return;
      }
      const back = (1 - trails.front) as 0 | 1;
      gl.bindFramebuffer(gl.FRAMEBUFFER, trails.fbos[back]);
      gl.viewport(0, 0, trails.width, trails.height);
      gl.disable(gl.BLEND);
      gl.useProgram(trails.fadeProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, trails.textures[trails.front]);
      gl.uniform1i(trails.fadeUniforms.u_trail, 0);
      gl.uniform1f(trails.fadeUniforms.u_decay, Math.exp(-dt * TRAIL_DECAY_RATE));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(particles.drawProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, particles.textures[particles.front]);
      gl.uniform1i(particles.drawUniforms.u_state, 0);
      gl.uniform2f(particles.drawUniforms.u_aspect, aspect, 1);
      gl.uniform1f(particles.drawUniforms.u_pixelScale, 1 / trails.width);
      gl.uniform1f(particles.drawUniforms.u_energy, energy.value);
      gl.uniform1f(particles.drawUniforms.u_dt, dt);
      gl.uniform1f(particles.drawUniforms.u_edgeFadeAmt, 0);
      gl.drawArrays(gl.TRIANGLES, 0, particles.count * 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      trails.front = back;
    };

    const compositeTrail = () => {
      if (!trails) {
        return;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(trails.compositeProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, trails.textures[trails.front]);
      gl.uniform1i(trails.compositeUniforms.u_trail, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const draw = (timeSeconds: number, dt: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      drawWash(timeSeconds);
      if (particles && trails) {
        stepParticles(timeSeconds, dt);
        updateTrail(timeSeconds, dt);
        compositeTrail();
      } else {
        gl.blendFunc(gl.ONE, gl.ONE);
        stepParticles(timeSeconds, dt);
        drawParticles(dt);
      }
      markLive();
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        return;
      }
      aspect = rect.width / rect.height;
      area = rect.width * rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP) * resScale;
      const width = Math.max(2, Math.round(rect.width * dpr));
      const height = Math.max(2, Math.round(rect.height * dpr));
      canvas.dataset.heroScale = resScale.toFixed(2);
      canvas.dataset.heroDpr = dpr.toFixed(3);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      if (particles) {
        const trailWidth = Math.max(2, Math.round(width * TRAIL_SCALE));
        const trailHeight = Math.max(2, Math.round(height * TRAIL_SCALE));
        if (!trails || trails.width !== trailWidth || trails.height !== trailHeight) {
          if (trails) {
            destroyTrailSystem(gl, trails);
          }
          trails = createTrailSystem(gl, trailWidth, trailHeight);
        }
      }
    };

    const tick = (now: number) => {
      raf = 0;
      const rawFrameMs = now - lastFrameAt;
      const dt = Math.min(0.05, rawFrameMs / 1000 || 0.016);
      lastFrameAt = now;
      if (rawFrameMs > 0 && rawFrameMs < 250) {
        frameEmaMs = frameEmaMs === 0 ? rawFrameMs : frameEmaMs + (rawFrameMs - frameEmaMs) * 0.12;
        frameCount += 1;
        const longLimit = Math.max(LONG_FRAME_FLOOR_MS, refreshMs * LONG_FRAME_FACTOR);
        if (rawFrameMs > longLimit) {
          longFrames += 1;
        }
        if (rawFrameMs > 4 && rawFrameMs < refreshMs) {
          refreshMs = rawFrameMs;
        }
      }
      if (frameCount >= 72 && now - lastQualityAt > 1200) {
        const saturated = frameEmaMs > FRAME_BUDGET_DOWN_MS;
        const longShare = longFrames / Math.max(frameCount, 1);
        const climbing = !saturated && longShare <= CLIMB_LONG_SHARE;
        const nextScale = qualityStep(resScale, saturated, climbing);
        if (nextScale !== resScale) {
          resScale = nextScale;
          resize();
        }
        lastQualityAt = now;
        frameCount = 0;
        longFrames = 0;
      }
      const drifting = !finePointerQuery.matches || now - lastMoveAt > 4000;
      if (drifting) {
        driftT += dt;
        pointer.tx = 0.5 + 0.34 * Math.sin(driftT * 0.31) * Math.cos(driftT * 0.117 + 1.7);
        pointer.ty = 0.5 + 0.3 * Math.sin(driftT * 0.23 + 0.8);
        energy.target = 0.8;
      } else if (now - lastMoveAt > 1400) {
        energy.target = 0.62;
      }
      const ease = 1 - Math.exp(-dt * 3.4);
      pointer.x += (pointer.tx - pointer.x) * ease;
      pointer.y += (pointer.ty - pointer.y) * ease;
      energy.value += (energy.target - energy.value) * ease;
      draw((now - startTime) / 1000 % 300, dt);
      if (running) {
        raf = requestAnimationFrame(tick);
      }
    };

    const sync = () => {
      const shouldRun = !motionQuery.matches && inView && !document.hidden && !!washProgram;
      if (running !== shouldRun) {
        running = shouldRun;
        if (running) {
          lastFrameAt = performance.now();
          raf = requestAnimationFrame(tick);
        } else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      }
      if (washProgram && !running && motionQuery.matches) {
        draw(31.7, 0.016);
      }
    };

    const trackPointer = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.tx = (event.clientX - rect.left) / (rect.width || 1);
      pointer.ty = 1 - (event.clientY - rect.top) / (rect.height || 1);
    };

    const onPointerMove = (event: PointerEvent) => {
      trackPointer(event);
      energy.target = 1;
      lastMoveAt = performance.now();
    };

    const onPointerDown = (event: PointerEvent) => {
      trackPointer(event);
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
      energy.value = Math.max(energy.value, 0.8);
      energy.target = 1;
      lastMoveAt = performance.now();
      if (!running && !motionQuery.matches && inView && !document.hidden) {
        draw((performance.now() - startTime) / 1000 % 300, 0.016);
      }
    };

    const onVisibilityChange = () => sync();
    const onContextLost = (event: Event) => {
      event.preventDefault();
      washProgram = null;
      trails = null;
      if (particles) {
        destroyParticleSystem(gl, particles);
        particles = null;
      }
      particleCount = 0;
      live = false;
      canvas.classList.remove("signal-index-field-live");
      sync();
    };
    const onContextRestored = () => {
      washProgram = link(gl, VERT, FRAG);
      washUniforms = washProgram
        ? collectUniforms(gl, washProgram, ["u_res", "u_time", "u_pointer", "u_energy"])
        : {};
      if (washProgram && vao) {
        gl.bindVertexArray(vao);
      }
      if (washProgram && !motionQuery.matches) {
        particles = createParticleSystem(gl, aspect, area);
        if (particles) {
          particleCount = particles.count;
        }
      }
      resize();
      sync();
      if (washProgram && !motionQuery.matches) {
        draw((performance.now() - startTime) / 1000 % 300, 0.016);
      }
    };

    washProgram = link(gl, VERT, FRAG);
    if (!washProgram || !vao) {
      return;
    }
    washUniforms = collectUniforms(gl, washProgram, ["u_res", "u_time", "u_pointer", "u_energy"]);
    gl.bindVertexArray(vao);
    gl.enable(gl.BLEND);

    resize();
    if (!motionQuery.matches) {
      particles = createParticleSystem(gl, aspect, area);
      if (particles) {
        particleCount = particles.count;
        resize();
      }
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (!running) {
        draw((performance.now() - startTime) / 1000 % 300, 0.016);
      }
    });
    const intersection = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      sync();
    });

    observer.observe(host);
    intersection.observe(canvas);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    motionQuery.addEventListener("change", sync);

    resize();
    sync();

    return () => {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      observer.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      motionQuery.removeEventListener("change", sync);
      if (washProgram) {
        gl.deleteProgram(washProgram);
        washProgram = null;
      }
      if (particles) {
        destroyParticleSystem(gl, particles);
        particles = null;
      }
      if (trails) {
        destroyTrailSystem(gl, trails);
        trails = null;
      }
      gl.deleteVertexArray(vao);
    };
  }, []);

  return <canvas ref={canvasRef} className="signal-index-hero-field" aria-hidden="true" />;
}
