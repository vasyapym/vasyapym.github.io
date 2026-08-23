import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import ProjectArtwork from "./ProjectArtwork";
import RefractionField from "./RefractionField";

type LandingPageProps = {
  projects: readonly ProjectModule[];
  onOpenProject: (id: string) => void;
};

export default function LandingPage({ projects, onOpenProject }: LandingPageProps) {
  const pageRef = useRef<HTMLElement>(null);
  const [revealedProjects, setRevealedProjects] = useState<Set<string>>(() => new Set());
  const [revealReady, setRevealReady] = useState(false);
  const shakeTimeout = useRef<number | null>(null);
  const codeLayoutTitle = projects.find((project) => project.id === "code-layout")?.title ?? "Code Layout";
  const practiceMapTitle = projects.find((project) => project.id === "practice-map")?.title ?? "Practice Map";

  const shakeScreen = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    if (shakeTimeout.current !== null) {
      window.clearTimeout(shakeTimeout.current);
    }
    document.body.classList.remove("screen-shake");
    void document.body.offsetWidth;
    document.body.classList.add("screen-shake");
    shakeTimeout.current = window.setTimeout(() => {
      document.body.classList.remove("screen-shake");
      shakeTimeout.current = null;
    }, 520);
  };

  useEffect(() => {
    return () => {
      if (shakeTimeout.current !== null) {
        window.clearTimeout(shakeTimeout.current);
      }
    };
  }, []);

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

        <section className="signal-index-hero signal-index-hero-refraction" aria-labelledby="signal-index-title">
          <RefractionField className="signal-index-sea" />
          <svg className="signal-index-sea-filter" aria-hidden="true" focusable="false">
            <defs>
              <filter id="signal-index-sea-warp" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="7" result="sea-noise" />
                <feDisplacementMap in="SourceGraphic" in2="sea-noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>
          <div className="signal-index-hero-copy">
            <p className="signal-index-hero-kicker">Prototypes, not promises</p>
            <h1 id="signal-index-title">See the mechanics before you commit.</h1>
            <p className="signal-index-intro">
              Every project is a working model that shows how an idea behaves under real use.
            </p>
            <a className="signal-index-link" href="#projects">
              Run the models <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="signal-index-graphic signal-index-beneath" aria-hidden="true">
            <span className="signal-index-beneath-label">beneath the surface</span>
            <p className="signal-index-beneath-row signal-index-beneath-row-a">
              <span>01 / tool</span>
              <strong>{codeLayoutTitle}</strong>
            </p>
            <p className="signal-index-beneath-row signal-index-beneath-row-b">
              <span>02 / map</span>
              <strong>{practiceMapTitle}</strong>
            </p>
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
                    if (project.onCardActivate) {
                      project.onCardActivate({ x: event.clientX, y: event.clientY, shakeScreen });
                      return;
                    }
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

      </div>
    </main>
  );
}
