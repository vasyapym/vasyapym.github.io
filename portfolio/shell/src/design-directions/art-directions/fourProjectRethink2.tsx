import type { ReactElement } from "react";

/* Card-art rethink round — second relay batch (R003): 12 more raw marks from
   the chat model, integrated verbatim. Function letters renamed A/B/C → D/E/F
   (batch 1 owns A–C), pattern/clip id prefixes re-prefixed to match the new
   function names — mechanical rename, ids stay unique page-wide. No other
   repair: no background rect (batch 2 already draws on the card ground). */

/* ── Raft · coral #ff6a5f ── */

/* RaftD — crowned broadcast: leader election / heartbeat, crowned hub
   broadcasting to four followers. */
export function RaftD() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="RaftD-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#ff6a5f" />
        </pattern>
        <pattern id="RaftD-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#RaftD-d1)" opacity="0.3" />
      <ellipse cx="130" cy="84" rx="60" ry="38" fill="url(#RaftD-d2)" opacity="0.3" />

      <g stroke="#ff6a5f" strokeWidth="3">
        <line x1="130" y1="80" x2="62" y2="52" />
        <line x1="130" y1="80" x2="198" y2="52" />
        <line x1="130" y1="80" x2="78" y2="124" />
        <line x1="130" y1="80" x2="182" y2="124" />
      </g>
      <circle cx="130" cy="80" r="27" fill="none" stroke="#ff6a5f" strokeWidth="2" opacity="0.5" />

      <g fill="#ffc2bc">
        <circle cx="92.6" cy="64.6" r="4" />
        <circle cx="167.4" cy="64.6" r="4" />
        <circle cx="101.4" cy="104.2" r="4" />
        <circle cx="158.6" cy="104.2" r="4" />
      </g>

      <g fill="#8a2f2a" stroke="#ff6a5f" strokeWidth="4">
        <circle cx="62" cy="52" r="11" />
        <circle cx="198" cy="52" r="11" />
        <circle cx="78" cy="124" r="11" />
        <circle cx="182" cy="124" r="11" />
      </g>

      <circle cx="130" cy="80" r="18" fill="#ff6a5f" />
      <path d="M120 86 L120 75 L125 80 L130 72 L135 80 L140 75 L140 86 Z" fill="#ffc2bc" />

      <rect x="118" y="64" width="3" height="3" fill="#fff" />
      <rect x="200" y="46" width="2" height="2" fill="#fff" />
    </svg>
  );
}

/* RaftE — log replication: three node logs aligned (no diagonal cascade),
   commit-index bar cutting through all rows. */
export function RaftE() {
  const cols = [76, 98, 120, 142, 164];
  const rows = [48, 80, 112];
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="RaftE-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#ff6a5f" />
        </pattern>
        <pattern id="RaftE-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="80" rx="108" ry="62" fill="url(#RaftE-d1)" opacity="0.28" />
      <ellipse cx="130" cy="80" rx="64" ry="36" fill="url(#RaftE-d2)" opacity="0.3" />

      <line x1="52" y1="48" x2="52" y2="112" stroke="#ff6a5f" strokeWidth="3" />

      {rows.map((y, i) => (
        <g key={y}>
          {cols.map((x) => (
            <rect key={x} x={x} y={y - 8} width="16" height="16" rx="2" fill="#ff6a5f" />
          ))}
          {i === 0 ? (
            <rect x="186" y={y - 8} width="16" height="16" rx="2" fill="#ffc2bc" />
          ) : (
            <rect
              x="187.5" y={y - 6.5} width="13" height="13" rx="2"
              fill="none" stroke="#ff6a5f" strokeWidth="3" strokeDasharray="4 3"
            />
          )}
        </g>
      ))}

      <circle cx="52" cy="48" r="12" fill="#ff6a5f" />
      <circle cx="52" cy="80" r="10" fill="#8a2f2a" stroke="#ff6a5f" strokeWidth="4" />
      <circle cx="52" cy="112" r="10" fill="#8a2f2a" stroke="#ff6a5f" strokeWidth="4" />

      <rect x="182" y="32" width="3" height="98" fill="#ffc2bc" />
      <path d="M177 24 L190 24 L183.5 32 Z" fill="#ffc2bc" />

      <rect x="46" y="42" width="3" height="3" fill="#fff" />
      <rect x="189" y="43" width="2" height="2" fill="#fff" />
    </svg>
  );
}

