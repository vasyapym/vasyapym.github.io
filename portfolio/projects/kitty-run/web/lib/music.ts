// The adaptive soundtrack: a procedural chiptune that plays the run with
// you. No audio files — a Web Audio lookahead scheduler sequences a
// four-chord loop (C – Am – F – G, all pentatonic-safe so it never fights
// the pickup chimes), and the run itself conducts:
//
//   - tempo rises with world.speed (96 → 132 bpm),
//   - the bass walks the root the whole time (never gated),
//   - the arp, hi-hats, kick and kitty motif fade in and out via smoothed
//     layer levels — each layer eases toward 0/1 by the same intensity
//     thresholds it used to hard-gate on, so nothing pops: a layer takes
//     roughly a second to bloom in instead of snapping,
//   - a soft kick lands on the downbeats once the run is underway,
//   - combo ≥ 8 adds a high sparkle line,
//   - the kitty motif — a fixed C-pentatonic lead, the game's emotional
//     signature — sings once per 4-bar loop when the run is at full tilt,
//     a detuned triangle twin (+6 cents) giving it a gentle chorus beat,
//   - a subtle stereo field spreads the bed: hats sit left, the arp and
//     motif lean right, the sparkle ping-pongs, bass and kick stay centred
//     (gracefully mono on browsers without StereoPannerNode),
//   - taking a hit — or hitting a milestone — ducks the whole bed for a
//     beat via duck(),
//   - pause, game-over or mute fade the bed to silence and park the
//     sequencer so it resumes cleanly.
//
// update() is called once per frame from the game loop with the live
// world; everything else is plain Web Audio. The scheduler never looks
// more than LOOKAHEAD ahead, so tempo changes land on the very next step.

type WorldLike = {
  status: "ready" | "running" | "paused" | "over";
  speed: number;
  combo: number;
};

type OscType = "sine" | "square" | "triangle" | "sawtooth";

const LOOKAHEAD = 0.14;
const STEPS_PER_BAR = 16;
const LOOP_STEPS = STEPS_PER_BAR * 4; // 64: one four-bar chord cycle.

// One entry per chord: the bass root and the tones the arp climbs.
// Frequencies in Hz, chosen to sit under the Sfx pickup chimes.
const CHORDS: { root: number; tones: number[] }[] = [
  { root: 130.81, tones: [261.63, 329.63, 392.0, 523.25] }, // C
  { root: 110.0, tones: [261.63, 329.63, 440.0, 523.25] }, // Am
  { root: 87.31, tones: [261.63, 349.23, 440.0, 523.25] }, // F
  { root: 98.0, tones: [246.94, 293.66, 392.0, 493.88] }, // G
];

