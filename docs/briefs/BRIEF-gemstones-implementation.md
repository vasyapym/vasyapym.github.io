# Task brief — implement the approved "Gemstones" card concept as drop-in code

You are a design-minded front-end engineer. You have **no access to the repository or any prior conversation** — everything you need is in this brief. You will produce concrete, drop-in code that another agent pastes into the repo verbatim, then typechecks and visually verifies. Output must be complete and compilable as-is; no follow-up questions.

## 1. The product

Personal portfolio of a senior developer. React 19 + Vite + TypeScript (strict), **one plain-CSS stylesheet**, zero runtime dependencies on the landing page. Landing = dark "ink catalogue": page field `#0b1317`, cream text `#eeeae0`, ochre accents `#d39b61`/`#e8b57c`, IBM Plex Sans (weights 400/500/600 loaded; **700 will be added to the Google Fonts URL by the integrator — you may use it**), IBM Plex Mono 400/500, subtle film grain, content column `min(100% - 72px, 1280px)` centred. Above the cards sits a settled full-viewport Canvas2D hero + a numbered "beneath the surface" rail — both **untouched**.

Available CSS custom properties (defined on `:root`, usable but not required):
`--ink-bg #0b1317 · --ink-text #eeeae0 · --ink-muted rgba(238,234,224,.68) · --ink-faint rgba(238,234,224,.48) · --ink-line rgba(238,234,224,.26) · --ink-line-soft rgba(238,234,224,.13) · --ink-accent #d39b61 · --ink-accent-bright #e8b57c · --ink-accent-deep #b97f45 · --sans/--mono/--display "IBM Plex …" · --focus-ring`

## 2. The approved concept — "Gemstones" (implement exactly this)

"Gemstones" — Each project becomes a single luminous, chunky glyph resting in its own softly-lit gem-panel, like the glossy mascot-blobs of the GitHub hero brought down to catalogue scale. Real mass, gloss, and saturated per-project colour — bold and cheerful, but small and disciplined in footprint. Six gems in a tidy two-up grid: confident objects, not diagrams.

**Layout & sizing**
- Desktop (≥900w): CSS Grid `repeat(2, 1fr)`, `gap: 24px`; six cards (~624×360px each), 32px top padding off the rail.
- Card interior, vertical split: **art stage on top** (200px fixed height, full card width, own gem background), **copy block below** (~160px, 24px padding). Copy order: topline · title · description · footer.
- Topline: mono 12px ochre `#d39b61`, `01 · distributed systems` (index + tag only). Tech list demoted to footer: mono 11px muted cream `#8c928e`, joined by `·`, wrapping max 2 lines. Footer: tech row (left) + `open ↗` (right, mono, ochre).
- Title: IBM Plex Sans 700, `clamp(20px, 1.6vw, 24px)`, cream. Description: 400, 14px/1.5, `#c9c5bb`, clamped to 2 lines.
- Mobile (≤899w): single column, 16px side margins, art stage 150px, `gap: 16px`, no overflow at 320w.

**Illustration style guide** (inline SVG, **260×160 viewBox**, `aria-hidden`)
- 3–6 chunky rounded shapes per subject, thick (never thin lines). Fills use `<radialGradient>` glossy top-light (light stop top-left → hue mid → darker hue bottom). One small elliptical highlight per subject.
- Glow without blur: 1–2 concentric hue shapes behind the subject at opacity 0.25 → 0.12 — layered halos, not `feGaussianBlur`. **Give these shapes `class="gem-halo"`** (CSS pulses them).
- Shape language: superellipse/rounded, high mass, generous negative space. Max 6 elements. No text inside art.
- Shared lifted panel ground `#0f1b20`; per-project accent hue; ochre `#e8b57c` only as shared secondary pop.

| # | Project (id) | SVG subject | Hue | centerMark key |
| --- | --- | --- | --- | --- |
| 1 | Raft Cluster (`raft-cluster`) | 5 rounded nodes ringed around a crowned "leader" node, thick radiating links (system topology) | electric coral `#ff6a5f` | `raft` |
| 2 | Cat Runner (`kitty-run`) | Chunky cat glyph mid-leap, 3 speed-streak bars | candy pink `#ff8fbf` | `kitty` |
| 3 | Evening Forest (`evening-forest`) | 3 stacked rounded dusk-trees on a gentle path curve | forest teal-green `#4fd1a5` | `fox` |
| 4 | Explosion (`explosion`) | Split sphere throwing ~8 chunky shards outward | molten amber `#ffb347` | `blast` |
| 5 | Planck to Now (`planck-to-now`) | Bright core orb + one arc timeline with a scrubber dot | cosmic violet `#a98cff` | `spiral` |
| 6 | Practice Map (`practice-map`) | Cluster of rounded map-pins over a 3×3 tile grid | sky blue `#5cc8ff` | `trail` |

