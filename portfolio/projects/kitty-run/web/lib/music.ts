// Cat Runner — procedural adaptive score, Celeste (Lena Raine) flavoured.
//
// NOT a chiptune. 100% Web Audio, no files: a lookahead scheduler sequences a
// four-bar maj7/min7 chord loop while the game conducts tempo and layers from
// live gameplay state. Richness comes from TEXTURE, not loudness:
//   - warm analog-style pads: four detuned saws through a shared lowpass,
//   - soft melodic bass (sine + octave-up triangle), never gated,
//   - a "kitty" lead that floats in a tempo-locked dotted-eighth delay +
//     reverb, with a gentle vibrato LFO,
//   - gentle drums driving a sidechain PUMP so the whole mix breathes,
//   - a procedural stereo convolution reverb built once in the constructor.
// The output loudness sits deliberately between the old harsh values.

type WorldLike = {
  status: "ready" | "running" | "paused" | "over";
  speed: number;
  combo: number;
};

type OscType = "sine" | "square" | "triangle" | "sawtooth";

const LOOKAHEAD = 0.14;
const STEPS_PER_BAR = 16;
const LOOP_STEPS = STEPS_PER_BAR * 4; // 64: one four-bar chord cycle.

// root + arp tones kept exactly; `pad` is a warm four-voice 7th voicing.
const CHORDS: { root: number; tones: number[]; pad: number[] }[] = [
  { root: 130.81, tones: [261.63, 329.63, 392.0, 523.25], pad: [261.63, 329.63, 392.0, 493.88] }, // Cmaj7
  { root: 110.0, tones: [261.63, 329.63, 440.0, 523.25], pad: [220.0, 261.63, 329.63, 392.0] }, // Am7
  { root: 87.31, tones: [261.63, 349.23, 440.0, 523.25], pad: [174.61, 220.0, 261.63, 349.23] }, // Fmaj7
  { root: 98.0, tones: [246.94, 293.66, 392.0, 493.88], pad: [196.0, 246.94, 293.66, 349.23] }, // G7
];

const MOTIF: { step: number; freq: number }[] = [
  { step: 16, freq: 329.63 }, // E5
  { step: 20, freq: 392.0 }, // G5
  { step: 24, freq: 440.0 }, // A5
  { step: 28, freq: 392.0 }, // G5
  { step: 32, freq: 329.63 }, // E5
  { step: 36, freq: 293.66 }, // D5
  { step: 40, freq: 261.63 }, // C5
];

export class Soundtrack {
  private ctx: AudioContext;
  private bed: GainNode;
  private pump: GainNode; // sidechain "breathing" bus: bed -> pump -> destination.
  private delay: DelayNode; // tempo-locked dotted-eighth echo (the Celeste lead treatment).
  private reverbSend: GainNode; // shared wet bus into the procedural convolver.
  private noiseBuffer: AudioBuffer;
  private reverbIR: AudioBuffer;
  private step = 0;
  private nextTime = 0;
  private level = 0;
  private lastFrame = 0;
  private duckUntil = 0;
  private kickLvl = 0;
  private arpLvl = 0;
  private hatLvl = 0;
  private motifLvl = 0;
  private canPan: boolean;
  private sparkleSide = 1;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.canPan = typeof ctx.createStereoPanner === "function";

    // Sidechain pump sits between the bed and the world; scheduled ahead only.
    this.pump = ctx.createGain();
    this.pump.gain.value = 1;
    this.pump.connect(destination);

    this.bed = ctx.createGain();
    this.bed.gain.value = 0;
    this.bed.connect(this.pump);

    // Reuse-once noise source for drums/breaths — no per-call allocation.
    const frames = Math.floor(ctx.sampleRate);
    this.noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;

