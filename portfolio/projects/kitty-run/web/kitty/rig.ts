// Pure pose math for the procedural cat hero "Nix". Consumes the flat motion
// fields from the world and produces every transform the visual component
// applies. No three.js, no React, no DOM — safe under the node checks.
//
// Contract preserved: every output is a y-translation, a z-rotation, or a
// (near-uniform) scale, so Echo.tsx's painter-order pinning stays valid.

export type KittyMotionInput = {
  runPhase: number;
  grounded: boolean;
  vy: number;
  squash: number;
  blinkShut: number;
  dashT: number;
  happyT: number;
  invulnT: number;
  // Set to 0.4 on a near-miss (step.ts), decayed to 0. Drives the pop.
  nearMissT: number;
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
  // 0 = soft closed smile, 1 = open smile (the single fang shows).
  mouthOpen: number;
  eyeScaleY: number;
  armSwing: number;
  visible: boolean;
};

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

export function computePose(m: KittyMotionInput): KittyPose {
  const run = Math.sin(m.runPhase);

  // Near-miss envelope: a snappy pop that eases out. Squaring the normalised
  // timer gives a sharp attack and a quick settle so the reaction reads as a
  // startle, not a wobble.
  const nm = clamp(m.nearMissT / 0.4, 0, 1);
  const nmPop = nm * nm;

  const bobY = m.grounded ? Math.abs(Math.cos(m.runPhase)) * 0.075 : 0.015;

  // Air stretch from velocity, landing squash from the spring.
  const riseStretch = clamp(m.vy * 0.011, -0.14, 0.2);
  const scaleY = 1 + riseStretch - m.squash * 0.3;
  const scaleX = 1 - (scaleY - 1) * 0.85;

  const dashTilt = m.dashT > 0 ? 0.17 : 0;
  // Near-miss: a tiny recoil lean away from the hazard she just skinned past.
  const tilt = clamp(-m.vy * 0.011, -0.18, 0.24) + dashTilt - nmPop * 0.06;

  // Head turns a hair toward the hazard on a near-miss, then settles.
  const headRot = Math.sin(m.runPhase * 2) * 0.026 + tilt * 0.45 + nmPop * 0.14;
  const headBobY = m.grounded ? Math.sin(m.runPhase * 2) * 0.018 : 0;

  // Tall ears (mint inner): pinned on the dash streak, perk while rising
  // ("ears up!" on the double jump), and PRICK sharply on a near-miss.
  const earBase =
    (m.dashT > 0 ? -0.28 : clamp(-m.vy * 0.018, -0.24, 0.32)) + nmPop * 0.42;
  const earFlap = m.grounded
    ? Math.sin(m.runPhase - 0.8) * 0.085
    : Math.sin(m.now * 9) * 0.05;

  // Mint wisp tail: strides on the ground, streams back on the dash, flicks
  // on a near-miss.
  const tailSwing =
    (m.grounded
      ? Math.sin(m.runPhase + 0.3) * 0.22
      : Math.sin(m.now * 6) * 0.12) +
    (m.dashT > 0 ? -0.45 : 0) +
    tilt * 0.3 +
    nmPop * 0.5;

  // Wisp-hood capelet (replaces the old bat-capelet, same rig fields). sway =
  // counter-rotate the hood; lift = how flat the forked tails stream on dash;
  // bounce = per-stride flutter; flare = puff on happy, landing and near-miss.
  const capeSway =
    -headRot * 1.2 +
    (m.grounded
      ? Math.sin(m.runPhase * 2 + 0.6) * 0.08
      : clamp(-m.vy * 0.02, -0.22, 0.22));
  const capeFlare =
    1 + m.happyT * 0.4 + Math.max(0, m.squash) * 0.15 + nmPop * 0.15;
  const capeLift = clamp(m.dashT * 1.3, 0, 1);
  const capeBounce = m.grounded
    ? Math.sin(m.runPhase * 2 - 0.4) * 0.12
    : Math.sin(m.now * 7) * 0.08;

  // Mouth: soft closed smile at rest; a happy beat widens it and the single
  // fang shows; a near-miss flashes a brief "!" open.
  const grinScale = 1 + m.happyT * 0.55;
  const mouthOpen = clamp(m.happyT * 1.6 + nmPop * 0.55, 0, 1);

  // Eyes: NEVER half-lidded at rest (attempt-2's fatal look is deleted). Blink
  // shuts them; a happy beat softens to a warm squint; a near-miss pops them
  // WIDE. Lids exist only as the blink and the squint.
  const eyeScaleY =
    m.blinkShut > 0
      ? 0.08
      : clamp(1 - m.happyT * 0.22 + nmPop * 0.5, 0.7, 1.6);

  const armSwing = m.grounded ? -run * 0.5 : -0.55;

  // Invulnerability reads as a gentle blink, not a strobe.
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
    mouthOpen,
    eyeScaleY,
    armSwing,
    visible,
  };
}
