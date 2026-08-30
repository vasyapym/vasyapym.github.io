// detonate.ts — "Ember Lantern" simulation entry.
// §2 law: one owned state is the single source of truth; the draw pass rewrites all
// 600 instances from it every frame, destruction is same-frame (a shard is
// re-posed, never created/destroyed/converted), so a mid-air ghost is
// unrepresentable by construction. TypeScript-only — the wasm core is retired.
//
// Two sim backends share this entry and the phase/audio/FX/camera machinery:
// - GPGPU (ember-gpu.ts, default): shard state lives in ping-pong RGBA32F float
//   textures; fragment shaders integrate physics; the render vertex shader fetches
//   state straight from the textures — zero per-frame CPU per-shard work.
// - CPU fallback (below, when float render targets are unavailable): one owned
//   `shards` array + InstancedMesh, same law.
// Integration notes: shards render unlit (MeshBasicMaterial / raw heat color) —
// the center PointLight cannot light outward-facing faces of a convex shard sphere;
// a ground disc gives the rest plane a visible surface; DIST_MIN 4.3 keeps the
// sphere from over-zooming wide desktops; a "spent" phase separates "all shards at
// rest" from flight.
import * as THREE from "three";
import { DetonationSfx } from "./audio";
import { createEmberGpu, type EmberGpu } from "./ember-gpu";

export type Phase = "pristine" | "detonating" | "spent" | "settling";

export type SpecimenStats = {
  fps: number;
  engagements: number; // flashpoint blooms fired
  shards: number; // constant SHARD_COUNT
  aloft: number; // shards currently in motion
  sim: "gpu" | "cpu"; // which backend drives the shard field
  phase: Phase;
};

export type SpecimenHandle = {
  detonateAt(clientX: number, clientY: number): boolean;
  restore(): void;
  setMuted(muted: boolean): void;
  setSlowMo(slow: boolean): void;
  dispose(): void;
  readonly stats: SpecimenStats;
};

const SHARD_COUNT = 600;
const SPARK_COUNT = 400;
const R = 1.15; // rest sphere radius
const FOV = 42;
const FIT_WIDTH = 3.4;
const DIST_MIN = 4.3; // desktop cap: sphere ~70% of frame height
const DIST_MAX = 7.5; // portrait cap: sphere + fall zone in frame
const GRAV = -3.4;
const DRAG = 0.18;
const FLOOR = -1.35;
const REST_EPS = 0.35;
const COOL = 0.55;
const PRISTINE_HEAT = 0.5;
const BLOOM_DELAY = 0.09; // sim-seconds to peak dispersion
const SHOCK_DUR = 0.5;
const BASE_LIGHT = 6; // candela-ish for the physical decay=2 point light
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const CENTER = new THREE.Vector3(0, 0, 0);
const ONE = new THREE.Vector3(1, 1, 1);

const HEAT_STOPS: Array<{ t: number; c: THREE.Color }> = [
  { t: 0.0, c: new THREE.Color("#2b2622") }, // ash
  { t: 0.2, c: new THREE.Color("#8a3a1e") }, // ember cool
  { t: 0.45, c: new THREE.Color("#d39b61") }, // mid
  { t: 0.7, c: new THREE.Color("#e4a669") }, // warm
  { t: 1.0, c: new THREE.Color("#ffd9a0") }, // hot core
];

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

function heatColor(h: number, out: THREE.Color): THREE.Color {
  const x = clamp(h, 0, 1);
  for (let i = 1; i < HEAT_STOPS.length; i += 1) {
    const a = HEAT_STOPS[i - 1];
    const b = HEAT_STOPS[i];
    if (x <= b.t) {
      const span = b.t - a.t || 1;
      return out.copy(a.c).lerp(b.c, (x - a.t) / span);
    }
  }
  return out.copy(HEAT_STOPS[HEAT_STOPS.length - 1].c);
}

