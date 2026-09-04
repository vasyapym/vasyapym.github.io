// Raft cybernetic round — TEN cybernetic variants requested off the owner's
// circuit-organism reference (reference-images/cybernetics.jpg: central CPU
// package, white traces branching at 90/45-degree elbows, terminal vocabulary
// of solder dots, rings, pads, resistor packages; asymmetric, organic). The
// chat model timed out after candidate I, so the round ships NINE candidates
// A-I (owner: work with what was delivered). Brief:
// BRIEF-card-art-raft-rethink-7.md. Every variant keeps the Raft system read
// (crowned leader without text, committed vs future textures, one coral
// protagonist in flight, laggard deficiency, direction of flow) inside the
// family technique. Concepts: A processor soma with dendrites, B bus arbiter,
// C write-frontier column, D repeater chain, E clock tree, F token ring,
// G sensor bus into an edge-seated controller, H shift-register ripple,
// I transceiver broadcast. Integrated with mechanical fixes from numeric
// geometry review: leader crown rings that grazed or sliced their chip
// silhouettes re-fitted everywhere (A ring grown past the corners r27->r31,
// B chip shrunk to 28x28 so the r24 crown clears, C crown rebuilt as a coral
// pill outline around the wide writer bar, D chip shrunk to 26x26,
// H chip shrunk to 24x20, I crown r24->r25 past the corners); B crown ring
// pulled inside the safe area (breached x16 by 0.75px); F whole ring rebuilt
// on one r50 circle centred (130,84) (delivered node centres wandered r50-62
// so arcs rendered wobbly) with solder dots + chevrons + token re-seated ON
// the ring and the dashed laggard arc split to stop at the dead node from
// both sides; C laggard ring un-translated and seated on its trace end (the
// delivered transform floated it 9px off the path); D laggard leg re-anchored
// to the committed trace vertex (delivered started 8px below the amp) and
// protagonist capsule + chevron seated on their segments; G traces trimmed to
// terminate at the sample-register column (delivered overshot it by 2-16px),
// register cells re-aligned to the trace heights, controller chip shrunk so
// the r26 crown clears the corners, efferent command re-routed to exit the
// chip (delivered floated off the package), laggard sensor row aligned to its
// empty register cell; E trunk re-seated on the crystal plate edge, second
// branch fork moved to its own junction, laggard leg re-routed down the
// branch vertical (delivered overlapped the committed horizontal 14px),
// crown grown r22->r24 to clear the crystal plate tips; H clock ticks
// straddled onto the stage edges (delivered floated 2px below), stage-exit
// chevron seated on the elbow; I wavefront arcs re-centred on the transmitter
// (delivered centres drifted 6-9px left) and ack stubs re-seated on the coral
// wavefront. Ids namespaced gem-raft7-*.
import type { CSSProperties } from "react";

