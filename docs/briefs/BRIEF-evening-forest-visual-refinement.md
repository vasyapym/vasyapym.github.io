# BRIEF — Evening Forest: one qualitative visual-refinement pass

You are the design-and-code specialist for a shipped web game. You cannot see
the repository — this brief contains every fact and every line of code you
need. You will decide the design direction yourself and write the actual
implementation; an integrator will drop your files into the repo verbatim and
run the verification gates.

---

## 1. What the project is

"Evening Forest" is a calm first-person walking simulator at dusk,
Proteus-inspired: no missions, no combat, no fail state — a fantasy woodland
rendered through an 8-bit post-processing pass. The visitor spawns on a
meadow facing straight into the sunset (a fox freezes and stares back ~11 m
ahead), then wanders a ~230 m fog-eaten clearing while a dusk dial (or `[` /
`]`) sweeps time of day from golden hour through deep night to sunrise.

Tech: `@react-three/fiber` + `three` (r155+, physical light units) +
`postprocessing`, TypeScript strict, Vite. Everything is procedural primitives
and shaders — zero image/audio assets, and the owner wants to keep it that
way.

## 2. The task: make it look BETTER, not BIGGER

The owner's ask for this pass, verbatim in spirit:

> Improve the visuals. The goal is **qualitative, not quantitative**: do NOT
> add more assets, props, or environmental clutter. Prioritize **refining**
> what already exists — light, colour, atmosphere, material, motion feel,
> composition.

You have full freedom over the design direction. Refine whatever you judge
highest-leverage within the file whitelist below. The 8-bit pixelated dusk
look IS the identity — deepen it, don't replace it.

## 3. How the visual pipeline works (facts you must code against)

- **Pixel budget.** The canvas renders at 0.36 / 0.31 / 0.26 device-pixel
  ratio (quality tiers) and CSS-upscales with `image-rendering: pixelated`.
  On a 1280×720 window the internal buffer is roughly 460×260. Detail finer
  than ~3 device pixels is wasted; think in big shapes and strong values.
- **Post chain.** `EffectComposer` (no multisampling) → `Bloom` (mipmapBlur,
  intensity 0.65/0.55/0.45 by tier, luminanceThreshold 0.52, smoothing 0.25)
  → the custom `PosterizeDither` effect (grade + 4×4 Bayer ordered dither +
  6-level quantisation) → `Vignette` (offset 0.3, darkness 0.42). Note the
  order: bloom happens BEFORE quantisation, so its gradients get crushed to
  bands by the dither.
- **Daylight engine.** `lib/daylight.ts` is pure TS: five keyframes on a
  time-of-day t ∈ [0,1] — t=0 golden hour, t=0.3 late dusk, t=0.55 night,
  t=0.8 pre-dawn, t=1 sunrise — smoothstep-interpolated into one
  `DaylightSample`. `scene/DaylightDriver.tsx` samples it once per frame and
  writes: sky-dome uniforms (`uZenith/uUpper/uBand/uHorizon/uSunDirection/
  uSunColor`, all `.setRGB(..., THREE.SRGBColorSpace)`), `uSunHalo =
  Math.min(sunIntensity / 3.2, 1)`, hemisphere + directional light colors and
  intensities (`intensity × π` — the single r155 physical-units conversion),
  `scene.fog` (FogExp2 color + density), the WebGL clear colour, and the
  three shared effect gains `daylightGains.star / .firefly / .shaft`
  (module-level `{ value }` uniform objects in `lib/clock.ts`).
- **Shared clocks.** `windUniform` (seconds, advanced once per frame, ×0.3
  under prefers-reduced-motion) drives every shader animation;
  `playerPositionUniform` (Vector3) tracks the walker.
- **Materials.** Everything is `MeshLambertMaterial` (no PBR). Foliage sway
  is injected via `applyWind(material, strength, referenceHeight)` — see
  wind.ts below; replacement foliage code MUST keep calling it.
- **Scene inventory.** Sky = BackSide sphere r=300 (renderOrder −10, no fog).
  Terrain = one 520u plane, 224×224 segments, heights from
  `lib/heightfield.ts`, per-vertex colours × a canvas-generated grain
  texture. Trees = 4 InstancedMeshes (pine trunks/crowns, broadleaf
  trunks/crowns) placed by `collectSpots()` from `lib/tree-field.ts`. Grass =
  one instanced blade tile that replants in whole-tile steps around the
  walker. Light shafts = 9 crossed additive gradient planes. Fireflies = 150
  GPU-drifted additive points. Plus a procedural fox (out of scope here).

## 4. Standing constraints (owner history + integration contract)

These are hard. The integrator runs typecheck, build, a 60-assertion node
check, and screenshot probes; anything violating them will be rejected.

1. **Whitelist.** You may return replacements ONLY for files from §5, at
   most **6 files**, each as one complete drop-in file. No new files, no
   renamed exports, no new npm dependencies.
2. **`daylight.ts` contract.** Keep the exports `sampleDaylight(timeOfDay)`
   and `phaseName(t)` and the `DaylightSample` type fields exactly as they
   are (the driver and tests consume every field; do not add or remove
   fields). Do not touch `phaseName` (its thresholds are asserted). Keyframe
   positions `t` and every colour/number value are yours to retune. The head
   less check asserts, across the whole arc:
   - every colour channel ∈ [0,1]; `fogDensity > 0` and finite; gains
     `starGain/fireflyGain/shaftGain` ∈ [0,1];
   - `sampleDaylight(0.55)` (night) is dimmer than both anchors:
     `hemiIntensity` AND `sunIntensity` both strictly less than at t=0 and
     (sunIntensity) than at t=1;
   - `starGain` at night > starGain at golden hour; `shaftGain` at night <
     at golden hour;
   - smoothness: neighbouring samples 0.004 apart differ by < 0.002 in
     `fogDensity` (i.e. keyframe values must stay close enough that the
     smoothstep interpolation never jumps);
   - clamping: `sampleDaylight(-3)` equals `sampleDaylight(0)`, same at the
     top end.
3. **`palette.ts` contract.** Keep every existing key with its role (terrain/
   foliage/grass/firefly/shaft/fox trio/sky/fog/hemi/directional) — other
   files, including the out-of-scope Fox, import them. You may retune hex
   values; do not add, remove, or rename keys; keep the `SUN_DIRECTION` and
   `FOG_DENSITY` exports.
