// Synthesised sound effects: no audio files, ever.
// The AudioContext is created inside the first user gesture that starts the
// run, so it never falls foul of autoplay policy. Everything here is
// procedural Web Audio — the SFX engine and the (separate) soundtrack share
// one graph and one loudness stack.
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
// Two registers, no theme branches inside voices. Each register is a complete
// VoiceSet (one arrow function per public voice); setMode() swaps which set
// the public one-line delegates call:
//
//   "kitty" — the pastel-forest set. Celeste-ish: crisp, snappy, layered —
//             a transient (tick / click), a body (the tuned tone), and a
//             tail (noise or a decaying partial). Bright and emotionally
//             legible. Its recipes are frozen: they must sound exactly as
//             they always have.
//   "souls" — the knight register. Weight, cloth, iron, souls: lowpassed
//             cloth swishes, sub thumps, short inharmonic metal rings, slow
//             minor swells. Quieter overall — this world whispers. Nothing
//             chirps; nothing fanfares.
//
// Performance notes for iOS Safari:
//   - ONE 1-second white-noise buffer is cached in start() and replayed with
//     random offsets; no voice allocates an AudioBuffer per call.
//   - StereoPannerNode is feature-detected (older Safari lacks it) and the
//     pan simply passes through when absent.

type Ctor = typeof AudioContext;

export type SfxMode = "kitty" | "souls";

// One complete register. Public voice methods delegate to whichever set is
// active; both sets capture the Sfx instance so they can reach the shared
// helpers, the cached noise buffer and the trot pan state.
type VoiceSet = {
  jump(): void;
  doubleJump(): void;
  dash(): void;
  land(impact: number): void;
  pickup(combo: number): void;
  heal(): void;
  milestone(): void;
  hit(): void;
  gameover(): void;
  runStart(): void;
  uiClick(): void;
  uiHover(): void;
  trot(speedNorm: number): void;
};

// Kitty pickup ladder: major pentatonic from C5. The combo index walks these
// semitone offsets, wrapping up an octave each lap so long combos keep climbing.
const PENTATONIC = [0, 2, 4, 7, 9];
const PICKUP_BASE_HZ = 523.25;

// Souls pickup ladder: minor pentatonic from A4 — same climbing idea, lower
// and darker. Souls absorbed, not coins collected.
const SOULS_PENTATONIC = [0, 3, 5, 7, 10];
const SOULS_PICKUP_BASE_HZ = 440;

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

