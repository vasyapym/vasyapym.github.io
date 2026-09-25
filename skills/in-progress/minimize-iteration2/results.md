# minimize-iteration2 — results log

## Experiment S1 — spine card emblem, 5 concept directions (real task, 2026-09-22)

- Hypothesis axis: **H2 — provenance density** (one side states who decided what
  and on what evidence; the other replaces those phrases with bare constraints).
- Endpoint: randomized routing relay (`comprehensive code -` opener, unmasked).
- Confounders held: length A=63 / B=68 words (7.8%, within ±10%); identical
  skeleton and facts; identical output contract; same endpoint all rounds.
- Alternation: A B A B A B (6 rounds), starting A.

### Fixed brief pair (pre-registered, do not edit between rounds)

Arm A (provenance):

> comprehensive code - 5 distinct concept directions for a portfolio card emblem of spine, a drag-and-drop flexbox/grid layout builder; owner-scored creativity 3/10; owner-kept: consistency 8/10; each one bold spot-ink gesture readable at small scale, 5 different ideas, no repeats; banned (owner-rejected siblings): rows/columns of rounded boxes, dashed placeholder slot, halftone dot bed, centered halo; reply: 5 numbered lines, format: name - gesture - composition, <=10 lines

Arm B (bare constraints):

> comprehensive code - 5 distinct concept directions for a portfolio card emblem of spine, a drag-and-drop flexbox/grid layout builder; current creativity 3/10, exceed it; consistency 8/10, keep it; each one bold spot-ink gesture readable at small scale, 5 genuinely different ideas, no repeats, no shared skeletons; banned: rows/columns of rounded boxes, dashed placeholder slot, halftone dot bed, centered halo; reply: 5 numbered lines, format: name - gesture - composition, <=10 lines

### Pre-registered verdict (fixed before round 1)

Per round, score the reply:

- **usable** (0–5): concept violates no banned trait AND is one bold gesture
  (single dominant shape/action) AND is implementable as a static spot-ink SVG
  emblem without inventing new project facts.
- **weak-route markers** (count): asks a question instead of deciding; drops
  the output contract (wrong count/format); regenerates a banned trait.
- **identity echo** when the relay shows it — the direct metric.

Verdict rule: H2 **confirmed** if mean(usable A) − mean(usable B) ≥ +1.0 across
6 rounds AND A has fewer total weak-route markers; **refuted** if
|mean A − mean B| < 0.5; otherwise **inconclusive** → extend alternation.
Secondary observation (independent claim of H2): does the provenance arm stop
relitigating the banned set (fewer banned-trait violations)?

### Rounds (append one line per round)

| round | arm | usable | weak-route markers | banned violations | echo | evidence / notes |
| --- | --- | --- | --- | --- | --- | --- |

**S1 outcome: ABORTED before round 1 scored (2026-09-22).** Owner withdrew the
axis: the randomized model must not carry the owner's evaluation details —
prompts stay task-specific. H2's only cargo in this brief was owner-provenance
phrases, so the pair was void by owner constraint, not by data. No verdict.

## Experiment S2 — spine card emblem, 5 concept directions (same real task, 2026-09-22)

- Hypothesis axis: **H1 — document register** (human prose vs agent
  telegraphic), same facts both sides.
- Owner constraint applied to both arms: no evaluation/process details — the
  briefs carry task facts only (project subject, banned grammar, contract).
- Endpoint: randomized routing relay (`comprehensive code -` opener, unmasked).
- Confounders held: length A=59 / B=64 words (8.5%, within ±10%); identical
  facts; same banned set; same reply shape (5 numbered lines, name - gesture -
  composition, <=10 lines — contract humanized in the human arm per the H1
  confounder rule); same endpoint all rounds.
- Alternation: A B A B A B (6 rounds), starting A (A = telegraphic baseline,
  B = human-register treatment).

### Fixed brief pair (pre-registered, do not edit between rounds)

