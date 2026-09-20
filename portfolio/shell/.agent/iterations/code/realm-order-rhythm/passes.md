# Passes — realm order + symmetric frame + uniform rhythm (relay, chat-model design)

Task: owner feedback, scoped "Main Page — Realm Mode" — (1) project order
quicknotes → spine → practice-map → kitty-run → remaining; (2) symmetric
vertical edge padding above first / below last door; (3) uniform gap between
all doors across the anchor span. Delegated to the chat model per the relay
protocol (deep-reasoning brief with the R001/R002 laws and the probe's
hard-coded fixtures baked in); orchestrator integrated.

## Pass C001 — VERIFIED
- Objective and scope: realm tour order follows the requested sequence; door
  fy values form an exact arithmetic sequence (uniform gap); top/bottom edge
  margins mirror each other; landing surfaces follow the catalogue reorder.
- Acceptance criteria: A1 tour/legend/warp order = quicknotes, spine,
  practice-map, kitty-run, evening-forest, explosion, planck-to-now,
  raft-cluster; A2 constant fy gap; A3 first fy == 1 − last fy; A4 probe
  suite green.
- Chat-model decisions (relay): D1 ordering lands via `pinnedOrder`
  (catalogue = single source of truth, precedent n10/e5b9ab2; landing
  beneath-list + grid follow — consequence stated); D2 spacing law
  `fy = 0.15 + 0.10·i` (m=0.15, g=0.10 → 270px symmetric margins, 180px gap
  at 1440×900; terminating decimals, no float dust); D3 fx pool reused,
  L/R alternated, central pair 0.4/0.58 kept non-adjacent.
- Changes: `portfolio/shell/src/catalog/discover-projects.ts` (pinnedOrder
  → quicknotes, spine, practice-map, kitty-run; remainder alphabetical),
  `portfolio/shell/src/shell/realm-scene.ts` (ANCHORS reassigned id-keyed in
  tour order + header comment rewritten to the new composition law),
  `portfolio/shell/tests/realm-probe.mjs` (4 stale door-name comments only —
  all gates derive from live anchors, zero assertion edits).
- Probe-fixture compatibility (chat-model arithmetic, confirmed by suite):
  G1 quicknotes fx 0.22 ≤0.42 → sheet right; G2 quicknotes fy 0.15 → framed
  camY clamps 0 (close-gate window 18±30 ✓); G3 practice-map fx 0.34 left +
  fy 0.35 > 0.25 centreable; G4 raft-cluster fy 0.85 > 0.75, warp camY 1080.
- Baseline: tsc --noEmit exit 0; full realm-probe suite ALL CHECKS PASSED
  (pre-change tree, Chromium via CHROME_PATH).
- Verification:
  - Command: `npm run build` (portfolio/shell)
    Result: PASS — tsc --noEmit + vite build, exit 0 (chunk-size warnings
    pre-existing).
  - Command: `CHROME_PATH=…Chromium node tests/realm-probe.mjs <outDir>`
    Result: PASS ×2 independent full-suite runs — "realm-probe: all checks
    passed"; 169 PASS lines, 0 FAIL/SKIP.
  - Command: `node ../probes/realm-anchor-shots.mjs` (dev server :5199,
    1440×900@2x)
    Result: PASS — legend order read back exactly as requested; door 00
    (Quicknotes) sheet docks right, door 02 (Waste of tokens) centred in the
    clear band sheet right, door 07 (Raft Cluster) deep floor + sheet left
    as designed. Evidence:
    /var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/quicknotes-r001/realm-door-0{0,2,7}.png
    (scratch, local-only).
- Final diff review: performed — 3 files, 25+/20−; no stray edits, no
  secrets, no debug scaffolding; DOOR_HUES/FALLBACK_ANCHOR/species/world
  constants untouched; no assertion changes in the probe.
