# Task brief — Practice Map R008: element quality batch (search bar, model list, active highlight, Go Back)

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design and code choice in this task: do not ask for approval, do not offer option lists. Deliberate in `## Reasoning` before writing any code — depth beats speed: work through candidate treatments for EACH element before writing anything (the previous round showed that a deliberated answer beats a fast one; do not arrive at the first treatment and stop).

## 0. Where this comes from (context you cannot infer)

"Practice Map" (page title "Waste of tokens", `/projects/practice-map`) is one project in a dark-ink developer portfolio. Its page: a mono kicker line, a hero panel (just reworked — verdict headline over a "kept / cut" sample-output log; do not touch it), then a two-column layout: LEFT a model list (5 rows, one per AI model), RIGHT a search bar above a lesson panel (cards / folder faces / a "go back" crumb in volume view).

The owner just batch-reviewed the page and judged several elements "default or template-driven". The binding aesthetic for this whole round, verbatim: *"Target aesthetic: a senior developer's personal site — restrained, intentional, zero template energy."*

The page's register (do not drift): dark swiss archive editorial — lowercase mono chrome, ochre accent over near-black ink, hairline borders, 999px pill controls, 20px panel radius, film-grain veil over everything.

Parallel work you must NOT touch or include: the per-lesson "concept graph ↗" control and the concept chips on lesson cards are being removed by the orchestrator in a separate pass. They appear in some snippets below only because they sit inside a region you own — ignore them, do not restyle them, do not carry them into your output (the orchestrator strips them before splicing).

## 1. The page and its laws

React 19 + TypeScript. Fonts: IBM Plex Sans (`--sans`, `--display`) for names/prose, IBM Plex Mono (`--mono`) for chrome. Tokens (defined on the shell root, values verbatim):

```css
--ink-bg: #0b1317;              /* page field */
--ink-text: #eeeae0;
--ink-muted: rgba(238, 234, 224, 0.68);
--ink-faint: rgba(238, 234, 224, 0.48);
--ink-line: rgba(238, 234, 224, 0.26);
--ink-line-soft: rgba(238, 234, 224, 0.13);
--ink-panel: rgba(238, 234, 224, 0.045);
--ink-accent: #d39b61;          /* ochre */
--ink-accent-bright: #e8b57c;
--ink-accent-deep: #b97f45;
--panel-radius: 20px;  --pill-radius: 999px;
```

Layout facts: the page section is `width: min(1200px, calc(100% - 72px))` centered. The two-column grid (`.pg-layout`) is `margin-top: 40px; gap: 28px 30px; grid-template-columns: minmax(0,0.80fr) minmax(0,1.40fr); grid-template-areas: "list search" "list panel"`. The left column holds only the model list (5 rows); the right column holds the search row (a full-width search input + a small `⌘k` pill that opens a command palette) and the panel below it. In volume view the panel's top row is a crumb: a `← go back` button + a mono title. A fixed film-grain veil (`opacity: .06; mix-blend-mode: soft-light`) covers everything — your styling lives under it.

Laws you must not break:

- Lowercase mono chrome everywhere (`text-transform: lowercase` on mono labels; IBM Plex Mono for chrome text).
- Controls keep `border-radius: var(--pill-radius)` (999px) and hairline borders from the token family.
- Touch floors: interactive elements ≥44px on coarse pointers (fine pointers may step to 40px via `@media (pointer: fine)`).
- Keyboard focus: `:focus-visible` keeps a visible outline in the accent family (`outline: 1px solid var(--ink-accent); outline-offset: 2px` is the existing pattern).
- `prefers-reduced-motion: reduce` kills animation — the page already has a global kill switch in scope; any transition you add must be quiet and non-load-bearing.
- No horizontal overflow at 1440, 1024, 700, 560, 390, 320 for anything you touch.
- Do not touch anything outside the named regions: the hero, the lesson cards' body markup, folder faces' internal markup, the command palette (`.pg-pal*`), overlays — none of it is yours (CSS sections for untouched elements may not be edited either; if a shared selector forces a change, say so in Notes instead of editing).

## 2. The owner's asks (verbatim, then your working space)

