// realm-audio.ts — synthesized abyssal audio bed, no assets.
// Sources start only after a successful gesture-driven resume().
// The master envelope owns mute, dive and surface attenuation.
// Surface is terminal: fade to exact silence, then stop continuous sources.
// dispose() remains an immediate, idempotent hard backstop.

export interface RealmAudio {
  resume(): void;
  setMuted(m: boolean): void;
  update(s: {
    speed: number;
    nearest: number;
    voices: readonly {
      readonly id: string;
      readonly pan: number;
      readonly gain: number;
    }[];
  }): void;
  greeting(id: string): void;
  dive(): void;
  surface(): void;
  dispose(): void;
}

type Snapshot = {
  speed: number;
  nearest: number;
  voices: readonly {
    readonly id: string;
    readonly pan: number;
    readonly gain: number;
  }[];
};

type VoiceStyle =
  | "heartbeat"
  | "thump"
  | "arp"
  | "ratchet"
  | "bowed"
  | "rising"
  | "pluck";

interface VoiceSpec {
  readonly id: string;
  readonly type: OscillatorType;
  readonly freq: number;
  readonly attack: number;
  readonly decay: number;
  readonly period: number;
  readonly style: VoiceStyle;
  readonly filter?: number;
}

const SPECS: readonly VoiceSpec[] = [
  { id: "raft-cluster", style: "heartbeat", type: "triangle", freq: 120, attack: 0.003, decay: 0.09, period: 1.1 },
  { id: "kitty-run", style: "arp", type: "square", freq: 330, attack: 0.004, decay: 0.16, period: 1.7, filter: 2200 },
  { id: "explosion", style: "thump", type: "sine", freq: 90, attack: 0.005, decay: 0.40, period: 2.6 },
  { id: "spine", style: "ratchet", type: "square", freq: 520, attack: 0.002, decay: 0.03, period: 1.0, filter: 3000 },
  { id: "evening-forest", style: "bowed", type: "sawtooth", freq: 196, attack: 0.45, decay: 1.40, period: 4.2, filter: 1200 },
  { id: "planck-to-now", style: "rising", type: "sine", freq: 180, attack: 0.02, decay: 0.10, period: 3.0 },
  { id: "practice-map", style: "pluck", type: "triangle", freq: 294, attack: 0.002, decay: 0.30, period: 1.4, filter: 1800 },
];

const NOMINAL = 0.9;
const SURFACE_FADE_S = 0.44;
const SURFACE_STOP_S = 0.46;

interface Voice {
  readonly spec: VoiceSpec;
  nextAt: number;
  setMix(pan: number, gain: number): void;
  trigger(t: number, boost: number): void;
  dispose(): void;
}

function disconnect(node: AudioNode): void {
  try {
    node.disconnect();
  } catch {
    // Already disconnected, or the context is closing.
  }
}

function stopSource(source: AudioScheduledSourceNode, when?: number): void {
  try {
    if (when === undefined) source.stop();
    else source.stop(when);
  } catch {
    // Not started or already ended.
  }
}

function closeContext(ctx: AudioContext): void {
  try {
    void ctx.close().catch(() => {});
  } catch {
    // Closing an unavailable context is a best-effort backstop.
  }
}

// Each voice owns its transient-note cleanups as well as its persistent mix.
// This lets dispose() stop even notes scheduled to start in the future.
type NoteCleanups = Set<() => void>;

function ownNote(
  osc: OscillatorNode,
  nodes: readonly AudioNode[],
  cleanups: NoteCleanups,
): void {
  let cleaned = false;

  const cleanup = (): void => {
    if (cleaned) return;
    cleaned = true;
    cleanups.delete(cleanup);
    osc.onended = null;
    stopSource(osc);
    for (const node of nodes) disconnect(node);
  };

  cleanups.add(cleanup);
  osc.onended = cleanup;
}

