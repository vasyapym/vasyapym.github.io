# Ledger — shell · realm door signature hues

Task: owner reported the realm ("the deep") signature colours got messed up —
fix colours only.

## Round R001
- Goal: restore each door's signature hue after the catalogue reorder.
- Root cause: DOOR_HUES was an index-aligned array over the catalogue order.
  Pinning spine first (n10) shifted the table: spine→raft's blue,
  raft→kitty's pink, kitty→explosion's orange, explosion→spine's steel;
  evening-forest/planck/practice-map/quicknotes were unaffected (their
  indices didn't move).
- Changes (RealmMode.tsx, colours only): DOOR_HUES converted from an
  index-aligned array to an id-keyed map (hexes unchanged) + FALLBACK_HUE;
  doors useMemo, hueOf fallback, and the legend dot now resolve by project
  id, so future reorders can't swap hues again.
- Before: git `a1eb926` (hue-by-index); not screenshotted — misalignment
  provable from source.
- After: artifacts/R001/realm-after.png — scene + legend; computed dot
  colours probe-verified per id: spine #9fb0bd, raft-cluster #86aed4,
  kitty-run #dc7f95, explosion #ff8a3c, evening-forest #ffb45e,
  planck-to-now #ffd9a0, practice-map #7fa8c9, quicknotes #7aa2f7.
- Visual inspection: headless Chromium 1440×900@2x, entered via "enter the
  deep"; legend read-back matches the signature table exactly; scene
  creatures/doors draw from the same id-keyed doors array.
- Code verification: tsc --noEmit + shell build pass.
- Open question: owner verdict on the restored hues (colour-only fix; no
  other realm changes).
