import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import HeroFluid from "./HeroFluid";
import ProjectArtwork from "./ProjectArtwork";
import RealmMode from "./RealmMode";
import "./realm.css";

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

function animateScrollToAnchor(elementId: string) {
  const target = document.getElementById(elementId);
  if (!target) {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    target.scrollIntoView();
    return;
  }

  const scrollMargin = parseFloat(getComputedStyle(target).scrollMarginTop || "0");
  const startY = window.scrollY;
  const distance = Math.abs(documentOffsetTop(target) - scrollMargin - startY);
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
    const targetY = documentOffsetTop(target) - scrollMargin;
    const position = t >= 1 ? targetY : startY + (targetY - startY) * easeInOutCubic(t);
    window.scrollTo({ top: position, behavior: "instant" });
    const chasing = t >= 1 && elapsed < duration + settleMs &&
      Math.abs(target.getBoundingClientRect().top - scrollMargin) > 2;
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
  const realmThresholdRef = useRef<HTMLElement>(null);
  const realmSectionEnterRef = useRef<HTMLButtonElement>(null);
  const realmChipRef = useRef<HTMLButtonElement>(null);
  const realmActivatorRef = useRef<HTMLButtonElement | null>(null);
  const realmRestoreFocusRef = useRef(false);
  const realmFloorRef = useRef<HTMLDivElement>(null);
  const [realmOpen, setRealmOpen] = useState(false);
  const [realmChipVisible, setRealmChipVisible] = useState(false);
  const [realmEntry, setRealmEntry] = useState<{ x: number; y: number }>(() => ({
    x: 60,
    y: typeof window === "undefined" ? 60 : Math.max(60, window.innerHeight - 60),
  }));

  // Ownership is route-local, not inferred from the shared .signal-index
  // class: /art-directions retains its own palette and can opt in separately.
  // This outlives RealmMode and its fixed-body scroll-restoration cleanup.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-signal-index");
    root.setAttribute("data-signal-index", "");

    return () => {
      if (previous === null) {
        root.removeAttribute("data-signal-index");
      } else {
        root.setAttribute("data-signal-index", previous);
      }
    };
  }, []);

  const handleRealmExit = useCallback(() => {
    realmRestoreFocusRef.current = true;
    setRealmOpen(false);
  }, []);

  const handleRealmEnter = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const control = event.currentTarget;
    const rect = control.getBoundingClientRect();
    realmActivatorRef.current = control;
    realmRestoreFocusRef.current = false;
    // Read before React hides/inerts either entry control.
    setRealmEntry({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setRealmOpen(true);
  }, []);

  useEffect(() => {
    if (realmOpen || !realmRestoreFocusRef.current) return;

    let secondFrame = 0;
    // Wait for RealmMode's cleanup, scroll restoration, and the strip's
    // geometry update before deciding which control can accept focus.
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (!realmRestoreFocusRef.current) return;
        realmRestoreFocusRef.current = false;

        const activated = realmActivatorRef.current;
        const rect = activated?.getBoundingClientRect();
        const usable = activated?.isConnected &&
          !activated.disabled &&
          !activated.closest('[inert], [aria-hidden="true"]') &&
          getComputedStyle(activated).visibility === "visible" &&
          rect && rect.width > 0 && rect.height > 0 &&
          rect.top >= 0 && rect.bottom <= window.innerHeight &&
          rect.left >= 0 && rect.right <= window.innerWidth;

        if (usable && activated) {
          activated.focus({ preventScroll: true });
          return;
        }

        // A resize or changed scroll position may have hidden the strip.
        // The in-flow entry is the stable fallback, never an invisible tab.
        const fallback = realmSectionEnterRef.current;
        if (fallback) {
          fallback.scrollIntoView({ block: "center", behavior: "instant" });
          fallback.focus({ preventScroll: true });
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== 0) window.cancelAnimationFrame(secondFrame);
    };
  }, [realmOpen]);
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
    // link. The grid grows with the portfolio; a rect sweep stays trivially
    // cheap at this scale.
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
    // settling. Cheap belt-and-braces — one rect per card.
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
      if (cancelled || realmOpen) {
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
      if (frame !== 0 || cancelled || realmOpen) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    schedule();
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
  }, [realmOpen]);

  useEffect(() => {
    const page = pageRef.current;
    const hero = heroRef.current;
    const threshold = realmThresholdRef.current;
    const floor = realmFloorRef.current;
    if (!page || !hero || !threshold || !floor) return;
    let frame = 0;
    let cancelled = false;
    let lastFloor = "";

    const update = () => {
      frame = 0;
      // A fixed body does not expose useful document scroll geometry.
      // Re-measure on exit; the JSX independently hides the strip and floor.
      if (cancelled || realmOpen) return;

      const vh = window.innerHeight;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
      const y = Math.min(maxScroll, Math.max(0, window.scrollY));
      const thresholdBottom =
        threshold.getBoundingClientRect().bottom + window.scrollY;
      // One reversible law on desktop and mobile. Clamping y prevents
      // elastic overscroll from revealing the strip prematurely.
      const visible = y >= thresholdBottom;
      setRealmChipVisible((current) =>
        current === visible ? current : visible,
      );

      const floorValue = (maxScroll > 0 && vh > 0
        ? Math.min(1, Math.max(0, 1 - (maxScroll - y) / (vh * 0.6)))
        : 0).toFixed(4);
      if (floorValue !== lastFloor) {
        lastFloor = floorValue;
        floor.style.setProperty("--realm-floor", floorValue);
      }
    };

    const schedule = () => {
      if (frame !== 0 || cancelled) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    // Hero settling, font reflow, project layout and viewport changes all
    // feed the same rAF rather than maintaining a cached threshold offset.
    const layoutObserver = new ResizeObserver(schedule);
    layoutObserver.observe(page);
    layoutObserver.observe(hero);
    layoutObserver.observe(threshold);
    document.fonts.ready.then(schedule);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("pageshow", schedule);
    window.visualViewport?.addEventListener("resize", schedule);

    return () => {
      cancelled = true;
      if (frame !== 0) window.cancelAnimationFrame(frame);
      layoutObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [realmOpen]);

  // Symmetric hero rhythm (desktop): the copy panel is centred in the free
  // middle row, so its top gap grows with the viewport while the bottom rail
  // keeps a fixed padding — top and bottom never match by accident. Here the
  // header→copy gap is measured once and the hero's bottom padding is set to
  // the same value, so header→copy, copy→rail and rail→viewport-bottom all
  // read equal at any desktop height. The copy re-centres when the padding
  // changes; the measured-gap + current-pad pair solves that feedback in one
  // closed-form step, and re-running it after that is a no-op.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) {
      return;
    }

    let cancelled = false;
    const desktop = window.matchMedia("(min-width: 561px)");

    const settle = () => {
      if (cancelled || !desktop.matches) {
        return;
      }
      const header = hero.querySelector<HTMLElement>(".signal-index-header");
      const copy = hero.querySelector<HTMLElement>(".signal-index-hero-copy");
      if (!header || !copy) {
        return;
      }
      const gap =
        copy.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
      if (gap <= 0) {
        return;
      }
      const currentPad = parseFloat(getComputedStyle(hero).paddingBottom);
      const free = gap + currentPad / 2;
      const pad = Math.max(16, (2 / 3) * free);
      hero.style.setProperty("--hero-bottom-pad", `${pad.toFixed(1)}px`);
    };

    settle();
    // Late settles: webfonts reflow the copy/beneath heights, and browser
    // resize (incl. crossing the 561px gate) re-runs the same no-op-when-
    // settled math.
    const t1 = window.setTimeout(settle, 300);
    document.fonts?.ready.then(() => {
      if (!cancelled) {
        settle();
      }
    });
    window.addEventListener("resize", settle);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.removeEventListener("resize", settle);
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
      <div
        className="signal-index-shell"
        aria-hidden={realmOpen || undefined}
        inert={realmOpen || undefined}
      >
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
            {projects.slice(0, 6).map((project, index) => (
              <a
                className="signal-index-beneath-row"
                href={`#project-${project.id}`}
                key={project.id}
                onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                    event.preventDefault();
                    animateScrollToAnchor(`project-${project.id}`);
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
            {projects.length > 5 && (
              <a
                className="signal-index-beneath-more"
                href="#projects"
                data-more-mobile-only={projects.length === 6 ? "" : undefined}
                onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                    event.preventDefault();
                    animateScrollToAnchor("projects");
                  }
                }}
              >
                more <span aria-hidden="true">↓</span>
              </a>
            )}
            <span className="signal-index-beneath-rule" />
          </div>
        </section>

        <section
          ref={realmThresholdRef}
          className="realm-threshold rt-f"
          aria-labelledby="realm-threshold-title"
          data-section-reveal=""
        >
          <div className="rt-f-inner">
            <h2
              id="realm-threshold-title"
              aria-label="the same 7 works, beneath the surface — 7 doors into the same catalogue."
            >
              <span className="rt-f-line rt-f-above">
                <span className="rt-f-phrase">the same work,</span>

                <span className="rt-f-register" aria-hidden="true">
                  <span className="rt-f-count">07</span>
                  <span className="rt-f-noun">works</span>
                </span>
              </span>{" "}
              <span className="rt-f-line rt-f-below">
                <span className="rt-f-phrase">beneath the surface.</span>

                <span className="rt-f-register" aria-hidden="true">
                  <span className="rt-f-count">07</span>
                  <span className="rt-f-noun rt-f-doors">doors</span>
                </span>
              </span>
            </h2>

            <button
              ref={realmSectionEnterRef}
              className="realm-threshold-enter"
              type="button"
              onClick={handleRealmEnter}
              disabled={realmOpen}
              aria-label="enter the deep — enter the immersive realm"
            >
              <span className="rt-f-entry-copy">enter the deep</span>
            </button>
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
                <div className="gem-card-stage">
                  <ProjectArtwork project={project} />
                </div>
                <div className="gem-card-copy">
                  <p className="gem-card-topline">
                    {String(index + 1).padStart(2, "0")}
                    {project.tag ? ` · ${project.tag}` : ""}
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
            ))}
          </div>
        </section>

      </div>
      <div
        className="realm-bottom-floor"
        ref={realmFloorRef}
        aria-hidden="true"
      />
      <button
        type="button"
        className={`realm-enter-chip${realmChipVisible && !realmOpen ? " is-visible" : ""}`}
        ref={realmChipRef}
        onClick={handleRealmEnter}
        tabIndex={realmChipVisible && !realmOpen ? 0 : -1}
        disabled={!realmChipVisible || realmOpen}
        inert={!realmChipVisible || realmOpen || undefined}
        aria-hidden={!realmChipVisible || realmOpen}
        aria-label="enter the deep — enter the immersive realm"
      >
        <span className="realm-index" aria-hidden="true">01 /</span>
        <span className="realm-copy">
          <span>enter the deep</span>
          <span className="realm-chip-caption" aria-hidden="true">immersive catalogue</span>
        </span>
        <span className="realm-end" aria-hidden="true">
          <svg
            className="realm-arrow"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            focusable="false"
          >
            <path d="M10 3v14M4 11l6 6 6-6" />
          </svg>
        </span>
      </button>
      {realmOpen ? (
        <RealmMode
          projects={projects}
          onOpenProject={onOpenProject}
          onExit={handleRealmExit}
          entry={realmEntry}
        />
      ) : null}
    </main>
  );
}
