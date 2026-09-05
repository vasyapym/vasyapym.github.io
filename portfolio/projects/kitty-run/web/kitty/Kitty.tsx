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

function helmDomeShape(pad = 0): THREE.Shape {
  const x0 = 0.92 + pad;
  const yb = -0.36 - pad;
  const yt = 0.42 + pad;
  const shape = new THREE.Shape();
  shape.moveTo(-x0, yb);
  shape.quadraticCurveTo(-0.98 - pad, 0.02, -0.62 - pad * 0.6, 0.2 + pad * 0.8);
  shape.quadraticCurveTo(-0.22, yt, 0, yt);
  shape.quadraticCurveTo(0.22, yt, 0.62 + pad * 0.6, 0.2 + pad * 0.8);
  shape.quadraticCurveTo(0.98 + pad, 0.02, x0, yb);
  shape.quadraticCurveTo(0, yb - 0.05, -x0, yb);
  shape.closePath();
  return shape;
}

function helmCrestShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.06, -0.32);
  shape.lineTo(0.06, -0.32);
  shape.lineTo(0.05, 0.22);
  shape.quadraticCurveTo(0, 0.3, -0.05, 0.22);
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

function pauldronShape(pad = 0): THREE.Shape {
  const w = 0.27 + pad;
  const top = 0.13 + pad;
  const bot = -0.09 - pad;
  const shape = new THREE.Shape();
  shape.moveTo(-w, bot);
  shape.quadraticCurveTo(-w - 0.03, top, 0, top);
  shape.quadraticCurveTo(w + 0.03, top, w, bot);
  shape.quadraticCurveTo(0, bot - 0.06, -w, bot);
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
      helmCrest: new THREE.ShapeGeometry(helmCrestShape(), seg),
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
              blade+grip ink 0.01 / fill 0.04, guard+pommel ink 0.07 /
              fill 0.10 — below the arm ink (0.13) and clear of the dress
              footprint, so the dress ladder is untouched. */}
          {isSouls && (
            <group position={[0.75, 1.18, 0]} rotation={[0, 0, 1.0]}>
              <Part
                geometry={geo.blade}
                inkGeometry={geo.bladeInk}
                color={palette.sunCore}
                z={0.04}
                position={[0, 1.27]}
                outlineColor={palette.outlineInk}
              />
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

          {/* dress (the rust tunic in souls mode — same shape) */}
          <Part
            geometry={geo.dress}
            color={palette.suitPink}
            z={0.12}
            outline={1.05}
            outlineColor={palette.outlineInk}
          />

          {/* souls: leather belt across the tunic, steel buckle. */}
          {isSouls && (
            <>
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
          </group>
          <group ref={armRRef} position={[0.62, 0.92, 0]}>
            <Part
              geometry={geo.arm}
              color={palette.kittyWhite}
              z={0.16}
              outline={1.14}
              outlineColor={palette.outlineInk}
            />
          </group>

          {/* souls: pauldrons over the arm pivots. They straddle the head's
              lower edge (head fill 0.22), so they sit above it: ink 0.25 /
              fill 0.28. Static — the arm ellipses barely move visually. */}
          {isSouls &&
            [-1, 1].map((side) => (
              <Part
                key={side}
                geometry={geo.pauldron}
                inkGeometry={geo.pauldronInk}
                color={palette.bowRed}
                z={0.28}
                position={[side * 0.64, 0.98]}
                outlineColor={palette.outlineInk}
              />
            ))}

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
              /* great helm — head-local z ladder over the head fill (0.22):
                 visor plate ink 0.25 / plate 0.28, slit 0.31, embers 0.34,
                 dome ink 0.31 / dome 0.34, crest ink 0.37 / crest 0.40.
                 The dome's lower ink line lands on the plate's top edge so
                 no bone shows between visor and helm; slit and embers stay
                 well below the dome, so they never share a z band with it. */
              <group position={[0, 0, 0]}>
                <Part
                  geometry={geo.visorPlate}
                  inkGeometry={geo.visorPlateInk}
                  color={palette.bowDeep}
                  z={0.28}
                  position={[0, 0.03]}
                  outlineColor={palette.outlineInk}
                />
                <mesh geometry={geo.visorSlit} position={[0, 0.06, 0.31]}>
                  <meshBasicMaterial color={palette.outlineInk} />
                </mesh>
                <mesh geometry={geo.ember} position={[-0.34, 0.06, 0.34]}>
                  <meshBasicMaterial color={palette.noseYellow} />
                </mesh>
                <mesh geometry={geo.ember} position={[0.34, 0.06, 0.34]}>
                  <meshBasicMaterial color={palette.noseYellow} />
                </mesh>
                <Part
                  geometry={geo.helmDome}
                  inkGeometry={geo.helmDomeInk}
                  color={palette.bowRed}
                  z={0.34}
                  position={[0, 0.66]}
                  outlineColor={palette.outlineInk}
                />
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
