# BRIEF — kitty-run × Dark Souls v2, deliverable 5: weighty SFX

You are re-voicing the **sound effects engine** of an existing browser game
for its Dark Souls character theme. You have no repo access — the full
current engine file is below. Return **one complete TS file**, in the exact
output format at the end.

## The engine today (what must survive)

Procedural Web Audio, zero audio files. One cached 1-second noise buffer,
replayed with random offsets (iOS Safari budget); StereoPannerNode
feature-detected. Signal graph: sfx voices → `sfxBus` → `master` →
destination; the soundtrack connects to `musicBus` (three persisted slider
levels master/SFX/music, pre-start() drags stashed and applied at start()).
Voice helpers: `tone({type, from, to?, at?, duration, volume, attack?,
detune?, pan?, filter?})` and `noiseBurst({duration, volume, filterType,
from, to?, q?, at?, pan?})`. Public voice API (signatures fixed):
`jump() doubleJump() dash() land(impact) pickup(combo) heal() milestone()
hit() gameover() runStart() uiClick() uiHover() trot(speedNorm)` plus
`start()`, `started`, `context`, `musicOutput`, `setMaster/setSfx/setMusic`.

The pastel SFX set is well-liked — **its sound must not change at all**.

## The souls direction (weight, cloth, iron, souls — no arcade blips)

All thirteen voices re-voiced in the knight register. Somber, weighty,
a little quieter than pastel overall (this world whispers). Recipes:

- `jump()` — a soft **cloth push**: a lowpassed noise swish (≈ 500→180 Hz,
  0.1s) + a quiet low thump (≈ 130→95). Nothing bright.
- `doubleJump()` — the same cloth recipe, heavier, with a faint rising
  breath (keep it subdued).
- `dash()` — a **heavy roll**: a longer low rumble (lowpass ≈ 700→110,
  ~0.4s) + a body thud (~90→48) + a few gritty scuff bursts. Reads as
  tumbling plate, not a whoosh.
- `land(impact)` — scales with impact as today; **armored thump**: low
  sine drop + a short inharmonic metal ring (2–3 sine partials around
  700–1600 Hz, fast decay, quiet, scaled by impact) + a low scuff.
- `pickup(combo)` — **soul absorb**: keep the combo ladder idea but souls
  climbs a **minor pentatonic** ([0, 3, 5, 7, 10] semitones) from a lower
  base (≈ A4 440 Hz). Voice: a soft glassy sine + a quiet fifth above
  delayed a touch + a breathy noise tail; ethereal, never arcade.
- `heal()` — **estus**: a warm low swell (lowpassed, 180→320, ~0.25s) +
  a small glass clink on top (one high sine, quick).
- `milestone()` — a **distant choir swell + bell**: a slow two-note fifth
  (e.g. 220 + 330, attack ~0.15s, ~0.8s decay) with a faint inharmonic
  bell tap (partial stack ratios ≈ 1.0/2.76/5.4 of ~330 Hz, quiet).
  No fanfare.
- `hit()` — **armor clang + sub drop**: a bright metallic ring burst
  (2–3 inharmonic sines ~820/1240/1660 Hz, 0.15s decay) over a big
  lowpassed thud (700→200) and a sub drop (~110→40). Punchy but dull,
  not harsh.
- `gameover()` — a **deep resolve**: a low drone swell (≈ 65 Hz, slow
  attack, ~1.2s) with a two-note descending minor sigh (triangle through
  a lowpass ~600) and a slow noise wash. The YOU DIED silence.
- `runStart()` — a low swell + one soft bell-ish tap; no cheerful
  fanfare.
- `uiClick()` — a dull iron knock (short lowpassed square or triangle
  ~180–240 Hz) with a tiny metal tick.
- `uiHover()` — a faint low tick (≈ 220 Hz, quieter than today).
- `trot(speedNorm)` — **heavy boots**: dark low scuffs (lowpass ≈
  450–750 Hz by speed), same alternating-pan + variance pattern, a touch
  quieter. Keep it subtle — it fires constantly.

## Architecture constraints (the project's rules)

