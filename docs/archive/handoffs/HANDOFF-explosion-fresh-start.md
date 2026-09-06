# Task brief — "Explosion" fresh start: a new interactive piece + the dark page shell restored

You are a senior creative engineer writing a design spec and code for a repository you
cannot see. This brief is self-contained: everything you need is here. Work from it
alone — do **not** ask questions. Your responses will be pasted verbatim to an
integrating agent that wires, builds, and tests your code in the real repo, so all code
must be **complete and compilable as written** — no placeholders, no `TODO`, no
"…rest unchanged", no truncated files.

## 0. Delivery protocol — read this first

Full responses have timed out before, so the deliverable is produced across **exactly
four responses**, each kept under roughly 450 lines of output:

- **Response 1 — Part 1, direction lock-in** (§5.1): three candidate creative
  directions, then the **§1 LOCKED SPEC** for the chosen one. **No code.**
- **Response 2 — Part 2, page component + copy** (§5.2): `ExplosionLunaPage.tsx` and
  the copy fields of `project.ts`.
- **Response 3 — Part 3, page stylesheet** (§5.3): the complete `explosion-luna.css`.
- **Response 4 — Part 4, the simulation module** (§5.4): the complete `detonate.ts`.

After each part, end with the exact marker line given in §5 — the user replies
"continue" to trigger the next part.

Rules for all four responses:

- If a part would exceed the budget, stop cleanly at a file/block boundary and end
  with `TRUNCATED: <what is still owed>` instead of emitting a partial block. The
  integrating agent will reply "continue" and you emit **Part 5 — continuation** with
  exactly what is owed, ending with `ALL PARTS COMPLETE — hand back to the integrating
  agent.` Part 5 exists only for truncation recovery.
- If, when starting a later part, your earlier parts are no longer in your context, say
  so in one line instead of guessing — the integrating agent will re-paste them.
- Part 1's **LOCKED SPEC** is the single source of truth for Parts 2–4. Later parts
  add implementation only and never contradict it; if an unavoidable deviation appears,
  flag it in that part's one-line `drift:` note at the top.

## 1. Project context and why this pass exists

"Explosion" is one of six interactive pieces in a personal portfolio (React 19 + Vite 7
+ TypeScript **strict** + three.js 0.185; route `/projects/explosion`, dev server
`localhost:5173`). Until now it was a structural demolition lab: the visitor clicked a
voxel monument district, a Rust→WebAssembly core carved voxels out, a support/stress
solver condemned anything without a load path, condemned voxels waited on randomized
"doom timers" (0.04–0.4 s) before converting to rigid-body debris, and the web layer
synced two `THREE.InstancedMesh`es (structure + debris) against the core's linear
memory every frame.

**The owner's verdict, verbatim in spirit:**

1. *"It's not good. Previous bug persists."* — despite two verified fix rounds (per-part
   render sync via a `world_version` counter; solver fixpoint so condemned members stop
   bearing load), the owner still sees broken parts floating mid-air and destroyed parts
   still looking intact in their browser. The headless suites pass; the browser doesn't.
2. *"Don't try to fix it endlessly and let's do this instead — you have full creative
   freedom here — it does not need to match the previous style, theme, or approach."*
   You may invent a completely different piece. The only obligations are the name
   ("Explosion" — the piece must answer to explosive interaction), the stack, and §2.
3. *"I liked the before-last-changes black background with gradient — bring it back (not
   the simulation but the project page)."* — the page shell goes back to the dark ink
   look (§4). The current "Golden Hour Ruin" bright theme is being reverted.

**Design history you should know (do not re-derive):**

- The surrounding portfolio shell speaks the "Ink catalogue" language: deep-ink
  `#0b1317` surfaces, translucent light-lined panels, lowercase IBM Plex Mono
  microcopy, ochre `#d39b61` accent. Project pages live inside that dark ink frame
  (the frame chrome is not yours to change). The restored dark shell must sit calmly
  inside it.
- Verdicts that shaped earlier builds and still stand: mobile (390×844 portrait) must
  be fully usable — whole subject framed, no page overflow, ≥40px touch targets;
  `prefers-reduced-motion` disables autonomous animation but restore still works; the
  piece must survive SwiftShader software WebGL (no Chrome-class GPU assumed).
