export type FateMode =
  | "heatDeath"
  | "bigRip"
  | "bigCrunchClosed"
  | "bigCrunchLambda"
  | "vacuumDecay";

export interface FateParams {
  Om: number;
  Ode: number;
  w: number;
  Ok: number;
  Or: number;
  tauPresent: number;
  uStart: number;
}

export function E2(u: number, p: FateParams): number {
  return (
    p.Or * Math.exp(-4 * u) +
    p.Om * Math.exp(-3 * u) +
    p.Ok * Math.exp(-2 * u) +
    p.Ode * Math.exp(-3 * (1 + p.w) * u)
  );
}

export function accelA(u: number, p: FateParams): number {
  // A(u) = -½ Σ (1+3wᵢ) Ωᵢ e^{-3(1+wᵢ)u}; curvature (w=-1/3) drops out
  return (
    -0.5 * 2 * p.Or * Math.exp(-4 * u) +
    -0.5 * 1 * p.Om * Math.exp(-3 * u) +
    -0.5 * (1 + 3 * p.w) * p.Ode * Math.exp(-3 * (1 + p.w) * u)
  );
}

// Integrate dτ = du/√E²(u) from uLo to uHi via Simpson's rule
function integrateTauOverU(
  uLo: number,
  uHi: number,
  p: FateParams,
  N: number = 200000
): number {
  const du = (uHi - uLo) / N;
  let sum = 0;
  for (let i = 0; i <= N; i++) {
    const u = uLo + i * du;
    const e2 = E2(u, p);
    if (e2 <= 0) return Infinity;
    const inv = 1 / Math.sqrt(e2);
    const w = i === 0 || i === N ? 1 : i % 2 === 1 ? 4 : 2;
    sum += w * inv;
  }
  return (sum * du) / 3;
}

function computeTauPresent(p: FateParams): number {
  // Check if a=1 (u=0) is reachable: E²(0) must be > 0
  const e2at0 = E2(0, p);
  if (e2at0 <= 0) return 0; // a=1 never reached; use Big Bang as reference
  return integrateTauOverU(-30, 0, p);
}

function makeParams(
  Om: number,
  Ode: number,
  w: number,
  Ok: number,
  Or: number = 0
): FateParams {
  const stub: FateParams = { Om, Ode, w, Ok, Or, tauPresent: 0, uStart: 0 };
  const tp = computeTauPresent(stub);
  stub.tauPresent = tp;
  // If tauPresent=0, start from Big Bang at u=-20
  stub.uStart = tp === 0 ? -20 : 0;
  return stub;
}

export const FATE_PARAMS: Record<FateMode, FateParams> = {
  heatDeath: makeParams(0.31, 0.69, -1, 0),
  bigRip: makeParams(0.31, 0.69, -1.1, 0),
  bigCrunchClosed: makeParams(1.6, 0, -1, -0.6),
  bigCrunchLambda: makeParams(0.31, -0.69, -1, 0),
  vacuumDecay: makeParams(0.31, 0.69, -1, 0),
};

export interface Substep {
  dt: number;
  a0: number;
  a1: number;
  H0: number;
  H1: number;
  A0: number;
  A1: number;
  lna0: number;
  lna1: number;
}

export interface AdvanceResult {
  actualDeltaTau: number;
  substeps: Substep[];
  terminal: boolean;
}

const RK4_EPS = 0.01;
const N_MAX = 16;
const U_CRUNCH = Math.log(1e-3);
const U_RIP = 60;

function rk4Step(
  u: number,
  p: number,
  h: number,
  params: FateParams
): [number, number] {
  const f = (uu: number, pp: number): [number, number] => [
    pp,
    accelA(uu, params) - pp * pp,
  ];

  const [k1u, k1p] = f(u, p);
  const [k2u, k2p] = f(u + 0.5 * h * k1u, p + 0.5 * h * k1p);
  const [k3u, k3p] = f(u + 0.5 * h * k2u, p + 0.5 * h * k2p);
  const [k4u, k4p] = f(u + h * k3u, p + h * k3p);

  return [
    u + (h / 6) * (k1u + 2 * k2u + 2 * k3u + k4u),
    p + (h / 6) * (k1p + 2 * k2p + 2 * k3p + k4p),
  ];
}

