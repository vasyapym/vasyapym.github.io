# BRIEF — realm r9, deliverable D2: the iPhone close-X placement + proximity greetings

Relay brief for the chat model. You have **full design and code autonomy** inside the
pinned contract below — no approval gates, no clarifying questions. Commit to one
design and one set of code blocks. The only thing we require is that your reasoning is
shown in full before the deliverable, at the depth specified in §3 — for each of the
two problems separately.

---

## 1. Situation

The landing page (`portfolio/shell`) has "the deep" — an opt-in immersive realm
(`RealmMode.tsx` + `realm-scene.ts` + `realm-creatures.ts`). Seven creatures swim in a
GPU-fluid abyss; each maps to a project. A quick click/tap on a creature opens its
**panel** (a persistent right sheet on desktop, a pinned bottom sheet ≤520px) showing
eyebrow, title, description, tech chips, links and a "dive in →" button; the panel's
close "X" button sits at the sheet's top-right. Creatures play a one-shot **greeting
animation** when a panel opens for them (`startGreeting`).

### Item A — the close "X" is misplaced on iPhone 11 (owner report)

> "The close button ('X') remains misplaced. Its position is incorrect on this
> device/browser combination. Identify what is causing the offset and fix the
> placement."

**Diagnosis already done (headless Chromium at the iPhone 11 viewport, 414×896 @2x).**
The button's geometry math is correct (top = sheet top + 16px, right inset 16px, 32×32)
as long as the sheet's content does not overflow. On the device it overflows:

- The mobile sheet is `top: 52%; height: 48%` of the realm layer — on iPhone 11 that
  is ~430px tall; its bottom padding is
  `calc(1.4rem + env(safe-area-inset-bottom, 0px))` and on iPhone 11 the
  **safe-area-inset-bottom is 34px** (in headless Blink it is 0, which is why the bug
  does not reproduce here: at 414×896 the longest description measures
  scrollHeight == clientHeight == 429 — it fits *exactly*).
- Subtract the 34px real-device inset and the content no longer fits → the sheet
  scrolls. iOS Dynamic Type (larger user text scale) widens the overflow further.
- **The close button is `position: absolute; top: 1rem; right: 1rem` inside the
  scrolling sheet** — absolutely-positioned chrome inside a scroll container is
  positioned relative to the padding box at the current scroll offset, so it rides
  the scroll: reading the description scrolls the X out of view / into the text.
  That is the "misplaced" the owner sees.

The structural consequence to design for: the X must be pinned relative to the
**sheet's viewport**, independent of content scroll, and the sheet's copy must not
flow underneath it.

### Item B — creature greeting animations fire too late (owner report)

> "In deep mode, the animations on project/creature cards currently only activate
> after clicking the card. The card's description text visually blocks the animation,
> making it easy to miss. Change the activation trigger so the animation starts when
> the user approaches or gets close to the card (proximity-based), rather than
> requiring a click. The animation should already be active by the time the user is
> in a position to read or interact with the card."

Translation into the scene's model: today `startGreeting(id)` fires only from
`openProjectPanel` (tap/click/legend/Enter-inspection). The greeting is a one-shot
creature behaviour (6s), driven by the scene clock: `greetIdx`/`greetT` with
`ctx.greeting` fed to each creature's simulation (`greetStart` hook + per-frame
greeting time). The lantern IS the cursor — "the user approaches" = the lantern
nears a creature. The scene already tracks the nearest creature every tick:
`nearestIdx`/`nearestDist` (nearest = the closest creature within `interactR =
min(vw, vh) * 0.28`), reported to the shell through `onNearest` when the nearest
changes. The proximity trigger should ride that same per-tick distance math.

Design constraints the mechanism must respect:

- The tap path is untouched: tap/click = select → panel + greeting, byte-for-byte.
- The proximity greeting must not re-fire in a loop while the user hovers inside the
  band (hysteresis or a per-creature re-arm rule — your call, state the numbers).