const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// A — "Ganglion": a processor soma sprouting dendrites to follower terminals.
export function RaftCyberA() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft7-a-dense" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
        <pattern id="gem-raft7-a-sparse" patternUnits="userSpaceOnUse" width="11" height="11"><circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" /></pattern>
        <pattern id="gem-raft7-a-halo" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
      </defs>

      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft7-a-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" cx="96" cy="80" rx="42" ry="36" fill="url(#gem-raft7-a-halo)" style={haloVar(0.12)} opacity={0.12} />

      {/* committed dendrites — 3 of 4 follower links seated */}
      <polyline points="114,72 140,72 152,60 190,60" fill="none" stroke="#465059" strokeWidth="3.5" />
      <polyline points="114,84 150,84 162,84 206,84" fill="none" stroke="#465059" strokeWidth="3.5" />
      <polyline points="112,92 132,92 144,110 178,110" fill="none" stroke="#465059" strokeWidth="3.5" />
      {/* laggard dendrite — severed, dashed dead-end */}
      <polyline points="110,98 126,124 150,132" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* committed log ticks along traces */}
      <line x1="150" y1="57" x2="150" y2="63" stroke="#7d7669" strokeWidth="2.5" />
      <line x1="160" y1="57" x2="160" y2="63" stroke="#7d7669" strokeWidth="2.5" />
      <line x1="176" y1="81" x2="176" y2="87" stroke="#7d7669" strokeWidth="2.5" />
      <line x1="186" y1="81" x2="186" y2="87" stroke="#7d7669" strokeWidth="2.5" />

      {/* follower terminals */}
      <circle cx="190" cy="60" r="5" fill="#b6ac95" />
      <rect x="204" y="78" width="14" height="12" fill="#26333b" stroke="#b6ac95" strokeWidth="2.5" />
      <line x1="218" y1="81" x2="224" y2="81" stroke="#b6ac95" strokeWidth="2.5" />
      <line x1="218" y1="87" x2="224" y2="87" stroke="#b6ac95" strokeWidth="2.5" />
      <circle cx="178" cy="110" r="5.5" fill="url(#gem-raft7-a-dense)" stroke="#7d2723" strokeWidth="2" />
      <circle cx="150" cy="132" r="4.5" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* leader chip package */}
      <rect x="78" y="62" width="36" height="36" fill="#26333b" stroke="#b6ac95" strokeWidth="2.5" />
      <rect x="83" y="67" width="26" height="26" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* coral: crown ring + core (r31 clears the chip corners) */}
      <circle cx="96" cy="80" r="31" fill="none" stroke="#ff6a5f" strokeWidth="3.5" />
      <circle cx="96" cy="80" r="7" fill="#ff6a5f" />

      {/* coral protagonist — commit pulse in flight on the middle dendrite */}
      <ellipse cx="162" cy="84" rx="6.5" ry="4.5" fill="#ff6a5f" />
      <line x1="150" y1="84" x2="158" y2="84" stroke="#7d2723" strokeWidth="3" />
    </svg>
  );
}

// B — "Bus Arbiter": an edge-seated arbiter chip driving a two-rail bus.
export function RaftCyberB() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft7-b-dense" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
        <pattern id="gem-raft7-b-sparse" patternUnits="userSpaceOnUse" width="11" height="11"><circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" /></pattern>
        <pattern id="gem-raft7-b-halo" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
      </defs>

      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft7-b-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" cx="124" cy="82" rx="48" ry="30" fill="url(#gem-raft7-b-halo)" style={haloVar(0.12)} opacity={0.12} />

      {/* data bus — two rails, left to right */}
      <line x1="58" y1="78" x2="208" y2="78" stroke="#465059" strokeWidth="5" />
      <line x1="58" y1="88" x2="208" y2="88" stroke="#465059" strokeWidth="3" />
      <polyline points="150,72 157,78 150,84" fill="none" stroke="#7d7669" strokeWidth="2.5" />
      <polyline points="168,72 175,78 168,84" fill="none" stroke="#7d7669" strokeWidth="2.5" />

      {/* follower IC drops — 2 committed */}
      <line x1="100" y1="88" x2="100" y2="104" stroke="#465059" strokeWidth="3" />
      <rect x="90" y="104" width="20" height="16" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      <line x1="88" y1="108" x2="84" y2="108" stroke="#b6ac95" strokeWidth="2.5" />
      <line x1="88" y1="116" x2="84" y2="116" stroke="#b6ac95" strokeWidth="2.5" />
      <line x1="140" y1="88" x2="140" y2="104" stroke="#465059" strokeWidth="3" />
      <rect x="130" y="104" width="20" height="16" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      {/* laggard IC — broken dashed drop, dead */}
      <line x1="180" y1="88" x2="180" y2="102" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />
      <rect x="170" y="104" width="20" height="16" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* commit register column at right — frontier dashed on the bottom */}
      <line x1="208" y1="83" x2="216" y2="83" stroke="#465059" strokeWidth="3" />
      <rect x="216" y="60" width="20" height="10" fill="url(#gem-raft7-b-dense)" stroke="#7d2723" strokeWidth="2" />
      <rect x="216" y="72" width="20" height="10" fill="#465059" stroke="#b6ac95" strokeWidth="2" />
      <rect x="216" y="84" width="20" height="10" fill="#465059" stroke="#b6ac95" strokeWidth="2" />
      <rect x="216" y="96" width="20" height="10" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* leader arbiter chip at left edge (28x28 so the r24 crown clears it) */}
      <rect x="28" y="65" width="28" height="28" fill="#26333b" stroke="#b6ac95" strokeWidth="2.5" />
      <rect x="32" y="69" width="20" height="20" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="56" y1="83" x2="62" y2="83" stroke="#b6ac95" strokeWidth="2.5" />
      <circle cx="42" cy="79" r="24" fill="none" stroke="#ff6a5f" strokeWidth="3.5" />
      <circle cx="42" cy="79" r="6.5" fill="#ff6a5f" />

      {/* coral protagonist — bus packet in flight */}
      <rect x="112" y="74" width="16" height="9" rx="4" fill="#ff6a5f" />
      <line x1="128" y1="78.5" x2="136" y2="78.5" stroke="#7d2723" strokeWidth="3" />
    </svg>
  );
}