/* RaftF — majority partition: fault line separates the majority side (keeps
   the leader) from the dashed minority side. */
export function RaftF() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="RaftF-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#ff6a5f" />
        </pattern>
        <pattern id="RaftF-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx="124" cy="82" rx="106" ry="64" fill="url(#RaftF-d1)" opacity="0.28" />
      <ellipse cx="96" cy="82" rx="58" ry="40" fill="url(#RaftF-d2)" opacity="0.32" />

      <g stroke="#ff6a5f" strokeWidth="3">
        <line x1="80" y1="80" x2="48" y2="40" />
        <line x1="80" y1="80" x2="50" y2="122" />
        <line x1="80" y1="80" x2="138" y2="65.3" />
        <line x1="80" y1="80" x2="138" y2="95.9" />
      </g>
      <g stroke="#8a2f2a" strokeWidth="3" strokeDasharray="5 5">
        <line x1="162" y1="59.2" x2="198" y2="50" />
        <line x1="162" y1="102.5" x2="204" y2="114" />
        <line x1="198" y1="50" x2="204" y2="114" />
      </g>

      <path
        d="M150 16 L140 44 L158 66 L142 92 L160 116 L146 144"
        fill="none" stroke="#ffc2bc" strokeWidth="4" strokeLinejoin="miter"
      />

      <g fill="#8a2f2a" stroke="#ff6a5f" strokeWidth="4">
        <circle cx="48" cy="40" r="11" />
        <circle cx="50" cy="122" r="11" />
      </g>
      <g fill="#5a2320" stroke="#ff6a5f" strokeWidth="2" strokeDasharray="4 3">
        <circle cx="198" cy="50" r="11" />
        <circle cx="204" cy="114" r="11" />
      </g>

      <circle cx="80" cy="80" r="17" fill="#ff6a5f" />
      <path d="M71 85 L71 75 L75.5 79.5 L80 72 L84.5 79.5 L89 75 L89 85 Z" fill="#ffc2bc" />

      <rect x="69" y="65" width="3" height="3" fill="#fff" />
    </svg>
  );
}

/* ── Forest · teal #4fd1a5 ── */

/* ForestD — lone pine walk: lantern walker on a winding path past a single
   pixel pine, fireflies out. */
export function ForestD() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" shapeRendering="crispEdges">
      <defs>
        <pattern id="ForestD-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#4fd1a5" />
        </pattern>
        <pattern id="ForestD-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#4fd1a5" />
        </pattern>
      </defs>
      <ellipse cx="136" cy="88" rx="104" ry="62" fill="url(#ForestD-d1)" opacity="0.26" />
      <ellipse cx="160" cy="104" rx="50" ry="30" fill="url(#ForestD-d2)" opacity="0.3" />

      {/* lone pine */}
      <g fill="#4fd1a5">
        <rect x="66" y="28" width="8" height="8" />
        <rect x="58" y="36" width="24" height="8" />
        <rect x="50" y="44" width="40" height="8" />
        <rect x="54" y="56" width="32" height="8" />
        <rect x="46" y="64" width="48" height="8" />
        <rect x="38" y="72" width="64" height="8" />
        <rect x="46" y="84" width="48" height="8" />
        <rect x="38" y="92" width="64" height="8" />
        <rect x="30" y="100" width="80" height="8" />
      </g>
      <g fill="#1f5e4c">
        <rect x="50" y="48" width="12" height="4" />
        <rect x="42" y="76" width="16" height="4" />
        <rect x="34" y="104" width="20" height="4" />
      </g>
      <rect x="64" y="108" width="12" height="22" fill="#1f5e4c" />

      {/* small far pine */}
      <g fill="#1f5e4c">
        <rect x="206" y="68" width="8" height="8" />
        <rect x="200" y="76" width="20" height="8" />
        <rect x="194" y="84" width="32" height="8" />
        <rect x="206" y="92" width="8" height="10" />
      </g>

      {/* path */}
      <g fill="#1f5e4c">
        <rect x="20" y="128" width="96" height="4" />
        <rect x="108" y="128" width="64" height="6" />
        <rect x="126" y="134" width="72" height="6" />
        <rect x="152" y="140" width="84" height="6" />
      </g>

      {/* walker */}
      <rect x="150" y="94" width="8" height="8" fill="#b8f2de" />
      <rect x="148" y="90" width="12" height="4" fill="#4fd1a5" />
      <rect x="148" y="102" width="12" height="16" fill="#4fd1a5" />
      <rect x="146" y="118" width="4" height="10" fill="#4fd1a5" />
      <rect x="158" y="118" width="4" height="10" fill="#4fd1a5" />
      <rect x="160" y="106" width="6" height="4" fill="#4fd1a5" />
      <rect x="165" y="110" width="8" height="10" fill="#b8f2de" />
      <rect x="167" y="108" width="4" height="2" fill="#4fd1a5" />

      <rect x="167" y="113" width="3" height="3" fill="#fff" />
      <rect x="190" y="58" width="3" height="3" fill="#fff" />
      <rect x="110" y="64" width="3" height="3" fill="#fff" />
    </svg>
  );
}

