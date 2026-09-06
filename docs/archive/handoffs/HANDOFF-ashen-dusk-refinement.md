# HANDOFF — Ashen Dusk Theme Refinement (next session)

Written at the close of the session that delivered the hero-select polish and the
ashen art-direction gallery. Read top to bottom: state, the decision, the bug
evidence, then two ready-to-paste chat-model briefs (Deliverable A and B).

## Where things stand

All pushed to `origin/main` (verify with `git pull --ff-only origin main` first —
other agents share this tree; stage only your own paths).

- **Character select**: label is **CAT** (`theme.ts` `name: "cat"`), and the cat
  portrait is the **Inked Poster** (`KittyHK_b` from the delegated round) —
  measured Hello-Kitty skeleton (75×50 flat-wide head, face in the lower half,
  bow on the upper-right ear, pink pinafore over white shirt, no mouth) with the
  3px poster ink. Reference art committed at `reference-images/hello-kitty.png`.
- **`/art-directions`** (`portfolio/shell/src/design-directions/art-directions/`)
  hosts: the ashen round (incumbent + 9 candidates), the cat-portrait round
  (HK candidates a/b/c, the live pick marked, 10 concept cards kept below), and
  the older card-artwork rounds.
- Key files this thread touched: `kitty-run/web/lib/theme.ts`,
  `kitty-run/web/CharacterPortraits.tsx`,
  `shell/src/design-directions/art-directions/{ashenDirections,kittyPortraitRound}.tsx`,
  `art-directions.css`, `ArtDirections.tsx`.
- Project graph tip: `n46` (kitty-run graph). Commits eb99a15 → 198e53a.

## The decision (this session's close)

**Ashen Dusk (the current Dark Souls theme) is retained.** The Bloom survey pick
is superseded — the gallery now says so ("candidate 3 · survey pick (superseded)").
Do not implement Bloom. The candidates stay as a record of explored directions.

## Next-session objectives

1. **Visual/concept refinement of Ashen Dusk** — the direction is locked; the
   *specific refinement areas are to be defined at session start* (start by
   asking the owner or running Deliverable B1's slate and letting the owner
   mark what resonates). Preserve the ashen, muted, weathered atmosphere.
2. **Bugfix — background shift on audio controls** (below).

## Bug: background shifts when clicking Sound On/Off or Mix

Report: clicking the Sound On/Off button and the Mix button causes a slight
unintended movement/shift in the background; it should stay completely static.

Evidence gathered (KittyRunPage.tsx ~655-706, kitty-run.css 34-115):

- The mute button **swaps its label**: `{muted ? "sound off" : "sound on"}`
  ("sound off" is one char wider). `.kitty-run-mute` has `padding: 6px 14px`,
  `font: mono 0.72rem`, **no width/min-width** → the button box changes width on
  every toggle, shifting the right-aligned `.kitty-run-audio` cluster in
  `.kitty-run-intro` (flex, `align-items: end`).
- The mix panel is an **absolute popover** (`.kitty-run-mixpanel`,
  `position: absolute; right: 0; top: calc(100% + 8px)`) inside
  `.kitty-run-audio` (`position: relative`) — opening it should not reflow, but
  the `mixOpen` state change re-renders the whole page subtree.
- `.kitty-run-field { min-height: max(480px, calc(100vh - 61px)) }` + page
  `padding-bottom: 64px` — page usually scrolls; a scrollbar toggle would shift
  `width: min(1120px, 100%)` stage/canvas. macOS overlay scrollbars mask this.
- The stage/canvas itself has fixed height `clamp(420px, 66vh, 700px)` and
  `overflow: hidden`.

Fix directions to evaluate (in order of cheapness):

1. Give both audio buttons a fixed `min-width` (e.g. 7.5rem) so the label swap
   can't resize the box — or keep a constant-width label.
2. Confirm whether the shift is the header cluster moving vs. the canvas
   re-rendering (ResizeObserver/camera-aspect on a 1px stage change). If the
   canvas resizes, dedupe the resize handling in RunCanvas.
