# Ledger — shell · realm anchor geography (8 doors, id-keyed)

Task: owner reported realm positioning broke after the spine-first reorder
("some seem closer to each other, doesn't seem ordered") — delegated to the
chat model per the relay protocol; orchestrator integrated.

## Round R001
- Goal: 8-door anchor layout, reorder-proof, deliberate composition.
- Root cause: ANCHORS was a 7-entry index-aligned array. With 8 doors,
  count = min(8,7) = 7 → quicknotes had no creature at all; and index pairing
  sat every creature at a neighbour's old spot.
- Chat-model design (relay brief → response, integrated onto the real code):
  id-keyed `ANCHORS: Record<string, Anchor>` + `FALLBACK_ANCHOR` +
  `anchorFor(id)`, mirroring the shipped DOOR_HUES fix. Composition: a
  descending top-left→bottom-right zigzag in catalogue order, sides
  alternated, fy stepped ~0.10–0.12: spine (.22,.14), raft (.66,.24),
  kitty (.4,.36), explosion (.78,.47), evening (.24,.58), planck (.58,.68),
  practice (.34,.8), quicknotes (.72,.9).
- Orchestrator deltas from the model's draft: kept the real bodies it elided
  (computeFrameTarget band math, pickSide room logic); fixed the model's
  dropped guards; also resolved `warpTo` by creature id (a 5th ANCHORS
  consumer the model's checklist missed); fixed two stale-count side effects
  the 8th door exposed — the scene hint "find the seven" is now
  `find the ${doors.length}`, and the landing threshold's hard-coded "07
  works/doors" derives from projects.length.
- Changes: realm-scene.ts (ANCHORS record, count/slice removal — all 8 doors
  build, framing/pickSide/warpTo/spawn resolve by id, startEnter signature
  number-index → `returnDoorId: string | null`), RealmMode.tsx (findIndex
  block deleted, rid threaded through), LandingPage.tsx (threshold counts).
- After: artifacts/R001/door-spine.png · door-kitty.png · door-evening.png ·
  door-quicknotes.png
- Visual inspection (headless Chromium 1440×900@2x, legend-driven framing):
  all 8 legend buttons present incl. Quicknotes; each door frames its own
  creature (camY-only, parked lantern untouched — r13 law holds); sheets
  dock left/right by free room (pickSide logic unchanged); no crowding —
  the model's pairwise fx spacing holds on screen; quicknotes framed at the
  deep floor (fy 0.9); hint reads "find the 8".
- Code verification: tsc --noEmit + shell build pass. NOT verified on
  device: deep-return spawn per door (startEnter(returnDoorId) path — the
  same anchorFor resolver every other path uses; null-return center spawn
  exercised by all shots).
- Open question: owner verdict on the composition (zigzag order + spacing)
  and the two derived-count copy fixes.
