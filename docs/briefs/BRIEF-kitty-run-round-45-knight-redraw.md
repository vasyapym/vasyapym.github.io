# BRIEF — kitty-run round 45: the Ashen knight redraw (Ash Lake Hollow winner pass)

Paste this whole file into the chat model. Self-contained: it has no repo
access; everything it needs is inside. The integrator applies the response,
runs the gates and reviews.

---

## §0 What you are and what you get

You are the design/implementation brain for one deliverable in "Cat Runner"
(`portfolio/projects/kitty-run`), a React + three.js endless runner. The
owner reviewed three live art-direction candidates and picked **C — "Ash
Lake Hollow"** (near-monochrome slate, one ember cluster, no rim light).
C's palette and scene knobs are ALREADY SHIPPED as the souls baseline
(theme/textures/ash/vignette are done; do not touch them). What remains is
the **knight redraw**: the character model must be redrawn per C's settled
recipe while keeping her identity.

Produce ONE deliverable (§5) in the exact output format of §6. CSS, tests,
probes are integrator work.

## §1 Laws (must not break)

- **Identity law.** The knight keeps her identity: a great helm (visor slit
  + two ember eyes), crest, pauldrons, two-layer tattered cape, greatsword;
  NO face/bow/whiskers in souls mode. The redraw changes rendering and
  shapes WITHIN that identity — nothing else.
- **The pastel kitty kit stays byte-identical.** Only souls-specific code
  may change: the souls-only shape builders, the `geo` souls entries, the
  souls JSX blocks, the cape `useFrame` block, and souls-only overlays.
  Shared shapes (head, ear, eye, nose, cheek, whisker, dress, foot, arm)
  and the pastel bow block are untouched.
- **Pose API is frozen.** `rig.ts` (§4) is the contract — do NOT change
  `computePose`, its input/output types, or which fields the component
  consumes. Cape motion coefficients in the component's `useFrame` MAY be
  retuned (C wants a nearly-still cape), but the refs and pose fields stay.
- **Z-ladder.** Character part layers keep ≥ 0.02 z gaps (16-bit mobile
  depth buffers z-fight on thin offsets and the character turns
  see-through). The current ladder is documented in comments inside
  Kitty.tsx; when you move/add parts, author explicit z values and keep
  every adjacent pair ≥ 0.02 apart.
- **Zero image assets.** All vector: THREE.ShapeGeometry fills + an
  inverted-hull-style ink copy grown behind each fill (the `Part` helper).
  Flat fills only — NO gradients anywhere.
- **Retint contract.** The Echo ghost retints by HEX LOOKUP: its map keys
  are the rig's own colours (§4). If you recolour a part with a NEW literal
  hex instead of a palette key, the ghost will no longer retint there — so
  recolour THROUGH palette keys (`palette.suitPink` etc.), never through
  new literals. (The souls wear overlays `SOULS_MATERIAL.*` are existing
  literals; keep using only those if you need a literal, and note any you
  change so the integrator can mirror them into the FADED map.)
- **Ground seating.** The rig's origin convention is settled (root group
  scale 0.72 at y = kitty.y; feet authored around the current offsets). Do
  not change the root transform or the foot geometry.
- **Bloom discipline.** Only `sunCore` and `heart` cross the bloom line;
  `windowEmber` rides the knee. The knight must stay matte — no new
  emissive-bright values on the rig.

## §2 Owner decisions — LOCKED

1. C "Ash Lake Hollow" is the shipped Ashen baseline (palette + castle
   knobs + ash tiers + vignette already in place — see §3).
2. Redraw policy: keep the identity, redraw better — stronger Dark Souls
   character, heavier silhouette. The pastel cat is untouched.

## §3 The direction you are executing (settled — do not re-litigate)

C's shipped palette (theme.ts, exact hexes the rig must draw from):
```ts
const SOULS_PALETTE: ThemePalette = {
  kittyWhite: "#ddd6c8", // bone, dimmed (vast dark)
  outlineInk: "#100d0b",
  bowRed: "#5f6166",     // steel, near-neutral cool
  bowDeep: "#34363a",
  suitPink: "#5c554d",   // leather drained to grey-brown
  suitDeep: "#37312b",
  noseYellow: "#e8913c", // ember eyes — the one warm accent on the rig
  cheek: "#9a938a",
  eyeInk: "#151210",

  skyTop: "#2c333f", skyMid: "#5a616e", skyBottom: "#828791",
  sunCore: "#e8ecef", sunHalo: "#aab2bd", sunHaloSoft: "#767e8a",
  cloud: "#40454f",
  cloudLit: "#8a8f98",   // cold rim — no warmth in the sky at all
  hillFar: "#646b76", hillNear: "#454b55",
  castleFar: "#9ba0a7", castleMid: "#565c66", castleNear: "#242830",
  windowEmber: "#ffb861", // the SINGLE warm point — the whole payload
  ash: "#c4bfb6",

  groundTop: "#5c5b58", groundBody: "#323230",
  groundDot: "#6a6763", pathEdge: "#434240",

  obstaclePlum: "#33302c", obstacleDeep: "#141210", obstacleDot: "#b9b3a8",

  heart: "#eef3ff", heartGlow: "#c2d6f2",
  star: "#e9b64a", starGlow: "#c66a1c",
  heal: "#ec6a20", healBurst: "#ffbb7e",

  ink: "#120f0c", paper: "#ded8ca",
};
```
The knight redraw recipe (from the winning candidate, verbatim intent):
- **Shapes:** the most austere silhouette — a plain rounded great-helm,
  crest reduced to a single low ridge; pauldrons squared but not enlarged;
  the cape long and nearly still, tatters few and straight, hanging rather
  than streaming (this world has no wind to speak of). Greatsword held low
  and vertical.
