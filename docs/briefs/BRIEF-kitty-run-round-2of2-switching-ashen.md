# BRIEF part 2 of 2 — kitty-run: in-game character switching + Ashen art-direction candidates

Paste this whole file into the chat model AFTER part 1 has been integrated.
This part is fully self-contained: the chat model has no repo access, and
everything it needs is inside. It covers two deliverables:

- **Deliverable 1** — in-game character switching (mid-run, smooth, no pause).
- **Deliverable 5** — Ashen art-direction candidates (2–3 directions, palette
  + texture-knob recipes; NO shape implementation this round).

Note for your patches: the integrator has already applied part 1's small
patches to these shared files (a `meters` HUD element beside the score box,
effective-distance text on the game-over card, `TUNING.starBonusMeters`,
`world.bonusDistance` + `effectiveDistance(world)`, a `pickup(kind, combo)`
voice signature, a land-event airborne gate in step.ts). Treat those as
present; give your own changes as anchored additions rather than full-file
rewrites of the shared sections where possible.

---

## §0 What you are and what you get

You are the design/implementation brain for one round of work on "Cat Runner"
(`portfolio/projects/kitty-run`), a React + three.js endless runner with two
cosmetic characters: the pastel **kitty** and the **ashen knight** (Dark Souls
re-theme). Produce BOTH deliverables in ONE response, in the exact output
format of §7. Mechanical wiring, CSS and the `?ashen=N` scaffolding are
integrator work — do not output them unless a deliverable requires it.

## §1 Architecture laws (must not break)

- **Pure simulation.** `web/scene/step.ts` advances a plain `WorldState`
  (`web/scene/world.ts`). Rendering components read the world in their own
  `useFrame` hooks. React never re-renders for gameplay; HUD numbers are
  written straight to DOM nodes via refs.
- **Canvas memoization (WebKit law).** `RunCanvas` is `memo`-ized; page
  re-renders (mute, mix popover, overlays) must never re-render the WebGL
  subtree — in WebKit each such re-render disturbs the drawing buffer for one
  frame and the distance-driven world reads as if it jumped (a bug that was
  just fixed; regression-gated by `tests/kitty-run.webkit-shift.mjs`). Mute
  already rides `mutedRef`, read frame-by-frame. The NEW mid-run character
  switch must follow the same discipline: **zero canvas-subtree re-renders
  while running**.
- **Theme layer, not theme branches.** `web/lib/theme.ts` holds both
  palettes; `character` is page state threaded through props; texture
  builders take the palette as a parameter; per-theme records are built once
  at module scope (`BURST_RGB`, `PICKUP_COLORS`, `FADED`, `SHADOW`,
  `VIGNETTE_DARKNESS`). The simulation NEVER sees the theme.
- **Deterministic echo replay.** A finished run is stored as seed + timed
  inputs and replayed through the same `stepWorld`. The echo's cosmetic
  events are drained unread.
- **Zero image assets.** Everything is canvas-generated textures or
  procedural vector art (THREE.ShapeGeometry fills + inverted-hull ink copies
  behind each fill). No audio files.
- **Z-ladder.** Character part layers keep ≥ 0.02 z gaps (16-bit mobile depth
  buffers z-fight otherwise).
- **Character law.** The souls knight keeps her identity: great helm (visor
  slit + two ember eyes), crest, pauldrons, two-layer tattered cape,
  greatsword over the shoulder; no face/bow/whiskers in souls mode.

## §2 Owner decisions — LOCKED, do not re-litigate

1. **"Change character" HUD chip next to the pause button while running**
   (plus a `KeyC` keyboard shortcut). Switching mid-run must not pause the
   run and must not reset momentum, score or animations. Zero canvas-subtree
   re-renders while running.
2. **Ashen visual overhaul: candidates first.** You produce 2–3 independent
   visual DIRECTIONS as palette/texture-knob recipes (no shape redesign in
   the candidate round); the owner reviews them live in-game (behind an
   `?ashen=N` param the integrator builds), then a SEPARATE pass implements
   the winner. Candidates must still state (prose) how the knight would be
   redrawn.
3. **Knight redraw policy (for the winner round):** keep the identity, redraw
   better — heavier silhouette, richer Dark Souls rendering.

## §3 Context you cannot infer

How `character` flows today: page state in `KittyRunPage` (`useState`
initialized from `?souls` param or localStorage; persisted via
`storeCharacter`), passed down through `RunCanvas` into every themed
component as a prop; each component rebuilds its textures/colours in
`useMemo`s keyed on the character/palette. Switching is currently possible
ONLY on the ready screen (the keyboard cases for `1`/`2`/`←`/`→` are gated to
`world.status === "ready"`), so a switch has always been a plain re-render
while nothing simulates. Page chrome (CSS class `kitty-run-page--souls`, HUD
copy like dashLabel "dash"/"roll", portraits, overlays, and the audio
`setMode` effect on `[character]`) all react to the page state — those can
keep doing so.

## §4 Code excerpts

