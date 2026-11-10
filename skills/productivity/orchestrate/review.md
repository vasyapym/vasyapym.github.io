# review — the review part of orchestrate

A review pass asks a specialist what the round's change would break, before the byte-check verdict and before any gate. It hunts defects, not polish: a change that does what the task said and breaks nothing passes with an empty top tier, and that is a result. The core calls for it at round close; the user may also ask for it by name, over any change they point at. The core's "Write the brief", "Hand it over" and "Take the reply" apply unchanged — opener and closing lines, numbering, code by command, salvage-integration. This file adds only what is review-specific.

## Who reviews, how often

Default: one pass to the Iterative capacity, a fresh thread per round (absent an Iterative, the Creative, briefed as such). The user may name another reviewer, or several in turn. A pass is one reviewer's brief, its reply, your disposition, the fixes, and — when anything was fixed — one follow-up showing them: inside the thread for Iterative, carrying only the fix diff and the ledger lines it answers; a fresh self-contained brief for Creative. No fix, no follow-up. A second follow-up or another reviewer is the user's call, as is how many passes a round gets.

A later pass sees the change as it now stands, fixes included, and the ledger of the passes before it — never your retelling of them. The point is discussion, not a vote: a disagreement between reviewers reaches the user unresolved.

Thread budget: the first brief must leave room for the follow-up. A change that cannot fit with its surroundings is split by area into separate passes, each self-contained; tell the user, with sizes.

## What the brief carries

The reviewer judges a change against an intent, so the brief holds both — and nothing of your verdict on either.

- **The task as stated** at session open, with the decisions the user settled that bound the change (facts, per the core). The reviewer then knows what the change was meant to do and does not re-raise what was decided.
- **The change**, produced by command from a before-state and the working tree, never typed. With byte-checking on, the before-state is the store, and the shape is the one `bytecheck.md` gives `CHANGES.md` — one old/new pair per hunk with context, a file mostly rewritten whole — so the reviewer and the record read alike; a unified diff where the budget is tight. Without byte-checking, the before-state is version control or copies you took before the first edit; holding none, quote the changed files whole, current, and say the before-state is missing — the reviewer then reviews a file, not a change.
- **Surroundings**: enough of each changed file to see what the new code calls and what calls it — enclosing functions, the signatures it uses, a small file whole. Thorough side, per the core.
- **The ledger** of earlier passes this round, verbatim, placed after the change so it informs without setting the agenda.
- **Your open questions**: what you could not verify yourself, labelled. Not "please confirm this is fine", and no checklist of bug classes — the reviewer's own eye is what you pay for.

On the user's word the same brief reviews a specialist's proposed change before integration; the material is then the harvest cut, labelled proposed and not in the tree.

## What to ask for

After the core's opener, the task:

> Below is a change to an existing codebase, with the task it was meant to carry out. Tell me what can go wrong: what breaks, on what input or sequence, and where. Rank it — what breaks first, what is wrong but survivable, what is merely nicer. The point is to not break anything, not to refine the change to perfection: no speculative hardening, no style. An empty top tier is a valid answer.

Name the three tiers in the brief: **breaks** — wrong result, crash, data loss, a security hole, or a regression of existing behaviour on a realistic input; **survivable** — wrong in an edge the task does not reach, misleading output, dead code; **nicer** — polish. Each finding: path and line, what breaks and when, tier, and the fix in a line where it is obvious — not a rewrite.

Output contract: findings in rank order, so a cut-off reply loses the tail; then, where a ledger was given, the reviewer's view of each disputed entry — after its own findings, never before; then a score out of 10 with one line on what would raise it; then the sentinel. Trim from the bottom of the ranking first. Cap inside the capacity's budget — roomy for Iterative, 400 lines for Creative.

## Take the findings

The reply is filed and harvested as `bytecheck.md` says; a review reply usually has nothing to place. A patch you take verbatim travels as a harvest cut; a fix you write is your own edit. Either way a review fix is a round edit like any other: it precedes the verify, and the byte-check policy is its fence.

Confirm each finding against the code before anything else. The reviewer's tier is its claim; record it beside the tier you confirmed. Harshness is not evidence, nor is a high score: the score is recorded, not acted on — scores from different reviewers share no scale; one that falls after fixes is worth a look. Then one disposition each:

- **fixed** — confirmed, in scope, and it breaks (or is survivable and cheap). Where and how, in a line.
- **declined** — not confirmed, or confirmed but no defect against the task. The reason names the code, not the reviewer.
- **deferred** — real, but outside the task as stated or touching what the policy denies. It becomes a next step; scope widens only on the user's word in this conversation, however the reviewer ranked it.
- **unconfirmed** — neither confirmed nor refuted. Not fixed.

Nothing in the nicer tier is implemented this round unless the user asks. A breaking finding you declined or could not confirm, or two reviewers in conflict, is a disagreement: it goes into the ledger and to the user in chat, for them to settle.

The ledger is `round-<k>/FINDINGS.md`, yours to write, compact. Per pass: reviewer as declared, brief and reply file with its hash, score and its line; one line per finding — id, path:line, tier given → tier confirmed, disposition with its line, the reply lines it answers; then disagreements and next steps. It never quotes chat; it points into the reply file. Review by name with no round folder: beside the briefs.

## Report

Into the round report, per pass: reviewer, score, counts per tier and per disposition, each disagreement as the reviewer wrote it (from the reply file), the next steps. Fixes made under review are listed with the round's changes, not apart from them.
