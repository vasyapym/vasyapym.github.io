// Raft visual-interest rethink, round 4 — two candidates from the delegated
// brief (BRIEF-card-art-raft-rethink-4.md). Grammar break: neither candidate
// reuses the stepped-cap-disc / hairline-link / tick-row vocabulary of rounds
// 1–3. Candidate A "Quorum overprint" = three giant halftone discs whose
// triple overlap is the coral consensus zone; candidate B "Copper trace" =
// the log as a heavy PCB bus with via donuts and a crowned write-head pad.
// Integrated with two mechanical fixes, applied to both: the full-plate
// #0b1317 rect removed (family marks never paint the plate — it would occlude
// the card background) and the missing opacity={0.12} added to the gem-halo
// ellipses (without it the halo pulse base renders at full opacity).
// Ids namespaced per candidate; on adoption the winner's ids rename to the
// family prefix gem-raft-*.
import type { CSSProperties } from "react";

const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// Candidate A — "Quorum overprint": consensus as three giant overlapping
// halftone discs; the triple-overlap zone blazes solid coral; the crowned
// leader feeds it, the laggard's dashed ring gap faces what it missed.
export function RaftCandidateA() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft-a-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft-a-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft-a-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft-a-inkdots" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#465059" />
        </pattern>
        <pattern id="gem-raft-a-inkdots-shift" patternUnits="userSpaceOnUse" width={7} height={7} patternTransform="translate(3.5 3.5)">
          <circle cx={3.5} cy={3.5} r={1.9} fill="#465059" />
        </pattern>
      </defs>

      {/* Backdrop */}
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft-a-sparse)" opacity={0.09} />

      {/* Follower disc */}
      <circle cx={80} cy={74} r={40} fill="url(#gem-raft-a-inkdots)" opacity={0.14} />
      <circle cx={80} cy={74} r={40} fill="none" stroke="#465059" strokeWidth={3} />
      <circle cx={80} cy={74} r={4} fill="#7d7669" />

      {/* Laggard disc */}
      <circle cx={118} cy={102} r={40} fill="url(#gem-raft-a-inkdots-shift)" opacity={0.12} />
      <path d="M120.8 62.1A40 40 0 1 1 104.3 64.4" fill="none" stroke="#465059" strokeWidth={3} />
      <path d="M104.3 64.4A40 40 0 0 1 120.8 62.1" fill="none" stroke="#7d7669" strokeWidth={2.5} strokeDasharray="4 4" opacity={0.7} />
      <circle cx={118} cy={102} r={4} fill="#7d7669" />

      {/* Leader disc */}
      <circle cx={152} cy={62} r={42} fill="url(#gem-raft-a-dense)" opacity={0.15} />
      <circle cx={152} cy={62} r={42} fill="none" stroke="#7d2723" strokeWidth={4} />
      <circle cx={152} cy={62} r={8} fill="#7d2723" />
      <rect x={149} y={58} width={3} height={3} fill="#eeeae0" />

      {/* Vote trickle from follower → zone */}
      <circle cx={90} cy={82} r={3} fill="#b6ac95" />
      <circle cx={99} cy={87} r={2.2} fill="#b6ac95" opacity={0.7} />

      {/* Consensus zone — triple overlap */}
      <circle cx={115} cy={80} r={19} fill="url(#gem-raft-a-dense)" opacity={0.45} />
      <circle cx={115} cy={80} r={11} fill="#ff6a5f" opacity={0.9} />

      {/* Entry in flight from leader → zone */}
      <rect x={-6} y={-3.5} width={12} height={7} rx={3.5} fill="#ff6a5f" transform="translate(134 71) rotate(-26)" />
      <circle cx={143} cy={66.5} r={2.5} fill="#ff6a5f" opacity={0.7} />
      <circle cx={148} cy={64} r={2} fill="#ff6a5f" opacity={0.5} />

      {/* Halo */}
      <ellipse cx={125} cy={82} rx={26} ry={18} fill="url(#gem-raft-a-halo)" className="gem-halo" style={haloVar(0.12)} opacity={0.12} />
    </svg>
  );
}

