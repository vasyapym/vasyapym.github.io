# BRIEF — Raft Cluster mark, round 4: break the graphic grammar (TWO candidates, new visual languages)

Round context: three rethink rounds in a row were rejected with the same verdict escalating: round 1 ("i want so that it would be easily understandable that this is system design"), round 2 ("feels quite conservative/safe"), and now round 3, quoted: "**you keep making the same. completely rethink but still consistent.**"

**The honest diagnosis you must internalise:** every candidate so far — control loop, succession, log raft, replication stream, write frontier, ledger span, two-tier consensus — reused ONE micro-grammar: small stepped-cap disc nodes with hairline rims, thin link strokes, dashed hairlines, tick-row logs, capsule signals. Only the arrangement changed. The owner sees the same drawing seven times. **This round you must abandon that micro-grammar entirely.** Forbidden from here on: stepped-cap discs, hairline node rims, log tick rows, small capsule-on-a-dashed-path signals, the "three dots connected by thin lines" archetype.

**What "still consistent" means (the family TECHNIQUE — keep all of it):** dark editorial ink catalogue, plate `#0b1317` showing through; neutral ink ramp `#26333b #465059 #7d7669 #b6ac95`; paper `#eeeae0 #f4efe4` sparingly; ONE spot colour CORAL `#ff6a5f` (+ deep `#7d2723`); halftone dot screens; film-grain print feel; no text, no numbers, no gradients, no filters; crisp primitives; exactly one `gem-halo` pulse; mobile safe area.

**What the mark must still say:** Raft consensus — three nodes, one leader (identifiable without text via a DEEP-CORAL RING + coral halftone presence), committed shared state vs. unwritten future, one live coral protagonist, a lagging node's deficiency, visible direction. A developer reads "distributed systems" in under a second.

You have NO repo access; your two code blocks are integrated verbatim into `portfolio/shell/src/design-directions/art-directions/raftRethink4.tsx`. `haloVar` exists in that module's scope. The owner picks candidate A or B from rendered evidence.

---

## TASK

Design TWO complete, distinct SVG candidates, each in a COMPLETELY different graphic language from all previous rounds — and from each other. Card: `260 × 160` SVG, ~213–260px wide, plate `#0b1317`. Hue: CORAL. Subject: "Raft Cluster — live Raft consensus in the browser — crash the leader and watch elections answer" (Rust, WebAssembly, TypeScript). Boldness bar: big masses, heavy ink, fills the plate like a poster — not a sketch of small parts.

**Hard rules (both candidates):**
1. Exactly THREE nodes; the leader carries a deep-coral ring + coral halftone presence (the crown READ survives even though the node style does not).
2. Committed state and unwritten future are two visibly different textures/solids — not tick rows.
3. CORAL ≤3 groups. NO text, NO numbers, no gradients, no filters, explicit coordinates, crisp, nothing blurry.
4. Nothing outside x 16→244 / y 16→144 except the backdrop ellipse and halo.

## Shared technique rules (both candidates)

- Patterns in `<defs>`, all `patternUnits="userSpaceOnUse"`, ids prefixed per candidate (`gem-raft-a-*`, `gem-raft-b-*`). You will need NEW patterns (defined below per candidate): the coral screens `dense` (7×7, dot r 1.9, `#ff6a5f`), `sparse` (11×11, dot r 1.6, `#7d7669`), `halo` (7×7, dot r 1.9, `#ff6a5f`), plus candidate A's neutral ink screen `inkdots` (7×7, dot r 1.9, `#465059`, optionally `patternTransform` phase-shifted per disc).
- Halo contract: exactly one ellipse `className="gem-halo"` `style={haloVar(0.12)}`, coral dots, opacity 0.12. Wide sparse backdrop ellipse (`url(#...-sparse)`, opacity 0.09, ~rx 104 ry 64, cx ~130 cy ~84).
- `aria-hidden="true"` on the `<svg>`; NO width/height attributes (CSS scales it).
- ~20–35 primitives; every element ≥2.5px in its smallest dimension (heavier ink than previous rounds); strokes 2.5–6 wide.

## CANDIDATE A — "Quorum overprint" (consensus as three giant overlapping halftone discs)

The spot-colour Overprint language, finally used literally at poster scale: three huge translucent halftone discs overlap in the centre of the plate; the TRIPLE-overlap region — the quorum, where all three agree — blazes in solid coral. The leader is the top-right disc with a bold deep-coral ring and a solid coral core; one coral entry travels from it into the consensus zone; the bottom disc is the laggard — its ring has a dashed gap facing the zone (the missed write it must catch).

Geometry anchors (refine within ±4px; the triple-overlap zone position matters — keep the discs close enough that it exists):