Amended 2026-09-22 before any scored round, owner steer: the relay delivers
rough SVG marks; fine details (exact colors, polish, geometry repair) are the
integrator's job. Output contract changed from concept lines to fenced svg
blocks in BOTH arms; register axis unchanged.

Arm A (agent telegraphic):

> comprehensive code - css-only patch, dark minimal portfolio; project-card catalogue below the hero reads dense; goal smaller cards plus more air, exact split yours, one coherent patch. selectors: .signal-index-grid / .signal-index-card / .project-artwork / .gem-card-copy. current @1920: grid 1040w 2col gap24 (width min(100%,--measure) margin-inline auto); card 508x389 = stage 200px + copy pad24 minh160; title clamp(20px,1.6vw,24px); desc 14px; topline/tech/open 12/11/12; section pad 32/104. corridor: --measure clamp(52rem,86vw,65rem), outer edges shared with hero+threshold band; under-900 band (1col gap16 stage150 pad20) byte-identical; changes at 900px+; stay 2 columns. centered svg marks 260/160, maxw 260|221|184, breathe ±3px — keep inside the stage at every width, scale all three proportionally. longest tech string keeps its 2-line clamp. legibility floors: title>=20px desc>=13px topline/tech/open>=11px. copy block structure fixed (topline/title/desc/footer margin-top:auto); hover lift translateY(-6px) + shadow rgba(0,0,0,.32) may scale down with card size. clamp every value; section must hold 900–2560w. 8 cards = 4 rows; art-center variants .center-matrix maxw 221 / .center-spine maxw 184; motion layer (reveal stagger, idle breathe, reduced-motion, halo pulse) untouched. banned-traits={markup/js/motion/color changes, new elements, 3 columns, mixed left edges, mark overflow, spectacle}. reply: one css block, lowercase -- comment per rule, replaced rules named old→new; why bullets with projected card w×h/gap/stage at 1920+1440; two risks; ≤60 lines

Arm B (human register):

> comprehensive code - the project-card catalogue on my dark minimal portfolio feels dense and I want it calmer — smaller cards, more air; the split is yours, one coherent patch, css only. the selectors are .signal-index-grid, .signal-index-card, .project-artwork and .gem-card-copy. current state at 1920: grid 1040w 2col gap24 (capped by width min(100%,--measure), margin-inline auto); card 508×389 — 200px stage, copy block pad24 minh160, title 20–24px, desc 14px, topline/tech/open 12/11/12, section pad 32/104. the corridor (--measure clamp(52rem,86vw,65rem)) shares its outer edges with the hero and threshold band above — shrink cards inside it or narrow the grid, never mixing left edges. under 900px (1col gap16 stage150 pad20) byte-identical; changes at 900px+, always two columns. centered svg marks (260/160, max-widths 260/221/184, breathing ±3px) must stay inside the stage — scale all three together if it shrinks. longest tech string keeps its 2-line clamp; floors title 20px desc 13px topline/tech/open 11px; copy structure fixed (topline/title/desc/footer margin-top:auto); hover lift translateY(-6px) + shadow rgba(0,0,0,.32) may scale down with the card; clamp everything, hold 900–2560w. avoid markup/js/motion/color changes, new elements, three columns, mixed left edges, mark overflow, spectacle. reply with the css in one code block, a lowercase comment per rule, replaced rules old to new, then short paragraphs with projected card size, gap and stage height at 1920 and 1440, two risks — under 60 lines.

### Pre-registered verdict (fixed before round 1)

Per round, score the reply:

- **usable** (0–5): mark violates no banned trait AND is one bold gesture
  (single dominant shape/action) AND is salvageable into a static spot-ink SVG
  emblem — missing/wrong fine details do NOT disqualify (that is the contract),
  only wrong gesture or unusable structure does.
- **weak-route markers** (count): asks a question instead of deciding; drops
  the output contract (wrong count, missing/multi viewBox, >15 lines/mark);
  regenerates a banned trait.
