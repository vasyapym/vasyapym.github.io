# Portfolio redesign — design handoff

This is the durable design source of truth. Code shows what is implemented; this file records why the direction exists, what the user liked, what was rejected, and what must not be rediscovered by accident.

## Current active handoff — Ink catalogue (2026-08-23, refined 2026-08-24)

**Status:** selected direction after the user named the hero's right-side panel as the design standard (`beneath the surface / 01 / tool — Code Layout / 02 / map — Practice Map`) and asked for that style everywhere plus minimal copy. Refined by Pass 12 into a fully static hero with real identity branding.

### Outcome

Make the whole portfolio read as **one continuous dark field organized by catalogue notation**. The deep-ink base `#0b1317` leaves the hero band and becomes the page surface; every section speaks the beneath-panel language: translucent bordered surfaces, lowercase IBM Plex Mono microcopy, ochre `NN / tag` marks, and thin light rules. Copy shrinks to the essential identification layer.

### Visual system

- **Surface:** full-page deep ink `#0b1317`. The warm concrete field is retired from the landing. Panels use translucent light fills (`rgba(238, 234, 224, 0.045)`) over thin light lines. The caustic sea was retired in Pass 12; the hero band carries the static two-glow ink gradient that used to be its WebGL fallback.
- **Type:** Source Sans 3 for headings and reading text; IBM Plex Mono carries all catalogue notation (wordmark, count, kicker, tags, links, chrome labels). Mono notation is lowercase except the personal name, which reads proper case.
- **Notation:** every project carries a mono tag (`tool`, `map`, `sim`, `test`) on `ProjectModule.tag`; numbers come from list order. The hero panel derives its inline rows (`01 / tool — Code Layout`) from the same data instead of hardcoding two titles.
- **Weight:** ochre `#d39b61` is the accent (tags, kicker, hover); bright ochre `#e8b57c` is the focus ring on ink. Project artwork identities stay untouched inside light-lined frames.
- **Identity:** the landing header is the owner's name and email — `Vasily Argounov | vasyapym@gmail.com` (name links home, email is a mailto link); `<title>` is `Vasily Argounov`; project-frame chrome links back with `← Vasily Argounov`.
- **Copy:** hero keeps only kicker `prototypes`, H1 `A collection of digital experiences`, CTA `Run the models ↓`. Cards keep tag row (number/tag + technologies), title, one-line description, and `open ↗`. No status text while everything is available.

### Experience

- **The hero is fully static on ≥561px** — no shader, no drift, no load-time animation (Pass 12). On phones (≤560px, Pass 19) the hero carries one motion idea: three parallax glow layers behind plain catalogue rows plus a one-time staggered entrance; reduced motion freezes everything. The page's other motion is the project-card reveal-on-scroll.
- Beneath rows keep a static SVG displacement warp; no reduced-motion override is needed because nothing moves.
- WebGL failure is no longer a hero concern — there is no canvas.
- Project-frame chrome is an ink band: back link `← Vasily Argounov`, mono lowercase `{title}` label. Tool interiors keep their functional styling; they receive shortened intros and lose decorative captions.
- Reveal-on-scroll, direct links, keyboard focus, touch fallback, and mobile gutters are unchanged.

### Quality gate

- The page must read as one system: if any section still looks like the old light index, the pass failed.
- Mono notation appears wherever orientation is needed and nowhere as decoration.
- Muted text on ink keeps ≥4.5:1 contrast; focus rings are visible at every viewport.
- A project is still identifiable and openable from its card without artwork interaction.

## Superseded handoff — Refraction sea (2026-08-23)

**Status:** superseded by Ink catalogue after the user picked the beneath-surface panel as the design standard; kept as a graph node.

### Carried into Ink catalogue

- The caustic sea as hero focal element, its pause/fallback behavior, and the "mechanics beneath the surface" framing.
- The dark ink band (now extended full-page), ochre accent, direct copy rules, and fast path to the collection.
- The two-column hero with the translucent beneath panel, warp filter, and drift.

### Superseded

- The rule that the collection below stays a warm concrete field — the user asked for the panel's style across the entire design.
- The hardcoded two-row panel and the stacked row layout (replaced by derived inline rows).

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
  I -->|"beneath panel promoted to the standard; full-page ink + copy diet"| J["Ink catalogue<br/>derived tag notation on a full-page ink field"]
  J -->|"square box cluttered phones; user picked layered glows + multi-parallax"| K["Mobile depth field<br/>glow layers + parallax rows on phones"]
```

### Superseded nodes

- **Assembly field** — kept: project-specific objects, meaningful inspection, restrained motion. Rejected: a spatial world becoming the product and terminal/control-panel atmosphere.
- **Quiet kinetic studio** — kept: restraint and a small kinetic cue. Rejected: paper/journal framing, serif display type, poetic voice, and decorative orbit language.
- **Readable signal index** — kept: direct hierarchy, readable body text, systemacity, compactness, and project-specific artwork. Rejected: oversized heading moments, soft rounded cards, and a surface that feels generic or lightweight.
- **Solid field index** — kept: flush project slabs, firm rules, flat concrete field, and hard-edged artwork. Refined: Archivo/IBM Plex role-splitting, residual all-caps metadata, oversized headings, and auxiliary promotional copy.
- **Calm field index** — kept: Source Sans 3, restrained type scale, direct copy, and the flat field. Rejected/refined: a generic hero mark that did not leave a memorable relationship to the projects.
- **Quiet index** — superseded: keeps the solid field and project slabs, reduces the hero to a small three-point signal, removes the review affordance from production, and lets the project list carry more of the identity.
- **Dark catalogue** — superseded: kept the dark archival band, ochre accent, and original project evidence; replaced because the plate was static when the user asked for an animated focal element.
- **Refraction sea** — superseded: kept the caustic sea hero, beneath panel, and dark band; replaced because its two-tone split (dark hero over light collection) broke the consistency the user asked for when naming the panel the design standard.
- **Ink catalogue** — active: extends the ink field across the page, derives catalogue rows from a per-project tag, and reduces copy to the identification layer. Pass 12 refined it into a fully static hero: the caustic sea (carried from Refraction sea) was retired for the public presentation — its static two-glow fallback gradient remains as the hero band's background, and it stays a candidate if a future pass wants an animated focal element back.
- **Mobile depth field** — active, mobile-only refinement of Ink catalogue (Pass 19): on phones (≤560px) the beneath box dissolves into plain catalogue rows over three parallax glow layers with a one-time staggered entrance; Pass 12's static-hero rule now holds for ≥561px only. The 19 unchosen draft treatments remain alternates on `/mobile-hero-directions`.

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

### Pass 11 — Evening Forest / first-person showcase project (2026-08-23)

- **Liked:** the landing's dark sea hero gains its first fully self-contained 3D showcase; the terrain-motion card language extends naturally to a walking simulator; dusk palette (violet zenith, amber horizon) echoes the ochre accent without competing with it.
- **Rejected:** iframe embedding (bigbang-ts pattern) — R3F mounts natively and stays code-split behind `loadPage`; photo-real rendering — contradicts both the 8-bit brief and the shell's flat archival mood.
- **Carried forward:** project-module discovery contract, per-project semantic identity, reduced-motion and touch fallbacks, no binary assets in the repo.
- **Changed:** added `projects/evening-forest` — an R3F walking sim with procedural terrain/foliage/fireflies, pointer-lock WASD rig, one custom postprocessing effect (dusk grade + Bayer dither + posterize) over a low-DPR pixelated canvas, and synthesised WebAudio ambience. New dependency group in `shell`: `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing`; `three` raised to ^0.185.1 for peer compatibility. Landing card uses the existing terrain motion with a warm accent block in `styles.css`.
- **Quality gate:** the forest must read as an evening instrument, not a tech demo — copy dominance on the landing card holds, the page keeps 60 fps via instancing + low internal resolution, audio starts only from a user gesture, Esc always returns control, and WebGL/touch/reduced-motion states degrade to honest notices instead of broken canvases.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm run build`, and `node --experimental-strip-types tests/forest.check.ts` pass; `/projects/evening-forest` and `/` reviewed for console errors and focus order at desktop width.
- **Next review:** tune fog density vs draw distance after playtesting; confirm bloom threshold keeps fireflies readable through the posterize pass; consider a mobile drag-look mode if coarse-pointer visits matter.

