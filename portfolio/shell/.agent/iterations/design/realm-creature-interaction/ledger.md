# Ledger — realm creature interaction (approach-then-greet + creature reimaginings)

Task: (1) every creature needs a distinct idle + on-click interaction animation
paired with a sound; (2) clicking a creature from afar must move the light to
the creature BEFORE the interaction animation + sound (door/legend clicks stay
put but still sound); (3) QuickNotes and Waste of Tokens creatures reimagined
with real personality (creative ideation delegated to the chat model).

Prior context: parity pass C001 (`.agent/iterations/code/realm-creature-parity/
passes.md`) gave quicknotes + practice-map bespoke creatures, voices, and
greetings — but the owner finds the greetings of QuickNotes, Waste of Tokens,
and Raft Cluster too subtle or absent, and the light never physically
approaches on a far click (greeting + sound fire at click time instead).

## Baseline B000 (current behaviour, from code + probe history)

- Scene click/tap on a creature (pick radius) → `openProjectPanel(id)`
  (RealmMode.tsx:200): parks the lantern (`setLanternHold(true)`), opens the
  panel, calls `scene.startGreeting(id)` + `audio.greeting(id)` immediately —
  greeting animation and sound fire at click time regardless of distance. The
  lantern never travels (framing pans the camera view only, realm-scene.ts:792).
- Legend door buttons (RealmMode.tsx:1674) share the same `openProjectPanel`
  path — same immediate greeting + sound, no approach.
- Proximity auto-greet exists for free-swimming arrival (interactR latch,
  realm-scene.ts:877-889) but is bypassed by the click path.
- Greeting prominence: planck/explosion/forest/kitty read well; quicknotes
  (rapid retype), practice-map (light sweep), raft-cluster (row morph) are too
  subtle per the owner.
- Visual baseline screenshots: pending (will capture for the creature-redesign
  round via the realm-shots harness; behaviour round verified by probe).

## Round R001
- Goal: approach-then-greet — a scene click on a far creature moves the light
  physically to it; greeting animation + sound + panel fire on arrival. Legend
  door clicks keep today's immediate open (sound on activation, no travel).
- Preserved preferences: doors/keyboard paths byte-identical; reduced motion
  keeps the immediate greet (accessibility law); door hues untouched.
- Changes: `realm-scene.ts` — autopilot approach (spring target = live creature
  pos), camera hold during travel, distance-only arrival check (dispatched
  post-tick), proximity-greet suppressed while travelling, cancellations
  (door/keyboard hold, thrust, warp, dive, leave, Esc-close), `beginApproach`/
  `cancelApproach` on the scene API, `onApproachArrive` option.
  `RealmMode.tsx` — `approachClick` scene-click entry (falls back to today's
  `openProjectPanel` for reduced motion / in-range / panel-already-open),
  `openImmediateRef` arrival routing, `closePanel` defensive cancel.
  Chat-model design round (full autonomy); orchestrator fixed two integration
  bugs found by trace + probe: (a) desktop keeps `ptrActive` after mouse
  release, so the model's `!ptrActive` autopilot gate never engaged — arrival
  is now distance-only and the creature target owns the spring during travel;
  (b) the pointer's world target recedes under the camera deadband — the
  camera now holds still while the light travels.
- Before: ledger baseline B000 (greeting + sound fired at click time, light
  parked by `setLanternHold`).
- After: artifacts/R001/1-arrived-panel.png (light at the quicknotes creature,
  wake trail visible, panel open on arrival), artifacts/R001/2-door-panel.png.
- Visual inspection: approach probe screenshot read — light at the creature,
  travel wake visible, label lit, sheet open right. Door-path screenshot
  unchanged from today.
- Code verification: `npm --prefix portfolio run typecheck` PASS; `npm run
  build` PASS; `tests/realm-probe.mjs` PASS (169 checks); dedicated
  `portfolio/probes/realm-approach-probe.mjs` 7/7 PASS (travel 733→73px, panel
  at 750ms not instant; door opens at ~104ms with zero travel).
- Open question: deferred panel timing (open on arrival, not at click) was a
  chat-model design decision — owner verdict wanted; alternative is immediate
  panel + travel underneath.

## Round R002
- Goal: creature reimaginings — QuickNotes and Waste of Tokens redesigned with
  real personality (idle + on-click animation + new voices), Raft Cluster's
  greeting made unmistakable. Owner-approved hybrid: output 1's ship-ready
  classes + output 2's raft election concept.
- Preserved preferences: door hues locked (color from this.hue only);
  reduced-motion static forms; door/keyboard paths byte-identical; approach
  law from R001 unchanged (greeting fires on arrival).
