# Handoff — owner verdict: dither-field card art rejected ("looks dirty"); github.com logged-out landing is the reference for the next pass

Date: 2026-08-31. Scope: the six project-card illustrations on the landing page (`ProjectArtwork.tsx` + the artwork blocks in `shell/src/styles.css`).

## What happened

A delegated card-artwork attempt (six Bayer-dithered Canvas2D field systems — runner / cosmos / forest / layout / fracture / route, one identity hue per card) was built and verified **against a stale local tree at `7034ab1`**, which predated two upstream lines of work:

- `1676f8b` "Replace Code Layout with Raft Cluster" (+ `5067950` pinning Raft first) — Code Layout's project files are deleted upstream; only its `.project-history/` ledger remains. The stale tree is why Code Layout "came back" on the landing during that session.
- `6450685` / `d5fd807` / `76459f3` — upstream Raft/Explosion card-art passes that the attempt never saw.

The attempt passed all engineering gates (tsc + vite build green; headless probe 16/16: zero console errors, reveal sweep intact, IO-pause at zero CPU, no overflow at 1440/390/320, reduced-motion static frames; screenshots in `agent2/card-shots/`, outside the repo) but was **never committed**.

## Owner verdict (2026-08-31)

- Conceptual direction accepted: *"overall directions conceptually seems good."*
- Execution rejected: *"it looks kinda dirty. this is not it."* — the full-bleed dithered noise fields read as dirt, not print.
- Next-iteration direction: redo the card illustrations in the manner of the **github.com logged-out landing page** (`https://github.com/`) — clean, airy, precise: calm surfaces, generous spacing, crisp hairlines, restrained accent, no all-over texture noise. Keep per-project semantic identity (each card distinct); drop the wall-to-wall dither field.
- This fix is scheduled for the **next iteration**; recorded here so the verdict survives the session.

## Salvage notes for the next pass

- The rejected implementation lives in git stash `stash@{0}` ("card artwork attempt 1 (dither-field engines)…"). Worth salvaging: the per-card engine/lifecycle shell (IntersectionObserver + visibility pause, DPR cap 2, ~26fps cadence with one-step degradation, reduced-motion static frame, StrictMode-safe teardown) and the per-card config keyed by `project.id`.
- Do **not** salvage: the full-canvas dither rendering (the rejected part), the 6-tone noise fields.
- Starting point for the next pass is the current main (`76459f3`): the upstream scatter/center-mark card system with the Raft mark, Raft Cluster pinned first, six cards = raft-cluster, kitty-run, evening-forest, planck-to-now, explosion, practice-map.
