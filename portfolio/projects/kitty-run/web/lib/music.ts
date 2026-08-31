// The adaptive soundtrack: a procedural chiptune that plays the run with
// you. No audio files — a Web Audio lookahead scheduler sequences a
// four-chord loop (C – Am – F – G, all pentatonic-safe so it never fights
// the pickup chimes), and the run itself conducts:
//
//   - tempo rises with world.speed (96 → 132 bpm),
//   - the bass walks the root the whole time,
//   - the arp and hi-hats only join as speed and combo build,
//   - a soft kick lands on the downbeats once the run is underway,
//   - combo ≥ 8 adds a high sparkle line,
//   - taking a hit ducks the whole bed for a beat,
//   - pause, game-over or mute fade the bed to silence.
//
// update() is called once per frame from the game loop with the live
// world; everything else is plain Web Audio. The scheduler never looks
// more than LOOKAHEAD ahead, so tempo changes land on the very next step.

type WorldLike = {
  status: "ready" | "running" | "paused" | "over";
  speed: number;
  combo: number;
};

const LOOKAHEAD = 0.14;
const STEPS_PER_BAR = 16;

// One entry per chord: the bass root and the tones the arp climbs.
// Frequencies in Hz, chosen to sit under the Sfx pickup chimes.
const CHORDS: { root: number; tones: number[] }[] = [
  { root: 130.81, tones: [261.63, 329.63, 392.0, 523.25] }, // C
  { root: 110.0, tones: [261.63, 329.63, 440.0, 523.25] }, // Am
  { root: 87.31, tones: [261.63, 349.23, 440.0, 523.25] }, // F
  { root: 98.0, tones: [246.94, 293.66, 392.0, 493.88] }, // G
];

export class Soundtrack {
  private ctx: AudioContext;
  private bed: GainNode;
  private noiseBuffer: AudioBuffer;
  // Sequencer state: which 16th of the four-bar loop is next, and the
  // wall-clock time it should sound at.
  private step = 0;
  private nextTime = 0;
  // Smoothed loudness (0..1) eased toward the target every frame.
  private level = 0;
  private lastFrame = 0;
  private duckUntil = 0;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.bed = ctx.createGain();
    this.bed.gain.value = 0;
    this.bed.connect(destination);

    // One second of white noise, reused by every hi-hat.
    const frames = Math.floor(ctx.sampleRate);
    this.noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;

    this.nextTime = ctx.currentTime + 0.1;
    this.lastFrame = ctx.currentTime;
  }

  // Called once per rendered frame. Computes what the music should be
  // doing, eases the bed toward it, then schedules any notes that fall
  // inside the lookahead window.
  update(world: WorldLike, muted: boolean): void {
    const now = this.ctx.currentTime;
    const dt = Math.min(0.1, Math.max(0, now - this.lastFrame));
    this.lastFrame = now;

    const speedNorm = Math.min(1, Math.max(0, (world.speed - 7) / 7));
    const comboNorm = Math.min(1, world.combo / 12);
    const intensity =
      world.status === "running" ? 0.25 + 0.45 * speedNorm + 0.3 * comboNorm : 0.18;

    // Target loudness per state: the ready screen gets a quiet vamp so
    // the page feels alive before the first input; pause and game-over
    // hand the room back to silence.
    let target = 0;
    if (!muted) {
      if (world.status === "running") target = 0.55 + 0.45 * intensity;
      else if (world.status === "ready") target = 0.4;
    }
    if (now < this.duckUntil) target *= 0.25;

    this.level += (target - this.level) * Math.min(1, 3.2 * dt);
    this.bed.gain.setTargetAtTime(this.level * 0.5, now, 0.06);

    if (muted || world.status === "paused" || world.status === "over") {
      // Keep the sequencer parked just ahead of "now" so resuming never
      // dumps a backlog of stale steps at once.
      this.nextTime = Math.max(this.nextTime, now + 0.06);
      return;
    }

    while (this.nextTime < now + LOOKAHEAD) {
      this.scheduleStep(this.step, this.nextTime, intensity, speedNorm, world.combo);
      const bpm = 96 + 36 * speedNorm;
      this.nextTime += 60 / bpm / 4;
      this.step = (this.step + 1) % (STEPS_PER_BAR * 4);
    }
  }

  // A hit ducks the whole bed: the music flinches with the camera shake.
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

    // Bass: the root on every eighth, the run's heartbeat.
    if (inBar % 2 === 0) {
      this.tone("square", chord.root, t, 0.16, 0.1 + 0.06 * intensity);
    }

    // Kick: a soft sine drop on the downbeats once the run is moving.
    if (intensity > 0.3 && (inBar === 0 || inBar === 8)) {
      this.tone("sine", 120, t, 0.12, 0.22, 48);
    }

    // Arp: eighth-note climbs through the chord, brighter with speed.
    if (intensity > 0.35 && inBar % 2 === 0) {
      const note = chord.tones[Math.floor(step / 2) % chord.tones.length];
      this.tone("triangle", note, t, 0.14, 0.05 + 0.05 * speedNorm);
    }

    // Hi-hats: offbeat eighths, only when the run is properly moving.
    if (intensity > 0.45 && (inBar === 2 || inBar === 6 || inBar === 10 || inBar === 14)) {
      this.hat(t, 0.03 + 0.03 * intensity);
    }

    // Sparkle: combo ≥ 8 adds a high ping on each bar's third beat.
    if (combo >= 8 && inBar === 4) {
      this.tone("sine", chord.tones[3] * 2, t, 0.2, 0.05);
    }
  }

  private tone(
    type: OscillatorType,
    from: number,
    t: number,
    duration: number,
    volume: number,
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
    osc.connect(gain).connect(this.bed);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  private hat(t: number, volume: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6500;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(filter).connect(gain).connect(this.bed);
    src.start(t, Math.random() * 0.5, 0.06);
  }
}
