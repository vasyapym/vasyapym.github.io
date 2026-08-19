import type {
  FeedbackKind,
  PracticeArea,
  TopicStatus,
} from "./curriculum";

export type TopicProgress = {
  readonly status: TopicStatus;
  readonly feedback: readonly FeedbackKind[];
  readonly note: string;
};

export type PracticeState = {
  readonly topics: Readonly<Record<string, TopicProgress>>;
};

export type PracticeSummary = {
  total: number;
  queued: number;
  inProgress: number;
  revisit: number;
  applied: number;
};

const STORAGE_KEY = "practice-map:progress:v1";

const TOPIC_STATUSES: readonly TopicStatus[] = [
  "queued",
  "in-progress",
  "revisit",
  "applied",
];

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
        status: "queued",
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
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as {
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
        status: isTopicStatus(saved.status) ? saved.status : topics[topicId].status,
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

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function setTopicStatus(
  state: PracticeState,
  topicId: string,
  status: TopicStatus,
): PracticeState {
  const current = state.topics[topicId];
  if (!current) {
    return state;
  }

  return {
    topics: {
      ...state.topics,
      [topicId]: { ...current, status },
    },
  };
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

export function summarizePractice(
  areas: readonly PracticeArea[],
  state: PracticeState,
): PracticeSummary {
  const summary: PracticeSummary = {
    total: 0,
    queued: 0,
    inProgress: 0,
    revisit: 0,
    applied: 0,
  };

  for (const area of areas) {
    for (const topic of area.topics) {
      summary.total += 1;
      const status = state.topics[topic.id]?.status ?? "queued";
      summary[statusSummaryKey(status)] += 1;
    }
  }

  return summary;
}

export function formatFeedback(
  areas: readonly PracticeArea[],
  state: PracticeState,
  labels: Readonly<Record<FeedbackKind, string>>,
): string {
  const lines = ["Practice Map / review notes", ""];
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

function isTopicStatus(value: unknown): value is TopicStatus {
  return typeof value === "string" && TOPIC_STATUSES.includes(value as TopicStatus);
}

function isFeedbackKind(value: unknown): value is FeedbackKind {
  return typeof value === "string" && FEEDBACK_KINDS.includes(value as FeedbackKind);
}

function statusSummaryKey(status: TopicStatus): keyof Omit<PracticeSummary, "total"> {
  if (status === "in-progress") {
    return "inProgress";
  }

  return status;
}
