// Raft vault round — TEN evolutions of the round-5 winner "Vault quorum"
// (owner pick n122: "i like candidate i. let's keep working on it. add nodes
// (not only 3)"). Brief: BRIEF-card-art-raft-rethink-6.md. Every variant keeps
// the vault identity (circular door, keyholes-as-nodes, turned-keys-as-
// committed, crowned coral leader mid-turn, dashed empty laggard) and raises
// the node count to 5-7 with a legible turned majority, each adding ONE
// mechanism: A quorum span, B combination dial, C time-lock sweep, D door
// ajar, E safe-deposit wall, F turning wave, G bolt-work ring, H tumbler
// stack, I deposit slot, J quorum bell. Integrated verbatim with mechanical
// fixes from numeric geometry review: bottom-arc keyholes pulled inward in
// A/B/C/D/F/H/I/J so straight-down key shafts stay inside the door rim (the
// delivered anchors put key heads on/past the rim band — worst case I-round6
// breached the safe area at y147); A's quorum span re-threaded through the
// moved keys; D's committed log bars re-seated inside the door interior
// (delivered ~13px outside the frame) and the light-wedge tip nudged off the
// frame ring; G's laggard detached key head removed (collided with the
// protruding bolt); H's leader shaft dropped (its head buried inside tumbler
// disc 1) and disc-3's gate moved onto the disc edge; I's grille window
// re-seated inside the inner ring; J's bell bracket closed onto the dome;
// F's crest chevron seated on the arc end. Ids namespaced gem-raft6-*.
import type { CSSProperties } from "react";

const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// A — "Seven-key majority": seven keyholes, the four engaged ones linked by
// one solid coral span arc — the quorum as a continuous linked set.
export function RaftVaultA() {
  const Turned = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={2} />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#7d7669" />
      <rect x={-1.5} y={10} width={3} height={12} fill="#7d7669" />
      <circle cy={24} r={4} fill="#7d7669" />
    </g>
  );
  const Empty = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
    </g>
  );
  const Leader = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={9.5} fill="none" stroke="#7d2723" strokeWidth={3} />
      <circle r={5} fill="#0b1317" stroke="#ff6a5f" strokeWidth={2} />
      <g transform="rotate(32)">
        <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#ff6a5f" />
        <rect x={-1.5} y={10} width={3} height={12} fill="#ff6a5f" />
        <circle cy={24} r={4} fill="#ff6a5f" />
      </g>
      <path d="M -14 0 A 14 14 0 0 1 0 -14" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
      <path d="M -3 -12 L 1 -15 L 1 -9 Z" fill="#ff6a5f" />
    </g>
  );
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft6-a-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft6-a-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft6-a-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft6-a-sparse)" opacity={0.09} />
      <circle cx={130} cy={84} r={54} fill="none" stroke="#465059" strokeWidth={5} />
      <circle cx={130} cy={84} r={45} fill="none" stroke="#26333b" strokeWidth={2.5} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
        return <line key={a} x1={130 + 49 * s} y1={84 - 49 * c} x2={130 + 54 * s} y2={84 - 54 * c} stroke="#465059" strokeWidth={3} />;
      })}
      <rect x={108} y={81} width={44} height={6} rx={3} fill="#0b1317" stroke="#465059" strokeWidth={2.5} />
      <circle cx={130} cy={84} r={5.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2} />
      <rect x={128} y={82} width={2} height={2} fill="#b6ac95" />
      <ellipse className="gem-halo" style={haloVar(0.12)} opacity={0.12} cx={140} cy={90} rx={38} ry={30} fill="url(#gem-raft6-a-halo)" />
      {/* quorum span, threaded through the three seated keys (integration fix:
          bottom pair pulled inward, span re-threaded to match) */}
      <path d="M 155 64 Q 165 90 142 108" fill="none" stroke="#ff6a5f" strokeWidth={3} opacity={0.85} />
      <line x1={155} y1={64} x2={158} y2={61} stroke="#ff6a5f" strokeWidth={2.5} />
      <line x1={142} y1={108} x2={144} y2={112} stroke="#ff6a5f" strokeWidth={2.5} />
      <Turned x={155} y={64} />
      <Turned x={161} y={91} />
      <Turned x={142} y={108} />
      <Empty x={118} y={108} />
      <Empty x={99} y={91} />
      <Empty x={105} y={64} />
      <Leader x={130} y={52} />
    </svg>
  );
}

