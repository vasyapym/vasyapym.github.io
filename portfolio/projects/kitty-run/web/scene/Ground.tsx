// The rolling ground: a frosting band and a luminous edge that both follow
// groundY(), over a flat body plane. The ribbons rewrite their vertex heights
// each frame from the one ground function, so the mesh the player sees is
// exactly the ground the physics samples. The three materials are
// biome-tinted in the same pass: precomputed per-district colours lerped by
// world.biomeIndex/biomeMix (identity at district I), zero per-frame
// allocation.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundY } from "../lib/ground.ts";
import { BIOME_PALETTES } from "../lib/director.ts";
import { PALETTE } from "../lib/palette.ts";
import type { WorldState } from "./world.ts";

const X_LEFT = -16;
const X_RIGHT = 26;
const COLUMNS = 160;
const BAND_THICKNESS = 0.55;
const EDGE_THICKNESS = 0.13;
const BODY_FLOOR = -7;

// Precomputed per-district ground colours + module-level scratch (the lerp
// target is reused every frame — nothing allocates in the hot path).
const LAST_G = BIOME_PALETTES.length - 1;
const groundBodyCols = BIOME_PALETTES.map((p) => new THREE.Color(p.groundBody));
const groundTopCols = BIOME_PALETTES.map((p) => new THREE.Color(p.groundTop));
const groundDotCols = BIOME_PALETTES.map((p) => new THREE.Color(p.groundDot));
const scratchGBody = new THREE.Color();
const scratchGTop = new THREE.Color();
const scratchGDot = new THREE.Color();

function ribbonGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array((COLUMNS + 1) * 2 * 3);
  const indices: number[] = [];
  for (let i = 0; i < COLUMNS; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

function updateRibbon(
  geometry: THREE.BufferGeometry,
  distance: number,
  thickness: number,
): void {
  updateRibbonSpan(geometry, distance, (top) => top - thickness);
}

// The body hangs from the same curve down to a fixed floor, so no matter
// how high the wave climbs there is never a gap for the backdrop to leak
// through.
function updateBody(geometry: THREE.BufferGeometry, distance: number): void {
  updateRibbonSpan(geometry, distance, () => BODY_FLOOR);
}

function updateRibbonSpan(
  geometry: THREE.BufferGeometry,
  distance: number,
  bottomAt: (top: number) => number,
): void {
  const attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
  const array = attribute.array as Float32Array;
  const dx = (X_RIGHT - X_LEFT) / COLUMNS;
  for (let i = 0; i <= COLUMNS; i += 1) {
    const x = X_LEFT + i * dx;
    const top = groundY(x + distance);
    const base = i * 6;
    array[base] = x;
    array[base + 1] = top;
    array[base + 3] = x;
    array[base + 4] = bottomAt(top);
  }
  attribute.needsUpdate = true;
  geometry.computeBoundingSphere();
}

export function Ground({ world }: { world: WorldState }) {
  const bandRef = useRef<THREE.Mesh>(null);
  const edgeRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  const bandGeometry = useMemo(ribbonGeometry, []);
  const edgeGeometry = useMemo(ribbonGeometry, []);
  const bodyGeometry = useMemo(ribbonGeometry, []);

  useFrame(() => {
    if (bandRef.current) updateRibbon(bandGeometry, world.distance, BAND_THICKNESS);
    if (edgeRef.current) updateRibbon(edgeGeometry, world.distance, EDGE_THICKNESS);
    if (bodyRef.current) updateBody(bodyGeometry, world.distance);

    // Biome tint: the ribbons' authored colours are district I's, so this
    // lerp is identity until the first seam. Materials are unique per mesh
    // (declared inline), so casting them out is safe.
    const gi = world.biomeIndex;
    const gm = world.biomeMix;
    scratchGBody.lerpColors(groundBodyCols[gi], groundBodyCols[Math.min(gi + 1, LAST_G)], gm);
    scratchGTop.lerpColors(groundTopCols[gi], groundTopCols[Math.min(gi + 1, LAST_G)], gm);
    scratchGDot.lerpColors(groundDotCols[gi], groundDotCols[Math.min(gi + 1, LAST_G)], gm);
    if (bodyRef.current) {
      (bodyRef.current.material as THREE.MeshBasicMaterial).color.copy(scratchGBody);
    }
    if (bandRef.current) {
      (bandRef.current.material as THREE.MeshBasicMaterial).color.copy(scratchGTop);
    }
    if (edgeRef.current) {
      (edgeRef.current.material as THREE.MeshBasicMaterial).color.copy(scratchGDot);
    }
  });

  return (
    <group>
      <mesh ref={bodyRef} geometry={bodyGeometry} position={[0, 0, -0.05]}>
        <meshBasicMaterial color={PALETTE.groundBody} />
      </mesh>
      <mesh ref={bandRef} geometry={bandGeometry}>
        <meshBasicMaterial color={PALETTE.groundTop} />
      </mesh>
      <mesh ref={edgeRef} geometry={edgeGeometry} position={[0, 0, 0.01]}>
        <meshBasicMaterial color={PALETTE.groundDot} />
      </mesh>
    </group>
  );
}
