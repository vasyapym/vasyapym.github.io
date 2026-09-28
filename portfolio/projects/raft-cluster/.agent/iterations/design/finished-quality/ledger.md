# Ledger — raft-cluster finished-quality redesign

Task: owner verdict (2026-09-28 session, /design-iteration): the Raft Cluster
live page reads as unfinished; redesign it to portfolio-finished quality —
minimal, restrained, organic, consistent. Delegated to the chat model per
orchestrator protocol (briefs prepared by GLM, responses salvaged and
integrated). Scope: live page visual layer + all states + portfolio
presentation (README); out: Raft logic, tech stack.

Prior raft page history lives in `../trim-thesis-copy/` (copy register F001/F002)
and the repo-wide chrome-trim ledger (`portfolio/.agent/iterations/design/chrome-trim/`,
closed with F003 — the window-adaptive h1 title line is liked and settled).
Landing card-art history (split-brain Hub mark) is out of scope for the live page.

## Baseline (2026-09-28)
- Artifacts: `artifacts/baseline/` — desktop-1440, desktop-1920, laptop-1120,
  mobile-390, desktop-node-selected, desktop-crashed, desktop-partitioned,
  desktop-linkmode PNGs. Rendered on local dev server (Chromium headless,
  dpr2), dev port 5199.
