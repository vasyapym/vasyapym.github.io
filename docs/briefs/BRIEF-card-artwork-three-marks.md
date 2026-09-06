# BRIEF — Redraw three project-card marks (Raft · Kitty · Planck)

You are designing three inline-SVG illustrations for the project cards on a portfolio landing page. You have no access to the repository; everything you need is in this brief. Your output will be integrated verbatim into a React TSX file by an integrating agent.

## 1. Where these live

Each portfolio project card has an art stage (dark plate `#0b1317`, 200px tall) showing one decorative SVG "mark" — a chunky printed-halftone illustration, viewBox `0 0 260 160`. The page's whole visual language is "printed halftone": discrete stepped tones instead of smooth gradients, dot-screen patterns for glow/texture, square dither glints as speculars, warm ink neutrals for context masses. This language was explicitly approved by the owner — your job is to redraw **the subjects** of three marks, not to change the language.

There are six marks on the page. Three are fine and must not be touched (`gem-fox-*`, `gem-blast-*`, `gem-trail-*` id prefixes are taken). You redraw the other three, keeping their id prefixes `gem-raft-*`, `gem-cat-*`, `gem-spiral-*`.

## 2. Hard technique rules (the family language — obey all)

- Pure SVG primitives inside one `<svg viewBox="0 0 260 160" aria-hidden="true">` per mark. No text, no images, no CSS classes inside the SVG except the one halo hook (below). No `filter`/`feGaussianBlur`.
- **Dot screens:** `<pattern>`s of circles. Dense = 7×7 tile, circle r 1.9. Sparse = 11×11 tile, circle r 1.6. Used for glow halos and texture fills, never wall-to-wall (a guardrail from an earlier rejection: big dither fields read as dirt; plates stay clean).
- **Stepped tones, not gradients:** each subject = deep base fill + 1–2 clipped lighter caps (use `<clipPath>` of the subject shape) — discrete tone steps like a printed poster.
- **Every mark has exactly one halo ellipse** with `className="gem-halo"` and `style={haloVar(base)}` where base ≤ 0.16. This is a CSS hover hook — one ellipse, dense-dot pattern fill, ell around the subject. It also pulses on two of the cards (CSS handles this; you only supply the element).
- **Square dither glints:** tiny white `<rect>`s (2.8–3.6px, opacity 0.4–0.65) as speculars — 1–2 per mark.
- **Ink-ramp neutrals** for context masses (hills, ground, background objects): `#26333b`, `#465059`, `#7d7669`, `#b6ac95`. Per-card accent hue concentrates on the focal subject; ochre `#e8b57c` is the shared secondary pop (small accents only).
- Chunky shapes, thick strokes (4–10px), generous negative space. Roughly the same element count as the current marks (10–20 elements). Must stay legible at ~213px render width.
- The whole svg idles with a ±3px "breathe" animation (CSS) — design nothing that breaks under a tiny vertical bob.
- React/TSX function component per mark, no props, no hooks. A module-level helper exists: `const haloVar = (base: number): CSSProperties => ({ "--halo-opacity": base } as unknown as CSSProperties);` — use it for the halo ellipse only.

## 3. The three redraws — direction per mark

### 3.1 Raft Cluster — "system design, architectural complexity"

Project: a live Raft consensus visualizer (Rust/WASM; "crash the leader and watch elections answer"). The standing owner requirement (repeated across review rounds): **the illustration must read as system design for a senior-dev portfolio** — distributed nodes, interconnections, consensus/log flow. The current mark is a 5-node pentagon with a crowned leader; it reads as generic decoration, not as a system.

Redraw direction:
- A **consensus cluster as architecture**: one clear leader node + 3–4 follower nodes, connected by **thick interconnect links** (stroke, 4–6px) that visibly form a topology (e.g. leader-to-every-follower fan plus follower ring/mesh edges).
- **Log flow**: small square "log entries" (ochre `#e8b57c`, 3–5px) riding the leader→follower links — consensus is a log replication story.
- Leader distinct: ring/halo around it (election authority), a crown or tick marks as now is fine but subtler.
- Keep hue discipline: coral `#ff6a5f` accent (mid tone), deep `#7d2723` bases, light caps `#ffd0c2`/`#ffe0d2`, ring stroke `#ffb1a6`. (Hue history: teal, periwinkle, indigo were all rejected for this card — coral stays.)
- Composition idea (not mandatory): asymmetric layout — leader slightly left-of-centre, followers at varied radii, links at varied angles — so it reads as a real distributed system rather than a mandala. Vary node sizes slightly (leader largest).
- Current code (evolve or restart, your call):

