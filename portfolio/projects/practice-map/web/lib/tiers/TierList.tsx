import type { Tier } from "./tiers";
import { plural } from "./tiers";

type TierListProps = {
  tiers: readonly Tier[];
  activeTierId: string;
  onSelect: (tierId: string) => void;
  lessonCount: (tierId: string) => number;
  sampleTitle: (tierId: string) => string;
};

export function TierList({ tiers, activeTierId, onSelect, lessonCount, sampleTitle }: TierListProps) {
  return (
    <nav className="pg-tier-list" aria-label="model tiers">
      {tiers.map((tier) => {
        const active = tier.id === activeTierId;
        return (
          <button
            key={tier.id}
            type="button"
            className={`pg-tier-row${active ? " is-active" : ""}`}
            aria-pressed={active}
            onClick={() => onSelect(tier.id)}
          >
            <span className="pg-tier-name">{tier.name}</span>
            <span className="pg-tier-count">{plural(lessonCount(tier.id), "lesson")}</span>
            <span className="pg-tier-sample">{sampleTitle(tier.id)}</span>
          </button>
        );
      })}
    </nav>
  );
}
