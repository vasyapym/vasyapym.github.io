import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { createGradePass } from "./grade";
import type { GradeUniforms } from "./grade";

import {
  LOG_END,
  LOG_START,
  RECOMBINATION,
  evaluateState,
  kelvinToRGB,
} from "./cosmology";
import { createParticles } from "./particles";
import type { ParticleSystem, ParticleUniforms } from "./particles";
import { createGpgpuParticles, gpgpuSupported } from "./gpgpu";
import type { GpgpuParticles, Poke } from "./gpgpu";
import { createCmbShell, createCoreGlow } from "./backdrop";
import { buildTicks, grabUi, attachTimelineScrub, updateUi } from "./ui";
import type { UiRefs } from "./ui";
import { FateParticles } from "./fatesParticles";
import {
  FATE_PARAMS,
  fateProgress,
  tauFromProgress,
  type FateMode,
} from "./fates";
import { mountFatesUi } from "./fatesUi";
import type { FatesUiHandle } from "./fatesUi";

const isCoarse = window.matchMedia("(pointer: coarse)").matches;
const PARTICLES = isCoarse || window.innerWidth < 800 ? 90_000 : 220_000;
const BASE_DPS = 1.1;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const plasmaDamping = reduceMotion ? 0.12 : 1;
const sparkDamping = reduceMotion ? 0.3 : 1;

function showError(msg: string): void {
  document.getElementById("boot")?.remove();
  const el = document.getElementById("err");
  if (el) {
    el.style.display = "grid";
    el.firstElementChild!.textContent = msg;
  }
}

function fail(msg: string): never {
  showError(msg);
  throw new Error(msg);
}

function sstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function gaussBump(x: number, center: number, width: number): number {
  const d = (x - center) / width;
  return Math.exp(-0.5 * d * d);
}

function createRenderer(): THREE.WebGLRenderer {
  try {
    return new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  } catch {
    return fail("webgl unavailable · simulation sealed");
  }
}

const renderer: THREE.WebGLRenderer = createRenderer();

renderer.domElement.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  showError("webgl context lost — reload to restart.");
});