// B — "Combination dial": the dial's notch ring is the log — seven notches
// passed (solid), five ahead (dashed), coral needle mid-advance; five rim
// keyholes vote around it.
export function RaftVaultB() {
  const Turned = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={2} />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#7d7669" />
      <rect x={-1.5} y={10} width={3} height={12} fill="#7d7669" />
      <circle cy={24} r={4} fill="#7d7669" />
    </g>
  );
  const Empty = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
    </g>
  );
  const Leader = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={9.5} fill="none" stroke="#7d2723" strokeWidth={3} />
      <circle r={5} fill="#0b1317" stroke="#ff6a5f" strokeWidth={2} />
      <g transform="rotate(32)">
        <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#ff6a5f" />
        <rect x={-1.5} y={10} width={3} height={12} fill="#ff6a5f" />
        <circle cy={24} r={4} fill="#ff6a5f" />
      </g>
      <path d="M -14 0 A 14 14 0 0 1 0 -14" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
      <path d="M -3 -12 L 1 -15 L 1 -9 Z" fill="#ff6a5f" />
    </g>
  );
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft6-b-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft6-b-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft6-b-sparse)" opacity={0.09} />
      <circle cx={130} cy={84} r={54} fill="none" stroke="#465059" strokeWidth={5} />
      <circle cx={130} cy={84} r={45} fill="none" stroke="#26333b" strokeWidth={2.5} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
        return <line key={a} x1={130 + 49 * s} y1={84 - 49 * c} x2={130 + 54 * s} y2={84 - 54 * c} stroke="#465059" strokeWidth={3} />;
      })}
      {/* spokes (integration fix: bottom pair pulled inward with the keyholes) */}
      {([[130, 46], [166, 72], [150, 106], [110, 106], [94, 72]] as [number, number][]).map(([x, y], i) => (
        <line key={i} x1={130} y1={84} x2={x} y2={y} stroke="#26333b" strokeWidth={2} />
      ))}
      <circle cx={130} cy={84} r={20} fill="#0b1317" stroke="#465059" strokeWidth={3} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = ((i * 30) * Math.PI) / 180, s = Math.sin(a), c = Math.cos(a), solid = i < 7;
        return <line key={i} x1={130 + 16 * s} y1={84 - 16 * c} x2={130 + 20 * s} y2={84 - 20 * c} stroke={solid ? "#b6ac95" : "#7d7669"} strokeWidth={2.5} strokeDasharray={solid ? undefined : "2 2"} />;
      })}
      <ellipse className="gem-halo" style={haloVar(0.12)} opacity={0.12} cx={130} cy={84} rx={34} ry={30} fill="url(#gem-raft6-b-halo)" />
      <line x1={130} y1={84} x2={122.8} y2={99.4} stroke="#ff6a5f" strokeWidth={3} />
      <circle cx={130} cy={84} r={3} fill="#ff6a5f" />
      <Turned x={166} y={72} />
      <Turned x={150} y={106} />
      <Empty x={110} y={106} />
      <Empty x={94} y={72} />
      <Leader x={130} y={46} />
    </svg>
  );
}

