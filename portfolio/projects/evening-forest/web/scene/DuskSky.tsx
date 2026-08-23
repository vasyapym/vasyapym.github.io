import { useMemo } from "react";
import * as THREE from "three";
import { COLORS, SUN_DIRECTION } from "../lib/palette";
import { windUniform } from "../lib/clock";

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
  uniform float uTime;
  varying vec3 vDirection;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec3 dir = normalize(vDirection);
    float h = dir.y;
    float sunAmount = max(dot(dir, uSunDirection), 0.0);

    vec3 col = mix(uHorizon, uBand, smoothstep(0.0, 0.14, h));
    col = mix(col, uUpper, smoothstep(0.10, 0.40, h));
    col = mix(col, uZenith, smoothstep(0.36, 0.92, h));

    // Warm halo and a small soft sun disc sitting on the treeline.
    col += vec3(1.0, 0.55, 0.25) * pow(sunAmount, 8.0) * 0.55;
    col += vec3(1.0, 0.78, 0.48) * pow(sunAmount, 240.0) * 1.6;

    // Sparse twinkling stars in the upper violet.
    float cell = hash13(floor(dir * 190.0));
    float starMask = step(0.9986, cell) * smoothstep(0.30, 0.75, h);
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.6 + cell * 90.0);
    col += vec3(0.85, 0.9, 1.0) * starMask * twinkle * 0.7;

    // Below the horizon the sky sinks into dark ground haze.
    col = mix(col, vec3(0.05, 0.04, 0.07), smoothstep(0.0, -0.12, h));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function DuskSky() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uZenith: { value: COLORS.zenith.clone() },
        uUpper: { value: COLORS.upper.clone() },
        uBand: { value: COLORS.band.clone() },
        uHorizon: { value: COLORS.horizon.clone() },
        uSunDirection: { value: SUN_DIRECTION.clone() },
        uTime: windUniform,
      },
    });
  }, []);

  const geometry = useMemo(() => new THREE.SphereGeometry(300, 32, 20), []);

  return (
    <mesh
      geometry={geometry}
      material={material}
      renderOrder={-10}
      frustumCulled={false}
    />
  );
}
