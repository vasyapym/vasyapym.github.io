import * as THREE from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

export interface GradeUniforms {
  uTime: THREE.IUniform<number>;
  uRes: THREE.IUniform<THREE.Vector2>;
  uFrame: THREE.IUniform<number>;  // 0..1 border visibility (boot fade-in)
  uStrain: THREE.IUniform<number>; // 0..1 inflation strain (glow + jitter)
  uBreak: THREE.IUniform<number>;  // 0..1 scrub-consistent shatter amount
  uPulse: THREE.IUniform<number>;  // 0..1 transient burst energy (decays live)
  uHeat: THREE.IUniform<number>;   // 0..1 hot-era grade drive
}

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uRes;
uniform float uFrame;
uniform float uStrain;
uniform float uBreak;
uniform float uPulse;
uniform float uHeat;
varying vec2 vUv;

const float LINE_HW = 1.2;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// One side of the frame. N = outward normal, T = tangent, a/b = segment endpoints.
// The side's pixels are shifted outward along N (sample position pulled inward),
// drift along T, and dissolve cell-by-cell as uBreak rises.
float sideMask(vec2 px, vec2 a, vec2 b, vec2 N, vec2 T, float sideId, out float glow) {
  float disp = (uBreak * 30.0 + uPulse * 90.0) * (0.6 + 0.8 * hash(vec2(sideId, 0.37)));
  float drift = (hash(vec2(sideId * 7.31, floor(px.x + px.y))) - 0.5) * uBreak * 14.0;
  vec2 p = px - N * disp - T * drift;
  float d = segDist(p, a, b);
  vec2 cell = floor(p / 4.0);
  float h = hash(cell + sideId * 19.19);
  float alive = step(uBreak * 0.92, h);
  glow = smoothstep(7.0, 0.0, d) * alive;
  return (1.0 - smoothstep(LINE_HW - 0.6, LINE_HW + 0.6, d)) * alive;
}

void main() {
  vec2 px = vUv * uRes;
  vec2 c = vUv - 0.5;
  float aspect = uRes.x / uRes.y;
  vec2 dir = vec2(c.x * aspect, c.y);
  float dl = length(dir);
  vec2 ndir = dl > 1e-5 ? dir / dl : vec2(0.0);

  vec2 push = dir * 0.014 * uPulse;
  vec2 off = ndir * (0.0022 * uHeat + 0.004 * uPulse);
  vec2 uvBase = vUv;
  float r = texture2D(tDiffuse, uvBase - push - off).r;
  float g = texture2D(tDiffuse, uvBase - push).g;
  float b = texture2D(tDiffuse, uvBase - push + off).b;
  vec3 col = vec3(r, g, b);

  col += vec3(0.010, 0.004, -0.004) * uHeat;
  col = mix(col, smoothstep(vec3(0.0), vec3(1.0), col), 0.10 * uHeat);

  float inset = 14.0 + uStrain * (1.3 * sin(uTime * 41.0) + 0.7 * sin(uTime * 27.3 + 1.7));
  vec2 lo = vec2(inset);
  vec2 hi = uRes - vec2(inset);
  vec2 bl = vec2(lo.x, lo.y);
  vec2 br = vec2(hi.x, lo.y);
  vec2 tl = vec2(lo.x, hi.y);
  vec2 tr = vec2(hi.x, hi.y);

  float g0; float g1; float g2; float g3;
  float m0 = sideMask(px, bl, br, vec2(0.0, -1.0), vec2(1.0, 0.0), 1.0, g0);
  float m1 = sideMask(px, tl, tr, vec2(0.0, 1.0), vec2(1.0, 0.0), 2.0, g1);
  float m2 = sideMask(px, bl, tl, vec2(-1.0, 0.0), vec2(0.0, 1.0), 3.0, g2);
  float m3 = sideMask(px, br, tr, vec2(1.0, 0.0), vec2(0.0, 1.0), 4.0, g3);
  float ringMask = max(max(m0, m1), max(m2, m3));
  float glowMask = max(max(g0, g1), max(g2, g3));

  vec3 borderColor = mix(vec3(0.909, 0.710, 0.486), vec3(0.933, 0.918, 0.878), 0.35);
  float aLine = ringMask * uFrame * (1.0 - 0.25 * uBreak) * (0.55 + 0.35 * uStrain);
  float glow = glowMask * uFrame * (0.10 + 0.30 * uStrain + 0.35 * uPulse + 0.12 * uBreak);
  col += borderColor * aLine + borderColor * glow;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function createGradePass(): { pass: ShaderPass; uniforms: GradeUniforms } {
  const shaderObject = {
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uFrame: { value: 0 },
      uStrain: { value: 0 },
      uBreak: { value: 0 },
      uPulse: { value: 0 },
      uHeat: { value: 0 },
    },
    vertexShader,
    fragmentShader,
  };
  const pass = new ShaderPass(shaderObject);
  // ShaderPass deep-clones uniforms; hand back the clones, never the originals.
  return {
    pass,
    uniforms: {
      uTime: pass.uniforms.uTime as THREE.IUniform<number>,
      uRes: pass.uniforms.uRes as THREE.IUniform<THREE.Vector2>,
      uFrame: pass.uniforms.uFrame as THREE.IUniform<number>,
      uStrain: pass.uniforms.uStrain as THREE.IUniform<number>,
      uBreak: pass.uniforms.uBreak as THREE.IUniform<number>,
      uPulse: pass.uniforms.uPulse as THREE.IUniform<number>,
      uHeat: pass.uniforms.uHeat as THREE.IUniform<number>,
    },
  };
}
