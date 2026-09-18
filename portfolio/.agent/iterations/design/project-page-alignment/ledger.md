# Ledger — project-page-alignment

Task: individual project pages ("Raft Cluster", "Spine") must respect the site's
horizontal alignment system (header / landing-card gutters) instead of running
full-bleed. Delegated design+code to the chat model via briefs; orchestrator
integrates, verifies visually, and records rounds here.

Scope note: this thread spans the shell frame + two project pages
(portfolio/projects/raft-cluster, portfolio/projects/spine), so the ledger lives
at the portfolio level. Per-project graph nodes are appended in each project's
own .project-history store.

## Baseline (R000) — measured 2026-09-18, dev server localhost:5173, Chromium 129 (headless)

Desktop 1440×900:
- Landing `.signal-index-shell` (project cards): left 80 / right 1360, width 1280 → `min(100% - 72px, 1280px)`
- Project header `.project-frame-nav`: left 120 / right 1320, width 1200 → `min(100% - 72px, 1200px)`
- Raft `.raft-head`: left 32 / right 1408 (page padding `clamp(16px, 3vw, 32px)`, no cap)
- Spine `.spine-root`: full-bleed 0 / 1440 (3-pane app grid)
- Mobile 390×844: landing + header at 16px gutters; raft `.raft-head` already 16/374; spine full-bleed.

Artifacts: `artifacts/R000-baseline/{landing,raft,spine}-{desktop,mobile}.png`

Observed site alignment system (portfolio/shell/src/styles.css):
- `.section-shell` → `width: min(1200px, calc(100% - 72px)); margin: 0 auto;`
- `.signal-index-shell` → `width: min(100% - 72px, 1280px)`
- `.project-frame-nav` → `width: min(100% - 72px, 1200px)`
- `@media (max-width: 560px)`: all → `width: min(100% - 32px, …)`
- Cap mismatch exists on site already: header caps 1200, landing shell caps 1280.

## Round R001
- Goal: not yet implemented — brief drafted for chat-model delegation (brief 1 of the relay).
- Preserved preferences: spine F003 (no scroll-shift overlays), F007 (de-noised R005 look),
  F008/F009 (mobile width-chain caps must not regress); raft page look unchanged
  apart from horizontal alignment; wasm engine id bindings untouched.
- Changes: pending chat-model response.
- Before: artifacts/R000-baseline/
- After: —
- Visual inspection: baseline performed (screenshots + DOM metrics above).
- Code verification: NOT RUN
- Open question: awaiting chat-model deliverable.

## Round R001 (implemented — supersedes the R001 placeholder above, same session)
- Goal: align project-page content with the site gutter system — Raft and
  Spine content tracks .project-frame-nav (min(100% - 72px, 1200px) centered,
  16px collapse at ≤560) instead of running full-bleed.
- Preserved preferences: spine F003 (no scroll-shift overlays), F007
  (de-noised R005 look), F008/F009 (mobile width-chain caps); raft look
  unchanged apart from alignment; wasm engine id bindings untouched.
- Changes (delegated to chat model, integrated verbatim by orchestrator):
  - raft.css `.raft-field`: `padding` → `padding-block: clamp(16px, 3vw, 32px)`
    + `padding-inline: max(36px, calc((100% - 1200px) / 2))`; new
    `@media (max-width: 560px)` → `padding-inline: 16px`.
  - spine.css `.spine-root`: added `box-sizing: border-box` +
    same `padding-inline` formula (ink wash stays full-bleed under padding);
    new `@media (max-width: 560px)` → `padding-inline: 16px`. No TSX, no ids.
  - Chosen over max-width+margin:auto because padding keeps backgrounds
    full-bleed; chosen over a shared styles.css class as minimal-churn.
- Before: artifacts/R000-baseline/
- After: artifacts/R001/
- Visual inspection: PERFORMED (headless Chromium 129). DOM metrics at
  1920/1440/1200/1024/561/560/390: content gutters equal .project-frame-nav
  gutters at every width (e.g. 1440 → 120/120; 1200 → 36/36; 561 → 36;
  560 → 16). Spine full-width status row 360..1560@1920, 120..1320@1440,
  36..1164@1200 — pixel-matches nav. Screenshots read and inspected: desktop
  panes/panels align with back-link; mobile 16px gutters; spine reflow,
  sticky topbar, dock, canvas binding intact.
