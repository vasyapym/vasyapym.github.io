# BRIEF — realm r7: the threshold keeps its lines, loses the card

Relay brief for the chat model. You have **full design and code autonomy** inside the
pinned contract below — no approval gates, no clarifying questions. Commit to one
design and one code block. The only thing we require is that your reasoning is shown
in full before the deliverable, at the depth specified in §2.

---

## 1. Situation

The landing page (portfolio shell) has an in-flow section between the hero and the
project cards. It is the entry into "the deep" (an immersive realm). It shipped as
**"the same seven"** (pass C) and looked like this:

- a **full-width band** inside the page's centered shell (same width as the hero
  content and the card grid — the shell is `width: min(100% - 72px, 1280px)`,
  centered; the band spans it exactly);
- **no frame**: no left/right/bottom borders. The band is defined by **lines**:
  a 1px hairline across the top (boundary against the hero), and a second 1px
  hairline across the middle (the "seam") that is interrupted on the right by the
  entry control `/ enter the deep`;
- two text lines in Unbounded 19px lowercase: "the same work,  07 works" above the
  seam on the page background, "beneath the surface.  07 doors" below the seam on a
  locally darker ground (`#080f12`, "abyss");
- compact (~129px tall desktop, ~145px mobile), left-aligned, quiet.

**Owner verdict history (three rounds, all about the same thing):**

1. "make its corners rounded like it is in product card and hero section. so that it
   would be consistent" — the cards and hero rail are rounded (20px) panels.
2. Two integration passes then wrapped the band in a **full border frame with all
   four corners rounded** — a closed card. Owner rejected: *"it should be the same
   size in width as hero section and project cards' section"* (width was fixed to
   span the shell exactly — keep that) and then: *"i explicitly told you to [not]
   make it rectangular. i wanted to have 'free' feel because it wasnt rectangular
   but lines but only with their top and bottom ones having rounded corners. right
   now it doesn't look compact and minimalistic. it looked compact and minimalistic
   before."*

**The design problem, in one sentence:** keep the pass-C reading — a quiet band
defined by lines, open sides, compact and minimal — and reconcile it with the
card/hero rounding language by rounding **only the top and the bottom corners**,
without ever letting the band read as a bordered box.

How "rounded corners on top and bottom" should physically manifest is **yours to
decide** (e.g. the top hairline softening into the page at its ends; the lower
ground's silhouette curving; something better we didn't think of). The failure mode
to avoid is the closed frame you are replacing. The success mode is: a visitor
glancing at the band thinks "lines that end softly", not "another card".

## 2. Reasoning protocol (mandatory, shown in your reply)

Work in this exact order and show each phase in full. Depth here is the deliverable's
quality bar — superficial output will be rejected.

1. **Restate** the design problem in your own words, including the tension between
   "rounded like the cards" and "must not read as a card".
2. **Generate wide:** at least **5 materially distinct directions** for how the band
   takes its rounded top/bottom corners while keeping the lines/free/compact
   reading. Distinct means: different mechanisms, not one idea with five tweaks.
   Sketch each in 2–4 sentences (structure + what the eye sees).
3. **Prune in the open:** kill directions against explicit criteria — the design
   laws (§4), compactness (~129px band must not grow meaningfully), minimality
   (fewer marks beats more marks), the free feel (open sides), and the accumulated
   bans. Say why each one dies. Keep the strongest 1–2.
4. **Develop to depth:** for the survivor(s), state **every concrete value** —
   geometry, radii, where each line starts/stops, pseudo-element structure, exact
   CSS — with a one-line why for each number. No placeholders, no "adjust to taste".
5. **Stress-test:** walk the survivor through every scenario in §6 and name what
   could break and why it doesn't.
6. **Rank and commit:** one paragraph, then the final deliverable. You decide — do
   not end with options, do not ask for approval.

## 3. Pinned contract (non-negotiable)

- **CSS-only.** The section's markup and classes are pinned by a 39-gate probe; you
  replace one CSS block and nothing else. Available hooks: the section element
  `.realm-threshold.rt-f`, its `::before` (currently the lower ground), its
  `::after` (currently unused), and any child class listed in the markup below.
- **Width:** the section spans the page shell exactly (owner-confirmed this round):
  effectively `width: 100%` of the shell, `margin-block` your call, `margin-inline: 0`.
