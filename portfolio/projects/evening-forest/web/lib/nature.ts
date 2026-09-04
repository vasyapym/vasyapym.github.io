// Evening Forest — the nature bed, all of it tonal.
// Crickets are gated sines, birds are gliding whistles, the owl is two low
// hoots in a small room, the breeze is a slow beat between near-unison
// sines, and the fox brings a faint high dyad. No noise loops anywhere:
// the owl's convolution impulse is the one shaped-noise element, and it
// is space, not a layer. Everything follows the world through audioEnv.
import { audioEnv } from "./audio-env.ts";
import { createRng } from "./rng.ts";

const TICK_MS = 1000;
const WINDOW = 2.0;
const LOOKAHEAD = 3.0;
const CRICKET_LEVEL = 0.03;
const BIRD_LEVEL = 0.05;
const OWL_LEVEL = 0.06;
const BREEZE_LEVEL = 0.02;
const FOX_LEVEL = 0.012;
const SILENCE = 0.0001;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// 0..1, triangular: silent before 0.15, deepest at 0.55, gone by 0.95.
export function nightFactor(t: number): number {
  const x = clamp01(t);
  if (x <= 0.15) return 0;
  if (x < 0.55) return (x - 0.15) / 0.4;
  if (x < 0.95) return (0.95 - x) / 0.4;
  return 0;
}

// Bird activity 0..1: full through golden hour, fading out by 0.45, silent
// through deep night, returning from 0.78 toward sunrise.
export function twilightFactor(t: number): number {
  const x = clamp01(t);
  if (x < 0.25) return 1;
  if (x < 0.45) return (0.45 - x) / 0.2;
  if (x < 0.78) return 0;
  if (x < 0.98) return (x - 0.78) / 0.2;
  return 1;
}

