# BRIEF — Cat Runner mark, attempt 3: logotype-grade running-cat silhouette

Round context: the Cat Runner card mark has been rejected twice. Attempt 1 (chibi kitten) read as a child's drawing. Attempt 2 (iconic Sanrio-style face: wide head, wide-set eyes, bow) was integrated, screenshot-verified, and rejected by the owner: "it seems animated cartoon, not senior developer stuff". Both rejections share one lesson, now a hard rule: **do not design a character with a face. Design a mark.** Delegated to the chat model (no repo access). Output integrates into `portfolio/shell/src/shell/ProjectArtwork.tsx` as `KittyCenterMark`.

---

## TASK

Design ONE SVG illustration for a senior developer's portfolio landing page (dark editorial "ink catalogue", plate `#0b1317`, neutral ink, halftone screens). The card: `260 × 160` SVG mark rendered ~213–260px wide, part of a six-mark family language called **Spot-Colour Overprint** (neutral dominates; ONE identity hue per card as confined second ink ≤~15% coverage). This card's hue is PINK. Subject: "Cat Runner — a pastel endless runner with a bullet-time dash, a ghost of your best run".

## Direction: a design mark, not a mascot

A sleek running-cat **silhouette of logotype quality** — the way a design studio would draw an animal mark: one flowing, horizontally stretched shape in full stride. Think studio logotype / mark, NOT illustration of a cute animal.

- FULL-STRIDE GALLOP, moving right, body stretched HORIZONTAL — body length ≥ 3× body depth. No upright posture, no big-head ratio (head ≈ ¼ of body length).
- The silhouette is ONE flowing closed shape (body + head + 2 legs as a single path, or at most body+head path + legs merged seamlessly — NO visible internal seams between head/neck/body/legs).
- Legs: exactly two, in maximum extension — front leg reaching forward-down, hind leg extended back-down. This extreme extension is what reads as speed.
- Ears: two tiny triangles swept BACK along the skull (bumps on the head's top line), not upright.
- Tail: streams behind almost horizontally with a gentle curve, drawn as a separate thick round-capped stroke.
- Face: NO eyes drawn as dots, NO mouth, NO whiskers, NO nose dot, NO bow, NO collar. The only facial feature: ONE small negative-space eye (plate-coloured `#0b1317` circle) on the head.
- Edges: large-radius smooth curves everywhere; nothing scratchy, nothing wobbly.

Where the pink goes (2 groups only):

1. **Ghost of your best run** (the game's signature feature): one simplified pink halftone silhouette echo of the running cat, close behind-left, grounded on the same ground line, opacity ~0.14. Simplified = body blob + head wedge + tail stroke only.
2. **Bullet-time dash trail**: one short pink halftone streak lying on the ground line under the runner.

Speed: 3 ordered HORIZONTAL neutral dashes behind the cat, descending widths (~40/30/20), consistent height 6, evenly spaced y, opacity 0.4 — intentional rhythm, not scattered.

## Geometry landmarks (compose the path from these; refine within ±6px if the flow needs it)

Moving right. Ground line ≈ y 118.

- Nose tip (218, 84); skull top (198, 68); back of skull → neck (186, 71)
- Ears swept back: small triangles on the top line around (190,64)→apex (181,55) and (184,69)→apex (174,61)
- Back line: from neck (186,70) nearly straight, slight sag at (150,73), to tail base (114,68)
- Tail (separate stroke): `M 114 69 Q 90 56 64 64`, stroke width 7, round cap, same fill colour as body
- Hind leg: hip (116,76) extended back-down to hind paw (86,108); leg is a tapering limb ~7–9px thick
- Belly line: (120,92) → (160,96) → chest bottom (186,100)
- Chest: deepest at (188,94)
- Front leg: chest (196,98) reaching forward-down to front paw (216,112), tapering limb ~6–8px thick
- Throat → chin: (196,86) → (208,88) → nose tip
- Negative-space eye: circle r 2.6 fill `#0b1317` at (204,76)
- Silhouette fill `#eeeae0`; stepped volume cap: `<clipPath>` of the body path clipping a `#b6ac95` shape offset DOWN ~6px (thin underside crescent)
- Ghost echo: group `translate(-34 0) scale(0.96)`, simplified shapes, fill `url(#gem-cat-dense)`, opacity 0.14
- Dash trail: rect x 108 y 114 w 66 h 5 rx 2.5 fill `url(#gem-cat-dense)` opacity 0.45
- Speed dashes: rects at y 78/90/102 starting x ≈ 26, fill `#7d7669` opacity 0.4
- Ground: `M 46 120 Q 140 112 236 118`, stroke `#465059` width 5, round cap, opacity 0.5

## Palette (exhaustive)

- NEUTRAL RAMP: `#26333b`, `#465059`, `#7d7669`, `#b6ac95`
- PAPER: `#eeeae0` (silhouette), `#f4efe4` (highlight cap, optional)
- PINK (only hue): `#ff8fbf` — used ONLY in the halftone pattern dots
- Plate behind the mark: `#0b1317` (also the negative-space eye fill)
- One white glint max (optional, ≤3px square)

## Hard technique rules

- Pure SVG primitives; NO text, NO filters, NO gradients.
- Patterns in `<defs>`: `gem-cat-dense` (7×7, dot r 1.9 `#ff8fbf`), `gem-cat-sparse` (11×11, dot r 1.6 `#7d7669`), `gem-cat-halo` (7×7, dot r 1.9 `#7d7669`) — all `patternUnits="userSpaceOnUse"`.
- Halo contract: exactly one ellipse `className="gem-halo"` `style={haloVar(0.12)}` rx≈62 ry≈40 `fill="url(#gem-cat-halo)"` opacity 0.12. `haloVar` exists in module scope.
- Wide sparse backdrop ellipse (`url(#gem-cat-sparse)`, opacity 0.09, ~rx 104 ry 62) behind everything.
- Volume caps via `<clipPath>` only.
- ~15–22 elements; legible at 213px; ids prefixed `gem-cat-`.
- React/TSX: output ONLY the component function — no imports, no props, no hooks.

## Self-check before answering

- The silhouette reads as ONE flowing animal shape at a glance — squint-test it mentally.
- Horizontal stretch ≥3:1; head small (≈¼ body length); exactly 2 legs in full extension.
- Ears swept back; tail streaming round-capped stroke.
- Zero character features: no dot eyes, no mouth, no whiskers, no nose dot, no bow, no collar. Only the negative-space eye.
- Ghost grounded on the ground line; dashes horizontal and ordered; one `gem-halo`.
- No seams/valleys where head meets neck or legs meet body.

## Output format

1. One ```tsx block containing the complete replacement: `function KittyCenterMark() { ... }`.
2. Then ≤4 sentences: (a) pink coverage estimate, (b) halo colour choice, (c) any landmark deviation and why.
