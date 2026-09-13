// Flat-vector poster portraits for the character select.
// Colours are HARDCODED on purpose: each card is a poster of its own
// character, not of the currently active theme.

const OUTLINE_PASTEL = "#3a3142";
const OUTLINE_SOULS = "#17130f";

export function KittyPortrait() {
  const ink = OUTLINE_PASTEL;
  const head =
    "M25 30 L21 12 L38 22 C44 19 57 19 63 22 L80 12 L76 30 C86 41 86 68 71 78 C60 86 41 86 30 78 C15 68 15 41 25 30 Z";
  const star =
    "M0 -5 L1.45 -1.6 L5 -1.5 L2.2 0.85 L3.1 4.4 L0 2.35 L-3.1 4.4 L-2.2 0.85 L-5 -1.5 L-1.45 -1.6 Z";

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke={ink}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* squared-jaw head, angled ear tips */}
      <path d={head} />

      {/* slit eyes — flat bars */}
      <path d="M33 47 H43" />
      <path d="M58 47 H68" />

      {/* bar nose + w mouth */}
      <path d="M47 55 H54" />
      <path d="M43 60 Q46.8 65 50.5 60 Q54.2 65 58 60" />

      {/* whiskers — two per side, dry */}
      <path d="M16 44 L4 41" />
      <path d="M15 52 L3 53" />
      <path d="M85 44 L97 41" />
      <path d="M86 52 L98 53" />

      {/* brass star clip on the left ear */}
      <path
        d={star}
        transform="translate(28 21) rotate(-14) scale(0.95)"
        fill="#b9994f"
      />
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
