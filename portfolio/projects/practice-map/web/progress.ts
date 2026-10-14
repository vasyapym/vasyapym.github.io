import type {
  FeedbackKind,
  PracticeArea,
} from "./curriculum";

export type TopicProgress = {
  readonly feedback: readonly FeedbackKind[];
  readonly note: string;
};

export type PracticeState = {
  readonly topics: Readonly<Record<string, TopicProgress>>;
};

const STORAGE_KEY = "practice-map:progress:v1";

const FEEDBACK_KINDS: readonly FeedbackKind[] = [
  "clear",
  "too-broad",
  "too-abstract",
  "already-familiar",
  "needs-example",
  "needs-exercise",
];

export function createInitialState(areas: readonly PracticeArea[]): PracticeState {
  const topics: Record<string, TopicProgress> = {};

  for (const area of areas) {
    for (const topic of area.topics) {
      topics[topic.id] = {
        feedback: [],
        note: "",
      };
    }
  }

  return { topics };
}

export function loadPracticeState(areas: readonly PracticeArea[]): PracticeState {
  const initial = createInitialState(areas);

  if (typeof window === "undefined") {
    return initial;
  }

  try {
    const stored = JSON.parse(readStateRaw() ?? "null") as {
      topics?: Record<string, Partial<TopicProgress>>;
    } | null;

    if (!stored?.topics) {
      return initial;
    }

    const topics = { ...initial.topics };
    for (const topicId of Object.keys(topics)) {
      const saved = stored.topics[topicId];
      if (!saved) {
        continue;
      }

      topics[topicId] = {
        feedback: Array.isArray(saved.feedback)
          ? saved.feedback.filter(isFeedbackKind)
          : topics[topicId].feedback,
        note: typeof saved.note === "string" ? saved.note : topics[topicId].note,
      };
    }

    return { topics };
  } catch {
    return initial;
  }
}

export function savePracticeState(state: PracticeState) {
  if (typeof window === "undefined") {
    return;
  }

  // Quota guard (NQ01, owner report: Edge Windows + iOS Safari "hit a snag"):
  // once the shared-origin localStorage is full, this write used to throw
  // inside the mount effect and the page's error boundary killed the whole
  // project view. The progress blob is tiny (~16KB), the memory is what is
  // full (free-reading full-text blobs + shared-origin tenants), so the
  // correct behavior is the same degradation freeReading/scrollProgress
  // already use: keep the state for this session, never kill the page.
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    practiceStateMemoryFallback.delete(STORAGE_KEY);
  } catch {
    practiceStateMemoryFallback.set(STORAGE_KEY, JSON.stringify(state));
  }
}

// load reads through to the fallback so a session-only state survives
// re-renders even when nothing can be persisted.
const practiceStateMemoryFallback = new Map<string, string>();

function readStateRaw(): string | null {
  if (practiceStateMemoryFallback.has(STORAGE_KEY)) {
    return practiceStateMemoryFallback.get(STORAGE_KEY) as string;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function toggleTopicFeedback(
  state: PracticeState,
  topicId: string,
  feedback: FeedbackKind,
): PracticeState {
  const current = state.topics[topicId];
  if (!current) {
    return state;
  }

  const hasFeedback = current.feedback.includes(feedback);
  const nextFeedback = hasFeedback
    ? current.feedback.filter((item) => item !== feedback)
    : [...current.feedback, feedback];

  return {
    topics: {
      ...state.topics,
      [topicId]: { ...current, feedback: nextFeedback },
    },
  };
}

export function setTopicNote(
  state: PracticeState,
  topicId: string,
  note: string,
): PracticeState {
  const current = state.topics[topicId];
  if (!current) {
    return state;
  }

  return {
    topics: {
      ...state.topics,
      [topicId]: { ...current, note },
    },
  };
}

export function formatFeedback(
  areas: readonly PracticeArea[],
  state: PracticeState,
  labels: Readonly<Record<FeedbackKind, string>>,
): string {
  const lines = ["Waste of tokens / review notes", ""];
  let feedbackCount = 0;

  for (const area of areas) {
    for (const topic of area.topics) {
      const progress = state.topics[topic.id];
      if (!progress || (progress.feedback.length === 0 && progress.note.trim() === "")) {
        continue;
      }

      feedbackCount += 1;
      lines.push(`${area.title} / ${topic.title}`);
      if (progress.feedback.length > 0) {
        lines.push(`feedback: ${progress.feedback.map((item) => labels[item]).join(", ")}`);
      }
      if (progress.note.trim()) {
        lines.push(`note: ${progress.note.trim()}`);
      }
      lines.push("");
    }
  }

  return feedbackCount > 0 ? lines.join("\n").trim() : "No feedback captured yet.";
}

function isFeedbackKind(value: unknown): value is FeedbackKind {
  return typeof value === "string" && FEEDBACK_KINDS.includes(value as FeedbackKind);
}
