// web/QuicknotesPage.tsx — React page hosting the static quicknotes app.
//
// Quicknotes is a plain ES-module app served as-is from /quicknotes/ (vite
// plugin in dev, bundle assets in build), so the page is a full-bleed frame
// around it: the app owns its own header, drawer and dialogs, and React only
// supplies the catalogue chrome around the embed.
import { useEffect } from "react";

export default function QuicknotesPage() {
  // Host-side pin: a stranded pan can live on the TOP window and the iframe's
  // own vv may not fire for it. This page has zero scrollable overflow, so
  // re-pinning on offsetTop>0 can never fight a legitimate scroll.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const pin = () => { if (vv.offsetTop > 1) window.scrollTo(0, 0); };
    vv.addEventListener("scroll", pin);
    vv.addEventListener("resize", pin);
    return () => {
      vv.removeEventListener("scroll", pin);
      vv.removeEventListener("resize", pin);
    };
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
