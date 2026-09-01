import type { CSSProperties } from "react";

// Raft cybernetic reconcept round — two candidates from the delegated brief
// (BRIEF-card-art-raft-cybernetic.md), integrated verbatim with mechanical
// fixes only: pattern/clip ids namespaced per candidate (gem-raft-a-*, gem-raft-b-*)
// so both can render on one page; width/height stripped (CSS sizes the mark).
// On adoption the winner's ids rename back to the family prefix gem-raft-*.
const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// Candidate A — "Broadcast mesh": ringed leader broadcasts the coral entry
// along solid channels; dashed ack hairlines return; three tiny aligned
// registers with a shared dashed commit frontier prove agreement.
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
        <clipPath id="gem-raft-a-leader"><circle cx="86" cy="80" r="14" /></clipPath>
        <clipPath id="gem-raft-a-fup"><circle cx="178" cy="46" r="10.5" /></clipPath>
        <clipPath id="gem-raft-a-flo"><circle cx="184" cy="114" r="10.5" /></clipPath>
      </defs>

      {/* backdrop + halo (only elements allowed past safe area) */}
      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft-a-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="110" cy="80" rx="60" ry="42" fill="url(#gem-raft-a-halo)" opacity="0.12" />

      {/* feed-forward channels */}
      <path d="M100 72 Q140 50 166 48" fill="none" stroke="#465059" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <path d="M100 88 Q142 106 172 111" fill="none" stroke="#465059" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

      {/* direction chevrons (away from leader) */}
      <g fill="none" stroke="#7d7669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-3 -3 L0 0 L-3 3" transform="translate(126 58) rotate(-18)" />
        <path d="M-3 -3 L0 0 L-3 3" transform="translate(150 49) rotate(-8)" />
        <path d="M-3 -3 L0 0 L-3 3" transform="translate(128 95) rotate(20)" />
        <path d="M-3 -3 L0 0 L-3 3" transform="translate(152 108) rotate(8)" />
      </g>

      {/* feedback / ack hairlines (followers -> leader) */}
      <path d="M172 40 Q136 36 102 64" fill="none" stroke="#7d7669" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 4" opacity="0.45" />
      <path d="M176 120 Q138 122 100 96" fill="none" stroke="#7d7669" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 4" opacity="0.45" />

      {/* upper follower */}
      <g clipPath="url(#gem-raft-a-fup)">
        <circle cx="178" cy="46" r="10.5" fill="#26333b" />
        <circle cx="178" cy="44" r="7.5" fill="#465059" />
        <circle cx="178" cy="42" r="4.5" fill="#7d7669" />
      </g>
      <circle cx="178" cy="46" r="12" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />

      {/* lower follower (laggard, de-saturated) */}
      <g clipPath="url(#gem-raft-a-flo)">
        <circle cx="184" cy="114" r="10.5" fill="#26333b" />
        <circle cx="184" cy="112" r="7.5" fill="#465059" />
      </g>
      <circle cx="184" cy="114" r="12" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />

      {/* leader */}
      <g clipPath="url(#gem-raft-a-leader)">
        <circle cx="86" cy="80" r="14" fill="#26333b" />
        <circle cx="86" cy="78" r="11" fill="#465059" />
        <circle cx="86" cy="76" r="7" fill="#7d7669" />
        <circle cx="86" cy="75" r="9" fill="url(#gem-raft-a-dense)" opacity="0.75" />
      </g>
      <circle cx="86" cy="80" r="19" fill="none" stroke="#7d2723" strokeWidth="3.5" opacity="0.9" />
      <g stroke="#ff6a5f" strokeWidth="1.5" strokeLinecap="round">
        <line x1="99.4" y1="66.6" x2="103" y2="63" />
        <line x1="103.86" y1="73.5" x2="108.6" y2="71.8" />
      </g>

      {/* committed-state registers (identical colour sequence) */}
      <g>
        {/* leader row */}
        <rect x="77" y="100" width="5" height="5" fill="#465059" />
        <rect x="84" y="100" width="5" height="5" fill="#7d7669" />
        <rect x="91" y="100" width="5" height="5" fill="#b6ac95" />
        <line x1="90" y1="96" x2="90" y2="110" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
        {/* upper follower row */}
        <rect x="169" y="60" width="5" height="5" fill="#465059" />
        <rect x="176" y="60" width="5" height="5" fill="#7d7669" />
        <rect x="183" y="60" width="5" height="5" fill="#b6ac95" />
        <line x1="182" y1="56" x2="182" y2="70" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
        {/* lagging follower row (tick 3 = dashed empty slot) */}
        <rect x="175" y="128" width="5" height="5" fill="#465059" />
        <rect x="182" y="128" width="5" height="5" fill="#7d7669" />
        <rect x="189" y="128" width="5" height="5" fill="none" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="188" y1="124" x2="188" y2="138" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
      </g>

      {/* in-flight signal (protagonist) + secondary broadcast reach */}
      <circle cx="146" cy="100" r="5" fill="url(#gem-raft-a-dense)" opacity="0.7" />
      <rect x="131" y="55" width="14" height="8" rx="4" fill="#ff6a5f" transform="rotate(-14 138 59)" />

      {/* white glints (2 total) */}
      <circle cx="82" cy="75" r="1.5" fill="#f4efe4" />
      <rect x="137" y="57" width="2" height="2" fill="#f4efe4" transform="rotate(-14 138 59)" />
    </svg>
  );
}