- LEADER disc: centre (152, 62), r 42. Fill `url(#gem-raft-a-dense)` opacity 0.15; ring stroke `#7d2723` width 4 (the crown, at poster scale); solid deep-coral core disc r 8 at centre; white glint 2×2 offset (−3,−4).
- FOLLOWER disc: centre (80, 74), r 40. Fill `url(#gem-raft-a-inkdots)` opacity 0.14; ring stroke `#465059` width 3; small neutral core dot r 4 fill `#7d7669`.
- LAGGARD disc: centre (118, 102), r 40. Fill `url(#gem-raft-a-inkdots)` with `patternTransform="translate(3.5 3.5)"` opacity 0.12 (phase-shifted, so overlaps visibly densify); ring drawn as ONE arc from 274° to 250° the long way round (`M 120.8 62.1 A 40 40 0 1 1 104.3 64.4`, stroke `#465059` width 3) leaving a 24° gap facing the consensus zone, bridged by a dashed arc `M 104.3 64.4 A 40 40 0 0 1 120.8 62.1` stroke `#7d7669` width 2.5, dasharray "4 4", opacity 0.7 — the missed write's gap. Core dot r 4.
- CONSENSUS ZONE (the triple overlap, ~(115, 80)): solid coral circle r 11, fill `#ff6a5f`, opacity 0.9; coral halftone bloom around it: circle r 19, fill `url(#gem-raft-a-dense)`, opacity 0.45. This zone is the mark's focal point and its meaning: where all three agree.
- ENTRY IN FLIGHT: coral capsule 12×7 (rx 3.5, fill `#ff6a5f`) at ~(134, 71) rotated ~−26°, mid-flight from the leader's core toward the zone; two decaying trail dots behind it: r 2.5 at (143, 66.5) opacity 0.7, r 2 at (148, 64) opacity 0.5.
- VOTE TRICKLE from the follower: two neutral dots drifting toward the zone: r 3 fill `#b6ac95` at (90, 82), r 2.2 opacity 0.7 at (99, 87).
- Halo ellipse over the zone: cx ~125 cy ~82.

## CANDIDATE B — "Copper trace" (the log as a bold printed-circuit bus)

The system as hardware: the replicated log is a heavy copper trace running the plate; committed entries are drilled via donuts; the leader is the crowned pad where the solid trace ends and the unrouted dashed tail begins (the write head); followers are smaller pads elbow-routed onto the bus; replication pulses travel from the leader back along the trace; the laggard's branch is dashed — not yet routed.

Geometry anchors (refine within ±4px):

- MAIN TRACE (the committed log): line `M 24 96 H 190`, stroke `#465059` width 6, round caps — heavy. UNROUTED TAIL (the future): `M 198 96 H 236`, stroke `#7d7669` width 3, dasharray "7 6" (it emerges from behind the leader pad).
- VIAS (committed entries, drilled through the trace): five donuts at x 44/76/108/140/172, y 96 — circles r 4.5 fill `#0b1317` stroke `#b6ac95` width 2.
- LEADER = the write-head pad, centred on the trace at (196, 96): mask disc r 13 fill `#0b1317` (cuts the trace cleanly); coral halftone disc r 9.5 `url(#gem-raft-b-dense)` opacity 0.8; crown ring r 13 stroke `#7d2723` width 3.5; two coral antenna ticks up ((190,80)→(187,73) and (202,80)→(205,73), width 1.5); white glint 2×2 at (192, 90).
- FOLLOWER pad: (64, 44) — ring circle r 9 stroke `#465059` width 3, fill `#0b1317`, core dot r 3.5 fill `#7d7669`. BRANCH TRACE with a 45° PCB elbow onto the bus: `M 64 53 V 76 L 92 96`, stroke `#465059` width 4, round join and cap.
- LAGGARD pad: (48, 128) — dashed ring r 9 stroke `#7d7669` width 2.5 dasharray "4 3", fill `#0b1317`, core dot r 3. DASHED BRANCH (not yet routed): `M 48 119 V 112 L 64 96`, stroke `#7d7669` width 3, dasharray "5 4".
- PULSES (replication, moving left from the leader): coral dot r 4 fill `#ff6a5f` at (160, 96); echo dot r 2.5 opacity 0.7 at (144, 96). Two neutral chevrons above the trace pointing left: at (128, 88) and (96, 88), rotated ~180°, stroke `#7d7669` width 1.5.
- ACK RETURN: dashed `M 188 110 Q 120 124 62 112`, stroke `#7d7669` width 1.5, dasharray "2 4", opacity 0.5, one chevron pointing right at (124, 121) rotated ~−8°.
- PLATE TEXTURE: two micro-vias drilled in the bare plate: circles r 2.5, fill none, stroke `#465059` width 1.5, at (140, 72) and (104, 122).
- Halo ellipse over the bus: cx ~130 cy ~90.

## Self-check (both candidates)

- Held against the last three rounds at a squint: NOTHING in common — no small stepped-cap discs, no hairline rims, no tick rows. A = three giant halftone discs whose coral triple-overlap IS the consensus; B = a heavy circuit trace with vias and a crowned write-head pad. Both still read "distributed systems" in one second and still feel like the same ink family (plate, palette, halftone, one spot colour).
- Bold: big masses / heavy strokes (2.5–6px), fills the plate, one dominant focal element.
- Coral ≤3 groups; exactly one `gem-halo`; no text/gradients/filters; nothing outside the safe area except backdrop+halo; check every anchor against its neighbours for collisions.

## Output format

1. One ```tsx block: `function RaftCandidateA() { ... }` (Quorum overprint).
2. One ```tsx block: `function RaftCandidateB() { ... }` (Copper trace).
3. ≤3 sentences per candidate: what makes its graphic language genuinely new vs. rounds 1–3 + coral coverage estimate + any anchor deviation.
