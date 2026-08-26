import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "../lib/palette";
import { terrainHeight } from "../lib/heightfield";
import { createRng } from "../lib/rng";
import { daylightGains, windUniform } from "../lib/clock";

const SHAFT_COUNT = 9;

// Fake volumetric shafts: crossed additive gradient planes leaning with the
// low sun, placed along the spawn meadow. Cheap, but at dusk they sell the
// whole "light through the trees" mood. uGain fades them out at night —
// shafts without a low sun are a lie the eye catches.
const SHAFT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSeed;
  uniform float uTime;
  uniform float uGain;
  varying vec2 vUv;

  void main() {
    float across =
      smoothstep(0.0, 0.28, vUv.x) * smoothstep(1.0, 0.72, vUv.x);
    float down = pow(vUv.y, 1.35);
    float shimmer = 0.8 + 0.2 * sin(uTime * 0.45 + uSeed * 17.0);
    float alpha = across * down * shimmer * uOpacity * uGain;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const SHAFT_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function makeShaftMaterial(seed: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: SHAFT_VERTEX,
    fragmentShader: SHAFT_FRAGMENT,
    uniforms: {
      uColor: { value: COLORS.shaft.clone() },
      uOpacity: { value: 0.13 },
      uSeed: { value: seed },
      uTime: windUniform,
      uGain: daylightGains.shaft,
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
  });
}

export function LightShafts() {
  const shafts = useMemo(() => {
    const rand = createRng("evening-forest/shafts/v1");
    const list: {
      position: [number, number, number];
      yaw: number;
      width: number;
      height: number;
      materials: THREE.ShaderMaterial[];
    }[] = [];
    for (let i = 0; i < SHAFT_COUNT; i += 1) {
      const angle = i * 2.39996; // golden angle spread
      const radius = 15 + i * 5.1 + rand() * 3;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 11 + rand() * 5;
      const width = 3 + rand() * 2.4;
      const y = terrainHeight(x, z) + height / 2 - 0.5;
      const yaw = rand() * Math.PI;
      // Two planes crossed at a right angle so the shaft reads from any path.
      const materials = [makeShaftMaterial(i * 7.31), makeShaftMaterial(i * 7.31 + 3.7)];
      list.push({ position: [x, y, z], yaw, width, height, materials });
    }
    return list;
  }, []);

  useEffect(() => {
    return () => {
      for (const shaft of shafts) {
        for (const material of shaft.materials) material.dispose();
      }
    };
  }, [shafts]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group renderOrder={5}>
      {shafts.map((shaft, index) => (
        <group key={index} position={shaft.position} rotation={[0.2, shaft.yaw, 0]}>
          {[0, 1].map((twin) => (
            <mesh
              key={twin}
              geometry={geometry}
              material={shaft.materials[twin]}
              rotation={[0, twin * (Math.PI / 2), 0]}
              scale={[shaft.width, shaft.height, 1]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