- Design constraints: realm-anchor-geography ledger R001 (id-keyed
  geography law) preserved — values reassigned by design, record stays
  id-keyed; R001's "descending zigzag in catalogue order" composition is
  superseded by the owner's ordered-rhythm request (reported here, ledger
  left to the design skill).
- Remaining risks/blockers: visual verdict on the new rhythm belongs to the
  owner (design-iteration); warp digit→door map changed with the order
  (key 8 = Raft Cluster now) — owner-facing, no code impact.
- Next action: task complete on the code side; offer design-iteration round
  if the owner wants a visual feedback pass on the rhythm.

## Pass C002 — VERIFIED
- Objective and scope: owner round 2 — (1) doors still too close: the
  rhythm must account for the added bottom space (the deep floor) and
  redistribute; (2) raft-cluster right after kitty-run; (3) Spine card
  illustration signature colour → red.
- Chat-model decisions (relay round 2): the added space below IS
  `world.deep` (0.5vh) — the round-1 rhythm distributed only over the 2vh
  anchor span, so both symptoms (180px gaps + a 720px dead run below the
  last door) trace to the span excluding the deep zone. Fix: absorb it —
  `ANCHOR_SPAN_K` 2 → 2.5 (r14), keep `DEEP_K=0.5` additive below (world
  = 3 viewports), keep the fy law `0.15+0.10·i`: gaps 180→225px, mirrored
  337.5px in-span margins @1440×900. Order: raft takes slot 4 (fx 0.4,
  fy 0.55); evening/explosion/planck shift down one slot; planck-to-now is
  the last door again. fx = fixed L/R-alternating slots, geometry unchanged;
  first/third doors stay left-half. Spine mark: `#7b93b3` → `#a6533e`
  (house index red: dense dots, halo dots, 2 ticks), `#42536b` → `#6e3527`
  (dark derivative); neutrals + Quicknotes' shared `#7b93b3` untouched;
  `spine/project.ts` accent metadata steel → red (descriptive only;
  DOOR_HUES separate and unchanged).
- Probe gate audit (chat model, confirmed): G0 depth model legitimately
  updates (`2*vh` → `2.5*vh`, the only assertion edit); G1–G6 all hold live
  on the new boundaries (shallow 0.5/K = 0.2, warp-last 1.5/K = 0.6).
- Changes: realm-scene.ts (ANCHOR_SPAN_K 2.5 + r14 comment, ANCHORS
  re-seated + header comment), discover-projects.ts (pinnedOrder +
  raft-cluster), ProjectArtwork.tsx (SpineCenterMark reds),
  spine/project.ts (accent metadata), realm-probe.mjs (G0 constant + 2
  stale door-name comments).
- Baseline: post-C001 tree (n258), tsc exit 0, probe suite green.
- Verification:
  - Command: `npm run build` (portfolio/shell)
    Result: PASS — tsc --noEmit + vite build, exit 0.
  - Command: `CHROME_PATH=…Chromium node tests/realm-probe.mjs <outDir>`
    Result: PASS — "realm-probe: all checks passed" on the new K=2.5 law.
  - Command: `node ../probes/realm-anchor-shots.mjs` (dev server :5199)
    Result: PASS — legend order: quicknotes, spine, waste of tokens, cat
    runner, raft cluster, evening forest, explosion, planck to now; door 04
    (Raft) framed left-half/sheet-right at its new slot. Evidence:
    /var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/quicknotes-r001/realm-door-04.png
    (scratch, local-only).
  - Command: `node ../probes/spine-card-shot.mjs` (one-off, gitignored)
    Result: PASS — spine card shows the red signature (red-dotted keyed
    vertebra + dark red stroke, red halo + ticks), neutrals intact; card
    numbered 02 in the new order. Evidence:
    /var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/quicknotes-r001/spine-card-red.png.
- Final diff review: performed — 5 work files + the pending round-1 graph
  bookkeeping lines; no stray edits, no secrets; probe assertion edits
  limited to the legitimately changed law constant; comment syncs only
  otherwise.