// C — "Write Frontier Column": the leader chip writes down a shared log column.
export function RaftCyberC() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft7-c-dense" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
        <pattern id="gem-raft7-c-sparse" patternUnits="userSpaceOnUse" width="11" height="11"><circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" /></pattern>
        <pattern id="gem-raft7-c-halo" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
      </defs>

      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft7-c-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" cx="130" cy="86" rx="34" ry="52" fill="url(#gem-raft7-c-halo)" style={haloVar(0.12)} opacity={0.12} />

      {/* shared log column — write frontier advances downward */}
      <rect x="110" y="44" width="40" height="14" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      <rect x="110" y="60" width="40" height="14" fill="url(#gem-raft7-c-dense)" stroke="#7d2723" strokeWidth="2.5" />
      <rect x="110" y="76" width="40" height="14" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      {/* unwritten frontier cells — dashed empty */}
      <rect x="110" y="92" width="40" height="14" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />
      <rect x="110" y="108" width="40" height="14" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />
      <polyline points="126,98 130,104 134,98" fill="none" stroke="#7d7669" strokeWidth="2.5" />

      {/* leader writer chip on top, crowned by a coral pill outline */}
      <rect x="104" y="22" width="52" height="18" fill="#26333b" stroke="#b6ac95" strokeWidth="2.5" />
      <rect x="108" y="26" width="44" height="10" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />
      <rect x="98" y="16" width="64" height="30" rx="15" fill="none" stroke="#ff6a5f" strokeWidth="3.5" />
      <circle cx="130" cy="31" r="6" fill="#ff6a5f" />
      <line x1="130" y1="40" x2="130" y2="44" stroke="#b6ac95" strokeWidth="3" />

      {/* follower taps — 2 committed reads */}
      <line x1="150" y1="51" x2="180" y2="51" stroke="#465059" strokeWidth="3" />
      <circle cx="186" cy="51" r="5" fill="#b6ac95" />
      <line x1="150" y1="83" x2="180" y2="83" stroke="#465059" strokeWidth="3" />
      <rect x="182" y="78" width="12" height="10" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      {/* laggard tap — broken dashed, dead open ring (seated on the trace end) */}
      <polyline points="150,67 168,67 176,74" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />
      <circle cx="181" cy="78" r="4.5" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* left-side commit index ticks */}
      <line x1="100" y1="51" x2="106" y2="51" stroke="#7d7669" strokeWidth="2.5" />
      <line x1="100" y1="67" x2="106" y2="67" stroke="#7d7669" strokeWidth="2.5" />
      <line x1="100" y1="83" x2="106" y2="83" stroke="#7d7669" strokeWidth="2.5" />

      {/* coral protagonist — write-head bit descending into frontier */}
      <rect x="123" y="80" width="14" height="9" rx="2" fill="#ff6a5f" />
      <polyline points="124,89 130,96 136,89" fill="#7d2723" stroke="#7d2723" strokeWidth="2" />
    </svg>
  );
}

