# Portfolio redesign — design handoff
Durable design source of truth: records why a direction exists, what the user liked/rejected, and what must not be rediscovered by accident. Code shows what is implemented; this records why.
## Current active handoff — Ink catalogue (2026-08-23, refined 2026-08-24)

Status: selected after the user named the hero's right-side beneath-panel (beneath the surface / 01 / tool — Code Layout / 02 / map — Practice Map) as the standard and asked for that style everywhere with minimal copy. Refined by Pass 12 into a fully static hero with real identity branding.
### Outcome

Whole portfolio reads as one continuous dark field organized by catalogue notation: deep-ink base becomes the page surface; every section uses translucent bordered surfaces, lowercase mono microcopy, ochre NN / tag marks, thin light rules; copy shrinks to the identification layer.
### Visual system

Surface: full-page deep ink #0b1317; warm concrete retired. Panels = translucent light fill rgba(238,234,224,0.045) over thin light lines. Caustic sea retired (Pass 12); hero band carries its static two-glow ink gradient (former WebGL fallback).
Type: Source Sans 3 for headings/reading; IBM Plex Mono for all catalogue notation (wordmark, count, kicker, tags, links, chrome), lowercase except the proper-case personal name.
Notation: each project carries a mono tag (tool/map/sim/test) on ProjectModule.tag; numbers from list order; hero rows derived from the same data, not hardcoded.
Weight: ochre #d39b61 accent (tags, kicker, hover); bright ochre #e8b57c focus ring on ink. Project artwork identities untouched inside light-lined frames.
Identity: header Vasily Argounov | vasyapym@gmail.com (name links home, email mailto); <title> = Vasily Argounov; project chrome back link ← Vasily Argounov.
Copy: hero = kicker prototypes, H1 A collection of digital experiences, CTA Run the models ↓. Cards = tag row (number/tag + tech), title, one-line description, open ↗. No status text while all available.
### Experience

Hero fully static ≥561px — no shader/drift/load animation (Pass 12). On ≤560px (Pass 19): three parallax glow layers behind plain catalogue rows + one-time staggered entrance; reduced motion freezes all. Other motion = project-card reveal-on-scroll.
Beneath rows keep a static SVG displacement warp (no reduced-motion override needed). No canvas, so WebGL failure is no longer a hero concern.
Project-frame chrome = ink band: back link ← Vasily Argounov + mono lowercase {title}. Tool interiors keep functional styling, get shortened intros, lose decorative captions.
Reveal-on-scroll, direct links, keyboard focus, touch fallback, mobile gutters unchanged.
### Quality gate

Reads as one system — any section still resembling the old light index = fail. Mono notation only where orientation is needed. Muted-on-ink ≥4.5:1; focus rings visible at every viewport. A project stays identifiable/openable from its card without artwork interaction.
## Superseded handoff — Refraction sea (2026-08-23)

Status: superseded by Ink catalogue after the user picked the beneath-surface panel as the standard; kept as a graph node.
### Carried into Ink catalogue

Caustic sea focal element + pause/fallback behavior + "mechanics beneath the surface" framing; the dark ink band (now full-page), ochre accent, direct copy, fast path to collection; two-column hero with translucent beneath panel, warp filter, drift.
### Superseded

The warm-concrete collection below (user wanted the panel style everywhere); the hardcoded two-row panel and stacked layout (replaced by derived inline rows).
## Superseded handoff — Dark catalogue (2026-08-23)

Status: superseded by Refraction sea after the motion-led draft review; kept as a graph node.
### Outcome

Portfolio archival, tactile, quietly technical with an original catalogue plate carrying the dark hero. Lost because the plate was static — user wanted an advanced animated focal element, and motion drafts proved the dark mood survives without the plate.
### Carried into Refraction sea

Dark ink band limited to hero, ochre accent, archival "evidence of work" framing; original project-specific geometry (not copied reference imagery); direct copy, fast path, all list/interaction behavior.
## Superseded handoff — Quiet index (2026-08-22)

Status: was the selected direction after comparing ten routes; production homepage followed it (later superseded by the dark line).
### Outcome

Portfolio quiet, assured, useful — a small collection of real systems, the project list (not a large hero or review affordance) carrying identity.
### Visual system

Surface: one flat warm-concrete field; no texture/glow/glass/gradient.
Type: Source Sans 3 for interface/headings; IBM Plex Mono only for source/code + artwork marks. Weights 400/500/600. No expanded tracking, all-caps, italics, or decorative underlines unless an interaction cue needs it.
Structure: projects = flush horizontal slabs separated by rules (not floating cards); hard-edged framed artwork block per slab; smaller signal block anchors the hero.
Weight: dark ink, firm rules, solid blocks, one project-specific accent; avoid shadows/large radii.
Copy: direct, useful; no lore/journal/poetic labels/non-orienting metadata. Landing ends after the project list; don't restore removed collection/about/footer copy without instruction.
### Experience

First viewport: Small systems / Projects that make ideas usable. then the collection quickly.
Hero = one compact solid signal block (three connected points + central marker) — a quiet anchor, not a story or second panel.
Collection = single ordered list (desktop + mobile); each row: number, status, title, description, technologies, artwork, direct link.
Code Layout and Practice Map keep distinct artwork; project pages reuse type/surface/rule/control language while preserving behavior.
Motion limited to scroll reveal + small artwork inspection response; no decorative pulse.
### Architecture handoff

