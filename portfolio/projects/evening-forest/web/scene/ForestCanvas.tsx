import { useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { COLORS, FOG_DENSITY, SUN_DIRECTION } from "../lib/palette";
import { windUniform } from "../lib/clock";
import { ForestSettingsContext } from "./settings";
import { DuskSky } from "./DuskSky";
import { Terrain } from "./Terrain";
import { Trees } from "./Trees";
import { Grass } from "./Grass";
import { Fireflies } from "./Fireflies";
import { LightShafts } from "./LightShafts";
import { FirstPersonRig } from "./FirstPersonRig";
import { RetroEffects } from "./RetroEffects";

// Advances the one shared shader clock. Slowed (not frozen) under reduced
// motion: the forest still breathes, it just breathes calmly.
function WindClock({ reducedMotion }: { reducedMotion: boolean }) {
  useFrame((_, rawDelta) => {
    windUniform.value += Math.min(rawDelta, 0.05) * (reducedMotion ? 0.3 : 1);
  });
  return null;
}

export type ForestControlsHandle = React.ComponentRef<typeof PointerLockControls>;

export type ForestCanvasProps = {
  reducedMotion: boolean;
  onLock: () => void;
  onUnlock: () => void;
  controlsRef: React.RefObject<ForestControlsHandle | null>;
};

export function ForestCanvas({
  reducedMotion,
  onLock,
  onUnlock,
  controlsRef,
}: ForestCanvasProps) {
  return (
    <Canvas
      flat
      dpr={0.36}
      gl={{
        antialias: false,
        stencil: false,
        powerPreference: "high-performance",
      }}
      camera={{ fov: 72, near: 0.1, far: 340, position: [0, 2.4, 10] }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(COLORS.fog);
        camera.rotation.order = "YXZ";
        camera.lookAt(
          SUN_DIRECTION.x * 40,
          terrainlessLookY(),
          SUN_DIRECTION.z * 40,
        );
      }}
    >
      <ForestSettingsContext.Provider value={{ reducedMotion }}>
        <fogExp2 attach="fog" args={[COLORS.fog.getHex(), FOG_DENSITY]} />
        <WindClock reducedMotion={reducedMotion} />
        <DuskSky />
        <hemisphereLight
          args={[COLORS.hemiSky, COLORS.hemiGround, 0.85]}
        />
        <directionalLight
          color={COLORS.directional}
          intensity={2.1}
          position={[
            SUN_DIRECTION.x * 120,
            SUN_DIRECTION.y * 120,
            SUN_DIRECTION.z * 120,
          ]}
        />
        <Terrain />
        <Trees />
        <Grass />
        <LightShafts />
        <Fireflies />
        <FirstPersonRig reducedMotion={reducedMotion} />
        <PointerLockControls ref={controlsRef} onLock={onLock} onUnlock={onUnlock} />
        <RetroEffects />
      </ForestSettingsContext.Provider>
    </Canvas>
  );
}

function terrainlessLookY(): number {
  // Look slightly toward the sunset band above the treeline.
  return 3.2;
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
