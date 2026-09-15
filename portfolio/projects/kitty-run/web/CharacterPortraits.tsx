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
      {/* hood DOWN: bunched shell behind the NECK — narrower than the
          shoulders (a hood never spans shoulder to shoulder): its top
          edge tucks behind the jaw, the lobes peek beside the neck and
          merge into the body's round shoulders */}
      <path d="M28 80 C27 68 30 58 42 56 C45 53 55 53 58 56 C70 58 73 68 72 80 Z"
        fill="#d13a50" stroke="#3a3142" strokeWidth={2.2} />
      {/* chest fur showing through the open collar */}
      <path d="M36 60 L36 76 C38 83 45 87 50 87 C55 87 62 83 64 76 L64 60 Z" fill="#ffffff" />
      {/* lining: the hood's inner fabric peeking under the jaw, drawn
          over the fur so it reads as the collar's inside edge */}
      <path d="M34 68 C38 65.6 44 64.8 50 64.8 C56 64.8 62 65.6 66 68 Q50 70.8 34 68 Z" fill="#f6a9c0" />
      {/* hoodie body: round barrel — the sides bow out to the hem so the
          cat reads chubby, not fit; round shoulders carry the hood */}
      <path d="M10 100 L10 90 C10 79 19 74 32 74 L38 74 C40 80 45 85 50 85 C55 85 60 80 62 74 L68 74 C81 74 90 79 90 90 L90 100 Z"
        fill="#e94f64" stroke="#3a3142" strokeWidth={2.2} strokeLinejoin="round" />
      {/* kangaroo pocket + angled hand slots */}
      <path d="M33 89 L67 89 L65 100 L35 100 Z"
        fill="#d13a50" stroke="#3a3142" strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M41 92 L38.5 96.5" strokeWidth={1.8} />
      <path d="M59 92 L61.5 96.5" strokeWidth={1.8} />
      {/* draw cords: white, ink-outlined, rounded aglets (rig-matching) */}
      <path d="M46 84 L45 91" strokeWidth={3.6} />
      <path d="M46 84 L45 91" strokeWidth={1.6} stroke="#ffffff" />
      <path d="M54 84 L55 91" strokeWidth={3.6} />
      <path d="M54 84 L55 91" strokeWidth={1.6} stroke="#ffffff" />
      <rect x="43.2" y="90.5" width="4.6" height="7" rx="2" fill="#e88bab" strokeWidth={1.8} />
      <rect x="52.2" y="90.5" width="4.6" height="7" rx="2" fill="#e88bab" strokeWidth={1.8} />
      {/* head 74.25 wide (F032: the forehead shrinks ~10% — the crown
          drops 16 -> 19.6, right at the ashen card's bone-top band —
          while the jaw/chin grows ~15% lower, chin 71 -> 73.8; the width
          keeps the F027 74.25 and the total height stays ~54, so the
          relevant proportions hold). Face rides the reshaped head, form
          unscaled; drawn LAST so the garment never blocks the chin */}
      <path d="M12.875 46.8 C12.875 32.8 26.24 19.6 50 19.6 C73.76 19.6 87.125 32.8 87.125 46.8 C87.125 65 74.3 73.8 50 73.8 C25.7 73.8 12.875 65 12.875 46.8 Z" fill="#ffffff" />
      {/* ears: open paths (no base line) drawn over the crown; tips keep
          their height, bases ride the lowered crown outline */}
      <path d="M21.785 30.05 L25.25 12 Q26.735 9 29.21 11.5 L37.625 22.35" fill="#ffffff" />
      <path d="M78.215 30.05 L74.75 12 Q73.265 9 70.79 11.5 L62.375 22.35" fill="#ffffff" />
      {/* face in the lower half: small vertical eyes, small orange nose
          (F046: #f24d00 at fill-opacity 0.6, shrunk ×0.75 — the 0.6
          white bleed was reading pig-pink, so a smaller denser dot;
          history: F038 #f28c3b@0.8, F040 #f57a1f@0.85, F042 0.6, F036
          brown #a5714b, before that yellow #ffd44d — the strongest
          remaining Hello Kitty marker), NO mouth — original compact
          form (F026: no spread/scale), now riding +3.3 down with the
          longer head so the face keeps its place in the lowered mass */}
      <ellipse cx="34" cy="52.3" rx="2.2" ry="3.4" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="66" cy="52.3" rx="2.2" ry="3.4" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="50" cy="53.95" rx="1.95" ry="1.43" fill="#f24d00" fillOpacity={0.6} stroke="none" />
      {/* whiskers: three per side, eye level, slightly fanned (rows ride
          the face's +3.3 down-shift; x-ends unchanged — lengths intact) */}
      <path d="M27 48.3 L3 43.8 M27 52.3 L2 52.3 M27 56.3 L3 60.8" strokeWidth={2} />
      <path d="M73 48.3 L97 43.8 M73 52.3 L98 52.3 M73 56.3 L97 60.8" strokeWidth={2} />
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
