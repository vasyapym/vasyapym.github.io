# BRIEF — Quicknotes iOS keyboard: kill the "screen repositions to center the tapped point" movement (N030)

You are a senior iOS-Safari/WebKit specialist. You have NO access to any repository — everything you need is in this brief. You MAY make your own design and code choices; do not ask for approvals and do not request clarification — decide with the evidence given and say what you assumed. The orchestrator who receives your reply owns all file operations, integration, and engine-level verification.

## 0. Reasoning protocol (mandatory — this determines output quality)

Work strictly in this order and show the work compactly. Label every factual claim you make in sections 1–2 as **Confirmed** (directly follows from the code/evidence in this brief), **Inferred** (logical conclusion from confirmed facts), or **Assumed** (stated without evidence — say what device observation would confirm it).

1. **Reconstruct the event timeline** of "user taps a text position inside a textarea on iOS Safari, keyboard opens (or is already open), user types, keyboard dismisses" — every actor: iOS (keyboard animation ~250 ms, caret-reveal pan of the visual viewport, its centering behavior for taps below the visible center, layout-viewport scroll vs visual-viewport pan), our JS handlers (verbatim below), our CSS transitions. Note where Safari's reported timing (vv resize at keyboard-animation START with final height) diverges from what the eye sees.
2. **For each movement scenario** (section 5), walk the timeline and name the mechanism that produces it. If more than one plausible mechanism exists, list them ranked by likelihood, each with the device observation (debug-meter values) that would discriminate. Pay special attention to: (a) taps below the center of the visible area when the keyboard is ALREADY open; (b) the same tap when the keyboard opens; (c) the standalone vs embedded-iframe contexts — the top window's visual viewport is pannable by iOS for an iframe's caret even when the host page has zero scrollable overflow, and `window.scrollTo(0,0)` may not reset a visual-viewport pan (state which layer actually pans, using the recorded device facts in §5).
3. **Design**: enumerate at least 3 candidate architectures for achieving "the page NEVER visibly repositions" (including do-less/nothing variants and host-side approaches that were NOT yet tried — see the rejected list in §5 to avoid re-proposing dead ends). Tradeoffs one line each. Pick one and justify against the §6 priorities.
4. **Self-critique**: attack your own design — timing edges (resize early/late/in steps, pan while focused, tap while already focused, no-pan cases), what regresses the owner-approved behaviors in §4, the dismiss path, rotation, pinch, the iframe context, and the N028-style failure (host chrome changes that clip the app header).
5. **Only then** write the final code (§7 output contract).

## 1. The app

"Quicknotes" — a plain-ES-module notes app (no framework, no build step for the app itself), dark theme, deployed at `https://vasyapym.github.io/quicknotes/` (standalone) AND embedded as a same-origin `<iframe>` inside a React catalogue shell at `https://vasyapym.github.io/` (a "project card"). The owner tests on a real **iPhone 11** (iOS 18.x, Safari, both contexts). "Visitors" mostly see the app through the catalogue card. Firebase sync exists but is irrelevant to this task.

Layout: `body` = CSS grid `auto 1fr auto` → `#top` (header: drawer toggle, search, sync) / `#layout` (sidebar drawer + editor: `#title`, `#path`, `#body` = `<textarea>`, `#preview`) / `#status` (footer with note count). Mobile (`max-width:760px`): single column, sidebar off-canvas, split collapses to editor-only.

## 2. Hard constraints

