# BRIEF — kitty-run × Dark Souls v2, deliverable 2: the gothic backdrop

You are implementing the **world backdrop** of the ashen-knight theme for an
existing game. You have no repo access — this brief contains every file and
value you need. Return **code only**, in the exact output format at the end.

## The scene you are working in

A side-scrolling endless runner. The camera looks at a cat running right
along a rolling ground band (ground top ≈ y 0.5–2). Behind her, a Parallax
component scrolls: a sky plane (z −16), 8 cloud sprites (z −6.5…−12), and
two tileable hill silhouettes (z −9 / −7). World span for scrolling layers
is 64 units wide; a group of two side-by-side copies wraps seamlessly.
Rendering uses react-three-fiber; textures are canvas-generated (zero image
assets) and must **tile seamlessly along x**.

## The art target (reference image, described)

A pixel-art Dark Souls vista: behind a tiny caped knight on a stone bridge
rises a **colossal gothic castle-city** — dozens of spires, towers,
buttresses, cathedral roofs — layered in **atmospheric perspective** (far
layers light desaturated blue-grey fading into mist, nearer layers step
down into deep slate). The dusk sky melts from slate blue into a warm
**ash-rose** horizon; long **streaky painterly clouds** are lit
**peach-orange from below** by a hidden sun. Tiny **ember windows** smolder
inside the castle mass. Cold blue-grey world, one warm ember family.

The new souls palette is already integrated. The keys you will use:

```ts
skyTop: "#3d4a5f", skyMid: "#78889f", skyBottom: "#b48f85",
sunCore: "#eaf0f6", sunHalo: "#c8d2dd", sunHaloSoft: "#8e9caf",
cloud: "#4f5c70", cloudLit: "#e8a878",
castleFar: "#8a929f", castleMid: "#5d6a7c", castleNear: "#323b49",
windowEmber: "#ffe09a", ash: "#c9c1b6",
```

## What you deliver

