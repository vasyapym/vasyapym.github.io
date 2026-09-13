# Prompt — randomized routing round, B2b fate draw path (paste verbatim)

comprehensive code - spec below; fill every RULE, deliver every DELIVER.

FACTS:
- WebGL2 + three.js (r170) GPGPU particle sim, 220k particles in two RGBA32F MRT textures (pos/vel) ping-ponged by a fullscreen-quad pass; halo texture holds comoving centers x_h + GM.
- Particle state: pos.w sign encodes bound(+)/free(−)/dead(0), |pos.w| = haloId+1; bound rgb = physical offset d from halo center; free rgb = comoving position x.
- Bound proper position = a·x_h + d; free = a·x. a spans 10⁻³ (crunch) to 10²⁶ (big rip); lna ∈ [−7, 60] available as uniform.
- Existing draw path (placeholder, to be REPLACED): euclidean `X = a·x_h + d` in the vertex shader, additive point sprites, uniform color/alpha per branch.
- Camera orbits freely (OrbitControls), not attached to any halo.

RULES:
- R1 log-radial projection: apparent radius s(ρ) must be ~linear near the camera (ρ < ~1 Hubble length) and logarithmic beyond, so the home scale stays readable while neighbors slide visibly through 10²⁶ orders; NO overflow/precision loss anywhere in float32 (never form a·x_h + d naively when a is huge — derive the stable formulation yourself and state it); direction = normalize(R) (well-conditioned at any scale).
- R2 per-fate grading (uniform uFate selects): heatDeath → brightness b = pow(max(1−D·H,0),4)·stellar-decay, point size ∝ 1/(1+z), horizon fade to black; bigRip → sprite fragmentation visual below A>10¹⁶, whiteout above A>10⁴⁸ (thresholds only, uniform A passed in); bigCrunch → blackbody color from T=2.7/a, opacity rises, whiteout at a<10⁻³; vacuumDecay → placeholder (bubble wall is a later brief), interior tint only.
- R3 colors must stay in the app's ink family: warm amber-cream on near-black, no new palette.
- R4 all new GLSL in the existing module's style (template literals tagged /* glsl */, RawShaderMaterial GLSL3); no new files beyond the two DELIVER items; no CPU readback.

DELIVER:
- D1 complete replacement draw-vertex-shader + fragment-shader text (GLSL3, in/out declared) ready to paste over the placeholder, with a short uniform list the engine must feed (name each uniform, one line each).
- D2 exact engine patch spec ≤30 lines: which uniforms to add to renderMaterial, where the per-frame values come from (a, H, A, fate mode), quoted anchors not required — name fields/methods precisely.
- D3 a pure TS mirror `logRadial(rho: number, lna: number): number` + `horizonBrightness(D: number, H: number): number` exported for node tests.

## Notes for the user (not part of the prompt)
- The block above is the paste; the reply comes back here for salvage integration.
