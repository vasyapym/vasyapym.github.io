import type { ProjectModule } from "../../contracts/project-module";

const practiceMap: ProjectModule = {
  id: "practice-map",
  title: "Practice Map",
  eyebrow: "A working map for technical practice",
  description: "Keep concepts, small exercises, and useful things to revisit in one quiet place.",
  technologies: ["React", "TypeScript", "Local state"],
  status: "available",
  accent: "blue",
  loadPage: () => import("./web/PracticeMapPage"),
};

export default practiceMap;
