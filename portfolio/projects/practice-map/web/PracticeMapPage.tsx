import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  curriculum,
  type LessonExample,
  type LessonSection,
  type TopicCard as TopicCardDefinition,
} from "./curriculum";
import {
  createInitialState,
  loadPracticeState,
  savePracticeState,
  type PracticeState,
} from "./progress";
import "./practice-map.css";
import { TIERS, orderedTopicsForTier, plural } from "./lib/tiers/tiers";
import { TierList } from "./lib/tiers/TierList";
import { TierPanel } from "./lib/tiers/TierPanel";
import { Palette, type PaletteItem } from "./lib/tiers/Palette";
import "./lib/tiers/tiers.css";
import { Blocks, InlineText } from "./lib/format";
import { FreeReadingControls } from "./lib/freeReading/FreeReadingControls";
import { FreeReadingText } from "./lib/freeReading/FreeReadingText";
import {
  freeSectionKey,
  useFreeSettings,
  writeFreeSettings,
} from "./lib/freeReading/storage";
import { useFreeReading } from "./lib/freeReading/useFreeReading";
import {
  readScrollProgress,
  removeScrollProgress,
  writeScrollProgress,
} from "./lib/scrollProgress/storage";

const LESSON_TABS = [
  { key: "problem", label: "problem" },
  { key: "model", label: "model" },
  { key: "mechanics", label: "mechanics" },
  { key: "pitfalls", label: "pitfalls" },
  { key: "whenNot", label: "when not" },
] as const;

type LessonTabKey = (typeof LESSON_TABS)[number]["key"];

