# Prompt — randomized routing round, B3 fate-mode integration, spec-framed (paste verbatim)

comprehensive code - spec below, fill every RULE, deliver every DELIVER item.

FACTS:
- app: TypeScript strict + three.js, no framework.
- main.ts (329 lines): global `logt` (log10 s) advanced per frame; `evaluateState(logt)` → per-frame uniforms; bottom timeline scrub via `attachTimelineScrub(cb)`; engine object has `points`/`step(...)`/`resetTo(...)`.
- new fate engine exists: `new FateParticles(renderer, mode, {particleCount})`, `.points`, `.step(requestDeltaTau) → {actualDeltaTau, terminal}`, `.resetTo(mode)`, getters `.a`/`.tau`; mode ∈ {heatDeath, bigRip, bigCrunchClosed, bigCrunchLambda, vacuumDecay}; its clock is Hubble-times, NOT logt.
- exported from src/fates.ts: `fateProgress(mode, τ)`, `tauFromProgress(mode, frac)`.

RULES:
- R1 fate mode is OFF by default; past-history behavior bit-identical when off.
- R2 enter: user gesture from the past timeline's end; leave: returns to the past timeline, engine disposed or parked.
- R3 fate timeline: own scrub mapped through fateProgress/tauFromProgress; drives engine.step via the progress delta; pause/speed keys shared with the past mode.
- R4 bigCrunch terminal → rebirth epilogue: flash, HUD line "the universe is born again", then restart the fate clock (ring semantics: end = new beginning); other terminals → terminal overlay with a restart/leave choice.
- R5 all fate DOM in one overlay; zero three.js scene changes from the UI module.

DELIVER:
- D1 complete `src/fatesUi.ts`: fate-mode UI state machine + DOM, exposing `mountFatesUi({onEnter, onLeave, onScrub, onEngineCommand})`.
- D2 main.ts patch spec ≤40 lines: exact anchor lines (quote them), replacement text, no prose.
- D3 strict TS, no new deps, no other files.

## Notes for the user (not part of the prompt)
- The block above is the paste; the reply comes back here for salvage integration.
