import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import "./mobile-hero-drafts.css";

type MobileHeroDraftsProps = {
  projects: readonly ProjectModule[];
};

type HeroDraft = {
  id: string;
  number: string;
  name: string;
  format: string;
  shape: string;
  motion: string;
  tone: string;
  scrollLinked?: boolean;
};

const MOBILE_HERO_DRAFTS: readonly HeroDraft[] = [
  {
    id: "soft-orb",
    number: "01",
    name: "Soft orb",
    format: "circle / breathing glow",
    shape:
      "The bordered square becomes a soft gradient sphere floating behind the headline — warm ochre core, cool halo.",
    motion:
      "Staggered fade-rise entrance; the orb breathes on an 8s scale/opacity loop and nothing else ever moves.",
    tone: "Calm, planetary, composed",
  },
  {
    id: "blob-morph",
    number: "02",
    name: "Blob morph",
    format: "organic blob / morph + parallax",
    shape:
      "The square melts into an organic two-tone blob that sits behind the copy like a soft ink stain.",
    motion:
      "Border-radius morphs continuously on a 12s loop with a slow float; scrolling shifts the blob on parallax.",
    tone: "Liquid, gentle, alive",
    scrollLinked: true,
  },
  {
    id: "ring-focus",
    number: "03",
    name: "Ring focus",
    format: "ring mark / draw-on",
    shape:
      "The panel is replaced by a thin instrument ring around the CTA — catalogue notation moved inside the dial.",
    motion:
      "On entrance the ring draws itself once; a dashed outer dial rotates almost imperceptibly; pressing the CTA pulses it.",
    tone: "Instrumental, precise, quiet",
  },
  {
    id: "diamond-mark",
    number: "04",
    name: "Diamond mark",
    format: "rotated mark / minimal stack",
    shape:
      "No panel at all — a small rotated square mark sits beside the kicker like a jeweller's stamp.",
    motion:
      "The diamond sways ±4° forever; rows and headline arrive with a soft left-origin stagger.",
    tone: "Minimal, stamped, assured",
  },
  {
    id: "gradient-aperture",
    number: "05",
    name: "Gradient aperture",
    format: "masked glow / drifting field",
    shape:
      "The hard box becomes an aperture: a masked radial window where the two ink-field glows concentrate.",
    motion:
      "Two glow layers drift in opposite directions behind the mask; copy enters with a simple staggered rise.",
    tone: "Atmospheric, deep, focused",
  },
  {
    id: "dot-matrix",
    number: "06",
    name: "Dot matrix",
    format: "dot grid / diagonal wave",
    shape:
      "The square dissolves into a dot lattice behind the headline — structure without weight.",
    motion:
      "Dots flash in a diagonal wave on a long loop, like a status board quietly reporting.",
    tone: "Technical, rhythmic, light",
  },
  {
    id: "scanline-plate",
    number: "07",
    name: "Scanline plate",
    format: "slim plate / scanning line",
    shape:
      "The squarish panel flattens into a slim full-width catalogue plate — one hairline box, no bulk.",
    motion:
      "A scanline sweeps the plate every few seconds; rows surface with a stagger timed to feel inspected.",
    tone: "Archival, mechanical, tidy",
  },
  {
    id: "arc-horizon",
    number: "08",
    name: "Arc horizon",
    format: "half-circle / scroll parallax",
    shape:
      "A half-circle horizon rises from the bottom edge — the square traded for one large calm curve.",
    motion:
      "The arc floats up on entrance, then lags the page scroll as a depth layer; a hairline marks its crest.",
    tone: "Spatial, serene, grounded",
    scrollLinked: true,
  },
  {
    id: "split-stack",
    number: "09",
    name: "Split stack",
    format: "full-width stack / wipe reveal",
    shape:
      "Panel and copy stop competing: copy on top, a growing hairline, project rows full-width underneath.",
    motion:
      "Sections reveal top-down with a clip wipe; the divider draws itself left to right between them.",
    tone: "Editorial, ordered, native",
  },
  {
    id: "floating-chips",
    number: "10",
    name: "Floating chips",
    format: "pill chips / pop stagger",
    shape:
      "Project rows become rounded pill chips that wrap naturally — the square replaced by many small soft units.",
    motion:
      "Chips pop in one after another; hovering or pressing lifts a chip 2px with a brighter border.",
    tone: "Tactile, friendly, modular",
  },
  {
    id: "depth-layers",
    number: "11",
    name: "Depth layers",
    format: "layered glows / multi-parallax",
    shape:
      "Three soft glow fields replace the box, staged at different depths like theatre flats.",
    motion:
      "Each layer scrolls at its own rate — far barely moves, near travels most — plus a faint idle drift.",
    tone: "Deep, cinematic, layered",
    scrollLinked: true,
  },
  {
    id: "dock-compress",
    number: "12",
    name: "Dock & compress",
    format: "panel / scroll response",
    shape:
      "The beneath panel keeps its identity but leans back: rows compress upward as you scroll away.",
    motion:
      "Row offsets and a rising summary bar are driven by scroll progress; the panel visibly yields without breaking layout.",
    tone: "Responsive, obedient, smart",
    scrollLinked: true,
  },
  {
    id: "line-reveal",
    number: "13",
    name: "Line reveal",
    format: "masked type / typewriter kicker",
    shape:
      "Composition unchanged — the refinement is purely typographic discipline on mobile.",
    motion:
      "Headline lines rise out of overflow masks in sequence while the kicker types itself character by character.",
    tone: "Editorial, confident, crisp",
  },
  {
    id: "counter-roll",
    number: "14",
    name: "Counter roll",
    format: "odometer / slide-in rows",
    shape:
      "A large odometer count takes the panel's place — the collection size becomes the graphic element.",
    motion:
      "Digits roll vertically into place on entrance; rows slide in from the left with a stagger.",
    tone: "Numeric, playful, precise",
  },
  {
    id: "marquee-notation",
    number: "15",
    name: "Marquee notation",
    format: "ticker strip / slow marquee",
    shape:
      "Catalogue notation leaves the box and becomes a full-width ticker along the hero's bottom edge.",
    motion:
      "The ticker crawls at reading-resting speed; reduced motion freezes it in place.",
    tone: "Broadcast, kinetic, urban",
  },
  {
    id: "magnetic-cta",
    number: "16",
    name: "Magnetic CTA",
    format: "solid action / magnetic pull",
    shape:
      "The CTA is promoted to a solid ochre slab — one strong element instead of a hollow box.",
    motion:
      "The slab leans toward the pointer within a small radius, springs back on exit, and compresses on press.",
    tone: "Confident, physical, direct",
  },
  {
    id: "tap-ripple",
    number: "17",
    name: "Tap ripple",
    format: "rows / material ripple",
    shape:
      "Rows stay full-width and flat; the polish is entirely in the response to touch.",
    motion:
      "Pressing a row releases a soft ripple from the contact point — GPU-only scale and fade, then gone.",
    tone: "Material, immediate, quiet",
  },
  {
    id: "tilt-panel",
    number: "18",
    name: "Tilt panel",
    format: "compact panel / pointer tilt",
    shape:
      "The panel survives, but smaller and centred — sized to the content instead of filling a column.",
    motion:
      "It tilts up to 4° toward the pointer with a smooth return; on touch the response is deliberately gentler.",
    tone: "Physical, premium, restrained",
  },
  {
    id: "aurora-drift",
    number: "19",
    name: "Aurora drift",
    format: "blurred bands / ambient drift",
    shape:
      "No object at all — two blurred light bands cross behind the type like a slow aurora.",
    motion:
      "Bands travel on opposing 22s and 30s loops; the entrance is a single soft fade.",
    tone: "Atmospheric, warm, unhurried",
  },
  {
    id: "grain-pulse",
    number: "20",
    name: "Grain & pulse",
    format: "film grain / single pulse",
    shape:
      "The square is gone entirely; a film-grain veil gives the ink field its texture instead.",
    motion:
      "One glow pulse on arrival, then the hero stands perfectly still — the most conservative variant.",
    tone: "Analog, still, archival",
  },
];

