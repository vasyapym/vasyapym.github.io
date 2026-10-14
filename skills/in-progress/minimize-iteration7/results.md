# minimize-iteration7 — relay results log

One row per relay round — task and outcome, self-contained. Minimal-log rule
(family practice from `minimize-iteration2`–`minimize-iteration4`): no
transcripts, no A/B scaffolding, no saved brief files — the chat transcript
(and git history, once a round's work is committed) is the prompt's only
record; rows carry no prompt paths. A row that changes practice is paired with
an edit to `SKILL.md` in the same pass. Distilled practice lives there; git
history keeps originals.

Founded 2026-10-12; the founding rounds ran in one orchestrator session across
two repos — an admin-only Bitrix PHP page (other repo) and the second-brain
design into the NestJS digital-card-api app (other repo). This skill carries
their distilled shape: `minimize-iteration3`'s question form scaled to large
verbatim payloads, with a decided-facts section replacing the working draft on
new-build design asks.

## Rounds

| round | task | outcome |
| --- | --- | --- |
| A1 | admin-only Bitrix PHP delete page (other repo): finished better version for the orphans workbook — question + two owner fact bullets (workbook structure and orphan-value semantics; verified Bitrix kernel behavior; backup/log file shapes; URL run modes) + the full ~800-line working draft verbatim | owner reports a clean draw: routed first try, reply usable (owner-carried — the reply stayed in the owner's chat, no orchestrator salvage pass). Verified the large-verbatim-payload scaling of the question form with zero instruction cargo; founded this skill |
| A2 | second-brain v1 design inside the existing NestJS digital-card-api app: question + verified-facts section (decided overrides: one Render free service ~730/750 h awake 24/7, waker and separate repo dropped, one Neon DB for card and vault tables, NestJS not FastAPI, indexer ships in the same repo at a pinned tag, pings must never wake Neon) + existing app code near-whole + the whole DESIGN.md verbatim | owner: "somewhat worked i guess" — routed, partially usable; the reply never returned to the orchestrator, so repair scope is unknown. The decided-facts section is the new-build variant of the working draft; it needs a second design draw before the shape is trusted for design-scale asks (see the SKILL.md scope guard) |
| B1 | second-brain M2 round 2a — offline shared layer (slug anchors, wikilink grammar, link keys, markdown renderer + 3 colocated specs) into digital-card-api: question + ~14 decided fact bullets + verbatim design §10.1/§10.2/§13 rows, NO code payload (owner asked for maximum shortening; the model recreated from scratch with full freedom) | owner ran it through two chat models and returned both replies; orchestrator merged the technically safer one (contextual rule typing, md.utils.escapeHtml, table/para-interrupt block rule) with the other's comment flavor, plus 3 hand fixes (\r in payload, empty-key guard, silent-branch dedup). 106/106 tests green, build clean, committed+pushed. Lesson kept: every brief line must be self-contained — one "style reference: the repo's files…" line leaked repo-knowledge into a repo-less model. Brief size 10.6→6.6 KB with no quality loss the owner could feel |
| B2 | second-brain M2 round 2b — vault parsing (parseNote frontmatter/tags/aliases/title, heading chunker with injected token counter, git -z parsers + 4 synthetic RU/EN fixtures + 3 specs): owner asked for pure-ASCII briefs — no Cyrillic, no ›/…/—/table pipes; fixtures left for the model to invent (2 Cyrillic + 2 EN, no real vault names); design §6.2/step 4/step 6 folded into facts | clean draw, one output: 129/129 tests green first run, build clean, committed+pushed (ac44424). One semantic hand-fix at integration: note links extracted from the codeless body (Obsidian ignores links inside code; no fixture delta). ASCII-only briefs are now the standing format; brief 6.1→4.8 KB |
| B3 | second-brain M2 round 2c — indexer runner (log/config/vault-files/plan/store/cli, embedder + transformers-embedder, 3 specs) + vault workflow YAML; ASCII brief with the workflow carried as an actual YAML block instead of prose | the reply had TWO production-breaking bugs the orchestrator caught at salvage: wrong MODEL_ID (intfloat/ instead of the pinned Xenova/) — local load would fail; store SQL with nonexistent columns (aliases/yaml_error) and missing keys/body — first real run would crash. Plus: parseNote args swapped (both strings — compiles, semantics inverted), 3-arg call of a 2-arg wrapper, redactError failing its own spec on a string error, unguarded tokenizer encode(). All fixed by hand at integration; 149/149 tests green, build clean, committed+pushed 534663c, README fixed + tagged v1.0.0. Lesson: glue/SQL rounds (no offline unit tests) need the orchestrator's line-by-line schema/API check — the model's confidence outruns its accuracy exactly there |
