// The contact shadow: a soft ellipse pinned to the ground directly under
// the Kitty. It is what makes her land *on* the rolling ground instead of
// floating over it — especially at the pulled-back framing, where a
// character without a shadow reads as pasted onto the scene.

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundY } from "../lib/ground.ts";
import { contactShadowTexture, softDotTexture } from "../lib/textures.ts";
import type { CharacterId } from "../lib/theme.ts";
import { useCharacterSwap, type CharacterRef } from "./themeSwap.ts";
import type { WorldState } from "./world.ts";

// Shadow strength falls to this floor at the top of the jump arc, so the
// highest leaps still keep a whisper of grounding.
type ShadowLook = {
  color: string;
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
    width: 1.2,
    height: 0.36,
    lift: 0.01,
    groundOpacity: 0.62,
    minOpacity: 0.3,
  },
};

// Both looks' textures built once at module scope — a mid-run theme swap
// never allocates, it only swaps the map and recolours.
const SHADOW_TEXTURES: Record<CharacterId, THREE.CanvasTexture> = {
  kitty: softDotTexture(),
  souls: contactShadowTexture(),
};

export function Shadow({
  world,
  characterRef,
}: {
  world: WorldState;
  characterRef: CharacterRef;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  // Mid-run theme swap: texture + tint swap imperatively. The per-frame
  // ellipse/opacity read below follows the active look automatically.
  useCharacterSwap(characterRef, (c) => {
    const look = SHADOW[c];
    const mat = matRef.current;
    if (mat) {
      mat.map = SHADOW_TEXTURES[c];
      mat.color.set(look.color);
      mat.needsUpdate = true;
    }
  });

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const look = SHADOW[characterRef.current];
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

  const look = SHADOW[characterRef.current];

  return (
    <mesh ref={meshRef} renderOrder={-2}>
      <planeGeometry />
      <meshBasicMaterial
        ref={matRef}
        map={SHADOW_TEXTURES[characterRef.current]}
        color={look.color}
        transparent
        opacity={look.groundOpacity}
        depthWrite={false}
      />
    </mesh>
  );
}
