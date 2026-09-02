// Evening Forest — procedural ambient score.
// A lonely, wistful dusk-shrine piece in D aeolian with dorian colour:
// a breathing low drone, slow open-fifth pad swells, and a sparse
// bell-like melody, all bathed in a runtime-built convolution reverb.
// One seamless, deterministic 8-bar cycle repeated forever.

import { createRng } from "./rng";

export type EveningMusicVoice = { stop: () => void };

// Final bus level into `out`. Sits well below the master's clip point even
// at the worst-case all-layers-coinciding peak (~0.5 into out), so the
// footstep synth and the master mute/dim ramps keep headroom.
const MUSIC_LEVEL = 0.42;

// ~50 bpm, 4/4, 8 bars. Long enough that the loop point is never obvious;
// note tails and pad releases deliberately ring across the boundary.
const CYCLE = 38.4;

// How far ahead the single lookahead timer commits events.
const SCHEDULE_AHEAD = 3.0;

// Per-layer levels (peaks, before the MUSIC_LEVEL bus). Envelope targets
// are divided by the partial count so summed oscillators stay near these.
const DRONE_LEVEL = 0.2;
const DRONE_LFO_DEPTH = 0.05; // slow "breathing" of the floor
// The D2/A2 fundamentals vanish on phone speakers; a quiet D3 partial
// carries the drone into registers small drivers can actually reproduce.
const DRONE_OCTAVE_LEVEL = 0.3;
const PAD_LEVEL = 0.16;
const NOTE_LEVEL = 0.22;
const CHIME_LEVEL = 0.06;

// Reverb send / return. Wet sits well below dry so it reads as a room,
// not an effect.
const REVERB_SEND = 0.55;
const REVERB_WET = 0.6;
const DRY_LEVEL = 0.9;

// Melancholic pitch set: D minor pentatonic (D F G A C D) plus B natural
// as the dorian colour tone. No leading tone, nothing that pulls upward.
const MELODY: number[] = [
  146.83, // D3
  174.61, // F3
  196.0, // G3
  220.0, // A3
  246.94, // B3 — dorian colour
  261.63, // C4
  293.66, // D4
];

// Open fifths / sus / add9 voicings — never a bright triad.
const PAD_CHORDS: number[][] = [
  [146.83, 220.0, 329.63], // D-A-E  (add9)
  [146.83, 220.0, 246.94], // D-A-B  (dorian 6)
  [146.83, 196.0, 220.0], // D-G-A  (sus4)
  [146.83, 220.0, 261.63], // D-A-C  (min7)
];

// High, glassy chime fundamentals — used sparingly.
const CHIME_TONES: number[] = [587.33, 880.0]; // D5, A5