### FILE: portfolio/projects/kitty-run/web/scene/RunCanvas.tsx (FULL)
```tsx
// Canvas, camera and scene assembly. The camera rig jiggles with the
// world's shake trauma; everything else reads the world in its own frame.

import { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BASE_CAM_Z, BASE_FOV, frameFor } from "../lib/framing.ts";
import { paletteFor, type CharacterId } from "../lib/theme.ts";
import type { Sfx } from "../lib/audio.ts";
import type { Soundtrack } from "../lib/music.ts";
import type { GameStatus, WorldState } from "./world.ts";
import { Parallax } from "./Parallax";
import { AshFall } from "./AshFall";
import { Ground } from "./Ground";
import { Shadow } from "./Shadow";
import { Obstacles } from "./Obstacles";
import { Pickups } from "./Pickups";
import { Particles } from "./Particles";
import { Effects } from "./Effects";
import { GameLoop, type HudRefs } from "./GameLoop";
import { Echo } from "./Echo";
import { Kitty } from "../kitty/Kitty";
import type { RunInput } from "../lib/replay.ts";

const CAMERA_BASE = new THREE.Vector3(0, 3.2, BASE_CAM_Z);

// Static renderer configuration, hoisted to module scope on purpose. R3F
// re-applies `gl`/`dpr`/`camera` whenever their identity changes, and JSX
// object literals are new objects on every parent render — every header
// state change (mute, mix, hover) would re-touch the renderer. In WebKit
// that re-apply visibly disturbs the drawing buffer for a frame: the
// distance-driven world reads as if it jumped. Stable identities, stable
// renderer.
const GL_CONFIG = {
  antialias: true,
  stencil: false,
  powerPreference: "high-performance" as const,
  preserveDrawingBuffer:
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("preserve"),
};
const DPR: [number, number] = [1, 2];
const CAMERA_SPEC = {
  fov: BASE_FOV,
  near: 2,
  far: 90,
  position: [0, 3.2, BASE_CAM_Z],
} as const;
function onCreated({ camera }: { camera: THREE.Camera }): void {
  camera.lookAt(2.4, 2.6, 0);
}

// The canvas clear colour follows the theme's sky bottom, so nothing pastel
// peeks in at the viewport edges in the dark theme.
function ClearColor({ color }: { color: string }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.setClearColor(color);
  }, [gl, color]);
  return null;
}

function CameraRig({ world, reducedMotion }: { world: WorldState; reducedMotion: boolean }) {
  const lookTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    // Re-derive the frame from the live viewport so a rotated phone or a
    // resized window re-frames without a reload.
    const aspect = state.size.width / Math.max(1, state.size.height);
    const frame = frameFor(aspect);

    const shake = reducedMotion ? 0 : world.shake * world.shake;
    state.camera.position.set(
      CAMERA_BASE.x + (Math.random() - 0.5) * shake * 0.5,
      CAMERA_BASE.y + (Math.random() - 0.5) * shake * 0.4,
      frame.camZ,
    );
    lookTarget.current.set(
      frame.lookX + (Math.random() - 0.5) * shake * 0.3,
      frame.lookY + (Math.random() - 0.5) * shake * 0.3,
      0,
    );
    state.camera.lookAt(lookTarget.current);

    // The dash widens the view for a burst of speed; bullet time pushes
    // further still — the lens breathes with the clock dip and eases
    // back as the world wells up to full speed again.
    const dashKick = reducedMotion ? 0 : frame.fov * 0.13;
    const bulletKick = reducedMotion ? 0 : (1 - Math.min(1, world.timeScale)) * frame.fov * 0.4;
    const targetFov = frame.fov + dashKick + bulletKick + shake * 2;
    const camera = state.camera as THREE.PerspectiveCamera;
    camera.fov += (targetFov - camera.fov) * Math.min(1, 9 * delta);
    camera.updateProjectionMatrix();
  });

  return null;
}

// Memoised on purpose: every prop here is a stable ref/object except the
// character. Page state (mute, mix popover, status transitions) re-renders
// the header and overlays but must never re-render the WebGL subtree — in
// WebKit each such re-render disturbed the drawing buffer for one frame
// and the distance-driven world read as if it had jumped.
export const RunCanvas = memo(function RunCanvas({
  world,
  echo,
  echoInputs,
  reducedMotion,
  sfxRef,
  trackRef,
  mutedRef,
  hud,
  character,
  onStatus,
}: {
  world: WorldState;
  // The simulated best-run world and its recorded inputs. Both come from
  // storage; either may be absent (first visit, private mode, corrupt
  // data) — the run then simply has no echo.
  echo?: WorldState | null;
  echoInputs?: RunInput[];
  reducedMotion: boolean;
  sfxRef: React.RefObject<Sfx | null>;
  trackRef?: React.RefObject<Soundtrack | null>;
  // Live mute flag, read frame-by-frame (see the memo note above).
  mutedRef: { current: boolean };
  hud: HudRefs;
  // The selected character: presentation only. The simulation never sees
  // it — every themed component re-renders on a switch, which can only
  // happen on the ready screen.
  character: CharacterId;
  onStatus: (status: GameStatus) => void;
}) {
  return (
    <Canvas
      flat
      dpr={DPR}
      gl={GL_CONFIG}
      // near 2: the scene lives at z <= 0.2 and the camera at z >= 16, so
      // a generous near plane keeps depth precision tight — on 16-bit mobile
      // depth buffers the Kitty's paper-thin layers otherwise z-fight and
      // read as transparent.
      camera={CAMERA_SPEC}
      onCreated={onCreated}
    >
      <ClearColor color={paletteFor(character).skyBottom} />
      <CameraRig world={world} reducedMotion={reducedMotion} />
      <Parallax world={world} character={character} />
      <AshFall
        world={world}
        palette={paletteFor(character)}
        character={character}
        reducedMotion={reducedMotion}
      />
      <Ground world={world} character={character} />
      <Shadow world={world} character={character} />
      <Obstacles world={world} character={character} />
      <Pickups world={world} character={character} />
      <Particles world={world} />
      <Kitty world={world} character={character} />
      {echo && echoInputs && (
        <Echo world={world} echo={echo} character={character} />
      )}
      <Effects world={world} reducedMotion={reducedMotion} character={character} />
      <GameLoop
        world={world}
        echo={echo}
        echoInputs={echoInputs}
        sfxRef={sfxRef}
        trackRef={trackRef}
        mutedRef={mutedRef}
        hud={hud}
        reducedMotion={reducedMotion}
        character={character}
        onStatus={onStatus}
      />
    </Canvas>
  );
});

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}
```

### FILE: portfolio/projects/kitty-run/web/scene/Parallax.tsx (FULL — the texture-component exemplar)
```tsx
// Layered backdrop: gradient sky with a baked sun, drifting cloud sprites,
// and a per-character stack of tileable silhouettes (BACKDROPS lookup).
// Every layer scrolls at its own fraction of the run distance — the
// parallax that sells the depth.

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createRng } from "../lib/rng.ts";
import { paletteFor, type CharacterId } from "../lib/theme.ts";
import { BACKDROPS, skyTexture } from "../lib/textures.ts";
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
          <planeGeometry args={[PLANE_WIDTH, props.height ?? PLANE_HEIGHT]} />
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
  const backdrop = useMemo(() => BACKDROPS[character], [character]);
  const skyMap = useMemo(() => skyTexture(palette), [palette]);
  const layerMaps = useMemo(
    () => backdrop.layers.map((layer) => layer.build(palette)),
    [backdrop, palette],
  );
  const cloudStyle = backdrop.cloud;
  const cloudMaps = useMemo(
    () =>
      cloudStyle
        ? [0, 1, 2].map((i) => cloudStyle.build(`kitty-run/cloud/${i}`, palette))
        : [],
    [cloudStyle, palette],
  );
  const haze = backdrop.haze ?? [];
  const hazeMaps = useMemo(
    () => haze.map((band) => band.build(palette)),
    [haze, palette],
  );

  // Cloud positions share one seed across themes so a switch keeps the sky.
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

      {cloudStyle &&
        clouds.map((spec, i) => (
          <mesh
            key={i}
            ref={(mesh) => {
              cloudRefs.current[i] = mesh;
            }}
            position={[spec.x - SPAN / 2, spec.y, spec.z]}
            scale={spec.size * cloudStyle.scale}
            renderOrder={-8}
          >
            <planeGeometry args={[2, 1]} />
            <meshBasicMaterial
              map={cloudMaps[i % cloudMaps.length]}
              transparent
              opacity={cloudStyle.opacity ?? 1}
              depthWrite={false}
            />
          </mesh>
        ))}

      {backdrop.layers.map((layer, i) => (
        <ScrollingPlane
          key={i}
          map={layerMaps[i]}
          z={layer.z}
          y={layer.y}
          height={layer.height}
          speed={layer.speed}
          opacity={layer.opacity}
          distance={world.distance}
        />
      ))}

      {/* Atmosphere between the city layers: same render order as the
          silhouettes, so the transparent pass paints far → near by z and
          each bank lands exactly between its two layers. */}
      {haze.map((band, i) => (
        <mesh key={`haze-${i}`} position={[0, band.y, band.z]} renderOrder={-5}>
          <planeGeometry args={[SPAN, band.height]} />
          <meshBasicMaterial
            map={hazeMaps[i]}
            transparent
            opacity={band.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
```

### Other themed components (structure)
- `Ground.tsx`: three flat ribbon meshes (top / band edge / body);
  `meshBasicMaterial color={palette.groundBody|groundDot|groundTop}`;
  geometry positions rewritten per frame from `world.distance`.
- `Shadow.tsx`: per-theme `SHADOW` record — `kitty` = soft-dot texture,
  ellipse 0.72×0.23, opacity 0.36→0.14, colour #b96a8a; `souls` = dense
  contact texture, ellipse 1.2×0.36, opacity 0.62→0.30, colour #241f1a.
- `Obstacles.tsx`: instanced crates; `crateTexture(paletteFor(character), { lid: CRATE_LID[character] ?? undefined })` in a `useMemo` keyed `[character]`; three instanced materials share the crate map; `CRATE_LID` = `{ souls: THEMES.souls.palette.cloudLit }`.
- `Pickups.tsx`: module-scope `PICKUP_COLORS[character]` (per-theme THREE.Color
  records); per-frame `setColorAt` from that record for heart/star/heal/glow.
