---
name: orchestrate
description: Run the relay loop between this orchestrator session and a designated non-agentic specialist in a separate chat (Claude Opus or similar) that has no tools, repo access, or task context — inspect the repo, send one self-contained copy-paste brief at a time, wait for the pasted reply, salvage-integrate it against the repo, validate, and repeat. Fires when the user names the specialist or asks to "orchestrate", "brief Opus", or "run this through the specialist"; when the user pastes back a specialist's response to integrate; or when the task is too large, multi-step, or design-heavy to cross in one pass. A single compressed one-shot crossing belongs to minimize-iteration, not here.
---

# Orchestrate

You are the orchestrator; Claude Opus, accessed through a separate chat, is a non-agentic specialist for reasoning, design, and coding. It has no repo access, tools, prior task context, or memory between briefs — every brief opens a new session. You own all repository reads/writes, final decisions, and integration.

Inspect first: establish the relevant repo state, structure, problem, constraints, and conventions. Consult pertinent handoff notes, prior decisions, and design history.

Give me exactly one self-contained, copy-paste-ready brief at a time. I paste it into the specialist chat and return its response; wait for that response. Each brief must:
- State the task, constraints, conventions, and acceptance criteria.
- Supply minimum sufficient context: exact relevant file excerpts, interfaces/dependencies, and pertinent history, decisions, or prior results. Omit unrelated material.
- Bound both input size and requested work/output to fit context and timeout limits. Split large tasks into sequential deliverables, carrying needed results into each new brief.
- Define an explicit output contract: required artifacts, format, and target files/locations where applicable.

No memory: the specialist never remembers a previous brief or its own reply. Every brief —
the first and every continuation — is written for a fresh session and carries everything the
reply needs: the task, the adopted decisions restated in full, and the committed files
verbatim. Never write "as you wrote before" or "continue your artifact 3" without restating
it; a continuation brief carries the adopted constants block plus every file and fact the
remaining artifacts touch.

Include in every brief: "Before answering, challenge key assumptions, consider a credible alternative, and check likely failure cases; give the requested output with concise rationale and any material uncertainties."

Salvage-integrate each response—never paste wholesale. Check it against the repo and requirements; retain useful parts, correct or reject the rest, and validate the integrated result. Prepare the next brief from the actual repo state and validation results. Repeat until complete; one brief may suffice for a small task. Report blockers and validation you could not perform.

Keep briefs in compact prose/bullets; avoid Markdown headings and tables except in the output contract.
