import * as THREE from "three";
import { buildCosmicField } from "./fieldgen";
import type { SimState } from "./cosmology";
import type { ParticleUniforms } from "./particles";

export interface Poke {
  x: number;
  y: number;
  z: number;
  t0: number;
}

export interface GpgpuParticles {
  points: THREE.Points;
  particleCount: number;
  tune: { motion: number };
  uniforms: ParticleUniforms;
  step(dt: number, st: SimState, animTime: number, poke: Poke | null): void;
  resetTo(webMix: number): void;
  dispose(): void;
}

export function gpgpuSupported(renderer: THREE.WebGLRenderer): boolean {
  if (!renderer.capabilities.isWebGL2) return false;
  const gl = renderer.getContext();
  return (
    gl.getExtension("EXT_color_buffer_float") !== null ||
    gl.getExtension("EXT_color_buffer_half_float") !== null
  );
}

const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 snoiseVec3(vec3 x) {
  return vec3(
    snoise(x),
    snoise(x + vec3(123.4, 57.1, 91.7)),
    snoise(x + vec3(-71.3, 214.5, -33.9)));
}

vec3 curlNoise(vec3 p) {
  const float e = 0.12;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 px0 = snoiseVec3(p - dx);
  vec3 px1 = snoiseVec3(p + dx);
  vec3 py0 = snoiseVec3(p - dy);
  vec3 py1 = snoiseVec3(p + dy);
  vec3 pz0 = snoiseVec3(p - dz);
  vec3 pz1 = snoiseVec3(p + dz);
  float x = py1.z - py0.z - pz1.y + pz0.y;
  float y = pz1.x - pz0.x - px1.z + px0.z;
  float z = px1.y - px0.y - py1.x + py0.x;
  return vec3(x, y, z) / (2.0 * e);
}
`;

const FS_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const SEED_FRAG = /* glsl */ `
uniform sampler2D uSphereTex;
uniform sampler2D uTargetTex;
uniform float uWebMix;
varying vec2 vUv;

void main() {
  vec4 s = texture2D(uSphereTex, vUv);
  vec4 t = texture2D(uTargetTex, vUv);
  gl_FragColor = vec4(mix(s.xyz, t.xyz, uWebMix), s.w);
}
`;

const ZERO_FRAG = /* glsl */ `
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
`;

const VEL_FRAG = /* glsl */ `
uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform sampler2D uTargetTex;
uniform float uDt;
uniform float uTime;
uniform float uTurb;
uniform float uWebK;
uniform float uDamp;
uniform vec3 uPokePos;
uniform float uPush;
uniform float uPull;
varying vec2 vUv;

${NOISE_GLSL}

void main() {
  vec4 pos4 = texture2D(uPosTex, vUv);
  vec3 vel = texture2D(uVelTex, vUv).xyz;
  vec3 tgt = texture2D(uTargetTex, vUv).xyz;

  vec3 p = pos4.xyz;
  vec3 accel =
    curlNoise(p * 0.055 + vec3(0.0, uTime * 0.045, 0.0)) * uTurb +
    curlNoise(p * 0.16 - vec3(uTime * 0.03, 0.0, uTime * 0.02)) * uTurb * 0.35;

  accel += (tgt - p) * uWebK;

  vec3 d = p - uPokePos;
  float r2 = dot(d, d) + 0.8;
  accel += (d * inversesqrt(r2)) * ((uPush - uPull) / r2);

  vec3 v = vel + accel * uDt;
  float sp = length(v);
  if (sp > 26.0) v *= 26.0 / sp;
  v *= exp(-uDamp * uDt);

  gl_FragColor = vec4(v, 0.0);
}
`;

const POS_FRAG = /* glsl */ `
uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform float uDt;
varying vec2 vUv;

void main() {
  vec4 pos4 = texture2D(uPosTex, vUv);
  vec3 v = texture2D(uVelTex, vUv).xyz;
  vec3 p = clamp(pos4.xyz + v * uDt, vec3(-500.0), vec3(500.0));
  gl_FragColor = vec4(p, pos4.w);
}
`;

const DRAW_VERT = /* glsl */ `
attribute vec2 aRef;

uniform sampler2D uPosTex;
uniform sampler2D uTargetTex;
uniform float uA;
uniform float uTime;
uniform float uWeb;
uniform float uPlasma;
uniform float uSpark;
uniform float uStar;
uniform float uH;
uniform vec3 uHot;

