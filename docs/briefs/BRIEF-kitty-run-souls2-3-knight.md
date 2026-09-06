# BRIEF — kitty-run × Dark Souls v2, deliverable 3: the ashen knight

You are redesigning the **character art** of the ashen-knight theme for an
existing game. You have no repo access — this brief contains the full
current file and every value you need. Return **one complete TSX file**, in
the exact output format at the end.

## The character today

A procedural vector-art cat (three.js `ShapeGeometry` parts, each with an
inverted-hull style ink outline grown behind the fill). She is 0.72-scaled,
runs right, jumps, dashes. The pastel kitty wears a bow; the souls variant
currently wears a small skullcap helm + crest + brow band + tiny plume +
belt — the owner rejected it as "generic medieval". The pastel branch must
stay **pixel-identical**.

## The art target (reference image, described)

A pixel-art Dark Souls knight: a tiny figure in a **full great helm** (the
face is a dark visor slit, not visible skin), a **flowing cape**, and a
**sword** carried over the shoulder. The current file's soul kit is too
dainty: skullcap + plume reads "medieval fair", not Souls. Bold is wanted.

## Design to implement (the souls branch only)

1. **Great helm** — the dome grows to cover the crown fully; the brow band
   and plume are gone. New **visor plate**: a rounded plate across the face
   (eye height) in dark iron (`bowDeep`) with its own ink outline; inside
   it a thin **horizontal slit** (near-black, use `outlineInk`); in the
   slit, **two tiny ember eyes** (`noseYellow`) — small ellipses that read
   as a faint glow against the dark slit. Face features (eyes, nose,
   cheeks, whiskers) are **not rendered** in souls mode — the visor
   replaces the face. Cat ears stay, tucked behind the head fill as today.
   Keep the existing **crest** ridge on the dome (it is the helm's top
   line); drop the plume.
2. **Cape** — two-layer tattered cape behind the body: a full back cape
   (`suitDeep`) and a slightly shorter front sliver (`suitPink`), both with
   ink outlines, hanging from the shoulders (y ≈ 1.0) to a zigzag/torn hem
   (two or three notch points at different lengths). Animate in useFrame:
   gentle sway from `world.kitty.runPhase` (alternate the two layers'
   phases), extra lift when airborne (`vy` drives a backward tilt, clamp ±
   ~0.2 rad), and a blown-back kick while `world.kitty.dashT > 0`. The
   cape never animates in the pastel branch (it does not exist there).
3. **Pauldrons** — two small steel shoulder domes (`bowRed`) over the arm
   pivots, with ink outlines.
4. **Sword** — carried over the shoulder: grip (`suitDeep`), crossguard and
   pommel (`bowRed`), and a short pale **blade hint** (`sunCore`) rising
   behind the head's left edge. The whole sword sits at a z BEHIND the
   head's parts (see z discipline below) so it peeks past the head
   silhouette instead of crossing her face.
5. **Keep** the existing belt + buckle (they read well).

## The file you must rewrite (full current content)

```tsx
// The procedural cat hero: flat vector shapes (THREE.ShapeGeometry)
// layered with an inverted-hull style ink outline behind each fill, posed
// every frame from the pure rig. React renders the parts once; useFrame
// writes transforms directly.
//
// Two bodies share the one rig. The pastel kitty wears the bow; the ashen
// knight wears a helm and a tunic belt built from the same palette keys
// (bowRed/bowDeep are steel in her palette), so the best-run ghost can
// still retint her by hex lookup.

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

// --- souls-only shapes -----------------------------------------------

function helmDomeShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, -0.26);
  shape.quadraticCurveTo(-0.52, 0.14, 0, 0.26);
  shape.quadraticCurveTo(0.52, 0.14, 0.5, -0.26);
  shape.closePath();
  return shape;
}

function helmCrestShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.06, -0.25);
  shape.lineTo(0.06, -0.25);
  shape.lineTo(0.05, 0.17);
  shape.quadraticCurveTo(0, 0.25, -0.05, 0.17);
  shape.closePath();
  return shape;
}

function helmBandShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.66, -0.08);
  shape.quadraticCurveTo(0, -0.18, 0.66, -0.08);
  shape.lineTo(0.66, 0.08);
  shape.quadraticCurveTo(0, -0.02, -0.66, 0.08);
  shape.closePath();
  return shape;
}

function plumeShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.08, -0.08);
  shape.quadraticCurveTo(-0.1, 0.02, 0.01, 0.08);
  shape.quadraticCurveTo(0.1, 0.02, 0.08, -0.08);
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

function rectShape(w: number, h: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(w / 2, h / 2);
  shape.lineTo(-w / 2, h / 2);
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
  outlineColor,
}: PartProps) {
  const ink = outlineColor ?? PALETTE.outlineInk;
  return (
    <>
      {outline > 0 && (
        <mesh
          geometry={geometry}
          position={position ? [position[0], position[1], z - 0.03] : [0, 0, z - 0.03]}
          rotation={[0, 0, rotation ?? 0]}
          scale={scale * outline}
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
      helmCrest: new THREE.ShapeGeometry(helmCrestShape(), seg),
      helmBand: new THREE.ShapeGeometry(helmBandShape(), seg),
      plume: new THREE.ShapeGeometry(plumeShape(), seg),
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
  });

  return (
    <group ref={rootRef} scale={ROOT_SCALE}>
      <group ref={squashRef}>
        <group ref={tiltRef}>
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

            {isSouls ? (
              /* helm — z ladder above the face (0.27): dome 0.34 (ink
                 0.31), crest 0.40, band 0.46, plume 0.52. */
              <group position={[0, 0, 0]}>
                <Part
                  geometry={geo.helmDome}
                  color={palette.bowRed}
                  z={0.34}
                  position={[0, 0.66]}
                  outline={1.06}
                  outlineColor={palette.outlineInk}
                />
                <Part
                  geometry={geo.helmCrest}
                  color={palette.bowDeep}
                  z={0.4}
                  position={[0, 0.69]}
                  outline={1.16}
                  outlineColor={palette.outlineInk}
                />
                <Part
                  geometry={geo.helmBand}
                  color={palette.bowDeep}
                  z={0.46}
                  position={[0, 0.4]}
                  outline={1.05}
                  outlineColor={palette.outlineInk}
                />
                <Part
                  geometry={geo.plume}
                  color={palette.noseYellow}
                  z={0.52}
                  position={[0, 0.96]}
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
```

