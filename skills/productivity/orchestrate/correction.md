# correction — the correction part of orchestrate

A correction acts on friction that has already recurred: a mistake, a detour or an explanation the repository made necessary twice or more. It finds the cause in how the code is arranged, removes it at the highest level that works, and proves the removal by replaying a real past instance — so the next contributor cannot repeat it. The aim is a repository where a change that looks right from the one file it is made in is right for the whole. It mirrors `decision.md`: that file shapes what is not yet built; this one repairs what keeps going wrong in what is. Tidying is its ground only with a recurrence behind it: one instance is a bug for an ordinary round, and an improvement nobody tripped over is polish. Most sessions never need it. The core's "Write the brief", "Hand it over" and "Take the reply" apply unchanged — opener and closing lines, numbering, reply shape, code by command, salvage-integration. This file adds only what is correction-specific.

## When it runs

On the user's word: by name, or when the task as stated is to stop something that keeps going wrong or to make the repository easier for agents to work in. Otherwise it is offered, not started: when a session meets the same thing a second time, bring the batch in hand to a verified state and name the candidate in the report; the user says whether it gets a round. A correction is never folded into another task's round: its batches and commits are its own, so one revert undoes one fix.

Outside its ground:

- **A choice still open.** Where the cause can only be removed by a shape nobody has picked — a new layer, dependency, tool or pattern; a pick between two ways where the repository favours neither; a change to something one-way, such as stored data or a public address or format — the question is `decision.md`'s, by that file's own conditions. Name it as a next step, apply the best fix available without it, and move on. When that decision is later settled and built under that file, the class closes here: replay, leftovers, ledger.
- **A settled decision.** A decision record is a fact. A correction may enforce it — contributors breaking a decided shape are a class like any other — and never contradicts it: where the instances trace to the decided shape itself, show them to the user; reopening is theirs, under that file's rule.
- **Not the repository's.** Friction in a reference tree, or caused by this skill's own files or the declarations, is reported, not fixed here.

## Find the classes

Assume every contributor is an agent that sees only the files it opened, copies the nearest example and stops at the first thing that works. Friction is wherever that reader was led wrong, and it leaves records. Gather them by sub-agent, as locators and verbatim text, marked observed or inferred:

- **Version control**: reverts; fix commits that follow a change to the same files; the same lines edited again and again.
- **This skill's records** for this repository, in the brief and round folders: review ledgers — findings of one kind across rounds; earlier correction ledgers — a fixed class with a new instance, a single waiting for its second; briefs — a fact that brief after brief had to explain because the code does not show it.
- **The repository's own warnings**: agent instruction files; comments that explain a workaround or say "keep in sync", "also change", "do not touch".
- **The user's account** of what they keep correcting, verbatim.
- **This session**: what the user corrected; what you rejected at salvage, and why; where your sub-agents looked first and where the thing was; the copy they edited that was not the live one.
- **A cold run**, where the user asked for the pass and the records are thin: give a fresh sub-agent the wording of a few real past changes — commit subjects, without their diffs — and record where it looks first and what it would copy, against where the change was made. A miss is an observed instance, labelled cold.

A class is two or more instances with one cause. Count by cause, not symptom: two different bugs from one hand-synced list are one class; one symptom from unrelated causes is none. A written warning that was broken anyway counts as two: the writing records the first. A class an earlier ledger marks fixed that shows a new instance goes to the top, and one level higher than before. The user may name a class themselves: their word stands in for the count and is labelled as theirs. Your own grouping is an assumption until the diagnosis.

An empty list is a result: say so and stop. What the user still wants changed is then an ordinary task, or a question for `decision.md`.

## The levels

Fix each class at the highest level that works with what the repository already has. A lower level is taken only with a line saying why each one above it does not work.

