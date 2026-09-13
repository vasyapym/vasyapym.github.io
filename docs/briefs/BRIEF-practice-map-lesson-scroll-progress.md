# Task brief — Practice Map: save & restore lesson scroll progress

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design and code choice in this task: do not ask for approval, do not offer option lists — deliberate, decide, and ship one coherent answer. The orchestrator splices your regions into the files and runs the checks; you never hedge with "or alternatively".

## 1. The page

"Practice Map" is a project page in a dark-ink developer portfolio (React 19 + TypeScript + Vite, no router — one page component). Topic cards open a fullscreen lesson reader overlay (`LessonOverlay`, portaled to `document.body`). The overlay has a stationary panel frame and ONE inner scrollable element: `.practice-lesson-scroll` (a `<div>` with `ref={scrollRef}`, `onScroll={updateProgress}`, `key={topic.id}`). Deep lessons render numbered sections with a scrollspy that highlights the active section chip; fragment lessons render tabs instead. A top progress bar (`updateProgress`) mirrors `scrollTop / (scrollHeight - clientHeight)`.

Established facts you must not violate:
- The overlay mounts fresh on every open (`lessonOpen` state per card); `topic` never changes while it is mounted (the `key={topic.id}` on the scroll div is defensive only).
- Lesson progress (statuses, notes) already persists via localStorage; free-reading notes persist per section with a versioned-record pattern (§3, Reference R3) — **this is the "same approach as before" the owner means**.
- iOS Safari: body scroll is locked by freezing `body` in place while the overlay is open (existing code, do not touch).
- `useLayoutEffect` is ALREADY imported in `PracticeMapPage.tsx` (line 3, alongside useEffect/useMemo/useRef/useState).

## 2. The ask (owner, verbatim)

> "When a user opens a lesson and scrolls, save their current scroll position as progress for that lesson. Store it in `localStorage` using the same approach as before. When the user returns to the lesson, restore the saved scroll position so they can continue where they left off, without an abrupt jump."

Working interpretation: per-topic scroll memory across overlay close/open AND across page reloads. "Without an abrupt jump" = the restore must not be a visible event: the lesson's first painted frame should already sit at the saved position (or as close as the platform allows) — opening must never show a top-then-fly-to-position animation, and must not visibly jolt after first paint.

## 3. Current state verbatim (only these regions may change; Reference R3 is read-only)

### R1 — `web/PracticeMapPage.tsx`, LessonOverlay head (lines 816–924, verbatim)

```tsx
function LessonOverlay({
  index,
  topic,
  status,
  onStatusChange,
  onClose,
}: {
  index: number;
  topic: TopicCardDefinition;
  status: TopicStatus;
  onStatusChange: (status: TopicStatus) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<LessonTabKey>("problem");
  const [sectionIndex, setSectionIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const sectionIndexRef = useRef(0);
  const spyEnabledRef = useRef(true);
  const settleTimerRef = useRef<number>(undefined);
  const lesson = topic.lesson;
  const deep = topic.deepLesson;
  const free = useFreeSettings(topic.id);
  const freeEnabled = free.value?.enabled ?? false;

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(event.target.value as TopicStatus);
  };

  const updateProgress = () => {
    const scroller = scrollRef.current;
    const bar = progressRef.current;
    if (!scroller || !bar) {
      return;
    }
    const max = scroller.scrollHeight - scroller.clientHeight;
    bar.style.opacity = max <= 4 ? "0" : "1";
    bar.style.transform = `scaleX(${max <= 4 ? 0 : Math.min(scroller.scrollTop / max, 1)})`;
  };

  const goToSection = (target: number, scroll = true) => {
    const total = deep?.sections.length ?? 0;
    const next = Math.max(0, Math.min(target, total - 1));
    sectionIndexRef.current = next;
    setSectionIndex(next);
    const scroller = scrollRef.current;
    if (!scroll || !scroller) {
      return;
    }
    // Suppress the scrollspy while the programmatic flight is in progress:
    // its last event otherwise fires before the smooth scroll settles and
    // names whichever section happened to cross the probe line last.
    spyEnabledRef.current = false;
    scroller
      .querySelector(`[data-section-index="${next}"]`)
      ?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    window.clearTimeout(settleTimerRef.current);
    const settle = () => {
      spyEnabledRef.current = true;
      updateActiveFromScroll();
    };
    scroller.addEventListener("scrollend", settle, { once: true });
    settleTimerRef.current = window.setTimeout(() => {
      scroller.removeEventListener("scrollend", settle);
      settle();
    }, 1200);
  };

  const moveSection = (delta: number) => {
    goToSection(sectionIndexRef.current + delta);
  };

  const sectionTargetsRef = useRef<HTMLElement[]>([]);

  const updateActiveFromScroll = () => {
    const scroller = scrollRef.current;
    if (!scroller || !spyEnabledRef.current) {
      return;
    }
    const scrollerRect = scroller.getBoundingClientRect();
    if (scrollerRect.height === 0) {
      return;
    }
    const probeY = scrollerRect.top + Math.min(scrollerRect.height * 0.25, 260);
    let current = -1;
    sectionTargetsRef.current.forEach((element, elementId) => {
      const rect = element.getBoundingClientRect();
      if (rect.top <= probeY && rect.bottom > probeY) {
        current = elementId;
      }
    });
    if (current >= 0 && current !== sectionIndexRef.current) {
      sectionIndexRef.current = current;
      setSectionIndex(current);
    }
  };

  const moveTab = (delta: number) => {
    setTab((current) => {
      const activeIndex = LESSON_TABS.findIndex(({ key }) => key === current);
      return LESSON_TABS[(activeIndex + delta + LESSON_TABS.length) % LESSON_TABS.length].key;
    });
  };
```

