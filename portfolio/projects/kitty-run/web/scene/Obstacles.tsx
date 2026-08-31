// Hazards as instanced meshes: polka-dot crates on the ground, a taller
// crate, and bobbing balloons. One draw call per kind; matrices are
// rewritten each frame from the obstacle pool. The shared crate texture is
// authored in district I's plum, so a per-district ratio-multiply on the
// three materials carries the hazard flavour through the districts
// (identity at district I, zero per-frame allocation).

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  BOX_HALF,
  HOVER_RADIUS,
  TALL_HALF,
} from "../lib/spawn.ts";
import { crateTexture } from "../lib/textures.ts";
import { BIOME_PALETTES } from "../lib/director.ts";
import type { WorldState } from "./world.ts";

const MAX_PER_KIND = 24;

// Ratio of each district's obstaclePlum to district I's — multiplying the
// crate texture's material reproduces the district colour from the one
// authored texture (ratios > 1 legally brighten, clamped at output).
const LAST_O = BIOME_PALETTES.length - 1;
const crateBase = new THREE.Color(BIOME_PALETTES[0].obstaclePlum);
const crateRatios = BIOME_PALETTES.map((p) => {
  const c = new THREE.Color(p.obstaclePlum);
  return new THREE.Color(
    c.r / Math.max(crateBase.r, 1e-4),
    c.g / Math.max(crateBase.g, 1e-4),
    c.b / Math.max(crateBase.b, 1e-4),
  );
});
const scratchCrate = new THREE.Color();

export function Obstacles({ world }: { world: WorldState }) {
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const tallRef = useRef<THREE.InstancedMesh>(null);
  const hoverRef = useRef<THREE.InstancedMesh>(null);
  const boxMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const tallMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const hoverMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const crateMap = useMemo(() => crateTexture(), []);
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

    // District mood on the hazards: one shared ratio lerp, copied onto all
    // three materials (they draw the same authored texture).
    const oi = world.biomeIndex;
    const om = world.biomeMix;
    scratchCrate.lerpColors(crateRatios[oi], crateRatios[Math.min(oi + 1, LAST_O)], om);
    boxMatRef.current?.color.copy(scratchCrate);
    tallMatRef.current?.color.copy(scratchCrate);
    hoverMatRef.current?.color.copy(scratchCrate);
  });

  return (
    <>
      <instancedMesh
        ref={boxRef}
        args={[undefined, undefined, MAX_PER_KIND]}
        frustumCulled={false}
      >
        <boxGeometry args={[BOX_HALF * 2, BOX_HALF * 2, BOX_HALF * 2]} />
        <meshBasicMaterial
          ref={(m) => {
            boxMatRef.current = m as THREE.MeshBasicMaterial | null;
          }}
          map={crateMap}
        />
      </instancedMesh>
      <instancedMesh
        ref={tallRef}
        args={[undefined, undefined, MAX_PER_KIND]}
        frustumCulled={false}
      >
        <boxGeometry args={[TALL_HALF * 2, TALL_HALF * 2, TALL_HALF * 2]} />
        <meshBasicMaterial
          ref={(m) => {
            tallMatRef.current = m as THREE.MeshBasicMaterial | null;
          }}
          map={crateMap}
        />
      </instancedMesh>
      <instancedMesh
        ref={hoverRef}
        args={[undefined, undefined, MAX_PER_KIND]}
        frustumCulled={false}
      >
        <sphereGeometry args={[HOVER_RADIUS, 20, 16]} />
        <meshBasicMaterial
          ref={(m) => {
            hoverMatRef.current = m as THREE.MeshBasicMaterial | null;
          }}
          map={crateMap}
        />
      </instancedMesh>
    </>
  );
}
