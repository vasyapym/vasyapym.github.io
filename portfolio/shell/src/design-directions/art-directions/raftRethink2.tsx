import type { CSSProperties } from "react";

// Raft visual-interest rethink, round 2 — two candidates from the delegated
// brief (BRIEF-card-art-raft-rethink-2.md), integrated verbatim with
// mechanical fixes only. Ids namespaced per candidate (gem-raft-a-*,
// gem-raft-b-*); on adoption the winner's ids rename to the family prefix
// gem-raft-*.
//
// Mechanical fixes: width/height attributes dropped to match the family
// marks (CSS scales the SVG); candidate B's three replication stubs extended
// from y 108 to y 110 so they meet the spine bar instead of floating 2px
// above it. All other coordinates as delivered.
const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// Candidate A — "Replication stream": dominant crowned leader fanning live
// traffic (protagonist capsule + halftone echoes) along two rails to two
// followers, dashed ack hairline returning, committed log row with frontier
// under every node.
export function RaftCandidateA() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft-a-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft-a-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft-a-halo" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <clipPath id="gem-raft-a-leader-clip">
          <circle cx="72" cy="78" r="16" />
        </clipPath>
      </defs>

      {/* backdrop + halo */}
      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft-a-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="78" cy="80" rx="30" ry="24" fill="url(#gem-raft-a-halo)" opacity="0.12" />

      {/* rails + direction chevrons (away from leader) */}
      <g fill="none" strokeLinecap="round">
        <path d="M 92 70 Q 140 44 186 47" stroke="#465059" strokeWidth="2.5" opacity="0.8" />
        <path d="M 92 88 Q 136 112 180 113" stroke="#465059" strokeWidth="2.5" opacity="0.8" />
        <polyline points="-2,-3 2,0 -2,3" stroke="#7d7669" strokeWidth="1.2" transform="translate(140,51) rotate(-12)" />
        <polyline points="-2,-3 2,0 -2,3" stroke="#7d7669" strokeWidth="1.2" transform="translate(136,105) rotate(10)" />
      </g>

      {/* ack return (dashed feedback, chevron back to leader) */}
      <g fill="none" strokeLinecap="round">
        <path d="M 178 122 Q 134 124 96 102" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
        <polyline points="-2,-3 2,0 -2,3" stroke="#7d7669" strokeWidth="1.2" transform="translate(137,123) rotate(194)" />
      </g>

      {/* leader (crowned, dominant) */}
      <g>
        <circle cx="72" cy="78" r="22" fill="none" stroke="#7d2723" strokeWidth="3.5" opacity="0.9" />
        <circle cx="72" cy="78" r="16" fill="#26333b" />
        <circle cx="72" cy="76" r="12" fill="#465059" />
        <circle cx="72" cy="74" r="7" fill="#7d7669" />
        <circle cx="72" cy="75" r="10" fill="url(#gem-raft-a-dense)" opacity="0.75" clipPath="url(#gem-raft-a-leader-clip)" />
        <line x1="67" y1="54" x2="64" y2="47" stroke="#ff6a5f" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="77" y1="54" x2="80" y2="47" stroke="#ff6a5f" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="66" y="70" width="2" height="2" fill="#f4efe4" />
      </g>

      {/* follower upper-right */}
      <g>
        <circle cx="198" cy="46" r="12.5" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
        <circle cx="198" cy="46" r="11" fill="#26333b" />
        <circle cx="198" cy="44.5" r="8" fill="#465059" />
        <circle cx="198" cy="43" r="4.5" fill="#7d7669" />
      </g>

      {/* laggard lower-right (de-saturated) */}
      <g>
        <circle cx="192" cy="114" r="12.5" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
        <circle cx="192" cy="114" r="11" fill="#26333b" />
        <circle cx="192" cy="112.5" r="7.5" fill="#465059" />
      </g>

      {/* the stream: protagonist capsule + trailing halftone echoes on the Q-curve */}
      <g>
        <circle cx="130" cy="54" r="4.5" fill="url(#gem-raft-a-dense)" opacity="0.7" />
        <circle cx="111" cy="61" r="3.5" fill="url(#gem-raft-a-dense)" opacity="0.5" />
        <g transform="translate(152,50) rotate(-9)">
          <rect x="-7.5" y="-4" width="15" height="8" rx="4" fill="#ff6a5f" />
          <rect x="3" y="-1" width="2" height="2" fill="#f4efe4" />
        </g>
      </g>

      {/* committed log rows (identical structure per node) + frontier hairlines */}
      <g>
        <rect x="56" y="108" width="7" height="6" fill="#465059" />
        <rect x="65" y="108" width="7" height="6" fill="#7d7669" />
        <rect x="74" y="108" width="7" height="6" fill="#b6ac95" />
        <line x1="73" y1="105" x2="73" y2="116" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />

        <rect x="187" y="64" width="7" height="6" fill="#465059" />
        <rect x="196" y="64" width="7" height="6" fill="#7d7669" />
        <rect x="205" y="64" width="7" height="6" fill="#b6ac95" />
        <line x1="204" y1="61" x2="204" y2="72" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />

        <rect x="181" y="128" width="7" height="6" fill="#465059" />
        <rect x="190" y="128" width="7" height="6" fill="#7d7669" />
        <rect x="199" y="128" width="7" height="6" fill="none" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="198" y1="125" x2="198" y2="136" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
      </g>
    </svg>
  );
}