- Known three.js pitfall from this repo's history: `MeshStandardMaterial({
  vertexColors: true })` on an `InstancedMesh` whose geometry has **no** color
  attribute multiplies the per-instance colors down to near-black. Don't set
  `vertexColors` unless the geometry actually has the attribute.
- The Rust/WASM core and `physics-core.ts` loader **stay in the repo but become
  unused** — do not output Rust, do not reference them (§3). Removing them later is the
  integrating agent's job.

## 2. The one hard engineering law (this is why the bug existed)

The persistent bug was a **state-sync disease**: destruction was a *pipeline of
deferred per-part state transitions* (blast → solver reclassification → randomized doom
timers → async conversion → version-bumped mesh rebuild), with the rendered mesh and
the logical state as **two representations chasing each other**. Every fix patched one
race; the owner still saw desyncs. Your design must make this class *structurally
impossible*, not just unlikely:

- **Single source of truth.** One owned state object drives both the visual and the
  logical reading of every entity. No parallel representation that a second code path
  can update or that can go stale.
- **Atomic, same-frame transitions.** When an entity is destroyed it is removed from
  the state and its visual is replaced (or it *becomes* the debris/particle) in the
  same simulation step and the same render. No timers that later "convert" an entity,
  no async jobs, no deferred reclassification, no "condemned" limbo state that renders
  differently from its physics status.
- **Rendered view is a pure function of state.** The draw pass reads the state and
  writes every instance every frame (or dirty-set) — it never "remembers" a previous
  layout. If an entity is gone, nothing of it can possibly still draw.

In Part 1's LOCKED SPEC, include a short **"law audit"** paragraph: list the mutable
visual states and name the single writer for each, and state why a mid-air ghost is
unrepresentable in your design. This paragraph is a gate — the integrating agent will
check the delivered code against it.

## 3. Locked technical constraints

- **Stack**: React 19 + TypeScript strict (no implicit `any`, `isolatedModules`,
  ES2022) + three.js 0.185 + Vite 7. **No new npm dependencies.** No external assets
  (no fonts/images/audio files), no network calls. three's `examples/jsm` modules are
  importable if truly needed, but prefer plain materials/additive blending over
  post-processing chains — SwiftShader software GL at 390px must survive at usable fps.
- **Pure TypeScript piece.** The simulation must not load the wasm core
  (`physics-core.ts`) or any Rust export. Locked deliberately: the wasm+sync
  architecture is the bug habitat; the fresh start is TypeScript-only.
- **File plan (the model owns exactly these):**
  - `portfolio/projects/explosion/web/detonate.ts` — the simulation entry module.
    **Keep this filename** and the exported names `hasWebGL`,
    `mountSpecimen(element: HTMLElement): SpecimenHandle | null`, and the
    `SpecimenHandle`/stats types (shape below). Additional `web/*.ts` helper modules
    are allowed if `detonate.ts` imports them.
  - `portfolio/projects/explosion/web/ExplosionLunaPage.tsx` — the React page.
  - `portfolio/projects/explosion/web/explosion-luna.css` — the stylesheet.
  - `portfolio/projects/explosion/project.ts` — **copy fields only** (`eyebrow`,
    `description`, `technologies`); every other field stays as-is. Do not output the
    whole file; output the replacement values (Part 2).
- **Untouchable**: `web/audio.ts` (procedural WebAudio; reusable as-is — API:
  `new DetonationSfx()`, `.resume()`, `.boom(strength = 1)`, `.thud()`, `.rebuild()`,
  `.setMuted(muted: boolean)`), `web/physics-core.ts`, `physics/*`, shell chrome,
  `contracts/*`.
- **DOM/test contract** (the headless suite and the React page rely on it):
  - The stage element: `id="explosion-stage"`, `role="button"`, `tabIndex={0}`,
    `aria-label` present, `data-engagements={n}` rendered from stats.
    `engagements` counts the piece's **signature auto-engaged cinematic moment** (the
    old build counted collapse-cam triggers; yours defines its own equivalent — a
    visitor-visible dramatic auto-moment that increments the counter when it fires).
  - The page polls `handle.stats` on a 400ms interval and renders a compact HUD from
    it; your stats object must be a flat serializable object with **at least**
    `fps: number` and `engagements: number`, plus whatever your design needs.
  - `SpecimenHandle` must keep: `detonateAt(clientX: number, clientY: number) => boolean`
    (false when gated out — reduced motion, no scene, or an honest miss with no
    effect), `restore(): void` (one click returns the piece to its pristine state),
    `setMuted(muted: boolean): void`, `dispose(): void`, `readonly stats`. Other
    toggles (`setSlowMo`, `setXray`, …) are yours to define or drop.
  - The no-WebGL fallback stays: `hasWebGL()` false → the page renders a fallback mark
    + `explosion-stage-fallback` text, and the TSX gates all interaction.
- **Reduced motion**: `mountSpecimen` checks `prefers-reduced-motion` once. Reduced →
  the piece renders a static (or minimally animated) pristine first paint,
  `detonateAt` returns false, `restore()` still works. The page shows a room-meta line
  explaining it.
- **Mobile 390×844 portrait**: the whole subject visible in the stage; controls ≥40px
  tall; no horizontal page overflow; HUD text wraps instead of clipping. Known-good
  framing technique you may reuse: level camera, `distance = clamp(FIT_WIDTH /
  (2·tan(fov/2)) / aspect, min, max)` with a `targetY` proportional to distance.
- **Disposal hygiene** (strict TS, no leaks): every `addEventListener`,
  `requestAnimationFrame`, interval, `ResizeObserver`, geometry, material, texture,
  and the renderer is disposed/removed in `dispose()`; the canvas and any chip element
  are removed from the stage element.
- **Style conventions**: match the repo's voice — dense but readable TS, 2-space
  indent; CSS scoped under `.explosion-field` with local custom properties, never
  leaking to the shell; comments state constraints, not narration. Lowercase mono
  microcopy (`--mono`), display font for headings (`--display`) — both global CSS
  variables.

## 4. The page shell — the dark look to restore (locked)

The shell returns to the pre-"Golden Hour" dark ink build. These exact treatments are
locked (they are what the owner liked); everything else in the stylesheet is yours:

```css
/* Field: near-black ink page (global shell token). */
.explosion-field {
  color: var(--ink-text);
  background: var(--ink-bg); /* #0b1317 */
  color-scheme: dark;
}
```

```css
/* Stage: the dark gradient backdrop behind/around the canvas + the faint grid mask. */
.explosion-stage {
  border: 1px solid var(--ink-line);
  background:
    radial-gradient(circle at 50% 45%, rgba(228, 166, 105, 0.24), transparent 34%),
    linear-gradient(140deg, #1a2830, #131f26 66%, #221a11);
}
.explosion-stage::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(238, 234, 224, 0.075) 1px, transparent 1px),
    linear-gradient(90deg, rgba(238, 234, 224, 0.075) 1px, transparent 1px);
  background-size: 40px 40px;
  content: "";
  mask-image: linear-gradient(to bottom, transparent, black 24%, black 76%, transparent);
  pointer-events: none;
}
```

Available global ink tokens (defined by the shell, use freely): `--ink-bg` (#0b1317),
`--ink-text`, `--ink-muted`, `--ink-faint`, `--ink-line`, `--ink-line-soft`-style
translucents, `--ink-accent` (ochre #d39b61), `--ink-accent-bright`, plus `--display`
and `--mono` font stacks. If your scene renders its own opaque background it must be
authored to look right against this dark page (dark-mood scene, glowing subject); an
alpha canvas showing the gradient through is also acceptable — decide in Part 1.

## 5. The parts

### 5.1 Part 1 — Response 1: direction lock-in (no code)

1. **Three candidate directions.** For each: a name, a two-sentence pitch, the
   interaction loop, one line on why it cannot exhibit the §2 bug class, and rough
   effort. They must be genuinely different in theme and mechanics — the owner gave
   full creative freedom; surprise us. The only fixed meanings: the piece is called
   "Explosion", the primary gesture is a click/tap that triggers a dramatic explosive
   response, and there is a one-click restore.
2. **Then the LOCKED SPEC** for the direction you would ship (pick one and commit):
   - Concept + mood + palette (hex values; must sit well with §4's dark shell).
   - Scene inventory: what is rendered, approximate object/instance counts, camera and
     framing plan (including the 390px portrait story).
   - Interaction loop: click/tap, any modifiers (keyboard/touch), the signature
     auto-engaged cinematic moment (what triggers it, what `engagements` counts),
     restore behavior.
   - The **law audit** paragraph (§2).
   - HUD/stats: the full stats shape, and what the page HUD line renders.
   - Audio plan (reuse of `DetonationSfx` methods or silence).
   - File plan: which files, estimated line counts each, any extra `web/*.ts` modules.
   - Page copy draft: hero `h1` (with an accented second line), lede paragraph,
     room-meta line, control button labels (restore + whatever your piece needs),
     hint line, a 5-item techniques list in the repo's `label · detail` lowercase-mono
     style, and the `project.ts` values for `eyebrow`, `description`, `technologies`
     (the description should name the real mechanics; if your concept is not
     voxel-based, do not force the old "voxel monument" phrase — the integrating agent
     re-anchors that test).

End with the marker: `PART 1 OF 4 COMPLETE — reply "continue" for Part 2 (page component + copy).`

### 5.2 Part 2 — Response 2: `ExplosionLunaPage.tsx` + copy

Output the **complete** `ExplosionLunaPage.tsx` (overwrite) in one ```tsx block, then
the `project.ts` copy values (`eyebrow`, `description`, `technologies`) as a short
labeled list. The page:

- Keeps the existing wiring pattern: `stageRef` + `mountSpecimen(stage)` in one
  `useEffect` (cleanup: clear the 400ms poll interval, `handle.dispose()`), `hasWebGL()`
  gate → fallback UI, reduced-motion media query state, `detonateAt` on pointer-down
  (left button only) and on Enter/Space from the stage center, control buttons calling
  the handle, HUD rendered from the polled stats, `data-engagements` on the stage.
- Must typecheck under strict TS (no implicit any; typed event handlers; no unused
  imports). Import only from `./detonate` and `./explosion-luna.css`.
- The exact JSX class names are yours (the CSS comes in Part 3 and must match them);
  the locked ids/attributes from §3 are not negotiable.

End with the marker: `PART 2 OF 4 COMPLETE — reply "continue" for Part 3 (stylesheet).`

### 5.3 Part 3 — Response 3: `explosion-luna.css`

Output the **complete** `explosion-luna.css` in one ```css block. Requirements:

- Scoped to `.explosion-field`; dark shell per §4 (the two locked snippets appear
  verbatim or near-verbatim); hero, room, stage, controls, HUD overlay, techniques
  list, fallback, plus a `@media (max-width: 640px)` block (≥40px controls, wrapping
  HUD, no overflow) and a `prefers-reduced-motion` block (kill transitions/crosshair).
- The stage canvas is absolutely positioned, filling the stage, `z-index` under the
  HUD overlay; HUD overlays are `pointer-events: none`; the focus-visible treatment
  uses the ochre accent.

End with the marker: `PART 3 OF 4 COMPLETE — reply "continue" for Part 4 (simulation module).`

### 5.4 Part 4 — Response 4: `detonate.ts`

Output the **complete** simulation module in one ```ts block (plus any extra helper
modules, each in its own block, each complete). This is the heart — the LOCKED SPEC
implemented:

- Exports `hasWebGL`, `mountSpecimen`, `SpecimenHandle`, and the stats type. Module
  size budget: if the spec needs more than ~430 lines, split logic into extra
  `web/*.ts` modules rather than truncating mid-file (you may reserve Part 5 for a
  helper module if you flag it in Part 1's file plan).
- The rAF loop, input handling, the destruction/response pipeline obeying §2, the
  signature cinematic moment + `engagements`, restore, framing + resize, audio hooks,
  full disposal. First paint must show the pristine scene immediately (no blank stage
  while anything loads — there is no wasm to load anymore, so this is easy).
- Deterministic per session is nice but not required; no `Math.random` in code that
  runs per-frame for layout (only for transient FX jitter).

End with the marker: `PART 4 OF 4 COMPLETE — hand back to the integrating agent.`
(If truncated: `TRUNCATED: <owed>` and finish in Part 5.)

## 6. Self-check before finishing each part

- Part 2/3: JSX classes ↔ CSS selectors match 1:1; locked ids/attributes present;
  strict-TS-clean; no reference to golden-hour palette or the wasm core.
- Part 4: walk the §2 law audit against your own code — for every drawn thing, name
  the single state that produces it; confirm no timer/async per-entity conversion
  exists anywhere; confirm `dispose()` releases everything Part 4 created; confirm the
  reduced-motion and no-WebGL paths never enter the animation loop's interactive
  branches; confirm 390px framing math keeps the subject inside the stage.
- All parts: no new dependencies, no external assets, no `any`, no truncated blocks,
  markers exact.