ProjectPresentation = project-owned semantic visual contract. ProjectArtwork = shared artwork renderer + pointer-inspection (geometry internal). LandingPage = canonical production route (old spatial prototype comparison-only). Go service, project discovery, local Practice Map state, Code Layout behavior unchanged.
### Quality gate

Materially grounded without becoming dashboard/terminal/journal/generic gallery; first viewport reaches the first row without a large empty stage; headings readable at 390px with deliberate breaks and not dominating; one sans family at 400/500/600, sentence-case labels; a project understandable from title+description alone; rules/blocks/accents make hierarchy not decoration; keyboard focus, direct links, mobile gutters, WCAG AA, touch, reduced motion intact.
## Compact decision graph

Terse by design. When a direction is removed, keep its node and add an edge explaining why; never erase the evidence that produced the next direction.
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

Assembly field — kept: project-specific objects, meaningful inspection, restrained motion. Rejected: spatial world as product, terminal atmosphere.
Quiet kinetic studio — kept: restraint + small kinetic cue. Rejected: paper/journal, serif display, poetic voice, decorative orbit.
Readable signal index — kept: direct hierarchy, readable body, systemacity, compactness, project artwork. Rejected: oversized headings, soft rounded cards, generic/lightweight surface.
Solid field index — kept: flush slabs, firm rules, flat concrete, hard-edged artwork. Refined: Archivo/IBM Plex split, residual all-caps, oversized headings, promo copy.
Calm field index — kept: Source Sans 3, restrained scale, direct copy, flat field. Refined: generic hero mark with no memorable project relationship.
Quiet index — superseded: keeps solid field + slabs, reduces hero to a three-point signal, removes review affordance, list carries identity.
Dark catalogue — superseded: kept dark archival band, ochre, original project evidence; replaced because the plate was static vs. requested animated focal element.
Refraction sea — superseded: kept caustic sea, beneath panel, dark band; replaced because its dark-hero-over-light-collection split broke the consistency the user demanded when naming the panel the standard.
Ink catalogue — active: extends ink across page, derives rows from per-project tag, reduces copy to identification. Pass 12 made hero fully static: caustic sea retired for public presentation (its static two-glow gradient remains as hero band background; stays a candidate for a future animated focal element).
Mobile depth field — active, mobile-only refinement (Pass 19): ≤560px the beneath box dissolves into plain rows over three parallax glow layers + one-time staggered entrance; Pass 12 static-hero rule now ≥561px only. 19 unchosen drafts remain alternates on /mobile-hero-directions.
### Kept alternates (motion round runners-up)

Pixel assembly (draft 01) — liked: bitmap type over portrait, print precision. Candidate for a future type-led pass; not implemented.
Darkroom develop (draft 10) — liked: cursor-as-developer-light reveal, archival trace. Candidate if the sea ever feels too literal; not implemented.
### Persistent decisions

Survive every direction change unless the user explicitly reverses them:
The primary job is to understand the collection and open a project.
The interface is English and the copy is plain.
Character comes from design quality, not lore or visual density.
Each project owns its semantic visual identity and keeps distinct artwork.
Interaction is optional enhancement, never the shortest path to understanding.
Accessibility, mobile usability, reduced motion, and project behavior are non-negotiable.
## Append-only iteration ledger

Every review adds one compact entry. Liked → constraint; Rejected → guardrail; new direction → graph node only when materially different. Do not rewrite old entries.
### Pass 4 — Readable signal index / compactness (2026-08-21)

Liked: systemacity, direct hierarchy, readable body, neutral surface, restrained signal, compactness → constraints. Rejected: journal styling, oversized display, decorative atmosphere, poetic language. Result: compactness improved but surface still felt like soft generic cards, not a solid system.
### Pass 5 — Solid field index (2026-08-21)

Change: card catalogue → flush slabs, firm rules, moderate Archivo headings, flat concrete field, hard-edged artwork. Rejected/deferred: rounded shells, shadows, soft gradients, oversized headings, decorative signal labels, new spatial world. Gate: grounded/specific at rest, projects carry weight not the container.
### Pass 6 — Calm field index / quiet type (2026-08-21)

Change: Source Sans 3 as single interface/display family, mono only where code/notation needs, sentence-case labels, lower heading scales, removed redundant Code Layout center label. Removed landing collection/about/footer block (About the collection, Making is how I learn., its paragraph, Built while learning in public, More projects incoming). Rejected: all-caps, expanded tracking, mixed type roles, decorative underlines. Gates green (removed copy absent, no overflow).
### Pass 7 — Selected projects / project signals (2026-08-22)

Change: Selected projects becomes hero H1; removed the eyebrow + A small set of working systems.; intro → Small systems for testing ideas and seeing what happens next. Replaced generic hero mark with a compact source-structure panel + route graph joined by a central signal, previewing the real Code Layout / Practice Map subjects. Rejected: generic geometry unrelated to the work; learning in public in copy/metadata. Gates green (hero exposes 20 SVG elements, no overflow).
### Pass 8 — Quiet index / calmer hierarchy (2026-08-22)

Change: promote Quiet index to production — hero Small systems / Projects that make ideas usable., source/route composition → smaller three-point signal, tighter slab rhythm, removed Compare directions from production header. Rejected: large explanatory hero figure, second review nav path in the finished header, oversized project type, louder-than-work container. Gates green.
### Pass 9 — Dark catalogue / original project plate (2026-08-23)