- Plain ES modules, no build step, no external libraries, no private/proprietary APIs. Features must work on iOS 15+.
- Must work standalone AND inside the same-origin iframe (host code below is also ours and may be changed).
- Keep owner-approved visuals and behaviors: mobile editor/search 13px idle, `maximum-scale=1` viewport meta, dark palette, ≥40px touch targets, mobile header auto-hide on inner-scroll-down (returns on scroll-up/search focus), footer count visible when the keyboard is closed, split collapses to editor on phones.
- Do NOT regress the fixed typing/paste pipeline (debounced persist, hidden-pane-gated preview render) or the momentum guard — they are owner-approved.
- The orchestrator CANNOT emulate the iOS keyboard. Engine gates (Chromium, stubbed `visualViewport`) prove mechanism wiring only. Your design must be robust to UNKNOWN iOS timing: assume the vv resize can fire early, late, in steps, or with offsetTop > 0 in any order; assume caret-reveal pans are animated; assume a tap into an already-focused field can trigger a reveal scroll with NO keyboard animation.

## 3. Current code (verbatim — the code you are changing)

### 3.1 `quicknotes/index.html` (head)

```html
<!-- N021: resizes-visual keeps the layout viewport STABLE (innerHeight constant, only vv.height shrinks) so the app can compute keyboard height and never let the page self-resize. Was: interactive-widget=resizes-content. -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, interactive-widget=resizes-visual">
```

(Safari ignores `interactive-widget`; on iOS the layout viewport never resizes for the keyboard — the keyboard overlays.)

### 3.2 `quicknotes/js/app.js` — programmatic focus + note-open caret (excerpt)

```js
const narrow = matchMedia("(max-width:760px)");   // single source of truth for "mobile"
// Every programmatic focus goes through here: a bare .focus() makes WebKit
// scroll ancestors to "reveal" the target — the tap-shift glitch.
const focusEl = elm => elm?.focus({ preventScroll: true });
const el = { /* … */ body: $("#body"), preview: $("#preview"), top: $("#top"),
             status: $("#status"), tree: $("#tree") /* … */ };

function openNote(id) {
  state.activeId = id; renderAll();
  if (state.view === "view") focusEl(el.preview);
  else {
    // N022: deterministic caret — engines differ on programmatic-focus caret
    // (Chromium: END → the old "page pans on note-open" / new: auto-scroll to
    // bottom). Opening a note must land at its START with a calm keyboard.
    el.body.selectionStart = el.body.selectionEnd = 0;
    focusEl(el.body);
  }
}
```

### 3.3 `quicknotes/js/app.js` — the whole keyboard/viewport cluster (current state)