    // Procedural stereo impulse response: 1.6 s of exp-decayed white noise.
    // Generated, never fetched — still "no audio files".
    const irLen = Math.floor(ctx.sampleRate * 1.6);
    this.reverbIR = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch += 1) {
      const d = this.reverbIR.getChannelData(ch);
      for (let i = 0; i < irLen; i += 1) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.2);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = this.reverbIR;
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.28;
    this.reverbSend.connect(convolver);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.5;
    convolver.connect(reverbReturn);
    reverbReturn.connect(this.pump);

    // Tempo-synced delay with modest feedback; wet blended back into the pump.
    this.delay = ctx.createDelay(1.0);
    this.delay.delayTime.value = 0.3;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    this.delay.connect(feedback);
    feedback.connect(this.delay);
    const delayWet = ctx.createGain();
    delayWet.gain.value = 0.24;
    this.delay.connect(delayWet);
    delayWet.connect(this.pump);

    this.nextTime = ctx.currentTime + 0.1;
    this.lastFrame = ctx.currentTime;
  }

  update(world: WorldLike, muted: boolean): void {
    const now = this.ctx.currentTime;
    const dt = Math.min(0.1, Math.max(0, now - this.lastFrame));
    this.lastFrame = now;
    const speedNorm = Math.min(1, Math.max(0, (world.speed - 7) / 7));
    const comboNorm = Math.min(1, world.combo / 12);
    const intensity =
      world.status === "running" ? 0.25 + 0.45 * speedNorm + 0.3 * comboNorm : 0.18;
    // Layer crossfades (unchanged thresholds/mechanism).
    const ease = Math.min(1, 4 * dt);
    this.kickLvl += ((intensity > 0.28 ? 1 : 0) - this.kickLvl) * ease;
    this.arpLvl += ((intensity > 0.3 ? 1 : 0) - this.arpLvl) * ease;
    this.hatLvl += ((intensity > 0.38 ? 1 : 0) - this.hatLvl) * ease;
    this.motifLvl += ((intensity > 0.45 ? 1 : 0) - this.motifLvl) * ease;
    // Moderate loudness: richness lives in the pad/delay/reverb, not the gain.
    let target = 0;
    if (!muted) {
      if (world.status === "running") target = 0.6 + 0.3 * intensity;
      else if (world.status === "ready") target = 0.45;
    }
    if (now < this.duckUntil) target *= 0.25;
    this.level += (target - this.level) * Math.min(1, 3.2 * dt);
    this.bed.gain.setTargetAtTime(this.level * 0.6, now, 0.06);
    if (muted || world.status === "paused" || world.status === "over") {
      this.nextTime = Math.max(this.nextTime, now + 0.06); // park the sequencer.
      return;
    }
    const bpm = 96 + 36 * speedNorm;
    const stepDur = 60 / bpm / 4;
    // Dotted-eighth echo glides to follow the tempo.
    this.delay.delayTime.setTargetAtTime((0.75 * 60) / bpm, now, 0.1);
    while (this.nextTime < now + LOOKAHEAD) {
      this.scheduleStep(this.step, this.nextTime, intensity, speedNorm, world.combo, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % LOOP_STEPS;
    }
  }

  duck(): void {
    this.duckUntil = this.ctx.currentTime + 0.45;
  }

  private scheduleStep(
    step: number,
    t: number,
    intensity: number,
    speedNorm: number,
    combo: number,
    stepDur: number,
  ): void {
    const inBar = step % STEPS_PER_BAR;
    const chord = CHORDS[Math.floor(step / STEPS_PER_BAR) % CHORDS.length];

    // Warm analog pad at the top of every bar.
    if (inBar === 0) {
      this.pad(chord.pad, t, stepDur * STEPS_PER_BAR);
    }
    // Melodic bass on the strong quarters: root, root, fifth, root.
    if (inBar === 0 || inBar === 4 || inBar === 8 || inBar === 12) {
      const idx = inBar / 4;
      this.bass(idx === 2 ? chord.root * 1.5 : chord.root, t);
    }
    // Kick drives the sidechain pump breath (scheduled ahead — never fights bed).
    if (this.kickLvl > 0.02 && (inBar === 0 || inBar === 8)) {
      this.kick(t);
      this.pump.gain.setValueAtTime(0.72, t);
      this.pump.gain.linearRampToValueAtTime(1, t + 0.22);
    }
    // Soft snare backbeat with a touch of reverb space.
    if (this.hatLvl > 0.02 && (inBar === 4 || inBar === 12)) {
      this.snare(t, 0.07 * this.hatLvl);
    }
    // Plucky arp climbing the chord tones.
    if (this.arpLvl > 0.02 && inBar % 2 === 0) {
      const note = chord.tones[Math.floor(step / 2) % chord.tones.length];
      this.arp(note, t, (0.07 + 0.06 * speedNorm) * this.arpLvl);
    }
    // Airy off-beat hats.
    if (this.hatLvl > 0.02 && (inBar === 2 || inBar === 6 || inBar === 10 || inBar === 14)) {
      this.hat(t, (0.04 + 0.03 * intensity) * this.hatLvl, -0.25);
    }
    // Combo sparkle, ping-ponged into the delay.
    if (combo >= 8 && inBar === 4) {
      const pan = 0.4 * this.sparkleSide;
      this.sparkleSide = -this.sparkleSide;
      this.sparkle(chord.tones[3] * 2, t, pan);
    }
    // Kitty motif — the lead, floating in delay + reverb.
    if (this.motifLvl > 0.02) {
      for (let i = 0; i < MOTIF.length; i += 1) {
        if (MOTIF[i].step === step) {
          this.motif(MOTIF[i].freq, t, 0.09 * this.motifLvl);
          break;
        }
      }
    }
  }

  // Mono-safe stereo placement; identity pass-through when unsupported.
  private panTo(node: AudioNode, pan: number): AudioNode {
    if (!this.canPan || pan === 0) return node;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;
    node.connect(panner);
    return panner;
  }

  // Tap a voice into the shared reverb/delay wet buses (fixed per-call gains).
  private send(source: AudioNode, reverbAmt: number, delayAmt: number): void {
    if (reverbAmt > 0) {
      const g = this.ctx.createGain();
      g.gain.value = reverbAmt;
      source.connect(g);
      g.connect(this.reverbSend);
    }
    if (delayAmt > 0) {
      const g = this.ctx.createGain();
      g.gain.value = delayAmt;
      source.connect(g);
      g.connect(this.delay);
    }
  }

  // Generic tuned oscillator to the bed — signature preserved for callers.
  private tone(
    type: OscType,
    from: number,
    t: number,
    duration: number,
    volume: number,
    pan: number,
    to?: number,
  ): void {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    if (to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + duration);
    }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    this.panTo(gain, pan).connect(this.bed);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  // Four detuned saws through one lowpass — the classic warm analog pad.
  private pad(freqs: number[], t: number, duration: number): void {
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1100;
    filter.Q.value = 0.7;
    this.panTo(filter, -0.1).connect(this.bed);
    this.send(filter, 0.3, 0);
    const attack = Math.min(0.5, duration * 0.3);
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime(i % 2 === 0 ? -5 : 5, t); // gentle chorus warmth.
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.02, t + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    });
  }

  // Soft melodic bass: sub sine blended with an octave-up filtered triangle.
  private bass(freq: number, t: number): void {
    const dur = 0.26;
    const sub = this.ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(freq, t);
    const g1 = this.ctx.createGain();
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(0.12, t + 0.02);
    g1.gain.exponentialRampToValueAtTime(0.001, t + dur);
    sub.connect(g1);
    g1.connect(this.bed);
    sub.start(t);
    sub.stop(t + dur + 0.05);

    const body = this.ctx.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(freq * 2, t);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(0.09, t + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.001, t + dur);
    body.connect(filter);
    filter.connect(g2);
    g2.connect(this.bed);
    body.start(t);
    body.stop(t + dur + 0.05);
  }

  // Soft kick: pitched sine thump plus a tiny high noise click.
  private kick(t: number): void {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.32, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(this.bed);
    osc.start(t);
    osc.stop(t + 0.15);

    const click = this.ctx.createBufferSource();
    click.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 4000;
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0.05, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    click.connect(hp).connect(cg);
    cg.connect(this.bed);
    click.start(t, Math.random() * 0.5, 0.02);
  }

  // Same crack as before, softer and with a hint of reverb — space, not harshness.
  private snare(t: number, volume: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    src.connect(filter).connect(gain);
    this.panTo(gain, 0).connect(this.bed);
    this.send(gain, 0.15, 0);
    src.start(t, Math.random() * 0.5, 0.14);
    this.tone("triangle", 190, t, 0.07, volume * 0.5, 0);
  }

  // Plucky filtered arp climbing the chord tones.
  private arp(freq: number, t: number, volume: number): void {
    const dur = 0.18;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(filter).connect(gain);
    this.panTo(gain, 0.2).connect(this.bed);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  // Airy off-beat hat.
  private hat(t: number, volume: number, pan: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    src.connect(filter).connect(gain);
    this.panTo(gain, pan).connect(this.bed);
    src.start(t, Math.random() * 0.5, 0.05);
  }

  // The lead: triangle + glassy octave-up sine, gentle vibrato LFO, sent into
  // the tempo-locked delay and the reverb. The delay tail fills the low body,
  // so there is no octave-down voice anymore.
  private motif(freq: number, t: number, volume: number): void {
    const dur = 0.32;
    const out = this.ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(volume, t + 0.01);
    out.gain.exponentialRampToValueAtTime(0.001, t + dur);
    this.panTo(out, 0.1).connect(this.bed);
    this.send(out, 0.25, 0.3);

    // ±5 cent vibrato shared by both oscillators.
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(5.5, t);
    const lfoAmt = this.ctx.createGain();
    lfoAmt.gain.value = 5;
    lfo.connect(lfoAmt);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);

    const main = this.ctx.createOscillator();
    main.type = "triangle";
    main.frequency.setValueAtTime(freq, t);
    lfoAmt.connect(main.detune);
    main.connect(out);
    main.start(t);
    main.stop(t + dur + 0.05);

    const top = this.ctx.createOscillator();
    top.type = "sine";
    top.frequency.setValueAtTime(freq * 2, t);
    lfoAmt.connect(top.detune);
    const topGain = this.ctx.createGain();
    topGain.gain.value = 0.4; // glassy top, quietly.
    top.connect(topGain).connect(out);
    top.start(t);
    top.stop(t + dur + 0.05);
  }

  // High combo sparkle, panned ping-pong and fed to the delay.
  private sparkle(freq: number, t: number, pan: number): void {
    const dur = 0.2;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    this.panTo(gain, pan).connect(this.bed);
    this.send(gain, 0, 0.2);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }
}
