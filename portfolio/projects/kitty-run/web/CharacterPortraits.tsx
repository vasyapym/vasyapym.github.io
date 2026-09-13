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
      {/* lavender shirt under purple pinafore; head overlaps (no neck) */}
      <path d="M24 84 C24 71 36 64 50 64 C64 64 76 71 76 84 L78 100 L22 100 Z" fill="#F7E8FF" />
      <path d="M36 64 L41 64 L41 74 L59 74 L59 64 L64 64 L64 74 L70 74 L76 100 L24 100 L30 74 L36 74 Z" fill="#9A6FBF" />

      {/* stubby arms — blocky rects instead of ellipses */}
      <rect x="10" y="72" width="18" height="10" rx="3" transform="rotate(38 19 77)" fill="#F7E8FF" />
      <rect x="72" y="72" width="18" height="10" rx="3" transform="rotate(-38 81 77)" fill="#F7E8FF" />

      {/* stepped pixel head — H/V segments only */}
      <path d="M32 22 L32 34 L28 34 L28 42 L20 42 L16 42 L16 54 L20 54 L20 58 L28 58 L28 64 L72 64 L72 58 L80 58 L80 54 L84 54 L84 42 L80 42 L72 42 L72 34 L68 34 L68 22 Z" fill="#F7E8FF" />

      {/* rectangular ears drawn over the crown */}
      <path d="M32 22 L32 10 L42 10 L42 22" fill="#F7E8FF" />
      <path d="M58 22 L58 10 L68 10 L68 22" fill="#F7E8FF" />

      {/* inner ear accents */}
      <rect x="34" y="13" width="6" height="7" fill="#9A6FBF" stroke="none" />
      <rect x="60" y="13" width="6" height="7" fill="#9A6FBF" stroke="none" />

      {/* pixel bell on right ear */}
      <rect x="69" y="8" width="7" height="8" rx="1" fill="#FFD23F" stroke="none" />
      <rect x="71" y="16" width="3" height="3" fill="#2A1B3D" stroke="none" />

      {/* square pixel eyes */}
      <rect x="32" y="44" width="5" height="6" fill={OUTLINE_PASTEL} stroke="none" />
      <rect x="63" y="44" width="5" height="6" fill={OUTLINE_PASTEL} stroke="none" />
      {/* square catchlight specks */}
      <rect x="35" y="44.5" width="1.8" height="1.8" fill="#ffffff" stroke="none" />
      <rect x="66" y="44.5" width="1.8" height="1.8" fill="#ffffff" stroke="none" />

      {/* gold square nose */}
      <rect x="47.5" y="51" width="5" height="3.5" rx="0.5" fill="#FFD23F" stroke="none" />

      {/* pixel mouth — two short horizontal bars */}
      <path d="M43 57 L47 57 M53 57 L57 57" strokeWidth={2} />

      {/* straight pixel whiskers, three per side */}
      <path d="M16 42 L3 39 M16 46 L2 46 M16 50 L3 53" strokeWidth={2} />
      <path d="M84 42 L97 39 M84 46 L98 46 M84 50 L97 53" strokeWidth={2} />
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
