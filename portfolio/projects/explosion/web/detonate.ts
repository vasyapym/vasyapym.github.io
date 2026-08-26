import * as THREE from "three";
import { DetonationSfx } from "./audio";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const CELL = 0.26;
const GRID_W = 25;
const GRID_H = 34;
const GRID_D = 7;
const VOXEL_COUNT = GRID_W * GRID_H * GRID_D;

const BLAST_RADIUS = 3.4;
const DEBRIS_GRAVITY = -13;
const SPARK_COUNT = 80;
const BUILD_DURATION = 1.15;
const DOOM_TINT = new THREE.Color(0xff4d1a);
// Load-path x-ray gradient: load-bearing voxels burn hot near the ground,
// relaxed ones cool off toward the top.
const XRAY_HOT = new THREE.Color(0xff5a20);
const XRAY_COOL = new THREE.Color(0x5bb6bd);
// Overloaded blocks shimmer toward this ember in normal view.
const EMBER_GLOW = new THREE.Color(0xffa14d);
// A cascade this large engages the collapse camera. Long enough that even
// on software-rendered low-end devices — where frames crawl while hundreds
// of debris pieces simulate — the dilated time is actually seen.
const COLLAPSE_CAM_THRESHOLD = 50;
const COLLAPSE_CAM_DURATION = 2600;
// Stress model: a voxel carries its own weight plus everything above it that
// routes through it. STRESS_CAPACITY is the load (in voxel weights) a column
// segment is built to bear; calibrated against the blueprint so the intact
// monument idles near 20% while a lone surviving pillar after a cut spikes
// past 80% — past STRESS_GLOW a block shimmers ember in normal view,
// telegraphing the weak point.
const STRESS_CAPACITY = 300;
const STRESS_GLOW = 0.72;
// How fast displayed stress chases solved stress (per second) — this lag is
// what makes load paths visibly reroute after a shot.
const STRESS_RELAX = 4.2;

function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

type Voxel = { readonly x: number; readonly y: number; readonly z: number };

export type SpecimenStats = {
  voxels: number;
  total: number;
  debris: number;
  fps: number;
  slowmo: boolean;
  peakStress: number;
  engagements: number;
};

export type SpecimenHandle = {
  detonateAt: (x: number, y: number) => boolean;
  restore: () => void;
  setMuted: (muted: boolean) => void;
  setSlowMo: (on: boolean) => void;
  setXray: (on: boolean) => void;
  readonly stats: SpecimenStats;
  dispose: () => void;
};

function voxelIndex(x: number, y: number, z: number): number {
  return (y * GRID_D + z) * GRID_W + x;
}

function clampGrid(value: number, size: number): number {
  return Math.min(Math.max(value, 0), size - 1);
}

function voxelWorld(x: number, y: number, z: number, target: THREE.Vector3): THREE.Vector3 {
  return target.set(
    (x - (GRID_W - 1) / 2) * CELL,
    (y + 0.5) * CELL,
    (z - (GRID_D - 1) / 2) * CELL,
  );
}

function buildBlueprint(): { filled: Uint8Array; colors: Float32Array; count: number } {
  const filled = new Uint8Array(VOXEL_COUNT);
  const paint = new Array<number>(VOXEL_COUNT).fill(0);
  const BASALT = 1;
  const BONE = 2;
  const OCHRE = 3;
  const LINTEL = 4;
  const EMBER = 5;
  const TEAL = 6;

  const put = (x: number, y: number, z: number, kind: number) => {
    const index = voxelIndex(x, y, z);
    filled[index] = 1;
    paint[index] = kind;
  };

  for (let y = 0; y < 3; y += 1) {
    for (let z = 0; z < GRID_D; z += 1) {
      for (let x = 0; x < GRID_W; x += 1) {
        put(x, y, z, BASALT);
      }
    }
  }

  for (let y = 3; y <= 22; y += 1) {
    for (let z = 0; z < GRID_D; z += 1) {
      for (let x = 3; x <= 6; x += 1) {
        put(x, y, z, BONE);
      }
      for (let x = 18; x <= 21; x += 1) {
        put(x, y, z, BONE);
      }
    }
  }

  for (let y = 15; y <= 23; y += 1) {
    for (let z = 0; z < GRID_D; z += 1) {
      for (let x = 3; x <= 21; x += 1) {
        const arch =
          ((x - 12) / 5.4) ** 2 + ((y - 14.5) / 8.6) ** 2 < 1 && y >= 16;
        if (!arch) {
          put(x, y, z, OCHRE);
        }
      }
    }
  }

  for (let y = 24; y <= 25; y += 1) {
    for (let z = 0; z < GRID_D; z += 1) {
      for (let x = 2; x <= 22; x += 1) {
        put(x, y, z, LINTEL);
      }
    }
  }

  for (let y = 26; y <= 29; y += 1) {
    const half = 29 - y;
    for (let z = 2; z <= 4; z += 1) {
      for (let x = 12 - half; x <= 12 + half; x += 1) {
        put(x, y, z, EMBER);
      }
    }
  }

  let count = 0;
  for (let i = 0; i < VOXEL_COUNT; i += 1) {
    if (filled[i]) {
      count += 1;
    }
  }

  const colors = new Float32Array(VOXEL_COUNT * 3);
  const palette: Record<number, number> = {
    [BASALT]: 0x5a5446,
    [BONE]: 0xe9e0d0,
    [OCHRE]: 0xff9d4d,
    [LINTEL]: 0xd8cdb6,
    [EMBER]: 0xffc77b,
    [TEAL]: 0x5bb6bd,
  };
  const color = new THREE.Color();
  for (let i = 0; i < VOXEL_COUNT; i += 1) {
    if (!filled[i]) {
      continue;
    }
    const roll = Math.random();
    const kind = roll < 0.035 ? TEAL : paint[i];
    color.setHex(palette[kind]);
    color.multiplyScalar(0.9 + Math.random() * 0.18);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  return { filled, colors, count };
}

type Debris = {
  px: number;
  py: number;
  pz: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  wx: number;
  wy: number;
  wz: number;
  size: number;
  age: number;
  life: number;
  asleep: boolean;
  cr: number;
  cg: number;
  cb: number;
};

type Shockwave = {
  mesh: THREE.Mesh;
  age: number;
  active: boolean;
};

type SparkCloud = {
  points: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
  age: number;
  active: boolean;
};

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}

function reducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function mountSpecimen(element: HTMLElement): SpecimenHandle | null {
  const candidateRenderer = createRenderer(element);
  if (!candidateRenderer) {
    return null;
  }
  const renderer = candidateRenderer;

  const reduced = reducedMotion();
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x182830, 0.014);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  const CAMERA_POS = new THREE.Vector3(0, 4.7, 13.6);
  const CAMERA_TARGET = new THREE.Vector3(0, 3.85, 0);
  camera.position.copy(CAMERA_POS);
  camera.lookAt(CAMERA_TARGET);

  scene.add(new THREE.AmbientLight(0xa8a29a, 1.55));
  scene.add(new THREE.HemisphereLight(0xc4dbe8, 0x453a2d, 0.85));
  const keyLight = new THREE.DirectionalLight(0xffd9ae, 3.2);
  keyLight.position.set(-7, 11, 8);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x4bb3c5, 30, 30, 2);
  rimLight.position.set(8, 2.5, -7);
  scene.add(rimLight);
  const flashLight = new THREE.PointLight(0xffa14d, 0, 20, 2);
  flashLight.position.set(0, 4, 3);
  scene.add(flashLight);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(34, 48),
    new THREE.MeshStandardMaterial({ color: 0x24313a, roughness: 0.94, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const contactShadow = createContactShadow();
  contactShadow.position.y = 0.01;
  scene.add(contactShadow);

  const surveyRing = new THREE.Mesh(
    new THREE.TorusGeometry(GRID_W * CELL * 0.72, 0.014, 8, 128),
    new THREE.MeshBasicMaterial({
      color: 0xffa14d,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
  );
  surveyRing.rotation.x = Math.PI / 2;
  surveyRing.position.y = 0.02;
  scene.add(surveyRing);

  const dust = createDust();
  scene.add(dust.points);

  const blueprint = buildBlueprint();
  const filled = blueprint.filled.slice();
  const instanceOfVoxel = new Int32Array(VOXEL_COUNT).fill(-1);
  const voxelOfInstance = new Int32Array(blueprint.count).fill(-1);

  const boxGeometry = new THREE.BoxGeometry(CELL * 0.98, CELL * 0.98, CELL * 0.98);
  const structureMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.55,
    metalness: 0.18,
    flatShading: true,
  });
  const structure = new THREE.InstancedMesh(boxGeometry, structureMaterial, blueprint.count);
  structure.frustumCulled = false;
  structure.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(structure);

  const debrisCapacity = element.clientWidth < 720 || window.innerWidth < 720 ? 900 : 1800;
  const debrisMesh = new THREE.InstancedMesh(boxGeometry, structureMaterial.clone(), debrisCapacity);
  debrisMesh.frustumCulled = false;
  debrisMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  debrisMesh.count = 0;
  scene.add(debrisMesh);

  const dummy = new THREE.Object3D();
  const tmpVec = new THREE.Vector3();
  const tmpVec2 = new THREE.Vector3();

  const debris: Debris[] = [];
  let debrisCount = 0;

  const shockwaves: Shockwave[] = [];
  for (let i = 0; i < 4; i += 1) {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.03, 8, 64),
      new THREE.MeshBasicMaterial({
        color: 0xffc77b,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    mesh.visible = false;
    scene.add(mesh);
    shockwaves.push({ mesh, age: 0, active: false });
  }

  const sparkClouds: SparkCloud[] = [];
  for (let i = 0; i < 5; i += 1) {
    sparkClouds.push(createSparkCloud());
  }

  const sfx = new DetonationSfx();

  const stats: SpecimenStats = {
    voxels: blueprint.count,
    total: blueprint.count,
    debris: 0,
    fps: 60,
    slowmo: false,
    peakStress: 0,
    engagements: 0,
  };

  let pendingCrumble: { index: number; at: number }[] = [];
  // Voxel indices already condemned to crumble. Guards against stacking
  // duplicate timers when repeated blasts re-run the solver over a region
  // that is still standing but already falling on a delay.
  const doomedSet = new Set<number>();
  // Solved vs displayed stress per voxel. Displayed chases solved, and the
  // instance colors are repainted from displayed — that lag animates load
  // paths rerouting after every shot.
  const stressTarget = new Float32Array(VOXEL_COUNT);
  const stressShown = new Float32Array(VOXEL_COUNT);
  const loadScratch = new Float32Array(VOXEL_COUNT);
  // Voxel indices whose solved stress exceeds the glow threshold. Kept as a
  // small list so the per-frame shimmer can repaint a handful of instances
  // instead of the whole mesh — repainting all instance colors every frame
  // starved low-end (software-rendered) GPUs.
  let overloaded: number[] = [];
  let xray = false;
  let collapseCamUntil = 0;
  let slowMoHeld = false;
  let dolly = 0;
  let simTime = 0;
  let timeScale = 1;
  let timeScaleTarget = 1;
  let shakeAmp = 0;
  let building = false;
  let buildStart = 0;

  function populateStructure(animated: boolean): void {
    let instance = 0;
    for (let v = 0; v < VOXEL_COUNT; v += 1) {
      instanceOfVoxel[v] = -1;
      if (!filled[v]) {
        continue;
      }
      instanceOfVoxel[v] = instance;
      voxelOfInstance[instance] = v;
      writeStructureMatrixAt(instance, animated ? 0 : 1);
      structure.setColorAt(instance, tmpColor.fromArray(blueprint.colors, v * 3));
      instance += 1;
    }
    structure.count = instance;
    structure.instanceMatrix.needsUpdate = true;
    if (structure.instanceColor) {
      structure.instanceColor.needsUpdate = true;
    }
  }

  function writeStructureMatrixAt(instance: number, k: number): void {
    const voxel = voxelOfInstance[instance];
    const x = voxel % GRID_W;
    const y = Math.floor(voxel / (GRID_D * GRID_W));
    const z = Math.floor(voxel / GRID_W) % GRID_D;
    voxelWorld(x, y, z, tmpVec);
    const eased = 1 - Math.pow(1 - k, 3);
    dummy.position.copy(tmpVec);
    dummy.position.y *= eased > 0 ? 0.6 + 0.4 * eased : 0.001;
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(Math.max(0.0001, eased));
    dummy.updateMatrix();
    structure.setMatrixAt(instance, dummy.matrix);
  }

  const tmpColor = new THREE.Color();
  populateStructure(false);
  computeStressTargets();
  snapStress();

  function destroyVoxel(v: number, impact: THREE.Vector3 | null): Debris | null {
    const instance = instanceOfVoxel[v];
    if (instance === -1 || !filled[v]) {
      return null;
    }
    filled[v] = 0;
    instanceOfVoxel[v] = -1;
    doomedSet.delete(v);

    const last = structure.count - 1;
    const movedVoxel = voxelOfInstance[last];
    if (instance !== last) {
      structure.getMatrixAt(last, dummy.matrix);
      structure.setMatrixAt(instance, dummy.matrix);
      if (structure.instanceColor) {
        structure.getColorAt(last, tmpColor);
        structure.setColorAt(instance, tmpColor);
      }
      instanceOfVoxel[movedVoxel] = instance;
      voxelOfInstance[instance] = movedVoxel;
    }
    structure.count = last;

    const x = v % GRID_W;
    const y = Math.floor(v / (GRID_D * GRID_W));
    const z = Math.floor(v / GRID_W) % GRID_D;
    voxelWorld(x, y, z, tmpVec);

    const debrisItem: Debris = {
      px: tmpVec.x,
      py: tmpVec.y,
      pz: tmpVec.z,
      vx: 0,
      vy: 0,
      vz: 0,
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      rz: Math.random() * Math.PI,
      wx: random(-6, 6),
      wy: random(-6, 6),
      wz: random(-5, 5),
      size: CELL * random(0.82, 1),
      age: 0,
      life: random(1.7, 2.7),
      asleep: false,
      cr: blueprint.colors[v * 3],
      cg: blueprint.colors[v * 3 + 1],
      cb: blueprint.colors[v * 3 + 2],
    };
    if (impact) {
      tmpVec2.copy(tmpVec).sub(impact);
      const dist = Math.max(tmpVec2.length(), 0.35);
      tmpVec2.normalize().multiplyScalar(random(3.2, 7.2) / Math.sqrt(dist));
      debrisItem.vx = tmpVec2.x + random(-0.6, 0.6);
      debrisItem.vy = tmpVec2.y + random(0.8, 2.4);
      debrisItem.vz = tmpVec2.z + random(-0.6, 0.6);
    } else {
      debrisItem.vx = random(-0.8, 0.8);
      debrisItem.vy = random(-0.4, 0.4);
      debrisItem.vz = random(-0.5, 0.5);
    }
    return debrisItem;
  }

  function spawnDebris(item: Debris): void {
    let slot: number;
    if (debrisCount >= debrisCapacity) {
      // Pool full: the oldest piece is recycled in place, so record order,
      // mesh slots and instance colors stay aligned (a shift() here used to
      // desync colors from their slots on big cascades).
      slot = 0;
      debris[0] = item;
    } else {
      slot = debrisCount;
      debris.push(item);
      debrisCount += 1;
    }
    debrisMesh.count = debrisCount;
    tmpColor.setRGB(item.cr, item.cg, item.cb);
    debrisMesh.setColorAt(slot, tmpColor);
    if (debrisMesh.instanceColor) {
      debrisMesh.instanceColor.needsUpdate = true;
    }
  }

  function solveSupport(): number[] {
    const visited = new Uint8Array(VOXEL_COUNT);
    const stack: number[] = [];
    for (let x = 0; x < GRID_W; x += 1) {
      for (let z = 0; z < GRID_D; z += 1) {
        const v = voxelIndex(x, 0, z);
        if (filled[v]) {
          visited[v] = 1;
          stack.push(v);
        }
      }
    }
    while (stack.length > 0) {
      const v = stack.pop() as number;
      const x = v % GRID_W;
      const y = Math.floor(v / (GRID_D * GRID_W));
      const z = Math.floor(v / GRID_W) % GRID_D;
      const neighbors = [
        x > 0 ? v - 1 : -1,
        x < GRID_W - 1 ? v + 1 : -1,
        z > 0 ? v - GRID_W : -1,
        z < GRID_D - 1 ? v + GRID_W : -1,
        y > 0 ? v - GRID_W * GRID_D : -1,
        y < GRID_H - 1 ? v + GRID_W * GRID_D : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && filled[n] && !visited[n]) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }
    const unsupported: number[] = [];
    for (let v = 0; v < VOXEL_COUNT; v += 1) {
      if (filled[v] && !visited[v]) {
        unsupported.push(v);
      }
    }
    return unsupported;
  }

  function scheduleCrumble(indices: number[]): number {
    let fresh = 0;
    for (const v of indices) {
      if (doomedSet.has(v)) {
        continue;
      }
      doomedSet.add(v);
      const y = Math.floor(v / (GRID_D * GRID_W));
      pendingCrumble.push({
        index: v,
        at: simTime + random(0.04, 0.22) + (y / GRID_H) * 0.18,
      });
      tintDoomed(v);
      fresh += 1;
    }
    return fresh;
  }

  // The integrity fixpoint: after any change to what is standing, re-run the
  // flood-fill from the ground and condemn whatever is no longer connected —
  // whether it lost its support to a blast or to another group finishing its
  // own fall. Nothing can hang in the air waiting for a second click.
  function condemnUnsupported(): number {
    const fresh = scheduleCrumble(solveSupport());
    if (fresh > 0) {
      computeStressTargets();
      // Signature moment: a major load path giving way dilates time while
      // the span comes down. Checked here rather than in the click handler,
      // so cascades that grow through the crumble chain engage it too.
      if (doomedSet.size >= COLLAPSE_CAM_THRESHOLD && performance.now() >= collapseCamUntil) {
        collapseCamUntil = performance.now() + COLLAPSE_CAM_DURATION;
        stats.slowmo = true;
        stats.engagements += 1;
      }
    }
    return fresh;
  }

  // Doomed voxels announce themselves: shifted toward hot ember the moment
  // the solver condemns them, so a delayed collapse never reads as a dead
  // click.
  function tintDoomed(v: number): void {
    const instance = instanceOfVoxel[v];
    if (instance === -1 || !structure.instanceColor) {
      return;
    }
    tmpColor.fromArray(blueprint.colors, v * 3).lerp(DOOM_TINT, 0.62);
    structure.setColorAt(instance, tmpColor);
    structure.instanceColor.needsUpdate = true;
  }

  function tremblePending(): void {
    if (pendingCrumble.length === 0) {
      return;
    }
    let touched = false;
    for (const task of pendingCrumble) {
      if (task.at <= simTime) {
        continue;
      }
      const instance = instanceOfVoxel[task.index];
      if (instance === -1) {
        continue;
      }
      const x = task.index % GRID_W;
      const y = Math.floor(task.index / (GRID_D * GRID_W));
      const z = Math.floor(task.index / GRID_W) % GRID_D;
      voxelWorld(x, y, z, tmpVec);
      dummy.position.copy(tmpVec);
      dummy.position.x += random(-1, 1) * 0.02;
      dummy.position.z += random(-1, 1) * 0.02;
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0.9 + Math.sin(simTime * 36 + task.index) * 0.08);
      dummy.updateMatrix();
      structure.setMatrixAt(instance, dummy.matrix);
      touched = true;
    }
    if (touched) {
      structure.instanceMatrix.needsUpdate = true;
    }
  }

  // Breadth-first distance from the ground through standing voxels — how
  // deep each block sits in the load path it carries.
  function supportDepths(): { depth: Int16Array; max: number } {
    const depth = new Int16Array(VOXEL_COUNT).fill(-1);
    const queue: number[] = [];
    for (let x = 0; x < GRID_W; x += 1) {
      for (let z = 0; z < GRID_D; z += 1) {
        const v = voxelIndex(x, 0, z);
        if (filled[v]) {
          depth[v] = 0;
          queue.push(v);
        }
      }
    }
    let max = 0;
    for (let head = 0; head < queue.length; head += 1) {
      const v = queue[head];
      const d = depth[v];
      if (d > max) {
        max = d;
      }
      const x = v % GRID_W;
      const y = Math.floor(v / (GRID_D * GRID_W));
      const z = Math.floor(v / GRID_W) % GRID_D;
      const neighbors = [
        x > 0 ? v - 1 : -1,
        x < GRID_W - 1 ? v + 1 : -1,
        z > 0 ? v - GRID_W : -1,
        z < GRID_D - 1 ? v + GRID_W : -1,
        y > 0 ? v - GRID_W * GRID_D : -1,
        y < GRID_H - 1 ? v + GRID_W * GRID_D : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && filled[n] && depth[n] === -1) {
          depth[n] = d + 1;
          queue.push(n);
        }
      }
    }
    return { depth, max };
  }

  // The stress solver: loads enter at every standing voxel (self weight)
  // and flow down the BFS tree from supportDepths — each voxel splits its
  // accumulated load evenly among the neighbours one step closer to the
  // ground. Where paths converge (a lone surviving pillar, a narrowed
  // arch haunch) load piles up and stress crosses capacity.
  function computeStressTargets(): void {
    const { depth, max } = supportDepths();
    stressTarget.fill(0);
    loadScratch.fill(0);
    if (max <= 0) {
      stats.peakStress = 0;
      return;
    }
    const buckets: number[][] = Array.from({ length: max + 1 }, () => []);
    for (let v = 0; v < VOXEL_COUNT; v += 1) {
      if (!filled[v] || depth[v] < 0) {
        continue;
      }
      loadScratch[v] = 1;
      buckets[depth[v]].push(v);
    }
    let peakLoad = 0;
    const parentCount = [0, 0, 0, 0, 0, 0];
    const parents = [0, 0, 0, 0, 0, 0];
    for (let d = max; d >= 1; d -= 1) {
      for (const v of buckets[d]) {
        let count = 0;
        const x = v % GRID_W;
        const y = Math.floor(v / (GRID_D * GRID_W));
        const z = Math.floor(v / GRID_W) % GRID_D;
        const neighbors = [
          x > 0 ? v - 1 : -1,
          x < GRID_W - 1 ? v + 1 : -1,
          z > 0 ? v - GRID_W : -1,
          z < GRID_D - 1 ? v + GRID_W : -1,
          y > 0 ? v - GRID_W * GRID_D : -1,
          y < GRID_H - 1 ? v + GRID_W * GRID_D : -1,
        ];
        for (let i = 0; i < 6; i += 1) {
          const n = neighbors[i];
          parents[count] = n;
          parentCount[count] = 0;
          if (n >= 0 && filled[n] && depth[n] === d - 1) {
            parentCount[count] = 1;
            count += 1;
          }
        }
        if (count > 0) {
          const share = loadScratch[v] / count;
          for (let i = 0; i < 6; i += 1) {
            if (parentCount[i]) {
              loadScratch[parents[i]] += share;
            }
          }
        }
        if (loadScratch[v] > peakLoad) {
          peakLoad = loadScratch[v];
        }
      }
    }
    for (const v of buckets[0]) {
      if (loadScratch[v] > peakLoad) {
        peakLoad = loadScratch[v];
      }
    }
    let peakStress = 0;
    overloaded = [];
    for (let v = 0; v < VOXEL_COUNT; v += 1) {
      if (!filled[v] || depth[v] < 0) {
        continue;
      }
      const s = Math.min(loadScratch[v] / STRESS_CAPACITY, 1);
      stressTarget[v] = s;
      if (s > peakStress) {
        peakStress = s;
      }
      if (s > STRESS_GLOW) {
        overloaded.push(v);
      }
    }
    stats.peakStress = peakStress;
  }

  function snapStress(): void {
    stressShown.set(stressTarget);
  }

  // Instance colors are repainted from displayed stress: blueprint palette
  // normally (overloaded blocks shimmer ember), solved heat map in x-ray,
  // with condemned voxels overriding both so a delayed collapse never
  // reads as a dead click.
  function paintStructureColors(nowMs: number): void {
    for (let v = 0; v < VOXEL_COUNT; v += 1) {
      const instance = instanceOfVoxel[v];
      if (instance === -1) {
        continue;
      }
      if (doomedSet.has(v)) {
        tmpColor.fromArray(blueprint.colors, v * 3).lerp(DOOM_TINT, 0.62);
      } else if (xray) {
        const s = stressShown[v];
        tmpColor.copy(XRAY_COOL).lerp(XRAY_HOT, s * s * (3 - 2 * s));
        tmpColor.multiplyScalar(0.92 + ((v * 2654435761) % 97) / 97 * 0.14);
      } else {
        tmpColor.fromArray(blueprint.colors, v * 3);
        const s = stressShown[v];
        if (s > STRESS_GLOW) {
          const k = (s - STRESS_GLOW) / (1 - STRESS_GLOW);
          tmpColor.lerp(EMBER_GLOW, k * 0.55);
          tmpColor.multiplyScalar(1 + Math.sin(nowMs * 0.005 + v * 0.37) * 0.09 * k);
        }
      }
      structure.setColorAt(instance, tmpColor);
    }
    if (structure.instanceColor) {
      structure.instanceColor.needsUpdate = true;
    }
  }

  // Steady-state shimmer: repaint only the overloaded subset so the glow
  // breathes without touching the rest of the mesh.
  function paintOverload(nowMs: number): void {
    for (const v of overloaded) {
      const instance = instanceOfVoxel[v];
      if (instance === -1 || doomedSet.has(v)) {
        continue;
      }
      const k = Math.max((stressShown[v] - STRESS_GLOW) / (1 - STRESS_GLOW), 0);
      tmpColor.fromArray(blueprint.colors, v * 3).lerp(EMBER_GLOW, k * 0.55);
      tmpColor.multiplyScalar(1 + Math.sin(nowMs * 0.005 + v * 0.37) * 0.09 * k);
      structure.setColorAt(instance, tmpColor);
    }
    if (structure.instanceColor) {
      structure.instanceColor.needsUpdate = true;
    }
  }

  // Advance displayed stress toward the solved targets. While values are
  // still morphing, repaint the full mesh; once settled, only the few
  // overloaded voxels shimmer.
  function updateStressColors(dtRaw: number, nowMs: number): void {
    const step = Math.min(1, dtRaw * STRESS_RELAX);
    let maxDelta = 0;
    for (let v = 0; v < VOXEL_COUNT; v += 1) {
      const delta = stressTarget[v] - stressShown[v];
      if (delta !== 0) {
        stressShown[v] += delta * step;
        const magnitude = delta < 0 ? -delta : delta;
        if (magnitude > maxDelta) {
          maxDelta = magnitude;
        }
      }
    }
    if (maxDelta > 0.004) {
      paintStructureColors(nowMs);
      return;
    }
    if (!xray && overloaded.length > 0) {
      paintOverload(nowMs);
    }
  }

  function setXray(on: boolean): void {
    if (xray === on) {
      return;
    }
    xray = on;
    snapStress();
    paintStructureColors(performance.now());
  }

  function processPending(): void {
    if (pendingCrumble.length === 0) {
      return;
    }
    let crumbled = 0;
    const remaining: { index: number; at: number }[] = [];
    for (const task of pendingCrumble) {
      if (task.at > simTime) {
        remaining.push(task);
        continue;
      }
      if (filled[task.index]) {
        const item = destroyVoxel(task.index, null);
        if (item) {
          spawnDebris(item);
          crumbled += 1;
        }
      }
    }
    pendingCrumble = remaining;
    stats.voxels = countFilled();
    if (crumbled > 0) {
      sfx.crackle(crumbled);
      // Voxels just fell — whatever hung only on them must follow.
      condemnUnsupported();
      computeStressTargets();
    }
  }

  function countFilled(): number {
    let total = 0;
    for (let i = 0; i < VOXEL_COUNT; i += 1) {
      if (filled[i]) {
        total += 1;
      }
    }
    return total;
  }

  function updateDebris(dt: number): void {
    if (debrisCount === 0) {
      return;
    }
    for (let i = debrisCount - 1; i >= 0; i -= 1) {
      const d = debris[i];
      d.age += dt;
      if (d.age >= d.life) {
        const lastSlot = debrisCount - 1;
        if (i !== lastSlot && debrisMesh.instanceColor) {
          debrisMesh.getColorAt(lastSlot, tmpColor);
          debrisMesh.setColorAt(i, tmpColor);
        }
        debris[i] = debris[lastSlot];
        debris.pop();
        debrisCount -= 1;
        continue;
      }
      if (!d.asleep) {
        d.vy += DEBRIS_GRAVITY * dt;
        d.px += d.vx * dt;
        d.py += d.vy * dt;
        d.pz += d.vz * dt;
        d.rx += d.wx * dt;
        d.ry += d.wy * dt;
        d.rz += d.wz * dt;
        const floor = d.size / 2;
        if (d.py < floor) {
          d.py = floor;
          d.vy *= -0.36;
          d.vx *= 0.68;
          d.vz *= 0.68;
          d.wx *= 0.55;
          d.wy *= 0.55;
          d.wz *= 0.55;
          if (Math.abs(d.vy) < 0.55 && Math.hypot(d.vx, d.vz) < 0.4) {
            d.asleep = true;
            d.rx = 0;
            d.rz = 0;
            d.ry = Math.random() * Math.PI;
          }
        }
      }
      const remain = d.life - d.age;
      const fadeScale = remain < 0.4 ? Math.max(remain / 0.4, 0.001) : 1;
      dummy.position.set(d.px, d.py, d.pz);
      dummy.rotation.set(d.rx, d.ry, d.rz);
      dummy.scale.setScalar(d.size * fadeScale * (1 / CELL) * 0.98);
      dummy.updateMatrix();
      debrisMesh.setMatrixAt(i, dummy.matrix);
    }
    debrisMesh.count = debrisCount;
    debrisMesh.instanceMatrix.needsUpdate = true;
    stats.debris = debrisCount;
  }

  function fireShockwave(at: THREE.Vector3, strength: number): void {
    const wave = shockwaves.find((s) => !s.active) ?? shockwaves[0];
    wave.active = true;
    wave.age = 0;
    wave.mesh.visible = true;
    wave.mesh.position.copy(at);
    wave.mesh.rotation.set(Math.PI / 2 + random(-0.25, 0.25), random(0, Math.PI), 0);
    wave.mesh.scale.setScalar(0.2);
    wave.mesh.userData.strength = strength;
  }

  function updateShockwaves(dt: number): void {
    for (const wave of shockwaves) {
      if (!wave.active) {
        continue;
      }
      wave.age += dt;
      const t = wave.age / 0.62;
      if (t >= 1) {
        wave.active = false;
        wave.mesh.visible = false;
        continue;
      }
      const strength = (wave.mesh.userData.strength as number) ?? 1;
      wave.mesh.scale.setScalar(0.2 + t * 4.4 * strength);
      (wave.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.65;
    }
  }

  function fireSparks(at: THREE.Vector3, strength: number): void {
    const cloud = sparkClouds.find((s) => !s.active);
    if (!cloud) {
      return;
    }
    cloud.active = true;
    cloud.age = 0;
    cloud.points.visible = true;
    cloud.points.position.copy(at);
    const attribute = cloud.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < SPARK_COUNT; i += 1) {
      const o = i * 3;
      cloud.positions[o] = 0;
      cloud.positions[o + 1] = 0;
      cloud.positions[o + 2] = 0;
      tmpVec.set(random(-1, 1), random(-0.4, 1.2), random(-1, 1)).normalize().multiplyScalar(random(2.4, 7.5) * strength);
      cloud.velocities[o] = tmpVec.x;
      cloud.velocities[o + 1] = tmpVec.y;
      cloud.velocities[o + 2] = tmpVec.z;
      attribute.setXYZ(i, 0, 0, 0);
    }
    attribute.needsUpdate = true;
  }

  function createSparkCloud(): SparkCloud {
    const positions = new Float32Array(SPARK_COUNT * 3);
    const velocities = new Float32Array(SPARK_COUNT * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffc77b,
      size: 0.075,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.visible = false;
    return { points, positions, velocities, age: 0, active: false };
  }

  function updateSparks(dt: number): void {
    for (const cloud of sparkClouds) {
      if (!cloud.active) {
        continue;
      }
      cloud.age += dt;
      const t = cloud.age / 0.75;
      if (t >= 1) {
        cloud.active = false;
        cloud.points.visible = false;
        continue;
      }
      const attribute = cloud.points.geometry.getAttribute("position") as THREE.BufferAttribute;
      const drag = Math.exp(-2.6 * dt);
      for (let i = 0; i < SPARK_COUNT; i += 1) {
        const o = i * 3;
        cloud.velocities[o] *= drag;
        cloud.velocities[o + 1] = cloud.velocities[o + 1] * drag - 4.5 * dt;
        cloud.velocities[o + 2] *= drag;
        cloud.positions[o] += cloud.velocities[o] * dt;
        cloud.positions[o + 1] += cloud.velocities[o + 1] * dt;
        cloud.positions[o + 2] += cloud.velocities[o + 2] * dt;
        attribute.setXYZ(i, cloud.positions[o], cloud.positions[o + 1], cloud.positions[o + 2]);
      }
      attribute.needsUpdate = true;
      (cloud.points.material as THREE.PointsMaterial).opacity = 1 - t;
    }
  }

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const blastPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  // Where a charge detonates for a hit at `point`, approached along
  // `direction`: march the ray through the struck material and sit the
  // charge at the middle of the filled run it meets. Solid pillars get cut
  // clean through their whole depth, while thin hollow shells catch the
  // burst inside themselves instead of letting it pop in the void behind.
  const MARCH_STEP = CELL * 0.34;
  function marchRunDepth(point: THREE.Vector3, direction: THREE.Vector3): number {
    let runDepth = MARCH_STEP;
    while (runDepth < CELL * 5) {
      tmpVec.copy(point).addScaledVector(direction, runDepth);
      const mx = Math.round(tmpVec.x / CELL + (GRID_W - 1) / 2);
      const my = Math.round(tmpVec.y / CELL - 0.5);
      const mz = Math.round(tmpVec.z / CELL + (GRID_D - 1) / 2);
      if (
        mx < 0 || mx >= GRID_W || my < 0 || my >= GRID_H || mz < 0 || mz >= GRID_D ||
        !filled[voxelIndex(mx, my, mz)]
      ) {
        break;
      }
      runDepth += MARCH_STEP;
    }
    return runDepth;
  }

  // Grid-space blast sphere for a charge of the given radius at a surface
  // hit, plus how many standing voxels it would take out.
  function carvePlan(
    point: THREE.Vector3,
    direction: THREE.Vector3,
    radius: number,
  ): { cx: number; cy: number; cz: number; r: number; victims: number } {
    const runDepth = marchRunDepth(point, direction);
    const pushIn = Math.min(Math.max(runDepth * 0.5, MARCH_STEP), runDepth);
    tmpVec.copy(point).addScaledVector(direction, pushIn);
    const cx = clampGrid(Math.round(tmpVec.x / CELL + (GRID_W - 1) / 2), GRID_W);
    const cy = clampGrid(Math.round(tmpVec.y / CELL - 0.5), GRID_H);
    const cz = clampGrid(Math.round(tmpVec.z / CELL + (GRID_D - 1) / 2), GRID_D);
    const r = Math.ceil(radius);
    const radiusSq = radius * radius;
    let victims = 0;
    for (let dx = -r; dx <= r; dx += 1) {
      for (let dy = -r; dy <= r; dy += 1) {
        for (let dz = -r; dz <= r; dz += 1) {
          if (dx * dx + dy * dy + dz * dz > radiusSq) {
            continue;
          }
          const x = cx + dx;
          const y = cy + dy;
          const z = cz + dz;
          if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H || z < 0 || z >= GRID_D) {
            continue;
          }
          if (filled[voxelIndex(x, y, z)]) {
            victims += 1;
          }
        }
      }
    }
    return { cx, cy, cz, r, victims };
  }

  // Aim preview: a ghost ring where the next charge would land plus a chip
  // telling the visitor exactly how many voxels it would take out — the
  // solver's verdict before the shot is fired.
  const previewRing = new THREE.Mesh(
    new THREE.TorusGeometry(BLAST_RADIUS * CELL * 0.85, 0.018, 8, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffc77b,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  previewRing.visible = false;
  scene.add(previewRing);

  const targetChip = document.createElement("span");
  targetChip.className = "explosion-target-chip";
  targetChip.setAttribute("aria-hidden", "true");
  targetChip.style.display = "none";
  element.appendChild(targetChip);

  const updatePreview = (clientX: number, clientY: number): void => {
    if (reduced || building) {
      hidePreview();
      return;
    }
    const rect = element.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(structure)[0];
    if (!hit || hit.instanceId === undefined) {
      hidePreview();
      return;
    }
    const plan = carvePlan(hit.point, raycaster.ray.direction, BLAST_RADIUS);
    previewRing.position.copy(hit.point);
    previewRing.lookAt(camera.position);
    previewRing.visible = true;
    targetChip.textContent = `≈ ${plan.victims} voxels`;
    targetChip.style.display = "block";
    targetChip.style.left = `${clientX - rect.left + 14}px`;
    targetChip.style.top = `${clientY - rect.top + 10}px`;
  };

  function hidePreview(): void {
    if (previewRing.visible) {
      previewRing.visible = false;
    }
    if (targetChip.style.display !== "none") {
      targetChip.style.display = "none";
    }
  }

  const onPreviewMove = (event: PointerEvent): void => {
    if (event.pointerType === "touch") {
      return;
    }
    updatePreview(event.clientX, event.clientY);
  };
  const onPreviewLeave = () => hidePreview();

  element.addEventListener("pointermove", onPreviewMove);
  element.addEventListener("pointerleave", onPreviewLeave);

  function detonateAt(clientX: number, clientY: number): boolean {
    if (reduced || building) {
      return false;
    }
    sfx.resume();
    const rect = element.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(structure)[0];

    let impactPoint: THREE.Vector3;
    if (hit && hit.instanceId !== undefined) {
      impactPoint = hit.point.clone();
    } else {
      const planeHit = raycaster.ray.intersectPlane(blastPlane, new THREE.Vector3());
      if (!planeHit) {
        return false;
      }
      if (Math.abs(planeHit.x) > 10 || planeHit.y > 11 || planeHit.y < 0) {
        return false;
      }
      impactPoint = planeHit;
    }

    let destroyed = 0;
    if (hit && hit.instanceId !== undefined) {
      // Radius rolls once per shot, not per voxel: every direct hit takes a
      // real, predictable bite instead of occasionally scuffing thin
      // sections for near-zero damage.
      const shotRadius = BLAST_RADIUS * random(0.92, 1);
      const plan = carvePlan(hit.point, raycaster.ray.direction, shotRadius);
      for (let dx = -plan.r; dx <= plan.r; dx += 1) {
        for (let dy = -plan.r; dy <= plan.r; dy += 1) {
          for (let dz = -plan.r; dz <= plan.r; dz += 1) {
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq > shotRadius * shotRadius) {
              continue;
            }
            const x = plan.cx + dx;
            const y = plan.cy + dy;
            const z = plan.cz + dz;
            if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H || z < 0 || z >= GRID_D) {
              continue;
            }
            const v = voxelIndex(x, y, z);
            if (!filled[v]) {
              continue;
            }
            const item = destroyVoxel(v, impactPoint);
            if (item) {
              spawnDebris(item);
              destroyed += 1;
            }
          }
        }
      }
      // Belt and braces: nothing may eat a direct hit. If grid-border
      // rounding swallowed the whole sphere, the struck voxel comes out
      // anyway.
      if (destroyed === 0) {
        const item = destroyVoxel(voxelOfInstance[hit.instanceId], impactPoint);
        if (item) {
          spawnDebris(item);
          destroyed += 1;
        }
      }
    }

    stats.voxels = countFilled();
    if (hit) {
      shakeAmp = Math.min(shakeAmp + 0.4, 1.05);
      flashLight.position.copy(impactPoint).add(tmpVec.set(0, 0.4, 1.6));
      flashLight.intensity = 70;
      fireShockwave(impactPoint, 1);
      fireSparks(impactPoint, 1);
      sfx.boom(1);
    } else {
      // Missed the monument: honest feedback only — a faint pressure ring
      // and a thud. No flash, no shake, no fake explosion.
      fireShockwave(impactPoint, 0.28);
      sfx.thud();
    }

    if (destroyed > 0) {
      // Integrity fixpoint + fresh stress solve: the heat map visibly
      // reroutes over the next few frames. The collapse cam engages inside
      // condemnUnsupported when the condemned mass is large enough.
      condemnUnsupported();
      computeStressTargets();
    }
    return true;
  }

  function restore(): void {
    sfx.resume();
    filled.set(blueprint.filled);
    pendingCrumble = [];
    doomedSet.clear();
    debris.length = 0;
    debrisCount = 0;
    debrisMesh.count = 0;
    stats.voxels = blueprint.count;
    stats.debris = 0;
    computeStressTargets();
    snapStress();
    if (reduced) {
      populateStructure(false);
      paintStructureColors(performance.now());
      renderOnce();
      return;
    }
    building = true;
    buildStart = performance.now();
    populateStructure(true);
    paintStructureColors(performance.now());
    sfx.rebuild();
  }

  function updateBuilding(nowMs: number): void {
    if (!building) {
      return;
    }
    const t = Math.min((nowMs - buildStart) / 1000 / BUILD_DURATION, 1);
    for (let instance = 0; instance < structure.count; instance += 1) {
      const voxel = voxelOfInstance[instance];
      const y = Math.floor(voxel / (GRID_D * GRID_W));
      const appear = 0.72 * (y / (GRID_H - 1));
      const k = Math.min(Math.max((t - appear) / 0.28, 0), 1);
      writeStructureMatrixAt(instance, k);
    }
    structure.instanceMatrix.needsUpdate = true;
    if (t >= 1) {
      building = false;
    }
  }

  function createRenderer(target: HTMLElement): THREE.WebGLRenderer | null {
    const canvas = document.createElement("canvas");
    canvas.className = "explosion-overlay-canvas";
    canvas.setAttribute("aria-hidden", "true");
    target.appendChild(canvas);
    try {
      const gl = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      gl.setClearColor(0x000000, 0);
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.18;
      gl.outputColorSpace = THREE.SRGBColorSpace;
      return gl;
    } catch {
      canvas.remove();
      return null;
    }
  }

  function createContactShadow(): THREE.Mesh {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, "rgba(0,0,0,0.6)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_W * CELL * 2.4, GRID_W * CELL * 1.6),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  function createDust(): { points: THREE.Points; velocities: number[] } {
    const COUNT = 70;
    const positions = new Float32Array(COUNT * 3);
    const speeds: number[] = [];
    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = random(-9, 9);
      positions[i * 3 + 1] = random(0, 10);
      positions[i * 3 + 2] = random(-6, 4);
      speeds.push(random(0.08, 0.3));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x9a8f7d,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return { points, velocities: speeds };
  }

  function updateDust(dt: number): void {
    const attribute = dust.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < dust.velocities.length; i += 1) {
      let y = attribute.getY(i) + dust.velocities[i] * dt;
      if (y > 10.5) {
        y = 0;
      }
      attribute.setY(i, y);
    }
    attribute.needsUpdate = true;
  }

  const resize = () => {
    const width = Math.max(1, element.clientWidth || window.innerWidth);
    const height = Math.max(1, element.clientHeight || window.innerHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (reduced) {
      renderOnce();
    }
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(element);

  function renderOnce(): void {
    renderer.render(scene, camera);
  }

  if (reduced) {
    renderOnce();
    return {
      detonateAt: () => false,
      restore,
      setMuted: (muted: boolean) => sfx.setMuted(muted),
      setSlowMo: () => undefined,
      setXray: () => undefined,
      stats,
      dispose,
    };
  }

  let frame = 0;
  let last = performance.now();
  const loop = (nowMs: number) => {
    frame = requestAnimationFrame(loop);
    const dtRaw = Math.min((nowMs - last) / 1000, 0.05);
    last = nowMs;
    // Bullet time comes from held shift; the collapse camera dilates time
    // on its own for a moment after a major load path gives way.
    const autoSlow = nowMs < collapseCamUntil;
    timeScaleTarget = slowMoHeld ? 0.22 : autoSlow ? 0.3 : 1;
    stats.slowmo = timeScale < 0.75;
    dolly += ((autoSlow ? 1 : 0) - dolly) * Math.min(1, dtRaw * 3.4);
    timeScale += (timeScaleTarget - timeScale) * Math.min(1, dtRaw * 9);
    const dt = dtRaw * timeScale;
    simTime += dt;

    updateBuilding(nowMs);
    processPending();
    tremblePending();
    updateStressColors(dtRaw, nowMs);
    updateDebris(dt);
    updateSparks(dt);
    updateShockwaves(dt);
    updateDust(dt);

    flashLight.intensity *= Math.exp(-9 * dtRaw);
    surveyRing.rotation.z += dt * 0.3;
    keyLight.intensity = 3.2 + Math.sin(nowMs * 0.0011) * 0.22;

    shakeAmp *= Math.exp(-5.2 * dtRaw);
    camera.position.set(
      CAMERA_POS.x + Math.sin(nowMs * 0.041) * shakeAmp * 0.22,
      CAMERA_POS.y + Math.sin(nowMs * 0.053) * shakeAmp * 0.18 + dolly * 0.3,
      CAMERA_POS.z - dolly * 0.95,
    );
    camera.lookAt(CAMERA_TARGET);

    stats.fps = stats.fps * 0.92 + (1 / Math.max(dtRaw, 0.0001)) * 0.08;
    renderer.render(scene, camera);
  };
  loop(performance.now());

  function dispose(): void {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    element.removeEventListener("pointermove", onPreviewMove);
    element.removeEventListener("pointerleave", onPreviewLeave);
    targetChip.remove();
    previewRing.geometry.dispose();
    (previewRing.material as THREE.Material).dispose();
    sfx.dispose();
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Points)) {
        return;
      }
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
    boxGeometry.dispose();
    structureMaterial.dispose();
    (debrisMesh.material as THREE.Material).dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  return {
    detonateAt,
    restore,
    setMuted: (muted: boolean) => sfx.setMuted(muted),
    setSlowMo: (on: boolean) => {
      slowMoHeld = on;
    },
    setXray,
    stats,
    dispose,
  };
}
