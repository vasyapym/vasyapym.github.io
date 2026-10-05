# minimize-iteration3 — relay results log

One row per relay round — task and outcome, self-contained. Minimal-log rule
(family practice from `minimize-iteration2`): no transcripts, no A/B
scaffolding, no saved brief files — the chat transcript (and git history, once
a round's work is committed) is the prompt's only record; rows carry no prompt
paths. A row that changes practice is paired with an edit to `SKILL.md` in the
same pass. Distilled practice lives there; git history keeps originals.

## Rounds

| round | task | outcome |
| --- | --- | --- |
| Q1 | fill real resume data into a digital-card-api ts data file | worked first try (owner-carried): reply usable as near-final data file; the preceding instruction-style minimal prompt (in-chat, schema DSL + decisions menu, not saved) routed badly — its failure motivated this skill |
| Q2 | render the primary profile as a senior-developer minimal html card at / (nestjs controller) | two-step: comment-header "bad code" payload failed to route (owner: router detects commentaries); the plain working draft — ugly, functional, comment-free — routed well first try. Practice: for rework asks ship runnable drafts, not described tasks |
| Q3 | folder scheme for six lesson tiers (tier → folder → lesson numbers) | routed (html+css page payload, ~90 lessons), but the question named the wrong artifact: "better version of the page" got the page restructured (numbers resolved, ol→ul, links added) while the scheme survived untouched — reply usable only as a resolution check. Practice: the question must name the artifact whose quality is wanted, not the carrier that displays it; next round names the folder scheme directly |
| Q4 | folder scheme for six lesson tiers, take two (neutrally renamed: tier-1..6, folder-1..N) | worked: reply landed as the finished scheme — a global 11-slug taxonomy (tech/film/music/literature/places/health/mind/science/society/language/games), full remap of all 92 lessons with zero orphans, plus its own failure-case notes (straddlers, catch-all drift, big-bucket splits). Integrated verbatim into tiers.ts volumes; check.mjs adapted (3 map-renders gates + Go leg now enter a face first); typecheck/build/full chromium check green. The neutral rename (no real tier names, no semantic draft names) is likely what freed the model to design instead of comply |
| Q5 | digital-card-api profiles.data.ts rewrite: 3-paragraph about text + terse work-history bullets from owner-provided source blocks | routed first try (artifact = data file, sources = new about/work texts verbatim), but the reply polished wording and kept the old verbose achievements instead of the owner's terse ones, and folded org descriptions into bullets rather than a field — salvage took its join('\n\n') structure and NEFU rename, rejected the rewording, applied owner text by hand. Practice: owner-verbatim copy must survive the relay or be re-applied at integration; the shape carried structure fine but not "source wording wins" |
