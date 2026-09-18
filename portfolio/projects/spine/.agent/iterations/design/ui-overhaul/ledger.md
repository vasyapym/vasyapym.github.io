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

## Feedback F006
- Round: R004
- Verdict: REJECTED (scope: visual noise, especially Edge on Windows)
- Scope: overall visual noise level of the app UI; font rendering suspected
  as the main contributor (all-mono chrome at 10–12px reads scratchy under
  Windows ClearType); unstyled scrollbars and the dot/ruler texture add to it
- Decision: small adjustments only (no sweeping changes): split type by
  register — sans for UI chrome, mono reserved for the code printout; quiet
  the tick/dot layers; thin styled scrollbars; sizes +0.5px where tiny
- User source: "This is looking good overall. However, it feels visually
  noisy, especially when viewed in Microsoft Edge on Windows. I suspect the
  font may be the most contributing factor. Let's experiment with some
  adjustments (not only font-wise), without making sweeping changes."
  (2026-09-17)
- Artifact: artifacts/R004/desktop-design.png
- Supersedes: none

## Round R005
- Goal: apply F006 — de-noise without sweeping changes (css-only,
  spine.css).
- Preserved preferences: F001–F005; structure untouched.
- Changes: type split by register — UI chrome (headings, labels, legends,
  buttons, status, select/input text) → var(--sans); mono reserved for the
  code printout (--code-font) at 12px; tiny sizes lifted 11→11.5px,
  heading 13→13.5px, dock buttons 12→12.5px; letter-spacing stripped
  (0.01–0.04em → 0); dot bed softened 0.07→0.055 alpha, grid 20→24px;
  ruler ticks 0.13→0.09 alpha, pitch 20→24px; thin styled scrollbars
  (scrollbar-color paper 22%) on inspector/code/canvas scroller — the
  unstyled chunky native bars were a big Edge/Windows noise source.
- Before: `artifacts/R004/*` — After: `artifacts/R005/*`
- Visual inspection: performed — desktop 1440 + mobile 390, both modes, read
  as images: chrome reads calmer, canvas texture quieter; the mono printout
  is now the only mono surface.
- Code verification: shell tsc ok; spine smoke ok (6→8 nodes, grid toggle,
  undo/redo, hash, sel-label, modebar, html5+pointer drag, mobile shots);
  vite production build ok.
- Open question: owner verdict (real Edge/Windows look pending); if sans
  chrome loses too much of the instrument feel, revert switch is one
  font-family line.

## Feedback F007
- Round: R005
- Verdict: LIKED
- Scope: the de-noised app surface (sans chrome / mono printout, soft
  texture, thin scrollbars), all viewports
- Decision: keep R005 as the standing look
- User source: "i like it. next - there needs to be limitation for mobile.
  it goes beyond visible are (containers, items)" (2026-09-17)
- Artifact: artifacts/R005/desktop-design.png
- Supersedes: none (closes the noise thread)

## Feedback F008
- Round: R005
- Verdict: REJECTED (behavior, mobile)
- Scope: mobile (≤1100px / touch): containers and items extend beyond the
  visible viewport when the tree outgrows the canvas strip
- Decision: constrain the layout so boxes stay within the viewable area on
  mobile (details follow in the round after a live probe)
- User source: same message as F007 (2026-09-17)
- Artifact: artifacts/R005/mobile-design.png
- Supersedes: none

## Round R006
- Goal: apply F008 — mobile constraint so containers/items stay within the
  viewable area (css-only, mobile block).
- Diagnosis (live probes on the real wasm engine, 390px + 320px): default
  add/delete paths never overflow (root wraps). The reproducible escape is a
  user-authored nowrap row with fat gaps — content grew to 1061px against
  390/320 viewports, confined to the canvas strip but beyond the right edge.
- Changes: on mobile, `.node { max-width: 100%; overflow-wrap: anywhere }` —
  no box may exceed its parent's box, long labels wrap instead of pushing
  width; `#spine-canvas` padding 20→14px (more usable strip width);
  `.spine-scroll` overflow-x stays the explicit horizontal release valve so
  any user-authored overflow pans inside the strip — the page itself never
  scrolls horizontally (verified: pageScrollWidth == innerWidth in both
  hostile and default cases, before and after).