// C — "Time-lock sweep": a coral sweep hand has traversed 150° — the swept
// sector is a halftone overprint (committed), the rest dashed (future); six
// hour-station keyholes vote behind and ahead of the hand.
export function RaftVaultC() {
  const Turned = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={2} />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#7d7669" />
      <rect x={-1.5} y={10} width={3} height={12} fill="#7d7669" />
      <circle cy={24} r={4} fill="#7d7669" />
    </g>
  );
  const Empty = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
    </g>
  );
  const Leader = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={9.5} fill="none" stroke="#7d2723" strokeWidth={3} />
      <circle r={5} fill="#0b1317" stroke="#ff6a5f" strokeWidth={2} />
      <g transform="rotate(32)">
        <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#ff6a5f" />
        <rect x={-1.5} y={10} width={3} height={12} fill="#ff6a5f" />
        <circle cy={24} r={4} fill="#ff6a5f" />
      </g>
      <path d="M -14 0 A 14 14 0 0 1 0 -14" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
      <path d="M -3 -12 L 1 -15 L 1 -9 Z" fill="#ff6a5f" />
    </g>
  );
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft6-c-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft6-c-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft6-c-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft6-c-sparse)" opacity={0.09} />
      <path d="M 130 84 L 130 39 A 45 45 0 0 1 152.5 122.9 Z" fill="url(#gem-raft6-c-dense)" opacity={0.3} />
      <path d="M 152.5 122.97 A 45 45 0 1 1 130 39" fill="none" stroke="#7d7669" strokeWidth={2} strokeDasharray="5 5" />
      <circle cx={130} cy={84} r={54} fill="none" stroke="#465059" strokeWidth={5} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
        return <line key={a} x1={130 + 49 * s} y1={84 - 49 * c} x2={130 + 54 * s} y2={84 - 54 * c} stroke="#465059" strokeWidth={3} />;
      })}
      <ellipse className="gem-halo" style={haloVar(0.12)} opacity={0.12} cx={138} cy={96} rx={36} ry={30} fill="url(#gem-raft6-c-halo)" />
      <line x1={130} y1={84} x2={145} y2={110} stroke="#ff6a5f" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={130} y1={84} x2={125} y2={75.3} stroke="#ff6a5f" strokeWidth={3} />
      <circle cx={130} cy={84} r={4} fill="#ff6a5f" />
      <Turned x={161} y={66} />
      <Turned x={160} y={100} />
      <Empty x={130} y={120} />
      <Empty x={99} y={102} />
      <Empty x={99} y={66} />
      <Leader x={130} y={48} />
    </svg>
  );
}

// D — "Door ajar": the leaf has swung open on a left hinge — the closed right
// half still carries the voting keys while the revealed interior shows the
// committed coral log bars and an escaping coral light wedge.
export function RaftVaultD() {
  const Turned = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={2} />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#7d7669" />
      <rect x={-1.5} y={10} width={3} height={12} fill="#7d7669" />
      <circle cy={24} r={4} fill="#7d7669" />
    </g>
  );
  const Empty = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
    </g>
  );
  const Leader = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={9.5} fill="none" stroke="#7d2723" strokeWidth={3} />
      <circle r={5} fill="#0b1317" stroke="#ff6a5f" strokeWidth={2} />
      <g transform="rotate(32)">
        <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#ff6a5f" />
        <rect x={-1.5} y={10} width={3} height={12} fill="#ff6a5f" />
        <circle cy={24} r={4} fill="#ff6a5f" />
      </g>
      <path d="M -14 0 A 14 14 0 0 1 0 -14" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
      <path d="M -3 -12 L 1 -15 L 1 -9 Z" fill="#ff6a5f" />
    </g>
  );
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft6-d-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft6-d-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft6-d-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft6-d-sparse)" opacity={0.09} />
      <circle cx={134} cy={84} r={54} fill="none" stroke="#465059" strokeWidth={5} />
      <line x1={74} y1={64} x2={84} y2={64} stroke="#465059" strokeWidth={3.5} />
      <line x1={74} y1={104} x2={84} y2={104} stroke="#465059" strokeWidth={3.5} />
      {/* committed log bars inside the revealed half (integration fix:
          re-seated inside the interior — delivered ~13px outside the frame) */}
      <rect x={85} y={69} width={26} height={6} rx={2} fill="url(#gem-raft6-d-dense)" opacity={0.75} />
      <rect x={89} y={81} width={26} height={6} rx={2} fill="url(#gem-raft6-d-dense)" opacity={0.75} />
      <rect x={85} y={93} width={26} height={6} rx={2} fill="url(#gem-raft6-d-dense)" opacity={0.75} />
      <line x1={88} y1={108} x2={122} y2={108} stroke="#26333b" strokeWidth={2.5} />
      <path d="M 134 30 A 54 54 0 0 1 134 138 Z" fill="#0b1317" stroke="#465059" strokeWidth={4} />
      {[30, 150].map((a) => {
        const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
        return <line key={a} x1={134 + 47 * s} y1={84 - 47 * c} x2={134 + 53 * s} y2={84 - 53 * c} stroke="#465059" strokeWidth={3} />;
      })}
      <ellipse className="gem-halo" style={haloVar(0.12)} opacity={0.12} cx={108} cy={62} rx={34} ry={30} fill="url(#gem-raft6-d-halo)" />
      {/* light wedge through the gap (integration fix: tip kept inside the
          frame ring) */}
      <polygon points="134,34 134,52 100,46" fill="url(#gem-raft6-d-dense)" opacity={0.55} />
      <Turned x={170} y={71} />
      <Turned x={170} y={97} />
      <Turned x={148} y={108} />
      <Empty x={98} y={97} />
      <Leader x={153} y={51} />
    </svg>
  );
}

