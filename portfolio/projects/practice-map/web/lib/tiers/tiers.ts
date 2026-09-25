import { curriculum } from "../../curriculum";
import type { TopicCard } from "../../curriculum";

export type TierBand = "max" | "high" | "medium" | "low" | "thinking";

export type Volume = {
  readonly name: string;
  readonly topicIds: readonly string[];
};

export type Tier = {
  readonly id: string; // matches the curriculum area id
  readonly name: string; // display name, lowercase
  readonly band: TierBand;
  readonly areas: readonly string[]; // curriculum area ids in this tier
  readonly volumes?: readonly Volume[]; // only the big tier
};

export type { TopicCard };

export const TIERS: readonly Tier[] = [
  { id: "opus-5.5-high", name: "opus-5.5-high", band: "high", areas: ["erykah-badu-analog-priestess", "go-first-principles-internals", "laravel-symfony-field-guide", "visceral-hypersensitivity-gut"] },
  { id: "astra-6-max", name: "astra-6-max", band: "max", areas: ["kubernetes-first-principles", "subconscious-basics-to-advanced", "ddos", "lanthimos", "zeitgeist", "japan", "discourse"] },
  { id: "astra-6-medium", name: "astra-6-medium", band: "medium", areas: ["rust", "php-frameworks"] },
  { id: "fable-5.1-high", name: "fable-5.1-high", band: "high", areas: ["kendrick-lamar-glossary", "kubernetes", "hitchcock", "agentic-programming", "agi", "redis", "merkle-trees-layered", "odyssey-nolan-2026"] },
  { id: "fable-5.1-low", name: "fable-5.1-low", band: "low", areas: ["go", "spirit-of-time", "darwin", "microservices", "scaling"] },
  { id: "gpt-6-sol-max", name: "gpt-6-sol-max", band: "max", areas: ["sinners-2025-coogler", "project-hail-mary-film"] },
  {
    id: "opus-4.8-thinking",
    name: "opus-4.8-thinking",
    band: "thinking",
    areas: ["linux"],
    volumes: [
      { name: "vol 01 — first contact", topicIds: ["linux-cli-terminal", "linux-filesystem-hierarchy", "linux-shell-fundamentals", "linux-file-operations"] },
      { name: "vol 02 — permissions & users", topicIds: ["linux-permissions", "linux-users-groups", "linux-sudo-privileges"] },
      { name: "vol 03 — processes & pipes", topicIds: ["linux-processes", "linux-process-management", "linux-stdio", "linux-pipes-redirection", "linux-text-processing", "linux-processes-vs-threads"] },
      { name: "vol 04 — scripting & env", topicIds: ["linux-shell-scripting", "linux-env-vars", "linux-path-lookup", "linux-man-pages"] },
      { name: "vol 05 — packages", topicIds: ["linux-package-management", "linux-apt-debian", "linux-rpm-dnf"] },
    ],
  },
] as const;

/** chrome helpers (mono/lowercase chrome text is inline per the artifact) */
export const pad = (n: number): string => String(n).padStart(2, "0");
export const plural = (n: number, w: string): string => `${n} ${w}${n === 1 ? "" : "s"}`;

/**
 * Tier's topics in volume-then-rest order with tier-wide 1-based numbering.
 * Volume topicIds first (in declared order), then the tier's area ids not
 * already placed. `topicsById` is built by the page from the curriculum
 * (id → TopicCard); ids missing from the lookup are skipped.
 */
export function orderedTopicsForTier(
  tier: Tier,
  topicsById: Readonly<Record<string, TopicCard>>,
): readonly { topic: TopicCard; index: number }[] {
  const ordered: TopicCard[] = [];
  const seen = new Set<string>();

  const push = (id: string): void => {
    if (seen.has(id)) return;
    const topic = topicsById[id];
    if (!topic) return;
    seen.add(id);
    ordered.push(topic);
  };

  if (tier.volumes) {
    for (const vol of tier.volumes) for (const id of vol.topicIds) push(id);
  }
  for (const areaId of tier.areas) {
    // Every topic of the tier's areas (curriculum order) — volumes only pin
    // the ids they name; lessons added later still land in the rest.
    const area = curriculum.find((a) => a.id === areaId);
    if (!area) continue;
    for (const topic of area.topics) push(topic.id);
  }

  return ordered.map((topic, i) => ({ topic, index: i + 1 }));
}
