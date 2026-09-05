# BRIEF — kitty-run × Dark Souls, deliverable 1: the souls design system

You are designing a **theme variant** for an existing finished game. You have
no access to the repository; everything you need is in this brief. Return
**data only** (colour values + copy) — implementation happens elsewhere.

## The project

"Cat Runner" is a pastel endless-runner browser game (three.js, zero image
assets — every surface is canvas-generated texture or procedural vector
art). A white cat in a red bow and pink dress runs right forever; the player
jumps (double jump), dashes through hazards in bullet time, and keeps a
three-heart meter alive. Pickups: small hearts (mend), a big cross-heart
(full heal), gold stars (combo). Obstacles: polka-dot plum crates, a tall
crate, bobbing balloons. The mood today: soft pastel daylight — blue sky,
puffy clouds, pink frosting ground, plum obstacles.

## The task

A second selectable character, the **"Dark Souls cat"**. Choosing her
re-themes the *entire presentation* around Dark Souls: ash-and-ember mood,
a moonlit/dusk sky instead of pastel noon, iron instead of candy, souls
instead of hearts, a solemn voice instead of pastel chirp. **The gameplay,
physics, difficulty, and simulation are untouched** — this is strictly a
cosmetic variant. A prior re-theme attempt was rejected by the owner as
"unplayable, laggy, ugly"; the lesson is that the dark mood must stay
*readable* and disciplined, not noisy.

Your deliverable — the **souls design system**: every colour key the game
themes by, the UI copy, a small set of CSS-facing accents, and the ghost
afterimage tints. A later pass implements HUD/CSS and the cat's helmet art
from your values, so your choices must stand alone.

## Hard constraints

- Every palette key is a single sRGB hex (`#rrggbb`). No rgba, no gradients
  (textures compose gradients themselves from these hexes).
- Keep the game **readable at a glance during play**: obstacles must
  contrast against ground and sky; pickups must pop; the moon/sun disc may
  glow but must not wash out the upper sky where hazards appear.
- Bloom rule: the post chain adds glow to anything brighter than roughly
  `#d9d9d9` (luminance ≈ 0.85). The pastel clouds sit just under it on
  purpose (`#c4d9eb` — soft, never blooming). In the dark theme a **cold
  glowing moon is welcome** (it may exceed the threshold deliberately);
  clouds must stay **under** it.
- The cat's silhouette must stay readable against the ground she runs on.
- Dark ≠ grey soup: one warm accent family (ember/bonfire orange) carries
  the life; one cold family (ash, bone, pale soul-light) carries the mood.
  Avoid purple-heavy "candy goth" — that was the rejected direction.

## The surfaces each palette key paints

| Key | Paints |
|---|---|
| `kittyWhite` | cat body, ears, feet, arms |
| `outlineInk` | all vector outlines + whiskers |
| `eyeInk` | eyes (same family as outlineInk today) |
| `noseYellow` | nose |
| `cheek` | cheek blush |
| `suitPink`, `suitDeep` | the dress (souls: her tunic/cloak colour) |
| `bowRed`, `bowDeep` | the bow (souls: will be replaced by a helm; still give sensible values) |
| `skyTop` → `skyMid` → `skyBottom` | vertical sky gradient, top to horizon |
| `sunCore` | sun/moon disc (solid circle, 0.98 alpha) |
| `sunHalo`, `sunHaloSoft` | its two-step glow |
| `cloud` | cloud puffs (0.93 alpha, soft edge) |
| `hillFar` (drawn at 0.85 opacity, behind), `hillNear` (front) | two parallax hill silhouettes |
| `groundTop` | the walkable ground band |
| `groundBody` | the mass below it |
| `groundDot` | a thin bright edge line on the surface |
| `pathEdge` | spare key (unused today) — set it to the ground-family value you'd use next |
| `obstaclePlum`, `obstacleDeep`, `obstacleDot` | crate fill / border / polka dots (and balloon bodies) |
| `heart`, `heartGlow` | the small mend pickups (souls: pale soul wisps) + their additive glow |
| `star`, `starGlow` | combo stars + glow (gold today) |
| `heal` | the big heal pickup (red today) |
| `healBurst` | particle-burst colour when healed (soft pink today) |
| `ink`, `paper` | UI tokens (dark ink / light paper today) |

