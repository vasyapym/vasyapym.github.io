# Selected Experiments

A portfolio shell for small experiments and self-contained projects.

The shell discovers project modules from `projects/*/project.ts`. A new project can add its own descriptor and page without adding a project-specific branch to the shell. Shared contracts live in `contracts/`, while each project's implementation stays under its own directory.

## Run the projects

In a terminal, start the React shell:

```bash
npm --prefix portfolio install
npm --prefix portfolio run dev
```

Open <http://localhost:5173>. The solid field index is the main route; Planck to Now, Practice Map, Raft Cluster, Evening Forest, and Cat Runner are available from the project list. Direct routes are <http://localhost:5173/projects/planck-to-now>, <http://localhost:5173/projects/practice-map>, <http://localhost:5173/projects/raft-cluster>, <http://localhost:5173/projects/evening-forest>, and <http://localhost:5173/projects/kitty-run>. The older Assembly field comparison remains available at `/?prototype=room` and `/?prototype=field`. The shell runs on port `5173`.

Raft Cluster is fully client-side: its Rust consensus core is compiled to WebAssembly (`projects/raft-cluster/core`, see `core/ABI.md`) and committed as a build artifact next to the page, so no service process is needed.

## Structure

```text
portfolio/
├── contracts/       shared module interfaces
├── projects/        self-contained pet projects
│   ├── evening-forest/ 8-bit woodland walking simulator
│   ├── explosion/     click-to-detonate specimen room
│   ├── kitty-run/     procedural vector-animation runner game
│   ├── planck-to-now/ GPU-accelerated cosmology simulation
│   ├── practice-map/  local-first technical practice dashboard
│   └── raft-cluster/  Raft consensus core (Rust → WASM) with a live browser demo
└── shell/           React/Vite landing page and project host
```
