# BRIEF — kitty-run × Dark Souls, deliverable 4: the souls score data

You are scoring a theme variant for an existing game. You have no access to
the repository; everything you need is here. Return **data only** — the
engine stays untouched, another pass plugs your values in.

## The existing score (what you are writing the dark twin of)

"Cat Runner" has a procedural adaptive soundtrack — pure Web Audio, no
files. A lookahead scheduler sequences a **four-bar chord loop** (one chord
per bar) while live gameplay state conducts tempo and layer crossfades.
Today it is Celeste-flavoured (Lena Raine): warm, hopeful, C major.

The fixed engine surfaces your data feeds:

```ts
// One chord per bar; root drives the bass, tones drive the arp (in order),
// pad is the four-voice 7th voicing played as one long warm saw pad.
const CHORDS: { root: number; tones: number[]; pad: number[] }[] = [
  { root: 130.81, tones: [261.63, 329.63, 392.0, 523.25], pad: [261.63, 329.63, 392.0, 493.88] }, // Cmaj7
  { root: 110.0,  tones: [261.63, 329.63, 440.0, 523.25], pad: [220.0, 261.63, 329.63, 392.0] }, // Am7
  { root: 87.31,  tones: [261.63, 349.23, 440.0, 523.25], pad: [174.61, 220.0, 261.63, 349.23] }, // Fmaj7
  { root: 98.0,   tones: [246.94, 293.66, 392.0, 493.88], pad: [196.0, 246.94, 293.66, 349.23] }, // G7
];

// The "kitty motif" — the lead voice, floating in a tempo-locked
// dotted-eighth delay + reverb. Exactly these step positions (step 0 =
// downbeat of bar 1; 16 steps per bar; the loop is 64 steps).
const MOTIF: { step: number; freq: number }[] = [
  { step: 16, freq: 329.63 }, // E5
  { step: 20, freq: 392.0 },  // G5
  { step: 24, freq: 440.0 },  // A5
  { step: 28, freq: 392.0 },  // G5
  { step: 32, freq: 329.63 }, // E5
  { step: 36, freq: 293.66 }, // D5
  { step: 40, freq: 261.63 }, // C5
];

// Tempo follows the run speed: bpm = 96 + 36 * speedNorm  (96 → 132).
// The pad's shared lowpass sits at 1100 Hz (the "warm analog" tone).
```

Voices above the data you control: warm detuned-saw pads through that
lowpass, melodic sine+triangle bass on quarters (root, root, fifth, root),
soft kick on 1 & 3 driving a sidechain pump, airy off-beat hats, a soft
snare backbeat, a plucky filtered arp climbing `tones`, a combo sparkle, and
the motif lead (triangle + glassy octave sine, vibrato, delay + reverb).
**You get no other dials** — voice volumes, envelopes, rhythms and layer
thresholds are locked (the owner tuned them over three passes).

On the menu (before the run) only the pads play — the chord loop alone IS
the menu mood. In-game, tempo and layers assemble as speed and combo build.

## The task

A second selectable character, the Dark Souls cat ("ashen"), re-themes the
whole game. The score must follow: same engine, same adaptive behaviour,
same loudness — but the **harmonic world** becomes Dark Souls: minor/modal,
solemn, ash-and-ember rather than maj7 warmth. Think slow Dark Souls menu
theme mood carried by the same synth bed.

Deliverable — five items:

1. **Music direction** — ≤ 100 words: the mode/progression logic and why it
   reads as Dark Souls without breaking the adaptive engine's behaviour.
2. **`SOULS_CHORDS`** — TS literal, exactly 4 entries in the engine's exact
   shape `{ root: number; tones: number[]; pad: number[] }` (4 tones each),
   Hz values (A4 = 440), a `// Name` comment per entry like the original.
3. **`SOULS_MOTIF`** — TS literal, exactly 7 entries, steps **exactly**
   16, 20, 24, 28, 32, 36, 40, Hz in the C5–A5 band (≈ 261.63–880 keep it
   ≤ 523.25 like the original), somber phrase, a `// Note` comment per
   entry.
4. **`SOULS_TEMPO`** — `{ bpmMin: number; bpmMax: number }` used as
   `bpm = bpmMin + (bpmMax - bpmMin) * speedNorm`.
5. **`SOULS_PAD_FILTER`** — one number (Hz): the pad lowpass for the souls
   mode (original 1100; darker = lower, but the pads must still bloom as
   chords, not mumble — stay ≥ 500).

## Hard constraints

- **Ranges the engine assumes** (obey or the synthesis misbehaves):
  - `root` bass band: 82–131 Hz (sub sine + octave triangle were tuned
    there).
  - `tones` arp band: 220–523 Hz (pluck filter tuned there); keep the four
    tones ascending and within one octave-ish span so the climb reads.
  - `pad` voicing: 4 voices, ≈ 160–400 Hz, root-position-ish stacking (the
    original pads never exceed ~494 Hz).
  - Keep the 7 motif notes inside 261.63–523.25 Hz.
- Harmony: minor/aeolian or dorian family at most one mode-flavour away
  from A minor; it must resolve as a loop (bar 4 → bar 1 must not clash).
  No maj7 sweetness anywhere.
- The progression should feel like ONE slow breath across four bars (the
  original is I–vi–IV–V of C); yours is the dusk equivalent.
- bpm range must stay ≥ 72 at the floor (below that the sidechain pump and
  hats separate audibly) and ≤ 120 at the ceiling (the souls run feels
  heavier than the pastel one). Keep the span between 24 and 40 bpm so the
  speed ramp still tells a story.
- No other changes exist. If you want a darker lead, say it with the notes
  you choose, not with new engine dials.

## Required output format (exactly six blocks)

1. Music direction (≤ 100 words).
2. `SOULS_CHORDS` (TS).
3. `SOULS_MOTIF` (TS).
4. `SOULS_TEMPO` (TS).
5. `SOULS_PAD_FILTER` (TS).
6. Notes (≤ 6 bullets: harmonic choices, loop-resolution check, tempo
   rationale, anything you rejected).
