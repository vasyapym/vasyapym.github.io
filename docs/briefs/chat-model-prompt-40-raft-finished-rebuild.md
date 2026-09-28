# Round — raft-cluster finished-quality redesign (raft ledger R001), minimize-iteration2 relay S25

## Active variant

S25 v6 — telegraph, bulk-vocabulary purged (owner steer) (owner steer): scope re-voiced as one considered pass with tight decisions; bulk-work phrases stripped; 'concise/economical/compact' attached only to rationale/notes/palette/type scale; code described as complete files. v4's facts unchanged.

## Paste this

```text
[v3 archived below - telegraph with caps headings, 315w]
comprehensive code - the Raft Cluster live page settled into its finished state in one considered pass: `web/RaftPage.tsx` + `web/raft.css` as complete files, depth yours.

## WIRING (fixed)
`loadRaftCore(): Promise<RaftCore>`; `new ClusterSim(core, 3|5|7, seed)`; methods `advance(ms, speed)` `crash(id)` `recover(id)` `toggleLink(a,b)` `propose(u8): boolean` `snapshot()` `dispose()`. Node: `{id, alive, role follower|candidate|leader, term, leaderId, commitIndex, lastApplied, logTerms[], committedTerms[]}`; inflight `{from, to, kind rv|rvr|ae|aer, sentAt, deliverAt}`; `cuts[]` ("1-3"), `leaderId|null`, `events[]` `{tMs, kind, text}` (text fixed upstream). Engine: rAF gated on visible+onscreen+unpaused, dpr backing scale, palette re-read per frame from DOM custom properties (canvas can't use var()), click hit-test = drawn geometry.

## BAR
Hiring manager reads term, leader, votes, replication, commit index at a glance; one cohesive minimal warm-ink system (IBM Plex Sans/Mono, bg #0b1317, text #eeeae0, hairlines, quiet panels, ochre #d39b61 accent); depth per region yours — keep what holds, clean-sheet what fails; current renders show: idle floating canvas, gray log stubs with random per-term hues, directionless 3px dots, admin-form column with permanent "Disabled —", five same-weight boxes, duplicated speed, seed hex noise. Discard noise.

## RAILS
One meaning per colour axis (roles / messages / log states / danger), declared in notes; teal banned. Text ≥4.5:1 (48% tints only large), focus-visible everywhere incl. canvas picking, coarse inputs 16px, tabular numerals, reduced-motion = static-legible. No gradients/glass/libs/fonts/assets; no edits to cluster.ts/raft-core.ts/core. States designed: rest, paused, crashed node, cut link, majority-unreachable (derive leader reachability from cuts), election in progress, propose states, selected, link-pending, empty feed, whole-page wasm error. Frozen: h1 "A full Raft state machine written in Rust." tracks left, controls right; gutters `max(36px, calc((100% - 1200px) / 2))`, 16px ≤560; Raft-paper terms; no tagline copy.

## OUTPUT CONTRACT
challenge assumptions and failure cases before answering; rationale = the why lines. reply: exactly 3 blocks - 1) complete RaftPage.tsx 2) complete raft.css 3) ≤8 bullet notes: colour→meaning map, kept/renamed class hooks (.raft-field/.raft-canvas/.raft-mono), probe button strings per state - nothing else.
```
```

## Shelved variants (unrelayed)

### v4 — honest-intent prose (402w)

```text

```

### v3 — telegraph with caps headings (315w)

```text
[v3 archived below - telegraph with caps headings, 315w]
comprehensive code - full rebuild of the Raft Cluster live page to portfolio-finished quality: `web/RaftPage.tsx` + `web/raft.css`, replaced wholesale, one pass, depth yours.

## WIRING (fixed)
`loadRaftCore(): Promise<RaftCore>`; `new ClusterSim(core, 3|5|7, seed)`; methods `advance(ms, speed)` `crash(id)` `recover(id)` `toggleLink(a,b)` `propose(u8): boolean` `snapshot()` `dispose()`. Node: `{id, alive, role follower|candidate|leader, term, leaderId, commitIndex, lastApplied, logTerms[], committedTerms[]}`; inflight `{from, to, kind rv|rvr|ae|aer, sentAt, deliverAt}`; `cuts[]` ("1-3"), `leaderId|null`, `events[]` `{tMs, kind, text}` (text fixed upstream). Engine: rAF gated on visible+onscreen+unpaused, dpr backing scale, palette re-read per frame from DOM custom properties (canvas can't use var()), click hit-test = drawn geometry.

## BAR
Hiring manager reads term, leader, votes, replication, commit index at a glance; one cohesive minimal warm-ink system (IBM Plex Sans/Mono, bg #0b1317, text #eeeae0, hairlines, quiet panels, ochre #d39b61 accent); depth per region yours — keep what holds, clean-sheet what fails; current renders show: idle floating canvas, gray log stubs with random per-term hues, directionless 3px dots, admin-form column with permanent "Disabled —", five same-weight boxes, duplicated speed, seed hex noise. Discard noise.

## RAILS
One meaning per colour axis (roles / messages / log states / danger), declared in notes; teal banned. Text ≥4.5:1 (48% tints only large), focus-visible everywhere incl. canvas picking, coarse inputs 16px, tabular numerals, reduced-motion = static-legible. No gradients/glass/libs/fonts/assets; no edits to cluster.ts/raft-core.ts/core. States designed: rest, paused, crashed node, cut link, majority-unreachable (derive leader reachability from cuts), election in progress, propose states, selected, link-pending, empty feed, whole-page wasm error. Frozen: h1 "A full Raft state machine written in Rust." tracks left, controls right; gutters `max(36px, calc((100% - 1200px) / 2))`, 16px ≤560; Raft-paper terms; no tagline copy.

## OUTPUT CONTRACT
challenge assumptions and failure cases before answering; rationale = the why lines. reply: exactly 3 blocks - 1) full replacement RaftPage.tsx 2) full replacement raft.css 3) ≤8 bullet notes: colour→meaning map, kept/renamed class hooks (.raft-field/.raft-canvas/.raft-mono), probe button strings per state - nothing else.
```

```
