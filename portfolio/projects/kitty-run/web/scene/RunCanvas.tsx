// Canvas, camera and scene assembly. The camera rig jiggles with the
// world's shake trauma; everything else reads the world in its own frame.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { PALETTE } from "../lib/palette.ts";
import { BASE_CAM_Z, BASE_FOV, frameFor } from "../lib/framing.ts";
import type { Sfx } from "../lib/audio.ts";
import type { Soundtrack } from "../lib/music.ts";
import type { GameStatus, WorldState } from "./world.ts";
import { Parallax } from "./Parallax";
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

export function RunCanvas({
  world,
  echo,
  echoInputs,
  reducedMotion,
  sfxRef,
  trackRef,
  muted,
  hud,
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
  muted: boolean;
  hud: HudRefs;
  onStatus: (status: GameStatus) => void;
}) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{
        antialias: true,
        stencil: false,
        powerPreference: "high-performance",
      }}
      // near 2: the scene lives at z <= 0.2 and the camera at z >= 16, so
      // a generous near plane keeps depth precision tight — on 16-bit mobile
      // depth buffers the Kitty's paper-thin layers otherwise z-fight and
      // read as transparent.
      camera={{ fov: BASE_FOV, near: 2, far: 90, position: [0, 3.2, BASE_CAM_Z] }}
      onCreated={({ camera, gl }) => {
        gl.setClearColor(PALETTE.skyBottom);
        camera.lookAt(2.4, 2.6, 0);
      }}
    >
      <CameraRig world={world} reducedMotion={reducedMotion} />
      <Parallax world={world} />
      <Ground world={world} />
      <Shadow world={world} />
      <Obstacles world={world} />
      <Pickups world={world} />
      <Particles world={world} />
      <Kitty world={world} />
      {echo && echoInputs && (
        <Echo world={world} echo={echo} />
      )}
      <Effects world={world} reducedMotion={reducedMotion} />
      <GameLoop
        world={world}
        echo={echo}
        echoInputs={echoInputs}
        sfxRef={sfxRef}
        trackRef={trackRef}
        muted={muted}
        hud={hud}
        reducedMotion={reducedMotion}
        onStatus={onStatus}
      />
    </Canvas>
  );
}

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
