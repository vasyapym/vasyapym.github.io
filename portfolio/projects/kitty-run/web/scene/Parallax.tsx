// Layered pastel backdrop: a gradient sky (four baked district variants,
// crossfaded by biomeMix), drifting cloud puffs, two tileable hill silhouettes,
// and the moon on its own aspect-correct plane. Every scrolling layer moves at
// its own fraction of distance — the parallax that sells the depth. Biome
// tints are applied here per frame from world.biomeIndex/biomeMix: sky by
// opacity crossfade, hills/clouds by ratio-multiply (identity at district I),
// moon by a direct multiply. No per-frame allocation: scratch colours are
// module-level.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createRng } from "../lib/rng.ts";
import { PALETTE } from "../lib/palette.ts";
import { BIOME_PALETTES, type BiomeColors } from "../lib/director.ts";
import { cloudTexture, hillTexture, skyTexture, moonTexture } from "../lib/textures.ts";
import type { WorldState } from "./world.ts";

const SPAN = 64;
const PLANE_WIDTH = SPAN;
const PLANE_HEIGHT = 9;
const LAST = BIOME_PALETTES.length - 1;

function wrap(value: number, span: number): number {
  return ((value % span) + span) % span;
}

// A THREE.Color per district for a solid-colour key (direct multiply/tint).
function districtColors(key: keyof BiomeColors): THREE.Color[] {
  return BIOME_PALETTES.map((p) => new THREE.Color(p[key]));
}

// A THREE.Color per district holding the RATIO to district I for a key, so
// multiplying a district-I-authored texture reproduces the district colour
// (ratio 1 = identity; >1 legally brightens, clamped at output).
function districtRatios(key: keyof BiomeColors): THREE.Color[] {
  const base = new THREE.Color(BIOME_PALETTES[0][key]);
  return BIOME_PALETTES.map((p) => {
    const c = new THREE.Color(p[key]);
    return new THREE.Color(
      c.r / Math.max(base.r, 1e-4),
      c.g / Math.max(base.g, 1e-4),
      c.b / Math.max(base.b, 1e-4),
    );
  });
}

// Module-level scratch: reused every frame, never allocated in the loop.
const scratchHillFar = new THREE.Color();
const scratchHillNear = new THREE.Color();
const scratchCloud = new THREE.Color();
const scratchMoon = new THREE.Color();

// Lerp helper into a scratch colour across the current seam.
function tintInto(scratch: THREE.Color, arr: THREE.Color[], index: number, mix: number): void {
  scratch.lerpColors(arr[index], arr[Math.min(index + 1, LAST)], mix);
}

type CloudSpec = { x: number; y: number; size: number; z: number; speed: number; drift: number };

