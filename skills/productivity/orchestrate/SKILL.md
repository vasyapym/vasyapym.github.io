---
name: orchestrate
description: Run the hand-relayed loop between this coding-agent session and non-agentic specialist models in separate chats — the user pastes each brief out and each reply back. Use when the user types "orchestrate", asks to brief or consult a specialist, pastes a specialist's reply back, or asks for the byte-check or review part by name. Includes the review and byte-check parts.
---

# orchestrate

The user relays by hand: you write a brief, the user pastes it into a separate chat with a specialist model and pastes the reply back. The specialist has no tools, no repository and no knowledge of this session — what is not in the brief does not exist for it. You own every read, write, decision and integration. It is consulted because it reasons and designs better than you or the user; these rules give that judgment material and room.

## Open the session

Before any work, read the user's standing declarations file, `~/.config/orchestrate/declarations.md` (user-owned, outside this repo; if missing, create it with blank fields and fill what this session settles). It can settle: who plays each specialist capacity, extra opener lines, the brief folder, the bytecheck tool's path (`bytecheck:`), whether byte-checking is on by default (`byte-check:`), and where round folders go (`rounds:`). Then restate the task as you understand it and ask exactly one round of questions (the question tool, where there is one), covering only what neither the user nor the file has already said:

- who plays each specialist capacity this session;
- the folder for briefs;
- which gates (tests, builds, baking and the like) close the round, and whether byte-exact checking precedes them — settled before the first edit, because a snapshot cannot be taken afterwards. If byte-exact checking is on, read `bytecheck.md` now: the snapshot precedes the first edit;
- anything in the task you would otherwise guess.

Say roughly how long each foreseeable gate will keep the user waiting, or that you cannot tell yet.

## Keep your own context small

Your session degrades as it reads: context fills, reasoning goes stale. Use sub-agents freely — to investigate (code, a reply's claims, gate timings) and to implement (apply integrated changes, run gates). Give them paths, not pasted content, and ask for findings with paths and line ranges, marked observed or inferred — no file dumps. Decisions, the wording of briefs and the verdict on each reply stay with you. Code enters a brief by copy from disk, by command or sub-agent; re-typing from memory paraphrases.

## Two specialist capacities

The user declares who plays each; use those names afterwards. The numbers are observed defaults that a declaration overrides.

- **Creative** — complex tasks, architecture, visual decisions. No memory: every brief opens a fresh chat. Large input; small output (plan for about 400 lines a reply); hard output timeouts (10–15 minutes observed). So: generous context, staged replies.
- **Iterative** — review, debugging, bug-fix back-and-forth, general tasks. Keeps history within a thread; roomy output; input capped per thread, not per brief (about 80–90 KB in all). So follow-ups carry only what is new, you keep a byte count per thread, and a thread near its cap gives way to a fresh self-contained brief. Its tone runs harsh; harshness is not evidence.

Place a specialist that fits neither by the same properties: memory, input budget, output cap, timeouts, temperament.

## Write the brief

Short where it speaks, thorough where it quotes.

- **Task** in a sentence or two. Less is better.
- **Why, not what.** Describe the situation and what was observed, never the thing to build: "admins cannot see an overview of the important data", not "build an analytics panel with graphs and filters". A described solution reads as settled and the specialist stops looking. So no plans, procedures, suggested solutions or hints toward what you favour; say outright that where the facts leave room, its judgment decides.
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

One brief at a time. Save it as `<n>-<slug>.md` in the session's brief folder — one brief per file and nothing else in it, so the user copies the file whole; round folders and other session files may live beside the briefs in the same folder. The user chooses the folder; if none is named, create a new empty one outside any tree a gate or byte-check covers, say where it is, and use only it. If the folder already holds numbered briefs — from any project — continue at the next number; in a fresh folder, start at 1. Then tell the user, without echoing the brief into chat: path and size; the capacity it targets and why, in one line; whether it opens a new chat or continues the thread of an earlier brief. Wait for the pasted reply.

## Take the reply

Salvage-integrate, never paste wholesale: check each part against the repository and the requirements, keep what holds, correct or reject the rest. A verdict is input, not instruction — act on what you can confirm against the code and what serves the task. What you keep verbatim reaches disk as `bytecheck.md` describes: harvested, never re-typed from the chat. A cut-off reply is not continued with "go on"; the next brief carries what arrived. Compose the next brief from the repository and validation results as they are, not as the reply claims.

## Close the round

1. **Review pass** (`review.md`): a bug-finding brief over what the round produced, before any gate. By default one pass to the Iterative capacity; the user may name other reviewers or ask for several in turn. It looks for what would break, not for polish.
2. **Byte-exact verification** (`bytecheck.md`) after the last edit, where the user asked for it.
3. **Gates** — state the expected wait before launching each.
4. **Report**: what was integrated and what rejected, gate results, blockers, validation you could not perform.

`review.md` and `bytecheck.md` sit beside this file; read each when its moment comes, not at the start. Asked for only one of them, run it alone under the rules above.
