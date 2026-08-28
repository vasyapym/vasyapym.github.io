# Handoff: hero consolidated + full viewport + scroll exit fade + reveal pass

Date: 2026-08-28 · Branch: worktree of `vasyapym.github.io` (uncommitted by policy) · Next session: real-device review of the pass, then the deferred fog-tuning pass.

## State in one paragraph

This pass executed a grilled, delegated brief: the owner ran a `/grill-me` round (settled in-conversation, not recorded elsewhere), a chat model authored the change from a self-contained brief, and the integrating agent applied it with two deviations (below). The hero is now **one consolidated CSS block** (the three stacked generations — base / "Quiet index" / "Hero band" — are gone, duplicates resolved in favour of the previously-computed values); the legacy `signal-index-hero-refraction` class is renamed **`signal-index-hero-atmosphere`**; the static `::before` glow band from the abandoned Refraction-sea direction is deleted; the identity header moved inside the hero section and overlays the fog absolute (no bottom border); the hero fills the first screen (`min-height: 100vh` + `100svh`). New scroll behaviour: the **whole hero** (canvas, copy, header, beneath panel) fades out via a `--hero-exit` progress var (rAF-throttled passive scroll listener, 0→1 over 90% of hero height, never installed under `prefers-reduced-motion`); the projects section reveals once via its own IntersectionObserver and the grid's top border became an animated hairline (scaleX 0→1); card reveals were retuned to the hero entrance family (680ms `cubic-bezier(0.22,1,0.36,1)`) with an inner topline→copy→artwork stagger; all hidden states are gated under `.signal-index-reveal-ready` so nothing hides without JS. No new dependencies; `HeroAtmosphere.tsx` untouched. Working tree is **uncommitted** by design (repo policy: delivery is a separate explicit step).

## Integration deviations from the chat model's output (why they exist)

1. The projects section is observed by a **separate IntersectionObserver with `threshold: 0`** (model reused the cards' observer at `threshold: 0.12`; a section taller than ~8 viewports could never reach a 12% visible ratio and would never reveal).
2. The card base transition was edited **in place** rather than re-declared in a later block (avoids leaving two competing `.signal-index-card` transition rules — the pass is about removing exactly that pattern).
3. The now-redundant `.signal-index-hero-atmosphere` core rule (position/isolation/color — all folded into the consolidated block) was deleted rather than left as an empty shell.

## Direction (what this handoff points to)

Graph node `n58` (continues `n57`, the atmosphere commit; lineage `n54`/`n55` = the atmosphere direction). Ledger entry: `docs/portfolio-redesign-handoff.md` → "### Pass 26 — Hero consolidation, full viewport, scroll exit fade + reveal pass (2026-08-28)" — full Changed/Quality-gate/Verification detail lives there; do not re-derive.

## Working tree — what belongs to this change

- `portfolio/shell/src/shell/LandingPage.tsx` — header inside hero, renamed class, exit-fade effect, section observer, `data-section-reveal`.
- `portfolio/shell/src/styles.css` — consolidated hero block, deletions (three generations + `::before` band + header border + grid border-top), rename, hairline + card-stagger blocks.
- `docs/portfolio-redesign-handoff.md` (Pass 26), `portfolio/.project-history/graph.jsonl` (`n58`, `e63`), this handoff (`%TEMP%\opencode\hero-scroll-handoff.md` + copy at `docs/hero-scroll-handoff.md`).

**Not mine — another agent's in-flight work, do not touch or commit:** everything under `portfolio/projects/explosion/*` (untracked `tests/explosion.probe.mjs`).

## How to run / verify on Windows

```powershell
npx vite --port 5178 --strictPort   # in portfolio/shell/ (npm run dev swallows --port)
npm.cmd run typecheck               # green as of this handoff (run in portfolio/)
npm.cmd run build                   # green (npm.ps1 blocked by execution policy)
```

Probes (session temp): `hero-probe.mjs` (atmosphere: `node hero-probe.mjs <prefix> <dpr> <w> <h> [reduced]`, expects server on :5178) and the new `scroll-reveal-probe.mjs` (same args) — asserts hero min-height = viewport, header absolute/no border, `--hero-exit` 0→1 with opacity 1→0 and restore at scroll-top, hairline scaleX 0→1, section `is-revealed`, card batches, zero errors/overflow. Kept evidence: `iso-shots/scrolldpr1-*`, `atmo-exit-*` (incl. reduced runs).

## Open threads / next steps

1. **Real-device review (the point):** Windows + iPhone — (a) full-height fog at 100svh: still mud or now sparser? (b) hero exit fade feel at natural scroll speed; (c) header legibility over the fog at the very top; (d) hairline draw-in + card stagger on the phone.
2. **Deferred tuning pass (explicitly out of this pass):** owner verdict "the hero animation reads as just blur" → per `hero-atmosphere-handoff.md` open thread 1a: raise `WARP_AMP` (95 → ~120–140) and/or lower `RES_DIV` (4 → 3) **before** touching blur. Constants-only edits, then the same probe suite.
3. **Delivery:** nothing is committed. Repo policy — commit only on explicit request; stage only the paths listed above; check `git status` first and take only your own paths (`explosion/*` is another agent's). Note: `git config core.hooksPath .githooks` may need re-arming in this clone (auto-record hook).

## Suggested skills

- `/design-iteration` — for the real-device feedback round (reads graph + ledger, appends the next pass).
- `/code-iteration` — if the tuning pass grows beyond constants (e.g., worker/offscreen cache).
- `/grilling` — already done for this pass; only re-run if scope changes.

## House rules worth repeating

- Explain code/technical changes in simple Russian; the owner is learning (beginner-friendly depth).
- Append a graph node whenever a session settles something — routing: portfolio shell work → `portfolio/.project-history/graph.jsonl` (CLI at repo-root `scripts/project-graph/bin/project-graph.js`).
- Several agents share this working tree: check `git status` before staging, take only your own paths.