// E — "Safe-deposit wall": each node IS a vault door — crowned coral leader
// mid-turn, two small doors open with coral-lit interiors, one closed
// committing next, the laggard sealed with dashed X-seams.
export function RaftVaultE() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft6-e-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft6-e-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft6-e-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft6-e-sparse)" opacity={0.09} />
      <line x1={140} y1={30} x2={140} y2={136} stroke="#26333b" strokeWidth={2} />
      <line x1={214} y1={30} x2={214} y2={136} stroke="#26333b" strokeWidth={2} />
      <line x1={24} y1={136} x2={236} y2={136} stroke="#465059" strokeWidth={3} />
      <ellipse className="gem-halo" style={haloVar(0.12)} opacity={0.12} cx={92} cy={74} rx={40} ry={40} fill="url(#gem-raft6-e-halo)" />
      <circle cx={92} cy={74} r={38} fill="#0b1317" stroke="#465059" strokeWidth={5} />
      <circle cx={92} cy={74} r={31} fill="none" stroke="#26333b" strokeWidth={2.5} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
        return <line key={a} x1={92 + 34 * s} y1={74 - 34 * c} x2={92 + 38 * s} y2={74 - 38 * c} stroke="#465059" strokeWidth={3} />;
      })}
      <circle cx={92} cy={74} r={42} fill="none" stroke="#7d2723" strokeWidth={3.5} />
      <circle cx={92} cy={74} r={6} fill="#ff6a5f" />
      <g transform="translate(92 74)">
        <g transform="rotate(32) scale(1.3)">
          <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#ff6a5f" />
          <rect x={-1.5} y={10} width={3} height={12} fill="#ff6a5f" />
          <circle cy={24} r={4} fill="#ff6a5f" />
        </g>
        <path d="M -16 0 A 16 16 0 0 1 0 -16" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
        <line x1={-4} y1={-46} x2={-4} y2={-40} stroke="#ff6a5f" strokeWidth={2.5} />
        <line x1={4} y1={-46} x2={4} y2={-40} stroke="#ff6a5f" strokeWidth={2.5} />
      </g>
      <rect x={90} y={72} width={2} height={2} fill="#b6ac95" />
      <circle cx={168} cy={46} r={16} fill="#0b1317" stroke="#465059" strokeWidth={3} />
      <circle cx={168} cy={46} r={9} fill="url(#gem-raft6-e-dense)" opacity={0.7} />
      <line x1={162} y1={33} x2={174} y2={33} stroke="#465059" strokeWidth={2.5} />
      <circle cx={158} cy={122} r={16} fill="#0b1317" stroke="#465059" strokeWidth={3} />
      <circle cx={158} cy={122} r={9} fill="url(#gem-raft6-e-dense)" opacity={0.7} />
      <line x1={152} y1={109} x2={164} y2={109} stroke="#465059" strokeWidth={2.5} />
      <circle cx={196} cy={88} r={16} fill="#0b1317" stroke="#465059" strokeWidth={3} />
      <circle cx={196} cy={88} r={2} fill="#7d7669" />
      <circle cx={114} cy={126} r={16} fill="#0b1317" stroke="#7d7669" strokeWidth={2} strokeDasharray="4 3" />
      <line x1={106} y1={118} x2={122} y2={134} stroke="#7d7669" strokeWidth={2} strokeDasharray="4 3" />
      <line x1={122} y1={118} x2={106} y2={134} stroke="#7d7669" strokeWidth={2} strokeDasharray="4 3" />
    </svg>
  );
}

