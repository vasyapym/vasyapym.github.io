// The knight costume variants (round 47c, re-scoped after the owner's
// verdict): five ground-up rethought CHARACTER rigs behind
// ?souls&knight=a..e — own body plans, heads, limbs — not garment swaps on
// one shared skeleton. The shipped knight (no param) is the control. Each
// rig mounts at the root (root scale already applied by Kitty) and animates
// itself from world.kitty (runPhase, grounded, vy, dashT, squash); it must
// duck under hover gates, tuck in the air, and state its lit-contour
// strategy (value law: the figure stays the brightest solid read).

import type { ReactElement } from "react";
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
// The outline-part helper lives in Kitty.tsx; the import cycle (Kitty reads
// KNIGHT_VARIANTS, this file reads Part) is function-level on both sides and
// is proven safe in Vite's module graph.
import { Part } from "../kitty/Kitty.tsx";
import type { WorldState } from "../scene/world.ts";
import type { ThemePalette } from "./theme.ts";

export const KNIGHT_VARIANT_IDS = ["a", "b", "c", "d", "e"] as const;
export type KnightVariantId = (typeof KNIGHT_VARIANT_IDS)[number];

export function knightVariantFromParams(
  params: URLSearchParams,
): KnightVariantId | null {
  const raw = params.get("knight");
  return KNIGHT_VARIANT_IDS.includes(raw as KnightVariantId)
    ? (raw as KnightVariantId)
    : null;
}

export type KnightGearProps = { palette: ThemePalette; world: WorldState };

export type KnightVariant = {
  id: KnightVariantId;
  name: string;
  blurb: string;
  // New literal hexes used by the rig -> faded value (echo retint merge).
  faded?: Record<string, string>;
  // The whole character: mounts at the root (scale 0.72 applied). Reads
  // world.kitty in its own useFrame for the run/jump/duck/dash poses.
  rig: (p: KnightGearProps) => ReactElement;
};

// Populated by each variant block below (one registration per block).
export const KNIGHT_VARIANTS = {} as Record<KnightVariantId, KnightVariant>;

// ---- shared shape helpers (self-contained; no per-frame allocation) ------
const SEG = 16;
const sg = (s: THREE.Shape, seg = SEG) => new THREE.ShapeGeometry(s, seg);

function ellipse(rx: number, ry: number): THREE.Shape {
  const s = new THREE.Shape();
  s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  return s;
}
function rect(w: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, h / 2);
  s.lineTo(-w / 2, h / 2);
  s.closePath();
  return s;
}
function poly(pts: [number, number][]): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}
function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2,
    hh = h / 2,
    s = new THREE.Shape();
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  s.closePath();
  return s;
}
// mirror an outline across x (for symmetric L/R pieces without negative scale)
const mx = (pts: [number, number][]): [number, number][] =>
  pts.map(([x, y]) => [-x, y]);

// ===== R-c : The Hollow Hound — low dense quadruped, fanged skull =====
// Z-LADDER: farLegs -0.14 · haunch/farbody -0.04 · body 0 · nearbody 0.06 ·
//   head 0.10 · ridge 0.14 · nearLegs 0.16 · fangs/eye 0.20 · tail 0.08
const GEO_C = {
  body:   sg(ellipse(1.05, 0.58)),
  chest:  sg(ellipse(0.58, 0.60)),
  haunch: sg(ellipse(0.66, 0.66)),
  blade:  sg(poly([[-0.26,0],[0.26,0],[0.10,0.54],[-0.16,0.44]])),
  skull:  sg(poly([[-0.20,0.02],[0.02,0.30],[0.44,0.26],[0.64,0.02],[0.50,-0.20],[0.02,-0.26]])),
  jaw:    sg(poly([[0.02,-0.10],[0.54,-0.05],[0.34,-0.27],[0.02,-0.23]])),
  fang:   sg(poly([[0,0],[0.07,0],[0.035,-0.16]])),
  ear:    sg(poly([[0,0],[0.17,0.03],[0.04,0.30]])),
  eye:    sg(ellipse(0.075, 0.026)),
  upper:  sg(roundedRect(0.22, 0.60, 0.08)),
  paw:    sg(ellipse(0.19, 0.10)),
  ridge:  sg(poly([[0,0],[0.98,0.05],[0.92,0.16],[0,0.12]])),
  spike:  sg(poly([[0,0],[0.10,0],[0.05,0.19]])),
  tailA:  sg(roundedRect(0.16, 0.72, 0.08)),
  tailB:  sg(roundedRect(0.11, 0.58, 0.06)),
  wrap:   sg(roundedRect(0.72, 0.40, 0.14)),
  plate:  sg(poly([[0,0],[0.26,0.02],[0.22,0.14],[0.03,0.12]])),
};

