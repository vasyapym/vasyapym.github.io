# Shell — card marks: paper-geometry refinement (Raft, Evening Forest, Explosion, Planck) — design-iteration ledger

Task: refine four main-page project-card illustrations — Raft Cluster
(RaftCenterMark), Evening Forest (FoxCenterMark), Explosion
(BlastCenterMark), Planck to Now (SpiralCenterMark) — per the owner's
directive (2026-09-25): each mark ~15% more geometric, palette ~25% further
toward soft paper-like colors, Spine and Quicknotes marks as the register
references (but not simplified as far, outlines not as bold), a few
deliberate geometric details emphasized while secondary elements render more
minimally, subjects stay recognizable, the four stay cohesive with the rest
of the set. Delivery: delegated to the chat model (self-contained brief,
full autonomy over the specific design moves); the orchestrator integrates
the returned components into `portfolio/shell/src/shell/ProjectArtwork.tsx`
and verifies.

Scope guard: the four unchanged marks (Quicknotes prompt lens, Spine snap,
Waste-of-tokens occupancy wall, Cat Runner head) are the comparison set and
must not be touched. CSS caps (stage 168px ≥900 / 150px ≤899; base mark cap
218 ≥900 / 240 ≤899) are owner-calibrated and out of scope.

## Baseline B001 (2026-09-25)
- Artifacts: `artifacts/baseline/grid-full-1440.png`,
  `grid-mobile-390.png`, `card-01..08.png` (dev server, real render,
  1440×900@2x and 390×844@2x, headless Chromium/Edge via
  `portfolio/probes/card-marks-baseline.mjs` — scratch, local-only)
