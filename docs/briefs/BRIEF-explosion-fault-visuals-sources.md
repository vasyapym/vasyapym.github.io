# Follow-up brief — the source files you asked for (cinder fault visual polish round)

Your committed decision stands: **strategy 3 — grain legibility through the authored seam profile and presentation shading, no resolution purchase.** Your budget analysis stands too (9 fps ≈ 111 ms/frame vs the 200 ms/frame gate; protect the margin). Do not redo the strategy deliberation — extend it only with the concrete design of the seam profile and shading changes (one key technical question to answer first: the authored boundary must survive Linear interpolation at 64²–96² texel pitch, i.e. the sampled seam band must cover ≥2–3 texels before the present shader sharpens the reading — size and shape the authored profile accordingly and show the math).

Then emit the code per the previous brief's output format (deliberation addendum → complete `web/fault-shaders.ts` → complete `web/fault.ts` or precise anchors → self-review notes). Everything else in that brief (reasoning directive, constraints, contract, freedom) remains binding. The complete current sources follow, verbatim.

## web/fault-shaders.ts (current, complete)

```ts
// Stress opens mineral boundaries; heat marks the work they cannot return.

export const PASS_VERT = /* glsl */ `
precision highp float;

out vec2 vUv;

void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const MINERAL_FRAG = /* glsl */ `
precision highp float;

in vec2 vUv;

uniform vec2 uSeed;

out vec4 outColor;

vec2 hash22(vec2 p) {
  vec3 h = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  h += dot(h, h.yzx + 33.33);
  return fract((h.xx + h.yz) * h.zy);
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  vec2 q = p * 6.5;
  vec2 cell = floor(q);
  vec2 local = fract(q);

  float first = 100.0;
  float second = 100.0;
  float identity = 0.0;
  float hardness = 0.0;

  for (int y = -1; y <= 1; ++y) {
    for (int x = -1; x <= 1; ++x) {
      vec2 offset = vec2(float(x), float(y));
      vec2 h = hash22(cell + offset + uSeed);
      vec2 site = offset + 0.18 + h * 0.64;
      vec2 delta = site - local;
      float distanceSquared = dot(delta, delta);

      if (distanceSquared < first) {
        second = first;
        first = distanceSquared;
        identity = h.x;
        hardness = h.y;
      } else if (distanceSquared < second) {
        second = distanceSquared;
      }
    }
  }

  float boundary = 0.5 * (sqrt(second) - sqrt(first));
  float seam = 1.0 - smoothstep(0.025, 0.115, boundary);
  float band = sin(p.x * 31.0 + p.y * 15.0 + identity * 7.0);
  float mineral = clamp(identity * 0.85 + 0.075 * band + 0.075, 0.0, 1.0);
  float cohesion = mix(0.45, 1.0, hardness);
  float mask = length(p) <= 0.86 ? 1.0 : 0.0;

  // Cohesion, mineral identity, boundary, disc mask.
  outColor = vec4(cohesion, mineral, seam, mask);
}
`;

export const RESET_FRAG = /* glsl */ `
precision highp float;

out vec4 outColor;

void main() {
  outColor = vec4(0.0);
}
`;

export const IMPULSE_FRAG = /* glsl */ `
precision highp float;

in vec2 vUv;

uniform sampler2D uState;
uniform sampler2D uMineral;
uniform vec2 uHit;
uniform float uStrength;

out vec4 outColor;

void main() {
  vec4 mineral = texture(uMineral, vUv);

  if (mineral.a < 0.5) {
    outColor = vec4(0.0);
    return;
  }

  vec4 state = texture(uState, vUv);
  vec2 p = vUv * 2.0 - 1.0;
  float distanceToHit = length(p - uHit);
  float core = exp(-distanceToHit * distanceToHit / 0.0256);
  float shellDistance = (distanceToHit - 0.23) / 0.055;
  float shell = exp(-shellDistance * shellDistance);
  float kick = (-2.8 * core + 0.55 * shell) * uStrength;

  float damage = 0.38 * core * mineral.b * uStrength;
  state.x = clamp(state.x - 0.012 * core * uStrength, -0.5, 0.5);
  state.y = clamp(state.y + kick, -4.0, 4.0);
  state.z = clamp(state.z + damage * (1.0 - state.z), 0.0, 1.0);
  state.w = clamp(state.w + (0.8 * core + 0.24 * shell) * uStrength, 0.0, 1.0);

  outColor = state;
}
`;

