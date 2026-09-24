import type { PointerEvent } from "react";
import { useRef } from "react";
import type { ReactElement } from "react";
import type { ProjectModule } from "../../../../contracts/project-module";

// One comparison round: shared head + the project's card rendered per entry.
// Shared by every round section on /art-directions (moved here when the
// four-project rethink round needed it from its own file — no circular imports).
export function RoundSection({
  label,
  name,
  projectId,
  thesis,
  round,
  projects,
}: {
  label: string;
  name: string;
  projectId: string;
  thesis: string;
  round: readonly RoundEntry[];
  projects: readonly ProjectModule[];
}) {
  return (
    <section className="art-variant-section" aria-label={label}>
      <div className="art-variant-head">
        <p className="art-variant-label">{label}</p>
        <h2 className="art-variant-name">{name}</h2>
        <p className="art-variant-thesis">{thesis}</p>
      </div>
      <div className="signal-index-grid">
        {(() => {
          const project = projects.find((entry) => entry.id === projectId);
          if (!project) return null;
          return round.map(({ id, topline, Mark }) => {
            if (!Mark) return null;
            return <DraftCard key={id} project={project} index={0} Mark={Mark} topline={topline} />;
          });
        })()}
      </div>
    </section>
  );
}

// Mirror of ProjectArtwork's pointer tilt so draft cards behave like landing cards.
function useTilt() {
  const objectRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || !objectRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    const objectStyle = objectRef.current.style;
    objectStyle.setProperty("--art-rotate-x", `${y * -6}deg`);
    objectStyle.setProperty("--art-rotate-y", `${x * 6}deg`);
    objectStyle.setProperty("--art-shift-x", `${x * 8}px`);
    objectStyle.setProperty("--art-shift-y", `${y * 6}px`);
  };

  const resetPointer = () => {
    if (!objectRef.current) return;
    const objectStyle = objectRef.current.style;
    objectStyle.setProperty("--art-rotate-x", "0deg");
    objectStyle.setProperty("--art-rotate-y", "0deg");
    objectStyle.setProperty("--art-shift-x", "0px");
    objectStyle.setProperty("--art-shift-y", "0px");
  };

  return { objectRef, handlePointerMove, resetPointer };
}

export function DraftCard({
  project,
  index,
  Mark,
  topline,
}: {
  project: ProjectModule;
  index: number;
  Mark: () => ReactElement;
  topline?: string;
}) {
  const { objectRef, handlePointerMove, resetPointer } = useTilt();

  return (
    <a
      className="signal-index-card"
      id={`art-${project.id}`}
      href={`/projects/${project.id}/`}
      onClick={(event) => event.preventDefault()}
      aria-label={`${project.title} (draft card, not navigable)`}
    >
      <div className="project-artwork" aria-hidden="true">
        <div ref={objectRef} className="project-artwork-object">
          <span className="project-artwork-center">
            <Mark />
          </span>
        </div>
      </div>
      <div className="gem-card-copy">
        <p className="gem-card-topline">
          {topline ?? `${String(index + 1).padStart(2, "0")}${project.tag ? ` · ${project.tag}` : ""}`}
        </p>
        <h3 className="gem-card-title">{project.title}</h3>
        <p className="gem-card-desc">{project.description}</p>
        <div className="gem-card-footer">
          <span className="gem-card-tech">{project.technologies.join(" · ")}</span>
          <span className="gem-card-open">
            open <span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
    </a>
  );
}

export type RoundEntry = { id: string; topline: string; Mark?: () => ReactElement };
