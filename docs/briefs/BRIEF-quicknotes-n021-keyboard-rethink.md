# BRIEF — Quicknotes iOS keyboard mechanics: full rethink (N021)

You are a senior iOS-Safari web-architecture specialist. You have NO access to any repository — everything you need is in this brief. You MAY make your own design and code choices; do not ask for approvals. Think deeply before answering (protocol below). The orchestrator who receives your reply owns all file operations, integration, and engine-level verification.

## 0. Reasoning protocol (mandatory — this determines output quality)

Work in this order and show the work compactly:

1. **Reconstruct the event timeline** of "user taps text in a textarea on iOS Safari, keyboard opens, user types, keyboard dismisses" — every actor: iOS (keyboard animation, visual-viewport resize/scroll/pan, caret reveal, form-accessory bar), our JS handlers (verbatim below), our CSS transitions. Note WHERE Safari's reported timing (resize at animation start) diverges from what the eye sees (animation over ~250 ms).
2. **For each reported symptom** (section 5), walk the timeline and name the mechanism that produces it. If a symptom has more than one plausible mechanism, list them ranked by likelihood with the device observation that would discriminate.
3. **Design**: enumerate at least 3 candidate architectures for the keyboard-avoidance problem (including "do less/nothing" variants), with tradeoffs. Pick one and justify.
4. **Self-critique**: attack your own design — what breaks at the timing edges (resize early/late, pan/no-pan, iframe vs standalone), what regresses the already-owner-approved behaviors listed in §4, what happens on the dismiss path, on rotation, on pinch.
5. **Only then** write the final code (§7 output contract).

## 1. The app

"Quicknotes" — a plain-ES-module notes app (no framework, no build step for the app itself), dark theme, deployed at `https://vasyapym.github.io/quicknotes/` (standalone) AND embedded as a same-origin `<iframe>` inside a React catalogue shell at `https://vasyapym.github.io/` (a "project card"). Owner tests on a real **iPhone 11** (modern iOS 18.x, Safari, both contexts). Firebase sync exists but is irrelevant to this task.

Layout: `body` = CSS grid `auto 1fr auto` → `#top` (header: drawer toggle, search, sync status) / `#layout` (sidebar + editor: `#title`, `#path`, `#body` = `<textarea>`, `#preview`, `#status` = footer with note count "32 notes · 3 folders"). Mobile (`max-width:760px`): single-column, sidebar becomes an off-canvas drawer, split view collapses to editor-only.

## 2. Hard constraints

- Plain ES modules, no build step, no external libraries, no private/proprietary APIs.
- Must work standalone AND inside the same-origin iframe (host pin code below).
- Keep owner-approved visuals: mobile editor/search 13px, `maximum-scale=1` viewport meta (kills focus zoom), dark palette, ≥40px touch targets.
- Keep: local-first persistence (localStorage per uid), header auto-hide on inner-scroll-down, the app working with JS features available on iOS 15+.
- The orchestrator CANNOT emulate the iOS keyboard in an engine (Chromium harness only verifies mechanism-level behavior with stubbed `visualViewport` values). Your design must therefore be robust to UNKNOWN iOS timing — assume resize can fire early, late, in steps, or with pan offsetTop > 0 in any order.

## 3. Current mechanics (verbatim — the code you are rethinking)

### 3.1 `quicknotes/index.html` (head, relevant)

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
```

Body structure:

```html
<body>
  <header id="top">…#search…</header>
  <div id="layout">…#sidebar (drawer)… #main → #editor (meta: #title/#path/#view-toggle/#delete-btn; .panes: #body textarea, #preview)…</div>
  <footer id="status"><span id="count">…</span><span class="shortcuts">…</span></footer>
