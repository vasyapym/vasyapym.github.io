# BRIEF — Complete Variant B "Spot-Colour Overprint": Explosion · Planck · Practice Map + sharpen the Cat

Delegated to the chat model (no repo access) after the owner picked variant B (graph n105). Output integrated into `portfolio/shell/src/shell/ProjectArtwork.tsx`. Current-mark listings for Explosion/Planck/Practice Map and the existing Spot-Colour Kitty were included in the sent brief verbatim (state as at integration; see git history); not repeated here.

## Context sent

Page context as in BRIEF-card-art-variant-b-spot-colour.md. Owner chose "Spot-Colour Overprint": identity hue per card as a confined SECOND INK — ≤ 3 element groups, ≤ ~15% coverage, halftone dot screen overprinting a neutral mass + one small focal fill; neutral ink dominates. Raft/Kitty/Fox already exist in this language; these four marks complete the family.

## The four marks

- **Cat Runner (sharpening pass):** the existing Spot-Colour cat read too close to the previous design (the incumbent was already neutral cream). Keep its discipline (neutral cream/paper body, ink eyes, no mouth/bow/hearts, buried ear bases, pink confined to nose + halftone ghost/dust) and STRENGTHEN the spot-ink read with at most TWO levers: (a) pink halftone overprint caps inside the ears; (b) a pink halftone overprint patch on the ground curve under the cat; (c) a modestly larger pink halftone dust zone. State the levers used.
- **Explosion:** debris/outer blast neutral steps; rib-seams neutral lines. AMBER `#ffb347` confined to: the core cap (stepped over the neutral/deep core) + a few rib-seam lines. Amber overprint sells the heat without flooding the plate.
- **Planck to Now:** arms, star field, epoch arc neutral. VIOLET `#a98cff` confined to: the stepped galactic core + a short violet-stroked dashed "now" sub-segment at the recent end of the timeline arc. The ochre scrubber dot becomes neutral `#b6ac95`.
- **Practice Map:** route and pin bodies neutral (survey grid off bluish slate `#274a5c` onto neutral `#465059`). SKY BLUE `#5cc8ff` confined to: the "you are here" marker (filled, `#1d6f9e` base + `#d6f2ff` cap) and small clipped caps on the two pins. Former ochre ring becomes neutral `#7d7669`.

## Palette (exhaustive)

NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4` (+ white glints); AMBER (Explosion) `#ffb347`, deep `#8a4712`, lights `#ffcf87/#fff0cf`; VIOLET (Planck) `#a98cff`, deep `#4b3a8c`, light `#efe7ff`; SKY (Practice Map) `#5cc8ff`, deep `#1d6f9e`, light `#d6f2ff`; PINK (Cat) `#ff8fbf`. No ochre anywhere. Hue ≤ 3 groups, ≤ ~15% per mark.

## Hard technique rules

As BRIEF-card-art-variant-b-spot-colour.md (patterns dense 7×7 r1.9 / sparse 11×11 r1.6; stepped `<clipPath>` caps; halftone overprint never large solid fills; wide sparse backdrop; 1–2 white glints; one `.gem-halo` per mark base ≤ 0.12, dot colour = card hue or neutral, state choice; ~10–25 elements; legible 213px; ids prefixed `gvb2-`; exports `KittyMark`, `BlastMark`, `SpiralMark`, `TrailMark`; module-level `haloVar`; React/TSX, no props/hooks/imports). Cat geometry guardrail unchanged. Output format: four ```tsx``` sections + ≤3 sentences rationale each.