function RigC({ palette, world }: KnightGearProps) {
  const spine = useRef<THREE.Group>(null);
  const head  = useRef<THREE.Group>(null);
  const foreN = useRef<THREE.Group>(null), foreF = useRef<THREE.Group>(null);
  const hindN = useRef<THREE.Group>(null), hindF = useRef<THREE.Group>(null);
  const tail1 = useRef<THREE.Group>(null), tail2 = useRef<THREE.Group>(null);
  const duckA = useRef(0);
  const L = (a:number,b:number,t:number)=>THREE.MathUtils.lerp(a,b,t);

  useFrame(() => {
    const k = world.kitty, run = k.runPhase, air = !k.grounded, dash = k.dashT||0;
    const on = world.status === "running";
    duckA.current = L(duckA.current, k.dashT > 0 ? 1 : 0, 0.22);
    const duck = duckA.current, p = run * Math.PI * 2;
    const gA = Math.sin(p), gB = Math.sin(p + Math.PI);
    if (spine.current) {                         // belly-slide: flatten toward ground
      spine.current.scale.set(L(1,1.14,duck), L(1,0.5,duck), 1);
      spine.current.position.y = on ? Math.abs(Math.sin(p)) * 0.04 : 0;
      spine.current.rotation.z = -0.04 - dash*0.16 - duck*0.10 + (air ? 0.16 : 0);
    }
    const sw = on ? 0.55 : 0.04;
    // gallop alternation; pounce tuck when airborne; forelimbs stretch on dash
    foreN.current!.rotation.z = (air ? -0.85 : gA*sw) - dash*0.7 - duck*0.5;
    foreF.current!.rotation.z = (air ? -0.85 : gB*sw) - dash*0.7 - duck*0.5;
    hindN.current!.rotation.z = (air ?  0.8  : gB*sw) + duck*0.6 + dash*0.2;
    hindF.current!.rotation.z = (air ?  0.8  : gA*sw) + duck*0.6 + dash*0.2;
    head.current!.rotation.z  = -0.06 - dash*0.14 + duck*0.30 - (air?0.10:0)
                              + (on ? Math.sin(p)*0.03 : 0);
    const lag = Math.sin(p*0.5 - 0.8);           // dragging tail-lash motion cue
    tail1.current!.rotation.z = 0.5 + lag*0.45 + dash*0.35;
    tail2.current!.rotation.z = lag*0.55;
  });

  const Leg = (r:{ current: THREE.Group | null }, x:number, z:number, near:boolean) => (
    <group ref={r} position={[x, 0.70, z]}>
      <Part geometry={GEO_C.upper} color={near?palette.suitPink:palette.suitDeep} z={z} position={[0,-0.30]} />
      <Part geometry={GEO_C.paw}   color={near?palette.suitPink:palette.suitDeep} z={z} position={[0.02,-0.66]} />
    </group>
  );

  return (
    <group>
      {Leg(foreF, 0.60, -0.14, false)}{Leg(hindF, -0.62, -0.14, false)}
      <group ref={spine}>
        <group ref={tail1} position={[-1.00, 0.95, 0.08]}>
          <Part geometry={GEO_C.tailA} color={palette.suitDeep} z={0.08} position={[-0.14,-0.30]} rotation={0.6}/>
          <group ref={tail2} position={[-0.30,-0.58,0]}>
            <Part geometry={GEO_C.tailB} color={palette.suitDeep} z={0.08} position={[-0.10,-0.24]} rotation={0.5}/>
          </group>
        </group>
        <Part geometry={GEO_C.haunch} color={palette.suitDeep} z={-0.04} position={[-0.62,0.90]} />
        <Part geometry={GEO_C.body}   color={palette.suitPink} z={0}     position={[0,0.92]} />
        <Part geometry={GEO_C.wrap}   color={palette.suitDeep} z={0.06}  position={[-0.10,0.86]} rotation={-0.05}/>
        <Part geometry={GEO_C.chest}  color={palette.suitPink} z={0.06}  position={[0.55,0.86]} />
        <Part geometry={GEO_C.blade}  color={palette.suitDeep} z={0.06}  position={[0.16,1.30]} />
        <Part geometry={GEO_C.ridge}  color={palette.kittyWhite} z={0.14} position={[-0.85,1.02]} />
        <Part geometry={GEO_C.spike}  color={palette.kittyWhite} z={0.14} position={[-0.30,1.12]} />
        <Part geometry={GEO_C.spike}  color={palette.kittyWhite} z={0.14} position={[0.10,1.20]} scale={0.85}/>
        <Part geometry={GEO_C.plate}  color="#7a3b2e" z={0.12} position={[-0.44,0.98]} />
        <Part geometry={GEO_C.wrap}   color="#7a3b2e" z={0.05} position={[-0.20,0.70]} rotation={0.06} scale={0.5}/>
        <group ref={head} position={[0.92, 1.05, 0.10]}>
          <Part geometry={GEO_C.ear}   color={palette.suitDeep}  z={0.08} position={[0.10,0.24]} />
          <Part geometry={GEO_C.skull} color={palette.suitPink}  z={0.10} position={[0,0]} />
          <Part geometry={GEO_C.jaw}   color={palette.suitDeep}  z={0.09} position={[0,0]} />
          <Part geometry={GEO_C.fang}  color={palette.kittyWhite} z={0.20} position={[0.40,-0.14]} />
          <Part geometry={GEO_C.fang}  color={palette.kittyWhite} z={0.20} position={[0.28,-0.14]} scale={0.8}/>
          <Part geometry={GEO_C.eye}   color={palette.windowEmber} z={0.20} position={[0.30,0.08]} rotation={-0.35}/>
        </group>
        {Leg(foreN, 0.60, 0.16, true)}{Leg(hindN, -0.62, 0.16, true)}
      </group>
    </group>
  );
}
KNIGHT_VARIANTS.c = {
  id: "c", name: "The Hollow Hound",
  blurb: "Ash-cursed beast, low and fanged, loping the lit lane.",
  faded: { "#7a3b2e": "#4a2a24" },
  rig: (p: KnightGearProps) => <RigC {...p} />,
};

