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
    parts: [
      {
        id: "blast-field",
        label: "Blast field",
        className: "presentation-part-blast-field",
        anchorX: 6,
        anchorY: 2,
        mark: "contours",
        scatterX: 80,
        scatterY: 40,
        scatterZ: 70,
        baseZ: 10,
        rotation: 4,
      },
      {
        id: "shock-ring",
        label: "Shock ring",
        className: "presentation-part-shock-ring",
        anchorX: 72,
        anchorY: 42,
        mark: "compass",
        scatterX: 70,
        scatterY: 60,
        scatterZ: 80,
        baseZ: 36,
        rotation: -12,
      },
    ],
  },
  loadPage: () => import("./web/ExplosionLunaPage"),
};

export default explosionLuna;