Liked: contrast, archival mood, tactile weight, sharper POV. Rejected: copying/collaging the reference image; photo-led treatment not explaining projects. Change: compact signal → original dark catalogue plate (Code Layout + Practice Map specimen sheets, notation, central stitch marker, pointer inspection); hero copy → Ideas should leave a trace. + direct prototype description. Gates green (list unchanged; reduced-motion leaves plate stable).
### Pass 10 — Refraction sea / animated focal element (2026-08-23)

Liked: from motion drafts — caustic shader sea (02) 1st, bitmap pixel (01) 2nd, darkroom reveal (10) 3rd; dark field, fluid light, "mechanics beneath the surface." Rejected: plate stillness; phrase repeated between kicker/subheading; full-bleed scene delaying first project. Change: plate → WebGL caustic field (RefractionField) behind copy + translucent beneath panel (two project rows under SVG displacement warp + slow drift). Copy: Prototypes, not promises / See the mechanics before you commit. / Every project is a working model… CTA Run the models ↓; meta updated. Gate: sea reads as instrument not screensaver; copy dominant; shader pauses off-screen/hidden tab; reduced motion = single frame + frozen drift; WebGL failure → static gradient. Gates green.
### Pass 11 — Evening Forest / first-person showcase project (2026-08-23)

Liked: first fully self-contained 3D showcase on the dark-sea hero; terrain-motion card language extends to a walking sim; dusk palette echoes ochre. Rejected: iframe embedding (R3F mounts natively, code-split behind loadPage); photo-real rendering (contradicts 8-bit brief + archival mood). Change: added projects/evening-forest — R3F walking sim (procedural terrain/foliage/fireflies, pointer-lock WASD, custom postprocessing = dusk grade + Bayer dither + posterize over low-DPR pixelated canvas, synthesised WebAudio). New deps in shell (@react-three/fiber, drei, postprocessing; three → ^0.185.1). Gate: reads as evening instrument not tech demo; copy dominance holds; 60fps via instancing + low res; audio only from gesture; Esc returns control; WebGL/touch/reduced-motion degrade to honest notices. Gates green.
### Pass 11 — Ink catalogue / beneath-panel standard (2026-08-23)

Liked: the beneath panel named by the user as the design standard for the whole portfolio. Rejected: two-tone split; hardcoded hero rows; redundant copy (hero intro, card eyebrows, status text, duplicated tech lists, decorative captions). Change: full-page ink field with --ink-* tokens + ochre focus ring; wordmark/count/CTA/card links mono lowercase; cards → tag row (NN / tag + tech) / title / one-line description / open ↗; beneath panel derives inline rows from ProjectModule.tag (tool/map/sim/test) across four projects; project chrome → ink band with ← Selected Experiments + mono {title}; interiors trimmed; meta shortened. Gate: one catalogue system at rest; ≥4.5:1 muted-on-ink; focus everywhere; first project quick. Gates green (smoke 200 for /, /projects/code-layout); full visual review at 1440/1024/390 still to confirm.
### Pass 12 — Static ink hero / identity header (2026-08-24)

Liked: catalogue-at-rest is the right public face; static two-glow gradient reads calm/professional. Rejected: hero motion for a public portfolio (caustic animation, beneath-row drift); placeholder branding (Selected Experiments, Prototypes, not promises). Change: header → Vasily Argounov | vasyapym@gmail.com (name links home, email mailto); back link → ← Vasily Argounov; <title> → Vasily Argounov; meta → Prototypes — see the mechanics before you commit.; kicker → prototypes; RefractionField deleted, static two-glow gradient moved to hero band; beneath-row drift keyframes/overrides/row variants removed; static SVG warp stays. Gate: zero hero animation; identity readable at 390px; ≥4.5:1 for name/email/count; focus on wordmark/email; reveal unchanged. Gates green.
### Pass 13 — Hero statement / collection framing (2026-08-24)

Rejected: See the mechanics before you commit. as public hero statement — user reframed the site as a portfolio of experiences, not a lab pitch. Change: H1 → A collection of digital experiences; meta → Prototypes — a collection of digital experiences.; kicker prototypes stays. Gate: first viewport reads as personal portfolio; copy minimal; no other sections touched. Gates green (same session as Pass 12).
### Pass 14 — Ink interior / Code Layout conversion (2026-08-24)

Liked: tool interior now speaks the ink standard end to end. Rejected: light blue-era interior (--index-blue, light surfaces) as a two-tone break; marketing copy (eyebrow, intro, Structure. heading, artifact captions). Change: /projects/code-layout → full-bleed ink via code-layout-field wrapper (shared .project-frame stays light for unconverted interiors): --ink-panel/--ink-line, zero radii, color-scheme: dark; blue → ochre + bright-ochre focus ring; solid-ochre Analyze button, no hover lift; lowercase mono labels/notes/results/insights; artifact plates recolored over static two-glow gradient. Gate: one system with frame chrome; ≥4.5:1; focus on every control; form + Go service untouched. Gates green.
### Pass 15 — Ink interior / Explosion conversion (2026-08-24)

