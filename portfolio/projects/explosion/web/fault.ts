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
