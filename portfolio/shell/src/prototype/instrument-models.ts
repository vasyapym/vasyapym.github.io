export type PartId = string;

export type PartMarkKind =
  | "lines"
  | "nodes"
  | "frame"
  | "type"
  | "spine"
  | "branches"
  | "stack"
  | "route"
  | "pin"
  | "contours"
  | "compass";

export type InstrumentMotion = "stack" | "network" | "terrain";
export type InstrumentCenter = "lens" | "graph" | "compass" | "generic";

export type PartDefinition = {
  id: PartId;
  label: string;
  className: string;
  anchorX: number;
  anchorY: number;
  mark: PartMarkKind;
  markLabel?: string;
  scatterX: number;
  scatterY: number;
  scatterZ: number;
  baseZ: number;
  rotation: number;
};

export type InstrumentModel = {
  className: string;
  motion: InstrumentMotion;
  centerLabel: string;
  centerMark: InstrumentCenter;
  hasBackplate: boolean;
  note: string;
  motionLabel: string;
  instruction: string;
  parts: readonly PartDefinition[];
};

const TEXT_LENS_PARTS: readonly PartDefinition[] = [
  {
    id: "sheet",
    label: "Text sheet",
    className: "artifact-part-sheet",
    anchorX: -12,
    anchorY: -6,
    mark: "lines",
    scatterX: -118,
    scatterY: -58,
    scatterZ: 96,
    baseZ: 14,
    rotation: -8,
  },
  {
    id: "frame",
    label: "Metal frame",
    className: "artifact-part-frame",
    anchorX: 4,
    anchorY: -2,
    mark: "frame",
    scatterX: 126,
    scatterY: -38,
    scatterZ: 54,
    baseZ: 28,
    rotation: 7,
  },
  {
    id: "type",
    label: "Typographic plate",
    className: "artifact-part-type",
    anchorX: 18,
    anchorY: 22,
    mark: "type",
    scatterX: 82,
    scatterY: 88,
    scatterZ: 122,
    baseZ: 44,
    rotation: -3,
  },
  {
    id: "spine",
    label: "Binding spine",
    className: "artifact-part-spine",
    anchorX: -26,
    anchorY: 12,
    mark: "spine",
    scatterX: -132,
    scatterY: 74,
    scatterZ: 72,
    baseZ: 36,
    rotation: 13,
  },
];

const CODE_LAYOUT_PARTS: readonly PartDefinition[] = [
  {
    id: "nodes",
    label: "Declaration nodes",
    className: "artifact-part-code-nodes",
    anchorX: -72,
    anchorY: -18,
    mark: "nodes",
    scatterX: -116,
    scatterY: -45,
    scatterZ: 92,
    baseZ: 12,
    rotation: -8,
  },
  {
    id: "rail",
    label: "Dependency rail",
    className: "artifact-part-code-rail",
    anchorX: 74,
    anchorY: -18,
    mark: "branches",
    scatterX: 116,
    scatterY: -42,
    scatterZ: 62,
    baseZ: 30,
    rotation: 6,
  },
  {
    id: "source",
    label: "Source block",
    className: "artifact-part-code-source",
    anchorX: 24,
    anchorY: 56,
    mark: "stack",
    scatterX: 10,
    scatterY: 96,
    scatterZ: 124,
    baseZ: 44,
    rotation: -3,
  },
  {
    id: "entry",
    label: "Entry point",
    className: "artifact-part-code-entry",
    anchorX: -84,
    anchorY: 48,
    mark: "type",
    markLabel: "fn()",
    scatterX: -124,
    scatterY: 76,
    scatterZ: 78,
    baseZ: 38,
    rotation: 14,
  },
];

const PRACTICE_MAP_PARTS: readonly PartDefinition[] = [
  {
    id: "terrain",
    label: "Practice terrain",
    className: "artifact-part-map-terrain",
    anchorX: -20,
    anchorY: -8,
    mark: "contours",
    scatterX: -92,
    scatterY: -46,
    scatterZ: 108,
    baseZ: 8,
    rotation: -7,
  },
  {
    id: "route",
    label: "Practice route",
    className: "artifact-part-map-route",
    anchorX: 35,
    anchorY: 22,
    mark: "route",
    scatterX: 90,
    scatterY: -35,
    scatterZ: 66,
    baseZ: 28,
    rotation: 8,
  },
  {
    id: "waypoint",
    label: "Next waypoint",
    className: "artifact-part-map-pin",
    anchorX: 94,
    anchorY: -38,
    mark: "pin",
    scatterX: 66,
    scatterY: 88,
    scatterZ: 132,
    baseZ: 52,
    rotation: 4,
  },
  {
    id: "compass",
    label: "Direction dial",
    className: "artifact-part-map-compass",
    anchorX: -88,
    anchorY: 46,
    mark: "compass",
    scatterX: -124,
    scatterY: 70,
    scatterZ: 84,
    baseZ: 36,
    rotation: -12,
  },
];

const GENERIC_PARTS: readonly PartDefinition[] = [
  {
    id: "object",
    label: "Project object",
    className: "artifact-part-generic",
    anchorX: 0,
    anchorY: 0,
    mark: "type",
    markLabel: "P / I",
    scatterX: -76,
    scatterY: -54,
    scatterZ: 82,
    baseZ: 16,
    rotation: -6,
  },
];

const DEFAULT_INSTRUMENT_MODEL: InstrumentModel = {
  className: "assembly-field-generic",
  motion: "stack",
  centerLabel: "P / I",
  centerMark: "generic",
  hasBackplate: false,
  note: "Project / unfinished instrument",
  motionLabel: "Scroll to settle the object",
  instruction: "Drag the object to inspect it, or use the arrow keys when it is focused.",
  parts: GENERIC_PARTS,
};

const INSTRUMENT_MODELS: Readonly<Record<string, InstrumentModel>> = {
  "text-lens": {
    className: "assembly-field-text-lens",
    motion: "stack",
    centerLabel: "T / L",
    centerMark: "lens",
    hasBackplate: true,
    note: "Text Lens / reading folio",
    motionLabel: "Scroll to stack the pages",
    instruction: "Drag a page or plate to inspect the folio. Scroll to stack its signals, or use the arrow keys when a part is focused.",
    parts: TEXT_LENS_PARTS,
  },
  "code-layout": {
    className: "assembly-field-code-layout",
    motion: "network",
    centerLabel: "C / L",
    centerMark: "graph",
    hasBackplate: false,
    note: "Code Layout / structure map",
    motionLabel: "Scroll to connect the structure",
    instruction: "Drag a node or rail to inspect the structure. Scroll to connect its relationships, or use the arrow keys when a part is focused.",
    parts: CODE_LAYOUT_PARTS,
  },
  "practice-map": {
    className: "assembly-field-practice-map",
    motion: "terrain",
    centerLabel: "P / M",
    centerMark: "compass",
    hasBackplate: false,
    note: "Practice Map / working terrain",
    motionLabel: "Scroll to unfold the route",
    instruction: "Drag the route or waypoint to inspect the terrain. Scroll to unfold the next path, or use the arrow keys when a part is focused.",
    parts: PRACTICE_MAP_PARTS,
  },
};

export function getInstrumentModel(projectId: string): InstrumentModel {
  return INSTRUMENT_MODELS[projectId] ?? DEFAULT_INSTRUMENT_MODEL;
}
