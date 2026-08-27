# Handoff: hero field — live Canvas2D atmosphere (domain-warped mud), instruments removed

Date: 2026-08-27 · Branch: worktree of `vasyapym.github.io` (no commits made) · Next session: real-device review of the atmosphere (Windows + iPhone), then tune or deliver.

## State in one paragraph

The hero backdrop changed identity twice this session (Passes 24–25, continuing Pass 23's live field). Pass 24 kept the then-topographic canvas but masked its hard left/right edges (owner: "sharp edges shouldn't be") — a pure-CSS horizontal `mask-image` fade on `.signal-index-hero-canvas`, 120px per side, 56px ≤700px. Pass 25 then replaced the direction itself after the owner's verdict that the instrument identity felt "off, clunky, generic — too many instruments", and that they missed the old WebGL hero's mud-like animation (which only ever rendered right on macOS). The hero is now a **live atmosphere**: `HeroAtmosphere.tsx` (new file; untracked `HeroIsolines.tsx` deleted) renders a seeded value-noise fBm heightfield through two 2-octave domain-warp fields (±95px marble) at 1px per 4 css px, browser-upscaled + CSS `blur(12px)` (9px mobile), palette teal `rgb(110,180,190)` → amber `rgb(211,155,97)`, alpha ceiling 0.45, 30fps cadence, slow drift (4.5/2.0 px/s) + 26s tide. The pointer is a gentle heat swirl (σ150, amp 0.5, k=1−e^(−6dt)) — the haze swells under the cursor; HUD readout, peak diamonds, and charge rings are gone. Reduced motion = single static render, no listeners. Offscreen/hidden-tab pause and the frame-budget octave downgrade carry over from Pass 23. Verified green on headless Edge (DPR 1/3, 60fps, zero console errors, zero h-overflow, idle drift + swirl frame-diffs, reduce static). Working tree is **uncommitted** by design (repo policy: delivery is a separate explicit step).

## Direction (what this handoff points to)

Recorded as graph node `n55` (continues n53), with decision node `n54` superseding the Pass 23 instrument direction `n52`: **the hero is an atmosphere, not an instrument panel** — slow organic mud/ink-in-water that still answers the pointer, zero readouts/markers/rings. WebGL stays rejected (platform variance: "iPhone smoke / Windows mud"); the feel is reproduced deterministically with Canvas2D. Next round should judge THIS on real devices — does the fog read as the old macOS WebGL mud and not as "a blur" — not reopen the medium question.

## Read these first (do not re-derive)

- Decision + pass records: inside `portfolio/` run `node ../scripts/project-graph/bin/project-graph.js show n54` and `show n55` (note: the script lives at repo root `scripts/project-graph/`, not under `portfolio/`; `n52` = Pass 23 instrument field, `n53` = Pass 24 edge fade).
- Ledger entries: `docs/portfolio-redesign-handoff.md` → "### Pass 24 — Hero field edge fade / no more scissor cuts (2026-08-27)" and "### Pass 25 — Hero atmosphere / the mud returns, without WebGL (2026-08-27)".
- Screenshots (session temp): `%TEMP%\opencode\iso-shots\` — `field-*` (old instrument field), `fade-dpr*` (Pass 24 edge fade on isolines), `fog-dpr1-*` (fog first tuning, sparse), **`fog2-dpr1-*`, `fog2-dpr3-*`, `fog2-dpr1r` (kept evidence of the current atmosphere)**. `%TEMP%` = `C:\Users\VE957~1.ARG\AppData\Local\Temp`.

## Working tree — what belongs to this change

Mine (Passes 24–25): `portfolio/shell/src/shell/HeroAtmosphere.tsx` (new, untracked), `portfolio/shell/src/shell/HeroIsolines.tsx` (deleted — was untracked, so it simply vanishes; no commit ever contained it), `portfolio/shell/src/shell/LandingPage.tsx` (imports `HeroAtmosphere`, dropped `--hero-mx/--hero-my` parallax back in Pass 23), `portfolio/shell/src/styles.css` (`.signal-index-hero-canvas`: mask fade + `filter: blur() saturate()` + `signal-index-hero-fade` intro, disabled under reduce; `.signal-index-hero-hud` blocks deleted), `docs/portfolio-redesign-handoff.md` (Passes 24–25), `portfolio/.project-history/graph.jsonl` (nodes `n53`–`n55`, edges ` param($m) switch ($m.Value) { "e45" {"e57"} "e46" {"e58"} "e47" {"e59"} } `–` param($m) switch ($m.Value) { "e45" {"e57"} "e46" {"e58"} "e47" {"e59"} } `; ` param($m) switch ($m.Value) { "e45" {"e57"} "e46" {"e58"} "e47" {"e59"} } ` = n54 supersedes n52).

Note: `portfolio/shell/src/shell/HeroField.tsx` shows as deleted — that deletion belongs to Pass 22 (previous session), part of the same uncommitted hero story; stage it when the hero story ships as one unit.

**Not mine — another agent's in-flight work, do not touch or commit:** everything under `portfolio/projects/explosion/*` (modified `project.ts`, `tests/explosion.check.mjs`, `web/*`, untracked `tests/explosion.probe.mjs`).

## How to run / verify on Windows

```powershell
# dev server (npm run dev swallows --port through the nested npm workspace call — start vite directly):
npx vite --port 5178 --strictPort   # run in portfolio/shell/
npm.cmd run typecheck                # green as of this handoff (run in portfolio/)
npm.cmd run build                    # green (npm.ps1 is blocked by execution policy — use npm.cmd)
```

Reusable verification script (session temp, not in repo): `%TEMP%\opencode\hero-probe.mjs` — spawns headless Edge against a running dev server on `localhost:5178`, usage `node hero-probe.mjs <prefix> <dpr> <w> <h> [reduced]`; prints JSON and saves full/cursor/probe PNGs into `%TEMP%\opencode\iso-shots\`. Expected output for the atmosphere: `beforeState` reports the **low-res backing by design** (320×111 @DPR1 1440×900, 90×115 @DPR3 390×844 — not css×dpr anymore), `hudText` is always `null` (HUD removed), `animChanged:1` + `idleDiff:1` prove the loop, `errors:[]`, `horizontalOverflowPx:0`; `reduced` gives `animChanged:-1` static.

Implementation facts that matter for review (all knobs are named constants at the top of `HeroAtmosphere.tsx`): `FOG_MAX_ALPHA` 0.45 (ceiling — copy contrast depends on it), coverage ramp `smoothstep((v+0.35)/1.15)`, warm-crest ramp `smoothstep((v−0.3)/0.5)`, `WARP_AMP` 95 (marble strength), `WARP_FREQ` 1/340, `FREQ` 1/260 (blob scale), drift 4.5/2.0 px/s, `TIDE_PERIOD` 26s, `SWIRL_SIGMA` 150 / `SWIRL_AMP` 0.5 (pointer heat), `UPDATE_MS` 1000/30 (draw cadence; rAF still smooths the pointer at 60), `FRAME_BUDGET_MS` 26 → drops to 2 octaves. The Pass 24 side masks live in `styles.css` on `.signal-index-hero-canvas`, not in JS.

## Open threads / next steps

1. **Real-device review (the actual point):** view `/` on the owner's Windows machine and iPhone — judge (a) whether the fog reads as thick living mud (the old macOS WebGL feel) or as generic blur — if blur, raise `WARP_AMP` and/or lower `RES_DIV` to 3 before touching blur; (b) fog density under the headline (ceiling 0.45 — text contrast must stay); (c) pointer swirl σ150/amp 0.5: should feel like warmth spreading, not a spotlight; (d) whether the 30fps cadence is visible on the phone (if steppy, raise to 40fps only on mobile); (e) warm amber crests behind the catalogue box — calm enough?
2. Possible refinements from that review: retune named constants only (they exist precisely so tuning is one-digit edits); optionally soften the mobile blur if the 56px mask + 9px blur feels heavy on small screens; the Pass 23 idea of a "how this works" caption is likely dead with the instruments (its subject — marching squares — no longer exists).
3. Delivery: nothing is committed. Repo policy — commit only on explicit request; stage only the files listed above (plus the Pass 22 deletion of `HeroField.tsx` when the hero story ships as one unit); re-arm the auto-record hook first: `git config core.hooksPath .githooks` (this clone lost it; commit `46e90d7` was never graphed because of that). Take only your own paths — explosion/* is another agent's.
4. Graph pointer: `n55` is the active tip (actor design-iteration) and carries this direction; `n54` holds the supersession rationale. If the next round turns into perf/implementation work beyond one visual pass (e.g., moving the fog to a worker, or an offscreen cache), offer the crossing explicitly: `node ../scripts/project-graph/bin/project-graph.js handoff --to code-iteration --from-node n55`.

## Suggested skills

- `/design-iteration` — for the real-device feedback round (it will read the graph + ledger and append the next pass).
- `/code-iteration` — if refinement becomes perf/implementation work beyond one visual pass.
- `/planning` — only if the owner wants a multi-step execution plan first.

## House rules worth repeating

- Explain code/technical changes in simple Russian; the owner is learning (beginner-friendly depth).
- Append a graph node whenever a session settles something (a verdict, a pass, a decision) — routing: portfolio shell work → `portfolio/.project-history/graph.jsonl`; graph CLI is at repo-root `scripts/project-graph/bin/project-graph.js`.
- Several agents share this working tree: check `git status` before staging, take only your own paths.
