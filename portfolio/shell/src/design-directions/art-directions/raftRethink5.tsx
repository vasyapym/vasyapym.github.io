// Raft visual-interest rethink, round 5 — TEN candidates from the delegated
// brief (BRIEF-card-art-raft-rethink-5.md). Owner ask: the control loop is
// "good but boring" — ten different concepts, ten graphic languages, one
// family print technique (plate, neutral ramp + coral spot, halftone screens,
// one gem-halo, safe area). A metro line, B gear train, C punched tape,
// D orrery, E printing press, F dish array, G honeycomb, H suspension bridge,
// I vault quorum, J beacon chain. Integrated verbatim with two mechanical
// fixes: H's suspender hairlines re-seated onto the main-cable Q-curve (the
// delivered tops floated 4–12px below it), and D's outer rotation chevron
// nudged onto orbit 2's radius. Ids namespaced gem-raft5-*; on adoption the
// winner's ids rename to the family prefix gem-raft-*.
import type { CSSProperties } from "react";

const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// A — "Metro line": the log as a transit trunk; committed track solid, the
// unbuilt extension dashed, crowned interchange terminus, coral train in
// flight, offline laggard station with a skipped-service loop.
export function RaftCandidateA() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft5-a-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft5-a-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft5-a-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft5-a-sparse)" opacity={0.09} />

      {/* committed trunk + future extension */}
      <line x1={24} y1={88} x2={186} y2={88} stroke="#465059" strokeWidth={7} strokeLinecap="round" />
      <line x1={194} y1={88} x2={236} y2={88} stroke="#7d7669" strokeWidth={3.5} strokeDasharray="8 6" />

      {/* follower stations */}
      <circle cx={64} cy={88} r={7.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2.5} />
      <circle cx={64} cy={88} r={2.5} fill="#7d7669" />
      <circle cx={110} cy={88} r={7.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2.5} />
      <circle cx={110} cy={88} r={2.5} fill="#7d7669" />

      {/* laggard station + skipped-service loop */}
      <circle cx={150} cy={88} r={7.5} fill="#0b1317" stroke="#7d7669" strokeWidth={2.5} strokeDasharray="4 3" />
      <circle cx={150} cy={88} r={2} fill="#7d7669" opacity={0.7} />
      <path d="M 136 80 Q 146 62 156 68" fill="none" stroke="#7d7669" strokeWidth={2} strokeDasharray="3 4" />

      {/* leader interchange */}
      <circle cx={176} cy={88} r={11} fill="#0b1317" />
      <circle cx={176} cy={88} r={12} fill="none" stroke="#7d2723" strokeWidth={3.5} />
      <circle cx={176} cy={88} r={7} fill="url(#gem-raft5-a-dense)" opacity={0.85} />
      <rect x={172} y={83} width={2} height={2} fill="#eeeae0" />
      <line x1={171} y1={74} x2={169} y2={68} stroke="#ff6a5f" strokeWidth={2.5} />
      <line x1={181} y1={74} x2={183} y2={68} stroke="#ff6a5f" strokeWidth={2.5} />

      {/* coral train in flight */}
      <rect x={120} y={80} width={16} height={8} rx={4} fill="#ff6a5f" />
      <circle cx={140} cy={84} r={2.5} fill="#ff6a5f" opacity={0.7} />

      {/* direction (left) */}
      <path d="M 104 94 L 100 98 L 104 102" fill="none" stroke="#7d7669" strokeWidth={2.5} />
      <path d="M 76 94 L 72 98 L 76 102" fill="none" stroke="#7d7669" strokeWidth={2.5} />

      <ellipse className="gem-halo" style={haloVar(0.12)} cx={150} cy={82} rx={40} ry={30} fill="url(#gem-raft5-a-halo)" opacity={0.12} />
    </svg>
  );
}