function note(
  ctx: AudioContext,
  cleanups: NoteCleanups,
  dest: AudioNode,
  type: OscillatorType,
  freq: number,
  t: number,
  attack: number,
  decay: number,
  peak: number,
  filterHz?: number,
  endFreq?: number,
): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);

  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(endFreq, 1),
      t + attack + decay,
    );
  }

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(
    Math.max(peak, 0.0002),
    t + attack,
  );
  env.gain.exponentialRampToValueAtTime(
    0.0001,
    t + attack + decay,
  );

  osc.connect(env);
  const nodes: AudioNode[] = [osc, env];
  let tail: AudioNode = env;

  if (filterHz !== undefined) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterHz, t);
    env.connect(filter);
    nodes.push(filter);
    tail = filter;
  }

  tail.connect(dest);
  ownNote(osc, nodes, cleanups);
  osc.start(t);
  osc.stop(t + attack + decay + 0.03);
}

function makeVoice(
  ctx: AudioContext,
  out: AudioNode,
  spec: VoiceSpec,
): Voice {
  const pan = ctx.createStereoPanner();
  const gain = ctx.createGain();
  const cleanups: NoteCleanups = new Set();
  let disposed = false;

  gain.gain.value = 0;
  pan.connect(gain);
  gain.connect(out);

  const clamp = (v: number, lo: number, hi: number): number =>
    Math.min(Math.max(v, lo), hi);

  const trigger = (t: number, boost: number): void => {
    if (disposed) return;
    const p = 0.5 * boost;

    switch (spec.style) {
      case "heartbeat":
        note(ctx, cleanups, pan, spec.type, spec.freq,
          t, spec.attack, spec.decay, p * 0.9);
        note(ctx, cleanups, pan, spec.type, spec.freq * 0.75,
          t + 0.17, spec.attack, spec.decay * 1.2, p * 0.7);
        break;

      case "thump":
        note(ctx, cleanups, pan, spec.type, spec.freq,
          t, spec.attack, spec.decay, p * 1.1,
          undefined, spec.freq * 0.4);
        break;

      case "arp": {
        const ratios = [1, 1.2, 1.5, 1.8];
        for (let i = 0; i < ratios.length; i++) {
          note(ctx, cleanups, pan, spec.type, spec.freq * ratios[i],
            t + i * 0.085, spec.attack, spec.decay,
            p * 0.8, spec.filter);
        }
        break;
      }

      case "ratchet":
        for (let i = 0; i < 6; i++) {
          note(ctx, cleanups, pan, spec.type, spec.freq * (1 + i * 0.02),
            t + i * 0.045, spec.attack, spec.decay,
            p * 0.6, spec.filter);
        }
        break;

      case "bowed":
        note(ctx, cleanups, pan, spec.type, spec.freq,
          t, spec.attack, spec.decay, p * 0.6, spec.filter);
        note(ctx, cleanups, pan, spec.type, spec.freq * 1.5,
          t, spec.attack * 1.1, spec.decay, p * 0.5, spec.filter);
        break;

      case "rising": {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const dur = Math.max(spec.period * 0.7, 0.6);
        const peak = Math.max(p * 0.7, 0.0002);

        osc.type = spec.type;
        osc.frequency.setValueAtTime(spec.freq, t);
        osc.frequency.exponentialRampToValueAtTime(
          spec.freq * 3,
          t + dur,
        );

        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(peak, t + 0.08);
        env.gain.setValueAtTime(peak, t + dur - 0.1);
        env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        osc.connect(env);
        env.connect(pan);
        ownNote(osc, [osc, env], cleanups);
        osc.start(t);
        osc.stop(t + dur + 0.03);
        break;
      }

      case "pluck":
        note(ctx, cleanups, pan, spec.type, spec.freq,
          t, spec.attack, spec.decay, p * 0.7, spec.filter);
        break;
    }
  };

  return {
    spec,
    nextAt: 0,

    setMix(panValue, mixGain) {
      if (disposed) return;
      const now = ctx.currentTime;
      pan.pan.setTargetAtTime(clamp(panValue, -1, 1), now, 0.05);
      gain.gain.setTargetAtTime(clamp(mixGain, 0, 1), now, 0.08);
    },

    trigger,

    dispose() {
      if (disposed) return;
      disposed = true;
      for (const cleanup of Array.from(cleanups)) cleanup();
      disconnect(pan);
      disconnect(gain);
    },
  };
}