function projectConstraint(u: number, p: number, params: FateParams): number {
  const e2 = E2(u, params);
  if (e2 <= 0) return p;
  const sign = p >= 0 ? 1 : -1;
  return 0.9 * p + 0.1 * sign * Math.sqrt(e2);
}

function adaptiveH(p: number, params: FateParams, u: number): number {
  const absA = Math.abs(accelA(u, params));
  return RK4_EPS / Math.sqrt(p * p + absA + 1e-30);
}

function isTerminal(mode: FateMode, u: number, p: number): boolean {
  // Direction-sensitive: a crunch mode STARTS below the terminal floor
  // (expanding from the Big Bang), so u < floor alone would freeze it at
  // birth; the floor only ends the contracting phase. Symmetrically the rip
  // floor only ends the expanding phase.
  switch (mode) {
    case "bigRip":
      return p > 0 && u > U_RIP;
    case "bigCrunchClosed":
    case "bigCrunchLambda":
      return p < 0 && u < U_CRUNCH;
    default:
      return false;
  }
}

// Integrate from (u,p,tau) over duration dt using adaptive RK4, returns new (u,p,tau)
function integrateSpan(
  u: number,
  p: number,
  tau: number,
  dt: number,
  params: FateParams,
  mode: FateMode
): { u: number; p: number; tau: number; hitTerminal: boolean } {
  let remaining = dt;
  let hitTerminal = false;
  while (remaining > 1e-15) {
    let h = adaptiveH(p, params, u);
    if (h > remaining) h = remaining;
    if (h < 1e-18) break;
    [u, p] = rk4Step(u, p, h, params);
    p = projectConstraint(u, p, params);
    tau += h;
    remaining -= h;
    if (isTerminal(mode, u, p)) {
      hitTerminal = true;
      break;
    }
  }
  return { u, p, tau, hitTerminal };
}

export class FateIntegrator {
  tau: number;
  u: number;
  private p: number;
  private mode: FateMode;
  private params: FateParams;
  private frozen: boolean;

  constructor(mode: FateMode, params?: FateParams) {
    this.mode = mode;
    this.params = params ?? FATE_PARAMS[mode];
    this.frozen = false;

    const pr = this.params;
    const uInit = pr.uStart;
    const e2Init = E2(uInit, pr);
    // All modes expand initially from their start point
    this.u = uInit;
    this.p = Math.sqrt(Math.max(e2Init, 0));
    this.tau = pr.tauPresent;

    // For modes starting from Big Bang (tauPresent=0, uStart=-20),
    // tau is already 0 and we start near the singularity expanding.
  }

  getH(): number {
    return this.p;
  }

