# Orchestrate declarations — one file for every machine

The orchestrator reads declarations from `~/.config/orchestrate/declarations.md`
on each machine. That file has two parts, in this order:

1. **The common block** — the lines in the Common block below, identical on
   every machine. Copy them into the machine's declarations file; adopt
   updates by pulling this repository.
2. **The project lines** — each project keeps its own below the common block
   (models, paths, obsidian and briefs folders, byte-check and integration
   modes, per-round notes). Our project-specific declarations are added to
   this file too, as they settle.

## Common block

collapsed paste: eaten line breaks are never guessed back in the main session; the restore attempt is briefed to Sonnet 5.5 — a chat model like the Creative relay — with the collapsed bytes and the byte-authoritative originals carried in the brief; a raw-file export from the chat stays the preferred path when it exists.

sonnet 5.5: takes about 60 KB per brief; split longer relays by deliverable.

cite, don't paraphrase: when the owner's phrasing is clear, quote it — as phrases, not wholesale copy-paste; awkward paraphrasing only makes it worse (owner, 2026-11-15).

no topic anchors: the orchestrator does not add topic fact lists («topic anchors») to briefs on its own — only when the owner asks; a creative reads them as something more desirable even when they are not instructions (owner, 2026-11-15).

reply carriage: creative capacities (creative: Fable 5.1; gentle: Astra-6) carry the artifact between the markers ALWAYS as ONE physical line — every break replaced by the marker character the brief dictates (⏎ has served) — decoded mechanically after the cut; other capacities keep the conditional one-line repair (only when the transport eats line breaks); standing for TD (traktorodetal.ru), a simple ask for a creative. (owner, 2026-11-14: mandatory for creative — collapsed pastes are the common transport; a collapsed one-line artifact loses nothing.)

## Project lines

### Who plays each capacity (names change anytime; the skill uses these afterwards)

- creative: Fable 5.1 — complex tasks, architecture, visual decisions
- creative timeout: ~10 minutes per reply (owner, 2026-11-13) — briefs to the creative must be answerable inside that window: keep asks small, prefer staged replies over one large draw.
- iterative: Sol 6.1 — review, debugging, bug-fix back-and-forth, general tasks
- gentle: Astra-6 — debugging without Sol's harshness; doubles as creative (owner, 2026-11-13)

(as of 2026-11-10)

### Delegated trivial work (standing, 2026-11-12)

- runner: Claude Sonnet 5.5 — a relay capacity like Sol 6.1: the user carries briefs to a Sonnet chat and pastes replies back; access is unlimited.
- use for: the most trivial and mechanical chores that need new text written — docs-page re-syncs, README lines, boilerplate — in place of subagents on the session's own model, to save tokens and time.
- exact-text placement never relays: when the text already exists on disk (drafted replacements, harvested artifacts), it is placed by command from disk; a relay round-trip would re-expose it to chat transport mangling for no benefit.
- verification: the orchestrator verifies anything non-trivial a runner produced before it counts — diffs reviewed, specs checked; decisions, brief wording and acceptance stay with the orchestrator.

### Extra opener lines appended to every brief, besides the standard chat-model instruction

- (standing, 2026-11-14, owner) Output-discipline opener — appended to every brief, the orchestrator states the concrete window in each brief's output contract: «There's a <N–M>-minute time limit for you to output your answer — i.e. thinking even shouldn't last over that time period. After that there's a hard stop which is not graceful — unfortunately, your progress gets lost. It seems to me that the only solution is for you to output even if the result seems unfinished to you, because the priority for you is to finish on time, not to dwell thinking about finer details and nuances. The other reason for that is diminishing returns on time spent — your answer will be good enough if you spend thinking on the task either 15 or 40 minutes. 1. If you output only partly then that can be continued in a new session, which is better than nothing. 2. If you output as specs then the mechanical writing of code can be done by the orchestrator (a smaller model which sets the task and then integrates, tests it).»
- (standing, 2026-11-14, owner) The window scales inversely with the task's expected work: the more likely the task takes longer, the SHORTER the window — a light task gets 10–15 minutes, a heavy one 6–10; the orchestrator judges per brief. (First driver: a full diagnosis reply lost to the creative hard stop, 2026-11-14.)

### Default brief folder (optional; if empty, the skill asks each session)

- briefs: /Users/vasilij/Documents/vasyapym-Vault/03_projects — each session works in a per-project, per-date subfolder (`<project>-<date>`, created on first use if missing); round folders (`round-<k>/replies/`) live beside the briefs in that subfolder; the subfolder IS the session's working directory — code excerpts, probe/reproduction outputs, brief source scratch and every other session file live beside the briefs there, repos stay free of session scratch (2026-11-13)

### Byte-check standing answers (optional; the skill reads these at session open)

- bytecheck: /Users/vasilij/Documents/bytecheck/bytecheck.py
- byte-check: (unset — the skill will ask; standing answer: always | never)
- rounds: (unset — default: the brief folder; may name another directory)

### Reply file convention (standing, 2026-11-12)

- When a specialist reply is returned as a file, the user writes it into the brief's own file — same path, replacing the brief. The orchestrator treats that file as the acquired reply (Harvest's file rung) and moves it into the round record (`round-<k>/replies/`) as usual; the replaced brief needs no copy, since processed briefs are deleted anyway under cleanup-after-yourself.

### Cleanup (standing)

- cleanup-after-yourself: yes — processed relay briefs and temporary files are deleted once their replies are integrated (the vault numbered brief files, inbox buffers, scratch); replies, findings and harvest artifacts are cleaned up too once their round is closed and the records carry their content; only the repo's committed artifacts and the gitignored lane machinery (probes/) survive.

### Declarations on GitHub (standing)

- every declaration addition is mirrored into this master (`declarations.TD.md`) and pushed right after the edit — the machines adopt by pulling; the master's repository: https://github.com/vasyapym/orchestrate (its local clone: ~/Documents/orchestrate)
