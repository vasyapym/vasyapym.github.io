import type { ProjectModule } from "../../../contracts/project-module";

type LandingPageProps = {
  projects: readonly ProjectModule[];
  onOpenProject: (id: string) => void;
};

export default function LandingPage({ projects, onOpenProject }: LandingPageProps) {
  return (
    <main>
      <section className="hero section-shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">LUNA LAB / PERSONAL PORTFOLIO</p>
          <h1 id="hero-title">
            Small experiments.
            <span>Deep modules.</span>
          </h1>
          <p className="hero-description">
            A growing collection of useful, curious things. Each project is a
            self-contained world with its own question, tools, and point of view.
          </p>
          <a className="text-link" href="#projects">
            Explore the work <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit-core">
            <span>01</span>
            <small>make / learn / share</small>
          </div>
          <span className="orbit-dot orbit-dot-one" />
          <span className="orbit-dot orbit-dot-two" />
        </div>
      </section>

      <section className="projects-section section-shell" id="projects" aria-labelledby="projects-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SELECTED PROJECTS</p>
            <h2 id="projects-title">A few things in motion.</h2>
          </div>
          <p className="section-note">
            {projects.length.toString().padStart(2, "0")} live module{projects.length === 1 ? "" : "s"}
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
                  <span className="status-dot" />
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

      <footer className="footer section-shell">
        <span>Luna Lab / built in public</span>
        <span>More experiments soon</span>
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
      <span className="mark-signal" />
    </span>
  );
}

function GenericMark() {
  return <span className="generic-mark">+</span>;
}
