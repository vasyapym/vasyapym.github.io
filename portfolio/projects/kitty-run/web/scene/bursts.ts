// Particle burst recipes: the GameLoop calls these when game events fire;
// the Particles component only steps and draws whatever lands in the pool.

import type { Particle, WorldState } from "./world.ts";

export type Rgb = [number, number, number];

export function hexRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function emit(world: WorldState, p: Partial<Particle> & { x: number; y: number }): void {
  const slot = world.particles.acquire();
  if (!slot) return;
  const particle = slot.data;
  particle.x = p.x;
  particle.y = p.y;
  particle.vx = p.vx ?? 0;
  particle.vy = p.vy ?? 0;
  particle.life = p.life ?? 0.6;
  particle.maxLife = particle.life;
  particle.size = p.size ?? 0.5;
  particle.r = p.r ?? 1;
  particle.g = p.g ?? 1;
  particle.b = p.b ?? 1;
  particle.drag = p.drag ?? 1.5;
  particle.gravity = p.gravity ?? 2.5;
}

function randomDir(speed: number): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  return [Math.cos(angle) * speed, Math.sin(angle) * speed];
}

export function dustPuff(world: WorldState, x: number, y: number, count: number): void {
  const cream = hexRgb("#fff3f8");
  for (let i = 0; i < count; i += 1) {
    emit(world, {
      x: x + (Math.random() - 0.5) * 0.5,
      y: y + Math.random() * 0.12,
      vx: (Math.random() - 0.5) * 2.2 - 1,
      vy: 0.6 + Math.random() * 1.4,
      life: 0.4 + Math.random() * 0.3,
      size: 0.5 + Math.random() * 0.5,
      r: cream[0],
      g: cream[1],
      b: cream[2],
      gravity: 1.2,
      drag: 2.5,
    });
  }
}

export function sparkBurst(
  world: WorldState,
  x: number,
  y: number,
  count: number,
  color: Rgb,
  speed = 3.4,
): void {
  for (let i = 0; i < count; i += 1) {
    const [vx, vy] = randomDir(speed * (0.5 + Math.random() * 0.7));
    emit(world, {
      x,
      y,
      vx,
      vy,
      life: 0.45 + Math.random() * 0.35,
      size: 0.4 + Math.random() * 0.45,
      r: color[0],
      g: color[1],
      b: color[2],
      gravity: 1.8,
      drag: 2,
    });
  }
}

export function dashTrail(world: WorldState, x: number, y: number): void {
  const pink = hexRgb("#ffb3c4");
  emit(world, {
    x: x + 0.3 + Math.random() * 0.4,
    y: y + (Math.random() - 0.5) * 0.7,
    vx: -2 - Math.random() * 2,
    vy: (Math.random() - 0.5) * 0.6,
    life: 0.3 + Math.random() * 0.2,
    size: 0.45 + Math.random() * 0.4,
    r: pink[0],
    g: pink[1],
    b: pink[2],
    gravity: 0,
    drag: 3,
  });
}

// Bullet-time speed lines: pale streaks tearing backward past the cat
// while the world crawls. Low drag and high velocity make the round
// particles read as motion lines at 60 fps.
export function speedLine(world: WorldState, y: number): void {
  const pale = hexRgb("#ffe9f0");
  emit(world, {
    x: 1.5 + Math.random() * 7,
    y,
    vx: -13 - Math.random() * 9,
    vy: 0,
    life: 0.26 + Math.random() * 0.16,
    size: 0.26 + Math.random() * 0.34,
    r: pale[0],
    g: pale[1],
    b: pale[2],
    gravity: 0,
    drag: 0.6,
  });
}
