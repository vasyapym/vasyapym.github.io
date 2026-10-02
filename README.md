# vasyapym.github.io

> Tools, toys, and simulations.

Live at [vasyapym.github.io](https://vasyapym.github.io).

Every project in this repository is self-contained: its own code, its own look, and - where it needs a real engine - its own Go or Rust core compiled to WebAssembly.

## Projects

Each entry gives the surface first, then what's underneath.

| Project | What it is | Underneath |
| --- | --- | --- |
| **Waste of Tokens** | An archive of AI outputs, a lesson space, and an open playground. | Sectioned lessons, persistent notes, and review-note export - all local, no account required. |
| **Spine** | Drag, nest, and retune Flexbox and Grid layouts in the browser, then copy the clean HTML + CSS. | A Go core compiled to WebAssembly, with undo/redo. |
| **Quicknotes** | Local-first Markdown notes with `[[wiki-links]]`, live preview, and a command palette. | Static ES modules with Firebase sync - no build step. |
| **Cat Runner** | A pastel endless runner with a bullet-time dash, ghost replays, and a procedural soundtrack. | A deterministic simulation, React Three Fiber, and WebAudio. |
| **Raft Cluster** | A Raft consensus simulator. Crash the leader or cut a link, then watch the cluster start a new term and elect a replacement. | A Rust core compiled to WebAssembly, drawn with Canvas 2D. |
| **Evening Forest** | An 8-bit first-person walk through a forest at dusk. | Procedural terrain, React Three Fiber, custom shaders, and a custom post-processing pass. |
| **Explosion** | A paper-lantern moon detonates into 600 shards. | Physics running in fragment shaders on the GPU, backed by a Rust/WebAssembly core. |
| **Planck to Now** | Scrub through cosmic history, from the Planck epoch to the present, on a logarithmic time scale. | Three.js. |

### Common threads

- **Real engines where it counts.** Spine, Raft Cluster, and Explosion are built around Go and Rust cores compiled to WebAssembly.
- **Local-first.** Waste of Tokens keeps everything in the browser and needs no account; Quicknotes is local-first with Firebase sync layered on top.

## The realm

The landing page hides an opt-in, full-screen layer called **the deep**: a dark abyss where every project is a bioluminescent creature, and you find the one you want by steering a warm lantern toward it.
