import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "../lib/palette";
import { scatterCells } from "../lib/rng";
import { terrainHeight } from "../lib/heightfield";
import { playerPositionUniform } from "../lib/clock";
import { applyWind } from "./wind";

const MAX_BLADES = 3200;
const HALF_EXTENT = 62;
// The meadow is one square tile that teleports in whole-period steps, always
// snapped around the walker. Same baked layout every tile, heights resampled
// from the heightfield, so grass exists wherever you stand.
const TILE = HALF_EXTENT * 2;

type Blade = {
  lx: number;
  lz: number;
  rotY: number;
  scaleY: number;
  tint: THREE.Color;
};

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

  // Blade layouts are decided once (seeded, deterministic) so every tile
  // plants an identical meadow — repetition the eye never catches.
  const blades = useMemo<Blade[]>(() => {
    const cells = scatterCells({
      seed: "evening-forest/grass/v1",
      halfExtent: HALF_EXTENT,
      minRadius: 0,
      step: 2.2,
      jitter: 1.05,
    });
    const list: Blade[] = [];
    const tint = new THREE.Color();
    const tip = COLORS.grassTip;
    const dry = new THREE.Color("#8a6a30");
    for (const cell of cells) {
      if (list.length >= MAX_BLADES) break;
      if (cell.rand() > 0.82) continue;
      tint.copy(tip).lerp(dry, cell.rand() * 0.35);
      list.push({
        lx: cell.x,
        lz: cell.z,
        rotY: cell.rand() * Math.PI,
        scaleY: 0.5 + cell.rand() * 0.85,
        tint: tint.clone(),
      });
    }
    return list;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tileRef = useRef<{ x: number; z: number } | null>(null);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const plantTile = (tileX: number, tileZ: number) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    let count = 0;
    for (const blade of blades) {
      const x = blade.lx + tileX;
      const z = blade.lz + tileZ;
      dummy.position.set(x, terrainHeight(x, z), z);
      dummy.rotation.set(0, blade.rotY, 0);
      dummy.scale.set(1, blade.scaleY, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(count, dummy.matrix);
      mesh.setColorAt(count, blade.tint);
      count += 1;
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  };

  useLayoutEffect(() => {
    tileRef.current = { x: 0, z: 0 };
    plantTile(0, 0);
    // Blades depend on nothing but their seeded layout; planting runs again
    // from useFrame whenever the walker crosses into a new tile.
  }, [blades, dummy]);

  useFrame(() => {
    const p = playerPositionUniform.value;
    const tileX = Math.round(p.x / TILE) * TILE;
    const tileZ = Math.round(p.z / TILE) * TILE;
    const current = tileRef.current;
    if (!current || current.x !== tileX || current.z !== tileZ) {
      tileRef.current = { x: tileX, z: tileZ };
      plantTile(tileX, tileZ);
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, MAX_BLADES]} />
  );
}