// B — "Gear train": consensus as meshing machinery — tooth rings as thick
// dashed strokes, coral mesh contacts, a missing-tooth laggard, spark flying
// off the leader.
export function RaftCandidateB() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft5-b-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft5-b-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft5-b-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft5-b-sparse)" opacity={0.09} />

      {/* follower gear */}
      <circle cx={158} cy={102} r={21} fill="#0b1317" stroke="#465059" strokeWidth={3} />
      <circle cx={158} cy={102} r={24} fill="none" stroke="#465059" strokeWidth={5.5} strokeDasharray="5 6" />
      <circle cx={158} cy={102} r={3.5} fill="#7d7669" />

      {/* laggard gear (missing tooth ~225deg) */}
      <circle cx={200} cy={54} r={17} fill="#0b1317" stroke="#7d7669" strokeWidth={2.5} strokeDasharray="4 3" />
      <circle cx={200} cy={54} r={20} fill="none" stroke="#7d7669" strokeWidth={5} strokeDasharray="5 6" strokeDashoffset={8} />
      <circle cx={200} cy={54} r={3} fill="#7d7669" />

      {/* leader gear */}
      <circle cx={92} cy={80} r={30} fill="#0b1317" stroke="#465059" strokeWidth={3} />
      <circle cx={92} cy={80} r={33} fill="none" stroke="#b6ac95" strokeWidth={6} strokeDasharray="6 7" />
      <circle cx={92} cy={80} r={30} fill="none" stroke="#7d2723" strokeWidth={4} />
      <circle cx={92} cy={80} r={12} fill="url(#gem-raft5-b-dense)" opacity={0.8} />
      <circle cx={92} cy={80} r={4.5} fill="#ff6a5f" />
      <rect x={88} y={75} width={2} height={2} fill="#eeeae0" />
      <path d="M 71.3 76.4 A 21 21 0 0 1 81.5 61.8" fill="none" stroke="#7d7669" strokeWidth={2.5} />
      <path d="M 78 60 L 81.5 61.8 L 82 57.8" fill="none" stroke="#7d7669" strokeWidth={2.5} />

      {/* mesh consensus wedges */}
      <polygon points="121,98 131,98 126,90" fill="url(#gem-raft5-b-dense)" opacity={0.75} />
      <polygon points="175,80 185,80 180,72" fill="url(#gem-raft5-b-dense)" opacity={0.75} />

      {/* protagonist spark */}
      <path d="M 112 56 Q 122 52 126 60" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="2 4" opacity={0.8} />
      <circle cx={126} cy={60} r={4} fill="#ff6a5f" />
      <circle cx={118} cy={54} r={2.5} fill="#ff6a5f" opacity={0.6} />

      <ellipse className="gem-halo" style={haloVar(0.12)} cx={100} cy={76} rx={38} ry={30} fill="url(#gem-raft5-b-halo)" opacity={0.12} />
    </svg>
  );
}

// C — "Punched tape": the log as vintage paper tape — punched holes as
// committed entries, crowned punch head stamping the fresh hole, reader-shoe
// followers, mis-fed laggard, dashed un-punched tail.
export function RaftCandidateC() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft5-c-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft5-c-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft5-c-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft5-c-sparse)" opacity={0.09} />

      {/* tape + unwritten tail */}
      <rect x={22} y={66} width={164} height={40} rx={2} fill="#465059" />
      <rect x={190} y={66} width={46} height={40} rx={2} fill="none" stroke="#7d7669" strokeWidth={2.5} strokeDasharray="6 5" />

      {/* edge perforations */}
      {[34, 60, 86, 112, 138, 164].map((x) => (
        <g key={x}>
          <circle cx={x} cy={72} r={1.5} fill="#26333b" />
          <circle cx={x} cy={100} r={1.5} fill="#26333b" />
        </g>
      ))}

      {/* committed punched holes */}
      {[44, 72, 100, 128, 156].map((x) => (
        <circle key={x} cx={x} cy={86} r={4.5} fill="#0b1317" />
      ))}

      {/* fresh hole protagonist */}
      <circle cx={176} cy={86} r={8} fill="url(#gem-raft5-c-dense)" opacity={0.8} />
      <circle cx={176} cy={86} r={4.5} fill="#0b1317" />
      <line x1={172} y1={76} x2={170} y2={71} stroke="#ff6a5f" strokeWidth={2} />
      <line x1={180} y1={76} x2={182} y2={71} stroke="#ff6a5f" strokeWidth={2} />

      {/* leader punch head */}
      <rect x={172.5} y={54} width={7} height={8} fill="#465059" />
      <circle cx={176} cy={46} r={10} fill="#0b1317" />
      <circle cx={176} cy={46} r={10} fill="none" stroke="#7d2723" strokeWidth={3.5} />
      <circle cx={176} cy={46} r={4} fill="#ff6a5f" />
      <rect x={172} y={41} width={2} height={2} fill="#eeeae0" />

      {/* follower reader shoes */}
      <line x1={58} y1={106} x2={58} y2={113} stroke="#465059" strokeWidth={3} />
      <rect x={47} y={113} width={22} height={10} rx={3} fill="#26333b" stroke="#465059" strokeWidth={2} />
      <line x1={102} y1={106} x2={102} y2={113} stroke="#465059" strokeWidth={3} />
      <rect x={91} y={113} width={22} height={10} rx={3} fill="#26333b" stroke="#465059" strokeWidth={2} />

      {/* laggard mis-fed reader */}
      <line x1={146} y1={106} x2={146} y2={119} stroke="#7d7669" strokeWidth={2} strokeDasharray="4 3" />
      <rect x={135} y={119} width={22} height={10} rx={3} fill="#26333b" stroke="#7d7669" strokeWidth={2} strokeDasharray="4 3" />
      <rect x={141} y={122} width={10} height={4} fill="none" stroke="#7d7669" strokeWidth={1} strokeDasharray="2 2" />

      {/* feed direction */}
      <path d="M 34 82 L 30 86 L 34 90" fill="none" stroke="#b6ac95" strokeWidth={2.5} />

      <ellipse className="gem-halo" style={haloVar(0.12)} cx={170} cy={64} rx={36} ry={30} fill="url(#gem-raft5-c-halo)" opacity={0.12} />
    </svg>
  );
}

