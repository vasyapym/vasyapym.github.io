import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { ShadowTyping } from "./useShadowTyping";
import type { CharState, Unit } from "./types";

interface Props {
  st: ShadowTyping;
  /**
   * Whether this stream is the one being read (the scrollspy's active
   * section). Only the active stream auto-focuses its hidden input — ten
   * sections all claiming focus would leave the keystrokes in the last
   * one, far from the reader's eye.
   */
  active?: boolean;
  className?: string;
  /** Rendered when the mode is off. Defaults to the plain text. */
  children?: ReactNode;
}

export function ShadowTypingText({ st, active = true, className, children }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKey = useRef("");
  const stRef = useRef<ShadowTyping | null>(null);
  const liveId = useId();
  const [focused, setFocused] = useState(false);
  const [ghost, setGhost] = useState<Unit | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    stRef.current = st;
  });

  // Native beforeinput, not React's synthetic onBeforeInput: React polyfills
  // that event without inputType, so keystroke routing needs the native one.
  // The input listener is the fallback for insertions beforeinput doesn't
  // route (CDP insertText emulates them as insertCompositionText); the
  // input is drained back to empty and its new value typed out.
  useEffect(() => {
    const input = inputRef.current;
    if (!input || !st.enabled) return;
    const stNow = () => stRef.current;
    const onNativeBeforeInput = (event: Event) => {
      const ev = event as InputEvent;
      const st = stNow();
      if (!st || ev.isComposing) return; // let IME finish; handled on compositionend
      // Prevent only the types this handler routes itself; everything else
      // (CDP insertText arrives as insertCompositionText, IME spills) falls
      // through to the input listener, which drains and types the value.
      if (ev.inputType === "insertText" && ev.data) {
        ev.preventDefault();
        st.type(ev.data);
      } else if (
        typeof ev.inputType === "string" &&
        ev.inputType.startsWith("delete") &&
        lastKey.current !== "Backspace"
      ) {
        ev.preventDefault();
        st.backspace(ev.inputType === "deleteWordBackward"); // virtual keyboards w/o keydown
      }
    };
    const onNativeInput = () => {
      const value = input.value;
      if (!value) return;
      input.value = "";
      stNow()?.type(value);
    };
    input.addEventListener("beforeinput", onNativeBeforeInput);
    input.addEventListener("input", onNativeInput);
    return () => {
      input.removeEventListener("beforeinput", onNativeBeforeInput);
      input.removeEventListener("input", onNativeInput);
    };
  }, [st.enabled]);

  // Detect consumption to spawn the "deleted" ghost + a11y announcement.
  const [seenIndex, setSeenIndex] = useState(st.index);
  if (seenIndex !== st.index) {
    setSeenIndex(st.index);
    if (st.index > seenIndex) {
      const consumed = st.units[st.index - 1];
      setGhost(consumed ?? null);
      setAnnouncement(
        st.index >= st.total
          ? `All ${st.total} units consumed. ${st.mistakes} mistakes.`
          : `${consumed?.text ?? ""} consumed. ${st.remaining} remaining.`,
      );
    } else {
      setGhost(null);
    }
  }
  // Backstop so a ghost never sticks if animationend doesn't fire (reduced motion).
  useEffect(() => {
    if (!ghost) return;
    const t = setTimeout(() => setGhost(null), 400);
    return () => clearTimeout(t);
  }, [ghost]);

  const focusInput = () => inputRef.current?.focus({ preventScroll: true });
  useEffect(() => {
    if (st.enabled && !st.done && active) focusInput();
    // A completed stream hands focus over implicitly: the reader scrolls
    // on, the scrollspy names the next section, `active` flips there.
  }, [st.enabled, st.done, active]);

  if (!st.enabled) {
    return <div className={className}>{children ?? <p className="st-text">{st.text}</p>}</div>;
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    lastKey.current = e.key;
    switch (e.key) {
      case "Backspace":
        e.preventDefault();
        st.backspace(e.ctrlKey || e.altKey || e.metaKey);
        break;
      case "Tab":
        if (st.allowSkip && !e.shiftKey) {
          e.preventDefault();
          st.skip();
        }
        break;
      case "Escape":
        e.currentTarget.blur();
        break;
    }
  };

  return (
    <div
      className={`st ${className ?? ""}`}
      data-focused={focused || undefined}
      data-done={st.done || undefined}
      onClick={focusInput}
    >
      <input
        ref={inputRef}
        className="st-input"
        aria-label="Shadow typing input"
        aria-describedby={liveId}
        value=""
        onChange={() => {}}
        onCompositionEnd={(e) => e.data && st.type(e.data)}
        onKeyDown={onKeyDown}
        onKeyUp={() => {
          lastKey.current = "";
        }}
        onPaste={(e) => e.preventDefault()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
      />

      <p className="st-text" aria-hidden="true">
        {ghost && (
          <span key={`ghost-${ghost.id}`} className="st-ghost" onAnimationEnd={() => setGhost(null)}>
            {ghost.text}
            {ghost.trailing}
          </span>
        )}
        {st.current && (
          <CurrentUnit unit={st.current} charStates={st.charStates} caretAt={st.buffer.length} />
        )}
        {st.units.slice(st.index + 1).map((u) => (
          <span key={u.id} className="st-unit st-unit--pending">
            {u.text}
            {u.trailing}
          </span>
        ))}
        {st.done && (
          <span className="st-done">
            ✓ everything consumed — {st.mistakes} mistakes, {st.skipped} skipped
          </span>
        )}
      </p>

      <p id={liveId} className="st-visually-hidden" role="status" aria-live="polite">
        {announcement ||
          `Shadow typing on. Type the highlighted text to consume it. ${st.remaining} of ${st.total} remaining.`}
      </p>
    </div>
  );
}

function CurrentUnit({
  unit,
  charStates,
  caretAt,
}: {
  unit: Unit;
  charStates: CharState[];
  caretAt: number;
}) {
  return (
    <span className="st-unit st-unit--current">
      {unit.chars.map((ch, i) => (
        <span key={i} className="st-char" data-state={charStates[i]} data-caret={i === caretAt || undefined}>
          {ch}
        </span>
      ))}
      {unit.trailing}
    </span>
  );
}
