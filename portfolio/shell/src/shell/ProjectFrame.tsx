import { lazy, Suspense, useMemo } from "react";
import type { ProjectModule } from "../../../contracts/project-module";

type ProjectFrameProps = {
  project: ProjectModule;
  onBack: () => void;
};

export default function ProjectFrame({ project, onBack }: ProjectFrameProps) {
  const ProjectPage = useMemo(() => lazy(project.loadPage), [project]);

  return (
    <main className="project-frame">
      <header className="project-frame-topbar">
        <div className="project-frame-nav section-shell">
          <button className="back-link" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span> Selected Experiments
          </button>
          <span className="project-frame-label">{project.title}</span>
        </div>
      </header>
      <Suspense
        fallback={<div className="project-loading section-shell">Loading experiment…</div>}
      >
        <ProjectPage />
      </Suspense>
    </main>
  );
}