Current pastel values, for calibration:

```ts
kittyWhite: "#ffffff", outlineInk: "#3a3142", bowRed: "#e94f64",
bowDeep: "#d13a50", suitPink: "#f6a9c0", suitDeep: "#e88bab",
noseYellow: "#ffd44d", cheek: "#ffc9d8", eyeInk: "#3a3142",
skyTop: "#9fd9f6", skyMid: "#d8ecf8", skyBottom: "#ffeff5",
sunCore: "#fffdf6", sunHalo: "#fffcf0", sunHaloSoft: "#fff4e0",
cloud: "#c4d9eb", hillFar: "#c9e6f5", hillNear: "#a8d8ef",
groundTop: "#ffd9e6", groundBody: "#f7b9cd", groundDot: "#fff3f8",
pathEdge: "#f09dbb",
obstaclePlum: "#8a6fa8", obstacleDeep: "#63507f", obstacleDot: "#cbb9de",
heart: "#ff5f7e", heartGlow: "#ffb3c4", star: "#ffd44d",
starGlow: "#f0b429", heal: "#e8455f", healBurst: "#ff8fb3",
ink: "#4a3b52", paper: "#fff8fb",
```

## The UI copy to re-voice

Current strings (mono, lowercase, terse). Re-voice them in the souls
register — solemn, wry, short. Length limits are hard (pills must never
wrap). `overKicker` **must be exactly `YOU DIED`**.

| Field | Current | Where |
|---|---|---|
| `name` | `kitty` | character chip label (souls: ≤ 16 chars) |
| `blurb` | `the pastel runner` | character chip sub-line (≤ 24 chars) |
| `best` | `best` | HUD best-score label (≤ 12 chars; precedes a number) |
| `readyKicker` | `ready` | ready card kicker |
| `readyAction` | `start` | ready card button |
| `watchTitle` | `or watch it play itself` | autopilot invitation (≤ 30 chars) |
| `watchHint` | `autopilot · the lookahead bot that verifies every track` | autopilot sub-line (≤ 60 chars; keep the meaning: it's the same bot that verifies every track) |
| `pausedKicker` | `paused` | pause card kicker |
| `pausedHint` | `p or esc resumes · r restarts` | pause card hint (controls: keep the key names) |
| `pausedAction` | `resume` | pause card button |
| `overKicker` | `run over` | game-over kicker — **`YOU DIED`** |
| `overBadge` | `new best!` | new-record badge (≤ 20 chars) |
| `overAction` | `again` | game-over button |

(Shared strings you must NOT touch: controls hint, score/points/meters
lines, "your best run will chase you".)

## CSS-facing accents

A later CSS pass needs six hexes pinned by you, consistent with the
palette: `ember` (primary accent: CTA, active chip, combo), `emberDeep`
(hover/pressed), `soul` (pale soul-light for glyph fills), `soulGlow`
(its glow halo), `death` (the YOU DIED red — must read on near-black),
`card` (overlay card surface, near-opaque), `cardLine` (card border),
`inkMuted` (secondary text on dark).

## Ghost afterimage tints

The best-run echo renders as a faded single-tint print of the character
(one family, no aura). Give the seven faded targets for the souls rig, in
this order: `kittyWhite, suitPink, bowRed, bowDeep, noseYellow, cheek,
outlineInk`. They must read as **ash memory** (desaturated, slightly light,
warm-grey family) — never icy blue. The pastel version for calibration:
`#f9f2f6, #f0d3e0, #e3b3c7, #dca6bd, #f1e4d4, #eed3de, #c49cb2`.

## Required output format (exactly these five blocks)

1. **Art direction** — ≤ 120 words: the mood rules your values follow.
2. **`SOULS_PALETTE`** — a TS object literal with **all 33 keys** above,
   hex values only.
3. **`SOULS_TEXT`** — a TS object literal with all 13 fields.
4. **`SOULS_UI`** — a TS object literal with the 8 CSS accent keys.
5. **Notes** — ≤ 10 bullets, one line each, flagging only the riskiest
   choices (readability, bloom, contrast) and why they hold.
