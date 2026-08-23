import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "../lib/palette";
import {
  TERRAIN_SIZE,
  terrainHeight,
  groundNoise,
  smoothstep,
} from "../lib/heightfield";
import { makeGrainTexture } from "../lib/textures";

// One displaced plane. Height comes from the shared heightfield; colour is
// painted per-vertex (meadow greens by altitude, dirt patches from the same
// noise field), then multiplied by a neutral grain texture for texture.
export function Terrain() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 130, 130);
    g.rotateX(-Math.PI / 2);
    const position = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);

    const low = COLORS.terrainLow;
    const mid = COLORS.terrainMid;
    const dry = COLORS.terrainDry;
    const dirt = COLORS.dirt;
    const tint = new THREE.Color();

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const h = terrainHeight(x, z);
      position.setY(i, h);

      tint.copy(low).lerp(mid, smoothstep(-2.2, 3.4, h));
      if (h > 2.6) {
        tint.lerp(dry, smoothstep(2.6, 4.6, h) * 0.65);
      }
      const n = groundNoise(x * 0.16 + 40, z * 0.16 - 17);
      tint.lerp(dirt, smoothstep(0.62, 0.82, n) * 0.55);

      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  const grain = useMemo(() => makeGrainTexture(), []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      grain.dispose();
    };
  }, [geometry, grain]);

  return (
    <mesh geometry={geometry} renderOrder={-1}>
      <meshLambertMaterial vertexColors map={grain} />
    </mesh>
  );
}
