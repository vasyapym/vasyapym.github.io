# BRIEF — Card-artwork consistency round: propose three distinct illustration languages (spec round)

Round context: owner is happy with the landing page overall, but the six project-card illustrations — while appealing — feel inconsistent with the main-page aesthetic and the tone expected of a senior developer portfolio. Delegated to the chat model (no repo access) as a SPEC-ONLY brainstorm; its three direction specs below were accepted as the round's candidates. Implementation briefs: BRIEF-card-art-variant-a-two-ink-plate.md, BRIEF-card-art-variant-b-spot-colour.md, BRIEF-card-art-variant-c-blueprint.md.

## Brief sent (abridged)

Page context given: dark editorial "ink catalogue" — plate `#0b1317`, paper `#eeeae0`, single ochre family `#d39b61/#e8b57c/#b97f45`, IBM Plex Mono/Sans lowercase, hairlines, 20px panels, film grain; hero = fluid sim rasterized as ordered Bayer dither with ramp `#26333b → #465059 → #7d7669 → #b6ac95 → #d49a5f → #ecba7f` (two inks: neutral + ochre). Cards: six halftone SVG marks (`viewBox 0 0 260 160`) each carrying a bright identity hue over large areas + wide halo — six loud voices on a quiet page.

Task: three distinct direction specs (or a fourth if genuinely different) redesigning the illustrations' LANGUAGE while keeping every subject. Crux = hue policy per element class with rough coverage %. Seeds offered: (A) two-ink duotone, (B) spot-colour overprint, (C) technical schematic. Hard constraints: plate/frame/copy/breathe/`.gem-halo` hook fixed; pure SVG primitives; no text/filters/gradients; legible at ~213px; no wall-to-wall dither fields ("dirty" rejection); no girly kitty; Raft must read as distributed-system design; one coherent family language.

## Variant A — Two-Ink Plate (single-ochre duotone) — as proposed

Thesis: every card in the hero's own two inks; identity moves into subject and composition; ochre spent on exactly one "signal" element per card. Identity hues 0%. Neutral ramp ~80–88%, ochre family ~12–18% (one signal element + one glint). Halo ochre-tinted, mechanism unchanged.

- Raft: neutral stepped discs on halftone screens, neutral interconnects; ochre signal = log-entry squares riding the links, bright `#e8b57c` from a deep-ochre `#b97f45` leader ring.
- Cat: neutral cream/paper body, ink eyes, neutral dust kicks, faint neutral ghost echo; ochre = nose + one glint.
- Forest: silhouettes step down the neutral ramp; ochre = the moon, the one warm light.
- Explosion: neutral debris/seams; ochre = hottest core cap. Planck: neutral arms/stars; ochre = galactic core. Practice Map: neutral route/pins; ochre = "you are here" marker.
- Risk: weaker subjects lean on composition — Cat and Forest could read generic.

## Variant B — Spot-Colour Overprint (disciplined second ink) — as proposed

Thesis: identity hue kept per card but demoted to a confined second ink — halftone overprint + one focal fill, hard-capped ~10–15% coverage; neutrals ~75–85%; ochre optional where a natural warm element exists. Halo neutral or faintest hue tint; wide soft colour wash killed.

- Raft: neutral topology; coral confined to log squares + thin coral halftone on leader disc; deeps `#7d2723` anchor the ring.
- Cat: neutral cream cat (sidesteps the "girly" rejection); pink confined to nose + faint pink halftone on dust/ghost.
- Forest: neutral dusk; teal confined to a thin canopy halftone band + hairline moon rim.
- Explosion: amber core cap + rib-seam lines. Planck: violet stepped core + dashed "now" segment. Practice Map: sky-blue "you are here" + pin caps.
- Risk: six spot inks still show chroma; if any card creeps past ~15% the "quiet page" complaint returns.

## Variant C — Blueprint on Ink (technical schematic) — as proposed

Thesis: drafting grammar — thin measured strokes, dashed guides, dimension ticks, crosshairs, sparse contour hatch; hue drops to a single ochre accent (~4–7%). Halo restyled as a faint construction circle.

- Raft: crosshair-centred node circles, measured links with midpoint ticks, outlined log squares, one ochre-filled "active" square in transit.
- Cat: single-weight contour motion-study; ghost echo as dashed onion-skin; dust-kick as vector arrows; ochre on nose or one motion vector.
- Forest: layered elevation/contour profiles receding by line-weight; tree with thin leader callout; crosshair moon; ochre on moon centre or horizon.
- Explosion: exploded-assembly diagram with dashed trajectory arcs. Planck: logarithmic-spiral construction curve + dimensioned epoch timeline. Practice Map: surveyed polyline with bearing ticks; ochre crosshair "you are here".
- Risk: line grammar can turn cold — Cat and Forest must fight dryness.

## Comparison (as proposed)

Consistency: A strongest, C very strong, B weakest. Identity: B strongest, C middle, A weakest. Warmth: A and B keep tonal charm; C must engineer wit. Risk shape: A flattening soft subjects; B re-introducing the rainbow; C clinical dryness.
