# BRIEF — Evening Forest: score rewrite in the Proteus manner (`web/lib/music.ts`)

You are writing one complete TypeScript module for a shipped web game. You
cannot see the repository; this brief contains everything you need. There
is an EXISTING score being replaced wholesale — do not ask for it; the spec
below is the full target.

## Situation

"Evening Forest" is a calm first-person walking simulator at dusk. The old
score (one static D drone + random pentatonic wandering) read as dull. The
owner's direction, verbatim intent:

- The reference is the **Proteus OST (David Kanaga)**: floating tonal
  washes, harmony that actually MOVES through changes, sparse plucked /
  bell tones, pure sine clarity, lots of space — peaceful but colourful,
  never busy, never hissy.
- **No white-noise layers of any kind.** The old file's filtered-noise
  "night air" bed is gone. Every element in your file must be tonal. The
  ONLY exception is the convolution reverb impulse (noise shaped into a
  decaying room) — that is space, not a noise layer, and it must stay.
- Adaptive: the world is read per cycle/per note through the environment
  bridge (night sinks and sparsens, walking brightens the flow, a close
  fox raises the chime odds).

## Your deliverable

A complete NEW `music.ts` exporting:

```ts
export type EveningMusicVoice = { stop: () => void };
export function createEveningMusic(
  ctx: AudioContext,
  out: AudioNode,
): EveningMusicVoice
```

## Musical architecture

**Pitch.** One helper `midiToFreq(m) = 440 * 2 ** ((m - 69) / 12)`. A
four-phase progression table — one phase per 38.4 s cycle, cycling forever
(so the harmony returns home every ~2.5 minutes):

```ts
type Phase = {
  rootMidi: number;        // the drone's root, low register
  padMidi: number[];       // 3 pad voicing notes
  scaleMidi: number[];     // the melody scale for this phase
};
const PHASES: Phase[] = [
  { rootMidi: 38, padMidi: [50, 57, 64], scaleMidi: [57, 60, 62, 65, 67, 69, 72] },  // D aeolian
  { rootMidi: 46, padMidi: [46, 53, 57], scaleMidi: [58, 60, 62, 64, 65, 67, 69] },  // Bb lydian colour
  { rootMidi: 41, padMidi: [53, 57, 60], scaleMidi: [53, 55, 57, 60, 62, 65, 67] },  // F major warmth
  { rootMidi: 36, padMidi: [48, 55, 62], scaleMidi: [55, 57, 60, 62, 64, 67, 69] },  // C sus2 float
];
```

(Dm → Bb → F → C: a melancholy-warm loop, the Proteus "same world, new
light" feeling. Feel free to adjust individual voicing notes ±1 semitone
for smooth voice-leading between phases — say so in your notes if you do.)

**Drone (continuous, the horizon of the piece).** Four sine oscillators:
root, fifth (×1.5), octave (×2) and upper octave (×4) — the upper two are
the phone-speaker lifelines (gains ~0.32 and ~0.12 vs the root's ~1.0
within a droneGain of 0.2). A ~0.05 Hz breath LFO modulates droneGain.
At each cycle boundary the drone RETUNES to the new phase root with a slow
glide (`frequency.exponentialRampToValueAtTime` over ~4 s on all four
oscillators) — the harmony breathes under everything.

