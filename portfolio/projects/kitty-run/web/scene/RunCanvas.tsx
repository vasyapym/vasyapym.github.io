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
  // ?preserve keeps the drawing buffer readable after presents, so a
  // probe can diff the rendered frame per rAF from inside the page.
  // Off by default; a dev handle, not part of the shipped look.
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
      <Shadow world={world} />
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
