# Task brief — Planck to Now B1: fates CPU core (mode registry + a(t) integrator + warped clock)

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design and code choice within this contract: do not ask for approval — deliberate, decide, and ship one coherent answer.

## 1. Context

"Planck to Now" is a WebGL cosmology simulation (TypeScript, esbuild, no framework, three@0.170 for rendering only). Its past-history physics lives in `src/cosmology.ts` (SI units, log10 seconds). We are adding a "fates of the universe" mode set (heat death, big rip, big crunch, vacuum decay) extending past the present day. THIS brief is only the CPU-side foundation: a pure-TypeScript module with the fate registry, the shared scale-factor integrator, and the warped-clock substep scheduler. No rendering, no WebGL, no DOM — must be unit-testable in node.

A strongest-model design round produced the physics spec; the parts THIS brief implements are inlined in §3. The full design (for later briefs) adds GPU particle dynamics and a vacuum bubble wavefront — ignore those here.

## 2. Repo conventions you must match

- Plain TypeScript, strict; no dependencies; ES modules; named exports.
- Tests: plain TS run by `node --experimental-strip-types tests/<name>.check.ts` — imports use explicit `.ts` extensions (`from "../src/fates.ts"`); assertion style is a local `check(name, cond)` helper counting failures, exiting nonzero on failure (mirror the existing `tests/cosmology.check.ts` shape).
- Comments only where a non-obvious constraint genuinely needs one.

## 3. The spec you are implementing (from the design doc, binding)

**Units.** Time in Hubble times (τ = H₀t), c = H₀ = 1. Present day: τ₀ ≈ 0.96 for ΛCDM with a(τ₀)=1. Conversions for tests/display: H₀⁻¹ ≈ 4.55e17 s ≈ 14.4 Gyr.

**State variable: u = ln a.** With E(u) = H/H₀ and component wᵢ:

```
E²(u) = Σᵢ Ωᵢ e^{−3(1+wᵢ)u} + Ωk e^{−2u}
A(u)  = ä/(aH₀²) = −½ Σᵢ (1+3wᵢ) Ωᵢ e^{−3(1+wᵢ)u}     (curvature drops out: 1+3w=0 for w=−1/3)
```

Components: radiation (w=⅓ — include it, it matters at the crunch), matter (w=0), dark energy (w = mode parameter), curvature (Ωk, w=−1/3).

**Integrate the second-order system, not the first-order √E² one:**

```
du/dτ = p
dp/dτ = A(u) − p²
```

Reason (must hold in your implementation): the second-order form passes smoothly through H=0 (crunch turnaround) where the first-order form has a square-root branch point. RK4 with adaptive step `h = ε / sqrt(p² + |A|)`, ε = 0.02. Every step, project p onto the Friedmann constraint blended 10%: `p ← 0.9·p + 0.1·sign(p)·sqrt(E²(u))`.

**Mode registry (binding parameter table):**

| Mode | Ω_m | Ω_DE | w | Ω_k | terminal condition |
|---|---|---|---|---|---|
| heatDeath | 0.31 | 0.69 | −1 | 0 | none; τ → ∞ |
| bigRip | 0.31 | 0.69 | −1.1 (user range −1.05…−1.5) | 0 | u > 60 |
| bigCrunchClosed | 1.6 | 0 | — | −0.6 | a < 10⁻³ |
| bigCrunchLambda | 0.31 | −0.69 | −1 | 0 | a < 10⁻³ |
| vacuumDecay | ΛCDM outside (same as heatDeath) | | | | handled by later briefs; for now treat as heatDeath exterior |

**Sanity anchors (your tests must verify these to <1e-4 relative unless stated):**
- bigRip w=−1.1: τ_rip − τ₀ ≈ 2/(3|1+w|√Ω_DE) ≈ 8.0.
- bigCrunchLambda: crunch (a→0) at τ ≈ 2π/(3√|Ω_Λ|) ≈ 2.52 from τ₀... verify the turnaround happens at a_max and the total life matches the analytic value for a matter+Λ=−0.69 universe.
- heatDeath: a(τ) matches (Ω_m/Ω_Λ)^{1/3}·sinh^{2/3}(3√Ω_Λ τ/2) to <1e-6 for τ ∈ [1, 20].
- Constraint drift: |p² − E²(u)| / E² stays < 1e-9 over a full crunch trajectory.
- Turnaround: integrate bigCrunchLambda through H=0 without stalling (this is the regression test for the second-order form).

**Warped clock / substep scheduler (CPU, per frame):**

```
dt_stable = min(0.2/√|A|, 0.1/|H|)          // halo-core term arrives in a later brief
n_sub = ceil(Δτ_frame / dt_stable)
if n_sub > N_MAX (16): Δτ_frame = N_MAX · dt_stable    // slow the clock near singularities
```

The scheduler consumes a *requested* frame advance and returns the *actual* advance (possibly shrunk) plus the per-substep uniform arrays (a, H, A, lna at substep begin/end) that later GPU briefs will upload.

**Log-time scrub mapping (for later UI; expose it now):** requested Δτ_frame ∝ (τ_end − τ) for rip/crunch, ∝ τ for heat death — expose `fateProgress(mode, τ)` ∈ [0,1] implementing this so the timeline slider maps monotonically.

## 4. The contract (binding API shape)

New file `src/fates.ts`, zero imports. Exports:

- `type FateMode = "heatDeath" | "bigRip" | "bigCrunchClosed" | "bigCrunchLambda" | "vacuumDecay"`
- `interface FateParams { Om, Ode, w, Ok, tauPresent }` and `FATE_PARAMS: Record<FateMode, FateParams>` per the table (τ₀ computed, not hardcoded — derive it by integrating ΛCDM from a=1 backward or state your derivation; document the value).
- `E2(u, params)`, `accelA(u, params)` — pure exports (tests and later briefs use them).
- `class FateIntegrator` constructed with `(mode, params?)`: fields `tau`, `u`; method `advance(requestDeltaTau)` → `{ actualDeltaTau, substeps: Array<{ dt, a0, a1, H0, H1, A0, A1, lna0, lna1 }>, terminal: boolean }`; advances internal state by the (possibly warped) actual amount; sets `terminal` per the mode's terminal condition and freezes there.
- `fateProgress(mode, tau)` and `tauFromProgress(mode, frac)` (inverse, needed by the scrub UI).
- Whatever small helpers you need.

Numerical hygiene: no NaN paths at turnaround or terminal freeze; a < 10⁻³⁰ must not appear in crunch (terminal at 10⁻³); rip terminal at u > 60 exactly once.

## 5. Output contract (exactly this shape)

```
## Reasoning
<≤10 lines: your key choices — RK4 step policy details, τ₀ derivation, any spec ambiguity you resolved>

## Changes
### N1 — src/fates.ts
<complete file content>

### N2 — tests/fates.check.ts
<complete file content, mirroring the check() style described in §2>

## Notes
<optional, ≤5 lines>
```

Rules: complete file contents (the orchestrator splices them verbatim); TypeScript strict-clean under `tsc --noEmit`; no dependencies; comments only for non-obvious constraints.
