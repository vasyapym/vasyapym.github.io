import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import {
  curriculum,
  FEEDBACK_LABELS,
  type FeedbackKind,
  type LessonExample,
  type PracticeArea,
  type TopicCard as TopicCardDefinition,
  type TopicStatus,
} from "./curriculum";
import {
  createInitialState,
  formatFeedback,
  loadPracticeState,
  savePracticeState,
  setTopicNote,
  setTopicStatus,
  summarizePractice,
  toggleTopicFeedback,
  type PracticeState,
} from "./progress";
import "./practice-map.css";

const STATUS_LABELS: Readonly<Record<TopicStatus, string>> = {
  queued: "queued",
  "in-progress": "in progress",
  revisit: "revisit",
  applied: "applied",
};

const LESSON_TABS = [
  { key: "problem", label: "problem" },
  { key: "model", label: "model" },
  { key: "mechanics", label: "mechanics" },
  { key: "pitfalls", label: "pitfalls" },
  { key: "whenNot", label: "when not" },
] as const;

type LessonTabKey = (typeof LESSON_TABS)[number]["key"];

type StatusFilter = TopicStatus | "all";

const STATUS_FILTERS: readonly { key: StatusFilter; label: string }[] = [
  { key: "all", label: "all" },
  { key: "queued", label: STATUS_LABELS.queued },
  { key: "in-progress", label: STATUS_LABELS["in-progress"] },
  { key: "revisit", label: STATUS_LABELS.revisit },
  { key: "applied", label: STATUS_LABELS.applied },
];