// D — "Orrery": the cluster as an orbital diagram — crowned coral sun, swept
// vs unswept orbit arcs as committed/future, transfer moon in flight, mostly
// unswept laggard orbit. Chevrons sit on the orbit radii (integration fix).
export function RaftCandidateD() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft5-d-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft5-d-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft5-d-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft5-d-sparse)" opacity={0.09} />

      {/* orbit 1: committed sweep vs future */}
      <path d="M 113 111.4 A 34 34 0 1 1 156 103.9" fill="none" stroke="#465059" strokeWidth={3} />
      <path d="M 156 103.9 A 34 34 0 0 1 113 111.4" fill="none" stroke="#465059" strokeWidth={3} strokeDasharray="5 5" />

      {/* orbit 2 (laggard): barely started */}
      <path d="M 81.1 64.2 A 52 52 0 0 1 121 30.8" fill="none" stroke="#7d7669" strokeWidth={3} />
      <path d="M 121 30.8 A 52 52 0 1 1 81.1 64.2" fill="none" stroke="#7d7669" strokeWidth={3} strokeDasharray="5 5" opacity={0.85} />
      <path d="M 147.8 33.1 A 52 52 0 0 1 163.4 42.2" fill="none" stroke="#7d7669" strokeWidth={2} strokeDasharray="1 6" opacity={0.7} />

      {/* moons */}
      <circle cx={159} cy={65} r={5.5} fill="#26333b" stroke="#b6ac95" strokeWidth={2} />
      <circle cx={159} cy={65} r={1.8} fill="#7d7669" />
      <circle cx={96} cy={121} r={5} fill="#26333b" stroke="#7d7669" strokeWidth={2} strokeDasharray="3 3" />

      {/* sun / leader */}
      <circle cx={130} cy={82} r={13} fill="#0b1317" />
      <circle cx={130} cy={82} r={13} fill="none" stroke="#7d2723" strokeWidth={4} />
      <circle cx={130} cy={82} r={9} fill="url(#gem-raft5-d-dense)" opacity={0.75} />
      <circle cx={130} cy={82} r={3.5} fill="#ff6a5f" />
      <rect x={126} y={77} width={2} height={2} fill="#eeeae0" />

      {/* transfer protagonist */}
      <path d="M 141 74 L 166 50" fill="none" stroke="#ff6a5f" strokeWidth={1.5} strokeDasharray="2 4" opacity={0.8} />
      <circle cx={170} cy={47} r={4.5} fill="#ff6a5f" />
      <circle cx={175} cy={44} r={2.5} fill="#ff6a5f" opacity={0.6} />

      {/* rotation direction (on-orbit) */}
      <path d="M 97 95 L 100.6 99 L 104.6 96" fill="none" stroke="#7d7669" strokeWidth={2.5} />
      <path d="M 172 103 L 176 107 L 180 104" fill="none" stroke="#7d7669" strokeWidth={2.5} />

      <ellipse className="gem-halo" style={haloVar(0.12)} cx={132} cy={80} rx={38} ry={30} fill="url(#gem-raft5-d-halo)" opacity={0.12} />
    </svg>
  );
}

