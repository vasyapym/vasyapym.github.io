# Portfolio redesign — design handoff

**Status:** approved hybrid direction; implementation pass 1 in progress
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

## Approved direction — Signal Grid + Transmission Deck

Use Signal Grid as the structural foundation: a calm, content-first two-column grid, equal project weight, clear title/description hierarchy, and a durable information-design system. Add Transmission Deck as the atmospheric layer: restrained technical rails, status markers, project-type signals, layered card surfaces, and playful speculative details. The atmosphere must never make the project content harder to understand.

The first implementation pass should establish the shared shell, English content, typography, card hierarchy, surface tokens, Text Lens electric-blue accent, and responsive/accessibility rules. Motion and richer speculative details follow as a separate pass after the static hierarchy is reviewed.

## Open decisions for the next round

- What exact accent token mapping should project types use?
- Which motion details should survive the first visual review?
- Which additional project data should be introduced when the collection grows?

## Independent direction A — Signal Grid

**Brainstorm.** This direction treats the portfolio as a quiet research index rather than a landing-page spectacle. The strongest signal is the work itself: a precise title and subtitle establish the premise, then an evenly weighted grid lets each experiment stand on its own. The sci-fi quality comes from the language of signals, systems, and observation, while the visual surface stays calm enough to read. The orbit is not a hero illustration; it becomes a small instrument embedded in each card, with pointer motion revealing depth only when the visitor chooses to engage.

**Design plan.** The page begins with the small `Selected Experiments` wordmark in the upper-left, followed by `Projects for learning by making.` and its direct subtitle. There is no oversized hero object. A two-column desktop grid follows, with title and description carrying the hierarchy and a compact artwork zone acting as the card's signal. The global surface is near-black with one restrained radial glow, cards have a quiet radius, and metadata uses mono. Sora supplies the large geometric headings. Text Lens uses electric blue; future project types receive their accents through a deterministic mapping. The two-line speculative about note sits after the grid, before a minimal footer. The orbit and card artwork can respond to the pointer, but text and layout remain stable.

**Execution plan.** The first implementation pass would simplify the page structure and content hierarchy without changing project discovery or the Go service. The second would replace the current visual tokens, typography, card geometry, and responsive rules with this information-design system. The third would add the orbit inertia and artwork-only tilt behind a reduced-motion guard, then verify keyboard focus, contrast, touch behaviour, and mobile density. No implementation starts until this direction has been compared with an independent alternative and explicitly approved.

## Independent direction B — Transmission Deck

**Brainstorm.** This direction treats the collection as a small speculative instrument rather than an index. The visitor is not browsing a catalogue; they are entering a transmission deck where each project is a station with a status, a signal, and a point of view. The same content-first constraints remain, but the atmosphere is more playful and visibly science-fictional. Thin rails, status marks, and layered surfaces make the system feel active, while the copy gives the page the feeling of an optimistic field report from an unfamiliar place.

**Design plan.** The small `Selected Experiments` wordmark still anchors the upper-left, but a quiet status line can sit opposite it, showing the collection as an active set rather than a static archive. The title and subtitle remain direct, followed by an equal two-column grid. Each card behaves like a rounded observation window: the number, status, and accent signal sit on a sharp technical rail; the title and description dominate the body; the artwork is a compact instrument at the edge rather than a large illustration. The near-black background gains a single controlled glow and faint depth layers inside cards. Sora headings become more compressed and assertive, mono metadata becomes more visible, and each project-type accent appears as a narrow luminous edge, signal dot, or small field marker. Pointer movement gives the artwork a slightly more apparent 3–4° response, while the orbit creates a soft sense of micro-gravity. The about block becomes a short transmission note after the grid.

**Execution plan.** The first implementation pass would keep the same semantic page and project contracts but introduce the deck vocabulary: status rails, signal markers, card layers, and the transmission-style about block. The second would tune the surface depth, accent behaviour, typography scale, and compact artwork placement across desktop and mobile. The third would add the pointer-driven field response with the same reduced-motion fallback and accessibility guarantees, then compare whether the extra atmosphere improves discovery or distracts from the projects. No implementation starts until this direction is compared with Signal Grid and explicitly approved.

## Comparison checkpoint

Direction A makes the collection feel like a calm research index: quieter, clearer, and more durable as the number of projects grows. Direction B makes it feel like an active speculative instrument: more memorable, more playful, and closer to the user's science-fiction reference, but with a higher risk of visual noise. The approved hybrid keeps A's information hierarchy and B's atmosphere.

Implementation is now approved. Keep each pass small and reviewable: establish the static shell first, review it, then add motion and richer speculative details. Record decisions, alternatives, and outcomes in this handoff.
