# BRIEF — kitty-run × Dark Souls, deliverable 3: the ashen knight's helm

You are redesigning a procedural vector-art character for one of its two
themes. You have no access to the repository; the complete current source of
the file you will rewrite is in this brief. Return **one complete TypeScript
file** — implementation happens elsewhere.

## The project

"Cat Runner": a pastel endless runner. The hero is a procedural vector cat —
flat shapes (`THREE.ShapeGeometry`) layered with an inverted-hull style ink
outline behind each fill — posed every frame by a pure rig function. The
default character is a white cat in a red bow and pink dress. A second
selectable character, the **Dark Souls cat ("ashen")**, re-themes the whole
game; you now give **her** a body worthy of it: a knight's **helm** instead
of the bow, and any small iron/leather touches that read at phone size.
Everything else about her run, pose and motion stays as it is.

The game renders her at roughly 160 px tall on phones; every part must read
as a clean silhouette. Zero image assets — she is built from shapes only.

## Hard constraints

1. **The pastel mode must stay byte-identical.** When `character === "kitty"`,
   the rendered JSX must be equivalent to today's (same shapes, same
   transforms, same z's). The only tolerated pastel-mode change: every
   `<Part>` gains an explicit `outlineColor={palette.outlineInk}` prop
   (today they fall back to the pastel ink constant — same value, so this
   is visual no-op, but it must become explicit so the souls mode themes
   its outlines too).
2. **Souls mode colours may ONLY come from the existing palette keys** of
   the active `palette` object — never a new hex literal. Why: the best-run
   echo renders the same rig as a faded ghost, retinted by a lookup keyed on
   the rig's exact hexes. Palette keys are already in that lookup; new hexes
   would break the ghost. Available in souls mode (value shown):

   - `kittyWhite #ece5d8` — bone body
   - `outlineInk #1c1816` — outlines, whiskers
   - `eyeInk #241d1a` — eyes
   - `noseYellow #e8803c` — ember nose (the one warm "living" spot)
   - `cheek #c9a08c` — ash blush
   - `suitPink #925039` / `suitDeep #5a3024` — the rust tunic (the dress
     shape already picks these up automatically via `palette.suitPink`)
   - `bowRed #7c7a78` / `bowDeep #4f4c4a` — **designed as steel/leather**:
     these are the helm's iron tones (the bow itself is NOT rendered in
     souls mode)

3. **The helm replaces the bow group in souls mode** (conditional JSX, not
   visibility toggles). Motion choice — pick ONE and say so in your notes:
   - attach the helm group to `bowRef` (it inherits the rig's `bowRot` /
     `bowScale` — the bob that currently drives the bow: `-headRot * 1.5`
     plus a small run-phase jiggle, scaled up slightly on happy/squash), or
   - leave the helm un-referenced (a child of the head group only — it
     inherits head bob/tilt and feels heavy/solid; a knight's helm should
     not jiggle like a ribbon).
   Do NOT change `rig.ts` — no new pose fields.
4. **Same drawing technique as the rest of the file**: `Part` (ink copy
   grown ~1.05–1.2× behind the fill, z gap 0.03+), or plain
   `<mesh><meshBasicMaterial/></mesh>` for small detail pieces like the
   existing whiskers/eyes. New shapes are built as `THREE.Shape` builder
   functions alongside `earShape`/`dressShape` and joined into the single
   `geo` memo.
5. **Z discipline**: the head fill sits at z 0.22, face details at z 0.26–0.27,
   the bow at z 0.32+0.004/0.016. The helm must pick explicit z's that layer
   cleanly against those (state the plan in your notes). Generous gaps —
   16-bit mobile depth buffers z-fight on thin offsets.
6. **The face stays visible**: eyes, ember nose, whiskers, blush are
   untouched and unoccluded. Ears stay too (they flap via `earLRef`/
   `earRRef`); compose the helm WITH the ears (e.g. dome seated between
   them, ears reading just in front/below its edge, or a brim that leaves
   them clear). A full-face visor is forbidden — her face is the charm.