**Motion**
- Idle: subject breathe — `translateY ±3px`, 4s ease-in-out infinite, per-card offset by index × 0.4s (use `:nth-child` delays). Raft/Planck halos pulse opacity 0.12→0.25 on the same clock. Transform/opacity only.
- Hover/focus: card `translateY(-6px)`, panel ground brightens ~4%, halo opacity +0.1, `open ↗` shifts +3px right; 180ms ease-out. `:focus-visible` = 2px ochre outline, 3px offset, same lift. Pointer-parallax stays via existing CSS vars (max 6°).
- Scroll reveal: cards start `opacity:0; translateY(24px)`, animate to final as they cross the reveal band; delay comes from an existing JS-provided `--reveal-delay` (ms) — **do not require JS changes**. No IntersectionObserver.
- Reduced motion: all idle/reveal animation off; cards fully visible at final state, independent of JS; hover = colour shift only, no transform.

## 3. Code mechanics

### 3.1 Files you may produce
1. **`portfolio/shell/src/shell/ProjectArtwork.tsx`** — full replacement file (Deliverable A).
2. **`portfolio/shell/src/shell/LandingPage.tsx`** — replacement JSX for the projects `<section>` only (Deliverable B). All other JSX/effects stay.
3. **`portfolio/shell/src/styles.css`** — one self-sufficient appended chunk (Deliverable C). The integrator **deletes all legacy card/artwork CSS**, so your chunk must define everything itself.
4. **Integrator notes** — ≤10 bullets (Deliverable D).

The six `projects/*/project.ts` files are NOT yours — data already supplies title, tag, description, technologies, presentation className/centerMark.

### 3.2 JS contracts that must survive (LandingPage effects query these)
- Grid wrapper class **`.signal-index-grid`** (pointer-delegation target) and card class **`.signal-index-card`** (pointermove writes `--mx/--my` px vars on hovered cards — free to use or ignore).
- Each card: `<a>` with `id="project-{id}"`, `data-project-reveal={id}`, `href={"/projects/" + id}`, inline style `--reveal-delay: {ms}ms`, and the `.is-revealed` class toggled by JS. Keep the exact handlers from the excerpt below (onClick/open-project, pointerEnter/focus warm-up). Reveal JS (rAF scroll-band sweep) is untouched — CSS consumes `--reveal-delay` and `.is-revealed`.
- The JS adds class `signal-index-reveal-ready` to the page root once mounted. **Hidden reveal states must be gated as `.signal-index-reveal-ready …` inside `@media (prefers-reduced-motion: no-preference)` only** — so reduced-motion users and no-JS visitors always see full content. Use `visibility: hidden` on unrevealed cards (keeps layout, removes from tab order).
- Keep `scroll-margin-top` on cards (deep links `#project-{id}` from the rail).

### 3.3 ProjectArtwork.tsx — current file, for adaptation (drop the parts/note machinery)
The new file keeps: default export, the `project` prop, pointer-parallax handlers (write vars on the object: `--art-rotate-x/y`, `--art-shift-x/y`; retune to max 6°: rotateX `y * -6deg`, rotateY `x * 6deg`, shift `x * 8px / y * 6px`), the wrapper/object/center structure, and the `CENTER_MARKS` record — but with **six new gem SVG components** replacing the old marks, and **no** parts, PartMark, or note.

```tsx
import { useRef, type CSSProperties, type PointerEvent, type ReactElement } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import type { ProjectCenter, ProjectPresentationPart } from "../../../contracts/project-presentation";

export default function ProjectArtwork({ project }: ProjectArtworkProps) {
  const objectRef = useRef<HTMLDivElement>(null);
  const presentation = project.presentation;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || !objectRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    const objectStyle = objectRef.current.style;
    objectStyle.setProperty("--art-rotate-x", `${y * -6}deg`);
    objectStyle.setProperty("--art-rotate-y", `${x * 6}deg`);
    objectStyle.setProperty("--art-shift-x", `${x * 8}px`);
    objectStyle.setProperty("--art-shift-y", `${y * 6}px`);
  };

  const resetPointer = () => { /* same pattern, sets all four vars to 0 */ };

  return (
    <div
      className={`project-artwork ${presentation.className} artwork-motion-${presentation.motion}`}
      onPointerLeave={resetPointer}
      onPointerMove={handlePointerMove}
      aria-hidden="true"
    >
      <div ref={objectRef} className="project-artwork-object">
        <span className={`project-artwork-center center-${presentation.centerMark}`}>
          <CenterMark mark={presentation.centerMark} label={presentation.centerLabel} />
        </span>
      </div>
    </div>
  );
}

const CENTER_MARKS: Partial<Record<ProjectCenter, () => ReactElement>> = {
  kitty: …, fox: …, blast: …, spiral: …, trail: …, raft: …,
};

function CenterMark({ mark, label }: { mark: ProjectCenter; label: string }) {
  const Component = CENTER_MARKS[mark];
  if (!Component) return <>{label}</>;
  return <Component />;
}
```

Exemplar of the old mark quality bar (Explosion moon — replace with the new gem subject; match this confidence, not this subject):

