import type { ComponentType } from "react";
import type { ProjectPresentation } from "./project-presentation";

export type ProjectStatus = "available" | "in-progress";

export interface ProjectModule {
  readonly id: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly technologies: readonly string[];
  readonly status: ProjectStatus;
  readonly accent: string;
  readonly presentation: ProjectPresentation;
  readonly loadPage: () => Promise<{ default: ComponentType }>;
}
