# Design ledger — quicknotes card mark (catalogue illustration)

Task: re-language the Quicknotes card illustration to the house ink style.
Artifacts under `artifacts/R<nnn>/`. Append-only.

## Baseline (pre-R001)
- Observed (baseline-quicknotes.png): hollow rounded-rect tiles + open note with bright #7aa2f7 fold + flat tray outline; uniform strokes; no halftone bed, no fills, no texture. Reads as an app-icon set, not as the catalogue's ink language.
- Language references: reference-spine.png (halftone bed, filled slates with bone borders, dashed waiting slot, registration ticks), reference-raft.png (coral-crowned element, dotted stage, dash grammar).
- Owner verdict (source message): the illustration "works well on its own, but it doesn't align with the overall design language of the webpage."

## Round R001
- Goal: re-language the quicknotes card mark from flat app-icon style to the house ink-mechanism language (owner: "works well on its own, but doesn't align with the overall design language of the webpage").
- Preserved preferences: none on record yet.
- Changes: replaced QuicknotesCenterMark JSX with a risograph two-ink mechanism (relay-named-style prompt, risograph genre): halftone oval bed (two opacities), guide rails with dashed drop path + pulley dots, falling dog-eared note (slate fill #26333b, bone border, steel text lines, blue cursor accent #7aa2f7), tray back + filed note + dashed waiting slot + tray front. Salvage repairs on the reply: renamed to the registry symbol; removed its opaque #0b1317 canvas rect (card canvas + hover transition must stay live); hard-edged full-width halftone band softened into fading oval beds; accent re-tinted #c2705a → #7aa2f7 (coral reads as raft's territory; blue is the app's identity and the realm door hue).
- Before: artifacts/R001/baseline-quicknotes.png
- After: artifacts/R001/after-quicknotes-r001.png
- Visual inspection: performed — headless Chromium (puppeteer-core + playwright chromium), 1440×900@2x, artwork element of the quicknotes card on the dev server; compared against reference-spine/reference-raft shots in the same session/state. Reads at card scale; single accent; no hollow geometry left.
- Code verification: typecheck/build not rerun after JSX-only edit inside an existing component (no signature/contract change); NOT RUN this round, next build will cover.
- Open question: LIKED / REJECTED? Sub-questions if mixed: bed density, tray reading as "boat", keeping #7aa2f7 vs house steel for the cursor accent.

## Feedback F001
- Round: R001
- Verdict: LIKED (mild)
- Scope: R001 composition as a whole, catalogue card, desktop
- Decision: owner said "it is fine" — acceptable baseline, but immediately asked to try an alternative variant, so the round continues; not a closing approval.
- User source: "it is fine. but let's try this one -" (variant B pasted)
- Artifact: artifacts/R001/after-quicknotes-r001.png
- Supersedes: none

## Round R002
- Goal: evaluate the owner's relay-sourced alternative mark (variant B, "drop tray") against R001.
- Preserved preferences: F001 (R001 acceptable; not closing).
- Changes: swapped QuicknotesCenterMark to variant B verbatim minus consistency repairs: opaque #0b1317 canvas removed, role/aria-label + xmlns + width/height attrs dropped (house convention), internal name kept under registry symbol, dots array typed ReactElement (global JSX namespace is gone in React 19 types). Accent kept AS DELIVERED (#c8785a muted terracotta) so the comparison is honest — accent question explicitly on the table.
- Before: artifacts/R001/after-quicknotes-r001.png
- After: artifacts/R002/after-quicknotes-r002.png
- Visual inspection: performed — same viewport/session/state as R001 shots. Observations: tray reads cleaner than R001's (steel lip + bone rim, no boat echo); dashed waiting slot floats detached top-right (story linkage weaker than R001's slot-in-tray); dot bed is a hard-edged rectangular field peeking from behind the tray (house beds fade in ovals); dog-ear sits at the note's bottom-right corner (subtle); single rust accent visible.
- Code verification: NOT RUN (JSX-only swap inside an existing component; next build covers). Visual render confirmed via dev server screenshot.
- Open question: R001 or R002 (or a mix — e.g. R002 tray + R001 in-tray slot + fading oval bed)? Accent: keep variant's terracotta #c8785a, move to app blue #7aa2f7 (realm door hue), or house steel #7b93b3?

