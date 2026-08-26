// One useFrame to rule the run: step the world, then react to its events —
// sound, particle bursts, score floaters, HUD writes. React state only
// hears about status changes, which happen once per screen.

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { COMBO_WINDOW, writeBestScore } from "../lib/score.ts";
import { saveReplayIfBest, type RunInput } from "../lib/replay.ts";
import { TUNING } from "../lib/tuning.ts";
import { buzz } from "../lib/haptics.ts";
import type { Sfx } from "../lib/audio.ts";
import type { Soundtrack } from "../lib/music.ts";
import { clampInto, stageSpan } from "../lib/framing.ts";
import { hexRgb, dashTrail, dustPuff, sparkBurst, speedLine, type Rgb } from "./bursts.ts";
import { releaseJump, requestDash, requestJump } from "./actions.ts";
import { pilotSteer } from "../lib/pilot.ts";
import { stepWorld } from "./step.ts";
import type { GameStatus, WorldState } from "./world.ts";

export type HudRefs = {
  score: React.RefObject<HTMLSpanElement | null>;
  hearts: React.RefObject<HTMLDivElement | null>;
  combo: React.RefObject<HTMLSpanElement | null>;
  comboBar: React.RefObject<HTMLDivElement | null>;
  milestone: React.RefObject<HTMLDivElement | null>;
  // The touch dash pad: the loop paints its cooldown ring every frame.
  dash?: React.RefObject<HTMLButtonElement | null>;
  // Bullet-time vignette: opacity follows the clock's dip.
  bullet?: React.RefObject<HTMLDivElement | null>;
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
  kind: "score" | "heal" | "hurt" | "bonus",
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

function handleEvents(
  world: WorldState,
  sfx: Sfx | null,
  track: Soundtrack | null,
  reducedMotion: boolean,
  hud: HudRefs,
): void {
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
      case "milestone": {
        sfx?.milestone();
        if (!reducedMotion) buzz([14, 42, 14]);
        sparkBurst(world, 0, k.y + 1.3, reducedMotion ? 6 : 16, HEART_RGB, 4);
        sparkBurst(world, 0, k.y + 1.1, reducedMotion ? 4 : 10, STAR_RGB, 2.8);
        if (hud.milestone.current) {
          const node = hud.milestone.current;
          node.textContent = `${event.meters} m!`;
          const travel = (dy: number): Keyframe[] => [
            { opacity: 0, transform: `translate(-50%, ${dy}px) scale(0.7)` },
            { opacity: 1, transform: "translate(-50%, 0) scale(1)", offset: 0.18 },
            { opacity: 1, transform: "translate(-50%, 0) scale(1)", offset: 0.72 },
            { opacity: 0, transform: `translate(-50%, ${-dy}px) scale(1)` },
          ];
          // Reduced motion gets a plain cross-fade: no drift, no scale.
          const frames: Keyframe[] = reducedMotion
            ? [
                { opacity: 0 },
                { opacity: 1, offset: 0.2 },
                { opacity: 1, offset: 0.7 },
                { opacity: 0 },
              ]
            : travel(10);
          node.animate(frames, {
            duration: reducedMotion ? 900 : 1700,
            easing: "ease",
          });
        }
        break;
      }
      case "hit":
        sfx?.hit();
        track?.duck();
        if (!reducedMotion) buzz(70);
        sparkBurst(world, 0, k.y + 0.8, reducedMotion ? 6 : 14, HIT_RGB, 4.2);
        emitFloater(world, 0, k.y + 0.8, "hurt", 1);
        break;
      case "pickup": {
        const color: Rgb =
          event.pickup === "star" ? STAR_RGB : event.pickup === "heal" ? HEAL_RGB : HEART_RGB;
        sfx?.pickup(event.combo);
        if (event.healed) {
          sfx?.heal();
          if (!reducedMotion) buzz(16);
        }
        sparkBurst(world, 0, k.y + 0.9, reducedMotion ? 5 : 10, color, 3);
        if (event.healed) {
          emitFloater(world, 0, k.y + 0.9, "heal", 1);
        } else if (event.bonus > 0) {
          emitFloater(world, 0, k.y + 0.9, "bonus", event.bonus);
        } else {
          emitFloater(world, 0, k.y + 0.9, "score", event.score);
        }
        break;
      }
      case "gameover":
        sfx?.gameover();
        if (!reducedMotion) buzz([90, 50, 150]);
        // An autopilot exhibition never touches the visitor's records:
        // no best score, no echo replay — the bot's perfect run would
        // otherwise chase every human run forever.
        if (!world.autopilot) {
          writeBestScore(window.localStorage, world.best);
          // The finished run becomes (or fails to become) the echo future
          // runs will chase — seed plus timed inputs is the whole recipe.
          saveReplayIfBest(window.localStorage, {
            seed: world.runSeed,
            score: world.score,
            distance: world.distance,
            inputs: world.inputLog,
          });
        }
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
      children[i].classList.toggle("is-gain", world.heartPulseT > 0 && i + 1 === world.hearts);
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
  if (hud.dash?.current) {
    // --cd reads 1 (just dashed) → 0 (ready); the ring's filled arc is
    // drawn as 1 - cd, so it sweeps closed as the dash comes back.
    const button = hud.dash.current;
    const cd = Math.min(
      1,
      Math.max(0, world.kitty.dashCd / (TUNING.dashCooldown + TUNING.dashDuration)),
    );
    button.style.setProperty("--cd", cd.toFixed(3));
    button.classList.toggle("is-cooling", cd > 0);
  }
  if (hud.bullet?.current) {
    const depth = Math.max(0, Math.min(1, (1 - world.timeScale) * 1.15));
    hud.bullet.current.style.opacity = depth.toFixed(3);
  }
  if (hud.debug?.current) {
    hud.debug.current.textContent = `${world.status} · ${world.distance.toFixed(0)}m · obs ${world.obstacles.slots.filter((s) => s.active).length}`;
  }
}

export function GameLoop({
  world,
  echo,
  echoInputs,
  sfxRef,
  trackRef,
  muted,
  hud,
  reducedMotion,
  onStatus,
}: {
  world: WorldState;
  // The simulated best-run world and its recorded inputs. Both come from
  // storage; either may be absent (first visit, private mode, corrupt
  // data) — the run then simply has no echo.
  echo?: WorldState | null;
  echoInputs?: RunInput[];
  sfxRef: React.RefObject<Sfx | null>;
  // The adaptive soundtrack, when its AudioContext exists (first gesture
  // onward). The loop conducts it once per frame.
  trackRef?: React.RefObject<Soundtrack | null>;
  muted: boolean;
  hud: HudRefs;
  reducedMotion: boolean;
  onStatus: (status: GameStatus) => void;
}) {
  const prevStatus = useRef<GameStatus>(world.status);
  const dustTimer = useRef(0);
  const feedCursor = useRef(0);
  const prevEchoStatus = useRef<GameStatus>("running");
  // The launch gate: the echo stays in the wings until the player opens
  // the tuned lead, then chases for the rest of the run. A plain flag —
  // reset when the next race's echo object arrives.
  const echoLaunched = useRef(false);

  useEffect(() => {
    onStatus(world.status);
  }, [onStatus, world]);

  // A new echo object means a new race: rewind the feeder.
  useEffect(() => {
    feedCursor.current = 0;
    prevEchoStatus.current = "running";
    echoLaunched.current = false;
  }, [echo]);

  useFrame((state, delta) => {
    // Autopilot: the lookahead pilot reads the world and sets the same
    // input flags a player would, one decision per frame, right before
    // the step consumes them.
    if (world.autopilot && world.status === "running" && world.hitStop <= 0) {
      pilotSteer(world);
    }

    // One clock for the whole frame: the sim's own timeScale (dipped by
    // a dash, eased back in step.ts) scales every delta below — player,
    // echo, particles, dust. The world breathes in slow motion together.
    const sdt = Math.min(delta * world.timeScale, 0.05);

    stepWorld(world, sdt);

    // The echo lives in its own deterministic simulation — same seed as
    // this track, same physics, its recorded inputs. Stepping both with
    // one dt keeps them in lockstep through pauses and hit-stop; the
    // distance gate is the handicap start (see TUNING.echoGapMetres).
    if (
      echo &&
      echoInputs &&
      world.status === "running" &&
      world.hitStop <= 0
    ) {
      if (echoLaunched.current || world.distance >= TUNING.echoGapMetres) {
        echoLaunched.current = true;
        const gdt = Math.min(sdt, 0.05);
        while (
          feedCursor.current < echoInputs.length &&
          echoInputs[feedCursor.current].t <= echo.time + gdt
        ) {
          const inp = echoInputs[feedCursor.current++];
          if (inp.kind === "jump") requestJump(echo);
          else if (inp.kind === "release") releaseJump(echo);
          else requestDash(echo);
        }
        // The echo steps with the same scaled delta: its own timeScale
        // dips when its replayed dash fires, so both sims stay in exact
        // lockstep through every slow-motion stretch.
        stepWorld(echo, sdt);
        // Nobody consumes the echo's cosmetic events; drain or they pile up.
        echo.events.length = 0;
        if (prevEchoStatus.current === "running" && echo.status !== "running") {
          const span = stageSpan(
            state.size.width / Math.max(1, state.size.height),
          );
          const gx = clampInto(
            echo.distance - world.distance,
            span,
            0.5,
          );
          dustPuff(world, gx, echo.kitty.y, reducedMotion ? 3 : 7);
        }
        prevEchoStatus.current = echo.status;
      }
    }

    // Dash trail runs every frame while dashing, not as a one-off event.
    if (world.kitty.dashT > 0 && !reducedMotion) {
      dashTrail(world, 0, world.kitty.y + 0.75);
      if (world.kitty.dashT > DASH_TAIL_TIME) dashTrail(world, 0, world.kitty.y + 0.4);
    }

    // Bullet-time streaks: while the clock is dipped, pale lines tear
    // backward past the cat. Emission is per real frame, so the slow
    // world fills with fast light — the contrast is the effect.
    if (!reducedMotion && world.status === "running" && world.timeScale < 0.85) {
      speedLine(world, world.kitty.y + 0.2 + Math.random() * 1.9);
      speedLine(world, world.kitty.y + 0.2 + Math.random() * 1.9);
    }

    // A soft trot of dust while grounded keeps the run feeling weighted.
    dustTimer.current -= sdt;
    if (
      !reducedMotion &&
      world.status === "running" &&
      world.kitty.grounded &&
      dustTimer.current <= 0
    ) {
      dustTimer.current = 0.14;
      dustPuff(world, 0, world.kitty.y, 1);
    }

    handleEvents(world, muted ? null : sfxRef.current, muted ? null : trackRef?.current ?? null, reducedMotion, hud);
    // The soundtrack conducts itself from the live world every frame —
    // tempo from speed, layers from intensity, silence from state.
    trackRef?.current?.update(world, muted);
    writeHud(world, hud);

    if (prevStatus.current !== world.status) {
      prevStatus.current = world.status;
      onStatus(world.status);
    }
  });

  return null;
}