// Candidate B — "Write frontier": the shared log as a horizontal bus with a
// bright frontier hairline and dashed empty future; the crowned leader stands
// at the write head, the coral entry mid-drop into the first empty slot, the
// laggard on a dashed replication stub.
export function RaftCandidateB() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft-b-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft-b-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft-b-halo" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <clipPath id="gem-raft-b-leader-clip">
          <circle cx="176" cy="62" r="13" />
        </clipPath>
      </defs>

      {/* backdrop + halo */}
      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft-b-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="168" cy="84" rx="30" ry="24" fill="url(#gem-raft-b-halo)" opacity="0.12" />

      {/* spine: committed log bus + entry separators */}
      <g>
        <rect x="40" y="110" width="136" height="4.5" rx="2.25" fill="#465059" />
        <line x1="56" y1="108" x2="56" y2="116.5" stroke="#26333b" strokeWidth="1" opacity="0.9" />
        <line x1="74" y1="108" x2="74" y2="116.5" stroke="#26333b" strokeWidth="1" opacity="0.9" />
        <line x1="92" y1="108" x2="92" y2="116.5" stroke="#26333b" strokeWidth="1" opacity="0.9" />
        <line x1="110" y1="108" x2="110" y2="116.5" stroke="#26333b" strokeWidth="1" opacity="0.9" />
        <line x1="128" y1="108" x2="128" y2="116.5" stroke="#26333b" strokeWidth="1" opacity="0.9" />
        <line x1="146" y1="108" x2="146" y2="116.5" stroke="#26333b" strokeWidth="1" opacity="0.9" />
      </g>

      {/* write frontier + dashed future tail */}
      <line x1="178" y1="104" x2="178" y2="122" stroke="#b6ac95" strokeWidth="1.5" opacity="0.9" strokeLinecap="round" />
      <path d="M 182 112.25 L 218 112.25" fill="none" stroke="#7d7669" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.6" strokeLinecap="round" />

      {/* direction chevrons above the bus */}
      <g fill="none" strokeLinecap="round">
        <polyline points="-2,-3 2,0 -2,3" stroke="#7d7669" strokeWidth="1.2" transform="translate(104,104)" />
        <polyline points="-2,-3 2,0 -2,3" stroke="#7d7669" strokeWidth="1.2" transform="translate(150,104)" />
      </g>

      {/* replication stubs */}
      <g fill="none" strokeLinecap="round">
        <line x1="176" y1="80" x2="176" y2="110" stroke="#465059" strokeWidth="2" />
        <line x1="108" y1="69.5" x2="108" y2="110" stroke="#465059" strokeWidth="2" />
        <line x1="58" y1="72" x2="58" y2="110" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
      </g>

      {/* leader at the frontier (crowned, dominant) */}
      <g>
        <circle cx="176" cy="62" r="18" fill="none" stroke="#7d2723" strokeWidth="3.5" opacity="0.9" />
        <circle cx="176" cy="62" r="13" fill="#26333b" />
        <circle cx="176" cy="60.5" r="9.5" fill="#465059" />
        <circle cx="176" cy="59" r="5" fill="#7d7669" />
        <circle cx="176" cy="59" r="8" fill="url(#gem-raft-b-dense)" opacity="0.75" clipPath="url(#gem-raft-b-leader-clip)" />
        <line x1="171" y1="42" x2="168" y2="35" stroke="#ff6a5f" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="181" y1="42" x2="184" y2="35" stroke="#ff6a5f" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="170" y="55" width="2" height="2" fill="#f4efe4" />
      </g>

      {/* follower */}
      <g>
        <circle cx="108" cy="58" r="11.5" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
        <circle cx="108" cy="58" r="10" fill="#26333b" />
        <circle cx="108" cy="56.5" r="7" fill="#465059" />
        <circle cx="108" cy="55" r="4" fill="#7d7669" />
      </g>

      {/* laggard (de-saturated, dashed stub) */}
      <g>
        <circle cx="58" cy="62" r="11.5" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
        <circle cx="58" cy="62" r="10" fill="#26333b" />
        <circle cx="58" cy="60.5" r="6.5" fill="#465059" />
      </g>

      {/* entry in flight (protagonist) + queuing halftone dot */}
      <g>
        <circle cx="204" cy="100" r="3.5" fill="url(#gem-raft-b-dense)" opacity="0.6" />
        <g transform="translate(190,94) rotate(12)">
          <rect x="-7" y="-3.5" width="14" height="7" rx="3.5" fill="#ff6a5f" />
          <rect x="2" y="-1" width="2" height="2" fill="#f4efe4" />
        </g>
      </g>
    </svg>
  );
}
