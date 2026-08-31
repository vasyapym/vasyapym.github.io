// The adaptive soundtrack: a procedural chiptune that plays the run with
// you. No audio files — a Web Audio lookahead scheduler sequences an
// 8-bar A/B arrangement (verse → chorus over C – Am – F – G, all
// pentatonic-safe so it never fights the pickup chimes), and the run
// itself conducts:
//
//   - tempo rises with world.speed (96 → 132 bpm),
//   - the verse is sparse (bass + soft kick); the chorus is the full band
//     (detuned arp, four-on-the-floor kick, offbeat hats),
//   - a soft kick sidechain-pumps the whole bed,
//   - combo ≥ 8 adds a high sparkle line,
//   - the bullet-time dash closes a low-pass filter over the bed and
//     stretches the groove — the world audibly slows, then resurfaces,
//   - hearts === 1 darkens the mix into a low, tense variation,
//   - taking a hit ducks the whole bed for a beat,
//   - the ready screen gets a quiet vamp; pause/mute fade to silence;
//     game-over resolves onto a soft major tail.
//
// update() is called once per frame from the game loop with the live
// world; everything else is plain Web Audio. The scheduler never looks
// more than LOOKAHEAD ahead, so tempo/section changes land on the very
// next step, never mid-note.

type WorldLike = {
  status: "ready" | "running" | "paused" | "over";
  speed: number;
  combo: number;
  hearts: number;
  timeScale: number;
};

const LOOKAHEAD = 0.14;
const STEPS_PER_BAR = 16;
const BARS = 8;

