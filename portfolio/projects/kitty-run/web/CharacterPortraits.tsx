// Flat-vector poster portraits for the character select.
// Colours are HARDCODED on purpose: each card is a poster of its own
// character, not of the currently active theme.

const OUTLINE_PASTEL = "#3a3142";
const OUTLINE_SOULS = "#17130f";

// The face table is duplicated in the shell's ProjectArtwork.tsx (packages
// cannot import across) — keep them in sync. Same cat as the landing card:
// nicked ear, scarred squint, gold lenses, collar tag.
const CAT_FACE = {
  head:
    "M96 63L99 31L117 51C125 47 137 47 146 51L162 30L160 41L165 44L166 53" +
    "C173 65 173 95 158 107C147 116 113 117 102 108C88 96 88 74 96 63Z",
  earL: "M102 38L114 50L104 49Z",
  earR: "M159 37L149 51L160 50Z",
  tuftL: "M99 44l-6-3M101 50l-7-1",
  eyeL: "M105 80C110 70 123 70 127 80C122 89 110 89 105 80Z",
  eyeR: "M139 82C143 76 155 76 159 82C154 87 143 87 139 82Z",
  lidR: "M137 80C143 73 155 73 161 79",
  browL: "M104 66C109 61 118 61 123 64",
  scar: "M151 62l6-6M153 67l5-4",
  nose: "M124 90L136 90L130 97Z",
  mouth: "M130 97v3M130 100c-4 5-10 4-12 0M130 100c4 6 13 5 15-2",
  whisk: [
    "M103 94C91 92 81 88 73 83",
    "M103 99C91 100 81 100 71 98",
    "M104 104C94 108 86 112 79 115",
    "M157 94C169 91 179 87 187 82",
    "M157 99C170 100 181 101 189 100",
    "M156 104C164 108 172 110 178 112",
  ],
  collar: "M107 109C118 118 143 118 155 107",
  tag: "M131 117l5 5-5 5-5-5z",
};

export function KittyPortrait() {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke={OUTLINE_PASTEL}
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {/* the same face table as the card mark, scaled into the poster frame */}
      <g transform="translate(50 47) scale(0.52) translate(-131 -80)">
        <path d={CAT_FACE.head} strokeWidth={6} />
        <path d={CAT_FACE.earL} strokeWidth={4} opacity={0.85} />
        <path d={CAT_FACE.earR} strokeWidth={4} opacity={0.85} />
        <path d={CAT_FACE.tuftL} strokeWidth={4} opacity={0.8} />

        {/* gold lenses + ink pupils (wide left, squint right) */}
        <path d={CAT_FACE.eyeL} strokeWidth={5} fill="#e3ae3c" />
        <path d={CAT_FACE.eyeR} strokeWidth={5} fill="#e3ae3c" />
        <ellipse cx="116" cy="80" rx="3.2" ry="4.8" fill={OUTLINE_PASTEL} stroke="none" />
        <ellipse cx="149" cy="82" rx="2.6" ry="2.8" fill={OUTLINE_PASTEL} stroke="none" />
        <circle cx="118" cy="77.6" r="1.2" fill="#f3eada" stroke="none" />
        <circle cx="150.4" cy="80.4" r="0.9" fill="#f3eada" stroke="none" />

        <path d={CAT_FACE.lidR} strokeWidth={5} />
        <path d={CAT_FACE.browL} strokeWidth={4} opacity={0.8} />
        <path d={CAT_FACE.scar} strokeWidth={3.4} opacity={0.7} />
        <path d={CAT_FACE.nose} strokeWidth={4} fill="#c2502e" />
        <path d={CAT_FACE.mouth} strokeWidth={4.4} />
        {CAT_FACE.whisk.map((d) => (
          <path key={d} d={d} strokeWidth={3.4} opacity={0.75} />
        ))}

        {/* collar + tag — the bust cut line */}
        <path d={CAT_FACE.collar} strokeWidth={5} stroke="#c2502e" />
        <path d={CAT_FACE.tag} strokeWidth={4} fill="#e3ae3c" />
      </g>
    </svg>
  );
}

export function KnightPortrait() {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke={OUTLINE_SOULS}
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {/* rust cape behind everything */}
      <path d="M24 60 L8 98 H92 L76 60 Z" fill="#522a1e" />

      {/* pauldrons at the bottom corners */}
      <path d="M3 92 Q6 70 30 74 L34 98 H3 Z" fill="#6a6d72" />
      <path d="M97 92 Q94 70 70 74 L66 98 H97 Z" fill="#6a6d72" />

      {/* ear tips (bone) peeking above the dome */}
      <polygon points="24,34 30,10 44,26" fill="#e8e1d2" />
      <polygon points="76,34 70,10 56,26" fill="#e8e1d2" />

      {/* bone head — only the chin/cheeks end up visible */}
      <circle cx="50" cy="50" r="30" fill="#e8e1d2" />

      {/* steel great helm: dome + visor plate */}
      <path d="M20 54 A30 30 0 0 1 80 54 Z" fill="#6a6d72" />
      <line x1="50" y1="26" x2="50" y2="50" strokeWidth={2} />
      <rect x="24" y="50" width="52" height="22" rx="4" fill="#3d4045" />

      {/* rivets */}
      <circle cx="27" cy="44" r="1.6" fill="#3d4045" stroke="none" />
      <circle cx="73" cy="44" r="1.6" fill="#3d4045" stroke="none" />

      {/* visor slit with two ember eyes */}
      <rect x="30" y="58" width="40" height="5.5" rx="1" fill="#17130f" stroke="none" />
      <circle cx="41" cy="60.75" r="2.2" fill="#e07a34" stroke="none" />
      <circle cx="59" cy="60.75" r="2.2" fill="#e07a34" stroke="none" />

      {/* faint mouth line on the exposed chin */}
      <path d="M45 78 Q50 80.5 55 78" strokeWidth={2} />
    </svg>
  );
}