/* ForestE — creek log-bridge: walker balancing across a fallen log over a
   dusk creek. */
export function ForestE() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" shapeRendering="crispEdges">
      <defs>
        <pattern id="ForestE-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#4fd1a5" />
        </pattern>
        <pattern id="ForestE-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#4fd1a5" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="86" rx="106" ry="60" fill="url(#ForestE-d1)" opacity="0.26" />
      <ellipse cx="128" cy="84" rx="54" ry="32" fill="url(#ForestE-d2)" opacity="0.3" />

      {/* creek + banks */}
      <rect x="24" y="110" width="212" height="24" fill="#173f35" />
      <rect x="20" y="104" width="68" height="8" fill="#1f5e4c" />
      <rect x="176" y="104" width="64" height="8" fill="#1f5e4c" />
      <g fill="#4fd1a5" opacity="0.55">
        <rect x="36" y="118" width="16" height="3" />
        <rect x="96" y="126" width="22" height="3" />
        <rect x="150" y="116" width="14" height="3" />
        <rect x="196" y="126" width="18" height="3" />
      </g>
      {/* walker reflection */}
      <g fill="#1f5e4c">
        <rect x="122" y="112" width="12" height="10" />
        <rect x="124" y="122" width="8" height="6" />
      </g>

      {/* reeds */}
      <g fill="#4fd1a5">
        <rect x="30" y="86" width="3" height="18" />
        <rect x="36" y="80" width="3" height="24" />
        <rect x="42" y="90" width="3" height="14" />
        <rect x="35" y="76" width="5" height="6" fill="#b8f2de" />
      </g>

      {/* log */}
      <rect x="70" y="100" width="118" height="10" fill="#4fd1a5" />
      <g fill="#1f5e4c">
        <rect x="84" y="103" width="14" height="2" />
        <rect x="112" y="106" width="18" height="2" />
        <rect x="146" y="103" width="12" height="2" />
      </g>
      <rect x="184" y="100" width="8" height="10" fill="#b8f2de" />
      <rect x="186" y="103" width="4" height="4" fill="#4fd1a5" />

      {/* walker, arms out */}
      <rect x="124" y="68" width="8" height="8" fill="#b8f2de" />
      <rect x="122" y="76" width="12" height="16" fill="#4fd1a5" />
      <rect x="108" y="78" width="14" height="4" fill="#4fd1a5" />
      <rect x="134" y="74" width="14" height="4" fill="#4fd1a5" />
      <rect x="120" y="92" width="4" height="8" fill="#4fd1a5" />
      <rect x="132" y="92" width="4" height="8" fill="#4fd1a5" />

      <rect x="58" y="122" width="3" height="3" fill="#fff" />
      <rect x="170" y="128" width="3" height="3" fill="#fff" />
      <rect x="200" y="60" width="3" height="3" fill="#fff" />
    </svg>
  );
}

