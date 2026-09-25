import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./about-window.css";

type AboutWindowProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
};

// R031 concept ("catalogue slip"): a full-height ledger sheet docked to the
// right edge — top strip echoes the trigger, a 1px gutter rule carries the
// index marks (ochre #, 01–07, mail), the sheet slides 24px and fades.

/** keep in sync with --aw-dur in about-window.css */
const EXIT_MS = 220;

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

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
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const returnRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  const onNavigateRef = useRef(onNavigate);
  const titleId = useId();

  closeRef.current = onClose;
  onNavigateRef.current = onNavigate;

  // open: remember trigger → mount → paint closed → show
  // close: hide → return focus → unmount after exit transition
  useEffect(() => {
    if (open) {
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active !== document.body &&
        !sheetRef.current?.contains(active)
      ) {
        returnRef.current = active;
      }
      setMounted(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setShown(false);
    const el = returnRef.current;
    returnRef.current = null;
    if (el && el.isConnected) el.focus({ preventScroll: true });
    const t = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  // focus in
  useEffect(() => {
    if (open && mounted) sheetRef.current?.focus({ preventScroll: true });
  }, [open, mounted]);

  // esc + focus trap
  useEffect(() => {
    if (!open || !mounted) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const tabbables = () =>
      Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.isComposing) {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const items = tabbables();
      if (items.length === 0) {
        e.preventDefault();
        sheet.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!sheet.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && (active === first || active === sheet)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      if (e.target instanceof Node && !sheet.contains(e.target)) {
        sheet.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open, mounted]);

  // body scroll lock (held through the exit fade so the page doesn't jump)
  useEffect(() => {
    if (!mounted) return;
    const { body, documentElement: html } = document;
    const gap = window.innerWidth - html.clientWidth;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPadding: body.style.paddingRight,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (gap > 0) {
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gap}px`;
    }
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.paddingRight = prev.bodyPadding;
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="aw" data-state={shown ? "open" : "closed"}>
      <div className="aw-scrim" aria-hidden="true" onClick={onClose} />

      <div
        ref={sheetRef}
        className="aw-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="aw-strip">
          <span className="aw-meta">about the project</span>
          <button type="button" className="aw-close" onClick={onClose}>
            close<span className="aw-key" aria-hidden="true">&nbsp;·&nbsp;esc</span>
          </button>
        </header>

        <div className="aw-scroll">
          <article className="aw-entry">
            <h1 id={titleId} className="aw-title">
              <span className="aw-mark" aria-hidden="true">#</span>
              vasyapym
            </h1>

            <div className="aw-body">
              <p>
                A friend of mine loves Hello Kitty. I love the tone of Dark
                Souls: the quiet, the weight of each step.{" "}
                <ProjectLink id="kitty-run" onNavigate={onNavigateRef.current}>
                  kitty-run
                </ProjectLink>{" "}
                is where the two met. It's a chill endless runner where the
                mechanics are simple and what they add up to isn't.
              </p>
              <p>
                I wanted notes that are open before I finish reaching for them.{" "}
                <ProjectLink id="quicknotes" onNavigate={onNavigateRef.current}>
                  quicknotes
                </ProjectLink>{" "}
                signs in with Google and syncs across devices, and one button
                copies the note as markdown. Quickness is the whole feature.
              </p>
              <p>
                I came to code from linguistics, so language models were always
                going to catch me. They're brilliant only sometimes. What holds
                me is watching one think: how it rebuilds language, and a
                picture of the world, out of nothing but the texts it read.
                That's{" "}
                <ProjectLink id="practice-map" onNavigate={onNavigateRef.current}>
                  waste of tokens
                </ProjectLink>
                .
              </p>
              <p>
                Some things I made just to see them work. In{" "}
                <ProjectLink id="raft-cluster" onNavigate={onNavigateRef.current}>
                  raft-cluster
                </ProjectLink>
                , Rust in WebAssembly, you crash the leader and watch the
                survivors vote in a new term.{" "}
                <ProjectLink id="spine" onNavigate={onNavigateRef.current}>
                  spine
                </ProjectLink>{" "}
                puts a Go core in WebAssembly under a flexbox and grid editor
                that exports clean HTML and CSS. It's a look at what sits behind
                a frontend.
              </p>
              <p>
                Some I made because I love how they look.{" "}
                <ProjectLink id="evening-forest" onNavigate={onNavigateRef.current}>
                  evening-forest
                </ProjectLink>{" "}
                is an 8-bit walk into a forest at dusk.{" "}
                <ProjectLink id="explosion" onNavigate={onNavigateRef.current}>
                  explosion
                </ProjectLink>{" "}
                is a paper-lantern moon breaking into 600 shards on the GPU.
              </p>
              <p>
                And{" "}
                <ProjectLink id="planck-to-now" onNavigate={onNavigateRef.current}>
                  planck-to-now
                </ProjectLink>{" "}
                lets you scrub from the first instant of the universe to this
                one, on a log scale. It's a reminder that we're all cosmic dust.
              </p>
              <p>
                All eight live on{" "}
                <a href="https://vasyapym.github.io">vasyapym.github.io</a>,
                each self-contained, each with its own tests. If you'd rather
                meet them in the dark, switch on <em>the deep</em> and they'll
                come to your lantern.
              </p>
            </div>

            <p className="aw-email">
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </p>
          </article>
        </div>
      </div>
    </div>,
    document.body
  );
}
