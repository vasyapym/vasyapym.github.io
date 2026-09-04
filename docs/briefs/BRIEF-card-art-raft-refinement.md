# BRIEF — Refine the Raft Cluster card mark: elegance of complex system design

Round context: the owner approved the page and the Spot-Colour Overprint card family; this round reworks four marks (Cat Runner, Explosion, and Planck to Now were handled in earlier briefs). This brief covers the fourth: **Raft Cluster** — a refinement, NOT a redesign. Delegated to the chat model (no repo access). Output integrates into `portfolio/shell/src/shell/ProjectArtwork.tsx` as `RaftCenterMark`.

---

## TASK

You are refining (NOT redesigning) ONE SVG illustration for a senior developer's portfolio landing page (dark editorial "ink catalogue", plate `#0b1317`, neutral ink, halftone screens). Card mark: `260 × 160` SVG rendered ~213–260px wide, one of a six-mark family language called **Spot-Colour Overprint** (neutrals dominate; ONE identity hue per card ≤~15% coverage). This card's hue is CORAL. Subject: "Raft Cluster — live Raft consensus in the browser — crash the leader and watch elections answer."

## Verdict on the current mark

The owner is mostly happy — the concept (leader node + follower nodes + log entries riding the links) is right and stays. The refinement goal, quoted: "better convey the elegance of complex system design — emphasize sophistication and structural clarity". The current mark's weaknesses: links are thick and soft (5–6px strokes at low opacity read blurry), log squares are rotated at scattered angles (reads untidy), follower discs lack machining detail, and the cluster has no boundary — structure feels loose.

## Refinement directions (keep the composition and node layout)

1. **Links become machined channels**: leader→follower links stroke `#465059` width 3, opacity 0.85, round caps; follower→follower links width 2, opacity 0.4. Nothing thicker.
2. **Log squares precise**: keep 4 coral squares (4.5×4.5, rx 1) but AXIS-ALIGNED (no rotations), each sitting exactly at the midpoint of its link, fill `#ff6a5f`.
3. **Followers get machined rims**: each follower disc keeps its stepped caps (base `#26333b` + inner `#465059` + innermost `#7d7669`, all clipped) plus a hairline rim circle r+1.5 stroke `#465059` width 1 opacity 0.5.
4. **Leader broadcast ring**: around the leader, ONE hairline dashed orbit circle r 30, stroke `#ff6a5f` width 1, dasharray "2 5", opacity 0.45 — the leader's broadcast reach. The existing deep-coral ring (r 23 stroke `#7d2723` width 4 opacity 0.9) and the coral halftone overprint on the leader disc stay exactly as they are.
5. **Quorum boundary**: one faint dashed enclosure — ellipse ~cx 133 cy 84 rx 96 ry 58, stroke `#465059` width 1, dasharray "1 7", opacity 0.3 — "the cluster" as one bounded system.
6. Keep: antenna ticks on the leader, the two white glints, the wide sparse backdrop, everything else.

## Node layout (unchanged — provided for exactness)

- Leader: (104,58) r 17, ring r 23. Followers: (176,48) r 12, (200,92) r 12, (150,120) r 13, (66,108) r 12.
- Leader→follower links: (104,58)→(176,48), (104,58)→(200,92), (104,58)→(150,120), (104,58)→(66,108). Follower→follower: (176,48)→(200,92), (200,92)→(150,120), (150,120)→(66,108).
- Log squares at the four leader-link midpoints: (140,53), (152,75), (127,89), (85,83) — all axis-aligned now.

## Current code (refine it — do not redraw from scratch)

