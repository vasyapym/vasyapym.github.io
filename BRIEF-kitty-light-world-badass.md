# BRIEF — Cat Runner: "light-world badass" character design, all three surfaces

You are a character designer + front-end engineer. No repo access; this brief is self-contained. Output will be integrated verbatim by an agent, then typechecked. Full design/code autonomy — but show a compact reasoning chain (restate → 4+ directions → prune → develop the winner → stress-test vs the reject list below → commit).

## The character's verdict history (what is REJECTED, hard-won lessons)

1. Hello-Kitty clone — legally dangerous (DMCA risk on GitHub Pages).
2. "Pop Kitty" (star clip, w-mouth, catchlights, cream) — "fine but is not it", "less girly", "don't like its eyes", "doesn't speak to me".
3. Pixel Kitty (12×10 grid, bell) — "too ugly", then a better pixel attempt — "bad too".
4. Dry-ink v1 (slit bar eyes, squared jaw, brass star) — "good but maybe not quite it", "lacks character" — the closest so far, the owner liked its minimalism.
5. "Tomcat" (nicked ear, scar, asymmetric squint, collar tag) — "ugly, looks like a homeless alcoholic cat". LESSON: character via damage/wear reads as scruffy, not badass.
6. "Tiger bright" (forehead stripes, open singing mouth) — "childish", "don't like open mouth". LESSON: tiger stripes were taken literally; the owner meant it metaphorically. Open mouth = childish.
7. The owner LOVES the Hello Kitty character itself (clean, minimal, warm) — the problem is only the legal combination of features. Silhouette changes little; the *attitude* must change.

## The target (owner's words)

"Badass like the ashen character but not Dark Souls — of a 'lighter' world." The game has a second, existing character: an ashen knight in a great helm (Dark Souls homage). The owner wants the FIRST character to feel equally *badass* — calm, confident, cool — but from a lighter world: think morning light, highlands, wind, clean skies; NOT ash, NOT grimdark, NOT cute either. "Badass of a lighter world" — a wanderer/duelist vibe, not a warrior-in-armor vibe and not a pet vibe.

"Non-generic, not try-hard creative." One or two crisp signature details max. No clutter, no accessories piled on.

## What must survive (fixed)

- Big wide head, small ears, compact body — the loved silhouette family.
- DMCA distance from Hello Kitty: must NOT combine (white/cream wide-flat head + 3 whiskers/side + yellow oval nose + no mouth + bow over ear + bare vertical oval eyes). Break at least 3 of these decisively.
- The two flat SVG surfaces must stay in the established card family (constraints per component below).

## Deliverable A — `KittyCenterMark` (landing-card mark)

- React/TSX function, NO props, NO imports, NO hooks.
- `viewBox="0 0 260 160"`, `aria-hidden="true"`.
- Dark plate `#0b1317` halftone family: flat fills + dot-screen `<pattern>` fills ONLY. NO gradients, NO filters, NO `<text>`, NO images.
- Keep these exact ids (contents may change): `gem-cat-dense`, `gem-cat-sparse`, `gem-cat-halo`, `gem-cat-head-clip`.
- Exactly one `<ellipse className="gem-halo" style={haloVar(0.12)} .../>` (a hover hook; `haloVar` is a module-level helper that already exists — do not redefine it).
- Keep the composition family: wide sparse backdrop ellipse, the halo, 3 horizontal speed dashes left, one ground curve, one dash trail, a low-opacity ghost echo behind-left, subject right-of-centre. The subject itself is yours.
- Must read at ~213px wide.

## Deliverable B — `KittyPortrait` (character-select poster)

- React/TSX function named `KittyPortrait`, NO props, NO imports.
- `viewBox="0 0 100 100"`, `role="img"`, `aria-hidden="true"`, `focusable="false"`, svg-level `fill="none"`, `stroke={OUTLINE_PASTEL}` (module constant `#3a3142`), `strokeWidth={3}`, round joins/caps.
- Hardcoded colours allowed; individual shapes may set `fill` and `stroke="none"`.
- Must read as the SAME character as deliverable A.

## Deliverable C — rig delta (spec, not code, ≤10 lines)

The in-game cat is a flat-vector three.js rig (shapes + ink outlines, no textures). Palette keys are frozen; give a new hex per key: `kittyWhite` (base coat), `outlineInk`, `bowRed` (accent), `bowDeep` (accent deep), `suitPink` (clothing), `suitDeep` (clothing deep), `noseYellow`, `cheek`, `eyeInk`. Then: which single rig-side detail carries the badass read (one geometry note a mechanical integrator can apply), and what to avoid at 55px head height.

## Expected output format

1. `## Reasoning` — the compact chain (≤25 lines).
2. `### KittyCenterMark` — complete function in one ```tsx block, no ellipses.
3. `### KittyPortrait` — complete function in one ```tsx block, no ellipses.
4. `## Rig delta` — ≤10 lines as specified.
5. `## Notes` — ≤4 bullets.
