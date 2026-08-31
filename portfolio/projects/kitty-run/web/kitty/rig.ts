// Pure pose math for the procedural cat hero "Vesper". Consumes the flat motion
// fields from the world and produces every transform the visual component
// applies. No three.js, no React — the node checks could pin this if needed.

export type KittyMotionInput = {
  runPhase: number;
  grounded: boolean;
  vy: number;
  squash: number;
  blinkShut: number;
  dashT: number;
  happyT: number;
  invulnT: number;
  now: number;
};

export type KittyPose = {
  bobY: number;
  tilt: number;
  scaleX: number;
  scaleY: number;
  headRot: number;
  headBobY: number;
  earL: number;
  earR: number;
  tailSwing: number;
  capeSway: number;
  capeFlare: number;
  capeLift: number;
  capeBounce: number;
  grinScale: number;
  eyeScaleY: number;
  armSwing: number;
  visible: boolean;
};

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

export function computePose(m: KittyMotionInput): KittyPose {
  const run = Math.sin(m.runPhase);
  const bobY = m.grounded ? Math.abs(Math.cos(m.runPhase)) * 0.075 : 0.015;

  // Air stretch from velocity, landing squash from the spring.
  const riseStretch = clamp(m.vy * 0.011, -0.14, 0.2);
  const scaleY = 1 + riseStretch - m.squash * 0.3;
  const scaleX = 1 - (scaleY - 1) * 0.85;

  const dashTilt = m.dashT > 0 ? 0.17 : 0;
  const tilt = clamp(-m.vy * 0.011, -0.18, 0.24) + dashTilt;

  const headRot = Math.sin(m.runPhase * 2) * 0.026 + tilt * 0.45;
  const headBobY = m.grounded ? Math.sin(m.runPhase * 2) * 0.018 : 0;

  // Tall upright ears: pin back on the dash streak, perk up while rising
  // (reads as an "ears up!" on the double jump).
  const earBase = m.dashT > 0 ? -0.28 : clamp(-m.vy * 0.018, -0.24, 0.32);
  const earFlap = m.grounded
    ? Math.sin(m.runPhase - 0.8) * 0.085
    : Math.sin(m.now * 9) * 0.05;

  // Mint wisp tail: strides with the run, lifts back on the dash, leans with
  // tilt.
  const tailSwing =
    (m.grounded
      ? Math.sin(m.runPhase + 0.3) * 0.22
      : Math.sin(m.now * 6) * 0.12) +
    (m.dashT > 0 ? -0.45 : 0) +
    tilt * 0.3;

  // Signature bat-capelet. sway = counter-rotate the collar (as the old scarf
  // did); lift = how flat the forked tails stream during the dash; bounce =
  // per-stride flutter; flare = puff on heal flourish and landing squash.
  const capeSway =
    -headRot * 1.2 +
    (m.grounded
      ? Math.sin(m.runPhase * 2 + 0.6) * 0.08
      : clamp(-m.vy * 0.02, -0.22, 0.22));
  const capeFlare = 1 + m.happyT * 0.4 + Math.max(0, m.squash) * 0.15;
  const capeLift = clamp(m.dashT * 1.3, 0, 1);
  const capeBounce = m.grounded
    ? Math.sin(m.runPhase * 2 - 0.4) * 0.12
    : Math.sin(m.now * 7) * 0.08;

  const grinScale = 1 + m.happyT * 0.6;
  const eyeScaleY = m.blinkShut > 0 ? 0.08 : 1 + m.happyT * 0.3;

  const armSwing = m.grounded ? -run * 0.5 : -0.55;

  // Invulnerability reads as a gentle blink, not a strobe: mostly on, with
  // short dips. A fast full-invisible flicker made her look like a ghost.
  const visible = m.invulnT <= 0 || Math.sin(m.now * 11) > -0.6;

  return {
    bobY,
    tilt,
    scaleX,
    scaleY,
    headRot,
    headBobY,
    earL: earBase + earFlap,
    earR: earBase + earFlap * 0.8,
    tailSwing,
    capeSway,
    capeFlare,
    capeLift,
    capeBounce,
    grinScale,
    eyeScaleY,
    armSwing,
    visible,
  };
}