1. **Remove** — arrange the code so the mistake cannot be expressed. One owner for each piece of state; one supported way for each task; what must change together put in one place, or derived from one source; the old way, the dead code and the stale copy deleted, because what stays gets copied; internals out of reach, so the wrong call fails; names and places the obvious search finds. The way that survives is the one the repository already favours — by count and by its recent commits together — or one a decision record or the user has named; where count and recency disagree, the pick is open. A correction converges on a way; it never introduces one.
2. **Refuse** — the mistake can still be written but does not pass: a type, where the language has them; otherwise a check inside a gate that already runs, whose failure message names the file or function to use instead. Where more old uses stand than the batch can clear, the check pins their count and fails on additions.
3. **Test** — a test of the behaviour through its interface that fails on the past mistake. A test that passed while the mistake went through, or that fails when only internals change, is fixed or deleted with the class.
4. **Tell** — one line for what is truly a judgment call: a comment at the place the wrong move starts, where the next reader will be; else in the agent instruction file. Last, because nothing fails when it is skipped.

A check or test that nothing runs is a note. Where the repository has no gate or no tests, that level is closed; starting one is the user's call, named as a next step.

## What the brief carries

By default one diagnosis brief, to the Creative, a fresh chat; the user may name another. A single class with a plain cause — or a relay the user declines — needs none: put the class to the user as yours. The specialist judges why the wrong move was the nearest one, so it must see what the contributor saw.

- **The task as stated**, and who works in the repository: the user by hand, agents, both. That sets what a move or a rename costs.
- **The instances**, raw, in order of time, each with its locator and, where known, who made it: the hunk that made the mistake and the hunk that fixed it, by command; the ledger line; the rule or comment; the search that missed; the user's words.
- **Both places, as they stand**: the file where the mistake was made, whole or in generous excerpt — what was visible from there — the place that held the right way or the warning it missed, and the tree around both, by command.
- **Counts, by command**: each competing way with its number of uses and when one was last added; the places that must change together; what is left in the tree of each past mistake.
- **What guards the area today**, and which of those guards ran and passed while the mistake went through; the means the repository has — types, a linter, tests, gates — or that it has none.
- **Settled decisions** touching the area, records whole, and what must not change — stored data, public addresses, formats: facts, not up for redesign.
- **Your grouping and open questions**, after the instances, labelled yours.

Thorough side, per the core. Cut by distance from the instances, and say what was left out.

## What to ask for

After the core's opener, the task:

> Below are mistakes and detours that each happened more than once in one codebase, with the code as it stands. Assume the next contributor is an agent that sees only the files it opened, copies the nearest example and stops at the first thing that works; the aim is a codebase where a change that looks right from one file is right for the whole. The user decides what is fixed; your part is the diagnosis. Group the instances by cause, not by symptom, and for each class say what in the arrangement of the code made the wrong move the nearest one. Then give the smallest change that makes the class impossible, at the highest of the levels below that works with what this repository already has, and say in a line why each higher level does not. Change how the code is arranged and checked, not what it does. Design nothing new: where the cause needs a new layer, dependency, tool or pattern, a pick between two ways where the code favours neither, or a change to stored data, a public address or a format, name that as a pending decision in one line and give the best fix available without it. About this codebase, reason only from what is quoted, and say what you would need to see; what you know of languages and tools beyond it, mark as from memory — it will be checked. Few sure classes beat a long list; "these are not one class" is a valid answer.

Quote the four levels into the brief as written above, and name the tests each fix is put through:

- **Replay** — make one quoted instance again after the fix: the same move, against the new arrangement. It must come out impossible (what it acted on is gone), sufficient (that one edit is now the whole change) or refused (it fails, with a message naming the right way). For a detour, the replay is the search that missed: it now lands.
- **Nearest example** — from each file where the mistake was made, what an agent would now find and copy first. It must be the right way.
- **Way around** — the cheapest way to make the same mistake past the fix. If it is easy, the fix belongs a level higher.
- **Right path** — what the fix costs someone doing the work correctly: a check that fires on correct code, an indirection to read through, a move that breaks the map a hand coder works from. A fix that taxes the right path is new friction.
- **Leftovers** — what the fix makes dead: the old way, its tests, its rule, the comment explaining the workaround. They go in the same change.

