interface Props {
  enabled: boolean;
  hydrated: boolean;
  onToggle: (next: boolean) => void;
}

export function FreeReadingControls({ enabled, hydrated, onToggle }: Props) {
  if (!hydrated) return null; // avoid flashing the wrong state during hydration

  return (
    <div className="fr-controls" role="group" aria-label="Free reading">
      <button type="button" aria-pressed={enabled} onClick={() => onToggle(!enabled)}>
        free reading: {enabled ? "on" : "off"}
      </button>
    </div>
  );
}
