# BRIEF (implementation round) — Practice Map: model-tier playground

You are a long-context chat model with no repo access. The design decisions are **already made** — do not redesign, do not reinterpret, do not add features. Your job is the **implementation artifact** of the fixed spec below: one self-contained HTML file (inline CSS + JS). It will be salvaged section-by-section into our React SPA, so follow the class-name conventions and section boundaries exactly.

## Fixed concept (reproduce verbatim, do not rewrite)

- Hero copy (two lines, lowercase, fixed): `tier by tier.` / `model by model.` — the second line carries the ochre-bright accent like today's second line. The concept reframe is part of this round; only the page headline changes — the project's name and its illustration on the portfolio main page stay untouched (a later pass).
- Kicker line above the headline: `playground` + counts computed from data at runtime (`N models · M lessons` — derived from the seed array, never hardcoded in copy or markup).
- Page story: an experiment log — AI model tiers, each tier's lessons are that model's teaching samples; the owner compares how each model teaches. Counts will grow; nothing may assume exactly 5 tiers or 29 lessons.
- Every tier shows: its **band badge** (`max` / `high` / `medium` / `low` / `thinking`) — nothing else. **No verdict lines, no progress meters** (no per-tier `x/y`, no global `0/29 applied` meter — dropped by owner decision).

## Fixed IA (implement exactly this)

1. **Hero band** (grid, like the current page): left copy panel with the unchanged two-line headline + computed kicker; right 320px rail with only the `explore concept graph ↗` pill (the graph itself is NOT built — the pill is a stub button; no meter in the rail).
2. **Tier list** (the primary surface): rows, scale-row pattern — mono tier name + band badge / sample lesson title / lesson count `N lessons`. One active row. Clicking a row opens its **tier panel**. **No reorder UI, no ranking** — tier order comes from the data array's order, as-is.
3. **Tier panel** (right of / below the list): tier heading (name + band badge only), then lesson cards — numbered `01`, `02`, … (plain numbers, not "run"), title, Russian summary, concept chips (cap 8, `+N more`), `open lesson →` pill (the button is a stub — no lesson window in this artifact).
4. **Folders (only the big tier)**: Opus 4.8-Thinking's 20 lessons show as **folder faces** — rows like `vol 01 — first contact · 4 lessons`, each a tab-style face with a peek list of 2–3 lesson titles. Clicking a face expands it in place into a shelf list of its lesson cards (no separate screen, no routing). Linux ships pre-split into exactly these volumes:
   - `vol 01 — first contact` (4), `vol 02 — permissions & users` (3), `vol 03 — processes & pipes` (6), `vol 04 — scripting & env` (4), `vol 05 — packages` (3)
5. **Search input** above the tier panel filters lessons (title + summary); plus a ⌘K **palette** (fuzzy jump over tiers + lessons, arrow-key nav, Esc closes) as a complement.
6. **Mobile (≤700px)**: tier rows stack full-width; tier panel renders under the list; folder faces stay tap-target sized; palette becomes a full-width sheet.

Tier seed data (ids and membership fixed):
- `astra-6-max` (max): `DDoS`, `Лантимос`
- `fable-5.1-high` (high): `Kubernetes`, `Хичкок`, `Агентное программирование`, `AGI`
- `astra-6-medium` (medium): `Rust`, `Symfony и Laravel`
- `fable-5.1-low` (low): `Go` (флагманский урок)
- `opus-4.8-thinking` (thinking): Linux, 20 lessons in the 5 volumes above

**Data shape rule (load-bearing):** all content lives in ONE plain JS array shaped like the real curriculum pipeline will feed it — `[{id, name, band, volumes?: [{name, topicIds}], topics: [{id, title, summary, concepts}]}]`. Every visible string (counts, titles, kickers) is derived from this array; nothing is hardcoded in markup. New lessons and tiers must be addable by appending data entries only — the owner creates lessons through the existing lesson script pipeline, which appends data entries.

## Design tokens (verbatim — this language is not negotiable)

```
--bg:#0b1317; --text:#eeeae0; --faint:rgba(238,234,224,.48);
--line:rgba(238,234,224,.26); --line-soft:rgba(238,234,224,.13);
--panel:rgba(238,234,224,.045); --accent:#d39b61; --accent-bright:#e8b57c; --accent-deep:#b97f45;
--panel-radius:20px; --pill-radius:999px;
prose: "IBM Plex Sans"; chrome: "IBM Plex Mono" lowercase, letter-spacing .04em, small (0.66–0.78rem);
1px film-grain overlay (SVG turbulence, opacity .06, soft-light).
Buttons/inputs/close-X/part chips: 999px pills. Cards/panels: 20px radius, hairline borders.
Feel: near-black teal-tinted page, warm pale text, quiet mono chrome, prose-first.
```

## Negative space (hard bans — these are documented failure modes)

No prompt-runner/API/streaming/params (no temperature, tokens, latency). No per-model scores, rosters, fill-meters, auto-grouping. **No verdict lines, no progress meters anywhere (per-tier or global). No tier reorder/ranking UI.** No nested tiers (T0.2.1), no topics/projects middle layer — tier → lessons directly, folders are the only depth. No marquee, glyph boards, deploy strips, or landing furniture. No rebranding beyond the headline: project name ("Practice Map" module) and its portfolio illustration stay untouched. No frameworks, no CDN except the Google Fonts link for IBM Plex. No persistence (state is render-local).

## Required class-name skeleton (keep these names; the sections in this order)

```
.pg-field > .pg-page
  .pg-hero (grid: copy panel | 320px rail, pill only)
  .pg-layout (grid: tier list | tier panel)
    .pg-tier-list > .pg-tier-row  [.is-active]
    .pg-tier-panel > .pg-tier-head, .pg-cards > .pg-card, .pg-faces > .pg-face, .pg-face > .pg-shelf
  .pg-search (input above panel), .pg-palette (fixed overlay), .pg-footer
```

## Output contract (strict)

Markdown, total ≤ 1100 lines:

1. `## Checklist of the fixed design` — ≤ 8 lines: restate the IA as a checklist so I can verify compliance.
2. `## Page` — the full single-file HTML in ONE code block (inline CSS + JS, Google Fonts link for IBM Plex Sans/Mono, seed data as above, Russian content strings, lowercase English chrome).
3. `## Integration notes` — ≤ 8 lines: which blocks map to React components (tier list, tier panel, run card, folder face/shelf, palette) and any state you kept client-side.

No commentary outside the three sections. No alternatives, no options, no "you could also".
