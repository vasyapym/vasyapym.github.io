// Post chain: soft bloom so bright pickups and the sun glow, a gentle
// vignette, and a chromatic pulse driven by the hit flash. Two effects at
// rest, three for a few frames after a hit — the 60fps budget stays safe.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import type { ChromaticAberrationEffect } from "postprocessing";
import type { WorldState } from "./world.ts";

export function Effects({
  world,
  reducedMotion,
}: {
  world: WorldState;
  reducedMotion: boolean;
}) {
  const caRef = useRef<ChromaticAberrationEffect>(null);

  useFrame(() => {
    const effect = caRef.current;
    if (!effect) return;
    const strength = reducedMotion ? 0 : world.hitFlash * 0.0035;
    effect.offset.set(strength, strength * 0.6);
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.24}
        mipmapBlur
      />
      <ChromaticAberration ref={caRef} offset={[0, 0]} />
      <Vignette darkness={0.26} offset={0.3} />
    </EffectComposer>
  );
}
