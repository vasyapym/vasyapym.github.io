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
import { resetPilot } from "./lib/pilot.ts";
import { buzz } from "./lib/haptics.ts";
import { Soundtrack } from "./lib/music.ts";
import {
  CHARACTER_IDS,
  characterFromParams,
  readStoredCharacter,
  storeCharacter,
  THEMES,
  type CharacterId,
} from "./lib/theme.ts";
import "./kitty-run.css";

// The three loudness sliders (master / SFX / music), persisted so a visit
// keeps its mix. Defaults mirror the Sfx engine's own bus levels, so the
// first apply is a no-op and the sound never jumps.
type AudioLevels = { master: number; sfx: number; music: number };

const AUDIO_KEY = "kitty-run/audio/v1";

const DEFAULT_LEVELS: AudioLevels = { master: 0.42, sfx: 0.9, music: 0.85 };

function loadAudioLevels(): AudioLevels {
  try {
    const raw = window.localStorage.getItem(AUDIO_KEY);
    if (!raw) return { ...DEFAULT_LEVELS };
    const parsed = JSON.parse(raw) as Partial<AudioLevels>;
    const clamp = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isFinite(v)
        ? Math.min(1, Math.max(0, v))
        : fallback;
    return {
      master: clamp(parsed.master, DEFAULT_LEVELS.master),
      sfx: clamp(parsed.sfx, DEFAULT_LEVELS.sfx),
      music: clamp(parsed.music, DEFAULT_LEVELS.music),
    };
  } catch {
    // Corrupt entry or unavailable storage: the defaults still play.
    return { ...DEFAULT_LEVELS };
  }
}

