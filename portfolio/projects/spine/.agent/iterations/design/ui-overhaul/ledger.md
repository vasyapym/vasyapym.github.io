# Spine — design-iteration ledger

Task: owner verdict on the Spine surface (2026-09-17 session, /design-iteration).

Active task: the Spine app UI (the three-pane layout-engine page itself) falls
short of the owner's quality bar and gets a full overhaul, delegated to the
chat model as one self-contained brief; owner reviews on GitHub Pages.

Prior mark history lives in the spine project graph (n6 chartreuse reroll →
n9 ochre reroll → n10 "The Seventh" dusty steel, shipped commit `1373911`).
No earlier design-iteration ledger exists for spine; numbering starts at R001.

## Baseline (2026-09-17)
- Artifacts: `artifacts/baseline/card-spine.png` (Spine card), `card-raft.png`
  and `card-explosion.png` (family exemplars), `grid-full.png` (whole grid).
- Observation: Raft and Explosion both carry a confident protagonist shape with
  a dense spot-ink halftone mass (coral / amber). The Spine mark is a column of
  five small neutral bars — the only accent (steel dense fill) sits on a tiny
  rotated replacement vertebra; overall it reads muted and undersized next to
  its siblings.

## Feedback F001
- Round: baseline
- Verdict: LIKED
- Scope: Spine card illustration ("The Seventh"), main-menu project card, all viewports
- Decision: keep the current card mark unchanged — owner likes it; no
  design-language rework of the card illustration
- User source: "i actually like current illustration in the project card of
  main menu. i don't like the UI of project itself" (2026-09-17)
- Artifact: artifacts/baseline/card-spine.png
- Supersedes: none (closes the card-mark consistency task before any redesign
  round)

## Baseline (2026-09-17)
- Artifacts: `artifacts/baseline-ui/desktop-design.png`, `desktop-full.png`,
  `mobile-design.png`, `mobile-code.png`.
- Diagnosis (from the actual renders):
  - Left rail reads as a generic settings form: big bordered fieldsets, four
    stacked full-width dropdowns, no hierarchy between tree actions and node
    properties.
  - Canvas boxes are near-empty gray rounded rects with faint accent tints;
    the selected root's ochre outline is the only strong shape.
  - Output panes are double-framed (outer panel + inner pre boxes) and mostly
    empty at rest.
  - Type/spacing: generous but static; the page reads as a dark admin panel,
    not as a member of the ink catalogue.
  - Mobile: sticky bar stacks modebar + two rows of buttons (2×3 grid);
    inspector fields below fold; canvas strip small.
- Owner confirmed the CARD illustration is liked (F001 in the closed
  card-mark-consistency ledger) — only the app UI is in scope. The card-mark
  ledger lives at `.agent/iterations/design/card-mark-consistency/ledger.md`.

## Round R001
- Goal: full visual overhaul of the Spine app UI in the "amberframe"
  phosphor-CRT direction — a greenfield build delegated to the randomized
  chat model (minimize-iteration relay: 44-word prompt, leet-masked stack
  words, code contract App.tsx + styles.css), then salvaged onto the real
  wasm-driven shell.
- Direction source: chat model's AMBERFRAME build (verified standalone in a
  scratch vite app, zero console errors; artifact `R001/amberframe-source-…`).
- Preserved preferences: F001 (card mark untouched); engine contract — every
  `spine-*` id, engine-written node classes, `#spine-canvas > .node` shape,
  `(any-pointer: coarse)` 16px rule, 44px touch targets, `hidden` class.
- Changes (web/SpinePage.tsx + web/spine.css, full rewrite):
  amber CRT palette on a warm-black field; static scanline + bloom chrome;
  graph-paper canvas with corner rulers; machine-id node tags via
  `::before { content: attr(data-id) }` (steel = machine layer, amber =
  selection layer); floating tool dock over the canvas; readout inspector
  rows (▸ label left, control right, dashed block rules); printout-style
  output pane; status line with blinking cursor; lowercase mono chrome;
  mobile sticky bar + bracketed design/code chips, dock wraps to rows.
- Before: `artifacts/baseline-ui/*` (desktop-design, desktop-full,
  mobile-design, mobile-code)
- After: `artifacts/R001/*` (desktop-design, desktop-full, mobile-design,
  mobile-code)