1. *"Search bar — typography and styling feel unrefined."* → the search input (`.pg-search input`) + the `⌘k` pill beside it. Make the bar read as deliberate instrument chrome: considered type scale/tracking/padding, refined border and focus treatment. The input is `type="search"` — browser default artifacts (WebKit cancel button, wrong cursor) count as unrefined if they render.
2. *"Model list (left panel) — too dense, no whitespace, visually undifferentiated."* → the five `.pg-tier-row` rows. Give the list breathing room and per-row differentiation so a scanning eye can tell rows apart (today every row is a name + count + one faint sample line, separated only by a bottom hairline).
3. *"Active model highlight — yellow is heavy-handed; use something quieter — a muted accent or subtle weight shift."* → `.pg-tier-row.is-active` currently adds `background: rgba(211,155,97,.09)` (the "yellow"). Replace with a quieter treatment (muted accent detail, weight/typographic shift, hairline change — your call), still unambiguous about which model is open.
4. *"'Go Back' button — reads as unstyled default."* → `.pg-crumb-back` (volume view). It already has outlined-pill styling but still reads default — likely proportions/weight/context. Make it read as an intentional control in this language.
5. Binding constraint (applies to all four): the F018 aesthetic line quoted in §0.

## 3. Current state verbatim (the regions you may change)

### R1 — web/lib/tiers/TierList.tsx (complete file, 33 lines)

```tsx
import type { Tier } from "./tiers";
import { plural } from "./tiers";

type TierListProps = {
  tiers: readonly Tier[];
  activeTierId: string;
  onSelect: (tierId: string) => void;
  lessonCount: (tierId: string) => number;
  sampleTitle: (tierId: string) => string;
};

export function TierList({ tiers, activeTierId, onSelect, lessonCount, sampleTitle }: TierListProps) {
  return (
    <nav className="pg-tier-list" aria-label="model tiers">
      {tiers.map((tier) => {
        const active = tier.id === activeTierId;
        return (
          <button
            key={tier.id}
            type="button"
            className={`pg-tier-row${active ? " is-active" : ""}`}
            aria-pressed={active}
            onClick={() => onSelect(tier.id)}
          >
            <span className="pg-tier-name">{tier.name}</span>
            <span className="pg-tier-count">{plural(lessonCount(tier.id), "lesson")}</span>
            <span className="pg-tier-sample">{sampleTitle(tier.id)}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

Row data shape: 5 tiers, `tier.name` like `astra-6-max` / `opus-4.8-thinking`, counts from 1 to 20 lessons, sample is one lesson title (may be long — it clamps to one line).

### R2 — TierPanel.tsx — search render (complete; the only part of the file you own)

```tsx
      <div className="pg-search">
        <input
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="filter lessons — name and description"
          aria-label="filter lessons"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <button className="pg-pill" type="button" onClick={onOpenPalette}>
          ⌘k
        </button>
      </div>
```

### R3 — TierPanel.tsx — crumb render in volume view (complete)

```tsx
        <div className="pg-crumb">
          <button className="pg-crumb-back" type="button" onClick={onExitVolume}>
            ← go back
          </button>
          <span className="pg-crumb-title">{activeVolume}</span>
        </div>
```

### R4 — web/lib/tiers/tiers.css — the rules you own (complete, verbatim)

```css
/* ---------- shared chrome ---------- */
.pg-kicker,.pg-tier-count,.pg-pill,.pg-chip,
.pg-face-count,.pg-search input,.pg-pal input,.pg-pal-kind,.pg-hint,.pg-empty{
  font-family:"IBM Plex Mono",ui-monospace,monospace; text-transform:lowercase; letter-spacing:.04em;
}
.pg-kicker{
  font-size:.74rem; color:var(--ink-faint); margin:0 0 14px;
}
.pg-hint{
  font-size:.66rem; color:var(--ink-faint); line-height:1.7; margin:0;
}
.pg-pill{
  display:inline-flex; align-items:center; gap:.5em;
  font-size:.72rem; line-height:1; padding:.72em 1.1em;
  border:1px solid var(--ink-line); border-radius:var(--pill-radius);
  background:transparent; color:var(--ink-text); cursor:pointer;
  transition:border-color .18s ease, color .18s ease, background .18s ease;
}
.pg-pill:hover{border-color:var(--ink-accent); color:var(--ink-accent-bright); background:rgba(211,155,97,.07)}
.pg-pill:focus-visible,.pg-tier-row:focus-visible,.pg-face-head:focus-visible,.pg-pal-item:focus-visible{
  outline:1px solid var(--ink-accent); outline-offset:2px;
}

