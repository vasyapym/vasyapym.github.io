// web/SpinePage.tsx — React page hosting the Spine layout engine.
//
// The split of responsibility is deliberate: React renders the static
// three-pane shell (inspector, canvas, code output) once, and the Go wasm
// module takes ownership from there — it binds to the elements by id,
// projects the layout tree into #spine-canvas and keeps the inspector and
// code panels in sync. All inputs stay uncontrolled so React never fights
// the Go-side DOM writes.
//
// The wasm module is loaded once per browser session (module-level promise);
// re-entering the page after SPA navigation just re-binds the fresh DOM via
// the spineRebind hook the Go side exposes.
//
// Skin: the DATUM register — a drawing sheet, not a game board. Three
// strokes carry all state (hairline = exists, stronger ink = hover, 2px
// ochre = live). React also runs a read-only measurement pass over the
// engine-projected tree (MutationObserver + rAF) that stamps additive
// data-* attributes the CSS styles: level-of-detail (data-lod), focus
// dimming context (data-focus), overflow collapse (data-collapse) and
// selected-dimension witness readouts (data-dims). The engine's own
// classes, ids and inline styles are never touched.
//
// Scroll mode (adaptive, F012): when the layout outgrows the viewport
// (content/viewport ratio past a mobile/desktop threshold, or mobile boxes
// under touch size), a non-blocking mono prompt offers "scroll mode" — a
// full-viewport 1:1 preview with native scroll navigation, a sticky exit
// header and a bottom-sheet inspector on selection. Dismissal is remembered
// per session and re-arms when the ratio doubles.

import { useCallback, useEffect, useRef, useState } from "react";
import { mountSpine } from "./loader";
import "./spine.css";

type Measure = { ratio: number; median: number };

const DISMISS_KEY = "spine-scroll-dismissed";

// Boot overlay: pure ink (no ochre — ochre means "live", and the engine is
// not live yet). Sits over the empty workspace only; the Go engine binds the
// panes by id, so they always stay mounted beneath it.
function SpineBootIndicator() {
  return (
    <div className="spine-boot" role="status" aria-live="polite">
      <div className="spine-boot__frame">
        <div className="spine-boot__line">
          <span className="spine-boot__tick" aria-hidden="true">┌─</span>
          <span className="spine-boot__label">booting engine</span>
        </div>
        <div className="spine-boot__rule" aria-hidden="true">
          <span className="spine-boot__sweep" />
        </div>
        <div className="spine-boot__sub">go → wasm · compiling layout</div>
      </div>
    </div>
  );
}