const CANVAS_WIDTHS = [375, 390, 430] as const;
type CanvasWidth = (typeof CANVAS_WIDTHS)[number];

export default function MobileHeroDrafts({ projects }: MobileHeroDraftsProps) {
  const [width, setWidth] = useState<CanvasWidth>(390);

  return (
    <main className="mhd-page">
      <div className="mhd-shell">
        <header className="mhd-header">
          <a className="mhd-home" href="/">
            <span aria-hidden="true">&lt;-</span>
            Vasily Argounov
          </a>
          <span className="mhd-header-center">Mobile hero drafts / square rework round</span>
          <span className="mhd-header-status">Concept board / {projects.length.toString().padStart(2, "0")} projects</span>
        </header>

        <section className="mhd-intro" aria-labelledby="mhd-title">
          <div>
            <p className="mhd-eyebrow">20 mobile variants / live drafts</p>
            <h1 id="mhd-title">
              Retire the square.
              <span>Keep the catalogue.</span>
            </h1>
          </div>
          <div className="mhd-intro-aside">
            <div className="mhd-width-toggle" role="group" aria-label="Preview width">
              {CANVAS_WIDTHS.map((w) => (
                <button
                  type="button"
                  key={w}
                  aria-pressed={width === w}
                  onClick={() => setWidth(w)}
                >
                  {w}
                </button>
              ))}
            </div>
            <p>
              Each card is a working miniature of the landing hero at phone widths — same ink field,
              same mono notation, real copy. The square beneath-panel is reworked into twenty shapes,
              and every motion you see is real: entrances, loops, scroll response, micro-interactions.
            </p>
            <span className="mhd-rule" aria-hidden="true" />
            <p className="mhd-intro-small">
              Nothing here touches production. Every variant honours prefers-reduced-motion, keeps AA
              contrast and 44px touch targets. Pick favourites; the winner gets ported into the landing.
            </p>
          </div>
        </section>

        <div className="mhd-index" aria-hidden="true">
          <span>01-20</span>
          <span>Mobile hero drafts · live motion</span>
          <span>{CANVAS_WIDTHS.join(" / ")} px preview</span>
        </div>

        <section className="mhd-grid" aria-label="Twenty mobile hero drafts" data-width={width}>
          {MOBILE_HERO_DRAFTS.map((draft) => (
            <DraftCard draft={draft} projects={projects} width={width} key={draft.id} />
          ))}
        </section>

        <footer className="mhd-footer">
          <span>Draft board / production homepage unchanged</span>
          <span>Next step after selection: port the winning variant</span>
        </footer>
      </div>
    </main>
  );
}

