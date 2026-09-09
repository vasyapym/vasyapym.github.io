# BRIEF 15 — realm r3: the "enter the realm" chip redesign (relayed, two deliverables)

Follow-up on brief 14's item 1: the scroll-gated chip was not just missable,
it was mathematically invisible on large desktop viewports. Measured on real
page heights (maxScroll ≈ 1750px at every desktop size, gates scale with vh):
1440×900 → 608px visible window; 1920×1200 → 233px; **2560×1440 → band
inverted (start 1102 > end 1031) — the chip never appears**, which is the
owner's Windows/Edge report verbatim ("can't scroll much on desktop").

## Round shape

1. **Concept round** — the chat model produced 5 concepts (CSS-only, one
   `<button class="realm-enter-chip">` each, cross-browser-safe CSS). The
   orchestrator built live mockups over real landing backdrops (hero / cards /
   page end / mobile, 1440×900 + 2560×1440 + 390×844) and an interactive
   contact sheet with hover/focus; owner picked **concept 4 — "нижний порог"**
   (bottom-left threshold bar: index numeral / label + caption / arrow field,
   ochre top rule).
2. **Implementation round** — FIND/REPLACE patch from the chat model, applied
   by the orchestrator.

## Chosen visibility law (replaces the band)

- Desktop ≥768px: visible from first render (scrollY = 0), never scroll-gated,
  end-of-page hiding removed.
- Mobile <768px: one-shot reveal at `scrollY >= min(0.4·vh, 320px)`, then
  never re-hidden (single `realmChipRevealedRef` latch).
- `.realm-bottom-floor` gradient and the esc-returns-focus / entry-seed
  contracts unchanged.

## Integrator findings fixed during verification

- The chip's inner `<span class="realm-caption">` collided with the realm
  layer's `.realm-caption` ("the deep · gpu fluid…") — the layer rule made the
  chip caption absolute inside the button. Renamed to
  `.realm-chip-caption`; the probe's caption check is scoped to
  `.realm-layer .realm-caption`.
- The mobile regression leg had to run on a **fresh page**: reloading the
  scroll-restored desktop page (scrollY > 320) fires the one-shot reveal
  before the reset — the law working as designed, the test flow was wrong.
- realm-shots.mjs had a second text-lookup of the old "enter the realm" label
  the patch missed; both lookups now use `.realm-enter-chip`.

## Gates

`tsc --noEmit` clean · `vite build` ok · `tests/realm-probe.mjs` **31/31**
(six new gates: desktop scroll-0 visible, 2560×1440 scroll-0 visible,
desktop page end visible, mobile hidden-at-0 / revealed-at-400 /
stays-after-return) · live shots at 1440 hero/cards/end, 2560, mobile
inspected: bar sits clear of the "beneath" panel, caption inline, mobile
full-width strip with the arrow field.

## Pass B — the two iOS-Safari bugs (same relayed round)

- **Bug A (white flash on surface):** root-caused to the light document
  backdrop (`:root`/`body` #e4e5e1) exposed by the compositor during retile
  after the WebGL layer unmounts + fixed-body scroll restore. Fixed
  declaratively: `:root:has(.signal-index), :root:has(.signal-index) body
  { background-color: #0b1317 }` — restoring an inline dark style in the
  unmount cleanup would recreate the exposure at the exact wrong moment.
- **Bug B (sheet mid-screen):** the mobile sheet anchored to a fixed
  `inset: 0` layer that tracks the LARGE layout viewport; fix = the realm
  effect tracks `visualViewport` height/offset into `--realm-visible-*`
  custom properties (strict-safe restore), the mobile block sizes
  `.realm-layer` to the visible viewport (vh→dvh→var cascade) and caps
  `.realm-layer .realm-panel` at 48% border-box.
- Gates: probe 31/31; sanity run confirmed body/html computed #0b1317, vars
  present while open and removed after exit, sheet geometry 602..844 at
  390×844. Real-device checklist handed to the owner (n157).

## Graph

n156 (pass A), n157 (pass B). Closed by the round's closing commit.
