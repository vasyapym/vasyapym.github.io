# BRIEF — Practice Map: interactive reading (delete-as-you-read + shadow-typing) — DESIGN round

Fresh context per relay — everything you need is here. You are the design
specialist in a two-model relay. You cannot see the repository; this brief is
self-contained. The orchestrator owns all repo operations, integration, and
verification; the owner responds only to finished, rendered results.

**This round is DESIGN ONLY — no code deliverable.** Full design/code autonomy:
no per-decision approvals; you decide and record every call in the DECISIONS
section. What the owner requires instead is a **shown deep-reasoning chain**:

> restate → 5+ directions → prune with criteria → develop to depth →
> stress-test → rank → commit

Do not settle on the first plausible route. The owner has observed that quick,
superficial answers lower quality; thoroughness is the deliverable of this
round. But thoroughness is not padding — every sentence must earn its place.

## Owner report (verbatim)

> "Add interactive reading to Practice Map. I concentrate better when I can
> delete text I've already read and shadow-type it, instead of only reading
> passively. That's why I read in editor apps rather than static pages. Add
> this capability to the Practice Map project."

## What Practice Map is

A study tracker inside a personal portfolio (React 19 + TypeScript strict +
Vite, no new dependencies). The page shows **areas → topic cards**. Cards with
a deep lesson open a full-screen **deep-lesson reader overlay** — that reader
is the surface this feature belongs to. Lesson bodies are Russian (long-form
essays, 10–23 sections); UI chrome is lowercase IBM Plex Mono English in an
"ink" dark design language (tokens `--ink-*`, hairline borders, panel radius
20px, ochre accents, no blur/glow).

Current data (the `curriculum` export, array of `PracticeArea`):

| area id | title | topics | deep lessons (sections) |
|---|---|---|---|
| go | Go | 1 | 1 deep: `go-zero-to-depth` (19) |
| linux | Linux | 20 | 5 deep: 10 / 11 / 10 / 14 / 1 sections |
| rust | Rust | 1 | 1 deep: 23 sections |
| php-frameworks | Symfony и Laravel | 1 | 1 deep: 23 sections |

Prose-unit statistics (a prose unit = one `p`-block or one callout text):

- go: 237 units, avg 85 chars (short structured blocks)
- linux: 260 units, avg 629 chars (long paragraphs, up to 1638 chars)
- rust: 425 units, avg 188 chars
- php-frameworks: 559 units, avg 138 chars

The owner reads these lessons on desktop and iPhone, often across several
sessions (a 19-section lesson is not one sitting).

## What the reader is today (DOM sketch)

```
.practice-lesson-overlay            fixed inset 0, z 60, backdrop click closes,
│                                   color-scheme: dark, portaled to <body>
└─ .practice-lesson-panel           role=dialog, width min(950px,100%), flex column,
   │                                overflow hidden — STATIONARY FRAME (never scrolls)
   ├─ .practice-lesson-header       kicker "lesson NN · c/5", h2 title, close ✕ button
   └─ .practice-lesson-scroll       keyed by topic.id; the ONLY scroller (overflow-y auto);
      │                             webkit scrollbar pseudos (8px lane, translucent thumb);
      │                             NO standard scrollbar-width/color properties
      ├─ .practice-lesson-progress > span     sticky top hairline, scaleX(scroll progress)
      ├─ .practice-lesson-objectives          optional list
      ├─ nav.practice-reader-nav              one chip per section (kbd number + heading);
      │                                       click → smooth scroll; scrollspy sets aria-current
      ├─ .practice-reader
      │  └─ section.practice-reader-section [data-section-index] × N
      │     ├─ h3 (mono number + heading)
      │     ├─ Blocks(section.blocks) → p / ul|ol>li / aside.practice-callout
      │     │  (legacy sections: one p per paragraph instead of blocks)
      │     └─ .practice-reader-examples > figure.practice-example
      │        (figcaption, pre>code with copy button, explanation)
      └─ footer.practice-lesson-footer     sources + kbd hints (INSIDE the scroller)
```