// F — "Turning wave": per-key phase arcs show how far each rotation has
// progressed, decaying clockwise like a propagating turn-wave whose coral
// crest is the leader mid-turn.
export function RaftVaultF() {
  const pt = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
    const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  const Turned = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={2} />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#7d7669" />
      <rect x={-1.5} y={10} width={3} height={12} fill="#7d7669" />
      <circle cy={24} r={4} fill="#7d7669" />
    </g>
  );
  const Empty = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
    </g>
  );
  const Leader = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={9.5} fill="none" stroke="#7d2723" strokeWidth={3} />
      <circle r={5} fill="#0b1317" stroke="#ff6a5f" strokeWidth={2} />
      <g transform="rotate(32)">
        <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#ff6a5f" />
        <rect x={-1.5} y={10} width={3} height={12} fill="#ff6a5f" />
        <circle cy={24} r={4} fill="#ff6a5f" />
      </g>
      <path d="M -14 0 A 14 14 0 0 1 0 -14" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
    </g>
  );
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft6-f-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft6-f-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft6-f-sparse)" opacity={0.09} />
      <circle cx={130} cy={84} r={54} fill="none" stroke="#465059" strokeWidth={5} />
      <circle cx={130} cy={84} r={45} fill="none" stroke="#26333b" strokeWidth={2.5} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
        return <line key={a} x1={130 + 49 * s} y1={84 - 49 * c} x2={130 + 54 * s} y2={84 - 54 * c} stroke="#465059" strokeWidth={3} />;
      })}
      <rect x={108} y={81} width={44} height={6} rx={3} fill="#0b1317" stroke="#465059" strokeWidth={2.5} />
      <circle cx={130} cy={84} r={5.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2} />
      <ellipse className="gem-halo" style={haloVar(0.12)} opacity={0.12} cx={130} cy={70} rx={38} ry={30} fill="url(#gem-raft6-f-halo)" />
      <path d={arc(156, 63, 11, 250, 300)} fill="none" stroke="#b6ac95" strokeWidth={2.5} opacity={0.8} />
      <path d={arc(163, 90, 11, 250, 280)} fill="none" stroke="#b6ac95" strokeWidth={2.5} opacity={0.6} />
      <path d={arc(143, 108, 11, 250, 265)} fill="none" stroke="#b6ac95" strokeWidth={2.5} opacity={0.4} />
      <path d={arc(130, 50, 14, 250, 32)} fill="none" stroke="#ff6a5f" strokeWidth={3} />
      {/* crest chevron seated on the arc end (integration fix) */}
      <path d="M 134 40 L 139 39 L 136 44 Z" fill="#ff6a5f" />
      <Turned x={156} y={63} />
      <Turned x={163} y={90} />
      <Turned x={143} y={108} />
      <Empty x={115} y={111} />
      <Empty x={97} y={90} />
      <Empty x={104} y={63} />
      <Leader x={130} y={50} />
    </svg>
  );
}

