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
  type PracticeArea,
  type TopicCard as TopicCardDefinition,
  type TopicStatus,
} from "./curriculum";
import {
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
  queued: "Queued",
  "in-progress": "In progress",
  revisit: "Revisit",
  applied: "Applied",
};

const LESSON_TABS = [
  { key: "problem", label: "Проблема" },
  { key: "model", label: "Модель" },
  { key: "mechanics", label: "Механика" },
  { key: "pitfalls", label: "Грабли" },
  { key: "whenNot", label: "Когда НЕ применять" },
] as const;

type LessonTabKey = (typeof LESSON_TABS)[number]["key"];

export default function PracticeMapPage() {
  const [activeAreaId, setActiveAreaId] = useState(curriculum[0]?.id ?? "");
  const [state, setState] = useState<PracticeState>(() => loadPracticeState(curriculum));
  const [copied, setCopied] = useState(false);

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
    <section className="practice-map-page section-shell" aria-labelledby="practice-map-title">
      <header className="practice-map-hero">
        <div className="practice-map-hero-copy">
          <p className="eyebrow practice-map-eyebrow">Practice Map · technical practice</p>
          <h1 id="practice-map-title">
            Practice technical
            <span>ideas.</span>
          </h1>
          <p className="practice-map-intro">
            Concepts, exercises, and notes worth revisiting.
          </p>
        </div>
        <div className="practice-map-hero-note">
          <button className="practice-map-export" type="button" onClick={handleCopyFeedback}>
            {copied ? "Review notes copied" : "Copy review notes"}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <section className="practice-summary" aria-label="Practice summary">
        <SummaryMetric label="Cards" value={summary.total} />
        <SummaryMetric label="In progress" value={summary.inProgress} />
        <SummaryMetric label="Applied" value={summary.applied} />
        <SummaryMetric label="Revisit" value={summary.revisit} />
      </section>

      <div className="practice-map-layout">
        <aside className="practice-area-nav" aria-label="Practice areas">
          <div className="practice-area-nav-heading">
            <span>Areas</span>
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
          <PracticeAreaView area={activeArea} state={state} onChange={updateState} />
        )}
      </div>

      <footer className="practice-map-footer">
        <span>Local notes · no account · change the map as the work changes</span>
        <span>{summary.queued} queued</span>
      </footer>
    </section>
  );
}

function PracticeAreaView({
  area,
  state,
  onChange,
}: {
  area: PracticeArea;
  state: PracticeState;
  onChange: (state: PracticeState) => void;
}) {
  const summary = summarizePractice([area], state);

  return (
    <section className="practice-area-view" aria-labelledby="practice-area-title">
      <div className="practice-area-heading">
        <div>
          <p className="practice-area-kicker">Working map</p>
          <h2 id="practice-area-title">{area.title}</h2>
          <p>{area.description}</p>
        </div>
        <span className="practice-area-count">
          {summary.applied} applied · {summary.revisit} to revisit
        </span>
      </div>

      <div className="practice-topic-grid">
        {area.topics.map((topic, index) => (
          <TopicCard
            key={topic.id}
            index={index}
            progress={state.topics[topic.id]}
            topic={topic}
            onChange={onChange}
            state={state}
          />
        ))}
      </div>
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
          Открыть урок
          <span aria-hidden="true">→</span>
        </button>
      )}

      <details className="practice-topic-details">
        <summary>Practice path</summary>
        <div>
          <p><strong>Try</strong>{topic.practicePrompt}</p>
          <p><strong>Check</strong>{topic.checkPrompt}</p>
        </div>
      </details>

      <div className="practice-topic-controls">
        <label>
          <span>Status</span>
          <select aria-label={`Status for ${topic.title}`} value={progress.status} onChange={handleStatusChange}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <details className="practice-topic-feedback">
        <summary>Leave feedback</summary>
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
            <span>Note for the next pass</span>
            <textarea
              value={progress.note}
              onChange={(event) => updateNote(event.target.value)}
              placeholder="What should become clearer, narrower, or more useful?"
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

  useEffect(() => {
    if (!lesson) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
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
      <section aria-label={`Урок: ${topic.title}`} className="practice-lesson-panel" role="dialog">
        <header className="practice-lesson-header">
          <div>
            <p className="practice-lesson-kicker">
              Урок {String(index + 1).padStart(2, "0")}
              {typeof topic.complexity === "number" && ` · сложность ${topic.complexity}/5`}
            </p>
            <h2>{topic.title}</h2>
          </div>
          <button
            aria-label="Закрыть урок"
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
            <span>Цели урока</span>
            <ul>
              {topic.objectives.map((objective) => <li key={objective}>{objective}</li>)}
            </ul>
          </div>
        )}

        <div aria-label="Разделы урока" className="practice-lesson-tabs">
          {LESSON_TABS.map(({ key, label }) => (
            <button
              className={tab === key ? "is-active" : ""}
              key={key}
              type="button"
              onClick={() => setTab(key)}
            >
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
            <h3>Практика</h3>
            {topic.examples.map((example) => (
              <figure className="practice-example" key={example.title}>
                <figcaption>{example.title}</figcaption>
                <pre><code>{example.code}</code></pre>
                <p>{example.explanation}</p>
              </figure>
            ))}
          </div>
        )}

        {topic.references && topic.references.length > 0 && (
          <footer className="practice-lesson-footer">
            <span>Источники: {topic.references.join(" · ")}</span>
          </footer>
        )}
      </section>
    </div>
  );
}