export const INTEGRATE_FRAG = /* glsl */ `
precision highp float;

in vec2 vUv;

uniform sampler2D uState;
uniform sampler2D uMineral;
uniform vec2 uTexel;
uniform float uDt;

out vec4 outColor;

float bond(vec4 a, vec4 b, vec4 ma, vec4 mb) {
  float boundary = max(ma.b, mb.b);
  float damage = max(a.z, b.z);
  return step(0.5, mb.a) * (1.0 - 0.985 * boundary * damage);
}

void main() {
  vec4 mineral = texture(uMineral, vUv);

  if (mineral.a < 0.5) {
    outColor = vec4(0.0);
    return;
  }

  vec2 ex = vec2(uTexel.x, 0.0);
  vec2 ey = vec2(0.0, uTexel.y);

  vec4 state = texture(uState, vUv);
  vec4 left = texture(uState, vUv - ex);
  vec4 right = texture(uState, vUv + ex);
  vec4 down = texture(uState, vUv - ey);
  vec4 up = texture(uState, vUv + ey);

  vec4 ml = texture(uMineral, vUv - ex);
  vec4 mr = texture(uMineral, vUv + ex);
  vec4 md = texture(uMineral, vUv - ey);
  vec4 mu = texture(uMineral, vUv + ey);

  float bl = bond(state, left, mineral, ml);
  float br = bond(state, right, mineral, mr);
  float bd = bond(state, down, mineral, md);
  float bu = bond(state, up, mineral, mu);

  float spacing = 2.0 * uTexel.x;
  float dl = (left.x - state.x) * step(0.5, ml.a);
  float dr = (right.x - state.x) * step(0.5, mr.a);
  float dd = (down.x - state.x) * step(0.5, md.a);
  float du = (up.x - state.x) * step(0.5, mu.a);

  float laplacian = (bl * dl + br * dr + bd * dd + bu * du)
    / (spacing * spacing);

  float strain = max(max(abs(dl), abs(dr)), max(abs(dd), abs(du))) / spacing;
  float threshold = mix(0.28, 0.82, mineral.r);
  threshold *= mix(1.35, 0.7, mineral.b);

  float damageRate = max(strain - threshold, 0.0)
    * (0.15 + 0.85 * mineral.b) * 2.4;

  float damage = clamp(
    state.z + uDt * damageRate * (1.0 - state.z),
    0.0,
    1.0
  );

  float acceleration = 0.3025 * laplacian
    - 7.0 * state.x
    - (2.2 + 4.0 * damage) * state.y;

  float velocity = clamp(state.y + uDt * acceleration, -4.0, 4.0);
  float depth = clamp(state.x + uDt * velocity, -0.5, 0.5);

  if (abs(depth) >= 0.4999) {
    velocity *= 0.25;
  }

  float heat = state.w * exp(-uDt * 0.9);
  heat += (damage - state.z) * 3.0;
  heat += uDt * 0.018 * abs(velocity) * mineral.b;

  // View-depth displacement, velocity, irreversible damage, heat.
  outColor = vec4(depth, velocity, damage, clamp(heat, 0.0, 1.0));
}
`;