export default function SpinePage() {
  // Pane-level chrome only: which mode is visible on narrow viewports.
  // The Go engine is blind to this — both panes stay mounted so its id
  // bindings never break, and the desktop grid ignores data-mode entirely.
  const [mode, setMode] = useState<"design" | "code">("design");
  // Scroll mode is React-only chrome: it repositions panes with CSS, it
  // never re-parents or mutates engine-owned DOM, so bindings survive.
  const [scrollMode, setScrollMode] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [measure, setMeasure] = useState<Measure | null>(null);
  const [offer, setOffer] = useState<Measure | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Boot state: initialised from the loader's session-level ready flag, so an
  // SPA re-entry after the first boot never flashes the indicator. Observed
  // via rAF (pauses on hidden tabs) — loader.ts stays frozen; if it ever
  // returns bootPromise, swap this loop for a .then().
  const [booting, setBooting] = useState(() => !window.spineReady);

  useEffect(() => {
    mountSpine();

    if (window.spineReady) {
      setBooting(false);
      return;
    }

    let raf = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (window.spineReady) {
        setBooting(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  // Read-only context pass over the engine-projected tree. Runs one
  // rAF-scheduled frame per mutation/resize: reads geometry, then stamps
  // additive data-* attributes and reports viewport fit. Engine DOM is
  // never written beyond these attributes.
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    let raf = 0;
    let lastSelID = "";

    const pass = () => {
      raf = 0;
      const nodes = Array.from(canvas.querySelectorAll<HTMLElement>(".node"));

      // --- read phase: one layout flush, then attribute writes ---
      const rects = nodes.map((n) => ({ n, w: n.offsetWidth, h: n.offsetHeight }));
      let sel: HTMLElement | null = null;
      const widths: number[] = [];
      for (const { n, w } of rects) {
        widths.push(w);
        if (n.classList.contains("selected")) sel = n;
      }

      // --- write phase: LOD, overflow collapse, focus context, dims ---
      // LOD is width-based (DATUM): >=120 full label, >=44 tag, below the
      // 44px touch floor stroke-only. Collapse follows DATUM's rule: a
      // container under 60px wide hides its children only when they would
      // render under 12px, showing a ×N count instead.
      const widthOf = new Map(rects.map(({ n, w }) => [n, w]));
      for (const { n, w } of rects) {
        n.dataset.lod = w >= 120 ? "full" : w >= 44 ? "tag" : "stroke";
        if (n.classList.contains("container") && w < 60) {
          const kids = Array.from(n.children).filter(
            (c) => c.classList.contains("node"),
          ) as HTMLElement[];
          if (kids.length > 0 && kids.some((k) => (widthOf.get(k) ?? 0) < 12)) {
            n.dataset.collapse = String(kids.length);
          } else {
            delete n.dataset.collapse;
          }
        } else {
          delete n.dataset.collapse;
        }
      }
      for (const { n } of rects) delete n.dataset.focus;
      if (sel) {
        root.dataset.hasSel = "1";
        const chain = new Set<HTMLElement>();
        let el: HTMLElement | null = sel;
        while (el && el !== canvas) {
          chain.add(el);
          el = el.parentElement;
        }
        const peer = new Set<HTMLElement>();
        chain.forEach((member) => {
          for (const c of Array.from(member.children)) {
            if (c.classList.contains("node") && !chain.has(c as HTMLElement)) {
              peer.add(c as HTMLElement);
            }
          }
        });
        for (const { n } of rects) {
          if (n === sel) n.dataset.focus = "target";
          else if (chain.has(n)) n.dataset.focus = "chain";
          else if (peer.has(n)) n.dataset.focus = "peer";
          else n.dataset.focus = "far";
        }
        sel.dataset.dims = `${sel.offsetWidth} × ${sel.offsetHeight}`;
        const id = sel.dataset.id ?? "";
        if (id !== lastSelID) {
          lastSelID = id;
          setSheetOpen(true);
        }
      } else {
        delete root.dataset.hasSel;
        lastSelID = "";
      }

      // --- viewport fit report for the adaptive scroll-mode prompt ---
      widths.sort((a, b) => a - b);
      const median = widths.length ? widths[Math.floor(widths.length / 2)] : 0;
      const ratio = Math.max(
        canvas.scrollHeight / Math.max(1, window.innerHeight),
        canvas.scrollWidth / Math.max(1, window.innerWidth),
      );
      setMeasure({ ratio, median });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(pass);
    };
    const mo = new MutationObserver(schedule);
    mo.observe(canvas, { childList: true, subtree: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(canvas);
    window.addEventListener("resize", schedule);
    pass();
    return () => {
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
    // setMeasure is stable; the pass closes over nothing else reactive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Adaptive offer: ratio past threshold (1.4 mobile / 2.0 desktop) or
  // mobile boxes under touch size; a dismissal re-arms when ratio doubles.
  useEffect(() => {
    if (!measure || scrollMode) {
      setOffer(null);
      return;
    }
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const threshold = mobile ? 1.4 : 2.0;
    const tripped =
      measure.ratio > threshold ||
      (mobile && measure.median > 0 && measure.median < 44);
    if (!tripped) {
      setOffer(null);
      return;
    }
    const dismissed = parseFloat(sessionStorage.getItem(DISMISS_KEY) ?? "");
    const armed = !Number.isFinite(dismissed) || measure.ratio >= dismissed * 2;
    setOffer(armed ? measure : null);
  }, [measure, scrollMode]);

  const exitScrollMode = useCallback(() => {
    setScrollMode(false);
    const sel = canvasRef.current?.querySelector(".selected");
    sel?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, []);

  useEffect(() => {
    if (!scrollMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitScrollMode();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollMode, exitScrollMode]);

  const dismissOffer = useCallback(() => {
    if (offer) sessionStorage.setItem(DISMISS_KEY, String(offer.ratio));
    setOffer(null);
  }, [offer]);

  return (
    <div
      className="spine-root"
      ref={rootRef}
      data-mode={mode}
      data-scrollmode={scrollMode ? "1" : undefined}
      data-sheet={sheetOpen ? "1" : undefined}
    >
      <div className="spine-topbar">
        <h2 className="spine-heading spine-inspector-heading">
          inspector<span id="spine-sel-label" />
        </h2>

        <div className="spine-modebar" role="group" aria-label="View mode">
          <button
            type="button"
            aria-pressed={mode === "design"}
            onClick={() => setMode("design")}
          >
            design
          </button>
          <button
            type="button"
            aria-pressed={mode === "code"}
            onClick={() => setMode("code")}
          >
            code
          </button>
        </div>
      </div>

      <aside className="spine-inspector" aria-label="Inspector">
        <button
          type="button"
          className="spine-sheet-close"
          aria-label="Close inspector sheet"
          onClick={() => setSheetOpen(false)}
        >
          ✕
        </button>
        <div id="spine-panel-mode" className="spine-field">
          <label htmlFor="spine-f-mode">display</label>
          <select id="spine-f-mode" defaultValue="flex">
            <option value="flex">flex</option>
            <option value="grid">grid</option>
          </select>
        </div>

        <fieldset id="spine-panel-flex">
          <legend>flex</legend>
          <div className="spine-field">
            <label htmlFor="spine-f-flex-direction">flex-direction</label>
            <select id="spine-f-flex-direction" defaultValue="row">
              <option>row</option>
              <option>row-reverse</option>
              <option>column</option>
              <option>column-reverse</option>
            </select>
          </div>
          <div className="spine-field">
            <label htmlFor="spine-f-flex-wrap">flex-wrap</label>
            <select id="spine-f-flex-wrap" defaultValue="nowrap">
              <option>nowrap</option>
              <option>wrap</option>
              <option>wrap-reverse</option>
            </select>
          </div>
          <div className="spine-field">
            <label htmlFor="spine-f-justify-content">justify-content</label>
            <select id="spine-f-justify-content" defaultValue="flex-start">
              <option>flex-start</option>
              <option>flex-end</option>
              <option>center</option>
              <option>space-between</option>
              <option>space-around</option>
              <option>space-evenly</option>
            </select>
          </div>
          <div className="spine-field">
            <label htmlFor="spine-f-align-items">align-items</label>
            <select id="spine-f-align-items" defaultValue="stretch">
              <option>stretch</option>
              <option>flex-start</option>
              <option>flex-end</option>
              <option>center</option>
              <option>baseline</option>
            </select>
          </div>
        </fieldset>

        <fieldset id="spine-panel-grid" className="hidden">
          <legend>grid</legend>
          <div className="spine-field">
            <label htmlFor="spine-f-grid-template-columns">grid-template-columns</label>
            <input id="spine-f-grid-template-columns" type="text" />
          </div>
          <div className="spine-field">
            <label htmlFor="spine-f-grid-template-rows">grid-template-rows</label>
            <input id="spine-f-grid-template-rows" type="text" />
          </div>
          <div className="spine-field">
            <label htmlFor="spine-f-grid-auto-flow">grid-auto-flow</label>
            <select id="spine-f-grid-auto-flow" defaultValue="row">
              <option>row</option>
              <option>column</option>
              <option>dense</option>
            </select>
          </div>
        </fieldset>

        <div className="spine-field">
          <label htmlFor="spine-f-gap">gap</label>
          <input id="spine-f-gap" type="text" />
        </div>
        <div className="spine-field">
          <label htmlFor="spine-f-flex-grow">flex-grow</label>
          <input id="spine-f-flex-grow" type="number" />
        </div>
        <div className="spine-field">
          <label htmlFor="spine-f-order">order</label>
          <input id="spine-f-order" type="number" />
        </div>
      </aside>

      <section className="spine-workspace" aria-label="Layout canvas">
        <span className="spine-ruler spine-ruler-h" aria-hidden />
        <span className="spine-ruler spine-ruler-v" aria-hidden />

        {/* The inner scroller: #spine-canvas scrolls here while the rulers,
            the scale bar and the dock stay pinned to the workspace. */}
        <div className="spine-scroll">
          <div id="spine-canvas" ref={canvasRef} />
        </div>

        {/* DATUM scale bar: the sheet always tells you its module. */}
        <span className="spine-scale" aria-hidden>
          └─ 100px
        </span>

        {/* Wasm boot overlay — covers only the empty canvas region; the
            engine-bound panes stay mounted underneath. */}
        {booting && <SpineBootIndicator />}

        {/* Adaptive scroll-mode prompt (F012) — never a modal, never over
            the canvas center; slides away the moment it is irrelevant. */}
        {offer && !scrollMode && (
          <div className="spine-fs-prompt" role="status">
            <span className="spine-fs-ratio">
              layout ×{offer.ratio.toFixed(1)} viewport
            </span>
            <button
              type="button"
              className="spine-fs-go"
              onClick={() => setScrollMode(true)}
            >
              scroll mode →
            </button>
            <button type="button" className="spine-fs-dismiss" onClick={dismissOffer}>
              dismiss
            </button>
          </div>
        )}

        {/* Sticky exit header for scroll mode. */}
        {scrollMode && (
          <header className="spine-fs-head">
            <button type="button" className="spine-fs-exit" onClick={exitScrollMode}>
              ◂ exit
            </button>
            <span className="spine-fs-hint">scroll mode · 1:1 · esc to exit</span>
          </header>
        )}

        {/* Floating tool dock — the engine only binds these by id, the
            placement is React's business. "scroll" is React-only chrome. */}
        <div className="spine-dock" role="toolbar" aria-label="Layout tools">
          <button id="spine-btn-add-item" type="button">+ item</button>
          <button id="spine-btn-add-container" type="button">+ container</button>
          <button id="spine-btn-delete" type="button" className="spine-danger">delete</button>
          <span className="spine-dock-sep" aria-hidden />
          <button id="spine-btn-undo" type="button" disabled>undo</button>
          <button id="spine-btn-redo" type="button" disabled>redo</button>
          <button id="spine-btn-reset" type="button" className="spine-danger">start anew</button>
          <span className="spine-dock-sep" aria-hidden />
          <button id="spine-btn-scrollmode" type="button" onClick={() => setScrollMode(true)}>
            scroll
          </button>
        </div>
      </section>

      <aside className="spine-code">
        <div className="spine-code-head">
          <h2 className="spine-heading">output</h2>
          <button id="spine-btn-copy" type="button">copy</button>
        </div>
        <h3>index.html</h3>
        <pre>
          <code id="spine-code-html" />
        </pre>
        <h3>layout.css</h3>
        <pre>
          <code id="spine-code-css" />
        </pre>
      </aside>

      <footer className="spine-status" role="status">
        <span className="spine-status-seg">~/spine.lay</span>
        <span className="spine-status-seg spine-status-grow">
          drag · nest · retune · copy
        </span>
      </footer>
    </div>
  );
}
