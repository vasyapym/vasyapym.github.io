// Procedural dusk audio. The background score (a Proteus-style tonal
// loop) lives in lib/music.ts and the all-tonal environment bed around it
// (crickets, birds, an owl, a breeze beat, a fox dyad) in lib/nature.ts —
// both built from the same philosophy as everything here: synthesised
// with WebAudio, no audio files, no noise loops. Footsteps are cut from a
// short noise buffer — a lowpass thump plus a bandpassed leaf crunch
// fired by each head-bob cycle. The AudioContext is created inside the
// user gesture that enters the forest (autoplay policy).

import { createEveningMusic } from "./music";
import { createNatureBed } from "./nature";

const MASTER_LEVEL = 0.8;
const DIMMED_LEVEL = 0.22;

export class EveningAmbience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
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

    this.voices.push(createEveningMusic(ctx, master));
    this.voices.push(createNatureBed(ctx, master));
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