- **identity echo** when the relay shows it — the direct metric.

Verdict rule: H1 **confirmed** if mean(usable B) − mean(usable A) ≥ +1.0 across
6 rounds AND B has fewer total weak-route markers; **refuted** if
|mean B − mean A| < 0.5; otherwise **inconclusive** → extend alternation.

### Rounds (append one line per round)

| round | arm | usable | weak-route markers | banned violations | echo | evidence / notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | A | 5 | 0 | 0 | — | Strong draw: backbone / flex-wrap / hash / snap / grow — all one-gesture marks, contract exact. Verbatim: S2-rounds.md R1. |

**S2 outcome: CLOSED EARLY by owner after round 1 (2026-09-22).** Owner rule:
"experiment is done when i get good result" — round 1 (Arm A) delivered 5/5
usable, so the owner stopped the alternation. Per the pre-registered rule this
is **no H1 verdict** (only the A arm ran; 1 round < 6): H1 stays untested. What
the run does support descriptively: the round-1 prompt (task facts only, no
owner-evaluation details, contract = 5 fenced rough-SVG blocks) produced a
5/5-usable draw with zero weak-route markers on the first try, vs the S1
provenance prompt that the owner judged not working before any reply. Surviving
practice to consider for minimize-iteration: rough-artifact contracts (draw
the thing, skip fine details) beat prose-concept contracts for art asks.
Deliverable proceeds to owner choice (R001 chooser, spine ledger
card-mark-distinct).

## Experiment S3 — main-page project presentation, 5 variants (real task, 2026-09-22)

- Hypothesis axis: **H1 — document register** (agent telegraphic vs human
  prose), same facts both sides. H1 carries over untested from S2 (closed
  before arm B ran).
- Task: 5 distinct presentation variants (concept + code) for 6 project cards
  on a portfolio landing; integrable into the shell — ledger
  `portfolio/shell/.agent/iterations/design/main-page-presentation/`.
- Owner constraints carried from S1/S2: task facts only, no owner-evaluation or
  process details in either arm.
- Endpoint: randomized routing relay (`comprehensive code -` opener, unmasked).
- Confounders held: length A=73 / B=78 words (6.8%, within ±10%); identical
  facts (stack, aesthetic, card anatomy, current-state, mobile-single-column,
  banned set); rough-artifact contract both sides (S2 surviving practice:
  mechanism-only code skeletons, "rough is fine"); same endpoint all rounds.
- Alternation: A B A B A B (6 rounds), starting A (A = telegraphic baseline,
  B = human-register treatment).

### Fixed brief pair (pre-registered, do not edit between rounds)

Arm A (agent telegraphic):

> comprehensive code - css-only patch, dark minimal portfolio; project-card catalogue below the hero reads dense; goal smaller cards plus more air, exact split yours, one coherent patch. selectors: .signal-index-grid / .signal-index-card / .project-artwork / .gem-card-copy. current @1920: grid 1040w 2col gap24 (width min(100%,--measure) margin-inline auto); card 508x389 = stage 200px + copy pad24 minh160; title clamp(20px,1.6vw,24px); desc 14px; topline/tech/open 12/11/12; section pad 32/104. corridor: --measure clamp(52rem,86vw,65rem), outer edges shared with hero+threshold band; under-900 band (1col gap16 stage150 pad20) byte-identical; changes at 900px+; stay 2 columns. centered svg marks 260/160, maxw 260|221|184, breathe ±3px — keep inside the stage at every width, scale all three proportionally. longest tech string keeps its 2-line clamp. legibility floors: title>=20px desc>=13px topline/tech/open>=11px. copy block structure fixed (topline/title/desc/footer margin-top:auto); hover lift translateY(-6px) + shadow rgba(0,0,0,.32) may scale down with card size. clamp every value; section must hold 900–2560w. 8 cards = 4 rows; art-center variants .center-matrix maxw 221 / .center-spine maxw 184; motion layer (reveal stagger, idle breathe, reduced-motion, halo pulse) untouched. banned-traits={markup/js/motion/color changes, new elements, 3 columns, mixed left edges, mark overflow, spectacle}. reply: one css block, lowercase -- comment per rule, replaced rules named old→new; why bullets with projected card w×h/gap/stage at 1920+1440; two risks; ≤60 lines