// D — "Repeater Chain": a relay line of amplifier stages carries the signal.
export function RaftCyberD() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft7-d-dense" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
        <pattern id="gem-raft7-d-sparse" patternUnits="userSpaceOnUse" width="11" height="11"><circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" /></pattern>
        <pattern id="gem-raft7-d-halo" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
      </defs>

      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft7-d-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" cx="110" cy="78" rx="52" ry="28" fill="url(#gem-raft7-d-halo)" style={haloVar(0.12)} opacity={0.12} />

      {/* leader driver chip (26x26 so the r22 crown clears the corners) */}
      <rect x="28" y="56" width="26" height="26" fill="#26333b" stroke="#b6ac95" strokeWidth="2.5" />
      <rect x="32" y="60" width="18" height="18" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="41" cy="69" r="22" fill="none" stroke="#ff6a5f" strokeWidth="3.5" />
      <circle cx="41" cy="69" r="6.5" fill="#ff6a5f" />

      {/* relay trace with elbows */}
      <polyline points="54,69 74,69 82,58 96,58" fill="none" stroke="#465059" strokeWidth="3.5" />
      {/* amp 1 (committed) */}
      <polygon points="96,49 96,67 114,58" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      <polyline points="114,58 130,58 138,72 152,72" fill="none" stroke="#465059" strokeWidth="3.5" />
      {/* amp 2 (committed) */}
      <polygon points="152,63 152,81 170,72" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      <polyline points="170,72 184,72 192,60 204,60" fill="none" stroke="#465059" strokeWidth="3.5" />
      {/* amp 3 (committed) */}
      <polygon points="204,51 204,69 222,60 204,51" fill="url(#gem-raft7-d-dense)" stroke="#7d2723" strokeWidth="2.5" />
      {/* laggard leg — broken dashed to dead amp (anchored on the trace vertex) */}
      <polyline points="184,72 190,88 194,100" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />
      <polygon points="192,96 192,114 210,105" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* committed log solder dots on trace */}
      <circle cx="82" cy="58" r="3" fill="#7d7669" />
      <circle cx="138" cy="72" r="3" fill="#7d7669" />
      <circle cx="192" cy="60" r="3" fill="#7d7669" />

      {/* coral protagonist — signal capsule hopping amp1 to amp2 */}
      <ellipse cx="122" cy="58" rx="7" ry="4.5" fill="#ff6a5f" />
      <polyline points="140,69 146,72 140,75" fill="none" stroke="#7d2723" strokeWidth="3" />
    </svg>
  );
}

// E — "Clock Tree": a crystal oscillator leader buffers a clock down a
// branching distribution tree to leaf flip-flops.
export function RaftCyberE() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft7-e-dense" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
        <pattern id="gem-raft7-e-sparse" patternUnits="userSpaceOnUse" width="11" height="11"><circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" /></pattern>
        <pattern id="gem-raft7-e-halo" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
      </defs>

      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft7-e-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" cx="52" cy="80" rx="34" ry="40" fill="url(#gem-raft7-e-halo)" style={haloVar(0.12)} opacity={0.12} />

      {/* crystal oscillator — leader source (r24 crown clears the plate tips) */}
      <line x1="40" y1="60" x2="40" y2="100" stroke="#b6ac95" strokeWidth="4" />
      <line x1="48" y1="60" x2="48" y2="100" stroke="#b6ac95" strokeWidth="4" />
      <line x1="44" y1="52" x2="44" y2="60" stroke="#465059" strokeWidth="3" />
      <line x1="44" y1="100" x2="44" y2="108" stroke="#465059" strokeWidth="3" />
      <circle cx="44" cy="80" r="24" fill="none" stroke="#ff6a5f" strokeWidth="3.5" />
      <circle cx="44" cy="80" r="6" fill="#ff6a5f" />

      {/* trunk to buffer (seated on the plate edge) */}
      <polyline points="50,80 76,80" fill="none" stroke="#465059" strokeWidth="4" />
      <polygon points="76,72 76,88 92,80" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />

      {/* upper branch — 2 clocked leaves */}
      <polyline points="92,80 104,80 104,50 132,50" fill="none" stroke="#465059" strokeWidth="3.5" />
      <polyline points="118,50 118,38 132,38" fill="none" stroke="#465059" strokeWidth="3.5" />
      <rect x="132" y="32" width="18" height="12" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      <rect x="132" y="44" width="18" height="12" fill="url(#gem-raft7-e-dense)" stroke="#7d2723" strokeWidth="2.5" />

      {/* lower branch — 1 clocked leaf */}
      <polyline points="92,80 104,80 104,108 140,108" fill="none" stroke="#465059" strokeWidth="3.5" />
      <rect x="140" y="102" width="18" height="12" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />

      {/* laggard leaf — clock not arriving, dashed dead-end (down the vertical) */}
      <polyline points="104,108 104,128 150,128" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />
      <rect x="150" y="122" width="18" height="12" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* skew ticks along branches */}
      <line x1="118" y1="47" x2="118" y2="53" stroke="#7d7669" strokeWidth="2.5" />
      <line x1="120" y1="105" x2="120" y2="111" stroke="#7d7669" strokeWidth="2.5" />

      {/* coral protagonist — clock edge propagating on the live branch */}
      <polyline points="150,50 158,44 158,50 166,44" fill="none" stroke="#ff6a5f" strokeWidth="3.5" />
      <circle cx="150" cy="50" r="4.5" fill="#ff6a5f" />
    </svg>
  );
}

