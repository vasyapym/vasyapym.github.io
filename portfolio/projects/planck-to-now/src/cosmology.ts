export const LOG_START = -43;
export const YR = 3.156e7;
export const LOG_END = Math.log10(4.35e17);
export const LOG_SPAN = LOG_END - LOG_START;
export const RECOMBINATION = 13.08;

export const TEQ = 1.5e12;
export const TLAMBDA = 2.9e17;
const A_EQ = Math.pow(TEQ / TLAMBDA, 2 / 3);

export const HUBBLE0_KMS_MPC = 67.4;
export const OMEGA_M = 0.315;
export const OMEGA_L = 0.685;
export const RHO_CRIT = 8.53e-27;
export const RHO_M0 = OMEGA_M * RHO_CRIT;
export const RHO_LAM = OMEGA_L * RHO_CRIT;
export const A_RAD = 7.5657e-16;
export const KMS_MPC_PER_S = 3.0857e19;

const C_M_S = 2.99792458e8;
const H0_S = HUBBLE0_KMS_MPC / KMS_MPC_PER_S;

export interface Epoch {
  name: string;
  t0: number;
  desc: string;
}

export const EPOCHS: Epoch[] = [
  { name: "Planck Epoch", t0: -43,
    desc: "Quantum gravity reigns; spacetime itself is a froth of possibilities." },
  { name: "Grand Unification Epoch", t0: -42,
    desc: "The strong, weak and electromagnetic forces act as one; X bosons freely turn matter into antimatter and back." },
  { name: "Cosmic Inflation", t0: -36,
    desc: "Space doubles at least 85 times in a trillionth of a trillionth of a second." },
  { name: "Quark\u2013Gluon Plasma", t0: -32,
    desc: "Matter melts into a seething soup of free quarks and gluons." },
  { name: "Electroweak Breaking", t0: -12,
    desc: "The Higgs field switches on \u2014 W and Z bosons gain mass and the weak force splits from electromagnetism." },
  { name: "Hadron Formation", t0: -5,
    desc: "Quarks confine into protons and neutrons; antimatter annihilates." },
  { name: "Nucleosynthesis", t0: 2.3,
    desc: "Protons and neutrons fuse into the first hydrogen and helium nuclei." },
  { name: "Photon Epoch", t0: 6,
    desc: "An opaque fog of ionized gas and trapped light." },
  { name: "Recombination", t0: RECOMBINATION,
    desc: "Atoms form \u2014 light escapes after 380,000 years. We see it today as the CMB." },
  { name: "Dark Ages", t0: 13.7,
    desc: "No stars yet; the universe cools slowly in darkness." },
  { name: "First Stars", t0: 16.1,
    desc: "Gravity ignites the first stellar furnaces in dense knots of gas." },
  { name: "Large-Scale Structure", t0: 16.9,
    desc: "Gravity pulls matter into the filaments, walls and voids of the cosmic web." },
  { name: "Present Day", t0: LOG_END,
    desc: "13.8 billion years on. You are here." },
];

export type Dominant = "radiation" | "matter" | "lambda";

export interface SimState {
  logt: number;
  tSec: number;
  aPhys: number;
  tempK: number;
  vscale: number;
  earlyBoost: number;
  plasma: number;
  web: number;
  star: number;
  spark: number;
  cmbOpacity: number;
  cmbCool: number;
  epochIdx: number;
  rhoKgM3: number;
  omRad: number;
  omMat: number;
  omLam: number;
  hubble: number;
  hubbleKmsMpc: number;
  gStar: number;
  dominant: Dominant;
}

