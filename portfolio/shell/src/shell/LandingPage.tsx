import type { ProjectModule } from "../../../contracts/project-module";

type LandingPageProps = {
  projects: readonly ProjectModule[];
  onOpenProject: (id: string) => void;
};

export default function LandingPage({ projects, onOpenProject }: LandingPageProps) {
  return (
    <main className="landing-page">
      <header className="site-header section-shell">
        <span className="site-wordmark">
          <span className="site-wordmark-signal" aria-hidden="true" />
          Selected Experiments
        </span>
        <span className="site-status">
          <span className="status-dot status-dot-blue" aria-hidden="true" />
          {projects.length.toString().padStart(2, "0")} online
        </span>
      </header>

      <section className="hero section-shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">PROJECTS / LEARNING BY MAKING</p>
          <h1 id="hero-title">
            Projects for learning
            <span>by making.</span>
          </h1>
          <p className="hero-description">
            Small systems for testing ideas, learning in public, and seeing what happens next.
          </p>
          <a className="text-link" href="#projects">
            Explore selected experiments <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section className="projects-section section-shell" id="projects" aria-labelledby="projects-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SELECTED EXPERIMENTS</p>
            <h2 id="projects-title">A small set of working systems.</h2>
          </div>
          <p className="section-note">
            {projects.length.toString().padStart(2, "0")} {projectCountLabel(projects.length)}
          </p>
        </div>

        <div className="project-grid">
          {projects.map((project, index) => (
            <button
              className={`project-card project-card-${project.accent}`}
              key={project.id}
              type="button"
              onClick={() => onOpenProject(project.id)}
            >
              <span className="project-card-topline">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span className="status-pill">
                  <span className="status-dot" aria-hidden="true" />
                  {project.status === "available" ? "Available" : "In progress"}
                </span>
              </span>

              <span className="project-card-art" aria-hidden="true">
                {project.id === "text-lens" ? <TextLensMark /> : <GenericMark />}
              </span>

              <span className="project-card-content">
                <span className="project-card-eyebrow">{project.eyebrow}</span>
                <span className="project-card-title">{project.title}</span>
                <span className="project-card-description">{project.description}</span>
                <span className="technology-list">
                  {project.technologies.map((technology) => (
                    <span key={technology}>{technology}</span>
                  ))}
                </span>
              </span>

              <span className="project-card-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </section>

      <section className="about-section section-shell" aria-labelledby="about-title">
        <div>
          <p className="eyebrow">FIELD NOTE</p>
          <h2 id="about-title">A practice of following signals.</h2>
        </div>
        <p className="about-copy">
          These experiments are small signals from a larger practice: making things to understand how they work.
        </p>
      </section>

      <footer className="footer section-shell">
        <span>Built while learning in public</span>
        <span>More signals incoming</span>
      </footer>
    </main>
  );
}

function TextLensMark() {
  return (
    <span className="text-lens-mark">
      <span className="mark-line mark-line-one" />
      <span className="mark-line mark-line-two" />
      <span className="mark-line mark-line-three" />
      <span className="mark-signal">
        <span className="mark-signal-core" />
      </span>
      <span className="mark-orbit mark-orbit-one" />
      <span className="mark-orbit mark-orbit-two" />
    </span>
  );
}

function GenericMark() {
  return <span className="generic-mark">+</span>;
}

function projectCountLabel(count: number) {
  return count === 1 ? "project online" : "projects online";
}
