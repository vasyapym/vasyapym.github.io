# BRIEF — Card artwork polish elevation ("Gemstones, cut & set")

You are designing the six project-card illustrations for a dark, editorial
developer-portfolio landing page. This is a **polish-and-relevance pass on an
existing design you should evolve, not replace**. Deliverable: a complete
replacement `ProjectArtwork.tsx` (six inline-SVG marks) plus at most a tiny
list of CSS value tweaks.

---

## 1. Situation & design history (do not relitigate)

- The landing page shows six project cards in a two-up grid. Each card =
  art stage (200px tall desktop / 150px mobile, panel ground `#0f1b20`) over a
  copy block (topline index+tag, title, 2-line description, footer tech row +
  "open ↗"). **You are not changing this structure.**
- Current direction is called **"Gemstones"** (round 3). It replaced two
  rejected rounds (an oversized full-bleed layout; a flat-scrim plate system).
  Its accepted qualities: chunky glossy radial-gradient SVG subjects, one
  saturated accent hue per card, layered-halo glow (no blur filters), ochre
  `#e8b57c` as the shared secondary pop, alive idle motion.
- The owner's verdict this round, verbatim intent:
  > "I really like the existing project cards, including the illustrations.
  > But the illustrations feel too playful/informal for a senior developer
  > portfolio. Make the illustration more about the project — relevant to the
  > content of the inner page. Keep the overall structure and feel of the
  > current cards, but elevate them to look polished and professional.
  > I choose: retain the current style while making it look visually
  > flawless. Do not lose the qualities I already like; improve on them."
- So the direction is **fixed**: same glossy-gem family, same hues, same
  layout — better cut. No minimal/flat/line-art pivot. No cuter.

### Standing ledger constraints (from prior rounds, still binding)

- Raft's card must read as **system design** at a glance.
- Raft's identity stays a **warm hue** (electric coral) — all cool Raft
  identities were tried and rejected in earlier rounds.
- Keep: IBM Plex type, ochre meta accent, film grain, mono topline — these
  live outside the artwork; don't fight them.
- The hero section is monochrome ink/ochre; the cards are deliberately the
  polychrome counterweight. Don't de-saturate the cards to match the hero.

### Why the current art reads "playful" (diagnosis to fix)

- Mascot energy: a crowned blob leader, a chubby cat with stub legs, a comic
  starburst — cute, not senior.
- The halos are big centered filled ellipses; at low opacity on the dark
  stage they read as dark blots / fried eggs behind every subject.
- Proportions are lumpy; light source and gradient geometry vary per card;
  some cards are sparse and generic (two floating pins, one orb + arc).

---

## 2. What each mark must depict (project-relevance spec)

The six projects and what their **inner pages actually show**. The mark must
evoke the page's real subject — its machine or scene — not a generic token.