// E — "Printing press": the log as a printed sheet feeding right-to-left
// under three rollers — crowned leader at the print frontier, coral halftone
// committed overprint, blank future, laggard that missed its stamp.
export function RaftCandidateE() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft5-e-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft5-e-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft5-e-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <clipPath id="gem-raft5-e-sheet">
          <rect x={22} y={96} width={200} height={28} rx={2} />
        </clipPath>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft5-e-sparse)" opacity={0.09} />

      {/* sheet + printed overprint */}
      <rect x={22} y={96} width={200} height={28} rx={2} fill="#b6ac95" />
      <rect x={22} y={96} width={128} height={28} fill="url(#gem-raft5-e-dense)" opacity={0.5} clipPath="url(#gem-raft5-e-sheet)" />
      <path d="M 200 106 L 196 110 L 200 114" fill="none" stroke="#26333b" strokeWidth={2.5} />
      <path d="M 182 106 L 178 110 L 182 114" fill="none" stroke="#26333b" strokeWidth={2.5} />

      {/* frontier */}
      <line x1={150} y1={96} x2={150} y2={124} stroke="#7d7669" strokeWidth={2} strokeDasharray="4 4" />

      {/* fresh coral entry */}
      <rect x={136} y={106} width={12} height={8} rx={2} fill="#ff6a5f" />

      {/* leader roller */}
      <rect x={147.5} y={87} width={5} height={9} fill="#465059" />
      <circle cx={150} cy={66} r={21} fill="#0b1317" stroke="#465059" strokeWidth={3} />
      <circle cx={150} cy={66} r={21} fill="none" stroke="#7d2723" strokeWidth={4} />
      <circle cx={150} cy={66} r={10} fill="url(#gem-raft5-e-dense)" opacity={0.8} />
      <circle cx={150} cy={66} r={4} fill="#ff6a5f" />
      <path d="M 140 55 L 137 58.5 L 141 61" fill="none" stroke="#7d7669" strokeWidth={2.5} />
      <line x1={145} y1={44} x2={143} y2={38} stroke="#ff6a5f" strokeWidth={2.5} />
      <line x1={155} y1={44} x2={157} y2={38} stroke="#ff6a5f" strokeWidth={2.5} />
      <rect x={146} y={62} width={2} height={2} fill="#eeeae0" />

      {/* follower rollers + stamped copies */}
      <line x1={96} y1={89} x2={96} y2={96} stroke="#465059" strokeWidth={2.5} />
      <circle cx={96} cy={80} r={9} fill="#0b1317" stroke="#465059" strokeWidth={2.5} />
      <circle cx={96} cy={80} r={2.5} fill="#7d7669" />
      <rect x={91} y={103} width={10} height={6} fill="#26333b" />
      <line x1={60} y1={89} x2={60} y2={96} stroke="#465059" strokeWidth={2.5} />
      <circle cx={60} cy={80} r={9} fill="#0b1317" stroke="#465059" strokeWidth={2.5} />
      <circle cx={60} cy={80} r={2.5} fill="#7d7669" />
      <rect x={55} y={103} width={10} height={6} fill="#26333b" />

      {/* laggard roller + missed stamp */}
      <circle cx={36} cy={84} r={9} fill="#0b1317" stroke="#7d7669" strokeWidth={2} strokeDasharray="4 3" />
      <circle cx={36} cy={84} r={2.5} fill="#7d7669" opacity={0.6} />
      <rect x={31} y={103} width={10} height={6} fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />

      <ellipse className="gem-halo" style={haloVar(0.12)} cx={146} cy={76} rx={38} ry={30} fill="url(#gem-raft5-e-halo)" opacity={0.12} />
    </svg>
  );
}