/* ForestF — fox on the trail: a pixel fox trotting between a fern and a
   mushroom cluster. */
export function ForestF() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" shapeRendering="crispEdges">
      <defs>
        <pattern id="ForestF-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#4fd1a5" />
        </pattern>
        <pattern id="ForestF-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#4fd1a5" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="92" rx="106" ry="58" fill="url(#ForestF-d1)" opacity="0.26" />
      <ellipse cx="118" cy="98" rx="56" ry="30" fill="url(#ForestF-d2)" opacity="0.3" />

      {/* ground */}
      <rect x="32" y="124" width="200" height="4" fill="#1f5e4c" />
      <g fill="#1f5e4c">
        <rect x="60" y="132" width="10" height="3" />
        <rect x="96" y="134" width="14" height="3" />
        <rect x="150" y="132" width="8" height="3" />
      </g>

      {/* fern */}
      <g fill="#1f5e4c">
        <rect x="44" y="100" width="4" height="24" />
        <rect x="34" y="104" width="10" height="4" />
        <rect x="48" y="98" width="10" height="4" />
        <rect x="36" y="112" width="8" height="4" />
        <rect x="48" y="108" width="10" height="4" />
      </g>

      {/* fox */}
      <rect x="64" y="88" width="10" height="10" fill="#b8f2de" />
      <rect x="72" y="92" width="28" height="10" fill="#4fd1a5" />
      <rect x="100" y="96" width="40" height="16" fill="#4fd1a5" />
      <rect x="140" y="88" width="16" height="16" fill="#4fd1a5" />
      <rect x="144" y="80" width="4" height="8" fill="#4fd1a5" />
      <rect x="152" y="80" width="4" height="8" fill="#4fd1a5" />
      <rect x="156" y="96" width="8" height="6" fill="#4fd1a5" />
      <rect x="162" y="96" width="3" height="3" fill="#1f5e4c" />
      <rect x="140" y="104" width="10" height="8" fill="#b8f2de" />
      <g fill="#1f5e4c">
        <rect x="104" y="112" width="5" height="12" />
        <rect x="116" y="112" width="5" height="8" />
        <rect x="128" y="112" width="5" height="12" />
        <rect x="138" y="112" width="5" height="8" />
      </g>

      {/* mushrooms */}
      <rect x="190" y="112" width="6" height="12" fill="#b8f2de" />
      <rect x="182" y="102" width="22" height="10" fill="#4fd1a5" />
      <rect x="186" y="98" width="14" height="4" fill="#4fd1a5" />
      <rect x="188" y="104" width="3" height="3" fill="#b8f2de" />
      <rect x="196" y="100" width="3" height="3" fill="#b8f2de" />
      <rect x="210" y="116" width="4" height="8" fill="#b8f2de" />
      <rect x="206" y="110" width="12" height="6" fill="#1f5e4c" />

      {/* falling leaves */}
      <rect x="176" y="62" width="4" height="4" fill="#4fd1a5" />
      <rect x="92" y="54" width="4" height="4" fill="#1f5e4c" />

      <rect x="149" y="92" width="3" height="3" fill="#fff" />
      <rect x="214" y="84" width="3" height="3" fill="#fff" />
    </svg>
  );
}

/* ── Blast · ember #ffb347 ── */

/* BlastD — sprite strip: spark → fireball → dispersing ring, three ordered
   frames. */
