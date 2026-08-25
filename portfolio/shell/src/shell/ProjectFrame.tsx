import { Component, lazy, Suspense, useMemo, type ReactNode } from "react";
import type { ProjectModule } from "../../../contracts/project-module";

type ProjectFrameProps = {
  project: ProjectModule;
  onBack: () => void;
};

type BoundaryState = { error: Error | null };

// A crashed experiment must never take the whole site down to a white
// screen: this boundary keeps the frame alive and prints the error so the
// failure is diagnosable from any browser.
class ProjectErrorBoundary extends Component<
  { children: ReactNode; project: ProjectModule; onBack: () => void },
  BoundaryState
> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidUpdate(prev: { project: ProjectModule }) {
    if (prev.project.id !== this.props.project.id && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="project-crash section-shell" role="alert">
          <h2 className="project-crash-title">
            {this.props.project.title} hit a snag
          </h2>
          <p className="project-crash-copy">
            This experiment failed to start in this browser. A reload may
            help; if it keeps happening, the technical detail below is the
            clue.
          </p>
          <pre className="project-crash-detail">
            {String(
              this.state.error?.message ?? this.state.error ?? "Unknown error",
            )}
          </pre>
          <button
            type="button"
            className="back-link"
            onClick={() => {
              this.setState({ error: null });
              this.props.onBack();
            }}
          >
            <span aria-hidden="true">←</span> Back to the index
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ProjectFrame({ project, onBack }: ProjectFrameProps) {
  const ProjectPage = useMemo(() => lazy(project.loadPage), [project]);

  return (
    <main className="project-frame">
      <header className="project-frame-topbar">
        <div className="project-frame-nav section-shell">
          <button className="back-link" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span> Vasily Argounov
          </button>
          <span className="project-frame-label">{project.title}</span>
        </div>
      </header>
      <ProjectErrorBoundary project={project} onBack={onBack}>
        <Suspense
          fallback={<div className="project-loading section-shell">Loading experiment…</div>}
        >
          <ProjectPage />
        </Suspense>
      </ProjectErrorBoundary>
    </main>
  );
}