// F — "Dish array": the cluster as a radio telescope field — crowned leader
// dish broadcasting a bold coral wavefront, receiving follower, laggard
// tilted skyward whose signal dies short, dashed future corridors.
export function RaftCandidateF() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft5-f-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft5-f-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft5-f-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft5-f-sparse)" opacity={0.09} />

      <line x1={24} y1={128} x2={236} y2={128} stroke="#465059" strokeWidth={3} strokeLinecap="round" />

      {/* future corridors */}
      <path d="M 92 74 L 232 58" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="4 6" opacity={0.5} />
      <path d="M 92 78 L 232 44" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="4 6" opacity={0.5} />

      {/* leader dish */}
      <g transform="rotate(-25 66 96)">
        <path d="M 52 96 A 16 16 0 0 1 80 96" fill="none" stroke="#465059" strokeWidth={5} />
      </g>
      <line x1={66} y1={96} x2={76} y2={84} stroke="#7d7669" strokeWidth={2.5} />
      <line x1={66} y1={104} x2={66} y2={128} stroke="#465059" strokeWidth={3.5} />
      <circle cx={78} cy={82} r={7.5} fill="none" stroke="#7d2723" strokeWidth={3} />
      <circle cx={78} cy={82} r={4} fill="#ff6a5f" />

      {/* wavefront protagonist */}
      <path d="M 80.9 74.7 A 26 26 0 0 1 89.6 107" fill="none" stroke="#ff6a5f" strokeWidth={3.5} opacity={0.85} />
      <path d="M 88.9 63.2 A 40 40 0 0 1 102.3 112.9" fill="none" stroke="#ff6a5f" strokeWidth={2.5} opacity={0.5} />

      {/* follower dish + received lobe */}
      <g transform="rotate(15 146 100)">
        <path d="M 132 100 A 16 16 0 0 1 160 100" fill="none" stroke="#465059" strokeWidth={5} />
      </g>
      <circle cx={146} cy={92} r={7.5} fill="none" stroke="#465059" strokeWidth={3} />
      <circle cx={146} cy={92} r={4} fill="#26333b" />
      <polygon points="123,90 137,86 133,96" fill="url(#gem-raft5-f-dense)" opacity={0.7} />

      {/* laggard dish (tilted away) + short wavefront */}
      <g transform="rotate(-70 210 96)">
        <path d="M 196 96 A 16 16 0 0 1 224 96" fill="none" stroke="#7d7669" strokeWidth={2.5} strokeDasharray="4 3" />
      </g>
      <line x1={210} y1={104} x2={210} y2={128} stroke="#7d7669" strokeWidth={3} />
      <path d="M 154 74 A 30 30 0 0 1 168 92" fill="none" stroke="#7d7669" strokeWidth={2} strokeDasharray="3 4" opacity={0.7} />

      {/* direction */}
      <path d="M 108 80 L 112 84 L 108 88" fill="none" stroke="#7d7669" strokeWidth={2.5} />

      <ellipse className="gem-halo" style={haloVar(0.12)} cx={110} cy={80} rx={40} ry={30} fill="url(#gem-raft5-f-halo)" opacity={0.12} />
    </svg>
  );
}

// G — "Honeycomb": consensus as three hexagon cells with the replicated log
// as a common-wall path — coral overprint on the committed prefix, unsealed
// (dashed) laggard cell. Shared walls overdraw whole outlines (noted
// deviation, invisible at card scale).
export function RaftCandidateG() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft5-g-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft5-g-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft5-g-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft5-g-sparse)" opacity={0.09} />

      {/* hex cells (full outlines; shared walls overdrawn — noted deviation) */}
      <polygon points="104,35 127.38,48.5 127.38,75.5 104,89 80.62,75.5 80.62,48.5" fill="#0b1317" stroke="#465059" strokeWidth={3.5} />
      <polygon points="156,35 179.38,48.5 179.38,75.5 156,89 132.62,75.5 132.62,48.5" fill="#0b1317" stroke="#465059" strokeWidth={3.5} />
      <polygon points="130,78 153.38,91.5 153.38,118.5 130,132 106.62,118.5 106.62,91.5" fill="#0b1317" stroke="#465059" strokeWidth={3.5} />

      {/* leader inner ring + coral fill */}
      <polygon points="104,43 120.45,52.5 120.45,71.5 104,81 87.55,71.5 87.55,52.5" fill="url(#gem-raft5-g-dense)" opacity={0.35} stroke="#7d2723" strokeWidth={4} />
      <line x1={100} y1={24} x2={99} y2={18} stroke="#ff6a5f" strokeWidth={2.5} />
      <line x1={108} y1={24} x2={109} y2={18} stroke="#ff6a5f" strokeWidth={2.5} />

      {/* log path: committed prefix overprint + neutral base + dashed tail */}
      <polyline points="84,76 104,50 130,66 156,50 176,76" fill="none" stroke="#465059" strokeWidth={5} strokeLinejoin="round" />
      <polyline points="84,76 104,50 130,66" fill="none" stroke="url(#gem-raft5-g-dense)" strokeWidth={7} opacity={0.8} strokeLinejoin="round" />
      <path d="M 156 50 L 176 76" fill="none" stroke="#7d7669" strokeWidth={3} strokeDasharray="6 5" />

      {/* laggard cell dashed lower walls + log slot */}
      <path d="M 153.38 91.5 L 153.38 118.5 L 130 132 L 106.62 118.5" fill="none" stroke="#7d7669" strokeWidth={3} strokeDasharray="5 4" />
      <polygon points="130,100 134.33,102.5 134.33,107.5 130,110 125.67,107.5 125.67,102.5" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />

      {/* protagonist coral hex */}
      <polygon points="143,68 148.2,71 148.2,77 143,80 137.8,77 137.8,71" fill="#ff6a5f" />
      <circle cx={136} cy={68} r={2.5} fill="#ff6a5f" opacity={0.6} />

      {/* direction */}
      <path d="M 113 62 L 117 58 L 121 61" fill="none" stroke="#7d7669" strokeWidth={2.5} />

      <ellipse className="gem-halo" style={haloVar(0.12)} cx={140} cy={80} rx={38} ry={30} fill="url(#gem-raft5-g-halo)" opacity={0.12} />
    </svg>
  );
}

