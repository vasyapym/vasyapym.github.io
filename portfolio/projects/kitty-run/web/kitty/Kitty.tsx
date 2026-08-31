// The procedural cat hero "Nix": flat vector shapes (THREE.ShapeGeometry)
// layered with an inverted-hull ink outline behind each fill, posed every
// frame from the pure rig. React renders the parts once; useFrame writes
// transforms directly. No textures, no per-frame allocation.
//
// Pose animation is limited to y-translation, z-rotation and scale, so
// Echo.tsx's pinPainterOrder (sort meshes by z once) stays valid.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PALETTE } from "../lib/palette.ts";
import { computePose } from "./rig.ts";
import type { WorldState } from "../scene/world.ts";

const ROOT_SCALE = 0.72;
const HEAD_Y = 0.66;
const FOOT_Y = -0.46;
// The rig is drawn with its origin at mid-body: the feet bottoms sit at
// FOOT_Y - foot ry = -0.55 local, but the root group stands on the ground
// line (k.y). Lift the figure so the paws seat exactly on the turf.
const GROUND_LIFT = 0.55;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ---- shape helpers --------------------------------------------------------

function ellipseShape(rx: number, ry: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  return shape;
}

// Big round head, a touch wider than tall — the "big-head-cute" read.
function headShape(): THREE.Shape {
  return ellipseShape(0.62, 0.58);
}

// Plain rounded ear (right side).
function earShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.2, 0);
  s.quadraticCurveTo(-0.24, 0.34, 0, 0.5);
  s.quadraticCurveTo(0.24, 0.34, 0.2, 0);
  s.closePath();
  return s;
}

// The LEFT ear's chipped V-notch: the tip carries a real bite out of the
// silhouette, so the inverted-hull outline follows the cut and it reads as a
// notch at any distance.
function earNotchedShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.2, 0);
  s.quadraticCurveTo(-0.23, 0.3, -0.07, 0.44);
  s.lineTo(-0.01, 0.33);
  s.lineTo(0.05, 0.44);
  s.quadraticCurveTo(0.23, 0.3, 0.2, 0);
  s.closePath();
  return s;
}

function innerEarShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.1, 0.02);
  s.quadraticCurveTo(-0.12, 0.26, 0, 0.36);
  s.quadraticCurveTo(0.12, 0.26, 0.1, 0.02);
  s.closePath();
  return s;
}

// Tiny berry heart-nose.
function noseShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -0.09);
  s.quadraticCurveTo(-0.11, 0.02, -0.055, 0.075);
  s.quadraticCurveTo(0, 0.095, 0, 0.045);
  s.quadraticCurveTo(0, 0.095, 0.055, 0.075);
  s.quadraticCurveTo(0.11, 0.02, 0, -0.09);
  s.closePath();
  return s;
}

// Soft closed upward smile (thin crescent fill in ink).
function mouthClosedShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.16, 0.03);
  s.quadraticCurveTo(0, -0.1, 0.16, 0.03);
  s.quadraticCurveTo(0, -0.02, -0.16, 0.03);
  s.closePath();
  return s;
}

// Open smile cavity (shown only on happy / near-miss).
function mouthOpenShape(): THREE.Shape {
  return ellipseShape(0.14, 0.1);
}

// The single fang (upper-left of the open mouth).
function fangShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.035, 0.055);
  s.lineTo(0.035, 0.055);
  s.lineTo(0, -0.045);
  s.closePath();
  return s;
}

function cheekShape(): THREE.Shape {
  return ellipseShape(0.11, 0.07);
}

// Grape romper with a tattered zig-zag hem.
function bodyShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.34, 0.34);
  s.quadraticCurveTo(-0.45, 0, -0.34, -0.28);
  s.lineTo(-0.24, -0.2);
  s.lineTo(-0.13, -0.32);
  s.lineTo(-0.02, -0.2);
  s.lineTo(0.09, -0.34);
  s.lineTo(0.2, -0.2);
  s.lineTo(0.3, -0.3);
  s.lineTo(0.34, -0.26);
  s.quadraticCurveTo(0.45, 0, 0.34, 0.34);
  s.closePath();
  return s;
}