export default function KittyRunPage() {
  const world = useMemo(() => createWorld(readBestScore(window.localStorage)), []);
  const reducedMotion = useReducedMotion();
  const [webglOk, setWebglOk] = useState(true);
  // The selected character: a presentation choice, persisted like the audio
  // mix. ?souls overrides for one page load; the chip row handles the rest.
  // Only the ready screen offers the switch, so a selection never races a
  // live run.
  const [character, setCharacter] = useState<CharacterId>(() => {
    const fromParams = characterFromParams(
      new URLSearchParams(window.location.search),
    );
    return fromParams ?? readStoredCharacter(window.localStorage);
  });
  const theme = THEMES[character];
  const [status, setStatus] = useState<GameStatus>(world.status);
  const [best, setBest] = useState(world.best);
  const [muted, setMuted] = useState(false);
  // Audio mixer state: the three sliders plus whether the popover is open.
  const [audio, setAudio] = useState<AudioLevels>(loadAudioLevels);
  const [mixOpen, setMixOpen] = useState(false);
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
    // The sliders own the mix: re-apply the persisted levels on every wake
    // so a freshly-built graph comes up at the visitor's settings, and a
    // resumed context re-learns them after a background suspension.
    sfx.setMaster(audio.master);
    sfx.setSfx(audio.sfx);
    sfx.setMusic(audio.music);
    if (!trackRef.current && sfx.context && sfx.musicOutput) {
      trackRef.current = new Soundtrack(sfx.context, sfx.musicOutput);
      // A freshly built graph comes up in the selected character's mood.
      trackRef.current.setMode(character);
    }
    return sfx;
  }, [muted, audio, character]);

  // The score follows the character: a swap re-voices harmony, tempo band
  // and pad tone at the next bar; the sequencer itself never resets.
  useEffect(() => {
    trackRef.current?.setMode(character);
  }, [character]);

  // Slider drag: clamp, persist, and glide the live bus (a no-op before the
  // first gesture — the stored value is applied when the graph is built).
  const changeAudio = useCallback((key: keyof AudioLevels, value: number) => {
    const v = Math.min(1, Math.max(0, value));
    setAudio((prev) => {
      const next = { ...prev, [key]: v };
      try {
        window.localStorage.setItem(AUDIO_KEY, JSON.stringify(next));
      } catch {
        // Private mode or full storage: the sliders still work this visit.
      }
      return next;
    });
    const sfx = sfxRef.current;
    if (sfx) {
      if (key === "master") sfx.setMaster(v);
      else if (key === "sfx") sfx.setSfx(v);
      else sfx.setMusic(v);
    }
  }, []);

  // UI sounds stay polite: silent while muted, cheap no-ops before the
  // first gesture builds the context.
  const uiClick = useCallback(() => {
    if (!muted) sfxRef.current?.uiClick();
  }, [muted]);
  const uiHover = useCallback(() => {
    if (!muted) sfxRef.current?.uiHover();
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
      uiClick();
      world.autopilot = bot;
      setAutoPilot(bot);
      setAutoRan(bot);
      if (bot) resetPilot(world);
      if (replay) world.runSeed = replay.seed;
      setRaceTarget(replay);
      startRun(world);
      // A small "go" flourish under the very first steps of the run.
      if (!muted) sfxRef.current?.runStart();
      setRunNonce((n) => n + 1);
    },
    [ensureSfx, uiClick, world, replay, muted],
  );

  const handleStart = useCallback(() => beginRun(false), [beginRun]);
  const handleWatch = useCallback(() => beginRun(true), [beginRun]);

  // Character switch: presentation state plus persistence. The scene
  // re-renders through props; the simulation objects are untouched.
  const chooseCharacter = useCallback((id: CharacterId) => {
    setCharacter(id);
    storeCharacter(window.localStorage, id);
  }, []);

  // Mid-run handover: the visitor takes the sticks back from the bot.
  const takeControl = useCallback(() => {
    world.autopilot = false;
    setAutoPilot(false);
  }, [world]);

  const handleRestart = useCallback(() => {
    ensureSfx();
    uiClick();
    // Another run hands control back to the visitor — the bot only drives
    // when explicitly invited.
    world.autopilot = false;
    setAutoPilot(false);
    setAutoRan(false);
    restartRun(world);
    if (!muted) sfxRef.current?.runStart();
    if (replay) world.runSeed = replay.seed;
    setRaceTarget(replay);
    setRunNonce((n) => n + 1);
  }, [ensureSfx, uiClick, world, replay, muted]);

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
        character={character}
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
        <div className="kitty-run-right">
          <div className="kitty-run-score-box">
            <span className="kitty-run-score" ref={scoreRef}>
              0
            </span>
            <span className="kitty-run-best">
              {theme.text.best} {best}
            </span>
          </div>
          {status === "running" && (
            <button
              type="button"
              className="kitty-run-pause"
              aria-label="Pause the run"
              onPointerDown={(event) => event.stopPropagation()}
              onMouseEnter={uiHover}
              onClick={() => {
                uiClick();
                togglePause(world);
              }}
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
            {theme.text.dashLabel}
          </button>
        )}
        {autoPilot && status === "running" && (
          <button
            type="button"
            className="kitty-run-pilotchip"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={takeControl}
          >
            {theme.text.pilotLabel}
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
            <div className="kitty-run-characters" role="group" aria-label="Character">
              {CHARACTER_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`kitty-run-char${id === character ? " is-active" : ""}`}
                  aria-pressed={id === character}
                  onMouseEnter={uiHover}
                  onClick={() => {
                    uiClick();
                    chooseCharacter(id);
                  }}
                >
                  <span className="kitty-run-char-name">{THEMES[id].text.name}</span>
                  <span className="kitty-run-char-blurb">{THEMES[id].text.blurb}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="kitty-run-card kitty-run-card--ready"
              onMouseEnter={uiHover}
              onClick={handleStart}
            >
              <span className="kitty-run-card-kicker">{theme.text.readyKicker}</span>
              {replay && (
                <span className="kitty-run-card-echo">your best run will chase you</span>
              )}
              <span className="kitty-run-card-hint">
                {coarse
                  ? "tap to jump · dash pad blasts through"
                  : "space — jump · shift — dash · p — pause"}
              </span>
              <span className="kitty-run-card-action">{theme.text.readyAction}</span>
            </button>
            <button
              type="button"
              className="kitty-run-watch"
              onMouseEnter={uiHover}
              onClick={handleWatch}
            >
              <span className="kitty-run-watch-title">{theme.text.watchTitle}</span>
              <span className="kitty-run-watch-hint">{theme.text.watchHint}</span>
            </button>
          </div>
        </div>
      )}

      {status === "paused" && (
        <div className="kitty-run-overlay">
          <button
            type="button"
            className="kitty-run-card"
            onMouseEnter={uiHover}
            onClick={() => {
              uiClick();
              togglePause(world);
            }}
          >
            <span className="kitty-run-card-kicker">{theme.text.pausedKicker}</span>
            <span className="kitty-run-card-hint">{theme.text.pausedHint}</span>
            <span className="kitty-run-card-action">{theme.text.pausedAction}</span>
          </button>
        </div>
      )}

      {status === "over" && (
        <div className="kitty-run-overlay">
          <button
            type="button"
            className="kitty-run-card kitty-run-card--over"
            onMouseEnter={uiHover}
            onClick={handleRestart}
          >
            <span className="kitty-run-card-kicker">{theme.text.overKicker}</span>
            {world.newBest && world.score > 0 && (
              <span className="kitty-run-card-badge">{theme.text.overBadge}</span>
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
              {theme.text.best} {best} · {coarse ? "tap to run again" : "space or r runs again"}
            </span>
            <span className="kitty-run-card-action">{theme.text.overAction}</span>
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
      <article
        className={`kitty-run-page${character === "souls" ? " kitty-run-page--souls" : ""}`}
      >
        <header className="kitty-run-intro section-shell">
          <h1 className="kitty-run-title">Cat Runner</h1>
          <div className="kitty-run-audio">
            <button
              type="button"
              className="kitty-run-mute"
              onMouseEnter={uiHover}
              onClick={() => {
                const next = !muted;
                // Confirm with a blip on the way out (while audio still
                // lives) or on the way back in (after the context wakes).
                if (next) uiClick();
                setMuted(next);
                if (!next) {
                  ensureSfx();
                  uiClick();
                }
              }}
            >
              {muted ? "sound off" : "sound on"}
            </button>
            <button
              type="button"
              className="kitty-run-mix"
              aria-expanded={mixOpen}
              aria-label="Audio mixer: master, effects and music sliders"
              onMouseEnter={uiHover}
              onClick={() => {
                uiClick();
                setMixOpen((open) => !open);
              }}
            >
              mix
            </button>
            {mixOpen && (
              <div className="kitty-run-mixpanel">
                {(["master", "sfx", "music"] as const).map((key) => (
                  <label key={key} className="kitty-run-mixrow">
                    <span>{key}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(audio[key] * 100)}
                      onChange={(event) =>
                        changeAudio(key, Number(event.target.value) / 100)
                      }
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
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
