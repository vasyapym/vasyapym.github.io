import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

import {
  LOG_END,
  LOG_START,
  RECOMBINATION,
  evaluateState,
  kelvinToRGB,
} from "./cosmology";
import { createParticles } from "./particles";
import type { ParticleSystem } from "./particles";
import { createCmbShell, createCoreGlow } from "./backdrop";
import { buildTicks, grabUi, attachTimelineScrub, updateUi } from "./ui";
import type { UiRefs } from "./ui";

const isCoarse = window.matchMedia("(pointer: coarse)").matches;
const PARTICLES = isCoarse || window.innerWidth < 800 ? 90_000 : 220_000;
const BASE_DPS = 1.1;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const plasmaDamping = reduceMotion ? 0.12 : 1;
const sparkDamping = reduceMotion ? 0.3 : 1;

function showError(msg: string): void {
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

const particles: ParticleSystem = createParticles(PARTICLES);
scene.add(particles.points);

const cmb = createCmbShell();
scene.add(cmb.mesh);

const glow = createCoreGlow();
scene.add(glow.sprite);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.9,
  0.85,
  0.12,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const ui: UiRefs = grabUi();
buildTicks(ui);

let logt = LOG_START;
let playing = true;
let dps = BASE_DPS;
let flash = 0;
let animTime = 0;

const tParam = new URLSearchParams(window.location.search).get("t");
if (tParam !== null) {
  const v = Number(tParam);
  if (Number.isFinite(v)) logt = Math.min(LOG_END, Math.max(LOG_START, v));
}

attachTimelineScrub((newLogt) => {
  logt = newLogt;
});

function syncBufferHeight(): void {
  particles.uniforms.uH.value = renderer.domElement.height;
}

function onResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  syncBufferHeight();
}
window.addEventListener("resize", onResize);
syncBufferHeight();

window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.code === "Space") {
    e.preventDefault();
    playing = !playing;
  } else if (e.code === "KeyR") {
    e.preventDefault();
    logt = LOG_START;
    flash = 0;
    playing = true;
  } else if (e.code === "ArrowUp") {
    e.preventDefault();
    dps = Math.min(5, dps * 1.35);
  } else if (e.code === "ArrowDown") {
    e.preventDefault();
    dps = Math.max(0.3, dps / 1.35);
  }
});

const clock = new THREE.Clock();

function frame(): void {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, clock.getDelta());
  animTime += dt;

  if (playing && logt < LOG_END) {
    const next = Math.min(LOG_END, logt + dps * dt);
    if (logt < RECOMBINATION && next >= RECOMBINATION) flash = 1;
    logt = next;
  }
  flash *= Math.exp(-2.6 * dt);
  if (flash < 0.004) flash = 0;

  const st = evaluateState(logt);

  const u = particles.uniforms;
  u.uA.value = st.vscale;
  u.uTime.value = animTime;
  u.uWeb.value = st.web;
  u.uPlasma.value = st.plasma * plasmaDamping;
  u.uSpark.value = (playing ? st.spark : st.spark * 0.25) * sparkDamping;
  u.uStar.value = st.star;
  const [r, g, b] = kelvinToRGB(st.tempK);
  u.uHot.value.setRGB(r, g, b).multiplyScalar(0.9 + 0.9 * st.earlyBoost);

  cmb.uniforms.uTime.value = animTime;
  cmb.uniforms.uOpacity.value = st.cmbOpacity;
  cmb.uniforms.uCool.value = st.cmbCool;

  const glowScale = 2 + 55 * st.vscale * st.earlyBoost + 26 * flash;
  glow.sprite.scale.setScalar(glowScale);
  glow.material.opacity = Math.min(1, 0.85 * st.earlyBoost + 0.7 * flash);

  bloom.strength = 0.85 + 0.45 * st.earlyBoost + 2.4 * flash;

  controls.update();
  composer.render();
  updateUi(ui, st, { playing, dps, flash });
}
frame();
