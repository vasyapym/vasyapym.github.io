import type { CSSProperties } from "react";

// Draft variant A — "Two-Ink Plate" (single-ochre duotone).
// Marks produced via delegated brief; integrated verbatim with mechanical fixes only.
const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// RaftMark — consensus topology in two inks; ochre spent only on the log-entry signal
export function RaftMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gva-raft-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#465059" />
        </pattern>
        <pattern id="gva-raft-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gva-raft-halo" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#d49a5f" />
        </pattern>
        <clipPath id="gva-raft-lead"><circle cx="104" cy="58" r="17" /></clipPath>
        <clipPath id="gva-raft-n1"><circle cx="176" cy="48" r="12" /></clipPath>
        <clipPath id="gva-raft-n2"><circle cx="200" cy="92" r="12" /></clipPath>
        <clipPath id="gva-raft-n3"><circle cx="150" cy="120" r="13" /></clipPath>
        <clipPath id="gva-raft-n4"><circle cx="66" cy="108" r="12" /></clipPath>
      </defs>

      {/* wide sparse backdrop */}
      <ellipse cx="130" cy="80" rx="104" ry="66" fill="url(#gva-raft-sparse)" opacity="0.09" />

      {/* one halo — ochre dots (hover hook) */}
      <ellipse className="gem-halo" style={haloVar(0.16)} cx="128" cy="82" rx="64" ry="42" fill="url(#gva-raft-halo)" opacity="0.16" />

      {/* faint screen behind leader */}
      <ellipse cx="104" cy="58" rx="26" ry="20" fill="url(#gva-raft-dense)" opacity="0.14" />

      {/* interconnects — neutral strokes */}
      <g stroke="#465059" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6">
        <line x1="104" y1="58" x2="176" y2="48" />
        <line x1="104" y1="58" x2="200" y2="92" />
        <line x1="104" y1="58" x2="150" y2="120" />
        <line x1="104" y1="58" x2="66" y2="108" />
      </g>
      <g stroke="#7d7669" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.45">
        <line x1="176" y1="48" x2="200" y2="92" />
        <line x1="200" y1="92" x2="150" y2="120" />
        <line x1="150" y1="120" x2="66" y2="108" />
      </g>

      {/* OCHRE SIGNAL — log entries riding the links */}
      <g fill="#e8b57c">
        <rect x="138" y="50" width="4.5" height="4.5" rx="1" transform="rotate(-8 140 52)" />
        <rect x="150" y="73" width="4.5" height="4.5" rx="1" transform="rotate(20 152 75)" />
        <rect x="126" y="87" width="4.5" height="4.5" rx="1" transform="rotate(40 128 89)" />
        <rect x="83" y="81" width="4.5" height="4.5" rx="1" transform="rotate(28 85 83)" />
      </g>

      {/* followers — neutral stepped discs */}
      <circle cx="176" cy="48" r="12" fill="#26333b" />
      <g clipPath="url(#gva-raft-n1)"><circle cx="172" cy="44" r="9.5" fill="#465059" /><circle cx="170" cy="42" r="5" fill="#7d7669" /></g>
      <circle cx="200" cy="92" r="12" fill="#26333b" />
      <g clipPath="url(#gva-raft-n2)"><circle cx="196" cy="88" r="9.5" fill="#465059" /><circle cx="194" cy="86" r="5" fill="#7d7669" /></g>
      <circle cx="150" cy="120" r="13" fill="#26333b" />
      <g clipPath="url(#gva-raft-n3)"><circle cx="146" cy="116" r="10" fill="#465059" /><circle cx="144" cy="114" r="5" fill="#7d7669" /></g>
      <circle cx="66" cy="108" r="12" fill="#26333b" />
      <g clipPath="url(#gva-raft-n4)"><circle cx="62" cy="104" r="9.5" fill="#465059" /><circle cx="60" cy="102" r="5" fill="#7d7669" /></g>

      {/* leader — neutral disc, deep-ochre signal ring */}
      <circle cx="104" cy="58" r="23" fill="none" stroke="#b97f45" strokeWidth="4" opacity="0.95" />
      <circle cx="104" cy="58" r="17" fill="#26333b" />
      <g clipPath="url(#gva-raft-lead)"><circle cx="99" cy="52" r="13" fill="#465059" /><circle cx="96" cy="49" r="7" fill="#7d7669" /></g>

      {/* log entries emitting from leader (ochre) */}
      <g fill="#e8b57c">
        <rect x="97" y="32" width="3.5" height="7" rx="1.5" />
        <rect x="104" y="32" width="3.5" height="7" rx="1.5" />
        <rect x="111" y="32" width="3.5" height="7" rx="1.5" />
      </g>

      {/* white square glints */}
      <rect x="95" y="48" width="3.6" height="3.6" fill="#ffffff" opacity="0.65" />
      <rect x="169" y="43" width="3" height="3" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

