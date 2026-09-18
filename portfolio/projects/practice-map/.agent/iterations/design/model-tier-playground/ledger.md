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
