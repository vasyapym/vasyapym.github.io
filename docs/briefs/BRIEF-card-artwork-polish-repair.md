# BRIEF — Repair pass on your six gem marks (Raft + Cat Runner only)

You previously delivered a rewritten `ProjectArtwork.tsx` for the portfolio
landing cards (six glossy SVG "gem" marks, 260×160 viewBox, dark stage
`#0f1b20`). It was integrated and rendered, and a visual review accepted four
of six marks and everything structural (layout, hover, reduced motion, hero).
**Exactly three defects were found, all inside two marks** — `RaftCenterMark`
and `KittyCenterMark`. Your job: fix those two functions only.

Do not change any other mark, the component wrapper, `CENTER_MARKS`, ids,
viewBox, or conventions. Only the two functions below are replaced.

## Accepted as-is (do not touch)

Fox (Evening Forest), Blast (Explosion), Spiral (Planck to Now), Trail
(Practice Map) marks, the shared halo technique (radial-gradient glow fading
to transparent, `gem-halo` class + `--halo-opacity` var on one halo shape per
mark), single top-left light vector (cx 34% / cy 28%, mid ~47%), ochre
`#e8b57c` secondary, chunky rounded shape language, per-card accent hue.

## Defect 1 — Raft: the glow reads as a muddy stain, not light

Rendered evidence: the inner glow ellipse
`<ellipse cx="130" cy="70" rx="60" ry="44" fill="url(#gem-raft-glow)" opacity="0.1" />`
sits in the **empty pentagon interior**. Low-opacity coral over the near-black
stage renders as a murky red-brown cloud that reads as a stain/smudge behind
the leader — visibly darker-feeling than the luminous glows on the other four
cards (their glows peek out from *behind* bright subject mass; here the glow
floats in empty space, offset low-left of the leader).

Fix requirements (pick the cleanest implementation):
- No murky stain in empty interior space. The glow must read **luminous**,
  consistent with the other cards.
- Good options: anchor a tight glow *behind the leader node* (light halo
  around the promoted node), and/or let only the wide outer halo glow behind
  the whole ring (possibly raising it slightly, ≤ 0.18).
- MUST keep: one shape with `class="gem-halo"` and `style={haloVar(<base>)}`
  (hover hook; the halo-pulse animation peaks at 0.16, so keep base ≤ 0.16).
- MUST keep: pentagon of 5 thick links, 4 nodes + leader with its concentric
  ring (no crown), ochre term ticks, the single vote-teal `#4bb3a7` message
  dot, the two specular highlights.
- Small nit: the vote dot at `(153, 46)` currently kisses the leader ring's
  edge (ring is r=20 at 130,30). Nudge it along the top-right link toward the
  node at `(176, 63)` so there is clear separation.

## Defect 2 — Cat Runner: the ochre squiggle renders as a heart