// KittyMark — mid-stride warm-white cat; ochre only on nose + one leading-paw glint
export function KittyMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gva-cat-halo" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#e8b57c" />
        </pattern>
        <pattern id="gva-cat-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <clipPath id="gva-cat-head"><ellipse cx="150" cy="70" rx="34" ry="28" /></clipPath>
        <clipPath id="gva-cat-body"><ellipse cx="150" cy="112" rx="22" ry="15" /></clipPath>
      </defs>

      {/* wide sparse backdrop */}
      <ellipse cx="140" cy="80" rx="104" ry="62" fill="url(#gva-cat-sparse)" opacity="0.09" />

      {/* one halo — ochre dots (hover hook) */}
      <ellipse className="gem-halo" style={haloVar(0.15)} cx="150" cy="80" rx="62" ry="40" fill="url(#gva-cat-halo)" opacity="0.15" />

      {/* ghost echo — faint neutral */}
      <g opacity="0.16" fill="#465059" transform="translate(-70 -20) scale(0.82)">
        <ellipse cx="150" cy="70" rx="34" ry="28" />
        <polygon points="130,49 122,26 142,45" />
        <polygon points="160,48 178,26 176,54" />
        <ellipse cx="150" cy="112" rx="22" ry="15" />
      </g>

      {/* dust-kick bars — neutral */}
      <g stroke="#7d7669" strokeWidth="6" strokeLinecap="round" opacity="0.5">
        <line x1="86" y1="108" x2="114" y2="108" />
        <line x1="76" y1="118" x2="110" y2="118" />
        <line x1="90" y1="128" x2="112" y2="128" />
      </g>

      {/* ground */}
      <path d="M 60 138 Q 150 128 240 136" stroke="#465059" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.4" />

      {/* body — paper over neutral mid step */}
      <ellipse cx="150" cy="112" rx="22" ry="15" fill="#b6ac95" />
      <g clipPath="url(#gva-cat-body)">
        <ellipse cx="148" cy="110" rx="19" ry="12" fill="#eeeae0" />
        <ellipse cx="144" cy="107" rx="9" ry="6" fill="#f4efe4" />
      </g>

      {/* ears (known-good, bases buried in head) */}
      <polygon points="130,49 122,26 142,45" fill="#eeeae0" />
      <polygon points="160,48 178,26 176,54" fill="#eeeae0" />

      {/* head — paper over neutral mid step */}
      <ellipse cx="150" cy="70" rx="34" ry="28" fill="#b6ac95" />
      <g clipPath="url(#gva-cat-head)">
        <ellipse cx="148" cy="68" rx="31" ry="25" fill="#eeeae0" />
        <ellipse cx="142" cy="62" rx="16" ry="12" fill="#f4efe4" />
      </g>

      {/* inner ears — ink */}
      <polygon points="131,46 126,33 138,44" fill="#26333b" opacity="0.85" />
      <polygon points="163,47 173,34 171,50" fill="#26333b" opacity="0.85" />

      {/* paw pads + eyes — ink ovals */}
      <ellipse cx="143" cy="124" rx="4" ry="2.4" fill="#26333b" />
      <ellipse cx="157" cy="124" rx="4" ry="2.4" fill="#26333b" />
      <ellipse cx="138" cy="72" rx="3.4" ry="5" fill="#26333b" />
      <ellipse cx="162" cy="72" rx="3.4" ry="5" fill="#26333b" />

      {/* OCHRE SIGNAL — nose */}
      <ellipse cx="150" cy="82" rx="4" ry="3" fill="#e8b57c" />

      {/* whiskers */}
      <g stroke="#26333b" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
        <line x1="124" y1="74" x2="104" y2="70" />
        <line x1="124" y1="79" x2="102" y2="80" />
        <line x1="124" y1="84" x2="106" y2="90" />
        <line x1="176" y1="74" x2="196" y2="70" />
        <line x1="176" y1="79" x2="198" y2="80" />
        <line x1="176" y1="84" x2="194" y2="90" />
      </g>

      {/* OCHRE SIGNAL — one glint on the leading paw area */}
      <rect x="140" y="120" width="3.2" height="3.2" fill="#e8b57c" opacity="0.9" />

      {/* white square glint */}
      <rect x="140" y="60" width="3.4" height="3.4" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

