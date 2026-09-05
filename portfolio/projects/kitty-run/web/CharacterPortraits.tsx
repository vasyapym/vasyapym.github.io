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
      {/* ears (drawn first so the head covers their base) */}
      <polygon points="20,30 26,6 42,22" fill="#ffffff" />
      <polygon points="72,30 66,6 50,22" fill="#ffffff" />
      <polygon points="25,26 28,13 38,22" fill="#f6a9c0" stroke="none" />
      <polygon points="67,26 64,13 54,22" fill="#f6a9c0" stroke="none" />

      {/* head */}
      <circle cx="46" cy="44" r="30" fill="#ffffff" />

      {/* blush */}
      <circle cx="28" cy="53" r="3.5" fill="#f6a9c0" stroke="none" />
      <circle cx="64" cy="53" r="3.5" fill="#f6a9c0" stroke="none" />

      {/* eyes */}
      <ellipse cx="35" cy="42" rx="4.5" ry="6" fill="#3a3142" stroke="none" />
      <ellipse cx="57" cy="42" rx="4.5" ry="6" fill="#3a3142" stroke="none" />
      <circle cx="36.5" cy="39.5" r="1.5" fill="#ffffff" stroke="none" />
      <circle cx="58.5" cy="39.5" r="1.5" fill="#ffffff" stroke="none" />

      {/* nose + mouth */}
      <polygon points="46,52 42.5,48.5 49.5,48.5" fill="#f6a9c0" stroke="none" />
      <path d="M42 56 Q46 59.5 50 56" strokeWidth={2} />

      {/* whiskers */}
      <line x1="14" y1="46" x2="27" y2="48" strokeWidth={2} />
      <line x1="14" y1="55" x2="27" y2="53" strokeWidth={2} />
      <line x1="78" y1="46" x2="65" y2="48" strokeWidth={2} />
      <line x1="78" y1="55" x2="65" y2="53" strokeWidth={2} />

      {/* signature red bow, sitting low-right against the head */}
      <polygon points="78,74 61,64 60,84" fill="#e94f64" />
      <polygon points="78,74 95,66 95,84" fill="#e94f64" />
      <circle cx="78" cy="74" r="4.5" fill="#e94f64" />
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
