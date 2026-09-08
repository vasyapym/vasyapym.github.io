# BRIEF 11 — Landing hero: the 900–1100px band review + one refinement pass

You are the design-and-code specialist for a shipped portfolio landing page.
You cannot see the repository — this brief contains every fact and every line
of code you need. You will decide the design direction yourself and write the
actual implementation; an integrator will drop your code into the repo
verbatim and run the verification gates. Aim to deliver everything in ONE
response — no follow-up rounds are planned.

---

## 1. What the project is

A dark, ink-and-ochre portfolio landing page ("signal index") for a senior
frontend developer. The hero is a full-viewport screen: a live fluid
simulation canvas as the backdrop, an editorial headline panel ("prototypes &
small machines") on the left, and at the bottom a quiet catalogue rail
labelled "beneath the surface" listing 6 of the 7 portfolio projects with a
centred "more ↓" affordance that smooth-scrolls to the full project grid.
Everything is Canvas2D + CSS — no WebGL, no image assets.

The page has been through ~147 recorded design iterations. The current era is
the "ink catalogue": dark ink palette (`#0b1317` background, warm paper text
`#eeeae0`, ochre accent `#d39b61`), IBM Plex Sans/Mono, flat semi-transparent
scrim panels (never blurred), mono type for the rail.

## 2. The task

The last recorded design round ended with this open item, verbatim from the
project log:

> Hero rail finalized: liked the 6-project 3×2 rail + smooth scroll-to-row;
> rejected the unbounded beneath list (7th row broke the 2-row proportions)
> and asymmetric hero padding. Changed: pinnedOrder → raft-cluster, kitty-run,
> explosion, spine, evening-forest; beneath renders slice(0,6) + centered
> 'more' anchor to #projects (mobile 560px cap: 5 rows + more); --hero-bottom-pad
> measured so header→copy, copy→rail, rail→bottom gaps read equal.
> **Next review: more-row wrapping at 900–1100px.**

Your task is that review, plus (if warranted) the fix — one pass:

1. **Judge** the hero at the 900–1100px viewport band (typical laptop
   widths), including the 2↔3-column transition of the catalogue panel that
   happens between 1100 and 1200px. Evidence is in section 4.
2. **Decide freely.** "Keep as-is" is an acceptable verdict if the evidence
   says the band already reads well — say so and justify it. If you see real
   awkwardness (rhythm, proportion, the more-row's weight/placement, the
   column-count flip, wasted space, vertical rhythm of the panel), design the
   best treatment yourself and implement it.
3. You have full freedom over the design direction within the whitelisted
   code (section 6) and the design laws (section 5). Prefer a change that
   makes the whole band calmer and more intentional over a patch bolted onto
   one symptom.

## 3. How the hero works (facts you must code against)

**Page structure (hero JSX, see 6.2):** a `section.signal-index-hero` styled
by `.signal-index-hero-fluid` — a grid with `grid-template-rows: auto 1fr
auto` and `min-height: 100svh`. Row 1: header (absolutely positioned over the
top; wordmark | email left, catalogue count "07" right). Row 2: the copy
panel (kicker + 3-line headline + note), left-aligned, `max-width:
min(38rem, 100%)`, on a flat scrim. Row 3: the `signal-index-beneath` panel —
the catalogue rail. Behind everything, an absolutely positioned Canvas2D
fluid-simulation canvas (`z-index: 0`, pointer-events: none); the panels sit
on `z-index: 1`.

**The catalogue panel** is itself a grid: `grid-template-columns:
repeat(auto-fit, minmax(320px, 1fr))`, `gap: 0.2rem 2rem`, on a flat scrim
`rgba(9, 15, 18, 0.78)` with a 1px soft border. Children: the full-width
label, six `signal-index-beneath-row` anchors (44px min-height, flex,
mono 0.76rem), then the `signal-index-beneath-more` anchor
(`grid-column: 1 / -1; justify-self: center`), then a hidden rule span.

**The "more" affordance:** always a centred full-width row under the grid.
The arrow nudges down 3px on hover. With exactly 6 projects the list already
shows everything, so a `data-more-mobile-only` attribute hides it ≥561px.
**This site currently has 7 projects**, so the attribute is absent and the
more row shows at every viewport. The row cap is `projects.slice(0, 6)` in
JSX — the 7th project is reachable only by scrolling to `#projects`.

**Symmetric rhythm (JS):** a `settle()` effect measures the header→copy gap
once and sets `--hero-bottom-pad` so header→copy, copy→rail and rail→bottom
gaps read equal (closed-form, no-op when settled; re-runs on resize and after
fonts load; gated to `min-width: 561px`).

**Breakpoints that exist:**
- `min-width: 561px` — more-row padding bump + hides `[data-more-mobile-only]`;
  settle() desktop gate.
- `max-width: 900px` — hero row-gap 2rem (default gap is larger; see 6.1).
- `max-width: 899px` — project card grid below becomes single column.
- `max-width: 560px` — mobile header compaction (not in your whitelist).
- `prefers-reduced-motion: reduce` — all motion disabled, colour-only hovers.

**Design history you must not regress:** the owner REJECTED (a) the unbounded
list (a 7th row once broke the panel's 2-row proportions — hence the cap),
(b) asymmetric hero padding, (c) viewport-filling display type (type is
deliberately editorial, the fluid carries the impression). The owner LIKED
the 6-row cap + centred more affordance + symmetric rhythm. The 3×2
arrangement of the catalogue at desktop widths is the approved rhythm.

## 4. Measured evidence (fresh puppeteer probe, real rendering)

Panel geometry of `.signal-index-beneath` at height-900 viewports:

| viewport | columns | panel width | panel height | distinct row tops | more-row top |
| --- | --- | --- | --- | --- | --- |
| 900  | 2 | 813px  | 239px | 590 / 637 / 684 (3 rows × 2 cols) | 731 |
| 950  | 2 | 863px  | 239px | 594 / 641 / 688 | 735 |
| 1000 | 2 | 913px  | 239px | 597 / 644 / 692 | 739 |
| 1050 | 2 | 963px  | 239px | 600 / 648 / 695 | 742 |
| 1100 | 2 | 1013px | 239px | 604 / 651 / 698 | 745 |
| 1200 | 3 | 1113px | 192px | 641 / 688 (2 rows × 3 cols)     | 736 |
| 1440 | 3 | 1280px | 192px | 639 / 686                        | 733 |

The more row is always its own full-width centred line (measured horizontal
centre offset from the panel centre: 0px at every width). Six rows wrap
evenly in both column counts — no orphan rows anywhere.

**What the screenshots show (verbal description):**
- At 900–1100px: the copy panel sits upper-left (~415–430px wide); large calm
  fluid field to its right. The beneath panel spans the full content width as
  a 2-column list (01/…, 02/… per row), 3 rows tall, then the small centred
  "more ↓". The panel reads noticeably taller and emptier than at ≥1200px;
  its rows are 47px apart and columns ~370px apart with lots of air between
  item text and the next column.
- At ≥1200px: the panel flips to 3 columns × 2 rows; tighter, shorter
  (192px), reads as the approved "rail".
- The flip itself (crossing ~1130px viewport) swaps the panel height by 47px
  in one step and re-runs the settle math; no jank observed, but the panel's
  proportion change is abrupt.

## 5. Design laws (hard constraints)

1. **Flat scrims only.** Panels are solid low-alpha `rgba()` plates. No
   blur/backdrop-filter, no gradient scrims. If text contrast ever needs
   more, darken the plate (the 0.78 plate exists for exactly that reason).
2. **Contrast.** All text must clear 4.5:1 over its plate. `--ink-muted` =
   rgba(238,234,224,0.68) on the 0.78 plate passes; don't push text fainter
   over the ink.
3. **Touch + keyboard.** Rows keep `min-height: 44px`; `:focus-visible`
   parity with hover is mandatory (colour change at minimum). Reduced-motion
   must kill any new motion (transform/animation) you add.
4. **Voice.** Lowercase mono labels, warm-ochre accents, quiet rails. The
   catalogue is a *quiet corner* — it must not start competing with the
   headline.
5. **No new dependencies, no new files, no JS-added layout thrash.** Prefer
   CSS-only changes; if you touch the settle effect, keep it closed-form and
   no-op-when-settled.
6. **Invariants that must survive your pass:**
   - 6-row cap + a centred more affordance scrolling to `#projects` (smooth,
     reduced-motion-aware — existing handler does this).
   - With exactly 6 projects the more row still disappears ≥561px (keep the
     `data-more-mobile-only` mechanism working).
   - ≥44px row targets, focus parity, 4.5:1 contrast, flat scrims.
   - The approved 3×2 desktop rhythm at ≥1200px (or something you argue is
     strictly better — but the owner liked 3×2, so have a strong reason).
   - No horizontal overflow at 320px; no layout shift from your change
     beyond the intended one.

## 6. Code you may change (complete current state of the whitelisted regions)

Whitelist: `portfolio/shell/src/styles.css` — blocks A, B, C below;
`portfolio/shell/src/shell/LandingPage.tsx` — blocks D, E below. Nothing
else. Available CSS variables (verbatim): `--ink-bg:#0b1317; --ink-text:#eeeae0;
--ink-muted:rgba(238,234,224,0.68); --ink-faint:rgba(238,234,224,0.48);
--ink-line:rgba(238,234,224,0.26); --ink-line-soft:rgba(238,234,224,0.13);
--ink-panel:rgba(238,234,224,0.045); --ink-accent:#d39b61;
--ink-accent-bright:#e8b57c; --ink-accent-deep:#b97f45; --mono:"IBM Plex Mono",
ui-monospace, SFMono-Regular, monospace; --panel-radius` (a small radius).

### 6.A styles.css — `.signal-index-hero-fluid` (grid + rhythm)

```css
/* Fluid hero — a live incompressible-fluid simulation (HeroFluid) is the main
   object, a full-bleed crisp ordered-dithered raster behind the copy. The type
   is pulled back to editorial weight and sits over the ink on a flat (never
   blurred) scrim so contrast holds. Rows: header (absolute) · copy owns the
   centre · the beneath catalogue is a quiet rail at the bottom. --hero-exit
   (set from JS) fades the whole first screen away as it scrolls off. */
.signal-index-hero-fluid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  align-items: stretch;
  min-height: 100vh;
  min-height: 100svh;
  /* Bottom pad is measured from JS (--hero-bottom-pad) so the rail→viewport
     gap equals the header→copy gap; the clamp is the no-JS fallback. */
  padding: clamp(3rem, 5vw, 4.5rem) 0 var(--hero-bottom-pad, clamp(2.5rem, 4vw, 3.5rem));
  isolation: isolate;
  color: #eeeae0;
  opacity: calc(1 - var(--hero-exit, 0));}
```

(The header in this hero is `position: absolute; inset: 0 0 auto 0; z-index: 3`,
the canvas `position: absolute; inset: 0; z-index: 0`, the copy panel
`position: relative; z-index: 1; grid-row: 2; justify-self: start;
align-self: center; max-width: min(38rem, 100%);` on a
`rgba(9, 15, 18, 0.62)` plate. Not reproduced in full; you may reference them
but the whitelist regions below are what you rewrite.)

### 6.B styles.css — the beneath catalogue + more affordance (full block)

```css
/* "beneath the surface" index — a quiet corner rail under the copy, lifted
   over the canvas on its own flat scrim for legibility against the ink. */
.signal-index-hero-fluid .signal-index-beneath {
  position: relative;
  z-index: 1;
  grid-row: 3;
  align-self: end;
  justify-self: stretch;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 0.2rem 2rem;
  padding: 1.1rem clamp(1rem, 2vw, 1.5rem) 0.6rem;
  /* 0.78, not 0.58: brightest ochre dither plumes sit under these rows; the
     heavier flat scrim keeps --ink-muted text above 4.5:1 (pass-22 precedent
     of darkening a panel to compensate a removed effect). */
  background: rgba(9, 15, 18, 0.78);
  border: 1px solid var(--ink-line-soft);
  border-radius: var(--panel-radius);}


.signal-index-beneath-label {
  grid-column: 1 / -1;
  margin-bottom: 0.5rem;
  font-family: var(--mono);
  font-size: 0.64rem;
  letter-spacing: 0.28em;
  text-transform: lowercase;
  color: var(--ink-accent);}


.signal-index-beneath-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.3rem 0;
  font-family: var(--mono);
  font-size: 0.76rem;
  color: var(--ink-muted);
  text-decoration: none;
  transition: color 200ms ease;}


.signal-index-beneath-row:hover,
.signal-index-beneath-row:focus-visible { color: var(--ink-text); }
.signal-index-beneath-row span { color: var(--ink-faint); }
.signal-index-beneath-row strong { font-weight: 500; }
.signal-index-beneath-rule { display: none; }


/* "more ↓" — the overflow affordance when the catalogue exceeds the 6-row
   cap (all viewports). Always a centred full-width row under the grid — the
   downward arrow says the rest of the catalogue lives below the fold. With
   exactly 6 projects the list already shows everything, so the affordance
   retreats to mobile only (data-more-mobile-only). */
.signal-index-beneath-more {
  grid-column: 1 / -1;
  justify-self: center;
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.3rem 0;
  font-family: var(--mono);
  font-size: 0.76rem;
  color: var(--ink-muted);
  text-decoration: none;
  transition: color 200ms ease;}


.signal-index-beneath-more:hover,
.signal-index-beneath-more:focus-visible { color: var(--ink-text); }

.signal-index-beneath-more span {
  display: inline-block;
  transition: transform 200ms ease;}

.signal-index-beneath-more:hover span,
.signal-index-beneath-more:focus-visible span {
  transform: translateY(3px);}


@media (min-width: 561px) {
  .signal-index-beneath-more {
    padding: 0.3rem 0.75rem;}

  .signal-index-beneath-more[data-more-mobile-only] {
    display: none;}
}
```

### 6.C styles.css — the 900px hero gap block

```css
@media (max-width: 900px) {
  .signal-index-hero-fluid {
    gap: 2rem;
  }}
```

(The default `gap` of `.signal-index-hero-fluid` is the initial `normal` —
row-gap `normal` behaves like `0` here; vertical rhythm comes from the
padding + align-self: center. The 900px block introduces the 2rem row gap.)

### 6.D LandingPage.tsx — the settle effect (full block)

```tsx
  // Symmetric hero rhythm (desktop): the copy panel is centred in the free
  // middle row, so its top gap grows with the viewport while the bottom rail
  // keeps a fixed padding — top and bottom never match by accident. Here the
  // header→copy gap is measured once and the hero's bottom padding is set to
  // the same value, so header→copy, copy→rail and rail→viewport-bottom all
  // read equal at any desktop height. The copy re-centres when the padding
  // changes; the measured-gap + current-pad pair solves that feedback in one
  // closed-form step, and re-running it after that is a no-op.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) {
      return;
    }

    let cancelled = false;
    const desktop = window.matchMedia("(min-width: 561px)");

    const settle = () => {
      if (cancelled || !desktop.matches) {
        return;
      }
      const header = hero.querySelector<HTMLElement>(".signal-index-header");
      const copy = hero.querySelector<HTMLElement>(".signal-index-hero-copy");
      if (!header || !copy) {
        return;
      }
      const gap =
        copy.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
      if (gap <= 0) {
        return;
      }
      const currentPad = parseFloat(getComputedStyle(hero).paddingBottom);
      const free = gap + currentPad / 2;
      const pad = Math.max(16, (2 / 3) * free);
      hero.style.setProperty("--hero-bottom-pad", `${pad.toFixed(1)}px`);
    };

    settle();
    // Late settles: webfonts reflow the copy/beneath heights, and browser
    // resize (incl. crossing the 561px gate) re-runs the same no-op-when-
    // settled math.
    const t1 = window.setTimeout(settle, 300);
    document.fonts?.ready.then(() => {
      if (!cancelled) {
        settle();
      }
    });
    window.addEventListener("resize", settle);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.removeEventListener("resize", settle);
    };
  }, []);
```

### 6.E LandingPage.tsx — the hero JSX (full block, inside `return`)

```tsx
  return (
    <main ref={pageRef} className="signal-index">
      <div className="signal-index-shell">
        <section
          ref={heroRef}
          className="signal-index-hero signal-index-hero-fluid"
          aria-labelledby="signal-index-title"
        >
          <header className="signal-index-header">
            <div className="signal-index-identity">
              <a className="signal-index-wordmark" href="/">
                <span className="signal-index-mark" aria-hidden="true" />
                Vasily Argounov
              </a>
              <span className="signal-index-identity-divider" aria-hidden="true">|</span>
              <a className="signal-index-contact" href="mailto:vasyapym@gmail.com">vasyapym@gmail.com</a>
            </div>
            <span className="signal-index-count">{projects.length.toString().padStart(2, "0")}</span>
          </header>

          <HeroFluid />
          <div className="signal-index-hero-copy">
            <p className="signal-index-hero-kicker">currents</p>
            <h1
              id="signal-index-title"
              className="signal-index-hero-headline"
              aria-label="prototypes & small machines"
            >
              <span className="signal-index-hero-line" aria-hidden="true">
                <span className="signal-index-hero-line-in">prototypes</span>
              </span>
              <span className="signal-index-hero-line" aria-hidden="true">
                <span className="signal-index-hero-line-in">
                  <span className="signal-index-hero-amp">&amp;</span> small
                </span>
              </span>
              <span className="signal-index-hero-line" aria-hidden="true">
                <span className="signal-index-hero-line-in">machines</span>
              </span>
            </h1>
            <p className="signal-index-hero-note">
              stable-fluids&nbsp;· ordered-dither&nbsp;· canvas2d&nbsp;· no webgl
            </p>
          </div>
          <div className="signal-index-graphic signal-index-beneath">
            <span className="signal-index-beneath-label">beneath the surface</span>
            {projects.slice(0, 6).map((project, index) => (
              <a
                className="signal-index-beneath-row"
                href={`#project-${project.id}`}
                key={project.id}
                onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                    event.preventDefault();
                    animateScrollToAnchor(`project-${project.id}`);
                  }
                }}
              >
                <span>
                  {String(index + 1).padStart(2, "0")}
                  {project.tag ? ` / ${project.tag}` : ""}
                </span>
                <strong>— {project.title}</strong>
              </a>
            ))}
            {projects.length > 5 && (
              <a
                className="signal-index-beneath-more"
                href="#projects"
                data-more-mobile-only={projects.length === 6 ? "" : undefined}
                onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                    event.preventDefault();
                    animateScrollToAnchor("projects");
                  }
                }}
              >
                more <span aria-hidden="true">↓</span>
              </a>
            )}
            <span className="signal-index-beneath-rule" />
          </div>
        </section>