- **No theme branches**: replace the voice bodies with two complete
  `VoiceSet` records — `type VoiceSet = { jump(): void; doubleJump(): void;
  dash(): void; land(impact: number): void; pickup(combo: number): void;
  heal(): void; milestone(): void; hit(): void; gameover(): void;
  runStart(): void; uiClick(): void; uiHover(): void; trot(speedNorm:
  number): void }` — one for kitty, one for souls, held in a
  `Record<SfxMode, VoiceSet>`; `private setVoiceSet`/`mode` field +
  `setMode(mode: SfxMode)` swaps it. Export `type SfxMode = "kitty" |
  "souls"`. The public methods become one-line delegates. Both sets are
  arrow functions (or private methods bound at use time — your call) that
  capture the instance so they can use `tone`/`noiseBurst`/`panTo`, the
  noise buffer, and trot pan state. Keep helper/trotState fields shared.
  `SFX_MODES.kitty` must reproduce today's sound **exactly** (same helper
  calls, same values).
- The trot alternation state (`trotLeft`), the noise cache, the three
  sliders, and `start()`'s graph are untouched.
- No per-call AudioBuffer allocation; keep Math.random usage as-is style
  (offsets/variance only). No new files, no fetch.
- Souls voices may add small private helpers (e.g. an inharmonic ring
  builder) — fine, as long as they route into `sfxBus` through `panTo`
  and reuse the cached noise buffer.
- TypeScript, no `any`; keep the header comment updated to describe both
  registers.

## The current file (full — you are rewriting it)

// Synthesised sound effects, the pastel-forest way: no audio files, ever.
// The AudioContext is created inside the first user gesture that starts the
// run, so it never falls foul of autoplay policy. Everything here is
// procedural Web Audio — the SFX engine and the (separate) chiptune
// soundtrack share one graph and one loudness stack.
//
// Signal graph (built in start()):
//
//   sfx voices ──▶ sfxBus ─┐
//                          ├─▶ master ──▶ destination
//   soundtrack ──▶ musicBus┘
//
// Three loudness buses map to the three UI sliders (master / SFX / music).
// Slider values may arrive BEFORE start(): we stash them in fields and apply
// them when the graph is built; later changes glide via setTargetAtTime so
// dragging a slider never clicks.
//
// Voice design follows a Celeste-ish philosophy: crisp, snappy, layered —
// a transient (tick / click), a body (the tuned tone), and a tail (noise or
// a decaying partial). Nothing is realistic; everything is emotionally legible.
//
// Performance notes for iOS Safari:
//   - ONE 1-second white-noise buffer is cached in start() and replayed with
//     random offsets; no voice allocates an AudioBuffer per call.
//   - StereoPannerNode is feature-detected (older Safari lacks it) and the
//     pan simply passes through when absent.

type Ctor = typeof AudioContext;

// Pentatonic pickup ladder: the combo index walks these semitone offsets,
// wrapping up an octave each lap so long combos keep climbing.
const PENTATONIC = [0, 2, 4, 7, 9];
const PICKUP_BASE_HZ = 523.25;

// Shape passed to the tone() helper. Optional layers (detune / pan / filter)
// stay undefined for the common case so the fast path allocates the minimum.
type ToneOptions = {
  type: OscillatorType;
  from: number;
  to?: number;
  at?: number;
  duration: number;
  volume: number;
  attack?: number;
  detune?: number; // cents; adds a second, detuned oscillator for warmth
  pan?: number; // -1..1
  filter?: { type: BiquadFilterType; freq: number; q?: number };
};

type NoiseOptions = {
  duration: number;
  volume: number;
  filterType: BiquadFilterType;
  from: number;
  to?: number;
  q?: number;
  at?: number;
  pan?: number;
};

export class Sfx {
  private ctx: AudioContext | null = null;

  // The three-bus loudness stack. Null until start() builds the graph.
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;

  // Cached white noise — created once in start(), replayed forever.
  private noiseBuffer: AudioBuffer | null = null;

  // Stored slider values. Defaults match the classic mix; setters may
  // overwrite these before start(), in which case start() applies them.
  private masterLevel = 0.42;
  private sfxLevel = 0.9;
  private musicLevel = 0.85;