- Visual inspection: performed — desktop 1440 + mobile 390, both modes, read
  as images. Integration retunes vs amberframe: scanline alpha 0.30→0.22,
  no roll/flicker animation (calm-house rule), no artboard zoom (engine
  owns scale), brand bar dropped (host chrome already names the page).
  Fixes after first render: dock wraps on mobile (was clipping "undo"),
  inspector label column 108→124px (two-line wrap).
- Code verification: go vet + test ok; wasm build ok; shell tsc ok; spine
  smoke ok (6→8 nodes, grid toggle, undo/redo, hash, sel-label, modebar,
  html5+pointer drag, mobile shots); vite production build ok.
- Open question: owner verdict on the amber CRT direction — scanline/bloom
  intensity, warm-black field vs the house cool ink, and whether machine-id
  node tags should stay always-on.

## Feedback F002
- Round: R001
- Verdict: REJECTED (styling only — usability explicitly endorsed)
- Scope: the amber CRT skin of the Spine app UI (palette, scanlines/bloom
  chrome, warm-black field), all viewports, both modes
- Decision: re-tint the page to the site's established ink-catalogue identity
  (deep ink #0b1317 field, warm paper text, ochre accent); keep R001's
  structural improvements — floating dock, readout inspector, status line,
  node tags
- User source: "This is an improvement — the usability is noticeably better.
  However, the styling feels inconsistent with the overall design language of
  the website. As it stands, the elements have a burgundy, denim-like
  appearance that doesn't quite fit. Let's align them more closely with the
  site's established visual identity." (2026-09-17)
- Artifact: artifacts/R001/desktop-design.png
- Supersedes: the amber palette layer of R001 within its stated scope

## Round R002
- Goal: re-language the R001 surface to the house ink-catalogue identity
  (F002) — keep the structure, swap the skin.
- Preserved preferences: F001 (card mark untouched); F002 (R001 structure —
  floating dock, readout inspector, status line, node tags; only the palette
  layer changes).
- Changes: SpinePage.tsx (dropped the CRT overlay divs and the ◈ glyph) +
  spine.css (full re-tint): field `var(--ink-bg)` deep ink, warm paper text
  `#eeeae0`, ochre accent `#d39b61`/bright `#e8b57c` for selection/actions,
  coral `#ff6a5f` only on destructive hover; amber CRT chrome removed
  entirely; canvas bed = the house halftone-dot device at 20px grid;
  node tags re-inked to muted paper (machine notation in the catalogue's
  caption register); pressed mobile mode chip = solid ochre with ink text
  (realm buttons' treatment); focus rings = house bright ochre.
- Before: `artifacts/R001/*`
- After: `artifacts/R002/*` (desktop-design, desktop-full, mobile-design,
  mobile-code)
- Visual inspection: performed — desktop 1440 + mobile 390 both modes, read
  as images; page now reads as a member of the ink catalogue (deep-ink field
  continuous with the frame chrome, one ochre accent, paper notation).
- Code verification: shell tsc ok; spine smoke ok (6→8 nodes, grid toggle,
  undo/redo, hash, sel-label, modebar, html5+pointer drag, mobile shots);
  vite production build ok.
- Open question: owner verdict on the re-inked surface (and whether the
  dotted bed density reads right).

## Feedback F003
- Round: R002
- Verdict: REJECTED (behavior)
- Scope: elements that shift when the canvas scrolls (workspace rulers and
  the floating dock are absolutely positioned inside the scroll container),
  desktop + mobile
- Decision: remove the scroll-shift behavior entirely — overlays must stay
  put while content scrolls
- User source: "some elements shifts on scroll, which can create a glitchy
  visual effect — let's remove that behavior" (2026-09-17)
- Artifact: artifacts/R002/desktop-design.png
- Supersedes: none

## Feedback F004
- Round: R002
- Verdict: REJECTED (aesthetic register)
- Scope: overall styling register of the Spine app UI, all viewports
- Decision: the current look leans brutalist (hard hairline boxes, tracked
  uppercase, dashed rules, 2px radii, always-on tags); re-polish toward the
  site's minimalist direction while staying inside the house ink language
  (F002's palette outcome stands)
- User source: "the current styling leans toward a brutalist aesthetic,
  which is inconsistent with the overall design language of the site (more
  of a 'minimalist' style). Let's ensure it aligns with the established
  visual direction" (2026-09-17)
- Artifact: artifacts/R002/desktop-design.png
- Supersedes: none

## Round R003
- Goal: deepening relay to the chat model — polish pass on the R002 surface
  applying F003 (no scroll shift) and F004 (minimalist, not brutalist).
- Note: the relayed brief carried the current files verbatim; the model's
  reply rebuilt spine.css from the spec (the second block did not survive
  its context window) — the rebuild was contract-clean, so it stands as the
  round's candidate with integration repairs.
- Preserved preferences: F001, F002 (ink-catalogue palette outcome), F003,
  F004; every engine id/class/wording per §5.
- Changes (SpinePage.tsx + spine.css): workspace becomes a non-scrolling
  wrapper with an inner .spine-scroll around #spine-canvas — rulers + dock
  are pinned siblings, nothing moves on scroll; brutalist tells removed
  (▸ markers, always-on node tags, dashed rules, tracked uppercase, 2px
  radii, backdrop-blur, status segment boxes, blinking cursor) → lowercase
  0.02–0.04em notation, hairline-under-legend groups, 6–8px radii, flat
  panel fills, quiet rest states, ochre only on selection/focus/pressed.
- Integration repairs on the model's css: host-frame height
  (calc(100dvh − 61px)), topbar back to column 1 (full-width band duplicated
  the host chrome), native-select de-bezel + bone chevron + dark options,
  focus-visible bright-ochre rings, mobile flow order workspace→inspector
  (edit→see loop) and full-width wrapping dock, dashed drop-target,
  nested-container depth tints, node cursors (grab/grabbing), dock button
  nowrap, desktop scroller geometry.
- Before: `artifacts/R002/*` — After: `artifacts/R003/*`
- Visual inspection: performed — desktop 1440 + mobile 390, both modes, read
  as images; fixes caught on render: dock button text wrap, mobile dock
  width. Rest state is quiet: hairlines, no dashes, no tags, one accent.
- Code verification: shell tsc ok; spine smoke ok (6→8 nodes, grid toggle,
  undo/redo, hash, sel-label, modebar, html5+pointer drag, mobile shots);
  vite production build ok. (One smoke run failed on a stale port listener,
  green on retry — infra, not code.)
- Open question: owner verdict on the minimalist register; node tags were
  dropped as part of the polish (machine ids are gone from the canvas) —
  flag if you want them back in a quieter form.

## Feedback F005
- Round: R003
- Verdict: REJECTED (scope: the ochre highlight layer)
- Scope: every warm ochre highlight state of the app UI — the selected-node
  wash, the drop-target wash, the ochre input-focus border and 2px focus
  ring, the ochre pressed-chip text ("всё охряное сразу" reads yellow)
- Decision: treatment A — remove the warm fills/washes entirely; selection
  becomes a precise ochre ring; focus ring thins to 1px and mouse-focus
  borders go neutral; pressed chip text goes paper (border stays ochre).
  Ochre remains as precise accents only. If rings still read yellow, the
  next step is steel (#7b93b3) selection (variant B, parked).
- User source: "it seems good. highlighting feels not good (yellow
  highlighting. what can we do about it?" + questionnaire answers "всё
  охряное сразу" / "A: кольцо без заливки" (2026-09-17)
- Artifact: artifacts/R003/desktop-design.png
- Supersedes: none

## Round R004
- Goal: apply F005 treatment A — de-yellow the highlight layer, keep precise
  ochre accents (css-only, spine.css).
- Preserved preferences: F001–F004; engine contract untouched.
- Changes: `.selected` = 1px ochre ring (outline, offset 2px) — warm wash
  removed, node border back to its neutral kind; `.drop-target` dashed ochre
  border, wash removed; input focus border back to neutral line (mouse),
  focus-visible ring thinned 2px→1px; pressed mobile mode chip text → paper
  (ochre border stays).
- Before: `artifacts/R003/*` — After: `artifacts/R004/*`
- Visual inspection: performed — desktop 1440 + mobile 390, both modes, read
  as images: the warm fills are gone; selection reads as a crisp ring; the
  only remaining ochre is precise (ring, chip border, sel-label).
- Code verification: shell tsc ok; spine smoke ok (6→8 nodes, grid toggle,
  undo/redo, hash, sel-label, modebar, html5+pointer drag, mobile shots);
  vite production build ok.
- Open question: owner verdict; variant B (steel selection) parked if any
  ochre ring still reads yellow.
