export type ProjectPartId = string;

export type ProjectPartMark =
  | "nodes"
  | "type"
  | "branches"
  | "stack"
  | "route"
  | "pin"
  | "contours"
  | "compass";

export type ProjectMotion = "stack" | "network" | "terrain";
export type ProjectCenter = "graph" | "compass" | "generic" | "kitty";

export type ProjectPresentationPart = {
  readonly id: ProjectPartId;
  readonly label: string;
  readonly className: string;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly mark: ProjectPartMark;
  readonly markLabel?: string;
  readonly scatterX: number;
  readonly scatterY: number;
  readonly scatterZ: number;
  readonly baseZ: number;
  readonly rotation: number;
};

export type ProjectPresentation = {
  readonly className: string;
  readonly motion: ProjectMotion;
  readonly centerLabel: string;
  readonly centerMark: ProjectCenter;
  readonly note: string;
  readonly motionLabel: string;
  readonly instruction: string;
  readonly parts: readonly ProjectPresentationPart[];
};
