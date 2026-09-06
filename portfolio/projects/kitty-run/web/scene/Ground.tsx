// The rolling ground: a white frosting edge and a pink band that both
// follow groundY(), over a flat body plane. The ribbons rewrite their
// vertex heights each frame from the one ground function, so the mesh the
// player sees is exactly the ground the physics samples.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundY } from "../lib/ground.ts";
import { stoneJointTexture } from "../lib/textures.ts";
import { paletteFor, type CharacterId } from "../lib/theme.ts";
import { useCharacterSwap, type CharacterRef } from "./themeSwap.ts";
import type { WorldState } from "./world.ts";

const X_LEFT = -16;
const X_RIGHT = 26;
const COLUMNS = 160;
const BAND_THICKNESS = 0.55;
const EDGE_THICKNESS = 0.13;
const BODY_FLOOR = -7;

// Weathered stone (souls only). One tile spans STONE_TILE world units; the
// span/tile ratio sets repeat.x so the pattern is world-scaled, and the
// per-frame offset scrolls it in lock-step with the terrain. Built once at
// module scope — a mid-run swap only re-points the shared maps. Pastel keeps
// null (no map), so its ground stays byte-identical.
const STONE_TILE = 3.5;
const WORLD_SPAN = X_RIGHT - X_LEFT;

function buildStone(fill: string, joint: string, courses: number): THREE.CanvasTexture {
  const tex = stoneJointTexture(fill, joint, courses);
  tex.repeat.set(WORLD_SPAN / STONE_TILE, 1);
  return tex;
}

const STONE_MAPS: Record<
  CharacterId,
  { band: THREE.CanvasTexture | null; body: THREE.CanvasTexture | null }
> = {
  kitty: { band: null, body: null },
  souls: {
    // band: one surface course; body: darker, 3 courses of quarried face.
    band: buildStone(paletteFor("souls").groundTop, paletteFor("souls").pathEdge, 1),
    body: buildStone(paletteFor("souls").groundBody, paletteFor("souls").obstacleDeep, 3),
  },
};

function ribbonGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array((COLUMNS + 1) * 2 * 3);
  // UVs: u runs 0..1 across the columns (world span), v runs 0 (bottom
  // vertex) .. 1 (top vertex) across the ribbon thickness. Static — only the
  // vertex heights are rewritten per frame, never the UVs.
  const uvs = new Float32Array((COLUMNS + 1) * 2 * 2);
  const indices: number[] = [];
  for (let i = 0; i <= COLUMNS; i += 1) {
    const u = i / COLUMNS;
    const j = i * 4;
    uvs[j] = u; // top vertex u
    uvs[j + 1] = 1; // top vertex v
    uvs[j + 2] = u; // bottom vertex u
    uvs[j + 3] = 0; // bottom vertex v
  }
  for (let i = 0; i < COLUMNS; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

function updateRibbon(
  geometry: THREE.BufferGeometry,
  distance: number,
  thickness: number,
): void {
  updateRibbonSpan(geometry, distance, (top) => top - thickness);
}

// The body hangs from the same curve down to a fixed floor, so no matter
// how high the wave climbs there is never a gap for the backdrop to leak
// through.
function updateBody(geometry: THREE.BufferGeometry, distance: number): void {
  updateRibbonSpan(geometry, distance, () => BODY_FLOOR);
}

function updateRibbonSpan(
  geometry: THREE.BufferGeometry,
  distance: number,
  bottomAt: (top: number) => number,
): void {
  const attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
  const array = attribute.array as Float32Array;
  const dx = (X_RIGHT - X_LEFT) / COLUMNS;
  for (let i = 0; i <= COLUMNS; i += 1) {
    const x = X_LEFT + i * dx;
    const top = groundY(x + distance);
    const base = i * 6;
    array[base] = x;
    array[base + 1] = top;
    array[base + 3] = x;
    array[base + 4] = bottomAt(top);
  }
  attribute.needsUpdate = true;
  geometry.computeBoundingSphere();
}

export function Ground({
  world,
  characterRef,
}: {
  world: WorldState;
  characterRef: CharacterRef;
}) {
  const bodyMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const bandMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const edgeMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Mid-run theme swap: recolour AND re-point the stone maps. Where a map is
  // present (souls) the material carries white so the baked palette shows at
  // full value; where it's null (kitty) the flat palette colour renders as
  // before. needsUpdate fires only here, never per frame.
  useCharacterSwap(characterRef, (c) => {
    const p = paletteFor(c);
    const stone = STONE_MAPS[c];
    if (bodyMatRef.current) {
      bodyMatRef.current.color.set(stone.body ? "#ffffff" : p.groundBody);
      bodyMatRef.current.map = stone.body;
      bodyMatRef.current.needsUpdate = true;
    }
    if (bandMatRef.current) {
      bandMatRef.current.color.set(stone.band ? "#ffffff" : p.groundTop);
      bandMatRef.current.map = stone.band;
      bandMatRef.current.needsUpdate = true;
    }
    if (edgeMatRef.current) edgeMatRef.current.color.set(p.groundDot);
  });

  const bandRef = useRef<THREE.Mesh>(null);
  const edgeRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  const bandGeometry = useMemo(ribbonGeometry, []);
  const edgeGeometry = useMemo(ribbonGeometry, []);
  const bodyGeometry = useMemo(ribbonGeometry, []);

  useFrame(() => {
    if (bandRef.current) updateRibbon(bandGeometry, world.distance, BAND_THICKNESS);
    if (edgeRef.current) updateRibbon(edgeGeometry, world.distance, EDGE_THICKNESS);
    if (bodyRef.current) updateBody(bodyGeometry, world.distance);

    // Stone scroll (souls only; kitty maps are null). offset is in texture
    // units and one tile = STONE_TILE world units, so distance/STONE_TILE
    // moves the joints in lock-step with the terrain; %1 keeps float
    // precision bounded. No allocation, no needsUpdate (matrixAutoUpdate).
    const scroll = (world.distance / STONE_TILE) % 1;
    if (bandMatRef.current?.map) bandMatRef.current.map.offset.x = scroll;
    if (bodyMatRef.current?.map) bodyMatRef.current.map.offset.x = scroll;
  });

  return (
    <group>
      <mesh ref={bodyRef} geometry={bodyGeometry} position={[0, 0, -0.05]}>
        <meshBasicMaterial
          ref={bodyMatRef}
          color={
            STONE_MAPS[characterRef.current].body
              ? "#ffffff"
              : paletteFor(characterRef.current).groundBody
          }
          map={STONE_MAPS[characterRef.current].body ?? undefined}
        />
      </mesh>
      <mesh ref={bandRef} geometry={bandGeometry}>
        <meshBasicMaterial
          ref={bandMatRef}
          color={
            STONE_MAPS[characterRef.current].band
              ? "#ffffff"
              : paletteFor(characterRef.current).groundTop
          }
          map={STONE_MAPS[characterRef.current].band ?? undefined}
        />
      </mesh>
      <mesh ref={edgeRef} geometry={edgeGeometry} position={[0, 0, 0.01]}>
        <meshBasicMaterial
          ref={edgeMatRef}
          color={paletteFor(characterRef.current).groundDot}
        />
      </mesh>
    </group>
  );
}
