# Passes — fates CPU core (B1, chat-model relay, integrated)

## Pass C001 — VERIFIED (typecheck + unit tests + build scope)
- Objective and scope: implement the CPU-side foundation of the "fates of the universe" mode set per the salvaged strongest-model design (`docs/fates-physics-design.md`): fate registry, shared u=ln a RK4 integrator with Friedmann constraint projection, warped-clock substep scheduler, log-time progress mapping — pure TS, node-testable, no rendering.
- Acceptance criteria: registry parameters per design table; τ₀ derived (ΛCDM ≈ 0.953 matches analytic asinh form <1e-4); heat death a(τ) matches sinh^{2/3} <1e-6 for τ∈[1,20]; rip terminal time matches quadrature truth <1e-3; both crunch modes pass through H=0 without stalling, a_max matches analytic (0.766 / 8/3), total life matches analytic (2.52 for Λ<0); constraint drift <1e-9 (relative, away from turnaround); progress↔τ round-trip and monotonicity; no NaN/Inf anywhere; terminal freeze returns empty advance.
- Changes:
  - Added `src/fates.ts` (ok-model output, repaired — see below).
  - Added `tests/fates.check.ts` (ok-model output, repaired — see below).
  - `package.json`: `test` now chains `cosmology.check.ts && fates.check.ts` so `npm run verify` covers the new module.
- Baseline: `npm run verify` PASS before edits (cosmology 40 asserts, typecheck, build).
- Chat-model first-shot defects found in integration review (all repaired):
  1. **Terminal-at-birth freeze**: crunch modes start at u=−20 (Big Bang), below the crunch terminal floor u<ln(1e−3); `isTerminal` fired on the first advance and froze the integrator instantly. Repair: terminal is direction-sensitive (crunch floor ends only the *contracting* phase p<0; rip ceiling only the *expanding* phase p>0) — this is the physically correct reading of the design's "terminal condition".
  2. **Type-only import**: `import { FateMode }` crashed node's type stripping; split into `import type`.
  3. **RK4_EPS 0.02 → 0.01**: measured constraint drift 9.2e-9 (closed) vs the 1e-9 spec target; halving the step (4th-order ⇒ ~16× error reduction) brings it under target.
  4. **fateProgress negative branch**: for τ<τ₀ the exponential map returned negative progress (monotonicity test caught it); fate timeline starts at present, clamped to 0.
  5. **Rip test anchor**: the asymptotic formula 2/(3|1+w|√Ω_DE) ignores matter — actual terminal time 7.9572 vs 8.0257 (0.85% off). Test now compares against the exact quadrature ∫₀^{u=60} du/√E² (the true invariant), keeping the ≈8.0 formula as a loose sanity check.
  6. **Drift metric refinement**: relative |p²−E²|/E² is ill-posed at the turnaround (E²→0) and an absolute bound is ill-posed across the ~60 dex of E² a full crunch spans (measured: 8.5e-12 relative near BB, 1.7e-14 absolute near turnaround). Settled invariant: relative drift with E²>1e-3 floor — kept the spec's 1e-9 target there.
  7. **tauEndEstimate fudge removed**: closed-crunch slider end was "τ₀×3.5 (roughly)"; replaced with exact quadrature (2·T(u_max) − T(u_floor)) reusing the module's Simpson integrator.
- Verification:
  - Command: `npm run verify` (typecheck + cosmology.check + fates.check + esbuild build)
    Result: PASS, exit 0. fates.check: 35 passed, 0 failed.
  - Browser check: NOT RUN — no GPU-phase exists yet in this pass (CPU foundation only); smoke legs arrive with the B2/B3 GPU briefs.
- Final diff review: performed — two new files + one-line test-script change; no debug scaffolding; no secrets; unrelated files untouched.
- Design constraints: strongest-model design `docs/fates-physics-design.md` §0–§1 + §3 (CPU parts); open items #1/#2/#5 from the salvage assessment partially resolved (units boundary established: Hubble units inside fates.ts, τ₀ conversion exported; mode-entry conversion remains for the GPU brief).
- Remaining risks/blockers:
  - Radiation Ω_r is 0 in all mode params (design says include it — matters only within ~1 dex of the crunch terminal; a_max/life anchors unaffected). To wire a real Ω_r in the GPU brief.
  - bigCrunchLambda replays history from the Big Bang (E²(0)<0 ⇒ a=1 unreachable) — a defensible resolution of the mode-entry gap, pedagogically coherent ("a universe that never reaches our present"); UX framing decision deferred to the design round.
  - Substep `dt` recorded on the terminal substep overstates the actually-integrated span (one-substep particle drift at the very end; GPU brief should clamp on terminal).
- Next action: B2 GPU brief (halo state layout, MRT ping-pong substep shader per design §2/§5/§6) once the owner confirms; or design round for the fate-selector UX.

