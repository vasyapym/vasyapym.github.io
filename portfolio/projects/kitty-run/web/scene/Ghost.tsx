// The best-run ghost: a translucent Kitty replaying your finest hour in
// its own simulation, drawn beside you on the same track. Materials are
// dimmed once at mount; every frame only moves the group and decides
// whether it is on stage.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Kitty } from "../kitty/Kitty";
import type { WorldState } from "./world.ts";

// Beyond a screen-width the ghost is offstage anyway; the bound keeps it
// from drifting far behind on wide monitors.
const MAX_OFFSET = 9;
const GHOST_OPACITY = 0.38;

export function Ghost({
  world,
  ghost,
}: {
  world: WorldState;
  ghost: WorldState;
}) {
  const holder = useRef<THREE.Group>(null);

  useEffect(() => {
    holder.current?.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!(mesh as Partial<THREE.Mesh>).isMesh) return;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const material of materials) {
        material.transparent = true;
        material.opacity = GHOST_OPACITY;
        // No depth writes: the translucent copy never occludes the real
        // Kitty or the scenery, whatever order the sorter picks.
        material.depthWrite = false;
      }
    });
  }, []);

  useFrame(() => {
    const group = holder.current;
    if (!group) return;
    const offset = ghost.distance - world.distance;
    const onstage =
      world.status === "running" &&
      ghost.status === "running" &&
      Math.abs(offset) <= MAX_OFFSET;
    group.visible = onstage;
    if (onstage) group.position.x = offset;
  });

  return (
    <group ref={holder} position={[0, 0, -1.2]}>
      <Kitty world={ghost} />
    </group>
  );
}
