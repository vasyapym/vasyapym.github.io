# BRIEF — Raft Cluster mark, visual-interest rethink: TWO complete candidates (a scene, not a schematic)

Round context: the six-mark family language is **Spot-Colour Overprint** (adopted) and the other five marks are settled. The Raft mark's current adopted design ("control loop": one dashed feedback ring, three small nodes on it, a 3-bar register at the centre, one coral capsule in flight) is semantically correct, but the owner's verdict, quoted: "currently good but **boring** — needs more visual interest or a fresh concept while still serving its purpose." Diagnosis to internalise: the mark is a **symmetric schematic** — everything small and evenly weighted (1.5px dashes, 10–12px nodes, tiny bars), no dominant mass, no diagonal energy, no moment. It *explains* the system; it must *stage* it. The family bar is high: Cat Runner is a big head silhouette, Explosion an ordered shatter, Planck nested epoch ripples, Practice Map a terraced climb with a lit summit — Raft is the only mark that still reads as a diagram.

**Rejection history — do NOT regress to any of these:**
1. Nodes linked by thick soft lines + floating log squares: thick blurry links, scattered rotations, no cluster boundary. Crisp only.
2. "Append-only columns" (three vertical stacks of solid squares): read as a **clay model** — solid, sculptural, monolithic. No big stacked masses.
3. The control loop's stillness is the current sin: symmetric, static, diagrammatic.

You have NO repo access; your two code blocks are integrated verbatim into `portfolio/shell/src/design-directions/art-directions/raftRethink.tsx`. `haloVar` already exists in that module's scope. The owner picks candidate A or B from rendered evidence.

---

## TASK

Design TWO complete, distinct SVG candidates for one card mark. Senior developer's portfolio landing page: dark editorial "ink catalogue", plate `#0b1317`, neutral ink, halftone screens, film grain. Card mark: `260 × 160` SVG rendered ~213–260px wide; one of a six-mark family. This card's hue is CORAL. Subject: "Raft Cluster — live Raft consensus in the browser — crash the leader and watch elections answer" (Rust, WebAssembly, TypeScript). The bar: this mark alone says its author understands distributed systems AND has visual personality.