**Motif (the identity — this is what kills the dullness).** At voice
creation, build ONE seeded contour: 6–8 scale-degree steps (indices into
the current phase's scale), shaped — pick a template from arch / descent /
rise, with steps bounded to ±2 degrees. Play it 1–2 times per cycle as
**plucks**: triangle + sine pair, fast 8 ms attack, 0.5–0.9 s exponential
decay, lowpass ~2000 Hz (darkened at night), quiet neighbour-echo on the
last note sometimes. Each statement maps the SAME contour into the CURRENT
phase's scale — the theme recomposed in the new key, which is exactly the
Proteus trick. Vary each statement: drop 1–2 random notes, occasional
octave lift on the final note. Between statements, silence is welcome.

**Pad bloom.** Once per cycle: the phase's three pad notes as slow sine
swells (4 s attack / 2 s hold / 6 s release, per-oscillator detune jitter
±4 cents, level 0.16 split across voices, lowpass ~1200 Hz). Night pulls
the pad quieter (×(1 − night·0.25)) and darker (lowpass −250·night).

**Dyads.** On a statement's peak note, ~30% chance of a quiet chord-tone
dyad (a note from padMidi an octave above, level ~0.3× the pluck).

**Chime.** Rare glassy two-partial sine bell (fundamental + ×2), decay
3–4 s, level 0.08, anywhere in the cycle. Probability per cycle
`0.4 · (1 − night·0.5) + (fox within 12 m ? 0.3 : 0)`; the tone derives
from the current phase (top scale note ×2).

**Adaptive reading (subtle, per cycle and per note).**
- `night = nightness(audioEnv.timeOfDay)` — same triangular curve as
  before: 0 for t ≤ 0.15, 1 at t = 0.55, 0 again by t ≥ 0.95 (define it
  locally, plus a local `clamp01`).
- Rest chance between motif statements and filler plucks:
  `0.15 + night·0.15`; pluck spacing stretched by `×(1 + night·0.25)`,
  tightened by walking `×(1 − clamp01(moveSpeed/3.4)·0.15)`.
- Melody register: a gravity offset sinking the contour an octave-ish at
  night (e.g. subtract 2–3 scale degrees, clamped, or transpose the mapped
  note −12 semitones when night > 0.6).
- Pluck level softened `×(1 − night·0.2)`; chime leans lower-toned at
  night.
- On the SAME 1 s scheduler tick: `droneGain.gain.setTargetAtTime(
  DRONE_LEVEL · (1 − night·0.18), now, 2)` (the breath LFO sums on top).

## Fixed signal graph & housekeeping (mirror the old score exactly)

- `musicBus` (0.5) → `DynamicsCompressor` (threshold −18, knee 20, ratio 2,
  attack 0.01, release 0.3) → makeup (1.5) → `out`.
- `dryGain` (0.9) → musicBus; `convolver` (3.5 s stereo exponentially
  decaying noise impulse, seeded) → `wetGain` (0.6) → musicBus;
  `reverbSend` (0.55) → convolver. Voices connect dry + send.
- Determinism: one `createRng("evening-forest-music")` drives everything;
  **no Math.random anywhere**. The motif contour, drops, detunes, pans and
  timings all come from it.
- Disposer pattern: `const active = new Set<() => void>()`; one-shot
  voices self-dispose via `ender.onended`; looping sources register
  directly. `stop()` idempotent: clears the timer, disposes everything,
  disconnects the graph.
- Single `window.setInterval` (1000 ms, lookahead 3.0 s) commits cycles,
  applies the drone retune at each new cycle, and retargets the drone
  level. No second timer.
- Imports ONLY `./rng.ts` and `./audio-env.ts` — explicit `.ts` extension
  (this repo's convention for lib leaf modules). No three.js, no react.
- `audioEnv` contract (read lazily, never snapshot at setup):
  `{ timeOfDay: number (0..1, 0.55 = deep night), moveSpeed: number (m/s,
  0..~3.4), foxDist: number | null, foxState: string | null }`.
- Style: 2-space indent, function declarations, explicit `: void`, calm
  confident comments in the voice of these excerpts, header comment (4–8
  lines) introducing the score in the repo's voice, no classes, no emojis.

Registration/dispose excerpt to follow:

```ts
const active = new Set<() => void>();
function register(dispose: () => void, ender: OscillatorNode): void {
  active.add(dispose);
  ender.onended = () => {
    if (active.delete(dispose)) dispose();
  };
}
```

Teardown excerpt to follow:

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
  // ...disconnect dry/wet/bus/compressor/makeup here
}
```

Reverb impulse excerpt to keep (the ONE noise-shaped element, spatial):

```ts
function buildImpulse(ctx: AudioContext, rng: () => number): AudioBuffer {
  const duration = 3.5;
  const decay = 3.0;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i += 1) {
      const t = i / length;
      data[i] = (rng() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return buffer;
}
```

## Output format

Reply with exactly two things:

1. The complete `music.ts` in one fenced ```ts block.
2. ≤ 8 bullets: any voicing tweaks you made for voice-leading, estimated
   oscillator budget per cycle, and what the integrator should listen for.
   No restated spec, no extra prose.