| # | id / mark key | Accent hue | Inner page content | Mark spec |
|---|---|---|---|---|
| 1 | `raft` (Raft Cluster) | electric coral `#ff6a5f` | Live Raft consensus: a dark canvas with **5 round nodes in a ring, each showing its term number; the leader is highlighted with a ring**; teal `#4bb3a7` vote messages and red alerts fly along links between nodes; log bars with term-coloured segments; user can crash the leader / cut a link. | A precise **5-node consensus ring**: one clearly promoted leader (e.g. concentric leader-ring, not a cartoon crown — a tiny crown is acceptable only if it reads crisp and geometric), thick links, **one small message dot mid-flight on a link** (the page's vote-teal `#4bb3a7` is welcome for that single dot — it is the page's signature), optional term ticks as tiny marks on 1–2 nodes. Engineering diagram, rendered in gem materials. |
| 2 | `kitty` (Cat Runner) | candy pink `#ff8fbf` | A pastel 3D **endless runner**: rolling hills, the cat dashing with a bullet-time dash, a translucent **ghost of your best run** chasing/leading, combo hearts, soundtrack. (Inner page is mid-retheme to a brighter look by another work stream — keep the mark theme-neutral pastel runner, do not bake in any one level's look.) | The cat **in motion over a rolling hill line**: cleaner feline anatomy (streamlined arched body, pointed ears, flowing tail curve — no stub-rect legs), 2–3 speed streaks, a **faint ghost echo of the cat** trailing behind (the best-run echo is the project's signature feature), optionally one tiny heart. Scene-ify: it must read as "runner game", not "pet icon". |
| 3 | `fox` (Evening Forest) | forest teal `#4fd1a5` | A cozy **first-person 8-bit woodland walk at dusk**: layered tree silhouettes, dusk sky, moon, ambient fireflies, no missions. | **Depth-layered dusk woodland**: 2 depth rows of trees with varied silhouettes (round-canopy + conical mixed, back row smaller/darker), warm moon, 2–3 firefly dots, a gentle ground curve. Atmospheric depth instead of 3 identical blobs. |
| 4 | `blast` (Explosion) | molten amber `#ffb347` | A **paper-lantern moon** that detonates into the **600 shards** it is built from; embers; physics in GPGPU fragment shaders; click to blast, click to restore. | The lantern identity is what makes this project specific: a glowing sphere with **visible paper-lantern rib seams**, caught **mid-detonation** — two hemisphere halves separating, 5–7 chunky shards, a few tiny ember dots. NOT a comic starburst/bang glyph. |
| 5 | `spiral` (Planck to Now) | cosmic violet `#a98cff` | A log-time **cosmology scrub**: from the Planck epoch (hot dense origin) through first stars and galaxies to the cosmic web; you orbit, zoom and **scrub a timeline**. | The current orb + arc is the right DNA — keep it and tell the story: an **arc timeline with 3–4 epoch ticks of growing structure** (origin burst glow → bright core orb → small star → hint of web/cluster), plus the **scrubber dot** at the arc's end. |
| 6 | `trail` (Practice Map) | sky blue `#5cc8ff` | A quiet dark **practice map**: curved routes drawn as SVG paths with stops, pins, a faint tile grid, an ochre radial glow; "follow a route, mark a place, leave a note". | **A route, not just pins**: one curved route path connecting 2–3 pins/stops over the faint tile grid; one pin is a "you are here" current-position marker (small pulse ring around it is welcome). |

## 3. The polish system (how "flawless" is defined here)

Apply to every mark, consistently:

1. **One light source.** Every radial gradient uses the same geometry:
   light stop at cx ≈ 30–38%, cy ≈ 24–32% (top-left), hue mid at ~45–50%,
   darker same-family hue at 100%. No greys — dark stops stay in-hue.
2. **Halo rework.** Kill the dark-blot look. Use at most two glow layers:
   one wide faint stage glow and one tighter glow near the subject —
   opacity ≤ 0.18 outer, ≤ 0.10 inner, and shaped/composed so no hard
   ellipse silhouette reads against `#0f1b20`. At least one halo shape per
   mark must keep **class `gem-halo`** (it is the hover-brighten + pulse
   hook; see §5 CSS).
3. **Optical consistency.** Every subject occupies a similar bounding area
   (~55–70% of the 260-wide box), vertically centred with a consistent
   slight downward bias (grounded), consistent side margins. The six marks
   must look like one family shot by one photographer.
4. **Detail budget.** Max ~10 elements per mark including details. The
   "page-true" micro-details from §2 (message dot, ghost echo, fireflies,
   ember dots, epoch ticks, route dashes, term ticks) are small, geometric
   and quiet — ≤3 elements each, never clutter.
5. **Specular highlights.** One small elliptical highlight per primary
   mass (opacity 0.5–0.65, top-left aligned); a second micro-highlight is
   allowed only on the single most important element (leader node, orb).
6. **Shape language.** Chunky and rounded (the family trait). Rounded
   caps/joins; if you use strokes, keep them ≥5 units. Superellipse-ish
   mass, generous negative space.
7. **Silhouette test.** Each mark must be recognisable as its subject at
   100px wide, and unmistakable at full size (renders at max 260×160).
8. **Palette discipline.** Per card: one accent-hue family + ochre
   `#e8b57c` as the only shared secondary + neutral ink tones. Max 4
   distinct fills per subject (gradients of one hue count as one family;
   the single raft vote-teal dot is the one deliberate exception).

## 4. Technical contract

- File: `ProjectArtwork.tsx` — React + TypeScript, **strict mode compiles
  clean** (`tsc --noEmit`), no unused identifiers, no new dependencies,
  no external images, no `<filter>`/`<mask>`/CSS blur — shapes + gradients
  only.