// H — "Suspension bridge": the log as an unfinished span — suspended
// committed deck, bare dashed future cable, towers + short pier as nodes,
// coral gondola in flight. Suspender tops sit ON the cable Q-curve
// (integration fix: delivered tops floated 4–12px below it).
export function RaftCandidateH() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft5-h-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft5-h-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft5-h-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft5-h-sparse)" opacity={0.09} />
      <line x1={24} y1={128} x2={236} y2={128} stroke="#26333b" strokeWidth={3} opacity={0.8} />

      {/* deck committed + future */}
      <line x1={24} y1={96} x2={176} y2={96} stroke="#465059" strokeWidth={6} strokeLinecap="round" />
      <line x1={182} y1={96} x2={232} y2={96} stroke="#7d7669" strokeWidth={3} strokeDasharray="7 6" />

      {/* main cable + suspenders (tops on the curve: 65.7/58.9/69.8/72.2/68.4) */}
      <path d="M 24 88 Q 44 56 64 56 Q 100 92 136 48" fill="none" stroke="#b6ac95" strokeWidth={2.5} />
      <line x1={42} y1={66} x2={42} y2={96} stroke="#7d7669" strokeWidth={2} opacity={0.7} />
      <line x1={52} y1={59} x2={52} y2={96} stroke="#7d7669" strokeWidth={2} opacity={0.7} />
      <line x1={84} y1={70} x2={84} y2={96} stroke="#7d7669" strokeWidth={2} opacity={0.7} />
      <line x1={98} y1={72} x2={98} y2={96} stroke="#7d7669" strokeWidth={2} opacity={0.7} />
      <line x1={112} y1={68} x2={112} y2={96} stroke="#7d7669" strokeWidth={2} opacity={0.7} />

      {/* future cable (bare) */}
      <path d="M 141 48 Q 180 84 232 88" fill="none" stroke="#7d7669" strokeWidth={2.5} strokeDasharray="6 5" />

      {/* follower tower */}
      <line x1={60} y1={96} x2={60} y2={56} stroke="#465059" strokeWidth={3.5} />
      <line x1={68} y1={96} x2={68} y2={56} stroke="#465059" strokeWidth={3.5} />
      <line x1={60} y1={66} x2={68} y2={66} stroke="#465059" strokeWidth={3.5} />
      <circle cx={64} cy={52} r={4.5} fill="none" stroke="#465059" strokeWidth={2.5} />

      {/* leader tower + crown */}
      <line x1={131} y1={96} x2={131} y2={46} stroke="#465059" strokeWidth={4} />
      <line x1={141} y1={96} x2={141} y2={46} stroke="#465059" strokeWidth={4} />
      <line x1={131} y1={58} x2={141} y2={58} stroke="#465059" strokeWidth={4} />
      <line x1={131} y1={72} x2={141} y2={72} stroke="#465059" strokeWidth={4} />
      <circle cx={136} cy={42} r={7} fill="none" stroke="#7d2723" strokeWidth={3.5} />
      <circle cx={136} cy={42} r={3} fill="#ff6a5f" />
      <rect x={133} y={38} width={2} height={2} fill="#eeeae0" />
      <line x1={131} y1={34} x2={129} y2={28} stroke="#ff6a5f" strokeWidth={2.5} />
      <line x1={141} y1={34} x2={143} y2={28} stroke="#ff6a5f" strokeWidth={2.5} />

      {/* laggard pier (short of deck) */}
      <line x1={204} y1={128} x2={204} y2={110} stroke="#7d7669" strokeWidth={2.5} strokeDasharray="4 3" />
      <line x1={212} y1={128} x2={212} y2={110} stroke="#7d7669" strokeWidth={2.5} strokeDasharray="4 3" />
      <rect x={202} y={108} width={12} height={5} fill="none" stroke="#7d7669" strokeWidth={2} strokeDasharray="4 3" />

      {/* gondola protagonist */}
      <rect x={98} y={89} width={12} height={7} rx={2} fill="#ff6a5f" />
      <circle cx={118} cy={89} r={2.5} fill="#ff6a5f" opacity={0.7} />
      <circle cx={124} cy={89} r={2} fill="#ff6a5f" opacity={0.5} />

      <ellipse className="gem-halo" style={haloVar(0.12)} cx={110} cy={84} rx={40} ry={30} fill="url(#gem-raft5-h-halo)" opacity={0.12} />
    </svg>
  );
}

