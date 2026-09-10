# Brief — Visual polish round for "cinder fault" (Explosion mode 3)

You are refining your own shipped implementation. **Scope guard: this is a qualitative polish round, not a feature round** — no new systems, no new interaction surfaces, no new dependencies, no contract changes. Refine what exists; a tighter, sharper version of the same idea beats a bigger one.

**Reasoning directive (binding):** your context may have been compacted, so anything you remember from earlier rounds is suspect — **this brief is the ground truth; if your memory conflicts with it, trust this brief.** Before any code, do a real deliberation pass and SHOW it: enumerate ≥3 distinct visual strategies you considered for the problems below, argue each against the constraints in one or two sentences, commit to one, list its failure modes and how the implementation avoids them. Then write the code, then run a self-review pass over your own output (read/write hazards, uniform coupling, TS strictness, SwiftShader cost) and fix what you find before presenting. Decisions are yours alone — never ask for approval; state each decision with a one-line rationale.

## The mode as shipped (facts you must keep true)

A ceramic seal with grain: a seeded Voronoi microstructure (mineral plates + weak boundaries) authored once into a "mineral" RGBA16F target (r=cohesion, g=identity, b=seam/boundary, a=disc mask). State target RGBA16F: x=view-depth displacement, y=velocity, z=irreversible damage, w=heat. A click (handled by the page via `detonateAt`) injects a compact impulse (−2.8 core / +0.55 shell velocity kick, seam-biased damage, heat); an explicit fixed-substep integration advances a damped wave (c²=0.3025, spring −7.0·x, damage-scaled damping) with shared neighbor bond stiffness; the present pass shades relief from a 5-tap gradient (normals, specular, fissure darkening, ember glow ∝ heat, warm rim rings, AA'd disc edge with coverage alpha).

Hard constraints (unchanged, non-negotiable):

1. **Contract:** exports `FaultPhase`/`FaultStats`/`FaultHandle`/`formatFaultHud`/`mountFault`; stats shape `{ fps, engagements, phase, grid, steps }`; HUD line exactly `fps N · phase X · engagements N · grid N · steps N`; phases `pristine | blast | settling`; miss (outside the disc) returns false with zero side effects; restore reseals to the identical seeded composition; slow-mo = 0.35 sim-dt; muted via `DetonationSfx`; reduced motion = one static pristine paint, no RAF, strikes return false; dispose mirrors the current checklist (RAF, observer, targets, materials, geometry, renderer, audio, canvas removal).
2. **SwiftShader CI gate: fps ≥ 5.** Measured on the current tiers: fault fps was 9–47 across desktop/tablet/mobile. You may spend that headroom, but the estimate math for any budget change must appear in your deliberation.
3. Software tier's `grid` must stay ≥ 64 (the suite asserts `grid ≥ 64`); raising it is allowed. The drawing-buffer cap, bounded-substep accumulator, and no-readback discipline stay.
4. Palette: only the ember family — ash `#2b2622`, ember `#8a3a1e`, mid `#d39b61`, warm `#e4a669`, hot `#ffd9a0`, plus the current stone/coal/clay/gold/ember uniform hexes you already use (`0x281b16`, `0x7c4b31`, `0xff6a2c`, `0xffd295`). Dark blue-slate stage gradient shows through the alpha canvas. No new hues outside the ember/stone family; no post-processing passes; the HUD/page/CSS are off-limits.
5. TypeScript strict (`tsc --noEmit` clean): no `any`, no unused locals, explicit exported return types; imports only `three`, `./audio`, your shaders module. GLSL3 only.
6. Integration mechanics for me: I paste whole files. If `fault.ts` changes only in constants/small functions, emit ONLY precise replace-anchors (quote the exact current lines you were given below + the complete replacement block) instead of reprinting the file; if a whole function changes, emit that complete function. If `fault.ts` needs no changes at all, say exactly that. `fault-shaders.ts`: always emit the complete file, no ellipses.

## Observed visual state (honest, from SwiftShader CI screenshots at grid 64 / ≤320 px buffer)

- **Blast state (the strong asset):** branching ember fissures radiating from the impact read clearly against the dark plates; the hot core glows well; the warm rim survives. Protect this — don't fix what isn't broken.
- **Pristine state (the weak one):** reads as a soft brown blob with a rim. The "hairline mineral boundaries" the design promised are barely there; plates don't separate; there's little sense of a solid with grain before the first strike. First impressions land here — the selector drops the visitor into this state.
- **Scale story:** the mineral field (64² on software) is Linear-interpolated up to the ≤320 px buffer, then CSS-stretched — softness is structural, not just a filter choice.
- **Mid-blast aftermath:** scarring persists (good) but reads a touch muddy where fissures cross multiple plates.

## Your freedom (full autonomy)

You own every visual decision: where the budget goes (field resolution vs presentation resolution vs shading complexity), how the pristine state gets its grain legibility, how fissures render (width, heat gradient, edge darkening), how the relief reads (light direction, specular character, faceting), whether the impact crown changes, and any shader restructure you want. You may rewrite any shader freely and touch `fault.ts` constants/helpers as needed. You may NOT: change the mode id/HUD/stats/phases, the interaction contract, the page/CSS, or add files beyond the existing two (truth-sync a `techniques` row only if your changes make the shipped wording false — emit the replacement `{ label, detail }` rows then).

## Output format (no approval-seeking anywhere)

1. **Deliberation** — the ≥3 considered strategies with the tradeoff argument, the committed choice with its one-paragraph defense, the failure modes you screened for and their guards, and the SwiftShader budget math for whatever you changed.
2. **Code** — `web/fault-shaders.ts` complete; then `web/fault.ts` complete OR the precise anchor-based replacements (per the mechanics above); plus any techniques-row replacement.
3. **Self-review notes** — what your own review pass caught and changed; what to eyeball when integrating (pristine at desktop 16/11 and mobile 3/4, mid-blast legibility at 320 px, restore identity, fps expectation).
