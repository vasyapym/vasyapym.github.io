// The best-run echo: a translucent afterimage Kitty replaying your finest
// hour in its own simulation, launched once you open a small lead so the
// chase is always on screen. Materials are retinted into one spectral
// family and dimmed once at mount; every frame only moves the group,
// keeps it inside the visible stage span, pulses the glow and decides
// whether the echo is on stage at all.

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Kitty } from "../kitty/Kitty";
import {
  clampInto,
  stageSpan,
  STAGE_AHEAD_MARGIN,
  STAGE_BEHIND_MARGIN,
} from "../lib/framing.ts";
import { PALETTE } from "../lib/palette.ts";
import { softDotTexture } from "../lib/textures.ts";
import type { WorldState } from "./world.ts";

const GHOST_OPACITY = 0.72;

// The spectral restyle: every rig colour maps into one near-white family
// with only a whisper of cool tint, so the copy reads as a chalk-white
// afterimage rather than a second Kitty — never a purple one.
const SPECTRAL: Record<string, string> = {
  [PALETTE.kittyWhite]: "#ffffff",
  [PALETTE.suitPink]: "#eef3fe",
  [PALETTE.bowRed]: "#dbe4fb",
  [PALETTE.bowDeep]: "#d0dbf9",
  [PALETTE.noseYellow]: "#f4f7ff",
  [PALETTE.cheek]: "#e9effe",
  // outlineInk and eyeInk share one ink hex; both map here together.
  [PALETTE.outlineInk]: "#a9b7de",
};

// When the stage clamp pins the echo next to the player (narrow phones),
// she thins out instead of crowding the sprite: this floor is her opacity
// at touching distance, recovering to full one-plus units away.
const PROXIMITY_MIN = 0.22;
const PROXIMITY_NEAR = 1.9;
const PROXIMITY_FAR = 3.1;

function proximityFactor(drawnX: number): number {
  const t = (Math.abs(drawnX) - PROXIMITY_NEAR) / (PROXIMITY_FAR - PROXIMITY_NEAR);
  return Math.min(1, Math.max(PROXIMITY_MIN, t));
}

function retint(material: THREE.Material): void {
  material.transparent = true;
  material.opacity = GHOST_OPACITY;
  // Depth writes stay ON: the parts must occlude each other or the
  // translucency stacks into see-through circles. The opaque pass has
  // already written scenery and player depth, so the echo still hides
  // cleanly behind the real Kitty wherever they overlap.
  material.depthWrite = true;
  const basic = material as THREE.MeshBasicMaterial;
  if (basic.color) {
    const mapped = SPECTRAL[`#${basic.color.getHexString()}`];
    if (mapped) basic.color.set(mapped);
  }
}

// Translucent materials render back-to-front by distance, and the Kitty's
// paper-thin part offsets differ by hundredths of a unit — too little for
// that sort to be trusted, so the dress could draw after the head fill,
// win the depth test and show through it. This walks the mounted rig once,
// sorts its meshes by their actual z (farthest first) and pins an explicit
// renderOrder: painter's order inside the echo, always. The base offset
// keeps the whole subtree behind every default-order transparent (glows,
// particles), which is where a background ghost belongs anyway. Pose
// animation only ever moves y or rotates around z, so the ordering computed
// here at mount stays valid for the life of the component.
function pinPainterOrder(root: THREE.Object3D): void {
  root.updateWorldMatrix(true, true);
  const meshes: { obj: THREE.Mesh; z: number }[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshes.push({ obj: mesh, z: mesh.matrixWorld.elements[14] });
  });
  meshes.sort((a, b) => a.z - b.z);
  meshes.forEach(({ obj }, index) => {
    obj.renderOrder = 10 + index;
  });
}

export function Echo({
  world,
  echo,
}: {
  world: WorldState;
  echo: WorldState;
}) {
  const holder = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const bodyMaterials = useRef<THREE.MeshBasicMaterial[]>([]);
  const glowTexture = useMemo(() => softDotTexture(), []);

  useEffect(() => {
    const group = holder.current;
    if (!group) return;
    group.traverse((obj) => {
      const mesh = obj as Partial<THREE.Mesh>;
      if (!mesh.isMesh || !mesh.material) return;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const material of materials) {
        retint(material);
        // The glow drives its own opacity every frame; everything else
        // joins the proximity fade.
        if (obj !== glow.current) {
          bodyMaterials.current.push(material as THREE.MeshBasicMaterial);
        }
      }
    });
    pinPainterOrder(group);
  }, []);

  useFrame((state) => {
    const group = holder.current;
    if (!group) return;
    // echo.time only moves once the race launches it — until then the
    // afterimage waits in the wings.
    const offset = echo.distance - world.distance;
    const onstage =
      world.status === "running" &&
      echo.status === "running" &&
      echo.time > 0 &&
      Math.abs(offset) <= 12;
    group.visible = onstage;
    if (!onstage) return;
    // The true gap is the race truth (the HUD chip reads it out); the
    // drawn position just refuses to leave the stage, so a big late-run
    // lead pins the echo to the edge instead of losing it entirely.
    const span = stageSpan(state.size.width / Math.max(1, state.size.height));
    group.position.x = clampInto(
      offset,
      span,
      offset < 0 ? STAGE_BEHIND_MARGIN : STAGE_AHEAD_MARGIN,
    );
    // Pinned next to the player? Thin out instead of crowding the sprite.
    const presence = proximityFactor(group.position.x);
    for (const material of bodyMaterials.current) {
      material.opacity = GHOST_OPACITY * presence;
    }

    const glowMesh = glow.current;
    if (glowMesh) {
      const material = glowMesh.material as THREE.MeshBasicMaterial;
      material.opacity = (0.24 + Math.sin(world.time * 3.1) * 0.07) * presence;
    }
  });

  return (
    <group ref={holder} position={[0, 0, -1.2]}>
      <mesh ref={glow} position={[0, 1.05, -0.42]} scale={[3.1, 3.5, 1]}>
        <planeGeometry />
        <meshBasicMaterial
          map={glowTexture}
          color="#c6d4f7"
          transparent
          opacity={0.26}
          depthWrite={false}
        />
      </mesh>
      <Kitty world={echo} />
    </group>
  );
}
