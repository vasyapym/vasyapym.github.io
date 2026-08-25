// The best-run ghost: a translucent spirit Kitty replaying your finest
// hour in its own simulation, launched a beat after you so the race is
// always on screen. Materials are retinted into one spectral family and
// dimmed once at mount; every frame only moves the group, pulses the
// glow and decides whether the spirit is on stage.

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Kitty } from "../kitty/Kitty";
import { PALETTE } from "../lib/palette.ts";
import { softDotTexture } from "../lib/textures.ts";
import type { WorldState } from "./world.ts";

// Beyond a screen-width the ghost is offstage anyway; the bound keeps it
// from drifting far behind on wide monitors.
const MAX_OFFSET = 9;
const GHOST_OPACITY = 0.55;

// The spectral restyle: every rig colour maps into one blue-violet
// family, so the copy reads as a spirit rather than a second Kitty.
const SPECTRAL: Record<string, string> = {
  [PALETTE.kittyWhite]: "#d9e4fb",
  [PALETTE.suitPink]: "#b7c6f2",
  [PALETTE.bowRed]: "#93a9e8",
  [PALETTE.bowDeep]: "#8397de",
  [PALETTE.noseYellow]: "#c3d2f7",
  [PALETTE.cheek]: "#bccbf5",
  // outlineInk and eyeInk share one ink hex; both map here together.
  [PALETTE.outlineInk]: "#46548c",
};

function retint(material: THREE.Material): void {
  material.transparent = true;
  material.opacity = GHOST_OPACITY;
  // Depth writes stay ON: the parts must occlude each other or the
  // translucency stacks into see-through circles. The opaque pass has
  // already written scenery and player depth, so the spirit still hides
  // cleanly behind the real Kitty wherever they overlap.
  material.depthWrite = true;
  const basic = material as THREE.MeshBasicMaterial;
  if (basic.color) {
    const mapped = SPECTRAL[`#${basic.color.getHexString()}`];
    if (mapped) basic.color.set(mapped);
  }
}

export function Ghost({
  world,
  ghost,
}: {
  world: WorldState;
  ghost: WorldState;
}) {
  const holder = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const glowTexture = useMemo(() => softDotTexture(), []);

  useEffect(() => {
    holder.current?.traverse((obj) => {
      const mesh = obj as Partial<THREE.Mesh>;
      if (!mesh.isMesh || !mesh.material) return;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const material of materials) retint(material);
    });
  }, []);

  useFrame(() => {
    const group = holder.current;
    if (!group) return;
    // ghost.time only moves once the race launches it — until then the
    // spirit waits in the wings.
    const offset = ghost.distance - world.distance;
    const onstage =
      world.status === "running" &&
      ghost.status === "running" &&
      ghost.time > 0 &&
      Math.abs(offset) <= MAX_OFFSET;
    group.visible = onstage;
    if (!onstage) return;
    group.position.x = offset;

    const glowMesh = glow.current;
    if (glowMesh) {
      const material = glowMesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.24 + Math.sin(world.time * 3.1) * 0.07;
    }
  });

  return (
    <group ref={holder} position={[0, 0, -1.2]}>
      <mesh ref={glow} position={[0, 1.05, -0.42]} scale={[3.1, 3.5, 1]}>
        <planeGeometry />
        <meshBasicMaterial
          map={glowTexture}
          color="#93a9e8"
          transparent
          opacity={0.26}
          depthWrite={false}
        />
      </mesh>
      <Kitty world={ghost} />
    </group>
  );
}
