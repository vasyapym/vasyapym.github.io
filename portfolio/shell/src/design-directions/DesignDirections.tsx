import { useState } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import "./design-directions.css";

type DesignDirectionsProps = {
  projects: readonly ProjectModule[];
};

type Direction = {
  id: string;
  number: string;
  title: string;
  label: string;
  subtitle: string;
  note: string;
};

const DIRECTIONS: readonly Direction[] = [
  {
    id: "quiet-index",
    number: "01",
    title: "Quiet index",
    label: "Refine the current",
    subtitle: "Keep the solid field, but make the hierarchy quieter and more assured.",
    note: "Best if the work should feel calm, mature, and easy to scan.",
  },
  {
    id: "night-lab",
    number: "02",
    title: "Night lab",
    label: "Keep the instruments",
    subtitle: "Make the portfolio a dark, tactile workspace where each project is an object.",
    note: "Best if the portfolio should feel like a place you enter, not a list you browse.",
  },
  {
    id: "transit-system",
    number: "03",
    title: "Transit system",
    label: "Make it navigational",
    subtitle: "Treat projects like stations in a precise public-information system.",
    note: "Best if clarity, momentum, and a strong visual language matter most.",
  },
  {
    id: "field-notebook",
    number: "04",
    title: "Field notebook",
    label: "Show the making",
    subtitle: "Warm paper, annotations, and traces of process turn the index into a working log.",
    note: "Best if the story behind the experiments should be part of the invitation.",
  },
  {
    id: "command-center",
    number: "05",
    title: "Command center",
    label: "Turn up the signal",
    subtitle: "Use a hard black canvas and one electric accent for a more decisive point of view.",
    note: "Best if the portfolio needs more edge, contrast, and immediate attitude.",
  },
  {
    id: "soft-studio",
    number: "06",
    title: "Soft studio",
    label: "Make it welcoming",
    subtitle: "Round the edges and use gentle material layers to make technical work feel human.",
    note: "Best if approachability and a lower-pressure first impression are the goal.",
  },
  {
    id: "archive-shelf",
    number: "07",
    title: "Archive shelf",
    label: "Give it provenance",
    subtitle: "Frame each project as a catalogued specimen with evidence, labels, and history.",
    note: "Best if the collection should feel considered, durable, and collectible.",
  },
  {
    id: "gallery-wall",
    number: "08",
    title: "Gallery wall",
    label: "Let work lead",
    subtitle: "Oversize titles and generous image fields make each project feel like an exhibit.",
    note: "Best if visual impact and a portfolio-like presentation should come first.",
  },
  {
    id: "terminal-view",
    number: "09",
    title: "Terminal view",
    label: "Own the technical",
    subtitle: "Lean into a developer-native interface with prompts, output, and visible system state.",
    note: "Best if the audience should immediately know this was made by a builder.",
  },
  {
    id: "signal-atlas",
    number: "10",
    title: "Signal atlas",
    label: "Connect the work",
    subtitle: "Place projects in a living constellation so relationships become the main story.",
    note: "Best if the portfolio should create curiosity before asking for a click.",
  },
];

export default function DesignDirections({ projects }: DesignDirectionsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const primaryProject = projects[0]?.title ?? "Code Layout";
  const secondaryProject = projects[1]?.title ?? "Practice Map";
  const selectedDirection = DIRECTIONS.find((direction) => direction.id === selectedId);

  return (
    <main className="directions-page">
      <div className="directions-shell">
        <header className="directions-header">
          <a className="directions-home" href="/">
            <span aria-hidden="true">←</span>
            Selected Experiments
          </a>
          <span className="directions-header-center">Design iteration / visual study</span>
          <span className="directions-header-status" aria-live="polite">
            {selectedDirection ? `${selectedDirection.number} selected` : "Choose a direction to develop"}
          </span>
        </header>

        <section className="directions-hero" aria-labelledby="directions-title">
          <div>
            <p className="directions-eyebrow">10 directions / same projects / different character</p>
            <h1 id="directions-title">
              What if the portfolio felt more
              <span>like itself?</span>
            </h1>
          </div>
          <div className="directions-hero-aside">
            <p>
              Something is working, but the identity has not fully landed yet. Here are ten coherent ways to push the system without changing what the projects do.
            </p>
            <span className="directions-hero-rule" aria-hidden="true" />
            <p className="directions-hero-small">Choose the mood first. We can resolve the details after.</p>
          </div>
        </section>

        <div className="directions-index-bar" aria-hidden="true">
          <span>01—10</span>
          <span>Visual directions</span>
          <span>Code Layout + Practice Map</span>
        </div>

        <section className="direction-grid" aria-label="Ten design directions">
          {DIRECTIONS.map((direction) => (
            <DirectionCard
              key={direction.id}
              direction={direction}
              primaryProject={primaryProject}
              secondaryProject={secondaryProject}
              selected={selectedId === direction.id}
              onSelect={() => setSelectedId((current) => current === direction.id ? null : direction.id)}
            />
          ))}
        </section>

        <footer className="directions-footer">
          <span>Review surface / not a final implementation</span>
          <span>{selectedDirection ? `Next: develop “${selectedDirection.title}”` : "Select one card to mark a candidate"}</span>
        </footer>
      </div>
    </main>
  );
}

