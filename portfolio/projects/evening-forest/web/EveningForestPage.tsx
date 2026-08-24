import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAmbience } from "./lib/ambience";
import { createTouchInputState, resetTouchInputState } from "./lib/touch-input";
import {
  ForestCanvas,
  hasWebGL,
  useReducedMotion,
  type ForestControlsHandle,
} from "./scene/ForestCanvas";
import { TouchControls } from "./ui/TouchControls";
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
  const [touchPlaying, setTouchPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const controlsRef = useRef<ForestControlsHandle | null>(null);
  const ambienceRef = useRef<ReturnType<typeof getAmbience> | null>(null);
  const inputRef = useRef(createTouchInputState());

  // One flag for both input schemes so the overlays and the rig agree.
  const playing = device === "coarse" ? touchPlaying : locked;

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

  const startAmbience = useCallback(() => {
    if (!ambienceRef.current) {
      ambienceRef.current = getAmbience();
    }
    // Created inside the click gesture so autoplay policies are satisfied.
    ambienceRef.current.start();
    ambienceRef.current.setDimmed(false);
  }, []);

  const enterForest = useCallback(() => {
    startAmbience();
    if (device === "coarse") {
      resetTouchInputState(inputRef.current);
      setTouchPlaying(true);
    } else {
      controlsRef.current?.lock();
    }
  }, [device, startAmbience]);

  const restFromTouch = useCallback(() => {
    resetTouchInputState(inputRef.current);
    setTouchPlaying(false);
    ambienceRef.current?.setDimmed(true);
  }, []);

  const toggleSound = useCallback(() => {
    setMuted((prev) => {
      ambienceRef.current?.setMuted(!prev);
      return !prev;
    });
  }, []);

  const handleFootstep = useCallback((intensity: number) => {
    ambienceRef.current?.footstep(intensity);
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
        <Suspense fallback={<div className="evening-forest-loading" role="status" />}>
          <ForestCanvas
            reducedMotion={reducedMotion}
            active={playing}
            touchDevice={device === "coarse"}
            inputRef={inputRef}
            onLock={handleLock}
            onUnlock={handleUnlock}
            controlsRef={controlsRef}
            onFootstep={handleFootstep}
          />
        </Suspense>
        {!playing && (
          <div className="evening-forest-overlay">
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
                {device === "coarse"
                  ? "Left thumb — walk · right thumb — look · Rest pauses"
                  : "WASD — walk · mouse — look · Esc — rest"}
              </span>
              <span className="evening-forest-enter-action">
                {device === "coarse"
                  ? "Tap to step into the trees"
                  : "Click to enter the forest"}
              </span>
            </button>
          </div>
        )}
        {playing && device === "coarse" && (
          <TouchControls
            inputRef={inputRef}
            onPause={restFromTouch}
            muted={muted}
            onToggleSound={toggleSound}
          />
        )}
        {locked && (
          <div className="evening-forest-resting-hint" aria-hidden="true">
            Esc — rest
          </div>
        )}
      </>
    );
  }, [
    webglOk,
    playing,
    locked,
    device,
    reducedMotion,
    handleLock,
    handleUnlock,
    enterForest,
    restFromTouch,
    muted,
    toggleSound,
    handleFootstep,
  ]);

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
