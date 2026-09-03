// Raft visual-interest rethink, round 3 — two candidates from the delegated
// brief (BRIEF-card-art-raft-rethink-3.md), integrated verbatim with no
// mechanical fixes (the round-2 notes were applied upstream: family halo
// size, no width/height attrs). Ids namespaced per candidate (gem-raft-a-*,
// gem-raft-b-*); on adoption the winner's ids rename to the family prefix
// gem-raft-*. Both evolve the surviving write-frontier concept at
// Practice-Map boldness: full-width log structure, coral halftone committed
// band, beacon frontier, ~40+ elements.
import type { CSSProperties } from "react";

const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// Candidate A — "Ledger span": the log as a monumental three-strata beam with
// entry cuts, comb-teeth index row and a corner term dial; the committed span
// overprinted coral; the crowned leader standing on the bright frontier.
export function RaftCandidateA() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft-a-dense" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft-a-sparse" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft-a-halo" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <clipPath id="gem-raft-a-leader"><circle cx="178" cy="56" r="14" /></clipPath>
        <clipPath id="gem-raft-a-follower"><circle cx="92" cy="52" r="10.5" /></clipPath>
        <clipPath id="gem-raft-a-laggard"><circle cx="40" cy="58" r="10.5" /></clipPath>
      </defs>

      {/* backdrop + halo */}
      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft-a-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="150" cy="76" rx="60" ry="42" fill="url(#gem-raft-a-halo)" opacity="0.12" />

      {/* THE BEAM — monumental full-width log */}
      <g strokeLinecap="round">
        <rect x="24" y="96" width="212" height="10" rx="2" fill="#26333b" />
        <rect x="24" y="92" width="212" height="6" rx="2" fill="#465059" />
        <rect x="24" y="89" width="212" height="3.5" rx="1.75" fill="#7d7669" />
        {/* committed coral overprint — big colour moment */}
        <rect x="24" y="89" width="154" height="17" fill="url(#gem-raft-a-dense)" opacity="0.3" />
        {/* committed entry cuts */}
        <line x1="52" y1="89" x2="52" y2="106" stroke="#0b1317" strokeWidth="1.2" opacity="0.9" />
        <line x1="80" y1="89" x2="80" y2="106" stroke="#0b1317" strokeWidth="1.2" opacity="0.9" />
        <line x1="108" y1="89" x2="108" y2="106" stroke="#0b1317" strokeWidth="1.2" opacity="0.9" />
        <line x1="136" y1="89" x2="136" y2="106" stroke="#0b1317" strokeWidth="1.2" opacity="0.9" />
        <line x1="164" y1="89" x2="164" y2="106" stroke="#0b1317" strokeWidth="1.2" opacity="0.9" />
        {/* dashed future separator */}
        <line x1="206" y1="89" x2="206" y2="106" stroke="#7d7669" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      </g>

      {/* COMB TEETH — entry index ticks */}
      <g stroke="#b6ac95" strokeWidth="1.5" strokeLinecap="round" opacity="0.9">
        <line x1="52" y1="85.5" x2="52" y2="89" />
        <line x1="80" y1="85.5" x2="80" y2="89" />
        <line x1="108" y1="85.5" x2="108" y2="89" />
        <line x1="136" y1="85.5" x2="136" y2="89" />
        <line x1="164" y1="85.5" x2="164" y2="89" />
      </g>

      {/* FRONTIER + beacon pointer (collinear with leader) */}
      <line x1="178" y1="76" x2="178" y2="112" stroke="#b6ac95" strokeWidth="2" strokeLinecap="round" />
      <polygon points="174.5,112 181.5,112 178,118.5" fill="#eeeae0" />

      {/* ACK RAIL */}
      <path d="M 214 116 Q 130 126 52 108" fill="none" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 4" strokeLinecap="round" opacity="0.5" />
      <polyline points="-5 -4 0 0 -5 4" fill="none" stroke="#7d7669" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" transform="translate(130 122) rotate(188)" />

      {/* TERM DIAL — corner instrumentation */}
      <g strokeLinecap="round">
        <circle cx="40" cy="30" r="7" fill="none" stroke="#465059" strokeWidth="1.2" opacity="0.7" />
        <path d="M 36.5 24.4 A 7 7 0 0 1 43.5 24.4" fill="none" stroke="#7d7669" strokeWidth="1.5" opacity="0.7" />
        <line x1="40" y1="30" x2="40" y2="25" stroke="#b6ac95" strokeWidth="1.5" />
        <circle cx="40" cy="30" r="1.3" fill="#7d7669" />
      </g>

      {/* LAGGARD (de-saturated, dashed stub) */}
      <g>
        <line x1="40" y1="70" x2="40" y2="89" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" opacity="0.8" />
        <circle cx="40" cy="58" r="10.5" fill="#26333b" />
        <circle cx="40" cy="56.5" r="7" fill="#465059" clipPath="url(#gem-raft-a-laggard)" />
        <circle cx="40" cy="58" r="12" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
      </g>

      {/* FOLLOWER */}
      <g>
        <line x1="92" y1="64" x2="92" y2="89" stroke="#465059" strokeWidth="2" strokeLinecap="round" />
        <circle cx="92" cy="52" r="10.5" fill="#26333b" />
        <circle cx="92" cy="50.5" r="7" fill="#465059" clipPath="url(#gem-raft-a-follower)" />
        <circle cx="92" cy="49" r="3.5" fill="#7d7669" clipPath="url(#gem-raft-a-follower)" />
        <circle cx="92" cy="52" r="12" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
      </g>

      {/* LEADER — dominant focal node at the frontier */}
      <g strokeLinecap="round">
        <line x1="178" y1="75" x2="178" y2="89" stroke="#465059" strokeWidth="2.5" />
        <circle cx="178" cy="56" r="14" fill="#26333b" />
        <circle cx="178" cy="54" r="10" fill="#465059" clipPath="url(#gem-raft-a-leader)" />
        <circle cx="178" cy="52" r="6" fill="#7d7669" clipPath="url(#gem-raft-a-leader)" />
        <circle cx="178" cy="53" r="9" fill="url(#gem-raft-a-dense)" opacity="0.75" clipPath="url(#gem-raft-a-leader)" />
        <circle cx="178" cy="56" r="19" fill="none" stroke="#7d2723" strokeWidth="3.5" opacity="0.9" />
        <line x1="172" y1="35" x2="169" y2="28" stroke="#ff6a5f" strokeWidth="1.5" />
        <line x1="184" y1="35" x2="187" y2="28" stroke="#ff6a5f" strokeWidth="1.5" />
        <rect x="173" y="49" width="2" height="2" fill="#f4efe4" />
      </g>

      {/* ENTRY IN FLIGHT (coral) + halftone echo */}
      <g>
        <rect x="194.5" y="64" width="15" height="8" rx="4" fill="#ff6a5f" transform="rotate(14 202 68)" />
        <rect x="204" y="65.5" width="2" height="2" fill="#f4efe4" transform="rotate(14 202 68)" />
        <circle cx="218" cy="78" r="4" fill="url(#gem-raft-a-dense)" opacity="0.6" />
      </g>
    </svg>
  );
}