export interface DensityState {
  rhoRadKgM3: number;
  rhoMatKgM3: number;
  rhoLamKgM3: number;
  rhoKgM3: number;
  omRad: number;
  omMat: number;
  omLam: number;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function bump(x: number, center: number, width: number): number {
  const d = (x - center) / width;
  return Math.exp(-0.5 * d * d);
}

export function physicalScaleFactor(logt: number): number {
  const t = Math.pow(10, logt);
  if (t <= TEQ) return A_EQ * Math.sqrt(t / TEQ);
  if (t <= TLAMBDA) return A_EQ * Math.pow(t / TEQ, 2 / 3);
  return 1;
}

// Effective relativistic degrees of freedom g*(T): knots in ascending log10(T).
const GSTAR_KNOTS: Array<[number, number]> = [
  [9.6, 3.36], [9.8, 10.75], [10, 17.25], [10.7, 61.75], [12, 106.75],
];

export function gStar(tempK: number): number {
  const x = Math.log10(Math.max(tempK, 1e-300));
  if (x <= GSTAR_KNOTS[0][0]) return GSTAR_KNOTS[0][1];
  for (let i = 1; i < GSTAR_KNOTS.length; i++) {
    const [x1, g1] = GSTAR_KNOTS[i];
    if (x <= x1) {
      const [x0, g0] = GSTAR_KNOTS[i - 1];
      return lerp(g0, g1, (x - x0) / (x1 - x0));
    }
  }
  return GSTAR_KNOTS[GSTAR_KNOTS.length - 1][1];
}

// H(t): 1/2t in the radiation era, 2/3t in the matter era, relaxing to H0 in the
// Λ era. The radiation→matter join is blended over ±0.43 dex in log t — the real
// H(t) is continuous, and the HUD would show a 33% step otherwise.
const H_JOIN = 0.43;

export function hubbleAt(tSec: number): number {
  const t = Math.max(tSec, 1e-300);
  if (t < TLAMBDA) {
    const x = Math.log10(t);
    const s = smoothstep(Math.log10(TEQ) - H_JOIN, Math.log10(TEQ) + H_JOIN, x);
    return lerp(1 / (2 * t), 2 / (3 * t), s);
  }
  return lerp(2 / (3 * t), H0_S, smoothstep(TLAMBDA, TLAMBDA * 1.5, t));
}

export function densityAt(_tSec: number, tempK: number, aPhys: number): DensityState {
  const t4 = tempK * tempK * tempK * tempK;
  const rhoRadKgM3 = (gStar(tempK) / 2) * A_RAD * t4 / (C_M_S * C_M_S);
  const a = Math.max(aPhys, 1e-100);
  const rhoMatKgM3 = RHO_M0 / (a * a * a);
  const rhoLamKgM3 = RHO_LAM;
  const rhoKgM3 = rhoRadKgM3 + rhoMatKgM3 + rhoLamKgM3;
  if (rhoKgM3 === 0) {
    return { rhoRadKgM3, rhoMatKgM3, rhoLamKgM3, rhoKgM3, omRad: 0, omMat: 0, omLam: 0 };
  }
  return {
    rhoRadKgM3,
    rhoMatKgM3,
    rhoLamKgM3,
    rhoKgM3,
    omRad: rhoRadKgM3 / rhoKgM3,
    omMat: rhoMatKgM3 / rhoKgM3,
    omLam: rhoLamKgM3 / rhoKgM3,
  };
}

function dominantOf(d: DensityState): Dominant {
  if (d.omRad >= d.omMat && d.omRad >= d.omLam) return "radiation";
  if (d.omMat >= d.omLam) return "matter";
  return "lambda";
}

// Visual-scale keyframes. MUST be non-decreasing in logt and MUST end at exactly 1.0
// (node test asserts both). Planck orb starts large (~0.22 → ~9 world units), an
// inflation surge lands ~0.34 by logt -32, then gentle growth to 0.6 at recombination.
// Everything at and after RECOMBINATION is identical to the pre-2026-09 curve.
const VS_KEYS: Array<[number, number]> = [
  [-43, 0.22], [-36, 0.24], [-32, 0.34], [-24, 0.36], [-12, 0.40],
  [0, 0.45], [6, 0.50], [10, 0.55], [RECOMBINATION, 0.6], [14.6, 0.72],
  [16.1, 0.85], [LOG_END, 1.0],
];

export const PACE: Array<[number, number]> = [
  [-36, 4], [-32, 3], [-5, 6], [2.3, 4], [6, 4],
  [RECOMBINATION, 8], [14.3, 5], [16.1, 8], [LOG_END, 8],
];

export function rateAt(logt: number): number {
  let prev = LOG_START;
  for (const [end, secs] of PACE) {
    if (logt < end) return (end - prev) / secs;
    prev = end;
  }
  return (LOG_END - prev) / PACE[PACE.length - 1][1];
}

export function fractionToLogt(fraction: number): number {
  return clamp(LOG_START + clamp(fraction, 0, 1) * LOG_SPAN, LOG_START, LOG_END);
}

export function logtToFraction(logt: number): number {
  return clamp((logt - LOG_START) / LOG_SPAN, 0, 1);
}

function visualScale(logt: number): number {
  if (logt <= VS_KEYS[0][0]) return VS_KEYS[0][1];
  for (let i = 1; i < VS_KEYS.length; i++) {
    if (logt <= VS_KEYS[i][0]) {
      const [a, va] = VS_KEYS[i - 1];
      const [b, vb] = VS_KEYS[i];
      const t = smoothstep(a, b, logt);
      return lerp(va, vb, t);
    }
  }
  return VS_KEYS[VS_KEYS.length - 1][1];
}

export function evaluateState(logt: number): SimState {
  const tSec = Math.pow(10, logt);
  const aPhys = physicalScaleFactor(logt);
  const tempK = 2.725 / Math.max(aPhys, 1e-300);
  const vscale = visualScale(logt);

  const gHadron = bump(logt, -4.5, 1.5) * 0.9;
  const gBBN = bump(logt, 2.5, 1.0) * 1.15;

  let epochIdx = 0;
  for (let i = 0; i < EPOCHS.length; i++) {
    if (logt >= EPOCHS[i].t0) epochIdx = i;
  }

  const dens = densityAt(tSec, tempK, aPhys);
  const hubble = hubbleAt(tSec);

  return {
    logt,
    tSec,
    aPhys,
    tempK,
    vscale,
    earlyBoost: Math.pow(smoothstep(0.5, 0.24, vscale), 1.3),
    plasma: 1 - smoothstep(12.3, RECOMBINATION, logt),
    web: smoothstep(14.3, 16.5, logt),
    star: smoothstep(16.0, 16.9, logt),
    spark: Math.min(1, gHadron + gBBN),
    cmbOpacity:
      smoothstep(RECOMBINATION, 13.5, logt) *
      (0.07 + 0.93 * Math.exp(-Math.max(0, logt - 13.5) * 0.7)),
    cmbCool: smoothstep(13.2, 17.5, logt),
    epochIdx,
    rhoKgM3: dens.rhoKgM3,
    omRad: dens.omRad,
    omMat: dens.omMat,
    omLam: dens.omLam,
    hubble,
    hubbleKmsMpc: hubble * KMS_MPC_PER_S,
    gStar: gStar(tempK),
    dominant: dominantOf(dens),
  };
}

const SUP: Record<string, string> = {
  "-": "\u207b", "0": "\u2070", "1": "\u00b9", "2": "\u00b2", "3": "\u00b3",
  "4": "\u2074", "5": "\u2075", "6": "\u2076", "7": "\u2077", "8": "\u2078", "9": "\u2079",
};

function sup(n: string): string {
  return n.split("").map((c) => SUP[c] ?? c).join("");
}

export function fmtSci(x: number, digits = 2): string {
  if (!isFinite(x)) return "\u221e";
  if (x === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(x)));
  const mant = x / Math.pow(10, exp);
  return `${mant.toFixed(digits)}\u00d710${sup(String(exp))}`;
}

