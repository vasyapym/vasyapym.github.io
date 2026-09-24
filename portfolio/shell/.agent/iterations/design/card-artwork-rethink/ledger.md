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
