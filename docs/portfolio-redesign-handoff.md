# Portfolio redesign — design handoff

This is the durable design source of truth. Code shows what is implemented; this file records why the direction exists, what the user liked, what was rejected, and what must not be rediscovered by accident.

## Current active handoff — Refraction sea (2026-08-23)

**Status:** selected direction after the motion-led draft review (user ranked Refraction sea > Pixel assembly > Darkroom develop); the production homepage hero now follows the Refraction sea treatment.

### Outcome

Make the hero feel **dark, fluid, and evidential**. A WebGL caustic field — the liked liquid-glass reference rendered as slow light on a dark sea — becomes the hero's focal element, and the two projects float "beneath the surface" as warped specimen rows. The animation must demonstrate the copy's promise: look through the surface and the mechanics underneath become visible.

### Visual system

- **Surface:** the dark ink band stays limited to the hero; the collection below remains the warm concrete field. The sea fills the existing hero band only — no extra stage height.
- **Type:** Source Sans 3 for interface and headings, IBM Plex Mono for catalogue notation. Copy stays direct and plain; the kicker/headline/subheading must not repeat a phrase.
- **Structure:** two-column hero. Left: kicker `Prototypes, not promises`, H1 `See the mechanics before you commit.`, intro `Every project is a working model that shows how an idea behaves under real use.`, CTA `Run the models ↓`. Right: a translucent "beneath the surface" panel holding the two project rows (01 / tool, 02 / map) under a static SVG displacement warp with a slow CSS drift.
- **Weight:** deep ink base `#0b1317`, muted teal caustic light, ochre `#d39b61` accent carried over from the catalogue round. Caustic intensity stays low near the copy; a vignette keeps edges calm.
- **Copy:** no repeated phrase between kicker and intro; the value proposition (see the mechanics before committing) is stated once, plainly.

### Experience

- The caustic shader renders behind the copy at low intensity; it pauses when the hero is off-screen, when the tab is hidden, and under `prefers-reduced-motion` (single static frame).
- If WebGL is unavailable, the canvas falls back to a static two-glow gradient on the same deep ink field.
- The beneath-panel rows warp through an SVG turbulence filter and drift a few pixels; reduced motion freezes the drift and keeps the warp static.
- The project list, card activation behavior, direct links, and mobile gutters remain unchanged; the first project still arrives quickly below the hero.

### Quality gate

- The sea reads as an instrument for looking beneath the surface, not as a decorative screensaver; the copy stays dominant.
- The hero remains dark and specific without becoming a terminal, dashboard, copied-image collage, or large empty stage.
- The beneath panel previews the actual subjects of Code Layout and Practice Map.
- Keyboard focus, direct links, WCAG AA contrast, touch behavior, and `prefers-reduced-motion` remain intact.

## Superseded handoff — Dark catalogue (2026-08-23)

**Status:** superseded by Refraction sea after the motion-led draft review; kept as a graph node.

### Outcome

Make the portfolio feel **archival, tactile, and quietly technical**, with an original catalogue plate carrying the dark hero. Superseded because the plate was static: the user asked for an advanced animated focal element, and the motion drafts showed the dark mood survives without the plate.

### Carried into Refraction sea

- The dark ink band limited to the hero, the ochre accent, and the archival "evidence of work" framing.
- Original project-specific geometry instead of copied reference imagery (the beneath panel previews the two real projects).
- Direct copy, the fast path to the collection, and all list/interaction behavior.

## Superseded handoff — Quiet index (2026-08-22)

**Status:** selected direction after comparing ten visual routes; the production homepage now follows the Quiet index treatment.

### Outcome

Make the portfolio feel **quiet, assured, and useful**. It should read as a small collection of real systems, with the project list carrying the identity instead of a large hero scene or a design-review affordance.

### Visual system

- **Surface:** one flat warm-concrete field; no paper texture, radial glow, glass, or soft atmospheric gradient.
- **Type:** `Source Sans 3` for the interface and headings; `IBM Plex Mono` only for source/code content and the artwork's compact marks. Use 400 for reading text, 500 for orientation, and 600 for headings/actions. No expanded tracking, all-caps treatment, italics, or decorative underlines unless the element needs a clear interaction cue.
- **Structure:** projects are flush horizontal slabs separated by rules, not rounded floating cards. The project artwork is a hard-edged framed block inside each slab, with a smaller signal block anchoring the hero.
- **Weight:** use dark ink, firm rules, solid color blocks, and one project-specific accent. Avoid shadows and excessive border radii.
- **Copy:** direct and useful. No lore, journal voice, poetic labels, or metadata that does not help orientation. The landing ends after the project list; do not restore the removed collection/about/footer copy without explicit instruction.

