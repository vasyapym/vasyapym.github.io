# STATE — repo baseline after the workflow-sustainability pass (2026-09-14)

Read this first. One screen; everything else is pointed to, not copied.

## Now — where each active project stands

- **main page** (`portfolio/shell`) — ink catalogue hero + 6-project rail (n140); opt-in Dark Souls realm over untouched catalogue (n149); realm shipped through r21 (n222), threshold "the same seven" (n180); owner device checks pending (Open threads 4).
- **kitty-run** — ashen qualitative R1–R6 shipped (n84–n87); cap R007 shipped then owner-rejected ("a mess", n129/F009); accessory redesign LIKED through the dmca-redesign ledger — card R031 (F033), rig R032 (F035), nothing pending; knight direction awaits owner steer (n80: five-being rigs rejected, no partial keep).
- **evening-forest** — all-tonal rewrite integrated (n33: Dm→Bb→F→C, no noise beds); owner real-device listen-pass pending.
- **spine** — "The Seventh" card mark shipped (n10, `1373911`).
- **explosion** — three modes shipped (n28–n31); dormant.
- **practice-map** — deep-lesson reader + shadow-typing live (n35); next lesson-pair migration pending.
- **planck-to-now** — fates feature PARKED (n26: all four fates black, scope creep); full code + design doc parked in `parked-fates/` (n28, branch `fates-parked-v1`); B1/B2 briefs kept as the return roadmap.
- **raft-cluster, code-layout** — shipped, no open threads.

## Open threads

1. kitty-run knight direction — owner steer pending; chase stale handoff **h3** (acknowledged, never closed), don't fork around it.
2. evening-forest — owner listen-pass pending (n33).
3. main page hero — 3×2 catalogue held through 900–1199px (n148, brief 11 REFINE); owner look pending.
4. main page realm — owner device checks pending; the per-round lists live in `docs/briefs/ROUNDS.md` (r8–r19 rows): iOS/macOS Safari bands, iOS close glyph under Dynamic Type + safe area, iPhone exit cards, proximity greet feel, project-backed flood feel, doors 6–7 reach, side-flip feel, reduced framing snap.
5. practice-map — migrate next deep-lesson route pair; owner re-checks shadow-typing on a real iPhone (n35).

## Protocols (unchanged by compaction)

- Project graphs stay **append-only**: never edit or delete lines; corrections are new events. Node ids are permanent (commit messages reference them).
- **No auto-record hook** (removed 2026-09-14): a session records **one** node with a `git-range` artifact at close; no commit exists purely to carry graph bookkeeping. Summaries ≤ 200 chars at write time.
- The ledger is an append-only mailbox; `node scripts/ledger-gc.mjs` prunes entries older than ~14 days at each checkpoint. Briefs are deleted once their outcome is recorded; binaries and probes stay untracked (see CLAUDE.md "Artifact hygiene").
- Keep delivery separate from implementation; `git pull --ff-only origin main` at session start (use `/usr/bin/git` for network operations on this machine).

## Where things live

- Graphs: `portfolio/.project-history/graph.jsonl` + `portfolio/projects/<id>/…` (9 files; CLI: `node scripts/project-graph/bin/project-graph.js …`).
- Design record: `docs/portfolio-redesign-handoff.md`; brief lifecycle + per-round outcomes: `docs/briefs/` + `docs/briefs/ROUNDS.md`; handoff archive: `docs/archive/handoffs/`; iteration ledgers: `portfolio/projects/<id>/.agent/iterations/`.
- Repo root keeps ONLY open kitty-run direction round inputs (bare-name graph refs).

## Checkpoint record

Second checkpoint 2026-09-10 (first: 2026-09-06, `cfcb7196`); raw pre-compaction state retrievable at git `cfcb7196` and `4d90bff`. Compaction policy now lives in `docs/agents/project-graph.md` §Compaction checkpoints: a checkpoint is a git tag + one milestone node per compacted graph — no relay brief files. Fold semantics verified: 0 structural diffs across all 9 graphs.