- `greetIdx` is a single slot: a proximity greeting while another creature's
  greeting is still playing needs a defined rule (state it).
- The idle system (`idleT`, `lure` — an idle ramp that calls creatures toward the
  user after 8s) must not be spammed or defeated by the new trigger.
- Reduced motion: some creatures already gate greeting motion on `c.reduced`; the
  trigger must not start anything new for reduced-motion users beyond what the
  existing greeting clock already does.
- The audio greeting (`audioRef.current?.greeting(id)`) currently fires only on
  select. Decide whether proximity greets audibly too, and argue it (the voices
  already ramp by proximity; a one-shot greeting sound on approach is a design
  choice, not a given).

## 2. Design laws (the household style — violations reject the work)

- `--ink-*` tokens only: `--ink-bg #0b1317`, `--ink-text #eeeae0`,
  `--ink-muted rgba(238,234,224,.68)`, `--ink-faint rgba(238,234,224,.48)`,
  `--ink-line rgba(238,234,224,.26)`, `--ink-line-soft rgba(238,234,224,.13)`,
  `--ink-accent #d39b61`, `--ink-accent-bright #e8b57c`, `--ink-accent-deep #b97f45`,
  `--panel-radius: 20px`. Chrome is lowercase `--mono`; hairlines 1px; ochre is the
  only interactive signal.
- The panel wrapper law (r5/r6/r8): the wrapper is **always mounted with pinned
  geometry**; `is-open` is added after two rAFs; the 280ms opacity transition owns
  the entrance; `inert`/`aria-hidden` are imperative; the close button mounts only
  with content and carries a closed-state `display: none` backstop; the entrance
  focus flow must still find the button.
- The realm is a wiring harness: no per-frame React state; the scene/audio live in
  one empty-deps strict-safe effect; the esc chain, legend keyboard access and full
  cleanup are non-negotiable.
- Touch stays touch: the tap=select law and the mobile bottom sheet are settled.
- Reduced motion = settled/inert. No new loops, no glow, no blur.

## 3. Reasoning protocol (mandatory, shown in your reply — per problem)

Work in this exact order and show each phase in full, once for Item A, once for
Item B. Depth here is the deliverable's quality bar — superficial output will be
rejected.

1. **Restate** the problem in your own words, including the verified mechanism (the
   safe-area overflow → scroll → scroll-relative absolute positioning; the
   greeting's single-slot one-shot clock) and why the current contract produces the
   reported behaviour on this device.
2. **Generate wide:** at least **5 materially distinct directions** each. For
   Item A e.g.: a non-scrolling wrapper with an inner scroll body; a sticky in-flow
   header row; moving the close control out of the scroll container entirely; a
   content-clearance approach (top/right padding reservations); a different close
   affordance placement; something better. For Item B e.g.: threshold-crossing
   greeting with hysteresis; a proximity ramp that primes (not fires) the greeting;
   hover-intent timing windows; per-creature cooldown tables; a dedicated
   "approach" event on the scene API; something better. Sketch each in 2–4
   sentences (mechanism + what the visitor experiences).
3. **Prune in the open:** kill directions against explicit criteria — the design
   laws (§2), the pinned wrapper law, the a11y focus flow, touch neutrality, the
   idle/lure system, the one-shot greeting budget, discoverability, and regression
   risk against the shipped r5-r8 laws. Say why each one dies. Keep the strongest
   1–2.
4. **Develop to depth:** for the survivor(s), state **every concrete value** —
   geometry, radii, scroll structure, thresholds, hysteresis bands, cooldowns,
   exact TSX/CSS — with a one-line why for each number. No placeholders, no
   "adjust to taste".
5. **Stress-test:** walk the survivor through: iPhone 11 (safe-area 34px, Dynamic
   Type enlarged, the longest description) with the sheet at rest, mid-scroll and
   scrolled to the end; the desktop full-height sheet with short and long
   descriptions; the entrance focus flow finding the pinned button; close→reopen
   with different creatures; the leaving state; the mobile bottom sheet at
   keyboard-open (visual viewport resize); the proximity greeting vs. the tap
   greeting vs. the legend-button greeting; two creatures near each other
   (greet-slot contention); wandering away mid-greeting; reduced motion; the
   idle/lure ramp; Strict Mode replay; rapid open/close.
6. **Rank and commit:** one paragraph, then the final deliverable. You decide — do
   not end with options, do not ask for approval.

## 4. Pinned contract (non-negotiable)

- **Item A may change the panel's internal structure** (the wrapper stays
  always-mounted with pinned geometry; the r8 conditional close-button mounting and
  its closed-state backstop stay). The mobile bottom-sheet geometry contract
  (`top: 52% / height: 48%`, safe-area-aware bottom padding, `border-top` hairline)
  stays. The desktop sheet keeps `min(30rem, 92%)` width. The esc chain and the
  entrance focus flow must keep working.
