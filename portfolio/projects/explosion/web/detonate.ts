import * as THREE from "three";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MAX_BURSTS = 12;
const BURST_LIFETIME = 2.3;
const OVERLAY_ID = "explosion-luna-overlay";

export type DetonationPoint = {
  readonly x: number;
  readonly y: number;
};

type Burst = {
  readonly group: THREE.Group;
  readonly core: THREE.Mesh;
  readonly rings: THREE.Mesh[];
  readonly pieces: Piece[];
  readonly sparks: SparkCloud;
  age: number;
  readonly lifetime: number;
};

type Piece = {
  readonly mesh: THREE.Mesh;
  readonly velocity: THREE.Vector3;
  readonly spin: THREE.Vector3;
  readonly homeScale: number;
};

type SparkCloud = {
  readonly points: THREE.Points;
  readonly positions: Float32Array;
  readonly velocities: Float32Array;
  readonly life: Float32Array;
  readonly ages: Float32Array;
};

type SceneController = {
  readonly element: HTMLElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly bursts: Burst[];
  readonly clock: THREE.Clock;
  readonly resize: () => void;
  readonly dispose: () => void;
  frame: number;
  disposed: boolean;
};

let overlayController: SceneController | null = null;

const COLORS = [
  0xffc77b,
  0xff7448,
  0xe8e2d1,
  0x6dc4c2,
  0x8d6b52,
];

function reducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomColor(): THREE.Color {
  return new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]);
}

function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer | null {
  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
  } catch {
    return null;
  }
}

function createMaterial(color: THREE.Color, emissive = 0x000000, roughness = 0.42): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive === 0 ? 0 : 1.7,
    metalness: 0.56,
    roughness,
    flatShading: true,
  });
}

function createPieceGeometry(index: number): THREE.BufferGeometry {
  switch (index % 5) {
    case 0:
      return new THREE.TetrahedronGeometry(random(0.12, 0.24), 0);
    case 1:
      return new THREE.IcosahedronGeometry(random(0.12, 0.22), 0);
    case 2:
      return new THREE.OctahedronGeometry(random(0.14, 0.25), 0);
    case 3:
      return new THREE.BoxGeometry(random(0.18, 0.34), random(0.12, 0.3), random(0.12, 0.32));
    default:
      return new THREE.CylinderGeometry(random(0.08, 0.16), random(0.16, 0.25), random(0.22, 0.48), 6, 1);
  }
}

function createSparkCloud(count: number, color: THREE.Color): SparkCloud {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const ages = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const direction = new THREE.Vector3(random(-1, 1), random(-1.05, 0.74), random(-0.65, 0.9)).normalize();
    const speed = random(1.8, 6.2);
    positions[offset] = 0;
    positions[offset + 1] = 0;
    positions[offset + 2] = 0;
    velocities[offset] = direction.x * speed;
    velocities[offset + 1] = direction.y * speed;
    velocities[offset + 2] = direction.z * speed;
    life[index] = random(0.42, 1.3);
    ages[index] = 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size: 0.08,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return { points, positions, velocities, life, ages };
}

