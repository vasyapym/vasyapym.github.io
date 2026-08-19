import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import "./prototype.css";

export type PrototypeVariant = "room" | "field";

type PortfolioPrototypeProps = {
  projects: readonly ProjectModule[];
  initialVariant: PrototypeVariant;
  comparisonMode?: boolean;
};

type Analysis = {
  words: number;
  characters: number;
  sentences: number;
  readingTime: number;
};

type PartId = "sheet" | "frame" | "type" | "spine";

type PartPosition = {
  x: number;
  y: number;
};

type DragState = {
  id: PartId;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type PartDefinition = {
  id: PartId;
  label: string;
  className: string;
  scatterX: number;
  scatterY: number;
  scatterZ: number;
  baseZ: number;
  rotation: number;
};

const SAMPLE_TEXT =
  "Good tools help us hold complex ideas. Text Lens reveals the shape of a draft and offers a few quiet signals for the next revision.";

const PARTS: readonly PartDefinition[] = [
  {
    id: "sheet",
    label: "Text sheet",
    className: "artifact-part-sheet",
    scatterX: -118,
    scatterY: -58,
    scatterZ: 96,
    baseZ: 14,
    rotation: -8,
  },
  {
    id: "frame",
    label: "Metal frame",
    className: "artifact-part-frame",
    scatterX: 126,
    scatterY: -38,
    scatterZ: 54,
    baseZ: 28,
    rotation: 7,
  },
  {
    id: "type",
    label: "Typographic plate",
    className: "artifact-part-type",
    scatterX: 82,
    scatterY: 88,
    scatterZ: 122,
    baseZ: 44,
    rotation: -3,
  },
  {
    id: "spine",
    label: "Binding spine",
    className: "artifact-part-spine",
    scatterX: -132,
    scatterY: 74,
    scatterZ: 72,
    baseZ: 36,
    rotation: 13,
  },
];

const INITIAL_PART_POSITIONS = PARTS.reduce<Record<PartId, PartPosition>>(
  (positions, part) => {
    positions[part.id] = { x: 0, y: 0 };
    return positions;
  },
  {} as Record<PartId, PartPosition>,
);

export default function PortfolioPrototype({
  projects,
  initialVariant,
  comparisonMode = false,
}: PortfolioPrototypeProps) {
  const [variant, setVariant] = useState<PrototypeVariant>(initialVariant);
  const [scrollProgress, setScrollProgress] = useState(0);
  const project = projects.find((entry) => entry.id === "text-lens") ?? projects[0];

  useEffect(() => {
    const updateScrollProgress = () => {
      const travel = Math.max(1, window.innerHeight * 0.78);
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
    "--assembly-progress": scrollProgress,
  } as CSSProperties;

  return (
    <main
      className={`observation-prototype observation-${variant}`}
      style={pageStyle}
    >
      <div className="observation-shell">
        <ObservationHeader variant={variant} />
        <ObservationWorld project={project} />
        <TextLensStation comparisonMode={comparisonMode} project={project} />
        <PrototypeFooter comparisonMode={comparisonMode} />
      </div>
      {comparisonMode && (
        <PrototypeSwitcher
          activeVariant={variant}
          onExit={exitPrototype}
          onSelect={selectVariant}
        />
      )}
    </main>
  );
}

function ObservationHeader({ variant }: { variant: PrototypeVariant }) {
  return (
    <header className="observation-header">
      <a className="observation-wordmark" href="/">
        Selected Experiments
      </a>
      <span className="observation-header-label">
        {variant === "room" ? "Assembly field" : "Typographic field"}
      </span>
    </header>
  );
}

function ObservationWorld({ project }: { project?: ProjectModule }) {
  return (
    <section className="observation-world" aria-labelledby="world-title">
      <div className="world-topline">
        <span className="world-kicker">A field of unfinished instruments</span>
        <span className="world-coordinate">Selected Experiments</span>
      </div>

      <div className="world-intro">
        <div>
          <p className="world-index">Made to understand how things work.</p>
          <h1 id="world-title">A field of unfinished instruments.</h1>
        </div>
        <p className="world-caption">
          Small tools for learning by making. Scroll to assemble the first one, then move closer.
        </p>
      </div>

      <AssemblyField project={project} />

      <a className="world-enter" href="#text-lens-station">
        Continue to Text Lens <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}

function AssemblyField({ project }: { project?: ProjectModule }) {
  const [partPositions, setPartPositions] = useState(INITIAL_PART_POSITIONS);
  const [activePart, setActivePart] = useState<PartId | null>(null);
  const [draggingPart, setDraggingPart] = useState<PartId | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const artifactRef = useRef<HTMLDivElement>(null);

  const handleArtifactPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || !artifactRef.current) {
      return;
    }

    const bounds = artifactRef.current.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -10;
    artifactRef.current.style.setProperty("--artifact-tilt-x", `${x}deg`);
    artifactRef.current.style.setProperty("--artifact-tilt-y", `${y}deg`);
  };

  const resetArtifactPointer = () => {
    artifactRef.current?.style.setProperty("--artifact-tilt-x", "0deg");
    artifactRef.current?.style.setProperty("--artifact-tilt-y", "0deg");
  };

  const handlePartPointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    id: PartId,
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const origin = partPositions[id];
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
    };
    setActivePart(id);
    setDraggingPart(id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePartPointerMove = (
    event: PointerEvent<HTMLButtonElement>,
    id: PartId,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== id || drag.pointerId !== event.pointerId) {
      return;
    }

    const nextPosition = {
      x: clamp(drag.originX + event.clientX - drag.startX, -132, 132),
      y: clamp(drag.originY + event.clientY - drag.startY, -104, 104),
    };

    setPartPositions((current) => ({ ...current, [id]: nextPosition }));
  };

  const handlePartPointerUp = (
    event: PointerEvent<HTMLButtonElement>,
    id: PartId,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== id || drag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDraggingPart(null);
  };

  const nudgePart = (id: PartId, x: number, y: number) => {
    setPartPositions((current) => ({
      ...current,
      [id]: {
        x: clamp(current[id].x + x, -132, 132),
        y: clamp(current[id].y + y, -104, 104),
      },
    }));
  };

  const handlePartKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    id: PartId,
  ) => {
    const nudgeByKey: Record<string, [number, number]> = {
      ArrowUp: [0, -8],
      ArrowDown: [0, 8],
      ArrowLeft: [-8, 0],
      ArrowRight: [8, 0],
    };
    const nudge = nudgeByKey[event.key];
    if (!nudge) {
      return;
    }

    event.preventDefault();
    setActivePart(id);
    nudgePart(id, nudge[0], nudge[1]);
  };

  return (
    <div className="assembly-field" aria-describedby="assembly-instructions">
      <div className="assembly-field-note" aria-hidden="true">
        <span>Text Lens / first instrument</span>
        <span>Scroll to assemble</span>
      </div>

      <div className="assembly-canvas">
        <div className="assembly-shadow" aria-hidden="true" />
        <div
          ref={artifactRef}
          className="assembly-artifact"
          role="group"
          aria-label="Interactive Text Lens artifact"
          onPointerMove={handleArtifactPointerMove}
          onPointerLeave={resetArtifactPointer}
        >
          <div className="artifact-backplate" aria-hidden="true" />
          {PARTS.map((part) => {
            const position = partPositions[part.id];
            const partStyle = {
              "--part-x": `${position.x}px`,
              "--part-y": `${position.y}px`,
              "--scatter-x": `${part.scatterX}px`,
              "--scatter-y": `${part.scatterY}px`,
              "--scatter-z": `${part.scatterZ}px`,
              "--base-z": `${part.baseZ}px`,
              "--part-rotation": `${part.rotation}deg`,
            } as CSSProperties;

            return (
              <button
                key={part.id}
                className={`artifact-part ${part.className}${activePart === part.id ? " is-active" : ""}${draggingPart === part.id ? " is-dragging" : ""}`}
                style={partStyle}
                type="button"
                aria-label={`${part.label}. Drag to move or use arrow keys.`}
                onFocus={() => setActivePart(part.id)}
                onKeyDown={(event) => handlePartKeyDown(event, part.id)}
                onPointerCancel={(event) => handlePartPointerUp(event, part.id)}
                onPointerDown={(event) => handlePartPointerDown(event, part.id)}
                onPointerMove={(event) => handlePartPointerMove(event, part.id)}
                onPointerUp={(event) => handlePartPointerUp(event, part.id)}
              >
                <PartMark id={part.id} />
              </button>
            );
          })}
          <span className="artifact-center-label" aria-hidden="true">
            T / L
          </span>
        </div>
      </div>

      <div className="assembly-label">
        <span className="assembly-label-kicker">First instrument</span>
        <strong>{project?.title ?? "Text Lens"}</strong>
        <span>
          {project?.description ?? "A small reading instrument for seeing the shape inside a draft."}
        </span>
        <a href="#text-lens-station">
          Open the station <span aria-hidden="true">↗</span>
        </a>
      </div>

      <p className="assembly-instruction" id="assembly-instructions">
        Move a part to inspect the object. Scroll to reveal its layers, or use the arrow keys when a part is focused.
      </p>
    </div>
  );
}

