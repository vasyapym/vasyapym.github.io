import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sfx } from "./lib/audio.ts";
import { readBestScore } from "./lib/score.ts";
import { loadReplay, type StoredReplay } from "./lib/replay.ts";
import { createWorld, type GameStatus, type WorldState } from "./scene/world.ts";
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
  // The stored best run: seed plus inputs. When present, new runs reuse
  // its seed so the echo races you over the very track it ran.
  const [replay, setReplay] = useState<StoredReplay | null>(() =>
    loadReplay(window.localStorage),
  );
  // Bumped on every start so the echo simulation is rebuilt fresh.
  const [runNonce, setRunNonce] = useState(0);
  // The replay this run is racing. Frozen at start: the over card compares
  // against the mark that was on the line, not against a replay this very
  // run may have just rewritten.
  const [raceTarget, setRaceTarget] = useState<StoredReplay | null>(null);

  const echo: WorldState | null = useMemo(() => {
    if (!replay) return null;
    const sim = createWorld(0, replay.seed);
    // The echo never sees a menu; it exists only to run.
    sim.status = "running";
    return sim;
  }, [replay, runNonce]);

  const sfxRef = useRef<Sfx | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLSpanElement | null>(null);
  const heartsRef = useRef<HTMLDivElement | null>(null);
  const comboRef = useRef<HTMLSpanElement | null>(null);
  const comboBarRef = useRef<HTMLDivElement | null>(null);
  const milestoneRef = useRef<HTMLDivElement | null>(null);
  const echoChipRef = useRef<HTMLSpanElement | null>(null);
  const debugRef = useRef<HTMLSpanElement | null>(null);

  const hud: HudRefs = useMemo(
    () => ({
      score: scoreRef,
      hearts: heartsRef,
      combo: comboRef,
      comboBar: comboBarRef,
      milestone: milestoneRef,
      echo: echoChipRef,
      debug: debugRef,
    }),
    [],
  );

  const autostarted = useRef(false);
  useEffect(() => {
    setWebglOk(hasWebGL());
    // Demo/testing hook: the route accepts ?autostart to skip the menu.
    // Once per page load — later replay updates must not restart runs.
    if (
      !autostarted.current &&
      new URLSearchParams(window.location.search).has("autostart")
    ) {
      autostarted.current = true;
      if (replay) world.runSeed = replay.seed;
      setRaceTarget(replay);
      startRun(world);
      setRunNonce((n) => n + 1);
    }
  }, [world, replay]);

  const ensureSfx = useCallback((): Sfx | null => {
    if (muted) return null;
    if (!sfxRef.current) sfxRef.current = new Sfx();
    const sfx = sfxRef.current;
    sfx.start();
    return sfx;
  }, [muted]);

  const handleStatus = useCallback(
    (next: GameStatus) => {
      setStatus(next);
      if (next === "over") {
        setBest((prev) => Math.max(prev, world.best));
        // A finished run may have written a new echo; pick it up so the
        // next race uses the fresh replay.
        setReplay(loadReplay(window.localStorage));
      }
    },
    [world],
  );

  const handleStart = useCallback(() => {
    ensureSfx();
    if (replay) world.runSeed = replay.seed;
    setRaceTarget(replay);
    startRun(world);
    setRunNonce((n) => n + 1);
  }, [ensureSfx, world, replay]);

  const handleRestart = useCallback(() => {
    ensureSfx();
    restartRun(world);
    if (replay) world.runSeed = replay.seed;
    setRaceTarget(replay);
    setRunNonce((n) => n + 1);
  }, [ensureSfx, world, replay]);

  // --- keyboard ---------------------------------------------------------------

  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        if (world.status === "running") togglePause(world);
      } else if (!muted) {
        // iOS suspends audio contexts in the background; nudge it alive.
        sfxRef.current?.start();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [world, muted]);

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
        echo={echo}
        echoInputs={replay?.inputs}
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
        <div className="kitty-run-right">
          <div className="kitty-run-score-box">
            <span className="kitty-run-score" ref={scoreRef}>
              0
            </span>
            <span className="kitty-run-best">best {best}</span>
          </div>
          {status === "running" && (
            <button
              type="button"
              className="kitty-run-pause"
              aria-label="Pause the run"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => togglePause(world)}
            />
          )}
        </div>
        <div className="kitty-run-combo">
          <span ref={comboRef} />
          <div className="kitty-run-combo-track">
            <div className="kitty-run-combo-bar" ref={comboBarRef} />
          </div>
        </div>
        <div className="kitty-run-milestone" ref={milestoneRef} aria-hidden="true" />
        {replay && status === "running" && (
          <div className="kitty-run-echochip">
            <span ref={echoChipRef}>echo · your best run</span>
          </div>
        )}
        <span
          className={`kitty-run-debug${debugOn ? " is-visible" : ""}`}
          ref={debugRef}
        />
      </div>

      {status === "ready" && (
        <div className="kitty-run-overlay kitty-run-overlay--ready">
          <button
            type="button"
            className="kitty-run-card kitty-run-card--ready"
            onClick={handleStart}
          >
            <span className="kitty-run-card-kicker">ready</span>
            {replay && (
              <span className="kitty-run-card-echo">your best run will chase you</span>
            )}
            <span className="kitty-run-card-hint">
              {coarse
                ? "tap to jump · swipe down to dash"
                : "space — jump · shift — dash · p — pause"}
            </span>
            <span className="kitty-run-card-action">start</span>
          </button>
        </div>
      )}

      {status === "paused" && (
        <div className="kitty-run-overlay">
          <button type="button" className="kitty-run-card" onClick={() => togglePause(world)}>
            <span className="kitty-run-card-kicker">paused</span>
            <span className="kitty-run-card-hint">p or esc resumes · r restarts</span>
            <span className="kitty-run-card-action">resume</span>
          </button>
        </div>
      )}

      {status === "over" && (
        <div className="kitty-run-overlay">
          <button type="button" className="kitty-run-card" onClick={handleRestart}>
            <span className="kitty-run-card-kicker">run over</span>
            {world.newBest && world.score > 0 && (
              <span className="kitty-run-card-badge">new best!</span>
            )}
            <span className="kitty-run-card-title">
              {world.score.toLocaleString()} points
            </span>
            <span className="kitty-run-card-stat">
              {Math.floor(world.distance).toLocaleString()} m run
            </span>
            {raceTarget && (
              <span className="kitty-run-card-echo">
                {world.distance >= raceTarget.distance
                  ? `${Math.max(1, Math.round(world.distance - raceTarget.distance))} m past your best mark`
                  : `${Math.max(1, Math.round(raceTarget.distance - world.distance))} m short of your best mark`}
              </span>
            )}
            <span className="kitty-run-card-hint">
              best {best} · {coarse ? "tap to run again" : "space or r runs again"}
            </span>
            <span className="kitty-run-card-action">again</span>
          </button>
        </div>
      )}
    </>
  ) : (
    <div className="kitty-run-fallback" role="note">
      <p className="kitty-run-fallback-title">webgl unavailable · run sealed</p>
    </div>
  );

  return (
    <div className="kitty-run-field">
      <article className="kitty-run-page">
        <header className="kitty-run-intro section-shell">
          <h1 className="kitty-run-title">Hello Kitty Run</h1>
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
        <footer className="kitty-run-attribution section-shell">
          <p>
            hello kitty © 1976 sanrio co., ltd. unofficial fan tribute — not
            affiliated with or endorsed by sanrio.
          </p>
        </footer>
      </article>
    </div>
  );
}
