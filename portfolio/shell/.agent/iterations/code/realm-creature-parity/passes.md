# Passes — realm creature parity (Quicknotes + Waste of Tokens)

Relay task: redesign the two realm creatures that didn't reflect their projects
(quicknotes borrowed the forest fallback; practice-map was a generic
constellation) and give both the missing individual voices + greetings.

## Pass C001 — VERIFIED
- Objective and scope: quicknotes + practice-map get bespoke creature designs,
  idle behaviour, greeting choreography, and individual realm-audio voices.
- Acceptance criteria: no creature falls back to another species's look; both
  new classes follow the zero-allocation/reduced-motion discipline; typecheck,
  build, and the realm probe stay green.
- Changes: `portfolio/shell/src/shell/realm-creatures.ts` — MapCreature
  (constellation) removed; QuicknotesCreature (caret typing glyphs into a note
  card, sync heartbeat corner dot, greeting = rapid full retyping) and
  LedgerCreature (tiered occupancy wall, token fireflies file cells, oldest
  recycled when full, greeting = light sweep up the wall) added; factory ORDER
  extended with 'quicknotes'. `realm-audio.ts` — 'tick' (typewriter) and
  'file' (slotting blip) voice styles, specs for quicknotes + practice-map.
- Baseline: tsc/build/realm-probe green before the change (checked this session).
- Delegation: chat-model design round (full autonomy) — classes returned
  verbatim; orchestrator integrated, wired factory + audio.
- Verification:
  - Command: `npm --prefix portfolio run typecheck` → PASS
  - Command: `npm --prefix portfolio run build` → PASS (16–17s)
  - Command: `CHROME_PATH=… node portfolio/shell/tests/realm-probe.mjs` → PASS
    ("all checks passed", 169 PASS lines; screenshots in /tmp/realm-probe-r1b)
  - Manual/visual: warp screenshots /tmp/creature-shots/{quicknotes,waste-of-tokens}.png —
    note card + caret visible; ledger wall + fireflies visible; legend labels correct.
- Final diff review: classes placed in layer 3 before the Emitter; emitter cap
  comment de-7-ed; audio styles exhaustively switched (tsc would flag otherwise).
- Design constraints: not applicable (no active design ledger for the realm
  creature layer; owner request is the constraint source).
- Remaining risks: visual taste = owner's verdict; audio not audibly verified
  (headless, muted) — synthesized from existing voice primitives.
- Next action: pass complete; hue/loading pass follows.

## Pass C002 — VERIFIED
- Objective and scope: spine + raft-cluster realm door hues match their card
  illustrations (red family); Spine page shows a boot indicator during the
  wasm load instead of an empty sheet.
- Acceptance criteria: DOOR_HUES updated; boot overlay visible while the wasm
  fetch is delayed, gone the instant `spineReady` flips; SPA re-entry never
  flashes it; reduced-motion path stays static; typecheck/build/probe green.
- Changes: `RealmMode.tsx` DOOR_HUES — raft-cluster `#86aed4`→`#ff6a5f` (raw
  card coral), spine `#9fb0bd`→`#c56b52` (card ink `#a6533e` lifted for label
  legibility, per relay decision). `portfolio/projects/spine/web/SpinePage.tsx`
  — `booting` state seeded from `window.spineReady`, rAF watcher, overlay JSX
  inside `.spine-workspace` (panes stay mounted; engine binds by id).
  `spine.css` — `.spine-boot*` ink-only overlay block (no ochre: ochre = live;
  the engine isn't), reduced-motion static-rule fallback.
- Baseline: C001 green state; overlay absent (no indicator existed).
- Delegation: chat-model design round (full autonomy) — indicator design + hue
  values chosen by the model; orchestrator integrated into the real markup
  (div #spine-canvas, existing `.spine-workspace{position:relative}` reused,
  CSS appended after the global reduced-motion kill-switch).
- Verification:
  - Command: `npm --prefix portfolio run typecheck` → PASS
  - Command: `npm --prefix portfolio run build` → PASS
  - Command: `CHROME_PATH=… node tests/realm-probe.mjs` → PASS (all checks
    passed, both runs incl. hue change)
  - Manual/visual: network-throttled wasm probe — overlay visible while
    delayed (`spine-boot-visible.png`), gone after boot; natural boot probe —
    no flash, engine renders (`spine-ready.png`); realm warp shots — spine
    creature/label now terracotta red, raft coral (`realm-spine.png`,
    `realm-raft.png`).
- Final diff review: fallback hue `#9fb0bd` kept as the neutral fallback
  (deliberate); no ochre introduced during boot per DATUM law.
- Design constraints: not applicable.
- Remaining risks: spine↔explosion hue proximity (~7°) flagged by the relay —
  separable by saturation/brightness; owner visual verdict pending.
- Next action: README drafting brief follows.