- **Item B lives in the scene's active-tick proximity machinery** plus (if needed)
  the shell's `openProjectPanel` wiring. The dive/panel/input machinery from r8 is
  settled — do not restructure it. `scene.startGreeting(id)` stays the single
  entry point for starting a greeting.
- The orchestrator extends `tests/realm-probe.mjs` with gates from your
  deliverable — list them explicitly under `NEW PROBE GATES:` (headless-verifiable
  only).

## 5. Current code (verbatim — the only context you get)

### 5A. The panel JSX (RealmMode.tsx, r8 state)

```tsx
      {/* persistent panel: wrapper always mounted with pinned geometry;
          content is conditional; inert/aria-hidden/is-open are owned by the
          entrance layout effect, never by React state on this wrapper. */}
      <div ref={panelRef} className="realm-panel" role="document">
        {opened && phase !== "leaving" ? (
          <button
            ref={panelCloseRef}
            type="button"
            className="realm-panel-close"
            aria-label="close"
            onClick={closePanel}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="butt"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M4 4L12 12M12 4L4 12" />
            </svg>
          </button>
        ) : null}
        {opened ? (
          <>
            <p className="realm-panel-eyebrow">{opened.eyebrow}</p>
            <h2 className="realm-panel-title">{opened.title}</h2>
            <p className="realm-panel-desc">{opened.description}</p>
            <ul className="realm-panel-tech">
              {opened.technologies.map((t) => (
                <li key={t} className="realm-panel-chip">{t}</li>
              ))}
            </ul>
            {opened.links && opened.links.length > 0 ? (
              <div className="realm-panel-links">
                {opened.links.map((l) =>
                  l.external ? (
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="realm-panel-link">
                      {l.label}
                    </a>
                  ) : (
                    <a key={l.href} href={l.href} className="realm-panel-link">{l.label}</a>
                  ),
                )}
              </div>
            ) : null}
            <button
              type="button"
              className="realm-panel-dive"
              onClick={() => confirmDive(opened.id)}
            >
              dive in →
            </button>
          </>
        ) : null}
      </div>
```

The entrance effect (contract): on every `[panelRequested, requestedPanelId]` commit
the wrapper resets to closed before paint; a requested panel cancels the gesture,
attaches transitionend/visibilitychange, adds `is-open` two rAFs later (guarded by
`phaseRef === "active"`), then `focusWhenFinished` (poll-based) focuses
`panelCloseRef.current` only when the panel is fully opaque; `stop()` (also the
cleanup) removes listeners, cancels frames, removes `is-open`, re-applies
`inert`/`aria-hidden`.

### 5B. The panel CSS (realm.css, verbatim)

