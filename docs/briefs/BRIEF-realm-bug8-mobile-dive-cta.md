# BRIEF-realm-bug8-mobile-dive-cta — Bug 8: "Dive In" CTA clipped on mobile deep mode for some projects

You have **full autonomy** over the design and code choices in this task. Do not ask for approval and do not end with "option A or B — tell me which" — decide, commit to one design, and deliver it in ONE response. What is required from you is depth: work through the reasoning protocol in section 4 and SHOW the deliberation, then deliver exact code edits.

---

## 1. The product and the mobile panel (self-contained context; you cannot see the repo)

React 19 + TypeScript + Vite portfolio shell. The landing page offers an opt-in immersive layer — "the deep" (realm mode): a full-screen WebGL scene with 7 creatures, one per portfolio project. Selecting a creature (tap, legend button "door — <title>", or key) opens a project **panel**: on mobile (≤520px) it is a **bottom sheet** — a full-width dark sheet occupying the bottom 48% of the visible viewport, with an absolutely-positioned close X (top-right), and an inner scrollable body.

Panel DOM (React, `portfolio/shell/src/shell/RealmMode.tsx`, current lines ~1500–1560):

```tsx
      <div ref={panelRef} className="realm-panel" role="document" data-side={side ?? undefined}>
        {opened && phase !== "leaving" ? (
          <button ref={panelCloseRef} type="button" className="realm-panel-close"
            aria-label="close" onClick={closePanel}> <svg …/> </button>
        ) : null}
        {opened ? (
          <div key={opened.id} className="realm-panel-body">
            <p className="realm-panel-eyebrow">{opened.eyebrow}</p>
            <h2 className="realm-panel-title">{opened.title}</h2>
            <p className="realm-panel-desc">{opened.description}</p>
            <ul className="realm-panel-tech">
              {opened.technologies.map((t) => <li key={t} className="realm-panel-chip">{t}</li>)}
            </ul>
            {opened.links && opened.links.length > 0 ? (
              <div className="realm-panel-links">
                {opened.links.map((l) => <a … className="realm-panel-link">{l.label}</a>)}
              </div>
            ) : null}
            <button type="button" className="realm-panel-dive" onClick={() => confirmDive(opened.id)}>
              dive in →
            </button>
          </div>
        ) : null}
      </div>
```

(The close button is a direct child of the stationary wrapper, before the body; only the `.realm-panel-body` scrolls.)

## 2. Confirmed diagnosis (measured by the integrating agent — trust it, but check your design against every number)

Owner report: on mobile, in deep mode, the "dive in" button is sometimes clipped/hidden when viewing a project description block; expected fully visible without scrolling within the description block. Owner hints at reducing padding/margins in the description block.

