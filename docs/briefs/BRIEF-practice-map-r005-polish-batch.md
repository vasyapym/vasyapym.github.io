# Task brief — Practice Map R005: polish batch (8 owner asks)

comprehensive code - react 19 + vite + ts page in a dark swiss archive editorial register, built in IBM Plex only — sans 600/700 for display and prose, mono lowercase chrome, ochre accent over near-black ink, hairline borders, 999px pill controls, 20px panel radius; the liked card skin is solid ink cards with panel radius and a quiet hover lift, not boxless rule-lists; banned: uppercase chrome, weight-300 summary/display text, any accent but the ochre family, invented palettes, canvas-rendered graphs, CDN font loading. The spec below decodes into one precise edit batch against the current files (given verbatim) — deliberate in ## Reasoning first, then fill every region of the output contract.

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design and code choice in this task: do not ask for approval, do not offer option lists — deliberate over the full text, decide, and ship one coherent answer. Depth beats speed: work through §4 before writing any code.

## 0. Donor verdicts — settled decisions (adopt, do not re-derive)

Two external drafts were reviewed by the orchestrator; the following fragments are ACCEPTED. Your job is porting them into the files below with judgment — do not re-litigate them, do not silently alter them.

- Focus algebra for ask 5, adapted to the `graphAll` data in R7:
  - global scope: the focused set = the top `nodeCount` of `graphAll.ranked` (today's behavior).
  - lesson scope: `seeds` = the lesson's concepts that exist in the graph; `focus` = seeds plus, for each seed, up to 2 strongest neighbors (neighbor strength = summed edge weight); deduplicated.
  - subgraph: nodes = the focus set sorted by strength; edges = only edges with both ends in focus.
- Lesson-scope presentation: overlay title becomes the lesson title; the readout's first line reads `source lesson · <name> · N lesson concepts + M strongest neighbors · K links`.
- Lesson-scope ranked list (adopted): the focused concepts render as a compact ranked list (index, concept name, summed strength, lessons count) inside the readout area — a `ul` under the readout line, mono, quiet, max-height capped with overflow auto. Wide viewports may place it beside the canvas if the readout block allows it; mobile stacks it.
- Lesson-scope layout — pick ONE and justify in one line: (A) keep today's seedLayout on the focused node set; (B) the top-ranked concept of the focus set sits at the canvas center, the rest on a ring ordered by rank (deterministic, no physics).
- Crumb (ask 4): adopt the donor proportions in OUR outlined pill language — back control ~0.95rem in the `.pg-pill` family keeping class `.pg-crumb-back`; the volume title steps down to ~0.8–0.85rem, muted. NOT the donor's solid-filled pill.
- Card foot (ask 5): `.pg-pill` stays unique to "open lesson"; the graph control gets class `.pg-card-graph`, outlined pill styling (not solid fill), 44px floor held.
- Hero (ask 1): lines "archive of ai outputs" / "teaching stuff."; the donor's clamp retune made the longer copy render larger — pick the concrete clamp for OUR formula so the band holds two clean lines at 1440.
- Card summary (ask 3): adopt the exact clamp mechanism — `display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden` — min-height out; padding 24→30 desktop.
- Mobile (ask 6): adopt the donor's stepped token-shrink philosophy (roughly 30–35% per breakpoint, one coherent rhythm); tap floors ≥44px stay.

REJECTED from the donors (do not introduce): solid-filled ochre pills, uppercase chrome anywhere, canvas rendering of the graph, CDN font loading, a global graph button in the panel head, lede text under the hero, 2px card radii, a stacked single-column tier IA, uppercase node labels.

## 1. The page

"Practice Map" is a page in a dark-ink developer portfolio (React 19 + TypeScript + Vite; IBM Plex Sans display/prose, IBM Plex Mono chrome; custom props `--ink-*`; `--panel-radius: 20px`). Owner's mental model: an archive of AI outputs that teach stuff, arranged as a playground of models — five "tiers", each tier = one AI model (`astra-6-max`, `fable-5.1-high`, `astra-6-medium`, `fable-5.1-low`, `opus-4.8-thinking`). A two-column layout: left = tier list (model rows with lesson counts + a sample lesson title), right = search input + ⌘K pill above a panel. The panel lists the active tier's lesson cards (numbered topline `01`, sans h3 title, muted summary paragraph, mono concept chips, foot pill "open lesson →"). The big "thinking" tier (20 lessons) instead shows 5 folder faces; clicking a face ENTERS the volume — the panel switches to that volume's cards under a breadcrumb row (tiny mono back link "← opus-4.8-thinking" + bold volume title). Lesson cards open a fullscreen lesson reader (out of scope). A separate fullscreen "concept graph" overlay exists at page level (draggable concept nodes on a canvas + a readout). A command palette (⌘K) jumps to tiers/lessons.

Established laws you must not break:
- Lowercase mono chrome for all controls; the pill control family = 999px corners (owner-liked). Panels/cards use `--panel-radius` (20px).
- Lesson-card concept chips follow the repo chip law (n196, already implemented): ≤10 concepts all shown, ≥11 capped at 8 + "+N more"/"fewer" toggle.
- Tier order = data order; all counts computed from data; Linux volumes pre-split 4/3/6/4/3 in the data.
- Overlay key ownership: while a lesson or graph overlay is open, the overlay owns every key (the page-level key handler must keep skipping); the palette owns ⌘K/Esc while open.
- `prefers-reduced-motion` block kills transitions/animations — don't defeat it.
- Browser check (orchestrator-owned) drives `.pg-card`, `.pg-card .pg-pill` (the "open lesson" control), `.pg-crumb-back`, `.pg-face-head`, `.pg-tier-row` and — today — `.practice-graph-open` (hero button, dies in this task). Keep `.pg-crumb-back` as the back control's class and keep `.pg-pill` unique to the card's "open lesson" control; give the new card-level graph control its own class and name it in your output. Test retargeting is the orchestrator's job.
- Viewport matrix to hold without horizontal overflow: 1440, ~1024, ≤700 (single column: tier list → search → panel), 560, 390, 320.
- No changes outside the listed regions; `curriculum.ts`, `LessonOverlay` internals, `Palette.tsx` untouched. Do not change input font sizes (pre-existing iOS behavior, out of scope).

## 2. The owner's eight asks (verbatim, then the working interpretation)

1. *"Hero text — Update to: 'Archive of AI outputs teaching stuff.'"* → the h1 copy changes. The two-line lowercase shape (second line in accent-bright) is liked treatment; you decide the line split (e.g. "archive of ai outputs" / "teaching stuff."). The register stays lowercase (the h1 is CSS-lowercased). Mind the headline clamp: `clamp(1.15rem, calc((100vw - 72px) / 22), 3.2rem)` was tuned for short lines ("model by model." = 15 chars); the new copy is much longer — decide whether the divisor needs adjusting so the band still holds two lines at desktop widths.
2. *"Model labels — Tier indicators (e.g., 'max,' 'high') are already embedded in the model names. Remove them from the labels to eliminate redundancy and reclaim the extra row of space they introduce."* → every band badge (`.pg-band`: "max/high/medium/low/thinking") dies — in the tier rows (where it sits as its own row under the name) AND in the panel head (beside the h2). Model names keep their suffixes (that's the data). Remember `.pg-band` also appears in the shared-chrome font selector group in tiers.css and has five `data-band` color rules.
3. *"Lesson cards — Descriptions are currently too dense. Apply a character or line limit to truncate preview text, and increase internal padding to give each card a cleaner, more readable layout."* → `.pg-card p` currently renders the FULL summary (often 5+ lines) with `min-height: 3.4em`; card padding is 24px desktop / 16px mobile. You choose the truncation mechanism (CSS line-clamp vs a char cap in TSX — mind that text is Russian, min-height interplay, and that the full text lives on inside the lesson reader, so the preview may simply truncate) and the new padding.
4. *"Folder navigation — The back action is undersized relative to the folder name, making it unintuitive. Increase its prominence, relabel it to something explicit like 'Go Back,' and reduce the folder name's font size to establish a clearer visual hierarchy."* → the crumb row inverts: the back control (today tiny mono ochre "← opus-4.8-thinking", font .72rem) becomes the row's dominant element, explicitly labeled with "go back" wording (keep the class `.pg-crumb-back`); the volume title `.pg-crumb-title` (today 1.15rem/600) steps DOWN below it. Decide what family the back control joins (pill button vs. scaled-up ochre link vs. other) and what the title steps down to.
5. *"Hero section — Remove 'Explore Concept Graph' from the hero area. Reposition it as a button within each lesson card, adjacent to 'Open Lesson,' linking to that lesson's individual concept graph."* → the hero rail (`.practice-map-hero-note`: the graph button + the Russian hint "граф понятий собирается отдельно") is removed outright — the hero becomes the headline card alone, full-width; related CSS and the ≤900 hero rules die with it. Every lesson card's foot gains a graph control beside "open lesson →" that opens the ConceptGraph overlay focused on that lesson. Every card qualifies (concepts exist regardless of whether `topic.lesson` does); you decide the exact label/arrow language in the mono-chrome register.
6. *"For mobile — Section spacing — Margins and padding between sections are disproportionately generous. Tighten them to align with the site's minimalist design language and ensure a more cohesive visual rhythm."* → the ≤900 / ≤700 / ≤560 blocks: hero stacked `min-height: 10.5rem` floor, hero gap 1.6rem, `.pg-layout` mobile `margin-top: 30px` / gap 22px, `.pg-card` mobile padding 16px, tier-row padding/min-height 64px, face-head padding/min-height — all re-tuned tighter; pick concrete values so the page reads as one quiet surface, not stacked islands, while tap targets that are ≥44px stay ≥44px.
7. *"Model cards — The card list is visually heavy and oversized. Reduce its scale and visual weight to feel more restrained and consistent with the rest of the interface."* → orchestrator reading: this is the tier LIST (the model entries in the left column — name 1.15rem/600, the band line, count, sample line, generous padding) reading as oversized cards. Compose it with ask 2 (badge removal already reclaims a row): shrink the name step, tighten padding, quiet the sample. If, weighing the full context, you read "model cards" as something else, decide and state your reading in one Reasoning line — do not ask.
8. *"search bar should have rounded corners (i. e. be consistent with design language)."* → root cause known: `.pg-search input` and `.pg-pill` reference `var(--pill-radius)`, which is UNDEFINED in the repo CSS (the design artifact defined `--pill-radius: 999px`; the port aliased only `--panel-radius`) — so those corners render square today. Define `--pill-radius: 999px` on `.practice-map-field` (beside the existing `--panel-radius: 20px`) and audit every `var(--pill-radius)` use in the files below.

## 3. Current state verbatim (only these regions may change)

### R1 — web/PracticeMapPage.tsx — page wiring + render region (current)

```tsx
  const jump = useCallback((tierId: string, topicId: string | null) => {
    setActiveTierId(tierId);
    const tier = TIERS.find((t) => t.id === tierId);
    if (topicId && tier?.volumes) {
      const vol = tier.volumes.find((v) => v.topicIds.includes(topicId));
      setActiveVolume(vol ? vol.name : null);
    } else {
      setActiveVolume(null);
    }
    setQuery("");
    flashThenClear(topicId);
  }, []);

  const openTopic = openLessonId ? topicsById[openLessonId] : null;
  const openTopicIndex = openTopic
    ? tierTopics.findIndex((entry) => entry.id === openTopic.id)
    : -1;

  return (
    <div className="practice-map-field">
      <section className="practice-map-page section-shell" aria-labelledby="practice-map-title">
        <p className="pg-kicker">
          playground · {TIERS.length} models · {curriculum.reduce((n, area) => n + area.topics.length, 0)} lessons
        </p>

        <header className="practice-map-hero">
          <h1 id="practice-map-title">
            tier by tier.
            <span>model by model.</span>
          </h1>
          <div className="practice-map-hero-note">
            <button className="practice-graph-open" type="button" onClick={() => setGraphOpen(true)}>
              explore concept graph <span aria-hidden="true">↗</span>
            </button>
            <p className="pg-hint">граф понятий собирается отдельно</p>
          </div>
        </header>

        <div className="pg-layout">
          <TierList
            tiers={TIERS}
            activeTierId={activeTier?.id ?? ""}
            onSelect={(tierId) => {
              setActiveTierId(tierId);
              setActiveVolume(null);
            }}
            lessonCount={lessonCount}
            sampleTitle={sampleTitle}
          />
          {activeTier && (
            <TierPanel
              tier={activeTier}
              topics={tierTopics}
              query={query}
              onQueryChange={setQuery}
              activeVolume={activeVolume}
              onEnterVolume={setActiveVolume}
              onExitVolume={() => setActiveVolume(null)}
              onOpenLesson={setOpenLessonId}
              flashTopicId={flashTopicId}
              onOpenPalette={() => setPaletteOpen(true)}
            />
          )}
        </div>

        {graphOpen && <ConceptGraph onClose={() => setGraphOpen(false)} />}

        {paletteOpen && (
          <Palette
            open
            onClose={() => setPaletteOpen(false)}
            onJump={jump}
            items={paletteItems}
          />
        )}

        {openTopic && openTopic.lesson && (
          <LessonOverlay
            index={openTopicIndex}
            topic={openTopic}
            status={state.topics[openTopic.id].status}
            onStatusChange={(status) => setState(setTopicStatus(state, openTopic.id, status))}
            onClose={() => setOpenLessonId(null)}
          />
        )}

        <footer className="practice-map-footer">
          <span>local notes · no account</span>
          <span className="practice-map-footer-meta">
            <span>{summary.queued} queued</span>
            <button
              className="practice-map-reset"
              type="button"
              onClick={() => {
                if (window.confirm("Reset all statuses, feedback, and notes?")) {
                  setState(createInitialState(curriculum));
                }
              }}
            >
              reset progress
            </button>
          </span>
        </footer>
      </section>
    </div>
  );
}
```

(For orientation — identifiers defined above this region, unchanged unless your design needs one: state `graphOpen` (line 75), `topicsById` id→TopicCard map (83–89), `activeTier` (91), `tierTopics` = tier topics with tier-wide 1-based `index` (92–95), `lessonCount`/`sampleTitle` (97–105), `paletteItems` (107–131, uses `tier.band`), `flashThenClear` (133–139). `TopicCardDefinition` (the TopicCard type) is already imported at the top of the file — no new type import needed.)

### R2 — web/PracticeMapPage.tsx — key-ownership effect (current)

```tsx
  // Global chrome: cmd/ctrl+K toggles the palette; Esc leaves the volume view
  // when the palette is closed (the palette owns its own Esc while open).
  // While a lesson or graph overlay is up, the overlay owns every key — the
  // palette stays out of its way and Esc does not exit the volume beneath.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (openLessonId || graphOpen) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (event.key === "Escape" && !paletteOpen && activeVolume) {
        setActiveVolume(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, activeVolume, openLessonId, graphOpen]);
```

### R3 — web/lib/tiers/TierList.tsx (current, full file)

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
            <span className="pg-tier-name">
              {tier.name}
              <span className="pg-band" data-band={tier.band}>
                {tier.band}
              </span>
            </span>
            <span className="pg-tier-count">{plural(lessonCount(tier.id), "lesson")}</span>
            <span className="pg-tier-sample">{sampleTitle(tier.id)}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

### R4 — web/lib/tiers/TierPanel.tsx (current, full file)

```tsx
import { useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import type { TierBand, TopicCard, Volume } from "./tiers";
import { pad, plural } from "./tiers";

// {id,name,band} per the contract, plus `volumes` — required to render folder
// faces, since `topics` arrives flat. Page passes it straight off the Tier.
export type TierInfo = { id: string; name: string; band: TierBand; volumes?: readonly Volume[] };
export type TierTopic = TopicCard & { index: number };

type TierPanelProps = {
  tier: TierInfo;
  topics: readonly TierTopic[];
  query: string;
  onQueryChange: (q: string) => void;
  activeVolume: string | null;
  onEnterVolume: (name: string) => void;
  onExitVolume: () => void;
  onOpenLesson: (topicId: string) => void;
  flashTopicId: string | null;
  onOpenPalette: () => void;
};

function Card({
  topic,
  isFlash,
  onOpenLesson,
}: {
  topic: TierTopic;
  isFlash: boolean;
  onOpenLesson: (topicId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Repo law (n196): <=10 concepts all shown with no expander, >=11 capped
  // at 8 + toggle — same grace band as the previous card.
  const cap = 8;
  const shouldCap = topic.concepts.length > cap + 2;
  const shown = shouldCap && !expanded ? topic.concepts.slice(0, cap) : topic.concepts;
  const hiddenCount = topic.concepts.length - cap;

  return (
    <article className={`pg-card${isFlash ? " is-flash" : ""}`} data-topic-id={topic.id}>
      <div className="pg-topline">
        <span>{pad(topic.index)}</span>
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.summary}</p>
      <div className="pg-chips">
        {shown.map((c) => (
          <span key={c} className="pg-chip">
            {c}
          </span>
        ))}
        {shouldCap && (
          <button
            type="button"
            className="pg-chip is-more"
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "fewer" : `+${hiddenCount} more`}
          </button>
        )}
      </div>
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

export function TierPanel({
  tier,
  topics,
  query,
  onQueryChange,
  activeVolume,
  onEnterVolume,
  onExitVolume,
  onOpenLesson,
  flashTopicId,
  onOpenPalette,
}: TierPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);

  const byId = new Map<string, TierTopic>(topics.map((t) => [t.id, t]));
  const q = query.trim().toLowerCase();
  const hit = (t: TierTopic): boolean => !q || (t.title + " " + t.summary).toLowerCase().includes(q);

  useEffect(() => {
    if (!flashTopicId) return;
    const el = panelRef.current?.querySelector<HTMLElement>(`[data-topic-id="${flashTopicId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [flashTopicId, activeVolume, query]);

  const emptyLine = <p className="pg-empty">no lessons match “{query.trim()}”</p>;
  const volumes = tier.volumes;

  let panelBody: ReactNode;

  if (volumes && activeVolume) {
    const vol = volumes.find((v) => v.name === activeVolume);
    const tps = vol ? vol.topicIds.map((id) => byId.get(id)).filter((t): t is TierTopic => Boolean(t)) : [];
    const vis = tps.filter(hit);
    panelBody = (
      <>
        <div className="pg-crumb">
          <button className="pg-crumb-back" type="button" onClick={onExitVolume}>
            ← {tier.name}
          </button>
          <span className="pg-crumb-title">{activeVolume}</span>
        </div>
        {vis.length ? (
          <div className="pg-cards">
            {vis.map((tp) => (
              <Card
                key={tp.id}
                topic={tp}
                isFlash={tp.id === flashTopicId}
                onOpenLesson={onOpenLesson}
              />
            ))}
          </div>
        ) : (
          emptyLine
        )}
      </>
    );
  } else {
    const head = (
      <div className="pg-tier-head">
        <h2>{tier.name}</h2>
        <span className="pg-band" data-band={tier.band}>
          {tier.band}
        </span>
      </div>
    );

    if (volumes) {
      const faces = volumes
        .map((v) => {
          const tps = v.topicIds.map((id) => byId.get(id)).filter((t): t is TierTopic => Boolean(t));
          const vis = tps.filter(hit);
          if (q && !vis.length) return null;
          const peek = tps.slice(0, 3);
          return (
            <section className="pg-face" key={v.name}>
              <button
                className="pg-face-head"
                type="button"
                aria-label={`enter ${v.name}`}
                onClick={() => onEnterVolume(v.name)}
              >
                <span className="pg-face-top">
                  <span className="pg-face-label">{v.name}</span>
                  <span className="pg-face-count">· {plural(tps.length, "lesson")}</span>
                  <span className="pg-face-mark">→</span>
                </span>
                <ul className="pg-peek">
                  {peek.map((tp) => (
                    <li key={tp.id}>{tp.title}</li>
                  ))}
                </ul>
              </button>
            </section>
          );
        })
        .filter((x): x is ReactElement => x !== null);

      panelBody = (
        <>
          {head}
          {faces.length ? <div className="pg-faces">{faces}</div> : emptyLine}
        </>
      );
    } else {
      const vis = topics.filter(hit);
      panelBody = (
        <>
          {head}
          {vis.length ? (
            <div className="pg-cards">
              {vis.map((tp) => (
                <Card
                  key={tp.id}
                  topic={tp}
                  isFlash={tp.id === flashTopicId}
                  onOpenLesson={onOpenLesson}
                />
              ))}
            </div>
          ) : (
            emptyLine
          )}
        </>
      );
    }
  }

  return (
    <>
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
      <section className="pg-tier-panel" aria-live="polite" ref={panelRef}>
        {panelBody}
      </section>
    </>
  );
}
```

### R5 — web/lib/tiers/tiers.css (current, full file)

```css
/* tiers.css — ported from the approved artifact (R003).
   Scope repairs for the repo: the artifact's :root token block becomes a
   .practice-map-field var alias block (the shell owns the real values);
   global resets (box-sizing/html/body/::selection) are dropped; the hero
   (.pg-hero/.pg-head/.pg-rail) and the field/page shells stay in
   practice-map.css, which already carries the same geometry. */

/* ---------- shared chrome ---------- */
.pg-kicker,.pg-band,.pg-tier-count,.pg-pill,.pg-chip,
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

/* ---------- 2. layout ---------- */
.pg-layout{
  margin-top:40px; display:grid; gap:28px 30px;
  grid-template-columns:minmax(0,0.92fr) minmax(0,1.28fr);
  grid-template-areas:"list search" "list panel";
  align-items:start;
}

/* tier list — mirror of .practice-area-list */
.pg-tier-list{grid-area:list; margin-top:1rem}
.pg-tier-row{
  width:100%; display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:start;
  gap:1rem; padding:.8rem .9rem; text-align:left;
  border:1px solid transparent; border-bottom-color:var(--ink-line-soft);
  border-radius:var(--panel-radius);
  background:transparent; color:rgba(238,234,224,.68); cursor:pointer;
  transition:border-color 180ms ease, color 180ms ease, background 180ms ease;
}
.pg-tier-row:hover,
.pg-tier-row.is-active{border-color:var(--ink-line); color:var(--ink-text); background:rgba(211,155,97,.09)}
.pg-tier-name{
  display:grid; gap:.35rem; min-width:0;
  font-family:var(--sans); font-size:1.15rem; font-weight:600;
  letter-spacing:0; line-height:1.1; color:inherit; text-transform:none;
}
.pg-band{
  font-family:var(--mono); font-size:.74rem; letter-spacing:.04em;
  text-transform:lowercase; white-space:nowrap;
}
.pg-band[data-band=max]{color:var(--ink-accent-bright)}
.pg-band[data-band=high]{color:var(--ink-accent)}
.pg-band[data-band=medium]{color:rgba(238,234,224,.70)}
.pg-band[data-band=low]{color:var(--ink-faint)}
.pg-band[data-band=thinking]{color:var(--ink-accent-deep)}
.pg-tier-count{
  font-family:var(--mono); font-size:.74rem; color:var(--ink-accent);
  justify-self:end; white-space:nowrap;
}
.pg-tier-sample{
  grid-column:1 / -1; font-size:.74rem; line-height:1.4; color:var(--ink-faint);
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

/* ---------- 3. tier panel ---------- */
.pg-tier-panel{grid-area:panel; min-width:0}
.pg-tier-head{
  display:flex; align-items:center; gap:.8em; flex-wrap:wrap;
  padding-bottom:1rem; margin-bottom:1.1rem; border-bottom:1px solid var(--ink-line-soft);
}
.pg-tier-head h2{
  margin:0; font-family:var(--sans); font-weight:600;
  text-transform:none; letter-spacing:0; font-size:1.15rem; line-height:1.1; color:var(--ink-text);
}
.pg-cards{display:flex; flex-direction:column; gap:.9rem}
.pg-card{
  border:1px solid var(--ink-line-soft); border-radius:var(--panel-radius);
  padding:24px; background:#0b1317; min-width:0;
  transition:transform 180ms ease-out, box-shadow 180ms ease-out, background 180ms ease-out;
}
.pg-card:hover{transform:translateY(-6px); box-shadow:0 18px 40px rgba(0,0,0,.32); background:#0f171c}
.pg-card.is-flash{border-color:var(--ink-accent)}
.pg-topline{
  display:flex; align-items:center; justify-content:space-between; gap:1rem;
  color:var(--ink-accent); font-family:var(--mono); font-size:12px; font-weight:500;
  letter-spacing:.02em;
}
.pg-card h3{
  margin:0; font-family:var(--sans);
  font-size:clamp(20px,1.6vw,24px); font-weight:700; line-height:1.2; color:var(--ink-text);
}
.pg-card p{margin:0; color:var(--ink-muted); font-size:14px; line-height:1.5; min-height:3.4em}
.pg-chips{display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.9rem}
.pg-chip{
  border:1px solid var(--ink-line-soft); padding:.28rem .4rem; color:var(--ink-faint);
  font-family:var(--mono); font-size:.68rem; letter-spacing:.03em; text-transform:lowercase;
}
.pg-chip.is-more{
  color:var(--ink-faint); background:none; cursor:pointer;
  text-decoration:underline; text-decoration-color:rgba(238,234,224,.29); text-underline-offset:2px;
}
.pg-card-foot{margin-top:.9rem}
.pg-card-foot .pg-pill{
  display:inline-flex; align-items:center; gap:.5rem; justify-self:start;
  border:1px solid var(--ink-line-soft); border-radius:999px; padding:.45rem .7rem;
  color:var(--ink-accent); background:transparent; cursor:pointer;
  font-family:var(--mono); font-size:.72rem; letter-spacing:.04em; text-transform:lowercase;
  transition:border-color 180ms ease, color 180ms ease, background 180ms ease, gap 180ms ease;
}
.pg-card-foot .pg-pill:hover{gap:.75rem; border-color:var(--ink-accent); color:var(--ink-accent-bright); background:var(--ink-panel)}

/* ---------- 4. folders ---------- */
.pg-faces{display:flex; flex-direction:column; gap:1.1rem}
.pg-face{position:relative; border:1px solid var(--ink-line-soft); border-radius:var(--panel-radius); background:#0b1317}
.pg-face::before{
  content:''; position:absolute; top:-9px; left:20px; width:92px; height:10px;
  border:1px solid var(--ink-line-soft); border-bottom:0; border-radius:9px 9px 0 0;
  background:#101a1f;
}
.pg-face-head{
  width:100%; text-align:left; background:transparent; border:0; color:inherit; cursor:pointer;
  padding:16px 20px; display:block; min-height:56px; border-radius:var(--panel-radius);
}
.pg-face-top{display:flex; align-items:baseline; gap:.7em; flex-wrap:wrap}
.pg-face-label{font-family:var(--sans); font-size:1rem; font-weight:600; color:var(--ink-text); text-transform:none}
.pg-face-count{font-family:var(--mono); font-size:.64rem; color:var(--ink-faint)}
.pg-face-mark{margin-left:auto; font-family:var(--mono); font-size:.66rem; color:var(--ink-faint)}
.pg-peek{margin:.7em 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:5px}
.pg-peek li{
  font-size:.8rem; line-height:1.45; color:var(--ink-faint); padding-left:16px; position:relative;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.pg-peek li::before{content:'—'; position:absolute; left:0; color:var(--ink-line)}
.pg-empty{font-size:.7rem; color:var(--ink-faint); padding:12px 2px; font-family:var(--mono); letter-spacing:.04em; text-transform:lowercase}

/* ---------- 4b. volume-view crumb ---------- */
.pg-crumb{
  display:flex; align-items:baseline; gap:.9em; flex-wrap:wrap;
  padding-bottom:1rem; margin-bottom:1.1rem; border-bottom:1px solid var(--ink-line-soft);
}
.pg-crumb-back{
  border:0; background:none; cursor:pointer; color:var(--ink-accent);
  font-family:var(--mono); font-size:.72rem; letter-spacing:.04em; text-transform:lowercase;
  padding:0;
  transition:color 180ms ease;
}
.pg-crumb-back:hover{color:var(--ink-accent-bright)}
.pg-crumb-title{
  font-family:var(--sans); font-size:1.15rem; font-weight:600;
  line-height:1.1; color:var(--ink-text);
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

/* ---------- 6. mobile ---------- */
@media (max-width:700px){
  .pg-layout{margin-top:30px; grid-template-columns:1fr; grid-template-areas:"list" "search" "panel"; gap:22px}
  .pg-tier-row{grid-template-columns:1fr; padding:16px 12px; min-height:64px}
  .pg-tier-count{justify-self:start}
  .pg-card{padding:16px}
  .pg-face-head{padding:18px 16px; min-height:64px}
  .pg-pal{top:0; left:0; transform:none; width:100%; border-radius:0 0 var(--panel-radius) var(--panel-radius); border-left:0; border-right:0; border-top:0}
  .pg-pal-list{max-height:64vh}
}
```

### R6 — web/practice-map.css — hero band blocks (current)

```css
.practice-map-page {
  padding-top: clamp(1.95rem, 3.25vw, 2.9rem);
  padding-bottom: 6rem;
  font-family: var(--sans);
}
```

```css
.practice-map-hero {
  /* One full-width unit: the copy card fills the left run (text stays
     left-aligned inside it), the rail caps at 320px flush to the right
     corner — no dead field after it. minmax(0,…) on both tracks keeps
     min-width:auto from overflowing. */
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 320px);
  gap: clamp(0.8rem, 1.95vw, 1.6rem);
}

/* Copy panel — the .signal-index-hero-copy language (Reference 3): flat scrim,
   soft hairline, ochre-deep left rule, rounded to the shared panel radius. */
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
  font-size: clamp(1.15rem, calc((100vw - 72px) / 22), 3.2rem);
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

/* Rail panel — the .signal-index-beneath language (Reference 5): heavier 0.78
   scrim so the mono chrome inside clears 4.5:1 over the grain-lit ink. */
.practice-map-hero-note {
  display: grid;
  justify-items: start;
  gap: 1rem;
  /* Rail content rides centered in its equal-height track (F006/R003):
     the pill + hint hug the middle, no dead top/bottom runs. */
  align-content: center;
  padding: clamp(1.05rem, 2vw, 1.55rem) 1.25rem clamp(1.2rem, 2.2vw, 1.7rem);
  background: rgba(9, 15, 18, 0.78);
  border: 1px solid var(--ink-line-soft);
  border-radius: var(--panel-radius);
}

.practice-graph-open {
  border: 1px solid var(--ink-line-soft);
  padding: 0.5rem 0.7rem;
  color: var(--ink-accent);
  background: transparent;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: lowercase;
  transition: border-color 180ms ease, color 180ms ease, background 180ms ease;
}

.practice-graph-open:hover {
  border-color: var(--ink-accent);
  color: var(--ink-accent-bright);
  background: var(--ink-panel);
}
```

And the narrow-viewport hero rules in the same file:

```css
/* Hero-only collapse at 900px: below it the copy card + 320px rail + gap
   no longer hold two columns (the copy card needs ~300px of text room). */
@media (max-width: 900px) {
  .practice-map-hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.6rem;
  }

  /* Stacked rows are independent tracks, so the rail's height cannot
     propagate to the copy card. One shared floor (border-box) pins BOTH
     cards to it — the rail's natural height breathes a few px with the
     route meter's width, and the floor absorbs that drift. Text stays
     vertically centered in both cards. */
  .practice-map-hero h1,
  .practice-map-hero-note {
    min-height: 10.5rem;
  }

  /* Stacked = full-width card: keep the headline proportionate to the
     card, not to the viewport formula above (which undersizes it between
     561 and 900). */
  .practice-map-hero h1 {
    font-size: clamp(1.4rem, 7.2vw, 2.6rem);
  }
}
```

```css
@media (max-width: 560px) {
  .practice-map-page {
    padding-top: 1.6rem;
    padding-bottom: 4rem;
  }

  .practice-map-hero h1 { font-size: clamp(1.4rem, 7.2vw, 2rem); }
}
```

(For orientation: `.practice-map-field` carries `--panel-radius: 20px;` and the `--ink-*` token aliases; the `@media (max-width: 900px)` and `(max-width: 560px)` blocks shown are the ONLY hero-related media rules; other rules inside those blocks belong to surfaces you must not touch and stay as-is. Note the mobile spacing ask also covers `.pg-layout`/`.pg-tier-row`/`.pg-card`/`.pg-face-head` mobile values — they live in tiers.css, region R5.)

### R7 — web/PracticeMapPage.tsx — ConceptGraph anatomy (focus integration point)

The component is ~390 lines, portaled to `document.body`. Its state line outside R1's region — replace it there too: `const [graphOpen, setGraphOpen] = useState(false);` (line 75; you may reshape it — e.g. carry the focus topic — since the hero button that opened it without a topic is gone; the mount is `{graphOpen && <ConceptGraph onClose={() => setGraphOpen(false)} />}`, inside R1's region).

```tsx
function ConceptGraph({ onClose }: { onClose: () => void }) {
  // Full adjacency model, built once from the real curriculum: every concept
  // is ranked by unique co-occurrence neighbors; the map shows the top slice.
  const graphAll = useMemo(() => {
    const allTopics = curriculum.flatMap((area) => area.topics);
    const topicsByConcept = new Map<string, string[]>();
    const edges = new Map<string, Map<string, number>>();
    let maxWeight = 1;

    for (const topic of allTopics) {
      const unique = Array.from(new Set(topic.concepts));
      for (const c of unique) {
        const list = topicsByConcept.get(c);
        if (list) list.push(topic.title);
        else topicsByConcept.set(c, [topic.title]);
      }
      for (let i = 0; i < unique.length; i += 1) {
        for (let j = i + 1; j < unique.length; j += 1) {
          const a = unique[i];
          const b = unique[j];
          const am = edges.get(a) ?? new Map<string, number>();
          const bm = edges.get(b) ?? new Map<string, number>();
          const w = (am.get(b) ?? 0) + 1;
          am.set(b, w);
          bm.set(a, w);
          edges.set(a, am);
          edges.set(b, bm);
          if (w > maxWeight) maxWeight = w;
        }
      }
    }

    // Rank by topic span — how many distinct topics a concept appears in —
    // so the map shows the ideas that connect the curriculum across topics.
    // A single lesson's internal vocabulary (many concepts co-occurring in
    // one card) cannot outrank that; ties: weighted degree, then neighbor
    // count, then alphabetical.
    const ranked = Array.from(topicsByConcept.keys())
      .map((name) => {
        const neighborMap = edges.get(name) ?? new Map<string, number>();
        let weight = 0;
        for (const w of neighborMap.values()) weight += w;
        return {
          name,
          topics: topicsByConcept.get(name)?.length ?? 0,
          weight,
          degree: neighborMap.size,
        };
      })
      .sort((a, b) =>
        b.topics - a.topics || b.weight - a.weight || a.name.localeCompare(b.name),
      )
      .map((d) => d.name);

    return { topicsByConcept, edges, maxWeight, ranked };
  }, []);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
```

```tsx
  // Chip spacing is pixel-based, so the node count adapts to the canvas the
  // overlay actually gets: 28 ideas on a desktop canvas, fewer where chips
  // would otherwise bury each other.
  const layout = layoutParams(dims?.w ?? 834);
  const nodeCount = dims ? layout.count : 28;

  const graphModel = useMemo(() => {
    const rankedSet = new Set(graphAll.ranked.slice(0, nodeCount));
    const nodes = graphAll.ranked.slice(0, nodeCount).map((name) => {
      const neighborMap = graphAll.edges.get(name) ?? new Map<string, number>();
      const sorted = Array.from(neighborMap.entries())
        .map(([n, w]) => ({ name: n, weight: w }))
        .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
      const titles = graphAll.topicsByConcept.get(name) ?? [];
      const sideAll = sorted.filter((e) => !rankedSet.has(e.name));
      return {
        name,
        topicCount: titles.length,
        mapLinks: sorted.filter((e) => rankedSet.has(e.name)),
        sideLinks: sideAll.slice(0, 4),
        sideLinkCount: sideAll.length,
        topicTitles: Array.from(new Set(titles)).slice(0, 3),
      };
    });
    return {
      nodes,
      nodeByName: new Map(nodes.map((node) => [node.name, node])),
    };
  }, [graphAll, nodeCount]);

  // Re-seed whenever the measured canvas or the node set settles.
  useLayoutEffect(() => {
    if (!dims) return;
    setPositions(
      seedLayout(graphModel.nodes.map((n) => n.name), dims.w, dims.h, layoutParams(dims.w)),
    );
  }, [dims, graphModel]);
```

```tsx
  const activeNode = activeId ? graphModel.nodeByName.get(activeId) ?? null : null;

  const neighborSet = useMemo(() => {
    if (!activeNode) return new Set<string>();
    return new Set(activeNode.mapLinks.map((e) => e.name));
  }, [activeNode]);
```

The canvas (not shown: node buttons with % positions, pointer-drag handlers, edge SVG) renders `graphModel.nodes` as draggable buttons; Escape closes via `onClose`; the overlay locks body scroll. The portal skeleton:

```tsx
  return createPortal(
    <div
      className="practice-graph-overlay"
      role="presentation"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="practice-graph-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Concept graph"
      >
        <header className="practice-graph-header">
          <div>
            <span className="practice-lesson-kicker">system map</span>
            <h2>Concept constellation</h2>
          </div>
          <button
            ref={closeRef}
            className="practice-lesson-close"
            type="button"
            aria-label="Close concept graph"
            onClick={onClose}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>
```

And the readout block:

```tsx
        <div className="practice-graph-readout" aria-live="polite">
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
```

Critical constraint for the focus design: the canvas shows the TOP of the global ranking (concepts ranked by how many distinct topics they appear in — a concept living in one lesson ranks near the bottom and is NOT on the canvas). A lesson's own concepts are mostly single-lesson vocabulary, so a pure "preselect activeId" would select a node that isn't rendered. The focused view therefore needs a node set that contains the lesson's concepts — the algebra is settled in §0 (lessonFocus: seeds + up to 2 strongest neighbors each); your remaining choices are the layout option (A/B in §0) and the exact control label. One open → one coherent view; Escape and the close X keep closing; the header/readout makes the source lesson evident. `TopicCard` shape: `{ id, title, summary, concepts: string[], practicePrompt, checkPrompt, lesson?, deepLesson?, examples? }` (concepts = the lesson's vocabulary chips).

### R8 — web/practice-map.css — graph readout block (current)

```css
.practice-graph-readout {
  margin-top: 0.9rem;
  min-height: 4.6rem;
  border-top: 1px solid var(--ink-line-soft);
  padding-top: 0.7rem;
  font-family: var(--mono);
  font-size: 0.7rem;
  line-height: 1.5;
}

.practice-graph-readout p { margin: 0; }

.practice-graph-readout-head {
  color: var(--ink-accent-bright);
}

.practice-graph-readout-links {
  margin-top: 0.2rem;
  color: var(--ink-text);
  word-break: break-word;
}

.practice-graph-readout-topics {
  margin-top: 0.2rem;
  color: var(--ink-muted);
}

.practice-graph-readout-empty {
  color: var(--ink-faint);
  text-transform: lowercase;
}

.practice-graph-footer {
  margin-top: 0.8rem;
  color: var(--ink-faint);
  font-family: var(--mono);
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: lowercase;
}
```

## 4. Method — deliberate before you write (required)

Before any code, produce the `## Reasoning` section:

1. Restate all eight asks in one line each — in your own words, proving you hold the whole batch.
2. Cross-ask map: name the shared surfaces (2+7 the tier rows; 3+5 the card foot; 5+6 the hero and mobile rhythm; 2+4 the type hierarchy) and the order you'll apply them so no ask undoes another.
3. For EACH ask, name ≥2 alternatives and pick one with a concrete reason. Minimum coverage:
   - (1) the line split for "archive of ai outputs teaching stuff." + whether the h1 clamp divisor changes;
   - (3) the truncation mechanism (CSS multi-line clamp vs char cap vs both) and what happens to `min-height: 3.4em`;
   - (4) the back control's family (a real pill-style button vs a scaled ochre link vs something else) and the title's step-down;
   - (5) the graph-focus design (what the overlay shows for one lesson, how the node set is built, what the header/readout says) and the card-foot layout with two controls;
   - (6) concrete tightened values (state the numbers you'll set, per block);
   - (7) the tier-row restyle (name size, padding, sample treatment).
4. Risk pass: for each ask, one line on what it could break (key-ownership effect in R2, chip law, test classes, reduced-motion, iOS zoom guard on inputs — the search input keeps its font-size).
5. Self-review against §5 before returning — see the `## Self-review` output section.

There is no approval gate and no option list to offer: pick, justify, ship.

## 5. Acceptance criteria (observable)

1. At 1440 the hero is one full-width headline card with the new copy ("archive of ai outputs teaching stuff." after lowercase); no rail card, no graph button, no Russian hint anywhere in the hero; no dead band geometry left behind.
2. Tier rows and the panel head show model names WITHOUT band badges; `.pg-band` markup and rules are gone; the freed row space collapses (rows visibly tighter).
3. Every lesson card: summary truncated (≤2 lines, ellipsized — mechanism settled in §0); padding larger than today's 24px/16px; the foot holds "open lesson →" AND a graph control side by side, with distinct classes (`.pg-pill` stays unique to "open lesson"); the graph control opens the concept-graph overlay focused on that lesson — the overlay's title/readout names the source lesson, the lesson's concepts are present as nodes, and the readout area carries the §0 ranked list.
4. Volume view: the back control is the crumb row's dominant element, reads "go back" (its mono-lowercase register may casing-wise render as "go back"), keeps class `.pg-crumb-back`; the volume title renders smaller than today and clearly subordinate.
5. `.pg-search input` and the ⌘K `.pg-pill` render with 999px pill corners via a defined `--pill-radius` token on `.practice-map-field`.
6. At ≤900/≤700/≤560/390/320: visibly tighter section spacing (hero floor reduced or gone, smaller margins/gaps); no horizontal overflow at 320 and 390; previously ≥44px tap targets stay ≥44px.
7. Laws intact: chip law untouched (n196 logic in Card), lowercase mono chrome, `--panel-radius` unchanged, reduced-motion block untouched, and the R2 effect still skips while a lesson or graph overlay is open (now with the graph opened per-lesson, incl. the graph overlay's own Escape behavior).
8. Nothing outside the listed regions changed; no changes to `curriculum.ts`, `LessonOverlay` internals, `Palette.tsx`.

## 6. Output contract (exactly this shape)

```
## Reasoning
<per §4: restatement, cross-ask map, per-ask alternatives + picks, risk pass>

## Changes
### R1 — web/PracticeMapPage.tsx (page wiring + render region)
<complete new text for every changed rule/region; name every deletion>

### R2 — web/PracticeMapPage.tsx (key-ownership effect)
<complete new text; only if you change it>

### R3 — web/lib/tiers/TierList.tsx (full file)
<complete new file content>

### R4 — web/lib/tiers/TierPanel.tsx (full file)
<complete new file content>

### R5 — web/lib/tiers/tiers.css (full file)
<complete new file content>

### R6 — web/practice-map.css (hero band blocks + media)
<complete new rule text; name every deletion>

### R7 — web/PracticeMapPage.tsx (ConceptGraph focus)
<new/changed signatures + complete new/changed regions only; state the exact insert points and the final class name of the card-level graph control>

### R8 — web/practice-map.css (graph readout block)
<complete new rule text for the readout block incl. the §0 ranked list>

## Self-review
<checklist: each of the 8 acceptance criteria, pass/fail judged against your own produced code, one line each>

## Notes
<optional, ≤5 lines: out-of-scope observations only — no code>
```

Rules: replace regions wholesale (the orchestrator splices them into the files); keep the files' comment voice; no comments narrating the change — only a short comment where a non-obvious constraint genuinely needs one. TypeScript must compile (strict): mind unused imports/vars after removals.
