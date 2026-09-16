# Passes — fast-notes-app (greenfield)

## Pass N000 — VERIFIED (scope/baseline only)
- Objective and scope: establish the task before the first relay brief; no product code yet.
- Acceptance criteria (draft, v1 to own-code baseline):
  1. Google Sign-in via Firebase; the session survives page reloads; sign-out works.
  2. Notes are Markdown documents (Obsidian-flavoured rendering where cheap); fast editor with live preview and autosave.
  3. Virtual folders: a folder path on each note; sidebar tree to navigate/organise; create/rename/move.
  4. One-button download of all notes or one folder as a zip of `.md` files preserving the folder layout.
  5. Cross-device sync with offline persistence; fast cold start; data isolated per Firebase user.
  6. Seamless design: coherent typography, keyboard-first actions (instant search/command), dark UI as default.
  7. Firestore security rules + one-time Firebase console setup steps shipped with the app.
- Changes: none yet (scaffolding only: `quicknotes/.project-history/graph.jsonl` via CLI init, this ledger).
- Baseline: greenfield — no code, no checks runnable. No repository changes outside `quicknotes/`.
- Environmental limitations: no browser-automation tools available in this session (mcporter absent from PATH; no browser MCP tool), so runtime verification will be static checks (node --check, local static server) plus owner manual testing; real Google OAuth cannot be automated here.
- Design constraints: not applicable (no design ledger for this project).
- Remaining risks/blockers: Firebase authorized-domains config is owner-side and depends on the eventual hosting URL (localhost and *.web.app are pre-authorised).
- Next action: Brief 1 (design round) to the relay chat model; then code rounds.

## Pass N001 — VERIFIED (static scope; runtime pending owner test)
- Objective and scope: integrate the routed chat model's full v1 app (salvage) into `quicknotes/`, review and repair, verify everything checkable without a browser/real Google login.
- Acceptance criteria covered: file plan complete; all ES modules parse; markdown pipeline XSS-safe (probe-proven); store merge/path/filename logic correct (probe); zip writer produces archives that pass real `unzip -t` with UTF-8 names; every DOM selector resolves; all assets serve 200 from a static server; Firestore rules + one-time setup shipped.
- Changes: new — `index.html`, `css/style.css`, `js/{config,firebase,store,markdown,zip,app}.js`, `firestore.rules`, `README.md`. Repairs during integration: (1) Firestore persistent cache + multi-tab manager (v10 `getFirestore` is memory-only — offline queue would not exist); (2) `flushPush` dirty-flag race fixed via pre-await `updatedAt` snapshot; (3) path input normalizes on change/blur, not per keystroke (typing a trailing `/` was impossible); (4) `photoURL` HTML-escaped in the header; (5) persisted `view` whitelisted to edit/split/view; (6) `js/config.js` filled with the real `vasyapym-85a64` web config.
- Baseline: greenfield (see N000).
- Verification:
  - Command: `node --check` on 6 module copies (`*.mjs`) → all OK, exit 0.
  - Command: `node probe.mjs` (markdown/store/zip headless probe, 21 assertions) → ALL PASS, exit 0. First run had 5 FAILs — all five were probe-expectation defects (checkbox `disabled`, attribute order, underscore count), confirmed by dumping actual output; probe fixed, code unchanged.
  - Command: `unzip -t probe.zip` (built by `makeZip` in node) → "No errors detected", UTF-8 name + content round-trip correct.
  - Command: `python3 -m http.server` + curl sweep of 10 paths → all 200 (first attempt returned 000s — server startup race in the harness, not an app issue).
  - Command: selector cross-check app.js ↔ index.html → 21/21 present; 5 html-only ids are CSS structural containers.