- `Effects.tsx`: postprocessing chain; `<Vignette darkness={VIGNETTE_DARKNESS[character]} offset={0.3} />` (0.26 for both themes today; a comment claims the dark theme should lean deeper — discrepancy recorded).
- `AshFall.tsx`: `if (character !== "souls") return null;` before rendering two instanced batches colored `palette.ash`; TIERS record:
```ts
const TIERS: Record<"far" | "near", Tier> = {
  far: {
    count: 42, opacity: 0.26, size: [0.06, 0.11], fall: [0.3, 0.7],
    sway: [0.2, 0.55], freq: [0.25, 0.75], z: [-3.4, -2.6], scroll: 0.24,
  },
  near: {
    count: 18, opacity: 0.5, size: [0.13, 0.24], fall: [0.42, 0.82],
    sway: [0.25, 0.6], freq: [0.25, 0.75], z: [-1.6, -0.8], scroll: 0.36,
  },
};
```
- `Echo.tsx` (the best-run ghost) retint + remount pattern (excerpt):
```tsx
const SOULS_P = THEMES.souls.palette;

const ECHO_OPACITY = 0.66;
// The restyle: every rig colour maps into one faded family pulled toward
// the scene's own mood. Keys are the rig's own hexes, so a map only ever
// matches the theme it was built for.
const FADED: Record<CharacterId, Record<string, string>> = {
  kitty: {
    [PALETTE.kittyWhite]: "#f9f2f6",
    [PALETTE.suitPink]: "#f0d3e0",
    [PALETTE.bowRed]: "#e3b3c7",
    [PALETTE.bowDeep]: "#dca6bd",
    [PALETTE.noseYellow]: "#f1e4d4",
    [PALETTE.cheek]: "#eed3de",
    [PALETTE.outlineInk]: "#c49cb2",
  },
  souls: {
    [SOULS_P.kittyWhite]: "#efe9df",
    [SOULS_P.suitPink]: "#b39a8c",
    [SOULS_P.suitDeep]: "#7d6a5e",
    [SOULS_P.bowRed]: "#969290",
    [SOULS_P.bowDeep]: "#6b6661",
    [SOULS_P.noseYellow]: "#d6a57c",
    [SOULS_P.cheek]: "#c0a999",
    [SOULS_P.outlineInk]: "#4a423c",
    [SOULS_P.cloudLit]: "#c9a284",
  },
};

// Only the colour is retinted here. The rig MUST stay opaque: the offscreen
// target's own depth buffer resolves head-over-body occlusion, and the
// single fade happens later on the composite quad.
function retint(material: THREE.Material, map: Record<string, string>): void {
  const basic = material as THREE.MeshBasicMaterial;
  if (basic.color) {
    const mapped = map[`#${basic.color.getHexString()}`];
    if (mapped) basic.color.set(mapped);
  }
}

// A useEffect keyed [character] walks the rig subtree once per character
// and retints it. The rig renders as:
//   <Kitty key={character} world={echo} character={character} />
// inside an offscreen capture pipeline: the rig lives on its own render
// layer (RIG_LAYER = 1, invisible to the main camera), a dedicated RT
// camera (layers.set(RIG_LAYER)) captures it each frame into a
// WebGLRenderTarget, and ONE screen-aligned quad at ECHO_OPACITY blits the
// capture; depthTest stays on so the real Kitty occludes the echo.
```
- `ClearColor` inside the Canvas: `<ClearColor color={paletteFor(character).skyBottom} />`.
- `GameLoop` (NOT excerpted here; part 1 shipped its patches): one `useFrame`
  steps the world, consumes events (sfx, bursts, floaters, HUD writes) and
  writes the HUD via refs. It reads burst colours from
  `BURST_RGB[character]` (a `character` prop) — your design may switch that
  read to a ref; give it as a labelled one-line instruction, not a patch.
  It also already carries `mutedRef` (read frame-by-frame) — the pattern to
  follow.

### FILE: portfolio/projects/kitty-run/web/KittyRunPage.tsx (FULL)
```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sfx } from "./lib/audio.ts";
import { readBestScore } from "./lib/score.ts";
import { loadReplay, type StoredReplay } from "./lib/replay.ts";
import { createWorld, type GameStatus, type WorldState } from "./scene/world.ts";
import {
  hasWebGL,
  RunCanvas,
  useReducedMotion,
} from "./scene/RunCanvas";
import type { HudRefs } from "./scene/GameLoop";
import { Floaters } from "./scene/Floaters";
import { restartRun, startRun, togglePause } from "./scene/step.ts";
import {
  releaseJump,
  requestDash,
  requestJump,
} from "./scene/actions.ts";
import { resetPilot } from "./lib/pilot.ts";
import { buzz } from "./lib/haptics.ts";
import { Soundtrack } from "./lib/music.ts";
import { KittyPortrait, KnightPortrait } from "./CharacterPortraits";
import {
  CHARACTER_IDS,
  characterFromParams,
  readStoredCharacter,
  storeCharacter,
  THEMES,
  type CharacterId,
} from "./lib/theme.ts";
import "./kitty-run.css";

// The three loudness sliders (master / SFX / music), persisted so a visit
// keeps its mix. Defaults mirror the Sfx engine's own bus levels, so the
// first apply is a no-op and the sound never jumps.
type AudioLevels = { master: number; sfx: number; music: number };

const AUDIO_KEY = "kitty-run/audio/v1";

const DEFAULT_LEVELS: AudioLevels = { master: 0.42, sfx: 0.9, music: 0.85 };

function loadAudioLevels(): AudioLevels {
  try {
    const raw = window.localStorage.getItem(AUDIO_KEY);
    if (!raw) return { ...DEFAULT_LEVELS };
    const parsed = JSON.parse(raw) as Partial<AudioLevels>;
    const clamp = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isFinite(v)
        ? Math.min(1, Math.max(0, v))
        : fallback;
    return {
      master: clamp(parsed.master, DEFAULT_LEVELS.master),
      sfx: clamp(parsed.sfx, DEFAULT_LEVELS.sfx),
      music: clamp(parsed.music, DEFAULT_LEVELS.music),
    };
  } catch {
    // Corrupt entry or unavailable storage: the defaults still play.
    return { ...DEFAULT_LEVELS };
  }
}