// ===== R-a : Cinderwright — hulking wide forge-revenant =====
// Z-LADDER: backArm/backLeg -0.10 · torso 0 · cowl 0.06 · nearLeg 0.10 ·
//   hammer 0.14 · seams 0.16 · chain 0.22 · anvilPauldron 0.26 · anvilRim 0.28
const GEO_A = {
  torso:  sg(poly([[-0.85,0],[0.85,0],[1.05,2.0],[-1.05,2.0]])),
  belly:  sg(poly([[-0.70,0],[0.70,0],[0.62,0.9],[-0.62,0.9]])),
  cowl:   sg(poly([[-0.42,0],[0.42,0],[0.34,0.5],[-0.34,0.5]])),
  visor:  sg(rect(0.5, 0.10)),
  leg:    sg(roundedRect(0.40, 0.95, 0.10)),
  boot:   sg(poly([[-0.24,0],[0.34,0],[0.30,0.30],[-0.24,0.30]])),
  arm:    sg(roundedRect(0.34, 1.15, 0.10)),
  fist:   sg(ellipse(0.30, 0.30)),
  hammerH:sg(roundedRect(0.62, 0.80, 0.08)),
  hammerN:sg(rect(0.16, 0.5)),
  anvil:  sg(poly([[-0.55,0],[0.55,0],[0.70,0.35],[0.40,0.72],[-0.40,0.72],[-0.70,0.35]])),
  anvilR: sg(poly([[0.40,0.72],[0.70,0.35],[0.62,0.30],[0.34,0.66]])),
  seam:   sg(rect(0.06, 0.34)),
  chain:  sg(ellipse(0.11, 0.08)),
  rivet:  sg(ellipse(0.05, 0.05)),
};

