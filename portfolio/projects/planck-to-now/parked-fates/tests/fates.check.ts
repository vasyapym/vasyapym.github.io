import type { FateMode } from "../src/fates.ts";
import {
  FATE_PARAMS,
  E2,
  accelA,
  FateIntegrator,
  fateProgress,
  tauFromProgress,
} from "../src/fates.ts";

let failures = 0;
let passes = 0;

function check(name: string, cond: boolean): void {
  if (cond) {
    passes++;
  } else {
    failures++;
    console.error("FAIL: " + name);
  }
}

function rel(actual: number, expected: number): number {
  if (expected === 0) return Math.abs(actual);
  return Math.abs((actual - expected) / expected);
}

// ─── τ₀ for ΛCDM ───
const Om = 0.31;
const Ode = 0.69;
const analyticTau0 =
  (2 / (3 * Math.sqrt(Ode))) * Math.asinh(Math.sqrt(Ode / Om));
check(
  "tau0 LCDM matches analytic",
  rel(FATE_PARAMS.heatDeath.tauPresent, analyticTau0) < 1e-4
);
check(
  "tau0 LCDM approx 0.953",
  Math.abs(FATE_PARAMS.heatDeath.tauPresent - 0.953) < 0.005
);

// ─── E² and accelA at u=0 for heatDeath ───
{
  const p = FATE_PARAMS.heatDeath;
  check("E2(0) heatDeath = 1", rel(E2(0, p), 1.0) < 1e-10);
  // A(0) = -0.5*Ωm + Ωde = -0.155 + 0.69 = 0.535
  check("accelA(0) heatDeath = 0.535", rel(accelA(0, p), 0.535) < 1e-10);
}

// ─── heatDeath: a(τ) matches (Ωm/ΩΛ)^{1/3} sinh^{2/3}(3√ΩΛ τ/2) < 1e-6 for τ∈[1,20] ───
{
  const p = FATE_PARAMS.heatDeath;
  const prefactor = Math.pow(Om / Ode, 1 / 3);
  const sqrtOde = Math.sqrt(Ode);

  function aAnalytic(tau: number): number {
    return prefactor * Math.pow(Math.sinh(1.5 * sqrtOde * tau), 2 / 3);
  }

  const integrator = new FateIntegrator("heatDeath");
  const targets = [1, 2, 3, 5, 10, 15, 20];
  let maxErr = 0;

  for (const target of targets) {
    while (integrator.tau < target - 1e-10) {
      const step = Math.min(target - integrator.tau, 0.05);
      const r = integrator.advance(step);
      if (r.actualDeltaTau < 1e-15) break;
    }
    const aNum = Math.exp(integrator.u);
    const aAna = aAnalytic(integrator.tau);
    const err = rel(aNum, aAna);
    maxErr = Math.max(maxErr, err);
  }
  check("heatDeath a(τ) matches sinh^{2/3} < 1e-6", maxErr < 1e-6);
}

// ─── bigRip w=-1.1: τ_rip − τ₀ ≈ 2/(3|1+w|√Ω_DE) ≈ 8.0 ───
{
  const p = FATE_PARAMS.bigRip;
  const analyticDelta =
    2 / (3 * Math.abs(1 + p.w) * Math.sqrt(p.Ode));
  check("bigRip analytic delta ≈ 8.0", rel(analyticDelta, 8.026) < 0.01);

  // The asymptotic formula ignores matter; the exact terminal time is the
  // quadrature ∫₀^{u=60} du/√E² — compare the RK4 trajectory against THAT.
  const U_RIP = 60;
  const N = 200000;
  const du = U_RIP / N;
  let sum = 0;
  for (let i = 0; i <= N; i++) {
    const u = i * du;
    const w = i === 0 || i === N ? 1 : i % 2 === 1 ? 4 : 2;
    sum += w / Math.sqrt(E2(u, p));
  }
  const quadDelta = (sum * du) / 3;

  const integrator = new FateIntegrator("bigRip");
  const tau0 = integrator.tau;
  let terminal = false;
  let steps = 0;
  while (!terminal && steps < 200000) {
    const r = integrator.advance(0.1);
    terminal = r.terminal;
    if (r.actualDeltaTau < 1e-15 && !terminal) break;
    steps++;
  }
  check("bigRip reaches terminal", terminal);
  const delta = integrator.tau - tau0;
  check(
    "bigRip tau_rip-tau0 matches quadrature (<1e-3)",
    rel(delta, quadDelta) < 1e-3
  );
}

