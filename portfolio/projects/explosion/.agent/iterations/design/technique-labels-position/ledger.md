# Ledger — explosion · technique labels below the simulation

Task: owner asked the technique labels (gpgpu · single mesh · no timers ·
flashpoint · soft-gl safe — and the other modes' labels) to sit BELOW the
simulation and ABOVE the buttons (restore, etc.). They previously sat at the
bottom of the page, after the controls + hint.

## Round R001
- Goal: reposition the techniques list between the stage and the controls row.
- Preserved preferences: labels-only chips from the neuroslop pass (details
  removed, `gpgpu` / `navier–stokes` kept); stage-frame overlay "switch mode"
  button untouched; owner-locked stage backdrop untouched.
- Changes: ExplosionLunaPage.tsx only — moved the `.explosion-techniques` ul
  into `.explosion-room`, directly after `renderStage()` and before the
  controls + hint. Room order is now stage → techniques → controls → hint
  (DOM probe verified). No CSS change: the existing top-border divider now
  reads as the sim/labels divider; room gap 14px governs the other spacing.
- Before: not captured as a screenshot (source-order move; the before state
  is git `4398811..` head of ExplosionLunaPage.tsx — labels rendered after
  the hint line at page bottom).
- After: artifacts/R001/after-lower-desktop.png (the full order in frame) ·
  after-top-desktop.png · after-mobile.png
- Visual inspection: Chromium headless 1440×900@2x and 390×844@2x — labels
  row sits between the sim and restore/slow-mo/sound on both; divider reads
  cleanly under the sim; labels wrap to two lines on 390px with zero
  horizontal overflow; buttons unchanged.
- Code verification: shell typecheck + build pass. DOM order probe:
  [stage-frame, techniques, controls, hint], overflowX 0.
- Open question: owner verdict on the placement (and whether the divider
  line above the labels should stay or go).