export default function PracticeMapPage() {
  const [activeAreaId, setActiveAreaId] = useState(curriculum[0]?.id ?? "");
  const [state, setState] = useState<PracticeState>(() => loadPracticeState(curriculum));
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const activeArea = useMemo(
    () => curriculum.find((area) => area.id === activeAreaId) ?? curriculum[0],
    [activeAreaId],
  );
  const summary = summarizePractice(curriculum, state);
  const reviewNotes = formatFeedback(curriculum, state, FEEDBACK_LABELS);

  useEffect(() => {
    savePracticeState(state);
  }, [state]);

  const updateState = (nextState: PracticeState) => {
    setState(nextState);
    setCopied(false);
  };

  const handleCopyFeedback = async () => {
    if (!navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(reviewNotes);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="practice-map-field">
      <section className="practice-map-page section-shell" aria-labelledby="practice-map-title">
        <header className="practice-map-hero">
          <h1 id="practice-map-title">
            Read less.
            <span>Practice more.</span>
          </h1>
          <div className="practice-map-hero-note">
            <button className="practice-map-export" type="button" onClick={handleCopyFeedback}>
              {copied ? "copied" : "copy review notes"}
              <span aria-hidden="true">↗</span>
            </button>
            <RouteProgress done={summary.applied} total={summary.total} />
          </div>
        </header>

        <section className="practice-summary" aria-label="Practice summary">
          <SummaryMetric label="cards" value={summary.total} />
          <SummaryMetric label="in progress" value={summary.inProgress} />
          <SummaryMetric label="applied" value={summary.applied} />
          <SummaryMetric label="revisit" value={summary.revisit} />
        </section>

        <div className="practice-map-layout">
          <aside className="practice-area-nav" aria-label="Practice areas">
            <div className="practice-area-nav-heading practice-map-notation">
              <span>areas</span>
              <span>{curriculum.length}</span>
            </div>
          <div className="practice-area-list">
            {curriculum.map((area) => (
              <button
                aria-pressed={area.id === activeArea?.id}
                className={area.id === activeArea?.id ? "is-active" : ""}
                key={area.id}
                type="button"
                onClick={() => setActiveAreaId(area.id)}
              >
                <span>
                  <strong>{area.title}</strong>
                  <small>{area.description}</small>
                </span>
                <em>{area.topics.length}</em>
              </button>
            ))}
          </div>
        </aside>

        {activeArea && (
          <PracticeAreaView
            area={activeArea}
            state={state}
            onChange={updateState}
            query={query}
            statusFilter={statusFilter}
            onQueryChange={setQuery}
            onStatusFilterChange={setStatusFilter}
          />
        )}
      </div>

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
                setCopied(false);
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

function RouteProgress({ done, total }: { done: number; total: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  return (
    <div
      aria-label={`${done} of ${total} topics applied`}
      className="practice-route"
      role="img"
    >
      <div className="practice-route-heading">
        <span>route</span>
        <strong>{pct}%</strong>
      </div>
      <svg aria-hidden="true" viewBox="0 0 320 36">
        <path
          className="practice-route-track"
          d="M4 28 C 52 8, 96 34, 148 20 S 244 2, 268 18 S 306 30, 316 12"
          fill="none"
        />
        <path
          className="practice-route-fill"
          d="M4 28 C 52 8, 96 34, 148 20 S 244 2, 268 18 S 306 30, 316 12"
          fill="none"
          ref={pathRef}
          strokeDasharray={pathLength || 1}
          strokeDashoffset={(1 - pct / 100) * (pathLength || 1)}
        />
        <circle className={`practice-route-end${pct === 100 ? " is-complete" : ""}`} cx="316" cy="12" r="4" />
      </svg>
      <span className="practice-route-caption">
        {done}/{total} applied
      </span>
    </div>
  );
}

function PracticeAreaView({
  area,
  state,
  onChange,
  query,
  statusFilter,
  onQueryChange,
  onStatusFilterChange,
}: {
  area: PracticeArea;
  state: PracticeState;
  onChange: (state: PracticeState) => void;
  query: string;
  statusFilter: StatusFilter;
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (filter: StatusFilter) => void;
}) {
  const summary = summarizePractice([area], state);

  const statusCounts = useMemo(() => {
    const counts = new Map<StatusFilter, number>([["all", area.topics.length]]);
    for (const topic of area.topics) {
      const status = state.topics[topic.id]?.status ?? "queued";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return counts;
  }, [area, state]);

  const visibleTopics = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return area.topics.filter((topic) => {
      if (statusFilter !== "all" && (state.topics[topic.id]?.status ?? "queued") !== statusFilter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [topic.title, topic.summary, ...topic.concepts]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [area, query, statusFilter, state]);

  return (
    <section className="practice-area-view" aria-labelledby="practice-area-title">
      <div className="practice-area-heading">
        <h2 id="practice-area-title">{area.title}</h2>
        <span className="practice-area-count practice-map-notation">
          {summary.applied} applied · {summary.revisit} revisit
        </span>
      </div>

      <div className="practice-toolbar">
        <label className="practice-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search topics"
            placeholder="search…"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          {query && (
            <button aria-label="Clear search" className="practice-search-clear" type="button" onClick={() => onQueryChange("")}>
              ✕
            </button>
          )}
        </label>
        <div aria-label="Filter by status" className="practice-filter-chips" role="group">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              aria-pressed={statusFilter === key}
              className={statusFilter === key ? "is-active" : ""}
              key={key}
              type="button"
              onClick={() => onStatusFilterChange(key)}
            >
              {label}
              <em>{statusCounts.get(key) ?? 0}</em>
            </button>
          ))}
        </div>
      </div>

      {visibleTopics.length > 0 ? (
        <div className="practice-topic-grid">
          {visibleTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              index={area.topics.indexOf(topic)}
              progress={state.topics[topic.id]}
              topic={topic}
              onChange={onChange}
              state={state}
            />
          ))}
        </div>
      ) : (
        <div className="practice-topic-empty">
          <strong>nothing here</strong>
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              onStatusFilterChange("all");
            }}
          >
            clear filters
          </button>
        </div>
      )}
    </section>
  );
}

