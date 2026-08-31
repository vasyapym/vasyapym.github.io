// The procedural cat hero "Vesper": flat vector shapes (THREE.ShapeGeometry)
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

// Tall, upright, pointed ear (intact tip: left ear + inner ears).
function earShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.2, 0);
  shape.quadraticCurveTo(-0.23, 0.3, -0.07, 0.46);
  shape.quadraticCurveTo(0, 0.52, 0.07, 0.46);
  shape.quadraticCurveTo(0.23, 0.3, 0.2, 0);
  shape.closePath();
  return shape;
}

// The right ear's chipped V-notch ("scrapper" read): the same ear profile,
// but the tip carries a real bite out of the silhouette — the inverted-hull
// outline follows the cut, so it reads as a notch at any distance instead of
// a painted wedge.
function earNotchedShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.2, 0);
  shape.quadraticCurveTo(-0.23, 0.3, -0.07, 0.44);
  shape.lineTo(-0.01, 0.33);
  shape.lineTo(0.05, 0.44);
  shape.quadraticCurveTo(0.23, 0.3, 0.2, 0);
  shape.closePath();
  return shape;
}

// Grape romper with a spiky / tattered hem.
function bodyShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.46, 1.02);
  shape.lineTo(0.46, 1.02);
  shape.quadraticCurveTo(0.6, 0.55, 0.5, 0.14);
  // tattered hem: a run of little zig-zag teeth across the bottom
  shape.lineTo(0.34, 0.24);
  shape.lineTo(0.22, 0.1);
  shape.lineTo(0.1, 0.24);
  shape.lineTo(-0.02, 0.08);
  shape.lineTo(-0.14, 0.24);
  shape.lineTo(-0.26, 0.12);
  shape.lineTo(-0.38, 0.26);
  shape.lineTo(-0.5, 0.14);
  shape.quadraticCurveTo(-0.6, 0.55, -0.46, 1.02);
  shape.closePath();
  return shape;
}

// Mint wisp tail: a hooked cat tail curling UPWARD (a bottled-wish trailing
// light) rather than a down-hanging curl.
function tailShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0.02, 0.02);
  shape.quadraticCurveTo(-0.28, 0.05, -0.4, 0.34);
  shape.quadraticCurveTo(-0.52, 0.64, -0.28, 0.86);
  shape.quadraticCurveTo(-0.12, 1.02, 0.08, 0.96);
  shape.quadraticCurveTo(-0.08, 0.84, -0.12, 0.66);
  shape.quadraticCurveTo(-0.2, 0.44, -0.14, 0.28);
  shape.quadraticCurveTo(-0.08, 0.16, -0.02, 0.14);
  shape.closePath();
  return shape;
}

// Small dark-plum triangle nose.
function noseShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.1, 0.06);
  shape.quadraticCurveTo(0, 0.09, 0.1, 0.06);
  shape.lineTo(0, -0.09);
  shape.closePath();
  return shape;
}

// Wide cheshire grin: a broad upward crescent (the ink cavity of the mouth).
function grinShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.26, 0.06);
  shape.quadraticCurveTo(0, -0.22, 0.26, 0.06);
  shape.quadraticCurveTo(0, -0.02, -0.26, 0.06);
  shape.closePath();
  return shape;
}

// One tiny pale fang (small downward triangle) set inside the grin.
function fangShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.035, 0.0);
  shape.lineTo(0.035, 0.0);
  shape.lineTo(0, -0.07);
  shape.closePath();
  return shape;
}

