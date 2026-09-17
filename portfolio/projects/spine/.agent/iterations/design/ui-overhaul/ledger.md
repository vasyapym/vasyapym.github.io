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