```tsx
function RaftCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <clipPath id="gem-raft-lead"><circle cx="104" cy="58" r="17" /></clipPath>
        <clipPath id="gem-raft-n1"><circle cx="176" cy="48" r="12" /></clipPath>
        <clipPath id="gem-raft-n2"><circle cx="200" cy="92" r="12" /></clipPath>
        <clipPath id="gem-raft-n3"><circle cx="150" cy="120" r="13" /></clipPath>
        <clipPath id="gem-raft-n4"><circle cx="66" cy="108" r="12" /></clipPath>
      </defs>
      <ellipse cx="130" cy="80" rx="104" ry="66" fill="url(#gem-raft-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="128" cy="82" rx="64" ry="42" fill="url(#gem-raft-dense)" opacity="0.12" />
      <g stroke="#465059" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6">
        <line x1="104" y1="58" x2="176" y2="48" />
        <line x1="104" y1="58" x2="200" y2="92" />
        <line x1="104" y1="58" x2="150" y2="120" />
        <line x1="104" y1="58" x2="66" y2="108" />
      </g>
      <g stroke="#7d7669" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.45">
        <line x1="176" y1="48" x2="200" y2="92" />
        <line x1="200" y1="92" x2="150" y2="120" />
        <line x1="150" y1="120" x2="66" y2="108" />
      </g>
      <g fill="#ff6a5f">
        <rect x="138" y="50" width="4.5" height="4.5" rx="1" transform="rotate(-8 140 52)" />
        <rect x="150" y="73" width="4.5" height="4.5" rx="1" transform="rotate(20 152 75)" />
        <rect x="126" y="87" width="4.5" height="4.5" rx="1" transform="rotate(40 128 89)" />
        <rect x="83" y="81" width="4.5" height="4.5" rx="1" transform="rotate(28 85 83)" />
      </g>
      <circle cx="176" cy="48" r="12" fill="#26333b" />
      <g clipPath="url(#gem-raft-n1)"><circle cx="172" cy="44" r="9.5" fill="#465059" /><circle cx="170" cy="42" r="5" fill="#7d7669" /></g>
      <circle cx="200" cy="92" r="12" fill="#26333b" />
      <g clipPath="url(#gem-raft-n2)"><circle cx="196" cy="88" r="9.5" fill="#465059" /><circle cx="194" cy="86" r="5" fill="#7d7669" /></g>
      <circle cx="150" cy="120" r="13" fill="#26333b" />
      <g clipPath="url(#gem-raft-n3)"><circle cx="146" cy="116" r="10" fill="#465059" /><circle cx="144" cy="114" r="5" fill="#7d7669" /></g>
      <circle cx="66" cy="108" r="12" fill="#26333b" />
      <g clipPath="url(#gem-raft-n4)"><circle cx="62" cy="104" r="9.5" fill="#465059" /><circle cx="60" cy="102" r="5" fill="#7d7669" /></g>
      <circle cx="104" cy="58" r="23" fill="none" stroke="#7d2723" strokeWidth="4" opacity="0.9" />
      <circle cx="104" cy="58" r="17" fill="#26333b" />
      <g clipPath="url(#gem-raft-lead)">
        <circle cx="100" cy="53" r="13" fill="#465059" />
        <circle cx="97" cy="50" r="7" fill="#b6ac95" />
        <rect x="87" y="41" width="34" height="34" fill="url(#gem-raft-dense)" opacity="0.5" />
      </g>
      <g fill="#b6ac95">
        <rect x="97" y="32" width="3.5" height="7" rx="1.5" />
        <rect x="104" y="32" width="3.5" height="7" rx="1.5" />
        <rect x="111" y="32" width="3.5" height="7" rx="1.5" />
      </g>
      <rect x="95" y="48" width="3.6" height="3.6" fill="#ffffff" opacity="0.65" />
      <rect x="169" y="43" width="3" height="3" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}
```

## Hard technique rules

- Keep: all ids (`gem-raft-*`), the halo contract (`className="gem-halo"` `style={haloVar(0.12)}` — CSS pulse binds to it), patterns, palette (NEUTRAL RAMP `#26333b #465059 #7d7669 #b6ac95`; PAPER `#eeeae0 #f4efe4`; CORAL `#ff6a5f`, deep `#7d2723`; white glints — no other hues).
- Pure SVG primitives; NO text, NO filters, NO gradients; `aria-hidden="true"`.
- React/TSX: output ONLY the component function — no imports, no props, no hooks.

## Output format

1. One ```tsx block containing the complete refined `function RaftCenterMark() { ... }`.
2. Then ≤3 sentences: what changed and why it increases structural clarity.