function RigA({ palette, world }: KnightGearProps) {
  const root = useRef<THREE.Group>(null);
  const hammer = useRef<THREE.Group>(null), backArm = useRef<THREE.Group>(null);
  const legN = useRef<THREE.Group>(null), legF = useRef<THREE.Group>(null);
  const chain = useRef<THREE.Group>(null), seams = useRef<THREE.Group>(null);
  const duckA = useRef(0), chainV = useRef(0);
  const L = (a:number,b:number,t:number)=>THREE.MathUtils.lerp(a,b,t);

  useFrame(() => {
    const k = world.kitty, run = k.runPhase, air = !k.grounded, dash = k.dashT||0;
    const on = world.status === "running";
    duckA.current = L(duckA.current, k.dashT > 0 ? 1 : 0, 0.20);
    const duck = duckA.current, p = run * Math.PI * 2;
    const apex = air ? THREE.MathUtils.clamp(1 - Math.abs(k.vy)*0.7, 0, 1) : 0;
    if (root.current) {                          // ponderous piston lean; kneel-wide duck
      root.current.rotation.z = 0.05 + dash*0.14 - duck*0.06 + (on?Math.sin(p)*0.02:0);
      root.current.scale.set(L(1,1.25,duck), L(1,0.5,duck), 1);
      root.current.position.y = on ? Math.abs(Math.sin(p*2))*0.03 : 0;
    }
    const st = on ? 0.5 : 0.05;
    legN.current!.rotation.z = (air ? 0.4 : Math.sin(p)*st) - duck*0.9;
    legF.current!.rotation.z = (air ? 0.4 : Math.sin(p+Math.PI)*st) + duck*0.4;
    // hammer punches forward on dash; heavy tuck airborne
    hammer.current!.rotation.z = -0.2 + (air?0.5:Math.sin(p+Math.PI)*0.25) - dash*1.4;
    backArm.current!.rotation.z = 0.15 + (air?-0.4:Math.sin(p)*0.25);
    chainV.current = L(chainV.current, Math.sin(p*0.5)*0.5 + dash*0.6, 0.08); // heavy lag
    chain.current!.rotation.z = -chainV.current;
    // seam-cracks flare brighter (larger) at jump apex
    seams.current!.scale.setScalar(1 + apex*0.35);
  });

  return (
    <group ref={root}>
      <group ref={legF} position={[-0.34, 0.95, -0.10]}>
        <Part geometry={GEO_A.leg}  color={palette.suitDeep} z={-0.10} position={[0,-0.48]} />
        <Part geometry={GEO_A.boot} color={palette.suitDeep} z={-0.10} position={[0.02,-0.95]} />
      </group>
      <group ref={backArm} position={[-0.85, 1.90, -0.10]}>
        <Part geometry={GEO_A.arm}  color={palette.suitDeep} z={-0.10} position={[0,-0.55]} rotation={0.1}/>
        <Part geometry={GEO_A.fist} color={palette.suitDeep} z={-0.10} position={[-0.05,-1.05]} />
      </group>
      <Part geometry={GEO_A.torso} color={palette.suitDeep} z={0} position={[0,0]} />
      <Part geometry={GEO_A.belly} color={palette.suitPink} z={0.02} position={[0,0.05]} />
      <Part geometry={GEO_A.rivet} color={palette.cloudLit} z={0.04} position={[-0.5,1.4]} />
      <Part geometry={GEO_A.rivet} color={palette.cloudLit} z={0.04} position={[0.55,1.5]} />
      <Part geometry={GEO_A.cowl}  color={palette.suitDeep} z={0.06} position={[0,2.0]} />
      <Part geometry={GEO_A.visor} color={palette.outlineInk} z={0.08} position={[0,2.22]} />
      <group ref={legN} position={[0.34, 0.95, 0.10]}>
        <Part geometry={GEO_A.leg}  color={palette.suitPink} z={0.10} position={[0,-0.48]} />
        <Part geometry={GEO_A.boot} color={palette.suitPink} z={0.10} position={[0.02,-0.95]} />
      </group>
      <group ref={hammer} position={[0.95, 1.85, 0.14]}>
        <Part geometry={GEO_A.arm}     color={palette.suitPink} z={0.14} position={[0,-0.55]} rotation={-0.08}/>
        <Part geometry={GEO_A.hammerN} color={palette.suitDeep} z={0.14} position={[0.02,-1.05]} />
        <Part geometry={GEO_A.hammerH} color={palette.suitDeep} z={0.16} position={[0.10,-1.35]} />
        <Part geometry={GEO_A.rivet}   color={palette.cloudLit} z={0.18} position={[0.10,-1.35]} />
      </group>
      {/* left anvil-pauldron: the whole-mass signature, front + cold-rimmed */}
      <Part geometry={GEO_A.anvil}  color={palette.suitDeep}  z={0.26} position={[-0.85,1.95]} />
      <Part geometry={GEO_A.anvilR} color={palette.cloudLit}  z={0.28} position={[-0.85,1.95]} />
      <group ref={chain} position={[-0.85, 1.60, 0.22]}>
        {[0,1,2,3,4].map(i => (
          <Part key={i} geometry={GEO_A.chain} color={palette.ash} z={0.22} position={[-i*0.05,-0.20-i*0.22]} />
        ))}
      </group>
      {/* ember seam-cracks: sparse, windowEmber (rides the knee) */}
      <group ref={seams}>
        <Part geometry={GEO_A.seam} color={palette.windowEmber} z={0.16} position={[0.10,1.35]} rotation={0.25}/>
        <Part geometry={GEO_A.seam} color={palette.windowEmber} z={0.16} position={[-0.25,1.55]} rotation={-0.4} scale={0.7}/>
        <Part geometry={GEO_A.seam} color={palette.windowEmber} z={0.16} position={[0.30,1.75]} rotation={0.5} scale={0.6}/>
        <Part geometry={GEO_A.seam} color={palette.windowEmber} z={0.16} position={[0.20,0.55]} rotation={-0.15} scale={0.8}/>
        <Part geometry={GEO_A.seam} color={palette.windowEmber} z={0.16} position={[0.98,0.95]} rotation={0.3} scale={0.55}/>
      </group>
    </group>
  );
}
KNIGHT_VARIANTS.a = {
  id: "a", name: "Cinderwright",
  blurb: "The smith who forged himself shut; a living forge gone cold.",
  faded: {},
  rig: (p: KnightGearProps) => <RigA {...p} />,
};

// ===== R-b : The Last Heir — spindly over-tall, collar-crowned =====
// Z-LADDER: train 0.05 · legs 0 · torso 0.02 · backArm -0.06 · neck 0.04 ·
//   skull 0.06 · frontArm 0.10 · collar 0.12 · crownRim 0.14 · cane 0.18
const GEO_B = {
  torso:  sg(poly([[-0.16,0],[0.16,0],[0.24,2.4],[-0.24,2.4]])),
  ribbon: sg(poly([[-0.30,0],[0.30,0],[0.10,0.9],[-0.20,0.7]])),
  leg:    sg(roundedRect(0.13, 1.25, 0.05)),
  foot:   sg(poly([[-0.10,0],[0.24,0],[0.20,0.14],[-0.10,0.14]])),
  arm:    sg(roundedRect(0.11, 1.20, 0.05)),
  neck:   sg(rect(0.14, 0.5)),
  skull:  sg(ellipse(0.30, 0.36)),
  slit:   sg(rect(0.10, 0.035)),
  crown:  sg(poly([[-0.62,0],[-0.40,0.75],[-0.24,0.25],[0,0.9],[0.24,0.25],[0.40,0.75],[0.62,0],[0.34,-0.10],[-0.34,-0.10]])),
  crownR: sg(poly([[0,0.9],[0.24,0.25],[0.18,0.22],[0,0.78]])),
  train:  sg(poly([[-0.10,0],[0.10,0],[0.55,-2.3],[-0.35,-2.3]])),
  cane:   sg(roundedRect(0.06, 2.0, 0.03)),
  knob:   sg(ellipse(0.10, 0.10)),
};

