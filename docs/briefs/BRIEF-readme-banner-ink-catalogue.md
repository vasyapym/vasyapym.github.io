# BRIEF — README banner image (profile + vasyapym.github.io), ink catalogue identity

Design — and, if your interface can generate images, directly generate — ONE wide banner
image that will sit at the top of two GitHub READMEs:

1. Vasily's personal profile README (`github.com/vasyapym` — the special `vasyapym/vasyapym` repo).
2. The portfolio repository README (`github.com/vasyapym/vasyapym.github.io` — "Vasily Argounov —
   Engineering Portfolio", live site <https://vasyapym.github.io>).

One image serves both. The image will be committed as a static file and embedded with a plain
markdown image tag, full column width.

## What the project is (you cannot see the repo — this is all the context you get)

Six self-contained interactive systems shipped as one React/TypeScript site: a Raft consensus
simulator (Rust→WASM), GPU shard physics, a pastel endless runner, an 8-bit first-person forest
walk, a log-scale cosmology scrubber, and a learning tool ("Practice Map"). The site's design
system is a settled, owner-approved direction called the **ink catalogue**. The banner must read
as part of that same system — one more plate printed by the same press, not a new identity.

## Settled identity — ink catalogue (protect it)

- Surface: deep ink `#0b1317`, full-bleed, OPAQUE — the banner carries its own background so it
  works on GitHub's dark AND light themes unchanged.
- Neutral ink ramp: `#26333b`, `#465059`, `#7d7669`, `#b6ac95`; paper `#eeeae0` sparingly, for
  type and highlights only.
- ONE accent family: ochre — `#d39b61` base, `#e8b57c` bright, `#b97f45` deep.
- Type: Source Sans 3 for headings; IBM Plex Mono for ALL notation (labels, numbers, tags),
  lowercase except the proper name "Vasily Argounov".
- Notation language: lowercase mono microcopy, index numbers `01…06`, tag words
  (`tool / map / sim / test`), thin light hairline rules, translucent panels
  `rgba(238,234,224,0.045)`, zero border-radius everywhere — sharp rectangles only.
- Signature hero motif: the **glyph field** — a domain-warped fBm heightfield rasterized as a
  field of IBM Plex Mono glyphs: an "ASCII terrain" where glyph density and weight rise out of
  the noise like a landscape. This is the site's hero and the strongest candidate motif.
- Card artwork language (the six project cards): "Spot-Colour Overprint" — neutral inks dominate;
  each card carries ONE identity hue as halftone dot screens plus one small focal fill, at ≤~15%
  coverage. Identity hues: Raft coral `#ff6a5f`; Explosion lantern amber `#ffb347`;
  Planck-to-Now violet `#a98cff`; Practice Map sage `#96b896`; Cat Runner ember `#e8863c` with
  bone-white `#ece5d8`; Evening Forest fox amber `#ffb45e` against dusk purples.

## Rejected (do not reintroduce by accident)

Warm light "concrete/paper" surfaces; blue sea/caustic palettes; rust `#a8652d`; glow shadows and
neon blooms; rainbow multi-hue balancing; rounded corners or framed cards ("keep lines, lose the
card"); marketing superlatives; stock dev-workspace clichés (laptops, coffee cups, matrix code
rain, robot hands, floating holograms).

## Render constraints

- Target master 1280×640 (2:1) — also the exact GitHub social-preview ratio. If your image tool
  only offers fixed ratios, pick its widest landscape (e.g. 3:2) and keep the composition
  2:1-crop-safe: nothing essential in the outer top/bottom 20% bands.
- Must stay legible and composed at ~830px wide (README column) and at small mobile widths;
  no meaningful detail below ~2px at that size.
- Text in AI images breaks easily: at most TWO short strings, spelled EXACTLY:
  "Vasily Argounov" and/or "vasyapym.github.io" (lowercase mono). If you cannot trust the tool
  with text, prefer a text-free composition — the READMEs already carry the words.
- No emoji, no GitHub logo, no fake sentences or unreadable pseudo-paragraphs (the glyph field's
  abstract glyph noise is fine and intended; pretend-prose is not).

## Process — full autonomy, shown reasoning

You have FULL design autonomy. No approvals are needed for any intermediate decision. Show your
reasoning chain explicitly, in this shape:

1. **Restate** the problem in your own words.
2. Draft **5+ genuinely different** composition directions. At least one must use the glyph field
   as the main subject; at least one must be mostly typographic; at least one must borrow the
   halftone overprint card language.
3. **Prune** with named criteria: system fit, small-size legibility, 2:1 crop safety, text-mangling
   risk, cliché avoidance.
4. **Develop** the surviving 1–2 to real depth: layout zones, glyph behaviour, where the ochre
   goes, the eye path.
5. **Stress-test** the pick: light-theme edge, mobile crop, text risk.
6. **Rank** and commit to ONE primary composition.

## Output format (exactly this, nothing else)

1. **Reasoning chain** — the six steps above, compact.
2. **Committed composition** — 5–8 lines describing the final image.
3. **Image** — if you can generate images: generate the banner at the widest landscape ratio your
   tool allows and present it.
4. **Prompt** — the exact, self-contained image-generation prompt you used: plain text,
   paste-ready, with all hex values, style words, composition description, the no-text/exact-strings
   rule, and the aspect ratio. It must not reference this brief.
5. **Variant** (optional, ≤3 lines + prompt) — one alternate composition worth a second generation.
