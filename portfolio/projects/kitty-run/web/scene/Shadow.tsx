// The contact shadow: a soft ellipse pinned to the ground directly under
// the Kitty. It is what makes her land *on* the rolling ground instead of
// floating over it — especially at the pulled-back framing, where a
// character without a shadow reads as pasted onto the scene.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundY } from "../lib/ground.ts";
import { softDotTexture } from "../lib/textures.ts";
import type { WorldState } from "./world.ts";

// Shadow strength falls to this floor at the top of the jump arc, so the
// highest leaps still keep a whisper of grounding.
const MIN_OPACITY = 0.14;
const GROUND_OPACITY = 0.36;

export function Shadow({ world }: { world: WorldState }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => softDotTexture(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const material = mesh.material as THREE.MeshBasicMaterial;
    // The Kitty stays at world x = 0 while the ground scrolls underneath,
    // so the shadow samples the same ground function the physics uses.
    const groundTop = groundY(world.distance);
    const height = Math.max(0, world.kitty.y);
    // Higher jumps pull the light-source angle steeper: the ellipse
    // tightens toward the feet and fades, like a real drop shadow.
    const t = Math.min(1, height / 3.2);
    const shrink = 1 - t * 0.45;
    mesh.position.set(0, groundTop + 0.02 + height * 0.02, 0.02);
    mesh.scale.set(0.72 * shrink, 0.23 * shrink, 1);
    material.opacity = GROUND_OPACITY - (GROUND_OPACITY - MIN_OPACITY) * t;
  });

  return (
    <mesh ref={meshRef} renderOrder={-2}>
      <planeGeometry />
      <meshBasicMaterial
        map={texture}
        color="#b96a8a"
        transparent
        opacity={GROUND_OPACITY}
        depthWrite={false}
      />
    </mesh>
  );
}