```tsx
/* ── 1 · Raft Cluster — electric coral #ff6a5f ── */
function RaftCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#ff6a5f" />
        </pattern>
        <clipPath id="gem-raft-n1"><circle cx="176" cy="63" r="14" /></clipPath>
        <clipPath id="gem-raft-n2"><circle cx="158" cy="117" r="14" /></clipPath>
        <clipPath id="gem-raft-n3"><circle cx="102" cy="117" r="14" /></clipPath>
        <clipPath id="gem-raft-n4"><circle cx="84" cy="63" r="14" /></clipPath>
        <clipPath id="gem-raft-lead"><circle cx="130" cy="30" r="15" /></clipPath>
      </defs>
      <ellipse cx="130" cy="80" rx="104" ry="66" fill="url(#gem-raft-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.16)} cx="130" cy="80" rx="64" ry="42" fill="url(#gem-raft-dense)" opacity="0.16" />
      <ellipse cx="130" cy="35" rx="24" ry="18" fill="url(#gem-raft-dense)" opacity="0.14" />
      <path d="M 130 30 L 176 63 L 158 117 L 102 117 L 84 63 Z" stroke="#7d7669" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
      <circle cx="176" cy="63" r="14" fill="#7d2723" />
      <g clipPath="url(#gem-raft-n1)"><circle cx="172" cy="58" r="11" fill="#ff6a5f" /><circle cx="170" cy="56" r="6" fill="#ffd0c2" /></g>
      <circle cx="158" cy="117" r="14" fill="#7d2723" />
      <g clipPath="url(#gem-raft-n2)"><circle cx="154" cy="112" r="11" fill="#ff6a5f" /><circle cx="152" cy="110" r="6" fill="#ffd0c2" /></g>
      <circle cx="102" cy="117" r="14" fill="#7d2723" />
      <g clipPath="url(#gem-raft-n3)"><circle cx="98" cy="112" r="11" fill="#ff6a5f" /><circle cx="96" cy="110" r="6" fill="#ffd0c2" /></g>
      <circle cx="84" cy="63" r="14" fill="#7d2723" />
      <g clipPath="url(#gem-raft-n4)"><circle cx="80" cy="58" r="11" fill="#ff6a5f" /><circle cx="78" cy="56" r="6" fill="#ffd0c2" /></g>
      <circle cx="130" cy="30" r="20" fill="none" stroke="#ffb1a6" strokeWidth="4" opacity="0.9" />
      <circle cx="130" cy="30" r="15" fill="#8f2b28" />
      <g clipPath="url(#gem-raft-lead)"><circle cx="126" cy="25" r="11.5" fill="#ff6a5f" /><circle cx="124" cy="23" r="6" fill="#ffe0d2" /></g>
      <g fill="#e8b57c">
        <rect x="169" y="52" width="3" height="7" rx="1.5" />
        <rect x="176" y="52" width="3" height="7" rx="1.5" />
      </g>
      <circle cx="160" cy="51" r="4.5" fill="#4bb3a7" />
      <rect x="123" y="22" width="3.4" height="3.4" fill="#ffffff" opacity="0.65" />
      <rect x="77" y="57" width="3" height="3" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}
```

### 3.2 Cat Runner — "Hello Kitty clarity, simple & cute"

Project: a pastel endless runner starring a kitty ("bullet-time dash, a ghost of your best run"). The current cat is an abstract pink blob mid-leap — owner verdict: **lacks a clean, recognizable style**. New direction: channel **Hello Kitty** — instantly recognizable, simple, cute:

