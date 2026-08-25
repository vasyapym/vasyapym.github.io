// Deterministic chunk spawner. The world is generated as a sequence of
// chunks, each a short weighted pattern of hazards and pickups. Purity is
// the point: the same seed and difficulty ramp produce the same run, and
// the fairness invariant (recoverable gap after every hazard group) is a
// plain function the node checks can pin.

import { groundY } from "./ground.ts";
import { createRng, type Rng } from "./rng.ts";
import { jumpLength } from "./tuning.ts";

export type SpawnKind =
  | "box"
  | "tall"
  | "hover"
  | "heart"
  | "star"
  | "heal";

export type SpawnItem = {
  kind: SpawnKind;
  x: number;
  y: number;
};

export type Chunk = {
  items: SpawnItem[];
  length: number;
  hazardEnd: number;
  // Minimum recoverable distance this chunk demands after it.
  gapFloor: number;
};

// Shared geometry so the scene renderer and the tests agree on sizes.
export const BOX_HALF = 0.55;
export const TALL_HALF = 0.7;
export const HOVER_RADIUS = 0.55;
export const PICKUP_RADIUS = 0.45;
export const HOVER_LIFT = 2.5;

// Every hazard is jumpable: the tallest top (3 * TALL_HALF over the
// ground) sits under the worst-case single-jump clearance, a pin the node
// checks hold even on the steepest uphill take-off.
export function isHazard(kind: SpawnKind): boolean {
  return kind === "box" || kind === "tall" || kind === "hover";
}

// After a hazard group the runner needs room to land, read the next
// pattern and react: a fixed floor plus one reaction-time of travel.
export const REACTION_TIME = 0.55;
export const MIN_GAP_FLOOR = 4;

export function minHazardGap(speed: number): number {
  return MIN_GAP_FLOOR + speed * REACTION_TIME;
}

export function nextChunkOrigin(
  chunk: Chunk,
  origin: number,
  speed: number,
): number {
  return Math.max(
    chunk.length,
    chunk.hazardEnd - origin + chunk.gapFloor,
  );
}

type PatternId =
  | "rest"
  | "singleBox"
  | "doubleBox"
  | "stairs"
  | "hoverGate"
  | "heartArc"
  | "starLine"
  | "heal";

const PATTERN_IDS: readonly PatternId[] = [
  "rest",
  "singleBox",
  "doubleBox",
  "stairs",
  "hoverGate",
  "heartArc",
  "starLine",
  "heal",
];

function patternWeight(id: PatternId, difficulty: number): number {
  switch (id) {
    case "rest":
      return 1.9 - difficulty * 1.1;
    case "singleBox":
      return 2.4;
    case "doubleBox":
      return 0.7 + difficulty * 2.4;
    case "stairs":
      return difficulty * 2.6;
    case "hoverGate":
      return difficulty * 2.2;
    case "heartArc":
      // A treat, not a diet: hearts are rare enough that losing one stings.
      return 0.85;
    case "starLine":
      return 1.15;
    case "heal":
      // The big cross heart: a mid-run sight worth detouring for, never an
      // opening-stretch given.
      return difficulty >= 0.3 ? 0.8 : 0;
  }
}

function pickPattern(rng: Rng, difficulty: number): PatternId {
  let total = 0;
  for (const id of PATTERN_IDS) total += patternWeight(id, difficulty);
  let roll = rng() * total;
  for (const id of PATTERN_IDS) {
    roll -= patternWeight(id, difficulty);
    if (roll <= 0) return id;
  }
  return "rest";
}

function hazardY(
  kind: Extract<SpawnKind, "box" | "tall" | "hover">,
  x: number,
): number {
  if (kind === "box") return groundY(x) + BOX_HALF;
  if (kind === "tall") return groundY(x) + 2 * TALL_HALF;
  return groundY(x) + HOVER_LIFT;
}