Liked: interior reads as one catalogue; payload rows echo the beneath panel. Rejected: light blue-era interior w/ rust-red accents; marketing copy (eyebrow, intro, A small room for large reactions., payload sentences, footer); uppercase stage notation. Change: /projects/explosion → full-bleed ink via explosion-field wrapper: --ink-*, dark scheme, bright-ochre focus; stage re-based on ink gradient keeping grid + two-glow; payload cards → mono tag rows (01 / core … 04 / spark cloud); stage heading → mono meta (live · click or press enter / reduced motion · blast disabled); overlay lowercase (specimen / lx-01, nnn impacts); footer removed. Copy per code; scene/palette in detonate.ts untouched. Gate: one system; ≥4.5:1; focus on stage/links; detonation + reduced-motion + WebGL fallback unchanged. Gates green.
### Pass 16 — Ink interior / Planck to Now conversion (2026-08-24)

Liked: project page + standalone /planck-to-now/ HUD now one catalogue; epoch panel echoes beneath panel and stays legible over the Big-Bang flash. Rejected: light blue-era interior (--index-*, rust #a8652d eyebrow, blue hover); marketing copy (eyebrow, intro, The Big Bang in motion., footer link row); HUD decoration (uppercase letterspaced title, italic desc, glow shadows, blue-white palette). Change: planck-field wrapper, --ink-*, dark scheme, bright-ochre focus, zero radii, iframe border → --ink-line; facts → mono rows (01 / runtime — webgl · three.js … 03 / controls — orbit · zoom · scrub); sim heading → mono meta (live · webgl playback + open standalone ↗); footer removed. Standalone HUD: IBM Plex Mono, ink palette (#eeeae0, ochre #e8b57c, ochre timeline ramp, ink kbd), lowercase epoch, paused badge, single planck-to-now mark, epoch panel gets beneath-panel scrim over the flash, errors → webgl unavailable · simulation sealed / webgl context lost — reload to restart. Copy per code; epoch descriptions in cosmology.ts kept (instrument content, per user); sim logic untouched. Gate: ≥4.5:1 (scrim covers flash); focus on every link; scrub/playback/reduced-motion damping unchanged. Gates green.
### Pass 17 — Ink interior / Kitty Run conversion (2026-08-24)

Liked: page reads as one catalogue; pastel game survives as framed artwork inside an ink-lined stage; menu states = beneath-panel takeovers. Rejected: pastel chrome (pink field, rounded shadowed card, pill buttons, uppercase eyebrows); flavor copy (header lede, Pastel endless runner, Catch your breath, Keep running, One more run). Change: kitty-run-field wrapper (game modules untouched): --ink-*, dark scheme, bright-ochre focus; stage loses radius/shadow for 1px --ink-line; header = H1 + mono sound on/off; overlay → ink, cards → beneath-panel with ochre mono kickers (ready/paused/run over), one functional line each, solid-ochre action chips (start/resume/again); fallback webgl unavailable · run sealed; attribution → lowercase mono. In-game HUD stays pastel over canvas (per user). Gate: one system; ≥4.5:1 (hints/attribution --ink-muted); focus on mute + cards; game logic/HUD unchanged. Gates green.
### Pass 19 — Mobile hero / depth layers (2026-08-24)

Liked: from a 20-variant mobile draft round (/mobile-hero-directions) the user picked draft 11 "Depth layers" — three parallax glow fields replacing the square beneath box on phones; rows stay plain notation; calm GPU-only motion. Rejected: hard-bordered 320px beneath box on mobile (reads as a stray square); the 19 unchosen treatments (19 treatments) → recorded as graph-adjacent alternates; reversing Pass 12's static rule beyond mobile (not requested). Change: ≤560px only — beneath panel → plain full-width rows (no border/fill/blur/label/warp); .signal-index-hero-depth far/mid/near glow layers (teal/ochre/bright-ochre, blur 26px) driven by scroll-progress --hero-p (rAF-throttled listener, gated by reduced-motion + 560px query); one-time staggered entrance. ≥561px keeps Pass 12 static hero + boxed panel. Gate: one ink catalogue; transform/opacity only, dies under reduced motion (static layers, no listener, entrances skipped); ≥44px targets, AA, focus; no overflow; desktop unchanged. Gates green (390px panel border/fill = 0/transparent, far layer 0→−19.2px after 700px scroll; reduced-motion --hero-p unset).
### Pass 20 — Ink interior / Practice Map conversion (2026-08-25)

Liked: /projects/practice-map — the last light interior — now one catalogue; practice grid speaks beneath-panel language. Rejected: light paper-era interior (--practice-*, rust #a8652d) as the final two-tone break; marketing copy (Practice Map · technical practice eyebrow, intro, Working map kicker, duplicated area description, Nothing on this stretch of the map empty state). Change: practice-map-field wrapper (closes the interior sweep — no light interiors remain): --ink-*, dark scheme, bright-ochre focus, zero radii; summary metrics, filter chips, statuses, concept chips, footer, all chrome → lowercase mono; transparent search w/ ochre caret; topic cards hover to brighter ink wash; route SVG ink/ochre w/ AA sage #96b896 completion marker; lesson overlay = ink panel (#0e161b over near-black veil) w/ mono tabs + ochre kbd.Copy per code. Russian lesson bodies/prompts/examples kept (instrument content, per planck precedent). Gate: one system; ≥4.5:1 (status + marker AA-tuned); focus on every control; search/filters/keyboard nav/copy/route/localStorage untouched. Gates green.
### Pass 21 — Deep lessons / reader + mobile overlay repair (2026-08-25)

Liked: ink lesson panel as a reading surface; owner's lesson brief (self-contained Russian prose, 5–7k words, PhD-depth but lowkey, English terms preserved+explained, minimal inline code, no bullet skeleton) as the content standard for upgraded topics; tabbed fragment view as honest fallback for un-migrated topics. Rejected: stale worktree copies of five practice-map files + this handoff doc (a day-old snapshot had silently reverted UX pass 51fef98 and the Pass 20 conversion — restored from HEAD first, per the documented clobber pattern); grid+place-items:center overlay whose max-height:100% let tall lessons spill out of a non-scrollable fixed overlay on phones ("examples out of visible area"); flex-item min-width:auto that let the widest code line inflate the panel past 100% so text clipped off-screen (found only by reading the screenshot — vertical bounds assertions alone passed). Change: overlay centers via flex w/ min-width:0 down the chain, 100dvh mobile guard, overscroll-behavior:contain, copy buttons always visible on (hover:none), overflow-wrap for long refs, edge fade on scrollable code. New optional deepLesson model (LessonSection { heading, paragraphs, examples }) w/ reader UI: near-fullscreen sheet on phones, comfortable column on desktop, heading-derived section chips (←/→/digits), scrollspy w/ flight-suppression window, transform-only ochre progress hairline frozen under reduced motion, inline examples; fragment lessons keep Pass 20 tabbed view. Authored first two flagship deep lessons in route order — «Терминал и командная строка» (≈5,000 words, 10 sections) and «Иерархия файловой системы» (≈5,000 words, 11 sections). New tests/practice-map.check.mjs (20 assertions, desktop + 390×844 touch). Gate: reader = one catalogue; panel fits both axes at every width w/ a deep lesson open; examples/refs reachable by scroll; fragment fallback intact; progress.ts/localStorage untouched; reduced motion kills entrance + smooth scroll. Gates green (20/20 assertions; deep lessons ≈5,041 and ≈5,021+ words). Next: read a full deep lesson on a real phone (type size/measure, hairline weight); migrate next route pair (shell fundamentals, file operations) in Pass 22; split deep lessons into per-topic modules once five exist.

### Pass 23 — Quiet specimen card artwork (2026-08-27)

Changed/verdict: all six artwork fields re-based on deep-ink with one identity hue each (slate=code-layout, sepia=practice-map, pink-dusk=kitty-run, violet→amber=evening-forest, softened ember radial=explosion, navy=planck); --panel-line/--art-pin de-decorate parts (hairline borders, translucent fills, line-only node dots, 45%-opacity contours); captions muted lowercase IBM Plex Mono (≥4.5:1 on darkest fields); center marks redrawn quiet (kitty→cream/ink/rose, fox→one amber+ink, blast→2 rings/3 shards/flat core, filetree→translucent slate bars, trail→parchment dashes+ochre waypoint, spiral softened). Rejected: light-era tiles (blue/warm paper, kitty pastel), page ornaments (::before/::after), hard offset shadows, glows, luna-shell-pulse hover, multi-color center marks. Pointer-inspection scatter kept as the only card motion.
Gate/lesson: landing reads as one dark catalogue family at rest, each card still identifiable by hue+mark; no light tiles/offsets/glows/ornaments; captions AA every field; focus ring rgb(232,181,124) visible; reveal/scatter/reduced-motion unchanged; project opens without artwork interaction. Gates green.
Next review: judge kitty/fox slab prominence + explosion core warmth on a real display; decide whether hue families should drift toward ochre; /projects/* interiors out of scope.
### Pass 22 — Hero field / vector isolines (2026-08-27)

Changed/verdict: deleted WebGL HeroField.tsx (domain-warped fbm) for HeroIsolines.tsx — 14 seeded Catmull-Rom contour paths, three depth bands, teal+ochre accents, sparse pulse nodes, inline SVG viewBox 1200×620 xMidYMid slice, pathLength=1 draw-in, band drift (64/46/34s), pointer parallax via --hero-mx/--hero-my (far 7/5, mid 15/10, near 27/17px). vector-effect: non-scaling-stroke pins every line to 1 physical px at any DPR — sharp by construction; fixed seed keeps composition stable. LandingPage drops lazy/Suspense/fieldReady/--hero-p scroll listener; all motion nested under @media (prefers-reduced-motion: no-preference) so reduce needs no overrides; static two-glow ::before base kept.
Rejected: the WebGL FBM fog + blur(26px) blobs ("iPhone smoke / Windows mud": 0.72 render-scale × 1.75 DPR-cap → 28% under native, value-noise has no high-freq to survive upscale, so dark clouds read as dirt). Declined alternatives: baked video loop (binary asset, no live response), native-res shader (still fog — more pixels can't make noise crisp; iGPU cost is why 0.72 existed).
Lesson/open thread: field reads as instrument not screensaver (base 0.11, accents ≤0.36); no WebGL ⇒ no context-loss surface. Note: commit 46e90d7 (aurora hero) never auto-recorded — hooks unarmed on this clone; git config core.hooksPath .githooks still needs re-running. Gates green.
Next review: judge line opacity vs sunlight and draw-in stagger speed on real Windows/iPhone; if crossings feel wiry, bias harmonics per band into a parallel contour family.
### Pass 23 — Hero field / live topographic marching-squares canvas (2026-08-27)

Changed/verdict: HeroIsolines.tsx rewritten from SVG generator into a Canvas2D field engine — 3-octave seeded value-noise fBm on a 16px grid, 5px/s domain drift + 26s tide, 14 iso-levels from terrain range (bump excluded), marching-squares with edge interp + saddle disambiguation, index contours every 4th at 0.20α + one teal accent 0.34, 70ms/level intro fade, ≤5 peak markers with elevation text. Pointer probe (σ120 Gaussian, amp 1.15, k=1−e^(−10dt)) domes the terrain; click/tap charge = 240px/s ring, 2.1s TTL, max 3; touch probe releases on pointerup (no frozen bump), row taps still navigate. LandingPage drops pointer-parallax; rAF pauses on visibilitychange+IntersectionObserver (offscreen ⇒ zero cost); adaptive 2-octave guard >26ms EMA. Resolves Pass 22's "wiry crossings" — lines now have a reason to exist; crispness kept (canvas at native DPR cap 3, 1-px hairlines) without WebGL.
Rejected: passive SVG harmonics (no response); WebGL in any form (mud history); --hero-mx/--hero-my band parallax (pointer now changes the map, not its offset).
Gate: same alpha ceiling as Pass 22; all motion rAF-drawn, dies under reduce (single static frame, HUD hidden, no listeners); no WebGL/context-loss surface; no new deps; row contrast unchanged. Gates green (HUD live: probe 0.30/0.60 · h +1.36 desktop, 0.74/0.14 · h +0.84 mobile).
Next review: real Windows/iPhone — judge probe strength (terrain-bend not blob), peak-label collisions, field calm behind catalogue box on phones; consider a caption toggle explaining marching squares as part of the portfolio story.
### Pass 24 — Hero field edge fade / no more scissor cuts (2026-08-27)

Changed/verdict: .signal-index-hero-canvas gets a horizontal CSS mask-image/-webkit-mask-image (linear-gradient(90deg, transparent→#000 120px→#000 calc(100%−120px)→transparent), 56px/side ≤700px) so contours dissolve into the dark before the boundary — soft horizon, not scissor cut. Zero JS: applies equally to live loop and reduced-motion static render, free per frame (GPU compositing). Carries Pass 23 field/probe/charge/peaks/HUD/crispness untouched.
Rejected: hard left/right canvas edges (read as clipped rectangle). Considered, not taken: (a) full-bleed 100vw canvas — doubles grid on wide monitors, shifts probe/HUD math, spreads motion behind catalogue; (b) edge-flattening the heightfield in buildField — elegant shoreline but touches field math for no visible gain over the mask.
Gate: alphas unchanged (0.11/0.20/0.34); no deps; no JS/TS change; edge peak-labels/HUD fade with field (were clutter anyway); no overflow. Gates green.
Next review: unchanged from Pass 23 (real-device probe/labels/calm/tap feel); if fade too strong on phones, retune the 56px stop only.
### Pass 25 — Hero atmosphere / the mud returns, without WebGL (2026-08-27)

Changed/verdict: deleted HeroIsolines.tsx for HeroAtmosphere.tsx — Canvas2D domain-warped fog: seeded 3-octave fBm through two 2-octave warp fields (±95px marble), 26s tide, drift 4.5/2.0 px/s, rendered at 1px per 4 css px then browser bilinear upscale + blur(12px) (9px ≤700px) — soft by construction; height maps teal rgb(110,180,190)→amber rgb(211,155,97), alpha smoothstep((v+0.35)/1.15)×0.45; 30fps update (rAF still 60 for pointer); swirl σ150/amp0.5, k=1−e^(−6dt); offscreen pause + octave downgrade carried from Pass 23; reduce = static, no listeners. Instrument clutter removed (owner: "too many instruments" — no HUD/diamonds/rings); Pass 24 side fade carries over. Probe script's "backing=css×dpr" check now reports low-res backing by design (320×111 @DPR1).
Rejected: Pass 23's topographic-instrument identity (hero is atmosphere, not instrument panel); WebGL (old macOS-only hero — Canvas2D is bit-identical everywhere, delivering the feel without variance); CSS-only drifting gradients (aurora rehash — blobs not mud).
Gate: fog ceiling 0.45 over #0b1317 — copy + rows keep contrast; no WebGL/deps/platform paths; reduce static verified; no errors/overflow; mask fade applies to fog. Gates green (fog2-* kept evidence).
Next review: real Windows/iPhone — confirm fog feels like old macOS WebGL mud not a blur; judge density under headline, swirl strength, 30fps visibility, warm crests behind catalogue box. Tuning knobs = named constants atop HeroAtmosphere.tsx.
### Pass 26 — Hero consolidation, full viewport, scroll exit fade + reveal pass (2026-08-28)

Changed/verdict: hero CSS consolidated into one .signal-index-hero block with stated values; class renamed signal-index-hero-atmosphere; ::before glow band deleted; identity header moved inside hero JSX, overlaid absolute top with no bottom border; hero min-height: 100vh+100svh. Whole-hero scroll fade: reduce-gated rAF-throttled passive listener writes --hero-exit (0→1 over 90% hero height) → section opacity (canvas/copy/header/panel fade together, full restore at top). Projects section gets its own IntersectionObserver (threshold:0 — tall section never reaches 0.12) adding is-revealed once, drawing grid top hairline via animated ::before scaleX; card reveal retuned to hero entrance family (680ms cubic-bezier(0.22,1,0.36,1), topline→copy→artwork stagger 0/70/140ms), all gated under .signal-index-reveal-ready so nothing hides without JS. No new deps.
Rejected: three stacked CSS hero generations (cascade-order conflict hazard); legacy signal-index-hero-refraction name; static ::before glow under living fog (refraction leftover); content-height hero (min-height:auto) when the ask is "hero owns the first screen". Carried untouched from Pass 25: full atmosphere/palette/swirl/masks/blur/all named constants (owner "reads as blur" recorded, tuning deferred to constants-only pass — open thread 1a), copy entrance timings, mobile beneath-panel.
Gate: no errors/overflow at both probes; reduce = static hero, no exit listener, reveals snap (global kill-switch); no-JS = hairline+cards visible; entrance timings + fog ceiling unchanged. Gates green.
Next review: real Windows/iPhone — (a) full-height fog still mud at 100svh, (b) exit fade intentional at typical scroll speeds, (c) header legibility over fog at top, (d) hairline/card stagger on phone. Then deferred tuning: raise WARP_AMP/lower RES_DIV per open thread 1a if fog still reads as blur.
### Pass 27 — Glyph field hero / the fog becomes typography (2026-08-28)

Changed/verdict: deleted HeroAtmosphere.tsx for HeroGlyphField.tsx — Canvas2D software rasterizer on the same seeded domain-warped fBm (drift 4.5/2.0, 26s tide, σ150/amp0.5) rendering IBM Plex Mono glyphs: 13px cells / 11px ≤700px, ramp ·:;+=*#%@, 6 baked teal→amber tiers, quiet floor (rise<0.2 skipped), alpha ceiling 0.55, copy column dimmed ≥0.35α over left 52%; DPR-aware glyph atlas (hot path = one drawImage+globalAlpha per cell, rebuilt on document.fonts.ready); 30fps, octave downgrade, offscreen pause, reduce static carried from fog. New mono caption live field · procedural heightfield → glyph raster · canvas2d · no webgl joins entrance at 0.30s (on reduce kill list, separators &nbsp;-glued). CSS: canvas block + signal-index-hero-fade deleted, .signal-index-hero-glyphs added (same 120/56px masks, no blur). Static film grain on .signal-index::after (SVG feTurbulence, 0.06 soft-light). Cursor-tracked card bloom: delegated rAF passive pointermove on grid (gated pointer:fine+no-reduce) writes --mx/--my; .signal-index-card::after = 300px ochre radial rgba(232,181,124,0.08), z-index:-1 inside card's stacking context (base transform) so hairline/content untouched; keyboard focus → centered glow. LandingPage swaps import + gains glow. No new deps.
Rejected: the fog canvas (owner "reads as blur" + new "no point" — Pass 25's deferred tuning thread closed by replacement); WebGL (standing); any blur on new canvas (crispness is the point). Delegated brief driven by owner ask "make me want to keep it, showcasing advanced tech", https://helloclaude.ru/ named — its appeal is self-made ambient effects, zero animation libs.
Gate: glyphs crisp DPR 1–3; copy ≥4.5:1 over dimmed column; reduce = one static frame, zero listeners; no overflow/errors; entrance/exit/reveal/beneath/card behavior unchanged. Gates green. Integration deviations from chat-model output: dead COLOR_TIERS === 1 guard removed (TS2367 strict), caption &nbsp; polish, CSS distributed to section layout, note added to existing reduce kill list.
Next review: real Windows/iPhone — judge glyph density (QUIET_THRESHOLD 0.2, CELL 13/11), copy-column dim (COPY_DIM 0.35) behind H1 at 1440, atlas sharpness DPR3, 30fps steppiness on glyphs, grain earning its 0.06 in sunlight, bloom (0.08) vs artwork hover scatter.
### Pass 28 — Mobile hero / the full catalogue in the first screen (2026-08-28)

Changed/verdict: LandingPage.tsx — beneath rows render unconditionally for every project (untagged would show just NN, none exist); BENEATH_VISIBLE/signal-index-beneath-row-extra/signal-index-beneath-more anchor logic deleted (header count 06 keeps the total). styles.css — extra-row display:none and all beneath-more rules deleted; ≤900px hero gains align-content: center (stacked copy+index pack/center as one group, not stretch); ≤560px hero padding-top raised 1.45rem→calc(64px+1.25rem) so centred content clears the overlaid header; mobile rows align-items:center; min-height:44px (touch targets, per approved mh-row geometry from /mobile-hero-directions). Desktop >560px untouched.
Rejected: mobile truncation to 4/6 + all 06 ↓ link (owner: "no items truncated or hidden"); latent TSX filter silently skipping untagged projects; desktop row-stretch leaking into stacked mobile (stranded copy/list ~185px apart); copy tucking under absolute 64px header on short phones (320×568 collision). Carried from Pass 27: glyph field/masks/exit fade/entrance family + Pass 19 mobile borderless-rows-at-≤560px decision.
Gate: 6/6 rows rendered+visible at every probe (390/320/1440/reduced); rows ≥44px; copy clears header at 320×568 (top 84 vs 64); copy→list gap 28px (was 185); no errors/overflow; desktop geometry byte-identical (copy 323–593, panel 300–616); reduce identical. Gates green (rowCount/visible/onScreen = 6 everywhere, order 01→06, scrollWidth===innerWidth).
Next review: real iPhone — (a) six 44px rows + copy too tall on SE-class (hero grows ~22px past 100svh), (b) losing all 06 ↓ hurting grid discovery (Run the models ↓ still anchors #projects), (c) glyph density behind taller list, (d) tap feel of scroll-to-card from fuller list.
### Pass 29 — Landing polish / 8-bit fox, soft card hover, hugging mobile hero, louder entrance (2026-08-28)

Changed/verdict (owner's four-item ask): ProjectArtwork.tsx — FoxCenterMark rebuilt as a 15×12 grid of 8px <rect> cells on viewBox="0 0 120 96" shapeRendering="crispEdges" (seated amber fox, dusk-purple pines, ground line, two #ffb45e fireflies) to match Evening Forest's actual 4×4 Bayer + 6-level quantise render; signature/aria-hidden unchanged so CENTER_MARKS.fox + .center-fox svg hover scale keep working (letterboxed xMidYMid meet, container 1.21 vs viewBox 1.25). styles.css — cards: @property --card-wash (<number>) drives an edge-fading horizontal gradient (transparent 0%→0.055α 20–80%→transparent 100%), hover/focus sets --card-wash:1 (200ms custom-property transition, no deps); ≤560px hero min-height:auto+align-content:start (hugs content into projects hairline), gap:1.6rem, padding-bottom:2.4rem, top padding kept (copy top 84px @320×568); entrance louder: rise 16→30px (dedicated 40px H1 keyframe), durations 0.72→0.86s (H1 0.94s), re-spaced beats (kicker .05/H1 .12/note .30/CTA .42/rows .50–.80@0.06s), glyph intro → staged 1.25s opacity-only boot-up (no scale/blur), card reveals 28px outer/18px inner. No TSX logic / dep / --hero-exit / observer / bloom change.
Rejected: flat --ink-panel hover wash (full-width rectangle, hard block); mobile 100svh+align-content:center (symmetric voids around short content); 16px/0.72s entrance (too subtle on mobile first paint); non-uniform fox SVG stretch (smears pixels).
Gate: dark-ink identity intact (desktop >560px byte-identical, hero 900px @1440); motion transform/opacity/custom-property only, dies under reduce (cards fall under duration clamp); wash peak 0.055≈old 0.045, transparent at row edges (shared hairlines unaffected); focus keeps wash+hairline+bloom; copy top 84px @320/390; rows 44px; no overflow 1440/390/320. Gates green (27/27 probe assertions: --card-wash mid≈0.41 at 85ms confirms registered-property transition not snap; mobile hero 596px in 844 viewport; reduce all none, visible).
Next review: real device — (a) fox legibility/charm at 92px in sunlight, (b) hover wash strength now flat rect is gone, (c) entrance loudness vs taste (drop glyph boot-up dip stops if flicker reads as stutter), (d) whether shorter mobile hero should re-center on tall phones (min-height cap is the knob if tight top feels cramped).
### Pass 30 — Tiger-bright cards / Ember Spine (2026-08-31)

Changed/verdict (owner ask: "tiger bright" — bold/vivid while minimalist; prior rows leaned too heavily on minimalism, lacked impact): "Ember Spine" — every row grows a 3px vertical spine in its own project hue at ~45%α (CSS-only via #project-<id> setting --card-accent, fallback --ink-accent); content indented padding-left: clamp(1.1rem,2vw,1.75rem); index/tag numeral recolored to hue; h3 → clamp(1.9rem,2.6vw,2.5rem) w600 for contrast vs --ink-muted body; artwork inner hairline faintly hue-tinted at rest. Hover/focus (parity, ≤340ms): spine ignites full hue; top hairline sweeps in recolored; hue wash via --card-wash (soft edges, 8% peak); bloom recolored; h3 + open ↗ to hue; artwork border ignites + tight dark ambient lift (0 10px 26px -14px rgba(0,0,0,.6), no glow). "Quiet index" card overrides deleted (absorbed into single card-system section); .signal-index-link CTA + media queries + artwork code + TSX untouched.
Rejected: one shared brand accent for all six (per-card hue law is binding); more elements instead of stronger elements.
Gate: six rows read as distinct bright signals against calm dark air; hover is one system (never three accents mixed); muted text ≥4.5:1; reveal contract unchanged (hidden only under reveal-ready+no-preference; inset(-4px 0 0 0) keeps top hairline unclipped; scroll-margin 24px); reduce = static with spines/tags/tints present, transitions clamped 0.01ms; no overflow 1440/390/320; canvases still animate. Gates green (49/49 after fixing two probe-side bugs: mobile "unrevealed" was a probe teleport artifact — scroll-back confirmed 6/6, 0 hidden; reduce clamp unit fixed). Delegated brief agent2/chat-model-brief-5-cards-bold.md returned "INTEGRATOR FLAGS: none", applied verbatim.
Next review: real Windows/iPhone — judge spine alpha (45%) + wash peak (8%) in sunlight; whether six vivid spines read as one family or competition; whether h3 up to 2.5rem crowds description on tablet; artwork-frame shadow strength on mobile.
## Deterministic handoff protocol

Read the active direction, persistent decisions, graph, and latest ledger entry before editing.
Derive the next pass from the latest Liked and Rejected fields; do not restart from the code's current appearance alone.
Make one coherent visual change and preserve unrelated behavior.
Review the fixed routes, viewports, states, and content lengths named by the entry.
Append the result before beginning another pass. If a trait is removed, collapse it into a graph node with its reason instead of deleting it.
Stop when the quality gate passes. A new aesthetic idea is a new decision and must enter the graph before implementation.
The canonical workflow for this protocol is /design-iteration; /design-planning and /planning remain the lower-level choice and execution-plan skills.