  advance(requestDeltaTau: number): AdvanceResult {
    if (this.frozen || requestDeltaTau <= 0) {
      return { actualDeltaTau: 0, substeps: [], terminal: this.frozen };
    }

    const pr = this.params;

    // Warped clock: compute dt_stable from current state
    const absA = Math.abs(accelA(this.u, pr));
    const absH = Math.abs(this.p);
    const dtStable = Math.min(
      0.2 / Math.sqrt(absA + 1e-30),
      0.1 / (absH + 1e-30)
    );

    let nSub = Math.ceil(requestDeltaTau / dtStable);
    let actualDelta = requestDeltaTau;
    if (nSub > N_MAX) {
      nSub = N_MAX;
      actualDelta = N_MAX * dtStable;
    }
    if (nSub < 1) nSub = 1;

    const dtSub = actualDelta / nSub;
    const substeps: Substep[] = [];
    let terminal = false;

    for (let i = 0; i < nSub; i++) {
      const u0 = this.u;
      const lna0 = u0;
      const a0 = Math.exp(u0);
      const H0 = this.p;
      const A0 = accelA(u0, pr);

      const result = integrateSpan(
        this.u,
        this.p,
        this.tau,
        dtSub,
        pr,
        this.mode
      );

      this.u = result.u;
      this.p = result.p;
      this.tau = result.tau;

      const u1 = this.u;
      const lna1 = u1;
      const a1 = Math.exp(u1);
      const H1 = this.p;
      const A1 = accelA(u1, pr);

      substeps.push({
        dt: dtSub,
        a0,
        a1,
        H0,
        H1,
        A0,
        A1,
        lna0,
        lna1,
      });

      if (result.hitTerminal) {
        terminal = true;
        this.frozen = true;
        break;
      }
    }

    return {
      actualDeltaTau: substeps.reduce((s, sub) => s + sub.dt, 0),
      substeps,
      terminal,
    };
  }
}

function tauEndEstimate(mode: FateMode, params: FateParams): number {
  switch (mode) {
    case "bigRip":
      return (
        params.tauPresent +
        2 / (3 * Math.abs(1 + params.w) * Math.sqrt(params.Ode))
      );
    case "bigCrunchClosed": {
      // Exact: τ(u) from the Big Bang via quadrature; the crunch ends at
      // 2·T(u_max) − T(u_floor) (expansion to turnaround, mirrored fall).
      const uMax = Math.log(params.Om / Math.abs(params.Ok));
      const tAt = (u: number) => integrateTauOverU(params.uStart, u, params);
      return 2 * tAt(uMax) - tAt(U_CRUNCH);
    }
    case "bigCrunchLambda":
      return (2 * Math.PI) / (3 * Math.sqrt(Math.abs(params.Ode)));
    default:
      return Infinity;
  }
}

export function fateProgress(mode: FateMode, tau: number): number {
  const params = FATE_PARAMS[mode];
  const tau0 = params.tauPresent;
  const tEnd = tauEndEstimate(mode, params);

  if (mode === "heatDeath" || mode === "vacuumDecay") {
    // Map [tau0, ∞) → [0, 1) via exponential asymptote; the fate timeline
    // starts at the present, so earlier τ (not reachable here) reads as 0.
    if (tau <= tau0) return 0;
    return 1 - Math.exp(-(tau - tau0) / Math.max(tau0, 0.1));
  }

  if (!isFinite(tEnd)) {
    if (tau <= 0) return 0;
    return 1 - Math.exp(-tau);
  }

  // Finite-end modes: logarithmic mapping near endpoints
  // p = ln((τ-τ₀+1)/(1)) / ln((τ_end-τ₀+1)/(1))
  // This ensures p(τ₀)=0, p(τ_end)=1 with log bunching near end
  const shifted = tau - tau0;
  const range = tEnd - tau0;
  if (range <= 0) return 0;
  const frac = Math.log(shifted + 1) / Math.log(range + 1);
  return Math.max(0, Math.min(1, frac));
}

export function tauFromProgress(mode: FateMode, frac: number): number {
  const params = FATE_PARAMS[mode];
  const tau0 = params.tauPresent;
  const tEnd = tauEndEstimate(mode, params);

  if (mode === "heatDeath" || mode === "vacuumDecay") {
    const clamped = Math.max(0, Math.min(1 - 1e-15, frac));
    const scale = Math.max(tau0, 0.1);
    return tau0 - scale * Math.log(1 - clamped);
  }

  if (!isFinite(tEnd)) {
    const clamped = Math.max(0, Math.min(1 - 1e-15, frac));
    return -Math.log(1 - clamped);
  }

  const range = tEnd - tau0;
  // Inverse of log mapping: τ = τ₀ + exp(frac · ln(range+1)) - 1
  return tau0 + Math.exp(frac * Math.log(range + 1)) - 1;
}
