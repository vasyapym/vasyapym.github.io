# Design ledger — practice-map rebrand & hero rework

Task: the page outgrew its name and its hero. "Practice Map" no longer describes what
the product has become — an AI output archive, an experimental lesson space, and an
open-ended AI playground. Rethink the name and the main page illustration; overhaul the
hero (copy, composition, visual energy). Opening scope decision from the owner: the 10
illustration/concept directions are delivered as **code** (self-contained, runnable);
the orchestrator owns every adaptation into the page's ink design language.

Baseline: the page is in its post-R006-feedback-batch state (model-tier playground
ledger, R001–R005 + the 8-ask batch integrated: "teaching concepts." copy, narrowed
left list, English placeholder, rounded chips, card spacing, ~15% crumb, mobile hero
presence). The hero today is a single full-width text-only copy card — no illustration.

Sibling surfaces (out of scope until the direction is picked): the landing rail card
(`portfolio/shell/src/shell/ProjectArtwork.tsx` — terraced climb spot) and
`projects/practice-map/project.ts` metadata (title/eyebrow/description/motion) — both
re-skin/rename after the owner's verdict, as follow-through.

Baseline artifacts: artifacts/R000-baseline/ (desktop hero 1440, desktop full 1440,
mobile top 390).

## Feedback F001
- Round: none (opening task)
- Verdict: REJECTED
- Scope: product name ("Practice Map") — everywhere it renders (page title, landing rail card, project module metadata)
- Decision: the name no longer describes the product's real scope (AI output archive + experimental lesson space + open-ended AI playground); rethink the name to truthfully represent that scope
- User source: owner task item 1: «"Practice Map" no longer describes what this product has become — an AI output archive, an experimental lesson space, and an open-ended AI playground. Rethink both the name and the main page illustration to truthfully represent this scope.»

## Feedback F002
- Round: none (opening task)
- Verdict: REJECTED
- Scope: hero section — copy, composition, visual energy, all viewports
- Decision: the hero feels inert; rework it as part of the rebranding pass so it "lands with intent rather than sitting there passively"
- User source: owner task item 3: «The current hero feels inert. Treat it as part of the same rebranding pass — rework its copy, composition, and visual energy so it lands with intent rather than sitting there passively.»

## Feedback F003
- Round: none (opening task)
- Verdict: REJECTED (absent — the main page has no illustration today)
- Scope: main page illustration for the practice-map hero band
- Decision: illustration ideation is delegated to the randomized chat model as 10 visual/conceptual directions delivered as **code** (owner clarification: «"visual/conceptual" directions i meant code of it. you will handle the details (adapting to design language of the webpage)»); the owner picks the direction; the orchestrator owns refinement, specifics, design-language adaptation, and the final integration
- User source: owner task item 2 + relay clarification message