```

(The section closes after this; the project grid follows. `animateScrollToAnchor`
already respects `prefers-reduced-motion`. Imports already present:
`useEffect, useRef, useState, type CSSProperties, type MouseEvent` from react.)

## 7. Output format (follow exactly)

Answer in three parts:

**PART 1 — VERDICT.** Either `KEEP` (band is sound; explain why in ≤10
sentences, referencing the evidence) or `REFINE` (state the specific
awkwardness you are fixing and the design intent of your treatment, ≤15
sentences).

**PART 2 — CHANGES.** Only if `REFINE`. For each edit, give:
- `FILE:` the file path.
- `REPLACE-FROM:` the exact first line of the region being replaced (copy it
  verbatim from section 6 — comments count as lines).
- `REPLACE-TO:` the exact last line of the region being replaced (verbatim).
- `WITH:` the COMPLETE replacement text. No diffs, no `...`, no "unchanged"
  — the integrator pastes this verbatim over the region.

Keep the number of regions small (ideally 1–3). Never reference a region
outside the section-6 whitelist.

**PART 3 — INVARIANTS.** A short checklist confirming each item of section 5
law 6 still holds after your change (or explicitly why an item no longer
applies).

Size discipline: the whole response should stay under ~250 lines of code.
Design for the band, not the universe — this is a refinement pass, not a
redesign.

## 8. How this will be verified (integrator-side, for your awareness)

TypeScript strict compile + Vite production build, then a headless-Chrome
probe at 900/950/1000/1050/1100/1200/1440 × 900h and 390×844: panel column
count, panel height, row/more geometry, centre offset, plus screenshots
compared against today's evidence in section 4. A pass that regresses mobile
(≤560px), the ≥1200px rail, or keyboard/reduced-motion parity will be
rejected.
