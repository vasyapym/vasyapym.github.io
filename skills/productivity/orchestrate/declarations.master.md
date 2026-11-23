# Orchestrate declarations: master (`declarations.master.md`)
Source of truth for every machine. A machine's `~/.config/orchestrate/declarations.md` = §1 verbatim + its §2 entry + the §3 entries of its projects. Owner-owned; the agent fills in what a session settles. Adopt by pulling this repo.

## 1. Common block

### 1.1 Capacities (names change anytime)
- creative: the owner picks the model per brief; Fable 5.1 max or Fable 5.2 max preferred, Fable 5.5 Opus max less so, high-reasoning variants less often. Complex tasks, architecture, visual decisions.
- creative timeout: ~10 minutes per reply; briefs must fit it: small asks, staged replies over one large draw (owner, 2026-11-13).
- iterative: Sol 6.1; review, debugging, bug-fix back-and-forth, general tasks (as of 2026-11-10).
- gentle: Astra-6; debugging without Sol's harshness; doubles as creative (owner, 2026-11-13).
- reviewer: astra-6.2; very thorough ("autistic"), excellent bug-finder; salvage selectively, never adopt 100% of its output (owner, 2026-11-20).
- docs/general: fable-5.2; senior-developer register, not overly thorough; under-edits like a guest unless the brief carries the ownership grant (owner, 2026-11-20).
- runner: Claude Sonnet 5.5; a relay like Sol 6.1 (the owner carries briefs to a Sonnet chat and pastes replies back), unlimited access; ~60 KB per brief, split longer relays by deliverable. For the most trivial mechanical chores that need new text (docs-page re-syncs, README lines, boilerplate), in place of subagents on the session's own model; saves tokens and time (standing, 2026-11-12).

