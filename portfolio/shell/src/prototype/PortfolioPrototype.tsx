import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
} from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import "./prototype.css";

export type PrototypeVariant = "room" | "field";

type PortfolioPrototypeProps = {
  projects: readonly ProjectModule[];
  initialVariant: PrototypeVariant;
};

type Analysis = {
  words: number;
  characters: number;
  sentences: number;
  readingTime: number;
};

const SAMPLE_TEXT =
  "Good tools help us hold complex ideas. Text Lens reveals the shape of a draft and offers a few quiet signals for the next revision.";

export default function PortfolioPrototype({
  projects,
  initialVariant,
}: PortfolioPrototypeProps) {
  const [variant, setVariant] = useState<PrototypeVariant>(initialVariant);
  const [scrollProgress, setScrollProgress] = useState(0);
  const project = projects.find((entry) => entry.id === "text-lens") ?? projects[0];

  useEffect(() => {
    const updateScrollProgress = () => {
      const travel = Math.max(1, window.innerHeight * 0.85);
      setScrollProgress(Math.min(1, Math.max(0, window.scrollY / travel)));
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, []);

  const selectVariant = (nextVariant: PrototypeVariant) => {
    window.history.replaceState({}, "", `/?prototype=${nextVariant}`);
    setVariant(nextVariant);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exitPrototype = () => {
    window.history.replaceState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const pageStyle = {
    "--scroll-progress": scrollProgress,
  } as CSSProperties;

  return (
    <main
      className={`observation-prototype observation-${variant}`}
      style={pageStyle}
    >
      <div className="observation-shell">
        <ObservationHeader />
        <ObservationWorld project={project} />
        <TextLensStation project={project} />
        <PrototypeFooter />
      </div>
      <PrototypeSwitcher
        activeVariant={variant}
        onExit={exitPrototype}
        onSelect={selectVariant}
      />
    </main>
  );
}

function ObservationHeader() {
  return (
    <header className="observation-header">
      <a className="observation-wordmark" href="/">
        Selected Experiments
      </a>
      <span className="observation-header-label">Field / 01</span>
    </header>
  );
}

function ObservationWorld({ project }: { project?: ProjectModule }) {
  return (
    <section className="observation-world" aria-labelledby="world-title">
      <div className="world-topline">
        <span className="world-kicker">Observation room / field 01</span>
        <span className="world-coordinate">North / 01.04 / open</span>
      </div>

      <div className="world-intro">
        <div>
          <p className="world-index">Field guide / a working space</p>
          <h1 id="world-title">A room for looking closely.</h1>
        </div>
        <p className="world-caption">
          An unfinished collection of small instruments, arranged for inspection.
        </p>
      </div>

      <div className="world-stage">
        <div className="world-surface" aria-hidden="true">
          <div className="world-grid" />
          <div className="world-axis world-axis-horizontal" />
          <div className="world-axis world-axis-vertical" />
          <div className="world-orbit world-orbit-one" />
          <div className="world-orbit world-orbit-two" />
          <div className="world-node world-node-one" />
          <div className="world-node world-node-two" />
          <div className="world-node world-node-three" />
          <div className="world-depth-mark world-depth-mark-one">FIELD</div>
          <div className="world-depth-mark world-depth-mark-two">STUDY</div>
        </div>

        <div className="world-station-pin">
          <a
            className="station-pin"
            href="#text-lens-station"
            aria-label="Inspect Text Lens station"
            onPointerMove={handleStationPointerMove}
          >
            <span>01</span>
          </a>
          <span className="station-pin-label">
            <span className="station-pin-term">Instrument</span>
            {project?.title ?? "Text Lens"}
          </span>
        </div>
      </div>

      <a className="world-enter" href="#text-lens-station">
        Enter the field <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}

function handleStationPointerMove(event: PointerEvent<HTMLAnchorElement>) {
  if (event.pointerType === "touch") {
    return;
  }

  const bounds = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
  const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8;
  event.currentTarget.style.setProperty("--pointer-x", `${x}px`);
  event.currentTarget.style.setProperty("--pointer-y", `${y}px`);
}

function TextLensStation({ project }: { project?: ProjectModule }) {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [analysis, setAnalysis] = useState<Analysis>(() => analyzeText(SAMPLE_TEXT));

  const runAnalysis = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAnalysis(analyzeText(text));
  };

  return (
    <section
      className="station-section"
      id="text-lens-station"
      aria-labelledby="station-title"
    >
      <div className="station-section-heading">
        <div>
          <p className="station-kicker">Station / 01</p>
          <h2 id="station-title">{project?.title ?? "Text Lens"}</h2>
        </div>
        <div className="station-description">
          <p>{project?.description ?? "A small reading instrument for seeing the shape inside a draft."}</p>
          <ProjectFacts technologies={project?.technologies ?? ["React", "TypeScript", "Go"]} />
        </div>
      </div>

      <form className="station-workspace" onSubmit={runAnalysis}>
        <div className="station-input-panel">
          <div className="station-panel-heading">
            <span>Instrument / input</span>
            <span>Local reading</span>
          </div>
          <label className="station-input-label" htmlFor="prototype-text-input">
            Text to inspect
          </label>
          <textarea
            id="prototype-text-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={8}
          />
          <div className="station-input-footer">
            <span>Try a paragraph, note, or first line.</span>
            <button className="station-action" type="submit">
              Read text <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>

        <div className="station-results-panel" aria-live="polite">
          <div className="station-panel-heading">
            <span>Study / first read</span>
            <span>Output</span>
          </div>
          <p className="station-results-caption">
            A few quiet measures, not a score.
          </p>
          <div className="station-metrics">
            <StationMetric label="Words" value={analysis.words} />
            <StationMetric label="Characters" value={analysis.characters} />
            <StationMetric label="Sentences" value={analysis.sentences} />
            <StationMetric label="Reading time" value={`${analysis.readingTime} min`} />
          </div>
          <div className="station-reading-mark" aria-hidden="true">
            <span className="reading-mark-line reading-mark-line-one" />
            <span className="reading-mark-line reading-mark-line-two" />
            <span className="reading-mark-node reading-mark-node-one" />
            <span className="reading-mark-node reading-mark-node-two" />
            <span className="reading-mark-node reading-mark-node-three" />
          </div>
        </div>
      </form>

      <div className="station-footer">
        <span>Instrument / Text Lens</span>
        <a href="/projects/text-lens">
          Open the full study <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}

function StationMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="station-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProjectFacts({ technologies }: { technologies: readonly string[] }) {
  return (
    <p className="station-facts">
      {technologies.map((technology) => (
        <span key={technology}>{technology}</span>
      ))}
    </p>
  );
}

function PrototypeFooter() {
  return (
    <footer className="prototype-footer">
      <span>Prototype / observation room</span>
      <span>Visual direction only / behavior unchanged</span>
    </footer>
  );
}

function PrototypeSwitcher({
  activeVariant,
  onExit,
  onSelect,
}: {
  activeVariant: PrototypeVariant;
  onExit: () => void;
  onSelect: (variant: PrototypeVariant) => void;
}) {
  return (
    <nav className="prototype-switcher" aria-label="Observation room variants">
      <span className="prototype-switcher-label">Compare</span>
      <button
        aria-pressed={activeVariant === "room"}
        className={activeVariant === "room" ? "is-active" : ""}
        type="button"
        onClick={() => onSelect("room")}
      >
        Perspective room
      </button>
      <button
        aria-pressed={activeVariant === "field"}
        className={activeVariant === "field" ? "is-active" : ""}
        type="button"
        onClick={() => onSelect("field")}
      >
        2.5D field
      </button>
      <button className="prototype-exit" type="button" onClick={onExit}>
        Exit
      </button>
    </nav>
  );
}

function analyzeText(text: string): Analysis {
  const trimmedText = text.trim();
  const words = trimmedText ? trimmedText.split(/\s+/).length : 0;
  const sentences = trimmedText ? Math.max(1, (trimmedText.match(/[.!?]+/g) ?? []).length) : 0;

  return {
    words,
    characters: text.length,
    sentences,
    readingTime: Math.max(1, Math.ceil(words / 200)),
  };
}
