// The procedural cat hero: flat vector shapes (THREE.ShapeGeometry)
// layered with an inverted-hull style ink outline behind each fill, posed
// every frame from the pure rig. React renders the parts once; useFrame
// writes transforms directly.
//
// Two bodies share the one rig. The pastel kitty wears the bow; the ashen
// knight wears a great helm (visor + ember eyes), pauldrons, a two-layer
// cape and a greatsword over the shoulder, all built from the same palette
// keys (bowRed/bowDeep are steel in her palette), so the best-run ghost
// can still retint her by hex lookup.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PALETTE } from "../lib/palette.ts";
import { paletteFor, type CharacterId } from "../lib/theme.ts";
import { computePose } from "./rig.ts";
import type { WorldState } from "../scene/world.ts";

const ROOT_SCALE = 0.72;

// Souls spaulder damping: the plates ride the arm pivot, but steel that
// sways a full ±0.5 rad reads distracting. useFrame counter-rotates the
// spaulder groups by this share of the arm swing, leaving a net −0.3·swing
// nod (~0.15 rad grounded) — enough that the plates visibly belong to the
// shoulder, small enough that the tucked lame never clears the arm
// silhouette at the top of the swing.
const PAULDRON_DAMP = 0.7;

// Souls-only wear shading, drawn INSIDE existing silhouettes (character
// law: same rig, material only). Values sit one step from the host fill
// toward the ink, hard-edged — no gradients. The pastel cat never renders
// these. The blade fuller is palette-keyed (palette.bowDeep) and the one
// specular chip uses palette.kittyWhite, so steelShadow is the only literal
// left here — mirrored as raw hex in the ghost retint.
const SOULS_MATERIAL = {
  steelShadow: "#26292d",
} as const;

function ellipseShape(rx: number, ry: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  return shape;
}

function earShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.28, 0);
  shape.quadraticCurveTo(-0.36, 0.3, -0.12, 0.47);
  shape.quadraticCurveTo(0, 0.54, 0.12, 0.47);
  shape.quadraticCurveTo(0.36, 0.3, 0.28, 0);
  shape.closePath();
  return shape;
}

function dressShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 1.06);
  shape.lineTo(0.5, 1.06);
  shape.quadraticCurveTo(0.68, 0.6, 0.62, 0.2);
  shape.quadraticCurveTo(0, 0.06, -0.62, 0.2);
  shape.quadraticCurveTo(-0.68, 0.6, -0.5, 1.06);
  shape.closePath();
  return shape;
}

function rectShape(w: number, h: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(w / 2, h / 2);
  shape.lineTo(-w / 2, h / 2);
  shape.closePath();
  return shape;
}

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2;
  const hh = h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  shape.closePath();
  return shape;
}

// --- souls-only shapes -----------------------------------------------
// Wide/flat pieces take a `pad` so their ink copy can be authored with an
// even margin instead of grown by uniform scale (which starves the short
// axis and fattens the long one).

// Ogival great-helm dome. Crown raised to yt 0.52 (was 0.42) and the side
// curves made steep: the flank runs almost vertical to (0.70, 0.24) and then
// converges on a narrow apex through a control point held 0.04 under the
// top, so the crown reads as a pointed steel skull rather than a rounded
// cap. Same pad behaviour as before, so the ink (0.035) and sun-rim (0.05)
// copies follow the new contour automatically. Base width unchanged
// (x0 0.92, widest ~0.98) — it still sits inside the head's rx 1.0.
function helmDomeShape(pad = 0): THREE.Shape {
  const x0 = 0.92 + pad;
  const yb = -0.36 - pad;
  const yt = 0.52 + pad;
  const shape = new THREE.Shape();
  shape.moveTo(-x0, yb);
  shape.quadraticCurveTo(-1.0 - pad, 0.0, -0.7 - pad * 0.6, 0.24 + pad * 0.8);
  shape.quadraticCurveTo(-0.34 - pad * 0.3, yt - 0.04, 0, yt);
  shape.quadraticCurveTo(0.34 + pad * 0.3, yt - 0.04, 0.7 + pad * 0.6, 0.24 + pad * 0.8);
  shape.quadraticCurveTo(1.0 + pad, 0.0, x0, yb);
  shape.quadraticCurveTo(0, yb - 0.05, -x0, yb);
  shape.closePath();
  return shape;
}

// Comb ridge. Narrow (max width 0.12 <= 0.13) and tall: base tucked at
// -0.30 (inside the dome, so the lower part reads as the comb's front
// profile on the steel), rising to 0.76 crest-local = 0.34 above the new
// dome apex. The tip sweeps back (toward -x, away from the sun side) so
// the silhouette has direction; the front face stays straight and the
// back edge returns straight, keeping it a hard flat-vector shape.
function helmCrestShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.055, -0.3);
  shape.lineTo(0.055, -0.3);
  shape.lineTo(0.06, 0.3);
  shape.quadraticCurveTo(0.02, 0.76, -0.1, 0.74);
  shape.lineTo(-0.065, 0.3);
  shape.closePath();
  return shape;
}

