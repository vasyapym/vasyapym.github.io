# minimize-iteration3 — relay results log

One row per relay round — task, prompt, outcome. Minimal-log rule (family
practice from `minimize-iteration2`): no transcripts, no A/B scaffolding; a row
that changes practice is paired with an edit to `SKILL.md` in the same pass.
Distilled practice lives there; git history keeps originals.

## Rounds

| round | task | prompt | outcome |
| --- | --- | --- | --- |
| Q1 | fill real resume data into a digital-card-api ts data file | docs/briefs/chat-model-prompt-42-profile-data-question-refine.md | worked first try (owner-carried): reply usable as near-final data file; the preceding instruction-style minimal prompt (in-chat, schema DSL + decisions menu, not saved) routed badly — its failure motivated this skill |
| Q2 | render the primary profile as a senior-developer minimal html card at / (nestjs controller) | docs/briefs/chat-model-prompt-43-card-html-draft.md | two-step: comment-header "bad code" payload failed to route (owner: router detects commentaries); the plain working draft — ugly, functional, comment-free — routed well first try. Practice: for rework asks ship runnable drafts, not described tasks |
| Q3 | folder scheme for six lesson tiers (tier → folder → lesson numbers) | docs/briefs/chat-model-prompt-44-tier-folders-question-refine.md | routed (html+css page payload, ~90 lessons), but the question named the wrong artifact: "better version of the page" got the page restructured (numbers resolved, ol→ul, links added) while the scheme survived untouched — reply usable only as a resolution check. Practice: the question must name the artifact whose quality is wanted, not the carrier that displays it; next round (prompt-45) names the folder scheme directly |
| Q4 | folder scheme for six lesson tiers, take two (neutrally renamed: tier-1..6, folder-1..N) | docs/briefs/chat-model-prompt-45-tier-folders-scheme-refine.md | worked: reply landed as the finished scheme — a global 11-slug taxonomy (tech/film/music/literature/places/health/mind/science/society/language/games), full remap of all 92 lessons with zero orphans, plus its own failure-case notes (straddlers, catch-all drift, big-bucket splits). Integrated verbatim into tiers.ts volumes; check.mjs adapted (3 map-renders gates + Go leg now enter a face first); typecheck/build/full chromium check green. The neutral rename (no real tier names, no semantic draft names) is likely what freed the model to design instead of comply |
