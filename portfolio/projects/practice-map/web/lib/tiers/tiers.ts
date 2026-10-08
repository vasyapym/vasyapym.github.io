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
  { id: "astra-6-max", name: "astra-6-max", band: "max", areas: ["render-neon-portfolio", "go-concurrency-saturation", "typescript-static-to-scale", "linkedin-evidence-package", "ibs-visceral-course", "new-york-culture", "park-chan-wook", "contracted-gut-visceral-hs", "wong-kar-wai", "rsi-first-principles", "akira-kurosawa-vocabulary", "kubernetes-first-principles", "subconscious-basics-to-advanced", "ddos", "lanthimos", "zeitgeist", "japan", "discourse", "frankenstein-concepts", "universe-connected-map", "kyrgyzstan-concepts", "terraform-state-plan-model"],
    volumes: [
    { name: "tech", topicIds: ["rsi-first-principles-full", "kubernetes-first-principles", "ddos-resource-management", "typescript-static-to-scale-full", "terraform-state-plan-model-full", "go-concurrency-saturation-full", "render-neon-portfolio-full"] },
    { name: "film", topicIds: ["park-chan-wook-full", "wong-kar-wai-full", "akira-kurosawa-vocabulary", "lanthimos-cinema-anatomy"] },
    { name: "health", topicIds: ["ibs-visceral-course-full", "contracted-gut-visceral-hs-full"] },
    { name: "places", topicIds: ["new-york-culture-full", "japan-trip-systems", "kyrgyzstan-concepts-full"] },
    { name: "mind", topicIds: ["subconscious-basics-to-advanced"] },
    { name: "career", topicIds: ["linkedin-evidence-package-full"] },
    { name: "society", topicIds: ["zeitgeist-historicity-of-thought", "discourse-language-meaning-action"] },
    { name: "literature", topicIds: ["frankenstein-concepts-full"] },
    { name: "science", topicIds: ["universe-connected-map-full"] }
  ] },
  { id: "astra-6-medium", name: "astra-6-medium", band: "medium", areas: ["rust", "php-frameworks"] },
  { id: "fable-5.1-max", name: "fable-5.1-max", band: "max", areas: ["semiconductor-physics", "ibs-spasm-contracted", "dopamine-ibs", "ai-resilient-fixed-points", "docker", "pytorch-concepts-mindset"] },
  { id: "fable-5.1-high", name: "fable-5.1-high", band: "high", areas: ["python-ai-ml-working-vocabulary", "cloud-native-working-vocabulary", "rag-first-principles", "louis-armstrong-first-principles", "hermitage-intro", "ibs-spasm", "norway-first-timer", "jordan-peele-social-thriller", "jordan-peele-theory-of-fear", "wes-craven", "kendrick-lamar-glossary", "kubernetes", "hitchcock", "agentic-programming", "agi", "redis", "merkle-trees-layered", "odyssey-nolan-2026", "roland-barthes-glossary", "mongolia-widely-known", "postgresql-anatomy"],
    volumes: [
    { name: "tech", topicIds: ["kubernetes-philosophy-to-internals", "agentic-programming-principles", "agi-map-of-the-debate", "redis-caching-first-principles", "merkle-trees-layered", "rag-first-principles-full", "cloud-native-working-vocabulary-full", "python-ai-ml-working-vocabulary-full", "postgresql-anatomy-full"] },
    { name: "film", topicIds: ["jordan-peele-social-thriller-full", "jordan-peele-theory-of-fear-full", "wes-craven-full", "hitchcock-craft-anatomy", "odyssey-nolan-2026"] },
    { name: "places", topicIds: ["hermitage-intro-full", "norway-first-timer-full", "mongolia-widely-known-full"] },
    { name: "music", topicIds: ["kendrick-lamar-glossary", "louis-armstrong-first-principles-full"] },
    { name: "literature", topicIds: ["roland-barthes-glossary"] },
    { name: "health", topicIds: ["ibs-spasm-full"] }
  ] },
  { id: "fable-5.1-low", name: "fable-5.1-low", band: "low", areas: ["embeddings-vector-search-triangle", "zero-trust-lateral-movement", "typescript-type-level-sky", "event-driven-sharp-edges", "terraform-ground-up", "langchain-ground-up", "uzbekistan-heart-of-asia", "mongolia-field-guide", "go-first-principles-runtime", "rsi-recursive-self-improvement", "go", "spirit-of-time", "darwin", "microservices", "scaling", "bloom-filters", "merkle-trees-intuition", "tolkien-all-you-need"],
    volumes: [
    { name: "tech", topicIds: ["terraform-ground-up-full", "langchain-ground-up-full", "go-first-principles-runtime", "rsi-the-loop", "go-zero-to-depth", "microservices-monolith-spectrum", "scaling-vertical-horizontal", "bloom-filters", "merkle-trees-frontier", "event-driven-sharp-edges-full", "typescript-type-level-sky-full", "zero-trust-lateral-movement-full", "embeddings-vector-search-triangle-full"] },
    { name: "places", topicIds: ["uzbekistan-heart-of-asia-full", "mongolia-field-guide-full"] },
    { name: "society", topicIds: ["spirit-of-time-metaphor-to-problem"] },
    { name: "science", topicIds: ["darwin-theories-terms-works"] },
    { name: "literature", topicIds: ["tolkien-all-you-need-full"] }
  ] },
  { id: "fable-5-high", name: "fable-5-high", band: "high", areas: ["saint-petersburg-deep-map", "go-goroutine-scheduler-gc", "euv-lithography", "dark-souls-concepts", "uzbekistan-deep-dive", "discworld-newcomer", "old-english", "sakha", "subconscious-first-principles", "darwin-mechanism", "spielberg-craft-layers", "terraform-opentofu-state-engine"],
    volumes: [
    { name: "tech", topicIds: ["euv-lithography-full", "terraform-opentofu-state-engine-full", "go-goroutine-scheduler-gc-full"] },
    { name: "games", topicIds: ["dark-souls-concepts-full"] },
    { name: "places", topicIds: ["uzbekistan-deep-dive-full", "saint-petersburg-deep-map-full"] },
    { name: "literature", topicIds: ["discworld-newcomer-full"] },
    { name: "language", topicIds: ["old-english", "sakha"] },
    { name: "mind", topicIds: ["subconscious-first-principles"] },
    { name: "science", topicIds: ["darwin-mechanism"] },
    { name: "film", topicIds: ["spielberg-craft-layers-full"] }
  ] },
  { id: "opus-5.5-high", name: "opus-5.5-high", band: "high", areas: ["profile-as-search-result", "typescript-ground-up-type-level", "cloud-native-first-principles", "megapolis-culture", "cannabis-first-principles", "langchain-abstractions-leak", "st-petersburg-paradox", "future-of-humanity", "discworld-made-of-story", "hbm-stacking", "gut-ibs-condensed", "erykah-badu-analog-priestess", "go-first-principles-internals", "laravel-symfony-field-guide", "visceral-hypersensitivity-gut", "roland-barthes-guide", "zach-cregger", "kazakhstan-research-disputes", "milky-way-outline", "rene-clement-guide", "react-19-next-16"],
    volumes: [
    { name: "tech", topicIds: ["langchain-abstractions-leak-full", "hbm-stacking-full", "go-first-principles-internals", "laravel-symfony-field-guide", "react-19-next-16-full", "cloud-native-first-principles-full", "typescript-ground-up-type-level-full"] },
    { name: "health", topicIds: ["gut-ibs-condensed-full", "visceral-hypersensitivity-gut"] },
    { name: "science", topicIds: ["st-petersburg-paradox-full", "milky-way-outline-full"] },
    { name: "society", topicIds: ["megapolis-culture-full", "cannabis-first-principles-full", "future-of-humanity-full"] },
    { name: "career", topicIds: ["profile-as-search-result-full"] },
    { name: "literature", topicIds: ["discworld-made-of-story-full", "roland-barthes-guide"] },
    { name: "music", topicIds: ["erykah-badu-analog-priestess"] },
    { name: "film", topicIds: ["cregger-rupture-full", "rene-clement-guide-full"] },
    { name: "places", topicIds: ["kazakhstan-research-disputes-full"] }
  ] },
  { id: "opus-5.5-medium", name: "opus-5.5-medium", band: "medium", areas: ["polanski-enclosure-vocabulary", "cloud-identity-perimeter", "kant-mind-builds-world", "postgresql-db-thinking", "odyssey-concepts", "universe-field-guide", "christopher-nolan", "josh-safdie", "recursive-ai-resilient-skills", "dopamine-ibs-double-life", "python-concurrency", "zombie-cinema", "kendrick-lamar-field-guide", "kubernetes-vocabulary", "kendrick-roman-v-golosah"],
    volumes: [
    { name: "tech", topicIds: ["postgresql-db-thinking-full", "python-concurrency", "kubernetes-vocabulary", "cloud-identity-perimeter-full"] },
    { name: "film", topicIds: ["nolan-time-deception-full", "safdie-compulsion-full", "zombie-cinema", "polanski-enclosure-vocabulary-full"] },
    { name: "music", topicIds: ["kendrick-lamar-field-guide", "kendrick-roman-v-golosah"] },
    { name: "science", topicIds: ["universe-field-guide-full"] },
    { name: "mind", topicIds: ["kant-mind-builds-world-full"] },
    { name: "health", topicIds: ["dopamine-ibs-double-life-full"] },
    { name: "society", topicIds: ["ai-resilient-skills-full"] },
    { name: "literature", topicIds: ["odyssey-concepts-full"] }
  ] },
  { id: "opus-5-max", name: "opus-5-max", band: "max", areas: ["python-coordination-language", "fastapi-concepts", "go-conceptual-vocabulary", "project-hail-mary-guide", "miyazaki", "paul-thomas-anderson"] },
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
