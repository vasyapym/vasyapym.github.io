# executor — the executor mode of orchestrate

Use this mode for declared-shape rewriting against a frozen corpus with a scripted verifier. The transformation is settled; the specialist executes it, not redesigns it. A template is law within the task the user authorized, not permission to override that task. If sources, configuration and grammar disagree, stop the affected unit and name the conflict; never silently choose one. Open design questions belong in a separate decision brief, within the user's consultation budget.

Executor is a mode, not a model profile. Keep the declared specialist's actual memory, input budget, output cap and timeout; do not infer them from the role name. Each batch brief is self-contained even when a thread has memory. The core's opener, numbering, hand-over, capture and staging rules still apply. Its closing challenge asks the Executor to find contract contradictions and failure cases, not to substitute another design.

## Freeze the contract

Name the source corpus, its version or hashes, the authorized targets, the transformation, the block kinds and the acceptance checks. Freeze the bytes a batch depends on before generating its brief; a later source change invalidates the affected brief, not the evidence. Keep authoritative excerpts labelled by source and locator; batch numbers are labels, never implicit source-row addresses.

Declare identities before parsing. A logical id is not necessarily unique: preserve permitted repetitions with a composite locator or an ordered collection; reject duplicates only where the contract forbids them. Match identifiers exactly, never by substring. A ratified non-merge boundary remains a boundary even when two units share a label.

Where detail moves, declare its destination and the preservation obligation. Verification covers the source and every destination needed to establish that obligation, including an archive when one is the declared home. A reply-only check cannot prove that displaced detail survived. Do not expand to the whole repository when the declared source-and-destination closure is enough.

## Write the batch brief

Carry the task and settled decisions; the relevant templates; constants and configuration; byte-authoritative source excerpts; permitted targets; output grammar and block counts; forbidden transformations; and the complete output contract. Copy authoritative text from disk. Include enough context to execute and diagnose contradictions, not the whole corpus or earlier conversation.

Generate configuration-dependent grammar, optional-section rules, counts and marker expectations from the same configuration used to select the batch. Assert their agreement before sending the brief. No separately maintained sentence may claim that a configured block kind is absent. A hand-written brief gets the same consistency check; a generator is not required merely to satisfy this rule.

Give the reply an identifying preflight line, recognizable block boundaries, the expected counts and a terminal sentinel. Store those expectations as a reusable marker profile for acquisition; generate batch-specific values with the brief. A profile identifies a plausible reply, not a correct transformation. Keep acquisition expectations separate from the task verifier's content assertions.

Budget by the specialist's real output limit. Split by independently verifiable deliverable; include only the next batch's authoritative inputs. Preserve the existing staging and TRUNCATED-HERE protocol. A partial reply is retained as partial, never promoted to complete because useful text arrived. Accept an independently complete subset only if the contract permits it; record exactly which units remain outstanding.

## Verify the verifier

Before the first batch, implement a small executable self-test beside the task's verifier, using its production parsers, selectors and application functions. Run it once per verifier revision, not once per unchanged batch. Use fixtures for the supported features below; mark a case not applicable only when the corresponding operation is absent. These are regression requirements for the task verifier, not claims about bytecheck.py.

- Source addressing: use nonconsecutive batch labels and intervening physical rows; the selected source follows its declared locator, never the batch ordinal or a coincidentally matching number.
- Authority coverage: place permitted constants in two separately declared source slices, including auxiliary state or metadata when present; both are recognized, while an undeclared value is rejected. Do not build an allow-list from only the most convenient source.
- Identifier boundaries: include key and key2; selecting either changes only its exact match.
- Repeated identities: include two permitted occurrences of one logical id; neither is overwritten or merged in a map. Include a forbidden duplicate separately and require rejection.
- Destination coverage: move a required detail to a declared secondary target; verification passes when it survives there and fails when that destination is missing or wrong. A disappearing source occurrence alone is neither proof of loss nor proof of preservation.
- Idempotence: for every supported block kind and for a complete batch, apply the accepted result twice; the second application changes no bytes. An existing insertion with the same identity and different content is a conflict, not another insertion or an automatic overwrite. Recognize an already-applied result from its recorded post-state; do not simply bypass source preconditions.
- Collection insertion: add at least three distinct expected tokens through the real collection-building path; all three must be present. Do not assume a single-item insertion API accepts a spread or sequence as multiple insertions.
- Numeric boundaries: test a line-end number followed by a line beginning B, K, M, G or %, including 14. followed by B; never form a token across that boundary. Parse {768,1280,1920} as its declared list, not 76812801920. Test spaced and glued range/unit forms, and bare versus B-suffixed values; accept equivalence only where the grammar explicitly permits it.
- Contract generation: enable an optional or repeated block in configuration; the generated grammar, counts and marker profile must require it. A contradictory generated sentence fails before a brief is sent.
- Completeness: test a valid complete reply, a missing terminal sentinel, TRUNCATED-HERE, and a sentinel followed by more substantive output; partial or malformed output must not pass as a complete batch.

Include both passing and failing fixtures; assert the expected reason for failure so a broken parser that rejects everything cannot pass the suite. When a verifier defect is fixed, add its regression case and rerun the affected checks; reconsider earlier accepted batches only where that defect could have hidden an error. Never widen an allow-list merely because the latest reply failed.

## Integrate the batch

Acquire the reply through bytecheck.md's Harvest; give an integration sub-agent paths, the frozen contract, the verifier and the agreed commit boundary, not another transcription. Decisions and acceptance remain with the orchestrator. A validated whole-file artifact is placed whole; omitted content is not reconstructed to make it fit.

Before mutation, check the batch's source and target preconditions against disk. Stage or otherwise validate the proposed result before replacing authoritative targets; keep one writer per target. A target must match the expected pre-state or the proven already-applied post-state. Unknown drift or an unrecognized partial application stops the batch; it is not a reason to loosen the contract. Follow Harvest's stale-buffer law.

After placement, run the task verifier over the declared source-and-destination scope. Return batch ids, changed paths, expected versus actual results, the verifier's result and any unresolved units; no reply or file dumps. A script PASS covers only its assertions. Check the task's remaining semantic obligations explicitly; byte-checking, when enabled, remains a separate round check.

For a failed batch, distinguish transport damage, contract contradiction, verifier defect and Executor error before retrying. Keep the acquired reply unchanged; make bounded repairs only as Harvest permits, and identify them as integration edits. Build any continuation from the current authoritative files and the exact failures, not remembered output. Do not spend another consultation when the user's limit is exhausted; report the unresolved unit instead.