// Candidate B — "Control loop": the cluster as one cybernetic feedback ring;
// signals circulate clockwise past a crowned leader; the guarded three-bar
// register at dead centre is the setpoint the loop regulates toward.
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
        <clipPath id="gem-raft-b-leader"><circle cx="130" cy="38" r="12" /></clipPath>
        <clipPath id="gem-raft-b-fdr"><circle cx="174" cy="106" r="10.5" /></clipPath>
        <clipPath id="gem-raft-b-fll"><circle cx="86" cy="106" r="10.5" /></clipPath>
      </defs>

      {/* backdrop + halo (only elements allowed past safe area) */}
      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft-b-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="130" cy="82" rx="60" ry="42" fill="url(#gem-raft-b-halo)" opacity="0.12" />

      {/* the feedback loop */}
      <circle cx="130" cy="82" r="50" fill="none" stroke="#465059" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 6" opacity="0.65" />

      {/* feedback accent (election answer travelling back, ~10 o'clock) */}
      <path d="M83 64.9 A50 50 0 0 1 91.7 49.85" fill="none" stroke="#b6ac95" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M-3 -3 L0 0 L-3 3" fill="none" stroke="#b6ac95" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="translate(86 55) rotate(-100)" />

      {/* lagging node's missed-signal gap just before lower-left node */}
      <path d="M92.85 115.45 A50 50 0 0 1 86.7 107" fill="none" stroke="#7d7669" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" opacity="0.6" />

      {/* clockwise direction chevrons at 11, 5, 7 o'clock */}
      <g fill="none" stroke="#7d7669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
        <path d="M-3 -3 L0 0 L-3 3" transform="translate(105 38.7) rotate(330)" />
        <path d="M-3 -3 L0 0 L-3 3" transform="translate(155 125.3) rotate(150)" />
        <path d="M-3 -3 L0 0 L-3 3" transform="translate(105 125.3) rotate(210)" />
      </g>

      {/* lower-right follower */}
      <g clipPath="url(#gem-raft-b-fdr)">
        <circle cx="174" cy="106" r="10.5" fill="#26333b" />
        <circle cx="174" cy="104" r="7.5" fill="#465059" />
        <circle cx="174" cy="102" r="4.5" fill="#7d7669" />
      </g>
      <circle cx="174" cy="106" r="12" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />

      {/* lower-left follower (laggard, de-saturated) */}
      <g clipPath="url(#gem-raft-b-fll)">
        <circle cx="86" cy="106" r="10.5" fill="#26333b" />
        <circle cx="86" cy="104" r="7.5" fill="#465059" />
      </g>
      <circle cx="86" cy="106" r="12" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />

      {/* leader (top) */}
      <g clipPath="url(#gem-raft-b-leader)">
        <circle cx="130" cy="38" r="12" fill="#26333b" />
        <circle cx="130" cy="36" r="9" fill="#465059" />
        <circle cx="130" cy="34" r="5.5" fill="#7d7669" />
        <circle cx="130" cy="34" r="8" fill="url(#gem-raft-b-dense)" opacity="0.75" />
      </g>
      <circle cx="130" cy="38" r="16.5" fill="none" stroke="#7d2723" strokeWidth="3.5" opacity="0.9" />
      <g stroke="#ff6a5f" strokeWidth="1.5" strokeLinecap="round">
        <line x1="134.3" y1="22.06" x2="135.57" y2="17.23" />
        <line x1="125.73" y1="22.06" x2="124.43" y2="17.23" />
      </g>

      {/* committed shared state at loop centre (settled memory) */}
      <circle cx="130" cy="82" r="13" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
      <rect x="122" y="74.5" width="16" height="3.5" fill="#465059" />
      <rect x="122" y="80.5" width="16" height="3.5" fill="#7d7669" />
      <rect x="122" y="86.5" width="16" height="3.5" fill="#b6ac95" />

      {/* signals in flight */}
      <circle cx="92" cy="108" r="6" fill="url(#gem-raft-b-dense)" opacity="0.8" />
      <rect x="156.5" y="47.5" width="13" height="7" rx="3.5" fill="#ff6a5f" transform="rotate(55 163 51)" />

      {/* white glints (3 max) */}
      <circle cx="126" cy="34" r="1.5" fill="#f4efe4" />
      <rect x="123" y="75" width="1.5" height="1.5" fill="#f4efe4" />
      <rect x="161.5" y="49" width="1.5" height="1.5" fill="#f4efe4" transform="rotate(55 163 51)" />
    </svg>
  );
}
