import type { UnitGranularity } from "./types";

interface Props {
  enabled: boolean;
  granularity: UnitGranularity;
  hydrated: boolean;
  onToggle: (next: boolean) => void;
  onGranularity: (next: UnitGranularity) => void;
}

export function ShadowTypingControls({
  enabled,
  granularity,
  hydrated,
  onToggle,
  onGranularity,
}: Props) {
  if (!hydrated) return null; // avoid flashing the wrong state during hydration

  return (
    <div className="st-controls" role="group" aria-label="Shadow typing">
      <button type="button" aria-pressed={enabled} onClick={() => onToggle(!enabled)}>
        shadow typing: {enabled ? "on" : "off"}
      </button>

      {enabled && (
        <label className="st-unit-size">
          unit{" "}
          <select
            value={granularity}
            onChange={(e) => onGranularity(e.target.value as UnitGranularity)}
          >
            <option value="word">word</option>
            <option value="sentence">sentence</option>
          </select>
        </label>
      )}
    </div>
  );
}
