# BRIEF — Compaction round 5: main-page graph node summaries, second checkpoint pass (policy locked)

Inputs (n148–n182 verbatim, incl. their pre-compaction summary texts) are NOT duplicated here — they are retrievable at git `4d90bff` (and in graph history at `cfcb7196`-lineage commits). This file records the policy and coverage only.

## Policy (as delivered to the chat model)

- Second pass of the "Compaction Checkpoint" milestone; first checkpoint = 2026-09-06 (`cfcb7196`), which compacted everything before n148.
- Two bloat shapes: (1) code-iteration/design-iteration/milestone nodes with giant summaries (600–2300 chars) → compact; (2) user auto-record nodes with empty summaries and commit-duplicating titles → shrink title to a short label (≤120 chars, keep feat/fix/test prefix), never move narrative into newSummary.
- KEEP: verdict/decision state (adopted/rejected/pending, both states if the trail matters); quality-gate result (one clause, meta carries it); lessons/hard constraints (root causes, laws, accumulated bans); unresolved open threads; prose-only durable pointers (shas, anchors) in one clause.
- DROP: step-by-step implementation narration; parameter-by-parameter retune lists; mood commentary (keep decision quotes in one clause); rationale duplicated in briefs/meta; "not committed yet" boilerplate; probe-flake stories (keep infrastructure laws like n179's as a title lesson).
- Cross-node: shared context lands in the EARLIEST carrier; later nodes shrink to delta. Auto-record round-closers become stubs.
- Standing process honored: full wording autonomy within the contract + shown deliberation (≤12 lines) before output, then `---OUTPUT---` and one `{"id","newSummary","newTitle"?}` JSONL line per node in order.

## Coverage

Main portfolio graph, post-first-checkpoint nodes: n148–n182 (35 nodes, realm saga r1–r8).

## Integration notes

- n176 newTitle adjusted at integration: "(n178 context)" → "redo swept into r6 commit c3f2046" (verified from ledger note 2026-09-10).
- Verified: 0 structural diffs (ids, edge count 171→171, non-target fields byte-equal); 137,440 → 112,783 bytes; CLI log/head reads compacted store.
