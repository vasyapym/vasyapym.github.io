import * as THREE from "three";
import { buildCosmicField } from "./fieldgen";

export interface ParticleUniforms {
  uA: THREE.IUniform<number>;
  uTime: THREE.IUniform<number>;
  uWeb: THREE.IUniform<number>;
  uPlasma: THREE.IUniform<number>;
  uSpark: THREE.IUniform<number>;
  uStar: THREE.IUniform<number>;
  uHot: THREE.IUniform<THREE.Color>;
  uH: THREE.IUniform<number>;
}

export interface ParticleSystem {
  points: THREE.Points;
  uniforms: ParticleUniforms;
}

const VERT = /* glsl */ `
attribute vec3 aStruct;
attribute vec4 aSeed;

uniform float uA;
uniform float uTime;
uniform float uWeb;
uniform float uPlasma;
uniform float uSpark;
uniform float uStar;
uniform float uH;
uniform vec3 uHot;

varying vec3 vCol;
varying float vA;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  vec3 base = mix(position, aStruct, uWeb);

  float amp = uPlasma * 5.5 * (0.35 + aSeed.x * 0.65);
  float t = uTime;
  vec3 p = base;
  p += amp * vec3(
    sin(base.y * 0.50 + t * 0.90 + base.z * 0.35),
    sin(base.z * 0.57 + t * 0.73 + base.x * 0.29),
    sin(base.x * 0.47 + t * 0.83 + base.y * 0.31));
  p += amp * 0.45 * vec3(
    sin(base.z * 1.30 - t * 1.40),
    sin(base.x * 1.10 - t * 1.10),
    sin(base.y * 1.70 - t * 1.70));
  p *= uA;

  float isStar = step(0.9995, aSeed.y);
  float starOn = isStar * uStar * smoothstep(0.8, 1.0, uWeb);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float early = pow(clamp(1.0 - uA * 1.9, 0.0, 1.0), 1.6);
  float twinkle = 0.75 + 0.45 * sin(t * (6.0 + 8.0 * aSeed.z) + aSeed.w * 40.0);
  float sp = uSpark * step(0.994, hash(floor(t * 13.0) + aSeed.x * 91.7 + aSeed.y * 57.1));

  float b = mix(0.55, 1.0, aSeed.w);
  b *= mix(1.0, 0.42, uWeb);
  b *= 1.0 + 1.4 * early;
  b *= 1.0 + 3.5 * sp;
  b *= 1.0 + 2.2 * starOn * twinkle;

  vec3 col = mix(uHot, vec3(0.62, 0.37, 0.24), uWeb * 0.9);
  col = mix(col, vec3(0.74, 0.83, 1.05), starOn);
  col *= 0.85 + 0.3 * aSeed.z;

  vCol = col * b;
  vA = clamp(b, 0.0, 1.0);

  float sz = mix(1.0, 2.3, aSeed.z);
  sz *= 1.0 + 2.4 * starOn + 1.6 * early;
  gl_PointSize = sz * uH * 0.0018 * (46.0 / max(1.0, -mv.z));
}
`;

const FRAG = /* glsl */ `
varying vec3 vCol;
varying float vA;

void main() {
  vec2 q = gl_PointCoord - 0.5;
  float d = length(q);
  if (d > 0.5) discard;
  float fall = smoothstep(0.5, 0.05, d);
  float core = smoothstep(0.16, 0.0, d);
  vec3 c = vCol * (fall + 1.6 * core);
  gl_FragColor = vec4(c, vA * fall);
}
`;

export function createParticles(count: number): ParticleSystem {
  const { positions, struct, seeds } = buildCosmicField(count);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aStruct", new THREE.BufferAttribute(struct, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));

  const uniforms: ParticleUniforms = {
    uA: { value: 0.0008 },
    uTime: { value: 0 },
    uWeb: { value: 0 },
    uPlasma: { value: 1 },
    uSpark: { value: 0 },
    uStar: { value: 0 },
    uHot: { value: new THREE.Color(1, 1, 1) },
    uH: { value: 1080 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 2;
  return { points, uniforms };
}
