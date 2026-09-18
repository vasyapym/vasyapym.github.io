# Task brief — Quicknotes iOS round N015: dismiss settle, focus-zoom off, band colour

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own the implementation choices inside the stated goals: deliberate, decide, ship one coherent answer. Do not redesign anything beyond the three goals; the rest of the app is fixed.

## 1. Context

A static, no-build notes app (vanilla HTML/CSS/ES modules) — standalone at `/quicknotes/` and embedded in a React+Vite catalogue page inside a same-origin iframe (the catalogue page is exactly the dynamic viewport: a topbar + `height:100dvh` flex frame with `overflow:hidden` — do not touch that, it fixed an earlier bug). iPhone Safari. iOS Safari facts that drive this task:

- **Focus-zoom rule:** focusing a field whose computed font-size is <16px makes Safari zoom the page to the field; dismissing zooms back out. The app deliberately runs 13px fields (`#search`, `#body`, `#path`) — the owner accepted small text but rejects the zoom-in/zoom-out cycle. `maximum-scale=1` in the viewport meta disables the focus auto-zoom while pinch-zoom still works (Safari ignores maximum-scale for the pinch gesture since iOS 10). The zoom decision for a field inside an iframe may be governed by the TOP document's viewport meta — so both documents need it.
- **Visual-viewport pan:** keyboard open/close can leave the visual viewport panned (`visualViewport.offsetTop > 0`). WebKit fires vv `scroll` events only when the gesture finishes; the dismiss animation is ~250–300ms and iOS may re-pan after a first correction lands. In the iframe card the surviving pan can live on the TOP window, and the iframe's own `visualViewport` may not fire for it — so the host page needs its own vv listener.
- The white band: after dismissal, the region behind the keyboard shows the **catalogue body background `--index-bg: #e4e5e1` (light paper)** — the host document ends exactly at the frame's bottom edge (`100dvh`), so any stranded top-window pan exposes it. The app's own band (inside the iframe) is dark `#0f1115`.

## 2. Goals

1. **Kill the focus zoom, keep 13px:** add `maximum-scale=1` to the viewport meta of BOTH `quicknotes/index.html` and the catalogue `portfolio/shell/index.html` (current lines verbatim in §2). Keep `viewport-fit=cover` and the app's `interactive-widget=resizes-content`.
2. **"Done" returns the page:** replace the app's vv-settle block (current code verbatim in §2) with a robust dismiss settle: a short **settling loop** (e.g. re-assert at ~0/120/300ms after focusout / vv resize, gated to mobile) that checks `visualViewport.offsetTop > 0` as a FACT and re-pins (`window.scrollTo(0,0)`, plus `window.parent.scrollTo(0,0)` when framed, try/catch) and rewrites `--app-h` from `visualViewport.height`. Keep the D6 ordering (pin before fit before fitPalette) and the rAF coalescing for event bursts. Do not remove the existing listeners; evolve this section.
3. **Host-side pin:** in `portfolio/shell/src/web/QuicknotesPage.tsx` (verbatim in §2) add a `useEffect` that listens to the HOST window's `visualViewport` (`scroll` + `resize`) and re-pins the host (`window.scrollTo(0,0)`) when `offsetTop > 0` — safe because after the earlier fix this page has zero scrollable overflow, so the pin can never fight a legitimate scroll. Clean up on unmount.
4. **Band insurance (cosmetic):** the catalogue body behind the quicknotes card shows light `--index-bg` when the top window is panned. Add one scoped rule — `body:has(.quicknotes-frame) { background: #0b1317; }` (the ink dark used by the frame) — into `portfolio/shell/src/styles.css` near the quicknotes host block, so any residual band reads dark instead of white. Do not touch other pages.

Fixed points: vanilla ES modules (app), React+vite (catalogue); no new dependencies; desktop (>760px) and the drawer/safe-area/auto-hide machinery untouched; the `body{height:var(--app-h,100dvh)}` contract stays; do not change font sizes.

## 3. Verbatim current code (the only source of truth)