4. **`DuskSky.tsx` contract.** Keep the uniform names, the
   `duskSkyUniforms` registry export, the component export, the BackSide
   sphere approach, and GLSL ES 1.0 style (`gl_FragColor`, `varying`,
   hash helpers — no `texture()`, no loops beyond a 2-octave FBM, no heavy
   branching). The material's default colours must keep describing the
   golden-hour opening frame. A **painterly drifting cloud band** is an
   explicitly welcome refinement (it was already scoped as the sky's biggest
   missing "alive" element): Proteus-style — soft shapes, strong colour, no
   texture detail, mostly-open sky, stars dimming behind clouds.
5. **`RetroEffects.tsx` contract.** Keep the `composerSupported()` guard,
   the Effect/wrapEffect class pattern, `ResolutionSync`, and the composer
   structure. Grade, dither strength, levels, bloom defaults, vignette are
   yours.
6. **`Trees.tsx` contract.** Keep `collectSpots()` as the only placement
   source (tree colliders for walking collision come from the same field —
   do not alter placement, counts, or scales logic), keep the four
   instanced-mesh structure and `applyWind` on both crown materials.
   Per-instance tint jitter (seeded, deterministic) is explicitly welcome —
   a previous attempt added it and it was lost; the forest currently reads
   as clone trees. Geometry edits are allowed if they stay procedural.
7. **`Grass.tsx` contract.** Keep the tile-replant mechanics and `applyWind`.
   Blade shape, gradients, tints are yours.
8. **`Terrain.tsx` contract.** Keep the heightfield-driven geometry; the
   vertex-colour painting and grain usage are yours.
9. **`Fireflies.tsx` / `LightShafts.tsx` contracts.** Keep component names,
   additive blending, `renderOrder`, and the `daylightGains.firefly/shaft`
   uniform links. Their look is yours.
10. **`textures.ts` contract.** Keep `makeGrainTexture(size?)` returning a
    `THREE.CanvasTexture` with repeat wrapping.
11. **Determinism.** No `Math.random` anywhere in your replacements.
    (Fireflies currently re-seeds its swarm with `Math.random` — fixing that
    to a seeded rng is a welcome refinement.) Use `createRng(seed)` from
    rng.ts (its API is below).
12. **Mood law.** The dark night middle is a standing owner constraint — a
    previous "moonlit night" brightness lift was reverted by the owner. Both
    bright anchors stay bright ("too dark" is always one slide away from
    fixed). Improve night via COLOUR and silhouette (cooler separation,
    star/moon presence, rim contrast), never by lifting overall brightness.
13. **8-bit identity.** Pixelation, ordered dithering and palette crunch
    stay; they are the game's signature, not a bug.
14. **Style.** TypeScript strict-clean. Keep the repo's commenting style —
    the existing files carry short explanatory comments; keep/extend them.
    GLSL in the existing dialect. No `any` escapes.

## 5. Files you may revise — complete current contents

### `web/lib/daylight.ts`