- **Colours:** a three-step cold-grey steel ladder (bowDeep occlusion →
  bowRed mid → one kittyWhite chip on the helm crown), NO rim light at
  all — the figure is modelled by value against the mist, not lit by any
  sun; the ember eyes are the single warm pixels on the knight.
- **Environment context (already shipped, for coherence):** no rim light on
  the city either; three cold haze banks; heaviest cold ash; deepest
  vignette. The knight should read as OF the mist rather than lit against
  it — furniture of the landscape, the brightest solid thing by a step.

## §4 Code excerpts

### FILE: portfolio/projects/kitty-run/web/kitty/Kitty.tsx (FULL — the file you redraw)
```tsx
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

// Souls-only wear shading, drawn INSIDE existing silhouettes (character
// law: same rig, material only). Values sit one step from the host fill
// toward the ink, hard-edged — no gradients. The pastel cat never
// renders these; bone-white for the one specular chip is palette.kittyWhite.
const SOULS_MATERIAL = {
  steelShadow: "#26292d",
  bladeFuller: "#a9b0ba",
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
  // Explicit padded ink shape for long/flat parts; used at scale 1.
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
      // Rim plate: the dome contour padded past the ink, for the sun-side
      // back-plate fringe (see the souls head block).
      helmDomeRim: new THREE.ShapeGeometry(helmDomeShape(0.05), seg),
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
      // souls material overlays (drawn inside existing silhouettes)
      chip: new THREE.ShapeGeometry(rectShape(0.18, 0.05), seg),
      fuller: new THREE.ShapeGeometry(rectShape(0.032, 1.6), seg),
      capeFold: new THREE.ShapeGeometry(capeFoldShape(), seg),
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
              {/* Fuller: a dirty mid-steel line down the blade's centre —
                  worn metal catching less light than the edges. Inside the
                  blade's own silhouette, clear of the tip curve and guard. */}
              <mesh geometry={geo.fuller} position={[0, 1.28, 0.06]}>
                <meshBasicMaterial color={SOULS_MATERIAL.bladeFuller} />
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
                {/* Brow shadow: the dome pools a hard occlusion band on the
                    plate just under its seam — the visor reads as recessed
                    steel, not a flat decal. Clear of the slit and embers. */}
                <mesh geometry={geo.visorSlit} position={[0, 0.195, 0.305]}>
                  <meshBasicMaterial color={SOULS_MATERIAL.steelShadow} />
                </mesh>
                <mesh geometry={geo.ember} position={[-0.34, 0.06, 0.34]}>
                  <meshBasicMaterial color={palette.noseYellow} />
                </mesh>
                <mesh geometry={geo.ember} position={[0.34, 0.06, 0.34]}>
                  <meshBasicMaterial color={palette.noseYellow} />
                </mesh>
                {/* Sun rim for the helm: the padded dome contour shifted
                    toward the sun, behind every head layer. z 0.08 keeps a
                    0.04 gap under the ear inks (0.12) — 0.15 would be
                    coplanar with the ear fills and z-fight the visible tips
                    on 16-bit mobile depth — and behind the head ink (0.19),
                    so only the right/upper-right curve peeks past the dome's
                    own ink. Lives in the head group, so it tracks bob and
                    rotation. */}
                <mesh geometry={geo.helmDomeRim} position={[0.07, 0.66, 0.08]}>
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
                {/* Specular chip: one clipped bone-white glint on the
                    dome's sun-facing upper curve — tarnished steel reads
                    through the specular being small and dirty. */}
                <mesh
                  geometry={geo.chip}
                  position={[0.34, 0.92, 0.36]}
                  rotation={[0, 0, -0.7]}
                >
                  <meshBasicMaterial color={palette.kittyWhite} />
                </mesh>
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
```

