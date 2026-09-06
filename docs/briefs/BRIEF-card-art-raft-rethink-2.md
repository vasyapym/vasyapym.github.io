# BRIEF — Raft Cluster mark, round 2: TWO complete candidates (system design, instantly)

Round context: the six-mark family language is **Spot-Colour Overprint**. The Raft mark's incumbent ("control loop": dashed ring, three small nodes, one coral capsule) is a decent SYSTEM DIAGRAM but boring. Two scene candidates were just REJECTED outright — owner's verdict, quoted: "**these are not it. i want so that it would be easily understandable that this is system design.**" Candidate A was an election drama (crashed leader, crowned successor — read as abstract shapes with rings); candidate B was a literal raft of logs (read as a boat). Both failed the same way: they traded the system-diagram vocabulary for narrative props.

**The lesson that governs this round:** what makes the mark read as "system design" IS the architecture-diagram vocabulary — discs as nodes, strokes as links, capsules as signals in flight, tick rows as logs, dashed vs solid as state. KEEP all of it. Visual interest must come from COMPOSITION ONLY, never from new kinds of objects:
1. **Size hierarchy** — one clearly dominant node (the incumbent's three equal dots are part of why it is dull).
2. **Asymmetric placement** — no centred, symmetric ring; a fan or a sweep with direction.
3. **Live traffic** — more than one signal trace: a protagonist plus trailing echoes, so the system feels mid-operation.
4. **Aligned repeated structure** — log rows with a commit frontier hairline, repeated per node, as the diagram's rhythm.
5. **State contrast** — solid vs dashed encoding caught-up vs lagging, committed vs empty.

The incumbent remains the fallback, so each candidate must beat it on interest without losing ANY of its diagram clarity. You have NO repo access; your two code blocks are integrated verbatim into `portfolio/shell/src/design-directions/art-directions/raftRethink2.tsx`. `haloVar` exists in that module's scope. The owner picks candidate A or B from rendered evidence.

---

## TASK

Design TWO complete, distinct SVG candidates for one card mark. Senior developer's portfolio landing page: dark editorial "ink catalogue", plate `#0b1317`, neutral ink, halftone screens, film grain. Card mark: `260 × 160` SVG rendered ~213–260px wide; one of a six-mark family. This card's hue is CORAL. Subject: "Raft Cluster — live Raft consensus in the browser — crash the leader and watch elections answer" (Rust, WebAssembly, TypeScript). The bar: within one second, a developer must read "distributed systems / architecture", and on a second look the mark must feel alive and composed, not static and symmetric.

**Hard rules (both candidates):**
1. Exactly THREE nodes; leader identifiable WITHOUT text via the adopted crown grammar: deep-coral ring + coral halftone overprint cap on its disc.
2. EVERY element is an architecture-diagram element: node disc, link stroke, signal capsule/dot, log tick, frontier hairline, chevron. NO scenery, NO narrative props (no cracks, boats, flags, falling crowns).
3. Node treatment stays diagram-standard: stepped-cap discs (2–3 clipped inner circles) + hairline rim. This is the family's node idiom — do not restyle it.
4. CORAL ≤3 groups (crown + protagonist stream + at most one more). NO text, NO numbers, no gradients, no filters; pure primitives; explicit coordinates; crisp, nothing blurry; rotations ≤25° on in-flight signals only.
5. Committed state = small aligned tick rows (never stacks); a dashed element marks the laggard's deficiency.

## Shared technique rules (both candidates)

- Patterns in `<defs>`, all `patternUnits="userSpaceOnUse"`, ids prefixed per candidate (`gem-raft-a-*`, `gem-raft-b-*`): `dense` (7×7, dot r 1.9, `#ff6a5f`), `sparse` (11×11, dot r 1.6, `#7d7669`), `halo` (7×7, dot r 1.9, `#ff6a5f`).
- Halo contract: exactly one ellipse `className="gem-halo"` `style={haloVar(0.12)}`, coral dots, opacity 0.12 (CSS pulse binds to the class).
- Wide sparse backdrop ellipse (`url(#...-sparse)`, opacity 0.09, ~rx 104 ry 64, cx ~130 cy ~84).
- Volume via `<clipPath>` stepped caps only; `aria-hidden="true"` on the `<svg>`.
- Palette (exhaustive): NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4` (+ white glints ≤2); CORAL `#ff6a5f`, deep `#7d2723`. No other hues.
- **Mobile safe area (hard rule):** ALL hard content within x 16→244, y 16→144. Only the sparse backdrop and halo ellipse may exceed it.
- ~20–30 primitives grouped into `<g>`s; legible at 213px; strokes ≤3.5 wide, round caps. Chevrons are tiny open ">" polylines (3–4px).

## CANDIDATE A — "Replication stream" (leader→follower fan-out with live traffic)

The classic replication diagram, energised: a dominant crowned leader on the left broadcasts along two rails fanning to followers at unequal heights; the upper rail carries a STREAM (protagonist capsule + trailing halftone echoes); a dashed ack hairline returns beneath the lower rail; every node keeps a committed log row with a frontier hairline.

Geometry anchors (refine within ±4px, keep on-curve placements):

- LEADER (dominant mass), left (72, 78): disc r 16 — full stepped caps (`#26333b` r 16, `#465059` r 12 offset (0,−2), `#7d7669` r 7 offset (0,−4), clipped) + coral halftone r 10 offset (0,−3) `url(#gem-raft-a-dense)` opacity 0.75 clipped. Deep-coral ring r 22 (`#7d2723` width 3.5, opacity 0.9). Two coral antenna ticks up ((67,54)→(64,47) and (77,54)→(80,47), stroke `#ff6a5f` width 1.5). One white glint.
- FOLLOWER upper-right (198, 46) r 11: stepped caps (`#26333b` r 11, `#465059` r 8 offset (0,−1.5), `#7d7669` r 4.5 offset (0,−3), clipped) + hairline rim r 12.5 (`#465059` width 1, opacity 0.5).
- LAGGARD lower-right (192, 114) r 11: de-saturated (`#26333b` r 11 + `#465059` r 7.5 offset (0,−1.5) only) + hairline rim — still catching up.
- UPPER RAIL: `M 92 70 Q 140 44 186 47` stroke `#465059` width 2.5, opacity 0.8, round cap. LOWER RAIL: `M 92 88 Q 136 112 180 113` same style. One chevron per rail pointing away from the leader: upper at ~(140, 51) rotated ~−12°, lower at ~(136, 105) rotated ~10° (`#7d7669`).
- THE STREAM (protagonist, on the upper rail's curve): coral capsule 15×8 (rx 4, fill `#ff6a5f`) at ~(152, 50) rotated ~−9° to the tangent + white glint 2×2. Trailing echoes (the same broadcast's wake): halftone dot r 4.5 `url(#gem-raft-a-dense)` opacity 0.7 at ~(130, 54); halftone dot r 3.5 opacity 0.5 at ~(111, 61). These sit ON the Q-curve (t≈0.65, 0.4, 0.2).
- ACK RETURN (feedback): dashed hairline `M 178 122 Q 134 124 96 102` stroke `#7d7669` width 1, dasharray "2 4", opacity 0.5, with one chevron pointing back toward the leader at ~(137, 123) rotated ~194°.
- COMMITTED LOG ROWS (the diagram's rhythm — identical structure per node): each row = three ticks 7×6, 2px gaps, colour sequence per position IDENTICAL: `#465059 / #7d7669 / #b6ac95`, plus a dashed frontier hairline (stroke `#7d7669` width 1, dasharray "2 3", opacity 0.6) between tick 2 and tick 3. Leader row at y 108, ticks x 56/65/74, frontier at x 73 (y 105→116). Follower row at y 64, ticks x 187/196/205, frontier x 204 (y 61→72). Laggard row at y 128, ticks x 181/190, third slot DASHED OUTLINE ONLY (x 199, fill none, stroke `#7d7669` width 1, dasharray "2 2"), frontier x 198 (y 125→136).
- Halo ellipse over the leader: cx ~78 cy ~80.

## CANDIDATE B — "Write frontier" (the shared log as a bus, caught mid-append)

The replicated log as a horizontal spine: committed entries left of a bright frontier hairline, the empty future continuing as a dashed outline past it. The crowned leader stands AT the frontier on a solid stub, writing the coral entry that hangs mid-drop above the first empty slot; a follower and a dashed-stub laggard tap in behind.

Geometry anchors (refine within ±4px):

- SPINE (committed log): bar rect x 40 y 110 w 136 h 4.5 rx 2.25 fill `#465059`. Six entry separators crossing it: lines at x 56/74/92/110/128/146, y 108→116.5, stroke `#26333b` width 1, opacity 0.9 — the committed entries, read left to right.
- WRITE FRONTIER: line x 178, y 104→122, stroke `#b6ac95` width 1.5, opacity 0.9 — bright, the diagram's event.
- FUTURE TAIL: dashed line `M 182 112.25 L 218 112.25` stroke `#7d7669` width 1.2, dasharray "4 4", opacity 0.6 — the log's not-yet-written region.
- ENTRY IN FLIGHT (protagonist): coral capsule 14×7 (rx 3.5, fill `#ff6a5f`) at ~(190, 94) rotated ~12° (mid-drop toward the tail's first slot) + white glint 2×2 + one halftone queuing dot r 3.5 `url(#gem-raft-b-dense)` opacity 0.6 at ~(204, 100).
- DIRECTION: two chevrons above the bar pointing right, at (104, 104) and (150, 104), `#7d7669`.
- LEADER at the frontier: disc (176, 62) r 13 — stepped caps + coral halftone r 8 offset (0,−3) opacity 0.75 clipped; deep-coral ring r 18 (`#7d2723` width 3.5, opacity 0.9); two coral antenna ticks up ((171,42)→(168,35) and (181,42)→(184,35), width 1.5); one white glint. Solid stub down to the spine: line (176, 80)→(176, 108), stroke `#465059` width 2.
- FOLLOWER (108, 58) r 10: stepped caps (`#26333b`, `#465059` r 7 offset (0,−1.5), `#7d7669` r 4 offset (0,−3)) + hairline rim r 11.5. Solid stub (108, 69.5)→(108, 108), width 2.
- LAGGARD (58, 62) r 10: de-saturated caps (base + one inner step) + hairline rim. DASHED stub (58, 72)→(58, 108): stroke `#7d7669` width 1.5, dasharray "3 3", opacity 0.8 — its replication link still filling in; this is the deficiency.
- Halo ellipse over leader/frontier: cx ~168 cy ~84.

## Self-check (both candidates)

- Squint-test at 213px: A = a big crowned node fanning live traffic to two smaller nodes with logs underneath — an unmistakable replication diagram in motion. B = a horizontal log bus with a bright frontier and an entry dropping into the empty future — an unmistakable write path. Both read "system design" in under a second.
- Every element is diagram vocabulary — zero scenery props. Nothing symmetric-and-static: one dominant node, clear direction, live traffic.
- Coral ≤3 groups; no stacked masses; no blur; explicit coordinates; nothing overlapping that shouldn't (check every anchor against its neighbours before finalising).
- All hard content inside x 16→244, y 16→144. Exactly one `gem-halo`. No text, no gradients, no filters.

## Output format

1. One ```tsx block: `function RaftCandidateA() { ... }` (Replication stream).
2. One ```tsx block: `function RaftCandidateB() { ... }` (Write frontier).
3. ≤3 sentences per candidate: which interest lever you pushed hardest + coral coverage estimate + any anchor deviation.