// One entry per bar (within a 4-bar phrase): the bass root and the tones
// the arp climbs. Frequencies in Hz, chosen to sit under the Sfx chimes.
const CHORDS: { root: number; tones: number[] }[] = [
  { root: 130.81, tones: [261.63, 329.63, 392.0, 523.25] }, // C
  { root: 110.0, tones: [261.63, 329.63, 440.0, 523.25] }, // Am
  { root: 87.31, tones: [261.63, 349.23, 440.0, 523.25] }, // F
  { root: 98.0, tones: [246.94, 293.66, 392.0, 493.88] }, // G
];

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export class Soundtrack {
  private ctx: AudioContext;

  // Bed signal chain: notes → (pan buses →) bed → pump → lpf → dry → out
  //                                                        └→ reverb → out
  private bed: GainNode;
  private pump: GainNode;
  private lpf: BiquadFilterNode;
  private dry: GainNode;
  private reverbSend: GainNode;
  private reverb: ConvolverNode;
  private reverbReturn: GainNode;
  private panL: StereoPannerNode | null;
  private panR: StereoPannerNode | null;

  private noiseBuffer: AudioBuffer;

  // Sequencer state: which 16th of the 8-bar loop is next, and the
  // wall-clock time it should sound at.
  private step = 0;
  private nextTime = 0;

  // Smoothed loudness (0..1) eased toward the target every frame.
  private level = 0;
  private lastFrame = 0;
  private duckUntil = 0;

  // Smoothed clock for the bullet-time filter/tempo (1 = real time).
  private tsSmooth = 1;
  private prevStatus: WorldLike["status"] = "ready";

  // Per-frame snapshot read by scheduleStep so changes land on the next
  // step, never mid-note.
  private curStatus: WorldLike["status"] = "ready";
  private curHearts = 3;
  private curIntensity = 0.18;
  private curSpeedNorm = 0;
  private curCombo = 0;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;

    this.bed = ctx.createGain();
    this.bed.gain.value = 0;

    this.pump = ctx.createGain();
    this.pump.gain.value = 1;

    this.lpf = ctx.createBiquadFilter();
    this.lpf.type = "lowpass";
    this.lpf.frequency.value = 16000;
    this.lpf.Q.value = 0.7;

    this.dry = ctx.createGain();
    this.dry.gain.value = 0.9;

    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.14;
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(1.4, 3.2);
    this.reverbReturn = ctx.createGain();
    this.reverbReturn.gain.value = 0.9;

    // Wire the chain.
    this.bed.connect(this.pump);
    this.pump.connect(this.lpf);
    this.lpf.connect(this.dry).connect(destination);
    this.lpf.connect(this.reverbSend);
    this.reverbSend.connect(this.reverb);
    this.reverb.connect(this.reverbReturn).connect(destination);

    // Stereo width, feature-detected. Buses sum back into the (mono) bed
    // node, which still carries a stereo signal from the panners.
    if (typeof ctx.createStereoPanner === "function") {
      this.panL = ctx.createStereoPanner();
      this.panL.pan.value = -0.35;
      this.panL.connect(this.bed);
      this.panR = ctx.createStereoPanner();
      this.panR.pan.value = 0.35;
      this.panR.connect(this.bed);
    } else {
      this.panL = null;
      this.panR = null;
    }

    // One second of white noise, reused by every hi-hat.
    const frames = Math.floor(ctx.sampleRate);
    this.noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;

    this.nextTime = ctx.currentTime + 0.1;
    this.lastFrame = ctx.currentTime;
  }

  // A stereo, exponentially-decaying noise impulse for the reverb send.
  private makeImpulse(seconds: number, decay: number): AudioBuffer {
    const rate = this.ctx.sampleRate;
    const len = Math.max(1, Math.floor(rate * seconds));
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch += 1) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i += 1) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  // Called once per rendered frame. Computes what the music should be
  // doing, eases the bed toward it, sweeps the bullet-time filter, then
  // schedules any notes inside the lookahead window. Never throws.
  update(world: WorldLike, muted: boolean): void {
    try {
      const now = this.ctx.currentTime;
      const dt = Math.min(0.1, Math.max(0, now - this.lastFrame));
      this.lastFrame = now;

      const status = world.status;
      const hearts = world.hearts ?? 3;
      const timeScale = world.timeScale ?? 1;
      const speedNorm = clamp((world.speed - 7) / 7, 0, 1);
      const comboNorm = clamp(world.combo / 12, 0, 1);
      const intensity =
        status === "running" ? 0.25 + 0.45 * speedNorm + 0.3 * comboNorm : 0.18;

      this.curStatus = status;
      this.curHearts = hearts;
      this.curIntensity = intensity;
      this.curSpeedNorm = speedNorm;
      this.curCombo = world.combo;

      // Smooth the sim clock so the filter never clicks.
      this.tsSmooth += (timeScale - this.tsSmooth) * Math.min(1, 8 * dt);

      // Bullet-time low-pass: closes as the clock dips to 0.35, opens as
      // the world resurfaces. Ceiling brightens with speed, darkens in
      // danger.
      let ceiling = 2200 + 13800 * speedNorm;
      if (hearts <= 1 && status === "running") ceiling *= 0.55;
      const tsNorm = clamp((this.tsSmooth - 0.35) / 0.65, 0, 1);
      const cutoff = 380 + (ceiling - 380) * Math.pow(tsNorm, 1.4);
      this.lpf.frequency.setTargetAtTime(cutoff, now, 0.05);

      // Target loudness per state.
      let target = 0;
      if (!muted) {
        if (status === "running") target = 0.55 + 0.45 * intensity;
        else if (status === "ready") target = 0.4;
      }
      if (now < this.duckUntil) target *= 0.25;

      this.level += (target - this.level) * Math.min(1, 3.2 * dt);
      this.bed.gain.setTargetAtTime(this.level * 0.5, now, 0.06);

      // One-shot resolving tail when the run ends.
      if (status === "over" && this.prevStatus !== "over" && !muted) {
        this.resolveTail(now + 0.03);
      }
      this.prevStatus = status;

      if (muted || status === "paused" || status === "over") {
        // Park the sequencer just ahead of "now" so resuming never dumps
        // a backlog of stale steps at once.
        this.nextTime = Math.max(this.nextTime, now + 0.06);
        return;
      }

      while (this.nextTime < now + LOOKAHEAD) {
        this.scheduleStep(this.step, this.nextTime);
        const bpm = 96 + 36 * speedNorm;
        // Bullet time stretches the groove a touch alongside the filter.
        const stepDur = 60 / bpm / 4 / (0.7 + 0.3 * this.tsSmooth);
        this.nextTime += stepDur;
        this.step = (this.step + 1) % (STEPS_PER_BAR * BARS);
      }
    } catch {
      // Audio must never crash the render loop or the console-error probe.
    }
  }

  // A hit ducks the whole bed: the music flinches with the camera shake.
  duck(): void {
    this.duckUntil = this.ctx.currentTime + 0.45;
  }

  private getBus(pan: number): AudioNode {
    if (pan < 0) return this.panL ?? this.bed;
    if (pan > 0) return this.panR ?? this.bed;
    return this.bed;
  }

  private scheduleStep(step: number, t: number): void {
    const bar = Math.floor(step / STEPS_PER_BAR) % BARS;
    const inBar = step % STEPS_PER_BAR;
    const section = bar < 4 ? 0 : 1; // 0 = verse (sparse), 1 = chorus (full)
    const chord = CHORDS[bar % CHORDS.length];

    const running = this.curStatus === "running";
    const intensity = this.curIntensity;
    const speedNorm = this.curSpeedNorm;
    const combo = this.curCombo;
    const danger = this.curHearts <= 1 && running;

    // Ready-screen vamp: a calm sign of life before the first input.
    if (!running) {
      if (inBar === 0 || inBar === 8) {
        this.tone("triangle", chord.root, t, 0.4, 0.09);
      }
      if (inBar === 4 || inBar === 12) {
        this.tone(
          "sine",
          chord.tones[1],
          t,
          0.3,
          0.045,
          undefined,
          this.getBus(inBar === 4 ? -1 : 1),
        );
      }
      return;
    }

    // Bass: the root on every eighth, the run's heartbeat.
    if (inBar % 2 === 0) {
      const bassVol = 0.1 + 0.06 * intensity;
      this.tone("square", chord.root, t, 0.16, bassVol);
      // Chorus fills out with a sub octave.
      if (section === 1) {
        this.tone("sine", chord.root / 2, t, 0.18, bassVol * 0.6);
      }
      // Danger drone.
      if (danger && inBar === 0) {
        this.tone("sawtooth", chord.root / 2, t, 0.9, 0.06);
      }
    }

    // Kick + sidechain pump. Chorus goes four-on-the-floor.
    const kickHere =
      section === 1
        ? inBar === 0 || inBar === 4 || inBar === 8 || inBar === 12
        : inBar === 0 || inBar === 8;
    if (intensity > 0.3 && kickHere) {
      this.tone("sine", 120, t, 0.12, 0.22, 48);
      this.pump.gain.setValueAtTime(0.72, t);
      this.pump.gain.setTargetAtTime(1, t + 0.004, 0.09);
    }

    // Arp: chorus plays continuous eighths; verse only sparse accents.
    const arpHere =
      section === 1 ? inBar % 2 === 0 : intensity > 0.4 && inBar % 4 === 0;
    if (arpHere) {
      const idx = Math.floor(step / 2) % chord.tones.length;
      let note = chord.tones[idx];
      if (danger) note *= 0.5; // an octave down: darker, felt
      const bus = this.getBus(idx % 2 === 0 ? -1 : 1);
      const vol = 0.05 + 0.05 * speedNorm;
      if (section === 1) {
        // Detuned pair for width and richness.
        this.tone("triangle", note, t, 0.14, vol * 0.7, undefined, bus, 6);
        this.tone("triangle", note, t, 0.14, vol * 0.7, undefined, bus, -6);
      } else {
        this.tone("triangle", note, t, 0.14, vol, undefined, bus);
      }
    }

    // Hi-hats: chorus on every offbeat, verse sparse; muted in danger.
    const hatHere =
      section === 1 ? inBar % 2 === 1 : inBar === 2 || inBar === 10;
    if (intensity > 0.45 && !danger && hatHere) {
      this.hat(t, 0.03 + 0.03 * intensity, this.getBus(inBar % 4 === 1 ? -1 : 1));
    }

    // Sparkle: combo ≥ 8 adds a high ping on each bar's third beat.
    if (combo >= 8 && inBar === 4) {
      this.tone("sine", chord.tones[3] * 2, t, 0.2, 0.05, undefined, this.getBus(1));
    }
  }

  // A soft major resolution that fades with the bed when the run ends.
  private resolveTail(t: number): void {
    const notes = [130.81, 196.0, 261.63, 329.63]; // C major, spread
    for (let i = 0; i < notes.length; i += 1) {
      this.tone(
        i < 2 ? "sine" : "triangle",
        notes[i],
        t + i * 0.06,
        1.1,
        0.08,
        undefined,
        this.getBus(i % 2 === 0 ? -1 : 1),
      );
    }
  }

  private tone(
    type: OscillatorType,
    from: number,
    t: number,
    duration: number,
    volume: number,
    to?: number,
    bus?: AudioNode,
    detune?: number,
  ): void {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    if (to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + duration);
    }
    if (detune !== undefined) osc.detune.setValueAtTime(detune, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(bus ?? this.bed);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  private hat(t: number, volume: number, bus: AudioNode): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6500;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(filter).connect(gain).connect(bus);
    src.start(t, Math.random() * 0.5, 0.06);
  }
}
