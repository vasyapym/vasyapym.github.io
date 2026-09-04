import type { ProjectModule } from "../../contracts/project-module";

const explosionLuna: ProjectModule = {
  id: "explosion",
  title: "Explosion",
  tag: "physics",
  eyebrow: "interactive · three.js",
  description:
    "two experiments in one dark room: a paper-lantern moon that detonates into the 600 shards it is built from — physics runs in fragment shaders on the gpu — and a pool of living ink you shock into vortices with a navier–stokes solver. click to blast; click to restore.",
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
