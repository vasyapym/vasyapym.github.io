# Brief — Implement "cinder fault" (mode id: `fault`) — full code round

Your cinder fault design is approved as proposed. This round you write the complete implementation. Same constraints as before (SwiftShader fps ≥ 5, no new deps, contract fit, ember palette, no readback); the design doc's decisions (tiers, targets, phases, HUD line, technique rows, copy) are now binding.

## Integration-critical facts (the environment your code lands in)

1. **Files.** Produce exactly two new files, complete:
   - `web/fault.ts` — the mode module (entry, sim, render, handle, stats).
   - `web/fault-shaders.ts` — all GLSL as exported template strings.
   Shape them after the ink module's architecture (a sibling mode), which follows these patterns — follow them, don't reinvent:
   - Fullscreen passes: one `THREE.BufferGeometry` with a 3-vertex big triangle `[-1,-1, 3,-1, -1,3]`, `mesh.frustumCulled = false`, `renderer.autoClear = false`, a `runPass(material, target)` helper swapping `mesh.material`, and explicit `renderer.setRenderTarget(null)` + `renderer.clear()` before the presentation draw.
   - Materials: `new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: PASS_VERT, fragmentShader, uniforms, blending/depth opts })` — sim passes `NoBlending`, depthTest/Write false; GLSL3 only (no `texture2D`, no `varying`).
   - Ping-pong pairs `{ read, write }` with a `swap` helper; targets `THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter/magFilter, wrapS/T: ClampToEdgeWrapping, depthBuffer: false, stencilBuffer: false, generateMipmaps: false })`.
   - Extension gate before any target creation: `EXT_color_buffer_float` or `EXT_color_buffer_half_float`, else dispose renderer and return `null`. Software tier detection via `WEBGL_debug_renderer_info` + `/swiftshader|software|llvmpipe/i`.
   - Loop: `requestAnimationFrame` frame function, `dt = clamp((now - last)/1000, 0, 0.05)`, EMA `stats.fps += (1/dt - stats.fps) * 0.1` when dt > 0, slow-mo multiplies sim dt by 0.35.
   - Determinism: `mulberry32(seed)`-style PRNG (pick a fresh seed) so the pristine mineral composition is identical on every mount/restore.
   - Palette via `new THREE.Color().setHex(hex, THREE.NoColorSpace)` (custom ShaderMaterials receive no colorspace chunk; raw sRGB values keep the design colors).
   - Audio: reuse `DetonationSfx` as-is (`resume()` before user-gesture sounds, `boom(strength)` on accepted impacts, `rebuild()` on restore, `setMuted`, `dispose`). Default muted-state handling must match: the page calls `setMuted(current)` right after mount.
2. **Mount surface.** `mount(element)` gets the stage div: aspect 16/11 desktop, 3/4 at ≤640px, `overflow: hidden`, CSS forces your canvas to `position: absolute; inset: 0; z-index: 0; width: 100% !important; height: 100% !important`. So: `renderer.setClearColor(0x000000, 0)` (the CSS gradient shows through), cap pixel ratio, `renderer.setSize(w, h, false)`, append `renderer.domElement`. **The presentation buffer may be smaller than the CSS box** (your design's ≤720/≤320 long-edge cap): size the drawing buffer independently of CSS, keeping the element's aspect.
3. **Input model.** The page owns all detonation input: `handle.detonateAt(clientX, clientY)` is called on stage pointerdown and on Enter/Space (center of the stage rect). Do NOT attach your own pointerdown listeners. You may attach only what the sim genuinely needs (fault needs none). The miss contract: outside the disc return `false` with zero side effects (no texture writes, no phase/counter changes, no sound); an accepted hit runs the impulse pass and a same-frame presentation before returning `true`.
4. **Exports** (the registry glue I will write calls exactly these):
   ```ts
   export type FaultPhase = "pristine" | "blast" | "settling";
   export type FaultStats = { fps: number; engagements: number; phase: FaultPhase; grid: number; steps: number };
   export type FaultHandle = { detonateAt(clientX: number, clientY: number): boolean; restore(): void; setMuted(m: boolean): void; setSlowMo(s: boolean): void; dispose(): void; readonly stats: FaultStats };
   export function formatFaultHud(stats: FaultStats): string   // `fps N · phase X · engagements N · grid N · steps N`
   export function mountFault(element: HTMLElement): FaultHandle | null
   ```
   `steps` = the previous frame's integration substep count (bounded, per your design).
5. **TypeScript strict.** `tsc --noEmit` must pass: no `any`, no unused locals, explicit return types on exported functions. Only allowed imports: `three`, `./audio`, your own shaders module. Keep comments minimal and in the existing house voice (a short header stating the module's law — like the ink header — plus one-liners where genuinely non-obvious; no narration).
6. **Reduced motion.** No RAF; paint the pristine seal once at mount; `restore()` resets and paints once; resize repaints the static composition; all detonation attempts return `false`.
7. **Dispose checklist** (mirror ink exactly): cancel RAF, disconnect ResizeObserver, remove your listeners, `renderer.setRenderTarget(null)`, dispose targets/materials/geometry/renderer/audio, remove the canvas from the element.
8. **Composition invariant (from your design):** the seal is a centered disc fully visible in both 16/11 and 3/4; displacement is along view depth (orthographic camera); hit testing is analytic (point-in-disc through the stage rect), never pixel-based.

## Output format

Three numbered sections, no prose beyond them:

1. **`web/fault-shaders.ts`** — the COMPLETE file in one fenced block (every shader string, no ellipses, no placeholders).
2. **`web/fault.ts`** — the COMPLETE file in one fenced block.
3. **Registry pieces** — four small fenced blocks:
   a. The `ModeDef` object for `fault` (title/tagline/accentLine/lede/hint/stageLabel/fallback/techniques exactly as designed; `mount` lazy-imports `./fault` and wires `formatFaultHud`), plus the one-line `FaultHandle`/`FaultStats` type-import note if needed.
   b. `ICON_FAULT` — a minimal React SVG snippet matching the two existing mode icons (48 viewBox, `stroke="currentColor"`, `strokeWidth 1.5`, `fill none`, aria-hidden; suggest a fissured-disc motif). Also state the one-line change to `MODE_ICONS`.
   c. Replacement values for the selector constants `SELECT_ACCENT` and `SELECT_LEDE` (currently "two experiments, one room" / "pick an experiment. switch anytime — your choice is remembered.") — three-mode wording, same voice.
   d. A one-sentence replacement for the project landing description, currently: "two experiments in one dark room: a paper-lantern moon that detonates into the 600 shards it is built from — physics runs in fragment shaders on the gpu — and a pool of living ink you shock into vortices with a navier–stokes solver. click to blast; click to restore." It must keep the phrases "paper-lantern" and "fragment shaders" (the landing test greps them) while adding the third mode in the same editorial voice.
