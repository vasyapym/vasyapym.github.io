// Evening Forest — the score, in the Proteus manner.
// A pure-sine drone holds the horizon and glides between four roots
// (Dm, Bb, F, C) every 38.4 s. One seeded motif is restated in each new
// key as sparse plucks; a pad blooms once a cycle; a glassy bell rings
// now and then. Everything here is tonal — the only shaped noise is the
// reverb impulse, which is the room, not a layer. Night sinks and thins
// the music, walking quickens it, and a near fox invites the chime.
import { createRng } from "./rng.ts";
import { audioEnv } from "./audio-env.ts";

export type EveningMusicVoice = { stop: () => void };

type Phase = {
  rootMidi: number;
  padMidi: number[];
  scaleMidi: number[];
};

// Dm → Bb → F → C: the same world in new light, home again every ~2.5 min.
const PHASES: Phase[] = [
  { rootMidi: 38, padMidi: [50, 57, 64], scaleMidi: [57, 60, 62, 65, 67, 69, 72] }, // D aeolian
  { rootMidi: 46, padMidi: [46, 53, 57], scaleMidi: [58, 60, 62, 64, 65, 67, 69] }, // Bb lydian colour
  { rootMidi: 41, padMidi: [53, 57, 60], scaleMidi: [53, 55, 57, 60, 62, 65, 67] }, // F major warmth
  { rootMidi: 36, padMidi: [48, 55, 62], scaleMidi: [55, 57, 60, 62, 64, 67, 69] }, // C sus2 float
];

const CYCLE_SECONDS = 38.4;
const TICK_MS = 1000;
const LOOKAHEAD = 3.0;
const DRONE_LEVEL = 0.2;
const DRONE_GLIDE = 4;
const PLUCK_LEVEL = 0.12;
const PAD_LEVEL = 0.16;
const CHIME_LEVEL = 0.08;
const SILENCE = 0.0001;

// Ratio and level of each drone partial. The upper two are the ones a
// phone speaker can actually reproduce.
const DRONE_PARTIALS = [
  { ratio: 1, level: 1.0 },
  { ratio: 1.5, level: 0.5 },
  { ratio: 2, level: 0.32 },
  { ratio: 4, level: 0.12 },
];

type Pluck = {
  kind: "pluck";
  at: number;
  phase: Phase;
  degree: number;
  shift: number;
  level: number;
  peak: boolean;
  last: boolean;
};

type MusicEvent =
  | Pluck
  | { kind: "statement" | "filler" | "pad" | "chime"; at: number; phase: Phase };

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// 0..1, triangular: nothing before 0.15, deepest at 0.55, gone by 0.95.
function nightness(t: number): number {
  const x = clamp01(t);
  if (x <= 0.15) return 0;
  if (x < 0.55) return (x - 0.15) / 0.4;
  if (x < 0.95) return (0.95 - x) / 0.4;
  return 0;
}

function midiToFreq(m: number): number {
  return 440 * 2 ** ((m - 69) / 12);
}

// The room: a seeded, exponentially decaying stereo impulse. Space, not a layer.
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

// One contour for the whole piece: 6–8 scale degrees (0..6), shaped as an
// arch, a descent or a rise, never stepping more than two degrees at once.
function buildContour(rng: () => number): number[] {
  const length = 6 + Math.floor(rng() * 3);
  const template = Math.floor(rng() * 3);
  let degree =
    template === 1
      ? 4 + Math.floor(rng() * 2)
      : template === 2
        ? Math.floor(rng() * 2)
        : 1 + Math.floor(rng() * 2);
  const steps = [degree];
  for (let i = 1; i < length; i += 1) {
    const progress = i / (length - 1);
    const lean = template === 0 ? (progress < 0.5 ? 1 : -1) : template === 1 ? -1 : 1;
    const r = rng();
    const step = r < 0.55 ? lean : r < 0.75 ? lean * 2 : r < 0.9 ? 0 : -lean;
    degree = Math.max(0, Math.min(6, degree + step));
    steps.push(degree);
  }
  return steps;
}