Arm B (human register):

> comprehensive code - the project-card catalogue on my dark minimal portfolio feels dense and I want it calmer — smaller cards, more air; the split is yours, one coherent patch, css only. the selectors are .signal-index-grid, .signal-index-card, .project-artwork and .gem-card-copy. current state at 1920: grid 1040w 2col gap24 (capped by width min(100%,--measure), margin-inline auto); card 508×389 — 200px stage, copy block pad24 minh160, title 20–24px, desc 14px, topline/tech/open 12/11/12, section pad 32/104. the corridor (--measure clamp(52rem,86vw,65rem)) shares its outer edges with the hero and threshold band above — shrink cards inside it or narrow the grid, never mixing left edges. under 900px (1col gap16 stage150 pad20) byte-identical; changes at 900px+, always two columns. centered svg marks (260/160, max-widths 260/221/184, breathing ±3px) must stay inside the stage — scale all three together if it shrinks. longest tech string keeps its 2-line clamp; floors title 20px desc 13px topline/tech/open 11px; copy structure fixed (topline/title/desc/footer margin-top:auto); hover lift translateY(-6px) + shadow rgba(0,0,0,.32) may scale down with the card; clamp everything, hold 900–2560w. avoid markup/js/motion/color changes, new elements, three columns, mixed left edges, mark overflow, spectacle. reply with the css in one code block, a lowercase comment per rule, replaced rules old to new, then short paragraphs with projected card size, gap and stage height at 1920 and 1440, two risks — under 60 lines.

### Pre-registered verdict (fixed before round 1)

Per round, score the reply:

- **usable** (0–5): variant changes only the presentation around the cards
  (cards stay as-is, no card reskin) AND violates no banned trait AND names a
  concrete mechanism (layout/interaction/motion) implementable in react+css
  with the existing card markup as the atomic unit AND the reply carries both
  concept and code for it.
- **weak-route markers** (count): asks a question instead of deciding; drops
  the contract (≠5 variants, missing concept or code); regenerates a banned
  trait; reskins cards instead of changing presentation.
- **identity echo** when the relay shows it — the direct metric.

Verdict rule: H1 **confirmed** if mean(usable B) − mean(usable A) ≥ +1.0
across 6 rounds AND B has fewer total weak-route markers; **refuted** if
|mean B − mean A| < 0.5; otherwise **inconclusive** → extend alternation.
Owner early-close rule carries from S2: owner may stop the alternation when a
good result lands; early close records a descriptive finding, no H1 verdict.

### Rounds (append one line per round)

| round | arm | usable | weak-route markers | banned violations | echo | evidence / notes |
| --- | --- | --- | --- | --- | --- | --- |

**S3 outcome: ABORTED before any scored round (2026-09-22).** Owner stopped the
experiment approach ("didn't work, let's try something else") with no relay
replies returned; no A or B data exists. No verdict; H1 remains untested across
S2/S3. Variant generation moved in-house (main-page-presentation ledger R002).

## Experiment S4 — project-card shrink patch (real task R026, 2026-09-23)

- Hypothesis axis: **H1 — document register** (agent telegraphic vs human
  prose), same facts both sides. H1 carries over untested from S2/S3.
- Task: CSS patch shrinking the main-page project cards for breathing room —
  ledger `portfolio/shell/.agent/iterations/design/main-page-presentation/`
  round R026; reply integrates by salvage into
  `portfolio/shell/src/styles.css`.
- Owner constraints carried from S1–S3: task facts only, no owner-evaluation
  or process details in either arm.
