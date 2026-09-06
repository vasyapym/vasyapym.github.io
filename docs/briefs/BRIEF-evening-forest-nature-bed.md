# BRIEF — Evening Forest: procedural nature bed (`web/lib/nature.ts`)

You are writing one complete TypeScript module for a shipped web game. You
cannot see the repository; everything you need is in this brief.

## Situation

"Evening Forest" is a calm first-person walking simulator at dusk (a
Proteus-inspired mood piece) living inside a developer-portfolio site. Its
whole soundscape is procedural WebAudio — **no audio files, ever**. The
existing score (`music.ts`) is a D-aeolian ambient loop: a breathing drone,
slow pad swells, a sparse bell melody, and a filtered night-air noise bed,
glued by a bus compressor and a runtime-built convolution reverb. A small
`ambience.ts` class owns the AudioContext, the master gain (mute/dim ramps),
a footstep synth, and mounts the score voice.

What's missing is **the forest itself**: an ambient environment bed that
layers wind, leaves, insects and birdlife over the music, and shifts with
the time of day and the player's movement — Proteus-style. Your task is to
design and write that bed as ONE new module.

## Your deliverable

A complete file `nature.ts` exporting:

```ts
export function createNatureBed(
  ctx: AudioContext,
  out: AudioNode,
): { stop: () => void }
```

plus these pure helpers (exported so a headless node test can assert them):

```ts
export function nightFactor(t: number): number
export function twilightFactor(t: number): number
```

`nightFactor(t)`: 0..1, triangular — 0 for t ≤ 0.15, rises linearly to 1 at
t = 0.55, falls back to 0 at t ≥ 0.95. Clamp outside [0,1].
`twilightFactor(t)`: bird activity 0..1 — 1 while t < 0.25, falling linearly
to 0 at t = 0.45 (deep night is silent), then rising linearly from 0.78 back
to 1 at t ≥ 0.98. Clamp outside [0,1]. (t is time of day: 0 = golden hour,
0.55 = deep night, 1 = sunrise.)

## The environment bridge (another file, already specced — just import it)

```ts
// ./audio-env — written by the render loop every frame; you only READ it,
// lazily (inside interval/event callbacks), never snapshot it at setup.
export const audioEnv = {
  timeOfDay: 0,   // 0..1 — golden hour → night (0.55) → sunrise
  moveSpeed: 0,   // m/s, 0..~3.4
  foxDist: null as number | null, // planar metres to the fox, or null
  foxState: null as "wander" | "alert" | "curious" | "flee" | null,
};
```

## The six layers

Levels below are peak gains before a shared `natureGain` (value 1.0) that
connects into `out`. The music bus runs at 0.5 into the same master, so the
bed must sit UNDER the score: it colours silence, never competes.

1. **Wind** (~0.05 base, gusts to ~0.11). Loop a 2 s stereo noise buffer
   (independent noise per channel → decorrelated width) through a lowpass
   ~320 Hz (Q 0.5) into the wind gain. Gusts: two slow sine LFOs (~0.031 Hz
   and ~0.011 Hz) summed through depth gains into `windGain.gain`, plus a
   faint ~0.21 Hz shimmer LFO. Movement: the 1 s interval scales the wind
   gain target by `1 + min(audioEnv.moveSpeed, 3.4) * 0.12` (max ~1.4×).
2. **Canopy rustle** (~0.025). Its own noise loop → bandpass ~3400 Hz
   (Q 0.7) → gain following its own gust LFO pair at slightly different
   rates, so leaves and gusts never pump in lockstep. Same movement factor.
3. **Crickets** (~0.035, night only). Two virtual crickets, panned −0.55 and
   +0.6. Each: noise loop → bandpass ~4200 Hz ±300 (Q ~9) → gain gated by a
   square-ish LFO (~22 Hz pulse rate) shaped by a slow ~0.9 Hz phrase LFO →
   cricketGain. The 1 s interval sets each cricketGain target to
   `nightFactor(audioEnv.timeOfDay) * level` with `setTargetAtTime`
   (timeConstant ~1.5) — crickets fade in as dusk deepens, vanish by morning.