// Brow reinforcement ridge: a shallow 1.3-wide arched band, 0.07 thick
// (~2.3 world-px at game scale — the thinnest detail that survives the
// 55 px head). Painted cloudLit on the dome's lower front, directly above
// the visor seam, so the seam becomes a hard light/dark step: ridge above,
// steelShadow brow band below.
function helmBrowShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.65, -0.035);
  shape.quadraticCurveTo(0, 0.02, 0.65, -0.035);
  shape.lineTo(0.65, 0.035);
  shape.quadraticCurveTo(0, 0.09, -0.65, 0.035);
  shape.closePath();
  return shape;
}

function beltShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.56, -0.06);
  shape.quadraticCurveTo(0, -0.1, 0.56, -0.06);
  shape.lineTo(0.56, 0.06);
  shape.quadraticCurveTo(0, 0.02, -0.56, 0.06);
  shape.closePath();
  return shape;
}

// Capes are authored with the shoulder line at y +0.36 so the same offset
// hangs both layers from the pivot group; the hem trails to -x (she runs
// right). Centre hem points stay above y -0.3 so a forward sway can never
// reach the feet.
function capeBackShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.46, 0.36);
  shape.lineTo(0.46, 0.36);
  shape.quadraticCurveTo(0.52, 0.0, 0.42, -0.26);
  shape.lineTo(0.12, -0.14);
  shape.lineTo(-0.2, -0.3);
  shape.lineTo(-0.5, -0.22);
  shape.lineTo(-1.0, -0.46);
  shape.quadraticCurveTo(-1.02, 0.02, -0.46, 0.36);
  shape.closePath();
  return shape;
}

function capeFrontShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.4, 0.36);
  shape.lineTo(0.4, 0.36);
  shape.quadraticCurveTo(0.44, 0.02, 0.34, -0.18);
  shape.lineTo(0.06, -0.08);
  shape.lineTo(-0.22, -0.26);
  shape.lineTo(-0.48, -0.16);
  shape.lineTo(-0.8, -0.34);
  shape.quadraticCurveTo(-0.84, 0.04, -0.4, 0.36);
  shape.closePath();
  return shape;
}

// A thin wedge hugging the trailing hem tip's upper edge, inside the front
// cape's silhouette: the fold where the cloth turns away from the sun.
// Thicker at the shoulder side, thinning toward the tip.
function capeFoldShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.46, -0.13);
  shape.lineTo(-0.78, -0.3);
  shape.lineTo(-0.74, -0.2);
  shape.lineTo(-0.48, -0.09);
  shape.closePath();
  return shape;
}

// souls pauldron: a deep lens that WRAPS the upper arm (was a shallow cap
// beside the neck). Narrower than before (w 0.24 vs 0.27) and twice as
// deep (+0.16 / -0.16): the top arc covers the arm's top curve and the
// tunic's shoulder corner, the bottom arc bellies down over the arm's
// roundness (apex at -0.20). pad feeds the ink copy exactly as before.
function pauldronShape(pad = 0): THREE.Shape {
  const w = 0.24 + pad;
  const top = 0.16 + pad;
  const bot = -0.16 - pad;
  const shape = new THREE.Shape();
  shape.moveTo(-w, bot);
  shape.quadraticCurveTo(-w - 0.03, top, 0, top);
  shape.quadraticCurveTo(w + 0.03, top, w, bot);
  shape.quadraticCurveTo(0, bot - 0.08, -w, bot);
  shape.closePath();
  return shape;
}

// souls material overlay shapes (drawn INSIDE existing silhouettes) --------
// A thin arc on the pauldron's TOP curve — the sun catching the steel.
// Re-fitted to the deeper lens: the sides now fall away faster, so the arc
// is narrower (w 0.15, host edge at x 0.15 is y ~0.122, arc ends at 0.11)
// and its crest sits 0.03 under the plate's top (0.16). Band ~0.04 thick.
function pauldronRimShape(): THREE.Shape {
  const w = 0.15;
  const top = 0.16;
  const shape = new THREE.Shape();
  shape.moveTo(-w, top - 0.05);
  shape.quadraticCurveTo(0, top - 0.01, w, top - 0.05);
  shape.quadraticCurveTo(0, top - 0.095, -w, top - 0.05);
  shape.closePath();
  return shape;
}

// A hard crescent hugging the pauldron's LOWER rim (arm shading under steel).
// Re-fitted: endpoints 0.03 inside the new corners (w 0.21 < 0.24), lower
// arc apex at -0.19 (host apex -0.20, 0.01 inside), upper arc apex -0.145.
function pauldronShadowShape(): THREE.Shape {
  const w = 0.21;
  const bot = -0.16;
  const shape = new THREE.Shape();
  shape.moveTo(-w, bot);
  shape.quadraticCurveTo(0, bot - 0.06, w, bot);
  shape.quadraticCurveTo(0, bot + 0.03, -w, bot);
  shape.closePath();
  return shape;
}