- Design constraints: R001 id-keyed geography preserved (re-seating into
  fixed slots); r13 framing law untouched; r13 "span frozen at two
  viewports" superseded by r14 (owner-driven, documented in-code); Spine
  app's ochre theme untouched (card illustration scope only).
- Remaining risks/blockers: visual verdict on the 225px rhythm and the red
  mark = owner (design-iteration if wanted); warp digit→door map shifted
  again (key 8 = planck-to-now).
- Next action: task complete on the code side.

## Pass C003 — VERIFIED
- Objective and scope: owner round 3 — breathing space better but still
  condensed; "search in graph/commits how i asked you to expand the below
  because i couldn't see the project description; there are plenty space
  left there to distribute more generously".
- History mined (relay input): r13 (946f3cb, graph n192/n193,
  BRIEF-realm-r13-deep-bottom-depth-A) — owner verbatim: the description
  sheet overlapped the bottom creatures' greetings and there was not enough
  scrollable space below for the light to reach down; r13 froze the span at
  2vh and added the 0.5vh deep floor as travel space.
- Chat-model diagnosis (relay round 3): round 2 only SCALED the world —
  the fy window stayed 0.15…0.85 = 70% of the span, so ~337px of unused
  span stacked on the 450px deep below the last door. The empty run the
  owner sees = in-span slack + the deep. Fix: SPREAD the fy window to
  0.08…0.92 (84% of span), span 2.5→3.0 (absorbs another r13 deep's worth,
  fresh 0.5vh deep below), DEEP_K kept 0.5 (inflating it re-creates the
  perceived emptiness). Gaps 225→324px (+44%) @1440×900; the last door
  lands at y=2484 — inside where the old r13 deep floor was. Mobile lift
  bound holds with 24.5px slack; the r13 greeting-clears-sheet contract
  intact; the light still travels below.
- Changes: realm-scene.ts (ANCHOR_SPAN_K 3.0 + law-history comment,
  ANCHORS fy re-spread + header comment), realm-probe.mjs (G0 constant
  2.5→3.0 — the only assertion edit — + 1 stale door-1 comment). Order, fx
  slots, hues, species, CHROME, landing untouched.
- Verification:
  - Command: `npm run build` (portfolio/shell)
    Result: PASS — tsc --noEmit + vite build, exit 0.
  - Command: `CHROME_PATH=…Chromium node tests/realm-probe.mjs <outDir>`
    Result: PASS — "realm-probe: all checks passed" (G0 tracks K=3).
  - Command: `node ../probes/realm-anchor-shots.mjs` (dev server :5199)
    Result: PASS — door 07 (planck-to-now, the deepest at fy 0.92) framed
    with the sheet docked left, greeting core clear of the chrome; legend
    order intact. Evidence:
    /var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/quicknotes-r001/realm-door-07.png.
- Final diff review: performed — 2 files; assertion edit limited to the
  legitimately changed law constant; comment syncs only otherwise.
- Design constraints: R001 id-keyed geography preserved; r13 travel floor
  preserved (G6); r13 sheet-overlap fix preserved (mobile lift 24.5px
  slack @390×725); round-1 symmetric-frame intent survives as the in-span
  mirror (top inset = in-span bottom inset = 216px) under the round-3
  generosity priority.
- Remaining risks/blockers: visual verdict = owner; door 1 (fy 0.08) now
  sits within interactR of the entry spawn on mobile (its greeting may
  fire immediately on entry) — behavioural feel, owner device check.
- Next action: task complete on the code side.




## Pass C004 — VERIFIED
- Objective and scope: owner round 4 — "quicknotes is closer to the top than
  planck to now to the bottom. can it be fixed?" — balance the vertical
  frame (top inset 216px vs bottom inset 666px, ratio 3.08).