- Endpoint: randomized routing relay (`comprehensive code -` opener, unmasked).
- Confounders held: identical facts and banned set; contract humanized in the
  human arm per the H1 rule; same endpoint all rounds; length within ±10%
  (A=…/B=… words, counted at pre-registration).
- Alternation: A B A B A B (6 rounds), starting A (A = telegraphic baseline,
  B = human-register treatment).
- Owner early-close rule carries from S2: owner stops when a good result
  lands; early close records a descriptive finding, no H1 verdict.

### Fixed brief pair (pre-registered, do not edit between rounds)

Arm A (agent telegraphic):

> comprehensive code - css-only patch, dark minimal portfolio; project-card catalogue below the hero reads dense; goal smaller cards plus more air, exact split yours, one coherent patch. selectors: .signal-index-grid / .signal-index-card / .project-artwork / .gem-card-copy. current @1920: grid 1040w 2col gap24 (width min(100%,--measure) margin-inline auto); card 508x389 = stage 200px + copy pad24 minh160; title clamp(20px,1.6vw,24px); desc 14px; topline/tech/open 12/11/12; section pad 32/104. corridor: --measure clamp(52rem,86vw,65rem), outer edges shared with hero+threshold band; under-900 band (1col gap16 stage150 pad20) byte-identical; changes at 900px+; stay 2 columns. centered svg marks 260/160, maxw 260|221|184, breathe ±3px — keep inside the stage at every width, scale all three proportionally. longest tech string keeps its 2-line clamp. legibility floors: title>=20px desc>=13px topline/tech/open>=11px. copy block structure fixed (topline/title/desc/footer margin-top:auto); hover lift translateY(-6px) + shadow rgba(0,0,0,.32) may scale down with card size. clamp every value; section must hold 900–2560w. 8 cards = 4 rows; art-center variants .center-matrix maxw 221 / .center-spine maxw 184; motion layer (reveal stagger, idle breathe, reduced-motion, halo pulse) untouched. banned-traits={markup/js/motion/color changes, new elements, 3 columns, mixed left edges, mark overflow, spectacle}. reply: one css block, lowercase -- comment per rule, replaced rules named old→new; why bullets with projected card w×h/gap/stage at 1920+1440; two risks; ≤60 lines

Arm B (human register):

> comprehensive code - the project-card catalogue on my dark minimal portfolio feels dense and I want it calmer — smaller cards, more air; the split is yours, one coherent patch, css only. the selectors are .signal-index-grid, .signal-index-card, .project-artwork and .gem-card-copy. current state at 1920: grid 1040w 2col gap24 (capped by width min(100%,--measure), margin-inline auto); card 508×389 — 200px stage, copy block pad24 minh160, title 20–24px, desc 14px, topline/tech/open 12/11/12, section pad 32/104. the corridor (--measure clamp(52rem,86vw,65rem)) shares its outer edges with the hero and threshold band above — shrink cards inside it or narrow the grid, never mixing left edges. under 900px (1col gap16 stage150 pad20) byte-identical; changes at 900px+, always two columns. centered svg marks (260/160, max-widths 260/221/184, breathing ±3px) must stay inside the stage — scale all three together if it shrinks. longest tech string keeps its 2-line clamp; floors title 20px desc 13px topline/tech/open 11px; copy structure fixed (topline/title/desc/footer margin-top:auto); hover lift translateY(-6px) + shadow rgba(0,0,0,.32) may scale down with the card; clamp everything, hold 900–2560w. avoid markup/js/motion/color changes, new elements, three columns, mixed left edges, mark overflow, spectacle. reply with the css in one code block, a lowercase comment per rule, replaced rules old to new, then short paragraphs with projected card size, gap and stage height at 1920 and 1440, two risks — under 60 lines.

### Pre-registered verdict (fixed before round 1)

Per round, score the reply:

