// Flat-vector poster portraits for the character select.
// Colours are HARDCODED on purpose: each card is a poster of its own
// character, not of the currently active theme.

const OUTLINE_PASTEL = "#3a3142";
const OUTLINE_SOULS = "#17130f";

// Pixel Kitty rig (12×10) — same ASCII grid as the landing-card mark;
// cell size is set per surface. O ink · I fill · S shadow · E eye ·
// M mouth · N accent (bell collar).
const PIXEL_CAT_GRID: readonly string[] = [
  "..O......O..",
  ".OIO....OIO.",
  ".OIIOOOOIIO.",
  "OIIIIIIIIIIO",
  "OIEIIIIEIIIO",
  "OIIIIMMIIIIO",
  ".OIIIIIIIISO",
  "..OONNNNOO..",
  ".OISIIIISSO.",
  "..OOOOOOOO..",
];

const PIXEL_CAT_SWATCH: { [ch: string]: string | undefined } = {
  O: "#2a1b3d",
  I: "#f7e8ff",
  S: "#9a6fbf",
  E: "#2a1b3d",
  M: "#2a1b3d",
  N: "#ffd23f",
};

function rasterizePixelCat(cell: number, ox: number, oy: number) {
  const cells: { key: string; x: number; y: number; fill: string }[] = [];
  PIXEL_CAT_GRID.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const fill = PIXEL_CAT_SWATCH[row[x]];
      if (fill) {
        cells.push({ key: `${x}-${y}`, x: ox + x * cell, y: oy + y * cell, fill });
      }
    }
  });
  return cells;
}

export function KittyPortrait() {
  const cell = 8;
  const ox = 2;
  const oy = 10;
  const cells = rasterizePixelCat(cell, ox, oy);
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
      {/* the pixel rig — fills carry the read; svg-level stroke is overridden */}
      <g stroke="none" shapeRendering="crispEdges">
        {cells.map((c) => (
          <rect key={c.key} x={c.x} y={c.y} width={cell} height={cell} fill={c.fill} />
        ))}
      </g>

      {/* eye catchlights — one white pixel each */}
      <rect x="22" y="44" width="2.5" height="2.5" fill="#ffffff" stroke="none" />
      <rect x="62" y="44" width="2.5" height="2.5" fill="#ffffff" stroke="none" />

      {/* bell highlight + clapper */}
      <rect x="36" y="67" width="2" height="2" fill="#f7e8ff" stroke="none" />
      <rect x="43" y="71" width="10" height="2.5" fill="#2a1b3d" stroke="none" />
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
