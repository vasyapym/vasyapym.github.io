import type { ProjectModule } from "../../contracts/project-module";

const explosionLuna: ProjectModule = {
  id: "explosion",
  title: "Explosion",
  tag: "physics",
  eyebrow: "interactive · three.js",
  description:
    "a paper-lantern moon detonates into 600 shards, living ink shocked into vortices, a ceramic seal split by ember light — three gpu experiments in fragment shaders. click to blast.",
  technologies: ["React 19", "three.js", "GPGPU", "Navier–Stokes", "Rust", "WebAudio"],
  status: "available",
  accent: "red",
  presentation: {
    className: "presentation-explosion-luna",
    motion: "stack",
    centerLabel: "L / X",
    centerMark: "blast",
    note: "paper moon, mid-blast",
    motionLabel: "the lantern breaks",
    instruction: "open a mode — the ember lantern or the ink pool — and detonate it",
    parts: [],
  },
  loadPage: () => import("./web/ExplosionLunaPage"),
};

export default explosionLuna;
