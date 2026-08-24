// Canvas, camera and scene assembly. The camera rig jiggles with the
// world's shake trauma; everything else reads the world in its own frame.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { PALETTE } from "../lib/palette.ts";
import type { Sfx } from "../lib/audio.ts";
import type { GameStatus, WorldState } from "./world.ts";
import { Parallax } from "./Parallax";
import { Ground } from "./Ground";
import { Obstacles } from "./Obstacles";
import { Pickups } from "./Pickups";
import { Particles } from "./Particles";
import { Effects } from "./Effects";
import { GameLoop, type HudRefs } from "./GameLoop";
import { Kitty } from "../kitty/Kitty";

const CAMERA_BASE = new THREE.Vector3(0, 3.2, 11.5);
const LOOK_AT = new THREE.Vector3(2.4, 2.6, 0);
const BASE_FOV = 38;

function CameraRig({ world, reducedMotion }: { world: WorldState; reducedMotion: boolean }) {
  const lookTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const shake = reducedMotion ? 0 : world.shake * world.shake;
    state.camera.position.set(
      CAMERA_BASE.x + (Math.random() - 0.5) * shake * 0.5,
      CAMERA_BASE.y + (Math.random() - 0.5) * shake * 0.4,
      CAMERA_BASE.z,
    );
    lookTarget.current.set(
      LOOK_AT.x + (Math.random() - 0.5) * shake * 0.3,
      LOOK_AT.y + (Math.random() - 0.5) * shake * 0.3,
      LOOK_AT.z,
    );
    state.camera.lookAt(lookTarget.current);

    // The dash widens the view for a burst of speed; ease back after.
    const targetFov = reducedMotion
      ? BASE_FOV
      : BASE_FOV + (world.kitty.dashT > 0 ? 5 : 0) + shake * 2;
    const camera = state.camera as THREE.PerspectiveCamera;
    camera.fov += (targetFov - camera.fov) * Math.min(1, 9 * delta);
    camera.updateProjectionMatrix();
  });

  return null;
}

export function RunCanvas({
  world,
  reducedMotion,
  sfxRef,
  muted,
  hud,
  onStatus,
}: {
  world: WorldState;
  reducedMotion: boolean;
  sfxRef: React.RefObject<Sfx | null>;
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
      camera={{ fov: BASE_FOV, near: 0.1, far: 90, position: [0, 3.2, 11.5] }}
      onCreated={({ camera, gl }) => {
        gl.setClearColor(PALETTE.skyBottom);
        camera.lookAt(LOOK_AT);
      }}
    >
      <CameraRig world={world} reducedMotion={reducedMotion} />
      <Parallax world={world} />
      <Ground world={world} />
      <Obstacles world={world} />
      <Pickups world={world} />
      <Particles world={world} />
      <Kitty world={world} />
      <Effects world={world} reducedMotion={reducedMotion} />
      <GameLoop
        world={world}
        sfxRef={sfxRef}
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
