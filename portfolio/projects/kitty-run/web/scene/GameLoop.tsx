// One useFrame to rule the run: step the world, then react to its events —
// sound, particle bursts, score floaters, HUD writes. React state only
// hears about status changes, which happen once per screen.

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { COMBO_WINDOW, writeBestScore } from "../lib/score.ts";
import type { Sfx } from "../lib/audio.ts";
import { hexRgb, dashTrail, dustPuff, sparkBurst, type Rgb } from "./bursts.ts";
import { stepWorld } from "./step.ts";
import type { GameStatus, WorldState } from "./world.ts";

export type HudRefs = {
  score: React.RefObject<HTMLSpanElement | null>;
  hearts: React.RefObject<HTMLDivElement | null>;
  combo: React.RefObject<HTMLSpanElement | null>;
  comboBar: React.RefObject<HTMLDivElement | null>;
  debug?: React.RefObject<HTMLSpanElement | null>;
};

const DASH_TAIL_TIME = 0.12;

const HEART_RGB = hexRgb("#ff5f7e");
const STAR_RGB = hexRgb("#ffd44d");
const HEAL_RGB = hexRgb("#ff8fb3");
const HIT_RGB = hexRgb("#ffd44d");

function emitFloater(
  world: WorldState,
  x: number,
  y: number,
  kind: "score" | "heal" | "hurt",
  amount: number,
): void {
  const slot = world.floaters.acquire();
  if (!slot) return;
  slot.data.x = x;
  slot.data.y = y + 0.55;
  slot.data.life = 0.9;
  slot.data.maxLife = 0.9;
  slot.data.amount = amount;
  slot.data.kind = kind;
}

function handleEvents(world: WorldState, sfx: Sfx | null, reducedMotion: boolean): void {
  for (const event of world.events) {
    const k = world.kitty;
    switch (event.type) {
      case "jump":
        sfx?.jump();
        dustPuff(world, 0, k.y, reducedMotion ? 3 : 6);
        break;
      case "doubleJump":
        sfx?.doubleJump();
        sparkBurst(world, 0, k.y + 0.4, reducedMotion ? 4 : 8, HEART_RGB, 2.2);
        break;
      case "land":
        sfx?.land();
        dustPuff(world, 0, k.y, reducedMotion ? 2 : 5);
        break;
      case "dash":
        sfx?.dash();
        break;
      case "hit":
        sfx?.hit();
        sparkBurst(world, 0, k.y + 0.8, reducedMotion ? 6 : 14, HIT_RGB, 4.2);
        emitFloater(world, 0, k.y + 0.8, "hurt", 1);
        break;
      case "pickup": {
        const color: Rgb =
          event.pickup === "star" ? STAR_RGB : event.pickup === "heal" ? HEAL_RGB : HEART_RGB;
        sfx?.pickup(event.pickup === "heal" ? 0 : event.combo);
        if (event.pickup === "heal") sfx?.heal();
        sparkBurst(world, 0, k.y + 0.9, reducedMotion ? 5 : 10, color, 3);
        if (event.pickup === "heal") {
          emitFloater(world, 0, k.y + 0.9, "heal", 1);
        } else {
          emitFloater(world, 0, k.y + 0.9, "score", event.score);
        }
        break;
      }
      case "gameover":
        sfx?.gameover();
        writeBestScore(window.localStorage, world.best);
        break;
    }
  }
  world.events.length = 0;
}

function writeHud(world: WorldState, hud: HudRefs): void {
  if (hud.score.current) {
    hud.score.current.textContent = String(world.score);
  }
  if (hud.hearts.current) {
    const children = hud.hearts.current.children;
    for (let i = 0; i < children.length; i += 1) {
      children[i].classList.toggle("is-empty", i >= world.hearts);
      children[i].classList.toggle("is-hurt", world.hearts === i + 1 && world.kitty.invulnT > 0.9);
    }
  }
  if (hud.combo.current) {
    const multiplier = world.combo >= 4 ? 1 + Math.min(7, Math.floor(world.combo / 4)) : 0;
    hud.combo.current.textContent = multiplier > 0 ? `×${multiplier}` : "";
    hud.combo.current.classList.toggle("is-live", multiplier > 0);
  }
  if (hud.comboBar.current) {
    const fraction = world.combo > 0 ? Math.max(0, world.comboTimer / COMBO_WINDOW) : 0;
    hud.comboBar.current.style.transform = `scaleX(${fraction})`;
  }
  if (hud.debug?.current) {
    hud.debug.current.textContent = `${world.status} · ${world.distance.toFixed(0)}m · obs ${world.obstacles.slots.filter((s) => s.active).length}`;
  }
}

export function GameLoop({
  world,
  sfxRef,
  muted,
  hud,
  reducedMotion,
  onStatus,
}: {
  world: WorldState;
  sfxRef: React.RefObject<Sfx | null>;
  muted: boolean;
  hud: HudRefs;
  reducedMotion: boolean;
  onStatus: (status: GameStatus) => void;
}) {
  const prevStatus = useRef<GameStatus>(world.status);
  const dustTimer = useRef(0);

  useEffect(() => {
    onStatus(world.status);
  }, [onStatus, world]);

  useFrame((_, delta) => {
    stepWorld(world, delta);

    // Dash trail runs every frame while dashing, not as a one-off event.
    if (world.kitty.dashT > 0 && !reducedMotion) {
      dashTrail(world, 0, world.kitty.y + 0.75);
      if (world.kitty.dashT > DASH_TAIL_TIME) dashTrail(world, 0, world.kitty.y + 0.4);
    }

    // A soft trot of dust while grounded keeps the run feeling weighted.
    dustTimer.current -= delta;
    if (
      !reducedMotion &&
      world.status === "running" &&
      world.kitty.grounded &&
      dustTimer.current <= 0
    ) {
      dustTimer.current = 0.14;
      dustPuff(world, 0, world.kitty.y, 1);
    }

    handleEvents(world, muted ? null : sfxRef.current, reducedMotion);
    writeHud(world, hud);

    if (prevStatus.current !== world.status) {
      prevStatus.current = world.status;
      onStatus(world.status);
    }
  });

  return null;
}
