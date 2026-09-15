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
      {/* stubby arms: white paws under red cuffed sleeves */}
      <ellipse cx="23" cy="78" rx="9" ry="4.8" transform="rotate(38 23 78)" fill="#ffffff" />
      <ellipse cx="77" cy="78" rx="9" ry="4.8" transform="rotate(-38 77 78)" fill="#ffffff" />
      <ellipse cx="21" cy="74" rx="10.5" ry="6" transform="rotate(38 21 74)"
        fill="#e94f64" stroke="#3a3142" strokeWidth={2.2} />
      <ellipse cx="79" cy="74" rx="10.5" ry="6" transform="rotate(-38 79 74)"
        fill="#e94f64" stroke="#3a3142" strokeWidth={2.2} />
      <rect x="11" y="76" width="8" height="4.2" rx="1.8" transform="rotate(38 15 78)"
        fill="#d13a50" stroke="#3a3142" strokeWidth={2} />
      <rect x="81" y="76" width="8" height="4.2" rx="1.8" transform="rotate(-38 85 78)"
        fill="#d13a50" stroke="#3a3142" strokeWidth={2} />

      {/* hoodie torso: neckline scoop bottoms out at y ~74 — the chin (68)
          stays clear; shoulders round into the sleeve line */}
      <path d="M26 100 L26 82 C26 74 31 70 38 69 C44 68.4 47 70 50 70.5 C53 70 56 68.4 62 69 C69 70 74 74 74 82 L74 100 Z"
        fill="#e94f64" stroke="#3a3142" strokeWidth={2.2} strokeLinejoin="round" />

      {/* hood DOWN: bunched rolls behind the neck — the head covers their
          inner halves; the lobes peek beside the cheeks and under the chin */}
      <path d="M10 70 C6 64 8 57 14 55 C18 53.5 23 56 25 60 C26 52 33 48.5 40 50.5 C45 52 47.5 55 47 60 C52 55 60 55 65 59 C68 62 68.5 67 66.5 70 C71 68 77 70 80 74 C83 78 81 83 76 84 L24 84 C17 83 12 78 10 70 Z"
        fill="#d13a50" stroke="#3a3142" strokeWidth={2.2} strokeLinejoin="round" />
      {/* front roll: the collar lying on the chest, bottom edge dips below */}
      <path d="M24 70 C30 65 40 62.5 50 62.5 C60 62.5 70 65 76 70 C72 76 62 79.5 50 79.5 C38 79.5 28 76 24 70 Z"
        fill="#e94f64" stroke="#3a3142" strokeWidth={2.2} strokeLinejoin="round" />
      {/* lining sliver along the front roll's top edge */}
      <path d="M26 68.5 C34 64.5 42 63 50 63 C58 63 66 64.5 74 68.5 Q50 65.5 26 68.5 Z" fill="#f6a9c0" />

      {/* kangaroo pocket + angled hand slots */}
      <path d="M34 83 L66 83 L64.5 92 Q64 94 61.5 94 L38.5 94 Q36 94 35.5 92 Z"
        fill="#d13a50" stroke="#3a3142" strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M41 86.5 L38.5 91" strokeWidth={1.8} />
      <path d="M59 86.5 L61.5 91" strokeWidth={1.8} />
      {/* ribbed hem band */}
      <path d="M26 94 L74 94 L74 100 L26 100 Z" fill="#d13a50" stroke="#3a3142" strokeWidth={2.2} />
      {/* draw cords hanging from the collar, aglets at the ends */}
      <path d="M46.5 77 C45.8 80 44.8 83 44 86" strokeWidth={3.6} stroke="#3a3142" />
      <path d="M46.5 77 C45.8 80 44.8 80 44.2 85.5" strokeWidth={1.6} stroke="#ffffff" />
      <path d="M53.5 77 C54.2 80 55.2 83 56 86" strokeWidth={3.6} stroke="#3a3142" />
      <path d="M53.5 77 C54.2 80 55.2 83 55.8 85.5" strokeWidth={1.6} stroke="#ffffff" />
      <rect x="42" y="85.5" width="4.6" height="7" rx="2" fill="#e88bab" stroke="#3a3142" strokeWidth={1.8} />
      <rect x="53.4" y="85.5" width="4.6" height="7" rx="2" fill="#e88bab" stroke="#3a3142" strokeWidth={1.8} />

      {/* head 75x50 (1.5:1), fullest at the cheeks — drawn LAST so the
          garment never blocks the chin */}
      <path d="M12.5 46 C12.5 30 26 18 50 18 C74 18 87.5 30 87.5 46 C87.5 60 70 68 50 68 C30 68 12.5 60 12.5 46 Z" fill="#ffffff" />

      {/* ears: open paths (no base line) drawn over the crown */}
      <path d="M21.5 27.5 L25 14 Q26.5 11 29 13.5 L37.5 20.5" fill="#ffffff" />
      <path d="M78.5 27.5 L75 14 Q73.5 11 71 13.5 L62.5 20.5" fill="#ffffff" />

      {/* face in the lower half: small vertical eyes, small ochre nose, NO mouth */}
      <ellipse cx="34" cy="49" rx="2.2" ry="3.4" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="66" cy="49" rx="2.2" ry="3.4" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="50" cy="50.5" rx="2.6" ry="1.9" fill="#ffd44d" stroke="none" />

      {/* whiskers: three per side, eye level, slightly fanned */}
      <path d="M27 45 L3 40.5 M27 49 L2 49 M27 53 L3 57.5" strokeWidth={2} />
      <path d="M73 45 L97 40.5 M73 49 L98 49 M73 53 L97 57.5" strokeWidth={2} />
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
