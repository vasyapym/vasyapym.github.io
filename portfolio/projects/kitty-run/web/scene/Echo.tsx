// The best-run echo: a faded afterimage Kitty replaying your finest hour
// in its own simulation, launched once you open a small lead so the chase
// is always on screen. She reads as a watercolour memory of a run, not a
// haunting — no aura, no pulse.
//
// The rig itself is opaque, but drawing it directly would fade every part
// against every part behind it, so the head goes see-through over the
// torso. Instead the rig lives on its own render layer, hidden from the
// main camera, and is composited once per frame into an offscreen target;
// a single screen-aligned quad then draws that capture faded exactly once.
// Every screen pixel shows only the nearest rig surface, so there is no
// interior alpha stacking anywhere (head over torso, bow over head), while
// translucency against the real scene is preserved by the quad's blend.

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Kitty } from "../kitty/Kitty";
import {
  clampInto,
  stageSpan,
  STAGE_AHEAD_MARGIN,
  STAGE_BEHIND_MARGIN,
} from "../lib/framing.ts";
import { PALETTE } from "../lib/palette.ts";
import { THEMES, type CharacterId } from "../lib/theme.ts";
import type { WorldState } from "./world.ts";

const SOULS_P = THEMES.souls.palette;


const ECHO_OPACITY = 0.66;
// The holder's z: the quad reconstructs a fullscreen plane at this depth,
// and the RT capture is sized to fill the frustum here.
const ECHO_Z = -1.2;
// The rig-only layer: the main camera never draws it; a dedicated RT camera
// draws nothing else.
const RIG_LAYER = 1;