## Addendum (owner correction, post-C001)
- Attribution correction from the owner: the FIRST chat-model reply (the one integrated and repaired in C001) was itself the partially-timed-out answer; the SECOND reply was a complete, non-timed-out generation.
- Empirical benchmark of the second reply (scratch dir, same assertions): 10/14 — bigCrunchLambda fully broken (garbage τ₀ = 2.67e29 from quadrature masked through E²<0, state starts outside the solution, NaN after 172 steps), fixed-dt RK4 replaced the spec's two-level adaptive stepping, weakened tolerances, dead code, an unrunnable own test (NaN defeats its break condition).
- Revised diagnosis: the quality drop is better explained by prompt-length routing (the long B1 brief likely landed on a weaker model) than by timeout — a truncated strong-model answer still beat a complete weak-model answer.
- Standing rule for future delegation: a complete-but-shallow reply with ≥2 degradation markers (dead code, dropped hardest spec requirement, weakened tolerances, unasserted checks, physically wrong defaults) is not integrated; split the brief or shorten it instead.

## Correction 2 (owner)
- Routing clarification: both B1 replies came from the SAME normal chat model (Opus 4.6), not the randomized strongest-model tier. The first reply was truncated by timeout mid-generation; the second was complete.
- Revised attribution: the quality gap is a TIMEOUT effect within one model — truncation hit mid-reasoning, and the model's second full generation still underperformed the repaired truncated one (10/14 vs 35/35), likely because the retry regenerated from a compressed internal state rather than resuming.
- Delegation rule update: for long-brief tasks against the normal chat model, prefer (a) splitting the brief into smaller sequential deliverables over one long ask, and (b) when a reply times out, ask for a resumption/continuation of the truncated answer rather than a fresh full regeneration.