```ts
// The daylight engine: one number — time of day, 0..1 — expands into every
// lighting decision the forest makes. Pure TypeScript over plain arrays and
// numbers (no three.js), so tests can sweep the whole arc headlessly and
// the renderer just copies the sample into uniforms each frame.
//
// The arc runs evening → night → sunrise. Both ends are bright (golden
// hour, then full sunrise); the middle dips into deep night where only
// fireflies and stars carry the scene. Visitors who find the forest too
// dark can simply drag toward sunrise.

export type Rgb = [number, number, number];

export type DaylightSample = {
  // Sky gradient stops, bottom to top.
  horizon: Rgb;
  band: Rgb;
  upper: Rgb;
  zenith: Rgb;
  fog: Rgb;
  fogDensity: number;
  hemiSky: Rgb;
  hemiGround: Rgb;
  hemiIntensity: number;
  sunColor: Rgb;
  sunIntensity: number;
  // Unit-ish direction; the renderer normalises. At night this is the moon.
  sunDir: [number, number, number];
  starGain: number;
  fireflyGain: number;
  shaftGain: number;
};

function hex(value: string): Rgb {
  const n = Number.parseInt(value.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

type DaylightKey = DaylightSample & { t: number };

const GOLDEN_HOUR: DaylightKey = {
  t: 0,
  horizon: hex("#f2955a"),
  band: hex("#b06a86"),
  upper: hex("#58409a"),
  zenith: hex("#3a2a66"),
  fog: hex("#9a6a72"),
  fogDensity: 0.0105,
  hemiSky: hex("#b3aadf"),
  hemiGround: hex("#63513a"),
  hemiIntensity: 2.9,
  sunColor: hex("#ffb066"),
  sunIntensity: 2.8,
  sunDir: [-0.42, 0.2, -0.86],
  starGain: 0.05,
  fireflyGain: 0.35,
  shaftGain: 1,
};

const LATE_DUSK: DaylightKey = {
  t: 0.3,
  horizon: hex("#d4744a"),
  band: hex("#8a5078"),
  upper: hex("#40307e"),
  zenith: hex("#241a4a"),
  fog: hex("#6e4a60"),
  fogDensity: 0.013,
  hemiSky: hex("#8f86cc"),
  hemiGround: hex("#2c2018"),
  hemiIntensity: 2.1,
  sunColor: hex("#ff8a4d"),
  sunIntensity: 1.8,
  sunDir: [-0.42, 0.08, -0.86],
  starGain: 0.45,
  fireflyGain: 0.85,
  shaftGain: 0.55,
};

const NIGHT: DaylightKey = {
  t: 0.55,
  horizon: hex("#54486a"),
  band: hex("#3a3560"),
  upper: hex("#232a54"),
  zenith: hex("#10142c"),
  fog: hex("#3c3a56"),
  fogDensity: 0.014,
  hemiSky: hex("#6a72a8"),
  hemiGround: hex("#171420"),
  hemiIntensity: 1.4,
  sunColor: hex("#bcd2ff"),
  sunIntensity: 1.1,
  sunDir: [-0.25, 0.62, -0.45],
  starGain: 1,
  fireflyGain: 1,
  shaftGain: 0,
};

const PRE_DAWN: DaylightKey = {
  t: 0.8,
  horizon: hex("#a06a5c"),
  band: hex("#5c4a70"),
  upper: hex("#33406e"),
  zenith: hex("#1c2140"),
  fog: hex("#57495e"),
  fogDensity: 0.012,
  hemiSky: hex("#8286b8"),
  hemiGround: hex("#221d1c"),
  hemiIntensity: 1.8,
  sunColor: hex("#ffa878"),
  sunIntensity: 1.6,
  sunDir: [-0.42, 0.12, -0.86],
  starGain: 0.5,
  fireflyGain: 0.7,
  shaftGain: 0.25,
};

const SUNRISE: DaylightKey = {
  t: 1,
  horizon: hex("#ffc27d"),
  band: hex("#d88a6a"),
  upper: hex("#8a90c4"),
  zenith: hex("#4a6899"),
  fog: hex("#a98a80"),
  fogDensity: 0.0095,
  hemiSky: hex("#b7bede"),
  hemiGround: hex("#46382a"),
  hemiIntensity: 3.2,
  sunColor: hex("#ffd9a0"),
  sunIntensity: 3.6,
  sunDir: [-0.42, 0.3, -0.86],
  starGain: 0,
  fireflyGain: 0.15,
  shaftGain: 0.9,
};

// Ordered by t; the sampler walks this table.
const KEYS: DaylightKey[] = [
  GOLDEN_HOUR,
  LATE_DUSK,
  NIGHT,
  PRE_DAWN,
  SUNRISE,
];

const COLOR_KEYS = [
  "horizon",
  "band",
  "upper",
  "zenith",
  "fog",
  "hemiSky",
  "hemiGround",
  "sunColor",
] as const;

const NUMBER_KEYS = [
  "fogDensity",
  "hemiIntensity",
  "sunIntensity",
  "starGain",
  "fireflyGain",
  "shaftGain",
] as const;

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Expands a time of day into a full lighting snapshot. Clamps out-of-range
// times to the ends of the arc rather than wrapping: the walk has two
// bright anchors and one dark middle, not a loop.
export function sampleDaylight(timeOfDay: number): DaylightSample {
  const t = Math.min(Math.max(timeOfDay, 0), 1);
  let lo = KEYS[0];
  let hi = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i += 1) {
    if (t >= KEYS[i].t && t <= KEYS[i + 1].t) {
      lo = KEYS[i];
      hi = KEYS[i + 1];
      break;
    }
  }
  const span = hi.t - lo.t;
  const raw = span <= 0 ? 0 : (t - lo.t) / span;
  const k = smooth(raw);

  const out = {} as DaylightSample;
  for (const key of COLOR_KEYS) {
    const a = lo[key];
    const b = hi[key];
    out[key] = [
      lerp(a[0], b[0], k),
      lerp(a[1], b[1], k),
      lerp(a[2], b[2], k),
    ];
  }
  for (const key of NUMBER_KEYS) {
    out[key] = lerp(lo[key], hi[key], k);
  }
  out.sunDir = [
    lerp(lo.sunDir[0], hi.sunDir[0], k),
    lerp(lo.sunDir[1], hi.sunDir[1], k),
    lerp(lo.sunDir[2], hi.sunDir[2], k),
  ];
  return out;
}

// Human-readable label for the current stretch of the arc; drives the dial
// caption in the UI.
export function phaseName(timeOfDay: number): string {
  const t = Math.min(Math.max(timeOfDay, 0), 1);
  if (t < 0.15) return "Golden hour";
  if (t < 0.42) return "Dusk";
  if (t < 0.68) return "Night";
  if (t < 0.9) return "Pre-dawn";
  return "Sunrise";
}
```

### `web/lib/palette.ts`

```ts
import * as THREE from "three";

// One dusk palette shared by every surface, shader and light. THREE.Color
// converts hex to linear working space automatically, so authored values can
// stay in familiar sRGB terms.
// Values are lifted ~20-30% above pure dusk realism: at 0.36 dpr with
// 6-level quantisation, physically-plausible darks collapse into mud, so
// every surface is authored one stop brighter than it "should" be.
export const PALETTE = {
  zenith: "#2a1c4e",
  upper: "#45307a",
  band: "#96567e",
  horizon: "#e0824a",
  fog: "#825364",

  hemiSky: "#7d5fb5",
  hemiGround: "#33261d",
  directional: "#ffa257",

  terrainLow: "#3d5c33",
  terrainMid: "#4f7f46",
  terrainDry: "#857a42",
  dirt: "#63503a",

  trunk: "#5f4630",
  pine: "#2c5538",
  leaf: "#527f45",
  leafAmber: "#c97e3a",

  grassLow: "#3d6631",
  grassTip: "#a8933a",

  firefly: "#ffdf8e",
  shaft: "#ffc27d",

  fox: "#c25e2a",
  foxCream: "#e8d5b0",
  foxDark: "#5f2f14",
} as const;

export type PaletteKey = keyof typeof PALETTE;

export const COLORS = Object.fromEntries(
  Object.entries(PALETTE).map(([key, hex]) => [key, new THREE.Color(hex)]),
) as Record<PaletteKey, THREE.Color>;

// Low sun toward -Z: the spawn point faces straight into the sunset.
export const SUN_DIRECTION = new THREE.Vector3(-0.42, 0.18, -0.86).normalize();
// Tuned so the treeline reads to roughly 140m before the murk wins; the
// world's far edge dissolves instead of stopping.
export const FOG_DENSITY = 0.0125;
```

### `web/scene/DuskSky.tsx`