export default function PracticeMapPage() {
  const [activeTierId, setActiveTierId] = useState(TIERS[0]?.id ?? "");
  const [state, setState] = useState<PracticeState>(() => loadPracticeState(curriculum));
  const [query, setQuery] = useState("");
  const [activeVolume, setActiveVolume] = useState<string | null>(null);
  const [flashTopicId, setFlashTopicId] = useState<string | null>(null);
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    savePracticeState(state);
  }, [state]);

  const topicsById = useMemo(() => {
    const map: Record<string, TopicCardDefinition> = {};
    for (const area of curriculum) {
      for (const topic of area.topics) map[topic.id] = topic;
    }
    return map;
  }, []);

  const activeTier = TIERS.find((tier) => tier.id === activeTierId) ?? TIERS[0];
  const tierTopics = useMemo(
    () => (activeTier ? orderedTopicsForTier(activeTier, topicsById).map(({ topic, index }) => ({ ...topic, index })) : []),
    [activeTier, topicsById],
  );

  const lessonCount = useCallback((tierId: string) => {
    const tier = TIERS.find((t) => t.id === tierId);
    return tier ? orderedTopicsForTier(tier, topicsById).length : 0;
  }, [topicsById]);

  const sampleTitle = useCallback((tierId: string) => {
    const tier = TIERS.find((t) => t.id === tierId);
    return tier ? (orderedTopicsForTier(tier, topicsById)[0]?.topic.title ?? "") : "";
  }, [topicsById]);

  const paletteItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];
    for (const tier of TIERS) {
      const ordered = orderedTopicsForTier(tier, topicsById);
      items.push({
        kind: "tier",
        title: tier.name,
        sub: tier.band + " · " + plural(ordered.length, "lesson"),
        tierId: tier.id,
        topicId: null,
        hay: tier.name + " " + tier.band,
      });
      for (const { topic } of ordered) {
        items.push({
          kind: "lesson",
          title: topic.title,
          sub: tier.name,
          tierId: tier.id,
          topicId: topic.id,
          hay: topic.title + " " + topic.summary + " " + tier.name,
        });
      }
    }
    return items;
  }, [topicsById]);

  const flashTimerRef = useRef<number | undefined>(undefined);
  const flashThenClear = (topicId: string | null) => {
    if (!topicId) return;
    window.clearTimeout(flashTimerRef.current);
    setFlashTopicId(topicId);
    flashTimerRef.current = window.setTimeout(() => setFlashTopicId(null), 1400);
  };

  // Global chrome: cmd/ctrl+K toggles the palette; Esc leaves the volume view
  // when the palette is closed (the palette owns its own Esc while open).
  // While a lesson overlay is up, the overlay owns every key — the palette
  // stays out of its way and Esc does not exit the volume beneath.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (openLessonId) return;
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
  }, [paletteOpen, activeVolume, openLessonId]);

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
        <header className="practice-map-hero">
          <h1 id="practice-map-title">
            <span className="hero-title">archive of ai outputs.</span>
            <span className="hero-sub">not all of these are good.</span>
          </h1>
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
            onClose={() => setOpenLessonId(null)}
          />
        )}

        <footer className="practice-map-footer">
          <span>local notes · no account</span>
          <span className="practice-map-footer-meta">
            <button
              className="practice-map-reset"
              type="button"
              onClick={() => {
                if (window.confirm("Reset all notes and progress?")) {
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

function LessonOverlay({
  index,
  topic,
  onClose,
}: {
  index: number;
  topic: TopicCardDefinition;
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
  const saveTimerRef = useRef<number>(undefined);
  const pendingScrollTopRef = useRef<number | null>(null);
  const lesson = topic.lesson;
  const deep = topic.deepLesson;
  const free = useFreeSettings(topic.id);
  const freeEnabled = free.value?.enabled ?? false;

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

  const flushScrollSave = () => {
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = undefined;
    const pending = pendingScrollTopRef.current;
    if (pending === null) return;
    pendingScrollTopRef.current = null;
    if (pending < 1) {
      removeScrollProgress(topic.id);
    } else {
      writeScrollProgress(topic.id, pending);
    }
  };

  const scheduleScrollSave = () => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (max <= 4) return;
    pendingScrollTopRef.current = scroller.scrollTop;
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(flushScrollSave, 300);
  };

  const handleScroll = () => {
    updateProgress();
    scheduleScrollSave();
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

  useEffect(() => {
    if (!deep || !scrollRef.current || typeof IntersectionObserver === "undefined") {
      return;
    }
    const scroller = scrollRef.current;
    sectionTargetsRef.current = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-section-index]"),
    );
    const observer = new IntersectionObserver(
      () => updateActiveFromScroll(),
      { root: scroller, threshold: [0, 0.25] },
    );
    sectionTargetsRef.current.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      window.clearTimeout(settleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deep]);

  useEffect(() => {
    if (!lesson && !deep) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Editable targets own their keys: the shadow-typing input types digits
      // and uses Escape/Backspace, the search field filters — none of that
      // may drive section navigation.
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
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
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousLeft = document.body.style.left;
    const previousRight = document.body.style.right;
    // iOS Safari ignores overflow:hidden on body, so the map keeps
    // scrolling behind the overlay. Freezing the body in place is the
    // reliable lock; the saved offset is restored on teardown.
    const lockedScrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      window.scrollTo({ top: lockedScrollY, behavior: "instant" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deep, lesson, onClose]);

  useEffect(() => {
    updateProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore saved scroll position before the browser's first paint.
  useLayoutEffect(() => {
    const saved = readScrollProgress(topic.id);
    if (!saved) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (max <= 4) return;
    const pos = Math.min(saved.scrollTop, max);
    if (pos < 1) return;
    scroller.scrollTop = pos;
    const bar = progressRef.current;
    if (bar) {
      bar.style.opacity = "1";
      bar.style.transform = `scaleX(${Math.min(pos / max, 1)})`;
    }
    // The IntersectionObserver effect hasn't populated sectionTargetsRef
    // yet, so query section elements directly to sync the active chip.
    if (deep) {
      const scrollerRect = scroller.getBoundingClientRect();
      const probeY = scrollerRect.top + Math.min(scrollerRect.height * 0.25, 260);
      let active = -1;
      scroller.querySelectorAll<HTMLElement>("[data-section-index]").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const idx = Number(el.dataset.sectionIndex);
        if (rect.top <= probeY && rect.bottom > probeY && idx >= 0) {
          active = idx;
        }
      });
      if (active >= 0) {
        sectionIndexRef.current = active;
        setSectionIndex(active);
      }
    }
  }, []);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") flushScrollSave();
    };
    const onUnload = () => flushScrollSave();
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      flushScrollSave();
      window.clearTimeout(saveTimerRef.current);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  if (!lesson && !deep) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Portaled to <body>: the overlay is position:fixed, and any transformed
  // ancestor (the card hover lift) would otherwise capture it as its
  // containing block and displace it out of the viewport.
  return createPortal(
    <div className="practice-lesson-overlay" onClick={handleBackdropClick} role="presentation">
      {/* Stationary frame + keyed inner scroll body (the realm deep-reader
          repair): the panel itself never scrolls, so the header close button
          keeps its geometry on iOS Safari — content cannot run under it and
          safe-area overflow cannot drag it out of place. */}
      <section
        aria-label={`Lesson: ${topic.title}`}
        className="practice-lesson-panel"
        role="dialog"
      >
        <header className="practice-lesson-header">
          <div>
            <p className="practice-lesson-kicker">
              lesson {String(index + 1).padStart(2, "0")}
              {typeof topic.complexity === "number" && ` · ${topic.complexity}/5`}
            </p>
            <h2>{topic.title}</h2>
          </div>
          <div className="practice-lesson-tools">
            {free.hydrated && (
              <FreeReadingControls
                enabled={freeEnabled}
                hydrated={free.hydrated}
                onToggle={(next) => writeFreeSettings(topic.id, next)}
              />
            )}
            <button
              aria-label="Close lesson"
              className="practice-lesson-close"
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div
          className="practice-lesson-scroll"
          key={topic.id}
          onScroll={handleScroll}
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
                  <InteractiveSection
                    key={sectionId}
                    sectionIndex={sectionId}
                    section={section}
                    topicId={topic.id}
                    settings={{ enabled: freeEnabled }}
                  />
                ))}
              </div>
            </>
          ) : lesson ? (
            <>
              <div aria-label="Lesson sections" className="practice-lesson-tabs">
                {LESSON_TABS.map(({ key, label }, tabIndex) => (
                  <button
                    className={tab === key ? "is-active" : ""}
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                  >
                    <kbd>{tabIndex + 1}</kbd>
                    {label}
                  </button>
                ))}
              </div>

              <div className="practice-lesson-body">
                {tab === "pitfalls"
                  ? <ul>{lesson.pitfalls.map((pitfall, pitfallId) => <li key={pitfallId}><InlineText text={pitfall} /></li>)}</ul>
                  : <p><InlineText text={lesson[tab]} /></p>}
              </div>

              {topic.examples && topic.examples.length > 0 && (
                <div className="practice-lesson-examples">
                  <h3>examples</h3>
                  {topic.examples.map((example) => (
                    <ExampleFigure example={example} key={example.title} />
                  ))}
                </div>
              )}
            </>
          ) : null}

          {topic.references && topic.references.length > 0 && (
            <footer className="practice-lesson-footer">
              <span>sources: {topic.references.join(" · ")}</span>
              <span className="practice-lesson-hint">
                <kbd>←</kbd> <kbd>→</kbd> {deep ? "sections" : "tabs"} · <kbd>esc</kbd> closes
              </span>
            </footer>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

// A section's typeable stream: every prose block flattened to plain text
// (inline markup stripped, list items joined, blocks separated by blank
// lines). Headings stay chrome; examples stay rendered below the stream.
const INLINE_MARKUP = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;

const plainText = (text: string) =>
  text.replace(INLINE_MARKUP, (mark) =>
    mark.startsWith("**") ? mark.slice(2, -2) : mark.slice(1, -1),
  );

function sectionProse(section: LessonSection): string {
  const blocks =
    section.blocks ??
    (section.paragraphs ?? []).map((text) => ({ kind: "p" as const, text }));
  const parts = blocks.map((block) => {
    switch (block.kind) {
      case "list":
        return plainText(block.items.join("; "));
      case "callout":
        return plainText(block.text);
      default:
        return plainText(block.text);
    }
  });
  return parts.filter(Boolean).join("\n\n");
}

function InteractiveSection({
  sectionIndex,
  section,
  topicId,
  settings,
}: {
  sectionIndex: number;
  section: LessonSection;
  topicId: string;
  settings: { enabled: boolean };
}) {
  const prose = sectionProse(section);
  const fr = useFreeReading({
    sectionKey: freeSectionKey(topicId, sectionIndex),
    original: prose,
    enabled: settings.enabled,
  });

  return (
    <section
      className="practice-reader-section"
      data-section-index={sectionIndex}
    >
      {section.heading && (
        <h3>
          <span aria-hidden="true">{String(sectionIndex + 1).padStart(2, "0")}</span>
          {section.heading}
        </h3>
      )}
      {settings.enabled && prose ? (
        <>
          <div className="fr-row">
            <span className="fr-count">
              {fr.consumedWords}/{fr.totalWords}
            </span>
            <progress
              aria-label={`Words read in section ${sectionIndex + 1}`}
              className="fr-progress"
              max={fr.totalWords}
              value={fr.consumedWords}
            />
            <button className="fr-mini" disabled={fr.pristine} type="button" onClick={fr.reset}>
              reset section
            </button>
          </div>
          <FreeReadingText
            fr={fr}
            label={`Section ${sectionIndex + 1} text — delete what you have read, type your notes freely`}
          />
          {fr.stale && (
            <p className="fr-note" role="note">
              the lesson text changed since this note was last edited, so the saved text was reset
            </p>
          )}
          {fr.consumedWords >= fr.totalWords && fr.totalWords > 0 && (
            <p className="fr-done">✓ read through — what you keep here is yours</p>
          )}
        </>
      ) : (
        <>
          {section.blocks ? (
            <Blocks blocks={section.blocks} />
          ) : (
            section.paragraphs?.map((paragraph, paragraphId) => (
              <p key={paragraphId}>
                <InlineText text={paragraph} />
              </p>
            ))
          )}
        </>
      )}
      {section.examples && section.examples.length > 0 && (
        <div className="practice-reader-examples">
          {section.examples.map((example) => (
            <ExampleFigure example={example} key={example.title} />
          ))}
        </div>
      )}
    </section>
  );
}

function ExampleFigure({ example }: { example: LessonExample }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);
  const [scrollable, setScrollable] = useState(false);

  useLayoutEffect(() => {
    const element = codeRef.current;
    if (!element) {
      return;
    }
    const check = () => setScrollable(element.scrollWidth > element.clientWidth + 1);
    check();
    document.fonts?.ready.then(check).catch(() => {});
  }, [example.code]);

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(example.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <figure className="practice-example">
      <figcaption>{example.title}</figcaption>
      <div className={`practice-example-code${scrollable ? " is-scrollable" : ""}`}>
        <button
          aria-label="Copy code"
          className={`practice-example-copy${copied ? " is-copied" : ""}`}
          type="button"
          onClick={handleCopy}
        >
          {copied ? "copied" : "copy"}
        </button>
        <pre ref={codeRef}><code>{example.code}</code></pre>
      </div>
      <p><InlineText text={example.explanation} /></p>
    </figure>
  );
}