function createBurst(scene: THREE.Scene, origin: THREE.Vector3, scale: number, delay = 0): Burst {
  const group = new THREE.Group();
  group.position.copy(origin);
  group.scale.setScalar(scale);
  group.userData.delay = delay;
  scene.add(group);

  const coreMaterial = createMaterial(new THREE.Color(0xffa14d), 0xff5a20, 0.24);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 2), coreMaterial);
  group.add(core);

  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xffad5c,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.72, 20, 12), haloMaterial);
  group.add(halo);

  const rings: THREE.Mesh[] = [];
  for (const radius of [0.5, 0.82, 1.13]) {
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: radius < 0.8 ? 0xffc77b : 0xe76a43,
      transparent: true,
      opacity: radius < 0.8 ? 0.8 : 0.46,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018, 6, 48), ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    rings.push(ring);
  }

  const pieces: Piece[] = [];
  const pieceCount = Math.round(random(18, 28));
  for (let index = 0; index < pieceCount; index += 1) {
    const color = randomColor();
    const material = createMaterial(color, color.getHex() === 0xffc77b ? 0xff7e28 : 0x000000, random(0.24, 0.66));
    const mesh = new THREE.Mesh(createPieceGeometry(index), material);
    mesh.position.set(random(-0.17, 0.17), random(-0.17, 0.17), random(-0.17, 0.17));
    mesh.rotation.set(random(0, Math.PI), random(0, Math.PI), random(0, Math.PI));
    const direction = new THREE.Vector3(random(-1, 1), random(-1.15, 0.85), random(-0.75, 0.9)).normalize();
    const speed = random(1.5, 4.2);
    const homeScale = random(0.72, 1.55);
    mesh.scale.setScalar(homeScale);
    group.add(mesh);
    pieces.push({
      mesh,
      velocity: direction.multiplyScalar(speed),
      spin: new THREE.Vector3(random(-7, 7), random(-7, 7), random(-5, 5)),
      homeScale,
    });
  }

  const sparkColor = new THREE.Color(0xffc77b);
  const sparks = createSparkCloud(Math.round(random(70, 110)), sparkColor);
  group.add(sparks.points);

  return {
    group,
    core,
    rings,
    pieces,
    sparks,
    age: -delay,
    lifetime: BURST_LIFETIME + delay,
  };
}

function updateSparkCloud(cloud: SparkCloud, dt: number): void {
  const positions = cloud.points.geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let index = 0; index < cloud.ages.length; index += 1) {
    cloud.ages[index] += dt;
    const offset = index * 3;
    if (cloud.ages[index] > cloud.life[index]) {
      positions.setXYZ(offset / 3, 0, 0, 0);
      continue;
    }
    const drag = Math.exp(-0.7 * dt);
    cloud.velocities[offset] *= drag;
    cloud.velocities[offset + 1] *= drag;
    cloud.velocities[offset + 2] *= drag;
    cloud.velocities[offset + 1] -= 2.2 * dt;
    cloud.positions[offset] += cloud.velocities[offset] * dt;
    cloud.positions[offset + 1] += cloud.velocities[offset + 1] * dt;
    cloud.positions[offset + 2] += cloud.velocities[offset + 2] * dt;
    positions.setXYZ(index, cloud.positions[offset], cloud.positions[offset + 1], cloud.positions[offset + 2]);
  }
  positions.needsUpdate = true;
}

function updateBurst(burst: Burst, dt: number): void {
  burst.age += dt;
  if (burst.age < 0) {
    return;
  }

  const progress = Math.min(burst.age / BURST_LIFETIME, 1);
  const fade = Math.max(0, 1 - Math.max(0, progress - 0.68) / 0.32);
  burst.core.rotation.x += dt * 3.5;
  burst.core.rotation.y += dt * 4.2;
  burst.core.scale.setScalar(1 + Math.sin(progress * Math.PI) * 0.45);
  const coreMaterial = burst.core.material as THREE.MeshStandardMaterial;
  coreMaterial.emissiveIntensity = 1.8 * fade;

  burst.group.children.forEach((child) => {
    if (child === burst.core || burst.rings.includes(child as THREE.Mesh) || child instanceof THREE.Points) {
      return;
    }
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
      child.scale.setScalar(1 + progress * 0.9);
      child.material.opacity = 0.13 * fade;
    }
  });

  burst.rings.forEach((ring, index) => {
    const ringProgress = Math.min(1, Math.max(0, progress * (1.2 + index * 0.18)));
    ring.scale.setScalar(1 + ringProgress * (2.6 + index * 0.45));
    const material = ring.material as THREE.MeshBasicMaterial;
    material.opacity = (0.75 - index * 0.12) * fade * (1 - ringProgress * 0.48);
    ring.rotation.z += dt * (index % 2 === 0 ? 1.5 : -1.1);
  });

  burst.pieces.forEach((piece) => {
    piece.velocity.y -= 2.5 * dt;
    piece.velocity.multiplyScalar(Math.exp(-0.42 * dt));
    piece.mesh.position.addScaledVector(piece.velocity, dt);
    piece.mesh.rotation.x += piece.spin.x * dt;
    piece.mesh.rotation.y += piece.spin.y * dt;
    piece.mesh.rotation.z += piece.spin.z * dt;
    piece.mesh.scale.setScalar(piece.homeScale * (0.96 + fade * 0.08));
    const material = piece.mesh.material as THREE.MeshStandardMaterial;
    material.opacity = fade;
    material.transparent = fade < 1;
  });

  updateSparkCloud(burst.sparks, dt);
  const sparkMaterial = burst.sparks.points.material as THREE.PointsMaterial;
  sparkMaterial.opacity = fade;
}

