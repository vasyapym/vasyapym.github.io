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

  // Springy hop: square body + a bright tick transient + a faintly detuned
  // twin for warmth.
  jump(): void {
    this.tone({
      type: "square",
      from: 300,
      to: 620,
      duration: 0.12,
      volume: 0.1,
      attack: 0.004,
      detune: 8,
    });
    this.tone({ type: "sine", from: 1400, duration: 0.03, volume: 0.04 });
  }

  // Second jump sits higher; same tick so it reads as a sibling of jump().
  doubleJump(): void {
    this.tone({
      type: "square",
      from: 420,
      to: 820,
      duration: 0.12,
      volume: 0.09,
      attack: 0.003,
    });
    this.tone({
      type: "square",
      from: 620,
      to: 980,
      at: 0.05,
      duration: 0.1,
      volume: 0.07,
      attack: 0.003,
    });
    this.tone({ type: "sine", from: 1400, at: 0.05, duration: 0.03, volume: 0.04 });
  }

  // Whoosh: a bandpass sweep that drifts left, a bright highpass sizzle on
  // top, and a low triangle underlay for body.
  dash(): void {
    this.noiseBurst({
      duration: 0.24,
      volume: 0.15,
      filterType: "bandpass",
      from: 2400,
      to: 700,
      q: 1.2,
      pan: -0.2,
    });
    this.noiseBurst({ duration: 0.08, volume: 0.04, filterType: "highpass", from: 5000 });
    this.tone({ type: "triangle", from: 220, to: 140, duration: 0.18, volume: 0.03 });
  }

  // Landing weight scales with fall speed (impact 0..1): higher, longer and
  // louder at full falls; barely there on soft touchdowns.
  land(impact: number): void {
    const i = Math.min(1, Math.max(0, impact));
    this.tone({
      type: "sine",
      from: 150 + 60 * i,
      to: 85,
      duration: 0.06 + 0.05 * i,
      volume: 0.05 + 0.06 * i,
    });
    this.noiseBurst({
      duration: 0.05,
      volume: 0.03 + 0.04 * i,
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
    this.tone({ type: "sine", from: hz, duration: 0.16, volume: 0.11 });
    this.tone({ type: "sine", from: hz * 1.5, at: 0.04, duration: 0.14, volume: 0.06 });
    this.tone({ type: "sine", from: hz * 2, duration: 0.09, volume: 0.035 });
  }

  // Rising, hopeful pair of triangle sweeps.
  heal(): void {
    this.tone({
      type: "triangle",
      from: 392,
      to: 523,
      duration: 0.18,
      volume: 0.1,
      attack: 0.004,
    });
    this.tone({
      type: "triangle",
      from: 523,
      to: 659,
      at: 0.09,
      duration: 0.2,
      volume: 0.1,
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
        volume: 0.1,
      });
    });
    this.tone({
      type: "sine",
      from: 1047 * 2,
      at: notes.length * 0.07,
      duration: 0.12,
      volume: 0.04,
    });
  }

  // Getting hurt: punchy, not harsh — a dull lowpass thud, a pitched-down
  // triangle body, and a tiny square transient for the "smack".
  hit(): void {
    this.noiseBurst({ duration: 0.12, volume: 0.2, filterType: "lowpass", from: 500 });
    this.tone({ type: "triangle", from: 200, to: 55, duration: 0.26, volume: 0.15 });
    this.tone({ type: "square", from: 90, duration: 0.05, volume: 0.08 });
  }

  // Descending minor-ish sigh, then a soft low tone to resolve the moment.
  gameover(): void {
    const notes = [523, 392, 311, 233];
    notes.forEach((hz, i) => {
      this.tone({
        type: "triangle",
        from: hz,
        duration: 0.3,
        at: i * 0.17,
        volume: 0.1,
      });
    });
    this.tone({
      type: "sine",
      from: 130,
      at: notes.length * 0.17,
      duration: 0.5,
      volume: 0.06,
    });
  }

  // Cheerful "go!" at the start of a run: two rising triangles capped with a
  // high sine sparkle.
  runStart(): void {
    this.tone({ type: "triangle", from: 523, to: 659, duration: 0.09, volume: 0.08 });
    this.tone({ type: "triangle", from: 784, at: 0.08, duration: 0.12, volume: 0.08 });
    this.tone({ type: "sine", from: 1568, at: 0.16, duration: 0.1, volume: 0.03 });
  }

  // UI: a soft, downward square blip for clicks.
  uiClick(): void {
    this.tone({ type: "square", from: 620, to: 440, duration: 0.045, volume: 0.045 });
  }

  // UI: a barely-there sine tick for hover.
  uiHover(): void {
    this.tone({ type: "sine", from: 950, duration: 0.03, volume: 0.018 });
  }

  // Footstep tap. Very subtle; brighter and louder with speed, alternating
  // stereo so a run reads as left/right paws, with a touch of pitch variance.
  trot(speedNorm: number): void {
    const s = Math.min(1, Math.max(0, speedNorm));
    this.trotLeft = !this.trotLeft;
    const variance = 1 + (Math.random() * 0.12 - 0.06);
    this.noiseBurst({
      duration: 0.045,
      volume: 0.022 + 0.02 * s,
      filterType: "lowpass",
      from: (900 + 600 * s) * variance,
      pan: this.trotLeft ? -0.35 : 0.35,
    });
  }
}