function ScrollingPlane(props: {
  map: THREE.Texture;
  z: number;
  y: number;
  speed: number;
  distance: number;
  opacity?: number;
  // Collects BOTH plane copies' materials by copy index — copy 1 wraps into
  // view every SPAN units, so an untinted copy would flash the wrong district
  // colour. Index-keyed so a StrictMode remount overwrites, never duplicates.
  matRefs?: (m: THREE.MeshBasicMaterial | null, copy: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.x = -wrap(props.distance * props.speed, SPAN);
  });
  return (
    <group ref={groupRef}>
      {[0, 1].map((i) => (
        <mesh key={i} position={[i * PLANE_WIDTH, props.y, props.z]} renderOrder={-5}>
          <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
          <meshBasicMaterial
            ref={(m) => {
              props.matRefs?.(m as THREE.MeshBasicMaterial | null, i);
            }}
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

export function Parallax({ world }: { world: WorldState }) {
  // Four baked sky variants (one per district), crossfaded by opacity. Variant 0
  // uses the identity defaults → byte-identical to today's sky.
  const skyMaps = useMemo(
    () => BIOME_PALETTES.map((p) => skyTexture(p.skyTop, p.skyMid, p.skyBottom)),
    [],
  );
  const skyMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const cloudMaps = useMemo(
    () => [0, 1, 2].map((i) => cloudTexture(`kitty-run/cloud/${i}`)),
    [],
  );
  // Hills authored in district-I hex (PALETTE) so the ratio-multiply is
  // identity at district I — the current look is preserved exactly.
  const farMap = useMemo(() => hillTexture(PALETTE.hillFar, 5, "kitty-run/hills/far"), []);
  const nearMap = useMemo(() => hillTexture(PALETTE.hillNear, 4, "kitty-run/hills/near"), []);
  const moonMap = useMemo(() => moonTexture(), []);

  // Precomputed per-district tint arrays (built once).
  const hillFarRatios = useMemo(() => districtRatios("hillFar"), []);
  const hillNearRatios = useMemo(() => districtRatios("hillNear"), []);
  const cloudRatios = useMemo(() => districtRatios("cloud"), []);
  const moonColors = useMemo(() => districtColors("moon"), []);

  const farMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const nearMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const moonMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const cloudMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

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
    const index = world.biomeIndex;
    const mix = world.biomeMix;

    // --- Sky crossfade: current district full, next district fades in by mix.
    for (let i = 0; i < skyMatRefs.current.length; i += 1) {
      const mat = skyMatRefs.current[i];
      if (!mat) continue;
      mat.opacity = i === index ? 1 : i === index + 1 ? mix : 0;
    }

    // --- Hills: ratio-multiply tint, both copies of each layer.
    tintInto(scratchHillFar, hillFarRatios, index, mix);
    for (const mat of farMatRefs.current) mat?.color.copy(scratchHillFar);
    tintInto(scratchHillNear, hillNearRatios, index, mix);
    for (const mat of nearMatRefs.current) mat?.color.copy(scratchHillNear);

    // --- Moon: direct multiply tint (district I = #ffffff identity).
    tintInto(scratchMoon, moonColors, index, mix);
    if (moonMatRef.current) moonMatRef.current.color.copy(scratchMoon);

    // --- Clouds: scroll + shared ratio-multiply tint.
    tintInto(scratchCloud, cloudRatios, index, mix);
    for (let i = 0; i < clouds.length; i += 1) {
      const mesh = cloudRefs.current[i];
      if (mesh) {
        const spec = clouds[i];
        const value = spec.x - world.distance * spec.speed - world.time * spec.drift;
        mesh.position.x = wrap(value, SPAN) - SPAN / 2;
      }
      const mat = cloudMatRefs.current[i];
      if (mat) mat.color.copy(scratchCloud);
    }
  });

  return (
    <>
      {/* Four sky variants stacked; opacity crossfade renders the active pair.
          renderOrder ascends so the higher-index variant draws on top. */}
      {skyMaps.map((map, i) => (
        <mesh key={i} position={[0, 4.5, -16]} renderOrder={-10 + i * 0.01}>
          <planeGeometry args={[72, 30]} />
          <meshBasicMaterial
            ref={(m) => {
              skyMatRefs.current[i] = m as THREE.MeshBasicMaterial | null;
            }}
            map={map}
            transparent
            opacity={i === 0 ? 1 : 0}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Moon: fixed position (no horizontal parallax → no wrap pop);
          aspect-correct ~3-unit disc at any viewport; tint per district
          (III brightest). */}
      <mesh position={[14, 7, -15.5]} renderOrder={-9}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial
          ref={(m) => {
            moonMatRef.current = m as THREE.MeshBasicMaterial | null;
          }}
          map={moonMap}
          transparent
          depthWrite={false}
        />
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
            ref={(m) => {
              cloudMatRefs.current[i] = m as THREE.MeshBasicMaterial | null;
            }}
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
        matRefs={(m, copy) => {
          farMatRefs.current[copy] = m;
        }}
      />
      <ScrollingPlane
        map={nearMap}
        z={-7}
        y={2.4}
        speed={0.42}
        distance={world.distance}
        matRefs={(m, copy) => {
          nearMatRefs.current[copy] = m;
        }}
      />
    </>
  );
}
