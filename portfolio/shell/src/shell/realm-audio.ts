// realm-audio.ts — "the deep" abyssal audio bed (webaudio synthesis, no assets).
// architecture: one suspended AudioContext → master gain (mute + dive ramps) →
// destination. the continuous bed (38 Hz sine drone + a slow breathing lfo, plus
// a speed-tracking filtered-noise "current") is created up front but only STARTED
// lazily on the first successful resume() (autoplay policy). the seven creature
// voices share ONE parameterised factory (waveform / envelope / filter / cadence)
// fed by ~10 Hz update() mixing: each voice is panned by voices[].pan, scaled by
// voices[].gain, and the whole voice bus rides `nearest` presence. greeting(id)
// fires one louder flourish; dive() sweeps master + drone + current down into
// silence and stops re-triggering; dispose() stops, disconnects and closes.
// createRealmAudio() NEVER throws: if AudioContext is missing → silent stub.

export interface RealmAudio {
  resume(): void;                    // call inside gesture handlers until it sticks
  setMuted(m: boolean): void;
  update(s: {
    speed: number; nearest: number;
    voices: readonly { readonly id: string; readonly pan: number; readonly gain: number }[];
  }): void;                          // ~10 Hz
  greeting(id: string): void;        // the opened creature's voice flourish
  dive(): void;                      // downward sweep into silence
  dispose(): void;
}

type Snapshot = {
  speed: number; nearest: number;
  voices: readonly { readonly id: string; readonly pan: number; readonly gain: number }[];
};

type VoiceStyle = "heartbeat" | "thump" | "arp" | "ratchet" | "bowed" | "rising" | "pluck";

interface VoiceSpec {
  readonly id: string;
  readonly type: OscillatorType;
  readonly freq: number;
  readonly attack: number;
  readonly decay: number;
  readonly period: number;           // base cadence in seconds
  readonly style: VoiceStyle;
  readonly filter?: number;          // optional lowpass cutoff hz
}

// the seven creatures, index-aligned to catalogue order
const SPECS: readonly VoiceSpec[] = [
  { id: "raft-cluster",  style: "heartbeat", type: "triangle", freq: 120, attack: 0.003, decay: 0.09, period: 1.1 },
  { id: "kitty-run",     style: "arp",       type: "square",   freq: 330, attack: 0.004, decay: 0.16, period: 1.7, filter: 2200 },
  { id: "explosion",     style: "thump",     type: "sine",     freq: 90,  attack: 0.005, decay: 0.40, period: 2.6 },
  { id: "spine",         style: "ratchet",   type: "square",   freq: 520, attack: 0.002, decay: 0.03, period: 1.0, filter: 3000 },
  { id: "evening-forest",style: "bowed",     type: "sawtooth", freq: 196, attack: 0.45,  decay: 1.40, period: 4.2, filter: 1200 },
  { id: "planck-to-now", style: "rising",    type: "sine",     freq: 180, attack: 0.02,  decay: 0.10, period: 3.0 },
  { id: "practice-map",  style: "pluck",     type: "triangle", freq: 294, attack: 0.002, decay: 0.30, period: 1.4, filter: 1800 },
];

const NOMINAL = 0.9;

interface Voice {
  readonly spec: VoiceSpec;
  nextAt: number;
  setMix(pan: number, gain: number): void;
  trigger(t: number, boost: number): void;
  dispose(): void;
}

// one scheduled note: osc → env → (optional lowpass) → dest; self-cleans on ended
function note(ctx: AudioContext, dest: AudioNode, type: OscillatorType, freq: number,
  t: number, attack: number, decay: number, peak: number, filterHz?: number, endFreq?: number): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t + attack + decay);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  osc.connect(env);
  let tail: AudioNode = env;
  if (filterHz !== undefined) {
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(filterHz, t);
    env.connect(f);
    tail = f;
  }
  tail.connect(dest);
  osc.start(t);
  const end = t + attack + decay + 0.03;
  osc.stop(end);
  osc.onended = () => { osc.disconnect(); env.disconnect(); tail.disconnect(); };
}

