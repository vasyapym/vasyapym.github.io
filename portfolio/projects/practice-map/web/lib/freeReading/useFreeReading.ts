import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fnv1a, remainingTokens, tokenize } from "./text";
import { removeFreeText, useFreeText, writeFreeText } from "./storage";
import type { FreeReadingOptions } from "./types";

export function useFreeReading(opts: FreeReadingOptions) {
  const { sectionKey, original, enabled, debounceMs = 300 } = opts;

  const { value: saved } = useFreeText(sectionKey);

  const contentHash = useMemo(() => fnv1a(original), [original]);
  const originalTokens = useMemo(() => tokenize(original), [original]);
  const totalWords = originalTokens.length;

  /** Saved text belongs to an older version of the section. */
  const stale = !!saved && saved.contentHash !== contentHash;

  // Local mirror so typing never waits on persistence; seeded once from the
  // store when the record matches the current section content.
  const [text, setText] = useState<string>(() =>
    saved && saved.contentHash === contentHash ? saved.text : original,
  );

  // Adopt external edits (another tab) only when this surface isn't being
  // edited — never yank the text out from under an active caret.
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const textRef = useRef(text);
  textRef.current = text;
  useEffect(() => {
    if (!saved || saved.contentHash !== contentHash) return;
    if (saved.text === textRef.current) return;
    if (document.activeElement === areaRef.current) return;
    setText(saved.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  // ---- debounced persistence -----------------------------------------------
  const timer = useRef<number | null>(null);
  const pending = useRef<string | null>(null);

  const flush = useCallback(() => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const t = pending.current;
    if (t == null) return;
    pending.current = null;
    if (t === original) {
      removeFreeText(sectionKey); // back to pristine → nothing worth saving
      return;
    }
    writeFreeText(sectionKey, {
      v: 2,
      contentHash,
      text: t,
      updatedAt: Date.now(),
    });
  }, [sectionKey, contentHash, original]);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const onText = useCallback(
    (t: string) => {
      setText(t);
      if (!enabled) return;
      if (t === original) {
        pending.current = null;
        if (timer.current != null) {
          window.clearTimeout(timer.current);
          timer.current = null;
        }
        removeFreeText(sectionKey);
        return;
      }
      pending.current = t;
      if (timer.current == null) {
        timer.current = window.setTimeout(() => {
          timer.current = null;
          flushRef.current();
        }, debounceMs);
      }
    },
    [enabled, original, sectionKey, debounceMs],
  );

  // Flush on unmount, on tab hide, and on unload — a debounced write must
  // never outlive the surface it belongs to.
  useEffect(() => {
    return () => flushRef.current();
  }, []);
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") flushRef.current();
    };
    window.addEventListener("beforeunload", flushRef.current);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("beforeunload", flushRef.current);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, []);

  const reset = useCallback(() => {
    pending.current = null;
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setText(original);
    removeFreeText(sectionKey);
  }, [original, sectionKey]);

  const consumedWords = useMemo(() => {
    if (totalWords === 0) return 0;
    const remaining = remainingTokens(originalTokens, tokenize(text));
    return Math.min(totalWords, totalWords - remaining);
  }, [originalTokens, text, totalWords]);

  return {
    enabled,
    stale,
    text,
    onText,
    flush,
    reset,
    pristine: text === original,
    areaRef,
    consumedWords,
    totalWords,
  };
}

export type FreeReading = ReturnType<typeof useFreeReading>;
