# Task brief — Waste of tokens R019: the refinement pass (search, highlight, card weight, mobile rhythm)

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design and code choice in this task: do not ask for approval, do not offer option lists, do not hedge. Pick treatments, justify them, ship them as complete code. **Deliberate before writing any code — depth beats speed.** The `## Reasoning` section is the quality signal we are optimizing: diagnosis first, candidates explored honestly (including the ones you reject), choices argued, then — and only then — the spec.

## 0. Where this comes from (context you cannot infer)

"Waste of tokens" (route `/projects/practice-map`) is one project in a dark-ink developer portfolio. The page today: a serif masthead alone on the field ("archive of ai outputs." + 40% subtext — untouchable, owner calls it strong), then a two-column grid — LEFT the model index as ruled records (5 rows), RIGHT a search bar above the lesson panel (cards, or folder faces, or a crumb + cards in volume view). A fixed film-grain veil (opacity .06, soft-light) covers everything.

The owner just reviewed the page and asked for **one coherent refinement pass** — their words:

> «The current UI/UX is in a good place; no radical overhauls, just refinements. The target aesthetic is archival, minimalist, and developer-oriented — consistent with the tone of my portfolio.»

The binding direction (owner, standing):

> *"Visually continuous with the main page — same design language, same level of polish. Where it should diverge is in confidence: selective moments of boldness and creative risk, always anchored by minimalist restraint. The benchmark is a senior developer's portfolio — precise, opinionated, and quietly assertive."*

### The four asks, verbatim from the owner

1. **Hero spacing** (already done by the orchestrator, listed so you know the state): breathing below the masthead was cut 30%. NOT yours.
2. **Search bar** — «The search bar has improved but still feels template-driven. Consider a cleaner, more stripped-back approach. Additionally, on iOS Safari, it renders incorrectly — appearing narrow and centered. On mobile overall, the sections lack sufficient spacing as previously requested; they currently feel compressed into a single continuous block.»
3. **Visual tone** — «The current design direction is solid, but it's missing that refined, senior-developer minimalism. It's difficult to articulate precisely. The lighter highlight treatment on model/lesson elements feels slightly off. Worth exploring an alternative approach there.»
4. **Lesson cards** — «Scale the lesson cards down by roughly 20%. They currently carry too much visual weight relative to the rest of the layout (especially for mobile).»

### Decision history that binds you

- The page speaks the **ruled-record family** (owner-adopted): groups open with one strong rule, records separate with soft hairlines, no radius/fill-boxes/side walls, pills (999px) are the control language. This language is LIKED — refine within it, don't redesign it.
- **F035** (owner): keep the highlighting; content inset from the open sides. The insets exist — don't undo them.
- **F028** (owner): search focus must be a whisper (border opacity step, no color/glow announcements). Keep that law for whatever treatment you pick.
- **F021** (owner, earlier): on mobile, more vertical spacing between model list → search bar and search bar → cards (~+20% asked; never implemented). Today's ask re-raises it and states it stronger: sections read as ONE continuous block. Treat mobile rhythm as a first-class ask, not a gap tweak.
- **F036** (owner, earlier): mobile search ~25% narrower, centered. The SAME look is now read back as the iOS defect — the redesign mandate supersedes that sizing device. Do not preserve narrow-centered sizing for its own sake; preserve the intent (bar not full-bleed, breathing room) however your treatment achieves it.
- The **⌘k palette overlay** (`.pg-pal*`) is out of scope. The card flash device (`.is-flash` ochre rule) is out of scope (keep it working).
- The hero, the crumb row (volume view), the footer, `practice-map.css` are NOT yours. Orchestrator handles the hero; you handle everything inside `tiers.css` + the two TSX regions below.

## 1. The design language you compose with

### Tokens (values verbatim)

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

Fonts: IBM Plex Sans (`--sans`) for names/titles, IBM Plex Mono (`--mono`) for chrome. IBM Plex Serif appears ONLY in the hero masthead. **No new typefaces.** Ochre discipline: standing accents (counts, topline, arrows) are ochre; hover brightens are `--ink-accent-bright`; ochre never floods surfaces (washes ≤ .07α).

### Laws you must not break

