# BRIEF 12 — The Realm: an opt-in Dark Souls-inspired immersive layer over the approved landing

You are the design-and-code specialist for a shipped portfolio landing page.
You cannot see the repository — this brief contains every fact and every line
of code you need. You will decide the design direction yourself and write the
actual implementation; an integrator will drop your files into the repo
verbatim and run the verification gates. Deliver everything in ONE response —
this is planned as a single round.

---

## 1. What the project is — and the gap you are closing

The portfolio landing of Vasily Argounov is a shipped, owner-approved dark
"ink catalogue": near-black ink fields (`#0b1317`), warm paper type
(`#eeeae0`), ochre accents, lowercase IBM Plex Mono notation, hairline rules,
flat scrim panels, and a live Canvas2D stable-fluids hero rendered through an
ordered Bayer dither. It has been refined over ~148 recorded design rounds.
Do NOT redesign it, restructure it, or regress it.

**The gap:** the founding brief for this portfolio demanded a game-like
transformation that was never built. Verbatim requirements from that brief:

> 1. **Entry Trigger** — a small, sticky header button labeled **"Enter the
>    Realm"** that remains visible during scroll. On click, the entire main
>    page transitions from its default (conventional portfolio) state into
>    the Dark Souls-inspired mode. Include a smooth, thematic transition
>    animation (e.g., fade-to-black, embers, "You Died"-style typography
>    reveal).
> 2. **Immersive Mode** — a controllable **main character** the user can move
>    across the scene (keyboard/arrow or WASD, ideally with touch support).
>    Multiple **doors/portals** placed throughout the environment — each
>    representing a different project. When the character reaches/interacts
>    with a portal, it reveals that project (modal, page transition, or
>    in-world panel with details, links, and tech stack).
> 3. **Aesthetic & Feel** — Dark Souls-inspired art direction: dark palette,
>    atmospheric lighting, gothic/medieval UI, ambient effects (fog, embers,
>    particles). Optional: ambient sound/music and interaction SFX (with a
>    mute toggle).

Success criteria attached to it: clean well-architected documented code;
smooth 60fps animations; responsive/mobile-friendly; **accessibility fallback
(a non-game navigation path)**; reusable component structure and clear state
management for the two page modes.

## 2. The task

Build the realm as an **opt-in full-screen layer** over the untouched landing:

1. **Entry trigger.** A small fixed "enter the realm" affordance, visible at
   all scroll positions on the landing (design its placement/behaviour — e.g.
   a quiet fixed chip; it must never obstruct the existing header, catalogue
   rows, or cards).
2. **Transition in.** On click: a thematic sequence you design — fade to
   black, ember drift, a "You Died"-style typography reveal — executed in the
   ink/dither language (see laws). The landing beneath must end fully hidden
   while the realm is open, and be fully restored on exit.
3. **Immersive mode.** A full-viewport scene on a single canvas:
   a controllable character (WASD + arrow keys; touch support required —
   virtual stick or tap-to-move, your call), and portals for all 7 projects
   placed across the scene. Reaching a portal and interacting (proximity +
   key/button; you choose the exact affordance) opens that project's panel:
   eyebrow, description, technologies, links, and an action that opens the
   real project page in the SPA (`onOpenProject(id)`).
4. **Atmosphere.** Ambient effects (fog/embers/particles) in the dithered
   ink language; optional ambient audio + interaction SFX via WebAudio
   synthesis ONLY (the repo ships zero binary assets; browsers require a
   user gesture — the Enter click is yours), with a working mute toggle.
5. **Exit.** Esc and a visible control return to the landing with a
   coherent exit transition; the landing resumes exactly as it was.
6. **Two-mode state.** Realm open/closed is clean React state owned by the
   landing component; the default catalogue remains fully usable with the
   realm closed — it IS the accessibility fallback.

