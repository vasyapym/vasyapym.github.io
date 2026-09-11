# BRIEF — realm r14: tone down "the same work, beneath the surface" (keep the spirit)

Fresh context per relay — everything you need is here. Full design autonomy; **reply terse**. Small task: one pass, concrete values, no re-architecture.

## Owner report (verbatim)

> "3. 'The same work, beneath the surface' — this is great and I want to keep
> the spirit of it. Just make it a bit more minimalistic in its presentation.
> Please don't change it drastically; the core idea and feel should remain,
> just toned down slightly in visual weight or detail."

## What shipped in r7 and must NOT change (owner-approved structure)

The in-flow threshold section between the hero and the catalogue
(`.realm-threshold.rt-f`): a soft-ended hairline + a rounded lower "abyss"
ground (`#080f12`, `--rt-f-seam`), **no frame** ("keep lines, lose the card" —
owner-rejected any framed/rounded-card follow-through), the two-tone boundary
seam mask `/ enter the deep` (unboxed, 44px, centred on the seam), and the
type pair: Unbounded lowercase headline (desktop 19px / mobile 16px, two lines
crossing) with mono registers `07 works` / `07 doors` after each phrase. Only
"doors" settles 3px upward on reveal (no-preference motion); everything else is
settled by default.

**Your task is typographic/detail toning ONLY.** The seam, the grounds, the
hairlines, the corner radii, the button geometry, the reveal law, and the
aria-label stay exactly as they are.

## Verbatim current code

`LandingPage.tsx` (JSX, verbatim):

```tsx
        <section
          ref={realmThresholdRef}
          className="realm-threshold rt-f"
          aria-labelledby="realm-threshold-title"
          data-section-reveal=""
        >
          <div className="rt-f-inner">
            <h2
              id="realm-threshold-title"
              aria-label="the same 7 works, beneath the surface — 7 doors into the same catalogue."
            >
              <span className="rt-f-line rt-f-above">
                <span className="rt-f-phrase">the same work,</span>

                <span className="rt-f-register" aria-hidden="true">
                  <span className="rt-f-count">07</span>
                  <span className="rt-f-noun">works</span>
                </span>
              </span>{" "}
              <span className="rt-f-line rt-f-below">
                <span className="rt-f-phrase">beneath the surface.</span>

                <span className="rt-f-register" aria-hidden="true">
                  <span className="rt-f-count">07</span>
                  <span className="rt-f-noun rt-f-doors">doors</span>
                </span>
              </span>
            </h2>

            <button
              ref={realmSectionEnterRef}
              className="realm-threshold-enter"
              type="button"
              onClick={handleRealmEnter}
              disabled={realmOpen}
              aria-label="enter the deep — enter the immersive realm"
            >
              <span className="rt-f-entry-copy">enter the deep</span>
            </button>
          </div>
        </section>
```

`realm.css` (the tone-bearing rules, verbatim):

```css
.realm-threshold.rt-f {
  --ink-abyss: #080f12;
  --rt-f-pad-block: 22px;
  --rt-f-line-height: 28px;
  --rt-f-crossing: 28px;
  --rt-f-half-crossing: 14px;
  --rt-f-seam:
    calc(
      var(--rt-f-pad-block) +
      var(--rt-f-line-height) +
      var(--rt-f-half-crossing)
    );
  margin: clamp(12px, 2vw, 24px) 0 0;
  padding: var(--rt-f-pad-block) clamp(16px, 2vw, 24px);
}
```

```css
.realm-threshold.rt-f h2 {
  color: var(--ink-text);
  font-family: var(--unbounded, "Unbounded"), sans-serif;
  font-size: 19px;
  font-weight: 400;
  line-height: var(--rt-f-line-height);
  letter-spacing: -0.025em;
}
.realm-threshold.rt-f .rt-f-below { margin-top: var(--rt-f-crossing); }
.realm-threshold.rt-f .rt-f-register {
  color: var(--ink-muted);
  font-family: var(--mono, "IBM Plex Mono"), monospace;
  font-size: 12px;
  line-height: 18px;
}
.realm-threshold.rt-f .rt-f-count { color: var(--ink-text); }
.realm-threshold.rt-f .rt-f-noun { color: var(--ink-muted); }
```

```css
@media (max-width: 767px) {
  .realm-threshold.rt-f {
    --rt-f-pad-block: 18px;
    --rt-f-line-height: 26px;
    --rt-f-crossing: 56px;
    --rt-f-half-crossing: 28px;
  }
  .realm-threshold.rt-f h2 { font-size: 16px; letter-spacing: -0.02em; }
  .realm-threshold.rt-f .rt-f-register,
  .realm-threshold.rt-f .realm-threshold-enter { font-size: 11px; line-height: 18px; }
}
```

```css
@media (prefers-reduced-motion: no-preference) {
  .signal-index .realm-threshold.rt-f .rt-f-doors {
    transform: translateY(-3px);
    transition: transform 420ms cubic-bezier(.22, .68, .2, 1);
  }
  .signal-index .realm-threshold.rt-f.is-revealed .rt-f-doors {
    transform: translateY(0);
  }
}
```

Facts you need: the seam mask's vertical geometry is derived from
`--rt-f-line-height`/`--rt-f-half-crossing` (`top: calc(var(--rt-f-line-height)
+ var(--rt-f-half-crossing) − 22px)`) and the lower ground's start from
`--rt-f-seam` — so changing those two variables moves the button/ground with
the type (the math self-aligns; check the derived values stay sensible). The
probe asserts: the section opens the realm, focus returns to
`.realm-threshold-enter`, strip visibility is keyed off the section's bottom
edge, the doors' 3px reveal, and reduced-motion settling.

## Goal

Same idea, lighter presence. Pick concrete values that reduce visual
weight/detail without redesigning: e.g. a smaller/quieter headline, muted
registers, tighter crossing — you decide the combination and the numbers.
**Show the arithmetic for any variable you change** (the seam/ground geometry
derives from `--rt-f-line-height` and `--rt-f-half-crossing`).

## Invariants

- The structure from r7 stays: seam mask, grounds, hairlines, radii, button
  geometry, reveal law, aria-label, lowercase voice.
- Tokens only (`--ink-*`); no new decoration, no color changes to the grounds,
  no blur/glow/loops.
- Mobile (≤767px) and reduced-motion paths keep working; the reveal animation
  law (only "doors" moves) is untouched unless you explicitly tone it too —
  if you do, say so and keep it gated to no-preference.
- The section must still open the realm; focus fallback unchanged; strip
  visibility math (the section's bottom edge) unaffected.

## Deliverable (terse)

1. `COMMITTED: <one-line>` + 3–5 bullets of chosen values with the one-line
   arithmetic for each derived geometry.
2. Replacement blocks (verbatim current → verbatim replacement; CSS only).
3. `PROBE GATES:` — only if an existing gate's body must change (most likely
   none).
4. `OWNER DEVICE CHECK:` — one line.