function updateBursts(controller: SceneController, dt: number): void {
  controller.bursts.forEach((burst) => updateBurst(burst, dt));
  controller.bursts.filter((burst) => burst.age >= burst.lifetime).forEach(disposeBurst);
  controller.bursts.splice(0, controller.bursts.length, ...controller.bursts.filter((burst) => burst.age < burst.lifetime));
}

function disposeBurst(burst: Burst): void {
  burst.group.traverse((object) => {
    if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Points)) {
      return;
    }
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
  burst.group.removeFromParent();
}

function createController(element: HTMLElement): SceneController | null {
  const canvas = document.createElement("canvas");
  canvas.className = "explosion-overlay-canvas";
  canvas.setAttribute("aria-hidden", "true");
  element.appendChild(canvas);
  const renderer = createRenderer(canvas);
  if (!renderer) {
    canvas.remove();
    return null;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080b0d, 0.012);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  scene.add(new THREE.AmbientLight(0xffe7cc, 1.25));
  const keyLight = new THREE.PointLight(0xffa24e, 20, 24, 2);
  keyLight.position.set(-3, 4, 8);
  scene.add(keyLight);
  const coolLight = new THREE.PointLight(0x4bb3c5, 14, 22, 2);
  coolLight.position.set(4, -2, 6);
  scene.add(coolLight);

  const resize = () => {
    const width = Math.max(1, element.clientWidth || window.innerWidth);
    const height = Math.max(1, element.clientHeight || window.innerHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();

  const controller: SceneController = {
    element,
    renderer,
    scene,
    camera,
    bursts: [],
    clock: new THREE.Clock(),
    resize,
    dispose: () => {
      if (controller.disposed) {
        return;
      }
      controller.disposed = true;
      cancelAnimationFrame(controller.frame);
      window.removeEventListener("resize", resize);
      controller.bursts.forEach(disposeBurst);
      controller.bursts.length = 0;
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Points)) {
          return;
        }
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      if (element.id === OVERLAY_ID) {
        element.remove();
      }
      if (overlayController === controller) {
        overlayController = null;
      }
    },
    frame: 0,
    disposed: false,
  };

  window.addEventListener("resize", resize);
  overlayController = controller;
  return controller;
}

function ensureOverlayController(): SceneController | null {
  if (overlayController && !overlayController.disposed) {
    return overlayController;
  }
  const element = document.getElementById(OVERLAY_ID) ?? createOverlayElement();
  const controller = createController(element);
  if (!controller) {
    return null;
  }

  const loop = () => {
    if (controller.disposed) {
      return;
    }
    const dt = Math.min(controller.clock.getDelta(), 0.05);
    updateBursts(controller, dt);
    controller.renderer.render(controller.scene, controller.camera);
    if (controller.bursts.length === 0) {
      controller.dispose();
      return;
    }
    controller.frame = requestAnimationFrame(loop);
  };
  controller.frame = requestAnimationFrame(loop);
  return controller;
}

function createOverlayElement(): HTMLElement {
  const element = document.createElement("div");
  element.id = OVERLAY_ID;
  element.className = "explosion-overlay";
  element.setAttribute("aria-hidden", "true");
  document.body.appendChild(element);
  return element;
}