// F — "Token Ring": a ring circulates a grant clockwise through IC nodes
// (whole ring rebuilt on one r50 circle centred (130,84)).
export function RaftCyberF() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft7-f-dense" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
        <pattern id="gem-raft7-f-sparse" patternUnits="userSpaceOnUse" width="11" height="11"><circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" /></pattern>
        <pattern id="gem-raft7-f-halo" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
      </defs>

      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft7-f-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" cx="130" cy="84" rx="46" ry="46" fill="url(#gem-raft7-f-halo)" style={haloVar(0.12)} opacity={0.12} />

      {/* committed ring arcs (solid) between 3 seated nodes */}
      <path d="M130 34 A50 50 0 0 1 179 93" fill="none" stroke="#465059" strokeWidth="3.5" />
      <path d="M179 93 A50 50 0 0 1 109 129" fill="none" stroke="#465059" strokeWidth="3.5" />
      <path d="M109 129 A50 50 0 0 1 82 71" fill="none" stroke="#465059" strokeWidth="3.5" />
      {/* broken ring arcs to the laggard node — dashed, stopping at it */}
      <path d="M82 71 A50 50 0 0 1 95 49" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="5 5" />
      <path d="M109 39 A50 50 0 0 1 130 34" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="5 5" />

      {/* direction chevrons (clockwise, seated on the ring) */}
      <polyline points="162,46 168,51 162,57" fill="none" stroke="#7d7669" strokeWidth="2.5" />
      <polyline points="85,118 93,119 92,111" fill="none" stroke="#7d7669" strokeWidth="2.5" />

      {/* follower IC nodes */}
      <rect x="171" y="85" width="16" height="16" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      <rect x="101" y="121" width="16" height="16" fill="url(#gem-raft7-f-dense)" stroke="#7d2723" strokeWidth="2.5" />
      <rect x="74" y="63" width="16" height="16" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      {/* laggard node — dashed, dead */}
      <rect x="93" y="35" width="16" height="16" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* leader node at top with crown + core */}
      <rect x="122" y="26" width="16" height="16" fill="#26333b" stroke="#b6ac95" strokeWidth="2.5" />
      <circle cx="130" cy="34" r="16" fill="none" stroke="#ff6a5f" strokeWidth="3.5" />
      <circle cx="130" cy="34" r="5.5" fill="#ff6a5f" />

      {/* solder-dot log entries seated on the arcs */}
      <circle cx="151" cy="39" r="3" fill="#7d7669" />
      <circle cx="155" cy="127" r="3" fill="#7d7669" />

      {/* coral protagonist — token circulating clockwise past the leader */}
      <circle cx="173" cy="59" r="6.5" fill="#ff6a5f" />
      <polyline points="173,65 178,70 172,73" fill="none" stroke="#7d2723" strokeWidth="3" />
    </svg>
  );
}

