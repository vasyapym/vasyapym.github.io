# BRIEF 13 — The realm rebuilt: "The Deep" (four-part relayed delegation)

Owner verdict on the v1 realm (n149, `BRIEF-realm-immersive-mode.md`): it
"completely lacks the wow effect — which is the entire point of this section";
projects felt placed in a circle and manually dragged; flat and uninspired.
The owner granted explicit freedom: the realm does NOT need to match the
site's design language, provided the transition between it and the rest of
the site is smooth and well-executed; visual impact, motion and interactivity
over consistency. The chat specialist was given the goal, the failure
diagnosis, and the hard technical shell — and full freedom for the metaphor,
palette, motion systems and interaction model.

## Direction adopted (part 1, "The Deep")

A black pressurised sea rendered by a real GPU fluid simulation; the visitor
is a lantern — the only light — dragged through the water with genuine mass.
Seven bioluminescent creatures, one per project, each behaving like its
project. Enter: black ink erupts from the entry chip's exact screen position
and swallows the catalogue. Leave: the sea drains back into the chip. Select:
a vortex of the project's hue swallows the screen and SPA-navigates at peak
black. Audio: 38 Hz sub drone, a current that follows the lantern's speed,
one synthesised voice per creature.

## Deliverables (relayed one at a time; integrator = the orchestrator agent)

1. `realm-fluid.ts` — WebGL stable-fluids engine: velocity (~1/4 res) + dye
   (~1/2 res) advected fields, vorticity confinement, Jacobi pressure,
   premultiplied two-mode display ("ink" = dye density as alpha over the
   landing, "abyss" = luminous sea), marine snow, bloom, emissive-primitive
   compositing, self-managed quality ladder, graceful null on no WebGL.
2. `realm-scene.ts` — world model (a two-viewport-tall vertical sea),
   dead-zone camera, mass-spring lantern, phase machine (entering → active →
   leaving/diving, wall-clock), Canvas2D overlay (creature names, hint),
   degraded shallow-water renderer, single rAF + visibility pause.
3. `realm-creatures.ts` — the seven organisms with greetings: raft election
   school (heartbeat commit pulses, scatter + re-elect), shy dodge cat
   (sprint-lap greeting), detonating/re-accreting knot, reflowing spine
   column, exhaling forest haze, 40 s planck nebula cycle, route-drawing
   practice-map constellation.
4. `realm-audio.ts` + `RealmMode.tsx` — synthesis-only abyssal bed with
   per-creature voices, panning/mixing from scene snapshots; the thin React
   shell (two stacked canvases, HUD, legend-as-sea-chart, panel, iris,
   aria-live, esc chain, touch = finger is the lantern with 60 px offset).
5. `realm.css` — the chrome: flat near-black scrims, hairlines, lowercase
   mono, amber as the single interactive signal; mobile legend strip +
   bottom-sheet panel; reduced-motion crossfades.

## Integrator findings fixed during verification (all in-repo)

- **FS_SNOW re-declared `varying vUv`** (already in the shared GLSL head) →
  compile error → `buildPrograms` null → the GPU path was dead on every
  ANGLE browser. One line; the entire GL route hinged on it.
- `dispose()` called `WEBGL_lose_context` → the StrictMode dev remount (and
  any canvas reuse) only ever saw a dead context → always degraded in dev.
- Ink-mode dye carried the ink colour; the splash script accumulates ~13× →
  a bright cyan stain on switching to abyss. Ink-mode dye is now alpha-only
  (black); the flood's look is the display shader's ink uniform.
- `.realm-layer--degraded .realm-overlay { opacity: 0.9 }` caused stale
  compositor output in headless (opaque, per-frame-repainted canvas at
  fractional opacity) — the landing bled through the abyss. Dim removed.
- Kitty trail ring was seeded with raw anchor fractions (~1 world px) → a
  stray hairline to the screen corner; seeded at the live anchor instead.
- Phase machine advanced on capped `dt` while the shell's css (iris, leave
  fade) is wall-clock → desync under load; phases now run on wall time.
- Exit scroll restore used two-arg `scrollTo` which defers to the global
  `scroll-behavior: smooth` → animated restore; made instant.
- Replacing realm.css had silently dropped the v1 `.realm-enter-chip`
  styles; restored in the new chrome language.

## Gates

`tsc --noEmit` strict · `vite build` · headless `tests/realm-probe.mjs`
21/21 (enter over untouched landing, two canvases, legend of 7 named door
buttons, frame-delta liveness, focused-legend Enter opens ITS project, esc
chain, scroll restoration, chip return, dive→SPA handoff at ~1.0 s, no
horizontal overflow at 390 px, reduced-motion path, console clean ×4) ·
`tests/realm-shots.mjs` visual evidence · GL path exercised under
SwiftShader (fluid, snow, creatures, wake dye, bloom all render).

## Open for the owner

The flood beat, wake feel, creature motion and audio balance need real-GPU
eyes (`npm run dev`, press the chip). The quality ladder's thresholds
(14 ms mean) are set from the design brief, not from measured weak hardware.