function DraftCard({
  draft,
  projects,
  width,
}: {
  draft: HeroDraft;
  projects: readonly ProjectModule[];
  width: CanvasWidth;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const live = useInView(canvasRef);
  useScrollProgress(canvasRef, Boolean(draft.scrollLinked));
  const [replayKey, setReplayKey] = useState(0);

  return (
    <article className={`mhd-draft mhd-draft-${draft.id}`}>
      <div className="mhd-draft-topline">
        <span className="mhd-draft-number">{draft.number}</span>
        <span className="mhd-draft-format">{draft.format}</span>
        <button
          type="button"
          className="mhd-replay"
          onClick={() => setReplayKey((key) => key + 1)}
          aria-label={`Replay ${draft.name}`}
        >
          ↻ replay
        </button>
      </div>

      <div className="mhd-canvas-frame">
        <div
          ref={canvasRef}
          className={`mhd-canvas${live ? " is-live" : ""}`}
          data-w={width}
        >
          <div className="mhd-statusbar" aria-hidden="true">
            <span>09:41</span>
            <span className="mhd-statusbar-dots">●●●</span>
          </div>
          <div className="mhd-hero-slot" key={replayKey}>
            <VariantHero id={draft.id} projects={projects} />
          </div>
        </div>
      </div>

      <div className="mhd-draft-meta">
        <div className="mhd-meta-row">
          <span>shape</span>
          <p>{draft.shape}</p>
        </div>
        <div className="mhd-meta-row">
          <span>motion</span>
          <p>{draft.motion}</p>
        </div>
      </div>

      <div className="mhd-draft-caption">
        <h2>{draft.name}</h2>
        <span>{draft.tone}</span>
      </div>
    </article>
  );
}

function useInView(ref: RefObject<HTMLDivElement | null>, threshold = 0.25): boolean {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setLive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setLive(true);
            observer.disconnect();
          }
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return live;
}