varying vec3 vCol;
varying float vA;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  vec4 pos4 = texture2D(uPosTex, aRef);
  vec4 tgt4 = texture2D(uTargetTex, aRef);
  vec3 rawPos = pos4.xyz;
  vec3 p = rawPos * uA;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float w = pos4.w;
  float h1 = hash(w * 91.7 + 0.31);
  float h2 = tgt4.w;
  float h3 = hash(w * 157.3 + 2.71);
  float h4 = hash(w * 74.7 + h2 * 13.7);

  float isStar = step(0.9995, h2);
  float starOn = isStar * uStar * smoothstep(0.8, 1.0, uWeb);

  float early = pow(clamp(1.0 - uA * 1.9, 0.0, 1.0), 1.6);
  float twinkle = 0.75 + 0.45 * sin(uTime * (6.0 + 8.0 * h3) + h4 * 40.0);
  float sp = uSpark * step(0.994, hash(floor(uTime * 13.0) + h1 * 91.7 + h2 * 57.1));

  // plasma radius grading from uHot (blackbody): searing white core -> blue-white body
  // -> deep blue fringe, mottled by per-particle jitter.
  float rn = clamp(length(rawPos) / 40.0, 0.0, 1.0);
  float rr = clamp(rn + (h3 - 0.5) * 0.18, 0.0, 1.0);
  vec3 core = mix(vec3(1.0), uHot, 0.2);
  vec3 body = min(uHot * vec3(1.1, 1.3, 1.75), vec3(1.0));
  vec3 fringe = uHot * 0.38;
  vec3 plasmaCol = mix(core, body, smoothstep(0.10, 0.55, rr));
  plasmaCol = mix(plasmaCol, fringe, smoothstep(0.55, 0.90, rr));

  // base brightness blends back to the legacy curve as uWeb rises so the
  // web era keeps the legacy amber-ink look (the star palette below is the
  // one intentional post-recombination change).
  float b = mix(mix(0.30, 0.72, h4), mix(0.55, 1.0, h4), uWeb);
  b *= mix(0.62, 1.0, uWeb);
  b *= mix(1.0, 0.42, uWeb);
  b *= 1.0 + 0.45 * early;
  b *= 1.0 + 3.5 * sp;
  b *= 1.0 + 2.2 * starOn * twinkle;

  vec3 col = mix(uHot, vec3(0.62, 0.37, 0.24), uWeb * 0.9);
  col = mix(plasmaCol, col, clamp(1.0 - uPlasma, 0.0, 1.0));
  vec3 starCool = vec3(0.99, 0.83, 0.62);
  vec3 starSolar = vec3(1.0, 0.96, 0.90);
  vec3 starHot = vec3(0.72, 0.82, 1.05);
  vec3 starCol = mix(mix(starCool, starSolar, step(0.22, h4)), starHot, step(0.55, h4));
  col = mix(col, starCol, starOn);
  col *= 0.85 + 0.3 * h3;

  vCol = col * b;
  vA = clamp(b, 0.0, 1.0);

  float sz = mix(1.0, 2.3, h3);
  sz *= 1.0 + 2.4 * starOn + 0.5 * early;
  gl_PointSize = sz * uH * 0.0018 * (46.0 / max(1.0, -mv.z));
}
`;

const DRAW_FRAG = /* glsl */ `
varying vec3 vCol;
varying float vA;