// Upward-curling mint wisp tail.
function tailShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -0.08);
  s.quadraticCurveTo(0.5, 0.02, 0.5, 0.52);
  s.quadraticCurveTo(0.52, 0.92, 0.28, 1.06);
  s.quadraticCurveTo(0.44, 0.84, 0.4, 0.54);
  s.quadraticCurveTo(0.36, 0.2, 0, 0.14);
  s.closePath();
  return s;
}

// Forked ribbon tails of the wisp-hood.
function capeTailShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.22);
  s.quadraticCurveTo(-0.35, 0.02, -0.5, -0.5);
  s.lineTo(-0.32, -0.34);
  s.lineTo(-0.36, -0.64);
  s.lineTo(-0.18, -0.4);
  s.lineTo(-0.1, -0.68);
  s.quadraticCurveTo(-0.02, -0.3, 0, 0.22);
  s.closePath();
  return s;
}

// Hood capelet draped over the shoulders (sits below the head fill).
function hoodShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.42, 0.12);
  s.quadraticCurveTo(0, 0.34, 0.42, 0.12);
  s.quadraticCurveTo(0.34, -0.22, 0, -0.26);
  s.quadraticCurveTo(-0.34, -0.22, -0.42, 0.12);
  s.closePath();
  return s;
}

// Mint chest-star clasp (small diamond).
function claspShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.1);
  s.lineTo(0.07, 0);
  s.lineTo(0, -0.1);
  s.lineTo(-0.07, 0);
  s.closePath();
  return s;
}

function limbShape(): THREE.Shape {
  return ellipseShape(0.09, 0.15);
}

function footShape(): THREE.Shape {
  return ellipseShape(0.14, 0.09);
}

// ---- one silhouette part (ink copy grown behind the fill) -----------------

type PartProps = {
  geometry: THREE.ShapeGeometry;
  color: string;
  z: number;
  position?: [number, number];
  rotation?: number;
  scale?: number;
  outline?: number;
  outlineColor?: string;
};

