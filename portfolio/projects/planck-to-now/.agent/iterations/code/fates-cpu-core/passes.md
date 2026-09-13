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
