# BRIEF — practice-map: the ✕ glyph sits a touch right of center in both overlay close buttons

Fresh context per relay — everything you need is here. **You have full autonomy over every design and code decision** (icon vs glyph, centering mechanism, exact geometry) — make decisions and state them as decisions; do not ask for approval or ask questions; mark genuinely uncertain choices as assumptions. **Reply: condensed reasoning FIRST, then terse deliverable.**

## Reasoning protocol (do this before writing the deliverable)

Show it condensed (≤12 lines):

1. **Success criterion** — one line: what the owner must see on the iPhone in both overlays.
2. **Alternatives** — ≥3 fix directions (invent your own beyond: replace the text glyph with a small inline SVG ✕ drawn from two strokes; keep the glyph but center it deterministically via grid/flex + explicit line-height; pseudo-element rendering). For each: the tradeoff and its most likely failure mode.
3. **Choice** — which direction you commit to and the concrete reason it beats the others.
4. **Edge sweep** — both overlays (lesson reader + concept graph) share one class; the previous iOS fix's law (button lives OUTSIDE the scroll body, panel never scrolls) must survive untouched; keyboard focus ring; hover state; hit target ≥ 40px feel; no regression in the pinned-geometry probe gates.
5. **Self-critique** — the two likeliest ways the fix still renders off-center on iOS Safari specifically, and how your diff covers them.

## Owner bug (verbatim answers to clarifying questions)

> Where: **both overlays** — the lesson reader panel AND the concept-graph panel. Device: **iPhone / iOS Safari** (the same environment as the previous close-X repair). Symptom: "**it is not in center. it is a bit to the right**" — the ✕ glyph inside the close button sits right of its box's center.

## Facts you need (verified in the repo — I ran the probes)

- Both close buttons share one class, `.practice-lesson-close`, and both children are a bare text node: the character `✕` (U+2715 MULTIPLICATION X).
- Headless Chromium (desktop + 390px mobile viewports): geometry is FLUSH everywhere — the button box is exactly at the panel content's top-right in both overlays, and the pinned-geometry probe gates pass. So the owner's "a bit to the right" is about the glyph INSIDE its button box, not the button inside the panel.
- Font stack: `--mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace` — IBM Plex Mono is a Google-Fonts webfont (400;500). The suspected mechanism: per-glyph font fallback — the line box is measured with the primary font, but if U+2715 is missing there the glyph is painted by a fallback font with different side bearings, landing it right of the computed center. iOS Safari resolves the fallback chain differently than desktop browsers, which is why headless can't reproduce and the owner only sees it on the iPhone.
- Previous repair (commit ed3b155) law you must NOT regress: the lesson panel is a stationary frame (never scrolls), the keyed inner body `.practice-lesson-scroll` is the only scroller, and the header close button lives OUTSIDE that scroller. Puppeteer gates assert: panel overflow hidden, close not inside the scroller, close rect unchanged across a scroll.
- Voice of this UI: dark "ink catalogue" — mono, lowercase, 1px borders, no decoration. Whatever you draw must look native next to the existing hairline button.

## Verbatim current code

`PracticeMapPage.tsx` — lesson overlay close (inside the stationary panel's header):

```tsx
          <button
            aria-label="Close lesson"
            className="practice-lesson-close"
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
          >
            ✕
          </button>
```

`PracticeMapPage.tsx` — concept-graph overlay close (same shared class):

```tsx
          <button
            ref={closeRef}
            className="practice-lesson-close"
            type="button"
            aria-label="Close concept graph"
            onClick={onClose}
          >
            ✕
          </button>
```

`practice-map.css`:

```css
.practice-lesson-close {
  flex: 0 0 auto;
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid var(--ink-line);
  color: var(--ink-muted);
  background: transparent;
  cursor: pointer;
  transition: border-color 180ms ease, color 180ms ease;
}

.practice-lesson-close:hover {
  border-color: var(--ink-accent);
  color: var(--ink-accent-bright);
}
```

## Constraints

- Scope: `PracticeMapPage.tsx` (the two close buttons) + `practice-map.css` only. No new files/deps.
- Keep the class name `.practice-lesson-close` (the probes select it) and keep both buttons as real `<button type="button">` with their aria-labels.
- Do NOT touch the panel/scroll structure (the ed3b155 law). No scroll containers, no position changes of the button within the header row.
- The fix must be font-proof: whatever you ship must be geometrically centered regardless of which font paints what (that is the point).
- Minimal diff; the ink look (hairline border, muted→accent hover) stays exactly as is.

## Deliverable (terse, after the reasoning)

1. `COMMITTED:` one line.
2. `BLOCKS:` each change as **verbatim current → verbatim replacement** (JSX for BOTH buttons if they change, plus CSS); I paste directly — be exact.
3. `GATES:` only if an existing probe gate must change (the pinned-geometry gates must keep passing unmodified — say so explicitly if your markup keeps that true).
4. `DEVICE CHECK:` one line for the owner (e.g. "iPhone Safari: ✕ optically centered in its square in both the lesson and the graph overlays").
