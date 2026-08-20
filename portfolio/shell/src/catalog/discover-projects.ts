import type { ProjectModule } from "../../../contracts/project-module";

type ProjectEntry = {
  default: ProjectModule;
};

// The project directory is the single source of truth for the landing collection.
const entries = import.meta.glob("../../../projects/*/project.ts", {
  eager: true,
}) as Record<string, ProjectEntry>;

const discoveredProjects = Object.values(entries)
  .map((entry) => entry.default)
  .sort((left, right) => left.title.localeCompare(right.title));

const projectIds = new Set<string>();
for (const project of discoveredProjects) {
  if (projectIds.has(project.id)) {
    throw new Error(`Duplicate project id discovered: ${project.id}`);
  }
  projectIds.add(project.id);
}

export const projectModules = discoveredProjects;

export function findProject(id: string): ProjectModule | undefined {
  return projectModules.find((project) => project.id === id);
}
