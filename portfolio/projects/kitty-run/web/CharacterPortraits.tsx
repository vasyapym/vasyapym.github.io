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
      {/* stubby white arms at the sides, mostly behind the dress */}
      <ellipse cx="28" cy="80" rx="5.5" ry="9" fill="#ffffff" transform="rotate(-14 28 80)" />
      <ellipse cx="72" cy="80" rx="5.5" ry="9" fill="#ffffff" transform="rotate(14 72 80)" />

      {/* red pinafore dress (about half the head's width), past the frame bottom */}
      <path
        d="M 31 100 C 31 87 36 77 43 63 L 57 63 C 64 77 69 87 69 100 Z"
        fill="#e94f64"
      />
      <rect x="45" y="70" width="10" height="7.5" rx="2" fill="#d13a50" stroke="none" />

      {/* HK head: flat-wide oval, center 50,40 rx 34 ry 23 (~1.48:1) with small ears */}
      <path
        d="M 22 27 C 18.5 17 23.5 8 30 8 C 36 8 39.5 12 41 17.8 A 34 23 0 0 1 59 17.8 C 60.5 12 64 8 70 8 C 76.5 8 81.5 17 78 27 A 34 23 0 1 1 22 27 Z"
        fill="#ffffff"
      />

      {/* pink inner-ear caps (small HK ears) */}
      <path d="M 25.5 23.5 C 24.5 16.5 26.5 13 29.5 12.5 C 32 13.5 33.5 16 34.5 20 Z" fill="#f6a9c0" stroke="none" />
      <path d="M 74.5 23.5 C 75.5 16.5 73.5 13 70.5 12.5 C 68 13.5 66.5 16 65.5 20 Z" fill="#f6a9c0" stroke="none" />

      {/* single flat shadow, strictly inside the head */}
      <ellipse cx="50" cy="58" rx="14" ry="2.8" fill="#ece4ee" stroke="none" />

      {/* the bow: worn on the upper-right ear like the official art */}
      <path d="M 70 13.5 C 66.5 7.5 61 8.5 62 13.5 C 63 18.5 67.5 18.5 70 13.5 Z" fill="#e94f64" />
      <path d="M 70 13.5 C 73.5 7.5 79 8.5 78 13.5 C 77 18.5 72.5 18.5 70 13.5 Z" fill="#e94f64" />
      <circle cx="70" cy="13.5" r="3" fill="#d13a50" />

      {/* face in the lower half: wide-set button eyes, nose at eye level, NO mouth */}
      <ellipse cx="36" cy="46" rx="2.8" ry="3.8" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="64" cy="46" rx="2.8" ry="3.8" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="50" cy="49.5" rx="3.5" ry="2.5" fill="#ffd44d" strokeWidth={2} />

      {/* whiskers: three long ones per side at eye level, well past the head outline */}
      <path d="M 9 44 L 27 46.5" strokeWidth={2} />
      <path d="M 9 51 L 27 51" strokeWidth={2} />
      <path d="M 9 58 L 28 55.5" strokeWidth={2} />
      <path d="M 91 44 L 73 46.5" strokeWidth={2} />
      <path d="M 91 51 L 73 51" strokeWidth={2} />
      <path d="M 91 58 L 72 55.5" strokeWidth={2} />
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