### FILE: portfolio/projects/kitty-run/web/kitty/rig.ts (FULL — FROZEN contract)
```ts
// Pure pose math for the procedural Kitty. Consumes the flat motion fields
// from the world and produces every transform the visual component applies.
// No three.js, no React — the node checks could pin this if needed.

export type KittyMotionInput = {
  runPhase: number;
  grounded: boolean;
  vy: number;
  squash: number;
  blinkShut: number;
  dashT: number;
  happyT: number;
  invulnT: number;
  now: number;
};

export type KittyPose = {
  bobY: number;
  tilt: number;
  scaleX: number;
  scaleY: number;
  headRot: number;
  headBobY: number;
  earL: number;
  earR: number;
  bowRot: number;
  bowScale: number;
  eyeScaleY: number;
  armSwing: number;
  visible: boolean;
};

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

export function computePose(m: KittyMotionInput): KittyPose {
  const run = Math.sin(m.runPhase);
  const bobY = m.grounded ? Math.abs(Math.cos(m.runPhase)) * 0.075 : 0.015;

  // Air stretch from velocity, landing squash from the spring.
  const riseStretch = clamp(m.vy * 0.011, -0.14, 0.2);
  const scaleY = 1 + riseStretch - m.squash * 0.3;
  const scaleX = 1 - (scaleY - 1) * 0.85;

  const dashTilt = m.dashT > 0 ? 0.17 : 0;
  const tilt = clamp(-m.vy * 0.011, -0.18, 0.24) + dashTilt;

  const headRot = Math.sin(m.runPhase * 2) * 0.026 + tilt * 0.45;
  const headBobY = m.grounded ? Math.sin(m.runPhase * 2) * 0.018 : 0;

  const earBase = m.dashT > 0 ? -0.34 : clamp(-m.vy * 0.018, -0.26, 0.3);
  const earFlap = m.grounded
    ? Math.sin(m.runPhase - 0.8) * 0.085
    : Math.sin(m.now * 9) * 0.05;

  const bowRot =
    -headRot * 1.5 +
    (m.grounded
      ? Math.sin(m.runPhase * 2 + 0.6) * 0.07
      : clamp(-m.vy * 0.02, -0.24, 0.24));
  const bowScale = 1 + m.happyT * 0.5 + Math.max(0, m.squash) * 0.18;

  const eyeScaleY = m.blinkShut > 0 ? 0.08 : 1 + m.happyT * 0.3;

  const armSwing = m.grounded ? -run * 0.5 : -0.55;

  // Invulnerability reads as a gentle blink, not a strobe: mostly on, with
  // short dips. A fast full-invisible flicker made Kitty look like a ghost.
  const visible = m.invulnT <= 0 || Math.sin(m.now * 11) > -0.6;

  return {
    bobY, tilt, scaleX, scaleY, headRot, headBobY,
    earL: earBase + earFlap, earR: earBase + earFlap * 0.8,
    bowRot, bowScale, eyeScaleY, armSwing, visible,
  };
}
```

