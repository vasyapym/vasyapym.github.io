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

// Cool moss that pools in the hollows — the low ground reads shaded and
// damp instead of just "darker green", which keeps night's blue fog honest.
const MOSS_HEX = "#33523f";
// Strength of the large-scale HSL mottle that breaks the altitude ramp.
const MOTTLE = 0.1;

// One displaced plane. Height comes from the shared heightfield; colour is
// painted per-vertex (meadow greens by altitude, moss in the hollows, dirt
// patches and a broad mottle from the same noise field), then multiplied by
// a neutral grain texture for texture.
export function Terrain() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 224, 224);
    g.rotateX(-Math.PI / 2);
    const position = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);

    const low = COLORS.terrainLow;
    const mid = COLORS.terrainMid;
    const dry = COLORS.terrainDry;
    const dirt = COLORS.dirt;
    const moss = new THREE.Color(MOSS_HEX);
    const tint = new THREE.Color();

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const h = terrainHeight(x, z);
      position.setY(i, h);

      tint.copy(low).lerp(mid, smoothstep(-2.2, 3.4, h));
      // Hollows go cool and mossy; tops go dry and warm — a temperature
      // ramp the split-tone grade later amplifies.
      tint.lerp(moss, (1 - smoothstep(-2.6, -0.4, h)) * 0.4);
      if (h > 2.6) {
        tint.lerp(dry, smoothstep(2.6, 4.6, h) * 0.65);
      }
      const n = groundNoise(x * 0.16 + 40, z * 0.16 - 17);
      tint.lerp(dirt, smoothstep(0.62, 0.82, n) * 0.55);

      // Broad low-frequency mottle: nudges hue/sat/value in ~20m patches so
      // the smooth altitude ramp shatters into readable dither shapes
      // instead of banding to mud at 6 quantisation levels.
      const m = groundNoise(x * 0.05 + 80, z * 0.05 - 44);
      tint.offsetHSL(
        (m - 0.5) * MOTTLE * 0.2,
        (m - 0.5) * MOTTLE,
        (m - 0.5) * MOTTLE * 0.5,
      );

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
