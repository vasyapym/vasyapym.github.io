TASK: author the four files of a new skill named `orchestrate` for a skills-collection repo, exactly as specified below. You have no repo access; everything needed is in this brief. Return the four files + notes; the orchestrator integrates, wires, validates, and commits.

CONTEXT (project): a personal portfolio site that also ships a collection of agent skills as a Claude Code plugin. Skills live under `skills/<bucket>/<name>/SKILL.md`; `productivity/` is a promoted bucket — it ships in the plugin, and each of its skills carries a human-facing docs page at `docs/productivity/<name>.md` that publishes at `https://aihero.dev/skills-<name>` (the docs path is repo organisation only).

Invocation register: the repo splits every skill into user-invoked (reachable ONLY by the human; frontmatter carries `disable-model-invocation: true`, and `agents/openai.yaml` carries `policy.allow_implicit_invocation: false`) and model-invoked (the default: reachable by model or human; frontmatter and yaml carry NO invocation markers; the description is model-facing with rich trigger phrasing so auto-invocation fires). `orchestrate` is model-invoked — the human still types `/orchestrate`, and the agent may also start the loop itself.

The new skill's substance is the owner's fixed relay protocol; the text below must land VERBATIM as the SKILL.md body (it is an authored artifact, not a draft — do not smooth, restructure, or extend it):

You are the orchestrator; Claude Opus, accessed through a separate chat, is a non-agentic specialist for reasoning, design, and coding. It has no repo access, tools, or prior task context, and is subject to context limits and timeouts. You own all repository reads/writes, final decisions, and integration.

Inspect first: establish the relevant repo state, structure, problem, constraints, and conventions. Consult pertinent handoff notes, prior decisions, and design history.

Give me exactly one self-contained, copy-paste-ready brief at a time. I paste it into the specialist chat and return its response; wait for that response. Each brief must:
- State the task, constraints, conventions, and acceptance criteria.
- Supply minimum sufficient context: exact relevant file excerpts, interfaces/dependencies, and pertinent history, decisions, or prior results. Omit unrelated material.
- Bound both input size and requested work/output to fit context and timeout limits. Split large tasks into sequential deliverables, carrying needed results into each new brief.
- Define an explicit output contract: required artifacts, format, and target files/locations where applicable.

Include in every brief: "Before answering, challenge key assumptions, consider a credible alternative, and check likely failure cases; give the requested output with concise rationale and any material uncertainties."

Salvage-integrate each response—never paste wholesale. Check it against the repo and requirements; retain useful parts, correct or reject the rest, and validate the integrated result. Prepare the next brief from the actual repo state and validation results. Repeat until complete; one brief may suffice for a small task. Report blockers and validation you could not perform.

Keep briefs in compact prose/bullets; avoid Markdown headings and tables except in the output contract.

Siblings you position against (true facts): `/minimize-iteration` — model-invoked; compresses a task into the shortest prompt that still delegates it, because the chat service routes prompts to models by token count ("length is routing") — a single compressed one-shot crossing. `/handoff` — compacts a whole conversation into a portable document. `/orchestrate` is the loop around designated-specialist work: the orchestrator session owns the repo, sends one self-contained brief at a time, salvage-integrates each reply (never pastes wholesale), validates, repeats. The router entry lands in the router skill's "## Standalone" section, adjacent to the minimize-iteration entry, whose shape is (verbatim):
- **`/minimize-iteration`** — compress a task into the shortest prompt that still delegates it to a separate chat model. The chat service routes prompts by token count — length is routing — so the prompt pays only for what the target model cannot infer (non-inferable specifics, the output contract, the reasoning bar), and the pasted reply is integrated against the repo afterwards. Model-invoked, so the agent fires it itself the moment a task is about to cross to a chat model.

Docs-page register (the template every docs page follows): order fixed — What it does → When to reach for it → [Prerequisites] → middle → Common questions → It's working if → Where it fits; no H1 (the published page takes its title from the slug); every link absolute, never relative; never name the author; explain why, not process (the page never reproduces SKILL.md steps); the defining constraint stated as plain prose, never a labelled aside ("The defining constraint:" reads as filler); branches as a table or a list, never a paragraph; a brand-new skill has no observed reader questions, so "Common questions" carries 2–4 plainly-asked ones only, honest count; every "It's working if" bullet checkable without opening SKILL.md; surface the skill's leading words — here: the self-contained brief, and salvage-integration; Prerequisites exists only when something is genuinely needed, omitted entirely otherwise; AI Coding Dictionary terms link their first use to `https://www.aihero.dev/ai-coding-dictionary/<slug>` (slug = term lowercased, non-alphanumerics as hyphens; never inside a heading, code span, or existing link); the fixed frame is What it does / When to reach for it / Where it fits. For register reference, the minimize-iteration page's invocation-mode line reads: "You can invoke it by typing `/minimize-iteration`, and it is model-invoked — the agent reaches for it on its own whenever a task is about to cross into a chat model that has no tools and no repo". The docs page may say "a separate chat model" generally; the "Claude Opus" phrasing stays in SKILL.md only.

`agents/openai.yaml` register (Codex UI metadata; exactly this shape, values yours):
interface:
  display_name: "Design Iteration"
  short_description: "Refine interfaces via append-only feedback rounds"

HARD CONSTRAINTS (non-negotiable; everything else is yours to decide and disclose):
- SKILL.md: frontmatter carries exactly `name: orchestrate` and `description:` — nothing else. Body = the owner's text above verbatim, under a `# Orchestrate` H1. Description is model-facing trigger prose; it must NOT collide with minimize-iteration's trigger — orchestrate fires when the owner names the specialist, hands back a specialist reply to integrate, or the work is too large or design-heavy for one pass; a single compressed one-shot crossing stays with minimize-iteration.
- Docs page: no H1, absolute links only, no author naming, no install commands, fixed section order; neighbours linked absolutely with because-clauses; ends pointing at [ask-matt](https://aihero.dev/skills-ask-matt) as the router over the whole set.
- yaml: interface block only (display_name, short_description) — no policy block.
- Router entry: 2–4 sentences in the example's shape, ending with the model-invoked fact; the minimize-iteration boundary in one clause.
- Decide and disclose: Prerequisites yes/no; question count; the middle section's heading(s); whether the docs table lists handoff; the router entry's exact placement sentence.
- Likely failure cases to weigh: paraphrasing the verbatim body; relative links slipping into the docs page; naming the author; padding questions; a trigger description that swallows minimize-iteration's crossings; a docs page that copies SKILL.md steps as process dump. Choose the failure budget consciously.
- Be pragmatic: if a simpler treatment yields a comparable result, prefer it and say why.
OUTPUT CONTRACT — reply with exactly one fenced code block; inside it, sections in this order:
1. ## files — the four complete artifacts, each preceded by a plain one-line label with its exact target path: `skills/productivity/orchestrate/SKILL.md`; `skills/productivity/orchestrate/agents/openai.yaml`; `docs/productivity/orchestrate.md`; router entry (a fragment for `skills/engineering/ask-matt/SKILL.md`, ## Standalone section).
2. ## notes — ≤8 bullets: the description line you chose and why; decided behaviors (Prerequisites, question count, middle headings, neighbours); material uncertainties; the one credible alternative you rejected, with the reason.
Before answering, challenge key assumptions, consider a credible alternative, and check likely failure cases; give the requested output with concise rationale and any material uncertainties.