function useScrollProgress(ref: RefObject<HTMLDivElement | null>, enabled: boolean): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      el.style.setProperty("--p", progress.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, enabled]);
}

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Kicker({ typed = false }: { typed?: boolean }) {
  const text = "tinkering";
  if (!typed) {
    return <p className="mh-kicker anim" style={{ "--d": "80ms" } as CSSProperties}>{text}</p>;
  }
  return (
    <p className="mh-kicker" aria-label={text}>
      {text.split("").map((char, index) => (
        <span
          key={`${char}-${index}`}
          aria-hidden="true"
          className="mh-char"
          style={{ "--d": `${120 + index * 34}ms` } as CSSProperties}
        >
          {char}
        </span>
      ))}
    </p>
  );
}

function Headline({ lines }: { lines: readonly [string, ...string[]] }) {
  return (
    <h2 className="mh-h1">
      {lines.map((line, index) => (
        <span className="mh-line" key={line}>
          <span
            className="mh-line-inner anim"
            style={{ "--d": `${index * 130 + 140}ms` } as CSSProperties}
          >
            {line}
          </span>
        </span>
      ))}
    </h2>
  );
}

function Cta({ className }: { className?: string }) {
  return (
    <span className={`mh-cta anim${className ? ` ${className}` : ""}`} style={{ "--d": "480ms" } as CSSProperties}>
      run the models <b aria-hidden="true">↓</b>
    </span>
  );
}

function ProjectRows({
  projects,
  className,
  startIndex = 0,
}: {
  projects: readonly ProjectModule[];
  className?: string;
  startIndex?: number;
}) {
  return (
    <div className={`mh-rows${className ? ` ${className}` : ""}`}>
      {projects.map((project, index) =>
        project.tag ? (
          <div
            className="mh-row anim"
            key={project.id}
            style={{ "--d": `${startIndex * 90 + 520 + index * 110}ms`, "--ri": index } as CSSProperties}
          >
            <span className="mh-tag">
              {String(index + 1).padStart(2, "0")} / {project.tag}
            </span>
            <strong>— {project.title}</strong>
          </div>
        ) : null,
      )}
    </div>
  );
}

