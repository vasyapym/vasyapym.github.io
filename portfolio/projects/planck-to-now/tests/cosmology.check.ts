import {
  evaluateState,
  LOG_START,
  LOG_END,
  LOG_SPAN,
  RECOMBINATION,
  fractionToLogt,
  logtToFraction,
  kelvinToRGB,
} from "../src/cosmology.ts";

let failures = 0;
function check(name: string, cond: boolean): void {
  if (!cond) failures++;
  console.log(`${cond ? "ok" : "FAIL"} ${name}`);
}

const probePoints = [-43, -36, -32, -12, 0, 6, 13.08, 14.5, 16.1, 17.0, LOG_END];

let prevA = -1;
let prevVs = -1;
let prevTemp = Infinity;
let monotonic = true;
let vsMonotonic = true;
let tempDecreasing = true;

for (const lp of probePoints) {
  const st = evaluateState(lp);
  if (st.aPhys <= prevA) monotonic = false;
  if (st.vscale < prevVs) vsMonotonic = false;
  if (st.tempK > prevTemp * (1 + 1e-9)) tempDecreasing = false;
  prevA = st.aPhys;
  prevVs = st.vscale;
  prevTemp = st.tempK;
}

check("scale factor a(t) non-decreasing", monotonic);
check("visual scale non-decreasing", vsMonotonic);
check("temperature never increases", tempDecreasing);

const early = evaluateState(-30);
check("plasma-era temperature ~1e22+ K", early.tempK > 1e20);
const atOneSec = evaluateState(0);
check("T(t=1s) within [1e9, 1e11] K", atOneSec.tempK > 1e9 && atOneSec.tempK < 1e11);
const rec = evaluateState(RECOMBINATION);
check(
  "recombination T ~3000 K (2000..5000)",
  rec.tempK > 2000 && rec.tempK < 5000,
);
const now = evaluateState(LOG_END);
check("present-day a == 1", Math.abs(now.aPhys - 1) < 1e-9);
check("present-day T == 2.725 K", Math.abs(now.tempK - 2.725) < 0.01);

const before = evaluateState(RECOMBINATION - 0.01);
const after = evaluateState(RECOMBINATION + 0.01);
check("CMB shell appears only after recombination", before.cmbOpacity === 0 && after.cmbOpacity > 0);
check("web structure absent before dark ages", evaluateState(13).web === 0);
check("web fully formed by present day", evaluateState(LOG_END).web > 0.99);
check("first stars off during dark ages", evaluateState(15).star === 0);
check("stars on by present day", evaluateState(LOG_END).star > 0.99);
check("BBN spark active near t~300 s", evaluateState(2.5).spark > 0.8);
check("hadron spark active near t~3e-5 s", evaluateState(-4.5).spark > 0.7);
check("epoch[0] is Planck", evaluateState(LOG_START).epochIdx === 0);
check("final epoch is Present Day", evaluateState(LOG_END).epochIdx === 10);

check("fraction 0 maps to LOG_START", fractionToLogt(0) === LOG_START);
check("fraction 1 maps to LOG_END", Math.abs(fractionToLogt(1) - LOG_END) < 1e-9);
check("negative fraction clamps to LOG_START", fractionToLogt(-3) === LOG_START);
check("fraction above 1 clamps to LOG_END", Math.abs(fractionToLogt(2.5) - LOG_END) < 1e-9);
let roundTrip = true;
for (const lp of probePoints) {
  const back = fractionToLogt(logtToFraction(lp));
  if (Math.abs(back - lp) > 1e-9) roundTrip = false;
}
check("scrub mapping round-trips probe points", roundTrip);
const scrubbedRec = evaluateState(fractionToLogt(logtToFraction(RECOMBINATION)));
check(
  "scrub to recombination keeps T ~3000 K",
  scrubbedRec.tempK > 2000 && scrubbedRec.tempK < 5000,
);

const hotRGB = kelvinToRGB(1e10);
const warmRGB = kelvinToRGB(3000);
check(
  "blackbody: hot plasma bluish-white (r<g<b)",
  hotRGB[0] <= hotRGB[1] && hotRGB[1] <= hotRGB[2],
);
check("blackbody: 3000 K reddish-orange (r>b)", warmRGB[0] > warmRGB[2]);

for (const lp of probePoints) {
  const st = evaluateState(lp);
  console.log(
    `log10 t=${String(lp).padStart(6)} | epoch=${String(st.epochIdx).padStart(2)} ` +
    `| a=${st.aPhys.toExponential(2)} | T=${st.tempK.toExponential(2)} K ` +
    `| vscale=${st.vscale.toFixed(3)} | web=${st.web.toFixed(2)} star=${st.star.toFixed(2)} ` +
    `| cmb=${st.cmbOpacity.toFixed(2)}`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED`);
  process.exit(1);
}
console.log("\nAll cosmology checks passed.");