- Audit observations (from the actual renders, source-confirmed):
  - Canvas scene floats in dead space: pentagon occupies ~50% of the 4:3
    canvas; no anchor, legend, or annotation; empty box reads as placeholder.
  - Log bars under nodes are flat gray segments; empty state = blank bar;
    per-entry colours are random per-term hues (committed vs uncommitted only
    a dim/opacity step) — the Raft log mechanics do not read.
  - In-flight messages are 3px dots without direction or label; teal marks
    votes (teal also marks link-pending selection — two meanings; teal was
    banned in the card-mark saga: "banned teal vote dot removed").
  - Right column reads as a generic admin form: uppercase labels right-aligned
    against controls, three same-sized rows (SPEED/CLOCK/MODE), permanent
    "Disabled — type a value." hint before any interaction.
  - "Disabled — type a value." is shown at rest (debug-ish); propose
    input-helper is a standing hint, not a state change.
  - Events feed: raw mono strings, one truncates ("votes and log kept in
    memo…"), no semantic colour, no grouping by kind.
  - Five bordered boxes of equal weight (canvas, status strip, controls,
    events) + shell topbar form a patchwork; bottom edges ragged (right column
    ends ~y790, left ~y1080 at 1440).
  - Status strip duplicates speed with the segmented control; seed hex is a
    developer readout in header.
  - Radius mix: 8px panels vs 6px controls; 1px line tokens consistent.
  - No designed states: paused, election-in-progress, majority-unreachable,
    log conflict (conflictIndex arrives on the wire but is unshown), propose
    accepted, empty events. Crashed node = dimmed disc + coral X only.
  - Selected node ring + h1 copy line + controls (cluster select/seed/reset)
    read unfinished next to the canvas.
- Structure verdict: information architecture (canvas left, control + events
  column right, header controls) holds; execution is inconsistent and states
  are undesigned. Visual-layer rebuild chosen; structure per-region kept
  unless the audit shows it fails.

## Round R001
- Goal: portfolio-finished visual layer via the design freedom brief
  (docs/briefs/BRIEF-raft-finished-quality-1-design.md and its successor
  code brief) — design system + applied system + states + consistency pass.
- Preserved preferences: trim-thesis-copy F001/F002 (no wordy tagline copy);
  chrome-trim F003 (h1 text "A full Raft state machine written in Rust.",
  clamp(1.075rem, 1.6vw, 1.5rem) + coarse 1.075rem, title-left/controls-right
  geometry, site gutters formula).
- Changes: pending chat-model deliverables.
- Before: artifacts/baseline/
- After: —
- Visual inspection: baseline performed (screenshots above).
- Code verification: cargo test 48+6 PASS; shell typecheck PASS.
- Open question: awaiting chat-model deliverable.

## Round R001 (amendment — delegation shape, owner steer)
- Owner: collapse the two planned deliverables (design system, then code) into
  ONE self-contained code deliverable, and switch the relay format to the
  tighter tier-list brief template (TASK / CONTEXT / CURRENT CODE / wiring /
  HARD CONSTRAINTS / OUTPUT CONTRACT with a single fenced response).
- The round R001 delegation is now `docs/briefs/BRIEF-raft-finished-quality-R001-code.md`.
- Depth choice stays an owner-side decision delegated INTO the brief: the chat
  model decides keep-IA vs clean-sheet per region and must disclose it (the
  orchestrator's lean from the baseline audit remains: structure holds,
  execution inconsistent).
- Before/After: unchanged (artifacts/baseline/ vs pending).
- Handoff amendment (owner steer): relaunch the delegation through the
  minimize-iteration2 relay doctrine — telegraphic brief, NO verbatim base
  code in the relay (S12/S19 practice), rough-artifact contract, orchestrator
  integrates/repairs/pairs the code with the real wiring. Active brief:
  `docs/briefs/chat-model-prompt-40-raft-finished-rebuild.md` (relay S25).
  The 1116-line two-file brief was deleted unrelayed; its full contract is
  folded into this ledger + the relay prompt.

## Round R001 (implemented — relay salvage, closes the R001 briefing)
- Goal: portfolio-finished visual layer in one pass; chat-model code (325w
  telegraph relay, prompt 40 v6), salvaged and integrated by the orchestrator.
- Preserved preferences: F001/F002 copy register; F003 h1 frozen block; page
  gutters; teal ban carried from the card-art saga.
- Changes (web/RaftPage.tsx + web/raft.css, full rewrite):
  - Header loses the seed hex; cluster select + Reset right (unchanged);
    lower-case mono labels retire the uppercase form.
  - Demolished the five-box patchwork: status strip and seed line are gone;
    one readout rule over the stage (term / leader / commit / applied /
    quorum, ochre leader value); the stage is a borderless canvas between
    the readout rule and a legend rule; one bordered controls panel; the
    event feed is unboxed and stretches to the stage's bottom edge; a
    footer line carries "seed · clock · paused".
  - Canvas: ring sized to the stage (no more floating); leader ochre disc,
    followers muted outline, candidate solid 2px ring + segmented VOTE RING
    (one arc per voter, lit per vote received -- derived from votedFor+term,
    so a majority is visible mid-election); crashed nodes dimmed with a
    danger ✕; nodes unreachable from the leader dim; messages are chevrons
    (append ochre / vote ink, reply hollow) instead of 3px dots.
  - Log lane per node: one hairline baseline, cells (applied = solid ochre,
    committed = 50% ochre, uncommitted = outline), wider gaps at term
    boundaries, ink tick at the commit boundary; empty log = bare baseline.
  - States: paused prints "paused · t s" on-canvas + footer; propose helper
    silent at rest, reason only after typing, "appended on nX" after
    success; feed wraps (never truncates), kind dots, empty copy "no
    events yet"; whole-page wasm-error panel (frozen h1 + one panel).
  - Orchestrator repairs on the relay code: h1 restored to the frozen
    owner string ("A full Raft state machine written in Rust." — the relay
    dropped "full"); reachability rewritten from a multi-hop BFS to a
    ONE-HOP set (the sim only delivers over direct links; BFS invented
    routing and always cleared quorum on any partition); speed row
    measurements: label column 4.5rem → 3.75rem + seg padding 8 → 6px so
    seg + Pause hold one line at the 1200px cap; dropped the text-input
    hover accent (double ring while typing).
- Before: artifacts/baseline/
- After: artifacts/R001/ (rest 1440/1920/1120, mobile 390, paused, propose
  typed + accepted, node selected, crashed, cut link, majority-unreachable
  with quorum 2/5 + note, election-in-progress with vote segment, whole-
  page error).
- Visual inspection: PERFORMED — all listed states read as images; no
  overflow at 390/1120/1440/1920; event lines wrap instead of truncating.
- Code verification: `npm run typecheck` PASS; `cargo test` 48+6 PASS;
  wasm smoke PASS. NOT verified: real iOS Safari behaviour (1950 policy
  unaffected; native select styled only), reduced-motion run (canvas is
  static per draw already; the only remaining motion is protocol-honest
  message travel), and mobile still uses the fallback select.
- Open question: LIKED / REJECTED on the round (first-time fine view:
  what the cluster is doing reads without the feed; one system across all
  surfaces)?
