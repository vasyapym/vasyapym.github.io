import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./about-window.css";

type AboutWindowProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
};

// R030 concept ("unfiled catalogue leaf"): the about leaf is entry 00
// outside the eight — the spine and ticks carry the catalogue joke.

function ProjectLink({
  id,
  onNavigate,
  children,
}: {
  id: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <a
      href={`/projects/${id}/`}
      data-project={id}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(id);
      }}
    >
      {children}
    </a>
  );
}

const EMAIL = "vasyapym@gmail.com";

export default function AboutWindow({ open, onClose, onNavigate }: AboutWindowProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLAnchorElement>(null);
  const onCloseRef = useRef(onClose);
  const onNavigateRef = useRef(onNavigate);
  const titleId = useId();

  onCloseRef.current = onClose;
  onNavigateRef.current = onNavigate;

  useEffect(() => {
    if (!open) return;

    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyPadding = body.style.paddingRight;

    // Preserve the page width when its scrollbar disappears.
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    if (scrollbarWidth > 0) {
      const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${padding + scrollbarWidth}px`;
    }

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (element) =>
          element.tabIndex >= 0 && element.getClientRects().length > 0
      );

      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outside = !dialog.contains(active);

      if (event.shiftKey && (active === first || active === dialog || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || active === dialog || outside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
      body.style.paddingRight = previousBodyPadding;

      if (trigger?.isConnected) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const paragraphs: ReactNode[] = [
    <>
      A friend of mine loves Hello Kitty. I love the tone of Dark Souls: the
      quiet, the weight of each step.{" "}
      <ProjectLink id="kitty-run" onNavigate={onNavigateRef.current}>
        kitty-run
      </ProjectLink>{" "}
      is where the two met. It's a chill endless runner where the mechanics are
      simple and what they add up to isn't.
    </>,
    <>
      I wanted notes that are open before I finish reaching for them.{" "}
      <ProjectLink id="quicknotes" onNavigate={onNavigateRef.current}>
        quicknotes
      </ProjectLink>{" "}
      signs in with Google and syncs across devices, and one button copies the
      note as markdown. Quickness is the whole feature.
    </>,
    <>
      I came to code from linguistics, so language models were always going to
      catch me. They're brilliant only sometimes. What holds me is watching one
      think: how it rebuilds language, and a picture of the world, out of
      nothing but the texts it read. That's{" "}
      <ProjectLink id="practice-map" onNavigate={onNavigateRef.current}>
        waste of tokens
      </ProjectLink>
      .
    </>,
    <>
      Some things I made just to see them work. In{" "}
      <ProjectLink id="raft-cluster" onNavigate={onNavigateRef.current}>
        raft-cluster
      </ProjectLink>
      , Rust in WebAssembly, you crash the leader and watch the survivors vote
      in a new term.{" "}
      <ProjectLink id="spine" onNavigate={onNavigateRef.current}>
        spine
      </ProjectLink>{" "}
      puts a Go core in WebAssembly under a flexbox and grid editor that
      exports clean HTML and CSS. It's a look at what sits behind a frontend.
    </>,
    <>
      Some I made because I love how they look.{" "}
      <ProjectLink id="evening-forest" onNavigate={onNavigateRef.current}>
        evening-forest
      </ProjectLink>{" "}
      is an 8-bit walk into a forest at dusk.{" "}
      <ProjectLink id="explosion" onNavigate={onNavigateRef.current}>
        explosion
      </ProjectLink>{" "}
      is a paper-lantern moon breaking into 600 shards on the GPU.
    </>,
    <>
      And{" "}
      <ProjectLink id="planck-to-now" onNavigate={onNavigateRef.current}>
        planck-to-now
      </ProjectLink>{" "}
      lets you scrub from the first instant of the universe to this one, on a
      log scale. It's a reminder that we're all cosmic dust.
    </>,
    <>
      All eight live on{" "}
      <a href="https://vasyapym.github.io">vasyapym.github.io</a>, each
      self-contained, each with its own tests. If you'd rather meet them in the
      dark, switch on <em>the deep</em> and they'll come to your lantern.
    </>,
  ];

  return createPortal(
    <div
      className="about-window"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={dialogRef}
        className="about-window__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="about-window__spine" aria-hidden="true">
          <span>00</span>
          <span className="about-window__spine-caption">outside the index</span>
          <span className="about-window__ticks">
            {Array.from({ length: 8 }, (_, index) => (
              <span key={index} />
            ))}
          </span>
        </div>

        <div className="about-window__main">
          <header className="about-window__header">
            <span>vasyapym / index</span>
            <a
              ref={closeRef}
              className="about-window__close"
              href="./"
              onClick={(event) => {
                event.preventDefault();
                onCloseRef.current();
              }}
            >
              close <span aria-hidden="true">×</span>
            </a>
          </header>

          <div className="about-window__page">
            <div className="about-window__intro">
              <div className="about-window__intro-meta">
                <span>about / a loose leaf</span>
                <span>00 / 08</span>
              </div>
              <h2 id={titleId}>
                <span className="about-window__hash">#</span> vasyapym
              </h2>
            </div>

            <div className="about-window__entries">
              {paragraphs.map((paragraph, index) => (
                <div className="about-window__entry" key={index}>
                  <span className="about-window__entry-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")} /
                  </span>
                  <p>{paragraph}</p>
                </div>
              ))}
            </div>

            <address className="about-window__contact">
              <span className="about-window__contact-label">contact /</span>
              <a className="about-window__email" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </address>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
