import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "../lib/palette";
import { terrainHeight } from "../lib/heightfield";
import { createRng } from "../lib/rng";
import { windUniform } from "../lib/clock";

const COUNT = 150;

// Fireflies drift entirely on the GPU: base positions are baked once
// (seeded), and the vertex shader offsets them with per-firefly phases read
// from a shared clock — zero CPU work per frame.
const VERTEX_SHADER = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  varying float vFade;

  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * (0.21 + aSeed.x * 0.25) + aSeed.y * 40.0) * (1.4 + aSeed.x * 2.2);
    pos.z += cos(uTime * (0.19 + aSeed.y * 0.22) + aSeed.z * 40.0) * (1.4 + aSeed.y * 2.2);
    pos.y += sin(uTime * (0.3 + aSeed.z * 0.3) + aSeed.w * 50.0) * (0.35 + aSeed.z * 0.5);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float dist = length(mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(260.0 / dist, 1.5, 7.0);

    float pulse = 0.45 + 0.55 * sin(uTime * (0.8 + aSeed.w * 1.6) + aSeed.x * 60.0);
    vFade = pulse * smoothstep(78.0, 16.0, dist);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  varying float vFade;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float disc = smoothstep(0.5, 0.12, d);
    if (disc < 0.01) discard;
    gl_FragColor = vec4(uColor, disc * vFade);
  }
`;

export function Fireflies() {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 4);
    const rand = createRng("evening-forest/fireflies/v1");
    for (let i = 0; i < COUNT; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = Math.sqrt(rand()) * 72;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions[i * 3] = x;
      positions[i * 3 + 1] = terrainHeight(x, z) + 0.5 + rand() * 2.4;
      positions[i * 3 + 2] = z;
      seeds[i * 4] = rand();
      seeds[i * 4 + 1] = rand();
      seeds[i * 4 + 2] = rand();
      seeds[i * 4 + 3] = rand();
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: windUniform,
          uColor: { value: COLORS.firefly.clone() },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <points geometry={geometry} material={material} renderOrder={6} frustumCulled={false} />
  );
}
