import {
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  type KeyboardEvent,
} from "react";
import type { FreeReading } from "./useFreeReading";
import "./freeReading.css";

interface Props {
  fr: FreeReading;
  className?: string;
  /** Distinguishes the section for screen readers (heading or number). */
  label?: string;
}

export function FreeReadingText({ fr, className, label }: Props) {
  const [focused, setFocused] = useState(false);
  const liveId = useId();

  // Auto-grow: the textarea is the section body, so its height follows the
  // content (auto → scrollHeight) on every text or layout change.
  useLayoutEffect(() => {
    const el = fr.areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [fr.text, fr.areaRef]);

  // iOS virtual keyboard shrinks the visual viewport without scrolling the
  // page; when the focused surface drifts out of view, bring it back once.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const reveal = () => {
      const el = fr.areaRef.current;
      if (!el || document.activeElement !== el) return;
      const rect = el.getBoundingClientRect();
      const top = vv.offsetTop;
      const bottom = top + vv.height;
      if (rect.bottom > bottom || rect.top < top) {
        el.scrollIntoView({ block: "center" });
      }
    };
    vv.addEventListener("resize", reveal);
    return () => vv.removeEventListener("resize", reveal);
  }, [fr.areaRef]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") e.currentTarget.blur(); // a second Escape closes the lesson
  };

  return (
    <div className={`fr ${className ?? ""}`} data-focused={focused || undefined}>
      <textarea
        ref={fr.areaRef}
        className="fr-area"
        aria-label={
          label ?? "Section text — delete what you have read, type your notes freely"
        }
        aria-describedby={liveId}
        value={fr.text}
        onChange={(e) => fr.onText(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          fr.flush();
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        wrap="soft"
      />
      <span id={liveId} className="fr-visually-hidden" aria-live="polite">
        {fr.consumedWords} of {fr.totalWords} words read
      </span>
    </div>
  );
}