function RigB({ palette, world }: KnightGearProps) {
  const root = useRef<THREE.Group>(null), torso = useRef<THREE.Group>(null);
  const collar = useRef<THREE.Group>(null), train = useRef<THREE.Group>(null);
  const armF = useRef<THREE.Group>(null), legN = useRef<THREE.Group>(null), legF = useRef<THREE.Group>(null);
  const duckA = useRef(0), trainV = useRef(0);
  const L = (a:number,b:number,t:number)=>THREE.MathUtils.lerp(a,b,t);

  useFrame(() => {
    const k = world.kitty, run = k.runPhase, air = !k.grounded, dash = k.dashT||0;
    const on = world.status === "running";
    duckA.current = L(duckA.current, k.dashT > 0 ? 1 : 0, 0.18);
    const duck = duckA.current, p = run * Math.PI * 2;
    if (root.current) root.current.rotation.z = 0.02 + dash*0.22;
    if (torso.current) {                         // stately glide; folds forward + shrinks on duck
      torso.current.rotation.z = -dash*0.12 - duck*0.55;
      torso.current.scale.y = L(1, 0.42, duck);  // 3.6 -> ~1.9 top, clears gates
      torso.current.position.y = on ? Math.abs(Math.sin(p*2))*0.02 : 0;
    }
    // collar-crown swings DOWN on duck (capped so it never overshoots into the skull)
    collar.current!.rotation.z = -dash*0.15 + Math.min(1.3, duck*1.5) + (on?Math.sin(p)*0.03:0);
    const g = on ? 0.18 : 0.02;                  // near-levitating, tiny leg motion
    legN.current!.rotation.z = (air ? -0.15 : Math.sin(p)*g);
    legF.current!.rotation.z = (air ? -0.15 : Math.sin(p+Math.PI)*g);
    armF.current!.rotation.z = -0.05 + (air?0.1:Math.sin(p+Math.PI)*0.08) - dash*0.1;
    trainV.current = L(trainV.current, on?Math.sin(p*0.5)*0.4:0, 0.06);  // slow banner ripple
    train.current!.rotation.z = (0.15 + trainV.current) * (1 - dash) - dash*0.15; // snaps straight on dash
  });

  return (
    <group ref={root}>
      <group ref={legF} position={[-0.10, 1.15, 0]}>
        <Part geometry={GEO_B.leg}  color={palette.suitDeep} z={0} position={[0,-0.62]} />
        <Part geometry={GEO_B.foot} color={palette.kittyWhite} z={0} position={[0,-1.25]} />
      </group>
      <group ref={train} position={[-0.15, 2.2, 0.05]}>
        <Part geometry={GEO_B.train} color={palette.ash} z={0.05} position={[0,0]} />
      </group>
      <group ref={torso}>
        <Part geometry={GEO_B.torso}  color={palette.kittyWhite} z={0.02} position={[0,1.15]} />
        <Part geometry={GEO_B.ribbon} color={palette.ash} z={0.03} position={[0.10,1.4]} rotation={0.2}/>
        <Part geometry={GEO_B.ribbon} color={palette.ash} z={0.03} position={[-0.12,0.9]} rotation={-0.3} scale={0.8}/>
        <group ref={legN} position={[0.10, 1.15, 0.01]}>
          <Part geometry={GEO_B.leg}  color={palette.kittyWhite} z={0.01} position={[0,-0.62]} />
          <Part geometry={GEO_B.foot} color={palette.kittyWhite} z={0.01} position={[0,-1.25]} />
        </group>
        <Part geometry={GEO_B.arm} color={palette.kittyWhite} z={-0.06} position={[-0.22,3.0]} rotation={0.12}/>
        <group ref={armF} position={[0.22, 3.15, 0.10]}>
          <Part geometry={GEO_B.arm} color={palette.kittyWhite} z={0.10} position={[0,-0.6]} rotation={-0.05}/>
        </group>
        <Part geometry={GEO_B.neck}  color={palette.kittyWhite} z={0.04} position={[0,3.35]} />
        <Part geometry={GEO_B.skull} color={palette.kittyWhite} z={0.06} position={[0,3.75]} />
        <Part geometry={GEO_B.slit}  color={palette.kittyWhite} z={0.08} position={[-0.10,3.78]} />
        <Part geometry={GEO_B.slit}  color={palette.kittyWhite} z={0.08} position={[0.08,3.78]} />
        {/* funerary collar-crown: the unmistakable fanning top-shape, above the head line */}
        <group ref={collar} position={[0, 3.95, 0.12]}>
          <Part geometry={GEO_B.crown}  color={palette.cloudLit} z={0.12} position={[0,0]} />
          <Part geometry={GEO_B.crownR} color={palette.cloudLit} z={0.14} position={[0,0]} />
        </group>
      </group>
      {/* sceptre-cane it leans on — front, clear read */}
      <Part geometry={GEO_B.cane} color={palette.ash} z={0.18} position={[0.5,1.0]} rotation={0.06}/>
      <Part geometry={GEO_B.knob} color={palette.cloudLit} z={0.18} position={[0.52,2.0]} />
    </group>
  );
}
KNIGHT_VARIANTS.b = {
  id: "b", name: "The Last Heir",
  blurb: "The last noble of a starved court, crowned and collapsing.",
  faded: {},
  rig: (p: KnightGearProps) => <RigB {...p} />,
};

