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
