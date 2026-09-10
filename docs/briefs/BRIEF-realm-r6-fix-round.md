# BRIEF — realm r6, deliverable 1 of 2: panel visibility regression, close-button centering, exit reveal smoothness

You are the design/code specialist in a relay loop. The orchestrator owns the
repository and integrates your patch; you have no repo access. Everything you
need is in this document. Work autonomously: you choose techniques, states and
numbers inside the stated constraints — no approval gates. What we need from
you is *reasoned* output: show the thinking, then the patch.

## How to work (mandatory — this round is about depth, not speed)

1. **Restate** each problem in your own words and derive the root cause from
   the code/evidence below (mechanism, not vibes).
2. **Walk the state machine on paper.** For every fix, simulate the exact
   sequence: closed → opening (double-rAF + is-open) → open → close →
   leave (envelope fade) → unmount → landing restored → focus restore —
   and assert the expected computed styles at each step for desktop, mobile,
   reduced-motion. Write this walk down. It is your primary self-verification.
3. **Enumerate** 2–3 candidate approaches per problem with mechanism /
   tradeoffs / risks; choose and say why the others lose.
4. **Deliver** the patch in the FIND/REPLACE format at the end, plus residual
   risks for the orchestrator to verify.

## Background you cannot infer

"the deep" is an opt-in immersive mode over the portfolio landing page
(Dark-Souls-flavoured). React shell = `RealmMode.tsx`; chrome = `realm.css`.
Design language: flat near-black scrims, 1px hairlines, lowercase IBM Plex
Mono, hard edges, ochre `--ink-accent` as the single interactive signal, no
glow/blur in DOM chrome. The lantern is the cursor. WebGL fluid on a canvas
below the DOM. The landing page (`LandingPage.tsx`) hosts an in-flow
"threshold" section between hero and cards — currently the `rt-f` variant
("the same seven": a framed panel with an abyss-black lower ground, a two-line
Unbounded headline, and the `enter the deep` control sitting on the seam) —
plus a fixed bottom-right chip that appears past the threshold under one
reversible scroll law.

**Panel contract (since r5 pass D, in RealmMode.tsx — not changing):** the
`.realm-panel` wrapper is ALWAYS mounted with pinned final geometry. Its
content is conditional (only when a project is open). JS owns the state via
classes/attributes only: closed = `inert` + `aria-hidden="true"` + NO
`.is-open` class; open = class `is-open` added after a double-rAF; the close
button is focused after the opacity transition ends (JS reads the computed
`transition-duration`). React never toggles panel visibility inline.

**Exit choreography (RealmMode.tsx):** on leave the layer element (which
carries both classes `realm-layer` and `realm-exit-layer`, plus the attribute
`data-realm-leaving` set to `"true"` when leaving) gets class
`realm--surfacing`; JS listens for one `opacity` `transitionend` on that
layer, with a 1500ms watchdog fallback; exit fires 150ms after visual
completion; then React unmounts the layer, restores body scroll, and
LandingPage restores focus to the entry control that activated the realm
(fallback: the threshold section button).

Three owner reports, all reproducible at current HEAD:

- (a) Desktop, on entering the realm: the project-card "description" section
  appears pre-opened but blank. (This is the panel wrapper visible with no
  content — see Problem 1.)
- (b) macOS Safari: the open card description cannot be closed — it stays.
  (Same root: removing `.is-open` has no visual effect because the closed-state
  CSS does not exist.)
- (c) Windows Edge: on leaving "the deep", the threshold section's
  `enter the deep` text is absent during the exit transition and appears
  (snaps in) only after it. Not smooth.

## Problem 1 — the panel is permanently visible (regression)

Commit `a01866a` rewrote `realm.css` for a threshold redesign and accidentally
reverted the panel block to the pre-pass-D styling, dropping the whole
closed-state contract. A later commit (`97fcffc`, another threshold pass)
left these blocks untouched. Consequences (measured in headless Chrome):