// Candidate B — "Two-tier consensus": Raft's two planes stacked — the live
// messaging tier (rails, paper stream, ack return) over the full-width log
// bus with coral committed overprint; stubs tie every node to its place on
// the log and the crowned leader lands exactly on the frontier.
export function RaftCandidateB() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft-b-dense" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft-b-sparse" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft-b-halo" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <clipPath id="gem-raft-b-leader"><circle cx="196" cy="48" r="14" /></clipPath>
        <clipPath id="gem-raft-b-follower"><circle cx="64" cy="40" r="10" /></clipPath>
        <clipPath id="gem-raft-b-laggard"><circle cx="76" cy="76" r="10" /></clipPath>
      </defs>

      {/* backdrop + halo */}
      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft-b-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="150" cy="72" rx="60" ry="42" fill="url(#gem-raft-b-halo)" opacity="0.12" />

      {/* UPPER TIER — messaging plane */}
      <g fill="none" strokeLinecap="round">
        <path d="M 178 42 Q 124 26 76 41" stroke="#465059" strokeWidth="2.5" opacity="0.8" />
        <path d="M 178 56 Q 130 72 88 75" stroke="#465059" strokeWidth="2.5" opacity="0.8" />
        <polyline points="-5 -4 0 0 -5 4" stroke="#7d7669" strokeWidth="1.2" transform="translate(126 32) rotate(180)" />
        <polyline points="-5 -4 0 0 -5 4" stroke="#7d7669" strokeWidth="1.2" transform="translate(132 69) rotate(166)" />
        <path d="M 88 82 Q 134 88 170 64" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
        <polyline points="-5 -4 0 0 -5 4" stroke="#7d7669" strokeWidth="1.2" transform="translate(132 82) rotate(-12)" />
      </g>

      {/* THE STREAM — paper, right-to-left, neutral echoes */}
      <g>
        <circle cx="157" cy="37" r="3" fill="#7d7669" opacity="0.4" />
        <circle cx="141" cy="34.5" r="4" fill="#7d7669" opacity="0.55" />
        <rect x="119.5" y="28.5" width="15" height="8" rx="4" fill="#eeeae0" />
        <rect x="132" y="30" width="2" height="2" fill="#f4efe4" />
      </g>

      {/* FOLLOWER */}
      <g>
        <line x1="64" y1="51" x2="64" y2="101" stroke="#465059" strokeWidth="2" strokeLinecap="round" />
        <circle cx="64" cy="40" r="10" fill="#26333b" />
        <circle cx="64" cy="38" r="6.5" fill="#465059" clipPath="url(#gem-raft-b-follower)" />
        <circle cx="64" cy="36.5" r="3" fill="#7d7669" clipPath="url(#gem-raft-b-follower)" />
        <circle cx="64" cy="40" r="11.5" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
      </g>

      {/* LAGGARD (de-saturated, dashed stub) */}
      <g>
        <line x1="76" y1="87" x2="76" y2="101" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" opacity="0.8" />
        <circle cx="76" cy="76" r="10" fill="#26333b" />
        <circle cx="76" cy="74.5" r="6.5" fill="#465059" clipPath="url(#gem-raft-b-laggard)" />
        <circle cx="76" cy="76" r="11.5" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
      </g>

      {/* LOWER TIER — the log bus */}
      <g strokeLinecap="round">
        <rect x="24" y="104" width="212" height="8" rx="2" fill="#26333b" />
        <rect x="24" y="101" width="212" height="3.5" rx="1.75" fill="#465059" />
        <rect x="24" y="101" width="172" height="11" fill="url(#gem-raft-b-dense)" opacity="0.3" />
        <line x1="56" y1="101" x2="56" y2="112" stroke="#0b1317" strokeWidth="1.2" opacity="0.9" />
        <line x1="88" y1="101" x2="88" y2="112" stroke="#0b1317" strokeWidth="1.2" opacity="0.9" />
        <line x1="120" y1="101" x2="120" y2="112" stroke="#0b1317" strokeWidth="1.2" opacity="0.9" />
        <line x1="152" y1="101" x2="152" y2="112" stroke="#0b1317" strokeWidth="1.2" opacity="0.9" />
        <line x1="214" y1="101" x2="214" y2="112" stroke="#7d7669" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      </g>

      {/* FUTURE TAIL */}
      <line x1="200" y1="106.5" x2="232" y2="106.5" stroke="#7d7669" strokeWidth="1.2" strokeDasharray="4 4" strokeLinecap="round" opacity="0.6" />

      {/* FRONTIER + beacon (collinear with leader) */}
      <line x1="196" y1="92" x2="196" y2="118" stroke="#b6ac95" strokeWidth="2" strokeLinecap="round" />
      <polygon points="192.5,118 199.5,118 196,124.5" fill="#eeeae0" />

      {/* LEADER — dominant focal node at the write head */}
      <g strokeLinecap="round">
        <line x1="196" y1="67" x2="196" y2="101" stroke="#465059" strokeWidth="2.5" />
        <circle cx="196" cy="48" r="14" fill="#26333b" />
        <circle cx="196" cy="46" r="10" fill="#465059" clipPath="url(#gem-raft-b-leader)" />
        <circle cx="196" cy="44" r="6" fill="#7d7669" clipPath="url(#gem-raft-b-leader)" />
        <circle cx="196" cy="45" r="9" fill="url(#gem-raft-b-dense)" opacity="0.75" clipPath="url(#gem-raft-b-leader)" />
        <circle cx="196" cy="48" r="19" fill="none" stroke="#7d2723" strokeWidth="3.5" opacity="0.9" />
        <line x1="190" y1="27" x2="187" y2="20" stroke="#ff6a5f" strokeWidth="1.5" />
        <line x1="202" y1="27" x2="205" y2="20" stroke="#ff6a5f" strokeWidth="1.5" />
        <rect x="191" y="41" width="2" height="2" fill="#f4efe4" />
      </g>

      {/* ENTRY IN FLIGHT (coral) + halftone echo */}
      <g>
        <rect x="201" y="78.5" width="14" height="7" rx="3.5" fill="#ff6a5f" transform="rotate(12 208 82)" />
        <rect x="210" y="80" width="2" height="2" fill="#f4efe4" transform="rotate(12 208 82)" />
        <circle cx="222" cy="92" r="3.5" fill="url(#gem-raft-b-dense)" opacity="0.6" />
      </g>
    </svg>
  );
}
