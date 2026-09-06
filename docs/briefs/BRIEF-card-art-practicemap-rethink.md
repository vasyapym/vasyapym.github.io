# BRIEF — Practice Map mark, rethink round: TWO complete candidates (a map that feels alive)

Round context: the six-mark family language is **Spot-Colour Overprint** (adopted) and five of six marks are settled — Raft just went through a cybernetic reconcept and the owner picked a feedback-loop design. This round covers the last unsettled mark: **Practice Map**. The owner's verdict on the current mark (a faint survey grid + two map pins + a dotted route + one highlighted "you are here" circle), quoted: "currently good but **boring** — needs more visual interest or a fresh concept while still serving its purpose." Weakness to avoid repeating: almost everything is low-contrast hairlines, so the mark dissolves into the plate — it must not get fainter, it needs a stronger focal drama. You have NO repo access; output is integrated verbatim into `portfolio/shell/src/shell/ProjectArtwork.tsx` as `TrailCenterMark` (the "trail" key is legacy). The owner picks candidate A or B from rendered evidence.

---

## TASK

Design TWO complete, distinct SVG candidates for one card mark. Senior developer's portfolio landing page: dark editorial "ink catalogue", plate `#0b1317`, neutral ink, halftone screens, film grain. Card mark: `260 × 160` SVG rendered ~213–260px wide; one of a six-mark family. This card's hue is SKY BLUE. Subject: "Practice Map — keep concepts, small exercises, and useful things to revisit in one quiet place" (React, TypeScript, local state — a local-first practice dashboard). "Map" is the METAPHOR: a personal territory of what to practice, where you are, what comes next, what you have already covered. It is not a geography app.

**What the mark must still say (purpose survives both candidates):**
1. A territory being traversed — progress through practice space.
2. A clear HERE — one unmistakable focal point where the practitioner currently is.
3. A NEXT — something ahead to reach (exercise, revisit, open thread).
4. The family read: printed survey/atlas plate, ink on dark paper, one spot colour.

**Hard conceptual requirements (both candidates):**
1. SKY (`#5cc8ff`, deep `#1d6f9e`, light `#d6f2ff`) is confined to ≤3 groups: the HERE focal element + one more group max + halo dots.
2. Exactly ONE dominant focal element (the HERE) with real graphic weight — stepped-cap disc or beacon, not a hairline outline.
3. Visible direction of travel (chevrons, dash rhythm, or an asymmetry that reads as motion).
4. Structure is EXPLICIT — every path, node, contour uses exact coordinates (no runtime randomness), crisp edges, nothing blurry.
5. NO text, NO numbers, no gradients, no filters. Pure primitives.

## Shared technique rules (both candidates)

- Patterns in `<defs>`, all `patternUnits="userSpaceOnUse"`: `gem-trail-dense` (7×7, dot r 1.9, `#5cc8ff`), `gem-trail-sparse` (11×11, dot r 1.6, `#7d7669`), `gem-trail-halo` (7×7, dot r 1.9, `#5cc8ff`).
- Halo contract: exactly one ellipse `className="gem-halo"` `style={haloVar(0.12)}` ~rx 60 ry 42, sky dots, opacity 0.12 (CSS pulse binds to the class). `haloVar` exists in module scope.
- Wide sparse backdrop ellipse (`url(#gem-trail-sparse)`, opacity 0.09, ~rx 104 ry 64, cx 130 cy ~82).
- Volume via `<clipPath>` stepped caps only; `aria-hidden="true"`; ids prefixed `gem-trail-`.
- Palette (exhaustive): NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4` (+ white glints ≤2); SKY `#5cc8ff`, deep `#1d6f9e`, light `#d6f2ff`. No other hues.
- **Mobile safe area (hard rule):** on phones the card stage clips the SVG's outer ~5px top/bottom and the mark breathes ±3px vertically. ALL hard content must stay within x 16→244, y 16→144. The sparse backdrop and halo ellipse may exceed it; nothing else.
- ~15–25 elements; legible at 213px; strokes ≤3 wide; any dashed rhythm deliberate, not noisy.

## CANDIDATE A — "Terraced climb" (contour survey with a summit beacon)

The practice dashboard as an elevation survey being climbed: nested contour rings around a summit, a trail winding up from base camp, the band already climbed overprinted in sky halftone.

Geometry anchors (refine within ±6px):