- Desktop 1440×900, nothing open: `.realm-panel` computed opacity **1**,
  visible, rect 480×900 — a permanently visible near-black right sheet with
  only the X button, covering a third of the world (the owner's "pre-opened
  but blank card").
- Mobile 390×844, nothing open: `.realm-panel` visible as a 390×45.8px band
  pinned to the bottom edge, sitting on top of the door-legend strip; with a
  project open it grows to 48% height and obscures the lower water.
- With a project open, pressing the X (or esc) removes `.is-open` and the
  content — but nothing visually closes (the owner's "can't close, it stays").

The TSX side is correct and must not be re-architected; the CSS must be
restored to the pass-D contract. The pre-regression CSS is provided verbatim
below as the restoration baseline. Small reasoned adjustments are fine, but
the closed-state class contract (`.is-open`), the
`[data-realm-leaving="true"]` defense, the pinned geometry and the
"no animation on the persistent wrapper" rule are non-negotiable (they exist
to kill an iOS Safari insert-flash; a transform/animation on the wrapper
re-introduces it).

### CURRENT (regressed) `realm.css` — the panel block

```css
/* ── panel (right sheet, only while a creature is open) ─────── */
.realm-panel {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 70;
  display: flex;
  flex-direction: column;
  width: min(30rem, 92vw);
  height: 100%;
  padding: 1.4rem 1.3rem calc(1.4rem + env(safe-area-inset-bottom));
  background: rgba(4, 8, 11, 0.92);
  border-left: 1px solid var(--ink-line);
  overflow-y: auto;
  cursor: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--ink-line) transparent;
  animation: realm-panel-in 0.28s ease both;
}
@keyframes realm-panel-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
.realm-reduced .realm-panel {
  animation: realm-panel-fade 0.24s linear both;
}
@keyframes realm-panel-fade { from { opacity: 0; } to { opacity: 1; } }
.realm-panel::-webkit-scrollbar { width: 7px; }
.realm-panel::-webkit-scrollbar-thumb { background: var(--ink-line); }
.realm-panel::-webkit-scrollbar-track { background: transparent; }
```

### CURRENT (regressed) mobile block (inside `@media (max-width: 520px)`)

The media block also contains (unchanged, keep) `.realm-layer { top:
var(--realm-visible-top, 0px); bottom: auto; height: 100vh; height: 100dvh;
height: var(--realm-visible-height, 100dvh); }` and the legend/caption rules.
The regressed panel part inside it:

```css
  .realm-layer .realm-panel {
    box-sizing: border-box;
    min-height: 0;
    max-height: 48%;
    padding-bottom: calc(1.4rem + env(safe-area-inset-bottom, 0px));
  }
```

… and, later in the same media block (after the legend rules):

```css
  .realm-panel {
    top: auto;
    right: 0;
    left: 0;
    bottom: 0;
    width: 100%;
    height: auto;
    max-height: 72%;
    border-left: none;
    border-top: 1px solid var(--ink-line);
    padding-bottom: calc(1.4rem + env(safe-area-inset-bottom));
    animation: realm-panel-in-mobile 0.28s ease both;
  }
  @keyframes realm-panel-in-mobile {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  .realm-reduced .realm-panel { animation: realm-panel-fade 0.24s linear both; }
```

(Note the conflict: `.realm-layer .realm-panel` says max-height 48%, the later
`.realm-panel` says 72% — dead code by specificity.)

### PRE-REGRESSION panel block (restore baseline — verbatim from the good tree)

```css
/* ── panel (persistent right sheet; content opens via .is-open) ──
   The wrapper stays mounted with pinned offsets so no insertion can ever
   paint a misplaced sheet: the static state is hidden, transparent and
   unanimated; the entrance is a class-added opacity transition. */
.realm-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: calc(100% - min(30rem, 92%));
  z-index: 70;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(30rem, 92%);
  height: 100%;
  min-height: 0;
  max-height: 100%;

  padding: 1.4rem 1.3rem calc(1.4rem + env(safe-area-inset-bottom, 0px));
  background: #04080b;
  border: 0;
  border-left: 1px solid var(--ink-line);

  overflow-y: auto;
  overscroll-behavior: contain;
  cursor: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--ink-line) transparent;

  /* independent of animation startup or js scheduling */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: none;
  animation: none;
  transition: none;
}
.realm-panel.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: opacity 0.28s ease;
}
.realm-reduced .realm-panel.is-open {
  transition: opacity 0.24s linear;
}
/* defense independent of entrance callbacks */
.realm-layer[data-realm-leaving="true"] .realm-panel {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: none;
  animation: none;
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .realm-panel.is-open {
    transition: opacity 0.24s linear;
  }
}
```

### PRE-REGRESSION mobile panel geometry (inside the same `@media (max-width: 520px)`, replacing the regressed parts above)

```css
  .realm-layer .realm-panel {
    top: 52%;
    right: 0;
    bottom: 0;
    left: 0;

    box-sizing: border-box;
    width: 100%;
    height: 48%;
    min-height: 0;
    max-height: 48%;

    padding: 1.4rem 1.3rem calc(1.4rem + env(safe-area-inset-bottom, 0px));
    border: 0;
    border-top: 1px solid var(--ink-line);
  }
```

### The dropped surface-exit envelope (restore; belongs near the end of the file, after the mobile media block)

The layer currently has NO exit transition at all: `.realm-exit-layer` /
`.realm--surfacing` rules are entirely absent from `realm.css`, so the leave
never fades and every exit takes the 1500ms watchdog path (which also
explains a probe focus-race flake history). Restore:

```css
/* ── surface exit: one opacity envelope for the whole dialog layer ──
   The layer (canvas + chrome + scrim) fades together; the old canvas-only
   fade is overridden while surface owns the transition so the two curves
   never stack. Dive keeps its own iris choreography. */
.realm-exit-layer {
  opacity: 1;
  transition: opacity 600ms cubic-bezier(0.22, 1, 0.36, 1);
}

.realm-exit-layer.realm--surfacing {
  opacity: 0;
}

.realm-exit-layer.realm--surfacing .realm-gl--fade {
  opacity: 1;
  transition: none;
}

.realm-reduced .realm-exit-layer {
  transition: opacity 240ms linear;
}

@media (prefers-reduced-motion: reduce) {
  .realm-exit-layer {
    transition: opacity 240ms linear;
  }
}
```

(For completeness: the current `.realm-layer` rule lost `isolation: isolate;
box-sizing: border-box;` too — restore both inside the existing `.realm-layer`
rule; harmless, part of the pass-D state.)

## Problem 2 — the X close button is not optically centered in its circular container

`.realm-panel-close` is a 2rem×2rem button, `border-radius:
var(--panel-radius)` where `--panel-radius: 20px` → clamps to a 16px radius on
a 32px box = a circle. Content is the text node `×` (U+00D7), centered via
`display: grid; place-items: center`, font 16px IBM Plex Mono, line-height
normal.

Measured ink metrics at 16px IBM Plex Mono (canvas measureText, Chromium):
advance 9.6px; ink box `[-1.408, +8.192]` relative to the text origin (ink
center at 3.39px of the 9.6px advance → ~1.4px LEFT of geometric center);
ink ascent 8.27px, descent −1.49px (ink sits fully above the baseline;
half-leading model puts its visual center ≈0.7–1.1px off vertically). At DPR
2–3 (iOS) that reads clearly off-center. Worse: on iOS the webfont may not be
applied at first paint (Google Fonts, FOUT) — fallback fonts
(ui-monospace/SF Mono, monospace) have different metrics, so any
font-specific optical nudge (e.g. translate 1px) is NOT a robust fix.

Requirements for your fix:

- Optically centered in the circle on iOS Safari/Chrome, macOS Safari, and
  desktop Chrome/Edge — deterministically, independent of which font is
  loaded.
- Keep the button's hairline design language (1px `--ink-line` border, ochre
  on hover/focus). You may replace the text glyph with an inline SVG (two
  strokes; the codebase already uses inline SVG in the enter chip) or use
  another deterministic technique — your call; justify it.
- The button is the first focus target of the panel (esc-chain,
  focus-on-open). Keep/restore `aria-label="close"`. If you think the 32px
  touch target is a problem on mobile, a hit-area expansion is acceptable —
  keep the visual circle 2rem unless you argue otherwise.
- Do not change the button's class name or its `ref`/`onClick` wiring.

## Problem 3 — the exit reveal of the threshold entry is not smooth (Edge report)

The threshold entry control (`realm-threshold-enter`, class sits on a button
in the rt-f section; visible text `enter the deep` in a `.rt-f-entry-copy`
span) must read as smoothly returning when the realm exits. Current facts:

1. The exit animation itself is currently broken (Problem 1's dropped
   envelope): the layer never fades; it hard-disappears at the 1.5s watchdog.
   With the envelope restored, the layer fades over 600ms.
2. During the whole realm session, LandingPage marks the shell
   `.signal-index-shell` with `aria-hidden` + `inert` and the button with
   `disabled={realmOpen}`. The rt-f CSS dims the disabled control:

```css
/* Keep the seam mask opaque when the entry is unavailable. */
.realm-threshold.rt-f .realm-threshold-enter:disabled {
  opacity: 1;
  cursor: default;
}

.realm-threshold.rt-f
  .realm-threshold-enter:disabled::before,
.realm-threshold.rt-f
  .realm-threshold-enter:disabled
  .rt-f-entry-copy {
  opacity: .38;
}
```

   The `disabled` state lifts only when `realmOpen` flips false — at
   unmount, i.e. AFTER the exit transition. The dim (0.38 on near-black —
   reads as "absent") snaps to full opacity with `transition: none` on the
   button. That is the "text absent, appears after the transition" report.
   (The previously-deployed threshold variant hard-hid the button with
   `visibility: hidden` while immersed — same category of bug, different
   mechanism; the deployed site rebuilds from main on every push, so fix
   against the current rt-f markup but keep the law variant-agnostic.)

3. The layer element already carries `data-realm-leaving="true"` during the
   exit (set by RealmMode); the shell does not mirror it. Relevant wiring:

```tsx
// LandingPage.tsx (shell)
<div
  className="signal-index-shell"
  aria-hidden={realmOpen || undefined}
  inert={realmOpen || undefined}
>
```

```tsx
// LandingPage.tsx (threshold entry control)
<button
  ref={realmSectionEnterRef}
  className="realm-threshold-enter"
  type="button"
  onClick={handleRealmEnter}
  disabled={realmOpen}
  aria-label="enter the deep — enter the immersive realm"
>
  <span className="rt-f-entry-copy">enter the deep</span>
</button>
```

```tsx
// RealmMode.tsx (doLeave — the leaving handoff point)
const doLeave = useCallback(() => {
  if (
    phaseRef.current === "leaving" ||
    phaseRef.current === "diving"
  ) return;

  phaseRef.current = "leaving";
  cancelRealmGestureRef.current?.(); // an in-flight gesture must not survive departure
  setOpenId(null);
  setPhase("leaving");

  leaveGateRef.current?.begin();

  const entry = entryRef.current;
  const scene = sceneRef.current;
  if (scene) {
    scene.startLeave(entry.x, entry.y); // reuse entry as the chip-equivalent
  } else {
    leaveGateRef.current?.sceneDone();
  }
}, []);
```

   RealmMode's props today: `{ projects, onOpenProject, onExit, entry }`.
   Extending them with a leaving notification (e.g. optional `onLeaving`)
   is allowed if you justify it — keep it strictly additive and call it
   exactly once per leave, at the moment `data-realm-leaving` flips true.
   Guard against double-invocation (dive/leave re-entry) the way `doLeave`
   already guards.

Design law to respect (the "immersion shell" a11y law): while the realm is
open — INCLUDING entering and active — the shell stays `inert` +
`aria-hidden="true"` and the button stays `disabled`. What must change is
only the *visual* strength timing: during the leave fade the control should
already read at (or smoothly arrive at) full strength, so the landing does
not snap when the layer unmounts. Candidates you should weigh (choose or
improve): (a) drop the dim entirely and rely on inert+disabled for the a11y
law (simplest; check the seam-mask intent the dim was serving — the button
background is a two-ground hard-stop mask over a hairline; at full opacity
during entering it sits under the flood anyway); (b) keep the dim for
enter/active but undim during the leave fade via a mirrored
`data-realm-leaving` attribute on the shell (needs the additive callback);
(c) your own variant (e.g. transition the dim over ~160ms and lift it
earlier). Whatever you pick: entering must not regress (the button may fade
or stay put under the flood — justify), and the focus-restore effect after
exit must still find the control usable (it checks `visibility ===
"visible"`, connectedness, not-disabled, and viewport containment — note
`inert`/`aria-hidden`/`disabled` all clear at unmount before the double-rAF
focus runs).

Also note: the fixed chip (`.realm-enter-chip`, bottom-right) already fades
via a 160ms opacity transition when `realmOpen` flips — the threshold control
should feel as intentional, not snappier than the layer fade it sits under.

## Must keep working (self-check before you deliver)

- Closed panel: computed opacity 0 / visibility hidden / pointer-events none,
  on desktop AND mobile, in both normal and `prefers-reduced-motion` mode.
- Open panel: class-added `is-open` transition (0.28s / 0.24s reduced) —
  RealmMode reads the computed transition duration to schedule focus, so the
  transition must be on `.realm-panel.is-open`, not on an animation.
- Mobile open geometry: sheet bottom == viewport bottom, top edge below 50%
  of the visible viewport (probe asserts this).
- Leave: the layer-level 600ms envelope plays (transitionend, not watchdog);
  the threshold control reads full-strength during that fade, no snap after.
- `[data-realm-leaving="true"]` hides the panel even if JS callbacks fail.
- No `transform`/keyframe animation ever applies to the persistent wrapper in
  its static state (the iOS insert-flash rule).
- Close button centered on fallback fonts too.
- Shell `inert`/`aria-hidden`/`disabled` law while immersed (probe asserts
  "shell inert while immersed" and "strip unavailable while immersed").
- Probe: 39 behavioural gates must pass (it now polls unmount/state instead
  of fixed waits).

## Output format (strict)

For each change:

```
FILE <path>
FIND
<exact current text, minimal unique snippet>
REPLACE
<replacement text>
WHY <one or two sentences>
```

Before the patches, include: the state-walk (item 2 of How to work), the
per-problem root cause + candidates + pick, and residual risks. Do not
include full files; do not invent code beyond the three problems. Keep the
total response focused — the orchestrator applies the patch mechanically and
then runs `tsc --noEmit`, `vite build`, `tests/realm-probe.mjs`, and
before/after screenshots (desktop closed/open/after-close, 390×844 mobile
closed/open, exit sequence frames).