```js
// ================= N021: plain-website keyboard model =================
// No body resize, no vv pin, no body translate, no settle loop. The layout
// viewport is STABLE (viewport meta interactive-widget=resizes-visual); the
// keyboard just OVERLAPS the page. The <textarea> is the only internal
// scroller; while a field is focused we give the body keyboard-height bottom
// padding (--kb-h), so iOS reveals the caret by scrolling the TEXTAREA —
// offsetTop stays 0 and header/footer never move. Dismiss = padding off =
// exact return. Robust to unknown Safari resize timing: the padding only
// changes scroll range, never geometry; a focusin estimate covers a late or
// absent resize.
const FIELD = /^(INPUT|TEXTAREA|SELECT)$/;
const fieldFocused = () => FIELD.test(document.activeElement?.tagName || "");

// pointerDown kept: the header auto-hide logic below still consumes it.
let pointerDown = false;
addEventListener("pointerdown", () => { pointerDown = true; }, { passive: true });
addEventListener("pointerup", () => { pointerDown = false; }, { passive: true });
addEventListener("pointercancel", () => { pointerDown = false; }, { passive: true });

// N027: height sources. Under interactive-widget=resizes-visual the LAYOUT
// viewport is stable across keyboard show/hide; documentElement.clientHeight
// tracks it. window.innerHeight on this build follows the VISUAL viewport
// (shrinks with the keyboard — the N024 stale-gap mechanism) — never use it
// for geometry.
function layoutHeight() {
  return document.documentElement.clientHeight || window.innerHeight;
}

function currentKbHeight() {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(layoutHeight() - vv.height));
}
function setKbHeight(px) {
  document.documentElement.style.setProperty("--kb-h", (px || 0) + "px");
}

// ---- N024: rigid container height ("make it just static" — Obsidian ask) ----
// Freeze while focused (no URL-bar micro-reflows mid-type); the keyboard-
// independent source means dismiss timing can no longer capture a shrunken
// value — the P1 dark-gap mechanism is gone.
function pinBodyHeight() {
  if (!narrow.matches) { document.documentElement.style.removeProperty("--app-v"); return; }
  if (fieldFocused()) return; // frozen mid-focus: the shell cannot flex while typing
  document.documentElement.style.setProperty("--app-v", layoutHeight() + "px");
}

// ---- N027 (P2): touch-scroll gate — an external scrollTop write during iOS
// momentum cancels the momentum (the "rapid and chaotic" feel). revealCaret
// must never write scrollTop while the user is panning (incl. the 400ms
// momentum window after touchend).
let userScrolling = false, scrollIdle = 0;
function beginUserScroll() { userScrolling = true; clearTimeout(scrollIdle); }
function endUserScroll() { clearTimeout(scrollIdle); scrollIdle = setTimeout(() => { userScrolling = false; }, 400); }
document.addEventListener("touchmove", beginUserScroll, { passive: true, capture: true });
document.addEventListener("touchend", endUserScroll, { passive: true, capture: true });
document.addEventListener("touchcancel", endUserScroll, { passive: true, capture: true });

// N025 (S2 closed by owner): the in-app Done bar is REMOVED — iOS always
// shows the standard keyboard accessory bar with Done on this device (owner
// verdict; the N021 "no Done" report did not reproduce). blur stays wired to
// the normal dismiss paths.

// ---- single rAF-throttled vv reader: NO page movement, only palette -------
let lastKb = 0;
function readViewport() {
  pinBodyHeight();
  if (narrow.matches && fieldFocused()) {
    const kb = currentKbHeight();
    setKbHeight(kb);
    // N027 (P2): one-shot re-aim only when the keyboard first lands (0 → up);
    // never per-frame, never during an active pan/momentum — a per-frame
    // revealCaret fought native scrolling (the chaotic feel).
    if (kb - lastKb > 80 && !userScrolling) revealCaret();
    lastKb = kb;
  } else {
    lastKb = 0;
  }
  fitPalette(); // keep: command-palette dialog placement
}
let vvQueued = false;
function onVV() {
  if (vvQueued) return;
  vvQueued = true;
  requestAnimationFrame(() => { vvQueued = false; readViewport(); });
}
window.visualViewport?.addEventListener("resize", onVV);
window.visualViewport?.addEventListener("scroll", onVV);
narrow.addEventListener?.("change", onVV);

// ---- N022: pre-reveal the caret INSIDE the textarea ----
// Device video verdict on N021: iOS still PANS the visual viewport for LOW
// taps (page slides up ~150px, the title row exits view) — its caret reveal
// runs on the caret's position regardless of the scroll room we added. The
// only way to leave iOS nothing to reveal is to put the caret above the
// keyboard zone BEFORE its animation completes: measure the caret's content
// Y with a style-mirror of the textarea, then tween the textarea's scrollTop
// so the caret bottom rests ~20px above the keyboard line. The --kb-h bottom
// padding guarantees the scroll range reaches that position. Only-scroll-down
// (never scroll back up), so high taps stay perfectly still (the asymmetry).
const caretMirror = document.createElement("div");
function caretContentY() {
  const ta = el.body, cs = getComputedStyle(ta), m = caretMirror;
  m.style.cssText = "position:absolute;visibility:hidden;top:0;left:0;z-index:-1;box-sizing:border-box;"
    + `width:${ta.clientWidth}px;padding:${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft};`
    + `font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};`
    + `line-height:${cs.lineHeight};letter-spacing:${cs.letterSpacing};white-space:pre-wrap;`
    + `overflow-wrap:${cs.overflowWrap};word-break:${cs.wordBreak};tab-size:${cs.tabSize}`;
  m.textContent = ta.value.slice(0, ta.selectionStart ?? ta.value.length);
  const dot = document.createElement("span");
  dot.textContent = "\u200b"; // zero-width: keeps an empty last line measurable
  m.appendChild(dot);
  if (!m.parentNode) document.body.appendChild(m);
  return dot.offsetTop + dot.offsetHeight; // caret BOTTOM in content coords
}
let tweenRaf = 0;
function tweenScrollTo(elm, to) {
  cancelAnimationFrame(tweenRaf);
  const from = elm.scrollTop, dist = to - from, t0 = performance.now();
  const step = now => {
    const p = Math.min(1, (now - t0) / 200), e = 1 - (1 - p) ** 3;
    elm.scrollTop = from + dist * e;
    if (p < 1) tweenRaf = requestAnimationFrame(step);
  };
  tweenRaf = requestAnimationFrame(step);
}
function revealCaret() {
  if (!narrow.matches || document.activeElement !== el.body) return;
  const ta = el.body;
  const kb = currentKbHeight() || Math.round(layoutHeight() * 0.4);
  const visible = ta.clientHeight - kb; // the area that stays above the keyboard
  if (visible <= 0) return;
  const caretY = caretContentY();
  // minimal movement: lift the caret only as far as the keyboard zone demands,
  // +20px margin (≈ one line) so a slightly-off mirror measure can't re-pan
  const desired = Math.round(caretY - visible + 20);
  const max = Math.max(0, ta.scrollHeight - ta.clientHeight);
  const to = Math.max(0, Math.min(desired, max));
  if (to > ta.scrollTop + 2) tweenScrollTo(ta, to); // high taps: no-op
}
let caretQueued = false;
document.addEventListener("selectionchange", () => {
  if (document.activeElement !== el.body) return;
  if (userScrolling) return; // N027: never fight native scroll / momentum
  if (caretQueued) return;
  caretQueued = true;
  requestAnimationFrame(() => {
    caretQueued = false;
    if (!userScrolling) revealCaret();
  });
});

// ---- field focus: give textarea scroll room; blur: undo, flush ----
document.addEventListener("focusin", e => {
  if (!narrow.matches || !FIELD.test(e.target.tagName)) return;
  // estimate first (robust to late/absent vv resize), onVV refines to the real value
  setKbHeight(currentKbHeight() || Math.round(layoutHeight() * 0.4));
  document.body.classList.add("kb");
  lastKb = 0; // allow the next vv frame to fire the one-shot re-aim
  requestAnimationFrame(revealCaret);
});
document.addEventListener("focusout", () => {
  if (!narrow.matches) return;
  setTimeout(() => { // debounce so field→field moves don't flicker
    if (fieldFocused()) return;
    document.body.classList.remove("kb");
    setKbHeight(0);
    pinBodyHeight(); // N027 (P1): re-pin NOW that the field is blurred
    setTimeout(pinBodyHeight, 300); // belt: re-pin after the close animation settles
    flushPersist(); // guarantee the synced pipeline sees the final value
  }, 60);
});
```

