import type { CSSProperties } from "react";

// Draft variant B — "Spot-Colour Overprint" (disciplined second ink per card).
// Marks produced via delegated brief; integrated verbatim with mechanical fixes only:
// Raft stepped-disc caps restored to clipPath geometry (stacked circles overhung the base discs).
const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// Raft Cluster — neutral topology, coral demoted to log squares + leader screen
export function RaftMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gvb-raft-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="gvb-raft-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <clipPath id="gvb-raft-lead"><circle cx="104" cy="58" r="17" /></clipPath>
        <clipPath id="gvb-raft-n1"><circle cx="176" cy="48" r="12" /></clipPath>
        <clipPath id="gvb-raft-n2"><circle cx="200" cy="92" r="12" /></clipPath>
        <clipPath id="gvb-raft-n3"><circle cx="150" cy="120" r="13" /></clipPath>
        <clipPath id="gvb-raft-n4"><circle cx="66" cy="108" r="12" /></clipPath>
      </defs>
      {/* wide sparse neutral backdrop */}
      <ellipse cx="130" cy="80" rx="104" ry="66" fill="url(#gvb-raft-sparse)" opacity="0.09" />
      {/* halo — coral dots at low opacity, CSS hover hook */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="128" cy="82" rx="64" ry="42" fill="url(#gvb-raft-dense)" opacity="0.12" />
      {/* neutral interconnects */}
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
      {/* SPOT group 1 — coral log-entry squares riding the links */}
      <g fill="#ff6a5f">
        <rect x="138" y="50" width="4.5" height="4.5" rx="1" transform="rotate(-8 140 52)" />
        <rect x="150" y="73" width="4.5" height="4.5" rx="1" transform="rotate(20 152 75)" />
        <rect x="126" y="87" width="4.5" height="4.5" rx="1" transform="rotate(40 128 89)" />
        <rect x="83" y="81" width="4.5" height="4.5" rx="1" transform="rotate(28 85 83)" />
      </g>
      {/* neutral stepped follower discs (clipPath caps, integrator fix) */}
      <circle cx="176" cy="48" r="12" fill="#26333b" />
      <g clipPath="url(#gvb-raft-n1)"><circle cx="172" cy="44" r="9.5" fill="#465059" /><circle cx="170" cy="42" r="5" fill="#7d7669" /></g>
      <circle cx="200" cy="92" r="12" fill="#26333b" />
      <g clipPath="url(#gvb-raft-n2)"><circle cx="196" cy="88" r="9.5" fill="#465059" /><circle cx="194" cy="86" r="5" fill="#7d7669" /></g>
      <circle cx="150" cy="120" r="13" fill="#26333b" />
      <g clipPath="url(#gvb-raft-n3)"><circle cx="146" cy="116" r="10" fill="#465059" /><circle cx="144" cy="114" r="5" fill="#7d7669" /></g>
      <circle cx="66" cy="108" r="12" fill="#26333b" />
      <g clipPath="url(#gvb-raft-n4)"><circle cx="62" cy="104" r="9.5" fill="#465059" /><circle cx="60" cy="102" r="5" fill="#7d7669" /></g>
      {/* leader: SPOT group 2 deep-coral ring + neutral stepped disc + SPOT group 3 coral halftone screen */}
      <circle cx="104" cy="58" r="23" fill="none" stroke="#7d2723" strokeWidth="4" opacity="0.9" />
      <circle cx="104" cy="58" r="17" fill="#26333b" />
      <g clipPath="url(#gvb-raft-lead)">
        <circle cx="100" cy="53" r="13" fill="#465059" />
        <circle cx="97" cy="50" r="7" fill="#b6ac95" />
        <rect x="87" y="41" width="34" height="34" fill="url(#gvb-raft-dense)" opacity="0.5" />
      </g>
      {/* neutral antenna ticks (ex-ochre) */}
      <g fill="#b6ac95">
        <rect x="97" y="32" width="3.5" height="7" rx="1.5" />
        <rect x="104" y="32" width="3.5" height="7" rx="1.5" />
        <rect x="111" y="32" width="3.5" height="7" rx="1.5" />
      </g>
      {/* white square glints */}
      <rect x="95" y="48" width="3.6" height="3.6" fill="#ffffff" opacity="0.65" />
      <rect x="169" y="43" width="3" height="3" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

// Cat Runner — neutral cream/paper cat, pink only as nose + dust/ghost halftone
export function KittyMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gvb-cat-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff8fbf" />
        </pattern>
        <pattern id="gvb-cat-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gvb-cat-halo" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#7d7669" />
        </pattern>
        <clipPath id="gvb-cat-head"><ellipse cx="150" cy="70" rx="34" ry="28" /></clipPath>
        <clipPath id="gvb-cat-body"><ellipse cx="150" cy="112" rx="22" ry="15" /></clipPath>
      </defs>
      {/* wide sparse neutral backdrop */}
      <ellipse cx="140" cy="80" rx="104" ry="62" fill="url(#gvb-cat-sparse)" opacity="0.09" />
      {/* halo — NEUTRAL dots (keeps pink footprint to the 3 spot groups) */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="150" cy="80" rx="62" ry="40" fill="url(#gvb-cat-halo)" opacity="0.12" />
      {/* SPOT group 1 — ghost-echo zone, faint pink halftone */}
      <g opacity="0.16" transform="translate(-70 -20) scale(0.82)">
        <ellipse cx="150" cy="70" rx="34" ry="28" fill="url(#gvb-cat-dense)" />
        <polygon points="130,49 122,26 142,45" fill="url(#gvb-cat-dense)" />
        <polygon points="160,48 178,26 176,54" fill="url(#gvb-cat-dense)" />
        <ellipse cx="150" cy="112" rx="22" ry="15" fill="url(#gvb-cat-dense)" />
      </g>
      {/* SPOT group 2 — trailing dust-kick bars, faint pink halftone tint */}
      <g opacity="0.45">
        <rect x="86" y="104" width="28" height="7" rx="3.5" fill="url(#gvb-cat-dense)" />
        <rect x="76" y="114" width="34" height="7" rx="3.5" fill="url(#gvb-cat-dense)" />
        <rect x="90" y="124" width="22" height="7" rx="3.5" fill="url(#gvb-cat-dense)" />
      </g>
      {/* neutral ground */}
      <path d="M 60 138 Q 150 128 240 136" stroke="#465059" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.4" />
      {/* body: shadow base + stepped paper caps */}
      <ellipse cx="150" cy="112" rx="22" ry="15" fill="#b6ac95" />
      <g clipPath="url(#gvb-cat-body)">
        <ellipse cx="148" cy="110" rx="19" ry="12" fill="#f4efe4" />
        <ellipse cx="144" cy="107" rx="9" ry="6" fill="#eeeae0" />
      </g>
      {/* ears (paper) — bases buried in head ellipse */}
      <polygon points="130,49 122,26 142,45" fill="#f4efe4" />
      <polygon points="160,48 178,26 176,54" fill="#f4efe4" />
      {/* head: shadow base + stepped paper caps */}
      <ellipse cx="150" cy="70" rx="34" ry="28" fill="#b6ac95" />
      <g clipPath="url(#gvb-cat-head)">
        <ellipse cx="148" cy="68" rx="31" ry="25" fill="#f4efe4" />
        <ellipse cx="142" cy="62" rx="16" ry="12" fill="#eeeae0" />
      </g>
      {/* inner-ear ink */}
      <polygon points="131,46 126,33 138,44" fill="#26333b" opacity="0.85" />
      <polygon points="163,47 173,34 171,50" fill="#26333b" opacity="0.85" />
      {/* ink oval eyes + feet (no mouth) */}
      <ellipse cx="143" cy="124" rx="4" ry="2.4" fill="#26333b" />
      <ellipse cx="157" cy="124" rx="4" ry="2.4" fill="#26333b" />
      <ellipse cx="138" cy="72" rx="3.4" ry="5" fill="#26333b" />
      <ellipse cx="162" cy="72" rx="3.4" ry="5" fill="#26333b" />
      {/* SPOT group 3 — pink nose (the signature focal fill) */}
      <ellipse cx="150" cy="82" rx="4" ry="3" fill="#ff8fbf" />
      {/* whiskers */}
      <g stroke="#26333b" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
        <line x1="124" y1="74" x2="104" y2="70" />
        <line x1="124" y1="79" x2="102" y2="80" />
        <line x1="124" y1="84" x2="106" y2="90" />
        <line x1="176" y1="74" x2="196" y2="70" />
        <line x1="176" y1="79" x2="198" y2="80" />
        <line x1="176" y1="84" x2="194" y2="90" />
      </g>
      {/* white square glints */}
      <rect x="140" y="60" width="3.4" height="3.4" fill="#ffffff" opacity="0.6" />
      <rect x="140" y="104" width="2.8" height="2.8" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

// Evening Forest — neutral dusk, teal only as canopy halftone band + moon rim
export function FoxMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gvb-fox-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#4fd1a5" />
        </pattern>
        <pattern id="gvb-fox-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <clipPath id="gvb-fox-tree"><path d="M 130 60 L 156 124 Q 130 116 104 124 Z" /></clipPath>
        <clipPath id="gvb-fox-canopy"><rect x="40" y="78" width="180" height="20" /></clipPath>
      </defs>
      {/* wide sparse neutral backdrop */}
      <ellipse cx="130" cy="80" rx="104" ry="62" fill="url(#gvb-fox-sparse)" opacity="0.09" />
      {/* halo — TEAL dots at low opacity, cold-dusk hover glow */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="130" cy="80" rx="60" ry="40" fill="url(#gvb-fox-dense)" opacity="0.12" />
      {/* moon: cold paper disc + neutral cap + SPOT group 1 hairline teal rim */}
      <circle cx="202" cy="46" r="15" fill="#eeeae0" />
      <circle cx="199" cy="43" r="8" fill="#b6ac95" />
      <circle cx="202" cy="46" r="15" fill="none" stroke="#4fd1a5" strokeWidth="1.2" />
      {/* back layer — lighter neutral (far reads lighter) */}
      <g opacity="0.5">
        <path d="M 66 112 L 78 82 L 90 112 Z" fill="#7d7669" />
        <path d="M 150 112 L 162 84 L 174 112 Z" fill="#7d7669" />
        <path d="M 108 112 Q 96 88 120 84 Q 132 92 128 112 Z" fill="#465059" />
      </g>
      {/* ground hairline */}
      <path d="M 30 128 Q 130 112 230 128" stroke="#26333b" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.8" />
      {/* mid-layer bushes — medium neutral */}
      <path d="M 62 124 Q 46 92 82 90 Q 100 98 96 124 Z" fill="#465059" opacity="0.7" />
      <path d="M 178 124 Q 166 96 198 92 Q 214 100 210 124 Z" fill="#465059" opacity="0.7" />
      {/* SPOT group 2 — teal canopy halftone band across the mid-layer */}
      <g clipPath="url(#gvb-fox-canopy)">
        <rect x="40" y="78" width="180" height="20" fill="url(#gvb-fox-dense)" opacity="0.5" />
      </g>
      {/* front center tree — darkest neutral, stepped caps */}
      <path d="M 130 60 L 156 124 Q 130 116 104 124 Z" fill="#26333b" />
      <g clipPath="url(#gvb-fox-tree)">
        <polygon points="130,60 104,124 130,124" fill="#465059" />
        <polygon points="130,60 116,108 126,108" fill="#7d7669" />
      </g>
      {/* neutral fireflies (ex-ochre) */}
      <circle cx="118" cy="66" r="2.6" fill="#b6ac95" />
      <circle cx="168" cy="80" r="2.4" fill="#b6ac95" />
      <circle cx="92" cy="82" r="2.2" fill="#b6ac95" />
      {/* white square glints */}
      <rect x="122" y="76" width="3.2" height="3.2" fill="#ffffff" opacity="0.55" />
      <rect x="124" y="96" width="2.8" height="2.8" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}