## Pass C002 — VERIFIED (typecheck + unit tests + build scope; GPU runtime NOT RUN)
- Objective and scope: salvage-integrate the randomized-routing model's (Fable 5.1-low) fate GPU particle engine into `src/fatesParticles.ts` — halo state, MRT ping-pong substep passes, CPU seeding, pure helpers — per the B2a contract; drive it from the B1 integrator, not the reply's own cosmology.
- Acceptance criteria: deterministic seeded halo assignment; pack/unpack exact in float32; GM ∝ membership with ω_max = 4400; initial |d| < 3ε; unbind rule exact at the critical tide with physical-position continuity; Verlet energy drift < 1e-3 over 50 stiffest-halo orbits; strict TS clean; node-runnable tests.
- Salvage decisions:
  - KEPT (equal or better than the design): mulberry32 PRNG; sign-encoded packState (bound=+(id+1), free=−(id+1), dead=0) with float32-exactness proof-by-test; largest-remainder apportionment (exact totals); Plummer seeding capped at 2.5ε (no spurious unbind at t=0); free particles stored COMOVING with the Hubble stretch applied at render — strictly simpler than the design's per-substep d-stretch and mathematically identical; unbind absorbing the halo offset into the comoving position (resolves salvage open item #4 more cleanly than the design's x_h_eff=0 flag mechanism).
  - REJECTED: the reply's own Friedmann class + COSMOLOGIES registry — duplicates the verified B1 u=ln a integrator and fate registry; the design mandates one shared CPU ODE core.
  - REPAIRED during integration: KDK now consumes the B1 substep's A0/A1 pair (reply froze A at the substep midpoint — weaker than the design's two-endpoint kick); Points geometry gained a zero dummy position attribute (three derives draw count from it; the reply's ref-only geometry would not draw); dead double-assignment in seedParticles removed; halo-core stiffness enforced engine-side via an advance(dtFloor) loop with a per-frame pass budget (B1's warped clock is blind to ω_max by design; near singularities B1's own warp slows substeps inside the same budget); resetTo(mode) rewinds integrator + read pointers (state is mode-independent by construction).
- Baseline: verify PASS before edits (cosmology + fates 35/35 + build).
- Verification:
  - Command: `npm run verify` (typecheck + cosmology.check + fates.check 35/35 + fatesParticles.check 50/50 + esbuild build)
    Result: PASS, exit 0.
  - GPU runtime (actual MRT ping-pong, rendering): NOT RUN — no Chrome/WebGL in this environment; the engine class is typechecked only. Smoke legs deferred to the integration brief (B3) when Chrome tooling is available.
- Final diff review: performed — two new files + one-line test-chain change; no debug scaffolding; the placeholder render path is explicitly marked for the B2b draw-path brief.
- Design constraints: strongest-model design §2/§5/§6 as amended by salvage; open item #4 (release bookkeeping) RESOLVED (comoving absorption); open item #2 (mode-entry conversion from the past field) still open — engine seeds its own halos for now.
- Remaining risks/blockers:
  - GPU paths unverified at runtime (first render may surface shader-compile or MRT-binding issues) — expected to surface in the B3 integration smoke.
  - crunchLambda visual at a≈2e-9: all halos collapse to origin (physically correct, visually needs the B2b draw path / UX framing).
- Next action: B3 brief — main.ts integration (fate selector UI, timeline extension, engine lifecycle) + smoke legs; then B2b draw-path brief (log-radial projection, per-fate grading).

## Pass C003 — VERIFIED (typecheck + unit tests + build scope; browser NOT RUN)
- Objective and scope: salvage-integrate the randomized-routing reply for B3 — fate-mode UI + main.ts wiring: `src/fatesUi.ts` (DOM-only overlay) + main.ts patch (imports, fate state machine, frame-loop stepping, key ownership), per the B3 contract (R1 off-by-default bit-identity, R4 rebirth epilogue with explicit HUD line, deterministic scrub).
- Salvage decisions:
  - KEPT: the reply's fatesUi architecture (callbacks + handle, mode buttons, HUD, flash/msg rebirth overlay, dragging guard against slider↔HUD feedback), its deterministic scrub invariant (reset-then-advance), its main.ts structure (null `fate` guard around every added statement).
  - REPAIRED during integration:
    1. Import paths: reply assumed `./fateParticles` exporting everything; actual layout is `FateParticles` in `./fatesParticles`, `fateProgress`/`tauFromProgress`/`FateMode` in `./fates`. Type drift eliminated by importing FateMode from fates.ts.
    2. Patch anchors: reply's anchors (`const renderer = new THREE.WebGLRenderer({antialias:true})`, bare `clock.getDelta()`) do not exist in main.ts — spliced by real anchors (after grade setup, after bloom.strength, into the keydown handler).
    3. Paused-terminal flicker: reply called `fate.step(fatePaused ? 0 : ...)` — engine.step(0) returns terminal:false, which would clear the ∎ marker every paused frame. Fixed: the step block is skipped entirely while paused.
    4. Scrub throughput: the reply's `resetTo + single step(tauFromProgress)` cannot reach its target — engine.step's per-frame pass budget (32) covers ~1e-3 τ per call. Added `FateParticles.seek(targetTau, passBudget)` advancing one halo-core-stable substep per pass with a 24k-pass budget (~0.5–1.5 s one-time GPU cost per release).
    5. ω_max default 4400 → 440: at 4400 the halo-core floor (dt = 0.15/4400 ≈ 3.4e-5) caps timeline throughput at ~0.07 τ/s and makes any scrub traverse cost ~10⁶ passes. At 440 halos stay bound against the Λ tide (binding margin at 3ε ≈ 6·10³ ≫ 0.69), rip unbinding now spans the last ~0.09 τ (a visible progressive dissolution arc instead of a final-frame flash), and the timeline traverses at ~2.6 τ/s. Documented deviation from the design's galaxy-interior realism number — visual traversability wins for a portfolio piece.
    6. Panel placement/visibility: reply's always-visible 230px panel at right:12px/bottom:12px would cover the timeline scrub (#timeline bottom:64px center) and violate R1's zero-DOM-noise-when-off. Panel moved top-right (free corner: #panel is top-left, #hints bottom-right), collapsed behind a "fates ▾" toggle, auto-opens on enter.
    7. Scrub UX split: `input` during drag fires the cheap onScrub (noop in main.ts), `change` on release fires the deterministic seek — live per-pixel seeking at 20k+ passes per event would stall the drag.
    8. Engine lifecycle: leave now disposes the engine (reply parked it — re-entering leaked both MRT target sets per enter); past scene objects (points/CMB/glow) hidden during fate mode and restored on leave (both systems rendering simultaneously would double-draw the field).
    9. `?fate=<mode>` URL param auto-enters (deep-linking + future smoke legs); fates UI only mounts when the GPGPU path is active (static fallback devices never see a broken engine).
- Baseline: verify PASS before edits (C002 state).
- Verification:
  - Command: `npm run verify` (typecheck + cosmology.check + fates.check 35/35 + fatesParticles.check 50/50 + esbuild build)
    Result: PASS, exit 0, first run after the final edit.
  - Browser smoke (R1 bit-identity, enter/leave, scrub determinism, rebirth flash): NOT RUN — no Chrome in this environment. The `?fate=` param is the ready-made smoke entry point.
- Final diff review: performed — two new files (fatesUi.ts, seek addition), four anchored edits in main.ts, ω_max default change; no debug scaffolding; past-history code paths untouched except the keydown branch (guarded by `if (fate)`).
- Design constraints: B3 contract R1–R5; R2 deviation noted — the reply (and this integration) allow entering fate mode anytime via the panel, not only from the timeline's end; flagged for the owner's design round.
- Remaining risks/blockers:
  - All visual/GPU behavior unverified at runtime (first render may surface shader-compile or MRT issues).
  - Panel styling is placeholder generic (not the app's ink palette) — design-iteration round pending.
  - R2 entry-gating deviation awaits owner verdict.
- Next action: design round (screenshots when Chrome available) + owner verdict on entry gating; then B2b draw-path brief (log-radial projection, per-fate grading) remains open.
