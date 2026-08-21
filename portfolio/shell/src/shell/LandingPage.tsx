import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import ProjectArtwork from "./ProjectArtwork";

type LandingPageProps = {
  projects: readonly ProjectModule[];
  onOpenProject: (id: string) => void;
};

export default function LandingPage({ projects, onOpenProject }: LandingPageProps) {
  const pageRef = useRef<HTMLElement>(null);
  const [revealedProjects, setRevealedProjects] = useState<Set<string>>(() => new Set());
  const [revealReady, setRevealReady] = useState(false);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) {
      return;
    }

    page.classList.add("signal-index-reveal-ready");
    setRevealReady(true);

    const cards = Array.from(page.querySelectorAll<HTMLElement>("[data-project-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        setRevealedProjects((current) => {
          const next = new Set(current);
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const projectId = (entry.target as HTMLElement).dataset.projectReveal;
              if (projectId) {
                next.add(projectId);
              }
            }
          }
          return next;
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [projects]);

  return (
    <main ref={pageRef} className="signal-index">
      <div className="signal-index-shell">
        <header className="signal-index-header">
          <a className="signal-index-wordmark" href="/">
            <span className="signal-index-mark" aria-hidden="true" />
            Selected Experiments
          </a>
          <span className="signal-index-count">
            {projects.length.toString().padStart(2, "0")} {projects.length === 1 ? "project" : "projects"}
          </span>
        </header>

        <section className="signal-index-hero" aria-labelledby="signal-index-title">
          <div className="signal-index-hero-copy">
            <p className="signal-index-label">Selected projects</p>
            <h1 id="signal-index-title">
              Projects for learning
              <span>by making.</span>
            </h1>
            <p className="signal-index-intro">
              Small systems for testing ideas, learning in public, and seeing what happens next.
            </p>
            <a className="signal-index-link" href="#projects">
              See the projects <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="signal-index-graphic" aria-hidden="true">
            <span className="signal-index-graphic-line signal-index-graphic-line-one" />
            <span className="signal-index-graphic-line signal-index-graphic-line-two" />
            <span className="signal-index-graphic-point" />
          </div>
        </section>

        <section className="signal-index-projects" id="projects" aria-labelledby="projects-title">
          <div className="signal-index-section-heading">
            <div>
              <p className="signal-index-label">The collection</p>
              <h2 id="projects-title">A small set of working systems.</h2>
            </div>
            <span className="signal-index-section-count">{projects.length.toString().padStart(2, "0")} total</span>
          </div>

          <div className="signal-index-grid">
            {projects.map((project, index) => (
              <a
                className={`signal-index-card${revealReady && revealedProjects.has(project.id) ? " is-revealed" : ""}`}
                data-project-reveal={project.id}
                href={`/projects/${project.id}`}
                key={project.id}
                style={{ "--card-index": index } as CSSProperties}
                onClick={(event) => {
                  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                    event.preventDefault();
                    onOpenProject(project.id);
                  }
                }}
              >
                <div className="signal-index-card-topline">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{project.status === "available" ? "Available" : "In progress"}</span>
                </div>
                <div className="signal-index-card-body">
                  <div className="signal-index-card-copy">
                    <p className="signal-index-card-eyebrow">{project.eyebrow}</p>
                    <h3>{project.title}</h3>
                    <p className="signal-index-card-description">{project.description}</p>
                    <div className="signal-index-card-footer">
                      <span>{project.technologies.join(" · ")}</span>
                      <span className="signal-index-card-link">Open project <span aria-hidden="true">↗</span></span>
                    </div>
                  </div>
                  <ProjectArtwork project={project} />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="signal-index-about" aria-labelledby="signal-index-about-title">
          <div>
            <p className="signal-index-label">About the collection</p>
            <h2 id="signal-index-about-title">Making is how I learn.</h2>
          </div>
          <p>
            These experiments are small systems for understanding how things work. Each one starts with a question and ends with something useful to try.
          </p>
        </section>

        <footer className="signal-index-footer">
          <span>Built while learning in public</span>
          <span>More projects incoming</span>
        </footer>
      </div>
    </main>
  );
}
