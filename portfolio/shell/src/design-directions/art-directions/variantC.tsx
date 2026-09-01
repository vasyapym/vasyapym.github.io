import type { CSSProperties } from "react";

// Draft variant C — "Blueprint on Ink" (drafting line-grammar, single ochre accent per card).
// Marks produced via delegated brief; integrated verbatim with mechanical fixes only:
// ochre log square keeps fill only (0.8px stroke sat under the 1.2px stroke floor).
const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// Raft — network architecture plate: crosshair nodes, measured links, outlined log squares (one ochre in transit)
export function RaftMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gvc-raft-dots" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" opacity="0.09" />
        </pattern>
      </defs>

      {/* wide sparse backdrop */}
      <ellipse cx="130" cy="80" rx="128" ry="76" fill="url(#gvc-raft-dots)" />

      {/* construction-circle halo (hover hook — do not remove/fill) */}
      <ellipse
        className="gem-halo"
        style={haloVar(0.12)}
        cx="132"
        cy="84"
        rx="118"
        ry="66"
        fill="none"
        stroke="#b6ac95"
        strokeWidth="1"
        strokeDasharray="2 6"
      />

      {/* interconnects (leader -> followers) */}
      <g stroke="#b6ac95" strokeWidth="1.4" strokeLinecap="round">
        <line x1="104" y1="58" x2="176" y2="48" />
        <line x1="104" y1="58" x2="200" y2="92" />
        <line x1="104" y1="58" x2="150" y2="120" />
        <line x1="104" y1="58" x2="66" y2="108" />
      </g>

      {/* midpoint dimension ticks */}
      <g stroke="#7d7669" strokeWidth="1.3" strokeLinecap="round">
        <line x1="118" y1="52" x2="122" y2="58" />
        <line x1="83" y1="80" x2="87" y2="86" />
      </g>

      {/* authority ring + leader disc */}
      <ellipse cx="104" cy="58" rx="23" ry="23" fill="none" stroke="#7d7669" strokeWidth="1.2" strokeDasharray="3 5" />
      <circle cx="104" cy="58" r="17" fill="none" stroke="#eeeae0" strokeWidth="2" />

      {/* followers */}
      <g fill="none" stroke="#b6ac95" strokeWidth="1.6">
        <circle cx="176" cy="48" r="12" />
        <circle cx="200" cy="92" r="12" />
        <circle cx="150" cy="120" r="13" />
        <circle cx="66" cy="108" r="12" />
      </g>

      {/* crosshair centres */}
      <g stroke="#eeeae0" strokeWidth="1.3" strokeLinecap="round">
        <line x1="98" y1="58" x2="110" y2="58" /><line x1="104" y1="52" x2="104" y2="64" />
        <line x1="171" y1="48" x2="181" y2="48" /><line x1="176" y1="43" x2="176" y2="53" />
        <line x1="195" y1="92" x2="205" y2="92" /><line x1="200" y1="87" x2="200" y2="97" />
        <line x1="145" y1="120" x2="155" y2="120" /><line x1="150" y1="115" x2="150" y2="125" />
        <line x1="61" y1="108" x2="71" y2="108" /><line x1="66" y1="103" x2="66" y2="113" />
      </g>

      {/* log entries riding the links — outlined, one ochre-filled in transit */}
      <g fill="none" stroke="#eeeae0" strokeWidth="1.3">
        <rect x="147.75" y="70.75" width="4.5" height="4.5" />
        <rect x="123.75" y="84.75" width="4.5" height="4.5" />
        <rect x="80.75" y="78.75" width="4.5" height="4.5" />
      </g>
      <rect x="135.75" y="47.75" width="4.5" height="4.5" fill="#e8b57c" />

      {/* vertex glints */}
      <rect x="102.6" y="56.6" width="2.8" height="2.8" fill="#ffffff" opacity="0.6" />
      <rect x="174.6" y="46.6" width="2.6" height="2.6" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

