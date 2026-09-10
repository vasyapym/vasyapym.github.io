# Brief — Design a third Explosion mode (design round: NO code this round)

## Context

Personal portfolio site, React 19 + three.js + TypeScript (strict) + plain CSS. The "Explosion" page is one dark room hosting selectable simulation "experiments". You have NO repo access; this brief is everything you need. **This round you only design; a later round asks for the code.**

The two existing modes form a deliberate contrast:

- **"ember lantern"** — a paper-lantern moon of 600 tetrahedral shards. *Discrete* particles: shard state lives in ping-pong RGBA32F GPGPU textures; fragment shaders integrate gravity, drag, floor bounce, curl-noise; one instanced mesh renders via `texelFetch`. Click = detonate; restore = reassemble; an auto "flashpoint" bloom marks peak dispersion.
- **"ink shockwave"** — a pool of living ink. *Continuous Eulerian*: a hand-rolled Navier–Stokes stable-fluids solver in fragment shaders (semi-Lagrangian advection, 24 Jacobi pressure iterations, vorticity confinement) on RGBA16F ping-pong targets; pointer stirs, click pops a radial impulse + traveling annulus shock ring; auto-detonation ~0.9s after mount as the signature opening.

Shared laws (the project's identity — a third mode must honor all of them):

- **Single source of truth** — the GPU state (textures) is the only state; the CPU owns only scalars (phase, counters). No pixel readback, no CPU mirror of GPU data, so a stale-pixel desync is unrepresentable.
- **Same-frame causality** — detonation is never deferred to a timer; the visual and the logical reading change in the same frame.
- **Ember mood** — one dark room, palette only from: ash `#2b2622`, ember `#8a3a1e`, mid `#d39b61`, warm `#e4a669`, hot `#ffd9a0` (plus the dark blue-slate stage gradient). Lowercase copy everywhere.
- **Same interaction shape** — click (or tap) detonates at the pointer; Enter/Space detonates from center; a "restore" action returns to a pristine authored state; sound toggle (muted); slow-mo toggle (scales sim dt by ~0.35); HUD stats line updates from a polled stats object.

## The contract your mode must fit (verbatim)

```ts
export type ModeId = "lantern" | "ink";            // will gain your mode id
export type ModeStats = {
  fps: number;
  engagements: number;                              // detonations fired
} & Record<string, string | number | boolean>;

export type ModeHandle = {
  detonateAt(clientX: number, clientY: number): boolean;  // false = "nothing there" (a miss)
  restore(): void;
  setMuted(muted: boolean): void;
  setSlowMo(slow: boolean): void;
  dispose(): void;
  readonly stats: ModeStats;
};

export type Mounted = { handle: ModeHandle; formatHud: (stats: ModeStats) => string };

export type ModeDef = {
  id: ModeId;                                       // short lowercase ascii word
  title: string;                                    // lowercase
  tagline: string;                                  // one line, selector card
  accentLine: string;                               // small accent under the page title
  lede: string;                                     // one sentence under the title
  hint: string;                                     // e.g. "click to detonate · restore reassembles"
  stageLabel: string;                               // aria-label of the stage
  fallback: string;                                 // message when this mode can't run
  techniques: ReadonlyArray<{ label: string; detail: string }>;  // 5 items, shown under the room
  mount(element: HTMLElement): Promise<Mounted | null>;          // null = unsupported (no canvas)
};
```

The registry lazy-loads each mode's module on first selection (`mount: async (el) => { const mod = await import("./<name>"); ... }`), so your code ships as its own chunk. Reference facts from the ink module you may rely on: `new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" })` into the given element; `EXT_color_buffer_float` / `EXT_color_buffer_half_float` decide float targets; software tier detection = `/swiftshader|software|llvmpipe/i` on `UNMASKED_RENDERER_WEBGL`; clear color `0x000000, 0` over the CSS gradient; pixel ratio capped at 1.5; a `ResizeObserver` on the element; `prefers-reduced-motion` → paint the pristine composition once, no RAF, detonation/stirring gated, restore still renders once; stats.fps is an EMA of 1/dt; HUD line format `fps N · phase X · <counters...>` — lowercase, `·` separated, all fields parseable by regex (the headless suite parses it). Sound: an existing procedural `DetonationSfx` class is available with `boom(strength)`, `thud()` (a miss), `crackle(count)`, `rebuild()` (restore arpeggio), `setMuted`, `resume`, `dispose` — you may also propose small additions to it.

## Hard constraints

1. **A third distinct technique.** It must not be "more particles" (that's the lantern) nor "another Navier–Stokes fluid" (that's the ink). The page is read as a triptych of *states of matter* — pick a genuinely different simulation/rendering family and say so plainly.
2. **Senior-portfolio bar.** The technique list under the room (5 label+detail rows) should name things a senior graphics engineer would put on a resume. Vaporwave prettiness without a real technique underneath does not qualify; conversely a genuinely deep technique that renders muddy is also a miss — both halves must land.
3. **SwiftShader CI bar: fps ≥ 5.** The headless suite runs on SwiftShader software GL and asserts live fps. Your design must include a concrete software tier (what shrinks: grid sizes, iteration counts, step counts, resolution) and stay *usable* there — the ink solver survives via 128→96 grid, 480→320 dye, 24→16 Jacobi; budget comparably.
4. **No new npm dependencies.** three.js + TypeScript only, same as the rest of the project. GLSL lives in a shaders module as template strings.
5. **Contract fit.** Every ModeHandle method must behave: click at pointer, miss returns false (and the page expects a *miss* to change nothing — no phase move, no counter), restore to pristine, slow-mo, mute, clean dispose (RAF, listeners, targets, materials, renderer, canvas removal). `detonateAt` must work with the *stage* element rect (the canvas's parent), which is 16/11 on desktop and 3/4 on ≤640px.
6. **HUD contract.** `formatHud` line must include `fps N`, `phase <word>`, and at least one integer counter the suite can regex, plus any domain stat you want (like ink's `grid 128`). Phase words: pick 2–4 states (lantern: pristine/detonating/settling; ink: still/live/blast).
7. **Reduced motion** must gate motion exactly like the existing modes (static pristine paint; detonation gated; restore works).
8. Name: mode `id` = one short lowercase word (localStorage key, `?mode=` deep link, `data-mode` attribute all use it). Title lowercase, fits the "ember" mood without reusing "lantern" or "ink".

## Your freedom

You own the concept, the name, the math, the look. The contrast space is yours — hybrid continuum materials (e.g. MPM-family gels/sand/snow), raymarched volumetrics, reaction–diffusion fields, GPU rigid bodies, cellular automata, lattice methods, or something else entirely — choose what you can execute superbly inside the constraints, and commit. If torn, pick the one with the best (depth of technique × legibility of the explosion × SwiftShader budget) product and defend it in one sentence against the runner-up.

## Output format (no code this round)

1. **Concept** — ≤60 words: name + pitch; then 3 short lines: pristine / mid-blast / aftermath, what the eye sees.
2. **Technique** — ≤120 words: the core algorithm, where it runs (which textures, which passes), and the one-line argument for why it is a genuinely third technique, neither shards nor Navier–Stokes.
3. **Contract fit** — the exact `formatHud` line with example numbers; phase words; what each ModeHandle method does in your mode (one line each); your ModeDef `techniques` (5 label+detail pairs, lowercase, in the voice of the existing two modes).
4. **Performance plan** — per-frame pass list with target sizes; the software-tier deltas; expected SwiftShader fps and why.
5. **Risks** — top 3, each with the mitigation you'd bake into the implementation.