- Chat-model law (relay round 4): the asymmetry is entirely the r13 deep
  floor (additive below the span only). Identity: top = fy_0·K·vh; the
  bottom floors at 0.707·vh when fy_last rides the mobile-lift ceiling —
  both pure vh multiples, so fy_0 = 0.707/K balances top==bottom at EVERY
  resolution. K 3.0→3.5 buys balance without shrinking the r3 gaps.
  `ANCHOR_SPAN_K = 3.5`, `DEEP_K = 0.5`, `fy = 0.208 + 0.104·i`
  (0.208…0.936): top 655px, bottom 652px, ratio 1.006, gaps 327.6px
  @1440×900; mobile insets 528/525, G5 lift slack 12.9px. No door frames
  into the camY clamp branch anymore (entry still clamps; the r19 spawn
  gate asserts camYState === 0 there) — the close-hold gate re-expressed
  door-agnostically.
- Integration corrections beyond the delivered patch (documented):
  1. The delivered G2 pseudo-code read `frameSnapshot.camY`, which the dev
     snapshot does not expose — re-expressed to the real r13 law
     (closePanel: "camY stays where the frame left it"): the synthetic
     Escape dispatches on the focused element and bubbles through the layer
     (the esc chain is owned by the layer's onKeyDown — a window dispatch
     never reaches it; the first attempt left the panel open and knocked
     out the side-clear + r11 gates), and the camY is read in the same
     evaluate — race-free, door-agnostic, no numeric window.
  2. The r8 double-click fixture staled: the tap point was captured once at
     camY=0 and reused after a select+close cycle — valid only while
     creature 0 was shallow (framed camY clamped at 0); under the balanced
     law the first selection pans camY by 205px and the second pick misses.
     Fix: re-derive the tap point from live state after the close (the
     suite's own live-derived principle; two gates were failing).
  3. The r13 warp gate raced the ambient dead-band follower: warpTo freezes
     camY on the creature's ANCHOR while the lantern lands on the LIVE core
     (which leans/wanders ±60px by design), so the post-warp view drifts;
     rounds 1–3 won the 300ms race, round 4 lost it. Fix: the law is
     sampled in the same evaluate as the key dispatch (race-free, exact).
- Changes: realm-scene.ts (ANCHOR_SPAN_K 3.5 + law-history comment, ANCHORS
  fy re-grid + header comment), realm-probe.mjs (G0 3→3.5; the close-hold
  and warp gates re-expressed to race-free live-state forms; the stale
  shallow-branch comment updated; the double-click fixture re-derivation).
- Verification:
  - Command: `npm run build` (portfolio/shell)
    Result: PASS — tsc --noEmit + vite build, exit 0.
  - Command: `CHROME_PATH=…Chromium node tests/realm-probe.mjs <outDir>`
    Result: PASS ×2 independent full-suite runs ("realm-probe: all checks
    passed"); two intermediate runs FAILED (the fixture staleness + the
    window-vs-layer dispatch) and were repaired — records kept above.
  - Command: `node ../probes/realm-anchor-shots.mjs` (dev server :5199)
    Result: PASS — door 00 (Quicknotes) framed at ~73% of the viewport in
    the balanced sky; the symmetric margin reads. Evidence:
    /var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/quicknotes-r001/realm-door-00.png.
- Final diff review: performed — probe assertion edits are limited to the
  two legitimately re-expressed laws (close-hold, warp sampling) + the
  fixture re-derivation; no assertions weakened (the numeric windows were
  coincidence proxies under the old shallow geometry; the new forms test
  the actual laws against live state).
- Design constraints: r13 mobile lift (G5 slack 12.9px), r13 light travel
  (G6, deep 0.5vh real), r13 close-no-retarget (now tested exactly), R001
  id-keyed geography, fx slots/order/hues untouched.
- Remaining risks/blockers: visual verdict = owner; the clamp-at-0 framing
  branch has no live door representative under the balanced law (the entry
  clamp is asserted by the r19 spawn gate) — suite-coverage note, accepted
  by the relay design.
- Next action: task complete on the code side.
