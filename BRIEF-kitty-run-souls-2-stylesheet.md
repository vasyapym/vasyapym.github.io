# BRIEF — kitty-run × Dark Souls, deliverable 2: the souls stylesheet

You are writing a CSS block for an existing game. You have no access to the
repository; everything you need is here. Return **CSS only** — no JS, no
markup changes.

## Setup

The game page ("Cat Runner", a pastel endless runner) now has two selectable
characters. The page root carries a modifier class when the Dark Souls
character is active:

```html
<article class="kitty-run-page kitty-run-page--souls">
```

Every DOM node you restyle lives inside it. Your entire deliverable is one
CSS block that will be **appended to the end of the game's stylesheet**,
restyling the existing selectors under the `.kitty-run-page--souls` prefix.
The pastel originals stay untouched for the default character. The page's
outer chrome (header, sound buttons) is already dark shell chrome — do not
touch it.

## Pinned colours (use ONLY these, plus rgba/tints of them)

```
ember #e8863c   emberDeep #b8601f   soul #dcecff   soulGlow #7fa8d8
death #d23b2f   card #1b1917        cardLine #3d3733   inkMuted #9b928a
bone-text #e8e2d6 (the theme's paper)   near-black #1a1614 (the theme's ink)
```

The mood: dusk, not midnight — ash, bone and cold soul-light; ember carries
everything living; nothing purple; no new fonts beyond a system serif stack.

## What exists today (selectors → what they look like)

Stage & scrim:

- `.kitty-run-stage` — the game viewport; `background: #ffeff5` (pastel, only
  visible for a frame before WebGL paints).
- `.kitty-run-overlay` — full-screen scrim: `rgba(11, 19, 23, 0.55)` +
  `backdrop-filter: blur(3px)`.
- `.kitty-run-overlay--ready` — ready-screen variant: light pastel wash
  `rgba(255, 243, 248, 0.34)`, `backdrop-filter: blur(2px)`, card parked
  right (`place-items: center end; padding-right: 11%`). On ≤700px it
  centres (`place-items: center; padding-right: 16px`) — keep that.

