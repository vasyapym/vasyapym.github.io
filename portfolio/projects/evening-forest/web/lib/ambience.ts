// Procedural dusk ambience: wind from filtered brown noise, crickets as
// scheduled chirp bursts, a rare owl. No audio files — everything is
// synthesised, so the module stays self-contained. The AudioContext is
// created inside the user gesture that enters the forest (autoplay policy).

type ChirpVoice = {
  freq: number;
  pan: number;
  minGapMs: number;
  maxGapMs: number;
};

const WIND_BASE = 0.42;
const WIND_LFO_DEPTH = 0.2;
const MASTER_LEVEL = 0.8;
const DIMMED_LEVEL = 0.22;

export class EveningAmbience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timers: number[] = [];
  private voices: { stop: () => void }[] = [];
  private dimmed = false;
  private muted = false;
  private stepNoise: AudioBuffer | null = null;

  get started(): boolean {
    return this.ctx !== null;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  // Must be called from a user-gesture handler the first time.
  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      this.applyLevel();
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    this.buildWind(ctx, master);
    this.startChirps(ctx, master);
    this.startOwl(ctx, master);
    this.applyLevel();
  }

  // Quiet-but-alive while the pause overlay is up.
  setDimmed(dimmed: boolean): void {
    this.dimmed = dimmed;
    this.applyLevel();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyLevel();
  }

  dispose(): void {
    for (const id of this.timers) window.clearTimeout(id);
    this.timers = [];
    for (const voice of this.voices) voice.stop();
    this.voices = [];
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
      this.master = null;
    }
  }

  private applyLevel(): void {
    if (!this.ctx || !this.master) return;
    const target = this.muted ? 0 : this.dimmed ? DIMMED_LEVEL : MASTER_LEVEL;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + 0.9);
  }

  // One footfall: a low thump through the ground plus a brighter band of
  // leaf-litter crunch, both cut from a short shared noise buffer. Random
  // playback rate and filter positions keep repeated steps from droning.
  footstep(intensity: number): void {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    if (!this.stepNoise) {
      const seconds = 0.12;
      const buffer = ctx.createBuffer(
        1,
        Math.ceil(ctx.sampleRate * seconds),
        ctx.sampleRate,
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      this.stepNoise = buffer;
    }

    const t = ctx.currentTime + 0.005;
    const src = ctx.createBufferSource();
    src.buffer = this.stepNoise;
    src.playbackRate.value = 0.85 + Math.random() * 0.3;

    const thump = ctx.createBiquadFilter();
    thump.type = "lowpass";
    thump.frequency.value = 180 + Math.random() * 60;

    const crunch = ctx.createBiquadFilter();
    crunch.type = "bandpass";
    crunch.frequency.value = 900 + Math.random() * 700;
    crunch.Q.value = 0.8;

    const peak = 0.1 + intensity * 0.08;
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(peak, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    const crunchGain = ctx.createGain();
    crunchGain.gain.setValueAtTime(peak * 0.35, t);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    src.connect(thump).connect(thumpGain).connect(this.master);
    src.connect(crunch).connect(crunchGain).connect(this.master);
    src.start(t);
    src.stop(t + 0.14);
  }

  private buildWind(ctx: AudioContext, out: GainNode): void {
    const seconds = 3;
    const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      let last = 0;
      for (let i = 0; i < data.length; i += 1) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.4;
      }
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 340;
    lowpass.Q.value = 0.55;

    const windGain = ctx.createGain();
    windGain.gain.value = WIND_BASE;

    noise.connect(lowpass).connect(windGain).connect(out);

    // Two slow LFOs breathe life into the wind: one swells the loudness,
    // the other opens and closes the filter like gusts moving through.
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.055;
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = WIND_LFO_DEPTH;
    swell.connect(swellDepth).connect(windGain.gain);

    const gustFilter = ctx.createOscillator();
    gustFilter.frequency.value = 0.021;
    const gustDepth = ctx.createGain();
    gustDepth.gain.value = 170;
    gustFilter.connect(gustDepth).connect(lowpass.frequency);

    // Leaf rustle layer riding the same gusts, brighter and quieter.
    const rustleSrc = ctx.createBufferSource();
    rustleSrc.buffer = buffer;
    rustleSrc.loop = true;
    rustleSrc.playbackRate.value = 1.7;
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 2400;
    const rustleGain = ctx.createGain();
    rustleGain.gain.value = 0.016;
    rustleSrc.connect(highpass).connect(rustleGain).connect(out);

    swell.start();
    gustFilter.start();
    noise.start();
    rustleSrc.start();

    this.voices.push({
      stop: () => {
        try {
          swell.stop();
          gustFilter.stop();
          noise.stop();
          rustleSrc.stop();
        } catch {
          /* already stopped */
        }
      },
    });
  }

  private startChirps(ctx: AudioContext, out: GainNode): void {
    const voices: ChirpVoice[] = [
      { freq: 4300, pan: -0.55, minGapMs: 420, maxGapMs: 1400 },
      { freq: 3700, pan: 0.6, minGapMs: 900, maxGapMs: 2600 },
    ];
    for (const voice of voices) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = voice.pan;
      const bus = ctx.createGain();
      bus.gain.value = 0.05;
      panner.connect(bus).connect(out);

      const schedule = () => {
        if (!this.ctx) return;
        this.chirp(ctx, panner, voice.freq);
        const gap = voice.minGapMs + Math.random() * (voice.maxGapMs - voice.minGapMs);
        this.timers.push(window.setTimeout(schedule, gap));
      };
      this.timers.push(window.setTimeout(schedule, 400 + Math.random() * 1200));
      this.voices.push({ stop: () => panner.disconnect() });
    }
  }

  private chirp(ctx: AudioContext, out: AudioNode, baseFreq: number): void {
    const t0 = ctx.currentTime + 0.05;
    const pulses = 3;
    for (let i = 0; i < pulses; i += 1) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = baseFreq + (Math.random() - 0.5) * 260;
      const gain = ctx.createGain();
      const t = t0 + i * 0.075;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(1, t + 0.012);
      gain.gain.linearRampToValueAtTime(0, t + 0.05);
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  private startOwl(ctx: AudioContext, out: GainNode): void {
    const panner = ctx.createStereoPanner();
    const bus = ctx.createGain();
    bus.gain.value = 0.06;
    const hootFilter = ctx.createBiquadFilter();
    hootFilter.type = "lowpass";
    hootFilter.frequency.value = 900;
    panner.connect(hootFilter).connect(bus).connect(out);

    const hoot = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + 0.1;
      const notes = [330, 296];
      let offset = 0;
      for (const note of notes) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(note, t + offset);
        osc.frequency.linearRampToValueAtTime(note * 0.94, t + offset + 0.45);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t + offset);
        gain.gain.linearRampToValueAtTime(1, t + offset + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.55);
        osc.connect(gain).connect(panner);
        osc.start(t + offset);
        osc.stop(t + offset + 0.6);
        offset += 0.55;
      }
      panner.pan.value = Math.random() * 1.6 - 0.8;
      this.timers.push(
        window.setTimeout(hoot, 18000 + Math.random() * 24000),
      );
    };
    this.timers.push(window.setTimeout(hoot, 9000 + Math.random() * 8000));
    this.voices.push({ stop: () => panner.disconnect() });
  }
}

let currentAmbience: EveningAmbience | null = null;

export function getAmbience(): EveningAmbience {
  if (!currentAmbience) currentAmbience = new EveningAmbience();
  return currentAmbience;
}

// Full teardown for leaving the project: the forest must go silent and the
// next visit must start from a fresh context, not a zombie of this one.
export function releaseAmbience(): void {
  currentAmbience?.dispose();
  currentAmbience = null;
}
