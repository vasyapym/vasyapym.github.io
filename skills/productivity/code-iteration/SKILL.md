---
name: code-iteration
description: Implement and refine code through small, evidence-backed verification passes.
disable-model-invocation: true
---

# Code Iteration

Work in bounded passes:
define → inspect → change → verify → review → record.

A pass is VERIFIED only for its declared scope, on the final relevant file
state, with all required checks passing. Verification is not a claim that the
software is bug-free, visually approved, or production-ready.

## Persistent state

Use the project's existing iteration directory if one exists. Otherwise append
pass records to:

`.agent/iterations/code/<task-slug>/passes.md`

Reuse the related design task slug when applicable. Allocate unique pass IDs.
Keep failed and blocked records; append later results rather than rewriting
history into an uninterrupted success story.

## Pass procedure

1. **Establish scope**
   Read repository instructions, relevant code, scripts, tests, and worktree
   changes. Preserve unrelated user work.
   Translate the request into observable acceptance criteria.

   Read the related design ledger when present. Preserve active preferences;
   report conflicts rather than altering its decisions.

   Define:
   - This pass's objective.
   - Required checks for this pass.
   - Broader checks required before the task is complete.

   Use project-native tooling and existing package-manager conventions.
   Ask only about blocking ambiguity or necessary authorization.

2. **Capture the baseline**
   Run available relevant checks before editing.
   Record existing failures and environmental limitations.
   For a bug, reproduce it and preferably add a regression test that fails for
   the expected reason before applying the fix.

   If baseline execution is unavailable, say so. Do not later assert that a
   failure was pre-existing without evidence.

3. **Make the smallest coherent change**
   Implement one goal-scoped change using repository conventions.
   Add or update behavioral tests for the changed contract, including relevant
   edge and failure cases.
   Avoid unrelated refactors, dependency upgrades, and generated-file churn.

4. **Execute verification**
   Run focused tests and required formatting, lint, type, build, integration,
   or runtime checks as applicable to the declared scope.
   For interaction changes, include relevant browser or runtime smoke checks.
   Visual acceptance remains separate and belongs to `design-iteration`.

   Record exact commands, exit status, meaningful output, and evidence paths.
   Confirm that the intended tests actually ran. Exit code zero with no relevant
   tests discovered does not demonstrate the requested behavior.

5. **Inspect the final diff**
   Check for unintended changes, missing tests, debug scaffolding, accidental
   secrets, compatibility issues, and inconsistencies with acceptance criteria.

   Any subsequent code, configuration, dependency, or test edit invalidates
   affected verification results. Rerun the affected checks before claiming
   verification.

6. **Repair or stop**
   When a required check fails, diagnose the cause, make a focused correction,
   and execute the relevant checks again.
   Do not repeat an unchanged failing command without a reason.

   Default to at most three unsuccessful repair attempts for the same blocker.
   Stop earlier for missing permissions, unavailable infrastructure, unsafe
   side effects, or ambiguous requirements. Report the evidence and the
   smallest useful next action.

7. **Close the pass and task**
   Append the pass record after its outcome is known.
   When implementation is complete, run the declared final regression checks
   and project-prescribed checks on the final relevant file state.

   A verified narrow pass does not establish task completion. Close the task
   only when its acceptance criteria and final required checks are satisfied.

## Verification rules

- Use VERIFIED only when every required gate for the stated scope passed.
- Use FAILED when a required check ran and failed.
- Use BLOCKED when a required check could not run or lacks necessary evidence.
  Report any observed failures alongside the blocker.
- Label individual unexecuted checks NOT RUN. Use NOT APPLICABLE only with a
  concrete reason.
- Existing failures remain visible. A required failing gate cannot be called
  passed merely because the failure predates the change.
- Do not remove required gates just because they fail or are inconvenient.
  Any agreed scope reduction must be explicit in the record and final report.
- Do not disable tests, weaken assertions, suppress errors, or blindly replace
  snapshots to manufacture a green result. Legitimate expectation changes must
  follow the requested behavior and be explained.
- Do not use destructive cleanup, discard unrelated changes, deploy, or touch
  production merely to obtain verification. Use safe test environments.
- If execution tools are unavailable, provide proposed code or a patch and
  exact suggested commands labeled NOT RUN. Do not claim files were changed
  or checks executed when they were not.
- Close a finished task by shipping it: once a task ends with accepted,
  verified changes, stage only your own files and commit and push them in the
  same session without waiting for an explicit request. Mid-task or
  speculative commits wait for the user; stop and report failures, conflicts,
  or missing authentication instead of forcing a delivery operation.

## Pass record

Append a block like:

```markdown
## Pass C001 — VERIFIED | FAILED | BLOCKED
- Objective and scope: <observable outcome>
- Acceptance criteria: <criteria covered by this pass>
- Changes: <files and behavioral changes>
- Baseline: <observed state; known failures; unavailable checks>
- Verification:
  - Command: `<exact command>`
    Result: <PASS / FAIL / NOT RUN; exit status when available>
    Evidence: <relevant output or log path>
  - Manual/runtime check: <actual procedure and observed result, if applicable>
- Final diff review: <performed review and findings>
- Design constraints: <relevant ledger IDs or not applicable>
- Remaining risks/blockers: <specific gaps or none>
- Next action: <next pass, requested input, or task complete>
```

Do not include secrets in recorded commands or output.

## Project graph

Where the project keeps a project graph (`.project-history/graph.jsonl`, via
`scripts/project-graph`), recording is unconditional, never optional: if no
graph exists, run `project-graph init` first instead of skipping the record.
Start every session with `project-graph head --actor code-iteration`; claim any
handoff addressed here with `project-graph ack <hid> --actor code-iteration`,
and close it via `--via-handoff <hid>` on the pass's first appended node. After
each coherent pass, append an `iteration` node with a `git-commit` artifact and
the checks and pass outcome in `--meta`, chained with `--continues-from`. When
a pass surfaces a visual concern that wants its own feedback round rather than
more code changes, offer it explicitly: `project-graph handoff --to
design-iteration --from-node <node>`. Never edit the JSONL by hand — record
only through the CLI.

## Response format

Report:
- What changed.
- Pass outcome and verification scope.
- Checks actually run and their results.
- Remaining failures, unexecuted checks, and risks.
- Whether the task is complete or blocked, with the next action.
- Pass-record location.

Keep command proposals visibly separate from executed verification evidence.