renderer.domElement.addEventListener("webglcontextrestored", () => {
  const el = document.getElementById("err");
  if (el) el.style.display = "none";
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCoarse ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById("app")!.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(6, 14, 76);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 8;
controls.maxDistance = 320;
controls.autoRotate = !reduceMotion;
controls.autoRotateSpeed = 0.45;

const forceStatic = new URLSearchParams(window.location.search).has("static");
const gpgpuSys: GpgpuParticles | null =
  !forceStatic && gpgpuSupported(renderer) ? createGpgpuParticles(renderer, PARTICLES) : null;
const sys: ParticleSystem | GpgpuParticles = gpgpuSys ?? createParticles(PARTICLES);
const mode: string = gpgpuSys ? "gpgpu" : "static";
const renderCount = gpgpuSys ? gpgpuSys.particleCount : PARTICLES;
(window as unknown as { __p2n_mode?: string }).__p2n_mode = mode;
(window as unknown as { __p2n_break?: () => number }).__p2n_break = () =>
  sstep(RECOMBINATION, RECOMBINATION + 0.5, logt);

scene.add(sys.points);

if (gpgpuSys) gpgpuSys.tune.motion = plasmaDamping;

const cmb = createCmbShell();
scene.add(cmb.mesh);

const glow = createCoreGlow();
scene.add(glow.sprite);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55,
  0.55,
  0.4,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = createGradePass();
composer.addPass(grade.pass);
grade.uniforms.uRes.value.set(window.innerWidth, window.innerHeight);

// ---- fate mode (off by default; the past timeline is untouched) -----------

const FATE_MODES = Object.keys(FATE_PARAMS) as FateMode[];
const fatesAvailable = gpgpuSys !== null;
let fate: FateParticles | null = null;
let fateMode: FateMode = "heatDeath";
let fatePaused = false;
let fateSpeed = 0.25;
let fatesUi: FatesUiHandle | null = null;

function setPastVisibility(visible: boolean): void {
  sys.points.visible = visible;
  cmb.mesh.visible = visible;
  glow.sprite.visible = visible;
}

function enterFate(m: FateMode): void {
  if (!fatesAvailable) return;
  if (fate) {
    scene.remove(fate.points);
    fate.dispose();
  }
  fateMode = m;
  fatePaused = false;
  fate = new FateParticles(renderer, m, { particleCount: renderCount });
  scene.add(fate.points);
  setPastVisibility(false);
  fatesUi?.setActive(m);
}

function leaveFate(): void {
  if (!fate) return;
  scene.remove(fate.points);
  fate.dispose();
  fate = null;
  setPastVisibility(true);
  fatesUi?.setActive(null);
}

function pushFateHud(): void {
  if (!fate || !fatesUi) return;
  fatesUi.setHud({
    tau: fate.tau,
    a: fate.a,
    progress: fateProgress(fateMode, fate.tau),
    mode: fateMode,
  });
}

// Deterministic seek: reset to the seed state, then advance one
// halo-core-stable substep at a time to the target τ.
function seekFate(progress: number): void {
  if (!fate) return;
  fate.resetTo(fateMode);
  fate.seek(tauFromProgress(fateMode, progress));
  pushFateHud();
}

if (fatesAvailable) {
  fatesUi = mountFatesUi({
    onEnter: enterFate,
    onLeave: leaveFate,
    onScrub: () => {}, // drag preview only; the seek happens on release
    onScrubEnd: seekFate,
    onEngineCommand: (cmd) => {
      if (cmd.type === "pause") fatePaused = true;
      else if (cmd.type === "play") fatePaused = false;
      else if (cmd.type === "restart") {
        fate?.resetTo(fateMode);
        pushFateHud();
      }
    },
  });

  const fateParam = new URLSearchParams(window.location.search).get("fate");
  if (fateParam && (FATE_MODES as string[]).includes(fateParam)) {
    enterFate(fateParam as FateMode);
  }
}

const ui: UiRefs = grabUi();
buildTicks(ui);
ui.techline.textContent = gpgpuSys
  ? `gpgpu · ${renderCount.toLocaleString("en-US")} particles · ping-pong fbo`
  : `vertex-shader · ${renderCount.toLocaleString("en-US")} particles · static buffers`;

let logt = LOG_START;
let playing = true;
let dps = BASE_DPS;
let flash = 0;
let breakPulse = 0;
let animTime = 0;
let booted = false;

const tParam = new URLSearchParams(window.location.search).get("t");
if (tParam !== null) {
  const v = Number(tParam);
  if (Number.isFinite(v)) logt = Math.min(LOG_END, Math.max(LOG_START, v));
}
gpgpuSys?.resetTo(evaluateState(logt).web);

let lastResetAt = 0;
attachTimelineScrub((newLogt) => {
  const jumped = Math.abs(newLogt - logt) > 3;
  logt = newLogt;
  if (gpgpuSys && jumped && performance.now() - lastResetAt > 250) {
    lastResetAt = performance.now();
    gpgpuSys.resetTo(evaluateState(newLogt).web);
  }
});

const raycaster = new THREE.Raycaster();
const pokePlane = new THREE.Plane();
const camDir = new THREE.Vector3();
const hitPoint = new THREE.Vector3();
let poke: Poke | null = null;
let downX = 0;
let downY = 0;
let downT = 0;

function screenToWorld(cx: number, cy: number): Poke | null {
  raycaster.setFromCamera(
    new THREE.Vector2((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1),
    camera,
  );
  camera.getWorldDirection(camDir);
  pokePlane.setFromNormalAndCoplanarPoint(camDir, new THREE.Vector3(0, 0, 0));
  if (!raycaster.ray.intersectPlane(pokePlane, hitPoint)) return null;
  return { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z, t0: animTime };
}

renderer.domElement.addEventListener("pointerdown", (e) => {
  downX = e.clientX;
  downY = e.clientY;
  downT = performance.now();
});

// A deliberate finger tap is slower and driftier than a mouse click, so the
// tap window widens on coarse pointers.
const TAP_MS = isCoarse ? 650 : 400;
const TAP_PX = isCoarse ? 14 : 8;

renderer.domElement.addEventListener("pointerup", (e) => {
  if (!gpgpuSys || e.button > 0) return;
  if (performance.now() - downT > TAP_MS) return;
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > TAP_PX) return;
  const hit = screenToWorld(e.clientX, e.clientY);
  if (hit) {
    poke = hit;
    const hint = document.getElementById("touchhint");
    if (hint) hint.textContent = "";
  }
});

// The epoch panel doubles as the touch-friendly pause/resume control.
document.getElementById("panel")?.addEventListener("click", () => {
  playing = !playing;
});

function syncBufferHeight(): void {
  sys.uniforms.uH.value = renderer.domElement.height;
}

function onResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  grade.uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
  syncBufferHeight();
}
window.addEventListener("resize", onResize);
syncBufferHeight();

window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (fate) {
    // Fate mode owns the keys: pause/restart/speed drive the fate clock.
    if (e.code === "Space") {
      e.preventDefault();
      fatePaused = !fatePaused;
    } else if (e.code === "KeyR") {
      e.preventDefault();
      fate.resetTo(fateMode);
      pushFateHud();
    } else if (e.code === "ArrowUp") {
      e.preventDefault();
      fateSpeed = Math.min(5, fateSpeed * 1.35);
    } else if (e.code === "ArrowDown") {
      e.preventDefault();
      fateSpeed = Math.max(0.05, fateSpeed / 1.35);
    }
    return;
  }
  if (e.code === "Space") {
    e.preventDefault();
    playing = !playing;
  } else if (e.code === "KeyR") {
    e.preventDefault();
    logt = LOG_START;
    flash = 0;
    playing = true;
    gpgpuSys?.resetTo(0);
  } else if (e.code === "ArrowUp") {
    e.preventDefault();
    dps = Math.min(5, dps * 1.35);
  } else if (e.code === "ArrowDown") {
    e.preventDefault();
    dps = Math.max(0.3, dps / 1.35);
  }
});

