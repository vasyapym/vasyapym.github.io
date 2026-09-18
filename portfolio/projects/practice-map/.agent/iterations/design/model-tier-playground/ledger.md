# Design ledger — Practice Map: model-tier playground

Thread for the concept change: the lessons page re-frames as a playground of experiments with different AI models; the organizational unit becomes the model tier; big tiers group lessons into folder volumes. Historical context: the owner's active preferences from the `hero-route-lesson-chrome` ledger (ink chrome, pill rounding family, lesson-window internals untouched) remain in force. The relay history (10 randomized-model rounds: task-board, prompt-runner, CLI-framework, type-specimen misses; donor pool: folder face + shelves, scale-row, ⌘K palette, models-as-top-container) is recorded in `docs/briefs/BRIEF-practice-map-model-tier-concept.md`.

Owner decisions fixed into the brief (mode 2 — design owned by the orchestrator, chat model implements):
- Hero headline changes to `tier by tier.` / `model by model.` (owner picked from the register list); project name + portfolio illustration untouched.
- No verdict lines, no progress meters (per-tier or global), no tier reorder/ranking UI — tier order lives in the data array.
- Counts are computed from data (never hardcoded); tiers/lessons grow freely.
- Lessons keep flowing through the existing lesson script pipeline (data entries only).

## Round R001
- Goal: present the fixed model-tier playground design as rendered by the implementation-round chat model (brief: docs/briefs/BRIEF-practice-map-model-tier-concept.md) — hero band, scale-row tier list, tier panel with run-numbered cards, folder faces → in-place shelves for the thinking tier, search + ⌘K palette.
- Preserved preferences: ink tokens verbatim; pill family; Linux volumes pre-split 4/3/6/4/3; stub pills for graph + lesson window (not built here).
- Changes: none to the app yet — this round is the concept artifact for the owner's verdict; integration into PracticeMapPage/curriculum happens after approval.
- Before: current live page state (baseline shots from the earlier session, temp dir).
- After: artifacts/R001/artifact.html (single-file render), artifacts/R001/desktop-hero-max.png, artifacts/R001/desktop-thinking-vol03.png, artifacts/R001/desktop-palette.png, artifacts/R001/mobile-default.png.
- Visual inspection: performed — 1440 hero (computed kicker `playground · 5 models · 29 lessons`, ochre second line, rail pill + hint, active tier left-rule), thinking tier with 5 tab-face folders (vol 03 open: shelf cards numbered 08–09), ⌘K palette (fuzzy "rust" query, kind labels, keyboard foot), mobile 390 (stacked rows, panel under list, faces tap-sized); zero console errors in the probe.
- Code verification: artifact-level only (not integrated) — brief compliance checked line-by-line: no verdicts/meters/reorder, class skeleton matches (`.pg-field > .pg-page`, `.pg-hero`, `.pg-layout` named areas `list/search/panel`, `.pg-tier-row`, `.pg-card`, `.pg-face`/`.pg-shelf`, `.pg-palette`, `.pg-footer`), all strings derived from the DATA array.
- Open question: owner verdict on the round as presented — liked / rejected per element (hero copy `tier by tier. / model by model.`, scale-row tier list, folder faces + shelves, palette, lede copy). On approval the artifact is salvaged into the React SPA (curriculum.ts gains tier mapping; lesson script pipeline untouched).