You have full design freedom: scene layout (a single-screen bonfire glade
with doors around it, a walkable corridor of gates, a fog-eaten field — your
call), character design, portal iconography, panel design, HUD, audio
palette. Deep, atmospheric and ALIVE beats sprawling: a dense single scene
that reads as one composed shot beats a scrolling world done thinly.

## 3. Integration surface (facts you must code against)

- Vite + React 19 + TypeScript **strict** SPA. Vite root `portfolio/shell/`.
- Routing is tiny: `App.tsx` renders `<LandingPage projects={projectModules}
  onOpenProject={openProject} />` at `/`, or `<ProjectFrame …/>` at
  `/projects/:id/`. `openProject(id)` does `history.pushState` +
  `setPathname` — calling it from the realm navigates to the real project
  page (the realm unmounts naturally). Do NOT add routes; the realm is pure
  state, not a URL.
- `LandingPage.tsx` receives `projects: readonly ProjectModule[]` and
  `onOpenProject(id: string)`. Contract, verbatim:

```ts
export type ProjectStatus = "available" | "in-progress";
export type ProjectLink = { readonly label: string; readonly href: string; readonly external?: boolean };
export interface ProjectModule {
  readonly id: string;
  readonly title: string;
  readonly tag?: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly technologies: readonly string[];
  readonly status: ProjectStatus;
  readonly accent: string;          // semantic name, e.g. "amber", "pink", "azure"
  readonly presentation: ProjectPresentation; // card-art data — you may ignore it
  readonly links?: readonly ProjectLink[];
  readonly loadPage: () => Promise<{ default: ComponentType }>;
}
```

- The 7 projects (display order in the catalogue):

| # | id | title | tag | accent | eyebrow |
|---|---|---|---|---|---|
| 01 | raft-cluster | Raft Cluster | distributed systems | azure | live consensus — Rust → WebAssembly |
| 02 | kitty-run | Cat Runner | game | pink | A pastel endless runner |
| 03 | explosion | Explosion | physics | red | interactive — three.js |
| 04 | spine | Spine | layout engine | steel | live layout — Go → WebAssembly |
| 05 | evening-forest | Evening Forest | walk | amber | A cozy first-person stroll at dusk |
| 06 | planck-to-now | Planck to Now | sim | amber | A log-time cosmology simulation |
| 07 | practice-map | Practice Map | map | blue | A working map for technical practice |

(`accent` values are semantic strings the CSS maps to hues; approved card-era
identity hues were: raft azure `#86aed4`-family steel-blue, kitty pink
`#dc7f95`, explosion ember `#ff8a3c`, evening-forest amber `#ffb45e`,
planck amber `#ffd9a0`, practice-map ochre-blue, spine dusty steel. You may
key doors off these or off `--ink-accent*`; keep one identity hue per door.)

- The hero header where your entry button's integration point lives
  (verbatim; the button itself you design — it must be FIXED, not inside
  this absolute header):

```tsx
          <header className="signal-index-header">
            <div className="signal-index-identity">
              <a className="signal-index-wordmark" href="/">
                <span className="signal-index-mark" aria-hidden="true" />
                Vasily Argounov
              </a>
              <span className="signal-index-identity-divider" aria-hidden="true">|</span>
              <a className="signal-index-contact" href="mailto:vasyapym@gmail.com">vasyapym@gmail.com</a>
            </div>
            <span className="signal-index-count">{projects.length.toString().padStart(2, "0")}</span>
          </header>
```

- The landing's `<main>` wraps everything (`className="signal-index"`,
  `ref={pageRef}`) — `LandingPage`'s return starts:

```tsx
  return (
    <main ref={pageRef} className="signal-index">
      <div className="signal-index-shell">
```

- CSS variables available (verbatim): `--ink-bg:#0b1317; --ink-text:#eeeae0;
  --ink-muted:rgba(238,234,224,0.68); --ink-faint:rgba(238,234,224,0.48);
  --ink-line:rgba(238,234,224,0.26); --ink-line-soft:rgba(238,234,224,0.13);
  --ink-panel:rgba(238,234,224,0.045); --ink-accent:#d39b61;
  --ink-accent-bright:#e8b57c; --ink-accent-deep:#b97f45;
  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,monospace;
  --display and --sans:"IBM Plex Sans"; --unbounded:"Unbounded"` (display
  weight exists at 400-900, but giant display type as THE object is a
  rejected direction). `--panel-radius` is a small radius.
