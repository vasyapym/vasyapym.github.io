# BRIEF — Cat Runner mark, attempt 4: Hello-Kitty silhouette in the owner-loved running pose

Round context: attempt 3 (stretched realistic running-cat silhouette) was shown to the owner and the verdict is split: **the mark language is loved** — one flowing silhouette, full stride, ordered dashes, pink halftone ghost + dash trail — **but the subject reads as a real cat while the game itself is Hello Kitty**, which would confuse ("why is there a real cat on the card of a Hello Kitty game?"). Owner's new direction, quoted: "it doesn't have to be realistic, maybe shadowy silhouette of hello kitty". So: KEEP the attempt-3 mark discipline, SWAP the subject's identity to a recognisable Hello Kitty silhouette. Delegated to the chat model (no repo access). Output integrates into `portfolio/shell/src/shell/ProjectArtwork.tsx` as `KittyCenterMark`.

---

## TASK

Design ONE SVG illustration for a senior developer's portfolio landing page (dark editorial "ink catalogue", plate `#0b1317`, neutral ink, halftone screens). Card mark: `260 × 160` SVG rendered ~213–260px wide, one of a six-mark family language called **Spot-Colour Overprint** (neutral dominates; ONE identity hue per card ≤~15% coverage). This card's hue is PINK. Subject: "Cat Runner — a pastel endless runner with a bullet-time dash, a ghost of your best run".

## Direction: Hello Kitty as a shadow-silhouette mark, mid-run

A solid, shadow-theatre cutout of Hello Kitty running — brand-recognisable from shape alone, but executed with the restraint of a design mark (NOT a cute cartoon sticker, NOT realism):