- Constraint honestly bounded: a deliberately nowrap row still extends
  inside the pannable strip (the preview must mirror the user's own
  flex-wrap setting — the engine's inline styles are never overridden).
  Touch pan works from gaps/padding; node gestures stay reserved for the
  engine's touch drag (shipped feature, n12).
- Before: `artifacts/R005/*` — After: `artifacts/R006/*`
  (+ `overflow-nowrap-pan.png` — the hostile nowrap case, strip-preserved).
- Visual inspection: performed — desktop 1440 + mobile 390, both modes, read
  as images; the demo tree fits with the wider strip, dock unchanged.
- Code verification: shell tsc ok; spine smoke ok (6→8 nodes, grid toggle,
  undo/redo, hash, sel-label, modebar, html5+pointer drag, mobile shots);
  vite production build ok; live probes before/after (page containment
  green).
- Open question: owner verdict; if a hard clip is wanted for deliberately
  nowrap rows (boxes hidden beyond the edge instead of pannable), that is a
  one-line `overflow-x: hidden` swap but hides content — not recommended.

## Feedback F009
- Round: R006
- Verdict: REJECTED (partial — the residual overflow persists beyond the
  width-chain cap)
- Scope: mobile, the pannable-strip case — user-authored nowrap/fat-gap rows
  still extend beyond the visible area; R006's caps improved it but did not
  eliminate it
- Decision: park the remaining mobile-overflow work for the NEXT iteration —
  R006's caps stay in effect meanwhile; the thread is handed to
  code-iteration (engine-aware options: fit-to-width scaling, or a
  touch-pan reconciliation that does not break the shipped touch drag)
- User source: "it is still there but maybe got a bit better. for now lets
  stop. this is for next iteration" (2026-09-17)
- Artifact: artifacts/R006/overflow-nowrap-pan.png
- Supersedes: none

## Feedback F010
- Round: R006 (standing R005 look)
- Verdict: REJECTED (aesthetic register)
- Scope: overall visual style of the Spine app UI, all viewports
- Decision: the current look leans too close to a mobile-game aesthetic;
  move to an engineering-oriented look — what a senior developer expects
  from a technical tool
- User source: task brief (2026-09-18): "The current visual style leans too
  close to a mobile game aesthetic. I'd prefer a more engineering-oriented
  look — more aligned with what a senior developer would expect from a
  technical tool."
- Artifact: artifacts/R006/desktop-design.png
- Supersedes: none (refines F004's minimalist direction — same ink palette,
  different register)

## Feedback F011
- Round: R006 (standing R005 look)
- Verdict: REJECTED (scalability of the composition)
- Scope: canvas composition as element/container count grows, all viewports
- Decision: address visual clutter at scale — the layout must stay legible
  when many containers/items are present
- User source: task brief (2026-09-18): "As the number of containers/elements
  increases, the layout becomes visually cluttered. This needs to be
  addressed to maintain clarity at scale."
- Artifact: artifacts/R006/desktop-design.png
- Supersedes: none

## Feedback F012
- Round: R006 (feature request)
- Verdict: REJECTED (missing capability)
- Scope: adaptive fullscreen mode, triggered by element count relative to
  screen size; most valuable on mobile
- Decision: add an adaptive fullscreen mode — once the element count exceeds
  a threshold (calculated relative to screen size), prompt the user with an
  option to enter fullscreen mode enabling standard scroll navigation
- User source: task brief (2026-09-18): "Once the element count exceeds a
  threshold (calculated relative to screen size), prompt the user with an
  option to enter fullscreen mode, enabling standard scroll navigation. This
  would be particularly valuable on mobile devices."
- Artifact: none (capability gap, not a rendered artifact)
- Supersedes: none (complements, does not replace, the parked F009
  mobile-overflow thread)

## Feedback F013
- Round: R007 (direction source)
- Verdict: ACCEPTED (owner-endorsed direction)
- Scope: the design language of the Spine app UI, all viewports — the
  "DATUM" register (drawing sheet, not game board): three strokes carry all
  state (hairline = exists, stronger ink = hover, 2px ochre = live); ink
  opacity, not fills, does hierarchy; corner machine-callout tags; ledger
  inspector; scale bar; LOD by rendered width; focus dimming; adaptive
  scroll mode
- Decision: adopt DATUM (from the randomized routing model, relayed
  2026-09-18) as R007's design source. House palette hexes stay (F002
  stands; colors are the owner's to fix at integration). Within DATUM's
  endorsement, three earlier decisions are refined, none reverted: F005's
  1px ring becomes DATUM's 2px ochre live-stroke (no fills anywhere,
  ring still precise); F006/F007's type split extends mono to canvas
  callouts, ledger values and the status line (code printout stays 12px);
  F004's caps-avoidance is lifted for tracked-caps micro-labels (10px
  sans) per DATUM's drawing-sheet notation