3. Check for a horizontal overflow when the mixpanel opens on narrow windows
   (popover `right: 0; min-width: 210px` against the page's right margin).

Verification: no system browser on this machine (puppeteer probes skip) —
verify by inspection + the owner's eyes on `/projects/kitty-run`.

## Deliverable A — chat-model brief: the audio-control shift fix

> You are fixing a UI bug in a React + CSS game page. You have no repo access;
> everything you need is below. Return code in the exact output format at the end.
>
> **Bug**: clicking the sound toggle and the mix button causes a slight unintended
> shift of the page's background/game area. Both buttons must be layout-stable.
>
> **Code** (React): the header is `display:flex; align-items:end; justify-content:
> space-between` containing the title and an audio cluster
> (`position:relative; display:flex; gap:8px`). The toggle's label swaps:
> `{muted ? "sound off" : "sound on"}`; the mix button toggles an absolutely
> positioned 3-slider popover (`position:absolute; right:0; top:calc(100% + 8px);
> min-width:210px`) rendered conditionally `{mixOpen && <div className=...>}`.
> Both buttons: `padding: 6px 14px; border: 1px solid; background: transparent;
> font: mono 0.72rem; no width constraints`. The game stage below is
> `width: min(1120px, 100%); height: clamp(420px, 66vh, 700px); overflow:hidden`.
> Page wrapper: `min-height: max(480px, calc(100vh - 61px)); padding-bottom: 64px`.
>
> **Suspects**: (1) the toggle's text swap changes the button's width and shifts
> the flex row; (2) the popover/`mixOpen` re-render may resize the canvas or
> toggle scrollbars (the page is usually taller than the viewport; a width change
> of `100%` re-frames the 3D camera → visible background shift); (3) focus
> outline changing effective size (outline should not affect layout, verify).
>
> **Required output**: (1) the minimal CSS/JSX changes making both buttons
> layout-stable (fixed min-width equal to the widest state, or equivalent), plus
> any guard against scrollbar-induced canvas resize you deem necessary (e.g.
> `overflow-y: scroll` on the page field, or a scrollbar-gutter fix — say which
> and why); (2) ≤ 5 bullets: what each change prevents, what to verify by eye.

## Deliverable B — chat-model brief: Ashen Dusk refinement

Two-stage, mirroring the proven art-direction pattern.

**B1 — refinement slate (paste as-is; small output):**

> You are planning refinements for "Ashen Dusk", the shipped Dark Souls-themed
> skin of a browser endless-runner (no repo access; all context below). The
> owner retains this direction and wants it improved — keep the ashen, muted,
> weathered atmosphere; do NOT propose a re-theme.
>
> Current look: slate dusk sky (`#3d4a5f`→`#78889f`→`#b48f85` horizon), dying
> white sun `#eaf0f6`, ember-lit clouds `#4f5c70`/`#e8a878`, three mist-faded
> castle layers `#8a929f`/`#5d6a7c`/`#323b49` with ember windows `#ffe09a`,
> dark stone ground (`#67645f`/`#3a3835`, specks `#d98a4e`), falling ash
> `#c9c1b6`, iron crates, ember stars `#f2b03e`, soul wisps `#e6f1ff`, bone
> knight (helm `#6a6d72`, ember eyes `#e07a34`, rust cape `#522a1e`). Kept by
> the owner: menu layout, souls pickup economy, star pickups.
>
> **Task**: pitch exactly 8 refinement moves, one line each:
> `N. Name — what changes visually · what improves in feel`. They must be
> refinements WITHIN the direction (e.g. depth cues in the castle layers, sun
> rim-light on the knight, better ash density/parallax, ground detail hierarchy,
> HUD serif treatment, echo-ghost as ash-memory, hit-flash tuning, window-ember
> flicker), not re-themes. Vary craft area: lighting, depth, motion, detail,
> UI polish.

**B2 — execution**: once the owner picks 2-3 pitches, delegate scene stills with
the same shared grammar used by the nine ashen candidates in
`ashenDirections.tsx` (320×180, layer order sky→sun→clouds→far/mid/near city→
ground→knight→pickups→atmosphere; ≤ 65 elements; slug-prefixed gradient ids) and
present them as an "Ashen Dusk refinement" section in the gallery next to the
incumbent card. Reuse the copy pattern (mood/gameplay/differentiators/palette).

## Session-start checklist

1. `git pull --ff-only origin main`; `git status` (other agents share the tree).
2. Read the gallery's ashen thesis (updated: Ashen Dusk retained).
3. Ask the owner for the refinement areas, or run Deliverable B1 first.
4. Fix the audio-control bug (Deliverable A, possibly without the chat model —
   the min-width fix may be a 2-line CSS change; delegate only if it goes deeper).
5. Typecheck: `cd portfolio/shell && npm run typecheck`. Dev server runs on :5173
   (`/art-directions`, `/projects/kitty-run`). `/usr/bin/git` for push.
6. Record the pass as a graph node before wrapping up.
