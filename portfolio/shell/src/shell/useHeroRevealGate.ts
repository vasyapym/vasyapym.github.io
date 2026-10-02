import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type HeroPhase = "gated" | "open" | "settled";

const HERO_FONTS = [
  "600 1em \"IBM Plex Sans\"",
  "700 1em \"IBM Plex Sans\"",
  "400 1em \"IBM Plex Mono\"",
  "500 1em \"IBM Plex Mono\"",
] as const;

const GATE_CAP_MS = 600;

// Module-scoped, deliberately not sessionStorage: survives SPA route changes
// (return mounts resolve to "settled" — no replay, no blank flash), resets on
// a full reload — where the gate is still wanted, because a cold swap can
// reflow the cluster even off HTTP cache.
let revealedOnce = false;

// "gated"   first mount: the gate class is present from the very first render
//           → cluster hidden, entrances paused (their delays do not tick).
// "open"    fonts loaded + settle converged (or the 600ms cap): class dropped,
//           entrances run from zero.
// "settled" return mount: no gate, no entrances (settled class via the
//           return-visit seed).
export function useHeroRevealGate(settle: () => void): HeroPhase {
  const [phase, setPhase] = useState<HeroPhase>(() => (revealedOnce ? "settled" : "gated"));

  // latest-ref so a non-memoised settle can't restart the effect (and slide the cap)
  const settleRef = useRef(settle);
  useLayoutEffect(() => {
    settleRef.current = settle;
  });

  useEffect(() => {
    if (phase !== "gated") return;

    let cancelled = false;
    let opened = false;
    let cap = 0;

    const open = () => {
      if (cancelled || opened) return;
      opened = true;
      window.clearTimeout(cap);
      try {
        settleRef.current(); // converge --hero-bottom-pad with the fonts we have now, before revealing
      } finally {
        revealedOnce = true;
        setPhase("open"); // the class leaves via state; nothing touches classList
      }
    };

    cap = window.setTimeout(open, GATE_CAP_MS);

    if (!("fonts" in document)) {
      open();
      return () => { cancelled = true; };
    }

    // Force the loads: fonts.ready only waits for loads already requested, so
    // it can resolve before these faces were ever asked for. load() requests
    // them and settles per face.
    Promise.allSettled(HERO_FONTS.map((f) => document.fonts.load(f))).then(() => {
      if (cancelled) return;
      if (opened) settleRef.current(); // cap won the race, fonts landed late → re-converge
      else open();
    });

    return () => {
      cancelled = true; // StrictMode double-run: the first run is fully neutralised here
      window.clearTimeout(cap);
    };
  }, [phase]);

  return phase;
}