```css
/* ── panel (persistent right sheet; content opens via .is-open) ──
   Geometry is final before content insertion. Only the class-added
   entrance transitions; the persistent wrapper never animates or moves. */
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
/* Defense independent of entrance callbacks. */
.realm-layer[data-realm-leaving="true"] .realm-panel {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: none;
  animation: none;
  transition: none;
}
/* Remove the child's own box; do not rely on scroller compositing visibility. */
.realm-panel:not(.is-open) .realm-panel-close,
.realm-layer[data-realm-leaving="true"] .realm-panel-close {
  display: none;
}
@media (prefers-reduced-motion: reduce) {
  .realm-panel.is-open {
    transition: opacity 0.24s linear;
  }
}
.realm-panel::-webkit-scrollbar { width: 7px; }
.realm-panel::-webkit-scrollbar-thumb { background: var(--ink-line); }
.realm-panel::-webkit-scrollbar-track { background: transparent; }

.realm-panel-close > svg {
  display: block;
  width: 16px;
  height: 16px;
  pointer-events: none;
}

.realm-panel-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  font-family: var(--mono);
  font-size: 1rem;
  color: var(--ink-muted);
  background: transparent;
  border: 1px solid var(--ink-line);
  border-radius: var(--panel-radius);
  cursor: pointer;
  transition: border-color 0.15s linear, color 0.15s linear;
}
.realm-panel-close:hover,
.realm-panel-close:focus-visible {
  outline: none;
  border-color: var(--ink-accent);
  color: var(--ink-text);
}

.realm-panel-eyebrow {
  margin: 0 0 0.4rem;
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: lowercase;
  color: var(--ink-accent-bright);
}
.realm-panel-title {
  margin: 0 0 0.7rem;
  font-family: var(--sans);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.15;
  color: var(--ink-text);
}
.realm-panel-desc {
  margin: 0 0 1.1rem;
  font-family: var(--sans);
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--ink-muted);
}

.realm-panel-tech {
  list-style: none;
  margin: 0 0 1.1rem;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.realm-panel-chip {
  font-family: var(--mono);
  font-size: 0.64rem;
  letter-spacing: 0.03em;
  text-transform: lowercase;
  color: var(--ink-faint);
  padding: 0.22rem 0.5rem;
  border: 1px solid var(--ink-line-soft);
  border-radius: var(--panel-radius);
}

.realm-panel-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.3rem;
}
.realm-panel-link {
  font-family: var(--mono);
  font-size: 0.72rem;
  text-transform: lowercase;
  color: var(--ink-muted);
  text-decoration: none;
  border-bottom: 1px solid var(--ink-line);
  padding-bottom: 1px;
  cursor: pointer;
  transition: color 0.15s linear, border-color 0.15s linear;
}
.realm-panel-link:hover,
.realm-panel-link:focus-visible {
  outline: none;
  color: var(--ink-accent-bright);
  border-color: var(--ink-accent);
}

.realm-panel-dive {
  align-self: flex-start;
  margin-top: auto;
  font-family: var(--mono);
  font-size: 0.76rem;
  text-transform: lowercase;
  padding: 0.5rem 0.9rem;
  color: #04080b; /* near-black text on the one solid element */
  background: var(--ink-accent-bright);
  border: 1px solid var(--ink-accent-bright);
  border-radius: var(--panel-radius);
  cursor: pointer;
  transition: background-color 0.15s linear, border-color 0.15s linear;
}
.realm-panel-dive:hover {
  background: var(--ink-accent);
  border-color: var(--ink-accent);
}
.realm-panel-dive:focus-visible {
  outline: none;
  background: var(--ink-accent);
  border-color: var(--ink-accent-deep);
}
```

The ≤520px sheet block (verbatim):

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

### 5C. The scene's greeting + proximity machinery (realm-scene.ts)

