---
name: bug-iteration
description: Fix a reported bug — especially one that has returned after a previous fix — by reproducing it, diagnosing the root cause rather than the symptom, gating every change behind a regression test, stating exactly what was and wasn't verified, and closing with a compact pass report.
---

# bug-iteration

Use this skill whenever you are handed a bug report, a failing test, a "this broke again" message, or a ticket that was previously marked fixed. One pass produces one fix, one regression gate, and one report. If the bug is not fully resolved, the report says so and the next pass starts from the report.

**Delegate the thinking, never the gates.** Reasoning-heavy diagnosis and fix design may be relayed to an external model through a self-contained brief, but the agent owns and personally runs: the history search, the reproduction, the regression gate, the verification commands, and the recording. Every relayed deliverable is integration-checked (typecheck, build, probes) before it counts as done.

## Principles

1. **Reproduce before you touch anything.** A fix for a bug you cannot reproduce is a guess. If reproduction is impossible in your environment, say so explicitly and treat everything downstream as hypothesis — and name the environment where it CAN be reproduced.
2. **Fix the cause, not the crash site.** The line that throws is rarely the line that is wrong. Trace backward until you can explain *why* the bad state existed, not just *where* it was noticed.
3. **A returning bug is two bugs.** The original defect, and the defect in the previous fix or its test coverage. Diagnose both. If the same symptom recurs through different mechanisms, the gate must cover the symptom class, not the last mechanism.
4. **Every fix ships with a gate.** A regression check that fails before the fix and passes after it. No exceptions. If a check is genuinely impossible, the report must say why and what you did instead.
5. **Do not overstate evidence.** Separate what you observed from what you inferred from what you did not check. The report's credibility depends on this more than on the fix itself.
6. **Small, reversible changes.** Prefer the narrowest fix that addresses the root cause. Do not refactor, rename, or "clean up" in the same pass unless the fix or the gate requires it.
7. **Scale the ceremony, never the gate.** A trivial first-time bug compresses the loop to: root cause in two lines, fix, gate, record. A recurring or engine-dependent bug gets the full loop. No bug skips the gate.

## Procedure

### 1. Intake

Restate the bug in one or two sentences: expected behavior, actual behavior, and the conditions under which it appears. If the report is ambiguous, list the possible interpretations and pick the most likely one — note the choice.

Then search the history BEFORE diagnosing: the project's history log (graph nodes), prior brief documents, and git log for the affected files. If a prior fix exists, read its reasoning, not just its diff. Ask: did the previous fix ever work, or did something else regress it? These lead to different diagnoses. Also ask whether any existing check should have caught this — and if one existed, why it didn't (wrong assertion, wrong fixture, skipped, wrong engine, never run).

### 2. Reproduce

Produce a minimal, deterministic reproduction, preferred forms in order: a failing automated check in the project's existing tooling; a script or command that fails reliably; a documented manual sequence with observed output. Record the exact command and failure output. If the bug is intermittent, record the rate and the conditions that increase it.

When the symptom is device- or engine-specific (cursor behavior, font fallback, safe areas, text sizing, touch quirks), your headless environment may be structurally incapable of reproducing it. Then the reproduction IS the owner's device check: write the exact repro steps for the human, hand them over, and mark the fix as unverified until they report back. Do not commit a "FIXED" claim on evidence your environment cannot produce.

### 3. Diagnose the root cause

Work from the observed failure backward: identify the bad value, state, or ordering at the failure point; find where it was produced; repeat until you reach a decision that was wrong, missing, or based on a false assumption. Write the causal chain in plain language ("X calls Y with an empty list because Z returns early when the config key is absent; the default was removed in commit abc123").

Check the diagnosis against the evidence: does it explain every symptom, including the conditions under which the bug does NOT occur; does it explain why the previous fix was insufficient; can you break the chain and watch the reproduction pass. If it explains only some symptoms, you have not found the root cause yet, or there is more than one bug — say which.

Label every claim: **Confirmed** (directly observed — debugger, log, check output, code you read), **Inferred** (follows logically from confirmed facts), **Assumed** (proceeding without evidence).

### 4. Fix

Make the smallest change that breaks the causal chain at the root. Before editing, ask: is this the earliest point where the fix belongs, or am I patching a downstream symptom; will behavior change for callers or inputs NOT in the report (list them); does the previous fix need to be reverted, kept, or reconciled.

