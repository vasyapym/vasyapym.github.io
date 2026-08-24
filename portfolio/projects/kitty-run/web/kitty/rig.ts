// Pure pose math for the procedural Kitty. Consumes the flat motion fields
// from the world and produces every transform the visual component applies.
// No three.js, no React — the node checks could pin this if needed.

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
  bowRot: number;
  bowScale: number;
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

  const earBase = m.dashT > 0 ? -0.34 : clamp(-m.vy * 0.018, -0.26, 0.3);
  const earFlap = m.grounded
    ? Math.sin(m.runPhase - 0.8) * 0.085
    : Math.sin(m.now * 9) * 0.05;

  const bowRot =
    -headRot * 1.5 +
    (m.grounded
      ? Math.sin(m.runPhase * 2 + 0.6) * 0.07
      : clamp(-m.vy * 0.02, -0.24, 0.24));
  const bowScale = 1 + m.happyT * 0.5 + Math.max(0, m.squash) * 0.18;

  const eyeScaleY = m.blinkShut > 0 ? 0.08 : 1 + m.happyT * 0.3;

  const armSwing = m.grounded ? -run * 0.5 : -0.55;

  const visible = m.invulnT <= 0 || Math.sin(m.now * 28) > -0.2;

  return {
    bobY,
    tilt,
    scaleX,
    scaleY,
    headRot,
    headBobY,
    earL: earBase + earFlap,
    earR: earBase + earFlap * 0.8,
    bowRot,
    bowScale,
    eyeScaleY,
    armSwing,
    visible,
  };
}
