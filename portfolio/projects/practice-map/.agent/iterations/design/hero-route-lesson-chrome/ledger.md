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

## Feedback F005
- Round: R002
- Verdict: REJECTED
- Scope: "+xx more" concepts toggle, font scale, lesson cards, all viewports
- Decision: the toggle renders larger than the surrounding concept chips — its font size must match the chips'; keep a low-key click affordance (subtle underline / hover-focus shift), no prominence.
- User source: "In lesson cards, the '+xx more' button text is larger than the surrounding tag text ... Please match the '+xx more' font size to the tag font size. Since it is still an interactive element, keep a low-key visual affordance ..."
- Artifact: artifacts/R002/hero-desktop.png
- Supersedes: none

## Feedback F006
- Round: R002
- Verdict: REJECTED
- Scope: per-card status selector, lesson cards (listing)
- Decision: the "Status: Queued (etc.)" selector is too prominent on cards — remove it from the listing; if status still needs editing, it belongs inside the lesson window.
- User source: "De-emphasize status on lesson cards Remove the 'Status: Queued' (etc.) selector from lesson cards—it's too prominent and adds visual noise. If status still needs to be shown, maybe put that option within lesson window. not listing of lessons"
- Artifact: artifacts/R002/hero-desktop.png
- Supersedes: none

## Feedback F007
- Round: R002
- Verdict: REJECTED
- Scope: corner geometry of the close X (lesson overlay), search input (listing), open-lesson button (cards)
- Decision: give these three controls rounded (pill) corners — the control family turns rounded.
- User source: "1. In the lesson window, make the 'X' button rounded. 2. On the lessons listing page, give the search section rounded corners as well. 3. Give the 'Open Lesson' button rounded corners too."
- Artifact: artifacts/R002/lesson-wide-pill-on.png
- Supersedes: none

## Feedback F008
- Round: R002
- Verdict: REJECTED
- Scope: hero copy card + route/concept-graph rail, desktop hero band
- Decision: the centered pair and the size mismatch (rail ~1.9× the copy card by area) read worse than before — the cards must be the same size and the pair must not be centered.
- User source: "The hero section and concept graph section are now worse than before: The concept graph is about twice as large (they should be the same size). These sections are awkwardly centered, and they shouldn't be."
- Artifact: artifacts/R002/hero-desktop.png
- Supersedes: F004 (the R002 centering treatment is superseded by this explicit verdict)

## Round R003
- Goal: address F005–F008 — matched toggle/chip type scale with a quiet affordance, status editing relocated into the lesson window (card listing de-noised), pill rounding for X/search/open-lesson, equal-size left-packed hero pair.
- Preserved preferences: R002-approved placement of the free-reading pill beside the close X; scope-trim removals; hero copy "deep lessons. / local notes.".
- Changes:
  - Root-cause fix for F005: deleted the `.practice-map-page button/select/textarea { font: inherit }` reset — its (0,1,1) specificity overrode every (0,1,0) class rule, inflating `.practice-concepts-toggle`, `.practice-lesson-open`, `.practice-search-clear`, `.practice-map-reset` etc. to 16px. After deletion each control renders its declared chrome size (measured: toggle 10.88px == chips 10.88px; open-lesson 11.52px). The toggle gains a quiet underline (60% faint) + hover/focus accent state.
  - F006: per-card status select and its CSS removed; the topline status word (read-only) stays; a new quiet `status` row (label + pill select, mono 0.66rem) sits at the top of the lesson scroll body on all viewports — the minimal header and the pinned close button are untouched, and the row fits 320px (the header-tools placement overflowed structurally: select 120 + pill 144 + X 35 > 259px container).
  - F007: X, search input, open-lesson → `border-radius: 999px`; the new lesson-status select joins the pill family.
  - F008: hero band flex→grid `repeat(2, minmax(0, 320px))`, `justify-content: start`; the copy card stretches to the rail's height with centered text; the rail pins route top / chip bottom — two equal 320×182 cards, packed left (probe: equal width 320/320, equal height 182/182, left gap 0px).
