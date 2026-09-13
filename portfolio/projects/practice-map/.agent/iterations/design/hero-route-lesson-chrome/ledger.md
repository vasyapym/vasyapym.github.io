# Design ledger — Practice Map: hero / route rail / free-reading toggle / lesson window

Historical ledger for the owner's visual feedback thread on the Practice Map page.
Historical context: the portfolio-wide design ledger lives in `docs/portfolio-redesign-handoff.md`
(Pass 20 — ink interior conversion; Pass 21 — deep-lesson reader; those passes' decisions,
e.g. lowercase mono chrome and the ink panel language, remain active constraints here).

## Round R001
- Goal: UI adjustments after the scope-trim pass — smaller hero ("deep lessons. / local notes." ~37% smaller), hero + route rail fitting organically, 2× pill for the free-reading toggle, lesson window +25% (950→~1190px), minimal lesson header.
- Preserved preferences: scope-trim pass decisions (status-quantity chrome removed; per-card status select stays; lowercase mono chrome).
- Changes: hero copy + clamp(1.15rem, calc((100vw - 72px)/31), 2.3rem); hero grid start-aligned hug-content panels; rail gap 1rem; lesson panel min(1190px, 100%); reading column capped 72ch centered; header padding/kicker/h2 minimalized; free-reading button 0.95rem pill (999px).
- Before: pre-round state (hero 59px two-line plate; strip + chips present; 950px panel; toggle in a dedicated sticky bar row).
- After: artifacts/R001/hero-desktop.png, artifacts/R001/hero-narrow.png, artifacts/R001/lesson-wide-pill.png (rendered state of commit 847156f).
- Visual inspection: performed on desktop 1440 / 1024 / 390 (screenshots); hero pair + lesson header inspected; assertions 11/11 in the ad-hoc probe.
- Code verification: typecheck PASS, build PASS (commit 847156f pushed).
- Open question: none — round shipped; owner feedback arrived (see F001–F004).

## Feedback F001
- Round: R001
- Verdict: REJECTED
- Scope: free-reading toggle button, font treatment, lesson overlay, all viewports
- Decision: the button's font reads as inconsistent with the rest of the UI chrome — bring it into the page's mono chrome language.
- User source: "'free reading: on' - change the font. it doesnt look consistent."
- Artifact: artifacts/R001/lesson-wide-pill.png
- Supersedes: none

## Feedback F002
- Round: R001
- Verdict: REJECTED
- Scope: free-reading toggle button, layout position, lesson overlay, all viewports
- Decision: the toggle must not dedicate its own layout row/bar; it lives beside the "X" close button in the lesson header.
- User source: "also the button takes space. insetead of it dont dedicate space to it. it can be nearby the 'X' button."
- Artifact: artifacts/R001/lesson-wide-pill.png
- Supersedes: none

## Feedback F003
- Round: R001
- Verdict: REJECTED
- Scope: reading text column width, deep-lesson reader, desktop
- Decision: the reading column (~634px at 72ch inside the widened 1190px frame) looks squeezed; widen by ~35%.
- User source: "also increase text itself width. currently it looks squeezed. make it around larger 35%."
- Artifact: artifacts/R001/lesson-wide-pill.png
- Supersedes: none

## Feedback F004
- Round: R001
- Verdict: REJECTED
- Scope: hero copy card + route/concept-graph rail composition, desktop hero band
- Decision: the hero pair must fit together organically with no awkward free space; the prior pass left the composition unbalanced (pair packed left, dead run of field to its right) and the owner read this as the section being ignored.
- User source: "also this - Route / Concept Graph Section ... Make the hero section and this route section fit together organically. Remove awkward free space between them. . you completely ignored that one section"
- Artifact: artifacts/R001/hero-desktop.png
- Supersedes: none

## Round R002
- Goal: address F001–F004 — toggle becomes header chrome beside the close button (no dedicated bar row, consistent mono chrome, breathing label), reading column widened ~35%, hero pair centered as one unit.
- Preserved preferences: scope-trim pass decisions (strip stays removed, status select stays, hero copy "deep lessons. / local notes." retained per R001).
- Changes:
  - `PracticeMapPage.tsx` — FreeReadingControls moved into `.practice-lesson-header` inside a new `.practice-lesson-tools` slot next to the close button; the dedicated `.practice-free-bar` row removed from the scroll body.
  - `freeReading.css` — `.practice-free-bar` rules deleted; `.fr-controls button` → chrome-consistent mono (0.72rem, lowercase, letter-spacing 0.08em, wide 1.3rem sides for label room, 999px pill radius); narrow-phone media trims the pill (0.62rem, 0.85rem sides) so the lesson title keeps its reading width.
  - `practice-map.css` — reading column 72ch → 97ch (+36.7% measured: 681→931px); `.practice-lesson-tools` slot (flex, 0.75rem gap); hero band `justify-content: center` (pair reads as one balanced unit); mobile ≤700px header wraps the tools under the full-width title.
- Before: artifacts/R001/*
- After: artifacts/R002/hero-desktop.png, artifacts/R002/hero-1024.png, artifacts/R002/hero-narrow.png, artifacts/R002/lesson-wide-pill-on.png
- Visual inspection: performed — hero pair centered (copy card 276×126, rail 342×191, gap 40, balanced margins), pill sits left of X on one line at 1440, pressed state renders; mobile header wraps tools under the full-width title (title 266px); reading column 931px ≈ +36.7% vs the 72ch state; no overflow, no console errors in the ad-hoc probe (13/13 assertions).
- Code verification: typecheck PASS, build PASS; full `practice-map.check.mjs` 93 ok / 1 fail — the sole fail is the documented pre-existing environment failure (`ArrowRight advances sections`, chromium-1134 focus-on-nav-chip smooth-scroll quirk). The stale `~950px` panel-width expectation was retargeted to ~1190px because the +25% widening is the owner's requested behavior this round (not a weakened gate).
- Open question: F003 interpretation — "increase the text/label width by ~35%" is implemented as the READER column +35% (72→97ch) AND a breathing label zone in the pill (tracking + wide sides at the chrome-consistent 0.72rem). If the owner meant the pill itself should render wider instead, say so and the pill gets the growth instead.
- Open question: approval of the round as presented (hero pair centered; pill in header; column 97ch).
