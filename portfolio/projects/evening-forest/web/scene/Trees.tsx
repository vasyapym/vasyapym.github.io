import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { COLORS } from "../lib/palette";
import { scatterCells } from "../lib/rng";
import { terrainHeight } from "../lib/heightfield";
import { applyWind } from "./wind";

const HALF_EXTENT = 84;
const MIN_RADIUS = 11;

type TreeSpot = {
  x: number;
  z: number;
  rotationY: number;
  scale: number;
  amber: boolean;
};

function collectSpots(): { pines: TreeSpot[]; broadleaf: TreeSpot[] } {
  const pines: TreeSpot[] = [];
  const broadleaf: TreeSpot[] = [];
  const cells = scatterCells({
    seed: "evening-forest/trees/v1",
    halfExtent: HALF_EXTENT,
    minRadius: MIN_RADIUS,
    step: 6.4,
    jitter: 2.7,
  });
  for (const cell of cells) {
    const roll = cell.rand();
    // Density thins toward the foggy rim so the edge dissolves instead of
    // stopping; the spawn clearing stays open.
    const density = cell.r > 72 ? 0.34 : cell.r < 20 ? 0.5 : 0.62;
    if (roll > density) continue;
    const spot: TreeSpot = {
      x: cell.x,
      z: cell.z,
      rotationY: cell.rand() * Math.PI * 2,
      scale: 0.8 + cell.rand() * 0.55,
      amber: cell.rand() < 0.18,
    };
    if (roll < density * 0.58) {
      pines.push(spot);
    } else {
      broadleaf.push(spot);
    }
  }
  return { pines, broadleaf };
}

function trunkGeometry(height: number, topRadius: number, bottomRadius: number) {
  const g = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 6);
  g.translate(0, height / 2, 0);
  return g;
}

function pineCrownGeometry() {
  const tiers = [
    { radius: 1.55, height: 2.3, y: 2.35 },
    { radius: 1.15, height: 1.9, y: 3.6 },
    { radius: 0.78, height: 1.6, y: 4.75 },
  ];
  return mergeGeometries(
    tiers.map((tier) => {
      const cone = new THREE.ConeGeometry(tier.radius, tier.height, 7);
      cone.translate(0, tier.y, 0);
      return cone;
    }),
  );
}

function broadleafCrownGeometry() {
  const main = new THREE.IcosahedronGeometry(1.5, 0);
  main.scale(1.25, 0.95, 1.25);
  main.translate(0, 3.05, 0);
  const side = new THREE.IcosahedronGeometry(1.0, 0);
  side.scale(1.1, 0.9, 1.1);
  side.translate(0.75, 2.45, 0.35);
  return mergeGeometries([main, side]);
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
    const m = new THREE.MeshLambertMaterial({ color: COLORS.pine });
    applyWind(m, 0.1, 5.4);
    return m;
  }, []);
  // White base + per-instance colour lets amber "autumn" trees share one
  // material (and therefore one draw call) with the green ones.
  const leafCrownMaterial = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({ color: "#ffffff" });
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

    spots.pines.forEach((spot, i) => {
      const baseY = terrainHeight(spot.x, spot.z) - 0.12;
      dummy.position.set(spot.x, baseY, spot.z);
      dummy.rotation.set(0, spot.rotationY, 0);
      dummy.scale.setScalar(spot.scale);
      dummy.updateMatrix();
      pineTrunkRef.current?.setMatrixAt(i, dummy.matrix);
      pineCrownRef.current?.setMatrixAt(i, dummy.matrix);
    });

    spots.broadleaf.forEach((spot, i) => {
      const baseY = terrainHeight(spot.x, spot.z) - 0.12;
      dummy.position.set(spot.x, baseY, spot.z);
      dummy.rotation.set(0, spot.rotationY, 0);
      dummy.scale.setScalar(spot.scale * (spot.amber ? 1.08 : 1));
      dummy.updateMatrix();
      leafTrunkRef.current?.setMatrixAt(i, dummy.matrix);
      leafCrownRef.current?.setMatrixAt(i, dummy.matrix);
      leafCrownRef.current?.setColorAt(i, spot.amber ? amber : green);
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
