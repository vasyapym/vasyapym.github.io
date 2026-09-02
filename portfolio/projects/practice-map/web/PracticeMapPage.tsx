import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
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
import { Blocks, InlineText } from "./lib/format";

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
  const [graphOpen, setGraphOpen] = useState(false);

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
            <button className="practice-graph-open" type="button" onClick={() => setGraphOpen(true)}>
              explore concept graph <span aria-hidden="true">↗</span>
            </button>
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

      {graphOpen && <ConceptGraph onClose={() => setGraphOpen(false)} />}

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

const clampPct = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Layout parameters by canvas width. Margins must exceed half the widest
// chip (mobile chips cap at 88px wide), or centers near the clamp edge let
// labels clip past the canvas frame; node count yields to the same pressure —
// pixel spacing that cannot hold buries chips under their neighbors.
type GraphLayoutParams = {
  count: number;
  marginX: number;
  marginY: number;
  minDist: number;
};

function layoutParams(width: number): GraphLayoutParams {
  const minDist = Math.min(90, Math.max(56, width / 4));
  if (width >= 620) {
    return { count: 28, marginX: 32, marginY: 20, minDist };
  }
  if (width >= 400) {
    return { count: 20, marginX: 40, marginY: 22, minDist };
  }
  return { count: width >= 330 ? 12 : 10, marginX: 44, marginY: 24, minDist };
}

