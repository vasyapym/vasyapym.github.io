# Task brief — redesign the Raft Cluster and Explosion card illustrations + fix the dark-on-dark card ground

You are a design-minded front-end engineer. You have **no access to the repository or any prior conversation**. Everything you need is in this brief. You will produce concrete, drop-in code that another agent will paste into the repo verbatim, then typecheck and visually verify.

---

## 1. The product

A personal portfolio site (React 19 + Vite + TypeScript, one plain-CSS stylesheet). The landing page is one continuous near-black "ink catalogue" field: a canvas-2d fluid/dither hero on top, then six full-width project cards separated by 1px hairlines (rows, not boxes). Each card: a topline (index/tag + technologies), a left copy column (title, one-line description, `open ↗`), and a right **artwork panel** — the only boxed element in a card.

Card order on the page: 1 Raft Cluster (pinned first), 2 Hello Kitty Run, 3 Evening Forest, 4 Explosion, 5 Planck to Now, 6 Practice Map.

## 2. Design language (durable decisions from the design handoff)

- Page ground: deep ink `#0b1317` (`--ink-bg`). Everything reads as one dark field organised by catalogue notation.
- Type: IBM Plex Sans for headings/text; IBM Plex Mono for all catalogue notation, lowercase (tags, captions, links).
- Accent: ochre `#d39b61` / bright `#e8b57c` for hover/focus. Each project additionally carries its own identity hue (`--project-accent`).
- Card hover: edge-fading wash, an ochre hairline sweeping across the card top, a cursor-tracked warm radial bloom, title turns bright ochre.
- Artwork panel: 1px hairline border, `min-height: 220px`, `overflow: hidden`, mono lowercase caption (`note`) pinned bottom-left. Inside it a 260×190 "object" is centered and gets pointer-driven 3D parallax (rotateX ±5°, rotateY ±7°, shift ±8/6px) via CSS custom properties written by React — you cannot change that driver, only style what it moves.
- **Quality bar:** the Evening Forest card's 8-bit fox — a chunky pixel-art fox in amber/cream/ink on a violet→amber dusk — is the illustration the owner has liked most: a real illustrated subject with a clear hue identity and confident color masses. Thin hairline outlines and scattered abstract chips are what the owner is currently tired of.

## 3. History / prior decisions (do not re-tread)

- The current artwork system came from a "quiet specimens" pass: a few scattered hairline "parts" (hollow dot grids, thin bars, dashed routes) around one small flat-SVG "center mark", on a dark tinted panel per project.
- The Raft and Explosion center marks were already redrawn once in the latest commit ("log-spine election": leader disc + vote arrows + committed/uncommitted log cells; "paper-lantern seam": lantern moon with an ember seam + thin shock ring). **The owner is still unsatisfied.**
- The owner's complaints, verbatim intent:
  1. The Raft Cluster and Explosion card illustrations are weak.
  2. The artwork panel's colour sits in the same dark palette as the page background — dark-on-dark with almost no figure-ground separation.

**You have full creative freedom** for these two cards: you do NOT need to keep the previous style, theme, or approach. You only need to stay consistent with the overall ink-catalogue design language (§2).

## 4. The task

1. Redesign the illustration for the **Raft Cluster** card. Subject: live Raft consensus running in the browser — a leader, followers, vote requests, a replicated log with committed and uncommitted entries; crash the leader and a new term elects. Tech: Rust → WebAssembly core, Canvas 2D renderer. Tag: "distributed systems". Identity hue so far: teal `#63c7c3`.
2. Redesign the illustration for the **Explosion** card. Subject: a paper-lantern moon that detonates into the 600 shards it is built from; shard physics run in fragment shaders (GPGPU); click to blast, click to restore. Tech: React 19, three.js, GPGPU, Rust, WebAudio. Tag: "physics". Identity hue so far: ember `#ff8a3c`.
3. Fix the ground problem: the artwork panels must **separate from the page's near-black field**. Minimum scope: the two featured cards. If you believe the fix should apply to all six panels, provide it as a clearly-labelled *optional* block at the end (the other four panels' code is not included here, so keep that block generic).

## 5. Hard constraints

