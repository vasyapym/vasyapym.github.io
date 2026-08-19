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

## Agent skills

### Issue tracker

Issues and specs for this repo live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles map directly to `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo: read root `CONTEXT.md` and `docs/adr/` for domain context and decisions. See `docs/agents/domain.md`.

## Response preferences

- Explain code and technical changes in simple Russian unless the user asks for another language.
- The user is currently learning programming and experimenting. Explain every block of code as if they are a beginner, somewhat comprehensively. Use the `teach` skill (the repository's learning skill) when teaching programming concepts.

## Git delivery preferences

- For completed code or documentation changes, automatically run the relevant checks, commit only the task's changes, push the branch, open a pull request targeting `main`, and merge it when checks and repository permissions allow. Do not wait for a separate git instruction.
- If pull-request tooling is unavailable but direct Git push works, fast-forward the local `main` branch to the tested branch and push `main` to `origin` instead of stopping solely because the PR tool is missing.
- Never include `.DS_Store`, unrelated files, or changes made by another agent. Stop and report failures, conflicts, missing authentication, or branch protection instead of forcing a merge.

## Delivery fallback note

В предыдущей сессии использовался способ доставки без `gh` и без PAT:

- если PR-инструмент доступен — создать PR и выполнить merge;
- если `gh` отсутствует, но `git push` работает — безопасно выполнить fast-forward в `main` и отправить `main` в `origin`.

Локальный merge был выполнен так:

```text
5a6872d..b26a898 main -> main
```

Результат был отправлен на GitHub:

```text
main -> origin/main
```

PAT не понадобился: существующая Git-аутентификация позволила выполнить push. `.DS_Store` не добавлялись. PR не создавался, потому что использовался прямой безопасный merge в `main`.

## Workflow principles

1. **Iterate — don't one-shot.**
   Quality is built up over passes, not produced whole on the first attempt. Treat every deliverable as improvable and work with that assumption baked in: aim for a solid version, then sharpen it, rather than staking everything on a single perfect output. But iteration is refinement, not reinvention — each pass should build on the last, not discard it and start from zero. When you resume or modify work, orient yourself first: read the git history, the handoff files, and prior notes so you're extending the existing trajectory instead of restarting it.

2. **Simplify before you patch.** *(When the task allows it.)*
   Before fixing a local issue, look for a way to make the surrounding structure simpler and more consistent, so the fix settles naturally into what's already there. Prefer a change that fits the existing shape over one that bolts on a hack, duplicates logic, or carves out a special case. A fix that leaves the whole cleaner than it found it is worth more than one that only closes the immediate gap.

3. **Think in the open, twice, before you execute.**
   For any non-trivial task, produce a long, thorough piece of writing in three parts — first a brainstorm, then a design plan, then a plan of execution — in flowing prose, not bulleted fragments. Do not begin the task itself. Stop after the writing and wait until it has been read and you've been told to proceed.

   This matters most in a fresh context: once a path is chosen, the alternatives stop being considered, so the choice deserves deliberate attention up front. Accept that there is a real element of variance in what any single attempt produces — the same prompt can yield very different results from one run to the next. So don't trust a single pass to have found the best route.

   The practice: run the brainstorm / design-plan / execution-plan cycle twice, independently (by independently I mean not in one output and not in a row because it will not be useful if so), and carry both through to two implementations. Then compare them against each other. The premise is that for any given problem there exists one optimal approach; the point of generating and comparing divergent attempts is to close in on it and implement it, rather than settling for the first thing that came out.

4. **Every time you change a file, push and open a pull request using an authentication token.**
