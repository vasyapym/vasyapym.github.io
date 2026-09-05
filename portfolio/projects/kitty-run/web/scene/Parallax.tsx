// Layered pastel backdrop: gradient sky with a baked sun, drifting cloud
// puffs, and two tileable hill silhouettes. Every layer scrolls at its own
// fraction of the run distance — the parallax that sells the depth.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createRng } from "../lib/rng.ts";
import { paletteFor, type CharacterId } from "../lib/theme.ts";
import { cloudTexture, hillTexture, skyTexture } from "../lib/textures.ts";
import type { WorldState } from "./world.ts";

const SPAN = 64;
const PLANE_WIDTH = SPAN;
const PLANE_HEIGHT = 9;

type CloudSpec = {
  x: number;
  y: number;
  size: number;
  z: number;
  speed: number;
  drift: number;
};

function wrap(value: number, span: number): number {
  return ((value % span) + span) % span;
}

// Two side-by-side copies of a tileable plane; the group wraps once per
// span, so coverage never shows an edge.
function ScrollingPlane(props: {
  map: THREE.Texture;
  z: number;
  y: number;
  speed: number;
  distance: number;
  opacity?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.x = -wrap(props.distance * props.speed, SPAN);
  });
  return (
    <group ref={groupRef}>
      {[0, 1].map((i) => (
        <mesh
          key={i}
          position={[i * PLANE_WIDTH, props.y, props.z]}
          renderOrder={-5}
        >
          <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
          <meshBasicMaterial
            map={props.map}
            transparent
            opacity={props.opacity ?? 1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Parallax({
  world,
  character,
}: {
  world: WorldState;
  character: CharacterId;
}) {
  // The theme is read as a prop, so a character switch rebuilds exactly
  // these textures (same seeds — same shapes, new colours).
  const palette = paletteFor(character);
  const skyMap = useMemo(() => skyTexture(palette), [palette]);
  const cloudMaps = useMemo(
    () => [0, 1, 2].map((i) => cloudTexture(`kitty-run/cloud/${i}`, palette)),
    [palette],
  );
  const farMap = useMemo(
    () => hillTexture(palette.hillFar, 5, "kitty-run/hills/far"),
    [palette],
  );
  const nearMap = useMemo(
    () => hillTexture(palette.hillNear, 4, "kitty-run/hills/near"),
    [palette],
  );

  const clouds = useMemo<CloudSpec[]>(() => {
    const rng = createRng("kitty-run/clouds/v1");
    return Array.from({ length: 8 }, () => ({
      x: rng() * SPAN,
      y: 3.4 + rng() * 4.8,
      size: 2.4 + rng() * 2.8,
      z: -6.5 - rng() * 5.5,
      speed: 0.05 + rng() * 0.1,
      drift: 0.08 + rng() * 0.14,
    }));
  }, []);
  const cloudRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    for (let i = 0; i < clouds.length; i += 1) {
      const mesh = cloudRefs.current[i];
      if (!mesh) continue;
      const spec = clouds[i];
      const value = spec.x - world.distance * spec.speed - world.time * spec.drift;
      mesh.position.x = wrap(value, SPAN) - SPAN / 2;
    }
  });

  return (
    <>
      <mesh position={[0, 4.5, -16]} renderOrder={-10}>
        <planeGeometry args={[72, 30]} />
        <meshBasicMaterial map={skyMap} depthWrite={false} />
      </mesh>

      {clouds.map((spec, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            cloudRefs.current[i] = mesh;
          }}
          position={[spec.x - SPAN / 2, spec.y, spec.z]}
          scale={spec.size}
          renderOrder={-8}
        >
          <planeGeometry args={[2, 1]} />
          <meshBasicMaterial
            map={cloudMaps[i % cloudMaps.length]}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}

      <ScrollingPlane
        map={farMap}
        z={-9}
        y={3.2}
        speed={0.22}
        distance={world.distance}
        opacity={0.85}
      />
      <ScrollingPlane
        map={nearMap}
        z={-7}
        y={2.4}
        speed={0.42}
        distance={world.distance}
      />
    </>
  );
}
