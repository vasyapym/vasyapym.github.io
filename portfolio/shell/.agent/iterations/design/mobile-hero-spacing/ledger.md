# Ledger — shell · landing hero mobile spacing

Task: owner reported the mobile (iOS Safari) hero copy block ("prototypes
& small machines" + note line) reads condensed after the R-copy-pass removal
of the "currents" kicker — asked for ~10% more free space, or an adjustment
to recover what the kicker's line used to occupy.

## Round R002
- Goal: restore breathing room inside the mobile hero copy panel.
- Preserved preferences: neuroslop pass decision — the kicker word stays
  gone (space is restored as padding, not as text); desktop hero untouched
  (owner said the issue is mobile/iOS); headline size, note copy, panel
  borders/scrim unchanged.
- Changes (shell/src/styles.css, max-width:560px block only):
  copy panel padding 1rem 1rem 1.1rem → 1.4rem 1rem 1.4rem; note margin-top
  1rem → 1.2rem. Comment in-file explains the arithmetic.
- Before: artifacts/R002/before-mobile.png — copy panel 168px tall
  (padding 16/16/17.6, note margin 16px), measured in WebKit (Playwright
  webkit-2104, the iOS Safari engine) at 390×844@2x.
- After: artifacts/R002/after-mobile.png — panel 182px (+14px ≈ +8.3%),
  note margin 19.2px, headline 103px unchanged; hero 719 → 733px.
- Visual inspection: WebKit headless before/after at 390×844@2x — headline
  no longer crowds the panel top, note sits clear of the headline; beneath
  the surface rail unaffected; nothing clipped, no horizontal overflow.
- Code verification: shell typecheck + build pass. (WebKit measurement
  probe: portfolio/probes/hero-spacing.mjs, local-only.)
- Open question: owner verdict — enough air, or push closer to a full +10%
  (one more .2rem step available); iOS device eyeball welcome since the
  probe runs headless WebKit, not a real device.
