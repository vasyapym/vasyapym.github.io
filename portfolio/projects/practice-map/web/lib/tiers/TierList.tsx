import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Tier } from "./tiers";
import { plural } from "./tiers";

/** rows per page. owner-fixed; every other number the pager shows is derived from tiers.length. */
const PAGE_SIZE = 5;
/** a short tail page still holds the pager as low as a page with this many rows (owner dial:
 * 3 read as too much air, 2 is the settled floor). missing rows become empty air — no
 * placeholder rules. */
const MIN_ROWS = 2;

type TierListProps = {
  tiers: readonly Tier[];
  activeTierId: string;
  onSelect: (tierId: string) => void;
  lessonCount: (tierId: string) => number;
  sampleTitle: (tierId: string) => string;
};

/** what to do after a page commit: move focus to a row, or keep the pager in view. */
type AfterTurn = { focusId?: string; revealPager?: boolean } | null;

const ord = (n: number) => String(n).padStart(2, "0");

export function TierList({ tiers, activeTierId, onSelect, lessonCount, sampleTitle }: TierListProps) {
  const total = tiers.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeIndex = tiers.findIndex((t) => t.id === activeTierId);
  const activePage = activeIndex >= 0 ? Math.floor(activeIndex / PAGE_SIZE) : -1;

  // manual page state with a derived override: whenever the active tier changes (initial load,
  // row click, ⌘k palette jump from outside), the page snaps to wherever that tier lives.
  // adjusting state during render is React's documented pattern for "react to a prop change"
  // without an effect-frame flash of the wrong page.
  const [page, setPage] = useState(Math.max(0, activePage));
  const [snappedFor, setSnappedFor] = useState(activeTierId);
  if (snappedFor !== activeTierId) {
    setSnappedFor(activeTierId);
    if (activePage >= 0) setPage(activePage);
  }
  const current = Math.min(Math.max(0, page), pageCount - 1); // clamp if data shrinks
  const paged = pageCount > 1;
  const start = current * PAGE_SIZE;
  const pageTiers = tiers.slice(start, start + PAGE_SIZE);
  const padRows = Math.max(0, MIN_ROWS - pageTiers.length); // empty air above the pager on short pages
  const onFirst = current === 0;
  const onLast = current === pageCount - 1;

  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const pagerRef = useRef<HTMLDivElement>(null);
  const afterTurn = useRef<AfterTurn>(null);

  useEffect(() => {
    const job = afterTurn.current;
    if (!job) return;
    afterTurn.current = null;
    if (job.focusId) rowRefs.current.get(job.focusId)?.focus();
    else if (job.revealPager) pagerRef.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
  }, [current]);

  function turn(delta: -1 | 1) {
    const next = current + delta;
    if (next < 0 || next >= pageCount) return;
    // focus stays on the pressed arrow and the live cue announces the page — unless the arrow
    // dies on arrival at an edge page (a disabled control can't hold focus): then focus moves
    // to the first row of the new page.
    const pressedDies = delta < 0 ? next === 0 : next === pageCount - 1;
    afterTurn.current = pressedDies ? { focusId: tiers[next * PAGE_SIZE]?.id } : { revealPager: true };
    setPage(next);
  }

  function rangeLabel(p: number) {
    const first = p * PAGE_SIZE + 1;
    const last = Math.min(total, first + PAGE_SIZE - 1);
    return first === last ? `tier ${ord(first)}` : `tiers ${ord(first)}–${ord(last)}`;
  }

  return (
    <nav
      className="pg-tier-list"
      aria-label="model tiers"
      data-page={current + 1}
      data-pages={pageCount}
    >
      {pageTiers.map((tier, j) => {
        const i = start + j; // global data-order index; ordinals never renumber per page
        const active = i === activeIndex;
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
            onClick={() => onSelect(tier.id)}
          >
            <span className="pg-tier-index" aria-hidden="true">{ord(i + 1)}</span>
            <span className="pg-tier-name">{tier.name}</span>
            <span className="pg-tier-count">{plural(lessonCount(tier.id), "lesson")}</span>
            <span className="pg-tier-sample">{sampleTitle(tier.id)}</span>
          </button>
        );
      })}
      {paged && (
        <div
          ref={pagerRef}
          className="pg-tier-pager"
          role="group"
          aria-label="tier pages"
          style={{ "--pg-tier-pad": padRows } as CSSProperties}
        >
          <button
            type="button"
            className="pg-tier-page pg-tier-page-prev"
            data-turn="prev"
            disabled={onFirst}
            aria-label={onFirst ? "previous page" : `previous page, ${rangeLabel(current - 1)}`}
            onClick={() => turn(-1)}
          >
            <span className="pg-tier-page-glyph" aria-hidden="true">{"<"}</span>
          </button>
          <span className="pg-tier-page-cue" aria-live="polite" aria-atomic="true">
            <span className="pg-tier-page-cue-text">{`page ${current + 1} of ${pageCount}`}</span>
          </span>
          <button
            type="button"
            className="pg-tier-page pg-tier-page-next"
            data-turn="next"
            disabled={onLast}
            aria-label={onLast ? "next page" : `next page, ${rangeLabel(current + 1)}`}
            onClick={() => turn(1)}
          >
            <span className="pg-tier-page-glyph" aria-hidden="true">{">"}</span>
          </button>
        </div>
      )}
    </nav>
  );
}
