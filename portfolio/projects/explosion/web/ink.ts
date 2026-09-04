// ink.ts — "Ink Shockwave" fluid simulation entry (second Explosion mode).
// Law: the field textures (velocity/dye/pressure pairs) are the single source of
// truth; the CPU side owns only scalars (phase, counters, shock state) and never
// mirrors pixels, so a stale-pixel desync is unrepresentable — the display pass
// samples the same textures the solver wrote this frame. TypeScript-only; no
// readback; every splat is an event-time write into the same field everyone reads.
import * as THREE from "three";
import { DetonationSfx } from "./audio";
import {
  PASS_VERT, CLEAR_FRAG, ADVECT_FRAG, SPLAT_DYE_FRAG, SPLAT_VEL_FRAG,
  CURL_FRAG, VORTICITY_FRAG, DIVERGENCE_FRAG, PRESSURE_FRAG, GRADIENT_FRAG,
  DISPLAY_FRAG,
} from "./ink-shaders";

export type InkPhase = "still" | "live" | "blast";

export type InkStats = {
  fps: number;
  engagements: number;  // detonations fired (auto one included)
  phase: InkPhase;
  splats: number;       // cumulative stir frames + detonations
  grid: number;         // sim grid long side
  dye: number;          // dye grid long side
  jacobi: number;
};

export type InkHandle = {
  detonateAt(clientX: number, clientY: number): boolean;
  restore(): void;
  setMuted(muted: boolean): void;
  setSlowMo(slow: boolean): void;
  dispose(): void;
  readonly stats: InkStats;
};

const SIM_LONG = 128;            // software tier: 96
const SIM_SHORT_MIN = 64;
const DYE_LONG = 480;            // software tier: 320
const JACOBI = 24;               // software tier: 16
const CURL_EPS = 12.0;
const PRESSURE_DECAY = 0.8;      // per-frame CLEAR multiplier on pressure
const VEL_DISSIPATION = 0.08;
const DYE_DISSIPATION = 0.06;
const DT_MAX = 0.05;
const SLOW_MO_SCALE = 0.35;
const STIR_MAX = 1.2;            // uv/s clamp on stir impulse length
const STIR_RADIUS_UV = 0.045;
const STIR_DYE_RADIUS_UV = 0.03;
const STIR_DYE_STRENGTH = 0.18;
const BLAST_POP_UV = 0.6;        // initial radial pop impulse (uv/s), disc r 0.08 uv
const SHOCK_DUR = 0.55;          // s
const SHOCK_SPEED = 0.55;        // uv/s ring travel
const SHOCK_WIDTH_UV = 0.035;
const SHOCK_F0 = 3.2;            // uv/s² per-frame ring impulse scale
const SHOCK_TAU = 0.16;          // s, ring force decay
const BLAST_CORE_RADIUS_UV = 0.10;  // #ffd9a0, strength 0.9
const BLAST_HALO_RADIUS_UV = 0.22;  // #e4a669, strength 0.35
const INTRO_DELAY = 0.9;         // s, auto-detonation after mount
const POUR_SEED = 0x1a9f;        // mulberry32 seed for the pristine composition
const PIXEL_RATIO_MAX = 1.5;

// NoColorSpace: the display shader is raw (three injects no colorspace chunk into
// custom ShaderMaterials), so palette values must stay sRGB exactly as designed.
const raw = (hex: number): THREE.Color => new THREE.Color().setHex(hex, THREE.NoColorSpace);
const HEAT = {
  ash: raw(0x2b2622), ember: raw(0x8a3a1e),
  mid: raw(0xd39b61), warm: raw(0xe4a669),
  hot: raw(0xffd9a0),
};
const STIR_PALETTE = [HEAT.ember, HEAT.ash, HEAT.mid];

// Deterministic PRNG: the pristine pour must be identical on every mount/restore.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampLength(v: THREE.Vector2, max: number): THREE.Vector2 {
  const l = v.length();
  if (l > max) v.multiplyScalar(max / l);
  return v;
}

