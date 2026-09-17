// web/QuicknotesPage.tsx — React page hosting the static quicknotes app.
//
// Quicknotes is a plain ES-module app served as-is from /quicknotes/ (vite
// plugin in dev, bundle assets in build), so the page is a full-bleed frame
// around it: the app owns its own header, drawer and dialogs, and React only
// supplies the catalogue chrome around the embed.

export default function QuicknotesPage() {
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