function VariantHero({ id, projects }: { id: string; projects: readonly ProjectModule[] }) {
  switch (id) {
    case "soft-orb":
      return (
        <div className="mh mh-soft-orb">
          <div className="scene" aria-hidden="true">
            <i className="orb-halo anim" style={{ "--d": "0ms" } as CSSProperties} />
            <i className="orb-core anim" style={{ "--d": "60ms" } as CSSProperties} />
          </div>
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <ProjectRows projects={projects} className="mh-rows-plain" />
        </div>
      );

    case "blob-morph":
      return (
        <div className="mh mh-blob-morph">
          <div className="scene" aria-hidden="true">
            <div className="blob-parallax">
              <i className="blob" />
            </div>
          </div>
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <ProjectRows projects={projects} className="mh-rows-plain" />
        </div>
      );

    case "ring-focus":
      return (
        <div className="mh mh-ring-focus">
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes &", "small machines"]} />
            <div className="ring-stage anim" style={{ "--d": "420ms" } as CSSProperties}>
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle className="ring-dial" cx="60" cy="60" r="56" />
                <circle className="ring-main" cx="60" cy="60" r="50" />
              </svg>
              <span className="ring-notation">run the models ↓</span>
            </div>
          </div>
          <ProjectRows projects={projects} className="mh-rows-plain" />
        </div>
      );

    case "diamond-mark":
      return (
        <div className="mh mh-diamond-mark">
          <div className="mh-body">
            <p className="mh-kicker">
              <i className="diamond anim" style={{ "--d": "0ms" } as CSSProperties} aria-hidden="true" />
              tinkering
            </p>
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <ProjectRows projects={projects} className="mh-rows-left" />
        </div>
      );

    case "gradient-aperture":
      return (
        <div className="mh mh-gradient-aperture">
          <div className="aperture anim" style={{ "--d": "60ms" } as CSSProperties} aria-hidden="true">
            <i className="aperture-glow-a" />
            <i className="aperture-glow-b" />
          </div>
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <ProjectRows projects={projects} className="mh-rows-plain" />
        </div>
      );

    case "dot-matrix": {
      const dots = Array.from({ length: 40 }, (_, index) => index);
      return (
        <div className="mh mh-dot-matrix">
          <div className="dots anim" style={{ "--d": "40ms" } as CSSProperties} aria-hidden="true">
            {dots.map((dot) => (
              <i key={dot} style={{ "--i": ((dot % 8) + Math.floor(dot / 8)) % 12 } as CSSProperties} />
            ))}
          </div>
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <ProjectRows projects={projects} className="mh-rows-plain" />
        </div>
      );
    }

    case "scanline-plate":
      return (
        <div className="mh mh-scanline-plate">
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <div className="plate anim" style={{ "--d": "420ms" } as CSSProperties}>
            <span className="plate-label">beneath the surface</span>
            <i className="scanline" aria-hidden="true" />
            <ProjectRows projects={projects} className="mh-rows-compact" />
          </div>
        </div>
      );

    case "arc-horizon":
      return (
        <div className="mh mh-arc-horizon">
          <div className="scene" aria-hidden="true">
            <div className="arc-parallax">
              <div className="arc anim" style={{ "--d": "0ms" } as CSSProperties}>
                <span className="arc-crest" />
              </div>
            </div>
          </div>
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <ProjectRows projects={projects} className="mh-rows-plain" />
        </div>
      );

    case "split-stack":
      return (
        <div className="mh mh-split-stack">
          <div className="stack-copy anim" style={{ "--d": "40ms" } as CSSProperties}>
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <span className="stack-divider anim" style={{ "--d": "360ms" } as CSSProperties} aria-hidden="true" />
          <ProjectRows projects={projects} className="mh-rows-full" startIndex={0} />
        </div>
      );

    case "floating-chips":
      return (
        <div className="mh mh-floating-chips">
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <div className="chips">
            {projects.map((project, index) =>
              project.tag ? (
                <span
                  className="chip anim"
                  key={project.id}
                  style={{ "--d": `${500 + index * 120}ms` } as CSSProperties}
                >
                  <em>
                    {String(index + 1).padStart(2, "0")} / {project.tag}
                  </em>
                  {project.title}
                </span>
              ) : null,
            )}
          </div>
        </div>
      );

    case "depth-layers":
      return (
        <div className="mh mh-depth-layers">
          <div className="scene" aria-hidden="true">
            <i className="layer layer-far anim" style={{ "--d": "0ms", "--depth": "0.3" } as CSSProperties} />
            <i className="layer layer-mid anim" style={{ "--d": "120ms", "--depth": "0.6" } as CSSProperties} />
            <i className="layer layer-near anim" style={{ "--d": "240ms", "--depth": "1" } as CSSProperties} />
          </div>
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <ProjectRows projects={projects} className="mh-rows-plain" />
        </div>
      );

    case "dock-compress":
      return (
        <div className="mh mh-dock-compress">
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <div className="dock">
            <span className="dock-label">beneath the surface</span>
            <ProjectRows projects={projects} className="mh-rows-compact" />
            <span className="dock-summary" aria-hidden="true">
              {String(projects.length).padStart(2, "0")} projects · indexed
            </span>
          </div>
        </div>
      );

    case "line-reveal":
      return (
        <div className="mh mh-line-reveal">
          <div className="mh-body">
            <Kicker typed />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <ProjectRows projects={projects} className="mh-rows-plain" />
        </div>
      );

    case "counter-roll": {
      const digits = projects.length.toString().padStart(2, "0").split("");
      return (
        <div className="mh mh-counter-roll">
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <div className="counter anim" style={{ "--d": "380ms" } as CSSProperties} aria-label={`${projects.length} projects`}>
              {digits.map((digit, index) => (
                <span className="digit" key={index} aria-hidden="true">
                  <span
                    className="reel"
                    style={{ "--n": Number(digit), "--dd": `${600 + index * 160}ms` } as CSSProperties}
                  >
                    {Array.from({ length: 10 }, (_, n) => (
                      <b key={n}>{n}</b>
                    ))}
                  </span>
                </span>
              ))}
              <span className="counter-caption">projects</span>
            </div>
          </div>
          <ProjectRows projects={projects} className="mh-rows-left" />
        </div>
      );
    }

    case "marquee-notation": {
      const items = projects
        .map((project, index) => `${String(index + 1).padStart(2, "0")} / ${project.tag ?? "misc"} — ${project.title}`)
        .join("  ··  ");
      return (
        <div className="mh mh-marquee-notation">
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <div className="ticker anim" style={{ "--d": "400ms" } as CSSProperties}>
            <div className="ticker-track">
              <span>{items}</span>
              <span aria-hidden="true">{items}</span>
            </div>
          </div>
        </div>
      );
    }

    case "magnetic-cta":
      return (
        <div className="mh mh-magnetic-cta">
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <MagneticSlab />
          </div>
          <ProjectRows projects={projects} className="mh-rows-plain" />
        </div>
      );

    case "tap-ripple":
      return (
        <div className="mh mh-tap-ripple">
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <TapRippleRows projects={projects} />
        </div>
      );

    case "tilt-panel":
      return (
        <div className="mh mh-tilt-panel">
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes &", "small machines"]} />
          </div>
          <div className="tilt-stage">
            <TiltPanel projects={projects} />
          </div>
        </div>
      );

    case "aurora-drift":
      return (
        <div className="mh mh-aurora-drift">
          <div className="scene" aria-hidden="true">
            <i className="aurora aurora-a anim" style={{ "--d": "0ms" } as CSSProperties} />
            <i className="aurora aurora-b anim" style={{ "--d": "150ms" } as CSSProperties} />
          </div>
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <ProjectRows projects={projects} className="mh-rows-plain" />
        </div>
      );

    case "grain-pulse":
      return (
        <div className="mh mh-grain-pulse">
          <div className="scene" aria-hidden="true">
            <i className="pulse-core anim" style={{ "--d": "200ms" } as CSSProperties} />
          </div>
          <div className="mh-body">
            <Kicker />
            <Headline lines={["prototypes", "& small machines"]} />
            <Cta />
          </div>
          <ProjectRows projects={projects} className="mh-rows-plain" />
        </div>
      );

    default:
      return null;
  }
}

