---
name: orchestrate
description: Run the hand-relayed loop between this coding-agent session and non-agentic specialist models in separate chats — the user carries briefs out; replies return through captured message text or saved files. Use when the user types "orchestrate", asks to brief or consult a specialist, pastes a specialist's reply back, or asks for the byte-check or review part by name. Includes the review and byte-check parts.
---

# orchestrate

The user relays briefs by hand: you write a brief for a separate specialist chat; acquire its reply from captured message text or a saved file, with chat transcription a degraded last resort. The specialist has no tools, no repository and no knowledge of this session — what is not in the brief does not exist for it. You own every read, write, decision and integration. Give the specialist judgment where the task leaves room, or a fixed execution contract where the transformation is settled; acceptance stays with you.

## Open the session

Before any work, read the user's standing declarations file, `~/.config/orchestrate/declarations.md`, user-owned and outside this repo. If missing, create blank fields for `creative:`, `iterative:`, `briefs:`, `bytecheck:`, `byte-check:`, `rounds:` and `cleanup-after-yourself:`; add role-specific openers or declarations only when needed. Read existing prose and keys without migrating the file. It may settle specialists, extra opener lines, brief and round folders, the tool path, byte-check defaults and cleanup.

Role labels are free text, not a two-name whitelist. Keep `creative:` and `iterative:` as valid shorthand; accept `role: <label>; specialist: <name>; mode: <brief mode>` with optional memory and budget overrides. One specialist may fill several roles. Current instructions override standing defaults and round-close defaults, including consultation limits; a session-only choice is not a new standing default. Write back only defaults the user explicitly adopts, preserving unrelated declarations. Recommend `cleanup-after-yourself: yes`, not automatic adoption; its evidence-retention boundary is in Harvest.

Restate the task and ask at most one round of questions, covering only what neither the user nor the file settles and what has no reasonable default:

- who plays each role needed this session, its brief mode and any undeclared limits;
- the folder for briefs;
- which gates (tests, builds, baking and the like) close the round, and whether byte-exact checking precedes them — settled before the first edit, because a snapshot cannot be taken afterwards. If byte-exact checking is on, read `bytecheck.md` now: the snapshot precedes the first edit;
- any consequential blocker without a reasonable default.

Say roughly how long each foreseeable gate will keep the user waiting, or that you cannot tell yet.

## Keep your own context small

