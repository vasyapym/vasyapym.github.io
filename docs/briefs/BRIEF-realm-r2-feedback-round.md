# BRIEF 14 — realm r2: the eight-point feedback round (three-part relayed delegation)

Owner's first real-GPU look at "The Deep" (n150, brief 13) produced eight
defect reports: (1) the entry chip needed scroll-aware placement — bottom
centre, hidden in the hero, revealed past it, hidden at the page end, with a
bottom darkening treatment mirroring the hero's `--hero-exit` so the button
stops being missable; (2) the lantern moved too fast/erratic; (3) "Surface"
flashed a white screen for ~0.3s; (4) the light trail looked buggy; (5) click
bugs — objects shift closer on tap, desktop labels read doubled in the clicked
state, no project selection while travelling; (6) desktop precision — the
light chased the cursor so hard that "surface"/"doors" were hard to click;
(7) the dive's final moment exploded into a supernova/lightning flash after
the (good) signature-colour beat; (8) on mobile the first tap surfaced project
info mid-screen instead of the bottom sheet. Handled as three relayed briefs
(14a, 14b + anchor supplement 14b2, 14c) under `/code-iteration`, three passes,
graph n152–n154.

## Root-cause finding (pass A)

Items 3 and 7 share one cause: `FS_ABYSS` displayed `base + dye.rgb` with NO
clamp while `vortex()` injected 0.35 dye per frame (~21/s) — the leave/dive
vortex saturated channels to white at the framebuffer and the bloom (threshold
0.6) flashed the whole area. Item 2's spring (k=70/c=9, vmax 2600) was far
below critical damping. Item 4's wake existed only above a hard 140 px/s cliff
and splatted per-frame screen deltas × 6 (wrong dimension).

## Deliverables (relayed one at a time; integrator = the orchestrator agent)

1. **Pass A — engine (14a; items 2, 3, 4, 7; `realm-fluid.ts`,
   `realm-scene.ts`, `realm.css`)**: hue-preserving soft shoulder in FS_ABYSS
   (linear to 0.55, asymptotic 0.82 max-channel — no path can clip to white)
   + soft accumulation ceiling in FS_SPLAT_DYE (knee 2.6, ceil 4.0, uniform
   scale, ink-mode black-dye rule preserved); vortex dye 0.35→0.12/frame,
   dive tangential ramp 40+120t; lantern spring near-critical (desktop
   k32/c10.6 ζ≈0.94, touch k40/c12), vmax 1500, thrust 1100; wake rebuilt —
   px/s semantics with hysteresis gate 120/70, momentum fraction 0.16,
   smoothstep dye ramp 0.05–0.20 over 90–800 px/s; dive iris INVERTED (the
   signature hue now grows to full cover, flat colour from ~0.77s, so the SPA
   cut lands under it).
2. **Pass B — input (14b+14b2; items 5, 6, 8; `RealmMode.tsx`,
   `realm-scene.ts`, `realm-creatures.ts`)**: deliberate-gesture model — quick
   press (<8px, <350ms) = SELECT via new additive `RealmScene.pickAt`
   (nearest creature to the TAP point, radii 0.35/0.5·interactR mouse/touch,
   same-tick screen geometry); press-and-hold (350ms timer or >8px drag) =
   travel+calling; calling tamed (glow boost ×smooth(prox), lean 0.35→0.18
   glow-ramped); chrome immunity — events over `.realm-hud/.realm-legend/
   .realm-panel` release the pointer, never call, never select, native clicks
   intact; labels single-rendered via the canvas shadow API, non-nearest
   capped at 0.7; first mobile tap now opens the bottom-sheet panel.
3. **Pass C — landing chrome (14c; item 1; `LandingPage.tsx`,
   `realm.css`)**: chip bottom-centre (safe-area aware), hidden in the hero
   (band start = 0.765·hero height, i.e. 85% of the hero-exit span), fade +
   0.5rem slide-up reveal, hidden again in the last 0.5·vh before max scroll;
   stays mounted (esc-return focus law) via opacity/pointer-events + tabIndex
   -1 while hidden; a fixed `--realm-floor` gradient (22vh clamp 7–12rem,
   toward #020609) ramps over the last 0.6·vh as the mirror of `--hero-exit`;
   chip made more substantial (2.75rem min-height, 0.78rem type) in the hard-
   edged ink language.

## Integrator findings fixed during verification (all in-repo)

- `ids[]` from the 14b patch does not exist in the scene closure →
  `pickAt` returns `creatures[best].id` (creature id === door id === project
  id); `pickAt` exposed on the returned scene object (the model left it as a
  wiring note); `clearHold()` added to the input effect cleanup (strict-safe
  hold-timer teardown); pass A's `wakeOn` moved from module scope into the
  scene closure (the brief's FIND placed it module-scope, shared across
  instances); pass C's scroll effect anchored on the real cleanup lines (the
  model's FIND had joined two lines).
- Probe hardening: poll-until helper replaces fixed waits (one cold-load
  flake); one inverted assertion caught and fixed (a bottom sheet's TOP edge
  sits below vh/2 — the check initially asserted the opposite). Both probe
  scripts now scroll past the hero before entering (the chip is hidden in the
  hero by design) and the desktop entry scrolls to 1250 with the restore
  check updated to match.

## Gates

Per pass: `tsc --noEmit` strict · `vite build` · `tests/realm-probe.mjs`
(26/26 at round end — the original 21 gates plus chip hidden/revealed, canvas
tap-select with legend-matched title, mobile first-tap bottom sheet; one
console-clean failure early in the round was this machine's fonts.googleapis
timeout, environmental) · `tests/realm-shots.mjs` + a chip-band shot set
inspected visually: no white clipping anywhere, wake reads as a continuous
warm plume, flood cover intact, labels single-layer, chip states correct.

## Open for the owner

Real-GPU eyes on: lantern feel (k32/c10.6), wake plume, leave/dive endings,
chip band thresholds (0.765·hero / last 0.5vh) and the floor gradient depth.
The dive iris ends on a FLAT hue by design (SPA cuts under full cover) — if
the owner wants the vortex visible longer, the iris stops need retiming.
