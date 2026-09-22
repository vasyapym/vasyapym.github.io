# Ledger — main-page project presentation (desktop)

Task: rethink how the 6 project cards are presented on the main page (desktop). Owner verdict on the standing layout: the 2-column gemstones grid makes too much animated illustration run at once — "candy collection rather than professional showcase". Individual cards are solid and stay as-is. Exploring alternative layout / interaction / visual-effect presentations that stay organic with the existing ink aesthetic. Delegated ideation (5 variants) to the chat model per minimize-iteration; orchestrator adapts the chosen direction to the shell.

## Round R001
- Goal: collect 5 distinct presentation variants (concept + code each) via chat-model delegation; no code change this round.
- Preserved preferences: F001 (illustrations + overall feel), F002 (cards stay as-is); ink catalogue hero + realm mode untouched (n149/n222 chain).
- Changes: none to code — delegation round.
- Before: artifacts/R001/baseline-grid.png, artifacts/R001/baseline-viewport.png (desktop 1440×810@2x, grid scrolled into view)
- After: pending chat-model reply
- Visual inspection: baseline captured and inspected — 2-col grid, dark panels, animated SVG stage per card (Quicknotes dock, Spine cursor-L, Waste of tokens grid, Cat Runner face), threshold band ("the same work, beneath the surface." / "enter the deep") directly above the grid.
- Code verification: NOT RUN (no code change)
- Open question: owner picks which variant(s) to adapt into the shell once the 5 come back.

## Feedback F001
- Round: R001
- Verdict: LIKED
- Scope: main page overall — illustrations, overall feel
- Decision: preserve the illustrations and the page's overall character; the problem is layout-level, not artwork-level
- User source: "I love my portfolio's main page — the illustrations and overall feel are great"
- Artifact: R001 baseline screenshots
- Supersedes: none

## Feedback F002
- Round: R001
- Verdict: REJECTED
- Scope: projects section, desktop viewport — 2-column card grid with all artworks animating simultaneously
- Decision: avoid presentations where many animated illustrations run at once; keep individual cards as-is; any replacement must feel organic and consistent with the existing design
- User source: "having two project cards per row (2-column grid) makes it feel like there's too much animated illustration happening at once… a candy collection rather than a professional showcase"; "The individual cards themselves are solid and should stay as-is"
- Artifact: R001 baseline-grid.png
- Supersedes: none

## Round R002
- Goal: relay delegation abandoned by owner with no data (minimize-iteration2 S3 aborted); orchestrator proposes 5 presentation variants directly, grounded in the shell baseline. All variants hold motion budget to ≤1 live artwork at a time (answers F002) and treat the existing card as the atomic unit (F001/F002).
- Preserved preferences: F001, F002.
- Changes: none to code — concept round. Variants:
  - V1 index-rows: full-width catalogue rows, fixed-width stage left, copy right; only the hovered row's artwork animates.
  - V2 spotlight-stage: one large stage shows a single project; narrow index column (number + title) selects; only the staged artwork is live.
  - V3 scroll-focus liveness: keep the 2-col grid; artworks render frozen by default and animate only for the scroll/hover-focused card. Cheapest integration.
  - V4 focus-rail: horizontal scroll-snap filmstrip; center card live, edge cards frozen and dimmed.
  - V5 dossier-accordion: collapsed bars (number + title + tag); one expands in place to reveal its stage; at most one open.
- Before: R001 baseline artifacts
- After: this concept list (presented to owner); nothing rendered
- Visual inspection: NOT RUN (concepts only)
- Code verification: NOT RUN
- Open question: owner picks 1+ variants to develop into code + a rendered comparison round.

## Round R003
- Goal: owner steer — variant generation goes back to the randomized routing relay ("i want randomized model suggest itself. it is most creative"). Delegation retry with an upgraded prompt: the F002 motion rule is now an explicit constraint (at most one artwork animating at a time), variants must be genuinely different (no shared skeletons, S2 practice), rough code-skeleton contract kept.
- Preserved preferences: F001, F002.
- Changes: none to code — delegation round; V1–V5 stay on the table as orchestrator fallback.
- Before: R001 baseline artifacts
- After: pending relay reply
- Visual inspection: NOT RUN
- Code verification: NOT RUN
- Open question: owner pastes the relay reply; orchestrator scores distinctness/usability, adapts the chosen variant into the shell.

