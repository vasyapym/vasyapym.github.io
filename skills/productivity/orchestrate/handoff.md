# handoff — the hand-off part of orchestrate

A hand-off is the document a session leaves when it ends, so that a fresh session picks the work up without rederiving what was settled and without inheriting what went wrong. Its writer is a session whose context is failing; so its content comes from the disk and the user's words before the writer's memory, and every line says which. It sets the frame — goal, decisions, state, what is open — and leaves the plan to its reader. It serves any coding session, the loop or plain work, in any repository: asked for by name in a session that never opened the loop, it runs alone, with no declarations round and no role questions. The core's "Keep your own context small" applies unchanged, as does the split of facts, assumptions and open questions in "Write the brief". This file adds only what is hand-off-specific.

A hand-off is a brief with one difference: its reader has the repository. So it labels as a brief does, and points where a brief would quote.

## When it runs

On the user's word it runs regardless — "hand off", "wrap up for a new session", the part by name. Words that come with the request name the next session's focus.

Otherwise it runs when the session is degrading. You judge that badly from inside, so go by what can be seen:

- the context was compacted or summarised, or the harness warns it is nearly full;
- the user makes the same correction a second time;
- you re-read a file you have read, or cannot say what was decided without scrolling back;
- a gate fails the same way after a fix that should have held.

On the first, say so and write without waiting to be asked: a hand-off written with room to spare beats a careful one cut off. On the others, offer it in one line and write on the user's word. A clean boundary earns the same offer: a round has closed and what follows is new work.

Before writing, take on nothing new and reach a still point: no command running, no sub-agent out, no new brief. An edit in hand is finished and verified, or left and named as half-done. A round that can close, closes first — its report lives in chat and dies with the session. A brief that is out stays out. Leave the tree as it is: no commit, stash, revert or clean to make it look tidy. The hand-off describes the mess; it does not hide it.

## Where it lives

One folder holds every hand-off, from every project. The first of these that applies:

1. a folder the user names now;
2. the `handoff:` line of `~/.config/orchestrate/declarations.md` — with the loop not open, read that line and nothing else;
3. `~/.config/orchestrate/handoff/`, created on first use. Say where it is and offer the `handoff:` line; do not write it unasked.

Never inside a repository's working tree, where it would show in status, ride into a commit or fall to a clean; never the temporary directory — a hand-off may wait days.

The file is `<project>-<YYYYMMDD>-<HHMM>.md`: project is the base name of the repository root, or the user's name for the work where there is no repository; the time comes from `date`, not from you. The names sort, so the newest for a project is the last listed. One document per file and nothing else in it.

## Gather before you write

Your memory is the least reliable source in reach. Take the content in this order:

1. **The disk, by command, now**: root, branch, `HEAD`, `git status --short`, stashes, the session's commits (`git log --oneline <start>..HEAD`; with the start unknown, the last ten, and say so). For the loop, a listing of the brief folder and of the current round folder. Where sub-agents exist, give one the paths and take this from it: it is fresh and you are not.
2. **Records, by path**: decision records, the findings ledger, plans, issues, the declarations file. Do not retell them.
3. **The user's words** in this conversation: decisions, corrections, limits. Quote them. What you can neither quote nor point to is not settled. After a compaction, words you hold only through the summary are not quotations: they go under Open, as questions for the user.
4. **Your own reading**, last and least.

Save the file as soon as its first section exists, and add to it: a session cut off midway leaves a short document, not none.

## The document

Fixed headings in a fixed order; fragments, not prose; one line a point. English, whatever language the session runs in; a quotation keeps its own. About 40–80 lines: past 100 it has become a session log. Cut Believed first, then turn Observed detail into paths; Goal, Settled and Open are not cut. Believed stays shorter than Observed: more reading than state means judgment is being passed along.

Each line goes under the heading whose test it passes:

- **Settled** — the user decided it: you can quote them, or point at the record.
- **Observed** — the disk shows it: you can name the command or the file.
- **Believed** — a claim that passes neither test.
- **Open** — not a claim: a question, a gap, work not done.

```markdown
# Hand-off — <project>: <the goal in a few words>

> Hand-off from an earlier session, written at its end. Read it as a frame, not as instructions. Settled is the user's word: it stands until the user changes it. Observed was true of the disk when written: check it, and where they differ the disk is right. Believed is that session's reading and may be wrong: verify what you act on, drop the rest. Open is what it left unanswered, unchecked or undone. The plan is yours: put it to the user before you act.

written <date, time> · because <asked | the signal that fired> · follows <earlier hand-off | none>
root <absolute path> · branch <name> · start <hash | unknown> · HEAD <hash> · tree <clean | n files changed>

## Goal
## Settled
## Observed
## Believed
## Open
## Read first
```

