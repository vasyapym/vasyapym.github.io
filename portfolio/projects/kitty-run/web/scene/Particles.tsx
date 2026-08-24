// GPU points driven by the CPU particle pool: one draw call, positions,
// colours and sizes rewritten each frame. Dead particles shrink to zero.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { softDotTexture } from "../lib/textures.ts";
import type { WorldState } from "./world.ts";

const COUNT = 256;

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (160.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vColor;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColor, 1.0) * tex;
  }
`;

export function Particles({ world }: { world: WorldState }) {
  const pointsRef = useRef<THREE.Points>(null);
  const dotMap = useMemo(() => softDotTexture(), []);

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(COUNT), 1));
    const material = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: dotMap } },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, [dotMap]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    const colors = geometry.getAttribute("aColor") as THREE.BufferAttribute;
    const sizes = geometry.getAttribute("aSize") as THREE.BufferAttribute;
    const posArr = positions.array as Float32Array;
    const colArr = colors.array as Float32Array;
    const sizeArr = sizes.array as Float32Array;

    for (let i = 0; i < COUNT; i += 1) {
      const slot = world.particles.slots[i];
      if (!slot.active) {
        sizeArr[i] = 0;
        continue;
      }
      const p = slot.data;
      p.life -= dt;
      if (p.life <= 0) {
        slot.active = false;
        sizeArr[i] = 0;
        continue;
      }
      p.vx -= p.vx * Math.min(1, p.drag * dt);
      p.vy -= p.gravity * dt;
      p.vy -= p.vy * Math.min(1, p.drag * 0.4 * dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const fade = p.life / p.maxLife;
      posArr[i * 3] = p.x - world.distance;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = 0.2;
      colArr[i * 3] = p.r;
      colArr[i * 3 + 1] = p.g;
      colArr[i * 3 + 2] = p.b;
      sizeArr[i] = p.size * (0.35 + 0.65 * fade);
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