function silentStub(): RealmAudio {
  return {
    resume() {},
    setMuted() {},
    update() {},
    greeting() {},
    dive() {},
    surface() {},
    dispose() {},
  };
}

type MasterRamp = {
  from: number;
  to: number;
  start: number;
  end: number;
  exponential: boolean;
};

function buildRealmAudio(ctx: AudioContext): RealmAudio {
  const master = ctx.createGain();
  master.gain.value = 0;
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

  const noiseBuffer = ctx.createBuffer(
    1,
    Math.ceil(ctx.sampleRate * 2),
    ctx.sampleRate,
  );
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const voices = SPECS.map((spec) => makeVoice(ctx, voiceBus, spec));
  const byId = new Map<string, Voice>(
    voices.map((voice) => [voice.spec.id, voice]),
  );

  let drone: OscillatorNode | null = null;
  let lfo: OscillatorNode | null = null;
  let lfoGain: GainNode | null = null;
  let droneGain: GainNode | null = null;
  let noiseSrc: AudioBufferSourceNode | null = null;

  let started = false;
  let muted = false;
  let diving = false;
  let surfacing = false;
  let disposed = false;
  let resuming = false;

  let masterRamp: MasterRamp = {
    from: 0,
    to: 0,
    start: ctx.currentTime,
    end: ctx.currentTime,
    exponential: false,
  };

  // All master automation goes through this helper. Its tracked envelope
  // provides a continuous splice without depending on cancelAndHoldAtTime.
  const masterValueAt = (now: number): number => {
    const r = masterRamp;
    if (now >= r.end) return r.to;
    if (now <= r.start) return r.from;

    const u = (now - r.start) / (r.end - r.start);
    return r.exponential
      ? r.from * Math.pow(r.to / r.from, u)
      : r.from + (r.to - r.from) * u;
  };

  const rampMaster = (
    to: number,
    seconds: number,
    exponential = false,
  ): void => {
    const now = ctx.currentTime;
    const from = masterValueAt(now);
    const end = now + Math.max(seconds, 0);
    const useExponential = exponential && from > 0 && to > 0;

    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(from, now);

    if (seconds <= 0) {
      master.gain.setValueAtTime(to, now);
    } else if (useExponential) {
      master.gain.exponentialRampToValueAtTime(to, end);
    } else {
      master.gain.linearRampToValueAtTime(to, end);
    }

    masterRamp = {
      from: seconds <= 0 ? to : from,
      to,
      start: now,
      end,
      exponential: useExponential,
    };
  };

  const stopContinuousAt = (when: number): void => {
    if (drone) stopSource(drone, when);
    if (lfo) stopSource(lfo, when);
    if (noiseSrc) stopSource(noiseSrc, when);
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;

    // Deliberately immediate: normal surface exit must already be silent.
    if (drone) stopSource(drone);
    if (lfo) stopSource(lfo);
    if (noiseSrc) stopSource(noiseSrc);

    for (const voice of voices) voice.dispose();

    for (const node of [
      drone, lfo, lfoGain, droneGain, noiseSrc,
      noiseFilter, noiseGain, voiceBus, master,
    ]) {
      if (node) disconnect(node);
    }

    closeContext(ctx);
  };

  const startSources = (): void => {
    if (
      started || disposed || diving || surfacing ||
      ctx.state !== "running"
    ) return;

    // If any lazy node creation/start fails, seal and close this instance.
    try {
      started = true;
      const now = ctx.currentTime;

      drone = ctx.createOscillator();
      drone.type = "sine";
      drone.frequency.setValueAtTime(38, now);

      droneGain = ctx.createGain();
      droneGain.gain.value = 0.22;
      drone.connect(droneGain);
      droneGain.connect(master);

      lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.08;

      lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.08;
      lfo.connect(lfoGain);
      lfoGain.connect(droneGain.gain);

      noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      noiseSrc.loop = true;
      noiseSrc.connect(noiseFilter);

      drone.start(now);
      lfo.start(now);
      noiseSrc.start(now);

      rampMaster(muted ? 0 : NOMINAL, 0.6);
    } catch {
      dispose();
    }
  };

  return {
    resume() {
      if (disposed || diving || surfacing) return;

      if (ctx.state === "running") {
        startSources();
        return;
      }

      if (resuming || ctx.state === "closed") return;
      resuming = true;

      try {
        void ctx.resume().then(
          () => {
            resuming = false;
            // Rechecks terminal flags after an asynchronous policy decision.
            startSources();
          },
          () => {
            resuming = false;
          },
        );
      } catch {
        resuming = false;
      }
    },

    setMuted(m) {
      muted = m;
      if (disposed || diving || surfacing || !started) return;
      rampMaster(m ? 0 : NOMINAL, 0.16);
    },

    update(s: Snapshot) {
      if (disposed || !started || diving || surfacing) return;
      const now = ctx.currentTime;
      const speed = Math.min(Math.max(s.speed, 0), 2);

      noiseFilter.frequency.setTargetAtTime(
        200 + speed * 1500, now, 0.1,
      );
      noiseGain.gain.setTargetAtTime(
        0.03 + speed * 0.1, now, 0.1,
      );

      const nearest = Math.min(Math.max(s.nearest, 0), 1);
      voiceBus.gain.setTargetAtTime(0.4 + nearest * 0.6, now, 0.1);

      for (const mix of s.voices) {
        const voice = byId.get(mix.id);
        if (!voice) continue;

        voice.setMix(mix.pan, mix.gain);
        if (!muted && mix.gain > 0.06 && now >= voice.nextAt) {
          voice.trigger(now, 1);
          voice.nextAt =
            now + voice.spec.period * (0.9 + Math.random() * 0.2);
        }
      }
    },

    greeting(id) {
      if (disposed || !started || muted || diving || surfacing) return;
      const voice = byId.get(id);
      if (!voice) return;

      const now = ctx.currentTime;
      voice.trigger(now, 1.6);
      voice.nextAt = now + 0.6;
    },

    dive() {
      if (disposed || diving || surfacing) return;
      diving = true;

      const now = ctx.currentTime;
      const current = masterValueAt(now);

      // Preserve the 1.2-second downward sweep without raising a muted
      // master to an artificial positive floor.
      rampMaster(Math.min(current, 0.0001), 1.2, current > 0);

      if (drone) drone.frequency.setTargetAtTime(20, now, 0.5);
      noiseFilter.frequency.setTargetAtTime(80, now, 0.4);
    },

    surface() {
      if (disposed || surfacing) return;
      surfacing = true;

      const now = ctx.currentTime;

      if (!started || ctx.state !== "running") {
        // No audible output currently exists. Prevent a late resume from
        // exposing a frozen, nonzero envelope.
        rampMaster(0, 0);
        stopContinuousAt(now);
        return;
      }

      // Owns the entire graph, including already-scheduled flourishes.
      // Linear automation permits exact zero; exponential automation does not.
      rampMaster(0, SURFACE_FADE_S);
      stopContinuousAt(now + SURFACE_STOP_S);
    },

    dispose,
  };
}

export function createRealmAudio(): RealmAudio {
  let ctx: AudioContext | undefined;

  try {
    const Ctor: typeof AudioContext | undefined =
      typeof window !== "undefined"
        ? (
          window.AudioContext ??
          (window as unknown as {
            webkitAudioContext?: typeof AudioContext;
          }).webkitAudioContext
        )
        : undefined;

    if (!Ctor) return silentStub();
    ctx = new Ctor();
    return buildRealmAudio(ctx);
  } catch {
    if (ctx) closeContext(ctx);
    return silentStub();
  }
}
