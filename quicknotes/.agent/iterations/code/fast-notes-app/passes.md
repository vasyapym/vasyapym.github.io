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

## OWNER VERDICT (device) — N009–N011 iOS outcome: FAILED
- Owner reports after device testing: "nothing is fixed for iOS Safari" — the N009–N011 symptom set (scroll feel, keyboard band, font sizes, meta row) shows no observable improvement on the real device. Owner will take the iOS pass personally in the next iteration.
- Delivery ruled out as the cause (integrator, this session): live https://vasyapym.github.io/quicknotes/ serves ALL N011 changes (enterkeyhint ×4, text-size-adjust ×2, pinViewport ×3 in app.js; last-modified 2026-09-18 13:02:32 GMT, cache-control max-age=600). The owner tested current code.
- Consequence for the ledger: the static-verified hypotheses H1–H3 (Safari font boosting; meta-row flex fragility; stuck visual-viewport offsetTop pan) did NOT translate into device-visible improvement — either the mechanisms are wrong for this context (iframe host? actual iOS version?) or secondary drivers dominate. Their code changes remain in place (harmless, plausibly correct on desktop), but must NOT be counted as fixes.
- Evidence gap to close next iteration (owner-led): on-device instrumentation before more code — remote Web Inspector (Mac → Safari → Develop → iPhone) to read computed font sizes (is boosting real?), visualViewport.height/offsetTop/scale during keyboard open/close, and which scroller actually pans. Compare standalone /quicknotes/ vs catalogue iframe. The earlier "compact keyboard in iframe" observation (N009) suggests the iframe context itself may be the dominating factor — test standalone first.
- Status of the iOS thread: NOT FIXED, ownership moved to the owner for the next iteration. No further code changes from this agent until new on-device evidence arrives.