void main() {
  vec2 q = gl_PointCoord - 0.5;
  float d = length(q);
  if (d > 0.5) discard;
  float fall = smoothstep(0.5, 0.05, d);
  float core = smoothstep(0.16, 0.0, d);
  vec3 c = vCol * (fall + 1.6 * core);
  gl_FragColor = vec4(c, vA * fall);
}
`;

function makeStateTarget(side: number, type: THREE.TextureDataType): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(side, side, {
    type,
    format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
}

function makeDataTexture(data: Float32Array, side: number): THREE.DataTexture {
  const tex = new THREE.DataTexture(data as unknown as ArrayBuffer, side, side, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export function createGpgpuParticles(
  renderer: THREE.WebGLRenderer,
  requestedCount: number,
): GpgpuParticles {
  const side = Math.ceil(Math.sqrt(requestedCount));
  const count = side * side;
  const type = renderer.extensions.has("EXT_color_buffer_float")
    ? THREE.FloatType
    : THREE.HalfFloatType;

  const field = buildCosmicField(count);

  const sphereData = new Float32Array(count * 4);
  const targetData = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    sphereData[i * 4] = field.positions[i * 3];
    sphereData[i * 4 + 1] = field.positions[i * 3 + 1];
    sphereData[i * 4 + 2] = field.positions[i * 3 + 2];
    sphereData[i * 4 + 3] = field.seeds[i * 4];
    targetData[i * 4] = field.struct[i * 3];
    targetData[i * 4 + 1] = field.struct[i * 3 + 1];
    targetData[i * 4 + 2] = field.struct[i * 3 + 2];
    targetData[i * 4 + 3] = field.seeds[i * 4 + 1];
  }

  const sphereTex = makeDataTexture(sphereData, side);
  const targetTex = makeDataTexture(targetData, side);

  const posRT = [makeStateTarget(side, type), makeStateTarget(side, type)];
  const velRT = [makeStateTarget(side, type), makeStateTarget(side, type)];
  let read = 0;

  const fsScene = new THREE.Scene();
  const fsCam = new THREE.Camera();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  fsScene.add(quad);

  function runPass(mat: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget): void {
    quad.material = mat;
    renderer.setRenderTarget(target);
    renderer.render(fsScene, fsCam);
  }

  const seedMat = new THREE.ShaderMaterial({
    vertexShader: FS_VERT,
    fragmentShader: SEED_FRAG,
    uniforms: {
      uSphereTex: { value: sphereTex },
      uTargetTex: { value: targetTex },
      uWebMix: { value: 0 },
    },
  });

  const zeroMat = new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: ZERO_FRAG });

  const simShared = {
    uDt: { value: 0 } as THREE.IUniform<number>,
    uTime: { value: 0 } as THREE.IUniform<number>,
    uTurb: { value: 0 } as THREE.IUniform<number>,
    uWebK: { value: 0 } as THREE.IUniform<number>,
    uDamp: { value: 0 } as THREE.IUniform<number>,
    uPokePos: { value: new THREE.Vector3() },
    uPush: { value: 0 } as THREE.IUniform<number>,
    uPull: { value: 0 } as THREE.IUniform<number>,
  };

  const velMat = new THREE.ShaderMaterial({
    vertexShader: FS_VERT,
    fragmentShader: VEL_FRAG,
    uniforms: {
      uPosTex: { value: null },
      uVelTex: { value: null },
      uTargetTex: { value: targetTex },
      ...simShared,
    },
  });

  const posMat = new THREE.ShaderMaterial({
    vertexShader: FS_VERT,
    fragmentShader: POS_FRAG,
    uniforms: {
      uPosTex: { value: null },
      uVelTex: { value: null },
      uDt: simShared.uDt,
    },
  });

  function resetTo(webMix: number): void {
    seedMat.uniforms.uWebMix.value = webMix;
    runPass(seedMat, posRT[0]);
    runPass(seedMat, posRT[1]);
    runPass(zeroMat, velRT[0]);
    runPass(zeroMat, velRT[1]);
    renderer.setRenderTarget(null);
  }

  resetTo(0);

  const refs = new Float32Array(count * 2);
  const zeros = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    refs[i * 2] = ((i % side) + 0.5) / side;
    refs[i * 2 + 1] = (Math.floor(i / side) + 0.5) / side;
  }

  const drawUniforms = {
    uPosTex: { value: null as THREE.Texture | null },
    uTargetTex: { value: targetTex },
    uA: { value: 0.0008 },
    uTime: { value: 0 },
    uWeb: { value: 0 },
    uPlasma: { value: 1 },
    uSpark: { value: 0 },
    uStar: { value: 0 },
    uHot: { value: new THREE.Color(1, 1, 1) },
    uH: { value: 1080 },
  };

  const drawMat = new THREE.ShaderMaterial({
    vertexShader: DRAW_VERT,
    fragmentShader: DRAW_FRAG,
    uniforms: drawUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(zeros, 3));
  geometry.setAttribute("aRef", new THREE.BufferAttribute(refs, 2));

  const points = new THREE.Points(geometry, drawMat);
  points.frustumCulled = false;
  points.renderOrder = 2;

  const tune = { motion: 1 };

  return {
    points,
    particleCount: count,
    tune,
    uniforms: drawUniforms as unknown as ParticleUniforms,
    step(dtRaw, st, animTime, poke) {
      const dt = Math.min(dtRaw, 1 / 30);
      const motion = tune.motion;
      const env = poke ? Math.exp(-(animTime - poke.t0) * 3.2) : 0;
      if (env < 0.01 || poke === null) {
        simShared.uPush.value = 0;
        simShared.uPull.value = 0;
      } else {
        simShared.uPokePos.value.set(poke.x, poke.y, poke.z);
        simShared.uPush.value = 150 * st.plasma * motion * env;
        simShared.uPull.value = 120 * st.web * motion * env;
      }
      simShared.uDt.value = dt;
      simShared.uTime.value = animTime;
      simShared.uTurb.value = (1.15 + 24 * st.plasma) * motion;
      simShared.uWebK.value = 7.5 * st.web * st.web;
      simShared.uDamp.value = 1.8 + 1.8 * st.web;

      const write = 1 - read;
      velMat.uniforms.uPosTex.value = posRT[read].texture;
      velMat.uniforms.uVelTex.value = velRT[read].texture;
      runPass(velMat, velRT[write]);

      posMat.uniforms.uPosTex.value = posRT[read].texture;
      posMat.uniforms.uVelTex.value = velRT[write].texture;
      runPass(posMat, posRT[write]);

      read = write;
      renderer.setRenderTarget(null);
      drawUniforms.uPosTex.value = posRT[read].texture;
    },
    resetTo,
    dispose() {
      geometry.dispose();
      drawMat.dispose();
      velMat.dispose();
      posMat.dispose();
      seedMat.dispose();
      zeroMat.dispose();
      for (const rt of [...posRT, ...velRT]) rt.dispose();
      sphereTex.dispose();
      targetTex.dispose();
    },
  };
}
