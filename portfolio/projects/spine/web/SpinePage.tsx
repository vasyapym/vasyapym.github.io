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

import { useEffect } from "react";
import { mountSpine } from "./loader";
import "./spine.css";

export default function SpinePage() {
  useEffect(() => {
    mountSpine();
  }, []);

  return (
    <div className="spine-root">
      <aside className="spine-inspector">
        <h2 className="spine-heading">Inspector</h2>

        <div className="spine-toolbar">
          <button id="spine-btn-add-item" type="button">+ Item</button>
          <button id="spine-btn-add-container" type="button">+ Container</button>
          <button id="spine-btn-delete" type="button">Delete</button>
          <button id="spine-btn-undo" type="button" disabled>Undo</button>
          <button id="spine-btn-redo" type="button" disabled>Redo</button>
        </div>

        <div id="spine-panel-mode" className="spine-field">
          <label htmlFor="spine-f-mode">Mode</label>
          <select id="spine-f-mode" defaultValue="flex">
            <option value="flex">Flexbox</option>
            <option value="grid">Grid</option>
          </select>
        </div>

        <fieldset id="spine-panel-flex">
          <legend>Flex</legend>
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
          <legend>Grid</legend>
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
        <div id="spine-canvas" />
      </section>

      <aside className="spine-code">
        <div className="spine-code-head">
          <h2 className="spine-heading">Output</h2>
          <button id="spine-btn-copy" type="button">Copy</button>
        </div>
        <h3>HTML</h3>
        <pre>
          <code id="spine-code-html" />
        </pre>
        <h3>CSS</h3>
        <pre>
          <code id="spine-code-css" />
        </pre>
      </aside>
    </div>
  );
}
