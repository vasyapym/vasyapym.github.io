import type { CodeTextSize, ReadingPresentation } from "./storage";

interface Props {
  presentation: ReadingPresentation;
  free: boolean;
  hydrated: boolean;
  /** The code voice the reader picked (styleguide §8.1). */
  size: CodeTextSize;
  sizeHydrated: boolean;
  onPresentation: (next: ReadingPresentation) => void;
  onFree: (next: boolean) => void;
  onCycleSize: () => void;
}

// The reading-modes pair (design D7): two pills in one group, the existing
// fr-controls grammar verbatim. Each pill flips only its own flag — both
// may be pressed at once, and the four states are the pills' four on/off
// readings (no fifth label, no combined badge). The size pill rides after
// the group as a sibling: it carries a value, not a state, so it is a plain
// button whose visible "size: 15" is its own accessible name (no
// aria-label — one that would hide the value), and it renders only while
// the code voice is on the page (it controls nothing visible otherwise).
// Nothing renders until hydrated — no wrong-state flash.
export function ReadingModeControls({
  presentation,
  free,
  hydrated,
  size,
  sizeHydrated,
  onPresentation,
  onFree,
  onCycleSize,
}: Props) {
  if (!hydrated) return null;

  return (
    <>
      <div className="fr-controls reading-modes" role="group" aria-label="Reading modes">
        <button
          type="button"
          aria-pressed={free}
          onClick={() => onFree(!free)}
        >
          free reading: <span className="reading-mode-state">{free ? "on" : "off"}</span>
        </button>
        <button
          type="button"
          aria-pressed={presentation === "code"}
          onClick={() => onPresentation(presentation === "code" ? "prose" : "code")}
        >
          read as code: <span className="reading-mode-state">{presentation === "code" ? "on" : "off"}</span>
        </button>
      </div>
      {sizeHydrated && presentation === "code" && (
        <button
          type="button"
          className="fr-size"
          onClick={onCycleSize}
        >
          size: {size === "github" ? "13.6" : size}
        </button>
      )}
    </>
  );
}
