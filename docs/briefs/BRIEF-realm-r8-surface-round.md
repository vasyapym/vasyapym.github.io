# BRIEF — realm r8, deliverable D1: surface round (exit tone + chip entrance)

Relay brief for the chat model. You have **full design and code autonomy** inside the
pinned contract below — no approval gates, no clarifying questions. Commit to one
design and one set of code blocks. The only thing we require is that your reasoning is
shown in full before the deliverable, at the depth specified in §3 — for each of the
two problems separately.

---

## 1. Situation

The landing page (`portfolio/shell`) has "the deep" — an opt-in immersive realm over
an ink-toned catalogue. Entry points: an in-flow threshold section mid-page and a
fixed "enter the deep" chip that appears once scroll passes the threshold section's
bottom edge. While the realm is open the landing is inert and the page body is locked
fixed; on exit the realm layer fades out over 600ms and unmounts, restoring scroll.

This round is an owner bug+UX round with four items; this deliverable (D1) owns the
two **landing-side** items. The other two (in-realm interaction) go in a later
deliverable — ignore them here.

### Item A — the exit tone shift (owner report)

> "When exiting 'deep' mode, the main page background tone shifts noticeably — this
> is most apparent on the hero section where the colour change is clearly visible.
> Entering deep mode already has a transition that smooths this over, but exiting has
> none. Add a comparable transition when surfacing out so the shift feels gradual
> rather than instant, though it shouldn't be the same transition."

**Diagnosis already done (headless Chrome, measured).** The abrupt shift is a state
bug, not a missing transition. The exit already owns a 600ms whole-layer opacity
envelope (`.realm-exit-layer` + `.realm--surfacing`) plus a scene-side ink vortex
drain — different from the entering flood (ink splashes growing to full cover). What
makes the exit read as "instant" is that two landing-side tone variables are
**clobbered during the session and snap back at unmount**:

1. **`--hero-exit` is clobbered to 0 the moment the realm opens.** The hero fades
   with scroll via `--hero-exit` (hero opacity = `calc(1 - var(--hero-exit, 0))`),
   driven by a scroll effect that reads `window.scrollY`. When the realm opens, the
   body is made `position: fixed`; the document's scrollable height collapses, the
   browser clamps scroll to 0, and the resulting scroll event reaches the unguarded
   effect, which reads `scrollY = 0` and writes `--hero-exit: 0`. The hero jumps to
   full opacity while hidden. During the exit fade the hero region beneath is
   therefore **bright** (wrong tone); at unmount, body restore + `scrollTo(restored)`
   re-fires the effect and the hero **snaps** to its correct dimmed value. Measured
   (desktop 1440×900, threshold entry at scrollY 538):

   - PRE (landing, before enter): `--hero-exit 0.6642`, hero opacity 0.3358
   - OPEN (realm active): `--hero-exit 0.0000`, hero opacity 1  ← clobbered
   - during exit fade: unchanged 0.0000 (bright hero under the fading layer)
   - after unmount: `--hero-exit 0.6642`, hero opacity 0.3358 ← the snap

   On iOS Safari this fires additionally on every URL-bar collapse/expand during the
   session (window resize → same unguarded update).

2. **The bottom floor snaps at unmount.** `.realm-bottom-floor` (fixed black gradient
   ramping in over the last stretch of scroll, opacity = `--realm-floor` CSS var) is
   forced to inline `opacity: 0` while the realm is open, and the inline style is
   removed at unmount — at a chip-entry position (page end) the gradient pops in
   from 0 to 1 in one frame, right after the fade completes. Measured: floor
   opacity 0 during the whole fade → 1 immediately after unmount.

The scene canvases are irrelevant here: in "abyss" mode the GL canvas writes an opaque
sea, so the layer is opaque during the session; during the 600ms surfacing fade the
landing fades in beneath it. Fixing the two clobbers makes the existing envelope read
as the gradual exit the owner asks for. You may additionally polish the exit
choreography inside the pinned contract.

### Item B — the chip's entrance (owner report)

> "The 'enter the deep' button (bottom right) appears instantly without any
> transition when you scroll down, which can feel abrupt in contrast to the rest of
> the UI. Add a subtle entrance animation — fade, scale, or similar — so it arrives
> smoothly."

