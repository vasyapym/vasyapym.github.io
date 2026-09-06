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
import {
  KNIGHT_VARIANTS,
  type KnightVariantId,
} from "../lib/knightVariants.tsx";
import { THEMES, type CharacterId } from "../lib/theme.ts";
import type { CharacterRef } from "./themeSwap.ts";
import type { WorldState } from "./world.ts";

const SOULS_P = THEMES.souls.palette;


const ECHO_OPACITY = 0.66;
// The holder's z: the quad reconstructs a fullscreen plane at this depth,
// and the RT capture is sized to fill the frustum here.
const ECHO_Z = -1.2;
// The rig-only layers: the main camera never draws either; the dedicated RT
// camera draws exactly one of them per frame. Two layers (not one + visibility)
// guarantee only the ACTIVE ghost is captured, with no dependency on useFrame
// ordering against the capture pass.
const RIG_LAYER_KITTY = 1;
const RIG_LAYER_SOULS = 2;

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
    [SOULS_P.kittyWhite]: "#e4e0d8", // dimmed cold bone
    [SOULS_P.suitPink]: "#8f8b85", // cold ash cloth
    [SOULS_P.suitDeep]: "#5e5b57", // deep cold cloth
    [SOULS_P.bowRed]: "#8c8f94", // cold steel
    [SOULS_P.bowDeep]: "#5d6065", // dark cold steel
    [SOULS_P.noseYellow]: "#c6905a", // faded ember — the one surviving warmth
    [SOULS_P.cheek]: "#9ea19f", // cold neutral
    [SOULS_P.outlineInk]: "#3e4043", // ink lifted, cold
    // The sun-rim plates (and now the pauldron rim + seam-family) join the
    // ash-memory family; unmapped, the fringe would glow full-strength.
    [SOULS_P.cloudLit]: "#9ba1a8", // cold rim memory
    // SOULS_MATERIAL literals mirrored as raw hex — previously ABSENT, so the
    // ghost rendered the brow occlusion and blade fuller at full strength.
    "#26292d": "#3a3d41", // SOULS_MATERIAL.steelShadow → faded cold occlusion
    "#a9b0ba": "#9297a0", // SOULS_MATERIAL.bladeFuller → faded cold fuller
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
  characterRef,
  knight = null,
}: {
  world: WorldState;
  echo: WorldState;
  characterRef: CharacterRef;
  // The costume variant (round 47c): per-page-load stable, mirrors the
  // player's rig so the ghost wears the same costume concept.
  knight?: KnightVariantId | null;
}) {
  const holder = useRef<THREE.Group>(null);
  const rigKitty = useRef<THREE.Group>(null);
  const rigSouls = useRef<THREE.Group>(null);
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

  // A camera that only ever sees the active ghost rig's layer; its transform
  // + projection are mirrored from the main camera each frame (fov animates)
  // so the capture lands pixel-for-pixel where the rig would otherwise draw.
  // The initial layer is re-pinned every frame before the capture.
  const rtCamera = useMemo(() => {
    const cam = new THREE.PerspectiveCamera();
    cam.layers.set(RIG_LAYER_KITTY);
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
  // must never draw the rigs directly — the echo only ever reaches the screen
  // through the composite quad.
  useEffect(() => {
    camera.layers.disable(RIG_LAYER_KITTY);
    camera.layers.disable(RIG_LAYER_SOULS);
  }, [camera]);

  // Both ghost rigs are dual-mounted with FIXED characters (their internal
  // memos never rebuild); each rig is walked ONCE at mount to join its own
  // render layer and take its own faded family — the FADED map is keyed by
  // hex, so the ?ashen variant palette flows through automatically. Both
  // rigs stay opaque; the single ECHO_OPACITY fade still happens on the
  // composite quad.
  useEffect(() => {
    const assign = (
      group: THREE.Group | null,
      layer: number,
      map: Record<string, string>,
    ): void => {
      if (!group) return;
      group.traverse((obj) => {
        obj.layers.set(layer);
        const mesh = obj as Partial<THREE.Mesh>;
        if (!mesh.isMesh || !mesh.material) return;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        for (const material of materials) retint(material, map);
      });
    };
    assign(rigKitty.current, RIG_LAYER_KITTY, FADED.kitty);
    // The variant's own literal hexes merge over the souls base map (a
    // variant with no new literals merges as a no-op).
    const soulsFaded =
      knight && KNIGHT_VARIANTS[knight]?.faded
        ? { ...FADED.souls, ...KNIGHT_VARIANTS[knight].faded }
        : FADED.souls;
    assign(rigSouls.current, RIG_LAYER_SOULS, soulsFaded);
  }, []);

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
    // layer mask, so re-pin the active rig-only layer AFTER the whole-object
    // copy; recursive=false to avoid cloning any camera children. Only the
    // ACTIVE ghost's layer is captured — the other rig is invisible to this
    // camera no matter what order the frame callbacks ran in.
    const cam = state.camera as THREE.PerspectiveCamera;
    rtCamera.copy(cam, false);
    rtCamera.layers.set(
      characterRef.current === "souls" ? RIG_LAYER_SOULS : RIG_LAYER_KITTY,
    );

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
      <group ref={rigKitty}>
        <Kitty world={echo} character="kitty" />
      </group>
      <group ref={rigSouls}>
        <Kitty world={echo} character="souls" knight={knight} />
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
