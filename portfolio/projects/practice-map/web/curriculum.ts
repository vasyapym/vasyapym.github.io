export type TopicStatus = "queued" | "in-progress" | "revisit" | "applied";

export type FeedbackKind =
  | "clear"
  | "too-broad"
  | "too-abstract"
  | "already-familiar"
  | "needs-example"
  | "needs-exercise";

export type TopicCard = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly concepts: readonly string[];
  readonly practicePrompt: string;
  readonly checkPrompt: string;
};

export type PracticeArea = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly topics: readonly TopicCard[];
};

export const FEEDBACK_LABELS: Readonly<Record<FeedbackKind, string>> = {
  clear: "Clear",
  "too-broad": "Too broad",
  "too-abstract": "Too abstract",
  "already-familiar": "Already familiar",
  "needs-example": "Needs an example",
  "needs-exercise": "Needs an exercise",
};

const dockerTopics: readonly TopicCard[] = [
  {
    id: "docker-images-containers",
    title: "Images and containers",
    summary: "Build a useful mental model for the difference between an image and a running container.",
    concepts: ["image", "container", "process"],
    practicePrompt: "Run a small container, inspect it, stop it, and start a new one from the same image.",
    checkPrompt: "Explain what an image provides and what changes when a container starts.",
  },
  {
    id: "dockerfile",
    title: "Dockerfile",
    summary: "Turn a short build description into an image you can run and inspect.",
    concepts: ["build context", "layers", "CMD"],
    practicePrompt: "Write a minimal Dockerfile for a tiny application and build it locally.",
    checkPrompt: "Point to the instructions that choose the base, copy files, and define the default process.",
  },
  {
    id: "docker-ports-networking",
    title: "Ports and networking",
    summary: "Separate a port inside a container from the port published on the host.",
    concepts: ["localhost", "port mapping", "network"],
    practicePrompt: "Run a small HTTP service and reach it from the host through a published port.",
    checkPrompt: "Explain why localhost inside a container is not the same place as localhost on the host.",
  },
  {
    id: "docker-volumes",
    title: "Volumes and persistence",
    summary: "Keep application data separate from the short-lived container that uses it.",
    concepts: ["volume", "mount", "persistence"],
    practicePrompt: "Write data to a mounted volume, remove the container, and read the data from a replacement.",
    checkPrompt: "Describe which data should survive a container replacement and where it lives.",
  },
  {
    id: "docker-compose",
    title: "Docker Compose",
    summary: "Describe several related services as one local environment.",
    concepts: ["service", "network", "compose file"],
    practicePrompt: "Run an application and its dependency with one Compose file and one command.",
    checkPrompt: "Explain the roles of services, networks, and volumes in the example.",
  },
  {
    id: "docker-configuration",
    title: "Environment and configuration",
    summary: "Keep runtime configuration out of the image so the same build can travel between environments.",
    concepts: ["environment variable", "runtime", "secret"],
    practicePrompt: "Pass a configuration value into a container and observe it from the running process.",
    checkPrompt: "Separate build-time inputs from runtime configuration and identify what should not enter source control.",
  },
  {
    id: "docker-logs-debugging",
    title: "Logs and debugging",
    summary: "Use container state, output, and exit codes to find the next useful clue.",
    concepts: ["logs", "exit code", "inspect"],
    practicePrompt: "Break a small container intentionally, then diagnose it from its status and logs.",
    checkPrompt: "Describe a short sequence for deciding whether the problem is the image, command, configuration, or dependency.",
  },
  {
    id: "docker-image-layers",
    title: "Image size and layers",
    summary: "See how Dockerfile order affects cache reuse and the amount of material in an image.",
    concepts: ["layer", "cache", "build context"],
    practicePrompt: "Build two versions of a small image and compare their layers and build behavior.",
    checkPrompt: "Explain one change that would improve cache reuse and one that would reduce unnecessary context.",
  },
];

export const curriculum: readonly PracticeArea[] = [
  {
    id: "docker",
    title: "Docker",
    description: "A practical map of images, containers, local services, and the boundaries between them.",
    topics: dockerTopics,
  },
];
