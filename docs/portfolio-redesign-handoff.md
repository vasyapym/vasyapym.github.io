# Portfolio redesign — design handoff

**Status:** active grilling, round 2 complete
**Implementation status:** do not change the UI yet
**Last updated:** 2026-08-19

## Current target

Improve the portfolio shell as a curated collection of roughly 4–8 projects. The first visit should make the collection understandable, create a sense of the author's taste, and make it easy to open a project. Text Lens remains the first project, but the first iteration focuses on the landing page and shared project frame rather than redesigning the Text Lens page itself.

## Settled decisions

- **Primary job:** help visitors understand the collection and open a project.
- **Secondary job:** communicate the author's taste and point of view without making the site about the Luna model.
- **Naming direction:** use a neutral label such as `Projects / Experiments`; do not keep `Luna Lab`.
- **Visual direction:** keep the dark experimental/editorial foundation, but bring in the clarity and restraint of information design.
- **Reference vocabulary:** product-forward, high-contrast, dark, futuristic without sci-fi decoration, bold display type, restrained accent color, modular surfaces, deliberate negative space, and a clear visual hierarchy. References supplied by the user: you.com, grok.com, and Meta AI websites.
- **First viewport:** use a minimal title and a calm project list rather than a dominant hero illustration or dashboard.
- **Orbit motif:** keep the current orbit idea, but make it a subtle and repeatable design-system motif instead of the main attraction.
- **Project layout:** give projects equal visual weight in the current grid, while keeping the structure extensible to a curated set of 4–8.
- **Color:** use a near-monochrome global system; project-specific accents are allowed, but there should not be a competing global lime/coral/blue palette.
- **Author presence:** include an about section and a small header/footer signature; exact wording and placement remain open.
- **Motion:** keep the default interaction language restrained, while leaving room for controlled experiments. Respect reduced-motion preferences.
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
- Luna-specific branding or model-related framing.

## Open decisions for the next round

- What exact form should the neutral label take, and what should the about section say?
- Which reference qualities are essential versus merely decorative?
- What exact title and one-sentence explanation belong in the minimal first viewport?
- What information should each equal-weight project card show before opening it?
- How should project-specific accent colors be selected and constrained?
- Which motion experiment is worth prototyping first, and what is the reduced-motion fallback?
- What responsive and accessibility constraints must shape the design from the start?

## Process checkpoint

Continue grilling until the design tree is settled. Then produce two independent design directions, compare them, and wait for explicit approval before implementation. Keep each implementation pass small and reviewable; record decisions, alternatives, and outcomes in this handoff.