- Big wide round head (wider than tall), two small **pointy triangular ears** on top, tiny oval body below. Head : body ≈ 2:1.
- **No mouth.** Two small dark oval eyes (`#26333b` ink), one small ochre `#e8b57c` oval nose centred slightly low (this maps the canonical yellow nose onto the shared ochre pop).
- **Three whiskers per side** — short strokes (1.5–2px) in ink `#26333b` or soft pink, radiating from the cheeks.
- A **chunky bow** on one ear in the card hue pink `#ff8fbf` (deep tone `#a33a72` step, light cap `#ffe1ef`).
- Face/body fill: warm white/cream (e.g. `#fff4ec` / `#ffe9f2` tones) so the pink concentrates in bow + accents; outline-free, tone steps via clipped caps.
- Keep it project-true: slight forward lean / mid-run pose, plus 2–3 short speed-streak bars behind (soft pink, current style) — running, not sitting. Ground shadow/context mass in ink neutrals optional.
- Keep the approved "best-run ghost" trait if it survives cleanly: a detached ~0.16-opacity simplified second-cat echo offset up-left (the previous blob-ghost was a judged defect; only include a ghost if it reads as a crisp simplified echo, otherwise drop it).
- Current code (evolve or restart, your call):

```tsx
/* ── 2 · Cat Runner — candy pink #ff8fbf ── */
function KittyCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-cat-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff8fbf" />
        </pattern>
        <pattern id="gem-cat-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#ff8fbf" />
        </pattern>
        <clipPath id="gem-cat-body"><path d="M 150 92 Q 124 76 134 60 Q 152 52 170 62 Q 186 72 180 90 Q 166 100 150 92 Z" /></clipPath>
        <clipPath id="gem-cat-head"><circle cx="186" cy="66" r="15" /></clipPath>
      </defs>
      <ellipse cx="140" cy="80" rx="104" ry="62" fill="url(#gem-cat-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.15)} cx="140" cy="80" rx="62" ry="40" fill="url(#gem-cat-dense)" opacity="0.15" />
      <g opacity="0.16" fill="#ff8fbf" transform="translate(-64 -12) scale(0.9)">
        <path d="M 150 92 Q 124 76 134 60 Q 152 52 170 62 Q 186 72 180 90 Q 166 100 150 92 Z" />
        <circle cx="186" cy="66" r="15" />
        <polygon points="176,54 180,40 190,54" />
        <polygon points="192,54 200,40 202,56" />
      </g>
      <path d="M 34 122 Q 96 104 150 116 Q 196 124 232 110" stroke="#e8b57c" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />
      <g stroke="#ff8fbf" strokeWidth="6" strokeLinecap="round" opacity="0.55">
        <line x1="40" y1="66" x2="78" y2="66" />
        <line x1="32" y1="80" x2="80" y2="80" />
        <line x1="44" y1="94" x2="76" y2="94" />
      </g>
      <path d="M 144 80 Q 120 78 118 56" stroke="#ff8fbf" strokeWidth="10" strokeLinecap="round" fill="none" />
      <g stroke="#e173a6" strokeWidth="8" strokeLinecap="round">
        <line x1="166" y1="92" x2="174" y2="112" />
        <line x1="142" y1="92" x2="132" y2="112" />
      </g>
      <path d="M 150 92 Q 124 76 134 60 Q 152 52 170 62 Q 186 72 180 90 Q 166 100 150 92 Z" fill="#a33a72" />
      <g clipPath="url(#gem-cat-body)"><circle cx="150" cy="66" r="30" fill="#ff8fbf" /><circle cx="146" cy="62" r="14" fill="#ffe1ef" /></g>
      <circle cx="186" cy="66" r="15" fill="#a33a72" />
      <g clipPath="url(#gem-cat-head)"><circle cx="182" cy="61" r="12" fill="#ff8fbf" /><circle cx="179" cy="58" r="6" fill="#ffe1ef" /></g>
      <polygon points="176,54 180,40 190,54" fill="#ff8fbf" />
      <polygon points="192,54 200,40 202,56" fill="#ff8fbf" />
      <rect x="179" y="58" width="3.4" height="3.4" fill="#ffffff" opacity="0.65" />
      <rect x="146" y="62" width="3" height="3" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}
```

### 3.3 Planck to Now — "cosmos / universe"

Project: "Scrub cosmic history — from the Planck epoch to now" (Three.js/WebGL). Owner verdict: the current orb + arc doesn't evoke the subject. New direction: lean fully into **cosmos/universe** — stars, a galaxy, cosmic scale, deep-space feel:

