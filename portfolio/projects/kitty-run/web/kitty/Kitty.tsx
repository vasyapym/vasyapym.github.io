// The procedural Hello Kitty: flat vector shapes (THREE.ShapeGeometry)
// layered with an inverted-hull style ink outline behind each fill, posed
// every frame from the pure rig. React renders the parts once; useFrame
// writes transforms directly.

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
// a crisp uniform outline at any resolution.
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
          position={position ? [position[0], position[1], z - 0.012] : [0, 0, z - 0.012]}
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
  const bowRef = useRef<THREE.Group>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);
  const footLRef = useRef<THREE.Group>(null);
  const footRRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);

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
  });

  return (
    <group ref={rootRef} scale={ROOT_SCALE}>
      <group ref={squashRef}>
        <group ref={tiltRef}>
          {/* feet peek below the dress hem */}
          <group ref={footLRef} position={[-0.18, 0.1, 0.03]}>
            <Part geometry={geo.foot} color={PALETTE.kittyWhite} z={0} outline={1.15} />
          </group>
          <group ref={footRRef} position={[0.18, 0.1, 0.03]}>
            <Part geometry={geo.foot} color={PALETTE.kittyWhite} z={0} outline={1.15} />
          </group>

          {/* dress */}
          <Part geometry={geo.dress} color={PALETTE.suitPink} z={0.045} outline={1.05} />

          {/* arms pivot at the shoulder */}
          <group ref={armLRef} position={[-0.62, 0.92, 0]}>
            <Part geometry={geo.arm} color={PALETTE.kittyWhite} z={0.055} outline={1.14} />
          </group>
          <group ref={armRRef} position={[0.62, 0.92, 0]}>
            <Part geometry={geo.arm} color={PALETTE.kittyWhite} z={0.055} outline={1.14} />
          </group>

          {/* head */}
          <group ref={headRef} position={[0, 1.5, 0]}>
            <group ref={earLRef} position={[-0.58, 0.52, 0.05]}>
              <Part geometry={geo.ear} color={PALETTE.kittyWhite} z={0} outline={1.12} />
            </group>
            <group ref={earRRef} position={[0.58, 0.52, 0.05]}>
              <Part geometry={geo.ear} color={PALETTE.kittyWhite} z={0} outline={1.12} />
            </group>
            <Part geometry={geo.head} color={PALETTE.kittyWhite} z={0.075} outline={1.045} />

            <mesh
              ref={eyeLRef}
              geometry={geo.eye}
              position={[-0.4, 0.06, 0.09]}
            >
              <meshBasicMaterial color={PALETTE.eyeInk} />
            </mesh>
            <mesh
              ref={eyeRRef}
              geometry={geo.eye}
              position={[0.4, 0.06, 0.09]}
            >
              <meshBasicMaterial color={PALETTE.eyeInk} />
            </mesh>
            <mesh geometry={geo.nose} position={[0, -0.16, 0.09]}>
              <meshBasicMaterial color={PALETTE.noseYellow} />
            </mesh>
            <mesh geometry={geo.cheek} position={[-0.68, -0.22, 0.088]}>
              <meshBasicMaterial color={PALETTE.cheek} />
            </mesh>
            <mesh geometry={geo.cheek} position={[0.68, -0.22, 0.088]}>
              <meshBasicMaterial color={PALETTE.cheek} />
            </mesh>
            {[-1, 1].map((side) =>
              [0.18, 0.02, -0.14].map((y, i) => (
                <mesh
                  key={`${side}:${i}`}
                  geometry={geo.whisker}
                  position={[side * 0.88, y, 0.09]}
                  rotation={[0, 0, side * (0.08 - i * 0.08)]}
                >
                  <meshBasicMaterial color={PALETTE.outlineInk} />
                </mesh>
              )),
            )}

            {/* bow */}
            <group ref={bowRef} position={[0.52, 0.66, 0.11]}>
              <Part
                geometry={geo.bowLoop}
                color={PALETTE.bowRed}
                z={0.002}
                position={[-0.3, 0]}
                rotation={0.45}
                outline={1.12}
              />
              <Part
                geometry={geo.bowLoop}
                color={PALETTE.bowRed}
                z={0.002}
                position={[0.3, 0]}
                rotation={-0.45}
                outline={1.12}
              />
              <Part
                geometry={geo.bowKnot}
                color={PALETTE.bowDeep}
                z={0.006}
                outline={1.18}
              />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
