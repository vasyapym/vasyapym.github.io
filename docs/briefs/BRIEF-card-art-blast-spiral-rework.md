# BRIEF — Rework two card marks: Explosion (ordered radial shatter) + Planck to Now (Big Bang expansion)

Round context: the owner approved the page and the Spot-Colour Overprint card family; this round reworks four marks. Cat Runner is done. This brief covers the remaining two reconceptions: **Explosion** (currently messy/noisy with an accidental glitch feel — needs one clean, intentional visual) and **Planck to Now** (currently a spiral galaxy — concept is off; the owner wants it reframed around the **Big Bang**). Delegated to the chat model (no repo access). Output integrates into `portfolio/shell/src/shell/ProjectArtwork.tsx` as `BlastCenterMark` and `SpiralCenterMark` (the "spiral" key/name is legacy — the drawing becomes the Big Bang mark).

---

## Shared context

Senior developer's portfolio landing page: dark editorial "ink catalogue", plate `#0b1317`, neutral ink, halftone screens, film grain. Card marks are `260 × 160` SVGs rendered ~213–260px wide; six must read as one printed family (Spot-Colour Overprint: neutrals dominate, ONE identity hue per card ≤~15% coverage as halftone screens + small focal fills).

Shared technique rules for both marks:

- Pure SVG primitives; NO text, NO filters, NO gradients; volume via `<clipPath>` stepped caps only.
- Patterns in `<defs>`, all `patternUnits="userSpaceOnUse"`: `dense` (7×7, dot r 1.9, spot hue), `sparse` (11×11, dot r 1.6, `#7d7669`), `halo` (7×7, dot r 1.9).
- Halo contract: exactly one ellipse `className="gem-halo"` `style={haloVar(0.12)}` ~rx 60 ry 42 `fill="url(#…-halo)"` opacity 0.12. `haloVar` exists in module scope. (Raft/Planck halos get a CSS pulse — keep the class.)
- Wide sparse backdrop ellipse (`url(#…-sparse)`, opacity 0.09, ~rx 104 ry 64) behind everything.
- 1–2 tiny white square glints max; ~15–25 elements; legible at 213px.
- React/TSX: output ONLY the two component functions — no imports, no props, no hooks; `aria-hidden="true"` on each svg.

## MARK 1 — Explosion (`BlastCenterMark`, ids prefixed `gem-blast-`)

Subject: "a paper-lantern moon that detonates into the 600 shards it is built from — physics runs in fragment shaders on the gpu. click to blast, click to restore."

**Why the current mark fails:** seven debris polygons scattered at random angles, a vertical amber seam crossing the core like a glitch, a stray white kite at top — noise without order. 

**New direction: an ORDERED radial shatter.** The lantern captured at the instant of detonation: one central disc + shards flying outward on EXACT radial angles with rotational symmetry. Order and rhythm, not chaos — the elegance of a controlled demolition.

Geometry anchors (centre (130,80); refine within ±4px):

