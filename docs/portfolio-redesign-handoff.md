# Portfolio redesign — design handoff

**Status:** active grilling, round 3 complete
**Implementation status:** do not change the UI yet
**Last updated:** 2026-08-19

## Current target

Improve the portfolio shell as a curated collection of roughly 4–8 projects. The first visit should make the collection understandable, create a sense of the author's taste, and make it easy to open a project. Text Lens remains the first project, but the first iteration focuses on the landing page and shared project frame rather than redesigning the Text Lens page itself.

## Settled decisions

- **Primary job:** help visitors understand the collection and open a project.
- **Secondary job:** communicate the author's taste and point of view without making the site about the Luna model.
- **Naming direction:** use `Selected Experiments`; do not keep `Luna Lab`.
- **Visual direction:** keep the dark experimental/editorial foundation, but bring in the clarity and restraint of information design.
- **Reference vocabulary:** product-forward, high-contrast, dark, futuristic without sci-fi decoration, bold display type, restrained accent color, modular surfaces, deliberate negative space, and a clear visual hierarchy. References supplied by the user: you.com, grok.com, and Meta AI websites.
- **First viewport:** use a characteristic title, a direct explanatory subtitle, and a calm project list rather than a dominant hero illustration or dashboard.
- **Orbit motif:** keep the current orbit idea, but make it a subtle and repeatable design-system motif instead of the main attraction.
- **Project layout:** give projects equal visual weight in the current grid, while keeping the structure extensible to a curated set of 4–8.
- **Card content:** retain the current full metadata set for now: number, status, eyebrow, title, description, technologies, and arrow.
- **Color:** use a near-monochrome global system; project-specific accents are allowed, but there should not be a competing global lime/coral/blue palette.
- **Author presence:** include a short process-oriented about section and a small header/footer signature; do not add a full standalone bio or contact block in this pass.
- **Typography:** keep mono for metadata, but explore a more expressive display typeface for the main titles.
- **Motion:** make pointer-responsive orbit/card behaviour the first experiment, while keeping the rest of the interaction language restrained. Respect reduced-motion preferences.
- **First scope:** redesign the landing page and shared project frame. Do not change the Go service or analysis behaviour.
- **Success criteria:** within a few seconds, a visitor understands what the collection is; shortly after, they understand what Text Lens does. The design does not need to optimize for a broader catalogue or dashboard yet.
- **Frame:** use a minimal back link and project label so each project can remain its own world.
- **Scale assumption:** design for a curated set of 4–8 projects, without filters or catalogue machinery until the collection requires them.

## Rejected or deferred for now

- A light-only visual direction.
- A large catalogue, filtering, or dashboard model.
- A featured-card hierarchy that makes one project permanently more important than the others.
- A full Text Lens workspace redesign in the first pass.
- Full shared navigation or an app-like project switcher.
- A competing global lime/coral/blue palette.
- A full standalone bio or contact block.
- Luna-specific branding or model-related framing.

## Open decisions for the next round

- What exact title, subtitle, and process-oriented about copy should be used?
- Which display typeface best expresses the chosen character without harming readability?
- What exact pointer-responsive behaviour should the orbit/cards have, and what is the reduced-motion fallback?
- How should the full metadata card layout remain calm at 4–8 projects and on mobile?
- How should project-specific accent colors be selected and constrained?
- What responsive and accessibility constraints must shape the design from the start?

## Process checkpoint

Continue grilling until the design tree is settled. Then produce two independent design directions, compare them, and wait for explicit approval before implementation. Keep each implementation pass small and reviewable; record decisions, alternatives, and outcomes in this handoff.