export function BlastD() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="BlastD-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#ffb347" />
        </pattern>
        <pattern id="BlastD-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#ffb347" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="80" rx="112" ry="58" fill="url(#BlastD-d1)" opacity="0.26" />
      <ellipse cx="130" cy="80" rx="46" ry="34" fill="url(#BlastD-d2)" opacity="0.32" />

      <g fill="none" stroke="#c2561f" strokeWidth="3">
        <rect x="24" y="48" width="64" height="64" rx="6" />
        <rect x="98" y="48" width="64" height="64" rx="6" />
        <rect x="172" y="48" width="64" height="64" rx="6" />
      </g>
      <g fill="#ffb347">
        <path d="M89 76 L96 80 L89 84 Z" />
        <path d="M163 76 L170 80 L163 84 Z" />
      </g>

      {/* frame 1: spark */}
      <g fill="#ffb347">
        <rect x="54" y="62" width="4" height="9" />
        <rect x="54" y="89" width="4" height="9" />
        <rect x="38" y="78" width="9" height="4" />
        <rect x="65" y="78" width="9" height="4" />
      </g>
      <circle cx="56" cy="80" r="6" fill="#ffe2b0" />

      {/* frame 2: fireball */}
      <circle cx="130" cy="84" r="20" fill="#c2561f" />
      <circle cx="119" cy="76" r="12" fill="#ff7a2f" />
      <circle cx="141" cy="74" r="13" fill="#ff7a2f" />
      <circle cx="130" cy="88" r="13" fill="#ff7a2f" />
      <circle cx="130" cy="80" r="10" fill="#ffb347" />
      <circle cx="130" cy="80" r="5" fill="#ffe2b0" />

      {/* frame 3: ring + smoke */}
      <circle cx="204" cy="80" r="21" fill="none" stroke="#ffb347" strokeWidth="5" strokeDasharray="10 7" />
      <circle cx="197" cy="75" r="5" fill="#c2561f" />
      <circle cx="212" cy="87" r="4" fill="#c2561f" />
      <circle cx="209" cy="72" r="3" fill="#ff7a2f" />

      <rect x="126" y="75" width="3" height="3" fill="#fff" />
      <rect x="52" y="76" width="2" height="2" fill="#fff" />
    </svg>
  );
}

/* BlastE — puffball peak: stacked fireball at its peak with tumbling debris
   chunks. */
export function BlastE() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="BlastE-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#ffb347" />
        </pattern>
        <pattern id="BlastE-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#ffb347" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="80" rx="108" ry="66" fill="url(#BlastE-d1)" opacity="0.26" />
      <ellipse cx="130" cy="78" rx="70" ry="48" fill="url(#BlastE-d2)" opacity="0.3" />

      <g fill="#c2561f">
        <circle cx="130" cy="88" r="38" />
        <circle cx="96" cy="92" r="24" />
        <circle cx="164" cy="92" r="24" />
        <circle cx="112" cy="62" r="24" />
        <circle cx="150" cy="60" r="25" />
        <circle cx="130" cy="46" r="20" />
      </g>
      <g fill="#ff7a2f">
        <circle cx="130" cy="86" r="29" />
        <circle cx="104" cy="90" r="17" />
        <circle cx="156" cy="88" r="17" />
        <circle cx="116" cy="66" r="18" />
        <circle cx="146" cy="64" r="19" />
      </g>
      <g fill="#ffb347">
        <circle cx="130" cy="80" r="19" />
        <circle cx="118" cy="72" r="12" />
        <circle cx="142" cy="71" r="13" />
      </g>
      <circle cx="130" cy="78" r="9" fill="#ffe2b0" />

      <g fill="#ffb347">
        <rect x="52" y="44" width="9" height="9" transform="rotate(25 56.5 48.5)" />
        <rect x="204" y="118" width="8" height="8" transform="rotate(-20 208 122)" />
      </g>
      <g fill="#c2561f">
        <rect x="204" y="38" width="7" height="7" transform="rotate(40 207.5 41.5)" />
        <rect x="46" y="118" width="6" height="6" transform="rotate(15 49 121)" />
      </g>

      <rect x="124" y="72" width="3" height="3" fill="#fff" />
      <rect x="146" y="64" width="2" height="2" fill="#fff" />
    </svg>
  );
}

/* BlastF — ground dome: side-view blast dome with debris lobbing out on
   dotted arcs. */