// I — "Vault quorum": commitment as a three-key vault door — two keys turned
// (quorum), the coral leader key mid-turn with a motion arc, the laggard's
// keyhole empty and dashed.
export function RaftCandidateI() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft5-i-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft5-i-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft5-i-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft5-i-sparse)" opacity={0.09} />

      {/* vault door */}
      <circle cx={130} cy={84} r={54} fill="#0b1317" stroke="#465059" strokeWidth={5} />
      <circle cx={130} cy={84} r={45} fill="none" stroke="#26333b" strokeWidth={2.5} />
      <line x1={179} y1={84} x2={184} y2={84} stroke="#465059" strokeWidth={3} />
      <line x1={154.5} y1={126.4} x2={157} y2={130.8} stroke="#465059" strokeWidth={3} />
      <line x1={105.5} y1={126.4} x2={103} y2={130.8} stroke="#465059" strokeWidth={3} />
      <line x1={81} y1={84} x2={76} y2={84} stroke="#465059" strokeWidth={3} />
      <line x1={105.5} y1={41.6} x2={103} y2={37.2} stroke="#465059" strokeWidth={3} />
      <line x1={154.5} y1={41.6} x2={157} y2={37.2} stroke="#465059" strokeWidth={3} />

      {/* handle + hub */}
      <rect x={108} y={81} width={44} height={6} rx={3} fill="#0b1317" stroke="#465059" strokeWidth={2.5} />
      <circle cx={130} cy={84} r={5.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2} />
      <rect x={129} y={83} width={2} height={2} fill="#eeeae0" />

      {/* keyhole spokes */}
      <line x1={130} y1={84} x2={130} y2={52} stroke="#26333b" strokeWidth={2} />
      <line x1={130} y1={84} x2={102} y2={100} stroke="#26333b" strokeWidth={2} />
      <line x1={130} y1={84} x2={158} y2={100} stroke="#26333b" strokeWidth={2} />

      {/* follower keyhole (turned, seated) */}
      <circle cx={158} cy={100} r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={2} />
      <path d="M 156 104 L 160 104 L 161 110 L 155 110 Z" fill="#7d7669" />
      <rect x={156.5} y={110} width={3} height={12} fill="#7d7669" />
      <circle cx={158} cy={124} r={4} fill="#7d7669" />

      {/* laggard keyhole (empty, awaited) */}
      <circle cx={102} cy={100} r={5} fill="none" stroke="#7d7669" strokeWidth={2} strokeDasharray="3 3" />
      <path d="M 100 104 L 104 104 L 105 110 L 99 110 Z" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="2 2" />
      <rect x={92} y={86} width={8} height={12} rx={2} fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" transform="rotate(-35 96 92)" />

      {/* leader keyhole + coral key mid-turn */}
      <circle cx={130} cy={52} r={9.5} fill="none" stroke="#7d2723" strokeWidth={3} />
      <circle cx={130} cy={52} r={5} fill="#0b1317" stroke="#ff6a5f" strokeWidth={2} />
      <path d="M 128 56 L 132 56 L 133 62 L 127 62 Z" fill="#ff6a5f" />
      <g transform="rotate(-35 130 52)">
        <rect x={128.5} y={38} width={3} height={14} fill="#ff6a5f" />
        <circle cx={130} cy={36} r={4.5} fill="#ff6a5f" />
      </g>
      <path d="M 132.4 38.2 A 14 14 0 0 1 143.2 47.2" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
      <path d="M 140 46 L 143.2 47.2 L 142 43.5" fill="none" stroke="#ff6a5f" strokeWidth={2} />

      <ellipse className="gem-halo" style={haloVar(0.12)} cx={130} cy={56} rx={38} ry={30} fill="url(#gem-raft5-i-halo)" opacity={0.12} />
    </svg>
  );
}