export const PRESENT_FRAG = /* glsl */ `
precision highp float;

in vec2 vUv;

uniform sampler2D uState;
uniform sampler2D uMineral;
uniform vec2 uTexel;
uniform vec2 uAspect;
uniform vec3 uCoal;
uniform vec3 uClay;
uniform vec3 uEmber;
uniform vec3 uGold;

out vec4 outColor;

void main() {
  vec2 p = (vUv * 2.0 - 1.0) * uAspect;
  float radius = length(p);
  float aa = max(fwidth(radius), 0.0001);
  float coverage = 1.0 - smoothstep(0.86 - aa, 0.86 + aa, radius);

  if (radius > 0.86 + aa) {
    outColor = vec4(0.0);
    return;
  }

  vec2 uv = p * 0.5 + 0.5;
  vec2 ex = vec2(uTexel.x, 0.0);
  vec2 ey = vec2(0.0, uTexel.y);

  vec4 state = texture(uState, uv);
  vec4 mineral = texture(uMineral, uv);

  vec4 left = texture(uState, uv - ex);
  vec4 right = texture(uState, uv + ex);
  vec4 down = texture(uState, uv - ey);
  vec4 up = texture(uState, uv + ey);

  vec4 ml = texture(uMineral, uv - ex);
  vec4 mr = texture(uMineral, uv + ex);
  vec4 md = texture(uMineral, uv - ey);
  vec4 mu = texture(uMineral, uv + ey);

  float zl = mix(state.x, left.x, step(0.5, ml.a));
  float zr = mix(state.x, right.x, step(0.5, mr.a));
  float zd = mix(state.x, down.x, step(0.5, md.a));
  float zu = mix(state.x, up.x, step(0.5, mu.a));

  vec2 gradient = vec2(zr - zl, zu - zd) / (4.0 * uTexel.x);
  gradient += 0.005 * vec2(mr.g - ml.g, mu.g - md.g)
    / (4.0 * uTexel.x);
  gradient -= p * 0.14;

  vec3 normal = normalize(vec3(-gradient, 1.0));
  vec3 light = normalize(vec3(-0.45, 0.62, 0.8));
  vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));

  float diffuse = max(dot(normal, light), 0.0);
  float specular = pow(max(dot(normal, halfway), 0.0), 18.0);
  float fracture = mineral.b * smoothstep(0.1, 0.65, state.z);
  float freshBoundary = mineral.b * 0.13;

  vec3 stone = mix(uCoal, uClay, 0.2 + mineral.g * 0.65);
  stone *= 0.32 + 0.8 * diffuse;
  stone *= 1.0 - freshBoundary;
  stone *= 1.0 - 0.92 * fracture;
  stone *= clamp(1.0 + state.x * 0.8, 0.65, 1.2);
  stone += uGold * specular * (0.025 + 0.045 * mineral.g)
    * (1.0 - fracture);

  float outerRing = 1.0 - smoothstep(
    0.003,
    0.003 + aa * 1.5,
    abs(radius - 0.833)
  );
  float innerRing = 1.0 - smoothstep(
    0.0015,
    0.0015 + aa * 1.5,
    abs(radius - 0.793)
  );
  float rim = smoothstep(0.836, 0.86, radius);

  stone += uClay * (outerRing * 0.36 + innerRing * 0.12)
    * (1.0 - fracture * 0.85);
  stone = mix(stone, uCoal * 0.55, rim * 0.6);

  float heat = pow(clamp(state.w, 0.0, 1.0), 1.35);
  float glow = heat * (0.16 + mineral.b * 1.4 + fracture * 0.65);
  vec3 fire = mix(uEmber, uGold, smoothstep(0.45, 1.0, state.w));
  stone += fire * glow;

  outColor = vec4(clamp(stone, 0.0, 1.0), coverage);
}
`;
```

## web/fault.ts (current, complete)

```ts
// A mineral seal carries depth waves; broken bonds retain their history.

import * as THREE from "three";
import { DetonationSfx } from "./audio";
import {
  PASS_VERT,
  MINERAL_FRAG,
  RESET_FRAG,
  IMPULSE_FRAG,
  INTEGRATE_FRAG,
  PRESENT_FRAG,
} from "./fault-shaders";

export type FaultPhase = "pristine" | "blast" | "settling";

export type FaultStats = {
  fps: number;
  engagements: number;
  phase: FaultPhase;
  grid: number;
  steps: number;
};

export type FaultHandle = {
  detonateAt(clientX: number, clientY: number): boolean;
  restore(): void;
  setMuted(m: boolean): void;
  setSlowMo(s: boolean): void;
  dispose(): void;
  readonly stats: FaultStats;
};

type TargetPair = {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
};

type Tier = {
  grid: number;
  longEdge: number;
  maxSteps: number;
};

const HARDWARE_TIER: Tier = {
  grid: 128,
  longEdge: 720,
  maxSteps: 4,
};

const SOFTWARE_TIER: Tier = {
  grid: 64,
  longEdge: 320,
  maxSteps: 2,
};

const DISC_RADIUS = 0.86;
const FIXED_STEP = 1 / 120;
const BLAST_DURATION = 0.65;
const MINERAL_SEED = 0xc17de4a9;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function swap(pair: TargetPair): void {
  const previous = pair.read;
  pair.read = pair.write;
  pair.write = previous;
}