## Feedback F003
- Round: R003
- Verdict: REJECTED
- Scope: projects section, desktop viewport — correction of F002's reading
- Decision: the cards' artworks are NOT literally animating simultaneously; the problem is the NUMBER of illustrated artworks visible in the viewport at once (2-per-row grid keeps several cartoon-style stages on screen), which reads candy-collection. Presentation variants should cut how many illustrations share the viewport or demote them to supporting detail — motion gating alone does not address it.
- User source: "they don't animate/move at once. i meant animation/animated illustration"
- Artifact: R001 baseline-grid.png
- Supersedes: F002 (scope correction: illustration density per viewport, not animation concurrency). V3 (scroll-focus liveness) is therefore the weakest orchestrator fallback; V2/V5 (≤1 illustration visible) are the strongest fits.

## Round R004
- Goal: corrected delegation — R003's prompt carried the wrong constraint (one-artwork-animating) before the owner's F003 correction landed; replaced with the density constraint (fewer illustrations visible per viewport, or demoted).
- Preserved preferences: F001, F002 (as corrected by F003).
- Changes: none to code — delegation round.
- Before: R001 baseline artifacts
- After: owner ran the −30% compression ladder variant (63 words, aesthetic spec explicit, banned set + cards-stay-as-is + code contract intact) on the randomized relay and judged the result **good**; reply lives with the owner, not integrated here. Recorded finding: −30% compression drew a good result from the relay (single data point; if a second task confirms, it graduates into minimize-iteration as practice). Owner's bar for the next round: maximally good.
- Visual inspection: NOT RUN (relay reply not shown here)
- Code verification: NOT RUN
- Open question: owner asked for named-style variants of the −30% prompt before the next run.