Keyboard (window `keydown` while mounted): `Escape` closes; `←`/`→` move
sections; digits `1..N` jump to a section. Body scroll is locked (saved
scrollY, `position: fixed`, restored on unmount). Focus goes to the close
button on mount.

## The data types the reader renders (`curriculum.ts`, verbatim)

```ts
// Structured section content. A section either keeps the legacy flat
// `paragraphs` list or provides `blocks`; the reader renders blocks when
// present. Inline markup inside any text: **bold**, *italic*, `code`.
export type SectionBlock =
  | { readonly kind: "p"; readonly text: string }
  | {
      readonly kind: "list";
      readonly ordered?: boolean;
      readonly items: readonly string[];
    }
  | {
      readonly kind: "callout";
      readonly variant: "key" | "warning";
      readonly title?: string;
      readonly text: string;
    };

export type LessonSection = {
  readonly heading: string | null;
  readonly paragraphs?: readonly string[];
  readonly blocks?: readonly SectionBlock[];
  readonly examples?: readonly LessonExample[];
};

export type DeepLesson = {
  readonly sections: readonly LessonSection[];
};

// TopicCard (relevant fields only): id, title, objectives?, references?,
// lesson? (a small 5-tab fragment fallback — separate legacy renderer),
// deepLesson? (the deep reader above), examples?
```

## The text renderer (`web/lib/format.tsx`, verbatim)

```tsx
import { Fragment, type ReactNode } from "react";
import type { SectionBlock } from "../curriculum";

// Hand-rolled inline markup, deliberately dependency-free: **bold**,
// *italic*, `code`. A single alternation regex tokenises the string so
// nested or overlapping marks are impossible by construction — authoring
// discipline, not parser complexity.
const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;

export function InlineText({ text }: { text: string }) {
  const parts = text.split(INLINE_PATTERN);
  return (
    <>
      {parts.map((part, index) => {
        if (part.length < 3) {
          return <Fragment key={index}>{part}</Fragment>;
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={index}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

export function Blocks({ blocks }: { blocks: readonly SectionBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <InlineText text={item} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "callout":
            return (
              <aside className={`practice-callout is-${block.variant}`} key={index}>
                <span className="practice-callout-title">
                  {block.title ?? (block.variant === "warning" ? "ловушка" : "главное")}
                </span>
                <p>
                  <InlineText text={block.text} />
                </p>
              </aside>
            );
          default:
            return (
              <p key={index}>
                <InlineText text={block.text} />
              </p>
            );
        }
      })}
    </>
  );
}
```

## The deep-branch render inside the overlay (`PracticeMapPage.tsx`, verbatim excerpt)

```tsx
        <div
          className="practice-lesson-scroll"
          key={topic.id}
          onScroll={updateProgress}
          ref={scrollRef}
        >
          <div aria-hidden="true" className="practice-lesson-progress">
            <span ref={progressRef} />
          </div>

          {topic.objectives && topic.objectives.length > 0 && (
            <div className="practice-lesson-objectives">
              <span>objectives</span>
              <ul>
                {topic.objectives.map((objective, objectiveId) => (
                  <li key={objectiveId}><InlineText text={objective} /></li>
                ))}
              </ul>
            </div>
          )}

          {deep ? (
            <>
              <nav aria-label="Lesson sections" className="practice-reader-nav">
                {deep.sections.map((section, navId) => (
                  <button
                    aria-current={sectionIndex === navId ? "true" : undefined}
                    className={sectionIndex === navId ? "is-active" : ""}
                    key={navId}
                    type="button"
                    onClick={() => goToSection(navId)}
                  >
                    <kbd>{navId + 1}</kbd>
                    {section.heading ?? "intro"}
                  </button>
                ))}
              </nav>

              <div className="practice-reader">
                {deep.sections.map((section, sectionId) => (
                  <section
                    className="practice-reader-section"
                    data-section-index={sectionId}
                    key={sectionId}
                  >
                    {section.heading && (
                      <h3>
                        <span aria-hidden="true">{String(sectionId + 1).padStart(2, "0")}</span>
                        {section.heading}
                      </h3>
                    )}
                    {section.blocks ? (
                      <Blocks blocks={section.blocks} />
                    ) : (
                      section.paragraphs?.map((paragraph, paragraphId) => (
                        <p key={paragraphId}>
                          <InlineText text={paragraph} />
                        </p>
                      ))
                    )}
                    {section.examples && section.examples.length > 0 && (
                      <div className="practice-reader-examples">
                        {section.examples.map((example) => (
                          <ExampleFigure example={example} key={example.title} />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </>
          ) : lesson ? (
            /* legacy 5-tab fragment fallback — tabs problem/model/mechanics/
               pitfalls/whenNot, then examples. Separate renderer, small. */
            <>{/* …tabs + lesson body + examples… */}</>
          ) : null}
```