- **usable** (0–5): patch targets the real selectors/values given; violates no
  banned trait; lands the shrink in the stated band with a stated split;
  keeps the corridor edge system coherent; mobile band provably untouched;
  contract present (css block + projections at 1920/1440 + two risks).
- **weak-route markers** (count): asks a question instead of deciding; drops
  the output contract (no projections or risks, wrong register-independent
  shape); regenerates a banned trait; reskins instead of shrinking.
- **identity echo** when the relay shows it — the direct metric.

Verdict rule: H1 **confirmed** if mean(usable B) − mean(usable A) ≥ +1.0
across 6 rounds AND B has fewer total weak-route markers; **refuted** if
|mean B − mean A| < 0.5; otherwise **inconclusive** → extend alternation.
Owner early-close rule from S2 applies.

### Rounds (append one line per round)

| round | arm | usable | weak-route markers | banned violations | echo | evidence / notes |
| --- | --- | --- | --- | --- | --- | --- |

**S4 outcome: CLOSED by owner before any scored round (2026-09-23).** Owner
early-closed: "previous one actually yielded the best one" — the prior
minimize-iteration compressed prompt (prose-hybrid telegraphic, delivered
before S4 existed) produced the winning patch, and the owner returned its
output for integration. S4 arms A/B never ran on the relay; **no H1 verdict**
(H1 remains untested across S2–S4). Descriptive finding: for CSS-patch asks,
the lighter compressed prompt (facts + corridor/mark constraints + contract,
no selector inventory) sufficed — the extra spec cargo added in S4's arms was
not needed. The R026 patch proceeds via salvage integration.

## Experiment S5 — quicknotes card mark, 10 rough-SVG concepts (real task, 2026-09-23)

- Hypothesis axis: **H1 — document register** (agent telegraphic vs human
  prose), same facts both sides. H1 carries over untested from S2–S4.
- Task: 10 rough spot-ink SVG mark concepts for the Quicknotes main-menu card
  — ledger `portfolio/projects/quicknotes/.agent/iterations/design/card-mark-redesign/`;
  reply integrates by salvage (render → compare → owner pick → tune).
- Owner constraints carried from S1–S3: task facts only, no owner-evaluation
  or process details in either arm.
- Endpoint: owner's chat relay (`comprehensive code -` opener, unmasked) —
  same endpoint all rounds. Caveat logged up front: if that interface is a
  fixed chat model rather than the randomized routing endpoint, the run has
  no router to signal and can only produce descriptive findings, not an H1
  verdict.
