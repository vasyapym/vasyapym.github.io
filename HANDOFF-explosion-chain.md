# HANDOFF — Explosion project: closed handoff chain (stub)

All five original Explosion handoffs are **superseded**; their raw text is archived at
`docs/archive/handoffs/` (same filenames). Current state lives in the explosion project
graph (`portfolio/projects/explosion/.project-history/graph.jsonl`) and the code.

## Chain (chronological, one line each)

1. `HANDOFF-explosion-rust-core.md` — rebuild the simulation core in Rust → WASM (golden `n7-n9`, 2026-08-29). Delivered; smoke tests in `physics/`.
2. `HANDOFF-explosion-redesign.md` — page redesign as **Golden Hour Ruin**: bright aspect-aware renderer, mobile framing, card copy (`n11-n12`, 2026-08-29). Delivered.
3. `HANDOFF-explosion-part-fall-fix.md` — per-part destruction fixes: ghost voxels removed via world_version render sync, condemned members stop bearing load (`n13-n14`, 2026-08-30). Delivered.
4. `HANDOFF-explosion-fresh-start.md` — demolition lab replaced by **Ember Lantern** (single-state shard sim, dark page shell restored) (`n15-n16`, 2026-08-30). Delivered.
5. `HANDOFF-explosion-gpgpu.md` — Ember Lantern shard physics moved into fragment shaders, CPU fallback kept (`n17-n18`, 2026-08-30; this filename is referenced by the graph). Delivered; owner verdict "i like this" (`n19`).

## Where the project stands (checkpoint)

Two-mode page shipped 2026-09-04 (`n25-n27`): **Ember Lantern** (GPGPU shards) + **Ink
Shockwave** (GPU Navier-Stokes fluid pool) behind a selector with a lazy chunk; suite
extended. Project dormant since — no open threads. Card art history (paper-lantern seam →
mid-blast moon → gemstones) is recorded in the main-page graph.
