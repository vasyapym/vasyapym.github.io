import type { ReadingPresentation } from "./storage";

interface Props {
  presentation: ReadingPresentation;
  free: boolean;
  hydrated: boolean;
  onPresentation: (next: ReadingPresentation) => void;
  onFree: (next: boolean) => void;
}

// The reading-modes pair (design D7): two pills in one group, the existing
// fr-controls grammar verbatim. Each pill flips only its own flag — both
// may be pressed at once, and the four states are the pills' four on/off
// readings (no fifth label, no combined badge). Nothing renders until
// hydrated — no wrong-state flash.
export function ReadingModeControls({
  presentation,
  free,
  hydrated,
  onPresentation,
  onFree,
}: Props) {
  if (!hydrated) return null;

  return (
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
  );
}
