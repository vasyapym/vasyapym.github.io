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

## Round R004 — IMPLEMENTED (React salvage of the approved R003 design)
- Goal: integrate the chat model's port of the approved design into the live Practice Map page. Delegated implementation (brief: docs/briefs/BRIEF-practice-map-model-tier-implementation.md — R003 artifact embedded as the porting reference), integrated by the orchestrator.
- Preserved preferences: everything owner-liked — lesson window internals, concept graph, free reading, scroll progress, status editing in the window, chip grace law (n196), Linux volumes 4/3/6/4/3, tier order = data order.
- Changes:
  - New `web/lib/tiers/`: `tiers.ts` (TIERS data mapping + orderedTopicsForTier; the model's local TopicCard mirror replaced with an import of the repo's real type; the helper collects ALL topics of a tier's areas so lessons added later still surface), `TierList.tsx`, `TierPanel.tsx` (cards with the n196 chip law restored + aria-expanded, volume view with crumb, flash scroll), `Palette.tsx` (verbatim scorer), `tiers.css` (scoped: repo --ink-* tokens, artifact's global resets/dropped rules removed per brief).
  - `PracticeMapPage.tsx`: hero copy → `tier by tier. / model by model.` + computed kicker (`playground · N models · M lessons`); rail = graph pill + hint, centered (F006); RouteProgress and the flat areas nav removed; PracticeAreaView/old TopicCard replaced by TierList + TierPanel; LessonOverlay now mounted at page level keyed by openLessonId; palette state + global ⌘K toggle; volume view + flash wired per the integration notes.
  - `practice-map.css`: hero rail align-content space-between → center.
  - `tests/practice-map.check.mjs`: retargeted to the tier surface — map renders on .pg-card; the thinking tier (last row) asserts 5 volume faces + "20 lessons" count; vol 01 renders its 4 cards; fragment lesson reached via vol 02 card 2; the Go flagship reached via its tier (fable-5.1-low, 4th row); mobile 390/320 legs reach the tuned Linux deep reader through the tier + face path. Two new volume gates added; no gate removed.
  - Overlay key ownership: the global handler skips ⌘K/Esc while a lesson or graph overlay is open (they own Escape) — caught via the check's graph legs.
