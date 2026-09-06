# Task brief — fresh concept for the project cards (full creative freedom)

You are a design-minded front-end designer. You have **no access to the repository or any prior conversation** — everything you need is in this brief. Return a **concept document only, no production code**: precise enough that another agent implements it without follow-up questions. Keep it tight (~700–1000 words), specs over prose.

## 1. The product
Personal portfolio of a senior developer. React 19 + Vite + TypeScript, one plain-CSS stylesheet, zero runtime dependencies on the landing page. The landing ("ink catalogue"): near-black warm field `#0b1317`, cream text `#eeeae0`, ochre accent `#d39b61`/`#e8b57c`, IBM Plex Sans + Mono, subtle film grain, content column max-width 1280px.

- **Hero (settled — do not touch):** full-viewport Canvas2D "stable-fluids ink" simulation rendered as ordered-dither marks in ink/ochre; left-aligned scrim panel with mono kicker `currents`, headline "prototypes & small machines", mono note `stable-fluids · ordered-dither · canvas2d · no webgl`; below it a numbered "beneath the surface" rail listing the six projects.
- Below the hero: **six project cards — the subject of this task.**

## 2. The six projects (fixed copy, display order)
1. **Raft Cluster** — distributed systems — "Live Raft consensus in the browser — crash the leader and watch elections answer." — Rust · WebAssembly · TypeScript · Canvas 2D
2. **Cat Runner** — game — "A pastel endless runner with a bullet-time dash, a ghost of your best run, and a soundtrack that plays along." — React Three Fiber · Three.js · TypeScript · Procedural vector art · WebAudio · Deterministic simulation
3. **Evening Forest** — walk — "Wander an 8-bit woodland at dusk — no missions, just the walk." — React Three Fiber · Three.js · TypeScript · Custom shaders · Procedural animation · WebAudio
4. **Explosion** — physics — "a paper-lantern moon that detonates into the 600 shards it is built from — physics runs in fragment shaders on the gpu, not the cpu. click to blast, click to restore." — React 19 · three.js · GPGPU · Rust · WebAudio
5. **Planck to Now** — sim — "Scrub cosmic history — from the Planck epoch to now." — TypeScript · Three.js · WebGL
6. **Practice Map** — map — "Keep concepts, small exercises, and useful things to revisit in one quiet place." — React · TypeScript · Local state

## 3. Current card anatomy (being replaced — know it to break it)
Each card is a full-width `<a>` row, hairline-separated on the bottom edge, stacked single-column:
- topline: `01 / distributed systems` (left, mono) + the full tech list joined by `·` (right)
- body grid: copy column (title, description, "open ↗") ≈0.85fr | boxed artwork panel minmax(280px, 1fr)
- artwork panel: dark box `min-height: 220px` containing a 260×190 pointer-parallax object (CSS-var 3D tilt) with one central SVG subject, scattered geometric accents, and a small caption

**Owner verdict: the cards feel oversized. Rethink proportions and hierarchy from scratch.** All recent artwork is disregarded — do not anchor on it.

## 4. Decision history you must honour
- **Rejected, do not resurrect:** lighthouse + periwinkle `#8f8cf3` Raft identity; teal Raft identity; azure leader-election constellation with quorum backdrop; log-spine election marks; indigo-night panel grounds; thin-hairline consensus-diagram marks; scattered free-floating chips.
- **Rejected heroes (taste context):** curl-noise "streamline filings"; giant viewport-filling display type. The settled bar from those rounds: **"bold feeling but minimalistic"** — the page of a senior frontend designer.
- **Hue history:** the two rejected Raft hues were both cool; the other five cards were warm hues. Nothing is sacred now — but be deliberate about the palette system.
- **Lesson learned:** past attempts over-indexed on matching the hero (dark ink fields, thin geometry, catalogue restraint) and it hurt the result. **Consistency with the hero is a light guideline, not a constraint.**
- **One standing requirement:** the Raft card must read as *system design* at a glance — the owner is a senior developer and the portfolio must show system-design fluency.

## 5. Aesthetic direction
**Simple, bright, and bold — especially the animated illustrations.** Reference: the GitHub homepage hero (image attached; if missing: deep-indigo night sky, huge confident sans headline, playful glossy 3D mascot blobs with soft glow floating in space — cute, chunky, luminous shapes, few elements, high-contrast pops on a dark ground). That energy is the target for the card illustrations: subjects with real mass and light, not thin line diagrams.

## 6. The task
Design a fresh card-system concept that stands on its own but feels at home on this page. Specify:
1. **Layout & hierarchy** — grid/columns, card footprint (target heights in px at 1440w and 390w), what leads (art vs copy), how the topline/tech metadata is compacted (tech lists run up to 6 items), spacing rhythm, and how six cards present without the page feeling bloated.
2. **Illustration style guide** — one coherent family: rendering technique, shape language, light/glow treatment, per-card background treatment, palette system (per-project hues vs shared), plus a one-line subject per project that reads instantly (Raft = system design; Cat Runner = game; Evening Forest = walk; Explosion = physics blast; Planck to Now = cosmic timeline; Practice Map = personal map).
3. **Motion** — idle "alive" behaviour, hover/focus, scroll-reveal entrance (must respect §7), reduced-motion fallback. Prefer cheap transforms; 60fps budget.
4. **Fit** — how the cards meet the hero without over-matching it; state explicitly where you deliberately deviate.

## 7. Hard constraints (implementation reality)
- Cards are semantic `<a>` elements; keyboard focus states required; artwork is `aria-hidden`.
- Scroll-reveal: rAF scroll-position math is the source of truth (a past IntersectionObserver bug permanently hid a card straddling the viewport top). Nothing may hide content under `prefers-reduced-motion: reduce` or without JS. Keep the reveal-band + stagger concept; the entrance styling itself may change.
- Landing stack: React 19 + one plain-CSS file. Illustrations must be inline SVG, CSS, or small Canvas2D — **no WebGL, no new dependencies, no image assets**. No blur filters or fog effects (named past failures).
- Review viewports: 1440w desktop and 390w mobile; 320w must not overflow.
- Do not propose changes to the hero, header, or beneath-rail (adjacent seating only).

## 8. Output format
1. **Direction** — a name + 3-sentence pitch.
2. **Layout & sizing spec** — concrete numbers (px/clamp), desktop + mobile.
3. **Illustration style guide** — family rules + a per-card subject/hue table.
4. **Motion spec** — idle / hover / reveal / reduced.
5. **Deliberate deviations** — where and why you leave the hero's shadow.
6. **Alternates rejected** — 2 one-liners with reasons (the owner keeps a decision ledger; these get recorded).

No production code. Total ~700–1000 words.
