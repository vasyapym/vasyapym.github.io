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