Immediately after R1 follow TWO effects you may NOT rewrite wholesale but must reason about:
- Lines 926–944: IntersectionObserver setup over `[data-section-index]` elements with `root: scroller`, dep `[deep]`; its cleanup clears `settleTimerRef`.
- Lines 946–1025: keydown handling (Esc/←/→/digits) + the body scroll lock, dep `[deep, lesson, onClose]`.
- Lines 1027–1030: a mount effect calling `updateProgress()` once (`[]` dep) so the bar initializes.

### R2 — `web/PracticeMapPage.tsx`, the scroll container JSX (lines 1087–1095, verbatim)

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
```

(For orientation: the container closes at line 1192 after the lesson body; imports at the top of the file already include `freeSectionKey, useFreeSettings, writeFreeSettings` from `./lib/freeReading/storage` — a new module would be imported the same way.)

### R3 — REFERENCE (the pattern to mirror): `web/lib/freeReading/storage.ts` (complete, 143 lines)

```ts
import { useSyncExternalStore } from "react";
import type { FreeReadingSettings, FreeReadingText } from "./types";

const PREFIX = "practice-map:free:v2:";

export const freeSettingsKey = (topicId: string) => `${PREFIX}${topicId}`;
export const freeSectionKey = (topicId: string, sectionIndex: number) =>
  `${PREFIX}${topicId}#s${sectionIndex}`;