function MagneticSlab() {
  const onMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (reducedMotion()) return;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const reach = 64;
    const pull = Math.max(-1, Math.min(1, 1 - Math.hypot(dx, dy) / reach));
    const angle = Math.atan2(dy, dx);
    target.style.transform = `translate(${Math.cos(angle) * pull * 9}px, ${Math.sin(angle) * pull * 7}px)`;
  };
  const onLeave = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.transform = "";
  };
  return (
    <span
      className="slab anim"
      style={{ "--d": "460ms" } as CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerDown={(event) => {
        if (!reducedMotion()) event.currentTarget.classList.add("is-pressed");
      }}
      onPointerUp={(event) => event.currentTarget.classList.remove("is-pressed")}
      onKeyDown={(event: ReactKeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" || event.key === " ") event.currentTarget.classList.add("is-pressed");
      }}
      onKeyUp={(event: ReactKeyboardEvent<HTMLElement>) => event.currentTarget.classList.remove("is-pressed")}
      tabIndex={0}
      role="button"
    >
      run the models ↓
    </span>
  );
}

function TapRippleRows({ projects }: { projects: readonly ProjectModule[] }) {
  const onPress = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion()) return;
    const row = event.currentTarget;
    const rect = row.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    row.appendChild(ripple);
    const animation = ripple.animate(
      [
        { transform: "translate(-50%, -50%) scale(0)", opacity: 0.32 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
      ],
      { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    animation.onfinish = () => ripple.remove();
  };
  return (
    <div className="mh-rows mh-rows-ripplable">
      {projects.map((project, index) =>
        project.tag ? (
          <div
            className="mh-row anim"
            key={project.id}
            onPointerDown={onPress}
            style={{ "--d": `${540 + index * 110}ms` } as CSSProperties}
          >
            <span className="mh-tag">
              {String(index + 1).padStart(2, "0")} / {project.tag}
            </span>
            <strong>— {project.title}</strong>
          </div>
        ) : null,
      )}
    </div>
  );
}

function TiltPanel({ projects }: { projects: readonly ProjectModule[] }) {
  const onMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (reducedMotion()) return;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    const dampen = event.pointerType === "touch" ? 0.45 : 1;
    target.style.transform = `rotateX(${(-py * 8 * dampen).toFixed(2)}deg) rotateY(${(px * 8 * dampen).toFixed(2)}deg)`;
  };
  const onLeave = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.transform = "";
  };
  return (
    <div
      className="tilt-card anim"
      style={{ "--d": "420ms" } as CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <span className="tilt-label">beneath the surface</span>
      <ProjectRows projects={projects} className="mh-rows-compact" />
    </div>
  );
}