## Feedback F002
- Round: R002
- Verdict: REJECTED (as final)
- Scope: both presented marks (R001, R002), catalogue card
- Decision: both read "ok" but as tidy illustrations of a note app; the owner wants a creative concept with senior-developer taste — an idea carried by the mechanism, not just a well-drawn tray. R001 stays the acceptable fallback if nothing better lands.
- User source: "these are ok but i want some creative approach but something in the taste of a senior developer"
- Artifact: artifacts/R002/after-quicknotes-r002.png
- Supersedes: F001 (R001's mild-acceptance no longer closes the task; R001 demoted to fallback)

## Round R003
- Goal: owner steer — "creative approach in senior-developer taste" (F002); concept-level round fed by the randomized model's raw intelligence (5 concepts), owner shortlist → V5 "anchored note, slack tether" picked for re-inking.
- Preserved preferences: F002 (R001/R002 not final; R001 fallback).
- Changes: QuicknotesCenterMark → V5 concept, house-inked by orchestrator per the new division of labour (model = concept; owner side = tokens): slate note slab #26333b with bone border, steel line + #7aa2f7 cursor line, dim ledge #465059, dashed remote box #b6ac95 + slack dashed tether #7b93b3, fading halftone bed (pattern id qn-bed, unique for page DOM).
- Before: artifacts/R002/after-quicknotes-r002.png (and R001)
- After: artifacts/R003/after-quicknotes-r003.png
- Visual inspection: performed — first two shots came back EMPTY; root-caused: the catalogue hides .project-artwork (visibility:hidden) until the card scrolls into view (shell reveal-on-scroll), so the screenshot procedure now scrollIntoView + settle before capture; after-fix shot verified: single accent, story reads, house vocabulary intact.
- Code verification: NOT RUN this round (JSX-only swap; next build covers).
- Open question: verdict on R003 vs R001 fallback vs R002 — LIKED closes the mark task; also confirm accent #7aa2f7.

## Feedback F003
- Round: R003
- Verdict: LIKED (directed)
- Scope: catalogue card mark, concept level
- Decision: owner prefers the V4 "tally on the ground" concept in the house-inked rendering (shown in the 5-concept comparison) over the presented R003; blocks settling on a line with the last copy still airborne is the story to ship.
- User source: "i think this was better - V4 house-inked"
- Artifact: v5-compare.png row 2, tile 4 (house-inked V4)
- Supersedes: F002's open question — R003 presented but not adopted; R001 remains fallback, R002 retired

## Round R004
- Goal: ship the owner-directed V4 "tally on the ground" concept (F003) into the card.
- Preserved preferences: F003 (V4 house-inked is the direction), F002 (senior-taste restraint).
- Changes: QuicknotesCenterMark → V4 house-inked exactly as judged in the concept comparison: fading halftone bed, ledge bar #465059, four landed blocks (slate fills #26333b/#465059 with steel/bone borders, the live one #7aa2f7), fifth copy still airborne as dashed bone outline + counterweight dot. No canvas rect (card canvas stays live).
- Before: artifacts/R003/after-quicknotes-r003.png
- After: artifacts/R004/after-quicknotes-r004.png
- Visual inspection: performed — scrollIntoView procedure (reveal-on-scroll accounted), shot verified against the judged compare tile: composition matches, single blue accent, dashes = pending, bed reads.
- Code verification: NOT RUN (JSX-only swap inside existing component; next build covers).
- Open question: closing confirm — LIKED on R004 closes the mark task (final build check then runs).
