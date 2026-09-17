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
// Skin: the portfolio's ink-catalogue language (F002) — deep-ink field,
// warm paper text, ochre accent; canvas as the protagonist with a dotted
// bed, inspector as a readout rail, output as a printout, status line.
// React also renders the status line; the engine never needs to know.

import { useEffect, useState } from "react";
import { mountSpine } from "./loader";
import "./spine.css";

export default function SpinePage() {
  // Pane-level chrome only: which mode is visible on narrow viewports.
  // The Go engine is blind to this — both panes stay mounted so its id
  // bindings never break, and the desktop grid ignores data-mode entirely.
  const [mode, setMode] = useState<"design" | "code">("design");

  useEffect(() => {
    mountSpine();
  }, []);

  return (
    <div className="spine-root" data-mode={mode}>
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
        <div id="spine-canvas" />

        {/* Floating tool dock — the engine only binds these by id, the
            placement is React's business. */}
        <div className="spine-dock" role="toolbar" aria-label="Layout tools">
          <button id="spine-btn-add-item" type="button">+ item</button>
          <button id="spine-btn-add-container" type="button">+ container</button>
          <button id="spine-btn-delete" type="button" className="spine-danger">delete</button>
          <span className="spine-dock-sep" aria-hidden />
          <button id="spine-btn-undo" type="button" disabled>undo</button>
          <button id="spine-btn-redo" type="button" disabled>redo</button>
          <button id="spine-btn-reset" type="button" className="spine-danger">start anew</button>
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
        <span className="spine-status-cursor" aria-hidden>█</span>
      </footer>
    </div>
  );
}
