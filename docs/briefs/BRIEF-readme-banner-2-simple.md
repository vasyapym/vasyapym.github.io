# BRIEF 2 — README banner image, SIMPLE / senior-developer look

This is round 2. Round 1 produced a banner the owner rejected as **"too try-hard conceptual"**.
Do not iterate on it. Fresh start, opposite pole: **simple, restrained, senior**.

Design — and, if your interface can generate images, directly generate — ONE wide banner image
that will sit at the top of two GitHub READMEs:

1. Vasily's personal profile README (`github.com/vasyapym` — the special `vasyapym/vasyapym` repo).
2. The portfolio repository README (`github.com/vasyapym/vasyapym.github.io` — "Vasily Argounov —
   Engineering Portfolio", live site <https://vasyapym.github.io>).

One image serves both. It will be committed as a static file and embedded with a plain markdown
image tag, full column width.

## What "senior" means here (the goal)

A stranger glancing at it should read: *calm, experienced engineer with taste* — like a well-set
title page of a technical book. Not an art piece, not a concept pitch. If in doubt, REMOVE an
element. Empty space is a feature.

## Settled identity — ink catalogue (the only style frame)

- Surface: deep ink `#0b1317`, full-bleed, OPAQUE — the banner carries its own background so it
  works on GitHub's dark AND light themes unchanged.
- Neutral ink ramp: `#26333b`, `#465059`, `#7d7669`, `#b6ac95`; paper `#eeeae0` for type.
- ONE accent: ochre — `#d39b61` base, `#e8b57c` bright. Used once or twice, never as a wash.
- Type: IBM Plex Mono for all notation, lowercase except the proper name; Source Sans 3 if a
  heading face is wanted.
- Zero border-radius; sharp rectangles; thin hairline rules; lots of quiet.

## Hard bans (round 1 + standing rejections)

No conceptual metaphors, no dense generative art, no "ASCII terrain landscape" as the main
subject, no halftone dot fields filling the frame, no glow/neon, no rainbow, no rounded corners,
no laptops/coffee/robots/code-rain clichés, no marketing phrases.

## Render constraints

- Master 1280×640 (2:1) — also the exact GitHub social-preview ratio. If your tool offers only
  fixed ratios, pick its widest landscape (e.g. 3:2) and keep everything essential inside the
  middle 60% vertical band (2:1-crop-safe).
- Must hold up at ~830px wide (README column) and smaller.
- Text: EXACTLY these strings, nothing else: "Vasily Argounov" and "vasyapym.github.io".
  If the tool mangles the text, prefer the text-free composition.

## Process — full autonomy, shown reasoning

You have FULL design autonomy; no per-decision approvals. Show your reasoning chain explicitly:

1. **Restate** the goal in your own words.
2. Draft **5+ SIMPLE** directions (each describable in one breath). Span: pure typographic;
   typographic + one hairline; typographic + one small ochre mark; typographic + a barely-there
   texture field (≤5% visual weight); one more of your choosing.
3. **Prune** — simplicity and small-size legibility are the first two criteria.
4. **Develop** the top 1–2 briefly (alignment, spacing logic, where exactly the ochre goes).
5. **Stress-test**: light-theme edge, mobile crop, text mangling.
6. **Rank** and commit to ONE.

## Output format (exactly this, nothing else)

1. **Reasoning chain** — six steps, compact.
2. **Committed composition** — 4–6 lines.
3. **Image** — generate the banner at your tool's widest landscape ratio and present it.
4. **Prompt** — the exact, self-contained image-generation prompt you used (plain text,
   paste-ready, all hexes + rules included, no reference to this brief).