function makeTarget(size: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(size, size, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
}

function makeMaterial(
  fragmentShader: string,
  uniforms: Record<string, THREE.IUniform>,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: PASS_VERT,
    fragmentShader,
    uniforms,
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

function rawColor(hex: number): THREE.Color {
  return new THREE.Color().setHex(hex, THREE.NoColorSpace);
}

export function formatFaultHud(stats: FaultStats): string {
  return `fps ${Math.round(stats.fps)} · phase ${stats.phase} · engagements ${stats.engagements} · grid ${stats.grid} · steps ${stats.steps}`;
}

export function mountFault(element: HTMLElement): FaultHandle | null {
  let renderer: THREE.WebGLRenderer;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }

  const gl = renderer.getContext();

  if (
    !gl.getExtension("EXT_color_buffer_float") &&
    !gl.getExtension("EXT_color_buffer_half_float")
  ) {
    renderer.dispose();
    return null;
  }

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const rendererName: unknown = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER);

  const software = /swiftshader|software|llvmpipe/i.test(
    typeof rendererName === "string" ? rendererName : "",
  );

  const tier = software ? SOFTWARE_TIER : HARDWARE_TIER;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.NoToneMapping;

  const mineral = makeTarget(tier.grid);
  const state: TargetPair = {
    read: makeTarget(tier.grid),
    write: makeTarget(tier.grid),
  };
  const targets = [mineral, state.read, state.write];

  const random = mulberry32(MINERAL_SEED);
  const seed = new THREE.Vector2(
    Math.floor(random() * 4096),
    Math.floor(random() * 4096),
  );

  const stateInput = { value: state.read.texture };
  const mineralInput = { value: mineral.texture };
  const texel = { value: new THREE.Vector2(1 / tier.grid, 1 / tier.grid) };
  const aspect = { value: new THREE.Vector2(1, 1) };
  const hit = { value: new THREE.Vector2() };
  const strength = { value: 1 };

  const mineralMaterial = makeMaterial(MINERAL_FRAG, {
    uSeed: { value: seed },
  });

  const resetMaterial = makeMaterial(RESET_FRAG, {});

  const impulseMaterial = makeMaterial(IMPULSE_FRAG, {
    uState: stateInput,
    uMineral: mineralInput,
    uHit: hit,
    uStrength: strength,
  });

  const integrateMaterial = makeMaterial(INTEGRATE_FRAG, {
    uState: stateInput,
    uMineral: mineralInput,
    uTexel: texel,
    uDt: { value: FIXED_STEP },
  });

  const presentMaterial = makeMaterial(PRESENT_FRAG, {
    uState: stateInput,
    uMineral: mineralInput,
    uTexel: texel,
    uAspect: aspect,
    uCoal: { value: rawColor(0x281b16) },
    uClay: { value: rawColor(0x7c4b31) },
    uEmber: { value: rawColor(0xff6a2c) },
    uGold: { value: rawColor(0xffd295) },
  });

  const materials = [
    mineralMaterial,
    resetMaterial,
    impulseMaterial,
    integrateMaterial,
    presentMaterial,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [-1, -1, 0, 3, -1, 0, -1, 3, 0],
      3,
    ),
  );

  const mesh = new THREE.Mesh(geometry, resetMaterial);
  mesh.frustumCulled = false;

  const scene = new THREE.Scene();
  scene.add(mesh);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const audio = new DetonationSfx();

  const stats: FaultStats = {
    fps: 0,
    engagements: 0,
    phase: "pristine",
    grid: tier.grid,
    steps: 0,
  };

  let disposed = false;
  let slowMo = false;
  let raf: number | null = null;
  let last = performance.now();
  let accumulator = 0;
  let blastElapsed = 0;
  let bufferWidth = 0;
  let bufferHeight = 0;

  function runPass(
    material: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget | null,
  ): void {
    mesh.material = material;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
  }

  function paint(): void {
    if (disposed) {
      return;
    }

    stateInput.value = state.read.texture;
    renderer.setRenderTarget(null);
    renderer.clear();
    runPass(presentMaterial, null);
  }

  function resetState(): void {
    runPass(resetMaterial, state.read);
    runPass(resetMaterial, state.write);
    stateInput.value = state.read.texture;
    accumulator = 0;
    blastElapsed = 0;
    stats.engagements = 0;
    stats.phase = "pristine";
    stats.steps = 0;
  }

  function resize(): void {
    if (disposed) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const shortEdge = Math.min(width, height);
    const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 2);
    const scale = Math.min(pixelRatio, tier.longEdge / Math.max(width, height));

    const nextWidth = Math.max(1, Math.floor(width * scale));
    const nextHeight = Math.max(1, Math.floor(height * scale));

    aspect.value.set(width / shortEdge, height / shortEdge);

    // CSS owns the box; the capped buffer owns the fill cost.
    if (nextWidth !== bufferWidth || nextHeight !== bufferHeight) {
      bufferWidth = nextWidth;
      bufferHeight = nextHeight;
      renderer.setSize(bufferWidth, bufferHeight, false);
    }

    paint();
  }

  function frame(now: number): void {
    raf = null;

    if (disposed) {
      return;
    }

    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;

    if (dt > 0) {
      stats.fps += (1 / dt - stats.fps) * 0.1;
    }

    let steps = 0;

    if (stats.phase !== "pristine") {
      const simDt = dt * (slowMo ? 0.35 : 1);

      // Drop excess wall time instead of enlarging the stable timestep.
      accumulator = Math.min(
        accumulator + simDt,
        FIXED_STEP * tier.maxSteps,
      );

      while (
        steps < tier.maxSteps &&
        accumulator + 1e-9 >= FIXED_STEP
      ) {
        stateInput.value = state.read.texture;
        runPass(integrateMaterial, state.write);
        swap(state);

        accumulator = Math.max(0, accumulator - FIXED_STEP);
        steps += 1;
      }

      if (stats.phase === "blast") {
        blastElapsed += steps * FIXED_STEP;

        if (blastElapsed >= BLAST_DURATION) {
          stats.phase = "settling";
        }
      }
    }

    stats.steps = steps;
    paint();
    raf = requestAnimationFrame(frame);
  }

  function detonateAt(clientX: number, clientY: number): boolean {
    if (
      disposed ||
      reducedMotion ||
      !Number.isFinite(clientX) ||
      !Number.isFinite(clientY)
    ) {
      return false;
    }

    const rect = element.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const shortEdge = Math.min(rect.width, rect.height);
    const x = (2 * (clientX - rect.left) - rect.width) / shortEdge;
    const y = (rect.height - 2 * (clientY - rect.top)) / shortEdge;

    // Depth displacement leaves this orthographic footprint unchanged.
    if (x * x + y * y > DISC_RADIUS * DISC_RADIUS) {
      return false;
    }

    hit.value.set(x, y);
    strength.value = 1;
    stateInput.value = state.read.texture;

    runPass(impulseMaterial, state.write);
    swap(state);

    stats.engagements += 1;
    stats.phase = "blast";
    blastElapsed = 0;
    accumulator = 0;

    paint();

    audio.resume();
    audio.boom(strength.value);

    return true;
  }

  function restore(): void {
    if (disposed) {
      return;
    }

    resetState();
    last = performance.now();
    paint();

    audio.resume();
    audio.rebuild();
  }

  function setMuted(m: boolean): void {
    if (!disposed) {
      audio.setMuted(m);
    }
  }

  function setSlowMo(s: boolean): void {
    if (!disposed) {
      slowMo = s;
    }
  }

  function dispose(): void {
    if (disposed) {
      return;
    }

    disposed = true;

    if (raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
    }

    observer.disconnect();
    renderer.setRenderTarget(null);

    for (const target of targets) {
      target.dispose();
    }

    for (const material of materials) {
      material.dispose();
    }

    scene.remove(mesh);
    geometry.dispose();
    renderer.dispose();
    audio.dispose();

    if (renderer.domElement.parentNode === element) {
      element.removeChild(renderer.domElement);
    }
  }

  element.appendChild(renderer.domElement);

  runPass(mineralMaterial, mineral);
  resetState();
  resize();

  const observer = new ResizeObserver(resize);
  observer.observe(element);

  last = performance.now();

  if (!reducedMotion) {
    raf = requestAnimationFrame(frame);
  }

  return {
    detonateAt,
    restore,
    setMuted,
    setSlowMo,
    dispose,
    stats,
  };
}
```