**What the mark must still say (purpose survives both candidates):**
1. A three-node cluster with a leader identifiable WITHOUT text (keep the adopted crown grammar: deep-coral ring + coral halftone overprint cap on the leader's disc).
2. ONE entry/signal in flight in CORAL — the protagonist.
3. Message flow visible as direction (chevrons, dash rhythm, wake, or an arc's asymmetry).
4. The replicated log / committed state as small aligned ticks or lashed bars — never big vertical stacks.
5. A deficiency the system is correcting (a dashed empty slot, a gap, a crash).
6. The family read: printed survey plate, ink on dark paper, one spot colour.

**Hard rules (both candidates):** exactly THREE nodes; CORAL confined to ≤3 groups (protagonist + leader crown + at most one more); NO text, NO numbers, no gradients, no filters; pure primitives; every coordinate explicit (no runtime randomness); crisp edges, nothing blurry; rotations ≤25° and only on in-flight capsules, loose debris ticks, or the crashed node's crack/tilt details.

## Shared technique rules (both candidates)

- Patterns in `<defs>`, all `patternUnits="userSpaceOnUse"`, ids prefixed per candidate (`gem-raft-a-*`, `gem-raft-b-*`): `dense` (7×7, dot r 1.9, `#ff6a5f`), `sparse` (11×11, dot r 1.6, `#7d7669`), `halo` (7×7, dot r 1.9, `#ff6a5f`).
- Halo contract: exactly one ellipse `className="gem-halo"` `style={haloVar(0.12)}`, coral dots, opacity 0.12 (CSS pulse binds to the class).
- Wide sparse backdrop ellipse (`url(#...-sparse)`, opacity 0.09, ~rx 104 ry 64, cx ~130 cy ~84).
- Volume via `<clipPath>` stepped caps only; `aria-hidden="true"` on the `<svg>`.
- Palette (exhaustive): NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4` (+ white glints ≤2); CORAL `#ff6a5f`, deep `#7d2723`. No other hues.
- **Mobile safe area (hard rule):** ALL hard content within x 16→244, y 16→144. Only the sparse backdrop and halo ellipse may exceed it.
- ~15–30 elements grouped into `<g>`s; legible at 213px; strokes ≤3.5 wide, round caps.

## CANDIDATE A — "Succession" (the election moment, frozen mid-frame)

The tagline's own story: the old leader has just crashed; the surviving nodes are electing its replacement. One diagonal composition, lower-left (the fall) to upper-right (the coronation). Mid-election, so log lengths DIFFER — that asymmetry is the point: Raft elects the most up-to-date log.

Geometry anchors (refine within ±6px):

- CRASHED EX-LEADER, left (58, 86): disc r 13, de-saturated stepped caps only (`#26333b` base + `#465059` inner r 9, clipped). Its old crown slipped: dashed neutral arc r 16.5 around it, ~200° with the gap facing up-right, stroke `#7d7669` width 2, dasharray "5 6", opacity 0.55. One drooped antenna tick (line (52,70)→(47,67), stroke `#7d7669` width 1.5, opacity 0.6). Crack across the disc: polyline `M 47 78 L 54 85 L 49 92` stroke `#0b1317` width 1.5, round join — visible against the caps. Its log scattered: one seated tick 6×5 `#465059` under the disc at (44, 104); two debris ticks knocked loose: 6×5 `#465059` rotated 24° at (74, 97), 6×5 `#7d7669` rotated −18° at (65, 106).
- ELECTED SUCCESSOR, upper-right (174, 58): the dominant mass. Disc r 15, full stepped caps (`#26333b` r 15, `#465059` r 11 offset (0,−2), `#7d7669` r 6.5 offset (0,−4), clipped) + coral halftone circle r 9.5 offset (0,−3) `url(#gem-raft-a-dense)` opacity 0.75 clipped inside. Coronation ring: deep-coral `#7d2723` r 20, stroke width 3.5, opacity 0.9, round caps, drawn as a ~300° arc with a 60° gap facing DOWN-LEFT toward the arriving vote (arc sweeps top→right→bottom; the crown closes where the mandate lands). Two coral antenna ticks fanning up from the ring top (e.g. (169,37)→(166,30) and (179,37)→(182,30), stroke `#ff6a5f` width 1.5). Self-ballot: small coral capsule 8×5 (rx 2.5, fill `#ff6a5f`) at (199, 73) rotated −35°. One white glint on the cap.
- SUCCESSOR'S LOG (why it wins): three aligned ticks 7×6 at y 80, x 164/174/184 (1px gaps), colours `#465059 / #7d7669 / #b6ac95`, sitting on one hairline baseline (line y 87, x 160→190, stroke `#465059` width 1, opacity 0.5).
- VOTER FOLLOWER, lower-centre (124, 118): disc r 10.5, stepped caps + hairline rim (r 12, stroke `#465059` width 1, opacity 0.5). Its shorter log: two ticks 6×5 at (112, 130) `#465059` and (120, 130) `#7d7669` + third DASHED EMPTY slot at (128, 130): 6×5, fill none, stroke `#7d7669` width 1, dasharray "2 2" — it defers because its log is behind.
- THE VOTE (protagonist): dashed ballot path `M 128 107 Q 143 76 161 66` stroke `#7d7669` width 1.2, dasharray "2 5", opacity 0.5. Riding it at ~(148, 81): coral capsule 15×8 (rx 4, fill `#ff6a5f`) rotated −38° to the tangent + white glint 2×2. Echo: coral halftone dot r 4 `url(#gem-raft-a-dense)` opacity 0.7 back along the path at (135, 97). One neutral chevron on the path at ~(137, 91) rotated ~−50° pointing up-right (`#7d7669`).
- Halo ellipse centred on the successor: cx ~165 cy ~66.

## CANDIDATE B — "The log raft" (the metaphor made literal)

The pun IS the domain: in Raft, the replicated log is what carries the state machine across failures — so the cluster rides a RAFT of lashed logs across the sea. Two committed logs lashed side-by-side are the agreed log; the newest entry arrives hoisted from the mast, coral, about to be lashed into an empty deck slot. Direction: the raft sails left-to-right, wake trailing.

Geometry anchors (refine within ±6px):

- WATER: two long dashed wave lines below the hull — `M 30 118 L 118 118` stroke `#465059` width 1.5, dasharray "14 10", opacity 0.5; `M 138 124 L 230 124` stroke `#7d7669` width 1, dasharray "10 12", opacity 0.4. WAKE trailing left of the hull (motion, left-to-right travel): three shrinking dashes at y 106: x 60→84 (length 14, `#7d7669` op 0.5), x 46→58 (op 0.35), x 34→42 (op 0.25), width 1.5 round caps. One tiny wake chevron pointing right at (74, 100) (`#7d7669`, 3px).
- THE RAFT (the mass, centre-right): TWO horizontal logs stacked — log 1: rect x 96 y 96 w 96 h 8 rx 4 fill `#465059`; log 2 under it: rect x 100 y 105 w 88 h 8 rx 4 fill `#26333b`; each with a 2px top-edge highlight bar (x+3, same width −6, h 2, rx 1, fill `#7d7669`, opacity 0.8) — stepped shading, crisp. LASHINGS (committed = tied): two vertical rope lines at x 120 and x 170, y 94→115, stroke `#b6ac95` width 1.5, opacity 0.9, each with one small X tie (two 4px crossing strokes `#b6ac95` width 1) at the log-1 midline y 100.
- EMPTY DECK SLOT (the deficiency): dashed outline log rect x 132 y 88 w 22 h 8 rx 4, fill none, stroke `#7d7669` width 1.2, dasharray "3 3", opacity 0.65 — the next entry's place, waiting.
- THE ENTRY IN FLIGHT (protagonist): coral log rect x 138 y 60 w 22 h 8 rx 4 fill `#ff6a5f`, rotated −6°, white glint 2×2 on it — being swung into the slot. Hoist line from the masthead pulley to the log's right end: `M 182 46 L 158 62` stroke `#7d7669` width 1, dasharray "2 3", opacity 0.6.
- MAST at the raft's right end: line x 184, y 46→96, stroke `#465059` width 2, round caps; pulley circle r 3 at (184, 44) fill `#465059`.
- THREE NODES standing on deck (feet on y 96): LEADER right (172, 82): disc r 9, stepped caps + coral halftone cap r 6 `url(#gem-raft-b-dense)` op 0.75 clipped; deep-coral ring r 13 (stroke `#7d2723` width 3, opacity 0.9); two coral antenna pennant ticks up ((168,68)→(166,62) and (176,68)→(178,62), stroke `#ff6a5f` width 1.5); one white glint. FOLLOWER (114, 86): disc r 8, stepped caps + hairline rim r 9.5 op 0.5. LAGGARD (140, 87): disc r 8, de-saturated (base + one inner step only), hairline rim — it watches the entry it must still receive.
- Halo ellipse over the raft/leader: cx ~150 cy ~82.

## Self-check (both candidates)

- Squint-test at 213px: A = a fallen king lower-left, a crowned winner upper-right, a vote mid-flight between them — a MOMENT, asymmetric, alive. B = a lashed log raft under sail-less mast with a coral log being hoisted aboard, wake trailing — a SCENE, warm and memorable. Both instantly "three nodes, crowned leader, log entry in flight".
- NOT a symmetric diagram: one dominant mass, real diagonal/scene energy, nothing evenly spaced.
- Coral ≤3 groups; no stacked solid masses; no blurry strokes; nothing random.
- All hard content inside x 16→244, y 16→144. Exactly one `gem-halo`. No text, no gradients, no filters.

## Output format

1. One ```tsx block: `function RaftCandidateA() { ... }` (Succession).
2. One ```tsx block: `function RaftCandidateB() { ... }` (The log raft).
3. ≤3 sentences per candidate: the beat you emphasised + coral coverage estimate + any anchor deviation.
