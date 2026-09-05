# BRIEF — kitty-run × Dark Souls v2, deliverable 1: the design system, rewritten

You are the art director for a theme variant of an existing finished game.
You have no access to the repository; everything you need is in this brief.
Return **data only** (colour values + copy) — implementation happens
elsewhere. A previous souls pass produced the values you will replace; the
owner rejected its look as "generic medieval — helmets, basic armor,
standard medieval decor". This pass must be unmistakably **Dark Souls**.

## The project

"Cat Runner" is a pastel endless-runner browser game (three.js, zero image
assets — every surface is canvas-generated texture or procedural vector
art). A white cat in a red bow runs right forever; the player jumps (double
jump), dashes through hazards in bullet time, and keeps a three-heart meter
alive. Pickups: small hearts, a big cross-heart, gold stars. Obstacles:
crates. The second selectable character, the **ashen knight**, re-themes the
whole presentation. Gameplay/physics are untouched — cosmetic only.

## The visual target (a reference image, described)

The owner pinned a pixel-art Dark Souls vista. Read it carefully — every
value you choose should be traceable to it:

- A **tiny caped knight** in a full great helm stands on a **stone bridge**,
  seen from behind, holding a faintly glowing sword.
- Behind the knight rises a **colossal gothic castle-city**: dozens of
  spires, towers, buttresses, cathedral roofs — layered in **atmospheric
  perspective**: the farthest layers are light, desaturated blue-grey
  fading into mist; nearer layers step down into deep slate blue.
- The sky is **dusk, not midnight**: slate blue above melting into a warm
  **ash-rose** glow at the horizon; long **streaky painterly clouds** lit
  **peach-orange from below** by a hidden sun.
- A handful of **tiny ember-orange windows** glow inside the castle mass.
- The whole palette is desaturated cold blue-grey carried by exactly one
  warm family (ember/peach). No purple anywhere. Mood: colossal, quiet,
  funereal — scale contrast between a small knight and a vast dead world.

## What changed vs the rejected pass

The rejected pass kept rolling hills, puffy grey clouds, and a skullcap
helm — the shapes read medieval-generic. The fix is not more grey: it is
**gothic architecture silhouettes, ember-lit dusk clouds, and colder deep
slate values**. You are re-authoring every value with that image in mind.
Six **new palette keys** are being added for the new backdrop; you supply
their souls values (pastel defaults for the other theme are handled
elsewhere — do not worry about them).

## Hard constraints

- Every value is a single sRGB hex (`#rrggbb`). No rgba, no gradients.
- Readability during play: obstacles (near-black crates) sit against the
  ground band and must stay separable from it; pickups must pop; the
  knight's bone-white silhouette must stay readable against the ground.
- Keep the value ladder distinct: sky mid ≈ 0.22–0.28 luminance, ground ≈
  0.12–0.16, crates ≈ 0.03–0.07, cat ≈ 0.75–0.80. Silhouettes never share a
  rung.
- Bloom rule: the post chain glows anything above luminance ≈ 0.85.
  Deliberate bloom is allowed on exactly three things: the **moon**, the
  **soul wisps** (heart/heartGlow), and the **ember windows**
  (`windowEmber` — small and sparse, they should smolder). Clouds, castle
  layers and the cat must stay **under** it.
- Dark ≠ grey soup: the warm family (ember/peach/ash-rose) carries every
  living light; the cold family (slate, ash, bone, pale soul-light) carries
  the dead. Absolutely avoid purple-heavy "candy goth".
- The three castle layers must form a strict value ladder (far lightest →
  near darkest) so the atmospheric perspective reads instantly.

## The palette keys to author (39 — all of them, souls values only)

| Key | Paints |
|---|---|
| `kittyWhite` | cat body, ears, feet, arms (bone-white) |
| `outlineInk` | all vector outlines + whiskers |
| `eyeInk` | eyes (souls: near-black) |
| `noseYellow` | nose (souls: ember) |
| `cheek` | cheek blush (souls: weathered skin tone) |
| `suitPink`, `suitDeep` | the dress (souls: rusted tunic + its shadow) |
| `bowRed`, `bowDeep` | helm/tunic iron + its dark (NOT red) |
| `skyTop` → `skyMid` → `skyBottom` | vertical dusk gradient, top → horizon |
| `sunCore` | the moon disc (cold, blooming) |
| `sunHalo`, `sunHaloSoft` | its two-step glow |
| `cloud` | cloud bodies (dark slate mass) |
| `cloudLit` | **NEW** — the warm peach lit rim/underside of clouds |
| `hillFar`, `hillNear` | kept for the pastel backdrop — give souls values anyway (spare) |
| `castleFar` | **NEW** — farthest gothic skyline layer (lightest, misty) |
| `castleMid` | **NEW** — middle gothic skyline layer |
| `castleNear` | **NEW** — nearest gothic skyline layer (darkest, richest silhouette) |
| `windowEmber` | **NEW** — tiny lit windows in the near layer (may bloom) |
| `ash` | **NEW** — falling ash motes drifting over the scene |
| `groundTop` | the walkable ground band (dark stone) |
| `groundBody` | the mass below it |
| `groundDot` | a thin bright edge line on the surface (ember-lit edge) |
| `pathEdge` | spare key — a ground-family value |
| `obstaclePlum`, `obstacleDeep`, `obstacleDot` | crate fill / border / rivets (iron + bone rivets) |
| `heart`, `heartGlow` | small pickups = pale soul wisps + glow (cold, blooming) |
| `star`, `starGlow` | combo stars + glow (ember gold) |
| `heal` | the big heal pickup (estus ember) |
| `healBurst` | particle burst when healed (warm) |
| `ink`, `paper` | UI tokens (near-black ink / bone paper) |

