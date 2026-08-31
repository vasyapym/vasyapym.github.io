import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import HeroFluid from "./HeroFluid";
import ProjectArtwork from "./ProjectArtwork";

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

    const cards = Array.from(
      page.querySelectorAll<HTMLElement>("[data-project-reveal]"),
    );

    // Coarse pointers reveal earlier and tighter so the wipe reads during fast
    // touch scrolling (desktop keeps the calmer numbers).
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const bandFactor = coarse ? 0.94 : 0.88;
    const stagger = coarse ? 70 : 90;

    const revealCard = (id: string, delay: number) => {
      setRevealedProjects((current) => {
        if (current.has(id)) {
          return current;
        }
        const next = new Map(current);
        next.set(id, delay);
        return next;
      });
    };

    // SOURCE OF TRUTH = scroll-position math, not IntersectionObserver delivery.
    // The mobile straddler bug (a card at top:-2px that IO never reported) is
    // impossible here: every un-revealed card is tested against the reveal band
    // on every settled frame. GUARANTEE: no card stays hidden while any part of
    // it is inside the viewport, for any velocity, order, restoration or deep
    // link. 6 cards => a getBoundingClientRect sweep is trivially cheap.
    const revealed = new Set<string>();
    const revealBand = () => window.innerHeight * bandFactor;

    let batchAt = 0;
    let batchSize = 0;

    const sweep = () => {
      // A card is revealed the moment ANY part of it sits above the reveal band
      // and below the top edge (rect.top < band && rect.bottom > 0). Reading
      // scroll geometry directly is immune to the IO straddler miss.
      const band = revealBand();
      const now = performance.now();
      if (now - batchAt > 260) {
        batchSize = 0;
      }
      for (const card of cards) {
        const id = card.dataset.projectReveal;
        if (!id || revealed.has(id)) {
          continue;
        }
        const rect = card.getBoundingClientRect();
        if (rect.top < band && rect.bottom > 0) {
          revealed.add(id);
          revealCard(id, Math.min(batchSize, 5) * stagger);
          batchSize += 1;
          batchAt = now;
        }
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        sweep();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // Mount check + deferred checks catch: initial in-view rows, browser scroll
    // restoration (fires after paint), and animateScrollToCard smooth-scroll
    // settling. Cheap belt-and-braces — 6 rects.
    sweep();
    const t1 = window.setTimeout(sweep, 120);
    const t2 = window.setTimeout(sweep, 700);

    // IO stays purely as an extra low-power trigger; correctness never depends
    // on it (the straddler bug is why). It just calls the same sweep.
    const optimizerIO = new IntersectionObserver(() => onScroll(), {
      threshold: 0,
      rootMargin: "0px 0px -6% 0px",
    });
    cards.forEach((card) => optimizerIO.observe(card));

    // Deep-link safety: reveal the hash target immediately regardless of band.
    const hash = window.location.hash;
    if (hash.startsWith("#project-")) {
      const id = hash.slice("#project-".length);
      revealed.add(id);
      revealCard(id, 0);
    }

    // Section-level reveal (hairline draw-in): a tall section can never reach a
    // 12% ratio, so it triggers on any pixel.
    const sections = Array.from(
      page.querySelectorAll<HTMLElement>("[data-section-reveal]"),
    );
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
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      optimizerIO.disconnect();
      sectionObserver.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
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
          className="signal-index-hero signal-index-hero-fluid"
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

          <HeroFluid />
          <div className="signal-index-hero-copy">
            <p className="signal-index-hero-kicker">currents</p>
            <h1
              id="signal-index-title"
              className="signal-index-hero-headline"
              aria-label="prototypes & small machines"
            >
              <span className="signal-index-hero-line" aria-hidden="true">
                <span className="signal-index-hero-line-in">prototypes</span>
              </span>
              <span className="signal-index-hero-line" aria-hidden="true">
                <span className="signal-index-hero-line-in">
                  <span className="signal-index-hero-amp">&amp;</span> small
                </span>
              </span>
              <span className="signal-index-hero-line" aria-hidden="true">
                <span className="signal-index-hero-line-in">machines</span>
              </span>
            </h1>
            <p className="signal-index-hero-note">
              stable-fluids&nbsp;· ordered-dither&nbsp;· canvas2d&nbsp;· no webgl
            </p>
          </div>
          <div className="signal-index-graphic signal-index-beneath">
            <span className="signal-index-beneath-label">beneath the surface</span>
            {projects.map((project, index) => (
              <a
                className="signal-index-beneath-row"
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
                  {String(index + 1).padStart(2, "0")}
                  {project.tag ? ` / ${project.tag}` : ""}
                </span>
                <strong>— {project.title}</strong>
              </a>
            ))}
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
                  <ProjectArtwork project={project} />
                  <div className="signal-index-card-copy">
                    <h3>{project.title}</h3>
                    <p className="signal-index-card-description">{project.description}</p>
                    <div className="signal-index-card-footer">
                      <span className="signal-index-card-link">open <span aria-hidden="true">↗</span></span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