// ===== R-d : Bellbearer — stooped pilgrim, bell-led silhouette =====
// Z-LADDER: backLeg -0.08 · torso 0 · strap 0.03 · head 0.05 · bell 0.10 ·
//   bellRim 0.12 · crack 0.13 · nearLeg 0.10 · tags 0.14 · stave 0.18
const GEO_D = {
  torso:  sg(poly([[-0.44,0],[0.44,0],[0.38,1.5],[-0.30,1.6]])),
  wrap:   sg(roundedRect(0.6, 0.28, 0.10)),
  leg:    sg(roundedRect(0.24, 0.9, 0.07)),
  foot:   sg(poly([[-0.14,0],[0.28,0],[0.24,0.16],[-0.14,0.16]])),
  arm:    sg(roundedRect(0.18, 0.9, 0.06)),
  head:   sg(ellipse(0.30, 0.34)),
  bell:   sg(poly([[-0.62,0],[0.62,0],[0.74,0.15],[0.50,1.0],[0,1.25],[-0.50,1.0],[-0.74,0.15]])),
  bellR:  sg(poly([[0,1.25],[0.50,1.0],[0.74,0.15],[0.66,0.15],[0.44,0.98],[0,1.18]])),
  crack:  sg(poly([[0,0],[0.10,0.4],[-0.04,0.75],[0.12,1.0],[-0.06,0.5],[0.04,0.1]])),
  lip:    sg(rect(1.5, 0.10)),
  tag:    sg(poly([[-0.07,0],[0.07,0],[0,0.16]])),
  strap:  sg(rect(0.10, 1.2)),
  stave:  sg(roundedRect(0.06, 2.1, 0.03)),
};

function RigD({ palette, world }: KnightGearProps) {
  const root = useRef<THREE.Group>(null), body = useRef<THREE.Group>(null);
  const bell = useRef<THREE.Group>(null), tags = useRef<THREE.Group>(null);
  const legN = useRef<THREE.Group>(null), legF = useRef<THREE.Group>(null);
  const duckA = useRef(0), bellV = useRef(0);
  const L = (a:number,b:number,t:number)=>THREE.MathUtils.lerp(a,b,t);

  useFrame(() => {
    const k = world.kitty, run = k.runPhase, air = !k.grounded, dash = k.dashT||0;
    const on = world.status === "running";
    duckA.current = L(duckA.current, k.dashT > 0 ? 1 : 0, 0.20);
    const duck = duckA.current, p = run * Math.PI * 2;
    if (body.current) {                          // forward-pitched trudge; pitches fully forward on duck
      body.current.rotation.z = 0.10 + dash*0.2 + duck*0.65 + (on?Math.sin(p)*0.02:0);
      body.current.scale.y = L(1, 0.5, duck);
      body.current.position.y = on ? Math.abs(Math.sin(p*2))*0.03 : 0;
    }
    const st = on ? 0.45 : 0.04;
    legN.current!.rotation.z = (air ? 0.3 : Math.sin(p)*st) - duck*0.7;
    legF.current!.rotation.z = (air ? 0.3 : Math.sin(p+Math.PI)*st) + duck*0.3;
    // bell sways / lifts a beat late (heavy lag); clangs into lean on dash
    bellV.current = L(bellV.current, Math.sin(p*0.5)*0.18 - (air?0.25:0) + dash*0.4, 0.07);
    bell.current!.rotation.z = -bellV.current;
    tags.current!.rotation.z = Math.sin(p*0.5 + 0.6)*0.3 + dash*0.4;
  });

  return (
    <group ref={root}>
      <group ref={legF} position={[-0.18, 0.9, -0.08]}>
        <Part geometry={GEO_D.leg}  color={palette.suitDeep} z={-0.08} position={[0,-0.45]} />
        <Part geometry={GEO_D.foot} color={palette.suitDeep} z={-0.08} position={[0,-0.9]} />
      </group>
      <group ref={body}>
        <Part geometry={GEO_D.strap} color={palette.suitDeep} z={0.03} position={[-0.1,1.6]} rotation={0.25}/>
        <Part geometry={GEO_D.torso} color={palette.kittyWhite} z={0} position={[0,0]} />
        <Part geometry={GEO_D.wrap}  color={palette.ash} z={0.02} position={[0.02,1.1]} rotation={-0.05}/>
        <Part geometry={GEO_D.wrap}  color={palette.ash} z={0.02} position={[-0.02,0.6]} rotation={0.04} scale={0.9}/>
        <group ref={legN} position={[0.18, 0.9, 0.10]}>
          <Part geometry={GEO_D.leg}  color={palette.kittyWhite} z={0.10} position={[0,-0.45]} />
          <Part geometry={GEO_D.foot} color={palette.suitDeep} z={0.10} position={[0,-0.9]} />
        </group>
        <Part geometry={GEO_D.arm}  color={palette.kittyWhite} z={0.06} position={[0.30,1.15]} rotation={-0.4}/>
        <Part geometry={GEO_D.head} color={palette.kittyWhite} z={0.05} position={[0.10,1.85]} />
        <group ref={tags} position={[0.28, 1.4, 0.14]}>
          <Part geometry={GEO_D.tag} color={palette.ash} z={0.14} position={[0,-0.2]} />
          <Part geometry={GEO_D.tag} color={palette.ash} z={0.14} position={[0.1,-0.35]} scale={0.8}/>
        </group>
      </group>
      {/* great cracked bronze bell — rises ABOVE the head line, warm crack inside */}
      <group ref={bell} position={[-0.1, 2.05, 0.10]}>
        <Part geometry={GEO_D.bell}  color="#8a6a3a" z={0.10} position={[0,0]} />
        <Part geometry={GEO_D.bellR} color={palette.cloudLit} z={0.12} position={[0,0]} />
        <Part geometry={GEO_D.crack} color={palette.windowEmber} z={0.13} position={[-0.05,0.15]} />
        <Part geometry={GEO_D.lip}   color="#8a6a3a" z={0.10} position={[0,-0.05]} outlineColor={palette.outlineInk}/>
      </group>
      <Part geometry={GEO_D.stave} color={palette.suitDeep} z={0.18} position={[0.55,0.95]} rotation={0.05}/>
    </group>
  );
}
KNIGHT_VARIANTS.d = {
  id: "d", name: "Bellbearer",
  blurb: "A pilgrim carrying the last consecrated flame in a cracked bell.",
  faded: { "#8a6a3a": "#5a4830" },
  rig: (p: KnightGearProps) => <RigD {...p} />,
};

