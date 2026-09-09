import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { COLORS } from "../lib/palette";
import { terrainHeight } from "../lib/heightfield";
import { createRng } from "../lib/rng";
import { applyWind } from "./wind";
import { collectSpots } from "../lib/tree-field";

// How far per-instance crown tints wander from the palette base, and how
// dark the baked crown undersides go. The jitter is what stops the forest
// reading as clone trees at distance.
const PINE_TINT_SPREAD = 0.22;
const LEAF_HUE_SPREAD = 0.045;
const CROWN_SHADE_FLOOR = 0.66;

function trunkGeometry(height: number, topRadius: number, bottomRadius: number) {
  const g = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 6);
  g.translate(0, height / 2, 0);
  return g;
}

// Bakes a dark-root-to-bright-tip gradient into the vertex colours: the
// crown undersides sink into shadow and the tops catch the sky, which is
// the cheapest possible "form" a Lambert blob can get at this pixel size.
function bakeVerticalShade(g: THREE.BufferGeometry, floor: number) {
  g.computeBoundingBox();
  const box = g.boundingBox;
  if (!box) return g;
  const position = g.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(position.count * 3);
  const span = Math.max(box.max.y - box.min.y, 0.0001);
  for (let i = 0; i < position.count; i += 1) {
    const t = Math.min(Math.max((position.getY(i) - box.min.y) / span, 0), 1);
    const v = floor + (1 - floor) * t;
    colors[i * 3] = v;
    colors[i * 3 + 1] = v;
    colors[i * 3 + 2] = v;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
}

function pineCrownGeometry() {
  const tiers = [
    { radius: 1.55, height: 2.3, y: 2.35 },
    { radius: 1.15, height: 1.9, y: 3.6 },
    { radius: 0.78, height: 1.6, y: 4.75 },
  ];
  return bakeVerticalShade(
    mergeGeometries(
      tiers.map((tier) => {
        const cone = new THREE.ConeGeometry(tier.radius, tier.height, 7);
        cone.translate(0, tier.y, 0);
        return cone;
      }),
    ),
    CROWN_SHADE_FLOOR,
  );
}

function broadleafCrownGeometry() {
  const main = new THREE.IcosahedronGeometry(1.5, 0);
  main.scale(1.25, 0.95, 1.25);
  main.translate(0, 3.05, 0);
  const side = new THREE.IcosahedronGeometry(1.0, 0);
  side.scale(1.1, 0.9, 1.1);
  side.translate(0.75, 2.45, 0.35);
  return bakeVerticalShade(mergeGeometries([main, side]), CROWN_SHADE_FLOOR + 0.06);
}

export function Trees() {
  const spots = useMemo(collectSpots, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const pineTrunkGeo = useMemo(() => trunkGeometry(2.6, 0.09, 0.22), []);
  const pineCrownGeo = useMemo(pineCrownGeometry, []);
  const leafTrunkGeo = useMemo(() => trunkGeometry(2.05, 0.11, 0.26), []);
  const leafCrownGeo = useMemo(broadleafCrownGeometry, []);

  const trunkMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ color: COLORS.trunk }),
    [],
  );
  const pineCrownMaterial = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({
      color: COLORS.pine,
      vertexColors: true,
    });
    applyWind(m, 0.1, 5.4);
    return m;
  }, []);
  // White base + per-instance colour lets amber "autumn" trees share one
  // material (and therefore one draw call) with the green ones.
  const leafCrownMaterial = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({
      color: "#ffffff",
      vertexColors: true,
    });
    applyWind(m, 0.13, 4.2);
    return m;
  }, []);

  useEffect(() => {
    return () => {
      pineTrunkGeo.dispose();
      pineCrownGeo.dispose();
      leafTrunkGeo.dispose();
      leafCrownGeo.dispose();
      trunkMaterial.dispose();
      pineCrownMaterial.dispose();
      leafCrownMaterial.dispose();
    };
  }, [
    pineTrunkGeo,
    pineCrownGeo,
    leafTrunkGeo,
    leafCrownGeo,
    trunkMaterial,
    pineCrownMaterial,
    leafCrownMaterial,
  ]);

  const pineTrunkRef = useRef<THREE.InstancedMesh>(null);
  const pineCrownRef = useRef<THREE.InstancedMesh>(null);
  const leafTrunkRef = useRef<THREE.InstancedMesh>(null);
  const leafCrownRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const green = COLORS.leaf;
    const amber = COLORS.leafAmber;
    // Seeded per-instance tint jitter — the same forest every load, but no
    // two neighbouring trees share exactly one colour.
    const rng = createRng("evening-forest/trees/tint/v1");
    const tint = new THREE.Color();

    spots.pines.forEach((spot, i) => {
      const baseY = terrainHeight(spot.x, spot.z) - 0.12;
      dummy.position.set(spot.x, baseY, spot.z);
      dummy.rotation.set(0, spot.rotationY, 0);
      dummy.scale.setScalar(spot.scale);
      dummy.updateMatrix();
      pineTrunkRef.current?.setMatrixAt(i, dummy.matrix);
      pineCrownRef.current?.setMatrixAt(i, dummy.matrix);

      // Crown jitter multiplies the pine green: cool blue-leaning pines sit
      // next to warmer olive ones, plus a value spread for depth.
      const cool = (rng() - 0.5) * PINE_TINT_SPREAD;
      const value = 0.86 + rng() * 0.28;
      tint.setRGB(value * (1 - cool * 0.5), value, value * (1 + cool));
      pineCrownRef.current?.setColorAt(i, tint);
      const tv = 0.85 + rng() * 0.3;
      tint.setRGB(tv * (1 + (rng() - 0.5) * 0.08), tv, tv * 0.97);
      pineTrunkRef.current?.setColorAt(i, tint);
    });

    spots.broadleaf.forEach((spot, i) => {
      const baseY = terrainHeight(spot.x, spot.z) - 0.12;
      dummy.position.set(spot.x, baseY, spot.z);
      dummy.rotation.set(0, spot.rotationY, 0);
      dummy.scale.setScalar(spot.scale * (spot.amber ? 1.08 : 1));
      dummy.updateMatrix();
      leafTrunkRef.current?.setMatrixAt(i, dummy.matrix);
      leafCrownRef.current?.setMatrixAt(i, dummy.matrix);

      // Hue/saturation/value wander around the green or amber base.
      tint.copy(spot.amber ? amber : green);
      tint.offsetHSL(
        (rng() - 0.5) * LEAF_HUE_SPREAD,
        (rng() - 0.5) * 0.14,
        (rng() - 0.5) * 0.07,
      );
      leafCrownRef.current?.setColorAt(i, tint);
      const tv = 0.85 + rng() * 0.3;
      tint.setRGB(tv, tv * 0.98, tv * 0.95);
      leafTrunkRef.current?.setColorAt(i, tint);
    });

    for (const ref of [
      pineTrunkRef,
      pineCrownRef,
      leafTrunkRef,
      leafCrownRef,
    ]) {
      if (!ref.current) continue;
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) {
        ref.current.instanceColor.needsUpdate = true;
      }
      // The bounding sphere comes from the un-instanced base geometry, which
      // would make the whole forest vanish when the camera looks away from
      // one tree; disable culling and let the low draw count do the work.
      ref.current.frustumCulled = false;
    }
  }, [spots, dummy, pineTrunkRef, pineCrownRef, leafTrunkRef, leafCrownRef]);

  return (
    <group>
      <instancedMesh
        ref={pineTrunkRef}
        args={[pineTrunkGeo, trunkMaterial, spots.pines.length]}
      />
      <instancedMesh
        ref={pineCrownRef}
        args={[pineCrownGeo, pineCrownMaterial, spots.pines.length]}
      />
      <instancedMesh
        ref={leafTrunkRef}
        args={[leafTrunkGeo, trunkMaterial, spots.broadleaf.length]}
      />
      <instancedMesh
        ref={leafCrownRef}
        args={[leafCrownGeo, leafCrownMaterial, spots.broadleaf.length]}
      />
    </group>
  );
}
