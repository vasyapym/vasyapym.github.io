// web/QuicknotesPage.tsx — React page hosting the static quicknotes app.
//
// Quicknotes is a plain ES-module app served as-is from /quicknotes/ (vite
// plugin in dev, bundle assets in build), so the page is a full-bleed frame
// around it: the app owns its own header, drawer and dialogs, and React only
// supplies the catalogue chrome around the embed.
import { useEffect } from "react";

export default function QuicknotesPage() {
  // N030: the per-event scrollTo(0,0) pin is REMOVED — N028 proved it cannot
  // undo a keyboard-held visual-viewport pan (the slide persisted with the
  // pin live) and it is the rejected "fight" pattern. Prevention now lives
  // in the app (pre-focus tap pipeline). This keeps only a ONE-SHOT restore
  // for a stranded pan after keyboard dismissal (vv height grows back).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let lastH = vv.height;
    const onResize = () => {
      const grew = vv.height - lastH > 80; // keyboard just dismissed
      lastH = vv.height;
      if (grew && vv.offsetTop > 1) window.scrollTo(0, 0);
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="quicknotes-host">
      <iframe
        src="/quicknotes/"
        title="Quicknotes"
        className="quicknotes-frame"
      />
    </div>
  );
}
