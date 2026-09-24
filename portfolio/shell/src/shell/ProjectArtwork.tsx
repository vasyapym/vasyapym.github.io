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

/* ── 1 · Raft Cluster — coral spot ink, "heartbeat ring": a solid leader
   broadcasts heartbeats (dots along the spokes) to four followers, each
   wearing a partial ring with its election timer draining. Adopted from the
   card-art rethink round (candidate a, batch 1) — owner pick, R004; R005
   re-grade: neutral printed bed, slate spokes, hue kept for the leader disc
   and dim rust timer arcs. Ids keep the gem-raft-* prefix. ── */
function RaftCenterMark() {
  const leader = { x: 130, y: 34 };
  const followers = [
    { x: 196.6, y: 68.5, timer: 62 },
    { x: 171.2, y: 124.5, timer: 30 },
    { x: 88.8, y: 124.5, timer: 80 },
    { x: 63.4, y: 68.5, timer: 46 },
  ];
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft-bed" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft-glow" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="82" rx="104" ry="62" fill="url(#gem-raft-bed)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="130" cy="82" rx="62" ry="38" fill="url(#gem-raft-glow)" opacity={0.12} />
      {followers.map((f, i) => (
        <line
          key={`l${i}`}
          x1={leader.x}
          y1={leader.y}
          x2={f.x}
          y2={f.y}
          stroke="#465059"
          strokeWidth="2.5"
        />
      ))}
      {followers.map((f, i) => (
        <circle
          key={`m${i}`}
          cx={leader.x + (f.x - leader.x) * 0.55}
          cy={leader.y + (f.y - leader.y) * 0.55}
          r="3.5"
          fill="#b6ac95"
        />
      ))}
      <circle cx={leader.x} cy={leader.y} r="21" fill="none" stroke="#465059" strokeWidth="2" />
      <circle cx={leader.x} cy={leader.y} r="15" fill="#ff6a5f" />
      {followers.map((f, i) => (
        <g key={`f${i}`}>
          <circle cx={f.x} cy={f.y} r="12" fill="#26333b" />
          <circle
            cx={f.x}
            cy={f.y}
            r="16"
            fill="none"
            stroke="#9c453f"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${f.timer} 101`}
            transform={`rotate(-90 ${f.x} ${f.y})`}
          />
        </g>
      ))}
      <rect x="134" y="27" width="3" height="3" fill="#ffffff" />
      <rect x="199" y="64" width="2" height="2" fill="#ffffff" />
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

/* ── 3 · Evening Forest — teal spot ink, "lone pine walk": a pixel wanderer
   with a lantern beside one pine on a winding path — the deliberate 8-bit nod
   the card copy promises. Adopted from the card-art rethink round (candidate
   d, batch 2) — owner pick, R004; R005 re-grade: neutral printed bed, pine
   tones dimmed, lantern light whitish. ── */
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
      <ellipse cx="136" cy="88" rx="104" ry="62" fill="url(#gem-fox-bed)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="160" cy="104" rx="50" ry="30" fill="url(#gem-fox-glow)" opacity={0.12} />

      {/* lone pine */}
      <g fill="#3f9c7c">
        <rect x="66" y="28" width="8" height="8" />
        <rect x="58" y="36" width="24" height="8" />
        <rect x="50" y="44" width="40" height="8" />
        <rect x="54" y="56" width="32" height="8" />
        <rect x="46" y="64" width="48" height="8" />
        <rect x="38" y="72" width="64" height="8" />
        <rect x="46" y="84" width="48" height="8" />
        <rect x="38" y="92" width="64" height="8" />
        <rect x="30" y="100" width="80" height="8" />
      </g>
      <g fill="#1f5e4c">
        <rect x="50" y="48" width="12" height="4" />
        <rect x="42" y="76" width="16" height="4" />
        <rect x="34" y="104" width="20" height="4" />
      </g>
      <rect x="64" y="108" width="12" height="22" fill="#1f5e4c" />

      {/* small far pine */}
      <g fill="#1f5e4c">
        <rect x="206" y="68" width="8" height="8" />
        <rect x="200" y="76" width="20" height="8" />
        <rect x="194" y="84" width="32" height="8" />
        <rect x="206" y="92" width="8" height="10" />
      </g>

      {/* path */}
      <g fill="#1f5e4c">
        <rect x="20" y="128" width="96" height="4" />
        <rect x="108" y="128" width="64" height="6" />
        <rect x="126" y="134" width="72" height="6" />
        <rect x="152" y="140" width="84" height="6" />
      </g>

      {/* walker */}
      <rect x="150" y="94" width="8" height="8" fill="#e9f1ec" />
      <rect x="148" y="90" width="12" height="4" fill="#3f9c7c" />
      <rect x="148" y="102" width="12" height="16" fill="#3f9c7c" />
      <rect x="146" y="118" width="4" height="10" fill="#3f9c7c" />
      <rect x="158" y="118" width="4" height="10" fill="#3f9c7c" />
      <rect x="160" y="106" width="6" height="4" fill="#3f9c7c" />
      <rect x="165" y="110" width="8" height="10" fill="#e9f1ec" />
      <rect x="167" y="108" width="4" height="2" fill="#3f9c7c" />

      <rect x="167" y="113" width="3" height="3" fill="#fff" />
      <rect x="190" y="58" width="3" height="3" fill="#fff" />
      <rect x="110" y="64" width="3" height="3" fill="#fff" />
    </svg>
  );
}

/* ── 4 · Explosion — ember spot ink, "ground dome": a side-view blast dome
   (deep ember → ember → bright core) with debris lobbing out on dotted arcs.
   Adopted from the card-art rethink round (candidate f, batch 2) — owner
   pick, R004; R005 re-grade: neutral bed, bone debris arcs, ember dome
   stepped down, whitish core as the brightest mass. ── */
function BlastCenterMark() {
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
      <ellipse cx="130" cy="96" rx="108" ry="58" fill="url(#gem-blast-bed)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="130" cy="104" rx="66" ry="36" fill="url(#gem-blast-glow)" opacity={0.12} />

      <g fill="none" stroke="#b6ac95" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 7">
        <path d="M152 96 Q192 30 222 112" />
        <path d="M108 96 Q68 24 40 112" />
      </g>
      <rect x="217" y="112" width="9" height="9" fill="#d99a55" transform="rotate(20 221.5 116.5)" />
      <rect x="35" y="112" width="8" height="8" fill="#5a3520" transform="rotate(-25 39 116)" />

      <path d="M74 128 A56 52 0 0 1 186 128 Z" fill="#6b3a22" />
      <path d="M88 128 A42 40 0 0 1 172 128 Z" fill="#a8552c" />
      <path d="M104 128 A26 26 0 0 1 156 128 Z" fill="#d99a55" />
      <path d="M118 128 A12 13 0 0 1 142 128 Z" fill="#ffe9c8" />

      <g fill="#5a3520">
        <circle cx="68" cy="124" r="8" />
        <circle cx="192" cy="124" r="8" />
        <circle cx="56" cy="126" r="5" />
        <circle cx="204" cy="126" r="5" />
      </g>
      <rect x="24" y="128" width="212" height="5" fill="#4a2a1a" />

      <rect x="124" y="118" width="3" height="3" fill="#fff" />
      <rect x="160" y="96" width="2" height="2" fill="#fff" />
    </svg>
  );
}

/* ── 5 · Planck to Now — violet spot ink, "worlds form": the scrub knob
   parked near the end of the timeline under a lit ringed planet and its
   moon. Adopted from the card-art rethink round (candidate c, batch 1) —
   owner pick, R004; R005 re-grade: neutral bed, dim violet planet +
   muted timeline, pale ring + paper moon as the brightest masses. ── */
function SpiralCenterMark() {
  const stars: [number, number, number][] = [
    [56, 36, 3],
    [214, 90, 3],
    [70, 98, 4],
    [44, 70, 2],
    [226, 56, 3],
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
        <clipPath id="gem-planck-planet">
          <circle cx="130" cy="64" r="24" />
        </clipPath>
      </defs>
      <ellipse cx="130" cy="64" rx="98" ry="50" fill="url(#gem-planck-bed)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="130" cy="64" rx="52" ry="32" fill="url(#gem-planck-glow)" opacity={0.12} />
      <g transform="rotate(-14 130 64)">
        <ellipse cx="130" cy="64" rx="46" ry="11" fill="none" stroke="#e4dbff" strokeWidth="4" />
        <circle cx="130" cy="64" r="24" fill="#3f2f7a" />
        <circle cx="122" cy="57" r="24" fill="#6f5cb0" clipPath="url(#gem-planck-planet)" />
        <path d="M84 64 A46 11 0 0 0 176 64" fill="none" stroke="#e4dbff" strokeWidth="4" />
      </g>
      <circle cx="194" cy="38" r="5" fill="#eeeae0" />
      {stars.map(([x, y, s], i) => (
        <rect key={`s${i}`} x={x} y={y} width={s} height={s} fill="#8a79b8" />
      ))}
      <rect x="40" y="128" width="180" height="4" rx="2" fill="#2a2340" />
      {ticks.map((x) => (
        <rect key={`t${x}`} x={x} y="119" width="2" height="5" fill="#4b3a8c" />
      ))}
      <rect x="40" y="128" width="156" height="4" rx="2" fill="#8a79b8" />
      <circle cx="196" cy="130" r="7" fill="#8a79b8" stroke="#0b1317" strokeWidth="3" />
      <circle cx="196" cy="130" r="2.5" fill="#eeeae0" />
      <rect x="116" y="50" width="3" height="3" fill="#ffffff" />
      <rect x="57" y="37" width="2" height="2" fill="#ffffff" />
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
