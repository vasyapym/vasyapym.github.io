import type { ProjectModule } from "../../contracts/project-module";

const kittyRun: ProjectModule = {
  id: "kitty-run",
  title: "Cat Runner",
  tag: "game",
  eyebrow: "A bright candy endless runner",
  description:
    "Race through four sunny districts with a white runner kitty — a bullet-time dash, a self-tuning difficulty director, and your best run chasing right beside you. Every district is generated from the run itself: same seed, same skill, same bright world.",
  technologies: [
    "React Three Fiber",
    "Three.js",
    "TypeScript",
    "Procedural vector art",
    "WebAudio",
    "Deterministic simulation",
  ],
  status: "available",
  accent: "pink",
  presentation: {
    className: "presentation-kitty-run",
    motion: "terrain",
    centerLabel: "",
    centerMark: "kitty",
    note: "Sunny circuit",
    motionLabel: "the meadow rolls by",
    instruction: "Jump with Space, dash with Shift; Esc slips you back here.",
    parts: [],
  },
  loadPage: () => import("./web/KittyRunPage"),
};

export default kittyRun;
