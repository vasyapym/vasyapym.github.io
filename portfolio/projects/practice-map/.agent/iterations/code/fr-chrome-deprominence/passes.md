# Passes — practice-map · fr-chrome de-prominence

Task: owner (2026-09-21): remove the "✓ read through" line; make the
readthrough chrome quieter — darker title, tighter gaps (they take much
space). Related ledger: rebrand-hero F077 (toggle parity — OFF mode reserves
the fr-row's slot), F074/F082 (fr surface voice), F084 (measure cap).

## Pass C001 — VERIFIED
- Objective and scope: fr-mode chrome reads quieter and takes less room:
  (1) the fr-done "✓ read through…" line is gone; (2) the section title (h3)
  and its number drop a step in fr mode; (3) the fr-row (count + progress +
  reset) is tighter and its count is dimmed; F077 toggle parity preserved by
  re-deriving the OFF-mode slot to the new numbers.
- Acceptance criteria: no fr-done node in DOM; is-fr h3 color = --ink-muted,
  its span = --ink-faint; .fr-row min-height 1.1rem / margin-bottom 0.15rem /
  gap 0.45rem; .fr-count color --ink-muted; F077 rules use calc(1.1rem +
  0.15rem + 0.95rem); OFF↔ON toggle moves no paragraph (slot arithmetic).
- Changes:
  - `web/PracticeMapPage.tsx` — the fr-done conditional paragraph removed.
  - `web/lib/freeReading/freeReading.css` — .fr-row tightened (1.6→1.1rem
    min-height, 0.4→0.15rem margin-bottom, 0.6→0.45rem gap); .fr-count
    --ink-accent → --ink-muted; dead .fr-done rule removed.
  - `web/practice-map.css` — F077 OFF-slot re-derived: h3 padding-bottom and
    first-child margin-top = calc(1.1rem + 0.15rem + 0.95rem) (comment
    updated); added `.practice-reader-section.is-fr > h3 { color:
    var(--ink-muted) }` and `… h3 span { color: var(--ink-faint) }` — gated
    to is-fr so the OFF reader keeps its approved look (F062/F074 lineage).
- Baseline: typecheck/build green (pre-change, R004 state); check's Go-card
  failure reproduces on the stashed baseline (documented pre-existing,
  ledger R032/R006 — other agent's count drift, not this diff).
- Verification:
  - Command: `npm --prefix portfolio run typecheck` — PASS (tsc --noEmit).
  - Command: `npm --prefix portfolio run build` — PASS (vite build ✓).
  - Command: `CHROME_PATH=… node portfolio/projects/practice-map/tests/practice-map.check.mjs`
    Result: 70 ok / 1 fail — the fail is the documented pre-existing Go-card
    drift (reproduced on baseline via git stash); all 8 free-reading legs ok
    (controls, textarea, counter, Escape, 320px legs, no escapes).
  - Runtime smoke shot (probe `pm-fr-shot.mjs`, 1440×900@2x): fr-mode section
    head reads — darker muted title, dimmer number, compact quiet count row,
    no read-through line. Evidence:
    /var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/pm-fr/fr-section-head.png
- Final diff review: three files, no debug scaffolding, no secrets, no
  unrelated changes; fr logic (useFreeReading/reset/stale) untouched; the
  completion signal remains the count/progress bar.
- Design constraints: F077 parity kept (slot arithmetic re-derived, both
  modes move together); fr surface voice untouched (F074); measure cap
  untouched (F084).
- Remaining risks/blockers: visual taste = owner's verdict (title dimness,
  row tightness); the pre-existing Go-card check failure persists
  (out of scope, other agent's drift).
- Next action: task complete pending owner verdict; pass shipped at close.
