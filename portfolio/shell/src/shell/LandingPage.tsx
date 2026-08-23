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
          <div className="signal-index-identity">
            <a className="signal-index-wordmark" href="/">
              <span className="signal-index-mark" aria-hidden="true" />
              Vasily Argounov
            </a>
            <span className="signal-index-identity-divider" aria-hidden="true">|</span>
            <a className="signal-index-contact" href="mailto:vasyapym@gmail.com">vasyapym@gmail.com</a>
          </div>
          <span className="signal-index-count">{projects.length.toString().padStart(2, "0")}</span>
        </header>

        <section className="signal-index-hero signal-index-hero-refraction" aria-labelledby="signal-index-title">
          <svg className="signal-index-sea-filter" aria-hidden="true" focusable="false">
            <defs>
              <filter id="signal-index-sea-warp" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="7" result="sea-noise" />
                <feDisplacementMap in="SourceGraphic" in2="sea-noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>
          <div className="signal-index-hero-copy">
            <p className="signal-index-hero-kicker">prototypes</p>
            <h1 id="signal-index-title">A collection of digital experiences</h1>
            <a className="signal-index-link" href="#projects">
              Run the models <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="signal-index-graphic signal-index-beneath" aria-hidden="true">
            <span className="signal-index-beneath-label">beneath the surface</span>
            {projects.map((project, index) =>
              project.tag ? (
                <p className="signal-index-beneath-row" key={project.id}>
                  <span>
                    {String(index + 1).padStart(2, "0")} / {project.tag}
                  </span>
                  <strong>— {project.title}</strong>
                </p>
              ) : null,
            )}
            <span className="signal-index-beneath-rule" />
          </div>
        </section>

        <section className="signal-index-projects" id="projects" aria-label="Projects">
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
                  <span className="signal-index-card-tag">
                    {String(index + 1).padStart(2, "0")}
                    {project.tag ? ` / ${project.tag}` : ""}
                  </span>
                  <span>{project.technologies.join(" · ")}</span>
                </div>
                <div className="signal-index-card-body">
                  <div className="signal-index-card-copy">
                    <h3>{project.title}</h3>
                    <p className="signal-index-card-description">{project.description}</p>
                    <div className="signal-index-card-footer">
                      <span className="signal-index-card-link">open <span aria-hidden="true">↗</span></span>
                    </div>
                  </div>
                  <ProjectArtwork project={project} />
                </div>
              </a>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
