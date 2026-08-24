Skills are organized into bucket folders under `skills/`:

- `engineering/` — daily code work
- `productivity/` — daily non-code workflow tools
- `misc/` — kept around but rarely used, not promoted
- `in-progress/` — beta: public on purpose, feedback wanted, not shipped in the plugin
- `deprecated/` — no longer used

Every skill in `engineering/` or `productivity/` (the **promoted** buckets) must have a reference in the top-level `README.md` and an entry in `.claude-plugin/plugin.json`'s `skills` array (the Claude Code plugin ships exactly the promoted set). Skills in `misc/`, `in-progress/`, and `deprecated/` must not appear in either.

Install commands are copied verbatim from [.agents/install-block.md](./.agents/install-block.md). `.claude-plugin/marketplace.json` makes the repo its own single-plugin marketplace — a fallback the install block explains, not the documented route. Run `claude plugin validate . --strict` after touching either manifest. Why a Claude plugin but not (yet) a Codex one lives in [.agents/adr/0002-ship-as-a-claude-code-plugin.md](./.agents/adr/0002-ship-as-a-claude-code-plugin.md).

Each skill entry in the top-level `README.md` must link the skill name to its `SKILL.md`.

Each bucket folder has a `README.md` that lists every skill in the bucket with a one-line description, with the skill name linked to its `SKILL.md`. The promoted buckets' `README.md`s and the top-level `README.md` group entries into **User-invoked** and **Model-invoked**; non-promoted bucket `README.md`s (`misc/`, `in-progress/`) use a flat list.

Skills in `engineering/` and `productivity/` also have a human-facing docs page at `docs/<bucket>/<skill-name>.md` (the docs tree mirrors those two bucket folders under `skills/`). The published URL is `https://aihero.dev/skills-<skill-name>` regardless of bucket — the docs path is repo organisation only. When you add, rename, or change the behaviour of a skill in `engineering/` or `productivity/`, create or re-sync its docs page following [.agents/writing-docs.md](./.agents/writing-docs.md). A finished page carries four sections — **What it does**, **When to reach for it**, **Common questions**, **It's working if** — and `writing-docs.md` holds the template, the section order, and where to hunt for the questions. Skills in the non-promoted buckets (`misc/`, `in-progress/`, `deprecated/`) get **no** docs page.

Every `SKILL.md` is either user-invoked (`disable-model-invocation: true` plus `policy.allow_implicit_invocation: false` in `agents/openai.yaml`, reachable only by the human) or model-invoked (model- or user-reachable). See [.agents/invocation.md](./.agents/invocation.md).

[`ask-matt`](./skills/engineering/ask-matt/SKILL.md) is the router that maps every user-reachable skill and how they relate. The same trigger that re-syncs a docs page applies to it: whenever you add, rename, remove, or change how a user-reachable skill fits the flows, re-read `ask-matt`'s `SKILL.md` and update it so the map stays accurate — a new skill it never mentions, or a stale one it still routes to, is a router that lies.

To (re)link every skill into the local harness skill directories (`~/.claude/skills`, `~/.agents/skills`), run `scripts/link-skills.sh`. Each entry is a symlink into this repo, so a `git pull` keeps installed skills current; re-run the script after adding, removing, or renaming a skill.

## Workflow principles

The former workflow principles were removed from this file in commit `cb6a358` with the intention of moving them into invokable skills. Use [`/design-iteration`](./skills/productivity/design-iteration/SKILL.md) for an existing visual feedback round, [`/design-planning`](./skills/productivity/design-planning/SKILL.md) to compare alternatives and settle a direction, then [`/planning`](./skills/productivity/planning/SKILL.md) to make the implementation and verification loop reproducible. These skills keep delivery explicit: they do not commit, push, open pull requests, or change external systems.

## Agent skills

### Issue tracker

Issues and specs for this repo live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles map directly to `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo: read root `CONTEXT.md` and `docs/adr/` for domain context and decisions. See `docs/agents/domain.md`.

### Project graph

Iterations, decisions, plans, and handoffs append to a per-project history log (`.project-history/graph.jsonl`) via `scripts/project-graph`. Any session that settles something important — a direction, a plan, a verdict, a pass — records one node before wrapping up, skill-invoked or not. See `docs/agents/project-graph.md`.

### Agent ledger

Several agents may work in this repo in parallel and share one working tree. Before every commit, stage only your own files by name; if another agent's changes end up in your commit anyway, append a `sweep-report` entry to `.agents/agent-ledger.json` and push it immediately — that report is how the owner finds out without archaeology. If your work was committed by someone else, read the ledger and `ack` it; never unilaterally revert another agent's commit. Schema and etiquette: `docs/agents/agent-ledger.md`.

## Response preferences

- Explain code and technical changes in simple Russian unless the user asks for another language.
- The user is currently learning programming and experimenting. Explain every block of code as if they are a beginner, somewhat comprehensively. Use the `teach` skill (the repository's learning skill) when teaching programming concepts.

## Git delivery preferences

- Run the relevant checks for completed code or documentation changes, but do not stage, commit, push, open a pull request, or merge unless the current user explicitly asks for that delivery step.
- Keep delivery separate from implementation so a reviewed working tree can be paused, compared, or handed to another agent without changing repository history.
- Never include `.DS_Store`, unrelated files, or changes made by another agent. Stop and report failures, conflicts, missing authentication, or branch protection instead of forcing a delivery operation.
- Several agents share this working tree. Check `git status` before staging and take only your own paths; if another agent's changes end up in your commit anyway, record a `sweep-report` in `.agents/agent-ledger.json` (see `docs/agents/agent-ledger.md`) and push it in the same operation.