## Round R001
- Goal: rebrand ideation artifact via the randomized routing relay (minimize-iteration one-liner: 10 single-file illustration directions + 5 lowercase names; ink language + banned-traits dictionary carried; identities = archive / lesson space / playground)
- Preserved preferences: F001 (name stale), F002 (hero inert), F003 (directions as code; orchestrator adapts)
- Changes: none to the app — concept artifact for the owner's verdict
- Before: artifacts/R000-baseline/ (current hero: text-only band)
- After: artifacts/R001/ (12 renders of the relay's reply; src/ holds the 10 HTML files verbatim)
- Visual inspection: 10 desktop (1200, fullPage) + 2 mobile (390) shots read. Findings: the reply is DIRECTION-BENT — not 10 distinct illustration directions but ONE cohesive site concept ("tokenfold", dark-swiss ink register, "type is the illustration") across 10 structurally distinct pages + 5 names. Register matches the house language (near-black ink / warm paper / ochre / lowercase mono). Two palette states present (paper-light majority, dark playground+404) — inverted vs the live dark-ink field; adaptation required. Real defect at 390: the rotated "fig. 001" side label collides with the hero paragraph (m-index-390.png). Concept drift flagged: the built site interprets the product as an AI-HISTORY field guide (timeline 1958→2022, generic glossary) — not our tier-list-by-model archive of generated lessons; the name pairing and IA need re-anchoring at integration. Strong fittable fragments: index poster hero, token-chopper interactive toy, archive table row treatment.
- Code verification: NOT RUN (static concept artifact, no app code touched)
- Open question: owner verdict — (a) accept the tokenfold direction + which name, (b) rerun the relay for more/other directions, or (c) deepen this one into the hero + page integration

## Round R002
- Goal: second randomized-routing reply (stronger tier, same one-liner) rendered + compared against R001 — 10-screen "Field Register" site concept with one shared dark e-ink design system
- Preserved preferences: F001 (name stale), F002 (hero inert), F003 (directions as code; orchestrator adapts)
- Changes: none to the app — concept artifact for the owner's verdict
- Before: artifacts/R000-baseline/ (current hero: text-only band)
- After: artifacts/R002/ (13 renders of the Field Register concept; src/ holds styles.css + app.js + 10 pages verbatim)
- Visual inspection: 10 desktop (1200, fullPage) + 3 mobile (390) shots read. Findings: dark field from the first frame — no palette inversion needed vs the house dark ink; register = archival instrument (ledger / dossier / bench / manifest), uppercase tracked eyebrows + mono chrome + Georgia serif prose. Working JavaScript: archive filter/sort, quiz, prompt assembler, Unicode segmentation bench with byte/code-point counts, real temperature softmax sampling with draw log, notebook with localStorage + Markdown export. A11y baseline: skip link, aria-current, aria-live, fieldsets, focus-visible, print stylesheet. Same direction-bent shape as R001: one cohesive concept, not 10 divergent directions; this one honors the four-section IA (archive / lesson / playground / notebook) more literally, but the archive content is seminal AI papers — still not our tier-list-by-model archive; re-anchoring at integration required. No render defects spotted in inspected shots (unlike R001's 390px label collision).
- Code verification: NOT RUN for app code (concept artifact); the concept's own JS executed headlessly on every bench page with no console/page errors
- Open question: owner verdict — Field Register vs tokenfold as the rebrand base, and the name

## Feedback F004
- Round: R002 (after both relay rounds presented)
- Verdict: REJECTED + withdrawal (scope correction)
- Scope: the illustration target — both relay replies evaluated against the wrong surface
- Decision: "main page illustration" means the PRACTICE-MAP PROJECT CARD on the main landing page (portfolio shell, ProjectArtwork spot illustration — incumbent "sky spot ink, terraced climb to a lit summit"), NOT the practice-map page's own hero/interior. Both delivered site concepts (tokenfold R001, Field Register R002) are rejected as not-it for this target; "hero overhaul" scope to be confirmed by the owner.
- User source: «i meant project card illustrations of the main page. we did totally different» (after viewing the R002 renders)
- Supersedes: F003 (delivery target corrected; the "directions as code, orchestrator adapts" law carries)

## Feedback F005
- Round: R002 (scope reconciliation)
- Verdict: LIKED (scope confirmation) + constraint recorded
- Scope: hero overhaul (owner task item 3) — confirmed to mean the practice-map page hero band ("archive of ai outputs / teaching concepts."), not the landing
- Decision: the hero rework = copy + composition + energy of the text band only. No new modules wanted there. History noted: the hero previously hosted a concept-graph rail; it was removed in the R004 full-width rework (the graph moved into each lesson card's foot) — the owner is fine staying without any new hero furniture.
- User source: «hero section - «archive of ai outputs / teaching concepts.») - this, yes. previously there was concept graph and it got removed. but i guess we can do without any new stuff there»
- Supersedes: none

## Round R003
- Goal: card-artwork ideation, corrected target (F004) — relay delivered "ten schematic plates": one shared near-black schematic-plate system, each plate a different projection (elevation, plan section, flow, form, exploded axo, schedule, single-line, building section, detail+profile, occupancy matrix), tiers T-I..T-IV carried consistently
- Preserved preferences: F001 (name stale), F004 (target = landing card artwork; directions as code), F005 (hero = copy band only, no new modules)
- Changes: none to the app — concept artifact for the owner's verdict
- Before: artifacts/R000-baseline/ + incumbent card "sky spot ink, terraced climb to a lit summit"
- After: artifacts/R003/ (gallery index.html + src/ with 10 standalone SVGs verbatim + 11 renders)
- Visual inspection: 10 plate shots + gallery-top shot read. All plates render; shared conventions hold (stock #0b0c0e, ink #d8d2c2, hairline, title blocks); tier vocabulary consistent across sheets; projections genuinely distinct. One defect found: plate 03 top-right legend box overlaps the "inlet: undifferentiated" label (collision at top edge). Aspect is 600×400 (3:2) vs the real card's 260×160 (13:8) — re-framing at integration. No blue accent anywhere (per the stripped prompt) — accent re-tint is integration work.
- Code verification: the plates' SVG loaded headlessly with zero console/page errors
- Open question: owner verdict — which plate(s) (or plate language) becomes the card direction; name still open

## Round R004
- Goal: integrate the owner-picked plate 10 ("occupancy matrix", pigeonhole wall tiers × months) into the landing card — `MatrixCenterMark` in ProjectArtwork.tsx reframed to the 260×160 card viewBox, wired into CENTER_MARKS, `project.ts` centerMark swapped trail→matrix
- Preserved preferences: F001 (name stale — card copy untouched), F004 (target = landing card artwork), F005 (hero band out of this round)
- Changes: `ProjectCenter` union gains `"matrix"` (portfolio/contracts/project-presentation.ts); `MatrixCenterMark` added to ProjectArtwork.tsx (ids `gem-matrix-*`, sparse-dot field, blue frontier cell + dashed next-slot, halo ellipse kept); incumbent `TrailCenterMark` retired to INCUMBENT_MARKS only (name-round comparison page still renders it); practice-map `presentation.centerMark: "matrix"`
- Before: artifacts/R004/before-card-1440.png (terraced climb card)
- After: artifacts/R004/after-card-1440.png (matrix card, forced reveal)
- Visual inspection: card shot at 1440 read. Matrix reads clean at card scale: 8 columns × 4 tier rows hold, filled/pending cells legible, single blue frontier cell + dashed next-slot is the one accent moment, halo glow sits on the lit cell without collisions; no cramping at the right edge. Card copy still says the old metaphors (eyebrow "07 · map", note "Practice route", motionLabel "the route unfolds") — intentionally untouched, tied to the open rename (F001).
- Code verification: `tsc --noEmit` + `vite build` in portfolio/shell — clean; card rendered headlessly with no console/page errors
- Open question: owner verdict — (a) keep the matrix card as-is, (b) tune density/marks, and the name decision (still blocking card copy + page rename)

## Feedback F006
- Round: R004
- Verdict: LIKED + adjust
- Scope: the matrix card mark — size
- Decision: keep the occupancy-matrix mark but make it smaller, around 15%
- User source: «i like it. make it smaller, around 15%»

## Feedback F007
- Round: R004
- Verdict: DECIDED
- Scope: product name (F001 resolved)
- Decision: rename the product to "Waste of tokens" — card copy and module metadata follow through now
- User source: «rename to 'Waste of tokens'»
- Supersedes: F001

## Round R005
- Goal: R004 follow-through — mark −15% and the "Waste of tokens" rename on every visible surface
- Preserved preferences: F005 (hero band rework stays a separate round), F006 (mark smaller), F007 (new name)
- Changes: `styles.css` — scoped caps `.project-artwork-center.center-matrix` max-width 221px desktop (260 → 221 = −15%; the percentage route was dead because the 260px cap binds first) and 204px mobile (240 cap); `project.ts` — title "Waste of tokens", tag "tokens", eyebrow "an archive of ai outputs, a lesson space, an open playground", description rewritten to the real scope, centerLabel "W / T", note "Occupancy ledger", motionLabel "the wall fills up", instruction re-worded to the wall metaphor; `progress.ts` review-notes export header "Waste of tokens / review notes"
- Before: artifacts/R004/after-card-1440.png (260px mark, "Practice Map")
- After: artifacts/R005/ (after-card-1440.png = 221px mark + new copy; after-card-390.png mobile)
- Visual inspection: both shots read. Desktop card: mark smaller and airier over the copy block, title "Waste of tokens" sets cleanly; mobile: 204px mark inside the 150px stage, title fits, description clamps by the existing line clamp. Card index now reads "08 · tokens" (list position shifted since R004 — positional, not ours).
- Code verification: `tsc --noEmit` + `vite build` clean; headless svg width measured 221px desktop / 204px mobile; no console/page errors
- Open question: hero band copy/energy rework (F002 + F005) — next round; owner hasn't briefed the new hero copy yet

## Feedback F008
- Round: R005
- Verdict: LIKED + adjust (three asks)
- Scope: matrix card wall frame; card tag; card description
- Decision: (1) the big containing rectangle needs a bigger, more prominent outline so the mark reads consistent with the other project illustrations — the mark is "too detailed, but i like it", only the outline lacked weight; (2) tag "tokens" → "playground"; (3) description drops "generated lessons with an"
- User source: «make the edges of the big rectangular (which contains within itself squares) bigger/prominent... also change tag from "tokens" to "playground". also remove from project description "...generated lessons with an..."»

## Round R006
- Goal: F008 follow-through — wall frame weight, tag, description trim
- Preserved preferences: F005 (hero band rework stays a separate round), F006 (221/204px mark size kept), F007 ("Waste of tokens" name)
- Changes: MatrixCenterMark wall rect `stroke="#7d7669" strokeWidth="1" opacity="0.7"` → `stroke="#b6ac95" strokeWidth="2.5" opacity="0.9"` — the paper-tone bold outline the house marks use (Spine vertebrae 2.5, Trail main line 2); project.ts tag "playground"; description "Model-tiered archive with an experimental lesson space and an open ai playground."
- Before: artifacts/R005/after-card-1440.png
- After: artifacts/R006/after-card-1440.png
- Visual inspection: desktop shot read. The wall frame now carries the card — the bold warm outline groups the hatch cells the way Spine/Trail marks group their subjects; cell density and the blue front stay untouched (owner asked outline only). Card reads "08 · playground / Waste of tokens / Model-tiered archive with an experimental lesson space and an open ai playground." on one line at 1440.
- Code verification: `tsc --noEmit` clean; card rendered headlessly with no console/page errors
- Open question: hero band copy/energy rework (F002 + F005) — next round; owner hasn't briefed the new hero copy yet

## Feedback F009
- Round: none (owner batch, 2026-09-19)
- Verdict: REJECTED
- Scope: hero h1 copy (both lines), all viewports
- Decision: the heading becomes "archive of ai outputs. not all of these are good." (page renders lowercase; the copy answers R006's open question — the owner has now briefed the hero copy)
- User source: task item 1: «Replace heading with: "Archive of AI outputs. Not all of these are good."»

## Feedback F010
- Round: none (owner batch, 2026-09-19)
- Verdict: REJECTED
- Scope: hero visual direction — the whole hero band, all viewports
- Decision: the hero renders "polished but generic"; it must immediately signal an AI experimentation space and needs a distinct concept — not just a layout adjustment
- User source: task item 2: «The hero currently renders as a polished but generic section. It should immediately signal that this is an AI experimentation space. Needs a distinct concept — not just a layout adjustment.»
- Supersedes: F005 (within hero scope only — the "copy band only, no new modules" constraint is lifted for this round; the hero may carry quiet composed graphics, not functional/interactive furniture)

## Feedback F011
- Round: none (owner batch, 2026-09-19)
- Verdict: REJECTED
- Scope: concept graphs everywhere (the per-lesson graph overlay opened from each card's "concept graph ↗" control, introduced when the hero rail died in R004) + lesson-card tags (the `.pg-chip` concept chips)
- Decision: remove all concept graphs; strip tags from lesson cards as well
- User source: task item 3: «Remove all concept graphs. Strip tags from lesson cards as well.»

## Feedback F012
- Round: none (owner batch, 2026-09-19)
- Verdict: REJECTED
- Scope: search bar (`.pg-search`) — typography and styling
- Decision: the bar "feels unrefined"; restyle toward the batch's target aesthetic
- User source: task item 4: «Search bar — typography and styling feel unrefined.»

## Feedback F013
- Round: none (owner batch, 2026-09-19)
- Verdict: REJECTED
- Scope: model list, left panel (`.pg-tier-list` / `.pg-tier-row`)
- Decision: too dense, no whitespace, visually undifferentiated — needs breathing room and row differentiation
- User source: task item 4: «Model list (left panel) — too dense, no whitespace, visually undifferentiated.»

## Feedback F014
- Round: none (owner batch, 2026-09-19)
- Verdict: REJECTED
- Scope: active model row highlight (`.pg-tier-row.is-active`)
- Decision: yellow (the ochre 9% fill) is heavy-handed; use something quieter — a muted accent or subtle weight shift
- User source: task item 4: «Active model highlight — yellow is heavy-handed; use something quieter — a muted accent or subtle weight shift.»

## Feedback F015
- Round: none (owner batch, 2026-09-19)
- Verdict: REJECTED
- Scope: "Go Back" button (`.pg-crumb-back`, volume view)
- Decision: reads as an unstyled default; restyle it into the page's language (this supersedes the "liked stylistically" part of the model-tier ledger's F024, which only scaled it down ~15% — the scale correction stands)
- User source: task item 4: «"Go Back" button — reads as unstyled default.»

## Feedback F016
- Round: none (owner batch, 2026-09-19)
- Verdict: REJECTED
- Scope: vertical spacing between lesson cards (`.pg-cards` gap) and folder groups (`.pg-faces` gap)
- Decision: increase both so the layout breathes
- User source: task item 5: «Increase vertical spacing between lesson cards and folder groups. Let the layout breathe.»

## Feedback F017
- Round: none (owner batch, 2026-09-19)
- Verdict: REJECTED
- Scope: left panel (model list) width (`.pg-layout` column ratio)
- Decision: narrow the model list panel by ~20–30%; pair with F016's added whitespace for balance
- User source: task item 6: «Narrow the model list panel by ~20–30%. Pair with the added whitespace from item 6 to maintain visual balance.»

## Feedback F018
- Round: none (owner batch, 2026-09-19)
- Verdict: REJECTED
- Scope: overall register of the listed surfaces (search, model list, active highlight, back button, cards)
- Decision: multiple elements read as default or template-driven; the target is "a senior developer's personal site — restrained, intentional, zero template energy" (binding aesthetic constraint for F012–F017)
- User source: task item 4: «Target aesthetic: a senior developer's personal site — restrained, intentional, zero template energy.»

## Round R007 (part A — hero, per docs/briefs/BRIEF-practice-map-r007-hero.md)
- Goal: F009 + F010 follow-through — h1 becomes "archive of ai outputs." / "not all of these are good." and the hero gets one distinct non-interactive concept: an archivist's review-log (the h1 is the verdict, the log below is the evidence — sample model outputs, two kept, two cut)
- Preserved preferences: F010 (distinct concept, zero interactive furniture), mobile presence law (≤900/≤560 padding + big type), no crowding of `.pg-layout` (its margin-top untouched), register laws (lowercase, hairlines, ochre family, --panel-radius, grain untouched)
- Changes: `PracticeMapPage.tsx` hero region — h1 copy swapped, aria-hidden `.hero-log` added (mono caption "from the archive — kept / cut" + `.hero-strata` of four sample outputs: two keep, two cut); `practice-map.css` hero block rewritten wholesale — panel becomes a grid with padding + `overflow: hidden`, `.hero-log` gets a top hairline, strata rows carry ochre pips (kept) vs struck rows (`--ink-accent-deep` line-through, `--ink-line` text/pip), 320-bound ellipsis truncation via `min-width: 0` + `text-overflow`, one-shot staggered `hero-log-in` gated by `prefers-reduced-motion: no-preference`; ≤900/≤560 padding moved from the h1 to the panel, type clamps kept verbatim
- Before: artifacts/R007/before-desktop-full.png, before-mobile-top.png
- After: artifacts/R007/after-hero-{1440,1024,900,560,390,320}.png
- Visual inspection: all six shots read. Verdict + log compose cleanly at every width; strata stay full-width until 390; at 320 three lines truncate to ellipsis (by design — "clipped output" reinforces the concept) and the h1 wraps rather than truncates; no collision with the kicker or `.pg-layout`; kept/cut marks and strike-throughs read at all sizes.
- Code verification: `tsc --noEmit` clean; `practice-map.check.mjs` passes except the pre-existing "ArrowRight advances sections" failure — confirmed failing identically on the unmodified tree (stash-verified) before this round's splice; headless probe at all six widths: zero console/page errors, no document or hero horizontal overflow, log height stable, truncation flags only at 320
- Open question: owner verdict on the review-log concept; F011–F018 batch (graphs/tags removal, search bar, model list, spacing, column ratio) is separate work, not this round

## Round R008
- Goal: element quality batch (F012–F015 under F018's bar) — search bar refinement, model-list air + differentiation, quiet active highlight, intentional Go Back (chat-model relay, brief docs/briefs/BRIEF-practice-map-r008-quality-batch.md)
- Preserved preferences: F018 (senior-dev aesthetic, zero template energy), register laws (lowercase mono, hairlines, ochre, pill radius), ≥44px touch floors with fine-pointer 40px steps, focus-visible outlines
- Changes: `TierList.tsx` — mono ordinal column (01–05, tabular, aria-hidden) added as the scan anchor; `TierPanel.tsx` — crumb arrow split into `.pg-crumb-arrow` span (search render unchanged); `tiers.css` — search input machined to 44/40px floors + .74rem/.05em mono + WebKit search chrome stripped (appearance:none, cancel/decoration reset) + quiet focus ring (accent border + 3px soft shadow, ochre caret); model list → flex column with .4rem row gap, per-row bottom hairline dropped, row padding .85rem/1rem, 3-col grid (auto/minmax/auto); active state → no fill: inset 2px ochre spine + ochre ordinal + ink-text name, hover = neutral rgba(238,234,224,.03) wash; Go Back → seated on --ink-panel, weight 500, accent directional arrow with translateX(-2px) hover (gap-morph hover deleted), crumb title stepped to .78rem/400
- Before: artifacts/R006/after-card-1440.png lineage (pre-batch page state; see R007a ledger row for the tree state)
- After: artifacts/R008/after-top-1440.png, after-volume-1440.png, after-top-700.png, after-top-390.png, after-search-focus-1440.png
- Visual inspection: five shots read. Model list reads as a considered index (ordinal anchor, air, no separators); active row unambiguous via spine + ochre ordinal with zero fill; search input and ⌘k pill share height (40/40 measured) and tracking; Go Back reads seated and dominant over its muted title; no browser-default search artifacts visible.
- Code verification: `tsc --noEmit` clean; `practice-map.check.mjs` green except the pre-existing "ArrowRight advances sections" failure (unchanged from R007a baseline); headless probe: no horizontal overflow at 1440/700/390, input/pill/back heights 40px fine-pointer as designed, ordinals render 01–05
- Open question: owner verdict on the batch (F012 search, F013 list, F014 active, F015 Go Back); R009 rhythm brief (F016 spacing + F017 width) comes next

## Round R009
- Goal: F011 follow-through — remove all concept graphs and strip tags from lesson cards (orchestrator-direct pass: pure deletion, no design choices, oversized for a chat-model brief)
- Preserved preferences: F011 verbatim (graphs + card tags die; curriculum `concepts` data untouched — only rendering changes), lesson overlay mechanics untouched
- Changes: `PracticeMapPage.tsx` — ConceptGraph + seedLayout/layoutParams/GraphLayoutParams/clampPct deleted (~480 lines incl. the graph's pointer/drag/seed engine), `graphTopic` state + keyboard-guard reference + prop threading + two now-unused react type imports (`CSSProperties`, `PointerEvent as ReactPointerEvent`) deleted; `practice-map.css` — the whole `.practice-graph-*` block (overlay/panel/header/canvas/edges/orbits/core/node states, 700px/400px sheets, 100dvh support, graph reduced-motion block) and the already-orphaned `.practice-concepts*` block deleted, grain comment updated to lesson-overlay z-index; `TierPanel.tsx` — concept chips block (cap/expand logic incl. the n196 law comment), `concept graph ↗` control and `onOpenGraph` prop threading deleted; card foot now renders only when a lesson exists; `tiers.css` — `.pg-chips/.pg-chip/.pg-chip.is-more` and `.pg-card-graph` rules deleted, `.pg-chip` dropped from the shared chrome selector, foot comment rewritten; `practice-map.check.mjs` — desktop/mobile/narrow graph legs deleted (overlay-closing Escape kept before the 320 free-reading leg, comment updated from "graph's scroll restore" to "overlay's")
- Before: artifacts/R008/after-top-1440.png lineage (cards carried chips + graph control)
- After: artifacts/R009/after-cards-1440.png, after-cards-390.png
- Visual inspection: both shots read. Cards are quieter: topline, title, summary, single outlined "open lesson →" pill; no chips row, no graph control; list/search/crumb from R008 unaffected.
- Code verification: `tsc --noEmit` clean; `practice-map.check.mjs` green except the pre-existing "ArrowRight advances sections" failure (unchanged since R007a); headless probe at 1440/390: zero `.pg-chip/.pg-chips/.pg-card-graph` elements, no horizontal overflow
- Open question: none for this pass (owner decided the removal); R010 rhythm brief (F016 spacing + F017 width) is next

## Round R010
- Goal: rhythm pass (F016 + F017 under F018's bar) — card/folder breathing + left panel narrowed ~20% (chat-model relay, brief docs/briefs/BRIEF-practice-map-r010-rhythm.md)
- Preserved preferences: F018 aesthetic line, R008 row anatomy (ordinal/name/count baseline grid), liked `.pg-layout` margin-top 40px, folder-tab ornament clearance
- Changes (chat model's spec): `.pg-layout` left fr 0.80 → 0.57 (~20.4% narrower; right absorbs freed width), `.pg-cards` gap .9 → 1.15rem, `.pg-faces` gap 1.1 → 1.4rem (tab clearance 8.6 → 13.4px), 700px steps .75→.95rem / .9→1.1rem
- Integration corrections (orchestrator, measured): the model's one-line claim failed at 1024 — headless measure: name "opus-4.8-thinking" needs 134px, count "20 lessons" 74px, ordinal 20px → left column would need ~282px, i.e. below-band narrowing; fixed by (1) row `column-gap` .85 → .6rem (frees 8px; gap still reads), (2) `.pg-tier-name` ellipsis+nowrap (the durable fix the chat model itself flagged in Notes; clip, never wrap — names are identifiers, the register already speaks "clipped output" on the hero log). Result: 20.4% narrowing kept AND zero wrapped names at every matrix width
- Before: artifacts/R008/after-top-1440.png lineage (0.80fr list, .9rem/.1.1rem gaps)
- After: artifacts/R010/rhythm-{1440,1024,700,560,390,320}.png
- Visual inspection: six shots read. Left column visibly narrower at 1440/1024, cards and folder groups airier (18.4/22.4px desktop, 15.2/17.6px ≤700), hierarchy faces>cards preserved; at 1024 the single clipped row ellipsizes cleanly ("opus-4.8-thinki…"), samples keep their existing clamp; no cramped or floating band anywhere.
- Code verification: `tsc --noEmit` clean; `practice-map.check.mjs` green except the pre-existing "ArrowRight advances sections" failure; headless probe across 1440/1024/700/560/390/320: no horizontal overflow, zero wrapped name rows, name clipping only at 1024 (1 row, by design), list column 339/267/628/528/358/288px, faces gap 22.4px with 13.4px tab clearance
- Open question: owner verdict on the whole batch (R007a hero concept, R008 quality pass, R010 rhythm); the original six-item task list is now fully worked

## Feedback F019
- Round: none (owner batch, 2026-09-20)
- Verdict: REJECTED (execution only)
- Scope: hero section — typography, layout, visual treatment; all viewports
- Decision: the hero remains generic despite R007a; the underlying sentiment (verdict + kept/cut review-log) is right — the copy block tone is confirmed — but the execution needs a full re-imagination; typography, layout, and visual treatment all open
- User source: task item 1: «The hero section remains generic despite recent iterations. The underlying sentiment is right, but the concept needs a rethink. The current copy block — [caption + 4 strata lines quoted verbatim] — captures the right tone, but let's reimagine the execution entirely. Typography, layout, and visual treatment should all be on the table.»
- Supersedes: none (refines F010: concept survived, execution reopens)

## Feedback F020
- Round: none (owner batch, 2026-09-20)
- Verdict: REJECTED (rationale level)
- Scope: model list, left panel — design rationale, not mechanics
- Decision: the list is solid and the selected-model state improved, but it lacks the deliberateness of a senior-level design — a unifying rationale connecting it to the broader system is missing
- User source: task item 2: «The model list is solid. The selected-model state has improved, but it still lacks the deliberateness expected at a senior design level. It feels professionally executed — yet absent of a unifying design rationale connecting it to the broader system.»

## Feedback F021
- Round: none (owner batch, 2026-09-20)
- Verdict: REJECTED (spacing)
- Scope: mobile — vertical spacing between model list and search bar, and between search bar and lesson cards / folders
- Decision: increase both zones by approximately 20%
- User source: task item 3: «On mobile, increase vertical spacing in two areas: between the model list and the search bar; between the search bar and the lesson cards / folders. Target approximately a 20% increase in both zones.»

## Feedback F022
- Round: none (owner batch, 2026-09-20)
- Verdict: REJECTED (design level)
- Scope: folder design & spacing (`.pg-face` groups)
- Decision: increase spacing between folders; current design reads as templated — subtle refinements in shape, shadow, or typographic hierarchy would add distinction without overcomplicating
- User source: task item 4: «Increase spacing between folders. The current design is functional but reads as templated — subtle refinements in shape, shadow, or typographic hierarchy would add distinction without overcomplicating things.»

## Feedback F023
- Round: none (owner batch, 2026-09-20)
- Verdict: REJECTED
- Scope: "Go Back" button (`.pg-crumb-back`)
- Decision: underdesigned relative to the rest of the interface; needs a treatment reflecting the same craft and intentionality found elsewhere (supersedes the R008 resting treatment; F015's core complaint stands)
- User source: task item 5: «This element feels underdesigned relative to the rest of the interface. It needs a treatment that reflects the same level of craft and intentionality found elsewhere in the layout.»

## Feedback F024
- Round: none (owner batch, 2026-09-20)
- Verdict: REJECTED (direction)
- Scope: the whole Waste of tokens page register
- Decision: visually continuous with the main page — same design language, same polish; divergence only in confidence: selective moments of boldness and creative risk, anchored by minimalist restraint. Benchmark: a senior developer's portfolio — precise, opinionated, quietly assertive (binding for this whole batch; supersedes F018's narrower phrasing)
- User source: task item 6: «The practice map (Waste of tokens) should be visually continuous with the main page — same design language, same level of polish. Where it should diverge is in confidence: selective moments of boldness and creative risk, always anchored by minimalist restraint. The benchmark is a senior developer's portfolio — precise, opinionated, and quietly assertive.»
- Supersedes: F018 (aesthetic bar restated and widened)

## Round R011
- Goal: hero execution re-imagination (F019 under F024's widened bar) — the review-log sentiment kept, the "big text card" execution replaced by a full re-think of typography/layout/visual treatment (chat-model relay, brief docs/briefs/BRIEF-practice-map-r011-hero-execution.md)
- Preserved preferences: F009 (h1 copy verbatim), F019's confirmed tone (caption + four strata lines verbatim), F010 lift (quiet composed graphics, zero interactive furniture), register laws (lowercase, mono chrome, ochre discipline, grain), mobile presence law (proportionate h1 at 390/320, real vertical presence)
- Changes (chat model's spec, "the record sheet" — masthead + ruled disposition ledger on the bare field): hero JSX rebuilt — h1 split into two overflow-masked lines (landing hero's masked line-rise device), verdict line gains the landing's 700-ochre emphasis law; `.hero-strata` → `.hero-ledger` (accession | specimen | disposition 3-col grid, 01–04 record numbers, right-aligned kept/cut disposition column with ochre pip + strike encoding — multi-channel, grain-robust); panel skin deleted entirely (scrim/border/left-rule/radius gone — hero sits on the field like the landing hero); h1 clamp divisor 26→19, cap 3.2→3.9rem (the one sanctioned bold moment, just past the landing's 3.68); log type promoted 0.66–0.82→0.78–0.95rem; caption tracked 0.03→0.16em; entrance = masked line-rise (0.7s, 0.12s stagger) + ledger row stagger (0.24–0.45s), all gated `no-preference`, non-load-bearing; ≤560 drops the accession gutter (specimen|disposition survives, kept/cut never loses its column)
- Before: artifacts/R000-r011-baseline/ (a-desktop-hero-1440, b-desktop-full-1440, d/e volume views, f-mobile-390, g-mobile-320, h-tablet-1024)
- After: artifacts/R011/ (same eight views + i-band-700, j-band-560)
- Visual inspection: eight shots read. 1440: verdict/ledger share one measure, disposition column answers the dead right field, masthead ascenders unclipped inside the masks; body hierarchy faces>cards>list intact below the bare-field hero. 1024: verdict ~50px, ledger full-width. 700: 3-col ledger holds, specimens near-full. 560: accession dropped cleanly, kept/cut column retained. 390: h1 proportionate untruncated, specimens ellipsis (clipped-output concept), dispositions legible. 320: h1 wraps inside its masks (no clipping), truncation flags on specimens only, zero overflow
- Code verification: `tsc --noEmit` clean; `practice-map.check.mjs` green except the pre-existing "ArrowRight advances sections" failure (unchanged baseline); headless probe at 1440/1024/700/560/390/320: docΔ=0, heroΔ=0, 4 rec + 4 disp rows everywhere, zero console/page errors
- Open question: owner verdict on the record-sheet execution (F019); the model's one logged interpretation — "panel keeps real vertical presence" read as "hero keeps real vertical presence" (panel skin deleted by design) — stands unless the owner wants a literal panel back. Next: R012 element-craft brief (F020 model-list rationale, F022 folders, F023 Go Back), then R013 mobile spacing (F021, orchestrator-direct)

## Feedback F025
- Round: none (owner batch, 2026-09-20, post-R011 review)
- Verdict: REJECTED (scale + treatment)
- Scope: hero heading — the subtext line ("not all of these are good.") + heading treatment, all viewports
- Decision: scale the subtext down to ~40% of its current size; drop ALL stylistic effects on the heading (the masked line-rise, the 700-ochre emphasis); select a typeface that feels archival and unembellished — something that gets out of its own way
- User source: item 1: «"Archive of AI Outputs. Not all of these are good." Scale the subtext down to ~40% of its current size. Drop all stylistic effects on the heading and select a typeface that feels archival and unembellished — something that gets out of its own way.»
- Refines: F019 (the record-sheet structure survived review; scale/effects/typeface reopen)

## Feedback F026
- Round: none (owner batch, 2026-09-20, post-R011 review)
- Verdict: REJECTED (premise)
- Scope: hero ledger entries — the kept/cut semantics
- Decision: "good structure, wrong premise" — the entries must NOT frame a review process (keep good / discard bad); this is an archive where nothing gets discarded and pristine completions sit alongside hallucinated capital cities; the section must reflect indiscriminate preservation, not editorial judgment. Rethink.
- User source: item 2: «Good structure, wrong premise. The current entries frame this as a review process — keep the good, discard the bad. That contradicts the core idea. This is an archive. Nothing gets discarded. Pristine code completions sit alongside hallucinated capital cities. The section needs to reflect that indiscriminate preservation, not editorial judgment. Rethink.»
- Supersedes: F019's confirmed tone in scope (the kept/cut legend + per-row dispositions die; h1 copy survives — the owner re-quoted it as the heading)

## Feedback F027
- Round: none (owner batch, 2026-09-20, post-R011 review)
- Verdict: REJECTED (active state)
- Scope: model list active-row treatment (`.pg-tier-row.is-active` — the ochre inset spine + ochre ordinal device from R008)
- Decision: keep the left-rail model list as-is otherwise; replace the yellow active-state highlight with something quieter — current styling reads "performative rather than intentional"; a senior portfolio communicates restraint, not range
- User source: item 3: «Keep the left-rail model list. Replace the yellow active-state highlight with something quieter. As it stands, the styling feels performative rather than intentional. A senior portfolio should communicate restraint, not range.»
- Supersedes: R008's F014 resolution (spine + ochre ordinal) within active-row scope

## Feedback F028
- Round: none (owner batch, 2026-09-20, post-R011 review)
- Verdict: REJECTED (focus state)
- Scope: search bar focus treatment (`.pg-search input:focus` + `:focus-visible`)
- Decision: the ochre border + glow/underline on focus are overdesigned; a subtle shift in border weight or opacity is sufficient; the interaction should feel seamless, not announced
- User source: item 4: «The yellow border and underline on focus are overdesigned. Dial it back — a subtle shift in border weight or opacity is sufficient. The interaction should feel seamless, not announced.»
- Supersedes: R008's focus treatment within search-input scope

## Feedback F029
- Round: none (owner batch, 2026-09-20, post-R011 review)
- Verdict: REJECTED (removal)
- Scope: the per-lesson status machinery (queued / in progress / revisit / applied)
- Decision: remove entirely — a leftover from an earlier concept; no longer serves the project. Renders today as the lesson-window statusrow select and the footer "N queued" count (no status renders on the map cards themselves; `.practice-topic-status*` CSS is already orphaned)
- User source: item 5: «Remove entirely. The "Queued" / "In Progress" states are a leftover from an earlier concept and no longer serve the project.»

## Round R012
- Goal: leg A of the post-R011 owner batch — F028 (search focus quieted) + F029 (status machinery removed) — orchestrator-direct: pure deletion + one-line restyle, no design choices to delegate (R009 precedent)
- Preserved preferences: F018/F024 register laws, focus-visible visibility law (keyboard focus keeps a visible ring — neutral, not ochre), the reset-progress control (notes/feedback remain resettable)
- Changes: `tiers.css` — search input focus drops the ochre border + 3px ochre glow (box-shadow transition removed); focus = border steps one opacity notch (line-soft → line), `:focus-visible` = 1px neutral ring (ink-line, offset 2px); ochre caret kept (typing affordance, not an announcement). `PracticeMapPage.tsx` — STATUS_LABELS, summary/summarizePractice call, LessonOverlay status/onStatusChange props + handleStatusChange + the statusrow JSX, footer "{queued} queued" span all deleted; reset confirm reworded to "Reset all notes and progress?"; ChangeEvent + TopicStatus imports removed. `progress.ts` — status field deleted from TopicProgress, setTopicStatus, PracticeSummary, summarizePractice, statusSummaryKey, TOPIC_STATUSES, isTopicStatus removed; createInitialState/loadPracticeState reshaped (old saved statuses are ignored on load, no migration needed). `curriculum.ts` — TopicStatus type removed. `practice-map.css` — orphaned `.practice-topic-status*` (pre-existing orphans) and `.practice-lesson-statusrow`/`.practice-lesson-status` rules deleted
- Before: artifacts/R000-r011-baseline lineage + the shipped R011 page state
- After: artifacts/R012/ (search-focus-1440, lesson-window-top-1440, footer-1440)
- Visual inspection: lesson window opens straight into section chips (no status row); footer renders "local notes · no account | reset progress" (no queued count); focus state computed neutral (rgba(238,234,224,.26) border, box-shadow none)
- Code verification: `tsc --noEmit` clean; `practice-map.check.mjs` green except the pre-existing "ArrowRight advances sections" failure (unchanged baseline)
- Open question: none — owner-decided removals. Next: R013 = the design leg (F025 subtext/typeface, F026 archive-premise rethink, F027 quieter active state) via chat-model brief

## Round R013
- Goal: design leg of the post-R011 batch — F025 (subtext ~40%, effects off, archival typeface), F026 (archive premise: indiscriminate preservation), F027 (quieter active state) — three chat-model candidates compared for the owner; Output 3 integrated with Output 2's caption copy (owner pick)
- Preserved preferences: F019's scale statement (line 1 clamp law unchanged), F026 (no kept/cut anywhere), F024 register laws, focus-visible law, decorative ledger law
- Changes (Output 3's build): h1 re-set in "IBM Plex Serif", Georgia, "Times New Roman" fallback, weight 400 (one family added to the existing Google Fonts link, portfolio/shell/index.html); letter-spacing −0.01em, line-height 1.04; masks/`.hero-line-in`/`.hero-verdict` deleted; subtext = `max(0.68rem, 0.4em)` — a true 40% proportion with a disclosed legibility floor engaging below ~350px; ledger drops the disposition column entirely (2-col: accession | specimen — the verdict has nowhere to render), caption copy "accession register — outputs preserved as received" (owner-picked from Output 2), rows and accession numbers uniform (`--ink-faint`/`--ink-muted`), all four specimen lines verbatim; all hero entrance animation removed (heading may not animate; a static register under a static masthead is the quieter read); ≤560 rec overrides deleted (base 2-col grid holds to 320); `.pg-tier-row.is-active` = pure contrast lift (row color ink-text, ordinal → ink-text, sample → muted; no ochre/fill/spine/reflow, distinct from hover which lights only the name)
- Before: artifacts/R011 lineage (the shipped record-sheet hero)
- After: artifacts/R013/ (a-desktop-hero-1440, b-desktop-full-1440, d/e volume views, h-tablet-1024, i-band-700, j-band-560, f-mobile-390, g-mobile-320)
- Visual inspection: eight shots read. Masthead sets plainly at 62.4px serif with no ascender/descender clipping; subtext 24.96px at 1440 (measured ratio 0.40); register uniform, no review semantics; active model row reads as the only fully-lit record (ordinal + sample), zero ochre; footer clean of queued counts (R012). Known disclosed behavior: at 320 the legibility floor lifts the ratio to 0.47 (10.88px subtext) — the floor working as specced
- Code verification: `tsc --noEmit` clean; `practice-map.check.mjs` green except the pre-existing "ArrowRight advances sections" failure; headless probe at 1440/1024/700/560/390/320: docΔ=0, heroΔ=0 everywhere, 4 rec rows, 0 rec-disp, h1 face resolves IBM Plex Serif, subtext ratio 0.40 at all widths ≥390
- Open question: owner verdict on the quiet accession register + serif masthead + lit-record active state (F025–F027); the item-2 caption is owner-picked, not the model's own — recorded as the integration note

## Feedback F030
- Round: none (owner batch, 2026-09-20, post-R013 review)
- Verdict: REJECTED (mobile size)
- Scope: hero subtext line (`.hero-sub`) — mobile breakpoints
- Decision: undersized on mobile; increase its font size by ~15% at smaller breakpoints for legibility (desktop proportion untouched)
- User source: item 1: «The hero section headline — "not all of these are good." — is undersized on mobile. Increase its font size by ~15% to improve legibility at smaller breakpoints.»

## Feedback F031
- Round: none (owner batch, 2026-09-20, post-R013 review)
- Verdict: REJECTED (copy)
- Scope: accession register specimen entries (`.hero-ledger .rec-out` — the four placeholder output fragments)
- Decision: replace with fresh, concise text (same indiscriminate-preservation premise — the quality spread stays)
- User source: item 2: «The accession register block requires new copy. The current placeholder entries … should be replaced with fresh, concise text.»

## Feedback F032
- Round: none (owner batch, 2026-09-20, post-R013 review)
- Verdict: REJECTED (removal)
- Scope: the kicker line "playground · 5 models · 29 lessons" (`.pg-kicker`)
- Decision: remove entirely — it draws too much visual attention relative to its importance
- User source: item 3: «The "playground · 5 models · 29 lessons" label draws too much visual attention relative to its importance. Remove it entirely.»

## Feedback F033
- Round: none (owner batch, 2026-09-20, post-R013 review)
- Verdict: LIKED (hero) + REJECTED (body containers)
- Scope: container treatments — model selector rows + lesson cards (rounded 20px panels)
- Decision: the revised hero is strong; the model selector and lesson cards use rounded rectangles that don't feel like the same design system — explore alternative container treatments to establish a unified visual language across both components (hero itself stays)
- User source: item 4: «The revised hero section is strong. That said, there's a visual inconsistency between that and the model selector, the lesson cards — they currently use rounded rectangles and don't feel like they belong to the same design system. Consider exploring alternative container treatments to establish a more unified visual language across both components.»

## Round R014
- Goal: direct leg of the post-R013 batch — F030 (mobile subtext +15%) + F032 (kicker removal) — orchestrator-direct: arithmetic + deletion; items F031 + F033 are design work and go to the chat-model relay (Brief C)
- Preserved preferences: F019/F025 desktop proportion (0.40 ratio survives at ≥1024), the accession register structure, register laws
- Changes: `PracticeMapPage.tsx` — the `.pg-kicker` paragraph deleted; `tiers.css` — `.pg-kicker` dropped from the shared mono-chrome selector and its own rule deleted; `practice-map.css` — ≤900 block gains `.hero-sub { font-size: max(0.78rem, 0.46em) }` (floor 0.68→0.78rem, proportion 0.4→0.46em — both +15%; inherits into the ≤560 band)
- Before: artifacts/R013 lineage (the shipped quiet register)
- After: artifacts/R014/ (same eight views)
- Visual inspection: eight shots read. Kicker gone — hero opens the page directly, top rhythm intact; mobile subtext 12.9px@390 / 12.48px@320 (measured +15.0% / +14.7%), desktop untouched (24.96px@1440, ratio 0.40); model list/cards/folders unchanged (containers are the chat-model leg's scope)
- Code verification: `tsc --noEmit` clean; `practice-map.check.mjs` green except the pre-existing "ArrowRight advances sections" failure; headless probe: docΔ=0 everywhere, kicker count 0, subtext 21.34px@700 / 16.19px@560 / 12.92px@390 / 12.48px@320
- Open question: none on this leg; F031 (register copy) + F033 (container unification) briefed to the chat model next (Brief C, docs/briefs/BRIEF-practice-map-r015-unified-voice.md)

## Round R015
- Goal: design leg of the post-R014 batch — F031 (fresh register copy) + F033 (unified container language) — chat-model relay (Brief C, docs/briefs/BRIEF-practice-map-r015-unified-voice.md), integrated
- Preserved preferences: F019/F025 hero untouched (owner: strong), the R013 lit-record active device, register laws, pill controls at 999px, class names + click targets (check-driven)
- Changes (the "ruled record" family — the body joins the hero's two-rule recipe): register JSX — four specimen lines replaced ("try wrapping that fetch in a try/catch…" / "git rebase deletes your commits for good…" / "for i, row in enumerate(rows): yield…" / "as an ai model i can't advise on that…" — useful/false/code/refusal spread, all unclipped at 1440, caption untouched); tiers.css — `.pg-tier-list` becomes a ruled group (gap 0, border-top --ink-line matching .hero-ledger), `.pg-tier-row` flush records (padding .85rem 0, border 0 + bottom hairline --ink-line-soft matching .rec, radius 0, no fill), hover = wash + separator brighten + name, active = lit-record device (ordinal → ink-text, sample → muted) + faint persistent wash 0.02, `:focus-visible` outline added for the flat surface; `.pg-cards`/`.pg-card` same family (gap 0 + top rule; padding 1.6rem 0, transparent; hover = wash + separator brighten, NO lift/shadow — a record doesn't float; is-flash = ochre rule + ochre wash 0.06, placed after :hover so it wins); mobile fragments: ≤700 row padding .75rem 0 (min-height 44 kept) + card padding 1.15rem 0 + cards gap 0, ≤560 card padding 1rem 0
- Before: artifacts/R014 lineage (rounded panels + hover-only rows)
- After: artifacts/R015/ (same eight views)
- Visual inspection: eight shots read. The page reads as ONE continuous ruled archive: the register, the model index and the cards share the opening-rule + hairline-separator recipe, content flush to the field; active row reads lit without ochre; cards discrete via rule + hierarchy, not walls; flash distinguishable by the ochre rule color; volume/crumb views unaffected (out of scope); the register's fresh entries read as logged outputs (the false rebase claim sits unjudged next to the generator idiom — the premise at work)
- Code verification: `tsc --noEmit` clean; `practice-map.check.mjs` green except the pre-existing "ArrowRight advances sections" failure; headless probe: docΔ=0 everywhere, 4 fresh entries, ratio 0.40 desktop / 0.46 mobile (known disclosed proportion)
- Open question: owner verdict on the ruled-record unification (F033) + the fresh register copy (F031); the family recipe (group top rule + member separators, no radius/fill/walls) is deliberately extendable — folders (F022) and Go Back (F023) are the natural next adopters if the owner re-opens them

## Feedback F034
- Round: none (owner batch, 2026-09-20, post-R015 review)
- Verdict: REJECTED (removal)
- Scope: the accession register block — caption + all four specimen entries (`.hero-log`, `.hero-ledger`, `.rec*`)
- Decision: remove the text whatsoever; add enough breathing space instead so the hero section is prominent enough on its own
- User source: «"accession register — outputs preserved as received / 01 … 04 …" let's remove this text whatsoever. add enough breathing space instead of it so that hero section would be prominent enough.»

## Feedback F035
- Round: none (owner batch, 2026-09-20, post-R015 review)
- Verdict: REJECTED (tap-highlight bug)
- Scope: model rows + lesson cards — tap/click highlight geometry
- Decision: the highlight reads buggy — records have no left/right walls, yet the focus outline draws a full rectangle and text/figures touch the container edges; keep the highlighting but inset the content so text/figures never touch the edge of the container
- User source: «clicking model/lesson is not working great because it highlights corners of them. but they don't have cornes in their leeft and right side. it looks buggy because of that. … maybe we should keep the highlighting but maake it so that the text/figures dont touch the edge of the container»

## Feedback F036
- Round: none (owner batch, 2026-09-20, post-R013 review)
- Verdict: REJECTED (mobile search size)
- Scope: search bar (`.pg-search`) — mobile width
- Decision: ~25% smaller on mobile, with enough breathing room from both sides
- User source: «search bar should be smaller around 25% on mobile and with enough breathing room from both sides.»

## Round R016
- Goal: direct leg of the post-R015 batch — F034 (register text removed, hero breathing) + F035 (highlight inset fix) + F036 (mobile search sizing) — orchestrator-direct: deletion + geometry arithmetic; no design exploration to delegate
- Preserved preferences: F019/F025 masthead scale, the ruled-record family recipe, lit-record active device, register laws, pill controls at 999px, class names + click targets (check-driven)
- Changes: `PracticeMapPage.tsx` — the whole `.hero-log` block (caption + ol + four entries) deleted; `practice-map.css` — every register rule deleted (`.hero-log`, `.hero-log-cap` + .k/.c, `.hero-ledger`, `.rec`, `.rec-no`, `.rec-out`); hero becomes the masthead alone — `padding: clamp(0.5rem,1.5vw,1.1rem) 0 clamp(3rem,7vw,5.5rem)` (single grid child; dead gap removed), ≤900 padding 0.5rem 0 2.5rem, ≤560 0.4rem 0 2rem. `tiers.css` — rows and cards get content insets: rows `padding: .85rem 1rem` (≤700: `.75rem .85rem`, min-height 44 kept), cards `padding: 1.6rem` (≤700 1.15rem, ≤560 1rem) — text/figures inset from the open sides, the full-width wash now breathes around content; keyboard focus swaps the four-sided outline for the family device (record's own separator turns ochre, outline none; `.pg-tier-row` dropped from the shared outline selector); tier-head + crumb bottom hairlines dropped — each ruled group now carries ONE opening rule (the unification completion the relay disclosed); search bar ≤700: `width:100%; max-width:75%; margin-inline:auto` (definite width keeps the flex row filling — the auto-margin fit-content trap measured 58.7% before the fix)
- Before: artifacts/R015 lineage (ruled records with flush text + outlined focus)
- After: artifacts/R016/ (same eight views) + probes/pm-r016-fix shots (list-focus-1440, search-390, local)
- Visual inspection: ten shots read. Hero = the verdict alone over generous field — prominent, quiet, no dead weight beneath; the layout opens with clear rhythm. Tap highlights: wash spans full width, text sits 16px/25.6px inside — no phantom corners; keyboard focus = the ochre separator (computed rgb(211,155,97), outline none); mobile bar measured 269px = exactly 75% of the 358px section, centered, ~45px field each side
- Code verification: `tsc --noEmit` clean; `practice-map.check.mjs` green except the pre-existing "ArrowRight advances sections" failure; headless probe: docΔ=0 everywhere, register count 0, insets verified, search share verified against the section
- Open question: owner verdict on the breathing hero (F034), the inset highlight (F035), and the mobile search sizing (F036); folders (F022) and Go Back (F023) remain parked pending owner steer
