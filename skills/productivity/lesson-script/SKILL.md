---
name: lesson-script
description: Fast relay lesson for Practice Map — one chat-model round, salvage, convert, scripted wiring.
disable-model-invocation: true
argument-hint: "Topic, e.g. Redis caching — optionally with the chat-model essay already in hand"
---

# Lesson script

Fast track for a Practice Map lesson: one relay round to a chat model drafts a free-form Russian essay **together with its integration payload** (practice prompt, check prompt, theory); this runbook salvages mechanically, converts, and wires it. The recipe and gates live in `docs/agents/lesson-pipeline.md`; the deep, quality-looped track is `/lesson-iteration`. Run only when explicitly invoked; the argument is the topic, and an essay pasted by the owner replaces the relay round.

## Context economy

The essay must never pass through the agent's context: the owner's reply is written straight to the lesson file, and the agent reads only converter diagnostics (counts, warning lines), editing by grep targets. Bulky artifacts (emitted TS, diffs) live in `/tmp` or `agent2/` and are inspected with `grep`, `diff`, `sed -n`, or handed to a sub-agent that returns only the verdict; anything printed into this run's own context stays ≤ a few KB. Verify doc/config claims with `curl -s <url> | grep <flag>` — a full-file webfetch is a context sink. No local environment (e.g. no `redis-server`) → mark the claims not executed and move on. The `curriculum.ts`/`tiers.ts` schemas live in `scripts/wire-lesson.mjs`; read neither file.

## What is authored where

The chat model (relay round) authors the human payload appended to the essay: `practicePrompt`, `checkPrompt`, and the theory object (`problem`/`model`/`mechanics`/`pitfalls`/`whenNot`). `wire-lesson` derives everything else mechanically: `id` from the filename slug, `title` from the H1, `summary` from the first paragraph, `tier: 1`, `complexity: 4`, `references: []`, card id `<id>-full`, area title/description from title/summary. The orchestrator authors nothing. A non-representative first paragraph (e.g. a spoiler warning) is fixed at wire time with `--summary` — a one-off rescue flag, not a relay-contract item. A legacy full-meta lesson (all fields in the comment) wires unchanged — explicit meta wins over derivation.

## Ordered steps

1. **Sync.** `git pull --ff-only origin main` (network ops via `/usr/bin/git`). Read `agent2/RELAY-*lesson-log.md` for pipeline decisions; create a per-topic log beside them if the topic continues across sessions. Done when: tree matches origin.
2. **Relay.** Skip when the owner already brought the essay (with its payload blocks). Else compose the minimal relay prompt from the template in `docs/agents/lesson-pipeline.md` and hand it over for the owner to paste into the chat model. Done when: the owner returns the reply.
3. **Salvage.** Save the reply as `portfolio/projects/practice-map/lessons/NNN-<topic>.md` (`NNN` = highest + 1, never overwrite). The reply carries the payload blocks (`<!-- lesson-meta: {"practicePrompt":…,"checkPrompt":…} -->` and `<!-- lesson-theory: {…} -->`); move them to the top of the file mechanically and keep the essay untouched. Light edits only where diagnostics point: fix the `#` title, repair markdown damage flagged by the converter (`unbalanced **`, `### remnants`), correct claims verified against primary sources. Do not author summary/prompts/theory. Done when: the file parses as comments + essay and wire's pre-flight accepts it; every changed fact is recorded in the topic log.
4. **Convert.** `node scripts/convert-lesson.mjs --selftest`, then emit TS to `/tmp/<topic>-sections.ts` and read only the report tail. Done when: tail section/block counts match the source and there are no unbalanced fences; `--titles` sidecar only when fences exist.
5. **Wire.** `node scripts/wire-lesson.mjs --lesson <md> --sections /tmp/<topic>-sections.ts --tier <tier>` — add `--front` for an English lesson (EN-first rule: EN areas lead the tier's list; Russian lessons append by default). Optional overrides: `--topic-id`, `--area-title`, `--area-description`, `--summary`, `--complexity`, `--references`. Use `--dry` to preview. Done when: it prints `wired: …` and the next-step commands; a re-run rejects the already-wired state.
6. **Validate.** In `portfolio/`: `npm run typecheck && npm run build`, then `node projects/practice-map/tests/practice-map.check.mjs`. The no-Chrome skip is an expected pass. Done when: all green or each failure fixed/reported.
7. **Record + deliver.** Append one project-graph node (kind `iteration`, summary ≤ 200 chars, details in `--meta`), update the topic log, and give the owner a Russian delivery note (lesson path, area, checks run, leftovers). Stage only own paths — `agent2/` is never staged; the closing commit+push of accepted work is pre-approved by the repo's git rules.

Work in Russian for everything the owner reads; keep the operating language of this file.
