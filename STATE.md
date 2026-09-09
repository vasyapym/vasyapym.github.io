# STATE — repo baseline after the compaction checkpoint (2026-09-06)

Read this first. One screen; everything else is pointed to, not copied.

## Now — where each active project stands

- **main page** (`portfolio/shell`) — ink catalogue shipped; type-led hero + 6-project rail finalized (main graph n140). The realm shipped on top (n149): opt-in Dark Souls layer over the untouched catalogue. Card-art saga closed: Raft landing mark = "shift-register ripple" (n129).
- **kitty-run** — ashen Dark Souls era, Round B shipped state (`7ef6381`). Knight direction OPEN (n80: five-being rigs rejected, no partial keep; plumbing lessons preserved there).
- **evening-forest** — all-tonal audio rewrite integrated (n33: Dm→Bb→F→C score, no noise beds); owner real-device listen-pass pending.
- **spine** — "The Seventh" card mark shipped (n10, commit `1373911`).
- **explosion** — two modes shipped (Ember Lantern GPGPU + Ink Shockwave), dormant since Sep 4 (n25–n27).
- **practice-map** — deep-lesson reader live; next lesson-pair migration pending.
- **planck-to-now, raft-cluster, code-layout** — shipped, no open threads.

## Open threads

1. kitty-run knight direction — awaiting owner steer; stale handoff **h3** (acknowledged, never closed — chase it, don't fork around it).
2. evening-forest — owner listen-pass pending (n33). The working tree holds uncommitted evening-forest + CLAUDE.md changes from other sessions — leave them alone.
3. main page — hero 3×2 catalogue now held through 900–1199px (n148, brief 11 verdict REFINE); owner look pending — row-01 title wraps inside its 44px row at ≤~1040px viewports (within the delivered design; noted in ROUNDS).
4. main page realm — r2 (n152–n154) then r3 (n156–n157, n159): entry chip → owner-chosen "threshold bar" with always-findable visibility law, then owner verdict "visually noisy" → **fore-edge tab** (vertical right-edge tab, 44×188, page-coloured surface + 1px rule, no ochre at rest) with an "ink breath" letters cycle (0.82→0.95 / 5.6s, stopped on intent; ochre reserved for hover/focus/press); iOS bugs fixed (surface flash = declarative dark document backdrop; bottom sheet = visualViewport tracking + 48% cap). Probe 31/31 + tab acceptance. Owner real-device checklist pending (iPhone: flash absence, sheet anchoring, 2560×1440 tab visibility, breath feel).
5. practice-map — migrate the next deep-lesson route pair (Pass 21 ledger note).

## Protocols (unchanged by compaction)

- Project graphs stay **append-only**: never edit or delete lines; corrections are new events. Node ids are permanent (commit messages reference them). Each graph carries one `milestone` node marking the compaction checkpoint; raw pre-compaction logs are retrievable at git `cfcb7196`.
- The ledger (`.agents/agent-ledger.json`) is an append-only mailbox — never rewrite another agent's entry.
- Keep delivery separate from implementation; `git pull --ff-only origin main` at session start (use `/usr/bin/git` for network operations on this machine).

## Where things live

- Graphs: `portfolio/.project-history/graph.jsonl` + `portfolio/projects/<id>/.project-history/graph.jsonl` (9 files; CLI: `node scripts/project-graph/bin/project-graph.js …`).
- Design record: `docs/portfolio-redesign-handoff.md` (compacted; ALL 52 headings/anchors byte-identical to pre-compaction).
- Brief archive: `docs/briefs/` + `docs/briefs/ROUNDS.md` (one line per brief: outcome/verdict; orphans flagged). Graph-referenced state docs live in `docs/`: `HANDOFF-ashen-live-refinement.md` (the live character law), `HANDOFF-ashen-dusk-refinement.md` (superseded stub), `HANDOFF-explosion-chain.md`, `hero-saga-handoff.md`.
- Handoff archive: `docs/archive/handoffs/` (raw pre-compaction handoffs).
- Repo root keeps ONLY the open kitty-run direction's round inputs (bare-name graph refs): the ashen/knight BRIEF series, `CONCEPT-kitty-run-ashen-five-reimaginings.md`, `HANDOFF-kitty-run-rollback.md`, `BRIEF-kitty-mark-redraw-neutral.md`, `BRIEF-card-artwork-iteration-2.md`.
- Completed card-art briefs (tracked): `docs/briefs/BRIEF-card-art-*.md`.

## Checkpoint record

Milestone node `compaction-cfcb7196` appended to every graph (kind=milestone, actor=user). Pre-compaction raw state: git `cfcb719609efafcfe43512b92782128b8607e2b5`. Compaction round briefs: `docs/briefs/BRIEF-compaction-round*.md`. Fold semantics verified: 0 structural diffs across all 9 graphs; the CLI (`log`/`head`/`show`) reads the compacted stores unchanged.
