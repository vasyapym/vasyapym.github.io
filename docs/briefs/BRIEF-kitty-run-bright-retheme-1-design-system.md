# BRIEF 1 — Cat Runner "Bright Daylight" re-theme: design system spec

You are a design director briefing a code integration agent. You have NO repo
access; everything you need is in this document. Your output will be pasted
back to the integrating agent verbatim.

## The project

"Cat Runner" (`kitty-run`) is an endless runner embedded in a developer
portfolio. A cat runs on her own; the player jumps (double jump), dashes with
brief invulnerability (bullet-time lens), collects hearts/stars into a combo
multiplier, and keeps a three-heart meter alive. A faded "echo" of your best
run replays beside you and gives chase. Everything is procedural vector art —
zero image assets. Rendering is three.js (flat `meshBasicMaterial` shapes,
no lighting), HUD/overlays are DOM+CSS.

The run travels through four "districts" keyed to distance; every 0→1 blend
between them lerps a fixed color table. District I anchors the whole world.

## Why this pass exists (history you must respect)

The game's mechanics, difficulty direction, and verification suites are good
and MUST NOT change. But the art direction has drifted badly: a previous
session replaced the original Hello Kitty-style white cat with a spooky
"candy-goth" character ("Nix": chipped ear, fang, wisp-hood) and re-skinned
the world into a DARK night city ("Night Districts": aubergine sky, plum
hills, mint glow). The owner rejects this: the character is unattractive and
the dark world is wrong. Your job is a complete aesthetic re-theme.

Prior records from that session are UNRELIABLE — do not try to preserve or
reference their design decisions beyond what is stated here.

## The locked direction (owner decisions — not negotiable)

1. **Bright daylight world.** Light, vibrant, candy-bright. The dark
   "Night Districts" mood is rejected. Every district must stay bright; bold
   contrast comes from saturation-vs-white plus one warm ink, never from
   darkness.
2. **Simple / Bright / Bold.** Clean uncluttered shapes, light vibrant
   palette, strong silhouettes, confident thick outlines, generous spacing.
3. **Character: Hello Kitty-style white cat, reinterpreted as a runner**
   (homage, not a copy). Classic face DNA: wide white head (wider than tall),
   two round ears, wide-set black oval eyes placed low, one YELLOW OVAL NOSE,
   NO MOUTH, three whiskers per side, RED BOW on one ear. Runner outfit: pink
   overalls, little sneakers, and a trailing scarf for speed. Cheerful.
4. **The character's signature red** (bow + scarf) should tie to the world's
   pickup/accent reds so the whole game shares one accent family.
5. Typography gets a chunky rounded display voice for HUD/banners (Google
   Fonts import is acceptable and precedented in this portfolio). Mono
   kickers stay for continuity with the portfolio shell.
6. Aesthetics only. No mechanics, physics, spawn, audio, or architecture
   changes. The four-district machinery stays; only the four palettes,
   names, and art direction change.

## The sky "moon" caveat

A round glowing disc rides the sky (currently a moon). In a bright world it
should read as a SUN (flat warm disc, soft glow). The color-table key is
named `moon` — the KEY NAME stays (code depends on it); district I's value
must stay `#ffffff` (it is a multiply tint where `#ffffff` = identity), and
the sun disc texture itself will be redrawn by the integrator. Just treat the
key as "celestial disc tint" and design the four values accordingly (they
should stay pale/bright — tints of a warm white sun, never dark).

## Deliverable

A **design-system spec**, as structured Markdown with EXACT sRGB hex values
for every key. No code, no three.js. The integrator will mechanically apply
it. For every color also give a one-line rationale. Be decisive — propose
one coherent system, not options. Target length: compact (roughly 150–250
lines). You MUST cover:

### 1. `PALETTE` — the base (district I) world + character

Use EXACTLY these key names (code depends on them); give each a new hex.

Character (the classic runner kitty):
- `furCream` — fur fill (expect near-white; warm it slightly off pure #fff
  only if you have a reason)
- `outlineInk` — THE outline ink, also mouth cavity; one warm deep
  plum-brown/aubergine-brown ink shared by everything outlined in the world
- `eyeInk` — eye fill (usually = outlineInk)
- `scarfCoral` — scarf + bow MAIN fill (the signature red — pick a confident
  cherry/watermelon red, not maroon, not pastel)
- `scarfDeep` — accent: inner ears, bow knot, chest clasp (a companion tone)
- `suitRose` — the pink overalls
- `noseBerry` — the NOSE (must read as the classic YELLOW oval nose — key
  name is legacy, the VALUE must be a warm egg-yolk yellow)
- `cheek` — blush ovals
- `ink` — eye catchlights (tiny white sparkles; usually near-white)