export function formatInkHud(stats: InkStats): string {
  return ["fps " + Math.round(stats.fps), "phase " + stats.phase, "splats " + stats.splats,
    "grid " + stats.grid, "blasts " + stats.engagements].join(" · ");
}

type Pair = { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget };
const swap = (p: Pair): void => { const t = p.read; p.read = p.write; p.write = t; };

type VelSplat = {
  mode: 0 | 1; radiusUv: number; strength: number; radial: 0 | 1;
  impulse?: THREE.Vector2; impulseScale?: number; ringInnerUv?: number; ringOuterUv?: number;
};

export function mountInk(element: HTMLElement): InkHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  // Extension check precedes any float target creation.
  const gl = renderer.getContext();
  const hasFloat = gl.getExtension("EXT_color_buffer_float") !== null;
  const hasHalf = gl.getExtension("EXT_color_buffer_half_float") !== null;
  if (!hasFloat && !hasHalf) { renderer.dispose(); return null; }
  // Software tier: downgrade only on a positive renderer-string match.
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const rendererName = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? "") : "";
  const software = /swiftshader|software|llvmpipe/i.test(rendererName);
  const simLong = software ? 96 : SIM_LONG;
  const dyeLong = software ? 320 : DYE_LONG;
  const jacobi = software ? 16 : JACOBI;

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_MAX));
  element.appendChild(renderer.domElement);
  renderer.autoClear = false; // additive splats into persistent targets need no implicit clears
  const reduced = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const audio = new DetonationSfx();

  const w0 = Math.max(1, element.clientWidth || 1);
  const h0 = Math.max(1, element.clientHeight || 1);
  renderer.setSize(w0, h0, false);
  const bufSize = renderer.getDrawingBufferSize(new THREE.Vector2());
  // Grids are sized once from the initial aspect; a later resize only stretches the
  // display (ink persists, grid shape does not follow the canvas).
  const aspect = w0 / h0;
  const gridFor = (long: number): [number, number] => {
    const short = Math.max(SIM_SHORT_MIN, Math.round(aspect >= 1 ? long / aspect : long * aspect));
    return aspect >= 1 ? [long, short] : [short, long];
  };
  const [simW, simH] = gridFor(simLong);
  const [dyeW, dyeH] = gridFor(dyeLong);
  const texel = new THREE.Vector2(1 / simW, 1 / simH);

  const createTarget = (w: number, h: number, filter: THREE.MagnificationTextureFilter) =>
    new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: filter, magFilter: filter,
      wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
    });
  const velocity: Pair = { read: createTarget(simW, simH, THREE.LinearFilter), write: createTarget(simW, simH, THREE.LinearFilter) };
  const pressure: Pair = { read: createTarget(simW, simH, THREE.NearestFilter), write: createTarget(simW, simH, THREE.NearestFilter) };
  const dye: Pair = { read: createTarget(dyeW, dyeH, THREE.LinearFilter), write: createTarget(dyeW, dyeH, THREE.LinearFilter) };
  const curlRT = createTarget(simW, simH, THREE.NearestFilter);
  const divRT = createTarget(simW, simH, THREE.NearestFilter);
  const targets = [velocity.read, velocity.write, pressure.read, pressure.write, dye.read, dye.write, curlRT, divRT];

  const nullTex = (): { value: THREE.Texture | null } => ({ value: null });
  const clearU = { uSource: nullTex(), uValue: { value: 0 } };
  const advU = { uVelocity: nullTex(), uSource: nullTex(), uDt: { value: 0 }, uDissipation: { value: 0 } };
  const splatDyeU = {
    uPoint: { value: new THREE.Vector2() }, uResolution: { value: new THREE.Vector2() },
    uColor: { value: new THREE.Color() }, uRadius: { value: 1 }, uStrength: { value: 0 },
  };
  const splatVelU = {
    uPoint: { value: new THREE.Vector2() }, uResolution: { value: new THREE.Vector2() },
    uRadius: { value: 1 }, uStrength: { value: 0 }, uMode: { value: 0 }, uRingInner: { value: 0 },
    uRingOuter: { value: 0 }, uRadial: { value: 0 }, uImpulse: { value: new THREE.Vector2() },
    uImpulseScale: { value: 0 },
  };
  const curlU = { uVelocity: nullTex(), uTexel: { value: texel } };
  const vortU = { uVelocity: nullTex(), uCurl: nullTex(), uTexel: { value: texel }, uCurlEps: { value: CURL_EPS }, uDt: { value: 0 } };
  const divU = { uVelocity: nullTex(), uTexel: { value: texel } };
  const presU = { uPressure: nullTex(), uDivergence: nullTex(), uTexel: { value: texel } };
  const gradU = { uPressure: nullTex(), uVelocity: nullTex(), uTexel: { value: texel } };
  const dispU = { uDye: nullTex(), uTime: { value: 0 }, uResolution: { value: new THREE.Vector2() } };

  const simOpts = { blending: THREE.NoBlending, depthTest: false, depthWrite: false };
  const addOpts = {
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor, depthTest: false, depthWrite: false,
  };
  const mat = (frag: string, uniforms: Record<string, THREE.IUniform>, additive = false) =>
    new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: PASS_VERT, fragmentShader: frag, uniforms,
      ...(additive ? addOpts : simOpts),
    });
  const clearMat = mat(CLEAR_FRAG, clearU);
  const advMat = mat(ADVECT_FRAG, advU);
  const splatDyeMat = mat(SPLAT_DYE_FRAG, splatDyeU, true);
  const splatVelMat = mat(SPLAT_VEL_FRAG, splatVelU, true);
  const curlMat = mat(CURL_FRAG, curlU);
  const vortMat = mat(VORTICITY_FRAG, vortU);
  const divMat = mat(DIVERGENCE_FRAG, divU);
  const presMat = mat(PRESSURE_FRAG, presU);
  const gradMat = mat(GRADIENT_FRAG, gradU);
  const dispMat = mat(DISPLAY_FRAG, dispU);
  const materials = [clearMat, advMat, splatDyeMat, splatVelMat, curlMat, vortMat, divMat, presMat, gradMat, dispMat];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const mesh = new THREE.Mesh(geometry, clearMat);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const runPass = (material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null): void => {
    mesh.material = material;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
  };

  // Radii/distances are in canvas pixels so splats stay round after a stretch resize.
  const splatDye = (p: THREE.Vector2, color: THREE.Color, radiusUv: number, strength: number): void => {
    splatDyeU.uPoint.value.copy(p);
    splatDyeU.uResolution.value.copy(bufSize);
    splatDyeU.uColor.value.copy(color);
    splatDyeU.uRadius.value = radiusUv * bufSize.x;
    splatDyeU.uStrength.value = strength;
    runPass(splatDyeMat, dye.read);
  };
  const splatVel = (p: THREE.Vector2, s: VelSplat): void => {
    splatVelU.uPoint.value.copy(p);
    splatVelU.uResolution.value.copy(bufSize);
    splatVelU.uRadius.value = s.radiusUv * bufSize.x;
    splatVelU.uStrength.value = s.strength;
    splatVelU.uMode.value = s.mode;
    splatVelU.uRingInner.value = (s.ringInnerUv ?? 0) * bufSize.x;
    splatVelU.uRingOuter.value = (s.ringOuterUv ?? 0) * bufSize.x;
    splatVelU.uRadial.value = s.radial;
    if (s.impulse) splatVelU.uImpulse.value.copy(s.impulse); else splatVelU.uImpulse.value.set(0, 0);
    splatVelU.uImpulseScale.value = s.impulseScale ?? 0;
    runPass(splatVelMat, velocity.read);
  };

  const stats: InkStats = { fps: 0, engagements: 0, phase: "still", splats: 0, grid: simLong, dye: dyeLong, jacobi };
  const shock = { point: new THREE.Vector2(), t: 0, active: false };
  const pointer = { uv: new THREE.Vector2(), delta: new THREE.Vector2(), has: false, moved: false };
  const tmpV = new THREE.Vector2();
  const t0 = performance.now();
  let introTimer = reduced ? 0 : INTRO_DELAY;
  let slowMo = false;
  let raf = 0;
  let disposed = false;

  // CLEAR into the tail then swap, twice: both halves zeroed, nothing samples its own target.
  const clearPair = (p: Pair): void => {
    for (let i = 0; i < 2; i++) {
      clearU.uSource.value = p.read.texture;
      clearU.uValue.value = 0;
      runPass(clearMat, p.write);
      swap(p);
    }
  };
  const clearField = (): void => { clearPair(velocity); clearPair(dye); clearPair(pressure); renderer.setRenderTarget(null); };

  const pour = (): void => {
    const rnd = mulberry32(POUR_SEED);
    const c = new THREE.Vector2();
    for (let d = 0; d < 5; d++) {
      const cx = 0.2 + rnd() * 0.6, cy = 0.2 + rnd() * 0.6;
      const arcR = 0.08 + rnd() * 0.1, a0 = rnd() * Math.PI * 2, da = 0.3 + rnd() * 0.4;
      const n = 4 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const a = a0 + da * i;
        c.set(cx + Math.cos(a) * arcR, cy + Math.sin(a) * arcR);
        const pick = rnd();
        const color = pick < 0.45 ? HEAT.ember : pick < 0.85 ? HEAT.ash : HEAT.mid;
        splatDye(c, color, 0.05 + rnd() * 0.06, 0.25 + rnd() * 0.15);
      }
    }
    for (let s = 0; s < 2; s++) {
      c.set(0.3 + rnd() * 0.4, 0.3 + rnd() * 0.4);
      tmpV.set(0.5 - c.y, c.x - 0.5).normalize().multiplyScalar(0.25);
      splatVel(c, { mode: 0, radiusUv: 0.12, strength: 1, radial: 0, impulse: tmpV });
    }
    renderer.setRenderTarget(null);
  };

  const display = (): void => {
    dispU.uDye.value = dye.read.texture;
    dispU.uTime.value = (performance.now() - t0) / 1000;
    dispU.uResolution.value.copy(bufSize);
    renderer.setRenderTarget(null);
    renderer.clear();
    runPass(dispMat, null);
  };

  const detonateAtUv = (uv: THREE.Vector2, auto: boolean): void => {
    if (!auto) audio.resume();
    audio.boom(auto ? 0.7 : 1.0);
    splatDye(uv, HEAT.hot, BLAST_CORE_RADIUS_UV, 0.9);
    splatDye(uv, HEAT.warm, BLAST_HALO_RADIUS_UV, 0.35);
    splatVel(uv, { mode: 0, radiusUv: 0.08, strength: 1, radial: 1, impulseScale: BLAST_POP_UV });
    renderer.setRenderTarget(null);
    shock.point.copy(uv); shock.t = 0; shock.active = true;
    stats.engagements += 1; stats.splats += 1; stats.phase = "blast";
  };

  const step = (simDt: number): void => {
    if (pointer.moved) {
      pointer.moved = false;
      if (simDt > 0 && pointer.delta.lengthSq() > 0) {
        const imp = clampLength(tmpV.copy(pointer.delta).divideScalar(simDt), STIR_MAX);
        splatVel(pointer.uv, { mode: 0, radiusUv: STIR_RADIUS_UV, strength: 1, radial: 0, impulse: imp });
        const color = STIR_PALETTE[Math.floor(Math.random() * STIR_PALETTE.length)] ?? HEAT.ember;
        splatDye(pointer.uv, color, STIR_DYE_RADIUS_UV, STIR_DYE_STRENGTH);
        stats.splats += 1;
        if (stats.phase === "still") stats.phase = "live";
      }
      pointer.delta.set(0, 0);
    }
    if (shock.active) {
      shock.t += simDt;
      if (shock.t >= SHOCK_DUR) {
        shock.active = false; stats.phase = "live";
      } else {
        splatVel(shock.point, {
          mode: 1, radiusUv: 0, strength: 1, radial: 1,
          ringInnerUv: Math.max(0, SHOCK_SPEED * shock.t - SHOCK_WIDTH_UV / 2),
          ringOuterUv: SHOCK_SPEED * shock.t + SHOCK_WIDTH_UV / 2,
          impulseScale: SHOCK_F0 * Math.exp(-shock.t / SHOCK_TAU) * simDt,
        });
      }
    }
    curlU.uVelocity.value = velocity.read.texture;
    runPass(curlMat, curlRT);
    vortU.uVelocity.value = velocity.read.texture; vortU.uCurl.value = curlRT.texture; vortU.uDt.value = simDt;
    runPass(vortMat, velocity.write); swap(velocity);
    divU.uVelocity.value = velocity.read.texture;
    runPass(divMat, divRT);
    clearU.uSource.value = pressure.read.texture; clearU.uValue.value = PRESSURE_DECAY;
    runPass(clearMat, pressure.write); swap(pressure);
    presU.uDivergence.value = divRT.texture;
    for (let i = 0; i < jacobi; i++) {
      presU.uPressure.value = pressure.read.texture;
      runPass(presMat, pressure.write); swap(pressure);
    }
    gradU.uPressure.value = pressure.read.texture; gradU.uVelocity.value = velocity.read.texture;
    runPass(gradMat, velocity.write); swap(velocity);
    advU.uVelocity.value = velocity.read.texture; advU.uSource.value = velocity.read.texture;
    advU.uDt.value = simDt; advU.uDissipation.value = VEL_DISSIPATION;
    runPass(advMat, velocity.write); swap(velocity);
    advU.uVelocity.value = velocity.read.texture; advU.uSource.value = dye.read.texture;
    advU.uDissipation.value = DYE_DISSIPATION;
    runPass(advMat, dye.write); swap(dye);
    renderer.setRenderTarget(null);
  };

  const onPointerMove = (e: PointerEvent): void => {
    const r = element.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    if (pointer.has) { pointer.delta.x += x - pointer.uv.x; pointer.delta.y += y - pointer.uv.y; pointer.moved = true; }
    pointer.uv.set(x, y); pointer.has = true;
  };

  // Resize touches the renderer only: grids stay fixed, the display stretches.
  const resize = (): void => {
    const w = Math.max(1, element.clientWidth || 1), h = Math.max(1, element.clientHeight || 1);
    renderer.setSize(w, h, false);
    renderer.getDrawingBufferSize(bufSize);
    if (reduced) display();
  };
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  ro?.observe(element);

  let last = performance.now();
  const frame = (now: number): void => {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(Math.max(now - last, 0) / 1000, DT_MAX);
    last = now;
    if (dt > 0) stats.fps += (1 / dt - stats.fps) * 0.1;
    if (introTimer > 0) {
      introTimer -= dt;
      if (introTimer <= 0) { introTimer = 0; detonateAtUv(tmpV.set(0.5, 0.5), true); }
    }
    step(dt * (slowMo ? SLOW_MO_SCALE : 1));
    display();
  };

  pour();
  if (reduced) {
    display();
  } else {
    element.addEventListener("pointermove", onPointerMove);
    raf = requestAnimationFrame(frame);
  }

  return {
    stats,
    detonateAt(clientX, clientY) {
      if (reduced || disposed) return false;
      const r = element.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      const uv = new THREE.Vector2(
        THREE.MathUtils.clamp((clientX - r.left) / r.width, 0.02, 0.98),
        THREE.MathUtils.clamp(1 - (clientY - r.top) / r.height, 0.02, 0.98),
      );
      detonateAtUv(uv, false);
      return true;
    },
    restore() {
      if (disposed) return;
      audio.rebuild();
      shock.active = false; introTimer = 0;
      clearField();
      pour();
      stats.phase = "still";
      if (reduced) display();
    },
    setMuted(muted) { audio.setMuted(muted); },
    setSlowMo(slow) { slowMo = slow; },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      element.removeEventListener("pointermove", onPointerMove);
      renderer.setRenderTarget(null);
      for (const t of targets) t.dispose();
      for (const m of materials) m.dispose();
      geometry.dispose();
      renderer.dispose();
      audio.dispose();
      if (renderer.domElement.parentNode === element) element.removeChild(renderer.domElement);
    },
  };
}