**Yesterday's cure is today's suspect.** Audit the guards, fallbacks, and "robustness" helpers already around this code — many regressions are earlier fixes firing on a path they were never designed for. Do not add defensive checks that mask the failure without addressing why the bad state arrived; if you must add a guard, also fix the source or document why the source cannot be fixed in this pass.

### 5. Regression gate

Add or update a check that:

- **Fails on the code before the fix** — verify by running it against the unfixed code (stash, run, unstash; or check out the prior commit).
- **Passes on the code after the fix.**
- Exercises the actual root cause, not just the original symptom. If the bug was "crash when list is empty" but the root cause was "config default removed," the test covers the config path.
- Is deterministic. No sleeps, no real network, no test-order dependence; if the bug was a race, force the interleaving.
- References the bug by name or comment so a future reader knows why it exists.

For a returning bug, also fix or replace the check that failed to catch the recurrence.

**Triage pre-existing failures before attributing them.** When a check fails after your change, re-run it on the pre-change tree. If it fails there too, it is pre-existing — record it as such, do not let it block the fix, and do not silently claim your change is innocent without this comparison.

Then run the broader suite for the affected module (or the full suite, whichever is feasible) and record what you ran and the result.

### 6. Verify against the original report

Return to the intake statement. Re-run the original reproduction (not just your new gate) and confirm the reported behavior is gone. Check each reported scenario and record which you verified.

State the evidence tier honestly: a headless/automated check proves what its engine can see and nothing more. If the symptom lives on a real device or another engine, the fix remains PARTIALLY FIXED with an explicit owner device-check handoff until the human confirms.

### 7. Record

Append one node to the project's history log per pass: the commit reference, the mechanism, the gate, and the evidence tier reached. The next recurrence must start from evidence, not archaeology.

### 8. Report

End every pass with the compact report below. A reader should judge the fix in under a minute; do not pad it with process narration.

## Pass report template

```
## Bug: <one-line restatement>

**Status:** FIXED | PARTIALLY FIXED | NOT FIXED | COULD NOT REPRODUCE

**Reproduction:** <command, test name, or owner device-check steps> — <fails before / passes after>

**Root cause:** <one to three sentences, the causal chain>

**Why it came back** (if recurring): <what the previous fix missed, or what regressed it>

**Change:** <files touched, one line each; what the change does>

**Regression gate:** <check name(s)> — confirmed failing on <ref> and passing on <ref>

**Evidence tier:** <automated check> | <owner device check pending/done>

**Verified:** <things you directly observed>

**Not verified:** <things you did not test, and why — non-empty unless you genuinely tested everything relevant>

**Assumptions:** <anything the fix depends on that you did not confirm; "none" if none>

**Risk / side effects:** <callers or inputs whose behavior changed; "none identified" only if you looked>

**Next pass** (if not FIXED): <the single most useful thing to do next>
```

Status is FIXED only when the root cause is addressed, the gate is in place and confirmed at the tier where the symptom lives, and the original reproduction passes. Otherwise PARTIALLY FIXED or NOT FIXED. Never write "should work" without a matching entry under Verified. If you could not reproduce, the report still has value: what you tried, what you learned, what would let the next person reproduce it.

## Anti-patterns to refuse

- Marking a bug fixed because the symptom went away without knowing why.
- A try/except, null check, or retry around the failure site as the whole fix.
- Writing a regression check after the fix without confirming it fails on the old code.
- Skipping or deleting a failing check without explaining why it was wrong.
- Claiming a suite passed when you ran a subset.
- Attributing a pre-existing failure to your change — or calling your change innocent — without the pre-change-tree comparison.
- Committing a device-specific fix as FIXED on headless-probe evidence alone.
- Silently widening scope into refactoring or unrelated fixes.
- Reporting an inference as an observation.

## When to stop and ask

- Reproduction requires credentials, data, or environments you do not have.
- The root cause is in a dependency, a different service, or code you are not permitted to change.
- The correct fix requires a behavioral decision (which of two conflicting requirements wins).
- The previous fix was made deliberately for a reason you cannot see, and reverting it may reintroduce something else.

In each case, produce the report with the appropriate Status and a specific question under Next pass.
