# Task brief — "Ember Lantern" goes GPGPU: shard physics moved entirely into fragment shaders

You are a senior graphics engineer writing code for a repository you cannot see. This
brief is self-contained: everything you need is here. Work from it alone — do **not**
ask questions. Your responses will be pasted verbatim to an integrating agent that
wires, builds, and tests your code in the real repo, so all code must be **complete
and compilable as written** — no placeholders, no `TODO`, no "…rest unchanged", no
truncated files.

## 0. Delivery protocol — read this first

Full responses have timed out before, so the deliverable is produced across **exactly
two responses**, each kept under roughly 430 lines of output:

- **Response 1 — Part 1**: the complete `ember-gpu-shaders.ts` (all GLSL source as
  exported string constants). No TS logic.
- **Response 2 — Part 2**: the complete `ember-gpu.ts` (all TypeScript logic,
  importing the shader strings from Part 1), ending with a short **law-audit
  paragraph** (§5).

After each part, end with the exact marker line given in §6 — the user replies
"continue" to trigger the next part.

Rules for both responses:

- If a part would exceed the budget, stop cleanly at a file/function boundary and end
  with `TRUNCATED: <what is still owed>` instead of emitting a partial block. The
  integrating agent will reply "continue" and you emit **Part 3 — continuation** with
  exactly what is owed, ending with `ALL PARTS COMPLETE — hand back to the
  integrating agent.` Part 3 exists only for truncation recovery.
- If, when starting Part 2, your Part 1 is no longer in your context, say so in one
  line instead of guessing — the integrating agent will re-paste it.
- Part 2 must import Part 1's exports by the exact names declared in §4.1. If you
  deviate from any locked name or formula, flag it in a one-line `drift:` note at the
  top of that response.

## 1. Project context and why this pass exists

"Explosion" is one of six interactive pieces in a personal portfolio (React 19 + Vite
7 + TypeScript **strict** + three.js 0.185; route `/projects/explosion`). The current
piece, "Ember Lantern", is a paper-lantern moon of 600 shards: one click blasts it
apart, shards tumble and fall to a ground disc, an auto "flashpoint" shockwave bloom
fires at peak dispersion, one click restores it. It replaced an older wasm demolition
lab that suffered a state-sync disease (rendered mesh vs logical state chasing each
other — mid-air ghosts, "intact" destroyed parts).

**The hard law that killed the old design and shapes yours (verbatim in spirit):**

- **Single source of truth.** One owned state drives both the visual and the logical
  reading of every entity. No parallel representation that a second code path can
  update or that can go stale.
- **Atomic, same-frame transitions.** Destruction is same-frame; no timers that later
  "convert" an entity, no async jobs, no limbo state.
- **Rendered view is a pure function of state.** The draw pass reads the state and
  writes every instance every frame — it never "remembers" a previous layout.

**The owner's verdict now:** the piece is technically solid but doesn't yet feel
*worth keeping* as a portfolio centrepiece. The mission for this pass: **showcase an
advanced technology feature** — real GPU engineering that a developer audience will
recognize as senior-level. The chosen feature (locked by the owner + integrating
agent, not up for redesign):

> **Move the entire 600-shard simulation onto the GPU.** Shard positions, velocities,
> and airborne state live in ping-pong RGBA32F float textures; fragment shaders
> integrate gravity, drag, floor bounce, and curl-noise turbulence every frame; the
> render mesh's vertex shader fetches per-shard state straight from the textures via
> `texelFetch`. Zero per-frame CPU per-shard work. The HUD reports `sim gpu` (or
> `sim cpu` for the automatic fallback).

A TypeScript CPU fallback path already exists in the integrating agent's
`detonate.ts` and stays as the safety net; your module returns `null` when float
render targets are unavailable and the integrating agent branches to the CPU path.
**You write exactly two new files; you do not modify any existing file.**

**Environment facts, verified by the integrating agent in the actual test browser**
(headless Chrome on SwiftShader software GL — the same environment the repo's
headless suite runs, so your code WILL be exercised there):

