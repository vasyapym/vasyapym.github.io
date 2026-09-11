# STATE — repo baseline after the second compaction checkpoint (2026-09-10)

Read this first. One screen; everything else is pointed to, not copied.

## Now — where each active project stands

- **main page** (`portfolio/shell`) — ink catalogue: type-led hero + 6-project rail (n140); opt-in Dark Souls realm over untouched catalogue (n149), r8 shipped (n181), threshold "the same seven"; owner look/device checks pending. Raft landing mark: "shift-register ripple" (n129).
- **kitty-run** — ashen Dark Souls Round B shipped (`7ef6381`); ashen qualitative pass R1–R6 shipped (n84–n87: knight material truth, round sun, monumental skyline, damped spaulders, comb helm). Knight direction awaiting owner steer (n80: five-being rigs rejected, no partial keep; plumbing lessons preserved).
- **evening-forest** — all-tonal rewrite integrated (n33: Dm→Bb→F→C, no noise beds); owner real-device listen-pass pending.
- **spine** — "The Seventh" card mark shipped (n10, `1373911`).
- **explosion** — three modes shipped (Ember Lantern GPGPU + Ink Shockwave + Cinder Fault, n28–n31); dormant.
- **practice-map** — deep-lesson reader live; next lesson-pair migration pending.
- **planck-to-now, raft-cluster, code-layout** — shipped, no open threads.

## Open threads

