# BRIEF — Evening Forest: tonal nature bed rewrite (`web/lib/nature.ts`)

You are writing one complete TypeScript module for a shipped web game. You
cannot see the repository; this brief is the full target — an EXISTING
module is being replaced wholesale, do not ask for it.

## Situation

"Evening Forest" is a calm first-person walking simulator at dusk. A
previous version of this bed built wind, leaf rustle, water and a fox
shimmer out of looping noise buffers pushed through filters. The owner's
verdict: **it reads as white noise and it doesn't work — remove anything
like that.** The reference is the Proteus OST: everything is tonal, pure,
spacious.

## Your deliverable

A complete NEW `nature.ts` exporting:

```ts
export function createNatureBed(
  ctx: AudioContext,
  out: AudioNode,
): { stop: () => void }
export function nightFactor(t: number): number
export function twilightFactor(t: number): number
```

The two factors are EXACTLY this math (a headless test asserts them; ramp
midpoints are compared with an epsilon, so keep the same formulas):

```ts
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// 0..1, triangular: silent before 0.15, deepest at 0.55, gone by 0.95.
export function nightFactor(t: number): number {
  const x = clamp01(t);
  if (x <= 0.15) return 0;
  if (x < 0.55) return (x - 0.15) / 0.4;
  if (x < 0.95) return (0.95 - x) / 0.4;
  return 0;
}

// Bird activity 0..1: full through golden hour, fading out by 0.45, silent
// through deep night, returning from 0.78 toward sunrise.
export function twilightFactor(t: number): number {
  const x = clamp01(t);
  if (x < 0.25) return 1;
  if (x < 0.45) return (0.45 - x) / 0.2;
  if (x < 0.78) return 0;
  if (x < 0.98) return (x - 0.78) / 0.2;
  return 1;
}
```

## The layers (all tonal — no noise buffers, no filtered-noise loops)

Levels are peaks before a shared `natureGain` (1.0) → `out`. The music bus
runs 0.5 into the same master: the bed sits UNDER the score.

1. **Crickets** (~0.03, night only, tonal). Two crickets, panned −0.55 /
   +0.6. Each: a pure sine at ~4200 Hz (±300 jitter between the two) →
   gain gated by a square LFO (22 Hz and 24.5 Hz — the chirp pulse) →
   gain gated by a slow sine phrase LFO (0.9 Hz / 0.7 Hz, depth 0.5 around
   0.5) → pan → a shared `cricketGain` (starts 0). The 1 s tick sets
   `cricketGain` target `nightFactor(timeOfDay) · level` with
   `setTargetAtTime(…, 1.5)`. A square-gated sine reads as a chirping
   insect with zero hiss.
2. **Birdsong** (~0.05, dawn/dusk only). Scheduled phrases via the 1 s
   lookahead tick (window 2.0 s, ahead 3.0 s): when
   `twilightFactor > 0.05`, chance ~0.22 per window → a phrase of 2–4
   sine whistles, quick frequency glides (2100→1600 Hz or reverse ±120 Hz
   wobble, 0.10–0.16 s each, 0.12–0.2 s gaps), 5 ms attack / 0.08–0.15 s
   decay, phrase gain × twilightFactor, random pan ±0.7. Notes share one
   panner; the last note's disposer takes it down. Each note registers via
   the `register(dispose, ender)` pattern (self-dispose on ended).
3. **Owl** (~0.06, night only, rare). When `nightFactor > 0.5`, chance
   ~0.04 per window: one sine, two low hoots — 340→300 Hz glides, note 1
   ~0.25 s, note 2 ~0.6 s starting 0.45 s later, 80 ms soft attacks,
   ×0.9 second-hoot level, through a 600 Hz lowpass, random pan ±0.5.
   The owl keeps a small convolution room (2.8 s stereo exponentially
   decaying impulse, wet 0.8 / dry 0.5) so it reads as distant — the ONE
   noise-shaped element allowed, and only here (it is space, not a hiss
   layer).
4. **Breeze shimmer** (~0.02, tonal, movement-driven). Two near-unison
   sines (587.33 Hz and 588.6 Hz — a slow beat, reads as moving air, never
   as hiss) through a gain with a very slow swell LFO (~0.02 Hz, depth
   ~35% of base). The 1 s tick scales its target by
   `1 + clamp01(moveSpeed / 3.4) · 0.5` — walking stirs the air. Keep it
   on the edge of hearing.
5. **Fox wonder-tone** (~0.012, tonal). A soft high dyad (sine 1174.66 Hz
   D6 + 1760 Hz A6, the dyad gain ~0.6× the fundamental) whose gain the 1 s
   tick eases from `audioEnv.foxDist`: 0 when null or ≥ 12 m, rising
   linearly to peak at close range, ×1.5 when `foxState === "curious"`,
   `setTargetAtTime(…, 0.8)`. A breath of wonder when the fox is near.

## Scheduler & lifecycle

- ONE `window.setInterval` at 1000 ms: eases the continuous layers
  (crickets, breeze, fox tone) toward the world's current state read from
  `audioEnv`, and rolls the bird/owl dice for every 2 s window inside the
  3.0 s lookahead. `audioEnv` is read lazily inside the tick, never
  snapshotted at setup.
- `audioEnv` contract: `{ timeOfDay: number (0..1, 0.55 deep night),
  moveSpeed: number (m/s, 0..~3.4), foxDist: number | null,
  foxState: string | null }`.
- Determinism: one `createRng("evening-forest-nature")` for every random
  decision (jitter, pans, phrase timing, glide direction). **No
  Math.random.**
- Disposer pattern (must match): a `Set<() => void>` of disposers; looping
  content that never "ends" registers its disposer directly; one-shots
  self-dispose via `ender.onended`:

```ts
const active = new Set<() => void>();
function register(dispose: () => void, ender: OscillatorNode): void {
  active.add(dispose);
  ender.onended = () => {
    if (active.delete(dispose)) dispose();
  };
}
```

- `stop()` idempotent: clears the timer, disposes everything, disconnects
  owl dry/wet/convolver and the bus. The owner may close the AudioContext
  right after — nothing may throw.

```ts
let stopped = false;
function stop(): void {
  if (stopped) return;
  stopped = true;
  if (timer !== null) { window.clearInterval(timer); timer = null; }
  for (const dispose of Array.from(active)) {
    active.delete(dispose);
    dispose();
  }
  // ...disconnect owlDry/owlWet/convolver/natureGain here
}
```

## Hard constraints

- Imports ONLY `./audio-env.ts` and `./rng.ts` — with explicit `.ts`
  extensions (a headless node test loads this module; extensionless
  relative imports break it). No three.js, no react. No DOM beyond
  `window.setInterval`/`clearInterval`.
- **No AudioBuffer noise loops anywhere** (the owl's convolution impulse
  is the only buffer). No `<audio>` elements, no fetches.
- Node budget ≤ ~40 persistent nodes; phones run this.
- Style: 2-space indent, function declarations, explicit `: void`, calm
  confident comments in the repo's voice, 3–6 line header comment
  introducing the module, no classes, no dead code, no emojis.

## Output format

Reply with exactly two things:

1. The complete `nature.ts` in one fenced ```ts block.
2. ≤ 8 bullets: node count estimate and what the integrator should listen
   for (especially whether the tonal crickets/breeze read as natural).
   No restated spec, no extra prose.