- **The section stays in-flow** with a measurable bottom edge (the fixed entry chip
  appears when scroll passes the section's bottom; hide nothing into fixed/absolute).
- **The entry control stays unboxed** (no button plate): it is the seam interrupt —
  a 44px-tall control centred on the seam whose hard-stop two-tone background
  erases a segment of the seam hairline. Its centering math is var-driven:
  `top: calc(var(--rt-f-line-height) + var(--rt-f-half-crossing) - 22px)` relative
  to `.rt-f-inner` (which starts `--rt-f-pad-block` below the section top; the seam
  sits at `pad-block + line-height + half-crossing`). The 22px in the gradient
  hard-stop equals half the 44px button height — keep that pair consistent if you
  touch sizes. If you keep the var names, the math stays self-consistent.
- **Disabled law (r6):** when the realm is open, the entry is `disabled` but stays
  full-strength (opacity 1, visible, no dim) — unavailability is semantic; the
  realm's own exit envelope owns any visual change.
- **Reduced motion:** the only motion is the "doors" noun settling 3px on reveal;
  reduced = settled by default. Don't add motion; if your design moves anything,
  it must be settled-by-default and reduced-inert.
- **The `--ink-abyss: #080f12` local override** (darker ground of the band's lower
  zone) exists because the global abyss `#020609` is reserved for the realm/floor —
  keep the band's ground inside the r4-tuned value or argue a better local value.

## 4. Design laws (the household style — violations reject the work)

- `--ink-*` tokens only: `--ink-bg #0b1317`, `--ink-text #eeeae0`,
  `--ink-muted rgba(238,234,224,.68)`, `--ink-faint rgba(238,234,224,.48)`,
  `--ink-line rgba(238,234,224,.26)`, `--ink-line-soft rgba(238,234,224,.13)`,
  `--ink-accent #d39b61`, `--ink-accent-bright #e8b57c`, `--ink-accent-deep #b97f45`,
  `--panel-radius: 20px`. Fonts: `--unbounded` (the two phrases, 19px/400 lowercase,
  16px mobile), `--mono` (chrome: counts, entry control — 12px/18px, 11px mobile).
- Lowercase mono chrome, 1px hairlines only. **No blur, no glow shadows, no soft or
  saturated gradients** (the entry's two-tone hard-stop is the single sanctioned
  exception). Ochre is the only interactive signal. No infinite loops.
- Accumulated bans: diagonal cuts, poster type, fake-data diagrams, slider
  furniture, banner CTA, **boxed/bordered buttons**, shaft+sill compositions,
  stat-card framing, oversized numerals, centered blocks (band stays left-aligned),
  margin-grid composition.

## 5. Section markup (verbatim, pinned)

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

## 6. Current CSS block you are replacing (verbatim)

The deliverable replaces this entire block. Viewport classes: mobile ≤767px
(band ~145px, 390px wide), desktop 1440×900 (~129px), wide 2560×1440 (shell capped
at 1280px, centered — the band spans that, not the viewport).

```css
/* ── in-flow threshold: the same seven — two grounds, one inventory, the entry on the seam ── */
/* f — The same seven */
.realm-threshold.rt-f {
  /* Approved abyss alias, retuned only within this threshold. */
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

  display: block;
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  width: 100%;
  height: auto;
  min-height: 0;
  /* the panel spans the same shell width as the hero and the cards;
     only the vertical rhythm is its own */
  margin: clamp(12px, 2vw, 24px) 0 0;
  padding:
    var(--rt-f-pad-block)
    clamp(1rem, 2vw, 1.5rem);

  border: 1px solid var(--ink-line-soft);
  border-radius: var(--panel-radius);

  background: var(--ink-bg);
  box-shadow: none;
  color: var(--ink-text);

  font-family: var(--sans, "IBM Plex Sans"), sans-serif;
  font-variant-numeric: tabular-nums;
  text-align: left;

  /* The threshold is complete before the reveal callback. */
  opacity: 1;
  transform: none;
  animation: none;
  transition: none;
}

/* One opaque lower material; no fade or tonal ramp. Its bottom corners
   follow the panel frame minus the hairline it sits inside. */
.realm-threshold.rt-f::before {
  content: "";
  display: block;
  position: absolute;
  z-index: 0;
  inset: var(--rt-f-seam) 0 0;
  box-sizing: border-box;

  border: 0;
  border-top: 1px solid var(--ink-line-soft);
  border-bottom-left-radius: calc(var(--panel-radius) - 1px);
  border-bottom-right-radius: calc(var(--panel-radius) - 1px);

  background: var(--ink-abyss);
  opacity: 1;
  transform: none;
  pointer-events: none;
}

.realm-threshold.rt-f .rt-f-inner {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  width: 100%;
}

.realm-threshold.rt-f h2 {
  display: block;
  width: fit-content;
  max-width: 100%;
  margin: 0;
  padding: 0;

  color: var(--ink-text);
  font-family: var(--unbounded, "Unbounded"), sans-serif;
  font-size: 19px;
  font-weight: 400;
  line-height: var(--rt-f-line-height);
  letter-spacing: -0.025em;
  text-align: left;
  text-transform: none;
}

.realm-threshold.rt-f .rt-f-line {
  display: flex;
  align-items: baseline;
  column-gap: 18px;
  width: fit-content;
  max-width: 100%;
  white-space: nowrap;
}

.realm-threshold.rt-f .rt-f-below {
  margin-top: var(--rt-f-crossing);
}

.realm-threshold.rt-f .rt-f-phrase {
  display: block;
  flex: 0 0 auto;
}

.realm-threshold.rt-f .rt-f-register {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: baseline;
  column-gap: 1ch;

  color: var(--ink-muted);
  font-family: var(--mono, "IBM Plex Mono"), monospace;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.realm-threshold.rt-f .rt-f-count {
  display: block;
  color: var(--ink-text);
}

.realm-threshold.rt-f .rt-f-noun {
  display: block;
  color: var(--ink-muted);
}

/*
 * Only the access noun takes depth.
 * Its layout box, the numeral, and both grounds remain stationary.
 */
.realm-threshold.rt-f .rt-f-doors {
  transform: translateY(-3px);
  transition:
    transform 420ms cubic-bezier(.22, .68, .2, 1);
}

.signal-index .realm-threshold.rt-f.is-revealed .rt-f-doors {
  transform: translateY(0);
}

/*
 * The 44px control is centred on the seam.
 * Its hard-stop background exactly matches the two grounds:
 * this erases a segment of hairline, not a visible button plate.
 */
.realm-threshold.rt-f .realm-threshold-enter {
  appearance: none;
  display: flex;
  position: absolute;
  top:
    calc(
      var(--rt-f-line-height) +
      var(--rt-f-half-crossing) -
      22px
    );
  right: 0;
  bottom: auto;
  left: auto;

  box-sizing: border-box;
  align-items: center;
  justify-content: flex-start;
  column-gap: 12px;

  width: max-content;
  min-width: 0;
  height: 44px;
  min-height: 44px;
  margin: 0;
  padding: 13px 8px;

  border: 0;
  border-radius: 0;

  background:
    linear-gradient(
      to bottom,
      var(--ink-bg) 0,
      var(--ink-bg) 22px,
      var(--ink-abyss) 22px,
      var(--ink-abyss) 100%
    );
  box-shadow: none;
  color: var(--ink-accent);

  font-family: var(--mono, "IBM Plex Mono"), monospace;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0;
  text-align: left;
  text-transform: none;
  text-decoration: none;
  white-space: nowrap;

  opacity: 1;
  transform: none;
  transition: none;
  cursor: pointer;
  touch-action: manipulation;
}

.realm-threshold.rt-f .realm-threshold-enter::before {
  content: "/";
  display: block;
  position: static;
  flex: 0 0 auto;
  color: var(--ink-faint);
  line-height: 18px;
}

.realm-threshold.rt-f .rt-f-entry-copy {
  display: block;
  color: inherit;
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 5px;
}

.realm-threshold.rt-f
  .realm-threshold-enter:focus-visible:not(:disabled) {
  outline: 1px solid var(--ink-accent);
  outline-offset: 4px;
  color: var(--ink-accent-bright);
}

.realm-threshold.rt-f
  .realm-threshold-enter:active:not(:disabled) {
  color: var(--ink-accent-deep);
}

/* Unavailability is semantic, not a hidden return destination.
   The realm envelope owns the visual reveal for threshold variants. */
.realm-threshold .realm-threshold-enter:disabled {
  visibility: visible;
  opacity: 1;
  cursor: default;
}

/* Keep both the seam mask and its contents at their resting strength. */
.realm-threshold.rt-f .realm-threshold-enter:disabled {
  opacity: 1;
  cursor: default;
}

.realm-threshold.rt-f
  .realm-threshold-enter:disabled::before,
.realm-threshold.rt-f
  .realm-threshold-enter:disabled
  .rt-f-entry-copy {
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .realm-threshold.rt-f
    .realm-threshold-enter:hover:not(:disabled) {
    color: var(--ink-accent-bright);
  }

  .realm-threshold.rt-f
    .realm-threshold-enter:hover:active:not(:disabled) {
    color: var(--ink-accent-deep);
  }
}

@media (max-width: 767px) {
  .realm-threshold.rt-f {
    --rt-f-pad-block: 18px;
    --rt-f-line-height: 26px;
    --rt-f-crossing: 56px;
    --rt-f-half-crossing: 28px;
  }

  .realm-threshold.rt-f h2 {
    font-size: 16px;
    letter-spacing: -0.02em;
  }

  .realm-threshold.rt-f .rt-f-line {
    column-gap: 14px;
  }

  .realm-threshold.rt-f .rt-f-register {
    font-size: 11px;
    line-height: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .realm-threshold.rt-f .rt-f-doors,
  .realm-threshold.rt-f.is-revealed .rt-f-doors {
    transform: none;
    transition: none;
  }
}
```

## 7. Deliverable

One fenced ```css block: a complete replacement for §6, from the marker comment to
the reduced-motion block inclusive. The **first line must keep the machine marker
prefix verbatim**: `/* ── in-flow threshold:` — you may change the subtitle after
the colon (it ends with ` ── */`). Every rule you drop must be either re-stated or
argued away in your stress-test. After your reasoning chain (§2), end with:
`COMMITTED: <one-line name of the direction>`.

Integration (not your job, for context): the block is spliced into realm.css
between the `/* ── in-flow threshold:` marker and `/* ── fixed strip:`; then the
orchestrator runs the type check, production build, the 39-gate probe (entry
focus, esc chain, strip law at three viewports, reduced-motion pass, console
clean), and screenshots desktop/mobile for the owner.