export function createEveningMusic(
  ctx: AudioContext,
  out: AudioNode,
): EveningMusicVoice {
  const rng = createRng("evening-forest-music");

  // --- Fixed signal graph -------------------------------------------------
  const musicBus = ctx.createGain();
  musicBus.gain.value = MUSIC_LEVEL;
  musicBus.connect(out);

  const dryGain = ctx.createGain();
  dryGain.gain.value = DRY_LEVEL;
  dryGain.connect(musicBus);

  const convolver = ctx.createConvolver();
  convolver.buffer = buildImpulse(ctx, rng);

  const wetGain = ctx.createGain();
  wetGain.gain.value = REVERB_WET;
  convolver.connect(wetGain);
  wetGain.connect(musicBus);

  const reverbSend = ctx.createGain();
  reverbSend.gain.value = REVERB_SEND;
  reverbSend.connect(convolver);

  // Every transient sound registers a disposer here so stop() can tear the
  // whole thing down deterministically, even mid-ring.
  const active = new Set<() => void>();

  function register(dispose: () => void, ender: OscillatorNode): void {
    active.add(dispose);
    ender.onended = () => {
      if (active.delete(dispose)) dispose();
    };
  }

  // --- Continuous drone (never restarted; the loop's true continuity) -----
  const droneRoot = ctx.createOscillator();
  droneRoot.type = "sine";
  droneRoot.frequency.value = 73.42; // D2

  const droneFifth = ctx.createOscillator();
  droneFifth.type = "sine";
  droneFifth.frequency.value = 110.0; // A2 — open fifth

  const droneOctave = ctx.createOscillator();
  droneOctave.type = "sine";
  droneOctave.frequency.value = 146.83; // D3 — small-speaker lifeline

  const droneOctaveGain = ctx.createGain();
  droneOctaveGain.gain.value = DRONE_OCTAVE_LEVEL;

  const droneGain = ctx.createGain();
  droneGain.gain.value = DRONE_LEVEL;

  const droneLfo = ctx.createOscillator();
  droneLfo.type = "sine";
  droneLfo.frequency.value = 0.05; // ~20 s breath

  const droneLfoDepth = ctx.createGain();
  droneLfoDepth.gain.value = DRONE_LFO_DEPTH;
  droneLfo.connect(droneLfoDepth);
  droneLfoDepth.connect(droneGain.gain);

  droneRoot.connect(droneGain);
  droneFifth.connect(droneGain);
  droneOctave.connect(droneOctaveGain).connect(droneGain);
  droneGain.connect(dryGain);
  droneGain.connect(reverbSend);

  const droneStart = ctx.currentTime + 0.2;
  droneRoot.start(droneStart);
  droneFifth.start(droneStart);
  droneOctave.start(droneStart);
  droneLfo.start(droneStart);

  const disposeDrone = (): void => {
    try {
      droneRoot.stop();
    } catch {
      /* already stopped */
    }
    try {
      droneFifth.stop();
    } catch {
      /* already stopped */
    }
    try {
      droneOctave.stop();
    } catch {
      /* already stopped */
    }
    try {
      droneLfo.stop();
    } catch {
      /* already stopped */
    }
    droneRoot.disconnect();
    droneFifth.disconnect();
    droneOctave.disconnect();
    droneOctaveGain.disconnect();
    droneLfo.disconnect();
    droneLfoDepth.disconnect();
    droneGain.disconnect();
  };
  active.add(disposeDrone);

  // --- The signature melody: fast attack, long exponential ring ----------
  function playNote(freq: number, time: number): void {
    const sine = ctx.createOscillator();
    sine.type = "sine";
    const tri = ctx.createOscillator();
    tri.type = "triangle";

    const detune = (rng() * 2 - 1) * 6; // subtle life
    sine.frequency.value = freq;
    tri.frequency.value = freq;
    sine.detune.value = detune;
    tri.detune.value = -detune;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800;

    const g = ctx.createGain();
    const target = NOTE_LEVEL / 2;
    const decay = 2.5 + rng() * 1.5;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(target, time + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    const pan = ctx.createStereoPanner();
    const p = (rng() * 2 - 1) * 0.5;
    pan.pan.setValueAtTime(p, time);
    pan.pan.linearRampToValueAtTime(p * 0.4, time + decay); // slow drift

    sine.connect(g);
    tri.connect(g);
    g.connect(lp);
    lp.connect(pan);
    pan.connect(dryGain);
    pan.connect(reverbSend);

    sine.start(time);
    tri.start(time);
    const end = time + decay + 0.1;
    sine.stop(end);
    tri.stop(end);

    const dispose = (): void => {
      try {
        sine.stop();
      } catch {
        /* already stopped */
      }
      try {
        tri.stop();
      } catch {
        /* already stopped */
      }
      sine.disconnect();
      tri.disconnect();
      g.disconnect();
      lp.disconnect();
      pan.disconnect();
    };
    register(dispose, tri);
  }

  // --- Slow pad swell: bloom in, hold, fade back to nothing ---------------
  function playPad(freqs: number[], time: number): void {
    const g = ctx.createGain();
    const target = PAD_LEVEL / freqs.length;
    const attack = 4.0;
    const hold = 2.0;
    const release = 6.0;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(target, time + attack);
    g.gain.setValueAtTime(target, time + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, time + attack + hold + release);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1200;

    const pan = ctx.createStereoPanner();
    pan.pan.value = (rng() * 2 - 1) * 0.35;

    const oscs: OscillatorNode[] = [];
    const end = time + attack + hold + release + 0.1;
    for (const f of freqs) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.detune.value = (rng() * 2 - 1) * 4;
      o.connect(g);
      o.start(time);
      o.stop(end);
      oscs.push(o);
    }

    g.connect(lp);
    lp.connect(pan);
    pan.connect(dryGain);
    pan.connect(reverbSend);

    const dispose = (): void => {
      for (const o of oscs) {
        try {
          o.stop();
        } catch {
          /* already stopped */
        }
        o.disconnect();
      }
      g.disconnect();
      lp.disconnect();
      pan.disconnect();
    };
    register(dispose, oscs[oscs.length - 1]);
  }

  // --- Rare, distant high chime (two sine partials) -----------------------
  function playChime(fundamental: number, time: number): void {
    const g = ctx.createGain();
    const target = CHIME_LEVEL / 2;
    const decay = 3.0 + rng() * 1.0;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(target, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    const pan = ctx.createStereoPanner();
    pan.pan.value = (rng() * 2 - 1) * 0.6;

    const partials = [fundamental, fundamental * 2];
    const oscs: OscillatorNode[] = [];
    const end = time + decay + 0.1;
    for (const f of partials) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(g);
      o.start(time);
      o.stop(end);
      oscs.push(o);
    }

    g.connect(pan);
    pan.connect(dryGain);
    pan.connect(reverbSend);

    const dispose = (): void => {
      for (const o of oscs) {
        try {
          o.stop();
        } catch {
          /* already stopped */
        }
        o.disconnect();
      }
      g.disconnect();
      pan.disconnect();
    };
    register(dispose, oscs[oscs.length - 1]);
  }

  // --- One cycle of events; silence between notes is intentional ----------
  function scheduleCycle(start: number): void {
    // Melody: irregular 2–6 s spacing with occasional true rests.
    let t = 0.5 + rng() * 1.5;
    while (t < CYCLE) {
      if (rng() > 0.15) {
        const freq = MELODY[Math.floor(rng() * MELODY.length)];
        playNote(freq, start + t);
      }
      t += 2 + rng() * 4;
    }

    // Pad: usually one slow bloom per cycle, placed loosely.
    if (rng() > 0.2) {
      const chord = PAD_CHORDS[Math.floor(rng() * PAD_CHORDS.length)];
      playPad(chord, start + rng() * 6);
    }

    // Chime: roughly every other cycle, anywhere within it.
    if (rng() > 0.5) {
      const tone = CHIME_TONES[Math.floor(rng() * CHIME_TONES.length)];
      playChime(tone, start + rng() * CYCLE);
    }
  }

  // --- Single lookahead scheduler ----------------------------------------
  let nextCycle = droneStart;
  scheduleCycle(nextCycle);
  nextCycle += CYCLE;

  let timer: number | null = window.setInterval(() => {
    while (nextCycle < ctx.currentTime + SCHEDULE_AHEAD) {
      scheduleCycle(nextCycle);
      nextCycle += CYCLE;
    }
  }, 1000);

  // --- Teardown (safe to call twice) --------------------------------------
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

    reverbSend.disconnect();
    convolver.disconnect();
    wetGain.disconnect();
    dryGain.disconnect();
    musicBus.disconnect();
  }

  return { stop };
}

// Stereo, ~3.5 s exponentially-decaying noise — the shrine's air.
function buildImpulse(ctx: AudioContext, rng: () => number): AudioBuffer {
  const duration = 3.5;
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