### Pass 11 — Ink catalogue / beneath-panel standard (2026-08-23)

- **Liked:** the hero's right-side panel — dark translucent surface, lowercase mono microcopy, ochre `01 / tool` notation, thin rules — named by the user as the design standard for the whole portfolio.
- **Rejected:** the two-tone split (dark hero over warm-concrete collection); hardcoded hero rows that ignore the real list; redundant copy (hero intro sentence, card eyebrows, status text while everything is available, duplicated technology lists, decorative captions).
- **Changed:** full-page ink field with new `--ink-*` tokens and an ochre focus ring on dark; wordmark/count/CTA/card links set in mono lowercase; cards restructured to tag row (`NN / tag` + technologies) / title / one-line description / `open ↗`; beneath panel derives inline rows (`01 / tool — Code Layout`) from `ProjectModule.tag` (`tool`, `map`, `sim`, `test`) across all four projects; project-frame chrome becomes an ink band with `← Selected Experiments` and a mono `{title}` label; interiors receive trimmed intros and lose decorative captions; meta description shortened.
- **Quality gate:** the page reads as one catalogue system at rest; mono notation carries orientation without decoration; muted-on-ink text keeps ≥4.5:1 contrast; focus visible on every surface; reveal/warp/drift behavior and reduced-motion fallbacks unchanged; first project still arrives quickly.
- **Verification:** `npm run typecheck`, `npm run build`, and `git diff --check` pass; dev-server smoke test returns 200 for `/` and `/projects/code-layout` with the updated meta description. Visual review of `/` plus `/projects/{code-layout,practice-map,bigbang-ts,explosion_luna}` at 1440px, 1024px, and 390px still to confirm: AA contrast for every light-on-dark pair, font-loaded state, no horizontal overflow, keyboard focus, reduced motion.
- **Next review:** the routes above at three viewports; judge whether the sea's intensity needs lowering now that the surrounding field is also dark.


### Pass 12 — Static ink hero / identity header (2026-08-24)

- **Liked:** the catalogue system at rest — full-page ink, mono notation, beneath panel — remains the right public face; the hero's static two-glow gradient (formerly the WebGL fallback) reads calm and professional.
- **Rejected:** hero motion for a public-facing portfolio (caustic shader animation, beneath-row drift); placeholder branding (`Selected Experiments`, `Prototypes, not promises`) on a personal site.
- **Changed:** landing header reads `Vasily Argounov | vasyapym@gmail.com` — name links home in proper case, email is a mailto link; project-frame back link becomes `← Vasily Argounov`; `<title>` → `Vasily Argounov`; meta description → `Prototypes — see the mechanics before you commit.`; hero kicker shortened to `prototypes`; `RefractionField` deleted and the static two-glow gradient moved onto the hero band background; beneath-row drift animations, their keyframes, their reduced-motion overrides, and the row-a/row-b variants removed. The static SVG displacement warp on the beneath rows stays (no motion).
- **Quality gate:** the page stays one calm catalogue system with zero hero animation at load or at rest; identity readable at 390px without overflow or truncation; muted-on-ink contrast ≥4.5:1 for name/email/count; focus visible on wordmark and email links; card reveal-on-scroll unchanged; comparison-only routes untouched.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm --prefix portfolio run build`, `git diff --check`, and dev-server smoke test pass; see results below.
- **Next review:** `/` plus `/projects/{code-layout,practice-map,bigbang-ts,explosion_luna}` at 1440px, 1024px, and 390px; judge whether the static gradient needs more presence now that the sea is gone, and whether the proper-case name sits well against lowercase mono notation.

### Pass 13 — Hero statement / collection framing (2026-08-24)

- **Rejected:** `See the mechanics before you commit.` as the public hero statement — the user reframed the site as a portfolio of experiences rather than a lab pitch.
- **Changed:** H1 → `A collection of digital experiences`; meta description → `Prototypes — a collection of digital experiences.` Kicker `prototypes` stays.
- **Quality gate:** the first viewport reads as a personal portfolio; copy remains minimal; no other sections touched.
- **Verification:** typecheck, build, and smoke test pass (same session as Pass 12).
- **Next review:** unchanged from Pass 12.

### Pass 14 — Ink interior / Code Layout conversion (2026-08-24)

- **Liked:** the landing's ink catalogue system as the named standard; the tool interior now speaks it end to end.
- **Rejected:** the light blue-era interior (`--index-blue` accents, light surfaces) as a two-tone break inside one ink frame; marketing hero copy — eyebrow, intro paragraph, the `Structure.` display heading, decorative artifact captions.
- **Changed:** `/projects/code-layout` converted to a full-bleed ink field via a `code-layout-field` wrapper (the shared `.project-frame` stays light for the not-yet-converted interiors): translucent `--ink-panel` surfaces, `--ink-line` rules, zero radii, `color-scheme: dark`; all blue → ochre with the bright-ochre focus ring; Analyze button solid ochre with ink text, no hover lift; toolbar labels, footer note, results heading, and insight values set in lowercase mono; artifact plates recolored to the ink/ochre family over the hero's static two-glow gradient. Copy diet: H1 → `Source in. Structure out.`, CTA → `Try it ↓`, `Load sample ↗`, footer → `runs locally · nothing executed`, results heading collapsed to `layout · {language}` with `n lines · x% confidence · copy` meta.
- **Quality gate:** the interior reads as one catalogue system with the frame chrome; muted-on-ink text ≥4.5:1; focus ring visible on every control; form behavior and the Go service untouched.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm --prefix portfolio run build`, `git diff --check`, `go test ./...` (service), dev-server smoke 200 for `/` and `/projects/code-layout`; headless screenshots at 1440/1024/390 — no horizontal overflow, lowercase mono notation, contrast holds. Results state reviewed statically (same token system).
- **Next review:** run a real analysis and review the results section at the three widths; decide whether the planck-to-now and practice-map interiors get the same conversion.

### Pass 15 — Ink interior / Explosion conversion (2026-08-24)

