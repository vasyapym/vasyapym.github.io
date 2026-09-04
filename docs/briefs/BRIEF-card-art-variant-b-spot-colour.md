# BRIEF — Implement Variant B "Spot-Colour Overprint" for three card marks (Raft · Kitty · Fox)

Delegated to the chat model (no repo access). Output integrated into `portfolio/shell/src/design-directions/art-directions/variantB.tsx`. Same representative set and later-round plan as variant A. Current-mark code listings were included in the sent brief verbatim from `ProjectArtwork.tsx` at commit `030d3ad`; not repeated here.

## Context sent

Identical page context to variant A (two-ink hero, halftone card language, owner verdict on hue noise).

## Direction locked — Variant B "Spot-Colour Overprint"

Each card KEEPS its identity hue, demoted to a confined second ink — a spot colour overprinted on a neutral plate, like a two-colour press laying one accent screen over black.

- Raft: neutral topology (stepped discs, neutral interconnects). CORAL `#ff6a5f` confined to: log-entry squares riding the links + a thin coral halftone screen on the leader disc only. Deeps `#7d2723` anchor the leader ring.
- Cat: the cat itself neutral cream/paper (as approved two-ink version: ink eyes, no mouth, buried ear bases, mid-stride, neutral ground). PINK `#ff8fbf` confined to: the nose + a faint pink halftone tint on the trailing dust-kick bars / ghost echo zone. NO bow, NO heart, NO pink on the body fur.
- Forest: neutral dusk, depth by ramp steps (dark front, lighter back). TEAL `#4fd1a5` confined to: a thin canopy halftone band across the mid-layer + a hairline teal moon rim. Moon disc itself cold paper (`#eeeae0` + `#b6ac95` cap). NO ochre on this card — one spot ink per card, strictly.

## Palette (exhaustive)

NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4` (+ white glints); CORAL (Raft only) `#ff6a5f`, deeps `#7d2723/#8f2b28`, caps `#ffd0c2/#ffe0d2`; PINK (Kitty only) `#ff8fbf`, deep `#a33a72`, cap `#ffe1ef`; TEAL (Fox only) `#4fd1a5`, deep `#1c6e57`, cap `#c9f7e6`. No ochre this round. COVERAGE CAP: spot hue in ≤ 3 element groups per mark, ≤ ~15% of mark area.

## Hard technique rules

As variant A (patterns dense 7×7 r1.9 / sparse 11×11 r1.6; stepped clipped caps; wide sparse backdrop; ~10–25 elements; legible 213px; ids prefixed `gvb-`; exports `RaftMark/KittyMark/FoxMark`; module-level `haloVar`). Differences: the spot hue reads THROUGH a hue-tinted dot screen laid over a neutral mass, never as a large solid fill. Halo: dense dot-pattern, base ≤ 0.12, dot colour = the card's spot hue at that low opacity OR neutral `#7d7669` — state the choice in rationale; no other wide colour wash anywhere. Cat geometry guardrail and output format as variant A.
