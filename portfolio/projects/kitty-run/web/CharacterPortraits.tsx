// Flat-vector poster portraits for the character select.
// Colours are HARDCODED on purpose: each card is a poster of its own
// character, not of the currently active theme.

const OUTLINE_PASTEL = "#3a3142";
const OUTLINE_SOULS = "#17130f";

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
      {/* body */}
      <ellipse cx="50" cy="80" rx="20" ry="22" fill="#c0cdda" />

      {/* scarf trail — wind left */}
      <path d="M36 62 Q22 70 12 78 Q6 84 8 80" stroke="#c89850" strokeWidth={3} />
      <path d="M36 64 Q24 73 16 82 Q10 88 12 85" stroke="#c89850" strokeWidth={2} opacity={0.5} />

      {/* scarf knot */}
      <ellipse cx="39" cy="61" rx="7" ry="4.5" fill="#c89850" />

      {/* head — big wide */}
      <ellipse cx="50" cy="38" rx="32" ry="26" fill="#c0cdda" />

      {/* ears */}
      <path d="M24 20 L18 4 L34 17 Z" fill="#c0cdda" />
      <path d="M76 20 L82 4 L66 17 Z" fill="#c0cdda" />

      {/* inner ears */}
      <path d="M25 19 L21 8 L32 17 Z" fill="#b0a0aa" stroke="none" />
      <path d="M75 19 L79 8 L68 17 Z" fill="#b0a0aa" stroke="none" />

      {/* squint eyes — narrow amber almonds */}
      <path d="M33 36 Q39 34 45 36 Q39 38 33 36 Z" fill="#c89850" stroke={OUTLINE_PASTEL} strokeWidth={1.5} />
      <path d="M55 36 Q61 34 67 36 Q61 38 55 36 Z" fill="#c89850" stroke={OUTLINE_PASTEL} strokeWidth={1.5} />

      {/* nose — angular, rose */}
      <path d="M50 42 L47 46 L53 46 Z" fill="#c49898" stroke="none" />

      {/* mouth — minimal dash for DMCA distance */}
      <line x1="47" y1="49" x2="53" y2="49" stroke={OUTLINE_PASTEL} strokeWidth={1} opacity={0.3} />
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