// shared voice factory: persistent panner + mix gain, transient notes per trigger
function makeVoice(ctx: AudioContext, out: AudioNode, spec: VoiceSpec): Voice {
  const pan = ctx.createStereoPanner();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  pan.connect(gain);
  gain.connect(out);

  const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

  const trigger = (t: number, boost: number): void => {
    const p = 0.5 * boost;
    const d = pan;
    switch (spec.style) {
      case "heartbeat": // lub-dub
        note(ctx, d, spec.type, spec.freq, t, spec.attack, spec.decay, p * 0.9);
        note(ctx, d, spec.type, spec.freq * 0.75, t + 0.17, spec.attack, spec.decay * 1.2, p * 0.7);
        break;
      case "thump": // sub hit with a downward pitch drop
        note(ctx, d, spec.type, spec.freq, t, spec.attack, spec.decay, p * 1.1, undefined, spec.freq * 0.4);
        break;
      case "arp": { // quick ascending minor figure
        const r = [1, 1.2, 1.5, 1.8];
        for (let i = 0; i < r.length; i++) note(ctx, d, spec.type, spec.freq * r[i], t + i * 0.085, spec.attack, spec.decay, p * 0.8, spec.filter);
        break;
      }
      case "ratchet": // burst of dry ticks
        for (let i = 0; i < 6; i++) note(ctx, d, spec.type, spec.freq * (1 + i * 0.02), t + i * 0.045, spec.attack, spec.decay, p * 0.6, spec.filter);
        break;
      case "bowed": // sustained fifth
        note(ctx, d, spec.type, spec.freq, t, spec.attack, spec.decay, p * 0.6, spec.filter);
        note(ctx, d, spec.type, spec.freq * 1.5, t, spec.attack * 1.1, spec.decay, p * 0.5, spec.filter);
        break;
      case "rising": { // sine crescendo that sweeps up then resets each period
        const osc = ctx.createOscillator();
        osc.type = spec.type;
        const env = ctx.createGain();
        const dur = Math.max(spec.period * 0.7, 0.6);
        osc.frequency.setValueAtTime(spec.freq, t);
        osc.frequency.exponentialRampToValueAtTime(spec.freq * 3, t + dur);
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(Math.max(p * 0.7, 0.0002), t + 0.08);
        env.gain.setValueAtTime(Math.max(p * 0.7, 0.0002), t + dur - 0.1);
        env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(env);
        env.connect(d);
        osc.start(t);
        osc.stop(t + dur + 0.03);
        osc.onended = () => { osc.disconnect(); env.disconnect(); };
        break;
      }
      case "pluck": // soft short tone
        note(ctx, d, spec.type, spec.freq, t, spec.attack, spec.decay, p * 0.7, spec.filter);
        break;
    }
  };

  return {
    spec,
    nextAt: 0,
    setMix(panv, g) {
      const now = ctx.currentTime;
      pan.pan.setTargetAtTime(clamp(panv, -1, 1), now, 0.05);
      gain.gain.setTargetAtTime(clamp(g, 0, 1), now, 0.08);
    },
    trigger,
    dispose() { pan.disconnect(); gain.disconnect(); },
  };
}

function silentStub(): RealmAudio {
  return { resume() {}, setMuted() {}, update() {}, greeting() {}, dive() {}, dispose() {} };
}

