import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLORS } from "../lib/palette";
import { scatterCells } from "../lib/rng";
import { terrainHeight } from "../lib/heightfield";
import { applyWind } from "./wind";

const MAX_BLADES = 3200;
const HALF_EXTENT = 62;

// One tapered blade geometry, instanced a few thousand times. A baked
// vertical gradient in the vertex colours (dark root, pale tip) plus
// per-instance tint gives cheap depth without any lighting tricks.
function bladeGeometry() {
  const g = new THREE.PlaneGeometry(0.18, 1, 1, 2);
  g.translate(0, 0.5, 0);
  const position = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    position.setX(i, position.getX(i) * Math.pow(1 - y, 1.25));
    position.setZ(i, position.getZ(i) + y * y * 0.16);
  }
  const colors = new Float32Array(position.count * 3);
  const root = COLORS.grassLow;
  const tip = COLORS.grassTip;
  for (let i = 0; i < position.count; i += 1) {
    const t = Math.pow(position.getY(i), 1.4);
    colors[i * 3] = root.r + (tip.r - root.r) * t;
    colors[i * 3 + 1] = root.g + (tip.g - root.g) * t;
    colors[i * 3 + 2] = root.b + (tip.b - root.b) * t;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export function Grass() {
  const geometry = useMemo(bladeGeometry, []);
  const material = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({
      color: "#ffffff",
      side: THREE.DoubleSide,
    });
    applyWind(m, 0.055, 1.0);
    return m;
  }, []);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const cells = scatterCells({
      seed: "evening-forest/grass/v1",
      halfExtent: HALF_EXTENT,
      minRadius: 2,
      step: 2.2,
      jitter: 1.05,
    });
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    const tip = COLORS.grassTip;
    let count = 0;
    for (const cell of cells) {
      if (count >= MAX_BLADES) break;
      if (cell.rand() > 0.82) continue;
      const x = cell.x;
      const z = cell.z;
      dummy.position.set(x, terrainHeight(x, z), z);
      dummy.rotation.set(0, cell.rand() * Math.PI, 0);
      dummy.scale.set(1, 0.5 + cell.rand() * 0.85, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(count, dummy.matrix);
      tint.copy(tip).lerp(new THREE.Color("#8a6a30"), cell.rand() * 0.35);
      mesh.setColorAt(count, tint);
      count += 1;
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, MAX_BLADES]} />
  );
}
