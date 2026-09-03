import type { CSSProperties } from "react";

// Raft visual-interest rethink round — two candidates from the delegated brief
// (BRIEF-card-art-raft-rethink.md), integrated verbatim with mechanical fixes
// only. Ids are namespaced per candidate (gem-raft-a-*, gem-raft-b-*) so both
// render on one page next to the incumbent; on adoption the winner's ids
// rename back to the family prefix gem-raft-*.
//
// Mechanical fix (brief anchor collision, applied to candidate B only): the
// dashed deck slot sat almost entirely behind the laggard node (slot x 132-154
// vs node x 132-148). Follower moved 114->108, laggard 140->128, slot reseated
// to x 140 w 20 so the full dashed outline shows and the coral entry still
// lands directly above it. All other coordinates are as delivered.
const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// Candidate A — "Succession": the election moment frozen mid-frame. Crashed
// ex-leader lower-left, crowned successor upper-right (ring still open where
// the mandate arrives), the coral vote arcing up from the deferring follower.
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
        <clipPath id="gem-raft-a-succ"><circle cx="174" cy="58" r="15" /></clipPath>
        <clipPath id="gem-raft-a-crash"><circle cx="58" cy="86" r="13" /></clipPath>
      </defs>

      {/* backdrop + halo */}
      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft-a-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="165" cy="66" rx="34" ry="22" fill="url(#gem-raft-a-halo)" opacity="0.12" />

      {/* CRASHED EX-LEADER (lower-left, the fall) */}
      <g>
        <g clipPath="url(#gem-raft-a-crash)">
          <circle cx="58" cy="86" r="13" fill="#26333b" />
          <circle cx="58" cy="86" r="9" fill="#465059" />
        </g>
        <path d="M 71.5 95.5 A 16.5 16.5 0 1 1 48.5 72.5" fill="none" stroke="#7d7669" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" opacity="0.55" />
        <line x1="52" y1="70" x2="47" y2="67" stroke="#7d7669" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <polyline points="47,78 54,85 49,92" fill="none" stroke="#0b1317" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </g>
      {/* scattered log */}
      <g>
        <rect x="41" y="101.5" width="6" height="5" fill="#465059" />
        <rect x="71" y="94.5" width="6" height="5" fill="#465059" transform="rotate(24 74 97)" />
        <rect x="62" y="103.5" width="6" height="5" fill="#7d7669" transform="rotate(-18 65 106)" />
      </g>

      {/* ELECTED SUCCESSOR (upper-right, the coronation) */}
      <g>
        <path d="M 154.7 63.2 A 20 20 0 1 1 168.8 77.3" fill="none" stroke="#7d2723" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
        <g clipPath="url(#gem-raft-a-succ)">
          <circle cx="174" cy="58" r="15" fill="#26333b" />
          <circle cx="174" cy="56" r="11" fill="#465059" />
          <circle cx="174" cy="54" r="6.5" fill="#7d7669" />
          <circle cx="174" cy="55" r="9.5" fill="url(#gem-raft-a-dense)" opacity="0.75" />
        </g>
        <line x1="169" y1="37" x2="166" y2="30" stroke="#ff6a5f" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="179" y1="37" x2="182" y2="30" stroke="#ff6a5f" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="195" y="70.5" width="8" height="5" rx="2.5" fill="#ff6a5f" transform="rotate(-35 199 73)" />
        <rect x="169" y="49" width="2" height="2" fill="#f4efe4" />
      </g>
      {/* successor's (winning) log */}
      <g>
        <line x1="160" y1="87" x2="190" y2="87" stroke="#465059" strokeWidth="1" opacity="0.5" />
        <rect x="164" y="80" width="7" height="6" fill="#465059" />
        <rect x="174" y="80" width="7" height="6" fill="#7d7669" />
        <rect x="184" y="80" width="7" height="6" fill="#b6ac95" />
      </g>

      {/* VOTER FOLLOWER (lower-centre) */}
      <g>
        <circle cx="124" cy="118" r="12" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
        <circle cx="124" cy="118" r="10.5" fill="#26333b" />
        <circle cx="124" cy="116.5" r="7" fill="#465059" />
        <rect x="112" y="128" width="6" height="5" fill="#465059" />
        <rect x="120" y="128" width="6" height="5" fill="#7d7669" />
        <rect x="128" y="128" width="6" height="5" fill="none" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 2" />
      </g>

      {/* THE VOTE (protagonist, in flight) */}
      <g>
        <path d="M 128 107 Q 143 76 161 66" fill="none" stroke="#7d7669" strokeWidth="1.2" strokeDasharray="2 5" opacity="0.5" />
        <circle cx="135" cy="97" r="4" fill="url(#gem-raft-a-dense)" opacity="0.7" />
        <polyline points="134,88 139,91 134,94" fill="none" stroke="#7d7669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-50 137 91)" />
        <rect x="140.5" y="77" width="15" height="8" rx="4" fill="#ff6a5f" transform="rotate(-38 148 81)" />
        <rect x="150" y="76" width="2" height="2" fill="#f4efe4" transform="rotate(-38 148 81)" />
      </g>
    </svg>
  );
}

