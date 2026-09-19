# Ledger — quicknotes · macOS Safari: SORT select + scrollbar consistency

Task: owner asked (1) the "SORT Last edited" select looks old-fashioned in macOS
Safari — make it consistent with the app chrome; (2) the desktop scrollbar is
white and a bit prominent — make it transparent, the way Practice Map's lesson
reader was done.

## Round R001
- Goal: two focused consistency fixes for macOS Safari — the native aqua
  select control and the native light overlay scrollbar.
- Preserved preferences: F002 (catalogue embed full-bleed); N015 (sort select
  14px on coarse pointers, mobile geometry untouched); practice-map owner law
  round 4 — the scrollbar must be VISIBLE and ink-consistent, neither white
  nor invisible (transparent track + quiet translucent thumb).
- Changes (quicknotes/css/style.css only):
  1. `color-scheme: dark` on `:root` — native chrome (select popup, overlay
     bars, form controls) followed the light scheme in Safari; now declared
     dark (practice-map lesson-overlay precedent).
  2. `#sort` + `#export-dlg select`: `appearance:none` + in-theme chevron
     (data-URI SVG, --fg2 stroke) + `padding-right:26px`; field bg/border/
     radius/geometry unchanged, mobile 40px target untouched.
  3. `#tree`, `#body`, `.preview`, `#pal-list`, `.preview pre`:
     `::-webkit-scrollbar` 8px, transparent track, thumb
     `rgba(215,218,224,.25)` rounded. NO standard scrollbar-width/color (the
     practice-map lesson: non-auto standard values make Safari 18+/Chrome
     121+ ignore the webkit pseudos and draw the engine default white bar).
- Before: artifacts/R001/before-sidebar.png · before-full.png ·
  scrollbar-edge-before-webkit.png
- After: artifacts/R001/after-sidebar.png · after-full.png ·
  scrollbar-edge-after-webkit.png
- Visual inspection:
  - Chromium headless 1440×800@2x: select verified — native chevron replaced
    by the thin theme chevron, field matches button chrome (before/after
    sidebar pair). Layout unbroken (full shots).
  - WebKit (Playwright webkit-2104 headless = the Safari engine) geometry
    probe: BEFORE scrollbar reserved 0–1px (native overlay); AFTER reserved
    8–9px (custom classic bar engaged) on #tree and #body — the styled-bar
    path is active.
  - LIMITATION: headless engines do not paint overlay/custom scrollbar thumbs
    in screenshots (Chromium overlay + headless webkit both omit them). The
    thumb PAINT is therefore NOT VISUALLY VERIFIED here; the CSS is
    byte-for-byte the pattern the owner device-verified on practice-map
    (visible, ink-consistent bar). On-device Safari check requested.
- Code verification: no build/typecheck applies (plain CSS in a static app);
  rendered both states via dev server (vite static plugin) — app boots,
  notes list/editor unchanged, no layout regressions observed in full shots.
- Open question: owner verdict on (a) the restyled SORT field and (b) the
  quiet 8px thumb — visible-but-quiet per the practice-map law, confirmed on
  real macOS Safari (headless cannot paint the thumb).

## Round R002
- Goal: add a copy button — click/tap copies the note content (the .md body)
  to the clipboard, consistent with the existing chrome.
- Preserved preferences: F002 (embed full-bleed); R001 chrome (themed
  selects, quiet scrollbar, color-scheme:dark) must stay untouched; meta-row
  discipline from the N-series (title never wraps, ✕ stays on row 1).
- Changes: `#copy-btn` (.btn) in the meta row between the view toggle and
  the path field; `copyActive()` in app.js — `navigator.clipboard.writeText`
  with an `execCommand("copy")` fallback for non-secure contexts; button
  flashes "Copied ✓" (or "Copy failed") for 1.2 s, then restores. No CSS
  change (inherits .btn). Small task — implemented directly, no chat-model
  relay (owner pre-approved relay only if it weren't small).
- Before: artifacts/R002/copy-before-meta.png
- After: artifacts/R002/copy-flash-meta.png · copy-mobile-meta.png ·
  copy-mobile-full.png
- Visual inspection:
  - Desktop 1440×800@2x: button sits between the path field and ✕, same
    bg/border/radius as the other buttons; flash state verified in shot
    ("Copied ✓" with focus ring from the click itself — same as any .btn).
  - Mobile 390×844: row 1 = title + Preview + Copy + ✕, path wraps below,
    zero horizontal overflow, ≥40px targets preserved (coarse .btn block).
- Code verification (Chromium headless + granted clipboard permissions):
  click → flash "Copied ✓" → restore "Copy"; clipboard read-back equals the
  active note body exactly (2809/2809 chars, eq:true).
- Open question: owner verdict on the button (label "Copy", flash feedback,
  placement between view toggle and path). Clipboard content = note body
  only (no title heading) — flag if a `# Title` prefix is wanted.