Output contract, in this order: the classes, ranked by how often and how recently they bit, one compact entry each — name, instances by locator, cause, level and why not higher, the fix in a line with the paths it touches, the tests in a line each, pending decisions; instances that fit no class; what it rests on, numbered so each can be checked — assumptions about code it was not shown, claims from memory; then the first class's change between `=== begin fix ===` and `=== end fix ===` — what to delete, move and edit, new code where code is new, the check with its message, the replay to run; then the sentinel. Under pressure the tail of the ranking shrinks, not the fix; a reply cut inside the fix still carries the diagnosis. Cap inside the capacity's budget and state its time limit. Other classes are detailed by later briefs, one each, once the user has said which go: the class entry whole, the code it touches, and only the change asked for.

## Take the diagnosis

A diagnosis is input. Before it reaches the user, confirm each class against disk: every instance is where it is cited; the cause is in the code as described; the counts hold; the level claimed is open — the gate exists and runs, the type can be expressed, the tool does what the reply says of it, tried in a scratch copy; the fix touches no caller it calls unaffected; and what it deletes is dead — nothing reaches it by name, by string, or from configuration, routes, templates or scheduled jobs. Record what held, what did not, and what you could not check; what cannot be shown dead stays, and the list says so. A pending decision the reply named is confirmed the same way and then left alone.

Then put the list to the user, short: each class in a line — instances, cause, level, what the fix deletes or moves — then the pending decisions, and your own view, labelled as yours. The user says which classes are fixed now; the rest are next steps. Nothing outside the named classes is touched.

## Fix and prove

One class, one batch, one commit the user can make, with nothing else in it.

- **How.** A deletion, move, rename, derivation, or one settled rewrite repeated over many places needs no relay: do it by sub-agent. A fix that needs judgment inside the class is detailed by brief, as above. Nothing holding the user's uncommitted changes is moved or deleted without their word. Under hand integration the deliverable lists deletions and moves as commands for the user to run, beside the edited copies.
- **Whole.** The batch takes with it the instances still standing in the tree and the leftovers, and leaves the tree working. Where the same cause stands elsewhere, not yet sprung, the fix covers it or the ledger says where it remains.
- **Same behaviour.** A correction changes how the code is arranged and checked, not what it does for its users; stored data, public addresses and formats stay as they are. A standing instance that is a live bug is fixed with the class and named in the report.
- **Exceptions.** A place that must break the new rule carries the exception on its own line, with the reason. Granting it is the user's.
- **Proof.** Before the round closes, by sub-agent, in a scratch copy outside the tree — under hand integration, one that has taken the deliverable — run the replay on a real past instance and record the command and what happened: impossible, sufficient or refused. A detour is replayed cold: a fresh sub-agent, the original task, no hint; it finds the place first. A check or test is shown both ways: failing on the replay, passing on the fixed tree. A Tell fix proves nothing: the ledger says `unenforced`. A replay that goes through is not a fix: go a level higher, or report it. A replay you cannot run leaves the class `unproved`, with the command for the user to run — never `fixed`.
- **Instruction file.** Where the repository keeps one, the batch edits it: a rule the fix now enforces is deleted, since the code now says it. The file shrinks as the repository improves. Where there is none, do not start one unasked.

The round then closes as the core says. For the review pass the task as stated is the class with its instances, and that behaviour stays as it was — so the reviewer judges whether the mistake can still be made, as well as what the change breaks.

## Record it

`round-<k>/CORRECTIONS.md`, yours to write, compact; beside the briefs when there is no round folder. It names the repository, then per class: id and name; instances by locator; cause; level, and why not higher; the fix in a line, with paths; the proof — instance replayed, command, result; leftovers removed; exceptions standing; state — `fixed`, `unproved`, `unenforced` (a Tell), interim (a lower level standing in until a named decision), waiting on a decision, next step, declined. Then singles: instances that made no class, a line each — the next one completes it. It points into reply files and commits; it never quotes chat. A class that returns is a new entry naming the earlier one; an old ledger is never rewritten.

## Report

Into the round report: the classes found, a line each with their evidence; which were fixed, at what level, and the proof result; what was deleted or moved; the pending decisions named for `decision.md`; the classes left as next steps; exceptions granted; proofs you could not run.