function toWorldPoint(at: DetonationPoint, controller: SceneController): THREE.Vector3 {
  const rect = controller.element.getBoundingClientRect();
  const ndc = new THREE.Vector3(
    ((at.x - rect.left) / rect.width) * 2 - 1,
    -((at.y - rect.top) / rect.height) * 2 + 1,
    0,
  );
  ndc.unproject(controller.camera);
  const direction = ndc.sub(controller.camera.position).normalize();
  const distance = -controller.camera.position.z / direction.z;
  return controller.camera.position.clone().add(direction.multiplyScalar(distance));
}

function compactBursts(controller: SceneController): void {
  while (controller.bursts.length >= MAX_BURSTS) {
    const oldest = controller.bursts.shift();
    if (oldest) {
      disposeBurst(oldest);
    }
  }
}

export function detonate(at: DetonationPoint): boolean {
  if (reducedMotion()) {
    return false;
  }
  const controller = ensureOverlayController();
  if (!controller) {
    return false;
  }

  compactBursts(controller);
  const origin = toWorldPoint(at, controller);
  controller.bursts.push(createBurst(controller.scene, origin, 1));
  const secondaryCount = Math.round(random(2, 4));
  for (let index = 0; index < secondaryCount; index += 1) {
    const offset = new THREE.Vector3(random(-2.4, 2.4), random(-1.6, 1.8), random(-0.4, 0.5));
    controller.bursts.push(createBurst(controller.scene, origin.clone().add(offset), random(0.24, 0.52), random(0.08, 0.32)));
  }
  return true;
}

export function mountSpecimen(element: HTMLElement): (() => void) | null {
  const controller = createController(element);
  if (!controller) {
    return null;
  }

  const specimenGroup = new THREE.Group();
  controller.scene.add(specimenGroup);
  const specimens: THREE.Mesh[] = [];
  const materials = [
    createMaterial(new THREE.Color(0xff9d4d), 0xff5a20, 0.25),
    createMaterial(new THREE.Color(0x5bb6bd), 0x164b54, 0.36),
    createMaterial(new THREE.Color(0xe9e0d0), 0x000000, 0.5),
  ];
  const geometries = [
    new THREE.IcosahedronGeometry(1.05, 2),
    new THREE.TetrahedronGeometry(1.12, 1),
    new THREE.OctahedronGeometry(1.15, 1),
  ];
  geometries.forEach((geometry, index) => {
    const mesh = new THREE.Mesh(geometry, materials[index]);
    mesh.position.set((index - 1) * 2.25, index === 1 ? 0.35 : -0.15, index === 1 ? 0.5 : 0);
    mesh.rotation.set(index * 0.5, index * 0.85, index * 0.22);
    mesh.scale.setScalar(index === 1 ? 0.86 : 0.74);
    specimenGroup.add(mesh);
    specimens.push(mesh);
  });

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.55, 0.018, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0xffa14d, transparent: true, opacity: 0.52 }),
  );
  ring.rotation.x = Math.PI / 2;
  specimenGroup.add(ring);

  const reduced = reducedMotion();
  let frame = 0;
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduced) {
      specimenGroup.rotation.y += dt * 0.24;
      specimenGroup.rotation.x = Math.sin(now * 0.0004) * 0.08;
      specimens.forEach((mesh, index) => {
        mesh.rotation.x += dt * (0.22 + index * 0.06);
        mesh.rotation.z += dt * (0.14 + index * 0.04);
      });
      ring.rotation.z += dt * 0.38;
      updateBursts(controller, dt);
    }
    controller.renderer.render(controller.scene, controller.camera);
    if (!reduced || controller.bursts.length > 0) {
      frame = requestAnimationFrame(loop);
    }
  };
  loop(performance.now());

  return () => {
    cancelAnimationFrame(frame);
    specimenGroup.removeFromParent();
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    ring.geometry.dispose();
    (ring.material as THREE.Material).dispose();
    controller.dispose();
  };
}

export function hasWebGL(): boolean {
  return Boolean(document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl"));
}
