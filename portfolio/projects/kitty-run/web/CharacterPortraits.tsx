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
      {/* stubby upper arms (small hands), cropped by the frame like the knight's pauldrons */}
      <ellipse cx="27" cy="88" rx="5" ry="9" fill="#ffffff" transform="rotate(-10 27 88)" />
      <ellipse cx="73" cy="88" rx="5" ry="9" fill="#ffffff" transform="rotate(10 73 88)" />

      {/* red jumper shoulders (smaller than the head), running past the frame bottom */}
      <path
        d="M 32 100 C 32 86 37 76 44 73 L 56 73 C 63 76 68 86 68 100 Z"
        fill="#e94f64"
      />
      <rect x="45" y="80" width="10" height="7.5" rx="2" fill="#d13a50" stroke="none" />

      {/* head + ears as one continuous silhouette (wide oval, center 50,46 rx 32 ry 27) */}
      <path
        d="M 22.5 32.5 C 19 19 24 12.5 29.5 12.5 C 36 12.5 41.5 16 44.5 19.4 A 32 27 0 0 1 55.5 19.4 C 58.5 16 64 12.5 70.5 12.5 C 76 12.5 81 19 77.5 32.5 A 32 27 0 1 1 22.5 32.5 Z"
        fill="#ffffff"
      />

      {/* pink inner-ear caps */}
      <path d="M 27 26 C 26 19 28 16 30.5 15.5 C 33.5 16.5 35.5 19 38 22.5 Z" fill="#f6a9c0" stroke="none" />
      <path d="M 73 26 C 74 19 72 16 69.5 15.5 C 66.5 16.5 64.5 19 62 22.5 Z" fill="#f6a9c0" stroke="none" />

      {/* single flat shadow, strictly inside the head */}
      <ellipse cx="50" cy="69" rx="11.5" ry="2.5" fill="#ece4ee" stroke="none" />

      {/* the bow: upper-left, at ear level, straddling the head edge */}
      <path d="M 24.5 28.5 C 20.5 22.5 14.5 23.5 15.5 28.5 C 16.5 33.5 21.5 33.5 24.5 28.5 Z" fill="#e94f64" />
      <path d="M 24.5 28.5 C 28.5 22.5 34.5 23.5 33.5 28.5 C 32.5 33.5 27.5 33.5 24.5 28.5 Z" fill="#e94f64" />
      <circle cx="24.5" cy="28.5" r="2.8" fill="#d13a50" />

      {/* face: two button eyes, yellow nose, NO mouth */}
      <ellipse cx="40" cy="44" rx="2.8" ry="3.8" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="60" cy="44" rx="2.8" ry="3.8" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="50" cy="50" rx="3.5" ry="2.5" fill="#ffd44d" strokeWidth={2} />

      {/* whiskers: three per side, crossing the head outline */}
      <path d="M 16 43 L 30 46" strokeWidth={2} />
      <path d="M 16 50 L 30 50" strokeWidth={2} />
      <path d="M 16 57 L 30 54" strokeWidth={2} />
      <path d="M 84 43 L 70 46" strokeWidth={2} />
      <path d="M 84 50 L 70 50" strokeWidth={2} />
      <path d="M 84 57 L 70 54" strokeWidth={2} />
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