export function createRealmAudio(): RealmAudio {
  const Ctor: typeof AudioContext | undefined =
    typeof window !== "undefined"
      ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  if (!Ctor) return silentStub();

  let ctx: AudioContext;
  try {
    ctx = new Ctor();
  } catch {
    return silentStub(); // context construction can throw on locked-down browsers
  }

  // persistent graph (silent until resume starts the sources)
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  const voiceBus = ctx.createGain();
  voiceBus.gain.value = 0.4;
  voiceBus.connect(master);

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 300;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.03;
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noiseBuffer.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const voices = SPECS.map((s) => makeVoice(ctx, voiceBus, s));
  const byId = new Map<string, Voice>(voices.map((v) => [v.spec.id, v]));

  let drone: OscillatorNode | null = null;
  let lfo: OscillatorNode | null = null;
  let lfoGain: GainNode | null = null;
  let droneGain: GainNode | null = null;
  let noiseSrc: AudioBufferSourceNode | null = null;

  let started = false;
  let muted = false;
  let diving = false;
  let disposed = false;

  const startSources = (): void => {
    if (started || disposed) return;
    started = true;
    drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.setValueAtTime(38, ctx.currentTime);
    droneGain = ctx.createGain();
    droneGain.gain.value = 0.22;
    drone.connect(droneGain);
    droneGain.connect(master);
    // slow breathing on the drone so the abyss feels alive
    lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);
    // the current: a looping noise wash we later brighten with speed
    noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;
    noiseSrc.connect(noiseFilter);
    drone.start();
    lfo.start();
    noiseSrc.start();
    master.gain.setTargetAtTime(muted ? 0.0001 : NOMINAL, ctx.currentTime, 0.2);
  };

  return {
    resume() {
      if (disposed) return;
      if (ctx.state !== "running") {
        // idempotent: called from every gesture until the context actually runs
        ctx.resume().then(() => { if (ctx.state === "running") startSources(); }).catch(() => {});
      }
      if (ctx.state === "running") startSources();
    },
    setMuted(m) {
      muted = m;
      if (disposed || diving) return; // dive owns the ramp to silence
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(m ? 0.0001 : NOMINAL, now, 0.08);
    },
    update(s: Snapshot) {
      if (disposed || !started || diving) return;
      const now = ctx.currentTime;
      const sp = Math.min(Math.max(s.speed, 0), 2);
      // you hear your own current: faster → brighter + louder wash
      noiseFilter.frequency.setTargetAtTime(200 + sp * 1500, now, 0.1);
      noiseGain.gain.setTargetAtTime(0.03 + sp * 0.1, now, 0.1);
      const near = Math.min(Math.max(s.nearest, 0), 1);
      voiceBus.gain.setTargetAtTime(0.4 + near * 0.6, now, 0.1);
      for (const sv of s.voices) {
        const v = byId.get(sv.id);
        if (!v) continue;
        v.setMix(sv.pan, sv.gain);
        // cadence-driven re-trigger only when the voice is actually present
        if (sv.gain > 0.06 && now >= v.nextAt) {
          v.trigger(now, 1);
          v.nextAt = now + v.spec.period * (0.9 + Math.random() * 0.2);
        }
      }
    },
    greeting(id) {
      if (disposed || !started) return;
      const v = byId.get(id);
      if (!v) return;
      const now = ctx.currentTime;
      v.trigger(now, 1.6); // one louder flourish
      v.nextAt = now + 0.6;
    },
    dive() {
      if (disposed) return;
      diving = true; // stop the mixer from re-triggering voices
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0002), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      if (drone) drone.frequency.setTargetAtTime(20, now, 0.5);
      noiseFilter.frequency.setTargetAtTime(80, now, 0.4);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      try { drone?.stop(); } catch { /* already stopped */ }
      try { lfo?.stop(); } catch { /* already stopped */ }
      try { noiseSrc?.stop(); } catch { /* already stopped */ }
      for (const n of [drone, lfo, lfoGain, droneGain, noiseSrc, noiseFilter, noiseGain, voiceBus, master]) {
        try { n?.disconnect(); } catch { /* noop */ }
      }
      for (const v of voices) v.dispose();
      try { void ctx.close(); } catch { /* noop */ }
    },
  };
}