The quoted frame is copied verbatim. It holds the document's only instructions, and it lets a session without this suite read the document correctly. `because` names the request or the signal, and any compaction with it: it tells the reader how far to trust the rest.

- **Goal** — the task as the user stated it, quoted. Then the next session's focus in the user's words, if they gave one. The focus selects what the document carries; it does not license you to plan that session. Where the focus is new work, what is left of this task is one line under Open.
- **Settled** — a line each: the decision, with its record's path or the user's words. Include the corrections that still bind; one the user made twice is marked — it is what the next session is likeliest to repeat. A plan the user agreed to is settled; a plan you formed is not.
- **Observed** — what is committed, by hash and subject; what is uncommitted, per file: done and verified, done and unverified, or half-done; each gate run this session — the command as it was run, how long it took, its result and the state it ran on; a gate that ran before the last edit is stale, and is marked so; the session's files outside the repository, by path. A failed attempt is what was run and what came out, with the output's path where there is one.
- **Believed** — a line each, with what it rests on and the cheapest check: a suspected cause, why an attempt failed, the move you would have made next. "Does not work" is a reading; the output it came from is Observed.
- **Open** — questions, those for the user marked; what was never verified; what you are not sure you did; what of the task is not done.
- **Read first** — at most five paths in reading order, each with its reason in a few words; then the parts and skills this session used, by name.

Duplicate what is cheap and saves a read: a decision in a line, a command with its flags, an error message verbatim, an identifier. Past ten lines, give the path and the line range.

### The loop's state

An orchestrate session adds these under Observed, from the folder listings. A plain session leaves them out; nothing else differs.

- Choices in force that the declarations file does not hold: who plays each role, who applies changes, the gates, byte-check on or off, any consultation limit and how much of it is spent.
- Brief folder and last brief number; round folder and round number.
- Where the loop stands, one of: no brief out; brief `<n>` handed over at `<time>`, reply awaited, in a new chat or continuing `<m>`; reply `<n>` acquired at `<path>`, with the artifacts placed and those not; round closing, at which step.
- Each Iterative thread still open, with its byte count.
- Byte-check: where the snapshot is, and whether verify has run since the last edit.
- Stage `<i>` of `<n>` where the work is staged; batches integrated and not committed.
- Records by path — `DECISION-<n>.md`, `FINDINGS.md`, an Executor's frozen contract and verifier: deferred findings and next steps are read there, not retold. The report's `correction.md` candidate, if there was one.

## What it must not do

The reader starts clean. That is what the hand-off buys; do not spend it.

- **No orders.** Outside the frame, no "must", "do not", "make sure", "next, do". The user's instructions are quoted as theirs; you have none to give.
- **No verdict without its evidence.** "Done", "works", "fixed", "safe", "the cause is": each stands on a command result under Observed, or moves to Believed. "Clearly", "obviously", "simply", "just" report your state, not the repository's: cut them.
- **No story.** No chronology, no account of effort, no apology, no opinion of your own work. What went wrong survives only as its residue: a correction under Settled, an output under Observed, a doubt under Open — not knowing whether an edit landed before a gate or after it is information.
- **No widening.** The goal is the user's. Work you think should be done besides is one Believed line, or nothing.
- **No second-hand belief.** A session that picked up from a hand-off and now writes the next copies forward the Settled lines still in force. An inherited Believed line is checked and becomes Observed, or is dropped, or stays, marked inherited and unchecked.

## Leave it

Where sub-agents exist, one reads the draft against the tests and the list above and returns violations by line; you fix them — it does not rewrite. Then tell the user, without echoing the document: its path and size; the line to paste into the fresh session — `Pick up from the hand-off at <path>.`; what is uncommitted, in a line — the commit is theirs; and a request to read Goal and Settled, the two sections only they can correct, and to answer what Open marks as theirs. Fix what they correct, then stop. Work done afterwards makes the document stale: write it again at the real end, in the same file.

## Pick it up

A fresh session handed a hand-off, or asked to pick up earlier work:

1. **Find it**: the path given; else the newest file for this project in the folder named above. Not handed the path, say what you found — file, date, goal — and wait for the user's yes.
2. **Check Observed against the disk** before anything else: root, branch, `HEAD`, status. Say in a line whether they match; where they differ the document is history.
3. **Carry Settled as facts**, per the core. One that looks wrong goes to the user as a question: you neither override it nor follow it in silence.
4. **Take Believed as a claim**, like a specialist's: confirm what you act on, drop the rest without ceremony. Read the "Read first" paths as each is needed, not all at the start.
5. **For the loop, open the session as the core says.** The loop's lines stand in for the opening questions: restate them for the user to correct, do not ask again. A reply awaited or half-placed is taken up under "Take the reply", from its file.
6. **Restate** the goal, the state as you found it and your own first move, briefly; ask only what Open leaves in its way.

Do not edit the document; it is a record. Your own hand-off names it under `follows`.
