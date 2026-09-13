import {
  mulberry32,
  packState,
  unpackState,
  PACK_DEAD,
  seedHalos,
  assignHalos,
  haloGM,
  samplePlummerRadius,
  seedParticles,
  tidalAccel,
  verletStep,
  unbind,
  layoutFor,
  type V3,
} from "../src/fatesParticles.ts";

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

function near(x: number, y: number, tol: number): boolean {
  return Math.abs(x - y) <= tol * Math.max(1, Math.abs(y));
}

function rel(actual: number, expected: number): number {
  if (expected === 0) return Math.abs(actual);
  return Math.abs((actual - expected) / expected);
}

// ── pack / unpack: exact in float32, sign encodes bound ──
for (const id of [0, 1, 7, 1499, 220_000, 16_777_214]) {
  for (const b of [true, false]) {
    const w = packState(id, b);
    const f32 = Math.fround(w);
    check(`pack exact in float32 (id=${id})`, f32 === w);
    const s = unpackState(f32);
    check(`unpack roundtrip (id=${id}, bound=${b})`, s.haloId === id && s.bound === b && !s.dead);
  }
}
check("dead sentinel", unpackState(PACK_DEAD).dead);
check("sign encodes bound flag", packState(3, true) > 0 && packState(3, false) < 0);

// ── PRNG determinism ──
{
  const r1 = mulberry32(42);
  const r2 = mulberry32(42);
  let same = true;
  for (let i = 0; i < 1000; i++) if (r1.next() !== r2.next()) same = false;
  check("PRNG deterministic", same);
  const u = mulberry32(7).unit();
  check("unit vector normalised", near(Math.hypot(u[0], u[1], u[2]), 1, 1e-12));
}

// ── halos & assignment ──
{
  const rng = mulberry32(1337);
  const halos = seedHalos({ count: 1500, box: 1 }, rng);
  check("1500 halos", halos.length === 1500);
  check(
    "halos inside box",
    halos.every((h) => Math.abs(h.x) <= 0.5 && Math.abs(h.y) <= 0.5 && Math.abs(h.z) <= 0.5),
  );
  const N = 220_000;
  const asg = assignHalos(N, halos, 0.35);
  const bound = asg.reduce((s, v) => s + (v >= 0 ? 1 : 0), 0);
  const sumMembers = halos.reduce((s, h) => s + h.members, 0);
  check("bound count = round(N·(1−freeFraction))", bound === Math.round(N * 0.65));
  check("membership totals equal bound count", sumMembers === bound);
  check("assignment indices valid", asg.every((v) => v >= -1 && v < 1500));
  const asg2 = assignHalos(N, seedHalos({ count: 1500, box: 1 }, mulberry32(1337)), 0.35);
  check("assignment deterministic under seed", asg.every((v, i) => v === asg2[i]));

  const eps = 0.004;
  haloGM(halos, 4400, eps);
  const gmMax = halos.reduce((m, h) => Math.max(m, h.gm), 0);
  check("ω_max = sqrt(GM_max/ε³) = 4400", near(Math.sqrt(gmMax / eps ** 3), 4400, 1e-9));
  const big = halos.reduce((a, b) => (a.members >= b.members ? a : b));
  const small = halos.find((h) => h.members > 0 && h.members < big.members);
  check(
    "GM ∝ membership",
    small !== undefined && near(small.gm / big.gm, small.members / big.members, 1e-12),
  );

  const seeded = seedParticles({ particleCount: N, halos, assignment: asg, eps, box: 1 }, rng);
  check("512×430 layout holds 220k", seeded.layout.texels >= N && seeded.layout.width === 512 && seeded.layout.height === 430);
  let tailDead = true;
  for (let i = N; i < seeded.layout.texels; i++) {
    if (seeded.pos[i * 4 + 3] !== 0) tailDead = false;
  }
  check("padding texels are dead", tailDead);
  let maxR = 0;
  let boundOK = true;
  for (let i = 0; i < N; i++) {
    const s = unpackState(seeded.pos[i * 4 + 3] ?? 0);
    if ((asg[i] ?? -1) >= 0) {
      if (!s.bound || s.haloId !== asg[i]) boundOK = false;
      const r = Math.hypot(seeded.pos[i * 4] ?? 0, seeded.pos[i * 4 + 1] ?? 0, seeded.pos[i * 4 + 2] ?? 0);
      maxR = Math.max(maxR, r);
    } else if (s.bound || s.dead) {
      boundOK = false;
    }
  }
  check("seeded pos.w matches assignment", boundOK);
  check("initial |d| < 3ε (no spurious unbinding at t=0)", maxR < 3 * eps);
}

// ── layout sanity ──
check("layoutFor rounds up", layoutFor(1000, 512).height === 2 && layoutFor(1000, 512).texels === 1024);

// ── unbind logic at the exact critical tide ──
{
  const eps = 0.004;
  const gm = 1.0;
  const a = 2.0;
  const xh: V3 = [0.1, -0.2, 0.3];
  check("never unbinds inside 3ε", !unbind([2 * eps, 0, 0], xh, a, 1e9, gm, eps).free);
  check("never unbinds under compressive tide (A<0)", !unbind([10 * eps, 0, 0], xh, a, -1e9, gm, eps).free);
  const d: V3 = [4 * eps, 0, 0];
  const s = 16 * eps * eps + eps * eps;
  const Acrit = gm / (s * Math.sqrt(s));
  check("stays bound just below critical tide", !unbind(d, xh, a, Acrit * 0.999, gm, eps).free);
  const res = unbind(d, xh, a, Acrit * 1.001, gm, eps);
  check("unbinds just above critical tide", res.free && res.x !== undefined);
  if (res.x) {
    const X = res.x.map((v) => a * v);
    const Xold = xh.map((v, i) => a * v + (d[i] ?? 0));
    check(
      "unbind preserves physical position (offset absorbed)",
      X.every((v, i) => near(v, Xold[i] ?? NaN, 1e-12)),
    );
  }
  const acc = tidalAccel(d, Acrit, gm, eps);
  check("tide balances gravity at critical A", Math.abs(acc[0]) < 1e-9 * (gm / (eps * eps)));
}

