import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { detonate, hasWebGL, mountSpecimen } from "./detonate";
import "./explosion-luna.css";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const PAYLOADS = ["core", "fracture field", "impact rings", "spark cloud"];

export default function ExplosionLunaPage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(REDUCED_MOTION_QUERY).matches);
  const [hasScene, setHasScene] = useState(true);
  const [detonationCount, setDetonationCount] = useState(0);

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
    const dispose = mountSpecimen(stage);
    setHasScene(dispose !== null);
    return dispose ?? undefined;
  }, []);

  const triggerDetonation = (x: number, y: number) => {
    if (reducedMotion || !hasScene) {
      return;
    }
    if (detonate({ x, y })) {
      setDetonationCount((current) => current + 1);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    triggerDetonation(event.clientX, event.clientY);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    triggerDetonation(bounds.left + bounds.width * 0.5, bounds.top + bounds.height * 0.44);
  };

  return (
    <div className="explosion-field">
      <section className="explosion-page" aria-labelledby="explosion-title">
        <header className="explosion-hero">
          <h1 id="explosion-title">
            Click anywhere.
            <span>It breaks.</span>
          </h1>
          <a className="explosion-enter" href="#explosion-stage">
            Detonate <span aria-hidden="true">↓</span>
          </a>
        </header>

        <section className="explosion-room" aria-label="Specimen room">
          <p className="explosion-room-meta">
            {reducedMotion ? "reduced motion · blast disabled" : "live · click or press enter"}
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
              <span>specimen / lx-01</span>
              <strong>{detonationCount.toString().padStart(3, "0")} impacts</strong>
            </div>
            {!hasScene ? (
              <>
                <span className="explosion-fallback-mark" aria-hidden="true" />
                <span className="explosion-stage-fallback">webgl unavailable · specimen sealed</span>
              </>
            ) : null}
          </div>
        </section>

        <ul className="explosion-payloads" aria-label="Inside every detonation">
          {PAYLOADS.map((payload, index) => (
            <li key={payload}>
              <span>{String(index + 1).padStart(2, "0")}</span> / {payload}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
