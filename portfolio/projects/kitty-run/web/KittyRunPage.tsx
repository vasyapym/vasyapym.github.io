import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sfx } from "./lib/audio.ts";
import { readBestScore } from "./lib/score.ts";
import { DEFAULT_SKILL } from "./lib/director.ts";
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
import { resetPilot } from "./lib/pilot.ts";
import { buzz } from "./lib/haptics.ts";
import { Soundtrack } from "./lib/music.ts";
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
  // Autopilot demo: true while the lookahead pilot drives. A bot run is an
  // exhibition — it never writes best scores or replays (see GameLoop).
  const [autoPilot, setAutoPilot] = useState(false);
  // Remembers that the run just ended was flown by the bot, so the over
  // card can say so.
  const [autoRan, setAutoRan] = useState(false);

  const echo: WorldState | null = useMemo(() => {
    if (!replay) return null;
    const sim = createWorld(0, replay.seed);
    // The echo never sees a menu; it exists only to run.
    sim.status = "running";
    // Same (seed, skill) the player run uses → identical track.
    sim.directorSkill = replay.skill;
    return sim;
  }, [replay, runNonce]);

  const sfxRef = useRef<Sfx | null>(null);
  // The adaptive soundtrack rides the same AudioContext as the sfx; it
  // is created lazily inside the first user gesture, beside the sfx.
  const trackRef = useRef<Soundtrack | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLSpanElement | null>(null);
  const heartsRef = useRef<HTMLDivElement | null>(null);
  const comboRef = useRef<HTMLSpanElement | null>(null);
  const comboBarRef = useRef<HTMLDivElement | null>(null);
  const milestoneRef = useRef<HTMLDivElement | null>(null);
  const dashRef = useRef<HTMLButtonElement | null>(null);
  const bulletRef = useRef<HTMLDivElement | null>(null);
  const debugRef = useRef<HTMLSpanElement | null>(null);
  const districtRef = useRef<HTMLDivElement | null>(null);

  const hud: HudRefs = useMemo(
    () => ({
      score: scoreRef,
      hearts: heartsRef,
      combo: comboRef,
      comboBar: comboBarRef,
      milestone: milestoneRef,
      dash: dashRef,
      bullet: bulletRef,
      debug: debugRef,
      district: districtRef,
    }),
    [],
  );

  const autostarted = useRef(false);
  useEffect(() => {
    setWebglOk(hasWebGL());
    // Demo/testing hooks: ?autostart skips the menu, ?autopilot starts
    // straight into the bot-driven exhibition. Once per page load — later
    // replay updates must not restart runs.
    if (autostarted.current) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("autostart") && !params.has("autopilot")) return;
    autostarted.current = true;
    const bot = params.has("autopilot");
    if (replay) world.runSeed = replay.seed;
    world.directorSkill = replay?.skill ?? DEFAULT_SKILL;
    setRaceTarget(replay);
    world.autopilot = bot;
    setAutoPilot(bot);
    setAutoRan(bot);
    if (bot) resetPilot(world);
    startRun(world);
    setRunNonce((n) => n + 1);
  }, [world, replay]);

  const ensureSfx = useCallback((): Sfx | null => {
    if (muted) return null;
    if (!sfxRef.current) sfxRef.current = new Sfx();
    const sfx = sfxRef.current;
    sfx.start();
    if (!trackRef.current && sfx.context && sfx.output) {
      trackRef.current = new Soundtrack(sfx.context, sfx.output);
    }
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

  const beginRun = useCallback(
    (bot: boolean) => {
      ensureSfx();
      world.autopilot = bot;
      setAutoPilot(bot);
      setAutoRan(bot);
      if (bot) resetPilot(world);
      if (replay) world.runSeed = replay.seed;
      world.directorSkill = replay?.skill ?? DEFAULT_SKILL;
      setRaceTarget(replay);
      startRun(world);
      setRunNonce((n) => n + 1);
    },
    [ensureSfx, world, replay],
  );

  const handleStart = useCallback(() => beginRun(false), [beginRun]);
  const handleWatch = useCallback(() => beginRun(true), [beginRun]);

  // Mid-run handover: the visitor takes the sticks back from the bot.
  const takeControl = useCallback(() => {
    world.autopilot = false;
    setAutoPilot(false);
  }, [world]);

  const handleRestart = useCallback(() => {
    ensureSfx();
    // Another run hands control back to the visitor — the bot only drives
    // when explicitly invited.
    world.autopilot = false;
    setAutoPilot(false);
    setAutoRan(false);
    restartRun(world);
    if (replay) world.runSeed = replay.seed;
    world.directorSkill = replay?.skill ?? DEFAULT_SKILL;
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
      // While the autopilot drives, jump/dash keys are spectators' keys —
      // only screen controls respond.
      switch (event.code) {
        case "Space":
        case "ArrowUp":
        case "KeyW":
          event.preventDefault();
          if (world.status === "ready") handleStart();
          else if (world.status === "over") handleRestart();
          else if (!world.autopilot) requestJump(world);
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
          if (!world.autopilot) requestDash(world);
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
      if (
        !world.autopilot &&
        (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW")
      ) {
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
  //
  // The tap jumps on finger-down for zero-latency feel; the swipe-down is
  // recognised fast (short drag or quick flick) and — because actions.
  // requestDash rescinds a fresh jump — the duck always wins over the
  // accidental hop, however late the gesture resolves.

  const gesture = useRef<{ x: number; y: number; t: number } | null>(null);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      gesture.current = {
        x: event.clientX,
        y: event.clientY,
        t: performance.now(),
      };
      if (world.status === "running" && !world.autopilot) requestJump(world);
    },
    [world],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      const dy = event.clientY - g.y;
      const elapsed = performance.now() - g.t;
      // A decisive downward drag, or a quick downward flick — either
      // counts immediately so the dash lands while the hazard is close.
      const flick = dy > 10 && elapsed < 90;
      if (dy > 26 || flick) {
        gesture.current = null;
        if (!world.autopilot) requestDash(world);
      }
    },
    [world],
  );

  const endGesture = useCallback(() => {
    gesture.current = null;
    // A spectator lifting their finger must not cut the bot's jump arc.
    if (!world.autopilot) releaseJump(world);
  }, [world]);

  const onPointerCancel = useCallback(() => {
    // Browsers fire this when a scroll/system gesture steals the pointer:
    // treat it as a plain lift, never as a dash or a cut jump.
    gesture.current = null;
  }, []);

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
        trackRef={trackRef}
        muted={muted}
        hud={hud}
        onStatus={handleStatus}
      />
      <Floaters world={world} stageRef={stageRef} />
      <div className="kitty-run-bullet" ref={bulletRef} aria-hidden="true" />

      <div className="kitty-run-hud">
        <div className="kitty-run-hearts" ref={heartsRef} aria-hidden="true">
          <span className="kitty-run-heart" />
          <span className="kitty-run-heart" />
          <span className="kitty-run-heart" />
        </div>
        <div
          ref={districtRef}
          className="kitty-run-district"
          aria-live="polite"
        />
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
        {status === "running" && !autoPilot && (
          <button
            type="button"
            className="kitty-run-dash"
            ref={dashRef}
            aria-label="Dash"
            onPointerDown={(event) => {
              event.stopPropagation();
              requestDash(world);
              buzz(10);
            }}
          >
            dash
          </button>
        )}
        {autoPilot && status === "running" && (
          <button
            type="button"
            className="kitty-run-pilotchip"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={takeControl}
          >
            autopilot · take control
          </button>
        )}
        <span
          className={`kitty-run-debug${debugOn ? " is-visible" : ""}`}
          ref={debugRef}
        />
      </div>

      {status === "ready" && (
        <div className="kitty-run-overlay kitty-run-overlay--ready">
          <div className="kitty-run-ready-stack">
            <button
              type="button"
              className="kitty-run-card kitty-run-card--ready"
              onClick={handleStart}
            >
              <span className="kitty-run-card-kicker">wander</span>
              {replay && (
                <span className="kitty-run-card-echo">your best run haunts your heels</span>
              )}
              <span className="kitty-run-card-hint">
                {coarse
                  ? "tap to jump · dash pad blasts through"
                  : "space — jump · shift — dash · p — pause"}
              </span>
              <span className="kitty-run-card-action">prowl</span>
            </button>
            <button type="button" className="kitty-run-watch" onClick={handleWatch}>
              <span className="kitty-run-watch-title">or watch it haunt itself</span>
              <span className="kitty-run-watch-hint">
                autopilot · the lookahead bot that verifies every track
              </span>
            </button>
          </div>
        </div>
      )}

      {status === "paused" && (
        <div className="kitty-run-overlay">
          <button type="button" className="kitty-run-card" onClick={() => togglePause(world)}>
            <span className="kitty-run-card-kicker">stilled</span>
            <span className="kitty-run-card-hint">p or esc wakes her · r restarts</span>
            <span className="kitty-run-card-action">wake up</span>
          </button>
        </div>
      )}

      {status === "over" && (
        <div className="kitty-run-overlay">
          <button type="button" className="kitty-run-card" onClick={handleRestart}>
            <span className="kitty-run-card-kicker">wish spent</span>
            {world.newBest && world.score > 0 && (
              <span className="kitty-run-card-badge">best wish!</span>
            )}
            <span className="kitty-run-card-title">
              {world.score.toLocaleString()} points
            </span>
            <span className="kitty-run-card-stat">
              {Math.floor(world.distance).toLocaleString()} m run
            </span>
            {autoRan && (
              <span className="kitty-run-card-echo">
                flown by the engine's test pilot — your records untouched
              </span>
            )}
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
            <span className="kitty-run-card-action">anew</span>
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
          <h1 className="kitty-run-title">Cat Runner</h1>
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
          onPointerUp={endGesture}
          onPointerCancel={onPointerCancel}
        >
          {stage}
        </section>
      </article>
    </div>
  );
}
