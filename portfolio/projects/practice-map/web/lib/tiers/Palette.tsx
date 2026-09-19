import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

export type PaletteItem = {
  readonly kind: "tier" | "lesson";
  readonly title: string;
  readonly sub: string;
  readonly tierId: string;
  readonly topicId: string | null;
  readonly hay: string;
};

type PaletteProps = {
  open: boolean;
  onClose: () => void;
  onJump: (tierId: string, topicId: string | null) => void;
  items: readonly PaletteItem[];
};

// verbatim scorer from the artifact
function fuzzy(q: string, s: string): number {
  if (!q) return 0;
  const str = s.toLowerCase();
  const qq = q.toLowerCase().replace(/\s+/g, "");
  let i = 0;
  let prev = -1;
  let score = 0;
  for (const ch of qq) {
    const idx = str.indexOf(ch, i);
    if (idx < 0) return -1;
    score += idx === prev + 1 ? 0 : idx - i + 2;
    prev = idx;
    i = idx + 1;
  }
  return score;
}

export function Palette({ open, onClose, onJump, items }: PaletteProps) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const query = q.trim();
    return items
      .map((it) => ({ it, s: fuzzy(query, it.hay) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => a.s - b.s)
      .slice(0, 40)
      .map((r) => r.it);
  }, [q, items]);

  // reset + focus on open (the page owns the ⌘k toggle that flips `open`)
  useEffect(() => {
    if (!open) return;
    setQ("");
    setSel(0);
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  // clamp selection to results
  useEffect(() => {
    setSel((s) => (s >= results.length ? Math.max(0, results.length - 1) : s));
  }, [results.length]);

  // keep the selected row in view
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(".pg-pal-item.is-sel")?.scrollIntoView({ block: "nearest" });
  }, [sel, results]);

  if (!open) return null;

  const choose = (i: number): void => {
    const it = results[i];
    if (!it) return;
    onJump(it.tierId, it.topicId);
    onClose();
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(sel);
    }
  };

  return (
    <div
      className="pg-palette is-open"
      role="dialog"
      aria-modal="true"
      aria-label="jump to tier or lesson"
      onMouseDown={(e) => {
        if (!(e.target as HTMLElement).closest(".pg-pal")) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div className="pg-pal">
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="jump to tier or lesson…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
        />
        <div className="pg-pal-list" ref={listRef}>
          {results.length ? (
            results.map((it, i) => (
              <button
                key={`${it.tierId}:${it.topicId ?? "_"}`}
                className={`pg-pal-item${i === sel ? " is-sel" : ""}`}
                type="button"
                onMouseEnter={() => setSel(i)}
                onClick={() => choose(i)}
              >
                <span className="pg-pal-kind">{it.kind}</span>
                <span className="pg-pal-title">{it.title}</span>
                <span className="pg-pal-sub">{it.sub}</span>
              </button>
            ))
          ) : (
            <div className="pg-empty" style={{ padding: "18px 16px" }}>
              no match
            </div>
          )}
        </div>
        <div className="pg-pal-foot">↑↓ navigate · ⏎ open · esc close</div>
      </div>
    </div>
  );
}