function PartMark({ id }: { id: PartId }) {
  if (id === "sheet") {
    return (
      <span className="artifact-sheet-mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
    );
  }

  if (id === "frame") {
    return <span className="artifact-frame-mark" aria-hidden="true" />;
  }

  if (id === "type") {
    return (
      <span className="artifact-type-mark" aria-hidden="true">
        T / L
      </span>
    );
  }

  return <span className="artifact-spine-mark" aria-hidden="true" />;
}

function TextLensStation({
  comparisonMode,
  project,
}: {
  comparisonMode: boolean;
  project?: ProjectModule;
}) {
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
          <p className="station-kicker">Text Lens / first study</p>
          <h2 id="station-title">{project?.title ?? "Text Lens"}</h2>
        </div>
        <div className="station-description">
          <p>
            {project?.description ?? "A small reading instrument for seeing the shape inside a draft."}
          </p>
          <ProjectFacts technologies={project?.technologies ?? ["React", "TypeScript", "Go"]} />
        </div>
      </div>

      <form className="station-workspace" onSubmit={runAnalysis}>
        <div className="station-input-panel">
          <div className="station-panel-heading">
            <span>Input / draft</span>
            <span>{comparisonMode ? "Local reading" : "First reading"}</span>
          </div>
          <label className="station-input-label" htmlFor="prototype-text-input">
            Your text
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
            <span>Output / first read</span>
            <span>Measures</span>
          </div>
          <p className="station-results-caption">
            A few quiet measures for seeing what is already there.
          </p>
          <div className="station-metrics">
            <StationMetric label="Words" value={analysis.words} />
            <StationMetric label="Characters" value={analysis.characters} />
            <StationMetric label="Sentences" value={analysis.sentences} />
            <StationMetric label="Reading time" value={`${analysis.readingTime} min`} />
          </div>
          <div className="station-reading-mark" aria-hidden="true">
            <span className="reading-mark-sheet reading-mark-sheet-one">shape</span>
            <span className="reading-mark-sheet reading-mark-sheet-two">pace</span>
            <span className="reading-mark-sheet reading-mark-sheet-three">signal</span>
          </div>
        </div>
      </form>

      <div className="station-footer">
        <span>{comparisonMode ? "Text Lens / local prototype" : "Text Lens / reading instrument"}</span>
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

function PrototypeFooter({ comparisonMode }: { comparisonMode: boolean }) {
  return (
    <footer className="prototype-footer">
      <span>{comparisonMode ? "Prototype / spatial field" : "Built while learning in public"}</span>
      <span>{comparisonMode ? "Visual direction only / behavior unchanged" : "More instruments incoming"}</span>
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
    <nav className="prototype-switcher" aria-label="Spatial field variants">
      <span className="prototype-switcher-label">Compare directions</span>
      <button
        aria-pressed={activeVariant === "room"}
        className={activeVariant === "room" ? "is-active" : ""}
        type="button"
        onClick={() => onSelect("room")}
      >
        Assembly field
      </button>
      <button
        aria-pressed={activeVariant === "field"}
        className={activeVariant === "field" ? "is-active" : ""}
        type="button"
        onClick={() => onSelect("field")}
      >
        Typographic field
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
