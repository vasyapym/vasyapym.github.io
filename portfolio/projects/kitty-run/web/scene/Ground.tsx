// The rolling ground: a white frosting edge and a pink band that both
// follow groundY(), over a flat body plane. The ribbons rewrite their
// vertex heights each frame from the one ground function, so the mesh the
// player sees is exactly the ground the physics samples.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundY } from "../lib/ground.ts";
import { PALETTE } from "../lib/palette.ts";
import type { WorldState } from "./world.ts";

const X_LEFT = -16;
const X_RIGHT = 26;
const COLUMNS = 160;
const BAND_THICKNESS = 0.55;
const EDGE_THICKNESS = 0.13;
const BODY_FLOOR = -7;

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