## The global keydown handler (`PracticeMapPage.tsx`, verbatim — the trap)

```tsx
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        if (deep) {
          moveSection(1);
        } else {
          moveTab(1);
        }
        return;
      }
      if (event.key === "ArrowLeft") {
        if (deep) {
          moveSection(-1);
        } else {
          moveTab(-1);
        }
        return;
      }
      const digit = Number(event.key);
      if (!Number.isInteger(digit) || digit < 1) {
        return;
      }
      if (deep) {
        if (digit <= deep.sections.length) {
          goToSection(digit - 1);
        }
      } else if (digit <= LESSON_TABS.length) {
        setTab(LESSON_TABS[digit - 1].key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // …then body scroll lock (overflow hidden + position fixed + top -scrollY),
    // focus to close button, and cleanup restoring everything.
```

There is NO editable-target guard: today nothing in the overlay accepts
typing, so every keystroke is a navigation key. If your design introduces an
input, this handler MUST gain a guard (e.g. ignore when the event target is
editable) — and while a typing session is active, `Escape` should end the
session first (the design states its exact layering).

## Persistent state today (`web/progress.ts`)

```ts
export type TopicProgress = {
  readonly status: TopicStatus;
  readonly feedback: readonly FeedbackKind[];
  readonly note: string;
};

export type PracticeState = {
  readonly topics: Readonly<Record<string, TopicProgress>>;
};

const STORAGE_KEY = "practice-map:progress:v1";
// loadPracticeState: JSON.parse(localStorage.getItem(STORAGE_KEY)), merge
// per-topic {status, feedback, note} over an initial state, defensive
// validation, try/catch → initial. savePracticeState: JSON.stringify.
```

Reading-progress state must not corrupt this store: either a separate
versioned key (recommended — the schema is different data) or a v2 migration;
the design decides and records it. The page's footer has a `reset progress`
button that resets statuses/feedback/notes via `window.confirm` — the design
decides whether reading progress joins that reset or gets its own.

## CSS / geometry laws (from the repo's bug history — non-negotiable)

1. **Portal to `<body>`**: the page's topic cards carry a hover transform; a
   transformed ancestor captures `position: fixed` overlays as its containing
   block and displaces them. Both existing overlays portal.
2. **Stationary frame + keyed inner scroller**: the panel itself never
   scrolls; `.practice-lesson-scroll` (keyed by `topic.id`) is the only
   scroller. This is the iOS close-X repair — the close button's viewport
   geometry must never change while content scrolls.
3. **Scrollbar law**: the webkit pseudos style the bar (8px lane, thumb
   `rgba(238, 234, 224, 0.26)`); the element must NOT declare standard
   `scrollbar-width`/`scrollbar-color` (any non-auto value makes modern
   engines ignore the webkit pseudos). The bar must be visible and
   ink-consistent — never white, never invisible.