### 1.2 Briefs
- ownership grant: one short sentence, "we own the codebase, rewrite freely", nothing more; no style lectures to specialists (owner, 2026-11-20).
- cite, don't paraphrase: when the owner's phrasing is clear, quote it, as phrases, not wholesale copy-paste; awkward paraphrasing only makes it worse (owner, 2026-11-15).
- no topic anchors: no topic fact lists («topic anchors») in briefs unless the owner asks; a creative reads them as desirable even when they are not instructions (owner, 2026-11-15).
- facts: gathered by a smaller model (the orchestrator's own tier, below the relay Creative), never trusted at 100%; the author is told to verify; Facts sections stay very minimal, the orchestrator is prone to verbosity (owner, 2026-11-19).
- exact text never relays: text already on disk (drafted replacements, harvested artifacts) is placed by command from disk; a relay round-trip only re-exposes it to chat transport mangling.
- opener: appended to every brief besides the standard chat-model instruction; the concrete window is stated in the brief's output contract (owner, 2026-11-14): «There's a <N–M>-minute time limit for you to output your answer — i.e. thinking even shouldn't last over that time period. After that there's a hard stop which is not graceful — unfortunately, your progress gets lost. It seems to me that the only solution is for you to output even if the result seems unfinished to you, because the priority for you is to finish on time, not to dwell thinking about finer details and nuances. The other reason for that is diminishing returns on time spent — your answer will be good enough if you spend thinking on the task either 15 or 40 minutes. 1. If you output only partly then that can be continued in a new session, which is better than nothing. 2. If you output as specs then the mechanical writing of code can be done by the orchestrator (a smaller model which sets the task and then integrates, tests it).»
- window: the likelier a task runs long, the SHORTER the window: light 10–15 minutes, heavy 6–10; judged per brief (owner, 2026-11-14, after a full diagnosis reply was lost to the creative hard stop).

### 1.3 Replies and transport
- collapsed paste: eaten line breaks are never guessed back in the main session; the restore is briefed to Sonnet 5.5 (a chat model like the Creative relay) with the collapsed bytes and the byte-authoritative originals in the brief; a raw-file export from the chat stays the preferred path when it exists. Relay pastes arrive collapsed (3/3 on 2026-11-19): plan the restore round by default; the restored artifact returns as ONE line with ⏎ break markers, decoded mechanically after the cut.
- reply carriage: creative capacities (creative, gentle) ALWAYS carry the artifact between the markers as ONE physical line, every break replaced by the marker character the brief dictates (⏎ has served), decoded mechanically after the cut; a simple ask for a creative, and a one-line artifact loses nothing. ALL capacities now carry artifacts the same ONE-line way (the transport eats line breaks 4/4 — 2026-11-23, the sq-facade round; the owner's word); a normal-text reply is the exception only for trivial asks with nothing to place (owner, 2026-11-14, 2026-11-23).
- reply file: a reply returned as a file is written by the owner into the brief's own file (same path, replacing the brief); the orchestrator takes it as the acquired reply (Harvest's file rung) and moves it into `round-<k>/replies/`; the replaced brief needs no copy, cleanup deletes it anyway (standing, 2026-11-12).

### 1.4 Integration and verification
- integration: the orchestrator applies integrated changes in the working tree itself, the declarations master clone included: "it always has been you" (owner, 2026-11-16, 2026-11-20). Git delivery is separate, per repo (§2, §3).
- verification: anything non-trivial a runner produced is verified by the orchestrator before it counts (diffs reviewed, specs checked); decisions, brief wording and acceptance stay with the orchestrator.
- trivial: lessons and other trivial deliverables go without byte-check and without heavy verification of that kind: save and report.
- cleanup-after-yourself: yes. Processed relay briefs and temporary files (the vault numbered brief files, inbox buffers, scratch) are deleted once their replies are integrated; replies, findings and harvest artifacts once their round is closed and the records carry their content; only the repo's committed artifacts and the gitignored lane machinery (probes/) survive.

### 1.5 Conduct
- mid-task: answer the owner's messages, then continue the interrupted work.
- docs text: documentation and handoff texts are English, very minimal; the agent is usually overly verbose and bad at words (owner, 2026-11-19).
- screenshots: when a round needs the owner's eye on screenshots, build a VERY SIMPLE static HTML page (labeled before/after figures, no build step), serve it locally on a free port (never 4173/4175) and hand over the URL; file paths alone are not enough (owner, 2026-11-16).

### 1.6 Declarations
- mirror: every declaration addition goes into the master `declarations.master.md` right after the edit; the orchestrator writes the local clone itself; machines adopt by pulling. Repository: https://github.com/vasyapym/orchestrate.
- skill repos (vasyapym/orchestrate, vasyapym/bytecheck): the owner commits and pushes them himself, or asks for it explicitly; vasyapym/orchestrate: the agent commits and pushes always (owner, 2026-11-23).
- runner (Windows TD): `C:\Users\v.argunov\agent-runner\` — the worker script + the clone; Scheduled Task `AgentRunner` fires every ~20 min (interactive logon, one instance, 4 h cap); mailbox: private `vasyapym/agent-jobs` (`jobs/open` → `jobs/done`). Unrestricted shell jobs by the owner's design (2026-11-23): per-command timeout (default 180 min), audit-echo of every command, `jobs/PAUSED` stop, the `%JOB%` token. Heavy work (e2e/bakes/agent sessions) is delegated here from the owner's MacBook via the mailbox.

## 2. Machines
Keys read at session open: `briefs` (default brief folder; empty: the skill asks each session), `rounds` (unset: the brief folder; may name another directory), `bytecheck` (tool path), `byte-check` (standing answer always | never; unset: the skill asks), `obsidian` (vault).

### 2.1 Windows TD: `C:\Users\v.argunov`
- projects: TD, vasyapym.github.io.
- master clone: `C:\Users\v.argunov\Documents\GitHub\orchestrate`
- subagents: opencode-go/glm-5.3-flash only; every sub-agent runs on it; other models are chat models (relay targets), not sub-agent models (owner, 2026-11-13).
- powershell scripts: plain ASCII .ps1 files, no nested @() array literals (they flatten); count occurrences with IndexOf/LastIndexOf, never Split; PS 5.1 reads BOM-less .ps1 as ANSI, so no non-ASCII literals (owner, 2026-11-23). Native stdout through a pipeline re-encodes UTF-8 as cp1251/866 — byte-copy diffs via cmd `>` + UTF8.GetString, never `git diff | Out-String` (owner, 2026-11-23).
- obsidian: `C:\Users\v.argunov\Desktop\TD Vault git\`
- briefs (any non-TD work): `C:\Users\v.argunov\Desktop\TD Vault git\03-1_projects\briefs` (owner, 2026-11-20). Brief numbering is one lineage across all brief folders.
- bytecheck: (unset)
- byte-check: never. The tool stays off; the salvage-integrate word-exactness diff (fidelity-diff) runs only when a reply's formatting must be rebuilt by hand (flattened paste); the owner can veto per round.
- diff .md: always saved in the same folder as briefs.
- before-after: with every integration deliverable also save a «Было / Стало» .md beside the briefs: the same file region verbatim before and after, as copy-paste blocks without line numbers inside (owner, 2026-11-17).
- git, per repo (owner, 2026-11-19, 2026-11-20):
 - project trees (traktorodetal.ru's git, www3, every other project folder on this computer): never.
 - mimo (`C:\Users\v.argunov\Documents\mimo`): normal git; the agent commits and pushes at session end.
 - vasyapym.github.io: the agent commits and pushes at round close, without asking (§3.2).
 - skill repos: the owner (§1.6); vasyapym/orchestrate — the agent commits and pushes always (owner, 2026-11-23).

### 2.2 Mac: `/Users/vasilij`
- master clone: `~/Documents/orchestrate`
- briefs: `/Users/vasilij/Documents/vasyapym-Vault/03_projects`. Each session works in a per-project, per-date subfolder (`<project>-<date>`, created on first use); round folders (`round-<k>/replies/`) live beside the briefs there; the subfolder IS the session's working directory: code excerpts, probe/reproduction outputs, brief source scratch and every other session file live there; repos stay free of session scratch (2026-11-13).
- bytecheck: `/Users/vasilij/Documents/bytecheck/bytecheck.py`
- byte-check: (unset)
- rounds: (unset)

### 2.3 Mac (new laptop): `/Users/vasyapym`
- new laptop (owner, 2026-11-24): all projects live here over time; §2.2 is the previous Mac.
- master clone: `~/Documents/orchestrate`
- obsidian: `/Users/vasyapym/Documents/vasyapym-Vault`
- briefs: `/Users/vasyapym/Documents/vasyapym-Vault/03-1_projects` (owner, 2026-11-24). Sessions work in per-project, per-date subfolders beside the briefs; the subfolder IS the session's working directory: code excerpts, probe outputs, brief scratch; repos stay free of session scratch.
- bytecheck: (unset — the tool is not installed on this laptop yet)
- byte-check: (unset)
- rounds: (unset)

## 3. Projects

### 3.1 TD: traktorodetal.ru, the spares/Bitrix catalog work (Windows TD)
- briefs: `C:\Users\v.argunov\Desktop\TD Vault git\01_TD content & code v6\TD content & code v7` (owner, 2026-11-17; briefs 1–8 stayed in the v5 "_spares guard round" folder, 9 onward here).
- rounds: `C:\Users\v.argunov\TD rounds\spares guard round\`. Round machinery (round folders with manifests, replies, harvest, files) lives OUTSIDE the Obsidian vault, whose git push choked on it; briefs and diff .md files stay in the vault (owner, 2026-11-13).
- references: www3 = `C:\Users\v.argunov\gitlab\fff\www3`, Bitrix kernel reference copy; read-only; sub-agent questions only; cite as reference facts, never repository facts.
- reply carriage: when the owner names TD for the session or brief, every artifact to be placed travels as ONE physical line (§1.3), whatever the capacity.
- scope (narrows §1.4 integration): the agent's work ends at the deliverable in the briefs folder: the round's deliverable files, not limited to /spares/index.php; the owner applies it to the tree later, himself.
- commit/MR byte-check: none. The owner commits and deploys himself; the agent never byte-checks commits, MRs or prod state (owner, 2026-11-18).

### 3.2 vasyapym.github.io
- tree: Windows TD `C:\Users\v.argunov\Desktop\agent2\vasyapym.github.io`; Mac `~/Documents/luna2/luna2`.
- tree (new Mac, 2026-11-24): `~/Documents/vasyapym.io` — the same repo (`vasyapym/vasyapym.github.io`), folder renamed on the new laptop; all projects live there over time (owner).
- obsidian (Windows TD): `C:\Users\v.argunov\Desktop\TD Vault git\03-1_projects` (owner, 2026-11-19).
- briefs (Windows TD): the non-TD folder (§2.1), since brief 21 (owner, 2026-11-19).
- delivery: every round close commits and pushes its own paths plus the project-graph node WITHOUT waiting for an owner request: «make it so that you always commit and push in this repository» (owner, 2026-11-16). Staging stays by path name; unrelated foreign changes are never touched; failures, conflicts or missing auth stop and report instead of forcing the delivery.
- lesson briefs: other lessons are never taken into account: no paths, titles or openings from the lessons corpus enter a lesson brief, and the orchestrator adds no commentary of its own to a brief (owner, 2026-11-19, after the sibling-openings experiment in brief 25).

### 3.3 hermitage-3d
- tree: Windows TD `C:\Users\v.argunov\Desktop\agent2\hermitage-3d` (a real git repo with CI on push).
- new Mac (owner, 2026-11-24): sessions and briefs already run from this laptop's vault; the tree moves here over time (all projects live on the new laptop). First clone pending.
- briefs (Windows TD): the non-TD folder (§2).
- delivery: the round's own paths committed and pushed at round close, without asking (owner, 2026-11-23, after a session left the round undelivered and a second agent read it as foreign unaccepted changes). Staging stays by path name; unrelated foreign changes are never touched; failures, conflicts or missing auth stop and report.
- windows: the repo's Ops laws are the Mac reference machine's — here the win64 shell with NO override; the chain needs ZIMNY_BLENDER + the ktx bin on PATH (agent2 dirs, owner, 2026-11-23).