// Hazards as instanced meshes: polka-dot crates on the ground, a taller
// crate, and bobbing balloons. One draw call per kind; matrices are
// rewritten each frame from the obstacle pool.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  BOX_HALF,
  HOVER_RADIUS,
  TALL_HALF,
} from "../lib/spawn.ts";
import { crateTexture } from "../lib/textures.ts";
import { paletteFor, type CharacterId } from "../lib/theme.ts";
import type { WorldState } from "./world.ts";

const MAX_PER_KIND = 24;

export function Obstacles({
  world,
  character,
}: {
  world: WorldState;
  character: CharacterId;
}) {
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const tallRef = useRef<THREE.InstancedMesh>(null);
  const hoverRef = useRef<THREE.InstancedMesh>(null);
  const crateMap = useMemo(() => crateTexture(paletteFor(character)), [character]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    let boxCount = 0;
    let tallCount = 0;
    let hoverCount = 0;
    for (const slot of world.obstacles.slots) {
      if (!slot.active) continue;
      const o = slot.data;
      const vx = o.x - world.distance;
      if (vx < -18 || vx > 30) continue;

      if (o.kind === "box") {
        dummy.position.set(vx, o.y, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        boxRef.current?.setMatrixAt(boxCount++, dummy.matrix);
      } else if (o.kind === "tall") {
        dummy.position.set(vx, o.y, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        tallRef.current?.setMatrixAt(tallCount++, dummy.matrix);
      } else {
        const bob = Math.sin(world.time * 2 + o.x * 1.7) * 0.12;
        dummy.position.set(vx, o.y + bob, 0);
        dummy.rotation.set(0, 0, Math.sin(world.time * 1.3 + o.x) * 0.08);
        dummy.scale.set(1, 1.15, 1);
        dummy.updateMatrix();
        hoverRef.current?.setMatrixAt(hoverCount++, dummy.matrix);
      }
    }
    if (boxRef.current) {
      boxRef.current.count = boxCount;
      boxRef.current.instanceMatrix.needsUpdate = true;
    }
    if (tallRef.current) {
      tallRef.current.count = tallCount;
      tallRef.current.instanceMatrix.needsUpdate = true;
    }
    if (hoverRef.current) {
      hoverRef.current.count = hoverCount;
      hoverRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh
        ref={boxRef}
        args={[undefined, undefined, MAX_PER_KIND]}
        frustumCulled={false}
      >
        <boxGeometry args={[BOX_HALF * 2, BOX_HALF * 2, BOX_HALF * 2]} />
        <meshBasicMaterial map={crateMap} />
      </instancedMesh>
      <instancedMesh
        ref={tallRef}
        args={[undefined, undefined, MAX_PER_KIND]}
        frustumCulled={false}
      >
        <boxGeometry args={[TALL_HALF * 2, TALL_HALF * 2, TALL_HALF * 2]} />
        <meshBasicMaterial map={crateMap} />
      </instancedMesh>
      <instancedMesh
        ref={hoverRef}
        args={[undefined, undefined, MAX_PER_KIND]}
        frustumCulled={false}
      >
        <sphereGeometry args={[HOVER_RADIUS, 20, 16]} />
        <meshBasicMaterial map={crateMap} />
      </instancedMesh>
    </>
  );
}
