import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { daylightGains, windUniform } from "../lib/clock";

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uUpper;
  uniform vec3 uBand;
  uniform vec3 uHorizon;
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform float uSunHalo;
  uniform float uStarGain;
  uniform float uTime;
  varying vec3 vDirection;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Smoothed value noise; two octaves of this is the whole cloud budget.
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec3 dir = normalize(vDirection);
    float h = dir.y;
    float sunAmount = max(dot(dir, uSunDirection), 0.0);

    vec3 col = mix(uHorizon, uBand, smoothstep(0.0, 0.14, h));
    col = mix(col, uUpper, smoothstep(0.10, 0.40, h));
    col = mix(col, uZenith, smoothstep(0.36, 0.92, h));

    // Painterly cloud band: a drifting 2-octave noise strip across the mid
    // sky. Proteus rules — big soft shapes, mostly-open sky, colour comes
    // entirely from the daylight uniforms so every phase tints it for free.
    vec2 cuv = dir.xz / max(h + 0.32, 0.12);
    vec2 drift = vec2(uTime * 0.010, uTime * 0.0037);
    vec2 p = cuv * vec2(0.9, 1.4) + drift;
    float n = vnoise(p) * 0.62 + vnoise(p * 2.35 + vec2(7.3, 3.1)) * 0.38;
    float bandMask = smoothstep(0.045, 0.16, h) * (1.0 - smoothstep(0.42, 0.66, h));
    float cloud = smoothstep(0.56, 0.78, n) * bandMask;
    // A second, offset sample fakes cheap self-shading inside each mass.
    float shade = vnoise(p * 1.7 + vec2(4.7, 9.1));

    // Warm halo and a small soft sun disc sitting on the treeline. Both
    // scale with uSunHalo; clouds partially occlude them.
    col += uSunColor * pow(sunAmount, 8.0) * 0.55 * uSunHalo * (1.0 - cloud * 0.55);
    col += mix(uSunColor, vec3(1.0, 0.98, 0.9), 0.4) *
      pow(sunAmount, 240.0) * 1.6 * uSunHalo * (1.0 - cloud * 0.9);

    // The moon: a crisp cool disc plus a faint halo, gated by starGain so
    // it only surfaces once deep night owns the sky (sunDir IS the moon
    // direction at night; see daylight.ts).
    float moonGate = smoothstep(0.55, 0.9, uStarGain);
    float moonDisc = smoothstep(0.99955, 0.99985, sunAmount);
    col += vec3(0.78, 0.85, 1.0) *
      (moonDisc * 1.1 + pow(sunAmount, 60.0) * 0.10) *
      moonGate * (1.0 - cloud * 0.9);

    // Lay the clouds in: shadow side from the upper sky, lit side blending
    // band colour into sun colour on the sun-facing half.
    vec3 cloudShadow = mix(uZenith, uUpper, 0.5) * 0.85;
    vec3 cloudLit = mix(uBand, uSunColor, 0.6);
    float lit = uSunHalo * (0.30 + 0.70 * pow(sunAmount, 2.0)) * (0.45 + 0.55 * shade);
    col = mix(col, mix(cloudShadow, cloudLit, clamp(lit, 0.0, 1.0)), cloud * 0.85);

    // Stars: per-cell magnitude and twinkle rate so the field reads as a
    // real sky instead of a blinking grid; clouds swallow them.
    float cell = hash13(floor(dir * 190.0));
    float starMask = step(0.9986, cell) * smoothstep(0.24, 0.70, h);
    float mag = fract(cell * 913.7);
    float twinkle = 0.6 + 0.4 * sin(uTime * (0.9 + mag * 1.6) + cell * 90.0);
    col += vec3(0.85, 0.9, 1.0) * starMask * twinkle * (0.35 + 0.65 * mag) *
      0.8 * uStarGain * (1.0 - cloud * 0.95);

    // Below the horizon the sky sinks into ground haze tinted by the
    // zenith, so night stays steel-cool and dusk stays violet down there.
    col = mix(col, uZenith * 0.32 + vec3(0.02, 0.015, 0.03),
      smoothstep(0.0, -0.12, h));

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Registry the material publishes its uniforms into on mount, so
// DaylightDriver can retint the sky each frame without prop threading
// through the scene tree.
export const duskSkyUniforms: {
  current: Record<string, THREE.IUniform> | null;
} = { current: null };

// The sky dome. All colors, the sun direction and the star brightness are
// uniforms driven by DaylightDriver each frame; the defaults here are the
// golden-hour opening state so the first frame is already correct.
export function DuskSky() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uZenith: { value: new THREE.Color("#3a2a66") },
        uUpper: { value: new THREE.Color("#58409a") },
        uBand: { value: new THREE.Color("#b06a86") },
        uHorizon: { value: new THREE.Color("#f2955a") },
        uSunDirection: { value: new THREE.Vector3(-0.42, 0.16, -0.86) },
        uSunColor: { value: new THREE.Color("#ffb066") },
        uSunHalo: { value: 1 },
        uStarGain: daylightGains.star,
        uTime: windUniform,
      },
    });
  }, []);

  const geometry = useMemo(() => new THREE.SphereGeometry(300, 32, 20), []);

  useEffect(() => {
    duskSkyUniforms.current = material.uniforms;
    return () => {
      duskSkyUniforms.current = null;
    };
  }, [material]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      renderOrder={-10}
      frustumCulled={false}
    />
  );
}
