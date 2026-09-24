# Script lesson — fast Practice Map lesson pipeline

Trigger: the owner says **"script lesson {topic}"** (or «конвейерный урок {тема}»). This is the fast track for generating a Practice Map lesson with the relay chat model. **No fixed template.** The lesson is a free-form long-form Russian essay — whatever structure the chat model chose is the accepted structure; the orchestrator does not force the lesson-iteration skeleton (`Часть 0`, `K.1–K.5`, closing parts) onto it. That skeleton is the deep track's choice (`lesson-iteration` skill), used only when the owner explicitly asks for the full quality loop; not applying it is the default and needs no approval.

## Steps

1. **Sync.** `git pull --ff-only origin main`. Read `agent2/RELAY-kubernetes-lesson-log.md` for recorded pipeline decisions and any open topic log; create a per-topic log beside it if the topic continues across sessions.
2. **Prompt.** Compose the minimal relay prompt from the template below (fill `{TOPIC}`, `{ENVIRONMENT}`; drop what the owner's request already covers) and hand it to the owner to paste into the chat model. Completion criterion: the owner returns the reply.
3. **Salvage.** Save the reply as `portfolio/projects/practice-map/lessons/NNN-<topic>.md` (`NNN` = highest existing number + 1; never overwrite) with only light integration edits: fix the `#` title if needed, repair obvious markdown damage, keep the author's structure untouched. The reply is raw material: lift its strongest prose, discard fragments that do not fit, but do not reshape the whole. Verify runnable claims against the chosen environment where feasible; mark what was not executed. Depth bar (content, not structure): mechanisms explain their internal state and causal «почему», rules name their boundaries, no invented quotations or benchmark numbers. Verification hygiene: check config/doc claims with `curl -s <url> | grep <flag>` or delegate the whole fact-check to a sub-agent that returns only the verdict; never webfetch or print a whole file into context — a raw dump is a context sink; no local environment → mark the claims not executed and move on.
4. **Meta + wire.** Add an `<!-- lesson-meta: {json} -->` comment at the top (`id`, `title`, `summary`, `tier`, `complexity`, `practicePrompt`, `checkPrompt`, `references`) — the orchestrator authors this from the content; it is the area-wiring payload. **Do not author `concepts`.** Lesson cards never display concepts and no reader code reads them (`TopicCard.concepts` is a dead field); write `"concepts": []` to satisfy the TS schema and move on.
5. **Convert.** `node scripts/convert-lesson.mjs lessons/NNN-<topic>.md` (or `--json` for inspection). The script is the source of truth for conversion rules; `--selftest` must pass. Completion criterion: `blocks` counts match the source, no unbalanced-fence error, fences (if any) get real titles via `--titles` sidecar.
6. **Wire.** `node scripts/wire-lesson.mjs --lesson lessons/NNN-<topic>.md --sections <emitted.ts> --theory <snippet.ts> --topic-id <id> --area-title T --area-description D --tier <tier>` (`--dry` to preview; `--curriculum`/`--tiers` to point elsewhere). The script emits the lesson's section array as its own lazy chunk (`web/lesson-data/<topic-id>.ts`, loaded by `web/lessons-loader.ts` on first open — the page bundle stays lean), splices the eager `const <base>Topics` (topic card **without** `deepLesson`), assembles the `TopicCard` from lesson-meta plus the theory snippet, and updates `curriculum.ts` and the tier's areas in `tiers.ts`. The only thing the orchestrator authors is the theory snippet (~1–2 KB: `problem`/`model`/`mechanics`/`pitfalls`/`whenNot`, object body without braces); the essay and the emitted TS never re-enter the orchestrator's context. `--selftest` covers the splice on fixtures; a re-run against wired files is rejected. Preserve unrelated content.
7. **Validate.** Run the repo's typecheck/build for the portfolio shell and `portfolio/projects/practice-map/tests/practice-map.check.mjs`; fix what the integration broke. Report unexecuted examples honestly.
8. **Record + deliver.** Append one project-graph node (kind `iteration`, actor `zcode`, artifact pointing at the lesson path), update the topic log, and give the owner a Russian delivery note (lesson path, area, checks run, leftovers).

## Prompt template (minimal — length is routing)

```
comprehensive code - напиши лонгформ-эссе-урок {TOPIC} для двойной аудитории: новичок свободно входит в тему, опытный получает механизм, предсказание и диагностику; проза ведёт, команды и артефакты только там где раскрывают механизм, всё воспроизводимо на {ENVIRONMENT}; пиши на максимальную длину
```

The chat model has no repo access, no tools, no memory of prior rounds. If its reply arrives thin or truncated, deepen instead of padding: a follow-up round carrying the salvaged state verbatim (the essay as it stands, what is missing) — spend length freely there.

## Operational notes (fast path — from the erykah-badu round, 2026-09-24)

- `convert-lesson.mjs` must be called with `--name <base>Sections` — wire-lesson's regex requires the suffix; remember `<base>`, wire derives the topics const from it.
- The theory snippet is a **TS object body**, not YAML: `problem: "…", model: "…", mechanics: "…", pitfalls: ["…", …], whenNot: "…"`, one line per string; match the sinners card's style in `curriculum.ts`. `problem: >` scalars break the splice.
- **New tier** = add the row to `tiers.ts` manually, in display order, with `areas: []` (wire appends the area; pre-filled areas make it fail with "already in tier"). Wire cannot create tiers. If the tier's position shifts existing rows, re-sync the check's positional gates (`.pg-tier-list button:nth-child(N)`, `nth-last-child(1)` = thinking tier) and run `portfolio/probes/tier-order-probe.mjs` **from `portfolio/`**.
- Full (non-skipping) check: `CHROME_PATH="$HOME/Library/Caches/ms-playwright/chromium-1134/chrome-mac/Chromium.app/Contents/MacOS/Chromium" node projects/practice-map/tests/practice-map.check.mjs` from `portfolio/`.
- If a wire run fails mid-way: `git restore curriculum.ts tiers.ts`, `rm web/lesson-data/<topic-id>.ts`, re-add the tier, re-run. A re-run against wired files is rejected by design.

## Salvage notes

- **Free-form is the contract.** The chat model's structure wins. Sections may be thematic, numbered, or unnumbered; the converter handles any `##`-sectioned markdown. Do not restructure unless the owner asks.
- The chat model's reply may come back in unexpected shapes. Never paste a reply wholesale into the repo beyond the light integration edit; the published `lessons/NNN-<topic>.md` is the source of truth — never improve only the converted copy.
- Example titles/explanations are content, not mechanics: the converter only carries them from the sidecar (`--titles <file>`, 1-based fence index → `{title, explanation}`).
- `agent2/` is untracked working space: briefs, logs, sidecars. Nothing from it is ever staged.
- Context economy: bulky artifacts (configs, emitted TS, diffs, snapshots) live in files under `/tmp` or `agent2/` and are inspected with `grep`/`diff`/`sed -n` or handed to a sub-agent; anything printed into the orchestrator's own context should be ≤ a few KB.