- Keep the component's public shape exactly: default export
  `ProjectArtwork({ project }: ProjectArtworkProps)`, the pointer-parallax
  handler and `project-artwork` wrapper div unchanged, `CENTER_MARKS` with
  the same six keys `raft, kitty, fox, blast, spiral, trail`, `aria-hidden`
  SVGs, `viewBox="0 0 260 160"`.
- Gradient/halo ids must stay namespaced per mark (e.g. `gem-raft-…`,
  `gem-cat-…`) — six inline SVGs share one DOM.
- No text inside the art.
- Keep a one-line section comment per mark like the current
  `/* ── 1 · Raft Cluster — electric coral #ff6a5f ── */`.

## 5. CSS context you may rely on (and the one thing you may tweak)

Current rules (excerpt; do not restate, just design against them):

- Stage: `.project-artwork` is a 200px-tall (150px mobile) panel, ground
  `#0f1b20` with a faint top radial sheen; the SVG sits centred at
  `width: 82%; max-width: 260px; aspect-ratio: 260/160`.
- Idle: the whole svg breathes ±3px over 4s (CSS animation on
  `.project-artwork-center svg`), staggered per card.
- Halo hook: hover brightens via
  `.signal-index-card:hover .gem-halo { opacity: calc(var(--halo-opacity, 0.2) + 0.1); }`
  and two marks (raft, planck) run a `gem-halo-pulse` animation:
  `@keyframes gem-halo-pulse { 0%,100% { opacity: 0.12; } 50% { opacity: 0.25; } }`.
  - You may optionally set `--halo-opacity` on a `.gem-halo` shape's inline
    style so hover brightening is additive from the shape's true base
    opacity.
  - If your fainter halo system needs it, you may request **one** CSS value
    tweak: new percentage values for the two `gem-halo-pulse` keyframe
    stops (nothing else).

## 6. Current implementation (baseline to evolve)

The six marks below are the accepted Gemstones round. Evolve each subject
along §2/§3 — reuse what is good (palette, mass, gloss), fix proportions,
halos, and relevance. Note the pointer-parallax props (`--art-rotate-x/y`,
`--art-shift-x/y`) are set by the wrapper on `.project-artwork-object`.

