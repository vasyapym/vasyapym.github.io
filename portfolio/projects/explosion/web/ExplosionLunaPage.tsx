import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactElement } from "react";
import {
  MODES, getMode, hasWebGL, otherMode, readModeParam, readPreferredMode, writePreferredMode,
  type ModeId, type ModeStats, type Mounted, type Technique,
} from "./modes";
import "./explosion-luna.css";

const SELECT_ACCENT = "two experiments, one room";
const SELECT_LEDE = "pick an experiment. switch anytime — your choice is remembered.";

const INITIAL_STATS: ModeStats = { fps: 0, engagements: 0 };

type View = { kind: "select" } | { kind: "mode"; id: ModeId };

// URL deep link wins over the remembered mode; nothing remembered → selector.
function initialView(): View {
  const fromUrl = readModeParam();
  if (fromUrl != null) return { kind: "mode", id: fromUrl };
  const stored = readPreferredMode();
  if (stored != null) return { kind: "mode", id: stored };
  return { kind: "select" };
}

const ICON_LANTERN: ReactElement = (
  <svg viewBox="0 0 48 48" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="24" cy="24" r="11" strokeDasharray="3.5 4" />
    <path d="M24 5v7M24 36v7M5 24h7M36 24h7" />
    <circle cx="24" cy="24" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

const ICON_INK: ReactElement = (
  <svg viewBox="0 0 48 48" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="24" cy="24" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="24" cy="24" r="9.5" strokeDasharray="11 6" />
    <circle cx="24" cy="24" r="16" strokeDasharray="7 9" />
  </svg>
);

const MODE_ICONS: Record<ModeId, ReactElement> = { lantern: ICON_LANTERN, ink: ICON_INK };

export default function ExplosionLunaPage() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pairRef = useRef<Mounted | null>(null);

  const [supported] = useState<boolean>(() => hasWebGL());
  const [view, setView] = useState<View>(initialView);
  const [mountFailed, setMountFailed] = useState<boolean>(false);
  const [stats, setStats] = useState<ModeStats>(INITIAL_STATS);
  const [hud, setHud] = useState<string>("");
  const [muted, setMuted] = useState<boolean>(false);
  const [slowMo, setSlowMo] = useState<boolean>(false);
  const mutedRef = useRef(muted);
  const slowMoRef = useRef(slowMo);

  // Mount the active mode (async: ink lazy-loads on first pick); poll stats on the
  // 400ms cadence; dispose on cleanup. StrictMode-safe: a late resolve after
  // cleanup disposes the orphan handle instead of leaking its canvas.
  useEffect(() => {
    if (!supported || view.kind !== "mode") return;
    const stage = stageRef.current;
    if (!stage) return;
    const def = getMode(view.id);
    if (readModeParam() != null) writePreferredMode(def.id);
    let disposed = false;
    let poll = 0;
    setMountFailed(false);
    setStats(INITIAL_STATS);
    setHud("");
    void def.mount(stage).then((mounted) => {
      if (mounted == null) {
        if (!disposed) setMountFailed(true);
        return;
      }
      if (disposed) {
        mounted.handle.dispose();
        return;
      }
      pairRef.current = mounted;
      mounted.handle.setMuted(mutedRef.current);
      mounted.handle.setSlowMo(slowMoRef.current);
      const tick = (): void => {
        const pair = pairRef.current;
        if (!pair) return;
        setStats({ ...pair.handle.stats });
        setHud(pair.formatHud(pair.handle.stats));
      };
      tick();
      poll = window.setInterval(tick, 400);
    });
    return () => {
      disposed = true;
      if (poll !== 0) window.clearInterval(poll);
      pairRef.current?.handle.dispose();
      pairRef.current = null;
    };
  }, [supported, view]);

  // Hotkey m: direct cycle to the other mode without passing the selector.
  useEffect(() => {
    if (view.kind !== "mode") return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== "m" || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const next = otherMode(view.id);
      writePreferredMode(next);
      setView({ kind: "mode", id: next });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return;
    pairRef.current?.handle.detonateAt(event.clientX, event.clientY);
  }, []);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const stage = stageRef.current;
    const pair = pairRef.current;
    if (!stage || !pair) return;
    const rect = stage.getBoundingClientRect();
    pair.handle.detonateAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, []);

  const handleRestore = useCallback((): void => {
    pairRef.current?.handle.restore();
  }, []);

  const handleToggleMute = useCallback((): void => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      pairRef.current?.handle.setMuted(next);
      return next;
    });
  }, []);

  const handleToggleSlowMo = useCallback((): void => {
    setSlowMo((prev) => {
      const next = !prev;
      slowMoRef.current = next;
      pairRef.current?.handle.setSlowMo(next);
      return next;
    });
  }, []);

  const pickMode = useCallback((id: ModeId): void => {
    writePreferredMode(id);
    setView({ kind: "mode", id });
  }, []);

  const backToSelect = useCallback((): void => {
    setView({ kind: "select" });
  }, []);

  const active = view.kind === "mode" ? getMode(view.id) : null;
  const dataMode = view.kind === "select" ? "select" : view.id;
  const techniques: ReadonlyArray<Technique> = active?.techniques ?? [];

  const renderStage = (): ReactElement => {
    if (view.kind === "select") {
      return (
        <div className="explosion-modes" role="group" aria-label="choose an experiment">
          {MODES.map((def) => (
            <button
              key={def.id}
              type="button"
              className="explosion-mode-card"
              data-mode-id={def.id}
              onClick={() => pickMode(def.id)}
            >
              <span className="explosion-mode-icon" aria-hidden="true">{MODE_ICONS[def.id]}</span>
              <span className="explosion-mode-name">{def.title}</span>
              <span className="explosion-mode-tagline">{def.tagline}</span>
            </button>
          ))}
        </div>
      );
    }
    if (!supported || mountFailed) {
      return (
        <div
          id="explosion-stage"
          className="explosion-stage explosion-stage--fallback"
          data-engagements={0}
        >
          <div className="explosion-stage-fallback">
            {mountFailed ? active?.fallback : "webgl is unavailable — this piece needs a webgl context to render."}
          </div>
        </div>
      );
    }
    return (
      <div
        ref={stageRef}
        id="explosion-stage"
        className="explosion-stage"
        role="button"
        tabIndex={0}
        aria-label={active?.stageLabel ?? ""}
        data-engagements={stats.engagements}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
      >
        <div className="explosion-hud" aria-hidden="true">
          {hud ? <span className="explosion-hud-line">{hud}</span> : null}
        </div>
      </div>
    );
  };

  return (
    <div className="explosion-field" data-mode={dataMode}>
      <header className="explosion-hero">
        <h1 className="explosion-title" id="explosion-title">
          explosion
          <span className="explosion-title-accent">{active ? active.accentLine : SELECT_ACCENT}</span>
        </h1>
        <p className="explosion-lede">{active ? active.lede : SELECT_LEDE}</p>
      </header>

      <div className="explosion-room">
        {renderStage()}

        {view.kind === "mode" ? (
          <>
            <div className="explosion-controls">
              <button
                type="button"
                className="explosion-btn explosion-btn-restore"
                onClick={handleRestore}
                disabled={!supported}
              >
                restore
              </button>
              <button
                type="button"
                className="explosion-btn explosion-btn-slow"
                onClick={handleToggleSlowMo}
                disabled={!supported}
                aria-pressed={slowMo}
              >
                {slowMo ? "slow-mo · on" : "slow-mo"}
              </button>
              <button
                type="button"
                className="explosion-btn explosion-btn-sound"
                onClick={handleToggleMute}
                disabled={!supported}
                aria-pressed={!muted}
              >
                {muted ? "sound · off" : "sound · on"}
              </button>
              <button
                type="button"
                className="explosion-btn explosion-btn-mode"
                onClick={backToSelect}
                disabled={!supported}
              >
                switch mode
              </button>
            </div>
            <p className="explosion-hint">
              {active?.hint ?? ""} · m switches modes
            </p>
          </>
        ) : null}
      </div>

      {active ? (
        <ul className="explosion-techniques" aria-label="Techniques inside">
          {techniques.map((t) => (
            <li key={t.label} className="explosion-technique">
              <span className="explosion-technique-label">{t.label}</span>
              <span className="explosion-technique-detail">{t.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