/* tier list — restrained model rows (badge row removed; name stepped down) */
.pg-tier-list{grid-area:list; margin-top:1rem}
.pg-tier-row{
  width:100%; display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:start;
  gap:.9rem; padding:.62rem .85rem; text-align:left;
  border:1px solid transparent; border-bottom-color:var(--ink-line-soft);
  border-radius:var(--panel-radius);
  background:transparent; color:rgba(238,234,224,.68); cursor:pointer;
  transition:border-color 180ms ease, color 180ms ease, background 180ms ease;
}
.pg-tier-row:hover,
.pg-tier-row.is-active{border-color:var(--ink-line); color:var(--ink-text); background:rgba(211,155,97,.09)}
.pg-tier-name{
  display:grid; gap:.3rem; min-width:0;
  font-family:var(--sans); font-size:1rem; font-weight:600;
  letter-spacing:0; line-height:1.15; color:inherit; text-transform:none;
}
.pg-tier-count{
  font-family:var(--mono); font-size:.72rem; color:var(--ink-accent);
  justify-self:end; white-space:nowrap;
}
.pg-tier-sample{
  grid-column:1 / -1; font-size:.72rem; line-height:1.4; color:var(--ink-faint);
  overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical;
}

/* ---------- 5a. search ---------- */
.pg-search{grid-area:search; display:flex; gap:10px; align-items:center}
.pg-search input{
  flex:1 1 auto; min-width:0; font-size:.72rem; color:var(--ink-text);
  background:var(--ink-panel); border:1px solid var(--ink-line-soft); border-radius:var(--pill-radius);
  padding:.85em 1.15em; outline:none; transition:border-color .18s ease;
}
.pg-search input::placeholder{color:var(--ink-faint)}
.pg-search input:focus{border-color:var(--ink-accent)}
.pg-search .pg-pill{flex:0 0 auto}

/* ---------- 4b. volume-view crumb (inverted: back is dominant) ---------- */
.pg-crumb{
  display:flex; align-items:center; gap:.9em; flex-wrap:wrap;
  padding-bottom:1rem; margin-bottom:1.1rem; border-bottom:1px solid var(--ink-line-soft);
}
/* Back joins the outlined pill family (donor proportions in OUR language,
   not a solid fill), now the row's dominant control at 44px. */
.pg-crumb-back{
  display:inline-flex; align-items:center; gap:.45rem; min-height:44px;
  border:1px solid var(--ink-line); border-radius:var(--pill-radius);
  padding:.42rem .85rem; background:transparent; cursor:pointer; color:var(--ink-accent);
  font-family:var(--mono); font-size:.8rem; letter-spacing:.03em; text-transform:lowercase;
  transition:border-color 180ms ease, color 180ms ease, background 180ms ease, gap 180ms ease;
}
/* fine pointers (mouse) may step below the 44px floor; touch stays >=44px */
@media (pointer: fine){
  .pg-crumb-back{min-height:40px}
}
.pg-crumb-back:hover{gap:.7rem; border-color:var(--ink-accent); color:var(--ink-accent-bright); background:rgba(211,155,97,.07)}
.pg-crumb-back:focus-visible{outline:1px solid var(--ink-accent); outline-offset:2px}
/* Title steps down below the back control. */
.pg-crumb-title{
  font-family:var(--mono); font-size:.82rem; font-weight:500;
  letter-spacing:.04em; text-transform:lowercase; line-height:1.2; color:var(--ink-muted);
}