### FILE: portfolio/projects/kitty-run/web/scene/Echo.tsx (excerpts — the ghost retint you must re-key)
The ghost rig renders `<Kitty world={echo} character="souls" />` (a fixed
souls rig, dual-mounted with the kitty one on separate RT layers) and is
retinted ONCE at mount by walking the subtree and mapping each material's
colour through `FADED[...]`:
```tsx
const SOULS_P = THEMES.souls.palette;

// The restyle: every rig colour maps into one faded family pulled toward
// the scene's own mood. Keys are the rig's own hexes, so a map only ever
// matches the theme it was built for.
const FADED: Record<CharacterId, Record<string, string>> = {
  kitty: { /* pastel map, unchanged — not your deliverable */ },
  souls: {
    [SOULS_P.kittyWhite]: "#efe9df",
    [SOULS_P.suitPink]: "#b39a8c",
    [SOULS_P.suitDeep]: "#7d6a5e",
    [SOULS_P.bowRed]: "#969290",
    [SOULS_P.bowDeep]: "#6b6661",
    [SOULS_P.noseYellow]: "#d6a57c",
    [SOULS_P.cheek]: "#c0a999",
    [SOULS_P.outlineInk]: "#4a423c",
    // The sun-rim plates join the ash-memory family; unmapped, the fringe
    // would glow full-strength on the faded ghost.
    [SOULS_P.cloudLit]: "#c9a284",
  },
};

function retint(material: THREE.Material, map: Record<string, string>): void {
  const basic = material as THREE.MeshBasicMaterial;
  if (basic.color) {
    const mapped = map[`#${basic.color.getHexString()}`];
    if (mapped) basic.color.set(mapped);
  }
}
```
The ghost MUST stay opaque (the RT's depth buffer resolves occlusion; the
single fade happens on the composite quad). The rig also draws
`SOULS_MATERIAL.*` literal hexes — if the redraw keeps/changes those
literals, list them in a note so the integrator can add matching FADED
entries (an unmapped literal renders full-strength on the ghost).

## §5 Deliverable — produce BOTH parts in ONE response

### Part A — the redrawn souls kit (Kitty.tsx)
Execute §3's recipe against the shipped file. Requirements:
- **Great helm:** plain rounded dome (keep the current dome family), crest
  reduced to a single LOW ridge. The visor slit + two ember eyes stay
  (identity), brow-occlusion discipline may stay if it serves the value
  ladder.
- **No rim light anywhere on the rig:** DELETE the `helmDomeRim` mesh and
  the dress sun-rim back-plate (the cloudLit fringe at body z −0.15). If
  any geometry entry becomes orphaned by this, drop it from `geo` too.
- **Steel ladder (3 steps):** bowDeep (occlusion pool) → bowRed (mid
  plane) → ONE kittyWhite chip on the helm crown. Current overlays to
  keep/retune: brow-occlusion on the visor plate (steelShadow), the
  dome chip (move it to the crown if you want it to read as C's single
  chip), belt occlusion band, cape fold wedge, fuller line. Anything the
  recipe doesn't call for, remove rather than accumulate.
- **Pauldrons:** squared profile (flatter top, squarer lower edge), not
  enlarged.
- **Cape:** long and nearly still — reshape both layers with LONGER hems
  and FEW, STRAIGHT tatter tongues (hanging, not streaming); retune the
  `useFrame` cape block so sway is a whisper (≈0.02–0.03 amplitude), the
  airborne lift is small, and the dash kick barely streams. The hem must
  never reach the feet's x range (the comment documents that invariant).
- **Greatsword held LOW and VERTICAL:** reposition/rotate the sword group
  so the blade runs vertical at her flank (e.g. held low behind/beside the
  tunic) instead of over the shoulder. Mind the z ladder: the sword must
  stay behind the arm fills and clear of the dress footprint, or be
  explicitly re-ordered with documented z bands (≥ 0.02 gaps). Its ink
  copies follow the new placement (padded ink shapes for long/flat parts).
- **Palette discipline:** all colours through existing palette keys
  (`kittyWhite/bowRed/bowDeep/suitPink/suitDeep/noseYellow/cheek/cloudLit/
  outlineInk`). Keep `SOULS_MATERIAL` literals only if they still serve
  the recipe; note any changes.
- **Z-ladder:** author the full new ladder in a comment block at the top
  of the souls JSX (like the current one does), every adjacent pair ≥ 0.02.
- The pastel kit, shared shapes, root/squash/tilt/head/ears/eyes/feet/arms
  transforms and all refs stay byte-identical.

### Part B — the ghost's faded family (Echo.tsx FADED souls map)
Re-derive the souls VALUES for C's colder world: an ash-memory family of
cold greys and dimmed bone (a watercolour print of THIS knight), with the
ember-eyes mapping going to a dimmed ember (not the old warm #d6a57c).
Keys stay hex-based on the rig's palette values; if Part A changed any
`SOULS_MATERIAL` literal, provide the matching FADED entries. Also state
whether the `cloudLit` entry is still needed once the rim plates are gone
(delete it if the rig no longer uses cloudLit).

### Success criteria
- Identity preserved at a glance: helm + visor slit + two ember eyes,
  crest ridge, pauldrons, two-layer cape, greatsword — no face.
- The knight reads as of the mist: NO rim fringe, cold three-step steel,
  dimmed bone, ember eyes the single warm pixels on the rig.
- Pastel kitty renders exactly as before (shared blocks untouched).
- The Echo ghost retints cleanly into the new faded family (hex keys all
  resolve — no full-strength literals on the ghost).
- Gates (integrator): typecheck, build, check/sim, headless probe with a
  souls close-up crop + echo-on-stage shot.

## §6 Output format (STRICT)

1. Start with `## Design rationale` — a few paragraphs: how the shapes
   change, the new z ladder, what was removed, why it reads MORE Ash Lake.
2. Then `## Part A — redrawn souls kit` and `## Part B — faded family`.
   Code fences each preceded by `FILE: <path>` and `MODE: full|patch`.
   Kitty.tsx: prefer PATCH blocks (exact old/new pairs anchored on real
   lines from §4 — the integrator applies them mechanically) but if the
   souls kit restructures so much that patches get unreadable, output
   `MODE: full` for Kitty.tsx and reproduce the pastel blocks verbatim
   from §4. Echo.tsx: a PATCH on the FADED souls record only.
3. A closing `## Integrator notes` list: any SOULS_MATERIAL literal
   changes (for the FADED map), any geometry entries orphaned/added, any
   useFrame coefficient retunes, and anything you deliberately left.
4. No placeholder pseudocode; if a detail is underdetermined, make the
   call and note it in one line.
