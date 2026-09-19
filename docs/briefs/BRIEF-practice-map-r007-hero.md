# Task brief — Practice Map R007, part A: hero rework (new copy + a distinct visual concept)

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design and code choice in this task: do not ask for approval, do not offer option lists. Deliberate in `## Reasoning` before writing any code — depth beats speed; work through §4 before writing anything.

## 0. Where this comes from (context you cannot infer)

"Practice Map" is a page in a dark-ink developer portfolio. It holds an AI-output archive: a left list of 5 AI models (tier rows), a right panel of lesson cards, folder faces, a lesson reader overlay. The page's register: dark swiss archive editorial — lowercase mono chrome, ochre accent over near-black ink, hairline borders, 999px pill controls, `20px` panel radius, film-grain veil over everything.

The hero today (approved in an earlier round, owner has now moved past it) is a **single full-width rounded copy card**: flat scrim, hairline border, ochre left rule, two lines of display type. The owner's verdict on it now: *"polished but generic"*. The owner's asks for this round:

1. Replace the heading with: **"Archive of AI outputs. Not all of these are good."**
2. The hero must **immediately signal that this is an AI experimentation space** — it needs **a distinct concept, not just a layout adjustment**.

History that constrains you: the hero previously hosted an interactive concept-graph rail; it was removed and the owner said "we can do without any new stuff there". That constraint is now **partially lifted** — the owner wants a distinct concept. The reconciliation you must respect: the hero may carry **composed, quiet graphics and typographic structure**, but **no functional or interactive furniture** (no buttons, toys, canvases with interaction, no fake UI chrome that begs to be clicked). Decoration and composition only; the h1 copy stays the spine.

## 1. The page and its laws

React 19 + TypeScript. Fonts: IBM Plex Sans (`--sans`, `--display` — same family) for display/prose, IBM Plex Mono (`--mono`) for chrome. Tokens (defined on the shell root, values verbatim):

```css
--ink-bg: #0b1317;              /* page field */
--ink-text: #eeeae0;
--ink-muted: rgba(238, 234, 224, 0.68);
--ink-faint: rgba(238, 234, 224, 0.48);
--ink-line: rgba(238, 234, 224, 0.26);
--ink-line-soft: rgba(238, 234, 224, 0.13);
--ink-panel: rgba(238, 234, 224, 0.045);
--ink-accent: #d39b61;          /* ochre */
--ink-accent-bright: #e8b57c;
--ink-accent-deep: #b97f45;
--panel-radius: 20px;  --pill-radius: 999px;
```

Layout facts: the page section is `width: min(1200px, calc(100% - 72px))` centered. Inside it, top-to-bottom: a mono kicker line (`playground · 5 models · 29 lessons`), then the hero (`.practice-map-hero`), then the two-column layout (`.pg-layout`, `margin-top: 40px` — left model list / right search + lesson panel). A static film-grain veil (`position: fixed; inset: 0; z-index: 4; opacity: .06; mix-blend-mode: soft-light`) covers the whole viewport including the hero — your graphics live under it; do not try to escape it.

Laws you must not break:

- Lowercase everywhere in the hero (the copy is given in lowercase below; keep `text-transform: lowercase` or set the text lowercase — do not introduce uppercase display type).
- No horizontal overflow at 1440, 1024, 700, 560, 390, 320. The hero must not crowd `.pg-layout` below it (desktop spacing is liked).
- Mobile presence is a settled, liked treatment: at ≤900 and ≤560 the hero must keep deliberate vertical padding and big type — it must read as an intentional heading, not orphaned text. Keep that quality; adapt the numbers if your concept needs different ones, but do not shrink the mobile presence.
- `prefers-reduced-motion` kills all animation — design so the hero is complete without motion. Any motion you add must be a quiet one-shot entrance, never a loop, never load-bearing for meaning.
- Graphics/annotations must be `aria-hidden="true"` and `pointer-events: none` where absolute; the h1 keeps `id="practice-map-title"` and remains the section's labelled heading.
- Do not touch anything outside the hero region: the kicker above, `.pg-layout`, cards, overlays — none of it is yours.
- No template-hero moves: no gradient banners, no glows-for-glow's-sake, no stock "AI" imagery (brains, robots, particle waves), no emoji, no skeleton loaders, no pure decoration that fights the hairline register.

## 2. Current state verbatim (the regions you may change)

### R1 — web/PracticeMapPage.tsx — hero render region (current, complete)

```tsx
        <header className="practice-map-hero">
          <h1 id="practice-map-title">
            archive of ai outputs
            <span>teaching concepts.</span>
          </h1>
        </header>
```

(For orientation, immediately above it in the JSX sits `<p className="pg-kicker">playground · {TIERS.length} models · {…} lessons</p>` — do not change it.)

### R2 — web/practice-map.css — hero rules (current, complete)

