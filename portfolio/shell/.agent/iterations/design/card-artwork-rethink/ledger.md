# Ledger — card-artwork-rethink (shell main page)

Task: rethink the project-card illustrations for Raft Cluster, Evening Forest,
Explosion, and Planck to Now. Chat model draws 5 variants per project in
detail (SVG marks); concepts must be fresh/original yet simple. Presented on
/art-directions for owner verdicts.

## Round R001
- Goal: establish the visual baseline and the presentation venue. Four in-scope
  cards (05 Raft Cluster, 06 Evening Forest, 07 Explosion, 08 Planck to Now)
  keep their incumbent marks as reference; the chat model's five concepts per
  project will be integrated into a new comparison round on /art-directions.
- Preserved preferences: F002/F005/F011 from main-page-presentation (measure
  corridor, restraint, airier catalogue — untouched this round); house spot-ink
  language (sparse printed bed, hover halo, white glints) as the current family
  technique.
- Changes: none to shipped cards yet — baseline probe only
  (portfolio/probes/card-art-baseline-r001.mjs).
- Before: artifacts/R001/before-art-<project>.png (×4, 1440×900 @2x crops) +
  before-cards-full-1440.png
- After: n/a (baseline round)
- Visual inspection: performed — incumbents read as: Raft = coral shift-register
  cascade (crowned leader flop → committed stages → dashed frontier); Evening
  Forest = layered dusk treeline with teal halftone canopy + paper moon;
  Explosion = radial shatter fan around a dark lantern disc with amber core
  (note: the "glowing gradient paper-lantern moon" era was already superseded
  by this spot-ink mark); Planck = nested right-opening epoch ripple bands with
  violet singularity + "now" frontier arc.
- Code verification: NOT RUN (no code changes).
- Open question: none — proceeding to the concept/draw relay.

## Round R002
- Goal: owner steered mid-round — 3 concepts per project (was 5), brief minimized via /minimize-iteration (one-line relay, `comprehensive code -` opener, randomized routing model). The relay returned 12 fully drawn marks; the owner wants to pick from the raw drawings on GitHub Pages before any refinement.
- Relay: docs/briefs/BRIEF-card-art-four-projects-concepts.md (final form = the minimized prompt; earlier full-brief form superseded in-place before send).
- Changes: portfolio/shell/src/design-directions/art-directions/fourProjectRethink.tsx — 12 mark components salvaged verbatim (RaftA–C heartbeat ring / split-brain partition / committed across replicas; ForestA–C lantern walker / fork signpost & fireflies / footprints home, all deliberate 8-bit pixel art; BlastA–C three-frame filmstrip / exploded cube / mushroom plume; PlanckA–C first instant / galaxies ignite / worlds form — a shared scrub-timeline motif). Integration repair (disclosed): each mark's own `<rect width="260" height="160" fill="#0d0d10" />` ground stripped — the draft card panel already paints the card ground and the rect read as a distinct seam. No house repair beyond that (raw by design): no gem-halo hover hooks, model's own helper/map code kept. roundSection.tsx extracted (RoundSection/DraftCard/useTilt shared, no circular imports); ArtDirections.tsx renders the four new sections first; ProjectArtwork.tsx adds fox to INCUMBENT_MARKS for the incumbent reference card.
- After: artifacts/R002/draft-card-art-rethink-<project>.png (×4, section shots at 1440 @2x)
- Visual inspection: performed — all 12 candidates render legibly on the real page; no console/page errors; set reads as intended (raft = mechanisms, forest = pixel-art walks, blast = ordered chaos frames, planck = one timeline three chapters). Known raw-state differences to resolve only for ADOPTED marks: fixed #0d0d10 fills inside some marks (filmstrip cells, node fills) tuned to the card ground, gem-halo hover hooks and spot-ink bed restated in house idiom, viewBox margins normalized.
- Code verification: tsc --noEmit green; vite build green (npm run build); probe sections=18 with the four new sections first.
- Open question: owner picks one candidate per project on the live page (link in session reply); refinement/customization follows the picks.