```tsx
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { daylightGains, windUniform } from "../lib/clock";

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uUpper;
  uniform vec3 uBand;
  uniform vec3 uHorizon;
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform float uSunHalo;
  uniform float uStarGain;
  uniform float uTime;
  varying vec3 vDirection;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec3 dir = normalize(vDirection);
    float h = dir.y;
    float sunAmount = max(dot(dir, uSunDirection), 0.0);

    vec3 col = mix(uHorizon, uBand, smoothstep(0.0, 0.14, h));
    col = mix(col, uUpper, smoothstep(0.10, 0.40, h));
    col = mix(col, uZenith, smoothstep(0.36, 0.92, h));

    // Warm halo and a small soft sun disc sitting on the treeline. Both
    // scale with uSunHalo so night's moon stays a quiet cool point.
    col += uSunColor * pow(sunAmount, 8.0) * 0.55 * uSunHalo;
    col += mix(uSunColor, vec3(1.0, 0.98, 0.9), 0.4) *
      pow(sunAmount, 240.0) * 1.6 * uSunHalo;

    // Sparse twinkling stars in the upper violet.
    float cell = hash13(floor(dir * 190.0));
    float starMask = step(0.9986, cell) * smoothstep(0.30, 0.75, h);
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.6 + cell * 90.0);
    col += vec3(0.85, 0.9, 1.0) * starMask * twinkle * 0.7 * uStarGain;

    // Below the horizon the sky sinks into dark ground haze.
    col = mix(col, vec3(0.05, 0.04, 0.07), smoothstep(0.0, -0.12, h));

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Registry the material publishes its uniforms into on mount, so
// DaylightDriver can retint the sky each frame without prop threading
// through the scene tree.
export const duskSkyUniforms: {
  current: Record<string, THREE.IUniform> | null;
} = { current: null };

// The sky dome. All colors, the sun direction and the star brightness are
// uniforms driven by DaylightDriver each frame; the defaults here are the
// golden-hour opening state so the first frame is already correct.
export function DuskSky() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uZenith: { value: new THREE.Color("#3a2a66") },
        uUpper: { value: new THREE.Color("#58409a") },
        uBand: { value: new THREE.Color("#b06a86") },
        uHorizon: { value: new THREE.Color("#f2955a") },
        uSunDirection: { value: new THREE.Vector3(-0.42, 0.16, -0.86) },
        uSunColor: { value: new THREE.Color("#ffb066") },
        uSunHalo: { value: 1 },
        uStarGain: daylightGains.star,
        uTime: windUniform,
      },
    });
  }, []);

  const geometry = useMemo(() => new THREE.SphereGeometry(300, 32, 20), []);

  useEffect(() => {
    duskSkyUniforms.current = material.uniforms;
    return () => {
      duskSkyUniforms.current = null;
    };
  }, [material]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      renderOrder={-10}
      frustumCulled={false}
    />
  );
}
```

### `web/scene/RetroEffects.tsx`

```tsx
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  Vignette,
  wrapEffect,
} from "@react-three/postprocessing";
import { BlendFunction, Effect } from "postprocessing";

// The 8-bit pass: a gentle dusk grade, ordered dithering (4x4 Bayer matrix)
// and palette quantisation in one fragment shader. Pixelation itself is
// free — the Canvas renders at ~0.36 device pixels and CSS upscales it
// with image-rendering: pixelated.
const FRAGMENT_SHADER = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uLevels;
  uniform float uStrength;

  // Compact recursive Bayer: bayer2 tiled at half frequency builds bayer4.
  float bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x * 0.5 + a.y * a.y * 0.75);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;

    // Dusk readability: warm the mids, lift the toe just enough that the
    // shadow side of the meadow keeps texture after 6-level quantisation.
    c = pow(c, vec3(0.88, 0.94, 0.86));
    c += vec3(0.015, 0.008, 0.03);

    vec2 pixel = floor(uv * uResolution);
    float bayer = bayer2(pixel * 0.5) * 0.25 + bayer2(pixel);
    vec3 quantised = floor(c * uLevels + (bayer - 0.5) * uStrength) / uLevels;
    quantised = clamp(quantised, 0.0, 1.0);

    outputColor = vec4(quantised, inputColor.a);
  }
`;

class PosterizeDitherEffect extends Effect {
  constructor() {
    super("PosterizeDitherEffect", FRAGMENT_SHADER, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["uResolution", new THREE.Uniform(new THREE.Vector2(512, 288))],
        ["uLevels", new THREE.Uniform(6)],
        ["uStrength", new THREE.Uniform(1)],
      ]),
    });
  }
}

const PosterizeDither = wrapEffect(PosterizeDitherEffect);

// The postprocessing composer needs renderable float frame buffers; some
// Safari builds refuse them and would crash the whole canvas. The forest
// reads fine without the grade — degrade instead of dying.
function composerSupported(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
    if (!gl) return false;
    return Boolean(
      gl.getExtension("EXT_color_buffer_float") ||
        gl.getExtension("EXT_color_buffer_half_float"),
    );
  } catch {
    return false;
  }
}

const composerOk = composerSupported();

// The drawing buffer size changes on resize; keep the dither grid locked to
// real device pixels so the pattern never swims.
function ResolutionSync({
  handle,
}: {
  handle: React.RefObject<PosterizeDitherEffect | null>;
}) {
  const size = useMemo(() => new THREE.Vector2(), []);
  useFrame(({ gl }) => {
    gl.getDrawingBufferSize(size);
    handle.current?.uniforms.get("uResolution")?.value.copy(size);
  });
  return null;
}

export function RetroEffects({
  bloomIntensity = 0.65,
}: {
  bloomIntensity?: number;
}) {
  const ditherRef = useRef<PosterizeDitherEffect | null>(null);

  if (!composerOk) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={bloomIntensity}
        luminanceThreshold={0.52}
        luminanceSmoothing={0.25}
      />
      <PosterizeDither ref={ditherRef} />
      <Vignette offset={0.3} darkness={0.42} eskil={false} />
      <ResolutionSync handle={ditherRef} />
    </EffectComposer>
  );
}
```

### `web/scene/Terrain.tsx`

```tsx
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "../lib/palette";
import {
  TERRAIN_SIZE,
  terrainHeight,
  groundNoise,
  smoothstep,
} from "../lib/heightfield";
import { makeGrainTexture } from "../lib/textures";

