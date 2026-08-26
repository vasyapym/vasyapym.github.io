import { useEffect, useState } from "react";
import { foxStore, type FoxPublicSnapshot } from "../scene/fox/store";

const POLL_MS = 200;

// Live readout of the fox's mind, for the humans watching it. The panel
// polls the shared snapshot at 5 Hz — the fox's frame loop never touches
// React, so the HUD costs nothing while hidden and near-nothing while open.
const STATE_META = {
  wander: {
    label: "Trotting about",
    flavor: "off on its own errands",
  },
  alert: {
    label: "Noticed you",
    flavor: "frozen mid-step, watching",
  },
  curious: {
    label: "Curious",
    flavor: "creeps closer — stay still",
  },
  flee: {
    label: "Fleeing",
    flavor: "you moved too suddenly",
  },
} as const;

export function FoxMind() {
  const [snap, setSnap] = useState<FoxPublicSnapshot | null>(
    () => foxStore.snapshot,
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = foxStore.snapshot;
      setSnap((prev) =>
        prev?.state === next?.state && prev?.dist === next?.dist
          ? prev
          : next
            ? { ...next }
            : null,
      );
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  if (!snap) return null;
  const meta = STATE_META[snap.state];

  return (
    <div className="ef-fox-mind" data-state={snap.state} role="status">
      <div className="ef-fox-mind-head">
        <span className="ef-fox-mind-dot" aria-hidden="true" />
        <span className="ef-fox-mind-state">{meta.label}</span>
        <span className="ef-fox-mind-dist">{Math.round(snap.dist)} m</span>
      </div>
      <div className="ef-fox-mind-flavor">{meta.flavor}</div>
    </div>
  );
}