export function BlastF() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="BlastF-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#ffb347" />
        </pattern>
        <pattern id="BlastF-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#ffb347" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="96" rx="108" ry="58" fill="url(#BlastF-d1)" opacity="0.26" />
      <ellipse cx="130" cy="104" rx="66" ry="36" fill="url(#BlastF-d2)" opacity="0.32" />

      <g fill="none" stroke="#ffb347" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 7">
        <path d="M152 96 Q192 30 222 112" />
        <path d="M108 96 Q68 24 40 112" />
      </g>
      <rect x="217" y="112" width="9" height="9" fill="#ffb347" transform="rotate(20 221.5 116.5)" />
      <rect x="35" y="112" width="8" height="8" fill="#c2561f" transform="rotate(-25 39 116)" />

      <path d="M74 128 A56 52 0 0 1 186 128 Z" fill="#c2561f" />
      <path d="M88 128 A42 40 0 0 1 172 128 Z" fill="#ff7a2f" />
      <path d="M104 128 A26 26 0 0 1 156 128 Z" fill="#ffb347" />
      <path d="M118 128 A12 13 0 0 1 142 128 Z" fill="#ffe2b0" />

      <g fill="#c2561f">
        <circle cx="68" cy="124" r="8" />
        <circle cx="192" cy="124" r="8" />
        <circle cx="56" cy="126" r="5" />
        <circle cx="204" cy="126" r="5" />
      </g>
      <rect x="24" y="128" width="212" height="5" fill="#c2561f" />

      <rect x="124" y="118" width="3" height="3" fill="#fff" />
      <rect x="160" y="96" width="2" height="2" fill="#fff" />
    </svg>
  );
}

/* ── Planck · violet #a98cff ── */

/* PlanckD — CMB sky map: all-sky afterglow with the scrubber paused under
   it. */
export function PlanckD() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="PlanckD-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#a98cff" />
        </pattern>
        <pattern id="PlanckD-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#a98cff" />
        </pattern>
        <clipPath id="PlanckD-sky">
          <ellipse cx="130" cy="70" rx="86" ry="44" />
        </clipPath>
      </defs>
      <ellipse cx="130" cy="78" rx="112" ry="66" fill="url(#PlanckD-d1)" opacity="0.26" />
      <ellipse cx="130" cy="72" rx="100" ry="54" fill="url(#PlanckD-d2)" opacity="0.28" />

      <ellipse cx="130" cy="70" rx="86" ry="44" fill="#7a5fe0" />
      <g clipPath="url(#PlanckD-sky)">
        <g fill="#4b3a8f">
          <ellipse cx="118" cy="56" rx="18" ry="10" transform="rotate(-15 118 56)" />
          <ellipse cx="172" cy="78" rx="15" ry="9" transform="rotate(20 172 78)" />
          <ellipse cx="70" cy="84" rx="17" ry="8" />
          <ellipse cx="206" cy="66" rx="10" ry="14" />
          <ellipse cx="146" cy="36" rx="16" ry="7" />
          <ellipse cx="96" cy="104" rx="14" ry="6" />
        </g>
        <g fill="#ddd2ff">
          <ellipse cx="88" cy="60" rx="15" ry="8" transform="rotate(12 88 60)" />
          <ellipse cx="148" cy="92" rx="19" ry="7" />
          <ellipse cx="186" cy="54" rx="11" ry="7" transform="rotate(-25 186 54)" />
          <ellipse cx="124" cy="80" rx="8" ry="5" />
          <ellipse cx="58" cy="66" rx="6" ry="9" />
        </g>
      </g>

      <rect x="159" y="20" width="3" height="104" fill="#ddd2ff" />
      <rect x="40" y="136" width="180" height="4" rx="2" fill="#4b3a8f" />
      <rect x="40" y="136" width="120" height="4" rx="2" fill="#a98cff" />
      <circle cx="160.5" cy="138" r="7" fill="#ddd2ff" />

      <rect x="156" y="134" width="3" height="3" fill="#fff" />
      <rect x="84" y="56" width="2" height="2" fill="#fff" />
    </svg>
  );
}

/* PlanckE — galaxy era: tilted spiral over a timeline track, scrubbed
   forward. */