```tsx
import { useRef, type PointerEvent, type ReactElement } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import type { ProjectCenter } from "../../../contracts/project-presentation";

type ProjectArtworkProps = { project: ProjectModule };

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

  const resetPointer = () => {
    if (!objectRef.current) return;
    const objectStyle = objectRef.current.style;
    objectStyle.setProperty("--art-rotate-x", "0deg");
    objectStyle.setProperty("--art-rotate-y", "0deg");
    objectStyle.setProperty("--art-shift-x", "0px");
    objectStyle.setProperty("--art-shift-y", "0px");
  };

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
  raft: RaftCenterMark,
  kitty: KittyCenterMark,
  fox: FoxCenterMark,
  blast: BlastCenterMark,
  spiral: SpiralCenterMark,
  trail: TrailCenterMark,
};

function CenterMark({ mark, label }: { mark: ProjectCenter; label: string }) {
  const Component = CENTER_MARKS[mark];
  if (!Component) return <>{label}</>;
  return <Component />;
}

/* ── 1 · Raft Cluster — electric coral #ff6a5f ── */
function RaftCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-raft-leader" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffd7c2" />
          <stop offset="45%" stopColor="#ff6a5f" />
          <stop offset="100%" stopColor="#8f2b28" />
        </radialGradient>
        <radialGradient id="gem-raft-node" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffc7b8" />
          <stop offset="50%" stopColor="#ff6a5f" />
          <stop offset="100%" stopColor="#7d2723" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="130" cy="80" rx="96" ry="66" fill="#ff6a5f" opacity="0.25" />
      <ellipse className="gem-halo" cx="130" cy="80" rx="64" ry="46" fill="#ff8f86" opacity="0.12" />
      <g stroke="#ff9d8f" strokeWidth="7" strokeLinecap="round" opacity="0.85">
        <line x1="130" y1="80" x2="130" y2="32" />
        <line x1="130" y1="80" x2="201" y2="65" />
        <line x1="130" y1="80" x2="174" y2="119" />
        <line x1="130" y1="80" x2="86" y2="119" />
        <line x1="130" y1="80" x2="59" y2="65" />
      </g>
      <circle cx="130" cy="32" r="14" fill="url(#gem-raft-node)" />
      <circle cx="201" cy="65" r="14" fill="url(#gem-raft-node)" />
      <circle cx="174" cy="119" r="14" fill="url(#gem-raft-node)" />
      <circle cx="86" cy="119" r="14" fill="url(#gem-raft-node)" />
      <circle cx="59" cy="65" r="14" fill="url(#gem-raft-node)" />
      <circle cx="130" cy="80" r="20" fill="url(#gem-raft-leader)" />
      <polygon points="116,64 122,52 130,62 138,52 144,64" fill="#e8b57c" />
      <ellipse cx="123" cy="72" rx="6" ry="4" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

/* ── 2 · Cat Runner — candy pink #ff8fbf ── */
function KittyCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-cat-body" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffe1ef" />
          <stop offset="45%" stopColor="#ff8fbf" />
          <stop offset="100%" stopColor="#a33a72" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="132" cy="82" rx="94" ry="60" fill="#ff8fbf" opacity="0.24" />
      <ellipse className="gem-halo" cx="132" cy="82" rx="58" ry="40" fill="#ffb3d4" opacity="0.12" />
      <rect x="24" y="70" width="52" height="9" rx="4.5" fill="#e8b57c" opacity="0.9" />
      <rect x="30" y="88" width="40" height="9" rx="4.5" fill="#ff8fbf" opacity="0.8" />
      <rect x="20" y="106" width="34" height="9" rx="4.5" fill="#ff8fbf" opacity="0.55" />
      <g transform="rotate(-16 150 92)">
        <path d="M 110 96 Q 84 96 92 70" stroke="#ff8fbf" strokeWidth="11" strokeLinecap="round" fill="none" />
        <ellipse cx="150" cy="92" rx="46" ry="27" fill="url(#gem-cat-body)" />
        <rect x="150" y="108" width="12" height="22" rx="6" fill="#e173a6" />
        <rect x="176" y="102" width="12" height="22" rx="6" fill="#e173a6" />
      </g>
      <circle cx="196" cy="70" r="22" fill="url(#gem-cat-body)" />
      <polygon points="180,54 184,38 196,52" fill="#ff8fbf" />
      <polygon points="212,54 208,38 196,52" fill="#ff8fbf" />
      <ellipse cx="188" cy="62" rx="7" ry="5" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

/* ── 3 · Evening Forest — teal-green #4fd1a5 ── */
function FoxCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-fox-tree" cx="38%" cy="26%" r="82%">
          <stop offset="0%" stopColor="#c9f7e6" />
          <stop offset="48%" stopColor="#4fd1a5" />
          <stop offset="100%" stopColor="#1c6e57" />
        </radialGradient>
        <radialGradient id="gem-fox-moon" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffe6c4" />
          <stop offset="100%" stopColor="#e8b57c" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="130" cy="78" rx="96" ry="60" fill="#4fd1a5" opacity="0.22" />
      <ellipse className="gem-halo" cx="130" cy="72" rx="56" ry="40" fill="#7ee3c2" opacity="0.12" />
      <circle cx="206" cy="44" r="15" fill="url(#gem-fox-moon)" />
      <path d="M 34 140 Q 130 108 226 140" stroke="#1c6e57" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M 78 118 Q 66 74 92 60 Q 118 74 106 118 Z" fill="url(#gem-fox-tree)" />
      <path d="M 128 122 Q 114 64 146 46 Q 178 64 164 122 Z" fill="url(#gem-fox-tree)" />
      <path d="M 176 118 Q 166 78 190 64 Q 214 78 204 118 Z" fill="url(#gem-fox-tree)" />
      <ellipse cx="138" cy="72" rx="6" ry="9" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

/* ── 4 · Explosion — molten amber #ffb347 ── */
function BlastCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-blast-core" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#fff0cf" />
          <stop offset="45%" stopColor="#ffb347" />
          <stop offset="100%" stopColor="#8a4712" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="130" cy="80" rx="98" ry="64" fill="#ffb347" opacity="0.25" />
      <ellipse className="gem-halo" cx="130" cy="80" rx="60" ry="44" fill="#ffcf87" opacity="0.13" />
      <g>
        <polygon points="130,80 150,30 158,58" fill="#ffcf87" />
        <polygon points="130,80 196,44 182,72" fill="#ffb347" />
        <polygon points="130,80 214,92 184,102" fill="#e8b57c" />
        <polygon points="130,80 176,132 154,116" fill="#ffb347" />
        <polygon points="130,80 108,136 128,116" fill="#ffcf87" />
        <polygon points="130,80 60,120 92,104" fill="#e8b57c" />
        <polygon points="130,80 44,74 78,72" fill="#ffb347" />
        <polygon points="130,80 82,34 104,58" fill="#ffcf87" />
      </g>
      <path d="M 130 54 A 26 26 0 0 0 130 106 Z" fill="url(#gem-blast-core)" />
      <path d="M 138 54 A 26 26 0 0 1 138 106 Z" fill="url(#gem-blast-core)" />
      <ellipse cx="120" cy="68" rx="6" ry="4" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

/* ── 5 · Planck to Now — cosmic violet #a98cff ── */
function SpiralCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-spiral-core" cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#efe7ff" />
          <stop offset="45%" stopColor="#a98cff" />
          <stop offset="100%" stopColor="#4b3a8c" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="118" cy="82" rx="96" ry="62" fill="#a98cff" opacity="0.25" />
      <ellipse className="gem-halo" cx="118" cy="82" rx="58" ry="42" fill="#c6b4ff" opacity="0.13" />
      <path d="M 46 120 Q 130 20 224 78" stroke="#7c63d6" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.85" />
      <circle cx="118" cy="82" r="30" fill="url(#gem-spiral-core)" />
      <circle cx="224" cy="78" r="10" fill="#e8b57c" />
      <ellipse cx="108" cy="72" rx="8" ry="5" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

/* ── 6 · Practice Map — sky blue #5cc8ff ── */
function TrailCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-trail-pin" cx="36%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#d6f2ff" />
          <stop offset="46%" stopColor="#5cc8ff" />
          <stop offset="100%" stopColor="#1d6f9e" />
        </radialGradient>
        <radialGradient id="gem-trail-pin-alt" cx="36%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffe6c4" />
          <stop offset="55%" stopColor="#e8b57c" />
          <stop offset="100%" stopColor="#9c6a34" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="130" cy="82" rx="96" ry="60" fill="#5cc8ff" opacity="0.22" />
      <ellipse className="gem-halo" cx="130" cy="82" rx="56" ry="40" fill="#8fdaff" opacity="0.12" />
      <g fill="#274a5c" opacity="0.55">
        <rect x="86" y="52" width="24" height="24" rx="6" />
        <rect x="118" y="52" width="24" height="24" rx="6" />
        <rect x="150" y="52" width="24" height="24" rx="6" />
        <rect x="86" y="84" width="24" height="24" rx="6" />
        <rect x="118" y="84" width="24" height="24" rx="6" />
        <rect x="150" y="84" width="24" height="24" rx="6" />
        <rect x="86" y="116" width="24" height="24" rx="6" />
        <rect x="118" y="116" width="24" height="24" rx="6" />
        <rect x="150" y="116" width="24" height="24" rx="6" />
      </g>
      <path d="M 108 44 Q 92 44 92 62 Q 92 78 108 92 Q 124 78 124 62 Q 124 44 108 44 Z" fill="url(#gem-trail-pin)" />
      <path d="M 168 60 Q 154 60 154 76 Q 154 90 168 102 Q 182 90 182 76 Q 182 60 168 60 Z" fill="url(#gem-trail-pin-alt)" />
      <circle cx="108" cy="62" r="6" fill="#0f1b20" opacity="0.6" />
      <ellipse cx="102" cy="54" rx="5" ry="4" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}
```

## 7. Expected output format (exactly this, nothing else)

1. **One code block**: the complete new `ProjectArtwork.tsx` file, ready to
   drop in.
2. **`CSS deltas:`** section — either `none` or a short list of exact
   `selector { property: value; }` changes (per §5, pulse-stop values and/or
   nothing else).
3. **Per-card rationale** — six bullets, 1–2 sentences each: what the mark
   now depicts and which polish rules did the heavy lifting.
