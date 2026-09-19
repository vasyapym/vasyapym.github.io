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

## Round R002 — post-integration gates (bug-iteration pass)

R001 shipped without the probe suite (tsc+build only); the first full
realm-probe run failed 28 gates. Triage against the pre-change tree
(2bcbea2, detached worktree) split them: 8 pre-existing, 20 from the
anchor/count changes' hard-coded fixtures, and 2 real integration gaps.

- **Probe re-coupling (the staleness class killed)**: counts derive from the
  live catalogue (legend buttons == `.signal-index-card` count); legend
  targets select by new `data-project-id` on the buttons; tap fixtures and
  r13/r19 geometry expectations derive from the scene's own anchors via an
  extended dev-only `getDepthSnapshot().anchors` — a future reorder touches
  zero probe lines. The r13 framing gates now assert the clamp LAW (a
  centreable creature at band centre, a shallow anchor clamped at 0 and
  inside the band) instead of hard-coded fy values.
- **Warp keys 1..7 → 1..9** (RealmMode keydown): the hard cap made the 8th
  door unreachable by keyboard; warpTo's own index guard clamps.
- **App.openProject intent collision** (pre-existing, surfaced by the
  triage): a landing-owned realm's first dive wrote the MENU-return intent
  with the body-locked scrollY≈0; on a later deep-return surface exit the
  fresh landing consumed it and zeroed the viewport. Guarded additionally
  on `readRealmReturnIntent()`. Repro-verified (portfolio/probes/
  intent-repro.mjs): intent written pre-fix, absent post-fix.
- **r16 residual (relayed, chat-model diagnosis integrated)**: even with
  the intent fixed, the suite leg restored 0. The scrollTo log proved every
  restore carried S while scrollY stayed 0 — Blink silently CLAMPS
  scrollTo(S) when the document cannot hold it: in suite context the r12
  settlement completed late, so the leave's restore fired into the still
  mounted project page (scrollHeight − innerHeight = 0). Fix: the
  intent-carried restore re-asserts across frames (bounded 240 rAF) until
  the document can hold S and the offset sticks; cancelled by the first
  user input (r15 law kept); fallback path stays single-shot; a later
  caller never re-scrolls (that variant clobbered a user wheel — caught by
  the r15 gate, fixed before the suite runs). Probe: the r16 leg now waits
  for the settlement synchronously + asserts the restored document can
  hold S; `__r16log`/`__scrollLog` instrumentation kept.
- Suite: realm-probe ALL CHECKS PASSED ×3 (165→170 gates: +settlement,
  +canHold, +centring, +intent); tsc --noEmit + build pass. Device checks
  still pending for the r19 spawn-per-door feel (unchanged from R001).