function Part({
  geometry,
  color,
  z,
  position,
  rotation,
  scale = 1,
  outline = 0,
  outlineColor = PALETTE.outlineInk,
}: PartProps) {
  return (
    <>
      {outline > 0 && (
        <mesh
          geometry={geometry}
          position={
            position ? [position[0], position[1], z - 0.03] : [0, 0, z - 0.03]
          }
          rotation={[0, 0, rotation ?? 0]}
          scale={scale * outline}
        >
          <meshBasicMaterial color={outlineColor} />
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

// ---- the hero -------------------------------------------------------------

export function Kitty({ world }: { world: WorldState }) {
  const geo = useMemo(() => {
    const mk = (s: THREE.Shape) => new THREE.ShapeGeometry(s, 20);
    return {
      head: mk(headShape()),
      earNotched: mk(earNotchedShape()),
      ear: mk(earShape()),
      innerEar: mk(innerEarShape()),
      eye: mk(ellipseShape(0.15, 0.18)),
      catchBig: mk(ellipseShape(0.055, 0.055)),
      catchSmall: mk(ellipseShape(0.024, 0.024)),
      nose: mk(noseShape()),
      mouthClosed: mk(mouthClosedShape()),
      mouthOpen: mk(mouthOpenShape()),
      fang: mk(fangShape()),
      cheek: mk(cheekShape()),
      body: mk(bodyShape()),
      tail: mk(tailShape()),
      capeTail: mk(capeTailShape()),
      hood: mk(hoodShape()),
      clasp: mk(claspShape()),
      limb: mk(limbShape()),
      foot: mk(footShape()),
    };
  }, []);

  const rootRef = useRef<THREE.Group>(null);
  const squashRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Group>(null);
  const earRRef = useRef<THREE.Group>(null);
  const eyeLRef = useRef<THREE.Group>(null);
  const eyeRRef = useRef<THREE.Group>(null);
  const mouthClosedRef = useRef<THREE.Group>(null);
  const mouthOpenRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const hoodRef = useRef<THREE.Group>(null);
  const capeTailsRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const footLRef = useRef<THREE.Group>(null);
  const footRRef = useRef<THREE.Group>(null);

  // Game-over slump timer — cosmetic overlay only (reads world.status),
  // never a rig or world field, so purity/determinism are untouched.
  const koRef = useRef(0);

  useFrame((state, delta) => {
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
      nearMissT: k.nearMissT,
      now: state.clock.elapsedTime,
    });

    const koT = (koRef.current = clamp(
      world.status === "over" ? koRef.current + delta * 2.4 : 0,
      0,
      1,
    ));

    const root = rootRef.current;
    if (root) {
      root.position.y = k.y;
      root.visible = pose.visible;
    }

    const squash = squashRef.current;
    if (squash) {
      squash.position.y = pose.bobY - koT * 0.18 + GROUND_LIFT;
      squash.scale.set(pose.scaleX, pose.scaleY, 1);
    }

    const tilt = tiltRef.current;
    if (tilt) tilt.rotation.z = pose.tilt + koT * 0.16;

    const head = headRef.current;
    if (head) {
      head.rotation.z = pose.headRot + koT * 0.1;
      head.position.y = HEAD_Y + pose.headBobY - koT * 0.12;
    }

    const earL = earLRef.current;
    if (earL) earL.rotation.z = 0.16 + pose.earL - koT * 0.55;
    const earR = earRRef.current;
    if (earR) earR.rotation.z = -0.16 - pose.earR + koT * 0.55;

    // Eyes: gentle-closed on game-over, else the rig's blink/squint/pop.
    const eyeY =
      koT > 0 ? Math.min(pose.eyeScaleY, 1 - koT * 0.85) : pose.eyeScaleY;
    const eyeYc = Math.max(0.08, eyeY);
    if (eyeLRef.current) eyeLRef.current.scale.y = eyeYc;
    if (eyeRRef.current) eyeRRef.current.scale.y = eyeYc;

    // Mouth: tiny "o" on game-over, else closed smile / open-with-fang.
    const open = koT > 0.4 ? 0.4 : pose.mouthOpen;
    const showOpen = open >= 0.34;
    if (mouthClosedRef.current) {
      mouthClosedRef.current.visible = !showOpen;
      mouthClosedRef.current.scale.x = pose.grinScale;
    }
    if (mouthOpenRef.current) {
      mouthOpenRef.current.visible = showOpen;
      const m = 0.5 + open * 0.5;
      mouthOpenRef.current.scale.set(pose.grinScale * m, m, 1);
    }

    if (tailRef.current) tailRef.current.rotation.z = pose.tailSwing;

    if (hoodRef.current) {
      hoodRef.current.rotation.z = pose.capeSway + pose.capeBounce * 0.5;
      hoodRef.current.scale.set(pose.capeFlare, pose.capeFlare, 1);
    }
    if (capeTailsRef.current) {
      capeTailsRef.current.rotation.z =
        pose.capeSway * 0.8 - pose.capeLift * 0.5 + pose.capeBounce;
    }

    if (armLRef.current) armLRef.current.rotation.z = pose.armSwing;
    if (armRRef.current) armRRef.current.rotation.z = -pose.armSwing;

    const lift = 0.06;
    if (footLRef.current) {
      footLRef.current.position.y = FOOT_Y + Math.max(0, Math.sin(k.runPhase)) * lift;
      footLRef.current.position.x = -0.14 + Math.cos(k.runPhase) * 0.05;
    }
    if (footRRef.current) {
      footRRef.current.position.y =
        FOOT_Y + Math.max(0, Math.sin(k.runPhase + Math.PI)) * lift;
      footRRef.current.position.x =
        0.14 + Math.cos(k.runPhase + Math.PI) * 0.05;
    }
  });

  return (
    <group ref={rootRef} scale={ROOT_SCALE}>
      <group ref={squashRef}>
        <group ref={tiltRef}>
          {/* mint wisp tail (behind everything) */}
          <group ref={tailRef} position={[-0.26, 0.05, 0]}>
            <Part geometry={geo.tail} color={PALETTE.scarfDeep} z={-0.35} outline={1.1} />
          </group>

          {/* forked hood ribbon-tails */}
          <group ref={capeTailsRef} position={[0, 0.18, 0]}>
            <Part geometry={geo.capeTail} color={PALETTE.scarfCoral} z={-0.25} outline={1.08} />
          </group>

          {/* feet */}
          <group ref={footLRef} position={[-0.14, FOOT_Y, 0]}>
            <Part geometry={geo.foot} color={PALETTE.outlineInk} z={0.0} />
          </group>
          <group ref={footRRef} position={[0.14, FOOT_Y, 0]}>
            <Part geometry={geo.foot} color={PALETTE.outlineInk} z={0.0} />
          </group>

          {/* arms */}
          <group ref={armLRef} position={[-0.3, 0.06, 0]}>
            <Part geometry={geo.limb} color={PALETTE.furCream} z={0.05} outline={1.1} />
          </group>
          <group ref={armRRef} position={[0.3, 0.06, 0]}>
            <Part geometry={geo.limb} color={PALETTE.furCream} z={0.05} outline={1.1} />
          </group>

          {/* body (grape romper) + mint chest clasp */}
          <Part geometry={geo.body} color={PALETTE.suitRose} z={0.1} position={[0, 0.06]} outline={1.08} />
          <Part geometry={geo.clasp} color={PALETTE.scarfDeep} z={0.16} position={[0, 0.14]} outline={1.14} />

          {/* wisp-hood capelet over the shoulders (below the head fill) */}
          <group ref={hoodRef} position={[0, 0.42, 0]}>
            <Part geometry={geo.hood} color={PALETTE.scarfCoral} z={0.2} outline={1.07} />
          </group>

          {/* head group */}
          <group ref={headRef} position={[0, HEAD_Y, 0]}>
            {/* ears behind the head fill */}
            <group ref={earLRef} position={[-0.32, 0.4, 0]}>
              <Part geometry={geo.earNotched} color={PALETTE.furCream} z={0.18} outline={1.1} />
              <Part geometry={geo.innerEar} color={PALETTE.scarfDeep} z={0.2} scale={0.7} position={[0, 0.02]} />
            </group>
            <group ref={earRRef} position={[0.32, 0.4, 0]}>
              <Part geometry={geo.ear} color={PALETTE.furCream} z={0.18} outline={1.1} />
              <Part geometry={geo.innerEar} color={PALETTE.scarfDeep} z={0.2} scale={0.7} position={[0, 0.02]} />
            </group>

            {/* head fill */}
            <Part geometry={geo.head} color={PALETTE.furCream} z={0.22} outline={1.06} />

            {/* blush cheeks */}
            <Part geometry={geo.cheek} color={PALETTE.cheek} z={0.25} position={[-0.34, -0.1]} />
            <Part geometry={geo.cheek} color={PALETTE.cheek} z={0.25} position={[0.34, -0.1]} />

            {/* eyes (big ink fills + dual catchlights) */}
            <group ref={eyeLRef} position={[-0.22, 0.04, 0]}>
              <Part geometry={geo.eye} color={PALETTE.eyeInk} z={0.27} />
              <Part geometry={geo.catchBig} color={PALETTE.ink} z={0.31} position={[-0.05, 0.07]} />
              <Part geometry={geo.catchSmall} color={PALETTE.ink} z={0.31} position={[0.05, -0.07]} />
            </group>
            <group ref={eyeRRef} position={[0.22, 0.04, 0]}>
              <Part geometry={geo.eye} color={PALETTE.eyeInk} z={0.27} />
              <Part geometry={geo.catchBig} color={PALETTE.ink} z={0.31} position={[0.05, 0.07]} />
              <Part geometry={geo.catchSmall} color={PALETTE.ink} z={0.31} position={[-0.05, -0.07]} />
            </group>

            {/* berry heart-nose */}
            <Part geometry={geo.nose} color={PALETTE.noseBerry} z={0.28} position={[0, -0.06]} outline={1.12} />

            {/* closed smile (default) */}
            <group ref={mouthClosedRef} position={[0, -0.17, 0]}>
              <Part geometry={geo.mouthClosed} color={PALETTE.outlineInk} z={0.28} />
            </group>

            {/* open smile + single fang (happy / near-miss) */}
            <group ref={mouthOpenRef} position={[0, -0.17, 0]} visible={false}>
              <Part geometry={geo.mouthOpen} color={PALETTE.outlineInk} z={0.28} />
              <Part geometry={geo.fang} color={PALETTE.furCream} z={0.3} position={[-0.05, 0.05]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export default Kitty;