HUD (absolute, over the dusk sky — the sky is a steel-blue mid-tone ≈ #55647e
to #7b8797, so light text with a dark shadow reads):

- `.kitty-run-hearts` — flex row, gap 8px; on ≤700px the GROUP gets
  `transform: scale(0.78)` (do not break it).
- `.kitty-run-heart` — 26×24 span, one per life (3 of them), filled pink via
  `clip-path: path("M13 23 C13 23 1 15.5 1 8.5 C1 4 4.5 1 8 1 C10.5 1 12.3 2.4 13 4 C13.7 2.4 15.5 1 18 1 C21.5 1 25 4 25 8.5 C25 15.5 13 23 13 23 Z")`.
  JS toggles classes on each: `.is-empty` (`opacity: 0.22; transform: scale(0.85)`),
  `.is-hurt` / `.is-gain` (both run the existing `kitty-heart-thump` 0.4s
  scale animation). In souls mode these are **souls, not hearts**: design a
  new `clip-path: path(...)` glyph in the same 26×24 coordinate box — a
  pale soul wisp (a soft orb with a short wavering tail reads well; it must
  be legible at 26px). Filled wisp = `soul` fill + a gentle `drop-shadow`
  glow in `soulGlow`; `.is-empty` = a spent husk (dim, desaturated, no
  glow); the thump animations keep working (reuse the existing keyframes).
- `.kitty-run-pause` — 34px round paper button with two ink bars (::before/
  ::after). Iron recolour only; keep the bars and round shape.
- `.kitty-run-score` — 28px bold number, ink #4a3b52, white text-shadow.
  Souls: bone #e8e2d6, **serif**, dark text-shadow.
- `.kitty-run-best` — 12px caption under the score, opacity 0.6.
- `.kitty-run-combo span` — 20px bold `#e94f64` multiplier (×N).
- `.kitty-run-combo-track` / `.kitty-run-combo-bar` — 92×5px track
  `rgba(74,59,82,0.14)`; bar `#e94f66`, scaleX driven by JS.
- `.kitty-run-milestone` — "500 m!" banner, `var(--display)` font, 30–46px,
  `#e94f64` with white + pink shadows; JS animates it in/out. Souls: serif,
  ember or bone with a dark shadow.
- `.kitty-run-dash` — 66px round touch pad, bottom-right; paper background,
  uppercase 13px mono label, `box-shadow`; `::before` is a cooldown ring:
  `conic-gradient(#e94f64 calc((1 - var(--cd, 0)) * 360deg), rgba(74, 59, 82, 0.16) 0)`
  masked to a 5px ring — JS writes `--cd` (1 → 0) every frame. Souls: iron
  pad, **ember** ring arc, keep the mask/geometry exactly.
- `.kitty-run-pilotchip` — bottom-right pill while the autopilot drives:
  `rgba(209, 58, 80, 0.92)` bg, white text. Souls: iron pill, soul-light
  text, ember hover.
- `.kitty-run-bullet` — full-screen bullet-time vignette, `mix-blend-mode:
  multiply`, two radial gradients of rose `rgba(233,79,100,…)`/`rgba(209,58,80,…)`.
  Souls: the same structure, cold dusk tones (deep slate/ash, NOT blue-neon).
- `.kitty-run-debug` — 12px debug readout, ink #4a3b52, hidden unless `?debug`.

Floaters (DOM spans, class set per kind by JS — keep the class names):

- `.kitty-run-floater` (+ `-star`, `-heal`, `-bonus`, `-hurt` variants):
  17–21px bold numbers with a white text-shadow. Souls recolours: base bone,
  star/bonus ember-gold, heal estus, hurt a dim cold tone that still reads
  against the dusk ground.

Overlays & cards:

- `.kitty-run-card` — base card: 1px border `var(--ink-line)`, bg
  `rgba(11, 19, 23, 0.85)`, text `var(--ink-text)`, hover border
  `var(--ink-accent)`. (Pause and game-over use it as-is.)
- `.kitty-run-card--ready` — the ready card, paper: border `#f2cfdd`, bg
  `rgba(255, 248, 251, 0.94)`, ink `#4a3b52`, hover `#e88bab`; floats
  (existing `kitty-card-float` keyframes — keep).
- `.kitty-run-card-kicker` — 12px mono kicker on every card. Ready variant
  is `#e8455f`. In souls mode: ember, letterspaced.
- **YOU DIED**: the game-over card is the only card with the extra class
  `kitty-run-card--over` (markup: `.kitty-run-card.kitty-run-card--over`;
  its kicker text is exactly "YOU DIED"). This is the signature treatment:
  large **serif** `death #d23b2f` (≈ 44–56px, generous letter-spacing, a
  heavy dark text-shadow or layered shadow so it lands like the original).
  Do NOT enlarge the kickers on the ready/pause cards.
- `.kitty-run-card-badge` — "new record" pill, pop animation (keep), bow-red
  today. Souls: ember.
- `.kitty-run-card-echo` — info pill (rose border/tint today; on the ready
  card a rose-on-light variant `.kitty-run-card--ready .kitty-run-card-echo`).
  Souls: soul-tinted on iron; ready variant flips accordingly.
- `.kitty-run-card-title` — the score line, `var(--display)` 24–34px. Souls:
  serif bone.
- `.kitty-run-card-stat` — 13px mono accent line. Souls: ember or inkMuted.
- `.kitty-run-card-hint` — 13px mono muted line (var(--ink-muted); ready
  variant `#8a6f7e`). Souls: inkMuted.
- `.kitty-run-card-action` — the button chip: `var(--ink-accent)` bg,
  `var(--ink-bg)` text; ready variant bow-red bg + white text; hover
  brightens. Souls: ember bg, near-black text; hover emberDeep.
- `.kitty-run-watch` — paper pill under the ready card (border `#f2cfdd`,
  bg `rgba(255,248,251,0.85)`); `.kitty-run-watch-title` 12px uppercase
  bow-red; `.kitty-run-watch-hint` 11px `#8a6f7e`. Souls: iron pill, ember
  title, inkMuted hint.
- `.kitty-run-characters` / `.kitty-run-char` (pastel paper pills, radius
  14px; `.is-active` = bow-red border + shadow) / `.kitty-run-char-name`
  (12px uppercase bow-red) / `.kitty-run-char-blurb` (11px muted). Souls:
  iron chips, ember active border, bone name, inkMuted blurb.

Optional finishing touch (welcome, not required): under `.kitty-run-page--souls`,
give the page `<h1 class="kitty-run-title">` the serif treatment.

## Rules

1. Every selector you write MUST be prefixed `.kitty-run-page--souls `.
2. Restyle only — no layout geometry changes except: the soul glyph's
   clip-path, the YOU DIED kicker's size/spacing, and shadows/colours.
   Existing animations keep running; you may add at most ONE new
   `@keyframes` (prefix it `kitty-souls-`) — the theme is calm, not flashy.
3. System serif stack only: `Georgia, "Times New Roman", serif`.
4. Colours: only the pinned set above + rgba() tints of them. White/black
   only as rgba scrims, not as flat fills.
5. No `!important`. Specificity from the prefix is enough (base rules are
   single-class; the two exceptions are `.kitty-run-card--ready
   .kitty-run-card-echo` and the ≤700px media block — your prefixes
   naturally out-rank both where needed; re-declare anything the media
   block would otherwise steal ONLY if it collides).
6. Keep every `backdrop-filter` and the ready card's right-side parking on
   desktop / centring on mobile.

## Required output format (exactly two blocks)

1. **CSS** — one fenced block, commented section headers inside, ready to
   append to the stylesheet.
2. **Notes** — ≤ 8 bullets: only the judgment calls (glyph geometry,
   legibility, vignette tones, anything you deliberately left alone).