- **Liked:** the ink catalogue system as the named standard; the interior now reads as one catalogue with the frame chrome; payload notation rows echo the beneath panel.
- **Rejected:** the light blue-era interior with rust/red accents as a two-tone break inside one ink frame; marketing copy — eyebrow, intro paragraph, the `A small room for large reactions.` display heading, payload sentences, footer paragraph; uppercase stage notation.
- **Changed:** `/projects/explosion` converted to a full-bleed ink field via an `explosion-field` wrapper (the shared `.project-frame` stays light for the not-yet-converted interiors): `--ink-*` tokens, `color-scheme: dark`, bright-ochre focus ring; stage re-based on the ink gradient keeping its grid overlay and two-glow depth; payload cards → beneath-panel-style mono tag rows (`01 / core` … `04 / spark cloud`); stage heading collapsed to a mono meta row (`live · click or press enter`, switching to `reduced motion · blast disabled`); stage overlay lowercase (`specimen / lx-01`, `nnn impacts`); footer removed. Copy diet: H1 → `Click anywhere. / It breaks.`, CTA → `Detonate ↓`, fallback → `webgl unavailable · specimen sealed`; landing card description → `Every click inside the room detonates at the point of impact.`; card note → `impact test`. Scene behavior and palette in `detonate.ts` untouched.
- **Quality gate:** the interior reads as one catalogue system with the frame chrome; muted-on-ink text ≥4.5:1; focus ring visible on the stage and links; detonation behavior, reduced-motion disable, and WebGL fallback unchanged.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm run build`, and `git diff --check` pass; dev-server smoke returns 200 for `/`, `/projects/explosion`, and `/projects/code-layout` with the identity `<title>`; headless screenshots at 1440/1024/390 show no horizontal overflow, lowercase mono notation, and a coherent fallback state (headless Chrome has no WebGL); landing card shows the shortened description.
- **Next review:** view `/projects/explosion` with WebGL enabled to judge the scene palette against the ink field; decide whether the remaining light interiors (planck-to-now, practice-map, kitty-run) get the same conversion.

### Pass 16 — Ink interior / Planck to Now conversion (2026-08-24)

- **Liked:** the ink catalogue system as the named standard; `/projects/planck-to-now` and the standalone `/planck-to-now/` HUD now read as one catalogue with the frame chrome; the epoch panel echoes the beneath panel and stays legible over the Big-Bang flash.
- **Rejected:** the light blue-era interior (`--index-*` surfaces, rust `#a8652d` eyebrow, blue hover) as a two-tone break inside one ink frame; marketing copy — eyebrow, intro paragraph, `The Big Bang in motion.` display heading, footer link row; HUD decoration — uppercase letterspaced epoch title, italic description, glow text-shadows, blue-white palette.
- **Changed:** project page converted to a full-bleed ink field via a `planck-field` wrapper (the shared `.project-frame` stays light for the not-yet-converted interiors): `--ink-*` tokens, `color-scheme: dark`, bright-ochre focus ring, zero radii, iframe border → `--ink-line`; facts dl → mono notation rows (`01 / runtime — webgl · three.js` … `03 / controls — orbit · zoom · scrub`); simulation heading collapsed to a mono meta row (`live · webgl playback` + `open standalone ↗`); footer removed. Standalone HUD: IBM Plex Mono loaded (preconnect + stylesheet, system mono fallback), ink palette (`#eeeae0` text, ochre `#e8b57c` accent, ochre timeline ramp, ink kbd chips), lowercase epoch, `paused` badge, single `planck-to-now` mark replacing the top-right caption, epoch panel gets the beneath-panel scrim (translucent ink fill + hairline + blur) for contrast over the flash, error copy → `webgl unavailable · simulation sealed` / `webgl context lost — reload to restart.`. Copy diet: H1 → `13.8 billion years. / One scrub.` (ochre second line), CTA → `Open the simulation ↓`; landing card blurb → `Scrub cosmic history — from the Planck epoch to now.` Epoch descriptions in `cosmology.ts` kept — instrument content, per user decision; card artwork and sim logic untouched.
- **Quality gate:** the page and the HUD read as one catalogue system with the frame chrome; muted-on-ink text ≥4.5:1 (the panel scrim covers the flash moment); focus ring visible on every link; iframe/standalone behavior, scrub, playback, and reduced-motion damping unchanged.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm --prefix portfolio run build`, `npm --prefix portfolio/projects/planck-to-now run verify`, and `git diff --check` pass; dev-server smoke returns 200 for `/`, `/projects/planck-to-now`, and `/planck-to-now/`; headless Chrome at 1440/1024/390 — no horizontal overflow on all three routes, `.planck-field` bg `#0b1317` with `color-scheme: dark`, mono facts rows, ochre focus ring on tab, landing card blurb live, HUD legible in flash and dark-space states.
- **Next review:** view `/projects/planck-to-now` mid-playback at the three widths to judge the panel scrim's weight on dark space; decide whether the remaining light interiors (practice-map, kitty-run) get the same conversion.

### Pass 17 — Ink interior / Kitty Run conversion (2026-08-24)

- **Liked:** the ink catalogue system as the named standard; the page now reads as one catalogue with the frame chrome; the pastel game survives as framed artwork inside a hard-edged ink-lined stage, and the menu states read as beneath-panel takeovers over the run.
- **Rejected:** the pastel page chrome (pink field, rounded shadowed stage card, pill buttons, uppercase overlay eyebrows) as a two-tone break inside one ink frame; flavor copy — the header lede, `Pastel endless runner` eyebrow, `Catch your breath`, `Keep running`, `One more run`.
- **Changed:** `/projects/kitty-run` converted to a full-bleed ink field via a `kitty-run-field` wrapper (game modules untouched): `--ink-*` tokens, `color-scheme: dark`, bright-ochre focus ring; stage loses radius/shadow for a 1px `--ink-line` frame; header reduced to H1 + mono `sound on/off` toggle (lede removed); overlay veil → ink, cards → beneath-panel-style with ochre mono kickers (`ready` / `paused` / `run over`), one functional line each (controls / resume keys / `{score} points · best {best}`), solid-ochre single-word action chips (`start` / `resume` / `again`); fallback → `webgl unavailable · run sealed`; attribution trimmed to a lowercase mono line. In-game HUD (hearts, score, combo, pause, floaters, debug) stays pastel over the canvas — the play surface is untouched, per user decision.
- **Quality gate:** page chrome and menu states read as one catalogue system with the frame chrome; muted-on-ink text ≥4.5:1 (hints and attribution use `--ink-muted`); focus ring visible on the mute toggle and cards; game logic, spawn/tuning/score modules, and HUD behavior unchanged.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm --prefix portfolio run build`, `node --experimental-strip-types tests/kitty-run.check.ts`, and `git diff --check` pass; dev-server smoke returns 200 for `/projects/kitty-run`; headless Chrome at 1440/1024/390 — `.kitty-run-field` bg `#0b1317` with `color-scheme: dark`, zero-radius stage with the `--ink-line` border, mono mute/kicker/hint, no horizontal overflow, no console errors; Enter → run → Esc → paused card verified (`paused · p or esc resumes · r restarts · resume`).
- **Next review:** play a full run with WebGL enabled to judge HUD legibility against the ink chrome at the frame edge; decide whether practice-map gets the same conversion (the last light interior).

### Pass 19 — Mobile hero / depth layers (2026-08-24)