// G — "Bolt-work ring": the inner ring is an exposed toothed lock-ring —
// seated keys have retracted their bolts (stubs inside the rim) while the
// laggard's bolt still protrudes past the rim so the door cannot close.
export function RaftVaultG() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft6-g-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft6-g-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft6-g-sparse)" opacity={0.09} />
      <circle cx={130} cy={84} r={54} fill="none" stroke="#465059" strokeWidth={5} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
        return <line key={a} x1={130 + 49 * s} y1={84 - 49 * c} x2={130 + 54 * s} y2={84 - 54 * c} stroke="#465059" strokeWidth={3} />;
      })}
      <circle cx={130} cy={84} r={44} fill="none" stroke="#465059" strokeWidth={7} strokeDasharray="7 8" />
      <circle cx={130} cy={84} r={5.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2} />
      {([[172, 60], [172, 108], [130, 132]] as [number, number][]).map(([x, y], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={130} y2={84} stroke="#26333b" strokeWidth={2.5} />
          <circle cx={x} cy={y} r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={2} />
          <circle cx={x} cy={y} r={4.5} fill="#7d7669" />
        </g>
      ))}
      {([[172, 60], [172, 108], [130, 132]] as [number, number][]).map(([x, y], i) => {
        const dx = 130 - x, dy = 84 - y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        return <line key={i} x1={x + ux * 6} y1={y + uy * 6} x2={x + ux * 12} y2={y + uy * 12} stroke="#465059" strokeWidth={3} />;
      })}
      <ellipse className="gem-halo" style={haloVar(0.12)} opacity={0.12} cx={130} cy={56} rx={36} ry={30} fill="url(#gem-raft6-g-halo)" />
      <line x1={130} y1={36} x2={130} y2={84} stroke="#26333b" strokeWidth={2.5} />
      <g transform="translate(130 36)">
        <circle r={9.5} fill="none" stroke="#7d2723" strokeWidth={3} />
        <circle r={5} fill="#0b1317" stroke="#ff6a5f" strokeWidth={2} />
        <g transform="rotate(30)">
          <rect x={-1.5} y={5} width={3} height={12} fill="#ff6a5f" />
          <circle cy={19} r={4.5} fill="#ff6a5f" />
        </g>
        <path d="M -12 0 A 12 12 0 0 1 0 -12" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
      </g>
      {/* laggard: dashed glyph + protruding bolt (integration fix: the
          detached dashed key head removed — it collided with the bolt) */}
      <g transform="translate(88 108)">
        <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
        <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
      </g>
      <line x1={84} y1={110} x2={76} y2={117} stroke="#7d7669" strokeWidth={4} strokeDasharray="4 3" />
      <g transform="translate(88 60)">
        <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
        <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
      </g>
    </svg>
  );
}

// H — "Tumbler stack": the log as three tumbler discs — the top two gate
// notches have aligned at the coral fence bar, which drops through them and
// stops at the bottom disc's misaligned (dashed) gate, the laggard entry.
export function RaftVaultH() {
  const Turned = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={2} />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#7d7669" />
      <rect x={-1.5} y={10} width={3} height={12} fill="#7d7669" />
      <circle cy={24} r={4} fill="#7d7669" />
    </g>
  );
  const Empty = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
    </g>
  );
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft6-h-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft6-h-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft6-h-sparse)" opacity={0.09} />
      <circle cx={130} cy={84} r={54} fill="none" stroke="#465059" strokeWidth={5} />
      <circle cx={130} cy={84} r={45} fill="none" stroke="#26333b" strokeWidth={2.5} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
        return <line key={a} x1={130 + 49 * s} y1={84 - 49 * c} x2={130 + 54 * s} y2={84 - 54 * c} stroke="#465059" strokeWidth={3} />;
      })}
      <circle cx={130} cy={84} r={5.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2} />
      <circle cx={130} cy={60} r={17} fill="#0b1317" stroke="#465059" strokeWidth={3} />
      <circle cx={130} cy={84} r={14} fill="#0b1317" stroke="#465059" strokeWidth={2.5} />
      <circle cx={130} cy={106} r={11} fill="#0b1317" stroke="#465059" strokeWidth={2.5} />
      <line x1={116} y1={72} x2={144} y2={72} stroke="#26333b" strokeWidth={2} />
      <line x1={119} y1={95} x2={141} y2={95} stroke="#26333b" strokeWidth={2} />
      <ellipse className="gem-halo" style={haloVar(0.12)} opacity={0.12} cx={140} cy={72} rx={30} ry={34} fill="url(#gem-raft6-h-halo)" />
      <rect x={144.5} y={57.5} width={5} height={5} fill="#ff6a5f" opacity={0.9} />
      <rect x={141.5} y={81.5} width={5} height={5} fill="#ff6a5f" opacity={0.9} />
      {/* misaligned gate (integration fix: seated on disc 3's left edge) */}
      <rect x={116.5} y={103.5} width={5} height={5} fill="none" stroke="#7d7669" strokeWidth={2} strokeDasharray="2 2" />
      <rect x={143} y={52} width={4} height={38} rx={1} fill="#ff6a5f" opacity={0.85} />
      <Turned x={168} y={72} />
      <Turned x={148} y={107} />
      <Empty x={107} y={116} />
      <Empty x={92} y={72} />
      {/* leader: crown + coral glyph + motion arc only (integration fix: the
          delivered key shaft buried its head inside tumbler disc 1) */}
      <g transform="translate(130 44)">
        <circle r={9.5} fill="none" stroke="#7d2723" strokeWidth={3} />
        <circle r={5} fill="#0b1317" stroke="#ff6a5f" strokeWidth={2} />
        <path d="M -14 0 A 14 14 0 0 1 0 -14" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
        <path d="M -3 -12 L 1 -15 L 1 -9 Z" fill="#ff6a5f" />
      </g>
    </svg>
  );
}

