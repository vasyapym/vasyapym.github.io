import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { hasWebGL, mountSpecimen, type SpecimenHandle, type SpecimenStats } from "./detonate";
import "./explosion-luna.css";

const INITIAL_STATS: SpecimenStats = {
  fps: 0,
  engagements: 0,
  shards: 0,
  aloft: 0,
  sim: "cpu",
  phase: "pristine",
};

type Technique = { label: string; detail: string };

const TECHNIQUES: ReadonlyArray<Technique> = [
  { label: "gpgpu", detail: "shard state lives in ping-pong float textures; shaders integrate physics" },
  { label: "single mesh", detail: "one instanced mesh is both the lantern and its debris" },
  { label: "no timers", detail: "destruction is same-frame, never deferred or converted" },
  { label: "flashpoint", detail: "an auto shockwave bloom marks peak dispersion" },
  { label: "soft-gl safe", detail: "nearest-filtered state textures, no post chain, cpu fallback" },
];

function formatHud(stats: SpecimenStats): string {
  return [
    `fps ${Math.round(stats.fps)}`,
    `phase ${stats.phase}`,
    `aloft ${stats.aloft}/${stats.shards}`,
    `sim ${stats.sim}`,
    `blooms ${stats.engagements}`,
  ].join(" · ");
}

export default function ExplosionLunaPage() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<SpecimenHandle | null>(null);

  const [supported] = useState<boolean>(() => hasWebGL());
  const [stats, setStats] = useState<SpecimenStats>(INITIAL_STATS);
  const [muted, setMuted] = useState<boolean>(false);
  const [slowMo, setSlowMo] = useState<boolean>(false);

  // Mount the specimen once; poll stats on the 400ms cadence; dispose on cleanup.
  useEffect(() => {
    if (!supported) return;
    const stage = stageRef.current;
    if (!stage) return;
    const handle = mountSpecimen(stage);
    if (!handle) return;
    handleRef.current = handle;
    const poll = window.setInterval(() => {
      const h = handleRef.current;
      if (h) setStats({ ...h.stats });
    }, 400);
    return () => {
      window.clearInterval(poll);
      handle.dispose();
      handleRef.current = null;
    };
  }, [supported]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return;
    handleRef.current?.detonateAt(event.clientX, event.clientY);
  }, []);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const stage = stageRef.current;
    const handle = handleRef.current;
    if (!stage || !handle) return;
    const rect = stage.getBoundingClientRect();
    handle.detonateAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, []);

  const handleRestore = useCallback((): void => {
    handleRef.current?.restore();
  }, []);

  const handleToggleMute = useCallback((): void => {
    setMuted((prev) => {
      const next = !prev;
      handleRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const handleToggleSlowMo = useCallback((): void => {
    setSlowMo((prev) => {
      const next = !prev;
      handleRef.current?.setSlowMo(next);
      return next;
    });
  }, []);

  return (
    <div className="explosion-field">
      <header className="explosion-hero">
        <h1 className="explosion-title" id="explosion-title">
          explosion
          <span className="explosion-title-accent">a lantern, unmade</span>
        </h1>
        <p className="explosion-lede">
          a paper moon of six hundred shards. one click unmakes it; one click
          restores it.
        </p>
      </header>

      <div className="explosion-room">
        {supported ? (
          <div
            ref={stageRef}
            id="explosion-stage"
            className="explosion-stage"
            role="button"
            tabIndex={0}
            aria-label="detonate the paper-lantern moon; press enter or space to blast from center"
            data-engagements={stats.engagements}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
          >
            <div className="explosion-hud" aria-hidden="true">
              <span className="explosion-hud-line">{formatHud(stats)}</span>
            </div>
          </div>
        ) : (
          <div
            id="explosion-stage"
            className="explosion-stage explosion-stage--fallback"
            data-engagements={0}
          >
            <div className="explosion-stage-fallback">
              webgl is unavailable — this piece needs a webgl context to render the lantern.
            </div>
          </div>
        )}

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
        </div>

        <p className="explosion-hint">
          click to detonate · enter/space from center · restore reassembles
        </p>
      </div>

      <ul className="explosion-techniques" aria-label="Techniques inside">
        {TECHNIQUES.map((t) => (
          <li key={t.label} className="explosion-technique">
            <span className="explosion-technique-label">{t.label}</span>
            <span className="explosion-technique-detail">{t.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
