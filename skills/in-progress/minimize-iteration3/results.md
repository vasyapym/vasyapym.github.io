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