- **Liked:** from a 20-variant mobile draft round (`/mobile-hero-directions`, live miniatures at 375–430px) the user picked draft 11 "Depth layers" — three soft glow fields at different parallax depths replacing the square beneath-panel box on phones; the catalogue rows staying as plain notation; calm, GPU-only motion.
- **Rejected:** the hard-bordered 320px beneath box on mobile (read as a square out of place); the 19 unchosen treatments (orb, blob, ring, diamond, aperture, dot matrix, scanline, arc, split stack, chips, dock, line reveal, counter, marquee, magnetic CTA, ripple, tilt, aurora, grain) — recorded as graph-adjacent alternates, not directions; reversing Pass 12's static-hero rule beyond mobile was not requested.
- **Changed:** at ≤560px only — the beneath panel loses border/fill/blur/label/warp rule and renders as plain full-width rows; a `.signal-index-hero-depth` field adds far/mid/near glow layers (teal/ochre/bright-ochre, blur 26px) whose translate is driven by a scroll-progress custom property `--hero-p` (rAF-throttled scroll listener in `LandingPage`, gated by `prefers-reduced-motion` and the 560px query); one-time staggered entrance (kicker → H1 → CTA → rows, layers fade) with explicit `to` keyframes. Desktop and tablet (≥561px) keep the Pass 12 static hero and the boxed panel unchanged.
- **Quality gate:** the mobile hero reads as one ink catalogue with the landing; motion is transform/opacity only and dies under `prefers-reduced-motion` (layers static, no parallax listener, entrances skipped); rows keep ≥44px targets, AA contrast, and focus rings; no horizontal overflow; first project still arrives quickly; desktop pixel-behavior unchanged.
- **Verification:** `npm --prefix portfolio run typecheck` and `npm --prefix portfolio run build` and `git diff --check` pass; headless Chrome on `/` at 390/768/1440 — zero console errors, zero horizontal overflow; at 390px the panel border/fill compute to 0/transparent, label and rule display none, far layer transform moves 0 → −19.2px after a 700px scroll (parallax live); with emulated `prefers-reduced-motion` `--hero-p` stays unset and layers sit at identity; at 768/1440 the panel keeps its 1px border, fill, and label (unchanged).
- **Next review:** `/` at 390/430 with a real device hand — judge glow intensity against sunlight and whether the entrance stagger feels slow; decide whether the 561–900px single-column range should adopt the same treatment.

### Pass 20 — Ink interior / Practice Map conversion (2026-08-25)

- **Liked:** the ink catalogue system as the named standard; `/projects/practice-map` — the last light interior — now reads as one catalogue with the frame chrome; the practice grid speaks the beneath-panel language (translucent cells over hairline rules, lowercase mono notation, ochre marks).
- **Rejected:** the light paper-era interior (`--practice-*` tokens, rust `#a8652d` accents) as the final two-tone break inside one ink frame; marketing copy — the `Practice Map · technical practice` eyebrow, the intro paragraph, the `Working map` kicker, the area description duplicated between heading and nav, the `Nothing on this stretch of the map` empty-state line.
- **Changed:** page converted to a full-bleed ink field via a `practice-map-field` wrapper (this closes the interior sweep — no light interiors remain): `--ink-*` tokens, `color-scheme: dark`, bright-ochre focus ring, zero radii; summary metrics, filter chips, statuses, concept chips, footer, and every chrome label set in lowercase IBM Plex Mono; search input transparent with ochre caret; topic cards hover to a brighter ink wash; route SVG recolored to ink/ochre with an AA sage `#96b896` completion marker; lesson overlay becomes an ink panel (`#0e161b` over a near-black veil) with mono tabs and ochre kbd chips. Copy diet: H1 → `Read less. / Practice more.`; export → `copy review notes ↗` / `copied`; route → `route` + `n%` + `d/t applied`; metrics → `cards / in progress / applied / revisit`; area count → `n applied · n revisit`; search placeholder → `search…`; empty state → `nothing here` + `clear filters`; card chrome → `practice path` / `feedback` with `try` / `check` / `status` / `note`; footer → `local notes · no account` + `reset progress`; lesson chrome → english mono (`lesson nn · n/5`, tabs `problem / model / mechanics / pitfalls / when not`, `objectives`, `examples`, `sources: …`, `← → tabs · esc closes`). Russian lesson bodies, prompts, and examples kept — instrument content, per the planck precedent.
- **Quality gate:** the interior reads as one catalogue system with the frame chrome; muted-on-ink text keeps ≥4.5:1 (status colors and the completion marker tuned for AA); focus ring visible on every control; search, filters, keyboard nav, copy buttons, route progress, and localStorage state untouched.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm --prefix portfolio run build`, and `git diff --check` pass; dev-server smoke 200 for `/` and `/projects/practice-map`; headless Chrome at 1440/1024/390 — `.practice-map-field` bg `#0b1317` with `color-scheme: dark`, zero horizontal overflow, zero console errors, mono lowercase notation live, bright-ochre focus ring on chips, lesson overlay opens (`lesson 01 · 1/5`) and Escape closes; full-page screenshots at all three widths.
- **Next review:** set a few statuses and judge the summary strip and route colors with real data at 1440 and 390; decide whether the sage applied-marker earns its place against the ochre-only system.

### Pass 21 — Deep lessons / reader + mobile overlay repair (2026-08-25)

