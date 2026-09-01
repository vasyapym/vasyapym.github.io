import type { CSSProperties } from "react";

// Practice Map rethink round — two candidates from the delegated brief
// (BRIEF-card-art-practicemap-rethink.md), integrated verbatim with mechanical
// fixes only: pattern/clip ids namespaced per candidate (gem-trail-a-*,
// gem-trail-b-*) so both can render on one page next to the incumbent.
// On adoption the winner's ids rename back to the family prefix gem-trail-*.
const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

// Candidate A — "Terraced climb": elevation survey with a lit summit beacon;
// a dashed trail climbs from base camp, the climbed band overprints halftone.
export function TrailCandidateA() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-trail-a-dense" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#5cc8ff" />
        </pattern>
        <pattern id="gem-trail-a-sparse" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-trail-a-halo" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#5cc8ff" />
        </pattern>
        <clipPath id="gem-trail-a-summit">
          <circle cx="148" cy="84" r="8" />
        </clipPath>
      </defs>

      {/* sparse printed backdrop (may exceed safe area) */}
      <ellipse cx="130" cy="82" rx="104" ry="64" fill="url(#gem-trail-a-sparse)" opacity="0.09" />
      {/* halo — pulse binds to class */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="148" cy="84" rx="60" ry="42" fill="url(#gem-trail-a-halo)" opacity="0.12" />

      {/* FOUR nested contour loops (wobbled ellipses = terrain) */}
      <path d="M 220 78 C 224 108 186 140 148 140 C 110 142 78 112 76 84 C 74 56 112 30 150 28 C 188 26 218 50 220 78 Z" fill="none" stroke="#b6ac95" strokeWidth="1" opacity="0.3" />
      <path d="M 204 76 C 208 102 178 132 148 132 C 118 134 92 108 92 84 C 90 60 120 38 148 36 C 176 34 202 52 204 76 Z" fill="none" stroke="#7d7669" strokeWidth="1" opacity="0.4" />
      <path d="M 188 80 C 192 100 170 118 148 118 C 126 120 108 102 108 84 C 106 66 128 50 148 50 C 168 48 186 62 188 80 Z" fill="none" stroke="#7d7669" strokeWidth="1.2" opacity="0.55" />
      <path d="M 170 82 C 172 94 158 104 148 104 C 138 106 126 94 126 84 C 124 74 138 64 148 64 C 158 62 168 72 170 82 Z" fill="none" stroke="#465059" strokeWidth="1.5" opacity="0.7" />

      {/* CLIMBED BAND — partial lower arc overprint (halftone) */}
      <path d="M 188 80 C 192 100 170 118 148 118 C 126 120 108 102 108 84" fill="none" stroke="url(#gem-trail-a-dense)" strokeWidth="14" strokeLinecap="round" opacity="0.45" />

      {/* TRAIL from base camp up to summit base */}
      <path d="M 46 126 C 70 122 84 108 96 104 C 116 96 122 100 140 92" fill="none" stroke="#b6ac95" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 7" opacity="0.9" />
      <path d="M 68 117 L 73 112 L 76 116" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 114 100 L 119 95 L 122 99" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* BASE CAMP */}
      <line x1="38" y1="129" x2="56" y2="129" stroke="#7d7669" strokeWidth="1" opacity="0.7" />
      <path d="M 40 128 L 43.5 122 L 47 128 Z" fill="#465059" />
      <path d="M 47 128 L 50.5 122 L 54 128 Z" fill="#26333b" />

      {/* YOU ARE HERE pulse on the trail */}
      <circle cx="96" cy="104" r="6.5" fill="none" stroke="#5cc8ff" strokeWidth="1" opacity="0.5" />
      <circle cx="96" cy="104" r="3.5" fill="#5cc8ff" />

      {/* COMPASS ROSE (top-left) */}
      <g stroke="#7d7669" opacity="0.5">
        <line x1="34" y1="36" x2="34" y2="28" strokeWidth="1.2" />
        <line x1="34" y1="36" x2="34" y2="42" strokeWidth="1" />
        <line x1="34" y1="36" x2="40" y2="36" strokeWidth="1" />
        <line x1="34" y1="36" x2="28" y2="36" strokeWidth="1" />
        <line x1="30" y1="32" x2="38" y2="40" strokeWidth="0.75" />
        <line x1="38" y1="32" x2="30" y2="40" strokeWidth="0.75" />
      </g>

      {/* FLAG on the summit */}
      <line x1="148" y1="76" x2="148" y2="65" stroke="#b6ac95" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="148,64 161,68 148,72" fill="#5cc8ff" />

      {/* SUMMIT + HERE — dominant stepped-cap beacon */}
      <g clipPath="url(#gem-trail-a-summit)">
        <circle cx="148" cy="84" r="8" fill="#26333b" />
        <circle cx="148" cy="84" r="6" fill="#465059" />
        <circle cx="148" cy="84" r="4" fill="#7d7669" />
        <circle cx="147" cy="83" r="4.5" fill="#5cc8ff" />
        <circle cx="146.5" cy="82.5" r="1.5" fill="#d6f2ff" />
        <circle cx="145" cy="81" r="1" fill="#ffffff" />
      </g>
    </svg>
  );
}

