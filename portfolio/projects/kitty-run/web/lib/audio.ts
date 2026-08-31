// Synthesised sound effects, the evening-forest way: no audio files, the
// context is created inside the user gesture that starts the run. One
// shared context + master bus feeds a DynamicsCompressorNode so nothing
// clips. Reusable noise buffers are generated once in start(); nothing on
// the hot path allocates a buffer. Pickup chimes climb a pentatonic scale
// as the combo grows; repeats gently vary so they never machine-gun.

type Ctor = typeof AudioContext;

const PENTATONIC = [0, 2, 4, 7, 9];
const PICKUP_BASE_HZ = 523.25;

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  // Reusable noise buffers (generated once). No per-call allocation.
  private whiteNoise: AudioBuffer | null = null;
  private dustNoise: AudioBuffer | null = null;

  // Rotating counters keep repeated sounds from feeling machine-gunned,
  // without RNG in the pitch content.
  private milestoneAlt = 0;
  private landAlt = 0;

  get started(): boolean {
    return this.ctx !== null;
  }

  // The soundtrack shares this context and master bus, so one mute
  // gesture silences the whole page and one context resume wakes both.
  get context(): AudioContext | null {
    return this.ctx;
  }

  get output(): GainNode | null {
    return this.master;
  }

  // Must be called from a user-gesture handler the first time.
  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    const master = ctx.createGain();
    master.gain.value = 0.42;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 24;
    comp.ratio.value = 3;
    comp.attack.value = 0.003;
    comp.release.value = 0.18;

    master.connect(comp).connect(ctx.destination);

    // Two reusable noise buffers, generated once.
    const rate = ctx.sampleRate;

    const whiteFrames = Math.floor(rate); // 1 s flat white noise
    const white = ctx.createBuffer(1, whiteFrames, rate);
    const wd = white.getChannelData(0);
    for (let i = 0; i < whiteFrames; i += 1) wd[i] = Math.random() * 2 - 1;

    const dustFrames = Math.floor(rate * 0.25); // short decaying "dust"
    const dust = ctx.createBuffer(1, dustFrames, rate);
    const dd = dust.getChannelData(0);
    for (let i = 0; i < dustFrames; i += 1) {
      dd[i] = (Math.random() * 2 - 1) * (1 - i / dustFrames);
    }

    this.ctx = ctx;
    this.master = master;
    this.whiteNoise = white;
    this.dustNoise = dust;
  }

  private tone(options: {
    type: OscillatorType;
    from: number;
    to?: number;
    at?: number;
    duration: number;
    volume: number;
  }): void {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + (options.at ?? 0);
    const osc = this.ctx.createOscillator();
    osc.type = options.type;
    osc.frequency.setValueAtTime(options.from, t0);
    if (options.to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, options.to),
        t0 + options.duration,
      );
    }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(options.volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + options.duration);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + options.duration + 0.05);
  }

  // Shaped noise burst reading from a pre-generated buffer (no per-call
  // allocation), with an optional filter sweep for whooshes.
  private burst(options: {
    filter: BiquadFilterType;
    freq: number;
    freqTo?: number;
    duration: number;
    volume: number;
    q?: number;
    at?: number;
    source?: "white" | "dust";
  }): void {
    if (!this.ctx || !this.master) return;
    const buffer = options.source === "dust" ? this.dustNoise : this.whiteNoise;
    if (!buffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (options.at ?? 0);

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = options.filter;
    filter.frequency.setValueAtTime(Math.max(1, options.freq), t0);
    if (options.freqTo !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(1, options.freqTo),
        t0 + options.duration,
      );
    }
    if (options.q !== undefined) filter.Q.value = options.q;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(options.volume, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + options.duration);

    src.connect(filter).connect(gain).connect(this.master);

    // Read from a random offset so repeats never phase-align identically.
    const maxOff = Math.max(0, buffer.duration - options.duration - 0.01);
    src.start(t0, Math.random() * maxOff, options.duration + 0.02);
  }

  jump(): void {
    this.tone({ type: "square", from: 300, to: 640, duration: 0.14, volume: 0.09 });
    this.tone({ type: "sine", from: 600, to: 1200, duration: 0.08, volume: 0.03 });
  }

  doubleJump(): void {
    this.tone({ type: "square", from: 440, to: 860, duration: 0.12, volume: 0.085 });
    this.tone({ type: "triangle", from: 660, to: 1040, at: 0.05, duration: 0.1, volume: 0.06 });
  }

  dash(): void {
    // Camera whoosh: a bandpass noise sweep up, plus a sub pitch drop that
    // mirrors the world diving into slow motion. Lives on the master bus
    // so it stays crisp above the bed's bullet-time muffle.
    this.burst({ filter: "bandpass", freq: 700, freqTo: 3200, duration: 0.2, volume: 0.15, q: 0.7 });
    this.tone({ type: "sawtooth", from: 560, to: 90, duration: 0.3, volume: 0.07 });
    this.tone({ type: "sine", from: 280, to: 70, duration: 0.3, volume: 0.05 });
  }

  land(): void {
    this.landAlt = (this.landAlt + 1) % 2;
    this.tone({ type: "sine", from: 160 - this.landAlt * 12, to: 80, duration: 0.08, volume: 0.07 });
    this.burst({ filter: "lowpass", freq: 900, duration: 0.05, volume: 0.03, source: "dust" });
  }

  pickup(combo: number): void {
    const step =
      PENTATONIC[combo % PENTATONIC.length] +
      Math.floor(combo / PENTATONIC.length) * 12;
    const hz = PICKUP_BASE_HZ * Math.pow(2, Math.min(24, step) / 12);
    const alt = combo % 2; // alternate the top sparkle octave
    this.tone({ type: "sine", from: hz, duration: 0.16, volume: 0.11 });
    this.tone({ type: "triangle", from: hz * 1.5, at: 0.035, duration: 0.13, volume: 0.06 });
    this.tone({ type: "sine", from: hz * (alt ? 3 : 2), at: 0.07, duration: 0.1, volume: 0.035 });
  }

  heal(): void {
    this.tone({ type: "triangle", from: 392, to: 523, duration: 0.18, volume: 0.09 });
    this.tone({ type: "triangle", from: 523, to: 659, at: 0.09, duration: 0.2, volume: 0.09 });
    this.tone({ type: "sine", from: 1046, at: 0.14, duration: 0.22, volume: 0.03 });
  }

  // A rising fanfare for milestones; rotates through three related keys so
  // consecutive milestones feel composed rather than looped.
  milestone(): void {
    this.milestoneAlt = (this.milestoneAlt + 1) % 3;
    const shapes = [
      [523, 659, 784, 1047],
      [587, 740, 880, 1175],
      [659, 784, 988, 1319],
    ];
    const notes = shapes[this.milestoneAlt];
    notes.forEach((hz, i) => {
      this.tone({ type: "triangle", from: hz, at: i * 0.06, duration: 0.18, volume: 0.09 });
      this.tone({ type: "sine", from: hz * 2, at: i * 0.06 + 0.02, duration: 0.12, volume: 0.025 });
    });
  }

  hit(): void {
    // Softer than a raw bandpass crack: a filtered thud plus a sub thump.
    this.burst({ filter: "lowpass", freq: 1200, freqTo: 300, duration: 0.14, volume: 0.16, q: 0.6 });
    this.tone({ type: "sine", from: 200, to: 55, duration: 0.3, volume: 0.14 });
    this.tone({ type: "triangle", from: 130, to: 50, at: 0.01, duration: 0.26, volume: 0.08 });
  }

  gameover(): void {
    // A falling gesture that resolves onto a soft C major, rather than a
    // bleak descending run.
    const fall = [523, 440, 349];
    fall.forEach((hz, i) => {
      this.tone({ type: "triangle", from: hz, at: i * 0.14, duration: 0.22, volume: 0.09 });
    });
    const resolveAt = 0.5;
    [261.63, 329.63, 392.0].forEach((hz, i) => {
      this.tone({ type: "sine", from: hz, at: resolveAt + i * 0.02, duration: 0.9, volume: 0.06 });
    });
  }
}
