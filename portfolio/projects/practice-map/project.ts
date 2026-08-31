import type { ProjectModule } from "../../contracts/project-module";

const practiceMap: ProjectModule = {
  id: "practice-map",
  title: "Practice Map",
  tag: "map",
  eyebrow: "A working map for technical practice",
  description: "Keep concepts, small exercises, and useful things to revisit in one quiet place.",
  technologies: ["React", "TypeScript", "Local state"],
  status: "available",
  accent: "blue",
  presentation: {
    className: "presentation-practice-map",
    motion: "terrain",
    centerLabel: "P / M",
    centerMark: "trail",
    note: "Practice route",
    motionLabel: "the route unfolds",
    instruction: "Follow a route, mark a place, and leave a note for the next pass.",
    parts: [],
  },
  loadPage: () => import("./web/PracticeMapPage"),
};

export default practiceMap;