export default function KittyRunPage() {
  const world = useMemo(() => createWorld(readBestScore(window.localStorage)), []);
  const reducedMotion = useReducedMotion();
  const [webglOk, setWebglOk] = useState(true);
  // The selected character: a presentation choice, persisted like the audio
  // mix. ?souls overrides for one page load; the chip row handles the rest.
  // Only the ready screen offers the switch, so a selection never races a
  // live run.
  const [character, setCharacter] = useState<CharacterId>(() => {
    const fromParams = characterFromParams(
      new URLSearchParams(window.location.search),
    );
    return fromParams ?? readStoredCharacter(window.localStorage);
  });
  const theme = THEMES[character];
  const [status, setStatus] = useState<GameStatus>(world.status);
  const [best, setBest] = useState(world.best);
  const [muted, setMuted] = useState(false);
  // GameLoop reads the ref frame-by-frame instead of receiving the state as
  // a prop: the canvas subtree is memoised on stable props, so a mute flip
  // (and every other header interaction) never re-renders the WebGL tree —
  // WebKit answers those re-renders with a one-frame disturbance of the
  // drawing buffer, which reads as the background jumping. Same pattern as
  // characterRef below.
  const mutedRef = useRef(false);
  // Audio mixer state: the three sliders plus whether the popover is open.
  const [audio, setAudio] = useState<AudioLevels>(loadAudioLevels);
  const [mixOpen, setMixOpen] = useState(false);
  // The stored best run: seed plus inputs. When present, new runs reuse
  // its seed so the echo races you over the very track it ran.
  const [replay, setReplay] = useState<StoredReplay | null>(() =>
    loadReplay(window.localStorage),
  );
  // Bumped on every start so the echo simulation is rebuilt fresh.
  const [runNonce, setRunNonce] = useState(0);
  // The replay this run is racing. Frozen at start: the over card compares
  // against the mark that was on the line, not against a replay this very
  // run may have just rewritten.
  const [raceTarget, setRaceTarget] = useState<StoredReplay | null>(null);
  // Autopilot demo: true while the lookahead pilot drives. A bot run is an
  // exhibition — it never writes best scores or replays (see GameLoop).
  const [autoPilot, setAutoPilot] = useState(false);
  // Remembers that the run just ended was flown by the bot, so the over
  // card can say so.
  const [autoRan, setAutoRan] = useState(false);

  const echo: WorldState | null = useMemo(() => {
    if (!replay) return null;
    const sim = createWorld(0, replay.seed);
    // The echo never sees a menu; it exists only to run.
    sim.status = "running";
    return sim;
  }, [replay, runNonce]);

  const sfxRef = useRef<Sfx | null>(null);
  // The adaptive soundtrack rides the same AudioContext as the sfx; it
  // is created lazily inside the first user gesture, beside the sfx.
  const trackRef = useRef<Soundtrack | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLSpanElement | null>(null);
  const heartsRef = useRef<HTMLDivElement | null>(null);
  const comboRef = useRef<HTMLSpanElement | null>(null);
  const comboBarRef = useRef<HTMLDivElement | null>(null);
  const milestoneRef = useRef<HTMLDivElement | null>(null);
  const dashRef = useRef<HTMLButtonElement | null>(null);
  const bulletRef = useRef<HTMLDivElement | null>(null);
  const debugRef = useRef<HTMLSpanElement | null>(null);

  const hud: HudRefs = useMemo(
    () => ({
      score: scoreRef,
      hearts: heartsRef,
      combo: comboRef,
      comboBar: comboBarRef,
      milestone: milestoneRef,
      dash: dashRef,
      bullet: bulletRef,
      debug: debugRef,
    }),
    [],
  );

  const autostarted = useRef(false);
  useEffect(() => {
    setWebglOk(hasWebGL());
    // Demo/testing hooks: ?autostart skips the menu, ?autopilot starts
    // straight into the bot-driven exhibition. Once per page load — later
    // replay updates must not restart runs.
    if (autostarted.current) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("autostart") && !params.has("autopilot")) return;
    autostarted.current = true;
    const bot = params.has("autopilot");
    if (replay) world.runSeed = replay.seed;
    setRaceTarget(replay);
    world.autopilot = bot;
    setAutoPilot(bot);
    setAutoRan(bot);
    if (bot) resetPilot(world);
    startRun(world);
    setRunNonce((n) => n + 1);
  }, [world, replay]);

  const ensureSfx = useCallback((): Sfx | null => {
    if (mutedRef.current) return null;
    if (!sfxRef.current) sfxRef.current = new Sfx();
    const sfx = sfxRef.current;
    sfx.start();
    // The sliders own the mix: re-apply the persisted levels on every wake
    // so a freshly-built graph comes up at the visitor's settings, and a
    // resumed context re-learns them after a background suspension.
    sfx.setMaster(audio.master);
    sfx.setSfx(audio.sfx);
    sfx.setMusic(audio.music);
    if (!trackRef.current && sfx.context && sfx.musicOutput) {
      trackRef.current = new Soundtrack(sfx.context, sfx.musicOutput);
      // A freshly built graph comes up in the selected character's mood.
      trackRef.current.setMode(character);
    }
    // The SFX register follows the character too: cloth/iron voices vs the
    // pastel set. Pure table swap on the Sfx instance.
    sfx.setMode(character);
    return sfx;
  }, [audio, character]);

  // The score and the SFX register follow the character: a swap re-voices
  // harmony, tempo band and pad tone at the next bar; the sequencer itself
  // never resets.
  useEffect(() => {
    trackRef.current?.setMode(character);
    sfxRef.current?.setMode(character);
  }, [character]);

  // Slider drag: clamp, persist, and glide the live bus (a no-op before the
  // first gesture — the stored value is applied when the graph is built).
  const changeAudio = useCallback((key: keyof AudioLevels, value: number) => {
    const v = Math.min(1, Math.max(0, value));
    setAudio((prev) => {
      const next = { ...prev, [key]: v };
      try {
        window.localStorage.setItem(AUDIO_KEY, JSON.stringify(next));
      } catch {
        // Private mode or full storage: the sliders still work this visit.
      }
      return next;
    });
    const sfx = sfxRef.current;
    if (sfx) {
      if (key === "master") sfx.setMaster(v);
      else if (key === "sfx") sfx.setSfx(v);
      else sfx.setMusic(v);
    }
  }, []);

  // UI sounds stay polite: silent while muted, cheap no-ops before the
  // first gesture builds the context.
  const uiClick = useCallback(() => {
    if (!mutedRef.current) sfxRef.current?.uiClick();
  }, []);
  const uiHover = useCallback(() => {
    if (!mutedRef.current) sfxRef.current?.uiHover();
  }, []);

  const handleStatus = useCallback(
    (next: GameStatus) => {
      setStatus(next);
      if (next === "over") {
        setBest((prev) => Math.max(prev, world.best));
        // A finished run may have written a new echo; pick it up so the
        // next race uses the fresh replay.
        setReplay(loadReplay(window.localStorage));
      }
    },
    [world],
  );

  const beginRun = useCallback(
    (bot: boolean) => {
      ensureSfx();
      uiClick();
      world.autopilot = bot;
      setAutoPilot(bot);
      setAutoRan(bot);
      if (bot) resetPilot(world);
      if (replay) world.runSeed = replay.seed;
      setRaceTarget(replay);
      startRun(world);
      // A small "go" flourish under the very first steps of the run.
      if (!mutedRef.current) sfxRef.current?.runStart();
      setRunNonce((n) => n + 1);
    },
    [ensureSfx, uiClick, world, replay],
  );

  const handleStart = useCallback(() => beginRun(false), [beginRun]);
  const handleWatch = useCallback(() => beginRun(true), [beginRun]);

  // Character switch: presentation state plus persistence. The scene
  // re-renders through props; the simulation objects are untouched.
  const chooseCharacter = useCallback((id: CharacterId) => {
    setCharacter(id);
    storeCharacter(window.localStorage, id);
  }, []);

  // Keyboard cycling reads the ref, not the state: the keydown effect's
  // dependency list deliberately excludes `character`, so a closure over
  // the state would go stale after the first switch.
  const characterRef = useRef<CharacterId>(character);
  characterRef.current = character;
  const stepCharacter = useCallback((dir: 1 | -1): CharacterId => {
    const i = CHARACTER_IDS.indexOf(characterRef.current);
    return CHARACTER_IDS[(i + dir + CHARACTER_IDS.length) % CHARACTER_IDS.length];
  }, []);

  // Mid-run handover: the visitor takes the sticks back from the bot.
  const takeControl = useCallback(() => {
    world.autopilot = false;
    setAutoPilot(false);
  }, [world]);

  const handleRestart = useCallback(() => {
    ensureSfx();
    uiClick();
    // Another run hands control back to the visitor — the bot only drives
    // when explicitly invited.
    world.autopilot = false;
    setAutoPilot(false);
    setAutoRan(false);
    restartRun(world);
    if (!mutedRef.current) sfxRef.current?.runStart();
    if (replay) world.runSeed = replay.seed;
    setRaceTarget(replay);
    setRunNonce((n) => n + 1);
  }, [ensureSfx, uiClick, world, replay]);

  // --- keyboard ---------------------------------------------------------------

  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        if (world.status === "running") togglePause(world);
      } else if (!mutedRef.current) {
        // iOS suspends audio contexts in the background; nudge it alive.
        sfxRef.current?.start();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [world]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      // While the autopilot drives, jump/dash keys are spectators' keys —
      // only screen controls respond.
      switch (event.code) {
        case "Space":
        case "ArrowUp":
        case "KeyW":
          event.preventDefault();
          if (world.status === "ready") handleStart();
          else if (world.status === "over") handleRestart();
          else if (!world.autopilot) requestJump(world);
          break;
        case "Enter":
          if (world.status === "ready") handleStart();
          else if (world.status === "over") handleRestart();
          break;
        case "ShiftLeft":
        case "ShiftRight":
        case "ArrowDown":
        case "KeyS":
          event.preventDefault();
          if (!world.autopilot) requestDash(world);
          break;
        case "KeyP":
        case "Escape":
          togglePause(world);
          break;
        case "KeyR":
          if (world.status === "over" || world.status === "paused") {
            handleRestart();
          }
          break;
        case "Digit1":
        case "Digit2": {
          if (world.status !== "ready") break;
          event.preventDefault();
          uiClick();
          chooseCharacter(CHARACTER_IDS[event.code === "Digit1" ? 0 : 1]);
          break;
        }
        case "ArrowLeft":
        case "ArrowRight": {
          // Mid-run these belong to the duck/swipe gesture set.
          if (world.status !== "ready") break;
          event.preventDefault();
          uiClick();
          chooseCharacter(stepCharacter(event.code === "ArrowRight" ? 1 : -1));
          break;
        }
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (
        !world.autopilot &&
        (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW")
      ) {
        releaseJump(world);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [world, handleStart, handleRestart, uiClick, chooseCharacter, stepCharacter]);

  // --- touch: tap = jump, swipe down = dash -------------------------------------
  //
  // The tap jumps on finger-down for zero-latency feel; the swipe-down is
  // recognised fast (short drag or quick flick) and — because actions.
  // requestDash rescinds a fresh jump — the duck always wins over the
  // accidental hop, however late the gesture resolves.

  const gesture = useRef<{ x: number; y: number; t: number } | null>(null);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      gesture.current = {
        x: event.clientX,
        y: event.clientY,
        t: performance.now(),
      };
      if (world.status === "running" && !world.autopilot) requestJump(world);
    },
    [world],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      const dy = event.clientY - g.y;
      const elapsed = performance.now() - g.t;
      // A decisive downward drag, or a quick downward flick — either
      // counts immediately so the dash lands while the hazard is close.
      const flick = dy > 10 && elapsed < 90;
      if (dy > 26 || flick) {
        gesture.current = null;
        if (!world.autopilot) requestDash(world);
      }
    },
    [world],
  );

  const endGesture = useCallback(() => {
    gesture.current = null;
    // A spectator lifting their finger must not cut the bot's jump arc.
    if (!world.autopilot) releaseJump(world);
  }, [world]);

  const onPointerCancel = useCallback(() => {
    // Browsers fire this when a scroll/system gesture steals the pointer:
    // treat it as a plain lift, never as a dash or a cut jump.
    gesture.current = null;
  }, []);

  const coarse = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
    [],
  );
  const debugOn = useMemo(
    () => new URLSearchParams(window.location.search).has("debug"),
    [],
  );

  const stage = webglOk ? (
    <>
      <RunCanvas
        world={world}
        echo={echo}
        echoInputs={replay?.inputs}
        reducedMotion={reducedMotion}
        sfxRef={sfxRef}
        trackRef={trackRef}
        mutedRef={mutedRef}
        hud={hud}
        character={character}
        onStatus={handleStatus}
      />
      <Floaters world={world} stageRef={stageRef} />
      <div className="kitty-run-bullet" ref={bulletRef} aria-hidden="true" />

      <div className="kitty-run-hud">
        <div className="kitty-run-hearts" ref={heartsRef} aria-hidden="true">
          <span className="kitty-run-heart" />
          <span className="kitty-run-heart" />
          <span className="kitty-run-heart" />
        </div>
        <div className="kitty-run-right">
          <div className="kitty-run-score-box">
            <span className="kitty-run-score" ref={scoreRef}>
              0
            </span>
            <span className="kitty-run-best">
              {theme.text.best} {best}
            </span>
          </div>
          {status === "running" && (
            <button
              type="button"
              className="kitty-run-pause"
              aria-label="Pause the run"
              onPointerDown={(event) => event.stopPropagation()}
              onMouseEnter={uiHover}
              onClick={() => {
                uiClick();
                togglePause(world);
              }}
            />
          )}
        </div>
        <div className="kitty-run-combo">
          <span ref={comboRef} />
          <div className="kitty-run-combo-track">
            <div className="kitty-run-combo-bar" ref={comboBarRef} />
          </div>
        </div>
        <div className="kitty-run-milestone" ref={milestoneRef} aria-hidden="true" />
        {status === "running" && !autoPilot && (
          <button
            type="button"
            className="kitty-run-dash"
            ref={dashRef}
            aria-label="Dash"
            onPointerDown={(event) => {
              event.stopPropagation();
              requestDash(world);
              buzz(10);
            }}
          >
            {theme.text.dashLabel}
          </button>
        )}
        {autoPilot && status === "running" && (
          <button
            type="button"
            className="kitty-run-pilotchip"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={takeControl}
          >
            {theme.text.pilotLabel}
          </button>
        )}
        <span
          className={`kitty-run-debug${debugOn ? " is-visible" : ""}`}
          ref={debugRef}
        />
      </div>

      {status === "ready" && (
        <div className="kitty-run-overlay kitty-run-overlay--ready">
          <div className="kitty-run-ready-stack">
            <p className="kitty-run-pick-label" id="kitty-run-pick-label">
              {theme.text.pickLabel}
              {!coarse && (
                <span className="kitty-run-pick-keys" aria-hidden="true">
                  {" "}· 1 / 2 · ← →
                </span>
              )}
            </p>
            <div
              className="kitty-run-characters"
              role="group"
              aria-labelledby="kitty-run-pick-label"
            >
              {CHARACTER_IDS.map((id) => {
                const active = id === character;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`kitty-run-char kitty-run-char--${id}${active ? " is-active" : ""}`}
                    aria-pressed={active}
                    onMouseEnter={uiHover}
                    onClick={() => {
                      uiClick();
                      chooseCharacter(id);
                    }}
                  >
                    <span className="kitty-run-char-portrait" aria-hidden="true">
                      {id === "kitty" ? <KittyPortrait /> : <KnightPortrait />}
                    </span>
                    <span className="kitty-run-char-name">{THEMES[id].text.name}</span>
                    <span className="kitty-run-char-blurb">{THEMES[id].text.blurb}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="kitty-run-card kitty-run-card--ready"
              onMouseEnter={uiHover}
              onClick={handleStart}
            >
              <span className="kitty-run-card-kicker">{theme.text.readyKicker}</span>
              {replay && (
                <span className="kitty-run-card-echo">your best run will chase you</span>
              )}
              <span className="kitty-run-card-hint">
                {coarse
                  ? "tap to jump · dash pad blasts through"
                  : "space — jump · shift — dash · p — pause"}
              </span>
              <span className="kitty-run-card-action">{theme.text.readyAction}</span>
            </button>
            <button
              type="button"
              className="kitty-run-watch"
              onMouseEnter={uiHover}
              onClick={handleWatch}
            >
              <span className="kitty-run-watch-title">{theme.text.watchTitle}</span>
              <span className="kitty-run-watch-hint">{theme.text.watchHint}</span>
            </button>
          </div>
        </div>
      )}

      {status === "paused" && (
        <div className="kitty-run-overlay">
          <button
            type="button"
            className="kitty-run-card"
            onMouseEnter={uiHover}
            onClick={() => {
              uiClick();
              togglePause(world);
            }}
          >
            <span className="kitty-run-card-kicker">{theme.text.pausedKicker}</span>
            <span className="kitty-run-card-hint">{theme.text.pausedHint}</span>
            <span className="kitty-run-card-action">{theme.text.pausedAction}</span>
          </button>
        </div>
      )}

      {status === "over" && (
        <div className="kitty-run-overlay">
          <button
            type="button"
            className="kitty-run-card kitty-run-card--over"
            onMouseEnter={uiHover}
            onClick={handleRestart}
          >
            <span className="kitty-run-card-kicker">{theme.text.overKicker}</span>
            {world.newBest && world.score > 0 && (
              <span className="kitty-run-card-badge">{theme.text.overBadge}</span>
            )}
            <span className="kitty-run-card-title">
              {world.score.toLocaleString()} points
            </span>
            <span className="kitty-run-card-stat">
              {Math.floor(world.distance).toLocaleString()} m run
            </span>
            {autoRan && (
              <span className="kitty-run-card-echo">
                flown by the engine's test pilot — your records untouched
              </span>
            )}
            {raceTarget && (
              <span className="kitty-run-card-echo">
                {world.distance >= raceTarget.distance
                  ? `${Math.max(1, Math.round(world.distance - raceTarget.distance))} m past your best mark`
                  : `${Math.max(1, Math.round(raceTarget.distance - world.distance))} m short of your best mark`}
              </span>
            )}
            <span className="kitty-run-card-hint">
              {theme.text.best} {best} · {coarse ? "tap to run again" : "space or r runs again"}
            </span>
            <span className="kitty-run-card-action">{theme.text.overAction}</span>
          </button>
        </div>
      )}
    </>
  ) : (
    <div className="kitty-run-fallback" role="note">
      <p className="kitty-run-fallback-title">webgl unavailable · run sealed</p>
    </div>
  );

  return (
    <div className="kitty-run-field">
      <article
        className={`kitty-run-page${character === "souls" ? " kitty-run-page--souls" : ""}`}
      >
        <header className="kitty-run-intro section-shell">
          <h1 className="kitty-run-title">Cat Runner</h1>
          <div className="kitty-run-audio">
            <button
              type="button"
              className="kitty-run-mute"
              onMouseEnter={uiHover}
              onClick={() => {
                const next = !muted;
                // Confirm with a blip on the way out (while audio still
                // lives) or on the way back in (after the context wakes).
                mutedRef.current = next;
                if (next) uiClick();
                setMuted(next);
                if (!next) {
                  ensureSfx();
                  uiClick();
                }
              }}
            >
              {muted ? "sound off" : "sound on"}
            </button>
            <button
              type="button"
              className="kitty-run-mix"
              aria-expanded={mixOpen}
              aria-label="Audio mixer: master, effects and music sliders"
              onMouseEnter={uiHover}
              onClick={() => {
                uiClick();
                setMixOpen((open) => !open);
              }}
            >
              mix
            </button>
            {mixOpen && (
              <div className="kitty-run-mixpanel">
                {(["master", "sfx", "music"] as const).map((key) => (
                  <label key={key} className="kitty-run-mixrow">
                    <span>{key}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(audio[key] * 100)}
                      onChange={(event) =>
                        changeAudio(key, Number(event.target.value) / 100)
                      }
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </header>
        <section
          className="kitty-run-stage"
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endGesture}
          onPointerCancel={onPointerCancel}
        >
          {stage}
        </section>
      </article>
    </div>
  );
}
```
(Part 1's already-applied additions you may treat as present: a
`.kitty-run-meters` span beside the score box; effective-distance text on
the over card. Design around them; no need to restate them.)

### FILE: portfolio/projects/kitty-run/web/lib/theme.ts (FULL)
```ts
// The theme layer: two characters share one game. Every theme is a full
// colour palette plus the UI voice for the cards and HUD; the simulation
// never reads any of it. Selection is presentation, tied to the character
// chip on the ready card — a cosmetic variant, never a difficulty change.

import { PALETTE } from "./palette.ts";

export type CharacterId = "kitty" | "souls";

// Every theme palette carries exactly the pastel palette's keys, so scene
// code can switch themes by lookup alone — no conditionals anywhere.
export type ThemePalette = { [K in keyof typeof PALETTE]: string };

export type ThemeText = {
  // Character chips on the ready card.
  name: string;
  blurb: string;
  // HUD.
  best: string;
  // Ready card.
  readyKicker: string;
  readyAction: string;
  watchTitle: string;
  watchHint: string;
  // Pause card.
  pausedKicker: string;
  pausedHint: string;
  pausedAction: string;
  // Game-over card.
  overKicker: string;
  overBadge: string;
  overAction: string;
  // HUD labels.
  dashLabel: string;
  pilotLabel: string;
  // The small header above the character-select cards.
  pickLabel: string;
};

export type Theme = {
  id: CharacterId;
  palette: ThemePalette;
  text: ThemeText;
};

const KITTY_TEXT: ThemeText = {
  name: "cat",
  blurb: "the pastel runner",
  best: "best",
  readyKicker: "ready",
  readyAction: "start",
  watchTitle: "or watch it play itself",
  watchHint: "autopilot · the lookahead bot that verifies every track",
  pausedKicker: "paused",
  pausedHint: "p or esc resumes · r restarts",
  pausedAction: "resume",
  overKicker: "run over",
  overBadge: "new best!",
  overAction: "again",
  dashLabel: "dash",
  pilotLabel: "autopilot · take control",
  pickLabel: "choose your runner",
};

// Dark Souls v2, re-authored against the owner's reference vista: a tiny
// knight, a vast dead gothic city, a dying sun. Two families only — cold
// (slate → ash → bone → soul-light) is the dead world; warm (ash-rose →
// peach → ember) is every living light. Value does the storytelling:
// deep slate overhead, a lit horizon, castle layers fading upward into
// mist (≈ 0.28 → 0.14 → 0.04), a dark stone ground, and a bone knight as
// the brightest solid thing on screen. Only sunCore and heart cross the
// bloom line; windowEmber rides the knee on purpose (smoldering windows).
// The depth ladder spreads the city apart in value — bone-mist far (≈ 0.68),
// slate mid (≈ 0.41), deep near (≈ 0.19) — so the mass recedes instead of
// stacking three similar greys.
const SOULS_PALETTE: ThemePalette = {
  kittyWhite: "#e8e1d2",
  outlineInk: "#17130f",
  bowRed: "#6a6d72",
  bowDeep: "#3d4045",
  suitPink: "#8a4a33",
  suitDeep: "#522a1e",
  noseYellow: "#e07a34",
  cheek: "#bd917a",
  eyeInk: "#1e1815",

  skyTop: "#3d4a5f",
  skyMid: "#78889f",
  skyBottom: "#b48f85",
  sunCore: "#eaf0f6",
  sunHalo: "#c8d2dd",
  sunHaloSoft: "#8e9caf",
  cloud: "#4f5c70",
  cloudLit: "#e8a878",
  hillFar: "#6f7c8d",
  hillNear: "#4d586a",
  castleFar: "#a7aeb8",
  castleMid: "#5d6a7c",
  castleNear: "#2a3140",
  windowEmber: "#ffe09a",
  ash: "#c9c1b6",

  groundTop: "#67645f",
  groundBody: "#3a3835",
  // The lit edge: stone catching the low sun — warm mineral, not a glowing
  // ember line running the whole screen width.
  groundDot: "#7a6a5d",
  pathEdge: "#4c4844",

  obstaclePlum: "#3a302c",
  obstacleDeep: "#16110f",
  obstacleDot: "#d4b48c",

  heart: "#e6f1ff",
  heartGlow: "#b7d3f2",
  star: "#f2b03e",
  starGlow: "#cf6d1c",
  heal: "#ec6a22",
  healBurst: "#ffbf85",

  ink: "#15110e",
  paper: "#e6dfd1",
};

const SOULS_TEXT: ThemeText = {
  name: "ashen",
  blurb: "the hollow runner",
  best: "best",
  readyKicker: "rise",
  readyAction: "begin",
  watchTitle: "or watch the hollow walk",
  watchHint: "autopilot · a hollow that has died on every track",
  pausedKicker: "rest",
  pausedHint: "p or esc to rise · r restarts",
  pausedAction: "go on",
  overKicker: "YOU DIED",
  overBadge: "new record",
  overAction: "rekindle",
  dashLabel: "roll",
  pilotLabel: "phantom · take control",
  pickLabel: "choose your vessel",
};

// CSS-facing accents for the souls theme. The HUD/overlay styles consume
// these as literals (CSS cannot import TS); they are recorded here so the
// whole design system stays in one place. The v2 accents lean cold-slate
// (card #171a1f, cardLine #3a4250) to sit inside the new dead-stone world;
// ember stays the single warm voice. `death` is for the large YOU DIED
// kicker only — ≈3.3:1 on the card surface, too low for small text.
export const SOULS_UI = {
  ember: "#e8863c",
  emberDeep: "#b85f22",
  soul: "#dbe9fb",
  soulGlow: "#8fb4dc",
  death: "#cc372c",
  card: "#171a1f",
  cardLine: "#3a4250",
  inkMuted: "#9aa3ae",
} as const;

export const THEMES: Record<CharacterId, Theme> = {
  kitty: { id: "kitty", palette: PALETTE, text: KITTY_TEXT },
  souls: { id: "souls", palette: SOULS_PALETTE, text: SOULS_TEXT },
};

export const CHARACTER_IDS: readonly CharacterId[] = ["kitty", "souls"];

export function themeFor(character: CharacterId): Theme {
  return THEMES[character];
}

export function paletteFor(character: CharacterId): ThemePalette {
  return THEMES[character].palette;
}

const CHARACTER_KEY = "kitty-run/character/v1";

function isCharacterId(value: unknown): value is CharacterId {
  return value === "kitty" || value === "souls";
}

export function readStoredCharacter(storage: Storage): CharacterId {
  try {
    const raw = storage.getItem(CHARACTER_KEY);
    if (isCharacterId(raw)) return raw;
  } catch {
    // Private mode or unavailable storage: the pastel default stands.
  }
  return "kitty";
}

export function storeCharacter(storage: Storage, character: CharacterId): void {
  try {
    storage.setItem(CHARACTER_KEY, character);
  } catch {
    // Full storage or private mode: the choice holds for this visit only.
  }
}

// ?souls deep-links straight into the dark theme; persistence handles
// switching back interactively, so there is no ?kitty counterpart.
export function characterFromParams(
  params: URLSearchParams,
): CharacterId | null {
  if (params.has("souls")) return "souls";
  return null;
}
```

### FILE: portfolio/projects/kitty-run/web/lib/textures.ts (excerpts — backdrop)
```ts
// Tileable gothic skyline. `density` (0 airy … 1 packed) sets how much the
// buildings overlap; `baseline` is the fraction of the canvas that stays
// solid at the bottom. All rng is consumed before drawing so the three
// wrap copies are identical. `rim` (when present) bakes a hard-edged warm
// sliver on every sun-facing edge (right ~3px, top ~2px); stamped at 0.7
// alpha via source-atop, so it can only land on opaque masonry and never
// colours open sky or arch cutouts.
export function castleTexture(
  color: string,
  seed: string,
  opts: {
    windows?: string;
    density?: number;
    baseline?: number;
    rim?: string;
  } = {},
): THREE.CanvasTexture
```
```ts
export type BackdropLayer = {
  build: (p: ThemePalette) => THREE.CanvasTexture;
  z: number;
  y: number;
  height: number;
  speed: number;
  opacity?: number;
};
export type BackdropHaze = {
  build: (p: ThemePalette) => THREE.CanvasTexture;
  z: number;
  y: number;
  height: number;
  opacity: number;
};
export type BackdropSpec = {
  layers: BackdropLayer[];
  haze?: BackdropHaze[];
  cloud: {
    build: (seed: string, p: ThemePalette) => THREE.CanvasTexture;
    scale: number;
    opacity?: number;
  } | null;
};

// Per-character backdrop lookup; scene code never branches on theme.
export const BACKDROPS: Record<CharacterId, BackdropSpec> = {
  souls: {
    layers: [
      {
        // Plane spans y −1.5…10.5; spire tops land around y 9–10.
        // Sun rims on the far and mid silhouettes only; the near layer stays
        // matte so its ember windows keep the spotlight.
        build: (p) =>
          castleTexture(p.castleFar, "kitty-run/castle/far", {
            density: 0.95,
            baseline: 0.22,
            rim: p.cloudLit,
          }),
        z: -11,
        y: 4.5,
        height: 12,
        speed: 0.12,
        opacity: 0.9,
      },
      {
        // Plane spans y −2…7; tops around y 6–6.5.
        build: (p) =>
          castleTexture(p.castleMid, "kitty-run/castle/mid", {
            density: 0.7,
            baseline: 0.28,
            rim: p.cloudLit,
          }),
        z: -9,
        y: 2.5,
        height: 9,
        speed: 0.22,
      },
      {
        // Plane spans y −2…5; sparse thin towers, solid mass only below ~y 0.1.
        build: (p) =>
          castleTexture(p.castleNear, "kitty-run/castle/near", {
            windows: p.windowEmber,
            density: 0.35,
            baseline: 0.3,
          }),
        z: -7,
        y: 1.5,
        height: 7,
        speed: 0.42,
      },
    ],
    haze: [
      {
        // Sinks the far city's base into mist (far z -11, mid z -9).
        build: (p) => hazeTexture(p.skyMid, 0.62),
        z: -10,
        y: 0.6,
        height: 5,
        opacity: 0.42,
      },
      {
        // Second bank the near towers rise out of (mid z -9, near z -7).
        build: (p) => hazeTexture(p.skyMid, 0.68),
        z: -8,
        y: 0.9,
        height: 4.4,
        opacity: 0.36,
      },
    ],
    cloud: { build: duskCloudTexture, scale: 1.5, opacity: 0.9 },
  },
  // kitty: two hillTexture layers (z -9 / -7) + puffy cloudTexture — unchanged.
};
```
`skyTexture(p)` bakes the sky gradient + sun (skyTop/skyMid/skyBottom +
sunCore/sunHalo/sunHaloSoft); `duskCloudTexture(seed, p)` draws streaky
bands with `cloudLit` rims kept inside the body via source-atop.

### FILE: portfolio/projects/kitty-run/web/kitty/Kitty.tsx (structure excerpt)
```tsx
// Souls-only wear shading, drawn INSIDE existing silhouettes (character
// law: same rig, material only). Values sit one step from the host fill
// toward the ink, hard-edged — no gradients. The pastel cat never
// renders these; bone-white for the one specular chip is palette.kittyWhite.
const SOULS_MATERIAL = {
  steelShadow: "#26292d",
  bladeFuller: "#a9b0ba",
} as const;

// One silhouette part: an ink copy slightly grown behind the fill reads as
// a crisp uniform outline at any resolution. The z gap between the copy and
// the fill is generous on purpose — thin offsets z-fight on mobile depth
// buffers and the character turns see-through.
function Part({ geometry, color, z, position, rotation, scale = 1, outline = 0, outlineColor, inkGeometry }: PartProps) {
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
```
Rig structure (prose): root group (scale 0.72) → squash group → tilt group.
Body z-ladder: cape back ink −0.11 / fill −0.08; cape front ink −0.05 /
fill −0.02 (souls; hem trails to −x, she runs right; capeFold wedge overlay
inside the front cape); feet 0; greatsword group at [0.75, 1.18] rot z 1.0
(blade ink 0.01 / fill 0.04, fuller overlay 0.06, guard ink 0.07 / fill
0.10, pommel 0.10); sun-rim back-plate (dress geometry offset +0.08x at z
−0.15, colour cloudLit — body masks it except a thin right-contour fringe);
dress/tunic fill 0.12; belt occlusion overlay 0.15 / belt ink 0.17 /
fill 0.20 / buckle 0.24; arms ink 0.13 / fill 0.16; pauldrons ink 0.25 /
fill 0.28 (straddle the head's lower edge); head group at y 1.5: ears ink
0.12 / fill 0.15, head ink 0.19 / fill 0.22; pastel face (eyes ±0.4 / nose /
cheeks / whiskers at z 0.26–0.27) only when `!isSouls`; souls head block:
visor plate ink 0.25 / fill 0.28 (bowDeep), visor slit 0.31
(outlineInk), brow-occlusion overlay 0.305 (SOULS_MATERIAL.steelShadow),
ember eyes 0.34 (noseYellow — the ember colour), dome sun-rim back-plate
0.08 (cloudLit, padded dome shape), dome ink 0.31 / fill 0.34 (bowRed =
steel), specular chip 0.36 (kittyWhite), crest ink 0.37 / fill 0.40
(bowDeep). A `useFrame` computes the pose from the pure rig (`computePose`
in `web/kitty/rig.ts`: fields runPhase/grounded/vy/squash/blinkShut/dashT/
happyT/invulnT → bobY, scaleX/Y, tilt, headBob, earL/R, bowRot/scale,
eyeScaleY, armSwing, visible) and writes transforms directly; cape sway
reads runPhase/vy/dashT. All colours come from `palette = paletteFor(character)`.
Geometry (`geo`) is a single `useMemo` with no character dependency (shapes
are shared; only colours differ).

## §5 Ashen history you must respect

Round ledger (`.project-history/graph.jsonl`), most recent first:
- `5ab3f05` contact shadow regrade; `f333dbc` knight material pass (worn-steel
  shading inside silhouettes); `ec5e4c7` ash mote near/far classes. **← the
  owner now REJECTS this round's read ("not what i wanted").**
- `d4394c6` light pass (sun rims on city silhouettes + crate lids, knight
  right-contour fringe, ground edge lit stone #7a6a5d) — ACCEPTED baseline.
- `fd977b5` liturgical HUD type (wide-tracked serif ritual prompts:
  rise/rest/begin/go on/rekindle, YOU DIED at 0.3em tracking) — ACCEPTED.
- `e858b66` depth ladder (castleFar #a7aeb8 bone-mist → castleMid #5d6a7c →
  castleNear #2a3140) + cool haze banks between layers — ACCEPTED.
- `8980c9d` Dark Souls v2 bold re-theme (gothic castle-city in three parallax
  layers with smoldering ember windows, streaky ember-lit clouds, falling
  ash, the ashen knight: great helm with visor slit + ember eyes, two-layer
  tattered cape, pauldrons, greatsword over the shoulder, lament score,
  knight SFX register).

Owner's verdict NOW: the recent material/quality rounds are **not what they
wanted**; the style must be pushed FURTHER toward Dark Souls, in BOTH the
character model drawing and the background/environment drawing.

The style bible (delivered by a previous delegated slate, compressed):
- Mood pillars: **beautiful exhaustion** (every light is the last of
  something) · **cold vastness, warm intimacy** (small precious warms) ·
  **weight and patience** (steel tarnished, cloth tired — the knight is
  furniture of the landscape) · **held breath** (stillness with slow drift).
- Material language (flat-vector translation): worn cloth = 3 flat value
  steps, NO gradients; tarnished steel = occlusion pool + mid plane + one
  clipped bone-white chip; cracked stone = value-stepped facets terminating
  into existing shadows; ash = flat opacity classes, never blur.
- Reference anchors: Firelink Shrine (warm/cold ratio), Majula (low mournful
  sun), Anor Londo (rim discipline), Ash Lake (vast quiet), Undead Burg
  (matte value layering).

The owner's reference image (`reference-images/dark-souls.jpg`, pixel-art
vista) reads as: a colossal cold blue-slate gothic castle-city rising in
vertical tiers through dark broken clouds; one warm ember window-cluster
glowing mid-structure; rose/peach lit cloud rims at the very top; a lone
caped knight silhouette with a small glowing sword tip standing on a stone
bridge in the foreground; mist falling between tiers; deep-slate values
everywhere with the ONLY warmth being the ember cluster + lit cloud rims.
The current v2 palette was authored against this image and stays the anchor.

Deferred knobs already recorded (may inform candidates; do NOT implement
them as-is): thin all sun-rims to a 2px hairline (risk: undoes the accepted
0.7-alpha rim temper); Echo cold-core two-stage fade; cool-corner vignette
warm-bias (Effects.tsx has a 0.26/0.26 darkness discrepancy its comment says
should differ per theme).

## §6 Deliverables — produce BOTH, in order

### Deliverable 1 — In-game character switching (design + code)
Requirements:
- A "change character" chip in the HUD next to the pause button while
  `status === "running"` (autopilot runs may offer it or hide it — your call,
  state it). Also add a `KeyC` keyboard shortcut that works mid-run. The chip
  must stopPropagation on pointerdown (the stage's tap-to-jump handlers are
  on the section ancestor; the pause/dash buttons already do).
- Clicking swaps `character` instantly: NO pause, no momentum/score/animation
  interruption, NO canvas-subtree React re-render (WebKit buffer bug law).
- Proposed mechanism (refine or improve, justify): `character` stays page
  state for page chrome (CSS class `kitty-run-page--souls`, HUD copy like
  dashLabel "dash"/"roll", portraits, overlays, soundtrack/SFX `setMode` —
  the existing `useEffect` on `[character]` already handles the audio swap),
  while the canvas reads a `characterRef` frame-by-frame. RunCanvas stops
  receiving `character` and receives `characterRef` instead. Per-component
  re-theme:
  - **Kitty + Echo rigs: dual-mount.** Mount BOTH characters' rigs (player:
    `<Kitty character="kitty">` + `<Kitty character="souls">`; same inside
    Echo for the ghost) and toggle `visible` per frame from the ref — each
    rig already self-gates its parts by `isSouls` and reads the same world,
    so a swap is two boolean writes; zero material surgery, zero allocation.
    Pose `useFrame`s run for both (trivial cost, hidden rig skipped by the
    renderer). CAUTION for Echo: both ghost rigs must not draw into the
    offscreen capture at once — toggle `visible` per frame BEFORE the
    capture pass, or give each rig its own layer index and enable only the
    active one on the RT camera (state your choice).
  - **Texture components (Parallax, Obstacles, Shadow):** per-frame ref
    check against a `lastApplied` ref; on change, swap `material.map` /
    `material.color` from lazily built per-theme records cached at module
    scope keyed by character (build both themes' textures once, reuse —
    never allocate during the swap).
  - **Ground, Pickups, Effects, GameLoop bursts, ClearColor, AshFall:**
    same pattern — per-frame ref reads (several already read per-frame
    records; only the lookup source changes from prop to ref), imperative
    `setClearColor` for the canvas colour, `visible` toggling for AshFall's
    batches (souls-only feature).
- Success criteria: a switch during a live run is visually instant, the
  run's distance/score/combo/hearts are untouched, no background jump, no
  dropped frame, works with `?souls` deep-link and persistence; the ready
  screen's existing chip row keeps working.

### Deliverable 5 — Ashen art-direction candidates (2–3 directions)
For EACH candidate produce:
1. **Name + one-line pitch** (Dark Souls anchor: e.g. Firelink dusk /
   Anor Londo pale / Majula mournful sun).
2. **Full palette record**: a complete `ThemePalette` literal (all 33 keys,
   values carried unchanged where the direction keeps them). Directions must
   differ meaningfully in VALUE structure and warm/cold ratio, not just hue
   nudges. Candidates must respect: value storytelling, the flat-vector
   material language (no gradients), and build ON the accepted baselines
   (depth ladder + liturgical HUD). Bloom discipline: only sunCore/heart
   cross the bloom line; windowEmber rides the knee.
3. **Scene/texture knob deltas**: castleTexture density/baseline/rim per
   layer, haze bands, cloud style/scale/opacity, ash tiers (AshFall TIERS
   far/near counts/opacities/sizes), vignette darkness, sky gradient stops +
   sun treatment, pickup colour families if the direction re-voices them.
4. **Knight redraw recipe (prose, for the winner round)**: how the SAME
   identity (great helm + crest + ember visor eyes, pauldrons, two-layer
   tattered cape, greatsword over the shoulder, no face) gets a stronger
   Dark Souls read: silhouette weight, helm shape (conical vs round dome,
   crest treatment), cape length/tatter language, steel value ladder,
   rim-light discipline. State what changes in the rig's SHAPES vs colours.
5. **Why it is MORE Dark Souls than the current build** (2–4 sentences).

Constraints for candidates: the pastel kitty theme is untouched; the
candidate round ships NO shape changes — those are described only; each
candidate must be implementable as a palette override + texture-knob deltas
behind an `?ashen=N` URL param (the param scaffolding is integrator work).

## §7 Output format (STRICT)

1. Start with `## Design rationale` — deliverable 1 may be a few paragraphs,
   deliverable 5 gets a fuller rationale per candidate.
2. Then per deliverable: `## Deliverable N — <title>`, containing one or more
   code fences, each preceded by a line `FILE: <repo-relative path>` and
   `MODE: full|patch`. For `patch` blocks, show exact old/new code pairs
   anchored on real excerpt lines from §4 (context lines included) so the
   integrator can apply them mechanically. For files only summarised (Ground/
   Shadow/Obstacles/Pickups/Effects/AshFall/Echo internals), write the new
   logic as a clearly-labelled addition block and say exactly where it goes.
3. Deliverable 5 as `## Deliverable 5 — candidates`, one subsection per
   candidate containing a single TS code fence with the full `ThemePalette`
   record (comment header = candidate name), followed by the knob list and
   the knight redraw prose.
4. No diffs of files you were not given; no placeholder pseudocode; if a
   spec detail is genuinely underdetermined, make the call and note it in
   one line under the rationale.