// One displaced plane. Height comes from the shared heightfield; colour is
// painted per-vertex (meadow greens by altitude, dirt patches from the same
// noise field), then multiplied by a neutral grain texture for texture.
export function Terrain() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 224, 224);
    g.rotateX(-Math.PI / 2);
    const position = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);

    const low = COLORS.terrainLow;
    const mid = COLORS.terrainMid;
    const dry = COLORS.terrainDry;
    const dirt = COLORS.dirt;
    const tint = new THREE.Color();

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const h = terrainHeight(x, z);
      position.setY(i, h);

      tint.copy(low).lerp(mid, smoothstep(-2.2, 3.4, h));
      if (h > 2.6) {
        tint.lerp(dry, smoothstep(2.6, 4.6, h) * 0.65);
      }
      const n = groundNoise(x * 0.16 + 40, z * 0.16 - 17);
      tint.lerp(dirt, smoothstep(0.62, 0.82, n) * 0.55);

      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  const grain = useMemo(() => makeGrainTexture(), []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      grain.dispose();
    };
  }, [geometry, grain]);

  return (
    <mesh geometry={geometry} renderOrder={-1}>
      <meshLambertMaterial vertexColors map={grain} />
    </mesh>
  );
}
```

### `web/scene/Trees.tsx`

```tsx
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { COLORS } from "../lib/palette";
import { terrainHeight } from "../lib/heightfield";
import { applyWind } from "./wind";
import { collectSpots } from "../lib/tree-field";

function trunkGeometry(height: number, topRadius: number, bottomRadius: number) {
  const g = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 6);
  g.translate(0, height / 2, 0);
  return g;
}

function pineCrownGeometry() {
  const tiers = [
    { radius: 1.55, height: 2.3, y: 2.35 },
    { radius: 1.15, height: 1.9, y: 3.6 },
    { radius: 0.78, height: 1.6, y: 4.75 },
  ];
  return mergeGeometries(
    tiers.map((tier) => {
      const cone = new THREE.ConeGeometry(tier.radius, tier.height, 7);
      cone.translate(0, tier.y, 0);
      return cone;
    }),
  );
}

function broadleafCrownGeometry() {
  const main = new THREE.IcosahedronGeometry(1.5, 0);
  main.scale(1.25, 0.95, 1.25);
  main.translate(0, 3.05, 0);
  const side = new THREE.IcosahedronGeometry(1.0, 0);
  side.scale(1.1, 0.9, 1.1);
  side.translate(0.75, 2.45, 0.35);
  return mergeGeometries([main, side]);
}

export function Trees() {
  const spots = useMemo(collectSpots, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const pineTrunkGeo = useMemo(() => trunkGeometry(2.6, 0.09, 0.22), []);
  const pineCrownGeo = useMemo(pineCrownGeometry, []);
  const leafTrunkGeo = useMemo(() => trunkGeometry(2.05, 0.11, 0.26), []);
  const leafCrownGeo = useMemo(broadleafCrownGeometry, []);

  const trunkMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ color: COLORS.trunk }),
    [],
  );
  const pineCrownMaterial = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({ color: COLORS.pine });
    applyWind(m, 0.1, 5.4);
    return m;
  }, []);
  // White base + per-instance colour lets amber "autumn" trees share one
  // material (and therefore one draw call) with the green ones.
  const leafCrownMaterial = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({ color: "#ffffff" });
    applyWind(m, 0.13, 4.2);
    return m;
  }, []);

  useEffect(() => {
    return () => {
      pineTrunkGeo.dispose();
      pineCrownGeo.dispose();
      leafTrunkGeo.dispose();
      leafCrownGeo.dispose();
      trunkMaterial.dispose();
      pineCrownMaterial.dispose();
      leafCrownMaterial.dispose();
    };
  }, [
    pineTrunkGeo,
    pineCrownGeo,
    leafTrunkGeo,
    leafCrownGeo,
    trunkMaterial,
    pineCrownMaterial,
    leafCrownMaterial,
  ]);

  const pineTrunkRef = useRef<THREE.InstancedMesh>(null);
  const pineCrownRef = useRef<THREE.InstancedMesh>(null);
  const leafTrunkRef = useRef<THREE.InstancedMesh>(null);
  const leafCrownRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const green = COLORS.leaf;
    const amber = COLORS.leafAmber;

    spots.pines.forEach((spot, i) => {
      const baseY = terrainHeight(spot.x, spot.z) - 0.12;
      dummy.position.set(spot.x, baseY, spot.z);
      dummy.rotation.set(0, spot.rotationY, 0);
      dummy.scale.setScalar(spot.scale);
      dummy.updateMatrix();
      pineTrunkRef.current?.setMatrixAt(i, dummy.matrix);
      pineCrownRef.current?.setMatrixAt(i, dummy.matrix);
    });

    spots.broadleaf.forEach((spot, i) => {
      const baseY = terrainHeight(spot.x, spot.z) - 0.12;
      dummy.position.set(spot.x, baseY, spot.z);
      dummy.rotation.set(0, spot.rotationY, 0);
      dummy.scale.setScalar(spot.scale * (spot.amber ? 1.08 : 1));
      dummy.updateMatrix();
      leafTrunkRef.current?.setMatrixAt(i, dummy.matrix);
      leafCrownRef.current?.setMatrixAt(i, dummy.matrix);
      leafCrownRef.current?.setColorAt(i, spot.amber ? amber : green);
    });

    for (const ref of [
      pineTrunkRef,
      pineCrownRef,
      leafTrunkRef,
      leafCrownRef,
    ]) {
      if (!ref.current) continue;
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) {
        ref.current.instanceColor.needsUpdate = true;
      }
      // The bounding sphere comes from the un-instanced base geometry, which
      // would make the whole forest vanish when the camera looks away from
      // one tree; disable culling and let the low draw count do the work.
      ref.current.frustumCulled = false;
    }
  }, [spots, dummy, pineTrunkRef, pineCrownRef, leafTrunkRef, leafCrownRef]);

  return (
    <group>
      <instancedMesh
        ref={pineTrunkRef}
        args={[pineTrunkGeo, trunkMaterial, spots.pines.length]}
      />
      <instancedMesh
        ref={pineCrownRef}
        args={[pineCrownGeo, pineCrownMaterial, spots.pines.length]}
      />
      <instancedMesh
        ref={leafTrunkRef}
        args={[leafTrunkGeo, trunkMaterial, spots.broadleaf.length]}
      />
      <instancedMesh
        ref={leafCrownRef}
        args={[leafCrownGeo, leafCrownMaterial, spots.broadleaf.length]}
      />
    </group>
  );
}
```

### `web/scene/Grass.tsx`

```tsx
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "../lib/palette";
import { scatterCells } from "../lib/rng";
import { terrainHeight } from "../lib/heightfield";
import { playerPositionUniform } from "../lib/clock";
import { applyWind } from "./wind";

