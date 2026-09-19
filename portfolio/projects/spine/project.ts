import type { ProjectModule } from "../../contracts/project-module";

const spine: ProjectModule = {
  id: "spine",
  title: "Spine",
  tag: "layout engine",
  eyebrow: "live layout · Go → WebAssembly",
  description:
    "Drag, nest and retune Flexbox and Grid containers in real time — a Go-to-WebAssembly engine with undo/redo and clean HTML/CSS export.",
  technologies: ["Go", "WebAssembly", "Flexbox & Grid", "syscall/js"],
  status: "available",
  accent: "steel",
  presentation: {
    className: "presentation-spine",
    motion: "stack",
    centerLabel: "F/G",
    centerMark: "spine",
    note: "the boxes hold the spine",
    motionLabel: "the layout reflows",
    instruction: "drag containers, tune flex and grid, copy the CSS",
    parts: [],
  },
  loadPage: () => import("./web/SpinePage"),
};

export default spine;
