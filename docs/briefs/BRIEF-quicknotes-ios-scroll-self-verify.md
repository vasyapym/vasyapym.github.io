# BRIEF-quicknotes-ios-scroll-self-verify

Self-handoff (code-iteration → next own session). Owner device verdict: the
"list doesn't scroll to last element / scroll engages only after the header
leaves the screen" symptom is UNCHANGED by N009–N011 (dvh, --app-h, pin,
overscroll, text-size-adjust all deployed and confirmed served). Owner plan:
chat-model round first (different model, brief already issued), then THIS pass.

## Task

Fix the scroll symptom in quicknotes and verify it myself with screenshots
until it is fine. Do not touch the rest of the app.

## Evidence so far

- Header is a grid row (not fixed/sticky) — owner's sticky-header hypothesis
  rejected in N011, yet symptom persists ⇒ mechanism still unknown.
- Ruled out: text-size-adjust, overscroll chaining, focus reveal-scroll,
  --app-h sizing, vv offsetTop pin (all shipped, device-unaffected).
- Untested suspects, ranked: (1) `#sidebar` is `position:fixed` on mobile with
  `touch-action:pan-y` + drawer drag-close JS intercepting vertical pans —
  tree scroller may fight the drawer gesture code (js/drawer.js binds touch on
  the sidebar itself); (2) the LAST element hides under `env(safe-area-inset-
  bottom)` + `#tree` bottom padding (8px) — scrollHeight vs clientHeight math;
  (3) iOS Safari-specific: iframe host resizes/layout viewport during scroll
  (standalone vs catalogue card difference); (4) `.folder[open]` details
  re-render on `toggle` listeners resetting scroll position mid-gesture.

## Verification stack (available NOW)

- `~/Library/Caches/ms-playwright`: chromium-1134 AND webkit-2104 installed;
  `portfolio/node_modules/playwright-core` importable.
- Loop: serve `quicknotes/` on localhost → playwright webkit, iPhone viewport
  (390×844, touch, DPR 3) → seed ≥30 notes via localStorage injection →
  screenshot before/after scrolling each surface (#tree, #body, .preview) →
  assert last element fully visible (bounding-box check inside viewport,
  above safe-area padding) → iterate until green, keeping PNGs under
  `/var/folders/.../opencode/` (never staged).
- WebKit ≠ iOS Safari exactly: anything that passes here but the owner still
  sees broken → suspect the iframe/keyboard context, report with PNGs.

## Constraints

- Vanilla ES modules, tokens, no deps; DOM contract intact; desktop
  unchanged; do not revert the accepted font regression (N012).
- Gate must fail-before/pass-after on the specific mechanism fixed.

## Close

Pass N013 in quicknotes/.agent/iterations/code/fast-notes-app/passes.md +
graph node; commit+push only quicknotes paths; delete this brief once the
outcome is recorded (artifact hygiene).
