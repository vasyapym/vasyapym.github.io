import type { ProjectModule } from "../../contracts/project-module";

const eveningForest: ProjectModule = {
  id: "evening-forest",
  title: "Evening Forest",
  tag: "walk",
  eyebrow: "A cozy first-person stroll at dusk",
  description:
    "Wander an 8-bit woodland at dusk — no missions, just the walk.",
  technologies: [
    "React Three Fiber",
    "Three.js",
    "TypeScript",
    "Custom shaders",
    "Procedural animation",
    "WebAudio",
  ],
  status: "available",
  accent: "amber",
  links: [
    {
      label: "GitHub repository",
      href: "https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/evening-forest",
      external: true,
    },
  ],
  presentation: {
    className: "presentation-evening-forest",
    motion: "terrain",
    centerLabel: "E / F",
    centerMark: "fox",
    note: "The long dusk",
    motionLabel: "the canopy breathes",
    instruction:
      "Walk with WASD and the mouse on desktop, or two thumbs on a phone; Esc (or Rest) brings you back here.",
    parts: [],
  },
  loadPage: () => import("./web/EveningForestPage"),
};

export default eveningForest;
