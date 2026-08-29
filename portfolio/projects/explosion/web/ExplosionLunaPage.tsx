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

// Locked-spec technique list (§0). Mono, lowercase; rendered as the payload grid.
const TECHNIQUES = [
  "structural integrity · flood-fill solver",
  "rust → webassembly core · 120 hz substeps",
  "three.js instancing · two draw calls",
  "live stress solver · loads reroute on impact",
  "procedural webaudio · zero assets",
];

type Telemetry = {
  voxels: number;
  total: number;
  debris: number;
  fps: number;
  slowmo: boolean;
  peakStress: number;
  engagements: number;
};

export default function ExplosionLunaPage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SpecimenHandle | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(REDUCED_MOTION_QUERY).matches);
  const [hasScene, setHasScene] = useState(true);
  const [impacts, setImpacts] = useState(0);
  const [muted, setMuted] = useState(false);
  const [slowMo, setSlowMo] = useState(false);
  const [xray, setXray] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    voxels: 0,
    total: 0,
    debris: 0,
    fps: 60,
    slowmo: false,
    peakStress: 0,
    engagements: 0,
  });

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
    const applyXrayKey = (event: KeyboardEvent) => {
      if (event.key !== "x" && event.key !== "X") {
        return;
      }
      setXray((current) => {
        const next = !current;
        handleRef.current?.setXray(next);
        return next;
      });
    };
    const onBlur = () => {
      setSlowMo(false);
      handleRef.current?.setSlowMo(false);
    };
    window.addEventListener("keydown", applyShift);
    window.addEventListener("keyup", applyShift);
    window.addEventListener("keydown", applyXrayKey);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", applyShift);
      window.removeEventListener("keyup", applyShift);
      window.removeEventListener("keydown", applyXrayKey);
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

  const toggleXray = () => {
    const next = !xray;
    setXray(next);
    handleRef.current?.setXray(next);
  };

  // Percent standing: 100 on load and after restore (total 0 ⇒ 100), else voxels/total.
  const standing =
    telemetry.total > 0 ? Math.round((telemetry.voxels / telemetry.total) * 100) : 100;

  return (
    <div className="explosion-field">
      <section className="explosion-page" aria-labelledby="explosion-title">
        <header className="explosion-hero">
          <h1 id="explosion-title">
            Raze the district
            <span>before the light goes.</span>
          </h1>
          <p className="explosion-lede">
            Every shot carves real voxels out of the monument; strip a load path and
            everything above it falls on its own. Flip x-ray to read the stress, hold
            shift for bullet time.
          </p>
          <a className="explosion-enter" href="#explosion-stage">
            Demolish <span aria-hidden="true">↓</span>
          </a>
        </header>

        <section className="explosion-room" aria-label="Specimen room">
          <p className="explosion-room-meta">
            {reducedMotion
              ? "reduced motion · blasts disabled · restore still works"
              : "live · shift = bullet time · x = stress map · damage persists until restored"}
          </p>

          <div
            ref={stageRef}
            id="explosion-stage"
            className={`explosion-stage${!hasScene ? " is-fallback" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Specimen room. Click or press Enter to detonate."
            data-engagements={telemetry.engagements}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
          >
            <div className="explosion-stage-copy" aria-hidden="true">
              <span>lx-01 · {impacts.toString().padStart(3, "0")} shots</span>
              <strong>{standing}% standing</strong>
              <span className="explosion-telemetry">
                {telemetry.voxels} voxels · {telemetry.debris} debris · peak{" "}
                {Math.round(telemetry.peakStress * 100)}% stress · {Math.round(telemetry.fps)} fps
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
            <button
              type="button"
              className="explosion-control explosion-control-restore"
              onClick={handleRestore}
            >
              restore monument
            </button>
            <button
              type="button"
              className="explosion-control explosion-control-xray"
              onClick={toggleXray}
              aria-pressed={xray}
            >
              x-ray · {xray ? "on" : "off"}
            </button>
            <button
              type="button"
              className="explosion-control explosion-control-sound"
              onClick={toggleSound}
              aria-pressed={!muted}
            >
              sound · {muted ? "off" : "on"}
            </button>
            <span className="explosion-hint" aria-hidden="true">
              {slowMo
                ? "bullet time engaged"
                : telemetry.slowmo
                  ? "time dilated — collapse cam"
                  : xray
                    ? "stress map · hot = carrying the span"
                    : telemetry.peakStress > 0.72
                      ? "columns overloaded · press x for stress"
                      : "hold shift — bullet time · press x — stress map"}
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
