# BRIEF — Raft Cluster mark, full reconcept: TWO complete candidates (replicated-log story)

Round context: the Raft mark went through a refinement pass (thin links, bezels, orbit) but the owner now wants a full reconcept — "we did the other marks, now rethink this one". Verdict kept: the leader/follower concept is right, but the illustration must WIN — this project ("live Raft consensus in the browser — crash the leader and watch elections answer"; Rust, WebAssembly, TypeScript, Canvas 2D) is a flagship portfolio piece, and the mark must convey the elegance of complex system design. Delegated to the chat model (no repo access). Output integrates into `portfolio/shell/src/shell/ProjectArtwork.tsx` — the owner will pick candidate A or B from rendered evidence.

---

## TASK

Design TWO complete, distinct SVG candidates for one card mark. Senior developer's portfolio landing page: dark editorial "ink catalogue", plate `#0b1317`, neutral ink, halftone screens, film grain. Card mark: `260 × 160` SVG rendered ~213–260px wide; one of a six-mark family language called **Spot-Colour Overprint** (neutrals dominate; ONE identity hue per card ≤~15% coverage). This card's hue is CORAL. Audience: serious technical — the bar is "this mark alone says its author understands distributed systems".

**The story both candidates must tell (this is the Raft mental model, distilled):**
Multiple nodes hold copies of one append-only log. Entries replicate in the same order to every node. Entries up to a shared frontier are COMMITTED (identical everywhere). The newest entry is IN FLIGHT (the leader's broadcast). One node is behind — its log has a gap it must fill. Crash the leader; elections answer. The mark freezes ONE frame of this story: replication in flight.

**Hard conceptual requirements (both candidates):**
1. Three node logs (three is the minimal Raft quorum — say it visually).
2. A committed region: identical entries across all three logs, up to a shared frontier — the MATCHING PREFIX must be visible as alignment/rhythm.
3. ONE entry in flight, in CORAL — the frame's protagonist.
4. ONE lagging node with a visible gap (empty/dashed outline slot) — the crash-and-catch-up hook.
5. The leader is identifiable WITHOUT text (accent: deep-coral ring / coral halftone overprint / broadcast marks).
6. NO text, NO numbers anywhere. No filters, no gradients. Pure primitives.

## Shared technique rules (both candidates)

- Patterns in `<defs>`, all `patternUnits="userSpaceOnUse"`: `gem-raft-dense` (7×7, dot r 1.9, `#ff6a5f`), `gem-raft-sparse` (11×11, dot r 1.6, `#7d7669`), `gem-raft-halo` (7×7, dot r 1.9, `#ff6a5f`).
- Halo contract: exactly one ellipse `className="gem-halo"` `style={haloVar(0.12)}` ~rx 64 ry 42, coral dots, opacity 0.12 (CSS pulse binds to the class). `haloVar` exists in module scope.
- Wide sparse backdrop ellipse (`url(#gem-raft-sparse)`, opacity 0.09, ~rx 104 ry 64).
- Volume via `<clipPath>` stepped caps only; `aria-hidden="true"`; ids prefixed `gem-raft-`.
- Palette (exhaustive): NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4` (+ white glints ≤2); CORAL `#ff6a5f`, deep `#7d2723`. No other hues.
- ~15–25 elements per candidate; legible at 213px; edges crisp (this mark is the family's precision piece).

## CANDIDATE A — "Replicated log filmstrip" (horizontal)

Three horizontal log rows, one per node; time flows left→right.

Geometry anchors (refine within ±6px):

- Three node discs at the row heads: x 52, y 48/84/120, r 11, stepped caps (`#26333b` base, inner `#465059`, innermost `#7d7669`, clipped). TOP row is the leader: deep-coral ring r 15 (stroke `#7d2723` width 3.5, opacity 0.9) + coral halftone overprint cap clipped inside the disc.
- Each row: a trail of entry squares 11×11 (rx 1.5) with 5px gaps, starting x 74, running right: columns at x 74/90/106/122/138/154/170/186 (8 columns max).
- COMMITTED region = columns 1–5: all three rows filled, stepped neutrals varying PER COLUMN (not per row) — e.g. column colour cycle `#465059/#7d7669/#b6ac95/#465059/#7d7669` — so each COLUMN reads as one replicated index aligned across rows. This column-alignment is the sophistication.
- COMMIT FRONTIER: one vertical dashed hairline at x 147 (between column 5 and 6), stroke `#7d7669` width 1, dasharray "2 4", opacity 0.5, spanning y 40→128 — the commit index line.
- IN-FLIGHT entry = column 6 (x 154): leader row square fill `#ff6a5f`; middle row square fill `url(#gem-raft-dense)` (coral halftone, opacity 0.8 — receiving); bottom row slot EMPTY with dashed outline (stroke `#7d7669` width 1.2, dasharray "3 3", fill none — the lagging node's gap).
- Column 7 (x 170): empty dashed outline on the leader row too (next slot); columns 7–8 absent on other rows (nothing to draw).
- Lagging-node accent: bottom row's node disc gets a slightly darker, de-saturated look (base `#26333b`, inner cap only, no innermost step) + a small coral halftone "catch-up patch" clipped to its right edge (rect x 56 y 112 w 12 h 16, opacity 0.5) — it is about to receive the entry.
- One white glint on the leader disc; one on the in-flight coral square (2×2, opacity 0.65).

## CANDIDATE B — "Append-only columns" (vertical)

Same story, sculptural composition: three VERTICAL log columns, logs grow UPWARD; the shared committed base reads as a plinth; the coral entry flies across the tops.

Geometry anchors (refine within ±6px):

- Three columns at x 92/130/168, each a stack of entry squares 13×13 (rx 1.5) with 4px gaps, rising from baseline y 132 upward.
- COMMITTED base: columns share the same 5 committed squares (y 118/101/84/67/50 — bottom to top), stepped neutral cycle per LEVEL (all three columns share the colour at each level — the matching prefix reads as horizontal strata): level colours bottom→top `#465059/#7d7669/#b6ac95/#465059/#7d7669`.
- Node discs sit UNDER the columns: y 141, r 10, stepped caps; middle column is the LEADER (deep-coral ring r 13.5 stroke `#7d2723` width 3.5 + coral halftone overprint cap).
- IN-FLIGHT entry: one coral square 13×13 at the TOP of the leader column (y 33) PLUS a coral halftone square hovering over the right column's next slot (y 33, fill `url(#gem-raft-dense)` opacity 0.8, slightly offset right x+2 — mid-flight); left column's top slot: dashed outline (the lagging node's gap).
- Commit frontier: ONE horizontal dashed hairline across all columns at y 42 (above the last committed level), stroke `#7d7669` width 1, dasharray "2 4", opacity 0.5.
- Append direction accent: tiny upward ticks above each committed stack top (three 2×6 rounded ticks, `#b6ac95`, opacity 0.6) — the log grows upward.
- Lagging-node accent: left column's disc gets the de-saturated treatment + a small coral halftone catch-up patch clipped at its top edge.
- One white glint on the leader disc; one on the in-flight coral square.

## Self-check (both candidates)

- Squint-test: three matching structures + one highlighted traveller + one visible gap = replication in flight.
- The committed region reads as PERFECT alignment (columns/strata share colour by index, not by node).
- Coral stays ≤3 groups: in-flight entries + leader accents + catch-up patch (+halo dots). Everything else neutral.
- Crisp edges, no blur, no clutter; nothing random; exactly one gem-halo.

## Output format

1. One ```tsx block: `function RaftCandidateA() { ... }` (filmstrip).
2. One ```tsx block: `function RaftCandidateB() { ... }` (vertical columns).
3. ≤3 sentences per candidate: the frame's story beat you emphasised + coral coverage estimate + any anchor deviation.