const MAX_BLADES = 3200;
const HALF_EXTENT = 62;
// The meadow is one square tile that teleports in whole-period steps, always
// snapped around the walker. Same baked layout every tile, heights resampled
// from the heightfield, so grass exists wherever you stand.
const TILE = HALF_EXTENT * 2;

type Blade = {
  lx: number;
  lz: number;
  rotY: number;
  scaleY: number;
  tint: THREE.Color;
};

// One tapered blade geometry, instanced a few thousand times. A baked
// vertical gradient in the vertex colours (dark root, pale tip) plus
// per-instance tint gives cheap depth without any lighting tricks.
function bladeGeometry() {
  const g = new THREE.PlaneGeometry(0.18, 1, 1, 2);
  g.translate(0, 0.5, 0);
  const position = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    position.setX(i, position.getX(i) * Math.pow(1 - y, 1.25));
    position.setZ(i, position.getZ(i) + y * y * 0.16);
  }
  const colors = new Float32Array(position.count * 3);
  const root = COLORS.grassLow;
  const tip = COLORS.grassTip;
  for (let i = 0; i < position.count; i += 1) {
    const t = Math.pow(position.getY(i), 1.4);
    colors[i * 3] = root.r + (tip.r - root.r) * t;
    colors[i * 3 + 1] = root.g + (tip.g - root.g) * t;
    colors[i * 3 + 2] = root.b + (tip.b - root.b) * t;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export function Grass() {
  const geometry = useMemo(bladeGeometry, []);
  const material = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({
      color: "#ffffff",
      side: THREE.DoubleSide,
    });
    applyWind(m, 0.055, 1.0);
    return m;
  }, []);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Blade layouts are decided once (seeded, deterministic) so every tile
  // plants an identical meadow — repetition the eye never catches.
  const blades = useMemo<Blade[]>(() => {
    const cells = scatterCells({
      seed: "evening-forest/grass/v1",
      halfExtent: HALF_EXTENT,
      minRadius: 0,
      step: 2.2,
      jitter: 1.05,
    });
    const list: Blade[] = [];
    const tint = new THREE.Color();
    const tip = COLORS.grassTip;
    const dry = new THREE.Color("#8a6a30");
    for (const cell of cells) {
      if (list.length >= MAX_BLADES) break;
      if (cell.rand() > 0.82) continue;
      tint.copy(tip).lerp(dry, cell.rand() * 0.35);
      list.push({
        lx: cell.x,
        lz: cell.z,
        rotY: cell.rand() * Math.PI,
        scaleY: 0.5 + cell.rand() * 0.85,
        tint: tint.clone(),
      });
    }
    return list;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tileRef = useRef<{ x: number; z: number } | null>(null);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const plantTile = (tileX: number, tileZ: number) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    let count = 0;
    for (const blade of blades) {
      const x = blade.lx + tileX;
      const z = blade.lz + tileZ;
      dummy.position.set(x, terrainHeight(x, z), z);
      dummy.rotation.set(0, blade.rotY, 0);
      dummy.scale.set(1, blade.scaleY, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(count, dummy.matrix);
      mesh.setColorAt(count, blade.tint);
      count += 1;
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  };

  useLayoutEffect(() => {
    tileRef.current = { x: 0, z: 0 };
    plantTile(0, 0);
    // Blades depend on nothing but their seeded layout; planting runs again
    // from useFrame whenever the walker crosses into a new tile.
  }, [blades, dummy]);

  useFrame(() => {
    const p = playerPositionUniform.value;
    const tileX = Math.round(p.x / TILE) * TILE;
    const tileZ = Math.round(p.z / TILE) * TILE;
    const current = tileRef.current;
    if (!current || current.x !== tileX || current.z !== tileZ) {
      tileRef.current = { x: tileX, z: tileZ };
      plantTile(tileX, tileZ);
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, MAX_BLADES]} />
  );
}
```

### `web/scene/Fireflies.tsx`

```tsx
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "../lib/palette";
import { terrainHeight } from "../lib/heightfield";
import { createRng } from "../lib/rng";
import { playerPositionUniform, windUniform, daylightGains } from "../lib/clock";

const DEFAULT_COUNT = 150;

// Fireflies drift entirely on the GPU: base positions are baked once
// (seeded), and the vertex shader offsets them with per-firefly phases read
// from a shared clock — zero CPU work per frame. When the walker comes
// close, a second uniform gently reels them into an orbit around the
// camera, so walking through the hollow feels like stirring sparks.
const VERTEX_SHADER = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform vec3 uPlayer;
  varying float vFade;
  varying float vNear;

  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * (0.21 + aSeed.x * 0.25) + aSeed.y * 40.0) * (1.4 + aSeed.x * 2.2);
    pos.z += cos(uTime * (0.19 + aSeed.y * 0.22) + aSeed.z * 40.0) * (1.4 + aSeed.y * 2.2);
    pos.y += sin(uTime * (0.3 + aSeed.z * 0.3) + aSeed.w * 50.0) * (0.35 + aSeed.z * 0.5);

    // Curious fireflies: inside ~12m they drift toward the walker, easing
    // into a loose ring about two metres out instead of swallowing them.
    vec3 toPlayer = uPlayer - pos;
    float dist = length(toPlayer);
    float pull = smoothstep(12.0, 3.0, dist);
    pos += (toPlayer / max(dist, 0.001)) * pull * max(dist - 2.2, 0.0) * 0.45;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float distView = length(mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(260.0 / distView, 1.5, 7.0);

    float pulse = 0.45 + 0.55 * sin(uTime * (0.8 + aSeed.w * 1.6) + aSeed.x * 60.0);
    vFade = pulse * smoothstep(78.0, 16.0, distView);
    vNear = pull;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGain;
  varying float vFade;
  varying float vNear;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float disc = smoothstep(0.5, 0.12, d);
    if (disc < 0.01) discard;
    gl_FragColor = vec4(uColor, disc * vFade * (1.0 + vNear * 0.7) * uGain);
  }
`;

export function Fireflies({ count = DEFAULT_COUNT }: { count?: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    const rand = createRng("evening-forest/fireflies/v1");
    for (let i = 0; i < count; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = Math.sqrt(rand()) * 72;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions[i * 3] = x;
      positions[i * 3 + 1] = terrainHeight(x, z) + 0.5 + rand() * 2.4;
      positions[i * 3 + 2] = z;
      seeds[i * 4] = rand();
      seeds[i * 4 + 1] = rand();
      seeds[i * 4 + 2] = rand();
      seeds[i * 4 + 3] = rand();
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    return g;
  }, [count]);

  // The hollow travels: once the walker strays too far from the swarm's
  // centre, the whole cloud quietly re-seeds around them, so fireflies stay
  // part of every walk instead of being a spawn-area landmark.
  const anchorRef = useRef(new THREE.Vector3(0, 0, 0));
  useFrame(() => {
    if (playerPositionUniform.value.distanceTo(anchorRef.current) < 46) return;
    anchorRef.current.copy(playerPositionUniform.value);
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const positions = attr.array as Float32Array;
    const rand = Math.random;
    for (let i = 0; i < count; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = 8 + Math.sqrt(rand()) * 64;
      const x = playerPositionUniform.value.x + Math.cos(angle) * radius;
      const z = playerPositionUniform.value.z + Math.sin(angle) * radius;
      positions[i * 3] = x;
      positions[i * 3 + 1] = terrainHeight(x, z) + 0.5 + rand() * 2.4;
      positions[i * 3 + 2] = z;
    }
    attr.needsUpdate = true;
  });

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: windUniform,
          uPlayer: playerPositionUniform,
          uColor: { value: COLORS.firefly.clone() },
          uGain: daylightGains.firefly,
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <points geometry={geometry} material={material} renderOrder={6} frustumCulled={false} />
  );
}
```

### `web/scene/LightShafts.tsx`

```tsx
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "../lib/palette";
import { terrainHeight } from "../lib/heightfield";
import { createRng } from "../lib/rng";
import { daylightGains, windUniform } from "../lib/clock";

const SHAFT_COUNT = 9;

// Fake volumetric shafts: crossed additive gradient planes leaning with the
// low sun, placed along the spawn meadow. Cheap, but at dusk they sell the
// whole "light through the trees" mood. uGain fades them out at night —
// shafts without a low sun are a lie the eye catches.
const SHAFT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSeed;
  uniform float uTime;
  uniform float uGain;
  varying vec2 vUv;

  void main() {
    float across =
      smoothstep(0.0, 0.28, vUv.x) * smoothstep(1.0, 0.72, vUv.x);
    float down = pow(vUv.y, 1.35);
    float shimmer = 0.8 + 0.2 * sin(uTime * 0.45 + uSeed * 17.0);
    float alpha = across * down * shimmer * uOpacity * uGain;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const SHAFT_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function makeShaftMaterial(seed: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: SHAFT_VERTEX,
    fragmentShader: SHAFT_FRAGMENT,
    uniforms: {
      uColor: { value: COLORS.shaft.clone() },
      uOpacity: { value: 0.13 },
      uSeed: { value: seed },
      uTime: windUniform,
      uGain: daylightGains.shaft,
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
  });
}

export function LightShafts() {
  const shafts = useMemo(() => {
    const rand = createRng("evening-forest/shafts/v1");
    const list: {
      position: [number, number, number];
      yaw: number;
      width: number;
      height: number;
      materials: THREE.ShaderMaterial[];
    }[] = [];
    for (let i = 0; i < SHAFT_COUNT; i += 1) {
      const angle = i * 2.39996; // golden angle spread
      const radius = 15 + i * 5.1 + rand() * 3;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 11 + rand() * 5;
      const width = 3 + rand() * 2.4;
      const y = terrainHeight(x, z) + height / 2 - 0.5;
      const yaw = rand() * Math.PI;
      // Two planes crossed at a right angle so the shaft reads from any path.
      const materials = [makeShaftMaterial(i * 7.31), makeShaftMaterial(i * 7.31 + 3.7)];
      list.push({ position: [x, y, z], yaw, width, height, materials });
    }
    return list;
  }, []);

  useEffect(() => {
    return () => {
      for (const shaft of shafts) {
        for (const material of shaft.materials) material.dispose();
      }
    };
  }, [shafts]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group renderOrder={5}>
      {shafts.map((shaft, index) => (
        <group key={index} position={shaft.position} rotation={[0.2, shaft.yaw, 0]}>
          {[0, 1].map((twin) => (
            <mesh
              key={twin}
              geometry={geometry}
              material={shaft.materials[twin]}
              rotation={[0, twin * (Math.PI / 2), 0]}
              scale={[shaft.width, shaft.height, 1]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
```

### `web/lib/textures.ts`

```ts
import * as THREE from "three";
import { createRng } from "./rng";

// A tiny neutral grain texture. Multiplied over the vertex-coloured terrain it
// breaks up flat fills; nearest filtering keeps the texels crunchy at the
// low internal render resolution.
export function makeGrainTexture(size = 128): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Evening Forest: 2D canvas context unavailable");
  }
  ctx.fillStyle = "#e4e4e4";
  ctx.fillRect(0, 0, size, size);
  const rand = createRng("evening-forest/grain/v1");
  for (let i = 0; i < 2400; i += 1) {
    const shade = Math.floor(150 + rand() * 120);
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${(0.06 + rand() * 0.1).toFixed(3)})`;
    const r = 1 + rand() * 2.6;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(26, 26);
  return texture;
}
```

## 6. Read-only references (do NOT return these)

### `web/scene/wind.ts` — the sway injector your foliage must keep using

```ts
import type { MeshLambertMaterial } from "three";
import { windUniform } from "../lib/clock";