const listeners = new Set<() => void>();
const memoryFallback = new Map<string, string>();
// getSnapshot must return a referentially stable value for unchanged data.
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function getRaw(key: string): string | null {
  if (memoryFallback.has(key)) return memoryFallback.get(key) as string;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function setRaw(key: string, raw: string) {
  try {
    window.localStorage.setItem(key, raw);
    memoryFallback.delete(key);
  } catch {
    memoryFallback.set(key, raw); // quota / private mode
  }
}
function removeRaw(key: string) {
  memoryFallback.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function readRecord<T>(key: string, isValid: (x: unknown) => x is T): T | null {
  const raw = getRaw(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return (cached.value as T | null) ?? null;

  let value: T | null = null;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isValid(parsed)) value = parsed;
    } catch {
      /* corrupt → treat as absent */
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

function writeRecord(key: string, value: unknown) {
  setRaw(key, JSON.stringify(value));
  emit();
}
function removeRecord(key: string) {
  removeRaw(key);
  emit();
}

function emit() {
  for (const l of listeners) l();
}
function onStorage(e: StorageEvent) {
  if (e.key === null || e.key.startsWith(PREFIX)) emit(); // other tabs
}
function subscribe(cb: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

// A module-level wrapper keeps the reference stable across renders, so
// useSyncExternalStore doesn't unsubscribe/resubscribe on every render.
const stableSubscribe = (cb: () => void) => subscribe(cb);
```

(The file continues with record validators `isSettingsRecord`/`isTextRecord` — each checks `o.v === 2` plus field types — a shared `useStoredRecord` hook built on `useSyncExternalStore` with a `hydrated` flag, and `writeFreeSettings`/`writeFreeText`/`removeFreeText` wrappers. Mirror the shape: versioned record + type guard + safe get/set with memory fallback.)

Persistence cadence used by free reading (for parity of feel): 300ms debounce while typing, with flushes on unmount, `visibilitychange → hidden`, and `beforeunload`; returning to the pristine value REMOVES the record instead of storing it.

## 4. Method — deliberate before you write (this section is the primary grading axis)

A correct-but-shallow answer scores below a deeply-reasoned one. Do NOT emit any code until your Reasoning section is complete. Required:

1. **Restate the ask**, then list every consumer of scroll state that restore interacts with (at minimum: the top progress bar, the scrollspy/section chips, free-reading hydration changing section heights, the body scroll lock) and what each expects.
2. For each of (a) **what to store** (absolute px vs ratio vs section index + intra-section offset vs other), (b) **when to save** (every scroll event vs debounced + which flush points), (c) **restore mechanism & timing** (sync pre-paint layout effect vs rAF vs effect + smooth scroll vs other): name at least TWO alternatives, pick one, and give a concrete reason tied to the acceptance criteria — including what the alternative gets wrong.
3. **Failure-mode enumeration** — address each explicitly (handle it or state why accepted): saved position beyond current max; corrupt/quota-blocked storage; viewport resized or content changed between sessions (ratio drift); free-reading mode hydrating after mount and changing heights; non-scrollable lessons (max ≤ 4); a restored position indistinguishable from top (should a "top" record exist at all?); scrollspy state after restore (the active chip must match the restored position — say exactly how your restore path updates `sectionIndex`/`sectionIndexRef` without tripping the `spyEnabledRef` suppression or the `goToSection` flight machinery); the mount-time `updateProgress()` call ordering; StrictMode double-mounting (React 19 dev).
4. **State the invariant list** — 3–6 statements that must hold in every state of the feature.
5. **Self-review**: re-check your plan against every acceptance criterion and every failure mode above; if any criterion is not provably met by your design, revise the design before writing code. If your first idea felt obvious, that is exactly when to enumerate its failure modes.

## 5. Acceptance criteria (observable)

1. Scrolling a lesson persists that lesson's position per topic id in localStorage (versioned JSON record, own key namespace — do NOT overload the `practice-map:free:v2:` prefix or its validators).
2. Reopening the same lesson — after close, and after a full page reload — lands at the saved position with no visible jump: no top-then-flight animation, no post-paint jolt.
3. A lesson with no saved record opens at top, exactly as today.
4. Non-scrollable lessons (scrollable range ≤ 4px) neither save nor restore.
5. A saved position beyond the current maximum clamps to the maximum; corrupt or absent records degrade to top silently.
6. After restore, the top progress bar AND (deep lessons) the active section chip reflect the restored position.
7. Scrolling back to the very top behaves sensibly (either no record persisted or restore-to-top is indistinguishable from fresh — your call, justified in §4.3).
8. No regressions: progress bar, scrollspy, keyboard nav (←/→/digits/Esc), body scroll lock, free-reading toggle, and the existing `goToSection` flight all behave exactly as before.
9. The orchestrator will run `npm run typecheck` (must pass) and the browser check suite; you design for headless-Chrome testability (no timers that can't be flushed, no reliance on real user gesture).

The orchestrator owns the test suite; do not write tests.

## 6. Output contract (exactly this shape)

```
## Reasoning
<the full §4 deliberation — this comes FIRST and must be complete before any Changes>

## Changes
### N1 — <path> (new file, if any)
<complete file content>

### N2 — web/PracticeMapPage.tsx (LessonOverlay head — replaces R1)
<complete replacement text for the region, same boundaries as R1; name any hook/effect you add INSIDE this region and where it sits>

### N3 — web/PracticeMapPage.tsx (scroll container JSX — replaces R2, if needed)
<complete replacement text>

### N+ — any further regions
<number them; each must quote its anchor (first + last line of the region it replaces) so the orchestrator can splice unambiguously>

## Notes
<optional, ≤5 lines: out-of-scope observations only — no code>
```

Rules: replace regions wholesale; keep the files' comment voice (comments only where a non-obvious constraint genuinely needs one, never narrating the change); no new dependencies; TypeScript strict-clean.