// One forked point of the bat-capelet (a tapering ribbon that ends in a
// shallow fork — reads bat-hem, not scarf-tail).
function capeTailShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.1, 0.04);
  shape.lineTo(0.1, 0.04);
  shape.lineTo(0.08, -0.42);
  shape.lineTo(0.11, -0.56);
  shape.lineTo(0, -0.46);
  shape.lineTo(-0.11, -0.56);
  shape.lineTo(-0.08, -0.42);
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
  const capeRef = useRef<THREE.Group>(null);
  const capeTailLRef = useRef<THREE.Group>(null);
  const capeTailRRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);
  const grinRef = useRef<THREE.Mesh>(null);
  const footLRef = useRef<THREE.Group>(null);
  const footRRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const seg = 20;
    return {
      head: new THREE.ShapeGeometry(ellipseShape(0.92, 0.94), seg),
      ear: new THREE.ShapeGeometry(earShape(), seg),
      // The chipped right ear: same silhouette family, real V bite at the tip.
      earNotched: new THREE.ShapeGeometry(earNotchedShape(), seg),
      // The mint inner ear: the same ear silhouette, anchored mid-ear.
      earInner: new THREE.ShapeGeometry(earShape(), seg),
      // Sly half-lidded lens eye: a wide, short ellipse tilted at the corner.
      eye: new THREE.ShapeGeometry(ellipseShape(0.14, 0.1), seg),
      nose: new THREE.ShapeGeometry(noseShape(), seg),
      grin: new THREE.ShapeGeometry(grinShape(), seg),
      fang: new THREE.ShapeGeometry(fangShape(), seg),
      cheek: new THREE.ShapeGeometry(ellipseShape(0.14, 0.09), seg),
      body: new THREE.ShapeGeometry(bodyShape(), seg),
      foot: new THREE.ShapeGeometry(ellipseShape(0.11, 0.085), seg),
      arm: new THREE.ShapeGeometry(ellipseShape(0.12, 0.2), seg),
      tail: new THREE.ShapeGeometry(tailShape(), seg),
      capeGem: new THREE.ShapeGeometry(ellipseShape(0.1, 0.12), seg),
      capeTail: new THREE.ShapeGeometry(capeTailShape(), seg),
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
    if (capeRef.current) {
      capeRef.current.rotation.z = pose.capeSway;
      capeRef.current.scale.setScalar(pose.capeFlare);
    }
    if (capeTailLRef.current)
      capeTailLRef.current.rotation.z =
        -0.12 - pose.capeLift * 1.2 + pose.capeBounce;
    if (capeTailRRef.current)
      capeTailRRef.current.rotation.z =
        -0.3 - pose.capeLift * 1.35 + pose.capeBounce * 0.8;
    if (eyeLRef.current) eyeLRef.current.scale.y = pose.eyeScaleY;
    if (eyeRRef.current) eyeRRef.current.scale.y = pose.eyeScaleY;
    if (grinRef.current) grinRef.current.scale.setScalar(pose.grinScale);
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
          {/* mint wisp tail sits behind the body, curling upward */}
          <group ref={tailRef} position={[-0.48, 0.42, 0]}>
            <Part geometry={geo.tail} color={PALETTE.scarfDeep} z={0.02} outline={1.1} />
          </group>

          {/* feet peek below the hem */}
          <group ref={footLRef} position={[-0.18, 0.1, 0.03]}>
            <Part geometry={geo.foot} color={PALETTE.furCream} z={0} outline={1.15} />
          </group>
          <group ref={footRRef} position={[0.18, 0.1, 0.03]}>
            <Part geometry={geo.foot} color={PALETTE.furCream} z={0} outline={1.15} />
          </group>

          {/* grape romper with tattered hem */}
          <Part geometry={geo.body} color={PALETTE.suitRose} z={0.12} outline={1.05} />

          {/* mint clasp pinning the capelet, on the chest below the head's
              silhouette. The old front collar band was the one part whose z
              beat the head fill — dark across the chin, it read as a gaping
              mouth, so the cape now reads through its forked tails alone. */}
          <Part
            geometry={geo.capeGem}
            color={PALETTE.scarfDeep}
            z={0.14}
            position={[0.14, 0.45]}
            outline={1.16}
          />

          {/* arms pivot at the shoulder */}
          <group ref={armLRef} position={[-0.58, 0.9, 0]}>
            <Part geometry={geo.arm} color={PALETTE.furCream} z={0.16} outline={1.14} />
          </group>
          <group ref={armRRef} position={[0.58, 0.9, 0]}>
            <Part geometry={geo.arm} color={PALETTE.furCream} z={0.16} outline={1.14} />
          </group>

          {/* bat-capelet: two forked tails streaming from behind the
              shoulders (their tops hide behind the head). They stream to the
              back-left; capeLift flattens them behind her on the dash. */}
          <group ref={capeRef} position={[0, 1.02, 0.2]}>
            {/* forked streaming tails */}
            <group ref={capeTailLRef} position={[-0.28, -0.02, -0.02]}>
              <Part geometry={geo.capeTail} color={PALETTE.scarfCoral} z={0} outline={1.12} />
            </group>
            <group ref={capeTailRRef} position={[-0.22, -0.08, -0.04]}>
              <Part geometry={geo.capeTail} color={PALETTE.scarfCoral} z={0} outline={1.12} />
            </group>
          </group>

          {/* head */}
          <group ref={headRef} position={[0, 1.5, 0]}>
            {/* tall upright ears (behind the head), each with a mint inner ear.
                The right ear is the chipped one — a real V bite in the shape. */}
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
              <Part geometry={geo.earNotched} color={PALETTE.furCream} z={0} outline={1.12} />
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

            {/* sly half-lidded eyes: tilted lens shapes, blink via scale.y.
                Outer corners tilt up (trickster). */}
            <mesh
              ref={eyeLRef}
              geometry={geo.eye}
              position={[-0.38, 0.08, 0.27]}
              rotation={[0, 0, 0.32]}
            >
              <meshBasicMaterial color={PALETTE.eyeInk} />
            </mesh>
            <mesh
              ref={eyeRRef}
              geometry={geo.eye}
              position={[0.38, 0.08, 0.27]}
              rotation={[0, 0, -0.32]}
            >
              <meshBasicMaterial color={PALETTE.eyeInk} />
            </mesh>

            {/* dark-plum triangle nose */}
            <mesh geometry={geo.nose} position={[0, -0.12, 0.27]}>
              <meshBasicMaterial color={PALETTE.noseBerry} />
            </mesh>

            {/* wide cheshire grin (widens on happyT) with two tiny pale fangs */}
            <group ref={grinRef} position={[0, -0.34, 0]}>
              <mesh geometry={geo.grin} position={[0, 0, 0.28]}>
                <meshBasicMaterial color={PALETTE.outlineInk} />
              </mesh>
              <mesh geometry={geo.fang} position={[-0.12, 0.04, 0.29]}>
                <meshBasicMaterial color={PALETTE.furCream} />
              </mesh>
              <mesh geometry={geo.fang} position={[0.12, 0.04, 0.29]}>
                <meshBasicMaterial color={PALETTE.furCream} />
              </mesh>
            </group>

            {/* cheeks: faint mint glow */}
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
