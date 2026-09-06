# BRIEF — Raft Cluster mark, cybernetic reconcept: TWO complete candidates (self-regulating system)

Round context: the Raft mark's leader/follower concept is right and stays. The current adopted mark ("append-only columns": three vertical stacks of solid squares over node plinths) was picked from a previous two-candidate round, but after living with it the owner rejects the look: **it reads as a "clay model"** — solid, sculptural, monolithic. The requested direction, quoted: "something that better evokes a **networked, self-regulating system** — nodes, feedback/control loops, leader–follower relationships, and message flow between nodes", drawing a conceptual link to **cybernetics** (feedback loops, control, self-regulating systems). An even earlier attempt (nodes linked by thick soft lines with floating log squares) failed on execution: thick blurry links, scattered rotations, no cluster boundary — do not regress to that. You have NO repo access; output is integrated verbatim into `portfolio/shell/src/shell/ProjectArtwork.tsx` as `RaftCenterMark`. The owner picks candidate A or B from rendered evidence.

---

## TASK

Design TWO complete, distinct SVG candidates for one card mark. Senior developer's portfolio landing page: dark editorial "ink catalogue", plate `#0b1317`, neutral ink, halftone screens, film grain. Card mark: `260 × 160` SVG rendered ~213–260px wide; one of a six-mark family language called **Spot-Colour Overprint** (neutrals dominate; ONE identity hue per card ≤~15% coverage). This card's hue is CORAL. Subject: "Raft Cluster — live Raft consensus in the browser — crash the leader and watch elections answer" (Rust, WebAssembly, TypeScript). The bar: this mark alone says its author understands distributed systems AND feedback/control systems.

**The story both candidates must tell (Raft as a cybernetic loop):**
The cluster is a self-regulating system. The leader broadcasts the next log entry (the control signal, CORAL — the frame's protagonist); followers receive and acknowledge it (message flow along channels); once acknowledged up to a frontier, entries become COMMITTED shared state (identical everywhere — the system's settled memory); if the leader crashes, elections answer and the loop re-stabilises (feedback). Freeze ONE frame: a signal in flight around a living loop — not a still life of stacked blocks.

