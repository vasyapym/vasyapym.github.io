// Post chain: soft bloom so bright pickups and the sun glow, a gentle
// vignette, and a chromatic pulse driven by the hit flash. Two effects at
// rest, three for a few frames after a hit — the 60fps budget stays safe.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import type { ChromaticAberrationEffect } from "postprocessing";
import type { CharacterId } from "../lib/theme.ts";
import type { WorldState } from "./world.ts";

// The dark theme leans on a deeper vignette; the pastel original stays as
// it shipped.
const VIGNETTE_DARKNESS: Record<CharacterId, number> = {
  kitty: 0.26,
  souls: 0.26,
};

export function Effects({
  world,
  reducedMotion,
  character,
}: {
  world: WorldState;
  reducedMotion: boolean;
  character: CharacterId;
}) {
  const caRef = useRef<ChromaticAberrationEffect>(null);

  // ?plain skips the post chain entirely — a debug/low-end escape hatch for
  // weak GPUs where the composer dominates the frame budget.
  const plain = useMemo(
    () => new URLSearchParams(window.location.search).has("plain"),
    [],
  );

  useFrame(() => {
    const effect = caRef.current;
    if (!effect) return;
    const strength = reducedMotion ? 0 : world.hitFlash * 0.0035;
    effect.offset.set(strength, strength * 0.6);
  });

  if (plain) return null;

  return (
    <EffectComposer multisampling={0}>
      {/* Threshold sits high enough that Kitty's white body and the pale sky
          stay out of the glow — only the sun, bow reds and pickup yellows
          bloom. A low threshold washes the whole scene milky. */}
      <Bloom
        intensity={0.42}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      <ChromaticAberration ref={caRef} offset={[0, 0]} />
      <Vignette darkness={VIGNETTE_DARKNESS[character]} offset={0.3} />
    </EffectComposer>
  );
}