/* ---------- 6. mobile (stepped token-shrink, one rhythm; ≥44px floors) ---------- */
@media (max-width:900px){
  .pg-layout{margin-top:32px; gap:26px 26px}
}
@media (max-width:700px){
  .pg-layout{margin-top:24px; grid-template-columns:1fr; grid-template-areas:"list" "search" "panel"; gap:18px}
  .pg-tier-row{grid-template-columns:1fr auto; padding:.7rem .8rem; min-height:44px}
  .pg-tier-count{justify-self:end}
  .pg-card{padding:20px}
  .pg-tier-head{padding-bottom:.8rem; margin-bottom:.9rem}
  .pg-crumb{padding-bottom:.8rem; margin-bottom:.9rem}
  .pg-face-head{padding:14px 16px; min-height:44px}
  .pg-faces{gap:.9rem}
  .pg-cards{gap:.75rem}
  .pg-pal{top:0; left:0; transform:none; width:100%; border-radius:0 0 var(--panel-radius) var(--panel-radius); border-left:0; border-right:0; border-top:0}
  .pg-pal-list{max-height:64vh}
}
@media (max-width:560px){
  .pg-layout{margin-top:18px; gap:14px}
  .pg-card{padding:16px}
  .pg-tier-head{padding-bottom:.7rem; margin-bottom:.75rem}
  .pg-crumb{padding-bottom:.7rem; margin-bottom:.75rem; gap:.7em}
  .pg-card-foot{gap:.5rem}
}
```

(Selectors not shown — `.pg-card`, `.pg-face*`, `.pg-pal*`, `.pg-cards`, `.pg-faces`, `.pg-layout`'s desktop columns — are NOT yours; another pass owns spacing/width. If your treatment needs one of them changed, say so in Notes instead of producing the rule.)

You may restructure the named regions entirely (old comments describe old rounds — rewrite them). If a treatment needs new elements in R2/R3 JSX or new CSS rules, produce them complete; the orchestrator splices.

## 4. Method — deliberate before you write (required)

Before any code, produce the `## Reasoning` section:

1. Restate the four asks in one line each.
2. For EACH of the four elements: name at least two candidate treatments (one line each — what changes, how it reads in the ink register), then pick one with the concrete reason it wins against the "senior developer's site" bar (what specifically made the current state read default, what specifically kills that).
3. Full spec of the picked treatments: every CSS rule with concrete values, any JSX changes, composition with the register (lowercase mono, hairlines, ochre, pills), and behavior at 1440 / 1024 / 700 / 560 / 390 / 320.
4. Risk pass, one line each: overflow at 320; touch floors; focus-visible clarity; active-state ambiguity (can the owner still tell which model is open?); search input browser defaults; regression risk to rows NOT being restyled (`.pg-face*`, `.pg-pal*` share the `.pg-pill` chrome — name any blast radius).

There is no approval gate and no option list to offer: pick, justify, ship.

## 5. Acceptance criteria (observable)

1. Search bar: no browser-default artifacts; type scale/tracking/padding read as one instrument with the `⌘k` pill; focus state is quiet and intentional.
2. Model list: rows are visually differentiated and spaced so the list reads as a considered index, not a squeezed stack; name/count/sample hierarchy stays legible at 320.
3. Active row: no heavy fill; the active model is unambiguous via a quieter device.
4. Go Back: reads as a deliberate member of the control language (dominant in its crumb row), not a default.
5. Register intact: lowercase mono chrome, hairlines, ochre family, `--pill-radius`, ≥44px touch floors (fine-pointer 40px step kept where it exists), focus-visible outlines preserved.
6. No horizontal overflow at 1440/1024/700/560/390/320 from anything you changed.
7. CSS complete and self-consistent (no dangling selectors, no orphaned rules you removed the use of); TypeScript would compile (no unused imports in the JSX you return).

## 6. Output contract (exactly this shape)

```
## Reasoning
<per §4: restatement, per-element candidates + pick with reason, full spec, risk pass>

## Changes
### R1 — web/lib/tiers/TierList.tsx
<complete new file text, or "unchanged" with the reason>

### R2 — TierPanel.tsx (search render)
<complete new text for the region>

### R3 — TierPanel.tsx (crumb render)
<complete new text for the region>

### R4 — tiers.css (rules you own)
<complete new text for every rule you change or add; name every deletion; leave untouched rules out>

## Self-review
<checklist: each of the 7 acceptance criteria, pass/fail judged against your own produced code, one line each>

## Notes
<optional, ≤5 lines: out-of-scope observations only — no code>
```

Rules: replace regions wholesale (the orchestrator splices them); keep the files' comment voice (terse, reasons-not-narration); no comments narrating the change — only a short comment where a non-obvious constraint genuinely needs one.