7. **Chunky parts only**: nothing thinner than ~0.06 world units; the whole
   helm stays inside the head's silhouette bounds (head ellipse rx 1.0,
   ry 0.84; ears at ±0.58 x, 0.52 y). She must not turn into a wide
   silhouette — the helm is a crown, not a bucket.
8. Optional small touches (all optional, all must obey rule 2): an ember
   plume (the `noseYellow` key — plume and nose sharing the ember family is
   intentional), a tunic belt or cloak collar (`suitDeep`), steel shoulder
   accents (`bowRed`/`bowDeep`). No weapons, no shields, no capes that
   change her silhouette width.
9. Imports, exports, props and the `useFrame` body stay as they are (the
   `bowRef` guard already tolerates the bow being absent). No new
   dependencies, no three.js APIs beyond what the file already uses
   (`THREE.Shape`, `THREE.ShapeGeometry`, `THREE.PlaneGeometry`).

## Current source — `web/kitty/Kitty.tsx` (rewrite this file)

```tsx
// The procedural cat hero: flat vector shapes (THREE.ShapeGeometry)
// layered with an inverted-hull style ink outline behind each fill, posed
// every frame from the pure rig. React renders the parts once; useFrame
// writes transforms directly.

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
            <Part geometry={geo.foot} color={palette.kittyWhite} z={0} outline={1.15} />
          </group>
          <group ref={footRRef} position={[0.18, 0.1, 0.03]}>
            <Part geometry={geo.foot} color={palette.kittyWhite} z={0} outline={1.15} />
          </group>

          {/* dress */}
          <Part geometry={geo.dress} color={palette.suitPink} z={0.12} outline={1.05} />

          {/* arms pivot at the shoulder */}
          <group ref={armLRef} position={[-0.62, 0.92, 0]}>
            <Part geometry={geo.arm} color={palette.kittyWhite} z={0.16} outline={1.14} />
          </group>
          <group ref={armRRef} position={[0.62, 0.92, 0]}>
            <Part geometry={geo.arm} color={palette.kittyWhite} z={0.16} outline={1.14} />
          </group>

          {/* head */}
          <group ref={headRef} position={[0, 1.5, 0]}>
            <group ref={earLRef} position={[-0.58, 0.52, 0.15]}>
              <Part geometry={geo.ear} color={palette.kittyWhite} z={0} outline={1.12} />
            </group>
            <group ref={earRRef} position={[0.58, 0.52, 0.15]}>
              <Part geometry={geo.ear} color={palette.kittyWhite} z={0} outline={1.12} />
            </group>
            <Part geometry={geo.head} color={palette.kittyWhite} z={0.22} outline={1.045} />

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

            {/* bow */}
            <group ref={bowRef} position={[0.52, 0.66, 0.32]}>
              <Part
                geometry={geo.bowLoop}
                color={palette.bowRed}
                z={0.004}
                position={[-0.3, 0]}
                rotation={0.45}
                outline={1.12}
              />
              <Part
                geometry={geo.bowLoop}
                color={palette.bowRed}
                z={0.004}
                position={[0.3, 0]}
                rotation={-0.45}
                outline={1.12}
              />
              <Part
                geometry={geo.bowKnot}
                color={palette.bowDeep}
                z={0.016}
                outline={1.18}
              />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
```

## Rig contract you may rely on (do not change it)

`computePose(...)` returns, among others: `bowRot` (the bow's rotation.z
oscillation: `-headRot * 1.5` + a run-phase jiggle when grounded, or a
velocity tilt mid-air) and `bowScale` (`1 + happyT * 0.5 + max(0, squash) *
0.18` — puffs on pickups, squashes on landings). The head group additionally
gets `headBobY` / `headRot` every frame; the ears get flap offsets.

## Required output format (exactly two blocks)

1. **`Kitty.tsx`** — the complete replacement file, TypeScript, in one
   fenced block. Keep the header comment style (the file's existing voice),
   keep `ROOT_SCALE`, keep the public signature
   `Kitty({ world, character })`.
2. **Notes** — ≤ 10 bullets: helm motion choice and why, the z plan, how
   ears and helm compose, silhouette check at phone size, anything you
   considered and rejected.
