# Task brief — redesign the Raft Cluster card illustration + give it a new theme colour

You are a design-minded front-end engineer. You have **no access to the repository or any prior conversation**. Everything you need is in this brief. You will produce concrete, drop-in code that another agent will paste into the repo verbatim, then typecheck and visually verify.

---

## 1. The product

A personal portfolio site (React 19 + Vite + TypeScript, one plain-CSS stylesheet). The landing page is one continuous near-black "ink catalogue" field: a canvas-2d fluid/dither hero on top, then six full-width project cards separated by 1px hairlines (rows, not boxes). Each card: a topline (index/tag + technologies), a left copy column (title, one-line description, `open ↗`), and a right **artwork panel** — the only boxed element in a card.

Card order: 1 Raft Cluster (pinned first — it is the opening card of the whole collection), 2 Hello Kitty Run, 3 Evening Forest, 4 Explosion, 5 Planck to Now, 6 Practice Map.

## 2. Design language (durable decisions)

- Page ground: deep ink `#0b1317` (`--ink-bg`). Everything reads as one dark field organised by catalogue notation.
- Type: IBM Plex Sans for headings/text; IBM Plex Mono for all catalogue notation, lowercase (tags, captions).
- Page accent: ochre `#d39b61` / bright `#e8b57c` for hover/focus. Each project additionally carries its own identity hue (`--project-accent`).
- **Identity-hue map of the six cards** (so you don't collide):
  - Explosion: ember `#ff8a3c` (the owner's favourite — see §4)
  - Evening Forest: amber `#ffb45e`
  - Kitty Run: rose `#dc7f95`
  - Planck to Now: warm gold `#ffd9a0`
  - Practice Map: ochre `#cf9d63`
  - Raft Cluster: teal `#63c7c3` — **being retired by this task**
  - Five of six are warm hues; a cool hue would give Raft its own lane — but the choice is yours.
- Card hover: edge-fading wash, an ochre hairline sweeping across the card top, a cursor-tracked warm radial bloom, title turns bright ochre.
- Artwork panel: 1px hairline border, `min-height: 220px`, `overflow: hidden`, mono lowercase caption (`note`) pinned bottom-left. Inside it a 260×190 "object" is centered and gets pointer-driven 3D parallax (rotateX ±5°, rotateY ±7°, shift ±8/6px) via CSS custom properties written by React — you cannot change that driver, only style what it moves.

## 3. History / prior decisions (do not re-tread)

The Raft Cluster illustration has been through **two rejected versions**:

1. **Thin-hairline version** (rejected): small flat-SVG mark — outlined circles, 1px vote arrows, committed cells as thin filled rects, tail cells as outlines. Owner: too weak, part of the "thin decorative outlines" family he is tired of.
2. **Beacon-election version** (current, rejected): still teal — one bright teal leader disc with a beacon crown triangle, two solid deep-teal follower masses, solid directed vote wedges, a chunky replicated-log ribbon (bright committed cells, darker tail), on a cool teal-slate lifted ground. Owner: **"raft cluster not so much."** The solid-mass direction was right (see §4) but the execution/hue did not land.

**What the owner loves** — the Explosion card, reworked in the same pass:

- **Composition:** "a moon caught tearing open" — a single illustrated hero (glowing gradient paper-lantern moon) sitting lower-left, torn ember core exposed, a fan of solid cream/ember/rust shards detonating toward the upper right. Confident color masses, real light (a radial gradient body, a bright limb highlight), one clear identity. No scattered abstract chips, no hairline decorations.
- **Ground:** a warm saturated ember-brown field — radial glow over a linear duotone — plus an inset rim + inner vignette via `box-shadow`, so the panel clearly floats above the near-black page. Different value AND temperature from the page.

You have **full creative freedom** for Raft: you do NOT need to keep the consensus-diagram abstraction, the teal hue, or any previous theme. What must stay: consistency with the ink-catalogue language (§2) and the figure-ground separation win from §4.

## 4. The task

1. **Redesign the Raft Cluster card illustration.** Subject (the card's own copy, which you must not change): "Live Raft consensus in the browser — crash the leader and watch elections answer." Technologies: Rust → WebAssembly, Canvas 2D. Tag: "distributed systems". Raft ideas you may use or ignore entirely: leader election, vote requests, terms, a replicated log with committed/uncommitted entries, crash/re-election, three or more nodes. The previous two versions both read as small abstract consensus diagrams — they failed. Aim for a **real illustrated subject with confident masses and light**, in the spirit of the Explosion hero: one clear "one thing" the picture is about.
2. **Change the card's theme colour.** Retire teal: pick a new identity hue for Raft Cluster, update `--project-accent`, and re-tune the panel ground so the new hue owns the card (Explosion-style: saturated tinted field + inset rim/vignette, clearly lifted off the `#0b1317` page). Also update the `accent: "teal"` metadata field in `project.ts` to match your hue name (it is a free-form string). Avoid the five hues listed in §2.
3. You may keep the single-hero composition (`parts: []`, current state) or reintroduce part elements — your call. If you resize the center box, desktop and mobile sizes must both be updated.

## 5. Hard constraints

- Static SVG + CSS only. No canvas/WebGL, no raster images, no new dependencies, no JS animation loops. CSS transitions on hover are fine; nothing may animate continuously.
- You may edit only these files: `portfolio/projects/raft-cluster/project.ts`, `portfolio/shell/src/shell/ProjectArtwork.tsx`, `portfolio/shell/src/styles.css`.
- Do **not** touch: the Explosion card (it is loved — any shared selector you edit must be restated in full with the explosion lines unchanged), the other four cards, the hero, card reveal/hover mechanics (`--card-wash`, `::before` accent hairline, `::after` bloom, `--mx`/`--my`, clip-path reveal), `.signal-index-card` core rules, the pointer-parallax driver (it writes `--art-rotate-x/y` and `--art-shift-x/y` on `.project-artwork-object`).
- `centerMark` must stay `"raft"` (the registry key and the `ProjectCenter` union already contain it; do not add union members).
- The artwork container is `aria-hidden="true"`; SVG stays decorative (no `<title>`; tiny labels only if truly needed). Meaning must not live in colour alone that the card copy doesn't already carry.
- Mobile: at ≤700px the center box shrinks; keep the `@media (max-width: 700px)` raft rule updated (the three `presentation-part-raft-*` scale lines inside it are inert — `parts` is empty — and may be removed for tidiness or left; your choice, say which).
- Copy: UI is English; mono captions are lowercase. You may adjust the `note` string (currently "live consensus") if your illustration changes its meaning. Do not touch title/description/technologies.

## 6. How the artwork system works + current code

`ProjectArtwork` renders per project: a panel div (class `project-artwork` + the project's `presentation.className`), inside it a parallax "object" div containing one `<span>` per part (none for Raft right now) plus one center span (class `project-artwork-center center-raft`) holding the SVG from the `RaftCenterMark` component, and finally the caption `<span className="project-artwork-note">` with `presentation.note`.

```tsx
// portfolio/shell/src/shell/ProjectArtwork.tsx — render shell (verbatim, for mechanics)
  return (
    <div
      className={`project-artwork ${presentation.className} artwork-motion-${presentation.motion}`}
      onPointerLeave={resetPointer}
      onPointerMove={handlePointerMove}
      aria-hidden="true"
    >
      <div ref={objectRef} className="project-artwork-object">
        {presentation.parts.map((part) => (
          <span
            className={`project-artwork-part ${part.className}`}
            key={part.id}
            style={partStyle(part)}
          >
            <PartMark part={part} />
          </span>
        ))}
        <span className={`project-artwork-center center-${presentation.centerMark}`}>
          <CenterMark mark={presentation.centerMark} label={presentation.centerLabel} />
        </span>
      </div>
      <span className="project-artwork-note">{presentation.note}</span>
    </div>
  );
```

```tsx
// portfolio/shell/src/shell/ProjectArtwork.tsx — current RaftCenterMark (verbatim).
// Replace this function entirely.
// Raft Cluster: the moment of election — one bright teal leader disc wearing a
// beacon crown, fed by directed vote wedges from deep-teal follower masses,
// seated on a chunky replicated-log ribbon (committed cells glowing, tail dark).
function RaftCenterMark() {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      {/* directed vote wedges from followers to the elected leader */}
      <polygon points="24,50 33,35 53,31" fill="#4bb5b0" opacity="0.9" />
      <polygon points="96,50 87,35 67,31" fill="#4bb5b0" opacity="0.9" />
      {/* spine linking leader to the replicated log */}
      <rect x="56" y="36" width="8" height="24" rx="3" fill="#39928e" />
      {/* two follower nodes — solid deep-teal masses */}
      <circle cx="22" cy="46" r="11" fill="#2f7d79" />
      <circle cx="98" cy="46" r="11" fill="#2f7d79" />
      <circle cx="18" cy="42" r="3.4" fill="#7fd6d1" opacity="0.7" />
      <circle cx="94" cy="42" r="3.4" fill="#7fd6d1" opacity="0.7" />
      {/* elected leader — bright disc with beacon crown */}
      <polygon points="52,13 60,1 68,13" fill="#a7ede9" />
      <circle cx="60" cy="25" r="15" fill="#7ad9d4" />
      <circle cx="54" cy="19" r="3.6" fill="#d6f6f4" opacity="0.85" />
      <circle cx="60" cy="25" r="5" fill="#0e1a19" opacity="0.85" />
      {/* replicated log — solid base plate + committed / tail cells */}
      <rect x="14" y="60" width="92" height="24" rx="6" fill="#123e3c" />
      <rect x="18" y="64" width="12" height="16" rx="3" fill="#66d0cb" />
      <rect x="32" y="64" width="12" height="16" rx="3" fill="#66d0cb" />
      <rect x="46" y="64" width="12" height="16" rx="3" fill="#66d0cb" />
      <rect x="60" y="64" width="12" height="16" rx="3" fill="#66d0cb" />
      <rect x="74" y="64" width="12" height="16" rx="3" fill="#2a6a67" />
      <rect x="88" y="64" width="12" height="16" rx="3" fill="#2a6a67" />
    </svg>
  );
}
```

```ts
// portfolio/projects/raft-cluster/project.ts — full current file (verbatim).
// Only the `accent` metadata string and `note` are expected to change, but you
// may replace the whole file if you reintroduce parts.
import type { ProjectModule } from "../../contracts/project-module";

const raftCluster: ProjectModule = {
  id: "raft-cluster",
  title: "Raft Cluster",
  tag: "distributed systems",
  eyebrow: "live consensus · Rust → WebAssembly",
  description:
    "Live Raft consensus in the browser — crash the leader and watch elections answer.",
  technologies: ["Rust", "WebAssembly", "TypeScript", "Canvas 2D"],
  status: "available",
  accent: "teal",
  presentation: {
    className: "presentation-raft-cluster",
    motion: "network",
    centerLabel: "R / C",
    centerMark: "raft",
    note: "live consensus",
    motionLabel: "the cluster elects",
    instruction: "crash the leader or cut a link, watch a new term elect",
    parts: [],
  },
  loadPage: () => import("./web/RaftPage"),
};

export default raftCluster;
```

### Relevant CSS (portfolio/shell/src/styles.css — one file, ~1800 lines)

```css
/* Tokens actually used by the artwork (excerpt of :root; the page ground is
   --ink-bg #0b1317). */
:root {
  --index-ink: #171a1c;
  --ink-bg: #0b1317;
  --ink-text: #eeeae0;
  --ink-muted: rgba(238, 234, 224, 0.68);
  --ink-faint: rgba(238, 234, 224, 0.48);
  --ink-line-soft: rgba(238, 234, 224, 0.13);
  --ink-accent: #d39b61;
  --ink-accent-bright: #e8b57c;
  --mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
}
```

```css
/* Artwork panel base (verbatim; for mechanics). A generic figure-ground lift
   box-shadow lives on this base rule — any per-project rule that declares its
   own box-shadow (Raft and Explosion do) overrides it. */
.project-artwork {
  position: relative;
  min-height: 220px;
  order: 2;
  overflow: hidden;
  border: 1px solid var(--ink-line-soft);
  perspective: 900px;
  --panel-line: rgba(238, 234, 224, 0.18);
  --art-pin: #dd6f63;
  background: var(--index-ink);
  box-shadow:
    inset 0 1px 0 rgba(238, 234, 224, 0.05),
    inset 0 0 34px rgba(238, 234, 224, 0.03),
    inset 0 -30px 50px -30px rgba(0, 0, 0, 0.5);}

/* The parallax object and the center chip base (verbatim, for mechanics).
   Custom center boxes override width/height/border/background only — the
   translate(-50%, -50%) translateZ(78px) parallax transform is inherited. */
.project-artwork-object {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  width: 260px;
  height: 190px;
  transform: translate3d(calc(-50% + var(--art-shift-x, 0px)), calc(-50% + var(--art-shift-y, 0px)), 0)
    rotateX(var(--art-rotate-x, 0deg)) rotateY(var(--art-rotate-y, 0deg));
  transform-style: preserve-3d;
  transition: transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1);}

.project-artwork-center {
  position: absolute;
  z-index: 4;
  top: 50%;
  left: 50%;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid var(--project-accent);
  color: var(--project-accent);
  background: rgba(11, 19, 23, 0.72);
  font-family: var(--mono);
  font-size: 0.56rem;
  letter-spacing: 0.06em;
  transform: translate(-50%, -50%) translateZ(78px);}

.project-artwork-note {
  position: absolute;
  z-index: 2;
  right: 1rem;
  bottom: 0.8rem;
  left: 1rem;
  color: var(--ink-muted);
  font-family: var(--mono);
  font-size: 0.62rem;
  letter-spacing: 0.05em;
  text-transform: lowercase;}
```

```css
/* ===== Raft Cluster (verbatim; the blocks you may replace) ===== */
.presentation-raft-cluster {
  --project-accent: #63c7c3;
  --project-ink: #0e1a19;
  --project-surface: rgba(99, 199, 195, 0.08);
  background:
    radial-gradient(120% 90% at 50% 34%, #2c4c4d 0%, #1c3536 44%, rgba(18, 38, 39, 0) 100%),
    linear-gradient(165deg, #21403f 0%, #16302f 60%, #102625 100%);
  box-shadow:
    inset 0 0 0 1px rgba(147, 220, 214, 0.12),
    inset 0 -40px 60px -30px rgba(0, 0, 0, 0.55);
}

.presentation-part-raft-voters {
  width: 128px;
  height: 94px;
  color: var(--project-accent);}

.presentation-part-raft-log {
  width: 156px;
  height: 42px;
  border: 1px solid rgba(99, 199, 195, 0.34);
  color: var(--project-accent);
  background: var(--project-surface);}

.presentation-part-raft-links {
  width: 170px;
  height: 46px;
  color: var(--project-accent);}

.project-artwork-center.center-raft {
  width: 150px;
  height: 120px;
  border: none;
  background: transparent;
  overflow: visible;
}

.project-artwork-center.center-raft svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.signal-index-card:hover .center-raft svg,
.signal-index-card:focus-visible .center-raft svg {
  transform: scale(1.06);
}

@media (max-width: 700px) {
  .presentation-part-raft-voters { transform: scale(0.86); }
  .presentation-part-raft-log { transform: scale(0.86); }
  .presentation-part-raft-links { transform: scale(0.84); }
  .project-artwork-center.center-raft {
    width: 116px;
    height: 94px;
  }
}
```

### The loved exemplar — Explosion (verbatim, reference; do NOT change it)

```tsx
// portfolio/shell/src/shell/ProjectArtwork.tsx — BlastCenterMark (verbatim)
// Explosion: a glowing paper-lantern moon caught tearing open — exposed ember
// core, a fan of solid cream/ember/rust shards detonating toward the upper right.
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
      {/* intact glowing body of the paper-lantern moon */}
      <circle cx="46" cy="60" r="30" fill="url(#lunaGlow)" />
      {/* a darker folded-paper facet across the sphere */}
      <path d="M 46 30 Q 30 48 34 78 Q 52 74 60 52 Z" fill="#c95a2c" opacity="0.5" />
      {/* bright limb highlight */}
      <path d="M 30 44 Q 38 32 52 34" fill="none" stroke="#ffe8bf" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
      {/* ember core exposed where the shell tears open */}
      <circle cx="60" cy="46" r="6" fill="#ffd27a" />
      {/* solid shards detonating toward the upper right */}
      <polygon points="60,40 76,30 70,48" fill="#ffd9a0" />
      <polygon points="70,26 88,20 80,38" fill="#ff8a3c" />
      <polygon points="80,40 100,40 86,54" fill="#c65a2a" />
      <polygon points="66,18 76,7 80,22" fill="#ffcf95" />
      <polygon points="90,30 106,26 96,44" fill="#ff8a3c" />
      <polygon points="84,54 102,60 88,66" fill="#d0632c" />
      <polygon points="98,16 108,14 103,26" fill="#ffd9a0" />
      <polygon points="56,28 63,17 68,31" fill="#ff8a3c" />
    </svg>
  );
}
```

```css
/* Explosion ground (verbatim, reference for the "loved" ground recipe) */
.presentation-explosion-luna {
  --project-accent: #ff8a3c;
  --project-ink: #f2e9da;
  --project-surface: #171013;
  position: relative;
  background:
    radial-gradient(90% 82% at 44% 46%, #5a2a18 0%, #3a1c12 40%, #241210 100%),
    linear-gradient(150deg, #301813 0%, #1d0f0d 70%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 176, 120, 0.14),
    inset 0 -44px 64px -34px rgba(0, 0, 0, 0.6);
}
/* Explosion center box: 124×124 desktop, 96×96 at ≤700px (its own rules). */
```

## 7. Expected output format

Produce a single markdown document with exactly these sections:

1. **Design rationale** — ≤150 words: the concrete visual idea (the "one thing" the illustration is about), why it reads as an illustrated subject rather than a diagram, why the new hue, and why the panel separates from the page.
2. **Changes** — a numbered list. Every change is one drop-in block:
   - `File: <path>` then **what to replace** with an unambiguous anchor given §6 (e.g. "replace the function `RaftCenterMark` entirely", "replace the CSS block starting `.presentation-raft-cluster {` and ending before `.presentation-part-raft-voters`").
   - Then the **complete** new code in a fenced block with the right language tag. No ellipses, no "unchanged", no diff format — full bodies only.
   - If you touch any selector shared with other projects, restate it in full with every other project's line unchanged.
3. **Integration notes** — what the integrating agent must double-check (media-block contents, inert part rules kept or removed, gradient id uniqueness, etc.) and what to eyeball in the dev server (desktop + ≤700px, hovered + not).

Rules for the code itself:

- Keep the ids/class names (`center-raft`, `presentation-raft-cluster`) and `centerMark: "raft"`.
- The center box may be resized (it sits in a 260×190 object inside a ≥220px-tall panel); design the SVG viewBox for its proportions; parallax tilt is ±5–7°.
- A radial gradient `<defs>` id must be unique across the page (`lunaGlow` is taken by Explosion).
- If you keep `parts: []`, the `presentation-part-raft-*` CSS rules become inert; either keep or delete them and say so.
- Do not introduce scroll-driven or time-driven animation; hover/reveal transitions only.

## 8. What the integrating agent will run (FYI)

- `npm --prefix portfolio run typecheck` must pass.
- `npm --prefix portfolio run dev` → http://localhost:5173 for visual check; Raft Cluster is the first card below the hero. Must look right at desktop width and ≤700px, revealed and mid-reveal, hovered and not.