// FoxMark — dusk forest stepping down the neutral ramp; ochre only on the moon
export function FoxMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gva-fox-halo" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#e8b57c" />
        </pattern>
        <pattern id="gva-fox-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gva-fox-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#465059" />
        </pattern>
        <clipPath id="gva-fox-tree"><path d="M 130 60 L 156 124 Q 130 116 104 124 Z" /></clipPath>
        <clipPath id="gva-fox-moon"><circle cx="202" cy="46" r="15" /></clipPath>
      </defs>

      {/* wide sparse backdrop / halftone sky */}
      <ellipse cx="130" cy="80" rx="104" ry="62" fill="url(#gva-fox-sparse)" opacity="0.09" />

      {/* one halo — ochre dots (hover hook) */}
      <ellipse className="gem-halo" style={haloVar(0.15)} cx="130" cy="80" rx="60" ry="40" fill="url(#gva-fox-halo)" opacity="0.15" />

      {/* OCHRE SIGNAL — the moon, one warm light in a cold dusk */}
      <circle cx="202" cy="46" r="15" fill="#b97f45" />
      <g clipPath="url(#gva-fox-moon)">
        <circle cx="199" cy="43" r="12" fill="#e8b57c" />
        <circle cx="197" cy="41" r="6" fill="#ffe6c4" />
      </g>

      {/* far silhouettes — lighter neutral (recede back) */}
      <g opacity="0.5">
        <path d="M 66 112 L 78 82 L 90 112 Z" fill="#7d7669" />
        <path d="M 108 112 Q 96 88 120 84 Q 132 92 128 112 Z" fill="#b6ac95" />
        <path d="M 150 112 L 162 84 L 174 112 Z" fill="#7d7669" />
      </g>

      {/* ground ridge — dark front */}
      <path d="M 30 128 Q 130 112 230 128" stroke="#26333b" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.8" />

      {/* near bushes — darkest, front */}
      <path d="M 62 124 Q 46 92 82 90 Q 100 98 96 124 Z" fill="#26333b" opacity="0.7" />
      <path d="M 178 124 Q 166 96 198 92 Q 214 100 210 124 Z" fill="#26333b" opacity="0.7" />

      {/* center tree — neutral silhouette + clipped lighter caps */}
      <path d="M 130 60 L 156 124 Q 130 116 104 124 Z" fill="#26333b" />
      <g clipPath="url(#gva-fox-tree)">
        <polygon points="130,60 104,124 130,124" fill="#465059" />
        <polygon points="130,60 116,108 126,108" fill="#7d7669" />
        <rect x="118" y="96" width="26" height="20" fill="url(#gva-fox-dense)" opacity="0.5" />
      </g>

      {/* cold stars — former fireflies, now neutral */}
      <circle cx="118" cy="66" r="2.4" fill="#b6ac95" />
      <circle cx="168" cy="80" r="2.2" fill="#b6ac95" />
      <circle cx="92" cy="82" r="2" fill="#b6ac95" />

      {/* white square glints */}
      <rect x="122" y="76" width="3.2" height="3.2" fill="#ffffff" opacity="0.55" />
      <rect x="124" y="96" width="2.8" height="2.8" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}