## Round R005
- Goal: named-style routing — 5 variants of the −30% prompt, identical cargo, only the aesthetic clause swapped for a compact named style (minimize-iteration §Named-style routing: a style name unpacks the whole vocabulary for free, qualitative color values stay the integrator's job).
- Preserved preferences: F001, F002 (as corrected by F003).
- Changes: none to code — delegation round.
- Variants prepared: dark museum catalogue / spot-ink print on near-black paper / swiss minimal dark mode / black blueprint technical drawing / risograph dark paper (wildcard). Length held within ±2 words across variants.
- Before: R001 baseline artifacts
- After: pending owner's pick + relay reply
- Visual inspection: NOT RUN
- Code verification: NOT RUN
- Open question: which named style to run; owner pastes the reply for adaptation.

## Round R006
- Goal: record the owner's verdict — the R004 −30% prompt with the explicit aesthetic spec ("dark near-black teal thin-ink-lines aesthetic") produced the BEST relay result so far ("this one outputted the best result"). Named-style variants (R005) are moot on this task: explicit qualitative spec beat style names. Owner will paste the winning relay output next.
- Preserved preferences: F001, F002 (as corrected by F003).
- Changes: none to code — record-keeping round.
- Before: R001 baseline artifacts
- After: winning prompt = R004 −30% variant, 63 words, verbatim in R004/R005 history above
- Visual inspection: NOT RUN
- Code verification: NOT RUN
- Open question: owner pastes the relay output; orchestrator scores the 5 variants, presents them for the owner's pick, then adapts the chosen one into the shell.

## Round R007
- Goal: evaluate the pasted relay output (no code action — owner instruction "dont act yet").
- Rubric (S3 pre-registered shape): usable variants 5/5 — every variant keeps cards as-is, violates no banned trait, names a concrete mechanism, carries concept + code. Weak-route markers 0 — no questions, contract kept, defaults decided unprompted (best default: text ledger; strongest anti-candy: archive drawer). Banned violations 0 — every variant holds ≤1 visible illustration, transitions are hard swaps (never a multi-illustration composition). Identity echo: none shown. Surplus: full dependency-free React 19 implementation + CSS instead of a rough skeleton.
- Distinctness: 5 genuinely different interaction models (folio / ledger+inspector / exclusive accordion / scroll-chapters+pinned stage / modal drawer).
- Shell-fit notes: palette tokens are green-black (re-tint to ink tokens, trivial); 56rem breakpoint ≈ shell's 899px; CSS never reaches into card internals (matches opaque-card boundary); archive drawer hides all artwork by default → tension with F001 (owner loves the illustrations); scroll chapters cost the most layout (6 × 90svh).
- Orchestrator ranking for the shell: 1 text ledger, 2 inline dossiers, 3 scroll chapters, 4 focus folio, 5 archive drawer.
- Visual inspection: NOT RUN (evaluation of code/concepts only, per owner instruction)
- Code verification: NOT RUN
- Open question: owner picks the variant to adapt into the shell.

## Round R008
- Goal: public testing environment for the owner's variant choice — a variant lab deployed on GitHub Pages at https://vasyapym.github.io/variant-lab/ (no change to the landing itself).
- Changes: `portfolio/shell/public/variant-lab/` — self-contained static page: relay code VERBATIM (`src/lab.tsx`, esbuild IIFE bundle committed as the payload per the folder README), `lab.css` = relay CSS verbatim with its five tokens mapped to the shell ink palette (#0b1317 / #eeeae0 / rgba lines / #d39b61 accent), six fake static stand-in cards mimicking `.signal-index-card`, one mount per variant.
- Preserved preferences: F001, F002 (as corrected by F003).
- Before: R001 baseline artifacts
- After: artifacts/R008/lab-focus.png, lab-ledger.png, lab-dossiers.png, lab-chapters-top.png, lab-archive-drawer-open.png (desktop 1440)
- Visual inspection: performed — all five variants render; each holds exactly one visible illustration; V1 stage + counter + prev/next; V2 typographic index left + card inspector right; V3 six ruled headings; V4 giant chapter titles + pinned stage; V5 typographic index + full-height drawer (open state captured, backdrop dims the typographic section).
- Code verification: probe `portfolio/probes/variant-lab-shot.mjs` (local-only): 5/5 `.wp` sections mounted; ledger row click swaps the inspector ("Inspection / 03", active row "Waste of tokens"); dossiers exclusive disclosure holds (1 expanded after opening two); archive drawer open/close = true/true. Console noise: one 404 (favicon only). Local dev-server quirk: `/variant-lab/` without a filename hits the SPA fallback in vite dev; GitHub Pages serves the directory index, so production is unaffected.
- Open question: owner picks the winning variant at the link; the chosen one gets the real shell-adaptation round afterwards.

## Round R009
- Goal: evaluate a SECOND relay output (pasted by owner; evaluation only — "dont act").
- Rubric: usable concepts 5/5 — cards stay opaque, ≤1 stage per viewport enforced as a stated rule, no banned traits, code per variant. Code-as-pasted 4/5: V1 references an undefined `useMediaQuery` hook and has a touch double-toggle risk (mouseenter+click both fire on tap); V4 hardcodes stub ids (`byId.alpha`) that crash with real data and needs owner-authored manifesto prose; V2 is a full-viewport INNER snap scroller (scroll-trap risk inside the landing's native page scroll); V3 mentions drag but doesn't implement it. Weak-route markers 0. Echo: none.
- Overlap vs the first output: their V1 ≈ first V2 Text ledger (better mobile: inline expand under the active row), their V2 ≈ first V4 Scroll chapters (but snap-trapped inner scroller vs first's native page scroll). Genuinely NEW mechanisms: V3 Dossier stack (folders + tabs), V4 Marginalia (footnote refs in prose + side sheet, 0 illustrations idle), V5 Spines (horizontal book-shelf accordion).
- Quality read: run 1 = stronger engineering completeness (full a11y, decided defaults, mobile fallbacks); run 2 = more original mechanisms, rougher delivery (Georgia serif and mint palette are placeholder-grade; trivial re-tint as before).
- Integration cost guess: V3/V5 cheap; V1 cheap (hook + touch fix); V2 medium (embed-as-iframe or convert to native page scroll); V4 highest (authored essay + page-structure change).
- Visual inspection: NOT RUN (no rendering — owner said don't act)
- Code verification: NOT RUN (static read)
- Open question: owner decides whether to add the 3 new mechanisms (V3 dossier, V4 marginalia, V5 spines) to the live lab before choosing.

## Round R010
- Goal: owner approved adding the second run's three new mechanisms to the live lab ("yes. add them too").
- Changes: `portfolio/shell/public/variant-lab/` extended to 8 variants — V6 Dossier stack, V7 Marginalia, V8 Spines (mechanisms verbatim from the second run; adapted to the lab's ProjectEntry contract; tokens mapped to ink; V7 prose is placeholder copy the owner will rewrite; run-2 V1 index+plate NOT added — it duplicates the first run's V2 Text ledger). lab.js rebuilt.
- Before: R008 artifacts (5 variants)
- After: artifacts/R008/lab-dossier-stack.png, lab-marginalia-sheet-open.png, lab-spines.png (desktop 1440)
- Visual inspection: performed — V6 cascading tab edges behind the front folder (tabs peek above the stack top by design); V7 serif prose with accent refs + footnotes + side sheet with the card; V8 shelf of rotated spines with the open spine holding the card.
- Code verification: probe — 8/8 `.wp` sections mounted; dossier tab 3 click brings "03 Waste of tokens" to front; marginalia ref opens the sheet (open: true, close works); spines tab 4 click opens "Cat Runner". Console noise: favicon 404 only.
- Open question: owner chooses among all 8 at https://vasyapym.github.io/variant-lab/; then the real shell-adaptation round starts.

## Feedback F004
- Round: R011
- Verdict: REJECTED
- Scope: all 8 lab variants as final answers — none chosen
- Decision: none of the 8 presentations is "it"; the owner steers to the scroll-driven mechanism family (V4 Scroll chapters was the direction) and wants it improved against the standing dislikes (F002/F003: several illustrations visible at once, candy-collection feel)
- User source: "these are not it. then lets do this - i want the scrolling down mechanism but which will make it better considering my dislikes of the current"
- Artifact: variant-lab (8 variants live)
- Supersedes: none (the lab stays as a reference; the scroll family is the chosen direction within it)

## Round R011
- Goal: delegation retry with the worked −30% formula (R004/R006), narrowed to the chosen direction: 5 distinct takes on a scroll-driven single-pinned-stage presentation. Constraints encoded from the owner's dislikes + integration findings: exactly one illustration visible per viewport, native page scroll only, no inner snap scroller, scroll-trap banned.
- Preserved preferences: F001, F002 (as corrected by F003), F004.
- Changes: none to code — delegation round.
- Before: R001 baseline artifacts
- After: pending relay reply
- Visual inspection: NOT RUN
- Code verification: NOT RUN
- Open question: owner pastes the relay reply; orchestrator adapts the chosen take into the shell.

## Round R012
- Goal: owner picked the −30% ladder rung and added a layout steer: on desktop the presentation must show one full-width project per row (the current grid is two per row). Prompt updated to 67 words (the added requirement costs ~13 words; still shorter than the R011 baseline of 81).
- Preserved preferences: F001, F002 (as corrected by F003), F004.
- Changes: none to code — delegation round.
- Before: R001 baseline artifacts
- After: pending relay reply
- Visual inspection: NOT RUN
- Code verification: NOT RUN
- Open question: owner pastes the relay reply; orchestrator adapts the chosen take into the shell.

## Round R013
- Goal: owner picked the relay's scroll-engine reply ("show me these instead") and asked to remove the old showcases. Lab rebuilt at the same URL: one shared scroll engine (useTrack, sticky stage in a 6×120vh track) + five structurally different presentations — S1 Plotter (stroke draw-off/draw-on via pathLength), S2 Cut (1px guillotine rule, clip-path, alternating direction), S3 Approach (translateZ corridor, ghost frame until close), S4 Lens (zoom into focal point, grid dissolve, hard swap at 0.85), S5 Margin notes (sticky plate + free-scrolling text blocks, IO centre-band selection). Old 8 variants removed.
- Preserved preferences: F001, F002 (as corrected by F003), F004.
- Changes: `portfolio/shell/public/variant-lab/` — lab.tsx/lab.css/index.html rewritten; contract held (cards untouched, ≤1 illustration per viewport, native document scroll, no snap, no trap); mobile <1024px = plain stack; reduced-motion = hard cuts. Lab repairs beyond the relay text: useMedia plumbing, pathLength auto-tagging, duplicate-key guard on the last card, pull-out continuity across the swap for Lens.
- Before: R008 artifacts (old lab)
- After: artifacts/R013/scroll-*.png (dwell + transition shots per variant)
- Visual inspection: performed — S1 mid-swap shows near-empty sheet with next card pre-drawn; S2 shows the hairline rule + ghost rule splicing two cards; S3 shows the exiting frame enlarged/dimmed with the ghost rectangle at the vanishing point; S4 push shows the mark zoomed with panel dissolved into the grid overlay; S5 plate follows the centred block.
- Code verification: probe `portfolio/probes/variant-lab-scroll.mjs` — 4 tracks + 1 margin grid mounted, no mobile stacks on desktop, no console errors (favicon 404 only), margin plate shows the centred block's project. Probe scroll-math fix documented: engine progress = -top/(H−vh), shots addressed by p=(card+t)/6.
- Open question: owner picks S1–S5 at https://vasyapym.github.io/variant-lab/ by scrolling; the chosen one becomes the shell-adaptation round.

## Feedback F005
- Round: R014
- Verdict: REJECTED
- Scope: all five scroll-driven presentations (S1 Plotter … S5 Margin notes)
- Decision: none of them is "it" — too scope-creep. The taste bar is a senior developer inclined to minimalism: restraint over spectacle, no theatrical motion, typography and spacing carry the design.
- User source: "these are not it. i don't want too scope creep ones. i want senior developer who is inclining towards minimalism look"
- Artifact: rebuilt variant-lab (scroll lab)
- Supersedes: narrows F004 (scroll direction stays, theatrical execution rejected)

## Round R014
- Goal: brief revised for the minimalist taste bar (F005) and re-cut into the 10–80% compression ladder for the owner to pick. New cargo in the brief: `taste: senior developer leaning minimalist — restraint over spectacle, no theatrical motion, typography carries it`. Standing cargo unchanged: cards as-is, one illustration per viewport, native scroll, no snap, one full-width row per project on desktop.
- Preserved preferences: F001, F002 (as corrected by F003), F004, F005.
- Changes: none to code — delegation round.
- Before: R013 artifacts
- After: pending owner's ladder pick + relay reply
- Visual inspection: NOT RUN
- Code verification: NOT RUN
- Open question: owner picks a rung; relay reply gets adapted into the shell.

## Round R015
- Goal: named-style variants of the revised minimalist brief (same move as R005): the aesthetic + taste clauses are swapped for one compact named style that unpacks the vocabulary itself. Base = the −30% rung minus those two clauses (~50 words each).
- Preserved preferences: F001, F002 (as corrected by F003), F004, F005.
- Changes: none to code — delegation round.
- Variants prepared: swiss minimal dark mode / tufte-style typographic restraint / dieter rams less-but-better / plain technical-document minimal / e-ink calm minimal.
- Before: R013 artifacts
- After: pending owner's pick + relay reply
- Visual inspection: NOT RUN
- Code verification: NOT RUN
- Open question: owner picks a named style; relay reply gets scored and adapted.

## Round R016
- Goal: record the owner's verdict — the Tufte-style named-style variant (R015 #2) produced a GOOD (not maximum) result on the relay. The reply has not been pasted yet; next step is to strip the previous tries from the lab and deploy the Tufte reply's variants to https://vasyapym.github.io/variant-lab/ for the owner to check.
- Preserved preferences: F001, F002 (as corrected by F003), F004, F005.
- Changes: none to code yet.
- Before: R013 artifacts (scroll lab still live)
- After: pending reply paste
- Visual inspection: NOT RUN
- Code verification: NOT RUN
- Open question: owner pastes the Tufte relay reply; orchestrator rebuilds the lab with only those variants.

## Round R017
- Goal: owner pasted the Tufte relay reply; previous tries removed; the lab now hosts exactly its five presentations at the same URL, switched via `?v=ledger|sidenote|folio|plate|index` (relay's own switch contract).
- Preserved preferences: F001, F002 (as corrected by F003), F004, F005.
- Changes: `portfolio/shell/public/variant-lab/` rewritten — Card primitives (Stage/Text), five variants (Ledger, Sidenote, Folio, Plate, Index), variants.css verbatim incl. paper palette + scroll-snap proximity + reduced-motion gate; fake stand-in marks recolored for paper (ink strokes, ochre accent — the only repair); lab chrome reduced to a header switcher.
- Before: R013 artifacts (scroll lab)
- After: artifacts/R017/tufte-*.png (one shot per variant, desktop 1440)
- Visual inspection: performed — paper bg, serif, hairline rules, oldstyle numerals, small-caps tech; Ledger figure+numbered caption; Sidenote margin text sticky; all hold one illustration per viewport.
- Code verification: probe `portfolio/probes/variant-lab-tufte.mjs` — 6/6 sections in every variant, no console errors (favicon 404 only), Index rail marks the centred section ("4 Cat Runner").
- Open question: owner checks the five variants by scrolling; the chosen one becomes the shell-adaptation round (palette decision — keep Tufte paper or re-tint to dark ink — happens there).
