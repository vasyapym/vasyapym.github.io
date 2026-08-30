import type { ProjectModule } from "../../contracts/project-module";

const explosionLuna: ProjectModule = {
  id: "explosion",
  title: "Explosion",
  tag: "physics",
  eyebrow: "interactive · three.js",
  description:
    "a paper-lantern moon that detonates into the 600 shards it is built from — physics runs in fragment shaders on the gpu, not the cpu. click to blast, click to restore.",
  technologies: ["React 19", "three.js", "GPGPU", "Rust", "WebAudio"],
  status: "available",
  accent: "red",
  presentation: {
    className: "presentation-explosion-luna",
    motion: "stack",
    centerLabel: "L / X",
    centerMark: "blast",
    note: "paper moon, mid-blast",
    motionLabel: "the lantern breaks",
    instruction: "open the ember lantern and click the paper moon to shatter it",
    parts: [],
  },
  loadPage: () => import("./web/ExplosionLunaPage"),
};

export default explosionLuna;
