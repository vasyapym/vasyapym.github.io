import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sfx } from "./lib/audio.ts";
import { readBestScore } from "./lib/score.ts";
import { createWorld, type GameStatus } from "./scene/world.ts";
import {
  hasWebGL,
  RunCanvas,
  useReducedMotion,
} from "./scene/RunCanvas";
import type { HudRefs } from "./scene/GameLoop";
import { Floaters } from "./scene/Floaters";
import { restartRun, startRun, togglePause } from "./scene/step.ts";
import {
  releaseJump,
  requestDash,
  requestJump,
} from "./scene/actions.ts";
import "./kitty-run.css";

export default function KittyRunPage() {
  const world = useMemo(() => createWorld(readBestScore(window.localStorage)), []);
  const reducedMotion = useReducedMotion();
  const [webglOk, setWebglOk] = useState(true);
  const [status, setStatus] = useState<GameStatus>(world.status);
  const [best, setBest] = useState(world.best);
  const [muted, setMuted] = useState(false);

  const sfxRef = useRef<Sfx | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLSpanElement | null>(null);
  const heartsRef = useRef<HTMLDivElement | null>(null);
  const comboRef = useRef<HTMLSpanElement | null>(null);
  const comboBarRef = useRef<HTMLDivElement | null>(null);
  const debugRef = useRef<HTMLSpanElement | null>(null);

  const hud: HudRefs = useMemo(
    () => ({
      score: scoreRef,
      hearts: heartsRef,
      combo: comboRef,
      comboBar: comboBarRef,
      debug: debugRef,
    }),
    [],
  );

  useEffect(() => {
    setWebglOk(hasWebGL());
    // Demo/testing hook: the route accepts ?autostart to skip the menu.
    if (new URLSearchParams(window.location.search).has("autostart")) {
      startRun(world);
    }
  }, [world]);

  const ensureSfx = useCallback((): Sfx | null => {
    if (muted) return null;
    if (!sfxRef.current) sfxRef.current = new Sfx();
    const sfx = sfxRef.current;
    sfx.start();
    return sfx;
  }, [muted]);

  const handleStatus = useCallback((next: GameStatus) => {
    setStatus(next);
    if (next === "over") setBest((prev) => Math.max(prev, world.best));
  }, [world]);

  const handleStart = useCallback(() => {
    ensureSfx();
    startRun(world);
  }, [ensureSfx, world]);

  const handleRestart = useCallback(() => {
    ensureSfx();
    restartRun(world);
  }, [ensureSfx, world]);

  // --- keyboard ---------------------------------------------------------------

  useEffect(() => {
    const onHide = () => {
      if (document.hidden && world.status === "running") togglePause(world);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [world]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      switch (event.code) {
        case "Space":
        case "ArrowUp":
        case "KeyW":
          event.preventDefault();
          if (world.status === "ready") handleStart();
          else if (world.status === "over") handleRestart();
          else requestJump(world);
          break;
        case "Enter":
          if (world.status === "ready") handleStart();
          else if (world.status === "over") handleRestart();
          break;
        case "ShiftLeft":
        case "ShiftRight":
        case "ArrowDown":
        case "KeyS":
          event.preventDefault();
          requestDash(world);
          break;
        case "KeyP":
        case "Escape":
          togglePause(world);
          break;
        case "KeyR":
          if (world.status === "over" || world.status === "paused") {
            handleRestart();
          }
          break;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
        releaseJump(world);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [world, handleStart, handleRestart]);

  // --- touch: tap = jump, swipe down = dash -------------------------------------

  const pointerY = useRef<number | null>(null);
  const pointerTime = useRef(0);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      pointerY.current = event.clientY;
      pointerTime.current = performance.now();
      if (world.status === "running") requestJump(world);
    },
    [world],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (pointerY.current === null) return;
      if (event.clientY - pointerY.current > 42) {
        requestDash(world);
        pointerY.current = null;
      }
    },
    [world],
  );

  const onPointerUp = useCallback(() => {
    pointerY.current = null;
    releaseJump(world);
  }, [world]);

  const coarse = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
    [],
  );
  const debugOn = useMemo(
    () => new URLSearchParams(window.location.search).has("debug"),
    [],
  );

  const stage = webglOk ? (
    <>
      <RunCanvas
        world={world}
        reducedMotion={reducedMotion}
        sfxRef={sfxRef}
        muted={muted}
        hud={hud}
        onStatus={handleStatus}
      />
      <Floaters world={world} stageRef={stageRef} />

      <div className="kitty-run-hud">
        <div className="kitty-run-hearts" ref={heartsRef} aria-hidden="true">
          <span className="kitty-run-heart" />
          <span className="kitty-run-heart" />
          <span className="kitty-run-heart" />
        </div>
        <div className="kitty-run-score-box">
          <span className="kitty-run-score" ref={scoreRef}>
            0
          </span>
          <span className="kitty-run-best">best {best}</span>
        </div>
        <div className="kitty-run-combo">
          <span ref={comboRef} />
          <div className="kitty-run-combo-track">
            <div className="kitty-run-combo-bar" ref={comboBarRef} />
          </div>
        </div>
        <span
          className={`kitty-run-debug${debugOn ? " is-visible" : ""}`}
          ref={debugRef}
        />
      </div>

      {status === "ready" && (
        <div className="kitty-run-overlay">
          <button type="button" className="kitty-run-card" onClick={handleStart}>
            <span className="kitty-run-card-eyebrow">Pastel endless runner</span>
            <span className="kitty-run-card-title">Hello Kitty Run</span>
            <span className="kitty-run-card-hint">
              {coarse
                ? "Tap to jump · swipe down to dash"
                : "Space — jump (twice for double) · Shift — dash · P — pause"}
            </span>
            <span className="kitty-run-card-action">Start the run</span>
          </button>
        </div>
      )}

      {status === "paused" && (
        <div className="kitty-run-overlay">
          <button type="button" className="kitty-run-card" onClick={() => togglePause(world)}>
            <span className="kitty-run-card-eyebrow">Paused</span>
            <span className="kitty-run-card-title">Catch your breath</span>
            <span className="kitty-run-card-hint">P or Esc resumes · R restarts</span>
            <span className="kitty-run-card-action">Keep running</span>
          </button>
        </div>
      )}

      {status === "over" && (
        <div className="kitty-run-overlay">
          <button type="button" className="kitty-run-card" onClick={handleRestart}>
            <span className="kitty-run-card-eyebrow">Run over</span>
            <span className="kitty-run-card-title">
              {world.score.toLocaleString()} points
            </span>
            <span className="kitty-run-card-hint">
              best {best} · {coarse ? "tap to run again" : "Space or R to run again"}
            </span>
            <span className="kitty-run-card-action">One more run</span>
          </button>
        </div>
      )}
    </>
  ) : (
    <div className="kitty-run-fallback" role="note">
      <p className="kitty-run-fallback-title">The run needs WebGL to start.</p>
      <p>Your browser declined a 3D context, so Kitty waits patiently.</p>
    </div>
  );

  return (
    <article className="kitty-run-page">
      <header className="kitty-run-intro section-shell">
        <h1 className="kitty-run-title">Hello Kitty Run</h1>
        <p className="kitty-run-lede">
          A pastel endless runner. Jump the crates, ride the dash, keep the
          heart combo alive.
        </p>
        <button
          type="button"
          className="kitty-run-mute"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            if (!next) ensureSfx();
          }}
        >
          {muted ? "sound off" : "sound on"}
        </button>
      </header>
      <section
        className="kitty-run-stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {stage}
      </section>
    </article>
  );
}
