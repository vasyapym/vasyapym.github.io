# BRIEF — Quicknotes N026: polish round on the device-approved keyboard model

You are a senior iOS-Safari web-architecture specialist. You have NO repo access — everything is here. You own the design decisions; do not ask for approvals. The orchestrator integrates your reply, runs engine gates (Chromium with stubbed visualViewport), and the owner does the final iPhone checks.

## 0. Milestone first (this changes your job)

**The movement bug is FIXED on device.** After six rounds (N016–N025) the owner confirms: "it appears to be fixed." The shipped model (N021, refined N022–N025):
- layout viewport STABLE (viewport meta `interactive-widget=resizes-visual`), the keyboard simply OVERLAPS the page;
- while a field is focused the textarea gets keyboard-height bottom padding (`--kb-h`) as caret scroll room;
- the caret is PRE-REVEALED inside the textarea (style-mirror measures its content Y; a 200ms tween lifts it above the keyboard zone);
- the container height is PINNED to `--app-v = window.innerHeight` and FROZEN while focused (the "static shell");
- no pin/translate/resizes anywhere else; footer just gets covered by the keyboard.

Your job now is NOT a rethink — it is a polish round on three defects the owner reported WITH the fixed build (all on iPhone 11, iOS 18.x Safari, standalone):

- **P1 — "after tapping/clicking a text there's free space below."** Screenshot shows: note text → footer "1 notes · 0 folders" → then a ~400px EMPTY dark area → Safari's bottom URL bar. Keyboard closed in the shot. Orchestrator's analysis (verify, then decide): the container height pin `--app-v = window.innerHeight` froze a value while focused; on THIS build `window.innerHeight` appears to shrink when the keyboard opens (the frozen pin then captured the shrunken value), and after dismissal the app re-pinned too late or captured mid-animation values — leaving the container shorter than the screen (the gap). Second contributor: `--kb-h` (~266px estimate) padding keeps the textarea short of its bottom while focused — visible as empty space above the keyboard after a mid-text tap.
- **P2 — "scrolls are very rapid and seems chaotic (not smooth)."** Suspects in the current code (below): (a) `revealCaret()`'s 200ms scrollTop tween fires on every `selectionchange` and can fight iOS's own textarea scrolling/momentum (an external scrollTop write kills native momentum); (b) the header auto-hide toggles `margin-top` on scroll-direction flips (chaotic feel); (c) `--app-v` re-pinning mid-scroll causes reflows. Diagnose the dominant one and fix.
- **P3 — the `?debug=1`/`#debug` viewport meter never showed on device** (owner screenshot lacks it; they report "top left panel I can't see"). Verify the wiring below and state why it could fail (e.g. hash/query edge cases, module-load errors, cache) and how to make it bulletproof.

## 1. Current code (verbatim — the cluster you are polishing)

```js
const narrow = matchMedia("(max-width:760px)"); // also focusEl defined near file top
const FIELD = /^(INPUT|TEXTAREA|SELECT)$/;
const fieldFocused = () => FIELD.test(document.activeElement?.tagName || "");

// keyboard height = stable layout height − shrunken visual height
function currentKbHeight() {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height));
}
function setKbHeight(px) {
  document.documentElement.style.setProperty("--kb-h", (px || 0) + "px");
}

// ---- N024: rigid container height ----
function pinBodyHeight() {
  if (!narrow.matches) { document.documentElement.style.removeProperty("--app-v"); return; }
  if (fieldFocused()) return; // frozen mid-focus: the shell cannot flex while typing
  document.documentElement.style.setProperty("--app-v", window.innerHeight + "px");
}

// ---- single rAF-throttled vv reader ----
let vvQueued = false;
function readViewport() {
  pinBodyHeight();
  if (narrow.matches && fieldFocused()) setKbHeight(currentKbHeight());
  revealCaret(); // real keyboard height has landed — re-aim the caret
  fitPalette(); // command-palette dialog placement (reads vv.offsetTop/height)
}
function onVV() {
  if (vvQueued) return;
  vvQueued = true;
  requestAnimationFrame(() => { vvQueued = false; readViewport(); });
}
window.visualViewport?.addEventListener("resize", onVV);
window.visualViewport?.addEventListener("scroll", onVV);
narrow.addEventListener?.("change", onVV);

// ---- N022: pre-reveal the caret INSIDE the textarea ----
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
  dot.textContent = "\u200b";
  m.appendChild(dot);
  if (!m.parentNode) document.body.appendChild(m);
  return dot.offsetTop + dot.offsetHeight;
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
  const kb = currentKbHeight() || Math.round(window.innerHeight * 0.4);
  const visible = ta.clientHeight - kb;
  if (visible <= 0) return;
  const caretY = caretContentY();
  const desired = Math.round(caretY - visible + 20);
  const max = Math.max(0, ta.scrollHeight - ta.clientHeight);
  const to = Math.max(0, Math.min(desired, max));
  if (to > ta.scrollTop + 2) tweenScrollTo(ta, to); // high taps: no-op
}
let caretQueued = false;
document.addEventListener("selectionchange", () => {
  if (document.activeElement !== el.body) return;
  if (caretQueued) return;
  caretQueued = true;
  requestAnimationFrame(() => { caretQueued = false; revealCaret(); });
});

// ---- focus in/out ----
document.addEventListener("focusin", e => {
  if (!narrow.matches || !FIELD.test(e.target.tagName)) return;
  setKbHeight(currentKbHeight() || Math.round(window.innerHeight * 0.4));
  document.body.classList.add("kb");
  requestAnimationFrame(revealCaret);
});
document.addEventListener("focusout", () => {
  if (!narrow.matches) return;
  setTimeout(() => {
    if (fieldFocused()) return;
    document.body.classList.remove("kb");
    setKbHeight(0);
    flushPersist();
  }, 60);
});
```

