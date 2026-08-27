# Handoff — Pass 22: hero sharpness on iPhone/Windows (adaptive ladder fix + cheaper wash)

Follows HANDOFF-pass21-silky-trails.md. Focus: motion blur reported on iPhone/Windows while macOS looked fine. **No git commits unless explicitly asked** — a post-commit `project-graph` auto-record node will land whenever these files get committed.

## Root causes found (investigation → fix mapping)
1. **Ladder could never climb back on 60 Hz displays** (all platforms, incl. this Mac): climb required mean frame < 10.5 ms, unreachable when rAF cadence is vsync-pinned at ~16.7 ms. After any startup spike everything sat at rung 0.85 forever. Probe proved it: baseline desktop/iPhone-emu both stuck at `heroScale 0.85`.
2. **Mobile ceiling capped at 0.85**: coarse-pointer devices could not even reach rung 1.0 (`MOBILE_QUALITY_CEILING`), so iPhone (dpr 3, cap 2 × 0.85 = effective 1.7× on a 3× panel).
3. **Wash shader cost** pushed weak GPUs past the 21 ms downstep budget: fbm ran ~20 noise evals/pixel.
4. Secondary contributors left untouched on purpose: 60 Hz persistence blur (display physics), trail-buffer softness (part of approved look), text entrance transform (transient).

## Changes (one coherent pass, tier A1+B1+A2 from review plan)
- `portfolio/shell/src/shell/HeroField.tsx`
  - Constants renamed/added: `MOBILE_START_SCALE=0.85` (start value only now), `LONG_FRAME_FLOOR_MS=23`, `LONG_FRAME_FACTOR=1.55`, `CLIMB_LONG_SHARE=0.03`, `REFRESH_TRACKER_MS=16.7`. Removed `MOBILE_QUALITY_CEILING`, `FRAME_BUDGET_UP_MS`.
  - `qualityStep(scale, saturated, climbing, ceiling)` signature changed (only consumer is inside this file). Down rule unchanged (EMA > 21 ms). Climb rule replaced: share of "long" frames (> max(23 ms, refresh×1.55)) must be ≤3 % of the evaluation window; `refreshMs` is a fast-min tracker of actual vsync cadence.
  - Added `fbmWarp()` (2 octaves, amplitudes renormalized ×1.34 to preserve warp range) used for domain-warp inputs `q`/`r` in FRAG; final `f` keeps full fbm; SIM_FRAG untouched. ≈40 % fewer noise evals in the wash pass.
- `portfolio/shell/src/styles.css`
  - `.signal-index-beneath`: removed `backdrop-filter/-webkit-backdrop-filter blur(2px) saturate(1.15)`; background darkened `rgba(11,19,23,0.42)` → `rgba(11,19,23,0.72)` to compensate. Removes an expensive compositor pass over an animating canvas.

## Verification done (macOS headless, probe infra in /var/folders/...T/opencode)
- Probe script: `hero-sharpness-probe.mjs` (spawns vite :5215, puppeteer-core + system Chrome `--use-angle=metal`). Modes: desktop dpr2, iphone-emu 390×844 dpr3 + matchMedia shim forcing `pointer:fine→false`. Reads `canvas.dataset.heroScale/heroDpr`, buffer size, computed styles, 90-frame rAF percentiles. Shots: `/var/folders/.../shots22/{baseline,after}-{desktop,iphone-emu}.png`.
- After: `heroScale 1.00`, `heroDpr 2.000` in BOTH modes; buffers grew 2054×733 → 2416×862 (desktop), 609×514 → 716×605 (iphone-emu); frames steady at vsync 16.7 ms, zero page errors. Typecheck green.
- Visual compare: identity/palette/layout preserved; aurora texture reads more detailed (direct consequence of full-res rung); beneath panel slightly more opaque. Screenshots need human sign-off.
- Note: `fbmWarp` renormalization preserves band thresholds; if bands look off, raising to 3 octaves is the safe fallback.

## Next moves
1. Human eyeball of shots22 pair (desktop + iphone-emu), then real iPhone + Windows check — headline expectation: sharper field, ladder holding 1.0 where GPU allows, stepping down gracefully under load.
2. If Windows still exceeds frame budget at rung 1: next candidate is low-res wash FBO (wash rendered ~0.5× then bilinear upscaled — inherently low-frequency content). Deferred this pass to keep risk contained.
3. Optional C-tier leftovers: simplify dual mask on `.signal-index-hero-depth`; entrance-text transform smear at fractional Windows scaling (transient, ignored this pass).

## Gotchas
- Vite lives at portfolio root (`portfolio/node_modules/vite.js`), spawn needs `cwd: portfolio/shell` or vite serves repo root (404).
- Headless macOS cannot emulate weak GPU/CPU honestly (CPU throttle does not slow the GPU): real-device verdicts still required.
- StrictMode double-invokes effects; cleanup cancels first rAF loop (unchanged from pass21).
