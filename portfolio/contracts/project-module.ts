import type { ComponentType } from "react";

export type ProjectStatus = "available" | "in-progress";

export interface ProjectModule {
  readonly id: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly technologies: readonly string[];
  readonly status: ProjectStatus;
  readonly accent: string;
  readonly loadPage: () => Promise<{ default: ComponentType }>;
}