// Shape for the souls-only ring() helper: a stack of inharmonic sine partials
// (absolute Hz) that share one onset. Higher partials come in quieter and die
// sooner, which is what makes a stack read as struck metal rather than a chord.
type RingOptions = {
  partials: number[];
  duration: number;
  volume: number;
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
  // Shared by both registers so switching mode mid-run keeps the L/R rhythm.
  private trotLeft = false;

  // Both registers, built once per instance (the arrow functions close over
  // `this`). Field order matters: `voiceSet` below reads this record.
  private readonly SFX_MODES: Record<SfxMode, VoiceSet> = {
    kitty: this.buildKittyVoices(),
    souls: this.buildSoulsVoices(),
  };

  private mode: SfxMode = "kitty";
  private voiceSet: VoiceSet = this.SFX_MODES.kitty;

  get started(): boolean {
    return this.ctx !== null;
  }

  get context(): AudioContext | null {
    return this.ctx;
  }

  get currentMode(): SfxMode {
    return this.mode;
  }

  // The soundtrack class connects into this node (was `output`).
  get musicOutput(): GainNode | null {
    return this.musicBus;
  }

  // Swap registers. Purely a table lookup — nothing in the graph changes, so
  // it is safe to call before start(), mid-run, or from a settings screen.
  setMode(mode: SfxMode): void {
    this.mode = mode;
    this.voiceSet = this.SFX_MODES[mode];
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

  // Souls-only: a struck-metal ring built from a short stack of sine partials
  // at inharmonic ratios. Each partial is a plain tone() (so it routes through
  // panTo → sfxBus like everything else); partial i is 0.62^i quieter and
  // loses 18% of the duration per step, so the top shimmers off first and
  // only the fundamental lingers. Kept quiet by callers — iron, not bells.
  private ring(options: RingOptions): void {
    options.partials.forEach((hz, i) => {
      this.tone({
        type: "sine",
        from: hz,
        at: options.at,
        duration: Math.max(0.03, options.duration * (1 - 0.18 * i)),
        volume: options.volume * Math.pow(0.62, i),
        attack: 0.002,
        pan: options.pan,
      });
    });
  }

  // --- Voices (public delegates) -------------------------------------------

  jump(): void {
    this.voiceSet.jump();
  }
  doubleJump(): void {
    this.voiceSet.doubleJump();
  }
  dash(): void {
    this.voiceSet.dash();
  }
  land(impact: number): void {
    this.voiceSet.land(impact);
  }
  pickup(combo: number): void {
    this.voiceSet.pickup(combo);
  }
  heal(): void {
    this.voiceSet.heal();
  }
  milestone(): void {
    this.voiceSet.milestone();
  }
  hit(): void {
    this.voiceSet.hit();
  }
  gameover(): void {
    this.voiceSet.gameover();
  }
  runStart(): void {
    this.voiceSet.runStart();
  }
  uiClick(): void {
    this.voiceSet.uiClick();
  }
  uiHover(): void {
    this.voiceSet.uiHover();
  }
  trot(speedNorm: number): void {
    this.voiceSet.trot(speedNorm);
  }

  // --- Register: kitty (pastel forest) --------------------------------------
  // FROZEN. These bodies are the shipped pastel set, helper calls and values
  // unchanged. Do not retune here — add a new register instead.

  private buildKittyVoices(): VoiceSet {
    return {
      // Soft airy hop — a gentle "hup": springy blip + breath of noise + a tiny
      // push-off. No square wave; Celeste's jump is a breath, not a bleep.
      jump: () => {
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
      },

      // Second wind — the same recipe a register up, with a little rising
      // shimmer so it reads as a variation of the jump, not a new sound.
      doubleJump: () => {
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
      },

      // Whoosh: a bandpass sweep that drifts left, a bright highpass sizzle on
      // top, and a low triangle underlay for body.
      dash: () => {
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
      },

      // Landing weight scales with fall speed (impact 0..1): higher, longer and
      // louder at full falls; barely there on soft touchdowns. A sub-octave
      // thump sells the weight on hard landings.
      land: (impact: number) => {
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
      },

      // Pickup chime climbs the pentatonic ladder with combo. Body + delayed
      // fifth + a fast-decaying octave bell partial for sparkle.
      pickup: (combo: number) => {
        const step =
          PENTATONIC[combo % PENTATONIC.length] +
          Math.floor(combo / PENTATONIC.length) * 12;
        const hz = PICKUP_BASE_HZ * Math.pow(2, Math.min(24, step) / 12);
        this.tone({ type: "sine", from: hz, duration: 0.16, volume: 0.16 });
        this.tone({ type: "sine", from: hz * 1.5, at: 0.04, duration: 0.14, volume: 0.09 });
        this.tone({ type: "sine", from: hz * 2, duration: 0.09, volume: 0.06 });
      },

      // Rising, hopeful pair of triangle sweeps.
      heal: () => {
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
      },

      // Four-note fanfare plus an octave sparkle over the final note.
      milestone: () => {
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
      },

      // Getting hurt: punchy, not harsh — a swept lowpass thud, a pitched-down
      // triangle body, and a tiny square transient for the "smack".
      hit: () => {
        this.noiseBurst({
          duration: 0.14,
          volume: 0.28,
          filterType: "lowpass",
          from: 700,
          to: 250,
        });
        this.tone({ type: "triangle", from: 200, to: 55, duration: 0.28, volume: 0.22 });
        this.tone({ type: "square", from: 90, duration: 0.05, volume: 0.12 });
      },

      // Descending minor-ish sigh over a soft noise wash, then a low tone to
      // resolve the moment.
      gameover: () => {
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
      },

      // Cheerful "go!" at the start of a run: two rising triangles capped with a
      // high sine sparkle.
      runStart: () => {
        this.tone({ type: "triangle", from: 523, to: 659, duration: 0.09, volume: 0.12 });
        this.tone({ type: "triangle", from: 784, at: 0.08, duration: 0.12, volume: 0.12 });
        this.tone({ type: "sine", from: 1568, at: 0.16, duration: 0.1, volume: 0.05 });
      },

      // UI: a soft, downward square blip for clicks.
      uiClick: () => {
        this.tone({ type: "square", from: 620, to: 440, duration: 0.045, volume: 0.07 });
      },

      // UI: a barely-there sine tick for hover.
      uiHover: () => {
        this.tone({ type: "sine", from: 950, duration: 0.03, volume: 0.028 });
      },

      // Footstep tap. Subtle by design (it plays constantly); brighter and
      // louder with speed, alternating stereo so a run reads as left/right
      // paws, with a touch of pitch variance.
      trot: (speedNorm: number) => {
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
      },
    };
  }

  // --- Register: souls (the knight) -----------------------------------------
  // Weight, cloth, iron, souls. Everything sits lower and quieter than the
  // kitty set; brightness only ever comes from short inharmonic metal rings.

  private buildSoulsVoices(): VoiceSet {
    return {
      // Cloth push: a lowpassed swish (fabric over plate) and a quiet low
      // thump for the push-off. Nothing above ~500 Hz.
      jump: () => {
        this.noiseBurst({ duration: 0.1, volume: 0.05, filterType: "lowpass", from: 500, to: 180 });
        this.tone({ type: "sine", from: 130, to: 95, duration: 0.08, volume: 0.06 });
      },

      // Second wind: the same cloth, heavier, plus a faint rising breath —
      // a narrow bandpass drifting upward, barely there.
      doubleJump: () => {
        this.noiseBurst({ duration: 0.12, volume: 0.06, filterType: "lowpass", from: 560, to: 170 });
        this.tone({ type: "sine", from: 120, to: 85, duration: 0.1, volume: 0.075 });
        this.noiseBurst({
          duration: 0.16,
          volume: 0.02,
          filterType: "bandpass",
          from: 300,
          to: 900,
          q: 0.9,
          at: 0.03,
        });
      },

      // Heavy roll: a long low rumble drifting left, a body thud underneath,
      // and three gritty scuffs as the plate tumbles over the ground.
      dash: () => {
        this.noiseBurst({
          duration: 0.4,
          volume: 0.16,
          filterType: "lowpass",
          from: 700,
          to: 110,
          pan: -0.15,
        });
        this.tone({ type: "sine", from: 90, to: 48, duration: 0.32, volume: 0.09 });
        [0.06, 0.15, 0.25].forEach((at, i) => {
          this.noiseBurst({
            duration: 0.04,
            volume: 0.045,
            filterType: "bandpass",
            from: 820 - 140 * i,
            q: 2,
            at,
            pan: i % 2 === 0 ? -0.2 : 0.2,
          });
        });
      },

      // Armored thump. Impact 0..1 scales the sine drop, the metal ring (a
      // faint inharmonic stack — the plates knocking together) and the scuff.
      // Soft landings are almost nothing; full falls really land.
      land: (impact: number) => {
        const i = Math.min(1, Math.max(0, impact));
        this.tone({
          type: "sine",
          from: 120 + 40 * i,
          to: 55,
          duration: 0.09 + 0.07 * i,
          volume: 0.07 + 0.09 * i,
        });
        this.ring({
          partials: [720, 1130, 1580],
          duration: 0.05 + 0.08 * i,
          volume: 0.012 + 0.03 * i,
          at: 0.005,
        });
        this.noiseBurst({
          duration: 0.07,
          volume: 0.04 + 0.05 * i,
          filterType: "lowpass",
          from: 420,
          to: 160,
        });
      },

      // Soul absorb: the combo ladder walks a minor pentatonic up from A4.
      // Glassy sine with a soft attack, a quiet fifth arriving a touch late,
      // and a breathy rising bandpass tail — the light drawn in, not a chime.
      pickup: (combo: number) => {
        const step =
          SOULS_PENTATONIC[combo % SOULS_PENTATONIC.length] +
          Math.floor(combo / SOULS_PENTATONIC.length) * 12;
        const hz = SOULS_PICKUP_BASE_HZ * Math.pow(2, Math.min(24, step) / 12);
        this.tone({ type: "sine", from: hz, duration: 0.26, volume: 0.1, attack: 0.02 });
        this.tone({ type: "sine", from: hz * 1.5, at: 0.06, duration: 0.22, volume: 0.05, attack: 0.02 });
        this.noiseBurst({
          duration: 0.3,
          volume: 0.02,
          filterType: "bandpass",
          from: hz * 2,
          to: hz * 4,
          q: 3,
          at: 0.02,
        });
      },

      // Estus: a warm lowpassed swell rising through the chest register, a
      // faint pour of dark noise, and one small glass clink on top.
      heal: () => {
        this.tone({
          type: "triangle",
          from: 180,
          to: 320,
          duration: 0.25,
          volume: 0.09,
          attack: 0.06,
          filter: { type: "lowpass", freq: 700 },
        });
        this.noiseBurst({ duration: 0.22, volume: 0.02, filterType: "lowpass", from: 600, to: 250, at: 0.02 });
        this.tone({ type: "sine", from: 1760, at: 0.1, duration: 0.07, volume: 0.035 });
      },

      // Distant choir swell + bell: a slow two-note fifth (220 + 330), each
      // note a lightly detuned, lowpassed triangle with a 0.15s attack and a
      // ~0.8s decay, and one quiet inharmonic bell tap under it. No fanfare.
      milestone: () => {
        this.tone({
          type: "triangle",
          from: 220,
          duration: 0.95,
          volume: 0.07,
          attack: 0.15,
          detune: 6,
          filter: { type: "lowpass", freq: 900 },
        });
        this.tone({
          type: "triangle",
          from: 330,
          duration: 0.95,
          volume: 0.05,
          attack: 0.15,
          detune: -6,
          filter: { type: "lowpass", freq: 900 },
        });
        this.ring({
          partials: [330, 330 * 2.76, 330 * 5.4],
          duration: 0.6,
          volume: 0.035,
          at: 0.12,
        });
      },

      // Armor clang + sub drop: a bright-but-short inharmonic ring over a big
      // lowpassed thud and a sub-bass drop. Punchy and dull — struck iron, not
      // a cymbal.
      hit: () => {
        this.ring({ partials: [820, 1240, 1660], duration: 0.15, volume: 0.09 });
        this.noiseBurst({
          duration: 0.16,
          volume: 0.2,
          filterType: "lowpass",
          from: 700,
          to: 200,
        });
        this.tone({ type: "sine", from: 110, to: 40, duration: 0.3, volume: 0.16 });
      },

      // Deep resolve: a low drone that swells in slowly and hangs, a two-note
      // descending minor sigh through a lowpass, and a slow dark noise wash.
      // The YOU DIED silence — nothing here is louder than a breath.
      gameover: () => {
        this.tone({ type: "sine", from: 65, duration: 1.4, volume: 0.14, attack: 0.4 });
        this.tone({
          type: "triangle",
          from: 233,
          at: 0.2,
          duration: 0.55,
          volume: 0.07,
          attack: 0.03,
          filter: { type: "lowpass", freq: 600 },
        });
        this.tone({
          type: "triangle",
          from: 196,
          at: 0.6,
          duration: 0.8,
          volume: 0.07,
          attack: 0.03,
          filter: { type: "lowpass", freq: 600 },
        });
        this.noiseBurst({
          duration: 0.9,
          volume: 0.03,
          filterType: "lowpass",
          from: 360,
          to: 90,
          at: 0.1,
        });
      },

      // Run start: a low rising swell and one soft bell-ish tap. The bonfire
      // is lit; nobody cheers.
      runStart: () => {
        this.tone({
          type: "triangle",
          from: 110,
          to: 165,
          duration: 0.5,
          volume: 0.07,
          attack: 0.12,
          filter: { type: "lowpass", freq: 500 },
        });
        this.ring({ partials: [440, 440 * 2.76], duration: 0.35, volume: 0.03, at: 0.18 });
      },

      // UI: a dull iron knock — a lowpassed triangle dropping 240→180 with a
      // tiny metal tick on the front edge.
      uiClick: () => {
        this.tone({
          type: "triangle",
          from: 240,
          to: 180,
          duration: 0.05,
          volume: 0.06,
          filter: { type: "lowpass", freq: 600 },
        });
        this.tone({ type: "sine", from: 1900, duration: 0.02, volume: 0.015 });
      },

      // UI: a faint low tick for hover, quieter than the pastel one.
      uiHover: () => {
        this.tone({ type: "sine", from: 220, duration: 0.03, volume: 0.02 });
      },

      // Heavy boots: dark lowpassed scuffs (450–750 Hz by speed), same
      // alternating pan + pitch variance as the kitty trot, a touch quieter.
      // One noise voice per step — it fires constantly.
      trot: (speedNorm: number) => {
        const s = Math.min(1, Math.max(0, speedNorm));
        this.trotLeft = !this.trotLeft;
        const variance = 1 + (Math.random() * 0.12 - 0.06);
        this.noiseBurst({
          duration: 0.055,
          volume: 0.025 + 0.02 * s,
          filterType: "lowpass",
          from: (450 + 300 * s) * variance,
          pan: this.trotLeft ? -0.3 : 0.3,
        });
      },
    };
  }
}