// Injects a coherent wind sway into a standard material's vertex shader.
// Every instance of an InstancedMesh shares the phase of its world position,
// so the canopy breathes in waves instead of wobbling randomly. Amplitude
// grows with the square of local height: trunks stay still, crowns move.
export function applyWind(
  material: MeshLambertMaterial,
  strength: number,
  referenceHeight: number,
): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniform;
    shader.uniforms.uSwayStrength = { value: strength };
    shader.uniforms.uSwayHeight = { value: referenceHeight };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;
        uniform float uSwayStrength;
        uniform float uSwayHeight;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          vec3 iOrigin = vec3(0.0);
          #ifdef USE_INSTANCING
            iOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          #endif
          float phase = uTime * 1.7 + iOrigin.x * 0.43 + iOrigin.z * 0.37;
          float amp = clamp(transformed.y / uSwayHeight, 0.0, 1.0);
          amp *= amp;
          transformed.x += sin(phase) * amp * uSwayStrength;
          transformed.z += cos(phase * 0.77 + iOrigin.x * 0.11) * amp * uSwayStrength * 0.85;
        }`,
      );
  };
}
```

### `web/lib/rng.ts` — the seeded generator (API only)

- `createRng(seed: string): () => number` — mulberry32, deterministic.
- `scatterCells({ seed, halfExtent, minRadius, step, jitter }): { x, z, r, rand }[]`
  — jittered-grid scatter used by Grass (and Trees via tree-field).