- **Head dominates** — the classic Hello Kitty proportion: a very wide rounded head, wider than tall (~1.35:1), roughly 2× the body's height. Big head, small body — this ratio IS the brand, and in a blank silhouette it reads as brand, not as baby-cartoon.
- **Blank face** — no mouth, no nose. The only facial features: two small negative-space oval eyes (plate-coloured `#0b1317`), WIDE-SET on the same horizontal line at ~45% of the head's half-width. Their wide placement is a signature.
- **Bow** — the single strongest signifier: a small solid bow at the right ear base (two rounded loops + centre knot), reading as part of the silhouette. PINK (this card's spot hue).
- **Whiskers as spikes** — three per side, perfectly straight, sticking OUT past the head's silhouette edge, paper-coloured (extensions of the silhouette, not drawn lines on the face).
- **Running**: small compact body tucked under the big head, leaning forward, two stubby legs mid-stride reaching the ground, thin tail streaming back. The head leans slightly into the run.
- Everything is smooth large-radius shapes; no scratchiness; no outline strokes; seams between head/ears/body/tail must vanish (same fill, overlapping shapes).

Keep from attempt 3 (owner-loved, do not lose):

1. Pink halftone **ghost echo** (simplified silhouette, close behind-left, grounded, opacity ~0.14)
2. Pink halftone **bullet-time dash trail** lying on the ground under the runner
3. Three ordered HORIZONTAL neutral speed dashes behind (descending widths ~40/30/20, height 6, opacity 0.4)
4. One clean ground curve; one flowing subject; one halo; extreme discipline

## Geometry landmarks (refine within ±6px if flow needs it)

Moving right. Ground line ≈ y 118.

- Head: ellipse cx 160 cy 66 rx 32 ry 24, fill `#eeeae0`; underside crescent: clip head path/ellipse, draw a copy translated DOWN 12px in `#b6ac95` inside the clip
- Ears: small triangles wide-set on the head's top edge: left base (140,50) apex (131,35); right base (180,50) apex (191,36); slight outward lean; fill `#f4efe4`, bases buried in the head
- Bow: centred (186,45): loops at (180,45) and (192,45) rx 5.5 ry 4.5 fill `#ff8fbf`; knot circle r 3 at (186,46) fill `#a33a72`; overlaps the right ear base
- Eyes (negative space): ellipses (147,68) and (175,68) rx 2.4 ry 3.6, fill `#0b1317` — same y, wide-set
- Whiskers (silhouette spikes): three per side, stroke `#eeeae0` width 2, round cap: left (132,60)→(112,57), (132,66)→(110,66), (132,72)→(112,75); right mirrored from x 188 to 210/208/210
- Body: ellipse cx 144 cy 99 rx 14 ry 11, fill `#eeeae0` (top overlaps head bottom by ~2px — no neck seam); underside crescent `#b6ac95` via clip, copy translated down 8px
- Legs (mid-stride stubs): stroke `#eeeae0` width 6, round cap: front (152,103)→(159,114); back (137,103)→(131,114)
- Tail: `M 132 97 Q 114 91 100 80`, stroke `#eeeae0` width 5.5, round cap
- Ghost echo: group `translate(-36 2) scale(0.94)` opacity 0.14, fill `url(#gem-cat-dense)`: head ellipse + two ear triangles + body ellipse (simplified — no face, no bow)
- Dash trail: rect x 108 y 114 w 66 h 5 rx 2.5 fill `url(#gem-cat-dense)` opacity 0.45
- Speed dashes: rects x 26, y 78/90/102, widths 40/30/20, h 6, rx 3, fill `#7d7669` opacity 0.4
- Ground: `M 46 120 Q 140 112 236 118`, stroke `#465059` width 5, round cap, opacity 0.5

## Palette (exhaustive)

- NEUTRAL RAMP: `#26333b`, `#465059`, `#7d7669`, `#b6ac95`
- PAPER: `#eeeae0` (head/body/tail/whiskers silhouette), `#f4efe4` (ears; optional one glint ≤3px)
- PINK (only hue): `#ff8fbf` (bow loops + halftone dots), deep `#a33a72` (bow knot ONLY)
- Plate behind the mark: `#0b1317` (also the negative-space eye fill)
- One white glint max (optional)

## Hard technique rules

- Pure SVG primitives; NO text, NO filters, NO gradients.
- Patterns in `<defs>`: `gem-cat-dense` (7×7, dot r 1.9 `#ff8fbf`), `gem-cat-sparse` (11×11, dot r 1.6 `#7d7669`), `gem-cat-halo` (7×7, dot r 1.9 `#7d7669`) — all `patternUnits="userSpaceOnUse"`.
- Halo contract: exactly one ellipse `className="gem-halo"` `style={haloVar(0.12)}` rx≈62 ry≈40 `fill="url(#gem-cat-halo)"` opacity 0.12. `haloVar` exists in module scope.
- Wide sparse backdrop ellipse (`url(#gem-cat-sparse)`, opacity 0.09, ~rx 104 ry 62) behind everything.
- Volume caps via `<clipPath>` only.
- ~15–24 elements; legible at 213px; ids prefixed `gem-cat-`.
- React/TSX: output ONLY the component function — no imports, no props, no hooks. `aria-hidden="true"` on the svg.

## Self-check before answering

- Squint-test: does the head read as Hello Kitty (wide head + wide ears + bow + whisker spikes) rather than a generic cat?
- Head ≈ 2× body height, head clearly dominates, body tucked under with no neck seam.
- Face blank except two wide-set negative-space eyes. No mouth, no nose, no drawn dot-eyes.
- Whiskers stick OUT past the head edge, straight, paper-coloured.
- Bow solid pink, reads in silhouette, overlaps right ear base.
- Ghost grounded and simplified; dashes ordered horizontal; trail on the ground; one `gem-halo`.
- No seams between head/ears/body/tail/legs; all edges smooth.

## Output format

1. One ```tsx block containing the complete replacement: `function KittyCenterMark() { ... }`.
2. Then ≤4 sentences: (a) pink coverage estimate, (b) halo colour choice, (c) any landmark deviation and why.
