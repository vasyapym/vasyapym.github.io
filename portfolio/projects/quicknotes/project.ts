import type { ProjectModule } from "../../contracts/project-module";

const quicknotes: ProjectModule = {
  id: "quicknotes",
  title: "Quicknotes",
  tag: "notes",
  eyebrow: "local-first markdown · Firebase sync",
  description:
    "Fast markdown notes that live on-device and sync through Firebase — [[wiki-links]], live preview, command palette, one-button zip export.",
  technologies: ["Firebase", "Firestore", "Vanilla ES modules", "Static hosting"],
  status: "available",
  accent: "blue",
  presentation: {
    className: "presentation-quicknotes",
    motion: "stack",
    centerLabel: "Q/N",
    centerMark: "quicknotes",
    note: "the scratch buffer",
    motionLabel: "notes settle as you type",
    instruction: "open a note, type markdown, download the folder as a zip",
    parts: [],
  },
  loadPage: () => import("./web/QuicknotesPage"),
};

export default quicknotes;
