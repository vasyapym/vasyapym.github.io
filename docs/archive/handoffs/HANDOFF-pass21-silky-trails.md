# Handoff — Pass 21: silky particle trails (root cause fixed, port complete, needs final verification)

## Objective
Polish the portfolio landing shell into portfolio-ready shape. This pass's focus was the GPGPU particle trail system in `HeroField.tsx`, which white-outed ("dirt") on Windows/iPhone. User approved the **"Silky trails"** look from an isolated WebGL repro; that look has now been ported into the app. **No git commits unless explicitly asked.**

## Root cause & fix (the headline)
Trail saturation was a **units bug**: DRAW_VERT computes quad size as `t = n * halfW * s * u_pixelScale` where the result must be UV units, but the app passed `u_pixelScale = trailWidth / cssWidth` (~0.64–0.95, a ratio) instead of texel scale (`1 / trailWidth`). With `halfW ≤ 2.0` that meant splat quads up to ±1.9 UV units — whole-buffer quads dirtying every texel every frame → mean brightness 1.10, 100% coverage.

Fix applied to BOTH uniform sites:
- Trail splat path: `gl.uniform1f(u_pixelScale, 1 / trails.width)`
- Fallback direct-draw path: `gl.uniform1f(u_pixelScale, 1 / canvas.width)` (old value would have made fallback quads canvas-sized)

Validated in clean-room repro first (`trail-repro.html`): single-splat coverage drops 100% → 0.4%; steady-state mean 1.10 → 0.014 before tuning.

## Ported tuning knobs (all validated in repro, screenshot-approved)
| Knob | Old | New |
|---|---|---|
| `TRAIL_DECAY_RATE` | 6.0 | 3.0 |
| Deposit alpha `v_alpha` | `(0.08 + stretch*0.12) * dt-clamp` | `(0.2 + stretch * 0.3) * clamp(u_dt*60, 0, 2)` |
| Composite tone-map gain | 1.2 (both lines) | 1.6 (`mapped = vec3(1)-exp(-t.rgb*1.6)`, `a = 1-exp(-t.a*1.6)`) |
| FADE_FRAG | test constant `vec4(0.5)` | restored `texture(u_trail, v_uv) * u_decay` |

Keep the existing DRAW_VERT safety clamps (`dir = clamp(cur.zw * 0.1, ±0.03)`, `halfW = min(pixelScale * (0.55 + stretch*0.75), 2.0)`) — they are part of the approved look.

All debug instrumentation has been REMOVED from HeroField.tsx: `[tick]`/`[draw]`/`[pp]`/`[splat]`/`[map2]`/`[trail-debug]`/`[resize]`/`[hf-effect]`/`[trail-create]` logs, loopId/tickCount/drawCount/utCount/trailCreateCount/resizeCount/hfLoopCounter counters, and the ASCII map block. `npm run typecheck` passes clean.

Expected steady state (from repro at equivalent settings): mean ~0.069, coverage ~35%, max ~2.94 pre-tonemap — bright localized thread cores, no wash-out.

## Architecture facts
- Hand-rolled WebGL2 GPGPU in `portfolio/shell/src/shell/HeroField.tsx`: fbm aurora wash background + particle sim ping-pong RGBA16F + accumulation trail buffer (ping-pong) + composite pass.
- Constants: `DPR_CAP=1.75`, `RENDER_SCALE=0.85`, `TRAIL_SCALE=0.75`; sim grid `aspect < 0.8 ? 24 : 32`.
- WebGL2 gotcha: RGBA16F renderability needs `EXT_color_buffer_half_float` (and/or `EXT_color_buffer_float`) requested BEFORE rendering to float FBOs — app already does this in createParticleSystem; any standalone repro must too or float-FBO draws silently fail.
- React StrictMode ON (`shell/src/main.tsx`) → effects double-invoke; only second loop's rAF survives (cleanup cancels first).
- Time hardening done: `(elapsed) % 300` wrap + random phase offset.

## Completed earlier this pass (do not redo)
- LandingPage heroLive gate (onReady OR 450ms fallback), CSS entrance choreography; mobile hero overrides MUST live in the LATE media block (right before `/* Hero shader field */`) due to cascade shadowing.
- Mechanics probes all PASS: desktop DPR1, mobile timeline, reduced-motion.

## Next move (verification only)
1. Run `node /var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/pass21-probe.mjs` (spawns vite itself on port 5210, Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` with `--use-angle=metal`; screenshots land in `/var/folders/.../T/opencode/shots21/`). Expect NO `[trail-debug]` output anymore (stripped); judge via screenshots instead.
2. Eyeball dpr1 + mobile screenshots: expect thin silky white/silver threads over aurora wash, no white-out, trails persisting ~1s behind pointer.
3. Report to user for confirmation on real devices (iPhone/Windows were the original failure reports).

## Relevant files
- `/Users/vasilij/Documents/luna2/luna2/portfolio/shell/src/shell/HeroField.tsx` — WIP, fully patched (fix + tuning + cleanup done, typecheck green)
- `/Users/vasilij/Documents/luna2/luna2/portfolio/shell/src/shell/LandingPage.tsx` — complete
- `/Users/vasilij/Documents/luna2/luna2/portfolio/shell/src/styles.css` — complete
- `/var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/trail-repro.html` — golden repro with validated values (reference)
- `/var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/repro-run.mjs`, `shot-repro.mjs` — repro drivers (vite on 5211)
- `/var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/pass21-probe.mjs` — full verification probe
- `/var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/shots21/` — screenshots incl. approved repro-fixed.png

## Gotchas
- Working tree also holds unrelated pre-existing modifications (evening-forest, explosion files); branch diverged from origin. Stage by path only; never commit unless asked.
- Vite dev servers used by probes: 5209 (old debug), 5210 (pass21-probe), 5211 (repro). Kill strays if ports conflict.
- If re-generating repro shaders from HeroField.tsx, the generator wraps extracted GLSL in backticks and expands `${NOISE_GLSL}` — don't hand-edit generated blocks inside backticks.

## Suggested skills
- `diagnosing-bugs` — if screenshots still show saturation or invisible trails on some platform
- `code-review` — review the uncommitted diff once user approves visuals