```ts
  function updateCreatures(dt: number): void {
    ctx.time = activeT;
    ctx.dt = dt;
    ctx.calling = calling && phase === "active";
    ctx.lure = lure;
    if (greetIdx >= 0) greetT += dt;
    nearestIdx = -1;
    nearestDist = Infinity;
    for (let i = 0; i < creatures.length; i++) {
      const c = creatures[i];
      ctx.greeting = i === greetIdx ? greetT : 0;
      c.update(ctx as CreatureContext);
      const d = Math.hypot(c.x - lan.x, c.y - lan.y);
      if (d < interactR && d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    if (greetIdx >= 0 && greetT > 6) greetIdx = -1; // greeting is one-shot; forget it after a while
    const id = phase === "active" && nearestIdx >= 0 ? creatures[nearestIdx].id : null;
    if (id !== lastNearestId) {
      // ... (reports through opts.onNearest(id) when the nearest changes)
    }
  }
```

```ts
    startGreeting(id) {
      if (destroyed || phase !== "active") return;
      const idx = findIdx(id);
      if (idx < 0) return;
      greetIdx = idx;
      greetT = 0;
      creatures[idx].greet();
    },
```

Constants and context: `interactR = Math.min(vw, vh) * 0.28` (set in resize); the
pick radius for selection is `interactR * (touch ? 0.65 : 0.45) * zoom`; the idle
system: `IDLE_BEFORE_LURE = 8` (seconds without input before the lure ramp),
`LURE_RAMP = 3`; `ctx.reduced` gates creature motion per creature; the greeting is
forgotten after 6s (`greetT > 6`).

### 5D. The creature greeting contract (realm-creatures.ts)

```ts
export interface CreatureContext {
  readonly time: number; readonly dt: number;      // time = seconds since active phase began
  readonly lantern: { readonly x: number; readonly y: number; readonly r: number; readonly intensity: number }; // world px
  readonly world: { readonly w: number; readonly h: number };
  readonly calling: boolean; readonly lure: number;  // lure = 0..1 idle-call ramp
  readonly reduced: boolean; readonly greeting: number;  // 0 = idle; else seconds since greet() started
}
```

```ts
abstract class Creature implements RealmCreature {
  // ...
  protected greetTime = 0;
  // ...
  greet(): void { /* one-shot primed; the scene drives the clock via context.greeting */ }
  // per-frame greeting consumption:
  //   const rawGreet = Number.isFinite(c.greeting) ? Math.max(0, c.greeting) : 0;
  //   if (rawGreet > 0) { if (this.greetTime === 0) { this.greetStart(c); ... }
  //     else this.greetTime += min(step, rawGreet - prevGreet); } else this.greetTime = 0;
  //   (a one-shot pulse window: greetTime in (0, PI/3.2) drives a sine pulse)
  protected greetStart(_c: CreatureContext): void { /* optional snapshot hook */ }
}
```

Each species implements `greetStart` + reacts to `greetTime` in `update` (e.g. the
explosion creature's "radial greeting detonation", the forest's greeting ring). The
shell side: `openProjectPanel(id)` → `sceneRef.current?.startGreeting(id)` +
`audioRef.current?.greeting(id)`.

## 6. Deliverable

One reply containing, in this order:

1. The full shown reasoning chain for Item A (§3), ending with
   `COMMITTED A: <one-line name of the direction>`.
2. The exact code changes for Item A as **complete replacement blocks** — for each
   touched region, quote the verbatim current lines (from §5) and give the verbatim
   replacement. No "…" elisions inside code.
3. The full shown reasoning chain for Item B, ending with
   `COMMITTED B: <one-line name of the direction>`.
4. The exact code changes for Item B as complete replacement blocks (same rules).
5. A short list titled `NEW PROBE GATES:` naming the headless-verifiable gates the
   orchestrator should add (one line each, as probe `check()` names).

Integration (not your job, for context): the orchestrator splices the edits, runs the
type check, production build, the probe with your new gates, and screenshots
desktop/mobile panels for the owner; the owner re-checks both items on a real iPhone.