## Pass N012 — VERIFIED (static scope; owner-directed font change)
- Objective and scope: owner device follow-up on N009–N011 — CONFIRMED FIXED on device: ✕ meta-row wrap (N011 zero-basis title) and keyboard behavior (N011 pin + enterkeyhint). Remaining owner request, implemented here: mobile text ~20% smaller — editor, search bar, folder-name bar — with focus-zoom regression EXPLICITLY ACCEPTED by the owner ("even if there's a regression with zooming in"). The scroll/last-element symptom is UNCHANGED and moves to a two-phase plan: (1) short brief to a different relay chat model, (2) self-implemented pass with WebKit screenshot verification (handoff written).
- Changes: `css/style.css` only — coarse-pointer block: `#search,#body` 16→13px (floor kept for `#path` and other fields); mobile query: `.folder>summary` font-size 12→10px (padding rule extended). Desktop untouched.
- Baseline: N011 + owner verdict (438fd42). Fail-before: font-size:13px ×0, font-size:10px ×0 → after ×1/×1.
- Verification: scoped-block check (path floor 16px, 13px pair, braces), summary rule inside mobile query, static server 200. First "coarse block wrong" FAIL was a defective probe slice (cut at the rule's own closing brace) — re-measured correctly, code unchanged. NOT RUN: device zoom behavior (accepted regression), visual acceptance (owner).
- Next action: scroll symptom — chat-model brief issued (different model), then self-pass with playwright webkit-2104 screenshots per BRIEF-quicknotes-ios-scroll-self-verify.md.

## Pass N013 — DIAGNOSED (evidence gathered; implementation delegated to relay)
- Objective and scope: owner's iOS round — scroll-to-last-element (still open after N009–N011), plus four new items: (1) "sticky" app header, (2) mobile edit-mode type, (3) keyboard black-band regression, (4) folder-label prominence. Diagnosis + WebKit evidence this pass; implementation consolidated into one relay brief per owner instruction ("all fixed in one go").
- Diagnosis (verified with a WebKit harness, iPhone 390×664 emulation, seeded 40 notes):
  - PRIMARY (scroll + card band): host-page geometry — `.quicknotes-host{height:calc(100vh - 60px)}` sits under a topbar whose real mobile height is ~78–92px, and `.project-frame{min-height:100vh}`. Measured in a faithful replica: host `scrollHeight − innerHeight = +33px` (≈ URL-bar delta + topbar extra on device), iframe bottom below the fold → the tree's last row is unreachable at host scrollTop 0; scrolling the host (which routes the pan out of the iframe) reveals it — exactly "engages only once the header has scrolled off". Fix: host page = `100dvh` total, host = `100dvh − measured topbar`.
  - Keyboard band (item 3): in-card source can be host-level (iframe taller than the visible box; in-app `window.scrollTo(0,0)` can't reset the host); standalone needs a hardened settle (rAF-debounced pin / focusout re-fit — N011's own flagged next lever). iOS-26 vv bugs (wkbug 300493/315992 class) plausible driver of the "regression" without any code change.
  - Item 1: NO sticky exists (repo + deployed CSS verified); the header is a permanently pinned grid row. Working interpretation for the relay: mobile-only auto-hide on inner-scroll-down, return on scroll-up; drawer stays reachable via `#drawer-edge`.
  - Items 2/4 measured on the deployed state: title 20px/30px, path 16px mono, body 13px/19.5px mono, toggle 14px, note-item 14px, folder summary 10px uppercase+.5px tracking — prominence is the uppercase treatment, not size.
  - Cleared by code read: drawer/pan-y interception (drawer.js:36-37 — dir "v" never preventDefault); safe-area occlusion (#sidebar padding-bottom env()).
- Evidence: `artifacts/n013/01–05*.png` (card host-top: last row cut by the fold; host scrolled: row visible; folder label; editor chrome). Harness: playwright-core + webkit-2104, temp probe (unstaged).
- Changes: none to product code. New `docs/briefs/BRIEF-quicknotes-ios-n013-consolidated.md` (verbatim app + host code, diagnosis, 5 asks, output contract); superseded `BRIEF-quicknotes-ios-scroll-self-verify.md` deleted (diagnosis recorded in graph n9/n10).
- NOT RUN: on-device A/B (standalone vs card) — owner-side; the relay reply's integration + webkit gates are the next session.
- Next action: relay the consolidated brief to the chat model; integrate by salvage; verify with the same webkit harness (fail-before/pass-after on the dead-band metric).

## Pass N014 — INTEGRATED (relay salvage + deterministic completion; webkit gates green)
- Objective and scope: implement the consolidated iOS round (host band, keyboard band, header auto-hide, editor type, folder labels) from the relay reply. Reply arrived TRUNCATED: complete `portfolio/shell/src/styles.css` (host) + complete `quicknotes/css/style.css` arrived; `quicknotes/js/app.js` and `QuicknotesPage.tsx` did not (the reply declared the TSX unchanged, pure-CSS :has()). Missing app.js portions reconstructed deterministically from the reply's own CSS contract (body.header-hidden + --top-h) and the brief's keyboard spec — flagged as integrator-authored, not relay-authored.
- Changes:
  - `portfolio/shell/src/styles.css` — relay verbatim: `.project-frame:has(.quicknotes-frame){min-height:0;height:100dvh;display:flex;flex-direction:column;overflow:hidden}` + topbar `flex:0 0 auto` + host `height:auto;flex:1 1 auto;min-height:0` (base `.quicknotes-host{height:calc(100vh - 60px)}` kept as the no-:has() fallback). Host page = exactly the dynamic viewport → zero scrollable overflow at any width; other pages untouched via :has() scoping.
  - `quicknotes/css/style.css` — relay: folder summary de-shouted (normal case, no tracking, 12px; mobile 10px override dropped); header auto-hide mechanics (`#top` transform transition; `body.header-hidden{grid-template-rows:0 1fr auto}` + `translateY(calc(-1*var(--top-h,96px)))`, ≤760px only; `#top` added to reduced-motion); editor chrome: `.meta` 6px 10px/6px gap, `#title` 17px, coarse-block `#path` 16→13px (NOTE: brief said keep ≥16px — relay chose 13px for the calmer meta row; #path now zooms on focus like #search/#body, flag to owner).
  - `quicknotes/js/app.js` (integrator, per reply's contract): `el.top` added; header auto-hide (scroll-direction listener on #tree/#body/.preview with WeakMap last-position, hide on pan-down >2px below 60px depth, show on pan-up or #search focus, gated by the narrow mq, --top-h measured BEFORE the row collapses); vv settle hardened (rAF-coalesced pin→fit→fitPalette with one 140ms re-assert; parent-window re-pin inside pinViewport when framed, same-origin try/catch; narrow-gated focusout re-settle).
- Integration bugs found and fixed (fail-before/pass-after inside this pass):
  1. Auto-hide: first scroll event initialized the last-position WeakMap with the ALREADY-updated scrollTop → delta 0 → header never hid on the first pan. Fixed: first event records and returns.
  2. `--top-h` was measured AFTER the grid row collapsed → 13px garbage height (translate barely moved). Fixed: measure before toggling the class (53px correct).
- Verification (webkit-2104, iPhone 390×664 emulation, 40 seeded notes; harness replica carries the new host rules verbatim):
  - GATE 1 card geometry — `hostOverflow 33→0`, `deadBand 0`, tree at max scroll shows Note 21 fully inside the frame (bottom 563 ≤ 571) WITH the catalogue topbar visible. PASS (fail-before: n013 shots 02/03).
  - GATE 2 auto-hide — pan down → `body.header-hidden` true, header leaves (--top-h 53px); pan up → false; desktop >760px never hides. PASS.
  - GATE 3 type — title 17px, path 13px, body 13px, folder 12px/none/normal, note-item 14px unchanged. PASS.
  - GATE 4 desktop — header visible, `--app-h` unset, topbar flex. PASS.
  - Static: `node --check` app copy OK; CSS braces 145/145; markers verified.
  - NOT RUN (device-bound, owner): keyboard band (item 3 is iOS-vv-bound — rAF pin + focusout re-settle + parent pin are the hardening; webkit cannot emulate the keyboard), drawer edge-swipe feel with the header hidden, real-URL-bar dvh behavior in the card.
- Artifacts: `.agent/iterations/code/fast-notes-app/artifacts/n014/{gate1,gate2,gate3}*.png`.
- Next action: owner device pass (card + standalone, iPhone) — scroll-to-last in the card, keyboard open/dismiss band, header auto-hide, folder labels, editor feel; then brief close + deploy catalogue.

## Pass N015 — INTEGRATED (relay reply complete; static + webkit verified; device pending owner)
- Objective and scope: owner device verdict on N014 — (a) focus-zoom pair (13px field zoom-in on focus, zoom-back on dismiss) rejected after earlier acceptance; (b) "Done" leaves the page displaced (stranded vv pan); (c) the band behind the keyboard is now WHITE. Diagnosis: (c) is the catalogue body `--index-bg:#e4e5e1` (light) exposed behind the 100dvh frame by the stranded TOP-window pan — same mechanism as (b), which the app cannot see from inside the iframe (wkbug 179794).
- Changes (all from the relay reply, integrated verbatim):
  - `quicknotes/index.html` + `portfolio/shell/index.html` — `maximum-scale=1` added to both viewport metas (kills the <16px focus auto-zoom at 13px text; pinch still works — Safari ignores maximum-scale for pinch since iOS 10; top-document meta governs zoom in the card).
  - `quicknotes/js/app.js` vv section — settling loop `settleLoop()` ([0,120,300]ms re-asserts gated to narrow, checking `vv.offsetTop > 0` as fact) chained into the rAF-coalesced `onViewport`; focusout re-settle retained (fires the loop); pinViewport unchanged (window + same-origin parent re-pin).
  - `portfolio/shell/src/web/QuicknotesPage.tsx` — host-side vv pin (useEffect: scroll+resize → scrollTo(0,0) on offsetTop>0; zero-overflow page makes the pin safe against legitimate scroll); first-ever import in this file (React useEffect).
  - `portfolio/shell/src/styles.css` — `body:has(.quicknotes-frame){background:#0b1317}` band insurance near the host block.
- Verification:
  - Static: `node --check` app copy OK; CSS braces balanced; metas carry maximum-scale=1 in BOTH documents; `tsc --noEmit` (shell typecheck) clean.
  - WebKit (iPhone emulation): N014 gates re-run ALL GREEN after integration (card dead band 0 + last row visible; auto-hide both directions; type metrics unchanged; desktop untouched). NEW gates: boot clean with zero pageerrors after focusout storms; dismiss path (focus #body → blur) settles at `vvTop 0`, `--app-h` correct, no stranded header state; card bodyBg paints #0f1115-dark; stranded-pan emulation on the host (scrollY 133 → pin → 0).
  - NOT RUN (device-bound, owner): real keyboard zoom absence + pinch still zooms (maximum-scale=1 effectiveness governed by the TOP document in the card), settle-loop timing on the real dismiss animation, no white band after Done.
- Next action: owner device pass — type in #body/#search, press Done, in BOTH contexts; confirm no zoom, content returns, no band; then catalogue deploy + brief close.

## Pass N016 — VERIFIED (static + webkit; device pending owner) — static-feel round
- Objective and scope: owner device verdict on N015 — (1) sort select text too big (~15% down); (2) "rapid small movements" glitch when scrolled far down in the header/footer areas + auto-scroll-up when tapping into the text after touching outside; overall "static, sound foundation feel". Small scope — implemented directly, no relay.
- Diagnosis (code-level): (a) the N015 settleLoop scheduled 3 re-assert timers on EVERY vv scroll event, and iOS fires vv scroll with SUBPIXEL offsetTop during inner scrolls (wkbug 226354) → repeated window+parent scrollTo mid-scroll = the rapid-glitch feel; same subpixel reaction in the host-side pin. (b) focusing a field makes iOS pan the vv to reveal the caret (legitimate) while our pin yanked it back → the fight reads as "scrolls up automatically + glitchy". (c) the header hide collapsed the grid row INSTANTLY (0 1fr auto) while the transform slid over 240ms → a 53px layout snap mid-scroll.
- Changes:
  - `quicknotes/js/app.js` — settle discipline: `fieldFocused()` guard (iOS owns the pan while a field is focused — only fitViewport/fitPalette run, NO yank); `pointerDown` guard (never yank mid-touch; focusout re-runs); subpixel threshold `offsetTop > 1` in pinViewport; settleLoop is now DISMISS-ONLY (wired from focusout, not from generic onViewport; loop checks re-check fieldFocused/pointerDown per step).
  - `portfolio/projects/quicknotes/web/QuicknotesPage.tsx` — host pin threshold > 1 (subpixel immunity).
  - `quicknotes/css/style.css` — header hide mechanism swapped from transform + instant row-collapse to an animated `margin-top:-var(--top-h)` (the auto grid track shrinks every frame — no layout snap; space reclaimed smoothly); `#sort` 14px in the coarse block (was 16px).
- Verification (webkit-2104, iPhone emulation): node --check OK; tsc (shell) clean; sort 14px; auto-hide via the margin mechanism hides (computed margin-top −53px) and returns; **instrumented scrollTo counter: 0 yanks while #body is focused through a vv scroll/resize burst** (was the glitch source); after blur — no yanks, --app-h sane, zero pageerrors; desktop topbar unchanged. Artifacts: artifacts/n016/margin-hide.png.
- NOT RUN (device-bound): the real feel test — long tree scroll (no rapid twitches), touch header/footer then tap into text (no auto-jump), Done settle.
- Next action: owner device pass on the feel; then close the iOS thread (briefs N013–N015) if green.

## Pass N017 — FIXED (engine gate fail-before/pass-after; iOS device check pending owner)
- Objective and scope: owner report — "in iOS Safari it still drags/scrolls up when you click text in edit mode". This is the N016 item-2 symptom ("auto-scroll-up when tapping into the text") RETURNING THROUGH A SECOND MECHANISM: N016 fixed the vv-pin yank (fieldFocused yield), but the N014 header auto-hide wired the TEXTAREA itself as a hide trigger (`headerScrollers = [el.tree, el.body, el.preview]`).
- Diagnosis (code-confirmed chain): tapping/typing in #body makes iOS caret-reveal-scroll the TEXTAREA (engine scrollRectToVisible — lift the tapped/typed caret into view, e.g. above the keyboard). Those scroll events fire right after a tap/keystroke with the finger already up → `onHeaderScroll` reads delta>2 as a user pan-down → `setHeaderHidden(true)` → `margin-top:-53px` animates → the whole layout shifts up. Reverse reveal-scrolls un-hide it — every tap into the text jolts the layout by --top-h. Explains "when you click text in edit mode" specifically (title/path/search are not in headerScrollers); explains why N016's vv-settle fix didn't cover it (different trigger path, same symptom class).
- Fix (`quicknotes/js/app.js` only, minimal): caret-reveal guard in the auto-hide path — `bodyTapAt`/`bodyInputAt` timestamps recorded from #body pointerup/input; `onHeaderScroll` returns early for `#body` scroll events within 250ms of a tap/keystroke WHEN NO FINGER IS DOWN (`!pointerDown`). lastScroll position still recorded (later real pans compute correct deltas). User pans (finger down) and momentum/late scrolls (>250ms) still toggle the header — feature preserved.
- Regression gate: `portfolio/probes/quicknotes-n017-header-reveal.mjs` (Chromium-1134, iPhone 390×664 emulation, seeded 300-line note, unstaged probe). FAIL-BEFORE on unfixed HEAD: A tap-then-reveal=header-hidden TRUE (bug), D type-then-reveal=TRUE, B pan finger-down=TRUE, E late-after-tap=TRUE. PASS-AFTER: A=FALSE, D=FALSE, B=TRUE, E=TRUE (no over-suppression). Real-touchscreen-tap sanity: tap focuses #body, header stays visible, zero pageerrors across all page loads. `node --check` OK. webkit-2104 is BROKEN on this macOS (dyld _OBJC_CLASS_$__WKBrowserInspector) — Chromium used as gate engine; the scroll→class-toggle mechanism is engine-independent DOM, but the native iOS caret-reveal gesture itself cannot be emulated here.
- NOT RUN (device-bound, owner): the real feel test on iPhone — tap into note text in edit mode (no jolt), type at the bottom of a long note (no header flap), tree/preview pan still hides/shows the header as before. If a LARGER jump (with band below) remains, the next contributor is iOS's own vv pan while focused (N016 deliberate yield) — needs on-device vv.offsetTop instrumentation to size.
- Evidence tier: automated engine check (mechanism) + owner device check PENDING for the iOS gesture itself.

## Pass N018 — FIXED at mechanism tier (engine gate fail-before/pass-after; iOS device check pending owner)
- Objective and scope: owner verdict on N017 — "not fixed... when you click a text area, the area beneath it (empty area) gets bigger and then afterwards it clumsily gets smaller". Owner's refined description re-targets the diagnosis away from the header: this is the KEYBOARD-OPEN VIEWPORT SEQUENCE, not the auto-hide.
- Diagnosis (code-confirmed chain): (1) tap textarea → keyboard opens → iOS pans the visual viewport (offsetTop > 0) while the keyboard rises past the caret; (2) N016's yield rule (`fieldFocused()` → settleViewport skips the pin) leaves that pan STRANDED for the whole focus session — the vv no longer matches the layout-top body, so the html background beneath the --app-h-sized body shows as an empty band that grows with each mid-animation --app-h step; (3) a later resize/pan settle snaps it shut — "bigger, then clumsily smaller". The N016 yield was the wrong half-measure: with --app-h the caret is ALWAYS inside the visible box (tap point or box bottom = keyboard top), so a panned vv is never a legitimate reveal.
- Changes:
  - `quicknotes/js/app.js` — pinViewport now pins ALSO while focused, with three guards: subpixel threshold > 1 (N016, kept), mid-touch skip `!pointerDown` (kept, moved into settleViewport as `if (!pointerDown) pinViewport();`), NEW pinch guard `vv.scale === 1` (never fight a zoom). The `fieldFocused()` yield is REMOVED from settleViewport (fieldFocused stays for settleLoop). Parent same-origin re-pin kept.
  - `quicknotes/css/style.css` — mobile body gains `transition:height .22s ease-out` so the --app-h resize glides with the keyboard animation instead of landing in mid-animation steps (the "clumsy" half); `body` added to the prefers-reduced-motion opt-out.
- Regression gate: `portfolio/probes/quicknotes-n018-vv-pin.mjs` (Chromium-1134, vv.offsetTop/scale stubbed on the instance — Chromium cannot emulate the iOS keyboard pan; unstaged). FAIL-BEFORE on pre-fix tree: G1 focused-pin scrollTo calls = 0 (the yield skipped it — bug reproduced), G3-after-pointerup = 0, G6 = 0 (no scale guard, but masked by the yield). PASS-AFTER: G1 = 1 (pinned WHILE focused), G2 subpixel 0.5 → 0 calls, G3 mid-touch 0 → after pointerup 1, G6 pinch scale 1.5 → 0 calls, G4 --app-h tracks viewport shrink (600px). N017 gate re-run 5× GREEN after the change (A=false D=false B=true E=true).
- Probe flake fixed (probe-side, not product): scenario E/B flapped 1-in-4 — two causes found with state dumps: (a) programmatic scrollTop bumps can coalesce their async scroll events into one rendering frame (first event then only records) → bumps now dispatch scroll synchronously; (b) a late watchAuth/switchUser callback can re-render and reset activeId, hiding the editor mid-scenario → freshPage now re-opens until #editor is visible and #body focused.
- Static: node --check OK; CSS braces 145/145; transition + scale guard markers verified.
- NOT RUN (device-bound, owner): the real keyboard sequence on iPhone — tap into body/search/title: the empty area beneath must NOT appear and the box must glide, not snap; type at the bottom of a long note (caret stays visible, page static); dismiss (no band); pinch-zoom while a field is focused must still work (scale guard). If any jump remains, capture vv.offsetTop/height/scale via the Web Inspector during the tap — that decides between residual pan timing and --app-h landing late.
- Evidence tier: automated engine check (mechanism, stubbed vv) + owner device check PENDING for the real iOS keyboard sequence.
