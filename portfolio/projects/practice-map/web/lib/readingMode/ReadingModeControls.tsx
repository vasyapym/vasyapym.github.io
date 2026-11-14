import type { ReadingMode } from "./storage";

interface Props {
  mode: ReadingMode;
  hydrated: boolean;
  onChange: (next: ReadingMode) => void;
}

// The reading-mode pair (design D6): two pills in one group, the existing
// fr-controls grammar verbatim, mutually exclusive, both off = default
// prose. Nothing renders until hydrated — no wrong-state flash.
export function ReadingModeControls({ mode, hydrated, onChange }: Props) {
  if (!hydrated) return null;

  return (
    <div className="fr-controls reading-modes" role="group" aria-label="Reading mode">
      <button
        type="button"
        aria-pressed={mode === "free"}
        onClick={() => onChange(mode === "free" ? "prose" : "free")}
      >
        free reading: <span className="reading-mode-state">{mode === "free" ? "on" : "off"}</span>
      </button>
      <button
        type="button"
        aria-pressed={mode === "code"}
        onClick={() => onChange(mode === "code" ? "prose" : "code")}
      >
        read as code: <span className="reading-mode-state">{mode === "code" ? "on" : "off"}</span>
      </button>
    </div>
  );
}