Current state: the chip's visibility is one reversible scroll law (`is-visible`
class added/removed when scroll passes the threshold section's bottom edge). The
class flips `opacity 0↔1` and `visibility hidden↔visible`; the only transition is
`opacity 160ms ease`, which the owner perceives as instant (and which platforms may
skip entirely mid-scroll). The class also gates `pointer-events`, `disabled`,
`inert`, `aria-hidden` and `tabIndex` in JSX — that a11y contract stays exactly as
is; the animation is cosmetic only. The same class re-add fires when the chip
reappears after a realm exit, so the entrance animation serves both arrivals.

## 2. Design laws (the household style — violations reject the work)

- `--ink-*` tokens only: `--ink-bg #0b1317`, `--ink-text #eeeae0`,
  `--ink-muted rgba(238,234,224,.68)`, `--ink-faint rgba(238,234,224,.48)`,
  `--ink-line rgba(238,234,224,.26)`, `--ink-line-soft rgba(238,234,224,.13)`,
  `--ink-accent #d39b61`, `--ink-accent-bright #e8b57c`, `--ink-accent-deep #b97f45`,
  `--panel-radius: 20px`. Chip chrome: `--mono`, 12px lowercase (11px ≤767px).
- Lowercase mono chrome, 1px hairlines only. **No blur, no glow shadows, no soft or
  saturated gradients.** Ochre is the only interactive signal. No infinite loops.
- Reduced motion = settled/inert by default (the existing reduced-motion rules must
  keep winning).
- The chip keeps its hard geometry: `border-radius: 0`, flat `#0b1317` plate,
  1px top border, fixed bottom-right, safe-area aware. Only its arrival/departure
  motion may change.
- Reversibility: the scroll law stays one reversible rule on every viewport class.
  Hiding on scroll-back may stay prompt; whatever easing you add must never leave
  the chip interactable after the class is gone (pointer-events/inert gating lives
  in the class contract, not in the animation).

## 3. Reasoning protocol (mandatory, shown in your reply — per problem)

Work in this exact order and show each phase in full, once for Item A, once for
Item B. Depth here is the deliverable's quality bar — superficial output will be
rejected.

1. **Restate** the problem in your own words, including the measured mechanism and
   why it reads as "no transition" despite the existing 600ms envelope (Item A) /
   160ms opacity (Item B).
2. **Generate wide:** at least **5 materially distinct directions** each. Distinct
   means different mechanisms, not one idea with five tweaks. Sketch each in 2–4
   sentences (mechanism + what the eye sees).
3. **Prune in the open:** kill directions against explicit criteria — the design
   laws (§2), minimality (fewer moving parts beats more), the scroll-locked body
   context, iOS Safari behaviour (URL-bar resizes mid-session; reduced motion),
   and the accumulated r6 laws (the realm's own envelope owns all visual change
   during surfacing; the landing must not animate underneath the realm). Say why
   each one dies. Keep the strongest 1–2.
4. **Develop to depth:** for the survivor(s), state **every concrete value** —
   properties, durations, curves, exact CSS/TSX — with a one-line why for each
   number. No placeholders, no "adjust to taste".
5. **Stress-test:** walk the survivor through: chip entry (threshold) + page-end
   entry; exit from each entry position; scroll-back hide; iOS URL-bar resize
   mid-session; reduced motion; rapid enter→exit→enter; window resize during the
   session. Name what could break and why it doesn't.
6. **Rank and commit:** one paragraph, then the final deliverable. You decide — do
   not end with options, do not ask for approval.

## 4. Pinned contract (non-negotiable)

