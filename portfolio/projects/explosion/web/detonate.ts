import * as THREE from "three";
import { DetonationSfx } from "./audio";
import { loadPhysicsCore, type PhysicsCore } from "./physics-core";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const CELL = 0.26;
const COLLAPSE_CAM_THRESHOLD = 50;
const COLLAPSE_CAM_DURATION = 2600;
const BUILD_DURATION = 1.15;
const XRAY_HOT = new THREE.Color(0xff5a20);
const XRAY_COOL = new THREE.Color(0x5bb6bd);
const EMBER_GLOW = new THREE.Color(0xffa14d);
const STRESS_GLOW = 0.72;
const SPARK_COUNT = 80;

// Aspect-aware framing: fit the ~16.6-wide district (+margin = 20) across the stage at
// any aspect so the phone portrait no longer crops it. Camera is LEVEL (look direction
// horizontal) which keeps the aim math the browser suite hardcodes clean.
const FOV = 40;
const TAN_HALF_FOV = Math.tan((20 * Math.PI) / 180); // 0.36397
const FIT_WIDTH = 20;
const FIT_DISTANCE = FIT_WIDTH / (2 * TAN_HALF_FOV); // 27.475
const MIN_DISTANCE = 22.5; // desktop cap: district ~56% frame width, top ~18% sky-free
const MAX_DISTANCE = 46; // portrait cap: full width visible without pushing past far plane
const TARGET_Y_RATIO = 0.25478; // holds the slab band at stage fy ~= 0.85 at every aspect

type Vec3 = readonly [number, number, number];
export type SpecimenStats = { voxels: number; total: number; debris: number; fps: number; slowmo: boolean; peakStress: number; engagements: number };
export type SpecimenHandle = { detonateAt: (x: number, y: number) => boolean; restore: () => void; setMuted: (muted: boolean) => void; setSlowMo: (on: boolean) => void; setXray: (on: boolean) => void; readonly stats: SpecimenStats; dispose: () => void };

type SparkCloud = { points: THREE.Points; positions: Float32Array; velocities: Float32Array; buoyancy: Float32Array; strength: number; age: number; active: boolean };
type Shockwave = { inner: THREE.Mesh; outer: THREE.Mesh; age: number; active: boolean; tiltSeed: number };

export function hasWebGL(): boolean {
  try { const canvas = document.createElement("canvas"); return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")); } catch { return false; }
}

function isReducedMotion(): boolean { return window.matchMedia(REDUCED_MOTION_QUERY).matches; }

// Opaque golden-hour sky as scene.background — this is the primary brightness fix: the
// canvas paints its own lit sky instead of showing dark CSS through an alpha buffer.
function createSkyTexture(): THREE.Texture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 4; canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#f0d3a0");
  grad.addColorStop(1, "#c98f5a");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 4, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createRenderer(target: HTMLElement): THREE.WebGLRenderer | null {
  const canvas = document.createElement("canvas");
  canvas.className = "explosion-overlay-canvas";
  canvas.setAttribute("aria-hidden", "true");
  target.appendChild(canvas);
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0xe9c896, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
  } catch { canvas.remove(); return null; }
}

function createSparkCloud(): SparkCloud {
  const positions = new Float32Array(SPARK_COUNT * 3);
  const velocities = new Float32Array(SPARK_COUNT * 3);
  const buoyancy = new Float32Array(SPARK_COUNT);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffc77b, size: 0.075, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  return { points, positions, velocities, buoyancy, strength: 1, age: 0, active: false };
}