- Static SVG + CSS only. No canvas/WebGL, no raster images, no new dependencies, no JS animation loops. CSS transitions on hover are fine; nothing may animate continuously.
- You may edit only these files: `portfolio/projects/raft-cluster/project.ts`, `portfolio/projects/explosion/project.ts`, `portfolio/shell/src/shell/ProjectArtwork.tsx`, `portfolio/shell/src/styles.css`, `portfolio/contracts/project-presentation.ts`.
- Do **not** touch: the other five cards' marks or presentation classes; the hero; the card reveal/hover mechanics (clip-path reveal, `--card-wash`, `::before` accent hairline, `::after` bloom, `--mx`/`--my`); `.signal-index-card` core rules; the pointer-parallax driver in `ProjectArtwork` (it writes `--art-rotate-x/y` and `--art-shift-x/y` on `.project-artwork-object`).
- TypeScript must compile. If you need a new `ProjectPartMark` or `ProjectCenter` value, show the exact one-line edit to the union in `project-presentation.ts`. Prefer keeping the existing ids (`centerMark: "raft"` / `"blast"`, existing part class names) so integration stays safe; renaming is allowed only if you list every touched site.
- The artwork container is `aria-hidden="true"`; SVG must stay decorative (no `<title>`, no text beyond tiny labels if truly needed). Meaning must not live in colour alone that the card copy doesn't already carry.
- Mobile: panels shrink at ≤700px. Keep/extend the existing `@media (max-width: 700px)` rules for anything you resize. One existing media block also resizes `.center-kitty` — that rule must survive your edit (see included code).
- Copy: UI is English; mono captions are lowercase. You may adjust each project's `note` string if your illustration changes its meaning. Do not touch card titles/descriptions.

## 6. How the artwork system works (exact mechanics)

