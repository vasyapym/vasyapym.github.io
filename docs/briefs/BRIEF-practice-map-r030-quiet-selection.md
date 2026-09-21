# BRIEF — practice-map R030 «the quiet selection» (F071)

Relay brief sent 2026-09-21; the reply was received and rendered as the five-variant
comparison in `.agent/iterations/design/rebrand-hero/artifacts/R030/`. The owner picks;
integration is the next round. The brief text:

---

You are designing for **Waste of tokens** — a model-tiered archive of AI-generated
lessons in a dark ink archival register. You cannot see the page; everything you need
is below. This round explores ONE question: how the SELECTED model row should look.
The owner will pick from FIVE variants you propose — so the variants must be genuinely
different approaches, not five shades of one idea.

## The design language (binding)

- Dark ink field: bg `#0b1317`; text `#eeeae0` (tints are rgb(238,234,224) at alpha);
  muted = .68α, faint = .48α; hairlines `--ink-line` = rgba(238,234,224,0.26) and
  `--ink-line-soft` = .13; panel wash `--ink-panel` = rgba(238,234,224,0.045);
  ochre ladder: `--ink-accent` #d39b61 (bright #e8b57c, deep #b97f45).
  Mono chrome: "IBM Plex Mono", lowercase, tracking.
- The page speaks **ruled records** (F033/F058, owner-approved): NO opening rules,
  NO radius, NO fills on resting surfaces, NO four-sided outlines — records are
  separated by bottom hairlines. The whole map page (hero serif masthead, ruled
  model list, ruled lesson cards, bare register labels for buttons) is ONE system.
- The state grammar on the model list TODAY (owner-approved through R021):
  rest = soft bottom hairline + muted type; hover = hairline brightens to
  `--ink-line` + type wakes to full; keyboard focus = the hairline turns ochre
  + type wakes; ACTIVE = the hairline rests deep ochre `#b97f45` + ordinal lifts
  to muted + sample lifts to muted + name at full ink (the current R027 trial).
- Earlier history you must not repeat: a surface FILL on the active row was
  rejected twice (F014 "heavy-handed", F027 "performative rather than intentional").
  Full-bright ochre `#d39b61` as the resting line was ALSO just ruled "a bit more
  prominent than I want" (F068) — the current deep-ochre trial is one candidate
  direction but the owner wants a wider search.

## The current row CSS (verbatim)

[the `.pg-tier-*` block as shipped in R027 — see tiers.css]

## The ask (verbatim)

«Though i like current minimalistic highlighting of model cards when selecting on
model list, it is a bit more prominent than i want. let's find a way to make it less
prominent.» — then: «delegate highlight rethinking to chat model. make it come up
with 5 variants. we will choose.»

So: propose FIVE variants of the active (selected) treatment, each LESS prominent
than a full-bright ochre line, each visibly different in mechanism. The owner picks.

## Hard constraints (all variants)

- No fills/washes on records; no radius; no four-sided outlines; no new colours
  beyond the existing ink/ochre ladder and its alphas.
- Active must stay distinct from hover (hover = ink line + full type). If a variant
  removes the line from the active state, say what tells "chosen" apart from "woken".
- Keyboard focus must stay visible (never a bare removal) — state how focus reads
  in your variant; transient focus MAY be more visible than the settled state.
- The bottom hairline is ALSO the between-record separator — if a variant moves or
  removes it, the separator story for the resting list must still work.
- Class names + DOM stay; CSS-only; transitions ~180ms; no reflow between states.
- The same treatment should remain plausible for lesson cards and folder faces
  (one language) — mention if your variant scales there.

## Deliberation mandate

Think before you write. Name WHY the current treatment reads loud (mechanisms: full
alpha ochre? the doubled state = line + lift? the full-ink name?). Explore carriers:
the line, the type, the ordinal, position/prefix glyphs, weight, alpha. Rank your
five by loudness. Self-audit each: hover/active collision, touch (no hover-only
affordances), keyboard focus legibility, and how it reads when TWO states overlap
(active row under the pointer, active row focused).

## Output format

Return exactly:
1. **DIAGNOSIS** — ≤5 bullets: why the current reads loud.
2. **VARIANTS** — five numbered variants, each with: a name; a 2–3 sentence
   rationale; a complete CSS block; a one-line loudness self-rating.
3. **RECOMMENDATION** — one line: which variant you'd ship and why.
No other prose.