// Candidate B — "Copper trace": the replicated log as a heavy PCB bus with
// drilled via donuts, elbow-routed pads, and the leader as the crowned
// write-head pad where the solid trace ends and the dashed future begins.
export function RaftCandidateB() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft-b-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft-b-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft-b-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>

      {/* Backdrop */}
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft-b-sparse)" opacity={0.09} />

      {/* ACK return (behind trace) */}
      <path d="M188 110Q120 124 62 112" fill="none" stroke="#7d7669" strokeWidth={2.5} strokeDasharray="2 4" opacity={0.5} />
      <path d="M121 118L127 121L121 124" fill="none" stroke="#7d7669" strokeWidth={2.5} transform="rotate(-8 124 121)" />

      {/* Main trace (committed log) */}
      <line x1={24} y1={96} x2={190} y2={96} stroke="#465059" strokeWidth={6} strokeLinecap="round" />

      {/* Unrouted tail (future writes) */}
      <line x1={198} y1={96} x2={236} y2={96} stroke="#7d7669" strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" />

      {/* Vias (committed entries) */}
      <circle cx={44} cy={96} r={4.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2.5} />
      <circle cx={76} cy={96} r={4.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2.5} />
      <circle cx={108} cy={96} r={4.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2.5} />
      <circle cx={140} cy={96} r={4.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2.5} />
      <circle cx={172} cy={96} r={4.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2.5} />

      {/* Follower branch + pad */}
      <path d="M64 53V76L92 96" fill="none" stroke="#465059" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={64} cy={44} r={9} fill="#0b1317" stroke="#465059" strokeWidth={3} />
      <circle cx={64} cy={44} r={3.5} fill="#7d7669" />

      {/* Laggard branch + pad */}
      <path d="M48 119V112L64 96" fill="none" stroke="#7d7669" strokeWidth={3} strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={48} cy={128} r={9} fill="#0b1317" stroke="#7d7669" strokeWidth={2.5} strokeDasharray="4 3" />
      <circle cx={48} cy={128} r={3} fill="#7d7669" />

      {/* Leader write-head pad */}
      <circle cx={196} cy={96} r={13} fill="#0b1317" />
      <circle cx={196} cy={96} r={9.5} fill="url(#gem-raft-b-dense)" opacity={0.8} />
      <circle cx={196} cy={96} r={13} fill="none" stroke="#7d2723" strokeWidth={3.5} />
      <line x1={190} y1={80} x2={187} y2={73} stroke="#ff6a5f" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={202} y1={80} x2={205} y2={73} stroke="#ff6a5f" strokeWidth={2.5} strokeLinecap="round" />
      <rect x={192} y={90} width={3} height={3} fill="#eeeae0" />

      {/* Replication pulses */}
      <circle cx={160} cy={96} r={4} fill="#ff6a5f" />
      <circle cx={144} cy={96} r={2.5} fill="#ff6a5f" opacity={0.7} />

      {/* Direction chevrons */}
      <path d="M132 85L128 88L132 91" fill="none" stroke="#7d7669" strokeWidth={2.5} />
      <path d="M100 85L96 88L100 91" fill="none" stroke="#7d7669" strokeWidth={2.5} />

      {/* Plate texture micro-vias */}
      <circle cx={140} cy={72} r={2.5} fill="none" stroke="#465059" strokeWidth={2.5} />
      <circle cx={104} cy={122} r={2.5} fill="none" stroke="#465059" strokeWidth={2.5} />

      {/* Halo */}
      <ellipse cx={130} cy={90} rx={28} ry={20} fill="url(#gem-raft-b-halo)" className="gem-halo" style={haloVar(0.12)} opacity={0.12} />
    </svg>
  );
}
