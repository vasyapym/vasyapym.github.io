# BRIEF — Implement Variant A "Two-Ink Plate" for three card marks (Raft · Kitty · Fox)

Delegated to the chat model (no repo access). Output integrated into `portfolio/shell/src/design-directions/art-directions/variantA.tsx`. This round only converts Raft, Cat Runner and Evening Forest — the representative set (abstract system / character / scene). Explosion, Planck, Practice Map convert after the owner picks a direction. Current-mark code listings were included in the sent brief verbatim from `ProjectArtwork.tsx` at commit `030d3ad` (see also BRIEF-card-artwork-three-marks.md); not repeated here.

## Context sent

Dark editorial "ink catalogue" landing: plate `#0b1317`, paper `#eeeae0`, IBM Plex Mono/Sans lowercase, hairlines, 20px panels. Hero = fluid sim rasterized as ordered Bayer dither, ramp `#26333b → #465059 → #7d7669 → #b6ac95 → #d49a5f → #ecba7f` — two inks: neutral + ochre. Each card: 200px art stage, one SVG mark `viewBox="0 0 260 160"` at ~213–260px, printed-halftone language (dot-screen patterns dense 7×7 r1.9 / sparse 11×11 r1.6, stepped clipped caps, white square glints). Owner verdict: marks appealing but inconsistent — six saturated identity hues vs the page's two quiet inks.

## Direction locked — Variant A "Two-Ink Plate"

Every card in the hero's own two inks. Identity moves into subject and composition; ochre = exactly ONE signal element per card.

- Raft: leader + 4 followers as neutral stepped discs on halftone screens; neutral interconnects (2.5–4px). OCHRE SIGNAL: log-entry squares bright `#e8b57c` propagating from a deep-ochre `#b97f45` leader ring.
- Cat: warm cream/paper body (`#f4efe4`/`#eeeae0` over `#b6ac95` shadow step), ink `#26333b` eyes, neutral dust kicks, faint neutral ghost echo. OCHRE SIGNAL: nose + one ochre glint on the leading paw. NO pink anywhere. Joy lives in the mid-stride pose.
- Forest: silhouettes step down the neutral ramp (dark front, lighter back), halftone sky, neutral tree (`#26333b` + `#465059`/`#7d7669` caps). OCHRE SIGNAL: the moon — stepped disc `#b97f45`/`#e8b57c`/cap `#ffe6c4`.

## Palette (exhaustive)

NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4` (+ white `#ffffff` for glints only); OCHRE `#b97f45 #d39b61 #d49a5f #e8b57c #ffe6c4`. Nothing else — identity hues 0%, not even at low opacity.

## Hard technique rules

One `<svg viewBox="0 0 260 160" aria-hidden="true">` per mark; pure primitives; no `<text>`/images/filters/CSS-in-SVG/animation (CSS owns motion). Dot screens for glow/texture, never wall-to-wall. Stepped tones via `<clipPath>` caps, never gradients. Exactly one halo: `<ellipse className="gem-halo" style={haloVar(base)}` dense-dot fill, base ≤ 0.16, ochre-tinted dots — CSS hover hook, never remove. 1–2 white square glints (2.8–3.6px, opacity 0.4–0.65). Wide sparse backdrop ellipse (sparse pattern, opacity 0.09). ~10–25 elements, legible at 213px. All ids prefixed `gva-`. React/TSX, no props/hooks/imports; module-level helper assumed: `const haloVar = (base: number): CSSProperties => ({ "--halo-opacity": base } as unknown as CSSProperties);`. Cat geometry guardrail: ear bases buried in head ellipse (head cx150 cy70 rx34 ry28; known-good ears `130,49 122,26 142,45` and `160,48 178,26 176,54`); no bow/mouth/hearts. Export names exactly `RaftMark`, `KittyMark`, `FoxMark`.

## Output format

Three sections `### RaftMark / ### KittyMark / ### FoxMark`, each a full function component in ```tsx```, then ≤3 sentences rationale per mark.