- Hero object: a **chunky spiral galaxy glyph** — bright core (stepped tones: deep `#4b3a8c` base, violet `#a98cff` mid, light `#efe7ff` cap) with 2–3 thick curved arms (strokes 6–9px, violet, varied opacity) winding outward. Tilt it slightly (rotate/skew) for cosmic-drama energy.
- **Star field**: 5–8 tiny stars — small circles + 1–2 four-point star polygons (the current diamond star shape is good) in violet/ochre/`#b6ac95`, varied sizes 1.5–3px.
- Keep a **faint epoch arc**: the project is a scrubable timeline — one thin dashed arc (the current scrub path idea) crossing the composition with a small ochre scrubber dot reads as "from Planck to now" and keeps it project-true. Keep it subtle so the galaxy dominates.
- Optionally one tiny "distant planet" dot with a ring in ink neutrals.
- Deep-space richness via the sparse-dot backdrop (keep the existing wide sparse ellipse) + the single `.gem-halo` dense ellipse behind the core.
- Current code (evolve or restart, your call):

```tsx
/* ── 5 · Planck to Now — cosmic violet #a98cff ── */
function SpiralCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-spiral-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#a98cff" />
        </pattern>
        <pattern id="gem-spiral-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#a98cff" />
        </pattern>
        <clipPath id="gem-spiral-core"><circle cx="108" cy="82" r="28" /></clipPath>
      </defs>
      <ellipse cx="118" cy="82" rx="104" ry="62" fill="url(#gem-spiral-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.16)} cx="118" cy="82" rx="60" ry="40" fill="url(#gem-spiral-dense)" opacity="0.16" />
      <path d="M 44 118 Q 130 22 224 78" stroke="#7d7669" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.7" />
      <circle cx="54" cy="110" r="6" fill="#4b3a8c" />
      <circle cx="52" cy="108" r="3" fill="#a98cff" />
      <circle cx="108" cy="82" r="28" fill="#4b3a8c" />
      <g clipPath="url(#gem-spiral-core)">
        <circle cx="100" cy="72" r="22" fill="#a98cff" />
        <rect x="80" y="84" width="56" height="26" fill="url(#gem-spiral-dense)" opacity="0.45" />
        <circle cx="96" cy="68" r="10" fill="#efe7ff" />
      </g>
      <polygon points="168,38 172,48 182,50 172,52 168,62 164,52 154,50 164,48" fill="#b6ac95" opacity="0.9" />
      <g fill="#7d7669">
        <circle cx="204" cy="66" r="3" />
        <circle cx="214" cy="72" r="2.4" />
        <circle cx="208" cy="76" r="2.2" />
      </g>
      <circle cx="224" cy="78" r="9" fill="#e8b57c" />
      <circle cx="221" cy="75" r="4" fill="#ffe6c4" />
      <rect x="97" y="70" width="3.6" height="3.6" fill="#ffffff" opacity="0.65" />
      <rect x="114" y="88" width="2.8" height="2.8" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}
```

## 4. Constraints & guardrails (from review history)

- Do **not** change the approved language (halftone technique, plate, frame, motion). Only the three subjects change.
- Raft: no lighthouse, no teal/periwinkle/indigo. Must read as system design.
- Kitty: no heart ornaments (previously judged defective); no mouth on the cat; no soft blob ghost — either a crisp simplified echo or none.
- Planck: galaxy is the hero; the timeline arc may stay but must be subordinate.
- All three keep: one `.gem-halo` ellipse each (base ≤ 0.16), the wide sparse-dot backdrop ellipse (opacity 0.09), 1–2 square white glints, unique ids within their `gem-raft-` / `gem-cat-` / `gem-spiral-` prefixes.
- No new dependencies, no external assets, no animation inside the SVG (CSS owns motion).

## 5. Expected output format

Respond with exactly three sections, nothing else needed:

```
### RaftCenterMark
```tsx
// full replacement function component
```

### KittyCenterMark
```tsx
// full replacement function component
```

### SpiralCenterMark
```tsx
// full replacement function component
```
```

Each function must be complete and drop-in (imports `haloVar` from the same module — no imports inside your functions). After the three sections, add ≤3 sentences per mark of design rationale (what reads as what) so the integrating agent can judge fidelity.