export function createEveningMusic(
  ctx: AudioContext,
  out: AudioNode,
): EveningMusicVoice {
  const rng = createRng("evening-forest-music");
  const active = new Set<() => void>();

  function register(dispose: () => void, ender: OscillatorNode): void {
    active.add(dispose);
    ender.onended = () => {
      if (active.delete(dispose)) dispose();
    };
  }

  // Bus: gentle glue, a little makeup, then out.
  const musicBus = ctx.createGain();
  musicBus.gain.value = 0.5;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 20;
  compressor.ratio.value = 2;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.3;
  const makeup = ctx.createGain();
  makeup.gain.value = 1.5;
  musicBus.connect(compressor);
  compressor.connect(makeup);
  makeup.connect(out);

  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.9;
  dryGain.connect(musicBus);
  const convolver = ctx.createConvolver();
  convolver.buffer = buildImpulse(ctx, rng);
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.6;
  convolver.connect(wetGain);
  wetGain.connect(musicBus);
  const reverbSend = ctx.createGain();
  reverbSend.gain.value = 0.55;
  reverbSend.connect(convolver);

  function connectVoice(node: AudioNode): void {
    node.connect(dryGain);
    node.connect(reverbSend);
  }

  // Drone: four sines on the phase root, breathing slowly.
  const droneGain = ctx.createGain();
  droneGain.gain.value = DRONE_LEVEL;
  connectVoice(droneGain);
  const breath = ctx.createOscillator();
  breath.type = "sine";
  breath.frequency.value = 0.05;
  const breathDepth = ctx.createGain();
  breathDepth.gain.value = DRONE_LEVEL * 0.2;
  breath.connect(breathDepth);
  breathDepth.connect(droneGain.gain);
  breath.start();

  let droneRoot = midiToFreq(PHASES[0].rootMidi);
  const droneOscs: OscillatorNode[] = [];
  const droneNodes: AudioNode[] = [droneGain, breath, breathDepth];
  for (const partial of DRONE_PARTIALS) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = droneRoot * partial.ratio;
    const level = ctx.createGain();
    level.gain.value = partial.level;
    osc.connect(level);
    level.connect(droneGain);
    osc.start();
    droneOscs.push(osc);
    droneNodes.push(osc, level);
  }
  active.add(() => {
    for (const node of droneNodes) node.disconnect();
  });

  // Glide every partial to the new root over a few seconds.
  function retuneDrone(at: number, rootMidi: number): void {
    const target = midiToFreq(rootMidi);
    if (target === droneRoot) return;
    for (let i = 0; i < droneOscs.length; i += 1) {
      const ratio = DRONE_PARTIALS[i].ratio;
      const freq = droneOscs[i].frequency;
      freq.setValueAtTime(droneRoot * ratio, at);
      freq.exponentialRampToValueAtTime(target * ratio, at + DRONE_GLIDE);
    }
    droneRoot = target;
  }

  // The motif and its peak, fixed for the life of this voice.
  const contour = buildContour(rng);
  let peakIndex = 0;
  for (let i = 1; i < contour.length; i += 1) {
    if (contour[i] > contour[peakIndex]) peakIndex = i;
  }

  // Plucked pair: triangle for the pick, sine for the body.
  function pluck(
    at: number,
    freq: number,
    level: number,
    decay: number,
    pan: number,
    cutoff: number,
  ): void {
    const tri = ctx.createOscillator();
    tri.type = "triangle";
    tri.frequency.value = freq;
    const triLevel = ctx.createGain();
    triLevel.gain.value = 0.4;
    const sine = ctx.createOscillator();
    sine.type = "sine";
    sine.frequency.value = freq;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(level, at + 0.008);
    env.gain.exponentialRampToValueAtTime(SILENCE, at + decay);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    tri.connect(triLevel);
    triLevel.connect(env);
    sine.connect(env);
    env.connect(filter);
    filter.connect(panner);
    connectVoice(panner);
    const end = at + decay + 0.05;
    tri.start(at);
    sine.start(at);
    tri.stop(end);
    sine.stop(end);
    register(() => {
      tri.disconnect();
      triLevel.disconnect();
      sine.disconnect();
      env.disconnect();
      filter.disconnect();
      panner.disconnect();
    }, sine);
  }

  // Map the fixed contour into the current phase's scale, with this
  // statement's drops, breaths, gravity and optional final lift.
  function expandStatement(start: number, phase: Phase): void {
    const night = nightness(audioEnv.timeOfDay);
    const walk = clamp01(audioEnv.moveSpeed / 3.4);
    const rest = 0.15 + night * 0.15;
    const spacing = (0.6 + rng() * 0.3) * (1 + night * 0.25) * (1 - walk * 0.15);
    const dropCount = rng() < 0.4 ? 2 : 1;
    const drops = new Set<number>();
    while (drops.size < dropCount) {
      drops.add(1 + Math.floor(rng() * (contour.length - 2)));
    }
    const gravity = night > 0.6 ? -12 : 0;
    const lift = rng() < 0.3 ? 12 : 0;
    let t = start;
    for (let i = 0; i < contour.length; i += 1) {
      const last = i === contour.length - 1;
      if (!drops.has(i)) {
        pending.push({
          kind: "pluck",
          at: t,
          phase,
          degree: contour[i],
          shift: gravity + (last ? lift : 0),
          level: PLUCK_LEVEL * (0.85 + rng() * 0.15),
          peak: i === peakIndex,
          last,
        });
      }
      t += spacing * (0.9 + rng() * 0.2);
      if (!last && rng() < rest) t += spacing;
    }
  }

  function playPluck(ev: Pluck): void {
    const night = nightness(audioEnv.timeOfDay);
    const scale = ev.phase.scaleMidi;
    const level = ev.level * (1 - night * 0.2);
    const decay = 0.5 + rng() * 0.4;
    const pan = (rng() * 2 - 1) * 0.45;
    const cutoff = 2000 - night * 500;
    pluck(ev.at, midiToFreq(scale[ev.degree] + ev.shift), level, decay, pan, cutoff);
    if (ev.peak && rng() < 0.3) {
      const padNote = ev.phase.padMidi[Math.floor(rng() * ev.phase.padMidi.length)] + 12;
      pluck(ev.at + 0.012, midiToFreq(padNote), level * 0.3, decay, -pan, cutoff);
    }
    if (ev.last && rng() < 0.35) {
      const neighbour = Math.max(0, Math.min(6, ev.degree + (rng() < 0.5 ? -1 : 1)));
      pluck(ev.at + 0.38, midiToFreq(scale[neighbour] + ev.shift), level * 0.35, decay, pan * 0.5, cutoff);
    }
  }

  // A single stray note in the gaps; sometimes it chooses silence instead.
  function playFiller(at: number, phase: Phase): void {
    const night = nightness(audioEnv.timeOfDay);
    if (rng() < 0.15 + night * 0.15) return;
    const degree = Math.floor(rng() * 7);
    const shift = night > 0.6 ? -12 : 0;
    pluck(
      at,
      midiToFreq(phase.scaleMidi[degree] + shift),
      PLUCK_LEVEL * 0.6 * (1 - night * 0.2),
      0.5 + rng() * 0.4,
      (rng() * 2 - 1) * 0.45,
      2000 - night * 500,
    );
  }

  // Pad bloom: three slow sine swells on the phase voicing.
  function playPad(at: number, phase: Phase): void {
    const night = nightness(audioEnv.timeOfDay);
    const level = (PAD_LEVEL / phase.padMidi.length) * (1 - night * 0.25);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200 - 250 * night;
    connectVoice(filter);
    const end = at + 4 + 2 + 6;
    const nodes: AudioNode[] = [filter];
    const oscs: OscillatorNode[] = [];
    for (const midi of phase.padMidi) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = midiToFreq(midi);
      osc.detune.value = (rng() * 2 - 1) * 4;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(level, at + 4);
      env.gain.setValueAtTime(level, at + 6);
      env.gain.linearRampToValueAtTime(0, end);
      osc.connect(env);
      env.connect(filter);
      osc.start(at);
      osc.stop(end + 0.05);
      nodes.push(osc, env);
      oscs.push(osc);
    }
    register(() => {
      for (const node of nodes) node.disconnect();
    }, oscs[oscs.length - 1]);
  }

  // Chime: two-partial glass bell on the phase's top note, lower at night.
  function playChime(at: number, phase: Phase): void {
    const night = nightness(audioEnv.timeOfDay);
    const top = phase.scaleMidi[phase.scaleMidi.length - 1];
    const freq = midiToFreq(top + (rng() < night * 0.7 ? 0 : 12));
    const decay = 3 + rng();
    const fundamental = ctx.createOscillator();
    fundamental.type = "sine";
    fundamental.frequency.value = freq;
    const partial = ctx.createOscillator();
    partial.type = "sine";
    partial.frequency.value = freq * 2;
    const partialLevel = ctx.createGain();
    partialLevel.gain.value = 0.35;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(CHIME_LEVEL, at + 0.01);
    env.gain.exponentialRampToValueAtTime(SILENCE, at + decay);
    const panner = ctx.createStereoPanner();
    panner.pan.value = (rng() * 2 - 1) * 0.5;
    fundamental.connect(env);
    partial.connect(partialLevel);
    partialLevel.connect(env);
    env.connect(panner);
    connectVoice(panner);
    const end = at + decay + 0.05;
    fundamental.start(at);
    partial.start(at);
    fundamental.stop(end);
    partial.stop(end);
    register(() => {
      fundamental.disconnect();
      partial.disconnect();
      partialLevel.disconnect();
      env.disconnect();
      panner.disconnect();
    }, fundamental);
  }

  // Lay out one cycle: retune, one or two statements, a bloom, a few
  // stray notes, maybe a bell. Notes themselves are read fresh when played.
  const pending: MusicEvent[] = [];
  let cycleIndex = 0;
  let nextCycleAt = ctx.currentTime + 0.2;

  function commitCycle(start: number): void {
    const phase = PHASES[cycleIndex % PHASES.length];
    const night = nightness(audioEnv.timeOfDay);
    retuneDrone(start, phase.rootMidi);
    pending.push({ kind: "statement", at: start + 2 + rng() * 5, phase });
    if (rng() < 0.65) {
      pending.push({ kind: "statement", at: start + 19 + rng() * 7, phase });
    }
    pending.push({ kind: "pad", at: start + 8 + rng() * 14, phase });
    const fillers = Math.floor(rng() * 3);
    for (let i = 0; i < fillers; i += 1) {
      pending.push({ kind: "filler", at: start + 12 + rng() * 22, phase });
    }
    const foxNear = audioEnv.foxDist !== null && audioEnv.foxDist < 12;
    const chimeChance = 0.4 * (1 - night * 0.5) + (foxNear ? 0.3 : 0);
    if (rng() < chimeChance) {
      pending.push({ kind: "chime", at: start + rng() * CYCLE_SECONDS, phase });
    }
    cycleIndex += 1;
  }

  function play(ev: MusicEvent): void {
    switch (ev.kind) {
      case "statement":
        expandStatement(ev.at, ev.phase);
        break;
      case "pluck":
        playPluck(ev);
        break;
      case "filler":
        playFiller(ev.at, ev.phase);
        break;
      case "pad":
        playPad(ev.at, ev.phase);
        break;
      case "chime":
        playChime(ev.at, ev.phase);
        break;
    }
  }

  function tick(): void {
    const now = ctx.currentTime;
    const horizon = now + LOOKAHEAD;
    while (nextCycleAt < horizon) {
      commitCycle(nextCycleAt);
      nextCycleAt += CYCLE_SECONDS;
    }
    while (pending.length > 0) {
      pending.sort((a, b) => a.at - b.at);
      const next = pending[0];
      if (next === undefined || next.at >= horizon) break;
      pending.shift();
      // A throttled tab can hand us the past; nudge it just ahead of now.
      if (next.at < now) next.at = now + 0.05;
      play(next);
    }
    const night = nightness(audioEnv.timeOfDay);
    droneGain.gain.setTargetAtTime(DRONE_LEVEL * (1 - night * 0.18), now, 2);
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
    pending.length = 0;
    dryGain.disconnect();
    wetGain.disconnect();
    reverbSend.disconnect();
    convolver.disconnect();
    musicBus.disconnect();
    compressor.disconnect();
    makeup.disconnect();
  }

  return { stop };
}
