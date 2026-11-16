import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { FamilyGroup } from "./tiers";
import { plural } from "./tiers";

/** rows per page. owner-fixed; every other number the pager shows is derived from the visible list's length. */
const PAGE_SIZE = 5;
/** a short tail page still holds the pager as low as a page with this many rows (owner dial:
 * 3 read as too much air, 2 is the settled floor). missing rows become empty air — no
 * placeholder rules. dormant today: every family holds ≤5 tiers and the index holds 3
 * families, so no view reaches a second page. */
const MIN_ROWS = 2;

type TierListProps = {
  groups: readonly FamilyGroup[];
  activeTierId: string;
  /** bumped by every palette jump — even a jump to the already-active tier
   * must leave the index, so a signal, not the tier id, carries it. */
  jumpSignal: number;
  onSelect: (tierId: string) => void;
  lessonCount: (tierId: string) => number;
  sampleTitle: (tierId: string) => string;
};

/** what to do after a page or view commit: focus a tier row, focus a family
 * row, focus the head button (index dismissal), or keep the pager in view. */
type AfterTurn = { focusId?: string; focusFamilyId?: string; focusHead?: boolean; revealPager?: boolean } | null;

const ord = (n: number) => String(n).padStart(2, "0");

export function TierList({ groups, activeTierId, jumpSignal, onSelect, lessonCount, sampleTitle }: TierListProps) {
  // global display order: registry-order families, TIERS order inside each. a
  // tier's global ordinal is its index here — ordinals never renumber when a
  // different family's folder is open (fable reads 01–05, opus 06–09, other 10–14).
  const display = groups.flatMap((g) => g.tiers);
  // the folder always shows the active tier's family — the family is derived,
  // never stored, so an outside jump (⌘k palette) drags the folder along.
  const activeGroup = groups.find((g) => g.tiers.some((t) => t.id === activeTierId)) ?? groups[0];
  const familyOrdinal = groups.findIndex((g) => g.family.id === activeGroup.family.id);

  // two views over one nav: the folder (head row + the family's tier rows) and
  // the index (one row per family). each view pages its own rows.
  const [indexOpen, setIndexOpen] = useState(false);

  // manual page state with a derived override: whenever the active tier changes
  // (initial load, row click, ⌘k palette jump from outside), the page snaps to
  // wherever that tier lives in its family and the index closes. adjusting
  // state during render is React's documented pattern for "react to a prop
  // change" without an effect-frame flash of the wrong page.
  const folderTiers = activeGroup.tiers;
  const folderIndex = folderTiers.findIndex((t) => t.id === activeTierId);
  const activePage = folderIndex >= 0 ? Math.floor(folderIndex / PAGE_SIZE) : -1;

  const [page, setPage] = useState(Math.max(0, activePage));
  const [snappedFor, setSnappedFor] = useState(activeTierId);
  if (snappedFor !== activeTierId) {
    setSnappedFor(activeTierId);
    if (activePage >= 0) setPage(activePage);
    setIndexOpen(false); // a tier change (outside jump or family pick) leaves the index
  }
  // a palette jump that does not change the tier (same tier, maybe another
  // volume) still navigates: the index folds back to the folder so the
  // opened lesson is seen in its tier's context.
  const [snappedJump, setSnappedJump] = useState(jumpSignal);
  if (snappedJump !== jumpSignal) {
    setSnappedJump(jumpSignal);
    setIndexOpen(false);
  }
  const total = indexOpen ? groups.length : folderTiers.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(0, page), pageCount - 1); // clamp if data shrinks
  const paged = pageCount > 1;
  const start = current * PAGE_SIZE;
  const pageTiers = folderTiers.slice(start, start + PAGE_SIZE);
  const pageGroups = groups.slice(start, start + PAGE_SIZE);
  const padRows = Math.max(0, MIN_ROWS - (indexOpen ? pageGroups.length : pageTiers.length)); // empty air above the pager on short pages
  const onFirst = current === 0;
  const onLast = current === pageCount - 1;
  // the folder's rows keep GLOBAL ordinals — its first tier's display index is
  // the offset every label adds (per-page slicing never renumbers them)
  const displayOffset = folderTiers.length
    ? display.findIndex((t) => t.id === folderTiers[0].id)
    : 0;

  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const headRef = useRef<HTMLButtonElement>(null);
  const pagerRef = useRef<HTMLDivElement>(null);
  const afterTurn = useRef<AfterTurn>(null);

  useEffect(() => {
    const job = afterTurn.current;
    if (!job) return;
    afterTurn.current = null;
    if (job.focusId) rowRefs.current.get(job.focusId)?.focus();
    else if (job.focusFamilyId) rowRefs.current.get(job.focusFamilyId)?.focus();
    else if (job.focusHead) headRef.current?.focus();
    else if (job.revealPager) pagerRef.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
    // the view flip rides the same effect: opening the index must focus the
    // current family's row, and dismissing it must hand focus back to the
    // head row, even when the clamped page number doesn't change.
  }, [current, indexOpen]);

  function turn(delta: -1 | 1) {
    const next = current + delta;
    if (next < 0 || next >= pageCount) return;
    // focus stays on the pressed arrow and the live cue announces the page — unless the arrow
    // dies on arrival at an edge page (a disabled control can't hold focus): then focus moves
    // to the first row of the new page (a tier row in the folder, a family row in the index).
    const pressedDies = delta < 0 ? next === 0 : next === pageCount - 1;
    if (pressedDies) {
      afterTurn.current = indexOpen
        ? { focusFamilyId: groups[next * PAGE_SIZE]?.family.id }
        : { focusId: folderTiers[next * PAGE_SIZE]?.id };
    } else {
      afterTurn.current = { revealPager: true };
    }
    setPage(next);
  }

  function openIndex() {
    // the index opens on the page that holds the current family's row — the
    // page dial is shared by both views, and the folder may have left it
    // anywhere (dormant today: 3 families fit page 1).
    afterTurn.current = { focusFamilyId: activeGroup.family.id };
    setPage(Math.floor(familyOrdinal / PAGE_SIZE));
    setIndexOpen(true);
  }

  function pickFamily(group: FamilyGroup) {
    if (group.family.id === activeGroup.family.id) {
      // the current family just folds back to its folder, tier unchanged —
      // and the focused family row unmounts, so the head takes focus back.
      afterTurn.current = { focusHead: true };
      setIndexOpen(false);
      return;
    }
    // the family's first tier takes over: the panel follows because the page
    // re-derives, and the snap above closes the index and lands its folder.
    afterTurn.current = { focusId: group.tiers[0]?.id };
    onSelect(group.tiers[0]?.id ?? "");
  }

  // range labels name the view's rows in the view's ordinals: global for tier
  // rows (never renumbered per page), own for family rows.
  function rangeLabel(p: number) {
    const first = p * PAGE_SIZE + 1;
    const last = Math.min(total, first + PAGE_SIZE - 1);
    const label = (n: number) => ord(indexOpen ? n : displayOffset + n);
    const noun = indexOpen ? "family" : "tier";
    return first === last ? `${noun} ${label(first)}` : `${noun}s ${label(first)}–${label(last)}`;
  }

  return (
    <nav
      className="pg-tier-list"
      aria-label="model tiers"
      data-view={indexOpen ? "index" : "folder"}
      data-family-id={indexOpen ? undefined : activeGroup.family.id}
      data-page={current + 1}
      data-pages={pageCount}
      onKeyDown={(e) => {
        // component-local escape: the index folds back to the folder without
        // touching the page's global keys — a volume view underneath stays put,
        // so the press must not reach the window handler.
        if (e.key === "Escape" && indexOpen) {
          e.stopPropagation();
          // the focused family row unmounts with the index — the head row
          // takes focus back, so keyboard nav continues from the folder.
          afterTurn.current = { focusHead: true };
          setIndexOpen(false);
        }
      }}
    >
      {indexOpen ? (
        <>
          <div className="pg-family-title">model families <span>{plural(display.length, "tier")}</span></div>
          {pageGroups.map((group, j) => {
            const i = start + j; // view-local index; family ordinals start at 01 per view
            const active = group.family.id === activeGroup.family.id;
            return (
              <button
                key={group.family.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(group.family.id, el);
                  else rowRefs.current.delete(group.family.id);
                }}
                type="button"
                className={`pg-tier-row${active ? " is-active" : ""}`}
                aria-pressed={active}
                data-family-id={group.family.id}
                onClick={() => pickFamily(group)}
              >
                <span className="pg-tier-index" aria-hidden="true">{ord(i + 1)}</span>
                <span className="pg-tier-name">{group.family.label}</span>
                <span className="pg-tier-count">{plural(group.tiers.length, "tier")}</span>
                <span className="pg-tier-sample">{group.tiers[0]?.name ?? ""}</span>
              </button>
            );
          })}
        </>
      ) : (
        <>
          <button
            type="button"
            className="pg-family-head"
            aria-label="model families"
            ref={headRef}
            onClick={openIndex}
          >
            <span className="pg-family-arrow" aria-hidden="true">←</span>
            <span className="pg-family-label">{activeGroup.family.label}</span>
            <span className="pg-family-cue" aria-live="polite">{`family ${familyOrdinal + 1} of ${groups.length}`}</span>
          </button>
          {pageTiers.map((tier, j) => {
            const i = displayOffset + start + j; // global data-order index; ordinals never renumber per page
            const active = tier.id === activeTierId;
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
        </>
      )}
      {paged && (
        <div
          ref={pagerRef}
          className="pg-tier-pager"
          role="group"
          aria-label={indexOpen ? "family pages" : "tier pages"}
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
