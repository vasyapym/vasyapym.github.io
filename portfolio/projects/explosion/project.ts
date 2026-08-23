import type { ProjectModule } from "../../contracts/project-module";
import { detonate } from "./web/detonate";

const explosionLuna: ProjectModule = {
  id: "explosion_luna",
  title: "Explosion Luna",
  tag: "test",
  eyebrow: "Unlisted kinetic specimen",
  description:
    "A hidden stress test for the project index. Click the card and the scene breaks open at the point of impact, with no route change.",
  technologies: ["Three.js", "WebGL", "TypeScript"],
  status: "available",
  accent: "red",
  presentation: {
    className: "presentation-explosion-luna",
    motion: "stack",
    centerLabel: "L / X",
    centerMark: "generic",
    note: "Impact test / repeatable",
    motionLabel: "the specimen fractures",
    instruction: "Click the card to detonate the specimen at the point of impact.",
    parts: [
      {
        id: "luna-shell",
        label: "Luna shell",
        className: "presentation-part-luna-shell",
        anchorX: -50,
        anchorY: -18,
        mark: "contours",
        scatterX: -92,
        scatterY: -48,
        scatterZ: 80,
        baseZ: 18,
        rotation: -8,
      },
      {
        id: "luna-shards",
        label: "Shard constellation",
        className: "presentation-part-luna-shards",
        anchorX: 52,
        anchorY: -28,
        mark: "nodes",
        scatterX: 94,
        scatterY: -42,
        scatterZ: 62,
        baseZ: 30,
        rotation: 7,
      },
      {
        id: "luna-ring",
        label: "Impact ring",
        className: "presentation-part-luna-ring",
        anchorX: 18,
        anchorY: 34,
        mark: "route",
        scatterX: 34,
        scatterY: 86,
        scatterZ: 94,
        baseZ: 42,
        rotation: -5,
      },
      {
        id: "luna-core",
        label: "Luna core",
        className: "presentation-part-luna-core",
        anchorX: -82,
        anchorY: 42,
        mark: "type",
        markLabel: "LX",
        scatterX: -116,
        scatterY: 74,
        scatterZ: 70,
        baseZ: 38,
        rotation: 12,
      },
    ],
  },
  loadPage: () => import("./web/ExplosionLunaPage"),
  onCardActivate: ({ x, y, shakeScreen }) => {
    if (detonate({ x, y })) {
      shakeScreen();
    }
  },
};

export default explosionLuna;