1. **New texture builders for textures.ts** (see its current content below):
   - `duskCloudTexture(seed: string, p: ThemePalette)` — a **streaky,
     underlit dusk cloud**: 2–4 long horizontal bands of dark slate
     (`p.cloud`) with a warm lit underside (`p.cloudLit`) where the hidden
     sunset catches them. Painterly: layered strokes, soft edges
     (shadowBlur), NOT puffy circles. Same 512×256 canvas as the current
     cloud (it maps onto a 2×1 plane). Must stay well under the bloom
     threshold (~#d9d9d9).
   - `castleTexture(color: string, seed: string, opts?: { windows?: string })`
     — a **tileable gothic skyline silhouette** (1024×256 canvas like
     `hillTexture`, transparent above, solid below, drawn three times at
     x, x±width with rng sampled once up front so the wraps match). The
     skyline is a **gothic city**: tall thin spires (steep curved needles),
     square towers with crenellated tops, cathedral bodies with pointed
     arches, buttresses, small roof ridges — varied heights, overlapping
     mass, a believable cathedral-city rhythm (not repeating teeth). The
     baseline is solid to the canvas bottom. When `opts.windows` is given,
     scatter sparse tiny lit windows **inside the silhouette mass** (small
     2–5 px rects/arcs in that colour with a slight glow, ~12–25 of them,
     denser near tower tops, none in the bottom 15% — nothing should read
     as a dotted grid; they must feel like distant habitations).
   - A `BACKDROPS` record driving which backdrop a character gets, keyed by
     `CharacterId` ("kitty" | "souls") — a **lookup, not conditionals**
     (the project's theme architecture forbids theme branches in scene
     code):

```ts
export type BackdropLayer = {
  build: (p: ThemePalette) => THREE.CanvasTexture;
  z: number;        // depth plane
  y: number;        // plane centre y
  height: number;   // plane height in world units
  speed: number;    // parallax fraction of run distance
  opacity?: number;
};
export type BackdropSpec = {
  layers: BackdropLayer[];
  cloud: { build: (seed: string, p: ThemePalette) => THREE.CanvasTexture; scale: number; opacity?: number } | null;
};
export const BACKDROPS: Record<CharacterId, BackdropSpec> = { /* … */ };
```

     - `kitty`: the **current** backdrop exactly — far hills (z −9, y 3.2,
       speed 0.22, height 9, opacity 0.85), near hills (z −7, y 2.4, speed
       0.42, height 9), puffy `cloudTexture` clouds (scale 1). The pastel
       look must stay **pixel-identical**: same builders, same numbers.
     - `souls`: THREE castle layers — far (misty, `castleFar`, tallest:
       tops may reach y ≈ 9–10, slow speed ≈ 0.12), mid (`castleMid`,
       tops ≈ y 6–7, speed ≈ 0.22), near (`castleNear`, tops ≈ y 4–5,
       speed ≈ 0.42, this one carries the `windowEmber` windows). All
       bottoms tuck below y 0 so no seam shows above the ground band.
       Pick plane heights/y values so the silhouettes read as a vast city,
       and keep the far layer semi-transparent (≈ 0.9) for mist. Streaky
       `duskCloudTexture` clouds (scale ≈ 1.4–1.8 so they read long and
       cinematic).
     - `textures.ts` must import `CharacterId` (type-only) from
       `../lib/theme.ts` (no import cycle — theme.ts only imports palette).
2. **Full replacement `Parallax.tsx`** (current content below): it reads
   `BACKDROPS[character]` once (useMemo on character), builds the layer
   textures + cloud textures, and renders them through the **unchanged**
   `ScrollingPlane` mechanics (two copies, wrap at SPAN). Keep the sky
   plane, the cloud sprite row (same 8-spec rng seed "kitty-run/clouds/v1"
   so both themes share positions; apply `spec.scale` from the backdrop's
   cloud style; keep drift/wrap logic), and the renderOrder discipline
   (sky −10, clouds −8, layers −5). No per-frame allocations.
3. **Full new `AshFall.tsx`** (`web/scene/AshFall.tsx`): slow falling ash
   motes for the souls mood only.
   - Props: `{ world: WorldState; palette: ThemePalette; character: CharacterId; reducedMotion: boolean }`.
   - Returns `null` unless `character === "souls"` (the one sanctioned
     presentation branch in this file).
   - ~60 motes: one `<instancedMesh>` of small quads with
     `softDotTexture()`, tinted `palette.ash`, additive-ish subtle look —
     `transparent`, opacity ≈ 0.4, depthWrite false, renderOrder −4 (in
     front of backdrop layers, behind clouds is fine too — your call, but
     motes must never draw over the character at z ≥ 0; keep z between
     −3 and −1).
   - Motion: each mote falls slowly (≈ 0.35–0.8 u/s) with a gentle
     sinusoidal sway (own phase/frequency); wraps within a span of 48 wide
     and y −1…9. Drive from `world.time` (a pure function of time — no
     per-mote state mutation), write matrices in useFrame with a reusable
     `THREE.Object3D` dummy. **No per-frame allocations.**
   - `reducedMotion`: render the motes but freeze the fall (static drift
     positions, or opacity 0.15 — pick one, say which).

## Hard constraints

- **Tileable along x** for every scrolling texture (the 3-copy draw
  pattern with rng sampled up front, exactly like `hillTexture`).
- Zero image assets; canvas only. No per-frame allocations in useFrame.
- Bloom: nothing you draw may exceed ≈ #d9d9d9 luminance except — via
  `skyTexture`'s moon, which already exists — nothing new. `windowEmber`
  (#ffe09a) intentionally rides just under the bloom knee.
- The near-castle layer must never visually bury the ground band: hazard
  crates live at y < 3 in front of it; keep the near silhouette airy
  (thin spires + gaps) rather than a solid wall below y ≈ 2.
- Pastel invariance: `BACKDROPS.kitty` must reproduce today's pastel
  backdrop bit-for-bit in look (same textures, same planes).
- Types: everything typed, no `any`; match the existing code style
  (concise comments only where they explain why).

## Current `textures.ts` (you are appending to it; reuse `hexRgb`,
`makeCanvas`, `toTexture`, `createRng`):

```ts
// Canvas-generated textures, so the project ships zero image assets. Every
// texture that scrolls is drawn to tile seamlessly along x.

import * as THREE from "three";
import { createRng } from "../lib/rng.ts";
import type { ThemePalette } from "../lib/theme.ts";

function hexRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function makeCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function skyTexture(p: ThemePalette): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, p.skyTop);
  gradient.addColorStop(0.62, p.skyMid);
  gradient.addColorStop(1, p.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const sunX = 396;
  const sunY = 172;
  const halo = hexRgb(p.sunHalo);
  const haloSoft = hexRgb(p.sunHaloSoft);
  const core = hexRgb(p.sunCore);
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 150);
  glow.addColorStop(0, `rgba(${halo.r}, ${halo.g}, ${halo.b}, 0.95)`);
  glow.addColorStop(0.25, `rgba(${haloSoft.r}, ${haloSoft.g}, ${haloSoft.b}, 0.5)`);
  glow.addColorStop(1, `rgba(${haloSoft.r}, ${haloSoft.g}, ${haloSoft.b}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = `rgba(${core.r}, ${core.g}, ${core.b}, 0.98)`;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
  ctx.fill();

  return toTexture(canvas);
}

export function cloudTexture(seed: string, p: ThemePalette): THREE.CanvasTexture {
  const rng = createRng(seed);
  const { canvas, ctx } = makeCanvas(512, 256);
  const puffs = 5 + Math.floor(rng() * 3);
  const hex = p.cloud.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.93)`;
  ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
  ctx.shadowBlur = 14;
  for (let i = 0; i < puffs; i += 1) {
    const t = puffs === 1 ? 0.5 : i / (puffs - 1);
    const x = 120 + t * 270 + (rng() - 0.5) * 40;
    const y = 150 - Math.sin(t * Math.PI) * 52 - rng() * 18;
    const r2 = 34 + Math.sin(t * Math.PI) * 40 + rng() * 12;
    ctx.beginPath();
    ctx.arc(x, y, r2, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(canvas);
}

export function hillTexture(
  color: string,
  humps: number,
  seed: string,
): THREE.CanvasTexture {
  const rng = createRng(seed);
  const width = 1024;
  const height = 256;
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;

  const humpWidth = width / humps;
  const shapes: { controlY: number; endY: number }[] = [];
  for (let i = 0; i < humps; i += 1) {
    const rise = 40 + rng() * 50;
    shapes.push({
      controlY: height - 60 - rise * 2,
      endY: height - 55 - rng() * 20,
    });
  }

  const drawHumps = (offset: number) => {
    ctx.beginPath();
    ctx.moveTo(offset, height);
    ctx.lineTo(offset, height - 60);
    let x = offset;
    for (const shape of shapes) {
      ctx.quadraticCurveTo(
        x + humpWidth / 2,
        shape.controlY,
        x + humpWidth,
        shape.endY,
      );
      x += humpWidth;
    }
    ctx.lineTo(offset + width, height);
    ctx.closePath();
    ctx.fill();
  };

  drawHumps(0);
  drawHumps(-width);
  drawHumps(width);

  const texture = toTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function softDotTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128, 128);
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.55)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return toTexture(canvas);
}

export function crateTexture(p: ThemePalette): THREE.CanvasTexture {
  const rng = createRng("kitty-run/crate/v1");
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = p.obstaclePlum;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = p.obstacleDeep;
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, 238, 238);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = 44 + col * 56 + (row % 2 === 0 ? 0 : 28);
      const y = 44 + row * 56;
      ctx.fillStyle = p.obstacleDot;
      ctx.beginPath();
      ctx.arc(x, y, 9 + rng() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return toTexture(canvas);
}
```

## Current `Parallax.tsx` (you are rewriting it):

```tsx
// Layered pastel backdrop: gradient sky with a baked sun, drifting cloud
// puffs, and two tileable hill silhouettes. Every layer scrolls at its own
// fraction of the run distance — the parallax that sells the depth.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createRng } from "../lib/rng.ts";
import { paletteFor, type CharacterId } from "../lib/theme.ts";
import { cloudTexture, hillTexture, skyTexture } from "../lib/textures.ts";
import type { WorldState } from "./world.ts";

const SPAN = 64;
const PLANE_WIDTH = SPAN;
const PLANE_HEIGHT = 9;

type CloudSpec = {
  x: number;
  y: number;
  size: number;
  z: number;
  speed: number;
  drift: number;
};

function wrap(value: number, span: number): number {
  return ((value % span) + span) % span;
}

// Two side-by-side copies of a tileable plane; the group wraps once per
// span, so coverage never shows an edge.
function ScrollingPlane(props: {
  map: THREE.Texture;
  z: number;
  y: number;
  speed: number;
  distance: number;
  opacity?: number;
  height?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.x = -wrap(props.distance * props.speed, SPAN);
  });
  return (
    <group ref={groupRef}>
      {[0, 1].map((i) => (
        <mesh
          key={i}
          position={[i * PLANE_WIDTH, props.y, props.z]}
          renderOrder={-5}
        >
          <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
          <meshBasicMaterial
            map={props.map}
            transparent
            opacity={props.opacity ?? 1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Parallax({
  world,
  character,
}: {
  world: WorldState;
  character: CharacterId;
}) {
  // The theme is read as a prop, so a character switch rebuilds exactly
  // these textures (same seeds — same shapes, new colours).
  const palette = paletteFor(character);
  const skyMap = useMemo(() => skyTexture(palette), [palette]);
  const cloudMaps = useMemo(
    () => [0, 1, 2].map((i) => cloudTexture(`kitty-run/cloud/${i}`, palette)),
    [palette],
  );
  const farMap = useMemo(
    () => hillTexture(palette.hillFar, 5, "kitty-run/hills/far"),
    [palette],
  );
  const nearMap = useMemo(
    () => hillTexture(palette.hillNear, 4, "kitty-run/hills/near"),
    [palette],
  );

  const clouds = useMemo<CloudSpec[]>(() => {
    const rng = createRng("kitty-run/clouds/v1");
    return Array.from({ length: 8 }, () => ({
      x: rng() * SPAN,
      y: 3.4 + rng() * 4.8,
      size: 2.4 + rng() * 2.8,
      z: -6.5 - rng() * 5.5,
      speed: 0.05 + rng() * 0.1,
      drift: 0.08 + rng() * 0.14,
    }));
  }, []);
  const cloudRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    for (let i = 0; i < clouds.length; i += 1) {
      const mesh = cloudRefs.current[i];
      if (!mesh) continue;
      const spec = clouds[i];
      const value = spec.x - world.distance * spec.speed - world.time * spec.drift;
      mesh.position.x = wrap(value, SPAN) - SPAN / 2;
    }
  });

  return (
    <>
      <mesh position={[0, 4.5, -16]} renderOrder={-10}>
        <planeGeometry args={[72, 30]} />
        <meshBasicMaterial map={skyMap} depthWrite={false} />
      </mesh>

      {clouds.map((spec, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            cloudRefs.current[i] = mesh;
          }}
          position={[spec.x - SPAN / 2, spec.y, spec.z]}
          scale={spec.size}
          renderOrder={-8}
        >
          <planeGeometry args={[2, 1]} />
          <meshBasicMaterial
            map={cloudMaps[i % cloudMaps.length]}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}

      <ScrollingPlane
        map={farMap}
        z={-9}
        y={3.2}
        speed={0.22}
        distance={world.distance}
        opacity={0.85}
      />
      <ScrollingPlane
        map={nearMap}
        z={-7}
        y={2.4}
        speed={0.42}
        distance={world.distance}
      />
    </>
  );
}
```

(Note: the current file's `ScrollingPlane` has no `height` prop — the two
hills planes are both height 9. You may add the `height` prop as shown so
the castle layers can differ; keep everything else about the wrap
mechanics identical.)

For `AshFall.tsx`: `WorldState` (from `./world.ts`) exposes at least
`time: number` and `distance: number`. `softDotTexture()` is exported from
`../lib/textures.ts` and is white — tint it with `palette.ash` via the
material's `color`. Do NOT mount AshFall inside Parallax yourself; a later
integration wires `<AshFall …>` into the scene tree next to `<Parallax …>`.
(You still deliver the full component.)

## Required output format (exactly three code blocks + notes)

1. **textures.ts additions** — one TS block: the new `duskCloudTexture`,
   `castleTexture`, the `BackdropLayer`/`BackdropSpec` types, and
   `BACKDROPS`, with the needed imports stated in a comment (I will wire
   them into the file header).
2. **Full `Parallax.tsx`** — one TSX block, complete file.
3. **Full `AshFall.tsx`** — one TSX block, complete file.
4. **Notes** — ≤ 8 bullets: layer geometry choices, window placement
   strategy, anything you had to assume.