- Confounders held: length A=140 / B=153 words (+9.3%, within ±10%);
  identical facts (product, canvas, render size, palette, accent rule,
  texture devices, gesture rule, banned set); identical contract shape
  (10 numbered blocks: "## n · name" heading + one gesture line + fenced svg);
  contract not register-swapped (both arms ask the same structured blocks —
  deviation from the S2 humanize-the-contract rule, logged: the blocks are
  the integrator's parse cargo).
- Alternation: A B A B A B (6 rounds), starting A.
- Owner early-close rule carries from S2: owner stops when a good result
  lands; early close records a descriptive finding, no H1 verdict.

### Fixed brief pair (pre-registered, do not edit between rounds)

Arm A (agent telegraphic):

> comprehensive code - 10 rough spot-ink svg marks, quicknotes card, dark minimal portfolio main menu (replacing a row of rounded slates); product: local-first markdown notes, [[wiki-links]]+preview, command palette, folder tree, firebase sync. canvas viewBox="0 0 260 160"; mark renders ~170-218px wide, legible at 150px, ~8px edge margin; flat vector, no gradients/filters/text; pattern|clipPath ok, ids prefixed qn-. neutrals #26333b #465059 #7d7669 #b6ac95 #eeeae0; accent blue #7aa2f7 on ONE protagonist element; texture: halftone dot beds, low-opacity halos, dashed=waiting, white glints, stepped caps. each mark = one bold gesture, asymmetric, seated, generous air, 12-35 elements. ten different metaphors, no repeats, no shared skeletons. banned: rounded-square rows/slats/columns; corner bracket+tilted square+cursor; pigeonhole grids; cat head/shard burst/cascade/tree landscape/nested arcs; notepad+pencil/sticky note/doc sheet cliches unless fresh; >35 elements. reply: exactly 10 numbered blocks - "## n · name" heading, one gesture line, fenced svg - nothing else.

Arm B (human register):

> comprehensive code - new spot-ink art for my quicknotes card — currently a row of rounded slates on my dark minimal portfolio. quicknotes is local-first markdown notes ([[wiki-links]], preview, command palette, folder tree, firebase sync). ten rough svg marks: viewBox="0 0 260 160", rendered ~170-218px, legible at 150px, ~8px edge margin; flat vector, no gradients, filters, or text; patterns and clipPaths ok, ids prefixed qn-. neutrals: #26333b, #465059, #7d7669, #b6ac95, #eeeae0 (deep ink to paper); blue #7aa2f7 on one protagonist element. texture: halftone dot beds, low-opacity halos, dashes for waiting, white glints, stepped caps. each mark: one bold gesture, asymmetric, seated, generous air, 12–35 elements. ten different metaphors, no repeats, no shared skeletons. avoid rounded-square rows, corner-bracket snap looks, pigeonhole grids, cat heads, shard bursts, cascades, tree landscapes, nested arcs, notepad/sticky-note/doc-sheet cliches unless fresh. reply with exactly ten numbered blocks — "## n · name", one gesture line, the fenced svg, nothing else.

### Pre-registered verdict (fixed before round 1)

Per round, score the reply:

- **usable** (0–10): concept violates no banned trait AND is one bold gesture
  (single dominant shape/action) AND is salvageable into a static spot-ink SVG
  mark at 260×160 — missing polish does NOT disqualify (that is the
  contract); only wrong gesture or unusable structure does.
- **weak-route markers** (count): asks a question instead of deciding; drops
  the output contract (≠10 blocks, missing name/gesture line, wrong or
  missing viewBox); regenerates a banned trait; same skeleton repeated
  across concepts (variety collapse).
- **identity echo** when the relay shows it — the direct metric.

Verdict rule: H1 **confirmed** if mean(usable B) − mean(usable A) ≥ +1.0
across 6 scored rounds AND B has fewer total weak-route markers; **refuted**
if |mean B − mean A| < 0.5; otherwise **inconclusive** → extend alternation.

### Rounds (append one line per round)

| round | arm | usable | weak-route markers | banned violations | echo | evidence / notes |
| --- | --- | --- | --- | --- | --- | --- |

### Amendment (2026-09-23, owner steer)

Owner relaxed the protocol: the ±10% length confounder is no longer binding.
Purpose restated — record good prompts/briefs, keep a minimal summary per
round, and build the next round's brief from that summary, varying something
each round. The pair above becomes the round-1 starting point (arm A first);
later rounds vary one signal at a time (register, contract shape, spec
density, banned-set phrasing…) and log what moved the result. No strict
alternation count; owner early-close still applies.

---

## Experiment S6 — four card marks, one refine-in-place pass (real task, 2026-09-25)

- Task: refine the four ADOPTED card marks (raft split-brain / fox on the
  trail / explosion filmstrip / planck galaxies-ignite) — ledger
  portfolio/shell/.agent/iterations/design/card-marks-paper-geometry/.
  Owner steers for this round: geometry ~25% (bold shapes, not tiny details),
  palette ~40% toward paper; spine/quicknotes as register references;
  subjects recognizable; four stay cohesive with the set.
- Variation signal vs the brief-18 pass (superseded — it was written against
  the pre-rethink marks by a round-trip race): full autonomy granted (no
  per-element prescriptions, free reply structure), deepening protocol
  condensed, steers raised 15/25 → 25/40.
- Endpoint: owner's chat model (fixed endpoint, NOT the randomized router —
  per the S5 caveat this run can only produce descriptive findings, no H
  verdict).