`ProjectArtwork` renders per project: a panel div (class `project-artwork` + the project's `presentation.className`), inside it a parallax "object" div containing one `<span>` per part (positioned via CSS vars) plus one center span (class `project-artwork-center center-{centerMark}`) which holds the SVG returned by the registry below, and finally the caption `<span className="project-artwork-note">` with `presentation.note`.

Part marks render as follows (CSS-defined glyphs, `currentColor` = the part's colour): `nodes` → 5 hollow circles in a rotated grid; `branches` → two thin lines + 3 hollow circles; `stack` → 4 thin bars of varying width; `route` → a zigzag bar (clip-path) + 3 hollow circles; `contours` → 3 overlapping ellipse outlines; `pin` → a map pin; `compass` → a crosshair circle; `type` → text (`markLabel`). The center span is normally a small monogram chip, but raft/blast/fox/etc. override it to a transparent box holding the SVG mark.

```tsx
// portfolio/shell/src/shell/ProjectArtwork.tsx — the render shell (lines 37–79, verbatim)
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
// Same file — the registry and dispatch (verbatim). `partStyle` writes --anchor-x/y,
// --scatter-x/y/z, --base-z, --part-rotation; only anchor, base-z and rotation are
// used by the landing CSS (scatter is a legacy hook, unused there).
const CENTER_MARKS: Partial<Record<ProjectCenter, () => ReactElement>> = {
  kitty: KittyCenterMark,
  filetree: FiletreeCenterMark,
  fox: FoxCenterMark,
  blast: BlastCenterMark,
  spiral: SpiralCenterMark,
  trail: TrailCenterMark,
  raft: RaftCenterMark,
};

function CenterMark({ mark, label }: { mark: ProjectCenter; label: string }) {
  const Component = CENTER_MARKS[mark];
  if (!Component) {
    return <>{label}</>;
  }
  return <Component />;
}
```

```tsx
// Same file — the two marks you are replacing (verbatim, current state).
// Explosion: a creased paper-lantern moon splitting along a bright ember seam,
// two shards drifting free inside one thin shock ring.
function BlastCenterMark() {
  return (
    <svg viewBox="0 0 110 110" aria-hidden="true">
      {/* thin shock ring */}
      <circle cx="55" cy="55" r="46" fill="none" stroke="#ff8a3c" strokeWidth="1" opacity="0.22" />
      {/* paper-lantern moon body */}
      <circle cx="55" cy="55" r="30" fill="#171013" stroke="#ffbd6f" strokeWidth="1.4" />
      {/* folded-paper meridians */}
      <path d="M 55 25 L 55 85" fill="none" stroke="#ffbd6f" strokeWidth="1" opacity="0.3" />
      <path d="M 40 28 Q 33 55 40 82" fill="none" stroke="#ffbd6f" strokeWidth="1" opacity="0.25" />
      <path d="M 70 28 Q 77 55 70 82" fill="none" stroke="#ffbd6f" strokeWidth="1" opacity="0.25" />
      {/* bright ember seam splitting the lantern */}
      <path d="M 40 40 L 52 54 L 46 60 L 62 74" fill="none" stroke="#ffd98f" strokeWidth="1.8" />
      {/* two drifting shards */}
      <polygon points="80,30 90,36 82,42" fill="#ffbd6f" opacity="0.85" />
      <polygon points="26,74 34,70 33,80" fill="#ff8a3c" opacity="0.8" />
      {/* inner ember core hint */}
      <circle cx="55" cy="55" r="5" fill="#ff8a3c" />
    </svg>
  );
}

// Raft Cluster: a replicated log spine (committed cells filled, tail outlined)
// beneath an elected leader taking votes from two outlined followers.
function RaftCenterMark() {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      {/* request-vote arrows from followers to the leader */}
      <path d="M 38 27 L 51 21" fill="none" stroke="#63c7c3" strokeWidth="1.2" opacity="0.55" />
      <path d="M 82 27 L 69 21" fill="none" stroke="#63c7c3" strokeWidth="1.2" opacity="0.55" />
      <polygon points="51,21 45,22 48,26" fill="#63c7c3" opacity="0.7" />
      <polygon points="69,21 75,22 72,26" fill="#63c7c3" opacity="0.7" />
      {/* two outlined followers */}
      <circle cx="30" cy="28" r="7.5" fill="#101c1c" stroke="#63c7c3" strokeWidth="1.4" />
      <circle cx="90" cy="28" r="7.5" fill="#101c1c" stroke="#63c7c3" strokeWidth="1.4" />
      {/* elected leader carries the accent disc */}
      <circle cx="60" cy="18" r="10" fill="#f0b878" stroke="#ffe3b1" strokeWidth="1.4" />
      <circle cx="60" cy="18" r="3" fill="#101c1c" opacity="0.75" />
      {/* thin link from leader down to the log */}
      <path d="M 60 28 L 60 54" fill="none" stroke="#63c7c3" strokeWidth="1.2" opacity="0.4" />
      {/* replicated log spine — committed cells filled, uncommitted outlined */}
      <rect x="18" y="56" width="14" height="16" rx="2" fill="#63c7c3" />
      <rect x="34" y="56" width="14" height="16" rx="2" fill="#63c7c3" />
      <rect x="50" y="56" width="14" height="16" rx="2" fill="#63c7c3" />
      <rect x="66" y="56" width="14" height="16" rx="2" fill="none" stroke="#63c7c3" strokeWidth="1.4" opacity="0.6" />
      <rect x="82" y="56" width="14" height="16" rx="2" fill="none" stroke="#63c7c3" strokeWidth="1.4" opacity="0.6" />
      <rect x="98" y="56" width="14" height="16" rx="2" fill="none" stroke="#63c7c3" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}
```

```ts
// portfolio/contracts/project-presentation.ts — full file, verbatim
export type ProjectPartId = string;

export type ProjectPartMark =
  | "nodes"
  | "type"
  | "branches"
  | "stack"
  | "route"
  | "pin"
  | "contours"
  | "compass";

export type ProjectMotion = "stack" | "network" | "terrain";
export type ProjectCenter =
  | "graph"
  | "compass"
  | "generic"
  | "kitty"
  | "filetree"
  | "fox"
  | "blast"
  | "spiral"
  | "trail"
  | "raft";

export type ProjectPresentationPart = {
  readonly id: ProjectPartId;
  readonly label: string;
  readonly className: string;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly mark: ProjectPartMark;
  readonly markLabel?: string;
  readonly scatterX: number;
  readonly scatterY: number;
  readonly scatterZ: number;
  readonly baseZ: number;
  readonly rotation: number;
};

export type ProjectPresentation = {
  readonly className: string;
  readonly motion: ProjectMotion;
  readonly centerLabel: string;
  readonly centerMark: ProjectCenter;
  readonly note: string;
  readonly motionLabel: string;
  readonly instruction: string;
  readonly parts: readonly ProjectPresentationPart[];
};
```

```ts
// portfolio/projects/raft-cluster/project.ts — full file, verbatim
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
    parts: [
      {
        id: "voters",
        label: "Voting nodes",
        className: "presentation-part-raft-voters",
        anchorX: -50,
        anchorY: -20,
        mark: "nodes",
        scatterX: -92,
        scatterY: -40,
        scatterZ: 76,
        baseZ: 16,
        rotation: -7,
      },
      {
        id: "log",
        label: "Replicated log",
        className: "presentation-part-raft-log",
        anchorX: 20,
        anchorY: 44,
        mark: "stack",
        scatterX: 24,
        scatterY: 92,
        scatterZ: 96,
        baseZ: 38,
        rotation: -3,
      },
      {
        id: "links",
        label: "RPC links",
        className: "presentation-part-raft-links",
        anchorX: 56,
        anchorY: -14,
        mark: "branches",
        scatterX: 88,
        scatterY: -34,
        scatterZ: 58,
        baseZ: 26,
        rotation: 5,
      },
    ],
  },
  loadPage: () => import("./web/RaftPage"),
};

export default raftCluster;
```

```ts
// portfolio/projects/explosion/project.ts — full file, verbatim
import type { ProjectModule } from "../../contracts/project-module";

const explosionLuna: ProjectModule = {
  id: "explosion",
  title: "Explosion",
  tag: "physics",
  eyebrow: "interactive · three.js",
  description:
    "a paper-lantern moon that detonates into the 600 shards it is built from — physics runs in fragment shaders on the gpu, not the cpu. click to blast, click to restore.",
  technologies: ["React 19", "three.js", "GPGPU", "Rust", "WebAudio"],
  status: "available",
  accent: "red",
  presentation: {
    className: "presentation-explosion-luna",
    motion: "stack",
    centerLabel: "L / X",
    centerMark: "blast",
    note: "paper lantern moon",
    motionLabel: "the lantern breaks",
    instruction: "open the ember lantern and click the paper moon to shatter it",
    parts: [
      {
        id: "luna-shell",
        label: "Shell",
        className: "presentation-part-luna-shell",
        anchorX: -50,
        anchorY: -18,
        mark: "contours",
        scatterX: -92,
        scatterY: -48,
        scatterZ: 80,
        baseZ: 18,
        rotation: -8,
      },
      {
        id: "luna-shards",
        label: "Shard constellation",
        className: "presentation-part-luna-shards",
        anchorX: 52,
        anchorY: -28,
        mark: "nodes",
        scatterX: 94,
        scatterY: -42,
        scatterZ: 62,
        baseZ: 30,
        rotation: 7,
      },
      {
        id: "luna-ring",
        label: "Impact ring",
        className: "presentation-part-luna-ring",
        anchorX: 18,
        anchorY: 34,
        mark: "route",
        scatterX: 34,
        scatterY: 86,
        scatterZ: 94,
        baseZ: 42,
        rotation: -5,
      },
      {
        id: "luna-core",
        label: "Core",
        className: "presentation-part-luna-core",
        anchorX: -82,
        anchorY: 42,
        mark: "type",
        markLabel: "LX",
        scatterX: -116,
        scatterY: 74,
        scatterZ: 70,
        baseZ: 38,
        rotation: 12,
      },
    ],
  },
  loadPage: () => import("./web/ExplosionLunaPage"),
};

export default explosionLuna;
```

### Relevant CSS (portfolio/shell/src/styles.css)

The stylesheet is one file, ~1800 lines. Blocks not shown here belong to other projects — do not reference them. All blocks below are verbatim; brace style follows the file's own convention.

```css
/* Design tokens actually used by the artwork (excerpt of :root; the page
   ground is --ink-bg #0b1317; --index-ink #171a1c is the artwork panel's
   default ground). */
:root {
  --index-bg: #e4e5e1;
  --index-ink: #171a1c;
  --ink-bg: #0b1317;
  --ink-text: #eeeae0;
  --ink-muted: rgba(238, 234, 224, 0.68);
  --ink-faint: rgba(238, 234, 224, 0.48);
  --ink-line: rgba(238, 234, 224, 0.26);
  --ink-line-soft: rgba(238, 234, 224, 0.13);
  --ink-accent: #d39b61;
  --ink-accent-bright: #e8b57c;
  --sans: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
}
```

```css
/* Artwork panel base + parallax object + parts + caption (verbatim) */
.project-artwork {
  position: relative;
  min-height: 220px;
  order: 2;
  overflow: hidden;
  border: 1px solid var(--ink-line-soft);
  perspective: 900px;
  --panel-line: rgba(238, 234, 224, 0.18);
  --art-pin: #dd6f63;
  background: var(--index-ink);}

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

.project-artwork-part {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  place-items: center;
  transform: translate3d(calc(-50% + var(--anchor-x)), calc(-50% + var(--anchor-y)), var(--base-z)) rotate(var(--part-rotation));
  transform-style: preserve-3d;
  transition: transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1), filter 180ms ease;}

.project-artwork:hover .project-artwork-part,
.signal-index-card:hover .project-artwork-part,
.signal-index-card:focus-visible .project-artwork-part {
  filter: brightness(1.04);}

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
/* Center chip base; raft/blast override it to a transparent SVG box.
   The chip translateZ(78px) is part of the parallax depth — custom center
   boxes keep their own transforms below. (verbatim) */
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
```

```css
/* ===== Raft Cluster (verbatim; this is the block you may replace) ===== */
.presentation-raft-cluster {
  --project-accent: #63c7c3;
  --project-ink: #0e1a19;
  --project-surface: rgba(99, 199, 195, 0.08);
  background: linear-gradient(165deg, #10201e 0%, #0b1413 70%);
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
  width: 120px;
  height: 96px;
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
    width: 94px;
    height: 76px;
  }
}
```

```css
/* ===== Explosion (verbatim; this is the block you may replace) =====
   Note: the ::before is a squashed ellipse "orbit" ring; the core has a
   hover lift; the shards part re-colours the generic nodes glyph teal. */
.presentation-explosion-luna {
  --project-accent: #ff8a3c;
  --project-ink: #f2e9da;
  --project-surface: #171013;
  position: relative;
  background:
    radial-gradient(circle at 48% 48%, rgba(255, 128, 65, 0.14), transparent 30%),
    linear-gradient(135deg, #1a1013, #0b1013 70%);
}

.presentation-explosion-luna::before {
  position: absolute;
  inset: 10% 12%;
  border: 1px solid rgba(242, 233, 218, 0.14);
  border-radius: 50%;
  content: "";
  transform: scaleY(0.42);
}

.presentation-part-luna-shell {
  width: 156px;
  height: 112px;
  border: 1px solid rgba(255, 191, 111, 0.42);
  border-radius: 46% 54% 52% 48%;
  color: #ffbd6f;
  background: rgba(255, 138, 60, 0.07);
  box-shadow: inset 0 0 16px rgba(255, 138, 60, 0.08);
}

.presentation-part-luna-shards {
  width: 136px;
  height: 100px;
  color: #63c7c3;
}

.presentation-part-luna-shards .project-mark-nodes {
  transform: rotate(17deg) scale(1.1);
}

.presentation-part-luna-ring {
  width: 214px;
  height: 48px;
  color: #ff7448;
}

.presentation-part-luna-core {
  width: 62px;
  height: 62px;
  border: 1px solid #ffbd6f;
  border-radius: 50%;
  color: #ffe3b1;
  background: radial-gradient(circle at 35% 30%, #fff0c8, #ff8a3c 48%, #7e2f22 100%);
  box-shadow: 0 0 14px rgba(255, 119, 72, 0.38);
}

.presentation-explosion-luna:hover .presentation-part-luna-core,
.signal-index-card:hover .presentation-part-luna-core,
.signal-index-card:focus-visible .presentation-part-luna-core {
  transform: translate3d(calc(-50% + var(--anchor-x)), calc(-50% + var(--anchor-y) - 5px), calc(var(--base-z) + 12px)) rotate(var(--part-rotation));
}

/* The existing ≤700px block — CAUTION: it also resizes the kitty center
   (.center-kitty), which belongs to another project and must survive. */
@media (max-width: 700px) {
  .presentation-part-luna-shell { transform: scale(0.86); }
  .presentation-part-luna-shards { transform: scale(0.86); }
  .presentation-part-luna-ring { transform: scale(0.82); }
  .project-artwork-center.center-kitty {
    width: 68px;
    height: 56px;
  }
}
```

```css
/* Shared custom center-mark boxes (verbatim; the fox is the quality bar).
   You may resize center-raft / center-blast here, but the shared selectors
   also cover filetree/fox/spiral/trail — do not weaken them. */
.project-artwork-center.center-filetree,
.project-artwork-center.center-fox,
.project-artwork-center.center-blast,
.project-artwork-center.center-spiral,
.project-artwork-center.center-trail {
  width: 124px;
  height: 102px;
  border: none;
  background: transparent;
  overflow: visible;
}

.project-artwork-center.center-filetree { width: 116px; height: 96px; }
.project-artwork-center.center-blast { width: 108px; height: 108px; }
.project-artwork-center.center-spiral { width: 128px; height: 104px; }

.project-artwork-center.center-filetree svg,
.project-artwork-center.center-fox svg,
.project-artwork-center.center-blast svg,
.project-artwork-center.center-spiral svg,
.project-artwork-center.center-trail svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.signal-index-card:hover .center-blast svg,
.signal-index-card:focus-visible .center-blast svg {
  transform: scale(1.09);
}

@media (max-width: 700px) {
  .project-artwork-center.center-filetree,
  .project-artwork-center.center-fox,
  .project-artwork-center.center-spiral,
  .project-artwork-center.center-trail {
    width: 92px;
    height: 76px;
  }

  .project-artwork-center.center-blast {
    width: 84px;
    height: 84px;
  }
}
```

## 7. Expected output format

Produce a single markdown document with exactly these sections:

1. **Design rationale** — ≤150 words per card + ≤80 words on the ground fix. Name the concrete visual idea (the "one thing" each illustration is about) and why it separates from the page.
2. **Changes** — a numbered list. Every change is one drop-in block:
   - `File: <path>` then **what to replace**: either "replace the function `RaftCenterMark` entirely" / "replace the CSS block starting `.presentation-raft-cluster {` and ending before `.presentation-part-raft-voters`" / "insert after block X" — the anchor must be unambiguous given the code included above.
   - Then the **complete** new code in a fenced block with the right language tag. No ellipses, no "unchanged", no diff format — full bodies only.
   - If you edit a shared selector (e.g. the shared custom-center block), restate the full new selector list so nothing is lost.
3. **Optional block** (only if you propose an all-six-panels ground fix): same format, clearly labelled optional, and generic (must not depend on the four panels' code that isn't shown).
4. **Integration notes** — anything the integrating agent must double-check (e.g. "the media block must keep the `.center-kitty` rule", "if typecheck fails on the new union member, the edit is in project-presentation.ts line N"). Also state what to eyeball in the dev server (desktop + ≤700px).

Rules for the code itself:

- Keep the existing ids/class names (`center-raft`, `center-blast`, `presentation-part-raft-*`, `presentation-part-luna-*`) unless you renamed them deliberately and listed every site.
- If you shrink the parts array or empty it (a single-hero composition is allowed), that's fine — the render shell tolerates zero parts. If you keep parts, keep their hover micro-motions coherent (the generic hover rules for `nodes`/`branches`/`route`/`pin` still apply; per-project overrides are allowed).
- SVG viewBoxes are free; the center box is ~120×96 CSS px (blast ~108×108) inside a 260×190 object inside a ≥220px-tall panel. Design for those proportions; the parallax tilt is ±5–7°.
- Ground fix idea space (guidance, not a mandate): a genuinely different value/temperature per project (lighter warm paper field, deeper saturated tinted field with a vignette, duotone gradient) that still harmonises with ochre accents and mono captions — while the page around the cards stays the near-black field it is.
- Do not introduce scroll-driven or time-driven animation; hover/reveal transitions only.

## 8. What the integrating agent will run (FYI)

- `npm --prefix portfolio run typecheck` must pass.
- `npm --prefix portfolio run dev` → http://localhost:5173 for visual check; cards are below the hero. Both cards must look right at desktop width and at ≤700px, revealed and mid-reveal, hovered and not.