// ─── bigCrunchLambda: turnaround, total life, constraint drift ───
{
  const p = FATE_PARAMS.bigCrunchLambda;
  check("bigCrunchLambda tauPresent = 0", p.tauPresent === 0);
  check("bigCrunchLambda uStart = -20", p.uStart === -20);

  const analyticLife =
    (2 * Math.PI) / (3 * Math.sqrt(Math.abs(p.Ode)));
  check(
    "bigCrunchLambda analytic life ≈ 2.52",
    rel(analyticLife, 2.5211) < 0.01
  );

  const integrator = new FateIntegrator("bigCrunchLambda");
  let aMax = 0;
  let sawTurnaround = false;
  let terminal = false;
  let maxDrift = 0;
  let steps = 0;

  while (!terminal && steps < 500000) {
    const r = integrator.advance(0.005);
    terminal = r.terminal;

    for (const sub of r.substeps) {
      if (sub.a1 > aMax) aMax = sub.a1;
      if (sub.H1 < 0 && !sawTurnaround) sawTurnaround = true;

      const e2 = E2(sub.lna1, p);
      // Relative drift away from the turnaround: E²→0 there makes the
      // ratio ill-posed, and an absolute bound is ill-posed across the 60
      // dex of E² a full crunch trajectory spans. The constraint invariant
      // is the relative drift wherever E² is within ~3 dex of today.
      if (e2 > 1e-3) {
        maxDrift = Math.max(maxDrift, Math.abs(sub.H1 * sub.H1 - e2) / e2);
      }
    }
    if (r.actualDeltaTau < 1e-15 && !terminal) break;
    steps++;
  }

  check("bigCrunchLambda turnaround", sawTurnaround);
  check("bigCrunchLambda terminal", terminal);

  // a_max should be ≈ (Ωm/|Ωde|)^{1/3} = (0.31/0.69)^{1/3} ≈ 0.766
  const expectedAmax = Math.pow(p.Om / Math.abs(p.Ode), 1 / 3);
  check(
    "bigCrunchLambda aMax ≈ 0.766",
    rel(aMax, expectedAmax) < 0.01
  );

  check(
    "bigCrunchLambda total life ≈ analytic",
    rel(integrator.tau, analyticLife) < 0.02
  );

  check("bigCrunchLambda constraint drift < 1e-9", maxDrift < 1e-9);
}

// ─── bigCrunchClosed: turnaround through H=0 without stalling ───
{
  const integrator = new FateIntegrator("bigCrunchClosed");
  let terminal = false;
  let steps = 0;
  let sawTurnaround = false;
  let aMax = Math.exp(integrator.u);

  while (!terminal && steps < 500000) {
    const r = integrator.advance(0.01);
    terminal = r.terminal;
    steps++;

    for (const sub of r.substeps) {
      if (sub.a1 > aMax) aMax = sub.a1;
      if (sub.H1 < 0 && !sawTurnaround) sawTurnaround = true;
    }

    if (r.actualDeltaTau < 1e-15 && !terminal) break;
  }

  check("bigCrunchClosed turnaround", sawTurnaround);
  check("bigCrunchClosed terminal", terminal);
  check("bigCrunchClosed not stalled", steps < 500000);
  // a_max for Ωm=1.6,Ωk=-0.6: from Ωm e^{-3u} + Ωk e^{-2u} = 0 → e^u = Ωm/|Ωk| = 8/3
  check(
    "bigCrunchClosed aMax ≈ 2.667",
    rel(aMax, 8 / 3) < 0.02
  );
}

