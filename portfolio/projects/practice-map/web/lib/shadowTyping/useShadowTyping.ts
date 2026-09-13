import { useCallback, useMemo, useState } from "react";
import { charsEqual, fnv1a, isWhitespace, segmentUnits } from "./text";
import { useShadowProgress, writeShadowProgress } from "./storage";
import type {
  CharState,
  ShadowTypingOptions,
  Unit,
  UnitGranularity,
} from "./types";

export function useShadowTyping(opts: ShadowTypingOptions) {
  const {
    topicId,
    text,
    enabled,
    granularity,
    caseSensitive = false,
    allowSkip = true,
  } = opts;

  const { value: progress } = useShadowProgress(topicId);

  const units = useMemo(() => segmentUnits(text, granularity), [text, granularity]);
  const contentHash = useMemo(() => fnv1a(`${granularity}|${text}`), [granularity, text]);

  const contentMatches = !!progress && progress.contentHash === contentHash;
  const index = contentMatches ? Math.min(progress.consumed, units.length) : 0;
  /** True when saved progress exists for this stream but the text has since changed. */
  const staleProgress = !!progress && progress.consumed > 0 && !contentMatches;

  // ---- transient (non-persisted) state -------------------------------------
  const [buffer, setBuffer] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [skipped, setSkipped] = useState(0);

  // Reset transient state when stream/size changes (state-during-render pattern).
  const resetKey = `${topicId}|${contentHash}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setBuffer([]);
    setMistakes(0);
    setSkipped(0);
  }

  // ---- persistence helper ---------------------------------------------------
  const commit = useCallback(
    (consumed: number) => {
      writeShadowProgress(topicId, {
        v: 1,
        consumed,
        contentHash,
        updatedAt: Date.now(),
      });
    },
    [topicId, contentHash],
  );

  // ---- derived ----------------------------------------------------------------
  const current: Unit | null = units[index] ?? null;
  const done = enabled && units.length > 0 && index >= units.length;

  const charStates = useMemo<CharState[]>(() => {
    if (!current) return [];
    return current.chars.map((ch, i) =>
      i >= buffer.length
        ? "pending"
        : charsEqual(buffer[i], ch, caseSensitive)
          ? "correct"
          : "incorrect",
    );
  }, [current, buffer, caseSensitive]);

  // ---- actions ----------------------------------------------------------------
  const type = useCallback(
    (data: string) => {
      if (!enabled) return;
      let idx = index;
      let buf = buffer.slice();
      let newMistakes = 0;

      for (const raw of Array.from(data)) {
        const unit = units[idx];
        if (!unit) break;
        const target = unit.chars;

        if (buf.length === 0 && isWhitespace(raw)) continue; // ignore leading space/enter
        if (buf.length >= target.length) continue; // wrong tail: must backspace

        buf.push(raw);
        if (!charsEqual(raw, target[buf.length - 1], caseSensitive)) newMistakes++;

        const complete =
          buf.length === target.length &&
          buf.every((c, i) => charsEqual(c, target[i], caseSensitive));
        if (complete) {
          idx++;
          buf = [];
        }
      }

      if (newMistakes) setMistakes((m) => m + newMistakes);
      setBuffer(buf);
      if (idx !== index) commit(idx);
    },
    [enabled, index, buffer, units, caseSensitive, commit],
  );

  const backspace = useCallback((word = false) => {
    setBuffer((b) => (word ? [] : b.slice(0, -1)));
  }, []);

  const skip = useCallback(() => {
    if (!enabled || !allowSkip || !current) return;
    setSkipped((s) => s + 1);
    setBuffer([]);
    commit(index + 1);
  }, [enabled, allowSkip, current, index, commit]);

  const reset = useCallback(() => {
    setBuffer([]);
    setMistakes(0);
    setSkipped(0);
    commit(0);
  }, [commit]);

  return {
    // status
    enabled,
    done,
    staleProgress,
    // content
    text,
    units,
    granularity,
    index,
    current,
    buffer,
    charStates,
    total: units.length,
    remaining: Math.max(0, units.length - index),
    mistakes,
    skipped,
    allowSkip,
    // actions
    type,
    backspace,
    skip,
    reset,
  };
}

export type ShadowTyping = ReturnType<typeof useShadowTyping>;
