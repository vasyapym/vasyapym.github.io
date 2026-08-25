type Ctor = typeof AudioContext;

export class DetonationSfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private lastCrackle = 0;

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      return;
    }
    this.resume();
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.02);
    }
  }

  resume(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!Ctx) {
      return;
    }
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.5;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
  }

  boom(strength = 1): void {
    if (!this.ctx || !this.master || this.muted) {
      return;
    }
    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    const frames = Math.floor(ctx.sampleRate * 0.55);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 1.8);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(2600, t0);
    lowpass.frequency.exponentialRampToValueAtTime(140, t0 + 0.5);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55 * strength, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
    noise.connect(lowpass).connect(noiseGain).connect(this.master);
    noise.start(t0);

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(76, t0);
    sub.frequency.exponentialRampToValueAtTime(28, t0 + 0.45);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.5 * strength, t0);
    subGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
    sub.connect(subGain).connect(this.master);
    sub.start(t0);
    sub.stop(t0 + 0.55);
  }

  crackle(count: number): void {
    if (!this.ctx || !this.master || this.muted) {
      return;
    }
    const now = performance.now();
    if (now - this.lastCrackle < 110) {
      return;
    }
    this.lastCrackle = now;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const frames = Math.floor(ctx.sampleRate * 0.09);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 2400 + Math.random() * 900;
    band.Q.value = 1.4;
    const gain = ctx.createGain();
    gain.gain.value = Math.min(0.22, 0.05 + count * 0.006);
    noise.connect(band).connect(gain).connect(this.master);
    noise.start(t0);
  }

  rebuild(): void {
    if (!this.ctx || !this.master || this.muted) {
      return;
    }
    const notes = [262, 392, 523];
    notes.forEach((hz, i) => {
      const ctx = this.ctx;
      if (!ctx || !this.master) {
        return;
      }
      const t0 = ctx.currentTime + i * 0.08;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = hz;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.12, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      osc.connect(gain).connect(this.master);
      osc.start(t0);
      osc.stop(t0 + 0.35);
    });
  }

  dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.master = null;
    }
  }
}