- WebGL2 available; `EXT_color_buffer_float` available; RGBA32F framebuffer is
  FRAMEBUFFER_COMPLETE; float readback roundtrip exact.
- `#version 300 es` shaders with `texelFetch` compile, link, and draw fine.
- One proven pitfall from that probe: **rendering into an RT while also sampling it
  triggers a feedback loop error.** Never bind the texture you're writing to.

## 2. Locked technical constraints

- **Stack**: TypeScript strict (no implicit `any`, `isolatedModules`, ES2022),
  three.js 0.185, **no new npm dependencies**, no external assets, no network calls.
- **Do not use** `GPUComputationRenderer` or any `examples/jsm` helper — hand-rolled
  ping-pong is the point.
- **Do not use** linear filtering on float textures (`OES_texture_float_linear` is
  not guaranteed). All state textures: `THREE.NearestFilter` min+mag, and read state
  with `texelFetch` only.
- **ShaderMaterial rules for three r185**: use `new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, ... })` (not RawShaderMaterial). Three prepends the GLSL3 header
  and precision statements — your GLSL strings must **not** contain `#version`, `precision`, or `#include` lines. GLSL3 syntax: `in`/`out`, no `varying`, no
  `gl_FragColor` (declare `out vec4` in fragment shaders), `flat` qualifier where
  interpolation must not happen.
- **No `Math.random`** anywhere. All per-shard variation comes from `hash`-style GLSL
  functions of the shard index (deterministic).
- **Style**: dense but readable TS, 2-space indent, comments state constraints not
  narration. File header comments in the repo's voice (see §4 for examples).
- Strict disposal hygiene: everything created in `createEmberGpu` (render targets,
  materials, geometries, DataTextures) is disposed in `dispose()`.

## 3. File plan (you own exactly these two files)

Both in `portfolio/projects/explosion/web/`:

1. `ember-gpu-shaders.ts` — Part 1. Exports only string constants of GLSL source.
2. `ember-gpu.ts` — Part 2. Exports `createEmberGpu` and the `EmberGpu` type.

The integrating agent will `import { createEmberGpu, type EmberGpu } from "./ember-gpu"` from its own file. The contract in §4.3 is **locked verbatim** — matching
names and signatures exactly is a compile-level requirement.

## 4. The locked spec

### 4.1 `ember-gpu-shaders.ts` — required exports (exact names)

```ts
export const COPY_FRAG: string;   // fullscreen blit: reads uSrcTex, writes it out
export const SIM_VEL_FRAG: string;  // velocity integration pass
export const SIM_POS_FRAG: string;  // position integration pass
export const SHARD_VERT: string;  // instanced shard vertex shader
export const SHARD_FRAG: string;  // shard fragment shader
export const PASS_VERT: string;   // shared fullscreen-triangle vertex shader for sim passes
```

### 4.2 Simulation design (locked; mirror the CPU constants exactly)

**Textures** — two ping-pong pairs, each `THREE.WebGLRenderTarget(GRID, GRID, { type: THREE.FloatType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false, generateMipmaps: false })` where `GRID = 32` (1024 slots, first `count = 600` used):

- **pos pair**: `xyz` = world position, `w` = unused (0).
- **vel pair**: `xyz` = velocity, `w` = `airborne` flag (1.0 in flight, 0.0 at rest).

**Per-pass plumbing** (locked): one fullscreen-triangle `BufferGeometry`
(3 vertices: `(-1,-1) (3,-1) (-1,3)`, `PASS_VERT` outputs
`gl_Position = vec4(position.xy, 0.0, 1.0)`), one `THREE.Scene` + one
`THREE.Camera`, one `THREE.Mesh` whose material is swapped per pass. A step runs:
vel pass into the vel head, then pos pass (reading the *new* vel head) into the pos
head, then swap both pairs and set the render material's `uPosTex`/`uVelTex`
uniforms to the new heads. `renderer.setRenderTarget(null)` after.