// The kitty motif: a fixed C-pentatonic lead keyed to loop steps (16th
// resolution over the 64-step loop). Pentatonic-safe against every chord,
// so it floats free of the harmony. Steps not listed (e.g. 44) rest.
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
  private noiseBuffer: AudioBuffer;
  private step = 0;
  private nextTime = 0;
  private level = 0;
  private lastFrame = 0;
  private duckUntil = 0;

  // Smoothed per-layer levels (0 → 1). Each eases toward a 0/1 target set
  // by intensity thresholds, so gated layers crossfade instead of popping.
  private kickLvl = 0;
  private arpLvl = 0;
  private hatLvl = 0;
  private motifLvl = 0;

  // Whether this AudioContext can pan; older Safari lacks createStereoPanner.
  private canPan: boolean;

  // Ping-pong toggle for the sparkle's alternating pan (no per-frame alloc).
  private sparkleSide = 1;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.bed = ctx.createGain();
    this.bed.gain.value = 0;
    this.bed.connect(destination);
    this.canPan = typeof ctx.createStereoPanner === "function";
    // One second of white noise, reused by every hi-hat.
    const frames = Math.floor(ctx.sampleRate);
    this.noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
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

    // Ease each gated layer toward on/off by the same thresholds the old
    // hard gates used — roughly a one-second crossfade at 4·dt.
    const ease = Math.min(1, 4 * dt);
    this.kickLvl += ((intensity > 0.3 ? 1 : 0) - this.kickLvl) * ease;
    this.arpLvl += ((intensity > 0.35 ? 1 : 0) - this.arpLvl) * ease;
    this.hatLvl += ((intensity > 0.45 ? 1 : 0) - this.hatLvl) * ease;
    this.motifLvl += ((intensity > 0.55 ? 1 : 0) - this.motifLvl) * ease;

    let target = 0;
    if (!muted) {
      if (world.status === "running") target = 0.55 + 0.45 * intensity;
      else if (world.status === "ready") target = 0.4;
    }
    if (now < this.duckUntil) target *= 0.25;
    this.level += (target - this.level) * Math.min(1, 3.2 * dt);
    this.bed.gain.setTargetAtTime(this.level * 0.5, now, 0.06);

    // Park the sequencer while silenced so it resumes cleanly on the next step.
    if (muted || world.status === "paused" || world.status === "over") {
      this.nextTime = Math.max(this.nextTime, now + 0.06);
      return;
    }
    while (this.nextTime < now + LOOKAHEAD) {
      this.scheduleStep(this.step, this.nextTime, intensity, speedNorm, world.combo);
      const bpm = 96 + 36 * speedNorm;
      this.nextTime += 60 / bpm / 4;
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
  ): void {
    const inBar = step % STEPS_PER_BAR;
    const chord = CHORDS[Math.floor(step / STEPS_PER_BAR) % CHORDS.length];

    // Bass: the root on every eighth, the run's heartbeat — never gated.
    if (inBar % 2 === 0) {
      this.tone("square", chord.root, t, 0.16, 0.1 + 0.06 * intensity, 0);
    }

    // Kick: a soft sine drop on the downbeats, faded in with the run.
    if (this.kickLvl > 0.02 && (inBar === 0 || inBar === 8)) {
      this.tone("sine", 120, t, 0.12, 0.22 * this.kickLvl, 0, 48);
    }

    // Arp: eighth-note climbs through the chord, brighter with speed,
    // leaning gently right.
    if (this.arpLvl > 0.02 && inBar % 2 === 0) {
      const note = chord.tones[Math.floor(step / 2) % chord.tones.length];
      this.tone("triangle", note, t, 0.14, (0.05 + 0.05 * speedNorm) * this.arpLvl, 0.2);
    }

    // Hi-hats: offbeat eighths, sitting left, only once the run is moving.
    if (this.hatLvl > 0.02 && (inBar === 2 || inBar === 6 || inBar === 10 || inBar === 14)) {
      this.hat(t, (0.03 + 0.03 * intensity) * this.hatLvl, -0.25);
    }

    // Sparkle: combo ≥ 8 adds a high ping on each bar's third beat,
    // ping-ponging across the field.
    if (combo >= 8 && inBar === 4) {
      const pan = 0.4 * this.sparkleSide;
      this.sparkleSide = -this.sparkleSide;
      this.tone("sine", chord.tones[3] * 2, t, 0.2, 0.05, pan);
    }

    // The kitty motif: the emotional signature, sung once per 4-bar loop
    // when the run is at full tilt. A detuned twin gives it a soft chorus.
    if (this.motifLvl > 0.02) {
      for (let i = 0; i < MOTIF.length; i += 1) {
        if (MOTIF[i].step === step) {
          this.motif(MOTIF[i].freq, t, 0.055 * this.motifLvl);
          break;
        }
      }
    }
  }

  // Chains a StereoPannerNode when the platform supports it; otherwise
  // returns the node unchanged so the graph still connects (mono fallback).
  private panTo(node: AudioNode, pan: number): AudioNode {
    if (!this.canPan || pan === 0) return node;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;
    node.connect(panner);
    return panner;
  }

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

  // The motif voice: a soft triangle plus a +6-cent detuned twin at equal
  // loudness — the beating between them is the whole point — leaning right.
  private motif(freq: number, t: number, volume: number): void {
    const duration = 0.28;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    this.panTo(gain, 0.15).connect(this.bed);
    for (let i = 0; i < 2; i += 1) {
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime(i === 0 ? 0 : 6, t);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + duration + 0.03);
    }
  }

  private hat(t: number, volume: number, pan: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6500;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(filter).connect(gain);
    this.panTo(gain, pan).connect(this.bed);
    src.start(t, Math.random() * 0.5, 0.06);
  }
}