- Code verification: `npm run typecheck` PASS (shell, covers project pages);
  no horizontal scroll (scrollWidth == innerWidth at all tested widths, both
  routes); spine engine alive (boxes render, #spine-canvas bound).
- Known tradeoff: spine's sticky mobile topbar + its border stop at the
  content edge (16px in from viewport) — background is continuous ink, judged
  cohesive; revisit if owner objects.
- Open question: LIKED / REJECTED verdict on the round as a whole?



## Feedback F001
- Round: R001 (implemented)
- Verdict: LIKED
- Scope: project-page content alignment on both pages ("Raft Cluster", "Spine"),
  desktop + mobile — the round as a whole, including the padding-inline gutter
  formula and the 16px ≤560 collapse
- Decision: keep R001 as the standing layout; the project-page-alignment
  thread is CLOSED — no remaining implementation work, no open tradeoffs
  (the sticky-mobile-topbar tradeoff passed without objection)
- User source: "liked" (reply to the R001 presentation)
- Artifact: artifacts/R001/ (commit da3c04b)
- Supersedes: none

## Round R002
- Goal: extend the R001 alignment language to "Evening Forest" and
  "Quicknotes" (owner request: "let's do the same"). Both pages are
  structurally different from R001's pair: EF = immersive 3D stage under an
  already-aligned .section-shell intro; QN = full-bleed same-origin iframe
  hosting the standalone quicknotes app.
- Preserved preferences: EF dusk-scene art history (graph n34-n38) — alignment
  pass must not touch scene art; QN app internals off-limits except a minimal
  fix for the overflow defect found in the baseline; standalone /quicknotes/
  route must stay full-bleed.
- Baseline measured (Chromium 129, 1440/1920/390): EF intro already pixel-
  matches .project-frame-nav (120..1320@1440); EF stage full-bleed 0..1440.
  QN host/frame full-bleed; inside the iframe the app's header/main/footer
  span its viewport edge-to-edge; at 390 the app lays out 454px wide in a
  390px iframe — internal horizontal overflow, footer clipped (defect found
  this round, pre-existing).
- Before: artifacts/R002-baseline/
- After: — (brief drafted for chat-model delegation, brief 1 of the relay)
- Visual inspection: baseline performed (screenshots + DOM metrics above).
- Code verification: NOT RUN
- Open question: awaiting chat-model deliverable.

## Round R002 (implemented — completes the R002 briefing above)
- Goal: extend the R001 alignment language to "Evening Forest" and
  "Quicknotes"; delegate per-page reading of "content" to the chat model.
- Preserved preferences: unchanged from R002 briefing block.
- Changes (chat-model design, integrated by orchestrator):
  - Evening Forest: NO code change — the intro already runs .section-shell
    (pixel-matches the topbar); the model's verdict: the 3D stage is an
    immersive scene = full-bleed background under C1, exempt from gutters
    (insetting would seam lit-world/flat-#140b20, change pointer-lock aspect,
    letter a game viewport). Integrated as a deliberate zero diff.
  - Quicknotes shell (styles.css .quicknotes-host): R001 padding-inline
    formula + 16px ≤560 knee — iframe becomes a 1200-capped viewport; app's
    own header/footer edges align with the topbar; height chain untouched;
    standalone /quicknotes/ full-bleed by construction.
  - Quicknotes app defect (found in baseline, 454px-in-390px): the model's
    hypothesized selector didn't exist; orchestrator traced the real root —
    header #top flex row min-content 454px pinned body width (not the footer
    the model blamed). Fix: `flex-wrap: wrap` on #top + `min-width: 0` on
    #search (quicknotes/css/style.css). One-line-class fixes, no reskin.
- Before: artifacts/R002-baseline/
- After: artifacts/R002/
- Visual inspection: PERFORMED. Metrics 1920/1440/1200/1024/561/560/390 both
  routes: content gutters == .project-frame-nav gutters everywhere; QN inner
  body scrollWidth == iframe width at every size incl. 358@390 (was 454).
  Screenshots inspected: desktop app edges align with back-link; mobile
  header wraps into two rows, footer chips wrap, nothing clipped.
- Code verification: `npm run typecheck` PASS; no top-level h-scroll at any
  tested width; EF page untouched (constraints hold by non-interference).
- Open question: LIKED / REJECTED on (a) EF stage staying full-bleed, (b) QN
  inset + app header wrap fix?
