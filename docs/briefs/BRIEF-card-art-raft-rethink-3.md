# BRIEF — Raft Cluster mark, round 3: the write frontier at Practice-Map boldness (TWO candidates)

Round context: the six-mark family language is **Spot-Colour Overprint**. Round 1's scene candidates were rejected ("i want so that it would be easily understandable that this is system design") — the architecture-diagram vocabulary is mandatory. Round 2 kept that vocabulary: candidate A (replication stream) was dropped, but candidate B — **the write frontier** (a horizontal log bus, committed entries left of a bright frontier hairline, dashed empty future right of it, three stub-connected nodes, the crowned leader at the write head, one coral entry in flight) — the owner wants to KEEP WORKING ON IT. Verdict, quoted: "keep working on candidate b. it has something ok. but it is not it. **i want i guess more elements. i want something more like practice map illustration 'boldness'** — i don't know how to tell it. what you give me feels quite **conservative/safe**."

**What "Practice-Map boldness" means concretely** (the adopted Practice Map mark is the family's richest): it FILLS the plate — nested contour rings sweep across the whole 260×160 (outer ring radius ~76, deformed so they read as terrain), a lit summit beacon rises as a tall vertical accent with a flag pennant, a dashed trail climbs from a base-camp cluster (two tiny tents + a ground tick), a compass rose sits in a corner, the climbed band is overprinted in halftone, and a "you are here" pulse ring doubles the accent. That is ~30+ primitives of MANY DIFFERENT TYPES, edge-to-edge structure, and one element with real focal weight.

**The round-3 job:** take the write-frontier concept and give it that same density and drama — WITHOUT breaking the system-design read. Every added element must still be diagram vocabulary: nodes, links, signals, log entries, frontier/indicator hairlines, chevrons, gauges. Allowed new element types (all diagram-idiom, not scenery): an entry-index tick row ("comb teeth") riding the bus, a committed-region halftone overprint band, a frontier beacon pointer, a small circular TERM DIAL (a gauge: circle + progress arc + hand — the instrumentation equivalent of Practice Map's compass rose), a dashed acknowledgement rail. Still forbidden: any scenery or narrative props (no boats, waves, cracks, flags-on-poles-with-no-meaning), no text, no numbers.

**Interest levers to push (from the owner's verdict):** edge-to-edge structure; 35–45 primitives of varied types; halftone overprint used BOLDLY (the committed span of the log is overprinted in coral halftone — this is the mark's big colour moment); one dominant focal node; live traffic; solid-vs-dashed state contrast.

You have NO repo access; your two code blocks are integrated verbatim into `portfolio/shell/src/design-directions/art-directions/raftRethink3.tsx`. `haloVar` exists in that module's scope. The owner picks candidate A or B from rendered evidence.

---

## TASK

Design TWO complete, distinct SVG candidates, both evolutions of the write-frontier concept. Senior developer's portfolio landing page: dark editorial "ink catalogue", plate `#0b1317`, neutral ink, halftone screens, film grain. Card mark: `260 × 160` SVG rendered ~213–260px wide. Hue: CORAL. Subject: "Raft Cluster — live Raft consensus in the browser — crash the leader and watch elections answer" (Rust, WebAssembly, TypeScript). The bar: a developer reads "distributed systems" in under a second, and the mark has the compositional richness of a full illustration, not a sparse sketch.

**Hard rules (both candidates):**
1. Exactly THREE nodes; leader identifiable WITHOUT text via the crown grammar: deep-coral ring + coral halftone overprint cap + two coral antenna ticks. The leader is the LARGEST node (r ≥ 13) and stands directly at the write frontier — its stub and the frontier hairline are collinear (the leader IS at the write head).
2. Every element is diagram vocabulary (node, link, signal, log entry, frontier, index tick, chevron, gauge). No scenery.
3. Node idiom: stepped-cap discs (2–3 clipped inner circles) + hairline rim; laggard de-saturated (one fewer step) with a dashed stub or dashed log slot.
4. CORAL ≤3 groups: leader crown (1) + committed-region halftone overprint band (2) + the in-flight entry with its echo (3). Any additional traffic (e.g. candidate B's upper-tier stream) is PAPER `#eeeae0` / neutral, never coral.
5. NO text, NO numbers, no gradients, no filters; pure primitives; explicit coordinates; crisp; rotations ≤25° on in-flight signals only.

## Shared technique rules (both candidates)

- Patterns in `<defs>`, all `patternUnits="userSpaceOnUse"`, ids prefixed per candidate (`gem-raft-a-*`, `gem-raft-b-*`): `dense` (7×7, dot r 1.9, `#ff6a5f`), `sparse` (11×11, dot r 1.6, `#7d7669`), `halo` (7×7, dot r 1.9, `#ff6a5f`).
- Halo contract: exactly one ellipse `className="gem-halo"` `style={haloVar(0.12)}`, coral dots, opacity 0.12.
- Wide sparse backdrop ellipse (`url(#...-sparse)`, opacity 0.09, ~rx 104 ry 64, cx ~130 cy ~84).
- Volume via `<clipPath>` stepped caps only; `aria-hidden="true"` on the `<svg>`; do NOT set width/height attributes (CSS scales the SVG).
- Palette (exhaustive): NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4` (beacon pointer, paper traffic capsule, glints ≤2); CORAL `#ff6a5f`, deep `#7d2723`. No other hues.
- **Mobile safe area (hard rule):** ALL hard content within x 16→244, y 16→144. Only the sparse backdrop and halo ellipse may exceed it.
- ~35–45 primitives grouped into `<g>`s; strokes ≤3.5 wide, round caps; every element ≥1.5px in its smallest dimension.
- Before finalising, verify no two elements collide unintentionally (walk each anchor against its neighbours).

## CANDIDATE A — "Ledger span" (the log as a monumental full-width beam)

One tier: the log as a chunky stepped beam spanning the whole plate, committed span overprinted coral, bright frontier with a beacon pointer, all three nodes hanging above it, the entry mid-drop into the unwritten future, a dashed ack rail sweeping under the beam, a term dial in the corner.

Geometry anchors (refine within ±4px; the leader/frontier collinearity at x 178 is exact):

- BEAM (the log, monumental): base rect x 24 y 96 w 212 h 10 rx 2 fill `#26333b`; mid strata rect x 24 y 92 w 212 h 6 rx 2 fill `#465059`; top strata rect x 24 y 89 w 212 h 3.5 rx 1.75 fill `#7d7669` (beam spans y 89–106, x 24–236).
- COMMITTED OVERPRINT: rect x 24 y 89 w 154 h 17 fill `url(#gem-raft-a-dense)` opacity 0.3 — the committed span, the mark's big coral texture moment.
- ENTRY CUTS: five committed separators at x 52/80/108/136/164, y 89→106, stroke `#0b1317` width 1.2, opacity 0.9; one DASHED separator in the future at x 206, y 89→106, stroke `#7d7669` width 1, dasharray "3 3", opacity 0.6.
- COMB TEETH (entry index): ticks above the beam over each committed separator: x 52/80/108/136/164, y 85.5→89, stroke `#b6ac95` width 1.5, opacity 0.9.
- FRONTIER (the event): line x 178, y 76→112, stroke `#b6ac95` width 2, opacity 1 — collinear with the leader's stub above and continuing through the beam; beacon pointer below: triangle (174.5, 112) (181.5, 112) (178, 118.5) fill `#eeeae0`.
- LEADER at the frontier: disc (178, 56) r 14 — stepped caps (`#26333b` r 14, `#465059` r 10 offset (0,−2), `#7d7669` r 6 offset (0,−4)) + coral halftone cap r 9 offset (0,−3) opacity 0.75 clipped; ring r 19 (`#7d2723` width 3.5, opacity 0.9); antenna ticks (172,35)→(169,28) and (184,35)→(187,28) (`#ff6a5f` width 1.5); white glint 2×2. Stub: line (178, 75)→(178, 89), stroke `#465059` width 2.5.
- FOLLOWER (92, 52) r 10.5: stepped caps + hairline rim r 12 (`#465059` width 1, opacity 0.5). Solid stub (92, 64)→(92, 89), width 2.
- LAGGARD (40, 58) r 10.5: de-saturated caps (base + one inner step `#465059` r 7 offset (0,−1.5)) + rim. DASHED stub (40, 70)→(40, 89), stroke `#7d7669` width 1.5, dasharray "3 3", opacity 0.8.
- ENTRY IN FLIGHT: coral capsule 15×8 (rx 4, fill `#ff6a5f`) at ~(202, 68) rotated ~14° (mid-drop toward the future span) + white glint; halftone echo r 4 `url(#gem-raft-a-dense)` opacity 0.6 at ~(218, 78).
- ACK RAIL: dashed `M 214 116 Q 130 126 52 108`, stroke `#7d7669` width 1, dasharray "2 4", opacity 0.5, chevron pointing left at ~(130, 122) rotated ~188°.
- TERM DIAL (corner instrumentation): circle (40, 30) r 7 stroke `#465059` width 1.2 opacity 0.7; top progress arc `M 36.5 24.4 A 7 7 0 0 1 43.5 24.4` stroke `#7d7669` width 1.5 opacity 0.7; hand line (40,30)→(40,25) stroke `#b6ac95` width 1.5; centre dot r 1.3 fill `#7d7669`.
- Halo ellipse over the frontier: cx ~150 cy ~76.

## CANDIDATE B — "Two-tier consensus" (traffic plane above, log plane below)

The card split into Raft's two planes: the live messaging tier on top (dominant crowned leader right, rails fanning left to two followers, a paper-coloured stream with neutral echoes, dashed ack return) and the log tier below (full-width bus, coral committed overprint, bright frontier + beacon, dashed future, entry mid-drop). Stubs tie every node to its place on the log; the leader's stub lands exactly on the frontier.

Geometry anchors (refine within ±4px; the leader/frontier collinearity at x 196 is exact):

- UPPER TIER — LEADER right (196, 48) r 14: full stepped caps + coral halftone cap r 9 offset (0,−3) opacity 0.75 clipped; ring r 19 (`#7d2723` width 3.5, opacity 0.9); antennae (190,27)→(187,20) and (202,27)→(205,20); glint. FOLLOWER (64, 40) r 10: stepped caps + rim r 11.5. LAGGARD (76, 76) r 10: de-saturated caps + rim.
- UPPER RAIL (broadcast, right-to-left): `M 178 42 Q 124 26 76 41` stroke `#465059` width 2.5 opacity 0.8; chevron pointing left at (126, 32) rotated ~180°. LOWER RAIL: `M 178 56 Q 130 72 88 75` same style; chevron at (132, 69) rotated ~166°.
- THE STREAM (paper, not coral): capsule 15×8 rx 4 fill `#eeeae0` at ~(127, 32.5) rotated ~0° riding the upper rail, white glint at its RIGHT (trailing) end — motion is right-to-left; neutral trailing echoes: flat circles fill `#7d7669`, r 4 opacity 0.55 at ~(141, 34.5), r 3 opacity 0.4 at ~(157, 37) (on-curve).
- ACK RETURN: dashed `M 88 82 Q 134 88 170 64`, stroke `#7d7669` width 1, dasharray "2 4", opacity 0.5, chevron pointing right at ~(132, 82) rotated ~−12°.
- LOWER TIER — BUS: rect x 24 y 104 w 212 h 8 rx 2 fill `#26333b`; top strata rect x 24 y 101 w 212 h 3.5 rx 1.75 fill `#465059` (bus spans y 101–112). COMMITTED OVERPRINT: rect x 24 y 101 w 172 h 11 fill `url(#gem-raft-b-dense)` opacity 0.3.
- ENTRY CUTS: four committed separators x 56/88/120/152, y 101→112, stroke `#0b1317` width 1.2, opacity 0.9; one dashed future separator x 214, y 101→112, stroke `#7d7669` width 1, dasharray "3 3", opacity 0.6.
- FRONTIER x 196: line y 92→118, stroke `#b6ac95` width 2, opacity 1 (collinear with the leader's stub); beacon pointer triangle (192.5, 118) (199.5, 118) (196, 124.5) fill `#eeeae0`.
- FUTURE TAIL: dashed `M 200 106.5 L 232 106.5`, stroke `#7d7669` width 1.2, dasharray "4 4", opacity 0.6.
- STUBS: leader (196, 67)→(196, 101), stroke `#465059` width 2.5; follower (64, 51)→(64, 101), width 2; laggard (76, 87)→(76, 101), stroke `#7d7669` width 1.5, dasharray "3 3", opacity 0.8.
- ENTRY IN FLIGHT: coral capsule 14×7 (rx 3.5, fill `#ff6a5f`) at ~(208, 82) rotated ~12° + white glint; halftone echo r 3.5 `url(#gem-raft-b-dense)` opacity 0.6 at ~(222, 92).
- Halo ellipse over the frontier/leader: cx ~150 cy ~72.

## Self-check (both candidates)

- Squint-test at 213px: the mark FILLS its plate like the Practice Map climb — a monumental log structure edge to edge, a big coral halftone moment, a dominant crowned node at a bright frontier, live traffic, and 35–45 elements of varied types. It must NOT feel sparse or safe.
- Still reads "system design" in under a second: bus/log, frontier, nodes, signals — zero scenery.
- Coral exactly 3 groups (crown, overprint band, in-flight entry); anything extra is paper/neutral.
- All hard content inside x 16→244, y 16→144; exactly one `gem-halo`; no text, no gradients, no filters; no unintentional overlaps.

## Output format

1. One ```tsx block: `function RaftCandidateA() { ... }` (Ledger span).
2. One ```tsx block: `function RaftCandidateB() { ... }` (Two-tier consensus).
3. ≤3 sentences per candidate: which boldness moves you pushed hardest + coral coverage estimate + any anchor deviation.