Reproduced headlessly (Playwright WebKit ≈ Safari) at 390×725 (realistic iPhone Safari **visible** viewport — the layer tracks the visible viewport; Safari's toolbars make it smaller than the screen) with the real device's **34 px** bottom safe-area inset emulated (the established technique of the existing r9 d2 gate). Per-door measurements, panel open, body scrollTop = 0:

| door | sheet h | padTop | padBottom | body overflow (px) | CTA visible without scroll |
|---|---|---|---|---|---|
| Raft Cluster | 348 | 64px | 56.4px | 0 | yes |
| **Cat Runner** | 348 | 64px | 56.4px | **45** | **NO (clipped)** |
| **Explosion** | 348 | 64px | 56.4px | **38** | **NO** |
| **Spine** | 348 | 64px | 56.4px | **10** | **NO** |
| **Evening Forest** | 348 | 64px | 56.4px | **32** | **NO** |
| Planck to Now | 348 | 64px | 56.4px | 0 | yes |
| Practice Map | 348 | 64px | 56.4px | 0 | yes |

At 390×844 with the same 34px inset, NO door overflows (the sheet is 57px taller) — the clipping is viewport-height dependent, which matches the owner's "sometimes". Causal chain:

1. `.realm-panel` (mobile media query) is `height: 48%` of the visible viewport with `padding: 4rem 1.3rem calc(1.4rem + env(safe-area-inset-bottom, 0px))`.
2. The **4rem (64px) top padding** exists to clear the absolutely-positioned close button (`.realm-panel-close`: `top: 1rem; right: 1rem; width/height: 2rem` — needs ~56px of clearance, so ~48px would do); the bottom padding reserves 1.4rem + the 34px device inset. At a 348px sheet, padding eats 120px of it — the content box is ~228px.
3. The `.realm-panel-body` is the inner scroll container (`overflow-y: auto`, flex column, children `flex-shrink: 0`). When the copy (eyebrow/title/desc/chips/links/CTA) exceeds ~228px, the last element — the dive CTA — lands below the fold: visible only after scrolling the body. Long-copy projects (4 of 7) clip; short-copy ones don't. "Sometimes" = per copy length × device visible height.
4. This predates the previous CTA pass (n203): that pass removed the desktop `margin-top:auto` pin so the CTA follows the content when there is free space; the overflow case (no free space → CTA below the fold) was never addressed.

**Root cause:** on mobile the sheet's fixed 48% height minus oversized paddings cannot always hold the full copy + CTA, and the CTA lives at the END of the scroll flow — so any overflow pushes exactly the most important control out of view.

## 3. The laws you must reconcile (load-bearing prior decisions)

1. **n203 law (desktop):** "dive CTA follows the content — not pinned to the panel bottom" — probe gate at `realm-probe.mjs:637-649`, runs at 1440×900 with explosion (short copy, no links): asserts `btn.top - prev.bottom` in `[0, 48]` AND `panel.bottom - btn.bottom > 120`. It is a DESKTOP gate; a mobile-media-query-scoped change cannot break it, but a global structural change would. Reconcile, don't regress.
2. **r9 law:** the panel wrapper is a **stationary frame**; only the inner body scrolls; the close X must not move while the copy scrolls beneath it (iOS sheet-scroll bug). Probe gates `r9 d2: sheet copy scrolls in the body…` (1153-1159) and `r9 d2: dive action reachable above the safe-area padding` (1172-1173, asserts gap `panel.bottom - dive.bottom > 30` after scrolling to the very bottom, with the +34px inset emulation), plus the emulation cleanup at 1174-1178. NOTE: the body-scroll gate's premise is that the copy CAN overflow — if your design eliminates overflow entirely for all projects at all probed viewports, that gate loses its premise and must be re-thought; if the copy can still overflow (e.g. shorter viewports), it stays as is.
3. **r13 mobile law:** the bottom-sheet geometry (`top: 52%; height/max-height: 48%`) is coupled to a JS constant: `realm-scene.ts:142` → `const CHROME = { hudD: 64, capD: 64, hudM: 56, sheetTopM: 0.52, padM: 8 }`, used at 384-385 and 1476-1477 (`bandBot = small ? vh * CHROME.sheetTopM - CHROME.padM : vh - CHROME.capD`) to keep the selected creature's greeting core clear of the sheet. Probe gates `r13 mobile: sheet keeps its r9 geometry regardless of side` (1192-1200, asserts sheet top ≈ `innerHeight * 0.52` ±6px) and `r13 mobile: frame lifts door 7's core above the sheet` (1201-1209). If you change the sheet height/line, the JS constant and these gates must change IN SYNC — allowed, but it is a bigger blast radius; prefer designs that don't move the sheet line.
4. **Realm visual laws:** no blur/box-shadow anywhere in the realm (hairlines carry edges); the panel bg is `#04080b`; the solid accent (`--ink-accent-bright`) is reserved for the CTA; `env(safe-area-inset-bottom)` must keep being respected at the sheet bottom.
5. **A11y:** the panel is `role="document"` in a `role="dialog"` layer; DOM order close → content → CTA; focus lands on the close X when the panel opens; the CTA must remain one Tab stop away in order, and must never be `display: none` while the panel is open.

## 4. Reasoning protocol (SHOW this in your answer)

1. **Restate** the failure mechanism with the measured numbers (which doors, how many px).
2. **Enumerate the design candidates** — at least 3, e.g. (yours to judge, not a menu): mobile-scoped spacing/type tightening; a mobile-scoped always-visible CTA region (inside the stationary wrapper, below the scrolling body); a `position: sticky` CTA inside the scroll body (follows content when the copy fits, pins when it doesn't); growing the sheet (with the JS coupling); capping/clamping the description text. For EACH candidate: check it against every law in section 3 and against the measured worst case (Cat Runner 45px at 390×725+34px inset; consider also smaller realistic visible heights like ~660px).
3. **Verdict:** one mechanism, justified against every law and the numbers. Honesty beats elegance: if spacing tightening alone provably cannot clear the worst case, say so.
4. **Edge sweep:** for your chosen design walk: short-copy project (Raft Cluster), longest copy (Cat Runner), links-present projects (Evening Forest, Planck to Now), reduced motion, safe-area present vs 0, body scroll still possible (or not) — and what the existing probe gates now assert.
5. **Self-review the diff** for side effects on DESKTOP geometry and on the n203 gate.

## 5. Conventions

- TypeScript/React 19; plain CSS in `portfolio/shell/src/shell/realm.css` (the mobile media query is `@media (max-width: 520px)` at lines 961-1021).
- Keep the file's comment style (`r<N>` law annotations) for anything you add; do not remove or weaken existing comments. The last used realm revision number is **r16** — yours is **r17**.
- Minimal diff. Prefer mobile-media-query-scoped changes over global ones. No new dependencies. No JS changes unless your design genuinely requires them (say why if so).
- Do not write tests — the integrating agent owns the regression gate.

## 6. Output format (the integrating agent will apply this mechanically)

```
## Reasoning
<protocol steps 1–4, compact but complete>

## Design
<the chosen mechanism, 3–6 sentences>

## Edits
<for each edit: file, an OLD block quoted EXACTLY from the current code below, and the NEW replacement; old blocks must be unique substrings so they can be matched mechanically>

## Risks
<side effects, incl. anything the integrating agent should add a probe assertion for>
```

## 7. The code you may change (exact current source)

### 7a. `realm.css:699-735` — the panel wrapper (base)

```css
.realm-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: calc(100% - min(30rem, 92%));
  z-index: 70;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(30rem, 92%);
  height: 100%;
  min-height: 0;
  max-height: 100%;

  padding: 4rem 1.3rem calc(1.4rem + env(safe-area-inset-bottom, 0px));
  background: #04080b;
  border: 0;
  border-left: 1px solid var(--ink-line);

  overflow: hidden;
  cursor: auto;

  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: none;
  animation: none;
  transition: none;
}
.realm-panel.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: opacity 0.28s ease;
}
```

### 7b. `realm.css:768-790` — the inner scroll body

```css
.realm-panel-body {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
  overflow-wrap: anywhere;
  scrollbar-width: thin;
  scrollbar-color: var(--ink-line) transparent;
}

.realm-panel-body > * {
  flex-shrink: 0;
}

.realm-panel-body::-webkit-scrollbar { width: 7px; }
.realm-panel-body::-webkit-scrollbar-thumb { background: var(--ink-line); }
.realm-panel-body::-webkit-scrollbar-track { background: transparent; }
```

### 7c. `realm.css:830-854` — the close X (absolute, top 1rem, 2rem box)

```css
.realm-panel-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  box-sizing: border-box;
  width: 2rem;
  height: 2rem;
  padding: 0;
  display: grid;
  place-items: center;
  font-family: var(--mono);
  font-size: 1rem;
  color: var(--ink-muted);
  background: transparent;
  border: 1px solid var(--ink-line);
  border-radius: var(--panel-radius);
  cursor: pointer;
  transition: border-color 0.15s linear, color 0.15s linear;
}
.realm-panel-close:hover,
.realm-panel-close:focus-visible {
  outline: none;
  border-color: var(--ink-accent);
  color: var(--ink-text);
}
```

### 7d. `realm.css:856-944` — the content blocks and the CTA (base, shared with desktop)

```css
.realm-panel-eyebrow {
  margin: 0 0 0.4rem;
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: lowercase;
  color: var(--ink-accent-bright);
}
.realm-panel-title {
  margin: 0 0 0.7rem;
  font-family: var(--sans);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.15;
  color: var(--ink-text);
}
.realm-panel-desc {
  margin: 0 0 1.1rem;
  font-family: var(--sans);
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--ink-muted);
}

.realm-panel-tech {
  list-style: none;
  margin: 0 0 1.1rem;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.realm-panel-chip {
  font-family: var(--mono);
  font-size: 0.64rem;
  letter-spacing: 0.03em;
  text-transform: lowercase;
  color: var(--ink-faint);
  padding: 0.22rem 0.5rem;
  border: 1px solid var(--ink-line-soft);
  border-radius: var(--panel-radius);
}

.realm-panel-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.3rem;
}
.realm-panel-link {
  font-family: var(--mono);
  font-size: 0.72rem;
  text-transform: lowercase;
  color: var(--ink-muted);
  text-decoration: none;
  border-bottom: 1px solid var(--ink-line);
  padding-bottom: 1px;
  cursor: pointer;
  transition: color 0.15s linear, border-color 0.15s linear;
}
.realm-panel-link:hover,
.realm-panel-link:focus-visible {
  outline: none;
  color: var(--ink-accent-bright);
  border-color: var(--ink-accent);
}

.realm-panel-dive {
  align-self: flex-start;
  font-family: var(--mono);
  font-size: 0.76rem;
  text-transform: lowercase;
  padding: 0.5rem 0.9rem;
  color: var(--ink-bg); /* near-black text on the one solid element */
  background: var(--ink-accent-bright);
  border: 1px solid var(--ink-accent-bright);
  border-radius: var(--panel-radius);
  cursor: pointer;
  transition: background-color 0.15s linear, border-color 0.15s linear;
}
.realm-panel-dive:hover {
  background: var(--ink-accent);
  border-color: var(--ink-accent);
}
.realm-panel-dive:focus-visible {
  outline: none;
  background: var(--ink-accent);
  border-color: var(--ink-accent-deep);
}
```

### 7e. `realm.css:960-1021` — the mobile media query (the sheet geometry lives here)

```css
/* ── mobile: swipeable legend strip + bottom-sheet panel ────── */
@media (max-width: 520px) {
  /* the layer covers only the VISIBLE viewport (tracked by the effect's
     --realm-visible-* properties): Safari's layout viewport includes the
     area behind the floating URL bar, which pushed the sheet's bottom:0
     below the visible bottom and its top edge to mid-screen. */
  .realm-layer {
    top: var(--realm-visible-top, 0px);
    bottom: auto;
    height: 100vh;
    height: 100dvh;
    height: var(--realm-visible-height, 100dvh);
  }

  .realm-layer .realm-panel {
    top: 52%;
    right: 0;
    bottom: 0;
    left: 0;

    box-sizing: border-box;
    width: 100%;
    height: 48%;
    min-height: 0;
    max-height: 48%;

    padding: 4rem 1.3rem calc(1.4rem + env(safe-area-inset-bottom, 0px));
    border: 0;
    border-top: 1px solid var(--ink-line);
  }

  .realm-legend {
    right: calc(1rem + env(safe-area-inset-right));
    max-width: none;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-right: 2rem; /* last door scrolls clear */
    scrollbar-width: none;
  }
  .realm-legend::-webkit-scrollbar { display: none; }
  .realm-legend-btn { flex: 0 0 auto; }

  /* r13: mobile ignores the sheet side — the bottom sheet law stands. */
  .realm-panel[data-side] {
    left: 0;
    right: 0;
    top: 52%;
    height: 48%;
    max-height: 48%;
    width: 100%;
    border-right: 0;
  }

  [data-panel-side] .realm-legend {
    transform: none;
  }

  .realm-caption { display: none; } /* avoids colliding with the strip */

  /* Panel geometry is pinned above; visibility and entrance timing
     inherit the shared persistent-wrapper contract. */
}
```

### 7f. If (and only if) your design moves DOM structure — `RealmMode.tsx:1500-1560` (the panel JSX excerpt in section 1) and, if a new ref or class is needed, the refs block at lines 103-112:

```tsx
  const panelCloseRef = useRef<HTMLButtonElement | null>(null);
```

---

## 8. What the integrating agent owns (NOT you)

The regression gate (a mobile probe loop over ALL 7 doors at device-like geometry: CTA fully visible with body scrollTop = 0, plus the safe-area and desktop laws), all verification runs, and the graph record. If your design implies an additional probe assertion, DESCRIBE it in one or two sentences under `## Risks` — do not write test code.