### Experience

- The first viewport says `Small systems` and `Projects that make ideas usable.` before bringing the collection into view quickly.
- The hero has one compact, solid signal block with three connected points and a central marker. It is a quiet compositional anchor, not a story, navigation metaphor, or second information panel.
- The collection is a single ordered project list on desktop and mobile. Each row exposes number, status, title, description, technologies, artwork, and a direct link.
- Code Layout and Practice Map retain distinct artwork because the objects explain different project subjects.
- Project pages use the same type, surface, rule, and control language while preserving their behavior.
- Motion is limited to scroll reveal and a small artwork inspection response. There is no decorative signal pulse; text and layout remain stable.

### Architecture handoff

- `ProjectPresentation` is the project-owned semantic visual contract.
- `ProjectArtwork` is the shared artwork renderer and pointer-inspection module; geometry stays inside its implementation.
- `LandingPage` is the canonical production route. The older spatial prototype remains comparison-only.
- The Go service, project discovery, local Practice Map state, and Code Layout behavior are unchanged.

### Quality gate

- The collection feels materially grounded without becoming a dashboard, terminal, journal, or gallery of generic cards.
- The first viewport establishes the collection and reaches the first project row without a large empty stage.
- Headings are readable at 390px, have deliberate line breaks, and do not dominate the useful content.
- One sans family carries the interface with a restrained 400/500/600 weight system; labels remain sentence case and use normalized tracking and line-height.
- A project can be understood from its title and description without interacting with the artwork.
- Rules, solid blocks, and accents create hierarchy; they do not become decoration.
- Keyboard focus, direct links, mobile gutters, WCAG AA contrast, touch behavior, and `prefers-reduced-motion` remain intact.

## Compact decision graph

The graph is intentionally terse. When a direction is removed, keep its node and add an edge explaining why; never erase the evidence that produced the next direction.

```mermaid
flowchart LR
  A["Assembly field<br/>spatial instruments"] -->|"terminal-like / too much scene"| B["Quiet kinetic studio<br/>paper + serif + orbit"]
  B -->|"try-hard journal / unreadable generic type"| C["Readable signal index<br/>IBM Plex + soft cards"]
  C -->|"compact is good; cards and type lack solidity"| D["Solid field index<br/>Archivo + project slabs"]
  D -->|"keep solidity; typography and copy still noisy"| E["Calm field index<br/>Source Sans 3 + quiet type"]
  E -->|"generic hero; no memorable effect"| F["Selected systems index<br/>source graph + practice route"]
  F -->|"useful signal; too much visual weight for the index"| G["Quiet index<br/>compact signal + calmer hierarchy"]
  G -->|"dark catalogue field liked; copied reference image rejected"| H["Dark catalogue<br/>original project specimen plate"]
  H -->|"plate was static; user wanted an animated focal element"| I["Refraction sea<br/>caustic shader + submerged project rows"]
```

### Superseded nodes

- **Assembly field** — kept: project-specific objects, meaningful inspection, restrained motion. Rejected: a spatial world becoming the product and terminal/control-panel atmosphere.
- **Quiet kinetic studio** — kept: restraint and a small kinetic cue. Rejected: paper/journal framing, serif display type, poetic voice, and decorative orbit language.
- **Readable signal index** — kept: direct hierarchy, readable body text, systemacity, compactness, and project-specific artwork. Rejected: oversized heading moments, soft rounded cards, and a surface that feels generic or lightweight.
- **Solid field index** — kept: flush project slabs, firm rules, flat concrete field, and hard-edged artwork. Refined: Archivo/IBM Plex role-splitting, residual all-caps metadata, oversized headings, and auxiliary promotional copy.
- **Calm field index** — kept: Source Sans 3, restrained type scale, direct copy, and the flat field. Rejected/refined: a generic hero mark that did not leave a memorable relationship to the projects.
- **Quiet index** — superseded: keeps the solid field and project slabs, reduces the hero to a small three-point signal, removes the review affordance from production, and lets the project list carry more of the identity.
- **Dark catalogue** — superseded: kept the dark archival band, ochre accent, and original project evidence; replaced because the plate was static when the user asked for an animated focal element.
- **Refraction sea** — active: keeps the dark band, direct list, and project-specific evidence; adds a WebGL caustic field as the focal animation and submerges the two project rows beneath a warped surface.

### Kept alternates (motion round runners-up)

- **Pixel assembly (draft 01)** — liked: bitmap type over the portrait reference, print-born precision. Kept as a candidate for a future type-led pass; not implemented.
- **Darkroom develop (draft 10)** — liked: cursor-as-developer-light reveal, archival trace mood. Kept as a candidate if the sea ever feels too literal; not implemented.

