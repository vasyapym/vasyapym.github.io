## Pass C001 — VERIFIED (data + gates, full chromium scope)
- Objective and scope: owner's folder-grouping ask — tiers with 8+ lessons fold into the approved folder (volume) design; every lesson of a foldered tier sits in exactly one folder (no orphans); folder names/groupings authored by the chat model with autonomy (relay rounds Q3 → Q4 of minimize-iteration3).
- Acceptance criteria: (1) the six 8+ tiers (astra-6-max 17, fable-5.1-high 16, fable-5.1-low 14, fable-5-high 9, opus-5.5-high 18, opus-5.5-medium 13) carry volumes covering 100% of their topics; (2) sub-8 tiers stay flat; (3) the existing thinking-tier folder UN design untouched; (4) all existing check gates pass on the new data.
- Changes:
  - `web/lib/tiers/tiers.ts` — volumes added to the six tiers from the chat model's Q4 scheme: a global 11-slug taxonomy (tech/film/music/literature/places/health/mind/science/society/language/games), folder order and assignments as the model authored (two draft slips of mine — Discworld-as-cinema, Darwin-as-mind in fable-5-high — the model's remap fixed by itself); topic ids resolved through the curriculum area→topics-const chain (not `<areaId>-full` guesses — most lessons predate that convention).
  - `tests/practice-map.check.mjs` — three "map renders" gates now expect `.pg-face-head` (first tier folds into faces) and enter the first folder before asserting cards; the Go leg clicks the tech face before the title-pinned card pick.
  - `docs/agents/lesson-pipeline.md` — wire step note: a foldered tier hides what is outside its volumes; future wire runs must add the wired topic id into one of the tier's volumes by hand.
- Baseline: typecheck/build/check green before edits; check.mjs skipped without Chrome at baseline.
- Verification:
  - Command: `node /tmp/pm3/integrate-volumes.mjs` (resolution + coverage gate)
    Result: PASS — per tier: every topic id resolved from curriculum, volumes' union == tier's topics, no dupes, no orphans (astra-6-max 8 folders, fable-5.1-high 6, fable-5.1-low 5, fable-5-high 8, opus-5.5-high 8, opus-5.5-medium 8 = 43 folders over 87 lessons).
  - Command: `npm run typecheck` (portfolio) — PASS, exit 0.
  - Command: `npm run build` — PASS (pre-existing chunk-size warning only).
  - Command: `CHROME_PATH=~/Library/Caches/ms-playwright/chromium-1134/…/Chromium node projects/practice-map/tests/practice-map.check.mjs`
    Result: "Practice Map check passed" — all gates green incl. new faces gates, Go leg via tech folder, thinking-tier pins unchanged (5 faces, vol 01 = 4).
- Final diff review: performed — no unrelated churn; thinking tier volume data untouched.
- Design constraints: owner's 8+ fold rule; approved R003 folder-face design reused as-is; chat-model autonomy for names/assignments (relay Q4, global-slug convention with documented failure-case notes: straddlers megapolis-culture/cannabis → society, dopamine-ibs → health; `society` to be split if it exceeds ~8 items; `tech` split candidate when it keeps growing).
- Remaining risks/blockers:
  - Future lesson additions to these six tiers are invisible until hand-added to a volume (documented in lesson-pipeline.md — the enforcement is procedural, not runtime).
  - Lesson card numbering (tier-wide 01..N) now follows folder order; visual sanity of the renumbered cards NOT RUN (no design-iteration round this pass; open .agent screenshots only).
- Next action: task complete pending owner review; design-iteration round offered if the renumbered card faces need a visual pass.

## Pass C002 — VERIFIED (batch wire, script-lesson fast track)
- Objective and scope: owner batch — 23 captured essays from `3_new_lEssons/` wired by lesson-script: `portfolio/projects/practice-map/lessons/104-…126-*.md` → one area + one `<slug>-full` card each, tier from the capture name; then volumes hand-slotting so the owner's folder rules hold (8+ tiers stay fully foldered; nothing orphaned).
- Changes:
  - `web/curriculum.ts` + 23 lazy chunks in `web/lesson-data/` + eager consts (wire-lesson runs: 104–126; EN lessons `--front`, RU 106/109/116 appended; author-side summary overrides passed for 15 lessons, derive for 112/113/117/119/122-outlined... derive held for 112/113/117/119, override passed for 122).
  - `web/lib/tiers/tiers.ts` — new ids appended into existing volumes; straddlers 104/124 (developer job-hunting) got a NEW global slug `career` (owner picked the recommended variant over society/tech): astra-6-max career [linkedin-evidence-package-full], opus-5.5-high career [profile-as-search-result-full]. opus-5-max stays flat (6 < 8) so 121 is intentionally vol-less.
  - `docs/agents/lesson-pipeline.md` — global slug set now reads …games/career.
- Verification: payload JSON of all 23 (zero straight quotes in values, pitfalls 7–10); coverage gate PASS (card/area/volume/areas-row counts, flat exception 121); typecheck/build/practice-map.check.mjs green — details and per-lesson rows in `agent2/RELAY-new-lessons-2026-10-log.md`.
- Design constraints: free-form essays untouched (open whale: one-section converters for 104/105/111/113/115/126 after ### and bold-lead promotion found none); no Chrome browser pass this round.
