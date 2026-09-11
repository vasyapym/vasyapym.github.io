# BRIEF — realm r13, part 2 of 3: depth, stress, commit

Fresh context per relay — everything you need is in this brief. Full design/code autonomy; **reply terse** (bullets, formulas, numbers; no prose padding). Superficial output is rejected.

## Situation facts (mechanism-verified)

- World column: `world.w = vw`, `world.h = vh*2` (set in `resize()`). Camera `camY` range `[0, world.h − vh]` = `[0, vh]`; `camX` locked 0 by documented contract; zoom 1 (dive → 1.22). Mapping: `sx = (wx − vw/2)·zoom + vw/2`, `sy = (wy − camY − vh/2)·zoom + vh/2`.
- Anchors resolve as `fx·world.w / fy·world.h` in `Creature.update` (realm-creatures.ts); creatures wander within a leash ≤ ~0.8×`radius`; `radius = min(vw,vh)·0.28`; `resize()` rebuilds creatures when `|h − vh| > vh*0.2`, translating cached state to the new anchor (`shiftState`).
- Anchor table (door: fx, fy): 1 raft .25/.26 · 2 kitty .68/.30 · 3 explosion .46/.48 · 4 spine .80/.55 · 5 forest .20/.68 · 6 planck .52/.78 · 7 map .76/.90.
- Lantern: soft walls clamp `lan` to `[0..world]`; pointer target `ty = (ptrY − vh/2)/zoom + camY + vh/2`; follow band half = `vh*0.18` desktop / `vh*0.12` mobile (rate 6 vs 8); sway ±4px vertical (none reduced). r10 law: selection PARKS the lantern — world coords exact across frames, release preserves them; the camera is free to move.
- Selection (`openProjectPanel`): `setLanternHold(true)` + `startGreeting(id)` → 6 s one-shot greeting around the anchor (core ≈ 1×radius must clear chrome; forest's transient rings ~1.75×radius may clip the raw viewport edge only).
- Chrome while a panel is open: desktop right sheet full height, left edge `vw − min(30rem, 92%)` (960 px @ 1440); mobile (≤520px) bottom sheet `top: 52%; height: 48%`; legend bottom-left; hud top-right; caption bottom-right (desktop only). Opaque #04080b.
- Failure: door 7 @1440 anchor x = 1094 px sits behind the sheet on any width < ~2000 px; doors 6/7 @mobile sit at ≥ 80%/56% vh at max scroll — inside the sheet's band, and the camera cannot lift them (no world below 2vh).
- Owner ask: ADD vertical space at the bottom of the scene so the cursor/light can travel further down; make the selected creature's animation visible for all 7 doors on desktop 1440×900 and mobile 390×844.

## Established direction (from the previous relay — build on it, do not re-open)

- **D1 Deep floor:** anchors keep their absolute world positions (mapping pinned to the anchor span, NOT to the grown `world.h`); `world.h` grows BELOW the anchor band; camera range, lantern soft walls, resize clamps, `resetForEnter` track the new floor.
- **D2 Selection framing:** on selection, camY retargets so creature + ~1×radius core sits in the clear band — view-only (parked lantern untouched), settled under reduced motion, yields to `startDive`; desktop panel flips to the LEFT edge when the selected creature's fx > 0.5 (shipped panel geometry otherwise preserved). `camX` stays locked; no translucency; no anchor re-spacing.

## Still binding

Geography law (relative layout of the 7 unchanged; depth added below); r10 hold exactness; no regressions: dive camera, pick anchors (`markPickAnchor`/`pickAt`), touch `lifted()`, warpTo/thrust, greeting arbitration, lure/idle, trail/wake continuity, overlay culling, reduced motion, degraded (no-WebGL) renderer, r9 sheet law (stationary wrapper, keyed inner body, dive reachable), r10 exit choreography, r12 project-backed return; clamps consistent with the new depth; one rAF; no allocation in update/emit; no per-frame React state; no new sounds/DOM chrome.

## Steps (terse bullets)

4. **Develop to depth** — produce:
   a. EXTRA depth value + arithmetic: 390×844 (fy-0.9 anchor ≤ ~42% vh at max scroll, sheet top 52%) and 1440×900 (bottom band ≈ 4rem; sheet edge 960 px);
   b. decoupling: which file/lines + the new mapping formula, and why anchors stay put when `world.h` grows (the `worldChanged`/`shiftState` path);
   c. every clamp line that must follow the new depth (soft walls, `resize()`, `resetForEnter`, `warpTo`);
   d. camY retarget: trigger callback; target formula **in world coords** (creature anchor / covered region / viewport); rate or easing; compose-or-bypass vs the follow law; close-panel outcome (return vs keep — pick + why); reduced-motion behavior; degraded path;
   e. side-flip: how the side is decided and carried (class/attribute on what), which CSS lines change;
   f. dev-only snapshot getter(s) for gates: name + fields (style of `getLanternSnapshot()`, prod null).
5. **Stress-test** — one line per verdict: all 7 @1440×900; doors 6–7 @390×844; deep-scroll → select door 7; hold + camera change (parked coords exact, no teleport); close-panel (no visible snap); dive from changed camera; warpTo 7 → select; reduced select; degraded select; resize crossing the `vh*0.2` rebuild; r12 return → select door 7; pick anchors across the camera change.
6. **Rank and commit** — one short paragraph, then:

## Deliverable

1. `COMMITTED: <name>`
2. `CHANGE SPEC:` — **one line per region**: `file | function | change + concrete values`. If you must see code you were not given, write `NEEDS: file | function`. Tight — part 3 turns each line into a replacement block.