- **Liked:** the ink lesson panel as a reading surface; the owner's lesson-writing brief (self-contained Russian prose, 5–7k words, PhD-depth but lowkey, English terms preserved and explained, minimal inline code, no bullet skeleton) as the content standard for upgraded topics; the tabbed fragment view remaining as the honest fallback for topics not yet migrated.
- **Rejected:** the stale worktree copies of five practice-map files plus this handoff doc (a day-old snapshot had silently reverted the UX pass `51fef98` and the Pass 20 conversion — restored from HEAD first, per the documented clobber pattern); the grid+`place-items: center` overlay, whose `max-height: 100%` resolved against an auto-sized track and let tall lessons spill out of a non-scrollable fixed overlay on phones — the reported "examples out of visible area" bug; flex-item `min-width: auto`, which let the widest code line inflate the panel past `100%` so every text line clipped off-screen (found only by reading the screenshot — vertical bounds assertions alone passed).
- **Changed:** overlay centers via flex with `min-width: 0` down the flex/grid chain, a `100dvh` mobile guard, `overscroll-behavior: contain`, copy buttons always visible on `(hover: none)`, `overflow-wrap` for long reference strings, and an edge fade marking horizontally scrollable code blocks. New optional `deepLesson` data model (`LessonSection { heading, paragraphs, examples }`) with a reader UI: near-fullscreen sheet on phones, ~comfortable reading column on desktop, heading-derived section chips (keyboard ←/→/digits), a scrollspy with a flight-suppression window (its last event otherwise fires before the smooth scroll settles), a transform-only ochre scroll-progress hairline frozen under `prefers-reduced-motion`, and examples rendered inline inside their sections; fragment lessons keep the Pass 20 tabbed view unchanged. Authored the first two flagship deep lessons in route order — «Терминал и командная строка» (≈5,000 words, 10 sections) and «Иерархия файловой системы» (≈5,000 words, 11 sections) — to the owner's brief. New browser check `tests/practice-map.check.mjs` (20 assertions, desktop + 390×844 touch profile).
- **Quality gate:** the reader reads as one ink catalogue with the frame chrome; the panel fits the viewport on both axes at every width with a deep lesson open; examples/references reachable by scroll; fragment fallback intact; `progress.ts` and localStorage schema untouched; reduced motion kills the entrance and smooth scrolling.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm --prefix portfolio run build`, and `git diff --check` pass; `node projects/practice-map/tests/practice-map.check.mjs` — 20/20 assertions green (panel bounds both axes at 1440 and 390, chip scroll + activation, ArrowRight, Escape, fragment fallback, touch-visible copy, progress fill, no horizontal overflow, console clean); deep lessons measure ≈5,041 and ≈5,021+ words by tokenizer.
- **Next review:** read a full deep lesson on a real phone — judge reading type size/measure and hairline weight; migrate the next route pair (shell fundamentals, file operations) in Pass 22; split deep lessons into per-topic modules once five exist.

### Pass 23 — Quiet specimen card artwork (2026-08-27)

- **Liked:** the ink catalogue field behind the cards; each project's semantic artwork identity (kitty, fox, blast, spiral, trail, drafting sheet); the pointer-inspection scatter as the only card motion.
- **Rejected:** light-era artwork tiles breaking the one-dark-field rule (code-layout `#b9c8d0` blue paper, practice-map `#cdbd9f` warm paper, kitty pastel gradient); page-level ornament (hairline `::before`, squashed-ring `::after`); hard offset part shadows (`8px 9px 0`); glow shadows and the infinite `luna-shell-pulse` hover animation; multi-color center-mark palettes with heavy drop-shadows.
- **Changed:** all six artwork fields re-based on the deep-ink value with one identity hue each — slate ink (code-layout), sepia ink (practice-map), pink-dusk ink (kitty-run), dark violet→amber wash (evening-forest), softened ember radial (explosion), navy (planck, unchanged); `--panel-line`/`--art-pin` tokens de-decorate parts (hairline borders, translucent ink-panel fills, line-only node dots, accent contours at 45% opacity); captions set in muted lowercase IBM Plex Mono (`--ink-muted`, ≥4.5:1 on the darkest fields); center marks redrawn quiet — kitty flattened to cream/ink/rose (no underlay copies, blushes dropped), fox to one amber + ink pines/muzzle, blast to two rings + three shards + flat core, filetree sheet to translucent panel with slate bars, trail to parchment dashes + ochre waypoint, spiral strokes softened. Explosion-specific note/center overrides and dead planck chip recolor deleted.
- **Quality gate:** the landing reads as one dark catalogue family at rest while each card stays identifiable by hue family and center mark; no light tiles, offsets, glows, or page ornaments remain; captions AA on every field; focus ring visible on cards; reveal-on-scroll, scatter hover, and reduced-motion behavior unchanged; a project opens without artwork interaction.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm run build` pass (this workspace has no git repo, so `git diff --check` is N/A); headless Chrome on `/` at 1440/1024/390 — six distinct presentation identities, ornaments/pulse absent from served CSS, notes mono+lowercase, legacy light fields gone, focus ring `rgb(232, 181, 124)` visible, zero horizontal overflow, zero console errors; full-page screenshots reviewed at all three widths.
- **Next review:** judge kitty/fox terrain-slab prominence and explosion core warmth against sunlight on a real display; decide whether card artwork hue families should drift closer to ochre over time; `/projects/*` interiors untouched and out of scope.

### Pass 22 — Hero field / vector isolines (2026-08-27)

- **Liked:** the hero backdrop finally sharp on every platform by construction — SVG contour hairlines rasterize at native resolution, `vector-effect: non-scaling-stroke` pins every line to exactly 1 physical pixel at any DPR; the fixed seed keeps the composition stable across visits so review evidence stays comparable; the depth-band parallax idea from Pass 19 survives in spirit (far/mid/near groups) but as pure transforms with zero blur; reduced motion gets a fully drawn static frame.
- **Rejected:** the WebGL FBM fog field plus its `blur(26px)` depth blobs (the "iPhone smoke / Windows mud" report, verified on Windows before replacement: canvas backing 922×320 for a 1280×444 CSS hero at DPR 1 — `RENDER_SCALE 0.72` × `DPR_CAP 1.75` renders 28% under native res and bilinear-upscales; value-noise fog has no high-frequency structure to survive the upscale, so low-alpha dark clouds read as dirt; the three CSS blur blobs stacked soft on soft). Offered alternatives the user declined: a baked video loop (binary asset in the repo, no live response, palette frozen per encode) and a native-resolution shader rewrite (still fog — more pixels cannot make noise crisp; iGPU cost is exactly why 0.72 existed; platform variance remains). Note: commit `46e90d7` (the aurora hero) was never auto-recorded in this graph — hooks not armed on this clone; `git config core.hooksPath .githooks` still needs re-running.
- **Changed:** `HeroField.tsx` (WebGL2 domain-warped fbm, DPR math, context-loss handling) deleted and replaced by `HeroIsolines.tsx`: 14 seeded contour paths (Catmull-Rom through harmonic samples, three shared depth bands, one teal + one ochre accent line, sparse pulse nodes), inline SVG `viewBox 1200×620` with `xMidYMid slice`, one-time stroke draw-in via `pathLength=1` dash animation staggered per line, slow band drift (64/46/34s), pointer parallax through the existing `--hero-mx/--hero-my` custom properties (far 7/5px, mid 15/10px, near 27/17px). `LandingPage` drops the lazy/Suspense/`fieldReady` machinery and the scroll-driven `--hero-p` listener (it served only the removed blur layers); pointer-only effect remains, gated by `prefers-reduced-motion` and `pointer: fine` as before. styles.css: `.signal-index-hero-field`/`.signal-index-hero-depth` blocks and `signal-index-hero-fade` keyframes removed; `.signal-index-hero-lines` styles added with all motion (draw-in, drift, pulse) nested under `@media (prefers-reduced-motion: no-preference)`, so the reduce branch needs no overrides. Static two-glow ink gradient (`::before`) stays as the base — the hero keeps its calm dark-plate identity.
- **Quality gate:** the field reads as instrument, not screensaver — hairlines stay subordinate to copy (0.11 alpha base, accents ≤0.36); motion is transform/opacity/stroke-dash only and dies under reduced motion (drift/pulse/draw all inside the no-preference media query; parallax vars unset under reduce, so transforms compute to identity); the catalogue rows keep AA contrast over the field (verified in screenshots at 390/1440); no WebGL dependency, so no context-loss/failure fallback surface at all.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm --prefix portfolio run build`, and `git diff --check` pass; headless Edge (ANGLE D3D11, Intel UHD) on `/` at DPR 1/1440×900, DPR 2/1440×900, DPR 3/390×844: svg present with 14 paths, `vector-effect: non-scaling-stroke` computed, canvas and depth layers gone, zero console errors, zero horizontal overflow; drift confirmed live (band transform changes over 900ms); emulated `prefers-reduced-motion` renders the fully drawn static frame (`stroke-dashoffset: 0`, no drift); before/after screenshots in `hero-shots` (mud) and `iso-shots` (isolines) under the session temp dir.
- **Next review:** view `/` on a real Windows machine and an iPhone — judge line opacity against sunlight and whether the draw-in stagger feels slow; if the crossing curves feel too wiry, the next pass can bias harmonics per depth band to read as a parallel contour family.

### Pass 23 — Hero field / live topographic marching-squares canvas (2026-08-27)

- **Liked:** the hero finally answers the pointer — the backdrop is now a real procedural heightfield (seeded value-noise fBm) contoured every frame with marching squares, so the hairlines are true isolines rather than decorative harmonics (Pass 22's "wiry crossings" open thread resolved by giving the lines a reason to exist); the cursor is a field probe whose Gaussian bump visibly domes the terrain and bends contours around it; click/tap drops a charge that rings outward through the lines and decays; local maxima carry survey diamonds with live elevation labels (the probe's own dome gets surveyed — an emergent, delightful detail); a mono HUD reads out probed coordinates and field height; the "signal index / beneath the surface" instrument identity now has a working instrument behind it. Crispness survived the migration: canvas rasterizes at native DPR (cap 3) and hairlines stay 1 physical pixel — the whole point of Pass 22, kept without WebGL.
- **Rejected:** keeping the passive SVG harmonics (no response to input, crossings read as random); returning to WebGL for the hero in any form (fluid sim/fog — platform variance and the "iPhone smoke / Windows mud" history); keeping `--hero-mx/--hero-my` band parallax (superseded by direct field interaction; the pointer now changes the map, not its offset).
- **Changed:** `HeroIsolines.tsx` rewritten from an SVG path generator into a Canvas2D field engine: 3-octave seeded value-noise fBm sampled on a 16px grid, slow domain drift (5px/s) plus a 26s "tide" that breathes all levels, 14 iso-levels placed from the terrain range (bump excluded, so hovering never squeezes the global level distribution), marching-squares extraction with linear edge interpolation and saddle disambiguation, index contours every 4th line at 0.20 alpha + one teal accent level at 0.34 (Pass 22 palette preserved), staggered per-level intro fade (70ms/level), up to 5 non-adjacent peak markers with elevation text. Pointer probe: σ120px Gaussian, amp 1.15, exponential position smoothing (k = 1−e^(−10dt)); charges: 240px/s expanding ring, 2.1s TTL, max 3. Touch: probe releases on pointerup/cancel for non-mouse pointers (no frozen bump); taps on catalogue rows still navigate (bump charge is passive, no preventDefault). LandingPage drops the pointer-parallax effect (only consumer of `--hero-mx/--hero-my`). styles.css: `.signal-index-hero-lines`/`.lines-band*` blocks, `lines-drift/draw/pulse` keyframes and the reduce-motion band override deleted; `.signal-index-hero-canvas` + `.signal-index-hero-hud` added (HUD hidden under reduce; fades in via `.is-live`). rAF loop pauses on `visibilitychange` and IntersectionObserver (hero offscreen ⇒ zero canvas cost — verified: clicking a "beneath" row on mobile scrolls the hero out and the canvas freezes by design); adaptive guard drops to 2 octaves if frame-time EMA exceeds 26ms.
- **Quality gate:** hairlines subordinate to copy (base 0.11, index 0.20, accent 0.34 — same ceiling as Pass 22); all motion is rAF-drawn and dies completely under `prefers-reduced-motion` (single static render at intro-complete, HUD hidden, no listeners attached); no WebGL ⇒ no context-loss surface; no new dependencies; reduced-motion and touch paths verified; contrast of catalogue rows unchanged (they sit above the canvas exactly as above the SVG).
- **Verification:** `npm --prefix portfolio run typecheck`, `npm run build`, `git diff --check` pass; headless Edge on `/` at DPR 1/1440×900, DPR 2/1440×900, DPR 3/390×844: canvas backing exactly css×dpr (1280×444, 2560×888, 1074×1371), measured 60fps while visible, idle drift changes frames with no input, click/tap ripple changes frames, HUD live (`probe 0.30 / 0.60 · h +1.36` desktop, `0.74 / 0.14 · h +0.84` mobile tap), zero console errors, zero horizontal overflow; emulated reduced-motion renders the fully drawn static frame with no HUD. Screenshots: `iso-shots/field-*` (full, probe close-up, cursor ripple, reduced) in the session temp dir.
- **Next review:** real Windows + iPhone — judge probe strength (σ120/amp1.15: should read as terrain bending, not a blob), whether peak elevation labels collide with copy at awkward widths, and whether the field stays calm enough behind the catalogue box on phones. If visitors ask "how does this work", consider a small caption toggle explaining marching squares — the explanation is part of the portfolio story.

### Pass 24 — Hero field edge fade / no more scissor cuts (2026-08-27)

- **Liked (carried from Pass 23, untouched):** the live topographic field, probe/charge interaction, peak markers, HUD, crispness, reduced-motion static render.
- **Rejected (owner feedback, Pass 24):** the field's hard left/right edges — the canvas spans the shell (`min(100% - 72px, 1280px)`), so every isoline stopped dead on two vertical lines inset from the viewport; it read as a clipped rectangle, not a survey area.
- **Changed:** `.signal-index-hero-canvas` gets a horizontal CSS mask (`mask-image` + `-webkit-mask-image`, `linear-gradient(90deg, transparent → #000 120px → #000 calc(100% - 120px) → transparent)`), 56px per side ≤700px. Contours now dissolve into the dark before the canvas boundary — a soft horizon instead of a scissor cut. Zero JS changes: mask is pure CSS, applies equally to the live loop and the reduced-motion static render, and costs nothing per frame (GPU compositing).
- **Considered, not taken:** (a) full-bleed canvas at 100vw like the `::before` band — removes the seam by moving the cut to the screen edge, but doubles the marching-squares grid on wide monitors, shifts probe/HUD coordinate math, and spreads motion behind the catalogue box; (b) flattening the heightfield near the edges (envelope in `buildField`) — elegant "calm water" shoreline but touches field math, damping the probe near edges for no visible gain over the mask.
- **Quality gate:** hairline alphas unchanged (0.11/0.20/0.34 ceiling); no new dependencies; no JS/TS changes (typecheck unaffected); peak labels and HUD near edges fade with the field — acceptable, they were edge-clutter anyway; no horizontal overflow introduced.
- **Verification:** `npm run typecheck`, `npm run build` green; headless Edge on `/`: DPR 1/1440×900 and DPR 3/390×844 — 60fps, idle drift present, HUD live, zero console errors, zero horizontal overflow; reduced-motion static render clean (`fade-dpr1r`). Screenshots: `iso-shots/fade-dpr1-*`, `fade-dpr3-*` in the session temp dir — contours fade out ~120px before the shell boundary on both sides at every width.
- **Next review:** unchanged from Pass 23 — real-device pass (probe strength, peak-label collisions, calm behind the catalogue box, iOS tap feel). If the fade reads too strong on phones, retune the 56px stop only.

### Pass 25 — Hero atmosphere / the mud returns, without WebGL (2026-08-27)

- **Liked:** the hero is weather again — a slow, murky teal body with warm amber crests marbling through it, visibly alive but saying nothing about itself; the pointer is a gentle heat source (the haze swells and warms under the cursor, then settles — keeps Pass 23's "the backdrop answers input" without a single readout); the instrument clutter is gone (no HUD readout, no peak diamonds with elevation text, no charge rings — owner verdict: "too many instruments"); the Pass 24 side fade carries over, so the atmosphere dissolves before the canvas edge; copy and catalogue box are untouched and read cleanly over the murk.
- **Rejected:** the topographic-instrument direction of Pass 23 as the hero's identity (superseded in graph: the hero is an atmosphere, not an instrument panel); returning to WebGL even now — the old WebGL hero the owner liked rendered correctly only on macOS ("iPhone smoke / Windows mud") and Canvas2D is bit-identical everywhere, so the *feel* is delivered without the variance; CSS-only drifting gradients (aurora rehash — blobs, not mud).
- **Changed:** `HeroIsolines.tsx` (untracked, never committed) deleted; new `HeroAtmosphere.tsx` — Canvas2D domain-warped fog: seeded value-noise fBm (3 octaves) sampled through two 2-octave warp fields (±95px marble), 26s tide retained, slow drift (4.5/2.0 px/s); rendered at 1 px per 4 css px into ImageData, upscaled by the browser (bilinear) plus `blur(12px)` CSS (9px ≤700px) — soft by construction; fog pixels map field height to teal `rgb(110,180,190)` → amber `rgb(211,155,97)` with alpha `smoothstep((v+0.35)/1.15) × 0.45`; update cadence 30fps (the mud is slow; rAF still smooths the pointer at 60); pointer swirl: σ150 Gaussian, amp 0.5, slower smoothing (k = 1−e^(−6dt)); offscreen/hidden-tab pause and the frame-budget octave downgrade carried over from Pass 23; reduced motion = single static render, no listeners. LandingPage imports `HeroAtmosphere`; styles.css: `.signal-index-hero-canvas` gains filter + opacity intro (`signal-index-hero-fade`, disabled under reduce), `.signal-index-hero-hud` blocks deleted. The hero-probe script's "backing = css×dpr" check now reports the low-res backing by design (320×111 @DPR1, 90×115 @DPR3).
- **Quality gate:** fog ceiling alpha 0.45 over #0b1317 — headline/kicker/link and catalogue rows keep contrast (verified in shots); no WebGL, no new dependencies, no platform-specific paths; reduced-motion static render verified; zero console errors; zero horizontal overflow; mask fade (Pass 24) applies to the fog identically.
- **Verification:** `npm run typecheck`, `npm run build` green; headless Edge on `/`: DPR 1/1440×900 and DPR 3/390×844 — 60fps, fog animating (frame-diff present), idle drift with no input, zero errors, zero overflow; emulated reduced-motion renders the static frame. Screenshots: `iso-shots/fog-dpr1-*` (sparse first tuning), `fog2-dpr1-*`, `fog2-dpr3-*`, `fog2-dpr1r` in session temp — `fog2-*` are the kept evidence.
- **Next review:** real Windows + iPhone (the point of this direction: confirm the fog feels like the old macOS WebGL mud, not like a blur) — judge fog density under the headline, pointer-swirl strength (σ150/amp 0.5), 30fps cadence visibility on the phone, and whether the warm crests stay behind the catalogue box. Tuning knobs are all named constants at the top of `HeroAtmosphere.tsx`.

### Pass 26 — Hero consolidation, full viewport, scroll exit fade + reveal pass (2026-08-28)

- **Liked (carried from Pass 25, untouched):** the whole atmosphere — fog identity, palette, pointer swirl, side masks, blur, every named constant in `HeroAtmosphere.tsx` (owner verdict "reads as blur" is recorded but tuning is deliberately deferred to a later constants-only pass, handoff open thread 1a); hero copy entrance timings; beneath-panel behaviour on mobile.
- **Rejected:** the three stacked CSS generations of the hero (original base → "Quiet index" overrides → "Hero band" layer) as a consistency hazard — duplicate/conflicting rules decided only by cascade order; the legacy `signal-index-hero-refraction` class name (named for the superseded Refraction-sea direction); the static `::before` glow band under the living fog (base colour duplicated `--ink-bg`, the two radial spots read as leftovers of the refraction direction); content-height hero (`min-height: auto`) when the ask is "the hero owns the first screen".
- **Changed:** hero CSS consolidated into one block (`.signal-index-hero` + scoped child rules) stating the previously-computed values directly; class renamed to `signal-index-hero-atmosphere`; `::before` band deleted; identity header moved inside the hero section in JSX and overlaid absolute at the top without its bottom border; hero `min-height: 100vh` + `100svh`; whole-hero scroll fade — a reduced-motion-gated rAF-throttled passive scroll listener writes `--hero-exit` (0→1 over 90% of hero height), CSS maps it to `opacity` on the section (canvas, copy, header, beneath panel fade together, restore fully at scroll-top); projects section gets its own IntersectionObserver (`threshold: 0` — a tall section can never reach ratio 0.12) that adds `is-revealed` once and draws the grid top hairline in (border-top replaced by an animated `::before` scaleX, pre-state gated under `.signal-index-reveal-ready`); card reveal retuned to the hero entrance family (680ms, `cubic-bezier(0.22,1,0.36,1)`) with inner topline→copy→artwork stagger (0/70/140ms on top of `--reveal-delay`), also gated so nothing hides without JS. No new dependencies.
- **Quality gate:** zero console errors, zero horizontal overflow at both probe viewports; reduced-motion = static hero, no exit listener, reveals snap instantly (global kill-switch); no-JS fallback = hairline and card content visible (all hidden states gated); entrance timings of kicker/h1/link/beneath rows unchanged; fog ceiling/contrast untouched.
- **Verification:** `npm.cmd run typecheck`, `npm.cmd run build` green; headless Edge on `/`: DPR 1/1440×900 and DPR 3/390×844 — hero exactly viewport-height, header absolute/no border, exit var 0→0.5→1 with opacity 1→0.5→0 and full restore at scroll-top, hairline scaleX 0→1, section `is-revealed`, cards reveal in batches (3/6 visible at section top — the rest on approach), atmosphere loop intact (60fps, idle drift, static under reduce). Screenshots: `iso-shots/scrolldpr1-*`, `atmo-exit-*` in session temp.
- **Next review:** real Windows + iPhone — (a) does the full-height fog still read as mud at 100svh (bigger field, same constants), (b) does the hero exit fade feel intentional at typical scroll speeds, (c) header legibility over the fog at the very top, (d) hairline draw-in and card stagger feel on the phone. Then the deferred tuning pass: raise `WARP_AMP`/lower `RES_DIV` per open thread 1a if the fog still reads as blur.

### Pass 27 — Glyph field hero / the fog becomes typography (2026-08-28)

- **Liked (delegated brief):** the owner's ask — "I don't see any point in this project; make me want to keep it, showcasing some advanced technology feature" — with https://helloclaude.ru/ named as the effects approach; its analysis showed the appeal is self-made ambient effects with zero animation libraries (film grain, cursor-tracked card bloom, restrained uniform motion), so the pass adapts that approach to the ink catalogue; the fog's field math (drift, tide, pointer heat) carried over.
- **Rejected:** the fog canvas itself — the owner's recorded "reads as blur" verdict plus the new "no point" verdict (Pass 25's deferred tuning thread is closed by replacement, not tuning); WebGL (standing rejection); any blur on the new canvas (crispness is the point now).
- **Changed:** `HeroAtmosphere.tsx` deleted, replaced by `HeroGlyphField.tsx` — a Canvas2D software rasterizer sampling the same seeded domain-warped fBm heightfield (drift 4.5/2.0 px/s, 26s tide, σ150/amp0.5 pointer heat) but rendering IBM Plex Mono glyphs: 13px cells desktop / 11px ≤700px, density ramp `·:;+=*#%@`, 6 baked teal→amber colour tiers, quiet-zone floor (rise < 0.2 skipped), alpha ceiling 0.55, copy column dimmed to ≥0.35 alpha over the left 52% for H1/kicker/CTA/caption contrast; DPR-aware glyph atlas so the hot path is one `drawImage` + one `globalAlpha` per visible cell (no per-frame `fillText`), atlas rebuilt on `document.fonts.ready`; 30fps cadence, frame-budget octave downgrade, offscreen/hidden-tab pause, and reduced-motion static render carried over from the fog engine. New mono caption under the CTA: `live field · procedural heightfield → glyph raster · canvas2d · no webgl` — joins the entrance choreography at 0.30s, added to the reduce kill list, separators glued with `&nbsp;` so no wrapped line starts with `·`. CSS: `.signal-index-hero-canvas` block, its media queries, and `signal-index-hero-fade` deleted; `.signal-index-hero-glyphs` added (same 120/56px side masks, one-time fade-in, no blur). Static film grain on `.signal-index::after` (SVG `feTurbulence` tile, opacity 0.06, `soft-light` — plain alpha vanishes on `#0b1317`). Cursor-tracked card bloom: one delegated rAF-throttled passive `pointermove` on `.signal-index-grid` (gated on `pointer: fine` and no-reduce) writes `--mx/--my`; `.signal-index-card::after` is a 300px ochre radial (`rgba(232,181,124,0.08)`) fading in on hover/`focus-visible`, `z-index: -1` inside the card's own stacking context (base transform) so the `::before` hairline and content are untouched; keyboard focus falls back to the centered glow. `LandingPage` swaps import/component and gains the glow effect; no new dependencies.
- **Quality gate:** glyphs crisp at DPR 1–3; hero copy keeps ≥4.5:1 over the dimmed column; reduced motion = one static drawn frame, zero listeners; no horizontal overflow; zero console errors; entrance choreography, `--hero-exit` fade, reveal system, beneath panel, and card behavior unchanged.
- **Verification:** `npm --prefix portfolio run typecheck`, `npm run build`, and `git diff --check` pass; headless Edge probes — desktop 1440×900 DPR1 and mobile 390×844 DPR3: glyph canvas live (frame-diff over 1s at both widths), backing 1280×900 / 1074×2532, caption live, grain computed (`fixed`/0.06/`soft-light`/SVG tile), exit fade 1→0.47→restore, card glow tracks (`--mx:896px`, `::after` opacity 1 on hover), all 6 cards reveal on real scrolling, reduced-motion run static (identical canvas snapshots, pixel sum 363k — drawn), zero console errors and zero horizontal overflow at every step; screenshots reviewed at both widths (`glyph-shots` in session temp). Integration deviations from the chat model's output: a dead `COLOR_TIERS === 1` guard removed (TS2367 under strict), caption `&nbsp;` polish, new CSS distributed to the file's section layout, and the note added to the existing reduce kill list instead of a duplicate block.
- **Next review:** real Windows + iPhone — judge glyph density (`QUIET_THRESHOLD` 0.2, `CELL` 13/11) and whether the copy-column dim (`COPY_DIM` 0.35) is enough behind the H1 at 1440; confirm atlas sharpness at DPR 3 and that the 30fps cadence doesn't read steppy on glyphs; decide whether the grain earns its 0.06 opacity in sunlight; judge card bloom strength (0.08) against the artwork hover scatter.

### Pass 28 — Mobile hero / the full catalogue in the first screen (2026-08-28)

- **Liked (carried from Pass 27, untouched):** the glyph field (cells, ramp, copy-column dim, side masks), exit fade, entrance choreography family, and the Pass 19 mobile decision that the beneath panel dissolves into plain borderless catalogue rows at ≤560px.
- **Rejected:** the mobile truncation itself — at ≤560px the hero list showed only the first 4 of 6 projects plus an `all 06 ↓` compensating link (owner verdict: "no items should be truncated or hidden"); the latent TSX filter that silently skipped untagged projects from the index; the desktop grid's row-stretch behaviour leaking into the stacked mobile layout, which stranded the copy and the list ~185px apart at 390×844; the copy block tucking under the absolute 64px identity header on short phones (kicker collided with the email line at 320×568).
- **Changed:** `LandingPage.tsx` — beneath rows render unconditionally for every project (untagged ones would show just `NN`, none exist today), `BENEATH_VISIBLE`/`signal-index-beneath-row-extra` class logic and the `signal-index-beneath-more` anchor deleted (its "see all" purpose is moot once all rows are visible; the header count `06` keeps the total). `styles.css` — `.signal-index-beneath-row-extra{display:none}` and every `.signal-index-beneath-more` rule deleted; ≤900px hero gains `align-content: center` so the stacked copy+index pack together and centre as one group instead of stretching apart; ≤560px hero `padding-top` raised from `1.45rem` to `calc(64px + 1.25rem)` so centred content always clears the overlaid header; mobile rows get `align-items: center; min-height: 44px` (touch targets, mirroring the approved `mh-row` draft geometry from the `/mobile-hero-directions` board). Desktop (>560px) untouched: same two-column hero, boxed panel, all six rows already visible.
- **Quality gate:** 6/6 rows rendered and visible at every probe viewport (390×844 dpr3, 320×568 dpr2, 1440×900 dpr1, 390×844 reduced); rows ≥44px tall on mobile; copy clears the 64px header at 320×568 (copy top 84px vs header bottom 64px); copy→list gap 28px at 390×844 (was 185px); zero console errors; zero horizontal overflow; desktop geometry byte-identical (copy 323–593, panel 300–616); reduced-motion identical to normal; typecheck and build green.
- **Verification:** `npm.cmd run typecheck`, `npm.cmd run build` green; headless Chrome on `/` at the four probe viewports: rowCount 6 / visibleRows 6 / rowsVisibleOnScreen 6 everywhere, row order = catalogue order (01 game Cat Runner … 06 map Practice Map), no page errors, `scrollWidth === innerWidth`; before/after geometry compared via `getBoundingClientRect` probes; screenshots `hero-mobile-390/320/desktop-1440/mobile-390-reduced` in session temp.
- **Next review:** real iPhone — (a) whether six 44px rows + copy make the first screen feel too tall on short devices (SE-class) where the hero grows ~22px past 100svh, (b) whether losing the `all 06 ↓` affordance hurts discovery of the projects grid (the `Run the models ↓` CTA still anchors to `#projects`), (c) glyph density behind the taller list block, (d) tap feel of the animated scroll-to-card from the fuller list.

## Deterministic handoff protocol

1. Read the active direction, persistent decisions, graph, and latest ledger entry before editing.
2. Derive the next pass from the latest **Liked** and **Rejected** fields; do not restart from the code's current appearance alone.
3. Make one coherent visual change and preserve unrelated behavior.
4. Review the fixed routes, viewports, states, and content lengths named by the entry.
5. Append the result before beginning another pass. If a trait is removed, collapse it into a graph node with its reason instead of deleting it.
6. Stop when the quality gate passes. A new aesthetic idea is a new decision and must enter the graph before implementation.

The canonical workflow for this protocol is `/design-iteration`; `/design-planning` and `/planning` remain the lower-level choice and execution-plan skills.