- Before: artifacts/R003/* (approved artifact) + the live pre-integration page.
- After: artifacts/R004/int-desktop-hero.png (1440: hero + tier list + real DDoS card with +41 more), int-desktop-faces.png (5 real faces), int-desktop-vol03.png, int-desktop-lesson.png (lesson window unchanged, tier-wide numbering "lesson 08"), int-desktop-palette.png, int-desktop-jump.png (palette jump → vol 01 + flash), int-mobile.png.
- Visual inspection: performed — the real curriculum data renders in the approved structure; lesson overlay, free reading (271/271 real-lesson flow), graph, scroll progress all intact.
- Code verification: typecheck PASS, build PASS; full practice-map.check.mjs 95 ok / 1 documented pre-existing environment fail (ArrowRight advances sections, chromium-1134 — reproduces on the pre-change tree).
- Data rule recorded: lessons keep arriving via the lesson script pipeline into curriculum areas; a NEW area requires a one-line TIERS append (tier = data).
- Open question: none — implementation shipped; deferred polish stays in F008.
- Shipped: commit at round close per the owner's always-current-repo setting.

## Feedback F009
- Round: R004
- Verdict: REJECTED
- Scope: hero headline copy, all viewports
- Decision: headline text becomes "Archive of AI outputs teaching stuff." — supersedes the brief-fixed R001 hero copy ("tier by tier. / model by model.", ledger preamble)
- User source: task item 1: "Hero text — Update to: 'Archive of AI outputs teaching stuff.'"
- Artifact: artifacts/R005/b-desktop-hero.png
- Supersedes: hero-copy part of the R001 decision set (ledger preamble)

## Feedback F010
- Round: R004
- Verdict: REJECTED
- Scope: band badges (max/high/medium/low/thinking) beside/under model names, tier list + panel head, all viewports
- Decision: remove the badges — the tier indicator is already inside the model name; reclaim the extra row they introduce
- User source: task item 2: "Model labels — Tier indicators (e.g., 'max,' 'high') are already embedded in the model names. Remove them from the labels…"
- Artifact: artifacts/R005/b-desktop-list-cards.png
- Supersedes: none

## Feedback F011
- Round: R004
- Verdict: REJECTED
- Scope: lesson-card summary density + internal padding, all viewports
- Decision: truncate card preview text (char or line limit) and increase card padding for a cleaner layout
- User source: task item 3: "Lesson cards — Descriptions are currently too dense. Apply a character or line limit…"
- Artifact: artifacts/R005/b-desktop-list-cards.png
- Supersedes: none

## Feedback F012
- Round: R004
- Verdict: REJECTED
- Scope: volume-view breadcrumb row, all viewports
- Decision: make the back action prominent (relabel explicitly, e.g. "Go Back"), reduce the folder-name font size to invert today's hierarchy (tiny back link, big title)
- User source: task item 4: "Folder navigation — The back action is undersized relative to the folder name…"
- Artifact: artifacts/R005/b-desktop-volume-crumb.png
- Supersedes: refines F008's deferred polish for the crumb introduced in R003

## Feedback F013
- Round: R004
- Verdict: REJECTED
- Scope: hero rail (graph button + hint) and graph entry point, all viewports
- Decision: remove "explore concept graph" + the hint from the hero; re-enter the graph from a per-lesson-card control beside "open lesson", opening the graph focused on that lesson
- User source: task item 5: "Hero section — Remove 'Explore Concept Graph' from the hero area. Reposition it as a button within each lesson card…"
- Artifact: artifacts/R005/b-desktop-hero.png
- Supersedes: the hero rail treatment settled by F006/F008 (rail proportion work) — the rail is removed outright

## Feedback F014
- Round: R004
- Verdict: REJECTED
- Scope: section spacing on mobile (≤700/≤560 media: hero floor/gap, layout margins, card/faces/tier-row padding)
- Decision: tighten margins/padding to the minimalist rhythm — the current stacked spacing reads disproportionately generous
- User source: task item 6: "For mobile — Section spacing — Margins and padding between sections are disproportionately generous. Tighten them…"
- Artifact: artifacts/R005/b-mobile-top.png
- Supersedes: none

## Feedback F015
- Round: R004
- Verdict: REJECTED
- Scope: tier-list rows (the model entries), scale + visual weight, all viewports
- Decision: reduce the tier-row scale/weight to a more restrained card list (orchestrator reading of "model cards"; owner can correct)
- User source: task item 7: "Model cards — The card list is visually heavy and oversized. Reduce its scale and visual weight…"
- Artifact: artifacts/R005/b-desktop-list-cards.png
- Supersedes: none

## Feedback F016
- Round: R004
- Verdict: REJECTED
- Scope: search input + ⌘K pill corners, all viewports
- Decision: restore rounded (pill) corners — root cause: var(--pill-radius) is undefined in the repo CSS (artifact defined 999px; the R004 port aliased only --panel-radius), so corners render square; this is a regression of the liked pill family (hero-route ledger F007)
- User source: task item 8: "search bar should have rounded corners (i. e. be consistent with design language)."
- Artifact: artifacts/R005/b-desktop-list-cards.png
- Supersedes: none

## Round R005
- Goal: the deferred polish batch (F009–F016) — 8 owner asks implemented through the chat-model deepening round (brief: docs/briefs/BRIEF-practice-map-r005-polish-batch.md, with §0 donor verdicts from two reviewed external drafts), integrated by the orchestrator.
- Preserved preferences: F001 structure (two-column tier IA, faces, palette, search — all untouched); F005 skin (solid cards, panel radius, hover lift); chip law n196; overlay key ownership; Linux volumes; lowercase mono chrome; outlined pill family.
- Changes:
  - F009: hero → "archive of ai outputs / teaching stuff." (two lowercase lines, second accent-bright); hero collapses to one full-width copy card; h1 clamp divisor 22→26 (longer first line, full-width band).
  - F010: `.pg-band` badges deleted everywhere — TierList rows, TierPanel head, the shared-chrome selector group, base rule + five data-band color rules; `band` survives as data (palette sub still reads it).
  - F011: `.pg-card p` → hard 2-line clamp (`-webkit-line-clamp` + `line-clamp`), `min-height:3.4em` removed; card padding 24→30 desktop, 20 @700, 16 @560.
  - F012: crumb inverted — `.pg-crumb-back` = 0.95rem outlined 999px pill "← go back" (44px floor), row-dominant; `.pg-crumb-title` steps to 0.82rem mono muted.
  - F013: hero rail + Russian hint + `.practice-graph-open` deleted; page state `graphOpen:boolean` → `graphTopic:TopicCard|null`; every card foot gains `.pg-card-graph` ("concept graph ↗", outlined, 44px) beside the open-lesson pill (`.pg-pill` stays unique to it); ConceptGraph takes `topic` — lesson scope per the §0 algebra: focus = lesson concepts + up to 2 strongest neighbors each, sorted by summed strength; overlay title = lesson title; readout line "source lesson · …" + `.practice-graph-ranklist` (index/name/×strength/lessons, scrollable); layout option A (seedLayout on the focus set). Global scope preserved in code (no entry point today).
  - F014: stepped mobile shrink — pg-layout 40→32 (@900) → 24/gap18 (@700) → 18/gap14 (@560); card 30→20→16; tier-row/face-head 44px floors; hero 10.5rem floor died with the rail.
  - F015: tier rows restrained — name 1.15→1rem/600, padding .8/.9→.62/.85rem, gap .35→.3rem, count .74→.72rem, sample .74→.72rem quiet (orchestrator reading of "model cards").
  - F016: root cause fixed — `--pill-radius: 999px` declared on `.practice-map-field` (the R004 port aliased only `--panel-radius`, so `.pg-pill`/`.pg-search input` rendered square); card-foot hardcoded 999px replaced with the token.
- Before: artifacts/R005/b-*.png (baseline, pre-round)
- After: artifacts/R005/a-desktop-hero.png, a-desktop-list-cards.png, a-desktop-volume-crumb.png, a-desktop-graph-lesson.png (lesson-scoped overlay: title + source-lesson readout + ranked list), a-mobile-top.png
- Visual inspection: performed — hero single full-width card with the new copy; badges gone, rows tighter; summaries clamped with ellipsis; foot holds both outlined controls; search + ⌘k pill-rounded; crumb inversion reads (dominant go back, small title); lesson-scoped overlay renders the focus set with the source-lesson readout + ranked list; mobile rhythm visibly tightened (whole tier list + search + first card inside the first fold). Observation: the 49-concept DDoS lesson renders a dense canvas (density is the lesson's real concept count — cap question left for owner feedback; most lessons render small clean sets).
- Code verification: typecheck PASS, build PASS; practice-map.check.mjs green except the 1 documented pre-existing environment fail (ArrowRight, chromium-1134 — reproduces on the pre-change tree). Graph legs retargeted for the new entry: desktop leg enters vol 01 and clicks `.pg-card-graph`; 28-node assertion → lesson-scope focus-set assertions (≥2 nodes, "source lesson" readout, ranklist present); dimmed-node check guarded by nodeCount ≥ 5; both mobile legs tap `.pg-card-graph`. One integration defect found and fixed: the ranked list initially starved the 320px canvas below its near-square ratio floor — readout box tightened to 4rem at ≤400px (ratio 0.836→0.865), useless max-height overrides removed.
- Open question: owner verdict on R005 — liked/rejected per element; the canvas density on very large lessons (DDoS 49 concepts) is the one open tradeoff to weigh.
