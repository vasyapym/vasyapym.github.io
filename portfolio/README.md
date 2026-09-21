# Portfolio

React 19 + Vite 7 + TypeScript portfolio. Deployed to GitHub Pages on push to main (Node 22). The landing page includes an opt-in interactive layer (realm mode) — see `shell/` for implementation.

## Projects

- **practice-map** — Waste of tokens: AI output archive and lesson space
- **spine** — Spine: draggable Flexbox/Grid layout engine (Go/WASM)
- **quicknotes** — Quicknotes: local-first markdown notes with Firebase sync
- **kitty-run** — Cat Runner: pastel endless runner (R3F)
- **raft-cluster** — Raft Cluster: interactive Raft consensus (Rust/WASM)
- **evening-forest** — Evening Forest: 8-bit first-person dusk walk (R3F)
- **explosion** — Explosion: paper-lantern moon shard simulation (Rust/WASM, GPGPU)
- **planck-to-now** — Planck to Now: cosmic history on a log-time scale (three.js)

## Development

```sh
npm install
npm run dev        # dev server
npm run typecheck  # type-check
npm run build      # production build
```

To add a project, create a directory under `projects/` with a `project.ts` exporting a `ProjectModule` (see `contracts/`). The shell discovers it automatically via `import.meta.glob` — no other changes needed.

## Agentic workflow

All agentic orchestration, repository management, testing, and implementation is handled by GLM 5.3-Flash, which distributes scoped tasks and briefs to Claude Opus 4.8/5, Fable 5/5.1, and GPT Sol/6 Astra, then reconciles their outputs.
