# BRIEF — Implement Variant C "Blueprint on Ink" for three card marks (Raft · Kitty · Fox)

Delegated to the chat model (no repo access). Output integrated into `portfolio/shell/src/design-directions/art-directions/variantC.tsx`. Same representative set and later-round plan as variants A/B. Instead of full current-code listings, the sent brief carried compact geometric anchors (below) — a full restart into line grammar was expected.

## Context sent

Identical page context to variants A/B. Other marks on the page keep the halftone language; this variant replaces tonal masses with drafting grammar while keeping the same subjects.

## Direction locked — Variant C "Blueprint on Ink"

Replace tonal-mass illustration with drafting grammar — thin measured strokes, dashed guides, dimension ticks, crosshairs, sparse bounded hatch. Hue drops to a SINGLE ochre accent per card (~4–7%).

- Raft: nodes as small circles with crosshair centres; interconnects as measured lines with midpoint dimension ticks; log entries as tiny OUTLINED squares riding the links — exactly ONE ochre-FILLED ("active log entry in transit").
- Cat: single-weight contour motion-study (line drawing, fill none) on the locked geometry; ghost echo as a DASHED onion-skin previous frame; dust-kick as 2–3 short vector arrows with tiny heads. Ochre accent: the nose (small filled oval) — or one motion vector if the nose reads weak.
- Forest: layered elevation/contour profiles receding by line-weight (front heaviest, far lightest); the small tree annotated with one thin bent leader callout ending in a small tick; moon as a crosshair circle. Ochre accent: moon centre dot OR horizon line — one only.

## Palette (exhaustive)

LINE INK (primary) `#eeeae0`; DEPTH INK `#b6ac95 #7d7669 #465059`; INK ANCHORS (tiny filled features) `#26333b`; OCHRE ACCENT `#e8b57c` (+ `#b97f45` for a two-step accent) — ONE accent element per card; VERTEX MARKERS white `#ffffff` tiny squares. NO identity hues, 0%.

## Hard technique rules

One `<svg viewBox="0 0 260 160" aria-hidden="true">` per mark; pure primitives; no `<text>`/images/filters/CSS-in-SVG/animation. Stroke floor 1.2px (mark renders ~0.82×); main contours 1.5–2.5px. Dashed guides `strokeDasharray` 2 4 to 4 6; dimension ticks 4–7px; crosshairs 5–8px; leader lines bent with end ticks. Fills ONLY for tiny features and bounded hatches: dot pattern or hatch clipped to ONE bounded region per mark, opacity ≤ 0.35 — never wall-to-wall ("dirty" rejection). Halo restyled as a construction circle: `<ellipse className="gem-halo" style={haloVar(0.12)} fill="none" stroke="#b6ac95" strokeWidth="1" strokeDasharray="2 6">` around the subject — CSS hover hook, never remove/fill. Wide sparse-dot backdrop ellipse kept (11×11 tile, r 1.6, `#7d7669`, opacity 0.09). 1–2 white vertex squares 2.4–3px. ~15–30 strokes/nodes, legible at 213px; favour fewer, cleaner, longer lines.

## Geometric anchors (approved review history)

- Raft: leader (104,58) r17 + ring r23; followers (176,48) r12, (200,92) r12, (150,120) r13, (66,108) r12; log squares at 138,50 / 150,73 / 126,87 / 83,81 (4.5px).
- Kitty: head ellipse (150,70) rx34 ry28; ears `130,49 122,26 142,45` and `160,48 178,26 176,54` (bases buried); body (150,112) rx22 ry15; eyes (138,72)/(162,72); nose (150,82); whiskers 3 per side from (124,74..84)/(176,74..84); ghost transform `translate(-70 -20) scale(0.82)`; dust zone x76–114 y104–128; ground `M 60 138 Q 150 128 240 136`.
- Fox: tree `M 130 60 L 156 124 Q 130 116 104 124 Z`; moon (202,46) r15; back trees `66,112 78,82 90,112` / `150,112 162,84 174,112`; bush `M 108 112 Q 96 88 120 84 Q 132 92 128 112 Z`; ground `M 30 128 Q 130 112 230 128`; near bushes `M 62 124 Q 46 92 82 90 Q 100 98 96 124 Z` / `M 178 124 Q 166 96 198 92 Q 214 100 210 124 Z`.

Ids prefixed `gvc-`; exports `RaftMark/KittyMark/FoxMark`; module-level `haloVar`; React/TSX, no props/hooks/imports. Warmth requirement: the cat especially must keep gesture and charm — an animator's motion study, not clip-art. Output format as variants A/B.