// ─── Constraint drift over full crunch (bigCrunchClosed) ───
{
  const p = FATE_PARAMS.bigCrunchClosed;
  const integrator = new FateIntegrator("bigCrunchClosed");
  let terminal = false;
  let maxDrift = 0;

  while (!terminal) {
    const r = integrator.advance(0.005);
    terminal = r.terminal;
    for (const sub of r.substeps) {
      const e2 = E2(sub.lna1, p);
      // Relative drift away from the turnaround: E²→0 there makes the
      // ratio ill-posed, and an absolute bound is ill-posed across the 60
      // dex of E² a full crunch trajectory spans. The constraint invariant
      // is the relative drift wherever E² is within ~3 dex of today.
      if (e2 > 1e-3) {
        maxDrift = Math.max(maxDrift, Math.abs(sub.H1 * sub.H1 - e2) / e2);
      }
    }
    if (r.actualDeltaTau < 1e-15 && !terminal) break;
  }

  check("bigCrunchClosed constraint drift < 1e-9", maxDrift < 1e-9);
}

// ─── fateProgress / tauFromProgress round-trip ───
{
  const modes: FateMode[] = [
    "heatDeath",
    "bigRip",
    "bigCrunchClosed",
    "bigCrunchLambda",
    "vacuumDecay",
  ];
  for (const mode of modes) {
    const tau = FATE_PARAMS[mode].tauPresent + 0.5;
    const prog = fateProgress(mode, tau);
    const tauBack = tauFromProgress(mode, prog);
    check(
      mode + " progress round-trip",
      rel(tauBack, tau) < 1e-6 || Math.abs(tauBack - tau) < 1e-10
    );
  }
}

// ─── fateProgress monotonicity ───
{
  const modes: FateMode[] = [
    "heatDeath",
    "bigRip",
    "bigCrunchLambda",
    "bigCrunchClosed",
  ];
  for (const mode of modes) {
    let prev = -1;
    let mono = true;
    for (let t = 0; t <= 5; t += 0.05) {
      const p = fateProgress(mode, t);
      if (p < prev - 1e-15) {
        mono = false;
        break;
      }
      prev = p;
    }
    check(mode + " fateProgress monotonic", mono);
  }
}

// ─── vacuumDecay treated as heatDeath ───
check(
  "vacuumDecay params match heatDeath",
  FATE_PARAMS.vacuumDecay.Om === FATE_PARAMS.heatDeath.Om &&
    FATE_PARAMS.vacuumDecay.Ode === FATE_PARAMS.heatDeath.Ode &&
    FATE_PARAMS.vacuumDecay.w === FATE_PARAMS.heatDeath.w
);

// ─── No NaN across all modes ───
{
  const modes: FateMode[] = [
    "heatDeath",
    "bigRip",
    "bigCrunchClosed",
    "bigCrunchLambda",
  ];
  let anyNaN = false;
  for (const mode of modes) {
    const integrator = new FateIntegrator(mode);
    let steps = 0;
    while (steps < 10000) {
      const r = integrator.advance(0.05);
      for (const sub of r.substeps) {
        const vals = [
          sub.a0, sub.a1, sub.H0, sub.H1,
          sub.A0, sub.A1, sub.lna0, sub.lna1, sub.dt,
        ];
        if (vals.some((v) => Number.isNaN(v) || !isFinite(v))) {
          anyNaN = true;
        }
      }
      if (r.terminal) break;
      if (r.actualDeltaTau < 1e-15) break;
      steps++;
    }
  }
  check("no NaN/Inf in any integration", !anyNaN);
}

// ─── Terminal freeze: advancing after terminal returns empty ───
{
  const integrator = new FateIntegrator("bigCrunchLambda");
  while (true) {
    const r = integrator.advance(0.01);
    if (r.terminal) break;
    if (r.actualDeltaTau < 1e-15) break;
  }
  const r2 = integrator.advance(1.0);
  check("frozen after terminal: no advance", r2.actualDeltaTau === 0);
  check("frozen after terminal: empty substeps", r2.substeps.length === 0);
  check("frozen after terminal: terminal flag", r2.terminal === true);
}

console.log("\n" + passes + " passed, " + failures + " failed");
if (failures > 0) process.exit(1);