export function mountSpecimen(element: HTMLElement): SpecimenHandle | null {
  const renderer = createRenderer(element);
  if (!renderer) return null;
  const reduced = isReducedMotion();
  const scene = new THREE.Scene();
  const skyTexture = createSkyTexture();
  scene.background = skyTexture ?? new THREE.Color(0xe9c896);
  scene.fog = new THREE.FogExp2(0xe6c79a, 0.0055);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);

  // cameraHome/cameraTarget are derived from the current aspect in applyFraming so the
  // shake/kick offsets in updateVisuals stay valid whatever the framing resolves to.
  const cameraHome = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const applyFraming = (aspect: number) => {
    const distance = THREE.MathUtils.clamp(FIT_DISTANCE / aspect, MIN_DISTANCE, MAX_DISTANCE);
    const targetY = TARGET_Y_RATIO * distance;
    cameraHome.set(0, targetY, distance);
    cameraTarget.set(0, targetY, 0);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    camera.position.copy(cameraHome);
    camera.lookAt(cameraTarget);
  };
  applyFraming(1); // seeded; resize() sets the real aspect before the first frame

  scene.add(new THREE.AmbientLight(0xcfc3ad, 2.0), new THREE.HemisphereLight(0xffe4b5, 0x6b5a44, 1.4));
  const key = new THREE.DirectionalLight(0xffcaa0, 3.4); key.position.set(-9, 7, 9); scene.add(key);
  const rim = new THREE.PointLight(0x6bc7d0, 25, 30, 2); rim.position.set(9, 3, -8); scene.add(rim);
  const flash = new THREE.PointLight(0xffa14d, 0, 20, 2); scene.add(flash);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(34, 48), new THREE.MeshStandardMaterial({ color: 0xb8a888, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const survey = new THREE.Mesh(new THREE.TorusGeometry(64 * CELL * 0.72, 0.014, 8, 128), new THREE.MeshBasicMaterial({ color: 0xffa14d, transparent: true, opacity: 0.32, depthWrite: false }));
  survey.rotation.x = Math.PI / 2; survey.position.y = 0.02; scene.add(survey);

  const box = new THREE.BoxGeometry(CELL * 0.98, CELL * 0.98, CELL * 0.98);
  // NOTE: no `vertexColors` here — the geometry has no `color` attribute, and an
  // unbound attribute multiplies the per-instance colors down to black. The
  // InstancedMesh instanceColor buffer drives all tinting on its own.
  const material = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.18, flatShading: true });
  const structure = new THREE.InstancedMesh(box, material, 64 * 42 * 26);
  structure.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(64 * 42 * 26 * 3), 3);
  structure.instanceColor.setUsage(THREE.DynamicDrawUsage);
  structure.frustumCulled = false; structure.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(structure);
  const debrisCapacity = element.clientWidth < 720 || window.innerWidth < 720 ? 900 : 1800;
  const debrisMesh = new THREE.InstancedMesh(box, material.clone(), debrisCapacity);
  debrisMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(debrisCapacity * 3), 3);
  debrisMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  debrisMesh.frustumCulled = false; debrisMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); debrisMesh.count = 0; scene.add(debrisMesh);
  const dummy = new THREE.Object3D();
  const tmp = new THREE.Vector3();
  const tmpColor = new THREE.Color();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const shakeDir = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();
  const sfx = new DetonationSfx();
  const shocks: Shockwave[] = [];
  for (let i = 0; i < 4; i += 1) {
    const inner = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffc77b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const outer = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffc77b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    inner.visible = false; outer.visible = false; scene.add(inner); scene.add(outer);
    shocks.push({ inner, outer, age: 0, active: false, tiltSeed: 0 });
  }
  const sparks = Array.from({ length: 5 }, createSparkCloud); sparks.forEach((cloud) => scene.add(cloud.points));
  const chip = document.createElement("span"); chip.className = "explosion-target-chip"; chip.setAttribute("aria-hidden", "true"); chip.style.display = "none"; element.appendChild(chip);

  let core: PhysicsCore | null = null;
  let disposed = false;
  let animation = 0;
  let last = performance.now();
  let xray = false;
  let slowMoHeld = false;
  let collapseUntil = 0;
  let building = false;
  let buildStarted = 0;
  let shake = 0;
  let flashIntensity = 0;
  const stats: SpecimenStats = { voxels: 0, total: 0, debris: 0, fps: 60, slowmo: false, peakStress: 0, engagements: 0 };

  const setColor = (instance: number, voxel: number) => {
    const views = core?.views; if (!views) return;
    const s = views.stressShown[voxel];
    if (views.doomed[voxel]) tmpColor.set(0xff4d1a);
    else if (xray) tmpColor.copy(XRAY_COOL).lerp(XRAY_HOT, s * s * (3 - 2 * s));
    else { tmpColor.setHex(views.color[voxel]); if (s > STRESS_GLOW) tmpColor.lerp(EMBER_GLOW, Math.min(1, (s - STRESS_GLOW) / (1 - STRESS_GLOW)) * 0.55); }
    structure.setColorAt(instance, tmpColor);
  };

  const rebuild = (animated: boolean) => {
    if (!core) return;
    const views = core.views; let count = 0;
    for (let voxel = 0; voxel < views.filled.length; voxel += 1) {
      const instance = views.instanceOfVoxel[voxel];
      if (instance < 0) continue;
      count = Math.max(count, instance + 1);
      const x = voxel % core.width; const z = Math.floor(voxel / core.width) % core.depth; const y = Math.floor(voxel / (core.width * core.depth));
      tmp.set((x - (core.width - 1) * 0.5) * CELL, (y + 0.5) * CELL, (z - (core.depth - 1) * 0.5) * CELL);
      dummy.position.copy(tmp); dummy.scale.setScalar(animated ? 0.001 : 1); dummy.updateMatrix(); structure.setMatrixAt(instance, dummy.matrix); setColor(instance, voxel);
    }
    structure.count = count; structure.instanceMatrix.needsUpdate = true; if (structure.instanceColor) structure.instanceColor.needsUpdate = true;
  };

  const repaint = () => {
    if (!core || !structure.instanceColor) return;
    const views = core.views;
    for (let instance = 0; instance < structure.count; instance += 1) setColor(instance, views.voxelOfInstance[instance]);
    structure.instanceColor.needsUpdate = true;
  };

  const fireShockwave = (point: THREE.Vector3, strength: number) => {
    const wave = shocks.find((entry) => !entry.active) ?? shocks[0];
    wave.active = true; wave.age = 0; wave.tiltSeed = Math.random();
    wave.inner.rotation.set(Math.sin(wave.tiltSeed * 91.7) * 0.1, 0, Math.sin(wave.tiltSeed * 47.3) * 0.1);
    wave.outer.rotation.copy(wave.inner.rotation);
    wave.inner.visible = true; wave.outer.visible = true;
    wave.inner.position.copy(point); wave.outer.position.copy(point);
    wave.inner.scale.setScalar(0.2); wave.outer.scale.setScalar(0.2);
    wave.inner.userData.strength = strength;
  };
  const fireSparks = (point: THREE.Vector3, strength: number) => {
    const cloud = sparks.find((entry) => !entry.active); if (!cloud) return; cloud.active = true; cloud.age = 0; cloud.strength = strength; cloud.points.visible = true; cloud.points.position.copy(point);
    const attr = cloud.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const spread = strength * (0.8 + 0.4 * strength);
    for (let i = 0; i < SPARK_COUNT; i += 1) { const o = i * 3; const a = Math.random() * Math.PI * 2; const b = Math.random() * 2 - 1; const r = Math.sqrt(1 - b * b); cloud.buoyancy[i] = Math.random() < 0.2 ? 2.2 : 0; cloud.positions[o] = cloud.positions[o + 1] = cloud.positions[o + 2] = 0; cloud.velocities[o] = Math.cos(a) * r * (2.4 + Math.random() * 5.1) * spread; cloud.velocities[o + 1] = (b * 0.8 + 0.5) * (2.4 + Math.random() * 5.1) * spread; cloud.velocities[o + 2] = Math.sin(a) * r * (2.4 + Math.random() * 5.1) * spread; attr.setXYZ(i, 0, 0, 0); }
    attr.needsUpdate = true;
  };

  const previewRing = new THREE.Mesh(new THREE.TorusGeometry(3.4 * CELL * 0.85, 0.018, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffc77b, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
  previewRing.visible = false; scene.add(previewRing);
  const hidePreview = () => { chip.style.display = "none"; previewRing.visible = false; };

  const updatePreview = (clientX: number, clientY: number) => {
    if (!core || reduced || building) return hidePreview();
    const rect = element.getBoundingClientRect(); ndc.set((clientX - rect.left) / rect.width * 2 - 1, -((clientY - rect.top) / rect.height * 2 - 1)); raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(structure)[0]; if (!hit || hit.instanceId === undefined) return hidePreview();
    const direction: Vec3 = [raycaster.ray.direction.x, raycaster.ray.direction.y, raycaster.ray.direction.z]; const origin: Vec3 = [raycaster.ray.origin.x, raycaster.ray.origin.y, raycaster.ray.origin.z]; const victims = core.preview(origin, direction);
    previewRing.position.copy(hit.point); previewRing.lookAt(camera.position); previewRing.visible = victims > 0; chip.textContent = `≈ ${victims} voxels`; chip.style.display = victims > 0 ? "block" : "none"; chip.style.left = `${clientX - rect.left + 14}px`; chip.style.top = `${clientY - rect.top + 10}px`;
  };
  element.addEventListener("pointermove", (event) => { if (event.pointerType !== "touch") updatePreview(event.clientX, event.clientY); });
  element.addEventListener("pointerleave", hidePreview);

  const handle: SpecimenHandle = {
    detonateAt: (clientX, clientY) => {
      if (!core || reduced || building) return false;
      sfx.resume(); const rect = element.getBoundingClientRect(); ndc.set((clientX - rect.left) / rect.width * 2 - 1, -((clientY - rect.top) / rect.height * 2 - 1)); raycaster.setFromCamera(ndc, camera);
      const origin: Vec3 = [raycaster.ray.origin.x, raycaster.ray.origin.y, raycaster.ray.origin.z]; const direction: Vec3 = [raycaster.ray.direction.x, raycaster.ray.direction.y, raycaster.ray.direction.z];
      const hit = core.pick(origin, direction); const victims = core.blast(origin, direction, 0.96);
      // Site the blast FX at the district plane (the level camera sits `cameraHome.z`
      // units from z=0), not at a hardcoded distance — otherwise shockwaves, sparks
      // and the flash would hang in mid-air in front of the structures.
      hitPoint.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, cameraHome.z);
      if (hit >= 0) {
        shake = Math.min(1.05, shake + 0.4); flashIntensity = 90; flash.position.copy(hitPoint);
        const kickX = hitPoint.x - cameraHome.x; const kickZ = hitPoint.z - cameraHome.z; const kickLen = Math.hypot(kickX, kickZ) || 1;
        shakeDir.set(kickX / kickLen, kickZ / kickLen);
        fireShockwave(hitPoint, 1); fireSparks(hitPoint, 1); sfx.boom(1);
      } else { fireShockwave(hitPoint, 0.28); sfx.thud(); }
      core.refreshViews(); stats.voxels = core.stats.standing; stats.debris = core.stats.debris; stats.peakStress = core.stats.peakStress; if (victims > 0) rebuild(false); return true;
    },
    restore: () => { if (!core) return; core.restore(); core.refreshViews(); stats.voxels = core.stats.standing; stats.debris = 0; building = !reduced; buildStarted = performance.now(); rebuild(!reduced); repaint(); sfx.resume(); sfx.rebuild(); },
    setMuted: (muted) => sfx.setMuted(muted),
    setSlowMo: (on) => { slowMoHeld = on; },
    setXray: (on) => { xray = on; repaint(); },
    stats,
    dispose: () => { if (disposed) return; disposed = true; cancelAnimationFrame(animation); window.removeEventListener("resize", onResize); core?.dispose(); core = null; renderer.dispose(); skyTexture?.dispose(); chip.remove(); previewRing.geometry.dispose(); (previewRing.material as THREE.Material).dispose(); element.querySelector("canvas.explosion-overlay-canvas")?.remove(); },
  };

  const updateVisuals = (dt: number, now: number) => {
    for (const wave of shocks) {
      if (!wave.active) continue;
      wave.age += dt;
      const strength = (wave.inner.userData.strength as number) || 1;
      const innerT = wave.age / 0.62; const outerT = wave.age / 0.9;
      if (innerT >= 1 && outerT >= 1) { wave.active = false; wave.inner.visible = false; wave.outer.visible = false; continue; }
      if (innerT < 1) { wave.inner.scale.setScalar(0.2 + innerT * 4.4 * strength); (wave.inner.material as THREE.MeshBasicMaterial).opacity = (1 - innerT) * 0.65; } else wave.inner.visible = false;
      if (outerT < 1) { wave.outer.scale.setScalar(0.2 + outerT * 2.6 * strength); (wave.outer.material as THREE.MeshBasicMaterial).opacity = (1 - outerT) * 0.3; } else wave.outer.visible = false;
    }
    for (const cloud of sparks) { if (!cloud.active) continue; cloud.age += dt; const t = cloud.age / (0.75 + 0.2 * cloud.strength); if (t >= 1) { cloud.active = false; cloud.points.visible = false; continue; } const attr = cloud.points.geometry.getAttribute("position") as THREE.BufferAttribute; for (let i = 0; i < SPARK_COUNT; i += 1) { const o = i * 3; cloud.velocities[o] *= Math.exp(-2.6 * dt); cloud.velocities[o + 1] = cloud.velocities[o + 1] * Math.exp(-2.6 * dt) - 4.5 * dt + cloud.buoyancy[i] * dt * 2.0; cloud.velocities[o + 2] *= Math.exp(-2.6 * dt); cloud.positions[o] += cloud.velocities[o] * dt; cloud.positions[o + 1] += cloud.velocities[o + 1] * dt; cloud.positions[o + 2] += cloud.velocities[o + 2] * dt; attr.setXYZ(i, cloud.positions[o], cloud.positions[o + 1], cloud.positions[o + 2]); } attr.needsUpdate = true; (cloud.points.material as THREE.PointsMaterial).opacity = 1 - t; }
    if (flashIntensity > 0) { flash.intensity = flashIntensity; flashIntensity *= Math.exp(-12 * dt); } else flash.intensity = 0;
    shake *= Math.exp(-5 * dt); if (shake < 0.01) shakeDir.set(0, 0); camera.position.copy(cameraHome); camera.position.x += (Math.random() - 0.5) * shake * 0.08; camera.position.y += (Math.random() - 0.5) * shake * 0.08; camera.position.x += shakeDir.x * shake * 0.10; camera.position.z += shakeDir.y * shake * 0.10; camera.lookAt(cameraTarget);
    if (building && now - buildStarted >= BUILD_DURATION * 1000) { building = false; rebuild(false); }
    if (core) { const views = core.views; const count = Math.min(core.stats.debris, core.debrisCapacity); for (let i = 0; i < count; i += 1) { const p = i * 3; const q = i * 4; dummy.position.set(views.debrisPos[p], views.debrisPos[p + 1], views.debrisPos[p + 2]); dummy.quaternion.set(views.debrisQuat[q], views.debrisQuat[q + 1], views.debrisQuat[q + 2], views.debrisQuat[q + 3]); dummy.scale.set(views.debrisScale[p] / (CELL * 0.49), views.debrisScale[p + 1] / (CELL * 0.49), views.debrisScale[p + 2] / (CELL * 0.49)); dummy.updateMatrix(); debrisMesh.setMatrixAt(i, dummy.matrix); tmpColor.setHex(views.debrisRgb[i]); debrisMesh.setColorAt(i, tmpColor); } debrisMesh.count = count; debrisMesh.instanceMatrix.needsUpdate = true; if (debrisMesh.instanceColor) debrisMesh.instanceColor.needsUpdate = true; }
  };

  const resize = () => { const rect = element.getBoundingClientRect(); renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false); applyFraming(rect.width / Math.max(1, rect.height)); };
  const frame = (now: number) => {
    if (disposed) return;
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    if (core) {
      const dilation = slowMoHeld || now < collapseUntil;
      core.step(dilation ? dt * (slowMoHeld ? 0.22 : 0.3) : dt, dt);
      stats.voxels = core.stats.standing; stats.debris = core.stats.debris; stats.peakStress = core.stats.peakStress;
      if (core.stats.doomed >= COLLAPSE_CAM_THRESHOLD && now >= collapseUntil) { collapseUntil = now + COLLAPSE_CAM_DURATION; stats.slowmo = true; stats.engagements += 1; }
      else if (now >= collapseUntil) stats.slowmo = false;
    }
    updateVisuals(dt, now);
    renderer.render(scene, camera);
    animation = requestAnimationFrame(frame);
  };
  const onResize = () => resize(); window.addEventListener("resize", onResize); resize();
  loadPhysicsCore(Math.floor(Math.random() * 0xffffffff), debrisCapacity).then((loaded) => { if (disposed) { loaded.dispose(); return; } core = loaded; stats.total = loaded.total; stats.voxels = loaded.stats.standing; stats.debris = 0; rebuild(false); repaint(); animation = requestAnimationFrame(frame); }).catch(() => { if (!disposed) { element.classList.add("is-fallback"); renderer.dispose(); element.querySelector("canvas.explosion-overlay-canvas")?.remove(); } });
  return handle;
}
