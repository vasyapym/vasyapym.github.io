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

function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

type Voxel = { readonly x: number; readonly y: number; readonly z: number };

export type SpecimenStats = {
  voxels: number;
  total: number;
  debris: number;
  fps: number;
};

export type SpecimenHandle = {
  detonateAt: (x: number, y: number) => boolean;
  restore: () => void;
  setMuted: (muted: boolean) => void;
  setSlowMo: (on: boolean) => void;
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
    [BASALT]: 0x3a362f,
    [BONE]: 0xe9e0d0,
    [OCHRE]: 0xff9d4d,
    [LINTEL]: 0xcfc4ae,
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
  scene.fog = new THREE.FogExp2(0x0b1317, 0.02);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  const CAMERA_POS = new THREE.Vector3(0, 4.7, 13.6);
  const CAMERA_TARGET = new THREE.Vector3(0, 3.85, 0);
  camera.position.copy(CAMERA_POS);
  camera.lookAt(CAMERA_TARGET);

  scene.add(new THREE.AmbientLight(0x9a938a, 1.1));
  const keyLight = new THREE.DirectionalLight(0xffd9ae, 2.4);
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
    new THREE.MeshStandardMaterial({ color: 0x10171c, roughness: 0.96, metalness: 0 }),
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

  const debrisCapacity = element.clientWidth < 720 || window.innerWidth < 720 ? 900 : 1600;
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
  };

  let pendingCrumble: { index: number; at: number }[] = [];
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

  function destroyVoxel(v: number, impact: THREE.Vector3 | null): Debris | null {
    const instance = instanceOfVoxel[v];
    if (instance === -1 || !filled[v]) {
      return null;
    }
    filled[v] = 0;
    instanceOfVoxel[v] = -1;

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
    if (debrisCount >= debrisCapacity) {
      debris.shift();
      debrisCount -= 1;
    }
    debris.push(item);
    debrisCount += 1;
    debrisMesh.count = debrisCount;
    const slot = debrisCount - 1;
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

  function scheduleCrumble(indices: number[]): void {
    for (const v of indices) {
      const y = Math.floor(v / (GRID_D * GRID_W));
      pendingCrumble.push({
        index: v,
        at: simTime + random(0.05, 0.3) + (y / GRID_H) * 0.28,
      });
    }
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
      // Charge penetrates along the ray so thick sections are cut through
      // instead of getting a surface scuff.
      const carveCenter = hit.point.clone().addScaledVector(raycaster.ray.direction, 0.45);
      const cx = clampGrid(Math.round(carveCenter.x / CELL + (GRID_W - 1) / 2), GRID_W);
      const cy = clampGrid(Math.round(carveCenter.y / CELL - 0.5), GRID_H);
      const cz = clampGrid(Math.round(carveCenter.z / CELL + (GRID_D - 1) / 2), GRID_D);
      const r = Math.ceil(BLAST_RADIUS);
      for (let dx = -r; dx <= r; dx += 1) {
        for (let dy = -r; dy <= r; dy += 1) {
          for (let dz = -r; dz <= r; dz += 1) {
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq > BLAST_RADIUS * BLAST_RADIUS * random(0.78, 1)) {
              continue;
            }
            const x = cx + dx;
            const y = cy + dy;
            const z = cz + dz;
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
    }

    stats.voxels = countFilled();
    shakeAmp = Math.min(shakeAmp + 0.4, 1.05);
    flashLight.position.copy(impactPoint).add(tmpVec.set(0, 0.4, 1.6));
    flashLight.intensity = 70;
    fireShockwave(impactPoint, hit ? 1 : 0.55);
    fireSparks(impactPoint, hit ? 1 : 0.6);
    sfx.boom(hit ? 1 : 0.45);

    if (destroyed > 0) {
      scheduleCrumble(solveSupport());
    }
    return true;
  }

  function restore(): void {
    sfx.resume();
    filled.set(blueprint.filled);
    pendingCrumble = [];
    debris.length = 0;
    debrisCount = 0;
    debrisMesh.count = 0;
    stats.voxels = blueprint.count;
    stats.debris = 0;
    if (reduced) {
      populateStructure(false);
      renderOnce();
      return;
    }
    building = true;
    buildStart = performance.now();
    populateStructure(true);
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
    timeScale += (timeScaleTarget - timeScale) * Math.min(1, dtRaw * 9);
    const dt = dtRaw * timeScale;
    simTime += dt;

    updateBuilding(nowMs);
    processPending();
    updateDebris(dt);
    updateSparks(dt);
    updateShockwaves(dt);
    updateDust(dt);

    flashLight.intensity *= Math.exp(-9 * dtRaw);
    surveyRing.rotation.z += dt * 0.3;
    keyLight.intensity = 2.4 + Math.sin(nowMs * 0.0011) * 0.18;

    shakeAmp *= Math.exp(-5.2 * dtRaw);
    camera.position.set(
      CAMERA_POS.x + Math.sin(nowMs * 0.041) * shakeAmp * 0.22,
      CAMERA_POS.y + Math.sin(nowMs * 0.053) * shakeAmp * 0.18,
      CAMERA_POS.z,
    );
    camera.lookAt(CAMERA_TARGET);

    stats.fps = stats.fps * 0.92 + (1 / Math.max(dtRaw, 0.0001)) * 0.08;
    renderer.render(scene, camera);
  };
  loop(performance.now());

  function dispose(): void {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
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
      timeScaleTarget = on ? 0.22 : 1;
    },
    stats,
    dispose,
  };
}
