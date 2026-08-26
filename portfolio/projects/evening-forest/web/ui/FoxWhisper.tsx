import { useEffect, useState } from "react";
import { foxStore } from "../scene/fox/store";

const NEAR_DIST = 20;
const CYCLE_MS = 7000;
const POLL_MS = 250;

// A one-shot hint fired when the fox first comes close during a visit.
// The fox opens ~11 m ahead of the spawn vista, but heavy dusk grading and
// pixelation can still hide an orange silhouette among trunks — so when it
// is near and not fleeing, the forest whispers. Mounts fresh on every
// re-entry (the page renders it only while playing), so each visit gets
// its own chance of the moment.
export function FoxWhisper() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let shown = false;
    let hideTimer: number | undefined;
    const poll = window.setInterval(() => {
      if (shown) return;
      const snap = foxStore.snapshot;
      if (!snap || snap.dist > NEAR_DIST || snap.state === "flee") return;
      shown = true;
      setVisible(true);
      hideTimer = window.setTimeout(() => {
        hideTimer = undefined;
        setVisible(false);
      }, CYCLE_MS);
    }, POLL_MS);
    return () => {
      window.clearInterval(poll);
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;
  return (
    <div className="evening-forest-whisper" role="status">
      Something stirs between the trees…
    </div>
  );
}
