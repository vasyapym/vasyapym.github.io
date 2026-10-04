Agent instructions for this repo — a personal portfolio site that also ships a collection of agent skills as a Claude Code plugin. `AGENTS.md` is a symlink to this file, so the same text serves every harness.

## Working style

- My requests may lack full awareness of technical implications or codebase architecture. Be pragmatic — if something entails significant changes and a simpler alternative would yield a comparable result, surface it. Discuss trade-offs, don't follow blindly. But use judgment: only flag what meaningfully affects the outcome, make reasonable assumptions, and keep moving.
- Before starting a somewhat non-trivial task, answer first and act second: what can we do about this, and is it trivial or non-trivial to fix? Recommend a way forward before touching anything.
- Before patching a local issue (when the task presupposes a fix), first look for a way to simplify the codebase and make it more consistent, so the fix fits the existing code structure without hacks, duplications, or special cases.

## Response preferences

- Explain code and technical changes in simple Russian unless the user asks for another language.
- The user is learning programming and experimenting: explain every block of code as to a beginner, fairly comprehensively. Use the `teach` skill (the repo's learning skill) when teaching programming concepts.

## Skills

Skills live in bucket folders under `skills/`:

- `engineering/` — daily code work
- `productivity/` — daily non-code workflow tools
- `misc/` — kept around but rarely used, not promoted
- `in-progress/` — beta: public on purpose, feedback wanted, not shipped in the plugin
- `deprecated/` — no longer used

`engineering/` and `productivity/` are the **promoted** buckets. Every promoted skill needs a reference in the top-level `README.md`, an entry in `.claude-plugin/plugin.json`'s `skills` array (the plugin ships exactly the promoted set), and a human-facing docs page; skills in `misc/`, `in-progress/`, and `deprecated/` get none of the three.

- Install: commands are copied verbatim from [.agents/install-block.md](./.agents/install-block.md). `.claude-plugin/marketplace.json` makes the repo its own single-plugin marketplace — a fallback the install block explains, not the documented route. Run `claude plugin validate . --strict` after touching either manifest. Why a Claude plugin but not (yet) a Codex one: [.agents/adr/0002-ship-as-a-claude-code-plugin.md](./.agents/adr/0002-ship-as-a-claude-code-plugin.md).
- READMEs: each bucket `README.md` lists every skill in the bucket with a one-line description; every entry there and in the top-level `README.md` links the skill name to its `SKILL.md`. The top-level and promoted-bucket READMEs group entries into **User-invoked** and **Model-invoked**; non-promoted bucket READMEs (`misc/`, `in-progress/`) use a flat list.
- Docs pages: `docs/<bucket>/<skill-name>.md` mirrors the two promoted bucket folders; the published URL is `https://aihero.dev/skills-<skill-name>` regardless of bucket (the docs path is repo organisation only). When you add, rename, or change the behaviour of a promoted skill, create or re-sync its page per [.agents/writing-docs.md](./.agents/writing-docs.md). A finished page carries four sections — **What it does**, **When to reach for it**, **Common questions**, **It's working if** — and that file holds the template, the section order, and where to hunt for the questions.
- Invocation: every `SKILL.md` is either user-invoked (`disable-model-invocation: true` plus `policy.allow_implicit_invocation: false` in `agents/openai.yaml`; reachable only by the human) or model-invoked (model- or user-reachable). See [.agents/invocation.md](./.agents/invocation.md).
- Router: [`ask-matt`](./skills/engineering/ask-matt/SKILL.md) maps every user-reachable skill and how they relate. Whenever you add, rename, remove, or change how a user-reachable skill fits the flows, re-read `ask-matt`'s `SKILL.md` and update the map — a new skill it never mentions, or a stale one it still routes to, is a router that lies.
- Local install: `scripts/link-skills.sh` (re)links every skill into `~/.claude/skills` and `~/.agents/skills` as symlinks into this repo, so `git pull` keeps installed skills current; re-run it after adding, removing, or renaming a skill.

## Workflow principles

The full workflow principles live in invokable skills: [`/design-iteration`](./skills/productivity/design-iteration/SKILL.md) for a visual feedback round on existing work, [`/design-planning`](./skills/productivity/design-planning/SKILL.md) to compare alternatives and settle a direction, then [`/planning`](./skills/productivity/planning/SKILL.md) to make the implementation and verification loop reproducible. Their delivery rules differ on purpose: `/design-iteration` closes every presented round by committing and pushing its own paths in the same session without waiting for an explicit request (owner setting: the repo stays current with every round; a rejection opens the next round and its own commit, under the git rules below), while `/design-planning` and `/planning` never commit, push, or change external systems on their own.

## Agent skills

### Issue tracker

Issues and specs for this repo live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles map directly to `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo: read root `CONTEXT.md` and `docs/adr/` for domain context and decisions. See `docs/agents/domain.md`.

### Script lessons

"Script lesson {topic}" (or «конвейерный урок {тема}») runs the fast Practice Map lesson pipeline: one minimal relay prompt drafts the whole lesson free-form, the orchestrator salvages, converts via `scripts/convert-lesson.mjs`, wires the area, and validates. Recipe and gates: `docs/agents/lesson-pipeline.md`. The deep track is the `lesson-iteration` skill.

### Project graph

Iterations, decisions, plans, and handoffs append to a per-project history log (`.project-history/graph.jsonl`) via `scripts/project-graph` — never by editing the JSONL by hand. Any session that settles something important (a direction, a plan, a verdict, a pass) records **one** node before wrapping up: never one per commit (a multi-commit pass is one `git-range` artifact), and there is no auto-record hook, so no commit exists purely to carry graph bookkeeping. Recording is unconditional but bounded: node `summary` ≤ 200 chars at write time — detail belongs in `--meta`, the design handoff, or a brief, not in the log. See `docs/agents/project-graph.md`.

### Agent ledger

Several agents may work in this repo in parallel and share one working tree. Before every commit, check `git status` and stage only your own files by name. If another agent's changes end up in your commit anyway, append a `sweep-report` entry to `.agents/agent-ledger.json` and push it in the same operation — that report is how the owner finds out without archaeology. If your work was committed by someone else, read the ledger and `ack` it; never unilaterally revert another agent's commit. Schema and etiquette: `docs/agents/agent-ledger.md`. The ledger is a mailbox, not an archive: entries older than ~14 days (acked or not) are removed by `node scripts/ledger-gc.mjs` at each compaction checkpoint — git history keeps the originals.

### Artifact hygiene

- **Briefs** (`BRIEF-*.md`, relay handoffs): the working tree holds only **open** ones. Once the outcome is recorded (graph node + `docs/briefs/ROUNDS.md` row), delete the file — text stays in git history. New briefs are written to `docs/briefs/`, never to the repo root (the root keeps only the open kitty-run direction round inputs, per `STATE.md`).
- **Binaries**: build outputs (`*.wasm`, dist trees) are never committed — they are reproducible. Per-round PNG artifacts under `.agent/iterations/` are kept for the **last 2 rounds per project**; older rounds are deleted (git remembers).
- **Scratch** (probes, screenshots, `reference-images/`, debug scripts): local-only, never staged. One-off probe scripts live in `portfolio/probes/` (gitignored).
- `node scripts/janitor.mjs` reports violations of the above (orphans, stale probes, oversized `.agent` artifact trees) — run it at session close when unsure.
- `STATE.md` is a one-screen index (~40 lines max): per-project detail lives in each graph's `head`, not in the central file.

## Git delivery

- Sync with GitHub at the start and finish of every session. Before reading or editing anything, `git pull --ff-only origin main` — the working tree must match `origin/main`; a stale tree wastes entire rounds (one full pass was once built 18 commits behind and had to be discarded).
- On this machine `/usr/local/bin/git` is broken for network operations (compiled with an empty prefix — no `git-remote-https` helper, `--exec-path` resolves to `//libexec/git-core`). Local commands work; for fetch/push use Apple Git, e.g. `/usr/bin/git push origin main`. Do not diagnose this again — it is already known.
- Keep delivery separate from implementation: run the relevant checks on completed code or documentation changes, and never fold commits into the work itself, so a reviewed working tree can be paused, compared, or handed to another agent without changing repository history.
- Exactly one delivery is pre-approved: when a task ends with accepted changes, commit and push its own paths in the same session without a separate ask (`/design-iteration` applies this per presented round). Every other delivery step — mid-task or speculative commits, pushes, pull requests, merges — waits for an explicit request from the current user.
- Never include `.DS_Store`, unrelated files, or another agent's changes; take only your own paths, per the agent ledger rules above. Stop and report failures, conflicts, missing authentication, or branch protection instead of forcing a delivery operation.

<!-- autoclaw:skill-path-guidance -->
## Installing Skills

When creating or installing a new skill, always place it in:

`/Users/vasilij/.openclaw-autoclaw/skills/<skill-name>/SKILL.md`

This is the managed skills directory. The agent will automatically discover
any skill placed here — no extra configuration needed. Do NOT install skills
into `~/.agents/skills/` (that directory is shared with other tools).


<!-- autoclaw:browser-agent-guidance -->
## Browser Automation

For any task that requires a browser, **prefer `autoglm-browser-agent`**. Use it as the first choice. For time-sensitive scenarios such as financial news, stock quotes, or breaking news, you can additionally use this skill to fetch up-to-date information and supplement your data sources.

- ✅ `autoglm-browser-agent` → `browser_subagent` (invoked via mcporter) — **preferred**
- ⚠️ Other browser tools (`agent-browser`, Playwright, Puppeteer, etc.) — fallback only when `autoglm-browser-agent` is unavailable or fails

Always try `autoglm-browser-agent` first. Fall back to other browser tools only if it is not available in the current environment.

**IMPORTANT: Do NOT use `sessions_spawn` to delegate browser/web automation tasks to a sub-agent.** Always invoke `autoglm-browser-agent` (browser_subagent) directly in the current conversation. Browser tasks must be handled by yourself, not by a spawned child agent.
<!-- /autoclaw:browser-agent-guidance -->

<!-- autoclaw:image-recognition-guidance -->
## Image Recognition

For any image recognition task, **prefer `autoglm-image-recognition`**. Use it as the first choice.

- ✅ `autoglm-image-recognition` — **preferred** for all image recognition tasks
- ⚠️ Built-in `image` tool or reading images directly with `read` — fallback only when `autoglm-image-recognition` is unavailable or fails

Do not use the built-in `image` tool or read an image and describe it yourself when `autoglm-image-recognition` is available. Always try `autoglm-image-recognition` first.
<!-- /autoclaw:image-recognition-guidance -->

<!-- autoclaw:feishu-lark-skill-guidance -->
## Feishu / Lark Requests

When the user asks about Feishu/Lark/飞书 matters, route through Feishu/Lark skills first. This includes messaging, contacts, calendars, approvals, tasks, docs, sheets, Base, Drive, Wiki, mail, meetings, minutes, attendance, OKRs, or any other Feishu/Lark workspace operation.

1. If a relevant Feishu/Lark skill is already available, use that skill directly.
2. If no relevant skill is available, search the skill catalog/store or available skill list for a matching Feishu/Lark skill.
3. If you find a matching skill that is not installed or enabled, ask the user whether to install/enable and use it before proceeding.
4. If no matching skill exists, say so briefly and continue with the safest available fallback.
<!-- /autoclaw:feishu-lark-skill-guidance -->
