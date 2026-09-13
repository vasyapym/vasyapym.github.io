# Passes — scope trim + free-reading typography + copy pass

## Pass C001 — VERIFIED (typecheck + browser probe scope)
- Objective and scope: owner's five asks — (1) gap between the free-reading focus bar and text with zero focus-shift, (2) prose↔textarea typography unification (iOS ≥16px guard kept), (3) scope-creep removal — summary-strip quantity tiles (whole strip removed incl. "cards", per the model's justified call), filter-chip row, "n applied · n revisit" area count, plus the owner's follow-up: "practice path" and "feedback" details removed from lesson cards, (4) plain hero copy replacing "concepts mapped. progress marked.", (5) post-removal rhythm + copy surfaces (project.ts description, root README row+section, portfolio/README tree line).
- Acceptance criteria: all six from the brief (docs/briefs/BRIEF-practice-map-scope-trim.md), with the follow-up additions above.
- Changes:
  - `web/PracticeMapPage.tsx` — hero copy replaced; summary strip, export button (+copied state, handleCopyFeedback, reviewNotes), filter chips (+STATUS_FILTERS, StatusFilter, statusFilter state/props, statusCounts), "practice path" details, "feedback" details removed; per-card status select kept; dead imports pruned.
  - `web/practice-map.css` — summary/chips/area-count/details/feedback CSS blocks deleted; `.practice-reader-section > p` gets a constant 12px left gutter + 16px/1.72 type; `li` rule aligned (16px/1.72).
  - `web/lib/freeReading/freeReading.css` — `.fr-area`: constant `padding-left: 0.75rem` (bar occupies 0–3px, ~9px clear gap), color `--ink-text` → `--ink-muted` to match prose.
  - `portfolio/projects/practice-map/project.ts` — description rewritten to the trimmed product.
  - `README.md` — table row + section rewritten; `portfolio/README.md` tree line rewritten.
- Baseline: typecheck PASS before edits; browser check environment has no system Chrome but playwright chromium-1134 exists (previously believed absent).
- Verification:
  - Command: `npm run typecheck` (portfolio)
    Result: PASS, exit 0.
  - Command: `CHROME_PATH=…chromium-1134/…/Chromium node projects/practice-map/tests/practice-map.check.mjs`
    Result: 93 ok / 1 fail — `ArrowRight advances sections` is the documented pre-existing environment failure (chromium-1134 focus-on-nav-chip smooth-scroll quirk, HANDOFF-rust-lesson-migration.md); this diff touches no keyboard-nav/scrollspy code.
  - Command: ad-hoc probe (`/var/.../opencode/pm-probe.mjs`, 18 assertions on the live page)
    Result: PASS — hero copy exact; summary strip/export/chips/area-count/practice-path/feedback all absent; status select + concept chips stay; prose & textarea both 12px gutter / 16px font / 27.52px line-height / identical color; no inset bar unfocused, bar appears on focus, no padding shift on focus.
  - Command: `npm run build`
    Result: PASS (pre-existing chunk-size warning only).
  - Evidence: screenshots `/var/folders/8x/…/T/pm-probe2/*.png`.
- Final diff review: performed — no debug scaffolding, no orphaned selectors/symbols in the page; `practice-map-export` CSS removed with its button; unrelated files untouched. Explosion graph.jsonl's pre-staged lines belong to the designed one-commit-lag hook (declared in the commit message + ledger, per the standing pattern).
- Integration decisions (chat-model output as handed, with two splice calls):
  - Hero margin-bottom from the model's R6 note NOT applied: `.practice-map-layout` already carries `margin-top: clamp(3rem, 6vw, 5rem)`, so adding hero margin-bottom would double the gap; existing rhythm reads intentional (verified on screenshots).
  - The model's R6/R9/R11/R12 blocks spliced verbatim; its Notes 1–5 confirmed against the files and acted on (SummaryMetric deleted, status select kept, createInitialState kept for the reset).
- Design constraints: owner's copy-diet intent (Pass 20 precedent: no marketing chrome, lowercase mono), free-reading pivot intact, iOS zoom guard is law.
- Remaining risks/blockers:
  - `progress.ts` now carries unused exports (`toggleTopicFeedback`, `setTopicNote`, `formatFeedback`) and `curriculum.ts` keeps `FEEDBACK_LABELS`/`FeedbackKind` — data layer left intact deliberately (localStorage back-compat + owner's review-notes data survives); a later sweep can retire them if the owner confirms the feedback workflow is gone.
  - ArrowRight environment failure persists (pre-existing, documented).
  - Real-Safari / real-iOS visual confirmation of the new typography remains NOT RUN (emulator only).
- Next action: task complete pending owner review; offer design-iteration round if the hero copy or the strip-less rhythm needs a visual pass.
