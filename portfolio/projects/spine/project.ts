import type { ProjectModule } from "../../contracts/project-module";

const spine: ProjectModule = {
  id: "spine",
  title: "Spine",
  tag: "layout engine",
  eyebrow: "live layout · Go → WebAssembly",
  description:
    "Drag, nest and retune Flexbox and Grid containers in real time. The layout engine runs in Go compiled to WebAssembly — with undo/redo history, clean HTML/CSS export and shareable URLs.",
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