// Second lame: a 0.30 x 0.09 rounded band (r 0.02) authored in the plate's
// local frame, so it shares the plate's mesh offset. Its top edge (-0.18)
// sits ABOVE the plate's bottom curve across its whole span (plate edge is
// -0.184 at x 0.15, -0.20 at center), so it tucks under the plate with no
// gap in y; ~0.04-0.05 of it shows below the plate's ink halo (-0.23 at
// center, -0.218 at x 0.15). Narrower than the plate (0.30 vs 0.48).
function pauldronLameShape(): THREE.Shape {
  const w = 0.15;
  const top = -0.18;
  const bot = -0.27;
  const r = 0.02;
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, top);
  shape.lineTo(w - r, top);
  shape.quadraticCurveTo(w, top, w, top - r);
  shape.lineTo(w, bot + r);
  shape.quadraticCurveTo(w, bot, w - r, bot);
  shape.lineTo(-w + r, bot);
  shape.quadraticCurveTo(-w, bot, -w, bot + r);
  shape.lineTo(-w, top - r);
  shape.quadraticCurveTo(-w, top, -w + r, top);
  shape.closePath();
  return shape;
}

// A thin band along the tunic bottom hem (cloth weight); stays inside the
// dress silhouette (dress hem dips to y 0.06 at centre, 0.2 at the sides).
function tunicHemShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.6, 0.2);
  shape.quadraticCurveTo(0, 0.06, 0.6, 0.2);
  shape.quadraticCurveTo(0, 0.125, -0.6, 0.2);
  shape.closePath();
  return shape;
}

function bladeShape(hw: number, len: number): THREE.Shape {
  const h = len / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -h);
  shape.lineTo(hw, -h);
  shape.lineTo(hw, h - 0.36);
  shape.quadraticCurveTo(hw * 0.5, h - 0.12, 0, h);
  shape.quadraticCurveTo(-hw * 0.5, h - 0.12, -hw, h - 0.36);
  shape.closePath();
  return shape;
}

type PartProps = {
  geometry: THREE.ShapeGeometry;
  color: string;
  z: number;
  position?: [number, number];
  rotation?: number;
  scale?: number;
  outline?: number;
  outlineColor?: string;
  // Explicit padded ink shape for long/thin parts; used at scale 1.
  inkGeometry?: THREE.ShapeGeometry;
};

// One silhouette part: an ink copy slightly grown behind the fill reads as
// a crisp uniform outline at any resolution. The z gap between the copy and
// the fill is generous on purpose — thin offsets z-fight on mobile depth
// buffers and the character turns see-through.
function Part({
  geometry,
  color,
  z,
  position,
  rotation,
  scale = 1,
  outline = 0,
  outlineColor,
  inkGeometry,
}: PartProps) {
  const ink = outlineColor ?? PALETTE.outlineInk;
  const hasInk = outline > 0 || inkGeometry !== undefined;
  return (
    <>
      {hasInk && (
        <mesh
          geometry={inkGeometry ?? geometry}
          position={position ? [position[0], position[1], z - 0.03] : [0, 0, z - 0.03]}
          rotation={[0, 0, rotation ?? 0]}
          scale={inkGeometry ? scale : scale * outline}
        >
          <meshBasicMaterial color={ink} />
        </mesh>
      )}
      <mesh
        geometry={geometry}
        position={position ? [position[0], position[1], z] : [0, 0, z]}
        rotation={[0, 0, rotation ?? 0]}
        scale={scale}
      >
        <meshBasicMaterial color={color} />
      </mesh>
    </>
  );
}

