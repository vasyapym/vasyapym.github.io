# Task brief — Practice Map R006: owner feedback batch (8 asks)

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design and code choice in this task: do not ask for approval, do not offer option lists. Deliberate in ## Reasoning before writing any code, then ship one coherent answer. Depth beats speed — the full text of §2–§5 is your workspace; work through §4 before writing any code.

## 0. Where this comes from (context you cannot infer)

"Practice Map" is a live page in a dark-ink developer portfolio. It was rebuilt around a "model-tier playground" IA (approved design, implemented), then polished in R005, and the owner **liked R005 as presented**. The eight asks below are the owner's NEXT feedback batch — refinements to the liked surface, not a redesign. Two notes on history that constrain you:

- The per-lesson concept graph (opened from each lesson card's "concept graph ↗" control) was introduced in R005 and LIKED in its scoped form: focus = the lesson's concepts + up to 2 strongest neighbors each, overlay titled by the lesson. The owner NOW rejects its text chrome (stats, hints) and wants a hard node cap — the scoping algebra itself stays.
- The inverted volume breadcrumb (dominant "← go back" pill, small mono volume title) was LIKED stylistically; ask 7 only scales it down ~15%. Do not re-invert or restyle it.

## 1. The page and its laws

React 19 + TypeScript + Vite; IBM Plex Sans for display/prose, IBM Plex Mono for chrome; custom props `--ink-*`; `--panel-radius: 20px`; `--pill-radius: 999px` (defined on `.practice-map-field`). Register: dark swiss archive editorial — lowercase mono chrome, ochre accent over near-black ink, hairline borders, 999px pill controls. Layout: two columns — left = tier list (model rows), right = search + ⌘K pill above a panel of lesson cards; the "thinking" tier shows 5 folder faces that enter volumes (breadcrumb row + cards).

Laws you must not break:
- Lowercase mono chrome for all controls; pill controls = 999px corners; panels/cards = `--panel-radius`.
- Lesson-card concept chips follow the cap law (≤10 all shown, ≥11 → 8 + "+N more" toggle — the logic in `Card` stays untouched).
- Tier order = data order; all counts computed from data.
- Overlay key ownership: while a lesson or graph overlay is open, the page-level key handler skips (already implemented — do not touch it).
- `prefers-reduced-motion` block kills transitions — don't defeat it.
- Do NOT change input font sizes (pre-existing iOS zoom guard — the search input keeps its `font-size`).
- Viewport matrix to hold without horizontal overflow: 1440, ~1024, ≤700 (single column), 560, 390, 320.
- Test hooks the browser check drives (keep the classes): `.pg-card`, `.pg-pill` (unique to "open lesson"), `.pg-card-graph`, `.pg-crumb-back`, `.pg-face-head`, `.pg-tier-row`, `.practice-graph-node`, `.practice-graph-overlay`. Test retargeting is the orchestrator's job — never keep dead UI alive just for a test.
- No changes outside the regions given in §3; `curriculum.ts`, `LessonOverlay` internals, `Palette.tsx` untouched.

## 2. The owner's eight asks (verbatim, then working interpretation)

1. *"The graph surfaces too many concepts per lesson. Enforce a hard cap on the number of visible nodes. Remove all metadata strings (e.g., 'source lesson · Go с нуля до глубокого понимания · 30 lesson concepts + 2 strongest neighbors · 438 links') — these fall outside the graph's intended scope. Similarly, strip UI hint overlays such as 'drag node' and 'tap to inspect.'"* → Two moves in the ConceptGraph overlay. (a) HARD CAP on visible nodes in lesson scope (today the focus set is uncapped — a 49-concept lesson renders 49+ nodes; the global scope already caps via `layoutParams().count`). You pick the cap and the ranking that decides who survives (strength is already computed). (b) The overlay becomes visually quiet: the source-lesson stats line (`.practice-graph-readout-head` "source lesson · …"), the footer hint line ("drag nodes · tap to inspect · connections light up · a curriculum as a system"), and the empty-state line ("drag a node · its connections light up") die. The ranked list (`.practice-graph-ranklist`, index/name/×strength/lessons) and the active-node inspection text ("name · N topics", "on the map: …", "also appears with: …") are the same family of strings — your call whether they die entirely (readout block removed, pure visual graph under the lesson title) or survive in trimmed form; state the choice and one-line justification. The overlay header (kicker "system map" + lesson title h2) and the close button stay.
2. *"Change 'teaching stuff' to 'teaching concepts' in the header copy."* → h1 second line becomes "teaching concepts." (the trailing period is the liked treatment).
3. *"Narrow the left-panel model list. Its current width serves no functional purpose and unnecessarily compresses the main content area."* → `.pg-layout` is `grid-template-columns: minmax(0,0.92fr) minmax(0,1.28fr)`; shift the ratio toward the panel. Mind that the tier rows hold name + count + a 1-line sample — verify nothing wraps ugly at ~1024 and at ≤700 (single column) it's irrelevant.
4. *"Translate the placeholder text 'фильтр уроков — название и описание' to English to match the rest of the interface language."* → you pick the exact English wording in the page's lowercase mono register.
5. *"Apply rounded corners to tag elements within lesson cards for visual consistency."* → `.pg-chip` (and `.pg-chip.is-more`) currently has square corners. You pick the radius (the 999px pill token vs a smaller radius consistent with the 20px panel family) — one line of justification.
6. *"Increase padding between the lesson number (e.g., '01'), title, and description. These elements currently collide visually — each needs clear separation."* → inside `.pg-card`: `.pg-topline` (the number), `h3`, and `p` currently stack with zero margins between them. Give each element clear breathing room (concrete margins), keeping the card's overall padding as-is (30px desktop — just settled in R005).
7. *"The '← go back · vol 01 — first contact' treatment works well stylistically. Reduce both the button dimensions and its font size by ~15% so it sits proportionally with the surrounding UI."* → `.pg-crumb-back`: font .95rem → ~0.8rem; padding scaled down proportionally. The 44px min-height floor may step down to ~40px on fine pointers, but coarse-pointer (touch) tap targets should stay ≥44px — resolve how (e.g. a pointer media query, or accept 40px; justify).
8. *"On mobile, the hero block ('archive of ai outputs / teaching concepts') lacks presence. Add padding, increase the type size, and give it deliberate vertical space so it reads as an intentional heading rather than orphaned text."* → the ≤900 and ≤560 hero rules (h1 font-size clamps + the shared card padding). More vertical padding, bigger type, intentional vertical rhythm — concrete values. It must still not crowd the `.pg-layout` below it (mobile spacing was just tightened in R005 and liked).

## 3. Current state verbatim (only these regions may change)

### R1 — web/PracticeMapPage.tsx — hero render region (current)

```tsx
        <header className="practice-map-hero">
          <h1 id="practice-map-title">
            archive of ai outputs
            <span>teaching stuff.</span>
          </h1>
        </header>
```

### R2 — web/PracticeMapPage.tsx — ConceptGraph focus memo (current)

```tsx
  // Focus set. Global scope (no topic): today's top-slice behavior. Lesson
  // scope: seeds = this lesson's concepts present in the graph; focus = seeds
  // + up to 2 strongest neighbors per seed (neighbor strength = summed edge
  // weight), deduplicated; sorted by strength.
  const focus = useMemo(() => {
    const strengthOf = (name: string): number => {
      const m = graphAll.edges.get(name);
      if (!m) return 0;
      let s = 0;
      for (const w of m.values()) s += w;
      return s;
    };

    if (!topic) {
      const nodeCount = dims ? layout.count : 28;
      const names = graphAll.ranked.slice(0, nodeCount);
      return { names, seedCount: names.length, neighborCount: 0, lessonScope: false };
    }

    const seeds = Array.from(new Set(topic.concepts)).filter((c) => graphAll.topicsByConcept.has(c));
    const seedSet = new Set(seeds);
    const picked = new Set<string>(seeds);
    for (const seed of seeds) {
      const m = graphAll.edges.get(seed);
      if (!m) continue;
      const strongest = Array.from(m.entries())
        .filter(([n]) => !seedSet.has(n))
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 2)
        .map(([n]) => n);
      for (const n of strongest) picked.add(n);
    }
    const names = Array.from(picked).sort(
      (a, b) => strengthOf(b) - strengthOf(a) || a.localeCompare(b),
    );
    return {
      names,
      seedCount: seeds.length,
      neighborCount: names.length - seeds.length,
      lessonScope: true,
    };
  }, [topic, graphAll, dims, layout.count]);
```

(For orientation: `layoutParams(width)` returns `{ count, marginX, marginY, minDist }` — count is 28 desktop / 20 mid / 12–10 phone; `layout` = `layoutParams(dims?.w ?? 834)`. The seedLayout relaxation uses `params.minDist` for pixel spacing.)

### R3 — web/PracticeMapPage.tsx — graph readout + footer JSX (current)

```tsx
        <div className="practice-graph-readout" aria-live="polite">
          {focus.lessonScope && topic && (
            <>
              <p className="practice-graph-readout-head">
                source lesson · {topic.title} · {focus.seedCount}{" "}
                {focus.seedCount === 1 ? "lesson concept" : "lesson concepts"} +{" "}
                {focus.neighborCount} strongest{" "}
                {focus.neighborCount === 1 ? "neighbor" : "neighbors"} ·{" "}
                {graphModel.linkCount} {graphModel.linkCount === 1 ? "link" : "links"}
              </p>
              <ul className="practice-graph-ranklist">
                {graphModel.nodes.map((node, i) => (
                  <li key={node.name}>
                    <span className="rl-idx">{String(i + 1).padStart(2, "0")}</span>
                    <span className="rl-name">{node.name}</span>
                    <span className="rl-strength">×{node.strength}</span>
                    <span className="rl-lessons">
                      {node.topicCount} {node.topicCount === 1 ? "lesson" : "lessons"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {activeNode ? (
            <>
              <p className="practice-graph-readout-head">
                {activeNode.name} · {activeNode.topicCount}{" "}
                {activeNode.topicCount === 1 ? "topic" : "topics"}
              </p>
              <p className="practice-graph-readout-links">
                {activeNode.mapLinks.length > 0
                  ? `on the map: ${activeNode.mapLinks
                      .slice(0, 6)
                      .map((link) => `${link.name} ×${link.weight}`)
                      .join(" · ")}${activeNode.mapLinks.length > 6 ? ` · +${activeNode.mapLinks.length - 6} more` : ""}`
                  : "no links on this map"}
              </p>
              {activeNode.sideLinks.length > 0 && (
                <p className="practice-graph-readout-side">
                  also appears with:{" "}
                  {activeNode.sideLinks
                    .map((link) => `${link.name} ×${link.weight}`)
                    .join(" · ")}
                  {activeNode.sideLinkCount > activeNode.sideLinks.length
                    ? ` · +${activeNode.sideLinkCount - activeNode.sideLinks.length} more`
                    : ""}
                </p>
              )}
              <p className="practice-graph-readout-topics">
                {activeNode.topicTitles.join(" · ")}
              </p>
            </>
          ) : (
            <p className="practice-graph-readout-empty">
              drag a node · its connections light up
            </p>
          )}
        </div>
        <footer className="practice-graph-footer">
          drag nodes · tap to inspect · connections light up · a curriculum as a system
        </footer>
```

(If the readout block dies entirely, also name the deletions: the `<div className="practice-graph-readout">…</div>` wrapper, the `<footer className="practice-graph-footer">…</footer>`, the `aria-live` block, and any now-unused CSS rules in practice-map.css lines 247–302 + the ≤700 readout rules at 352–384 + the ≤400 readout rule at 403–408 — the orchestrator will splice. Unused TSX state/props after removals must go too — TypeScript is strict.)

### R4 — web/lib/tiers/TierPanel.tsx — Card + search (current, verbatim)

```tsx
  return (
    <article className={`pg-card${isFlash ? " is-flash" : ""}`} data-topic-id={topic.id}>
      <div className="pg-topline">
        <span>{pad(topic.index)}</span>
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.summary}</p>
```

```tsx
      <div className="pg-search">
        <input
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="фильтр уроков — название и описание"
          aria-label="filter lessons"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <button className="pg-pill" type="button" onClick={onOpenPalette}>
          ⌘k
        </button>
      </div>
```

### R5 — web/lib/tiers/tiers.css — current rules (relevant subset)

```css
.pg-layout{
  margin-top:40px; display:grid; gap:28px 30px;
  grid-template-columns:minmax(0,0.92fr) minmax(0,1.28fr);
  grid-template-areas:"list search" "list panel";
  align-items:start;
}
.pg-topline{
  display:flex; align-items:center; justify-content:space-between; gap:1rem;
  color:var(--ink-accent); font-family:var(--mono); font-size:12px; font-weight:500;
  letter-spacing:.02em;
}
.pg-card h3{
  margin:0; font-family:var(--sans);
  font-size:clamp(20px,1.6vw,24px); font-weight:700; line-height:1.2; color:var(--ink-text);
}
.pg-card p{
  margin:0; color:var(--ink-muted); font-size:14px; line-height:1.5;
  display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
.pg-chips{display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.9rem}
.pg-chip{
  border:1px solid var(--ink-line-soft); padding:.28rem .4rem; color:var(--ink-faint);
  font-family:var(--mono); font-size:.68rem; letter-spacing:.03em; text-transform:lowercase;
}
.pg-crumb-back{
  display:inline-flex; align-items:center; gap:.5rem; min-height:44px;
  border:1px solid var(--ink-line); border-radius:var(--pill-radius);
  padding:.5rem 1rem; background:transparent; cursor:pointer; color:var(--ink-accent);
  font-family:var(--mono); font-size:.95rem; letter-spacing:.03em; text-transform:lowercase;
  transition:border-color 180ms ease, color 180ms ease, background 180ms ease, gap 180ms ease;
}
```

Mobile blocks in the same file (context for ask 8 interplay — `.pg-layout` margins were just tightened and LIKED):

```css
@media (max-width:900px){
  .pg-layout{margin-top:32px; gap:26px 26px}
}
@media (max-width:700px){
  .pg-layout{margin-top:24px; grid-template-columns:1fr; grid-template-areas:"list" "search" "panel"; gap:18px}
  .pg-card{padding:20px}
}
@media (max-width:560px){
  .pg-layout{margin-top:18px; gap:14px}
  .pg-card{padding:16px}
}
```

### R6 — web/practice-map.css — hero + its media rules (current)

```css
.practice-map-hero {
  display: block;
}
.practice-map-hero h1 {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
  padding: clamp(1.05rem, 2vw, 1.55rem) clamp(1.05rem, 2vw, 1.55rem)
    clamp(1.2rem, 2.2vw, 1.7rem);
  background: rgba(9, 15, 18, 0.62);
  border: 1px solid var(--ink-line-soft);
  border-left: 2px solid var(--ink-accent-deep);
  border-radius: var(--panel-radius);
  font-family: var(--display);
  font-size: clamp(1.15rem, calc((100vw - 72px) / 26), 3.2rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 0.98;
  text-transform: lowercase;
  color: var(--ink-text);
}
.practice-map-hero h1 span {
  display: block;
  color: var(--ink-accent-bright);
}

@media (max-width: 900px) {
  .practice-map-hero h1 {
    font-size: clamp(1.4rem, 7.2vw, 2.6rem);
  }
}
@media (max-width: 560px) {
  .practice-map-hero h1 { font-size: clamp(1.4rem, 7.2vw, 2rem); }
}
```

## 4. Method — deliberate before you write (required)

Before any code, produce the `## Reasoning` section:

1. Restate all eight asks in one line each — in your own words, proving you hold the whole batch.
2. Cross-ask map: name the shared surfaces (1 touches the focus memo + readout JSX + practice-map.css readout rules; 6 touches the card type stack; 3+8 both move layout space; 5+6 both inside `.pg-card`) and the order you'll apply them so no ask undoes another.
3. For EACH ask, name ≥2 alternatives and pick one with a concrete reason. Minimum coverage:
   - (1) the cap value and the survival ranking; the fate of the ranklist and active-node inspection text (die vs trimmed — justify in one line); whether the readout wrapper itself survives;
   - (3) the concrete column ratio and the failure mode you checked at ~1024;
   - (5) the chip radius value and which family it joins;
   - (6) the concrete margins between number / title / description;
   - (7) the concrete new font-size + padding + min-height, and the coarse-pointer resolution;
   - (8) the concrete mobile clamp + padding values at ≤900 and ≤560.
4. Risk pass: for each ask, one line on what it could break (the strict TS unused-symbol rule if the readout dies; the ~1024 tier-row sample wrap; the liked mobile rhythm under a bigger hero; the crumb row wrap at 320 with the smaller back pill; the 44px floor).
5. Self-review against §5 before returning — see the `## Self-review` output section.

There is no approval gate and no option list to offer: pick, justify, ship.

## 5. Acceptance criteria (observable)

1. Lesson-scoped graph: visible nodes never exceed the hard cap (any lesson, including the 49-concept one); no "source lesson · …" stats string anywhere; no "drag"/"tap" hint text anywhere in the overlay; header + close button intact; the graph still opens per lesson card via `.pg-card-graph` with the lesson title in the header.
2. h1 second line reads "teaching concepts." — desktop clamp untouched (3.2rem cap at 1440, divisor 26).
3. Left column visibly narrower at 1440 and ~1024; tier rows intact (no sample overflow/wrap damage); main panel visibly wider.
4. Search placeholder is English; input font-size unchanged.
5. Lesson-card chips have rounded corners.
6. Card number / title / description have clearly separated spacing (visible gaps, no collision).
7. `.pg-crumb-back` ~15% smaller in both dimensions; touch targets still ≥44px on coarse pointers (or a justified exception).
8. Mobile hero (≤900, ≤560): larger type, more vertical padding, deliberate presence; no crowding of `.pg-layout`; no horizontal overflow at 390/320.
9. Laws intact: chip cap law untouched, lowercase mono chrome, `--panel-radius`/`--pill-radius` unchanged, reduced-motion untouched, page-level key handler untouched.
10. TypeScript strict-clean: no unused imports/vars/state after removals.

## 6. Output contract (exactly this shape)

```
## Reasoning
<per §4: restatement, cross-ask map, per-ask alternatives + picks, risk pass>

## Changes
### R1 — web/PracticeMapPage.tsx (hero region)
<complete new text>

### R2 — web/PracticeMapPage.tsx (ConceptGraph focus memo)
<complete new text; only the changed region>

### R3 — web/PracticeMapPage.tsx (graph readout + footer JSX)
<complete new text for the changed region; name every deletion explicitly>

### R4 — web/lib/tiers/TierPanel.tsx (placeholder + card body)
<complete new text for the changed regions>

### R5 — web/lib/tiers/tiers.css
<complete new rule text for every changed rule; name every deletion>

### R6 — web/practice-map.css (hero + media; plus readout rules if the readout dies)
<complete new rule text; name every deletion explicitly>

## Self-review
<checklist: each of the 10 acceptance criteria, pass/fail judged against your own produced code, one line each>

## Notes
<optional, ≤5 lines: out-of-scope observations only — no code>
```

Rules: replace regions wholesale (the orchestrator splices them into the files); keep the files' comment voice; no comments narrating the change — only a short comment where a non-obvious constraint genuinely needs one. TypeScript must compile (strict).
