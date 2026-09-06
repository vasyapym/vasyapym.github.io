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
import { THEMES, paletteFor, type CharacterId } from "../lib/theme.ts";
import { useCharacterSwap, type CharacterRef } from "./themeSwap.ts";
import type { WorldState } from "./world.ts";

const MAX_PER_KIND = 24;

// Warm lid light for the iron crates — souls only; the pastel crates keep
// their clean candy face. Per-theme record, same pattern as the pickup
// colours, so the scene never branches on theme.
const CRATE_LID: Record<CharacterId, string | null> = {
  kitty: null,
  souls: THEMES.souls.palette.cloudLit,
};

// Both crate maps built once at module scope — a mid-run theme swap never
// allocates, it only swaps the shared map on the three instanced materials.
// ?ashen=N flows through automatically: THEMES.souls carries the variant.
const CRATE_MAPS: Record<CharacterId, THREE.CanvasTexture> = {
  kitty: crateTexture(paletteFor("kitty"), { lid: CRATE_LID.kitty ?? undefined }),
  souls: crateTexture(paletteFor("souls"), { lid: CRATE_LID.souls ?? undefined, worn: true }),
};

export function Obstacles({
  world,
  characterRef,
}: {
  world: WorldState;
  characterRef: CharacterRef;
}) {
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const tallRef = useRef<THREE.InstancedMesh>(null);
  const hoverRef = useRef<THREE.InstancedMesh>(null);
  const boxMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const tallMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const hoverMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Mid-run theme swap: the shared crate map re-points imperatively.
  useCharacterSwap(characterRef, (c) => {
    const map = CRATE_MAPS[c];
    for (const mat of [boxMatRef.current, tallMatRef.current, hoverMatRef.current]) {
      if (!mat) continue;
      mat.map = map;
      mat.needsUpdate = true;
    }
  });

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
        <meshBasicMaterial ref={boxMatRef} map={CRATE_MAPS[characterRef.current]} />
      </instancedMesh>
      <instancedMesh
        ref={tallRef}
        args={[undefined, undefined, MAX_PER_KIND]}
        frustumCulled={false}
      >
        <boxGeometry args={[TALL_HALF * 2, TALL_HALF * 2, TALL_HALF * 2]} />
        <meshBasicMaterial ref={tallMatRef} map={CRATE_MAPS[characterRef.current]} />
      </instancedMesh>
      <instancedMesh
        ref={hoverRef}
        args={[undefined, undefined, MAX_PER_KIND]}
        frustumCulled={false}
      >
        <sphereGeometry args={[HOVER_RADIUS, 20, 16]} />
        <meshBasicMaterial ref={hoverMatRef} map={CRATE_MAPS[characterRef.current]} />
      </instancedMesh>
    </>
  );
}