- Observation (actual renders inspected): card 05 Raft shows the crowned
  leader flop feeding a diagonal stage cascade (two committed stages, stage
  3 coral-dense overprint, dashed empty frontier stage, laggard stage with
  an X, coral bit mid-hop) on the sparse bed + coral halo; card 06 Evening
  Forest shows the moon with teal rim, layered tree/bush silhouettes, teal
  halftone canopy band, fireflies, ground bar; card 07 Explosion shows the
  lantern disc + amber ignition core, eight radial shards, amber overprint
  caps on two shards, seams, embers; card 08 Planck shows nested
  right-opening epoch arcs, violet singularity + now-frontier, star field.
  Palette: saturated accents (coral #ff6a5f, teal #4fd1a5, amber #ffb347,
  violet #a98cff) over dark slate fills — the four read more colorful and
  looser than the Quicknotes/Spine pair, which commit to few bone/paper
  forms.
- Code verification: NOT RUN (no code change)

## Round R001
- Goal: chat-model refinement of the four marks (geometry + palette
  steers above); concept-and-code round, single deliverable.
- Preserved preferences: subjects and gestures settled as of the brief
  (raft = shift-register ripple, forest = dusk landscape, explosion =
  radial shatter, planck = epoch ripples); register rejections stand
  (full-bleed noise, HUD clutter, blur/glow, bold poster glyphs,
  over-prominent towering marks); card copy/chrome/stage untouched.
- Changes: none shipped — relay round.
- Before: artifacts/baseline/* (this task)
- After: pending relay reply
- Visual inspection: NOT RUN (delegation round)
- Code verification: NOT RUN
- Open question: paste the reply back to the orchestrator for integration.

### R001 addendum — upstream supersession discovered (2026-09-25, same round)
- During the round-trip the tree fast-forwarded f54c2c2 → f173c55: a parallel
  task, `portfolio/shell/.agent/iterations/design/card-artwork-rethink/`
  (rounds R001–R020, owner verdicts F001–F034, closed with "ok it is fine"),
  REPLACED all four subjects on the landing: raft = split-brain partition
  (spine-like outline language, +30% prominence steps, F034-approved), forest
  = fox on the trail (green/white), explosion = three-frame filmstrip
  (centered spark, F031), planck = galaxies ignite (R007-refined). CSS caps
  for the four centers moved to 196px (≥900) / 216px (≤899).
- Consequence: the two brief-18 relay outputs refine the superseded
  generation. They are NOT integrated; the owner asked to see them rendered
  next to the current state for judging instead.

## Round R002
- Goal: present the two relay outputs to the owner on GitHub Pages — a static
  review page comparing, per project: CURRENT (adopted post-saga marks at
  f173c55) vs OUTPUT 1 vs OUTPUT 2, plus the four untouched anchors, set rows,
  a ≤899-band approximation, and both outputs' palette tables.
- Changes: `portfolio/shell/public/card-marks-18/index.html` (self-contained,
  symbol/<use> library, 16 marks: 4 current + 8 output + 4 anchors; ids
  namespaced per column to stay unique page-wide; no JS).
- After: artifacts/R002/review-page.png (full-page headless render
  1200px@1.5x; deployed link follows)
- Visual inspection: performed — all 16 symbols render legibly; trio/set/mobile
  sections correct; zero console errors.
- Code verification: NOT RUN (static page only; no product code changed)
- Open question: owner verdict per output (and whether the brief-18 steers
  carry over to the adopted post-saga marks — the saga's own verdict chain
  F005/F008/F009/F030/F032 already moved the set toward whitish/quiet, so the
  outputs' value is direction + detail ideas, not drop-in code).

## Round R003
- Goal: owner re-steer after reviewing the page — work WITH the current
  adopted marks (split-brain raft / fox on the trail / filmstrip / galaxies
  ignite), not the superseded generation brief 18 was written against; relay
  re-cut per minimize-iteration2 (registered there as S6). Revised steers:
  geometry **~25%** (weighted to bold/large forms — silhouettes, primary
  structures, composition-level construction — explicitly not tiny details);
  palette **~40%** further toward soft paper tones. Freedom raised: full
  design autonomy, free reply structure, subjects must stay recognizable.
- Preserved preferences: the adopted subjects (F025/F029/F031-chain + planck
  R007); raft's calibrated prominence holds (F030–F034); whitish-as-structure
  register (F009); anchors untouched; CSS caps untouched (196/216).
- Changes: none shipped — relay round. Brief:
  `chat-model-brief-19-cards-paper-geometry-r2.md` (orchestrator workspace)
  carrying the four CURRENT functions verbatim + the two anchor marks.
- Before: artifacts/baseline/* (pre-rethink incumbents, historical) + the
  post-saga state at f173c55/167243c (current; the card-05..08 shots in
  artifacts/baseline predate the rethink — current-code renders to be
  captured with the integration round)
- After: pending relay reply
- Visual inspection: NOT RUN (delegation round)
- Code verification: NOT RUN
- Open question: paste the reply back for integration.

## Round R004
- Goal: show the four brief-19 relay replies for judging — static page, no integration.
- Changes: portfolio/shell/public/card-marks-19/index.html (self-contained
  symbol/<use> library, 24 marks: 4 current + 16 output + 4 anchors; output
  pattern ids namespaced o1..o4-*; no JS). Replies: orchestrator workspace
  chat-model-response-19-output1..4.md (fable 5.1-low x2, fable 5.1-high,
  opus 5.5-high).
- After: artifacts/R004-review-live.png (1200px headless render); deployed
  on GitHub Pages with the same push.
- Visual inspection: performed — all 24 marks legible; href targets resolve;
  no duplicate ids (node check).
- Code verification: NOT RUN (static page only)
- Open question: owner picks draw(s) per card -> integration round.

## Round R005
- Goal: owner picked all four marks from out 3 (fable 5.1-high) — integrate verbatim.
- Changes: portfolio/shell/src/shell/ProjectArtwork.tsx — the four function bodies
  + header comments replaced verbatim with brief-19 output 3 (raft row-grid
  triangle; fox 45° stepped tail, bone mushroom caps on paper stems; blast
  11 large square sprockets @20 pitch, octagram burst, disc triad; planck
  semicircle->tangent 120° arcs, squashed disc 0.78, square knob).
- Verification: shell tsc clean. vite build blocked by the PRE-EXISTING wasm gate
  on this machine (no Rust/Go toolchain; identical failure on the unmodified
  baseline — CI builds green with setup-go). Visual: tests/landing-shots.mjs on
  the dev server — desktop-cards.png + mobile-full.png in artifacts/R005-integrated:
  all four marks legible at 196/216 caps and the 150px stage; set reads cohesive;
  fox green/white read holds; raft weight comparable.
- Deploy: pushed; deploy-pages.yml rebuilds GitHub Pages.
- Open question: owner look on the live site.

## Round R006
- Goal: owner: the whitest whites must not be prominent — match the Quicknotes register.
- Scan: across the four integrated marks, only blast's white-hot core #fff3e2 sat
  above paper #eeeae0; raft rims / fox band+tip+ridges / planck spine+nucleus /
  blast hairlines already sit exactly at paper.
- Changes: ProjectArtwork.tsx — burst core #fff3e2 -> #eeeae0 (comments updated:
  white-hot -> paper-white). No geometry or other color touched.
- Verification: tsc clean; landing-shots desktop-cards.png (artifacts/R006-paper-core):
  burst core reads in the paper register, no glare vs quicknotes.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.

## Round R007
- Goal: owner size-steer — raft ~7% smaller, evening forest ~5%, explosion ~8%;
  planck untouched.
- Changes: portfolio/shell/src/styles.css — the shared four-mark cap split into
  per-mark max-widths in BOTH bands (>=900 from 196: raft 182 / fox 186 /
  blast 180 / spiral 196; <=899 from 216: raft 201 / fox 205 / blast 199 /
  spiral 216). Only size caps touched — no geometry, palette or stage changes.
- Verification: landing-shots desktop-cards.png (artifacts/R007-sizes): the three
  marks render smaller, spiral unchanged; no overflow, breathe intact.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.

## Round R008
- Goal: owner: raft's two peer balls read too-edged; fox's whites a bit
  prominent — tone both down ~10% (more paper-like).
- Changes: ProjectArtwork.tsx — raft majority peer rims #eeeae0 -> #e9e5da
  (10% toward the bone end of the ramp); fox card's paper pieces -> #e9e5da
  (tail tip, chest block, ridge lines @0.9, both mushroom stems). Blast
  hairlines and planck spine/nucleus untouched (not flagged).
- Verification: tsc clean; landing-shots desktop-cards.png
  (artifacts/R008-whites-10): peer rims no longer the brightest edge, fox
  band reads creamier.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.

## Round R009
- Goal: R008's step was imperceptible — owner right. Redo as a real ~10% luma
  reduction (R008 moved only 10% of the way paper->bone = ~2% luma).
- Changes: ProjectArtwork.tsx — raft peer rims + fox paper pieces (tail tip,
  chest, ridges @0.9, mushroom stems) #eeeae0 -> #ddd6c6 (the ramp's
  paper-shadow token; measured ~8-9% luma down, clearly visible).
- Verification: tsc clean; landing-shots desktop-cards.png
  (artifacts/R009-whites-visible): peer circles recede below the mesh read,
  fox band no longer the glaring element.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.

## Round R010
- Goal: owner trial — raft link lines ~6% bolder (owner unsure, may revert).
- Changes: ProjectArtwork.tsx raft — mesh + severed attempts strokeWidth
  2.4 -> 2.55 (+6.25%). Fault (3.3), minority dashes (1.5), peer rims (2.4)
  untouched. Comment marks it as an owner trial.
- Verification: tsc clean; landing-shots desktop-cards.png
  (artifacts/R010-raft-lines): links marginally heavier, balance holds.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert switch: strokeWidth 2.55 -> 2.4 on the two raft link groups.

## Round R011
- Goal: owner trial — a white line or lines in the fox mark; green reads a bit
  prevalent but the card is liked as-is, so no radical changes.
- Changes: ProjectArtwork.tsx fox — ONE added element: a 200x1 paper hairline
  (#eeeae0 @0.85) on the ground bar's top edge (the filmstrip's paper-hairline
  device, re-read as the lit trail). Nothing else moved, no recolors.
- Verification: tsc clean; landing-shots desktop-cards.png
  (artifacts/R011-fox-trail-line): the green ground mass is broken by one quiet
  lit rule under the fox.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert switch: delete the single hairline rect.

## Round R012
- Goal: owner could not see R010/R011 (steps were genuinely sub-pixel) and
  delegated the call: make the raft and fox changes VISIBLE, revert if disliked.
- Changes: ProjectArtwork.tsx —
  raft: link lines (mesh + severed) 2.55 -> 2.7 (+12.5% vs the 2.4 base);
  fox: the lit-trail hairline 200x1 @0.85 -> 200x2 full #eeeae0 (a real paper
  rule on the ground's top edge, mirroring the blast strip device).
- Verification: tsc clean; landing-shots desktop-cards.png
  (artifacts/R012-visible-steps): raft mesh clearly heavier, fox ground clearly
  paper-topped; both visible at card scale in the shot itself.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert switches: raft strokeWidth 2.7 -> 2.4; delete the fox trail rect.

## Round R013
- Goal: owner: still not consistent — wants a senior-developer minimalism look;
  delegated the call, revert if disliked.
- Changes: ProjectArtwork.tsx —
  raft: dropped the triangle entirely — the whole cluster is ONE horizontal
  row (peer ring - coral leader disc - peer ring, straight bone links 2.7 with
  measured gaps), one severed stub dies at the vertical fault, the orphaned
  pair mirrors the row in dashed slate; bed/halo recentred on the row;
  fox: fox untouched; scene reduced to ground + lit trail, one fern (stem +
  two fronds), one mushroom (dome, no spots, no second mushroom), one leaf;
  ground fragments dropped.
- Verification: tsc clean; landing-shots desktop-cards.png
  (artifacts/R013-senior-minimal): both marks read quiet and diagrammatic,
  closer to the quicknotes register; raft row rhymes with planck's scrubber.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert: git restore the two functions to the R012 state (triangle raft /
  full fox scene).

## Round R014
- Goal: owner: R013's one-row raft looked consistent but broke the CONCEPT (a
  chain is not a quorum/cluster) — fox OK as-is.
- Changes: ProjectArtwork.tsx raft only — concept restore with the row
  discipline kept: compact centered quorum triangle (coral leader apex at
  85,58; peers on one baseline y108; three straight bone links 2.7 with
  measured gaps), one severed stub dies at the vertical fault, the orphaned
  pair is a vertical dashed column on one axis (x206, rings on the quorum's
  two rows). Bed cy86, halo recentered on the quorum (85,88). Fox untouched.
- Verification: tsc clean; landing-shots desktop-cards.png
  (artifacts/R014-concept-restore): the card reads quorum | fault | orphans
  again while staying schematic-quiet.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert: R013 one-row state via git restore.

## Round R015
- Goal: owner: R014 dropped the lines connecting toward the right-side (orphan)
  balls — concept broken again by over-pruning.
- Changes: ProjectArtwork.tsx raft only — connectors restored in the column
  geometry: majority side gets a second severed stub on the leader's row
  (100,58 -> 142,58 @0.55, joining the baseline stub); the orphan side gets two
  dashed stubs from the fault toward each ring (158 -> 191, stopping short —
  the links never complete) while the vertical dashed link between the rings
  stays. Quorum triangle + fault untouched. Fox untouched.
- Verification: tsc clean; landing-shots desktop-cards.png
  (artifacts/R015-connectors-back): the connection story reads both sides of
  the cut; the quorum | fault | orphans narrative is whole again.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.

## Round R016
- Goal: owner: add some detail to raft; fox card colours ~7% less prominent.
- Changes: ProjectArtwork.tsx —
  raft: two deliberate details on the leader — a paper pip inside the coral
  disc (the committed entry) + a thin paper term-ring (85,58 r19.5 #eeeae0
  1.4 @0.7, the leader's current term; the out-4 previewed device);
  fox: palette stepped ~7% toward the dusk — mint #8fdbbd -> #86cdb1 (body,
  halo dots, leaf), deep green #1f5e4c -> #1e5948 (ground, fern, legs),
  caps #b6ac95 -> #aaa18c, paper pieces/stems #ddd6c6 -> #cec8ba; the lit
  trail keeps full paper #eeeae0 as the card's one white accent. Scene
  geometry untouched.
- Verification: tsc clean; landing-shots desktop-cards.png
  (artifacts/R016-raft-detail-fox-quiet): leader carries a pip + ring; fox
  reads duskier, green less shouty, trail still the bright rule.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert: R015 raft (no ring/pip) + R013 fox hexes via git restore.

## Round R018
- Goal: owner size-steer — explosion ~5% smaller.
- Changes: portfolio/shell/src/styles.css — .center-blast max-width 180 -> 171
  (>=900) and 199 -> 189 (<=899). Only size caps touched.
- Verification: landing-shots desktop-cards.png (artifacts/R018-blast-5): the
  strip renders smaller, no overflow, breathe intact.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.

## Round R019
- Goal: owner rejected the three S8 treatments ('these are not it') and
  delivered a further relief/rhythm treatment from the same relay — integrate.
- Changes: portfolio/shell/src/shell/ProjectArtwork.tsx raft — the
  relief/rhythm mark verbatim: bed plate + grain bands, dark offset
  under-print on every plate (translate 2.5,3), leader halo ring + coral disc
  with one paper facet, 4.5-unit bone links, peers as paper rings on dark
  fill, the fault as a tapered paper wedge with two dark gutters, orphans as
  hollow rings + chunky pending column (7/6) + reaching stubs (5/5) that stop
  short of the cut. Nothing under 3 units. House repairs on integration: the
  sparse dot bed + the single gem-halo ellipse sit behind the design
  (id gem-raft-halo renamed gem-raft-leader-halo; ids stay in the family).
- Verification: shell tsc clean; landing-shots desktop-cards.png
  (artifacts/R019-relief-rhythm): the mark reads with relief weight; story
  intact (quorum | wedge cut | orphans reaching).
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert: R017 raft via git restore.

## Round R021
- Goal: owner re-opened the raft detail line ("these are not it. let's try
  this ones") relaying the relief/rhythm detail decision (0.7 px/unit scale;
  detail = relief + rhythm, nothing under 3 units) and asked to SEE treatments
  on Pages before choosing �?" judging-board round, no code integration.
- Changes: portfolio/shell/public/raft-details-22/index.html (new static
  judging board) �?" four chunky detail variants built on the adopted R019
  relief base, one detail family each, every stroke >= 3 units: A riveted
  plating (r4 rivets along the bed rim), B serrated tear (teeth bite the
  paper wedge from both gutters + diagonal hatch grain, column 9/7, reach
  6/6), C stacked plates (two under-plates + r24.5 leader collar), D ring
  anchors (r27 anchor ring on the leader, r15 on peers, fault flank ticks).
  Current adopted state (R019) shown alongside.
- Preserved preferences: F-core story (quorum | the cut | orphans still
  trying), coral one-hue-mass, neutrals only, no text/gradients/filters,
  ids in gem-raft- family, nothing under 3 units (owner relief decision).
  The three rejected S8 treatments (prompt 21) stay out.
- Before: artifacts/R021/board-full.png cells "current".
- After: artifacts/R021/board-full.png cells A-D (zoom + real scale).
- Visual inspection: performed (headless Chrome, puppeteer-core) �?" read the
  full-page PNG: all five cells render; serrated teeth read at zoom and are
  noise-level at 182px (declared in the board note); rivets/hatch/stack/
  anchors all hold their read at 182px; no console errors.
- Code verification: NOT RUN (static board, no app code touched).
- Deploy: pushed (this commit); deploy-pages.yml rebuilds Pages.
- Open question: which treatment (A/B/C/D, none, or a mix) integrates.

## Feedback F010
- Round: R021
- Verdict: REJECTED
- Scope: raft center mark, all four raft-details-22 detail variants
  (riveted plating / serrated tear / stacked plates / ring anchors)
- Decision: too subtle, not noticeable at the render; also the whole
  ornament direction is closed.
- User source: "the changes are too subtle and not noticeable"
- Artifact: portfolio/shell/public/raft-details-22/index.html
- Supersedes: none

## Feedback F011
- Round: R021 (verdict on the integrated R019 state)
- Verdict: REJECTED
- Scope: raft center mark, R019 relief/rhythm integration as a whole
- Decision: "current version looks too decorative" — does not read as the
  senior-developer minimalism look; leader reverts to a plain coral disc
  (no facet dot, no halo ring around it); next round = chat-model relay
  with full design/code autonomy + a deeper-reasoning protocol; concept
  (quorum | cut | orphans) stays.
- User source: "current version looks like too decorative. also give
  reverted version of the raft illustration (without dot and circle around
  red ball). make the chat model be creative, don't restrict it in its
  choices. concept stays, but when it comes to details - freedom"
- Artifact: live landing card (R019 state)
- Supersedes: none

## Round R022
- Goal: apply F011's revert on the integrated mark �?" leader becomes a
  plain coral disc again (drop the facet dot + the halo ring around it,
  including the halo's dark under-print twin).
- Preserved preferences: F011 scope only; the rest of R019 (bed plate +
  grain, bone links, wedge fault with gutters, hollow orphan rings +
  pending column + reaching stubs) stays until the S9 relay pick.
- Changes: portfolio/shell/src/shell/ProjectArtwork.tsx raft �?" removed
  gem-raft-leader-halo ellipse, gem-raft-leader-facet path, and the
  halo's r21 twin circle inside gem-raft-relief.
- Before: artifacts/R022/before-revert.png
- After: artifacts/R022/after-revert.png
- Visual inspection: performed (headless Chrome via tests/landing-shots
  pipeline) �?" leader reads as a plain coral disc; relief twin gone; no
  orphaned dark circle anywhere.
- Code verification: shell tsc clean.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Open question: S9 relay brief delivered with this round; owner pastes
  it to the chat model.

## Feedback F009
- Round: R019
- Verdict: REJECTED
- Scope: raft center mark, whole-card treatments of the prompt-21 board
  (faceted press / offset impression / broken woodcut)
- Decision: all three S8 relay treatments rejected ("these are not it");
  the R019 relief/rhythm integration stands as the base to iterate on.
- User source: "these are not it. let's try this ones" + relayed relief/
  rhythm detail decision (0.7 px/unit; detail = relief and rhythm; nothing
  under 3 units ships)
- Artifact: portfolio/shell/public/raft-details-21/index.html
- Supersedes: none

## Round R023
- Goal: S9 relay reply arrived (Hub / Bus / Ring) - render as delivered on a
  judging board vs the R022 reverted state; no integration until the owner
  picks.
- Preserved preferences: F011 (plain coral leader, no ornament), F010
  (nothing subtle); brief rails held by all three (house lines verbatim,
  ids in gem-raft- family, thinnest stroke 4 units, no banned devices).
- Changes: portfolio/shell/public/raft-details-23/index.html (new static
  judging board, 4 cells x 2 scales). Board-side repairs only: the Ring
  symbol needed fill="none" on the arc path (the delivered tsx carries it
  on the svg root, which <symbol> strips); the current cell gained the
  house dot bed + halo for an honest comparison.
- Mechanical review of the reply: contract-clean (3 blocks, story line,
  why-it-survives line, drop-in functions); geometry verified - Ring's
  r54 circle exact for all nodes/dots, Hub's ellipsis pitch uniform 9.6
  units, Bus's dasharray "0 9" renders true dots. Flag: Bus's wire ends
  30 units before the fault, so "severs" is implied, not literal
  (repairable on integration if picked).
- Before: artifacts/R023/board-full.png cell "current" (= R022 state).
- After: same PNG cells 1 Hub / 2 Bus / 3 Ring.
- Visual inspection: performed (headless Chrome, puppeteer-core) - read
  the full-page PNG twice (caught and fixed the Ring fill rendering
  artifact between reads); all three treatments hold their read at 182px;
  no console errors.
- Code verification: NOT RUN (static board, no app code touched).
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Open question: pick 1 Hub / 2 Bus / 3 Ring (or none / a mix).

## Feedback F012
- Round: R023
- Verdict: LIKED
- Scope: raft center mark, S9 treatment 3 "Ring" (broken membership circle)
- Decision: integrate Ring; Hub and Bus stay out.
- User source: "i pick - 3" (on the raft-details-23 board)
- Artifact: portfolio/shell/public/raft-details-23/index.html
- Supersedes: none

## Round R024
- Goal: integrate the owner-picked S9 "Ring" treatment (F012).
- Changes: portfolio/shell/src/shell/ProjectArtwork.tsx raft - the Ring
  mark verbatim: quorum arc of the r54 membership ring (centre 126,82)
  through the plain coral leader, two solid paper peers at the arc ends,
  the paper cut through both ring gaps, hollow orphan members on the
  circle with a three-dot pending fragment between them. House repairs on
  integration: dot bed + gem-halo kept, halo base opacity restored via
  --halo-opacity (the relay had dropped the style var).
- Verification: tsc clean; landing card screenshot
  (artifacts/R024/after-integration.png) - ring reads whole-left/broken-
  right, dots visible at 182px, no orphaned relief leftovers, no console
  errors.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert: R022 state via git restore of ProjectArtwork.tsx.

## Feedback F013
- Round: R024
- Verdict: LIKED
- Scope: raft center mark, S9 treatment 1 "Hub" (two-spoke chevron + full-
  height cut + orphan ellipsis)
- Decision: replace the just-integrated Ring with Hub; Bus stays out.
- User source: "let's do hub instead" (after seeing Ring live)
- Artifact: portfolio/shell/public/raft-details-23/index.html
- Supersedes: F012 (Ring pick reversed before it settled)

## Round R025
- Goal: swap the integrated mark Ring -> Hub per F013.
- Changes: portfolio/shell/src/shell/ProjectArtwork.tsx raft - the Hub
  mark verbatim: coral leader (92,80 r14) as the vertex of a two-spoke
  chevron to solid paper peers (48,42 / 48,118 r11), full-height paper cut
  (x150, 14-146), hollow orphan pair (190,46 / 224,114 r9.5) joined only
  by the five-dot ellipsis (r2.4, uniform 9.6 pitch). House repairs on
  integration: dot bed + gem-halo kept, halo base opacity restored via
  --halo-opacity.
- Verification: tsc clean; landing card screenshot
  (artifacts/R025/after-integration.png) - chevron + cut + ellipsis read
  at 182px, no ring leftovers, no console errors.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert: R024 (Ring) via git restore of ProjectArtwork.tsx.

## Round R026
- Goal: owner verdict on the live Hub - left and right elements feel too
  far from the cut; option A approved (breathing space tightened, element
  sizes untouched).
- Changes: portfolio/shell/src/shell/ProjectArtwork.tsx raft - quorum
  cluster +14 toward the cut (leader 92->106, peers 48->62), orphan pair
  -8 (190->182, 224->216); ellipsis dots translated with the pair (pitch
  unchanged 9.6, dot size unchanged r2.4); links recomputed to the new
  endpoints. Gap quorum->cut 44->30 units; cut->orphan 28.5->20.5. All
  element sizes and stroke weights verbatim.
- Verification: tsc clean; landing card screenshot
  (artifacts/R026/after-tighten.png, compare R025 before) - both groups
  now read against the cut; no console errors.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert: R025 coordinates via git restore of ProjectArtwork.tsx.

## Round R027
- Goal: owner steer on the live tightened Hub - make the elements ~10%
  bigger so the mark reads fuller and tighter; positions unchanged.
- Changes: portfolio/shell/src/shell/ProjectArtwork.tsx raft - radii and
  strokes grown x1.1: leader r14->15.4, peers r11->12.1, orphans r9.5->
  10.45 (ring stroke 4->4.4), links 4.5->5, fault 4.5->5, ellipsis dots
  r2.4->2.65 (pitch unchanged 9.6). Positions from R026 untouched.
- Verification: tsc clean; landing card screenshot
  (artifacts/R027/after-10pct.png, compare R026) - fuller read, no
  overlaps, no clipping, no console errors. Clearances still healthy:
  leader->cut 28.6 units, cut->orphan ring 19.35, dot gaps 4.32.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert: R026 sizes via git restore of ProjectArtwork.tsx.

## Round R028
- Goal: owner direction - bring the planck card mark the rest of the way
  into the house spot-ink register, the way the raft mark was recomposed
  (S9). Delegated: chat-model freedom round, 5 distinct ideas, reply
  contract per the brief; owner picks on a GitHub Pages board
  (planck-consistency-24).
- Preserved preferences: mark fits its stage with breathe intact; the
  owner-picked subject read "galaxies ignite" (R002/R003 chain, refined
  R019); house carriers required (sparse bed + hover halo + white/paper
  anchor, glint vocabulary); banned-trait list from the S6-S9 rounds.
- Changes: none shipped - relay round. Brief at
  docs/briefs/chat-model-prompt-26-planck-consistency-freedom.md (drafted
  from the pre-registered prompt-24 arm, updated to the current render +
  the adopted raft anchor; the S-series A/B pairing of prompt-24 is not
  run - single-brief freedom round per owner direction).
- Before: current SpiralCenterMark (ProjectArtwork.tsx R019 state) -
  renders as the judging board's "current" cell.
- After: pending relay reply.
- Visual inspection: NOT RUN (delegation round; board build verifies next).
- Code verification: NOT RUN.
- Open question: paste the reply back to the orchestrator for integration.

### R028 addendum — owner direction revision (2026-09-25, same round)
- The owner invoked minimize-iteration2: the pre-registered prompt-24 A/B
  experiment runs on this task after all. Draw 1 = Arm A (the brief already
  issued, prompt-26, unchanged in content); draw 2 = Arm B (control: the
  same brief minus the deliberation-protocol block, length rebalanced with
  a no-fact contract restatement, ±10% held), then A B A B, >=6 draws
  before any verdict talk. Endpoint: the owner's fixed specialist chat -
  descriptive findings only, never routing verdicts (results.md is
  explicit). Per-draw: board update at planck-consistency-24 + push +
  Pages link; one results.md line per draw (prompt ref, outcome, proxies:
  distinct skeletons / contract adherence / integration repair count).

### R028 addendum 2 — owner format steer (2026-09-25, same round)
- The owner reversed the long-brief direction ("shorter briefs worked;
  the pruned text was not irrelevant"): prompts 26/27 rewritten to the
  short proven shape (S2/S5 lineage). Template + exemplar recorded in
  skills/in-progress/minimize-iteration2/brief-format.md; full S1-S5
  history restored beside it. Experiment axis moves from
  protocol-presence to H1 register (A telegraphic / B human prose,
  contract identical); the S9 protocol stays the convergence-trap escape
  hatch. Draw 1 = short Arm A.

### R028 addendum 3 — relay replies + judging board (2026-09-25, same round)
- The owner relayed TWO outputs for the minimal brief (two draws on the
  same shape): output 1 = five variants (face-on dotted arms / inclined
  disc / arm-unwinds-into-timeline / barred spiral / ignition rail),
  output 2 = five variants (scrub / arm-becomes-time / inclined disc /
  expansion cone / paper plate). Mechanical review: both contract-clean
  (5 blocks + why lines each); no ids (ap- prefix slipped - harmless on
  a static board); each carries its own #0b1317 ground rect (kept - the
  stage shares the colour); no banned traits spotted; variant 10's
  stipple flagged as the mud risk at 196px (its own notes name the fix).
- Board: portfolio/shell/public/planck-consistency-24/index.html -
  current reference + 10 cells at real scale 196px + zoomed 300px rows,
  svg verbatim as delivered. Visual inspection: performed (headless
  Chromium, full-page PNG artifacts/R028/board-full.png) - 23 svgs, 0
  blank cells, 0 console errors; all ten hold their read at 196px.
- Code verification: NOT RUN (static board, no app code touched).
- Deploy: pushed; deploy-pages.yml rebuilds Pages; board also opened
  locally for the owner.
- Open question: pick 1-10 (or none / a mix).

## Feedback F014
- Round: R028
- Verdict: LIKED
- Scope: planck card mark, planck-consistency-24 board
- Decision: integrate variant 9 "expansion cone" (output 2's diagram-as-timeline take); the other nine stay out.
- User source: "i choose this - 9 · expansion cone" (on the board)
- Artifact: portfolio/shell/public/planck-consistency-24/index.html
- Supersedes: none

## Round R029
- Goal: integrate the owner-picked variant 9 "expansion cone" (F014).
- Changes: ProjectArtwork.tsx SpiralCenterMark body replaced verbatim -
  the cone (two thin structural lines from the apex glint), the igniting
  star field (dots grow in size/tone/count left to right), the spiral
  galaxy parked at the playhead, the apex glint as first light, the scrub
  timeline demoted to an echo rail aligned under the core. House repairs
  on integration (disclosed): the delivered #0b1317 ground rect stripped
  (the card panel paints the ground, R002/R003 precedent); no gem-halo
  hook - the halo here is the structural dark disc, not a glow, so hover
  brighten is intentionally absent (the planck gem-halo-pulse CSS rule
  goes inert; no CSS change made).
- Verification: tsc clean; card + grid screenshots
  (artifacts/R029/after-integration.png, grid-after-integration.png,
  headless Chromium 1920x963 @3x) - glint, cone, dot ignition, galaxy and
  echo rail all read at card scale; no console errors.
- Deploy: pushed; deploy-pages.yml rebuilds Pages.
- Revert: R019 "galaxies ignite" mark via git restore of ProjectArtwork.tsx.
- Open question: owner judges the live card; if hover feedback is missed,
  a violet glow-bed + gem-halo hook can be added as a micro-steer.