Current souls values, for calibration only (you are replacing them):

```ts
kittyWhite: "#ece5d8", outlineInk: "#1c1816", bowRed: "#7c7a78",
bowDeep: "#4f4c4a", suitPink: "#925039", suitDeep: "#5a3024",
noseYellow: "#e8803c", cheek: "#c9a08c", eyeInk: "#241d1a",
skyTop: "#55647e", skyMid: "#7b8797", skyBottom: "#a89484",
sunCore: "#eef2f8", sunHalo: "#ccd6e2", sunHaloSoft: "#a3afbf",
cloud: "#aab1b9", hillFar: "#66748a", hillNear: "#4a5566",
groundTop: "#6b655d", groundBody: "#3e3a36", groundDot: "#e89a5e",
pathEdge: "#55504a", obstaclePlum: "#4a3b36", obstacleDeep: "#1e1917",
obstacleDot: "#d9b98e", heart: "#dcecff", heartGlow: "#9ec4ee",
star: "#f5b642", starGlow: "#d9781f", heal: "#ea6a24",
healBurst: "#ffb37a", ink: "#1a1614", paper: "#e8e2d6",
```

Where the rejected pass went wrong: its sky (#55647e→#a89484) is mild and
evenly lit, its clouds (#aab1b9) are flat grey with no ember rim, and it
has no architecture at all. Push harder: deeper slate up top, a stronger
ash-rose band at the horizon, clouds with real warmth on their lit side,
and castle layers that step down from misty grey-blue to near-black iron.

## The UI copy to re-voice (15 fields)

The register is set and works — solemn, wry, short. Keep `overKicker`
exactly `YOU DIED`. You may sharpen wording but respect the length limits
(hard — pills must never wrap). One **new field**: `pickLabel`, the small
header above the character-select cards (≤ 28 chars; it should invite the
choice, e.g. something like "choose your…" — your voice).

| Field | Current | Limit |
|---|---|---|
| `name` | `ashen` | ≤ 16 chars |
| `blurb` | `the hollow runner` | ≤ 24 chars |
| `best` | `best` | ≤ 12 chars |
| `readyKicker` | `rise` | — |
| `readyAction` | `begin` | — |
| `watchTitle` | `or watch the hollow walk` | ≤ 30 chars |
| `watchHint` | `autopilot · a hollow that has died on every track` | ≤ 60 chars |
| `pausedKicker` | `rest` | — |
| `pausedHint` | `p or esc to rise · r restarts` | keep key names |
| `pausedAction` | `go on` | — |
| `overKicker` | `YOU DIED` | exact |
| `overBadge` | `new record` | ≤ 20 chars |
| `overAction` | `rekindle` | — |
| `dashLabel` | `roll` | — |
| `pilotLabel` | `phantom · take control` | — |
| `pickLabel` | *(new)* | ≤ 28 chars |

## CSS accents (8 hexes)

Consistent with the palette: `ember` (primary accent: CTA, active card,
combo), `emberDeep` (hover/pressed), `soul` (pale soul-light glyph fills),
`soulGlow` (its glow halo), `death` (the YOU DIED red — must read on
near-black), `card` (overlay card surface, near-opaque), `cardLine` (card
border), `inkMuted` (secondary text on dark). The rejected pass's accents
were fine in spirit (`#e8863c` ember family) — keep them working, sharpen
if the new palette calls for it.

## Ghost afterimage tints

The best-run echo renders as a faded single-tint print of the knight. Give
the seven faded targets, in this order: `kittyWhite, suitPink, bowRed,
bowDeep, noseYellow, cheek, outlineInk`. Ash-memory family: desaturated,
slightly light, warm-grey — never icy blue. Rejected-pass calibration:
`#f0ebe2, #b8a498, #9a9591, #6e6862, #d8a67e, #bfa99c, #4a423d`.

## Required output format (exactly these six blocks)

1. **Art direction** — ≤ 120 words: the mood rules your values follow, and
   how each family maps to the reference image.
2. **`SOULS_PALETTE_V2`** — a TS object literal with **all 39 keys** above,
   hex values only, in the table's order.
3. **`SOULS_TEXT_V2`** — a TS object literal with all 16 fields.
4. **`SOULS_UI_V2`** — a TS object literal with the 8 accent keys.
5. **`GHOST_TINTS_V2`** — a TS array of the 7 hex strings.
6. **Notes** — ≤ 10 bullets, one line each, flagging only the riskiest
   choices (readability, bloom, contrast, the value ladder) and why they
   hold.
