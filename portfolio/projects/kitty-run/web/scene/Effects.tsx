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
import type { ChromaticAberrationEffect, VignetteEffect } from "postprocessing";
import type { CharacterId } from "../lib/theme.ts";
import { soulsVignette } from "../lib/ashenVariants.ts";
import { useCharacterSwap, type CharacterRef } from "./themeSwap.ts";
import type { WorldState } from "./world.ts";

// The dark theme leans on a deeper vignette; the pastel original stays as
// it shipped. The souls value is resolved through the ?ashen scaffold, so a
// candidate also carries its own vignette depth (A 0.24 / B 0.30 / C 0.34).
const VIGNETTE_DARKNESS: Record<CharacterId, number> = {
  kitty: 0.26,
  souls: soulsVignette(),
};

export function Effects({
  world,
  reducedMotion,
  characterRef,
}: {
  world: WorldState;
  reducedMotion: boolean;
  characterRef: CharacterRef;
}) {
  const caRef = useRef<ChromaticAberrationEffect>(null);
  const vignetteRef = useRef<VignetteEffect>(null);

  // Mid-run theme swap: the vignette depth follows the active character
  // imperatively (this also resolves the recorded 0.26/0.26 discrepancy —
  // each candidate now sets its own souls depth).
  useCharacterSwap(characterRef, (c) => {
    const vignette = vignetteRef.current;
    if (vignette) vignette.darkness = VIGNETTE_DARKNESS[c];
  });

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
      <Vignette
        ref={vignetteRef}
        darkness={VIGNETTE_DARKNESS[characterRef.current]}
        offset={0.3}
      />
    </EffectComposer>
  );
}