**Uniforms shared by sim passes** (bake constants as GLSL `#define`s or `const`
literals in the shader strings — they are fixed):

- `uPosTex`, `uVelTex` (sampler2D — previous heads)
- `uDt` (float), `uNow` (float, sim-seconds accumulated by the module)
- `uKick` (float 0/1), `uKickStrength` (float)
- `uSettling` (float 0/1), `uSnap` (float 0/1)

**Per-shard variation** — pure functions of the texel's ivec2 `p` (or index
`i = p.y * 32 + p.x`):

```glsl
float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
// seed s = hash11(float(i) + 0.123)
```

- `baseHeat = 0.5 + (hash11(float(i) + 1.7) - 0.5) * 0.14`
- rest position: the golden-angle sphere — constants `R = 1.15`,
  `GOLDEN_ANGLE = PI * (3.0 - sqrt(5.0))`:

```glsl
float y = 1.0 - (float(i) / 599.0) * 2.0;   // i in [0, 599]
float rad = sqrt(max(0.0, 1.0 - y * y));
float th = float(i) * GOLDEN_ANGLE;
vec3 rest = vec3(cos(th) * rad, y, sin(th) * rad) * R;
```

**Velocity pass (`SIM_VEL_FRAG`)** — reads prev pos + prev vel, writes new vel:

1. If `uSnap > 0.5` → `vel = vec3(0)`, airborne 0.
2. Else if `uKick > 0.5` → blast impulse (mirrors the CPU `seedShards`):
   `dir = normalize(pos - vec3(0))` (fallback to `normalize(rest)` if degenerate);
   `speed = (2.6 + 2.2 * uKickStrength) * (0.85 + s * 0.35)`;
   `vel = dir * speed + vec3((hash11(s * 3.1) - 0.5) * 1.4, 0.7 + s * 0.6, (hash11(s * 7.7) - 0.5) * 1.4)`; airborne 1.
3. Else if `uSettling > 0.5` → `vel = vec3(0)`; airborne = `step(1e-4,
   distance(pos, rest))` (so settling shards report aloft until they arrive).
4. Else integrate: `vel.y += -3.4 * uDt`; `vel *= max(0.0, 1.0 - 0.18 * uDt)`;
   floor bounce: if `pos.y <= -1.35 && vel.y < 0.0` → `vel.y = -vel.y * 0.35`,
   `vel.xz *= 0.6`. Turbulence (the shader flex — keep it subtle and *gated to
   flight* so rest is a stable fixed point): while airborne, add a curl-noise
   vector — a cheap 3D gradient/curl built from your hash functions — scaled by
   `airborne * clamp(speed / 6.0, 0.0, 1.0) * 0.4` and a slow `sin(uNow)`
   breathing term. airborne output = `step(0.35, length(vel)) || step(-1.33, -(pos.y + 1.35))` in effect: airborne 1 when `length(vel) >= 0.35` or
   `pos.y > -1.33`.

**Position pass (`SIM_POS_FRAG`)** — reads prev pos + *new* vel, writes new pos:

1. If `uSnap > 0.5` → `pos = rest`.
2. Else if `uSettling > 0.5` → `pos += (rest - pos) * (1.0 - exp(-9.0 * uDt))`
   (mirror of the CPU settle ease), then clamp `pos.y = max(pos.y, -1.35)`.
3. Else → `pos += vel * uDt`; clamp `pos.y = max(pos.y, -1.35)`.

**Initialization** (in `ember-gpu.ts`, not GLSL): build two `THREE.DataTexture`s
(Float32Array, RGBA, FloatType, NearestFilter, `needsUpdate = true`): pos data =
rest positions for i < count (0 beyond), vel data = zeros. Upload each into its
ping-pong head with one `COPY_FRAG` blit pass each (this also smoke-tests the pass
machinery before any stepping). Dispose the DataTextures after the blits.

**Render mesh** (built in `ember-gpu.ts`, shaders from Part 1):

