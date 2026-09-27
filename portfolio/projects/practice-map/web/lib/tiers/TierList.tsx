import { useState } from "react";
import type { CSSProperties } from "react";
import type { Tier } from "./tiers";
import { plural } from "./tiers";

/** rows per page. fixed by design: every page except the tail is exactly this long. */
export const PAGE_SIZE = 5;

type TierListProps = {
  tiers: readonly Tier[];
  activeTierId: string;
  onSelect: (tierId: string) => void;
  lessonCount: (tierId: string) => number;
  sampleTitle: (tierId: string) => string;
  /**
   * optional. bump (e.g. a counter) on every palette jump so a jump to the tier that is
   * ALREADY active still re-lands its page after the user has paged away. without it,
   * a same-tier jump is a no-op for the list (active id unchanged). everything else works
   * with no wiring change.
   */
  jumpKey?: number | string;
};

/** a manual page turn, stamped with the active-tier context it was made under. */
type ManualPage = { page: number; stamp: string };

/** global data-order ordinal, zero-based index in → "01".."99" out. never renumbered per page. */
const ordinal = (index: number) => String(index + 1).padStart(2, "0");

export function TierList({ tiers, activeTierId, onSelect, lessonCount, sampleTitle, jumpKey }: TierListProps) {
  const [manual, setManual] = useState<ManualPage | null>(null);

  const total = tiers.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const lastPage = pageCount - 1;
  const activeIndex = tiers.findIndex((t) => t.id === activeTierId);
  const activePage = activeIndex < 0 ? 0 : Math.floor(activeIndex / PAGE_SIZE);

  // derived override, no effect: a manual turn holds only while the context it was made under
  // (active tier + jump key) is unchanged. any external jump changes the stamp, so the page falls
  // back to the active tier's page. selecting a row on the manual page re-stamps to that same page.
  const stamp = `${activeTierId}\u0000${jumpKey ?? ""}`;
  const requested = manual?.stamp === stamp ? manual.page : activePage;
  const page = Math.min(lastPage, Math.max(0, requested)); // clamp if data shrank under a stale turn

  const start = page * PAGE_SIZE;
  const rows = tiers.slice(start, start + PAGE_SIZE);
  const short = PAGE_SIZE - rows.length; // >0 only on a stub tail page

  const paged = pageCount > 1;
  const hasPrev = page > 0;
  const hasNext = page < lastPage;
  const towardActive = activePage < page ? "prev" : activePage > page ? "next" : null;

  /** "06–10" for a full page, "11" for a one-row stub. */
  function rangeOf(p: number) {
    const a = p * PAGE_SIZE;
    const b = Math.min(total, a + PAGE_SIZE) - 1;
    return a === b ? ordinal(a) : `${ordinal(a)}–${ordinal(b)}`;
  }

  function turn(delta: -1 | 1) {
    const next = page + delta;
    if (next < 0 || next > lastPage) return; // edge arrows are inert but stay focusable (aria-disabled)
    setManual({ page: next, stamp });
  }

  const prevLabel = hasPrev
    ? `previous page, tiers ${rangeOf(page - 1)}${towardActive === "prev" ? ", holds the active tier" : ""}`
    : "previous page, none, this is the first page";
  const nextLabel = hasNext
    ? `next page, tiers ${rangeOf(page + 1)}${towardActive === "next" ? ", holds the active tier" : ""}`
    : "next page, none, this is the last page";

  return (
    <nav className="pg-tier-list" aria-label="model tiers" data-page={page + 1} data-pages={pageCount}>
      {rows.map((tier, j) => {
        const i = start + j; // global data index → global ordinal
        const active = i === activeIndex;
        return (
          <button
            key={tier.id}
            type="button"
            className={`pg-tier-row${active ? " is-active" : ""}`}
            aria-pressed={active}
            data-tier-id={tier.id}
            onClick={() => onSelect(tier.id)}
          >
            <span className="pg-tier-index" aria-hidden="true">{ordinal(i)}</span>
            <span className="pg-tier-name">{tier.name}</span>
            <span className="pg-tier-count">{plural(lessonCount(tier.id), "lesson")}</span>
            <span className="pg-tier-sample">{sampleTitle(tier.id)}</span>
          </button>
        );
      })}
      {paged && (
        <div
          className="pg-tier-pager"
          role="group"
          aria-label="tier pages"
          style={{ "--pg-tier-short": short } as CSSProperties}
        >
          <button
            type="button"
            className="pg-tier-page pg-tier-page-prev"
            data-page-turn="prev"
            aria-disabled={hasPrev ? undefined : "true"}
            aria-label={prevLabel}
            data-toward-active={towardActive === "prev" ? "true" : undefined}
            onClick={() => turn(-1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <span className="pg-tier-pager-label" aria-live="polite">
            {`page ${page + 1} of ${pageCount}`}
          </span>
          <span className="pg-tier-pager-extent">{`${rangeOf(page)} of ${total}`}</span>
          <button
            type="button"
            className="pg-tier-page pg-tier-page-next"
            data-page-turn="next"
            aria-disabled={hasNext ? undefined : "true"}
            aria-label={nextLabel}
            data-toward-active={towardActive === "next" ? "true" : undefined}
            onClick={() => turn(1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </nav>
  );
}
