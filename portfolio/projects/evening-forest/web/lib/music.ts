// Evening Forest — procedural ambient score.
// A lonely, wistful dusk-shrine piece in D aeolian with dorian colour:
// a breathing low drone, twin open-fifth pad swells, a sparse bell-like
// melody with soft neighbour-note echoes, and a filtered night-air bed,
// all bathed in a runtime-built convolution reverb and glued by a bus
// compressor. One seamless, deterministic 8-bar cycle repeated forever.

import { createRng } from "./rng";

export type EveningMusicVoice = { stop: () => void };

// Level into the bus compressor. The compressor + makeup after this bus
// bound the worst-case all-layers peak into `out` (~0.3 after the 0.8
// master), so the footstep synth and the master mute/dim ramps keep
// headroom even with the score pushed loud enough for a phone speaker.
const MUSIC_LEVEL = 0.5;

// ~50 bpm, 4/4, 8 bars. Long enough that the loop point is never obvious;
// note tails and pad releases deliberately ring across the boundary.
const CYCLE = 38.4;

// How far ahead the single lookahead timer commits events.
const SCHEDULE_AHEAD = 3.0;

// Per-layer levels (peaks, before the MUSIC_LEVEL bus). Envelope targets
// are divided by the partial count so summed oscillators stay near these.
const DRONE_LEVEL = 0.2;
const DRONE_LFO_DEPTH = 0.05; // slow "breathing" of the floor
// The D2/A2 fundamentals vanish on phone speakers; quiet D3 and D4
// partials carry the drone into registers small drivers can reproduce.
const DRONE_OCTAVE_LEVEL = 0.32;
const DRONE_UPPER_LEVEL = 0.12;
const PAD_LEVEL = 0.16;
const NOTE_LEVEL = 0.26;
const CHIME_LEVEL = 0.08;
// Filtered-noise night-air bed — the one sustained midrange element, quiet
// enough to sit under everything and fill the gaps between notes.
const AIR_LEVEL = 0.045;

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

  // Glue compressor + makeup so the score reads loud enough on a phone
  // speaker while the peaks stay bounded before hitting the master.
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 20;
  compressor.ratio.value = 2;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.3;

  const makeupGain = ctx.createGain();
  makeupGain.gain.value = 1.5;

  musicBus.connect(compressor);
  compressor.connect(makeupGain);
  makeupGain.connect(out);

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

  const droneUpper = ctx.createOscillator();
  droneUpper.type = "sine";
  droneUpper.frequency.value = 293.66; // D4 — small-speaker lifeline

  const droneUpperGain = ctx.createGain();
  droneUpperGain.gain.value = DRONE_UPPER_LEVEL;

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
  droneUpper.connect(droneUpperGain).connect(droneGain);
  droneGain.connect(dryGain);
  droneGain.connect(reverbSend);

  const droneStart = ctx.currentTime + 0.2;
  droneRoot.start(droneStart);
  droneFifth.start(droneStart);
  droneOctave.start(droneStart);
  droneUpper.start(droneStart);
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
      droneUpper.stop();
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
    droneUpper.disconnect();
    droneUpperGain.disconnect();
    droneLfo.disconnect();
    droneLfoDepth.disconnect();
    droneGain.disconnect();
  };
  active.add(disposeDrone);

  // --- Night-air bed: a soft filtered-noise wash beneath everything -------
  // Sustains the midrange through the long silences between notes so the
  // piece never reads as empty on a phone. Noise + LFO shapes are fully
  // deterministic (seeded rng, no Math.random). No oscillator ender fires
  // for the looping source, so its disposer is registered directly.
  const airLength = Math.floor(ctx.sampleRate * 2);
  const airBuffer = ctx.createBuffer(2, airLength, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = airBuffer.getChannelData(ch);
    for (let i = 0; i < airLength; i += 1) {
      data[i] = rng() * 2 - 1;
    }
  }

  const airSource = ctx.createBufferSource();
  airSource.buffer = airBuffer;
  airSource.loop = true;

  const airFilter = ctx.createBiquadFilter();
  airFilter.type = "bandpass";
  airFilter.frequency.value = 420;
  airFilter.Q.value = 0.6;

  const airGain = ctx.createGain();
  airGain.gain.value = AIR_LEVEL;

  // Slow sweep of the band so the wash never sits still.
  const airFilterLfo = ctx.createOscillator();
  airFilterLfo.type = "sine";
  airFilterLfo.frequency.value = 0.03;
  const airFilterLfoDepth = ctx.createGain();
  airFilterLfoDepth.gain.value = 120; // ±120 Hz around 420 Hz
  airFilterLfo.connect(airFilterLfoDepth);
  airFilterLfoDepth.connect(airFilter.frequency);

  // Gentle level drift around the base AIR_LEVEL.
  const airGainLfo = ctx.createOscillator();
  airGainLfo.type = "sine";
  airGainLfo.frequency.value = 0.017;
  const airGainLfoDepth = ctx.createGain();
  airGainLfoDepth.gain.value = AIR_LEVEL * 0.35;
  airGainLfo.connect(airGainLfoDepth);
  airGainLfoDepth.connect(airGain.gain);

  airSource.connect(airFilter);
  airFilter.connect(airGain);
  airGain.connect(dryGain);
  airGain.connect(reverbSend);

  airSource.start(droneStart);
  airFilterLfo.start(droneStart);
  airGainLfo.start(droneStart);

  const disposeAir = (): void => {
    try {
      airSource.stop();
    } catch {
      /* already stopped */
    }
    try {
      airFilterLfo.stop();
    } catch {
      /* already stopped */
    }
    try {
      airGainLfo.stop();
    } catch {
      /* already stopped */
    }
    airSource.disconnect();
    airFilter.disconnect();
    airGain.disconnect();
    airFilterLfo.disconnect();
    airFilterLfoDepth.disconnect();
    airGainLfo.disconnect();
    airGainLfoDepth.disconnect();
  };
  active.add(disposeAir);

  // --- The signature melody: fast attack, long exponential ring ----------
  function playNote(
    freq: number,
    time: number,
    level: number = NOTE_LEVEL,
  ): void {
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
    const target = level / 2;
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
    // Melody: irregular ~1.6–4.6 s spacing with occasional true rests; each
    // note may spawn a quiet neighbour echo so lines feel less isolated.
    let t = 0.5 + rng() * 1.5;
    while (t < CYCLE) {
      if (rng() > 0.15) {
        const idx = Math.floor(rng() * MELODY.length);
        playNote(MELODY[idx], start + t);
        if (rng() > 0.45) {
          // 55% chance: a single scale-step neighbour, clamped to the set.
          const dir = rng() < 0.5 ? -1 : 1;
          const neighbor = Math.max(0, Math.min(MELODY.length - 1, idx + dir));
          playNote(
            MELODY[neighbor],
            start + t + 0.35 + rng() * 0.35,
            NOTE_LEVEL * 0.4,
          );
        }
      }
      t += 1.6 + rng() * 3;
    }

    // Pad: two blooms per cycle so the midrange is rarely empty. The first
    // always fires early; the second usually fills the back half.
    const chordA = PAD_CHORDS[Math.floor(rng() * PAD_CHORDS.length)];
    playPad(chordA, start + 1 + rng() * CYCLE * 0.35);
    if (rng() > 0.25) {
      const chordB = PAD_CHORDS[Math.floor(rng() * PAD_CHORDS.length)];
      playPad(chordB, start + CYCLE * 0.5 + rng() * CYCLE * 0.4);
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
    compressor.disconnect();
    makeupGain.disconnect();
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