- Geometry: `new THREE.InstancedBufferGeometry()`; copy position (+normal, harmless)
  arrays from `new THREE.TetrahedronGeometry(0.09, 0)`; set
  `geometry.instanceCount = count`; add instanced attribute
  `aIndex` = `new THREE.InstancedBufferAttribute(new Float32Array([0..count-1]), 1)`.
- Material: `new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: SHARD_VERT, fragmentShader: SHARD_FRAG })`.
- `mesh.frustumCulled = false` (state lives in textures; bounds are meaningless).

**Vertex shader (`SHARD_VERT`)**:

- `in float aIndex;` fetch `pos`/`vel` texels: `ivec2(p.x = int(aIndex) % 32, p.y = int(aIndex) / 32)` via `texelFetch`.
- **Heat is a pure function, zero state** (this is a law-audit highlight):
  `tBlast = uNow - uBlastTime`; `heat = baseHeat + (1.0 - baseHeat) * exp(-0.55 * tBlast)`; when settling, blend toward `baseHeat` with the same settle ease
  factor used in the pos pass (`k = 1.0 - exp(-9.0 * uDt)` applied per frame is NOT
  available here — instead approximate with `mix(heat, baseHeat, clamp((uNow - uSettleTime) * 3.0, 0.0, 1.0))`; if your formula differs slightly, `drift:` note
  it — visual only).
- **Tumble, also pure function**: axis = `normalize(vec3(hash-based components of s))`;
  `tumble = clamp(length(vel) / 4.0, 0.0, 1.0)`;
  `angle = s * 6.2831 + uNow * (1.5 + s * 2.5) * tumble`; rotation =
  axis-angle quaternion; orientation = `rotation * restOrientation` where
  restOrientation is an euler of hash-based angles (pure function of s). When the
  shard rests, `tumble → 0` and the angle freezes at `s * 6.2831` — a varied, static
  rest orientation.
- Heat color = the repo's ember ramp, evaluated in-shader (hardcode these stops):
  `#2b2622` at 0.0, `#8a3a1e` at 0.2, `#d39b61` at 0.45, `#e4a669` at 0.7,
  `#ffd9a0` at 1.0. Output color as a `flat out vec3` varying.
- `uniform float uNow; uniform float uBlastTime; uniform float uSettleTime;` are
  supplied by the render material (set by the module each step/kick/settle).

**Fragment shader (`SHARD_FRAG`)**: `flat in vec3 vColor; out vec4 fragColor; fragColor = vec4(vColor, 1.0);` — unlit; heat color IS the light (matches the
current aesthetic; scene fog intentionally not applied — camera distance makes it
negligible; flag as accepted deviation only if you must).

### 4.3 `ember-gpu.ts` — locked export contract

```ts
import * as THREE from "three";
// Part 1 shader imports here (exact names from §4.1).

export type EmberGpu = {
  /** The instanced shard mesh — add to your scene, remove in your dispose. */
  readonly mesh: THREE.Mesh;
  /** Arm a blast impulse; consumed by the next step(). */
  kick(strength: number): void;
  /** Enter/leave the settle phase (shards ease back to rest). */
  setSettling(on: boolean): void;
  /** Same-frame pristine snap (reduced-motion restore path). */
  snapToRest(): void;
  /** Run one sim step at sim-dt (already slow-mo scaled by the caller).
   *  Returns the last-read aloft count. */
  step(dt: number): number;
  /** Last-read airborne shard count (readback on an internal cadence). */
  readonly aloft: number;
  dispose(): void;
};

export function createEmberGpu(renderer: THREE.WebGLRenderer, count: number): EmberGpu | null;
```

`createEmberGpu` returns `null` when: `renderer.capabilities.isWebGL2 !== true`, or
`renderer.getContext().getExtension("EXT_color_buffer_float")` is null (calling
getExtension enables it — do it before creating float targets). Any constructor
throw → catch → return null. **Never throw from this module.**

