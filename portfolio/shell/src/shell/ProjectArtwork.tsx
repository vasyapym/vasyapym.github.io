import { useRef, type CSSProperties, type PointerEvent, type ReactElement } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import type { ProjectCenter } from "../../../contracts/project-presentation";

type ProjectArtworkProps = { project: ProjectModule };

// Carry each gem-halo shape's true base opacity so the CSS hover-brighten
// (calc(var(--halo-opacity, 0.2) + 0.1)) is additive from that base, not 0.2.
const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

export default function ProjectArtwork({ project }: ProjectArtworkProps) {
  const objectRef = useRef<HTMLDivElement>(null);
  const presentation = project.presentation;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || !objectRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    const objectStyle = objectRef.current.style;
    objectStyle.setProperty("--art-rotate-x", `${y * -6}deg`);
    objectStyle.setProperty("--art-rotate-y", `${x * 6}deg`);
    objectStyle.setProperty("--art-shift-x", `${x * 8}px`);
    objectStyle.setProperty("--art-shift-y", `${y * 6}px`);
  };

  const resetPointer = () => {
    if (!objectRef.current) return;
    const objectStyle = objectRef.current.style;
    objectStyle.setProperty("--art-rotate-x", "0deg");
    objectStyle.setProperty("--art-rotate-y", "0deg");
    objectStyle.setProperty("--art-shift-x", "0px");
    objectStyle.setProperty("--art-shift-y", "0px");
  };

  return (
    <div
      className={`project-artwork ${presentation.className} artwork-motion-${presentation.motion}`}
      onPointerLeave={resetPointer}
      onPointerMove={handlePointerMove}
      aria-hidden="true"
    >
      <div ref={objectRef} className="project-artwork-object">
        <span className={`project-artwork-center center-${presentation.centerMark}`}>
          <CenterMark mark={presentation.centerMark} label={presentation.centerLabel} />
        </span>
      </div>
    </div>
  );
}

const CENTER_MARKS: Partial<Record<ProjectCenter, () => ReactElement>> = {
  raft: RaftCenterMark,
  kitty: KittyCenterMark,
  fox: FoxCenterMark,
  blast: BlastCenterMark,
  spiral: SpiralCenterMark,
  matrix: MatrixCenterMark,
  spine: SpineCenterMark,
  quicknotes: QuicknotesCenterMark,
};

function CenterMark({ mark, label }: { mark: ProjectCenter; label: string }) {
  const Component = CENTER_MARKS[mark];
  if (!Component) return <>{label}</>;
  return <Component />;
}

// Current marks, exported for the /art-directions comparison page so the
// draft sections can render them next to the round's variants.
export const INCUMBENT_MARKS: Partial<Record<ProjectCenter, () => ReactElement>> = {
  raft: RaftCenterMark,
  blast: BlastCenterMark,
  spiral: SpiralCenterMark,
  trail: TrailCenterMark,
  matrix: MatrixCenterMark,
  fox: FoxCenterMark,
};

/* ── 1 · Raft Cluster — coral spot ink, "majority partition", R008
   refinement: the S-cut straightened to one vertical fault line (paper
   hairline on the majority side); each minority branch is now one straight
   ray from the leader — solid heartbeat up to the cut, dashed continuation
   after it, collinear so no kink; links stop a measured gap short of every
    node; span pulled in ~7% by shortening the lines. R009 owner micro-steers:
    cut trimmed 10% overall (both ends), dashed continuations −6%, followers
    −5% (r9.5),     leader cluster −7%; composition re-centered (viewBox −6). R010: followers
    mirrored to the minority pair's offsets (y50/y110), cut −15% more
    (y32.4–y127.6), leader −10% more. R011: cut single-line (paper twin gone)
    and −15% more (y39.5–y120.5), majority links +10% longer. ── */
