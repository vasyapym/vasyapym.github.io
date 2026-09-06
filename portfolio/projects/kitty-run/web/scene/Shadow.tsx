// The contact shadow: a soft ellipse pinned to the ground directly under
// the Kitty. It is what makes her land *on* the rolling ground instead of
// floating over it — especially at the pulled-back framing, where a
// character without a shadow reads as pasted onto the scene.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundY } from "../lib/ground.ts";
import { contactShadowTexture, softDotTexture } from "../lib/textures.ts";
import type { CharacterId } from "../lib/theme.ts";
import type { WorldState } from "./world.ts";

// Shadow strength falls to this floor at the top of the jump arc, so the
// highest leaps still keep a whisper of grounding.
type ShadowLook = {
  color: string;
  texture: "soft" | "contact";
  // The knight (steel + greatsword) is heavier than the cat: the ellipse
  // sits tighter to the feet and reads a step stronger on the ground.
  width: number;
  height: number;
  lift: number;
  groundOpacity: number;
  minOpacity: number;
};

const SHADOW: Record<CharacterId, ShadowLook> = {
  kitty: {
    color: "#b96a8a",
    texture: "soft",
    width: 0.72,
    height: 0.23,
    lift: 0.02,
    groundOpacity: 0.36,
    minOpacity: 0.14,
  },
  // Warm-dark stone shadow, between the ink (#17130f) and the ground body
  // (#3a3835) — the pastel pink was a leftover that broke the palette law.
  // The dense contact texture is what makes it actually read at the
  // pulled-back framing: the soft dot's few-px core vanished on stone.
  souls: {
    color: "#241f1a",
    texture: "contact",
    width: 1.2,
    height: 0.36,
    lift: 0.01,
    groundOpacity: 0.62,
    minOpacity: 0.3,
  },
};

export function Shadow({
  world,
  character,
}: {
  world: WorldState;
  character: CharacterId;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const soft = useMemo(() => softDotTexture(), []);
  const contact = useMemo(() => contactShadowTexture(), []);
  const look = SHADOW[character];
  const texture = look.texture === "contact" ? contact : soft;

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
    mesh.position.set(0, groundTop + look.lift + height * 0.02, 0.02);
    mesh.scale.set(look.width * shrink, look.height * shrink, 1);
    material.opacity =
      look.groundOpacity - (look.groundOpacity - look.minOpacity) * t;
  });

  return (
    <mesh ref={meshRef} renderOrder={-2}>
      <planeGeometry />
      <meshBasicMaterial
        map={texture}
        color={look.color}
        transparent
        opacity={look.groundOpacity}
        depthWrite={false}
      />
    </mesh>
  );
}
