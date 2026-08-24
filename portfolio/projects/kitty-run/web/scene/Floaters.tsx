// Floating score numbers as DOM spans over the canvas. The pool of nodes
// is rendered once; each frame the live floaters are projected from world
// space to stage percentages and faded toward the end of their life.

import { useEffect, useRef } from "react";
import { frameFor } from "../lib/framing.ts";
import type { WorldState } from "./world.ts";

const COUNT = 12;

function floaterText(kind: string, amount: number): string {
  if (kind === "hurt") return "−1";
  if (kind === "heal") return "+♥";
  return `+${amount}`;
}

export function Floaters({
  world,
  stageRef,
}: {
  world: WorldState;
  stageRef: React.RefObject<HTMLDivElement | null>;
}) {
  const nodesRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Lives outside the Canvas, so it drives itself with a plain rAF loop.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = requestAnimationFrame(update);
      const stage = stageRef.current;
      if (!stage) return;
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const aspect = width / Math.max(1, height);
      const frame = frameFor(aspect);

      for (let i = 0; i < COUNT; i += 1) {
        const node = nodesRef.current[i];
        if (!node) continue;
        const slot = world.floaters.slots[i];
        if (!slot.active) {
          if (node.style.opacity !== "0") node.style.opacity = "0";
          continue;
        }
        const f = slot.data;
        const key = `${f.kind}:${f.amount}:${f.maxLife}`;
        if (node.dataset.key !== key) {
          node.dataset.key = key;
          node.textContent = floaterText(f.kind, f.amount);
          node.className = `kitty-run-floater kitty-run-floater-${f.kind}`;
        }
        const vx = f.x - world.distance;
        const xPercent = 50 + ((vx - frame.lookX) / (frame.viewHeight * aspect)) * 100;
        const yPercent = 50 - ((f.y - frame.lookY) / frame.viewHeight) * 100;
        node.style.left = `${xPercent}%`;
        node.style.top = `${yPercent}%`;
        node.style.opacity = String(Math.min(1, f.life / (f.maxLife * 0.5)));
        node.style.transform = `translate(-50%, -50%) scale(${0.8 + 0.3 * (f.life / f.maxLife)})`;
      }
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [world, stageRef]);

  return (
    <div className="kitty-run-floaters" aria-hidden="true">
      {Array.from({ length: COUNT }, (_, i) => (
        <span
          key={i}
          ref={(node) => {
            nodesRef.current[i] = node;
          }}
          className="kitty-run-floater"
        />
      ))}
    </div>
  );
}
