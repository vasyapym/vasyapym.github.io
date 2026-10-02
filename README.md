# Vasily Argounov

Personal portfolio and interactive-experiments site — **[vasyapym.github.io](https://vasyapym.github.io)**

[![CI](https://github.com/vasyapym/vasyapym.github.io/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/vasyapym/vasyapym.github.io/actions/workflows/deploy-pages.yml) ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff) ![three.js](https://img.shields.io/badge/three.js-000?logo=threedotjs&logoColor=fff)

Agent-assisted interactive experiments. Eight self-contained projects, each with its own tests, built on React 19 + TypeScript and deployed to GitHub Pages via Vite 7 (CI on push to main). Unified ink-catalogue design system — WCAG AA, keyboard focus, and reduced-motion fallbacks are hard constraints.

## Projects

| Project | Description | Stack | Links |
| --- | --- | --- | --- |
| Waste of tokens | AI output archive — sectioned lessons, persistent notes, local-only progress | React, TS | [demo](https://vasyapym.github.io/projects/practice-map/) · [src](https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/practice-map) |
| Spine | Draggable Flexbox/Grid layout engine — Go/WASM core, undo/redo, HTML+CSS export | Go/WASM, TS | [demo](https://vasyapym.github.io/projects/spine/) · [src](https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/spine) |
| Quicknotes | Local-first markdown notes — Firebase sync, wiki-links, command palette | JS, Firebase | [demo](https://vasyapym.github.io/projects/quicknotes/) · [src](https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/quicknotes) |
| Cat Runner | Pastel endless runner — deterministic sim, bullet-time dash, ghost replay, synth audio | R3F, WebAudio | [demo](https://vasyapym.github.io/projects/kitty-run/) · [src](https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/kitty-run) |
| Raft Cluster | Raft consensus fundamentals as real code — crash leaders, cut links, watch elections | Rust/WASM, Canvas 2D | [demo](https://vasyapym.github.io/projects/raft-cluster/) · [src](https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/raft-cluster) |
| Evening Forest | 8-bit first-person dusk walk — procedural terrain, custom postprocessing, synth ambience | R3F, three.js | [demo](https://vasyapym.github.io/projects/evening-forest/) · [src](https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/evening-forest) |
| Explosion | Paper-lantern moon detonating into 600 GPGPU-driven shards | Rust/WASM, three.js | [demo](https://vasyapym.github.io/projects/explosion/) · [src](https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/explosion) |
| Planck to Now | Scrub cosmic history from the Planck epoch to now on a log-time scale | three.js | [demo](https://vasyapym.github.io/projects/planck-to-now/) · [src](https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/planck-to-now) |

## The realm

The landing page includes an opt-in full-screen layer called the deep — a dark abyss where each project is a bioluminescent creature you steer a warm lantern toward. Built with WebGL fluid simulation, Canvas 2D overlay, and WebAudio synthesis; degrades gracefully for reduced-motion preferences and non-WebGL environments.

## Architecture

Projects are discovered at build time via `import.meta.glob` from `projects/*/project.ts`, each exporting a typed `ProjectModule` contract defined in `contracts/`. Adding a project means adding a directory — no shell code changes required. Go and Rust projects commit their WASM binaries, so building the site requires only Node.

The landing hero is a procedural Canvas 2D glyph field (domain-warped fBm) — no WebGL, no animation libraries. Every design and iteration decision is recorded in an append-only per-project graph (`scripts/`).

## Development

`npm --prefix portfolio install && npm --prefix portfolio run dev` starts the dev server.

Raft core uses `cargo test`; other projects have Node check scripts under `portfolio/projects/<id>/tests/`; shell validates via typecheck, build, and headless-Chrome behavioural probes. No CI test step yet.

## Agentic workflow

All agentic orchestration, repository management, testing, and implementation is handled by GLM 5.3-Flash, which distributes scoped tasks and briefs to Claude Opus 4.8/5, Fable 5/5.1, and GPT Sol/6 Astra, then reconciles their outputs.

[MIT License](LICENSE)