## Souls palette values you may use (and ONLY these — see constraint below)

```ts
kittyWhite: "#e8e1d2",   // bone body
outlineInk: "#17130f",   // outlines, visor slit
eyeInk: "#1e1815",       // (pastel eyes only — hidden in souls mode)
noseYellow: "#e07a34",   // ember: nose is hidden; USE for the ember eyes
cheek: "#bd917a",        // (hidden in souls mode)
suitPink: "#8a4a33",     // rust tunic + cape front sliver
suitDeep: "#522a1e",     // cape back + sword grip
bowRed: "#6a6d72",       // steel: helm dome, pauldrons, crossguard, buckle
bowDeep: "#3d4045",      // dark steel: crest, visor plate
sunCore: "#eaf0f6",      // pale moonlight steel: blade hint
```

## Hard constraints

- **Ghost-retint compatibility**: the best-run echo retints the rig by
  exact hex lookup over exactly these keys — `kittyWhite, suitPink,
  suitDeep, bowRed, bowDeep, noseYellow, cheek, outlineInk`. Use ONLY
  palette keys from that list on the knight (plus `sunCore` for the blade
  hint, which is allowed to stay untinted in the echo). `sunCore` will
  stay pale in the echo — acceptable, state nothing about it.
- **z discipline** (16-bit mobile depth buffers; ink copies sit exactly
  0.03 behind their fill; any two overlapping fills ≥ 0.03 apart, any fill
  ≥ 0.03 above the ink copy it overlaps):
  - body/cape/sword region: cape back ink 0.0 → cape back 0.02? — no:
    keep every ink at fillZ − 0.03 with fill z ≥ 0.03 minimum (the feet
    sit at z 0 today and are fine — nothing renders behind them). Suggest
    starting ladder: cape back ink −0.01, cape back 0.02, cape front ink
    0.03, cape front 0.06, sword 0.09–0.10, dress 0.12 (unchanged), belt
    0.20, buckle 0.24, pauldrons 0.19/0.22-ish over arms (arms fill 0.16,
    ink 0.13 — pauldron ink must sit ≥ 0.03 above 0.16).
  - head-local z (head group children): head fill 0.22, head ink 0.19;
    helm dome ink 0.31 / dome 0.34; crest ink 0.37 / crest 0.40; visor
    plate ink 0.25 / plate 0.28; slit 0.31; ember eyes 0.34. Ember eyes
    sit at face height (no overlap with the dome, which starts at y ≈
    0.40 head-local) — the 0.03 rule vs the dome does not apply to them.
  - Ears at z 0/0.15 as today; face features not rendered in souls mode.
- **Pastel branch stays pixel-identical** — the bow, eyes, nose, cheeks,
  whiskers render exactly as today when `isSouls` is false.
- **Animation contract**: react renders parts once; useFrame writes
  transforms on refs only. Cape/pauldron/sword get refs only if animated
  (cape: yes; others: static). No per-frame allocations.
- New shapes (visor plate, cape, pauldron, sword bits) are authored around
  their own origin and placed with `Part`'s `position` — so the grown ink
  copy reads as an even outline (never scale a shape from a far corner).
- Keep `ROOT_SCALE`, the rig refs, the pose driving, and the overall
  structure intact. TypeScript, no `any`. Concise comments only where they
  explain why (z ladder, rig decisions).

Available motion fields (on `world.kitty`): `runPhase` (radians, advances
with speed), `grounded`, `vy` (world units/s, negative when falling),
`dashT` (seconds left in the dash), plus `world.time`. The pose already
supplies head bob/tilt — the helm rides the head group automatically.

## Required output format

1. **Full replacement `Kitty.tsx`** — one complete TSX code block.
2. **Notes** — ≤ 8 bullets: the z ladder you settled, cape animation
   recipe (phases, clamps), anything you had to assume.
