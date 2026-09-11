# BRIEF — practice-map: tag overflow on the four deep-lesson cards

Fresh context per relay — everything you need is here. **You have full autonomy over every design and code decision in this task** (cap number, expander affordance/copy, semantics, state placement) — make decisions and state them as decisions; do not ask for approval or ask questions; mark genuinely uncertain choices as assumptions. **Reply: condensed reasoning FIRST, then terse deliverable.**

## Reasoning protocol (do this before writing the deliverable)

Work through a full deliberation, then show it condensed (≤14 lines total):

1. **Success criterion** — one line: what does "fixed" mean for the owner looking at the page.
2. **Alternatives** — ≥3 design directions (invent your own beyond: view-side chip cap with expander; data-side trim of `concepts`; CSS max-height/scroll inside the card). For each: the tradeoff and its most likely failure mode.
3. **Choice** — which direction you commit to and the concrete reason it beats the others.
4. **Edge sweep** — cards exactly at / just over the cap; expanded state across re-renders and filter/search changes; one-chip overflow; mobile single-column; keyboard + screen-reader semantics; long single-token chips; interaction with the "open lesson" button position.
5. **Self-critique** — the two most likely ways your change breaks on a real device, and how your final diff already covers them.

## Owner bug (verbatim)

> Tag overflow in lesson nodes: The lessons for "Go," "Rust," "Symphony," and "Laravel" display too many tags.

"Symphony"/"Laravel" is ONE area titled "Symfony и Laravel" — one shared card. The page is a study-practice map: four areas (Go, Linux, Rust, Symfony+Laravel); the three deep-lesson areas have exactly one large card each.

## Facts you need

- `concepts` counts per deep card: Go 30, Rust 55, Symfony+Laravel 75. The ~20 Linux cards have ~3–8 each and look right — do not regress them.
- Chips render from `topic.concepts` in `.practice-concepts` (flex-wrap; chips are bordered mono lowercase spans).
- `concepts` has two hidden consumers you must not degrade: (a) the search corpus — `[topic.title, topic.summary, ...topic.concepts].join(" ").toLowerCase()`; (b) the concept-graph overlay builds an adjacency model from concept co-occurrence across all topics, ranked by topic span. Trimming the DATA would degrade both; the bug is presentation, not content. (You still own the call — but weigh this.)
- Topic cards sit in a 2-column grid (1-column ≤700px); each card is `display:flex; flex-direction:column; gap:0.9rem` so the chip block's height directly pushes everything below it.
- Voice of this UI: dark "ink catalogue" — mono, lowercase, 1px `--ink-line-soft` borders, no new decoration; anything you add must look native to the existing chips.
- Existing gates (I run them, you can't): `tsc` strict, `vite build`, and a puppeteer check driving the page (console errors, horizontal overflow, overlays). It has no gate on chip counts.

## Verbatim current code

`PracticeMapPage.tsx` — inside `TopicCard` (a function component that already does `const [lessonOpen, setLessonOpen] = useState(false);`; `topic` is `TopicCardDefinition`, whose `concepts: readonly string[]` is immutable — do not mutate):

```tsx
      <h3>{topic.title}</h3>
      <p className="practice-topic-summary">{topic.summary}</p>

      <div className="practice-concepts" aria-label="Concepts">
        {topic.concepts.map((concept) => <span key={concept}>{concept}</span>)}
      </div>

      {topic.lesson && (
        <button className="practice-lesson-open" type="button" onClick={() => setLessonOpen(true)}>
          open lesson
          <span aria-hidden="true">→</span>
        </button>
      )}
```

`practice-map.css`:

```css
.practice-concepts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.practice-concepts span {
  border: 1px solid var(--ink-line-soft);
  padding: 0.28rem 0.4rem;
  color: var(--ink-faint);
  font-family: var(--mono);
  font-size: 0.68rem;
  letter-spacing: 0.03em;
  text-transform: lowercase;
}
```

## Constraints

- Scope: `PracticeMapPage.tsx` (the `TopicCard` component) and `practice-map.css` only. No new files, deps, or persistence (progress localStorage stores statuses/notes/feedback only — an expander state stays session-local unless you argue otherwise).
- `curriculum.ts` stays untouched unless you state a strong data-side reason; if you trim data anyway, search + graph must keep working identically.
- Accessible: the expander is a real `<button type="button">` with correct `aria-expanded` (and whatever else you judge needed); expanded chips remain in one logical region.
- No re-architecture; no scroll containers inside cards; no animation beyond what the system already uses (any transition must be gated to `prefers-reduced-motion: no-preference` and be subtle).

## Deliverable (terse, after the reasoning)

1. `COMMITTED:` one line.
2. `BLOCKS:` each change as **verbatim current → verbatim replacement** (JSX and/or CSS); keep blocks minimal and drop-in (I paste them directly — the model's prior guess-mistakes on paths/wrappers get caught here, so be exact).
3. `GATES:` only if an existing check gate must change (likely none).
4. `DEVICE CHECK:` one line for the owner (e.g. "open Go card: N chips + 'more' expander; Linux cards unchanged").