// Candidate B — "Constellation index": personal star atlas with one blazing
// focus; practised concepts thread into a constellation, next-up waits dashed.
export function TrailCandidateB() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-trail-b-dense" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#5cc8ff" />
        </pattern>
        <pattern id="gem-trail-b-sparse" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-trail-b-halo" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#5cc8ff" />
        </pattern>
        <clipPath id="gem-trail-b-focus"><circle cx="150" cy="84" r="8.5" /></clipPath>
        <clipPath id="gem-trail-b-nodeA"><circle cx="58" cy="112" r="5" /></clipPath>
        <clipPath id="gem-trail-b-nodeB"><circle cx="168" cy="52" r="4.5" /></clipPath>
        <clipPath id="gem-trail-b-nodeC"><circle cx="204" cy="84" r="5" /></clipPath>
      </defs>

      {/* sparse printed backdrop */}
      <ellipse cx="130" cy="82" rx="104" ry="64" fill="url(#gem-trail-b-sparse)" opacity="0.09" />
      {/* halo centred on the focus */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="150" cy="84" rx="60" ry="42" fill="url(#gem-trail-b-halo)" opacity="0.12" />

      {/* quieted survey grid — backdrop */}
      <g stroke="#465059" strokeWidth="1" opacity="0.22">
        <line x1="58" y1="24" x2="58" y2="136" />
        <line x1="110" y1="24" x2="110" y2="136" />
        <line x1="162" y1="24" x2="162" y2="136" />
        <line x1="214" y1="24" x2="214" y2="136" />
        <line x1="24" y1="56" x2="236" y2="56" />
        <line x1="24" y1="112" x2="236" y2="112" />
      </g>

      {/* CONSTELLATION THREADS */}
      <g stroke="#465059" strokeWidth="1" opacity="0.5" fill="none">
        <path d="M 58 112 L 94 62 L 150 84 L 168 52 L 204 84" />
        <path d="M 94 62 L 122 122 L 150 84" />
      </g>

      {/* dashed thread focus -> next-up */}
      <path d="M 158 88 L 198 104" stroke="#7d7669" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" fill="none" />

      {/* star-nodes (already practised) */}
      <g clipPath="url(#gem-trail-b-nodeA)"><circle cx="58" cy="112" r="5" fill="#26333b" /><circle cx="58" cy="112" r="3.5" fill="#465059" /></g>
      <g clipPath="url(#gem-trail-b-nodeB)"><circle cx="168" cy="52" r="4.5" fill="#26333b" /><circle cx="168" cy="52" r="3" fill="#465059" /></g>
      <g clipPath="url(#gem-trail-b-nodeC)"><circle cx="204" cy="84" r="5" fill="#26333b" /><circle cx="204" cy="84" r="3.5" fill="#465059" /></g>
      <circle cx="94" cy="62" r="4" fill="#465059" />
      <circle cx="122" cy="122" r="3.5" fill="#7d7669" />
      <circle cx="222" cy="40" r="3" fill="#7d7669" />

      {/* travelled chevrons pointing at the focus */}
      <g stroke="#b6ac95" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M -3 -3 L 0 0 L -3 3" transform="translate(122 73) rotate(21)" />
        <path d="M -3 -3 L 0 0 L -3 3" transform="translate(76 87) rotate(-54)" />
        <path d="M -3 -3 L 0 0 L -3 3" transform="translate(136 103) rotate(-54)" />
      </g>

      {/* NEXT UP — revisit queue loading */}
      <circle cx="204" cy="108" r="6" fill="none" stroke="#7d7669" strokeWidth="1.2" strokeDasharray="2 3" />
      <circle cx="204" cy="108" r="3" fill="url(#gem-trail-b-dense)" opacity="0.7" />

      {/* mini-star accent */}
      <polygon points="74,36 75.5,38.5 78,40 75.5,41.5 74,44 72.5,41.5 70,40 72.5,38.5" fill="#b6ac95" />

      {/* THE FOCUS (HERE) — dominant blazing star */}
      <polygon points="150,69 154,80 165,84 154,88 150,99 146,88 135,84 146,80" fill="#eeeae0" opacity="0.85" transform="rotate(45 150 84)" />
      <g clipPath="url(#gem-trail-b-focus)">
        <circle cx="150" cy="84" r="8.5" fill="#26333b" />
        <circle cx="150" cy="84" r="6.5" fill="#465059" />
        <circle cx="150" cy="84" r="5" fill="#5cc8ff" />
        <circle cx="149" cy="83" r="2" fill="#d6f2ff" />
        <circle cx="148" cy="82" r="1" fill="#ffffff" />
      </g>
    </svg>
  );
}