- FOUR nested contour loops centred ~(148, 84): closed hand-wobbled paths (C/Q curves, explicit coordinates, radii ~22/40/58/76, each deformed ±4px so they read as terrain, not concentric circles). Innermost stroke `#465059` width 1.5 opacity 0.7; outward each step lighter/thinner (`#7d7669` 1.2 op 0.55, `#7d7669` 1 op 0.4, `#b6ac95` 1 op 0.3).
- CLIMBED BAND: the ring between contour 1 and contour 2 overprinted `url(#gem-trail-dense)` opacity 0.45 — clipped to a closed path that follows contour 2 outside and contour 1 inside (build it from two closed loops in one `<clipPath>` with even-odd? clip-rule — simplest: draw a contour-2-shaped filled ring by stroking contour 2 with width 18 `url(#gem-trail-dense)` opacity 0.45 UNDER a contour-1-interior disc filled plate `#0b1317`... if the clip gets fiddly, instead stroke ONLY the lower-right 150° arc of contour 2 with width 14 `url(#gem-trail-dense)` opacity 0.45 — "the band climbed so far" as a partial overprint arc). Pick whichever reads cleanest; state which you chose.
- SUMMIT + HERE fused at (148, 84): stepped-cap disc r 8 (`#26333b` base, `#465059` inner, `#7d7669` innermost, clipped) + sky cap: circle r 4.5 offset (−1,−1) fill `#5cc8ff` clipped to the disc + light glint dot r 1.5 `#d6f2ff`. From the disc, a FLAG: pole line 1.5 wide × 11 tall (stroke `#b6ac95`), sky pennant triangle (points ~(148,64) (161,68) (148,72)) fill `#5cc8ff`.
- TRAIL: dashed path from base camp (46, 126) winding between contour gaps up to the summit base: e.g. `M 46 126 C 70 122 84 108 96 104 C 116 96 122 100 140 92`, stroke `#b6ac95` width 2, dasharray "1 7", round caps, opacity 0.9. TWO tiny chevrons on the trail pointing up-trail (`#7d7669`).
- BASE CAMP at (46, 126): two tiny tent triangles 7×6 (`#465059`, one `#26333b`) side by side + a 2px hairline ground tick.
- "YOU ARE HERE" pulse on the trail at ~(96, 104): sky dot r 3.5 fill `#5cc8ff` + one hairline ring r 6.5 stroke `#5cc8ff` width 1 opacity 0.5 — the second sky group.
- Compass rose corner, top-left at (34, 36): four 6px ticks (N one longer, 8px) + 1px diagonal cross, stroke `#7d7669` opacity 0.5.
- One white glint on the summit disc cap; nothing else white.

## CANDIDATE B — "Constellation index" (practice topics as a personal star atlas)

The dashboard as a night atlas: each practised concept is a star-node, hairlines thread them into a constellation, the current focus blazes with sky light, the revisit queue waits as a dashed ghost.

Geometry anchors (refine within ±6px):

- GRID, quieted: four vertical + two horizontal hairlines (like the incumbent's survey grid but only 6 lines, stroke `#465059` width 1, opacity 0.22) — backdrop, not subject.
- SIX star-nodes (explicit coords, sizes varied): (58, 112) r 5, (94, 62) r 4, (122, 122) r 3.5, (168, 52) r 4.5, (204, 84) r 5, (222, 40) r 3. Big nodes (r ≥ 4.5) get stepped caps (`#26333b` base + `#465059` inner clipped); small nodes flat `#465059` or `#7d7669`.
- CONSTELLATION THREADS: hairline segments connecting (58,112)→(94,62)→(150,84)→(168,52)→(204,84) and (94,62)→(122,122)→(150,84), stroke `#465059` width 1, opacity 0.5.
- THE FOCUS (HERE) at (150, 84): the dominant element — disc r 8.5 stepped caps + sky core r 5 fill `#5cc8ff` + light cap r 2 fill `#d6f2ff` + FOUR-POINT star spikes (thin diamond polygon, ~30px across, fill `#eeeae0` opacity 0.85, rotated 45° so it reads X-shaped behind the disc) + the halo ellipse centred on it. Sky group 1.
- TRAVELLED PATH: the two threads leading INTO the focus (from (58,112) and via (122,122)) carry THREE tiny chevrons pointing at the focus (`#b6ac95`, 3px) — where you have been.
- NEXT UP (revisit queue) at (204, 108): ghost node r 6, fill none, stroke `#7d7669` width 1.2, dasharray "2 3" + a tiny sky halftone dot patch r 3 `url(#gem-trail-dense)` opacity 0.7 at its centre (the next exercise loading). Sky group 2. A dashed thread focus→next-up: `M 158 88 L 198 104` stroke `#7d7669` width 1 dasharray "2 4" opacity 0.5.
- One 4-point mini-star (`#b6ac95`, 8px) at (74, 40); one white glint on the focus cap; nothing else white.

## Self-check (both candidates)

- Squint-test at 213px: A = terrain with a lit summit and a trail being climbed; B = a constellation with one blazing star and a dashed next-up. Both instantly "mapped territory with a here and a next".
- NOT faint: the focal element carries real weight; structure lines stay ≥ the stated opacities.
- Sky confined: HERE element (+ one more group) + halo. Everything else neutral.
- All hard content inside x 16→244, y 16→144. Exactly one `gem-halo`. No text, no gradients, no filters.

## Output format

1. One ```tsx block: `function TrailCandidateA() { ... }` (terraced climb).
2. One ```tsx block: `function TrailCandidateB() { ... }` (constellation index).
3. ≤3 sentences per candidate: the beat you emphasised + sky coverage estimate + which climbed-band technique you chose (A) + any anchor deviation.