// Deterministic seed layout: golden-angle spiral on an ellipse, then
// relaxation passes in PIXEL space (chip sizes are pixel-constant, so the
// minimum spacing must be too — % space packed 45px apart on phones and
// buried chips under neighbors). No random, no rAF.
function seedLayout(
  names: readonly string[],
  width: number,
  height: number,
  params: GraphLayoutParams,
): Record<string, { x: number; y: number }> {
  const n = names.length;
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const points = names.map((_, i) => {
    const angle = i * 2.39996;
    const rf = Math.sqrt((i + 0.5) / Math.max(1, n)); // 0..~1, even fill
    const rx = 24 + 16 * rf; // 24–40%
    const ry = 26 + 14 * rf; // 26–40%
    return { x: 50 + Math.cos(angle) * rx, y: 50 + Math.sin(angle) * ry };
  });

  const minDistSq = params.minDist * params.minDist;
  const px = points.map((p) => ({ x: (p.x / 100) * w, y: (p.y / 100) * h }));
  for (let pass = 0; pass < 80; pass += 1) {
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const dx = px[j].x - px[i].x;
        const dy = px[j].y - px[i].y;
        const dSq = dx * dx + dy * dy;
        if (dSq < minDistSq) {
          const d = Math.max(0.0001, Math.sqrt(dSq));
          const push = (params.minDist - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          px[i].x -= ux * push;
          px[i].y -= uy * push;
          px[j].x += ux * push;
          px[j].y += uy * push;
        }
      }
    }
    for (let i = 0; i < n; i += 1) {
      px[i].x = clampPct(px[i].x, params.marginX, w - params.marginX);
      px[i].y = clampPct(px[i].y, params.marginY, h - params.marginY);
    }
  }

  const out: Record<string, { x: number; y: number }> = {};
  names.forEach((name, i) => {
    out[name] = { x: (px[i].x / w) * 100, y: (px[i].y / h) * 100 };
  });
  return out;
}

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

    const ranked = Array.from(topicsByConcept.keys())
      .map((name) => ({ name, degree: edges.get(name)?.size ?? 0 }))
      .sort((a, b) => b.degree - a.degree || a.name.localeCompare(b.name))
      .map((d) => d.name);

    return { topicsByConcept, edges, maxWeight, ranked };
  }, []);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const finePointer = useRef(false);
  const movedRef = useRef(false);
  const prevActiveRef = useRef<string | null>(null);
  const dragRef = useRef<
    | {
        id: string;
        pointerId: number;
        startX: number;
        startY: number;
        originX: number;
        originY: number;
      }
    | null
  >(null);

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

  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDims({ w: rect.width, h: rect.height });
    finePointer.current = window.matchMedia("(pointer: fine)").matches;
    closeRef.current?.focus();
  }, []);

  // Escape closes.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll (mirrors the lesson overlay).
  useEffect(() => {
    const scrollY = window.scrollY;
    const { body } = document;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const activeNode = activeId ? graphModel.nodeByName.get(activeId) ?? null : null;

  const neighborSet = useMemo(() => {
    if (!activeNode) return new Set<string>();
    return new Set(activeNode.mapLinks.map((e) => e.name));
  }, [activeNode]);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    name: string,
  ) => {
    const p = positions[name];
    if (!p) return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    prevActiveRef.current = activeId;
    movedRef.current = false;
    dragRef.current = {
      id: name,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: p.x,
      originY: p.y,
    };
    setDraggingId(name);
    setActiveId(name);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dxRaw = event.clientX - drag.startX;
    const dyRaw = event.clientY - drag.startY;
    if (Math.abs(dxRaw) > 4 || Math.abs(dyRaw) > 4) movedRef.current = true;
    const nx = clampPct(
      drag.originX + (dxRaw / rect.width) * 100,
      (layout.marginX / rect.width) * 100,
      100 - (layout.marginX / rect.width) * 100,
    );
    const ny = clampPct(
      drag.originY + (dyRaw / rect.height) * 100,
      (layout.marginY / rect.height) * 100,
      100 - (layout.marginY / rect.height) * 100,
    );
    setPositions((prev) => ({ ...prev, [drag.id]: { x: nx, y: ny } }));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDraggingId(null);
  };

  const handleClick = (name: string) => {
    if (movedRef.current) {
      movedRef.current = false;
      return; // a drag never toggles selection
    }
    // Toggle: tapping the already-active node clears it.
    if (prevActiveRef.current === name) setActiveId(null);
    else setActiveId(name);
  };

  const handleMouseEnter = (name: string) => {
    if (finePointer.current) setActiveId(name);
  };

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
            ✕
          </button>
        </header>
        <p className="practice-graph-intro">
          A live map of the ideas behind the route. Drag a node to inspect how the
          curriculum connects.
        </p>
        <div
          ref={canvasRef}
          className="practice-graph-canvas"
          aria-label="Interactive concept graph"
        >
          <span className="practice-graph-orbit orbit-one" />
          <span className="practice-graph-orbit orbit-two" />
          {activeNode && (
            <svg className="practice-graph-edges" aria-hidden="true">
              {activeNode.mapLinks.map((edge) => {
                const from = positions[activeNode.name];
                const to = positions[edge.name];
                if (!from || !to) return null;
                const opacity = Math.min(
                  0.9,
                  0.35 + 0.55 * (edge.weight / graphAll.maxWeight),
                );
                return (
                  <line
                    key={edge.name}
                    x1={`${from.x}%`}
                    y1={`${from.y}%`}
                    x2={`${to.x}%`}
                    y2={`${to.y}%`}
                    strokeWidth={1.5}
                    opacity={opacity}
                    style={{ stroke: "var(--ink-accent-bright)" }}
                  />
                );
              })}
            </svg>
          )}
          {graphModel.nodes.map((node, index) => {
            const p = positions[node.name];
            if (!p) return null;
            const isActive = activeId === node.name;
            const isNeighbor = neighborSet.has(node.name);
            const isDimmed = activeId != null && !isActive && !isNeighbor;
            const className = [
              "practice-graph-node",
              isActive && "is-active",
              isNeighbor && "is-neighbor",
              isDimmed && "is-dimmed",
              draggingId === node.name && "is-dragging",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={node.name}
                className={className}
                type="button"
                aria-pressed={isActive}
                style={
                  {
                    "--node-x": `${p.x}%`,
                    "--node-y": `${p.y}%`,
                    "--node-delay": `${index * 35}ms`,
                  } as CSSProperties
                }
                onPointerDown={(event) => handlePointerDown(event, node.name)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={() => handleClick(node.name)}
                onMouseEnter={() => handleMouseEnter(node.name)}
                onFocus={() => setActiveId(node.name)}
              >
                {node.name}
              </button>
            );
          })}
          <span className="practice-graph-core">
            practice
            <br />
            map
          </span>
        </div>
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
        <footer className="practice-graph-footer">
          drag nodes · tap to inspect · connections light up · a curriculum as a system
        </footer>
      </section>
    </div>,
    document.body,
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
  const [sectionIndex, setSectionIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const sectionIndexRef = useRef(0);
  const spyEnabledRef = useRef(true);
  const settleTimerRef = useRef<number>(undefined);
  const lesson = topic.lesson;
  const deep = topic.deepLesson;

  const updateProgress = () => {
    const panel = panelRef.current;
    const bar = progressRef.current;
    if (!panel || !bar) {
      return;
    }
    const max = panel.scrollHeight - panel.clientHeight;
    bar.style.opacity = max <= 4 ? "0" : "1";
    bar.style.transform = `scaleX(${max <= 4 ? 0 : Math.min(panel.scrollTop / max, 1)})`;
  };

  const goToSection = (target: number, scroll = true) => {
    const total = deep?.sections.length ?? 0;
    const next = Math.max(0, Math.min(target, total - 1));
    sectionIndexRef.current = next;
    setSectionIndex(next);
    const panel = panelRef.current;
    if (!scroll || !panel) {
      return;
    }
    // Suppress the scrollspy while the programmatic flight is in progress:
    // its last event otherwise fires before the smooth scroll settles and
    // names whichever section happened to cross the probe line last.
    spyEnabledRef.current = false;
    panel
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
    panel.addEventListener("scrollend", settle, { once: true });
    settleTimerRef.current = window.setTimeout(() => {
      panel.removeEventListener("scrollend", settle);
      settle();
    }, 1200);
  };

  const moveSection = (delta: number) => {
    goToSection(sectionIndexRef.current + delta);
  };

  const sectionTargetsRef = useRef<HTMLElement[]>([]);

  const updateActiveFromScroll = () => {
    const panel = panelRef.current;
    if (!panel || !spyEnabledRef.current) {
      return;
    }
    const panelRect = panel.getBoundingClientRect();
    if (panelRect.height === 0) {
      return;
    }
    const probeY = panelRect.top + Math.min(panelRect.height * 0.25, 260);
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
    if (!deep || !panelRef.current || typeof IntersectionObserver === "undefined") {
      return;
    }
    const panel = panelRef.current;
    sectionTargetsRef.current = Array.from(
      panel.querySelectorAll<HTMLElement>("[data-section-index]"),
    );
    const observer = new IntersectionObserver(
      () => updateActiveFromScroll(),
      { root: panel, threshold: [0, 0.25] },
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
      <section
        aria-label={`Lesson: ${topic.title}`}
        className="practice-lesson-panel"
        onScroll={updateProgress}
        ref={panelRef}
        role="dialog"
      >
        <div aria-hidden="true" className="practice-lesson-progress">
          <span ref={progressRef} />
        </div>

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
      </section>
    </div>,
    document.body,
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
