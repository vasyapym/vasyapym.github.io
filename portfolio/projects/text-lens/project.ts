import type { ProjectModule } from "../../contracts/project-module";
const textLens: ProjectModule = {
  id: "text-lens",
  title: "Text Lens",
  eyebrow: "A small reading instrument",
  description: "Paste in a piece of writing and get a clear signal on its shape, pace, and most repeated ideas.",
  technologies: ["React", "TypeScript", "Go"],
  status: "available",
  accent: "coral",
  loadPage: () => import("./web/TextLensPage"),
};

export default textLens;