- Central lantern disc: circle r 26 fill `#26333b`; inner step cap `#465059` circle r 20 offset (−3,−3) clipped to the disc; hairline rim r 26 stroke `#465059` width 1 opacity 0.6.
- SPOT (amber) core: circle r 9 fill `#ffb347` at (127,77); highlight r 4 fill `#ffcf87`; centre glint r 1.8 fill `#fff0cf`.
- Eight shards on exact radial angles (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°): each an elongated isoceles wedge pointing OUTWARD along its axis, inner tip at radius 34, alternating lengths 26/18, widths 10/8. Fill sequence rotating through `#b6ac95`, `#7d7669`, `#465059`. Two opposite shards (45° and 225°) carry an amber halftone overprint cap (rect clipped to the shard, `url(#gem-blast-dense)`, opacity 0.7).
- Thin radial seam lines on the same eight angles from radius 30 to radius 40: stroke `#7d7669` width 1.5 opacity 0.45 — the cracks the shards fly along (order, not noise).
- Three ember dots ON radial lines (20°, 200°, 340°) at radius ~68: r 2.2 fill `#b6ac95`.
- Halo: `gem-blast-halo` dots `#ffb347` (amber), opacity 0.12 — keep the existing amber halo.
- Palette: NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4`; AMBER `#ffb347`, deep `#8a4712` (optional shadow cap), lights `#ffcf87 #fff0cf`; white glints. No other hues.
- Optional: one paper-white shard (the lantern's bright panel) at 315°, fill `#eeeae0` — one accent among the neutrals.

## MARK 2 — Planck to Now (`SpiralCenterMark`, ids prefixed `gem-spiral-`)

Subject: "Scrub cosmic history — from the Planck epoch to now." The owner rejected the spiral-galaxy concept: reframe around the **Big Bang** — expansion from a single origin point.

**New direction: expanding epoch ripples.** A violet singularity at the left; four nested, right-opening elliptical ripple bands sweeping across the canvas = space expanding through cosmic epochs; stars appearing between bands as the universe cools; the leading edge of the outermost band (the "now") highlighted in violet.

Geometry anchors (singularity at (52,84); refine within ±4px):

- Singularity: circle r 7 fill `#a98cff` at (52,84); white-hot centre r 3 fill `#efe7ff`; deep ring r 11 fill none stroke `#4b3a8c` width 1.5 opacity 0.8.
- Four nested right-opening half-ellipse bands, all centred on (52,84), drawn as stroked arcs (fill none), width 9–10, `strokeLinecap="round"`:
  - band 1 (innermost, densest/earliest): `M 52 58 A 60 26 0 0 1 52 110` stroke `#26333b` opacity 0.9
  - band 2: `M 52 42 A 95 42 0 0 1 52 126` stroke `#465059` opacity 0.75
  - band 3: `M 52 26 A 130 58 0 0 1 52 142` stroke `#7d7669` opacity 0.6
  - band 4 (outermost, coolest/now): `M 52 10 A 165 74 0 0 1 52 158` stroke `#b6ac95` opacity 0.5
- SPOT (violet) "now" frontier: the rightmost segment of band 4 overdrawn in violet: `M 210 62 A 165 74 0 0 1 210 106` stroke `#a98cff` width 10 opacity 0.9; endpoint dot r 3 fill `#a98cff` at (217,84) with r 1.4 `#efe7ff` centre.
- Star field between bands (neutral, increasing outward): dots r 1.6–2.6 at ~(100,84), (124,62), (150,102), (176,48), (192,110), (206,66) — fills alternating `#b6ac95`/`#7d7669`; one 4-point star shape (small diamond polygon) `#eeeae0` at ~(168,84) opacity 0.9.
- Halo: `gem-spiral-halo` dots `#a98cff` (violet), opacity 0.12 — keep the existing violet halo (CSS pulse hooks onto it).
- Palette: NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4`; VIOLET `#a98cff`, deep `#4b3a8c`, light `#efe7ff`; white glints. No other hues.
- No spiral arms, no ringed planet, no galaxy blob — the singularity + ripples ARE the concept.

## Self-check (both marks)

- Squint-test: Explosion = symmetric radial shatter around a hot core; Planck = point of origin with expanding epoch shells.
- All shards/seams on exact radial angles; nothing random; no vertical seam across the core.
- Spot hue confined: amber = core + 2 shard caps + halo dots; violet = singularity + now-frontier + halo dots.
- One `gem-halo` each; ids prefixed `gem-blast-` / `gem-spiral-`; no gradients/filters/text.

## Output format

1. One ```tsx block: complete `function BlastCenterMark() { ... }`.
2. One ```tsx block: complete `function SpiralCenterMark() { ... }`.
3. ≤3 sentences per mark: spot-hue groups + coverage estimate, halo colour, any landmark deviation and why.