- User source: "stop the above. i actually got the answer from randomized
  strongest model. let's do that instead — 1. Direction: DATUM…" (2026-09-18)
- Artifact: artifacts/R007/desktop-design.png
- Supersedes: F005 (stroke weights only, within DATUM scope), F004
  (caps-micro-labels only), F006/F007 (mono notation extension only)

## Round R007
- Goal: re-register the surface to DATUM (F010/F013), clarity at scale
  (F011), adaptive scroll mode (F012).
- Preserved preferences: F001–F003, F008 as amended by F013; engine
  contract untouched (ids, classes, #spine-canvas > .node shape, inline
  styles, 44px coarse targets); palette hexes per F002.
- Changes (SpinePage.tsx + spine.css, css-led with a React measurement
  pass): three-stroke state system; radii ≤2px; nested-fill tints removed
  (ink-opacity hierarchy); container corner tags via attr(data-id); ledger
  inspector (caps sans labels, right-aligned mono values, bottom-rule
  inputs, ochre focus rule); flush dock (static bar, hairline top, text
  cells) with a React-only "scroll" toggle; flat mode chips with 2px ochre
  underline (mobile); code pane flattened to hairline caps headers; mono
  status; scale bar "└─ 100px" pinned bottom-left; React MutationObserver +
  rAF pass stamps additive data-* attrs — data-lod (≥120 full / ≥44 tag /
  <44 stroke-only), data-collapse (container <60 wide with a child <12px
  wide → ×N count), data-focus (target 2px ochre / chain strong ink /
  peer base / far recedes), data-dims (witness "W × H" outside the
  selected stroke); adaptive scroll mode — trigger ratio > 1.4 mobile /
  2.0 desktop or mobile median box < 44px, non-blocking mono prompt bar
  above the dock ("layout ×N viewport · scroll mode → · dismiss"), dismiss
  remembered per session and re-arms when ratio doubles, dock toggle as
  second path; scroll mode = workspace fixed full-viewport, 1:1 canvas,
  native scroll (touch-action pan), sticky "◂ exit" header, Esc to exit,
  bottom-sheet inspector (40vh; right-hand 480px drawer on desktop) on
  selection, exit restores scroll to the selection.
- Floored (needs engine/Go support — recorded for a later round):
  FLEX→ direction glyph, full breadcrumb path (containers with children
  carry no text label in the DOM), coincident-line snap, 8px dot module
  fading under zoom (no zoom exists; 24px bed kept per F006), structure
  rail (no external select API), code two-tone, empty-state crosshair,
  back-gesture exit.
- Before: artifacts/R006/* — After: artifacts/R007/* (desktop-design,
  desktop-selected, desktop-scale, desktop-scrollmode, mobile-design,
  mobile-prompt, mobile-scrollmode, mobile-sheet)
- Visual inspection: performed — desktop 1440 + mobile 390, both modes,
  plus selection/scale/scroll-mode states, read as images. Fixes caught on
  render: LOD stroke cut moved below the 44px touch floor (item labels
  vanished at <60px); desktop sheet capped to a 480px right drawer.
- Code verification: shell tsc ok; spine smoke ok (6→8 nodes, grid toggle,
  undo/redo, hash, sel-label, modebar, html5+pointer drag, mobile shots);
  vite production build ok; probe lifecycle green (desktop prompt at
  ×2.5, mobile prompt at ×2.7, Esc exits, zero page errors).
- Open question: owner verdict on the DATUM register; parked F009
  (mobile nowrap overflow) is naturally addressed by scroll mode but stays
  parked until this round's verdict.