The path `M 150 40 Q 146 34 142 39 Q 138 34 134 40 Q 138 46 146 50 Q 152 46 150 40 Z`
(above the cat's back) renders as a literal **heart** — reads as cute pet-icon
ornament, which the owner explicitly excluded ("runner game, not a pet icon").
**Delete it entirely.** The mark already has the ochre hill line as its warm
secondary; nothing needs to replace the heart.

## Defect 3 — Cat Runner: the "ghost of your best run" reads as a shadow blob

Current ghost:
```tsx
<g opacity="0.2">
  <path d="M 118 92 Q 96 78 106 62 Q 122 54 138 64 Q 150 74 144 90 Q 130 98 118 92 Z" fill="#ff8fbf" />
  <circle cx="152" cy="66" r="13" fill="#ff8fbf" />
</g>
```
Rendered, it merges with the solid cat's underside and reads as an amorphous
dark gray-purple smudge — not an echo of the running pose. Additionally, two
anatomy defects make the solid cat itself read wrong (found in the same
render review):
- The tail (`M 96 84 Q 74 84 82 58`, thick pink stroke) **does not touch the
  body** — the body spans roughly x 134–186, the tail sits at x 82–96, so it
  floats disconnected next to the speed streaks.
- The left leg (`M 122 92 → 112 110`) **starts in mid-air** left of the body's
  lower edge; only the right leg attaches.

Fix requirements:
- Tail and both legs must visibly attach to the body. Keep the chunky
  rounded-stroke language (≥8 units).
- Rebuild the ghost as a true "echo of your best run": a **complete second
  cat silhouette in the same running pose** (simplified to 2–3 shapes: body,
  head+ears; optionally tail), placed **clearly separated** up-left/behind the
  solid cat (no overlap with the solid body), flat `#ff8fbf` (or slightly
  lighter) at opacity ≈ 0.12–0.18, no gradient, slightly smaller (~85–90%).
  It must read as a faint translucent duplicate trailing backward — never as
  a shadow darker than the stage, never as a blob.
- If, after redrawing, the echo still cannot be made clean at a glance,
  dropping it is acceptable — but prefer fixing it: it is the project's
  signature feature.
- Keep: ochre hill line, 3 speed streaks, glossy gradient body+head with the
  shared light vector, ears, at most 2 specular highlights.

## Current implementations to replace (verbatim)

```tsx
/* ── 1 · Raft Cluster — electric coral #ff6a5f ── */
function RaftCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-raft-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff6a5f" />
          <stop offset="55%" stopColor="#ff6a5f" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff6a5f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gem-raft-node" cx="34%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#ffd0c2" />
          <stop offset="47%" stopColor="#ff6a5f" />
          <stop offset="100%" stopColor="#7d2723" />
        </radialGradient>
        <radialGradient id="gem-raft-leader" cx="34%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#ffe0d2" />
          <stop offset="47%" stopColor="#ff6a5f" />
          <stop offset="100%" stopColor="#8f2b28" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" style={haloVar(0.16)} cx="130" cy="80" rx="104" ry="66" fill="url(#gem-raft-glow)" opacity="0.16" />
      <ellipse cx="130" cy="70" rx="60" ry="44" fill="url(#gem-raft-glow)" opacity="0.1" />
      <path d="M 130 30 L 176 63 L 158 117 L 102 117 L 84 63 Z" stroke="#ff9d8f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
      <circle cx="176" cy="63" r="14" fill="url(#gem-raft-node)" />
      <circle cx="158" cy="117" r="14" fill="url(#gem-raft-node)" />
      <circle cx="102" cy="117" r="14" fill="url(#gem-raft-node)" />
      <circle cx="84" cy="63" r="14" fill="url(#gem-raft-node)" />
      <circle cx="130" cy="30" r="20" fill="none" stroke="#ffb1a6" strokeWidth="4" opacity="0.9" />
      <circle cx="130" cy="30" r="15" fill="url(#gem-raft-leader)" />
      <g fill="#e8b57c">
        <rect x="169" y="52" width="3" height="7" rx="1.5" />
        <rect x="176" y="52" width="3" height="7" rx="1.5" />
      </g>
      <circle cx="153" cy="46" r="4.5" fill="#4bb3a7" />
      <ellipse cx="125" cy="25" rx="6" ry="4" fill="#ffffff" opacity="0.6" />
      <ellipse cx="79" cy="59" rx="4" ry="2.6" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

/* ── 2 · Cat Runner — candy pink #ff8fbf ── */
function KittyCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-cat-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff8fbf" />
          <stop offset="55%" stopColor="#ff8fbf" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff8fbf" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gem-cat-body" cx="34%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffe1ef" />
          <stop offset="47%" stopColor="#ff8fbf" />
          <stop offset="100%" stopColor="#a33a72" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" style={haloVar(0.15)} cx="140" cy="80" rx="104" ry="62" fill="url(#gem-cat-glow)" opacity="0.15" />
      <ellipse cx="150" cy="74" rx="58" ry="40" fill="url(#gem-cat-glow)" opacity="0.1" />
      <path d="M 34 122 Q 96 104 150 116 Q 196 124 232 110" stroke="#e8b57c" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />
      <g stroke="#ff8fbf" strokeWidth="6" strokeLinecap="round" opacity="0.55">
        <line x1="40" y1="66" x2="78" y2="66" />
        <line x1="32" y1="80" x2="80" y2="80" />
        <line x1="44" y1="94" x2="76" y2="94" />
      </g>
      <g opacity="0.2">
        <path d="M 118 92 Q 96 78 106 62 Q 122 54 138 64 Q 150 74 144 90 Q 130 98 118 92 Z" fill="#ff8fbf" />
        <circle cx="152" cy="66" r="13" fill="#ff8fbf" />
      </g>
      <path d="M 96 84 Q 74 84 82 58" stroke="#ff8fbf" strokeWidth="10" strokeLinecap="round" fill="none" />
      <g stroke="#e173a6" strokeWidth="8" strokeLinecap="round">
        <line x1="150" y1="92" x2="158" y2="112" />
        <line x1="122" y1="92" x2="112" y2="110" />
      </g>
      <path d="M 150 92 Q 124 76 134 60 Q 152 52 170 62 Q 186 72 180 90 Q 166 100 150 92 Z" fill="url(#gem-cat-body)" />
      <circle cx="186" cy="66" r="15" fill="url(#gem-cat-body)" />
      <polygon points="176,54 180,40 190,54" fill="#ff8fbf" />
      <polygon points="192,54 200,40 202,56" fill="#ff8fbf" />
      <path d="M 150 40 Q 146 34 142 39 Q 138 34 134 40 Q 138 46 146 50 Q 152 46 150 40 Z" fill="#e8b57c" opacity="0.9" />
      <ellipse cx="181" cy="60" rx="6" ry="4" fill="#ffffff" opacity="0.6" />
      <ellipse cx="148" cy="66" rx="6" ry="4" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}
```

(The `haloVar` helper used above is defined at the top of the file and stays.)

## Expected output format (exactly this, nothing else)

1. **One code block**: the two complete replacement functions
   (`RaftCenterMark`, `KittyCenterMark`), ready to drop in.
2. **Two one-line notes** — what you changed in each mark and why it clears
   the defect.