(`fitPalette()` repositions a command-palette `<dialog>` from vv.height/offsetTop — unrelated to movement, but `readViewport` calls it; keep the call.)

### 3.4 `quicknotes/js/app.js` — mobile header auto-hide (interacts with every tap into the text)

```js
const headerScrollers = [el.tree, el.body, el.preview];
const lastScroll = new WeakMap();
// N017: tapping/typing in the editor makes iOS scroll the TEXTAREA itself
// (caret reveal). Those scroll events fire right after a tap or input with
// the finger already up, and used to read as user pans → the auto-hide
// yanked the whole layout by --top-h on every tap into the text. A real pan
// scrolls WHILE the finger is down, so #body toggles are suppressed only
// inside the short reveal window (250ms after a tap/keystroke) when no
// finger is down.
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
  if (!lastScroll.has(sc)) { lastScroll.set(sc, sc.scrollTop); return; } // first event: no direction yet
  const delta = sc.scrollTop - lastScroll.get(sc);
  lastScroll.set(sc, sc.scrollTop);
  if (sc === el.body && !pointerDown && Date.now() - Math.max(bodyTapAt, bodyInputAt) < 250) return; // caret reveal, not a pan (N017)
  if (delta > 2 && sc.scrollTop > 60) setHeaderHidden(true);
  else if (delta < -2) setHeaderHidden(false);
}
for (const sc of headerScrollers) sc?.addEventListener("scroll", onHeaderScroll, { passive: true });
el.search.addEventListener("focus", () => setHeaderHidden(false));
```