// I — "Deposit slot": the write port receives a coral entry mid-drop while a
// lower grille window shows the committed pile already inside; six keyholes
// vote around the mechanism.
export function RaftVaultI() {
  const Turned = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={2} />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#7d7669" />
      <rect x={-1.5} y={10} width={3} height={12} fill="#7d7669" />
      <circle cy={24} r={4} fill="#7d7669" />
    </g>
  );
  const Empty = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
    </g>
  );
  const Leader = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={8} fill="none" stroke="#7d2723" strokeWidth={3} />
      <circle r={5} fill="#0b1317" stroke="#ff6a5f" strokeWidth={2} />
      <g transform="rotate(32)">
        <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#ff6a5f" />
        <rect x={-1.5} y={10} width={3} height={12} fill="#ff6a5f" />
        <circle cy={24} r={4} fill="#ff6a5f" />
      </g>
      <path d="M -14 0 A 14 14 0 0 1 0 -14" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
      <path d="M -3 -12 L 1 -15 L 1 -9 Z" fill="#ff6a5f" />
    </g>
  );
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft6-i-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft6-i-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft6-i-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft6-i-sparse)" opacity={0.09} />
      <circle cx={130} cy={84} r={54} fill="none" stroke="#465059" strokeWidth={5} />
      <circle cx={130} cy={84} r={45} fill="none" stroke="#26333b" strokeWidth={2.5} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
        return <line key={a} x1={130 + 49 * s} y1={84 - 49 * c} x2={130 + 54 * s} y2={84 - 54 * c} stroke="#465059" strokeWidth={3} />;
      })}
      <circle cx={130} cy={84} r={5.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2} />
      {/* committed window (integration fix: re-seated inside the inner ring) */}
      <rect x={90} y={100} width={40} height={18} rx={3} fill="url(#gem-raft6-i-dense)" opacity={0.6} stroke="#465059" strokeWidth={2} />
      <line x1={103} y1={100} x2={103} y2={118} stroke="#26333b" strokeWidth={2.5} />
      <line x1={112} y1={100} x2={112} y2={118} stroke="#26333b" strokeWidth={2.5} />
      <line x1={121} y1={100} x2={121} y2={118} stroke="#26333b" strokeWidth={2.5} />
      <ellipse className="gem-halo" style={haloVar(0.12)} opacity={0.12} cx={152} cy={54} rx={34} ry={30} fill="url(#gem-raft6-i-halo)" />
      <g transform="rotate(-30 152 58)">
        <rect x={134} y={53} width={36} height={10} rx={5} fill="#0b1317" stroke="#ff6a5f" strokeWidth={2.5} />
        <rect x={140} y={58} width={12} height={4} rx={2} fill="#ff6a5f" opacity={0.5} />
        <rect x={154} y={58} width={12} height={4} rx={2} fill="#ff6a5f" opacity={0.7} />
      </g>
      <g transform="rotate(-30 166 36)">
        <rect x={159} y={33.5} width={14} height={5} rx={2} fill="#ff6a5f" />
        <line x1={162} y1={26} x2={168} y2={26} stroke="#ff6a5f" strokeWidth={2} strokeDasharray="2 3" opacity={0.7} />
        <line x1={161} y1={30} x2={167} y2={30} stroke="#ff6a5f" strokeWidth={2} strokeDasharray="2 3" opacity={0.7} />
      </g>
      <Turned x={169} y={74} />
      {/* integration fixes: bottom keys pulled inward — the delivered heads
          landed on/past the rim (one breached the safe area at y147) */}
      <Turned x={150} y={104} />
      <Turned x={114} y={106} />
      <Empty x={93} y={74} />
      <Empty x={102} y={45} />
      <Leader x={140} y={45} />
    </svg>
  );
}