```css
/* Hero is now a single full-width copy card (the concept-graph rail moved
   into each lesson card's foot). No grid — the card fills the run. */
.practice-map-hero {
  display: block;
}

/* Copy panel — the .signal-index-hero-copy language (Reference 3): flat scrim,
   soft hairline, ochre-deep left rule, rounded to the shared panel radius. */
.practice-map-hero h1 {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
  padding: clamp(1.05rem, 2vw, 1.55rem) clamp(1.05rem, 2vw, 1.55rem)
    clamp(1.2rem, 2.2vw, 1.7rem);
  background: rgba(9, 15, 18, 0.62);
  border: 1px solid var(--ink-line-soft);
  border-left: 2px solid var(--ink-accent-deep);
  border-radius: var(--panel-radius);
  font-family: var(--display);
  /* Divisor 22→26: the new copy ("archive of ai outputs" = 21 chars) is far
     longer than the old 15-char line, and the hero is now full-width, so a
     slower growth rate keeps both lines inside the band while still reaching
     the 3.2rem cap near 1440. */
  font-size: clamp(1.15rem, calc((100vw - 72px) / 26), 3.2rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 0.98;
  text-transform: lowercase;
  color: var(--ink-text);
}

.practice-map-hero h1 span {
  display: block;
  color: var(--ink-accent-bright);
}

@media (max-width: 900px) {
  /* Full-width single card: keep the headline proportionate to the card,
     not the viewport formula (which undersizes it 561–900). Deliberate
     presence: bigger type + real vertical padding, per R006. */
  .practice-map-hero h1 {
    font-size: clamp(1.7rem, 8vw, 2.7rem);
    line-height: 1.02;
    padding: 1.7rem 1.4rem 1.9rem;
  }
}

@media (max-width: 560px) {
  .practice-map-hero h1 {
    font-size: clamp(1.45rem, 7.4vw, 2.15rem);
    padding: 1.45rem 1.1rem 1.55rem;
  }
}
```

You may restructure both regions entirely (the old comments describe the old concept — rewrite them). If your concept needs new elements in the header JSX or new CSS rules, produce them complete; the orchestrator splices.

## 3. The owner's asks (verbatim, then your working space)

1. *"Replace heading with: 'Archive of AI outputs. Not all of these are good.'"* → the h1's two lines become `archive of ai outputs.` / `not all of these are good.` — which line carries the ochre accent (today: the second) is your call; the trailing periods are part of the copy (the period is a liked treatment in this register).
2. *"The hero currently renders as a polished but generic section. It should immediately signal that this is an AI experimentation space. Needs a distinct concept — not just a layout adjustment."* → this is the heart of the task. Choose ONE distinct concept and carry it through composition, type treatment, and quiet graphics. The concept must say "this page is a living archive of machine outputs under review" without a single interactive element.

## 4. Method — deliberate before you write (required)

Before any code, produce the `## Reasoning` section:

1. Restate both asks in one line each.
2. Name **at least three candidate concepts** (one line each — what it is, what it would look like in this ink register). Then pick ONE and give the concrete reason it wins (distinctness from generic-hero patterns, fit with the hairline/ochre/lowercase register, how well it survives mobile, how quiet it stays).
3. For the picked concept, specify: the exact DOM you add (if any), every CSS rule with concrete values, how it composes with the film grain and the hairline language, and how it behaves at 1440 / 1024 / 700 / 560 / 390 / 320.
4. Risk pass: for each of — overflow at 320; collision of decorative elements with the h1 text; crowding `.pg-layout`; mobile presence regression; the "generic" failure mode itself (does your concept actually escape it?) — one line on how your design avoids it.
5. Self-review against §5 before returning — see the `## Self-review` output section.

There is no approval gate and no option list to offer: pick, justify, ship.

## 5. Acceptance criteria (observable)

1. h1 reads "archive of ai outputs." + "not all of these are good." — two lines, lowercase, no truncation at any viewport in the matrix.
2. The hero has a distinct, describable concept — a viewer names what makes it "an AI experimentation space" in one sentence; it is not just a re-skinned copy card.
3. No interactive/functional furniture inside the hero; all decorative elements are `aria-hidden` and non-interactive.
4. Mobile (≤900, ≤560): hero keeps deliberate presence (vertical padding, big type); no crowding of the content below.
5. No horizontal overflow at 1440/1024/700/560/390/320; nothing collides with the h1 text; the concept holds together at 320 (either degrades gracefully or is hidden by design — say which).
6. Register intact: dark ink, hairlines, ochre family, lowercase mono/sans split, `--panel-radius`/`--pill-radius` unchanged; reduced-motion respected.
7. CSS is complete and self-consistent (no dangling selectors); TypeScript would compile (no unused imports).

## 6. Output contract (exactly this shape)

```
## Reasoning
<per §4: restatement, ≥3 candidate concepts + pick with reason, full spec of the picked concept, risk pass>

## Changes
### R1 — web/PracticeMapPage.tsx (hero region)
<complete new text for the region>

### R2 — web/practice-map.css (hero rules + any new rules, named insertion points)
<complete new text; name every deletion>

## Self-review
<checklist: each of the 7 acceptance criteria, pass/fail judged against your own produced code, one line each>

## Notes
<optional, ≤5 lines: out-of-scope observations only — no code>
```

Rules: replace regions wholesale (the orchestrator splices them); keep the files' comment voice (terse, reasons-not-narration); no comments narrating the change — only a short comment where a non-obvious constraint genuinely needs one.
