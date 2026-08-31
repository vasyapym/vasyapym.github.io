// The procedural cat hero "Momo": flat vector shapes (THREE.ShapeGeometry)
// layered with an inverted-hull style ink outline behind each fill, posed
// every frame from the pure rig. React renders the parts once; useFrame
// writes transforms directly. No textures, no per-frame allocation.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PALETTE } from "../lib/palette.ts";
import { computePose } from "./rig.ts";
import type { WorldState } from "../scene/world.ts";

const ROOT_SCALE = 0.72;

function ellipseShape(rx: number, ry: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  return shape;
}

// Tall, upright, pointed ear (vs Hello Kitty's tiny low triangles).
function earShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.2, 0);
  shape.quadraticCurveTo(-0.23, 0.3, -0.07, 0.46);
  shape.quadraticCurveTo(0, 0.52, 0.07, 0.46);
  shape.quadraticCurveTo(0.23, 0.3, 0.2, 0);
  shape.closePath();
  return shape;
}

// Soft-rose romper.
function bodyShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.46, 1.02);
  shape.lineTo(0.46, 1.02);
  shape.quadraticCurveTo(0.6, 0.55, 0.5, 0.14);
  shape.quadraticCurveTo(0, 0.02, -0.5, 0.14);
  shape.quadraticCurveTo(-0.6, 0.55, -0.46, 1.02);
  shape.closePath();
  return shape;
}

// Visible curled cat tail.
function tailShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0.02, 0.02);
  shape.quadraticCurveTo(-0.3, 0.0, -0.46, 0.28);
  shape.quadraticCurveTo(-0.62, 0.56, -0.4, 0.8);
  shape.quadraticCurveTo(-0.34, 0.6, -0.36, 0.42);
  shape.quadraticCurveTo(-0.28, 0.2, -0.02, 0.14);
  shape.closePath();
  return shape;
}

// Small berry-rose triangle nose.
function noseShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.1, 0.06);
  shape.quadraticCurveTo(0, 0.09, 0.1, 0.06);
  shape.lineTo(0, -0.09);
  shape.closePath();
  return shape;
}

// Gentle smile crescent.
function smileShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.15, 0.02);
  shape.quadraticCurveTo(0, -0.13, 0.15, 0.02);
  shape.quadraticCurveTo(0, -0.05, -0.15, 0.02);
  shape.closePath();
  return shape;
}