- Before: artifacts/R002/*
- After: artifacts/R003/hero-desktop.png, artifacts/R003/hero-narrow.png, artifacts/R003/lesson-wide.png
- Visual inspection: performed — equal hero pair anchored left (screenshot), pill X + rounded search + pill open-lesson render, lesson status row quiet above objectives, "+xx more" at chip scale (underline affordance visible on hover/focus); mobile 390/320 clean after the tools-row relocation (the check's 320px escape failures were reproduced live, diagnosed via geometry dump, and eliminated by moving the select out of the header).
- Code verification: typecheck PASS, build PASS; ad-hoc probe 17/17 (baseline recorded first: the same probe fails 13 assertions against the R002 state — before/after evidence); full `practice-map.check.mjs` 93 ok / 1 documented pre-existing environment fail (ArrowRight, chromium-1134).
- Open question: none blocking. Observation recorded (not this round's defect): the Go lesson's dash-prefixed paragraphs ("–Огромные кодовые базы…") carry glued dashes from the authored curriculum data — a content-level cleanup if the owner wants it.
- Shipped: commit at round close per the owner's always-current-repo setting (design-iteration operating rule as amended 2026-09-13).

## Feedback F009
- Round: R003
- Verdict: LIKED
- Scope: round R003 as presented (toggle/chip parity, status relocation, pill rounding, equal left-packed hero pair)
- Decision: the round is accepted overall; follow-up modifications follow as F010/F011.
- User source: "it is ok. good. i like the changes. small modifications -"
- Artifact: artifacts/R003/*
- Supersedes: none

## Feedback F010
- Round: R003
- Verdict: REJECTED
- Scope: hero band composition — copy card width + rail position, desktop
- Decision: the "deep lessons. / local notes." card must grow longer in width (the text itself stays where it is), and the concept-graph rail must sit proportionally at the other (right) corner — no large free run of field on the right side of the band.
- User source: "make this section longer in width - 'deep lessons. local notes.'. i.e. text stays where it is. what i want is 'concept graph' section would be proportionally at the other conrner. without a lot of free space in the right side."
- Artifact: artifacts/R003/hero-desktop.png
- Supersedes: none

## Feedback F011
- Round: R003
- Verdict: REJECTED
- Scope: reading text size, lesson windows (deep reader + free reading)
- Decision: lesson body text renders ~10% too small — raise it ~10% while keeping the prose/textarea parity and the iOS >=16px guard.
- User source: "make font size of lesson texts in lesson windows (when reading) bigger around 10%."
- Artifact: artifacts/R003/lesson-wide.png
- Supersedes: none

## Feedback F012
- Round: R003
- Verdict: REJECTED
- Scope: lesson part chips (reader section nav "часть 0. зачем вообще существует go" and the fragment-lesson tab family), corner geometry, lesson overlay
- Decision: the part-label controls render with sharp corners — give them rounded (pill) corners like the rest of the lesson-window controls; folded into the same R004 round.
- User source: "make parts of the lessons in lesson window with rounded corners too. i.e. for example this - 'часть 0. зачем вообще существует go'. give it as one brief"
- Artifact: artifacts/R003/lesson-wide.png
- Supersedes: none

## Round R004
- Goal: address F010–F012 — full-width hero band (copy card fills the left run, rail flush at the right corner), reading type +10% with strict parity, pill-rounded lesson-part chips. Delegated to the chat model per the owner's standing instruction (brief: docs/briefs/BRIEF-practice-map-hero-band-reading-type.md, one brief covering all three asks; the model owned the design choices with a mandatory reasoning section).
- Preserved preferences: R003 as accepted (F009) — toggle placement, status row, rounding family, scope-trim removals; hero copy "deep lessons. / local notes.".
- Changes (chat-model decisions, integrated):
  - F010: hero grid `minmax(0, 1fr) minmax(0, 320px)` — the copy card fills the left run (measured 840px of 1200 at 1440, text left-aligned, vertically centered), the rail caps at 320px flush to the right corner (probe: rail right offset 0px); `justify-content: start` dropped (no-op under 1fr). Collapse moves 700→900px (the pair needs copy ≥~300px; at 850 the model's math shows ≈254px — breakage), hero-only media block; other 700px rules stay.
  - F011: prose (`.practice-reader-section > p`, reader li + fragment li) and the free-reading textarea → `max(1.1rem, 17.6px)` (exact +10%, iOS ≥16px floor held). The 97ch column self-adjusts: `ch` resolves against the untouched container font, so the pixel cap holds and prose wraps ~1 char/line fewer.
  - F012: part chips (`.practice-lesson-tabs button`, `.practice-reader-nav button`) → pill radius + 0.75rem side padding; inner `kbd` softened to 4px (a 9999px blob would over-round a ~16px badge); active/hover states inherit the radius.
- Integration deltas (salvage repair to file conventions): the model's `9999px` normalized to the file's existing `999px` pill value; its h1 block omitted the old `max-width: 760px` cap — ratified (the cap would have stopped the copy card at 760px and contradicted the band fill).
- Before: artifacts/R003/*
- After: artifacts/R004/hero-desktop.png, artifacts/R004/hero-narrow.png, artifacts/R004/lesson-wide.png
- Visual inspection: performed — band filled edge to edge with no right-side dead run; part chips render as pills with the ochre active state; prose density visibly up (~17.6px); mobile 390 clean.
- Code verification: typecheck PASS, build PASS; R004 probe 14/14 (band geometry incl. rail-flush 0px, 17.6px parity, 910px two-column hold + stacked below 900); full `practice-map.check.mjs` 93 ok / 1 documented pre-existing environment fail (ArrowRight, chromium-1134).
- Open question: none.
- Shipped: commit at round close per the owner's always-current-repo setting.

## Feedback F013
- Round: R004
- Verdict: REJECTED
- Scope: hero card heights, stacked (mobile) layout — desktop is already equal (182/182 at 1440, measured)
- Decision: the stacked hero's copy card ("deep lessons. / local notes.") must match the concept-graph rail card's height; on 390px the copy renders 79px against the rail's 169px.
- User source: "Make the 'Deep Lessons. Local Notes' section the same height as the 'Concept Graph' section."
- Artifact: artifacts/R004/hero-narrow.png
- Supersedes: none

## Feedback F014
- Round: R004
- Verdict: REJECTED
- Scope: concept-graph overlay — the interactive canvas window's corners (panel is already 20px; the canvas measures 0px radius, 345×596 at 390px)
- Decision: round the "Concept Constellation" interactive window — most visible on mobile where the square canvas corners read off.
- User source: "Give the 'Concept Constellation' interactive window rounded corners as well. This is especially noticeable on mobile, where the square corners look off."
- Artifact: artifacts/R004/* (graph overlay not yet screenshotted; baseline probe recorded panel 20px / canvas 0px)
- Supersedes: none

## Round R005
- Goal: address F013–F014 — equal stacked hero heights and a rounded concept-graph canvas. Delegated to the chat model (brief: docs/briefs/BRIEF-practice-map-hero-heights-graph-corners.md, with the rendered baseline facts in evidence).
- Preserved preferences: R004 as shipped — full-width band geometry, reading type scale, part-chip pills, scope-trim removals.
- Changes (chat-model decisions, integrated):
  - F013: inside the ≤900 stacked block, `min-height: 10.5rem` — the model's analysis rejected `fr`-row equalization (no container height) and padding growth (conflates spacing with sizing) in favor of a floor; the h1's flex `justify-content: center` keeps the text vertically centered. Integration delta (salvage repair): the first pass pinned only the copy card and the mismatch flipped at 320px (copy 168 vs rail 163 — the rail's height breathes with the route meter's width); the floor was extended to BOTH cards in the stacked block, so the shared 168px floor absorbs the drift (probe: 168/168 at 320, 168/169 at 390, desktop 182/182 untouched). The model's box-sizing assumption was verified first (global `* { box-sizing: border-box }`, shell styles.css:38).
  - F014: `.practice-graph-canvas` → `border-radius: var(--panel-radius)` (base rule only; `--panel-radius` resolves from the overlay ancestor at every breakpoint; the media overrides don't touch radius). The model's concentric-radius and top-corners alternatives rejected in its reasoning; clipping analysis verified live — 0/12 node chips sit outside the rounded clip at 390.
- Before: artifacts/R004/* (+ baseline probe numbers recorded in F013/F014)
- After: artifacts/R005/graph-390.png, artifacts/R005/graph-1440.png, artifacts/R005/hero-narrow-390.png
- Visual inspection: performed — canvas corners rounded on mobile and desktop with the panel in one family; no chips or medallion clipped; stacked hero cards read as matched-height siblings.
- Code verification: typecheck PASS, build PASS; R005 probe 7/7 (heights ±3 at 320/390, desktop unchanged, canvas 20px at 1440/390, zero clipped nodes); full `practice-map.check.mjs` 93 ok / 1 documented pre-existing environment fail (ArrowRight, chromium-1134).
- Open question: none. (Model's forward-looking note: if a future constellation layout places chips hard into a corner, fix the JS placement bounds, not the CSS radius.)
- Shipped: commit at round close per the owner's always-current-repo setting.

## Feedback F015
- Round: R005
- Verdict: REJECTED
- Scope: hero copy card headline size, desktop band (the card grew to 840×182 in R004)
- Decision: the two-line headline reads too small for the enlarged card — raise it so the text feels proportionate to the section.
- User source: "'deep lessons. local notes' section — Increase the font size so the text feels proportionate to the section. Right now, it looks too small for such a large area."
- Artifact: artifacts/R005/hero-narrow-390.png
- Supersedes: none

## Feedback F016
- Round: R005
- Verdict: REJECTED
- Scope: concept-graph overlay copy — the intro paragraph
- Decision: remove "A live map of the ideas behind the route. Drag a node to inspect how the curriculum connects." from the overlay (JSX + its CSS, including media-query rules).
- User source: "Concept Constellation — Remove this text: 'A live map of the ideas behind the route. Drag a node to inspect how the curriculum connects.'"
- Artifact: artifacts/R005/graph-1440.png
- Supersedes: none

## Feedback F017
- Round: R005
- Verdict: REJECTED
- Scope: concept-graph overlay layout on mobile (iOS Safari)
- Decision: the overlay reads as squeezed into a small elongated container on mobile — improve the mobile layout (owner explicitly names iOS Safari).
- User source: "Concept Constellation on mobile (iOS Safari) — The window looks squeezed into a small, elongated container. Please improve the mobile layout so it displays better on mobile."
- Artifact: artifacts/R005/graph-390.png
- Supersedes: none

## Feedback F018
- Round: R005
- Verdict: REJECTED
- Scope: areas-nav order — the Linux area's position (owner clarified via a targeted question: the AREA moves last, not a specific card)
- Decision: the Linux area (20-card practical course) always sorts last in the areas list — Go's flagship stays first; future areas must not push Linux out of last place without reconsideration.
- User source: "linux lesson card should always go the last" (clarified: "Область Linux — последняя в списке областей")
- Artifact: artifacts/R004/hero-desktop.png
- Supersedes: none
- Shipped: F018 implemented directly by the orchestrator (owner's instruction: the chat model already holds the R006 brief, so this mechanical data change was not delegated) — commit 37e3727: curriculum order [Go, Rust, Symfony и Laravel, Linux]; check's Linux selector retargeted to `:nth-last-child(1)` (area-agnostic); typecheck/build PASS, check 93 ok / 1 pre-existing ArrowRight env fail.

## Round R006
- Goal: address F015–F017 — hero headline proportionate to the widened card, intro text removed, mobile graph no longer a squeezed tube. Delegated to the chat model (brief: docs/briefs/BRIEF-practice-map-hero-scale-graph-mobile.md; F018's Linux-area reorder was implemented directly by the orchestrator in the same window — commit 37e3727).
- Preserved preferences: R004/R005 as shipped — band geometry, part-chip pills, canvas radius, stacked-height floor, Linux-last order.
- Changes (chat-model decisions, integrated):
  - F015: headline clamp divisor 31→22 with ceiling 2.3→3.2rem — 51.2px at 1440 (type-to-width ~6%), 43.3px at 1024, 31.6px at 768; the owner's earlier deliberate shrink respected (51.2, not the old 59). The ≤560 mobile override untouched; the 560→561 boundary step narrows (~10px → ~6px, documented in the model's notes).
  - F016: `.practice-graph-intro` deleted (JSX line + base rule + ≤700 line-clamp rule, no orphans); the freed space absorbed by the canvas (base margin-top 1.5→1.2rem, mobile 0.7→0.5rem).
  - F017: mobile panel capped so the canvas lands near-square. Integration delta: the model's fixed 37rem cap rested on a fixed-chrome estimate (~237px) that the live page disproved (~134px real — canvas measured 428×345, ratio 1.24); repaired to the model's own stated goal with a width-derived cap `min(calc(100dvh - 1.2rem), calc(100vw + 7rem))` — the canvas lands ~square at any width (probe: 336×345 = 0.98 at 390; 502px panel floats as a centered card, not a full-screen sheet). No JS change (the model's R4 declined; the ellipse radii map to near-circular on a square canvas automatically).
- Check sync (requested-behavior retargets, documented): `panelTall ≥0.8vh` and `canvasBig ≥0.55vh` (both written for the old full-height sheet) and the 320px `canvas ≥50vh` leg were rewritten to the new shape's invariants — panel bounded by the width-derived cap, canvas h/w in [0.85, 1.2] at 390 and ≥0.85 at 320. Gates follow the requested geometry; none were removed.
- Before: artifacts/R005/*
- After: artifacts/R006/hero-desktop.png, artifacts/R006/graph-390.png, artifacts/R006/graph-1440.png
- Visual inspection: performed — hero headline proportionate (51.2px, two lines, no third-line wrap at 1024); overlay on 390 reads as a proportioned floating card (502px panel, near-square canvas, page visible around it); intro gone; desktop graph structure unchanged.
- Code verification: typecheck PASS, build PASS; full `practice-map.check.mjs` 93 ok / 1 documented pre-existing environment fail (ArrowRight, chromium-1134).
- Open question: none. (Model's forward-looking note: `layoutParams` small-screen `marginX: 44 / marginY: 24` compresses the node area even on a square canvas — a future pass could equalize to 34/34 for a tighter circular distribution.)
- Shipped: commit at round close per the owner's always-current-repo setting.
