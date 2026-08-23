import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { detonate, hasWebGL, mountSpecimen } from "./detonate";
import "./explosion-luna.css";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const PAYLOADS = [
  {
    name: "Core",
    label: "01 / emissive",
    detail: "An icosahedral shell with a hot center and a material edge that catches the key light.",
  },
  {
    name: "Fracture field",
    label: "02 / tetrahedra",
    detail: "Low-poly shards with independent spin, drag, gravity, and depth through the camera.",
  },
  {
    name: "Impact rings",
    label: "03 / wavefront",
    detail: "Three expanding torus wavefronts make every hit feel spatial rather than flat.",
  },
  {
    name: "Spark cloud",
    label: "04 / particles",
    detail: "A lit point cloud carries the burst beyond the mesh silhouette and fades into the field.",
  },
];

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
    <section className="explosion-page" aria-labelledby="explosion-title">
      <header className="explosion-hero">
        <div>
          <p className="eyebrow explosion-eyebrow">Explosion / unlisted specimen</p>
          <h1 id="explosion-title">
            Break the specimen.
            <span>Keep clicking.</span>
          </h1>
          <p className="explosion-intro">
            A sealed specimen room built on Three.js. Every ordinary click inside the room is
            intercepted at the pointer and turned into a local impact: real meshes, depth,
            sparks, and a few secondary blasts landing nearby.
          </p>
        </div>
        <dl className="explosion-facts">
          <div>
            <dt>Runtime</dt>
            <dd>Three.js / WebGL</dd>
          </div>
          <div>
            <dt>Models</dt>
            <dd>Icosahedron, tetrahedron, octahedron</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>{detonationCount.toString().padStart(3, "0")} impacts recorded</dd>
          </div>
        </dl>
      </header>

      <section className="explosion-stage-shell" aria-labelledby="explosion-stage-title">
        <div className="explosion-stage-heading">
          <div>
            <p className="eyebrow explosion-eyebrow">Live specimen room</p>
            <h2 id="explosion-stage-title">A small room for large reactions.</h2>
          </div>
          <p className="explosion-stage-status">
            {reducedMotion ? "Reduced motion is on. The models stay stable and the blast is disabled." : "Click the room or press Enter to trigger a local impact."}
          </p>
        </div>

        <div
          ref={stageRef}
          className={`explosion-stage${!hasScene ? " is-fallback" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="Explosion specimen room. Click or press Enter to detonate."
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        >
          <div className="explosion-stage-copy" aria-hidden="true">
            <span>SPECIMEN / LX-01</span>
            <strong>{detonationCount.toString().padStart(3, "0")} IMPACTS</strong>
          </div>
          {!hasScene ? (
            <>
              <span className="explosion-fallback-mark" aria-hidden="true" />
              <span className="explosion-stage-fallback">WebGL is unavailable. The specimen remains sealed.</span>
            </>
          ) : null}
        </div>
      </section>

      <div className="explosion-payloads" aria-label="Explosion payloads">
        {PAYLOADS.map((payload) => (
          <article className="explosion-payload" key={payload.name}>
            <h3>{payload.name}</h3>
            <span>{payload.label}</span>
            <p>{payload.detail}</p>
          </article>
        ))}
      </div>

      <footer className="explosion-footer">
        <p>
          The detonation is local to the room: the impact lands where you click, and the rest of
          the page stays still.
        </p>
        <span>Keyboard: <kbd>Enter</kbd> / <kbd>Space</kbd></span>
      </footer>
    </section>
  );
}