## Round R003
- Goal: owner supplied a second relay batch (12 more raw marks, same payload contract) — integrated as candidates D–F per project so all 18 candidates + incumbent reference sit in one choosing grid per project.
- Changes: fourProjectRethink2.tsx — batch 2 salvaged verbatim (RaftD–F crowned broadcast / log replication / majority partition; ForestD–F lone pine walk / creek log-bridge / fox on the trail; BlastD–F sprite strip / puffball peak / ground dome; PlanckD–F CMB sky map / galaxy era / recombination). Mechanical rename: function letters A/B/C → D/E/F, pattern/clip id prefixes re-prefixed to match (batch 1 owns A–C; ids stay unique page-wide). fourProjectRethink.tsx extends the four round grids with d–f entries, section names/theses say six now.
- After: artifacts/R003/draft2-card-art-rethink-<project>.png (×4, section shots at 1440 @2x)
- Visual inspection: performed — all 18 candidates render legibly on the real page; batch-2 marks shipped without a ground rect so nothing to strip; no console/page errors. RaftB (batch-1 split-brain) and RaftF (batch-2 majority partition) are same-subject siblings — both left in for the owner to weigh.
- Code verification: tsc --noEmit green (build verified green in R002; this round is additive components only).
- Open question: owner picks one candidate per project (A–F) on the live page; refinement/customization follows the picks.

## Feedback F001
- Round: R002/R003
- Verdict: LIKED
- Scope: raft-cluster card mark, landing page
- Decision: adopt candidate a "heartbeat ring"
- User source: "raft cluster - candidate a (heartbeat ring)"
- Artifact: artifacts/R002/draft-card-art-rethink-raft.png
- Supersedes: none

## Feedback F002
- Round: R002/R003
- Verdict: LIKED
- Scope: evening-forest card mark, landing page
- Decision: adopt candidate d "lone pine walk"
- User source: "evening forest - candidate d (lone pine walk)"
- Artifact: artifacts/R003/draft2-card-art-rethink-evening-forest.png
- Supersedes: none

## Feedback F003
- Round: R002/R003
- Verdict: LIKED
- Scope: explosion card mark, landing page
- Decision: adopt candidate f "ground dome"
- User source: "explosion - candidate f (ground dome)"
- Artifact: artifacts/R003/draft2-card-art-rethink-explosion.png
- Supersedes: none

## Feedback F004
- Round: R002/R003
- Verdict: LIKED
- Scope: planck-to-now card mark, landing page
- Decision: adopt candidate c "worlds form"
- User source: "planck to now - candidate c (worlds form)"
- Artifact: artifacts/R002/draft-card-art-rethink-planck-to-now.png
- Supersedes: none

