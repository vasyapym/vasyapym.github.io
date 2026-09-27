import { useEffect, useRef, useState } from "react";
import type { Tier } from "./tiers";
import { plural } from "./tiers";

/** rows always shown when folded: the head of the data array. */
const WINDOW = 6;
/** a fold that hides fewer rows than this costs more than it saves, because the control is a row itself. */
const MIN_HIDDEN = 3;

type TierListProps = {
  tiers: readonly Tier[];
  activeTierId: string;
  onSelect: (tierId: string) => void;
  lessonCount: (tierId: string) => number;
  sampleTitle: (tierId: string) => string;
};

type AfterToggle = { focusId?: string; revealControl?: boolean } | null;

export function TierList({ tiers, activeTierId, onSelect, lessonCount, sampleTitle }: TierListProps) {
  const [expanded, setExpanded] = useState(false);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const moreRef = useRef<HTMLButtonElement>(null);
  const afterToggle = useRef<AfterToggle>(null);

  const total = tiers.length;
  // depends only on data length, so the control never appears or vanishes on selection
  const foldable = total - WINDOW >= MIN_HIDDEN;
  const folded = foldable && !expanded;
  const activeIndex = tiers.findIndex((t) => t.id === activeTierId);

  // folded = the head window + the active row wherever it lives (pinned directly after the window).
  // derived on every render from activeTierId, so a ⌘k jump from outside is self-consistent with no effect.
  const rows = tiers
    .map((tier, i) => ({ tier, i }))
    .filter(({ i }) => !folded || i < WINDOW || i === activeIndex);
  const shown = rows.length;
  const hidden = total - shown;

  useEffect(() => {
    const job = afterToggle.current;
    if (!job) return;
    afterToggle.current = null;
    // expand (keyboard): continue reading/tabbing at the first revealed record
    if (job.focusId) rowRefs.current.get(job.focusId)?.focus();
    // fold: the control jumped up; keep it on screen, instantly (no scroll animation)
    if (job.revealControl) moreRef.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
  }, [expanded]);

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    if (folded) {
      // only a keyboard activation moves focus (event.detail is 0 for
      // keyboard-generated clicks); a pointer click must not page-jump
      const keyboard = event.detail === 0;
      const firstHidden = tiers.find((_, i) => i >= WINDOW && i !== activeIndex);
      afterToggle.current = keyboard ? { focusId: firstHidden?.id } : {};
      setExpanded(true);
    } else {
      afterToggle.current = { revealControl: true };
      setExpanded(false);
    }
  }

  return (
    <nav className="pg-tier-list" aria-label="model tiers">
      {rows.map(({ tier, i }) => {
        const active = i === activeIndex;
        const pinned = folded && active && i >= WINDOW;
        return (
          <button
            key={tier.id}
            ref={(el) => {
              if (el) rowRefs.current.set(tier.id, el);
              else rowRefs.current.delete(tier.id);
            }}
            type="button"
            className={`pg-tier-row${active ? " is-active" : ""}`}
            aria-pressed={active}
            data-tier-id={tier.id}
            data-pinned={pinned ? "true" : undefined}
            onClick={() => onSelect(tier.id)}
          >
            <span className="pg-tier-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <span className="pg-tier-name">{tier.name}</span>
            <span className="pg-tier-count">{plural(lessonCount(tier.id), "lesson")}</span>
            <span className="pg-tier-sample">{sampleTitle(tier.id)}</span>
          </button>
        );
      })}
      {foldable && (
        <button
          ref={moreRef}
          type="button"
          className="pg-tier-more"
          aria-expanded={!folded}
          aria-label={
            folded
              ? `show ${hidden} more tiers, ${shown} of ${total} shown`
              : `show fewer tiers, all ${total} shown`
          }
          onClick={toggle}
        >
          <span className="pg-tier-more-glyph" aria-hidden="true">{folded ? "+" : "−"}</span>
          <span className="pg-tier-more-label">{folded ? `show ${hidden} more` : "show fewer"}</span>
          <span className="pg-tier-more-extent">{folded ? `${shown} of ${total}` : `all ${total}`}</span>
        </button>
      )}
    </nav>
  );
}
