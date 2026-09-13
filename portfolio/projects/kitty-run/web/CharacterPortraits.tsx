// Flat-vector poster portraits for the character select.
// Colours are HARDCODED on purpose: each card is a poster of its own
// character, not of the currently active theme.

const OUTLINE_PASTEL = "#3a3142";
const OUTLINE_SOULS = "#17130f";

export function KittyPortrait() {
  const ink = OUTLINE_PASTEL;
  const paper = "#ffffff";
  const sun = "#d4ad67";
  const leather = "#806650";

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke={ink}
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {/* white shirt with a leather collar band; head overlaps (no neck) */}
      <path d="M24 84 C24 71 36 64 50 64 C64 64 76 71 76 84 L78 100 L22 100 Z" fill={paper} />
      {/* shirt placket + two buttons — the clothing read */}
      <path d="M50 66 L50 100" strokeWidth={1.6} opacity={0.7} />
      <circle cx="46.5" cy="76" r="1.3" fill={ink} stroke="none" />
      <circle cx="53.5" cy="82" r="1.3" fill={ink} stroke="none" />
      {/* collar band — leather, sun pin */}
      <path d="M36 65 Q50 71 64 65" stroke={leather} strokeWidth={3.4} />
      <ellipse cx="50" cy="68.5" rx="3.6" ry="2.1" fill={leather} stroke="none" />
      <ellipse cx="50" cy="68.5" rx="1.3" ry="0.8" fill={sun} stroke="none" />

      {/* stubby arms, outward-down from shoulder level */}
      <ellipse cx="23" cy="78" rx="9" ry="4.8" transform="rotate(38 23 78)" fill={paper} />
      <ellipse cx="77" cy="78" rx="9" ry="4.8" transform="rotate(-38 77 78)" fill={paper} />

      {/* head 75×50 (1.5:1), fullest at the cheeks, flat crown, soft flat chin */}
      <path d="M12.5 46 C12.5 30 26 18 50 18 C74 18 87.5 30 87.5 46 C87.5 60 70 68 50 68 C30 68 12.5 60 12.5 46 Z" fill={paper} />

      {/* ears: open paths (no base line) drawn over the crown */}
      <path d="M21.5 27.5 L25 14 Q26.5 11 29 13.5 L37.5 20.5" fill={paper} />
      <path d="M78.5 27.5 L75 14 Q73.5 11 71 13.5 L62.5 20.5" fill={paper} />

      {/* upright oval eyes with a flat gold lid line across the top —
          alert but level: neither Pop's round sparkle nor a slit squint */}
      <ellipse cx="34" cy="48" rx="2.4" ry="3.6" fill={ink} stroke="none" />
      <ellipse cx="66" cy="48" rx="2.4" ry="3.6" fill={ink} stroke="none" />
      <path d="M31 45.4 H37" stroke={sun} strokeWidth={1.6} />
      <path d="M63 45.4 H69" stroke={sun} strokeWidth={1.6} />

      {/* angular ink nose; NO mouth line (the beard culprit) */}
      <path d="M47 51 L53 51 L50 54.5 Z" fill={ink} stroke="none" />

      {/* whiskers — two thin pairs per side, high, clearly feline */}
      <path d="M27 42 L6 38 M26 48 L4 49" strokeWidth={1.8} />
      <path d="M73 42 L94 38 M74 48 L96 49" strokeWidth={1.8} />
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