### 3.5 `quicknotes/css/style.css` (mobile keyboard-relevant rules)

```css
html,body{height:100%;margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 var(--sans);overflow:hidden;overscroll-behavior:none;-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{display:grid;grid-template-rows:auto 1fr auto;height:100vh;height:100dvh}
#body{resize:none;border:0;outline:none;background:var(--bg);padding:16px;font:14px/1.6 var(--mono);border-right:1px solid var(--border);overscroll-behavior:contain}
@media (max-width:760px){
  body.header-hidden #top{margin-top:calc(-1 * var(--top-h,96px))}
  #body{padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom));line-height:1.5}
  /* N021: keyboard-proof via body RESIZE is gone — the layout viewport is
     stable; the keyboard OVERLAPS the page. While a field is focused (body.kb)
     the textarea gets keyboard-height bottom scroll room so iOS reveals the
     caret by scrolling the TEXTAREA, not by panning the page. --kb-h is
     written by app.js (real vv delta, focus-time estimate first). */
  body.kb #body{padding-bottom:calc(16px + env(safe-area-inset-bottom) + var(--kb-h,0px))}
  /* N024: rigid container height — pinned to the keyboard-independent layout
     height, FROZEN while a field is focused (app.js writes --app-v and skips
     updates mid-focus). */
  body{height:var(--app-v,100dvh)}
  #status{padding:6px 12px calc(6px + env(safe-area-inset-bottom))}
}
@media (hover:none) and (pointer:coarse){
  input,select,textarea{font-size:16px}
  #path{font-size:13px}
  #search,#body{font-size:13px}   /* owner-approved idle size; #body zooms on focus — accepted trade of maximum-scale=1 */
  #sort{font-size:14px}
}
```

### 3.6 Host side (catalogue card) — `portfolio/projects/quicknotes/web/QuicknotesPage.tsx` (complete file)

```tsx
import { useEffect } from "react";

export default function QuicknotesPage() {
  // Host-side pin: a stranded pan can live on the TOP window and the iframe's
  // own vv may not fire for it. This page has zero scrollable overflow, so
  // re-pinning on offsetTop>0 can never fight a legitimate scroll.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const pin = () => { if (vv.offsetTop > 1) window.scrollTo(0, 0); };
    vv.addEventListener("scroll", pin);
    vv.addEventListener("resize", pin);
    return () => {
      vv.removeEventListener("scroll", pin);
      vv.removeEventListener("resize", pin);
    };
  }, []);

  return (
    <div className="quicknotes-host">
      <iframe src="/quicknotes/" title="Quicknotes" className="quicknotes-frame" />
    </div>
  );
}
```

### 3.7 Host CSS (React shell) — the quicknotes card block