// J — "Beacon chain": the cluster as a hilltop signal line — a stepped ridge
// mass carrying three beacon masts, lit coral committed spans, a dashed dark
// gap before the unlit laggard, one spark mid-air.
export function RaftCandidateJ() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft5-j-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft5-j-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft5-j-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft5-j-sparse)" opacity={0.09} />

      {/* ridge */}
      <polygon points="16,144 16,118 48,118 78,96 108,96 130,60 152,96 182,96 208,112 244,112 244,144" fill="#26333b" />

      {/* beacon 1 (follower) */}
      <line x1={58} y1={96} x2={58} y2={76} stroke="#b6ac95" strokeWidth={3.5} />
      <rect x={52} y={68} width={12} height={9} fill="#0b1317" stroke="#b6ac95" strokeWidth={2} />
      <circle cx={58} cy={72} r={3.5} fill="url(#gem-raft5-j-dense)" opacity={0.6} />

      {/* laggard beacon (unlit) */}
      <line x1={196} y1={96} x2={196} y2={78} stroke="#7d7669" strokeWidth={3} />
      <rect x={190} y={70} width={12} height={9} fill="#0b1317" stroke="#7d7669" strokeWidth={2} strokeDasharray="3 3" />

      {/* leader beacon (peak) */}
      <line x1={130} y1={60} x2={130} y2={38} stroke="#465059" strokeWidth={4} />
      <rect x={122} y={28} width={16} height={11} fill="#0b1317" stroke="#7d2723" strokeWidth={3} />
      <circle cx={130} cy={33} r={5} fill="url(#gem-raft5-j-dense)" opacity={0.85} />
      <circle cx={130} cy={33} r={2.5} fill="#ff6a5f" />
      <line x1={124} y1={24} x2={122} y2={18} stroke="#ff6a5f" strokeWidth={2.5} />
      <line x1={136} y1={24} x2={138} y2={18} stroke="#ff6a5f" strokeWidth={2.5} />
      <rect x={126} y={30} width={2} height={2} fill="#eeeae0" />

      {/* lit committed spans */}
      <circle cx={70} cy={92} r={2} fill="#ff6a5f" opacity={0.9} />
      <circle cx={82} cy={88} r={2} fill="#ff6a5f" opacity={0.9} />
      <circle cx={94} cy={84} r={2} fill="#ff6a5f" opacity={0.9} />
      <circle cx={106} cy={76} r={2} fill="#ff6a5f" opacity={0.9} />
      <circle cx={46} cy={102} r={2} fill="#ff6a5f" opacity={0.5} />
      <circle cx={36} cy={108} r={2} fill="#ff6a5f" opacity={0.3} />

      {/* dark future span + gap */}
      <path d="M 152 96 Q 168 94 182 96" fill="none" stroke="#7d7669" strokeWidth={2} strokeDasharray="4 5" opacity={0.7} />

      {/* protagonist spark */}
      <path d="M 138 46 Q 158 56 166 78" fill="none" stroke="#ff6a5f" strokeWidth={1.5} strokeDasharray="2 4" opacity={0.8} />
      <circle cx={166} cy={78} r={4} fill="#ff6a5f" />
      <circle cx={172} cy={84} r={2.5} fill="#ff6a5f" opacity={0.6} />

      {/* star glints */}
      <rect x={91} y={43} width={2} height={2} fill="#eeeae0" opacity={0.55} />
      <rect x={221} y={59} width={2} height={2} fill="#eeeae0" opacity={0.55} />

      <ellipse className="gem-halo" style={haloVar(0.12)} cx={130} cy={46} rx={38} ry={30} fill="url(#gem-raft5-j-halo)" opacity={0.12} />
    </svg>
  );
}