4. **color-scheme: dark** on the portaled overlay root.
5. **Reduced motion**: the field-scoped clamp (`.practice-map-field *`) does
   NOT reach a body-portal; any new overlay CSS must carry its own
   `@media (prefers-reduced-motion: reduce)` clamp block, and any reveal
   animations must be gated to `no-preference`.
6. **No horizontal overflow at 320px and 390px**: an automated probe walks
   every descendant of the panel and fails if any (not clipped by a
   scrollable ancestor) escapes the viewport on either axis. New fixed/sticky
   strips must pass this.
7. **Panel width ~950px desktop** (`min(950px, 100%)`); on ≤560px the overlay
   padding becomes safe-area-aware and the panel is max-height bound to
   `calc(100dvh - 1.2rem)`.
8. **Chrome voice**: lowercase mono English for UI chrome; Russian stays for
   lesson content; muted-on-ink contrast ≥ 4.5:1; `:focus-visible` keeps the
   global ochre outline; no new dependencies; TypeScript strict, React 19;
   clean up every listener/observer.

## The browser check (`tests/practice-map.check.mjs` — must stay green)

Puppeteer-core + system Chrome against the Vite dev server; fails on ANY
console error, pageerror, horizontal overflow, or panel-escape. Existing
gates your changes must not break: map renders (20 Linux cards), deep reader
opens, ≥10 nav chips (Go lesson exactly 19), typography counts (code
examples, callouts, inline markup), panel fits viewport at 1440px, panel
~950px, the webkit scrollbar law, color-scheme dark, chip click scrolls,
scrollspy updates the active chip, `ArrowRight` advances, `Escape` closes,
fragment-tab fallback still uses tabs with no `.practice-reader`, Go lesson
gates, the full mobile leg (390px: no page overflow, panel fits both axes,
stationary-frame structure, close button pinned while scrolled, bottom
reachable, progress fills, copy button visible on touch, no overlay
overflow, no descendant escapes), the narrow-phone leg (320px: same
assertions + graph sheet), and the concept-graph suite. Run from
`portfolio/`: `node projects/practice-map/tests/practice-map.check.mjs`.

## Translating the report — what "editor-like reading" means

The owner reads in editor apps for two reasons, and your design must make
both native to the deep reader:

1. **Delete-as-you-read.** Consumed text physically leaves the page — what
   remains is visibly unread, the eye has a forward direction, and progress
   is legible from the page itself (a trail, stubs, a counter — the form is
   yours to design). Deletion is the owner's *choice of gesture* — think
   about what it should be on a keyboard and on a touchscreen, and what it
   costs when accidental.
2. **Shadow-typing.** Retyping text as you read forces word-level
   engagement — motor attention instead of skimming. The design must decide
   what exactly gets typed (a sentence? the paragraph? a prefix?), where
   typing happens (inline in the text? a dedicated strip?), what matching
   feels like (strict char-by-char? word-complete? forgiving), and when a
   typed unit counts as consumed. Russian text, punctuation, and mobile
   autocorrect are part of this problem.

The two verbs must reinforce each other in one reading loop — e.g. a typed
unit consumed and deleted hands focus to the next unit — and neither may
break the reader's existing properties (scrollspy, section nav, scroll
progress, mobile fit, Escape, copy buttons).

## Hard constraints summary (in addition to the laws above)

- Passive reading stays the default mode and pixel-identical to today; the
  interactive mode is opt-in, discoverable from inside the reader, and the
  chosen mode should be remembered (per topic or globally — decide).
- Per-topic reading progress persists in localStorage and survives reloads
  and re-opens mid-lesson; there is a reset affordance.
- Scope: deep lessons are the target. The legacy fragment-tab fallback and
  the legacy flat-`paragraphs` sections must either be covered or explicitly
  out of scope — decide, record, and make the boundary graceful (the
  interactive control must not appear where it cannot work).