// Candidate B — "The log raft": the replicated log as a lashed-log raft. Two
// committed logs under rope lashings, the newest coral entry hoisted from the
// masthead toward the dashed empty deck slot, wake trailing left-to-right.
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
        <clipPath id="gem-raft-b-leader"><circle cx="172" cy="82" r="9" /></clipPath>
      </defs>

      {/* backdrop + halo */}
      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft-b-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="150" cy="82" rx="34" ry="22" fill="url(#gem-raft-b-halo)" opacity="0.12" />

      {/* WATER + WAKE (left-to-right travel) */}
      <g>
        <line x1="30" y1="118" x2="118" y2="118" stroke="#465059" strokeWidth="1.5" strokeDasharray="14 10" opacity="0.5" />
        <line x1="138" y1="124" x2="230" y2="124" stroke="#7d7669" strokeWidth="1" strokeDasharray="10 12" opacity="0.4" />
        <line x1="60" y1="106" x2="84" y2="106" stroke="#7d7669" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="46" y1="106" x2="58" y2="106" stroke="#7d7669" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
        <line x1="34" y1="106" x2="42" y2="106" stroke="#7d7669" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
        <polyline points="72,98 76,100 72,102" fill="none" stroke="#7d7669" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      </g>

      {/* THE RAFT (two lashed logs) */}
      <g>
        <rect x="96" y="96" width="96" height="8" rx="4" fill="#465059" />
        <rect x="99" y="96" width="90" height="2" rx="1" fill="#7d7669" opacity="0.8" />
        <rect x="100" y="105" width="88" height="8" rx="4" fill="#26333b" />
        <rect x="103" y="105" width="82" height="2" rx="1" fill="#7d7669" opacity="0.8" />
        {/* lashings (committed = tied) */}
        <line x1="120" y1="94" x2="120" y2="115" stroke="#b6ac95" strokeWidth="1.5" opacity="0.9" />
        <line x1="170" y1="94" x2="170" y2="115" stroke="#b6ac95" strokeWidth="1.5" opacity="0.9" />
        <line x1="118" y1="98" x2="122" y2="102" stroke="#b6ac95" strokeWidth="1" />
        <line x1="122" y1="98" x2="118" y2="102" stroke="#b6ac95" strokeWidth="1" />
        <line x1="168" y1="98" x2="172" y2="102" stroke="#b6ac95" strokeWidth="1" />
        <line x1="172" y1="98" x2="168" y2="102" stroke="#b6ac95" strokeWidth="1" />
      </g>

      {/* EMPTY DECK SLOT (the deficiency) — reseated per integration note */}
      <rect x="140" y="88" width="20" height="8" rx="4" fill="none" stroke="#7d7669" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.65" />

      {/* MAST + hoist */}
      <g>
        <line x1="184" y1="46" x2="184" y2="96" stroke="#465059" strokeWidth="2" strokeLinecap="round" />
        <circle cx="184" cy="44" r="3" fill="#465059" />
        <path d="M 182 46 L 158 62" fill="none" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
      </g>

      {/* ENTRY IN FLIGHT (protagonist) */}
      <g transform="rotate(-6 149 64)">
        <rect x="138" y="60" width="22" height="8" rx="4" fill="#ff6a5f" />
        <rect x="152" y="62" width="2" height="2" fill="#f4efe4" />
      </g>

      {/* THREE NODES on deck (follower/laggard reseated per integration note) */}
      {/* follower */}
      <g>
        <circle cx="108" cy="86" r="9.5" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
        <circle cx="108" cy="86" r="8" fill="#26333b" />
        <circle cx="108" cy="84.5" r="5" fill="#465059" />
      </g>
      {/* laggard (de-saturated) */}
      <g>
        <circle cx="128" cy="87" r="9.5" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
        <circle cx="128" cy="87" r="8" fill="#26333b" />
        <circle cx="128" cy="85.5" r="5" fill="#465059" />
      </g>
      {/* leader (crowned) */}
      <g>
        <circle cx="172" cy="82" r="13" fill="none" stroke="#7d2723" strokeWidth="3" opacity="0.9" />
        <g clipPath="url(#gem-raft-b-leader)">
          <circle cx="172" cy="82" r="9" fill="#26333b" />
          <circle cx="172" cy="80.5" r="6" fill="#465059" />
          <circle cx="172" cy="81" r="6" fill="url(#gem-raft-b-dense)" opacity="0.75" />
        </g>
        <line x1="168" y1="68" x2="166" y2="62" stroke="#ff6a5f" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="176" y1="68" x2="178" y2="62" stroke="#ff6a5f" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="168" y="77" width="2" height="2" fill="#f4efe4" />
      </g>
    </svg>
  );
}
