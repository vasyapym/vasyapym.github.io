---
name: design-iteration
description: Refine interfaces through visual feedback rounds against an append-only liked/rejected ledger.
disable-model-invocation: true
---

# Design Iteration

Work in focused rounds:
observe → change → render → inspect → present → record feedback.

## Operating rules

- Use explicit user feedback as the authority for LIKED and REJECTED decisions.
  Never turn your own aesthetic judgment into a user preference.
- Preserve active liked details. Do not reintroduce active rejected treatments
  in the same scope without explicit reconsideration.
- Scope preferences narrowly: element, property, viewport, and interaction state.
  Rejecting one composition does not imply rejecting every technique it uses.
- Keep visual inspection, functional verification, and user approval separate.
- Default to one presented round, then wait for feedback. Produce multiple
  alternatives or autonomous rounds only when requested, within a stated limit.
- Follow project instructions and avoid unrelated redesigns or refactors.
- Close a round by shipping it: once the round's changes are accepted, stage
  only your own files and commit and push them in the same session without
  waiting for an explicit request. Mid-task or speculative changes wait for
  the user; stop and report failures, conflicts, or missing authentication
  instead of forcing a delivery operation.

## Persistent state

Use the project's existing iteration directory if one exists. Otherwise use:

- `.agent/iterations/design/<task-slug>/ledger.md`
- `.agent/iterations/design/<task-slug>/artifacts/R<nnn>/`

Reuse a stable task slug across sessions. Allocate IDs from existing records;
never restart numbering or overwrite an earlier round's artifacts.

The ledger is the historical source of truth. Optional summaries are derived
views and must not replace it.

## Round procedure

1. **Resume and reconcile**
   Read the brief, relevant implementation, references, and existing ledger.
   Append any new explicit feedback before planning another round.
   Reconstruct active preferences, applying explicit supersession events.
   Ask only about blocking ambiguities or unresolved preference conflicts.

2. **Establish the visual baseline**
   Inspect the current rendered result at the relevant viewport and state.
   Preserve the screenshot or supplied reference.
   For a new design, render the first candidate as the initial baseline.
   Record concrete observations rather than unsupported judgments.

3. **Choose a focused hypothesis**
   State the desired improvement and the small set of changes intended to
   produce it. Identify which liked details must remain unchanged and which
   rejected details the round addresses.
   Avoid changing several unrelated design dimensions at once.

4. **Implement and inspect**
   Render the changed result. Compare before and after using matching viewport,
   scale, content, and interaction state; disclose unavoidable differences.
   Inspect the actual image, not merely the source code.
   Check relevant hierarchy, spacing, typography, contrast, overflow, responsive
   behavior, and interaction states.

   When code changes, use `code-iteration` if available; otherwise run relevant
   project checks. Passing code checks does not establish visual approval.

   If rendering or image inspection is unavailable, mark the result
   `NOT VISUALLY VERIFIED`. Provide provisional work if useful and request the
   missing screenshot or access. Never invent visual observations.

5. **Present the round**
   Append the round record, then show or link the actual artifacts.
   Explain what stayed, what changed, and the main unresolved tradeoff.
   Ask a focused question inviting liked/rejected feedback.
   Do not describe the round as approved unless the user approved it.

6. **Record feedback and continue**
   Split mixed feedback into atomic decisions.
   Record explicit preferences from the brief or subsequent feedback, including
   their source and scope. Keep your recommendations outside preference records.
   Continue from the active ledger, not from memory.

   On explicit approval, stop redesigning and hand off the approved artifact,
   active constraints, verification status, and remaining implementation work.

## Append-only ledger

Append complete Markdown blocks using append operations. Never rewrite, delete,
sort, reformat, or silently correct existing records.

Use a round block like:

```markdown
## Round R001
- Goal: <specific improvement>
- Preserved preferences: <feedback IDs or none>
- Changes: <focused changes>
- Before: <artifact/reference>
- After: <artifact/reference>
- Visual inspection: <performed checks and observations, or NOT RUN>
- Code verification: <evidence reference, failures, or NOT RUN>
- Open question: <feedback needed>
```

Append each preference separately:

```markdown
## Feedback F001
- Round: R001
- Verdict: LIKED | REJECTED
- Scope: <element/property, viewport, state>
- Decision: <specific detail to preserve or avoid>
- User source: <quote or faithful paraphrase tied to the relevant message>
- Artifact: <artifact/reference being evaluated, if available>
- Supersedes: <feedback IDs or none>
```

Ledger invariants:

- Silence, test success, and your own review are not approval.
- Historical LIKED/REJECTED records remain unchanged after a reversal.
- Record an explicit reversal or correction as a new event referencing the
  affected IDs. Apply supersession only within its stated scope.
- If the user withdraws a preference without adopting its opposite, append a
  withdrawal event with target IDs and user source; do not invent a new verdict.
- Do not resolve ambiguous contradictions by silently preferring the latest
  wording. Clarify the conflict.
- If an existing ledger cannot be read safely, report the problem rather than
  recreating it and losing history.

## Project graph

Where the project keeps a project graph (`.project-history/graph.jsonl`, via
`scripts/project-graph`), keep it in step with the ledger — unconditionally,
never optionally: if no graph exists, run `project-graph init` first instead of
skipping the record. Start every session with
`project-graph head --actor design-iteration`; claim any handoff addressed here
with `project-graph ack <hid> --actor design-iteration` before working, and
close it via `--via-handoff <hid>` on the round's first appended node. When a
round completes, append an `iteration` node whose artifacts point at the new
round block and relevant commits, chained with `--continues-from`; a replaced
direction appends a `decision` node plus a `supersedes` edge carrying the
rejection reason. When the next round needs implementation-sized code work,
offer it explicitly: `project-graph handoff --to code-iteration --from-node
<node>`. Never edit the JSONL by hand — record only through the CLI.

## Response format

Report:
- Round ID and visual artifacts.
- Kept / changed / unresolved.
- Checks actually performed and limitations.
- The specific feedback needed, or explicit approval and handoff status.
- Ledger location when created or updated.
