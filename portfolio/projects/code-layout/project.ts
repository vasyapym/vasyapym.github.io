import type { ProjectModule } from "../../contracts/project-module";

const codeLayout: ProjectModule = {
  id: "code-layout",
  title: "Code Layout",
  eyebrow: "A source structure tool",
  description: "Paste a source file and get a compact layout of its declarations, dependencies, and architecture for an LLM.",
  technologies: ["React", "TypeScript", "Go"],
  status: "available",
  accent: "blue",
  loadPage: () => import("./web/CodeLayoutPage"),
};

export default codeLayout;
