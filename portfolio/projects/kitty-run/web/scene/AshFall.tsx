// Slow-falling ash motes for the souls mood: one instanced quad batch,
// positioned as a pure function of world time so nothing accumulates state.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createRng } from "../lib/rng.ts";
import type { CharacterId, ThemePalette } from "../lib/theme.ts";
import { softDotTexture } from "../lib/textures.ts";
import type { WorldState } from "./world.ts";

const COUNT = 60;
const SPAN = 48;
const Y_MIN = -1;
const Y_RANGE = 10;
// Motes sit close to the camera, so they take a modest share of run scroll.
const SCROLL = 0.3;

type Mote = {
  x0: number;
  y0: number;
  z: number;
  fall: number;
  sway: number;
  freq: number;
  phase: number;
  size: number;
};

function wrap(value: number, span: number): number {
  return ((value % span) + span) % span;
}

export function AshFall({
  world,
  palette,
  character,
  reducedMotion,
}: {
  world: WorldState;
  palette: ThemePalette;
  character: CharacterId;
  reducedMotion: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const map = useMemo(() => softDotTexture(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const motes = useMemo<Mote[]>(() => {
    const rng = createRng("kitty-run/ash/v1");
    return Array.from({ length: COUNT }, () => ({
      x0: rng() * SPAN,
      y0: rng() * Y_RANGE,
      z: -3 + rng() * 2,
      fall: 0.35 + rng() * 0.45,
      sway: 0.15 + rng() * 0.35,
      freq: 0.4 + rng() * 0.8,
      phase: rng() * Math.PI * 2,
      size: 0.08 + rng() * 0.1,
    }));
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Reduced motion freezes the time-driven fall/sway; the world scroll stays.
    const t = reducedMotion ? 0 : world.time;
    const scroll = world.distance * SCROLL;
    for (let i = 0; i < COUNT; i += 1) {
      const m = motes[i];
      const y = wrap(m.y0 - m.fall * t, Y_RANGE) + Y_MIN;
      const x =
        wrap(m.x0 + Math.sin(t * m.freq + m.phase) * m.sway - scroll, SPAN) -
        SPAN / 2;
      dummy.position.set(x, y, m.z);
      dummy.scale.setScalar(m.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (character !== "souls") return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      renderOrder={-4}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={map}
        color={palette.ash}
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
