import { useEffect, useMemo, useState, type ChangeEvent } from "react";
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
          <p className="eyebrow practice-map-eyebrow">PRACTICE MAP / 001</p>
          <h1 id="practice-map-title">
            Keep useful things
            <span>in view.</span>
          </h1>
          <p className="practice-map-intro">
            A working map for concepts, small exercises, and the parts worth revisiting.
          </p>
        </div>
        <div className="practice-map-hero-note">
          <p>Feedback changes the next pass.</p>
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