```tsx
function BlastCenterMark() {
  return (
    <svg viewBox="0 0 110 110" aria-hidden="true">
      <defs>
        <radialGradient id="lunaGlow" cx="40%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#ffe8bf" />
          <stop offset="45%" stopColor="#ff9a48" />
          <stop offset="100%" stopColor="#7e2f22" />
        </radialGradient>
      </defs>
      <circle cx="46" cy="60" r="30" fill="url(#lunaGlow)" />
      <path d="M 46 30 Q 30 48 34 78 Q 52 74 60 52 Z" fill="#c95a2c" opacity="0.5" />
      <circle cx="60" cy="46" r="6" fill="#ffd27a" />
      <polygon points="60,40 76,30 70,48" fill="#ffd9a0" />
      <polygon points="70,26 88,20 80,38" fill="#ff8a3c" />
    </svg>
  );
}
```

Rules for the new SVGs: `viewBox="0 0 260 160"`; **unique gradient IDs per project** (prefix `gem-raft-`, `gem-cat-`, … — IDs are document-global); halo shapes carry `class="gem-halo"`; the idle breathe animates the `.project-artwork-center svg` element itself, so **hover CSS must not transform that element** (use opacity/filter). Keep the `type ProjectArtworkProps = { project: ProjectModule }` shape. Unused imports (`ProjectPresentationPart`, `CSSProperties` if unneeded) must be dropped — TS strict flags them.

### 3.4 LandingPage.tsx — the projects section you are replacing (verbatim current code)

```tsx
        <section
          className="signal-index-projects"
          id="projects"
          aria-label="Projects"
          data-section-reveal=""
        >
          <div className="signal-index-grid">
            {projects.map((project, index) => (
              <a
                className={`signal-index-card${revealReady && revealedProjects.has(project.id) ? " is-revealed" : ""}`}
                id={`project-${project.id}`}
                data-project-reveal={project.id}
                href={`/projects/${project.id}`}
                key={project.id}
                style={{ "--reveal-delay": `${revealedProjects.get(project.id) ?? 0}ms` } as CSSProperties}
                onPointerEnter={() => warmProjectPage(project)}
                onFocus={() => warmProjectPage(project)}
                onClick={(event) => {
                  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                    event.preventDefault();
                    onOpenProject(project.id);
                  }
                }}
              >
                <div className="signal-index-card-topline">
                  <span className="signal-index-card-tag">
                    {String(index + 1).padStart(2, "0")}
                    {project.tag ? ` / ${project.tag}` : ""}
                  </span>
                  <span>{project.technologies.join(" · ")}</span>
                </div>
                <div className="signal-index-card-body">
                  <div className="signal-index-card-copy">
                    <h3>{project.title}</h3>
                    <p className="signal-index-card-description">{project.description}</p>
                    <div className="signal-index-card-footer">
                      <span className="signal-index-card-link">open <span aria-hidden="true">↗</span></span>
                    </div>
                  </div>
                  <ProjectArtwork project={project} />
                </div>
              </a>
            ))}
          </div>
        </section>
```

Your replacement keeps the section shell and every `<a>` attribute/handler above, restructures the interior to: **ProjectArtwork (art stage) first, then the copy block** — compact topline (`01 · {tag}` mono), `<h3>` title, description, footer row (technologies joined `" · "` + `open ↗`). Inner class names may change (pick gem-consistent ones); the JS-contract classes/attrs from §3.2 may not.

### 3.5 styles.css — what the integrator deletes (do not depend on any of it)
Everything for: `.signal-index-projects`, `.signal-index-grid` (+ its `::before` hairline), `.signal-index-card` (+ `::before`/`::after` wash system, `@property --card-wash`, the clip-path "plotter" reveal block), `.signal-index-card-*` copy classes, `.project-artwork` and all `.project-artwork-*`, every `.presentation-*`, `.presentation-part-*`, `.project-mark-*`, `.center-*` rule, and their media queries. **Your chunk must fully define**: section padding, grid, card panel (ground `#0f1b20`, corner radius of your choice consistent with the gem language, overflow, `scroll-margin-top`), art stage (200px/150px), object + center + svg sizing (`object` fills the stage; svg `width/height 100%; display block`), object parallax transition (`transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)`), copy typography, footer, hover/focus system, reveal (gated per §3.2), idle breathe + halo pulse (gated), reduced-motion block, and the `max-width: 900px` mobile adaptations (that is the site's existing breakpoint).

## 4. Hard constraints
- TS strict, React 19, no new dependencies, no image assets, no WebGL, no blur/backdrop-filter anywhere in the new code.
- Cards are semantic `<a>`; keyboard reachable; focus-visible styled; artwork `aria-hidden="true"`.
- Nothing may hide content under `prefers-reduced-motion: reduce` or without JS (see §3.2 gate).
- Idle/hover/reveal motion: transform and opacity only; 60fps budget.
- Never touch the hero, header, beneath-rail, fonts link, or `projects/*/project.ts`.
- Comments in code are fine but sparing.

## 5. Output format
- **A** — full `ProjectArtwork.tsx` file, one code block.
- **B** — full replacement for the projects `<section>` JSX, one code block.
- **C** — the complete appended CSS chunk, one code block (a single `/* ===== Gemstones cards ===== */` region).
- **D** — integrator notes: ≤10 bullets (assumptions, chosen radius values, anything the integrator must double-check).