Relevant CSS (mobile `max-width:760px` block + coarse block):

```css
body{display:grid;grid-template-rows:auto 1fr auto;height:100vh;height:100dvh}
@media (max-width:760px){
  body{height:var(--app-v,100dvh)}          /* N024 pin */
  body.kb #body{padding-bottom:calc(16px + env(safe-area-inset-bottom) + var(--kb-h,0px))}
  body.header-hidden #top{margin-top:calc(-1 * var(--top-h,96px))}
  #top{transition:margin-top .24s cubic-bezier(.2,.8,.2,1)}
  #body{padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom));line-height:1.5}
  #status{padding:6px 12px calc(6px + env(safe-area-inset-bottom))}
}
@media (hover:none) and (pointer:coarse){ #search,#body{font-size:13px} #path{font-size:13px} }
```

Header auto-hide (unchanged, owner-approved): scroll-direction listener on `#tree/#body/#preview` — hide on pan-down >2px (depth>60px), show on pan-up; caret-reveal-class scrolls (within 250ms of a tap/input, finger up) are suppressed; `#search:focus` unhides.

Boot: `pinBodyHeight(); onVV();` and (only with `?debug` or `#debug` in the URL) a fixed green monospace meter reading innerHeight, vv.height/offsetTop/scale, scrollY, body rect top/bottom/height, --kb-h, --app-v per frame.

## 2. Constraints (unchanged)

Plain ES modules, no build step, no libraries; must work standalone AND in a same-origin iframe (catalogue card); keep 13px idle fonts, `maximum-scale=1`, dark palette, header auto-hide, footer visible when keyboard closed; no in-app Done button (system accessory bar exists — owner-confirmed); iOS 15+ features only. The orchestrator cannot emulate the iOS keyboard — designs must be robust to unknown timing, and the device checklist closes.

## 3. Confirmed device facts (from the owner's tests)

1. The plain-website model ends the self-movement bug — keep its skeleton (stable layout, keyboard overlaps, padding-as-scroll-room, caret pre-reveal).
2. `window.innerHeight` on this device/build appears KEYBOARD-SENSITIVE (the frozen `--app-v` captured a shrunken value — the gap under the footer). Verify this reading; if innerHeight is keyboard-sensitive, the container height strategy must recover correctly on dismiss WITHOUT visible motion.
3. The owner REJECTED font-size changes on focus (must stay 13px), rejected fighting the pan, rejected compensating translates.
4. Owner priorities now: (1) calm, SMOOTH scrolling; (2) no stray gaps/free space; (3) a working on-device meter.

## 4. Output contract (markdown)

1. `## Diagnosis` — P1/P2/P3 each: mechanism chain, ranked; what discriminates on device.
2. `## Design` — chosen refinements; explicit list of what changes vs the code above (be conservative — the model is approved; polish, don't redesign).
3. `## Code` — complete replacement blocks with `--- quicknotes/js/app.js (section) ---` style headers; full functions, not diffs; `/* DELETE: name */` lines for removals.
4. `## Engine gates` — 4–7 deterministic Chromium checks (stubbed vv).
5. `## Owner device checklist` — ≤8 items incl. a repeat of the previously-fixed scenarios (no movement on low/high taps, exact dismiss return).
6. `## Confidence & risks`.

Keep the reply under ~700 lines; prioritize complete code over prose.
