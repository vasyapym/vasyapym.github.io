# Brief — Fix mobile input focus auto-zoom (Raft Cluster + Spine)

## Context

A personal portfolio site: React 19 + Vite SPA, one shell + six project pages. Each project page imports its own plain-CSS file. Dark editorial theme throughout. You have NO repo access; this brief contains everything you need.

**Owner report:** on a phone, tapping an input field (or select) to type zooms the page in aggressively; after entering the value the user must manually zoom out to keep navigating.

**Root cause (known, verified):** iOS Safari auto-zooms into any focusable form control (input, select, textarea) whose computed font-size is < 16px at focus time. Both affected projects style their form controls below 16px:

- **Raft Cluster** (`portfolio/projects/raft-cluster/web/raft.css`): controls at `0.85rem`. The shell sets no root font-size, so `1rem` = 16px → controls are 13.6px.
- **Spine** (`portfolio/projects/spine/web/spine.css`): controls at 13px; its narrow-viewport media query bumps them to 14px — still below the threshold. Spine's selects trigger the same zoom (any focusable form control, not just text inputs).

**Scope is exactly these two projects.** Other pages of the site also have form controls, but do NOT propose a shell-wide or global fix.

## Hard constraints

1. `portfolio/shell/index.html` viewport meta MUST stay unchanged (currently `width=device-width, initial-scale=1.0, viewport-fit=cover`). No `maximum-scale`, no `user-scalable=no` — blocking pinch-zoom is an accessibility failure.
2. Spine is Go→WebAssembly: the Go engine binds to inspector elements by id (`spine-f-*`) and rebinds after SPA re-entry via a `spineRebind` hook. Do NOT rename ids, do NOT change the uncontrolled-input architecture. **CSS-only changes strongly preferred for Spine.**
3. Raft Cluster has one text input (`#raft-propose-input`) and one cluster-size select; both are React-controlled — CSS is the only concern. Its buttons, selects and text input share one font rule; note buttons do NOT trigger the zoom — only input/select/textarea do.
4. Desktop appearance: keep the current compact visual language (Spine's inspector is deliberately dense/IDE-like at 13px; Raft's side panel is compact). You decide where 16px applies — but be deliberate and justify the trade-off.
5. No JavaScript. CSS only.
6. Acceptance bar: every focusable text-entry control (input, select) in both projects reaches ≥ 16px computed font-size on touch devices at focus time, while the desktop look is preserved.

## Current code (verbatim, minimal excerpts)

### portfolio/projects/raft-cluster/web/raft.css

```css
/* ---- controls: buttons, selects, inputs ----------------------------------- */

.raft-field button,
.raft-field select,
.raft-field input[type="text"] {
  font: inherit;
  font-size: 0.85rem;
  color: var(--raft-text);
  background: transparent;
  border: 1px solid var(--raft-panel-line);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.raft-field input[type="text"] {
  cursor: text;
  min-width: 0;
  flex: 1 1 auto;
}

.raft-field button:hover:not(:disabled),
.raft-field select:hover {
  border-color: var(--raft-accent);
}

.raft-field button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.raft-field select {
  appearance: none;
  padding-right: 10px;
}
```

The file's only other `@media` blocks: `max-width: 900px` (single-column grid, does not touch controls) and `prefers-reduced-motion`. A bottom block gives `select:focus-visible` / `input[type="text"]:focus-visible` a 2px accent outline — keep working.

### portfolio/projects/spine/web/spine.css

```css
.spine-field label {
  font-size: 12px;
  color: var(--spine-muted);
}

.spine-root select,
.spine-root input {
  color: var(--spine-text);
  border: 1px solid var(--spine-line);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  font-family: inherit;
}

.spine-root input {
  background: var(--spine-bg);
}

/* Native select chrome (the OS bezel gradient + white popup) fights the
   dark theme — reset the appearance and draw a matching flat control with
   a custom chevron instead. */
.spine-root select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: var(--spine-node);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%237d7669' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 26px;
  cursor: pointer;
}

.spine-root select:hover,
.spine-root input:hover {
  border-color: var(--spine-accent);
}

.spine-root select option {
  background: var(--spine-bg);
  color: var(--spine-text);
}

.spine-root select:focus,
.spine-root input:focus,
.spine-root button:focus-visible {
  outline: 2px solid var(--spine-accent);
  outline-offset: 1px;
}
```

And inside the file's final `@media (max-width: 1100px)` block (which reorganizes the three desktop panes into one column with a sticky topbar), the last rules are:

```css
  /* Touch targets: 44px minimum with slightly larger type. */
  .spine-root button,
  .spine-root select,
  .spine-root input {
    min-height: 44px;
    font-size: 14px;
  }

  .spine-root button {
    padding: 10px 12px;
  }
```

## Your freedom

You own the design decision. Candidates you may take or ignore: bump to 16px everywhere; a touch-scoped bump (`pointer: coarse` and/or width media queries); focus-time growth; anything else nonstandard you can argue for. Freedom ends at the hard constraints above.

## Output format

1. **Decision** — ≤150 words: chosen approach and why it beats the alternatives given the constraints.
2. **Changes** — numbered list; each change = `File: <path>` + an unambiguous replace/insert anchor quoting the excerpts above + the COMPLETE new code in a fenced block (full rules, no diffs, no ellipses, no placeholders).
3. **Integration notes** — what to double-check and what to eyeball on desktop + narrow-viewport emulation (both projects' controls, rest + focus, desktop look unchanged).
