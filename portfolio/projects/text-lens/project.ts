import type { ProjectModule } from "../../contracts/project-module";
const textLens: ProjectModule = {
  id: "text-lens",
  title: "Линза текста",
  eyebrow: "Небольшой инструмент для чтения",
  description: "Вставьте текст и получите ясную картину его формы, темпа и самых повторяющихся идей.",
  technologies: ["React", "TypeScript", "Go"],
  status: "available",
  accent: "coral",
  loadPage: () => import("./web/TextLensPage"),
};

export default textLens;