- Changes: `realm-creatures.ts` — QuicknotesCreature → NoteWebCreature
  (wiki-link web: nine note-motes on [[link]] filaments, capture spark sprints
  the graph; greeting = inhale → nine-spoke mandala bloom with spoke ignition
  + rim chase, handback blended onto the live idle pose) and LedgerCreature →
  TokenPyreCreature (token pyre: motes sink into a maw and burn, embers wind
  onto a turning spiral archive with a core-out heat gradient; greeting = maw
  swell + burn front core→tail + spark plume + cool-down). RaftCreature
  greeting → "Term N+1" election: leader dies one frame, followers race seeded
  countdowns, candidate flares, three vote beads (+ hard quorum rings, 2-frame
  whiteout on the 2nd), one-frame 72° term jump promotes the candidate
  permanently, three stepwise replication rounds, 60ms commit flash; all
  visuals stateless off greetTime; idle paths byte-equivalent; reduced-motion
  = held result diagram. `realm-audio.ts` — quicknotes 'tick' → 'jot'
  (keystroke triplet + [[link]] dyad), practice-map 'file' → 'ember' (furnace
  breath + burn crackles).
- Delegation: gamble round (randomized routing model, compressed spec) for the
  two creatures + voices; gamble deepening round (compressed evidence brief)
  for the raft election. Salvage repairs: field visibility private, comment
  idiom // style, budget comment reconciled.
- Before: artifacts/R002-baseline/ (faint note card, barely visible ledger
  wall, row-morph raft).
- After: artifacts/R002/{quicknotes,waste-of-tokens,raft-cluster}.png —
  quicknotes caught mid-greeting (mandala bloom legible); pyre spiral + maw
  with heat gradient; raft mid-election (dark old leader, flaring candidate
  with quorum rings, vote chord).
- Visual inspection: all three PNGs read. Greetings fire via the warp→
  proximity path, so the shots show the greet choreography, not idle.
- Code verification: `npm --prefix portfolio run typecheck` PASS; `npm run
  build` PASS; `tests/realm-probe.mjs` PASS — 169 checks after updating three
  tap fixtures to the arrival law (tap-select waits out the travel; r8 d2 and
  bug 7 panel waits 2500→9000ms; park check renamed "on arrival"). Pre-update
  run failed 3 checks — all old-law expectations (immediate panel/park at tap),
  no product bug.
- Open question: greeting intensity/taste = owner's verdict; audio not
  audibly verified (headless, muted).

## Feedback F001
- Round: R001, R002
- Verdict: LIKED
- Scope: the realm interaction + creature round as presented — approach-then-
  greet including the deferred (arrival) panel timing, wiki-link web, token
  pyre, Term N+1 election, and the three greeting choreographies
- Decision: approved as shipped; no changes requested
- User source: "it looks good" (owner, immediately after the R001+R002
  presentation)
- Artifact: artifacts/R002/{quicknotes,waste-of-tokens,raft-cluster}.png;
  artifacts/R001/1-arrived-panel.png
- Supersedes: none
- Note: the sound verdict is NOT covered — audio remains unverified by ear
  (headless synthesis); owner ear-check on a real device is the standing
  open item.

## Round R003
- Goal: quicknotes' greeting (the post-click mandala bloom) read a bit wide —
  owner asked for it ~20% smaller.
- Preserved preferences: F001 (R001+R002 approved as shipped — approach-then-
  greet law, wiki-link web idle, spoke ignition + rim chase choreography);
  reduced-motion forms untouched; door/keyboard paths untouched.
- Changes: `realm-creatures.ts` one constant — NoteWebCreature greet mandala
  rim `0.88 * r` → `0.70 * r` (line ~1034). Ignition, rim chase, hub burn,
  handback blend all derive from that pose, so nothing else moved. Small task
  — no chat-model relay (R002 precedent).
- Before: artifacts/R003/baseline/quicknotes.png · baseline-seq/greet-*.png
  (bloom ~440px across at 1440×900)
- After: artifacts/R003/after-seq/greet-*.png (bloom ~350px across, ≈0.80×)
- Visual inspection: Chromium headless 1440×900, warp→greet timing sequence
  (900/1700/2700ms) read as images — mandala legible, spokes tighter, hub
  burn + rim chase intact, no clipping into neighbours; idle before/after
  unchanged (greet-only constant).
- Code verification: `npm --prefix portfolio run typecheck` PASS; `npm run
  build` PASS; `tests/realm-probe.mjs` PASS (169 checks, CHROME_PATH set).
- Open question: owner verdict on the tighter bloom — still legible enough as
  a greeting?
