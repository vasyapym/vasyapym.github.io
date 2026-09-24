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