World (district I anchors — the whole world tints FROM these):
- `skyTop`, `skyMid`, `skyBottom` — vertical 3-stop sky gradient. Bright
  saturated cerulean/sky-blue at top easing to a warm cream/pale horizon.
  (`skyMid` is a baked gradient mid-stop; also give the hex here.)
- `cloud` — chunky flat cloud fill (expect white or near-white)
- `hillFar`, `hillNear` — two flat hill silhouette layers receding into the
  sky (mint/teal/green family; far = lighter, near = deeper)
- `groundTop` — the runway's top "frosting" band (strawberry-pink family)
- `groundBody` — the big flat ground body under the band (deep but still
  BRIGHT candy tone; the dark ink-plum is rejected)
- `groundDot` — a thin luminous-but-soft edge line on the band
- `pathEdge` — legacy key, still must be given a sensible bright value
- `obstaclePlum` — hazard block main fill (candy tangerine/coral family;
  hazards must read "candy", not "debris", and must contrast against the
  pink runway AND the hills)
- `obstacleDeep` — hazard border ink
- `obstacleDot` — hazard polka dots
- `heart`, `heartGlow`, `star`, `starGlow`, `heal` — pickups: cherry-red
  hearts, sunshine-yellow stars, big heal heart; glows are pale halos
- `ink`, `paper` — DOM HUD ink-on-paper tokens (the game page chrome is a
  dark ink system OUTSIDE the stage, but inside the stage HUD sits on the
  bright sky: define `ink` as the deep warm ink used for HUD text and
  `paper` as the card/paper surface, both tuned for AA contrast ON the
  bright sky)

### 2. `BIOME_PALETTES` — four bright districts

The table has 4 entries, each with EXACTLY these keys:
`skyTop, skyMid, skyBottom, cloud, hillFar, hillNear, groundTop, groundBody,
groundDot, pathEdge, obstaclePlum, obstacleDeep, obstacleDot, moon`.

Rules: district I must equal the PALETTE world anchors above (`moon` =
`#ffffff`); every district stays bright/daylight; they must feel like a
journey with distinct moods (propose names). All four should remain in one
family language (same ink, same saturation confidence). Suggested journey
shape — adjust freely but keep all four bright: (I) fresh morning meadow →
(II) warm citrus/golden beach → (III) cool ocean/sky cove → (IV) candy
festival finale (brightest, most celebratory — NOT dark).

Also propose 4 short district `LABELS` (HUD chip, 1–3 words each, title
case) + lowercase `NAMES`.

### 3. Character concept sheet (prose, for the code pass)

Shape-by-shape spec of the runner kitty the integrator will build from
vector primitives: head proportions (width:height ratio), ear shape/size,
eye placement rule of thumb, nose size/placement, whiskers (3 per side,
angles), bow size/position (which ear), overalls + tee/straps + buttons,
sneakers (color blocking), scarf (how it trails), tail. Keep the silhouette
BOLD and readable at small sizes. This is the visual contract for the next
brief; be specific about proportions and overlaps (e.g. "bow sits over the
left ear, covering roughly 30% of it").

### 4. Typography + HUD art direction

- Pick the chunky rounded Google Font (one family; name it and the weights).
- HUD treatment: score/best numerals, combo counter, hearts row, district
  chip, milestone banner, dash pad — how each looks (fills, "sticker"
  outlines/shadows, radii, casing, letter-spacing) so it feels bold-cute and
  stays AA-readable over the bright sky. Give exact CSS-ready values where
  sensible (sizes in px/clamp, radii, shadow recipes).
- Ready / pause / game-over overlay cards: surface, border, radius, shadow,
  button treatment (one accent = the signature red family).
- Bullet-time dash treatment in a BRIGHT world: the current rose vignette
  concept — how should it read now? (e.g. which hue, how strong).

### 5. Echo palette

The best-run ghost is the same rig retinted at mount into ONE soft family
(currently a "pale spectral mint" on the dark world — rejected vibe). Define
the echo family for the bright world as a map of the 8 character hexes
(furCream, suitRose, scarfCoral, scarfDeep, noseBerry, cheek, outlineInk,
ink) → echo hexes, so she reads as a faded watercolor memory but still
coherent with the new palette. Echo opacity stays 0.66.

### 6. Copy tone (small list)

Current UI copy went gothic ("prowl", "wish spent", "haunts your heels",
"watch it haunt itself", "stilled", "wake up", "anew", "best wish"). Rewrite
these six strings in a cheerful runner voice (same button/hint slots):
ready kicker, ready echo line, start action, watch-the-bot title, paused
kicker/hint/action, game-over kicker/badge/action. Keep them SHORT.