```css
.project-frame:has(.quicknotes-frame) {
  min-height: 0; height: 100dvh; display: flex; flex-direction: column; overflow: hidden;}

/* N028 REVERTED (owner: "it blocks the header of the project now") — the
   fixed topbar + padding inset clipped the app's own header on device.
   Back to the in-flow topbar slot; the host-pan slide remains a known,
   owner-accepted cosmetic. */
.project-frame:has(.quicknotes-frame) .project-frame-topbar { flex: 0 0 auto; }

.quicknotes-host { height: calc(100vh - 60px); background: var(--ink-bg);}
.project-frame:has(.quicknotes-frame) .quicknotes-host {
  height: auto; flex: 1 1 auto; min-height: 0;}
.quicknotes-frame { display: block; width: 100%; height: 100%; border: 0; background: #0f1115;}
/* Band insurance: a stranded top-window pan after keyboard dismissal can
   expose the light --index-bg behind the frame's 100dvh bottom edge — paint
   the page body ink-dark so any residual band reads black instead of white. */
body:has(.quicknotes-frame) { background: #0b1317; }
```

(The catalogue topbar — "← back" button + owner name — is an in-flow flex row ABOVE `.quicknotes-host`; the iframe fills everything below it. The host document has zero scrollable overflow.)

The app also has a per-frame debug meter (`?debug=1` or `#debug`, persisted in localStorage, `?debug=0` clears) that reads: `innerHeight`, `clientHeight`, `vv.height`, `vv.offsetTop`, `vv.scale`, `scrollY`, body rect top/bottom/height, `--kb-h`, `--app-v`. It is the on-device instrument for every discriminating observation below.

## 4. The new report (this round's bug)

Owner instruction, verbatim: **"Let's move forward with addressing the iOS Safari keyboard behavior. The issue is as follows: when a user taps below the center of the visible area, the screen automatically repositions to center the tapped point on screen. This is what causes the unintended movement that visitors are experiencing. Please resolve this."**

Note the mechanics in the report itself: the reposition is described as CENTERING THE TAPPED POINT in the visible area — not "reveal the caret above the keyboard". "Visitors" points at the catalogue card, but standalone must not regress either (the owner uses both).

## 5. Recorded device facts and verdict history (do not re-propose rejected mechanisms)

Device: iPhone 11, iOS 18.x, Safari. Standalone AND card contexts.

