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

reply carriage: any specialist's artifacts may travel as ONE physical line — every break the marker character the brief dictates (⏎ has served) — decoded mechanically after the cut; standing for TD (traktorodetal.ru), a simple ask for a creative.

## Project lines

### Who plays each capacity (names change anytime; the skill uses these afterwards)

- creative: Fable 5.1 — complex tasks, architecture, visual decisions
- creative timeout: ~10 minutes per reply (owner, 2026-11-13) — briefs to the creative must be answerable inside that window: keep asks small, prefer staged replies over one large draw.
- iterative: Sol 6.1 — review, debugging, bug-fix back-and-forth, general tasks

(as of 2026-11-10)

### Delegated trivial work (standing, 2026-11-12)

- runner: Claude Sonnet 5.5 — a relay capacity like Sol 6.1: the user carries briefs to a Sonnet chat and pastes replies back; access is unlimited.
- use for: the most trivial and mechanical chores that need new text written — docs-page re-syncs, README lines, boilerplate — in place of subagents on the session's own model, to save tokens and time.
- exact-text placement never relays: when the text already exists on disk (drafted replacements, harvested artifacts), it is placed by command from disk; a relay round-trip would re-expose it to chat transport mangling for no benefit.
- verification: the orchestrator verifies anything non-trivial a runner produced before it counts — diffs reviewed, specs checked; decisions, brief wording and acceptance stay with the orchestrator.

### Extra opener lines appended to every brief, besides the standard chat-model instruction

- (none yet)

### Default brief folder (optional; if empty, the skill asks each session)

- briefs: /Users/vasilij/Documents/vasyapym-Vault/03_projects — each session works in a per-project, per-date subfolder (`<project>-<date>`, created on first use if missing); round folders (`round-<k>/replies/`) live beside the briefs in that subfolder; the subfolder IS the session's working directory — code excerpts, probe/reproduction outputs, brief source scratch and every other session file live beside the briefs there, repos stay free of session scratch (2026-11-13)

### Byte-check standing answers (optional; the skill reads these at session open)

- bytecheck: /Users/vasilij/Documents/bytecheck/bytecheck.py
- byte-check: (unset — the skill will ask; standing answer: always | never)
- rounds: (unset — default: the brief folder; may name another directory)

### Reply file convention (standing, 2026-11-12)

- When a specialist reply is returned as a file, the user writes it into the brief's own file — same path, replacing the brief. The orchestrator treats that file as the acquired reply (Harvest's file rung) and moves it into the round record (`round-<k>/replies/`) as usual; the replaced brief needs no copy, since processed briefs are deleted anyway under cleanup-after-yourself.

### Cleanup (standing)

- cleanup-after-yourself: yes — processed relay briefs and temporary files are deleted once their replies are integrated (the vault numbered brief files, inbox buffers, scratch); only the repo's committed artifacts and the gitignored lane machinery (probes/) survive.