4. **Birdsong** (~0.05, dawn/dusk only). Scheduled phrases: the 1 s interval
   acts as a lookahead scheduler (SCHEDULE_AHEAD 3.0 s). Each tick, when
   `twilightFactor > 0.05`, schedule a phrase with probability ~0.22 per
   2 s window: 2–4 short sine whistles with quick frequency glides
   (e.g. 2100→1600 Hz or the reverse, 0.10–0.16 s each, 0.12–0.2 s gaps),
   5 ms attack / 0.08–0.15 s decay envelopes, phrase gain × twilightFactor,
   random pan ±0.7. Register each note's disposer via its `onended`.
5. **Owl** (~0.06, night only, rare). When `nightFactor > 0.5`, chance ~0.04
   per 2 s window: two low hoots — sine gliding ~340→300 Hz through a
   600 Hz lowpass; note 1 ~0.25 s, note 2 ~0.6 s starting ~0.45 s later,
   soft 80 ms attacks, gain × nightFactor. Send the owl through a small
   convolution reverb built inside this module (2.8 s exponentially decaying
   noise impulse, same recipe as the score's, wet 0.8 / dry 0.5) so it reads
   as distant.
6. **Distant water** (~0.018, constant). Noise loop → bandpass ~1500 Hz
   (Q 1.1) → gain with a slow ~0.07 Hz wobble (±35%). A quiet suggestion of
   a stream beyond the trees — never identifiable, never silent.

7. **Fox shimmer** (bonus, ~0.012 peak). A sixth tiny voice: airy high
   bandpass noise (~6 kHz, Q 1.2) whose gain the 1 s interval sets from
   `audioEnv.foxDist` — 0 when null or ≥ 12 m, rising linearly to peak at
   close range, ×1.5 when `foxState === "curious"`. A breath of wonder when
   the fox is near; keep it on the edge of hearing.

## Hard constraints

- **Imports**: only `./audio-env` and `./rng`. No three.js, no react, no
  window access except `window.setInterval`/`clearInterval` for the single
  scheduler timer. **No Math.random** — one `createRng("evening-forest-nature")`
  instance drives every random decision (buffer noise, pans, phrase timing,
  glide direction).
- **Voice lifecycle pattern** (must match the score exactly — see excerpt
  below): a `Set<() => void>` of disposers; looping sources that never end
  register their disposer directly; scheduled one-shots self-dispose via
  `onended`. `stop()` is idempotent, clears the timer, disposes everything,
  disconnects all nodes. The AudioContext is closed by the owner after
  `stop()` — nothing may throw afterwards.
- **Node budget**: ≤ ~60 AudioNodes total. Phones run this.
- One scheduler `setInterval` at 1000 ms with 3.0 s lookahead does ALL the
  periodic work (cricket/owl/shimmer gain updates, bird/owl scheduling).
- Code style: 2-space indent, function declarations, explicit `: void`,
  comments in the calm confident voice of the excerpts below, no classes,
  no dead code, no emojis.

## Pattern excerpts (from the existing score — follow these)

```ts
// Every transient sound registers a disposer here so stop() can tear the
// whole thing down deterministically, even mid-ring.
const active = new Set<() => void>();

function register(dispose: () => void, ender: OscillatorNode): void {
  active.add(dispose);
  ender.onended = () => {
    if (active.delete(dispose)) dispose();
  };
}
```

```ts
// Noise + LFO shapes are fully deterministic (seeded rng, no Math.random).
// No oscillator ender fires for the looping source, so its disposer is
// registered directly.
const airLength = Math.floor(ctx.sampleRate * 2);
const airBuffer = ctx.createBuffer(2, airLength, ctx.sampleRate);
for (let ch = 0; ch < 2; ch += 1) {
  const data = airBuffer.getChannelData(ch);
  for (let i = 0; i < airLength; i += 1) {
    data[i] = rng() * 2 - 1;
  }
}
```

```ts
let stopped = false;
function stop(): void {
  if (stopped) return;
  stopped = true;

  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }

  for (const dispose of Array.from(active)) {
    active.delete(dispose);
    dispose();
  }
  // ...disconnect reverb/master nodes here
}
```

The rng API (full source of `rng.ts` — the ONLY other import):

```ts
export function createRng(seed: string): () => number;
// mulberry32 + xmur3 string seeding; each call returns [0, 1).
```

## Output format

Reply with exactly two things:

1. The complete `nature.ts` file in one fenced ```ts block (with a 2–5 line
   header comment introducing the module in the repo's voice).
2. A short list (≤ 10 bullets) of integration notes: estimated node count,
   any level you'd flag for a listen-pass, and anything the integrator must
   double-check. No restated spec, no extra prose.
