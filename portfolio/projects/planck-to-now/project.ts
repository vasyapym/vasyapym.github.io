import type { ProjectModule } from "../../contracts/project-module";

const planckToNow: ProjectModule = {
  id: "planck-to-now",
  title: "Planck to Now",
  tag: "sim",
  eyebrow: "A log-time cosmology simulation",
  description: "Scrub cosmic history — from the Planck epoch to now.",
  technologies: ["TypeScript", "Three.js", "WebGL"],
  status: "available",
  accent: "amber",
  links: [
    {
      label: "GitHub repository",
      href: "https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/planck-to-now",
      external: true,
    },
    {
      label: "Open standalone view",
      href: "/planck-to-now/",
    },
  ],
  presentation: {
    className: "presentation-planck-to-now",
    motion: "network",
    centerLabel: "B / B",
    centerMark: "spiral",
    note: "Cosmic timeline",
    motionLabel: "the universe expands",
    instruction: "Follow the timeline from the first hot particles to the cosmic web.",
    parts: [],
  },
  loadPage: () => import("./web/PlanckToNowPage"),
};

export default planckToNow;