export function PlanckE() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="PlanckE-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#a98cff" />
        </pattern>
        <pattern id="PlanckE-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#a98cff" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="74" rx="104" ry="62" fill="url(#PlanckE-d1)" opacity="0.26" />
      <ellipse cx="130" cy="68" rx="64" ry="34" fill="url(#PlanckE-d2)" opacity="0.32" />

      <g transform="translate(130 66) scale(1.15 0.62) rotate(18)">
        <circle r="30" fill="#4b3a8f" />
        <g fill="none" stroke="#a98cff" strokeWidth="8" strokeLinecap="round">
          <path d="M0 0 C22 -22 52 -8 48 16 C44 38 8 48 -28 38" />
          <path d="M0 0 C22 -22 52 -8 48 16 C44 38 8 48 -28 38" transform="rotate(180)" />
        </g>
        <circle r="11" fill="#ddd2ff" />
      </g>

      <g fill="#ddd2ff">
        <rect x="58" y="36" width="3" height="3" />
        <rect x="196" y="30" width="3" height="3" />
        <rect x="206" y="92" width="2" height="2" />
        <rect x="52" y="98" width="2" height="2" />
      </g>

      <rect x="36" y="134" width="188" height="4" rx="2" fill="#4b3a8f" />
      <rect x="36" y="134" width="140" height="4" rx="2" fill="#a98cff" />
      <g fill="#4b3a8f">
        <rect x="60" y="126" width="2" height="5" />
        <rect x="100" y="126" width="2" height="5" />
        <rect x="140" y="126" width="2" height="5" />
        <rect x="180" y="126" width="2" height="5" />
      </g>
      <circle cx="176" cy="136" r="8" fill="#ddd2ff" stroke="#4b3a8f" strokeWidth="3" />

      <rect x="125" y="62" width="3" height="3" fill="#fff" />
      <rect x="173" y="133" width="2" height="2" fill="#fff" />
    </svg>
  );
}

/* PlanckF — recombination: electron captured, a freed photon escapes; the
   playhead parts plasma fog from clear space. */
export function PlanckF() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="PlanckF-d1" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1" fill="#a98cff" />
        </pattern>
        <pattern id="PlanckF-d2" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2" fill="#a98cff" />
        </pattern>
      </defs>
      <ellipse cx="136" cy="80" rx="106" ry="62" fill="url(#PlanckF-d1)" opacity="0.26" />
      <ellipse cx="118" cy="80" rx="56" ry="34" fill="url(#PlanckF-d2)" opacity="0.32" />

      {/* plasma fog behind playhead */}
      <g fill="#4b3a8f">
        <rect x="26" y="40" width="5" height="5" />
        <rect x="42" y="58" width="4" height="4" />
        <rect x="30" y="88" width="6" height="6" />
        <rect x="46" y="110" width="4" height="4" />
        <rect x="24" y="122" width="4" height="4" />
        <rect x="48" y="30" width="3" height="3" />
      </g>

      <line x1="62" y1="24" x2="62" y2="140" stroke="#ddd2ff" strokeWidth="2" strokeDasharray="4 4" opacity="0.7" />
      <path d="M55 14 L69 14 L62 23 Z" fill="#ddd2ff" />

      <ellipse
        cx="118" cy="78" rx="46" ry="18"
        fill="none" stroke="#7a5fe0" strokeWidth="3" transform="rotate(-20 118 78)"
      />
      <circle cx="118" cy="78" r="14" fill="#a98cff" />
      <circle cx="114" cy="74" r="5" fill="#ddd2ff" />
      <circle cx="75" cy="94" r="6" fill="#ddd2ff" />

      <path
        d="M158 74 q6 -12 12 -6 t12 -6 t12 -6 t12 -6 t12 -6"
        fill="none" stroke="#ddd2ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M216 38 L230 40 L221 50 Z" fill="#ddd2ff" />

      <rect x="110" y="70" width="3" height="3" fill="#fff" />
      <rect x="72" y="91" width="2" height="2" fill="#fff" />
    </svg>
  );
}