function RaftCenterMark() {
  return (
    <svg viewBox="-6 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft-bed" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft-glow" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx="124" cy="82" rx="99" ry="64" fill="url(#gem-raft-bed)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="90" cy="80" rx="58" ry="40" fill="url(#gem-raft-glow)" opacity={0.12} />

      {/* majority links — measured, stop short of every node; followers mirror
          the minority pair's vertical offsets; +10% length (leader-side start
          moved closer to the now-smaller leader, node gaps intact) */}
      <g stroke="#b6ac95" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <line x1="66.9" y1="65.7" x2="56.7" y2="58" />
        <line x1="66.9" y1="94.3" x2="56.7" y2="102" />
      </g>
      {/* heartbeats that die at the cut — collinear with the dashed rays */}
      <g stroke="#b6ac95" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5">
        <line x1="110.2" y1="73.7" x2="140" y2="65.9" />
        <line x1="110.2" y1="86.3" x2="140" y2="94.1" />
      </g>

      {/* the partition — one single straight line (paper twin removed per owner),
          trimmed again ~15% (y39.5–y120.5) */}
      <path d="M152 39.5 L152 120.5" fill="none" stroke="#7d7669" strokeWidth="3" strokeLinecap="round" />

      {/* orphaned minority — soft round-cap dashes on the leader's rays;
          each continuation trimmed ~6% (0.8 unit off both ends) */}
      <g stroke="#7d7669" strokeWidth="2" strokeLinecap="round" strokeDasharray="1.5 5" fill="none">
        <line x1="160.8" y1="60.5" x2="185.7" y2="54" />
        <line x1="160.8" y1="99.5" x2="185.7" y2="106" />
        <line x1="201" y1="65" x2="201" y2="95" />
      </g>
      <g fill="#26333b" stroke="#7d7669" strokeWidth="2" strokeLinecap="round" strokeDasharray="1.5 4.5">
        <circle cx="201" cy="50" r="10" pathLength={60} />
        <circle cx="201" cy="110" r="10" pathLength={60} />
      </g>

      {/* followers — bone bodies, −5% (r9.5), mirrored heights (y50/y110) */}
      <g fill="#b6ac95">
        <circle cx="46" cy="50" r="9.5" />
        <circle cx="46" cy="110" r="9.5" />
      </g>

      {/* leader — coral core −7% then −10% more, term ring, one drawn paper rim */}
      <circle cx="86" cy="80" r="17.6" fill="none" stroke="#ff6a5f" strokeWidth="1.25" opacity="0.45" />
      <circle cx="86" cy="80" r="13.4" fill="#ff6a5f" />
      <path d="M76.8 80 A9.2 9.2 0 0 1 86 70.8" fill="none" stroke="#f4efe4" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/* ── 2 · Cat Runner — pink spot ink, kitty head mark in motion ── */
function KittyCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-cat-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff8fbf" />
        </pattern>
        <pattern id="gem-cat-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-cat-halo" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#7d7669" />
        </pattern>
        <clipPath id="gem-cat-head-clip">
          <ellipse cx="136" cy="76" rx="40" ry="30" />
        </clipPath>
      </defs>
      {/* wide sparse neutral backdrop field */}
      <ellipse cx="136" cy="78" rx="104" ry="62" fill="url(#gem-cat-sparse)" opacity="0.09" />
      {/* single neutral halo */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="136" cy="78" rx="62" ry="40" fill="url(#gem-cat-halo)" opacity="0.12" />
      {/* ordered horizontal speed dashes */}
      <rect x="26" y="72" width="40" height="6" rx="3" fill="#7d7669" opacity="0.4" />
      <rect x="26" y="84" width="30" height="6" rx="3" fill="#7d7669" opacity="0.4" />
      <rect x="26" y="96" width="20" height="6" rx="3" fill="#7d7669" opacity="0.4" />
      {/* one clean ground curve */}
      <path d="M 46 120 Q 140 112 236 118" stroke="#465059" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* bullet-time dash trail on the ground */}
      <rect x="100" y="114" width="60" height="5" rx="2.5" fill="url(#gem-cat-dense)" opacity="0.45" />
      {/* pink halftone ghost echo — head-only, close behind-left */}
      <g transform="translate(-40 4) scale(0.94)" opacity="0.14">
        <ellipse cx="136" cy="76" rx="40" ry="30" fill="url(#gem-cat-dense)" />
        <polygon points="106,62 94,38 122,54" fill="url(#gem-cat-dense)" />
        <polygon points="166,62 178,38 150,54" fill="url(#gem-cat-dense)" />
      </g>
      {/* ears (bases buried, painted before head) */}
      <polygon points="106,62 94,38 122,54" fill="#f4efe4" />
      <polygon points="166,62 178,38 150,54" fill="#f4efe4" />
      {/* head dominates — the whole mark */}
      <ellipse cx="136" cy="76" rx="40" ry="30" fill="#eeeae0" />
      <g clipPath="url(#gem-cat-head-clip)">
        <ellipse cx="136" cy="90" rx="40" ry="30" fill="#b6ac95" />
      </g>
      {/* whisker spikes — paper, punching past the head edge */}
      <path d="M 100 68 L 78 64" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 100 76 L 76 76" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 100 84 L 78 88" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 68 L 194 64" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 76 L 196 76" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 84 L 194 88" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      {/* negative-space eyes, wide-set on one line */}
      <ellipse cx="118" cy="78" rx="2.8" ry="4.2" fill="#0b1317" />
      <ellipse cx="154" cy="78" rx="2.8" ry="4.2" fill="#0b1317" />
      {/* single tiny glint — back on the paper head now that the mark is
          bare again (F020: the R019 dome read as a hat on the landing
          tile; the tile stays bare-eared) */}
      <rect x="122" y="58" width="2.6" height="2.6" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

/* ── 3 · Evening Forest — teal spot ink, "fox on the trail", R007
   refinement (chat-model salvage): the paper fox becomes bone with a lit
   paper ridge running tail → shoulder (whitish as structure, not mass); the
   head glint becomes a real deep-ink eye; mushroom spots go tone-on-tone. ── */
function FoxCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true" shapeRendering="crispEdges">
      <defs>
        <pattern id="gem-fox-bed" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-fox-glow" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#4fd1a5" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="92" rx="106" ry="58" fill="url(#gem-fox-bed)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="118" cy="98" rx="56" ry="30" fill="url(#gem-fox-glow)" opacity={0.12} />

      {/* ground */}
      <rect x="32" y="124" width="200" height="4" fill="#1f5e4c" />
      <g fill="#1f5e4c">
        <rect x="60" y="132" width="10" height="3" />
        <rect x="96" y="134" width="14" height="3" />
        <rect x="150" y="132" width="8" height="3" />
      </g>

      {/* fern */}
      <g fill="#1f5e4c">
        <rect x="44" y="100" width="4" height="24" />
        <rect x="34" y="104" width="10" height="4" />
        <rect x="48" y="98" width="10" height="4" />
        <rect x="36" y="112" width="8" height="4" />
        <rect x="48" y="108" width="10" height="4" />
      </g>

      {/* fox — bone body, one paper ridge from tail tip to shoulder */}
      <g fill="#b6ac95">
        <rect x="72" y="92" width="28" height="10" />
        <rect x="100" y="96" width="40" height="16" />
        <rect x="140" y="88" width="16" height="16" />
        <rect x="144" y="80" width="4" height="8" />
        <rect x="152" y="80" width="4" height="8" />
        <rect x="156" y="96" width="8" height="6" />
        <rect x="140" y="104" width="10" height="8" />
      </g>
      <rect x="64" y="88" width="10" height="10" fill="#eeeae0" />
      <g fill="#eeeae0" opacity="0.9">
        <rect x="74" y="92" width="26" height="2" />
        <rect x="98" y="92" width="2" height="4" />
        <rect x="100" y="96" width="40" height="2" />
      </g>
      <rect x="149" y="92" width="3" height="3" fill="#26333b" />
      <rect x="162" y="96" width="3" height="3" fill="#26333b" />
      <g fill="#465059">
        <rect x="104" y="112" width="5" height="12" />
        <rect x="116" y="112" width="5" height="8" />
        <rect x="128" y="112" width="5" height="12" />
        <rect x="138" y="112" width="5" height="8" />
      </g>

      {/* mushrooms — teal caps with tone-on-tone spots, bone stems */}
      <rect x="190" y="112" width="6" height="12" fill="#b6ac95" />
      <rect x="182" y="102" width="22" height="10" fill="#3f9c7c" />
      <rect x="186" y="98" width="14" height="4" fill="#3f9c7c" />
      <rect x="188" y="104" width="3" height="3" fill="#1f5e4c" />
      <rect x="196" y="100" width="3" height="3" fill="#1f5e4c" />
      <rect x="210" y="116" width="4" height="8" fill="#b6ac95" />
      <rect x="206" y="110" width="12" height="6" fill="#1f5e4c" />

      {/* falling leaves */}
      <rect x="176" y="62" width="4" height="4" fill="#3f9c7c" />
      <rect x="92" y="54" width="4" height="4" fill="#1f5e4c" />
    </svg>
  );
}

/* ── 4 · Explosion — ember spot ink, "three-frame filmstrip", R007
   refinement (chat-model salvage): the paper strip mass becomes bone with a
   single paper top-edge hairline; the heat story carries the whitish — one
   white-hot burst core, an ember rim drawn on the smoke, no white squares. ── */
function BlastCenterMark() {
  const holes = Array.from({ length: 16 }, (_, i) => 26 + i * 13.5);
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-blast-bed" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-blast-glow" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ffb347" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="80" rx="112" ry="58" fill="url(#gem-blast-bed)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="130" cy="80" rx="46" ry="34" fill="url(#gem-blast-glow)" opacity={0.12} />

      {/* strip — bone body, paper top edge */}
      <rect x="20" y="42" width="220" height="76" rx="3" fill="#b6ac95" />
      <line x1="23" y1="43.5" x2="237" y2="43.5" stroke="#eeeae0" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      {holes.map((x, i) => (
        <g key={`h${i}`}>
          <rect x={x} y="46" width="6" height="5" rx="1" fill="#0b1317" />
          <rect x={x} y="109" width="6" height="5" rx="1" fill="#0b1317" />
        </g>
      ))}
      <rect x="32" y="55" width="60" height="50" fill="#26333b" />
      <rect x="100" y="55" width="60" height="50" fill="#26333b" />
      <rect x="168" y="55" width="60" height="50" fill="#26333b" />
      <path d="M93 76 L99 80 L93 84 Z" fill="#465059" />
      <path d="M161 76 L167 80 L161 84 Z" fill="#465059" />

      {/* frame 1: spark */}
      <g fill="#d99a55">
        <rect x="54" y="62" width="4" height="9" rx="1" />
        <rect x="54" y="89" width="4" height="9" rx="1" />
        <rect x="38" y="78" width="9" height="4" rx="1" />
        <rect x="65" y="78" width="9" height="4" rx="1" />
      </g>
      <circle cx="56" cy="80" r="5" fill="#ffb347" />

      {/* frame 2: burst — the one white-hot core */}
      <polygon
        points="130,58 133.8,70.8 145.6,64.4 139.2,76.2 152,80 139.2,83.8 145.6,95.6 133.8,89.2 130,102 126.2,89.2 114.4,95.6 120.8,83.8 108,80 120.8,76.2 114.4,64.4 126.2,70.8"
        fill="#b8652f"
      />
      <circle cx="130" cy="80" r="11" fill="#d99a55" />
      <circle cx="130" cy="80" r="5" fill="#ffe9c8" />

      {/* frame 3: smoke, with an ember rim on the top puff */}
      <circle cx="190" cy="86" r="11" fill="#4a2a1a" />
      <circle cx="205" cy="84" r="12" fill="#4a2a1a" />
      <circle cx="197" cy="73" r="10" fill="#5a3520" />
      <path d="M188 69 A10 10 0 0 1 206 69" fill="none" stroke="#d99a55" strokeWidth="1.25" strokeLinecap="round" opacity="0.55" />
      <rect x="182" y="64" width="4" height="4" fill="#d99a55" />
      <rect x="213" y="66" width="3" height="3" fill="#b8652f" />
      <rect x="209" y="97" width="3" height="3" fill="#d99a55" />
    </svg>
  );
}

/* ── 5 · Planck to Now — violet spot ink, "galaxies ignite", R007
   refinement (chat-model salvage): the near-white arms become dim violet
   with an engraved pale spine, stars become plus-ticks, the slider knob
   takes the identity violet, and one paper pip is the single whitish
   accent. ── */
function SpiralCenterMark() {
  const stars: [number, number, number][] = [
    [59.5, 35.5, 2.5],
    [208, 32, 3.5],
    [73.5, 97.5, 2.5],
    [197.5, 99.5, 2.5],
    [45, 65, 2],
    [221.5, 67.5, 2.5],
  ];
  const ticks = [70, 100, 130, 160, 190];
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-planck-bed" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-planck-glow" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#a98cff" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="64" rx="98" ry="50" fill="url(#gem-planck-bed)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="130" cy="66" rx="50" ry="30" fill="url(#gem-planck-glow)" opacity={0.12} />

      <g transform="rotate(-18 130 66)">
        <circle cx="130" cy="66" r="15" fill="#4b3a8c" />
        <g fill="none" strokeLinecap="round">
          <g stroke="#8a79b8" strokeWidth="8">
            <path d="M130 66 C118 50 150 40 168 54 C180 64 172 80 158 82" />
            <path d="M130 66 C142 82 110 92 92 78 C80 68 88 52 102 50" />
          </g>
          <g stroke="#cfc4f2" strokeWidth="1.5" opacity="0.8">
            <path d="M130 66 C118 50 150 40 168 54 C180 64 172 80 158 82" />
            <path d="M130 66 C142 82 110 92 92 78 C80 68 88 52 102 50" />
          </g>
        </g>
        <circle cx="130" cy="66" r="8" fill="#cfc4f2" />
      </g>

      {/* stars as drawn ticks, not squares */}
      <g stroke="#8a79b8" strokeWidth="1.25" strokeLinecap="round" opacity="0.8">
        {stars.map(([x, y, s], i) => (
          <g key={`s${i}`}>
            <line x1={x - s} y1={y} x2={x + s} y2={y} />
            <line x1={x} y1={y - s} x2={x} y2={y + s} />
          </g>
        ))}
      </g>

      <rect x="40" y="128" width="180" height="4" rx="2" fill="#2a2340" />
      {ticks.map((x) => (
        <rect key={`t${x}`} x={x} y="119" width="2" height="5" fill="#4b3a8c" />
      ))}
      <rect x="40" y="128" width="90" height="4" rx="2" fill="#8a79b8" />
      <circle cx="130" cy="130" r="7" fill="#a98cff" stroke="#0b1317" strokeWidth="3" />
      <circle cx="130" cy="130" r="2" fill="#eeeae0" />
    </svg>
  );
}

/* ── 6 · Practice Map — sky spot ink, the archive as an occupancy matrix:
   a pigeonhole wall of tier rows × month columns — newer tiers nearly full
   (halftone hatch), the legacy tier cold and sparse, a dashed blue fill-front
   marking where intake is happening, the next open cell circled in sky.
   Salvaged from the R003 schematic-plate set (plate 10), re-framed 600×400 →
   260×160, plate text translated to geometry for card legibility. ── */
function MatrixCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-matrix-dense" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#7d7669" />
        </pattern>
        <pattern id="gem-matrix-sparse" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-matrix-halo" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#5cc8ff" />
        </pattern>
      </defs>

      {/* sparse printed backdrop (may exceed safe area) */}
      <ellipse cx="130" cy="82" rx="104" ry="64" fill="url(#gem-matrix-sparse)" opacity="0.09" />
      {/* halo — pulse binds to class */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="124" cy="86" rx="62" ry="44" fill="url(#gem-matrix-halo)" opacity="0.12" />

      {/* WALL W-2 — 4 tier rows × 7 month columns */}
      <rect x="34" y="38" width="180" height="100" fill="none" stroke="#b6ac95" strokeWidth="2.5" opacity="0.9" />
      <path d="M58 38V138M82 38V138M106 38V138M130 38V138M154 38V138M178 38V138" fill="none" stroke="#7d7669" strokeWidth="0.8" opacity="0.28" />
      <path d="M34 64H214M34 90H214M34 116H214" fill="none" stroke="#7d7669" strokeWidth="0.8" opacity="0.28" />

      {/* T-I row — hottest, one cell still open at the front */}
      <g fill="url(#gem-matrix-dense)" stroke="#465059" strokeWidth="1">
        <rect x="36" y="40" width="20" height="22" /><rect x="60" y="40" width="20" height="22" /><rect x="84" y="40" width="20" height="22" /><rect x="108" y="40" width="20" height="22" /><rect x="132" y="40" width="20" height="22" /><rect x="156" y="40" width="20" height="22" />
      </g>
      {/* T-II row — filling */}
      <g fill="url(#gem-matrix-dense)" stroke="#465059" strokeWidth="1">
        <rect x="36" y="66" width="20" height="22" /><rect x="60" y="66" width="20" height="22" /><rect x="84" y="66" width="20" height="22" /><rect x="108" y="66" width="20" height="22" /><rect x="132" y="66" width="20" height="22" />
      </g>
      {/* T-III row — open stack */}
      <g fill="url(#gem-matrix-dense)" stroke="#465059" strokeWidth="1">
        <rect x="36" y="92" width="20" height="22" /><rect x="60" y="92" width="20" height="22" /><rect x="84" y="92" width="20" height="22" />
      </g>
      {/* T-IV row — legacy cold: one transferred tray, dashed holding bay */}
      <rect x="36" y="118" width="20" height="22" fill="#26333b" stroke="#7d7669" strokeWidth="1" />
      <rect x="132" y="118" width="42" height="22" fill="none" stroke="#7d7669" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />

      {/* FILL FRONT — dashed, the intake edge of the wall */}
      <path d="M182 40V132" fill="none" stroke="#5cc8ff" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.85" />
      <path d="M182 40L178 46M182 40L186 46" fill="none" stroke="#5cc8ff" strokeWidth="1.2" opacity="0.85" />

      {/* NEXT OPEN CELL — T-I, just past the front */}
      <rect x="180" y="40" width="20" height="22" fill="none" stroke="#7d7669" strokeWidth="1" />
      <circle cx="190" cy="51" r="6.5" fill="none" stroke="#5cc8ff" strokeWidth="1" opacity="0.6" />
      <circle cx="190" cy="51" r="3.5" fill="#5cc8ff" />
      {/* second open cell — T-II, waiting */}
      <circle cx="162" cy="77" r="5" fill="none" stroke="#5cc8ff" strokeWidth="1" opacity="0.45" />

      {/* MONTH AXIS — ticks, no numerals */}
      <path d="M40 142V146M64 142V146M88 142V146M112 142V146M136 142V146M160 142V146M184 142V146M208 142V146" fill="none" stroke="#7d7669" strokeWidth="1" opacity="0.5" />
      <path d="M38 150H214" fill="none" stroke="#b6ac95" strokeWidth="1" opacity="0.35" />

      {/* TIER INDEX — side ticks, one per row */}
      <path d="M28 44V58M26 70V84M24 96V110M22 122V136" fill="none" stroke="#465059" strokeWidth="1.5" opacity="0.8" />

      {/* TITLE-BLOCK TAB — blank stamp outline, bottom-right */}
      <rect x="222" y="128" width="28" height="14" fill="none" stroke="#7d7669" strokeWidth="0.8" opacity="0.6" />
      <path d="M222 134H250" fill="none" stroke="#7d7669" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

/* Retired incumbent (name-round comparison only): terraced climb to a lit summit ── */
function TrailCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-trail-dense" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#5cc8ff" />
        </pattern>
        <pattern id="gem-trail-sparse" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-trail-halo" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#5cc8ff" />
        </pattern>
        <clipPath id="gem-trail-summit">
          <circle cx="148" cy="84" r="8" />
        </clipPath>
      </defs>

      {/* sparse printed backdrop (may exceed safe area) */}
      <ellipse cx="130" cy="82" rx="104" ry="64" fill="url(#gem-trail-sparse)" opacity="0.09" />
      {/* halo — pulse binds to class */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="148" cy="84" rx="60" ry="42" fill="url(#gem-trail-halo)" opacity="0.12" />

      {/* FOUR nested contour loops (wobbled ellipses = terrain) */}
      <path d="M 220 78 C 224 108 186 140 148 140 C 110 142 78 112 76 84 C 74 56 112 30 150 28 C 188 26 218 50 220 78 Z" fill="none" stroke="#b6ac95" strokeWidth="1" opacity="0.3" />
      <path d="M 204 76 C 208 102 178 132 148 132 C 118 134 92 108 92 84 C 90 60 120 38 148 36 C 176 34 202 52 204 76 Z" fill="none" stroke="#7d7669" strokeWidth="1" opacity="0.4" />
      <path d="M 188 80 C 192 100 170 118 148 118 C 126 120 108 102 108 84 C 106 66 128 50 148 50 C 168 48 186 62 188 80 Z" fill="none" stroke="#7d7669" strokeWidth="1.2" opacity="0.55" />
      <path d="M 170 82 C 172 94 158 104 148 104 C 138 106 126 94 126 84 C 124 74 138 64 148 64 C 158 62 168 72 170 82 Z" fill="none" stroke="#465059" strokeWidth="1.5" opacity="0.7" />

      {/* CLIMBED BAND — partial lower arc overprint (halftone) */}
      <path d="M 188 80 C 192 100 170 118 148 118 C 126 120 108 102 108 84" fill="none" stroke="url(#gem-trail-dense)" strokeWidth="14" strokeLinecap="round" opacity="0.45" />

      {/* TRAIL from base camp up to summit base */}
      <path d="M 46 126 C 70 122 84 108 96 104 C 116 96 122 100 140 92" fill="none" stroke="#b6ac95" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 7" opacity="0.9" />
      <path d="M 68 117 L 73 112 L 76 116" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 114 100 L 119 95 L 122 99" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* BASE CAMP */}
      <line x1="38" y1="129" x2="56" y2="129" stroke="#7d7669" strokeWidth="1" opacity="0.7" />
      <path d="M 40 128 L 43.5 122 L 47 128 Z" fill="#465059" />
      <path d="M 47 128 L 50.5 122 L 54 128 Z" fill="#26333b" />

      {/* YOU ARE HERE pulse on the trail */}
      <circle cx="96" cy="104" r="6.5" fill="none" stroke="#5cc8ff" strokeWidth="1" opacity="0.5" />
      <circle cx="96" cy="104" r="3.5" fill="#5cc8ff" />

      {/* COMPASS ROSE (top-left) */}
      <g stroke="#7d7669" opacity="0.5">
        <line x1="34" y1="36" x2="34" y2="28" strokeWidth="1.2" />
        <line x1="34" y1="36" x2="34" y2="42" strokeWidth="1" />
        <line x1="34" y1="36" x2="40" y2="36" strokeWidth="1" />
        <line x1="34" y1="36" x2="28" y2="36" strokeWidth="1" />
        <line x1="30" y1="32" x2="38" y2="40" strokeWidth="0.75" />
        <line x1="38" y1="32" x2="30" y2="40" strokeWidth="0.75" />
      </g>

      {/* FLAG on the summit */}
      <line x1="148" y1="76" x2="148" y2="65" stroke="#b6ac95" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="148,64 161,68 148,72" fill="#5cc8ff" />

      {/* SUMMIT + HERE — dominant stepped-cap beacon */}
      <g clipPath="url(#gem-trail-summit)">
        <circle cx="148" cy="84" r="8" fill="#26333b" />
        <circle cx="148" cy="84" r="6" fill="#465059" />
        <circle cx="148" cy="84" r="4" fill="#7d7669" />
        <circle cx="147" cy="83" r="4.5" fill="#5cc8ff" />
        <circle cx="146.5" cy="82.5" r="1.5" fill="#d6f2ff" />
        <circle cx="145" cy="81" r="1" fill="#ffffff" />
      </g>
    </svg>
  );
}

/* ── 8 · Quicknotes — the prompt lens: a paper magnifier with a stepped
   bone edge, the command palette's chevron + underscore in the blue accent
   on the glass, seated in the house spot-ink language: sparse printed bed,
   hover halo, white glints. Base geometry from relay candidate 23 (S5
   round 6), refined in R003 for house consistency — register references:
   the archive wall mark first, spine second (F004 superseded the nib pick). ── */
function QuicknotesCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="qn-sparse" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="qn-halo" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#7aa2f7" />
        </pattern>
      </defs>

      {/* sparse printed bed */}
      <ellipse cx="124" cy="80" rx="104" ry="58" fill="url(#qn-sparse)" opacity="0.09" />
      {/* halo — pulse binds to class */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="112" cy="72" rx="54" ry="42" fill="url(#qn-halo)" opacity={0.12} />

      {/* lens — single bone-weight stroke, one step lighter (spine-square tone +10%) */}
      <circle cx="112" cy="72" r="44" fill="none" stroke="#c0b6a1" strokeWidth="14" />
      {/* handle */}
      <line x1="144" y1="104" x2="188" y2="142" stroke="#c0b6a1" strokeWidth="20" strokeLinecap="round" />
      {/* halftone overprint arc — texture on the ring's upper-left band */}
      <path d="M68 72 A44 44 0 0 1 112 28" fill="none" stroke="url(#qn-halo)" strokeWidth="14" strokeLinecap="round" opacity="0.4" />

      {/* prompt glyphs — the blue accent, on the glass */}
      <path d="M92 55 L112 72 L92 89" fill="none" stroke="#7aa2f7" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="120" y1="90" x2="136" y2="90" stroke="#7aa2f7" strokeWidth="10" strokeLinecap="round" />

      {/* white square glints — on the overprint arc + glass reflection */}
      <rect x="84" y="40" width="2.6" height="2.6" fill="#ffffff" opacity="0.55" />
      <rect x="128" y="58" width="2.6" height="2.6" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

/* ── 7 · Spine — "Snap", seated in the house spot-ink language: sparse printed
   bed, hover halo. The corner bracket holds an EMPTY exact seat, marked only
   by two corner brackets — no square in it yet — while the bone element is
   still mid-drag under the rust cursor. Relay arm A concept 4, gesture
   geometry verbatim. ── */
function SpineCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-spine-sparse" patternUnits="userSpaceOnUse" width="11" height="11"><circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" /></pattern>
        <pattern id="gem-spine-halo" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#c56b52" /></pattern>
      </defs>

      <ellipse cx="130" cy="82" rx="104" ry="64" fill="url(#gem-spine-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" cx="150" cy="76" rx="54" ry="40" fill="url(#gem-spine-halo)" style={haloVar(0.12)} opacity={0.12} />

      {/* the exact seat — empty, corner-marked only */}
      <path d="M58 98 H64 V92" fill="none" stroke="#7d7669" strokeWidth="2.5" strokeLinecap="square" />
      <path d="M98 92 V98 H104" fill="none" stroke="#7d7669" strokeWidth="2.5" strokeLinecap="square" />

      {/* the waiting corner bracket */}
      <path d="M36 56 V140 H128" fill="none" stroke="#465059" strokeWidth="16" strokeLinecap="square" strokeLinejoin="miter" />

      {/* the tilted element mid-drag, not yet seated */}
      <rect x="-32" y="-32" width="64" height="64" transform="translate(168 62) rotate(12)" fill="none" stroke="#b6ac95" strokeWidth="14" strokeLinejoin="miter" />
      <polygon points="0,0 0,44 12,34 20,54 29,50 21,31 36,31" transform="translate(170 60)" fill="#c56b52" />
    </svg>
  );
}
