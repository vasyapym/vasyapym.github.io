# HANDOFF — practice-map: Rust lesson migrated; Symfony/Laravel lesson awaiting migration

Read after `STATE.md` + `CONTEXT.md`. Handoff from the lesson-iteration relay session (2026-09-11).

## Now

- **practice-map / Rust** — all six gates of `/lesson-iteration` executed via the two-model relay. Migrated: `lessons/002-rust.md` (source of truth) + new `rust` area, card `rust-zero-to-depth` in `web/curriculum.ts` (23 sections: intro `heading: null` + Части 0–20 + заключение; 64 examples; 16 «Как думают опытные» callouts; all 156 table rows converted to "term — meaning" lists with labeled clauses; 8-week table in the template's 4-column form). tsc clean, build ok. Graph nodes n17–n22.
- **practice-map / Symfony+Laravel** — full draft COMPLETE and audited (gates 1–4 passed): `agent2/DRAFT-php-frameworks-lesson-FULL.md` (~12.4k prose words, parts 0–20 + заключение; 16 traps, 5 models, booking scenario across two independent apps, ports 8001/8002, contracts 201/409/400). **Remaining work**: publish `lessons/003-symfony-laravel.md`, migrate into a new `php-frameworks` area in `curriculum.ts` (converter precedent: `agent2/convert-rust.py` + `agent2/rust-sections.ts`), then tsc/build/check. At migration: verify every URL marked «проверить» (only symfony.com/doc/7.4 and laravel.com/docs/11.x are pre-trusted), replace doctrine docs URL `…/en/current/…` with a versioned one. Plans/ledger: `agent2/PLAN-php-frameworks-lesson-parts-map.md`, `agent2/AUDIT-php-frameworks-lesson.md` (gates 1–4 passed; repairs R1–R7 already applied to the FULL draft).

## Open thread — ArrowRight keyboard check (practice-map)

`practice-map.check.mjs` gate `ArrowRight advances sections` FAILS on the **pre-existing Linux lesson-01 card**, with the Rust changes **stashed** too (proven not a Rust-migration regression). Environment-sensitive: repo gate was validated on chrome-headless-shell 153; this machine only has playwright chromium-1134, which behaves differently. Verified mechanics: trusted keypress reaches window; handler calls `scrollIntoView(6, smooth)`; the smooth scroll never starts **only when focus sits on the clicked nav chip**; identical synthetic events and same trusted key with focus on the close button work.

Next step for whichever session picks this: run the check under chrome-headless-shell 153 (or old config the gate was validated with). Green there → validate the Rust migration with it, record the flakiness as an owner note; still failing → real pre-existing regression from shell realm r8–r12 work since `4d90bff`, hand to the shell thread. Do not paper over it in the test or reader without understanding the focus/scroll interaction.

## Delivery note (gate 6, Rust)

- Lesson: `portfolio/projects/practice-map/lessons/002-rust.md`; area/card changed: `rust` / `rust-zero-to-depth` in `curriculum.ts`.
- Gates: planning ✓ (coverage ledger full), draft ✓ (~12.4k words), depth audit ✓, consistency audit ✓ (repairs R1–R8 applied, record `agent2/AUDIT-rust-lesson.md`), migration ✓, validation — tsc ✓ build ✓; browser check rendered Rust content fine except the pre-existing keyboard item above.
- Blockers/notes: doctrine version claims (1.90.0/edition 2024) are the lesson's fixed teaching baseline; Tokio version resolved by `Cargo.lock` only. Nothing committed unasked beyond this delivery.

## Where things live

- Relay artifacts: `agent2/PLAN-rust-lesson-parts-map.md`, `agent2/BRIEF-rust-lesson-{1..6}-*.md`, `agent2/DRAFT-rust-lesson-chunk-{1..5}.md` + `FULL`, `agent2/AUDIT-rust-lesson.md`, `agent2/convert-rust.py`, `agent2/rust-sections.ts`; same set for php-frameworks.
- Graph: `portfolio/projects/practice-map/.project-history/graph.jsonl` nodes n17–n21 (plan accepted → draft assembled → audits passed → draft complete → delivery).
- Working-tree leftovers NOT mine (leave alone): root `CLAUDE.md` edit, `portfolio/.project-history/graph.jsonl` uncommitted lines, r12 brief doc.