// G — "Sensor Bus → Controller": sensor pads report inward to an edge-seated
// controller that samples them into a register and issues a command back out.
export function RaftCyberG() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft7-g-dense" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
        <pattern id="gem-raft7-g-sparse" patternUnits="userSpaceOnUse" width="11" height="11"><circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" /></pattern>
        <pattern id="gem-raft7-g-halo" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
      </defs>

      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft7-g-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" cx="200" cy="80" rx="38" ry="40" fill="url(#gem-raft7-g-halo)" style={haloVar(0.12)} opacity={0.12} />

      {/* afferent sensor traces converging right — 3 reporting */}
      <polyline points="42,44 90,44 108,58 160,58" fill="none" stroke="#465059" strokeWidth="3.5" />
      <polyline points="42,80 100,80 160,80" fill="none" stroke="#465059" strokeWidth="3.5" />
      <polyline points="42,116 90,116 108,102 160,102" fill="none" stroke="#465059" strokeWidth="3.5" />
      {/* laggard sensor — broken dashed, no arrival */}
      <polyline points="42,124 78,124 96,124" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* sensor pads */}
      <circle cx="38" cy="44" r="5" fill="#b6ac95" />
      <rect x="30" y="75" width="12" height="10" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      <circle cx="38" cy="116" r="5" fill="#b6ac95" />
      <circle cx="38" cy="124" r="4.5" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* sampled-value register column, cells aligned to the trace heights */}
      <rect x="160" y="53" width="14" height="10" fill="url(#gem-raft7-g-dense)" stroke="#7d2723" strokeWidth="2" />
      <rect x="160" y="75" width="14" height="10" fill="#465059" stroke="#b6ac95" strokeWidth="2" />
      <rect x="160" y="97" width="14" height="10" fill="#465059" stroke="#b6ac95" strokeWidth="2" />
      <rect x="160" y="119" width="14" height="10" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* controller chip — leader on right edge (26x34 so the crown clears) */}
      <rect x="199" y="63" width="26" height="34" fill="#26333b" stroke="#b6ac95" strokeWidth="2.5" />
      <rect x="203" y="67" width="18" height="26" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="199" y1="80" x2="174" y2="80" stroke="#b6ac95" strokeWidth="2.5" />
      <circle cx="213" cy="80" r="26" fill="none" stroke="#ff6a5f" strokeWidth="3.5" />
      <circle cx="213" cy="80" r="7" fill="#ff6a5f" />

      {/* coral protagonist — efferent command exiting the chip */}
      <polyline points="212,97 212,116 158,116 148,124" fill="none" stroke="#7d2723" strokeWidth="3" />
      <ellipse cx="188" cy="116" rx="7" ry="4.5" fill="#ff6a5f" />
      <polyline points="150,120 144,124 150,128" fill="none" stroke="#ff6a5f" strokeWidth="3" />
    </svg>
  );
}

// H — "Shift-Register Ripple": a diagonal D-flop cascade shifts a bit
// down-right stage by stage.
export function RaftCyberH() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft7-h-dense" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
        <pattern id="gem-raft7-h-sparse" patternUnits="userSpaceOnUse" width="11" height="11"><circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" /></pattern>
        <pattern id="gem-raft7-h-halo" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
      </defs>

      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft7-h-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" cx="128" cy="84" rx="54" ry="40" fill="url(#gem-raft7-h-halo)" style={haloVar(0.12)} opacity={0.12} />

      {/* leader input flop — top-left (24x20 so the r20 crown clears) */}
      <rect x="33" y="42" width="24" height="20" fill="#26333b" stroke="#b6ac95" strokeWidth="2.5" />
      <line x1="33" y1="56" x2="39" y2="62" stroke="#7d7669" strokeWidth="2" />
      <circle cx="45" cy="52" r="20" fill="none" stroke="#ff6a5f" strokeWidth="3.5" />
      <circle cx="45" cy="52" r="6" fill="#ff6a5f" />

      {/* stage 2 (shifted, committed) */}
      <polyline points="57,58 74,58 74,66 84,66" fill="none" stroke="#465059" strokeWidth="3.5" />
      <rect x="84" y="56" width="30" height="24" fill="#465059" stroke="#b6ac95" strokeWidth="2.5" />
      <line x1="84" y1="76" x2="88" y2="80" stroke="#7d7669" strokeWidth="2" />

      {/* stage 3 (shifted, committed) */}
      <polyline points="114,72 128,72 128,80 138,80" fill="none" stroke="#465059" strokeWidth="3.5" />
      <rect x="138" y="70" width="30" height="24" fill="url(#gem-raft7-h-dense)" stroke="#7d2723" strokeWidth="2.5" />

      {/* stage 4 (empty, not yet shifted) — dashed */}
      <polyline points="168,86 182,86 182,94 192,94" fill="none" stroke="#465059" strokeWidth="3.5" />
      <rect x="192" y="84" width="30" height="24" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* laggard stage 5 — stalled clock, broken dashed dead-end */}
      <polyline points="150,94 150,116 176,116" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />
      <rect x="176" y="116" width="30" height="20" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />
      <polyline points="184,120 198,132" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />
      <polyline points="198,120 184,132" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* clock-tick log straddling the committed stage edges */}
      <line x1="99" y1="76" x2="99" y2="84" stroke="#7d7669" strokeWidth="2.5" />
      <line x1="153" y1="92" x2="153" y2="100" stroke="#7d7669" strokeWidth="2.5" />

      {/* coral protagonist — bit rippling between stage 3 and stage 4 */}
      <rect x="170" y="82" width="14" height="9" rx="2" fill="#ff6a5f" />
      <polyline points="185,90 190,94 185,98" fill="none" stroke="#7d2723" strokeWidth="3" />
    </svg>
  );
}

