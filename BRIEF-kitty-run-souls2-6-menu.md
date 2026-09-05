# BRIEF — kitty-run × Dark Souls v2, deliverable 6: the hero character select

You are redesigning the **character selection** on the start screen of an
existing browser game so it is impossible to miss. You have no repo access —
this brief contains every file excerpt and value you need. Return code in
the exact output format at the end.

## Current state (the problem)

The ready screen shows a column: two small text pills ("kitty · the pastel
runner" / "ashen · the hollow runner"), then the big START card, then a
watch-autopilot pill. The owner reports the character choice is **too easy
to miss** — the pills are 12px text, visually weaker than the start card,
and nothing explains that the choice re-themes the whole game.

## The redesign (bold, but inside the existing structure)

The two characters become the **hero of the screen**: two large side-by-side
character cards ABOVE the start card, each with a rendered **portrait** of
its character, its name and its blurb. The active card glows and scales up
slightly; the inactive card sits dimmed and slightly desaturated. A small
serif/mono header (`pickLabel`) sits above them. The start card keeps its
existing look but becomes visually secondary to the cards. Selecting a
card switches the character (and thus re-themes the entire live scene
behind the overlay — the world itself is the preview).

- Card size: ≈ 150–170px wide each, portrait ≈ 84–96px tall, side by side
  with a ~12px gap; on ≤ 700px screens they shrink (≈ 128–140px wide,
  portrait ≈ 68–76px) but STAY side by side — never stacked.
- Active card: subtle scale (≈ 1.03) + glowing border + soft outer glow.
  Inactive: opacity ≈ 0.72, `filter: saturate(0.75)`, no glow; hover lifts
  opacity to ≈ 0.9.
- Entrance: one shared keyframe — cards fade + rise in, the two cards
  staggered ≈ 90ms apart; the header fades in first. Disabled under
  `prefers-reduced-motion`.
- The start card and watch pill stay as they are (no changes needed to
  their rules); you only touch the character-row styles and add the new
  header/portrait/animation rules.

## The files/API you are working with

The page is React (state: `character: CharacterId`, setter through
`chooseCharacter(id)` — it persists + re-themes live). Relevant identifiers
already imported in the page: `CHARACTER_IDS` (readonly ["kitty","souls"]),
`THEMES` (record with `.text.name`, `.text.blurb`, and the NEW
`.text.pickLabel`), `theme` (active theme), `status` ("ready" | ...).
`CharacterId` = "kitty" | "souls".

### Current ready-overlay JSX (replace this block):

```tsx
{status === "ready" && (
  <div className="kitty-run-overlay kitty-run-overlay--ready">
    <div className="kitty-run-ready-stack">
      <div className="kitty-run-characters" role="group" aria-label="Character">
        {CHARACTER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`kitty-run-char${id === character ? " is-active" : ""}`}
            aria-pressed={id === character}
            onMouseEnter={uiHover}
            onClick={() => {
              uiClick();
              chooseCharacter(id);
            }}
          >
            <span className="kitty-run-char-name">{THEMES[id].text.name}</span>
            <span className="kitty-run-char-blurb">{THEMES[id].text.blurb}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="kitty-run-card kitty-run-card--ready"
        onMouseEnter={uiHover}
        onClick={handleStart}
      >
        <span className="kitty-run-card-kicker">{theme.text.readyKicker}</span>
        {replay && (
          <span className="kitty-run-card-echo">your best run will chase you</span>
        )}
        <span className="kitty-run-card-hint">
          {coarse
            ? "tap to jump · dash pad blasts through"
            : "space — jump · shift — dash · p — pause"}
        </span>
        <span className="kitty-run-card-action">{theme.text.readyAction}</span>
      </button>
      <button
        type="button"
        className="kitty-run-watch"
        onMouseEnter={uiHover}
        onClick={handleWatch}
      >
        <span className="kitty-run-watch-title">{theme.text.watchTitle}</span>
        <span className="kitty-run-watch-hint">{theme.text.watchHint}</span>
      </button>
    </div>
  </div>
)}
```

(`uiHover`, `uiClick`, `handleStart`, `handleWatch`, `replay`, `coarse` are
in scope, unchanged. Keep every existing behaviour: aria-pressed, hover
blips, click blips.)

### Keyboard (add cases to the existing switch on `event.code`):

The existing handler switches on `event.code` with cases Space/ArrowUp/KeyW
(start when ready), Enter, Shift*/ArrowDown/KeyS (dash), KeyP/Escape, KeyR.
Add: `Digit1` selects the first character and `Digit2` the second; and
`ArrowLeft`/`ArrowRight` cycle the selection — **only when
`world.status === "ready"`** (the arrows are the duck/swipe key mid-run;
do not steal them). On selection also fire the UI click blip. Give me the
exact case block(s) + any needed one-liner helper.

### CSS context (kitty-run.css)

The current chip rules you are REPLACING (they live in the base section;
the souls section appends `.kitty-run-page--souls` overrides — you provide
new ones for every rule you replace):

```css
.kitty-run-ready-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.kitty-run-characters {
  display: flex;
  gap: 8px;
}

.kitty-run-char {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 16px;
  border: 1px solid #f2cfdd;
  border-radius: 14px;
  background: rgba(255, 248, 251, 0.85);
  color: #4a3b52;
  cursor: pointer;
  font-family: var(--mono);
  transition: border-color 160ms ease, background 160ms ease,
    box-shadow 160ms ease;
}

.kitty-run-char:hover {
  border-color: #e88bab;
  background: #fff8fb;
}

.kitty-run-char.is-active {
  border-color: #e94f64;
  background: #fff8fb;
  box-shadow: 0 4px 14px rgba(233, 79, 100, 0.18);
}

.kitty-run-char-name {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #d13a50;
}

.kitty-run-char-blurb {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: #8a6f7e;
}
```

Current souls overrides for those same selectors (also replaced):

```css
.kitty-run-page--souls .kitty-run-char {
  border-color: #3a4250;
  background: rgba(23, 26, 31, 0.88);
  color: #e6dfd1;
  box-shadow: 0 2px 8px rgba(21, 17, 14, 0.4);
}

.kitty-run-page--souls .kitty-run-char:hover {
  border-color: rgba(232, 134, 60, 0.6);
}

.kitty-run-page--souls .kitty-run-char.is-active {
  border-color: #e8863c;
  box-shadow: 0 0 0 1px rgba(232, 134, 60, 0.35), 0 0 16px rgba(232, 134, 60, 0.3);
}

.kitty-run-page--souls .kitty-run-char-name {
  color: #e6dfd1;
  letter-spacing: 0.1em;
}

.kitty-run-page--souls .kitty-run-char-blurb {
  color: #9aa3ae;
}
```

Conventions: souls UI voice = serif (Georgia, "Times New Roman", serif) for
display text, mono for hints; accents — pastel: border #f2cfdd, hover
#e88bab, active #e94f64, glow rgba(233,79,100,…); souls: ember #e8863c,
emberDeep #b85f22, card #171a1f, cardLine #3a4250, inkMuted #9aa3ae, bone
#e6dfd1, near-black #15110e. Keyframes are named `kitty-*` and always get
a `prefers-reduced-motion` opt-out. The ready overlay uses
`place-items: center` under 700px (keep the cards fitting a 620px-high
stage on phones — keep total card height ≤ ~170px on mobile).

## The portraits (new file `web/CharacterPortraits.tsx`)

Two React components, `<KittyPortrait />` and `<KnightPortrait />`, each an
inline `<svg viewBox="0 0 100 100">` flat-vector poster of its character —
**hardcoded colours** (each card is a poster of its own character, not the
active theme):

- `KittyPortrait` — the pastel runner: white round head (#ffffff) with two
  triangular-ish ears, big dark eyes (#3a3142), tiny pink nose, whiskers,
  and her signature **red bow** (#e94f64, two loops + knot) beside/below
  the head; soft pink accents (#f6a9c0). Style: flat fills, no gradients,
  generous simple shapes — a faithful mini of the game's vector cat.
- `KnightPortrait` — the ashen knight: **bone** cat head (#e8e1d2) mostly
  covered by a **steel great helm** (#6a6d72 dome, dark visor plate
  #3d4045 with a horizontal near-black slit #17130f and **two tiny ember
  eyes** #e07a34 inside it), ear tips peeking above the dome, a hint of
  **pauldrons** (#6a6d72) at the bottom corners and a **rust cape**
  (#522a1e) behind. Same flat style. It must read at 68px.

Outlines: a single dark stroke (#3a3142 pastel / #17130f souls), stroke
width ≈ 3 on the 100 viewBox. No text, no backgrounds, no defs/filters
beyond simple fills; keep each SVG under ~40 elements.

## Required output format (exactly four blocks)

1. **Full `CharacterPortraits.tsx`** — complete new file.
2. **JSX replacement** — the complete `{status === "ready" && (…)}` block
   to swap in (with the pick header, hero cards, start card, watch pill),
   plus the keydown `case` additions (state them separately inside the
   same block as a `// keyboard: add to the existing switch` comment), plus
   any import line to add.
3. **CSS** — complete replacements for the base chip rules listed above
   (same selectors) + new rules (pick header, portrait sizing, entrance
   keyframe + reduced-motion opt-out, small-screen sizes) + complete souls
   overrides. Mark clearly which rules REPLACE existing ones vs are NEW.
4. **Notes** — ≤ 8 bullets: what you assume, accessibility choices
   (aria, focus), anything risky.
