# Brief — Move the "switch mode" button into the simulation viewport (Explosion)

## Context

Personal portfolio site, React 19 + three.js + plain CSS per project. The "Explosion" page hosts two simulation modes; users pick a mode on a first-visit selector and can switch at runtime. You have NO repo access; this brief contains everything you need.

**Owner report:** the "switch mode" button currently sits in a control row *below* the simulation viewport, next to other buttons — users don't notice it. Goal: relocate it so it appears **within the simulation viewport area** (an overlay on/over the canvas stage), improving discoverability. The other three buttons (restore, slow-mo, sound) stay where they are.

Aesthetic: dark editorial theme; the stage is a dark rounded rectangle with a canvas, a faint grid overlay, and a stats HUD chip in its **top-left** corner (mono font, small, translucent dark panel). Lowercase text everywhere.

## Hard constraints

1. Clicking the relocated button must return to the mode selector exactly as today (`backToSelect`) — and must **not** trigger the stage's detonation. The stage div has `role="button"`, `tabIndex={0}`, and `onPointerDown` that fires a detonation at the pointer position. Any child of the stage inherits that bubble; a sibling overlay does not. You own this structural decision — but a click on "switch mode" must never also fire a detonation.
2. Keep the class `explosion-btn-mode` on the relocated button (the headless test suite clicks it by class). Keep `type="button"`, keep `disabled={!supported}` semantics available.
3. Do **not** place the button in the **top-left** corner of the stage: the HUD chip lives there, and the test suite clicks the stage's top-left corner (2%, 2%) expecting a no-op "miss" — an interactive element there would swallow the miss-click and break that test. Any other corner/placement is yours to choose; justify it.
4. The button must be a visible, clickable overlay that never fully covers the stage center (the center is the primary detonate tap target) and must not create horizontal overflow at 390px mobile width. Respect touch targets (≥44px height on mobile is the file's existing convention for buttons).
5. Don't restyle the other three buttons or the hint line; don't touch stage canvas/grid/HUD layering beyond what your change needs. Layering facts: canvas z-index 0, grid overlay (`::before`) z-index 1, HUD z-index 2; the stage has `overflow: hidden`, `aspect-ratio: 16/11` (3/4 on ≤640px), `position: relative`.
6. Keep the existing visual language: mono font buttons, translucent dark panels, `--panel-line` borders, ember accent on hover (`--ink-accent` / `--ink-accent-bright`), 2px accent focus ring (`.explosion-btn:focus-visible` pattern). You may derive a small chip variant; keep it coherent.

## Current code (verbatim, minimal excerpts)

### web/ExplosionLunaPage.tsx — the handlers (unchanged, for reference)

```tsx
const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
  if (event.button !== 0) return;
  pairRef.current?.handle.detonateAt(event.clientX, event.clientY);
}, []);

const backToSelect = useCallback((): void => {
  setView({ kind: "select" });
}, []);
```

### web/ExplosionLunaPage.tsx — the mode-view render (the part you restructure)

```tsx
return (
  <div
    ref={stageRef}
    id="explosion-stage"
    className="explosion-stage"
    role="button"
    tabIndex={0}
    aria-label={active?.stageLabel ?? ""}
    data-engagements={stats.engagements}
    onPointerDown={handlePointerDown}
    onKeyDown={handleKeyDown}
  >
    <div className="explosion-hud" aria-hidden="true">
      {hud ? <span className="explosion-hud-line">{hud}</span> : null}
    </div>
  </div>
);
```

...and inside the outer return, after `{renderStage()}`:

```tsx
{view.kind === "mode" ? (
  <>
    <div className="explosion-controls">
      <button type="button" className="explosion-btn explosion-btn-restore" onClick={handleRestore} disabled={!supported}>
        restore
      </button>
      <button type="button" className="explosion-btn explosion-btn-slow" onClick={handleToggleSlowMo} disabled={!supported} aria-pressed={slowMo}>
        {slowMo ? "slow-mo · on" : "slow-mo"}
      </button>
      <button type="button" className="explosion-btn explosion-btn-sound" onClick={handleToggleMute} disabled={!supported} aria-pressed={!muted}>
        {muted ? "sound · off" : "sound · on"}
      </button>
      <button type="button" className="explosion-btn explosion-btn-mode" onClick={backToSelect} disabled={!supported}>
        switch mode
      </button>
    </div>
    <p className="explosion-hint">
      {active?.hint ?? ""} · m switches modes
    </p>
  </>
) : null}
```

The outer structure is `<div className="explosion-field" data-mode={dataMode}>` containing `<header className="explosion-hero">`, `<div className="explosion-room">{renderStage()} {controls+hint}</div>`, and a techniques list.

### web/explosion-luna.css — room, stage, HUD, controls (verbatim)

```css
.explosion-room {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.explosion-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 11;
  min-height: 320px;
  overflow: hidden;
  border: 1px solid var(--ink-line);
  border-radius: 10px;
  cursor: crosshair;
  touch-action: manipulation;
  background:
    radial-gradient(circle at 50% 45%, rgba(228, 166, 105, 0.24), transparent 34%),
    linear-gradient(140deg, #1a2830, #131f26 66%, #221a11);
}

.explosion-stage::before { /* faint grid overlay, z-index 1, pointer-events: none */ }

/* Canvas is appended by the mode code — fills the stage, under the grid + HUD. */
.explosion-stage canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.explosion-stage:focus-visible {
  outline: 2px solid var(--ink-accent-bright, #e4a669);
  outline-offset: 2px;
}

.explosion-hud {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 2;
  max-width: calc(100% - 24px);
  pointer-events: none;
}

.explosion-hud-line {
  display: inline-block;
  padding: 4px 9px;
  border: 1px solid var(--panel-line-soft);
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.03em;
  line-height: 1.45;
  color: var(--ink-muted);
  background: rgba(11, 19, 23, 0.55);
  backdrop-filter: blur(2px);
  white-space: normal;
  overflow-wrap: anywhere;
}

.explosion-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.explosion-btn {
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--panel-line);
  border-radius: 7px;
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  text-transform: lowercase;
  color: var(--ink-text);
  background: rgba(238, 234, 224, 0.04);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.explosion-btn:hover:not(:disabled) {
  border-color: var(--ink-accent, #d39b61);
  color: var(--ink-accent-bright, #e4a669);
  background: rgba(211, 155, 97, 0.08);
}

.explosion-btn:focus-visible {
  outline: 2px solid var(--ink-accent-bright, #e4a669);
  outline-offset: 2px;
}

.explosion-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

### web/explosion-luna.css — the ≤640px mobile block (verbatim)

```css
@media (max-width: 640px) {
  .explosion-field { gap: 20px; }

  .explosion-stage {
    aspect-ratio: 3 / 4;
    min-height: 0;
  }

  .explosion-hud {
    top: 8px;
    left: 8px;
    right: 8px;
    max-width: none;
  }

  .explosion-hud-line {
    font-size: 0.68rem;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .explosion-controls { gap: 8px; }

  .explosion-btn {
    flex: 1 1 auto;
    min-height: 44px;
    min-width: 88px;
  }
}
```

The HUD line text can wrap on mobile and spans the stage's top width, so the top edge is visually busy on phones.

## Your freedom

You own the design: which corner/edge, the chip's look (icon + label vs label-only, hover/idle states, translucency), and the DOM strategy (restructure into a stage wrapper with an absolutely-positioned sibling overlay vs a guarded child of the stage — argue briefly, one wins). Discoverability is the point: it should read as "this canvas has a mode switch in it", not as clutter. If you add an inline SVG icon, keep it minimal (stroke style, ~1.5 stroke width, 48 viewBox like the page's other icons).

## Output format

1. **Decision** — ≤120 words: placement + DOM strategy, and why it beats the alternatives given the constraints.
2. **Changes** — numbered list; each change = `File: <path>` + an unambiguous replace/insert anchor quoting the excerpts above + the COMPLETE new code in a fenced block (full JSX/CSS blocks, no diffs, no ellipses, no placeholders). Include every touched block even if small.
3. **Integration notes** — what to double-check when integrating (event flow, mobile 390 layout, focus/keyboard, test-suite interactions).
