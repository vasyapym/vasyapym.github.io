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

## Pass C002 — VERIFIED (typecheck scope)
- Objective and scope: integrate the long-context chat model's triage verdicts + polish review into the free-reading surface — the fixes that are correct by construction and verifiable here; record the deferred/decisive-experiment items.
- Acceptance criteria (this pass): iOS never auto-zooms a section note (font ≥ 16px); no silently clipped last line (overflow-y safety net); finishing a section latches (typed notes never regress progress); the beforeunload listener can't leak; the sticky bar's z-order is provably above textareas; a11y: per-section label + live progress region; check gains structural guards (overlay coverage incl. the 19-section Go lesson, auto-grow integrity, font threshold, persistence round-trip, pristine-cleanup, latch).
- Changes: freeReading css (`font-size: max(1rem, 16px)`, `overflow-y: auto` safety net, `.fr-visually-hidden`), FreeReadingText (visualViewport reveal-on-resize for the keyboard case, per-section label prop, unique-id live region described-by), useFreeReading (completed latch stored in the record; stable beforeunload/visibilitychange closures), storage (optional completed in validator; module-level stableSubscribe — no per-render resubscribe), PracticeMapPage (label wiring), check legs (6 new assertions).
- Baseline: typecheck PASS; browser check NOT RUN (no Chrome in this environment — unchanged limitation).
- Verification:
  - Command: `npm run typecheck` (portfolio/shell)
    Result: PASS, exit 0.
  - Browser check: NOT RUN (environmental; assertions added for the next Chrome-capable run).
- Final diff review: performed — no debug scaffolding; the §B.3 regression scenario is now covered by the latch + a check assertion; §B.9 (stale-record removal) REJECTED with reason: removing the record would remove the note's trigger (stale derives from the record's presence), so the note could never be shown — the note stays until the next edit overwrites the record.
- Design constraints: owner's pivot intact; salvage rules (fittable fragments only; no blind swaps of the proven scroll-lock).
- Remaining risks/blockers:
  - Bug 4 (Safari overlay void): shell untouched — decisive experiment (pre-scroll to bottom → open Go lesson; correlate with scrollY) documented; the check now asserts overlay coverage in Chrome as a regression guard. Real-Safari verification pending.
  - Bugs 1–2: structurally moot (machinery deleted); decisive experiments documented for a real-Safari session.
  - Toggle-cost measurement (§A.3): pending real profiling; mitigation paths (startTransition / virtualization) noted, not applied.
  - Word-multiset coarse duplicate counting: mitigated by the latch for the finish case; mid-reading duplicate notes can still shift the count slightly — accepted.
- Next action: real-browser verification round (Chrome for the check, Safari for the decisive experiments) when tooling is available; otherwise task-level close with the checks above as NOT RUN items.