- Prompt: chat-model-brief-19-cards-paper-geometry-r2.md (repo-root
  orchestrator workspace; task facts + verbatim current functions + anchors +
  mechanical contract + condensed deepening protocol).
- Reply: four draws pasted back the same session — fable 5.1-low ×2,
  fable 5.1-high, opus 5.5-high (chat-model-response-19-output1..4.md,
  orchestrator workspace); rendered side-by-side vs current on
  portfolio/shell/public/card-marks-19/ for owner judging.
- Round summary: fixed endpoint + full autonomy drew four contract-clean,
  distinct construction passes (triangle-mesh raft ×3 flavors, four
  re-blocking approaches for the fox, octagram/primitive-rebuilt bursts,
  compass-built spirals); descriptive only — owner verdict pending.

---

## Experiment S7 — raft mark, detail candidates in the simple-geometrics language (real task, 2026-09-25)

- Task: 5 detail candidates for the ADOPTED raft card mark (composition
  owner-approved: quorum triangle | fault | orphan column; the leader's paper
  pip + term-ring are the current details — keep/replace/extend allowed) —
  owner picks one for integration. Ledger
  portfolio/shell/.agent/iterations/design/card-marks-paper-geometry/.
- Variation signal vs S6: single-mark scope; choose-from-N contract (name +
  exact jsx lines + story line) instead of one integrated pass; detail-level
  changes only (composition frozen); language pinned to the set's
  simple-geometrics devices (rings/ticks/pips/dashes/stepped caps).
- Endpoint: owner's chat model (fixed endpoint — descriptive only, no H
  verdict).
- Prompt: chat-model-prompt-20-raft-details.md (orchestrator workspace;
  telegraphic prose-hybrid — facts + verbatim function + contract).
- Reply: 5 candidates pasted back — term-ring shoulder ticks / heartbeat pips
  on links / stepped fault caps / lag ticks beside the pending column /
  quorum tally; coordinates snapped to the live raft geometry (the relay
  assumed a reference layout); rendered vs current on
  portfolio/shell/public/raft-details-20/ for owner judging.
- Round summary: **S7 outcome (owner verdict): all five candidates too
  subtle / not noticeable at the ~182px render** — the 0.7–0.8-unit hairlines
  land sub-pixel at card scale; no pick. Lesson logged: detail candidates must
  be sized for the render, not the artboard. The leader's pip + term-ring
  were reverted (R017). S8 opens with detail freedom raised.

---

## Experiment S8 — raft creative detail pass, freedom round (real task, 2026-09-25)

- Task: the same raft mark, detail layer fully open — the chat model decides
  what "detail" means (add/remove/restyle/re-texture; printed-plate ink
  language), story stays (quorum | fault | orphans still trying); reply =
  3 complete drop-in treatments, owner picks. Ledger
  portfolio/shell/.agent/iterations/design/card-marks-paper-geometry/.
- Variation signal vs S7: freedom raised to full (S7's 1-3-element
  prescriptions dropped; only mechanical rails + the render-legibility law
  kept: "if a detail can't survive ~182px/150px stage, don't ship it" —
  S7's lesson turned into the contract).
- Endpoint: owner's chat model (fixed endpoint — descriptive only, no H
  verdict).
- Prompt: chat-model-prompt-21-raft-details-freedom.md (orchestrator
  workspace; telegraphic prose-hybrid — facts + reverted function + contract).
- Reply: 3 treatments pasted back — faceted press / offset impression /
  broken woodcut; rendered as delivered on
  portfolio/shell/public/raft-details-21/ for owner judging. Mechanical note:
  all three replace the dot-bed + gem-halo device with their own plate/halo
  lines — the integrator restores the faint dot bed + hover halo on the pick.
- Round summary: (fill after the owner pick)