- **N016–N020 (old model — superseded, do not resurrect):** vv-pin yank fought the caret-reveal pan → "glitchy, scrolls up automatically". Yield to the pan → stranded pan = empty band below the app box ("bigger, then clumsily smaller"). Pin-while-focused → "slow upward crawl" (only after scrolling down + tapping text NEAR THE BOTTOM — tap-position dependent). Body translateY compensation → still movement around the footer zone. Footer tuck → mixed.
- **N021 (current model, device-approved):** plain-website model — stable layout viewport, keyboard overlaps the page, `--kb-h` textarea bottom padding, no pin/translate/settle/tuck. The OLD-model guards were all deleted.
- **N022 (screen recording, standalone):** tap near the bottom with keyboard closed → keyboard opens and the WHOLE PAGE slides up ~145px (title row exits view) — iOS pans the visual viewport to reveal the caret; the N021 scroll room alone did NOT prevent it. A HIGH tap (16.5s in the video) opens the keyboard with ZERO movement — the asymmetry is tap-position-driven. Also confirmed: a screen reposition accompanies taps that place the caret LOW, exactly the below-center class the owner now reports. Fix shipped: `revealCaret()` pre-reveal (mirror-measured caret, tween the TEXTAREA's scrollTop so the caret bottom rests ~20px above the keyboard line, only-scroll-down).
- **N023 (owner memory):** "when the font was bigger there was no bug" — sub-16px fields trigger iOS's focus routine; `maximum-scale=1` clamps the zoom but the pan component survived. 16px-at-focus floor shipped, then REVERTED by owner verdict (N024: "when you click text it gets bigger — I don't like it").
- **N024 (owner verdict, newest build):** the caret pre-reveal did NOT stop the iOS pan on device for the tested low taps — "iOS computes the reveal at tap-time and queues the animation — it cannot be cancelled retroactively" (this was the N024-era working hypothesis; treat as Inferred, not Confirmed). The rigid container height (`--app-v` frozen mid-focus) was shipped this round.
- **N025–N026 (MILESTONE):** owner: "it appears to be fixed" — the self-movement bug closed on device after the N021–N025 combination. Caution: which change actually produced the fix was never isolated.
- **N027 (polish):** height source switched to `documentElement.clientHeight` (innerHeight was visual-tracking); revealCaret made one-shot at keyboard landing + momentum guard; debug meter hardened (localStorage-persisted). Owner after N027: "currently it feels ok" (standalone).
- **N028–N029 (the OPEN thread):** in the CARD, the topbar ("← back", owner name) slides out of view and empty space appears below when the keyboard opens for the iframe's caret — the TOP WINDOW is panned by iOS for the iframe's caret (wkbug 179794 class). The attempted fix (topbar `position:fixed` + host padding) was REVERTED on owner verdict: it clipped the app's own header on the real device (assumed topbar height did not match reality / safe-area interaction). The host-side pin (`scrollTo(0,0)` on every vv scroll/resize with offsetTop>1) remains live and is the "fight" pattern previously rejected standalone. The owner accepted the cosmetic slide as a stopgap — and has now reopened movement as a bug to RESOLVE.
- **Never collected:** the debug-meter readout during a real repro (which value moves: `vv.offsetTop` vs `scrollY` vs body rect vs `innerHeight`). This is the missing discriminating data since N024 — the owner checklist must collect it.

## 6. What "resolve" means here

Design goal, in priority order:
(a) The page NEVER appears to move on its own when tapping text — including taps below the center of the visible area, in BOTH the standalone and the card context, with the keyboard closed→opening AND already open.
(b) The caret is always visible above the keyboard (the user must be able to see what they tapped into).
(c) Dismissal returns exactly to the pre-focus layout.
(d) The mechanism has FEWER moving parts than today (each guard added over N016–N027 is a smell).
(e) Robust to unknown Safari timing.
(f) Must not reintroduce the N028 failure (host chrome geometry that clips the app header) and must not regress owner-approved behaviors (§2).

You may replace the whole §3.3 cluster, the host pin (§3.6), and any CSS with a DIFFERENT, simpler architecture if your analysis says so — host-side code is ours and in scope. The iframe cannot prevent iOS from panning the top window; whatever you design must either (1) make iOS never want to pan (leave it nothing to reveal, reliably, including the race it lost at N024), (2) make the pan visually harmless when it happens (follow/compensate WITHOUT fighting — the yank-back `scrollTo` per event is a known-bad feel), or (3) something better you find. State clearly which layer(s) your fix lives in (app JS/CSS, host TSX/CSS) and why the other layers don't need to change.

## 7. Output contract (your reply, markdown)

1. `## Timeline` — the reconstructed event timeline (compact list).
2. `## Movement mechanisms` — scenarios (a) tap-below-center with keyboard open, (b) keyboard closed→opens on a low tap, (c) standalone vs card, each: mechanism chain with Confirmed/Inferred/Assumed labels + the discriminating debug-meter observation.
3. `## Design` — candidates considered (≥3, one-line tradeoffs each), the chosen architecture, why it beats the others against §6 priorities, and what you assume.
4. `## Code` — COMPLETE replacement blocks, one per file, each preceded by a one-line path header (`--- quicknotes/js/app.js (section) ---`). Full functions, not diffs. Mark anything to DELETE with `/* DELETE: <name> */` on its own line. Keep existing code style (semicolons, compact one-line rules, rationale comments referencing N030).
5. `## Engine gates` — 4–7 deterministic checks the orchestrator can run in Chromium with stubbed `visualViewport` (they cannot prove iOS behavior; they prove mechanism wiring).
6. `## Owner device checklist` — the exact taps/expectations for the iPhone verdict, ≤8 items, including the `?debug=1` meter steps that collect the missing discriminating data (both contexts).
7. `## Confidence & risks` — what you could not determine without the device; what could regress.

Keep total reply under ~900 lines. Prioritize Code completeness over prose.