### `quicknotes/js/app.js` — the vv section to replace (from the section header through the `focusout` line; everything above/below stays)

```js
// ---------- keyboard-proof app box + visual-viewport pin ----------
// dvh ignores the software keyboard: when the caret would sit under it, iOS
// pans the visual viewport (the tap-shift + "second layout level" feel).
// Sizing the app grid to the real visible box (visualViewport.height) keeps
// the caret above the keyboard so there is nothing to pan. Mobile-only; the
// CSS fallback stays 100dvh. Pairs with fitPalette (same mechanism).
function fitViewport() {
  if (!narrow.matches) { document.documentElement.style.removeProperty("--app-h"); return; }
  const vv = window.visualViewport;
  document.documentElement.style.setProperty("--app-h", (vv ? vv.height : window.innerHeight) + "px");
}
// H3: fitViewport sizes to vv.height but iOS can leave the visual viewport
// PANNED (offsetTop > 0) after the keyboard opens/closes. Since the grid is
// anchored at layout-top (y=0) but the visible box is shifted down, the header
// slides above the box, the last list row hides in the offset region below it
// ("scrolls only once the header is gone" / last element unreachable), and on
// dismiss a dark band (layout-viewport bg) shows under the app. The grid is
// already sized to the visible box, so RE-PINNING that box to the layout top
// is always the correct resolution — one line clears symptoms 3 and 4b.
// N013 hardening: in the catalogue card the surviving band can be HOST-level
// (the iframe is taller than the visible box), which this window's scrollTo
// can never reset — so when framed, re-pin the same-origin parent too.
function pinViewport() {
  const vv = window.visualViewport;
  if (vv && vv.offsetTop > 0) {
    window.scrollTo(0, 0);
    try { if (window.self !== window.top) window.parent.scrollTo(0, 0); } catch { /* cross-origin */ }
  }
}
// WebKit fires vv scroll events only when a gesture FINISHES (wkbug 218465),
// and iOS can re-pan after our scrollTo lands. D6 ordering still holds — pin
// runs before fit/fitPalette inside the same rAF, so the palette reads a
// settled offsetTop — but the settle is coalesced into one frame, with one
// delayed re-assert catching a post-burst re-pan.
let settleQueued = false;
function settleViewport() {
  pinViewport();
  fitViewport();
  fitPalette();
}
function onViewport() {
  if (settleQueued) return;
  settleQueued = true;
  requestAnimationFrame(() => { settleQueued = false; settleViewport(); });
  setTimeout(() => { if (window.visualViewport?.offsetTop > 0) settleViewport(); }, 140);
}
window.visualViewport?.addEventListener("resize", onViewport);
window.visualViewport?.addEventListener("scroll", onViewport);
narrow.addEventListener?.("change", onViewport);
// Keyboard close: vv resize may lag the dismissal on some iOS builds; a blur
// of any field re-runs the settle shortly after, clearing a stranded band.
window.addEventListener("focusout", () => { if (narrow.matches) setTimeout(onViewport, 80); });
```

### `quicknotes/index.html` — current viewport meta (line 5)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
```

### `portfolio/shell/index.html` — current viewport meta (line 5)

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### `portfolio/shell/src/web/QuicknotesPage.tsx`

```tsx
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
```

## 4. Output contract

- Reply with only the changed fragments, each in a fenced block headed by its exact path:
  - both viewport meta lines (full replacement lines),
  - `quicknotes/js/app.js`: the **complete replacement of the vv section only** (from `// ---------- keyboard-proof app box` through the `focusout` line inclusive — same boundaries as §2), nothing else,
  - `portfolio/shell/src/web/QuicknotesPage.tsx`: the complete file,
  - the one CSS rule for `portfolio/shell/src/styles.css` + a one-line placement note.
- **≤ ~90 lines total**, no prose beyond one line per fragment.
- Acceptance (owner device pass): typing at 13px never zooms; pinch-zoom still works; after "Done" the content returns to its position (no stranded pan) in both standalone and the catalogue card; no black or white band below the app; desktop unchanged.