// The owl's room: a seeded stereo impulse, exponentially decaying.
function buildImpulse(ctx: AudioContext, rng: () => number): AudioBuffer {
  const duration = 2.8;
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

export function createNatureBed(
  ctx: AudioContext,
  out: AudioNode,
): { stop: () => void } {
  const rng = createRng("evening-forest-nature");
  const active = new Set<() => void>();

  function register(dispose: () => void, ender: OscillatorNode): void {
    active.add(dispose);
    ender.onended = () => {
      if (active.delete(dispose)) dispose();
    };
  }

  const natureGain = ctx.createGain();
  natureGain.gain.value = 1.0;
  natureGain.connect(out);

  // Owl room: small, mostly wet, so the hoots sit far off among the trees.
  const convolver = ctx.createConvolver();
  convolver.buffer = buildImpulse(ctx, rng);
  const owlDry = ctx.createGain();
  owlDry.gain.value = 0.5;
  owlDry.connect(natureGain);
  const owlWet = ctx.createGain();
  owlWet.gain.value = 0.8;
  convolver.connect(owlWet);
  owlWet.connect(natureGain);

  // Crickets: a pure high sine, chopped by a square pulse, phrased by a
  // slow sine. Two of them, apart in pitch and space.
  const cricketGain = ctx.createGain();
  cricketGain.gain.value = 0;
  cricketGain.connect(natureGain);

  function buildCricket(freq: number, chirpHz: number, phraseHz: number, pan: number): void {
    const tone = ctx.createOscillator();
    tone.type = "sine";
    tone.frequency.value = freq;
    const chirpGate = ctx.createGain();
    chirpGate.gain.value = 0.5;
    const chirp = ctx.createOscillator();
    chirp.type = "square";
    chirp.frequency.value = chirpHz;
    const chirpDepth = ctx.createGain();
    chirpDepth.gain.value = 0.5;
    chirp.connect(chirpDepth);
    chirpDepth.connect(chirpGate.gain);
    const phraseGate = ctx.createGain();
    phraseGate.gain.value = 0.5;
    const phrase = ctx.createOscillator();
    phrase.type = "sine";
    phrase.frequency.value = phraseHz;
    const phraseDepth = ctx.createGain();
    phraseDepth.gain.value = 0.5;
    phrase.connect(phraseDepth);
    phraseDepth.connect(phraseGate.gain);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    tone.connect(chirpGate);
    chirpGate.connect(phraseGate);
    phraseGate.connect(panner);
    panner.connect(cricketGain);
    tone.start();
    chirp.start();
    phrase.start();
    active.add(() => {
      tone.disconnect();
      chirpGate.disconnect();
      chirp.disconnect();
      chirpDepth.disconnect();
      phraseGate.disconnect();
      phrase.disconnect();
      phraseDepth.disconnect();
      panner.disconnect();
    });
  }

  const cricketSpread = 150 + rng() * 150;
  buildCricket(4200 - cricketSpread, 22, 0.9, -0.55);
  buildCricket(4200 + cricketSpread, 24.5, 0.7, 0.6);

  // Breeze: two sines a hair apart beat slowly against each other, with a
  // very slow swell on top. The two sum to the level, so each sits at half.
  const breezeGain = ctx.createGain();
  breezeGain.gain.value = BREEZE_LEVEL / 2;
  breezeGain.connect(natureGain);
  const breezeA = ctx.createOscillator();
  breezeA.type = "sine";
  breezeA.frequency.value = 587.33;
  const breezeB = ctx.createOscillator();
  breezeB.type = "sine";
  breezeB.frequency.value = 588.6;
  const swell = ctx.createOscillator();
  swell.type = "sine";
  swell.frequency.value = 0.02;
  const swellDepth = ctx.createGain();
  swellDepth.gain.value = (BREEZE_LEVEL / 2) * 0.35;
  breezeA.connect(breezeGain);
  breezeB.connect(breezeGain);
  swell.connect(swellDepth);
  swellDepth.connect(breezeGain.gain);
  breezeA.start();
  breezeB.start();
  swell.start();
  active.add(() => {
    breezeA.disconnect();
    breezeB.disconnect();
    swell.disconnect();
    swellDepth.disconnect();
    breezeGain.disconnect();
  });

  // Fox wonder-tone: D6 with a softer A6 above it, silent until the fox is near.
  const foxGain = ctx.createGain();
  foxGain.gain.value = 0;
  foxGain.connect(natureGain);
  const foxLow = ctx.createOscillator();
  foxLow.type = "sine";
  foxLow.frequency.value = 1174.66;
  const foxHigh = ctx.createOscillator();
  foxHigh.type = "sine";
  foxHigh.frequency.value = 1760;
  const dyadGain = ctx.createGain();
  dyadGain.gain.value = 0.6;
  foxLow.connect(foxGain);
  foxHigh.connect(dyadGain);
  dyadGain.connect(foxGain);
  foxLow.start();
  foxHigh.start();
  active.add(() => {
    foxLow.disconnect();
    foxHigh.disconnect();
    dyadGain.disconnect();
    foxGain.disconnect();
  });

  // Birdsong: a short phrase of gliding whistles sharing one panner.
  function playBirdPhrase(at: number, activity: number): void {
    const count = 2 + Math.floor(rng() * 3);
    const panner = ctx.createStereoPanner();
    panner.pan.value = (rng() * 2 - 1) * 0.7;
    panner.connect(natureGain);
    const downward = rng() < 0.5;
    let t = at;
    for (let i = 0; i < count; i += 1) {
      const wobble = (rng() * 2 - 1) * 120;
      const from = (downward ? 2100 : 1600) + wobble;
      const to = (downward ? 1600 : 2100) + wobble;
      const glide = 0.1 + rng() * 0.06;
      const decay = 0.08 + rng() * 0.07;
      const peak = BIRD_LEVEL * activity * (0.8 + rng() * 0.2);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.exponentialRampToValueAtTime(to, t + glide);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(peak, t + 0.005);
      env.gain.setValueAtTime(peak, t + glide * 0.5);
      env.gain.exponentialRampToValueAtTime(SILENCE, t + glide * 0.5 + decay);
      osc.connect(env);
      env.connect(panner);
      osc.start(t);
      osc.stop(t + glide * 0.5 + decay + 0.02);
      const last = i === count - 1;
      register(() => {
        osc.disconnect();
        env.disconnect();
        if (last) panner.disconnect();
      }, osc);
      t += glide + 0.12 + rng() * 0.08;
    }
  }

  // Owl: one sine, two soft hoots sliding down, darkened and sent to the room.
  function playOwl(at: number): void {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    const panner = ctx.createStereoPanner();
    panner.pan.value = (rng() * 2 - 1) * 0.5;
    osc.connect(env);
    env.connect(filter);
    filter.connect(panner);
    panner.connect(owlDry);
    panner.connect(convolver);

    const first = at;
    osc.frequency.setValueAtTime(340, first);
    osc.frequency.exponentialRampToValueAtTime(300, first + 0.25);
    env.gain.setValueAtTime(0, first);
    env.gain.linearRampToValueAtTime(OWL_LEVEL, first + 0.08);
    env.gain.setValueAtTime(OWL_LEVEL, first + 0.17);
    env.gain.linearRampToValueAtTime(0, first + 0.25);

    const second = at + 0.45;
    osc.frequency.setValueAtTime(340, second);
    osc.frequency.exponentialRampToValueAtTime(300, second + 0.6);
    env.gain.setValueAtTime(0, second);
    env.gain.linearRampToValueAtTime(OWL_LEVEL * 0.9, second + 0.08);
    env.gain.setValueAtTime(OWL_LEVEL * 0.9, second + 0.45);
    env.gain.linearRampToValueAtTime(0, second + 0.6);

    osc.start(first);
    osc.stop(second + 0.65);
    register(() => {
      osc.disconnect();
      env.disconnect();
      filter.disconnect();
      panner.disconnect();
    }, osc);
  }

  // One tick a second: ease the continuous layers toward the world, then
  // roll the dice for every 2 s window inside the lookahead.
  let nextWindow = ctx.currentTime + 0.2;

  function tick(): void {
    const now = ctx.currentTime;
    const night = nightFactor(audioEnv.timeOfDay);
    const twilight = twilightFactor(audioEnv.timeOfDay);
    const walk = clamp01(audioEnv.moveSpeed / 3.4);

    cricketGain.gain.setTargetAtTime(night * CRICKET_LEVEL, now, 1.5);
    breezeGain.gain.setTargetAtTime((BREEZE_LEVEL / 2) * (1 + walk * 0.5), now, 1.5);

    const dist = audioEnv.foxDist;
    let fox = 0;
    if (dist !== null && dist < 12) fox = FOX_LEVEL * (1 - dist / 12);
    if (audioEnv.foxState === "curious") fox *= 1.5;
    foxGain.gain.setTargetAtTime(fox, now, 0.8);

    while (nextWindow < now + LOOKAHEAD) {
      const start = Math.max(nextWindow, now + 0.05);
      nextWindow += WINDOW;
      if (twilight > 0.05 && rng() < 0.22) {
        playBirdPhrase(start + rng() * (WINDOW - 0.8), twilight);
      }
      if (night > 0.5 && rng() < 0.04) {
        playOwl(start + rng() * (WINDOW - 0.5));
      }
    }
  }

  let timer: number | null = window.setInterval(tick, TICK_MS);
  tick();

  let stopped = false;
  function stop(): void {
    if (stopped) return;
    stopped = true;
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
    for (const dispose of Array.from(active)) {
      active.delete(dispose);
      dispose();
    }
    owlDry.disconnect();
    owlWet.disconnect();
    convolver.disconnect();
    cricketGain.disconnect();
    natureGain.disconnect();
  }

  return { stop };
}
