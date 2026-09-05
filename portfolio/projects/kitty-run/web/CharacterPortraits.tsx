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
      {/* tiny stubby arms (Hello-Kitty scale), mostly tucked behind the small torso */}
      <ellipse cx="27" cy="86" rx="4.5" ry="7.5" fill="#ffffff" transform="rotate(-8 27 86)" />
      <ellipse cx="73" cy="86" rx="4.5" ry="7.5" fill="#ffffff" transform="rotate(8 73 86)" />

      {/* small red jumper sliver (about half the head's width), past the frame bottom */}
      <path
        d="M 33 100 C 33 88 38 78 44 74.5 L 56 74.5 C 62 78 67 88 67 100 Z"
        fill="#e94f64"
      />
      <rect x="46" y="82" width="8" height="6" rx="2" fill="#d13a50" stroke="none" />

      {/* the head dominates: wide oval, center 50,44 rx 36 ry 30 — wider than the whole torso */}
      <path
        d="M 21 26 C 17 15 22 9 31 9 C 37 9 40 11 41 15 A 36 30 0 0 1 59 15 C 60 11 63 9 69 9 C 78 9 83 15 79 26 A 36 30 0 1 1 21 26 Z"
        fill="#ffffff"
      />

      {/* pink inner-ear caps (ears stay small, HK-like) */}
      <path d="M 25 22 C 24.5 15.5 26.5 12.5 30 12 C 32.5 13 34 15.5 35.5 19 Z" fill="#f6a9c0" stroke="none" />
      <path d="M 75 22 C 75.5 15.5 73.5 12.5 70 12 C 67.5 13 66 15.5 64.5 19 Z" fill="#f6a9c0" stroke="none" />

      {/* single flat shadow, strictly inside the head */}
      <ellipse cx="50" cy="69" rx="13" ry="3" fill="#ece4ee" stroke="none" />

      {/* the bow: upper-left, at ear level, straddling the head edge */}
      <path d="M 22 32 C 18 26 12 27 13 32 C 14 37 19 37 22 32 Z" fill="#e94f64" />
      <path d="M 22 32 C 26 26 32 27 31 32 C 30 37 25 37 22 32 Z" fill="#e94f64" />
      <circle cx="22" cy="32" r="2.8" fill="#d13a50" />

      {/* face in the lower half of the big head (big forehead): button eyes, yellow nose, NO mouth */}
      <ellipse cx="37" cy="52" rx="2.8" ry="3.8" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="63" cy="52" rx="2.8" ry="3.8" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="50" cy="56" rx="3.5" ry="2.5" fill="#ffd44d" strokeWidth={2} />

      {/* whiskers: three per side, long, crossing well past the head outline */}
      <path d="M 10 48 L 26 50.5" strokeWidth={2} />
      <path d="M 10 55 L 26 55" strokeWidth={2} />
      <path d="M 10 62 L 26 59.5" strokeWidth={2} />
      <path d="M 90 48 L 74 50.5" strokeWidth={2} />
      <path d="M 90 55 L 74 55" strokeWidth={2} />
      <path d="M 90 62 L 74 59.5" strokeWidth={2} />
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