- A fixed film-grain overlay `.signal-index::after` (z-index 4, opacity .06,
  soft-light) covers the whole landing — the realm layer sits above it
  (choose your own z-index; the realm should feel above the grain, or fold
  the grain back in — your call, decide it explicitly).

## 4. Design laws and taste calibration (hard constraints)

1. **Crisp by construction: no blur, no fog-glow, no soft gradients.** The
   hero's honest caption is "stable-fluids · ordered-dither · canvas2d · no
   webgl". Atmospheric fog/embers MUST be rendered as discrete dithered/half-
   tone marks (Bayer-ish quantisation, discrete rectangles), never as soft
   radial gradients or CSS blur. This is the single most important aesthetic
   law — atmospheric does not mean blurred.
2. **Flat scrims only** for any DOM panels: solid low-alpha `rgba()` plates
   with 1px hairline borders. All text ≥4.5:1 over its plate.
3. **Rejected in the past — do not reintroduce:** instrument-panel/HUD
   aesthetics (rings, isolines, readout gauges); soft blurred fog; giant
   viewport-filling type as the object; glow shadows; infinite pulse
   animations on page furniture; multi-colour confetti palettes.
4. **The owner loves:** organic, physical, alive systems; their projects'
   Bayer-dithered 8-bit look; one dark field; one identity hue per project
   over the deep-ink value; lowercase mono captions naming techniques
   (e.g. `realm-wander · ordered-dither · canvas2d · no webgl`).
5. **Dark Souls flavour, ink voice.** Gothic/medieval structure is welcome
   (doors, arches, bonfire embers, waystone markers, knight figure) but
   rendered as dithered ink marks, not photoreal or soft. A "You Died"-style
   type beat on entry is desired — letterform treatment is yours (serif-ish
   weight within the loaded font stack, or mono caps), keep it restrained.
6. **No new dependencies, no new files beyond the whitelist, no binary
   assets.** Everything is drawn on canvas or composed in DOM/CSS; audio is
   WebAudio synthesis.
