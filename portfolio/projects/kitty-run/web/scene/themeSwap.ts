// Shared per-frame character-swap primitive. Components mount both themes'
// assets once, then this hook re-applies the active theme imperatively on the
// first frame after characterRef flips — no allocation, no React re-render, so
// the memoised canvas subtree is never disturbed (WebKit drawing-buffer law).

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { CharacterId } from "../lib/theme.ts";

export type CharacterRef = { readonly current: CharacterId };

export function useCharacterSwap(
  characterRef: CharacterRef,
  apply: (character: CharacterId) => void,
): void {
  const last = useRef<CharacterId | null>(null);
  useFrame(() => {
    const c = characterRef.current;
    if (c === last.current) return;
    last.current = c;
    apply(c);
  });
}