Internal requirements:

- Module owns a sim clock: `simTime += dt` each `step`. `kick()` sets
  `uBlastTime = simTime` (render material) and arms the impulse uniforms;
  `setSettling(true)` sets `uSettleTime = simTime`; `snapToRest()` arms `uSnap`
  and runs one immediate vel+pos pass pair with `uSnap = 1` (then clears it), so a
  subsequent render shows the pristine lantern with no animation.
- Readback cadence: after each step, at most every ~6th step (and immediately on
  the first step after `kick`/`snapToRest`), read the vel head:
  `renderer.readRenderTargetPixels(velHead, 0, 0, GRID, GRID, buf)` into a reusable
  `Float32Array(GRID * GRID * 4)`; `aloft` = count of `buf[i * 4 + 3] > 0.5` for
  the first `count` texels. Between readbacks, `step` returns the cached value.
  Guard: if the renderer is drawing to the canvas while you read, three handles
  target switching — just always `setRenderTarget` before, and `setRenderTarget(null)` after.
- `step` must also update the render material's `uNow`.
- Sim passes render BEFORE the caller's own `renderer.render(scene, camera)` —
  that ordering is the integrating agent's concern; you only guarantee the passes
  happen inside `step()`/`snapToRest()`/init.
- `dispose()`: dispose both ping-pong pairs, the pass geometry/materials/scene
  objects, the render material, the instanced geometry, the DataTextures, and null
  the readback buffer. The caller removes `mesh` from its scene.

### 4.4 Integration context (informational — the integrating agent wires this)

- The CPU constants you must mirror (already baked into §4.2 formulas): shard count
  600, sphere radius 1.15, gravity −3.4, drag 0.18, floor −1.35, restitution −0.35 /
  xz 0.6, rest epsilon 0.35, cool rate 0.55, settle ease 9.0, blast impulse
  `(2.6 + 2.2·strength)·(0.85..1.2)` + upward bias `0.7..1.3`, xz jitter ±0.7.
- The module will be created once at mount and disposed at unmount; `step()` is
  called once per rAF frame with a sim-dt already scaled by slow-mo (0.35×).
- The HUD will display `sim gpu`/`sim cpu` from the integrating agent's stats.

## 5. The law audit (Part 2 must end with this)

A short paragraph walking the §1 law against your own code: name the single writer
of each state (pos texture pair, vel texture pair, sim clock, aloft cache), confirm
no CPU-side per-shard array exists anywhere in your module (the only per-shard CPU
data are the one-time init DataTextures, disposed after blit), confirm heat and
tumble are pure functions of `(index, uNow, uBlastTime, uSettleTime)`, confirm no
timers/async per-entity transitions exist, and explain why a "mid-air ghost" is
unrepresentable (the render vertex shader reads the same textures the sim just
wrote; there is no second representation to desync).

## 6. Markers

- End Part 1 with exactly:
  `PART 1 OF 2 COMPLETE — reply "continue" for Part 2 (ember-gpu.ts).`
- End Part 2 with exactly:
  `PART 2 OF 2 COMPLETE — hand back to the integrating agent.`
- Truncation: `TRUNCATED: <owed>` → Part 3 continues, ends
  `ALL PARTS COMPLETE — hand back to the integrating agent.`

## 7. Self-check before finishing each part

- Part 1: every export name matches §4.1; no `#version`/`precision` lines; GLSL3
  syntax only (`in`/`out`, no `varying`/`gl_FragColor`); all constants from §4.2
  present and numerically exact; turbulence gated so rest is a stable fixed point.
- Part 2: export contract matches §4.3 verbatim; `getExtension("EXT_color_buffer_float")` precedes float target creation; no linear filtering of float
  textures; no sampling of the RT being written; `Math.random` absent; disposal
  complete; `null`-return paths never throw; law audit present.
- Both: strict-TS-clean (no implicit `any`, no unused imports), 2-space indent, no
  new dependencies, no truncated blocks, markers exact.
