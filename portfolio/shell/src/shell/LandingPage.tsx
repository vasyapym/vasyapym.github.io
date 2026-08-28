import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import HeroGlyphField from "./HeroGlyphField";
import ProjectArtwork from "./ProjectArtwork";

const BENEATH_VISIBLE = 4;

type LandingPageProps = {
  projects: readonly ProjectModule[];
  onOpenProject: (id: string) => void;
};

function documentOffsetTop(element: HTMLElement) {
  let y = 0;
  let node: HTMLElement | null = element;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

function animateScrollToCard(projectId: string) {
  const card = document.getElementById(`project-${projectId}`);
  if (!card) {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    card.scrollIntoView();
    return;
  }

  const scrollMargin = parseFloat(getComputedStyle(card).scrollMarginTop || "0");
  const startY = window.scrollY;
  const distance = Math.abs(documentOffsetTop(card) - scrollMargin - startY);
  const nativeMs = 220 + distance * 0.15;
  const duration = Math.min(1400, Math.max(360, nativeMs * 1.3));

  const start = performance.now();
  let cancelled = false;

  const cancel = () => {
    cancelled = true;
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
  };
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

  const settleMs = 2400;
  const step = (now: number) => {
    if (cancelled) {
      return;
    }
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    const targetY = documentOffsetTop(card) - scrollMargin;
    const position = t >= 1 ? targetY : startY + (targetY - startY) * easeInOutCubic(t);
    window.scrollTo({ top: position, behavior: "instant" });
    const chasing = t >= 1 && elapsed < duration + settleMs &&
      Math.abs(card.getBoundingClientRect().top - scrollMargin) > 2;
    if (t < 1 || chasing) {
      requestAnimationFrame(step);
    } else {
      cancel();
    }
  };

  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  requestAnimationFrame(step);
}

function warmProjectPage(project: ProjectModule) {
  project.loadPage().catch(() => {});
}

function scheduleIdleWarm(callback: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout: 1600 });
    return;
  }
  window.setTimeout(callback, 900);
}

export default function LandingPage({ projects, onOpenProject }: LandingPageProps) {
  const pageRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [revealedProjects, setRevealedProjects] = useState<ReadonlyMap<string, number>>(
    () => new Map(),
  );
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
          let batch = 0;
          const next = new Map(current);
          for (const entry of entries) {
            if (!entry.isIntersecting) {
              continue;
            }
            const projectId = (entry.target as HTMLElement).dataset.projectReveal;
            if (projectId && !next.has(projectId)) {
              next.set(projectId, Math.min(batch, 5) * 90);
              batch += 1;
            }
          }
          return next.size === current.size ? current : next;
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );

    cards.forEach((card) => observer.observe(card));

    // Section-level reveal (hairline draw-in) uses its own observer: a tall
    // section can never reach a 12% visible ratio, so it triggers on any pixel.
    const sections = Array.from(page.querySelectorAll<HTMLElement>("[data-section-reveal]"));
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          entry.target.classList.add("is-revealed");
          sectionObserver.unobserve(entry.target);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8%" },
    );
    sections.forEach((section) => sectionObserver.observe(section));

    return () => {
      observer.disconnect();
      sectionObserver.disconnect();
    };
  }, [projects]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    let cancelled = false;
    let lastValue = -1;

    const update = () => {
      frame = 0;
      if (cancelled) {
        return;
      }
      const span = hero.offsetHeight * 0.9;
      const ratio = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
      if (Math.abs(ratio - lastValue) < 0.004) {
        return;
      }
      lastValue = ratio;
      hero.style.setProperty("--hero-exit", ratio.toFixed(4));
    };

    const schedule = () => {
      if (frame !== 0 || cancelled) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      cancelled = true;
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reduceMotion.matches) {
      return undefined;
    }
    const grid = pageRef.current?.querySelector<HTMLElement>(".signal-index-grid");
    if (!grid) {
      return undefined;
    }
    let raf = 0;
    let pending: { card: HTMLElement; x: number; y: number } | null = null;
    const flush = () => {
      raf = 0;
      if (!pending) {
        return;
      }
      pending.card.style.setProperty("--mx", `${pending.x}px`);
      pending.card.style.setProperty("--my", `${pending.y}px`);
      pending = null;
    };
    const onMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest<HTMLElement>(".signal-index-card") ?? null;
      if (!card) {
        return;
      }
      const rect = card.getBoundingClientRect();
      pending = { card, x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (raf === 0) {
        raf = requestAnimationFrame(flush);
      }
    };
    grid.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      grid.removeEventListener("pointermove", onMove);
      if (raf !== 0) {
        cancelAnimationFrame(raf);
      }
    };
  }, []);

  useEffect(() => {
    scheduleIdleWarm(() => {
      for (const project of projects) {
        warmProjectPage(project);
      }
    });
  }, [projects]);

  return (
    <main ref={pageRef} className="signal-index">
      <div className="signal-index-shell">
        <section
          ref={heroRef}
          className="signal-index-hero signal-index-hero-atmosphere"
          aria-labelledby="signal-index-title"
        >
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

          <HeroGlyphField />
          <svg className="signal-index-sea-filter" aria-hidden="true" focusable="false">
            <defs>
              <filter id="signal-index-sea-warp" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="7" result="sea-noise" />
                <feDisplacementMap in="SourceGraphic" in2="sea-noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>
          <div className="signal-index-hero-copy">
            <p className="signal-index-hero-kicker">tinkering</p>
            <h1 id="signal-index-title">prototypes &amp; small machines</h1>
            <a className="signal-index-link" href="#projects">
              Run the models <span aria-hidden="true">↓</span>
            </a>
            <p className="signal-index-hero-note">live field&nbsp;· procedural heightfield&nbsp;→ glyph raster&nbsp;· canvas2d&nbsp;· no webgl</p>
          </div>
          <div className="signal-index-graphic signal-index-beneath">
            <span className="signal-index-beneath-label">beneath the surface</span>
            {projects.map((project, index) =>
              project.tag ? (
                <a
                  className={`signal-index-beneath-row${
                    index >= BENEATH_VISIBLE ? " signal-index-beneath-row-extra" : ""
                  }`}
                  href={`#project-${project.id}`}
                  key={project.id}
                  onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                      event.preventDefault();
                      animateScrollToCard(project.id);
                    }
                  }}
                >
                  <span>
                    {String(index + 1).padStart(2, "0")} / {project.tag}
                  </span>
                  <strong>— {project.title}</strong>
                </a>
              ) : null,
            )}
            <a
              className="signal-index-beneath-more"
              href="#projects"
              aria-label={`See all ${projects.length} projects`}
            >
              all {String(projects.length).padStart(2, "0")} <span aria-hidden="true">↓</span>
            </a>
            <span className="signal-index-beneath-rule" />
          </div>
        </section>

        <section
          className="signal-index-projects"
          id="projects"
          aria-label="Projects"
          data-section-reveal=""
        >
          <div className="signal-index-grid">
            {projects.map((project, index) => (
              <a
                className={`signal-index-card${revealReady && revealedProjects.has(project.id) ? " is-revealed" : ""}`}
                id={`project-${project.id}`}
                data-project-reveal={project.id}
                href={`/projects/${project.id}`}
                key={project.id}
                style={{ "--reveal-delay": `${revealedProjects.get(project.id) ?? 0}ms` } as CSSProperties}
                onPointerEnter={() => warmProjectPage(project)}
                onFocus={() => warmProjectPage(project)}
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