### `web/lib/clock.ts` — shared uniforms (unchanged)

```ts
import * as THREE from "three";
import { WALKER_START } from "./heightfield";

export const windUniform = { value: 0 };

export const playerPositionUniform = {
  value: new THREE.Vector3(WALKER_START.x, 2.4, WALKER_START.z),
};

export const timeOfDay = { value: 0 };

export const daylightGains = {
  star: { value: 0.05 },
  firefly: { value: 0.35 },
  shaft: { value: 1 },
};
```

### `web/scene/DaylightDriver.tsx` — the per-frame consumer (unchanged)

Shown so you know exactly how your `daylight.ts` output is consumed. Note
`uSunHalo = Math.min(sunIntensity / 3.2, 1)` — retuning `sunIntensity`
ranges changes the sun/moon halo strength proportionally.

```tsx
useFrame(() => {
  const s = sampleDaylight(timeOfDay.value);
  const PI = Math.PI;

  if (hemiRef.current) {
    hemiRef.current.color.setRGB(...s.hemiSky, THREE.SRGBColorSpace);
    hemiRef.current.groundColor.setRGB(...s.hemiGround, THREE.SRGBColorSpace);
    hemiRef.current.intensity = s.hemiIntensity * PI;
  }
  if (dirRef.current) {
    dirRef.current.color.setRGB(...s.sunColor, THREE.SRGBColorSpace);
    dirRef.current.intensity = s.sunIntensity * PI;
    scratch.sunDir.set(...s.sunDir).normalize();
    dirRef.current.position.copy(scratch.sunDir).multiplyScalar(120);
  }

  const sky = duskSkyUniforms.current;
  if (sky) {
    (sky.uZenith.value as THREE.Color).setRGB(...s.zenith, THREE.SRGBColorSpace);
    (sky.uUpper.value as THREE.Color).setRGB(...s.upper, THREE.SRGBColorSpace);
    (sky.uBand.value as THREE.Color).setRGB(...s.band, THREE.SRGBColorSpace);
    (sky.uHorizon.value as THREE.Color).setRGB(...s.horizon, THREE.SRGBColorSpace);
    (sky.uSunDirection.value as THREE.Vector3).set(...s.sunDir).normalize();
    (sky.uSunColor.value as THREE.Color).setRGB(...s.sunColor, THREE.SRGBColorSpace);
    sky.uSunHalo.value = Math.min(s.sunIntensity / 3.2, 1);
  }

  daylightGains.star.value = s.starGain;
  daylightGains.firefly.value = s.fireflyGain;
  daylightGains.shaft.value = s.shaftGain;

  const fog = scene.fog as THREE.FogExp2 | null;
  if (fog) {
    scratch.fogColor.setRGB(...s.fog, THREE.SRGBColorSpace);
    fog.color.copy(scratch.fogColor);
    fog.density = s.fogDensity;
    gl.setClearColor(scratch.fogColor);
  }
});
```

## 7. Observations — candidate weaknesses (you decide what matters)

- **Sky**: a clean but static four-stop gradient; no clouds; the sun disc is
  a small `pow(sunAmount, 240)` dot; at night the "moon" is just the sun
  halo dimmed by uSunHalo; stars are a hash-grid sprinkle with a uniform
  twinkle that can read as regular.
- **Grade**: generic — a per-channel gamma and a flat toe lift; quantisation
  crushes bloom's highlights into bands (bloom runs before dither); no dusk
  colour separation (e.g. cool shadows / warm highs) to give the crunch
  intent; vignette is a plain ellipse.
- **Surfaces**: terrain colour is an altitude ramp plus dirt noise — large
  smooth meadows band to mud at 6 levels; pine crowns are one flat colour
  for ALL pines; broadleafs are exactly two colours (green/amber); trunks
  one flat brown — the forest reads as clone trees at distance.
- **Fog/atmosphere**: single-colour FogExp2 does the heavy lifting; the
  treeline silhouette can wash into the horizon band; the sky-to-ground
  seam relies on one hard-coded dark haze mix in the sky shader.
- **Light**: everything is Lambert — no warm rim or backlit edge anywhere
  except the fox's emissive; the "dusk backlights the world" story is told
  mostly by fog colour, not by material response.
- **Motion feel**: wind exists; shafts are static shapes; fireflies are the
  only real sparkle.

## 8. Output format (exactly three parts, in this order)

**Part 1 — Direction.** Flowing prose, ≤ 250 words: what you chose to refine
and why, what you deliberately left alone. This is a design decision you
own — commit to one coherent direction rather than scattering tweaks.

**Part 2 — Files.** For each file you change (≤ 6): a heading line
`## <path>` then the COMPLETE replacement file in one fenced code block
(`` ```ts `` or `` ```tsx ``). Drop-in: no ellipses, no "unchanged below"
placeholders, no diffs. If you change nothing in a file, do not mention it.

**Part 3 — Knobs.** ≤ 10 bullets: the named constants you exposed for
post-integration tuning, and what the integrator should eyeball on
golden-hour / night / sunrise screenshots.

The integrator will verify with: `tsc --noEmit`, vite build, a headless node
check over `daylight.ts` invariants (§4.2), and screenshot probes at the
three arc positions. Code that fails any of these will bounce back.
