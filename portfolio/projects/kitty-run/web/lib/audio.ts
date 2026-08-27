// Synthesised sound effects, the evening-forest way: no audio files, the
// context is created inside the user gesture that starts the run. Pickup
// chimes climb a pentatonic scale as the combo grows.

type Ctor = typeof AudioContext;

const PENTATONIC = [0, 2, 4, 7, 9];
const PICKUP_BASE_HZ = 523.25;

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  get started(): boolean {
    return this.ctx !== null;
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
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
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

  private noise(duration: number, volume: number, cutoff: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const frames = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
  }

  jump(): void {
    this.tone({ type: "square", from: 300, to: 620, duration: 0.14, volume: 0.1 });
  }

  doubleJump(): void {
    this.tone({ type: "square", from: 420, to: 820, duration: 0.12, volume: 0.09 });
    this.tone({ type: "square", from: 620, to: 980, at: 0.05, duration: 0.1, volume: 0.07 });
  }

  dash(): void {
    this.noise(0.22, 0.16, 1600);
  }

  land(): void {
    this.tone({ type: "sine", from: 150, to: 90, duration: 0.07, volume: 0.07 });
  }

  pickup(combo: number): void {
    const step = PENTATONIC[combo % PENTATONIC.length] + Math.floor(combo / PENTATONIC.length) * 12;
    const hz = PICKUP_BASE_HZ * Math.pow(2, Math.min(24, step) / 12);
    this.tone({ type: "sine", from: hz, duration: 0.16, volume: 0.12 });
    this.tone({ type: "sine", from: hz * 1.5, at: 0.04, duration: 0.14, volume: 0.07 });
  }

  heal(): void {
    this.tone({ type: "triangle", from: 392, to: 523, duration: 0.18, volume: 0.1 });
    this.tone({ type: "triangle", from: 523, to: 659, at: 0.09, duration: 0.2, volume: 0.1 });
  }

  hit(): void {
    this.noise(0.16, 0.22, 700);
    this.tone({ type: "triangle", from: 220, to: 62, duration: 0.28, volume: 0.16 });
  }

  gameover(): void {
    const notes = [523, 392, 311, 233];
    notes.forEach((hz, i) => {
      this.tone({
        type: "triangle",
        from: hz,
        duration: 0.3,
        at: i * 0.17,
        volume: 0.11,
      });
    });
  }
}