// Kitty — single-weight contour motion study: dashed onion-skin echo, vector dust-kick, ochre nose
export function KittyMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gvc-kitty-dots" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" opacity="0.09" />
        </pattern>
      </defs>

      {/* wide sparse backdrop */}
      <ellipse cx="130" cy="80" rx="128" ry="76" fill="url(#gvc-kitty-dots)" />

      {/* construction-circle halo (hover hook — do not remove/fill) */}
      <ellipse
        className="gem-halo"
        style={haloVar(0.12)}
        cx="128"
        cy="80"
        rx="106"
        ry="62"
        fill="none"
        stroke="#b6ac95"
        strokeWidth="1"
        strokeDasharray="2 6"
      />

      {/* ghost echo — dashed onion-skin previous frame */}
      <g transform="translate(-70 -20) scale(0.82)" fill="none" stroke="#7d7669" strokeWidth="1.6" strokeDasharray="4 6">
        <ellipse cx="150" cy="70" rx="34" ry="28" />
        <polygon points="130,49 122,26 142,45" />
        <polygon points="160,48 178,26 176,54" />
        <ellipse cx="150" cy="112" rx="22" ry="15" />
      </g>

      {/* ground curve */}
      <path d="M 60 138 Q 150 128 240 136" fill="none" stroke="#b6ac95" strokeWidth="1.5" strokeLinecap="round" />

      {/* dust-kick — short vector arrows with tiny heads */}
      <g stroke="#b6ac95" strokeWidth="1.3" strokeLinecap="round" fill="none">
        <path d="M 110 120 L 94 116 M 94 116 L 99 113 M 94 116 L 98 119" />
        <path d="M 106 126 L 88 124 M 88 124 L 93 121 M 88 124 L 92 127" />
        <path d="M 100 110 L 85 108 M 85 108 L 90 105 M 85 108 L 89 111" />
      </g>

      {/* cat contour — single weight, fill none */}
      <ellipse cx="150" cy="112" rx="22" ry="15" fill="none" stroke="#eeeae0" strokeWidth="1.8" />
      <ellipse cx="150" cy="70" rx="34" ry="28" fill="none" stroke="#eeeae0" strokeWidth="2" />
      <polygon points="130,49 122,26 142,45" fill="none" stroke="#eeeae0" strokeWidth="1.8" strokeLinejoin="round" />
      <polygon points="160,48 178,26 176,54" fill="none" stroke="#eeeae0" strokeWidth="1.8" strokeLinejoin="round" />

      {/* whiskers */}
      <g stroke="#eeeae0" strokeWidth="1.2" strokeLinecap="round">
        <line x1="124" y1="74" x2="102" y2="70" />
        <line x1="124" y1="79" x2="101" y2="79" />
        <line x1="124" y1="84" x2="103" y2="89" />
        <line x1="176" y1="74" x2="198" y2="70" />
        <line x1="176" y1="79" x2="199" y2="79" />
        <line x1="176" y1="84" x2="197" y2="89" />
      </g>

      {/* eyes (ink anchors) + ochre nose */}
      <ellipse cx="138" cy="72" rx="3" ry="3.4" fill="#26333b" />
      <ellipse cx="162" cy="72" rx="3" ry="3.4" fill="#26333b" />
      <ellipse cx="150" cy="82" rx="3.6" ry="2.6" fill="#e8b57c" />

      {/* vertex glints */}
      <rect x="120.6" y="24.6" width="2.8" height="2.8" fill="#ffffff" opacity="0.6" />
      <rect x="176.6" y="24.6" width="2.6" height="2.6" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

// Fox — layered elevation profiles receding by line-weight, crosshair moon, leader callout on the tree
export function FoxMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gvc-fox-dots" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" opacity="0.09" />
        </pattern>
      </defs>

      {/* wide sparse backdrop */}
      <ellipse cx="130" cy="82" rx="128" ry="74" fill="url(#gvc-fox-dots)" />

      {/* construction-circle halo (hover hook — do not remove/fill) */}
      <ellipse
        className="gem-halo"
        style={haloVar(0.12)}
        cx="130"
        cy="88"
        rx="112"
        ry="60"
        fill="none"
        stroke="#b6ac95"
        strokeWidth="1"
        strokeDasharray="2 6"
      />

      {/* far elevation contours (lightest ink) */}
      <path d="M 40 112 Q 130 106 220 110" fill="none" stroke="#465059" strokeWidth="1.3" />
      <path d="M 30 120 Q 130 110 230 118" fill="none" stroke="#b6ac95" strokeWidth="1.4" />

      {/* moon — crosshair circle, ochre centre dot */}
      <circle cx="202" cy="46" r="15" fill="none" stroke="#b6ac95" strokeWidth="1.5" />
      <g stroke="#b6ac95" strokeWidth="1.3" strokeLinecap="round">
        <line x1="194" y1="46" x2="210" y2="46" />
        <line x1="202" y1="38" x2="202" y2="54" />
      </g>
      <circle cx="202" cy="46" r="2.2" fill="#e8b57c" />

      {/* back trees (far, lighter weight) */}
      <g fill="none" stroke="#7d7669" strokeWidth="1.4" strokeLinejoin="round">
        <polyline points="66,112 78,82 90,112" />
        <polyline points="150,112 162,84 174,112" />
      </g>

      {/* mid bush + main tree */}
      <path d="M 108 112 Q 96 88 120 84 Q 132 92 128 112 Z" fill="none" stroke="#b6ac95" strokeWidth="1.6" />
      <path d="M 130 60 L 156 124 Q 130 116 104 124 Z" fill="none" stroke="#eeeae0" strokeWidth="2" strokeLinejoin="round" />

      {/* leader callout pointing at tree crown, tiny end tick */}
      <path d="M 150 32 L 150 46 L 133 59" fill="none" stroke="#eeeae0" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="145" y1="32" x2="155" y2="32" stroke="#eeeae0" strokeWidth="1.3" strokeLinecap="round" />

      {/* near bushes + ground (front, heaviest ink) */}
      <path d="M 62 124 Q 46 92 82 90 Q 100 98 96 124 Z" fill="none" stroke="#eeeae0" strokeWidth="1.8" />
      <path d="M 178 124 Q 166 96 198 92 Q 214 100 210 124 Z" fill="none" stroke="#eeeae0" strokeWidth="1.8" />
      <path d="M 30 128 Q 130 112 230 128" fill="none" stroke="#eeeae0" strokeWidth="2" strokeLinecap="round" />

      {/* vertex glints */}
      <rect x="128.6" y="58.6" width="2.8" height="2.8" fill="#ffffff" opacity="0.6" />
      <rect x="200.6" y="44.6" width="2.6" height="2.6" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
