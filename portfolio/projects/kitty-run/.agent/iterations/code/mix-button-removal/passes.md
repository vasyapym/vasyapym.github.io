# Passes — mix-button-removal (kitty-run)

## Pass C001 — VERIFIED
- Objective and scope: the "mix" header button and its three-slider mixer
  popover are removed entirely from the Cat Runner page; audio plays through
  the Sfx engine's own fixed bus levels; the mute button and both audio
  regression gates keep working.
- Acceptance criteria:
  - No `mix` button, no mixpanel/mixrow DOM, no `.kitty-run-mix*` CSS.
  - No audio-levels state or persistence plumbing left in the page
    (`AudioLevels`, `AUDIO_KEY`, `loadAudioLevels`, `changeAudio`, slider
    re-apply on wake, and the now-unused Sfx loudness setters).
  - Mute toggle unchanged; header click gates (audiobug, webkit-shift)
    updated to the new header contract and passing.
- Changes:
  - `web/KittyRunPage.tsx` — removed mixer state, slider plumbing, mix
    button + popover JSX; `ensureSfx` no longer re-applies persisted levels.
  - `web/lib/audio.ts` — removed the dead `setMaster/setSfx/setMusic` API
    and `apply()` helper; bus levels are the engine's fixed defaults.
  - `web/kitty-run.css` — removed `.kitty-run-mix`, mixpanel, mixrow rules.
  - `web/scene/RunCanvas.tsx` — comment now lists only (mute, hover).
  - `tests/kitty-run.audiobug.mjs` — dropped mix phases/rects; mute-only.
  - `tests/kitty-run.webkit-shift.mjs` — dropped mix clicks/rows.
- Baseline: audiobug pre-change run (unfixed tree, Chrome via CHROME_PATH):
  all 4 scenarios ok — harness healthy before the edit.
- Verification:
  - Command: `npm run typecheck` (portfolio) — PASS, exit 0.
  - Command: `node --experimental-strip-types tests/kitty-run.check.ts`
    (kitty-run cwd) — PASS, "All kitty-run checks passed".
  - Command: `CHROME_PATH=… node portfolio/projects/kitty-run/tests/kitty-run.audiobug.mjs`
    — PASS, 4/4 scenarios "all clicks leave the page still (both themes)".
  - Command: inline puppeteer DOM probe — `{"mix":0,"mute":1,"mixBtnText":0}`
    — mix button/panel absent, mute present.
  - NOT RUN: `tests/kitty-run.webkit-shift.mjs` — playwright npm package not
    installed in this environment (skips cleanly; WebKit engine unverified).
- Final diff review: no debug scaffolding, no secrets; stale localStorage
  key `kitty-run/audio/v1` is left orphaned by design (harmless, no cleanup
  code added).
- Design constraints: no design-ledger entries reference the mix control.
- Remaining risks/blockers: WebKit gate unverified locally (see NOT RUN);
  prior visitors' persisted custom mixes are no longer applied — the
  engine defaults always play.
- Next action: task complete pending delivery commit.