// I — "Transceiver Broadcast": a transmitter leader radiates heartbeat
// wavefronts to receiver pads (arcs re-centred on the transmitter).
export function RaftCyberI() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft7-i-dense" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
        <pattern id="gem-raft7-i-sparse" patternUnits="userSpaceOnUse" width="11" height="11"><circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" /></pattern>
        <pattern id="gem-raft7-i-halo" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" /></pattern>
      </defs>

      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft7-i-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" cx="104" cy="82" rx="44" ry="42" fill="url(#gem-raft7-i-halo)" style={haloVar(0.12)} opacity={0.12} />

      {/* emission wavefront arcs radiating rightward (neutral) */}
      <path d="M127 67 A30 30 0 0 1 127 97" fill="none" stroke="#465059" strokeWidth="3" />
      <path d="M141 59 A46 46 0 0 1 141 105" fill="none" stroke="#7d7669" strokeWidth="2.5" strokeDasharray="6 5" />

      {/* transmitter chip + antenna mast — leader (crown r25 clears corners) */}
      <rect x="86" y="68" width="30" height="28" fill="#26333b" stroke="#b6ac95" strokeWidth="2.5" />
      <line x1="101" y1="68" x2="101" y2="46" stroke="#b6ac95" strokeWidth="3" />
      <circle cx="101" cy="44" r="4" fill="#b6ac95" />
      <circle cx="101" cy="82" r="25" fill="none" stroke="#ff6a5f" strokeWidth="3.5" />
      <circle cx="101" cy="82" r="6.5" fill="#ff6a5f" />

      {/* receiver pads — 3 acknowledged */}
      <circle cx="176" cy="54" r="5.5" fill="#b6ac95" />
      <line x1="176" y1="43" x2="176" y2="47" stroke="#7d7669" strokeWidth="2.5" />
      <rect x="196" y="76" width="16" height="14" fill="url(#gem-raft7-i-dense)" stroke="#7d2723" strokeWidth="2.5" />
      <circle cx="176" cy="110" r="5.5" fill="#b6ac95" />
      <line x1="176" y1="117" x2="176" y2="121" stroke="#7d7669" strokeWidth="2.5" />
      {/* laggard receiver — out of range, dashed dead pad */}
      <circle cx="214" cy="122" r="6" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1="205" y1="131" x2="223" y2="113" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* ack link stubs, seated on the live wavefront */}
      <line x1="171" y1="54" x2="157" y2="62" stroke="#465059" strokeWidth="2.5" />
      <line x1="196" y1="83" x2="161" y2="83" stroke="#465059" strokeWidth="2.5" />

      {/* coral protagonist — live broadcast wavefront in flight */}
      <path d="M153 52 A60 60 0 0 1 153 112" fill="none" stroke="#ff6a5f" strokeWidth="3.5" />
      <circle cx="161" cy="82" r="4.5" fill="#ff6a5f" />
    </svg>
  );
}