// ===== R-e : The Mycelian — wiry fungal warden, GROWN not forged =====
// Z-LADDER: threads 0.04 · legs 0 · torso 0.02 · capGlow 0.06 · cap 0.08 ·
//   shelves 0.10 · antler 0.12 · freckles 0.14
const GEO_E = {
  torso:  sg(poly([[-0.20,0],[0.20,0],[0.28,2.1],[-0.24,2.1]])),
  leg:    sg(roundedRect(0.15, 1.1, 0.05)),
  foot:   sg(poly([[-0.10,0],[0.22,0],[0.18,0.13],[-0.10,0.13]])),
  arm:    sg(roundedRect(0.12, 1.0, 0.05)),
  shelf:  sg(poly([[0,0],[0.5,0.05],[0.6,0.22],[0.42,0.30],[0,0.18]])),
  cap:    sg(poly([[-0.55,0],[-0.34,0.30],[0,0.46],[0.34,0.30],[0.55,0],[0.30,-0.06],[-0.30,-0.06]])),
  capU:   sg(ellipse(0.42, 0.14)),
  head:   sg(ellipse(0.26, 0.30)),
  antler: sg(poly([[0,0],[0.08,0.5],[-0.04,0.55],[0.14,0.9],[0.02,0.95],[0.20,1.3]])),
  branch: sg(poly([[0.14,0.9],[0.34,1.0],[0.30,1.06],[0.12,0.96]])),
  thread: sg(poly([[-0.05,0],[0.05,0],[0.18,-1.9],[-0.14,-1.9]])),
  freck:  sg(ellipse(0.05, 0.05)),
  slit:   sg(rect(0.09, 0.03)),
};