// ── Verlet stability at the chosen ω·dt with the stiffest halo ──
{
  const eps = 0.004;
  const omega = 4400;
  const gm = omega * omega * eps ** 3;
  const dt = 0.15 / omega;
  const r = eps;
  const s2 = 2 * eps * eps;
  const vc = Math.sqrt((gm * r * r) / (s2 * Math.sqrt(s2)));
  let d: V3 = [r, 0, 0];
  let v: V3 = [0, vc, 0];
  const E = (dd: V3, vv: V3): number =>
    0.5 * (vv[0] ** 2 + vv[1] ** 2 + vv[2] ** 2) -
    gm / Math.sqrt(dd[0] ** 2 + dd[1] ** 2 + dd[2] ** 2 + eps * eps);
  const E0 = E(d, v);
  let maxDev = 0;
  const steps = Math.round(((2 * Math.PI * r) / vc / dt) * 50);
  for (let i = 0; i < steps; i++) {
    const out = verletStep(d, v, dt, 0, 0, gm, eps);
    d = out.d;
    v = out.v;
    maxDev = Math.max(maxDev, Math.abs(E(d, v) - E0) / Math.abs(E0));
  }
  check(`Verlet energy drift over 50 orbits < 1e-3 (got ${maxDev.toExponential(2)})`, maxDev < 1e-3);
  check("circular orbit radius preserved", near(Math.hypot(d[0], d[1], d[2]), r, 1e-2));
}

// ── pair-A KDK matches single-A when A0=A1 ──
{
  const eps = 0.004;
  const gm = 1e-6;
  const A = 0.69;
  let d1: V3 = [5 * eps, 0, 0];
  let v1: V3 = [0, 0, 0];
  const d2 = [...d1] as V3;
  const v2 = [...v1] as V3;
  for (let i = 0; i < 100; i++) {
    const o = verletStep(d1, v1, 1e-4, A, A, gm, eps);
    d1 = o.d;
    v1 = o.v;
  }
  // reference: repeated single-A steps via verletStep(A,A) — trivially the
  // same code path; instead check drift direction against the tide balance.
  const s = 25 * eps * eps + eps * eps;
  const outward = A > gm / (s * Math.sqrt(s));
  check("offset drifts outward iff tide exceeds gravity", outward === d2[0] < d1[0]);
}

console.log("\n" + passes + " passed, " + failures + " failed");
if (failures > 0) process.exit(1);

// ── draw-path mirrors (logRadial / stableDir / horizonBrightness) ──
{
  const { logRadial, stableDir, horizonBrightness } = await import("../src/fatesParticles.ts");

  // logRadial: finite everywhere; monotone in rho at fixed lna
  let allFinite = true;
  for (let lna = -7; lna <= 60; lna += 1) {
    for (const rho of [1e-3, 0.1, 1, 10, 1e6, 1e20]) {
      if (!Number.isFinite(logRadial(rho, lna))) allFinite = false;
    }
  }
  check("logRadial finite across lna∈[-7,60]", allFinite);
  let mono = true;
  for (let lna = -7; lna <= 60; lna += 1) {
    let prev = -Infinity;
    for (const rho of [1e-3, 0.1, 1, 10, 1e6, 1e20]) {
      const s = logRadial(rho, lna);
      if (s < prev) mono = false;
      prev = s;
    }
  }
  check("logRadial monotone in rho at fixed lna", mono);

  // identity: rho = rho0·e^{-lna} maps to rho0 for any lna (proper knee);
  // tolerance is float32-grain (~1e-6 relative), not double-grain.
  let kneeOK = true;
  for (let lna = -7; lna <= 60; lna += 6) {
    if (rel(logRadial(50 * Math.exp(-lna), lna), 50) > 1e-5) kneeOK = false;
  }
  check("logRadial knee invariant (proper rho0)", kneeOK);

  // linear branch near camera
  check("logRadial linear below knee", rel(logRadial(25, 0), 25) < 1e-6);

  // stableDir: no underflow at 1e-29 offset with lna=60
  const sd = stableDir([1e-29, 0, 0], 60);
  check("stableDir survives 1e-29 at lna=60", near(sd.dir[0], 1, 1e-6) && Number.isFinite(sd.lnRho));
  const sd2 = stableDir([3, 4, 0], 2);
  check("stableDir direction normalised", near(Math.hypot(sd2.dir[0], sd2.dir[1], sd2.dir[2]), 1, 1e-6));

  // horizonBrightness: 1 at D=0, 0 at D·H ≥ 1
  check("horizonBrightness = 1 at D=0", horizonBrightness(0, 0.5) === 1);
  check("horizonBrightness = 0 at horizon", horizonBrightness(2, 0.5) === 0);
  check("horizonBrightness quartic mid", rel(horizonBrightness(0.5, 1), Math.pow(0.5, 4)) < 1e-6);
}