- Lowercase mono chrome (`text-transform: lowercase` on mono labels).
- Touch floors: interactive elements ≥44px on coarse pointers; fine pointers may step to 40px via `@media (pointer: fine)`.
- Keyboard focus must stay clearly visible (`:focus-visible`). Records use the family device (their separator turns ochre); pills keep the outline pattern.
- `prefers-reduced-motion: reduce` — global kill switch exists; any transition stays quiet and non-load-bearing.
- No horizontal overflow at 1440, 1024, 700, 560, 390, 320. Titles/counts/summaries clip, never wrap (unless you deliberately restructure a card's anatomy — then argue it and keep every width clipped).
- Escape/keyboard behaviors are page-level — don't touch JS logic; markup changes only if your concept genuinely needs them.
- Class names used by the checks must survive: `.pg-card`, `.pg-card .pg-pill`, `.pg-tier-list button` (nth-child indexed), `.pg-tier-row`, `.pg-tier-count`, `.pg-face-head`, `.pg-crumb-back`, `.pg-search input` (the query input), `.pg-pill`.

## 2. Current state verbatim (what you are changing)

### R1 — the search + card render in TierPanel.tsx (complete, verbatim; touch only if your concept needs markup changes)

```tsx
function Card({
  topic,
  isFlash,
  onOpenLesson,
}: {
  topic: TierTopic;
  isFlash: boolean;
  onOpenLesson: (topicId: string) => void;
}) {
  return (
    <article className={`pg-card${isFlash ? " is-flash" : ""}`} data-topic-id={topic.id}>
      <div className="pg-topline">
        <span>{pad(topic.index)}</span>
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.summary}</p>
      {/* Foot renders only when a reader exists. */}
      {topic.lesson && (
        <div className="pg-card-foot">
          <button className="pg-pill" type="button" onClick={() => onOpenLesson(topic.id)}>
            open lesson →
          </button>
        </div>
      )}
    </article>
  );
}
```

```tsx
  return (
    <>
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
      <section className="pg-tier-panel" aria-live="polite" ref={panelRef}>
        {panelBody}
      </section>
    </>
  );
}
```

(The model rows in TierList.tsx are separate and small — only their CSS is in your scope; the JSX above is all the markup you may touch.)

### R2 — tiers.css (COMPLETE FILE, verbatim)

```css
/* tiers.css — ported from the approved artifact (R003).
   Scope repairs for the repo: the artifact's :root token block becomes a
   .practice-map-field var alias block (the shell owns the real values);
   global resets (box-sizing/html/body/::selection) are dropped; the hero
   (.pg-hero/.pg-head/.pg-rail) and the field/page shells stay in
   practice-map.css, which already carries the same geometry. */

/* --pill-radius was defined in the source artifact but lost when only
   --panel-radius was aliased onto the field shell, so var(--pill-radius)
   resolved to nothing and the pill controls rendered square. Restore it on
   the field wrapper; it cascades to every control below. */
.practice-map-field{ --pill-radius:999px; }

/* ---------- shared chrome ---------- */
.pg-tier-count,.pg-pill,
.pg-face-count,.pg-search input,.pg-pal input,.pg-pal-kind,.pg-hint,.pg-empty{
  font-family:"IBM Plex Mono",ui-monospace,monospace; text-transform:lowercase; letter-spacing:.04em;
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
.pg-pill:focus-visible,.pg-face-head:focus-visible,.pg-pal-item:focus-visible{
  outline:1px solid var(--ink-accent); outline-offset:2px;
}

/* ---------- 2. layout ---------- */
.pg-layout{
  margin-top:40px; display:grid; gap:28px 30px;
  grid-template-columns:minmax(0,0.57fr) minmax(0,1.40fr); /* ~20% narrower list; row anatomy verified at 1440/1024 */
  grid-template-areas:"list search" "list panel";
  align-items:start;
}

/* tier list — considered model index: ruled records, ordinal anchor.
   RULED-RECORD FAMILY (F033): the body joins the hero's voice — a strong
   opening rule on the group (--ink-line, matching .hero-ledger) and a soft
   hairline between records (--ink-line-soft, matching .rec). no radius,
   no fill, no side walls; the field shows through under the grain. pill
   controls keep 999px — pills are the control language, records are the
   container language. extendable: folders, crumb, and other containers
   may adopt the same two-rule recipe later. */
.pg-tier-list{
  grid-area:list; margin-top:1rem;
  display:flex; flex-direction:column; gap:0;
  border-top:1px solid var(--ink-line);
}
.pg-tier-row{
  width:100%; display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  align-items:baseline; column-gap:.6rem; row-gap:.4rem;
  padding:.85rem 1rem; text-align:left;            /* content inset from the open sides */
  border:0; border-bottom:1px solid var(--ink-line-soft);
  border-radius:0; background:transparent;
  color:rgba(238,234,224,.68); cursor:pointer;
  transition:border-color 180ms ease, color 180ms ease, background 180ms ease;
}
.pg-tier-row:hover{
  border-bottom-color:var(--ink-line);
  color:var(--ink-text);
  background:rgba(238,234,224,.03);
}
/* keyboard focus rides the family device: the record's own separator turns
   ochre — no four-sided outline, the record has no side walls to outline. */
.pg-tier-row:focus-visible{outline:none; border-bottom-color:var(--ink-accent)}
/* active: the open record is the only fully-legible row — ordinal AND
   sample lift to full read. hover washes the row and lights the name;
   only active brightens ordinal AND sample. no ochre / no fill jump /
   no reflow — the R013 lit-record device survives the container swap. */
.pg-tier-row.is-active{
  color:var(--ink-text);
  border-bottom-color:var(--ink-line-soft);
  background:rgba(238,234,224,.02);
}
.pg-tier-index{
  grid-column:1; font-family:var(--mono); font-size:.68rem; letter-spacing:.04em;
  color:var(--ink-faint); font-variant-numeric:tabular-nums; line-height:1.15;
}
.pg-tier-row.is-active .pg-tier-index{color:var(--ink-text)}
.pg-tier-name{
  grid-column:2; min-width:0;
  font-family:var(--sans); font-size:1rem; font-weight:600;
  letter-spacing:0; line-height:1.15; color:inherit; text-transform:none;
  /* one-line names in the narrowed column: the 701-1024 band cannot hold the
     longest name + count on the fr arithmetic alone — clip, never wrap */
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.pg-tier-count{
  grid-column:3; font-family:var(--mono); font-size:.72rem; color:var(--ink-accent);
  justify-self:end; white-space:nowrap; line-height:1.15;
}
.pg-tier-sample{
  grid-column:2 / -1; font-size:.72rem; line-height:1.4; color:var(--ink-faint);
  overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical;
}
.pg-tier-row.is-active .pg-tier-sample{color:var(--ink-muted)}

/* ---------- 5a. search — one machined bar with the ⌘k pill ---------- */
.pg-search{grid-area:search; display:flex; gap:10px; align-items:center}
.pg-search input{
  flex:1 1 auto; min-width:0; min-height:44px;
  font-family:var(--mono); font-size:.74rem; letter-spacing:.05em; text-transform:lowercase;
  color:var(--ink-text); caret-color:var(--ink-accent);
  background:var(--ink-panel); border:1px solid var(--ink-line-soft); border-radius:var(--pill-radius);
  padding:0 1.15em; appearance:none; -webkit-appearance:none; outline:none;
  transition:border-color .18s ease;
}
.pg-search input::placeholder{color:var(--ink-faint); letter-spacing:.05em}
/* strip browser search-field chrome (cancel button, decoration) */
.pg-search input::-webkit-search-cancel-button,
.pg-search input::-webkit-search-decoration{-webkit-appearance:none; appearance:none}
.pg-search input:hover{border-color:var(--ink-line)}
/* focus is a whisper: border steps one opacity notch; no colour, no glow */
.pg-search input:focus{border-color:var(--ink-line)}
.pg-search input:focus-visible{outline:1px solid var(--ink-line); outline-offset:2px}
.pg-search .pg-pill{flex:0 0 auto; min-height:44px; letter-spacing:.05em}
@media (pointer:fine){
  .pg-search input{min-height:40px}
  .pg-search .pg-pill{min-height:40px}
}

/* ---------- 3. tier panel ---------- */
.pg-tier-panel{grid-area:panel; min-width:0}
.pg-tier-head{
  display:flex; align-items:center; gap:.8em; flex-wrap:wrap;
  padding-bottom:1rem; margin-bottom:1.1rem; /* the group's opening rule replaces the old hairline */
}
.pg-tier-head h2{
  margin:0; font-family:var(--sans); font-weight:600;
  text-transform:none; letter-spacing:0; font-size:1.15rem; line-height:1.1; color:var(--ink-text);
}
/* lesson cards: same ruled-record family — no box, no float.
   flash (palette jump) colors its rule ochre and washes faintly; the rule
   COLOR (ochre vs hover's neutral) is the tell, placed after :hover so it
   wins. ochre is the card's standing accent (topline/count/pill). */
.pg-cards{
  display:flex; flex-direction:column; gap:0;
  border-top:1px solid var(--ink-line);
}
.pg-card{
  border:0; border-bottom:1px solid var(--ink-line-soft);
  border-radius:0; padding:1.6rem; background:transparent; min-width:0;
  transition:border-color 180ms ease, background 180ms ease;
}
.pg-card:hover{
  border-bottom-color:var(--ink-line);
  background:rgba(238,234,224,.03);
}
.pg-card.is-flash{
  border-bottom-color:var(--ink-accent);
  background:rgba(211,155,97,.06);
}
.pg-topline{
  display:flex; align-items:center; justify-content:space-between; gap:1rem;
  margin-bottom:.8rem;
  color:var(--ink-accent); font-family:var(--mono); font-size:12px; font-weight:500;
  letter-spacing:.02em;
}
.pg-card h3{
  margin:0 0 .55rem; font-family:var(--sans);
  font-size:clamp(20px,1.6vw,24px); font-weight:700; line-height:1.2; color:var(--ink-text);
}
/* Preview only: the full summary lives on in the lesson reader, so the card
   clamps to two lines. */
.pg-card p{
  margin:0; color:var(--ink-muted); font-size:14px; line-height:1.5;
  display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
/* Foot holds the outlined "open lesson" pill, floored at 44px. */
.pg-card-foot{
  margin-top:.9rem; display:flex; flex-wrap:wrap; align-items:center; gap:.6rem;
}
.pg-card-foot .pg-pill{
  display:inline-flex; align-items:center; gap:.5rem; min-height:44px;
  border:1px solid var(--ink-line-soft); border-radius:var(--pill-radius);
  padding:.45rem .9rem; background:transparent; cursor:pointer;
  font-family:var(--mono); font-size:.72rem; letter-spacing:.04em; text-transform:lowercase;
  color:var(--ink-accent);
  transition:border-color 180ms ease, color 180ms ease, background 180ms ease, gap 180ms ease;
}
.pg-card-foot .pg-pill:hover{gap:.75rem; border-color:var(--ink-accent); color:var(--ink-accent-bright); background:var(--ink-panel)}

/* ---------- 4. folders — ruled records (folder box + tab retired) ---------- */
.pg-faces{
  display:flex; flex-direction:column;
  border-top:1px solid var(--ink-line);          /* group opens with one strong rule */
}
.pg-face-head{
  width:100%; text-align:left; display:block; cursor:pointer;
  background:transparent; border:0; color:inherit;
  border-bottom:1px solid var(--ink-line-soft);  /* soft hairline separates each record */
  padding:1.6rem; min-height:44px;               /* card-scale inset from the open sides */
  transition:background 180ms ease, border-color 180ms ease;
}
.pg-face-head:hover{
  background:rgba(238,234,224,.03);              /* quiet full-width wash */
  border-bottom-color:var(--ink-line);           /* separator brightens */
}
.pg-face-head:focus-visible{
  outline:none;                                  /* records have no walls to outline */
  border-bottom-color:var(--ink-accent);         /* record's own separator turns ochre */
}
.pg-face-top{display:flex; align-items:baseline; gap:.7em; flex-wrap:nowrap}
.pg-face-label{
  font-family:var(--sans); font-size:1.05rem; font-weight:600; color:var(--ink-text);
  text-transform:none; flex:0 1 auto; min-width:0;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.pg-face-count{font-family:var(--mono); font-size:.64rem; color:var(--ink-faint); flex:none; white-space:nowrap}
.pg-face-mark{
  margin-left:auto; flex:none;
  font-family:var(--mono); font-size:.8rem; color:var(--ink-accent);  /* ochre directional instrument */
  transition:transform 180ms ease, color 180ms ease;
}
.pg-face-head:hover .pg-face-mark{transform:translateX(3px); color:var(--ink-accent-bright)}
.pg-peek{margin:.85em 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:5px}
.pg-peek li{
  font-size:.8rem; line-height:1.45; color:var(--ink-faint); padding-left:16px; position:relative;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.pg-peek li::before{content:'—'; position:absolute; left:0; color:var(--ink-line)}
.pg-empty{font-size:.7rem; color:var(--ink-faint); padding:12px 2px; font-family:var(--mono); letter-spacing:.04em; text-transform:lowercase}

/* ---------- 4b. volume-view crumb — one composed instrument ---------- */
.pg-crumb{
  display:flex; align-items:center; flex-wrap:nowrap; gap:0;
  padding-bottom:1rem; margin-bottom:1.1rem;      /* cards' opening rule replaces old hairline */
}
.pg-crumb-back{
  display:inline-flex; align-items:center; gap:.55rem; min-height:44px; flex:none;
  border:1px solid var(--ink-line); border-radius:var(--pill-radius);
  padding:.5rem 1.1rem; background:transparent; cursor:pointer; color:var(--ink-text);
  font-family:var(--mono); font-size:.8rem; font-weight:500; letter-spacing:.02em; text-transform:lowercase;
  transition:border-color 180ms ease, color 180ms ease, background 180ms ease;
}
@media (pointer:fine){ .pg-crumb-back{min-height:40px} }
.pg-crumb-arrow{color:var(--ink-accent); font-size:1rem; line-height:1; transition:transform 180ms ease, color 180ms ease}
.pg-crumb-back:hover{border-color:var(--ink-accent); color:var(--ink-accent-bright); background:rgba(211,155,97,.07)}
.pg-crumb-back:hover .pg-crumb-arrow{transform:translateX(-3px); color:var(--ink-accent-bright)}
.pg-crumb-back:focus-visible{outline:1px solid var(--ink-accent); outline-offset:2px}
/* the family hairline welds back-control → title into one breadcrumb instrument */
.pg-crumb-title{
  flex:1 1 auto; min-width:0;
  margin-left:.95rem; padding-left:.95rem; border-left:1px solid var(--ink-line);
  font-family:var(--mono); font-size:.78rem; font-weight:400;
  letter-spacing:.04em; text-transform:lowercase; line-height:1.2; color:var(--ink-muted);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

/* ---------- 5b. palette ---------- */
.pg-palette{
  position:fixed; inset:0; z-index:40;
  background:rgba(7,12,15,.72); backdrop-filter:blur(6px);
}
.pg-pal{
  position:absolute; top:11vh; left:50%; transform:translateX(-50%); width:min(560px,calc(100% - 40px));
  border:1px solid var(--ink-line); border-radius:var(--panel-radius); background:#0d171c;
  box-shadow:0 30px 80px rgba(0,0,0,.55); overflow:hidden;
}
.pg-pal input{
  width:100%; border:0; border-bottom:1px solid var(--ink-line-soft); background:transparent;
  color:var(--ink-text); font-size:.78rem; padding:18px 22px; outline:none;
}
.pg-pal input::placeholder{color:var(--ink-faint)}
.pg-pal-list{max-height:52vh; overflow:auto; padding:8px}
.pg-pal-item{
  width:100%; display:flex; align-items:baseline; gap:12px; text-align:left;
  padding:11px 14px; border:0; border-radius:14px; background:transparent; color:inherit; cursor:pointer;
}
.pg-pal-item.is-sel{background:rgba(211,155,97,.12)}
.pg-pal-kind{font-size:.6rem; color:var(--ink-accent-deep); flex:0 0 58px}
.pg-pal-title{font-family:var(--sans); font-size:.94rem; line-height:1.35; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.pg-pal-item.is-sel .pg-pal-title{color:var(--ink-accent-bright)}
.pg-pal-sub{margin-left:auto; font-family:var(--mono); font-size:.6rem; letter-spacing:.04em; color:var(--ink-faint); white-space:nowrap}
.pg-pal-foot{border-top:1px solid var(--ink-line-soft); padding:11px 22px; font-family:var(--mono); font-size:.6rem; letter-spacing:.04em; color:var(--ink-faint)}

/* ---------- 6. mobile (stepped token-shrink, one rhythm; ≥44px floors) ---------- */
@media (max-width:900px){
  .pg-layout{margin-top:32px; gap:26px 26px}
}
@media (max-width:700px){
  .pg-layout{margin-top:24px; grid-template-columns:1fr; grid-template-areas:"list" "search" "panel"; gap:18px}
  /* search bar rides ~25% narrower, centered — field breathing on both sides
     (width:100% keeps the flex row definite so the input fills it) */
  .pg-search{width:100%; max-width:75%; margin-inline:auto}
  .pg-tier-row{grid-template-columns:auto minmax(0,1fr) auto; padding:.75rem .85rem; min-height:44px}
  .pg-tier-count{justify-self:end}
  .pg-card{padding:1.15rem}
  .pg-tier-head{padding-bottom:.8rem; margin-bottom:.9rem}
  .pg-crumb{padding-bottom:.8rem; margin-bottom:.9rem}
  .pg-face-head{padding:1.2rem 1rem}          /* card-scale inset at mobile; base min-height 44px holds */
  .pg-cards{gap:0}
  .pg-pal{top:0; left:0; transform:none; width:100%; border-radius:0 0 var(--panel-radius) var(--panel-radius); border-left:0; border-right:0; border-top:0}
  .pg-pal-list{max-height:64vh}
}
@media (max-width:560px){
  .pg-layout{margin-top:18px; gap:14px}
  .pg-card{padding:1rem}
  .pg-tier-head{padding-bottom:.7rem; margin-bottom:.75rem}
  .pg-crumb{padding-bottom:.7rem; margin-bottom:.75rem}
  .pg-crumb-title{margin-left:.7rem; padding-left:.7rem}  /* tighten the divider rhythm */
  .pg-card-foot{gap:.5rem}
}
```

## 3. The four asks, as working space

1. **Search bar (F038 + F039).** It reads template-driven because it IS the template: a rounded-pill input with a panel fill next to a pill button. "Cleaner, more stripped-back" — decide what that IS on this page. Some directions worth weighing (you are NOT limited to these): a borderless field over a single bottom hairline (terminal/ledger register read), the ⌘k pill dissolving into plain mono chrome, the input losing its fill for bare field-on-the-record treatment, a quieter placeholder voice. The iOS Safari constraint is HARD: whatever you pick must not depend on fit-content/auto-width flex tricks (that trap already bit once — the bar collapsed to ~59% width before a `width:100%` fix). Give the input an explicit width chain, avoid `margin-inline:auto` centering patterns that need definite widths, and keep the ⌘k affordance discoverable. iOS cannot be tested here — say so and design so the failure class is structurally impossible.
2. **Highlight alternative (F041).** Today hover = full-width wash `rgba(238,234,224,.03)` + separator brighten. The owner reads that wash as "slightly off". Explore alternatives WITHIN the family (no rounded boxes, no float/shadow lift, no four-sided outlines on records). Candidates might include: a slightly stronger wash, an inset left ochre/neutral tick, the record's type lifting while the surface stays still, an indent shift, a background fill at `--ink-panel` weight — judge honestly, including failure modes (too loud = template again; too quiet = invisible). Whatever you pick must stay ONE language across tier rows, lesson cards, AND the folder faces (`.pg-face-head` — they share the wash today; co-adopt deliberately). The lit-record ACTIVE device (contrast lift, no ochre) stays distinct from hover.
3. **Cards −20% (F042).** The reduction is the target, the distribution is yours: padding, type scale (h3 clamp(20px,1.6vw,24px), p 14px, topline 12px, pill paddings), internal gaps. Decide how the −20% distributes so the card reads lighter, not just smaller — and whether the folder faces (same 1.6rem card-scale insets) follow the same pass. Mobile must land lighter still (≤700/≤560 fragments are yours).
4. **Mobile section rhythm (F040 + F021).** At ≤700 the stack is list → search → panel with 18px gaps (≤560: 14px); the ruled groups + bare field make it read as one continuous block. Fix the SEPARATION, not just the gap number: more air between sections (the hero's bottom was already cut 30% — do NOT compensate by inflating the hero; the sections themselves need distance), consider what a section boundary means in this language (opening rules already exist — maybe the rhythm comes from asymmetric air, or the search row becoming its own quiet band). Values are yours; the acceptance test is the owner seeing distinct sections, not one block.

## 4. Method — deliberate before you write (required, staged)

Produce the `## Reasoning` section with ALL of these stages, in order, before any code:

1. **Restate** the four asks in one line each.
2. **Diagnosis.** For each ask: WHY does the current state produce the owner's read? (Template-driven search → what concretely triggers it? Wash feels off → what is a .03 wash actually doing on this field? Cards heavy → which values carry the weight? One-block mobile → what structural fact collapses the sections?) Ground every diagnosis in the values you were given — no hand-waving.
3. **Candidate deliberation, per ask.** Search: at least three concepts. Highlight: at least three devices. Cards: at least two distribution plans for the −20%. Mobile rhythm: at least two separation strategies. One line each: what changes visually, how it reads, what it risks. Then pick one per ask WITH the reason that killed the alternatives — a real comparison, not a parade.
4. **Full spec.** Every CSS rule with concrete values (including the ≤900/≤700/≤560 fragments you own), any JSX changes, per-viewport behavior at 1440/1024/700/560/390/320 (reflows, clips, hover/focus states, touch floors).
5. **Risk pass**, one line each: 320px overflow; touch floors after your changes; focus-visible clarity on every surface you touched; the search bar's width behavior on iOS Safari (why your structure cannot reproduce the narrow/centered bug); blast radius of shared selectors (`.pg-pill` is shared with the crumb/palette/cards — name anything you did NOT touch that your changes visually interact with).
6. **Red team.** The strongest case AGAINST your combined picks as the owner would see them ("template-driven again", "overdesigned", "sections still cramped"); defend or fold.
7. **Coherence check.** One short paragraph: do the four changes read as ONE refinement pass in one voice — or as four unrelated tweaks? If four tweaks, fix your picks before shipping.

There is no approval gate: pick, justify, ship. Show the work.

## 5. Acceptance criteria (observable)

1. Search bar: a treatment that does not read as the standard rounded-search-input template; the ⌘k affordance still discoverable; focus stays a whisper (F028) and visible (`:focus-visible`); width structurally robust (explicit widths/flows, no fit-content traps) for iOS Safari.
2. Highlight: a single alternative device across tier rows + cards + faces; clearly deliberate (not the old wash), not loud; the active lit-record device stays distinct; content stays inset (F035).
3. Cards: visibly lighter (~20% less visual weight) at 1440 AND at 390; hierarchy intact (topline → title → summary → foot still reads in that order); the open-lesson pill keeps ≥44px touch floor.
4. Mobile: distinct section separation at 390/320 — the stack no longer reads as one continuous block; hero bottom space untouched (−30% already applied by the orchestrator).
5. Family intact: ruled-record recipe (top rule + hairlines, no radius/boxes), lowercase mono chrome, ochre discipline, pills at 999px.
6. No horizontal overflow at 1440/1024/700/560/390/320 from anything you changed; text clips, never overflows.
7. Code complete and self-consistent: no dangling selectors, no orphaned rules for markup you removed; TSX would compile (no unused imports); check-script class names survive (§1 list).

## 6. Output contract (exactly this shape)

```
## Reasoning
<per §4: restatement → diagnosis → per-ask candidates + picks → full spec → risk pass → red team → coherence check>

## Changes
### R1 — TierPanel.tsx (search + card render)
<complete new text for the region, or "unchanged" + reason>

### R2 — tiers.css (complete file)
<the COMPLETE new file, verbatim, header comment included; name every deletion in a one-line preamble>

## Self-review
<checklist: each of the 7 acceptance criteria, pass/fail judged against your own produced code, one line each>

## Notes
<optional, ≤5 lines: out-of-scope observations only — no code>
```

Rules: return tiers.css as the WHOLE file (the orchestrator replaces it wholesale — keep every rule you did not touch byte-identical, keep the file's comment voice: terse, reasons-not-narration, a short comment only where a non-obvious constraint genuinely needs one; no comments narrating the change).
