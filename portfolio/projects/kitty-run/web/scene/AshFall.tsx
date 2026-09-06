// Slow-falling ash motes for the souls mood: instanced quad batches,
// positioned as a pure function of world time so nothing accumulates state.
// Two flat opacity classes (near / far) give the air depth without blur or
// extra particles: nearer motes are sparse, larger and brighter; the far
// class is the ambient field. The sway is a smoothstep-shaped pendulum so
// motes linger at the extremes of their drift — held-breath drift, not
// uniform snow.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createRng } from "../lib/rng.ts";
import type { CharacterId, ThemePalette } from "../lib/theme.ts";
import { softDotTexture } from "../lib/textures.ts";
import type { WorldState } from "./world.ts";

const SPAN = 48;
const Y_MIN = -1;
const Y_RANGE = 10;

// The two classes. The old single batch was 60 motes at z −3..−1, opacity
// 0.4, scroll 0.3 — the tiers split that same envelope so the mean feel is
// unchanged while the depth read sharpens.
type Tier = {
  count: number;
  opacity: number;
  size: [number, number];
  fall: [number, number];
  sway: [number, number];
  freq: [number, number];
  z: [number, number];
  // Motes sit close to the camera, so they take a modest share of run
  // scroll — the near class slightly more, the far class slightly less.
  scroll: number;
};

const TIERS: Record<"far" | "near", Tier> = {
  far: {
    count: 42,
    opacity: 0.26,
    size: [0.06, 0.11],
    fall: [0.3, 0.7],
    sway: [0.2, 0.55],
    freq: [0.25, 0.75],
    z: [-3.4, -2.6],
    scroll: 0.24,
  },
  near: {
    count: 18,
    opacity: 0.5,
    size: [0.13, 0.24],
    fall: [0.42, 0.82],
    sway: [0.25, 0.6],
    freq: [0.25, 0.75],
    z: [-1.6, -0.8],
    scroll: 0.36,
  },
};

const TIER_IDS = ["far", "near"] as const;
type TierId = (typeof TIER_IDS)[number];

type Mote = {
  tier: TierId;
  // Index inside the tier's instance buffer, assigned at generation time.
  index: number;
  x0: number;
  y0: number;
  z: number;
  fall: number;
  sway: number;
  freq: number;
  phase: number;
  size: number;
  scroll: number;
};

function wrap(value: number, span: number): number {
  return ((value % span) + span) % span;
}

function between(range: [number, number], r: number): number {
  return range[0] + r * (range[1] - range[0]);
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
  const farRef = useRef<THREE.InstancedMesh>(null);
  const nearRef = useRef<THREE.InstancedMesh>(null);
  const refs = { far: farRef, near: nearRef };
  const map = useMemo(() => softDotTexture(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const motes = useMemo<Mote[]>(() => {
    const rng = createRng("kitty-run/ash/v2");
    const taken: Record<TierId, number> = { far: 0, near: 0 };
    return TIER_IDS.flatMap((tier): Mote[] =>
      Array.from({ length: TIERS[tier].count }, () => ({
        tier,
        index: taken[tier]++,
        x0: rng() * SPAN,
        y0: rng() * Y_RANGE,
        z: between(TIERS[tier].z, rng()),
        fall: between(TIERS[tier].fall, rng()),
        sway: between(TIERS[tier].sway, rng()),
        freq: between(TIERS[tier].freq, rng()),
        phase: rng() * Math.PI * 2,
        size: between(TIERS[tier].size, rng()),
        scroll: TIERS[tier].scroll,
      })),
    );
  }, []);

  useFrame(() => {
    // Reduced motion freezes the time-driven fall/sway; the world scroll
    // stays.
    const t = reducedMotion ? 0 : world.time;
    for (const mote of motes) {
      const mesh = refs[mote.tier].current;
      if (!mesh) continue;
      const u = t * mote.freq + mote.phase;
      // Pendulum eased through a smoothstep: velocity vanishes at the
      // extremes of the drift, so each mote seems to pause before turning.
      const s = 0.5 + 0.5 * Math.sin(u);
      const eased = s * s * (3 - 2 * s);
      const y = wrap(mote.y0 - mote.fall * t, Y_RANGE) + Y_MIN;
      const x =
        wrap(
          mote.x0 + (eased * 2 - 1) * mote.sway - world.distance * mote.scroll,
          SPAN,
        ) -
        SPAN / 2;
      dummy.position.set(x, y, mote.z);
      dummy.scale.setScalar(mote.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(mote.index, dummy.matrix);
    }
    for (const tier of TIER_IDS) {
      const mesh = refs[tier].current;
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    }
  });

  if (character !== "souls") return null;

  return (
    <>
      {TIER_IDS.map((tier) => (
        <instancedMesh
          key={tier}
          ref={refs[tier]}
          args={[undefined, undefined, TIERS[tier].count]}
          renderOrder={-4}
          frustumCulled={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={map}
            color={palette.ash}
            transparent
            opacity={TIERS[tier].opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </instancedMesh>
      ))}
    </>
  );
}