// One streaming scarf tail (tapering ribbon, hangs from the knot).
function scarfTailShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.1, 0.04);
  shape.lineTo(0.1, 0.04);
  shape.lineTo(0.07, -0.5);
  shape.quadraticCurveTo(0, -0.6, -0.07, -0.5);
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
  outlineColor = PALETTE.outlineInk,
}: PartProps) {
  return (
    <>
      {outline > 0 && (
        <mesh
          geometry={geometry}
          position={position ? [position[0], position[1], z - 0.03] : [0, 0, z - 0.03]}
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

export function Kitty({ world }: { world: WorldState }) {
  const rootRef = useRef<THREE.Group>(null);
  const squashRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Group>(null);
  const earRRef = useRef<THREE.Group>(null);
  const scarfRef = useRef<THREE.Group>(null);
  const scarfTailLRef = useRef<THREE.Group>(null);
  const scarfTailRRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);
  const smileRef = useRef<THREE.Mesh>(null);
  const footLRef = useRef<THREE.Group>(null);
  const footRRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const seg = 20;
    return {
      head: new THREE.ShapeGeometry(ellipseShape(0.92, 0.94), seg),
      ear: new THREE.ShapeGeometry(earShape(), seg),
      // The rose inner ear: the same ear silhouette, anchored mid-ear.
      earInner: new THREE.ShapeGeometry(earShape(), seg),
      eye: new THREE.ShapeGeometry(ellipseShape(0.1, 0.15), seg),
      nose: new THREE.ShapeGeometry(noseShape(), seg),
      smile: new THREE.ShapeGeometry(smileShape(), seg),
      cheek: new THREE.ShapeGeometry(ellipseShape(0.14, 0.09), seg),
      body: new THREE.ShapeGeometry(bodyShape(), seg),
      foot: new THREE.ShapeGeometry(ellipseShape(0.11, 0.085), seg),
      arm: new THREE.ShapeGeometry(ellipseShape(0.12, 0.2), seg),
      tail: new THREE.ShapeGeometry(tailShape(), seg),
      scarfBand: new THREE.ShapeGeometry(ellipseShape(0.5, 0.15), seg),
      scarfKnot: new THREE.ShapeGeometry(ellipseShape(0.12, 0.12), seg),
      scarfTail: new THREE.ShapeGeometry(scarfTailShape(), seg),
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
    if (earLRef.current) earLRef.current.rotation.z = -0.18 + pose.earL;
    if (earRRef.current) earRRef.current.rotation.z = 0.18 + pose.earR;
    if (tailRef.current) tailRef.current.rotation.z = pose.tailSwing;
    if (scarfRef.current) {
      scarfRef.current.rotation.z = pose.scarfSway;
      scarfRef.current.scale.setScalar(pose.scarfFlare);
    }
    if (scarfTailLRef.current)
      scarfTailLRef.current.rotation.z =
        -0.12 - pose.scarfLift * 1.2 + pose.scarfBounce;
    if (scarfTailRRef.current)
      scarfTailRRef.current.rotation.z =
        -0.3 - pose.scarfLift * 1.35 + pose.scarfBounce * 0.8;
    if (eyeLRef.current) eyeLRef.current.scale.y = pose.eyeScaleY;
    if (eyeRRef.current) eyeRRef.current.scale.y = pose.eyeScaleY;
    if (smileRef.current) smileRef.current.scale.setScalar(pose.smileScale);
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
  });

  return (
    <group ref={rootRef} scale={ROOT_SCALE}>
      <group ref={squashRef}>
        <group ref={tiltRef}>
          {/* cat tail sits behind the body */}
          <group ref={tailRef} position={[-0.48, 0.42, 0]}>
            <Part geometry={geo.tail} color={PALETTE.furCream} z={0.02} outline={1.1} />
          </group>

          {/* feet peek below the hem */}
          <group ref={footLRef} position={[-0.18, 0.1, 0.03]}>
            <Part geometry={geo.foot} color={PALETTE.furCream} z={0} outline={1.15} />
          </group>
          <group ref={footRRef} position={[0.18, 0.1, 0.03]}>
            <Part geometry={geo.foot} color={PALETTE.furCream} z={0} outline={1.15} />
          </group>

          {/* romper */}
          <Part geometry={geo.body} color={PALETTE.suitRose} z={0.12} outline={1.05} />

          {/* arms pivot at the shoulder */}
          <group ref={armLRef} position={[-0.58, 0.9, 0]}>
            <Part geometry={geo.arm} color={PALETTE.furCream} z={0.16} outline={1.14} />
          </group>
          <group ref={armRRef} position={[0.58, 0.9, 0]}>
            <Part geometry={geo.arm} color={PALETTE.furCream} z={0.16} outline={1.14} />
          </group>

          {/* scarf: wrap + knot + two streaming tails. Sits above the body,
              below the head. The two tails stream to the back-left; scarfLift
              flattens them behind her during the dash. */}
          <group ref={scarfRef} position={[0, 1.02, 0.2]}>
            {/* streaming tails (behind the wrap) */}
            <group ref={scarfTailLRef} position={[-0.28, -0.02, -0.02]}>
              <Part geometry={geo.scarfTail} color={PALETTE.scarfCoral} z={0} outline={1.12} />
            </group>
            <group ref={scarfTailRRef} position={[-0.22, -0.08, -0.04]}>
              <Part geometry={geo.scarfTail} color={PALETTE.scarfCoral} z={0} outline={1.12} />
            </group>
            {/* wrap band across the neck */}
            <Part geometry={geo.scarfBand} color={PALETTE.scarfCoral} z={0.03} outline={1.08} />
            {/* knot */}
            <Part
              geometry={geo.scarfKnot}
              color={PALETTE.scarfDeep}
              z={0.05}
              position={[-0.16, 0]}
              outline={1.16}
            />
          </group>

          {/* head */}
          <group ref={headRef} position={[0, 1.5, 0]}>
            {/* tall upright ears (behind the head), each with a rose inner ear */}
            <group ref={earLRef} position={[-0.42, 0.72, 0.15]}>
              <Part geometry={geo.ear} color={PALETTE.furCream} z={0} outline={1.12} />
              <Part
                geometry={geo.earInner}
                color={PALETTE.scarfDeep}
                z={0.012}
                scale={0.5}
                position={[0, 0.05]}
              />
            </group>
            <group ref={earRRef} position={[0.42, 0.72, 0.15]}>
              <Part geometry={geo.ear} color={PALETTE.furCream} z={0} outline={1.12} />
              <Part
                geometry={geo.earInner}
                color={PALETTE.scarfDeep}
                z={0.012}
                scale={0.5}
                position={[0, 0.05]}
              />
            </group>

            {/* near-round head */}
            <Part geometry={geo.head} color={PALETTE.furCream} z={0.22} outline={1.045} />

            {/* eyes (blink via scale.y) */}
            <mesh ref={eyeLRef} geometry={geo.eye} position={[-0.38, 0.08, 0.27]}>
              <meshBasicMaterial color={PALETTE.eyeInk} />
            </mesh>
            <mesh ref={eyeRRef} geometry={geo.eye} position={[0.38, 0.08, 0.27]}>
              <meshBasicMaterial color={PALETTE.eyeInk} />
            </mesh>

            {/* berry-rose triangle nose */}
            <mesh geometry={geo.nose} position={[0, -0.12, 0.27]}>
              <meshBasicMaterial color={PALETTE.noseBerry} />
            </mesh>

            {/* gentle smile (widens on happyT) */}
            <mesh ref={smileRef} geometry={geo.smile} position={[0, -0.32, 0.28]}>
              <meshBasicMaterial color={PALETTE.outlineInk} />
            </mesh>

            {/* cheeks */}
            <mesh geometry={geo.cheek} position={[-0.6, -0.24, 0.26]}>
              <meshBasicMaterial color={PALETTE.cheek} />
            </mesh>
            <mesh geometry={geo.cheek} position={[0.6, -0.24, 0.26]}>
              <meshBasicMaterial color={PALETTE.cheek} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
