import {
  useLayoutEffect,
  useState,
  type KeyboardEvent,
} from "react";
import type { FreeReading } from "./useFreeReading";
import "./freeReading.css";

interface Props {
  fr: FreeReading;
  className?: string;
}

export function FreeReadingText({ fr, className }: Props) {
  const [focused, setFocused] = useState(false);

  // Auto-grow: the textarea is the section body, so its height follows the
  // content (auto → scrollHeight) on every text or layout change.
  useLayoutEffect(() => {
    const el = fr.areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [fr.text, fr.areaRef]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") e.currentTarget.blur(); // a second Escape closes the lesson
  };

  return (
    <div className={`fr ${className ?? ""}`} data-focused={focused || undefined}>
      <textarea
        ref={fr.areaRef}
        className="fr-area"
        aria-label="Section text — delete what you have read, type your notes freely"
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
    </div>
  );
}
