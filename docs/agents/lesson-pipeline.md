# Script lesson — fast Practice Map lesson pipeline

Trigger: the owner says **"script lesson {topic}"** (or «конвейерный урок {тема}»). This is the fast track for generating a Practice Map lesson with the relay chat model. **No fixed template.** The lesson is a free-form long-form Russian essay — whatever structure the chat model chose is the accepted structure; the orchestrator does not force the lesson-iteration skeleton (`Часть 0`, `K.1–K.5`, closing parts) onto it. That skeleton is the deep track's choice (`lesson-iteration` skill), used only when the owner explicitly asks for the full quality loop; not applying it is the default and needs no approval.

## Steps

1. **Sync.** `git pull --ff-only origin main`. Read `agent2/RELAY-kubernetes-lesson-log.md` for recorded pipeline decisions and any open topic log; create a per-topic log beside it if the topic continues across sessions.
2. **Prompt.** Compose the minimal relay prompt from the template below (fill `{TOPIC}`, `{ENVIRONMENT}`; drop what the owner's request already covers) and hand it to the owner to paste into the chat model. Completion criterion: the owner returns the reply.
3. **Salvage.** Save the reply as `portfolio/projects/practice-map/lessons/NNN-<topic>.md` (`NNN` = highest existing number + 1; never overwrite) with only light integration edits: fix the `#` title if needed, repair obvious markdown damage, keep the author's structure untouched. The reply is raw material: lift its strongest prose, discard fragments that do not fit, but do not reshape the whole. Verify runnable claims against the chosen environment where feasible; mark what was not executed. Depth bar (content, not structure): mechanisms explain their internal state and causal «почему», rules name their boundaries, no invented quotations or benchmark numbers.
4. **Meta + wire.** Add an `<!-- lesson-meta: {json} -->` comment at the top (`id`, `title`, `summary`, `concepts`, `tier`, `complexity`, `practicePrompt`, `checkPrompt`, `references`) — the orchestrator authors this from the content; it is the area-wiring payload.
5. **Convert.** `node scripts/convert-lesson.mjs lessons/NNN-<topic>.md` (or `--json` for inspection). The script is the source of truth for conversion rules; `--selftest` must pass. Completion criterion: `blocks` counts match the source, no unbalanced-fence error, fences (if any) get real titles via `--titles` sidecar.
6. **Wire.** Add the area to `portfolio/projects/practice-map/web/curriculum.ts` using the real card schema (`TopicCard`, `DeepLesson`); paste the emitted `const <topic>Sections` and build the topic card from lesson-meta. Preserve unrelated content.
7. **Validate.** Run the repo's typecheck/build for the portfolio shell and `portfolio/projects/practice-map/tests/practice-map.check.mjs`; fix what the integration broke. Report unexecuted examples honestly.
8. **Record + deliver.** Append one project-graph node (kind `iteration`, actor `zcode`, artifact pointing at the lesson path), update the topic log, and give the owner a Russian delivery note (lesson path, area, checks run, leftovers).

## Prompt template (minimal — length is routing)

```
comprehensive code - напиши лонгформ-эссе-урок {TOPIC} для двойной аудитории: новичок свободно входит в тему, опытный получает механизм, предсказание и диагностику; проза ведёт, команды и артефакты только там где раскрывают механизм, всё воспроизводимо на {ENVIRONMENT}; пиши на максимальную длину
```

The chat model has no repo access, no tools, no memory of prior rounds. If its reply arrives thin or truncated, deepen instead of padding: a follow-up round carrying the salvaged state verbatim (the essay as it stands, what is missing) — spend length freely there.

## Salvage notes

- **Free-form is the contract.** The chat model's structure wins. Sections may be thematic, numbered, or unnumbered; the converter handles any `##`-sectioned markdown. Do not restructure unless the owner asks.
- The chat model's reply may come back in unexpected shapes. Never paste a reply wholesale into the repo beyond the light integration edit; the published `lessons/NNN-<topic>.md` is the source of truth — never improve only the converted copy.
- Example titles/explanations are content, not mechanics: the converter only carries them from the sidecar (`--titles <file>`, 1-based fence index → `{title, explanation}`).
- `agent2/` is untracked working space: briefs, logs, sidecars. Nothing from it is ever staged.