</body>
```

### 3.2 `quicknotes/css/style.css` (mobile-relevant rules)

```css
html,body{height:100%;margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 var(--sans);overflow:hidden;overscroll-behavior:none;-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{display:grid;grid-template-rows:auto 1fr auto;height:100vh;height:100dvh}
#top{transition:margin-top .24s cubic-bezier(.2,.8,.2,1)}
#body{resize:none;border:0;outline:none;background:var(--bg);padding:16px;font:14px/1.6 var(--mono);border-right:1px solid var(--border);overscroll-behavior:contain}
@media (max-width:760px){
  body.header-hidden #top{margin-top:calc(-1 * var(--top-h,96px))}
  #body{padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom));line-height:1.5}
  body{height:var(--app-h,100dvh);transition:height .22s ease-out}
  #status{padding:6px 12px calc(6px + env(safe-area-inset-bottom))}
  #status{transition:margin-bottom .25s ease-out}
  body.keyboard-open #status{margin-bottom:calc(-1 * var(--status-h,40px))}
}
@media (prefers-reduced-motion:reduce){#sidebar,#backdrop,#top,#status,body{transition:none}}
@media (hover:none) and (pointer:coarse){
  input,select,textarea{font-size:16px}
  #path{font-size:13px}
  #search,#body{font-size:13px}
  #sort{font-size:14px}
}
```

### 3.3 `quicknotes/js/app.js` — the whole viewport/keyboard cluster (current state)

```js
const narrow = matchMedia("(max-width:760px)");
const focusEl = elm => elm?.focus({ preventScroll: true });
const el = { /* … */ search: $("#search"), body: $("#body"), preview: $("#preview"),
             top: $("#top"), status: $("#status") /* … */ };

// ---------- keyboard-proof app box + visual-viewport pin ----------
function fitViewport() {
  if (!narrow.matches) { document.documentElement.style.removeProperty("--app-h"); return; }
  const vv = window.visualViewport;
  document.documentElement.style.setProperty("--app-h", (vv ? vv.height : window.innerHeight) + "px");
}
let pointerDown = false;
addEventListener("pointerdown", () => { pointerDown = true; }, { passive: true });
addEventListener("pointerup", () => { pointerDown = false; }, { passive: true });
addEventListener("pointercancel", () => { pointerDown = false; }, { passive: true });
const fieldFocused = () => /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
function pinViewport() {
  const vv = window.visualViewport;
  if (vv && vv.scale === 1 && vv.offsetTop > 1) {
    window.scrollTo(0, 0);
    try { if (window.self !== window.top) window.parent.scrollTo(0, 0); } catch { /* cross-origin */ }
  }
}
function alignViewport() {
  const vv = window.visualViewport;
  if (!vv || vv.scale !== 1 || vv.offsetTop <= 1) { document.body.style.transform = ""; return; }
  document.body.style.transform = `translateY(${vv.offsetTop}px)`;
}
let settleQueued = false;
function settleViewport() {
  if (!pointerDown) {
    if (fieldFocused()) alignViewport(); // iOS owns the pan; follow it
    else { pinViewport(); alignViewport(); }
  }
  fitViewport();
  fitPalette();
}
function settleLoop() {
  if (!narrow.matches) return;
  for (const t of [0, 120, 300]) setTimeout(() => {
    if (!fieldFocused() && !pointerDown && window.visualViewport && window.visualViewport.offsetTop > 1) settleViewport();
  }, t);
}
function onViewport() {
  if (settleQueued) return;
  settleQueued = true;
  requestAnimationFrame(() => { settleQueued = false; settleViewport(); });
}
window.visualViewport?.addEventListener("resize", onViewport);
window.visualViewport?.addEventListener("scroll", onViewport);
narrow.addEventListener?.("change", onViewport);
window.addEventListener("focusout", () => { if (narrow.matches) setTimeout(() => { onViewport(); settleLoop(); }, 80); });

// ---------- mobile header auto-hide ----------
const headerScrollers = [el.tree, el.body, el.preview];
const lastScroll = new WeakMap();
let bodyTapAt = 0, bodyInputAt = 0;
el.body.addEventListener("pointerup", () => { bodyTapAt = Date.now(); }, { passive: true });
el.body.addEventListener("input", () => { bodyInputAt = Date.now(); }, { passive: true });
function setHeaderHidden(hidden) {
  if (!narrow.matches) hidden = false;
  if (hidden && !document.body.classList.contains("header-hidden"))
    document.documentElement.style.setProperty("--top-h", el.top.offsetHeight + "px");
  document.body.classList.toggle("header-hidden", hidden);
}
function onHeaderScroll(e) {
  const sc = e.currentTarget;
  if (!lastScroll.has(sc)) { lastScroll.set(sc, sc.scrollTop); return; }
  const delta = sc.scrollTop - lastScroll.get(sc);
  lastScroll.set(sc, sc.scrollTop);
  if (sc === el.body && !pointerDown && Date.now() - Math.max(bodyTapAt, bodyInputAt) < 250) return;
  if (delta > 2 && sc.scrollTop > 60) setHeaderHidden(true);
  else if (delta < -2) setHeaderHidden(false);
}
for (const sc of headerScrollers) sc?.addEventListener("scroll", onHeaderScroll, { passive: true });
el.search.addEventListener("focus", () => setHeaderHidden(false));

// ---------- keyboard-open: tuck the info footer away while typing ----------
let kbHideTimer = 0;
const FIELD = /^(INPUT|TEXTAREA|SELECT)$/;
function setKeyboardOpen(open) {
  if (open) {
    document.documentElement.style.setProperty("--status-h", el.status.offsetHeight + "px");
    document.body.classList.add("keyboard-open");
  } else document.body.classList.remove("keyboard-open");
}
document.addEventListener("focusin", e => {
  if (!narrow.matches || !FIELD.test(e.target.tagName)) return;
  clearTimeout(kbHideTimer);
  setKeyboardOpen(true);
});
document.addEventListener("focusout", e => {
  if (!narrow.matches || !FIELD.test(e.target.tagName)) return;
  clearTimeout(kbHideTimer);
  kbHideTimer = setTimeout(() => setKeyboardOpen(false), 120);
});
narrow.addEventListener?.("change", () => { if (!narrow.matches) { clearTimeout(kbHideTimer); setKeyboardOpen(false); } });
```

(`fitPalette()` repositions a command-palette `<dialog>` from vv.height/offsetTop — irrelevant here, but `settleViewport` calls it; keep the call.)

Also relevant — the input path that may cause the paste lag:

```js
el.body.oninput = () => { updateActive({ body: el.body.value }); renderPreview(); };
el.title.oninput = () => { updateActive({ title: el.title.value }); renderTree(); };
function updateActive(patch) {
  const n = active(); if (!n) return;
  Object.assign(n, patch, { updatedAt: Date.now(), _dirty: true });
  persist(); schedulePush(n.id);   // persist() = synchronous localStorage.setItem of ALL notes
}
function renderPreview() {
  const n = active(); if (!n) return;
  el.preview.innerHTML = render(n.body, { exists: t => !!byTitle(t) });  // FULL markdown re-render per keystroke
}
```

### 3.4 Host-side (catalogue card) — `QuicknotesPage.tsx` pin

```tsx
useEffect(() => {
  const vv = window.visualViewport;
  if (!vv) return;
  const pin = () => { if (vv.offsetTop > 1) window.scrollTo(0, 0); };
  vv.addEventListener("scroll", pin);
  vv.addEventListener("resize", pin);
  return () => { vv.removeEventListener("scroll", pin); vv.removeEventListener("resize", pin); };
}, []);
```

Host CSS (React shell): `.project-frame:has(.quicknotes-frame){min-height:0;height:100dvh;display:flex;flex-direction:column;overflow:hidden}` + topbar `flex:0 0 auto` + `.quicknotes-host{height:auto;flex:1 1 auto;min-height:0}` — the host page has ZERO scrollable overflow.

## 4. Behaviors already owner-approved (do not regress)

1. Mobile header auto-hides on inner-scroll-down, returns on scroll-up / search focus.
2. Mobile editor + search at 13px; `maximum-scale=1` (no focus zoom; pinch still zooms).
3. Split view collapses to editor-only on phones (binary Edit⇄Preview toggle).
4. Footer count line exists when the keyboard is closed.
5. The app stays a static ES-module site (no framework, no bundler).

## 5. The three live symptoms (all on iPhone 11 Safari, iOS 18.x, standalone AND in-card)

- **S1 — "the mechanics should be rethought": after five fix rounds (N016–N020) the owner still reports unwanted movement when tapping into text while the keyboard opens.** Chronology of device verdicts: (a) vv-pin yank fought iOS's caret-reveal pan → "glitchy, scrolls up automatically"; (b) yield to the pan instead → stranded pan = empty band below the app box that "gets bigger then clumsily smaller"; (c) pin-while-focused → "slow upward crawl", only when tapping text NEAR THE BOTTOM after scrolling down (tap-position dependent: low taps make the rising keyboard cover the caret and iOS pans the vv to reveal it; high taps are fine); (d) compensating the pan with `body translateY(offsetTop)` (current) — owner still reports movement, specifically around the footer zone below the note count; (e) the footer now tucks away while typing (current) — verdict pending. Known timing facts: Safari fires vv resize at keyboard-animation START with (apparently) the final height; the keyboard takes ~250 ms; caret reveal pans are animated; the owner sees the app-box bottom/empty-space dynamics as "the bug" regardless of which mechanism we run.
- **S2 — "there is no Done button".** On this device the keyboard's form-accessory bar (with "Done") is reportedly ABSENT (or the owner means the app offers no in-UI way to dismiss the keyboard — treat BOTH readings: explain when iOS Safari omits the accessory bar — e.g. certain iframe presentations — and design an in-app dismiss affordance that is honest and reachable one-handed; it must not fight the system keyboard).
- **S3 — pasting from the clipboard "works with a lag (if you tap long enough)".** Long-press → Paste into `#body` produces a visible stall. Candidate causes you should verify against the code above: synchronous `persist()` (localStorage write of the whole notes object) on EVERY input; `renderPreview()` full-markdown innerHTML re-render on every input — INCLUDING when the preview pane is `display:none` on mobile edit mode (pure waste); possible vv/scroll event storms from the paste-induced reflow interacting with the settle machinery. Design the fix (debounce/idle-render/incremental — your call) so typing AND pasting feel instant, without breaking the "synced" indicator or the push pipeline (`schedulePush` debounces Firebase pushes at 800 ms already).

## 6. What "rethink" means here

You may propose replacing the whole §3.3 cluster (and the matching CSS) with a DIFFERENT, SIMPLER architecture if your analysis says so — e.g. variants of: (1) keep --app-h shrink + compensation (current), (2) never resize the page; let the keyboard cover the bottom; make only the TEXTAREA's internal scrolling handle the caret (plain-website model) with pan compensation, (3) keyboard-height padding on the textarea's scroll container instead of body resize, (4) hiding ALL app chrome while a field is focused (immersive editor), or something better. The design goal, in priority order: (a) the page NEVER appears to move on its own when tapping/typing; (b) the caret is always visible above the keyboard; (c) dismissal returns exactly to the pre-focus layout; (d) the mechanism is FEWER moving parts than today (each guard we added over five rounds is a smell); (e) robustness to unknown Safari timing.

## 7. Output contract (your reply, markdown)

1. `## Timeline` — the reconstructed event timeline (compact table or list).
2. `## Symptom mechanisms` — S1/S2/S3 each: mechanism chain + discriminating observation.
3. `## Design` — candidates considered (≥3) with one-line tradeoffs; the chosen architecture; why it beats the others against the §6 priorities.
4. `## Code` — COMPLETE replacement blocks, one per file, each preceded by a one-line path header (`--- quicknotes/js/app.js (section) ---`). Full functions, not diffs. Mark anything you intend to DELETE with `/* DELETE: <name> */` on its own line. Keep existing code style (semicolons, compact one-line rules, rationale comments referencing N021).
5. `## Engine gates` — 4–7 deterministic checks the orchestrator can run in Chromium with stubbed `visualViewport` (they cannot prove iOS behavior; they prove the mechanism wiring).
6. `## Owner device checklist` — the exact taps/expectations for the iPhone verdict, ≤8 items.
7. `## Confidence & risks` — what you could not determine without the device.

Keep total reply under ~900 lines. Prioritize Code completeness over prose.
