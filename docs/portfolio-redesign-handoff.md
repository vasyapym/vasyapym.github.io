# Portfolio redesign — design handoff

**Status:** design tree settled after round 8
**Implementation status:** do not change the UI yet
**Last updated:** 2026-08-19

## Current target

Improve the portfolio shell as a curated collection of roughly 4–8 projects. The first visit should make the collection understandable, create a sense of the author's taste, and make it easy to open a project. Text Lens remains the first project, but the first iteration focuses on the landing page and shared project frame rather than redesigning the Text Lens page itself.

## Settled decisions

- **Primary job:** help visitors understand the collection and open a project.
- **Secondary job:** communicate the author's taste and point of view without making the site about the Luna model.
- **Naming direction:** use `Selected Experiments`; do not keep `Luna Lab`.
- **Header treatment:** place `Selected Experiments` in the top-left as a small wordmark.
- **Language:** use a fully English interface.
- **Visual direction:** keep the dark experimental/editorial foundation, but bring in the clarity and restraint of information design.
- **Reference vocabulary:** product-forward, high-contrast, dark, futuristic without sci-fi decoration, bold display type, restrained accent color, modular surfaces, deliberate negative space, and a clear visual hierarchy. References supplied by the user: you.com, grok.com, and Meta AI websites.
- **First viewport:** use the title `Projects for learning by making.` with the subtitle `Small systems for testing ideas, learning in public, and seeing what happens next.`, followed by a calm project list rather than a dominant hero illustration or dashboard.
- **Orbit motif:** keep the current orbit idea, but make it a subtle and repeatable design-system motif instead of the main attraction. It may move with the pointer on capable devices.
- **Project layout:** give projects equal visual weight in a two-column desktop grid with a compact artwork zone and content-first hierarchy; collapse to one column on mobile while keeping the full metadata visible.
- **Card content:** retain the current full metadata set for now: number, status, eyebrow, title, description, technologies, and arrow. Keep all of it visible on mobile as well, with title and description taking visual priority over artwork.
- **Color:** use a near-monochrome global system; each project gets one accent selected automatically from its project type. Text Lens uses electric blue. Do not use a competing global lime/coral/blue palette.
- **Surface language:** use a mixed geometry system: subtly rounded cards with sharper metadata and frame elements. Use a nearly flat dark background with one restrained radial glow.
- **Author presence:** include a two-line process-oriented about section and a small header/footer signature; place the about section after the projects and before the footer. Use the copy `These experiments are small signals from a larger practice: making things to understand how they work.` with a playful speculative voice. Do not add a full standalone bio or contact block in this pass.
- **Typography:** use `Sora` for expressive geometric/futuristic display headings and keep mono for metadata.
- **Motion:** make the orbit follow the pointer with inertia and give only the artwork/orbit inside cards a visible-but-calm 3–4° tilt/parallax response; keep text stable. When reduced motion is requested, remove pointer-driven motion but retain ordinary state transitions.
- **Quality constraints:** preserve keyboard navigation and visible focus, meet WCAG AA text contrast, keep pointer effects non-essential, avoid fake hover on touch, and make the layout fully usable on mobile.
- **First scope:** redesign the landing page and shared project frame. Do not change the Go service or analysis behaviour.
- **Success criteria:** within a few seconds, a visitor understands what the collection is; shortly after, they understand what Text Lens does. The design does not need to optimize for a broader catalogue or dashboard yet.
- **Frame:** use a minimal back link and project label so each project can remain its own world.
- **Scale assumption:** design for a curated set of 4–8 projects, without filters or catalogue machinery until the collection requires them.

## Rejected or deferred for now

- A light-only visual direction.
- A Russian-only interface.
- A large catalogue, filtering, or dashboard model.
- A featured-card hierarchy that makes one project permanently more important than the others.
- A full Text Lens workspace redesign in the first pass.
- Full shared navigation or an app-like project switcher.
- A competing global lime/coral/blue palette.
- A full standalone bio or contact block.
- Luna-specific branding or model-related framing.

## Open decisions for the next round

- Which two independent visual directions should be carried into comparison?
- What exact accent token mapping should project types use?
- Which design direction should be approved for the first implementation pass?

## Independent direction A — Signal Grid

**Brainstorm.** This direction treats the portfolio as a quiet research index rather than a landing-page spectacle. The strongest signal is the work itself: a precise title and subtitle establish the premise, then an evenly weighted grid lets each experiment stand on its own. The sci-fi quality comes from the language of signals, systems, and observation, while the visual surface stays calm enough to read. The orbit is not a hero illustration; it becomes a small instrument embedded in each card, with pointer motion revealing depth only when the visitor chooses to engage.

**Design plan.** The page begins with the small `Selected Experiments` wordmark in the upper-left, followed by `Projects for learning by making.` and its direct subtitle. There is no oversized hero object. A two-column desktop grid follows, with title and description carrying the hierarchy and a compact artwork zone acting as the card's signal. The global surface is near-black with one restrained radial glow, cards have a quiet radius, and metadata uses mono. Sora supplies the large geometric headings. Text Lens uses electric blue; future project types receive their accents through a deterministic mapping. The two-line speculative about note sits after the grid, before a minimal footer. The orbit and card artwork can respond to the pointer, but text and layout remain stable.

**Execution plan.** The first implementation pass would simplify the page structure and content hierarchy without changing project discovery or the Go service. The second would replace the current visual tokens, typography, card geometry, and responsive rules with this information-design system. The third would add the orbit inertia and artwork-only tilt behind a reduced-motion guard, then verify keyboard focus, contrast, touch behaviour, and mobile density. No implementation starts until this direction has been compared with an independent alternative and explicitly approved.

## Process checkpoint

The design tree is settled. Produce two independent visual directions, compare them, and wait for explicit approval before implementation. Keep each implementation pass small and reviewable; record decisions, alternatives, and outcomes in this handoff.
