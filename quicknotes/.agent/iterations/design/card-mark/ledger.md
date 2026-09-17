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