1. kitty-run knight direction — awaiting owner steer; chase stale handoff **h3** (acknowledged, never closed), don't fork around it.
2. evening-forest — owner listen-pass pending (n33). Uncommitted evening-forest + CLAUDE.md working-tree changes belong to other sessions — leave them alone.
3. main page — hero 3×2 catalogue held through 900–1199px (n148, brief 11 REFINE); owner look pending. Row-01 title wraps within its 44px row at ≤~1040px (within delivered design; noted in ROUNDS).
4. main page realm — r8 shipped (n181); owner checks pending: **iOS/macOS Safari bands incl. /art-directions nav, iOS surface-flash re-check, iOS close-glyph on a real device, real-device touch follow-feel, low-power**. r9 shipped (n183, two relayed deliverables): the iPhone exit "cards black → reappear" staged away (canvases retired at layer opacity 0 with body locked/shell inert → nested-rAF beats separate unlock from release inside the 150ms settlement; bounded post-release artwork refresh); the iPhone close-X "misplacement" verified as scroll ownership (the real 34px safe-area inset overflows the 48% sheet; the X was absolute inside the scrolling wrapper; Blink's zero inset masked it) → stationary wrapper frame + keyed inner scroll body (copy never runs under the control; dive pinned via margin-top:auto; panel bg kept at the abyss #04080b); proximity greetings shipped (nearest-entry, 25% exit hysteresis, drop-on-busy single-slot arbitration, silent — audio stays selection-owned, tap/legend unchanged). Probe 50→56 gates; tsc clean, build ok, probe all green ×3. New device checks: no black cards on exit, X placement under Dynamic Type + safe area, proximity greet feel.
   - Threshold verdict trail (r2 n152–n154; r3 n156–n157/n159/n161; r4 n163–n174+): recessed sill "good but boring" → five geometry props rejected/banned → conserved count provisional → margin-grid rejected as templated → five crafted variants → two-blacks picked/refined → **"the same seven" shipped**. Framed/rounded-card follow-through (n176, `e36fe41`) owner-REJECTED for mismatched gutters → redone to span shell exactly (100% width, margin-block only; redo in peer `c3f2046`, ledger 2026-09-10) → framed-card direction owner-REJECTED: **"keep lines, lose the card."**
   - r7 **COMMITTED** (n180, `2e9a408`; `docs/briefs/BRIEF-realm-r7-threshold-lines.md`): soft-ended hairline + rounded abyss footing, **no frame**; compact/minimal band, open sides, top/bottom corners only, no section radius. In-flow between hero/cards: "the same work, 07 works" on page black; "beneath the surface. 07 doors" on bridged local `#080f12`; abyss `#020609` reserved for realm/page-end floor. Unbounded 19px lowercase; `/ enter the deep` is the unboxed two-tone boundary-seam mask. Compact 128px/144px rhythm; 40px ::after top stroke tapers at rounded ends; lower silhouette uses full bottom radius. Focus: bright ochre + double underline. Only "doors" settles 3px on reveal; settled by default, animation gated to no-preference.
   - r6 fixes retained (n177): persistent-panel closed state, mobile pinned sheet and `.realm-exit-layer` restored; Safari cannot-close/desktop preopened blank-card regressions closed. Symmetric inline-SVG close glyph; entry semantically unavailable, not dimmed; envelope owns exit reveal (Edge text-snap fixed). Critically damped lantern, mobile camera dead zone, reduced wake/dye and energy-normalized overlapping phosphor chords preserve single-trace drags. r8: guarded hero-exit effect + removed floor opacity override fix exit tone snap; chip uses finite 360ms fade/rise (reduced motion settled). Direct dive: two qualified quick mouse releases via confirmDive, desktopFine-only, 320ms/8px window, same creature; narrow-sheet bypass + click-capture consumption. Bare-layer Enter dives open selection/nearest; aria-live updated; confirmDive latches phaseRef. iOS close-X mounts only with content, closed-state display:none backstop; wrapper/entrance focus unchanged.
   - Validation: tsc clean, build OK, **50 probe gates green ×3**, shots reviewed. Gates poll (`until`); nav uses domcontentloaded + mount wait, not networkidle0 (n179). Standing owner process: chat-model briefs grant **full design/code autonomy**, no per-decision approvals, with a **shown deep-reasoning chain: restate → 5+ directions → prune with criteria → develop to depth → stress-test → rank → commit**.
   - r12 COMMITTED (n190; `docs/briefs/BRIEF-realm-r12-direct-deep-return.md`): the deep-return transition now begins on the project page (owner report on 26bad24: no intermediate redirect). App-level restored realm over the still-mounted project in an inert wrapper; RealmMode one-shot `onEntered` observes the scene's existing settled phase; `replaceState('/')` + landing swap (externalRealmOpen, guarded initializer + suppressed mount — one dialog) happen under the opaque cover; the landing's existing exit choreography is invoked before the tree swap; normal tree wrapped in Fragments so the project/landing instances survive the swaps. Probe 98→105 gates; tsc clean, build ok, all green ×3. Device checks: iPhone project-backed flood feel, browser-swipe Back, URL swap under ink, VoiceOver.
5. practice-map — migrate next deep-lesson route pair (Pass 21 ledger note).

## Protocols (unchanged by compaction)

- Project graphs stay **append-only**: never edit or delete lines; corrections are new events. Node ids are permanent (commit messages reference them). Each graph carries a `milestone` node marking each compaction checkpoint; raw pre-compaction logs are retrievable at git `cfcb7196`.
- The ledger (`.agents/agent-ledger.json`) is an append-only mailbox — never rewrite another agent's entry.
- Keep delivery separate from implementation; `git pull --ff-only origin main` at session start (use `/usr/bin/git` for network operations on this machine).

## Where things live

- Graphs: `portfolio/.project-history/graph.jsonl` + `portfolio/projects/<id>/.project-history/graph.jsonl` (9 files; CLI: `node scripts/project-graph/bin/project-graph.js …`).
- Design record: `docs/portfolio-redesign-handoff.md` (compacted; ALL 52 headings/anchors byte-identical to pre-compaction).
- Brief archive: `docs/briefs/` + `docs/briefs/ROUNDS.md` (one line per brief: outcome/verdict; orphans flagged). Graph-referenced state docs in `docs/`: `HANDOFF-ashen-live-refinement.md` (live character law), `HANDOFF-ashen-dusk-refinement.md` (superseded stub), `HANDOFF-explosion-chain.md`, `hero-saga-handoff.md`.
- Handoff archive: `docs/archive/handoffs/` (raw pre-compaction handoffs).
- Repo root keeps ONLY open kitty-run direction round inputs (bare-name graph refs): ashen/knight BRIEF series, `CONCEPT-kitty-run-ashen-five-reimaginings.md`, `HANDOFF-kitty-run-rollback.md`, `BRIEF-kitty-mark-redraw-neutral.md`, `BRIEF-card-artwork-iteration-2.md`.
- Completed card-art briefs (tracked): `docs/briefs/BRIEF-card-art-*.md`.

## Checkpoint record

Second checkpoint: milestone node appended per graph this round (kind=milestone, actor=user); first-checkpoint node `compaction-cfcb7196` retained. Raw pre-compaction state retrievable at git `cfcb7196` (first checkpoint) and at git `4d90bff` (pre-second-checkpoint HEAD). Compaction round briefs: `docs/briefs/BRIEF-compaction-round*.md`. Fold semantics must be verified: 0 structural diffs across all 9 graphs; the CLI (`log`/`head`/`show`) reads the compacted stores unchanged.