- Lists, callouts, headings, and code figures exist inside sections — the
  design states exactly which units participate in reading progress and how
  the rest is presented in interactive mode.
- No `any`, no new npm dependencies, listeners cleaned up.

## Known traps (from this repo's history)

- The window `keydown` handler navigates sections on digits/arrows — needs
  an editable-target guard the moment an input exists (see excerpt above).
- contentEditable + React + inline markup is a fragile pairing (caret jumps,
  controlled updates fighting the DOM, IME). If a free-editor model wins the
  brainstorm, it must answer for these explicitly.
- iOS: the on-screen keyboard resizes the viewport (the panel is
  `100dvh`-bound); a focused typing affordance must remain visible on a
  real iPhone — this is a known class of bug in this repo.
- Scrollspy queries `[data-section-index]` positions on every scroll;
  collapsing/deleting consumed blocks changes the document geometry
  mid-read. `goToSection` smooth-scrolls and suppresses the spy until
  `scrollend` (1200ms fallback timer). Your collapse/persist behavior must
  keep spy, nav chips, and scroll progress coherent.
- Reading progress that persists across sessions is likely wanted (long
  lessons, multi-session reading) — but accidental permanent deletion is a
  risk: decide the restore/reset story deliberately.
- The 320px walk probe: any absolutely-positioned strip, badge, or portal
  you add inside the panel is walked and must not escape.

## Your job this round

Settle, to depth:

1. **The interaction model.** The unit of reading (paragraph? block? list
   item? sentence?), the delete gesture (keyboard, touch, both), the typing
   mechanic (what, where, how matched), and how the two compose into one
   loop that ends a reading session where it began.
2. **State, persistence, reset.** The per-topic state shape, storage key,
   merge/validation rules, and reset semantics.
3. **Presentation.** How consumed units leave (collapse? stub? removed with
   a trail? counter?), how the active unit is marked, how the mode toggle
   looks and where it lives, and what interactive mode does about non-prose
   content (callouts, lists, code figures, headings).
4. **Keyboard + a11y.** The guard on the global handler, Escape layering,
   focus management (where focus lands when a unit is consumed), and
   accessible names for every new affordance.
5. **Mobile + reduced motion.** The same loop usable on an iPhone with the
   on-screen keyboard; every animation gated.
6. **The execution plan.** Ordered implementation passes naming the files
   (`PracticeMapPage.tsx`, `practice-map.css`, `progress.ts`, possibly a new
   `web/lib/*` module — the `format.tsx` precedent exists), what each pass
   delivers, how it is verified (the existing check suite + any new gates),
   and the exact integration format the next round's deliverable should use
   (replacement blocks verbatim current → verbatim replacement, or complete
   new files — recommend one).

## Expected output (fixed headings — markdown)

1. `RESTATE` — the task and the owner's intent in your own words (short).
2. `DIRECTIONS` — at least 5 genuinely different interaction models; one
   meaty paragraph each (mechanics + what reading feels like + main risk).
3. `PRUNE` — the criteria you prune by, then each direction's verdict.
4. `DESIGN` — the winning direction developed to depth: unit model, typing
   matching rules, delete gestures (desktop + touch), state shape and
   storage, presentation/collapse, mode entry and memory, scope decisions,
   a11y, keyboard map, mobile and reduced-motion behavior.
5. `STRESS-TEST` — failure modes (accidental deletion, mid-typing reload,
   keyboard conflicts, scrollspy coherence, iOS keyboard, 320px overflow,
   long-line Russian paragraphs) and the mitigation for each.
6. `EXECUTION PLAN` — ordered passes, files touched per pass, verification
   per pass, and the integration format for the next relay round.
7. `DECISIONS` — the committed list; every call you made without asking.
   Ask nothing unless truly blocking; the default is to decide.

Length target: 300–450 lines. No code listings this round; pseudocode is
welcome where it sharpens a mechanic.