### Persistent decisions

These survive every direction change unless the user explicitly reverses them:

- The primary job is to understand the collection and open a project.
- The interface is English and the copy is plain.
- Character comes from design quality, not lore or visual density.
- Each project owns its semantic visual identity and keeps distinct artwork.
- Interaction is optional enhancement, never the shortest path to understanding.
- Accessibility, mobile usability, reduced motion, and project behavior are non-negotiable.

## Append-only iteration ledger

Every review adds one compact entry. The **Liked** field becomes a constraint; the **Rejected** field becomes a guardrail; the new direction becomes a graph node only when it is materially different. Do not rewrite old entries to make the path look cleaner.

### Pass 4 — Readable signal index / compactness (2026-08-21)

- **Liked:** systemacity, direct hierarchy, readable body type, neutral surface, restrained signal, and more compact composition.
- **Rejected:** journal styling, oversized display type, decorative atmosphere, and generic poetic language.
- **Carried forward:** project-specific artwork, direct project links, stable text, reduced motion, and clear metadata.
- **Result:** compactness improved, but the surface still felt like soft generic cards rather than a solid design system.

### Pass 5 — Solid field index (2026-08-21)

- **Liked:** compactness remains a requirement; the useful content should arrive early.
- **Change:** replace the card catalogue with flush project slabs, firm rules, moderate Archivo headings, a flat concrete field, and hard-edged artwork blocks.
- **Rejected/deferred:** rounded card shells, shadows, soft gradients, oversized headings, decorative signal labels, and a new spatial world.
- **Quality gate:** the collection must feel grounded and specific at rest, with the projects carrying the visual weight instead of the container treatment.
- **Next review:** `/`, `/projects/code-layout`, and `/projects/practice-map` at 1440px, 1024px, and 390px; verify keyboard focus, touch fallback, reduced motion, and real copy lengths.

### Pass 6 — Calm field index / quiet type (2026-08-21)

- **Liked:** the solid field and compact project list remain the right structural direction.
- **Change:** use Source Sans 3 as the single interface/display family, keep mono only where code or compact artwork notation requires it, normalize labels to sentence case, lower the largest heading scales, and remove a redundant center label from the Code Layout artwork.
- **Removed:** the landing-page collection/about/footer block: `About the collection`, `Making is how I learn.`, its explanatory paragraph, `Built while learning in public`, and `More projects incoming`.
- **Rejected/refined:** remaining all-caps labels, expanded tracking, mixed UI type roles, decorative underlines, and typography that competes with the projects.
- **Quality gate:** the interface should feel composed at rest: one type family, three useful weights, consistent text rhythm, no promotional tail, and no heading larger than the content can support.
- **Verification:** `npm run typecheck`, `npm run build`, `go test ./...`, and `git diff --check` pass. Preview checked all three production routes at the available 408px viewport; Source Sans 3 loaded, removed copy is absent, no production all-caps remain, and there is no horizontal overflow or console error.
- **Next review:** `/`, `/projects/code-layout`, and `/projects/practice-map` at 1440px, 1024px, and 390px; verify focus, touch fallback, reduced motion, real copy lengths, and the final font-loaded state.

### Pass 7 — Selected projects / project signals (2026-08-22)

