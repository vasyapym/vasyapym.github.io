// The daylight engine: one number — time of day, 0..1 — expands into every
// lighting decision the forest makes. Pure TypeScript over plain arrays and
// numbers (no three.js), so tests can sweep the whole arc headlessly and
// the renderer just copies the sample into uniforms each frame.
//
// The arc runs evening → night → sunrise. Both ends are bright (golden
// hour, then full sunrise); the middle dips into deep night where only
// fireflies and stars carry the scene. Visitors who find the forest too
// dark can simply drag toward sunrise.
//
// Tuning note: night is separated from dusk by TEMPERATURE, not brightness —
// its fog and sky pull hard toward steel blue so silhouettes read against
// the murk while intensities stay low (the dark middle is a standing rule).

export type Rgb = [number, number, number];

export type DaylightSample = {
  // Sky gradient stops, bottom to top.
  horizon: Rgb;
  band: Rgb;
  upper: Rgb;
  zenith: Rgb;
  fog: Rgb;
  fogDensity: number;
  hemiSky: Rgb;
  hemiGround: Rgb;
  hemiIntensity: number;
  sunColor: Rgb;
  sunIntensity: number;
  // Unit-ish direction; the renderer normalises. At night this is the moon.
  sunDir: [number, number, number];
  starGain: number;
  fireflyGain: number;
  shaftGain: number;
};

function hex(value: string): Rgb {
  const n = Number.parseInt(value.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

type DaylightKey = DaylightSample & { t: number };

const GOLDEN_HOUR: DaylightKey = {
  t: 0,
  horizon: hex("#f2955a"),
  band: hex("#b3688a"),
  upper: hex("#58409a"),
  zenith: hex("#3a2a66"),
  fog: hex("#9f6a70"),
  fogDensity: 0.0105,
  hemiSky: hex("#b3aadf"),
  hemiGround: hex("#63513a"),
  hemiIntensity: 2.9,
  sunColor: hex("#ffb066"),
  sunIntensity: 2.8,
  sunDir: [-0.42, 0.2, -0.86],
  starGain: 0.05,
  fireflyGain: 0.35,
  shaftGain: 1,
};

const LATE_DUSK: DaylightKey = {
  t: 0.3,
  horizon: hex("#d4744a"),
  band: hex("#8a5078"),
  upper: hex("#40307e"),
  zenith: hex("#241a4a"),
  fog: hex("#66486a"),
  fogDensity: 0.013,
  hemiSky: hex("#8f86cc"),
  hemiGround: hex("#2c2018"),
  hemiIntensity: 2.1,
  sunColor: hex("#ff8a4d"),
  sunIntensity: 1.8,
  sunDir: [-0.42, 0.08, -0.86],
  starGain: 0.45,
  fireflyGain: 0.85,
  shaftGain: 0.55,
};

const NIGHT: DaylightKey = {
  t: 0.55,
  horizon: hex("#4b4a72"),
  band: hex("#333a66"),
  upper: hex("#1e2a58"),
  zenith: hex("#0b1230"),
  fog: hex("#31365a"),
  fogDensity: 0.014,
  hemiSky: hex("#5f6db2"),
  hemiGround: hex("#121424"),
  hemiIntensity: 1.4,
  sunColor: hex("#c9dcff"),
  sunIntensity: 1.15,
  sunDir: [-0.25, 0.62, -0.45],
  starGain: 1,
  fireflyGain: 1,
  shaftGain: 0,
};

const PRE_DAWN: DaylightKey = {
  t: 0.8,
  horizon: hex("#a06a5c"),
  band: hex("#5c4a70"),
  upper: hex("#33406e"),
  zenith: hex("#1c2140"),
  fog: hex("#514a66"),
  fogDensity: 0.012,
  hemiSky: hex("#8286b8"),
  hemiGround: hex("#221d1c"),
  hemiIntensity: 1.8,
  sunColor: hex("#ffa878"),
  sunIntensity: 1.6,
  sunDir: [-0.42, 0.12, -0.86],
  starGain: 0.5,
  fireflyGain: 0.7,
  shaftGain: 0.25,
};

const SUNRISE: DaylightKey = {
  t: 1,
  horizon: hex("#ffc27d"),
  band: hex("#d88a6a"),
  upper: hex("#8a90c4"),
  zenith: hex("#4a6899"),
  fog: hex("#ab8a86"),
  fogDensity: 0.0095,
  hemiSky: hex("#b7bede"),
  hemiGround: hex("#46382a"),
  hemiIntensity: 3.2,
  sunColor: hex("#ffd9a0"),
  sunIntensity: 3.6,
  sunDir: [-0.42, 0.3, -0.86],
  starGain: 0,
  fireflyGain: 0.15,
  shaftGain: 0.9,
};

// Ordered by t; the sampler walks this table.
const KEYS: DaylightKey[] = [
  GOLDEN_HOUR,
  LATE_DUSK,
  NIGHT,
  PRE_DAWN,
  SUNRISE,
];

const COLOR_KEYS = [
  "horizon",
  "band",
  "upper",
  "zenith",
  "fog",
  "hemiSky",
  "hemiGround",
  "sunColor",
] as const;

const NUMBER_KEYS = [
  "fogDensity",
  "hemiIntensity",
  "sunIntensity",
  "starGain",
  "fireflyGain",
  "shaftGain",
] as const;

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Expands a time of day into a full lighting snapshot. Clamps out-of-range
// times to the ends of the arc rather than wrapping: the walk has two
// bright anchors and one dark middle, not a loop.
export function sampleDaylight(timeOfDay: number): DaylightSample {
  const t = Math.min(Math.max(timeOfDay, 0), 1);
  let lo = KEYS[0];
  let hi = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i += 1) {
    if (t >= KEYS[i].t && t <= KEYS[i + 1].t) {
      lo = KEYS[i];
      hi = KEYS[i + 1];
      break;
    }
  }
  const span = hi.t - lo.t;
  const raw = span <= 0 ? 0 : (t - lo.t) / span;
  const k = smooth(raw);

  const out = {} as DaylightSample;
  for (const key of COLOR_KEYS) {
    const a = lo[key];
    const b = hi[key];
    out[key] = [
      lerp(a[0], b[0], k),
      lerp(a[1], b[1], k),
      lerp(a[2], b[2], k),
    ];
  }
  for (const key of NUMBER_KEYS) {
    out[key] = lerp(lo[key], hi[key], k);
  }
  out.sunDir = [
    lerp(lo.sunDir[0], hi.sunDir[0], k),
    lerp(lo.sunDir[1], hi.sunDir[1], k),
    lerp(lo.sunDir[2], hi.sunDir[2], k),
  ];
  return out;
}

// Human-readable label for the current stretch of the arc; drives the dial
// caption in the UI.
export function phaseName(timeOfDay: number): string {
  const t = Math.min(Math.max(timeOfDay, 0), 1);
  if (t < 0.15) return "Golden hour";
  if (t < 0.42) return "Dusk";
  if (t < 0.68) return "Night";
  if (t < 0.9) return "Pre-dawn";
  return "Sunrise";
}
