# Passes — free-reading salvage (chat-model minimal relay, integrated)

## Pass C001 — VERIFIED (typecheck scope)
- Objective and scope: replace the exact-match "shadow typing" consumption machine in the Practice Map deep reader with a free, note-app-style editable section surface — manually delete read text, type freely, no per-letter matching or highlighting — per the owner's feature request; salvage-integrate the fittable fragments from the randomized routing chat model's FreeNote output (textarea editor core: local mirror, debounced persistence with flush on unmount/visibility/unload, free-typing input attributes, stats-driven progress row, auto-grow).
- Acceptance criteria (this pass):
  - The lesson bar toggles "free reading: on/off" per topic; off renders the rich prose as before.
  - On: each section's prose becomes a real `<textarea>` prefilled with the section's flattened prose (or the reader's previously saved text for the same content).
  - Deleting text moves a word-level progress measure (consumed/total words + progress bar); deleting everything reads 100%.
  - Typed notes persist to localStorage per section (debounced 300ms, flushed on blur, unmount, tab hide, unload); restoring pristine text clears the record.
  - Old exact-typing machinery fully removed; browser check legs rewritten to drive the new surface content-agnostically.
- Changes:
  - Added `web/lib/freeReading/` (types/text/storage/useFreeReading/FreeReadingText/FreeReadingControls/freeReading.css) — the css is actually imported by the component (the old module's stylesheet was never imported anywhere; its `.st-*` rules were dead).
  - Removed `web/lib/shadowTyping/` (7 files) and rewired `PracticeMapPage.tsx` (bar, settings record v2 without granularity, InteractiveSection without scrollspy focus ownership — no surface grabs focus on scroll anymore).
  - Rewrote the desktop + 320px free-reading legs of `tests/practice-map.check.mjs`.
- Baseline: typecheck PASS before edits (recorded earlier in session); browser check BLOCKED in this environment (no Chrome/Chromium on the machine — the check self-skips with "no Chrome/Chromium found").
- Verification:
  - Command: `npm run typecheck` (portfolio/shell)
    Result: PASS, exit 0 (one intermediate failure TS2304 useLayoutEffect — fixed by import; rerun green).
  - Browser check: NOT RUN — no Chrome/Chromium available (check exits gracefully; same environmental limitation as the pre-existing baseline).
- Final diff review: performed — no stale shadowTyping references; no debug scaffolding; unrelated files untouched (one pre-staged hook line from the explosion graph store ships with this commit per the designed one-commit lag; declared in the commit message + ledger sweep-report).
- Design constraints: owner's pivot verbatim ("manually delete text and type freely, like in a note app"); salvage rules from the minimize-iteration skill (integrate fittable fragments, leave the rest).
- Remaining risks/blockers:
  - Safari behaviors (the 4 reported bugs) are now structurally addressed by removing the hidden-input/beforeinput machinery, but NOT verified on Safari — no Safari automation in this environment. Bug triage round planned against a longer-context chat model.
  - The word-multiset progress measure tolerates free typing anywhere but counts duplicates coarsely (a removed word re-typed as a note reads as not-yet-consumed) — accepted trade-off for O(n) per keystroke.
- Next action: bug-triage + design-polish round with the longer-context chat model (brief prepared), then real-browser verification when Chrome/Safari tooling is available.
