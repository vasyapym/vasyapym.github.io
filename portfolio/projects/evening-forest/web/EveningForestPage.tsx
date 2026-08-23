import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAmbience } from "./lib/ambience";
import {
  ForestCanvas,
  hasWebGL,
  useReducedMotion,
  type ForestControlsHandle,
} from "./scene/ForestCanvas";
import "./evening-forest.css";

type DeviceKind = "desktop" | "coarse";

function detectDevice(): DeviceKind {
  if (typeof window === "undefined") return "desktop";
  const coarse =
    window.matchMedia("(pointer: coarse)").matches ||
    !("requestPointerLock" in HTMLElement.prototype);
  return coarse ? "coarse" : "desktop";
}

export default function EveningForestPage() {
  const reducedMotion = useReducedMotion();
  const [device] = useState<DeviceKind>(detectDevice);
  const [webglOk, setWebglOk] = useState(true);
  const [locked, setLocked] = useState(false);
  const controlsRef = useRef<ForestControlsHandle | null>(null);
  const ambienceRef = useRef<ReturnType<typeof getAmbience> | null>(null);

  useEffect(() => {
    setWebglOk(hasWebGL());
  }, []);

  // Duck the ambience while paused; on real unmount leave it silent.
  useEffect(() => {
    return () => {
      ambienceRef.current?.setDimmed(true);
    };
  }, []);

  const handleLock = useCallback(() => {
    setLocked(true);
    ambienceRef.current?.setDimmed(false);
  }, []);

  const handleUnlock = useCallback(() => {
    setLocked(false);
    ambienceRef.current?.setDimmed(true);
  }, []);

  const enterForest = useCallback(() => {
    if (!ambienceRef.current) {
      ambienceRef.current = getAmbience();
    }
    // Created inside the click gesture so autoplay policies are satisfied.
    ambienceRef.current.start();
    ambienceRef.current.setDimmed(false);
    controlsRef.current?.lock();
  }, []);

  const stage = useMemo(() => {
    if (!webglOk) {
      return (
        <div className="evening-forest-fallback" role="note">
          <p className="evening-forest-fallback-title">
            The forest needs WebGL to grow.
          </p>
          <p>
            Your browser declined a 3D context, so the woods stay behind the
            mist for now.
          </p>
        </div>
      );
    }
    return (
      <>
        <ForestCanvas
          reducedMotion={reducedMotion}
          onLock={handleLock}
          onUnlock={handleUnlock}
          controlsRef={controlsRef}
        />
        {!locked && (
          <div className="evening-forest-overlay">
            {device === "desktop" ? (
              <button
                type="button"
                className="evening-forest-enter"
                onClick={enterForest}
              >
                <span className="evening-forest-enter-eyebrow">
                  First-person stroll
                </span>
                <span className="evening-forest-enter-title">
                  Into the trees
                </span>
                <span className="evening-forest-enter-hint">
                  WASD — walk &nbsp;·&nbsp; mouse — look &nbsp;·&nbsp; Esc —
                  rest
                </span>
                <span className="evening-forest-enter-action">
                  Click to enter the forest
                </span>
              </button>
            ) : (
              <div className="evening-forest-enter evening-forest-enter-static">
                <span className="evening-forest-enter-eyebrow">
                  First-person stroll
                </span>
                <span className="evening-forest-enter-title">
                  Into the trees
                </span>
                <span className="evening-forest-enter-hint">
                  This stroll asks for a keyboard and a mouse. You can still
                  watch the fireflies.
                </span>
              </div>
            )}
          </div>
        )}
        {locked && (
          <div className="evening-forest-resting-hint" aria-hidden="true">
            Esc — rest
          </div>
        )}
      </>
    );
  }, [webglOk, locked, device, reducedMotion, handleLock, handleUnlock, enterForest]);

  return (
    <article className="evening-forest-page">
      <header className="evening-forest-intro section-shell">
        <h1 className="evening-forest-title">Evening Forest</h1>
        <p className="evening-forest-lede">
          An 8-bit woodland at dusk. Walk, look, listen — nothing to win.
        </p>
      </header>
      <section className="evening-forest-stage">{stage}</section>
    </article>
  );
}