// J — "Quorum bell": a mounted alarm bell rings mid-swing precisely because
// the majority just turned — the election answered; five keyholes vote below.
export function RaftVaultJ() {
  const Turned = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={2} />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#7d7669" />
      <rect x={-1.5} y={10} width={3} height={12} fill="#7d7669" />
      <circle cy={24} r={4} fill="#7d7669" />
    </g>
  );
  const Empty = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="#0b1317" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
      <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="none" stroke="#7d7669" strokeWidth={1.5} strokeDasharray="3 3" />
    </g>
  );
  const Leader = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={9.5} fill="none" stroke="#7d2723" strokeWidth={3} />
      <circle r={5} fill="#0b1317" stroke="#ff6a5f" strokeWidth={2} />
      <g transform="rotate(32)">
        <path d="M -2 4 L 2 4 L 3 10 L -3 10 Z" fill="#ff6a5f" />
        <rect x={-1.5} y={10} width={3} height={12} fill="#ff6a5f" />
        <circle cy={24} r={4} fill="#ff6a5f" />
      </g>
      <path d="M -14 0 A 14 14 0 0 1 0 -14" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
      <path d="M -3 -12 L 1 -15 L 1 -9 Z" fill="#ff6a5f" />
    </g>
  );
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft6-j-dense" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft6-j-sparse" patternUnits="userSpaceOnUse" width={11} height={11}>
          <circle cx={5.5} cy={5.5} r={1.6} fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft6-j-halo" patternUnits="userSpaceOnUse" width={7} height={7}>
          <circle cx={3.5} cy={3.5} r={1.9} fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx={130} cy={84} rx={104} ry={64} fill="url(#gem-raft6-j-sparse)" opacity={0.09} />
      {/* bracket closed onto the dome (integration fix: delivered 2px float) */}
      <rect x={122} y={26} width={24} height={5} rx={2} fill="#465059" />
      <ellipse className="gem-halo" style={haloVar(0.12)} opacity={0.12} cx={134} cy={40} rx={30} ry={26} fill="url(#gem-raft6-j-halo)" />
      <path d="M 121 44 A 13 13 0 0 1 147 44 Z" fill="url(#gem-raft6-j-dense)" opacity={0.85} />
      <line x1={121} y1={44} x2={147} y2={44} stroke="#7d2723" strokeWidth={3} />
      <circle cx={137} cy={50} r={2.5} fill="#ff6a5f" />
      <rect x={135} y={35} width={2} height={2} fill="#b6ac95" />
      <path d="M 112 40 A 16 16 0 0 1 120 30" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
      <path d="M 114 48 A 12 12 0 0 1 120 40" fill="none" stroke="#ff6a5f" strokeWidth={2} strokeDasharray="3 3" />
      <line x1={150} y1={38} x2={156} y2={36} stroke="#7d7669" strokeWidth={2.5} />
      <circle cx={134} cy={94} r={48} fill="none" stroke="#465059" strokeWidth={5} />
      <circle cx={134} cy={94} r={40} fill="none" stroke="#26333b" strokeWidth={2.5} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
        return <line key={a} x1={134 + 43 * s} y1={94 - 43 * c} x2={134 + 48 * s} y2={94 - 48 * c} stroke="#465059" strokeWidth={3} />;
      })}
      <rect x={116} y={91} width={36} height={6} rx={3} fill="#0b1317" stroke="#465059" strokeWidth={2.5} />
      <circle cx={134} cy={94} r={5.5} fill="#0b1317" stroke="#b6ac95" strokeWidth={2} />
      <Turned x={164} y={82} />
      {/* integration fix: bottom key pulled inward, head clear of the rim */}
      <Turned x={149} y={112} />
      <Empty x={115} y={118} />
      <Empty x={104} y={82} />
      <Leader x={134} y={60} />
    </svg>
  );
}