// The restyle: every rig colour maps into one faded family pulled toward
// the scene's own mood, so the copy reads as a watercolour print of the
// character rather than a second one. The kitty map lands in the dusty-rose
// family; the souls map lands in ash memory — desaturated warm greys,
// never icy blue. Keys are the rig's own hexes, so a map only ever matches
// the theme it was built for.
const FADED: Record<CharacterId, Record<string, string>> = {
  kitty: {
    [PALETTE.kittyWhite]: "#f9f2f6",
    [PALETTE.suitPink]: "#f0d3e0",
    [PALETTE.bowRed]: "#e3b3c7",
    [PALETTE.bowDeep]: "#dca6bd",
    [PALETTE.noseYellow]: "#f1e4d4",
    [PALETTE.cheek]: "#eed3de",
    // outlineInk and eyeInk share one ink hex; both map here together.
    [PALETTE.outlineInk]: "#c49cb2",
  },
  souls: {
    [SOULS_P.kittyWhite]: "#eae4dc",
    [SOULS_P.suitPink]: "#cbb9ad",
    [SOULS_P.bowRed]: "#b8ada4",
    [SOULS_P.bowDeep]: "#ab9f96",
    [SOULS_P.noseYellow]: "#d9c9b8",
    [SOULS_P.cheek]: "#d6c6bb",
    [SOULS_P.outlineInk]: "#9a8f86",
  },
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

// Only the colour is retinted here. The rig MUST stay opaque: the offscreen
// target's own depth buffer resolves head-over-body occlusion, and the
// single fade happens later on the composite quad — any per-part opacity
// would drag the interior alpha stacking straight back in.
function retint(material: THREE.Material, map: Record<string, string>): void {
  const basic = material as THREE.MeshBasicMaterial;
  if (basic.color) {
    const mapped = map[`#${basic.color.getHexString()}`];
    if (mapped) basic.color.set(mapped);
  }
}

export function Echo({
  world,
  echo,
  character,
}: {
  world: WorldState;
  echo: WorldState;
  character: CharacterId;
}) {
  const holder = useRef<THREE.Group>(null);
  const rig = useRef<THREE.Group>(null);
  const quad = useRef<THREE.Mesh>(null);

  const { gl, scene, camera, size, viewport } = useThree();

  // Offscreen target the rig composites into. sRGB so the faded pastels
  // round-trip through the renderer (sRGB output, tone mapping off).
  const rt = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: true,
      stencilBuffer: false,
    });
    target.texture.colorSpace = THREE.SRGBColorSpace;
    return target;
  }, []);

  // A camera that only ever sees the rig layer; its transform + projection
  // are mirrored from the main camera each frame (fov animates) so the
  // capture lands pixel-for-pixel where the rig would otherwise draw.
  const rtCamera = useMemo(() => {
    const cam = new THREE.PerspectiveCamera();
    cam.layers.set(RIG_LAYER);
    return cam;
  }, []);

  const quadGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const quadMaterial = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      map: rt.texture,
      transparent: true,
      depthWrite: false,
      // Keep depthTest so the real Kitty and any nearer scenery still occlude
      // the echo where they overlap.
      depthTest: true,
      toneMapped: false,
    });
    m.opacity = ECHO_OPACITY;
    return m;
  }, [rt]);

  // Scratch colour for saving/restoring the renderer's clear state without
  // allocating per frame.
  const clearColor = useMemo(() => new THREE.Color(), []);
  // Scratch vector for the per-frame quad placement.
  const camDir = useMemo(() => new THREE.Vector3(), []);

  // The main camera is shared with the composer (and its animated fov); it
  // must never draw the rig directly — the echo only ever reaches the screen
  // through the composite quad.
  useEffect(() => {
    camera.layers.disable(RIG_LAYER);
  }, [camera]);

  // Retint once per character and move the whole rig subtree onto the
  // rig-only layer so the main camera skips it and the RT camera captures
  // it alone. The rig is keyed by character, so a switch builds fresh
  // materials and this pass re-maps them into the new faded family.
  useEffect(() => {
    const group = rig.current;
    if (!group) return;
    const map = FADED[character];
    group.traverse((obj) => {
      obj.layers.set(RIG_LAYER);
      const mesh = obj as Partial<THREE.Mesh>;
      if (!mesh.isMesh || !mesh.material) return;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const material of materials) retint(material, map);
    });
  }, [character]);

  // Keep the RT at framebuffer resolution as the viewport / dpr change.
  useEffect(() => {
    rt.setSize(
      Math.max(1, Math.round(size.width * viewport.dpr)),
      Math.max(1, Math.round(size.height * viewport.dpr)),
    );
  }, [rt, size.width, size.height, viewport.dpr]);

  useEffect(() => {
    return () => {
      rt.dispose();
      quadGeometry.dispose();
      quadMaterial.dispose();
    };
  }, [rt, quadGeometry, quadMaterial]);

  useFrame((state) => {
    const group = holder.current;
    const mesh = quad.current;
    if (!group || !mesh) return;

    // echo.time only moves once the race launches it — until then the
    // afterimage waits in the wings.
    const offset = echo.distance - world.distance;
    const onstage =
      world.status === "running" &&
      echo.status === "running" &&
      echo.time > 0 &&
      Math.abs(offset) <= 12;

    mesh.visible = onstage;
    if (!onstage) return;

    // Chase clamp (unchanged): the true gap is race truth (the HUD reads it),
    // the drawn position just refuses to leave the stage. This moves the RIG
    // (a child of the group), so the captured echo slides across the RT while
    // the display quad stays pinned to the screen.
    const span = stageSpan(state.size.width / Math.max(1, state.size.height));
    group.position.x = clampInto(
      offset,
      span,
      offset < 0 ? STAGE_BEHIND_MARGIN : STAGE_AHEAD_MARGIN,
    );

    // Pinned next to the player? Ease back instead of crowding the sprite —
    // now applied once, to the composite quad.
    const presence = proximityFactor(group.position.x);
    quadMaterial.opacity = ECHO_OPACITY * presence;

    // Mirror the main camera so the capture aligns. copy() overwrites the
    // layer mask, so re-pin the rig-only layer AFTER the whole-object copy;
    // recursive=false to avoid cloning any camera children.
    const cam = state.camera as THREE.PerspectiveCamera;
    rtCamera.copy(cam, false);
    rtCamera.layers.set(RIG_LAYER);

    // Screen-locked quad. The camera is NOT axis-aligned — it yaws toward
    // the run-ahead side and pitches down, and its fov breathes with dash
    // and bullet time — so a z-perpendicular plane would show the capture
    // keystone-shifted. Emulate a camera child instead: park the quad on the
    // view axis at the echo depth with the camera's own orientation. An
    // image-parallel plane fed the same camera's capture displays it 1:1 at
    // any distance, so the echo lands exactly where the rig would have
    // drawn. Holder-local because the mesh hangs under the moving holder.
    const dist = cam.position.z - ECHO_Z;
    cam.getWorldDirection(camDir);
    mesh.position
      .copy(cam.position)
      .addScaledVector(camDir, dist)
      .sub(group.position);
    mesh.quaternion.copy(cam.quaternion);
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * dist;
    mesh.scale.set(height * cam.aspect, height, 1);

    // Single-composite pass: draw the opaque rig into the RT on a transparent
    // clear. The renderer's own clear alpha is 1, so without forcing alpha 0
    // the quad would become an opaque sky-coloured rectangle. Restore the
    // clear state afterwards so the main/composer render is untouched.
    gl.getClearColor(clearColor);
    const prevAlpha = gl.getClearAlpha();
    gl.setClearColor(clearColor, 0);
    gl.setRenderTarget(rt);
    gl.clear();
    gl.render(scene, rtCamera);
    gl.setRenderTarget(null);
    gl.setClearColor(clearColor, prevAlpha);
  });

  return (
    <group ref={holder} position={[0, 0, ECHO_Z]}>
      <group ref={rig}>
        <Kitty key={character} world={echo} character={character} />
      </group>
      <mesh
        ref={quad}
        geometry={quadGeometry}
        material={quadMaterial}
        frustumCulled={false}
      />
    </group>
  );
}