- Final diff review: done — no secrets beyond the standard public Firebase web config; no debug scaffolding; relative paths only (any-base-path hostable); soft-delete + last-write-wins documented in README.
- Design constraints: not applicable (no design ledger).
- Remaining risks/blockers: real-browser runtime unverified here (no browser automation; Google OAuth can't be automated): auth popup flow, live Firestore sync, offline queue, zip download in a real browser, mobile layout — all owner-side. Popup may be blocked on some mobile browsers (no redirect fallback yet — candidate follow-up).
- Next action: owner manual test (sign-in, sync across reload/devices, download zip). Then polish round if anything fails.

## Pass N002 — VERIFIED (static scope; art integration)
- Objective and scope: integrate the relay chat model's SVG art family (4 pieces, tokyo-night line-art) into the app shell: brand mark, empty-state, empty-tree state, offline state, favicon.
- Acceptance criteria covered: art uses app-coherent tokens (accent #7aa2f7 exactly; #3b4261/#292e42 structural grays read on #0f1115); no JS regressions; page serves; HTML balanced.
- Changes: `index.html` (favicon data-URI from the mark, brand svg replaces glyph, empty-state now scratchpad + offline art pair with net-status toggle), `css/style.css` (brand/empty/tree-empty layout, body.offline art swap), `js/app.js` (renderTree empty branch with folder motif; body.offline toggle on boot/online/offline events).
- Baseline: pass N001 state (v1 integrated, static-verified).
- Verification:
  - Command: `node --check app2.mjs` (app.js copy) → OK, exit 0.
  - Command: python HTMLParser balance check on index.html → balanced, no leftovers.
  - Command: favicon data-URI decode + XML balance → valid svg.
  - Command: `python3 -m http.server` + curl `/` → 200.
  - NOT RUN: real-browser visual acceptance (art size/placement on phone + desktop) — owner-side look; belongs to design acceptance.
- Final diff review: done — bg rects stripped from art (transparent over app bg), colors not clashing with tokens, no new secrets.
- Design constraints: not applicable (no design ledger).
- Remaining risks/blockers: sync error thread still open (owner bisecting with simplified rules — outcome unreported); mobile drawer + folder ops round (N003) pending; visual acceptance owner-side.
- Next action: brief 3 (behavior: mobile drawer, folder create/rename/move, popup fallback) — needs current app.js verbatim as evidence round.

## Pass N003 — VERIFIED (static scope; art set swapped to B)
- Objective and scope: owner brought a second SVG family (same good relay, different round) and asked which is better. Verdict: set B — tile+hairline-frame device gives instant family coherence across all four pieces, motifs are more evocative (dog-ear + bracket tick, tabbed folder with accent seam + pull knob, nested offline arcs), authoring is cleaner (shared `<g>` attributes). One real defect: accent #7dcfff mismatches the app token #7aa2f7.
- Acceptance criteria covered: single coherent art family; accent matches app tokens exactly after re-tint; no regressions; favicon legible on light browser tab bars (tile bg kept in the data-URI).
- Changes: `index.html` (brand mark B, scratchpad B, offline B, favicon rebuilt from B mark with its tile), `js/app.js` (empty-tree folder motif → B folder), accent re-tint #7dcfff→#7aa2f7 everywhere; structural colors #16161e/#1f2335/#3b4261 kept verbatim as the art's internal contrast system.
- Baseline: pass N002 state (set A integrated).
- Verification:
  - Command: `node --check app3.mjs` → OK, exit 0.
  - Command: python HTMLParser balance on index.html → balanced.
  - Command: accent leftover scan → 0 × #7dcfff, 6 × #7aa2f7; favicon decode valid, tile bg kept.
  - Command: static server curl `/` → 200.
  - NOT RUN: visual acceptance owner-side (tile-on-dark look, favicon on light tab bar).
- Final diff review: done — nothing else touched; frame/canvas colors left verbatim deliberately (they are the family device, not drift).
- Design constraints: not applicable (no design ledger).
- Remaining risks/blockers: same as N002 (sync error thread open; mobile drawer + folder ops pending; owner visual acceptance pending).
- Next action: brief 3 on owner's go.

## Pass N004 — VERIFIED (static scope; behavior round integrated via salvage)
- Objective and scope: owner gambled the behavior round through the routing model with a named-style prompt (obsidian-mobile trio). Reply arrived as a generic framework-style library (Map-based, generic OAuth, li-based tree) — integrated by salvage, not compliance.
- Acceptance criteria covered: mobile drawer (hamburger/backdrop/Esc/note-click close); folder rename/move/delete with cascade; popup-blocked auth fallback; existing behaviors intact.
- Changes:
  - new `js/paths.js` — reply's paths module adapted (Map→Object.values; sets `_dirty`; collision + self-nest guards kept verbatim; reply's `deleteSubtree` dropped — owner semantics use move-to-root via `rewritePaths(p,"")`).
  - new `js/menu.js` — verbatim (self-contained context menu, a11y roles, keyboard nav, outside-click/scroll close).
  - new `js/drawer.js` — reply's drawer logic (swipe edge-open, drag-close with velocity, focus restore, inert) minus its own Escape handler (handled in app's global keydown to avoid double-close), targets our `#sidebar`.
  - new `js/tree-actions.js` — adapted to our details/summary tree: note-first hit resolution, root (`data-folder=""`) not renamable, note menu (Open/Move/Delete via existing soft-delete), folder menu (New Note/Rename/Move/Delete-to-root), long-press + drag&drop, `getNotes()` indirection (notes map is replaced on merge/sign-in — direct capture would go stale).
  - `js/firebase.js` — popup-blocked/unsupported → `signInWithRedirect` fallback; `getRedirectResult` surfaced at boot. Reply's generic OAuth module rejected (wrong auth stack).
  - `js/app.js` — drawer init, `data-folder`/`data-path`/`.label` spans in tree, `commit(ids)` → persist + per-id schedulePush, `softDeleteNote`, Esc closes drawer, note click closes drawer.
  - `index.html` + `css/style.css` — hamburger, backdrop, edge swipe zone, drawer styles (≤760px), `.ctx` menu re-tinted to tokens, rename input, drop-target highlight, reduced-motion guard.
- Baseline: pass N003 state.
- Verification:
  - Command: `node --check` on all 10 modules → OK, exit 0.
  - Command: `node paths-probe.mjs` (15 assertions on cascade semantics) → ALL PASS, exit 0. Two earlier FAILs were probe-fixture defects (colliding fixture n5, "other" wrongly expected as a folder) — confirmed against actual output; code unchanged.
  - Command: HTMLParser balance + element presence → balanced; hamburger/backdrop/edge present.
  - Command: static server curl ×7 paths → all 200 (one earlier run 404'd from the wrong workdir — harness artifact, retried correctly).
  - NOT RUN: real-browser runtime (drawer feel, long-press, drag&drop, redirect fallback on iOS) — owner-side.
- Final diff review: done — no orphaned code (deleteSubtree dropped, generic auth.js not shipped), menu/drawer re-tinted to tokens, no new deps.
- Design constraints: not applicable.
- Remaining risks/blockers: sync-error thread still unreported by owner; runtime UX untested owner-side; tree is flat-by-exact-path while allFolders derives ancestor chains — consistent enough for the menu checks, noted for a future nested-tree pass.
- Next action: owner runtime test; then either polish round or task close (+ Firebase rules thread resolution).