**Hard conceptual requirements (both candidates):**
1. Exactly THREE nodes (three is the minimal Raft quorum) — one leader, two followers.
2. Leader identifiable WITHOUT text: deep-coral ring + coral halftone overprint cap on its disc.
3. ONE entry/message in flight in CORAL — the protagonist.
4. Message flow must be VISIBLE as direction: channel strokes with direction ticks/chevrons, or signal arcs moving along a loop. At least one NEUTRAL return/acknowledgement path (feedback closing the loop).
5. Committed shared state appears ONLY as small aligned ticks/bars (3 tiny elements, identical colour sequence at every node or at the loop's centre) — NOT as big stacks (that is the rejected clay read).
6. One node shows a small deficiency the system will correct: a dashed empty slot / a missed-signal gap.
7. NO text, NO numbers anywhere. No filters, no gradients. Pure primitives.

## Shared technique rules (both candidates)

- Patterns in `<defs>`, all `patternUnits="userSpaceOnUse"`: `gem-raft-dense` (7×7, dot r 1.9, `#ff6a5f`), `gem-raft-sparse` (11×11, dot r 1.6, `#7d7669`), `gem-raft-halo` (7×7, dot r 1.9, `#ff6a5f`).
- Halo contract: exactly one ellipse `className="gem-halo"` `style={haloVar(0.12)}` ~rx 60 ry 42, coral dots, opacity 0.12 (CSS pulse binds to the class). `haloVar` exists in module scope.
- Wide sparse backdrop ellipse (`url(#gem-raft-sparse)`, opacity 0.09, ~rx 104 ry 64, cx 130 cy ~84).
- Volume via `<clipPath>` stepped caps only; `aria-hidden="true"`; ids prefixed `gem-raft-`.
- Palette (exhaustive): NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4` (+ white glints ≤2); CORAL `#ff6a5f`, deep `#7d2723`. No other hues.
- **Mobile safe area (hard rule):** on phones the card stage clips the SVG's outer ~5px top/bottom and the mark breathes ±3px vertically. ALL hard content must stay within x 16→244, y 16→144. The sparse backdrop and halo ellipse may exceed it; nothing else.
- Channels/links: stroke `#465059` width ≤3 opacity ≥0.5, round caps — crisp, never blurry. Any rotation ≤20° and only on in-flight capsules. ~15–25 elements; legible at 213px.

## CANDIDATE A — "Broadcast mesh" (leader left, followers right, acks return)

Horizontal composition: the leader broadcasts rightward, acknowledgements return along thin dashed hairlines — feed-forward and feedback side by side.

Geometry anchors (refine within ±6px):

- LEADER disc (86, 80) r 14: stepped caps (`#26333b` base, inner `#465059`, innermost `#7d7669`, clipped), deep-coral ring r 19 (stroke `#7d2723` width 3.5, opacity 0.9), coral halftone overprint cap clipped inside the disc, one white glint. Two small coral antenna ticks fanning up-right from the ring (broadcast reach): e.g. at ring edge 45° and 20°, length 5, stroke `#ff6a5f` width 1.5.
- FOLLOWERS: (178, 46) r 10.5 and (184, 114) r 10.5, stepped caps, hairline rim (r+1.5, stroke `#465059` width 1, opacity 0.5). The LOWER follower lags: de-saturated (base + one inner step only) + its mini-log's third tick is a dashed empty slot.
- CHANNELS (feed-forward): two curved strokes leader→followers: `M 100 72 Q 140 50 166 48` and `M 100 88 Q 142 106 172 111`, stroke `#465059` width 2.5, opacity 0.8. On each, TWO direction chevrons (tiny 3×3 open `>` shapes or 4px ticks, `#7d7669`) pointing away from the leader.
- RETURN/ACKS (feedback): one thin dashed arc above the upper channel and one below the lower channel, followers→leader: e.g. `M 172 40 Q 136 36 102 64` and `M 176 120 Q 138 122 100 96`, stroke `#7d7669` width 1, dasharray "2 4", opacity 0.45.
- IN-FLIGHT ENTRY: one coral capsule 14×8 (rx 4, fill `#ff6a5f`) on the upper channel at ~(138, 59), rotated ~-14° to ride the curve tangent; white glint 2×2 on it. Secondary echo: one small coral halftone dot patch (r 5 circle, `url(#gem-raft-dense)`, opacity 0.7) on the lower channel at ~(146, 100) — the same broadcast reaching the other follower.
- COMMITTED STATE: under each node disc a mini-log row of three 5×5 ticks (2px gaps), colour sequence per position IDENTICAL across all three rows: `#465059 / #7d7669 / #b6ac95`. Leader's row sits left of/under its disc; a 1px dashed vertical hairline (stroke `#7d7669`, dasharray "2 4", opacity 0.5, height ~14px) stands between tick 2 and tick 3 of every row — the commit frontier, aligned across rows. Lagging follower's tick 3: dashed outline only (fill none, stroke `#7d7669` width 1, dasharray "2 2").
- One white glint on the leader disc + one on the coral capsule; nothing else white.

## CANDIDATE B — "Control loop" (the cluster as one cybernetic feedback ring)

The three nodes ride a single dashed circular loop; signals circulate around it; the loop's centre holds the committed state the whole system regulates toward.

Geometry anchors (refine within ±6px):

- LOOP: dashed circle cx 130 cy 82 r 50, stroke `#465059` width 1.5, dasharray "3 6", opacity 0.65 — the feedback loop.
- NODES ON THE LOOP: leader top (130, 32) r 12; followers lower-right (174, 106) r 10.5 and lower-left (86, 106) r 10.5. Stepped caps; leader gets deep-coral ring r 16.5 (stroke `#7d2723`, width 3.5, opacity 0.9) + coral halftone overprint cap + one white glint + two antenna ticks pointing up (length 5, stroke `#ff6a5f` width 1.5, at -75° and -105°).
- SIGNALS IN FLIGHT: (1) a solid coral capsule 13×7 (rx 3.5) placed ON the loop at ~2 o'clock (upper-right arc, ~(163, 51)), rotated ~55° to ride the ring; white glint on it. (2) a coral halftone arc segment on the loop at ~8 o'clock (~(92, 108) area): arc stroke `url(#gem-raft-dense)` cannot follow a curve — instead place a coral halftone filled circle r 6 clipped by a ring-band clipPath, or a small `url(#gem-raft-dense)` circle r 6, opacity 0.8 — the next signal queuing behind.
- DIRECTION: three neutral chevrons on the loop at ~11, 5 and 7 o'clock pointing CLOCKWISE (`#7d7669`, tiny 3px strokes, opacity 0.7).
- COMMITTED STATE at loop centre: three aligned horizontal bars 16×3.5 (2.5px vertical gaps), colours `#465059 / #7d7669 / #b6ac95`, centred (130, 82), enclosed by one hairline circle r 13 (stroke `#465059` width 1, opacity 0.5) — the settled memory the loop guards. Tiny white glint 1.5×1.5 on the top bar's edge.
- FEEDBACK ACCENT: on the loop between the LEFT follower and the leader (~10 o'clock), one slightly brighter neutral arc segment (stroke `#b6ac95` width 2, opacity 0.8, ~20° of arc) with a small chevron pointing toward the leader — the election answer travelling back.
- LAGGING NODE: lower-left follower de-saturated (base + one inner step) + a dashed gap in the loop right before it: an arc segment replacing the dashes with stroke `#7d7669` width 1.2, dasharray "2 3", opacity 0.6 (~12° of arc) — the missed signal it must catch.
- One white glint on the leader disc + one on the capsule + the centre one = your three max (2 preferred, centre glint may substitute the capsule's).

## Self-check (both candidates)

- Squint-test at 213px: a LOOP or MESH with direction, a bright coral traveller, one ringed leader — a system in operation, not objects on a shelf.
- NOTHING reads as stacked solid masses (the clay rejection). No thick blurry lines. Nothing random.
- Coral stays ≤3 groups: in-flight signal(s) + leader accents (+ antenna ticks) [+ queuing dot on B]. Everything else neutral.
- All hard content inside x 16→244, y 16→144. Exactly one `gem-halo`. No text, no gradients, no filters.

## Output format

1. One ```tsx block: `function RaftCandidateA() { ... }` (broadcast mesh).
2. One ```tsx block: `function RaftCandidateB() { ... }` (control loop).
3. ≤3 sentences per candidate: the frame's story beat you emphasised + coral coverage estimate + any anchor deviation.
