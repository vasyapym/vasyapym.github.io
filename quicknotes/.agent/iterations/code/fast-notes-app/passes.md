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

## Pass N006 — VERIFIED (static scope; auth hardening)
- Objective and scope: owner reported sign-in failing sometimes/browser-dependent — popup blockers. Harden the popup→redirect chain and stop hiding redirect failures.
- Acceptance criteria covered: fallback now covers the full popup-fatality set (popup-blocked, popup-failed-to-open, operation-not-supported-in-this-environment, cancelled-popup-request); popup-closed-by-user stays a silent no-op (user intent); unauthorized-domain (both flows) explains the exact console fix; boot-time getRedirectResult failures alert once instead of console.warn-only.
- Changes: `js/firebase.js` (POPUP_FALLBACK_CODES set, login() branching, getRedirectResult catch → user-facing alerts for known codes).
- Baseline: N005 state.
- Verification:
  - Command: `node --check firebase.mjs` → OK.
  - NOT RUN: real popup-blocked behavior across Brave/Firefox ETP/iOS — owner-side (can't automate OAuth popups here).
- Final diff review: done — fallback set is additive; no behavior change when popups work.
- Design constraints: not applicable.
- Remaining risks/blockers: if the owner's actual failure was unauthorized-domain (github.io not yet in authorized domains), the fix is console-side, not code-side — pass N004 instructions cover it.
- Next action: owner re-test sign-in on the failing browser; report which case it was.

## Pass N007 — VERIFIED (static scope; Safari iframe sign-in)
- Objective and scope: owner reported sign-in fixed on Windows Edge but still failing on macOS Safari. Leading hypothesis: the test happened in the catalogue card (iframe) — Safari suppresses popups from frames, and a redirect would navigate the frame to Google, which refuses framing.
- Acceptance criteria covered: in-iframe sign-in hands off to a top-level tab (same origin, session shared via storage); web-storage-unsupported joins the popup-fallback codes (private mode / strict ITP); popup-closed-by-user still silent.
- Changes: `js/firebase.js` (iframe top-tab handoff in login(), POPUP_FALLBACK_CODES + web-storage-unsupported).
- Baseline: N006 state.
- Verification:
  - Command: `node --check firebase.mjs` → OK.
  - NOT RUN: real macOS Safari test (card + standalone URL, regular + private window) — owner-side.
- Final diff review: done — in-iframe path bypasses Firebase entirely (no popup attempt in frames); the alert explains the handoff.
- Design constraints: not applicable.
- Remaining risks/blockers: if the owner's Safari failure was in the standalone URL (not the card), the iframe hypothesis is wrong — need the alert text / console line to classify (popup-blocked vs unauthorized-domain vs web-storage-unsupported vs private-mode IndexedDB).
- Next action: owner re-test on macOS Safari in BOTH contexts (standalone URL, catalogue card); report exact behavior.

## Pass N008 — VERIFIED (static scope; runtime pending owner test)
- Objective and scope: two features in one relay round — (1) note sorting (date created / date last edited / alphabetical) with persistence; (2) mobile responsiveness for iOS Safari. Relay brief enforced a 6-phase reasoning format (restate → decision log → edit plan → full files → self-review → risks) with full design autonomy granted to the chat model; reply arrived truncated mid-file (timeout) and the app.js tail (online/offline handlers + boot section) was completed by the orchestrator per the reply's own edit plan.
- Acceptance criteria covered: three persisted sort modes (localStorage `sort`, default `updated`), applied within folder groups via sort-then-group; native `<select>` sort control usable by touch + keyboard; `100dvh` with `100vh` fallback; `viewport-fit=cover` + safe-area insets (top/left/right header, left/bottom drawer, bottom footer/editor/preview); focus-zoom neutralised via `@media (hover:none) and (pointer:coarse)` 16px rule; dialogs fit 320px (`min-width:0;width:min(94vw,480px)` in mobile query only); ≥40px touch targets on mobile; meta row reflows (path drops to its own row); touch-reachable Write⇄Preview `#view-toggle` (mobile only, binary because split collapses to editor on phones); footer cheat-sheet hidden on mobile, count kept; search placeholder swapped to "Search" on narrow viewports via matchMedia; palette keeps recency ordering (explicit decision); desktop (>760px) unchanged except the sort row.
- Changes: `index.html` (viewport-fit=cover; `.side-sort` + `#sort` select; `#view-toggle` in meta; `.shortcuts` span class); `css/style.css` (dvh, safe areas, touch targets, meta reflow, dialog sizing, footer/footer-hide, coarse-pointer 16px block, `.side-sort`/`#sort`/`#view-toggle` styles); `js/app.js` (el map + sort/viewToggle; SORTS set + persisted `state.sort`; `cmpNotes()` with Intl.Collator base/numeric, empty title → "Untitled", tie → updatedAt desc; renderEditor sets toggle label; `el.sort.onchange` persists + renderTree; `toggleMobileView` binary Write⇄Preview; boot syncs select value + matchMedia placeholder swap — orchestrator-written tail). Other modules untouched.
- Baseline: N007 state (v1 + drawer/folder ops + auth hardening, static-verified).
- Verification:
  - Command: `node --check` app.mjs/store.mjs copies → OK, exit 0.
  - Command: `node sort-probe.mjs` (5 assertions: updated desc, created desc, title case-insensitive + natural numeric + empty→Untitled placement + tie-break, sort-then-group per-folder order) → ALL PASS. Two earlier FAILs were probe-expectation defects (expected "Untitled" first although base-insensitive collation orders U after n; listed runtime class `.side-sort` as id) — confirmed against actual output; code unchanged.
  - Command: python HTMLParser balance + id/class cross-check → balanced, no dup ids, all 30 el-map/contract ids present, `.side-sort`/`.shortcuts`/`viewport-fit=cover` present, runtime hooks (folder/note-item/tree-empty/panes/ctx emitters) verified in js sources.
  - Command: CSS marker check (12/12: dvh, coarse-pointer block, dialog fit, safe areas ×3, 40px targets, view-toggle both states, shortcuts hide, both media queries) + braces balanced → PASS.
  - Command: static server curl sweep ×12 paths → all 200 (first sweep 000s — known server-startup race in the harness, retried with readiness probe).
  - NOT RUN: real iOS Safari (dvh URL-bar behavior, focus-zoom, safe areas, native select picker, drawer feel, keyboard-overlap editing) — owner-side; visual acceptance belongs to design-iteration.
- Final diff review: done — 3 product files + this ledger only; no debug scaffolding, no secrets, no unrelated churn; all keyboard shortcuts, sync flow, drawer/tree-actions/menu DOM contracts preserved.
- Design constraints: not applicable (no design ledger).
- Remaining risks/blockers: `dvh`/`viewport-fit`/coarse-pointer fixes are static-verified only until owner tests on iPhone; `#view-toggle` binary toggle assumes split-is-never-useful-on-phones (matches CSS collapse); sort select adds one row of sidebar height on desktop (the one sanctioned desktop change).
- Next action: owner iPhone test (sorting + Safari quirks from Risks list); then task close or polish round.

## Pass N009 — VERIFIED (static scope) / PARTIALLY FIXED overall (device checks pending owner)
- Objective and scope: owner iOS feedback round via relay (same 6-phase deep-reasoning + autonomy format; reply complete, only trailing prose cut — owner checklist completed by orchestrator). Symptoms: (1a) signed-out sync label crowds search; (1b) signed-in header wraps to two rows; (2) 👁 on Preview button; (3a) palette last item unreachable behind keyboard; (3b) focus-zoom reported on spine/raft value fields; (3c) compact keyboard in iframe.
- Evidence map (from relay, verified by integrator): 1a/1b/2/3a root causes Confirmed in code (`setSync("local (signed out)")` + `flex-wrap` header min-content; `#palette{top:12vh}` + `#pal-list{max-height:50vh}` are layout-viewport-based and ignore the keyboard-shrunk visualViewport). 3b: quicknotes coverage Confirmed complete (7/7 fields hit the coarse 16px rule); spine (`spine.css:816`, R007) and raft (`raft.css:215`, R005) already ship the fix AND the live deploy (chunk `SpinePage-y_ofCuV3.css`, commit 8b3064d, 10:28Z) contains it — the zoom report almost certainly predates today's deploy; re-test only, no spine/raft code change authorized or made. 3c: Assumed WebKit iframe behavior; no reliable in-code fix; diagnostic checklist instead.
- Acceptance criteria covered: single-row mobile header in both auth states (brand + user name hidden on mobile only; signed-out status hidden via `body.signed-out`, signed-in "synced" kept); desktop header unchanged; Preview label emoji-free ("Preview"/"Edit" — ✎ dropped too for symmetry, documented); palette fits above the keyboard via `visualViewport`-driven `fitPalette()` (gated ≤760px, inline styles cleared on close, vv resize/scroll listeners) with `60dvh` CSS fallback; zoom guard unchanged (coverage audited 7/7).
- Changes: `index.html` (👁 removed from `#view-toggle`), `css/style.css` (mobile-only: `.brand`/`#user` hidden, `body.signed-out #sync` hidden, `#pal-list` 60dvh fallback cap), `js/app.js` (`narrow` matchMedia hoisted as single mobile source of truth; `switchUser` toggles `body.signed-out`; renderEditor labels "Edit"/"Preview"; `fitPalette()` + wiring in openPalette/palette-close/vv listeners). Other modules untouched; spine/raft untouched.
- Baseline: N008 state (commit 6d159de). Fail-before gate evidence on HEAD: 👁 ×1 in index.html, ✎ ×1 in app.js, `signed-out` ×0 (app+css), `fitPalette`/`visualViewport` ×0.
- Verification:
  - Gate G1 (emoji labels) — Command: `grep -c '👁' index.html` + `grep -c '✎' app.js` → 0 and 0 after (1 and 1 before); `>Preview<` present. PASS.
  - Gate G2 (signed-out hook) — Command: `grep -c signed-out` app.js/css → 2/2 after (0/0 before); hide rules at css lines 120–122, confirmed INSIDE the max-width:760px block (awk block scan = 1, index > media-query index). PASS.
  - Gate G3 (palette fit) — Command: `grep -c fitPalette|visualViewport` → 4/4 after (0/0 before); node --check app.mjs copy → OK, exit 0. PASS.
  - Command: python HTMLParser balance + 31-id contract cross-check + classes → PASS.
  - Command: CSS brace balance + 4 new markers + scoping check → PASS.
  - Command: static server curl `/`, css, app.js → 200 ×3.
  - NOT RUN (device-bound, owner-side): pixel-level absence of header overlap/wrap; visualViewport keyboard-shrink behavior on target iOS; last-item reachability above the keyboard; compact-keyboard diagnosis.
- Final diff review: done — 3 product files + this ledger; +46/−4; no debug scaffolding, no secrets, no spine/raft/shell churn; DOM contract and all shortcuts intact; desktop scoping verified mechanically.
- Design constraints: not applicable (no design ledger).
- Remaining risks/blockers: (a) unconfigured+signed-out hides the "local only — set js/config.js" error on mobile (accepted; desktop still shows it); (b) fitPalette heuristic (`h - inputH - pad*3`, floor 120px) may need tuning on device; (c) 3c compact keyboard is WebKit-internal — only diagnosis possible.
- Owner device checklist (iPhone, iOS Safari):
  1. Signed out, ≤760px: header is one row (☰ + search + Sign in), no "local (signed out)" text.
  2. Signed in: one row (☰ + search + synced + Sign out); no "notes" title/icon/name.
  3. Desktop >760px: brand + user name still visible; nothing else changed.
  4. Preview toggle label reads "Preview"/"Edit", no emoji.
  5. Palette with ~15 notes: open, scroll to bottom — last item reachable above keyboard; dismiss/reshow keyboard → list refits.
  6. Tap each field (search/title/path/body/sort/palette input): no page zoom anywhere.
  7. Spine + Raft: hard-reload catalogue pages, tap value fields — expect NO zoom (fix already deployed; this validates the stale-report hypothesis).
  8. Compact keyboard: compare standalone `/quicknotes/` vs catalogue card iframe; report iOS version + which context shows the compact keyboard (diagnosis for a possible WebKit bug report; no code fix attempted).
- Next action: owner runs checklist items 1–8; outcomes decide task close vs polish round (item 7 outcome also closes the spine/raft zoom thread).

## Pass N010 — VERIFIED (static scope) / device checks pending owner
- Objective and scope: owner's post-N009 iOS feedback — (1) tap-shift micro-pan on field/text taps, (2) "two-level" scrolling, (3) sync indicator to top-right + compact search. Relay reply arrived complete through Phase 4 (evidence map with a shared-mechanism chain, decisions D1–D5) and truncated mid-Phase-5 (index.html sidebar); missing file portions reconstructed deterministically by the orchestrator from the model's own D1–D5 + edit plan onto the N009 baseline, per the brief's truncation protocol (no TRUNCATED-AFTER marker — paste cut).
- Diagnosis (from relay, accepted): the three symptoms are ONE causal chain — bare `.focus()` reveal-scroll (12 call sites, zero preventScroll) + keyboard-open visual-viewport pan (dvh excludes keyboard; editor had no fitPalette equivalent) + scroll chaining (no overscroll-behavior anywhere; 4 nested scrollers) + unclamped page (no overflow on html/body). Header: `#search{flex:1}` grabbed all width, `#sync` squeezed before Sign Out.
- Acceptance criteria covered: all programmatic focus via `focusEl()` with `{preventScroll:true}` (audit: raw `.focus(` = definition only, 12→12 routed); app grid sized to `visualViewport.height` on mobile via `--app-h` (`fitViewport()`, vv resize/scroll + narrow-change + boot, removeProperty on desktop, CSS fallback `var(--app-h,100dvh)`); `overscroll-behavior:none` on html/body + `contain` on all 4 nested scrollers (#tree/#body/.preview/#pal-list) + `overflow:hidden` page clamp; viewport meta + `interactive-widget=resizes-content` (progressive, Chrome-only — iOS path is JS); search capped `max-width:480px` (mobile `width:min(44vw,260px)`, no grow); `#sync{margin-left:auto}` right zone (desktop too — sanctioned by the request), signed-out mobile fallback `body.signed-out #auth-btn{margin-left:auto}`.
- Changes: `index.html` (meta only), `css/style.css` (page clamp, 4×contain, search cap, sync right zone, mobile --app-h + compact search + auth fallback), `js/app.js` (focusEl routing ×12, fitViewport + wiring).
- Baseline: N009 state (fbd0aa7). Fail-before gates on HEAD: preventScroll ×0, overscroll-behavior ×0, --app-h ×0, interactive-widget ×0, max-width:480px ×0, margin-left:auto ×0, raw `.focus(` ×12.
- Verification:
  - Gate G4 (focus routing) — `grep -c '\.focus('` → 2 after (definition + one comment mention; 0 bare call sites), preventScroll ×2; focusEl ×13 (12 call sites + definition). PASS.
  - Gate G5 (chaining) — overscroll tokens ×6 (none ×1 on html/body + contain ×4 + comment) vs 0 before. PASS.
  - Gate G6 (--app-h) — css ×2, js ×2 (write + removeProperty + wiring + comment); scoping: var(--app-h)/compact-search/auth-fallback confirmed INSIDE the 760px block. PASS.
  - Gate G7/G8 (meta/header) — interactive-widget ×1 (was 0), max-width:480px ×1, #sync auto-margin ×1, contain 4/4. PASS.
  - Command: `node --check` app copy → OK; HTMLParser balance + 31-id contract + meta check → PASS; CSS braces balanced + 7 markers → PASS; static server curl 3×200.
  - NOT RUN (device-bound, owner-side): absence of the micro-pan on real taps; keyboard-open behavior with --app-h (caret visibility without pan); end-of-scroll chaining feel; right-zone aesthetics at 320/390px.
- Final diff review: done — 3 product files (+64/−21) + this ledger; no debug scaffolding/secrets; N009 features intact (single-row header, palette fit, labels, targets, zoom guard, safe-areas); sync text updates preserved (setSync untouched, indicator relocated only).
- Design constraints: not applicable.
- Remaining risks/blockers: (a) `focus({preventScroll})` requires Safari 15.4+ — older iOS silently keeps the old behavior (no breakage); (b) --app-h uses vv.height which on some iOS versions briefly reports stale values during keyboard animation (owner to judge smoothness); (c) desktop header changes (search cap + right-anchored sync) are global by design — flag to owner in case desktop look needs a separate pass; (d) overflow:hidden on html/body assumes the grid never legitimately needs page scroll (true for current layout; revisit if content modes grow).
- Owner device checklist (iPhone, iOS Safari):
  1. Tap a note in the tree → editor opens with NO screen nudge.
  2. Tap title/path/body while keyboard closed → no shift; keyboard opens, caret visible, page does not slide.
  3. Scroll body to the very end and keep dragging → page must not move (no chain); same in tree and preview.
  4. Scroll tree, tap a note, scroll again → single consistent context (no "level switch").
  5. Header: "synced" sits at the right zone before Sign out; search is compact; sync text still updates on edits (syncing…→synced).
  6. Signed out: Sign in button right-aligned, no "local (…)" label.
  7. Palette regression: last item reachable above keyboard (N009 item 5).
  8. Desktop: search capped at 480px, sync+name+Sign in right-anchored — confirm acceptable (global change) or request a desktop-scoped follow-up.
- Next action: owner runs checklist 1–8; item 8 verdict decides whether the header change needs a desktop-scoped adjustment round.

## Pass N011 — VERIFIED (static scope) / device checks pending owner
- Objective and scope: owner's third iOS round — (1) ✕ wraps to its own row in preview mode only; (2) editor + folder fonts too large on iOS; (3) last list element unreachable, scrolling "engages" only after the header leaves the screen; (4a) keyboard/viewport shrink request; (4b) black band left after keyboard dismiss. Relay reply complete through Phase 4 + full index.html/style.css + app.js cut mid-`pinViewport()`; tail (pinViewport body, onViewport consolidation, boot) reconstructed deterministically from the model's own D6 (single handler pin→fit→fitPalette) + N010 boot.
- Diagnosis (relay, accepted by integrator): owner's header-CSS hypothesis REJECTED with evidence — header is grid row 1, not fixed/sticky. Real causes: (a) NO `text-size-adjust` anywhere → Mobile Safari block-inflation inflated `#body` (16px coarse), `.folder>summary` (12px) and the toggle label — root of symptoms 2 AND the mode-dependent ✕ wrap (symptom 1); (b) `#title{flex:1 1 auto}` content-basis + input's implicit `min-width:auto` made meta row 1 fragile; (c) `fitViewport()` sized the grid to `vv.height` but never compensated `vv.offsetTop` — a panned visual viewport pushes the header above the visible box and the last row behind it (symptom 3), and on dismiss a stuck pan shows the dark layout-viewport background below the app (symptom 4b). Interplay with `fitPalette` explicitly reconciled: after the pin drives `offsetTop→0`, fitPalette's `top` term settles to `pad`; single handler runs pin FIRST so reads are settled (D6).
- Acceptance criteria covered: `-webkit-text-size-adjust:100%;text-size-adjust:100%` on html/body (boost killed; 16px zoom floor untouched); mobile `#title` → `flex:1 1 0;min-width:0` (✕ can never wrap in either mode); mobile `#body` line-height 1.6→1.5 (honest "smaller" without breaking the floor); `pinViewport()` (`window.scrollTo(0,0)` when `vv.offsetTop>0`) consolidated with fitViewport+fitPalette into one `onViewport()` on vv resize/scroll + narrow change + boot (replaces 4 separate listeners with 2); `enterkeyhint` ×4 (search/next/done/go) as the honest 4a micro-improvement — OS keyboard height documented as not controllable.
- Changes: `index.html` (enterkeyhint ×4), `css/style.css` (text-size-adjust, mobile title zero-basis, mobile body line-height), `js/app.js` (pinViewport + onViewport consolidation + boot via onViewport).
- Baseline: N010 state (d3eb22f). Fail-before gates on HEAD: text-size-adjust ×0, scrollTo ×0, `flex:1 1 0` ×0, enterkeyhint ×0, mobile line-height ×0.
- Verification:
  - Gate G9 (boost off) — `text-size-adjust:100%` ×2 (webkit + std) after ×0 before. PASS.
  - Gate G10 (pin) — `window.scrollTo(0, 0)` ×1, pinViewport ×3 (def + comment + call in onViewport), onViewport ×7; vv listener adds = 2 (was 4 in N010 — consolidation confirmed). PASS.
  - Gate G11 (meta row) — `#title{flex:1 1 0;min-width:0` ×1, inside the 760px block. PASS.
  - Gate G12 (enterkeyhint) — ×4, one per field. PASS.
  - Gate G13 (line-height) — mobile `#body` 1.5 ×1 (base 1.6 intact for desktop). PASS.
  - Command: `node --check` app copy → OK; HTMLParser balance + 31-id contract + enterkeyhint count → PASS; CSS braces + scoping + zoom-floor intact → PASS; static server curl 3×200.
  - NOT RUN (device-bound, owner-side): boost absence visually, ✕ non-wrap in preview mode, last-element reachability with header on screen, black-band clearance after dismiss, enterkeyhint key labels.
- Final diff review: done — 3 product files (+54/−18) + this ledger; N009/N010 regressions guarded (focusEl ×13 with 0 bare call sites, palette fit intact and now ordered after pin, single-row header + right zone + 40px targets + safe-areas untouched); no secrets/scaffolding.
- Design constraints: not applicable.
- Remaining risks/blockers: (a) pin fights iOS only when the pan exceeds one frame — if band/offset reappears intermittently, next lever is rAF-debounced pin; (b) symptom 1's boost mechanism is Inferred (H1) — if ✕ still wraps with boosting dead, suspect `#view-toggle` white-space wrapping next; (c) 4a: residual keyboard height is OS chrome, not fixable in-page.
- Owner device checklist (iPhone, iOS Safari):
  1. Preview mode: ✕ stays on the meta row 1 (both toggle labels).
  2. Editor text and folder names render at authored sizes (16px editor / 12px folder caps), visibly denser than before.
  3. Tree/body: scroll to the very last element with the header visible — reachable.
  4. Tap into body, let keyboard open, type, dismiss — no black band below the app; header stays visible the whole time.
  5. Keyboard key area (Return key) now hints search/next/done/go per field (4a: OS keyboard height itself unchanged — that is Safari chrome).
  6. Regression sweep: palette last item reachable; note taps don't shift the screen; desktop header/layout unchanged.
- Next action: owner runs checklist 1–6; intermittent band/offset → pass N012 with rAF-debounced pin.
