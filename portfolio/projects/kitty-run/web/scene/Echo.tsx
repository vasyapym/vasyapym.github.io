// The best-run echo: a faded afterimage Kitty replaying your finest hour
// in its own simulation, launched once you open a small lead so the chase
// is always on screen. Materials are retinted into one soft pastel family
// and dimmed once at mount; every frame only moves the group, keeps it
// inside the visible stage span and decides whether the echo is on stage
// at all. No aura, no pulse — she reads as a watercolour memory of a run,
// not a haunting.

import { useEffect, useRef } from "react";
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
import type { WorldState } from "./world.ts";

const ECHO_OPACITY = 0.66;

// The restyle: every rig colour maps into one dusty-rose family pulled
// toward the scene's own pinks, so the copy reads as a faded print of
// Momo rather than a second one — and never as the icy specter the old
// blue-white tint made of her.
const FADED: Record<string, string> = {
  [PALETTE.furCream]: "#f9f2f6",
  [PALETTE.suitRose]: "#f0d3e0",
  [PALETTE.scarfCoral]: "#e8b8c9",
  [PALETTE.scarfDeep]: "#dca6bd",
  [PALETTE.noseBerry]: "#dba7bc",
  [PALETTE.cheek]: "#eed3de",
  // outlineInk and eyeInk share one ink hex; both map here together.
  [PALETTE.outlineInk]: "#c49cb2",
};

// When the stage clamp pins the echo next to the player (narrow phones),
// she eases back a little instead of crowding the sprite — but only to
// about half strength: the race must stay readable on any screen.
const PROXIMITY_MIN = 0.5;
const PROXIMITY_NEAR = 1.6;
const PROXIMITY_FAR = 2.9;

function proximityFactor(drawnX: number): number {
  const t = (Math.abs(drawnX) - PROXIMITY_NEAR) / (PROXIMITY_FAR - PROXIMITY_NEAR);
  return Math.min(1, Math.max(PROXIMITY_MIN, t));
}

function retint(material: THREE.Material): void {
  material.transparent = true;
  material.opacity = ECHO_OPACITY;
  // Depth writes stay ON: the parts must occlude each other or the
  // translucency stacks into see-through circles. The opaque pass has
  // already written scenery and player depth, so the echo still hides
  // cleanly behind the real Kitty wherever they overlap.
  material.depthWrite = true;
  const basic = material as THREE.MeshBasicMaterial;
  if (basic.color) {
    const mapped = FADED[`#${basic.color.getHexString()}`];
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
// particles), which is where a background afterimage belongs anyway. Pose
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
  const bodyMaterials = useRef<THREE.MeshBasicMaterial[]>([]);

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
        bodyMaterials.current.push(material as THREE.MeshBasicMaterial);
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
    // Pinned next to the player? Ease back instead of crowding the sprite.
    const presence = proximityFactor(group.position.x);
    for (const material of bodyMaterials.current) {
      material.opacity = ECHO_OPACITY * presence;
    }
  });

  return (
    <group ref={holder} position={[0, 0, -1.2]}>
      <Kitty world={echo} />
    </group>
  );
}
