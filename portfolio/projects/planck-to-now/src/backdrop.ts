import * as THREE from "three";

export interface CmbUniforms {
  uTime: THREE.IUniform<number>;
  uOpacity: THREE.IUniform<number>;
  uCool: THREE.IUniform<number>;
}

const VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uCool;
varying vec3 vDir;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int k = 0; k < 4; k++) {
    v += a * noise(p);
    p *= 2.13;
    a *= 0.5;
  }
  return v;
}

void main() {
  float n = fbm(vDir * 3.4 + vec3(uTime * 0.006));
  n = n * n * 1.35;
  vec3 warm = vec3(1.0, 0.52, 0.16);
  vec3 cold = vec3(0.14, 0.028, 0.011);
  vec3 col = mix(warm, cold, uCool);
  float bright = 0.55 * (0.35 + 0.65 * n);
  gl_FragColor = vec4(col * bright * uOpacity, uOpacity * 0.85);
}
`;

export function createCmbShell(): { mesh: THREE.Mesh; uniforms: CmbUniforms } {
  const uniforms: CmbUniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uCool: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), material);
  mesh.renderOrder = 1;
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

export function createCoreGlow(): { sprite: THREE.Sprite; material: THREE.SpriteMaterial } {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,250,240,1)");
    grad.addColorStop(0.25, "rgba(255,225,180,0.65)");
    grad.addColorStop(0.55, "rgba(255,170,90,0.22)");
    grad.addColorStop(1, "rgba(255,120,40,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 3;
  sprite.frustumCulled = false;
  return { sprite, material };
}