## Round R004
- Goal: adopt the four owner picks (Raft a · heartbeat ring, Forest d · lone pine walk, Blast f · ground dome, Planck c · worlds form) onto the landing cards, refined to the house ground/hover mechanics with minimal repair. Owner added: "these are really great-looking" — the batch direction is liked; only the four picks move forward.
- Preserved preferences: F001–F004 (the picks, as drawn — refinement must not restyle them).
- Changes: ProjectArtwork.tsx — RaftCenterMark / FoxCenterMark / BlastCenterMark / SpiralCenterMark bodies replaced with the picked marks (same function names, so CENTER_MARKS/INCUMBENT_MARKS keys and all presentation config keep working). House adoption repairs: batch-1 ground rects already stripped in R002; raft follower node fill #26262c → house deep ink #26333b; planck knob outline #0d0d10 → card ground #0b1317; each mark's core dot-glow ellipse now carries className="gem-halo" + haloVar(drawn base 0.3–0.38) so hover brighten works additively; ids re-prefixed gem-raft/fox/blast/planck-*. styles.css: halo-pulse rule narrowed to Spine only — the adopted marks' glow beds (0.3–0.38) would be dimmed to the 0.08–0.16 pulse range, flattening the drawn look; their halos keep the static base, hover brighten only. fourProjectRethink.tsx "current" toplines updated to the adopted names (INCUMBENT_MARKS now resolves to the new marks). Relay brief deleted — outcome recorded.
- Before: artifacts/R001/before-art-<project>.png
- After: artifacts/R004/after-art-<project>.png (×4 + after-cards-full-1440.png, 1440×900 @2x)
- Visual inspection: performed on the real page — all four adopted marks render legibly at card size; no seams against the card ground; the four-card row reads as one family (dot beds + one hue protagonist + white glints); no console/page errors.
- Code verification: tsc --noEmit green; vite build green.
- Open question: owner judges the adopted cards live on GitHub Pages (desktop + mobile band untested visually on a real device); further micro-steers (note copy, hover glow strength) are cheap one-line rounds.

## Feedback F005
- Round: R004
- Verdict: REJECTED (scope-limited)
- Scope: colour prominence of the four adopted marks — hue-saturated beds and bright hue masses, landing page
- Decision: colours must be less pronounced; the register should match the first four cards, where whitish/paper is the most prominent colour
- User source: "please make colours of them less pronounced/less prominent. i like how it is in first 4 projects that most prominent colour is whiteish (which looks consistent). please make adjustments to colour palette"
- Artifact: artifacts/R004/after-cards-full-1440.png
- Supersedes: F001–F004 within colour-treatment scope only (subjects/compositions stay as picked)

