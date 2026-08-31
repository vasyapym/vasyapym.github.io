import type { ProjectModule } from "../../contracts/project-module";

const raftCluster: ProjectModule = {
  id: "raft-cluster",
  title: "Raft Cluster",
  tag: "distributed systems",
  eyebrow: "live consensus · Rust → WebAssembly",
  description:
    "Live Raft consensus in the browser — crash the leader and watch elections answer.",
  technologies: ["Rust", "WebAssembly", "TypeScript", "Canvas 2D"],
  status: "available",
  accent: "azure",
  presentation: {
    className: "presentation-raft-cluster",
    motion: "network",
    centerLabel: "R / C",
    centerMark: "raft",
    note: "the leader holds quorum",
    motionLabel: "the cluster elects",
    instruction: "crash the leader or cut a link, watch a new term elect",
    parts: [],
  },
  loadPage: () => import("./web/RaftPage"),
};

export default raftCluster;
