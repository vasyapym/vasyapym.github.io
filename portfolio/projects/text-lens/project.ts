import type { ProjectModule } from "../../contracts/project-module";
const textLens: ProjectModule = {
  id: "text-lens",
  title: "Text Lens",
  eyebrow: "A small reading tool",
  description: "Paste a draft and get a clear read on its shape, pace, and repeated ideas.",
  technologies: ["React", "TypeScript", "Go"],
  status: "available",
  accent: "blue",
  loadPage: () => import("./web/TextLensPage"),
};

export default textLens;