7. **Performance:** one rAF loop for the realm; pause it when the tab is
   hidden and when the realm is closed; canvas backing store capped at
   devicePixelRatio ≤ 2; no per-frame DOM reads/writes; target 60fps on a
   mid laptop. `prefers-reduced-motion: reduce` — no particle storms, no
   ember drift; transitions become simple opacity crossfades; the scene
   itself may still respond to input (that's not decorative motion).
8. **Accessibility:** the untouched landing is the fallback and must remain
   fully functional. The realm is behind an explicit button. On enter: move
   focus into the realm; Esc returns focus to the button. Portals must be
   operable without pixel navigation — the recommended pattern (you may
   improve it): each door is ALSO a real DOM `<button>` positioned over its
   canvas location with an accessible name ("door — Raft Cluster"), so Tab
   reaches every door and Enter opens its panel. The panel is a labelled
   dialog region; Esc closes panel first, then exits the realm. All realm
   controls (exit, mute) are real buttons with names. Honour
   `prefers-reduced-motion` everywhere.
9. **Mobile:** the realm works at 390×844 and 320×700 (touch controls), and
   the fixed entry button must not collide with existing fixed UI.
10. **Code style:** match the repo's voice — same-line opening braces, CSS
    closing braces on the rule's last line (as `}}`), lowercase comments
    that explain WHY (the quoted code shows the register), 2-space indent,
    TypeScript strict (no `any`, no non-null assertions unless provably
    safe). Document each new file's architecture with a short header
    comment.

## 5. Files you may create or change

- CREATE `portfolio/shell/src/shell/RealmMode.tsx` — component + two-mode
  state surface (transition choreography may live here or in the scene).
- CREATE `portfolio/shell/src/shell/realm-scene.ts` — the canvas engine
  (world, character, portals, particles, rAF loop). Keep it framework-free
  (pure TS, no React imports) so the component stays thin.
- CREATE `portfolio/shell/src/shell/realm.css` — all realm styling
  (entry chip, HUD, doors, panel, transition).
- EDIT `portfolio/shell/src/shell/LandingPage.tsx` — ONLY: add import(s),
  realm-open state, the fixed entry chip in/near the header JSX, and the
  conditional `<RealmMode>` mount. Nothing else may change in this file.
- EDIT `portfolio/shell/src/styles.css` — only if a change is truly needed
  outside realm.css (e.g. a z-index treaty note). Prefer zero edits here.

## 6. Output format (follow exactly)

**PART 1 — DESIGN.** Your chosen direction in ≤30 sentences: scene concept,
character, portals, transition-in choreography, panel, HUD (exit + mute +
control hints), audio design, touch controls, and how the landing stays
restorable.

**PART 2 — FILES.** For each NEW file: `FILE:` path + COMPLETE content
(verbatim, drop-in; no placeholders, no TODOs, no ellipses).

**PART 3 — EDITS.** For each EDIT: `FILE:`, `REPLACE-FROM:` (exact first
line of the region, copied verbatim from section 3's quoted code),
`REPLACE-TO:` (exact last line), `WITH:` (complete replacement text).
Small number of anchored edits; imports for the landing go on its existing
import lines (shown in section 7).

**PART 4 — INVARIANTS.** Checklist confirming: landing untouched behind the
realm; Esc + exit control; focus management; portals keyboard-operable and
named; touch controls; mute toggle; reduced-motion; rAF pause on hidden; dpr
cap; no new deps/assets; 60fps hygiene (single rAF, no per-frame DOM I/O).

Size discipline: ≤ ~900 lines of code total across files. If you must choose,
spend lines on scene feel (character motion, door reveal, ember language)
over breadth of HUD chrome.

## 7. LandingPage.tsx facts you need for the edit

Existing import line (verbatim, line 1):

```tsx
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
```

Other imports: `import type { ProjectModule } from "../../../contracts/project-module";`
then `import HeroFluid from "./HeroFluid";` and
`import ProjectArtwork from "./ProjectArtwork";`. The component signature is
`export default function LandingPage({ projects, onOpenProject }: LandingPageProps)`
with `type LandingPageProps = { projects: readonly ProjectModule[]; onOpenProject: (id: string) => void }`.
State hooks already present: `pageRef`, `heroRef`, `revealReady`,
`revealedProjects`, plus the settle effect and scroll helpers. Mount the
realm conditionally near the end of `<main>` (before the closing
`</main>` — the anchor for that edit is the projects section's closing
region; give us a clean REPLACE-FROM/REPLACE-TO pair around it; the
exact tail of the file is:

```tsx
          </div>
        </section>
      </div>
    </main>
  );
}
```

where the first `</div>` closes the projects grid, `</section>` closes the
projects section, and `</div>` closes `signal-index-shell`).

## 8. How this will be verified (integrator-side)

`tsc --noEmit` strict + `vite build`; headless-Chrome pass: landing renders
unchanged with the realm closed; entry chip fixed during 2-viewpage scroll;
click → transition → scene canvas present and animating (pixel-delta probe
over 2s); 7 doors present in DOM with accessible names; keyboard: Tab reaches
doors, Enter opens panel, panel shows eyebrow/description/tech/links, Esc
steps back out; WASD/arrow keys move the character (position probe); exit
restores the landing DOM and scroll position; 390×844 + 320×700 (touch
controls rendered, no horizontal overflow); `prefers-reduced-motion` (no
particle storm, transitions are crossfades); console error-free; rAF stops
after exit; CPU sanity probe (single rAF, no runaway loops).