## Round R005
- Goal: colour-only re-grade of the four adopted marks toward the first-four-cards register (whitish most prominent, hue demoted to accent). Geometry untouched.
- Preserved preferences: F001–F004 (subjects/compositions as picked); house register (neutral sparse beds @0.09, halos @0.12, paper/whitish brightest).
- Changes (all in ProjectArtwork.tsx unless noted): beds re-patterned to the house neutral sparse dots (#7d7669, 11px) @0.09 and glows to house halo dots @0.12 with haloVar(0.12). Raft: spokes + leader ring slate #465059, mid pulse dots bone #b6ac95, timer arcs dim rust #9c453f (hue keeps the leader disc only). Forest: pine bright #4fd1a5→#3f9c7c, lantern light #b8f2de→#e9f1ec (whitish), sparkles bone. Blast: debris arcs bone, dome stepped #6b3a22/#a8552c/#d99a55 with whitish core #ffe9c8, smoke/ground darkened ember. Planck: planet #3f2f7a + lit cap #6f5cb0, pale ring #e4dbff and paper moon #eeeae0 as brightest, timeline muted #8a79b8. styles.css: halo pulse restored to Raft + Planck + Spine (halos back at house 0.12).
- Before: artifacts/R004/after-cards-full-1440.png
- After: artifacts/R005/graded-cards-full-1440.png (+ graded-art-<project>.png ×4)
- Visual inspection: performed on the real page — the four re-graded marks now sit in the first-four-cards' register: neutral beds, whitish/paper brightest masses, one quiet hue voice each; compositions and subjects unchanged; no seams; no console errors.
- Code verification: tsc --noEmit green; vite build green.
- Open question: owner judges the re-graded palette live; per-mark ± steps (e.g. arcs brighter/dimmer, pine tone) are one-line micro-steers.

## Feedback F006
- Round: R005
- Verdict: LIKED (re-pick; supersedes F001–F004's per-card choices)
- Scope: the four adopted card marks, landing page
- Decision: raft → majority partition (crown removed); forest → fox on the trail; blast → three-frame filmstrip; planck → galaxies ignite
- User source: "actually let's do different options. raft cluster - majority partition. but remove the crown. evening forest - fox on the trail. explosion - three-frame filmstrip. planck to now - galaxies ignite."
- Artifact: artifacts/R003/*.png (candidate boards)
- Supersedes: F001–F004 per-card decisions

## Feedback F007
- Round: R005/R006
- Verdict: REQUESTED
- Scope: the four adopted marks, rendered size, both bands
- Decision: marks ~10% smaller
- User source: "also make them smaller by aroun 10%."
- Artifact: artifacts/R005/graded-cards-full-1440.png
- Supersedes: none

## Feedback F008
- Round: R005/R006
- Verdict: REQUESTED (extends F005's register to the new picks)
- Scope: colour emphasis of the four adopted marks
- Decision: prominent/prevalent colour = whitish/paperish
- User source: "their prominent/prevalent(emphasis-wise) should be whiteish/paperish colour"
- Artifact: artifacts/R005/graded-cards-full-1440.png
- Supersedes: none (narrows F005's scope onto the new picks)

## Round R006
- Goal: swap the four cards to the new picks, re-graded whitish/paper-dominant, −10% size.
- Preserved preferences: F005 register (neutral beds @0.09, halos @0.12), F006 picks (raft crownless), F007/F008.
- Changes: ProjectArtwork.tsx — RaftCenterMark → majority partition (paper fault line, paper majority followers, coral crownless leader, dashed slate minority); FoxCenterMark → fox on the trail (paper fox + slate legs, dim teal mushroom caps/leaves); BlastCenterMark → three-frame filmstrip (paper strip + deep-ink cells, muted ember contents, bone frame arrows); SpiralCenterMark → galaxies ignite (pale lavender arms #cfc4f2, paper core, muted violet timeline). styles.css — new per-center size rules: .center-raft/.center-fox/.center-blast/.center-spiral max-width 218→196px (≥900) and 240→216px (≤899). fourProjectRethink.tsx "current" toplines updated to the new adopted names.
- Before: artifacts/R005/graded-cards-full-1440.png
- After: artifacts/R006/r006-cards-full-1440.png (+ r006-art-<project>.png ×4)
- Visual inspection: performed on the real page — the four marks now share the first-four-cards' register (whitish/paper subjects, quiet hue accents), sit ~10% smaller inside their stages with the breathe headroom intact; no seams; no console errors.
- Code verification: tsc --noEmit green; vite build green.
- Open question: owner judges live (desktop + mobile device); micro-steers remain one-line.

## Feedback F009
- Round: R006
- Verdict: REJECTED (scope-limited: colour delivery + raft polish)
- Scope: whitish delivery (random glints, large white masses) on the four adopted marks; raft edge quality
- Decision: colouring must be subtle and intentional — edge lines / restrained drawn accents instead of random white highlights; white too prominent; raft too edgy → polished and refined
- User source: "The coloring needs refinement. It should be subtle and intentional—for example, using edge lines or similar restrained accents instead of random white highlights. Right now, the white is too prominent. The Raft cluster also feels a bit too edgy and should be made more polished and refined."
- Artifact: artifacts/R006/r006-cards-full-1440.png
- Supersedes: narrows F008 (whitish stays the register; its delivery changes to structure)

## Round R007
- Goal: refine all four marks per F009 via the deepening relay (chat model carried the four functions verbatim + the feedback + the lens exemplar).
- Preserved preferences: F006 picks (subjects/compositions recognizable), F007 size (untouched), F008 register, one gem-halo @0.12 per mark, house bed @0.09.
- Relay: docs/briefs/BRIEF-card-art-refine-r007.md (deepening brief, evidence verbatim; output format note truncated in transit — the model inferred one-component-per-mark under the original names, which matched intent).
- Changes (chat-model code, salvaged near-verbatim): Raft — miter zigzag → soft cubic S-cut (grey) with a 1.25px paper hairline on the majority side; links stop short of nodes; heartbeats fade at the cut (0.5); leader gains coral term ring + one drawn paper rim (the white square gone); minority dashes soften to warm grey round-cap, dashed circles use pathLength for even closing. Fox — paper body → bone, whitish as a 2px paper ridge (tail → riser → back), tail tip the one paper accent, head glint becomes a real deep-ink eye, mushroom spots tone-on-tone. Blast — 220×76 paper strip → bone with one paper top-edge hairline; both white squares removed; spark core drops to ember; burst keeps the single white-hot r5 core; smoke gets a drawn ember rim; arrows to slate in the gutters. Planck — near-white arms → dim violet with 1.5px pale spine engraved; square stars → plus-ticks; knob takes identity violet; the r2 paper pip is the mark's one intentional whitish accent.
- Integration: verbatim except comment paraphrase; ids/halo hooks intact.
- Before: artifacts/R006/r006-cards-full-1440.png
- After: artifacts/R007/r007-cards-full-1440.png (+ r007-art-<project>.png ×4)
- Visual inspection: performed on the real page — whitish now delivered via edges/rims/pips; scattered white squares gone; raft reads polished (soft cut, measured links); set sits in the first-four register; no seams; no console errors.
- Code verification: tsc --noEmit green; vite build green.
- Open question: owner judges the refined palette/raft live; per-mark nudges remain one-line.

## Round R008
- Goal: owner refinement of the adopted raft mark — straighten the partition cut, make each minority branch one collinear ray (solid heartbeat → cut → dashed continuation aligned), narrow the composition ~7% by shortening the lines.
- Preserved preferences: F006 pick (majority partition, crownless), F008/F009 register (whitish as structure: paper hairline on the cut's majority side, leader's paper rim), measured gaps (links stop short of every node; heartbeats fade at the cut, 0.5).
- Changes (ProjectArtwork.tsx, RaftCenterMark only): S-curve cut → straight vertical (M152 18 L152 142, paper twin at x148); both branches rebuilt as single rays from the leader center (86,80) through the minority node centers — top ray slope −0.2609, bottom +0.2609; heartbeats end 12 units short of the cut, dashes resume 8 units past it and stop 15 short of the node centers (ray-true endpoints); minority nodes 208→201 with the vertical dash recentered; followers 40→46; bed ellipse rx 106→99. Content span 188→175 units ≈ −6.9% width, achieved by shorter lines with the gap conventions intact.
- Before: artifacts/R008/r008-before-raft.png (equals the R007 state)
- After: artifacts/R008/r008-after-raft.png
- Visual inspection: performed on the real page (Chromium headless, 1440×900 @3×, card crop) — cut reads as one straight fault line with its paper hairline; no visible kink at the cut on either branch; composition tighter; node/leader character unchanged.
- Code verification: tsc --noEmit green; vite build green (13.1s); branch collinearity verified numerically (all segment endpoints on the leader→node rays).
- Open question: owner judges the straightened cut, aligned branches and −7% width live.

## Feedback F010
- Round: R008
- Verdict: LIKED
- Scope: the adopted raft cluster mark overall, landing page
- Decision: the R007 raft mark (majority partition, soft cut, paper edge, crownless coral leader) is the accepted base; this round's asks refine it, not replace it
- User source: "I like the raft cluster project card illustration on the main page"
- Artifact: artifacts/R008/r008-before-raft.png (the liked state)
- Supersedes: none

## Feedback F011
- Round: R008
- Verdict: REQUESTED
- Scope: the raft partition cut line, landing page card
- Decision: the line cutting through the design must be straight (the soft S-cut reads too abstract)
- User source: "it feels a bit too abstract. Please straighten the line that cuts through the design."
- Artifact: artifacts/R008/r008-before-raft.png
- Supersedes: none

## Feedback F012
- Round: R008
- Verdict: REQUESTED
- Scope: the two minority branch lines after the cut, landing page raft card
- Decision: solid lines from the center and the transparent/dashed lines beyond the cut must line up — one continuous ray per branch
- User source: "the two lines that branch out from it seem misaligned after the cut. The solid lines from the center to the transparent lines do not line up correctly."
- Artifact: artifacts/R008/r008-before-raft.png
- Supersedes: none

## Feedback F013
- Round: R008
- Verdict: REQUESTED
- Scope: raft mark width, landing page card
- Decision: ~7% narrower, achieved by making the lines shorter (outer nodes pulled inward, gaps preserved)
- User source: "make it smaller in width (by around 7%) by making lines shorter."
- Artifact: artifacts/R008/r008-before-raft.png
- Supersedes: none

## Round R009
- Goal: owner micro-steer batch on the refined raft mark: cut −10% overall, dashed continuations −6%, follower balls −5%, leader cluster −7%, then re-center.
- Preserved preferences: F006 pick, F008/F009 register, R008 straight cut + collinear branches + measured gaps (links stop short of nodes, heartbeats fade at the cut).
- Changes (RaftCenterMark only): cut y18–142 → y24–136 (124→112 units, −9.7% ≈ 10%, trimmed both ends, paper twin follows); dashed branch lines → (160.8,60.5)–(185.7,54) and mirror (−6%: 27.4→25.7 units, 0.8 off each end, endpoints still on the leader rays); followers r10→9.5; leader core r16→14.9, term ring r21→19.5, paper rim arc r11→10.2; composition re-centered horizontally via viewBox "-6 0 260 160" (content center 123.75 → box center 130) — interpretation of "adjust the centering", flagged below.
- Before: artifacts/R008/r008-after-raft.png
- After: artifacts/R009/r009-after-raft.png
- Visual inspection: performed on the real page (Chromium headless, 1440×900 @3×, card crop) — the shorter cut clears both branch crossings; branches stay collinear; smaller balls/leader keep the register; the mark reads centered in the card.
- Code verification: tsc --noEmit green; vite build green (16.8s).
- Open question: verdict per F014–F018; "adjust the center" was implemented as horizontal re-centering of the whole mark — if the leader node itself was meant instead, say so.

## Feedback F014
- Round: R009
- Verdict: REQUESTED
- Scope: the raft partition cut line length, landing page card
- Decision: cut shorter on both ends, ~10% smaller overall
- User source: "make that cutting line shorter on both ends. overall that cutting line should be 10% smaller"
- Artifact: artifacts/R008/r008-after-raft.png
- Supersedes: none

## Feedback F015
- Round: R009
- Verdict: REQUESTED
- Scope: the two dashed minority continuations after the cut, landing page raft card
- Decision: ~6% shorter
- User source: "also makee the transparent lines (two lines that go after cutting) shorter by around 6%"
- Artifact: artifacts/R008/r008-after-raft.png
- Supersedes: none

## Feedback F016
- Round: R009
- Verdict: REQUESTED
- Scope: the two bone follower balls (left side), landing page raft card
- Decision: ~5% smaller
- User source: "also make white round balls on the left smaller by around 5%."
- Artifact: artifacts/R008/r008-after-raft.png
- Supersedes: none

## Feedback F017
- Round: R009
- Verdict: REQUESTED (interpretation flagged)
- Scope: raft mark placement, landing page card
- Decision: re-center the composition after the size changes — implemented as a horizontal re-center (+6-unit viewBox shift); if the leader node itself was meant, the round gets a follow-up
- User source: "and after that adjust the centering"
- Artifact: artifacts/R009/r009-after-raft.png
- Supersedes: none

## Feedback F018
- Round: R009
- Verdict: REQUESTED
- Scope: the coral leader ball (center), landing page raft card
- Decision: ~7% smaller (core, term ring and paper rim scaled together)
- User source: "also make red ball at the centre smaller by around 7%"
- Artifact: artifacts/R008/r008-after-raft.png
- Supersedes: none

## Round R010
- Goal: owner micro-steers: follower balls mirrored to the minority pair's placement ("symmetric, same angle"), cut −15% more, leader ball −10% more.
- Preserved preferences: F006 pick, F008/F009 register, R008/R009 geometry conventions (straight cut, collinear rays, measured gaps, re-centered composition).
- Changes (RaftCenterMark only): followers (46,38)/(46,122) → (46,50)/(46,110) — the left pair now mirrors the right pair's vertical offsets (±30 about the leader axis) and both link pairs read as one symmetric family; majority links re-derived on the new rays (start leader+25u, end follower+13.4u); cut y24–136 → y32.4–127.6 (112→95.2 units, −15.0%, trimmed both ends, paper twin follows); leader core r14.9→13.4, term ring r19.5→17.6, paper rim arc r10.2→9.2 (quarter arc recomputed).
- Interpretation note (flagged to owner): "same angle as right darker balls" implemented as mirrored placement (same heights/distance pattern); the literal ±14.6° leader rays would put the left balls almost on the midline and shrink the left links to ~4-unit stubs — rejected as visually broken; if the literal shallow-angle variant is wanted anyway, it's a two-coordinate follow-up.
- Before: artifacts/R009/r009-after-raft.png
- After: artifacts/R010/r010-after-raft.png
- Visual inspection: performed on the real page (Chromium headless, 1440×900 @3×, card crop) — left/right pairs read symmetric; the shorter cut no longer reaches past the ball rows; smaller leader keeps the term ring proportion; register unchanged.
- Code verification: tsc --noEmit green; vite build green (18.9s).
- Open question: verdict per F019–F021; interpretation flag above.

## Feedback F019
- Round: R010
- Verdict: REQUESTED (interpretation flagged)
- Scope: the two bone follower balls, landing page raft card
- Decision: symmetric with the right darker balls — implemented as mirrored placement (same vertical offsets ±30 and same x-distance family); literal same-ray-angle variant rejected as visually broken (links collapse), owner can override
- User source: "make simmetrical - white balls on the left. they should be positioned at the same angle as right darker balls."
- Artifact: artifacts/R010/r010-after-raft.png
- Supersedes: none

## Feedback F020
- Round: R010
- Verdict: REQUESTED
- Scope: the raft partition cut line length, landing page card
- Decision: ~15% smaller again (second consecutive trim)
- User source: "also reduce the size of cutting line by around 15% more."
- Artifact: artifacts/R010/r010-after-raft.png
- Supersedes: extends F014

## Feedback F021
- Round: R010
- Verdict: REQUESTED
- Scope: the coral leader ball, landing page raft card
- Decision: ~10% smaller again (second consecutive trim)
- User source: "also make red ball at the centre smaller by around 7%" → this message: "reduce the size of red ball by around 10% more"
- Artifact: artifacts/R010/r010-after-raft.png
- Supersedes: extends F018

## Round R011
- Goal: owner micro-steers: cut −15% again and reduced to a single line (paper twin removed), majority links +10% longer.
- Preserved preferences: F006 pick, F008/F009 register except the cut's paper twin (explicitly superseded this round), collinear rays, node-gap conventions.
- Changes (RaftCenterMark only): cut y32.4–127.6 → y39.5–120.5 (95.2→81 units, −14.9%, both ends; still covers both ray crossings at y62.8/y97.2); paper hairline twin (x148) deleted — the cut is now one 3px line; majority links start moved toward the now-smaller leader (leader+25u → leader+23.84u): top (66.9,65.7)→(56.7,58), bottom (66.9,94.3)→(56.7,102), length 11.6→12.8 units (+9.6% ≈ 10%), node-side gaps untouched.
- Before: artifacts/R010/r010-after-raft.png
- After: artifacts/R011/r011-after-raft.png
- Visual inspection: performed on the real page (Chromium headless, 1440×900 @3×, card crop) — cut reads as one clean line and clears the ball rows; links read slightly longer; nothing else moved.
- Code verification: tsc --noEmit green; vite build green (19.2s).
- Open question: verdict per F022–F024.

## Feedback F022
- Round: R011
- Verdict: REQUESTED
- Scope: the raft partition cut line, landing page card
- Decision: the cut is one single line — the parallel paper hairline is removed (supersedes the cut-paper-edge aspect of the R007 whitish-as-structure delivery, cut scope only; the leader's paper rim stays)
- User source: "also make it a one line, instead of two parallel ones."
- Artifact: artifacts/R011/r011-after-raft.png
- Supersedes: R007/F009 paper-edge-on-cut delivery (scope-limited)

## Feedback F023
- Round: R011
- Verdict: REQUESTED
- Scope: the raft partition cut line length, landing page card
- Decision: ~15% shorter again (third consecutive trim)
- User source: "make the cutting line by around 15% shorter."
- Artifact: artifacts/R011/r011-after-raft.png
- Supersedes: extends F020

## Feedback F024
- Round: R011
- Verdict: REQUESTED
- Scope: the majority links to the follower balls, landing page raft card
- Decision: ~10% longer
- User source: "also incerase the legth of lines which go to white balls, by around 10%"
- Artifact: artifacts/R011/r011-after-raft.png
- Supersedes: none

## Round R012
- Goal: subject swap per owner — adopt the "split-brain partition" composition (candidate b of the raft rethink round, fourProjectRethink.tsx) while re-expressing it entirely in the current adopted design language.
- Preserved preferences: F006 (owner picks raft split-brain now supersedes the majority-partition pick), F008/F009 register, R008–R011 geometry conventions (single straight cut, collinear severed rays, measured gaps, trimmed lengths, mirrored ball sizes, re-centered viewBox).
- Changes (RaftCenterMark + fourProjectRethink topline): majority side becomes a fully meshed trio — new bone link between the two followers (46,63.4)→(46,96.6) with the 13.4 measured node gaps; the lower severed attempt now originates from the lower follower (horizontal ray y=110: heartbeat (71,110)→(140,110), dash (160.8,110)→(185.7,110)) instead of the leader, matching RaftB's two-attempt story (upper attempt stays leader→cut→top minority); the leader's lower heartbeat (110.2,86.3)→(140,94.1) removed. Language untouched: neutral bed @0.09, coral halo, bone 2.5 links, 0.5 heartbeats, dashed #7d7669 minority, single 3px straight cut (y39.5–y120.5), leader core r13.4 / ring r17.6 / paper rim, followers r9.5, viewBox "-6 0 260 160". Topline on the art-directions page: "current · split-brain partition (adopted)".
- Before: artifacts/R011/r011-after-raft.png
- After: artifacts/R012/r012-after-raft.png
- Visual inspection: performed on the real page (Chromium headless, 1440×900 @3×, card crop) — majority reads as a connected trio; both severed attempts die at the cut; minority pair orphaned with its own vertical dash; register and sizes unchanged.
- Code verification: tsc --noEmit green; vite build green (18.5s).
- Open question: owner judges the split-brain subject in the adopted language live.

## Feedback F025
- Round: R012
- Verdict: REQUESTED
- Scope: the raft mark's subject/composition, landing page card
- Decision: base switches to "split-brain partition" (candidate b from the art-directions raft round); all design language stays the currently adopted+modified version (R007–R011 refinements carry over)
- User source: "this is fine but base i guess is not it. let's change to 'split-brain partition' from art-directions. but redo all the design language as to which is currently is (current adopted and modified version)"
- Artifact: artifacts/R011/r011-after-raft.png (the rejected base), artifacts/R012/r012-after-raft.png (the redo)
- Supersedes: F006's raft pick (majority partition → split-brain partition); geometry conventions F010–F024 remain in force