- **Liked:** the calm field, direct project list, and restrained type remain the right base.
- **Change:** make `Selected projects` the hero H1, remove the redundant `Selected projects` eyebrow and the collection heading `A small set of working systems.`, and shorten the intro to `Small systems for testing ideas and seeing what happens next.`
- **Changed figure:** replace the generic square-and-point hero mark with a compact source-structure panel and route graph joined by a central signal. The hero now previews the actual subjects of Code Layout and Practice Map.
- **Rejected:** generic signal geometry with no relationship to the work; the phrase `learning in public` in visible copy and metadata.
- **Quality gate:** the first viewport should identify the collection in one sentence and leave a concrete trace of the projects before the list begins. The figure must read as a source graph and a route, not as an abstract logo.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm --prefix portfolio run build`, `git diff --check`, accessibility snapshot, and mobile preview at 408px pass; the landing has no horizontal overflow and the hero exposes 20 SVG elements for the two project signals.
- **Next review:** test hover/focus response on the project signals and compare the hero balance at 1440px, 1024px, and 390px.

### Pass 8 — Quiet index / calmer hierarchy (2026-08-22)

- **Liked:** the comparison confirmed that the solid field, direct project list, and readable Source Sans 3 system are the strongest foundation.
- **Change:** promote `Quiet index` to production: use `Small systems` and `Projects that make ideas usable.` as the hero statement, replace the large source/route composition with a smaller three-point signal, tighten the project slab rhythm, and remove `Compare directions` from the production header.
- **Rejected/refined:** a large explanatory hero figure, a second review-oriented navigation path in the finished header, oversized project typography, and any treatment that makes the container louder than the work.
- **Quality gate:** the first viewport should feel composed and useful at rest; the hero should establish tone without delaying the first project; project rows should remain readable, distinct, and directly openable.
- **Verification:** `npm run typecheck`, `npm run build`, `git diff --check`, mobile preview at 408px, selection/navigation checks on the comparison route, and no horizontal overflow pass.
- **Next review:** inspect the Quiet index at 1440px, 1024px, and 390px with real project counts and long descriptions; verify keyboard focus, reduced motion, and whether the compact signal still feels specific rather than decorative.

### Pass 9 — Dark catalogue / original project plate (2026-08-23)

- **Liked:** the dark catalogue draft's contrast, archival mood, tactile image weight, and sharper visual point of view.
- **Rejected:** copying or collaging the reference image into the production hero; a photo-led treatment that does not explain the actual projects.
- **Carried forward:** Source Sans 3, direct project list, firm rules, restrained motion, project-specific identity, and a fast path to the collection.
- **Changed:** replace the compact signal block with an original dark catalogue plate containing Code Layout and Practice Map specimen sheets, catalogue notation, a central stitch marker, and small pointer inspection response. Update the hero copy to `Ideas should leave a trace.` and a direct working-prototype description.
- **Quality gate:** the hero must feel dark, archival, and specific without becoming a copied-image collage, terminal, dashboard, or large decorative scene.
- **Next review:** `/`, `/projects/code-layout`, and `/projects/practice-map` at 1440px, 1024px, and 390px; verify keyboard focus, touch fallback, reduced motion, real copy lengths, and the final font-loaded state.
- **Verification:** `npm run typecheck`, `npm run build`, and `git diff --check` pass; the compiled Dark catalogue hero was visually checked at the available 408px viewport with no horizontal overflow or console errors. The project list remains unchanged and the reduced-motion CSS fallback leaves the catalogue plate stable.

### Pass 10 — Refraction sea / animated focal element (2026-08-23)

- **Liked:** from the motion draft round — the caustic shader sea (draft 02) ranked first, bitmap pixel type (draft 01) second, darkroom reveal (draft 10) third; the dark field, fluid light, and the "mechanics beneath the surface" idea.
- **Rejected:** the catalogue plate's stillness (no animated focal element); repeating a phrase between kicker and subheading; any full-bleed scene that delays the first project.
- **Carried forward:** the dark ink hero band, ochre accent, direct copy rules, project-specific evidence in the hero, fast path to the collection, and all list behavior.
- **Changed:** replace the catalogue plate with a WebGL caustic field (`RefractionField`) behind the hero copy and a translucent beneath-surface panel holding the two project rows under an SVG displacement warp with a slow drift. New hero copy: `Prototypes, not promises` / `See the mechanics before you commit.` / `Every project is a working model that shows how an idea behaves under real use.` CTA: `Run the models ↓`. Meta description updated to match.
- **Quality gate:** the sea must read as an instrument, not a screensaver; copy stays dominant; the shader pauses off-screen and on hidden tabs; reduced motion gets a single frame and frozen drift; WebGL failure falls back to a static gradient; the first project still arrives quickly.
- **Verification:** `npm run typecheck` and `npm run build` pass; routes `/`, `/projects/code-layout`, and `/projects/practice-map` to review at 1440px, 1024px, and 390px with keyboard focus, touch, and reduced-motion checks.
- **Next review:** confirm caustic intensity keeps AA contrast behind the copy at all three viewports; check shader performance on low-power devices; decide whether the beneath panel's warp scale needs tuning.


## Deterministic handoff protocol

1. Read the active direction, persistent decisions, graph, and latest ledger entry before editing.
2. Derive the next pass from the latest **Liked** and **Rejected** fields; do not restart from the code's current appearance alone.
3. Make one coherent visual change and preserve unrelated behavior.
4. Review the fixed routes, viewports, states, and content lengths named by the entry.
5. Append the result before beginning another pass. If a trait is removed, collapse it into a graph node with its reason instead of deleting it.
6. Stop when the quality gate passes. A new aesthetic idea is a new decision and must enter the graph before implementation.

The canonical workflow for this protocol is `/design-iteration`; `/design-planning` and `/planning` remain the lower-level choice and execution-plan skills.