// Space between two hazards inside a pattern: wide enough that a jumped
// first obstacle leaves a landable window before the second, growing with
// speed so the reaction window stays constant in seconds. Bounds keep the
// window sane at the speed extremes.
function hazardPairGap(speed: number, fraction: number): number {
  return Math.min(9.8, Math.max(4.8, jumpLength(speed) * fraction + 1.2));
}

type Builder = (rng: Rng, s: number, speed: number) => { items: SpawnItem[]; length: number };

const BUILDERS: Record<PatternId, Builder> = {
  rest: (rng) => {
    // Shorter than before, so lulls read as a breath, not a dead zone.
    // Rising difficulty shifts weight toward hazard patterns anyway.
    return { items: [], length: 7 + rng() * 5 };
  },
  singleBox: (_rng, s) => ({
    items: [{ kind: "box", x: s + 6, y: hazardY("box", s + 6) }],
    length: 13,
  }),
  doubleBox: (_rng, s, speed) => {
    const first = s + 5;
    const second = first + hazardPairGap(speed, 0.85);
    return {
      items: [
        { kind: "box", x: first, y: hazardY("box", first) },
        { kind: "box", x: second, y: hazardY("box", second) },
      ],
      length: second - s + 6.5,
    };
  },
  stairs: (_rng, s, speed) => {
    const step = s + 5;
    const climb = step + hazardPairGap(speed, 0.85);
    return {
      items: [
        { kind: "box", x: step, y: hazardY("box", step) },
        { kind: "tall", x: climb, y: hazardY("tall", climb) },
      ],
      length: climb - s + 6.5,
    };
  },
  hoverGate: (_rng, s, speed) => {
    const gate = s + 6;
    const crate = gate + hazardPairGap(speed, 0.75);
    return {
      items: [
        { kind: "hover", x: gate, y: hazardY("hover", gate) },
        { kind: "box", x: crate, y: hazardY("box", crate) },
      ],
      length: crate - s + 6.5,
    };
  },
  heartArc: (_rng, s, speed) => {
    const items: SpawnItem[] = [];
    const span = 3.4 + jumpLength(speed) * 0.45;
    for (let i = 0; i < 3; i += 1) {
      const t = i / 2;
      const x = s + 4.5 + t * span;
      items.push({
        kind: "heart",
        x,
        y: groundY(x) + 0.9 + 1.7 * Math.sin(Math.PI * t),
      });
    }
    return { items, length: 4.5 + span + 5 };
  },
  starLine: (_rng, s, speed) => {
    const items: SpawnItem[] = [];
    const spacing = Math.min(4.4, Math.max(2.5, jumpLength(speed) * 0.42));
    for (const offset of [4.5, 4.5 + spacing, 4.5 + 2 * spacing]) {
      const x = s + offset;
      items.push({ kind: "star", x, y: groundY(x) + 1.05 });
    }
    return { items, length: 4.5 + 2 * spacing + 5 };
  },
  heal: (_rng, s) => {
    const x = s + 5;
    return { items: [{ kind: "heal", x, y: groundY(x) + 1.05 }], length: 11 };
  },
};

export function buildChunk(
  seed: string,
  origin: number,
  difficulty: number,
  speed: number,
): Chunk {
  const rng = createRng(seed);
  const id = pickPattern(rng, Math.min(1, Math.max(0, difficulty)));
  const built = BUILDERS[id](rng, origin, speed);

  let hazardEnd = Number.NEGATIVE_INFINITY;
  for (const item of built.items) {
    if (!isHazard(item.kind)) continue;
    if (item.x > hazardEnd) hazardEnd = item.x;
  }

  return {
    items: built.items,
    length: built.length,
    hazardEnd,
    gapFloor: minHazardGap(speed),
  };
}

// Convenience for callers that want a little length jitter without losing
// determinism: the jitter is drawn from the same chunk seed.
export function chunkSeed(runSeed: string, index: number): string {
  return `${runSeed}/chunk/${index}`;
}

export function firstHazardX(chunk: Chunk): number {
  let first = Number.POSITIVE_INFINITY;
  for (const item of chunk.items) {
    if (isHazard(item.kind) && item.x < first) first = item.x;
  }
  return first;
}
