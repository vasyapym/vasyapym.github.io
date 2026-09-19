import type { ProjectModule } from "../../contracts/project-module";

const practiceMap: ProjectModule = {
  id: "practice-map",
  title: "Waste of tokens",
  tag: "playground",
  eyebrow: "an archive of ai outputs, a lesson space, an open playground",
  description:
    "Model-tiered archive with an experimental lesson space and an open ai playground.",
  technologies: ["React", "TypeScript", "Local state"],
  status: "available",
  accent: "blue",
  presentation: {
    className: "presentation-practice-map",
    motion: "terrain",
    centerLabel: "W / T",
    centerMark: "matrix",
    note: "Occupancy ledger",
    motionLabel: "the wall fills up",
    instruction: "Read the wall, mark what landed, and leave the next cell for the next pass.",
    parts: [],
  },
  loadPage: () => import("./web/PracticeMapPage"),
};

export default practiceMap;
