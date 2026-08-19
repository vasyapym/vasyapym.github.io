import { useState, type CSSProperties, type PointerEvent } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import "./prototype.css";

export type PrototypeVariant = "specimen" | "ledger";

type PortfolioPrototypeProps = {
  projects: readonly ProjectModule[];
  initialVariant: PrototypeVariant;
};

type MotionMode = "inspection" | "registration";

type FragmentMotion = {
  x: number;
  y: number;
};

export default function PortfolioPrototype({
  projects,
  initialVariant,
}: PortfolioPrototypeProps) {
  const [variant, setVariant] = useState<PrototypeVariant>(initialVariant);

  const selectVariant = (nextVariant: PrototypeVariant) => {
    window.history.replaceState({}, "", `/?prototype=${nextVariant}`);
    setVariant(nextVariant);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exitPrototype = () => {
    window.history.replaceState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <main className={`prototype-page prototype-${variant}`}>
      <div className="prototype-shell">
        {variant === "specimen" ? (
          <SpecimenGrid projects={projects} />
        ) : (
          <EditorialLedger projects={projects} />
        )}
      </div>
      <PrototypeSwitcher
        activeVariant={variant}
        onExit={exitPrototype}
        onSelect={selectVariant}
      />
    </main>
  );
}

function SpecimenGrid({ projects }: { projects: readonly ProjectModule[] }) {
  return (
    <>
      <PrototypeMasthead />
      <header className="prototype-intro">
        <p className="prototype-kicker">A small field guide / selected experiments</p>
        <h1>Small instruments, carefully made.</h1>
        <p className="prototype-intro-note">
          Tools, studies, and questions made to understand how things work.
        </p>
      </header>

      <section className="specimen-grid" aria-label="Selected experiments">
        {projects.map((project, index) => (
          <SpecimenCard key={project.id} index={index} project={project} />
        ))}
        {Array.from({ length: Math.max(0, 4 - projects.length) }).map((_, index) => (
          <EmptySpecimenCard key={`empty-${index}`} index={projects.length + index} />
        ))}
      </section>

      <PrototypeNote />
    </>
  );
}

function EditorialLedger({ projects }: { projects: readonly ProjectModule[] }) {
  return (
    <>
      <PrototypeMasthead />
      <header className="prototype-intro ledger-intro">
        <p className="prototype-kicker">A small field guide / selected experiments</p>
        <h1>Things made to be looked at closely.</h1>
        <p className="prototype-intro-note">
          A short catalogue of tools and studies, each with its own question.
        </p>
      </header>

      <section className="ledger-list" aria-label="Selected experiments">
        {projects.map((project, index) => (
          <LedgerEntry key={project.id} index={index} project={project} />
        ))}
        <div className="ledger-placeholder" aria-hidden="true">
          <span>02</span>
          <p>Another study will take this place.</p>
        </div>
      </section>

      <PrototypeNote />
    </>
  );
}

function PrototypeMasthead() {
  return (
    <div className="prototype-masthead">
      <span className="prototype-wordmark">Selected Experiments</span>
      <span className="prototype-byline">A personal collection of small instruments.</span>
    </div>
  );
}

function SpecimenCard({
  index,
  project,
}: {
  index: number;
  project: ProjectModule;
}) {
  return (
    <article className="specimen-card">
      <div className="specimen-card-meta">
        <span>{formatIndex(index)}</span>
        <span>{project.status === "available" ? "Available" : "In progress"}</span>
      </div>
      <FragmentPreview mode="inspection" />
      <div className="specimen-card-label">
        <p className="specimen-eyebrow">{project.eyebrow}</p>
        <h2>{project.title}</h2>
        <p className="specimen-description">{project.description}</p>
        <ProjectFacts technologies={project.technologies} />
        <a className="specimen-link" href={`/projects/${project.id}`}>
          Open study <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

function EmptySpecimenCard({ index }: { index: number }) {
  return (
    <article className="specimen-card specimen-card-empty">
      <div className="specimen-card-meta">
        <span>{formatIndex(index)}</span>
        <span>Reserved</span>
      </div>
      <div className="empty-specimen-mark" aria-hidden="true"><span>✦</span></div>
      <div className="specimen-card-label">
        <p className="specimen-eyebrow">Next study</p>
        <h2>Next question.</h2>
        <p className="specimen-description">
          A little room for the next question worth following.
        </p>
      </div>
    </article>
  );
}

function LedgerEntry({
  index,
  project,
}: {
  index: number;
  project: ProjectModule;
}) {
  return (
    <article className="ledger-entry">
      <div className="ledger-entry-index">{formatIndex(index)}</div>
      <FragmentPreview mode="registration" />
      <div className="ledger-entry-label">
        <p className="specimen-eyebrow">{project.eyebrow}</p>
        <h2>{project.title}</h2>
        <p className="specimen-description">{project.description}</p>
        <ProjectFacts technologies={project.technologies} />
        <p className="ledger-status">
          {project.status === "available" ? "Available to explore" : "In progress"}
        </p>
        <a className="specimen-link" href={`/projects/${project.id}`}>
          Open study <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

function FragmentPreview({ mode }: { mode: MotionMode }) {
  const [motion, setMotion] = useState<FragmentMotion>({ x: 0, y: 0 });

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 10;
    setMotion({ x, y });
  };

  const style = {
    "--fragment-x": `${motion.x}px`,
    "--fragment-y": `${motion.y}px`,
  } as CSSProperties;

  return (
    <div
      className={`fragment-preview fragment-${mode}`}
      onPointerLeave={() => setMotion({ x: 0, y: 0 })}
      onPointerMove={handlePointerMove}
      style={style}
    >
      <div className="fragment-registration-line fragment-registration-line-one" />
      <div className="fragment-registration-line fragment-registration-line-two" />
      <div className="fragment-content">
        <span className="fragment-kicker">Text Lens / sample read</span>
        <p className="fragment-text">
          Good tools help us hold <em>complex ideas.</em>
        </p>
        <div className="fragment-rule" />
        <div className="fragment-results">
          <span><strong>44</strong> words</span>
          <span><strong>3</strong> sentences</span>
          <span><strong>1</strong> min read</span>
        </div>
        <div className="fragment-bottomline">
          <span className="fragment-coordinate">READ / 044 / 003</span>
          <span className="fragment-constellation" aria-hidden="true">
            <span className="constellation-line constellation-line-one" />
            <span className="constellation-line constellation-line-two" />
            <span className="constellation-node constellation-node-one" />
            <span className="constellation-node constellation-node-two" />
            <span className="constellation-node constellation-node-three" />
          </span>
        </div>
      </div>
    </div>
  );
}

function ProjectFacts({ technologies }: { technologies: readonly string[] }) {
  return (
    <p className="project-facts">
      {technologies.map((technology) => (
        <span key={technology}>{technology}</span>
      ))}
    </p>
  );
}

function PrototypeNote() {
  return (
    <footer className="prototype-note">
      <span>Prototype / visual direction only</span>
      <span>Behaviour and project discovery unchanged</span>
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
    <nav className="prototype-switcher" aria-label="Prototype variants">
      <span className="prototype-switcher-label">Compare</span>
      <button
        aria-pressed={activeVariant === "specimen"}
        className={activeVariant === "specimen" ? "is-active" : ""}
        type="button"
        onClick={() => onSelect("specimen")}
      >
        Specimen grid
      </button>
      <button
        aria-pressed={activeVariant === "ledger"}
        className={activeVariant === "ledger" ? "is-active" : ""}
        type="button"
        onClick={() => onSelect("ledger")}
      >
        Editorial ledger
      </button>
      <button className="prototype-exit" type="button" onClick={onExit}>
        Exit
      </button>
    </nav>
  );
}

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}