## Feedback F001
- Round: R001
- Verdict: LIKED
- Scope: structure as presented — tier list / tier panel / folder faces + shelves / palette
- Decision: the structure is approved; keep the IA exactly as built.
- User source: "this is good ... the structure-wise i like"
- Artifact: artifacts/R001/*
- Supersedes: none

## Feedback F002
- Round: R001
- Verdict: REJECTED
- Scope: overall visual density of the rendered artifact, all viewports
- Decision: the render reads generic and visually cluttered/noisy — de-noise toward the live page's quieter treatments.
- User source: "but looks generic and visually cluttered (maybe noisy is the right word)"
- Artifact: artifacts/R001/*
- Supersedes: none

## Feedback F003
- Round: R001
- Verdict: REJECTED
- Scope: style usage (fonts and typographic register), all viewports
- Decision: prefer the previous (current page) style — bold sans display headline in the scrim panel with the ochre left rule, sans 600/700 card titles, mono only for chrome, solid #0b1317 cards, square chips; not the artifact's thin mono-led display.
- User source: "style usage wise (fonts, etc) i prefer previous version"
- Artifact: artifacts/R001/desktop-hero-max.png vs the live page baseline
- Supersedes: none

## Feedback F004
- Round: R001
- Verdict: REJECTED
- Scope: the Russian lede paragraph under the hero headline
- Decision: remove the lede text entirely.
- User source: "remove this text - «Журнал эксперимента: ...»"
- Artifact: artifacts/R001/desktop-hero-max.png
- Supersedes: none

## Round R002
- Goal: address F002–F004 — re-skin the artifact to the live page's exact treatments (values ported verbatim from practice-map.css / styles.css) while keeping the liked structure (F001) untouched.
- Preserved preferences: F001 structure; ink tokens; pill family; Linux volumes 4/3/6/4/3; stub pills.
- Changes (orchestrator-owned, current-page values):
  - F003 hero: headline panel = live h1 treatment (scrim rgba(9,15,18,.62), hairline, 2px ochre-deep left rule, radius 20; IBM Plex Sans 600, clamp(1.15rem, calc((100vw - 72px)/22), 3.2rem), line-height .98, lowercase; second line accent-bright). Kicker = notation mono .74rem; lede removed (F004). Rail: rgba(9,15,18,.78) scrim, align-content space-between.
  - F003 tier rows: mirror .practice-area-list — sans 600 1.15rem names, quiet mono band text (no badge boxes), mono accent counts, small sample line, wash+border active state (rgba(211,155,97,.09)).
  - F003 cards: mirror .practice-topic-card — solid #0b1317, 24px padding, translateY(-6px)+shadow hover, topline mono accent number, h3 sans clamp(20px,1.6vw,24px)/700, muted 14px summary, square chips + underlined "+N more", 999px open pill with the gap-grow hover.
  - F002 de-noise: panel wrapper box removed (cards stack directly), band badges de-boxed, faces in card language (sans labels), palette titles sans.
  - F004: lede paragraph removed (markup + no orphan CSS).
- Before: artifacts/R001/*
- After: artifacts/R002/artifact.html, artifacts/R002/r2-desktop-hero.png, artifacts/R002/r2-desktop-thinking-vol03.png, artifacts/R002/r2-desktop-palette.png, artifacts/R002/r2-mobile-default.png
- Visual inspection: performed — hero grid copy|rail restored after a splice regression (missing .pg-hero grid rule caught in the first render and fixed); headline 51.2px-class panel; rows/cards read in the live-page language; thinking tier faces + open vol03 shelf; palette sans titles; mobile 390 stacked; zero console errors.
- Code verification: artifact-level only (not integrated) — same compliance set as R001 plus lede/pill-badge removals confirmed by source grep.
- Open question: owner verdict on the R002 re-skin — style now matches the live page; structure unchanged. On approval → React salvage.

## Feedback F005
- Round: R002
- Verdict: LIKED
- Scope: R002 as a whole (structure + style) and the folders' closed look
- Decision: the re-skin is accepted; the folder faces' look is liked.
- User source: "it is good. ... i like folders' look."
- Artifact: artifacts/R002/*
- Supersedes: none

## Feedback F006
- Round: R002
- Verdict: REJECTED
- Scope: hero rail proportion vs the copy panel, desktop hero band
- Decision: the "explore graph" rail is not proportionate to the hero section — its content should not sit stretched with dead space.
- User source: "'explore graph' section is not proportionate to hero section."
- Artifact: artifacts/R002/r2-desktop-hero.png
- Supersedes: none

## Feedback F007
- Round: R002
- Verdict: REJECTED
- Scope: folder interaction — in-place expansion of lesson cards
- Decision: clicking a folder must ENTER the volume (navigation-style view with a way back), not expand cards in place; the interaction must be visually intuitive.
- User source: "when you click it - there are lesson cards within folder. seems too much. let's make it so that you enter the folder and can exit. but it should be visually intuitive"
- Artifact: artifacts/R002/r2-desktop-thinking-vol03.png
- Supersedes: none

## Round R003
- Goal: address F006–F007 — proportionate rail and enter/exit folder navigation. Orchestrator-owned (small interaction change on the artifact).
- Preserved preferences: F001 structure; F005 style + faces' closed look; R002 skin values.
- Changes:
  - F006: rail content vertically centered (align-content:center) — the rail hugs its pill + hint with no dead run; box stays 320px in the hero grid.
  - F007: in-place shelf expansion removed. Folder face click now ENTERS the volume view: the panel switches to the volume's lesson cards under a breadcrumb row (`← tier name` ochre mono back link + bold volume title). Exit paths: the back link, Esc, or clicking another tier. Palette jump to a volume lesson enters the volume view directly and flashes the card. Face mark changed from "+ open" to a quiet "→".
- Before: artifacts/R002/*
- After: artifacts/R003/artifact.html, artifacts/R003/r3-desktop-hero.png, artifacts/R003/r3-desktop-thinking-faces.png, artifacts/R003/r3-desktop-vol03-entered.png, artifacts/R003/r3-desktop-volumes-again.png, artifacts/R003/r3-desktop-palette-jump.png, artifacts/R003/r3-mobile-faces.png, artifacts/R003/r3-mobile-vol02-entered.png
- Visual inspection: performed — rail centered (no dead middle), faces closed with enter affordance, vol 03 entered with breadcrumb + cards 08–11, back returns to faces, palette jump enters volume + flash on card 09, mobile 390 crumb wraps under the back link; zero console errors. Two splice regressions during the round (a state field dropped by the panel rewrite; a CSS insert landing inside the shared chrome selector group) were caught by probes/integrity greps and fixed before presenting.
- Code verification: artifact-level only (not integrated) — integrity set: single html/script/DATA, chrome group intact, crumb css exactly once, state keeps q, no shelf references.
- Open question: owner verdict on R003 — enter/exit navigation + rail proportion. On approval → React salvage.

## Feedback F008
- Round: R003
- Verdict: LIKED
- Scope: R003 as presented (enter/exit volume navigation + proportionate rail + the R002 skin); deferred improvements acknowledged
- Decision: the round is accepted for now; polish continues later. Design thread settled — the approved artifact (R003) is the reference for implementation.
- User source: "ok for now. we will improve later"
- Artifact: artifacts/R003/*
- Supersedes: none