function RigE({ palette, world }: KnightGearProps) {
  const root = useRef<THREE.Group>(null), body = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Group>(null), threads = useRef<THREE.Group>(null);
  const shelves = useRef<THREE.Group>(null), antler = useRef<THREE.Group>(null);
  const armF = useRef<THREE.Group>(null), legN = useRef<THREE.Group>(null), legF = useRef<THREE.Group>(null);
  const duckA = useRef(0), threadV = useRef(0);
  const L = (a:number,b:number,t:number)=>THREE.MathUtils.lerp(a,b,t);

  useFrame(() => {
    const k = world.kitty, run = k.runPhase, air = !k.grounded, dash = k.dashT||0;
    const on = world.status === "running";
    duckA.current = L(duckA.current, k.dashT > 0 ? 1 : 0, 0.22);
    const duck = duckA.current, p = run * Math.PI * 2;
    if (root.current) root.current.rotation.z = dash*0.2;
    if (body.current) {                          // springy light; collapses cap + folds shelves on duck
      body.current.scale.y = L(1, 0.48, duck);
      body.current.position.y = on ? Math.abs(Math.sin(p*2))*0.06 : 0; // buoyant bounce
      body.current.rotation.z = -dash*0.14 - duck*0.2;
    }
    cap.current!.scale.set(L(1,1.2,duck), L(1,0.4,duck), 1);   // cap-hood collapses flat
    shelves.current!.scale.y = L(1, 0.3, duck);                // shelf-plates fold flat
    antler.current!.rotation.z = -0.1 + (on?Math.sin(p)*0.04:0) - duck*0.5;
    const g = on ? 0.35 : 0.03;
    legN.current!.rotation.z = (air ? -0.4 : Math.sin(p)*g);
    legF.current!.rotation.z = (air ? -0.4 : Math.sin(p+Math.PI)*g);
    armF.current!.rotation.z = -0.1 + (air?0.3:Math.sin(p+Math.PI)*0.2) - dash*0.4;
    threadV.current = L(threadV.current, (air?0.5:Math.sin(p*0.5)*0.3) + dash*0.5, 0.05); // billow/smear
    threads.current!.rotation.z = 0.1 + threadV.current;
  });

  return (
    <group ref={root}>
      <group ref={legF} position={[-0.12, 1.1, 0]}>
        <Part geometry={GEO_E.leg}  color={palette.suitDeep} z={0} position={[0,-0.55]} />
        <Part geometry={GEO_E.foot} color={palette.suitDeep} z={0} position={[0,-1.1]} />
      </group>
      <group ref={threads} position={[-0.18, 2.0, 0.04]}>
        <Part geometry={GEO_E.thread} color={palette.suitDeep} z={0.04} position={[0,0]} />
        <Part geometry={GEO_E.thread} color={palette.ash} z={0.04} position={[0.12,0.05]} rotation={0.12} scale={0.8}/>
      </group>
      <group ref={body}>
        <Part geometry={GEO_E.torso} color={palette.suitPink} z={0.02} position={[0,0]} />
        <group ref={legN} position={[0.12, 1.1, 0.01]}>
          <Part geometry={GEO_E.leg}  color={palette.suitPink} z={0.01} position={[0,-0.55]} />
          <Part geometry={GEO_E.foot} color={palette.suitDeep} z={0.01} position={[0,-1.1]} />
        </group>
        <Part geometry={GEO_E.arm} color={palette.suitDeep} z={-0.04} position={[-0.22,1.85]} rotation={0.1}/>
        <group ref={armF} position={[0.24, 1.9, 0.06]}>
          <Part geometry={GEO_E.arm} color={palette.suitPink} z={0.06} position={[0,-0.55]} rotation={-0.06}/>
        </group>
        {/* bracket-fungus shelving — front-face stacked, folds flat on duck */}
        <group ref={shelves}>
          <Part geometry={GEO_E.shelf} color={palette.suitDeep} z={0.10} position={[0.05,0.6]} />
          <Part geometry={GEO_E.shelf} color={palette.suitDeep} z={0.10} position={[0.02,1.1]} scale={0.85}/>
          <Part geometry={GEO_E.shelf} color={palette.suitDeep} z={0.10} position={[0.05,1.55]} scale={0.7}/>
        </group>
        {/* single antler-sprout — asymmetry, above the shoulder line */}
        <group ref={antler} position={[-0.22, 1.95, 0.12]}>
          <Part geometry={GEO_E.antler} color={palette.suitDeep} z={0.12} position={[0,0]} />
          <Part geometry={GEO_E.branch} color={palette.suitDeep} z={0.12} position={[0,0]} />
        </group>
        <Part geometry={GEO_E.head} color={palette.suitPink} z={0.05} position={[0.06,2.15]} />
        <Part geometry={GEO_E.slit} color={palette.cloudLit} z={0.06} position={[0.14,2.15]} />
        {/* cap-hood crown + one cap-glow (the sparse green) */}
        <group ref={cap} position={[0.05, 2.45, 0.08]}>
          <Part geometry={GEO_E.capU} color="#7fd48a" z={0.06} position={[0,-0.10]} />
          <Part geometry={GEO_E.cap}  color={palette.suitDeep} z={0.08} position={[0,0]} />
        </group>
        {/* spore-freckles: sparse green chroma channel */}
        <Part geometry={GEO_E.freck} color="#7fd48a" z={0.14} position={[0.20,1.3]} />
        <Part geometry={GEO_E.freck} color="#7fd48a" z={0.14} position={[-0.15,0.9]} scale={0.8}/>
        <Part geometry={GEO_E.freck} color="#7fd48a" z={0.14} position={[0.10,1.75]} scale={0.7}/>
        <Part geometry={GEO_E.freck} color="#7fd48a" z={0.14} position={[0.30,1.55]} scale={0.6}/>
      </group>
    </group>
  );
}
KNIGHT_VARIANTS.e = {
  id: "e", name: "The Mycelian",
  blurb: "The ash-forest warden, half-consumed by what it guards.",
  faded: { "#7fd48a": "#4f8a5a" },
  rig: (p: KnightGearProps) => <RigE {...p} />,
};