function DirectionCard({
  direction,
  primaryProject,
  secondaryProject,
  selected,
  onSelect,
}: {
  direction: Direction;
  primaryProject: string;
  secondaryProject: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={`direction-card direction-${direction.id}${selected ? " is-selected" : ""}`}>
      <div className="direction-card-head">
        <span className="direction-number">{direction.number}</span>
        <span className="direction-label">{direction.label}</span>
      </div>

      <DirectionPreview
        directionId={direction.id}
        primaryProject={primaryProject}
        secondaryProject={secondaryProject}
      />

      <div className="direction-card-copy">
        <div>
          <h2>{direction.title}</h2>
          <p>{direction.subtitle}</p>
        </div>
        <button type="button" aria-pressed={selected} onClick={onSelect}>
          {selected ? "Selected" : "Choose this"}
          <span aria-hidden="true">{selected ? "✓" : "↗"}</span>
        </button>
      </div>
      <p className="direction-card-note">{direction.note}</p>
    </article>
  );
}

function DirectionPreview({
  directionId,
  primaryProject,
  secondaryProject,
}: {
  directionId: string;
  primaryProject: string;
  secondaryProject: string;
}) {
  if (directionId === "quiet-index") {
    return (
      <div className="direction-preview preview-quiet-index">
        <div className="quiet-preview-header"><span>Selected projects</span><span>02</span></div>
        <div className="quiet-preview-main">
          <div>
            <span className="quiet-preview-kicker">Small systems</span>
            <strong>Projects that make<br />ideas usable.</strong>
          </div>
          <div className="quiet-preview-signal" aria-hidden="true"><i /><i /><i /><b /></div>
        </div>
        <div className="quiet-preview-list">
          <div><span>01</span><strong>{primaryProject}</strong><em>Open ↗</em></div>
          <div><span>02</span><strong>{secondaryProject}</strong><em>Open ↗</em></div>
        </div>
      </div>
    );
  }

  if (directionId === "night-lab") {
    return (
      <div className="direction-preview preview-night-lab">
        <span className="night-preview-stamp">FIELD NOTE / 002</span>
        <div className="night-preview-orbit night-orbit-one" />
        <div className="night-preview-orbit night-orbit-two" />
        <div className="night-preview-object"><span>C / L</span></div>
        <div className="night-preview-copy"><small>01 / instrument</small><strong>{primaryProject}</strong><em>drag to inspect</em></div>
        <span className="night-preview-coordinate">x 04 · y 17</span>
      </div>
    );
  }

  if (directionId === "transit-system") {
    return (
      <div className="direction-preview preview-transit-system">
        <div className="transit-preview-top"><span>SELECTED / LINE 01</span><span>02 MIN</span></div>
        <div className="transit-preview-map">
          <div className="transit-preview-vertical" />
          <div className="transit-preview-route"><i /><i /><i /><i /></div>
          <span className="transit-stop transit-stop-a">Start</span>
          <span className="transit-stop transit-stop-b">{primaryProject}</span>
          <span className="transit-stop transit-stop-c">{secondaryProject}</span>
          <span className="transit-stop transit-stop-d">Next</span>
        </div>
        <div className="transit-preview-bottom"><strong>Follow the work</strong><span>Enter at any station →</span></div>
      </div>
    );
  }

  if (directionId === "field-notebook") {
    return (
      <div className="direction-preview preview-field-notebook">
        <div className="notebook-preview-paper">
          <span className="notebook-preview-date">FIELD NOTE / 07.24</span>
          <h3>Keep a place<br />for the next pass.</h3>
          <div className="notebook-preview-checks"><span>✓</span><span>read the structure</span><span>○</span><span>find the route</span><span>→</span><span>make it useful</span></div>
          <span className="notebook-preview-page">p. 01</span>
        </div>
        <div className="notebook-preview-margin" aria-hidden="true"><i /><i /><i /></div>
      </div>
    );
  }

  if (directionId === "command-center") {
    return (
      <div className="direction-preview preview-command-center">
        <div className="command-preview-top"><span>SYS / INDEX_01</span><span className="command-live"><i /> LIVE</span></div>
        <div className="command-preview-main"><strong>10</strong><span>working<br />systems</span><div className="command-preview-blocks"><i /><i /><i /><i /></div></div>
        <div className="command-preview-bottom"><span>INPUT: SELECT PROJECT</span><b>ENTER <em>↵</em></b></div>
      </div>
    );
  }

  if (directionId === "soft-studio") {
    return (
      <div className="direction-preview preview-soft-studio">
        <div className="soft-preview-glow soft-glow-one" />
        <div className="soft-preview-glow soft-glow-two" />
        <div className="soft-preview-top"><span>selected experiments</span><span>02 projects</span></div>
        <div className="soft-preview-stack">
          <div className="soft-preview-card soft-card-main"><small>01 / tool</small><strong>{primaryProject}</strong><span>Understand the shape of a source file.</span><i>↗</i></div>
          <div className="soft-preview-card soft-card-side"><small>02 / map</small><strong>{secondaryProject}</strong><span>Keep moving.</span></div>
        </div>
        <span className="soft-preview-caption">A gentler way in.</span>
      </div>
    );
  }

  if (directionId === "archive-shelf") {
    return (
      <div className="direction-preview preview-archive-shelf">
        <div className="archive-preview-top"><span>ARCHIVE / 2026</span><span>CAT. 02</span></div>
        <div className="archive-preview-cabinet">
          <div className="archive-preview-label"><small>CAT. 001 / TOOL</small><strong>{primaryProject}</strong><span>source structure / live</span></div>
          <div className="archive-preview-label archive-label-second"><small>CAT. 002 / MAP</small><strong>{secondaryProject}</strong><span>technical practice / live</span></div>
        </div>
        <span className="archive-preview-stamp">INDEXED<br />AND OPEN</span>
        <span className="archive-preview-caption">A working collection, kept with care.</span>
      </div>
    );
  }

  if (directionId === "gallery-wall") {
    return (
      <div className="direction-preview preview-gallery-wall">
        <div className="gallery-preview-image"><span>PROJECT<br />01</span><i /></div>
        <div className="gallery-preview-copy"><small>SELECTED WORK / 2026</small><strong>{primaryProject}</strong><span>View project <b>↗</b></span></div>
        <div className="gallery-preview-index">01<br /><span>—</span><br />02</div>
      </div>
    );
  }

  if (directionId === "terminal-view") {
    return (
      <div className="direction-preview preview-terminal-view">
        <div className="terminal-preview-bar"><span><i /><i /><i /></span><strong>selected-experiments — zsh</strong><span>⌁</span></div>
        <div className="terminal-preview-body">
          <p><b>~/selected-experiments</b> <span>$</span> ls --projects</p>
          <p className="terminal-output"><em>01</em> {primaryProject}<br /><em>02</em> {secondaryProject}</p>
          <p><b>~/selected-experiments</b> <span>$</span> open <u>01</u><span className="terminal-preview-cursor">_</span></p>
        </div>
        <span className="terminal-preview-status">LOCAL / READY</span>
      </div>
    );
  }

  return (
    <div className="direction-preview preview-signal-atlas">
      <div className="atlas-preview-grid" aria-hidden="true" />
      <div className="atlas-preview-orbit atlas-orbit-one" />
      <div className="atlas-preview-orbit atlas-orbit-two" />
      <div className="atlas-preview-link atlas-link-one" />
      <div className="atlas-preview-link atlas-link-two" />
      <div className="atlas-preview-node atlas-node-one"><i /></div>
      <div className="atlas-preview-node atlas-node-two"><i /></div>
      <div className="atlas-preview-node atlas-node-three"><i /></div>
      <div className="atlas-preview-center"><span>INDEX</span></div>
      <div className="atlas-preview-label atlas-label-one"><small>01 / tool</small><strong>{primaryProject}</strong></div>
      <div className="atlas-preview-label atlas-label-two"><small>02 / map</small><strong>{secondaryProject}</strong></div>
      <span className="atlas-preview-caption">Everything is connected.</span>
    </div>
  );
}