const clock = new THREE.Clock();
let fpsEma = 60;
let fpsSince = 0;

function frame(): void {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, clock.getDelta());
  animTime += dt;
  if (dt > 0) fpsEma += (1 / dt - fpsEma) * 0.06;
  fpsSince += dt;
  if (fpsSince > 0.5) {
    fpsSince = 0;
    ui.fps.textContent = String(Math.round(fpsEma));
  }

  if (playing && logt < LOG_END) {
    const next = Math.min(LOG_END, logt + dps * dt);
    if (logt < RECOMBINATION && next >= RECOMBINATION) { flash = 1; breakPulse = 1; }
    if (next >= LOG_END && logt < LOG_END) breakPulse = 1;
    logt = next;
  }
  flash *= Math.exp(-5.5 * dt);
  if (flash < 0.004) flash = 0;
  breakPulse *= Math.exp(-2.2 * dt);
  if (breakPulse < 0.004) breakPulse = 0;

  const st = evaluateState(logt);

  const brokenBase = sstep(RECOMBINATION, RECOMBINATION + 0.5, logt);
  const strain = gaussBump(logt, -34, 1.1);
  const gu: GradeUniforms = grade.uniforms;
  gu.uTime.value = animTime;
  gu.uFrame.value = Math.min(1, animTime / 1.2);
  // reduced-motion keeps the scrub-consistent frame states but kills the
  // live animation drives (jitter + burst push)
  const motionScale = reduceMotion ? 0 : 1;
  gu.uStrain.value = strain * motionScale;
  gu.uBreak.value = brokenBase;
  gu.uPulse.value = breakPulse * motionScale;
  gu.uHeat.value = st.earlyBoost;

  gpgpuSys?.step(dt, st, animTime, poke);

  const u: ParticleUniforms = sys.uniforms;
  u.uA.value = st.vscale;
  u.uTime.value = animTime;
  u.uWeb.value = st.web;
  u.uPlasma.value = st.plasma * plasmaDamping;
  u.uSpark.value = (playing ? st.spark : st.spark * 0.25) * sparkDamping;
  u.uStar.value = st.star;
  const [r, g, b] = kelvinToRGB(st.tempK);
  u.uHot.value.setRGB(r, g, b).multiplyScalar(0.72 + 0.38 * st.earlyBoost);

  cmb.uniforms.uTime.value = animTime;
  cmb.uniforms.uOpacity.value = st.cmbOpacity;
  cmb.uniforms.uCool.value = st.cmbCool;

  const glowScale = 4 + 30 * st.vscale * (0.35 + 0.65 * st.earlyBoost) + 18 * flash;
  glow.sprite.scale.setScalar(glowScale);
  glow.material.opacity = Math.min(1, Math.min(0.5, 0.5 * st.earlyBoost) + 0.7 * flash);

  bloom.strength = 0.5 + 0.3 * st.earlyBoost + 1.4 * flash;

  // Fate engine advances on its own Hubble-time clock; when paused the
  // step call is skipped entirely so a terminal ∎ marker never flickers.
  if (fate && fatesUi && !fatePaused) {
    const r = fate.step(fateSpeed * dt);
    fatesUi.setTerminal(r.terminal);
    pushFateHud();
    if (r.terminal && (fateMode === "bigCrunchClosed" || fateMode === "bigCrunchLambda")) {
      fatesUi.flashRebirth();
      fate.resetTo(fateMode);
    }
  }
  fate?.syncCamera(camera, renderer.domElement.height);

  controls.update();
  composer.render();
  updateUi(ui, st, { playing, dps, flash });
  if (!booted) {
    booted = true;
    document.documentElement.classList.add("p2n-live");
    if (isCoarse) {
      const hint = document.getElementById("touchhint");
      if (hint) {
        window.setTimeout(() => {
          hint.textContent = "drag orbits · pinch zooms · tap stirs";
        }, 600);
        window.setTimeout(() => {
          hint.textContent = "";
        }, 7500);
      }
    }
  }
}
frame();