export function fmtTemp(k: number): string {
  return k < 1e6 ? `${Math.round(k).toLocaleString("en-US")} K` : `${fmtSci(k)} K`;
}

export function fmtTime(tSec: number): string {
  if (tSec < 1e-3) return `${fmtSci(tSec)} s`;
  if (tSec < 60) return `${tSec.toFixed(2)} s`;
  if (tSec < 3600) return `${(tSec / 60).toFixed(1)} min`;
  if (tSec < 86400) return `${(tSec / 3600).toFixed(1)} h`;
  const years = tSec / YR;
  if (years < 10) return `${years.toFixed(1)} yr`;
  if (years < 1e4) return `${Math.round(years).toLocaleString("en-US")} yr`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)} Myr`;
  return `${(years / 1e9).toFixed(2)} Gyr`;
}

export function kelvinToRGB(kelvin: number): [number, number, number] {
  const t = clamp(kelvin, 1200, 40000) / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = clamp(99.4708025861 * Math.log(t) - 161.1195681661, 0, 255);
  } else {
    r = clamp(329.698727446 * Math.pow(t - 60, -0.1332047592), 0, 255);
    g = clamp(288.1221695283 * Math.pow(t - 60, -0.0755148492), 0, 255);
  }
  if (t >= 66) b = 255;
  else if (t <= 19) b = 0;
  else b = clamp(138.5177312231 * Math.log(t - 10) - 305.0447927307, 0, 255);
  return [r / 255, g / 255, b / 255];
}