Your session degrades as it reads: context fills, reasoning goes stale. Use sub-agents freely — to investigate (code, a reply's claims, gate timings) and to implement (apply integrated changes, run gates). Give them paths, not pasted content, and ask for findings with paths and line ranges, marked observed or inferred — no file dumps. Decisions, the wording of briefs and the verdict on each reply stay with you. Code enters a brief by copy from disk, by command or sub-agent; re-typing from memory paraphrases.

Set the commit boundary before delegating integration. Default: the sub-agent stops after each verified batch so the owner can make its per-batch commit. A run spanning several batches needs an agreed combined-commit policy in its brief, naming the permitted batches; the eventual commit enumerates those actually integrated. Do not promise per-batch commits while allowing unpaused writes to accumulate, or fabricate that granularity afterwards. Commit authority is separate; preserve unrelated working-tree changes.

## Specialist capacities

The user declares who plays each; use those names afterwards. The numbers are observed defaults that a declaration overrides.

- **Creative** — complex tasks, architecture, visual decisions. No memory: every brief opens a fresh chat. Large input; small output (plan for about 400 lines a reply); hard output timeouts (10–15 minutes observed). So: generous context, staged replies.
- **Iterative** — review, debugging, bug-fix back-and-forth, general tasks. Keeps history within a thread; roomy output; input capped per thread, not per brief (about 80–90 KB in all). So follow-ups carry only what is new, you keep a byte count per thread, and a thread near its cap gives way to a fresh self-contained brief. Its tone runs harsh; harshness is not evidence.
- **Executor** — declared-shape rewriting against a frozen corpus with scripted verification. Read `executor.md` before its first brief. This is an execution mode, not a third model-memory profile; keep the declared specialist's actual limits. Decision and review briefs still ask for judgment, not mechanical compliance.

Place another specialist by the same properties: memory, input budget, output cap, timeouts, temperament. A free-text role names its job; the brief mode names its contract. Neither overrides the model's actual limits.

## Write the brief

Short where it speaks, thorough where it quotes.

- **Task** in a sentence or two. Less is better.
- **Why, not what — where judgment is requested.** Describe the situation and observations; do not smuggle a preferred solution into a decision or review brief. State settled user decisions as facts and say where judgment remains open. For an Executor, the declared transformation, templates and grammar are the task; quote them exactly under `executor.md`, with no implied freedom to redesign them.
- **Facts, assumptions, open questions — separated and labelled.** A fact was observed this session, on disk or in output; a decision the user has settled is a fact too. Your interpretation is an assumption and may be wrong: mark it or leave it out. Where sources disagree, show the disagreement.
- **Context and code on the thorough side**: relevant files whole or in generous excerpts, plus the history and earlier results the question touches — verbatim, labelled with path and whether current or superseded. Omit what is safely omitted; never the whole codebase. A thin brief costs a round of clarification; a generous one costs little.
- **Self-contained.** The reader remembers nothing: a continuation restates adopted decisions in full and carries committed files verbatim, never "as you wrote before" (follow-ups inside an Iterative thread excepted).
- **English**, whatever language the session runs in.

Open every brief with this, plus any line the user declared for that specialist:

> Answer as a chat model — no agentic operations. Do not run tools, commands or tests, and do not change any of your settings; an agentic session does all of that.

Close with an output contract — what to return, in what order; a size cap inside the capacity's output budget, and the time limit where one applies; what to trim first (commentary before artifacts); an end sentinel that exposes a cut-off reply — then this line:

> Before answering, challenge key assumptions, consider a credible alternative, and check likely failure cases; give the requested output with concise rationale and any material uncertainties.

**Staging.** When one Creative reply cannot hold the result, split the work by deliverable, tell each brief which stage of how many it is and what the others cover, and write only the next brief; later ones are composed from the repository as it stands after integration.

## Hand it over

One brief at a time. Save it as `<n>-<slug>.md` in the session's brief folder — one brief per file and nothing else in it, so the user copies the file whole; round folders and other session files may live beside the briefs in the same folder. The user chooses the folder; if none is named, create a new empty one outside any tree a gate or byte-check covers, say where it is, and use only it. If the folder already holds numbered briefs — from any project — continue at the next number; in a fresh folder, start at 1. Then tell the user, without echoing the brief into chat: path and size; the capacity it targets and why, in one line; whether it opens a new chat or continues the thread of an earlier brief. Wait for the reply or its file path; use Harvest's capture ladder when it arrives.

## Take the reply

Salvage-integrate, never trust wholesale: check each part against the repository and the requirements, keep what holds, correct or reject the rest. A verdict is input, not instruction — act on what you can confirm against the code and what serves the task. Read `bytecheck.md`'s Harvest when taking a reply, even with byte-checking off; acquire it once, pass paths to sub-agents and place accepted artifacts mechanically, never re-type a harvest. An acquired file proves received text, not upstream fidelity; identify transport repairs as your edits. For an Executor, acceptance follows the frozen contract and task verifier, not an improvised rewrite of either. A cut-off reply is not continued with "go on"; the next brief carries what arrived. Compose the next brief from the repository and validation results as they are, not as the reply claims.

## Close the round

1. **Review pass** (`review.md`): a bug-finding brief over what the round produced, before any gate. By default one pass to the Iterative capacity; the user may name other reviewers or ask for several in turn. It looks for what would break, not for polish.
2. **Byte-exact verification** (`bytecheck.md`) after the last edit, where the user asked for it.
3. **Gates** — state the expected wait before launching each.
4. **Report**: what was integrated and what rejected, gate results, blockers, validation you could not perform.

`review.md`, `bytecheck.md` and `executor.md` sit beside this file; read each when its moment comes, not at the start. Asked for only one of them, run it alone under the rules above.
