# Parked: Fates of the Universe (reverted feature)

The complete "fates of the universe" feature (heat death / big rip / big crunch with rebirth epilogue / vacuum decay), parked by owner verdict after the first live-browser round (all four fates rendered black; scope creep). Everything needed to restore it lives HERE — no investigation required.

## Restore (3 steps)

1. Copy the code back:
   ```bash
   cd portfolio/projects/planck-to-now
   cp parked-fates/src/*.ts src/
   cp parked-fates/tests/*.ts tests/
   cp parked-fates/main.ts.wired src/main.ts
   cp parked-fates/package.json.with-fates package.json
   ```
2. `npm run verify` (typecheck + cosmology + fates 35/35 + fatesParticles 50/50 + build).
3. Open `?fate=bigRip` (deep links: heatDeath, bigRip, bigCrunchClosed, bigCrunchLambda, vacuumDecay) or the "fates ▾" panel top-right.

## Revert again (2 steps)

```bash
rm src/fates.ts src/fatesParticles.ts src/fatesUi.ts tests/fates.check.ts tests/fatesParticles.check.ts
git checkout HEAD -- src/main.ts package.json   # or re-copy from a pre-fates commit
```

## The one known blocker (fix first on return)

The fate engine lives in a **box=1 comoving world** while the past-history field and the shared camera live in a **radius-40 world** (camera at ~76). That scale mismatch is why every fate rendered black: particles were subpixel specks 76 units from the camera. Two fixes were identified, neither applied:
- set the engine `box` to ~80 (and rescale `eps` from 0.004 → ~1.6 to keep ω_max = 440), or
- attach/refit the camera when entering fate mode.

Second known defect: the additive sprite size clamp (48px) merges 220k points into one blob when the camera is near/inside the cloud — cap it (~6px) or make size distance-normalized.

Third (already fixed in the parked code, keep an eye on it): the draw shader's `uProj`/`uView`/`uCamC` uniform declarations must exist in the GLSL text — during the original integration they were spliced out and the shader failed to compile.

## Verification loop that catches everything

`CHROME_PATH="<chromium>" node tests/fates-smoke.mjs` — boots the dev server, drives each `?fate=` deep link in headless Chromium, asserts HUD live + frame non-black + no console errors, saves screenshots to tmp. Chromium exists on this machine: `~/Library/Caches/ms-playwright/chromium-1134/chrome-mac/Chromium.app/Contents/MacOS/Chromium`. (The smoke script itself was deleted with the revert; recreate per this recipe or from git history `90a7049`.)

## Contents

- `src/fates.ts` — CPU core: fate registry, u=ln a RK4 integrator with Friedmann constraint projection, warped clock, progress mapping (35 asserts, all anchors verified).
- `src/fatesParticles.ts` — GPU engine: MRT ping-pong halo dynamics, comoving free particles, unbind offset absorption, log-radial draw path, per-fate grading (50 asserts).
- `src/fatesUi.ts` — DOM-only overlay: mode selector, fate scrub (drag/release split), rebirth flash + "the universe is born again" HUD.
- `main.ts.wired` — the full main.ts with fate wiring (replace src/main.ts with it).
- `package.json.with-fates` — test chain including both fates suites.
- `tests/` — both node test suites.
- `docs/fates-physics-design.md` — the strongest-model physics design (canonical spec).
- Full delegation history: pass records in `.agent/iterations/code/fates-cpu-core/passes.md` (C001–C004 + parked note), git branch `fates-parked-v1` (commit 2e73740) on GitHub.

## Status at park time

All four passes VERIFIED at typecheck + node-test scope; GPU runtime was exercised once in a real browser and failed on the scale mismatch above. The past timeline was never affected (off-by-default held).