- **Item A lives in `LandingPage.tsx` only** — the hero-exit scroll effect and the
  floor element. You may not touch RealmMode, the scene, or the CSS envelope
  (`.realm-exit-layer`/`.realm--surfacing`) — the r6 law ("the envelope owns the
  exit reveal") is settled. The fix must make `--hero-exit` keep its pre-open value
  for the whole session and recompute correctly on close, and must remove the
  floor's snap without re-exposing whatever the inline override once guarded
  (state the risk and why it's covered).
- **Item B is the chip's transition block in `realm.css`** (§5A below). The
  class-toggle JS, the a11y attributes and the `is-visible` semantics stay
  untouched. If you need a JS change, argue it — the default is CSS-only.
- All motion must be **reduced-motion settled**: under `prefers-reduced-motion:
  reduce` nothing animates (existing rules keep that; extend them if you add
  properties).

## 5. Current code (verbatim — the only context you get)

### 5A. The chip block you may replace (realm.css)

```css
/* ── fixed strip: the existing mobile presentation at every width ── */
.realm-enter-chip {
  position: fixed;
  z-index: 30;
  top: auto;
  right: calc(12px + env(safe-area-inset-right, 0px));
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 188px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  max-width: calc(100vw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px));
  margin: 0;
  padding: 0 12px;
  appearance: none;
  border: 0;
  border-top: 1px solid rgba(238, 234, 224, 0.26);
  border-radius: 0;
  background: #0b1317;
  box-shadow: none;
  color: rgb(238, 234, 224);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.25;
  letter-spacing: 0;
  text-align: center;
  text-transform: lowercase;
  cursor: pointer;
  touch-action: manipulation;
  transform: none;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 160ms ease;
}
.realm-enter-chip.is-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
.realm-enter-chip .realm-index,
.realm-enter-chip .realm-chip-caption,
.realm-enter-chip .realm-end {
  display: none;
}
.realm-enter-chip .realm-copy {
  display: block;
  padding: 0;
  writing-mode: horizontal-tb;
  white-space: nowrap;
  color: inherit;
  opacity: 0.82;
}
/* No perpetual attention loop: visibility marks location; ochre marks intent. */
.realm-enter-chip:disabled {
  cursor: default;
}
.realm-enter-chip:hover {
  color: #d39b61;
}
.realm-enter-chip:active {
  color: #e8b57c;
  transform: none;
}
.realm-enter-chip:focus-visible {
  color: #e8b57c;
  outline: 2px solid #e8b57c;
  outline-offset: -3px;
}
.realm-enter-chip:is(:hover, :focus-visible, :active) .realm-copy {
  animation: none;
  opacity: 1;
}
```

The reduced-motion block later in the same file:

```css
@media (prefers-reduced-motion: reduce) {
  .realm-enter-chip,
  .realm-enter-chip .realm-copy {
    transition: none;
    animation: none;
  }

  .signal-index.signal-index-reveal-ready .realm-threshold::before {
    transform: none;
    transition: none;
  }
}
```

### 5B. The hero-exit effect you may change (LandingPage.tsx)

```tsx
useEffect(() => {
  const hero = heroRef.current;
  if (!hero) {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  let frame = 0;
  let cancelled = false;
  let lastValue = -1;

  const update = () => {
    frame = 0;
    if (cancelled) {
      return;
    }
    const span = hero.offsetHeight * 0.9;
    const ratio = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
    if (Math.abs(ratio - lastValue) < 0.004) {
      return;
    }
    lastValue = ratio;
    hero.style.setProperty("--hero-exit", ratio.toFixed(4));
  };

  const schedule = () => {
    if (frame !== 0 || cancelled) {
      return;
    }
    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });

  return () => {
    cancelled = true;
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
    }
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  };
}, []);
```

`realmOpen` is the component's `useState<boolean>`; the sibling chip/floor effect
already uses the pattern `if (cancelled || realmOpen) return;` with `[realmOpen]`
deps — mirror it or argue better.

### 5C. The floor element (LandingPage.tsx)

```tsx
<div
  className="realm-bottom-floor"
  ref={realmFloorRef}
  style={{ opacity: realmOpen ? 0 : undefined }}
  aria-hidden="true"
/>
```

Its CSS (same file, not to be changed unless argued):

```css
.realm-bottom-floor {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: clamp(7rem, 22vh, 12rem);
  z-index: 20;
  pointer-events: none;
  opacity: var(--realm-floor, 0);
  background: linear-gradient(to top, #020609, rgba(2, 6, 9, 0));
}
```

## 6. Deliverable

One reply containing, in this order:

1. The full shown reasoning chain for Item A (§3), ending with
   `COMMITTED A: <one-line name of the direction>`.
2. The exact `LandingPage.tsx` changes for Item A as **complete replacement code
   blocks** — for each touched region, quote the verbatim current lines (from §5)
   and give the verbatim replacement. Include the new effect dependency arrays
   exactly. No "…" elisions inside code.
3. The full shown reasoning chain for Item B, ending with
   `COMMITTED B: <one-line name of the direction>`.
4. One fenced ```css block: the complete replacement for the chip block in §5A
   (from the `/* ── fixed strip:` marker comment to the `:is(:hover…)` rule
   inclusive), plus whatever you add to / keep of the reduced-motion block shown
   above as a separate fenced block if it changes.

Integration (not your job, for context): the orchestrator splices the edits into
LandingPage.tsx / realm.css, then runs the type check, production build, the
realm-probe behavioural suite (extended with exit-tone gates), and before/after
frame captures of the exit sequence.