// Deterministic PRNG for init + per-event seeding (never per-frame layout).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Shard {
  rest: THREE.Vector3;
  restQuat: THREE.Quaternion;
  baseHeat: number; // pristine paper-glow heat (varied per shard)
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  quat: THREE.Quaternion;
  spin: THREE.Vector3; // axis * rate
  heat: number;
  resting: boolean;
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

export function mountSpecimen(element: HTMLElement): SpecimenHandle | null {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rng = mulberry32(0x5eed);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  element.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1317, 10, 24);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  let camDistance = DIST_MAX;
  let camTargetY = -0.06 * camDistance;
  let cameraPulse = 0;

  const ambient = new THREE.AmbientLight(0x3a2a1c, 1.1);
  const point = new THREE.PointLight(0xffd9a0, BASE_LIGHT, 14, 2);
  point.position.set(0, 0, 0);
  scene.add(ambient, point);

  // GPGPU path: shard state lives in ping-pong float textures (ember-gpu.ts).
  // Null when float render targets are unavailable — then the CPU path below runs.
  const gpu: EmberGpu | null = createEmberGpu(renderer, SHARD_COUNT);
  if (gpu) scene.add(gpu.mesh);

  // Ground disc: shards rest at FLOOR, so the rest plane needs a visible surface.
  const discGeo = new THREE.CircleGeometry(6.5, 48);
  const discMat = new THREE.MeshStandardMaterial({ color: 0x1a130d, roughness: 0.95 });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = FLOOR - 0.01;
  scene.add(disc);

  // CPU fallback mesh: lantern AND debris from one owned array. Unused (but still
  // constructed + disposed) when the GPGPU path is active.
  const shardGeo = new THREE.TetrahedronGeometry(0.09, 0);
  const shardMat = new THREE.MeshBasicMaterial(); // heat color IS the light; unlit
  const mesh = new THREE.InstancedMesh(shardGeo, shardMat, SHARD_COUNT);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  if (!gpu) scene.add(mesh);

  const shards: Shard[] = new Array<Shard>(SHARD_COUNT);
  for (let i = 0; i < SHARD_COUNT; i += 1) {
    const y = 1 - (i / (SHARD_COUNT - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN_ANGLE;
    const rest = new THREE.Vector3(Math.cos(theta) * rad * R, y * R, Math.sin(theta) * rad * R);
    const rq = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rng() * Math.PI * 2, rng() * Math.PI * 2, rng() * Math.PI * 2),
    );
    shards[i] = {
      rest,
      restQuat: rq,
      baseHeat: PRISTINE_HEAT + (rng() - 0.5) * 0.14,
      pos: rest.clone(),
      vel: new THREE.Vector3(),
      quat: rq.clone(),
      spin: new THREE.Vector3(),
      heat: 0,
      resting: true,
    };
    shards[i].heat = shards[i].baseHeat;
  }

  // Transient spark cloud — decorative only, never gates logic.
  const sparkPos = new Float32Array(SPARK_COUNT * 3);
  const sparkVel = new Float32Array(SPARK_COUNT * 3);
  const sparkLife = new Float32Array(SPARK_COUNT);
  for (let i = 0; i < SPARK_COUNT; i += 1) sparkPos[i * 3 + 1] = -50;
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: 0xffce8f,
    size: 0.06,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  sparks.visible = false;
  scene.add(sparks);
  let sparksActive = false;

  // Shockwave ring — one scalar drives it.
  const ringGeo = new THREE.RingGeometry(0.9, 1.0, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffd2a0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.visible = false;
  scene.add(ring);
  let shockActive = false;
  let shockT = 0;
  let lightEnergy = 1.0;

  let phase: Phase = "pristine";
  let thudded = true;
  let bloomPending = false;
  let bloomTimer = 0;
  let slowMo = false;
  let aloftCount = 0;

  const audio = new DetonationSfx();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  const stats: SpecimenStats = {
    fps: 0,
    engagements: 0,
    shards: SHARD_COUNT,
    aloft: 0,
    sim: gpu ? "gpu" : "cpu",
    phase: "pristine",
  };

  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _axis = new THREE.Vector3();
  const _color = new THREE.Color();

  function seedShards(strength: number): void {
    // A re-kick must retire the settle phase on the GPU path (mirrors the CPU
    // path, where the fresh impulse simply overwrites shard state).
    gpu?.setSettling(false);
    if (!gpu) {
      for (let i = 0; i < SHARD_COUNT; i += 1) {
        const s = shards[i];
        _axis.copy(s.pos).sub(CENTER);
        if (_axis.lengthSq() < 1e-6) _axis.copy(s.rest);
        _axis.normalize();
        const speed = (2.6 + 2.2 * strength) * (0.85 + rng() * 0.35);
        s.vel.copy(_axis).multiplyScalar(speed);
        s.vel.x += (rng() - 0.5) * 1.4;
        s.vel.y += 0.7 + rng() * 0.6;
        s.vel.z += (rng() - 0.5) * 1.4;
        s.spin.set(rng() - 0.5, rng() - 0.5, rng() - 0.5).multiplyScalar(10 + rng() * 8);
        s.heat = 1.0;
        s.resting = false;
      }
    } else {
      gpu.kick(strength);
    }
    for (let i = 0; i < SPARK_COUNT; i += 1) {
      const b = i * 3;
      sparkPos[b] = (Math.random() - 0.5) * 0.3;
      sparkPos[b + 1] = (Math.random() - 0.5) * 0.3;
      sparkPos[b + 2] = (Math.random() - 0.5) * 0.3;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const sp = 1.6 + Math.random() * 3.0;
      sparkVel[b] = Math.sin(ph) * Math.cos(th) * sp;
      sparkVel[b + 1] = Math.cos(ph) * sp + 0.8;
      sparkVel[b + 2] = Math.sin(ph) * Math.sin(th) * sp;
      sparkLife[i] = 0.3 + Math.random() * 0.7;
    }
    sparksActive = true;
    thudded = false;
    bloomPending = true;
    bloomTimer = BLOOM_DELAY;
    phase = "detonating";
  }

  function fireBloom(): void {
    shockActive = true;
    shockT = 0;
    lightEnergy = 2.6;
    cameraPulse = 1;
    stats.engagements += 1; // engagements = flashpoint blooms fired
  }

  function stepCinematic(dt: number): void {
    if (bloomPending) {
      bloomTimer -= dt;
      if (bloomTimer <= 0) {
        fireBloom();
        bloomPending = false;
      }
    }
    if (shockActive) {
      shockT += dt / SHOCK_DUR;
      if (shockT >= 1) {
        shockActive = false;
        ring.visible = false;
        ringMat.opacity = 0;
      } else {
        const s = 0.3 + shockT * 3.0;
        ring.scale.set(s, s, s);
        ringMat.opacity = (1 - shockT) * 0.8;
        ring.visible = true;
      }
    }
    const target = phase === "pristine" ? 1.0 : phase === "detonating" ? 0.55 : 0.8;
    lightEnergy += (target - lightEnergy) * (1 - Math.exp(-3 * dt));
    point.intensity = lightEnergy * BASE_LIGHT;
  }

  function stepShards(dt: number): void {
    if (gpu) {
      // GPGPU: textures integrate in shaders; aloft arrives via float readback.
      // Stepping pauses outside detonating/settling — pristine and spent shards
      // hold exactly (the CPU path also skips integration there), and the frozen
      // uNow freezes the pure-function heat at its landing value.
      if (phase === "detonating" || phase === "settling") {
        aloftCount = gpu.step(dt);
        if (phase === "detonating" && !thudded && aloftCount === 0) {
          thudded = true;
          audio.thud();
          phase = "spent";
        } else if (phase === "settling" && aloftCount === 0) {
          gpu.setSettling(false);
          phase = "pristine";
        }
      } else {
        aloftCount = 0;
      }
      return;
    }
    let aloft = 0;
    if (phase === "detonating") {
      for (let i = 0; i < SHARD_COUNT; i += 1) {
        const s = shards[i];
        if (s.resting) {
          s.heat = Math.max(0, s.heat - COOL * 0.4 * dt);
          continue;
        }
        s.vel.y += GRAV * dt;
        s.vel.multiplyScalar(Math.max(0, 1 - DRAG * dt));
        s.pos.addScaledVector(s.vel, dt);
        const rate = s.spin.length();
        if (rate > 1e-5) {
          _axis.copy(s.spin).multiplyScalar(1 / rate);
          _q.setFromAxisAngle(_axis, rate * dt);
          s.quat.premultiply(_q).normalize();
        }
        s.heat = Math.max(0, s.heat - COOL * dt);
        if (s.pos.y <= FLOOR) {
          s.pos.y = FLOOR;
          s.vel.y *= -0.35;
          s.vel.x *= 0.6;
          s.vel.z *= 0.6;
          s.spin.multiplyScalar(0.5);
          if (s.vel.length() < REST_EPS) {
            s.vel.set(0, 0, 0);
            s.spin.set(0, 0, 0);
            s.resting = true;
          }
        }
        if (!s.resting) aloft += 1;
      }
      if (aloft === 0 && !thudded) {
        thudded = true;
        audio.thud();
        phase = "spent";
      }
    } else if (phase === "settling") {
      const a = 1 - Math.exp(-9 * dt);
      let done = true;
      for (let i = 0; i < SHARD_COUNT; i += 1) {
        const s = shards[i];
        s.pos.lerp(s.rest, a);
        s.quat.slerp(s.restQuat, a);
        s.heat += (s.baseHeat - s.heat) * a;
        s.vel.set(0, 0, 0);
        s.spin.set(0, 0, 0);
        s.resting = true;
        if (s.pos.distanceToSquared(s.rest) > 1e-4) done = false;
      }
      if (done) {
        for (let i = 0; i < SHARD_COUNT; i += 1) {
          const s = shards[i];
          s.pos.copy(s.rest);
          s.quat.copy(s.restQuat);
          s.heat = s.baseHeat;
        }
        phase = "pristine";
      }
    }
    aloftCount = aloft;
  }

  function stepSparks(dt: number): void {
    if (!sparksActive) return;
    let any = false;
    for (let i = 0; i < SPARK_COUNT; i += 1) {
      if (sparkLife[i] <= 0) continue;
      const b = i * 3;
      sparkLife[i] -= dt;
      if (sparkLife[i] <= 0) {
        sparkPos[b + 1] = -50;
        continue;
      }
      sparkVel[b + 1] += (GRAV * 0.5) * dt;
      const damp = Math.max(0, 1 - 0.25 * dt);
      sparkVel[b] *= damp;
      sparkVel[b + 1] *= damp;
      sparkVel[b + 2] *= damp;
      sparkPos[b] += sparkVel[b] * dt;
      sparkPos[b + 1] += sparkVel[b + 1] * dt;
      sparkPos[b + 2] += sparkVel[b + 2] * dt;
      any = true;
    }
    sparksActive = any;
    sparks.visible = any && phase !== "pristine";
    (sparkGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  }

  function writeInstances(): void {
    if (gpu) return; // GPGPU path: the vertex shader reads the textures directly.
    for (let i = 0; i < SHARD_COUNT; i += 1) {
      const s = shards[i];
      _m.compose(s.pos, s.quat, ONE);
      mesh.setMatrixAt(i, _m);
      heatColor(s.heat, _color);
      mesh.setColorAt(i, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  function updateCamera(realDt: number): void {
    cameraPulse *= Math.exp(-6 * realDt);
    camera.position.set(0, 0, camDistance - cameraPulse * 0.4);
    camera.lookAt(0, camTargetY, 0);
  }

  function renderOnce(): void {
    writeInstances();
    point.intensity = lightEnergy * BASE_LIGHT;
    camera.position.set(0, 0, camDistance);
    camera.lookAt(0, camTargetY, 0);
    renderer.render(scene, camera);
  }

  function resize(): void {
    const w = Math.max(1, element.clientWidth);
    const h = Math.max(1, element.clientHeight);
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    const half = Math.tan(((FOV * Math.PI) / 180) / 2);
    camDistance = clamp(FIT_WIDTH / (2 * half) / aspect, DIST_MIN, DIST_MAX);
    camTargetY = -0.06 * camDistance;
    camera.position.set(0, 0, camDistance);
    camera.lookAt(0, camTargetY, 0);
    camera.updateProjectionMatrix();
    if (reduced) renderOnce();
  }

  let raf = 0;
  let last = performance.now();
  let fps = 0;
  function loop(): void {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const realDt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (realDt > 0) fps += (1 / realDt - fps) * 0.1;
    const simDt = realDt * (slowMo ? 0.35 : 1);
    stepCinematic(simDt);
    stepShards(simDt);
    stepSparks(simDt);
    updateCamera(realDt);
    writeInstances();
    stats.fps = fps;
    stats.aloft = aloftCount;
    stats.phase = phase;
    renderer.render(scene, camera);
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(element);
  resize();
  renderOnce(); // pristine first paint immediately (nothing to load)
  if (!reduced) {
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function detonateAt(clientX: number, clientY: number): boolean {
    if (reduced) return false;
    audio.resume();
    if (phase === "pristine") {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const d = raycaster.ray.distanceToPoint(CENTER);
      if (d > R * 1.25) return false; // honest miss, no effect
      const strength = clamp(1 - d / (R * 1.25), 0.35, 1);
      seedShards(strength);
      audio.boom(strength);
      return true;
    }
    // aloft/spent/settling: the scattered field is the subject — re-kick.
    seedShards(0.85);
    audio.boom(0.85);
    return true;
  }

  function restore(): void {
    audio.resume();
    sparksActive = false;
    sparks.visible = false;
    for (let i = 0; i < SPARK_COUNT; i += 1) {
      sparkLife[i] = 0;
      sparkPos[i * 3 + 1] = -50;
    }
    (sparkGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    shockActive = false;
    shockT = 0;
    ring.visible = false;
    ringMat.opacity = 0;
    bloomPending = false;
    audio.rebuild();
    if (reduced) {
      if (gpu) {
        gpu.snapToRest();
      } else {
        for (let i = 0; i < SHARD_COUNT; i += 1) {
          const s = shards[i];
          s.pos.copy(s.rest);
          s.quat.copy(s.restQuat);
          s.vel.set(0, 0, 0);
          s.spin.set(0, 0, 0);
          s.heat = s.baseHeat;
          s.resting = true;
        }
      }
      phase = "pristine";
      lightEnergy = 1.0;
      stats.phase = "pristine";
      stats.aloft = 0;
      renderOnce();
      return;
    }
    gpu?.setSettling(true);
    phase = "settling";
  }

  function setMuted(next: boolean): void {
    audio.setMuted(next);
  }

  function setSlowMo(next: boolean): void {
    slowMo = next;
  }

  function dispose(): void {
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    gpu?.dispose();
    scene.remove(mesh, sparks, ring, disc, ambient, point);
    shardGeo.dispose();
    shardMat.dispose();
    mesh.dispose();
    sparkGeo.dispose();
    sparkMat.dispose();
    ringGeo.dispose();
    ringMat.dispose();
    discGeo.dispose();
    discMat.dispose();
    renderer.dispose();
    audio.dispose();
    if (renderer.domElement.parentNode === element) {
      element.removeChild(renderer.domElement);
    }
  }

  return {
    detonateAt,
    restore,
    setMuted,
    setSlowMo,
    dispose,
    get stats(): SpecimenStats {
      return stats;
    },
  };
}