function TopicCard({
  index,
  progress,
  state,
  topic,
  onChange,
}: {
  index: number;
  progress: PracticeState["topics"][string];
  state: PracticeState;
  topic: TopicCardDefinition;
  onChange: (state: PracticeState) => void;
}) {
  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(setTopicStatus(state, topic.id, event.target.value as TopicStatus));
  };

  const [lessonOpen, setLessonOpen] = useState(false);

  const toggleFeedback = (feedback: FeedbackKind) => {
    onChange(toggleTopicFeedback(state, topic.id, feedback));
  };

  const updateNote = (note: string) => {
    onChange(setTopicNote(state, topic.id, note));
  };

  return (
    <article className="practice-topic-card">
      <div className="practice-topic-topline">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span className={`practice-topic-status status-${progress.status}`}>
          {STATUS_LABELS[progress.status]}
        </span>
      </div>

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

      <details className="practice-topic-details">
        <summary>practice path</summary>
        <div>
          <p><strong>try</strong>{topic.practicePrompt}</p>
          <p><strong>check</strong>{topic.checkPrompt}</p>
        </div>
      </details>

      <div className="practice-topic-controls">
        <label>
          <span>status</span>
          <select aria-label={`Status for ${topic.title}`} value={progress.status} onChange={handleStatusChange}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <details className="practice-topic-feedback">
        <summary>feedback</summary>
        <div className="practice-feedback-editor">
          <div className="practice-feedback-options">
            {(Object.keys(FEEDBACK_LABELS) as FeedbackKind[]).map((feedback) => (
              <button
                aria-pressed={progress.feedback.includes(feedback)}
                className={progress.feedback.includes(feedback) ? "is-active" : ""}
                key={feedback}
                type="button"
                onClick={() => toggleFeedback(feedback)}
              >
                {FEEDBACK_LABELS[feedback]}
              </button>
            ))}
          </div>
          <label className="practice-note-label">
            <span>note</span>
            <textarea
              value={progress.note}
              onChange={(event) => updateNote(event.target.value)}
              placeholder="what to clarify next…"
              rows={3}
            />
          </label>
        </div>
      </details>

      {lessonOpen && topic.lesson && (
        <LessonOverlay
          index={index}
          topic={topic}
          onClose={() => setLessonOpen(false)}
        />
      )}
    </article>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="practice-summary-metric">
      <span>{label}</span>
      <strong>{value}</strong>
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lesson = topic.lesson;

  const moveTab = (delta: number) => {
    setTab((current) => {
      const activeIndex = LESSON_TABS.findIndex(({ key }) => key === current);
      return LESSON_TABS[(activeIndex + delta + LESSON_TABS.length) % LESSON_TABS.length].key;
    });
  };

  useEffect(() => {
    if (!lesson) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        moveTab(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        moveTab(-1);
        return;
      }
      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= LESSON_TABS.length) {
        setTab(LESSON_TABS[digit - 1].key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lesson, onClose]);

  if (!lesson) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="practice-lesson-overlay" onClick={handleBackdropClick} role="presentation">
      <section aria-label={`Lesson: ${topic.title}`} className="practice-lesson-panel" role="dialog">
        <header className="practice-lesson-header">
          <div>
            <p className="practice-lesson-kicker">
              lesson {String(index + 1).padStart(2, "0")}
              {typeof topic.complexity === "number" && ` · ${topic.complexity}/5`}
            </p>
            <h2>{topic.title}</h2>
          </div>
          <button
            aria-label="Close lesson"
            className="practice-lesson-close"
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        {topic.objectives && topic.objectives.length > 0 && (
          <div className="practice-lesson-objectives">
            <span>objectives</span>
            <ul>
              {topic.objectives.map((objective) => <li key={objective}>{objective}</li>)}
            </ul>
          </div>
        )}

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
            ? <ul>{lesson.pitfalls.map((pitfall) => <li key={pitfall}>{pitfall}</li>)}</ul>
            : <p>{lesson[tab]}</p>}
        </div>

        {topic.examples && topic.examples.length > 0 && (
          <div className="practice-lesson-examples">
            <h3>examples</h3>
            {topic.examples.map((example) => (
              <ExampleFigure example={example} key={example.title} />
            ))}
          </div>
        )}

        {topic.references && topic.references.length > 0 && (
          <footer className="practice-lesson-footer">
            <span>sources: {topic.references.join(" · ")}</span>
            <span className="practice-lesson-hint">
              <kbd>←</kbd> <kbd>→</kbd> tabs · <kbd>esc</kbd> closes
            </span>
          </footer>
        )}
      </section>
    </div>
  );
}

function ExampleFigure({ example }: { example: LessonExample }) {
  const [copied, setCopied] = useState(false);

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
    <figure className="practice-example" key={example.title}>
      <figcaption>{example.title}</figcaption>
      <div className="practice-example-code">
        <button
          aria-label="Copy code"
          className={`practice-example-copy${copied ? " is-copied" : ""}`}
          type="button"
          onClick={handleCopy}
        >
          {copied ? "copied" : "copy"}
        </button>
        <pre><code>{example.code}</code></pre>
      </div>
      <p>{example.explanation}</p>
    </figure>
  );
}