  // trot() alternates its footstep pan left/right; this owns the flip state.
  private trotLeft = false;

  get started(): boolean {
    return this.ctx !== null;
  }

  get context(): AudioContext | null {
    return this.ctx;
  }

  // The soundtrack class connects into this node (was `output`).
  get musicOutput(): GainNode | null {
    return this.musicBus;
  }

  start(): void {
    // Re-invocation only resumes — we never build a second graph.
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }

    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    // master -> destination; the two source buses fan into master.
    const master = ctx.createGain();
    master.gain.value = this.masterLevel;
    master.connect(ctx.destination);

    const sfxBus = ctx.createGain();
    sfxBus.gain.value = this.sfxLevel;
    sfxBus.connect(master);

    const musicBus = ctx.createGain();
    musicBus.gain.value = this.musicLevel;
    musicBus.connect(master);

    // One second of white noise, reused by every noise-based voice.
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

    this.ctx = ctx;
    this.master = master;
    this.sfxBus = sfxBus;
    this.musicBus = musicBus;
    this.noiseBuffer = buffer;
  }

  // --- Loudness setters -----------------------------------------------------
  // Each stores the value (so a pre-start() slider drag survives to start())
  // and, if the graph exists, glides to it click-free via setTargetAtTime.

  setMaster(v: number): void {
    this.masterLevel = this.apply(this.master, v);
  }
  setSfx(v: number): void {
    this.sfxLevel = this.apply(this.sfxBus, v);
  }
  setMusic(v: number): void {
    this.musicLevel = this.apply(this.musicBus, v);
  }

  private apply(node: GainNode | null, v: number): number {
    const clamped = Math.min(1, Math.max(0, v));
    if (node && this.ctx) {
      node.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
    }
    return clamped;
  }

  // --- Helpers --------------------------------------------------------------

  // A single tuned oscillator with a snappy attack + exponential tail. May
  // grow a detuned twin (warmth), a stereo pan, and a biquad filter between
  // its gain and the SFX bus.
  private tone(options: ToneOptions): void {
    if (!this.ctx || !this.sfxBus) return;
    const t0 = this.ctx.currentTime + (options.at ?? 0);
    const attack = options.attack ?? 0.004;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(options.volume, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + options.duration);

    // Optional filter sits between the voice gain and the bus.
    let tail: AudioNode = gain;
    if (options.filter) {
      const filter = this.makeFilter(options.filter);
      gain.connect(filter);
      tail = filter;
    }

    // Optional pan, then into the SFX bus.
    this.panTo(tail, options.pan).connect(this.sfxBus);

    // Primary oscillator (+ optional detuned partner) feed the gain —
    // same loudness, the beating between them is the point.
    this.makeOsc(options, t0, 0).connect(gain);
    if (options.detune !== undefined) {
      this.makeOsc(options, t0, options.detune).connect(gain);
    }
  }

  // Build + schedule one oscillator for a ToneOptions sweep.
  private makeOsc(
    options: ToneOptions,
    t0: number,
    detune: number,
  ): OscillatorNode {
    const ctx = this.ctx as AudioContext;
    const osc = ctx.createOscillator();
    osc.type = options.type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(options.from, t0);
    if (options.to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, options.to),
        t0 + options.duration,
      );
    }
    osc.start(t0);
    osc.stop(t0 + options.duration + 0.05);
    return osc;
  }

  private makeFilter(spec: {
    type: BiquadFilterType;
    freq: number;
    q?: number;
  }): BiquadFilterNode {
    const filter = (this.ctx as AudioContext).createBiquadFilter();
    filter.type = spec.type;
    filter.frequency.value = spec.freq;
    if (spec.q !== undefined) filter.Q.value = spec.q;
    return filter;
  }

  // Filtered, swept white noise from the cached buffer — the transient/tail
  // workhorse. No per-call buffer allocation: we replay a random slice.
  private noiseBurst(options: NoiseOptions): void {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
    const t0 = this.ctx.currentTime + (options.at ?? 0);

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = options.filterType;
    filter.frequency.setValueAtTime(options.from, t0);
    if (options.to !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(1, options.to),
        t0 + options.duration,
      );
    }
    if (options.q !== undefined) filter.Q.value = options.q;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(options.volume, t0 + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + options.duration);

    src.connect(filter).connect(gain);
    this.panTo(gain, options.pan).connect(this.sfxBus);

    // Random read offset keeps repeated bursts from sounding identical, while
    // staying inside the 1-second buffer given our short durations.
    const maxOffset = Math.max(0, 1 - options.duration - 0.05);
    src.start(t0, Math.random() * maxOffset, options.duration + 0.02);
  }

  // Route through a StereoPannerNode when available (Safari guard); otherwise
  // return the node untouched so the chain still connects.
  private panTo(node: AudioNode, pan?: number): AudioNode {
    if (pan === undefined || !this.ctx || !this.ctx.createStereoPanner)
      return node;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.min(1, Math.max(-1, pan));
    node.connect(panner);
    return panner;
  }

  // --- Voices ---------------------------------------------------------------

  // Soft airy hop — a gentle "hup": springy blip + breath of noise + a tiny
  // push-off. No square wave; Celeste's jump is a breath, not a bleep.
  jump(): void {
    this.tone({
      type: "triangle",
      from: 260,
      to: 520,
      duration: 0.11,
      volume: 0.12,
      attack: 0.003,
    });
    this.noiseBurst({ duration: 0.09, volume: 0.06, filterType: "highpass", from: 2200, to: 1200 });
    this.tone({ type: "sine", from: 170, duration: 0.035, volume: 0.05 });
  }

  // Second wind — the same recipe a register up, with a little rising
  // shimmer so it reads as a variation of the jump, not a new sound.
  doubleJump(): void {
    this.tone({
      type: "triangle",
      from: 330,
      to: 660,
      duration: 0.12,
      volume: 0.13,
      attack: 0.003,
    });
    this.noiseBurst({ duration: 0.1, volume: 0.07, filterType: "highpass", from: 3200, to: 1600 });
    this.tone({ type: "sine", from: 660, to: 990, at: 0.03, duration: 0.07, volume: 0.04 });
    this.tone({ type: "sine", from: 200, duration: 0.03, volume: 0.05 });
  }

  // Whoosh: a bandpass sweep that drifts left, a bright highpass sizzle on
  // top, and a low triangle underlay for body.
  dash(): void {
    this.noiseBurst({
      duration: 0.3,
      volume: 0.24,
      filterType: "bandpass",
      from: 2400,
      to: 700,
      q: 1.2,
      pan: -0.2,
    });
    this.noiseBurst({ duration: 0.1, volume: 0.06, filterType: "highpass", from: 5000 });
    this.tone({ type: "triangle", from: 220, to: 140, duration: 0.2, volume: 0.05 });
  }

  // Landing weight scales with fall speed (impact 0..1): higher, longer and
  // louder at full falls; barely there on soft touchdowns. A sub-octave
  // thump sells the weight on hard landings.
  land(impact: number): void {
    const i = Math.min(1, Math.max(0, impact));
    this.tone({
      type: "sine",
      from: 150 + 60 * i,
      to: 85,
      duration: 0.06 + 0.05 * i,
      volume: 0.08 + 0.09 * i,
    });
    this.tone({
      type: "sine",
      from: 90,
      to: 45,
      at: 0.01,
      duration: 0.09 + 0.04 * i,
      volume: 0.04 + 0.07 * i,
    });
    this.noiseBurst({
      duration: 0.05,
      volume: 0.05 + 0.05 * i,
      filterType: "lowpass",
      from: 500,
    });
  }

  // Pickup chime climbs the pentatonic ladder with combo. Body + delayed
  // fifth + a fast-decaying octave bell partial for sparkle.
  pickup(combo: number): void {
    const step =
      PENTATONIC[combo % PENTATONIC.length] +
      Math.floor(combo / PENTATONIC.length) * 12;
    const hz = PICKUP_BASE_HZ * Math.pow(2, Math.min(24, step) / 12);
    this.tone({ type: "sine", from: hz, duration: 0.16, volume: 0.16 });
    this.tone({ type: "sine", from: hz * 1.5, at: 0.04, duration: 0.14, volume: 0.09 });
    this.tone({ type: "sine", from: hz * 2, duration: 0.09, volume: 0.06 });
  }

  // Rising, hopeful pair of triangle sweeps.
  heal(): void {
    this.tone({
      type: "triangle",
      from: 392,
      to: 523,
      duration: 0.18,
      volume: 0.14,
      attack: 0.004,
    });
    this.tone({
      type: "triangle",
      from: 523,
      to: 659,
      at: 0.09,
      duration: 0.2,
      volume: 0.14,
      attack: 0.004,
    });
  }

  // Four-note fanfare plus an octave sparkle over the final note.
  milestone(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((hz, i) => {
      this.tone({
        type: "triangle",
        from: hz,
        at: i * 0.07,
        duration: 0.16,
        volume: 0.14,
      });
    });
    this.tone({
      type: "sine",
      from: 1047 * 2,
      at: notes.length * 0.07,
      duration: 0.12,
      volume: 0.07,
    });
  }

  // Getting hurt: punchy, not harsh — a swept lowpass thud, a pitched-down
  // triangle body, and a tiny square transient for the "smack".
  hit(): void {
    this.noiseBurst({
      duration: 0.14,
      volume: 0.28,
      filterType: "lowpass",
      from: 700,
      to: 250,
    });
    this.tone({ type: "triangle", from: 200, to: 55, duration: 0.28, volume: 0.22 });
    this.tone({ type: "square", from: 90, duration: 0.05, volume: 0.12 });
  }

  // Descending minor-ish sigh over a soft noise wash, then a low tone to
  // resolve the moment.
  gameover(): void {
    const notes = [523, 392, 311, 233];
    notes.forEach((hz, i) => {
      this.tone({
        type: "triangle",
        from: hz,
        duration: 0.3,
        at: i * 0.17,
        volume: 0.13,
      });
    });
    this.noiseBurst({
      duration: 0.6,
      volume: 0.05,
      filterType: "lowpass",
      from: 400,
      to: 120,
      at: 3 * 0.17,
    });
    this.tone({
      type: "sine",
      from: 130,
      at: notes.length * 0.17,
      duration: 0.5,
      volume: 0.1,
    });
  }

  // Cheerful "go!" at the start of a run: two rising triangles capped with a
  // high sine sparkle.
  runStart(): void {
    this.tone({ type: "triangle", from: 523, to: 659, duration: 0.09, volume: 0.12 });
    this.tone({ type: "triangle", from: 784, at: 0.08, duration: 0.12, volume: 0.12 });
    this.tone({ type: "sine", from: 1568, at: 0.16, duration: 0.1, volume: 0.05 });
  }

  // UI: a soft, downward square blip for clicks.
  uiClick(): void {
    this.tone({ type: "square", from: 620, to: 440, duration: 0.045, volume: 0.07 });
  }

  // UI: a barely-there sine tick for hover.
  uiHover(): void {
    this.tone({ type: "sine", from: 950, duration: 0.03, volume: 0.028 });
  }

  // Footstep tap. Subtle by design (it plays constantly); brighter and
  // louder with speed, alternating stereo so a run reads as left/right
  // paws, with a touch of pitch variance.
  trot(speedNorm: number): void {
    const s = Math.min(1, Math.max(0, speedNorm));
    this.trotLeft = !this.trotLeft;
    const variance = 1 + (Math.random() * 0.12 - 0.06);
    this.noiseBurst({
      duration: 0.045,
      volume: 0.03 + 0.025 * s,
      filterType: "lowpass",
      from: (900 + 600 * s) * variance,
      pan: this.trotLeft ? -0.35 : 0.35,
    });
  }
}

## Required output format

1. **Full replacement `audio.ts`** — one complete TS code block.
2. **Notes** — ≤ 8 bullets: the VoiceSet/SfxMode shape, any shared private
   helpers you added, and an explicit statement that the kitty VoiceSet's
   helper calls are byte-equal to the current bodies.
