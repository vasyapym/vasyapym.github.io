// Pickups as instanced flat shapes: hearts, stars and heal hearts, each
// with an additive glow sprite behind it. Spin and bob come from time and
// the pickup's phase, so the field shimmers without any per-item state.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PALETTE } from "../lib/palette.ts";
import { softDotTexture } from "../lib/textures.ts";
import type { WorldState } from "./world.ts";

const MAX_PICKUPS = 48;

function heartShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -0.6);
  s.bezierCurveTo(0.58, -0.18, 0.62, 0.4, 0.3, 0.55);
  s.bezierCurveTo(0.12, 0.63, 0.01, 0.52, 0, 0.38);
  s.bezierCurveTo(-0.01, 0.52, -0.12, 0.63, -0.3, 0.55);
  s.bezierCurveTo(-0.62, 0.4, -0.58, -0.18, 0, -0.6);
  return s;
}

function starShape(): THREE.Shape {
  const s = new THREE.Shape();
  const outer = 0.55;
  const inner = 0.24;
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

const HEART_COLOR = new THREE.Color(PALETTE.heart);
const HEAL_COLOR = new THREE.Color(PALETTE.heal);
const STAR_COLOR = new THREE.Color(PALETTE.star);
const HEART_GLOW = new THREE.Color(PALETTE.heartGlow);
const STAR_GLOW = new THREE.Color(PALETTE.starGlow);

export function Pickups({ world }: { world: WorldState }) {
  const heartRef = useRef<THREE.InstancedMesh>(null);
  const starRef = useRef<THREE.InstancedMesh>(null);
  const crossRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const dotMap = useMemo(() => softDotTexture(), []);
  const heartGeo = useMemo(() => new THREE.ShapeGeometry(heartShape(), 14), []);
  const starGeo = useMemo(() => new THREE.ShapeGeometry(starShape(), 8), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    let heartCount = 0;
    let starCount = 0;
    let crossCount = 0;
    let glowCount = 0;
    const heartMesh = heartRef.current;
    const starMesh = starRef.current;
    const crossMesh = crossRef.current;
    const glowMesh = glowRef.current;

    for (const slot of world.pickups.slots) {
      if (!slot.active) continue;
      const p = slot.data;
      const vx = p.x - world.distance;
      if (vx < -18 || vx > 30) continue;

      const bob = Math.sin(world.time * 2.4 + p.phase) * 0.09;
      const spin = world.time * 2.6 + p.phase;
      const isHeart = p.kind !== "star";
      const isHeal = p.kind === "heal";
      // The big heart pulses so a heal reads as "come get me" even at a
      // glance; plain combo hearts stay steady and small.
      const scale = isHeal
        ? 0.8 + Math.sin(world.time * 4.2 + p.phase) * 0.09
        : 0.46;

      dummy.position.set(vx, p.y + bob, 0);
      dummy.rotation.set(0, spin, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();

      if (isHeart) {
        heartMesh?.setMatrixAt(heartCount, dummy.matrix);
        heartMesh?.setColorAt(
          heartCount,
          isHeal ? HEAL_COLOR : HEART_COLOR,
        );
        heartCount += 1;

        // White cross on the big heart: two bars, billboarded flat.
        if (crossMesh && isHeal) {
          dummy.position.set(vx, p.y + bob, 0.02);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          crossMesh.setMatrixAt(crossCount, dummy.matrix);
          crossCount += 1;
          dummy.rotation.set(0, 0, Math.PI / 2);
          dummy.updateMatrix();
          crossMesh.setMatrixAt(crossCount, dummy.matrix);
          crossCount += 1;
        }
      } else {
        starMesh?.setMatrixAt(starCount, dummy.matrix);
        starMesh?.setColorAt(starCount, STAR_COLOR);
        starCount += 1;
      }

      if (glowMesh) {
        dummy.position.set(vx, p.y + bob, -0.15);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(scale * (isHeal ? 4.4 : 3.6));
        dummy.updateMatrix();
        glowMesh.setMatrixAt(glowCount, dummy.matrix);
        glowMesh.setColorAt(
          glowCount,
          p.kind === "star" ? STAR_GLOW : HEART_GLOW,
        );
        glowCount += 1;
      }
    }

    if (heartMesh) {
      heartMesh.count = heartCount;
      heartMesh.instanceMatrix.needsUpdate = true;
      if (heartMesh.instanceColor) heartMesh.instanceColor.needsUpdate = true;
    }
    if (starMesh) {
      starMesh.count = starCount;
      starMesh.instanceMatrix.needsUpdate = true;
      if (starMesh.instanceColor) starMesh.instanceColor.needsUpdate = true;
    }
    if (crossMesh) {
      crossMesh.count = crossCount;
      crossMesh.instanceMatrix.needsUpdate = true;
    }
    if (glowMesh) {
      glowMesh.count = glowCount;
      glowMesh.instanceMatrix.needsUpdate = true;
      if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh
        ref={heartRef}
        args={[heartGeo, undefined, MAX_PICKUPS]}
        frustumCulled={false}
      >
        <meshBasicMaterial side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh
        ref={starRef}
        args={[starGeo, undefined, MAX_PICKUPS]}
        frustumCulled={false}
      >
        <meshBasicMaterial side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh
        ref={crossRef}
        args={[undefined, undefined, MAX_PICKUPS * 2]}
        frustumCulled={false}
      >
        <planeGeometry args={[0.66, 0.19]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh
        ref={glowRef}
        args={[undefined, undefined, MAX_PICKUPS]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={dotMap}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </>
  );
}