export function Kitty({
  world,
  character,
}: {
  world: WorldState;
  character: CharacterId;
}) {
  const palette = paletteFor(character);
  const isSouls = character !== "kitty";
  const rootRef = useRef<THREE.Group>(null);
  const squashRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Group>(null);
  const earRRef = useRef<THREE.Group>(null);
  const bowRef = useRef<THREE.Group>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);
  const footLRef = useRef<THREE.Group>(null);
  const footRRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  // souls: spaulder groups get their own refs so useFrame can counter-rotate
  // most of the arm swing they inherit (see the damping block in useFrame).
  const pauldronLRef = useRef<THREE.Group>(null);
  const pauldronRRef = useRef<THREE.Group>(null);
  const capeBackRef = useRef<THREE.Group>(null);
  const capeFrontRef = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const seg = 20;
    return {
      head: new THREE.ShapeGeometry(ellipseShape(1.0, 0.84), seg),
      ear: new THREE.ShapeGeometry(earShape(), seg),
      eye: new THREE.ShapeGeometry(ellipseShape(0.085, 0.135), seg),
      nose: new THREE.ShapeGeometry(ellipseShape(0.13, 0.1), seg),
      cheek: new THREE.ShapeGeometry(ellipseShape(0.14, 0.09), seg),
      whisker: new THREE.PlaneGeometry(0.36, 0.032),
      bowLoop: new THREE.ShapeGeometry(ellipseShape(0.34, 0.24), seg),
      bowKnot: new THREE.ShapeGeometry(ellipseShape(0.16, 0.16), seg),
      dress: new THREE.ShapeGeometry(dressShape(), seg),
      foot: new THREE.ShapeGeometry(ellipseShape(0.11, 0.085), seg),
      arm: new THREE.ShapeGeometry(ellipseShape(0.12, 0.2), seg),
      // souls kit
      helmDome: new THREE.ShapeGeometry(helmDomeShape(), seg),
      helmDomeInk: new THREE.ShapeGeometry(helmDomeShape(0.035), seg),
      // Rim plate: the dome contour padded past the ink, for the sun-side
      // back-plate fringe (see the souls head block).
      helmDomeRim: new THREE.ShapeGeometry(helmDomeShape(0.05), seg),
      helmCrest: new THREE.ShapeGeometry(helmCrestShape(), seg),
      helmBrow: new THREE.ShapeGeometry(helmBrowShape(), seg),
      visorPlate: new THREE.ShapeGeometry(roundedRectShape(1.5, 0.46, 0.18), seg),
      visorPlateInk: new THREE.ShapeGeometry(roundedRectShape(1.56, 0.52, 0.21), seg),
      visorSlit: new THREE.ShapeGeometry(rectShape(1.16, 0.11), seg),
      ember: new THREE.ShapeGeometry(ellipseShape(0.085, 0.04), seg),
      capeBack: new THREE.ShapeGeometry(capeBackShape(), seg),
      capeFront: new THREE.ShapeGeometry(capeFrontShape(), seg),
      pauldron: new THREE.ShapeGeometry(pauldronShape(), seg),
      pauldronInk: new THREE.ShapeGeometry(pauldronShape(0.03), seg),
      blade: new THREE.ShapeGeometry(bladeShape(0.085, 2.5), seg),
      bladeInk: new THREE.ShapeGeometry(bladeShape(0.115, 2.56), seg),
      grip: new THREE.ShapeGeometry(roundedRectShape(0.1, 0.46, 0.03), seg),
      gripInk: new THREE.ShapeGeometry(roundedRectShape(0.16, 0.52, 0.05), seg),
      guard: new THREE.ShapeGeometry(roundedRectShape(0.5, 0.1, 0.04), seg),
      guardInk: new THREE.ShapeGeometry(roundedRectShape(0.56, 0.16, 0.06), seg),
      pommel: new THREE.ShapeGeometry(ellipseShape(0.1, 0.09), seg),
      belt: new THREE.ShapeGeometry(beltShape(), seg),
      buckle: new THREE.ShapeGeometry(rectShape(0.14, 0.14), seg),
      // souls material overlays (drawn inside existing silhouettes)
      chip: new THREE.ShapeGeometry(rectShape(0.18, 0.05), seg),
      fuller: new THREE.ShapeGeometry(rectShape(0.032, 1.6), seg),
      bladeEdge: new THREE.ShapeGeometry(rectShape(0.026, 1.5), seg),
      capeFold: new THREE.ShapeGeometry(capeFoldShape(), seg),
      pauldronRim: new THREE.ShapeGeometry(pauldronRimShape(), seg),
      pauldronShadow: new THREE.ShapeGeometry(pauldronShadowShape(), seg),
      // souls: descending lame under the pauldron, rides the arm pivot.
      pauldronLame: new THREE.ShapeGeometry(pauldronLameShape(), seg),
      tunicHem: new THREE.ShapeGeometry(tunicHemShape(), seg),
    };
  }, []);

  useFrame(() => {
    const k = world.kitty;
    const pose = computePose({
      runPhase: k.runPhase,
      grounded: k.grounded,
      vy: k.vy,
      squash: k.squash,
      blinkShut: k.blinkShut,
      dashT: k.dashT,
      happyT: k.happyT,
      invulnT: k.invulnT,
      now: world.time,
    });
    if (!rootRef.current || !squashRef.current || !tiltRef.current) return;
    rootRef.current.position.y = k.y;
    rootRef.current.visible = pose.visible;
    squashRef.current.position.y = pose.bobY;
    squashRef.current.scale.set(pose.scaleX, pose.scaleY, 1);
    tiltRef.current.rotation.z = pose.tilt;
    if (headRef.current) {
      headRef.current.position.y = 1.5 + pose.headBobY;
      headRef.current.rotation.z = pose.headRot;
    }
    if (earLRef.current) earLRef.current.rotation.z = -0.35 + pose.earL;
    if (earRRef.current) earRRef.current.rotation.z = 0.35 + pose.earR;
    if (bowRef.current) {
      bowRef.current.rotation.z = pose.bowRot;
      bowRef.current.scale.setScalar(pose.bowScale);
    }
    if (eyeLRef.current) eyeLRef.current.scale.y = pose.eyeScaleY;
    if (eyeRRef.current) eyeRRef.current.scale.y = pose.eyeScaleY;
    if (footLRef.current && footRRef.current) {
      if (k.grounded) {
        const step = Math.sin(k.runPhase);
        footLRef.current.position.y = 0.1 + Math.max(0, step) * 0.07;
        footRRef.current.position.y = 0.1 + Math.max(0, -step) * 0.07;
      } else {
        footLRef.current.position.y = 0.16;
        footRRef.current.position.y = 0.16;
      }
    }
    if (armLRef.current) armLRef.current.rotation.z = -pose.armSwing;
    if (armRRef.current) armRRef.current.rotation.z = pose.armSwing;
    // Spaulder damping (PAULDRON_DAMP, module scope): each plate keeps a net
    // ±0.3·swing nod. Sign flips with the pivot: the left arm rotates by
    // −armSwing (counter +0.7·swing), the right by +armSwing (counter −0.7).
    if (pauldronLRef.current) pauldronLRef.current.rotation.z = pose.armSwing * PAULDRON_DAMP;
    if (pauldronRRef.current) pauldronRRef.current.rotation.z = -pose.armSwing * PAULDRON_DAMP;

    // Cape (souls only; refs are null on the pastel branch). The hem trails
    // to -x, so a *negative* z rotation about the shoulder pivot lifts it
    // up and back. Sway alternates between the layers; falling billows,
    // rising drags; a dash kicks it out flat behind her.
    if (capeBackRef.current && capeFrontRef.current) {
      const sway = Math.sin(k.runPhase) * 0.07;
      const lift = k.grounded
        ? 0
        : 0.1 + THREE.MathUtils.clamp(-k.vy * 0.02, -0.2, 0.2);
      const dash = k.dashT > 0 ? Math.min(1, k.dashT * 8) * 0.45 : 0;
      const base = lift + dash;
      capeBackRef.current.rotation.z = -THREE.MathUtils.clamp(
        base + sway,
        -0.08,
        0.75,
      );
      capeFrontRef.current.rotation.z = -THREE.MathUtils.clamp(
        base * 0.85 - sway * 0.8,
        -0.08,
        0.75,
      );
    }
  });

  return (
    <group ref={rootRef} scale={ROOT_SCALE}>
      <group ref={squashRef}>
        <group ref={tiltRef}>
          {/* souls: two-layer tattered cape hung from the shoulder line.
              z ladder (body): cape back ink -0.11 / fill -0.08, cape front
              ink -0.05 / fill -0.02 — everything else in the body sits at
              ≥ 0.00, and the hem never reaches the feet's x range. */}
          {isSouls && (
            <>
              <group ref={capeBackRef} position={[0, 1.0, 0]}>
                <Part
                  geometry={geo.capeBack}
                  color={palette.suitDeep}
                  z={-0.08}
                  position={[0, -0.36]}
                  outline={1.045}
                  outlineColor={palette.outlineInk}
                />
              </group>
              <group ref={capeFrontRef} position={[0, 1.0, 0]}>
                <Part
                  geometry={geo.capeFront}
                  color={palette.suitPink}
                  z={-0.02}
                  position={[0, -0.36]}
                  outline={1.05}
                  outlineColor={palette.outlineInk}
                />
                {/* Fold shadow: the hem tip turning away from the sun —
                    a wedge one step darker (the back cape's value) just
                    above the front fill, tapering toward the tip. */}
                <mesh geometry={geo.capeFold} position={[0, -0.36, 0]}>
                  <meshBasicMaterial color={palette.suitDeep} />
                </mesh>
              </group>
            </>
          )}

          {/* feet peek below the dress hem */}
          <group ref={footLRef} position={[-0.18, 0.1, 0.03]}>
            <Part
              geometry={geo.foot}
              color={palette.kittyWhite}
              z={0}
              outline={1.15}
              outlineColor={palette.outlineInk}
            />
          </group>
          <group ref={footRRef} position={[0.18, 0.1, 0.03]}>
            <Part
              geometry={geo.foot}
              color={palette.kittyWhite}
              z={0}
              outline={1.15}
              outlineColor={palette.outlineInk}
            />
          </group>

          {/* souls: greatsword over the right shoulder. Authored vertical
              (blade +y, origin at the crossguard) and rotated so the blade
              runs up-left behind the head and only the tip clears its
              silhouette; grip/pommel show past the right arm. Sword z:
              blade+grip ink 0.01 / fill 0.04, fuller + edge-light 0.06
              (inside the blade, non-overlapping in x), guard+pommel ink 0.07 /
              fill 0.10 — below the arm ink (0.13) and clear of the dress
              footprint, so the dress ladder is untouched. */}
          {isSouls && (
            <group position={[0.75, 1.18, 0]} rotation={[0, 0, 1.0]}>
              <Part
                geometry={geo.blade}
                inkGeometry={geo.bladeInk}
                color={palette.cloudLit}
                z={0.04}
                position={[0, 1.27]}
                outlineColor={palette.outlineInk}
              />
              {/* Fuller: the recessed groove down the blade's centre — worn
                  metal in shadow, two value steps from the cloudLit fill
                  toward ink. Inside the blade's own silhouette, clear of the
                  tip curve and guard. */}
              <mesh geometry={geo.fuller} position={[0, 1.28, 0.06]}>
                <meshBasicMaterial color={palette.bowDeep} />
              </mesh>
              {/* Edge light: a thin kittyWhite line down the blade's
                  sun-facing (+x) edge — worn steel catching the dying light,
                  now correctly the brightest value on the tarnished
                  cloudLit steel (the old sunCore fill crossed the bloom
                  threshold and glowed). Inside the blade silhouette
                  (x 0.052, blade hw 0.085), clear of the fuller (x 0, no xy
                  overlap) and the tip curve. z 0.06, between the blade fill
                  (0.04) and the arm ink (0.13). */}
              <mesh geometry={geo.bladeEdge} position={[0.052, 1.28, 0.06]}>
                <meshBasicMaterial color={palette.kittyWhite} />
              </mesh>
              <Part
                geometry={geo.grip}
                inkGeometry={geo.gripInk}
                color={palette.suitDeep}
                z={0.04}
                position={[0, -0.25]}
                outlineColor={palette.outlineInk}
              />
              <Part
                geometry={geo.guard}
                inkGeometry={geo.guardInk}
                color={palette.bowRed}
                z={0.1}
                outlineColor={palette.outlineInk}
              />
              <Part
                geometry={geo.pommel}
                color={palette.bowRed}
                z={0.1}
                position={[0, -0.5]}
                outline={1.3}
                outlineColor={palette.outlineInk}
              />
            </group>
          )}

          {/* souls: sun rim, right contour. A flat cloudLit back-plate one
              gap behind the whole rig: the body masks it everywhere except
              where a right-facing edge lets a thin fringe poke past the ink.
              Tunic plate at z -0.15 (cape back ink -0.11, gap 0.04) reads on
              the belly/hem below the arm; the mid-flank band hides behind the
              frozen arm and pauldron on purpose — those ARE the lit contour
              there. Reuses the dress geometry; the x offset does all the
              work, the frozen tunic edge is never reshaped. */}
          {isSouls && (
            <mesh geometry={geo.dress} position={[0.08, 0, -0.15]}>
              <meshBasicMaterial color={palette.cloudLit} />
            </mesh>
          )}

          {/* dress (the rust tunic in souls mode — same shape) */}
          <Part
            geometry={geo.dress}
            color={palette.suitPink}
            z={0.12}
            outline={1.05}
            outlineColor={palette.outlineInk}
          />
          {/* souls: tunic hem occlusion — a suitDeep band tucked along the
              bottom hem (cloth weight), inside the dress silhouette, clear of
              the belt (y 0.52) and the feet. z 0.14 (dress fill 0.12, gap
              0.02); one value step from suitPink. */}
          {isSouls && (
            <mesh geometry={geo.tunicHem} position={[0, 0, 0.14]}>
              <meshBasicMaterial color={palette.suitDeep} />
            </mesh>
          )}

          {/* souls: leather belt across the tunic, steel buckle. The belt
              also pools a hard occlusion band on the tunic just below it. */}
          {isSouls && (
            <>
              <mesh geometry={geo.visorSlit} scale={0.62} position={[0, 0.38, 0.15]}>
                <meshBasicMaterial color={palette.suitDeep} />
              </mesh>
              <Part
                geometry={geo.belt}
                color={palette.suitDeep}
                z={0.2}
                position={[0, 0.52]}
                outline={1.05}
                outlineColor={palette.outlineInk}
              />
              <mesh geometry={geo.buckle} position={[0, 0.52, 0.24]}>
                <meshBasicMaterial color={palette.bowRed} />
              </mesh>
            </>
          )}

          {/* arms pivot at the shoulder */}
          <group ref={armLRef} position={[-0.62, 0.92, 0]}>
            <Part
              geometry={geo.arm}
              color={palette.kittyWhite}
              z={0.16}
              outline={1.14}
              outlineColor={palette.outlineInk}
            />
            {/* souls: layered spaulder, parented INSIDE the arm pivot so it
                rides the arm swing (+-0.5 rad grounded, -0.55 airborne)
                instead of hovering over it. Local offset [0, 0.03] puts the
                plate at ~[-0.62, 0.95] world, top at y 1.11 — covering the
                arm's top curve and the tunic's shoulder corner (y 1.06) and
                still straddling the head's lower edge (head fill 0.22).
                z ladder, bottom to top: arm fill 0.16, lame 0.18 (behind the
                plate so its tucked top edge is hidden), plate ink 0.25,
                plate 0.28, rim + shadow 0.30 (rim y 0.0875..0.13, shadow
                y -0.19..-0.145 — never share xy). All gaps >= 0.02. */}
            {isSouls && (
              /* damped: useFrame counter-rotates this group by PAULDRON_DAMP
                 of the arm swing — net a subtle nod, not the full arc */
              <group ref={pauldronLRef}>
                {/* Lame: next plate down the arm, one value step toward ink
                    (bowDeep) — it lives in the main plate's shadow. Reads
                    below the plate's ink halo from ~-0.22 to -0.27. */}
                <mesh geometry={geo.pauldronLame} position={[0, 0.03, 0.18]}>
                  <meshBasicMaterial color={palette.bowDeep} />
                </mesh>
                <Part
                  geometry={geo.pauldron}
                  inkGeometry={geo.pauldronInk}
                  color={palette.bowRed}
                  z={0.28}
                  position={[0, 0.03]}
                  outlineColor={palette.outlineInk}
                />
                {/* Top rim: a thin cloudLit arc on the upper curve — the low
                    sun catching the steel; reinforces the "brightest solid
                    figure" read. Inside the silhouette (w 0.15 < 0.24). */}
                <mesh geometry={geo.pauldronRim} position={[0, 0.03, 0.3]}>
                  <meshBasicMaterial color={palette.cloudLit} />
                </mesh>
                {/* Under-edge occlusion: a hard bowDeep crescent on the lower
                    rim (arm shading under steel), one value step from the
                    bowRed fill. Bridges visually into the lame below. */}
                <mesh geometry={geo.pauldronShadow} position={[0, 0.03, 0.3]}>
                  <meshBasicMaterial color={palette.bowDeep} />
                </mesh>
              </group>
            )}
          </group>
          <group ref={armRRef} position={[0.62, 0.92, 0]}>
            <Part
              geometry={geo.arm}
              color={palette.kittyWhite}
              z={0.16}
              outline={1.14}
              outlineColor={palette.outlineInk}
            />
            {/* souls: right spaulder — same local offsets and z ladder as
                the left (the shapes are symmetric, no mirroring needed).
                The greatsword is a sibling group at [0.75, 1.18], untouched. */}
            {isSouls && (
              /* damped: counter-rotated by PAULDRON_DAMP of the arm swing in
                 useFrame, same net subtle nod as the left plate */
              <group ref={pauldronRRef}>
                {/* Lame under the plate, z 0.18 (arm fill 0.16). */}
                <mesh geometry={geo.pauldronLame} position={[0, 0.03, 0.18]}>
                  <meshBasicMaterial color={palette.bowDeep} />
                </mesh>
                <Part
                  geometry={geo.pauldron}
                  inkGeometry={geo.pauldronInk}
                  color={palette.bowRed}
                  z={0.28}
                  position={[0, 0.03]}
                  outlineColor={palette.outlineInk}
                />
                {/* Top rim (cloudLit) and under-edge crescent (bowDeep),
                    both z 0.30, disjoint in xy. */}
                <mesh geometry={geo.pauldronRim} position={[0, 0.03, 0.3]}>
                  <meshBasicMaterial color={palette.cloudLit} />
                </mesh>
                <mesh geometry={geo.pauldronShadow} position={[0, 0.03, 0.3]}>
                  <meshBasicMaterial color={palette.bowDeep} />
                </mesh>
              </group>
            )}
          </group>

          {/* head */}
          <group ref={headRef} position={[0, 1.5, 0]}>
            <group ref={earLRef} position={[-0.58, 0.52, 0.15]}>
              <Part
                geometry={geo.ear}
                color={palette.kittyWhite}
                z={0}
                outline={1.12}
                outlineColor={palette.outlineInk}
              />
            </group>
            <group ref={earRRef} position={[0.58, 0.52, 0.15]}>
              <Part
                geometry={geo.ear}
                color={palette.kittyWhite}
                z={0}
                outline={1.12}
                outlineColor={palette.outlineInk}
              />
            </group>
            <Part
              geometry={geo.head}
              color={palette.kittyWhite}
              z={0.22}
              outline={1.045}
              outlineColor={palette.outlineInk}
            />

            {/* face — pastel only; the visor replaces it in souls mode */}
            {!isSouls && (
              <>
                <mesh
                  ref={eyeLRef}
                  geometry={geo.eye}
                  position={[-0.4, 0.06, 0.27]}
                >
                  <meshBasicMaterial color={palette.eyeInk} />
                </mesh>
                <mesh
                  ref={eyeRRef}
                  geometry={geo.eye}
                  position={[0.4, 0.06, 0.27]}
                >
                  <meshBasicMaterial color={palette.eyeInk} />
                </mesh>
                <mesh geometry={geo.nose} position={[0, -0.16, 0.27]}>
                  <meshBasicMaterial color={palette.noseYellow} />
                </mesh>
                <mesh geometry={geo.cheek} position={[-0.68, -0.22, 0.26]}>
                  <meshBasicMaterial color={palette.cheek} />
                </mesh>
                <mesh geometry={geo.cheek} position={[0.68, -0.22, 0.26]}>
                  <meshBasicMaterial color={palette.cheek} />
                </mesh>
                {[-1, 1].map((side) =>
                  [0.18, 0.02, -0.14].map((y, i) => (
                    <mesh
                      key={`${side}:${i}`}
                      geometry={geo.whisker}
                      position={[side * 0.88, y, 0.27]}
                      rotation={[0, 0, side * (0.08 - i * 0.08)]}
                    >
                      <meshBasicMaterial color={palette.outlineInk} />
                    </mesh>
                  )),
                )}
              </>
            )}

            {isSouls ? (
              /* great helm (comb great helm) — head-local z ladder over the
                 head fill (0.22): chin band 0.24, visor plate ink 0.25 /
                 plate 0.28, brow shadow 0.305, slit 0.31, embers 0.34,
                 dome ink 0.31 / dome 0.34, brow ridge + chip 0.36 (disjoint
                 xy), crest ink 0.37 / crest 0.40, sun rim behind all at 0.08.
                 The dome's lower ink line lands on the plate's top edge so
                 no bone shows between visor and helm; slit and embers stay
                 well below the dome (y <= 0.11 vs dome ink bottom 0.265),
                 so they never share a z band with it in xy. */
              <group position={[0, 0, 0]}>
                <Part
                  geometry={geo.visorPlate}
                  inkGeometry={geo.visorPlateInk}
                  color={palette.bowDeep}
                  z={0.28}
                  position={[0, 0.03]}
                  outlineColor={palette.outlineInk}
                />
                {/* Vision slit dropped 0.04 deeper (0.06 -> 0.02) so more
                    dark steel sits between brow and eyes: the stare comes
                    from under the brow, not from the middle of the band. */}
                <mesh geometry={geo.visorSlit} position={[0, 0.02, 0.31]}>
                  <meshBasicMaterial color={palette.outlineInk} />
                </mesh>
                {/* Brow shadow: the dome pools a hard occlusion band on the
                    plate just under its seam — the visor reads as recessed
                    steel, not a flat decal. Clear of the slit and embers;
                    pairs with the cloudLit ridge above the seam. */}
                <mesh geometry={geo.visorSlit} position={[0, 0.195, 0.305]}>
                  <meshBasicMaterial color={SOULS_MATERIAL.steelShadow} />
                </mesh>
                {/* Chin occlusion: a hard cheek-value band hugging the
                    visor's lower edge — the steel brim casting onto the
                    exposed bone chin, killing the cartoon-muzzle read on the
                    bare oval below the plate. The reused slit stays inside
                    the face silhouette (1.16×1.28 < the plate's 1.5 width);
                    z 0.24 clears the head fill (0.22) by 0.02 and sits below
                    the plate in y, so it never shares the plate ink's band. */}
                <mesh
                  geometry={geo.visorSlit}
                  position={[0, -0.27, 0.24]}
                  scale={[1.28, 1.2, 1]}
                >
                  <meshBasicMaterial color={palette.cheek} />
                </mesh>
                {/* Embers ride the slit (same y 0.02), z 0.34 clears the slit
                    ink (0.31) by 0.03. */}
                <mesh geometry={geo.ember} position={[-0.34, 0.02, 0.34]}>
                  <meshBasicMaterial color={palette.noseYellow} />
                </mesh>
                <mesh geometry={geo.ember} position={[0.34, 0.02, 0.34]}>
                  <meshBasicMaterial color={palette.noseYellow} />
                </mesh>
                {/* Sun rim for the helm: the padded dome contour shifted
                    toward the sun, behind every head layer. z 0.08 keeps a
                    0.04 gap under the ear inks (0.12) and sits behind the
                    head ink (0.19). Offset re-fit for the ogival crown:
                    x +0.08 makes the right flank peek by ~0.13 while the
                    left (0.05 pad - 0.08 shift) stays hidden under the dome
                    ink; y 0.64 (dome at 0.66) pulls the rim's apex 0.02
                    under the dome's, so the narrow point does not grow a
                    pale halo on top — the fringe stays right/upper-right. */}
                <mesh geometry={geo.helmDomeRim} position={[0.08, 0.64, 0.08]}>
                  <meshBasicMaterial color={palette.cloudLit} />
                </mesh>
                <Part
                  geometry={geo.helmDome}
                  inkGeometry={geo.helmDomeInk}
                  color={palette.bowRed}
                  z={0.34}
                  position={[0, 0.66]}
                  outlineColor={palette.outlineInk}
                />
                {/* Brow reinforcement ridge: hard cloudLit band on the dome's
                    lower front, y 0.335..0.46 head-local — above the dome's
                    base edge (0.30 at the corners, ~0.28 at centre) and the
                    visor seam, well inside the dome's ~1.9 width at that
                    height. z 0.36 clears the dome fill (0.34) by 0.02 and
                    shares the band with the chip only, which lives at
                    y ~0.96 — never the same xy. */}
                <mesh geometry={geo.helmBrow} position={[0, 0.37, 0.36]}>
                  <meshBasicMaterial color={palette.cloudLit} />
                </mesh>
                {/* Specular chip: a short bone-white glint clipped inside
                    the dome's sun-facing upper-right curve. Re-fit to the
                    ogival flank: dome-local (0.30, 0.30) -> head-local
                    (0.30, 0.96), where the new surface passes at ~y 0.44
                    dome-local, so the chip sits ~0.14 under the steel edge;
                    tilt -1.1 rad follows the steeper tangent. */}
                <mesh
                  geometry={geo.chip}
                  position={[0.3, 0.96, 0.36]}
                  rotation={[0, 0, -1.1]}
                  scale={[0.65, 1, 1]}
                >
                  <meshBasicMaterial color={palette.kittyWhite} />
                </mesh>
                {/* Comb: crest-local -0.30..0.76 -> head-local 0.46..1.52,
                    base buried in the dome (apex 1.18), tip 0.34 above it,
                    swept back toward -x. bowDeep = one step toward ink from
                    the dome, its own ink via outline 1.16 (ink 0.37 / fill
                    0.40 over the dome's 0.34). */}
                <Part
                  geometry={geo.helmCrest}
                  color={palette.bowDeep}
                  z={0.4}
                  position={[0, 0.76]}
                  outline={1.16}
                  outlineColor={palette.outlineInk}
                />
              </group>
            ) : (
              /* bow */
              <group ref={bowRef} position={[0.52, 0.66, 0.32]}>
                <Part
                  geometry={geo.bowLoop}
                  color={palette.bowRed}
                  z={0.004}
                  position={[-0.3, 0]}
                  rotation={0.45}
                  outline={1.12}
                  outlineColor={palette.outlineInk}
                />
                <Part
                  geometry={geo.bowLoop}
                  color={palette.bowRed}
                  z={0.004}
                  position={[0.3, 0]}
                  rotation={-0.45}
                  outline={1.12}
                  outlineColor={palette.outlineInk}
                />
                <Part
                  geometry={geo.bowKnot}
                  color={palette.bowDeep}
                  z={0.016}
                  outline={1.18}
                  outlineColor={palette.outlineInk}
                />
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}
