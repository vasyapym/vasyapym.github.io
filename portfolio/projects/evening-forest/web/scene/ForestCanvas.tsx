import { useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { COLORS, FOG_DENSITY, SUN_DIRECTION } from "../lib/palette";
import { WALKER_START } from "../lib/heightfield";
import { windUniform } from "../lib/clock";
import type { TouchInputState } from "../lib/touch-input";
import { ForestSettingsContext } from "./settings";
import { DuskSky } from "./DuskSky";
import { DaylightDriver } from "./DaylightDriver";
import { Terrain } from "./Terrain";
import { Trees } from "./Trees";
import { Grass } from "./Grass";
import { Fireflies } from "./Fireflies";
import { Fox } from "./fox/Fox";
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

// Rendering budget tiers. The 8-bit look is forgiving — everything is
// upscaled and dithered anyway — so weaker devices just render fewer
// pixels and fireflies rather than losing any features.
export type QualityTier = "high" | "mid" | "low";

const QUALITY_TIERS: Record<
  QualityTier,
  { dpr: number; fireflies: number; bloom: number }
> = {
  high: { dpr: 0.36, fireflies: 150, bloom: 0.65 },
  mid: { dpr: 0.31, fireflies: 110, bloom: 0.55 },
  low: { dpr: 0.26, fireflies: 80, bloom: 0.45 },
};

function detectQualityTier(): QualityTier {
  if (typeof navigator === "undefined") return "high";
  const coarse =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (!coarse) return cores >= 4 ? "high" : "mid";
  return cores >= 6 ? "mid" : "low";
}

export type ForestCanvasProps = {
  reducedMotion: boolean;
  // True while the player is in control (pointer lock or touch playing).
  active: boolean;
  // True on coarse-pointer devices: pointer-lock controls stay unmounted
  // there, since drei's version installs a document-wide click-to-lock
  // handler that would fight the touch flow.
  touchDevice: boolean;
  inputRef: React.RefObject<TouchInputState | null>;
  onLock: () => void;
  onUnlock: () => void;
  controlsRef: React.RefObject<ForestControlsHandle | null>;
  onFootstep?: (intensity: number) => void;
};

export function ForestCanvas({
  reducedMotion,
  active,
  touchDevice,
  inputRef,
  onLock,
  onUnlock,
  controlsRef,
  onFootstep,
}: ForestCanvasProps) {
  const [tier] = useState(detectQualityTier);
  const quality = QUALITY_TIERS[tier];

  return (
    <div className="evening-forest-canvas-host" aria-hidden="true">
      <Canvas
        flat
        dpr={quality.dpr}
        gl={{
          antialias: false,
          stencil: false,
          powerPreference: "high-performance",
        }}
        camera={{
          fov: 72,
          near: 0.1,
          far: 420,
          position: [WALKER_START.x, 2.4, WALKER_START.z],
        }}
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
          <DaylightDriver />
          <Terrain />
          <Trees />
          <Grass />
          <LightShafts />
          <Fireflies count={quality.fireflies} />
          <Fox />
          <FirstPersonRig
            reducedMotion={reducedMotion}
            active={active}
            inputRef={inputRef}
            onFootstep={onFootstep}
          />
          {!touchDevice && (
            <PointerLockControls
              ref={controlsRef}
              onLock={onLock}
              onUnlock={onUnlock}
              /* Click-to-lock must NOT sit on `document`: it would turn any
                 click in the rest menu — the dusk dial included — into an
                 instant pointer-lock and launch the forest before the visitor
                 chose to enter. Scope it to the canvas host, which the menu
                 overlay covers, so the enter button stays the only way in
                 (the same explicit confirm touch devices already have). */
              selector=".evening-forest-canvas-host"
            />
          )}
          <RetroEffects bloomIntensity={quality.bloom} />
        </ForestSettingsContext.Provider>
      </Canvas>
    </div>
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
