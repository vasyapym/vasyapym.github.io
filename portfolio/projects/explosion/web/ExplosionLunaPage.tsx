import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
} from "react";
import { hasWebGL, mountSpecimen, type SpecimenHandle } from "./detonate";
import "./explosion-luna.css";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const TECHNIQUES = [
  "structural integrity · flood-fill solver",
  "gpu instancing · two draw calls",
  "raycast crater carving",
  "procedural webaudio · zero assets",
];

type Telemetry = { voxels: number; total: number; debris: number; fps: number };

export default function ExplosionLunaPage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SpecimenHandle | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(REDUCED_MOTION_QUERY).matches);
  const [hasScene, setHasScene] = useState(true);
  const [impacts, setImpacts] = useState(0);
  const [muted, setMuted] = useState(false);
  const [slowMo, setSlowMo] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry>({ voxels: 0, total: 0, debris: 0, fps: 60 });

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !hasWebGL()) {
      setHasScene(false);
      return;
    }
    const handle = mountSpecimen(stage);
    handleRef.current = handle;
    setHasScene(handle !== null);
    if (!handle) {
      return;
    }
    const poll = window.setInterval(() => {
      setTelemetry({ ...handle.stats });
    }, 400);
    return () => {
      window.clearInterval(poll);
      handle.dispose();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!hasScene || reducedMotion) {
      return;
    }
    const applyShift = (event: KeyboardEvent) => {
      if (event.key !== "Shift") {
        return;
      }
      setSlowMo(event.type === "keydown");
      handleRef.current?.setSlowMo(event.type === "keydown");
    };
    const onBlur = () => {
      setSlowMo(false);
      handleRef.current?.setSlowMo(false);
    };
    window.addEventListener("keydown", applyShift);
    window.addEventListener("keyup", applyShift);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", applyShift);
      window.removeEventListener("keyup", applyShift);
      window.removeEventListener("blur", onBlur);
    };
  }, [hasScene, reducedMotion]);

  const triggerDetonation = (x: number, y: number) => {
    if (reducedMotion || !hasScene) {
      return;
    }
    if (handleRef.current?.detonateAt(x, y)) {
      setImpacts((current) => current + 1);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    triggerDetonation(event.clientX, event.clientY);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    triggerDetonation(bounds.left + bounds.width * 0.5, bounds.top + bounds.height * 0.52);
  };

  const handleRestore = () => {
    handleRef.current?.restore();
    setImpacts(0);
  };

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    handleRef.current?.setMuted(next);
  };

  const standing =
    telemetry.total > 0 ? Math.round((telemetry.voxels / telemetry.total) * 100) : 100;

  return (
    <div className="explosion-field">
      <section className="explosion-page" aria-labelledby="explosion-title">
        <header className="explosion-hero">
          <h1 id="explosion-title">
            One monument.
            <span>Tear it down.</span>
          </h1>
          <p className="explosion-lede">
            Every shot carves the structure away for real &mdash; and anything left
            without support comes down on its own.
          </p>
          <a className="explosion-enter" href="#explosion-stage">
            Demolish <span aria-hidden="true">↓</span>
          </a>
        </header>

        <section className="explosion-room" aria-label="Specimen room">
          <p className="explosion-room-meta">
            {reducedMotion
              ? "reduced motion · blasts disabled · restore still works"
              : "live · shift = slow motion · damage persists until restored"}
          </p>

          <div
            ref={stageRef}
            id="explosion-stage"
            className={`explosion-stage${!hasScene ? " is-fallback" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Specimen room. Click or press Enter to detonate."
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
          >
            <div className="explosion-stage-copy" aria-hidden="true">
              <span>lx-01 · {impacts.toString().padStart(3, "0")} shots</span>
              <strong>{standing}% standing</strong>
              <span className="explosion-telemetry">
                {telemetry.voxels} voxels · {telemetry.debris} debris ·{" "}
                {Math.round(telemetry.fps)} fps
              </span>
            </div>
            {!hasScene ? (
              <>
                <span className="explosion-fallback-mark" aria-hidden="true" />
                <span className="explosion-stage-fallback">webgl unavailable · specimen sealed</span>
              </>
            ) : null}
          </div>

          <div className="explosion-controls">
            <button type="button" className="explosion-control" onClick={handleRestore}>
              restore monument
            </button>
            <button
              type="button"
              className="explosion-control"
              onClick={toggleSound}
              aria-pressed={!muted}
            >
              sound · {muted ? "off" : "on"}
            </button>
            <span className="explosion-hint" aria-hidden="true">
              {slowMo ? "slow motion engaged" : "hold shift — bullet time"}
            </span>
          </div>
        </section>

        <ul className="explosion-payloads" aria-label="Techniques inside">
          {TECHNIQUES.map((technique, index) => (
            <li key={technique}>
              <span>{String(index + 1).padStart(2, "0")}</span> / {technique}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
